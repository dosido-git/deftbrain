// ============================================================
// guide-specs/planning/how-to-find-the-holes-in-your-own-thinking-before-someone-else-does.js
// ============================================================

module.exports = {
  slug:          'how-to-find-the-holes-in-your-own-thinking-before-someone-else-does',
  category:      'planning',
  categoryLabel: 'Planning',

  title:         "How to Find the Holes in Your Own Thinking Before Someone Else Does",
  titleHtml:     "How to Find the Holes in Your Own Thinking <em>Before Someone Else Does</em>",
  shortTitle:    "Find Holes in Your Own Thinking First",
  navTitle:      "How to find the holes in your own thinking before someone else does",

  description:   "Your thinking has holes. So does everyone's. Five steps for finding the ones in yours before they get pointed out by someone with bigger stakes than you'd like.",
  deck:          "Your thinking has holes. So does everyone's. Five steps for finding the ones in yours before they get pointed out by someone with bigger stakes than you'd like.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `You've thought it through. The reasoning feels solid, the conclusion feels right, and you're about to commit — pitch the idea, send the proposal, make the decision, take the step. The small worry: what if there's a hole in your thinking you can't see, and the first person to spot it is going to be the person you most needed not to spot it?`,
    `Everyone has holes in their thinking. The question isn't whether yours has them but whether you can find them before someone with more leverage finds them for you. The discipline is harder than it sounds, because the same brain that produced the thinking is the one that has to evaluate it — and that brain is working from the same assumptions, blind spots, and motivated reasoning that produced the thinking in the first place. The five steps below are the structural moves that work around this, and the meta-step that catches the situations where finding the holes has tipped into something else.`,
  ],

  steps: [
    {
      name: "Steelman the strongest objection you can imagine",
      body: "The most useful single technique for finding holes is the steelman: write the strongest possible version of the case against your conclusion. Not the weakest, not the version that's easy to refute — the strongest, written by someone smart and informed who genuinely disagrees. Most people skip this because it feels like arguing with themselves; it's actually the cheapest source of insight available. The steelman frequently surfaces the assumption you'd been treating as obvious that isn't, the framing that hides a weak point, or the data you'd dismissed too quickly. The discipline is to write it as if you'd be graded on how compelling it is — which means actually trying. A steelman that you can refute in two sentences was a strawman; a steelman that you have to think about for a day is doing real work. The threshold for the technique succeeding: you've identified at least one objection you don't have a clean answer for. If everything has clean answers, you haven't steelmanned hard enough.",
    },
    {
      name: "Ask three different people who'll think differently",
      body: "Your own thinking has limits set by your background, your incentives, and your context. Other people have different limits — and where their limits don't overlap with yours is where they can see the holes you can't. The technique is to identify three people whose thinking is structurally different from yours and ask them what worries them about your plan. Not 'what do you think' (which invites general feedback) but 'what's worrying you' (which surfaces specific risks). One of the three should be someone more senior than you in your domain. One should be someone in a different function or industry. One should be someone known for being skeptical or contrarian. Each will spot different things. The senior person sees patterns from experience; the cross-function person sees the assumptions your function shares; the contrarian sees the optimism baked into the framing. Three perspectives surface most of what you'd have missed solo, and the cost is three thirty-minute conversations.",
    },
    {
      name: "Look for what you're avoiding examining",
      body: "There's a specific kind of hole that's harder to find than logical errors or missing evidence: the question you've been avoiding. The signal is internal — when you imagine someone asking it, you feel a small flinch or want to deflect. The avoidance is information. What you're avoiding examining is usually one of three things: a question that would change the answer if you faced it honestly, a piece of evidence that doesn't fit your conclusion, or an alternative path you've been ignoring because committing to the current one feels too sunk-cost to walk back. The discipline is to surface the avoided question in writing, sit with the discomfort, and answer it as honestly as you'd answer it for someone else. Sometimes the answer reinforces your conclusion (in which case the avoidance was anticipatory, not protective). Sometimes the answer changes the conclusion meaningfully. Either way, the avoided question is a hole you're filling with hope rather than analysis, and surfacing it is what closes it.",
    },
    {
      name: "Identify what would change your mind",
      body: "A useful test of whether your conclusion is well-reasoned is whether you can name what evidence would change it. If the answer is 'nothing' or 'I'd have to think about it,' the conclusion isn't well-reasoned — it's a position you've adopted without holding to a falsifiable standard. The format that works: 'I'm confident this approach will work because of A, B, and C. The evidence that would change my mind is X. If X showed up, I'd consider Y instead.' Naming the change-mind evidence in advance does several useful things. It clarifies what you're actually betting on. It reveals when you've been treating disconfirming evidence as anomaly rather than data. It makes future you accountable to your current reasoning, because if the disconfirming evidence shows up, you've already committed to taking it seriously. Most people skip this exercise because it feels like inviting disagreement; the value is precisely in inviting it before the consequences of being wrong have compounded.",
    },
    {
      name: "Know when finding the holes has become self-sabotage",
      body: "There's a category of hole-finding that's productive and a category that's anxiety dressed up as rigor. The first generates clearer thinking; the second generates increasing paralysis. The signal you've crossed into the second: are the holes you're finding becoming smaller and smaller while your confidence in the conclusion is dropping out of proportion to what you've actually surfaced? Are you spending more time evaluating than the decision warrants, given the stakes? Have you been steelmanning, asking three people, examining what you're avoiding, naming the change-mind evidence — and the result is more uncertainty rather than more clarity? If yes, the technique has tipped into self-sabotage. The fix is to set a stopping rule: a fixed number of techniques applied, a fixed amount of time spent, and a commitment to decide at the end with whatever clarity you have. Indefinite hole-finding is a way to never decide, which has its own costs that the analysis doesn't address. The conclusion of a thorough hole-finding pass should be a decision, not a deeper analysis loop. If you're not converging, you're not analyzing; you're avoiding.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Write a one-paragraph case AGAINST your conclusion as if you were a thoughtful, informed person who genuinely disagrees. Make it as strong as you can. The threshold: you've written something you can't refute in two sentences.",
    explanation: "The steelman is the single most productive hole-finding technique because it forces the brain to do the work it doesn't naturally do — argue against its own conclusion in good faith. Most attempts at this fail by writing weak versions of the opposition that are easy to dismiss, which produces false confidence rather than insight. The 'can't refute in two sentences' threshold is what tells you the steelman is working. If you can knock it down quickly, you wrote a strawman; if you can't, you've found at least one place your thinking has more holes than you realized.",
  },

  cta: {
    glyph:    '💀',
    headline: "Run the structured hole-finding technique on your own thinking",
    body:     "Pre-Mortem inverts your plan and writes the failure memo from your future self — surfacing the assumptions you've been treating as facts, the warning signs you'll ignore, and the Fatal Assumption most likely to kill the conclusion. The technique used by NASA, military planners, and venture investors — applied to your own reasoning before someone else applies it for you.",
    features: [
      "Cognitive inversion — assume your conclusion is wrong, then explain why",
      "Fatal Assumption — the single belief that, if wrong, would unravel everything",
      "Warning signs you'll ignore — the early indicators motivated reasoning will dismiss",
      "Failure modes ranked by probability — focus your hole-finding on what matters most",
      "Plan-type tuning — different reasoning structures get specialized stress-testing",
    ],
    toolId:   'PreMortem',
    toolName: 'Pre-Mortem',
  },
};
