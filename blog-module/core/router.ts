import { renderIndexPage, renderNotFoundPage, renderPostPage, renderRss, renderSitemap, renderTagPage } from './pages';
import type { BlogConfig, BlogResponse, PostStore } from './types';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FEED_LIMIT = 1000;
const RSS_LIMIT = 50;

function cacheControl(config: BlogConfig): string {
  return `public, max-age=${config.cache.browserMaxAge}, s-maxage=${config.cache.cdnMaxAge}`;
}

function respond(config: BlogConfig, status: number, contentType: string, body: string): BlogResponse {
  return {
    status,
    headers: { 'Content-Type': `${contentType}; charset=utf-8`, 'Cache-Control': cacheControl(config) },
    body,
  };
}

function parsePage(searchParams: URLSearchParams): number | null {
  const raw = searchParams.get('page');
  if (raw === null) return 1;
  const page = Number(raw);
  return Number.isInteger(page) && page >= 1 && page <= 1000 ? page : null;
}

/**
 * Handles every request under the blog's base path. `pathname` is the full
 * request path (e.g. "/blog/my-post"); adapters only translate to and from
 * their framework's request and response objects.
 */
export async function handleBlogRequest(
  config: BlogConfig,
  store: PostStore,
  pathname: string,
  searchParams: URLSearchParams,
): Promise<BlogResponse> {
  const notFound = () => respond(config, 404, 'text/html', renderNotFoundPage(config, pathname));

  if (config.basePath && pathname !== config.basePath && !pathname.startsWith(`${config.basePath}/`)) {
    return notFound();
  }

  let segments: string[];
  try {
    segments = pathname
      .slice(config.basePath.length)
      .split('/')
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment));
  } catch {
    return notFound(); // malformed percent-encoding
  }

  const page = parsePage(searchParams);
  if (page === null) return notFound();

  // /blog
  if (segments.length === 0) {
    const result = await store.listPublished({ page, perPage: config.postsPerPage });
    if (page > 1 && result.posts.length === 0) return notFound();
    return respond(config, 200, 'text/html', renderIndexPage(config, result, page));
  }

  // /blog/sitemap.xml, /blog/rss.xml
  if (segments.length === 1 && segments[0] === 'sitemap.xml') {
    return respond(config, 200, 'application/xml', renderSitemap(config, await store.listAllPublished(FEED_LIMIT)));
  }
  if (segments.length === 1 && segments[0] === 'rss.xml') {
    return respond(config, 200, 'application/rss+xml', renderRss(config, await store.listAllPublished(RSS_LIMIT)));
  }

  // /blog/tag/{tag}
  if (segments.length === 2 && segments[0] === 'tag') {
    const tag = segments[1].trim();
    if (!tag) return notFound();
    const result = await store.listPublished({ page, perPage: config.postsPerPage, tag });
    if (result.posts.length === 0) return notFound();
    return respond(config, 200, 'text/html', renderTagPage(config, tag, result, page));
  }

  // /blog/{slug}
  if (segments.length === 1 && SLUG_PATTERN.test(segments[0])) {
    const post = await store.getPublishedBySlug(segments[0]);
    if (!post) return notFound();
    return respond(config, 200, 'text/html', renderPostPage(config, post));
  }

  return notFound();
}
