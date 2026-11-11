/**
 * Outgoing email: dues reminders, member welcome and listing-review notices, and admin notices.
 *
 * SMTP_URL (a Firebase secret) chooses how mail goes out:
 *   smtps://USER:PASSWORD@smtp.example.com:465   -> sent through that provider (SendGrid, Mailgun, Google Workspace...)
 *   gmail                                        -> sent through the Gmail API as the Google Workspace mailbox in
 *                                                   MAIL_FROM, by the GMAIL_SERVICE_ACCOUNT service account
 *                                                   (domain-wide delegation; no key file, see MEMBERSHIP-SETUP.md 4b)
 *   log                                          -> nothing is sent; each email is only recorded (local testing, or
 *                                                   until a provider is set up)
 * Every email, sent or not, is recorded in outbox/{id} so admins can see what went out (admin-members.html).
 */
const nodemailer = require('nodemailer');
const logger = require('firebase-functions/logger');

const ORG = 'A Rai of Sunshine of North Florida';
const SITE_URL = 'https://araiofsunshine.org';
const DEFAULT_FROM = `"${ORG}" <araiofsunshineofnorthflorida@gmail.com>`;
// Mail goes out from a Root Foundry address, so the footer says whose email this is and why it was sent.
const SENT_BY = 'Root Foundry runs the araiofsunshine.org website and sends these emails for A Rai of Sunshine.';
const REASONS = {
  member: `You're getting this email because you have a member account with ${ORG} at araiofsunshine.org.`,
  invite: `You're getting this email because ${ORG} set up a member account for you at araiofsunshine.org.`,
  admin: `You're getting this email because you're an admin for the ${ORG} website.`,
};

const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const firstName = (name) => (name || '').trim().split(/\s+/)[0] || 'there';
const longDate = (d) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });

/** Simple branded layout that renders in every mail client (tables + inline styles). */
function layout({ heading, paragraphs, button, footnote, reason = REASONS.member }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#333333;">${p}</p>`).join('');
  const cta = button
    ? `<p style="margin:24px 0;"><a href="${escapeHtml(button.url)}" style="background:#FF8C42;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;display:inline-block;">${escapeHtml(button.label)}</a></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#FFF9E6;font-family:'Open Sans',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF9E6;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;">
<tr><td style="padding:28px 32px 8px;"><img src="${SITE_URL}/cropped-logo.png" alt="${ORG}" height="56" style="display:block;"></td></tr>
<tr><td style="padding:8px 32px 28px;">
<h1 style="margin:0 0 16px;font-family:Montserrat,Arial,sans-serif;font-size:22px;color:#333333;">${escapeHtml(heading)}</h1>
${body}${cta}
${footnote ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#666666;">${footnote}</p>` : ''}
</td></tr></table>
<p style="max-width:560px;font-size:12px;line-height:1.5;color:#888888;margin:16px 0 0;">${escapeHtml(reason)} ${SENT_BY}<br>${ORG} · 850 N. Jefferson Street, Unit 805, Monticello, FL 32344</p>
</td></tr></table></body></html>`;
}

/** Plain-text version for clients that don't show HTML. */
function plain({ heading, paragraphs, button, footnote, reason = REASONS.member }) {
  const strip = (s) => s.replace(/<[^>]+>/g, '');
  return [heading, '', ...paragraphs.map(strip), button ? `${button.label}: ${button.url}` : '', footnote ? strip(footnote) : '', '',
    `${reason} ${SENT_BY}`, ORG]
    .filter((line, i, all) => line !== '' || all[i - 1] !== '').join('\n');
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body.error_description || body.error?.message || body.error || res.statusText;
    throw new Error(`${new URL(url).hostname} ${res.status}: ${detail}`);
  }
  return body;
}

/**
 * Sends as a Google Workspace mailbox through the Gmail API. The service account has domain-wide delegation for
 * gmail.send in the Workspace admin console. There's no key file: the function's own identity has Google sign the
 * service account's token request (IAM Credentials signJwt), which needs Token Creator on that service account.
 */
function gmailTransport(serviceAccount, from) {
  if (!serviceAccount) throw new Error('Set GMAIL_SERVICE_ACCOUNT in functions/.env to send with SMTP_URL=gmail.');
  const mailbox = (from.match(/<([^>]+)>/)?.[1] || from).trim();
  const compose = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'crlf' });
  let token = null;

  async function accessToken() {
    if (token && token.expires > Date.now() + 60_000) return token.value;
    const runtime = await fetchJson('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      { headers: { 'Metadata-Flavor': 'Google' } });
    const now = Math.floor(Date.now() / 1000);
    const claims = { iss: serviceAccount, sub: mailbox, scope: 'https://www.googleapis.com/auth/gmail.send',
      aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 };
    const { signedJwt } = await fetchJson(
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(serviceAccount)}:signJwt`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${runtime.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: JSON.stringify(claims) }),
      });
    const grant = await fetchJson('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: signedJwt }),
    });
    token = { value: grant.access_token, expires: Date.now() + grant.expires_in * 1000 };
    return token.value;
  }

  return {
    async sendMail(message) {
      const { message: mime } = await compose.sendMail(message);
      await fetchJson('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: mime.toString('base64url') }),
      });
    },
  };
}

