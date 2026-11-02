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
