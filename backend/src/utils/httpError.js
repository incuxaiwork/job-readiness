/**
 * Standardized server-side error responder.
 *
 * Logs the full error (including stack) on the server and returns a generic message to
 * the client. This prevents stack traces, SQL errors, file paths and library names from
 * leaking through API responses while keeping diagnostics in the server logs.
 */
export const serverError = (res, err, context = 'Server error') => {
  console.error(`[${context}]`, err && err.stack ? err.stack : err);
  if (!res.headersSent) {
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};
