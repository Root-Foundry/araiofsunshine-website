// Blog editor. Plain JavaScript + the Firebase JS SDK from Google's CDN, so it
// works on any site, React or not. Site settings come from config.js, which
// scripts/build-admin.mjs generates from blog.config.ts.
//
// Security is enforced by Firestore and Storage rules (admin claim required to
// write); the checks here are only for a friendly experience.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-storage.js';

const cfg = window.BLOG_CONFIG;
const app = initializeApp(cfg.firebase);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const POSTS = 'posts';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
// Covers display at most 760px wide, so this stays sharp on high-density screens.
const MAX_IMAGE_WIDTH = 1600;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Editor state.
let currentId = null;
let currentStatus = 'draft';
let slugEdited = false;
let coverUrl = '';
let dirty = false;

const $ = (id) => document.getElementById(id);
const views = ['loading', 'login', 'noaccess', 'list', 'editor'];

// ---------- Small helpers ----------

function show(view) {
  for (const name of views) $(`view-${name}`).hidden = name !== view;
  window.scrollTo(0, 0);
}

let toastTimer;
function toast(message, isError = false) {
  const el = $('toast');
  el.textContent = message;
  el.classList.toggle('error', isError);
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), isError ? 7000 : 4000);
}

function slugify(text) {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

function parseTags(text) {
  const seen = new Set();
  return text
    .split(',')
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, ' '))
    .filter((t) => t && !seen.has(t) && seen.add(t));
}

function postUrl(slug) {
  return `${cfg.siteUrl}${cfg.basePath}/${slug}`;
}

function formatDate(value) {
  const date = value?.toDate ? value.toDate() : null;
  return date ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
}

function friendlyError(error) {
  const code = error?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'That email and password don’t match. Check them and try again.';
  }
  if (code.includes('too-many-requests')) return 'Too many attempts. Wait a few minutes and try again.';
  if (code.includes('permission-denied') || code.includes('unauthorized')) {
    return 'You don’t have permission to do that. Try logging out and back in.';
  }
  if (code.includes('network') || code.includes('unavailable')) return 'Couldn’t reach the server. Check your connection.';
  return 'Something went wrong. Please try again.';
}

function hasTransparency(ctx, width, height) {
  const { data } = ctx.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
  return false;
}

// Images straight from a phone or a design tool can be megabytes (a 2 MB PNG cover
// slows the whole post page), so scale them down and re-encode before upload.
// GIFs go up untouched since they may be animated.
async function shrinkImage(file) {
  if (file.type === 'image/gif') return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_WIDTH / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  // JPEG works in every link preview; WebP only when there's transparency to keep.
  const type = file.type !== 'image/jpeg' && hasTransparency(ctx, width, height) ? 'image/webp' : 'image/jpeg';
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.85));
  // Keep the original if the browser can't encode the type or it came out larger.
  if (!blob || blob.type !== type || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.[^.]*$/, '') + (type === 'image/webp' ? '.webp' : '.jpg'), { type });
}

async function uploadImage(original) {
  if (!IMAGE_TYPES.includes(original.type)) throw new Error('Please choose a PNG, JPG, WebP or GIF image.');
  if (original.size > MAX_IMAGE_BYTES) throw new Error('That image is over 5 MB. Please choose a smaller one.');
  const file = await shrinkImage(original);
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-60);
  const fileRef = ref(storage, `blog-images/${Date.now()}-${safeName}`);
  await uploadBytes(fileRef, file, { contentType: file.type, cacheControl: 'public, max-age=31536000' });
  return getDownloadURL(fileRef);
}

// ---------- Site branding ----------

$('site-name').textContent = cfg.siteName;
$('site-logo').src = cfg.logoUrl;
$('site-link').href = `${cfg.siteUrl}${cfg.basePath}`;
$('slug-prefix').textContent = `${cfg.siteUrl.replace(/^https?:\/\//, '')}${cfg.basePath}/`;
document.title = `Blog Editor · ${cfg.siteName}`;

// ---------- Auth ----------

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    $('account').hidden = true;
    show('login');
    return;
  }
  $('account').hidden = false;
  $('account-email').textContent = user.email || '';
  // Force-refresh so a newly granted admin claim is picked up.
  const token = await user.getIdTokenResult(true);
  if (token.claims.admin !== true) {
    show('noaccess');
    return;
  }
  await loadPosts();
});

$('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = $('login-btn');
  $('login-error').hidden = true;
  button.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, $('login-email').value.trim(), $('login-password').value);
  } catch (error) {
    $('login-error').textContent = friendlyError(error);
    $('login-error').hidden = false;
  } finally {
    button.disabled = false;
  }
});

$('forgot-btn').addEventListener('click', async () => {
  const email = $('login-email').value.trim();
  if (!email) {
    $('login-error').textContent = 'Enter your email above first, then tap “Forgot your password?” again.';
    $('login-error').hidden = false;
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
  } catch {
    // Same message either way, so this can't be used to discover accounts.
  }
  toast('If that email has an account, a reset link is on its way.');
});

