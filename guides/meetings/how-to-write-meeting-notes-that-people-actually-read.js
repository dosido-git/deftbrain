// ============================================================
// guide-specs/meetings/how-to-write-meeting-notes-that-people-actually-read.js
// ============================================================
// Source of truth for /guides/meetings/how-to-write-meeting-notes-that-people-actually-read.
// Edit here; run `node scripts/build-guides.js meetings` to regenerate.
// ============================================================

module.exports = {
  slug:          'how-to-write-meeting-notes-that-people-actually-read',
  category:      'meetings',
  categoryLabel: 'Meetings',

  title:         "How to Write Meeting Notes That People Actually Read",
  titleHtml:     "How to Write Meeting Notes <em>That People Actually Read</em>",
  shortTitle:    "How to Write Meeting Notes That People Actually Read",
  navTitle:      "How to write meeting notes that people actually read",

  description:   "Most meeting notes get sent, opened once, and forgotten. The notes that actually get read share a structural shape — and it's not the chronological summary most people default to. Five steps for notes that get used.",
  deck:          "Most meeting notes get sent, opened once, and forgotten. The notes that actually get read share a structural shape — and it's not the chronological summary most people default to. Five steps for notes that get used.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `You spent an hour in the meeting. You spent twenty minutes writing it up afterward. The notes went out to fifteen people. Three opened them. One replied. By the next meeting nobody remembers what was decided last time and someone re-asks a question that was answered on page two of your notes. The hour you spent writing them is functionally invisible, and you're starting to wonder why anyone bothers.`,
    `The reason most meeting notes don't get read is structural, not stylistic. Notes written as chronological summaries — what was discussed first, then second, then third — make readers do the extraction work themselves. The reader has to scan the whole document looking for the parts that affect them, which is exactly the work the notes were supposed to do for them. Notes that get read flip this entirely: they put the actionable content first, organized by what the reader needs to know rather than by what was said in what order. The five steps below are the structural moves that produce readable notes.`,
  ],

  steps: [
    {
      name: "Decide who the notes are for — and lead with what they need first",
      body: "Meeting notes have at least two audiences with different needs: the people who were in the meeting (who need a record of what got decided) and the people who weren't (who need to know what affects them). These two audiences read notes differently. The in-meeting reader scans for confirmation that their understanding matches the record. The absent reader scans for action items, decisions that affect their work, and anything they'll need to respond to. Notes that try to serve both audiences with the same chronological narrative serve neither well. The fix is to lead with what both audiences want — decisions and action items — and let the discussion summary follow as supporting detail. The first 200 words of any meeting note should be readable on a phone screen and contain everything an absent reader actually needs.",
    },
    {
      name: "Lead with decisions and action items, not chronology",
      body: "The standard chronological structure ('first we discussed X, then we moved on to Y') is the single biggest reason meeting notes get skimmed and abandoned. Replace it with two sections at the top: 'Decisions' and 'Action Items.' Decisions are short, declarative, and dated ('Decided to move launch to Oct 15. Owner: Sarah.'). Action items have an owner, a deadline, and a one-sentence description of what done looks like. Both sections are scannable in under thirty seconds. Everything else — the discussion summary, the deferred questions, the context for each decision — comes after, as material the reader can dive into if needed but doesn't have to. This is the structural move that does most of the work of making notes readable. Even imperfect notes with this structure outperform polished notes with a chronological one.",
    },
    {
      name: "Flag what's UNASSIGNED — the action items everyone politely lets fade",
      body: "Most meetings produce a class of action items that nobody explicitly took ownership of. Someone said 'we should look into that,' the room nodded, and the action item entered an ambiguous state where everyone assumed someone else would handle it. These are the action items that disappear by the next meeting. Surfacing them in writing is the single highest-value thing meeting notes can do. The technique is to call them out explicitly: 'UNASSIGNED — investigate vendor pricing options. Needs an owner.' The flag forces the next conversation: someone either claims the action item or it gets dropped on purpose, both of which are improvements over the silent fade. Don't bury unassigned items in the action-items list; pull them into their own visually distinct subsection so the omission can't be missed. The notes are doing project management work that the meeting itself often skipped, and that's where most of their value lives.",
    },
    {
      name: "Make the read time three minutes maximum",
      body: "Meeting notes that take longer than three minutes to read don't get read in full — they get scanned, and the scan happens in the order the document is structured, which is why structure matters more than completeness. Three minutes is roughly 600 words at typical reading pace. Most meeting notes blow past that because the writer felt obligated to capture the discussion. The discussion is usually not the value; the decisions, action items, and unresolved questions are. Treat the discussion summary as compression, not transcription: one sentence per topic if possible, three sentences maximum. If a topic genuinely warrants more, link to a separate document or doc section rather than expanding inline. The notes are an interface, not an archive. The archive can live elsewhere; the notes have to be readable in the first email scan of someone's morning.",
    },
    {
      name: "Know when notes aren't the right artifact at all",
      body: "Some meetings don't actually need formal notes. Quick stand-ups, brainstorm sessions where the output is the brainstorm document itself, 1:1s where the action items live in private channels — for these, formal meeting notes can be more friction than they save. The signal you've reached this category: are you writing notes mostly because notes are what one writes after meetings, rather than because someone will use these specifically? If yes, the right artifact may be a three-line Slack message ('In our standup today: A is unblocked, B is at risk on the data dependency, C will own the customer follow-up'), or a single calendar entry update, or just an in-person hallway recap. The discipline is to choose the artifact that serves the actual outcome, not the one the situation conventionally calls for. Three-line Slack messages get read; formal notes for casual meetings often don't.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "DECISIONS\n• Move launch to Oct 15 (Sarah)\n• Cut feature B from MVP (Tom)\n\nACTION ITEMS\n• Sarah → revised timeline doc by Friday\n• UNASSIGNED → investigate vendor pricing — needs an owner\n\nDISCUSSION SUMMARY\n[everything else]",
    explanation: "This is the structural template that does eighty percent of the work of making meeting notes readable. Decisions and action items at the top, scannable in fifteen seconds. UNASSIGNED items pulled out so they can't be missed. The discussion summary follows as supporting context. Readers who only need to know what got decided can stop after the first two sections. Readers who need depth can keep reading. Both audiences are served by the same document, which is what notes are supposed to do.",
  },

  cta: {
    glyph:    '📋',
    headline: "Get the structure done for you in seconds",
    body:     "The Debrief takes a meeting transcript — Zoom captions, Teams, Otter.ai, Google Meet, or typed notes — and produces the structured output: decisions (with who drove each), action items with owners and deadlines, UNASSIGNED items flagged, tensions detected, open questions, and a meeting health score. The notes you'd spend twenty minutes writing arrive in seconds.",
    features: [
      "Distinguishes 'we agreed to' (decisions) from 'someone said we should' (not decisions)",
      "Flags UNASSIGNED action items in red — the ones that fall through the cracks",
      "Captures tensions diplomatically — useful for addressing what got swept under the rug",
      "Boss Update mode: 3–5 sentence upward summary for keeping your manager in the loop",
      "Series mode: paste 3+ recurring meetings to spot disappearing action items and re-litigated decisions",
    ],
    toolId:   'TheDebrief',
    toolName: 'The Debrief',
  },
};
