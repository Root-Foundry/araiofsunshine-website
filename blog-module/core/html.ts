import { blogStyles } from './styles';
import type { BlogConfig } from './types';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** JSON for a <script type="application/ld+json"> block; "<" can't close the tag. */
export function jsonLd(data: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

export function absoluteUrl(config: BlogConfig, pathOrUrl: string): string {
  return /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${config.siteUrl}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

export function blogPath(config: BlogConfig, ...segments: string[]): string {
  const path = [config.basePath, ...segments.map(encodeURIComponent)].join('/').replace(/\/+/g, '/');
  return path === '' ? '/' : path;
}

export function formatDate(config: BlogConfig, date: Date): string {
  return new Intl.DateTimeFormat(config.language, { dateStyle: 'long', timeZone: config.timeZone }).format(date);
}

function fillTemplate(config: BlogConfig, template: string): string {
  const values: Record<string, string> = {
    siteUrl: config.siteUrl,
    basePath: config.basePath,
    contactUrl: config.contactUrl,
    logoUrl: config.logoUrl,
    year: String(new Date().getFullYear()),
  };
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => values[key] ?? match);
}

export interface PageMeta {
  title: string;
  description: string;
  /** Path or absolute URL; becomes the canonical and og:url. */
  url: string;
  image?: string;
  imageAlt?: string;
  type: 'website' | 'article';
  publishedTime?: Date;
  modifiedTime?: Date;
  noindex?: boolean;
  structuredData?: unknown[];
}

// Everything crawlers and link previewers need is in this initial HTML;
// none of it depends on JavaScript.
export function renderDocument(config: BlogConfig, meta: PageMeta, content: string): string {
  const url = absoluteUrl(config, meta.url);
  const image = absoluteUrl(config, meta.image || config.defaultShareImage);
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    meta.noindex ? '<meta name="robots" content="noindex">' : '',
    `<meta property="og:site_name" content="${escapeHtml(config.siteName)}">`,
    `<meta property="og:type" content="${meta.type}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:image" content="${escapeHtml(image)}">`,
    meta.imageAlt ? `<meta property="og:image:alt" content="${escapeHtml(meta.imageAlt)}">` : '',
    meta.publishedTime ? `<meta property="article:published_time" content="${meta.publishedTime.toISOString()}">` : '',
    meta.modifiedTime ? `<meta property="article:modified_time" content="${meta.modifiedTime.toISOString()}">` : '',
    '<meta name="twitter:card" content="summary_large_image">',
    config.twitterHandle ? `<meta name="twitter:site" content="${escapeHtml(config.twitterHandle)}">` : '',
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${escapeHtml(image)}">`,
    `<meta name="twitter:url" content="${escapeHtml(url)}">`,
    `<link rel="alternate" type="application/rss+xml" title="${escapeHtml(config.blogTitle)}" href="${escapeHtml(absoluteUrl(config, blogPath(config, 'rss.xml')))}">`,
    ...(meta.structuredData ?? []).map(jsonLd),
  ].filter(Boolean);

  const fonts = config.brand.fonts.googleFontsUrl
    ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${escapeHtml(config.brand.fonts.googleFontsUrl)}">`
    : '';

  return `<!doctype html>
<html lang="${escapeHtml(config.language)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${tags.join('\n')}
${fonts}
<style>${blogStyles(config)}</style>
</head>
<body>
<a class="blog-skip" href="#main">Skip to content</a>
${fillTemplate(config, config.headerHtml)}
<main id="main" class="blog-main">
${content}
</main>
${fillTemplate(config, config.footerHtml)}
</body>
</html>`;
}
