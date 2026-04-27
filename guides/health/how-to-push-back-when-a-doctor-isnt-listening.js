module.exports = {
  slug:          'how-to-push-back-when-a-doctor-isnt-listening',
  category:      'health',
  categoryLabel: 'Health',

  title:         "How to Push Back When a Doctor Isn't Listening (Without Burning the Visit)",
  titleHtml:     "How to Push Back When a Doctor Isn&#39;t Listening <em>(Without Burning the Visit)</em>",
  shortTitle:    "How to Push Back When a Doctor Isn't Listening",
  navTitle:      "How to push back when a doctor isn't listening without burning the visit",

  description:   "There's a way to push back that gets you the workup you came for, and there's a way that gets you a defensive doctor and an even shorter visit. The difference is the wording.",
  deck:          "There's a way to push back that gets you the workup you came for, and there's a way that gets you a defensive doctor and an even shorter visit. The difference is the wording.",

  ledes: [
    `You've described it twice now. The doctor has answered the same way both times — it's probably nothing, give it a few weeks, follow up if it doesn't resolve. You're not buying it. The thing they're calling probably-nothing has been getting worse, not better, and the timeline they're suggesting feels like a long time to wait. You can feel the visit ending, and you haven't actually been heard.`,
    `This is the moment most patients either back down or escalate, and both options are bad. Backing down means leaving with the same nothing-answer you walked in with. Escalating — getting frustrated, getting accusatory, raising your voice — puts the doctor in defensive mode and makes the next ten minutes worse, not better. There's a third option, and it's almost always the one that works.`,
  ],

  steps: [
    {
      name: "Slow the visit down before you push",
      body: "Doctors who stop listening usually stop listening because the visit feels resolved to them — they've identified the most likely cause, given you a plan, and started shifting toward the next appointment. Your first move isn't to push harder, it's to pause the momentum. 'Before we wrap up, I want to make sure I understood something' or 'Can we slow down for a second — I'm not sure I followed the reasoning' both buy you another few minutes without any confrontation in them.",
    },
    {
      name: "Restate what you've heard, then name the gap",
      body: "Reflect their answer back to them in your own words: 'So what I'm hearing is that you think this is most likely [X], and the plan is [Y].' Then name what doesn't fit. 'What I'm having trouble with is that [specific thing] doesn't really match [X] — it's been getting worse, not better.' This is one of the most underused conversational moves in medicine. It signals you've been listening, makes their reasoning visible, and forces them to address the gap rather than just restate the conclusion.",
    },
    {
      name: "Ask for the differential out loud, on the record",
      body: "Pivot from challenging the answer to asking for the reasoning. 'What are the other things this could be? What would you want to rule out before we settle on the most likely?' This question is much harder to dismiss than a direct challenge. It also gets the differential — the list of conditions you're being implicitly *not* tested for — into the visit notes. Sometimes that question alone changes the workup. Sometimes it just changes the conversation. Either is better than what was happening.",
    },
    {
      name: "Make the request specific and small",
      body: "If you want a test, name the test. If you want a referral, name the specialist. 'I'd like blood work that includes [X]' or 'I'd like to be referred to a [specialist] to make sure we've ruled out [condition].' Specific small requests get said yes to far more often than vague big ones ('I want more tests' or 'I think I should see someone else'). The specificity also tells the doctor that you've thought about this — which earns a different kind of attention than emotional pressure does.",
    },
    {
      name: "When the right move is asking for it in writing",
      body: "If a doctor is declining a test or referral you think you need, ask them to put the decision in writing — specifically, that they considered and declined to order [the test] or refer to [the specialist]. Most doctors will reconsider rather than document a declined workup, because that documentation creates real liability if the thing you were worried about turns out to matter. You're not threatening; you're just asking for the medical record to reflect the decision. That's a reasonable request, and the response to it tells you a lot.",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "Before we wrap up — what I'm having trouble with is that this has been getting worse, not better. Can you walk me through what else this could be?",
    explanation: "This sentence pauses the visit, names the specific thing that doesn't fit the doctor's explanation, and asks for their reasoning rather than challenging it. It's harder to dismiss than a direct objection.",
  },

  cta: {
    glyph:    '📝',
    headline: "Build the version of your case that gets heard",
    body:     "Doctor Visit Prep helps you organize the specifics that make dismissal harder — what's changed, what hasn't worked, what you want considered — so you walk in with a structured case rather than scattered concerns.",
    features: [
      "Symptom progression timeline",
      "Already-tried interventions log",
      "Differential rule-out questions",
      "Specific test and referral requests",
      "Pushback scripts for common dismissals",
    ],
    toolId:   'DoctorVisitPrep',
    toolName: 'Doctor Visit Prep',
  },

  published: '2026-04-27',
  modified:  '2026-04-27',
};
