/**
 * Membership dues + business directory backend.
 *
 * Data model (Firestore):
 *   members/{uid}              profile (member-editable) + dues state (functions only):
 *                              paidThrough, autopay, subscriptionId, subscriptionStatus, stripeCustomerId
 *   members/{uid}/payments/*   payment history, keyed by Stripe object id (also makes webhooks idempotent)
 *   businesses/{uid}           one listing per member; status: pending | approved | rejected
 *   directory/{uid}            PUBLIC copy of a listing; exists only while approved AND dues are current
 *   settings/dues              { amountCents, interval: 'month' | 'week' } — edited in admin-businesses.html
 *   settings/spotlight         { businessIds: [] } — edited in admin-businesses.html
 *   donations/{stripeId}       one record per gift (one-time payment or monthly charge), admin-only
 *   donationSubscriptions/{id} monthly donors and whether their gift is still active, admin-only
 *   settings/donations         { portalLoginUrl } — Stripe's donor login link, edited in admin-donations.html
 *   stripePayments/{pi}        private lookup: Stripe PaymentIntent id -> the dues/donation record it paid for,
 *                              so refunds and disputes can find their record (no client access)
 *   stripeEarlyEvents/{pi}     a refund/dispute that arrived before its payment was recorded (Stripe doesn't
 *                              guarantee event order); applied as soon as the payment is recorded
 *   outbox/{id}                every email the site sends (or logs), admin-readable; see email.js
 *   members/{uid}.remindersSent  which dues reminders a member already got, so none repeats
 *   removedMembers/{uid}       a short record of members removed by an admin (who, when, by whom)
 */

const { setGlobalOptions } = require('firebase-functions/v2');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret, defineString } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');
const Stripe = require('stripe');
const { createMailer, duesReminder, listingSubmitted, listingReviewed, memberInvite, welcomeMember } = require('./email');
const crypto = require('crypto');
const { reminderFor, DAY_MS } = require('./reminders');

// Firestore lives in us-east4; triggers must run in the same region.
setGlobalOptions({ region: 'us-east4', maxInstances: 10 });

initializeApp();
const db = getFirestore();

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
// Email: SMTP_URL = "log" (record only) or an smtps:// URL from the email provider. See email.js.
const SMTP_URL = defineSecret('SMTP_URL');
const MAIL_FROM = defineString('MAIL_FROM', { default: '"A Rai of Sunshine of North Florida" <araiofsunshineofnorthflorida@gmail.com>' });
const mailer = createMailer({ db, FieldValue, smtpSecret: SMTP_URL, mailFrom: MAIL_FROM });

const DEFAULT_DUES = { amountCents: 2500, interval: 'month' };
const MAX_PREPAY_PERIODS = 12;
// Listings stay up a few days past paidThrough so a renewal that settles a little late doesn't flicker them off.
const GRACE_MS = 3 * 24 * 60 * 60 * 1000;
// Stripe Checkout requires a trial_end at least 48 hours out.
const MIN_TRIAL_MS = 49 * 60 * 60 * 1000;

// Checkout may only send people back to the site itself (including Firebase preview channels and local dev).
const ALLOWED_ORIGINS = [
  /^https:\/\/(www\.)?araiofsunshine\.org$/,
  /^https:\/\/araiofsunshine(--[a-z0-9-]+)?\.web\.app$/,
  /^https:\/\/araiofsunshine\.firebaseapp\.com$/,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
];

const ACTIVE_SUB_STATUSES = ['active', 'trialing', 'past_due'];

// Checkout branding, matching the website (styles.css). Stripe fetches the logo from the live site, so it must stay
// publicly reachable. The billing portal and receipts use Stripe Dashboard > Settings > Branding instead.
const SITE_LOGO_URL = 'https://araiofsunshine.org/cropped-logo.png';
const CHECKOUT_BRANDING = {
  display_name: 'A Rai of Sunshine of North Florida',
  background_color: '#FFF9E6', // --soft-cream
  button_color: '#FF8C42', // --warm-orange
  border_style: 'rounded',
  font_family: 'open_sans',
  // Icon only: with a logo set, Stripe replaces the name with a tiny wide logo that's hard to read.
  icon: { type: 'url', url: SITE_LOGO_URL },
};
const DUES_DESCRIPTION = 'Supports families and individuals with disabilities in Jefferson County and North Florida.';

// Donations: a minimum keeps the public form from being useful for testing stolen cards.
const DONATION_MIN_CENTS = 500;
const DONATION_MAX_CENTS = 1000000;
const TAX_NOTE = 'A Rai of Sunshine of North Florida Inc. is a 501(c)(3) nonprofit. Your gift is tax-deductible to the extent allowed by law.';

function stripeClient() {
  return new Stripe(STRIPE_SECRET_KEY.value());
}

function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in first.');
  return request.auth;
}

function returnBase(returnUrl) {
  let url;
  try {
    url = new URL(returnUrl);
  } catch {
    throw new HttpsError('invalid-argument', 'Invalid return URL.');
  }
  if (!ALLOWED_ORIGINS.some((re) => re.test(url.origin))) {
    throw new HttpsError('invalid-argument', 'Return URL is not allowed.');
  }
  return url.origin + url.pathname;
}

async function getDuesSettings() {
  const snap = await db.doc('settings/dues').get();
  const data = snap.exists ? snap.data() : {};
  const amountCents = Number.isInteger(data.amountCents) && data.amountCents >= 100 ? data.amountCents : DEFAULT_DUES.amountCents;
  const interval = data.interval === 'week' || data.interval === 'month' ? data.interval : DEFAULT_DUES.interval;
  return { amountCents, interval };
}

function addPeriods(date, interval, count) {
  const d = new Date(date.getTime());
  if (interval === 'week') {
    d.setUTCDate(d.getUTCDate() + 7 * count);
  } else {
    d.setUTCMonth(d.getUTCMonth() + count);
  }
  return d;
}

