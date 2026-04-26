// ============================================================
// guide-specs/apologies/how-to-apologize-when-you-really-screwed-up-at-work.js
// ============================================================
// Source of truth for /guides/apologies/how-to-apologize-when-you-really-screwed-up-at-work.
// Edit here; run `node scripts/build-guides.js apologies` to regenerate.
// ============================================================

module.exports = {
  slug:          'how-to-apologize-when-you-really-screwed-up-at-work',
  category:      'apologies',
  categoryLabel: 'Apologies',

  title:         "How to Apologize When You Really Screwed Up at Work (Without Making It Worse)",
  titleHtml:     "How to Apologize When You Really Screwed Up at Work <em>(Without Making It Worse)</em>",
  shortTitle:    "How to Apologize When You Really Screwed Up at Work",
  navTitle:      "How to apologize when you really screwed up at work without making it worse",

  description:   "When the mistake is real and the impact is real, the apology has to match. Five steps for owning a serious work mistake in a way that rebuilds trust instead of eroding it further.",
  deck:          "When the mistake is real and the impact is real, the apology has to match. Five steps for owning a serious work mistake in a way that rebuilds trust instead of eroding it further.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `It's the morning after. Or the hour after. The mistake is clear, the impact is real, and there's no version of the next conversation where you don't have to apologize. The question isn't whether — it's how, and the gap between an apology that rebuilds trust and one that quietly damages it further is wider than most people realize.`,
    `Most workplace apologies for serious mistakes fail in one of three ways. They're qualified ("I'm sorry if my actions led to..."), they pivot to explanation in the same breath as the apology ("I'm sorry, but the system was..."), or they centerpiece the apologizer's feelings about having made the mistake instead of the impact on the people who took the hit. All three feel like apologies to the person giving them. None feel like apologies to the person receiving them. The five steps below are designed to close that gap.`,
  ],

  steps: [
    {
      name: "Take ownership in the active voice",
      body: "The single biggest tell that an apology is shaky is passive-voice ownership. 'Mistakes were made.' 'The deadline was missed.' 'The data didn't get to the team in time.' Each of these is a sentence about what happened to nobody. Active voice changes the shape entirely: 'I made a mistake.' 'I missed the deadline.' 'I didn't get the data to the team.' The same content, twice the credibility. Listeners read passive voice as an attempt to distribute or evade responsibility, even when that's not your conscious intent. If you find yourself drafting a sentence in passive voice, rewrite it. The discipline is to use 'I' as the subject of every sentence describing what went wrong, including the ones that are uncomfortable to say out loud.",
    },
    {
      name: "Name the specific impact, not the abstract regret",
      body: "'I'm sorry for what happened' is content-free. 'I'm sorry the team had to work through the weekend to fix what I broke' is an apology. The difference is naming the actual impact on the actual people. This step is the hardest one for most people because it requires you to look directly at the consequences you'd rather not catalogue — the late nights someone else worked, the trust someone else lost, the project someone else has to redo. Name them out loud. Vague apologies feel like apologies to the apologizer; specific apologies feel like apologies to the recipient. The level of specificity should match the level of harm: a small mistake gets a brief specific acknowledgment; a serious mistake gets the full inventory.",
    },
    {
      name: "Apologize first, explain later (or not at all)",
      body: "The instinct to explain runs hot for everyone. You want context. You want them to understand it wasn't malicious, wasn't lazy, wasn't reckless. But every explanation that sits next to an apology in the same breath pulls credibility from the apology — even when the explanation is true and relevant. The order matters. Apology first, complete and unqualified, with no 'but' attached. If explanation is appropriate, it comes later, in a separate beat, ideally after the other person has had a chance to respond. Often, the explanation doesn't need to come at all — your manager or colleague mostly wants to know that you understand what happened and that you'll fix it, not why it happened. Save the explanation for the post-mortem, not the apology.",
    },
    {
      name: "Offer concrete repair, not feelings",
      body: "'I feel terrible about this' is about you. 'Here's what I'm going to do to make it right' is about them. Serious mistakes need concrete repair language: what you'll do to fix the immediate damage, what you'll change to prevent the next one, what the timeline looks like. The repair doesn't have to be heroic — overpromising a fix is its own version of making the apology about you ('look how badly I want to make this right'). It has to be specific, realistic, and yours to deliver. If you don't yet know what the repair looks like, say that, and commit to a timeline for figuring it out: 'I want to think about this and come back tomorrow with a plan.' Concrete commitments rebuild trust faster than emotional displays do.",
    },
    {
      name: "Know when 'apology' is becoming a way to avoid accountability",
      body: "There's a pattern that masquerades as accountability and quietly does the opposite: the apology that's so heartfelt, so emotional, so sustained, that the apologizer becomes the one who needs comforting. The conversation that started with someone else's harm ends with everyone reassuring you that it's okay, you're being too hard on yourself, the team forgives you. This is accountability flight. It looks like maximum ownership; it functions as minimum repair. The signal you've crossed into it: are people now consoling you instead of you addressing the harm? If yes, the apology has stopped being a tool for repair and started being a tool for absorption. Pull back. Reset to specific impact and concrete repair. The goal is for the other person to leave the conversation feeling that you understood what they experienced, not for you to leave feeling that you've done the apology correctly.",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "I made a mistake — I sent the wrong file to the client, and you spent your weekend fixing what I should have caught Friday afternoon. I'm sorry. I want to walk through what I'll do differently and how I'm going to make this right.",
    explanation: "This opening does the four hardest things in sequence: active-voice ownership ('I made a mistake'), specific impact ('you spent your weekend fixing what I should have caught'), unqualified apology ('I'm sorry' as a complete sentence), and forward motion to repair. No 'but', no 'if', no centering of your own feelings. It's short, direct, and lets the other person respond to a clean apology rather than a tangled one.",
  },

  cta: {
    glyph:    '⚖️',
    headline: "Calibrate the apology to the actual harm you caused",
    body:     "ApologyCalibrator analyzes what happened, who was affected, and your actual responsibility, then returns a calibrated apology level (1–5) and templates tuned to the situation. For serious mistakes, it produces level 4–5 templates with full accountability framing, plus a 'what NOT to say' list that catches the most common ways serious apologies go sideways.",
    features: [
      "5-level calibration system — matches apology weight to actual harm",
      "Templates scaled to relationship (boss, peer, direct report, partner, stranger)",
      "'What NOT to say' list catches over-apology and accountability flight",
      "Repair-language guidance for serious mistakes (level 4–5)",
      "Permission framing when no apology is needed (level 1)",
    ],
    toolId:   'ApologyCalibrator',
    toolName: 'Apology Calibrator',
  },
};
