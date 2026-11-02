// Seeds the LOCAL Firebase emulators with an admin account and default settings for testing.
// Run while `firebase emulators:start` is running:
//   node tools/seed-emulators.mjs          admin + dues setting + a sample event
//   node tools/seed-emulators.mjs --demo   also sample members, approved listings, upcoming events and donations,
//                                          so the directory and admin pages look realistic for a demo
// It only ever talks to the local emulators.
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST ||= '127.0.0.1:9199';

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

const BUCKET = 'araiofsunshine.firebasestorage.app';
initializeApp({ projectId: 'araiofsunshine', storageBucket: BUCKET });
const auth = getAuth();
const db = getFirestore();
const DEMO = process.argv.includes('--demo');

const ADMIN_EMAIL = 'admin@araiofsunshine.org';
const ADMIN_PASSWORD = 'admin1234';
const MEMBER_PASSWORD = 'demo1234';
const DAY = 86400000;
const now = Date.now();
const ts = (ms) => Timestamp.fromMillis(ms);
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

async function ensureUser(email, password, displayName) {
  try {
    return await auth.getUserByEmail(email);
  } catch {
    return auth.createUser({ email, password, displayName });
  }
}

const admin = await ensureUser(ADMIN_EMAIL, ADMIN_PASSWORD, 'Site Admin');
await db.doc(`admins/${admin.uid}`).set({ email: ADMIN_EMAIL });
await db.doc('settings/dues').set({ amountCents: 2500, interval: 'month' }, { merge: true });
await db.doc('events/local-sample').set({
  title: 'Monthly Family Support Meeting',
  date: isoDay(now + 7 * DAY), time: '6:00 PM', location: '805 N. Jefferson Street, Monticello, FL',
  description: 'Connect with other families, share experiences and hear from local service providers.'
});

if (DEMO) await seedDemo();

console.log('Local emulators seeded:');
console.log(`  Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}   (http://localhost:5000/admin-login)`);
console.log('  Dues: $25.00 per month');
if (DEMO) console.log(`  Demo members (password ${MEMBER_PASSWORD}): denise@, marcus@, gloria@, darnell@, priya@, lena@, tonya@ and angela@example.com`);
console.log('  New members: create one at http://localhost:5000/member');
process.exit(0);

