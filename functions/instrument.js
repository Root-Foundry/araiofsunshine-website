/**
 * Sentry error reporting (Sentry project araiofsunshine-functions). index.js requires this before anything else.
 * SENTRY_DSN comes from the param declared in index.js; without it (e.g. while the CLI reads the code to deploy)
 * Sentry stays off.
 */
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.FUNCTIONS_EMULATOR === 'true' ? 'development' : 'production',
  initialScope: { tags: { function: process.env.FUNCTION_TARGET } },
  // Errors only, without member or donor data: no request bodies, headers, IPs, query values or local variables.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
  },
});

module.exports = Sentry;
