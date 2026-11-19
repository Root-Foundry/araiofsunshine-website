// Grants (or revokes) blog editor access on THIS site's project. Wraps blog-module/scripts/grant-blog-admin.mjs
// so it never falls back to gcloud's default project, which may be a different app with its own users.
//   npm run blog:grant-admin -- someone@example.com            grant
//   npm run blog:grant-admin -- someone@example.com --revoke   revoke
process.env.FIREBASE_PROJECT_ID = 'araiofsunshine';
console.log('Project: araiofsunshine');
await import('../blog-module/scripts/grant-blog-admin.mjs');
