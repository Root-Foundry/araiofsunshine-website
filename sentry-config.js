// Sentry error reporting (Sentry project araiofsunshine-web). Every page loads this right before Sentry's loader
// script, which holds the DSN and only downloads the full SDK when an error happens.
window.sentryOnLoad = function () {
    Sentry.init({
        environment: ['localhost', '127.0.0.1'].includes(location.hostname) ? 'development' : 'production',
        // Don't attach visitors' IP addresses or other identity data to error reports.
        dataCollection: { userInfo: false },
    });
};