// ---------------------------------------------------------------------------------------------------------------
async function seedDemo() {
  const bucket = getStorage().bucket();

  async function uploadLogo(uid, initials, bg, fg) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" rx="40" fill="${bg}"/><text x="120" y="150" font-family="Montserrat,Arial,sans-serif" font-size="84" font-weight="800" text-anchor="middle" fill="${fg}">${initials}</text></svg>`;
    const path = `business-logos/${uid}/logo.svg`;
    const token = randomUUID();
    await bucket.file(path).save(Buffer.from(svg), { contentType: 'image/svg+xml', metadata: { metadata: { firebaseStorageDownloadTokens: token } } });
    return { logoPath: path, logoUrl: `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media&token=${token}` };
  }

  const wk = (open, close) => ({ open, close });
  const weekdays = (open, close, extra = {}) => ({ mon: wk(open, close), tue: wk(open, close), wed: wk(open, close), thu: wk(open, close), fri: wk(open, close), ...extra });
  const addMonths = (ms, n) => { const d = new Date(ms); d.setUTCMonth(d.getUTCMonth() + n); return d.getTime(); };

  // [email, name, memberType, joinedDaysAgo, paidThrough (ms or null), autopay, business or null]
  const people = [
    ['denise@example.com', 'Denise Carter', 'parent', 300, addMonths(now, 2), false, {
      name: 'Red Hills Lawn Care', category: 'home', initials: 'RH', bg: '#2E7D4F', fg: '#FFFFFF', phone: '(850) 555-0142',
      street: '1450 Waukeenah Hwy', city: 'Monticello', state: 'FL', zip: '32344', hideStreet: true,
      website: 'https://redhillslawn.example', est: [4, 2015],
      description: 'Mowing, edging and seasonal cleanups for homes around Jefferson County. Family-owned since 2015.',
      hours: weekdays('07:00', '18:00', { sat: wk('08:00', '12:00'), sun: { closed: true } }), hoursNote: 'Free estimates by appointment' }],
    ['marcus@example.com', 'Marcus Hill', 'caregiver', 240, now + 12 * DAY, false, {
      name: 'Jefferson Street Coffee', category: 'food', initials: 'JS', bg: '#5B3A29', fg: '#FFD9A8', phone: '(850) 555-0178',
      street: '210 N. Jefferson St', city: 'Monticello', state: 'FL', zip: '32344',
      website: 'https://jeffcoffee.example', est: [9, 2019],
      description: 'Small-batch coffee, fresh pastries and a quiet back room for community meetings.',
      hours: weekdays('06:30', '14:00', { sat: wk('07:00', '15:00'), sun: wk('08:00', '13:00') }) }],
    ['gloria@example.com', 'Gloria Mae Simmons', 'family', 200, addMonths(now, 3), false, {
      name: 'Harvest Table Catering', category: 'food', initials: 'HT', bg: '#B5542B', fg: '#FFF1D6', phone: '(850) 555-0150',
      city: 'Monticello', state: 'FL', est: [6, 2008],
      description: 'Southern home cooking for church dinners, reunions and office lunches. Orders of 10 to 200 guests.',
      hoursNote: 'Catering by order, 48 hours notice' }],
    ['darnell@example.com', 'Darnell Price', 'supporter', 150, addMonths(now, 1), false, {
      name: 'Red Hills Auto Repair', category: 'automotive', initials: 'RA', bg: '#2F3A4A', fg: '#FFD27F', phone: '(850) 555-0151',
      street: '1820 S. Jefferson St', city: 'Monticello', state: 'FL', zip: '32344', est: [11, 1998],
      description: 'Brakes, tires, oil changes and state inspections. Wheelchair-accessible waiting room.',
      hours: weekdays('08:00', '17:30', { sat: { closed: true }, sun: { closed: true } }) }],
    ['priya@example.com', 'Priya Shah', 'professional', 120, addMonths(now, 2), false, {
      name: 'Grace Notes Piano Studio', category: 'education', initials: 'GN', bg: '#6B4FA0', fg: '#FFFFFF', phone: '(850) 555-0152',
      city: 'Monticello', state: 'FL', est: [8, 2017],
      description: 'Piano lessons for all ages and abilities, including adaptive lessons for students with disabilities.',
      hours: { mon: wk('15:00', '19:00'), tue: wk('15:00', '19:00'), wed: wk('15:00', '19:00'), thu: wk('15:00', '19:00'), sat: wk('09:00', '12:00') } }],
    ['lena@example.com', 'Lena Ortiz', 'individual', 90, now + 5 * DAY, false, {
      name: 'Glow Up Hair & Nails', category: 'beauty', initials: 'GU', bg: '#D9467A', fg: '#FFFFFF', phone: '(850) 555-0153',
      city: 'Monticello', state: 'FL', est: [2, 2020],
      description: 'Cuts, color, braids and nail care. Quiet, sensory-friendly appointments on request.',
      hours: { tue: wk('09:00', '18:00'), wed: wk('09:00', '18:00'), thu: wk('09:00', '18:00'), fri: wk('09:00', '19:00'), sat: wk('08:00', '16:00') } }],
    // Lapsed: approved listing, hidden from the directory until dues are paid.
    ['tonya@example.com', 'Tonya Brooks', 'parent', 400, now - 9 * DAY, false, {
      name: 'Bloom & Stem Florist', category: 'retail', initials: 'BS', bg: '#C2417A', fg: '#FFFFFF', phone: '(850) 555-0119',
      city: 'Monticello', state: 'FL', est: [3, 2011],
      description: 'Arrangements for weddings, memorials and everyday bouquets.' }],
    // Never paid, no listing yet: good for showing a first payment live.
    ['angela@example.com', 'Angela Ruiz', 'caregiver', 20, null, false, null],
  ];

  let spotlightUid = null;
  for (const [email, name, memberType, joinedAgo, paidThrough, autopay, biz] of people) {
    const user = await ensureUser(email, MEMBER_PASSWORD, name);
    const uid = user.uid;
    const memberRef = db.doc(`members/${uid}`);
    await memberRef.set({
      name, email, phone: biz?.phone || '', memberType, interests: '', emailUpdates: true,
      createdAt: ts(now - joinedAgo * DAY), updatedAt: ts(now - joinedAgo * DAY),
      ...(paidThrough ? { paidThrough: ts(paidThrough) } : {}),
      ...(autopay ? { autopay: true, subscriptionStatus: 'active' } : {}),
    });
    if (paidThrough) {
      await memberRef.collection('payments').doc(`demo_${uid}`).set(autopay
        ? { type: 'autopay', amountCents: 2500, periods: 1, interval: 'month', paidThroughAfter: ts(paidThrough), createdAt: ts(paidThrough - 30 * DAY) }
        : { type: 'prepay', amountCents: 5000, periods: 2, interval: 'month', paidThroughAfter: ts(paidThrough), createdAt: ts(addMonths(paidThrough, -2)) });
    }
    if (biz) {
      const logo = await uploadLogo(uid, biz.initials, biz.bg, biz.fg);
      await db.doc(`businesses/${uid}`).set({
        name: biz.name, owner: name, category: biz.category, email, phone: biz.phone || '',
        address: '', addressStreet: biz.street || '', addressCity: biz.city || '', addressState: biz.state || '',
        addressZip: biz.zip || '', hideStreet: !!biz.hideStreet, website: biz.website || '', description: biz.description,
        hours: biz.hours || {}, hoursNote: biz.hoursNote || '',
        establishedMonth: biz.est?.[0] ?? null, establishedYear: biz.est?.[1] ?? null,
        ...logo, status: 'approved', reviewNote: '', reviewedBy: ADMIN_EMAIL,
        submittedAt: ts(now - (joinedAgo - 5) * DAY), reviewedAt: ts(now - (joinedAgo - 6) * DAY), updatedAt: ts(now - (joinedAgo - 6) * DAY),
      });
      if (!spotlightUid) spotlightUid = uid;
    }
  }
  await db.doc('settings/spotlight').set({ businessIds: [spotlightUid] });

  // More upcoming events for the homepage.
  const events = [
    ['Caregiver Entrepreneurship Workshop', 14, '10:00 AM', 'Jefferson County Public Library', 'Hands-on session on starting a home-based business while caregiving.'],
    ['Community Resource Fair', 28, '11:00 AM', 'Monticello Courthouse Square', 'Meet agencies and nonprofits that support individuals with disabilities.'],
    ['Holiday Family Gathering', 45, '4:00 PM', '805 N. Jefferson Street, Monticello, FL', 'Food, crafts and fellowship for the whole family.'],
  ];
  for (const [i, [title, days, time, location, description]] of events.entries()) {
    await db.doc(`events/demo-${i + 1}`).set({ title, date: isoDay(now + days * DAY), time, location, description });
  }

  // A few donations (two from today, so "This month" has numbers whatever the date).
  const gifts = [
    ['demo_g1', 0.02, 5000, 'once', 'Linda Hayes', 'linda@example.com', 'In memory of my brother Tom', false],
    ['demo_g2', 0.05, 10000, 'once', 'Monticello Rotary Club', 'rotary@example.com', '', false],
    ['demo_g3', 15, 2500, 'once', 'Friend of A Rai of Sunshine', 'friend@example.com', '', true],
    ['demo_g4', 20, 2000, 'monthly', 'Rachel Kim', 'rachel@example.com', '', false],
    ['demo_g5', 120, 25000, 'once', 'Jefferson County Bank', 'giving@jcbank.example', 'Holiday drive', false],
  ];
  for (const [id, daysAgo, amountCents, frequency, donorName, email, note, anonymous] of gifts) {
    await db.doc(`donations/${id}`).set({ frequency, amountCents, donorName, email, note, anonymous, paidAt: ts(now - daysAgo * DAY), createdAt: ts(now - daysAgo * DAY) });
  }
  await db.doc('donationSubscriptions/demo_sub1').set({ donorName: 'Rachel Kim', email: 'rachel@example.com', anonymous: false, status: 'active', active: true, amountCents: 2000, startedAt: ts(now - 50 * DAY), canceledAt: null });
}
