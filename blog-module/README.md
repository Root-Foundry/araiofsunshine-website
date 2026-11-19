# Blog module

A self-contained blog with a phone-friendly admin editor, built on Firebase
(Firestore, Storage, Authentication). Public pages are complete server-rendered
HTML, so search engines and link previewers (Facebook, LinkedIn, iMessage) see
every title, description, image and structured-data tag without running
JavaScript. The editor is plain HTML/CSS/JS, so it drops into any site, React or not.

Everything site-specific lives in **`blog.config.ts`**. To reuse the blog on
another site, copy this folder and edit that one file.

## Contents

- [How it fits together](#how-it-fits-together)
- [Setup on root-foundry.com](#setup-on-root-foundrycom)
- [Config options](#config-options)
- [Writing posts](#writing-posts)
- [Granting and removing editor access](#granting-and-removing-editor-access)
- [How caching affects when posts appear](#how-caching-affects-when-posts-appear)
- [Costs: the Blaze plan](#costs-the-blaze-plan)
- [Installing on another site](#installing-on-another-site)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## How it fits together

```
blog-module/
  blog.config.ts          every site-specific setting (the only file you edit per site)
  core/                   framework-free renderer: Firestore queries, Markdown → sanitized HTML,
                          page templates, SEO tags, JSON-LD, sitemap, RSS, 404
  adapters/fetch-handler.ts   blog pages for Request/Response frameworks (Next.js, Remix, Astro…)
  adapters/admin-handler.ts   serves the editor from a route in those frameworks (no build step)
  functions/              adapter as a 2nd-gen Cloud Function named "blog" (Firebase Hosting sites)
  admin/                  the editor: index.html, admin.css, admin.js
  rules/                  standalone Firestore/Storage rules + Firestore indexes
  scripts/
    build-admin.mjs       copies the editor into a static site's public folder and writes its config.js
    grant-blog-admin.mjs  gives a user editor access (custom claim admin: true)
    seed-sample-post.mjs  creates one sample draft post
```

Both adapters call the same `core/router.ts`, so a page looks and behaves
identically whichever way it's served. Pick the adapter that matches the host:

| Site is hosted on | Blog pages | Editor (`/blog-admin`) |
|---|---|---|
| Firebase **App Hosting** / Next.js (root-foundry.com) | `adapters/fetch-handler.ts` via `app/blog/[[...path]]/route.ts` | `adapters/admin-handler.ts` via `app/blog-admin/[[...file]]/route.ts` |
| Firebase **Hosting** (plain HTML, Vite, Create React App) | `functions/`, with `firebase.json` rewriting `/blog/**` to it | static files from `scripts/build-admin.mjs` |

### Routes

| URL | Page |
|---|---|
| `/blog` (`?page=2`, …) | Published posts, newest first, 10 per page |
| `/blog/{slug}` | One article, ending with a call-to-action that links to the contact page |
| `/blog/tag/{tag}` | Posts with that tag |
| `/blog/sitemap.xml` | Sitemap of the blog and every published post |
| `/blog/rss.xml` | RSS feed of the 50 newest posts |
| anything else | Styled 404 page, real 404 status, `noindex` |

Drafts are never served: every public query filters on `status == "published"`.

### Data

Firestore collection **`posts`**:

| Field | Type | Notes |
|---|---|---|
| `title` | string | required |
| `slug` | string | URL part, `lowercase-with-dashes`, unique (checked by the editor) |
| `excerpt` | string | summary on cards and in search results |
| `body` | string | Markdown |
| `coverImageUrl`, `coverImageAlt` | string | cover image and its description |
| `author` | string | falls back to `defaultAuthor` |
| `tags` | string[] | lowercased by the editor |
| `status` | `"draft"` \| `"published"` | |
| `publishedAt` | timestamp | set on first publish; kept if you unpublish and republish |
| `updatedAt` | timestamp | set on every save |
| `seoTitle`, `seoDescription` | string | optional overrides for search results and link previews |

Images go to Firebase Storage under `blog-images/`.

## Setup on root-foundry.com

The site serves the blog from `app/blog/[[...path]]/route.ts` and the editor
from `app/blog-admin/[[...file]]/route.ts`; nothing needs building. To switch it on:

1. **Deploy the security rules and indexes** (Firestore and Storage rules, plus
   the two composite indexes the blog's queries need):
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage --project rootfoundry-deb29
   ```
   Indexes take a few minutes to build. Until they finish, `/blog` returns an error.

2. **Create your editor login.** Firebase console → Authentication → Users → *Add user*.
   Use an email and password; this is separate from the Google Workspace sign-in
   you use for the admin dashboard.

3. **Grant it editor access** (see [Granting access](#granting-and-removing-editor-access)):
   ```bash
   npm run blog:grant-admin -- you@root-foundry.com
   ```

4. **Create the sample draft** (optional):
   ```bash
   npm run blog:seed-sample
   ```

5. **Deploy the site** as usual (`npm run firebase:apphosting:deploy`), then open
   **https://root-foundry.com/blog-admin**, log in, open the sample draft,
   publish it, and tap *View post*.

Steps 3 and 4 need Google Cloud credentials on your machine, either:

- `gcloud auth application-default login` (simplest), or
- a service-account key: Firebase console → Project settings → Service accounts →
  *Generate new private key*, then `set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\key.json`
  (PowerShell: `$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\key.json"`).
  Keep key files out of the repo.

## Config options

All in `blog.config.ts`:

| Option | What it does | Root Foundry value |
|---|---|---|
| `siteName` | Business name in titles, JSON-LD publisher, RSS | `Root Foundry` |
| `siteUrl` | Origin the blog is served from, **no trailing slash**. Used for canonical URLs, sitemap and Open Graph tags | `https://root-foundry.com` |
| `basePath` | Path the blog lives under. Use `""` for a blog subdomain | `/blog` |
| `adminPath` | Where the editor is served (and, on static sites, where `build-admin.mjs` puts it under `public/`) | `/blog-admin` |
| `language` | `<html lang>`, date formatting, RSS language | `en-US` |
| `timeZone` | Time zone for displayed post dates | `America/New_York` |
| `blogTitle` | Heading and `<title>` of the blog index | `The Root Foundry Blog` |
| `blogDescription` | Index meta description and intro line | … |
| `postsPerPage` | Posts per index/tag page | `10` |
| `defaultAuthor` | Author when a post leaves it blank (also pre-filled in the editor) | `Austin Gilmore` |
| `contactUrl` | Where the end-of-article call-to-action and header buttons link | `…/contact` |
| `logoUrl` | Logo in the header template, JSON-LD and the editor | `…/brand/rf-emblem.png` |
| `defaultShareImage` | Social image for pages and posts without a cover (1200×630 is ideal) | `…/opengraph-image` |
| `twitterHandle` | Optional `@handle` for `twitter:site` | not set |
| `brand.colors.*` | `background`, `surface` (cards), `text`, `muted`, `accent` (links, buttons), `accentText` (text on buttons), `border` | brand forest greens and signal cyan |
| `brand.fonts.body` / `.heading` | CSS font stacks | Inter / Montserrat |
| `brand.fonts.googleFontsUrl` | Optional Google Fonts stylesheet for those fonts | Inter, Montserrat, Orbitron |
| `brand.extraCss` | Extra CSS appended to every page; holds the header/footer styles | header/footer CSS |
| `cta.heading` / `.text` / `.buttonLabel` | The call-to-action block at the end of every article | … |
| `headerHtml` / `footerHtml` | HTML wrapped around every page. Placeholders: `{{siteUrl}}`, `{{basePath}}`, `{{contactUrl}}`, `{{logoUrl}}`, `{{year}}` | copies of the React header/footer |
| `cache.browserMaxAge` | Seconds a browser may reuse a page (`max-age`) | `300` |
| `cache.cdnMaxAge` | Seconds the CDN may reuse a page (`s-maxage`) | `3600` |
| `firebase.*` | Public Firebase web config for the editor (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `appId`). Safe to publish; access is enforced by security rules | `rootfoundry-deb29` |

After changing `blog.config.ts`, redeploy. On a static site, also re-run
`build-admin.mjs` so the editor's `config.js` picks up the change.

> **Keep the header and footer in sync.** On root-foundry.com they're copies of
> `app/components/SiteHeader.tsx` and `SiteFooter.tsx`. If you change the
> site's navigation, update `headerHtml`/`footerHtml` too.

## Writing posts

Open `/blog-admin` on your site (it's `noindex`, so it won't show up in Google).

- **New post** → write a title; the web address (slug) fills itself in. You can
  edit it, and the editor stops you if another post already uses it.
- The **Post** box takes Markdown, with a toolbar for headings, bold, lists,
  links and quotes. Tap the eye icon to preview, or the split icon for a
  live side-by-side preview on a computer.
- **Images in the post:** drag a photo into the editor, paste one, or use the
  image button. PNG, JPG, WebP or GIF up to 5 MB.
- **Cover image:** shown at the top of the article and in link previews. You're
  asked to describe it before publishing, for people using screen readers.
- **Save draft** keeps it private. **Publish** makes it live, and *View post*
  appears. **Unpublish** turns it back into a draft. **Delete** asks first and
  can't be undone. Images it used stay in Storage.
- *Search engine settings* (optional) override the title and description shown
  in Google and in link previews.

## Granting and removing editor access

Editors need a Firebase Authentication account (email and password) with the
custom claim `admin: true`:

```bash
npm run blog:grant-admin -- someone@example.com            # grant
npm run blog:grant-admin -- someone@example.com --revoke   # remove
```

The script keeps any other claims on the account (on root-foundry.com, client
accounts carry a `role` claim). The person has to log out and back in to the
editor before a change takes effect. Credentials: see the end of
[Setup](#setup-on-root-foundrycom). Outside this repo, run
`node blog-module/scripts/grant-blog-admin.mjs <email>` and set
`FIREBASE_PROJECT_ID` if your credentials don't imply the project.

## How caching affects when posts appear

Every page is sent with `Cache-Control: public, max-age=300, s-maxage=3600`:

- `s-maxage=3600`: the CDN (App Hosting's, or Firebase Hosting's) may serve a
  saved copy for up to **1 hour**.
- `max-age=300`: a visitor's browser may reuse its own copy for up to **5 minutes**.

What that means in practice:

| You… | Visitors see it… |
|---|---|
| publish a brand-new post | at its own URL **right away** (nothing was cached there yet). It shows on `/blog`, tag pages, the sitemap and RSS within **about an hour** |
| edit or unpublish a post | within **about an hour**, plus up to 5 minutes for anyone who viewed it recently |
| delete a post | the same: up to about an hour |

That's the trade-off for fast pages and low hosting costs. To shorten it, lower
`cache.cdnMaxAge` (e.g. `300` for five minutes) and redeploy. More visits will
reach the server, but for a small-business blog the extra cost is negligible.
Error responses are sent with `no-store` and never cached.

## Costs: the Blaze plan

Cloud Functions, used by the [Firebase Hosting](#installing-on-another-site)
install, require Firebase's **Blaze (pay-as-you-go)** plan. App Hosting needs
Blaze too, so root-foundry.com is already on it. For a small-business blog,
usage typically stays inside the free monthly allowances (2 million function
calls, 50,000 Firestore reads a day, 5 GB of Storage), especially with the
CDN caching above. Still:

> **Set a budget alert.** Google Cloud console → Billing → *Budgets & alerts* →
> create a budget (e.g. $10/month) with email alerts at 50%, 90% and 100%.
> Alerts don't stop spending, but they tell you early if something unusual
> happens, like a bot crawling every page.

## Installing on another site

You'll need the Firebase CLI (`npm install -g firebase-tools`), a Firebase
project on the Blaze plan, Node 24, and Email/Password sign-in enabled
(Firebase console → Authentication → Sign-in method).

### Common steps (both options)

1. Copy the whole `blog-module/` folder into the site's repo (functions'
   `node_modules/` and `lib/` aren't needed).
2. Edit **`blog-module/blog.config.ts`**: site name and URL, `basePath`,
   colors, fonts, logo, contact URL, share image, CTA text, and the site's
   Firebase web config (Firebase console → Project settings → *Your apps*).
   Replace `headerHtml`/`footerHtml` with the site's own header and footer HTML,
   and their CSS in `brand.extraCss`.
3. **Rules and indexes.** If the project has no rules yet, point `firebase.json`
   at `blog-module/rules/firestore.rules`, `blog-module/rules/storage.rules` and
   `blog-module/rules/firestore.indexes.json`. If it already has rules, copy the
   `posts` and `blog-images` blocks into them, and merge the two indexes into
   its `firestore.indexes.json`.
4. Install and build the function:
   ```bash
   cd blog-module/functions
   npm install
   npm run build
   ```
5. Create an editor account and grant it access (see
   [Granting access](#granting-and-removing-editor-access)).

### Option A: as `/blog` on the site's own domain

Use this when the site is on Firebase Hosting (plain HTML, Vite, Create React
App…) and you want `example.com/blog`. Keep `basePath: '/blog'` and
`siteUrl: 'https://example.com'`.

1. **Build the editor into the folder the site deploys.** For plain HTML sites
   that's the Hosting `public` folder. For Vite or Create React App, use
   `public/` (it's copied into the build):
   ```bash
   node --experimental-strip-types blog-module/scripts/build-admin.mjs public/blog-admin
   ```
   Add it to the site's build script so it stays current, and add
   `public/blog-admin/` to `.gitignore`.
2. **Add the function and rewrites to `firebase.json`.** The blog rewrites must
   come **before** a single-page app's catch-all rewrite:
   ```json
   {
     "hosting": {
       "public": "public",
       "rewrites": [
         { "source": "/blog", "function": { "functionId": "blog", "region": "us-central1" } },
         { "source": "/blog/**", "function": { "functionId": "blog", "region": "us-central1" } },
         { "source": "**", "destination": "/index.html" }
       ]
     },
     "functions": [
       {
         "source": "blog-module/functions",
         "codebase": "blog",
         "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"]
       }
     ],
     "firestore": { "rules": "blog-module/rules/firestore.rules", "indexes": "blog-module/rules/firestore.indexes.json" },
     "storage": { "rules": "blog-module/rules/storage.rules" }
   }
   ```
   (`"public"` is wherever the site's built files are, e.g. `dist` for Vite or
   `build` for Create React App. Leave out the `**` rewrite on a plain HTML site.)
   `/blog-admin` needs no rewrite: Firebase Hosting serves real files before
   applying rewrites, so the editor's `index.html` is found first.
3. **Deploy:**
   ```bash
   firebase deploy --only functions:blog,hosting,firestore:rules,firestore:indexes,storage
   ```
4. Add `Sitemap: https://example.com/blog/sitemap.xml` to the site's
   `robots.txt`, and link to `/blog` from the site's navigation or footer.
5. Check the rest of the site still loads (home page, a couple of inner pages,
   and for single-page apps a deep link that relies on the catch-all).

### Option B: as a subdomain (`blog.example.com`) on its own Hosting site

Use this when the main site isn't on Firebase, or you want the blog separate.

1. In `blog.config.ts`: `siteUrl: 'https://blog.example.com'`, **`basePath: ''`**,
   `adminPath: '/blog-admin'`. Make the header/footer links absolute
   (`https://example.com/...`) so they point back to the main site, and set
   `contactUrl` to the main site's contact page.
2. **Create a second Hosting site** in the same Firebase project and give it a target:
   ```bash
   firebase hosting:sites:create example-blog
   firebase target:apply hosting blog example-blog
   ```
3. **Build the editor** into that site's public folder:
   ```bash
   node --experimental-strip-types blog-module/scripts/build-admin.mjs blog-public/blog-admin
   ```
4. **`firebase.json`**: send every path to the function (static files, such as
   the editor, are still served first):
   ```json
   {
     "hosting": [
       {
         "target": "blog",
         "public": "blog-public",
         "rewrites": [{ "source": "**", "function": { "functionId": "blog", "region": "us-central1" } }]
       }
     ],
     "functions": [
       { "source": "blog-module/functions", "codebase": "blog", "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"] }
     ],
     "firestore": { "rules": "blog-module/rules/firestore.rules", "indexes": "blog-module/rules/firestore.indexes.json" },
     "storage": { "rules": "blog-module/rules/storage.rules" }
   }
   ```
   Pages are then at `blog.example.com/`, `/{slug}`, `/tag/{tag}`,
   `/sitemap.xml` and `/rss.xml`; the editor is at `/blog-admin`.
5. **Deploy:** `firebase deploy --only functions:blog,hosting:blog,firestore:rules,firestore:indexes,storage`
6. **Connect the domain:** Firebase console → Hosting → the blog site →
   *Add custom domain* → `blog.example.com`, and add the DNS records it shows.
7. **Allow the editor to sign in there:** Firebase console → Authentication →
   Settings → *Authorized domains* → add `blog.example.com`.
8. Link to the blog from the main site, and add its sitemap in Google Search Console.

### Next.js (or another Request/Response framework) instead of Hosting

As on root-foundry.com, add two route files:

```ts
// app/blog/[[...path]]/route.ts
import { createBlogFetchHandler } from '@/blog-module/adapters/fetch-handler';
import blogConfig from '@/blog-module/blog.config';
import { getFirestore } from 'firebase-admin/firestore';

export const GET = createBlogFetchHandler(blogConfig, () => getFirestore());
```

```ts
// app/blog-admin/[[...file]]/route.ts
import { createBlogAdminHandler } from '@/blog-module/adapters/admin-handler';
import blogConfig from '@/blog-module/blog.config';

export const GET = createBlogAdminHandler(blogConfig);
```

Then:

- install `marked` and `sanitize-html` in the app;
- in `next.config`, make sure the editor files ship with the server build:
  `outputFileTracingIncludes: { '/blog-admin/**/*': ['./blog-module/admin/*'] }`;
- exclude `blog-module/functions` from the app's `tsconfig.json`.

> **Why a route instead of `public/`:** on Firebase App Hosting, files in
> `public/` weren't reliably served (they returned 404 in production even
> though the build produced them), so the editor is served by a route handler
> that ships with the server code.

## Security

- **Firestore:** anyone can read posts where `status == "published"`. Reading
  drafts, and every create, update and delete, requires the `admin: true` claim.
  Writes are also validated (title, slug format, status, body size, tag count).
- **Storage:** `blog-images/` is publicly readable. Uploads require the admin
  claim, must be PNG, JPEG, WebP or GIF, and at most 5 MB. SVG is refused on
  purpose, because SVG files can carry scripts.
- **Rendering:** Markdown is converted with `marked` and then cleaned by
  `sanitize-html` against an allowlist, so pasted `<script>` tags, `onclick=`
  attributes and `javascript:` links never reach readers. All titles, tags and
  meta values are HTML-escaped, and JSON-LD can't break out of its script tag.
  The editor's preview is sanitized with DOMPurify.
- The editor is `noindex, nofollow`. The Firebase web config in it is public by
  design; the security rules are what protect your data.

## Troubleshooting

- **`/blog` shows "temporarily unavailable" right after setup:** the Firestore
  indexes are still building (step 1), or weren't deployed. The server log
  contains a link that creates the missing index.
- **Editor says "No blog access":** grant the claim, then log out and back in.
- **`grant-blog-admin.mjs` fails with an `adc-troubleshooting/user-creds` link:**
  with `gcloud auth application-default login` credentials, the Auth API needs a
  billing ("quota") project. Set it for the run, e.g. in PowerShell:
  `$env:GOOGLE_CLOUD_QUOTA_PROJECT = "your-project-id"`, or once for good with
  `gcloud auth application-default set-quota-project your-project-id`.
- **"Couldn't reach the server" / login fails on a new domain:** add the domain
  under Authentication → Settings → Authorized domains.
- **Image upload fails:** check the file is PNG/JPG/WebP/GIF under 5 MB, and
  that the Storage rules are deployed.
- **A post doesn't update:** see [caching](#how-caching-affects-when-posts-appear).
  The CDN may serve the previous version for up to an hour.
- **Header looks out of date:** update `headerHtml`/`footerHtml` in `blog.config.ts`.
