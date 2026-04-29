// ============================================================
// guides/meetings/how-to-facilitate-a-meeting-when-youre-not-the-boss.js
// ============================================================

module.exports = {
  slug:          'how-to-facilitate-a-meeting-when-youre-not-the-boss',
  category:      'meetings',
  categoryLabel: 'Meetings',

  title:         "How to Facilitate a Meeting When You're Not the Boss",
  titleHtml:     "How to Facilitate a Meeting <em>When You're Not the Boss</em>",
  shortTitle:    "Facilitate Without Authority",
  navTitle:      "How to facilitate a meeting when you're not the most senior person",

  description:   "You've been asked to run a meeting that has more senior people in it than you. Here's how to facilitate without authority — without overstepping, and without losing the room.",
  deck:          "You've been asked to run a meeting that has more senior people in it than you. Here's how to facilitate without authority — without overstepping, and without losing the room.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `The meeting you're running tomorrow has your manager in it. Your manager's manager. Two senior people from another team. And you, because someone has to facilitate, and the assignment landed with you. The meeting is on a topic where you have the most context, but the authority in the room is held by other people — which means every redirect, every time-check, every 'let's move on' has to be calibrated more carefully than it would be if you were the senior voice.`,
    `Facilitating without authority is one of the most useful skills in office life and one of the least taught. The trick is that you're not borrowing authority from your title — you're borrowing it from the meeting's stated purpose, which is a different and more durable kind of authority. Five moves.`,
  ],

  steps: [
    {
      name: "Get the senior person to bless the agenda",
      body: "Before the meeting, send the agenda to the most senior person in the room and ask 'does this look right?' Not for permission to facilitate — for confirmation of the structure. Once they've signed off, you're not enforcing your agenda; you're enforcing theirs. This single move gives you implicit authority to keep the meeting on the agenda you both agreed to. Five minutes of pre-work, full meeting of cover.",
    },
    {
      name: "Lean on the agenda, not on yourself",
      body: "When you redirect, redirect by referring to the structure: 'We've got eight minutes on this item' or 'The agenda has us moving to the next decision now.' You're not asserting your authority; you're pointing to the schedule everyone agreed to. The senior people in the room are far more likely to defer to a structure than to a person with less seniority — even when the structure was written by that person.",
    },
    {
      name: "Use questions, not statements",
      body: "'We need to move on' is a statement; statements require authority. 'Do we feel good closing this item?' is a question; questions invite the room. A senior person can answer the question with 'yes, let's move on,' and you've gotten the same outcome without having issued the directive. Whoever wields the most authority in the room ends up stating the move; you ended up causing it.",
    },
    {
      name: "Acknowledge the senior voice, then redirect",
      body: "When a senior person goes off-topic — and they will — the redirect has to be lighter than it would be for a peer. 'That's a great point and I want to make sure we're not skipping past it; can we hold that for after we land the original decision?' acknowledges, defers, and redirects without cutting them off. The acknowledgment is the price of the redirect when authority asymmetries are real.",
    },
    {
      name: "Close with explicit handoffs",
      body: "Most facilitators close meetings by reading out the decisions. When you're not the boss, also do explicit handoffs: 'I'll send the recap by EOD; [senior person] will follow up with [other party] on the open question.' Naming what you'll do and what they'll do, out loud, makes the meeting's outputs concrete and gives the senior people a clean way to commit publicly. The recap is the meeting's product, and the handoffs are who owns the product.",
    },
  ],

  cta: {
    glyph:    '🛡',
    headline: "Get the facilitation playbook for the room you're in",
    body:     "Meeting Hijack Preventer reads your attendee list and topic, then generates an agenda and facilitation scripts calibrated for the seniority dynamic — pre-meeting blessing prompts, redirect language, and structured closes.",
    features: [
      "Seniority-aware scripts",
      "Pre-meeting alignment prompts",
      "Question-form redirects",
      "Acknowledgment templates",
      "Structured-close language",
    ],
    toolId:   'MeetingHijackPreventer',
    toolName: 'Meeting Hijack Preventer',
  },
};
