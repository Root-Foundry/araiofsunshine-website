// Creates one sample DRAFT post so you can try the whole flow: open it in the
// editor, preview, publish, view it on the blog, then unpublish or delete it.
//
//   node --experimental-strip-types blog-module/scripts/seed-sample-post.mjs
//
// Same credentials as grant-blog-admin.mjs. Writes to the project in
// blog.config.ts unless FIREBASE_PROJECT_ID is set. Safe to re-run: it skips
// if the sample's slug already exists.

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const moduleDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { default: config } = await import(pathToFileURL(path.join(moduleDir, 'blog.config.ts')).href);

initializeApp({
  credential: applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID || config.firebase.projectId,
});
const db = getFirestore();

const slug = 'how-much-does-a-website-cost-in-tallahassee';

const body = `If you run a small business in Tallahassee, you have probably heard website quotes that range from "my nephew can do it" to five figures. Here is what actually drives the price, and what you should expect to get for it.

## What affects the cost of a website

- **Number of pages.** A home page, services, about and contact page cover most small businesses. Every extra page is more design and writing.
- **Custom features.** Online booking, e-commerce, member logins and integrations take real development time and are usually quoted separately.
- **Who writes the content.** Having your text and photos ready keeps a project moving.
- **What happens after launch.** Hosting, updates, backups and security monitoring are ongoing costs, so ask what is included and for how long.

## What a flat-rate website includes

At Root Foundry, a standard website of up to 5 pages is **$400 flat**, plus $100 for each additional page. That includes:

1. A custom, mobile-friendly design built around your business
2. A basic SEO setup so Google can find and understand your site
3. Contact form setup and testing
4. Six months of free hosting and management after launch

You own your domain, hosting account, and site files.

## Questions to ask any web designer

> Get the full price, in writing, before any work starts.

- Is the price flat, or hourly?
- How many revision rounds are included?
- Who owns the domain and the site when we're done?
- What does hosting and maintenance cost after launch?

## The bottom line

A good small-business website does not have to be expensive, but it should be clear about what you are paying for. If you'd like a written quote for your business, [get in touch](${config.contactUrl}).
`;

const existing = await db.collection('posts').where('slug', '==', slug).limit(1).get();
if (!existing.empty) {
  console.log(`Sample post already exists (id ${existing.docs[0].id}). Nothing to do.`);
  process.exit(0);
}

const ref = await db.collection('posts').add({
  title: 'How Much Does a Website Cost in Tallahassee?',
  slug,
  excerpt:
    'What drives the price of a small-business website, what a flat-rate site should include, and the questions to ask before you hire anyone.',
  body,
  coverImageUrl: '',
  coverImageAlt: '',
  author: config.defaultAuthor,
  tags: ['web design', 'pricing', 'tallahassee'],
  status: 'draft',
  seoTitle: 'How Much Does a Website Cost in Tallahassee? | Root Foundry',
  seoDescription:
    'What a small-business website costs in Tallahassee, what a flat-rate site should include, and questions to ask any web designer.',
  updatedAt: FieldValue.serverTimestamp(),
});

console.log(`Created sample draft "${slug}" (id ${ref.id}). Open ${config.siteUrl}${config.adminPath} to edit and publish it.`);
