// ============================================================
// guide-specs/career/what-to-say-in-a-performance-review-when-you-cant-remember.js
// ============================================================

module.exports = {
  slug:          'what-to-say-in-a-performance-review-when-you-cant-remember',
  category:      'career',
  categoryLabel: 'Career',

  title:         "What to Say in a Performance Review When You Can't Remember What You Did",
  titleHtml:     "What to Say in a Performance Review <em>When You Can&#39;t Remember What You Did</em>",
  shortTitle:    "Performance Review When You Can't Remember",
  navTitle:      "What to say in a performance review when you can't remember what you did",

  description:   "You did a year of work. You can remember three things. Five steps for reconstructing what you actually did from the artifacts you've already created — without the panic.",
  deck:          "You did a year of work. You can remember three things. Five steps for reconstructing what you actually did from the artifacts you've already created — without the panic.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `Your performance review is in two weeks. The self-review form needs eight bullets and you can confidently fill in three. The other five feel like a fog. You spent twelve months working hard. You know that. But trying to remember what you actually did, week by week, returns mostly the last two months at high resolution and almost nothing before that.`,
    `This is the most universal experience in performance reviews and the one most people feel worst about. The fog isn't a sign you didn't do enough — it's a sign that recent work crowded out earlier work in your memory, which is what brains do. The fix isn't to remember harder. It's to use the artifacts you've already produced as a time machine. Calendars, Slack threads, code commits, sent email, and shared documents are a near-complete record of what you spent your year on. The five steps below are how to use them to rebuild the year you actually had.`,
  ],

  steps: [
    {
      name: "Don't try to remember from scratch — pull from artifacts",
      body: "The most common mistake at this stage is sitting in front of a blank document trying to summon memories. Memory is unreliable for routine work — the kind that fills most of the year — and reliable mostly for crises and recent events. The fix is to stop relying on memory entirely. Open the systems you used over the past year: calendar, Slack, email, code repository, project tracker, design tool, document folder. Each of these is a record of what you actually spent time on, dated and searchable. Working from artifacts, you'll find weeks you'd completely forgotten and projects you'd half-erased. The unlock is treating the year as a research problem with sources, not as a memory test.",
    },
    {
      name: "Use Slack, calendar, git, and email as your time machine",
      body: "Each tool tells a different part of the story. Calendar reveals what meetings you attended — which projects pulled your time, who you collaborated with, where you led versus participated. Slack shows the conversations you drove and the decisions you were part of. Email captures the cross-functional work and external touchpoints. Code commits and project tickets show what you actually shipped. Document folders surface what you wrote, designed, or analyzed. The technique: scroll back month by month in each tool and capture anything that strikes you as substantial. Don't filter at this stage; just collect. A search for your name in Slack from January will surface things you've forgotten you led. A skim of your calendar will surface meetings that turned into decisions. The list grows from a half-remembered three to a documented twenty in about forty minutes.",
    },
    {
      name: "Build the 12-month list backwards from biggest to smallest",
      body: "Once you have the raw artifact-based list, sort it by impact rather than chronology. The biggest thing you shipped, drove, or contributed to goes at the top — even if it happened in February and you'd forgotten about it. The smallest goes at the bottom. This sorting matters because performance review bullets aren't a chronicle; they're an argument for your value, and the argument lands when the strongest items are visible first. Build the list backward from biggest to smallest in passes: pass one, capture every candidate; pass two, add detail (impact, scope, who was affected); pass three, group related items into themes. By the end of pass three you have something like fifteen candidate bullets, ranked, with enough material that picking the best eight is a curation problem rather than a creation one.",
    },
    {
      name: "Translate activity to outcome on each item",
      body: "Once you have the list of what you did, translate each item from activity to outcome. 'Worked on the migration' becomes 'Led migration that retired three legacy systems and saved $X annually.' 'Helped onboard new hires' becomes 'Built the onboarding doc the last six hires used, cut ramp time from eight weeks to four.' For each item, ask: what changed in the world because of this? Who was affected? What got faster, cheaper, more reliable, or unblocked? If you can't answer those questions for an item, either the work was less impactful than it felt (which is real signal) or you have impact data you haven't surfaced yet (which is recoverable). The translation is the work that turns 'I did things this year' into a bullet that holds up in calibration.",
    },
    {
      name: "Know when 'I can't remember' is signal that the year was actually thin",
      body: "There's a category of performance review fog that isn't just memory — it's accurate. Sometimes the year was, in fact, thin: lots of busy time, few high-impact outcomes, plenty of meetings that didn't go anywhere. The artifact sweep returns a list, but the list is mostly small or routine items that don't add up to a strong case. This is a real signal worth taking seriously. The right response isn't to inflate the list; it's to engage with what the year actually was. Maybe the role had less scope than it should have. Maybe organizational priorities shifted in ways that left your function under-resourced. Maybe you were learning a new domain and the impact will land next year. The honest performance review acknowledges what's actually there — and that conversation often opens the door to the real one about scope, support, or trajectory. Faking a strong year on paper produces a calibration outcome that surprises nobody and resolves nothing. The harder conversation produces actual change.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Open six tabs: Calendar, Slack search of your name, Sent email, Git commits, Project tracker (Jira/Linear/Asana), Document folder. Scroll back to January. For each, capture every substantial thing into one running list — no filtering yet.",
    explanation: "This is the artifact sweep, which is the move that recovers most of the lost year in about forty minutes. The instinct is to filter as you go ('that's not bullet-worthy,' 'that's too small') — resist it. Capture everything; filter later. You'll find you forgot about projects that ran for a month, meetings that led to decisions, and contributions to launches you only remembered as 'something the team did.' The unfiltered list always has more material than the memory-only list, and the gap is where most of the year's quiet work lives.",
  },

  cta: {
    glyph:    '🏆',
    headline: "Stop trying to remember — use the Memory Jogger",
    body:     "Brag Sheet Builder's Memory Jogger button asks role-specific prompting questions across six categories — projects led, problems solved, people developed, processes improved, customers served, decisions driven — surfacing accomplishments you'd forgotten. Combine with the Accomplishment Journal for next year and you'll never have to reconstruct twelve months from artifacts again.",
    features: [
      "Memory Jogger — role-specific prompting questions across 6 categories",
      "Accomplishment Journal — log wins weekly, import them at review time",
      "Before/After bullets — turn vague memories into outcome statements",
      "Metrics Excavator — replace estimates with real numbers",
      "Strength Radar — scores your sheet against role expectations, finds gaps",
    ],
    toolId:   'BragSheetBuilder',
    toolName: 'Brag Sheet Builder',
  },
};
