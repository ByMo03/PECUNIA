// ── APP INIT (loaded last — DOM is already ready at this point) ─────────────
// Scripts are at bottom of <body>, so DOM is fully parsed when this runs.
// Using direct call instead of DOMContentLoaded listener for reliability.
initData();
processRec();
initLock();
