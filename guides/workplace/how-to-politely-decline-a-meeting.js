// ============================================================
// guides/workplace/how-to-politely-decline-a-meeting.js
// ============================================================
// 2026-09-26: merged with the duplicate guides/meetings/ version of this
// guide. This URL survives (keep-list, indexed); the meetings URL 301s here
// (backend/server.js MERGED_GUIDE_REDIRECTS). From the meetings version:
// the title, the opening scene, "acknowledge the goal", the scripted line,
// "decline early", and the call-to-action. From this one: warmth, the
// better-placed colleague, and brevity.

module.exports = {
  slug:          'how-to-politely-decline-a-meeting',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Politely Decline a Meeting (Without Looking Like You're Hiding)",
  titleHtml:     "How to Politely Decline a Meeting <em>(Without Looking Like You're Hiding)</em>",
  shortTitle:    "Decline a meeting",
  navTitle:      "How to politely decline a meeting",

  description:  "How to politely decline a meeting: thank them, name the goal, offer input instead, keep the reason short, don't apologize, and decline early.",
  deck:         "To decline a meeting politely, reply early, thank the organizer and name the meeting's goal, then offer something in place of attending — written input, a quick async update, or a colleague who can cover it. Keep the reason short ('I have a conflict' is enough) and don't apologize for declining.",
  answerList: [
    "Thank them and name the meeting's goal.",
    "Offer something instead: written input or an update.",
    "Keep the reason short: 'I have a conflict' is enough.",
    "Don't apologize for declining.",
    "Decline early, not the morning of.",
  ],

  published:     '2026-04-28',
  modified:      '2026-10-08',

  ledes: [
    `The invite arrived at 4:47pm. It's for tomorrow at 10am. There's no agenda, eight people on it, and you genuinely cannot think of a reason you should be there. You're not the decision-maker or the subject-matter expert, and your being there won't change the outcome. But declining feels risky — it might read as not being a team player — so you're going to accept, half-attend, multitask through it, and resent the hour.`,
    `Saying no cleanly is mostly about giving the organizer a graceful out: a way to take you off the invite that doesn't require them to admit the meeting was unnecessary. Done well, it's barely noticed, you keep the relationship, and you get the hour back. Here's the version that works.`,
  ],

  steps: [
    {
      name: "Open warmly, and name the goal — not the meeting",
      body: "Start with appreciation, not deflection: 'Thanks for including me.' Then name what the meeting is trying to accomplish rather than your objection to it. 'I want to make sure the launch plan gets locked in this week' is a different opening than 'I don't think I need to be on this call.' The first keeps you on the same team as the organizer; the second casts you as an obstacle to what they're trying to do — which is rarely the real situation. People respond very differently to warm declines than to cold ones, even when the substance is identical.",
    },
    {
      name: "What do you say to decline a meeting?",
      body: "A bare decline forces the organizer to either accept your absence or push back. A decline plus an offer makes the same point and gives them somewhere to go. Send written input ahead of time, read the notes after, or suggest someone better placed to attend — 'Sarah is closer to this and would get more out of it than I would.' The offer doesn't have to be big; it has to remove their reason to need you in the room. It turns a refusal into a redirect, and redirects almost never create friction.",
    },
    {
      name: "Keep the reason short and specific",
      body: "'I have a conflict' is a complete sentence and almost never gets pushed back on. 'I'm protecting this week for the Q3 report' works too. Vague reasons sound like excuses; specific ones sound like reality. But stop there — you don't owe a detailed explanation, and the more you explain, the more openings you give for a reschedule. A two-sentence decline lands better than a five-sentence one. Treat it as a normal calendar adjustment, not a confession.",
    },
    {
      name: "Don't apologize for declining",
      body: "'So sorry, I really wish I could' frames declining as something to feel bad about. 'Won't be able to make it — here's my input' frames it as ordinary professional judgment, which is what it is. The apology is a tell that you think you owe the organizer more than your input. You don't. Replace apology with appreciation and information, and stop.",
    },
    {
      name: "Decline early, not the morning of",
      body: "A decline at 9:55am for a 10am meeting is rude. The same words sent the day before are professional. Once you've decided you're not going, send the message — it gives the organizer time to adjust, cancel, or move on. The longer you sit on it, the more it looks like avoidance, which is the exact thing you were trying not to look like.",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "Thanks for including me. I won't be able to make this one — but I'll send written input on the launch plan tomorrow morning so you have it before the meeting.",
    explanation: "This covers what makes a decline land well: it's warm, it's short, it offers a contribution in place of attendance, and it removes the organizer's need to chase you. Adapt the specifics; keep the structure.",
  },

  cta: {
    glyph:    '🕵️',
    headline: "Should this be a meeting at all?",
    body:     "Justify My Meeting gives you the argument before the script: why this verdict, what would change it, and what the meeting costs in people's time. Then it drafts the message — one that proposes a shorter or written version and keeps the relationship intact, not one that assumes you can walk away.",
    features: [
      "Tailored decline messages",
      "Written alternatives to propose",
      "Verdict: worth it, borderline, or not",
      "Tone that invites rather than commands",
    ],
    toolId:   'JustifyMyMeeting',
    toolName: 'Justify My Meeting',
  },
};
