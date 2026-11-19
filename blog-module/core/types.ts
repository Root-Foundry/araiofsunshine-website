// Shared types for the blog module. No framework or Firebase imports, so the
// core works the same under the Next.js adapter and the Cloud Function.

export type PostStatus = 'draft' | 'published';

/** A post as stored in the Firestore "posts" collection. */
export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string; // Markdown
  coverImageUrl?: string;
  coverImageAlt?: string;
  author?: string;
  tags: string[];
  status: PostStatus;
  publishedAt?: Date;
  updatedAt?: Date;
  seoTitle?: string;
  seoDescription?: string;
}

export interface PostPage {
  posts: Post[];
  hasNextPage: boolean;
}

/** Read-only access to published posts. Drafts are never returned. */
export interface PostStore {
  listPublished(options: { page: number; perPage: number; tag?: string }): Promise<PostPage>;
  getPublishedBySlug(slug: string): Promise<Post | null>;
  /** Every published post, newest first, for the sitemap and RSS feed. */
  listAllPublished(limit: number): Promise<Post[]>;
}

export interface BlogConfig {
  /** Business name, used in titles, JSON-LD and the RSS feed. */
  siteName: string;
  /** Origin of the site the blog lives on, without a trailing slash. */
  siteUrl: string;
  /** Path the blog is served under, e.g. "/blog". Use "" for a blog subdomain. */
  basePath: string;
  /** Path of the admin editor, e.g. "/blog-admin". */
  adminPath: string;
  language: string;
  /** IANA time zone used to display post dates. */
  timeZone: string;

  blogTitle: string;
  blogDescription: string;
  postsPerPage: number;
  /** Used when a post has no author set. */
  defaultAuthor: string;

  contactUrl: string;
  logoUrl: string;
  /** Social share image for pages and posts without a cover image (1200x630 recommended). */
  defaultShareImage: string;
  twitterHandle?: string;

  brand: {
    colors: {
      background: string;
      surface: string;
      text: string;
      muted: string;
      accent: string;
      /** Text color on top of the accent color (buttons). */
      accentText: string;
      border: string;
    };
    fonts: {
      body: string;
      heading: string;
      /** Optional Google Fonts stylesheet URL for the fonts above. */
      googleFontsUrl?: string;
    };
    /** Extra CSS appended after the blog styles, e.g. for the header/footer templates. */
    extraCss?: string;
  };

  /** Call-to-action block at the end of every article. */
  cta: { heading: string; text: string; buttonLabel: string };

  /**
   * Header and footer HTML wrapped around every page. Placeholders:
   * {{siteUrl}}, {{basePath}}, {{contactUrl}}, {{logoUrl}}, {{year}}.
   */
  headerHtml: string;
  footerHtml: string;

  cache: {
    /** Seconds browsers may reuse a page (max-age). */
    browserMaxAge: number;
    /** Seconds a CDN may reuse a page (s-maxage). */
    cdnMaxAge: number;
  };

  /** Public Firebase web config for the admin editor. Safe to publish. */
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    appId: string;
  };
}

export interface BlogResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}
