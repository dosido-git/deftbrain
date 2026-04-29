// ============================================================
// guides/meetings/how-to-make-sure-quiet-people-speak-up-in-meetings.js
// ============================================================

module.exports = {
  slug:          'how-to-make-sure-quiet-people-speak-up-in-meetings',
  category:      'meetings',
  categoryLabel: 'Meetings',

  title:         "How to Make Sure Quiet People Speak Up in Meetings",
  titleHtml:     "How to Make Sure Quiet People <em>Speak Up in Meetings</em>",
  shortTitle:    "Get Quiet People to Speak",
  navTitle:      "How to make sure quiet people speak up in meetings",

  description:   "The smartest insight in the room is often inside the person who hasn't said anything. Here's how to draw out the quiet people without putting them on the spot.",
  deck:          "The smartest insight in the room is often inside the person who hasn't said anything. Here's how to draw out the quiet people without putting them on the spot.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `Forty minutes into the meeting, three people have done all the talking and three have said roughly nothing. The three who haven't spoken aren't disengaged. One of them is a senior engineer who's almost certainly noticed the flaw in the current plan. One of them is the project manager who actually owns the deliverable. The third is the new hire whose first instinct was right and who is now silently waiting to see if anyone else will say it. None of them will, because nobody has been asked.`,
    `Drawing out the quiet people is a real skill, distinct from running a good meeting overall. Done well, it surfaces the room's actual collective thinking. Done badly, it feels like calling on someone who didn't raise their hand. Five moves that get the substance without the awkwardness.`,
  ],

  steps: [
    {
      name: "Ask by topic, not by name",
      body: "'Anyone have thoughts?' produces nothing. 'Sara, what do you think?' can feel like a pop quiz. The middle move is to call by topic: 'Anyone working on the API side want to weigh in?' This narrows the field to the few people for whom the question is naturally theirs, without singling out anyone. The right person usually steps in because the prompt was specifically for them, not because they were called on.",
    },
    {
      name: "Build in deliberate silence",
      body: "Quiet people often need a few extra seconds to translate a thought into a contribution. Most facilitators close the gap by jumping back in themselves — and the quiet person, now even further behind, stays quiet. Count to five after asking a question, in your own head, before moving on. Five seconds feels like an eternity when you're running a meeting; it's a normal think-time for most people in the room.",
    },
    {
      name: "Pre-warn instead of cold-calling",
      body: "If you know someone's input matters and they're not the type to volunteer it, give them advance notice — a one-line message before the meeting: 'I'd love your read on the deployment question — you're closest to that part.' Now they walk in prepared and contribute willingly. Cold-calling someone who's been quiet often gets you a defensive non-answer. Pre-warning someone gets you the actual contribution.",
    },
    {
      name: "Use round-robin sparingly and intentionally",
      body: "Going around the room — each person says one thing — works in some moments and badly in others. Use it to surface initial reactions to a proposal, not to discuss complex tradeoffs. The round-robin equalizes participation but flattens the conversation; do it once at the right moment and the meeting hears from everyone, do it routinely and you're producing checkbox contributions instead of real discussion.",
    },
    {
      name: "Acknowledge the contribution specifically, not generically",
      body: "When a quiet person speaks, name what made the contribution useful. 'That distinction between availability and durability is exactly the right framing' is more useful than 'great point.' The specific acknowledgment signals you actually heard them, gives the rest of the room a reason to take the contribution seriously, and makes it slightly more likely the same person will speak up again next time. Most of why people stay quiet is the suspicion that nobody is listening.",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "Anyone on the API side want to weigh in on this? — happy to give it a few seconds, no rush.",
    explanation: "The two halves matter. Naming the topic (rather than a person) reduces the put-on-the-spot feeling; explicitly inviting silence ('happy to give it a few seconds') gives quiet processors permission to think before speaking. Together they generate participation without pressure.",
  },

  cta: {
    glyph:    '🛡',
    headline: "Generate inclusion prompts for your specific room",
    body:     "Meeting Hijack Preventer reads your agenda and attendee list and generates topic-specific prompts, pre-warning messages, and round-robin moments calibrated to draw out the quieter contributors.",
    features: [
      "Topic-specific prompts",
      "Pre-meeting warning scripts",
      "Round-robin structures",
      "Inclusion-prompt language",
      "Acknowledgment templates",
    ],
    toolId:   'MeetingHijackPreventer',
    toolName: 'Meeting Hijack Preventer',
  },
};
