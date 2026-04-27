// ============================================================
// guide-specs/workplace/how-to-push-back-on-an-unreasonable-email.js
// ============================================================
// Source of truth for /guides/workplace/how-to-push-back-on-an-unreasonable-email.
// Edit here; run `node scripts/build-guides.js workplace` to regenerate.
// ============================================================

module.exports = {
  slug:          'how-to-push-back-on-an-unreasonable-email',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Push Back on an Unreasonable Email Without Burning the Bridge",
  titleHtml:     "How to Push Back on an Unreasonable Email <em>Without Burning the Bridge</em>",
  shortTitle:    "How to Push Back on an Unreasonable Email",
  navTitle:      "How to push back on an unreasonable email without burning the bridge",

  description:   "Pushing back in writing is harder than pushing back in person — there's no tone, no read on the room, no chance to adjust mid-sentence. Five steps for declining or challenging a request in email without making the relationship worse than the request was.",
  deck:          "Pushing back in writing is harder than pushing back in person — there's no tone, no read on the room, no chance to adjust mid-sentence. Five steps for declining or challenging a request in email without making the relationship worse than the request was.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `The email landed in your inbox an hour ago. The ask is unreasonable — too much, too fast, too vague, too far outside your remit, or simply not yours to do. You're going to have to push back, and the pushing back has to happen in writing because that's the medium the request came in. Now you're staring at the reply window weighing how much to soften, how much to stand firm, and whether the version of yourself that comes out of this exchange is going to be one you want to keep working alongside the recipient.`,
    `Pushing back in writing has a specific failure mode that doesn't exist in conversation. In a meeting you can read the room, soften when you sense the other person dig in, escalate when you sense they're caving. In email you write the whole message at once, send it, and then watch what comes back — by which point the relational damage, if any, has already been done. The five steps below are designed for that medium specifically, where the writing has to do all the work that voice and posture would do in person.`,
  ],

  steps: [
    {
      name: "Reply when you're calm — but reply, don't disappear",
      body: "The instinct after an unreasonable email is to either fire back immediately or to delay so long that the silence itself becomes the response. Both fail. Fast replies leak the irritation; long silences signal either chaos or dismissal. The middle path is to write the reply when you're not stung — usually that means waiting an hour or two, or until after your next meal, but not overnight unless overnight is genuinely necessary. The asker is waiting; long silence trains them to assume your default response is avoidance, which makes the next ask harder rather than easier. The window between 'too fast' and 'too slow' is usually two to six hours. Reply within it, having written from a calm place rather than a stung one.",
    },
    {
      name: "Restate the request before you respond to it",
      body: "The single move that prevents the most pushback emails from going sideways is restating the ask in your own words at the top of the reply. 'I want to make sure I'm understanding this — you're asking for X by Y, with Z as the priority.' Three things happen at once. First, you confirm you're responding to what the asker actually meant, not what you read in your stung state. Second, the asker often replies to the restatement before you've even pushed back, sometimes softening or revising their own ask once they see it written back to them. Third, the restatement creates a shared reference point that any subsequent disagreement is now about — which keeps the conversation focused on the actual request rather than drifting into accusations or characterizations. Restate first, push back second.",
    },
    {
      name: "Push back on what specifically, not on the request in general",
      body: "Vague pushback is the fastest way to make a relationship worse than the request did. 'This is unreasonable' or 'I can't accommodate this' invites argument about whether you're a team player; it doesn't address what specifically about the ask is the problem. Specific pushback works because it gives the asker something concrete to engage with: 'The Friday deadline doesn't work because the data dependencies aren't unblocked until Wednesday — Monday next week is the earliest realistic finish.' Or: 'The scope as described needs three people; I can take the analysis piece, but the field interviews are outside my expertise.' Specific pushback is harder to argue with because it's true and granular, and it gives the asker a clear path forward (move the deadline, reduce the scope, bring in another person) instead of an emotional standoff.",
    },
    {
      name: "Offer a path, not just a refusal",
      body: "An email that's only a 'no' puts the entire weight of the next move on the asker. They have to figure out what to do with the request, who to ask next, how to revise. That's their job to absorb in the end, but doing it for them in the same reply where you push back is the move that protects the relationship. 'I can't take this on by Friday, but I could deliver the analysis portion by next Wednesday, and Sarah on the data team has done the field work before.' Or: 'I can't be the lead on this, but I'm happy to review the draft.' Or: 'I won't be able to attend, but here are the three points I'd contribute if I were in the room.' Each of these is still a no — but it's a no that comes with motion. Asks that get a clean refusal often get re-asked or routed around you. Asks that get a refusal-with-motion usually settle into a workable shape on the second exchange, which is what you want.",
    },
    {
      name: "Know when 'without burning the bridge' is no longer the goal",
      body: "There's a class of unreasonable email that doesn't deserve a relationship-protective response — and protecting the relationship in those situations isn't diplomacy; it's enabling the next version of the same behavior. The pattern: the request itself is bad-faith (designed to set you up for failure or extract free labor under false pretense), the sender has a track record of unreasonable asks that escalate when accommodated, or the ask crosses an actual line (asking you to do something unethical, illegal, or far outside your role). In these cases, the question isn't 'how do I push back without burning the bridge' — it's whether the bridge is one worth keeping in its current form. Sometimes a firmly drawn line is what changes the relationship into a workable one; sometimes it ends a relationship that should have ended sooner. The signal you've reached this category: are you bending more than the situation seems to warrant because you're worried about the recipient's reaction? If yes, the relationship has already been bent into a shape that's costing you. The push-back here doesn't need to be hostile — but it does need to actually push, even at the risk of the bridge. Some bridges are load-bearing; others are walking us into territory we shouldn't be in.",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "Just to make sure I'm understanding the ask: you're looking for X delivered by Y, with Z as the priority. Before I respond, I want to flag a few things — the timeline runs into a dependency I should walk you through, and there's a piece of the scope I think we need to talk about. Can we adjust either of those, or should I work backwards from the constraints as written?",
    explanation: "This opening does three of the most important things in sequence: confirms understanding of the ask (which often softens the asker's framing on its own), signals specific concerns rather than blanket pushback, and ends with a question that hands the asker a choice rather than a refusal. The closing question is the move that protects the relationship most — it positions you as someone trying to find the workable version of what they asked for, not as someone defaulting to no.",
  },

  cta: {
    glyph:    '🔨',
    headline: "Get the right level of pushback for the situation",
    body:     "VelvetHammer takes your draft response and produces three professional variants — Collaborative (assumes good faith), Balanced (clear boundaries), and Firm (direct but professional) — calibrated by relationship, goal, and power dynamic. Pick the variant that matches the situation, not the one that matches your frustration level.",
    features: [
      "Three escalation levels from one draft — Collaborative, Balanced, Firm",
      "Power-dynamic calibration — different language for asks from boss vs peer vs vendor",
      "Goal-tuned phrasing — push back to revise scope vs push back to decline outright",
      "Preserves your specific factual concerns; removes language that reads as defensive",
      "Privacy by design — your unfiltered draft is never stored",
    ],
    toolId:   'VelvetHammer',
    toolName: 'Velvet Hammer',
  },
};
