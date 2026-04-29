// ============================================================
// guides/workplace/how-to-spot-whats-actually-changed-in-a-terms-of-service-update.js
// ============================================================

module.exports = {
  slug:          'how-to-spot-whats-actually-changed-in-a-terms-of-service-update',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Spot What's Actually Changed in a Terms of Service Update",
  titleHtml:     "How to Spot What's Actually Changed in a <em>Terms of Service Update</em>",
  shortTitle:    "What Changed in a ToS Update",
  navTitle:      "How to spot what's actually changed in a terms of service update",

  description:   "The email said 'we're updating our terms.' The PDF is 31 pages. Here's how to find the four things they actually changed — without reading the 27 pages that are identical to last time.",
  deck:          "The email said 'we're updating our terms.' The PDF is 31 pages. Here's how to find the four things they actually changed — without reading the 27 pages that are identical to last time.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `The email landed in your inbox: 'We're updating our Terms of Service. The new terms take effect on June 1.' Below: a link to a 31-page document. You're going to click 'I agree' eventually because the alternative is losing access to a tool you actually use. The question isn't whether to agree; the question is whether you'll know what you agreed to. The honest answer for most people most of the time is: no, you'll have agreed to whatever the company wanted, and you'll find out later.`,
    `The good news is that most of the document is unchanged. ToS updates typically modify three or four things, and the rest is exactly what you previously accepted. If you can find the three or four changes, you've read everything that actually matters. Five moves that surface them.`,
  ],

  steps: [
    {
      name: "Look for the change log at the top",
      body: "Many companies — increasingly, by regulation in some jurisdictions — include a brief summary of changes at the top of an updated ToS, or in the email announcing it. Find that summary before you read the document. It's the company's own list of what they changed, and it's usually accurate, even when it's incomplete. Read it first. Then judge whether the document deserves further attention.",
    },
    {
      name: "Diff against the previous version",
      body: "The Wayback Machine, your browser history, or your email archive almost always has the previous ToS. Open both. Use a free diff tool — there are several browser-based ones — and let the software show you exactly what changed. This takes about three minutes and surfaces every word-level edit. The changes that aren't in the company's summary are the ones to read carefully; those are the ones they didn't want to advertise.",
    },
    {
      name: "Focus on data, billing, arbitration, and rights granted",
      body: "Almost every meaningful ToS change touches one of four areas: what data they collect or share, how they bill you, how disputes get resolved, and what rights you grant them over your content. Other changes are usually cosmetic — defined terms, formatting, jurisdiction details. The four substantive areas are where the real news is. Search the diff for 'data,' 'fee,' 'arbitration,' and 'license.' That covers almost every change worth reading.",
    },
    {
      name: "Watch for an opt-out window",
      body: "Some ToS updates — particularly to arbitration clauses — include a small window in which you can opt out by sending a written notice. The window is typically 30 days from the change announcement, and the procedure is specified in the document. The companies don't advertise it, but it's there in writing if it exists. Search for 'opt out' or 'reject this provision.' If it's there, take it.",
    },
    {
      name: "Decide before the deadline, not after",
      body: "Continuing to use the product after the effective date typically counts as acceptance. If you have concerns, the time to act on them is before the date in the email — by deleting your account, exporting your data, or sending the opt-out notice. After the date, the new terms apply by default and the leverage is gone. Calendar the date the email gave you. The change-or-don't decision is a real one only while you still have time to make it.",
    },
  ],

  cta: {
    glyph:    '🔇',
    headline: "Get the actual diff in two minutes",
    body:     "Paste the new ToS and Noise Canceler diffs it against the previous version, surfaces every change in data, billing, arbitration, and rights granted, and flags any opt-out window before the effective date.",
    features: [
      "Version-to-version diff",
      "Substantive-change detection",
      "Opt-out window flagging",
      "Effective-date extraction",
      "Plain-language change summaries",
    ],
    toolId:   'NoiseCanceler',
    toolName: 'Noise Canceler',
  },
};
