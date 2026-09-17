// Tool Finder was paused 2026-08-22 (commit b640b175) because it chose
// between 124 entries and only 42 of them said what their tool is NOT for.
// An entry with that line can be ruled out by it; an entry without one can
// never be ruled out at all, so the least verified tools survived every
// comparison — "a bill from the hospital I don't understand" went to a
// noindexed document translator three times out of three, over a Bill
// Rescue entry naming hospital bills outright.
//
// Re-enabled 2026-09-16: all 124 entries in toolFinderMetadata.js now carry
// a non-empty notFor field (verified by direct count before flipping this),
// closing the exact gap that caused the pause. If this needs to come back
// off, re-check that count first — this flag being true again for the wrong
// reason next time would be a coincidence, not a fix.
//
// One switch, six consumers: the tool page itself (src/tools/ToolFinder.js),
// the homepage hero's ask box + invitation + closing band (all three in
// src/components/HomeIntro.js), the dashboard wizard (DashBoard.js), the
// footer's "Find a Tool" link (Footer.js), and the 404 page's first button
// (NotFound.js). Set to true to take all six out again at once.
export const TOOL_FINDER_PAUSED = false;
