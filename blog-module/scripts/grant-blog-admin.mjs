// Grants (or revokes) blog editing access by setting the `admin: true` custom
// claim on a Firebase Auth user.
//
//   node blog-module/scripts/grant-blog-admin.mjs someone@example.com
//   node blog-module/scripts/grant-blog-admin.mjs someone@example.com --revoke
//
// Credentials: set GOOGLE_APPLICATION_CREDENTIALS to a service-account key
// file, or run `gcloud auth application-default login` first. Set
// FIREBASE_PROJECT_ID (or GOOGLE_CLOUD_PROJECT) if the key doesn't imply it.
//
// The user must already exist (Firebase console > Authentication > Add user).
// Existing claims (e.g. a client portal's role) are kept.

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const [email, flag] = process.argv.slice(2);
if (!email || (flag && flag !== '--revoke')) {
  console.error('Usage: node blog-module/scripts/grant-blog-admin.mjs <email> [--revoke]');
  process.exit(1);
}
const revoke = flag === '--revoke';

initializeApp({
  credential: applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
});
const auth = getAuth();

try {
  const user = await auth.getUserByEmail(email);
  const claims = { ...(user.customClaims ?? {}) };
  if (revoke) delete claims.admin;
  else claims.admin = true;
  await auth.setCustomUserClaims(user.uid, claims);
  console.log(`${revoke ? 'Revoked' : 'Granted'} blog admin for ${email} (uid ${user.uid}).`);
  console.log('They need to log out and back in to the blog editor for this to take effect.');
} catch (error) {
  if (error?.code === 'auth/user-not-found') {
    console.error(`No user with email ${email}. Create one first: Firebase console > Authentication > Add user.`);
  } else {
    console.error('Failed:', error?.message ?? error);
  }
  process.exit(1);
}
