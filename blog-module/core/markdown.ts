import { Marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const marked = new Marked({ gfm: true, breaks: false });

// Post bodies are written by admins, but they still pass through an allowlist:
// a pasted <script> or onclick= must never reach readers.
function sanitizeOptions(siteUrl: string): sanitizeHtml.IOptions {
  return {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'img',
      'h1',
      'h2',
      'figure',
      'figcaption',
      'del',
      'ins',
      'sup',
      'sub',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
      code: ['class'],
      th: ['align'],
      td: ['align'],
      input: ['type', 'checked', 'disabled'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    transformTags: {
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: 'lazy', decoding: 'async', alt: attribs.alt ?? '' },
      }),
      // Links to other sites open in a new tab; links to our own site don't.
      a: (tagName, attribs) => {
        const href = attribs.href || '';
        const external = /^https?:\/\//i.test(href) && !href.startsWith(siteUrl);
        return { tagName, attribs: external ? { ...attribs, target: '_blank', rel: 'noopener' } : attribs };
      },
    },
  };
}

export function renderMarkdown(markdown: string, siteUrl: string): string {
  return sanitizeHtml(marked.parse(markdown, { async: false }) as string, sanitizeOptions(siteUrl));
}

/** Plain-text summary of a post body, for posts with no excerpt. */
export function markdownToText(markdown: string, maxLength = 160): string {
  const text = sanitizeHtml(marked.parse(markdown, { async: false }) as string, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, '')}…` : text;
}
