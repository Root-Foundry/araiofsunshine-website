import type { DocumentSnapshot, Firestore, Query } from 'firebase-admin/firestore';
import type { Post, PostPage, PostStore } from './types';

// Firestore-backed PostStore. Every query filters on status == "published",
// so drafts can't leak through the public pages even though the Admin SDK
// bypasses security rules.

const COLLECTION = 'posts';

function toDate(value: unknown): Date | undefined {
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'string' || value instanceof Date) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
}

function toPost(doc: DocumentSnapshot): Post {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    title: String(data.title ?? ''),
    slug: String(data.slug ?? ''),
    excerpt: String(data.excerpt ?? ''),
    body: String(data.body ?? ''),
    coverImageUrl: data.coverImageUrl || undefined,
    coverImageAlt: data.coverImageAlt || undefined,
    author: data.author || undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    status: data.status === 'published' ? 'published' : 'draft',
    publishedAt: toDate(data.publishedAt),
    updatedAt: toDate(data.updatedAt),
    seoTitle: data.seoTitle || undefined,
    seoDescription: data.seoDescription || undefined,
  };
}

export function createFirestorePostStore(db: Firestore): PostStore {
  const published = (): Query =>
    db.collection(COLLECTION).where('status', '==', 'published').orderBy('publishedAt', 'desc');

  return {
    async listPublished({ page, perPage, tag }) {
      let query = published();
      if (tag) query = query.where('tags', 'array-contains', tag);
      // One extra post tells us whether there's a next page.
      const snap = await query.offset((page - 1) * perPage).limit(perPage + 1).get();
      const posts = snap.docs.map(toPost);
      return { posts: posts.slice(0, perPage), hasNextPage: posts.length > perPage } satisfies PostPage;
    },

    async getPublishedBySlug(slug) {
      const snap = await db
        .collection(COLLECTION)
        .where('slug', '==', slug)
        .where('status', '==', 'published')
        .limit(1)
        .get();
      return snap.empty ? null : toPost(snap.docs[0]);
    },

    async listAllPublished(limit) {
      const snap = await published().limit(limit).get();
      return snap.docs.map(toPost);
    },
  };
}
