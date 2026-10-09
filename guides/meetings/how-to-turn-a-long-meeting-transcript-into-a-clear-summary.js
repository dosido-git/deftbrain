module.exports = {
  "slug": "how-to-turn-a-long-meeting-transcript-into-a-clear-summary",
  "category": "meetings",
  "categoryLabel": "Meetings",
  "title": "How to Turn a Long Meeting Transcript Into a Clear Summary",
  "titleHtml": "How to Turn a Long Meeting Transcript <em>Into a Clear Summary</em>",
  "shortTitle": "How to Turn a Transcript Into a Clear Summary",
  "navTitle": "How to turn a long meeting transcript into a clear summary",
  "description": "A 14,000-word transcript isn't a summary, even compressed. Five steps for distilling a long meeting transcript into something colleagues can actually use.",
  "deck": "To turn a long meeting transcript into a useful summary, distill rather than compress: pull out decisions as standalone bullets, list action items with owners and deadlines (flagging any without), record unresolved disagreements plainly, and check with attendees when the transcript can't show what was meant.",
  "answerList": [
    "Distill outcomes; don't shorten the conversation.",
    "List decisions as standalone bullets.",
    "Give action items owners, or flag them UNASSIGNED.",
    "Record unresolved tensions plainly.",
    "Check with attendees when tone mattered."
  ],
  "ledes": [
    "A useful summary of a long meeting transcript is organized by outcome, not chronology. It lists decisions made, action items with owners and deadlines, items deferred, and disagreements left unresolved, and it leaves out the clarifications and asides that make up much of any transcript. Where ownership or deadlines are missing, the summary says so. For sensitive meetings, a transcript may miss meaning carried by tone, so attendees' input helps.",
    "The recording generated a fourteen-thousand-word transcript. Now you need something a colleague can read in three minutes and act on. Compressing it just produces a shorter wall of text."
  ],
  "steps": [
    {
      "name": "What's the difference between summarizing and distilling a meeting?",
      "body": "The most useful move when working from a long transcript is to swap the summary frame for a distillation frame. A summary tries to compress: it preserves the topics and their order, just in fewer words. Distillation throws away most of what was said and keeps only the parts that produced outcomes. A long transcript, distilled well, often fits on a page. The reduction is large because much of any transcript is connective tissue — clarification, context-setting, asides, agreement noises, the verbal equivalent of throat-clearing — that nobody needs in writing. The discipline is to read the transcript looking for four things: what got decided, what got assigned, what got tabled, and where there was unresolved disagreement. Everything else is signal that didn't make it through to outcome, and including it dilutes the artifact rather than enriching it."
    },
    {
      "name": "How do you pull decisions out of a meeting transcript?",
      "body": "The most important section of any meeting summary is the decisions section, and the most common failure is to bury decisions inside discussion paragraphs. 'After much back and forth, the team agreed to move the launch to October 15' buries the decision (move launch to Oct 15) inside the narrative (after much back and forth). Pull the decision out as a standalone bullet, dated and attributed: 'Decision: Launch moves to Oct 15 (Sarah, owner).' The discussion that produced the decision is supplementary context, not the primary content. A decision read in isolation should be unambiguous — someone reading only the decisions section should be able to act on what they see. Decisions that need surrounding paragraphs to be understood are decisions that weren't actually settled in the meeting, which is its own useful signal but a different category."
    },
    {
      "name": "How should action items appear in a meeting summary?",
      "body": "Action items without owners and deadlines are not action items; they're suggestions. Most meeting transcripts contain a mix of both, and the summary's job is to call the difference out clearly. Action items with clear ownership get listed with the owner's name and a deadline. Action items where the transcript is ambiguous about ownership get flagged explicitly: 'UNASSIGNED — investigate vendor pricing. Surfaced by Tom; no clear owner taken.' Action items where the deadline was vague get the same treatment: 'No deadline set — needs follow-up.' The flag isn't a failure of the summary; it's the summary doing the project-management work the meeting itself skipped. Recipients can then either claim the action items or drop them on purpose, both of which are improvements over the silent disappearance that ambiguous action items usually produce."
    },
    {
      "name": "Should a meeting summary include disagreements?",
      "body": "There's a category of meeting content that summaries often quietly omit: the disagreements that didn't resolve, the tensions between functions or individuals, and the topics that got tabled because the room couldn't reach alignment. Omitting these makes the summary feel cleaner but actively misleads readers about what happened. The team that reads a summary saying 'the timeline was discussed and Q4 launch confirmed' will be surprised when engineering pushes back at the next meeting; the team that reads 'Q4 launch confirmed; engineering raised concerns about test coverage that weren't fully resolved — flagged for next week's sync' is prepared. Tension capture should be diplomatic but not euphemistic. 'Engineering and design disagreed on whether the homepage redesign was in scope; deferred to product for resolution by Friday' is appropriately direct. 'Some healthy debate around the homepage' is too soft to be useful. The summary's value is partly that it tells readers what they need to know to navigate what comes next; concealed tensions defeat that."
    },
    {
      "name": "When is a transcript not enough for a meeting summary?",
      "body": "Some meetings produce summaries that the transcript can't actually support. The transcript captures what was said but not what was meant — and there are meetings where the work of the meeting was happening in tone, body language, eye contact, or shared context that doesn't show up in text. Hard interpersonal conversations, sensitive client meetings, board-level discussions where the official record diverges from the actual sub-conversation — for these, working from transcript produces summaries that are technically accurate and substantively wrong. The signal you've reached this category: does the transcript, read straight through, leave you uncertain what actually happened? If yes, the summary needs to draw on more than the transcript — direct conversations with attendees, your own notes, your read of the room. The transcript is one input; sometimes it's enough, sometimes it isn't. The discipline is recognizing which kind of meeting you just had before you start writing."
    }
  ],
  "callout": {
    "afterStep": 1,
    "scriptedLine": "DECISIONS (3)\n• Launch moves to Oct 15 — Sarah (owner)\n• Feature B cut from MVP — Tom (owner)\n• Pricing review tabled until next week\n\nACTION ITEMS (5)\n• Sarah → revised timeline doc by Fri 4/4\n• Engineering → test coverage report by Wed 4/2\n• UNASSIGNED → vendor pricing research — needs owner\n\nTENSIONS / UNRESOLVED\n• Engineering raised test-coverage concerns on Q4 launch — flagged for next sync",
    "explanation": "This is the working shape of a transcript-derived summary. Decisions counted and listed cleanly; action items with explicit owners or explicit UNASSIGNED flags; tensions captured directly rather than buried in narrative. The whole artifact is readable in under a minute. Compare to the alternative — a paragraph-based 'we discussed launch timing, the team raised some concerns, and ultimately agreed to move to October 15 with revised testing approach' — which buries the same information in prose that the reader has to do the extraction work on themselves."
  },
  "cta": {
    "glyph": "📋",
    "headline": "Skip the manual extraction — paste the transcript and get the summary",
    "body": "The Debrief takes raw transcripts from Zoom, Teams, Otter.ai, Google Meet, or typed notes and produces the distilled output: decisions, action items with owners, UNASSIGNED items flagged, tensions detected, and a meeting health score. The 30-minute extraction job becomes a 30-second one, and the structure is consistent across every meeting you process.",
    "features": [
      "Works with raw transcripts from any source — Zoom captions, Teams, Otter.ai, Google Meet",
      "Distinguishes decisions from discussion automatically",
      "Flags UNASSIGNED action items and missing deadlines explicitly",
      "Captures tensions diplomatically without softening them into uselessness",
      "Meeting type tuning — standup vs planning vs client meetings get different extraction logic"
    ],
    "toolId": "TheDebrief",
    "toolName": "The Debrief"
  },
  "published": "2026-04-25",
  "modified": "2026-10-09",
  "reviewed": true
};
