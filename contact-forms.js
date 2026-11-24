// Contact form (contact.html) and newsletter sign-up (index.html, contact.html). Both go to Cloud Functions that
// require App Check (invisible reCAPTCHA), which loads as soon as someone starts filling in a form.
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';
import { app, loadAppCheck } from './firebase-config.js';

const functions = getFunctions(app, 'us-east4');
const CONTACT_EMAIL = 'araiofsunshineofnorthflorida@gmail.com';

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showMessage(el, text, kind) {
    el.textContent = text;
    el.className = `form-message ${kind}`;
    el.style.display = 'block';
}

async function callProtected(name, data) {
    await loadAppCheck();
    return httpsCallable(functions, name)(data);
}

// The function's own message for bad input; a friendly fallback (and a Sentry report) for anything else.
function failureText(err, fallback) {
    if (err?.code === 'functions/invalid-argument') return err.message;
    window.Sentry?.captureException(err);
    return fallback;
}

function warmUpOnFocus(form) {
    form.addEventListener('focusin', () => { loadAppCheck().catch(() => {}); }, { once: true });
}

// ---------- Contact form ----------
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    warmUpOnFocus(contactForm);
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageDiv = document.getElementById('formMessage');
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const field = (name) => (contactForm.elements[name].value || '').trim();
        const subjectSelect = contactForm.elements.subject;

        if (!field('firstName') || !field('lastName') || !field('email') || !subjectSelect.value || !field('message')) {
            showMessage(messageDiv, 'Please fill in all required fields.', 'error');
            return;
        }
        if (!isValidEmail(field('email'))) {
            showMessage(messageDiv, 'Please enter a valid email address.', 'error');
            return;
        }
        if (!contactForm.elements.privacy.checked) {
            showMessage(messageDiv, 'Please accept the privacy policy.', 'error');
            return;
        }

        submitButton.disabled = true;
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        try {
            await callProtected('submitContactMessage', {
                firstName: field('firstName'),
                lastName: field('lastName'),
                email: field('email'),
                phone: field('phone'),
                subject: subjectSelect.selectedOptions[0].textContent.trim(),
                message: field('message')
            });
            showMessage(messageDiv, 'Thank you for your message! We\'ll get back to you within 24-48 hours.', 'success');
            contactForm.reset();
        } catch (err) {
            console.error(err);
            showMessage(messageDiv, failureText(err,
                `We couldn't send your message right now. Please try again in a few minutes, or email us at ${CONTACT_EMAIL}.`), 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

// ---------- Newsletter sign-up ----------
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    warmUpOnFocus(newsletterForm);
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageDiv = document.getElementById('newsletterMessage');
        const emailInput = newsletterForm.querySelector('.newsletter-input');
        const submitButton = newsletterForm.querySelector('button[type="submit"]');
        const email = emailInput.value.trim();

        if (!isValidEmail(email)) {
            showMessage(messageDiv, 'Please enter a valid email address.', 'error');
            return;
        }

        submitButton.disabled = true;
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Subscribing...';
        try {
            await callProtected('subscribeNewsletter', { email });
            showMessage(messageDiv, 'Thank you for subscribing! We\'ll send our latest news, events and resources to your inbox.', 'success');
            emailInput.value = '';
        } catch (err) {
            console.error(err);
            showMessage(messageDiv, failureText(err, 'We couldn\'t sign you up right now. Please try again in a few minutes.'), 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}
