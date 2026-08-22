// Tool Finder is off while its routing metadata is written.
//
// It chose between 124 entries, and only 42 of them said what their tool is
// NOT for. An entry with that line can be ruled out by it; an entry without one
// can never be ruled out at all, so the least verified tools survived every
// comparison — "a bill from the hospital I don't understand" went to a
// noindexed document translator three times out of three, over a Bill Rescue
// entry naming hospital bills outright. Sending people to the full list beats
// answering them badly.
//
// One switch, four consumers: the tool page itself, the homepage hero's ask
// box, the dashboard wizard, and the 404 page's first button. Set to false to
// bring all four back at once.
export const TOOL_FINDER_PAUSED = true;
