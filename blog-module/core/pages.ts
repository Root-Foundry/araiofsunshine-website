import { absoluteUrl, blogPath, escapeHtml, formatDate, renderDocument } from './html';
import { markdownToText, renderMarkdown } from './markdown';
import type { BlogConfig, Post, PostPage } from './types';

function postUrl(config: BlogConfig, post: Post): string {
  return blogPath(config, post.slug);
}

function postDescription(post: Post): string {
  return post.seoDescription || post.excerpt || markdownToText(post.body);
}

function tagList(config: BlogConfig, tags: string[]): string {
  if (tags.length === 0) return '';
  return `<ul class="blog-tags" aria-label="Tags">${tags
    .map((tag) => `<li><a href="${escapeHtml(blogPath(config, 'tag', tag))}">${escapeHtml(tag)}</a></li>`)
    .join('')}</ul>`;
}

function postCard(config: BlogConfig, post: Post): string {
  const url = escapeHtml(postUrl(config, post));
  const cover = post.coverImageUrl
    ? `<a href="${url}" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(post.coverImageUrl)}" alt="" loading="lazy" decoding="async" width="1200" height="675"></a>`
    : '';
  const date = post.publishedAt
    ? `<time datetime="${post.publishedAt.toISOString()}">${formatDate(config, post.publishedAt)}</time>`
    : '';
  return `<li><article class="blog-card">${cover}<div class="blog-card-body">
<p class="blog-meta">${date}</p>
<h2><a href="${url}">${escapeHtml(post.title)}</a></h2>
<p>${escapeHtml(post.excerpt || markdownToText(post.body))}</p>
${tagList(config, post.tags)}
</div></article></li>`;
}

function pagination(config: BlogConfig, basePath: string, page: number, hasNextPage: boolean): string {
  if (page === 1 && !hasNextPage) return '';
  const href = (n: number) => escapeHtml(n === 1 ? basePath : `${basePath}?page=${n}`);
  const newer = page > 1 ? `<a class="blog-btn blog-btn-outline" href="${href(page - 1)}" rel="prev">← Newer posts</a>` : '<span></span>';
  const older = hasNextPage ? `<a class="blog-btn blog-btn-outline" href="${href(page + 1)}" rel="next">Older posts →</a>` : '<span></span>';
  return `<nav class="blog-pagination" aria-label="Pagination">${newer}${older}</nav>`;
}

function withPage(url: string, page: number): string {
  return page > 1 ? `${url}?page=${page}` : url;
}

export function renderIndexPage(config: BlogConfig, result: PostPage, page: number): string {
  const path = blogPath(config);
  const title = page > 1 ? `${config.blogTitle} – Page ${page}` : config.blogTitle;
  const list = result.posts.length
    ? `<ul class="blog-list">${result.posts.map((post) => postCard(config, post)).join('')}</ul>`
    : '<p class="blog-empty">No posts yet — check back soon.</p>';

  return renderDocument(
    config,
    {
      title,
      description: config.blogDescription,
      url: withPage(path, page),
      type: 'website',
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: config.blogTitle,
          description: config.blogDescription,
          url: absoluteUrl(config, path),
          publisher: { '@type': 'Organization', name: config.siteName, logo: absoluteUrl(config, config.logoUrl) },
        },
      ],
    },
    `<div class="blog-hero">
<p class="blog-eyebrow">${escapeHtml(config.siteName)}</p>
<h1>${escapeHtml(config.blogTitle)}</h1>
<p>${escapeHtml(config.blogDescription)}</p>
</div>
${list}
${pagination(config, path, page, result.hasNextPage)}`,
  );
}

// A tag page listing only a post or two is thin content, so it stays out of search
// results until the tag has at least this many posts.
const MIN_INDEXED_TAG_POSTS = 3;

export function renderTagPage(config: BlogConfig, tag: string, result: PostPage, page: number): string {
  const path = blogPath(config, 'tag', tag);
  return renderDocument(
    config,
    {
      title: `Posts tagged “${tag}” | ${config.blogTitle}`,
      description: `${config.blogTitle} posts about ${tag}.`,
      url: withPage(path, page),
      type: 'website',
      noindex: page === 1 && !result.hasNextPage && result.posts.length < MIN_INDEXED_TAG_POSTS,
    },
    `<div class="blog-hero">
<p class="blog-eyebrow"><a href="${escapeHtml(blogPath(config))}">${escapeHtml(config.blogTitle)}</a></p>
<h1>Posts tagged “${escapeHtml(tag)}”</h1>
</div>
<ul class="blog-list">${result.posts.map((post) => postCard(config, post)).join('')}</ul>
${pagination(config, path, page, result.hasNextPage)}`,
  );
}

