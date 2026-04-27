// ============================================================
// guide-specs/meetings/the-difference-between-meeting-minutes-and-meeting-notes.js
// ============================================================
// Source of truth for /guides/meetings/the-difference-between-meeting-minutes-and-meeting-notes.
// Edit here; run `node scripts/build-guides.js meetings` to regenerate.
// ============================================================

module.exports = {
  slug:          'the-difference-between-meeting-minutes-and-meeting-notes',
  category:      'meetings',
  categoryLabel: 'Meetings',

  title:         "The Difference Between Meeting Minutes and Meeting Notes (And Which One You Need)",
  titleHtml:     "The Difference Between Meeting Minutes and Meeting Notes <em>(And Which One You Need)</em>",
  shortTitle:    "Meeting Minutes vs Meeting Notes",
  navTitle:      "The difference between meeting minutes and meeting notes and which one you need",

  description:   "Most teams use the terms interchangeably and produce a hybrid that fails at both jobs. Five steps for telling them apart, picking the right one, and not producing the wrong artifact for your situation.",
  deck:          "Most teams use the terms interchangeably and produce a hybrid that fails at both jobs. Five steps for telling them apart, picking the right one, and not producing the wrong artifact for your situation.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `You've been asked to take notes at the next meeting — or to send out the minutes. Maybe both, by different people, for the same meeting. The two terms get used interchangeably in most workplaces, which obscures a real distinction: minutes and notes are different artifacts with different purposes, different audiences, and different content. Most teams produce a hybrid of the two that ends up not quite serving either purpose, and the result is documents that get filed but not used.`,
    `The difference matters because choosing the wrong artifact for your situation is a quiet but expensive mistake. Formal minutes for a casual standup feel bureaucratic and waste forty-five minutes of post-meeting work that nobody needed. Casual notes for a board meeting fail their actual job — the formal record someone may need to refer to in a year. The five steps below sort the two cleanly, give you a way to choose the right one for any given meeting, and explain when a third option (no artifact at all) is the right answer.`,
  ],

  steps: [
    {
      name: "Recognize they're different artifacts with different jobs",
      body: "Meeting minutes are a formal record of what happened — who attended, what was decided, what was voted on, what motions were made. Their primary audience is future people who weren't in the meeting and may need to refer to the record months or years later: auditors, regulators, board members, legal teams, future employees. Their content is structured, complete, and somewhat dry by design. Meeting notes are a working document — what was discussed, what was decided, what action items came out, what's pending. Their primary audience is the team that was in the meeting and people adjacent to it who need to act on the outcomes in the next days and weeks. Their content is actionable, scannable, and biased toward usefulness over completeness. Both can include the same facts. They're organized for fundamentally different uses, and the same artifact does poorly at both jobs simultaneously.",
    },
    {
      name: "Minutes are formal record; notes are working document",
      body: "The structural difference shows up in what each artifact emphasizes. Minutes lead with attendance and absence, formal motions, votes, and decisions in the order they occurred — because the future reader needs to know that the right people were present, the right process was followed, and the formal record reflects what was officially settled. Notes lead with decisions and action items — because the team reader needs to know what to do next. Minutes are typically reviewed and approved at the next meeting (literally voted on) before becoming the official record; notes are typically circulated within hours and treated as a snapshot the team can revise informally. Minutes are written in past tense, third person, neutral voice ('the committee resolved to'); notes are often written in present tense, more directly ('Tom owns the timeline doc'). The two formats reflect their two purposes: minutes preserve, notes propel.",
    },
    {
      name: "Choose by audience and use case, not by tradition",
      body: "Most teams use whichever term their company has historically used, regardless of whether it's the right artifact for the meeting in question. The choice should be made on use case. Use minutes when: there's a regulatory or compliance requirement, the meeting is at board or governance level, the decisions may need to be referred to as the official record at a later date, or attendees include people who might leave the company and the record needs to outlast them. Use notes when: the meeting is operational, the audience is the team and adjacent stakeholders, the goal is to drive action in the next few days, and nobody is going to read this in three years. Most workplace meetings — standups, planning meetings, project syncs, retrospectives, 1:1s — call for notes. A small fraction — board meetings, formal decision-making bodies, regulated industries — call for minutes. Picking the wrong one wastes effort if you over-formalize and creates risk if you under-formalize.",
    },
    {
      name: "The hybrid trap — and how to avoid it",
      body: "The most common failure mode in meeting documentation is the hybrid: a document that's trying to be both minutes and notes simultaneously. It has the formal attendance list and motions of minutes, but also the action items and tensions of notes. It's longer than notes, more casual than minutes, and serves neither audience well. The future reader looking for the record can't quickly find what was decided. The team reader looking for action items has to wade through formal preamble. The hybrid usually emerges because one person is writing for one audience while the boss is reading for another, and nobody named the mismatch. The fix is to choose explicitly: if this meeting needs minutes, write minutes and skip the action-items section (or move it to a separate operational follow-up). If it needs notes, write notes and skip the attendance and motions ceremony. If it needs both — rare, but it happens — write two documents. Two clean artifacts beat one contaminated one almost every time.",
    },
    {
      name: "Know when neither minutes nor notes are the right artifact",
      body: "There's a third option most documentation guides skip: no formal artifact at all. Many meetings — quick stand-ups, hallway syncs, brainstorm sessions where the brainstorm document itself is the output, 1:1s where the relevant follow-ups live in private channels — don't actually need either minutes or notes. They need a Slack message ('In our standup: A is unblocked, B at risk on data dependency, C taking customer follow-up'), or an updated calendar entry, or just a verbal recap to the people who weren't there. The signal you've reached this category: are you producing notes or minutes mostly because notes or minutes are what one produces after meetings, rather than because someone will use this specific document for something specific? If yes, the right artifact may be no document. The hour you'd have spent writing notes nobody reads is better spent on the actual work the meeting was meant to drive. The discipline is to ask 'who will use this artifact, for what, when?' before starting to write — and to be willing to skip the artifact entirely when the honest answer is 'nobody, for nothing, never.'",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "Who will read this artifact, for what purpose, and when?",
    explanation: "The single best question to ask before deciding whether to write minutes, notes, or nothing at all. The answer determines the right artifact. 'Compliance auditor, in 18 months, to verify the decision was made properly' = minutes. 'My team, this week, to act on the action items' = notes. 'Nobody, for nothing, ever' = neither — send a three-line Slack message instead and reclaim the forty-five minutes you would have spent on documentation. Most failures of meeting documentation come from skipping this question and producing whichever artifact your company conventionally produces. Asking it once cuts a substantial amount of unnecessary work.",
  },

  cta: {
    glyph:    '📋',
    headline: "Get the right artifact in seconds — minutes, notes, or a Boss Update",
    body:     "The Debrief takes a meeting transcript and produces the format you actually need: structured notes (decisions, action items, tensions, open questions) for working teams, or a Boss Update (3–5 sentence upward summary) for managers, or full distilled output you can adapt into formal minutes. Pick the artifact that matches the use case rather than producing the hybrid that fails both.",
    features: [
      "Multiple output formats for different audiences and use cases",
      "Boss Update mode: 3–5 sentence upward summary for managers",
      "Distill mode: full structured notes with decisions, action items, tensions",
      "Series mode: cross-meeting patterns for recurring meetings",
      "Adapts by meeting type — standup vs planning vs client meetings",
    ],
    toolId:   'TheDebrief',
    toolName: 'The Debrief',
  },
};
