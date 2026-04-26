// ============================================================
// guide-specs/workplace/what-does-lets-table-this-mean.js
// ============================================================
// Source of truth for /guides/workplace/what-does-lets-table-this-mean.
// Edit here; run `node scripts/build-guides.js workplace` to regenerate.
// ============================================================

module.exports = {
  slug:          'what-does-lets-table-this-mean',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         'What "Let\'s Table This" Actually Means in a Meeting (And When It\'s a No)',
  titleHtml:     'What "Let\'s Table This" Actually Means in a Meeting <em>(And When It\'s a No)</em>',
  shortTitle:    'What "Let\'s Table This" Means',
  navTitle:      'What does lets table this mean in a meeting and when its a no',

  description:   "'Let's table this' usually means defer — but sometimes it means no, sometimes it means dead, and in the UK it means the opposite. Five contexts and how to tell which one you got.",
  deck:          "'Let's table this' usually means defer — but sometimes it means no, sometimes it means dead, and in the UK it means the opposite. Five contexts and how to tell which one you got.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `You raise a topic in a meeting. Discussion starts. Then someone — usually whoever's running the meeting — says "let's table this" and moves on. Whether you got a real defer, a soft no, or a quiet kill depends on what was on the agenda, who said it, and whether the topic ever actually comes back.`,
    `The phrase has a parliamentary origin and an inverted meaning across regions: in American workplace usage, "to table" means to defer; in British and Commonwealth usage, "to table" means to formally bring up for discussion. Within American business English, the phrase has settled into the defer meaning, but the deferral itself comes in several flavors — only one of which actually means "we'll come back to this."`,
  ],

  steps: [
    {
      name: "Read the legitimate defer",
      body: "The most common version in well-run meetings. The topic raised is genuinely worth discussing but doesn't fit the current agenda or time slot. The tell: the person saying it follows up with a specific plan — 'let's table this for next week's offsite' or 'put this on the agenda for the leadership sync.' This is the phrase functioning as designed: protect the current meeting's focus, schedule the real conversation. The right response is to confirm where it goes — agenda doc, calendar invite, action item with an owner — before the meeting ends. If the deferral has a date attached, it's almost always real.",
    },
    {
      name: "Spot the 'we'll come back to this' version",
      body: "Sender intends to revisit but isn't specific about when. The tell: 'let's table this' arrives without a date or follow-up plan, but the topic is on-agenda or clearly important. Common in meetings that are running long, where the person running the meeting is buying time without making promises. This isn't bad — it's often the right call — but it does require the topic-raiser to keep the issue alive. The right response is to send a follow-up email after the meeting that puts the topic in writing with a proposed time to revisit. Vague deferrals tend to stay vague unless someone makes them specific.",
    },
    {
      name: "Recognize the polite no",
      body: "Where 'let's table this' is being used to soften an actual rejection. Common in budget conversations, scope debates, headcount asks, and any context where the person tabling has authority and doesn't want to deliver a flat no in front of an audience. The tell: the same idea was tabled previously, the person tabling has decision authority, and the deferral comes paired with no follow-up specifics or with vaguely positive language ('great point, let's come back to this'). The signal is the absence of any path forward. The right response depends on stakes. If it matters, follow up privately ('want to make sure I understood — is this a not-now or a not-going-to-happen?') and let them give you the real answer in private. Most leaders will, when given the chance.",
    },
    {
      name: "Notice the conflict-defer",
      body: "Like 'let's take this offline' but without leaving the meeting. The discussion was productive but uncomfortable, and tabling stops it without resolving it. The tell: the topic is on-agenda, the discussion was yielding actual information, and 'let's table this' arrives at the moment things were getting concrete rather than abstract. This is when the phrase suppresses problem-solving. The right move is to notice you've been redirected, decide if the issue still matters, and request specifics on the follow-up — not as a confrontation, just as scheduling. 'Sure, when do we pick this up?' If the answer is vague and stays vague, you've got your read on what just happened.",
    },
    {
      name: "Know the pattern that means it's dead",
      body: "Where the same item gets tabled repeatedly, meeting after meeting, with no actual revisit. This is the version that signals decision-by-deferral — the issue has been deprioritized, declined, or quietly killed without anyone saying so out loud. The tell: you can count more than two tablings of the same topic, the priority list keeps growing, and the topic moves further down the agenda each cycle. This isn't necessarily anyone's bad faith. Plenty of items get effectively killed this way without a single person making the decision explicitly. But if the issue actually matters to you, the move is to stop accepting tablings and start asking the question directly: 'Is this something we're planning to do, or has the priority moved?' Most reasonable leaders will give you a real answer when forced to. The pattern is the decision; the next ask is just acknowledgment.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Did the deferral come with a date, or just a vibe?",
    explanation: "The single question that decodes most 'let's table this' moments. A deferral with a specific time attached — next meeting, end of quarter, after the offsite — is almost always sincere. A deferral with no time attached is doing something else: buying time, softening a no, or quietly closing the topic. Notice the difference in the moment, and you'll catch the meaning before the deferral has set in.",
  },

  cta: {
    glyph:    '🔍',
    headline: "Get a read on the specific 'let's table this' moment you're trying to decode",
    body:     "This guide covers five common contexts. Decoder Ring takes the actual situation — what was being discussed, who tabled it, whether a follow-up was proposed, how often this topic has come up before — and tells you what's most likely happening, plus three response strategies calibrated to whether you want to accept the deferral, push for specifics, or surface the underlying decision.",
    features: [
      "A specific read on the specific deferral you're decoding",
      "The most likely interpretation, plus alternatives ranked",
      "Power-dynamic and pattern analysis, not just dictionary meaning",
      "Three response strategies — accept, push for specifics, or surface the decision",
      "Draft language for whichever path you choose",
    ],
    toolId:   'DecoderRing',
    toolName: 'Decoder Ring',
  },
};
