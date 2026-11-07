# Membership Dues & Business Directory — Setup Guide

This adds:

| Page | Who | What |
| --- | --- | --- |
| `/member` | Members | Create an account, pay dues (autopay or pay ahead), submit a business listing with logo |
| `/directory` | Public | Searchable directory of approved businesses whose owners are paid up, with a **Member Spotlight** at the top |
| `/admin-businesses` | Admins | Approve or request changes on listings, correct a listing's business type, spotlight businesses |
| `/donate` | Public | "Give Online" form: one-time or monthly, preset or custom amount, optional name, tribute note and anonymous option |
| `/admin-donations` | Admins | Donation totals, gift list, monthly donors, CSV and year-end donor summary exports, donor portal link |
| `/admin-members` | Admins | See who's paid, filter and search members, export an unpaid-dues list and a Mailchimp-ready email list (respects each member's email opt-out), add members who join in person (with or without an email; optional "choose your password" invite), add or edit a member's business listing (saved as approved, for people who don't use the website), record cash/check payments, set paid-through dates, edit contact details, change a member's login email (members added without one get a login), remove a member, run dues reminders and see sent emails, change the dues amount or interval |

Payments run through **Stripe Checkout** (Stripe hosts the card form, so card numbers never touch this site).
Cloud Functions in `functions/` create checkout sessions and listen to Stripe's webhook to record how far each
member is paid through.

## How it works

- **Dues** default to **$25/month**. Admins can change the amount or switch to **weekly** in *Dues Settings* on
  `/admin-businesses` without a code change. Existing autopay subscriptions keep their original amount and schedule.
- **Autopay** = a Stripe subscription. **Pay ahead** = a one-time payment for 1–12 periods, added on top of any time
  already paid for. A member can't do both at once, so nobody gets charged twice. If someone who paid ahead turns on
  autopay, the first charge waits until their prepaid time runs out.
- **Listings** are one per member. Any edit sends the listing back to *Pending* for review.
- **The directory** shows a business only while it is **approved** and the owner's dues are **current**, with
  a 3-day grace period for renewals that settle late. Cloud Functions maintain this; visitors can't change it.
- **Spotlight**: on `/admin-businesses`, click **★ Spotlight** on any approved business. Click it again to remove it.
  You can spotlight several at once.

### Members who pay in cash

People who don't use the website can still be members and be listed. On `/admin-members`: **Add member** (email
optional) → in their window, **Record cash / check payment** → **Add listing for this member** (logo, details and an
hours note; saved as approved). They appear in the directory while their dues are current, and they get dues
reminders only if they have an email. Adding an email later gives them a login and, optionally, an invite to choose a
password.

## Keeping the live site safe while testing

- All of this lives on the `feature/member-dues-directory` branch. The live site only changes when something is
  merged to `main`, which triggers the GitHub deploy.
- Deploying **functions** only adds new backend endpoints. The live site doesn't use them.
- Deploying **Firestore rules** *does* affect the live site. Do step 1 first, or the current admin pages will lose
  write access.