function toDate(ts) {
  return ts && typeof ts.toDate === 'function' ? ts.toDate() : null;
}

async function getOrCreateCustomer(stripe, uid, auth) {
  const memberRef = db.doc(`members/${uid}`);
  const member = (await memberRef.get()).data() || {};
  if (member.stripeCustomerId) return { customerId: member.stripeCustomerId, member };

  const customer = await stripe.customers.create({
    email: auth.token.email,
    name: member.name || undefined,
    metadata: { firebaseUID: uid },
  });
  await memberRef.set({ stripeCustomerId: customer.id }, { merge: true });
  return { customerId: customer.id, member };
}

async function uidForCustomer(stripe, customerId) {
  const q = await db.collection('members').where('stripeCustomerId', '==', customerId).limit(1).get();
  if (!q.empty) return q.docs[0].id;
  const customer = await stripe.customers.retrieve(customerId);
  return customer && !customer.deleted ? customer.metadata.firebaseUID || null : null;
}

/**
 * Starts a Stripe Checkout session.
 *   { type: 'autopay', returnUrl }            -> recurring subscription
 *   { type: 'prepay', periods: 1-12, returnUrl } -> one-time payment covering N periods
 */
exports.createDuesCheckout = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (request) => {
  const auth = requireAuth(request);
  const uid = auth.uid;
  const { type, periods, returnUrl } = request.data || {};
  const base = returnBase(returnUrl);
  const stripe = stripeClient();
  const dues = await getDuesSettings();
  const { customerId, member } = await getOrCreateCustomer(stripe, uid, auth);
  const paidThrough = toDate(member.paidThrough);
  const label = dues.interval === 'week' ? 'week' : 'month';

  const common = {
    customer: customerId,
    client_reference_id: uid,
    success_url: `${base}?checkout=success`,
    cancel_url: `${base}?checkout=cancelled`,
    branding_settings: CHECKOUT_BRANDING,
    custom_text: {
      submit: { message: 'Thank you for supporting A Rai of Sunshine! Your membership helps local families and caregivers.' },
    },
  };

  if (type === 'autopay') {
    if (member.autopay) throw new HttpsError('already-exists', 'Autopay is already on for your account.');

    const subscriptionData = { metadata: { uid } };
    // If they've already paid ahead, don't bill again until that prepaid time runs out.
    if (paidThrough && paidThrough.getTime() - Date.now() > MIN_TRIAL_MS) {
      subscriptionData.trial_end = Math.floor(paidThrough.getTime() / 1000);
    }

    const session = await stripe.checkout.sessions.create({
      ...common,
      mode: 'subscription',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: dues.amountCents,
          recurring: { interval: dues.interval },
          product_data: { name: `Membership dues (every ${label})`, description: DUES_DESCRIPTION, images: [SITE_LOGO_URL] },
        },
      }],
      subscription_data: subscriptionData,
      metadata: { uid, type: 'autopay' },
    });
    return { url: session.url };
  }

  if (type === 'prepay') {
    if (member.autopay) {
      throw new HttpsError('failed-precondition', 'Autopay is on. Turn it off before paying manually so you are not charged twice.');
    }
    const n = Number(periods);
    if (!Number.isInteger(n) || n < 1 || n > MAX_PREPAY_PERIODS) {
      throw new HttpsError('invalid-argument', `Choose between 1 and ${MAX_PREPAY_PERIODS} ${label}s.`);
    }
    const metadata = { uid, type: 'prepay', periods: String(n), interval: dues.interval };
    const session = await stripe.checkout.sessions.create({
      ...common,
      mode: 'payment',
      line_items: [{
        quantity: n,
        price_data: {
          currency: 'usd',
          unit_amount: dues.amountCents,
          product_data: { name: `Membership dues (1 ${label})`, description: DUES_DESCRIPTION, images: [SITE_LOGO_URL] },
        },
      }],
      payment_intent_data: { metadata },
      metadata,
    });
    return { url: session.url };
  }

  throw new HttpsError('invalid-argument', 'Unknown payment type.');
});

/** Opens the Stripe customer portal (update card, cancel autopay, see receipts). */
exports.createBillingPortal = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (request) => {
  const auth = requireAuth(request);
  const base = returnBase((request.data || {}).returnUrl);
  const member = (await db.doc(`members/${auth.uid}`).get()).data() || {};
  if (!member.stripeCustomerId) throw new HttpsError('failed-precondition', 'No billing account yet. Make a payment first.');

  const session = await stripeClient().billingPortal.sessions.create({
    customer: member.stripeCustomerId,
    return_url: base,
  });
  return { url: session.url };
});

/**
 * Starts a donation checkout. Public: donors don't need an account.
 *   { amountCents, frequency: 'once' | 'monthly', donorName?, note?, anonymous?, returnUrl }
 */
exports.createDonationCheckout = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (request) => {
  const { amountCents, frequency, donorName, note, anonymous, returnUrl } = request.data || {};
  const base = returnBase(returnUrl);
  if (!Number.isInteger(amountCents) || amountCents < DONATION_MIN_CENTS || amountCents > DONATION_MAX_CENTS) {
    throw new HttpsError('invalid-argument', `Please choose an amount between $${DONATION_MIN_CENTS / 100} and $${(DONATION_MAX_CENTS / 100).toLocaleString('en-US')}.`);
  }
  if (frequency !== 'once' && frequency !== 'monthly') throw new HttpsError('invalid-argument', 'Choose one-time or monthly.');

  const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  // Stripe metadata values must be strings.
  const metadata = {
    type: 'donation',
    frequency,
    donorName: clean(donorName, 100),
    note: clean(note, 200),
    anonymous: anonymous ? 'yes' : 'no',
  };
  const monthly = frequency === 'monthly';
  const stripe = stripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: monthly ? 'subscription' : 'payment',
    success_url: `${base}?donation=success#give`,
    cancel_url: `${base}?donation=cancelled#give`,
    branding_settings: CHECKOUT_BRANDING,
    custom_text: { submit: { message: TAX_NOTE } },
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: amountCents,
        ...(monthly ? { recurring: { interval: 'month' } } : {}),
        product_data: {
          name: monthly ? 'Monthly donation to A Rai of Sunshine' : 'Donation to A Rai of Sunshine',
          description: DUES_DESCRIPTION,
          images: [SITE_LOGO_URL],
        },
      },
    }],
    metadata,
    ...(monthly
      ? { subscription_data: { metadata, description: 'Monthly donation to A Rai of Sunshine' } }
      : {
          submit_type: 'donate',
          customer_creation: 'always',
          payment_intent_data: { metadata, description: 'Donation to A Rai of Sunshine' },
        }),
  });
  return { url: session.url };
});

