// ============================================================
// guide-specs/meetings/how-to-track-action-items-so-things-actually-get-done.js
// ============================================================
// Source of truth for /guides/meetings/how-to-track-action-items-so-things-actually-get-done.
// Edit here; run `node scripts/build-guides.js meetings` to regenerate.
// ============================================================

module.exports = {
  slug:          'how-to-track-action-items-so-things-actually-get-done',
  category:      'meetings',
  categoryLabel: 'Meetings',

  title:         "How to Track Action Items So Things Actually Get Done",
  titleHtml:     "How to Track Action Items <em>So Things Actually Get Done</em>",
  shortTitle:    "How to Track Action Items",
  navTitle:      "How to track action items so things actually get done",

  description:   "Most action items don't fail because no one wrote them down. They fail because no one wrote them down in the right place, with the right ownership, in a way that survives the next meeting. Five steps for action items that actually get done.",
  deck:          "Most action items don't fail because no one wrote them down. They fail because no one wrote them down in the right place, with the right ownership, in a way that survives the next meeting. Five steps for action items that actually get done.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `The same action item is on its third meeting. The first time it was 'we should look into vendor pricing.' The second time it was 'reminder to look into vendor pricing.' This week it's 'circling back on vendor pricing — anyone have an update?' Nobody does. The action item is not failing because the work is hard. It's failing because nobody actually owns it, and the meeting structure is allowing it to recur indefinitely without anyone confronting that fact.`,
    `Action items have a small number of failure modes that account for almost all the things that don't get done. They live in the wrong place — in meeting notes rather than where the owner actually works. They lack a real owner — the room nodded but nobody specifically committed. They lack a real deadline — 'soon' or 'next week' or no date at all. Or they're not actually action items but decisions that weren't made, dressed up as work to defer the decision into the future. The five steps below address each failure mode in turn, and produce action items that close instead of perpetuate.`,
  ],

  steps: [
    {
      name: "Capture them where the work happens, not where they were said",
      body: "The most common reason action items don't get done is that they live in the meeting notes — a document the owner reads once, files away, and then forgets exists. Action items belong in whatever system the owner actually uses to manage their work: their task tracker, their project board, their personal todo system, their team's Asana or Linear or Jira. Meeting notes are where action items get surfaced; they're not where action items live. The handoff has to happen explicitly: either the owner adds the action item to their own system within an hour of the meeting, or the meeting facilitator does it on their behalf and confirms. Action items captured only in meeting notes have roughly a thirty percent completion rate; action items that move to the owner's actual workflow have something closer to ninety. The migration is the work; the notes are not.",
    },
    {
      name: "Every action item needs an owner, a deadline, and a definition of done",
      body: "An action item without all three of these is not an action item; it's a wish. The owner is one specific person — not 'the team,' not 'whoever picks it up,' not 'me or Tom.' One name. The deadline is a specific date, not 'soon' or 'next week' or 'before the launch.' If the deadline is genuinely uncertain, the action item gets a date by which the deadline will be set ('Sarah will scope by Friday and propose a deadline'), which is its own action item with its own owner and date. The definition of done is a one-sentence description of what the artifact or outcome looks like: 'revised timeline document shared with the team' is a definition; 'investigate the timeline' is not. Together these three constraints produce action items that can either close or escalate — both of which are useful states. Action items missing any of the three drift into ambiguity, where they neither close nor escalate, just persist.",
    },
    {
      name: "Distinguish 'we should' from 'we agreed to'",
      body: "Half of what gets captured as action items in most meetings are not actually commitments. Someone said 'we should look into that' — meaning, in context, 'this is worth thinking about at some point' — and the room nodded, and the note-taker wrote it down as an action item. By the next meeting the original speaker has no memory of taking it on, and rightly so, because they didn't. The discipline is to push back gently in real time: 'Are we agreeing to do this, or noting it as something to consider?' The question is mildly awkward and saves an enormous amount of downstream confusion. Notes should reflect the same distinction in writing — actual commitments go in the action items section with owners and deadlines; ideas that didn't quite land as commitments go in a separate 'parking lot' or 'noted for later' section without owners. The two categories look superficially similar in the moment and behave very differently over time.",
    },
    {
      name: "Build a recurrence check across meetings",
      body: "The single biggest pattern that kills team accountability is action items that resurface meeting after meeting without resolution. Each individual meeting feels acceptable — the action item is mentioned, someone says they'll get to it, the meeting moves on — but the pattern across meetings is that the action item is dying slowly in public. The recurrence check is the move that surfaces this pattern. Once a month, or before any major planning meeting, look back at the last four to eight meeting notes and identify any action item that has appeared in three or more without resolution. Those items need a different conversation than the regular meeting — usually one that asks whether the action item is still wanted, who actually owns it, and what would have to change to close it. Sometimes the answer is that the team has been pretending an action item is alive when it should have been killed weeks ago. The recurrence check makes the pretending visible, which is the precondition for either reviving the work or releasing the team from it.",
    },
    {
      name: "Know when an action item is masking a decision that wasn't made",
      body: "There's a specific failure mode where action items are used as a way to defer decisions the room couldn't reach. Two parties disagreed about direction; the meeting was running long; someone proposed 'let's investigate the options and come back to it' as an action item. The action item is genuine in form, and it's also a way for the meeting to end without confronting that no decision got made. These items are the ones that recur indefinitely because no amount of investigation produces a decision — what's missing is decision authority, not information. The signal you've reached this category: has the action item been 'investigate options' or 'gather more data' for more than two meetings? If yes, the underlying problem isn't tracking; it's that someone needs to make a call. The remedy is to stop treating it as an action item and escalate it as a decision needed: name the decision, name the decision-maker, name the date by which the decision will be made. Sometimes 'decide who decides' is the only useful next step. Action items can carry a lot of work, but they can't substitute for decisions that haven't happened.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "ACTION ITEMS\n• Sarah → revised timeline doc shared with team by Fri 4/4\n• Tom → vendor RFP draft circulated by Wed 4/2\n• UNASSIGNED → competitive analysis (raised by Jen, no owner taken)\n\nNOTED FOR LATER (not action items)\n• Maybe revisit the pricing model next quarter\n• Worth considering a formal customer advisory board",
    explanation: "This template separates real action items from things that sounded like action items but weren't. Real action items have an owner, a deadline, and a definition of done; they go in the first list. Things people said in passing that the room didn't actually commit to — 'we should look into that,' 'maybe we should consider X' — go in 'noted for later' rather than into the action items list, where they would otherwise rot for weeks. The UNASSIGNED entry forces the next conversation: someone claims the work or the team explicitly drops it, both of which are improvements over the silent fade.",
  },

  cta: {
    glyph:    '📋',
    headline: "Track action items across meetings — and catch the ones that disappear",
    body:     "The Debrief's Series mode is built for exactly this problem: paste your last 3+ recurring meetings (standups, weekly syncs, client check-ins) and it surfaces the action items that have been resurfacing without resolution, the decisions that keep getting revisited, and the topics that keep being deferred. The pattern that's invisible meeting-by-meeting becomes obvious across the series.",
    features: [
      "Series mode catches action items that 'disappear' across multiple meetings",
      "Distinguishes 'we agreed to' (action items) from 'someone said we should' (noted for later)",
      "Flags UNASSIGNED items so they can't quietly fade",
      "Identifies decisions disguised as action items — the ones nobody can close",
      "Boss Update mode summarizes status in 3–5 sentences for upward reporting",
    ],
    toolId:   'TheDebrief',
    toolName: 'The Debrief',
  },
};