- Test the new pages on a **preview channel** (step 7). It gets its own temporary URL; the live site is untouched.
- Before any of that, you can test everything on your own computer with the Stripe sandbox. See
  [Local testing with the Stripe sandbox](#local-testing-with-the-stripe-sandbox-step-0) near the end.

---

## 1. Register the existing admins (do this before deploying rules)

Members can now create accounts, so "logged in" no longer means "admin". Admins are listed in an `admins` collection.

1. Firebase Console → **Authentication → Users**. Copy the **User UID** of each admin account.
2. Firebase Console → **Firestore Database** → **Start collection** → Collection ID `admins`.
3. For each admin, add a document whose **Document ID is the UID**. Give it one field, `email` (string) = the
   admin's email. The site emails these addresses when a business listing needs review, so don't leave it out.

## 2. Turn on Cloud Storage (for logo uploads)

Firebase Console → **Storage** → **Get started**. Accept the defaults; the rules in `storage.rules` replace them in step 6.

### Optional: show members' logos on their Member Badge

The Member Badge tab draws each member's badge in the browser. Browsers only let it use the member's own logo if
the storage bucket allows cross-origin reads. Without this step, badges still work. They just use the business name
and the organization's logo. To turn it on (Google Cloud Shell or any machine with `gsutil`):

```bash
echo '[{"origin":["https://araiofsunshine.org","https://www.araiofsunshine.org","https://araiofsunshine.web.app"],"method":["GET"],"maxAgeSeconds":3600}]' > cors.json
gsutil cors set cors.json gs://araiofsunshine.firebasestorage.app
```

## 3. Stripe account setup (start in **Test mode**)

1. In the Stripe Dashboard, make sure **Test mode** is on (toggle at the top).
2. **Settings → Billing → Customer portal**: click **Activate**. Allow customers to *update payment methods* and
   *cancel subscriptions* (cancel at end of billing period). Members use this for "Manage Autopay & Card".
3. **Developers → API keys**: copy the **Secret key** (`sk_test_…`).
4. **Developers → Webhooks → Add endpoint**:
   - Endpoint URL: `https://us-east4-araiofsunshine.cloudfunctions.net/stripeWebhook`
   - Events:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `invoice.paid`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `charge.refunded` (a refunded dues payment takes back the time it paid for; donation totals net out refunds)
     - `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed` (flags disputed payments for admins)
   - After saving, reveal and copy the **Signing secret** (`whsec_…`).
5. **Branding.** The checkout page's name, colors, font, icon and "thank you" text are set in code
   (`CHECKOUT_BRANDING` in `functions/index.js`), so they're the same in the sandbox and live. A few things come from
   the Stripe account itself. Set these in each account (the sandbox and the live account are separate):
   - **Settings → Business → Public details**: public business name "A Rai of Sunshine of North Florida". This is the
     name in the checkout small print ("By subscribing, you authorize…") and on card statements.
   - **Settings → Branding**: upload the logo/icon, and set brand color `#FF8C42` and accent color `#4A90E2`. This
     styles the **billing portal**, receipts and invoice emails.
   - **Settings → Payment methods**: choose which methods appear at checkout (e.g. turn off Affirm/Klarna for dues).
6. **Donations.**
   - **Settings → Customer emails**: turn on **Successful payments** and **Refunds** so donors and members get
     emailed receipts. Standard receipts can't carry custom text, so put the 501(c)(3) statement and EIN in
     **Settings → Billing → Invoices → Default footer**; it appears on receipts for monthly gifts and dues autopay.
     The admin Donations page's **Year-end donor summary** covers the IRS acknowledgment letters for gifts of $250+.
   - **Settings → Billing → Customer portal**: turn on the **login link**, then paste it on `/admin-donations`
     ("Donor Self-Service Link"). Monthly donors use it to change or cancel their gift. Members don't need it.
   - Donations are recorded by the same webhook as dues, so no extra webhook events are needed. Gifts have a $5
     minimum to discourage card testing. Stripe Radar also screens every payment automatically.
7. **Autopay emails.** The site's own reminders only go to members who pay manually. For autopay members, turn on
   Stripe's emails in **Settings → Billing → Subscriptions and emails**: *upcoming renewal* reminders and *failed
   payment* emails (with Smart Retries, so a declined card is retried before the subscription goes past due).
8. Optional: A Rai of Sunshine is a 501(c)(3), so email Stripe support with the IRS determination letter to ask for
   discounted nonprofit processing rates (applies to dues and donations).

## 4. Store the Stripe keys and email setting as Firebase secrets

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY      # paste sk_test_…
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET  # paste whsec_…
firebase functions:secrets:set SMTP_URL               # "log" for now, or the provider URL (see 4b)
```

### 4b. Email (dues reminders and admin notices)

The site emails members who pay manually (a week before dues run out, right after, and 30 days later), welcomes
people who sign up on the website (with the three steps to get listed), tells members when their listing is approved
or needs changes (with the admin's note), and emails the admins when a listing needs review. Admins can also run reminders on demand and see every email on
`/admin-members` (**Dues Reminders**).

- **Until an email provider is set up**, use `SMTP_URL=log`: emails are recorded on that admin page but not sent.
- **To send for real**, pick any provider with SMTP (SendGrid, Mailgun, Postmark or a Google Workspace mailbox).
  Verify the sending domain or address with them, then set `SMTP_URL` to their SMTP URL, for example
  `smtps://USERNAME:PASSWORD@smtp.sendgrid.net:465`, and redeploy the functions.
- The **From** address is `MAIL_FROM` in `functions/.env` (not a secret). It must be an address the provider lets you
  send from. A Gmail address usually isn't accepted by providers; an address on the organization's own domain is
  best.

### 4c. Firebase Authentication emails and domains

- **Authentication → Templates**: set the sender name to "A Rai of Sunshine of North Florida" and adjust the
  password-reset email text.
- **Authentication → Settings → Authorized domains**: add `araiofsunshine.org` (and `www.` if used) so password-reset
  links work on the custom domain.

## 5. Deploy the functions

```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

## 6. Deploy the security rules

Only do this once step 1 is complete.

```bash
firebase deploy --only firestore:rules,storage
```

Then log in to `/admin-login` on the live site and confirm you can still edit events and sponsors.

## 7. Test on a preview URL

```bash
firebase hosting:channel:deploy members-test --expires 14d
```

This prints a URL like `https://araiofsunshine--members-test-xxxx.web.app`. On that URL:

1. `/member` → create an account → **Pay Now** (1 month). Use the Stripe test card `4242 4242 4242 4242`, any
   future expiry date, and any CVC. You should come back to "Paid up".
2. Submit a business with a logo → it shows *Pending review*.
3. `/admin-login` → sign in as an admin → **Businesses** tab → **Approve** → **★ Spotlight**.
4. `/directory` → the business shows in the Spotlight and in the list.
5. Test autopay with a second account. Test card `4000 0000 0000 0341` simulates a card that fails on renewal.
6. Refund a test payment from the Stripe Dashboard and check the member's paid-through date moves back.

If a payment doesn't update the status: Stripe Dashboard → **Developers → Webhooks** → your endpoint shows each
delivery and its response. Function logs: `firebase functions:log`.

## 8. Go live

1. In Stripe, switch off Test mode and repeat step 3 with the **live** secret key and a **live** webhook endpoint
   (same URL and events).
2. Re-run step 4 with the live keys, then `firebase deploy --only functions` so the functions pick them up.
3. Set `SMTP_URL` to the real email provider (step 4b) if it's still `log`.
4. **Policy pages:** `privacy.html`, `terms.html` and `refunds.html` are drafts with a visible "Draft" note. Have the
   organization (and ideally its attorney) approve them, then remove each page's `policy-draft-note` block. Stripe
   expects a refund policy, terms and contact details on the site.
5. Merge the branch into `main`. GitHub Actions deploys the site.

## Local testing with the Stripe sandbox (step 0)

Run the whole site on your own computer against the Firebase emulators and your Stripe **sandbox**. Nothing here
touches the live site, the live Firebase project, or real money. When the site is served from
`http://localhost:5000`, every page automatically uses the local emulators instead of the live project.

**One-time setup**

1. Install the Stripe CLI: `winget install --id Stripe.StripeCli` (then open a new terminal).
2. Sign the CLI in to your sandbox. Either:
   - `stripe login`, then copy the link it prints into the browser window where you're signed in to Stripe
     (a private window is fine), or
   - `stripe login --interactive` and paste your sandbox **secret key** when asked (no browser needed).
3. In the Stripe Dashboard (sandbox), go to **Developers → API keys** and copy the **Secret key** (`sk_test_…`).
   Paste it into `functions/.secret.local` as `STRIPE_SECRET_KEY`. That file is ignored by git. Add a line
   `SMTP_URL=log` too, so reminder emails are recorded instead of sent while testing.
4. In the Stripe Dashboard (sandbox), go to **Settings → Billing → Customer portal** and click **Activate**. Allow
   updating payment methods and cancelling subscriptions. "Manage Autopay & Card" needs this.

**Each testing session** uses three terminals, all run from the project folder:

```bash
# Terminal 1: forward Stripe events to the local webhook
stripe listen --forward-to http://127.0.0.1:5001/araiofsunshine/us-east4/stripeWebhook \
  --events checkout.session.completed,checkout.session.async_payment_succeeded,invoice.paid,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,charge.refunded,charge.dispute.created,charge.dispute.updated,charge.dispute.closed
```

The first time, it prints `Your webhook signing secret is whsec_…`. Put that value in `functions/.secret.local` as
`STRIPE_WEBHOOK_SECRET`. It stays the same on this computer, so this is a one-time step.

```bash
# Terminal 2: start the emulators (keeps test accounts between sessions)
firebase emulators:start --project araiofsunshine --import=./.emulator-data --export-on-exit

# Terminal 3: create the test admin + default dues (safe to re-run)
node tools/seed-emulators.mjs
```

Then open **http://localhost:5000/member**, create an account and pay with the test card `4242 4242 4242 4242` (any
future expiry, any CVC). Terminal 1 shows each Stripe event and whether the webhook accepted it (`[200]`). The
dues status in the portal updates on its own. The admin pages are at http://localhost:5000/admin-login
(`admin@araiofsunshine.org` / `admin1234`), and the emulator dashboard is at http://localhost:4000.

