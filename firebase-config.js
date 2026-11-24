// Shared Firebase setup for every page that talks to Firebase.
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';

export const firebaseConfig = {
    apiKey: "AIzaSyD260jUFHNr0Tt_MLC3-ogJn4tJTPYZwSU",
    authDomain: "araiofsunshine.firebaseapp.com",
    projectId: "araiofsunshine",
    storageBucket: "araiofsunshine.firebasestorage.app",
    messagingSenderId: "741022041696",
    appId: "1:741022041696:web:336a94177b337cf8e5a505"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Local testing: when the site is served by the Firebase Hosting emulator (`firebase emulators:start`,
// http://localhost:5000), point every service at the local emulators so nothing touches the live project.
export const usingEmulators = ['localhost', '127.0.0.1'].includes(location.hostname) && location.port === '5000';

if (usingEmulators) {
    const base = 'https://www.gstatic.com/firebasejs/10.7.1/';
    const [authSdk, firestoreSdk, storageSdk, functionsSdk] = await Promise.all([
        import(`${base}firebase-auth.js`),
        import(`${base}firebase-firestore.js`),
        import(`${base}firebase-storage.js`),
        import(`${base}firebase-functions.js`)
    ]);
    authSdk.connectAuthEmulator(authSdk.getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
    firestoreSdk.connectFirestoreEmulator(firestoreSdk.getFirestore(app), '127.0.0.1', 8080);
    storageSdk.connectStorageEmulator(storageSdk.getStorage(app), '127.0.0.1', 9199);
    functionsSdk.connectFunctionsEmulator(functionsSdk.getFunctions(app, 'us-east4'), '127.0.0.1', 5001);
    console.info('[firebase] Using local emulators');
}

export function getFirebaseApp() {
    return app;
}

// Bot protection: Firebase App Check with an invisible reCAPTCHA Enterprise key (araiofsunshine.org and the Firebase
// domains). The contact form, newsletter, donation and dues functions reject requests without an App Check token, so
// pages call loadAppCheck() before using them; reCAPTCHA loads only then. The emulated functions don't check tokens.
const RECAPTCHA_SITE_KEY = '6LdiajAuAAAAAFTsB5ubh4ntYiPV4eLhGHLteqH4';
let appCheck = null;

export function loadAppCheck() {
    if (usingEmulators) return Promise.resolve(null);
    appCheck ??= import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js')
        .then(({ initializeAppCheck, ReCaptchaEnterpriseProvider }) => initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
            // Tokens are fetched when a protected function is called, not refreshed in the background, so pages left
            // open don't use up reCAPTCHA's free monthly checks.
            isTokenAutoRefreshEnabled: false
        }))
        .catch((err) => {
            appCheck = null; // let the next attempt retry (e.g. after a network hiccup)
            throw err;
        });
    return appCheck;
}
