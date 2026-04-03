// src/data/tools.js

/**
 * TOOLS DATABASE
 * 
 * Each tool includes:
 * - Basic metadata: id, title, category, icon, description, tagline
 * - Educational guide: overview, howToUse, example, tips, pitfalls
 * 
 * Guide objects are optional but recommended for better user experience.
 * Finance tools have complete guides as examples.
 * Other tools have template structures you can fill in.
 */
/**
template:
   {modified: "",
    id: "",
    title: "",
    tagline: "",
    tags: [],
    icon: "",
    categories: [],
    description: "",

    guide: {
      overview: "",
      howToUse: [
        "",
        "",
        "",
        "",
        ""
      ],
      example: {
        scenario: "",
        action: "",
        result: ""
      },
      tips: [
        "",
        "",
        "",
        ""
]}},**/
export const tools = [
{
  modified: "2026-03-30",
  id: "LedeBuilder",
  title: "LedeBuilder",
  tagline: "Draft the human-feel opening for any SEO guide page",
  tags: ['seo', 'lede', 'landing page', 'content', 'draft', 'guide page', 'opening paragraph', 'writing', 'internal'],
  icon: "✍️",
  categories: ['Do It!'],
  headerColor: "#b8cce0",
  description: "Drafts the lede — the human-feel opening paragraph(s) — for DeftBrain's SEO guide pages. Paste in a search phrase, the reader's emotional context, and a concrete example scenario, and it returns two paragraphs that meet the reader exactly where they are. Built for the content pipeline: review, tweak one sentence, paste into the JSON record, ship.",

  guide: {
    overview: "Every SEO guide page needs one thing a template can't provide: an opening that makes the reader feel seen. LedeBuilder generates that opening from three inputs — the search phrase, the emotional context, and a concrete scenario — then gets out of the way. The output is two short paragraphs, written in second person, that land the reader in their exact moment before the 'how to do it' section begins.",
    howToUse: [
      "Paste the search_phrase exactly as it appears in the JSON content record",
      "Describe the emotional context — how the reader is feeling right now (nervous, frustrated, embarrassed, etc.)",
      "Write a concrete example scenario — a specific situation that captures the reader's moment",
      "Optionally name the tool the page promotes — helps the draft land the right tone",
      "Review the two-paragraph output, tweak one sentence if needed, paste into the lede field of the JSON record",
      "Run npm run build:seo to regenerate the page"
    ],
    example: {
      scenario: "Writing the lede for the page: 'how to tell your boss they're wrong'",
      action: "Search phrase: 'how to tell your boss they're wrong'. Emotional context: nervous, second-guessing yourself, slightly resentful. Scenario: your manager greenlights a plan you know will fail and is now asking for your buy-in.",
      result: "Two paragraphs that open with the reader in the meeting, plan on the board, looking for a way out — before transitioning naturally into the five-step guide."
    },
    tips: [
      "The emotional context field is the most important — vague emotions produce generic ledges, specific emotions produce felt ones",
      "If the first draft feels slightly off in tone, hit Redraft — the prompt is non-deterministic and the second attempt is often better",
      "The scenario doesn't need to match the reader's exact situation — it just needs to be specific enough to feel real",
      "After pasting into the JSON, replace paragraph breaks with \\n\\n for the lede field format"
    ]
  }
},
{
  modified: "2026-03-24",
  id: "DriveHome",
  title: "DriveHome",
  tagline: "Your safety net for every drive",
  tags: [
    'drive', 'driving', 'safety', 'car', 'night driving', 'solo drive',
    'check-in', 'timer', 'emergency', 'bad weather', 'snow', 'rain',
    'location sharing', 'watch for me', 'nervous driving', 'road safety',
    'long drive', 'late night', 'highway', 'inclement weather'
  ],
  icon: "🚗",
  categories: ['The Grind'],
  headerColor: "#1e2a3a",
  description: "AI safety companion for solo drives — assess your route and conditions before you leave, then activate the check-in timer so someone always knows you made it.",
  guide: {
    overview: "DriveHome is a safety net for solo drives, not a navigation app. Setup tab: enter your from/to locations, select conditions, road type, and how you're feeling — the AI assesses your specific drive with watch-for items, a pre-drive checklist, and an honest take if you're tired or anxious. Then set a check-in timer and copy a Watch-For-Me message to send before you leave. Drive tab: the timer counts down and asks 'Are you safe?' when it expires. If you don't respond within 30 seconds, the emergency alarm triggers automatically. Share Location and one-tap Emergency are always available. Emergency contacts are shared with SafeWalk — set once, used in both.",

    howToUse: [
      "SETUP TAB: Enter where you're driving from and to (include city and state). Select time of day, road conditions, road type, and how you're feeling. Tap 'Assess My Drive' for a tailored safety briefing.",
      "Review the checklist and check off items. If you're tired or anxious, read the Honest Take — it's there for a reason.",
      "Set your check-in timer (how long the drive should take), copy the Watch-For-Me message and send it to your primary contact, then tap 'Start Drive'.",
      "DRIVE TAB: The timer counts down. When it expires, tap 'I'm Safe' to confirm you arrived. If you need more time, tap +15 or +30 min. If you don't respond within 30 seconds, the alarm triggers automatically.",
      "Use Share Location to copy your GPS coordinates into a ready-to-send text at any point during the drive.",
      "SETTINGS: Add emergency contacts — the primary contact's name appears in alerts and the Watch-For-Me message. Contacts are shared with SafeWalk."
    ],

    example: {
      scenario: "Driving home from a friend's house at midnight in a snowstorm, about 45 minutes on the highway.",
      action: "Enter 'From: 45 Elm St, Brookline, MA', 'To: Home, Arlington, MA'. Select 'Late night', 'Snow / Ice', 'Highway', and 'Fine'. Tap Assess.",
      result: "AI flags reduced visibility and longer stopping distances on the specific highway, recommends a checklist item for tires and wipers, and generates an ETA message. You copy the Watch-For-Me message to your partner, set a 55-minute timer (buffer built in), and start the drive. When the timer expires, you tap 'I'm Safe' from the parking lot."
    },

    tips: [
      "Add a primary emergency contact in Settings — their name appears in the Watch-For-Me message and emergency alerts",
      "Set the timer slightly longer than your expected drive — you can always tap 'I'm Safe' early",
      "The 30-second auto-alarm countdown appears when the timer expires — tap any button to stop it",
      "Share Location copies your GPS as a Google Maps link — paste it into any messaging app in one tap",
      "Contacts set in DriveHome are also available in SafeWalk, and vice versa"
    ],

    pitfalls: [
      "DriveHome does not have real-time traffic or road condition data — the AI assessment uses the conditions you select",
      "Location sharing requires browser location permission — grant it before starting the drive, not mid-drive",
      "The check-in timer runs in-browser — keep the tab open or the timer may not fire on some mobile browsers"
    ]
  }
},
{
  modified: "",
  id: "ToolFinder",
  title: "ToolFinder",
  tagline: "Describe your problem — I'll find the right tool.",
  tags: ['find tool', 'search', 'which tool', 'help me', 'recommend', 'browse', 'discover', 'guide', 'navigate', 'right tool', 'suggest', 'match'],
  icon: "🧰",
  categories: ['Do It!'],
  headerColor: "#e0b8b8",
  description: "With 100+ tools, how can you find the right one? Describe what you need in plain language and ToolFinder employs AI to find the best DeftBrain tools for your situation, explains why each one fits, and tells you exactly what to enter when you get there. Recommends workflows when multiple tools work together.",
  guide: {
    overview: "ToolFinder is the front door to DeftBrain. Instead of browsing the dashboard, describe your problem — a difficult conversation, a money question, something that broke, a decision you're stuck on — and it matches you with the right tools. Reads between the lines, recommends 1-5 tools ranked by relevance, and explains the fastest path to a solution.",
    howToUse: [
      "Describe your problem, situation, or need in plain language",
      "Or tap a quick-pick button to jump in",
      "Review the recommended tools — each explains why it fits YOUR situation",
      "Click any tool card to open it directly",
      "Check the workflow section if multiple tools work best in sequence"
    ],
    example: {
      scenario: "Your landlord is threatening to keep your security deposit and you got a sketchy itemized list.",
      action: "Type the situation into ToolFinder.",
      result: "Recommends RentersDepositSaver (best match), LeaseTrapDetector (review lease clauses), and ComplaintEscalationWriter (if they don't budge). Workflow explains the order."
    },
    tips: [
      "More detail gets better matches — 'money problem' is vague, 'my roommate owes me $200 and it's awkward' is specific",
      "The workflow section shows how to chain tools together",
      "Quick-pick buttons are great starting points if you're not sure how to describe it",
      "If results aren't perfect, add more context and search again"
    ]
  }
},
{
  modified: "2026-03-10",
  id: "CrowdWisdom",
  title: "Crowd Wisdom",
  tagline: "Five real perspectives on the choice you can't stop thinking about",
  tags: ['decision', 'advice', 'perspective', 'stuck', 'dilemma', 'choice', 'career', 'relationship', 'life change', 'opinions'],
  icon: "👥",
  categories: ['Diversions', 'Veer'],
  headerColor: "#b8dcd8",
  description: "Five life archetypes — the Pragmatist, the Risk-Taker, the one who Did It and Regretted It, the one who Didn't, and the Contrarian — each respond to your question from their own experience. See the tension between their views and find the question nobody thought to ask.",
  guide: {
      overview: "Crowd Wisdom channels five distinct life archetypes — each shaped by different values and different outcomes. The goal isn't consensus. It's to surface the tension, the blind spots, and the question you haven't thought to ask yet.",
      howToUse: [
        "Describe the situation or decision you're wrestling with",
        "Add context about your life, goals, or values if relevant",
        "Five voices respond — each with their core belief, what they'd say, and what they might miss",
        "Read the tension between the voices — that's where the real insight is",
        "Look for 'the question nobody asked' — often the most useful output"
      ],
      example: {
        scenario: "Should I quit my stable job to take a risky startup role?",
        action: "Describe the job, the startup, your financial situation, and what's pulling you toward the leap",
        result: "Five voices: the Pragmatist warns about runway, the Risk-Taker calculates asymmetric upside, the Did-It-and-Regretted-It voice warns about the culture fit you're ignoring, the Didn't-and-Regretted-It voice names the window that closes, and the Contrarian asks whether the real fear is failure or success."
      },
      tips: [
        "The more specific your situation, the more specific — and useful — each voice gets",
        "The 'thing they might miss' section is where the stealth insight lives — don't skip it",
        "The tension between voices is more useful than any single answer",
        "Use this for decisions where you've already heard the obvious advice and need something different"
      ],
      pitfalls: [
        "Don't look for a majority vote — disagreement between voices is the point",
        "Vague questions get generic voices; the more specific your situation, the sharper the insight",
        "The 'question nobody asked' section is often the most valuable — don't skip it"
      ]
    }
},
{
  modified: "2025-03-05",
  id: "FutureProof",
  title: "Future Proof",
  tagline: "The 5-year trajectory on any skill, career, or bet — before you go all in",
  tags: ['career', 'future', 'skills', 'investment', 'strategy', 'technology', 'automation', 'planning', 'trajectory', 'trend'],
  icon: "🔮",
  categories: ['Pursuits', 'Veer'],
  headerColor: "#ccdfc4",
  description: "5-year trajectory analysis for a skill, career path, investment, technology, or commitment. Get tailwinds, headwinds, automation risk, adjacent pivot moves, and three scenarios — bull, base, and bear case. Ends with the one action worth taking now.",
  guide: {
      overview: "FutureProof runs a 5-year trajectory analysis on anything you're betting on — a skill, a career path, a technology, or a major commitment. It identifies the structural forces working for and against it, assesses automation risk, maps adjacent moves, and delivers three honest scenarios.",
      howToUse: [
        "Name what you're stress-testing — a skill, career, technology, or investment",
        "Select the subject type for more calibrated analysis",
        "Optionally add your context — industry, experience level, goals",
        "Review trajectory, tailwinds, headwinds, and the automation question",
        "Read all three scenarios — bull, base, and bear — then the honest take"
      ],
      example: {
        scenario: "Is UX design a good skill to invest heavily in right now?",
        action: "Enter 'UX Design' as a skill, add context about your current level and industry",
        result: "Trajectory: Transforming. Tailwinds: AI tools increasing design output speed, more products competing on experience. Headwinds: AI automating wireframing and research synthesis. Automation risk: low-fidelity mockups at risk, strategy less so. The pivot: UX + AI tooling fluency is the moat. One action: ship one project using Figma AI this month."
      },
      tips: [
        "Be specific about what you're analyzing — 'coding' is too broad, 'Python for ML pipelines' is useful",
        "The adjacent moves section often surfaces better bets than the original subject",
        "Read the bear case last — it's the most useful scenario for preparation",
        "Run this on things you're already committed to, not just things you're considering"
      ]
    }
},

{
  modified: "",
  id: "MarkupDetective",
  title: "MarkupDetective",
  tagline: "Why does this cost that? Follow the money.",
  tags: ['markup', 'pricing', 'cost', 'price breakdown', 'product', 'overpriced', 'why so expensive'],
  icon: "🏷️",
  categories: ["Loot"],
  headerColor: "#c0d8b8",
  description: "Ever wonder why a $5 coffee costs $5 or hospital aspirin is $25? Describe any product or service and MarkupDetective breaks down the actual cost structure — raw materials, labor, overhead, margin, and the psychological pricing tactics at play. See the markup multiplier, industry secrets, the fair price, and how to pay less.",
  guide: {
    overview: "MarkupDetective is pricing forensics for everyday life. Pick any product or service, and it shows you exactly where your money goes — what percentage is raw materials vs. labor vs. brand premium vs. pure profit. Includes the psychological pricing tactics being used on you, industry secrets about how things are really priced, and specific ways to get the same thing for less.",
    howToUse: [
      "Describe the product or service you're curious about",
      "Optionally add the specific price you saw and where",
      "Or tap a popular mystery to jump in",
      "Review the cost breakdown with visual bars showing where money goes",
      "Check the fair price comparison and money-saving tips"
    ],
    example: {
      scenario: "You just paid $15 for a cocktail at a nice bar.",
      action: "Enter '$15 cocktail at a cocktail bar' into MarkupDetective.",
      result: "Shows the spirits cost about $2.50, the garnish/mixer is $0.80, labor is $3, and you're paying $8.70 for the atmosphere and brand. Markup: 6x. Pricing psychology: anchoring against the $18 'premium' cocktails. Industry secret: most bars make 80% margin on well drinks."
    },
    tips: [
      "Adding the specific price and context gets more precise breakdowns",
      "The 'industry secrets' section reveals things companies don't want you to know",
      "Fair price comparison shows what insiders actually pay",
      "Save money tips are specific to each item, not generic advice"
    ]
  }
},

{
  modified: "2025-03-05",
  id: "SignalVsNoise",
  title: "Signal vs. Noise",
  tagline: "Cut through contradictions and find what the evidence actually says",
  tags: ['research', 'health', 'science', 'evidence', 'fact check', 'contradictory', 'study', 'debunked', 'diet', 'finance', 'productivity', 'truth'],
  icon: "📡",
  categories: ['Go Deep!'],
  headerColor: "#d4dde8",
  description: "Separates established evidence from marketing, ideology, and noise in any health, finance, productivity, or self-improvement topic. Three sections: what we actually know, what's noise and why, and what's genuinely debated. Ends with what to do and what to ignore.",
  guide: {
      overview: "SignalVsNoise is an evidence filter. Paste any contested topic — intermittent fasting, index funds, cold showers, productivity systems — and get a structured breakdown of what the evidence actually supports, what's noise and why, and what's legitimately still debated.",
      howToUse: [
        "Enter any health, finance, productivity, or lifestyle topic you've seen conflicting advice about",
        "Review The Signal — claims with high confidence and the reason we know them",
        "Review The Noise — marketing, cherry-picked studies, and methodology problems",
        "Check Genuinely Debated — questions where reasonable experts still disagree",
        "Use the Bottom Line to know exactly what to do and what to ignore"
      ],
      example: {
        scenario: "Is creatine actually worth taking for fitness?",
        action: "Enter 'creatine supplementation for athletic performance'",
        result: "Signal: strong evidence for strength and power output, safe for most healthy adults. Noise: cognitive enhancement claims are preliminary, loading phase is marketing. Genuinely debated: optimal timing, long-term effects in older adults. Bottom line: if you lift, probably worth it. Skip loading protocols."
      },
      tips: [
        "Works best on topics where you've seen contradictory headlines or advice",
        "The 'sources of noise' section names who benefits from the misinformation",
        "The Genuinely Debated section is where intellectual honesty lives — don't skip it",
        "Use this before making any significant health, financial, or lifestyle decision"
      ]
    }
},

{
  modified: "2025-03-05",
  id: "PreMortem",
  title: "Pre-Mortem",
  tagline: "Your plan has already failed. This is the memo explaining why.",
  tags: ['planning', 'strategy', 'failure', 'risk', 'decision', 'startup', 'project', 'business', 'assumptions', 'blind spots', 'career'],
  icon: "💀",
  categories: ['The Office', 'Veer'],
  headerColor: "#d4dde8",
  description: "A post-mortem written from the future, before you execute. Your plan has already failed — this is the memo explaining why. Get the most likely failure modes with probability ratings, the fatal assumption you're making, the warning signs you'll ignore, and the one thing that actually determines the outcome.",
  guide: {
      overview: "PreMortem runs a cognitive inversion: assume your plan has already failed, then work backward to explain why. This technique — used by NASA, military planners, and venture investors — surfaces risks that forward-thinking misses.",
      howToUse: [
        "Describe your plan, project, or decision in specific terms",
        "Select the plan type — startup, career move, project, relationship, etc.",
        "Add timeline and key stakes if relevant",
        "Read the failure narrative — the memo from your future self",
        "Focus on the Fatal Assumption and the Assumptions Autopsy — these are the most actionable outputs"
      ],
      example: {
        scenario: "Launching a newsletter as a side business",
        action: "Describe the newsletter topic, target audience, monetization plan, and time you can commit",
        result: "The memo: 'We failed because we optimized for content quality instead of distribution. We assumed great writing would spread. It didn't. Fatal assumption: quality = growth. Warning sign ignored: open rate declining month 2, no referral system built. The one thing: distribution strategy had to come before content strategy.'"
      },
      tips: [
        "The more specific your plan, the more specific and actionable the failure modes",
        "The Fatal Assumption is the most important output — test it before you execute",
        "Use the Assumptions Autopsy to build a pre-launch checklist",
        "Run this on plans you're most excited about — excitement is when blind spots are largest"
      ]
    }
},

{
  modified: "2025-03-05",
  id: "ChaosPilot",
  title: "Chaos Pilot",
  tagline: "One calculated disruption. Not random — strategically chaotic.",
  tags: ['stuck', 'rut', 'routine', 'bored', 'stagnant', 'change', 'habit', 'shake up', 'motivation', 'growth', 'pattern', 'disruption', 'intervention', 'novelty', 'life change', 'burnout', 'monotony'],
  icon: "🎰",
  categories: ['What If?', 'Veer'],
  headerColor: "#b8dcd8",
  description: "Diagnoses the invisible rut you're stuck in — the behavioral pattern producing stagnation — and designs one specific, strategically uncomfortable disruption to break it. Not random novelty. One surgical intervention with exact timing, a full instruction, and a pre-empted excuse for when you want to skip it.",
  guide: {
      overview: "ChaosPilot diagnoses the pattern producing your stagnation before prescribing anything. The disruption it designs is specific enough to execute today, slightly uncomfortable enough to produce a reaction, and targeted at the exact constraint making your world small.",
      howToUse: [
        "Describe your typical week in as much detail as possible",
        "Add context about what's feeling stale, stuck, or repetitive",
        "Review the pattern diagnosis — the invisible rut and what it's costing you",
        "Read the full disruption instruction and commit to the exact timing specified",
        "Note the friction described — recognizing it when it arrives is the key to following through"
      ],
      example: {
        scenario: "Work from home, same routine every day, weeks blurring together",
        action: "Describe the routine in detail, including evenings and weekends",
        result: "Invisible rut: you've optimized your life to minimize friction, which has eliminated the serendipity that used to make you feel alive. The disruption: take your laptop to a different neighborhood every Friday afternoon. Go somewhere inconvenient. Don't open Slack for the first 30 minutes. The friction you'll feel: 'This is inefficient.' That feeling is the signal."
      },
      tips: [
        "The more specific your routine description, the more surgical the disruption",
        "The 'compound effect' section shows why one small disruption is worth doing",
        "When you feel the specific friction named in advance, do it anyway — that's the point",
        "One disruption per run — the value is in the precision, not the quantity"
      ]
    }
},

{
  modified: "2025-03-05",
  id: "OnePercenter",
  title: "One Percenter",
  tagline: "The single 1% change with the largest compound effect on your year",
  tags: ['habit', 'routine', 'productivity', 'compound', 'improvement', 'focus', 'health', 'sleep', 'small change', 'systems', 'optimize'],
  icon: "⚡",
  categories: ['Me', 'Veer'],
  headerColor: "#e0b8b8",
  description: "Analyzes your daily routine as a system, finds the single bottleneck producing the most constraint, and delivers one specific 1% adjustment with the highest compound effect. Includes the full chain reaction, the actual math, why the tempting alternatives are second-order, and why you haven't done this already.",
  guide: {
      overview: "OnePercenter analyzes your routine the way an engineer analyzes a system — looking for the single chokepoint where a small change produces the most downstream relief. The discipline of this tool is identifying the right 1%, not a menu of 10 things to try.",
      howToUse: [
        "Describe your daily routine in honest detail — include the bad habits",
        "Note what you're trying to improve and what you notice isn't working",
        "Read the system diagnosis — how your routine actually functions as a system",
        "Implement the one change exactly as specified",
        "Read 'A Year From Now' — it's the motivation to actually do it"
      ],
      example: {
        scenario: "Productive some days, derailed others, never feel rested",
        action: "Detail the full weekday routine from alarm to bed, including phone habits and meal timing",
        result: "The bottleneck: checking your phone in bed is corrupting your first 20 minutes and setting a reactive mode for the day. The 1% change: move charger to kitchen. Chain reaction: no phone in bed → first 20 minutes intentional → creative work before reactive work. The math: 20 min × 365 = 121 hours of recovered intentional time per year."
      },
      tips: [
        "Be honest about the routine — the tool can only work with what you share",
        "The 'why the alternatives are second-order' section explains why not to start elsewhere",
        "Implement for 3 weeks before judging — compound effects are slow to start",
        "Run this again in 3 months — the bottleneck shifts once you fix the first one"
      ]
    }
},

{
  modified: "2025-03-05",
  id: "EgoKiller",
  title: "Ego Killer",
  tagline: "Intellectual demolition and reconstruction. You come out changed or unshakeable.",
  tags: ['belief', 'argument', 'critical thinking', 'debate', 'philosophy', 'challenge', 'steelman', 'opinion', 'change my mind', 'bias'],
  icon: "🪦",
  categories: ['Go Deep!', 'Me'],
  headerColor: "#d4dde8",
  description: "Steelmans your belief in its strongest form, then delivers the single most devastating counter-argument — the one hardest to dismiss. Identifies the hidden assumption the belief depends on, recovers what genuinely survives, and rebuilds a more defensible version you can actually hold.",
  guide: {
      overview: "EgoKiller runs a three-stage process: steelman, demolish, rebuild. It states your belief in its strongest form, attacks with the most devastating (not cheapest) counter-argument available, then identifies what genuinely survives and rebuilds a more precise, defensible version.",
      howToUse: [
        "Enter a belief, principle, or conviction you hold — philosophical, political, personal, or practical",
        "Optionally explain why you hold it and how strongly",
        "Read the steelman first — if it feels wrong, refine your belief statement and resubmit",
        "Study the demolition — focus on the hidden assumption, not just the attack",
        "The rebuild is the most important output — copy and keep it"
      ],
      example: {
        scenario: "'Hard work always pays off'",
        action: "Enter the belief, note it's been reinforced by personal success",
        result: "Steelmanned: sustained effort in high-leverage domains reliably compounds over time. Demolition: survivorship bias — we see the hard workers who succeeded, not those equally hard-working in declining industries. Hidden assumption: effort and outcome are causally linked regardless of context. Rebuild: 'Hard work dramatically improves your odds — but only when applied to problems worth solving in environments where effort is rewarded.'"
      },
      tips: [
        "The most uncomfortable beliefs to submit are the ones that need this most",
        "The verdict — demolished/refined/vindicated — is less important than the rebuild",
        "Run your rebuilt belief through Belief Stress Test for further calibration",
        "Works equally well on political beliefs, life rules, and business assumptions"
      ]
    }
},

{
  modified: "2025-03-05",
  id: "BeliefStressTest",
  title: "Belief Stress Test",
  tagline: "Your guiding beliefs, pressure-tested. Where they hold. Where they break.",
  tags: ['belief', 'critical thinking', 'philosophy', 'assumptions', 'test', 'logic', 'values', 'worldview', 'self-awareness', 'bias', 'edge case'],
  icon: "🔬",
  categories: ['Go Deep', 'Diversions', 'Me'],
  headerColor: "#d4dde8",
  description: "Pressure-tests the guiding beliefs you live by across multiple dimensions: historical counterexamples, logical edge cases, cultural variations, empirical exceptions. Finds where the belief holds, where it breaks, the psychological function it serves, and the more precise version that actually survives scrutiny.",
  guide: {
      overview: "BeliefStressTest runs your operating beliefs through a battery of tests — not to destroy them, but to find where they're actually true versus where they're a useful simplification that misleads in specific situations. The output is a calibrated upgrade.",
      howToUse: [
        "Enter a belief that guides your decisions or how you see the world",
        "Optionally add context about how you apply it in your life",
        "Review the stress tests by severity — focus on fatal ones first",
        "Read the 'hidden structure' section — why you hold this belief often matters as much as whether it's true",
        "The upgrade in the final section is the practical takeaway"
      ],
      example: {
        scenario: "'Everything in moderation'",
        action: "Enter the belief, note you apply it to diet, work, and leisure",
        result: "Where it holds: prevents extremes, reduces anxiety. Fatal stress test: doesn't apply to genuinely harmful things — moderate heroin use isn't wisdom. Significant: some goods require full commitment, not moderation. Hidden structure: it's really a rule against anxiety, not a guide to quantity. Upgrade: 'Moderation is a useful default for diminishing-return activities. For things requiring mastery or commitment, replace moderation with intentionality.'"
      },
      tips: [
        "The 'psychological function' section is often the most revealing part",
        "Severity ratings on stress tests help you prioritize what's worth acting on",
        "Most useful for beliefs you've held so long you've stopped examining them",
        "Pair with Ego Killer when you want a full demolition-and-rebuild"
      ]
    }
},

{
  modified: "2025-03-05",
  id: "LuckSurface",
  title: "Luck Surface",
  tagline: "Calculate your luck surface area. Expand it with five specific moves.",
  tags: ['networking', 'opportunity', 'career', 'luck', 'serendipity', 'visibility', 'connections', 'social', 'growth', 'get noticed', 'community'],
  icon: "🧲",
  categories: ['Pursuits', 'Me'],
  headerColor: "#ccdfc4",
  description: "Calculates your luck surface area — the percentage of available serendipity you're actually exposed to — and designs five specific asymmetric moves to expand it. Each move is a different mechanism: broadcast a signal, infiltrate a new room, create a serendipity artifact, curate a connection, or compound an existing asset.",
  guide: {
      overview: "Luck surface area is the aggregate exposure to serendipitous collisions with opportunities, people, and ideas. It's not random — it's engineered. LuckSurface audits your current patterns and designs five asymmetric moves: low effort, high serendipity potential.",
      howToUse: [
        "Describe your life in detail — where you go, who you know, what you make or share publicly",
        "Add what kind of luck you want more of — opportunities, collaborators, clients, mentors",
        "Optionally note what you already do to put yourself out there",
        "Review each of the five moves and expand the ones that resonate",
        "Start with the 'Start Here' move at the bottom — it's the highest-leverage first step"
      ],
      example: {
        scenario: "Remote software engineer, feeling professionally invisible",
        action: "Describe the routine, the small friend group, the absence of industry events",
        result: "Current surface: 14%. Invisible wall: professional identity outsourced entirely to employer — no external signal of what you know or care about. Five moves: (1) One technical post per month about something you had to figure out; (2) Next local tech meetup, introduce yourself to one person; (3) Open-source one internal tool with a thoughtful README; (4) One coffee with a former colleague per quarter; (5) Add one line to LinkedIn about what you're interested in next."
      },
      tips: [
        "The mechanism labels explain why each move works — not just what to do",
        "The 'time to first result' estimate helps calibrate expectations per move",
        "Choose the lowest-friction move first — momentum matters more than perfection",
        "Re-run every 6 months — the bottleneck shifts as your surface grows"
      ]
    }
},

{
  modified: "2026-03-11",
  id: "GravityWell",
  title: "Gravity Well",
  tagline: "A 90-day plan to pull someone into your orbit — before you ever reach out",
  tags: ['networking', 'cold outreach', 'mentor', 'investor', 'career', 'relationship', 'connection', 'reach out', 'linkedin', 'introduction', 'warm'],
  icon: "🌀",
  categories: ['Humans'],
  headerColor: "#e0b8b8",
  description: "A 90-day plan to naturally enter someone's orbit before you ever reach out. Not cold outreach — gravitational pull. Three phases: become findable, enter their periphery, make the connection natural. Ends with the exact first contact message, the timing condition, and the one thing to do today.",
  guide: {
      overview: "GravityWell is built on one insight: cold outreach fails because there's no warm surface. The solution isn't better cold messaging — it's eliminating cold entirely. By building proximity, visibility, and value over 90 days, the first contact feels earned rather than intrusive.",
      howToUse: [
        "Describe the person you want in your life — their role, world, and what they're known for",
        "Select the relationship type — mentor, collaborator, investor, employer, client",
        "Add why this person specifically and what you genuinely bring to the relationship",
        "Follow the three phases in order — don't skip to Phase 3 early",
        "Use the first contact template only when the timing condition is met"
      ],
      example: {
        scenario: "Want to connect with a VC who invests in climate tech",
        action: "Describe their focus, your background in climate research, why this specific person",
        result: "Phase 1: Get a byline somewhere in the climate tech space; build a public portfolio with a clear POV. Phase 2: Engage with their writing — add data, not 'great post'; attend one event where they're speaking. Phase 3: Publish original research touching their thesis. First contact: 'I wrote about [X trend] in your portfolio space — thought the data might be interesting.' Timing condition: they've engaged with something you published."
      },
      tips: [
        "90 days is a minimum — gravity builds slower for harder-to-reach people",
        "The 'value offer' section tells you what to lead with — don't skip it",
        "The 'what they avoid' section is as important as the positive strategy",
        "Works for investors, mentors, potential employers, collaborators, and creative partners"
      ],
          pitfalls: [
      "The gravity score is illustrative, not a measurement — it reflects what the AI infers from your description, not an objective assessment",
      "The 'First Step' action is calibrated to your current score; skipping straight to Phase 3 tactics before Phase 1 is complete usually backfires",
      "Being vague about your background produces generic approach scripts — include one specific achievement or shared interest"
    ]
    }
},

{
  modified: "2025-03-05",
  id: "RulebookBreaker",
  title: "Rulebook Breaker",
  tagline: "The loopholes, magic words, and escalation ladder nobody tells you about",
  tags: ['complaint', 'escalate', 'insurance', 'landlord', 'hoa', 'customer service', 'dispute', 'refund', 'bureaucracy', 'rights', 'loophole', 'fight back', 'appeal'],
  icon: "🏴‍☠️",
  categories: ['The Office', 'Loot'],
  headerColor: "#d4dde8",
  description: "Maps the undocumented paths through any bureaucratic system — the loopholes nobody advertises, the escalation ladder that actually works, the magic phrases that trigger different handling, and the regulatory bodies that have real teeth. For when the official answer is 'nothing we can do' and you know that's wrong.",
  guide: {
      overview: "Every formal system has informal architecture. RulebookBreaker maps it — the exceptions that exist but aren't advertised, the phrases that route your call differently, the regulatory agency that actually investigates, and the escalation path that reaches someone with real authority. Legal leverage only.",
      howToUse: [
        "Name the system — Comcast, health insurance, HOA, landlord, university, IRS, airline",
        "Describe the specific problem and the outcome you want",
        "Note what you've already tried — this changes the recommended path",
        "Follow the escalation ladder in order — don't jump to nuclear options prematurely",
        "Use magic phrases exactly as written — small wording changes reduce their effectiveness"
      ],
      example: {
        scenario: "Health insurance denied a claim for a procedure the doctor says was medically necessary",
        action: "Describe the procedure, the denial reason, and that one appeal has already been filed",
        result: "How it works: first-level denials are automated; human review happens at second appeal. Ladder: (1) Request denial code and ask for 'peer-to-peer review' between your doctor and their medical director; (2) File with your state Insurance Commissioner; (3) Request Independent Medical Review via your state's external appeals process. Magic phrases: 'peer-to-peer review,' 'external independent review,' 'medical necessity criteria per your utilization management guidelines.'"
      },
      tips: [
        "The 'magic phrases' section is literal — use the exact wording provided",
        "The regulatory angle works even if the complaint goes nowhere — it signals seriousness",
        "The win-likelihood assessment tells you if this battle is worth the time investment",
        "Pair with MagicMouth to script the actual phone calls"
      ]
    }
},

{
  modified: "2025-03-05",
  id: "TruthBomb",
  title: "Truth Bomb",
  tagline: "The thing about yourself you don't reveal.",
  tags: ['honest', 'hard conversation', 'truth', 'unsaid', 'relationship', 'conflict', 'feelings', 'scared', 'say it', 'communication', 'hiding', 'difficult'],
  icon: "💣",
  categories: ['Read the Room', 'Me'],
  headerColor: "#e0b8b8",
  description: "We all have things about ourselves we don't reveal to others. Truth Bomb examines what it's about, identifies what it costs you to hide it; explores what would actually happen if you said it, and scripts it three ways: gentle opening, direct statement, and full truth. Ends with permission to not say it — and the honest cost of that choice.",
  guide: {
      overview: "TruthBomb handles the unsaid thing — not with therapy, but with clarity. It examines what's really driving the silence, what it's costing you to maintain it, and what would realistically happen if you said it. Then it scripts three versions: a gentle opening, a direct statement, and the full unfiltered truth.",
      howToUse: [
        "Type the thing you're hiding — to yourself or to someone else. Be honest.",
        "Select who it's about and optionally why you haven't said it",
        "Add relationship context if relevant",
        "Read 'what it's really about' before jumping to the scripts — context changes which version fits",
        "Choose the version that matches what you actually need to accomplish"
      ],
      example: {
        scenario: "I don't love my job anymore and I've been hiding it from my partner because they sacrificed for me to get it",
        action: "Enter the truth, note the relationship and the guilt driving the silence",
        result: "What it's really about: afraid their sacrifice feels wasted — and afraid they'll tell you to stay. What hiding it costs: distance already building as they sense your disengagement. What would happen: probably relief — they've noticed something is off. Gentle: 'I want to talk about where I am with work — some things have shifted for me.' Full truth: 'I've been pretending I'm okay with this job because of everything you gave up, and that's not fair to either of us.'"
      },
      tips: [
        "This tool doesn't tell you whether to say it — that decision is yours",
        "'Permission to not say it' is a real section — sometimes silence is the right call",
        "The timing section gives conditions, not a date — wait for the right moment",
        "Pair with MagicMouth for scripting difficult professional conversations"
      ]
    }
},

{
  modified: "",
  id: "AnalogyEngine",
  title: "Analogy Engine",
  tagline: "Explain anything to anyone — using their world.",
  tags: ['explain', 'analogy', 'understand', 'teach', 'simplify', 'metaphor', 'learning', 'teaching', 'communication', 'explanation', 'concept', 'audience', 'clarity'],
  icon: "💡",
  categories: ['Go Deep!', 'Discourse'],
  headerColor: "#d4dde8",
  description: "Describe a concept and who you're explaining it to. Analogy Engine generates tailored analogies using their world. Each one includes why it works, where it breaks down, accuracy ratings, and a teaching tip for delivery.",
  guide: {
    overview: "AnalogyEngine creates analogies so tailored that complex ideas become instantly obvious. Tell it what you need to explain and who the audience is — especially their interests and world — and it generates multiple analogies that use concepts your audience already understands. Every analogy shows its accuracy, memorability, where it breaks down, and how to deliver it.",
    howToUse: [
      "Enter the concept you need to explain",
      "Describe who you're explaining it to",
      "Add their interests for much better results (e.g., 'loves cooking', 'plays basketball')",
      "Choose depth: quick grasp, solid understanding, or deep dive",
      "Pick your favorite analogy or copy all of them"
    ],
    example: {
      scenario: "You need to explain machine learning to your chef friend.",
      action: "Enter 'machine learning', audience 'a chef', interests 'cooking, restaurants, flavor profiles'.",
      result: "Generates analogies like 'The Recipe Refinement' — ML is like a chef who makes a dish 10,000 times, adjusting one ingredient each time based on customer reactions, until they've 'learned' the perfect recipe without anyone giving them the recipe."
    },
    tips: [
      "The audience's interests field is where the magic happens — the more specific, the better",
      "Check the 'where it breaks down' section so you know the analogy's limits",
      "The teaching tip gives you delivery advice specific to your explanation",
      "Try different audiences for the same concept to see how framing changes"
    ]
  }
},

{
  modified: "",
  id: "ColdOpenCraft",
  title: "Cold Open Craft",
  tagline: "First messages that actually get responses.",
  tags: ['cold email', 'first message', 'reach out', 'introduction', 'outreach', 'networking', 'linkedin', 'dm', 'twitter', 'instagram', 'pitch', 'mentor', 'collaboration', 'job', 'stranger', 'follow up', 'cold outreach'],
  icon: "📬",
  categories: ['The Office', 'Discourse'],
  headerColor: "#d4dde8",
  description: "Reaching out to someone you don't know — for networking, a job, a collaboration, or a favor? Describe who and why, and ColdOpenCraft generates 3 openers ranked by boldness (safe, balanced, bold), explains the psychology behind each, includes a follow-up plan, and warns you what NOT to say. Channel-specific for email, LinkedIn, DM, or in-person.",
  guide: {
    overview: "ColdOpenCraft is for anyone who needs to reach out to a stranger and doesn't want to sound like spam. It generates three openers at different boldness levels, each with the psychology explained, estimated response rates, and guidance on when to use which version. Includes a follow-up plan with timing, a backup message, and the 'power move' nuclear option.",
    howToUse: [
      "Describe who you're reaching out to and their role/context",
      "Explain why — what you want from this connection",
      "Pick the channel (email, LinkedIn, DM, text, in-person)",
      "Add what you know about them for much more specific openers",
      "Choose your boldness level preference",
      "Pick your favorite opener and copy it"
    ],
    example: {
      scenario: "You want to pitch your startup to a podcast host for a guest appearance.",
      action: "Enter who (podcast host), why (guest pitch), channel (email), what you know about them.",
      result: "Three openers: a safe professional pitch, a balanced one that leads with a specific episode reference, and a bold one that opens with a contrarian take on their recent topic. Plus subject line, follow-up timing, and what NOT to say."
    },
    tips: [
      "The 'what you know about them' field is crucial — specificity is what separates you from spam",
      "Read the 'what NOT to say' section before sending — it's tailored to your exact situation",
      "The follow-up plan includes when to give up — that's important too",
      "For high-stakes outreach, try all three boldness levels and sleep on it"
    ]
  }
},

{
  modified: "",
  id: "ToastWriter",
  title: "ToastWriter",
  tagline: "Toasts, speeches, and tributes that land.",
  tags: ['toast', 'speech', 'wedding', 'tribute', 'public speaking', 'celebration', 'best man', 'retirement', 'birthday', 'roast', 'memorial', 'farewell'],
  icon: "🥂",
  categories: ['Discourse', 'Humans'],
  headerColor: "#e0b8b8",
  description: "Need to give a toast, speech, or tribute? Describe the person, the occasion, and any stories you want to include. ToastWriter generates 3 versions at different styles — warm, funny, elegant — each with delivery cues, the opening hook, the closing line, and an emergency closer if you freeze. Because nobody should have to wing it.",
  guide: {
    overview: "ToastWriter takes the panic out of standing up and saying something that matters. Give it details about the person, the occasion, your relationship, and any stories or details — and it generates 3 complete speeches at different warmth/humor levels, each with inline delivery cues like [PAUSE] and [LOOK AT THEM]. Plus delivery tips, common mistakes for this type of event, and a bail-out closer.",
    howToUse: [
      "Enter who the toast is for and your relationship to them",
      "Pick the occasion — wedding, birthday, retirement, roast, memorial, etc.",
      "Add any stories, details, or inside jokes you want included",
      "Choose your preferred tone and target length",
      "List topics to avoid if needed",
      "Flip between the 3 versions and pick your favorite"
    ],
    example: {
      scenario: "Best man speech at your college roommate's wedding.",
      action: "Enter the details including a story about getting lost in Tokyo together.",
      result: "Three versions: 'The Storyteller' (warm, built around the Tokyo story), 'The Roast' (funny jabs about his terrible cooking that led to meeting his partner on a food delivery app), 'The Elegant One' (shorter, refined, ending with a quote). Each has delivery cues and timing."
    },
    tips: [
      "The more stories and details you provide, the more personal the toast becomes",
      "The opening and closing lines are highlighted separately — memorize those especially",
      "Read the delivery tips before practicing — HOW you say it matters as much as WHAT you say",
      "The emergency closer works regardless of where you are in the speech"
    ]
  }
},

{
  modified: "",
  id: "WhatIf",
  title: "What If?",
  tagline: "See the road not taken before you decide.",
  tags: ['what if', 'decision', 'alternate path', 'future', 'imagine', 'scenario', 'choice'],
  icon: "🎲",
  categories: ['What If?', 'Veer'],
  headerColor: "#b8dcd8",
  description: "Facing a life decision? Pick the option you're NOT leaning toward and What If? writes you a vivid, realistic simulation of that path — complete scenes at different time points showing what daily life would actually feel like. Not pros/cons. Not advice. A visceral preview of the future you might be giving up.",
  guide: {
    overview: "What If is a thought experiment tool for big decisions. Instead of listing pros and cons, it writes vivid second-person scenes showing what the other path would actually feel like at different moments — 2 weeks in, 3 months later, 1 year out. Each scene includes sensory details, emotional texture, what's better on this path, and what it costs. The goal: help you feel what you're choosing, not just think about it.",
    howToUse: [
      "Describe the decision you're facing",
      "Tell it which option to simulate — usually the one you're NOT leaning toward",
      "Add context about your life for more realistic scenes",
      "Choose a timeframe: 1 month to 5 years",
      "Read the scenes slowly — they're designed to be felt, not skimmed"
    ],
    example: {
      scenario: "You're thinking about quitting your stable job to freelance.",
      action: "Enter the decision and ask it to simulate the path where you stay.",
      result: "Vivid scenes: 2 weeks later (relief but a nagging 'what if'), 3 months later (a quiet Tuesday where you realize the anxiety has faded but so has the excitement), 1 year later (promoted but watching your friend's freelance business take off on Instagram). Each scene has what's better and what it costs."
    },
    tips: [
      "Simulate the option you're NOT choosing — that's where the insight is",
      "Adding life context (age, partner, savings, city) makes scenes dramatically more realistic",
      "The 'clarity question' at the end often cuts through weeks of deliberation",
      "This is a thought experiment, not a prediction — use it to understand your values"
    ]
  }
},

{
  modified: "2026-03-11",
  id: "HobbyMatch",
  title: "HobbyMatch",
  tagline: "Discover hobbies you didn't know existed.",
  tags: ['hobby', 'interest', 'bored', 'activity', 'passion', 'discover', 'pastime'],
  icon: "🧬",
  categories: ['Out & About'],
  headerColor: "#ccdfc4",
  description: "Bored of the usual suggestions? Describe your personality, schedule, budget, and physical situation, and HobbyMatch recommends 5-6 hobbies you've genuinely never considered — with the hook that makes each one addictive, the absolute lowest-barrier first step you can take today, startup costs, and where to find your people.",
  guide: {
    overview: "HobbyMatch goes beyond yoga and painting to find hobbies you didn't know existed. It matches your personality, schedule, budget, and physical situation against an enormous range of activities — from urban sketching to historical fencing to mycology. Each recommendation includes what makes it addictive, a first step you can take tonight, realistic costs, and where to find community.",
    howToUse: [
      "Describe your personality and what you're like",
      "Pick what you're looking for — relaxation, social, creative, physical, etc.",
      "Add your schedule constraints and budget level",
      "List anything you've already tried so it's excluded",
      "Expand each hobby card for full details and first steps"
    ],
    pitfalls: [
      "Selecting every goal dilutes the results — pick your top two or three for more targeted suggestions",
      "The 'weird' option is intentional; don't skip it unless the suggestions feel off-brand for you",
      "Budget filtering is applied in the prompt — results may still mention paid options if they're transformatively better"
    ],
    example: {
      scenario: "Introverted night owl, $50 budget, bad knees, loves building things, already tried woodworking and model kits.",
      action: "Enter all the details and generate matches.",
      result: "Suggests bookbinding (meditative, solo, $20 starter kit), PCB design (build electronics from home at 2am), mushroom cultivation (grow kits are $30, oddly satisfying), amateur radio (build your own equipment, massive online community), and fountain pen restoration (combines mechanical tinkering with history)."
    },
    tips: [
      "List things you've tried so they're excluded — this forces more creative suggestions",
      "Tap 'Something weird' in the goals for the most unexpected recommendations",
      "The 'first step' for each hobby is designed to be doable tonight",
      "The wildcard pick at the bottom is intentionally off-script — give it a chance"
    ]
  }
},

{
  modified: "",
  id: "ProcedureProbe",
  title: "Procedure Probe",
  tagline: "Be an informed patient before you say yes.",
  tags: ['doctor', 'dentist', 'procedure', 'medical', 'appointment', 'health', 'informed patient', 'surgery', 'root canal', 'insurance', 'second opinion', 'cost', 'questions to ask'],
  icon: "🔬",
  categories: ['Body', 'Money'],
  headerColor: "#ccdfc4",
  description: "A doctor or dentist just recommended a procedure. Before you schedule, get the briefing: is this standard for your situation? What questions should you ask? What does it typically cost, and what does insurance cover? What are the red flags? What's recovery really like? Empowers you to be an informed patient — not medical advice, but medical literacy.",
  guide: {
    overview: "Procedure Probe helps you understand what you're agreeing to before a medical or dental procedure. It explains the procedure in plain language, tells you whether it's standard for your situation, generates the exact questions to ask your provider, breaks down typical costs and insurance coverage, flags red flags to watch for, and gives you an honest picture of recovery.",
    howToUse: [
      "Enter the procedure or treatment that was recommended",
      "Pick the provider type — dentist, surgeon, etc.",
      "Add the quoted price and your insurance situation if you have them",
      "Note your urgency level and any concerns",
      "Review the full briefing — especially the questions to ask"
    ],
    example: {
      scenario: "Your dentist recommended a crown for $1,200 and you're not sure it's necessary.",
      action: "Enter 'dental crown', quoted price $1,200, provider dentist, concern 'is this necessary?'",
      result: "Explains what a crown involves in plain English, notes it's standard if the tooth is >50% compromised but worth questioning for small cavities, gives 7 questions to ask (including 'can we try a large filling first?'), shows typical range is $800-$1,500, and flags the red flag of recommending crowns on teeth that could be restored with less invasive treatment."
    },
    tips: [
      "The questions to ask section is your most powerful tool — bring them to your appointment",
      "Adding your insurance situation helps the cost picture be more accurate",
      "If it flags 'get a second opinion,' that's worth taking seriously",
      "The urgency check will tell you if delaying is risky — important for time-sensitive procedures"
    ]
  }
},

{
  modified: "",
  id: "UpsellShield",
  title: "UpsellShield",
  tagline: "Walk into high-pressure sales prepared.",
  tags: ['upsell', 'sales', 'car dealership', 'pressure', 'negotiate', 'buying', 'pushy', 'negotiation', 'consumer', 'tactics', 'high pressure', 'defense'],
  icon: "🛡️",
  categories: ['Loot'],
  headerColor: "#c0d8b8",
  description: "About to visit a car dealership, phone store, furniture showroom, or contractor? Describe what you want and UpsellShield preps you with the exact sales tactics they'll use, the phrases that deflect each one, your walk-away line, and the questions that shift power back to you. Enter prepared, leave with what you actually wanted.",
  guide: {
    overview: "UpsellShield is pre-game preparation for high-pressure sales situations. Tell it where you're going and what you want, and it maps out the specific tactics that industry uses — anchoring, artificial urgency, the good-cop/bad-cop manager routine, add-on bundling — with the exact counter-phrases for each. Includes your walk-away script and the questions that make salespeople respect you.",
    howToUse: [
      "Describe where you're going and what you plan to buy or negotiate",
      "Add your budget and any constraints",
      "Review the tactics they'll use and the counter-phrases",
      "Memorize your walk-away line before you go in",
      "Reference the power questions during the conversation"
    ],
    example: {
      scenario: "Buying a used car at a dealership. Budget: $18,000.",
      action: "Enter the situation and budget.",
      result: "Maps out: they'll anchor high ($22k), use 'monthly payment' framing to hide total cost, push extended warranty, create urgency ('someone else is looking at this'), and try to sell you on financing. Counter-phrases for each, walk-away line, and the question that forces transparency: 'What's the out-the-door price with zero add-ons?'"
    },
    tips: [
      "Read through the entire prep before you walk in — not during",
      "The walk-away line is your most powerful tool — practice saying it out loud",
      "Power questions work because they signal you know the game",
      "Works for any high-pressure situation, not just cars"
    ]
  }
},

{
  modified: "2026-03-11",
  id: "HecklerPrep",
  title: "HecklerPrep",
  tagline: "Anticipate the hardest questions before they land.",
  tags: ['presentation', 'pitch', 'hard questions', 'objection', 'prepare', 'public speaking'],
  icon: "🎤",
  categories: ['The Office', 'Read the Room'],
  headerColor: "#d4dde8",
  description: "About to present, pitch, or propose something? Describe your topic and audience, and HecklerPrep generates the 10 hardest questions they'll ask — the skeptical ones, the gotcha ones, the ones you're hoping nobody brings up. Each comes with a coached answer, the psychology behind the question, and what to do if you don't know the answer.",
  guide: {
    overview: "HecklerPrep is like a sparring partner for presentations. Give it your topic, your audience, and what you're proposing, and it generates the toughest questions that audience will throw at you — not softballs, but the real challenges. Each question includes a model answer, the underlying concern the questioner has, and a bail-out strategy if you're caught off guard.",
    howToUse: [
      "Describe what you're presenting, pitching, or proposing",
      "Describe your audience — who they are and what they care about",
      "Add any known objections or sensitive areas",
      "Review the 10 hardest questions and practice the answers",
      "Memorize the bail-out strategies for questions you truly can't answer"
    ],
    example: {
      scenario: "Pitching a budget increase to the executive team for your marketing department.",
      action: "Enter the topic and audience details.",
      result: "Generates questions like 'What's the ROI on the last budget increase?', 'Why can't you do more with what you have?', 'What happens if we give you half?', each with a coached answer that addresses the real concern behind the question."
    },
    tips: [
      "The questions get harder as the list goes on — if you can handle #10, you're ready",
      "The 'real concern' behind each question tells you what they actually want to hear",
      "Practice answering out loud, not just reading the model answers",
      "The bail-out strategies are for genuine unknowns — don't fake answers"
    ],
    pitfalls: [
      "The questions are harder when you include your actual proposal — generic topic inputs produce generic objections",
      "'Brutal' difficulty questions are calibrated for board or investor pressure; they may feel discouraging for a team meeting setting",
      "The model answers are starting points — adapt them to your voice before practicing"
    ],

  }
},

{
  modified: "",
  id: "PartyArchitect",
  title: "PartyArchitect",
  tagline: "Host events people actually remember.",
  tags: ['party', 'event', 'host', 'gathering', 'planning', 'celebration', 'social'],
  icon: "🎪",
  categories: ['Out & About', 'Humans'],
  headerColor: "#ccdfc4",
  description: "Hosting a gathering and want it to not be boring? Describe the guest list, space, budget, and vibe, and PartyArchitect designs the full event flow: arrival experience, conversation catalysts, when to introduce activities, how to mix groups that don't know each other, and when to shift energy. Not a Pinterest board — an event strategy.",
  guide: {
    overview: "PartyArchitect designs the flow of your event so it feels effortless even though it was engineered. Give it your guest count, the space, your budget, who's coming, and the vibe you want — and it builds a timeline with arrival flow, ice-breaking strategies, energy peaks and valleys, activity timing, food/drink pacing, and the techniques for mixing groups that don't know each other.",
    howToUse: [
      "Describe the occasion and the vibe you want",
      "Enter guest count and who's coming (friends, coworkers, mixed groups)",
      "Describe your space and budget",
      "Add any constraints — dietary, noise, time limits",
      "Follow the event flow timeline from arrival to exit"
    ],
    example: {
      scenario: "Hosting a housewarming, 25 guests, mix of work friends and college friends who don't know each other, apartment with rooftop access, $300 budget.",
      action: "Enter all the details and generate the event plan.",
      result: "Designs a flow: arrivals in the apartment (lower-energy mingling zone with a simple conversation game on the counter), then guided migration to the rooftop at the 45-minute mark (energy peak), introduces a '2 truths and a lie' variant that naturally mixes the groups, schedules food service to create natural gathering points, and includes the 'graceful wind-down' signal."
    },
    tips: [
      "The guest mix description is crucial — 'people who don't know each other' triggers specific mixing strategies",
      "Follow the energy curve — events that stay at one energy level get boring",
      "The conversation catalysts are designed to feel natural, not forced",
      "Budget-conscious options are built in — good events don't require big spending"
    ]
  }
},

{
  modified: "",
  id: "WhereDidTheTimeGo",
  title: "Where Did the Time Go?",
  tagline: "See the gap between where you think time went and where it actually went.",
  tags: ['time', 'where did time go', 'schedule', 'time audit', 'lost time', 'hours'],
  icon: "⏳",
  categories: ['Me', 'Do It!'],
  headerColor: "#e0b8b8",
  description: "Describe your day. Optionally guess where the hours went. AI traces the invisible overhead — transitions, recovery, context switches — and shows you the gap between what you think happened and what actually happened. One structural change to get time back. No judgment.",
  guide: {
    overview: "Where Did It Go? is built on a simple truth: you almost certainly overestimate how much focused time you had and underestimate how much time vanished into invisible overhead. Describe your day and optionally estimate where time went, and AI traces the gap — the transitions you didn't count, the recovery time after meetings, the context switches that ate 20 minutes each. Ends with one concrete, structural change (not 'be more disciplined') and an honest read on your actual capacity.",
    howToUse: [
      "Pick a timeframe: today, yesterday, this week, or the weekend",
      "Describe what you did — stream of consciousness is fine",
      "Optionally estimate where you think time went (this makes the gap analysis much sharper)",
      "Read the results: validation first, then the visible day with perception gaps, then the invisible hours",
      "Pay attention to 'the one thing' — it's the single structural change that would reclaim the most time"
    ],
    example: {
      scenario: "You worked all day but feel like you got nothing done. You had a standup, worked on a presentation, answered emails, had a 1-on-1, and tried to write a report.",
      action: "Describe the day, estimate 'maybe 4 hours of real work, 2 hours of meetings, 1 hour of email.'",
      result: "AI shows you likely had ~2 hours of deep work (not 4), with 90+ minutes vanishing into post-meeting recovery, Slack interruptions, and task-switching overhead. The one change: batch all communication into two 30-minute windows instead of responding in real time."
    },
    tips: [
      "The perception estimate is optional but transforms the results — the gap is the whole point",
      "Be honest about your day, including the parts that feel unproductive — that's where the insights are",
      "The 'invisible hours' section reveals time sinks you genuinely can't see without someone pointing them out",
      "'The one thing' is deliberately singular — one change beats ten aspirational habits"
    ]
  }
},

{
  modified: "2026-03-11",
  id: "Giftology",
  title: "Giftology",
  tagline: "The perfect gift for the hardest person to shop for.",
  tags: ['gift', 'present', 'birthday', 'holiday', 'shopping', 'what to buy', 'last minute', 'thoughtful', 'personalized', 'thank you', 'wedding', 'graduation', 'card message'],
  icon: "🎁",
  categories: ['Humans', 'Loot'],
  headerColor: "#e0b8b8",
  description: "Describe whoever you're shopping for — relationship, interests, personality, constraints — and AI finds specific, personal gift ideas that feel thoughtful, not algorithmic. Every suggestion includes why it works for THIS person, where to get it, a presentation tip, and what to write in the card. Includes a wildcard option and a last-minute save if you need something today.",
  guide: {
    overview: "Giftology connects scattered things you know about a person into gift ideas that feel like you paid attention. The AI moment isn't 'here are popular gifts' — it's the reasoning chain from a specific detail about them to a specific gift that proves you notice things. Every pick includes a card message that makes even a simple gift feel intentional. Wildcard option for something unexpected, last-minute save for panic mode.",
    howToUse: [
      "Describe the recipient — relationship, interests, personality, quirks, anything you know",
      "Pick an occasion, set a budget and deadline (all optional but help focus results)",
      "Optionally mention past gifts or things to avoid",
      "Review gift ideas — expand each for the full reasoning, where to get it, and card message",
      "Check the wildcard for something unexpected, and the last-minute save if time is tight"
    ],
    example: {
      scenario: "Your mom, 60s, retired teacher, loves gardening and mystery novels. Says 'don't get me anything' every year. Budget: $30-50. Her birthday is this weekend.",
      action: "Describe her, pick 'Birthday', set budget '$30-50', deadline 'This week'.",
      result: "Top pick: a specific heirloom seed collection from Baker Creek matched to her growing zone, paired with 'The Wych Elm' by Tana French (mystery + garden setting). Card message ties the two together. Wildcard: a 'garden mystery book club' subscription box. Last-minute save: a handwritten 'coupon book' for garden help days this spring."
    },
    tips: [
      "The more specific you are about the person, the more personal the gift ideas get",
      "Mention things they've said offhand — 'she once mentioned wanting to learn pottery' is gold",
      "The card message is the secret weapon — it makes any gift feel intentional",
      "Use the wildcard when you want to surprise someone who's hard to shop for"
    ],
        pitfalls: [
      "Generic descriptions produce generic gifts — describe the person's quirks, not just their hobbies",
      "The 'wildcard' suggestion is intentionally outside the obvious options; don't dismiss it before reading the reasoning",
      "Budget filtering happens in the AI prompt, not a filter — if results feel off-range, try resubmitting"
    ],
  }
},

{
  modified: "",
  id: "AwkwardSilenceFiller",
  title: "Awkward Silence Filler",
  tagline: "Context-appropriate conversation rescues on demand",
  tags: ['conversation', 'awkward', 'small talk', 'social', 'silence', 'chat', 'date', 'networking', 'ice breaker', 'what to say', 'first date', 'elevator', 'coworker'],
  icon: "💬",
  categories: ['Discourse', 'Humans'],
  headerColor: "#e0b8b8",
  description: "Context-appropriate conversation fillers for awkward silences. 5-7 safe options from environmental observations to light questions. Matched to setting (work/party/date/family). Includes body language tips, exit strategies, and what NOT to say.",
  guide: {
    overview: "Awkward silences happen. This tool provides 5-7 conversation fillers appropriate for your specific context - safe, low-risk things to say that restart conversation without forcing it. Ranges from environmental observations to light questions to polite exits.",
    
    howToUse: [
      "Optionally describe conversation context",
      "Select setting type (casual/work/party/date/family/networking)",
      "Set your comfort level (low/medium/high anxiety)",
      "Get 5-7 conversation fillers with risk levels",
      "Learn follow-up paths for each filler",
      "See what NOT to say in this context"
    ],
    example: {
      scenario: "You're at a work happy hour. Made small talk with someone from another department, now silence. You're moderately anxious and don't know what to say.",
      action: "Context: Work happy hour, Setting: Work event, Comfort: Medium anxiety.",
      result: "Fillers: 1. Environmental (low risk): 'This place has a great vibe' â†’ Follow-up: They might share their favorite spots. 2. Work-appropriate question (low risk): 'How long have you been with the company?' â†’ Opens to their history. 3. Weekend plans (medium risk): 'Any plans for the weekend?' â†’ Safe, relatable topic. 4. Shared experience (low risk): 'These team events are nice, aren't they?' â†’ Bonds over shared context. 5. Department question (low risk): 'What's your team working on lately?' â†’ Shows interest, work-appropriate. Exit strategies: 'I'm going to grab another drink, great chatting!' or 'I should say hi to [person], but nice talking to you!' What NOT to say: Politics, religion, gossip about coworkers, anything too personal. Body language: Maintain open posture, smile, don't check phone. Silence acceptance: Brief silence (5-10 seconds) is normal. Don't panic-fill immediately."
    },
    
    tips: [
      "Low-risk options are always safe; use medium-risk when feeling more comfortable",
      "Environmental observations are universally safe across contexts",
      "Exit strategies give you graceful out if conversation just isn't flowing",
      "What NOT to say prevents common mistakes for each setting",
      "Some silences are fine - you don't need to fill every pause"
    ],
    
    pitfalls: [
      "Don't rapid-fire questions - one filler, then let conversation develop or die naturally",
      "Don't use work event fillers at family gatherings (context matters)",
      "Don't feel you must force conversation if it's clearly not working - polite exit is okay"
    ]
  }
},

{
  modified: "",
  id: "TipOfTongue",
  title: "Tip of Tongue",
  tagline: "Describe it from memory — I'll figure out what it is.",
  tags: ['remember', 'forgot', 'what is it called', 'tip of tongue', 'word', 'memory', 'describe'],
  icon: "💭",
  categories: ['Go Deep!', 'Detour'],
  headerColor: "#d4dde8",
  description: "You know the thing — you can almost see it, taste it, hear it — but you can't name it. Describe whatever fragment you remember and AI cross-references sensory details, context, and vibes to identify it. Works for food, music, films, products, scents, colors, places, fabrics, and anything else. Refine mode narrows results based on your feedback.",
  guide: {
    overview: "TipOfTongue takes fragmentary, vibes-based descriptions and identifies what you're thinking of. Pick a category (food, music, film, product, scent, color, place, fabric, or other), describe what you remember however you can, and AI cross-references sensory details, time/place context, and elimination clues to find ranked matches. Each match includes why it fits, a memory trigger to confirm it, how to verify, and where to find it. If the first round is close but not right, refine mode uses your yes/no/close feedback to dramatically narrow the search.",
    howToUse: [
      "Pick a category — or leave it on 'other' and let the AI figure it out",
      "Describe what you remember: sensory details, vibes, fragments, partial facts — anything helps",
      "Optionally add 'it's NOT this' eliminators, time/place context, or extra clues",
      "Review ranked matches — each shows confidence level, why it fits, and a memory trigger",
      "If a match is close but not quite right, use refine mode to narrow down further"
    ],
    example: {
      scenario: "You ate something incredible at a restaurant two years ago — it was a cold noodle dish, slightly sweet and nutty, with crispy things on top. Asian but you're not sure which cuisine.",
      action: "Select 'Food', describe the memory. Add context: 'ate at a trendy restaurant in Brooklyn, summer 2023'.",
      result: "Top match: Sichuan cold sesame noodles (liang mian) — confidence 75%. The nutty flavor is tahini/sesame paste, crispy things likely fried shallots or peanuts. Memory trigger: 'If the sauce was thick and clung to the noodles rather than pooling at the bottom, this is it.' How to find: Dan Dan Noodles at Xi'an Famous Foods, or recipe with 3 tbsp tahini + soy + chili oil + rice vinegar."
    },
    tips: [
      "Sensory details are more useful than facts — 'it felt creamy and had a green label' beats 'I think it was organic'",
      "The 'it's NOT this' field is powerful — eliminating wrong answers narrows the search fast",
      "Time and place context helps enormously — 'heard on the radio in 2015' or 'bought at a farmers market'",
      "If the first round gets close, use refine mode — marking matches as 'close' gives the AI the most signal"
    ]
  }
},

{
  modified: "",
  id: "MagicMouth",
  title: "Magic Mouth (M²)",
  tagline: "The art of the ask.",
  tags: ['ask', 'script', 'phone', 'negotiate', 'charm', 'request', 'refund', 'upgrade', 'fee waived', 'customer service', 'escalate', 'nuclear', 'legal', 'leverage', 'complaint'],
  icon: "🗣️",
  categories: ['Loot', 'Discourse'],
  headerColor: "#c0d8b8",
  description: "Tell it what you want — a refund, an upgrade, a free donut, a waived fee, a table at a full restaurant. AI reads the situation, finds your best angle, writes the exact script, and coaches the delivery. Charm, not fraud.",
  guide: {
    overview: "Magic Mouth is for anyone who's ever watched a friend talk their way into something and thought 'how do they do that?' Describe what you want and the situation, and AI analyzes the power dynamics, identifies your strongest angle, writes a natural-sounding script (opener, the ask, what to say if they hesitate, and a graceful exit), and coaches delivery — tone, body language, and the mistakes that kill the ask. Includes a backup angle and a pro tip most people don't know.",
    howToUse: [
      "Describe what you want — be specific about the outcome you're after",
      "Explain the situation — the more detail, the sharper the angle",
      "Optionally add who you're asking and what you've already tried",
      "Read the strategy, memorize the script, review the delivery notes",
      "Go get what you came for"
    ],
    example: {
      scenario: "You bought shoes that started peeling after one wear, but it's 2 weeks past the return window and you don't have the receipt.",
      action: "Enter what you want (a refund) and the situation details.",
      result: "AI identifies 'The Quality Angle' as your best shot — you're not returning shoes, you're reporting a defect. Gives you the exact script to use with the store manager, including what to say if they cite the return policy, and a pro tip about manufacturer warranty claims."
    },
    tips: [
      "Specific situations get much better angles than vague ones",
      "The 'Already tried' field is powerful — if you've been told no, AI adjusts the strategy",
      "Delivery notes matter as much as the words — read them carefully",
      "The backup angle is there for a reason — real conversations don't follow scripts perfectly"
    ]
  }
},

{
  modified: "",
  id: "NameThatFeeling",
  title: "Name That Feeling",
  tagline: "There's a word for that. Let's find it.",
  tags: ['emotion', 'game', 'feelings', 'quiz', 'mood', 'fun'],
  icon: "🎭",
  categories: ['Me', 'Energy'],
  headerColor: "#e0b8b8",
  description: "Describe a feeling you can't quite name — that weird mix of emotions, the thing there should be a word for. AI finds the precise word, whether it's in English, German, Japanese, or any language that nailed it.",
  guide: {
    overview: "Name That Feeling is for the emotions that live between the words you know. Describe what you're feeling in whatever messy way you can, and AI finds the precise word for it — from common English terms you forgot to obscure words from other languages that captured the exact feeling. Because sometimes knowing the name for something makes it easier to carry.",
    howToUse: [
      "Describe the feeling in your own words — messy is fine",
      "Be as specific as possible about the nuances (when it happens, what triggers it, what it's close to but not quite)",
      "Read the word, its origin, and why it fits",
      "Discover words from languages around the world that nailed feelings English missed",
      "Share the perfect word with someone who's feeling the same thing"
    ],
    example: {
      scenario: "You feel nostalgic for a time you never actually experienced — like missing the 1970s even though you were born in 1995.",
      action: "Describe that feeling as best you can.",
      result: "AI surfaces 'anemoia' — nostalgia for a time you've never known. It explains the origin, why it fits, and gives you related words like 'saudade' and 'sehnsucht' that live in the same emotional neighborhood."
    },
    tips: [
      "The weirder and more specific your description, the better the match",
      "If the first word doesn't quite fit, tell it why — it'll dig deeper",
      "Some of the best emotion words come from German, Japanese, Portuguese, and Finnish",
      "This is a surprisingly fun party game — describe a feeling and see who guesses closest"
    ]
  }
},

{
  modified: "",
  id: "WhatsMyVibe",
  title: "What's My Vibe",
  tagline: "Find out what you actually sound like.",
  tags: ['vibe', 'tone', 'personality', 'writing', 'analysis', 'text', 'fun'],
  icon: "✨",
  categories: ['Read the Room', 'Me'],
  headerColor: "#e0b8b8",
  description: "Paste your texts, emails, tweets, or messages. AI analyzes your personality and communication style — how you come across, your default tone, your verbal habits, and what people probably think when they read your messages.",
  guide: {
    overview: "What's My Vibe reads your actual writing — texts, emails, social posts, Slack messages — and tells you what you sound like to other people. Not what you intend, but how you land. It picks up on tone patterns, verbal habits, energy levels, and personality signals you probably don't notice yourself.",
    howToUse: [
      "Paste some of your writing — texts, emails, tweets, DMs, whatever feels like 'you'",
      "The more variety, the better the read (mix of casual and professional helps)",
      "Read the personality and tone analysis",
      "Share it with friends and see if they agree",
      "Try pasting writing from different contexts to see how your vibe shifts"
    ],
    example: {
      scenario: "You're curious how you come across in your work Slack messages.",
      action: "Paste a handful of recent Slack messages.",
      result: "AI reveals your communication vibe: maybe you're 'The Warm Deflector' — friendly and encouraging on the surface but rarely commit to a strong opinion. Your verbal habits include softening every statement with 'I think' and ending with questions."
    },
    tips: [
      "Paste at least a few messages for a meaningful read — one text isn't enough",
      "Mixing casual and professional writing reveals how much your vibe shifts by context",
      "The verbal habits section is often the most eye-opening part",
      "This is a fun one to do side-by-side with a friend"
    ]
  }
},

{
  modified: "",
  id: "TheRunthrough",
  title: "The Runthrough",
  tagline: "Presentation coach in your pocket.",
  tags: ['presentation', 'public speaking', 'practice', 'rehearse', 'slides', 'speech', 'qa prep'],
  icon: "🎙️",
  categories: ['Pursuits', 'The Office'],
  headerColor: "#ccdfc4",
  description: "Paste your presentation and pick a mode: Cut trims it to fit your time limit, Anticipate predicts the toughest Q&A and drafts answers, and Hook rewrites your opening, closing, and transitions to land harder.",
  guide: {
    overview: "The Runthrough is a 3-mode presentation coaching tool. Cut mode trims your content to fit a time limit while preserving the core message. Anticipate mode predicts the hardest questions your audience will ask and drafts strong answers with traps to avoid. Hook mode rewrites your opening, closing, and key transitions to grab attention and stick in memory.",
    howToUse: [
      "Paste your presentation text, speaker notes, or outline",
      "Pick a mode: Cut (trim to time), Anticipate (predict Q&A), or Hook (rewrite open/close)",
      "Set mode-specific options (time limit, audience type, or tone)",
      "Review the results — copy individual sections or the full analysis",
      "Run the same content through multiple modes for complete prep"
    ],
    example: {
      scenario: "You have a 20-minute investor pitch that runs about 35 minutes.",
      action: "Paste it in Cut mode, set the time limit to 20 minutes. Then run it through Anticipate mode with 'Investors' selected.",
      result: "Cut mode trims it to 19 minutes, telling you exactly what was removed and why. Anticipate mode surfaces 6 tough questions investors will ask, with draft answers and traps to avoid."
    },
    tips: [
      "Run all three modes on the same content for complete presentation prep",
      "Cut mode works best with full text — outlines give less accurate time estimates",
      "In Anticipate mode, adding stakes ('asking for $2M') produces sharper questions",
      "Hook mode's energy arc note is great for rehearsing your delivery pace"
    ]
  }
},

{
  modified: "",
  id: "ContrastReport",
  title: "The Contrast Report",
  tagline: "Feel both futures before you choose.",
  tags: ['decision', 'compare', 'two paths', 'choose', 'future', 'alternative', 'scenario', 'narrative', 'day in the life', 'gut feeling', 'life choice', 'career', 'simulation', 'vivid'],
  icon: "🔮",
  categories: ['Veer'],
  headerColor: "#f5e0c0",
  description: "Describe two paths you're considering. Instead of a pro/con list, AI writes a vivid 'day in the life' narrative for each path — a plausible Tuesday, set in your future. Your gut reacts before your brain does.",
  guide: {
    overview: "The Contrast Report replaces pro/con lists with emotional simulation. Describe two life paths you're weighing — stay vs. leave, job A vs. job B, city vs. suburbs — and AI writes a vivid, specific 'day in the life' for each future. Not fairy tales or horror stories. Plausible Tuesdays, with sensory detail, mundane moments, honest costs, and the small satisfactions that make a life. Finishes with what the AI noticed: which path carried more energy, what you'd be trading, and the real question underneath.",
    howToUse: [
      "Describe Path A — the first option you're considering",
      "Describe Path B — the alternative",
      "Optionally share something about yourself for more personal narratives",
      "Choose a timeframe (1, 2, 5, or 10 years out)",
      "Read both narratives and notice which one your body reacts to"
    ],
    example: {
      scenario: "You're deciding whether to stay at your stable corporate job or quit to start your own business.",
      action: "Enter both paths, add that you're 31 and love building things but value financial security, and set to 2 years.",
      result: "Two vivid day-in-the-life narratives: one where you're two years into the corporate track, one where you're two years into the startup. Each includes a moment of genuine satisfaction and an honest cost. The 'what I noticed' section surfaces what you'd grieve either way."
    },
    tips: [
      "The more context you give about yourself, the more personal and specific the narratives get",
      "Pay attention to which narrative you read first, which you re-read, and which makes you feel something — that's data",
      "Try different timeframes on the same decision — 1 year and 10 years tell very different stories",
      "This isn't advice. It's a simulation. Your reaction to the narratives IS the answer."
    ]
  }
},

{
  modified: "",
  id: "ComebackCooker",
  title: "Comeback Cooker",
  tagline: "The perfect response you thought of 3 hours too late.",
  tags: ['comeback', 'response', 'argument', 'regret', 'witty', 'what to say', 'rehearse', 'roast', 'cathartic', 'insult', 'bully', 'revenge', 'conflict', 'clap back', 'petty'],
  icon: "🍳",
  categories: ['Discourse', 'Humans'],
  headerColor: "#e0b8b8",
  description: "Describe the moment that's been living rent-free in your head. AI generates the perfect comebacks you wish you'd said — from surgical precision to unbothered royalty. Purely cathartic. No intent to send.",
  guide: {
    overview: "Comeback Cooker is for that moment playing on loop in your brain — the thing someone said, and the devastating response you only thought of hours later. Describe the situation, pick a mood (surgical, witty, petty, or dignified), and get 5 comebacks using different techniques, plus a high road option and a nuclear option kept safely in the fantasy drawer. Each comeback comes with delivery notes so you can rehearse the fantasy properly.",
    howToUse: [
      "Describe what happened — the more specific, the better the comebacks",
      "Optionally include exactly what they said (exact words help a lot)",
      "Pick your comeback mood: Surgical, Witty, Petty, or Dignified",
      "Read the 5 comebacks — tap each for delivery notes",
      "Check the high road option and dare to reveal the nuclear option"
    ],
    example: {
      scenario: "Your coworker took credit for your idea in a meeting, saying 'I was actually the one who suggested that approach.'",
      action: "Describe the situation, quote what they said, select 'Surgical' mood.",
      result: "Five precision comebacks using different techniques — deadpan, reframe, rhetorical question — each with delivery notes. Plus a devastating high road response and a nuclear option labeled 'fantasy drawer only.'"
    },
    tips: [
      "Exact quotes from the other person produce much sharper comebacks",
      "Try the same situation with different moods — Surgical and Petty hit very differently",
      "The delivery notes matter as much as the words themselves",
      "The high road option often hits harder than any clever insult"
    ]
  }
},

{
  modified: "",
  id: "AlternatePath",
  title: "Alternate Path",
  tagline: "What if history went differently?",
  tags: ['history', 'what if', 'alternate timeline', 'counterfactual', 'historical', 'thought experiment'],
  icon: "🌀",
  categories: ['What If?', 'Veer'],
  headerColor: "#b8dcd8",
  description: "Pick any moment in history and change one detail. Watch the consequences cascade — politics, technology, culture, daily life — all the way to today.",
  guide: {
    overview: "Alternate Path takes a real historical event, changes one key detail, and traces the ripple effects forward through a plausible alternate timeline. Each consequence cascades into the next, showing how one pivot point can reshape politics, culture, technology, and daily life in ways you wouldn't expect.",
    howToUse: [
      "Name a historical event or moment",
      "Describe what you'd change about it",
      "Read the alternate timeline as consequences cascade forward",
      "Share your favorite 'what if' with friends",
      "Try changing different details of the same event for wildly different outcomes"
    ],
    example: {
      scenario: "You're curious what would have happened if the internet was never invented.",
      action: "Enter 'What if the internet was never invented?'",
      result: "AI traces cascading consequences — how communication, commerce, entertainment, politics, and daily life would look today without it, with each consequence logically building on the last."
    },
    tips: [
      "Specific pivots produce richer timelines — 'What if Napoleon won at Waterloo' beats 'What if France was different'",
      "Try small changes for surprising big consequences",
      "Modern events work too — not just ancient history",
      "The fun is in the unexpected second- and third-order effects"
    ]
  }
},

{
  modified: "",
  id: "ArgumentSimulator",
  title: "Argument Simulator",
  tagline: "Drop a hot take. AI argues both sides.",
  tags: ['debate', 'argue', 'opinion', 'hot take', 'perspective', 'steelman', 'both sides', 'rhetoric', 'critical thinking', 'devil\'s advocate', 'dinner party', 'fun', 'persuasion'],
  icon: "⚔️",
  categories: ['Diversions', 'What If?'],
  headerColor: "#b8dcd8",
  description: "Give any opinion and watch AI steelman the strongest possible case FOR and AGAINST it. Three intensity levels from civil debate to full rhetorical firepower. Includes a judge's verdict and a ready-made dinner party take.",
  guide: {
    overview: "Argument Simulator takes any opinion or hot take and constructs the most compelling steelmanned arguments for both sides. Choose your intensity — civil Oxford-style, heated dinner debate, or fully unhinged — and watch both cases get built with killer points, real evidence, and the uncomfortable truths each side doesn't want to admit. Finishes with a judge's verdict and a nuanced dinner party take you can steal.",
    howToUse: [
      "Type any opinion, hot take, or debatable statement",
      "Pick an intensity level: Civil, Heated, or Unhinged",
      "Hit 'Start the Argument' and read both sides",
      "Expand each side for killer points, evidence, and uncomfortable truths",
      "Reveal the judge's verdict and steal the dinner party take"
    ],
    example: {
      scenario: "You're at dinner and someone says remote work is obviously better than office work.",
      action: "Type 'Remote work is better than office work' and select Heated intensity.",
      result: "AI builds a passionate case for each side with specific evidence, surfaces the uncomfortable truth both sides dodge, and gives you a nuanced take to drop at dessert."
    },
    tips: [
      "Specific takes produce better arguments than vague ones — 'Cats are better than dogs' beats 'Pets are good'",
      "Try the same topic at different intensities for completely different arguments",
      "Use the random topic button when you just want to be entertained",
      "The dinner party take is great for when you actually need to sound smart about the topic"
    ]
  }
},

{
  modified: "",
  id: "PlotHole",
  title: "Plot Hole",
  tagline: "Find where the logic breaks in any movie, show, book, or game",
  tags: ['plot', 'hole', 'movie', 'show', 'logic', 'mistake', 'continuity', 'film', 'fun'],
  icon: "🕳️",
  categories: ['Diversions', 'Detour'],
  headerColor: "#b8dcd8",
  description: "Name any movie, show, book, or game — AI finds the logical inconsistencies, timeline problems, 'why didn't they just...' moments, and character decisions that make no sense. Each hole is rated by severity (Nitpick to Universe-Breaking) with a fan defense and a Reddit-style one-liner. Swiss Cheese Rating scores overall plot integrity. Two modes: Find Holes (full analysis) and Defend a Hole (build the strongest possible defense of a specific plot hole, courtroom-style).",
  guide: {
    overview: "PlotHole is a narrative logic analyst that finds exactly where stories break. Not vague complaints — specific scenes, character knowledge problems, and 'wait actually...' moments, each rated by how badly they damage the story.",
    howToUse: [
      "Pick media type (Movie, TV Show, Book, Game) and enter the title",
      "Optionally add context like a specific season or scene",
      "Hit 'Find Plot Holes' to get a full analysis with Swiss Cheese Rating",
      "Click 'Defend this hole' on any result to switch to courtroom-style defense mode",
      "In Defend mode, describe any plot hole and get the strongest possible counter-arguments"
    ],
    example: {
      scenario: "You enter 'The Dark Knight' as a movie.",
      action: "Hit Find Plot Holes.",
      result: "Swiss Cheese Rating: 4/10. Holes include 'The Hospital Escape' (how did the Joker wire an entire hospital with explosives without anyone noticing — MAJOR), 'The Bus Getaway' (a school bus merges into traffic from a bank wall and nobody reports it — MINOR), and the ferry dilemma timing. Each comes with fan defenses and Reddit one-liners."
    },
    tips: [
      "The 'Defend a Hole' mode is great for settling arguments with friends",
      "Try it on movies you love — the 'Actually Clever' section highlights what the story does RIGHT",
      "The Reddit one-liners are designed to be shareable"
    ]
  }
},

{
  modified: "",
  id: "FanTheory",
  title: "Fan Theory",
  tagline: "Wild but defensible fan theories about anything",
  tags: ['theory', 'fan', 'conspiracy', 'movie', 'show', 'plot', 'twist', 'evidence', 'fun'],
  icon: "🧵",
  categories: ['What If?', 'Detour'],
  headerColor: "#b8dcd8",
  description: "Name any movie, show, book, or game — AI generates a wild but internally-consistent fan theory with cited evidence. Six theory directions: Surprise Me, Secret Villain, Shared Universe, Timeline Twist, Dead or Alive, and It's a Simulation. Each theory comes with evidence rated from Compelling to Pure Delusion, a Smoking Gun, counterarguments, and plausibility/mind-blown ratings. Second mode: Grade My Theory — paste your own fan theory and get an academic grade with strengths, weaknesses, and a Reddit performance prediction.",
  guide: {
    overview: "FanTheory generates conspiracy theories for fiction — the kind that make you go 'wait... actually?' Every theory cites specific plot details as evidence and is internally consistent, even when it's a stretch.",
    howToUse: [
      "Enter a title and pick a theory direction (or let it surprise you)",
      "Hit 'Generate Theory' to get a full theory with evidence and ratings",
      "Switch to 'Grade My Theory' to submit your own theory for academic grading",
      "The Smoking Gun is the single strongest piece of evidence — the one that makes people pause"
    ],
    example: {
      scenario: "Title: 'Toy Story'. Direction: Secret Villain.",
      action: "Hit Generate Theory.",
      result: "Theory: Andy's Mom is actually the true villain — she systematically downsizes the toys' living space across all four films, moving them from a house to smaller and smaller rooms. Evidence: she sells the house (Toy Story 3), repeatedly threatens yard sales, and never once acknowledges the toys' sentience despite clearly seeing them move. Plausibility: 3/10. Mind-blown: 7/10."
    },
    tips: [
      "Hit 'Different Theory' to get a completely different angle on the same title",
      "The Grade mode gives honest ratings — most theories are 2-4 plausibility and that's fine",
      "Try grading famous fan theories to see how they hold up"
    ]
  }
},

{
  modified: "",
  id: "RoastMe",
  title: "Roast Me",
  tagline: "Paste anything — get a personalized comedy roast",
  tags: ['roast', 'funny', 'comedy', 'humor', 'joke', 'resume', 'dating', 'linkedin', 'burn', 'fun'],
  icon: "🔥",
  categories: ['Out & About', 'Detour'],
  headerColor: "#ccdfc4",
  description: "Paste your resume, dating profile, LinkedIn bio, email, tweet, or any text and get a personalized comedy roast. Three heat levels: Gentle, Medium, and Scorched Earth. Every roast line targets SPECIFIC content you submitted — zero generic insults. AI detects content type automatically and targets the right things: buzzwords in resumes, clichés in dating profiles, humblebrags on LinkedIn. Includes a 'One Nice Thing' plus a screenshot-worthy 'Share Line' for maximum social media damage.",
  guide: {
    overview: "RoastMe is a comedy writer that reads your content and finds what's specifically, uniquely roastable about it. Not generic insults — targeted humor that lands because it's true.",
    howToUse: [
      "Select what you're submitting (resume, dating profile, LinkedIn, email, social media, or other)",
      "Paste your content into the text box",
      "Choose your heat level: Gentle, Medium, or Scorched",
      "Hit 'Roast Me' and brace yourself",
      "Copy the 'Share Line' to send to friends"
    ],
    example: {
      scenario: "You paste your LinkedIn headline: 'Passionate thought leader | Synergy enthusiast | Making the world better one meeting at a time'",
      action: "Set content type to LinkedIn, heat level to Medium, hit Roast Me.",
      result: "Roast lines target 'passionate thought leader' (everyone who calls themselves a thought leader has never had an original thought), 'synergy enthusiast' (this is the saddest hobby since stamp collecting), and 'making the world better one meeting at a time' (meetings have never made anything better)."
    },
    tips: [
      "Scorched Earth is funniest on content that takes itself too seriously",
      "Try roasting the same content at different heat levels",
      "Hit 'Roast Again' to get completely different lines on the same content"
    ]
  }
},

{
  modified: "",
  id: "TimeWarp",
  title: "Time Warp",
  tagline: "Collide anything modern with any historical period",
  tags: ['history', 'time', 'historical', 'modern', 'funny', 'ancient', 'medieval', 'comedy', 'fun'],
  icon: "⏰",
  categories: ['What If?', 'Detour', 'Diversions'],
  headerColor: "#b8dcd8",
  description: "Pick any modern concept and any historical period — AI generates the collision. Six formats: Explain It, Review, News Report, Letter, Debate, and Ad. Every piece is historically accurate AND funny — includes real historical footnotes so you learn something while laughing.",
  guide: {
    overview: "Time Warp creates collisions between the modern and historical that are both genuinely funny and surprisingly educational. The AI knows enough real history to make the comedy specific.",
    howToUse: [
      "Pick a modern thing and a historical period, or use a Quick Combo",
      "Choose your format: Explain It, Review, News Report, Letter, Debate, or Ad",
      "Hit 'Warp It' and travel through time",
      "Check the 'Actually True' footnotes — you'll learn real history"
    ],
    example: {
      scenario: "Modern thing: Uber. Historical period: 1920s New York. Format: News Report.",
      action: "Hit Warp It.",
      result: "A period-authentic 1920s newspaper article about mysterious horseless carriages summoned by pocket devices, with quotes from concerned taxi medallion holders and footnotes explaining real 1930s taxi regulation history."
    },
    tips: [
      "The more specific your modern thing, the funnier the result",
      "Try the same combo in different formats",
      "The 'Flip It' suggestion teases the reverse collision"
    ]
  }
},

{
  modified: "",
  id: "WrongAnswersOnly",
  title: "Wrong Answers Only",
  tagline: "Ask anything — get a confidently, beautifully wrong answer",
  tags: ['wrong', 'funny', 'trivia', 'quiz', 'comedy', 'fake', 'humor', 'absurd', 'fun'],
  icon: "🙃",
  categories: ['What If?', 'Detour'],
  headerColor: "#b8dcd8",
  description: "Ask any real question and get a beautifully structured, internally consistent, completely incorrect answer with full expert confidence. Fake studies, invented researchers, nonsense equations that look real. Three seriousness levels: Deadpan, Playful, Unhinged. Includes real answer toggle for when you want to actually learn something.",
  guide: {
    overview: "Wrong Answers Only is the world's most confidently incorrect expert. Every answer is internally consistent, impressively structured, and completely, beautifully wrong.",
    howToUse: [
      "Type any real question or pick from Quick Questions",
      "Choose a category and seriousness level",
      "Hit 'Wrong Answers Only'",
      "Toggle 'Show Real Answer' when you want the actual truth"
    ],
    example: {
      scenario: "Question: 'Why is the sky blue?' Category: Science. Seriousness: Playful.",
      action: "Hit Wrong Answers Only.",
      result: "Confident answer about 'chromatic resonance particles' from ocean evaporation, fake Nature paper citation, and the 'common misconception' section dismissing Rayleigh scattering as amateur physics."
    },
    tips: [
      "Simple, well-known questions get the funniest wrong answers",
      "Deadpan mode fools friends who won't realize it's wrong at first",
      "Try the same question in different categories for wildly different answers"
    ]
  }
},

{
  modified: "",
  id: "SocialEnergyAudit",
  title: "Social Energy Audit",
  tagline: "See where your energy actually goes — and restructure your week around it",
  tags: ['energy', 'social', 'tired', 'drained', 'exhausted', 'introvert', 'recharge', 'burnout', 'schedule', 'interactions'],
  icon: "⚡",
  categories: ['Humans', 'Energy'],
  headerColor: "#e0b8b8",
  description: "Log social and professional interactions with before/after energy ratings and performance levels (how much you had to be 'on'). Six modes: Weekly Audit, Week Planner, Quick Check, Daily Check-In (30-second energy snapshot), Energy Forecast, and Energy Journal. Save your typical week as a template for faster logging",
  guide: {
    overview: "Everyone has a limited energy budget. Some interactions cost more than others — and the expensive ones aren't always obvious. A 30-minute call where you're fully 'on' can drain more than a 3-hour dinner where you're relaxed. Social Energy Audit makes the invisible visible: log your interactions, rate your performance level and energy before/after, and the tool finds the patterns, calculates the costs, and helps you restructure your week so you're not running on empty by Thursday.",
    howToUse: [
      "Start with the Log tab — add your week's interactions using quick presets or custom entries",
      "For each interaction: name it, set the category, choose duration, then rate Performance (1=natural, 10=full 'on' mode), Energy Before, and Energy After",
      "Run the audit to see your energy score, top drains, rechargers, patterns, and restructuring suggestions",
      "Use Quick Check ('Should I Say Yes?') before committing to new things — get an instant energy-aware verdict",
      "Do a 30-second Daily Check-In to track energy over time — this feeds the Forecast and Ideal Week features",
      "After 3+ weeks in the Journal, unlock your AI-designed Ideal Week with personal energy rules and your Golden Rule"
    ],
    example: {
      scenario: "It's Wednesday and you're exhausted but can't figure out why — your week doesn't seem that busy.",
      action: "Log Monday's team standup (perf 6, energy 7→5), Tuesday's client presentation (perf 9, energy 6→2), Tuesday evening networking event (perf 8, energy 3→1), and Wednesday's manager 1-on-1 (perf 7, energy 4→2). Run the audit.",
      result: "The audit reveals: your Tuesday was a 'double high-performance day' — the presentation + networking cost you 8 energy points total because both required perf 8+. The pattern insight: 'Never stack two high-performance interactions on the same day. Your client presentation alone would leave you at 2/10 — the networking event pushed you into deficit.' Restructure suggestion: 'Move the networking event to Thursday, or attend for 30 minutes instead of 2 hours when it follows a presentation day.'"
    },
    tips: [
      "Performance level is the secret weapon — a relaxed dinner with close friends (perf 2) costs way less than a work lunch with executives (perf 8) even at the same duration",
      "Save your typical week as a template — then each week you just adjust energy ratings instead of re-entering everything",
      "The Quick Check mode is great for in-the-moment decisions: 'Friend invited me to dinner but I'm at 3/10 energy'",
      "Daily Check-Ins take 30 seconds but unlock powerful features: energy forecasts and your personal Ideal Week",
      "After 3+ weeks in the Journal, the Ideal Week feature designs an optimized schedule based on YOUR actual data",
      "Compare two weeks side-by-side to see what made a good week good and a bad week bad",
      "The Recurring Pattern Tracker automatically finds situations that consistently drain or recharge you across weeks"
    ]
  }
},
{
  modified: "2026-03-24",
  id: "PronounceItRight",
  title: "Pronounce It Right",
  tagline: "Names, food, places, brands — never mispronounce anything again",
  tags: [
    'pronounce', 'pronunciation', 'how to say', 'mispronounce', 'phonetics',
    'ipa', 'name', 'food', 'restaurant', 'menu', 'brand', 'foreign', 'word',
    'travel', 'place', 'language', 'accent', 'batch', 'syllables', 'stress'
  ],
  icon: "🗣️",
  categories: ['Discourse'],
  headerColor: "#9a4040",
  description: "Type any word — a name, dish, brand, place, or phrase — and get a pronunciation guide calibrated to your native language. Covers phonetic spelling, syllable stress, mouth-position tips, common mistakes with fixes, and a confidence script for uncertain moments. Batch mode handles up to 10 words at once.",
  guide: {
    overview: "Pronounce It Right maps unfamiliar words to sounds you already know in your native language. The guidance changes depending on whether you speak English, Spanish, Mandarin, or Arabic — because the tricky parts are different for each speaker.",
    howToUse: [
      "Pick a category: Name, Food/Drink, Place, Brand, Music/Art, Science, Phrase, or Other.",
      "Type the word and select your native language — this calibrates the phonetic guide to your ear.",
      "Add optional context (e.g. 'ordering at a French restaurant', 'coworker's name') for tailored tips.",
      "Review the guide: phonetic spelling, syllable breakdown, common mistakes, and a confidence script.",
      "Use Batch mode to look up 2–10 words at once — great for travel prep or restaurant menus.",
      "Tap any word in your history to re-look it up instantly."
    ],
    example: {
      scenario: "You're going to an Italian restaurant and want to order without second-guessing yourself.",
      action: "Switch to Batch mode, select Food/Drink, enter: Gnocchi, Bruschetta, Prosciutto, Chianti.",
      result: "Four pronunciation cards with phonetic spelling, the #1 mistake for each word, and the sounds that trip up English speakers specifically."
    },
    tips: [
      "Your native language selection matters — a Spanish speaker needs different guidance than a Korean speaker for the same word.",
      "Category selection gives the AI the right context: etiquette tips for names, ordering confidence for food.",
      "The confidence script gives you a natural thing to say when you're still unsure — better than guessing silently.",
      "IPA notation is hidden by default but available if you read it — tap 'Show IPA' in the result."
    ]
  }
},
{
  modified: "",
  id: "TheDebrief",
  title: "The Debrief",
  tagline: "Paste a meeting transcript — get decisions, actions, and follow-ups",
  tags: ['meeting', 'transcript', 'notes', 'minutes', 'action items', 'decisions', 'follow up', 'standup', 'recap'],
  icon: "📋",
  categories: ['The Office', 'Do It!'],
  headerColor: "#d4dde8",
  description: "Paste any meeting transcript and get decisions, action items with owners and deadlines, follow-up drafts, and cross-meeting pattern analysis — without digging through the notes yourself.",
  guide: {
    overview: "The Debrief is Recall's professional sibling — same core mechanic (long transcript → extract what matters), but purpose-built for meetings instead of lectures. Where lectures need concepts and testable material, meetings need decisions, owners, deadlines, and accountability. The tool distinguishes between 'someone said we should' (not a decision) and 'we agreed to' (a decision), flags action items with no owner or deadline, detects tensions, and grades meeting health. Series mode is the killer feature — paste your last 3 weekly standups and see which action items disappeared without resolution.",
    howToUse: [
      "Pick a mode: Distill (decisions & actions), Follow Up (draft messages), or Series (cross-meeting patterns)",
      "Paste your transcript — from Zoom captions, Teams, Otter.ai, Google Meet, or typed notes",
      "Select meeting type for better extraction (standup vs. planning vs. client meetings need different outputs)",
      "Optionally add attendee names and context",
      "Review results — Distill gives you the full meeting output, Follow Up gives you ready-to-send messages"
    ],
    example: {
      scenario: "Your team just finished a 45-minute sprint planning meeting. Three decisions were made, several tasks assigned, and one disagreement was tabled for later.",
      action: "Paste the Zoom transcript, select 'Planning', add attendee names.",
      result: "Distill produces: 3 decisions (with who drove each), 7 action items (2 flagged as UNASSIGNED — nobody actually took ownership), 2 open questions (one deferred because the PM was absent), detected tension between engineering and design on the timeline, and a meeting health score of 65% efficiency. The ready-to-send follow-up email lists all action items with owners and deadlines."
    },
    tips: [
      "Meeting type matters — a standup extraction focuses on blockers while a planning extraction focuses on ownership and timelines",
      "UNASSIGNED action items are flagged in red — these are the ones that fall through the cracks if you don't fix them",
      "The 'Tensions Detected' section is diplomatically worded but honest — use it to address things that got swept under the rug",
      "Follow Up mode's 'Boss Update' is a 3-5 sentence upward summary — perfect for keeping your manager in the loop without forwarding the full transcript",
      "Series mode catches the real meeting anti-patterns: topics that keep resurfacing, action items that 'disappeared', and decisions that get revisited",
      "Individual nudges include urgency ratings and recommended channel (email vs. Slack vs. text) — send the urgent ones immediately"
    ]
  }
},

{
  modified: "",
  id: "Recall",
  title: "Recall",
  tagline: "Paste a lecture transcript — get the signal without the noise",
  tags: ['memory', 'remember', 'study', 'review', 'retention', 'lecture', 'transcript', 'notes', 'exam', 'flashcards', 'class'],
  icon: "🧠",
  categories: ['Go Deep!'],
  headerColor: "#d4dde8",
  description: "Paste a lecture transcript from Zoom, Teams, Otter.ai, or your own notes and get the 20% that matters. Four modes: Distill, Study Guide, Test Prep and Connect.", 
    guide: {
    overview: "Recall solves the core lecture problem: 90 minutes of content where maybe 15 minutes is testable. Professors repeat the important stuff, signal it with emphasis phrases, and bury it in tangents and anecdotes. Recall detects those signals and extracts the material you'd highlight if you had perfect attention for the whole session. Four modes cover different study needs — from quick-reference bullets to full practice exams.",
    howToUse: [
      "Pick a mode: Distill (bullet points), Study Guide (structured review), Test Prep (practice questions), or Connect (cross-lecture themes)",
      "Paste your transcript — from Zoom captions, Otter.ai, Google Meet, or your own typed notes",
      "Optionally add subject and lecture topic for better context",
      "Set mode-specific options: bullet count, priority type, exam format, question types, difficulty",
      "Review results — each mode produces different output optimized for its study use case"
    ],
    example: {
      scenario: "You have a 45-minute Biology lecture transcript on mitosis and meiosis from Zoom auto-captions. Midterm is next week.",
      action: "Paste transcript, enter 'Biology 101' as subject and 'Mitosis & Meiosis' as topic. Start with Distill (10 bullets, balanced priority) for a quick overview, then switch to Test Prep (10 questions, multiple choice + short answer, mixed difficulty) to practice.",
      result: "Distill produces 10 ranked points — #1 is the key difference between mitosis and meiosis (tagged as 'comparison, testable'), with professor signals flagging that the professor said 'make sure you know this' about chromosome pairing. Test Prep generates 10 questions including a tricky MC question where two answers sound similar but differ on haploid vs diploid, with a full explanation of why the wrong answers are wrong."
    },
    tips: [
      "Auto-captions are fine — Recall handles imperfect transcription (typos, missed words) well",
      "The 'Professor Signals' section catches phrases like 'this will be on the test', 'make sure you understand', or concepts repeated 3+ times",
      "Distill bullet types (definition, process, cause/effect, etc.) tell you HOW to study each point",
      "Test Prep's 'why wrong' explanations for multiple choice are often more educational than the right answer",
      "Connect mode is powerful before cumulative exams — paste 3-5 lecture transcripts and it finds the themes that span all of them",
      "Study Guide mnemonics won't always be clever, but they're personalized to the actual content"
    ]
  }
},

{
  modified: "",
  id: "TheAlibi",
  title: "The Alibi",
  tagline: "Frame your real story for any audience — honest but strategic",
  tags: ['resume gap', 'career pivot', 'fired', 'explain', 'story', 'interview', 'framing', 'narrative'],
  icon: "🎭",
  categories: ['Pursuits', 'Read the Room'],
  headerColor: "#ccdfc4",
  description: "Tell the real story — messy, complicated, unflattering — and get 2-3 strategically framed versions tailored to your audience, each with an exact script, follow-up prep, trap warnings, and a nuclear option if it goes sideways. Truthful framing, not fiction.",
  guide: {
    overview: "The Alibi takes your real, messy, complicated story and helps you tell it honestly but strategically to a specific audience. The same resume gap told to an interviewer emphasizes growth; told to a date, it emphasizes life experience; told to a lender, it emphasizes current stability. You get multiple versions with different strategic approaches — not just different tones — plus follow-up prep so your story holds up under gentle probing.",
    howToUse: [
      "Write out the real story — be as honest and detailed as possible (this stays between you and the tool)",
      "Select who you're telling: job interviewer, landlord, date, in-laws, lender, coworker, or custom audience",
      "Pick your preferred tone: professional, casual, warm, or confident",
      "Add what you're worried they'll think and any extra context about the situation",
      "Review 2-3 strategically different versions, each with scripts, risks, and best-use scenarios"
    ],
    example: {
      scenario: "You left your last job after only 4 months. The company was chaotic, management was toxic, and they misrepresented the role. You're now interviewing for a senior position at a competitor.",
      action: "Enter the full story, select 'Job Interviewer', set tone to 'Professional', add concern 'They'll think I'm a job hopper' and context 'Applying for senior role at competitor'.",
      result: "Three versions: 'The Growth Story' (emphasizes what you learned about what you need in a workplace), 'The Standards Story' (frames it as knowing your worth and not settling), and 'Own It' (brief and confident, redirects to what you bring). Each includes a ready-to-use script, follow-up prep for 'Why so short?' and 'Were you fired?', delivery tips, and a redirect line if things get uncomfortable."
    },
    tips: [
      "The messier and more honest your input, the better the framing — don't self-censor",
      "Each version has a genuinely different strategic approach, not just different words for the same thing",
      "Follow-up prep includes 'trap to avoid' warnings — things that sound natural but hurt your case",
      "Body language tips are tailored to your specific situation and audience, not generic advice",
      "Try the same story with different audiences to see how framing shifts — it's eye-opening"
    ]
  }
},

{
  modified: "",
  id: "NoiseCanceler",
  title: "Noise Canceler",
  tagline: "Paste any long document — we'll extract only what affects you",
  tags: ['document', 'filter', 'insurance', 'hoa', 'lease', 'policy', 'relevant', 'eob', 'benefits', 'newsletter'],
  icon: "🔇",
  categories: ['The Office'],
  headerColor: "#d4dde8",
  description: "Insurance EOBs, HOA notices, school newsletters, corporate policy updates, lease amendments, benefits packets — you receive them, you skim them, you miss the one thing that mattered. Paste the full document and describe your situation ('renter, no kids, have a dog'), and Noise Canceler extracts ONLY what requires your action, costs you money, saves you money, or affects you personally. Not a summarizer — a personalized relevance filter.",
  guide: {
    overview: "Noise Canceler solves a specific problem: dense documents where 90% doesn't apply to you but the 10% that does is buried. It's not a summarizer (you don't need a shorter version of irrelevant info) and it's not a jargon translator. It's a relevance engine that cross-references the document against YOUR specific situation and pulls out only what matters.",
    howToUse: [
      "Paste the full text of the document you received",
      "Select the document type (insurance, HOA, lease, policy update, etc.)",
      "Describe your situation — the more specific, the better the filtering ('renter, no kids, have a dog, work from home')",
      "Optionally add specific concerns ('Did they raise the rent?' or 'Am I covered for this?')",
      "Review action items, cost changes, savings opportunities, and what you can safely ignore"
    ],
    example: {
      scenario: "You received an 8-page HOA update email. You're a renter with no kids and a dog. You normally just delete these.",
      action: "Paste the full text, select 'HOA/Condo Notice', enter 'Renter, no kids, have a dog, work from home, park in lot B'.",
      result: "Noise Canceler finds: 1 action required (new pet registration form due by March 15 — $50 fine if missed), 1 cost item (parking lot B rates increasing $25/month starting April), 1 item to safely ignore (new playground hours — no kids). Flags a buried clause about package delivery changes that affects work-from-home residents. Notes that 6 of 8 pages are about owner-only assessments that don't affect renters at all."
    },
    tips: [
      "More situation detail = better filtering. 'Single, 28, basic health plan' filters differently than just 'employee'",
      "Action Required items show deadlines and consequences — these are the ones people miss and regret",
      "'Buried but Important' specifically calls out things hidden in fine print or dense paragraphs",
      "The 'Safely Ignore' section is genuinely useful — it gives you permission to stop reading",
      "'Consult Professional' flags appear when the tool spots something that needs expert review, not just AI analysis"
    ]
  }
},

{
  modified: "",
  id: "ContextCollapse",
  title: "Context Collapse",
  tagline: "See how different people will read the same message — before you send it",
  tags: ['message', 'audience', 'post', 'social media', 'group chat', 'interpret', 'misread', 'tone', 'send', 'communication', 'misunderstanding', 'context', 'email', 'slack', 'public', 'preview', 'perception'],
  icon: "📢",
  categories: ['Read the Room'],
  headerColor: "#e0b8b8",
  description: "About to send a text, post something, or make an announcement that multiple people will see? Context Collapse previews how each audience interprets it. Your boss reads it as professional boundary-setting. Your coworker reads it as passive-aggressive. Your mom reads it as a cry for help. See the gaps between your intent and each audience's reading, get risk ratings per audience, and rewrite suggestions that thread the needle. The tool that prevents the social media post that gets you fired and the group chat message that starts a war.",
  guide: {
    overview: "Context Collapse is named after the communication phenomenon where a single message lands completely differently depending on who reads it. It's DecoderRing in reverse — instead of decoding what someone sent you, it previews how your message will be received by each audience before you send it. You define who will see it, and the tool shows you the emotional interpretation, risk level, key triggers, and likely reactions for each person or group.",
    howToUse: [
      "Paste the message you're about to send or post",
      "Select the platform (text, email, group chat, social media, Slack, public post)",
      "Add 2-6 audiences who will see this — with their relationship and any relevant context",
      "Describe what you're TRYING to communicate",
      "Review per-audience readings, risk levels, the intent-vs-reality gap, and rewrite suggestions"
    ],
    example: {
      scenario: "You're posting in a group chat with coworkers and your manager: 'Just FYI, I've been handling the client reports solo for the past three weeks. Happy to keep going but wanted to flag it.'",
      action: "Paste the message, select 'Group Chat', add audiences: 'My manager (she assigned the reports)', 'Jake (was supposed to help, didn't)', 'Rest of team (not involved)'. Intent: 'Get Jake to help without creating drama'.",
      result: "Manager reads it as a professional heads-up with subtle accountability signal — safe. Jake reads it as public shaming — risky, he'll get defensive. Rest of team reads it as you positioning for credit — mild risk of seeming political. Biggest risk: Jake feels ambushed. Rewrite suggestions include a version that achieves the same goal via DM to manager instead, and a softer group version that doesn't name the duration."
    },
    tips: [
      "Add relationship context for each audience — 'My boss (we had a disagreement last week)' changes the reading dramatically",
      "The 'Key Trigger' field shows the exact word or phrase driving each audience's interpretation",
      "Rewrite suggestions preserve your voice while fixing the gaps — they don't make you sound corporate",
      "Platform notes flag things like screenshot risk, forwarding risk, and social media permanence",
      "Use this before any announcement that goes to mixed audiences — it prevents 90% of 'that came out wrong' moments"
    ]
  }
},

{
  modified: "",
  id: "Bookmark",
  title: "Bookmark",
  tagline: "Pick up where you left off — without spoilers",
  tags: ['show', 'book', 'game', 'sports', 'recap', 'spoiler', 'abandoned', 'catch up', 'catch-up', 'tv', 'season', 'remember', 'forgotten', 'series', 'chapter', 'binge', 'rewatch', 'pick up', 'return', 'summary', 'plot', 'characters', 'episode', 'where was i'],
  icon: "🔖",
  categories: ['Pursuits', 'Detour'],
  headerColor: "#ccdfc4",
  description: "Abandoned a show, book, game, or sports season? Get a spoiler-free recap calibrated to exactly where you stopped — character refreshers, active plot threads, vibe checks, and must-watch game flags.",
  guide: {
    overview: "Bookmark solves the problem Google can't: getting caught up on something you abandoned without stumbling into spoilers. Wikis, Reddit threads, and search results are landmines. Bookmark gives you a precision recap — vivid enough to trigger your memory, careful enough to protect everything after your stopping point. Four modes cover TV shows, books, video games, and sports seasons.",
    howToUse: [
      "Pick your media type: Show, Book, Game, or Sports",
      "Enter the title and exactly where you stopped (episode, chapter, story point, or date)",
      "Add what you remember — even vague recollections help calibrate the recap",
      "Set your spoiler level: Strict (nothing after your point), Moderate (vague hints okay), or Open",
      "Ask specific questions if something's nagging you ('Who was the guy with the scar?')"
    ],
    example: {
      scenario: "You stopped watching Succession after Season 2, Episode 7. You remember something about a shareholder meeting and Kendall trying to take over, but the details are fuzzy. Your friends keep referencing it and you want to catch up without restarting.",
      action: "Select Show, enter 'Succession' and 'Season 2, Episode 7', add what you remember, set spoiler level to Strict.",
      result: "Bookmark delivers a present-tense recap of the power struggle up to that point, a character-by-character refresher (who's allied with whom, what each person wants), active plot threads with their unresolved tensions, the exact last major scene to trigger your memory, and an honest 'worth continuing?' take. Zero information from after S2E7."
    },
    tips: [
      "The 'What do you remember?' field dramatically improves accuracy — even wrong memories help calibrate",
      "Sports mode's must-watch games with '🔒 Watch blind' tags let you catch up on storylines while preserving big moments",
      "Conversation-ready talking points (sports mode) are designed to hold up in real fan discussions",
      "Confidence indicators tell you when the model is less certain about exact episode-level details — useful for older or obscure titles",
      "Use the 'specific questions' field for things like 'Did they make any trades?' or 'Is that character dead?' — answers respect your spoiler level"
    ]
  }
},
// ── DecoderRing tools.js entry ──
// Replace the existing entry (search for id: "DecoderRing")
// Changes: modified date, pitfalls added, description trimmed to 1 sentence

{
  modified: "2026-03-11",
  id: "DecoderRing",
  title: "Decoder Ring",
  tagline: "Decode what they actually mean beneath what they said",
  tags: ['message', 'subtext', 'passive aggressive', 'email', 'text', 'meaning', 'tone', 'confusing'],
  icon: "🔍",
  categories: ['Read the Room', 'Humans'],
  headerColor: "#e0b8b8",
  description: "Paste any confusing message and get a layer-by-layer breakdown of the subtext, emotional undercurrent, what they actually want, red/green flags, and 3 response strategies with copyable examples.",
  guide: {
    overview: "Decoder Ring uses AI to analyze the pragmatics, subtext, and emotional undercurrent beneath any message. It identifies passive aggression, hedging, power moves, emotional bids, non-answers, and genuine warmth — then generates response strategies tailored to your situation.",
    howToUse: [
      "Paste the exact message you received — wording and tone matter",
      "Select where it came from (text, email, Slack, dating app, etc.)",
      "Choose your relationship to the sender for context",
      "Add backstory if the message is ambiguous",
      "Review the translation, emotional read, decoded layers, and response options"
    ],
    example: {
      scenario: "You receive a text from your partner: 'Hey! So I was thinking about what you said and I totally get where you're coming from. I just think maybe we should take some time to think about things separately.'",
      action: "Paste the message, select 'Text message' and 'Partner/Spouse', add context about a recent argument.",
      result: "Decoder Ring identifies hedging + emotional distancing, reveals the subtext is a request for space without wanting to say it directly, flags the 'totally fine either way' as people-pleasing masking anxiety, and generates 3 responses: 'give space gracefully', 'ask directly what they need', and 'acknowledge and reconnect'."
    },
    tips: [
      "Paste the EXACT wording — paraphrasing loses the tone cues AI analyzes",
      "Adding relationship context dramatically improves accuracy for ambiguous messages",
      "Confidence ratings help you know when to trust the read vs. take it with a grain of salt",
      "Response strategies include risk assessments — check the downsides before sending"
    ],
    pitfalls: [
      "Don't paste paraphrased versions — exact wording is what reveals passive aggression, hedging, and tone",
      "The tool reads the message in isolation; wildly different backstory context can change the read significantly",
      "Response strategies are starting points, not scripts — adapt them to your voice"
    ]
  }
},
{
  modified: "",
  id: "PlotTwist",
  title: "Plot Twist",
  tagline: "See every angle of a tough decision — then decide with clarity",
  tags: ['decision', 'stuck', 'choose', 'options', 'dilemma', 'career', 'choice', 'pros cons', 'values'],
  icon: "🔀",
  categories: ['Veer', 'What If?'],
  headerColor: "#f5e0c0",
  description: "Describe any decision you're stuck on and get it analyzed through 6 decision frameworks: pre-mortem, 10/10/10, opportunity cost, reversibility check, values alignment, and the real-question-beneath-the-question. Includes a comparison matrix, gut check reading, stuck pattern diagnosis, and exercises for when you're still frozen.",
  guide: {
    overview: "Plot Twist runs your decision through multiple thinking frameworks that therapists, strategists, and decision scientists use — but applied specifically to YOUR situation. It doesn't tell you what to decide. It shows you angles you're missing so the answer becomes obvious to you.",
    howToUse: [
      "Describe the decision and what's making it hard",
      "Name your options (we'll add 'do nothing' automatically)",
      "Select the values this decision touches",
      "Tell us why you're stuck — this helps identify your blind spot",
      "Review the framework analysis, comparison matrix, and gut check"
    ],
    example: {
      scenario: "You got a job offer paying 40% more but requiring relocation. Current job is comfortable but stagnant. Partner is open to moving but not excited.",
      action: "Describe the situation, add 'Take new job' and 'Stay' as options, select Career growth + Financial security + Family as values, pick 'fear of regret' as stuck reason.",
      result: "Plot Twist reveals the real question ('Am I allowed to choose growth over comfort?'), identifies fear-of-regret as the stuck pattern, shows the new job scores higher on 10-year impact but lower on reversibility, provides a comparison matrix, and delivers a gut check based on how you described the situation."
    },
    tips: [
      "The more context you provide, the sharper the gut check reading becomes",
      "If you only have one option in mind, the tool automatically analyzes it against the status quo",
      "The 'Still Stuck' exercises (coin flip test, future letter, smallest step) are genuinely effective — try them",
      "Use the comparison matrix to have structured conversations with people you trust"
    ]
  }
},

{
  modified: "",
  id: "MiseEnPlace",
  title: "Mise en Place",
  tagline: "Turn whatever's in your kitchen into a meal — with a battle plan",
  tags: ['cooking', 'food', 'recipe', 'kitchen', 'ingredients', 'dinner', 'meal prep', 'fridge', 'dietary', 'substitute', 'swap'],
  icon: "🍳",
  categories: ['The Grind'],
  headerColor: "#d4dde8",
  description: "List your ingredients or snap a photo of your fridge. AI builds a minute-by-minute cooking battle plan with parallel task sequencing, critical timing alerts, technique tips calibrated to your skill level, a quick shopping list, and a leftovers transformation strategy for tomorrow.",
  guide: {
    overview: "Mise en Place is a meal prep strategist, not a recipe finder. It solves the hard part of cooking at home: taking random ingredients and building an optimally sequenced plan that tells you what to do, when, and what to prep during downtime. Like having a sous chef in your ear.",
    howToUse: [
      "List what's in your fridge/pantry, or upload a photo",
      "Set your time available, skill level, and dietary needs",
      "Choose your meal type and available equipment",
      "Get meal recommendations ranked by how well they use your ingredients",
      "Follow the minute-by-minute battle plan with parallel tasks and timing alerts"
    ],
    example: {
      scenario: "You have chicken thighs, rice, bell peppers, garlic, soy sauce, and some wilting spinach. You want dinner in 45 minutes and you're an intermediate cook.",
      action: "List ingredients, set 45 minutes, intermediate skill, dinner, stovetop + oven.",
      result: "Mise en Place recommends teriyaki chicken bowls, provides a timeline starting with rice (longest cook time), then searing chicken during the first 10 minutes while prepping vegetables as a parallel task. Checkpoints tell you when rice should be absorbing, when to flip chicken. Leftovers strategy: tomorrow's fried rice."
    },
    tips: [
      "Fridge photos work surprisingly well — AI identifies ingredients visually",
      "The parallel task suggestions are the real value — they cut total time significantly",
      "Critical timing flags (⏰) are steps where you MUST pay attention or risk ruining the dish",
      "Leftovers strategy prevents food waste by transforming extras into a different meal"
    ]
  }
},

{
  modified: "2026-03-11",
  id: "GhostWriter",
  title: "Ghost Writer",
  tagline: "Turn rough notes into polished recommendation letters in seconds",
  tags: ['recommendation', 'letter', 'reference', 'job', 'linkedin', 'writing', 'grad school', 'scholarship'],
  icon: "✍️",
  categories: ['Pursuits'],
  headerColor: "#ccdfc4",
  description: "Input who you're recommending, your relationship, their qualities, and a few rough bullet points. Get 3 letter versions (narrative, structured, concise) calibrated to the formality level and context. Each version highlights placeholders to personalize, power phrases to keep, and refinement options to dial in the tone.",
  guide: {
    overview: "Ghost Writer solves one of the most procrastinated writing tasks: recommendation letters. It takes your rough knowledge of someone and produces polished letters that sound like YOU wrote them thoughtfully, with specific anecdotes and persuasive structure that actually moves reviewers.",
    howToUse: [
      "Enter the person's name and your relationship to them",
      "Select what they're applying for and the letter type",
      "Pick their standout qualities from the list",
      "Add specific examples or stories (even rough bullet points work)",
      "Choose from 3 versions: Narrative (memorable), Structured (comprehensive), or Concise (quick)"
    ],
    example: {
      scenario: "Your direct report Sarah is applying for a Senior PM role at Google. You've managed her for 2 years. She led the Q3 launch, mentored junior team members, and is exceptionally good at stakeholder communication.",
      action: "Enter Sarah's name, your relationship, the role, select Leadership + Communication + Initiative, add bullet points about the Q3 launch and mentoring.",
      result: "Ghost Writer generates 3 versions: a narrative letter opening with the Q3 launch story, a structured letter with sections on leadership/communication/initiative, and a concise LinkedIn recommendation. Each highlights [BRACKETS] where you should add specific details only you'd know."
    },
    tips: [
      "Even vague bullet points ('she's great with clients') get turned into compelling examples",
      "Placeholders in [BRACKETS] are flagged so you know exactly what to personalize",
      "The Refine button lets you adjust tone, length, or add specific details after generation",
      "Power Phrases section shows which lines carry the most persuasive weight — keep those"
    ],
        pitfalls: [
      "Vaguer inputs produce generic letters — the more specific the bullet points about the person, the stronger the output",
      "The tool generates three style variations; reviewers often respond better to the 'warm' version than the 'formal' one",
      "AI-generated reference letters should always be reviewed and personalised by the actual recommender before sending"
    ]
  }
},

{
  modified: "",
  id: "CaptionMagic",
  title: "Caption Magic",
  tagline: "Turn any photo into engaging social media captions",
  tags: ['caption', 'social media', 'photo', 'instagram', 'linkedin', 'twitter', 'tiktok', 'facebook', 'threads', 'hashtag', 'post', 'content', 'brand voice', 'alt text'],
  icon: "📸",
  categories: ['Pursuits', 'What If?'],
  headerColor: "#ccdfc4",
  description: "Turn any photo into engaging social media captions with AI vision. Upload or paste an image, pick your platform and tone, and get 3 distinct caption options with smart hashtags (categorized by reach), character counts, alt text, and engagement tips. Refine any caption with one tap, adapt your winner to every platform at once, remix the best parts of multiple captions, and build a personal brand voice profile that gets smarter over time. Supports Instagram, LinkedIn, Facebook, Twitter/X, TikTok, and Threads.",
  guide: {
    overview: "Caption Magic uses AI vision to look at your actual photo and craft social media captions that sound like a real person, not a brand. Upload any image (drag-and-drop, paste, or describe it), choose your platform and tone, and get 3 distinct caption options with categorized hashtags (trending, niche, branded), character counts against platform limits, alt text, posting schedule recommendations, and engagement tips. Refine any caption instantly with 5 one-tap options. Adapt your winner to all platforms at once. Remix the best parts of multiple captions into a perfect hybrid. After 3+ uses, Caption Magic learns your brand voice and can auto-apply your preferred style. Track which captions perform best with built-in A/B testing insights.",

    howToUse: [
      "Upload, drag-and-drop, or paste an image — or describe what's in the photo if you don't have one handy",
      "Select your platform (Instagram, LinkedIn, Facebook, Twitter/X, TikTok, Threads) — character limits adjust automatically",
      "Choose 1-3 tones and a caption length (short/medium/long), optionally add context about the moment",
      "Generate captions, then refine with one-tap: Less try-hard, More engaging, Shorter, Longer, or Professional",
      "Use 'Adapt to all platforms' to instantly get versions for every network, or 'Remix' to blend your favorites"
    ],

    example: {
      scenario: "You took a photo of your coffee mug on your desk with your laptop in the background — the millionth 'working from home' photo.",
      action: "Upload the image, select Instagram, choose 'funny' and 'casual' tones with 'short' length, then generate captions.",
      result: "You get 3 options with smart hashtags color-coded by category (🔥 trending, 🎯 niche, 🏷️ branded). One caption is perfect for Instagram, so you tap 'Adapt to all platforms' and instantly get versions for LinkedIn, Twitter, TikTok, Threads, and Facebook — each one native to its platform. You mark the witty option as 'This one won' to build your audience insights over time."
    },

    tips: [
      "Mix tones for variety — combining 'funny' with 'reflective' often yields the most authentic-feeling options",
      "After 3+ generations, your Brand Voice profile unlocks — toggle it on to auto-apply your preferred style",
      "Use 'Adapt to all platforms' to cross-post efficiently — each version is rewritten for its platform, not just trimmed",
      "The Remix feature is great for combining the opening of one caption with the tone of another",
      "Mark winners with '📊 This one won' to build audience insights that improve your future captions"
    ],

    pitfalls: [
      "Don't select too many tones at once — stick to 2-3 for focused quality rather than scattered results",
      "Watch character counts: red means you're over the platform limit (especially Twitter's 280)",
      "Image upload works best with clear, well-lit photos — very dark or blurry images may produce generic captions",
      "The Remix feature needs at least 2 captions selected — it blends, not just picks one"
    ]
  }
},
// ── DopamineMenuBuilder tools.js entry ──
// Replace existing entry (id: "DopamineMenuBuilder")
// Changes: modified date, description trimmed to 1 sentence, tags 7→10, pitfalls added

// ── DopamineMenuBuilder tools.js entry ──
// Replace existing entry (id: "DopamineMenuBuilder")
// Changes: modified date, description trimmed to 1 sentence, tags 7→10, pitfalls added

{
  modified: "2026-03-11",
  id: "DopamineMenuBuilder",
  title: 'Dopamine Menu',
  tagline: 'Energy management — recharge, budget, forecast, track',
  tags: ['energy', 'dopamine', 'recharge', 'motivation', 'burnout', 'mood', 'focus', 'routine', 'self-care', 'rest'],
  icon: '✨',
  categories: ['Energy'],
  headerColor: "#b8dcd8",
  description: "5-mode energy management system: build a personalized recharge menu with pattern tracking, map tasks against your available energy, forecast battery drain across your week, spot burnout early with 15-second daily check-ins, and get adapted routines when life disrupts your schedule.",
  guide: {
    overview: "The Dopamine Menu Builder is your complete energy management system. Recharge mode builds a personalized activity menu based on your current energy, mood, and environment. Budget mode maps your tasks against available energy to show what actually fits. Forecast mode predicts battery drain from your week's events. Radar mode tracks daily wellbeing signals to catch burnout patterns early. Disruption mode gives you an adapted structure when sick, traveling, or in an emergency.",
    howToUse: [
      "Recharge: set your energy level (1-10), mood, environment, and available time — get a personalized menu with a top pick, quick hits, and deep resets",
      "Budget: list today's tasks with energy costs and priorities — see what you can actually do and get explicit permission to drop the rest",
      "Forecast: add upcoming events for the week, set your energy type (introvert/extrovert), and get a battery drain prediction with recovery windows",
      "Radar: log 4 daily signals (sleep, mood, productivity, social energy) for 30 seconds — patterns appear after a few days",
      "Disruption: select what's happening (sick day, travel, emergency), describe your normal routine, and get a simplified adapted structure"
    ],
    example: {
      scenario: "It's 3pm. You've been in back-to-back meetings. Energy is 3/10, you have 45 minutes, you're at the office and feeling drained.",
      action: "Set energy to 3, mood to 'drained', environment to 'office', time to '30 minutes'. Click Build Menu.",
      result: "Top pick: 10-minute walk outside. Quick hits: cold water splash, 5-minute breathing, close tabs and tidy desk. Avoid right now: social media doom-scroll, long creative tasks. First step: stand up and walk to the window."
    },
    tips: [
      "The 'Been doing?' field is powerful — it prevents the AI from suggesting more screen time when you've been staring at screens all day",
      "Rate activities after doing them to build a personalized menu that actually works for you",
      "Use Radar mode consistently for a week — patterns become visible faster than you'd expect",
      "The Budget mode 'permissions' section is the real value — explicit permission to drop or defer things"
    ],
    pitfalls: [
      "Quick hits are for buying time, not restoring energy — deep resets are what actually refill the tank",
      "Forecasting works best when you're honest about your energy type; ambivert is the most common default but may not be accurate",
      "Radar trends only appear after 5+ check-ins — the tool gets smarter the more you use it"
    ]
  }
},
{
  modified: "",
  id: "BatchFlow",
  title: 'Batch Flow',
  tagline: "Batch similar tasks to protect your focus and minimize mental gear-shifting",
  tags: ['batch', 'tasks', 'focus', 'productivity', 'context switching', 'schedule', 'cognitive', 'todo', 'time management', 'deep work', 'flow state', 'energy', 'batching'],
  icon: '⚡',
  categories: ['Do It!', 'The Office!'],
  headerColor: "#d4dde8",
  description: 'Batch similar tasks by cognitive mode to minimize context switching and protect your focus. Includes weekly rhythms, A/B schedule comparison, time calibration, location-aware batching, resistance detection, and focus environment presets.',
  guide: {
    overview: "BatchFlow groups your tasks by how your brain needs to work — not just by topic or deadline. Every time you switch between creative thinking, analytical work, social communication, or physical tasks, your brain pays a recovery tax of 15–25 minutes. BatchFlow eliminates unnecessary switches by sorting your tasks into coherent batches, scheduling them around your energy curve and fixed commitments, and giving you a ready-to-execute plan. Add your tasks, tell it what kind of day you're having and when your energy peaks, and get a complete batched schedule — with focus environment tips, break suggestions, and time estimates — in seconds.",
    howToUse: [
      "List everything on your plate — don't filter or prioritize yet, just dump it all in",
      "Or use 'Paste List' to drop in a raw to-do list and let BatchFlow extract and structure it for you",
      "Set your energy pattern (Morning Person, Night Owl, etc.) so high-focus batches land at your peak",
      "Pick your day type — Maker Day, Meetings Day, Admin Day — to shape how batches are sequenced",
      "Add fixed commitments (meetings, pickups) so BatchFlow works around them, not over them",
      "Hit 'Batch My Tasks' — or use 'Compare' to see a Sprint vs Marathon version side-by-side",
      "In the results, tick off tasks as you go, use '🔍 Expand' for step-by-step breakdowns, and hit 'What's next?' to recalibrate mid-day",
      "Use 'Log time' after each batch to build time calibration data — after a few sessions it'll predict your durations accurately"
    ],
    example: {
      scenario: "It's Monday morning. You have 11 tasks: 3 emails to write, a spreadsheet to update, 2 calls to make, a report to draft, groceries, a form to file, a meeting at 2pm, and a design review.",
      action: "Enter all 11 tasks, set energy to 'Morning Person', day type to 'Mixed Bag', add the 2pm meeting as a fixed commitment. Hit Batch.",
      result: "BatchFlow groups them into 4 batches: a 9–11am Creative batch (report + design review), an 11am–noon Social batch (calls + emails), a 1–2pm Mechanical batch (spreadsheet + form, before the meeting), and an afternoon Physical batch (groceries after the meeting). Each batch includes a focus preset, estimated duration, and a break suggestion. Context switches drop from 10 to 3."
    },
    tips: [
      "The 'Paste List' mode is fastest — just dump your notes app or inbox and BatchFlow will extract tasks automatically",
      "Use 'Compare' (Sprint vs Marathon) when you're unsure how hard to push — it shows two different pacing strategies for the same tasks",
      "Add even vague time estimates ('~30 min') to the task detail field — it makes batch durations much more accurate",
      "The 'Weekly Rhythm' feature is worth setting up once — it gives you a repeatable weekly batching pattern for recurring tasks",
      "If the same tasks keep getting deferred across sessions, the '⚠️ Stuck tasks' analysis will diagnose why and suggest a fix",
      "After 3+ sessions, 'Insights' shows your actual batching patterns — which modes you favor, your real completion rate, and where you lose the most time"
    ]
  }
},

{
  modified: "",
  id: "LazyWorkoutAdapter",
  title: "Lazy Workout Adapter",
  tagline: "Low-barrier movement that meets you where you are",
  tags: ['exercise', 'workout', 'lazy', 'fitness', 'motivation', 'gym'],
  icon: "🧘",
  categories: ['Body', 'Energy'],
  headerColor: "#ccdfc4",
  description: "Low-barrier movement that meets you where you are — especially when you don't want to exercise. 13 AI endpoints across 9 modes: Right Now builds workouts from energy level, body complaints, AND what happened today (12 context triggers like 'bad sleep', 'long meeting', 'emotional day' that fundamentally change the workout). 2-Minute Floor for when even 5 minutes is too much. Body Relief targets specific problem areas. Environment Stack layers invisible micro-movements onto activities you're already doing (watching TV, cooking, phone calls). Sleep Prep is a pre-bed wind-down optimized for transition to sleep with progressive relaxation and breathing patterns. Recovery is first aid for your body after life events (post-flight, post-crying, post-migraine) addressing physical and emotional residue. My Week plans 7 days as a menu, not a mandate. Breathe mode offers box breathing, 4-7-8, and calm patterns with visual timer. Built-in follow-along timer, exercise swap with memory, movement streaks, invisible progression, saved presets, and a 'Not Today' button for guilt-free skips. History tracks energy shifts, and Prove It analyzes your own data to show whether movement actually helps YOU — with real numbers, not motivation.",
  guide: {
      overview: "LazyWorkoutAdapter is for the moment you know you should move but don't want to. Instead of pretending you have motivation, it starts from your actual energy, what happened today, and where your body hurts — then builds something you can realistically do right now. Context triggers ('bad sleep', 'emotional day', 'been in meetings') change the workout more meaningfully than an energy number alone. Environment Stack eliminates the idea that movement is separate from your day by weaving micro-movements into things you're already doing. Sleep Prep helps you wind down before bed with progressive relaxation. Recovery handles the aftermath of life events — post-flight, post-argument, post-migraine. After enough sessions, Prove It shows your own data back to you: does movement actually raise your energy? By how much? What type works best? Your data convinces you, not motivational quotes.",

      howToUse: [
        "⚡ Right Now: Set energy, tap what happened today (context triggers), tap where your body hurts, choose time and setting. Get a tailored workout with timer, swap, and easier fallbacks for every exercise",
        "⏱️ 2-Minute Floor: Three movements, 40 seconds each. For those days where even 5 minutes is impossible. Still counts toward your streak",
        "🎯 Body Relief: Pick what hurts, choose intensity, get targeted movements that feel like relief — with prevention tips",
        "📚 Environment Stack: Tell it what you're about to do (TV, cooking, phone call) and get micro-movements to sprinkle throughout — 30-60 seconds each, often invisible to anyone watching",
        "🌙 Sleep Prep: Set your stress level and time. Get a progressive wind-down routine that ends with eyes closed and a breathing pattern. The physical equivalent of dimming the lights",
        "🩹 Recovery: Tell it what happened (long flight, bad day, panic attack, surgery) and how rough it was. Get a recovery protocol that addresses physical and emotional residue, starting with the most immediately soothing thing",
        "📅 My Week: Rate your typical energy by day, get a 7-day movement menu with minimums and 'feeling it' options. Skip days guilt-free",
        "🫁 Breathe: Box breathing, 4-7-8, or calm pattern with visual countdown. Sometimes the movement you need is just breathing",
        "📊 History: 30-day calendar with streak, energy shift tracking. Insights after 5+ sessions. 'Prove It' after 7+ sessions shows real evidence from your own data",
        "💾 Presets: Save favorite workouts for one-tap repeat. 'Not Today' button logs a skip without guilt — the data is actually useful for pattern analysis"
      ],

      example: {
        scenario: "It's 9pm Tuesday. You had back-to-back meetings all day, your neck is killing you, energy is 3/10, and you need to be in bed in an hour. You've been using the tool for 2 weeks.",
        action: "Open the tool — it nudges you: 'It's Tuesday evening. You usually do a 10-minute session around now. How about your usual neck relief?' You tap 'Let's go' but switch to Right Now, set energy to 3, tap 'long meeting' and 'screen marathon' as context triggers, tap 'stiff neck.' 8 minutes. The workout is entirely floor-based with neck-specific movements, all doable while watching TV. You swap one exercise you don't like — it's replaced and remembered. After, you switch to Sleep Prep with stress level 'high.' 5-minute wind-down ending with 4-7-8 breathing.",
        result: "Two sessions logged (workout + sleep prep). Energy went from 3 to 5 after the workout. Streak: 9 days. The tool notes you consistently feel better after evening sessions. After another week, you check Prove It: your energy increases an average of 1.6 points after moving, and neck-targeted sessions help the most. That's not motivation — it's your own data."
      },

      tips: [
        "Context triggers are the biggest upgrade — 'bad sleep' and 'been in meetings' produce fundamentally different workouts even at the same energy level",
        "Environment Stack is for people who 'don't have time to exercise' — if you're watching TV for an hour, you have time for 6 invisible micro-movements",
        "Use Sleep Prep every night for a week and notice the difference — it's the highest-retention mode because everyone goes to bed",
        "Recovery mode isn't just for physical events — 'after a difficult conversation' and 'panic attack recovery' are valid inputs that address emotional residue",
        "The 'Not Today' button is data, not failure — the tool uses skip patterns to find what's happening on days you don't move",
        "Check Prove It after 2 weeks — seeing your own energy data is more convincing than any motivational content",
        "Save your go-to workout as a preset for one-tap access on busy days",
        "The breathing timer works standalone — use it in a meeting, before a presentation, or when you can't sleep"
      ]
    }
},

{
  modified: "2026-03-11",
  id: "JargonAssassin",
  title: "Jargon Assassin",
  tagline: "Confusing documents → plain language → what to do about it",
  tags: ['jargon', 'plain language', 'legal', 'medical', 'translate', 'document', 'simplify'],
  icon: "🗡️",
  categories: ['The Office', 'Body'],
  headerColor: "#d4dde8",
  description: "Translate confusing documents into plain language — then actually do something about them. 11 AI endpoints across 6 modes: translate any legal, medical, financial, insurance, or government document at 4 reading levels (ELI5 through Professional) with instant danger scoring, enforceability flags, and a growing jargon glossary. Ask follow-up questions. Deep-dive any flagged section line-by-line. Compare two document versions to catch every change. Red-Line Markup generates specific suggested edits with negotiation strategy. Template Compare tells you whether your document is normal or aggressive vs. standard documents of its type. Action Plan turns understanding into ordered steps with deadlines. Explain To reframes the content for a specific person (your parent, roommate, teenager). Multi-Document Dossier cross-references related documents to find conflicts and gaps. Letter Generator writes professional responses that reference specific clauses. Saves translations with danger scores for reference.",
  guide: {
      overview: "JargonAssassin is for the moment you're staring at a lease, medical consent form, insurance policy, or employment contract and thinking 'what does this actually mean for me?' Paste the document, pick your reading level, and get it translated with every red flag, deadline, and hidden catch identified. But translation is just the start — the tool completes the full arc from confusion to understanding to action. Red-Line tells you what to push back on with specific alternative language. Template Compare gives you a baseline for what's normal. Action Plan orders your next steps with deadlines pulled from the document. Letter Generator writes your response. And if you need to explain it to someone else — your parent, your roommate, your partner — the Explain To mode reframes everything for that specific person.",

      howToUse: [
        "📄 Translate: Paste any document, select type and reading level (ELI5 through Professional). Get plain translation, danger score, flagged sections with enforceability notes, glossary, and checklist",
        "❓ Q&A: Ask anything about the translated document — 'Can I sublease?', 'What if I miss a payment?' Answers at your reading level with warnings if your question reveals a concern",
        "🚩 Key Sections: View flagged sections (red flags, deadlines, decisions) with one-click deep-dive for line-by-line clause analysis including hidden catches",
        "🗣️ Explain To: Enter who you're explaining to ('my 70-year-old mother', 'my business partner') and get the content reframed for their concerns, their language, and what they specifically need to know — plus advice on how to have the conversation",
        "✏️ Red-Line: One-click generates specific edits to propose — what to change, what to add, what to remove — with priority ranking, alternative language, and a negotiation strategy for what to lead with and what to concede",
        "📊 vs Normal: One-click compares your document against what's typical for this type — is your non-compete unusually broad? Is that late fee standard? Flags what's aggressive, what's missing, and what's actually better than usual",
        "📋 Action Plan: Generates ordered steps with deadlines, quick wins you can do in 5 minutes, scripts for conversations, and consequences if you do nothing",
        "🔀 Compare: Paste two versions of a document to see every meaningful change, what was removed (potentially concerning), and whether the revision is better or worse overall",
        "📁 Dossier: Add 2+ related documents (lease + building rules, contract + handbook) and cross-reference them for conflicts, dependencies, and gaps between documents",
        "✉️ Letter: Generate a professional response letter — dispute, negotiate, accept with conditions — that references specific clauses, with tone selection and send-via recommendation"
      ],
    pitfalls: [
      "The 'ELI5' level is deliberately simplified — it strips nuance; use '5th Grade' or 'Professional' for legal or medical decisions",
      "Red flags are flagged by pattern, not legal expertise — always have a qualified professional review anything with 'danger' flags before signing",
      "The comparison feature needs both versions of the full document, not just the changed clauses, for accurate scoring"
    ],

      example: {
        scenario: "You receive a new apartment lease renewal. The rent went up, some terms changed, and there's a new clause about 'property access' that sounds invasive. You also need to explain the changes to your roommate who panics about everything.",
        action: "Translate the full lease — danger score shows 'Caution' with the property access clause flagged as a red flag with enforceability concerns. Deep-dive that clause: it allows 24-hour access without notice for 'maintenance.' Hit Red-Line — it suggests changing to 48-hour written notice except for emergencies, with specific language to propose. Template Compare shows the rent increase is standard for your area but the access clause is unusually broad. Action Plan gives you 6 steps, starting with emailing the landlord about clause 4.2 (script included), deadline to respond by the 15th. Then use Explain To for 'my anxious roommate' — it reframes everything calmly, tells them what NOT to worry about, and suggests having the conversation over dinner.",
        result: "Full translation with 3 red flags and 2 deadlines identified. Red-line with 4 suggested changes ranked by priority. Template comparison showing 8 clauses rated against standard leases. 6-step action plan with scripts and deadlines. A roommate-friendly explanation that reduces anxiety. All saved for reference."
      },

      tips: [
        "Start with Translate, then use the one-click buttons (Red-Line, vs Normal, Action Plan) to unlock the full analysis — each builds on the translation",
        "Red-Line + Action Plan together complete the arc: Red-Line tells you WHAT to push back on, Action Plan tells you HOW and WHEN",
        "Template Compare is the sleeper feature — knowing what's 'normal' for your document type is often more valuable than the translation itself",
        "Use Explain To when you need buy-in from someone else — it reframes for their concerns, not yours, and even tells you how to have the conversation",
        "The Dossier mode is powerful for real-world situations where documents reference each other (lease + building rules, job offer + benefits package + handbook)",
        "Letter Generator saves hours — but always review before sending, especially for legal or financial responses",
        "Reading levels matter: ELI5 for 'I just need to know if this is safe,' Professional for 'I'm smart but not in this field'",
        "Danger scores are instant gut-checks — if you see 🔴, read the flagged sections before doing anything else"
      ]
    }
},
{
  modified: "2026-03-10",
  id: "DebateMe",
  title: "Debate Me",
  tagline: "State your position. Face the strongest opposing case.",
  tags: ['debate', 'argue', 'logic', 'steelman', 'critical thinking', 'opinion', 'persuade', 'fallacy', 'rhetoric'],
  icon: "🥊",
  categories: ['Diversions', 'What If?'],
  headerColor: "#b8dcd8",
  description: "The complete intellectual sparring system. State any position and face the steelman — the strongest possible opposing case, not a strawman. Multi-turn debate with fallacy flags, coaching angles, source checks, and strategic concession. Five formats (Freeform, Lincoln-Douglas, Cross-Exam, Oxford, Socratic). Devil's Advocate Prep drills you for real meetings. Fallacy Gym trains pattern recognition. Rematch targets your documented blind spots. Highlight Reel analyzes patterns across all debates and assigns a Debater Type.",
  guide: {
    overview: "DebateMe is a complete system for sharpening how you think. At its core: state any position and face the strongest possible counter-argument — not a caricature, but what a thoughtful, well-informed person who genuinely disagrees would actually say. Around that core: five structured debate formats (including Socratic method where the AI only asks questions), a coaching system that suggests angles without writing your arguments, source-checking for any claim, audience judgment that scores persuasiveness rather than correctness, and an argument map that visualizes the structure of your thinking. Outside of debates: Devil's Advocate Prep drills you for real-world meetings with audience-specific objections, and Fallacy Gym trains you to spot logical errors. Everything compounds — your debate log feeds a Highlight Reel that reveals persistent patterns, assigns a Debater Type, and prescribes specific exercises for your weaknesses.",
    howToUse: [
      "🥊 Full Debate: State position, pick format (Freeform/Lincoln-Douglas/Cross-Exam/Oxford/Socratic), set challenge level, go. Use 🤝 to concede strategically, 🧑‍🏫 for coaching angles, 🔍 to source-check claims, 🔄 to switch sides. Adjust difficulty mid-debate",
      "📊 Scorecard + Extras: After 2+ exchanges, end for sharpness score, blind spots, fallacy analysis, coaching note. Then unlock Audience Verdict (who was more persuasive to an undecided observer?) and Argument Map (visual tree of your claims with defended/abandoned branches)",
      "🎯 Devil's Advocate Prep: Enter your position, audience, context, and stakes. Get the 5 hardest questions they'll ask, with angles, landmines to avoid, openers, and worst-case recovery. Jump to a full practice debate from any prep",
      "🧩 Fallacy Gym: Spot logical fallacies at easy/medium/hard difficulty. Streak tracking. Get specific feedback on why you were right or wrong. Builds the skill that makes you better in actual debates",
      "🔁 Rematch: From your log, rematch any previous debate. The AI targets your documented blind spots and sets traps for your habitual fallacies. Forces genuine growth",
      "🏆 Highlight Reel: After 3+ debates, generate a cross-debate analysis — your Debater Type archetype, persistent strengths and weaknesses, most common fallacy with exercises, growth trajectory, and suggested topics to stretch your weakest areas"
    ],
    example: {
      scenario: "You need to defend switching to remote-first at Thursday's board meeting. The CEO is risk-averse and the company lost revenue last quarter.",
      action: "Devil's Advocate Prep: enter your position, describe the board, note the revenue context, set stakes to 'career-defining.' Get drilled on the 5 hardest questions. Then jump to a full debate in Oxford format at Rigorous. Use Cross-Exam format for a round to practice answering tough questions. Mid-debate, source-check the productivity data you're citing. Hit Coach when stuck on the innovation objection. After 5 turns, switch sides to understand the board's perspective. End & Score.",
      result: "Prep gave you the 'but what about our culture' question you hadn't prepared for, plus a landmine to avoid ('don't mention competitor layoffs'). Debate scorecard: 7/10, blind spot on junior employee development. Audience Verdict: you were slightly more persuasive but lost them during the cost analysis. Argument Map shows you built wide but not deep — lots of claims, thin evidence. Rematch available targeting those exact weaknesses."
    },
    tips: [
      "Devil's Advocate Prep before any important meeting, presentation, or difficult conversation — it's the highest-ROI mode",
      "Try Socratic format at least once — being questioned without the AI asserting anything forces you to examine your own assumptions in a way nothing else does",
      "Source Check your own claims, not just the AI's — discovering your own weak evidence mid-debate is better than discovering it in the real conversation",
      "The Fallacy Gym streak is addictive and genuinely useful — try 5 minutes a day at increasing difficulty",
      "Rematch is where real growth happens — same topic, but the AI remembers your blind spots and specifically targets them"
    ],
    pitfalls: [
      "The AI argues its assigned position forcefully — that's the point, not a bug. The goal is to strengthen your thinking, not to 'win'",
      "Scorecard reflects reasoning quality, not factual correctness — a well-argued wrong position can score higher than a sloppy right one",
      "Devil's Advocate Prep simulates an audience based on your description — the more detail you give, the more accurate the simulation"
    ]
  }
},
{
  modified: "",
  id: "ResearchDecoder",
  title: "Research Decoder",
  tagline: "What this paper actually says — and whether what you read about it is true",
  tags: ['research', 'academic', 'paper', 'science', 'summary', 'study', 'digest'],
  icon: "📄",
  categories: ['Go Deep!'],
  headerColor: "#d4dde8",
  description: "Translate academic papers into plain language — no PhD required. Five modes: Digest breaks any paper into a one-sentence finding, methodology, limitations, decoded jargon, and an honest 'so what.' Media Check compares what a paper actually says to how headlines report it, catching exaggerations and missing context. Compare shows where two papers agree or diverge. For Me? gives personalized relevance based on your situation. Jargon Decoder explains scientific terms with analogies, not textbook definitions. Auto-builds a personal jargon dictionary as you read",
  guide: {
      overview: "Research Decoder is for the moment you see a headline like 'Scientists prove coffee cures everything' and think 'wait, does it really?' Instead of wading through dense abstracts, paste the paper text and get the actual finding in one sentence, what kind of study it was (described, not judged), what it proves vs. what people think it proves, and a warm honest take you'd hear from a smart friend over coffee. The Media Check is the killer feature — it compares what the paper says to what the headline claims and catches every type of distortion. Every term you encounter gets saved to a personal jargon dictionary that grows as you read.",

      howToUse: [
        "📄 Digest: Paste an abstract or paper text, optionally select the field. Get the finding in one sentence, methodology description, what it proves and doesn't, limitations, decoded jargon, and an honest 'so what' section with confidence level",
        "📰 Media Check: Paste a headline (and article excerpt if you have it) plus the paper text. Get an accuracy rating, specific distortions identified by type (causation from correlation, cherry-picked results, etc.), what they got right, and what the headline should have said",
        "⚖️ Compare: Paste text from two papers on a similar topic. See whether they agree, why they might differ, which to trust more for your specific question, and what's still unknown",
        "🎯 For Me?: Describe a finding and your situation. Get a personalized assessment of whether it applies to you, whether you should change anything, the cost of waiting for more evidence, and whether to talk to a professional",
        "🔤 Jargon: List terms you don't understand — get plain English explanations with analogies, examples, common misconceptions, and why each term matters. All terms auto-save to your personal dictionary"
      ],

      example: {
        scenario: "You see a headline: 'New study proves intermittent fasting reverses aging.' You're 40, considering trying it, and your doctor mentioned it once. You found the actual paper's abstract.",
        action: "Digest the abstract first — learn it was a 12-week study of 30 mice, not humans. Media Check the headline — catch 'proves' (it suggests), 'reverses aging' (it measured one biomarker), and 'fasting' (they used a specific 16:8 protocol). Then hit 'Does this apply to me?' with your age, health, and doctor's comment.",
        result: "The digest explains it's an early mouse study showing a correlation with one aging marker. Media Check rates the headline 'Exaggerated' — three distortions identified. The relevance check says 'Too early to tell' for humans, but the 16:8 protocol is low-risk to try, and suggests asking your doctor specifically about your situation. Five new terms added to your jargon dictionary."
      },

      tips: [
        "Start with Digest, then use the quick-action buttons to jump to Media Check or 'For Me?' — the paper text carries over automatically",
        "The Media Check is the most unique feature — use it whenever a health or science headline feels too good (or too scary) to be true",
        "Your jargon dictionary grows automatically across all modes. After a few papers, you'll start recognizing terms on your own",
        "Compare mode is powerful when you've seen conflicting headlines — paste both abstracts to understand why studies on the same topic can reach different conclusions",
        "The tool describes methodology rather than judging it — 'this was a small observational study' is useful information, not a verdict"
      ]
    }
},

{
  modified: "",
  id: "RoomReader",
  title: "Room Reader",
  tagline: "Read the room before you walk in",
  tags: ['social', 'conversation', 'read the room', 'networking', 'awkward', 'small talk', 'people'],
  icon: "🎭",
  categories: ['Read the Room'],
  headerColor: "#e0b8b8",
  description: "A 12-mode social coach for every stage of a social situation — prep, navigate, recover, and debrief. Modes include event prep, quick tap-and-go lines, conversation recovery, person and group prep, energy matching, small talk depth, culture decoding, signal decoding, follow-up drafting, and post-event analysis. Builds a persistent Playbook from your wins and tracks recurring people over time.",
  guide: {
      overview: "Room Reader is your social intelligence coach — the clever friend who preps you before the party, rescues you mid-conversation, and debriefs you afterward. Every mode builds your persistent Playbook, which shapes future suggestions. Track recurring people across interactions. Save Game Plans to pull up on your phone at the event. The tool gets smarter the more you use it.",

      howToUse: [
        "Pre-Game: Pick an event, add details, get conversation starters, people map, body language, exits, and a pep talk. Save the plan to reference at the event",
        "Quick Read: Tap a scenario + relationship, get one line instantly. Refresh for a new one. Your playbook shapes the style",
        "Recovery: Just said something weird? Enter what you said, get a damage score (most things are a 3/10) and immediate saves",
        "Person Prep: Strategy for one specific person. Track recurring people by logging what worked and what bombed after each interaction, then get fresh strategies from the history",
        "Group Dynamics: Enter conversations, contribute without dominating, recover from being ignored",
        "Energy Match: Your energy doesn't match the room? Get techniques to bridge up, bridge down, or own the mismatch",
        "Small Talk Ladder: Learn exact transition phrases to go from 'nice weather' to genuine connection in 5 levels",
        "Culture Decoder: Cross-cultural social situations with do/don't lists, body language norms, and a key phrase to learn",
        "Signal Decoder: Someone said something confusing. Get the most likely read, overthinking check, and options",
        "Follow-Up: Draft the right post-event text with timing and multiple styles",
        "Debrief: Log wins (auto-added to Playbook) and reframe awkward moments. Get a next challenge",
        "Social Autopsy: Deep forensic analysis of what went wrong. Separates your fault from not-your-fault. Adds lessons to Playbook"
      ],

      example: {
        scenario: "You have a work dinner Thursday with your partner's Japanese clients. Your partner's difficult mother will be at family brunch Sunday. Last week's networking event was a disaster and you can't figure out why.",
        action: "Culture Decoder: Japanese business dinner. Person Prep: partner's mother + track her as recurring. Social Autopsy: describe the networking event. Pre-Game: Thursday dinner with saved plan.",
        result: "Culture guide with greeting norms, seating etiquette, a phrase in Japanese, and how to handle the toast. Person strategy for the mother based on what you know, with a 'track' button that logs each interaction so next time it suggests fresh topics based on history. Autopsy reveals the networking event wasn't your fault — the group dynamics were exclusionary — but suggests a positioning trick for next time (added to Playbook). Thursday's plan saved for phone reference."
      },

      tips: [
        "Recovery mode is for RIGHT NOW — don't overthink the input, just type what you said and get a save. Most things are a 3/10",
        "Track recurring people (in-laws, coworkers, neighbors) and log interactions. After 3-4 notes the fresh strategy becomes remarkably specific",
        "The Small Talk Ladder is a skill builder — use it before events to practice transition phrases, not just when you're stuck",
        "Social Autopsy is for when Debrief isn't enough. Use it when you genuinely can't figure out what went wrong. It's generous about what wasn't your fault",
        "Copy the Cheat Sheet from saved plans — it's a phone-friendly summary of your full prep that you can pull up in the bathroom before rejoining the party"
      ]
    }
},

{
  modified: "",
  id: "MoneyDiplomat",
  title: "Money Diplomat",
  tagline: "The right number for every money moment — tips, splits, gifts, salary",
  tags: ['money', 'awkward', 'negotiate', 'bill', 'tip', 'salary', 'social'],
  icon: "💵",
  categories: ['Humans', 'Loot'],
  headerColor: "#e0b8b8",
  description: "Navigate every awkward money situation with confidence. 18 scenario types covering tips, bill splits, Venmo requests, lending, dating, gifts, roommates, salary negotiation, inheritance, group travel, subscriptions, affordability checks, cultural money norms, charity, weddings, family, and coworker collections. Plus 5 bonus modes: instant tip/split calculator, debt tracker with AI nudge messages, conversation practice simulator, usage trends with charts, and a persistent profile so you never re-explain your budget or culture.",
  guide: {
      overview: "Money Diplomat handles the social side of money — the conversations, calculations, and etiquette nobody teaches you. Pick from 18 situation types (tipping, splitting, lending, dating, gifts, salary, inheritance, and more) and get tailored scripts, amounts, and strategies. Use Quick Math for instant tip/split calculations without AI. Track who owes you with They Owe Me and generate tactful nudge messages. Practice high-stakes money conversations in the simulator. Set your profile once (budget, culture, relationship status) and every response adapts automatically.",

      howToUse: [
        "⚙️ Set Profile first (optional but powerful): Enter your budget level, cultural background, relationship status, and country — this context auto-enriches every future request",
        "🔥 Quick Math: For simple tip or split calculations, toggle Quick Math mode — enter bill amount, pick a tip percentage, set number of people, get instant results with no AI needed",
        "🎯 Pick a Situation: Choose from 18 types (Tip, Split Bill, Venmo, Lending, Date, Gift, Salary, etc.), fill in the context fields, and get a tailored script with exact amounts and social strategy",
        "🎭 Practice Mode: For high-stakes conversations (salary, lending, family money), open the simulator — the AI plays the other person in character while coaching your responses",
        "📒 They Owe Me: Log debts, track who's paid, and generate culturally-aware nudge messages at the right escalation level — from gentle reminder to firm follow-up"
      ],

      example: {
        scenario: "Your friend group is splitting a dinner bill, but two people only had salads while others ordered steak and cocktails. Someone suggests splitting evenly. You don't want to be 'that person' but it's a $40 difference.",
        action: "Select 'Bill Splitter', enter the total bill, number of people, and describe the situation: 'Two people had $25 meals, others had $65+ with drinks. Someone wants to split evenly.' Click get advice.",
        result: "You get a fair split calculation (itemized vs even, with the exact dollar difference), a ready-to-send group text that frames it positively ('Hey! Want to do a rough itemized split so nobody overpays? I can Venmo-request everyone their portion — easier than math at the table'), and a backup script if someone pushes back. The tone matches your profile's cultural context."
      },

      tips: [
        "Set your profile once and forget it — every situation response will automatically factor in your budget comfort level and cultural norms without you re-explaining each time",
        "Use Quick Math mode for the 60% of situations that just need fast arithmetic — save the AI-powered mode for socially complex scenarios where you need scripts and strategy",
        "The Practice simulator is especially valuable before salary negotiations and family money conversations — rehearsing with AI builds real confidence for the actual conversation",
        "Check Trends periodically to spot patterns — if you're constantly in 'lending' situations with the same person, the data makes it easier to set a boundary"
      ]
    }
},

{
  modified: "",
  id: "SkillGapMap",
  title: "Skill Gap Map",
  tagline: "Your GPS from current role to dream job",
  tags: ['career', 'skills', 'job', 'transition', 'learning', 'gap', 'resume'],
  icon: "🗺️",
  categories: ['Pursuits', 'Veer'],
  headerColor: "#ccdfc4",
  description: "Map the exact skill gap between your current role and your target — then close the gap. 22 tools covering every stage of a career transition: skill gap analysis, learning timeline, proof-of-skill projects, job posting decoder, mock interviews, resume audit, target company finder, day-in-the-life simulations, market pulse, salary economics, mentor matching, networking scripts, weekly nudges, and progress tracking with milestone celebrations.",
  guide: {
      overview: "Skill Gap Map is a 22-feature career transition engine. Start by exploring roles or mapping your gap — then unlock a full pipeline: day-in-the-life reality checks, optimal learning sequences, salary economics, proof-of-skill projects, networking strategy with outreach drafts, resume audits, company targeting, job posting decoders, mock interviews with AI, market demand tracking, weekly assignments, milestone celebrations, and mentor matching. It remembers your progress across sessions and adapts as you grow.",

      howToUse: [
        "🔍 Explore Mode: Enter your interests to discover matching roles with difficulty ratings, salary ranges, and surprise suggestions — or skip straight to Map Mode if you know your target",
        "🗺️ Map Mode: Enter your current role, target role, and existing skills → get a prioritized gap analysis with effort estimates, urgency ratings, and a visual progress tracker",
        "📅 Unlock Depth: Click any skill gap for a deep dive (resources, projects, time estimates), then expand into Timeline, Proof Projects, Networking, Economics, and Resume Audit panels",
        "🎯 Prepare: Use Job Posting Decoder to analyze real listings, Mock Interview for AI-powered practice rounds, and Company Targets to find where to apply",
        "📈 Stay on Track: Check your progress tracker, trigger milestone celebrations, get weekly nudge assignments, and find your ideal mentor profile"
      ],

      example: {
        scenario: "You're a marketing coordinator who wants to become a product manager. You have project management and analytics skills but no technical background.",
        action: "Enter 'Marketing Coordinator' as current role, 'Product Manager' as target. List your skills (project management, analytics, stakeholder communication). Set 10 hours/week for learning. Click Map My Gap.",
        result: "You get 6 prioritized skill gaps (SQL, wireframing, A/B testing, technical communication, roadmapping, user research) with effort bars and urgency ratings. Expand SQL for a deep dive with free courses and a portfolio project. Generate a 6-month timeline. Click Day in Life to see what a PM's Tuesday actually looks like. Decode a real PM job posting to see you're already 65% qualified. Run a mock interview round where the AI asks 'How would you prioritize these three features?' and coaches your answer."
      },

      tips: [
        "Start with Explore Mode if you're unsure about your target — the surprise suggestions often surface roles you hadn't considered that match your existing strengths",
        "Use Day in Life before committing to a career switch — the hour-by-hour schedule and frustration scenarios reveal whether you'd actually enjoy the daily reality",
        "Run Job Posting Decoder on 3-5 real listings to calibrate which gaps matter most in the actual market versus theoretical skill lists",
        "The Weekly Nudge gives you one specific assignment with a deliverable — treat it like homework to maintain momentum between big planning sessions"
      ]
    }
},

{
  modified: "2026-03-11",
  id: "HistoryToday",
  title: "HistoryToday",
  tagline: "Find the structural historical parallel — not the obvious one",
  tags: ['history', 'current events', 'parallels', 'context', 'analysis', 'pattern', 'news'],
  icon: "📰",
  categories: ['Diversions', 'What If?'],
  headerColor: "#b8dcd8",
  description: "Enter any current event, trend, or controversy. AI finds 2-3 structural historical parallels — not surface-level ('this is like Rome falling') but deep structural matches based on power dynamics, institutional behavior, and how similar situations actually played out. Each parallel includes what happened, how contemporaries understood it (and how they were wrong), what happened next, and specifically where the analogy breaks down. Dig deeper into any parallel for full timelines, turning points, echoing quotes, and information environment analysis. Get a counter-example showing when similar conditions led to a different outcome. Plus synthesis, predictions, and further reading.",
  guide: {
    overview: "Most historical analogies are lazy: 'This is just like the fall of Rome.' HistoryToday goes deeper. It finds structural parallels — situations where the underlying mechanisms (regulatory capture, information asymmetry, institutional decay, public sentiment shifts) match the current moment. For each parallel, you get the full picture: what happened, how people at the time understood it, what they got wrong, what happened next, and crucially — where the analogy breaks down. That last part is the most valuable: every parallel is imperfect, and the differences predict what will be different this time. Dig Deeper expands any parallel into a full timeline with turning points, echoing quotes, and lessons. The Counter-Example finds a case where similar starting conditions produced a completely different outcome.",
    howToUse: [
      "Describe any current event, trend, or controversy — be as specific or broad as you want",
      "Optionally add a specific angle ('I'm interested in the labor dynamics' or 'What about the regulatory side?')",
      "Hit Find Parallels to get 2-3 structural matches ranked by similarity",
      "Each parallel shows structural mechanisms with Then/Now comparison cards",
      "Read 'Where This Analogy Breaks Down' — it's the most important section",
      "Hit Dig Deeper on any parallel for a full timeline, turning points, echoing quotes, and information environment",
      "Hit Counter-Example to find a case where similar conditions went a different direction",
      "The Synthesis section combines all parallels into a collective pattern and prediction",
      "Copy any individual parallel or the full analysis"
    ],
    
    example: {
      scenario: "You want to understand the current wave of tech layoffs happening alongside record corporate profits.",
      action: "Enter: 'Tech companies doing mass layoffs while reporting record profits'. Optional angle: 'Labor dynamics.'",
      result: "Parallel 1: The Railroad Consolidation of the 1890s (82% match) — railroads laid off workers while posting record revenues during consolidation. Contemporary view: 'efficiency gains.' Actual cause: monopolistic extraction. What happened next: labor organizing, eventual antitrust. Breaks down because: tech workers are individually more mobile than railroad workers were. Parallel 2: British textile automation 1810s (67% match). Counter-example: Post-WWII corporate compact where record profits led to voluntary wage increases (different because of union density and Cold War pressure to prove capitalism works)."
    },
    
    tips: [
      "Specific events get better parallels than broad trends. 'Congress debating AI regulation' is better than 'AI is changing things.'",
      "Use the angle field to steer toward what you care about — same event can parallel different things depending on the lens.",
      "The 'Where It Breaks Down' section is where the real insight lives. Read it carefully.",
      "Dig Deeper is worth it for the echoing quotes — hearing what people said 200 years ago that sounds like today's headlines.",
      "The Counter-Example is the intellectual honesty check. If similar conditions sometimes produce different outcomes, you can't be certain of the prediction.",
      "Try the same event with different angles to see multiple facets."
    ],
    
    pitfalls: [
      "History rhymes but doesn't repeat. These are analytical tools, not crystal balls.",
      "The AI avoids the 5 most overused analogies (fall of Rome, Weimar, 1930s appeasement, dot-com bubble, Titanic) unless they're genuinely the best match.",
      "Match scores are relative, not absolute. An 80% doesn't mean 80% certainty — it means the structural overlap is high compared to other candidates.",
      "Further reading suggestions are real books/articles but check availability before purchasing."
    ]
  }
},

{
  modified: "",
  id: "BragSheetBuilder",
  title: "Brag Sheet Builder",
  tagline: "Turn humble descriptions into a complete career advancement toolkit",
  tags: ['resume', 'achievements', 'career', 'promotion', 'accomplishments', 'interview', 'linkedin', 'performance review', 'raise', 'salary negotiation', 'job search', 'brag sheet', 'bullets', 'cv', 'job application', 'cover letter', 'behavioral interview', 'confidence', 'work history', 'wins', 'strengths', 'star stories', 'voice match'],
  icon: "🏆",
  categories: ['The Grind', 'The Office', 'Me', 'Humans'],
  headerColor: "#d4dde8",
  description: "Transforms humble work descriptions into polished achievement statements, then goes further with Strength Radar scoring, JD tailoring, Interview Prep Matrix, Voice Match, raise ammunition, and a meeting script.",
  crossRefs: ['DifficultTalkCoach', 'ColdOpenCraft'],
  guide: {
    overview: "Most people chronically understate their work. This tool fixes that — and then takes it five steps further. The core loop: add accomplishments in your own words, get them transformed into power statements with verb upgrades, then answer metrics questions to replace estimates with real numbers. But the real power is what comes after. The Strength Radar scores your sheet against role expectations and finds gaps. JD Tailoring rewrites bullets to match a specific job posting's language. The Interview Matrix maps everything to likely behavioral questions. Voice Match rewrites outputs to sound like you, not AI. And the Accomplishment Journal lets you log wins weekly so you never have to remember six months of work at once.",
    
    howToUse: [
      "Can't remember what you did? Hit the Memory Jogger button for role-specific prompting questions across 6 categories",
      "Or use the Journal to log wins weekly — import them when you're ready to build",
      "Enter your role, industry, level, tone (Bold / Balanced / Quietly Powerful), and purposes",
      "Add accomplishments one at a time — be as vague as you want — and hit Build",
      "In Before → After: tweak any bullet (Softer / Stronger / custom Reword) or generate a STAR story from it",
      "In Upgrade: answer metrics questions to replace estimates with real numbers — multi-round",
      "In Radar: see your sheet scored across 6-8 dimensions with gap suggestions",
      "In Tailor: paste a job description to get match scoring, tailored bullets, cover letter opening, and gap alerts",
      "In Interview: get 10-15 likely questions mapped to your accomplishments, with opening lines and gaps",
      "In Voice: paste a writing sample to rewrite everything in your natural voice",
      "In Raise: get business-value estimates and a meeting script — then use Difficult Talk Coach to practice the conversation"
    ],
    
    example: {
      scenario: "You are a mid-level product manager. You need to update your resume, apply for a specific job, and prepare for behavioral interviews.",
      action: "Role: Product Manager, Industry: Tech, Level: Mid-level, Purposes: Resume + Interview. Add accomplishments: 'helped improve onboarding', 'worked on the new dashboard', 'did some data analysis'. Build, then use Tailor with the JD and Interview to prep.",
      result: "Before/After: 'helped improve onboarding' → 'Redesigned user onboarding flow, reducing time-to-first-value by [35%]'. Metrics Excavator: 'What was the completion rate before vs after?' Radar: Technical Execution 80, Leadership 45 — gap found. Tailor (with JD): 78% match, 3 tailored bullets using JD keywords, 1 critical gap in 'data pipeline experience'. Interview: 12/15 questions covered, 'Tell me about a time you led under pressure' is a gap. Voice Match: rewrites all bullets to match your casual, I-focused writing style."
    },
    
    tips: [
      "Use the Journal between reviews. Even one sentence a week produces dramatically better brag sheets.",
      "The Excavator is most powerful when you fill in role + industry first — questions get very specific.",
      "After building, check Radar FIRST. It tells you where to dig for more accomplishments.",
      "For job applications: Build → Tailor with JD → Interview tab → Voice Match. That's the complete pipeline.",
      "Tweak buttons (Softer / Stronger / Reword) let you fine-tune without regenerating everything.",
      "You can add accomplishments to existing results without starting over — hit Add More.",
      "Voice Match works best with a 100+ word sample of casual professional writing."
    ],
    
    pitfalls: [
      "Don't inflate or lie. The tool reframes truthfully, and so should you.",
      "Estimated metrics in [brackets] are starting points. Use the Upgrade tab to replace them with real numbers.",
      "Tailor is for one JD at a time. For different applications, paste a different JD and re-tailor.",
      "Voice Match needs a writing sample that represents how you actually write — not something polished by someone else."
    ]
  }
},

{
  modified: "2026-03-11",
  id: "LayoverMaximizer",
  title: "Layover Maximizer",
  tagline: "Turn dead time into the best part of your trip",
  tags: [],
  icon: "✈️",
  categories: ['Out & About'],
  headerColor: "#ccdfc4",
  description: "Make the most of every layover — 9 tools for every stage of your connection. Get a YES/NO/RISKY verdict with exact time math. Step-by-step gate-to-gate directions. Live delay recalculation. Side-by-side layover comparison for booking decisions. Lounge finder matched to your cards. Context-aware packing lists. Offline-ready survival kits. Risk analysis with worst-case scenarios. Save your frequent airports.",
  guide: {
    overview: "Layover Maximizer is your complete connection toolkit — 9 views covering every stage from booking to landing. Compare layovers before you book. Get a time-math-backed verdict when you have your itinerary. Navigate gate-to-gate transfers. Track delays in real time. Find lounges matched to your credit cards. Pack smart for your specific airport. Generate an offline survival kit. Assess worst-case risks. Save airports you fly through often.",

    howToUse: [
      "✈️ Plan: Enter airport, duration, passport, terminals → YES/NO/RISKY verdict with explore + stay plans",
      "🚶 Gate-to-Gate: Enter arrival and departure gates → step-by-step transfer directions with time estimates",
      "⏰ Delay Tracker: Enter delay minutes → see how your plan changes at 30/60/90/120min thresholds",
      "⚖️ Compare: Enter 2-4 layover options → side-by-side comparison with scores and a winner",
      "🛋️ Lounges: Airport + your credit cards → every lounge with access methods and worth-it verdicts",
      "🎒 Packing: Context-aware grab list based on your specific layover — weather, currency, culture, phone",
      "🧰 Survival Kit: WiFi password, emergency numbers, key phrases, currency, outlets — screenshot-ready",
      "⚠️ Risk: What happens if you miss your connection — next flight, cost, hotel, rebooking",
      "📌 Saved: Quick-access to airports you fly through often"
    ],

    example: {
      scenario: "Booking a trip with two routing options: 4h Frankfurt or 6h Istanbul. You pick Istanbul, but your first flight gets delayed 50 minutes.",
      action: "Compare FRA vs IST (⚖️). Book IST. Before the trip, generate a Survival Kit (🧰) and Packing List (🎒). At the airport, use Delay Tracker (⏰) to check if the 50min delay kills your explore plan.",
      result: "Compare shows IST wins (86 vs 72) because you can visit the city visa-free. Packing list reminds you to grab cash and an umbrella. Delay tracker shows: 50min delay changes verdict from YES to RISKY — you have 1h40m of city time instead of 2h30m. Survival kit has the WiFi password and taxi scam warning ready."
    },

    tips: [
      "Use Compare when booking — the layover can make or break a trip",
      "Gate-to-Gate is useful on every connection, not just long layovers",
      "Generate the Survival Kit before you fly — you might not have WiFi when you land",
      "The Delay Tracker threshold scale shows exactly when to abandon your exploration plan",
      "Save your hub airports — frequent flyers keep rediscovering the same places"
    ],

    pitfalls: [
      "Immigration and security times are estimates — they vary by time of day and season",
      "AI has general airport knowledge but may not reflect very recent terminal changes",
      "Always verify visa requirements with official sources before leaving an airport in a foreign country",
      "Lounge access policies change — confirm with the lounge before walking across the terminal"
    ]
  }
},

{
  modified: "",
  id: "TheFinalWord",
  title: "The Final Word",
  tagline: "Arguments settled. Facts checked. No appeals.",
  tags: ['argument', 'last word', 'debate', 'win', 'persuade', 'rhetoric'],
  icon: "⚖️",
  categories: ['Discourse', 'Veer'],
  headerColor: "#e0b8b8",
  description: "The argument-settling, fact-checking, trivia-hosting authority. Four modes in one tool: Quick Answer delivers bold, confident responses to any factual question with confidence ratings. Settle It acts as an impartial referee when two people disagree — enter both sides, get a verdict with accuracy scores, a breakdown of who got what right, and a settlement suggestion. Fact Check gives clear TRUE/FALSE/MISLEADING rulings on any claim with explanations and myth origins. Trivia Night generates quick-fire multiple-choice rounds with team scoring, streak tracking, difficulty settings, and 10 categories — plus an 'Actually...' challenge button if you think the answer is wrong. Voice input supported on all modes.",
  guide: {
      overview: "The Final Word is four tools in one, built for settling debates, answering disputed questions, checking facts, and hosting trivia nights. Quick Answer mode takes any factual question and delivers a bold, confident response with a confidence level (certain → uncertain), supporting facts, and a bonus fun fact. Settle It mode takes two opposing claims (with optional names and context), scores each side's accuracy 0–100, declares a winner, and suggests a fun way to move on. Fact Check mode rates any claim as TRUE, FALSE, MOSTLY TRUE, MOSTLY FALSE, MISLEADING, or IT'S COMPLICATED with an explanation and myth origin. Trivia Night generates multiple-choice questions across 10 categories at 3 difficulty levels, with full team management (1–6 teams), score and streak tracking, and an 'Actually...' challenge system for disputed answers. Voice input works on all text modes.",
      howToUse: [
        "Pick a mode: Quick Answer, Settle It, Fact Check, or Trivia Night",
        "Quick Answer — type or speak a factual question and get a confident answer with confidence rating and supporting facts",
        "Settle It — enter both sides of a dispute (with optional names and context), then get a verdict with accuracy scores for each person",
        "Fact Check — enter any claim and get a clear TRUE/FALSE/MISLEADING ruling with explanation",
        "Trivia Night — set up teams (1–6), choose a category and difficulty, then play quick-fire rounds with score tracking",
        "Use the 'Actually...' button on any answer to challenge it if you think the tool got it wrong",
        "Share, copy, or print verdicts using the action buttons on results"
      ],
      example: {
        scenario: "You and a friend are arguing about whether the Great Wall of China is visible from space.",
        action: "Choose Settle It mode. Enter your friend's name and their claim ('The Great Wall is visible from space with the naked eye'), then your name and your claim ('It's not visible from space — that's a myth'). Hit 'Deliver the Verdict.'",
        result: "The Final Word rules in your favor with a bold verdict headline. Your friend scores ~15% accuracy (the Wall exists but isn't visible from low Earth orbit without aid). You score ~95% accuracy. The explanation cites astronaut testimony and the Wall's width relative to visibility thresholds. Settlement suggestion: 'Loser buys the next round — and agrees to stop spreading this myth.'"
      },
      tips: [
        "Settle It mode works best when both sides state specific, clear claims rather than vague opinions",
        "In Trivia Night, the 'Actually...' challenge system is genuinely fair — if you have a legitimate counterpoint, it will acknowledge it and adjust",
        "Voice input auto-fills the active text field — in Dispute mode it fills Person A's claim first, then Person B's",
        "For time-sensitive questions (sports stats, current rankings), the tool will acknowledge its knowledge limits and suggest where to verify",
        "Use team names in Trivia Night to make it personal — streaks of 3+ trigger a fire emoji for extra motivation"
      ]
    }
},

{
  modified: "",
  id: "NameAudit",
  title: "NameAudit",
  tagline: "Stress-test any name before you commit",
  tags: ['name', 'brand', 'business', 'rename', 'check', 'domain'],
  icon: "🔍",
  categories: ['Pursuits'],
  headerColor: "#ccdfc4",
  description: "The deepest name analysis you can get without hiring a naming agency. Stress-tests any name across 12 dimensions: phonetics, memorability (including the drunk test), global language scan for unintended meanings, visual analysis, radio test, SEO, competitive landscape, longevity, and emotional resonance. Includes live domain and social handle availability checks. Also has a head-to-head Compare mode for choosing between finalists.",
  guide: {
      overview: "NameAudit is the other half of the naming problem. NameStorm gives you ideas; NameAudit tells you if they're any good. Enter a name you're considering and get a 12-dimension analysis: first impression, phonetic profile (mouth feel, sound psychology, accent compatibility), five memorability tests (day-after, tell-a-friend, phone, drunk, and shout), radio test (can someone spell it from hearing it?), visual analysis (how it looks in different cases, as a URL, as a logo), global language scan across 15+ languages, abbreviation audit, competitive landscape, SEO outlook, longevity check, and emotional resonance. For business and product names, live domain and social handle availability checks run automatically. Use Compare mode to pit 2-4 finalists against each other for a clear winner.",
      howToUse: [
        "Choose Analyze (single name) or Compare (2-4 names head to head)",
        "Enter the name and select what it's for — Business, Product, Pet, Baby, etc.",
        "Optionally add industry context and target audience for sharper analysis",
        "Review the overall grade and verdict — STRONG, GOOD, FAIR, WEAK, or RECONSIDER",
        "Check Strengths vs. Weaknesses at a glance, and watch for any Deal Breakers",
        "Expand each analysis section for deep detail — phonetics, memorability tests, language scan, etc.",
        "For business names, scroll to Live Availability to see domain and social handle status",
        "Use the suggestions section for guidance on strengthening the name or pivoting direction"
      ],
      example: {
        scenario: "You're about to register a domain and file a trademark for your new sustainable fashion brand called 'Verdana.' Before spending money, you want to know if it's a good name.",
        action: "Enter 'Verdana' in Analyze mode, select Business, industry: 'Sustainable fashion,' target audience: 'Environmentally conscious millennials.'",
        result: "NameAudit grades it RECONSIDER with a deal breaker: Verdana is an existing Microsoft typeface — you'd face trademark issues and impossible SEO competition. The language scan notes it derives from verdant (positive). The phonetic profile is strong — warm open vowels, 3-syllable rhythm. Memorability tests pass. But the competitive landscape and trademark flags are disqualifying. Suggestions direct you toward similar-sounding alternatives that don't conflict."
      },
      tips: [
        "NameAudit and NameStorm are designed to work together — generate candidates with NameStorm, then bring your top 3 here to analyze and compare",
        "The global language scan checks 15+ languages — if you're going international, this section alone could save you from an expensive mistake",
        "Pay special attention to the Radio Test for any name that will spread by word of mouth — if people can't spell it from hearing it, they can't find you",
        "Compare mode gives a definitive winner — use it when you're stuck between finalists instead of going back and forth in your head",
        "Domain and social checks use DNS lookups and profile page checks — 'likely available' is a strong signal but always confirm through official registrars before purchasing"
      ]
    }
},

{
  modified: "",
  id: "NameStorm",
  title: "NameStorm",
  tagline: "Name anything. Know it works before you commit.",
  tags: ['name', 'brand', 'brainstorm', 'business', 'product', 'startup'],
  icon: "⚡",
  categories: ['Pursuits', 'What If?'],
  headerColor: "#ccdfc4",
  description: "AI-powered name generation with linguistic problem flagging, live domain and social handle availability checks, and 'More Like This' variations. Generates names across 15 style categories — from Clever Wordplay to Mythic to Mashup — each with pronunciation guides, Name DNA explaining why it works, and flags for unintended meanings in other languages, phonetic issues, and brand conflicts.",
  guide: {
      overview: "Naming things is hard because you need creativity, cultural awareness, and practical validation all at once. NameStorm generates 25-35 names across the style categories most relevant to what you're naming, then gives you tools to evaluate them: pronunciation guides, Name DNA explaining the linguistic psychology behind each name, problem flags for issues in other languages or phonetic traps, AI-curated Top 5 picks, a Say It Out Loud test, live domain and social handle availability checks, and a 'More Like This' button that generates 8-10 variations of any name you almost love.",
      howToUse: [
        "Select what needs a name — Business, Product, Pet, Baby, Character, Band, and more",
        "Choose vibe chips and/or describe the energy you want in the text field",
        "Optionally add constraints (length, sounds, letters) and industry context for business/product names",
        "Review the Top Picks section for the AI's curated best choices with reasoning",
        "Check the Say It Out Loud section for names that look good but sound bad",
        "Browse names by style category — each name shows pronunciation, Name DNA, and problem flags",
        "Star names you like to build a shortlist (toggle the Favorites view to see just your picks)",
        "Hit 'Check Availability' on any name to run live domain and social handle lookups",
        "Hit 'More Like This' on any name you almost love to get 8-10 variations with the same energy"
      ],
      example: {
        scenario: "You're launching a sustainable clothing brand. You want something that feels earthy and modern but not cliché — not another 'Green' or 'Eco' brand. Needs to work as a domain and Instagram handle.",
        action: "Select Business, choose vibe chips 'Earthy' + 'Sophisticated' + 'Minimalist', describe: 'Sustainable fashion brand, premium but accessible, nature-inspired without being hippie.' Industry: 'Sustainable fashion.' Constraints: 'Under 10 letters, easy to spell.'",
        result: "You get 30+ names across Nature/Organic ('Loam', 'Selva'), Minimal ('Verd', 'Nua'), Mashup/Coined ('Terrawear', 'Soluma'), and more. Each shows Name DNA: 'Loam — the 'oh' vowel creates warmth, single syllable is premium-coded, literally means nutrient-rich soil.' Problem flags catch that 'Nua' means 'naked' in Portuguese. Top picks highlight 'Selva' with reasoning. You star 3 favorites, check domain availability (selva.co is likely available), and hit More Like This on 'Loam' to get 10 variations."
      },
      tips: [
        "Vibe chips prime the AI's creative direction — select 2-4 that describe the energy, then add nuance in the text field",
        "The 'More Like This' button is the most powerful feature — when you see a name you 70% love, use it to find the one you 100% love",
        "Domain checks use DNS lookups — 'likely available' means the domain doesn't resolve, but confirm with a registrar before purchasing",
        "Problem flags check major world languages — a clean flag (✓) means no issues were found, but consider checking with native speakers for important names",
        "For business names, the best names are often in the Mashup/Coined category — they're unique, trademarkable, and more likely to have domains available"
      ]
    }
},

{
  modified: "2026-03-11",
  id: "GratitudeDebtClearer",
  title: "Gratitude Debt Clearer",
  tagline: "Helps you convert bullet points into polished thank yous.",
  tags: ['thank you', 'gratitude', 'owe', 'appreciate', 'thank'],
  icon: "💝",
  categories: ['Discourse', 'Humans'],
  headerColor: "#e0b8b8",
  description: "Turn your feelings of gratitude into heartfelt, authentic thank-you messages — without the writing paralysis. Perfect for when you genuinely appreciate someone but freeze when trying to express it formally.",
  guide: {
      overview: "The Gratitude Debt Clearer helps you convert bullet points of appreciation into polished thank-you messages. Instead of staring at a blank page wondering how to start, just list what you're grateful for and let AI craft 2-3 message options that sound like you, not a greeting card. Built specifically for people who feel gratitude deeply but struggle with the formality of expressing it in writing.",
     howToUse: [
        "Enter who you're thanking (name or description like 'the whole team')",
        "List what you're grateful for in bullet points or free-form. Be specific! The more details you give, the more personal your message will be.",
        "Select the context (post-interview, gift received, emotional support, etc.) and your relationship to the person",
        "Choose your preferred tone (warm & casual, heartfelt, professional, or brief) and adjust the length slider",
        "Click 'Generate Thank You Messages' to get 2-3 different versions. Each shows why it works and when to use it. Copy your favorite or use the 'Too mushy?' and 'More specific?' buttons to refine it."
      ],
      
      example: {
        scenario: "Your friend Sarah helped you move apartments last weekend. She spent 6 hours packing, drove the truck, brought snacks, and made you laugh when you were stressed. You want to thank her but don't know how to say it without sounding awkward or over-the-top.",
        action: "You enter: 'Sarah' as the recipient, list the specifics in bullet points ('helped me pack for 6 hours, drove the truck, brought coffee and donuts, made me laugh when I was stressed about my lease ending'), select 'Personal favor' as context, 'Personal' as relationship, and choose 'Warm & casual' tone with medium length.",
        result: "You get 2-3 message options like a warm text ('Sarah! I seriously can't thank you enough for yesterday. Six hours of packing and you never once complained — plus those donuts were clutch. You made what could've been a nightmare actually kind of fun. I owe you big time.') You can copy it directly, make it less intense, or add more specifics with one click."
      },
      
      tips: [
        "Be SPECIFIC in your gratitude points. Instead of 'helped me,' write 'spent 4 hours debugging my code' or 'listened without judging when I was struggling.' Specific details = personal messages.",
        "If a message feels too formal or mushy, click 'Too mushy?' to get a more understated version. If it's too vague, click 'More specific?' to elaborate on the details.",
        "The 'awkwardness acknowledgment' box at the top is there for a reason — it's totally normal to feel weird about formal thank-yous. The tool validates this while helping you do it anyway.",
        "Use the delivery suggestions! The AI recommends the best method (text, email, handwritten card) and timing based on your context. A post-interview thank-you should go out within 24 hours, but a friend who helped you move can get a card a few days later.",
        "Save the personalization tips — they're gold. They suggest specific details you could add to make the message even more meaningful, like mentioning how their help affected you or what you learned from them."
      ],
          pitfalls: [
      "Vague gratitude ('you've always been there for me') produces generic messages — list one to three specific moments instead",
      "The 'awkwardness acknowledgment' section only appears if the AI detects the delay or situation is emotionally complicated",
      "Handwritten card templates are intentionally shorter and simpler than the full message — that's by design"
    ],
    }
},
// ── DifficultTalkCoach tools.js entry ──
// Replace existing entry (id: "DifficultTalkCoach")
// Changes: modified date, description trimmed, tags 6→9, duplicate tips removed, pitfalls added

{
  modified: "2026-03-11",
  id: "DifficultTalkCoach",
  title: "Difficult Talk Coach",
  tagline: "Practice hard conversations before they happen",
  tags: ['difficult conversation', 'hard talk', 'confrontation', 'feedback', 'conflict', 'nervous', 'boundary', 'script', 'rehearse'],
  icon: "🗣️",
  categories: ['Read the Room', 'Humans'],
  headerColor: "#e0b8b8",
  description: "Generates multiple strategic approaches with exact scripts, predicted pushback, and counter-responses for any hard conversation — setting boundaries, giving feedback, saying no, or addressing disrespect. Includes a live practice mode where AI responds in character with real-time coaching.",
  guide: {
    overview: "The Difficult Talk Coach helps you prepare for hard conversations by generating multiple strategic approaches with exact scripts, predicted pushback, and counter-responses. Whether you need to set a boundary, request a change, address conflict, or give feedback, you'll get concrete phrases to use, body language tips, and emotional regulation strategies.",
    howToUse: [
      "Describe the conversation you need to have — the more specific, the better your strategy",
      "Select who it's with, your goals, their expected resistance level, and your communication style",
      "Check any fears you have about the conversation and add custom fears in the text field",
      "For a much stronger strategy: fill in their likely perspective and any previous attempts",
      "Review the Situation Reading, Emotional Landmines, and conversation approaches",
      "Switch to the Practice tab to run the conversation live — AI responds in character with real-time coaching",
      "After the real conversation, use the Debrief tab to process what happened and identify growth areas"
    ],
    example: {
      scenario: "You need to tell your boss that a coworker is taking credit for your work. You're afraid your boss will think you're being petty, and the coworker has more seniority.",
      action: "Describe the situation, select Boss, set resistance to 60%, goals: 'Give feedback' and 'Request a change.' Biggest fear = 'They'll tell me to just let it go.'",
      result: "You get a Situation Reading, 4 emotional landmines with strategic responses, and 3 approaches from documentation-based to direct. Each includes 6-8 anticipated responses with emotional triggers flagged. Then practice live — AI-as-boss pushes back realistically while a coach helps refine your delivery."
    },
    tips: [
      "The 'biggest fear' field is the most important optional input — it directly shapes the emotional landmine analysis",
      "Practice mode calibrates to your resistance slider — start at 40% to build confidence, then crank it to 70-80% for stress testing",
      "The opening line is the hardest part — practice saying it out loud 3-5 times before the real conversation",
      "If you get overwhelmed in practice mode, that's useful information — it tells you which moments need more preparation",
      "The debrief is more useful if you do it within 24 hours while the conversation is still fresh"
    ],
    pitfalls: [
      "Don't choose an approach that doesn't feel like you — forced scripts come across as inauthentic",
      "Skipping the 'their perspective' field produces generic strategies; fill it in for the most accurate landmine analysis",
      "Practice mode is a simulation, not a guarantee — real people are unpredictable, so stay flexible"
    ]
  }
},
{
  modified: "",
  id: "ComplaintEscalationWriter",
  title: "Complaint Escalation Writer",
  tagline: "Full escalation campaigns that companies can't ignore",
  tags: ['complaint', 'customer service', 'escalate', 'refund', 'manager', 'dispute', 'letter', 'consumer rights', 'legal', 'chargeback', 'negotiate', 'advocate', 'rights', 'BBB', 'FTC', 'regulate', 'company', 'billing'],
  icon: "📧",
  categories: ['Loot', 'Discourse'],
  headerColor: "#c0d8b8",
  description: "Builds a complete multi-stage escalation campaign when a company won't make things right. Identifies your legal leverage, writes ready-to-send letters for every stage — from direct complaint to regulatory filing to executive escalation to public pressure to chargeback — with specific laws cited, evidence coaching, and a tactical timeline. Not just a letter writer — a full consumer advocacy strategy.",
  guide: {
    overview: "Most consumer complaints fail because people don't know what leverage they actually have. This tool analyzes your situation, identifies applicable consumer protection laws, and builds a 5-stage escalation campaign — each stage increasing pressure while maintaining professionalism. Every letter, regulatory complaint, social media post, and legal filing is pre-written and ready to copy-paste-send. You start at Stage 1 and only escalate if needed.",
    
    howToUse: [
      "Name the company and select its industry (or let the tool auto-detect)",
      "Describe what happened in detail — dates, amounts, what was promised vs. delivered, names of reps",
      "Note previous resolution attempts, desired outcome, amount at stake, and what documentation you have",
      "Review the Situation Assessment to understand your legal position and likelihood of success",
      "Check the Evidence Checklist and gather documentation before sending anything",
      "Start with Stage 1 (Direct Complaint) — copy the letter and send it",
      "If Stage 1 fails, move to Stage 2 (Regulatory Filing) and continue up the ladder as needed",
      "Follow the Campaign Timeline for when to execute each stage"
    ],
    
    example: {
      scenario: "You bought a $1,200 laptop from MegaTech. It arrived defective. You returned it within their 30-day policy but they denied the refund claiming 'user damage.' You've called 3 times with no resolution.",
      action: "Enter MegaTech as the company, select Retail, describe the full situation including dates and call history, set desired outcome to 'Full $1,200 refund', amount at stake '$1,200', and documentation 'Order confirmation, photos of defect, call logs.'",
      result: "You get: a Situation Assessment showing strong legal position under Magnuson-Moss Warranty Act, an Evidence Checklist with 6 items to gather, and a 5-stage campaign — Stage 1 letter citing specific warranty law, Stage 2 pre-written FTC/state AG complaint, Stage 3 executive email to the CEO, Stage 4 factual social media posts, and Stage 5 credit card chargeback instructions with the specific Visa reason code and 120-day filing window."
    },
    
    tips: [
      "The more specific your description, the stronger every stage of the campaign will be — include dates, amounts, names, reference numbers",
      "Always gather your evidence BEFORE sending Stage 1 — the Evidence Checklist tells you exactly what to collect",
      "The tool identifies specific laws that apply to your situation — these are referenced in the letters to signal you know your rights",
      "Stage 2 (Regulatory Filing) is often the most powerful — companies are required to respond to regulatory complaints within specific timelines",
      "Don't skip straight to Stage 5 — the escalation ladder builds a documented trail that strengthens each subsequent stage"
    ]
  }
},

{
  modified: "",
  id: "PlainTalk",
  title: 'PlainTalk — Document Analyst',
  tagline: 'See through any text — plain language plus structural X-ray',
  tags: ['document', 'plain english', 'translate', 'confusing', 'contract', 'legal', 'medical', 'simplify'],
  icon: '🔍',
  categories: ['Go Deep!'],
  headerColor: "#d4dde8",
  description: "Most complex text isn't trying to confuse you — it was written for an audience that already shares a context you don't have. Paste anything and PlainTalk bridges the gap: plain-English translation plus a structural X-ray showing how the text is built — its argument, narrative, logic, or obligations — adapted automatically to what you're reading.",
  guide: {
    overview: "PlainTalk is a universal text comprehension tool. Paste any complex text — a contract, a research paper, a chapter of literature, a medical form, a political speech — and get two things: a plain-English translation anyone can understand, and a structural X-ray showing how the text is built, what each section is doing, and what matters most. The analysis adapts automatically to the type of text you provide.",

    howToUse: [
      "Paste text or upload a PDF — any length, any subject, any domain",
      "Optionally select the text type or let PlainTalk auto-detect it",
      "Optionally tell PlainTalk what you specifically want to understand",
      "Review the Overview tab for key takeaways, obligations, and structural insights",
      "Read the Full Translation tab for a complete plain-English version",
      "Explore the X-Ray tab to see how the text is architecturally built",
      "Use Side-by-Side to compare original and translation directly",
      "Follow the specialist tool suggestion if you need deeper domain analysis"
    ],

    example: {
      scenario: "You received a 12-page employment contract and you need to understand what you're actually agreeing to before signing tomorrow.",
      action: "Paste the contract text, select 'Legal' (or let it auto-detect), and add the context: 'What obligations am I taking on and what are the exit terms?'",
      result: "PlainTalk returns a plain-English translation of the entire contract, a structural X-ray showing which sections are boilerplate and which are substantive, a complete list of YOUR obligations vs. the COMPANY's obligations with asymmetry notes, all deadlines and notice periods extracted into one place, any internal contradictions flagged, and a suggestion to try OfferDissector for total compensation analysis."
    },

    tips: [
      "PlainTalk works on anything — contracts, novels, research papers, speeches, manuals, medical forms, legislation",
      "The 'What do you want to understand?' field focuses the analysis on your specific question",
      "For very long documents, paste the most important sections rather than the entire text",
      "The X-Ray view is especially powerful for legal and financial documents where structure matters",
      "If PlainTalk suggests a specialist tool, that tool provides domain-specific analysis PlainTalk intentionally doesn't attempt"
    ]
  }
},

{
  modified: "",
  id: "FocusSoundArchitect",
  title: "Focus Sound Architect",
  tagline: "Create personalized soundscapes to enhance your concentration.",
  tags: ['focus', 'sound', 'noise', 'concentration', 'music', 'ambient', 'work'],
  icon: " 🎧",
  categories: ['Energy'],
  headerColor: "#b8dcd8",
  description: "Generate personalized soundscapes for concentration based on your task, environment, and sensory needs. Creates custom mixes of white/pink/brown noise, nature sounds, binaural beats, and ambient music. Get sound layering recipes with individual volume controls and specific personalized tips.",
  guide: {
      overview: "The Focus Sound Architect generates custom soundscape recipes calibrated to your neurotype, task, environment, and auditory sensitivities. Instead of generic focus music, you get a personalized mix of sound elements with scientific explanations for why each helps your specific situation. Built with neurodivergent brains in mind - honors sensory sensitivities, provides consistency when needed, variety when needed, and always explains WHY.",
      howToUse: [
        "Select your current task (Deep work, Creative, Reading, Studying, Tedious tasks, Relaxing)",
        "Choose your environment (Noisy office, Coffee shop, Quiet home, etc.) - helps calibrate masking level",
        "Select sound preferences you like: White/Pink/Brown noise, Nature sounds (rain, ocean, forest), Ambient music, Binaural beats, ASMR triggers",
        "Indicate sensory sensitivities: Sudden sounds startle you? Need variety? Prefer consistency? Sensitive to high frequencies? Need low bass?",
        "Set energy goal with slider from Calm to Energized",
        "Generate your custom soundscape recipe with 2-4 layered elements, volume recommendations, binaural beat frequencies, usage instructions, variations to try, neurodivergent-specific tips, and troubleshooting guidance"
      ],
      example: {
        scenario: "You need to do deep work in a noisy open-plan office. Sudden sounds startle you, and you prefer consistency. You like brown noise and want to feel calm.",
        action: "Select: Task = Deep work, Environment = Noisy office + Open plan, Sounds = Brown noise, Sensitivities = Sudden sounds startle me + Prefer consistency, Energy = 25/100 (Calm)",
        result: "You receive 'Deep Focus Shield' soundscape with: (1) Brown noise at 70% volume (low frequency masking without distraction), (2) Steady rain at 20% volume (gentle variety without surprises), (3) 14Hz binaural beats (beta waves for sustained concentration). Usage: Start 5 min before work at 40% system volume. Variations: 'Energy Boost' version with 40Hz beats if feeling sluggish. Neurodivergent tips: Use this soundscape as your 'focus trigger' - Pavlovian conditioning will help you drop into flow faster over time. Troubleshooting: If still too distracting, remove rain and use just brown noise at 60%."
      },
      tips: [
        "Start soundscapes 5 minutes before you need to focus - gives your brain time to settle into the auditory environment",
        "Use the SAME soundscape each time you do a specific task type - creates a Pavlovian 'focus trigger' that helps you drop into flow faster",
        "If you have auditory processing differences, start with JUST one element (brown noise) and add complexity slowly only if needed",
        "Binaural beats require headphones to work - the left and right ears need slightly different frequencies to create the brain wave entrainment effect"
      ]
    }
},

{
  modified: "",
  id: "FocusPocus",
  title: "Focus Pocus",
  tagline: "Lock in. Get pulled out. Take care of yourself.",
  tags: ['focus', 'timer', 'session', 'productivity', 'distraction', 'pomodoro', 'work'],
  icon: "🎩",
  categories: ['Energy', 'Do It!'],
  headerColor: "#b8dcd8",
  description: "A focus session timer that keeps you on task, then pulls you out when time's up — with escalating urgency if you ignore it.",
  guide: {
      overview: "Focus Pocus manages both sides of attention: it keeps you locked in during your session (FocusWall), then interrupts you when time's up (HyperfocusInterrupter). If you try to quit early, it pushes back. If you go overtime, it escalates. When you finally break, it generates a personalized recovery plan based on what you were doing and how long you went.",

      howToUse: [
        "Name what you're focusing on and pick a session length (or use a Pomodoro preset)",
        "Optionally add context — upcoming obligations, skipped meals — for smarter breaks",
        "Hit Start. The timer runs even if you close the tab",
        "If you want to quit early, the tool pushes back — but won't trap you",
        "When time's up, take the break or snooze (max 3 times). Urgency escalates",
        "Get a personalized break plan with mandatory actions and a re-entry strategy"
      ],

      example: {
        scenario: "You're 2 hours into coding a new feature. You set a 60-min session but snoozed twice.",
        action: "Focus Pocus escalates from gentle nudge to urgent intervention, then generates a break plan tailored to prolonged coding: eye rest, wrist stretches, hydration, and a bookmark for where you left off.",
        result: "You take a real break, come back sharper, and your next session is more productive because you're not running on fumes."
      },

      tips: [
        "The 25-minute Pomodoro preset is great for getting started — extend once you build the habit",
        "Fill in the optional context for much better break plans (especially upcoming obligations)",
        "If you keep hitting snooze, that's data — try shorter sessions next time",
        "Your session persists even if you close the tab, so don't worry about losing progress"
      ],

      pitfalls: [
        "Setting unrealistically long sessions (start with 25-45 min, not 3 hours)",
        "Ignoring the break plan actions — they're short and your body needs them",
        "Using pause as a loophole to extend indefinitely"
      ]
    }
},
// ── DecisionCoach tools.js entry ──
// Replace the existing entry (search for id: "DecisionCoach")
// Changes: modified date added, tags expanded from 7 → 9

{
  modified: "2026-03-11",
  id: "DecisionCoach",
  title: "Decision Coach",
  tagline: "One answer. No second-guessing.",
  tags: ['decision', 'stuck', 'choice', 'pros cons', 'dilemma', 'options', 'clarity', 'paralysis', 'overwhelmed'],
  icon: "🎯",
  categories: ['Veer'],
  headerColor: "#f5e0c0",
  description: "Makes the decision for you when you're too stuck to choose. Applies your constraints and preferences to give you ONE answer with execution steps — no options, no second-guessing.",
  guide: {
    overview: "Choice paralysis happens when you're too overwhelmed to decide but still know what you want/need. This tool applies your constraints and preferences to make THE decision (singular), removing the burden of choice while respecting your values.",

    howToUse: [
      "Pick a decision category (food, task, purchase, activity)",
      "Describe what needs to be decided",
      "Tap quick constraints (low effort, cheap, no cooking, etc.) and add specifics",
      "Set your current capacity level",
      "Get ONE decision with step-by-step execution"
    ],

    example: {
      scenario: "You're overwhelmed and can't decide what to eat for dinner. You're vegetarian, have no energy to cook, budget is under $15, want comfort food, and nothing spicy today. You've been staring at delivery apps for 20 minutes unable to choose.",
      action: "Decision: 'What to eat for dinner', Preferences: 'Vegetarian, no dairy, under $15, no cooking energy, comfort food, nothing spicy', Capacity: Overwhelmed.",
      result: "DECISION: Order veggie burrito bowl from Chipotle. Why: Meets all constraints - vegetarian, no dairy (skip cheese/sour cream), under $15, delivery (no cooking), comfort food, customizable to avoid spice. Steps: 1. Open Chipotle app, 2. Order burrito bowl with brown rice, black beans, veggies, guac, lettuce, salsa (skip cheese and sour cream), 3. Delivery, 4. Submit. DONE. This choice is FINAL."
    },

    tips: [
      "Pre-load preferences clearly (hard constraints like allergies vs preferences like mood)",
      "The tool gives ONE answer intentionally - options would restart the paralysis",
      "Actually follow the 'no second-guessing' instruction - that's the hardest part",
      "Use this proactively when you feel paralysis starting, not after 30 min of agonizing",
      "The decision is good enough - perfect doesn't exist when you're overwhelmed"
    ],

    pitfalls: [
      "Don't ask for 'options' - that defeats the purpose. You need a decision made FOR you",
      "If you second-guess the answer, you're probably not being honest about your preferences",
      "This is for when you're too overwhelmed to choose, not for fun exploratory decisions"
    ]
  }
},
{
  modified: "",
  id: "SixDegreesOfMe",
  title: "Six Degrees of Me",
  tagline: "The hidden chain between any two parts of your life",
  tags: ['connection', 'network', 'path', 'introduction', 'reach', 'who knows who'],
  icon: "🔗",
  categories: ['Go Deep!', 'Me'],
  headerColor: "#d4dde8",
  description: "Find the hidden connections between any two seemingly unrelated parts of your life. Your college major and your career, your childhood hobby and your friend group, your biggest fear and your favorite food. The chain is always there -- you just can't see it yet.",
  guide: {
    overview: "Everything in your life is connected by threads you've never noticed. This tool traces the chain between any two things -- your philosophy degree and your coding career, your fear of flying and your love of sushi. Build a profile once, then play endlessly.",

    howToUse: [
      "Fill in your About Me profile (once -- it persists and makes every chain richer)",
      "Type any two things from your life into Thing A and Thing B",
      "Hit 'Find the Chain' and see the hidden connections",
      "Try 'Flip It' to trace the reverse path -- different route, different insight",
      "Use 'Surprise me' for random pair starters to get ideas"
    ],

    example: {
      scenario: "You studied philosophy in college and now you write software for a living. These feel completely unrelated.",
      action: "Thing A: 'My philosophy degree', Thing B: 'My career in software'. Profile includes: schools, jobs, interests.",
      result: "4-degree chain: Philosophy degree -> trained you to decompose arguments into logical premises -> you instinctively started modeling everything as boolean conditions -> your first 'program' was a decision tree you drew for a philosophy paper -> software engineering. Insight: You didn't change careers -- you just found a field that pays you for the same skill philosophy taught you for free."
    },

    tips: [
      "The more profile context you give, the more personal and surprising the chains get",
      "Try pairing things from very different life domains -- the wider the gap, the more interesting the chain",
      "Flip It often finds a completely different path -- same endpoints, new insight",
      "Share chains with friends -- they'll see connections in your life you missed",
      "This is great for self-reflection, journaling prompts, and 'how did I get here' moments"
    ],

    pitfalls: [
      "Very abstract inputs ('happiness' and 'success') produce generic chains -- be specific",
      "The chains are plausible interpretations, not proven facts -- enjoy the pattern-finding",
      "Don't skip the profile -- without context, the connections will be surface-level"
    ]
  }
},

{
  modified: "2026-03-10",
  id: "BrainRoulette",
  title: 'Brain Roulette',
  tagline: 'Personalized rabbit holes you can\'t resist',
  tags: ['random', 'interesting', 'curious', 'learn', 'discover', 'bored', 'fun', 'trivia', 'facts', 'knowledge', 'rabbit hole', 'explore', 'learning', 'curiosity', 'deep dive', 'debate', 'digest', 'daily', 'discovery', 'interests', 'spin', 'mind expanding', 'education'],
  icon: '🎲',
  categories: ['Diversions', 'Detour'],
  headerColor: "#b8dcd8",
  description: 'Spin for fascinating rabbit holes tuned to YOUR interests. AI finds the surprising intersections between topics you love — the kind of stuff you can\'t stop thinking about.',
  guide: {
    overview: "Brain Roulette is an AI-powered discovery engine that generates fascinating, personalized rabbit holes. Unlike random fact generators, it finds the unexpected INTERSECTIONS between your interests — where history meets food, where psychology meets technology, where space meets philosophy. Each spin is unique, and a secret wildcard topic gets woven in to keep things unpredictable.",

    howToUse: [
      "STEP 1: Pick 2 or more interests from the grid — the more you pick, the wilder the connections",
      "STEP 2: Choose your depth — Quick Hit (2-3 sentences), Short Rabbit Hole (a paragraph with a twist), or Deep Dive (multi-section exploration)",
      "STEP 3: Hit Spin! Or use Surprise Me to go completely random",
      "STEP 4: Found something fascinating? Hit 'Go Deeper' to explore follow-up threads",
      "STEP 5: Save your favorites to build a personal collection of mind-blowing connections"
    ],
    example: {
      scenario: "You have History and Food selected, depth set to 'Short Rabbit Hole'",
      action: "Hit Spin",
      result: "You get a fascinating piece about how Roman gladiators were mostly vegetarian — nicknamed 'barley men' — and how their high-carb diet was deliberately designed to build a fat layer that protected them from surface wounds in the arena. The AI connects this to modern sports nutrition debates. Three 'Go Deeper' threads let you explore gladiator training diets, the economics of arena food vendors, or why we got gladiator diets completely wrong in movies."
    },
    tips: [
      "Pick interests that seem unrelated — that's where the best connections hide",
      "Use 'Surprise Me' when your usual interests feel stale — the wildcard might reveal a new obsession",
      "The 'Go Deeper' threads are where the real magic happens — they often lead to even better discoveries",
      "Share snippets with friends — these make great conversation starters",
      "Your spin streak tracks consecutive sessions — see how long you can keep it going",
      "The AI remembers what you've already seen and won't repeat topics"
    ],
    pitfalls: [
      "Selecting just one interest gives decent results, but 2-3 interests create much better cross-connections",
      "If you get a dud, just spin again — the randomness means occasional misses",
      "Deep Dive mode takes a bit longer to generate but is worth the wait",
      "This tool is deliberately addictive — set a timer if you need to!"
    ]
  },
  crossRefs: ['BeliefStressTest', 'SixDegreesOfMe', 'DecisionCoach'],
},

{
  modified: "",
  id: "FinalWish",
  title: "Final Wish",
  tagline: "Organize what matters. Say what needs to be said.",
  tags: ['legacy', 'estate', 'end of life', 'planning', 'documents', 'death', 'wishes'],
  icon: "📜",
  categories: ['Humans', 'Me'],
  headerColor: "#e0b8b8",
  description: "AI-guided digital legacy planner that helps you organize accounts, documents, finances, and personal messages into a single printable document for your trusted person.",
  guide: {
      overview: "FinalWish walks you through an AI-guided interview to build a comprehensive digital legacy package — covering accounts, documents, finances, personal messages, and practical wishes. Everything exports as a self-contained, printable HTML document you hand to someone you trust. Nothing is stored.",
      howToUse: [
        "Name your trusted person — their name is woven throughout the document to make it personal",
        "Walk through 5 chapters: Digital Accounts, Documents, Financial Snapshot, Personal Messages, and Practical Wishes",
        "Use the AI to extract and organize accounts from free-text descriptions — just dump what comes to mind",
        "In the Messages chapter, the AI interviews you about each recipient then drafts a letter in your voice — edit, adjust tone, or rewrite",
        "Review your completed document and download as a printable HTML file to hand to your trusted person"
      ],
      example: {
        scenario: "You want to make sure your partner could handle your digital life if something happened to you",
        action: "Start FinalWish, name your partner, and describe your accounts naturally: 'Gmail, Chase checking, Netflix, Instagram...' The AI extracts and categorizes them, then asks follow-ups about crypto, cloud storage, subscriptions you might forget.",
        result: "A polished, printable document with 15 categorized accounts, document locations, a financial map, a heartfelt letter to your partner drafted from your interview answers, and pet care instructions — all in one downloadable file."
      },
      tips: [
        "Don't include actual passwords — use access hints like 'password is in blue notebook' or 'use phone Face ID'",
        "The Messages chapter is the heart of the tool — take your time with it. Specific memories beat generic sentiment.",
        "You can skip any chapter and come back later — the progress bar shows what's filled",
        "Review and update your document annually or after major life changes",
        "This is NOT a legal will — consult an attorney for legal estate planning"
      ]
    }
},

{
  modified: "2026-03-08",
  id: "BikeMedic",
  title: "Bike Medic",
  tagline: "A trailside mechanic in your pocket",
  tags: ['bike', 'bicycle', 'repair', 'maintenance', 'cycling', 'fix', 'mechanic', 'flat', 'tire', 'brakes', 'shifting', 'gears', 'derailleur', 'chain', 'wheel', 'spoke', 'noise', 'trailside', 'DIY'],
  icon: "🚲",
  categories: ['The Grind'],
  headerColor: "#d4dde8",
  crossRefs: ['BuyWise', 'DecisionCoach'],
  description: "AI-enhanced bicycle troubleshooting with interactive step-by-step fixes, animated visual demos, and expert follow-up when standard repairs don't work.",
  guide: {
      overview: "Bike Medic walks you through diagnosing and fixing common bicycle problems with animated visual demos, interactive step tracking, and AI-powered deeper diagnosis when standard fixes fail. Set up your bike profile to skip irrelevant questions and get tailored advice.",
      howToUse: [
        "Select the problem category or describe your symptom in the AI analyzer to get routed to the right fix",
        "Answer diagnostic questions to narrow down the exact cause — your bike profile auto-skips known answers",
        "Follow the step-by-step fix with animated visual guide and check off steps as you complete them",
        "If the fix doesn't resolve it, tap 'Still broken' for AI-powered deeper diagnosis that accounts for what you already tried",
        "Use Quick Checks mode for pre-ride, post-crash, after-rain, long-storage, or before-tour checklists"
      ],
      example: {
        scenario: "Your rear disc brake makes a constant scraping noise while riding",
        action: "Select 'Brake Problems' → 'Disc brakes' → 'Rubbing' → Follow the caliper centering steps with animated demo",
        result: "Step-by-step caliper alignment with play/pause animation. If it still rubs, hit 'Still broken' and the AI suggests checking for a bent rotor, warped caliper mount, or contaminated pads."
      },
      tips: [
        "Set up your Bike Profile via the gear icon to auto-skip questions about brake type, shifting system, and tire setup",
        "The static troubleshooting tree works without AI — great for trailside or offline use",
        "Use Quick Checks before long rides or after crashes to catch problems before they strand you",
        "Every fix includes a Parts & Shopping List with real part names, examples, and price ranges"
      ]
    }
},

{
  modified: "",
  id: "WardrobeChaosHelper",
  title: 'Wardrobe Chaos Helper',
  tagline: "AI picks your outfit. No more decision fatigue.",
  tags: ['clothes', 'outfit', 'closet', 'wardrobe', 'wear', 'fashion', 'dressing', 'style help', 'packing', 'laundry'],
  icon: '👗👔',
  categories: ['The Grind'],
  headerColor: "#d4dde8",
  description: 'AI picks complete outfits from your wardrobe based on weather, activities, mood, and sensory needs. Perfect for anyone overwhelmed by daily choices.',
  guide: {
    overview: "Decision fatigue is real, especially when it comes to picking outfits. This tool learns your wardrobe and suggests complete outfit combinations based on your day's needs. It considers weather, activities, your mood, comfort preferences, and sensory requirements. Particularly helpful for anyone who finds daily outfit decisions overwhelming.",
    
    howToUse: [
      "STEP 1: Build your wardrobe inventory (one-time setup, then just maintain)",
      "Add items to each category (tops, bottoms, dresses, outerwear, shoes)",
      "Include comfort ratings and sensory notes (soft fabric, no tags, etc.)",
      "Upload photos to help remember what items look like",
      "STEP 2: Describe today's needs - weather, activities, mood",
      "STEP 3: Get 3-5 complete outfit suggestions with comfort/style ratings"
    ],
    example: {
      scenario: "It's a rainy Tuesday. You have a work meeting and need to feel confident, but you're low energy and need sensory-friendly clothes (soft fabrics, loose fit). Comfort priority is 8/10.",
      action: "Input: Weather = Rainy, Activities = Work + Meeting, Mood = Confident, Comfort = 8/10, Sensory = Soft fabrics + Loose fit",
      result: "Outfit #1: Navy cotton t-shirt (comfort 9/10) + Black jogger pants (comfort 10/10) + White sneakers + Gray hoodie (for rain). Comfort: 9/10, Style: 6/10, Sensory-friendly ✓. Why: The cotton and joggers are your softest items. The dark colors look pulled-together for video calls while feeling like pajamas. Hoodie keeps you dry without a jacket. Confidence boost: You'll look professional from the waist up on camera and feel maximum comfort all day. Outfit #2: Green sweater (soft merino, comfort 8/10) + Black leggings + Canvas slip-ons. Plus 2-3 more options. Tips: Lay out clothes tonight so morning is easier. If stuck choosing, pick the softest option - you can't think clearly if uncomfortable. Backup: If overwhelmed, just wear the black joggers + any soft t-shirt + hoodie. Done."
    },
    tips: [
      "Do the wardrobe setup once when you have energy - then it's just maintenance",
      "Add sensory notes to items: 'scratchy wool', 'tags removed', 'loose fit'",
      "Higher comfort numbers (comfort level 7+) will be suggested more on low-energy days",
      "The 'backup option' is always the simplest possible outfit - use it when overwhelmed",
      "Save favorite combinations (star icon) to repeat them without thinking",
      "Update weather/activities daily but wardrobe stays constant",
      "Photos help A LOT if you have trouble visualizing items from text"
    ],
    pitfalls: [
      "Don't overthink the wardrobe setup - add items gradually over time",
      "Be honest about comfort ratings - a '10' should be like wearing pajamas",
      "If suggestions don't match your style, adjust mood/comfort priority settings",
      "The tool can't see your clothes - accurate descriptions matter (colors, style)",
      "Don't try to build entire wardrobe in one sitting - add 5-10 items to start"
    ]
  }
},

{
  modified: "",
  id: "PlantRescue",
  title: 'Plant Rescue',
  tagline: 'Diagnose and rescue your struggling plants',
  tags: ['plant', 'garden', 'water', 'dying', 'care', 'houseplant'],
  icon: '🪴',
  categories: ['The Grind'],
  headerColor: "#1e2a3a",
  description: 'Diagnose struggling plants and get step-by-step rescue plans. Upload a photo or describe symptoms to identify species, analyze problems (yellowing, wilting, spots), and receive prioritized action plans with recovery timelines.',
  guide: {
    overview: "Your plant is dying and you don't know why. This tool uses AI image analysis to identify your plant species, diagnose problems (overwatering, pests, nutrient deficiency), and provide a prioritized rescue plan. Upload a photo of the affected leaves/stems or describe symptoms, and get expert advice within seconds.",
    
    howToUse: [
      "Upload a clear photo of your plant (focus on affected areas) OR describe symptoms",
      "Add environmental details: light level, watering frequency, location",
      "Optional: How long you've had the plant",
      "Get instant diagnosis with severity rating",
      "Follow prioritized action plan (Priority 1 = do immediately)"
    ],
    
    example: {
      scenario: "Your fiddle leaf fig has yellowing lower leaves with brown spots. You water it every 3 days and it's in a bright corner indoors.",
      action: "Upload photo of affected leaves. Select 'Partial shade' for light, 'Every few days' for watering, 'Indoor' for location.",
      result: "Diagnosis: CONCERNING - Overwatering with early root rot. Primary problem: Too-frequent watering for indoor conditions. Action Plan: Priority 1 (NOW): Stop watering for 7-10 days, check soil moisture before next watering. Priority 2 (Today): Move to brighter location with more air circulation. Priority 3 (This week): Check drainage - pot should have holes, soil should dry between waterings. Environmental adjustments: Water: Only when top 2 inches of soil are dry (test with finger). Light: Move closer to window for 4-6 hours indirect sun. Recovery timeline: 3-4 weeks if root rot hasn't spread. Is saveable: Yes, if acted on quickly."
    },
    
    tips: [
      "Take photos in good lighting - show both the whole plant and close-ups of problem areas",
      "Be honest about watering frequency - overwatering is the #1 killer",
      "Follow the priority order - Priority 1 actions are urgent",
      "The tool identifies common issues: overwatering, underwatering, light problems, pests, disease",
      "If diagnosis says 'critical', act within 24 hours",
      "Prevention tips help avoid the same problem recurring"
    ],
    
    pitfalls: [
      "Photos need to be clear - blurry images make diagnosis difficult",
      "Don't skip environmental questions - they're crucial for accurate diagnosis",
      "If plant is already dead (crispy, black, mushy throughout), may be too late",
      "Tool gives general advice - for rare plants or persistent issues, consult a local nursery",
      "Some problems take weeks to show improvement - be patient with recovery timeline"
    ]
  }
},

{
  modified: "",
  id: "ConflictCoach",
  title: "Conflict Coach",
  tagline: "Stop, breathe, and craft the right response",
  tags: ['text', 'argument', 'fight', 'respond', 'message', 'conflict', 'communication', 'de-escalate', 'anger', 'manipulation', 'gaslighting', 'passive aggressive', 'relationship', 'boundaries', 'texting'],
  icon: "📱",
  categories: ['Discourse', 'Humans'],
  headerColor: "#e0b8b8",
  description: "Received a tense message? Don't respond reactively. Get de-escalating response suggestions, emotional analysis, and thoughtful strategies. Prevents regrettable texts.",
  guide: {
    overview: "The Conflict Coach helps you respond to tense, upsetting, or confrontational messages without escalating. Paste the message you received, and get emotional analysis, multiple response strategies (validate, set boundaries, disengage gracefully), and warnings about what NOT to say. Built for people who freeze during conflict, escalate when defensive, or struggle to read tone. Includes cooling-off timers and repair strategies.",
    
    howToUse: [
      "Paste the tense/upsetting message you received",
      "Select your relationship to the sender (Partner, Family, Friend, etc.)",
      "Check how you're feeling right now (Angry, Hurt, Defensive, etc.)",
      "Select what you want to achieve (Resolve, Set boundary, Disengage, etc.)",
      "Optional: Show what you're tempted to say (we'll analyze why not to send it)",
      "Click 'Help Me Respond Thoughtfully'",
      "Get emotional temperature reading of their message",
      "Review 3-5 different response strategies with pros/cons",
      "See reflection questions before sending",
      "Copy the response that feels right",
      "Optional: Start 20-minute cooling-off timer",
      "Get repair strategy for reconnecting later"
    ],
    
    example: {
      scenario: "Your partner texts: 'I can't believe you did that again. You never think about how your actions affect me. This is exactly why we have problems. I'm so sick of this.' You're feeling defensive and hurt.",
      action: "Paste message, select 'Partner', check 'Defensive' and 'Hurt', select 'Validate without conceding' and 'Set a boundary', click analyze",
      result: "Get analysis showing HIGH emotional temperature, anger/hurt detected, triggers identified ('never', 'exactly why'). Receive 4 response options: 1) Validate: 'I hear that you're really upset. I want to understand. Can we talk when we're both calmer?' 2) Boundary: 'I'm willing to talk about this, but not when we're attacking each other.' 3) Disengage: 'I need time to process this. Let's talk tomorrow.' 4) Schedule: 'This feels too big for text. Can we talk in person tonight?' Plus warnings about NOT saying 'You're overreacting' or 'That's not true', cooling-off time recommendation, and repair strategy for later."
    },
    
    tips: [
      "Use the 'What I want to say' field - writing it out helps process emotions",
      "Read ALL response strategies before choosing - different approaches for different goals",
      "Pay attention to the 'risks' section - no response is perfect",
      "Start the cooling-off timer if you're feeling reactive",
      "Check 'What NOT to say' section before sending anything",
      "Copy the response but read it again before sending - make sure it feels authentic",
      "If emotional temperature is HIGH, wait before responding",
      "Remember: Goal is to respond thoughtfully, not to 'win'",
      "Save drafted responses in your notes app to review later",
      "Use repair strategies after conflict cools down"
    ],
    
    pitfalls: [
      "Don't send a response while still in high emotional state",
      "Don't ignore the 'risks' section - be prepared for reactions",
      "Don't use suggested responses verbatim if they don't feel authentic to you",
      "Don't skip the cooling-off period if recommended",
      "Don't keep responding if they escalate further",
      "Don't use this to 'win' arguments - use it to de-escalate",
      "Don't forget: Sometimes the best response is no response (temporarily)",
      "This isn't a replacement for therapy or professional conflict resolution"
    ],
    
    quickReference: {
      "Emotional Temperature": "High = attacking, Medium = frustrated, Low = calm",
      "Validate Strategy": "Acknowledge emotion without accepting blame",
      "Boundary Strategy": "Draw line without escalating",
      "Disengage Strategy": "Exit gracefully without ghosting",
      "Cooling Off": "20 min to 24 hours depending on temperature",
      "What NOT to Say": "Avoid 'always/never', 'calm down', defensiveness",
      "Escalation Response": "Set boundary then STOP responding"
    }
  }
},

{
  modified: "",
  id: "TaskAvalancheBreaker",
  title: "Task Avalanche Breaker",
  tagline: "Turn that overwhelming mountain into micro-steps",
  tags: ['overwhelm', 'todo', 'too much', 'prioritize', 'anxiety', 'procrastination'],
  icon: "⛏️",
  categories: ['Do It!', 'Energy'],
  headerColor: "#d4dde8",
  description: "Turn overwhelming projects into 5-minute micro-tasks. Built for that 'too big to start' paralysis. No decisions required.",
  guide: {
    overview: "The Task Avalanche Breaker converts overwhelming projects into ultra-specific micro-tasks that require ZERO decision-making. Built specifically for  anyone experiencing 'too big to start' paralysis. Each task is broken down to 2-5 minute chunks with clear completion criteria and momentum-building sequencing.",
    
    howToUse: [
      "Describe your overwhelming project (garage cleanup, thesis writing, etc.)",
      "Check why it feels overwhelming (too many steps, don't know where to start, etc.)",
      "Set your available time (5-30 minutes)",
      "Adjust energy level slider to current state (exhausted to energized)",
      "Click 'Break This Down for Me' to get micro-tasks",
      "See total tasks, estimated time, and project complexity",
      "Focus on highlighted 'Next Task' - just this one thing",
      "Start the timer for the task (optional but helpful)",
      "Complete task and click 'I Did It!' to celebrate and move on",
      "Click 'This Is Too Hard' button to break task down further",
      "Stop at any time - progress is progress, no failure here"
    ],
    
    example: {
      scenario: "You need to clean your garage but it's been years and you're completely overwhelmed. You don't know where to start, it's emotionally difficult (sentimental items), and there are too many steps.",
      action: "Enter 'Clean out my garage', check 'Too many steps', 'Don't know where to start', and 'Emotionally difficult', set energy to 3/10 (tired), click Break Down",
      result: "Get 25 micro-tasks starting with: Task 1: 'Stand in garage doorway (don't go in, just stand there)' - 30 seconds. Task 2: 'Get three trash bags from kitchen' - 1 minute. Each task ultra-specific, no decisions needed, builds momentum. After 5 tasks, get celebration checkpoint with permission to stop."
    },
    
    tips: [
      "Do ONLY task 1 if that's all you can manage - that's real progress",
      "Use the timer - it makes tasks feel finite and manageable",
      "If a task feels too hard, click 'This Is Too Hard' for breakdown",
      "You're allowed to stop after ANY task - there's no failure",
      "First 5 tasks are momentum builders - absurdly simple on purpose",
      "Tasks are ordered to avoid decision-making when energy is low",
      "Completion criteria tells you EXACTLY when you're done",
      "Check off tasks to see visual progress - it's motivating!",
      "Celebrate at checkpoints - you're making real progress",
      "Don't have to finish the whole project - any progress counts"
    ],
    
    pitfalls: [
      "Don't skip ahead to 'interesting' tasks - sequence matters for momentum",
      "Don't add decisions to tasks ('should I keep this?' = stop, use later box)",
      "Don't expect to finish everything in one session - chunking is the point",
      "Don't judge yourself for needing tiny steps - executive function is real",
      "Don't feel bad using 'This Is Too Hard' - it's there for a reason"
    ],
    
    quickReference: {
      "Purpose": "Break overwhelming projects into 5-min micro-tasks",
      "For": "task paralysis, overwhelm, procrastination, productivity",
      "Key Feature": "ZERO decision-making within tasks",
      "Task Size": "2-5 minutes, ultra-specific",
      "Completion": "Clear criteria, you know when done",
      "Permission": "Stop after ANY task, progress is progress",
      "Special Buttons": "'This Is Too Hard' breaks task down further"
    }
  }
},

{
  modified: "",
  id: "PetWeirdnessDecoder",
  title: "Pet Weirdness Decoder",
  tagline: "Is it quirky or concerning? Let's find out",
  tags: ['pet', 'dog', 'cat', 'behavior', 'weird', 'animal'],
  icon: "🐾",
  categories: ['The Grind'],
  headerColor: "#d4dde8",
  description: "Is your pet's weird behavior quirky or concerning? Get AI analysis to distinguish between adorable quirks and symptoms that need a vet visit.",
  guide: {
    overview: "The Pet Weirdness Decoder helps anxious pet parents understand unusual pet behaviors. Using AI analysis of species-specific behaviors, breed tendencies, and age-related patterns, it distinguishes between normal quirks (enjoy them!), behaviors worth monitoring, and symptoms requiring veterinary attention. NOT a replacement for vet advice - designed to reduce anxiety while being responsible about health concerns.",
    howToUse: [
      "Select your pet type (Dog, Cat, Bird, Rabbit, or Other)",
      "Enter breed (optional but helps with breed-specific behaviors)",
      "Enter pet's age in years",
      "Describe the weird behavior in detail",
      "Select how long it's been happening and how often",
      "Check any other changes you've noticed (eating, energy, bathroom, sleep, mood)",
      "Click 'Decode This Weirdness' to get analysis",
      "Review urgency level: 😂 Normal Quirk, 🤔 Monitor, ⚠️ Vet Soon, or 🚨 Vet Now",
      "Read the most likely explanation and why they do it",
      "Check red flags to know when to worry",
      "Follow recommendations for monitoring or vet visit"
    ],
    example: {
      scenario: "Your 3-year-old Golden Retriever has started spinning in circles 3-4 times before lying down in her bed. She's been doing it for a few weeks, multiple times daily. She's eating and acting normal otherwise.",
      action: "Select Dog, enter 'Golden Retriever' for breed, age 3, describe the spinning behavior, select 'Weeks' for duration and 'Multiple times daily' for frequency",
      result: "Get analysis showing: 😂 Quirky & Normal - 'Pre-bedtime circling ritual. Ancestral behavior from wild dogs creating comfortable sleeping spots. Completely adorable and normal!' Plus enrichment suggestions and when to worry if behavior changes."
    },
    
    tips: [
      "Be detailed in behavior description - include what happens before, during, and after",
      "Note any patterns (time of day, specific situations, triggers)",
      "Check all 'other changes' boxes that apply - combinations matter",
      "Don't downplay concerns - if you're worried enough to check, mention it",
      "For quirky behaviors, enjoy the AI's humor and reassurance",
      "For concerning behaviors, use the vet questions list at your appointment",
      "Document with photos/video as suggested for vet visits",
      "Remember: This tool helps identify patterns, not diagnose conditions",
      "When in doubt, always call your vet - that's what they're there for!",
      "Trust your pet parent instincts - you know your pet best"
    ],
    
    pitfalls: [
      "Don't use this as a replacement for emergency vet care",
      "Don't delay vet visits if you're genuinely concerned",
      "Don't ignore red flags even if analysis says 'monitor'",
      "Remember breed matters - 'normal for Husky' might not be normal for Chihuahua",
      "Age context is crucial - puppy zoomies vs senior disorientation are different",
      "Multiple other changes usually means vet visit, not just monitoring",
      "Tool is educational, not diagnostic - vet has training and can examine pet"
    ],
    
    quickReference: {
      "😂 Quirky & Normal": "Enjoy it! Totally normal behavior",
      "🤔 Worth Monitoring": "Keep an eye on it, note patterns",
      "⚠️ Vet Soon": "Schedule appointment within days",
      "🚨 Vet Now": "Call vet immediately or go to emergency",
      "Red flags": "Always call vet if these appear",
      "Documentation": "Photos/videos help vets diagnose",
      "Disclaimer": "Educational only, not replacing vet advice"
    }
  }
},

{
  modified: "",
  id: "FakeReviewDetective",
  title: "Fake Review Detective",
  tagline: "Spot fake reviews before you get burned",
  tags: ['review', 'paranoid', 'feedback', 'rating', 'fake', 'trust', 'product'],
  icon: "🔍",
  categories: ['Loot'],
  headerColor: "#c0d8b8",
  description: "Import reviews from a URL or paste them manually. Computes real statistics, then AI scores each review individually and detects manipulation patterns.",
  guide: {
    overview: "Fake Review Detective uses a two-phase approach: first, JavaScript computes real statistics from your pasted reviews (star distribution, verified %, date clusters, language flags) — instant, no AI needed. Then AI scores each review individually for authenticity (0-100 with red/green flags) and analyzes cross-review patterns (manipulation detection, genuine consensus, purchase recommendation). Every number you see is computed, not hallucinated.",
    
    howToUse: [
      "Paste a product URL to auto-extract reviews, OR paste review text manually",
      "Extracted reviews appear in the text area — edit them if needed",
      "Select the product category for category-specific benchmarking (auto-detected from URLs)",
      "Click 'Detect Fakes' — instant stats appear immediately",
      "AI then scores each review individually (Step 1) and analyzes patterns (Step 2)",
      "Review the Quick Verdict card for the overall trust score",
      "Expand individual review cards to see per-review red/green flags",
      "Check the Genuine Consensus section for what real reviews actually say",
      "Use the Purchase Recommendation to inform your decision"
    ],
    
    example: {
      scenario: "You're considering wireless headphones with 4.5 stars but the reviews seem suspicious — lots of 5-star reviews posted on the same day with generic language, plus a few detailed reviews from verified buyers",
      action: "Paste all the reviews, select 'Electronics' category, click Detect Fakes",
      result: "Instant stats show: 37% verified (red flag), date cluster of 3 reviews within 48 hours. AI scores the generic 5-star reviews at 15-25/100 (likely fake) and the detailed verified reviews at 80+/100 (likely genuine). Quick Verdict: Trust Score 42/100 — 'Approach with Caution.' Genuine consensus: decent sound quality, weak bass, comfortable for short sessions. Verdict: WAIT for more verified reviews."
    },
    
    tips: [
      "Include as many reviews as possible — pattern detection improves with volume (minimum 100 characters, 3+ reviews recommended)",
      "Copy reviews with their star ratings and dates for timeline analysis",
      "The instant stats panel gives useful data even before the AI runs",
      "Sort reviews 'Most suspicious first' to quickly find the fakes",
      "The Genuine Consensus section is the most actionable — it tells you what the product actually is based on reviews you can trust",
      "Try the example reviews to see the tool in action before pasting your own"
    ],
    
    pitfalls: [
      "Don't paste just 1 review — pattern detection requires multiple reviews",
      "Not every 5-star review is fake — some products are genuinely great",
      "URL extraction may fail on sites that require JavaScript or block automated requests — paste reviews manually as a fallback",
      "AI analysis is guidance, not a guarantee — always use your own judgment",
      "Low trust score means the review SET is unreliable, not that the product is bad"
    ]
  }
},

{
  modified: "",
  id: "CrashPredictor",
  title: "Crash Predictor",
  tagline: "Spot your burnout patterns before the crash",
  tags: ['burnout', 'energy', 'crash', 'warning', 'fatigue', 'overextended', 'self care'],
  icon: "⚠️",
  categories: ['Energy', 'Me'],
  headerColor: "#b8dcd8",
  description: "Track daily energy, sleep, and stress to identify YOUR personal burnout patterns before you crash. For people who push through warning signs, mask symptoms, or have poor interoception (can't sense body signals). The tool uses objective data to warn you when a crash is coming - because your feelings might say 'I'm fine' even when the pattern shows you're not. Get specific, actionable interventions prioritized by urgency. Built especially for people who can't trust their own assessment.",
  guide: {
      overview: "Crash Predictor tracks daily metrics (energy, sleep, stress, activities, physical symptoms, warning signs) to identify patterns that precede burnout. It analyzes YOUR specific crash indicators and predicts how many days until likely crash at current trajectory. Provides prioritized interventions with scripts for what to say/do. Designed for people who push through everything and need objective data to override their 'I'm fine' instinct.",
      
      howToUse: [
        "Daily check-in: Rate energy (1-10), sleep quality (1-10), stress level (1-10), check activities, physical symptoms, and warning signs. Takes 60 seconds.",
        "Save entry: Data stored locally. Do this every day, even (especially) when you 'feel fine'.",
        "After 3+ days: Click 'Analyze Patterns' to see burnout risk assessment, your specific crash pattern, warning signs, and preventive actions.",
        "Follow interventions: Sorted by urgency (urgent/high/medium/low). Do the urgent ones even if you don't feel like you need to.",
        "Trust the data, not your feelings: If analysis says you're at high risk but you 'feel fine', the data is right. This is what poor interoception means."
      ],
      
      example: {
        scenario: "You've been logging for 2 weeks. Stress has been 8+ for 6 days, sleep averaging 4.5/10, energy declined from 7 to 3, zero rest days. You 'feel fine' and think you can keep going.",
        action: "Click 'Analyze Patterns'. System detects high crash risk, 2-3 days until likely crash.",
        result: "Analysis shows: 'Your pattern: crash 2-4 days after stress hits 9 while sleep is below 6. Current status: BOTH thresholds met. Interventions: URGENT - Cancel tomorrow evening plans, call in sick if needed. HIGH - Delegate this week's project. Your current capacity: 30% below normal (can do 1-2 things today, not 5). Even if you feel fine, your logs show sleep deficit accumulating, no rest in 12 days, 4 warning signs present. Trust the data.' You cancel plans, take sick day, avoid the crash that would have forced shutdown for 2+ weeks."
      },
      
      tips: [
        "Log EVERY day, even when things are good - you need baseline data",
        "Be honest about ratings - this is for you, not performance",
        "If you think 'I don't need this today', that's when you need it most",
        "Show analysis to someone who knows you - external validation helps",
        "Autistic users: Count masking as energy drain even if it doesn't 'feel' draining",
        "ADHD users: Medication can mask fatigue - log actual sleep/rest, not perceived energy",
        "If analysis says urgent intervention but you disagree, do it anyway - trust the pattern",
        "Recovery from ignoring warnings: 2-4 weeks. Prevention from following warnings: 2-4 days."
      ]
    }
},
// ── DreamPatternSpotter tools.js entry ──
// Replace existing entry (id: "DreamPatternSpotter")
// Changes: modified date, description trimmed, pitfalls added

{
  modified: "2026-03-11",
  id: "DreamPatternSpotter",
  title: "Dream Pattern Spotter",
  tagline: "Find recurring themes and emotional patterns in your dreams",
  tags: ['dreams', 'sleep', 'patterns', 'subconscious', 'psychology', 'reflection', 'themes', 'emotions'],
  icon: "🌙",
  categories: ['Mind'],
  headerColor: "#b8dcd8",
  description: "Analyzes your dreams using Jungian, Freudian, and neuroscience frameworks to surface recurring themes, emotional patterns, symbolic imagery, and life correlations — with reflection questions to make the insights actionable.",
  guide: {
    overview: "The Dream Pattern Spotter applies psychological frameworks to find patterns in your dream life. Single Dream mode provides deep analysis of one dream. Pattern mode analyzes 2-6 dreams together to find recurring themes, emotional signatures, and correlations to waking life. Not mysticism — pattern recognition for self-reflection.",
    howToUse: [
      "Single Dream: describe what happened in as much detail as you remember, note the date, select emotions you felt, and optionally add what's happening in your life right now",
      "Pattern mode: add 2-6 dreams from recent nights, then analyze them together to find what keeps appearing",
      "Review the themes, symbols, emotional landscape, and reflection questions",
      "The reflection questions are the most valuable output — they're designed to connect dream patterns to waking life"
    ],
    example: {
      scenario: "You've been dreaming about being lost in buildings and missing important deadlines for 3 weeks.",
      action: "Add 3 dreams in pattern mode. Each describes a variation — lost in a school, late for a flight, can't find the right room for a meeting.",
      result: "Pattern analysis surfaces: core theme of 'being unprepared or inadequate,' recurring symbol of institutional spaces, emotional signature of anxiety about evaluation. Reflection questions: 'Where in your waking life do you feel like you're failing to meet expectations? What would it mean to let go of the standard you're measuring yourself against?'"
    },
    tips: [
      "Write down dreams immediately after waking — they fade fast",
      "The life context field significantly improves the analysis",
      "Pattern mode needs at least 2 dreams, but 4-5 gives much richer results",
      "Don't try to interpret before you see the analysis — your pre-formed interpretation may block deeper patterns"
    ],
    pitfalls: [
      "Vague descriptions like 'I had a weird dream' produce generic analysis — the more detail, the better",
      "Not every dream is symbolically meaningful; some are just neural noise. Trust what actually resonates",
      "This is for self-reflection, not diagnosis — a therapist can help go deeper with patterns that feel significant"
    ]
  }
},
{
  modified: "",
  id: "MeetingHijackPreventer",
  title: "Meeting Hijack Preventer",
  tagline: "Keep meetings structured, inclusive, and on track",
  tags: ['meeting', 'agenda', 'facilitation', 'hijack', 'inclusive', 'structure', 'work'],
  icon: "🛡️",
  categories: ['The Office'],
  headerColor: "#d4dde8",
  description: "Create structured, inclusive meeting agendas with time-boxed items, facilitator scripts, and anti-hijack strategies. Prevents dominant personalities from derailing discussions and ensures all voices are heard.",
  guide: {
      overview: "The Meeting Hijack Preventer generates complete meeting structures that keep discussions focused and productive. It provides time-boxed agenda items, explicit speaking order, facilitator scripts for every scenario, decision-making frameworks, virtual meeting protocols, and ready-to-use follow-up documents. Perfect for preventing tangents, managing dominant speakers, and ensuring quiet participants contribute.",
      howToUse: [
        "Choose a meeting template (Sprint Planning, Retrospective, Brainstorm, etc.) or enter a custom meeting goal",
        "Select your format (Virtual or In-person) and if virtual, choose your platform (Zoom, Teams, Google Meet)",
        "Set duration, participant count, meeting type, and decision-making framework (Consensus, Majority Vote, Disagree & Commit, or Leader Decides)",
        "Check any known challenges (dominators, off-topic, talking over, schedule issues, quiet voices)",
        "Click 'Generate Meeting Structure' to get your complete agenda with facilitator scripts, virtual protocols, anti-hijack strategies, and meeting artifacts (action items tracker, minutes template, follow-up email, and decision log)"
      ],
      example: {
        scenario: "You're leading a 60-minute virtual Zoom meeting to decide on Q1 marketing strategy with 6 people. You know one person tends to dominate and quiet team members struggle to speak up.",
        action: "Select 'Decision-making Meeting' template, set to Virtual/Zoom, choose 'Majority Vote' framework, check 'One person dominates' and 'Quiet people don't speak up' challenges, then generate.",
        result: "You receive a time-boxed agenda with round-robin speaking order, Zoom-specific protocols (mute/chat/raise hand), facilitator scripts for managing dominance ('Thanks [Name], let's hear from others'), a voting process, action items tracker, and a pre-written follow-up email—everything you need to run an inclusive, productive meeting."
      },
      tips: [
        "Send the generated agenda to participants 24 hours in advance so they can prepare and feel more confident contributing",
        "Actually use the facilitator scripts—they're designed to be kind but effective, removing the burden of improvising redirect language in the moment",
        "For virtual meetings, share the platform-specific protocols at the start and assign a Tech Support role to handle breakout rooms and chat monitoring",
        "Use templates for recurring meeting types (standups, retrospectives) to save time and maintain consistency across your team's meetings"
      ]
    }
},
// ── DoctorVisitTranslator tools.js entry ──
// Replace existing entry (id: "DoctorVisitTranslator")
// Changes: modified date, description trimmed to 1 sentence, tags 7→9, pitfalls added

{
  modified: "2026-03-11",
  id: "DoctorVisitTranslator",
  title: "Doctor Visit Translator",
  tagline: "Turn medical jargon into plain English",
  tags: ['doctor', 'medical', 'jargon', 'health', 'appointment', 'diagnosis', 'plain language', 'prescription', 'lab results'],
  icon: "🩺",
  categories: ['Body'],
  headerColor: "#ccdfc4",
  description: "Paste any medical document — visit notes, lab results, prescription labels, or billing statements — and get a plain-English summary, prioritized action checklist, medication explanations, and questions to ask at your next appointment.",
  guide: {
    overview: "The Doctor Visit Translator helps you understand your doctor visits by translating medical terminology into clear, actionable language. Paste your visit notes or describe what the doctor said, and get a plain English summary, medical term definitions, action checklist with priorities, medication explanations with side effects, test result interpretations, follow-up requirements, and questions to ask next time.",
    howToUse: [
      "Paste your visit summary/notes OR write what you remember the doctor saying — include medications, test results, diagnosis, and instructions",
      "Select what you're translating: visit notes, prescription label, lab report, bill/EOB, or discharge instructions",
      "Optionally add your main concerns — what you're worried or confused about",
      "For medication interaction checks, add your current medications in the optional field",
      "Review your plain English summary, action checklist, and questions to ask next time"
    ],
    example: {
      scenario: "You left a doctor appointment where they said you have 'hypertension' and prescribed 'lisinopril 10mg.' Your blood pressure was 145/92. You're confused about what this means.",
      action: "Paste: 'Doctor said I have hypertension. BP was 145/92. Prescribed lisinopril 10mg once daily. Need to reduce sodium and exercise. Come back in 3 months.' Add concern: 'Worried about medication side effects.' Select 'Diagnosis' visit type.",
      result: "You receive a plain English summary, definition of 'hypertension' and what 145/92 means, action checklist (HIGH: Start medication, MEDIUM: Reduce sodium), lisinopril explanation with side effects, follow-up requirements, and questions to ask next visit."
    },
    tips: [
      "The more detail you include, the more accurate the translation — paste the actual notes if possible",
      "Add your current medications to flag potential drug interactions",
      "Use the Symptom Journal to track symptoms over time and share trends with your doctor",
      "Save translations to your health history for comparison across visits"
    ],
    pitfalls: [
      "This tool explains medical information — it does not replace your doctor's advice. Always follow their instructions",
      "Paraphrasing what you remember is less accurate than pasting actual notes or documents",
      "Lab result interpretation is general context — your doctor knows your full history and may interpret values differently"
    ]
  }
},
{
  modified: "",
  id: "EmailUrgencyTriager",
  title: "Email Urgency Triager",
  tagline: "Find out what actually needs a reply today",
  tags: ['email', 'reply', 'urgent', 'inbox', 'prioritize', 'respond'],
  icon: "📬",
  categories: ['The Office', 'Do It!'],
  headerColor: "#d4dde8",
  description: "Analyze email urgency and cut through inbox anxiety. Find out what actually needs a response today vs what can wait.",
  guide: {
    overview: "The Email Urgency Triager helps you cut through email anxiety by analyzing which messages actually need immediate responses versus which can wait or be ignored entirely. It separates real urgency from perceived urgency, giving you permission to focus on what matters and let the rest wait. Perfect for anyone drowning in their inbox or feeling anxious about unanswered emails.",
    
    howToUse: [
      "Select your role/context (Employee, Manager, Freelancer, Student, etc.)",
      "Paste one or more emails into the text area",
      "Separate multiple emails with '---' or paste them all - the tool will figure it out",
      "Click 'Analyze Urgency' to get your prioritized breakdown",
      "Review the three-tier system: Reply Now, Reply This Week, Optional/Never",
      "Expand any email card to see detailed reasoning and suggested response time",
      "Use the quick response templates for urgent items",
      "Read the 'Permission to Breathe' section for anxiety relief"
    ],
    
    example: {
      scenario: "You have 10 unread emails and feel anxious about which to respond to first",
      action: "Paste all 10 emails, select your role, click Analyze",
      result: "Get results like: 1 Reply Now (client with blocking issue), 4 Reply This Week (routine requests), 5 Optional (newsletters and FYIs you can ignore)"
    },
    
    tips: [
      "Include subject, sender, and body for best analysis - but messy formatting is fine",
      "The tool is intentionally conservative - most things go to 'Optional'",
      "Look for the anxiety relief message - it gives you permission to ignore most emails",
      "Use response templates to quickly handle urgent items",
      "Your role context matters - the same email might be urgent for a Manager but optional for an Employee",
      "Batch process similar emails together based on the tips provided",
      "If an email has 'URGENT' in the subject but says 'no rush', it's probably not urgent",
      "FYI emails, newsletters, and 'just checking in' messages almost never need responses",
      "Expand email cards to see 'If you wait' consequences",
      "Trust the analysis even if it feels wrong - sender anxiety ≠ actual urgency"
    ],
    
    pitfalls: [
      "Don't paste emails with sensitive information you don't want to share",
      "The tool can't see your calendar - manually override if you know about conflicts",
      "Very domain-specific terminology might not be understood (rare)",
      "If you disagree with a categorization, trust your judgment",
      "Don't feel obligated to respond just because someone marked it 'URGENT'"
    ],
    
    quickReference: {
      "Reply Now": "Explicit deadlines within 24hrs, business-critical issues, blocking others",
      "Reply This Week": "Deadlines within a week, important but not blocking, routine requests",
      "Optional/Never": "FYI emails, newsletters, no specific ask, CCs, automated notifications",
      "Most common result": "1-2 Reply Now, 3-5 This Week, majority Optional",
      "Anxiety relief": "Permission to ignore most emails"
    }
  }
},

{
  modified: "",
  id: "LeaseTrapDetector",
  title: "Lease Trap Detector",
  tagline: "Find predatory clauses hiding in your lease",
  tags: ['lease', 'rent', 'apartment', 'landlord', 'tenant', 'housing'],
  icon: "🏡",
  categories: ['Loot'],
  headerColor: "#c0d8b8",
  description: "Analyze rental agreements and identify predatory clauses, illegal provisions, unusual fees, and missing tenant protections. Upload your lease (PDF or text), get color-coded red/yellow/green flags with plain language explanations, negotiation scripts, and comparison to local housing laws. Flags concerning clauses, explains your rights, provides negotiation strategies, and connects you to tenant resources. Built for first-time renters and tenant protection.",
  guide: {
    overview: "Lease Trap Detector analyzes rental agreements to protect tenants from predatory practices. Upload your lease or paste the text, specify your location (for local law comparison), and get comprehensive analysis: RED flags for serious concerns (illegal clauses, landlord overreach, exploitative fees), YELLOW flags for questionable provisions (vague language, missing details), GREEN flags for good tenant protections. Each flag includes the actual clause text, plain-language explanation of the problem, legal status (illegal/unenforceable/exploitative), your rights under local law, and specific negotiation strategies. Also identifies missing protections, unusual fees, and provides negotiation scripts plus local tenant rights resources.",
    
    howToUse: [
      "UPLOAD YOUR LEASE: Either upload PDF file or paste lease text directly into the text box.",
      "ENTER LOCATION: Type your city and state (e.g., 'San Francisco, CA' or 'Austin, TX') - this is critical for comparing to local housing laws.",
      "SELECT LEASE TYPE: Choose Apartment, House, Room rental, or Commercial to get relevant analysis.",
      "OPTIONAL CONCERNS: If you already noticed something fishy (like 'They want $500 cleaning fee' or 'Can landlord enter anytime?'), note it here for focused analysis.",
      "CLICK ANALYZE: Wait 30-60 seconds for comprehensive analysis.",
      "REVIEW COLOR-CODED FLAGS: RED = serious concerns/likely illegal, YELLOW = questionable/clarify with landlord, GREEN = good tenant protections.",
      "READ PLAIN LANGUAGE EXPLANATIONS: Each flag explains what the clause means in normal English, why it's problematic, what the law says, and what to negotiate.",
      "USE NEGOTIATION SCRIPTS: Copy the provided negotiation language to email or discuss with landlord.",
      "CHECK MISSING PROTECTIONS: See what important clauses should be in your lease but aren't.",
      "REVIEW UNUSUAL FEES: See which fees are higher than typical or potentially illegal."
    ],
    
    example: {
      scenario: "You're a first-time renter in California looking at an apartment lease. The lease has a clause saying 'Landlord may enter apartment at any time for inspections' and charges a $400 non-refundable cleaning fee plus $200 'lease processing fee'. You're not sure if this is normal or legal.",
      action: "Upload the lease PDF, enter 'Los Angeles, CA' as location, select 'Apartment' as lease type, note in concerns: 'Landlord entry anytime clause seems wrong, fees seem high'. Click Analyze Lease.",
      result: "RED FLAGS: (1) 'Landlord may enter at any time' - ILLEGAL in California. CA Civil Code 1954 requires 24-hour notice except emergencies. Your rights: Landlord MUST give 24-hour written notice and can only enter for specific reasons (repairs, showings with your permission, emergencies). Negotiation: 'This clause violates CA Civil Code 1954. Please revise to require 24-hour notice as required by law.' (2) $200 'lease processing fee' - LIKELY ILLEGAL. California law generally prohibits application fees over $55 and lease processing fees are often considered disguised application fees. Your rights: You can refuse to pay or negotiate removal. (3) $400 'non-refundable' cleaning fee - QUESTIONABLE. In California, cleaning fees must be itemized and can't exceed actual cleaning costs. 'Non-refundable' language is concerning. YELLOW FLAGS: (1) Security deposit amount not clearly stated - ask for specific dollar amount and confirm it doesn't exceed 2 months rent (CA limit for unfurnished). GREEN FLAGS: (1) Includes 60-day notice for rent increases - good, California requires this for increases over 10%. (2) Specifies habitability standards - protects your right to safe housing. MISSING PROTECTIONS: (1) No clause about landlord's duty to mitigate damages if you break lease early - California law requires this, should be explicit. NEGOTIATION SCRIPT: 'Hi [Landlord], I reviewed the lease and have concerns about three clauses that may violate California tenant law. [Details of violations]. Can we revise these sections to comply with state law? I'm happy to sign once these are corrected.' RESOURCES: Los Angeles Tenant Union, Housing Rights Center, LA County Department of Consumer Affairs."
    },
    
    tips: [
      "LOCATION IS CRITICAL - tenant laws vary dramatically by state and city. 'San Francisco, CA' gets different analysis than 'Dallas, TX'.",
      "UPLOAD FULL LEASE - don't just paste concerning clauses, the tool needs full context to spot patterns and missing protections.",
      "READ ALL FLAGS - even green flags are important (they show what protections you DO have).",
      "DON'T IGNORE YELLOW FLAGS - 'questionable' clauses often hide problems. Ask landlord for clarification on every yellow flag.",
      "USE NEGOTIATION SCRIPTS - they're written to be firm but professional, tested language that protects your rights without antagonizing landlord.",
      "MISSING PROTECTIONS matter - just because a bad clause isn't in your lease doesn't mean you're protected. Missing protections leave you vulnerable.",
      "UNUSUAL FEES are often negotiable - if tool flags a fee as 'higher than typical' or 'questionable', push back. Landlords often waive them.",
      "CHECK LOCAL RESOURCES - tool provides tenant rights organizations specific to your area. They can review lease for free and help negotiate.",
      "DOCUMENT EVERYTHING - if you negotiate changes, get them in writing as lease addendum before signing.",
      "RED FLAGS = WALK AWAY WARNING - if lease has multiple red flags and landlord won't negotiate, consider walking away. Predatory lease = bad landlord."
    ],
    
    pitfalls: [
      "Don't skip location - 'New York City, NY' has VERY different tenant laws than 'Albany, NY'. Be specific with city AND state.",
      "Don't assume 'standard lease' is safe - many 'standard' leases include illegal or exploitative clauses. Always analyze.",
      "Don't sign first, analyze later - run lease through tool BEFORE signing. After signature, you're legally bound even to illegal clauses (until you fight in court).",
      "Yellow flags aren't 'probably fine' - questionable clauses need clarification. Vague language always benefits landlord, never tenant.",
      "Green flags don't mean entire lease is safe - a lease can have good protections AND predatory clauses. Review everything.",
      "Don't trust 'this is required by law' from landlord - if tool says something is illegal, it's illegal. Landlords lie or are ignorant of law.",
      "Negotiation scripts aren't optional suggestions - if tool says clause is illegal, you have RIGHT to demand removal. Be firm.",
      "Don't ignore missing protections - if lease is silent on landlord's responsibilities (repairs, habitability, entry notice), you're vulnerable.",
      "Unusual fees won't 'sort themselves out' - if charged $500 for 'administrative fee', negotiate NOW or you'll pay it.",
      "Don't use tool as substitute for lawyer on complex commercial leases - this tool is built for residential rentals. Complex commercial needs attorney review."
    ]
  }
},

{
  modified: "",
  id: "FriendshipFadeAlerter",
  title: "Friendship Fade Alerter",
  tagline: "Never lose touch with people you care about",
  tags: ['friend', 'friendship', 'drift', 'losing touch', 'reconnect', 'relationship', 'stay in touch', 'connection', 'reach out', 'overdue', 'contact', 'social'],
  icon: "💔",
  categories: ['Humans'],
  headerColor: "#e0b8b8",
  description: "Never lose touch with people you care about due to time-blindness. Track important relationships, get alerts when it's been too long, and generate personalized conversation starters. Visual color-coded urgency (red/yellow/green), configurable contact frequencies, snooze for busy periods, and guilt-free reconnection scripts. Maintain connections without shame.",
  guide: {
    overview: "Friendship Fade Alerter helps individuals maintain relationships despite time-blindness. Add important people with their ideal contact frequency (weekly, monthly, etc.), and the tool tracks days since last contact, alerts when overdue, and generates personalized conversation starters when you're ready to reach out. Color-coded visual indicators (red = overdue, yellow = coming due, green = recently contacted) remove guesswork. One-click conversation starter generation removes the 'what do I say?' barrier. Guilt-free framing acknowledges that time got away from you - that's okay. Snooze relationships during busy periods. Track successful reconnections. Low-friction design makes maintaining friendships actually doable.",
    
    howToUse: [
      "ADD RELATIONSHIPS: Click 'Add Person', enter name, relationship type (close friend, family, mentor), ideal contact frequency (weekly to semi-annually), last contact date, and optional context notes (shared interests, ongoing topics).",
      "VIEW DASHBOARD: See all relationships color-coded by urgency - RED (overdue), YELLOW (coming due within 3 days), GREEN (recently contacted).",
      "GET ALERTED: Dashboard shows who needs contact, days since last contact, days until overdue.",
      "GENERATE CONVERSATION STARTER: Click 'Reach Out Now' on any overdue person - get 3-5 personalized message options with tone, why it works, and follow-up ideas.",
      "SEND MESSAGE: Copy conversation starter, send it, then click 'Mark as Contacted' to reset the timer.",
      "SNOOZE IF NEEDED: Busy period? Snooze a relationship for 1-4 weeks - alerts pause, resume automatically.",
      "TRACK CONNECTIONS: See your reconnection success rate, celebrate maintaining friendships."
    ],
    
    example: {
      scenario: "You've lost track of time. Your close friend Sarah - you talk monthly - you last contacted her 47 days ago (17 days overdue). You feel guilty and don't know what to say since it's been so long. You're avoiding reaching out because of shame.",
      action: "Open Friendship Fade Alerter. Dashboard shows Sarah's card in RED with '47 days since contact (17 days overdue)'. Click 'Reach Out Now'. Tool generates conversation starters.",
      result: "Conversation starters generated: (1) 'Hey! I realized it's been a minute - hope you're doing well! How's the new job going?' (Casual/warm tone, acknowledges time but doesn't apologize, references last conversation topic). (2) 'Thinking of you! Want to grab coffee this week and catch up?' (Direct invitation, low pressure). (3) 'I saw [thing related to shared interest] and thought of you - made me realize we should catch up soon!' (Shared interest hook). Guilt relief section: 'It's been 47 days, but that's life - you don't need to apologize for being busy. Just reach out now.' You copy option 1, text Sarah, she responds warmly, you click 'Mark as Contacted' - timer resets, Sarah's card turns GREEN. Success!"
    },
    
    tips: [
      "ADD EVERYONE WHO MATTERS - not just close friends, but also family, mentors, acquaintances you value. The tool tracks them all.",
      "BE HONEST about ideal frequencies - don't set 'weekly' because you think you should. Set realistic: if you realistically talk every 6 weeks, set 'Monthly' or create custom.",
      "CONTEXT NOTES are powerful - 'loves hiking, ask about new trail', 'mom struggling with aging parents', 'we always talk about sci-fi books'. Helps generate better starters.",
      "USE conversation starters even if they feel scripted - they're designed to sound natural and remove the 'what do I say' paralysis.",
      "DON'T feel guilty about using the tool - needing help with time awareness is valid, maintaining friendships matters more than doing it 'naturally'.",
      "SNOOZE during genuinely busy times (exams, work crunch, mental health crisis) - relationships can wait, guilt can't pile up.",
      "CELEBRATE successes - reconnection counter shows you ARE maintaining relationships.",
      "Quick message templates ('thinking of you!') for super low-friction contact when overwhelmed."
    ],
    pitfalls: [
      "Don't set unrealistic frequencies thinking it will motivate you - 'weekly' for everyone will just make everything red and overwhelm you. Be honest.",
      "Don't let the tool replace genuine connection - use it to prompt contact, but actually have conversations, not just check boxes.",
      "Don't ignore yellow warnings — yellow turns red faster than you expect. Act when it turns yellow, not when it's already overdue.",
      "Context notes aren't optional if you want good conversation starters - 'close friend' generates generic, 'close friend, loves rock climbing, planning Yosemite trip' generates specific.",
      "Don't apologize in your messages for the time gap (tool explicitly tells you not to) - most people don't notice gaps like you do, leading with apology makes it awkward.",
      "Mark as contacted immediately after sending - if you wait to update 'until they respond', you'll forget and the data becomes inaccurate.",
      "Don't use snooze as avoidance - snooze is for 'I'm genuinely too busy right now', not 'I don't want to deal with this person'. If you keep snoozing someone, maybe reassess the relationship."
    ]
  }
},

{
  modified: "2026-03-24",
  id: "SensoryMinefieldMapper",
  title: "Sensory Minefield Mapper",
  tagline: "Predict and avoid overwhelming sensory environments",
  tags: [
    'sensory', 'overwhelm', 'noise', 'crowds', 'lighting', 'smells',
    'environment', 'planning', 'location', 'scouting', 'map', 'visit',
    'sensitive', 'anxiety', 'temperature', 'place', 'before you go', 'overload'
  ],
  icon: "🗺️",
  categories: ['Body', 'Me'],
  headerColor: "#2a3820",
  description: "Scout any location before you go — predict crowd density, noise, lighting, temperature, and sensory intensity by time of day. Get a tailored game plan, layout intel, accommodation scripts, comfort kit, and live rescan if conditions shift once you're there.",
  guide: {
    overview: "Sensory Minefield Mapper helps you predict what a location will feel like before you arrive. Enter where you're going, when, and what you're sensitive to — and get a full breakdown of expected conditions, the best time to visit, quiet spots and exit routes, scripts for asking staff for accommodations, and a comfort kit checklist. Use the live rescan if reality doesn't match the prediction.",
    howToUse: [
      "Save a concern profile — select your sensitivities once and load them every visit with one tap.",
      "Enter your destination, date, time, and place type.",
      "Review the prediction: intensity rating, factor-by-factor breakdown, and best time to go.",
      "Open Game Plan for before/during strategies and an exit plan if things get overwhelming.",
      "Use Live Rescan if you're already there and conditions are worse than predicted.",
      "Rate the visit afterward — your ratings improve future predictions for that location."
    ],
    example: {
      scenario: "You need to pick up a prescription at a large pharmacy on a Saturday afternoon.",
      action: "Enter the location, select Saturday 2pm, choose Pharmacy/Medical, flag noise and crowds.",
      result: "Prediction: HIGH intensity — weekend rush, pharmacy counter waits, intercom announcements. Best time: Tuesday 9am (LOW). Game plan includes: call ahead to confirm prescription is ready, use self-checkout, bring headphones. Quiet spot: far end of the greeting card aisle."
    },
    tips: [
      "The more specific your location name, the better the prediction — 'CVS on Main St' beats 'pharmacy'.",
      "Use Challenge Mode in the Route Planner to see which stops to cut if energy runs low.",
      "The Comfort Kit feature generates a personalized packing list based on your specific concerns and place type.",
      "Save locations you visit regularly as Favorites — one tap to re-scout with updated conditions."
    ]
  }
},
{
  modified: "",
  id: "LeverageLogic",
  title: "Leverage Logic",
  tagline: "Find the highest-yield opportunity in front of you",
  tags: ['leverage', 'opportunity', 'resources', 'roi', 'career', 'strategy', 'yield'],
  icon: "⚖️",
  categories: ['The Office', 'Veer'],
  headerColor: "#d4dde8",
  description: "Identify high-yield opportunities and calculate the force multiplication of your current resources.",
  guide: {
      overview: "LeverageLogic helps you identify opportunities where small inputs create disproportionate outputs. Enter your current resources (time, money, skills, connections) and it calculates which opportunities will give you the highest return on investment.",
      
      howToUse: [
        "Input your available resources (hours/week, budget, skills, network)",
        "Add opportunities you're considering (internship, side project, club leadership, etc.)",
        "Review the calculated leverage score for each opportunity",
        "See the projected ROI in terms of career advancement, skills gained, or income",
        "Sort by highest leverage to prioritize your time"
      ],
      
      example: {
        scenario: "You have 10 hrs/week free. Options: part-time job, unpaid internship at startup, or build a portfolio project.",
        action: "Enter resources and 3 opportunity types. Review leverage scores.",
        result: "Internship scores 8x leverage (leads to $80k job offers), portfolio 5x, job 1x. You choose the internship."
      },
      
      tips: [
        "Leverage compounds - skills and connections multiply over time",
        "Short-term cash sometimes has lower leverage than long-term opportunity",
        "Update your resources quarterly as your skills increase",
        "Don't just chase the highest leverage - consider your goals too"
      ]
    }
},

{
  modified: "",
  id: "MeetingBSDetector",
  title: "Meeting BS Detector",
  tagline: "Is this meeting necessary or could it be an email?",
  tags: ['meeting', 'waste time', 'unnecessary', 'decline', 'calendar', 'work'],
  icon: "🕵️",
  categories: ['The Office'],
  headerColor: "#d4dde8",
  description: "Detects whether meetings are necessary or could be emails/async updates. Analyzes red flags like 'status update', 'touch base', no agenda. Provides alternative approaches (Loom, doc, Slack) with time saved estimates and permission to decline.",
  guide: {
    overview: "Most meetings are unnecessary and could be handled asynchronously. This tool analyzes meeting descriptions to detect BS meetings (status updates, FYI info sharing, vague 'syncs') vs legitimate ones (collaborative problem-solving, decisions, conflict resolution). Provides concrete alternatives and scripts to suggest them.",
    
    howToUse: [
      "Describe the meeting (purpose, agenda if any)",
      "Add duration and number of attendees if known",
      "Get verdict: BS/borderline/legitimate with confidence score",
      "Receive alternative approach with exact template to send",
      "Use permission statement to decline or suggest alternative"
    ],
    
    example: {
      scenario: "Your manager scheduled a 60-minute 'weekly sync' with 8 people to share status updates. No agenda, just 'touching base on projects.'",
      action: "Input: 'Weekly team sync, 60 minutes, 8 people, status updates on projects'.",
      result: "Verdict: BS (95% confidence). Red flags: 'Status update' (should be written), 'Touch base' (vague purpose), 60 min for info sharing (excessive), 8 people (too many for no decision). Alternative: 'Send this as a Slack thread instead. Each person posts 2-3 bullet update by Tuesday 5pm. Saves 8 hours of collective time.' Template provided: 'Hi [Manager], I think we could make our weekly sync more efficient. What if each person posted a brief status update in #team-updates by Tuesday 5pm? We could reserve meetings for collaborative problem-solving. This would save everyone an hour/week. Thoughts?' Permission: This meeting is wasting 8 collective hours/week. You're not being difficult by suggesting a better way."
    },
    
    tips: [
      "Use this BEFORE accepting meeting invites, not after they're scheduled",
      "The template messages are designed to be diplomatically firm, not confrontational",
      "If verdict is 'borderline', the tool suggests how to make meeting shorter/smaller",
      "Track time saved estimates - they add up to days per year",
      "Some meetings are legitimate; don't decline everything just because you can"
    ],
    
    pitfalls: [
      "Don't use this as excuse to avoid necessary difficult conversations",
      "Some managers don't respond well to meeting pushback - assess your context",
      "If company culture is meeting-heavy, you may need to pick your battles"
    ]
  }
},

{
  modified: "",
  id: "RecipeChaosSolver",
  title: "Recipe Chaos Solver",
  tagline: "Your kitchen 911 — from crisis to confidence",
  tags: ['cooking', 'food', 'recipe', 'kitchen', 'ingredients', 'dinner'],
  icon: "🍳",
  categories: ['The Grind'],
  headerColor: "#d4dde8",
  description: "Mid-cook crisis? Missing ingredients, burnt sauce, flat flavor? Get instant rescue solutions, smart substitutions (single or multi-ingredient), recipe scaling with non-linear adjustments, pre-flight readiness checks, flavor fix upgrades, 60-second cooking lessons, a wins journal, and a hands-free Kitchen Companion mode for flour-covered hands.",
  guide: {
    overview: "Recipe Chaos Solver is your cooking emergency room AND your cooking coach. When something goes wrong mid-cook, get instant rescue solutions with science explanations. Before you start, run a Pre-Flight Check to catch problems early. When dinner's just boring, Flavor Fix diagnoses what's missing. Every rescue becomes a learning moment with Teach Me lessons, and your Wins Journal tracks your growing confidence. Kitchen Companion mode gives you hands-free step-by-step guidance while you cook.",

    howToUse: [
      "🍳 Rescue: Paste a recipe or describe your problem, select a category, get rescue solutions with step-by-step instructions and science explanations",
      "✈️ Pre-Flight: Paste a recipe + what you have → get a readiness report with ingredient checks, equipment warnings, technique heads-ups, and realistic time estimates",
      "✨ Flavor Fix: Describe a dish that tastes flat → get a diagnosis of what's missing (acid, fat, salt, umami, heat, texture) with specific fixes ranked by impact",
      "🔄 Quick Swap: Look up a single ingredient substitution with exact ratios, science, and best-for/avoid-in guidance",
      "🔄🔄 Multi-Swap: Missing 2-8 ingredients? Get a compound analysis that accounts for interaction effects between substitutions",
      "⚖️ Scale: Paste a recipe and change servings → AI-aware scaling that flags non-linear ingredients (spices, leavening, eggs) with timing and equipment adjustments",
      "🎓 Teach Me: After any rescue or swap, tap 'Teach Me Why' for a 60-second lesson on the underlying cooking principle",
      "👨‍🍳 Kitchen Companion: Full-screen hands-free mode with huge text, built-in timers, and big navigation buttons — designed for flour-covered hands",
      "🏆 Wins Journal: Log cooking victories to build confidence. Track your rating trend over time.",
      "📌 Saved: Build a personal cheat sheet of rescues, swaps, lessons, and scaling notes. Searchable when you have 4+ items."
    ],

    example: {
      scenario: "You're making chocolate chip cookies but realize you're out of eggs AND butter. The recipe calls for 2 eggs and 1 cup butter. You have applesauce, coconut oil, and Greek yogurt available.",
      action: "Go to Multi-Swap, add 'eggs' and 'butter' as missing ingredients, paste the recipe context, and note your available substitutes.",
      result: "Feasibility: DOABLE. Combined impact analysis: Both subs affect moisture and binding — use coconut oil (¾ cup) for butter (adds slight coconut flavor, melts similarly) + ¼ cup applesauce per egg (adds moisture + binding). Combined technique: Chill dough 30 min longer since coconut oil is softer. Interaction warning: Both subs add moisture — reduce any liquid in recipe by 2 tbsp. Expected result: Slightly chewier cookies with subtle coconut undertone. Then tap 'Teach Me Why' to learn about the 3 jobs eggs do in baking."
    },

    tips: [
      "Upload a photo of your recipe, your pantry, or even the disaster itself — the tool handles all three image types",
      "Pre-Flight Check uses your saved swaps to suggest substitutes you've already tried and liked",
      "Flavor Fix works best when you describe what's wrong ('flat', 'one-note', 'missing something') — not just the dish name",
      "In Kitchen Companion mode, multiple timers can run simultaneously across different steps",
      "The Wins Journal compounds with pattern insights in History — after 3+ rescues, you'll see your most common issues",
      "Save lessons to your cheat sheet — they're searchable and build a personal cooking education over time"
    ],

    pitfalls: [
      "Multi-Swap with 5+ ingredients may return 'abandon ship' — that's honest, not broken. Some combos just don't work.",
      "Flavor Fix is for boring food, not broken food — if something went wrong, use Rescue instead",
      "Kitchen Companion mode is full-screen overlay — tap 'Exit Guide' to return to normal view",
      "Pre-Flight's time estimates are realistic, not optimistic — plan accordingly"
    ]
  }
},

{
  modified: "",
  id: "BillRescue",
  title: "Bill Rescue",
  tagline: "Your bill anxiety ends here",
  tags: ['bill', 'medical bill', 'negotiate', 'reduce', 'lower', 'financial', 'debt', 'collections', 'late fee', 'overdue', 'dispute', 'hardship', 'credit', 'waive', 'fight', 'utilities', 'medical', 'rent', 'insurance', 'phone', 'collections', 'scripts', 'letters'],
  icon: "🧾",
  categories: ['Loot', 'The Grind'],
  headerColor: "#c0d8b8",
  description: "Turn bill anxiety into a clear action plan with 9 tools: paste or photograph a bill for an AI autopsy, Quick Check any charge in 5 seconds, practice negotiation calls with an AI billing rep, generate 7 types of ready-to-send letters, triage multiple bills by priority, track plans, log call outcomes, view your bill calendar, and celebrate victories with a running savings total.",
  guide: {
    overview: "Bill Rescue is your complete bill-fighting toolkit — 9 views that take you from 'I'm scared to open this' to 'I saved $1,670 this year.' Quick Check any charge instantly. Get full rescue plans with phone scripts, letters, and insider tips. Practice the actual call with an AI billing rep before you dial. Generate dispute letters, goodwill adjustments, insurance appeals, and more. Track everything: plans, call outcomes, follow-ups, and victories.",

    howToUse: [
      "🧾 Rescue: Full analysis — select bill type, enter details, get scripts, letters, rights, escalation ladder, and insider tips",
      "⚡ Quick Check: Describe any charge → instant verdict: NORMAL, WORTH QUESTIONING, or DEFINITELY FIGHT THIS",
      "📊 Triage: Enter 2-10 bills → priority ranking with budget allocation, danger zones, and quick wins",
      "🎭 Rehearse: Practice the call — AI plays the billing rep (normal or hard mode), with coaching after every exchange",
      "✉️ Letters: Generate 7 letter types: hardship, dispute, goodwill adjustment, insurance appeal, cease & desist, regulatory complaint, payment agreement",
      "📋 Tracker: All saved plans with status updates (pending → in progress → resolved)",
      "📞 Call Log: Record what happened — outcome, rep name, confirmation number, what was agreed, next follow-up",
      "📅 Calendar: See overdue items, upcoming follow-ups, and total monthly obligations at a glance",
      "🏆 Victories: Log every win with dollar amounts — running total of money saved, plus pattern insights after 3+ wins"
    ],

    example: {
      scenario: "You have a $2,400 medical bill that's 60 days overdue. You lost your job and can afford $75/month. You think they overcharged you.",
      action: "Quick Check the suspicious charge first (⚡). Then run full Rescue (🧾) with bill photo for autopsy. Practice the call in Rehearsal (🎭) on hard mode. Generate a hardship letter (✉️). Save the plan (📋) and track follow-ups (📅).",
      result: "Quick Check flags a $340 duplicate facility fee. Rescue plan gives you the exact phone script with insider phrases. Rehearsal builds your confidence — you handle the hard-mode rep's pushback. Letter is ready to send. After the call, you log that they accepted $50/month and waived the late fees. Victory tracker shows you saved $640."
    },

    tips: [
      "Start with Quick Check for any charge you're unsure about — it takes 5 seconds",
      "Use Rehearsal on Hard Mode before big calls — if you can handle the worst-case rep, the real one feels easy",
      "Save your plan BEFORE making the call so you can reference scripts during the conversation",
      "Log victories immediately — watching your savings total grow builds the habit",
      "The Letters tab covers 7 types — most people don't know they can request a goodwill adjustment to fix their credit"
    ],

    pitfalls: [
      "This is general guidance, not legal or financial advice — programs and rights vary by location",
      "If your debt is in collections, read the Collections Defense Kit BEFORE doing anything else",
      "Never acknowledge a collections debt verbally until it's validated in writing",
      "Making a partial payment on old debt can restart the statute of limitations — the tool warns about this"
    ]
  },
  crossRefs: ['MoneyMoves', 'CrisisPrioritizer'],
},

{
  modified: "",
  id: "SubSweep",
  title: "SubSweep",
  tagline: "Find what you're wasting and sweep it away",
  tags: ['subscription', 'cancel', 'charges', 'recurring', 'money', 'audit'],
  icon: "🧹",
  categories: ['Loot'],
  headerColor: "#c0d8b8",
  description: "Subscription management across 9 views: honest keep/cancel verdicts with cost-per-use math, renewal alerts, price hike detection, plan optimization, retention scripts to negotiate discounts, shared-cost splitting, free trial tracking, category budgets, and a cancellation savings timeline.",
  guide: {
    overview: "SubSweep manages your entire subscription life — from the moment you start a free trial to the day you cancel and track how much you've saved. 9 views cover auditing, renewals, optimization, negotiation, splits, trials, budgets, tracking, and trends. Your subscription list persists between sessions and gets smarter over time.",

    howToUse: [
      "🧹 Sweep: Add subs manually or scan a statement. Set category + renewal date. Get verdicts, cost-per-use, and cancellation steps",
      "🔔 Radar: See upcoming renewals (this week, this month, 90 days) plus price hike alerts with one-click negotiate links",
      "⚡ Optimize: Find annual discounts, family plans, student deals, and bundle opportunities",
      "📞 Negotiate: Service-specific retention scripts with step-by-step dialogue and magic phrases",
      "👥 Splits: Mark subs as shared, add members, see per-person costs and a copy-ready 'who owes what' summary",
      "🆓 Trials: Track free trials with end dates, usage counters, cost-per-use verdicts, and one-click convert to subscription",
      "📊 Budgets: Set monthly limits per category (streaming, music, etc.). Visual budget bars with over-limit alerts",
      "📋 Tracker: Status management (active/cancelling/paused/cancelled) with running savings since cancellation",
      "📈 Timeline: Monthly spending bar chart with trend analysis — proof that subscription creep is real"
    ],

    example: {
      scenario: "You have 10 subscriptions, share Netflix with roommates, just started a Paramount+ trial, and suspect your internet went up in price.",
      action: "Add all 10 in Sweep with categories and renewal dates. Mark Netflix as shared in Splits, add roommate names. Add Paramount+ trial with end date. Update internet price — SubSweep detects the increase.",
      result: "Radar shows 3 renewals this month totaling $87. Price Watch catches the $5/month internet hike and links to Negotiate. Splits calculates roommates owe you $8.33/month each. Trial tracker warns: 'Zero uses of Paramount+ and trial ends in 3 days — cancel now.' Budget view shows you're $12 over your streaming limit."
    },

    tips: [
      "Set renewal dates on annual subs — that's where surprise charges happen",
      "Update prices when they change — SubSweep tracks the history and alerts you to increases",
      "Add trials the moment you sign up — tap the usage counter each time you use them",
      "Set category budgets even if approximate — the visual bar makes overspending obvious",
      "Run a fresh Sweep analysis each month to take a timeline snapshot"
    ],

    pitfalls: [
      "Prices and cancellation steps may vary — always verify on the service's website",
      "Retention offers change frequently — scripts give the general approach, not guaranteed deals",
      "Statement scanning works best with copy-pasted text, not screenshots"
    ]
  }
},

{
  modified: "",
  id: "ApologyCalibrator",
  title: "Apology Calibrator",
  tagline: "Match your apology to the actual harm caused",
  tags: ['sorry', 'apology', 'apologize', 'mistake', 'forgiveness', 'conflict', 'over-apologizing', 'repair', 'relationship', 'accountability', 'letter', 'cultural', 'communication'],
  icon: "⚖️",
  categories: ['Humans', 'Discourse'],
  headerColor: "#e0b8b8",
  description: "Calibrates apology level to actual harm caused. 5 levels: no apology needed, brief acknowledgment, simple apology, full accountability apology, major repair. Stops over-apologizing for existing and under-apologizing for real harm. Templates for each level.",
  guide: {
    overview: "Many people over-apologize for minor things ('sorry to bother you' for legitimate questions) or under-apologize for genuine harm. This tool analyzes actual harm vs your responsibility to determine appropriate apology level (1-5) and provides calibrated templates.",
    
    howToUse: [
      "Describe what happened",
      "Add relationship context (friend/boss/partner/stranger)",
      "Optionally note situation type (work/personal/public)",
      "Get apology level (1=none needed, 5=major repair)",
      "Receive appropriate templates for that level",
      "See what NOT to say and why"
    ],
    
    example: {
      scenario: "You asked your boss a clarifying question about a project deadline during her lunch break. She seemed slightly annoyed. You're now spiraling about whether you should apologize.",
      action: "What happened: 'Asked boss question during lunch, she seemed annoyed', Relationship: 'Boss', Context: 'Work'.",
      result: "Appropriate level: 1 (No apology needed). Analysis: Actual harm = none (asking work questions is your job). Your responsibility = none (lunch breaks aren't sacred, reasonable question). Over-apologizing red flag: You're apologizing for existing/doing your job. What to say instead: Nothing, or 'Thanks for the quick answer' if you see her later. What NOT to say: 'Sorry to bother you', 'Sorry to interrupt your lunch'. Why: Asking clarifying questions is legitimate. You're not bothering her - you're doing your job. Permission: You don't need to apologize for taking up space or asking reasonable work questions. If she's annoyed, that's about her lunch being interrupted, not about you doing something wrong."
    },
    
    tips: [
      "Level 1-2 are much more common than people think - most interactions don't need apologies",
      "Templates scale to relationship (different wording for boss vs close friend)",
      "The 'what NOT to say' section prevents common apology mistakes",
      "Over-apologizing trains people to expect apologies for normal interactions",
      "Under-apologizing (level 3 when you need 4-5) damages relationships"
    ],
    
    pitfalls: [
      "Don't apologize just because someone is upset - their feelings don't always mean you did wrong",
      "Don't skip apologies when you genuinely caused harm just because apologizing is uncomfortable",
      "Don't use apology to manipulate ('I'm so sorry' to avoid consequences)"
    ]
  }
},

{
  modified: "",
  id: "MicroAdventureMapper",
  title: "Micro-Adventure Mapper",
  tagline: "Mini-adventures near you, under $20, in 2-4 hours",
  tags: ['bored', 'adventure', 'explore', 'fun', 'weekend', 'activity'],
  icon: "🗺️",
  categories: ['Out & About'],
  headerColor: "#ccdfc4",
  description: "Plans accessible mini-adventures: 2-4 hours, under $20, in/near your city. Detailed itineraries for urban exploration, nature, culture, social experiences. Creates novelty within ordinary constraints. Removes 'need full day/lots of money' barrier to adventure.",
  guide: {
    overview: "Adventures don't require expensive trips or full days. This tool creates specific micro-adventure plans - 2-4 hours, low/no cost, doable this week. Urban exploration, hidden local spots, photography walks, new neighborhoods. Makes exploration accessible.",
    
    howToUse: [
      "Enter your location (or leave blank for general city ideas)",
      "Set time available (defaults to 2-3 hours)",
      "Set budget (defaults to free or low cost)",
      "Add interests if you have preferences",
      "Get complete adventure plan with itinerary, what to bring, timing"
    ],
    example: {
      scenario: "You're in Chicago, have Saturday afternoon free (3 hours), budget $15, interested in architecture and photography.",
      action: "Location: Chicago, Time: 3 hours, Budget: $15, Interests: Architecture, photography.",
      result: "Micro-Adventure: 'Loop Architecture Photo Walk' - Category: Urban exploration + Creative. Cost: Free (just public transportation $5 if needed, coffee $5 optional). Time: 3 hours. Description: Explore Chicago's architectural treasures through photography lens, discovering hidden details most people miss. Why adventure: Most tourists rush through; you'll slow down and notice design elements. Itinerary: 1:00pm: Start at Willis Tower exterior, photograph the facade angles. Pro tip: Cross the street for better perspective. 1:30pm: Walk to Monadnock Building (lightest masonry skyscraper), photograph the interior atrium. Public lobby, free. 2:00pm: Chicago Cultural Center - photograph Tiffany dome. Free entry. 2:30pm: Millennium Park - Cloud Gate from unconventional angles. 3:00pm: Coffee at Intelligentsia, review photos. What to bring: Phone/camera, comfortable shoes, water. Best time: Afternoon for good light. Solo or social: Solo for contemplative experience, friend for sharing discoveries."
    },
    
    tips: [
      "Specific itineraries remove 'I don't know what to do' barrier",
      "Most micro-adventures are free or nearly free - cost isn't a barrier",
      "2-3 hours is perfect for maintaining novelty without exhaustion",
      "Photography theme works anywhere - transforms familiar into exploration",
      "The 'pro tip' section adds insider knowledge that makes it feel special"
    ],
    
    pitfalls: [
      "Don't over-plan - the joy is in spontaneity within structure",
      "Don't skip it because it seems 'too simple' - simple doesn't mean boring",
      "Don't wait for perfect weather/timing - go this week while you're motivated"
    ]
  }
},
{
  modified: "2026-03-10",
  id: "DateNight",
  title: "Date Night",
  tagline: "A full evening plan, on budget, anywhere",
  tags: ['date', 'date night', 'couples', 'relationship', 'romantic', 'activity', 'itinerary', 'anniversary', 'first date', 'budget'],
  icon: "💘",
  categories: ['Out & About'],
  headerColor: "#ccdfc4",
  description: "Budget-driven evening planner for two. Pick your currency, set a budget and vibe, and get a complete itinerary with timing, cost per stop, budget buffer, transportation tips, and a Plan B. Works worldwide — adapts to local culture, venues, and pricing.",
  guide: {
    overview: "DateNight turns 'I dunno, what do you want to do?' into a complete evening with a timeline, per-stop costs, and a built-in budget buffer. Pick your currency and set a hard budget, choose a vibe (casual, romantic, adventurous, first date, anniversary, stay-in), and enter your city. It generates 2-4 stops with culturally appropriate venues — izakayas in Tokyo, tapas bars in Madrid, hawker centres in Singapore — plus conversation starters and a Plan B.",
    howToUse: [
      "Select your currency and set your budget with the slider or quick-pick buttons",
      "Pick a date type — casual, romantic, adventurous, first date, anniversary, or stay-in",
      "Enter your city or neighborhood anywhere in the world",
      "Optionally add dietary restrictions, dealbreakers, or what you did last time",
      "Click 'Plan My Date Night' for a complete evening itinerary",
      "Review the budget breakdown to see cost per stop and your buffer",
      "Expand Conversation Starters and Plan B for extras",
      "Hit 'Different' if you want a new itinerary with the same constraints"
    ],
    example: {
      scenario: "You have ¥8,000 for a romantic date in Shibuya, Tokyo, starting at 7:00 PM. Your partner doesn't eat seafood and you went to an izakaya last time.",
      action: "Select JPY ¥, set budget to ¥8,000, select Romantic, enter 'Shibuya, Tokyo', add 'no seafood', note 'izakaya' as last time",
      result: "Vibe: 'Neon Glow & Hidden Bars.' 7:00 PM: A standing yakitori bar in a narrow alley near Nonbei Yokocho (~¥2,500). 8:15 PM: A quiet Italian-Japanese fusion restaurant with handmade pasta (~¥3,500). 9:30 PM: Walk through the illuminated streets to Yoyogi Park's edge (free). Total: ~¥6,000, buffer: ~¥2,000 for drinks or dessert. Plus conversation starters, transit tips, and a Plan B ramen shop if the main spot is full."
    },
    tips: [
      "Select your local currency first — presets and slider range adapt automatically",
      "The budget buffer accounts for tips (where customary), transport surcharges, and impulse buys",
      "First Date mode suggests venues with easy conversation and natural exit points",
      "Stay-In mode includes delivery fees and tips in the budget",
      "Hit 'Different' to get a completely different itinerary without changing your inputs",
      "Add what you did last time so the AI avoids repeating it"
    ],
    pitfalls: [
      "Venue suggestions are types, not specific business names — confirm availability before going",
      "Prices are estimates for the area — check actual menus and local pricing",
      "Make reservations if the tips suggest it, especially on weekends or holidays"
    ]
  }
},
{
  modified: "2026-03-10",
  id: "CrisisPrioritizer",
  title: "Crisis Prioritizer",
  tagline: "Separate real urgency from anxiety urgency",
  tags: ['crisis', 'emergency', 'prioritize', 'triage', 'urgent', 'overwhelm', 'tasks', 'deadline', 'anxiety', 'burnout'],
  icon: "🚨",
  categories: ['Do It!', 'Energy'],
  headerColor: "#d4dde8",
  description: "Separates real urgency from anxiety urgency using consequence-based triage — ranks tasks by what actually breaks if you skip them. Three timeframes, brain dump mode, time-blocked schedules, task splitting, delegation drafts, pattern tracking, and a 'Just One Thing' panic button.",
  guide: {
    overview: "Anxiety inflates urgency. This tool objectively analyzes deadlines, consequences, and who's actually waiting to show what needs attention now vs what can safely wait. Three timeframes (today, this week, multi-week), brain dump extraction, time-blocked schedules, accountability sharing, task splitting, pattern tracking across sessions, and a panic-mode 'Just One Thing' button for when you can't process a full list.",
    howToUse: [
      "Pick a timeframe: Right Now (today's triage), This Week (day-by-day), or Few Weeks (sustained crisis plan)",
      "Use Quick Start templates or enter tasks manually — add deadlines and who's waiting via the ℹ️ button",
      "Too scattered to list tasks? Toggle Brain Dump mode and paste your stream of consciousness — AI extracts the tasks",
      "Set your energy, emotional state, and preferred tone (Gentle / Direct / Tough Love)",
      "Hit 'Prioritize' — after a brief breathing moment, see your reality check, anxiety audit, and ranked priorities",
      "Use 'Build Schedule' for a concrete time-blocked plan, or 'Just One Thing' when you're paralyzed",
      "Check off tasks as you go, then hit 'What's next?' for a fresh re-triage of what remains",
      "Tap 🧩 on any task to split it into concrete sub-tasks, or 📨 to draft a delegation message",
      "Share your plan with someone via the Accountability Snapshot for follow-through",
      "Return later — the tool remembers past sessions, offers follow-up calibration, and spots patterns over time"
    ],
    example: {
      scenario: "You're panicking with 8 tasks, low energy, and 3 hours before a meeting. You select 'Right Now', set energy to 'Running on fumes' and emotional state to 'Overwhelmed', and pick 'Direct' tone.",
      action: "Enter all 8 tasks. Two have real deadlines. Hit Prioritize, then Build Schedule.",
      result: "Reality check: Of 8 tasks, only 2 are time-sensitive today. Anxiety audit shows 4 tasks feel urgent due to guilt, not consequences. Time-blocked schedule maps 2 must-dos into 90 minutes with breaks. Remaining 6 tasks get guilt-free deferral permissions with specific reasoning."
    },
    tips: [
      "The 'Just One Thing' panic button is there for your worst moments — it cuts through everything and gives you one clear action",
      "Brain dump mode works great when you can't even organize your thoughts into a list",
      "Use the voice selector to match what you need — Gentle when fragile, Tough Love when you need a push",
      "After 3+ sessions, check Pattern Analysis to see if you consistently overrate urgency in certain areas",
      "The Dashboard tracks your triage history — most people discover 60-70% of their 'urgent' tasks could always wait",
      "Task splitting (🧩) is powerful for tasks that feel huge — they're usually 3-5 smaller tasks in disguise"
    ],
    pitfalls: [
      "Don't use this tool in the middle of a genuine emergency — do the thing first, triage after",
      "If every session shows 8+ critical tasks, that's a workload problem, not a prioritization problem",
      "The delegation draft is a starting point — review before sending"
    ]
  }
},

{
  modified: "",
  id: "VirtualBodyDouble",
  title: "Virtual Body Double",
  tagline: "A quiet coworking partner for solo tasks",
  tags: ['focus', 'productivity', 'body double', 'accountability', 'cowork', 'solo tasks'],
  icon: "👥",
  categories: ['Energy', 'Do It!'],
  headerColor: "#b8dcd8",
  description: "An AI coworking companion that stays with you through a focus session — checking in, cheering you on, and helping you get unstuck. Pick from 6 modes (Deep Work, Sprint, Grind, Creative, Avoidance Buster, or Standard) and it adapts its whole personality to match. Like having someone else in the room, without the small talk.",
  guide: {
    overview: "Working near another person helps you focus — that's why coffee shops, libraries, and coworking spaces exist. Virtual Body Double recreates that effect digitally with a twist: you pick a session mode that changes your buddy's entire personality. Deep Work mode is a silent library companion. Sprint mode is a high-energy burst partner. Grind mode commiserates with dark humor. Creative mode never judges tangents. Avoidance Buster is extra-gentle for tasks you've been putting off. After each session, generate a shareable accountability card — a visual summary designed to screenshot and text to a friend.",

    howToUse: [
      "Choose a session mode — each one changes your buddy's personality, check-in style, and ambient messages",
      "Enter your task — tap 'Split' to have AI break it into sub-tasks with time estimates",
      "Set duration, check-in frequency, environment, and mood",
      "Start the session — your buddy's greeting, tips, and presence all match the mode you chose",
      "Respond to check-ins, check off sub-tasks, use 'I'm stuck' for concrete micro-steps",
      "When done, generate an accountability card to screenshot or share with friends",
      "Save and repeat — past sessions show mode icon and offer one-tap repeat"
    ],

    example: {
      scenario: "You need to write a quarterly report but keep opening other tabs instead.",
      action: "Mode: Avoidance Buster. Task: 'Write Q1 report'. Split into sub-tasks. Duration: 45 min.",
      result: "Buddy (extra gentle): 'The fact that you opened this tool is already a win. First step: just open the doc. That's it.' Sub-tasks appear as a checklist. Check-ins are compassionate, not judgy. When you tap 'drifting', buddy says 'That's totally okay — what's the next small thing you can type?' At the end, you generate an accountability card: '🌱 Avoidance Conquered — 45 min on a task you'd been dodging for a week.' You text the card to a friend."
    },

    tips: [
      "Match the mode to the task: Deep Work for writing, Sprint for email blitzes, Grind for data entry, Creative for brainstorming, Avoidance Buster for that thing you keep putting off",
      "The accountability card is designed for screenshots — use it to build social momentum",
      "25-45 minute sessions tend to work better than marathons. Start short, extend if you're in flow.",
      "Invite a real friend to cowork using the built-in message generator"
    ],

    pitfalls: [
      "Don't set 3-hour sessions hoping for a miracle. Start with 25 minutes and extend.",
      "Don't ignore check-ins — the accountability only works if you engage",
      "This provides presence and structure, not motivation. If the task is wrong, no timer will fix that."
    ]
  }
},

{
  modified: "",
  id: "WaitingModeLiberator",
  title: "Waiting Mode Liberator",
  tagline: "Break free when upcoming events freeze your day",
  tags: ['waiting mode', 'appointments', 'time block', 'freeze', 'productivity', 'energy'],
  icon: "⏳",
  categories: ['Energy', 'Do It!'],
  headerColor: "#b8dcd8",
  description: "Maps your free windows around appointments and matches tasks to your energy level so 'I have a thing later' doesn't freeze your whole day. Includes a guided launch to get you started on any block, and tracks pre-appointment anxiety against reality so you can see — over time — how much your brain overprepares for nothing.",
  guide: {
    overview: "You have a dentist at 2pm and a dinner at 7pm. It's 10am. You know you should do things, but you're frozen because 'I have stuff later.' This tool does the math you won't: you have 3 free hours across 2 windows, your first prep alarm is at 1:25pm, and until then the dentist doesn't exist. Enter your tasks and energy level — it assigns each one to a window it can actually fit. After the appointment, a 3-tap debrief compares your pre-appointment anxiety to how it actually went. Over sessions, the pattern becomes undeniable.",

    howToUse: [
      "Add events with time, type, prep, and travel. Tap + for multiple events.",
      "Set energy level — AI adjusts task difficulty accordingly",
      "Set anxiety level (1-10) — this builds your anxiety-vs-reality history",
      "List what you'd do today without these events",
      "AI maps tasks to free windows with intensity badges and starts a live countdown",
      "'Start With Me' on any block walks you from frozen to doing in 60 seconds, then runs a block timer",
      "'Just One Thing' for deep freezes — picks one absurdly small task",
      "After your appointment, 3-tap debrief: Did you use the time? How was it? Any notes?",
      "AI compares your anxiety to reality and spots patterns across sessions"
    ],

    example: {
      scenario: "Dentist at 2pm, energy 2/5, anxiety 8/10. Tasks: answer emails, clean kitchen.",
      action: "Event: 2pm Medical, 20m prep, 15m travel. Energy: Low. Anxiety: 8. Tasks entered.",
      result: "Countdown: '3h 10m of free time.' All blocks tagged 🟢 Easy (matches low energy). Tap 'Start With Me' on first block → guided launch: '1. Open email app. 2. Find the easiest email. 3. Hit reply. 4. Type one sentence. Timer started: 25 minutes.' After dentist, debrief: 'Anxiety was 8/10 but the appointment was totally fine. Last 3 medical visits: anxiety averaged 7.5, reality averaged 'fine.' Your brain is overestimating by about 5 points.'"
    },

    tips: [
      "'Start With Me' is the most important button. The gap between seeing the plan and doing the plan is where most tools fail — this one walks you across it.",
      "Always do the debrief, even if you skip the blocks. The anxiety data compounds fast.",
      "Be honest about energy. The tool adjusts. Lying to yourself gives you a plan you can't execute.",
      "After 3+ debriefs for the same appointment type, check Patterns — the anxiety trend is eye-opening."
    ],

    pitfalls: [
      "Don't skip the debrief — it's 3 taps and makes every future session better",
      "If energy is 1-2, trust the easy blocks. Don't override and attempt deep work.",
      "This helps with appointment-triggered paralysis, not general procrastination"
    ]
  }
},

{
  modified: "",
  id: "BrainDumpBuddy",
  title: "Brain Dump Buddy",
  tagline: "Everything in your head → one clear next step",
  tags: ['brain dump', 'overwhelm', 'organize thoughts', 'clarity', 'tasks', 'next step', 'anxiety', 'racing thoughts', 'stressed', 'too much to do', 'prioritize', 'clear head', 'task sorting', 'worry', 'chaos', '3am thoughts', 'can\'t focus', 'voice input', 'emergency mode', 'to-do list', 'mental load', 'structure thoughts', 'productive'],
  icon: "🧠",
  categories: ['Me', 'Do It!'],
  headerColor: "#e0b8b8",
  description: "Dump everything swirling in your head — typed, rapid-fire, or voice — and AI sorts the chaos into action items, decisions, worries, and things you can drop. Most overwhelm turns out to be 8 real tasks hiding under a lot of noise.",
  guide: {
    overview: "Your head is full. Work tasks blurring into personal worries blurring into vague anxiety. This tool takes the whole mess — no structure required — and sorts it into clear buckets. The key insight: most people in overwhelm have far fewer actual tasks than they think. Then it goes further: Shrink the List negotiates your tasks shorter. Map to My Day turns the list into a schedule. Worry Excavator digs into anxieties to find hidden actionable tasks. Reclassify lets you fix anything the AI miscategorized. Emergency mode strips everything to just 3 things when you can barely function.",

    howToUse: [
      "Choose context (optional) — work overwhelm, anxiety spiral, 3am thoughts, etc.",
      "Pick input mode: type, rapid-fire, or voice (just talk into your phone)",
      "Dump everything. Don't organize. Stream of consciousness.",
      "If barely functioning, toggle Emergency Mode for just 3 things.",
      "AI sorts into 9 categories with overwhelm meter. Check off your Do First.",
      "Use Power Tools: Shrink the List (challenge every item), Map to My Day (build a schedule), Compare to Last Dump (see what resolved)",
      "Dig deeper on any worry with the 🔍 button — AI finds hidden tasks.",
      "Disagree with a category? Reclassify any item with the arrow buttons.",
      "Re-dump carries unchecked items forward. Pattern analysis after 3+ dumps."
    ],

    example: {
      scenario: "Sunday night brain spiral: dentist, work email, mom's birthday, overwhelmed, job offer decision, messy kitchen, groceries, electric bill, Sarah's text, no exercise...",
      action: "Context: Life chaos. Free dump all of it.",
      result: "Overwhelm meter: 22 thoughts → 6 real tasks. Shrink the List: 'Does the whole kitchen need cleaning? Wipe the counters — 3 minutes, 80% of the stress gone.' Map to My Day: 20-minute evening schedule with breaks. Worry Excavator on 'worried about job offer': hidden task found — 'Write a pro/con list for 10 minutes.' Dump Diff shows 3 items from last week resolved without noticing."
    },

    tips: [
      "Voice mode is best when your hands are shaking or thoughts are racing fastest.",
      "Emergency mode isn't failure — it's the right tool for acute overwhelm.",
      "Shrink the List after every dump. Most people's lists can lose 30-50% of items.",
      "The inflation ratio in Patterns is the big insight: most brains inflate to-do lists by 3-5x.",
      "Reclassify freely — the AI's first sort is a starting point, not gospel."
    ],

    pitfalls: [
      "Don't pre-organize your dump. Raw chaos is the point.",
      "If Shrink the List drops something you disagree with, that's fine — it's a negotiation, not an order.",
      "This doesn't replace a task manager. It's for the moment of overwhelm when you can't think straight."
    ]
  },
  crossRefs: [
    { id: 'CrisisPrioritizer', reason: 'When you\'re completely overwhelmed — cuts to the 3 things that matter most right now' },
    { id: 'VirtualBodyDouble', reason: 'Once you know what to do, need someone to work beside you and keep you on track' },
    { id: 'WaitingModeLiberator', reason: 'When many worries are about things blocked waiting on others' },
    { id: 'ChaosPilot', reason: 'For urgent situations where you need to decide what to do right now' },
  ]
},

{
  modified: "2026-03-11",
  id: "GentlePushGenerator",
  title: "Gentle Push Generator",
  tagline: "Micro-challenges just outside your comfort zone",
  tags: ['challenge', 'comfort zone', 'growth', 'push', 'motivation', 'try something new'],
  icon: "🫸",
  categories: ['Body', 'Energy'],
  headerColor: "#ccdfc4",
  description: "Micro-challenges slightly outside comfort zone, calibrated to current capacity. Achievable but slightly scary. Not aggressive motivation - gentle expansion. Celebrates attempts regardless of outcome. Growth without pressure.",
  guide: {
    overview: "Growth happens at the edge of comfort, but pushing too hard backfires. This tool creates micro-challenges sized to your current capacity - achievable but slightly scary. Success = attempting, not outcome. Gentle expansion, not forced change.",
    
    howToUse: [
      "Describe your comfort zone",
      "State where you want to grow",
      "Set current capacity (low/medium/high)",
      "Get sized challenge with easier/harder alternatives",
      "Attempt counts as success, not completion"
    ],
    
    example: {
      scenario: "Comfort zone: You're comfortable texting friends but terrified of phone calls. Growth area: Social connection. Capacity: Medium.",
      action: "Input exactly that.",
      result: "Gentle push: Call one friend for 5-minute catch-up this week. Why this size: Small enough to be achievable (one friend, 5 min, full week to do it), big enough to be growth (actual phone call). If too much: Voice message instead of call (still voice, less pressure). If not enough: 10-minute call or call someone you're less close with. Celebration: Attempting counts as success regardless of outcome. If you call and it's awkward, you still succeeded. If you don't do it: That's okay too - you're not required to grow right now."
    },
    
    tips: [
      "Actually attempt the challenge if you can - reading about it isn't growth",
      "Use the 'if too much' alternative without guilt - it's there for a reason",
      "Celebrate the attempt even if it went badly - you did the scary thing",
      "Current capacity matters - don't force growth during crisis/low periods",
      "Multiple small pushes compound better than one giant leap"
    ],
    
    pitfalls: [
      "Don't beat yourself up if you don't do it - permission to decline is genuine",
      "If you never do any challenges, you're not being honest about capacity or readiness",
      "This is for voluntary growth, not required life tasks (those need different approach)"
    ]
  }
},

{
  modified: "",
  id: "BrainStateDeejay",
  title: "Brain State Deejay",
  tagline: "Science-backed playlists for your brain state",
  tags: ['music', 'playlist', 'focus', 'mood', 'brain', 'concentration', 'songs', 'study', 'calm', 'energy', 'anxiety', 'stress', 'relaxation', 'productivity', 'ambient', 'lofi', 'spotify', 'bpm', 'tempo', 'headphones', 'transition', 'work', 'meditation', 'flow state'],
  icon: "🎧",
  categories: ['Energy', 'Me'],
  headerColor: "#b8dcd8",
  description: "Get science-backed music playlists tailored to your current brain state and where you need to be. Goes beyond generic 'focus music' with tempo, complexity, and sensory preference tuning.",
  guide: {
    overview: "Music affects cognitive states through tempo, complexity, and familiarity. This tool creates progressive playlists that transition you from anxious to calm, scattered to focused, or low-energy to motivated. Considers sensory sensitivities like sudden sounds, vocal distraction, bass sensitivity, and need for predictable patterns.",

    howToUse: [
      "Select your current state (anxious, scattered, low energy, overwhelmed, foggy)",
      "Select your desired state (focused, calm, energized, creative, grounded)",
      "Optionally add task context and music preferences",
      "Expand Listening Sensitivities to flag sounds or patterns that don't work for you",
      "Get a 3-phase playlist strategy with specific genres, artists, and Spotify search terms"
    ],

    example: {
      scenario: "You're scattered and can't focus on writing a report. You need auditory stimulation but lyrics pull your attention away.",
      action: "Select 'Scattered/Unfocused' → 'Focused', add 'Writing report', check 'Vocals are distracting'.",
      result: "3-phase playlist: (1) Familiar upbeat instrumentals (10 min) to build momentum, (2) Lo-fi or post-rock at 90-95 BPM (60 min) for sustained focus, (3) Minimal ambient (30 min) to maintain flow without effort. Includes Spotify search terms and alternatives if the energy level is off."
    },

    tips: [
      "Start the playlist BEFORE starting work — music helps prime your brain for the transition",
      "Let the phases play through in order; don't shuffle, the progression is intentional",
      "Use the 'Not quite right?' panel to adjust without starting over",
      "If you find yourself noticing the music, that's a signal to switch to a lower-complexity phase",
      "Headphones help isolate you from competing sounds and strengthen the focus cue"
    ],

    pitfalls: [
      "Don't use unfamiliar music for deep work — processing new songs competes with your thinking",
      "Don't use lyrical music for verbal tasks like writing or reading — language processing interferes",
      "Don't ignore 'too much/too little stimulation' signals — the Adjust panel can fix this quickly"
    ]
  }
},

{
  modified: "2026-03-23",
  id: "SpiralStopper",
  title: "Spiral Stopper",
  tagline: "Emergency intervention for spirals, freezes, and crashes",
  tags: [
    'anxiety', 'spiral', 'panic', 'worry', 'catastrophize', 'frozen', 'stuck',
    'overwhelmed', 'crashed', 'burnout', 'grounding', 'racing thoughts', 'crisis',
    'distortion', 'reality check', 'cant start', 'cant move', 'exhausted', 'shutdown'
  ],
  icon: "🌀",
  categories: ['Energy', 'Me'],
  headerColor: "#2a5248",
  description: "Three-mode crisis tool for when your brain goes sideways. Spiraling gets you grounded with reality checks and a distortion-busting anchor statement. Frozen gets you unstuck with one micro-action at a time and explicit permission to stop. Crashed gets you a severity-matched recovery protocol with basics checklists and staged instructions. All three log episodes and unlock pattern analysis after 3+ entries.",
  guide: {
    overview: "SpiralStopper is an in-the-moment intervention tool — not a therapy replacement, but a structured first responder for the three most common mental crisis states. Spiraling uses cognitive distortion identification and evidence-based reality checks. Frozen delivers one micro-action at a time with no plans, no decisions, and explicit permission to stop after any step. Crashed matches a recovery protocol to your severity level and crash type, with staged instructions so you only have to do the absolute minimum. All three modes log episodes persistently and unlock pattern analysis after 3+ entries, helping you spot your triggers and build a personal intervention toolkit over time.",
    howToUse: [
      "Choose your current state: Spiraling (racing thoughts), Frozen (can't move or start), or Crashed (completely spent)",
      "Spiraling: dump your thoughts unfiltered, optionally add your trigger and physical symptoms, rate intensity 1-5, then hit Stop the Spiral",
      "Frozen: optionally say what you're stuck on, indicate if you can physically get up, then tap 'Give me one thing' — complete it, tap Done, get the next one",
      "Crashed: select what happened (exhaustion, emotional overload, burnout, overwhelm collapse, sensory overload), set severity, and get a staged recovery protocol",
      "After any mode, do the optional debrief — 3 taps that update your episode log and improve future interventions",
      "After 3+ episodes, tap the history counter to run pattern analysis and see your personal toolkit"
    ],
    example: {
      scenario: "It's 11pm. You made an error at work, your thoughts are spiraling into 'I'm going to get fired and everyone thinks I'm incompetent', your chest is tight, and you can't stop.",
      action: "Select Spiraling. Dump everything: 'I messed up the report, my boss is going to notice, I'll get fired, I've always been bad at this...' Add trigger: 'work mistake'. Physical: 'tight chest, can't stop thinking'. Intensity: 4/5.",
      result: "Immediate action: box breathing, right now, why explained. Distortion identified: catastrophizing + mind reading. Reality checks for each anxious thought. Grounding exercise with timed steps. Compassionate anchor: a single statement that reframes the whole spiral. Pattern note if you've been here before. After-spiral suggestion for what to do next."
    },
    tips: [
      "Don't filter your thoughts in Spiral mode — the messier and more catastrophic, the better the reality checks",
      "In Frozen mode, each step is designed to be completable even if you're barely functional — trust the size of the action",
      "The debrief takes 30 seconds and dramatically improves pattern analysis — do it even if you feel better",
      "Pattern analysis after 3+ episodes is where this tool gets genuinely useful — your personal toolkit is built from your actual history",
      "Crashed mode has a 'what can you do right now?' field — be honest, even if the answer is 'nothing'"
    ],
    pitfalls: [
      "This is a first-responder tool, not a replacement for professional support — if crises are frequent, please talk to someone",
      "Don't skip the Frozen mode steps to 'do more' — one thing at a time is the entire point",
      "The episode log caps at 6 — if you want longer pattern history, use it consistently and run analysis before the log rolls over"
    ]
  }
},
{
  modified: "",
  id: "VelvetHammer",
  title: "Velvet Hammer",
  tagline: "Transform furious drafts into professional messages",
  tags: ['angry message', 'professional email', 'negotiate', 'persuade', 'firm', 'boundary', 'pushback', 'assertive', 'conflict', 'rewrite', 'workplace', 'communication'],
  icon: "🔨",
  categories: ['Discourse', 'Humans'],
    headerColor: "#e0b8b8",
  description: "Transform angry draft messages into professional communication. Type what you really want to say, then get three polished versions that preserve your point while removing the fire.",
  guide: {
    overview: "Velvet Hammer helps you communicate assertively without burning bridges. When you're furious and need to send a professional message, type your raw, unfiltered thoughts—insults, sarcasm, and all. The tool analyzes your legitimate concerns and rewrites them into three professional variants: Collaborative (assumes good faith), Balanced (clear boundaries), and Firm (direct but professional). Your anger gets validated, your point gets preserved, but the inflammatory language disappears.",
    
    howToUse: [
      "Type or paste your angry draft message in the 'What I want to say' box—don't hold back",
      "Optionally add context: your relationship to the recipient (boss, colleague, landlord, etc.)",
      "Optionally specify what you're trying to achieve (apology, compensation, behavior change, etc.)",
      "Optionally indicate the power dynamic (you have leverage, you're equals, they have power over you)",
      "Click 'Transform Message' and review three professionally reworded versions"
    ],
    
    example: {
      scenario: "Your colleague took credit for your work in a meeting. You want to type: 'You're a backstabbing liar who steals other people's work. This is the third time you've done this and I'm sick of it.'",
      action: "Paste that angry message, select 'colleague' as relationship, 'behavior change' as goal, and 'neutral' power dynamic. Generate.",
      result: "You get three options: Collaborative ('I wanted to address some concerns about project attribution...'), Balanced ('I need to discuss instances where my work was presented without acknowledgment...'), and Firm ('There have been multiple occasions where you've presented my work as your own. This pattern is unacceptable...'). Each preserves your factual claim while removing personal attacks."
    },
    
    tips: [
      "The angrier your draft, the better—the tool is designed for maximum rage translation",
      "Add context fields for better calibration: 'boss' relationships get more diplomatic, 'you have leverage' makes messages firmer",
      "The 'Collaborative' version assumes good intentions—use when you want to preserve relationships",
      "The 'Firm' version is direct and sets clear boundaries—use when previous attempts have failed",
      "Your original angry draft stays completely private and is never stored anywhere"
    ],
    
    pitfalls: [
      "Don't use the 'Firm' version as your first contact—it's for escalation after polite attempts fail",
      "Context matters: review all three variants and choose based on your actual relationship and goal",
      "The tool preserves your factual claims but removes absolutes like 'always' and 'never'—if your draft has exaggerations, they'll be toned down to what's defensible"
    ]
  }
},

{
  modified: "",
  id: "TheGap",
  title: "The Gap",
  tagline: "Stuck on a concept? We'll find where your understanding broke.",
  tags: ['stuck', 'concept', 'confused', 'gap', 'knowledge', 'study', 'struggling', 'fundamentals'],
  icon: "🔍",
  categories: ['Go Deep!'],
  headerColor: "#d4dde8",
  description: "Enter any concept you're struggling with and The Gap traces backwards through the prerequisite chain to find the exact point where your understanding broke.  Four gap types diagnosed: conceptual (don't get why), procedural (can't do the steps), definitional (don't know what it means), notational (symbols blocking you).",
  guide: {
    overview: "The Gap solves the #1 study mistake: when you're stuck on something, you try to re-read the hard material. But the problem is almost never the hard material itself — it's a prerequisite you're missing. Someone struggling with integrals usually has a limits gap. Someone struggling with limits usually has a functions gap. The Gap traces the dependency chain, diagnoses the gap type, and gives you a focused fix for the specific hole.",
    howToUse: [
      "Enter the concept you're stuck on — be specific ('integration by parts' not just 'calculus')",
      "Add subject, your level (high school through grad), and what you DO understand to help calibrate",
      "Review the prerequisite chain — each node has a quick self-test and gap-likelihood rating",
      "Click any node and answer honestly: Can't answer / Unsure / Got it",
      "Review the likely gap, its refresher, and the 3-step study plan",
      "Use Deep Dive for worked examples and practice problems on the specific gap"
    ],
    example: {
      scenario: "You're in Calculus II and can't understand integration by parts. You've watched three YouTube videos and it still doesn't click.",
      action: "Enter 'Integration by parts', subject 'Calculus', level 'Undergrad', add 'I can do basic integrals but u-substitution was already shaky'.",
      result: "The Gap builds a chain: Algebra → Functions → Limits → Derivatives → Product Rule → Integration by Parts. The likely gap is flagged at Product Rule (high likelihood) — you never internalized WHY the product rule works, so you can't reverse it into integration by parts. Quick refresher explains the connection, practice problems confirm the fix, and the forward connection shows exactly how understanding the product rule makes integration by parts click."
    },
    tips: [
      "The 'What do you understand?' field is gold — it lets the tool skip prerequisites you already have",
      "Gap types matter: a conceptual gap needs explanation, a procedural gap needs practice, a definitional gap just needs a definition",
      "Quick tests at each node are honest diagnostics — don't skip them, they're how you find the real gap",
      "The likely gap is usually 2-3 steps back from where you think the problem is",
      "Deep Dive practice problems go easy → hard — if you nail the easy one, the gap is probably elsewhere",
      "Works for any subject: STEM, humanities, social sciences, languages — anything with prerequisite knowledge"
    ]
  }
},

{
  modified: "",
  id: "BuyWise",
  title: "Buy Wise",
  tagline: "The research you'd do if you had an hour — done in seconds",
  tags: ['buy', 'purchase', 'worth it', 'price', 'research', 'shopping', 'impulse', 'regret', 'gift', 'compare', 'budget', 'negotiate', 'deal', 'overpaying'],
  icon: "🧠",
  categories: ['Loot', 'Do It', 'Veer'],
  headerColor: "#c0d8b8",
  description: "Pre-purchase research assistant. Enter what you're buying and get fair price analysis, timing advice, total cost of ownership, cheaper alternatives, regret predictions, negotiation scripts, and an impulse check. Like having a knowledgeable friend who stops you from overpaying.",
  guide: {
      overview: "BuyWise gives you everything you'd learn from an hour of research in seconds. Enter any product, and it tells you if the price is fair, whether to buy now or wait, the true total cost of ownership (including consumables and maintenance), cheaper alternatives that do 90% of the job, common buyer regrets, where to buy, and negotiation scripts when haggling is realistic. Comparison mode lets you evaluate two products side by side weighted by your priorities. The impulse check is an honest gut-check for purchases you're not sure about.",
      
      howToUse: [
        "Enter what you're buying — specific model or general product type both work",
        "Add the price you've seen (optional — helps with fair price analysis)",
        "Select your currency and urgency (need it today vs can wait)",
        "Pick what matters most to you (price, durability, features, quality, convenience)",
        "Toggle 'impulse buy' if you're not sure you need it — gets you an honest evaluation",
        "Use 'Compare with another product' to evaluate two options head-to-head",
        "Add any context that matters ('I bake once a month', 'replacing a 5-year-old laptop')",
        "Hit Research and review each section"
      ],
      
      example: {
        scenario: "You're looking at a KitchenAid stand mixer for $350. You bake occasionally and your priority is durability. You can wait.",
        action: "Enter 'KitchenAid stand mixer', price $350, urgency 'Can wait', priority 'Durability', context 'I bake once a month'",
        result: "Verdict: 'Good mixer, but overpaying — and you might not need it.' Fair Price: Typically $250-280 on sale, $350 is full retail. Timing: Wait for Amazon Prime Day or Black Friday for 25-30% off. TCO: $350 + $40 in attachments = $390 year 1. Cheaper Alternative: Hamilton Beach stand mixer ($80) handles everything except bread dough. Regret Predictor: 'People who bake occasionally use their stand mixer about 8 times in the first year. That's $44 per use at this price.' Impulse check not triggered but context note: 'You said you bake once a month. A $35 hand mixer handles that. Save the stand mixer for when you're baking weekly.'"
      },
      
      tips: [
        "The Total Cost of Ownership often reveals the real price — a cheap printer needs expensive ink",
        "Impulse check mode is genuinely useful — it asks questions you're avoiding",
        "Comparison mode works best when you specify your priority so it can weight the recommendation",
        "The negotiation scripts only appear when haggling is realistic — cars, furniture, services, rent",
        "Adding context ('replacing old one', 'gift', 'bake once a month') dramatically improves the advice",
        "Timing advice includes sale calendars — waiting 3 weeks can save 30%"
      ],
      
      pitfalls: [
        "Prices are AI estimates from general market knowledge — always verify current prices",
        "The tool can't check live inventory or current sales",
        "Negotiation advice works best for big-ticket items where haggling is expected"
      ]
    }
},
{
  modified: "2026-03-24",
  id: "SafeWalk",
  title: "SafeWalk",
  tagline: "Prepare smart, walk safe",
  tags: ['walk', 'safety', 'route', 'night', 'campus', 'street', 'safe', 'solo', 'walking home', 'emergency', 'alarm', 'fake call', 'flashlight', 'location sharing', 'check-in', 'timer', 'personal safety', 'nighttime'],
  icon: "🚶",
  categories: ['The Grind'],
  headerColor: "#1e2a3a",
  description: "AI safety coach for solo walks — assess your route before you go, then use the Walking tab for a check-in timer, convincing fake incoming call, GPS location sharing, and a one-tap emergency alarm.",
  guide: {
    overview: "SafeWalk helps you prepare for walks with an AI safety assessment tailored to your specific route, time of day, and area — then gives you real-time companion tools while you're walking. Plan tab: describe your walk, get watch-for items, a pre-walk checklist, route suggestions, and a copy-paste ETA message. Walking tab: check-in timer with auto-escalation, fake incoming call (with ringtone and vibration), flashlight, GPS location sharing, and emergency alarm. Add emergency contacts in settings for personalized alerts.",

    howToUse: [
      "PLAN TAB: Describe your route, select time of day, area type, and duration. Add any specific concerns. Tap 'Assess My Walk' for a personalized safety briefing.",
      "Review the checklist and check off items as you prepare. Copy the ETA message and text it to someone.",
      "WALKING TAB: Set a check-in timer for your expected walk duration. When it expires, tap 'I'm Safe' or get help.",
      "Use Fake Call if you want to look occupied or need an excuse to change direction — it generates a realistic incoming call with ringtone.",
      "Use Share Location to copy your GPS coordinates and ETA into a text message with one tap.",
      "SETTINGS: Add emergency contacts — your primary contact's name appears on fake calls."
    ],

    example: {
      scenario: "Walking home from a friend's apartment at 11pm through a neighborhood with a poorly lit park section, about 20 minutes.",
      action: "Enter route description, select 'Late night', pick 'Poorly lit' and 'Park/trail', set duration '20-30 min'. Tap Assess.",
      result: "AI flags the park section visibility drop, suggests the commercial street alternative (+5 min but well-lit), gives a tailored checklist (headphones out, share location, reflective clothing). You copy the ETA message, text your roommate, switch to Walking tab, set 25-min timer, and go."
    },

    tips: [
      "Add at least one emergency contact in settings — their name shows on fake calls, making them more convincing",
      "The fake call generates an actual ringtone sound and vibration pattern — it looks real to anyone nearby",
      "Set the check-in timer slightly longer than your expected walk — you can always tap 'I'm Safe' early",
      "Share Location copies your GPS coordinates as a Google Maps link — paste it into any messaging app",
      "The AI assessment doesn't have real-time crime data — it helps you think through your walk, not guarantee safety",
      "The alarm is LOUD — it uses your phone's speaker at maximum output. Use it only in a genuine emergency."
    ],

    pitfalls: [
      "The AI assessment is general awareness, not real-time crime or traffic data",
      "Flashlight requires camera permission — if denied, the tool uses a white-screen fallback",
      "Location sharing requires browser location permission — grant it before your walk, not during"
    ]
  }
},
{
  modified: "",
  id: "RoommateCourt",
  title: "RoommateCourt",
  tagline: "Settle disputes and assign chores — no arguments",
  tags: ['roommate', 'conflict', 'house', 'chores', 'living situation', 'dispute'],
  icon: "⚖️",
  categories: ['Humans'],
  headerColor: "#e0b8b8",
  description: "Two tools in one: AI-powered dispute mediation that analyzes fault, surfaces the real underlying conflict, and gives you a word-for-word conversation script — plus a fair chore assignment engine that balances effort across rounds using history, so nobody can claim it's unfair. Includes a 'That's Not Fair!' button that reviews complaints against actual data.",
  guide: {
    overview: "RoommateCourt has two tabs. Dispute Court: describe a roommate conflict, get an impartial AI verdict with fault percentages, the real underlying issue (not just the surface fight), immediate action steps, a copy-paste conversation script, boundaries to set, escalation options tailored to your living situation, and an honest reality check. Chore Roulette: add your household and chores, get AI-balanced assignments weighted by effort (light/medium/heavy) that account for history across rounds — with a 'That's Not Fair!' button that reviews complaints against actual data and either revises assignments or explains with numbers why they're already fair.",

    howToUse: [
      "DISPUTE COURT: Describe the conflict, select category and duration, explain your side AND what the other person would say (be honest — the AI catches one-sided framing). Select your living situation for tailored escalation advice.",
      "Review the verdict, fault split, and underlying issues. Copy the conversation script to rehearse before talking to your roommate.",
      "CHORE ROULETTE: Add household members and chores (use quick-add pills or type custom ones). Tap 'Assign Chores' for AI-balanced distribution.",
      "Check off chores as they're completed. Hit 'Finalize Round' to save to history — future assignments will account for past rounds.",
      "If assignments feel unfair, tap 'That's Not Fair!' and describe the problem. The AI reviews your complaint against history data."
    ],

    example: {
      scenario: "Your roommate keeps leaving dishes in the sink and you've brought it up twice but nothing changed. Also need to assign weekly chores fairly.",
      action: "Dispute Court: describe the dish situation, select 'Chores' category, 'Weeks' duration, 'Going in circles' communication. Then switch to Chore Roulette, add both names and chores including dishes.",
      result: "Dispute tab: AI acknowledges your frustration but flags that repeated nagging without consequences isn't a strategy — gives you a specific conversation script with boundaries ('If dishes aren't done within 24 hours, I'll put them in a bin in your room'). Chore tab: assigns dishes to your roommate this round since history shows you've had them more, balances total effort points, and explains why."
    },
    tips: [
      "Be honest about the other person's perspective in Dispute Court — the AI is trained to detect one-sided framing and will call it out in the reality check",
      "The conversation script is the most valuable output — copy it and rehearse before the actual conversation",
      "In Chore Roulette, finalize rounds consistently so the history data stays accurate — the AI uses it to prevent streaks",
      "The effort system means 1 heavy chore (bathroom) = 3 light chores (trash) — it balances total effort, not just count",
      "Use 'That's Not Fair!' with specifics ('I always get bathroom') rather than vague complaints — the AI checks actual numbers"
    ],
    pitfalls: [
      "Don't skip the 'Their side' field — a one-sided account gets a weaker verdict. The AI will note it was only hearing one perspective.",
      "Don't ignore the Reality Check section — it's the most honest part and might tell you something you don't want to hear",
      "Don't use Dispute Court to 'win' arguments — it's a mediator, not your lawyer. It will side against you if you're wrong.",
      "Chore assignments only get fairer over time if you finalize rounds — skipping rounds means no history for the AI to balance against",
      "If you clear history, the AI loses all context about past imbalances — only do this if you're starting fresh with new roommates"
    ]
  }
},

{
  modified: "",
  id: "RentersDepositSaver",
  title: "Renter's Deposit Saver",
  tagline: "Protect your security deposit on move-in day",
  tags: ['deposit', 'renter', 'move in', 'apartment', 'damage', 'landlord', 'documentation'],
  icon: "🏦",
  categories: ['Out & About', 'Loot'],
  headerColor: "#ccdfc4",
  description: "Walk through your apartment room by room on move-in day. Generates a formal condition report, landlord cover letter, photo shot list, and your state-specific deposit rights.",
  guide: {
    overview: "Renter's Deposit Saver is your move-in documentation coach. It walks you through every room with a detailed checklist so you can note the condition of walls, floors, appliances, and fixtures before you unpack. Then it generates a formal condition report, a professional cover letter to send your landlord, a prioritized photo shot list, and a breakdown of your state's security deposit laws. When move-out day comes, you'll have irrefutable proof of what was already there.",

    howToUse: [
      "Enter your apartment address, move-in date, and state",
      "Optionally add your landlord's name and email",
      "Walk through each room using the interactive checklist",
      "Rate each item (Good / Fair / Poor / Damaged) and add notes for anything not in perfect condition",
      "Click 'Generate Report' to get your full documentation package",
      "Copy the landlord letter and email it (with photos) to your landlord on move-in day"
    ],

    example: {
      scenario: "You're moving into a 1BR apartment. The kitchen has a cracked countertop and the bathroom tile has mold in the grout. Everything else looks fine.",
      action: "Mark kitchen countertop as 'Damaged' with note: '6-inch crack near sink edge'. Mark bathroom tile as 'Poor' with note: 'Black mold in grout lines around tub'. Rate everything else as 'Good'.",
      result: "Generates: (1) A formal condition report listing every room and item with conditions. (2) A professional cover letter to email your landlord requesting acknowledgment. (3) A shot list of exactly which photos to take (prioritizing the cracked counter and moldy grout). (4) Your state's rules on deposit return timelines, allowable deductions, and penalties for violations."
    },

    tips: [
      "Do this BEFORE unpacking — it's much easier to spot damage in an empty apartment",
      "Email the condition report + photos to your landlord AND yourself on move-in day (creates a timestamp)",
      "Don't skip rooms you think are fine — document good condition too, so landlords can't claim damage later",
      "Take photos with your phone's location and date metadata enabled",
      "Keep everything for the entire duration of your lease",
      "Pairs well with the Lease Trap Detector — use that before signing, use this on move-in day"
    ],

    pitfalls: [
      "This generates documentation, not legally binding proof — but it's extremely strong evidence in disputes",
      "Deposit laws vary wildly by state — always check the 'Your Rights' section for your specific state",
      "If your landlord won't acknowledge the report, that's a red flag — keep proof you sent it",
      "This is not legal advice — consult a tenant rights attorney for active disputes"
    ]
  }
},

{
  modified: "",
  id: "LaundroMat",
  title: "LaundroMat",
  tagline: "Never lose track of your laundry again",
  tags: ['laundry', 'washing', 'stain', 'clothes', 'fabric', 'clean', 'dryer'],
  icon: "🧺",
  categories: ['The Grind'],
  headerColor: "#d4dde8",
  description: "Laundry companion with smart timers, AI load advisor, and stain SOS. Set countdown alerts for washer/dryer, get AI care instructions for any load, and get emergency stain treatment steps.",
  guide: {
      overview: "LaundroMat is a three-in-one laundry tool: (1) Smart timers with browser notifications and audio alerts 5 minutes before your cycle ends, (2) AI Load Advisor that tells you exactly how to wash any combination of clothes, and (3) Stain SOS for emergency stain treatment using household supplies.",
      howToUse: [
        "⏱️ Timers: Set a countdown for your washer or dryer. Get browser notifications and audio alerts before the cycle ends — never leave clothes sitting again.",
        "🧠 Load Advisor: Describe what you're washing (or snap a care label photo) and AI tells you cycle settings, what to separate, drying risks, and time estimates. Hit 'Set timers' to auto-create timers from the estimates.",
        "🆘 Stain SOS: Pick the stain type, fabric, and how old it is. Get step-by-step treatment using stuff you already have — dish soap, vinegar, baking soda, etc."
      ],
      example: {
        scenario: "You're at a laundromat with a mixed load of jeans, t-shirts, and a wool sweater. You're worried about the sweater and need to know when the cycle ends.",
        action: "Open Load Advisor, type your load description. AI flags the wool sweater as high-risk (wash separately on delicate/cold, never machine dry). Hit 'Set timers' for 35 min wash + 45 min dry. Switch to Timers tab — you'll get a notification 5 minutes before each one finishes.",
        result: "Your sweater doesn't shrink. You're back at the machine before anyone touches your clothes. You also learn to turn jeans inside out before washing."
      },
      tips: [
        "Enable browser notifications on first use — they work even when you switch tabs",
        "Run multiple timers at once for washer + dryer or multiple machines",
        "The Load Advisor's 'Set these timers' button bridges directly to the Timers tab",
        "Stain SOS is time-sensitive — the faster you act, the better your chances",
        "Snap a care label photo if you don't understand the symbols — AI translates them to plain English"
      ]
    }
},
{
  modified: "",
  id: 'MoneyMoves',
  title: 'Money Moves',
  tagline: "What to do and what to say when money gets complicated.",
  tags: ['money', 'social', 'bills', 'finances', 'awkward', 'salary', 'budget'],
  icon: '💸',
  categories: ['Loot', 'Humans'],
  headerColor: "#c0d8b8",
  description: 'Handles social money awkwardness — split bills, can\'t-afford invitations, salary questions, bill triage, and money talks with partners or family.',
  guide: {
    overview: "Money Moves is your advisor for the money situations nobody teaches you how to handle. When someone asks what you make, when you can't afford the group trip, when a friend owes you money and it's getting weird — Money Moves gives you the exact words and the strategy. Covers 6 core situations: social affordability, bill splits, salary questions, money talks with partners, asking for money back, and emergency bill triage. No judgment, just practical guidance.",
    howToUse: [
      "Pick the situation type that matches what you're dealing with",
      "Fill in the specifics — who's involved, what the amount is, your relationship to them",
      "Optionally add context about your comfort level or what you've already tried",
      "Get a tailored script, strategy, and fallback options",
      "Copy the script directly or adapt it to your voice"
    ],
    example: {
      scenario: "Your friend group is planning a destination bachelorette weekend that costs $800. You genuinely can't afford it but you don't want to lie or make it awkward.",
      action: "Select 'Can't afford the invite', enter the situation details and your relationship to the group.",
      result: "You get a warm, honest opt-out script that doesn't over-explain or apologize, a counter-offer for a local celebration you can actually attend, and a note on timing — when to send it so it doesn't derail planning."
    },
    tips: [
      "The salary question situation is one of the most searched — use it before interviews, not just after someone asks",
      "For partner money talks, add as much context as you can — the more it knows about the dynamic, the more useful the script",
      "Bill triage mode works best when you list everything you owe — prioritization only works with the full picture",
      "If the first script feels too formal or too casual, say so — describe your voice and it adjusts"
    ]
  }
},

{
  modified: "",
  id: 'NerveCheck',
  title: 'Nerve Check',
  tagline: 'Real confidence for scary moments.',
  tags: ['confidence', 'anxiety', 'interview', 'presentation', 'nervous', 'fear', 'preparation'],
  icon: '💪',
  categories: ['Energy', 'Me'],
  headerColor: "#b8dcd8",
  description: 'Pre-game toolkit for interviews, presentations, hard conversations, dates, and medical appointments. Breaks down fear, builds a prep plan, and has an SOS mode for live panic.',
  guide: {
    overview: "Nerve Check is a pre-event confidence builder for any high-stakes moment. It works in two modes: Prep (before the event) and SOS (during live panic). In Prep mode, you describe what you're facing and get a fear breakdown — what's a real risk vs. what your brain is inflating — plus a custom preparation plan, a confidence anchor, and a 'worst case + survive it' walkthrough. SOS mode is for when you're already in it: a 60-second reset sequence calibrated to your situation.",
    howToUse: [
      "Choose Prep mode for advance preparation (day before, morning of) or SOS mode if you need help right now",
      "Describe the event: what it is, who's involved, what outcome you need",
      "Add what specifically scares you — the more honest, the better the breakdown",
      "In Prep mode: review your fear analysis, prep plan, and confidence anchor",
      "In SOS mode: follow the real-time reset sequence step by step"
    ],
    example: {
      scenario: "You have a panel interview at a company you really want. You bombed an interview six months ago and now your confidence is shot.",
      action: "Select Interview, describe the role and format, add 'I bombed my last interview and I'm scared of freezing up again'.",
      result: "Fear breakdown shows the freeze fear is based on a single data point, not a pattern. Prep plan covers the three most common panel questions for your field, how to pause gracefully when you need a moment, and a physical warm-up for the morning. Confidence anchor is a specific moment from your past work history the AI surfaces from your description."
    },
    tips: [
      "The fear breakdown is the most valuable part — read it carefully. Most fears are real but inflated, and seeing that in writing changes your relationship to them",
      "SOS mode works best if you've done Prep mode first — it references your anchor",
      "For medical appointments, add your specific concern (getting bad news, not being heard) — generic prep misses the point",
      "Run Prep mode 24 hours before, not 5 minutes before — give yourself time to actually absorb the plan"
    ]
  }
},

{
  modified: "",
  id: 'RechargeRadar',
  title: 'Recharge Radar',
  tagline: 'Predict when you\'ll need alone time this week.',
  tags: ['energy', 'introvert', 'social', 'recharge', 'schedule', 'alone time', 'burnout'],
  icon: '🔋',
  categories: ['Humans', 'Energy'],
  headerColor: "#e0b8b8",
  description: 'Social energy forecaster. Input your weekly events, get an energy cost breakdown, forecast your lowest battery point, and triage recommendations for what to skip, shorten, or modify.',
  guide: {
    overview: "Recharge Radar treats your social energy like a battery with a real charge level. Enter your week's events — work meetings, social plans, obligations, commutes — and it calculates the energy cost of each one, forecasts your lowest point, identifies the day you're most likely to hit empty, and recommends what to protect, shorten, skip, or reorder. It also spots recovery windows you might not have noticed and flags if you're heading into a deficit with no planned recharge.",
    howToUse: [
      "List your events for the week — include work obligations, social plans, travel, and any event you're dreading",
      "Rate your starting energy level and flag which events feel draining vs. energizing",
      "Optionally note any recovery time already built in (solo mornings, quiet evenings)",
      "Review the energy forecast — your predicted low point, highest-drain day, and deficit risk",
      "Apply the triage recommendations: what to cut, shorten, move, or protect"
    ],
    example: {
      scenario: "You have a full work week, a friend's birthday dinner Wednesday, a family lunch Saturday, and a work happy hour Friday. You're already tired.",
      action: "Enter all five categories of events, set starting energy to 'low', flag the happy hour as optional.",
      result: "Forecast shows you hit near-empty Friday afternoon before the happy hour. Radar recommends: protect Thursday evening as a recovery window, shorten Saturday lunch if possible (or leave early), skip or do a 30-minute appearance at the happy hour instead of 2 hours. Wednesday dinner is flagged as energizing because it's a close friend — keep it."
    },
    tips: [
      "Be honest about your starting energy — the forecast is only as accurate as your input",
      "Commutes count. A 45-minute packed subway ride before a big event is energy cost, not free time",
      "Energizing events are real — a coffee with someone you love can offset a draining meeting if you sequence them right",
      "Run Radar on Sunday evening as a weekly ritual — catching a deficit before it hits is much better than recovering from burnout"
    ]
  }
},
{
 modified: "2026-03-23",
 id: "SubscriptionGuiltTrip",
  title: "Subscription Guilt Trip",
  categories: ["Loot"],
  icon: "💳",
  description: "Audits subscriptions by actual usage vs cost. Calculates cost-per-use, identifies duplicates, provides cancellation difficulty ratings and scripts to overcome retention tactics. Guilt-free permission to cancel. 'You use gym 1x/month = $60/visit.'",
  tagline: "Cancel what you don't use. Negotiate what you keep.",
  headerColor: "#1e3020",  
  guide: {
    overview: "Subscriptions accumulate because canceling feels wasteful ('I might use it later') or difficult (retention tactics). This tool calculates actual usage cost, identifies which to cancel, and provides exact scripts to overcome guilt trips from retention agents. Math-based, no shame.",
    howToUse: [
      "List all subscriptions with monthly cost and actual usage",
      "Get cost-per-use analysis (brutal honesty)",
      "See recommended cancellations with annual savings",
      "Receive cancellation scripts for each (overcomes retention tactics)",
      "Learn cancellation difficulty (easy/medium/hard)",
      "Get permission statements to cancel without guilt"
    ],
    example: {
      scenario: "Subscriptions: Gym ($60/month, use 1x/month), Netflix ($15, watch 5hrs/month), Spotify ($10, use daily), Adobe ($20, haven't used in 3 months), Meal kit ($120, use 2x/month).",
      action: "Input all subscriptions with usage.",
      result: "Analysis: Gym: $60/visit (you go 1x/month). CANCEL. Netflix: $3/hour watched. Keep if you value it. Spotify: Daily use, good value. KEEP. Adobe: $0 use in 3 months. CANCEL immediately. Meal kit: $60/meal (2x/month). Overpriced vs groceries. CANCEL. Total monthly: $225. Recommended cancellations save: $200/month = $2,400/year. Gym cancellation script: 'I'd like to cancel my membership.' [They'll offer discount] 'No thanks, I've decided it's not a good fit.' [They'll ask why] 'My routine has changed. Please process the cancellation.' Adobe script: 'Cancel my subscription effective immediately.' [They'll offer pause] 'No, cancel completely.' Permission: You're paying $2,400/year for services you barely use. That's not frugal - it's wasteful. Canceling IS the financially responsible choice."
    },
    
    tips: [
      "Be honest about usage - 'I might use it' doesn't count if you haven't in 2+ months",
      "Duplicative services (Spotify + Apple Music) are obvious cuts",
      "Annual plans often can't be canceled mid-year - set calendar reminder for renewal",
      "Retention agents are trained to guilt trip - stick to the script",
      "Some subscriptions are worth it even if expensive - this tool identifies which"
    ],
    pitfalls: [
      "Don't keep subscriptions because you 'should' use them - you won't start suddenly",
      "Don't fall for 'pause for 3 months' retention offers unless you'll actually resume",
      "Don't assume free trials auto-cancel - they usually don't"
    ]
  }
},

];
export const getToolById = (id) => {
  return tools.find(tool => tool.id === id);
};