/**
 * Records a payment and pushes paidThrough forward, exactly once per Stripe object id.
 * computeNewPaidThrough receives the current paidThrough (Date or null).
 */
async function recordPayment(uid, stripeObjectId, record, computeNewPaidThrough, paymentIntent = null) {
  const memberRef = db.doc(`members/${uid}`);
  const paymentRef = memberRef.collection('payments').doc(stripeObjectId);

  await db.runTransaction(async (tx) => {
    const [memberSnap, paymentSnap] = await Promise.all([tx.get(memberRef), tx.get(paymentRef)]);
    if (paymentSnap.exists) return; // webhook retry — already applied
    if (!memberSnap.exists) { // removed by an admin; don't re-create them
      logger.warn('Payment for a member who no longer exists', { uid, stripeObjectId });
      return;
    }

    const current = toDate((memberSnap.data() || {}).paidThrough);
    const next = computeNewPaidThrough(current);
    const paidThrough = current && current > next ? current : next;

    tx.set(memberRef, { paidThrough: Timestamp.fromDate(paidThrough) }, { merge: true });
    tx.set(paymentRef, {
      ...record,
      paymentIntent,
      paidThroughAfter: Timestamp.fromDate(paidThrough),
      createdAt: FieldValue.serverTimestamp(),
    });
    if (paymentIntent) {
      tx.set(db.doc(`stripePayments/${paymentIntent}`), {
        kind: 'dues', path: paymentRef.path, uid,
        periods: record.periods || 1, interval: record.interval || 'month',
      });
    }
  });
  if (paymentIntent) await applyEarlyEvents(paymentIntent);
}

/** The PaymentIntent behind an invoice, across Stripe API versions. */
async function paymentIntentForInvoice(stripe, invoice) {
  if (typeof invoice.payment_intent === 'string') return invoice.payment_intent; // older API versions
  try {
    const { data } = await stripe.invoicePayments.list({ invoice: invoice.id, limit: 1 });
    const pi = data[0]?.payment?.payment_intent;
    return typeof pi === 'string' ? pi : pi?.id || null;
  } catch (err) {
    logger.warn('Could not look up invoice payment', { invoice: invoice.id, error: err.message });
    return null;
  }
}

/** Saves one gift, once per Stripe object id (webhook retries are ignored). */
async function recordDonation(id, record, paymentIntent = null) {
  try {
    await db.doc(`donations/${id}`).create({ ...record, paymentIntent, createdAt: FieldValue.serverTimestamp() });
  } catch (err) {
    if (err.code !== 6) throw err; // 6 = ALREADY_EXISTS
    return;
  }
  if (paymentIntent) {
    await db.doc(`stripePayments/${paymentIntent}`).set({ kind: 'donation', path: `donations/${id}` });
    await applyEarlyEvents(paymentIntent);
  }
}

function donationFields(md, name, email) {
  return {
    donorName: md.donorName || name || '',
    email: email || '',
    note: md.note || '',
    anonymous: md.anonymous === 'yes',
  };
}

// One-time gifts finish in Checkout. Monthly gifts are recorded from invoice.paid instead.
async function handleDonationSession(session) {
  const md = session.metadata || {};
  if (md.type !== 'donation' || session.mode !== 'payment' || session.payment_status !== 'paid') return;
  await recordDonation(session.id, {
    frequency: 'once',
    amountCents: session.amount_total,
    ...donationFields(md, session.customer_details?.name, session.customer_details?.email),
    stripeCustomerId: session.customer || null,
    paidAt: Timestamp.fromMillis(session.created * 1000),
  }, typeof session.payment_intent === 'string' ? session.payment_intent : null);
}

/** Subscription metadata for an invoice, across Stripe API versions. */
async function invoiceSubscriptionMetadata(stripe, invoice) {
  const fromParent = invoice.parent?.subscription_details?.metadata || invoice.subscription_details?.metadata;
  if (fromParent && Object.keys(fromParent).length) return fromParent;
  const subId = invoice.parent?.subscription_details?.subscription || invoice.subscription;
  if (!subId) return {};
  const sub = await stripe.subscriptions.retrieve(typeof subId === 'string' ? subId : subId.id);
  return sub.metadata || {};
}

async function handleDonationInvoice(stripe, invoice, md) {
  if (!invoice.amount_paid) return; // nothing charged (e.g. a $0 invoice)
  const paymentIntent = await paymentIntentForInvoice(stripe, invoice);
  const subId = invoice.parent?.subscription_details?.subscription || invoice.subscription || null;
  await recordDonation(invoice.id, {
    frequency: 'monthly',
    amountCents: invoice.amount_paid,
    ...donationFields(md, invoice.customer_name, invoice.customer_email),
    stripeCustomerId: invoice.customer || null,
    subscriptionId: typeof subId === 'string' ? subId : subId?.id || null,
    paidAt: Timestamp.fromMillis((invoice.status_transitions?.paid_at || invoice.created) * 1000),
  }, paymentIntent);
}