export function renderPostPage(config: BlogConfig, post: Post): string {
  const url = postUrl(config, post);
  const author = post.author || config.defaultAuthor;
  const description = postDescription(post);
  const date = post.publishedAt
    ? `<time datetime="${post.publishedAt.toISOString()}">${formatDate(config, post.publishedAt)}</time>`
    : '';
  // The cover is the largest thing on screen, so it loads eagerly; images in the body stay lazy.
  const cover = post.coverImageUrl
    ? `<img class="blog-cover" src="${escapeHtml(post.coverImageUrl)}" alt="${escapeHtml(post.coverImageAlt || '')}" fetchpriority="high" decoding="async" width="1200" height="675">`
    : '';

  return renderDocument(
    config,
    {
      title: post.seoTitle || `${post.title} | ${config.siteName}`,
      description,
      url,
      image: post.coverImageUrl,
      imageAlt: post.coverImageAlt,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description,
          url: absoluteUrl(config, url),
          mainEntityOfPage: absoluteUrl(config, url),
          image: absoluteUrl(config, post.coverImageUrl || config.defaultShareImage),
          datePublished: post.publishedAt?.toISOString(),
          dateModified: (post.updatedAt ?? post.publishedAt)?.toISOString(),
          author: { '@type': 'Person', name: author },
          publisher: { '@type': 'Organization', name: config.siteName, logo: { '@type': 'ImageObject', url: absoluteUrl(config, config.logoUrl) } },
          keywords: post.tags.join(', ') || undefined,
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: config.blogTitle, item: absoluteUrl(config, blogPath(config)) },
            { '@type': 'ListItem', position: 2, name: post.title, item: absoluteUrl(config, url) },
          ],
        },
      ],
    },
    `<article class="blog-article blog-narrow">
<header>
<p class="blog-eyebrow"><a href="${escapeHtml(blogPath(config))}">${escapeHtml(config.blogTitle)}</a></p>
<h1>${escapeHtml(post.title)}</h1>
<p class="blog-meta">${date}${date ? ' · ' : ''}By ${escapeHtml(author)}</p>
${tagList(config, post.tags)}
</header>
${cover}
<div class="blog-body">${renderMarkdown(post.body, config.siteUrl)}</div>
<aside class="blog-cta" aria-labelledby="blog-cta-heading">
<h2 id="blog-cta-heading">${escapeHtml(config.cta.heading)}</h2>
<p>${escapeHtml(config.cta.text)}</p>
<a class="blog-btn" href="${escapeHtml(config.contactUrl)}">${escapeHtml(config.cta.buttonLabel)}</a>
</aside>
<a class="blog-back" href="${escapeHtml(blogPath(config))}">← All posts</a>
</article>`,
  );
}

export function renderNotFoundPage(config: BlogConfig, path: string): string {
  return renderDocument(
    config,
    {
      title: `Page not found | ${config.siteName}`,
      description: 'This page could not be found.',
      url: path,
      type: 'website',
      noindex: true,
    },
    `<div class="blog-404 blog-narrow">
<p class="blog-eyebrow">404</p>
<h1>We couldn’t find that post</h1>
<p>It may have been moved or unpublished. Browse the latest posts instead.</p>
<a class="blog-btn" href="${escapeHtml(blogPath(config))}">Go to the blog</a>
</div>`,
  );
}

function xmlEscape(value: string): string {
  return escapeHtml(value).replace(/&#39;/g, '&apos;');
}

export function renderSitemap(config: BlogConfig, posts: Post[]): string {
  const latest = posts[0]?.updatedAt ?? posts[0]?.publishedAt;
  const entries = [
    { loc: absoluteUrl(config, blogPath(config)), lastmod: latest },
    ...posts.map((post) => ({ loc: absoluteUrl(config, postUrl(config, post)), lastmod: post.updatedAt ?? post.publishedAt })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((e) => `<url><loc>${xmlEscape(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod.toISOString()}</lastmod>` : ''}</url>`)
  .join('\n')}
</urlset>`;
}

export function renderRss(config: BlogConfig, posts: Post[]): string {
  const blogUrl = absoluteUrl(config, blogPath(config));
  const items = posts
    .map((post) => {
      const link = absoluteUrl(config, postUrl(config, post));
      return `<item>
<title>${xmlEscape(post.title)}</title>
<link>${xmlEscape(link)}</link>
<guid isPermaLink="true">${xmlEscape(link)}</guid>
${post.publishedAt ? `<pubDate>${post.publishedAt.toUTCString()}</pubDate>` : ''}
<description>${xmlEscape(postDescription(post))}</description>
${post.tags.map((tag) => `<category>${xmlEscape(tag)}</category>`).join('')}
</item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${xmlEscape(config.blogTitle)}</title>
<link>${xmlEscape(blogUrl)}</link>
<description>${xmlEscape(config.blogDescription)}</description>
<language>${xmlEscape(config.language)}</language>
<atom:link href="${xmlEscape(absoluteUrl(config, blogPath(config, 'rss.xml')))}" rel="self" type="application/rss+xml"/>
${items}
</channel>
</rss>`;
}
