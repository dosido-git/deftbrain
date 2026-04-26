// ============================================================
// guide-specs/speeches/how-to-give-a-toast-when-you-barely-know-the-person.js
// ============================================================
// Source of truth for /guides/speeches/how-to-give-a-toast-when-you-barely-know-the-person.
// Edit here; run `node scripts/build-guides.js speeches` to regenerate.
// ============================================================

module.exports = {
  slug:          'how-to-give-a-toast-when-you-barely-know-the-person',
  category:      'speeches',
  categoryLabel: 'Speeches',

  title:         "How to Give a Toast When You Barely Know the Person Being Toasted",
  titleHtml:     "How to Give a Toast <em>When You Barely Know the Person Being Toasted</em>",
  shortTitle:    "How to Give a Toast When You Barely Know Them",
  navTitle:      "How to give a toast when you barely know the person being toasted",

  description:   "You've been asked to toast someone you don't really know. Pretending otherwise is the trap. Five steps for a short, honest, well-received toast that doesn't try to fake closeness.",
  deck:          "You've been asked to toast someone you don't really know. Pretending otherwise is the trap. Five steps for a short, honest, well-received toast that doesn't try to fake closeness.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `Maybe you're a vendor at a wedding being recognized. Maybe you're the senior person at a work event toasting someone you've met twice. Maybe you got asked at the last minute because someone closer canceled. The assignment is real, the moment is on, and there's a glass in your hand — and you're aware that the obvious move (pretending to know them better than you do) is also the move that always lands worst.`,
    `The toast that works when you barely know the person doesn't try to disguise the gap. It names what the actual relationship is, leans into the perspective that perspective makes possible, and then keeps things short. The audience can tell when a speaker is overstating closeness, and the discomfort that produces is much worse than a brief toast that's honest about its scope. The five steps below are about giving the kind of short, well-calibrated toast that makes the shorter relationship work for you instead of against you.`,
  ],

  steps: [
    {
      name: "Stop pretending you know them better than you do",
      body: "The single biggest tell of an awkward toast is the speaker straining to claim closeness that isn't there. Phrases like 'I've known Marcus forever — well, maybe not forever, but…' or 'though we haven't worked together that long, I feel like…' announce the problem to the room before they realize it themselves. The fix is to name the actual relationship in the opening line and proceed from there. 'Marcus and I have worked together for about six months on the Q3 launch.' 'I met Sarah at the engagement party three weeks ago, and Tom asked if I'd say a few words.' Direct framing is disarming — the audience relaxes because they no longer have to wonder whether the speaker is going to try to fake intimacy. The rest of the toast is much easier to write once the framing question has been settled in the first sentence.",
    },
    {
      name: "Lean into the perspective the short relationship makes possible",
      body: "There's an angle that only short relationships have access to: the impression a person makes on someone who's still forming their view of them. The speaker who has known someone for thirty years has lost the ability to see them fresh. You haven't. That's a perspective worth offering, and one that long-relationship speakers can't deliver. 'In the six months I've worked with Marcus, here's what's already clear about how he handles a hard situation…' is a strong frame because it's true and only you can give it. 'In the three weeks I've known Sarah, the thing that's struck me most is…' lets you toast a stranger honestly. The discipline is to use what your perspective actually is — early, fresh, partial — rather than reaching for the closeness frame that doesn't apply.",
    },
    {
      name: "Borrow stories honestly, with attribution",
      body: "If you need a story and you don't have one of your own, you can borrow one — but the borrowing has to be transparent or it backfires. 'Marcus's friend Jen told me a story this morning that captures him perfectly,' followed by the story, works. Telling someone else's story as if it were yours doesn't, because the audience usually catches it (the details are a little off, the speaker doesn't quite have the rhythm of someone who lived it), and the toast lands worse than if you'd told no story at all. Attribution is short, it's honest, and it's actually charming — the audience hears that the speaker did the work to find a story, and the borrowed source becomes a small implicit endorsement of the person being toasted (someone close to them thought enough of you to share it). Open quoting works better than closed appropriation.",
    },
    {
      name: "Keep it short — under ninety seconds is your friend",
      body: "The single most reliable rule for the barely-know-them toast is brevity. Long toasts from people with deep relationships can earn the time; long toasts from people with short relationships always feel padded. Ninety seconds is the right ceiling. Three or four sentences for the framing, two or three for the substance, one for the toast itself. The room reads brevity as confident calibration — you knew what you had to offer, you offered it cleanly, you raised your glass. Long toasts from short relationships read as the speaker straining to fill time, which produces the discomfort the brevity was meant to avoid. If you find yourself needing more than ninety seconds, the issue is usually that you're trying to do more than the relationship can support. Cut to what only you can say from your specific vantage, and let the toast be short.",
    },
    {
      name: "Know when the request itself was a mismatch",
      body: "Sometimes the best move is to read the situation differently than the request implied. Two patterns to recognize. First: the ceremonial-role toast. You may have been asked to speak because of your position at the event (officiant, venue host, senior colleague) rather than your relationship to the person being toasted. The room knows this. The toast that works in this case is more ceremonial than personal — short, gracious, focused on the occasion rather than the individual. Trying to give a personal toast when you've been asked to give a ceremonial one produces awkwardness no preparation can fix. Second: the courtesy ask. Sometimes the request was made as a politeness rather than a real expectation that you'd give a substantial speech, and the right response is a very short toast (twenty seconds, two sentences, raise the glass) rather than a fully constructed one. Read the request: was the host hoping for a real speech, or were they making a gracious gesture? If the latter, a brief sincere toast is the gift the situation actually wants. Long toasts from courtesy-asks are remembered as misjudged; short ones are remembered as well-timed.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Marcus and I have worked together on the Q3 launch for about six months. He's asked me to say a few words tonight, and what's struck me in those six months is something I want the rest of you who've known him longer to hear from someone who's just getting to know him.",
    explanation: "This opening solves the central problem of barely-know-them toasts: it names the actual relationship clearly, claims a specific small perspective, and positions the speaker as offering something the long-relationship people in the room can't offer themselves. The audience relaxes because the framing has been settled honestly, and the rest of the toast can deliver the perspective that was just promised. The 'someone who's just getting to know him' line, in particular, turns a perceived weakness (short acquaintance) into a deliberate frame for what's about to be said.",
  },

  cta: {
    glyph:    '🥂',
    headline: "Get a short, well-calibrated toast that uses what you actually have",
    body:     "ToastWriter takes the actual details — your relationship, how long you've known the person, what you've observed — and generates three short toasts in different registers: Warm, Light, and Ceremonial. Each is sized for the situation (90 seconds or less by default), with delivery cues, a memorizable opening and closing, and an emergency closer.",
    features: [
      "Three short toasts in three registers — Warm, Light, Ceremonial",
      "Sized for short relationships — 90 seconds or under by default",
      "Adjustable for ceremonial vs personal contexts",
      "Inline delivery cues, highlighted opening and closing lines",
      "Emergency closer for the moment you blank",
    ],
    toolId:   'ToastWriter',
    toolName: 'ToastWriter',
  },
};