async function handleDonationSubscription(stripe, sub) {
  const md = sub.metadata || {};
  const customer = await stripe.customers.retrieve(sub.customer);
  const item = sub.items?.data?.[0];
  const cancelling = !!sub.cancel_at_period_end || !!sub.cancel_at;
  await db.doc(`donationSubscriptions/${sub.id}`).set({
    status: sub.status,
    active: ACTIVE_SUB_STATUSES.includes(sub.status) && !cancelling,
    amountCents: (item?.price?.unit_amount || 0) * (item?.quantity || 1),
    ...donationFields(md, customer?.name, customer?.email),
    stripeCustomerId: sub.customer,
    startedAt: Timestamp.fromMillis(sub.created * 1000),
    canceledAt: sub.canceled_at ? Timestamp.fromMillis(sub.canceled_at * 1000) : null,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function handlePrepaySession(session) {
  const md = session.metadata || {};
  if (session.mode !== 'payment' || md.type !== 'prepay' || session.payment_status !== 'paid') return;
  const periods = parseInt(md.periods, 10);
  const interval = md.interval === 'week' ? 'week' : 'month';
  if (!md.uid || !periods) {
    logger.error('Prepay session missing metadata', { id: session.id });
    return;
  }
  await recordPayment(md.uid, session.id, {
    type: 'prepay',
    amountCents: session.amount_total,
    periods,
    interval,
  }, (current) => {
    // Paying ahead stacks on top of time already paid for.
    const start = current && current.getTime() > Date.now() ? current : new Date();
    return addPeriods(start, interval, periods);
  }, typeof session.payment_intent === 'string' ? session.payment_intent : null);
}

async function handleInvoicePaid(stripe, invoice) {
  const periodEnds = (invoice.lines?.data || []).map((line) => line.period?.end).filter(Boolean);
  if (!periodEnds.length) return;
  const uid = await uidForCustomer(stripe, invoice.customer);
  if (!uid) {
    logger.error('No member for Stripe customer', { customer: invoice.customer, invoice: invoice.id });
    return;
  }
  const periodEnd = new Date(Math.max(...periodEnds) * 1000);
  // The billing period's length tells weekly from monthly (newer API versions omit the price on invoice lines).
  const line = invoice.lines.data.find((l) => l.period?.start && l.period?.end);
  const days = line ? (line.period.end - line.period.start) / 86400 : 30;
  await recordPayment(uid, invoice.id, {
    type: 'autopay',
    amountCents: invoice.amount_paid,
    periods: 1,
    interval: days < 10 ? 'week' : 'month',
  }, () => periodEnd, invoice.amount_paid ? await paymentIntentForInvoice(stripe, invoice) : null);
}

/**
 * Refunds and disputes. A FULL refund of a dues payment takes back the time it paid for; a partial refund is only
 * marked (an admin can adjust the date on admin-members.html). Donation records are marked so totals net them out.
 */
// Only the fields the handlers use are kept for a held event.
const earlyRefund = (c) => ({ id: c.id, payment_intent: c.payment_intent, amount: c.amount, amount_refunded: c.amount_refunded, refunded: c.refunded });
const earlyDispute = (d) => ({ id: d.id, payment_intent: d.payment_intent, amount: d.amount, status: d.status });

async function holdEarlyEvent(pi, field, data) {
  await db.doc(`stripeEarlyEvents/${pi}`).set({ [field]: data, heldAt: FieldValue.serverTimestamp() }, { merge: true });
  logger.info(`Holding ${field} until its payment is recorded`, { paymentIntent: pi });
}

async function applyEarlyEvents(pi) {
  const ref = db.doc(`stripeEarlyEvents/${pi}`);
  const snap = await ref.get();
  if (!snap.exists) return;
  const { refund, dispute } = snap.data();
  if (refund) await handleRefund(refund);
  if (dispute) await handleDispute(dispute);
  await ref.delete();
}

async function handleRefund(charge) {
  const pi = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (!pi) return;
  const regSnap = await db.doc(`stripePayments/${pi}`).get();
  if (!regSnap.exists) {
    await holdEarlyEvent(pi, 'refund', earlyRefund(charge)); // the payment may still be on its way
    return;
  }
  const reg = regSnap.data();
  const recordRef = db.doc(reg.path);
  const full = charge.refunded === true || charge.amount_refunded >= charge.amount;

  await db.runTransaction(async (tx) => {
    const recordSnap = await tx.get(recordRef);
    if (!recordSnap.exists) return;
    const record = recordSnap.data();
    const update = {
      refundedCents: charge.amount_refunded,
      refundStatus: full ? 'full' : 'partial',
      refundedAt: FieldValue.serverTimestamp(),
    };
    if (reg.kind === 'dues' && full && !record.timeReversed) {
      const memberRef = db.doc(`members/${reg.uid}`);
      const memberSnap = await tx.get(memberRef);
      const current = toDate((memberSnap.data() || {}).paidThrough);
      if (current) {
        const reversed = addPeriods(current, reg.interval || 'month', -(reg.periods || 1));
        tx.set(memberRef, { paidThrough: Timestamp.fromDate(reversed) }, { merge: true });
        update.timeReversed = true;
        update.paidThroughAfterRefund = Timestamp.fromDate(reversed);
      }
    }
    tx.set(recordRef, update, { merge: true });
  });
}

async function handleDispute(dispute) {
  const pi = typeof dispute.payment_intent === 'string' ? dispute.payment_intent : dispute.payment_intent?.id;
  if (!pi) return;
  const regSnap = await db.doc(`stripePayments/${pi}`).get();
  if (!regSnap.exists) {
    await holdEarlyEvent(pi, 'dispute', earlyDispute(dispute));
    return;
  }
  await db.doc(regSnap.data().path).set({
    disputeStatus: dispute.status, // e.g. needs_response, won, lost
    disputedCents: dispute.amount,
    disputeUpdatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function handleSubscriptionChange(stripe, sub) {
  const uid = sub.metadata?.uid || (await uidForCustomer(stripe, sub.customer));
  if (!uid) {
    logger.error('No member for subscription', { subscription: sub.id });
    return;
  }
  // A member removed by an admin: their subscription was cancelled on the way out; don't re-create them.
  if (!(await db.doc(`members/${uid}`).get()).exists) return;
  // Newer Stripe accounts cancel from the customer portal with `cancel_at` instead of `cancel_at_period_end`.
  const cancelling = !!sub.cancel_at_period_end || !!sub.cancel_at;
  const autopay = ACTIVE_SUB_STATUSES.includes(sub.status) && !cancelling;
  await db.doc(`members/${uid}`).set({
    autopay,
    subscriptionId: sub.status === 'canceled' ? null : sub.id,
    subscriptionStatus: sub.status,
  }, { merge: true });
}

/**
 * Stripe webhook. Subscribe it to:
 *   checkout.session.completed, checkout.session.async_payment_succeeded,
 *   invoice.paid, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted,
 *   charge.refunded, charge.dispute.created, charge.dispute.updated, charge.dispute.closed
 */
exports.stripeWebhook = onRequest({ secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] }, async (req, res) => {
  const stripe = stripeClient();
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET.value());
  } catch (err) {
    logger.warn('Webhook signature verification failed', err.message);
    res.status(400).send('Invalid signature');
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object;
        if (session.metadata?.type === 'donation') await handleDonationSession(session);
        else await handlePrepaySession(session);
        break;
      }
      case 'invoice.paid': {
        // Donations and dues share the same Stripe account; sort by the subscription's metadata.
        const invoice = event.data.object;
        const md = await invoiceSubscriptionMetadata(stripe, invoice);
        if (md.type === 'donation') await handleDonationInvoice(stripe, invoice, md);
        else await handleInvoicePaid(stripe, invoice);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        if (sub.metadata?.type === 'donation') await handleDonationSubscription(stripe, sub);
        else await handleSubscriptionChange(stripe, sub);
        break;
      }
      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;
      case 'charge.dispute.created':
      case 'charge.dispute.updated':
      case 'charge.dispute.closed':
        await handleDispute(event.data.object);
        break;
      default:
        break;
    }
    res.json({ received: true });
  } catch (err) {
    logger.error('Webhook handler failed', { type: event.type, id: event.id, error: err.message });
    res.status(500).send('Handler error'); // Stripe will retry
  }
});

async function requireAdmin(request) {
  const auth = requireAuth(request);
  const adminDoc = await db.doc(`admins/${auth.uid}`).get();
  if (!adminDoc.exists) throw new HttpsError('permission-denied', 'Admins only.');
  return auth;
}

/**
 * Admin dues tools (admin-members.html):
 *   { action: 'recordPayment', uid, periods: 1-12, amountCents, method: 'cash'|'check'|'other', note }
 *     -> an in-person payment; adds time exactly like an online prepayment.
 *   { action: 'setPaidThrough', uid, date: 'YYYY-MM-DD', note }
 *     -> sets the paid-through date directly (comped memberships, corrections). Can move it earlier.
 */
exports.adminUpdateDues = onCall(async (request) => {
  const auth = await requireAdmin(request);
  const { action, uid, periods, amountCents, method, note, date } = request.data || {};
  if (typeof uid !== 'string' || !uid) throw new HttpsError('invalid-argument', 'Missing member.');
  const memberRef = db.doc(`members/${uid}`);
  if (!(await memberRef.get()).exists) throw new HttpsError('not-found', 'Member not found.');
  const cleanNote = typeof note === 'string' ? note.trim().slice(0, 300) : '';
  const recordedBy = auth.token.email || auth.uid;

  if (action === 'recordPayment') {
    const n = Number(periods);
    if (!Number.isInteger(n) || n < 1 || n > MAX_PREPAY_PERIODS) throw new HttpsError('invalid-argument', 'Choose between 1 and 12 periods.');
    if (!Number.isInteger(amountCents) || amountCents < 0 || amountCents > 1000000) throw new HttpsError('invalid-argument', 'Enter the amount received.');
    if (!['cash', 'check', 'other'].includes(method)) throw new HttpsError('invalid-argument', 'Choose how they paid.');
    const { interval } = await getDuesSettings();
    const id = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await recordPayment(uid, id, { type: 'manual', method, amountCents, periods: n, interval, note: cleanNote, recordedBy }, (current) => {
      const start = current && current.getTime() > Date.now() ? current : new Date();
      return addPeriods(start, interval, n);
    });
    return { ok: true };
  }

  if (action === 'setPaidThrough') {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpsError('invalid-argument', 'Choose a date.');
    // End of that day, Eastern time is close enough; use 23:59 UTC-5.
    const paidThrough = new Date(`${date}T23:59:00-05:00`);
    if (Number.isNaN(paidThrough.getTime())) throw new HttpsError('invalid-argument', 'Choose a valid date.');
    const id = `adjust_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const batch = db.batch();
    batch.set(memberRef, { paidThrough: Timestamp.fromDate(paidThrough) }, { merge: true });
    batch.set(memberRef.collection('payments').doc(id), {
      type: 'adjustment', amountCents: 0, note: cleanNote, recordedBy,
      paidThroughAfter: Timestamp.fromDate(paidThrough), createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return { ok: true };
  }

  throw new HttpsError('invalid-argument', 'Unknown action.');
});

// ---------- Admin: change a member's email / remove a member ----------
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// Keep in sync with MEMBER_TYPES / BUSINESS_CATEGORIES in member-common.js.
const MEMBER_TYPE_IDS = ['parent', 'family', 'caregiver', 'individual', 'professional', 'supporter', 'other'];
const CATEGORY_IDS = ['food', 'retail', 'home', 'health', 'beauty', 'education', 'childcare', 'professional',
  'automotive', 'events', 'creative', 'community', 'other'];
const LOGO_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Emails a "choose your password" link to a member an admin added. */
async function sendMemberInvite(uid, email, name, returnUrl) {
  const base = returnUrl ? returnBase(returnUrl) : 'https://araiofsunshine.org/member';
  const link = await getAuth().generatePasswordResetLink(email, { url: base });
  const { subject, content } = memberInvite({ name }, link);
  return mailer.send({ to: email, subject, content, kind: 'member-invite', uid });
}

/**
 * An admin adds a member who signed up in person (for example, paying dues in cash).
 *   { name, email?, phone?, memberType?, interests?, sendInvite?, returnUrl }
 * With an email they get a login (and optionally an invite to choose a password); without one they're a
 * website-only record that can still be listed in the directory once dues are recorded.
 */
exports.adminCreateMember = onCall({ secrets: [SMTP_URL] }, async (request) => {
  const admin = await requireAdmin(request);
  const d = request.data || {};
  const name = str(d.name, 100);
  const email = str(d.email, 200).toLowerCase();
  const memberType = MEMBER_TYPE_IDS.includes(d.memberType) ? d.memberType : '';
  if (!name) throw new HttpsError('invalid-argument', 'Enter the member\'s name.');
  if (email && !EMAIL_RE.test(email)) throw new HttpsError('invalid-argument', 'Enter a valid email address, or leave it blank.');

  let uid;
  if (email) {
    try {
      uid = (await getAuth().createUser({ email, displayName: name })).uid;
    } catch (err) {
      if (err.code === 'auth/email-already-exists') throw new HttpsError('already-exists', 'Someone already has an account with that email. Search for them in the list.');
      throw err;
    }
  } else {
    uid = db.collection('members').doc().id;
  }
  await db.doc(`members/${uid}`).set({
    name, email, phone: str(d.phone, 30), memberType, interests: str(d.interests, 500),
    emailUpdates: true, addedBy: admin.token.email || admin.uid,
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
  const invite = email && d.sendInvite ? (await sendMemberInvite(uid, email, name, d.returnUrl)).status : null;
  return { uid, invite };
});

/**
 * An admin creates or edits a member's business listing (for members who don't manage it online).
 * Saved as approved. { uid, listing: {...}, logo?: { dataUrl, contentType } }
 */
exports.adminSaveListing = onCall(async (request) => {
  const admin = await requireAdmin(request);
  const { uid, listing = {}, logo } = request.data || {};
  if (typeof uid !== 'string' || !(await db.doc(`members/${uid}`).get()).exists) throw new HttpsError('not-found', 'Member not found.');
  const bizRef = db.doc(`businesses/${uid}`);
  const existing = (await bizRef.get()).data() || {};

  const fields = {
    name: str(listing.name, 100),
    owner: str(listing.owner, 100),
    category: CATEGORY_IDS.includes(listing.category) ? listing.category : 'other',
    email: str(listing.email, 200),
    phone: str(listing.phone, 30),
    addressStreet: str(listing.addressStreet, 150),
    addressCity: str(listing.addressCity, 80),
    addressState: str(listing.addressState, 30),
    addressZip: str(listing.addressZip, 10),
    hideStreet: !!listing.hideStreet,
    address: '',
    description: str(listing.description, 1000),
    hoursNote: str(listing.hoursNote, 120),
  };
  if (!fields.name || !fields.owner) throw new HttpsError('invalid-argument', 'Business name and owner are required.');
  if (fields.email && !EMAIL_RE.test(fields.email)) throw new HttpsError('invalid-argument', 'Enter a valid business email, or leave it blank.');
  let website = str(listing.website, 300);
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
  if (website) { try { new URL(website); } catch { throw new HttpsError('invalid-argument', 'Enter a valid website address.'); } }
  fields.website = website;
  const year = Number(listing.establishedYear);
  const month = Number(listing.establishedMonth);
  fields.establishedYear = Number.isInteger(year) && year >= 1800 && year <= new Date().getFullYear() ? year : null;
  fields.establishedMonth = fields.establishedYear && Number.isInteger(month) && month >= 1 && month <= 12 ? month : null;
  if (fields.hideStreet && !fields.addressCity) throw new HttpsError('invalid-argument', 'Add a city when hiding the street address.');

  // Logo: a new upload replaces the old file; otherwise keep the existing one.
  let { logoUrl, logoPath } = existing;
  if (logo?.dataUrl) {
    const ext = LOGO_TYPES[logo.contentType];
    const base64 = String(logo.dataUrl).split(',')[1] || '';
    const bytes = Buffer.from(base64, 'base64');
    if (!ext) throw new HttpsError('invalid-argument', 'The logo must be a PNG, JPG, WEBP or GIF image.');
    if (!bytes.length || bytes.length > 2 * 1024 * 1024) throw new HttpsError('invalid-argument', 'The logo must be under 2 MB.');
    const bucket = getStorage().bucket();
    const path = `business-logos/${uid}/logo-${Date.now()}.${ext}`;
    const token = crypto.randomUUID();
    await bucket.file(path).save(bytes, { contentType: logo.contentType, metadata: { metadata: { firebaseStorageDownloadTokens: token } } });
    const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST ? `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}` : 'https://firebasestorage.googleapis.com';
    if (logoPath && logoPath !== path) await bucket.file(logoPath).delete().catch(() => {});
    logoPath = path;
    logoUrl = `${host}/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
  }
  if (!logoUrl) throw new HttpsError('invalid-argument', 'Upload a logo for the listing.');

  await bizRef.set({
    ...fields, logoUrl, logoPath,
    status: 'approved', reviewNote: '',
    reviewedAt: FieldValue.serverTimestamp(), reviewedBy: admin.token.email || admin.uid,
    enteredBy: admin.token.email || admin.uid,
    ...(existing.submittedAt ? {} : { submittedAt: FieldValue.serverTimestamp() }),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return { ok: true };
});

/**
 *   { action: 'changeEmail', uid, email }  -> login email, member record and Stripe customer all updated
 *   { action: 'remove', uid }              -> cancels autopay in Stripe, deletes the listing, logo, payment history,
 *                                             member record and login. Stripe keeps its own payment records.
 */
exports.adminManageMember = onCall({ secrets: [STRIPE_SECRET_KEY, SMTP_URL] }, async (request) => {
  const auth = await requireAdmin(request);
  const { action, uid, email, sendInvite, returnUrl } = request.data || {};
  if (typeof uid !== 'string' || !uid) throw new HttpsError('invalid-argument', 'Missing member.');
  const memberRef = db.doc(`members/${uid}`);
  const member = (await memberRef.get()).data();
  if (!member) throw new HttpsError('not-found', 'Member not found.');
  const stripe = stripeClient();

  if (action === 'changeEmail') {
    const next = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!EMAIL_RE.test(next)) throw new HttpsError('invalid-argument', 'Enter a valid email address.');
    try {
      try {
        await getAuth().updateUser(uid, { email: next });
      } catch (err) {
        // A member added without an email (e.g. pays in cash) gets a login now, under the same id.
        if (err.code !== 'auth/user-not-found') throw err;
        await getAuth().createUser({ uid, email: next, displayName: member.name || undefined });
      }
    } catch (err) {
      if (err.code === 'auth/email-already-exists') throw new HttpsError('already-exists', 'Another account already uses that email.');
      throw err;
    }
    await memberRef.set({ email: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    if (member.stripeCustomerId) await stripe.customers.update(member.stripeCustomerId, { email: next });
    const invite = sendInvite ? (await sendMemberInvite(uid, next, member.name, returnUrl)).status : null;
    return { ok: true, invite };
  }

  if (action === 'remove') {
    if ((await db.doc(`admins/${uid}`).get()).exists) {
      throw new HttpsError('failed-precondition', 'This person is an admin. Remove their admin access first.');
    }
    // Stop future charges first, so a failure later never leaves a deleted member still being billed.
    if (member.stripeCustomerId) {
      const subs = await stripe.subscriptions.list({ customer: member.stripeCustomerId, status: 'all', limit: 20 });
      for (const sub of subs.data) {
        if (!['canceled', 'incomplete_expired'].includes(sub.status) && sub.metadata?.type !== 'donation') {
          await stripe.subscriptions.cancel(sub.id);
        }
      }
    }
    try {
      await getStorage().bucket().deleteFiles({ prefix: `business-logos/${uid}/` });
    } catch (err) {
      logger.warn('Could not delete logo files', { uid, error: err.message });
    }
    await db.doc('settings/spotlight').set({ businessIds: FieldValue.arrayRemove(uid) }, { merge: true });
    const paymentCount = (await memberRef.collection('payments').count().get()).data().count;
    await db.doc(`removedMembers/${uid}`).set({
      name: member.name || '', email: member.email || '', paymentCount,
      removedBy: auth.token.email || auth.uid, removedAt: FieldValue.serverTimestamp(),
    });
    await db.doc(`directory/${uid}`).delete();
    await db.doc(`businesses/${uid}`).delete();
    await db.recursiveDelete(memberRef);
    try {
      await getAuth().deleteUser(uid);
    } catch (err) {
      if (err.code !== 'auth/user-not-found') throw err;
    }
    return { ok: true };
  }

  throw new HttpsError('invalid-argument', 'Unknown action.');
});

// ---------- Dues reminders ----------
// Members on autopay get Stripe's own renewal / failed-card emails, so these go only to members who pay manually.

async function runDuesReminders(now = Date.now()) {
  const dues = await getDuesSettings();
  const rate = `$${(dues.amountCents / 100).toFixed(2)} per ${dues.interval}`;
  const candidates = await db.collection('members')
    .where('paidThrough', '>=', Timestamp.fromMillis(now - 37 * DAY_MS))
    .where('paidThrough', '<=', Timestamp.fromMillis(now + 7 * DAY_MS))
    .get();
  const counts = { checked: candidates.size, sent: 0, logged: 0, failed: 0 };
  for (const docSnap of candidates.docs) {
    const member = docSnap.data();
    const due = reminderFor(member, now);
    if (!due) continue;
    const biz = (await db.doc(`businesses/${docSnap.id}`).get()).data();
    const { subject, content } = duesReminder(due.kind, member, {
      paidThrough: due.paidThrough, rate,
      hasListing: biz?.status === 'approved',
      hiddenOn: new Date(due.paidThrough.getTime() + GRACE_MS),
    });
    const result = await mailer.send({ to: member.email, subject, content, kind: `dues-${due.kind}`, uid: docSnap.id });
    if (result.status === 'failed') { counts.failed++; continue; }
    counts[result.status === 'sent' ? 'sent' : 'logged']++;
    await docSnap.ref.set({ remindersSent: { [due.key]: FieldValue.serverTimestamp() } }, { merge: true });
  }
  logger.info('Dues reminders', counts);
  return counts;
}

exports.sendDuesReminders = onSchedule(
  { schedule: 'every day 09:00', timeZone: 'America/New_York', secrets: [SMTP_URL] },
  () => runDuesReminders(),
);

/** "Send today's reminders now" on admin-members.html (also how reminders are tested locally). */
exports.adminSendReminders = onCall({ secrets: [SMTP_URL] }, async (request) => {
  await requireAdmin(request);
  return runDuesReminders();
});

// ---------- Admin notices ----------
async function adminEmails() {
  const snap = await db.collection('admins').get();
  return snap.docs.map((d) => d.data().email).filter(Boolean);
}

/** Emails the admins when a business listing is submitted (or resubmitted) for review. */
exports.notifyAdminsOfListing = onDocumentWritten({ document: 'businesses/{uid}', secrets: [SMTP_URL] }, async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (!after || after.status !== 'pending' || before?.status === 'pending') return;
  const member = (await db.doc(`members/${event.params.uid}`).get()).data();
  const { subject, content } = listingSubmitted(after, member);
  await mailer.send({ to: await adminEmails(), subject, content, kind: 'admin-listing', uid: event.params.uid });
});

// ---------- Member notices ----------

/** Welcomes people who sign up on the website. Members an admin adds get the "choose your password" invite instead. */
exports.welcomeNewMember = onDocumentCreated({ document: 'members/{uid}', secrets: [SMTP_URL] }, async (event) => {
  const member = event.data?.data();
  if (!member?.email || member.addedBy) return;
  const { subject, content } = welcomeMember(member);
  await mailer.send({ to: member.email, subject, content, kind: 'welcome', uid: event.params.uid });
});

/** Tells the member when an admin approves their listing or asks for changes. */
exports.notifyMemberOfReview = onDocumentWritten({ document: 'businesses/{uid}', secrets: [SMTP_URL] }, async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (!after || !['approved', 'rejected'].includes(after.status) || before?.status === after.status) return;
  const member = (await db.doc(`members/${event.params.uid}`).get()).data();
  if (!member?.email) return;
  // Same test as syncDirectoryEntry: approved listings show while dues (plus the grace period) are current.
  const paidThrough = toDate(member.paidThrough);
  const listed = after.status === 'approved' && !!paidThrough && paidThrough.getTime() + GRACE_MS > Date.now();
  const { subject, content } = listingReviewed(after, member, { listed });
  await mailer.send({ to: member.email, subject, content, kind: `listing-${after.status}`, uid: event.params.uid });
});

/**
 * Public address line for the directory. When the member ticks "hide my street", the street and ZIP
 * never leave the private businesses/ doc. Keep in sync with formatAddress in member-common.js.
 */
function formatAddress(b) {
  const street = (b.addressStreet || '').trim();
  const city = (b.addressCity || '').trim();
  const state = (b.addressState || '').trim();
  const zip = (b.addressZip || '').trim();
  if (!street && !city && !state && !zip) return (b.address || '').trim(); // older single-line listings
  const showStreet = street && !b.hideStreet;
  const cityState = [city, state].filter(Boolean).join(', ');
  const place = showStreet && zip ? `${cityState} ${zip}`.trim() : cityState;
  return [showStreet ? street : '', place].filter(Boolean).join(', ');
}

const DAY_IDS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Keeps only well-formed hours so the public directory never shows junk. */
function cleanHours(hours) {
  const out = {};
  if (!hours || typeof hours !== 'object') return out;
  for (const day of DAY_IDS) {
    const h = hours[day];
    if (!h || typeof h !== 'object') continue;
    if (h.closed === true) out[day] = { closed: true };
    else if (TIME_RE.test(h.open) && TIME_RE.test(h.close)) out[day] = { open: h.open, close: h.close };
  }
  return out;
}

/** Rebuilds directory/{uid} from the member's listing and dues state. */
async function syncDirectoryEntry(uid) {
  const [bizSnap, memberSnap] = await Promise.all([
    db.doc(`businesses/${uid}`).get(),
    db.doc(`members/${uid}`).get(),
  ]);
  const biz = bizSnap.data();
  const member = memberSnap.data() || {};
  const paidThrough = toDate(member.paidThrough);
  const dirRef = db.doc(`directory/${uid}`);

  const listedUntil = paidThrough ? new Date(paidThrough.getTime() + GRACE_MS) : null;
  if (!biz || biz.status !== 'approved' || !listedUntil || listedUntil.getTime() <= Date.now()) {
    await dirRef.delete();
    return;
  }

  await dirRef.set({
    name: biz.name || '',
    owner: biz.owner || '',
    category: biz.category || 'other',
    email: biz.email || '',
    phone: biz.phone || '',
    address: formatAddress(biz),
    website: biz.website || '',
    description: biz.description || '',
    // The live directory only shows logos served from Firebase Storage (local emulator links are for testing).
    logoUrl: (biz.logoUrl || '').startsWith('https://firebasestorage.googleapis.com/') || process.env.FUNCTIONS_EMULATOR === 'true'
      ? (biz.logoUrl || '') : '',
    hours: cleanHours(biz.hours),
    hoursNote: typeof biz.hoursNote === 'string' ? biz.hoursNote.slice(0, 120) : '',
    establishedYear: Number.isInteger(biz.establishedYear) ? biz.establishedYear : null,
    establishedMonth: Number.isInteger(biz.establishedMonth) ? biz.establishedMonth : null,
    memberSince: member.createdAt || null,
    listedUntil: Timestamp.fromDate(listedUntil),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

exports.onBusinessWritten = onDocumentWritten('businesses/{uid}', (event) => syncDirectoryEntry(event.params.uid));

exports.onMemberWritten = onDocumentWritten('members/{uid}', (event) => {
  const before = event.data.before.data() || {};
  const after = event.data.after.data() || {};
  const changed = (before.paidThrough?.toMillis?.() ?? null) !== (after.paidThrough?.toMillis?.() ?? null);
  return changed ? syncDirectoryEntry(event.params.uid) : null;
});

/** Takes lapsed members out of the directory. */
exports.expireDirectoryListings = onSchedule('every 6 hours', async () => {
  const expired = await db.collection('directory').where('listedUntil', '<=', Timestamp.now()).get();
  await Promise.all(expired.docs.map((d) => d.ref.delete()));
  logger.info(`Removed ${expired.size} expired directory listings`);
});
