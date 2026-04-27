// ============================================================
// guide-specs/meetings/what-to-do-when-your-manager-asks-what-did-we-decide.js
// ============================================================
// Source of truth for /guides/meetings/what-to-do-when-your-manager-asks-what-did-we-decide.
// Edit here; run `node scripts/build-guides.js meetings` to regenerate.
// ============================================================

module.exports = {
  slug:          'what-to-do-when-your-manager-asks-what-did-we-decide',
  category:      'meetings',
  categoryLabel: 'Meetings',

  title:         "What to Do When Your Manager Asks \"What Did We Decide?\" and You Can't Remember",
  titleHtml:     "What to Do When Your Manager Asks <em>&quot;What Did We Decide?&quot;</em> and You Can&#39;t Remember",
  shortTitle:    "When Your Manager Asks 'What Did We Decide?'",
  navTitle:      "What to do when your manager asks what did we decide and you can't remember",

  description:   "It's the question with no good wrong answer. Five steps for handling it gracefully — without bluffing, without panicking, and without having the same problem next quarter.",
  deck:          "It's the question with no good wrong answer. Five steps for handling it gracefully — without bluffing, without panicking, and without having the same problem next quarter.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `Your manager pings you on Slack: 'What did we decide on the launch date?' The meeting was three weeks ago. You were there. You remember the discussion vaguely — there was something about Q4 — but you can't summon the actual decision with the confidence you'd need to give an answer. The reply window is open and your fingers are hovering over the keyboard while two parts of your brain argue: bluff or admit?`,
    `The bluff is tempting because admitting feels like admitting you weren't paying attention or didn't follow up. The bluff is also dangerous because if you guess wrong the recovery costs more than the original admission would have, and your manager remembers wrong-confident answers much longer than they remember 'let me check.' The five steps below are how to handle the question well in the moment, recover what was actually decided, and build the small habits that mean the same situation produces a faster, cleaner answer next time.`,
  ],

  steps: [
    {
      name: "Don't bluff — buy yourself a small window",
      body: "The first move is the one that's easiest to skip: don't answer immediately if you're not sure. The cost of a confident wrong answer is much higher than the cost of a brief delay, and most managers asking 'what did we decide' are not asking on a thirty-second clock — they're asking because they need it for something coming up, and a five-minute or twenty-minute delay is fine. The reply that earns the window is short and direct: 'Let me check the notes — back to you in ten minutes.' Or: 'I want to make sure I give you the right answer — checking now.' Both of these are read by managers as conscientious rather than uncertain. The bluff, if discovered, gets read as both wrong and unaccountable. The window is free; the bluff is expensive. Always pick the window.",
    },
    {
      name: "Use the artifacts you have — notes, Slack, calendar",
      body: "Most meetings leave more written traces than people remember. The agenda you sent or received. The Slack channel where someone summarized afterward. The calendar event invite that includes the topic. The recording or transcript if Zoom or Teams was running. The notes someone took, even if you weren't the one taking them. Before you ask anyone what was decided, do a five-minute sweep through the artifacts that already exist. Search Slack for the topic name across the relevant channels. Check the calendar for the meeting and any follow-up calendar entries. Open the meeting transcript if there is one. Most of the time, the decision is recorded somewhere in writing — you just didn't remember where. The sweep takes five minutes and recovers the decision in maybe seventy percent of cases without having to involve another person.",
    },
    {
      name: "Reconstruct from the people who were there — but ask the right person, the right way",
      body: "If the artifacts don't surface the decision, you have to ask someone — and how you ask matters. Asking the most senior person who was in the room ('hey, can you remind me what we decided?') puts you in a worse position than asking a peer who was also there. Asking a peer with 'do you remember what we decided about X?' is normal collaboration. Asking the meeting facilitator with 'I'm pulling together a summary for [manager], can you confirm what we landed on for X?' frames it as documentation work rather than memory failure. The phrasing changes how the request lands. The general rule: ask the person closest to the source of truth, frame the ask as documentation rather than recovery, and don't apologize for asking. People are happy to confirm what they themselves know; they're less happy to feel like they're filling in for someone else's missed attention.",
    },
    {
      name: "Document the recovered decision in writing right now",
      body: "Once you've recovered what was decided, the most valuable thing you can do is write it down somewhere durable, immediately. A short Slack message to the relevant channel ('Confirming we decided X on the launch question — flagged for the record'). A note appended to the original meeting notes if you have access to them. A calendar entry with the decision in the description. The medium matters less than the act. Decisions that get recovered orally and then re-forgotten produce the same problem in three more weeks. Decisions that get written down once stay written down. This step takes ninety seconds and pays itself back the next time the same question comes up — which it almost always does. The recovered decision becomes a small permanent asset rather than a recovery you have to repeat.",
    },
    {
      name: "Know when 'I can't remember what we decided' is actually 'we never decided'",
      body: "There's a category of 'what did we decide' questions where the honest answer isn't recoverable from notes or peers — because no decision was made. The meeting discussed the topic. Several people had opinions. The room moved on without explicitly settling on a direction, and the absence of a decision wasn't named at the time. Three weeks later, someone treats the topic as if it had been decided, and you're being asked to recall something that doesn't exist. The signal you've reached this category: have you checked notes, Slack, and asked one or two attendees, and the answer is consistently fuzzy? If yes, what you have isn't a memory problem; it's an unmade decision. The right response is to name that directly: 'I checked notes and asked Tom — I don't think we actually landed on a decision in that meeting. We discussed it but didn't settle. I think we need a quick decision call.' This is harder to say than 'we decided X' but much more useful, because it surfaces the underlying problem (unmade decision) instead of perpetuating the assumption (decision that was made and forgotten). Managers will remember the surface much better than the cover.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Let me check the notes — I want to give you the exact wording we landed on. Back to you in ten minutes.",
    explanation: "This response does the three most important things in a single sentence: it doesn't bluff, it commits to a specific quick turnaround, and it frames the work as wanting to give the precise answer rather than as recovery from a memory failure. Managers read this as conscientious, not uncertain. It also bought you a real window — ten minutes is enough time to do an artifact sweep and ask one or two people if needed. The contrast with the wrong-confident bluff is enormous: the bluff costs trust if discovered, while this response builds it.",
  },

  cta: {
    glyph:    '📋',
    headline: "Never lose a decision again — paste the transcript when it happens",
    body:     "The Debrief takes the original meeting transcript and produces the structured decision record you wish you'd had at the time: decisions with owners, action items with deadlines, UNASSIGNED items flagged, and tensions captured. Run it on the original meeting and the artifact you needed for the recovery question is already there.",
    features: [
      "Structured decision records — what was decided, who drove it, what's pending",
      "Distinguishes real decisions ('we agreed to') from soft ones ('someone said we should')",
      "Boss Update mode: 3–5 sentence upward summary you can forward as-is",
      "Series mode: paste recurring meetings to spot decisions that keep getting revisited",
      "Works retroactively — paste a transcript from three weeks ago and recover the decisions",
    ],
    toolId:   'TheDebrief',
    toolName: 'The Debrief',
  },
};
