// Shared Firebase setup + helpers for member.html, directory.html and admin-businesses.html.
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { getFunctions } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';
import { getFirebaseApp } from './firebase-config.js';

export const app = getFirebaseApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// Functions are deployed next to Firestore (us-east4).
export const functions = getFunctions(app, 'us-east4');

export const DEFAULT_DUES = { amountCents: 2500, interval: 'month' };

// "I am a…" on sign-up (the same choices as the original join form). The `id` is what gets stored.
export const MEMBER_TYPES = [
    { id: 'parent', label: 'Parent/Guardian' },
    { id: 'family', label: 'Family Member' },
    { id: 'caregiver', label: 'Caregiver' },
    { id: 'individual', label: 'Individual with Disability' },
    { id: 'professional', label: 'Professional/Service Provider' },
    { id: 'supporter', label: 'Community Supporter' },
    { id: 'other', label: 'Other' }
];

export function memberTypeLabel(id) {
    return MEMBER_TYPES.find((t) => t.id === id)?.label || '';
}

export function fillMemberTypeSelect(select) {
    MEMBER_TYPES.forEach((t) => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.label;
        select.appendChild(opt);
    });
}

// Business types for the directory filter. To add a type, add a line here; the `id` is what gets stored.
export const BUSINESS_CATEGORIES = [
    { id: 'food', label: 'Food & Drink', icon: 'fa-utensils' },
    { id: 'retail', label: 'Retail & Shopping', icon: 'fa-shopping-bag' },
    { id: 'home', label: 'Home & Garden', icon: 'fa-home' },
    { id: 'health', label: 'Health & Wellness', icon: 'fa-heartbeat' },
    { id: 'beauty', label: 'Beauty & Personal Care', icon: 'fa-spa' },
    { id: 'education', label: 'Education & Tutoring', icon: 'fa-graduation-cap' },
    { id: 'childcare', label: 'Childcare & Family', icon: 'fa-child' },
    { id: 'professional', label: 'Professional Services', icon: 'fa-briefcase' },
    { id: 'automotive', label: 'Automotive', icon: 'fa-car' },
    { id: 'events', label: 'Events & Entertainment', icon: 'fa-glass-cheers' },
    { id: 'creative', label: 'Creative & Media', icon: 'fa-palette' },
    { id: 'community', label: 'Nonprofit & Community', icon: 'fa-hands-helping' },
    { id: 'other', label: 'Other', icon: 'fa-store' }
];

// Builds the address line for a listing. When hideStreet is set, only city/state show unless includeHidden (admins).
// Keep in sync with formatAddress in functions/index.js, which builds the public directory copy.
export function formatAddress(b, { includeHidden = false } = {}) {
    const street = (b.addressStreet || '').trim();
    const city = (b.addressCity || '').trim();
    const state = (b.addressState || '').trim();
    const zip = (b.addressZip || '').trim();
    if (!street && !city && !state && !zip) return (b.address || '').trim(); // older single-line listings
    const showStreet = street && (includeHidden || !b.hideStreet);
    const cityState = [city, state].filter(Boolean).join(', ');
    const place = showStreet && zip ? `${cityState} ${zip}`.trim() : cityState;
    return [showStreet ? street : '', place].filter(Boolean).join(', ');
}

// ---------- Business hours ----------
// Stored as hours: { mon: { open: '09:00', close: '17:00' } | { closed: true }, ... }. Days left out aren't shown.
export const DAYS = [
    { id: 'mon', short: 'Mon', label: 'Monday' },
    { id: 'tue', short: 'Tue', label: 'Tuesday' },
    { id: 'wed', short: 'Wed', label: 'Wednesday' },
    { id: 'thu', short: 'Thu', label: 'Thursday' },
    { id: 'fri', short: 'Fri', label: 'Friday' },
    { id: 'sat', short: 'Sat', label: 'Saturday' },
    { id: 'sun', short: 'Sun', label: 'Sunday' }
];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function formatTime(hhmm) {
    if (!TIME_RE.test(hhmm || '')) return '';
    const [h, m] = hhmm.split(':').map(Number);
    const suffix = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 || 12;
    return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`;
}

function dayText(d) {
    if (!d) return '';
    if (d.closed) return 'Closed';
    const open = formatTime(d.open);
    const close = formatTime(d.close);
    return open && close ? `${open} – ${close}` : '';
}

// ["Mon – Fri: 9 AM – 5 PM", "Sat: 10 AM – 2 PM", "Sun: Closed"], grouping neighboring days with the same hours.
export function formatHours(hours) {
    if (!hours || typeof hours !== 'object') return [];
    const lines = [];
    let run = null;
    for (const day of DAYS) {
        const text = dayText(hours[day.id]);
        if (run && text && run.text === text) {
            run.end = day;
        } else {
            if (run) lines.push(run);
            run = text ? { start: day, end: day, text } : null;
        }
    }
    if (run) lines.push(run);
    return lines.map((r) => `${r.start.short}${r.end !== r.start ? ` – ${r.end.short}` : ''}: ${r.text}`);
}

export function todayHours(hours, date = new Date()) {
    const id = DAYS[(date.getDay() + 6) % 7].id; // getDay(): 0 = Sunday
    return dayText(hours?.[id]);
}

// ---------- Established / member since ----------
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatEstablished(b) {
    const year = Number(b?.establishedYear);
    if (!Number.isInteger(year) || year < 1800) return '';
    const month = Number(b.establishedMonth);
    return month >= 1 && month <= 12 ? `${MONTHS[month - 1]} ${year}` : String(year);
}

export function formatMonthYear(ts) {
    const d = ts instanceof Date ? ts : toDate(ts);
    return d ? d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';
}

export function getCategory(id) {
    return BUSINESS_CATEGORIES.find((c) => c.id === id) || BUSINESS_CATEGORIES[BUSINESS_CATEGORIES.length - 1];
}

export async function getDuesSettings() {
    try {
        const snap = await getDoc(doc(db, 'settings', 'dues'));
        const data = snap.exists() ? snap.data() : {};
        return {
            amountCents: Number.isInteger(data.amountCents) ? data.amountCents : DEFAULT_DUES.amountCents,
            interval: data.interval === 'week' ? 'week' : 'month'
        };
    } catch {
        return { ...DEFAULT_DUES };
    }
}

export async function isAdminUser(user) {
    if (!user) return false;
    try {
        return (await getDoc(doc(db, 'admins', user.uid))).exists();
    } catch {
        return false;
    }
}

export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}

// Only http(s) links are ever rendered as hrefs.
export function safeUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch {
        return '';
    }
}

export function formatMoney(cents) {
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function toDate(ts) {
    return ts && typeof ts.toDate === 'function' ? ts.toDate() : null;
}

export function formatDate(ts) {
    const d = ts instanceof Date ? ts : toDate(ts);
    return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

export function isPaidUp(member) {
    const paidThrough = toDate(member?.paidThrough);
    return !!paidThrough && paidThrough.getTime() > Date.now();
}
