// ============================================================
// guide-specs/apologies/how-to-apologize-at-work-for-a-mistake-everyone-saw.js
// ============================================================
// Source of truth for /guides/apologies/how-to-apologize-at-work-for-a-mistake-everyone-saw.
// Edit here; run `node scripts/build-guides.js apologies` to regenerate.
// ============================================================

module.exports = {
  slug:          'how-to-apologize-at-work-for-a-mistake-everyone-saw',
  category:      'apologies',
  categoryLabel: 'Apologies',

  title:         "How to Apologize at Work for a Mistake Everyone Saw (Without Making It Your Whole Identity)",
  titleHtml:     "How to Apologize at Work for a Mistake Everyone Saw <em>(Without Making It Your Whole Identity)</em>",
  shortTitle:    "How to Apologize at Work for a Mistake Everyone Saw",
  navTitle:      "How to apologize at work for a mistake everyone saw without making it your whole identity",

  description:   "A public work mistake has different rules than a private one. The audience is bigger, the stakes are reputation, and over-apologizing is its own failure mode. Five steps for owning it cleanly and moving forward.",
  deck:          "A public work mistake has different rules than a private one. The audience is bigger, the stakes are reputation, and over-apologizing is its own failure mode. Five steps for owning it cleanly and moving forward.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `It happened in the meeting. Or in the company-wide Slack channel. Or in front of the client. Whatever the venue, the mistake had witnesses, and you can feel the shape of the room change as everyone registers what just happened. Now there's a question hanging in the air: how does the person who just made the mistake handle it next?`,
    `Public work mistakes have rules that private ones don't. The apology has to address the harmed party, but it also has to register with the audience that watched it happen — because the audience is now forming a story about you that will travel further than the mistake itself. Get it right and the story becomes "they handled that with grace"; get it wrong and the story becomes "did you see how they reacted?" The five steps below are designed for that specific situation, where the apology is half repair and half reputation management, and where over-correcting is a failure mode in both directions.`,
  ],

  steps: [
    {
      name: "Address it directly — don't pretend it didn't happen",
      body: "The single fastest way to make a public mistake worse is to act as though everyone has agreed not to mention it. The room saw what happened. The colleagues saw, the client saw, the team you presented to saw. Skipping past it without acknowledgment reads as one of two things, neither good: either you didn't realize the mistake was visible (which makes you look out of touch), or you're hoping no one will bring it up (which makes you look evasive). Direct acknowledgment, ideally before someone else has to surface it, is the move. The acknowledgment doesn't have to be elaborate — often a single sentence at the start of the next interaction is enough: 'Before we go on, I want to address what happened in yesterday's meeting.' Then continue. The acknowledgment itself is most of the work.",
    },
    {
      name: "Apologize once, in the right room — not five times to five audiences",
      body: "The instinct after a public mistake is to apologize to everyone individually — the person directly affected, your manager, the team, the colleague who was in the room, the witness who probably didn't even notice. This is the most common over-apology pattern and it works against you in three ways at once: it amplifies the mistake by making it a recurring topic, it signals anxiety rather than ownership, and it puts the burden on each recipient to reassure you that it's fine. Pick the right room — usually the smallest group that contains everyone who was directly affected — and apologize once, completely, in that room. To everyone else, the public acknowledgment from step 1 is enough. If someone outside that room raises it later, you can address it then; but you don't preempt by canvassing every possible witness.",
    },
    {
      name: "Right-size the apology — don't shrink yourself in the process",
      body: "Public mistakes invite a particular failure mode: the apology that's so deferential it becomes its own problem. 'I'm so sorry, I can't believe I did that, I've been mortified all week, please tell me how I can make this right.' Each sentence is honest, and the sum of them makes you smaller in the room. Colleagues read the over-apology as a signal that the mistake mattered more than it did, which then becomes the story rather than the mistake itself. The right-sized public apology is brief, specific, and confident. 'I made a mistake yesterday — I sent the deck to the wrong distribution list. That shouldn't have happened, and I've put a check in place so it won't again.' Then move on. Brevity in a public apology reads as ownership; length reads as anxiety. The audience watches both signals and updates accordingly.",
    },
    {
      name: "Show observable change, not feelings about the mistake",
      body: "The reason a public mistake keeps coming up isn't usually the mistake itself — it's the absence of a visible change that signals you've absorbed the lesson. 'I feel terrible' is a feeling. 'I added a checklist step before any client send' is observable. The audience that watched the mistake happen will keep watching for the next ten interactions to see whether anything is actually different, and the answer they reach determines how long the mistake travels. Make the change visible. If the mistake was a process error, name the new process. If it was a judgment error, describe what you'll do differently in the same situation. If it was a delivery error, let people see the new delivery shape. None of this needs to be performed loudly — the change just needs to be visible enough that anyone watching can register it without your having to point it out.",
    },
    {
      name: "Know when ongoing apology has become your identity",
      body: "There's a pattern that catches people who handle the first three steps well: they keep apologizing past the point where the mistake has actually been processed by the room. Three weeks later, they're still bringing it up in 1:1s. Two months later, it's a recurring self-deprecating joke in stand-up. Six months later, it's the thing they reference whenever they take on something risky. What started as accountability has quietly become an identity — the person who once made That Mistake. This is the most invisible failure mode of public-mistake apologies because it feels like ongoing humility. From the outside, it functions as a self-imposed demotion. The signal you've crossed into it: have you mentioned the mistake in the last week, unprompted? If yes, the apology has stopped being a tool and started being a story you tell about yourself. The repair is done. Stop carrying it. The mistake belongs to a moment in time; you don't have to belong to it permanently.",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "I want to address what happened in yesterday's meeting. I gave the team the wrong revenue figure — I had Q3 numbers when the discussion was about Q4. The right number is in the corrected deck I'll send after this. That's on me, and I've already checked the source-of-truth before today's discussion.",
    explanation: "This is the full public apology — four sentences, total. It does the four things the public format requires: direct acknowledgment ('I want to address what happened'), specific ownership ('I gave the team the wrong revenue figure'), concrete repair ('the corrected deck I'll send after this'), and observable change ('I've already checked the source-of-truth before today'). No 'I'm so sorry,' no centering of feelings, no apology-tour to other audiences. The audience reads it as ownership and moves on, which is what the apology is supposed to make possible.",
  },

  cta: {
    glyph:    '⚖️',
    headline: "Get the right size and shape for a public apology",
    body:     "ApologyCalibrator analyzes the mistake, the audience, and your responsibility, then returns a calibrated apology with templates tuned for public/professional contexts. The 'what NOT to say' list catches over-apology patterns that shrink you in the room, and the calibration prevents both under- and over-correcting in front of an audience.",
    features: [
      "5-level calibration with templates tuned for public/professional contexts",
      "'What NOT to say' catches the over-apology patterns specific to public mistakes",
      "Brevity guidance — when one sentence is right and when more is needed",
      "Observable-change language, not feelings-about-the-mistake language",
      "Permission framing when the mistake doesn't actually need a public apology",
    ],
    toolId:   'ApologyCalibrator',
    toolName: 'Apology Calibrator',
  },
};
