// ============================================================
// guide-specs/workplace/how-to-hold-someone-accountable-in-writing.js
// ============================================================
// Source of truth for /guides/workplace/how-to-hold-someone-accountable-in-writing.
// Edit here; run `node scripts/build-guides.js workplace` to regenerate.
// ============================================================

module.exports = {
  slug:          'how-to-hold-someone-accountable-in-writing',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Hold Someone Accountable in Writing Without Making It Personal",
  titleHtml:     "How to Hold Someone Accountable in Writing <em>Without Making It Personal</em>",
  shortTitle:    "How to Hold Someone Accountable in Writing",
  navTitle:      "How to hold someone accountable in writing without making it personal",

  description:   "Accountability in writing is documentation, not punishment. Five steps for raising a real issue with a colleague in writing — clear enough that nothing is ambiguous, professional enough that the relationship survives.",
  deck:          "Accountability in writing is documentation, not punishment. Five steps for raising a real issue with a colleague in writing — clear enough that nothing is ambiguous, professional enough that the relationship survives.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `Something didn't get done. A handoff was dropped. A commitment was missed for the second or third time, and now you have to be the one who points to it. The conversation could happen in person, but the situation calls for writing — either because the pattern needs a record, or because the person you're addressing is remote, or because the issue is one that's going to come up at a review and you want it documented in real time. You're going to write it, and the question is how to write it in a way that holds the line without lighting a fire.`,
    `Accountability writing has a specific failure mode that everyone has been on the receiving end of: the email that's technically professional but reads as an attack, that the recipient remembers for years, that ends up forwarded to people it wasn't meant for. The cost of a poorly written accountability email is much higher than the cost of the original issue, and most people who write them don't realize they've crossed the line until they see the reply. The five steps below are the structural rules that keep accountability writing on the right side of the line — clear, specific, professional, and survivable.`,
  ],

  steps: [
    {
      name: "Separate the behavior from the person",
      body: "The single move that determines whether accountability writing reads as documentation or attack is whether the focus stays on the behavior or drifts onto the person. 'The deadline was missed' is documentation. 'You're not delivering on commitments' is a characterization. Both might be true, but only one is appropriate in a written record. Behavior-focused writing names actions and outcomes — what was committed, what happened, what the impact was. Person-focused writing reaches for traits, patterns, and characterizations that the recipient will (correctly) read as attacks. The discipline is to write every sentence about what happened, not who did it that way. 'You' should appear sparingly, and almost always paired with a specific action or commitment, not a trait or pattern. 'You committed to delivering X by Y' is fine. 'You always do this' is not.",
    },
    {
      name: "Name the specific commitment, not the general expectation",
      body: "Accountability writing falls apart most often at the level of specificity. Vague accountability emails — 'I expected this to be done by now,' 'we need this kind of thing to be more reliable' — invite argument because there's nothing concrete to anchor to. Specific accountability is harder to argue with. 'On the 12th you committed in our standup to having the analysis ready by Friday the 20th. As of Monday the 23rd I haven't received it.' That sentence has dates, sources, and a precise gap, all of which are factual claims the recipient can either confirm or correct. The asker now has to engage with what actually happened, rather than disputing whether your general expectations were reasonable. Specificity also has a secondary effect: it signals that you've thought carefully about this, not that you're firing off frustration. A vague accountability email reads as venting; a specific one reads as documentation.",
    },
    {
      name: "Lead with the impact, not the offense",
      body: "Accountability writing that opens with the breach ('You missed the deadline') puts the recipient on the defensive in the first sentence. Accountability writing that opens with the impact ('The downstream team had to delay the review meeting because the analysis didn't arrive') gives the recipient a reason to engage with the substance before they reach the part that's about them. The order matters. Impact-first framing makes the conversation about consequences in the world rather than about the recipient's failure, which keeps it on workable ground. The breach still gets named — usually in the second or third sentence — but it's now positioned as the cause of a problem rather than as the entire content of the message. Recipients who are led with impact are much more likely to engage substantively; recipients who are led with the breach often spend their reply defending against the framing rather than addressing the issue.",
    },
    {
      name: "Ask what changed and what you can do — don't lecture",
      body: "There's a moment in accountability writing where the writer has to decide whether to explain the importance of the missed commitment or to ask the recipient about it. Explaining ('this matters because…' followed by a paragraph) is the move that turns accountability writing into a lecture, which the recipient will resent regardless of how technically professional the language is. Asking ('what got in the way?' / 'is there something I should know about?' / 'what would help avoid this next time?') is the move that turns it into a conversation. Asking accomplishes two things explaining can't: it surfaces information you might not have (the missed deadline could have a real cause that changes the response), and it positions you as someone interested in the future rather than scoring points about the past. The signal you've crossed into lecture territory: are you spending more sentences on why the issue matters than on what to do about it? If yes, cut the explanation and replace it with questions.",
    },
    {
      name: "Know when accountability in writing is the wrong tool — and when it's the right one for the wrong reason",
      body: "There are situations where accountability in writing is the wrong move. First contact about a one-off mistake almost always belongs in conversation; writing it down on the first instance reads as preemptive documentation, which damages the relationship before it needs to be damaged. Sensitive interpersonal accountability — feedback about how someone behaves in meetings, with colleagues, in their tone — also belongs in conversation, because writing strips the warmth that makes hard feedback receivable. Writing is the right tool for repeat issues, for situations involving multiple parties or remote teams, and for accountability that needs a record because something formal may follow. The other failure mode worth naming: writing accountability primarily because you want a paper trail to use against the recipient later. If the email's real audience is a future HR conversation rather than the recipient's actual behavior, the email itself is doing two jobs at once and the second job will leak through. Recipients sense paper-trail emails immediately, and they almost always escalate the situation rather than resolving it. Write to address the issue or don't write — and if you need a record, build one through the resolution itself, not by drafting an email that documents how unreasonable the recipient was.",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "I want to flag something before our next sync. The analysis was due Friday based on what we agreed in last week's standup, and as of this morning I don't have it — which means the downstream review meeting is going to slip. I want to understand what got in the way and figure out how we get this back on track.",
    explanation: "This is the structural template that does each of the four hardest things in sequence: separates behavior from person ('the analysis was due,' not 'you didn't deliver'), names the specific commitment ('Friday based on what we agreed in last week's standup'), leads with impact ('the downstream review meeting is going to slip'), and ends with an ask rather than a lecture ('I want to understand what got in the way'). The recipient can engage substantively without first having to defend against being attacked.",
  },

  cta: {
    glyph:    '🔨',
    headline: "Hold the line without crossing it",
    body:     "VelvetHammer takes the accountability draft you'd write when frustrated and produces three professional variants — Collaborative (assumes good faith reasons), Balanced (clear documentation of the issue), and Firm (after polite attempts have failed). Each preserves the factual specifics while removing language that reads as character attack rather than behavior documentation.",
    features: [
      "Three accountability levels — Collaborative, Balanced, Firm — for different stages of the pattern",
      "Strips characterization language ('always,' 'never,' 'unreliable') while preserving factual claims",
      "Behavior-focused phrasing — names the action, not the person",
      "Goal-tuned — first instance vs repeat pattern vs formal escalation",
      "Privacy by design — your unfiltered draft is never stored",
    ],
    toolId:   'VelvetHammer',
    toolName: 'Velvet Hammer',
  },
};