async function logOut() {
  if (dirty && !confirm('You have unsaved changes. Log out anyway?')) return;
  dirty = false;
  await signOut(auth);
}
$('logout-btn').addEventListener('click', logOut);
$('noaccess-logout').addEventListener('click', logOut);

// ---------- Post list ----------

async function loadPosts() {
  show('loading');
  try {
    const snap = await getDocs(query(collection(db, POSTS), orderBy('updatedAt', 'desc')));
    const list = $('post-list');
    list.replaceChildren();
    $('list-empty').hidden = !snap.empty;
    for (const d of snap.docs) {
      const post = d.data();
      const published = post.status === 'published';
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'post-item';
      const left = document.createElement('span');
      const title = document.createElement('span');
      title.className = 'post-item-title';
      title.textContent = post.title || '(Untitled)';
      const date = document.createElement('span');
      date.className = 'post-item-date';
      date.textContent = published ? `Published ${formatDate(post.publishedAt)}` : `Edited ${formatDate(post.updatedAt)}`;
      left.append(title, date);
      const badge = document.createElement('span');
      badge.className = `badge${published ? ' published' : ''}`;
      badge.textContent = published ? 'Published' : 'Draft';
      button.append(left, badge);
      button.addEventListener('click', () => openEditor(d.id));
      li.append(button);
      list.append(li);
    }
    show('list');
  } catch (error) {
    console.error(error);
    toast(friendlyError(error), true);
    show('list');
  }
}

$('new-post-btn').addEventListener('click', () => openEditor(null));

// ---------- Editor ----------

const editor = new window.EasyMDE({
  element: $('f-body'),
  spellChecker: false,
  status: false,
  autoDownloadFontAwesome: true,
  minHeight: '320px',
  placeholder: 'Start writing…',
  toolbar: ['bold', 'italic', 'heading-2', 'heading-3', '|', 'unordered-list', 'ordered-list', 'quote', 'link', 'upload-image', '|', 'preview', 'side-by-side', 'fullscreen', '|', 'guide'],
  uploadImage: true,
  imageAccept: IMAGE_TYPES.join(', '),
  imageMaxSize: MAX_IMAGE_BYTES,
  imageUploadFunction: (file, onSuccess, onError) => {
    uploadImage(file).then(onSuccess, (error) => onError(error.message || friendlyError(error)));
  },
  // The same Markdown the blog renders, sanitized so pasted HTML can't run here either.
  previewRender: (text) => window.DOMPurify.sanitize(editor.markdown(text)),
});
editor.codemirror.on('change', () => (dirty = true));

const fields = ['f-title', 'f-slug', 'f-excerpt', 'f-cover-alt', 'f-tags', 'f-author', 'f-seo-title', 'f-seo-desc'];
for (const id of fields) $(id).addEventListener('input', () => (dirty = true));

window.addEventListener('beforeunload', (event) => {
  if (dirty) event.preventDefault();
});

$('f-title').addEventListener('input', () => {
  if (!slugEdited) $('f-slug').value = slugify($('f-title').value);
});
$('f-slug').addEventListener('input', () => {
  slugEdited = true;
});
$('f-slug').addEventListener('blur', () => {
  $('f-slug').value = slugify($('f-slug').value);
  if (!$('f-slug').value) slugEdited = false;
});

function updateCounter(inputId, counterId, recommended) {
  const length = $(inputId).value.length;
  const counter = $(counterId);
  counter.textContent = length ? `${length}/${recommended}` : '';
  counter.classList.toggle('over', length > recommended);
}
$('f-seo-title').addEventListener('input', () => updateCounter('f-seo-title', 'seo-title-count', 60));
$('f-seo-desc').addEventListener('input', () => updateCounter('f-seo-desc', 'seo-desc-count', 155));

function setCover(url) {
  coverUrl = url || '';
  $('cover-img').src = coverUrl;
  $('cover-preview').hidden = !coverUrl;
  $('cover-remove').hidden = !coverUrl;
}

$('f-cover').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  toast('Uploading image…');
  try {
    setCover(await uploadImage(file));
    dirty = true;
    toast('Image uploaded.');
  } catch (error) {
    toast(error.message || friendlyError(error), true);
  }
});
$('cover-remove').addEventListener('click', () => {
  setCover('');
  dirty = true;
});

function renderStatus() {
  const published = currentStatus === 'published';
  $('editor-status').textContent = published ? 'Published' : 'Draft';
  $('editor-status').classList.toggle('published', published);
  $('publish-btn').textContent = published ? 'Update' : 'Publish';
  $('unpublish-btn').hidden = !published;
  $('save-draft-btn').hidden = published;
  $('danger-zone').hidden = !currentId;
  const link = $('view-post-link');
  link.hidden = !published;
  link.href = published ? postUrl($('f-slug').value) : '#';
}