function createMailer({ db, FieldValue, smtpSecret, mailFrom, replyTo, gmailServiceAccount }) {
  let transport = null;

  async function send({ to, subject, content, kind, uid = null }) {
    const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
    if (!recipients.length) return { status: 'skipped' };
    const url = (smtpSecret.value() || '').trim();
    const ref = db.collection('outbox').doc();
    const record = { to: recipients, subject, kind, uid, createdAt: FieldValue.serverTimestamp() };

    if (!url || url === 'log') {
      await ref.set({ ...record, status: 'logged', text: plain(content) });
      logger.info(`[email:log] ${kind} -> ${recipients.join(', ')}: ${subject}`);
      return { status: 'logged' };
    }
    try {
      const from = mailFrom.value() || DEFAULT_FROM;
      transport = transport || (url === 'gmail' ? gmailTransport(gmailServiceAccount.value(), from) : nodemailer.createTransport(url));
      await transport.sendMail({
        from,
        replyTo: replyTo.value() || undefined, // replies reach the organization, not the sending mailbox
        to: recipients.join(', '),
        subject,
        html: layout(content),
        text: plain(content),
      });
      await ref.set({ ...record, status: 'sent' });
      return { status: 'sent' };
    } catch (err) {
      logger.error('Email failed', { kind, to: recipients, error: err.message });
      await ref.set({ ...record, status: 'failed', error: err.message.slice(0, 300) });
      return { status: 'failed' };
    }
  }

  return { send };
}

// ---------- Messages ----------

function duesReminder(kind, member, { paidThrough, rate, hasListing, hiddenOn }) {
  const hi = `Hi ${escapeHtml(firstName(member.name))},`;
  const renew = { label: 'Renew my membership', url: `${SITE_URL}/member#dues` };
  const autopayTip = 'Tip: turn on <strong>autopay</strong> in the member portal and you won\'t need to remember next time.';
  if (kind === 'soon') {
    return {
      subject: `Your ${ORG} dues run out on ${longDate(paidThrough)}`,
      content: {
        heading: 'Your membership is up for renewal soon',
        paragraphs: [hi, `Your membership dues are paid through <strong>${longDate(paidThrough)}</strong>. Dues are ${escapeHtml(rate)}.`,
          hasListing ? 'Renewing keeps your business listed in the member directory.' : 'Thank you for being part of our community!'],
        button: renew,
        footnote: autopayTip,
      },
    };
  }
  if (kind === 'due') {
    return {
      subject: `Your ${ORG} membership dues are due`,
      content: {
        heading: 'Your membership dues are due',
        paragraphs: [hi, `Your membership dues ran out on <strong>${longDate(paidThrough)}</strong>.`,
          hasListing
            ? `Your business listing will be hidden from the member directory on <strong>${longDate(hiddenOn)}</strong> unless your dues are renewed.`
            : 'Renewing keeps you connected to our meetings, resources and support network.'],
        button: renew,
        footnote: autopayTip,
      },
    };
  }
  return {
    subject: `We miss you at ${ORG}`,
    content: {
      heading: 'We\'d love to have you back',
      paragraphs: [hi, `Your membership dues ran out on ${longDate(paidThrough)}. Renewing takes about a minute online, and your account and business listing are still saved.`,
        'If something has changed or dues are a hardship right now, just reply to this email. We\'re happy to talk.'],
      button: renew,
    },
  };
}