If you change `functions/.secret.local`, restart Terminal 2 so the functions pick up the new values.

If `stripe listen` stops with *"You provided an expired OAuth token"*, the CLI's sign-in has expired. Run
`stripe login` again, or skip the sign-in by giving the CLI the sandbox key from `.secret.local` as the
`STRIPE_API_KEY` environment variable before running `stripe listen`. The webhook signing secret stays the same
either way.

## Data reference

| Collection | Written by | Contents |
| --- | --- | --- |
| `admins/{uid}` | Console only | Marks a user as admin (`email` field: where admin notices go) |
| `members/{uid}` | Member (name, phone) + functions (dues) | `paidThrough`, `autopay`, `subscriptionStatus`, `stripeCustomerId` |
| `members/{uid}/payments/{id}` | Functions | Payment history |
| `businesses/{uid}` | Member (details) + admin (status) | The submitted listing; `status` is `pending` / `approved` / `rejected` |
| `directory/{uid}` | Functions | Public copy of the listing, only while approved and paid up |
| `settings/dues` | Admin | `{ amountCents, interval }` |
| `settings/spotlight` | Admin | `{ businessIds: [...] }` |
| `settings/donations` | Admin | `{ portalLoginUrl }` (Stripe's donor login link) |
| `donations/{id}` | Functions | One record per gift; `refundedCents` / `disputeStatus` when refunded or disputed |
| `donationSubscriptions/{id}` | Functions | Monthly donors and whether their gift is active |
| `outbox/{id}` | Functions | Every email sent or logged (reminders, admin notices) |
| `removedMembers/{uid}` | Functions | Who removed which member, and when |
| `stripePayments/{pi}` | Functions | Private lookup from a Stripe payment to the record it paid for (used by refunds) |
