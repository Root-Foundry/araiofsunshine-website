// Builds the "blog" Cloud Function. Firebase deploys only this folder, so the
// shared core and the site config are copied in first, then everything is
// bundled into lib/index.js (Firebase packages stay external; they're
// installed from package.json at deploy time).

import { execSync } from 'node:child_process';
import { cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const moduleDir = path.resolve(here, '..');
const shared = path.join(here, 'src', 'shared');

await rm(shared, { recursive: true, force: true });
await cp(path.join(moduleDir, 'core'), path.join(shared, 'core'), { recursive: true });
await cp(path.join(moduleDir, 'blog.config.ts'), path.join(shared, 'blog.config.ts'));

execSync('npx tsc -p tsconfig.json', { cwd: here, stdio: 'inherit' });

await build({
  entryPoints: [path.join(here, 'src', 'index.ts')],
  outfile: path.join(here, 'lib', 'index.js'),
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  external: ['firebase-admin', 'firebase-functions'],
  logLevel: 'info',
});
