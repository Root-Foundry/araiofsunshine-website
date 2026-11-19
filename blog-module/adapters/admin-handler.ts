import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { BlogConfig } from '../core/types';

/**
 * Serves the admin editor (blog-module/admin) from a route handler instead of
 * static files, for hosts where public/ is unreliable or a build step is
 * unwanted (e.g. Next.js on Firebase App Hosting). config.js is generated from
 * the config on each request, so there's nothing to build.
 *
 * In Next.js, add app/blog-admin/[[...file]]/route.ts:
 *   export const GET = createBlogAdminHandler(config);
 *
 * Static hosts (Firebase Hosting, plain HTML) should use scripts/build-admin.mjs instead.
 */

// `new URL(..., import.meta.url)` lets the bundler see and ship these files.
const FILES = {
  'index.html': { url: new URL('../admin/index.html', import.meta.url), type: 'text/html; charset=utf-8' },
  'admin.js': { url: new URL('../admin/admin.js', import.meta.url), type: 'text/javascript; charset=utf-8' },
  'admin.css': { url: new URL('../admin/admin.css', import.meta.url), type: 'text/css; charset=utf-8' },
} as const;

export function browserConfig(config: BlogConfig) {
  return {
    siteName: config.siteName,
    siteUrl: config.siteUrl,
    basePath: config.basePath,
    logoUrl: config.logoUrl,
    defaultAuthor: config.defaultAuthor,
    firebase: config.firebase,
  };
}

export function createBlogAdminHandler(config: BlogConfig) {
  const headers = (type: string) => ({
    'Content-Type': type,
    // Editors should always get the latest editor code.
    'Cache-Control': 'no-cache',
    'X-Robots-Tag': 'noindex, nofollow',
  });

  return async function GET(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    const name = pathname.slice(config.adminPath.length).replace(/^\/+/, '') || 'index.html';

    if (name === 'config.js') {
      return new Response(`window.BLOG_CONFIG = ${JSON.stringify(browserConfig(config))};\n`, {
        headers: headers('text/javascript; charset=utf-8'),
      });
    }

    const file = FILES[name as keyof typeof FILES];
    if (!file) return new Response('Not found', { status: 404, headers: headers('text/plain; charset=utf-8') });

    let body = await readFile(fileURLToPath(file.url), 'utf8');
    if (name === 'index.html') {
      // Absolute asset paths, so the page works with or without a trailing slash.
      body = body.replace(/(href|src)="(admin\.css|admin\.js|config\.js)"/g, `$1="${config.adminPath}/$2"`);
    }
    return new Response(body, { headers: headers(file.type) });
  };
}
