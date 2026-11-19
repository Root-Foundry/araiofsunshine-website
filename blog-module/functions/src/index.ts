import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import config from './shared/blog.config';
import { createFirestorePostStore } from './shared/core/firestore-store';
import { handleBlogRequest } from './shared/core/router';

// The blog as a 2nd-gen Cloud Function, for sites on Firebase Hosting.
// firebase.json rewrites /blog and /blog/** here (see ../README.md).

initializeApp();
const store = createFirestorePostStore(getFirestore());

export const blog = onRequest(
  // Same region as this project's Firestore database and its other functions.
  { region: 'us-east4', memory: '256MiB', maxInstances: 10, concurrency: 80 },
  async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.set('Allow', 'GET, HEAD').status(405).send('Method not allowed');
      return;
    }
    const url = new URL(req.originalUrl || req.url, config.siteUrl);
    try {
      const result = await handleBlogRequest(config, store, url.pathname, url.searchParams);
      res.status(result.status).set(result.headers).send(result.body);
    } catch (error) {
      console.error('Blog request failed:', url.pathname, error);
      res.status(500).set('Cache-Control', 'no-store').type('text/plain').send('The blog is temporarily unavailable. Please try again shortly.');
    }
  },
);