async function openEditor(id) {
  if (dirty && !confirm('You have unsaved changes. Leave without saving?')) return;
  currentId = id;
  let post = {};
  if (id) {
    show('loading');
    try {
      const snap = await getDoc(doc(db, POSTS, id));
      post = snap.data() || {};
    } catch (error) {
      toast(friendlyError(error), true);
      await loadPosts();
      return;
    }
  }
  currentStatus = post.status === 'published' ? 'published' : 'draft';
  slugEdited = Boolean(id);
  $('editor-heading').textContent = id ? 'Edit post' : 'New post';
  $('f-title').value = post.title || '';
  $('f-slug').value = post.slug || '';
  $('f-excerpt').value = post.excerpt || '';
  $('f-cover-alt').value = post.coverImageAlt || '';
  $('f-tags').value = (post.tags || []).join(', ');
  $('f-author').value = post.author || cfg.defaultAuthor || '';
  $('f-seo-title').value = post.seoTitle || '';
  $('f-seo-desc').value = post.seoDescription || '';
  setCover(post.coverImageUrl);
  editor.value(post.body || '');
  updateCounter('f-seo-title', 'seo-title-count', 60);
  updateCounter('f-seo-desc', 'seo-desc-count', 155);
  renderStatus();
  dirty = false;
  show('editor');
  // CodeMirror measures itself wrong while hidden.
  setTimeout(() => editor.codemirror.refresh(), 0);
}

$('back-btn').addEventListener('click', async () => {
  if (dirty && !confirm('You have unsaved changes. Leave without saving?')) return;
  dirty = false;
  await loadPosts();
});

async function slugTaken(slug) {
  const snap = await getDocs(query(collection(db, POSTS), where('slug', '==', slug)));
  return snap.docs.some((d) => d.id !== currentId);
}

function setBusy(busy) {
  for (const id of ['save-draft-btn', 'publish-btn', 'unpublish-btn', 'delete-btn']) $(id).disabled = busy;
}

async function save(targetStatus) {
  const title = $('f-title').value.trim();
  const slug = slugify($('f-slug').value || title);
  $('f-slug').value = slug;

  if (!title) {
    toast('Add a title first.', true);
    $('f-title').focus();
    return;
  }
  if (!SLUG_PATTERN.test(slug)) {
    toast('The web address can only use lowercase letters, numbers and dashes.', true);
    $('f-slug').focus();
    return;
  }
  if (targetStatus === 'published' && !editor.value().trim()) {
    toast('Write something in the post before publishing.', true);
    return;
  }
  if (targetStatus === 'published' && coverUrl && !$('f-cover-alt').value.trim()) {
    toast('Describe the cover image before publishing (it helps people using screen readers).', true);
    $('f-cover-alt').focus();
    return;
  }

  setBusy(true);
  try {
    if (await slugTaken(slug)) {
      toast('Another post already uses that web address. Change the title or the web address.', true);
      $('f-slug').focus();
      return;
    }

    const data = {
      title,
      slug,
      excerpt: $('f-excerpt').value.trim(),
      body: editor.value(),
      coverImageUrl: coverUrl,
      coverImageAlt: $('f-cover-alt').value.trim(),
      author: $('f-author').value.trim(),
      tags: parseTags($('f-tags').value),
      status: targetStatus,
      seoTitle: $('f-seo-title').value.trim(),
      seoDescription: $('f-seo-desc').value.trim(),
      updatedAt: serverTimestamp(),
    };

    if (currentId) {
      // Keep the original publish date when a post is updated or re-published.
      const existing = (await getDoc(doc(db, POSTS, currentId))).data() || {};
      if (targetStatus === 'published' && !existing.publishedAt) data.publishedAt = serverTimestamp();
      await updateDoc(doc(db, POSTS, currentId), data);
    } else {
      if (targetStatus === 'published') data.publishedAt = serverTimestamp();
      currentId = (await addDoc(collection(db, POSTS), data)).id;
    }

    const wasPublished = currentStatus === 'published';
    currentStatus = targetStatus;
    dirty = false;
    slugEdited = true;
    renderStatus();
    $('editor-heading').textContent = 'Edit post';

    if (targetStatus === 'published') {
      toast(wasPublished ? 'Changes published. They can take up to an hour to show everywhere.' : 'Published! Tap “View post” to see it.');
    } else {
      toast(wasPublished ? 'Unpublished. The post is now a draft.' : 'Draft saved.');
    }
  } catch (error) {
    console.error(error);
    toast(friendlyError(error), true);
  } finally {
    setBusy(false);
  }
}

$('save-draft-btn').addEventListener('click', () => save('draft'));
$('publish-btn').addEventListener('click', () => save('published'));
$('unpublish-btn').addEventListener('click', () => {
  if (confirm('Unpublish this post? It will be hidden from the blog until you publish it again.')) save('draft');
});

$('delete-btn').addEventListener('click', async () => {
  const title = $('f-title').value.trim() || 'this post';
  if (!confirm(`Delete “${title}”? This can’t be undone.`)) return;
  setBusy(true);
  try {
    await deleteDoc(doc(db, POSTS, currentId));
    dirty = false;
    toast('Post deleted.');
    await loadPosts();
  } catch (error) {
    toast(friendlyError(error), true);
  } finally {
    setBusy(false);
  }
});
