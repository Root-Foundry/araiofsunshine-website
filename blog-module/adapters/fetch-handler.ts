import type { Firestore } from 'firebase-admin/firestore';
import { createFirestorePostStore } from '../core/firestore-store';
import { handleBlogRequest } from '../core/router';
import type { BlogConfig } from '../core/types';

/**
 * Adapter for frameworks with web-standard route handlers (Request in,
 * Response out): Next.js App Router, Remix, Astro, Cloudflare-style workers.
 *
 * In Next.js, add app/blog/[[...path]]/route.ts:
 *   export const GET = createBlogFetchHandler(config, () => getFirestore());
 */
export function createBlogFetchHandler(config: BlogConfig, getDb: () => Firestore) {
  return async function GET(request: Request): Promise<Response> {
    const url = new URL(request.url);
    try {
      const store = createFirestorePostStore(getDb());
      const result = await handleBlogRequest(config, store, url.pathname, url.searchParams);
      return new Response(result.body, { status: result.status, headers: result.headers });
    } catch (error) {
      console.error('Blog request failed:', url.pathname, error);
      // Never cache an error page.
      return new Response('The blog is temporarily unavailable. Please try again shortly.', {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
  };
}
