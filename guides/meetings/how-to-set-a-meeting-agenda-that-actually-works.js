// ============================================================
// guides/meetings/how-to-set-a-meeting-agenda-that-actually-works.js
// ============================================================

module.exports = {
  slug:          'how-to-set-a-meeting-agenda-that-actually-works',
  category:      'meetings',
  categoryLabel: 'Meetings',

  title:         "How to Set a Meeting Agenda That Actually Works",
  titleHtml:     "How to Set a Meeting Agenda <em>That Actually Works</em>",
  shortTitle:    "Set a Meeting Agenda That Works",
  navTitle:      "How to set a meeting agenda that actually works",

  description:   "Most meeting agendas are a list of topics that pretend to be a plan. Here's how to write one that runs the meeting for you — items, outcomes, owners, time.",
  deck:          "Most meeting agendas are a list of topics that pretend to be a plan. Here's how to write one that runs the meeting for you — items, outcomes, owners, time.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `You've seen the bad agenda. Three bullet points: 'Project update,' 'Discuss next steps,' 'Open floor.' Forty-five minutes scheduled. No outcome named, no time allocated, no owner specified. The meeting will produce nothing surprising. Everyone will leave saying it was 'fine,' and another meeting will get scheduled to actually decide the thing this meeting was nominally about.`,
    `A working agenda isn't a list of topics. It's a contract with the room — what gets decided, by whom, in how long. Written that way, the agenda runs the meeting; written as a list, the agenda runs the meeting in name only. Five components, every time.`,
  ],

  steps: [
    {
      name: "Name a desired outcome for each item",
      body: "Don't write 'Discuss roadmap.' Write 'Decide on Q3 launch sequence.' The first is a topic; the second is a destination. Outcome-named agenda items pull the meeting toward something specific, and they make it obvious when the discussion is or isn't producing what was promised. If you can't write an outcome for an item, the item probably doesn't belong on the agenda.",
    },
    {
      name: "Time-box every agenda item",
      body: "Each item gets a duration. 'Decide on launch sequence — 15 min.' This forces you to make trade-offs at the planning stage, where they belong. Three 20-minute items in a 60-minute meeting is honest; six items with no times listed is a fantasy. Time-boxing is also what gives the facilitator authority to redirect during the meeting; without it, every overrun is a judgment call instead of a structural commitment.",
    },
    {
      name: "Assign an owner per item",
      body: "An item without a name attached is an item nobody will lead. Even informational updates need an owner — someone who walks the room through the material so the discussion has a starting point. This isn't bureaucracy; it's how meetings produce coherent conversations instead of random ones. The owner is the answer to 'who's running this part?' and somebody has to be.",
    },
    {
      name: "Send the agenda the day before",
      body: "An agenda emailed at 9am for a 10am meeting is barely an agenda. Send it 24 hours out, with the read-ahead material if there is any. People walk in prepared, not surprised. The cost of preparation is borne up front, before the meeting; the cost of surprise is borne in the meeting itself, by the entire room. Same total work; very different distribution.",
    },
    {
      name: "Leave one item shorter than you think it needs",
      body: "Almost every agenda item runs longer than its time-box. The fix is to deliberately under-allocate one quick item — five minutes for something that'd usually get ten. This builds slack into the schedule that absorbs the inevitable overruns elsewhere. Without slack, every meeting runs over; with it, the meeting ends on time even when one discussion went deep. The under-allocation is the buffer.",
    },
  ],

  cta: {
    glyph:    '🛡',
    headline: "Generate the working agenda in two minutes",
    body:     "Meeting Hijack Preventer takes your meeting topic, attendees, and duration and produces a structured agenda — items with outcomes, time-boxes, owners, and pre-read suggestions — formatted to actually run the meeting.",
    features: [
      "Outcome-named agenda items",
      "Time-boxed allocations",
      "Owner assignments",
      "Pre-read suggestions",
      "Built-in schedule slack",
    ],
    toolId:   'MeetingHijackPreventer',
    toolName: 'Meeting Hijack Preventer',
  },
};