function listingSubmitted(business, member) {
  return {
    subject: `New business listing to review: ${business.name}`,
    content: {
      heading: 'A business listing is waiting for review',
      paragraphs: [
        `<strong>${escapeHtml(business.name)}</strong> was submitted by ${escapeHtml(member?.name || business.owner || 'a member')} (${escapeHtml(member?.email || business.email || '')}).`,
        'Approve it or request changes on the admin Businesses page.',
      ],
      button: { label: 'Review listings', url: `${SITE_URL}/admin-businesses` },
      reason: REASONS.admin,
    },
  };
}

/** Sent when someone creates an account on the website. */
function welcomeMember(member) {
  return {
    subject: `Welcome to ${ORG}`,
    content: {
      heading: 'Welcome to the community!',
      paragraphs: [
        `Hi ${escapeHtml(firstName(member.name))},`,
        'Thank you for joining. Your member account is ready.',
        'Have a business? Members can list it in our directory in three steps:',
        '<strong>1.</strong> Pay your dues, with monthly autopay or by paying ahead.',
        '<strong>2.</strong> Submit your business details and logo.',
        '<strong>3.</strong> Our team reviews your listing, and it appears in the directory while your dues are current.',
        'Your member portal shows where you are at each step.',
      ],
      button: { label: 'Go to my member portal', url: `${SITE_URL}/member` },
      footnote: 'Questions? Just reply to this email.',
    },
  };
}

/** Sent when an admin approves a listing or asks for changes. `listed` = it's in the directory now (dues current). */
function listingReviewed(business, member, { listed }) {
  const hi = `Hi ${escapeHtml(firstName(member.name || business.owner))},`;
  const name = `<strong>${escapeHtml(business.name)}</strong>`;
  if (business.status === 'approved') {
    return {
      subject: `${business.name} is approved for the member directory`,
      content: {
        heading: listed ? 'Your business is in the directory' : 'Your listing is approved',
        paragraphs: [hi, `Good news: our team approved ${name}.`,
          listed
            ? 'It\'s live in the member directory now, and your member badges are ready to download in the portal.'
            : 'It will appear in the member directory as soon as your dues are paid.'],
        button: listed
          ? { label: 'See the directory', url: `${SITE_URL}/directory` }
          : { label: 'Pay my dues', url: `${SITE_URL}/member#dues` },
        footnote: listed ? 'Tip: link your badge to araiofsunshine.org/directory so customers can find you.' : '',
      },
    };
  }
  return {
    subject: `Changes requested for your ${business.name} listing`,
    content: {
      heading: 'A few changes before we list your business',
      paragraphs: [hi, `Thanks for submitting ${name}. Our team asked for a few changes before it goes in the directory.`,
        ...(business.reviewNote ? [`<strong>Note from our team:</strong> ${escapeHtml(business.reviewNote)}`] : []),
        'Update your listing in the member portal and resubmit it, and we\'ll take another look.'],
      button: { label: 'Update my listing', url: `${SITE_URL}/member#business` },
    },
  };
}

function memberInvite(member, link) {
  return {
    subject: `Set up your ${ORG} member account`,
    content: {
      heading: 'Welcome! Your member account is ready',
      paragraphs: [
        `Hi ${escapeHtml(firstName(member.name))},`,
        'We\'ve set up your member account on our website. Choose a password to sign in, where you can see your dues, pay online if you like, and manage your business listing.',
      ],
      button: { label: 'Choose my password', url: link },
      footnote: 'This link expires after a while. If it stops working, use "Forgot your password?" on the member sign-in page.',
      reason: REASONS.invite,
    },
  };
}

module.exports = { createMailer, duesReminder, listingSubmitted, listingReviewed, memberInvite, welcomeMember, longDate };
