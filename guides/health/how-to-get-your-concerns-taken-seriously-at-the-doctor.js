// ============================================================
// guide-specs/health/how-to-get-your-concerns-taken-seriously-at-the-doctor.js
// ============================================================
// Source of truth for /guides/health/how-to-get-your-concerns-taken-seriously-at-the-doctor.
// Edit here; run `node scripts/build-guides.js health` to regenerate.
// ============================================================
//
// VOICE NOTE: This guide is flagged sensitive. Reader may have already
// been dismissed, possibly repeatedly. No dry humor. Warmth without
// pity. Practical tactics without implying the reader is wrong for
// being frustrated.
// ============================================================

module.exports = {
  slug:          'how-to-get-your-concerns-taken-seriously-at-the-doctor',
  category:      'health',
  categoryLabel: 'Health',

  title:         "How to Get Your Concerns Taken Seriously at the Doctor (When You're Not Being Heard)",
  titleHtml:     "How to Get Your Concerns Taken Seriously at the Doctor <em>(When You&#39;re Not Being Heard)</em>",
  shortTitle:    "How to Get Your Concerns Taken Seriously at the Doctor",
  navTitle:      "How to get your concerns taken seriously at the doctor when you're not being heard",

  description:   "Being dismissed by a doctor happens more often than it should. The good news: specific, learnable moves change the dynamic — without getting you labeled 'difficult.' Here are five.",
  deck:          "Being dismissed by a doctor happens more often than it should. The good news: specific, learnable moves change the dynamic — without getting you labeled 'difficult.' Here are five.",

  published:     '2026-04-24',
  modified:      '2026-04-25',

  ledes: [
    `You know your body. You've been trying to explain something for months, and the response keeps being a version of 'let's see how this goes' or 'that's probably just stress.' You leave the appointment exhausted, sometimes in tears, and you can feel yourself starting to second-guess whether you should have gone in at all. If that's familiar, you're not imagining it, and you're not alone.`,
    `Being taken seriously at the doctor isn't about being louder or more emotional — usually the opposite. It's about shifting what kind of evidence you walk in with, and what kind of response you make easy for the doctor to give. Here are the moves that change the dynamic.`,
  ],

  steps: [
    {
      name: "Bring documentation, not just description",
      body: "Come with a written symptom log — dates, times, severity, triggers. If the symptom is visible, bring photos. If it's sporadic, capture video when you can. Written and visual evidence shifts the conversation from 'patient reports' to 'documented pattern.' This isn't about proving anything to a skeptical doctor; it's about giving them something they can pattern-match against, which is how they actually think.",
    },
    {
      name: "Use specific language, not intensifiers",
      body: "'It hurts a lot' lands differently than 'it's a sharp pain in my lower right abdomen that comes on after meals.' You don't need to learn medical jargon — you need to be specific about location, quality, and pattern. Specificity is the difference between a symptom that sounds vague and one that matches a pattern the doctor has seen before.",
    },
    {
      name: "Name what you want ruled out",
      body: "'Can we rule out [specific thing]?' is one of the most useful sentences in medicine. It gives the doctor a concrete target. It shifts the burden from 'convince me this matters' to 'here's what I'm checking for and why.' Even if your specific concern turns out to be wrong, having a named concern is far more productive than a diffuse worry — the doctor can actually address it.",
    },
    {
      name: "Ask them to document their reasoning",
      body: "If you're being told 'it's probably nothing,' ask them to add that to your chart — specifically that you raised the concern and they decided not to investigate further. Most doctors will either (a) document it and explain why in more detail, or (b) reconsider and order the test after all. The act of asking for documentation tends to prompt a higher level of care than the alternative.",
    },
    {
      name: "Ask for a referral or a second opinion if you're still not heard",
      body: "You're allowed to say 'I'd like a referral to a specialist' or 'I'd like a second opinion.' These aren't aggressive moves — they're standard patient options. Many insurance plans no longer require referrals, so you can often see a specialist directly. Being dismissed by one doctor doesn't mean you were wrong. It means you need a different doctor.",
    },
  ],

  callout: {
    afterStep: 3,
    scriptedLine: "Can we rule out [specific thing you're worried about] before we go with the wait-and-see approach?",
    explanation: "This one sentence does three things at once: it names your concern directly, it preserves the relationship (you're not challenging the doctor's judgment, you're asking them to do their job), and it gives them a concrete target to respond to. Most doctors will either order the test or explain specifically why they're not worried.",
  },

  cta: {
    glyph:    '📝',
    headline: "Walk in with the documentation and language that change the dynamic",
    body:     "The five moves in this guide work in any appointment, with any doctor. Doctor Visit Prep takes what you're experiencing — the symptoms, the timeline, the concern you've been trying to name — and turns it into a documented, specific, clinical-ready brief. The kind doctors are trained to take seriously.",
    features: [
      "A clinical-ready description of what you've been experiencing",
      "Specific 'rule out' questions, named with reasons",
      "Things to mention even if your doctor doesn't ask",
      "Red flags worth raising first",
      "A pre-visit checklist tailored to your concern",
    ],
    toolId:   'DoctorVisitPrep',
    toolName: 'Doctor Visit Prep',
  },
};
