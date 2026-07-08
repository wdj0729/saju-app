// Sentinel prefix used to smuggle a friendly error message through an
// already-started text stream, since Response headers/status can't change
// once bytes have been sent to the client. The null byte makes accidental
// collision with real AI-generated text effectively impossible.
export const STREAM_ERROR_MARKER = '\u0000__STREAM_ERROR__\u0000';
