/**
 * Outgoing email: dues reminders, member welcome and listing-review notices, and admin notices.
 *
 * SMTP_URL (a Firebase secret) chooses how mail goes out:
 *   smtps://USER:PASSWORD@smtp.example.com:465   -> sent through that provider (SendGrid, Mailgun, Google Workspace...)
 *   log                                          -> nothing is sent; each email is only recorded (local testing, or
 *                                                   until a provider is set up)
 * Every email, sent or not, is recorded in outbox/{id} so admins can see what went out (admin-members.html).
 */
const nodemailer = require('nodemailer');
const logger = require('firebase-functions/logger');

const ORG = 'A Rai of Sunshine of North Florida';
const SITE_URL = 'https://araiofsunshine.org';
const DEFAULT_FROM = `"${ORG}" <araiofsunshineofnorthflorida@gmail.com>`;

const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const firstName = (name) => (name || '').trim().split(/\s+/)[0] || 'there';
const longDate = (d) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });

/** Simple branded layout that renders in every mail client (tables + inline styles). */
function layout({ heading, paragraphs, button, footnote }) {
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
<p style="font-size:12px;color:#888888;margin:16px 0 0;">${ORG} · 805 N. Jefferson Street, Monticello, FL</p>
</td></tr></table></body></html>`;
}

/** Plain-text version for clients that don't show HTML. */
function plain({ heading, paragraphs, button, footnote }) {
  const strip = (s) => s.replace(/<[^>]+>/g, '');
  return [heading, '', ...paragraphs.map(strip), button ? `${button.label}: ${button.url}` : '', footnote ? strip(footnote) : '', '', ORG]
    .filter((line, i, all) => line !== '' || all[i - 1] !== '').join('\n');
}

function createMailer({ db, FieldValue, smtpSecret, mailFrom }) {
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
      transport = transport || nodemailer.createTransport(url);
      await transport.sendMail({
        from: mailFrom.value() || DEFAULT_FROM,
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
    },
  };
}

module.exports = { createMailer, duesReminder, listingSubmitted, listingReviewed, memberInvite, welcomeMember, longDate };
