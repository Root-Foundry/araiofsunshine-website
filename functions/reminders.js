// Which dues reminder (if any) a member should get today. Pure, so it can be tested without Firebase.
const DAY_MS = 24 * 60 * 60 * 1000;
const GRACE_MS = 3 * DAY_MS; // matches the directory grace period in index.js

const toDate = (ts) => (ts && typeof ts.toDate === 'function' ? ts.toDate() : ts instanceof Date ? ts : null);

/**
 * A week before dues run out ('soon'), just after (within the grace period, 'due'), and 30 days after ('late').
 * Autopay members are skipped: Stripe sends their renewal and failed-card emails.
 * Returns { kind, key, paidThrough } or null; `key` is stored in members/{uid}.remindersSent so none repeats.
 */
function reminderFor(member, now = Date.now()) {
  if (member.autopay) return null;
  const paidThrough = toDate(member.paidThrough);
  if (!paidThrough || !member.email) return null;
  const diff = paidThrough.getTime() - now;
  let kind = null;
  if (diff > 0 && diff <= 7 * DAY_MS) kind = 'soon';
  else if (diff <= 0 && -diff <= GRACE_MS) kind = 'due';
  else if (-diff >= 30 * DAY_MS && -diff <= 37 * DAY_MS) kind = 'late';
  if (!kind) return null;
  const key = `${kind}-${paidThrough.getTime()}`;
  return member.remindersSent?.[key] ? null : { kind, key, paidThrough };
}

module.exports = { reminderFor, DAY_MS };
