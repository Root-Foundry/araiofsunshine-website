// Header account button: shows "My Account" when a member is signed in, "Log In / Sign Up" otherwise.
// Loaded at the end of every public page, after any inline Firebase setup.
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirebaseApp } from './firebase-config.js';

const HINT_KEY = 'rai.signedIn';

function render(signedIn) {
    const label = signedIn ? 'My Account' : 'Log In / Sign Up';
    const href = signedIn ? '/member#account' : '/member';

    document.querySelectorAll('.btn-login').forEach((btn) => {
        btn.href = href;
        btn.classList.toggle('signed-in', signedIn);
        btn.setAttribute('aria-label', label);
        const text = btn.querySelector('.btn-login-text');
        if (text) text.textContent = label;
        const icon = btn.querySelector('i');
        if (icon) icon.className = signedIn ? 'fas fa-user-check' : 'fas fa-user-circle';
    });

    document.querySelectorAll('.nav-link-mobile[data-account-link]').forEach((link) => {
        link.href = href;
        link.textContent = label;
    });
}

// Use the last known state right away so the button doesn't flicker on each page load.
try { render(localStorage.getItem(HINT_KEY) === '1'); } catch { /* storage unavailable */ }

onAuthStateChanged(getAuth(getFirebaseApp()), (user) => {
    render(!!user);
    try { localStorage.setItem(HINT_KEY, user ? '1' : '0'); } catch { /* storage unavailable */ }
});
