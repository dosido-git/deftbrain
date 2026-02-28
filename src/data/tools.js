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
   {date: "",
    id: "",
    title: "",
    category: "Daily Life",
    icon: "",
    description: "",
    tagline: "",

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

// DopamineMenuBuilder v6 — 5 modes (absorbs SpoonBudgeter, SocialBatteryForecaster, BurnoutBreadcrumbTracker, RoutineRuptureManager)
// REPLACES the existing DopamineMenuBuilder block in tools.js
{
  id: 'DopamineMenuBuilder',
  title: 'Dopamine Menu',
  Category: 'Wellness',
  icon: '✨',
  description: "Your complete energy management system — 5 modes in one tool. Recharge: build a personalized menu of activities that actually restore (not numb), with mood-aware suggestions, guided sequences, pattern tracking, and recharge debt monitoring. Budget: map today's tasks against available energy and see what actually fits — with explicit permission to drop what doesn't. Forecast: input your week's social and work events, get a battery drain prediction showing exactly when you'll hit empty, with recovery windows and polite decline scripts. Radar: 15-second daily check-in tracking sleep, mood, productivity, and social energy — spots burnout patterns by detecting when multiple signals decline simultaneously. Disruption: when life blows up your routine (sick day, travel, emergency), get a temporary adapted structure with keep/simplify/drop decisions and return-to-normal triggers.",
  tagline: 'Energy management — recharge, budget, forecast, track',
  category: 'wellness',
  gradient: 'from-emerald-500 to-teal-500',
  route: 'dopamine-menu-builder',
  actions: [
    'generate', 'just-do-this', 'build-menu', 'swap', 'rate-activity',
    'energy-match', 'pattern-check', 'accountability-nudge', 'recharge-insights',
    'build-sequence', 'schedule-checkin', 'debt-check',
    'budget', 'forecast', 'decline-message', 'radar-checkin', 'radar-analyze', 'disruption'
  ],
  promptKeys: {
    generate: ['energy', 'time_available', 'recent_activities', 'context', 'time_of_day', 'mood', 'environment', 'already_tried', 'curated_menu'],
    'just-do-this': ['energy', 'mood', 'environment', 'time_of_day', 'curated_menu', 'already_tried'],
    'build-menu': ['energy_range', 'interests', 'existing_menu', 'environment', 'shared'],
    swap: ['rejected_activities', 'energy', 'time_available', 'reason', 'mood', 'environment', 'already_tried'],
    'rate-activity': ['activity', 'rating', 'energy_before', 'energy_after', 'note', 'sensory_anchor', 'history'],
    'energy-match': ['energy', 'time_available', 'curated_menu', 'recent_context', 'mood', 'environment'],
    'pattern-check': ['activity_log'],
    'accountability-nudge': ['activity', 'recipient_type', 'tone'],
    'recharge-insights': ['activity_log', 'curated_menu'],
    'build-sequence': ['energy', 'time_available', 'mood', 'environment', 'curated_menu'],
    'schedule-checkin': ['checkin_time', 'current_energy', 'current_mood', 'current_activity', 'curated_menu'],
    'debt-check': ['activity_log', 'recent_energies'],
    budget: ['tasks', 'available_energy', 'mood'],
    forecast: ['events', 'energy_type', 'current_battery', 'recharge_hours', 'activity_log'],
    'decline-message': ['event_name', 'reason', 'relationship'],
    'radar-checkin': ['sleep', 'mood', 'productivity', 'social_energy', 'physical_symptoms', 'checkin_history'],
    'radar-analyze': ['checkin_log'],
    disruption: ['disruption_type', 'normal_routine', 'constraints', 'critical_tasks', 'available_energy', 'duration_estimate'],
  },
  exampleScenario: `It's Tuesday. You open Dopamine Menu and see five modes across the top.

RADAR: You tap your daily 15-second check-in — sleep 2/5, mood 3/5, productivity 2/5, social energy 4/5. The radar turns yellow: "Sleep and productivity have been declining together for 3 days. Your brain works worse when you sleep badly — this isn't a motivation problem, it's a sleep problem." It suggests: "Tonight, screens off by 9pm. That's the one intervention that matters right now."

BUDGET: You switch to Budget and enter today's tasks: client call (4 energy), grocery run (3 energy), report draft (5 energy), gym (3 energy). At 6/10 energy, the tool does the math: total cost 15, available 6. "You're at 250% capacity. The client call and report are required — that's 9 energy on 6 available. You're already over. Everything else gets dropped today." It gives permission: "Skipping the gym when you slept 4 hours isn't laziness — it's math."

RECHARGE: After the call, you're at 3/10. You tap "I can't even choose" — full-screen overlay: "Lie face down on the floor for 60 seconds. Don't do anything else." After that, the menu suggests activities matched to 3/10 energy, in-bed, evening. You save "rain sounds" to your personal menu and rate it 8/10.

FORECAST: Looking at the week ahead — Wednesday networking (30 people, presenting), Thursday friend coffee, Friday hosting a dinner party. The forecast shows your battery draining to -5% by Wednesday night: "BURNOUT RISK. You cannot do Wednesday AND Friday without intervention. Recommendation: decline one." You tap "decline script" and get a warm message to send.

DISRUPTION: Thursday you wake up sick. You switch to Disruption mode, tap "Sick day," set energy to 2/10, and list critical tasks (medication, feed cat, one email). The tool builds an adapted routine: Keep meds and cat. Simplify email to "one sentence reply." Drop everything else with explicit permission: "The dishes will wait. Dirty dishes don't hurt anyone." Return trigger: "When you can stand for 10 minutes without sitting down."

Five modes, one energy profile, everything compounds.`,
  features: [
    'Zero-decision mode: "I can\'t even choose" — one tap, one activity, full-screen, no menu',
    'Energy-matched menu: calibrated to exact energy level (1-10)',
    'Mood-aware: adapts for stressed, sad, anxious, restless, overstimulated, bored, numb',
    'Environment-filtered: only activities possible where you are (home, office, commuting, outdoors, in bed)',
    'Time-of-day awareness: auto-adjusts for morning/afternoon/night',
    'Recharge sequences: guided multi-step routines with transition cues and arc types',
    'Saved routines: save and replay proven sequences',
    'Recharge debt tracker: monitors energy trends, flags when you\'re running a deficit',
    'Surprise Me: random pick from your proven menu with 10-minute commitment lock',
    'Partner Menu: shared activities for two people with AI partner suggestions',
    'Before/after energy chart: visual history of how activities shift your energy',
    'Sensory anchors: associate specific songs, scents, or images with restorative activities',
    'Personal curated menu: save and rate activities, tracks usage stats and avg ratings',
    'Pattern detection: numbing traps, hidden gems, mood-specific patterns',
    'Check-in scheduler: timer with pre-planned activity ready when it fires',
    'Accountability nudge: casual invite messages for social activities',
    'Recharge dashboard: stats and trends after 5+ sessions',
    'Energy budgeting: map tasks against available energy with cost estimates',
    'Priority triage: required/important/optional with honest capacity assessment',
    'Permission engine: explicit permission to drop what doesn\'t fit — with reasoning',
    'Weekly energy forecast: event-by-event battery drain prediction',
    'Introvert/extrovert profile: adjusts all cost calculations to your energy type',
    'Burnout risk warnings: flags days where battery drops below 20%',
    'Recovery window planning: recommended recharge time between events',
    'Decline message generator: warm, honest scripts for saying no',
    'Daily 15-second check-in: tap 4 ratings + optional symptoms',
    'Cross-signal detection: flags when multiple metrics decline simultaneously',
    'Trend sparklines: visual history for sleep, mood, productivity, social energy',
    'Full pattern analysis: unlocks after 5+ check-ins with metric trends and interventions',
    'Persistent history: 90 days of check-in data builds your personal baseline',
    'Keep/simplify/drop framework: clear decisions for every routine element',
    'Survival schedule: minimal temporary structure that fits actual energy',
    'Return-to-normal trigger: how to know when regular routine can resume',
    'Explicit drop permissions: warm, specific permission for everything that can wait',
  ],
  relatedTools: ['BrainStateDeejay', 'HabitChain', 'BrainDumpStructurer'],
},
// BatchFlow
{
  id: 'BatchFlow',
  title: 'BatchFlow',
  category: 'productivity',
  icon: '⚡',
  description: 'Batch similar tasks by cognitive mode to minimize context switching and protect your focus. Includes weekly rhythms, A/B schedule comparison, time calibration, location-aware batching, resistance detection, and focus environment presets.',
  tagline: "Batch similar tasks to protect your focus and minimize mental gear-shifting",
    gradient: 'from-emerald-500 to-teal-500',
  route: 'batch-flow',
  actions: ['generate', 'quick-dump', 'rebatch', 'expand-batch', 'progress-update', 'share-plan', 'day-template', 'batch-insights', 'ab-compare', 'weekly-rhythm', 'resistance-check', 'time-calibrate', 'location-batch'],
  promptKeys: {
    generate: ['tasks', 'energy_curve', 'day_type', 'time_available', 'start_time', 'fixed_commitments', 'location_mode', 'pastBatches'],
    'quick-dump': ['text', 'energy_curve', 'day_type', 'time_available'],
    rebatch: ['batches', 'movedTask', 'fromBatch', 'toBatch', 'removedTasks', 'energy_curve'],
    'expand-batch': ['batch', 'energy_level'],
    'progress-update': ['completedBatches', 'remainingBatches', 'energy_level', 'time_remaining'],
    'share-plan': ['batches', 'time_available', 'recipientType'],
    'day-template': ['batches', 'templateName', 'day_type', 'energy_curve'],
    'batch-insights': ['sessions'],
    'ab-compare': ['tasks', 'energy_curve', 'time_available', 'fixed_commitments'],
    'weekly-rhythm': ['recurring_tasks', 'energy_curve', 'typical_commitments', 'preferences'],
    'resistance-check': ['deferred_tasks', 'sessions'],
    'time-calibrate': ['time_data'],
    'location-batch': ['tasks', 'home_base'],
  },
  exampleScenario: `You've got a messy day: write a blog post, email 3 clients, buy groceries, review a spreadsheet, call the dentist, organize your desk, and pick up dry cleaning. You're a morning person with a 2pm meeting.

BatchFlow groups these into cognitive batches: Creative block (blog post) at 9am during peak focus. Social block (emails + dentist call) at 10:30. Analytical block (spreadsheet review) at 11:30. Then your 2pm meeting. Mechanical block (organize desk) at 3pm when energy dips. Physical block (groceries + dry cleaning) as a location-optimized errand loop at 4pm.

Result: 12 context switches → 5. ~45 minutes saved. Each batch comes with a focus preset (notifications off, lo-fi music for creative; phone nearby for social) and a cognitive load heatmap showing your day's intensity curve.

Want to compare approaches? A/B Compare generates Sprint Mode (done by 2pm, exhausted) vs Marathon Mode (steady through 5pm, energy left). Pick your pace.

Over time, BatchFlow learns: "You underestimate creative tasks by 35% — padding accordingly." It flags stuck tasks you keep deferring and suggests fixes. Weekly Rhythm mode turns your recurring tasks into a sustainable week-level template.`,
  features: [
    'Batches tasks by 6 cognitive modes: Creative, Analytical, Social, Mechanical, Physical, Planning',
    'Matches batch order to your energy curve (morning person, night owl, etc.)',
    'Fixed commitments: schedule batches around meetings and appointments',
    'Location-aware batching: groups errands by route efficiency',
    'Focus environment presets: notifications, music, workspace setup per batch',
    'Cognitive load heatmap: hour-by-hour visualization of your day',
    'A/B Compare: Sprint (fast, intense) vs Marathon (steady, sustainable) schedules',
    'Weekly Rhythm: recurring task patterns across the whole week',
    'Resistance detector: flags repeatedly deferred tasks with diagnosis and fixes',
    'Time calibration: tracks estimated vs actual duration, suggests adjustment factors',
    'Brain dump mode: paste messy text, auto-extract and batch',
    'Expand batch: step-by-step execution plan with exact first actions',
    'Progress tracking: mid-day check-ins with reorder suggestions',
    'Day templates: save and reuse successful batch patterns',
    'Accountability sharing: generate messages for partners/friends/coworkers',
    'Pattern insights: unlock after 3+ sessions — favorite modes, completion rates, trends',
  ],
  relatedTools: ['CrisisPrioritizer', 'BrainDumpStructurer', 'BrainStateDeejay'],
},
// ═══════════════════════════════════════════════════════════
// LazyWorkoutAdapter v3
// ═══════════════════════════════════════════════════════════
  {
    id: "LazyWorkoutAdapter",
    title: "Lazy Workout Adapter",
    category: "Life",
    icon: "🧘",
    description: "Low-barrier movement that meets you where you are — especially when you don't want to exercise. 13 AI endpoints across 9 modes: Right Now builds workouts from energy level, body complaints, AND what happened today (12 context triggers like 'bad sleep', 'long meeting', 'emotional day' that fundamentally change the workout). 2-Minute Floor for when even 5 minutes is too much. Body Relief targets specific problem areas. Environment Stack layers invisible micro-movements onto activities you're already doing (watching TV, cooking, phone calls). Sleep Prep is a pre-bed wind-down optimized for transition to sleep with progressive relaxation and breathing patterns. Recovery is first aid for your body after life events (post-flight, post-crying, post-migraine) addressing physical and emotional residue. My Week plans 7 days as a menu, not a mandate. Breathe mode offers box breathing, 4-7-8, and calm patterns with visual timer. Built-in follow-along timer, exercise swap with memory, movement streaks, invisible progression, saved presets, and a 'Not Today' button for guilt-free skips. History tracks energy shifts, and Prove It analyzes your own data to show whether movement actually helps YOU — with real numbers, not motivation.",
    tagline: "Low-barrier movement that meets you where you are",

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
    id: "JargonAssassin",
    title: "Jargon Assassin",
    category: "Life",
    icon: "🗡️",
    description: "Translate confusing documents into plain language — then actually do something about them. 11 AI endpoints across 6 modes: translate any legal, medical, financial, insurance, or government document at 4 reading levels (ELI5 through Professional) with instant danger scoring, enforceability flags, and a growing jargon glossary. Ask follow-up questions. Deep-dive any flagged section line-by-line. Compare two document versions to catch every change. Red-Line Markup generates specific suggested edits with negotiation strategy. Template Compare tells you whether your document is normal or aggressive vs. standard documents of its type. Action Plan turns understanding into ordered steps with deadlines. Explain To reframes the content for a specific person (your parent, roommate, teenager). Multi-Document Dossier cross-references related documents to find conflicts and gaps. Letter Generator writes professional responses that reference specific clauses. Saves translations with danger scores for reference.",
    tagline: "Confusing documents → plain language → what to do about it",

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
    id: "DebateMe",
    title: "Debate Me",
    category: "Thinking",
    icon: "🥊",
    description: "The complete intellectual sparring system. 8 modes with 13 AI endpoints. Full Debate: state any position and face the steelman — the strongest possible opposing case with real evidence and real thinkers, not strawmen. Multi-turn with concessions, fallacy flags, mid-debate coaching, source checks, and strategic concession buttons. 5 debate formats (Freeform, Lincoln-Douglas, Cross-Examination, Oxford, Socratic). 3 challenge levels adjustable mid-debate. Switch sides for perspective-taking. Post-debate scorecard with Audience Verdict (third-party persuasion judgment) and Argument Map (visual tree of claim/counter-claim structure with defended/abandoned branches). Devil's Advocate Prep drills you for real meetings with audience-specific objections and recovery strategies. Fallacy Gym trains you to spot logical fallacies with streak tracking and difficulty scaling. Rematch targets your documented blind spots from previous debates. Highlight Reel analyzes patterns across all your debates and assigns a Debater Type archetype. Quick Spar for single-round challenges. 12 topic starters. Full transcript saves with replay. Stats dashboard with trend analysis.",
    tagline: "Find out how strong your position really is",

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
        result: "Prep gave you the 'but what about our culture' question you hadn't prepared for, plus a landmine to avoid ('don't mention competitor layoffs'). Debate scorecard: 7/10, blind spot on junior employee development. Audience Verdict: you were slightly more persuasive but lost them during the cost analysis. Argument Map shows you built wide but not deep — lots of claims, thin evidence. Rematch available targeting those exact weaknesses. Highlight Reel across 8 debates: you're an 'Intuitive Framer' who relies too heavily on appeal to authority — exercise prescribed."
      },

      tips: [
        "Devil's Advocate Prep before any important meeting, presentation, or difficult conversation — it's the highest-ROI mode",
        "Try Socratic format at least once — being questioned without the AI asserting anything forces you to examine your own assumptions in a way nothing else does",
        "Source Check your own claims, not just the AI's — discovering your own weak evidence mid-debate is better than discovering it in the real conversation",
        "The Fallacy Gym streak is addictive and genuinely useful — try 5 minutes a day at increasing difficulty",
        "Rematch is where real growth happens — same topic, but the AI remembers your blind spots and specifically targets them",
        "Your Highlight Reel Debater Type is revealing — share it and challenge friends to find theirs",
        "Cross-Exam format develops the hardest debate skill: asking questions that expose weaknesses without making assertions"
      ]
    }
  },
  {
    id: "PaperDigest",
    title: "Paper Digest",
    category: "Learning",
    icon: "📄",
    description: "Translate academic papers into plain language — no PhD required. 5 modes with 5 AI endpoints: digest any paper into a one-sentence finding with methodology description, limitations, jargon decoded, and an honest 'so what' assessment. Media Check compares what the paper actually says to how headlines report it, catching exaggerations, causation-from-correlation claims, and missing context. Compare two papers on the same topic to see where they agree and diverge. 'Does This Apply to Me?' gives personalized relevance based on your situation. Jargon Decoder explains any scientific term with analogies, not textbook definitions. Auto-builds a personal jargon dictionary as you read. Saves digests for reference.",
    tagline: "What this paper actually says — and whether what you read about it is true",

    guide: {
      overview: "PaperDigest is for the moment you see a headline like 'Scientists prove coffee cures everything' and think 'wait, does it really?' Instead of wading through dense abstracts, paste the paper text and get the actual finding in one sentence, what kind of study it was (described, not judged), what it proves vs. what people think it proves, and a warm honest take you'd hear from a smart friend over coffee. The Media Check is the killer feature — it compares what the paper says to what the headline claims and catches every type of distortion. Every term you encounter gets saved to a personal jargon dictionary that grows as you read.",

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
    id: "RoomReader",
    title: "Room Reader",
    category: "Social",
    icon: "🧠",
    description: "Social intelligence coach with 12 modes and 13 AI endpoints. Pre-Game event prep with starters, people maps, and worst-case saves. Quick Read for instant tap-and-go lines with refresh. Conversation Recovery for mid-conversation 'I just said something weird' emergencies with damage scoring. Person Prep for one specific person, plus a Recurring Person Tracker that logs interactions and generates fresh strategies from history. Group Dynamics for entering conversations and handling being ignored. Energy Match for bridging the gap when your energy doesn't match the room. Small Talk Ladder for progressing from surface-level to genuine connection. Culture Decoder for cross-cultural situations with etiquette, body language, and a key phrase. Signal Decoder for figuring out what someone meant. Follow-Up message drafter for the post-event text. Debrief that auto-builds a Playbook from wins. Social Autopsy for deep forensic analysis of interactions that went wrong. Persistent Playbook, Saved Game Plans with cheat sheet export, Tracked People with interaction histories.",
    tagline: "Read the room before you walk in",

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
    id: "FoodSwap",
    title: "Food Swap",
    category: "Health",
    icon: "🔄",
    description: "Find satisfying substitutions when dietary restrictions change your life. 10 modes with 17 AI endpoints: swap foods with closeness scores, restaurant ordering guides, pantry transitions with shopping lists, craving decoder, batch swaps, weekly meal plans, product label checker, social eating scripts, travel eating survival guides with printable language cards, and party menu planner for hosting guests with mixed restrictions. Supports multiple simultaneous constraints. Swap Journal tracks what you have tried with 1-10 ratings and generates a Swap Style personality analysis. Ingredient Dictionary auto-builds from label checks. Confidence Tracker follows your transition arc with milestone celebrations.",
    tagline: "Keep eating what you love — just differently",

    guide: {
      overview: "FoodSwap is for the moment you get a new dietary restriction and think 'but I LOVE mac and cheese.' Instead of generic lists, it analyzes what you crave (texture, richness, comfort) and finds the closest match — specific brands, honest scores, pro tips. Select multiple constraints at once. Rate swaps to teach it your preferences. Log tries in the Swap Journal and unlock your Swap Style personality after 5 entries. Ingredient Dictionary auto-grows from label checks. Confidence Tracker meets you where you are in the transition. Travel mode gives you printable language cards. Party Planner handles hosting guests with conflicting restrictions.",

      howToUse: [
        "Pick ALL your constraints (multi-select, saved automatically). Then choose a mode: Swap, Eat Out, Pantry, Cravings, Batch, Meal Plan, Labels, Social, Travel, or Party Plan",
        "Swap Mode: Describe a food, get ranked swaps. Rate them, star favorites, Try Another to regenerate, Deep Dive for brands, Full Recipe with steps. Log what you try in the Journal",
        "Travel Mode: Enter a destination, get safe foods, printable language cards to show servers, convenience store tips, hidden dangers, packing list, and an emergency plan",
        "Party Plan: List guests and their constraints, get a menu where most dishes work for everyone, a prep timeline, shopping list, and labeling strategy",
        "Journal + Dictionary + Check-In: Log swap experiences to build your Swap Style profile. Dictionary auto-learns from Label Reader. Weekly check-ins track your transition confidence with milestones and challenges"
      ],

      example: {
        scenario: "You are lactose intolerant and trying keto. You love mac and cheese, have a trip to Tokyo next month, and are hosting Thanksgiving for 8 people including a vegan cousin and a nut-free nephew.",
        action: "Select Dairy-Free and Keto constraints. Swap mac and cheese. Travel mode: enter Tokyo. Party mode: add each guest with their restrictions. Log your mac and cheese experiment in the Journal.",
        result: "Mac and cheese swap: cauliflower base + Violife cheddar + almond flour crust (82% match). Tokyo guide: printable allergy card in Japanese, safe convenience store brands at 7-Eleven, hidden dairy in dashi. Thanksgiving menu: 6 dishes that work for everyone plus 2 clearly-labeled options. Journal logs build your Swap Style personality over time."
      },

      tips: [
        "Log every swap you try in the Journal — even failed ones. After 5 entries the Swap Style analysis reveals patterns like 'you prefer texture over flavor accuracy' that make every future suggestion smarter",
        "Travel mode's printable language card is the most important thing to have on your phone abroad — copy it before you leave and screenshot it for offline use",
        "The Ingredient Dictionary compounds over time — every Label Reader check auto-adds flagged ingredients. After a few weeks you will have a personalized cheat sheet for your specific constraints",
        "Use the Confidence Check-In weekly during the first two months of a new restriction — it is timed to the known emotional arc (overwhelming → groove → autopilot → slip risk) and gives targeted support"
      ]
    }
  },
  // ── MoneyDiplomat ────────────────────────────────────────
  {
    id: "MoneyDiplomat",
    title: "Money Diplomat",
    category: "Daily Life",
    icon: "💵",
    description: "Navigate every awkward money situation with confidence. 18 scenario types covering tips, bill splits, Venmo requests, lending, dating, gifts, roommates, salary negotiation, inheritance, group travel, subscriptions, affordability checks, cultural money norms, charity, weddings, family, and coworker collections. Plus 5 bonus modes: instant tip/split calculator, debt tracker with AI nudge messages, conversation practice simulator, usage trends with charts, and a persistent profile so you never re-explain your budget or culture.",
    tagline: "Win every awkward money moment",

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
  },  {
    id: "SkillGapMap",
    title: "Skill Gap Map",
    category: "Career",
    icon: "🗺️",
    description: "Map the exact gap between where you are and where you want to be — then close it. 22 tools covering every stage of a career transition: explore roles with day-in-the-life simulations, get a personalized skill gap analysis, build learning timelines, generate proof-of-skill project ideas, decode job postings, practice mock interviews with AI, audit your resume, find target companies, get weekly nudge assignments, and track your progress with milestone celebrations. Includes market pulse, salary economics, mentor matching, networking scripts, and skill adjacency sequencing.",
    tagline: "Your GPS from current role to dream job",

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
  id: "HistoryToday",
  title: "HistoryToday",
  category: "Learning",
  icon: "📰",
  description: "Enter any current event, trend, or controversy. AI finds 2-3 structural historical parallels — not surface-level ('this is like Rome falling') but deep structural matches based on power dynamics, institutional behavior, and how similar situations actually played out. Each parallel includes what happened, how contemporaries understood it (and how they were wrong), what happened next, and specifically where the analogy breaks down. Dig deeper into any parallel for full timelines, turning points, echoing quotes, and information environment analysis. Get a counter-example showing when similar conditions led to a different outcome. Plus synthesis, predictions, and further reading.",
  tagline: "Find the structural historical parallel — not the obvious one",
  
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
  },
  
  keywords: [
    "history", "historical", "parallel", "analogy", "current events", "politics",
    "comparison", "what happened", "precedent", "pattern", "prediction",
    "structural analysis", "counter-example", "timeline"
  ],
  
  tags: ["Learning", "Analysis", "Current Events", "History"],
  difficulty: "easy",
},{
  id: "BragSheetBuilder",
  title: "Brag Sheet Builder",
  category: "Productivity",
  icon: "🏆",
  description: "A complete career advancement system. Start with the Accomplishment Excavator if you can't remember what you did, or use the weekly Journal to log wins as they happen. Add accomplishments (be as humble as you want) and get before/after transformations with verb upgrades, imposter syndrome coaching, and a metrics excavator that finds hidden numbers. Then go deeper: Strength Radar scores your sheet across 6-8 dimensions and finds gaps. JD Tailoring rewrites your bullets using a specific job description's language with match scoring and gap detection. Interview Matrix maps accomplishments to behavioral questions and shows what's covered vs exposed. Voice Match rewrites everything to sound like you (not AI) based on a writing sample. Plus: STAR stories on demand from any accomplishment, inline tweak/reword per bullet, add accomplishments without resetting, resume bullets, LinkedIn about, performance review, and raise ammunition with dollar estimates and a meeting script.",
  tagline: "Turn humble descriptions into a complete career advancement toolkit",
  
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
  },
  
  keywords: [
    "resume", "brag", "accomplishment", "achievement", "interview", "linkedin",
    "performance review", "raise", "promotion", "career", "job", "hire",
    "imposter syndrome", "bullet", "STAR", "power verb", "cover letter",
    "job description", "behavioral interview", "voice", "writing style",
    "strength assessment", "radar", "journal", "weekly log"
  ],
  
  tags: ["Productivity", "Career", "Writing", "Confidence", "Interview Prep"],
  difficulty: "easy",
},{
  id: "LayoverMaximizer",
  title: "Layover Maximizer",
  category: "Life",
  icon: "✈️",
  description: "Make the most of every layover — 9 tools for every stage of your connection. Get a YES/NO/RISKY verdict with exact time math. Step-by-step gate-to-gate directions. Live delay recalculation. Side-by-side layover comparison for booking decisions. Lounge finder matched to your cards. Context-aware packing lists. Offline-ready survival kits. Risk analysis with worst-case scenarios. Save your frequent airports.",
  tagline: "Turn dead time into the best part of your trip",

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
},  {
    id: "TheFinalWord",
    title: "The Final Word",
    category: "Daily Life",
    icon: "⚖️",
    description: "The argument-settling, fact-checking, trivia-hosting authority. Four modes in one tool: Quick Answer delivers bold, confident responses to any factual question with confidence ratings. Settle It acts as an impartial referee when two people disagree — enter both sides, get a verdict with accuracy scores, a breakdown of who got what right, and a settlement suggestion. Fact Check gives clear TRUE/FALSE/MISLEADING rulings on any claim with explanations and myth origins. Trivia Night generates quick-fire multiple-choice rounds with team scoring, streak tracking, difficulty settings, and 10 categories — plus an 'Actually...' challenge button if you think the answer is wrong. Voice input supported on all modes.",
    tagline: "Arguments settled. Facts checked. No appeals.",

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
    id: "NameAudit",
    title: "NameAudit",
    category: "Creative",
    icon: "🔍",
    description: "The deepest name analysis you can get without hiring a naming agency. Stress-tests any name across 12 dimensions: phonetics, memorability (including the drunk test), global language scan for unintended meanings, visual analysis, radio test, SEO, competitive landscape, longevity, and emotional resonance. Includes live domain and social handle availability checks. Also has a head-to-head Compare mode for choosing between finalists.",
    tagline: "Stress-test any name before you commit",

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
    id: "NameStorm",
    title: "NameStorm",
    category: "Creative",
    icon: "⚡",
    description: "AI-powered name generation with linguistic problem flagging, live domain and social handle availability checks, and 'More Like This' variations. Generates names across 15 style categories — from Clever Wordplay to Mythic to Mashup — each with pronunciation guides, Name DNA explaining why it works, and flags for unintended meanings in other languages, phonetic issues, and brand conflicts.",
    tagline: "Name anything. Know it works before you commit.",

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
    id: "GratitudeDebtClearer",
    title: "Gratitude Debt Clearer",
    category: "Communication",
    icon: "💝",
    description: "Turn your feelings of gratitude into heartfelt, authentic thank-you messages — without the writing paralysis. Perfect for when you genuinely appreciate someone but freeze when trying to express it formally.",
     tagline: "Helps you convert bullet points into polished thank yous.",

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
      ]
    }
  },
  {
    id: "DifficultTalkCoach",
    title: "Difficult Talk Coach",
    category: "Communication",
    icon: "🗣️",
    description: "Practice scripts and strategies for challenging conversations. Get multiple strategic approaches with specific phrases, predicted responses, and counter-scripts. Includes emotional grounding techniques and preparation steps. Built for anyone who finds difficult conversations anxiety-inducing.",
    tagline: "Practice hard conversations before they happen",

    guide: {
      overview: "The Difficult Talk Coach helps you prepare for hard conversations by generating multiple strategic approaches with exact scripts, predicted pushback, and counter-responses. Whether you need to set a boundary, request a change, address conflict, or give feedback, you'll get concrete phrases to use, body language tips, and emotional regulation strategies. Perfect for preparing conversations with partners, family, friends, bosses, coworkers, or employees.",
      howToUse: [
        "Describe the conversation you need to have - the more specific you are, the better your strategy",
        "Select who it's with, your goals (set boundary, say no, address disrespect, push back, request change, give feedback, etc.), their expected resistance level, and your communication style",
        "Check any fears you have about the conversation (they'll get angry, guilt-trip you, cry, deny everything, etc.) and add custom fears in the text field",
        "For a much stronger strategy: fill in their likely perspective and any previous attempts",
        "Review the Situation Reading to understand their mindset and likely defense mechanisms",
        "Study the Emotional Landmines - these are the moments that will derail you if you're not ready",
        "Choose a conversation approach, practice the opening out loud, and review the anticipated responses",
        "Switch to the Practice tab to run the conversation live â€” the AI responds in character with real-time coaching",
        "After the real conversation, use the Debrief tab to process what happened and identify growth areas"
      ],
      example: {
        scenario: "You need to tell your boss that a coworker is taking credit for your work. You're afraid your boss will think you're being petty or a 'bad team player,' and the coworker has more seniority.",
        action: "Describe the situation, select Boss, set resistance to 60%, goals: 'Give feedback' and 'Request a change.' In the optional fields: biggest fear = 'They'll tell me to just let it go,' their perspective = 'My boss values team harmony and may not want to pick sides,' previous attempts = 'Hinted once but my boss changed the subject.'",
        result: "You get: a Situation Reading noting your boss likely prioritizes team stability over individual credit disputes. 4 emotional landmines including 'That's just how collaboration works' with strategic responses. 3 approaches from documentation-based (come with specific examples) to direct (name the pattern). Each includes 6-8 anticipated responses with emotional triggers flagged. Then you practice the conversation live — the AI-as-boss pushes back realistically while a coach helps you refine your delivery in real time."
      },
      tips: [
        "Practice the opening line out loud 3-5 times before the actual conversation - hearing yourself say it reduces anxiety and helps you sound more natural",
        "Choose the approach that feels most authentic to you, not the one you think you 'should' use - forced approaches come across as inauthentic",
        "Use the grounding technique (deep breath: in for 4, hold for 4, out for 6) right before starting the conversation to activate your calm nervous system",
        "Remember the exit strategy if you get overwhelmed - it's okay to pause and say 'I need a moment to collect my thoughts, can we continue in 5 minutes?'"
      ],
      tips: [
        "The 'biggest fear' field is the most important optional input — it directly shapes the emotional landmine analysis, which is the most valuable part of the strategy",
        "Practice mode calibrates to your resistance slider — start at 40% to build confidence, then crank it to 70-80% for stress testing",
        "The opening line is the hardest part — practice saying it out loud 3-5 times before the real conversation",
        "If you get overwhelmed in practice mode, that's useful information — it tells you which moments need more preparation",
        "The debrief is more useful if you do it within 24 hours while the conversation is still fresh"
    ]
  }
},
{
  id: "ComplaintEscalationWriter",
  title: "Complaint Escalation Writer",
  category: "Consumer Rights",
  icon: "📧",
  description: "Builds a complete multi-stage escalation campaign when a company won't make things right. Identifies your legal leverage, writes ready-to-send letters for every stage — from direct complaint to regulatory filing to executive escalation to public pressure to chargeback — with specific laws cited, evidence coaching, and a tactical timeline. Not just a letter writer — a full consumer advocacy strategy.",
  tagline: "Full escalation campaigns that companies can't ignore",
  
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
  id: "PlainTalk",
  title: 'PlainTalk — Document Analyst',
  category: 'Life & Lifestyle',
  icon: '🔍',
  description: "Most complex text isn't trying to confuse you — it was written for an audience that already shares a context you don't have. Paste anything and PlainTalk bridges the gap: plain-English translation plus a structural X-ray showing how the text is built — its argument, narrative, logic, or obligations — adapted automatically to what you're reading.",
  tagline: 'See through any text — plain language plus structural X-ray',

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
    id: "FocusSoundArchitect",
    title: "Focus Sound Architect",
    category: "productivity",
    icon: " 🎧",
    description: "Generate personalized soundscapes for concentration based on your task, environment, and sensory needs. Creates custom mixes of white/pink/brown noise, nature sounds, binaural beats, and ambient music. Get sound layering recipes with individual volume controls and specific personalized tips.",
  tagline: "Create personalized soundscapes to enhance your concentration.",
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
    id: "FocusPocus",
    title: "Focus Pocus",
    category: "Health",
    icon: "🎩",
    description: "A focus session timer that keeps you on task, then pulls you out when time's up — with escalating urgency if you ignore it.",
    tagline: "Lock in. Get pulled out. Take care of yourself.",
    route: "focus-pocus",
    component: "FocusPocus",

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
{
  id: "DecisionCoach",
  title: "Decision Coach",
  category: "Focus & Productivity",
  icon: "🎯",
  description: "Makes the decision for you when you're too stuck to choose. Applies your constraints and preferences to give you ONE answer with execution steps. No options, no second-guessing.",
  tagline: "One answer. No second-guessing.",
  
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
},{
  id: "SixDegreesOfMe",
  title: "Six Degrees of Me",
  category: "Diversions",
  icon: "🔗",
  description: "Find the hidden connections between any two seemingly unrelated parts of your life. Your college major and your career, your childhood hobby and your friend group, your biggest fear and your favorite food. The chain is always there -- you just can't see it yet.",
  tagline: "The hidden chain between any two parts of your life",

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
  id: "BrainRoulette",
  title: 'Brain Roulette',
  category: 'Diversions',
  icon: '🎲',
  description: 'Spin for fascinating rabbit holes tuned to YOUR interests. AI finds the surprising intersections between topics you love — the kind of stuff you can\'t stop thinking about.',
  tagline: 'Personalized rabbit holes you can\'t resist',

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
      "Time blindness warning: this tool is deliberately addictive — set a timer if you need to!"
    ]
  }
},
    {
    id: "FinalWish",
    title: "Final Wish",
	category: "Daily Life",
    icon: "📜",
    description: "AI-guided digital legacy planner that helps you organize accounts, documents, finances, and personal messages into a single printable document for your trusted person.",
    tagline: "Organize what matters. Say what needs to be said.",
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
    }},
    {
    id: "BikeMedic",
    title: "Bike Medic",
	category: ["Daily Life", "Academic"],
    icon: "🚲",
    description: "AI-enhanced bicycle troubleshooting with interactive step-by-step fixes, animated visual demos, and expert follow-up when standard repairs don't work.",
    tagline: "A trailside mechanic in your pocket",
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
    }},
{
  id: "WardrobeChaosHelper",
  title: 'Wardrobe Chaos Helper',
  category: "Daily Life",
  icon: '👗👔',
  description: 'Stop decision fatigue! AI picks complete outfits from your wardrobe based on weather, activities, mood, and sensory needs. Perfect for anyone overwhelmed by daily choices.',
  tagline: "AI picks your outfit so you don't have to",
  
  guide: {
    overview: "Decision fatigue is real, especially when it comes to picking outfits. This tool learns your wardrobe and suggests complete outfit combinations based on your day's needs. It considers weather, activities, your mood, comfort preferences, and sensory requirements. Particularly helpful for people who struggle with executive function or sensory sensitivities.",
    
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
// PlantRescue-metadata.js
{
  id: "PlantRescue",
  title: 'Plant Rescue',
  category: "Daily Life",
  icon: '🪴',
  tagline: 'Diagnose and rescue your struggling plants',
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
  }},
// ConflictCoach-metadata.js
{
  id: "ConflictCoach",
  title: "Conflict Coach",
  description: "Received a tense message? Don't respond reactively. Get de-escalating response suggestions, emotional analysis, and thoughtful strategies. Prevents regrettable texts.",
  tagline: "Stop, breathe, and craft the right response",
  category: "Communication",
  icon: "📱",
  gradient: "from-yellow-500 to-orange-600",
  featured: true,
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
  },
  
  keywords: [
    "conflict resolution",
    "tense messages",
    "de-escalation",
    "reactive texting",
    "emotional regulation",
    "conflict communication",
    "relationship conflict",
    "text fights",
    "argument response",
    "boundary setting",
    "conflict coach"
  ],
  
  tags: ["Communication", "Conflict Resolution", "Emotional Regulation", "Relationships"],
  
  difficulty: "medium",
  
  useCases: [
    "Partner sent angry text about recurring issue",
    "Family member being passive-aggressive",
    "Friend upset about something you did",
    "Coworker sent confrontational email",
    "Ex trying to re-engage in old patterns",
    "Customer sending aggressive complaint",
    "Need to set boundary without escalating",
    "Want to validate feelings without conceding point",
    "Need to disengage from toxic conversation",
    "Feeling defensive and want to avoid reactive response"
  ],
  
  benefits: [
    "Prevents reactive texting you'll regret later",
    "Analyzes emotional temperature of messages",
    "Identifies specific triggers in their message",
    "Generates 3-5 different response strategies",
    "Shows pros AND cons of each approach",
    "Provides 'what NOT to say' warnings",
    "Includes reflection questions before sending",
    "Recommends cooling-off time periods",
    "Analyzes your reactive draft (if you share it)",
    "Gives exit strategies if they escalate",
    "Provides repair strategies for later",
    "Supports emotional regulation",
    "Relationship-specific guidance",
    "Built for conflict-anxious and neurodivergent users"
  ],
  
  emotionalSupport: [
    "Validates your feelings while guiding regulation",
    "Acknowledges defensive feelings are normal",
    "Provides pause prompts before reactive sending",
    "Helps distinguish hurt from situation vs person",
    "Supports freezing during conflict (gives scripts)",
    "Helps immediate escalators slow down",
    "Assists anxious texters with structure",
    "Helps neurodivergent users read tone",
    "No judgment about emotional reactions",
    "Focuses on responding vs reacting"
  ],
  
  responseStrategies: [
    "Validate without conceding - acknowledge emotion, don't accept blame",
    "Set boundary firmly - draw line, stay calm",
    "Disengage gracefully - exit without ghosting",
    "Schedule face-to-face - acknowledge text limitations",
    "Resolve-focused - constructive problem-solving",
    "Gray rock - minimal engagement for toxic situations",
    "Clarifying questions - when confused by tone",
    "Defer and reflect - buy time to process"
  ],
  
  limitations: [
    "Not a replacement for therapy or professional mediation",
    "Can't guarantee how other person will respond",
    "Works best when you're willing to de-escalate",
    "May not apply to abusive situations (seek professional help)",
    "Suggested responses need your authentic voice",
    "Can't resolve underlying relationship issues",
    "Some conflicts require in-person conversation",
    "Tool provides options, you make final decision"
  ],
  
  safetyNote: "If you're in an abusive relationship or situation, please reach out to professional resources. This tool is for managing everyday conflicts, not navigating abuse. National Domestic Violence Hotline: 1-800-799-7233."
},
// TaskAvalancheBreaker-metadata.js
{
  id: "TaskAvalancheBreaker",
  title: "Task Avalanche Breaker",
  description: "Turn overwhelming projects into 5-minute micro-tasks. Built for that 'too big to start' paralysis. No decisions required.",
  tagline: "Turn that overwhelming mountain into micro-steps",
  category: "Productivity",
  icon: "⛏️",
  gradient: "from-green-500 to-teal-600",
  featured: true,
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
  },
  
  keywords: [
    "task breakdown",
    "micro-tasks",
    "overwhelm",
    "procrastination",
    "executive function",
    "task paralysis",
    "productivity",
    "motivation",
    "getting started",
    "project management"
  ],
  
  tags: ["Productivity", "Task Management", "Executive Function"],
  
  difficulty: "easy",
  
  useCases: [
    "Cleaning overwhelming spaces (garage, closet, room)",
    "Starting big writing projects (thesis, report, article)",
    "Organizing finances or paperwork",
    "Planning events (wedding, party, trip)",
    "Job search and applications",
    "Home maintenance projects",
    "Moving or packing",
    "Decluttering and organizing",
    "Starting homework or studying",
    "Any project that feels 'too big to start'"
  ],
  
  benefits: [
    "Breaks 'too big to start' paralysis instantly",
    "Removes ALL decision-making from individual tasks",
    "Ultra-specific tasks - no thinking required, just doing",
    "Builds momentum with easy wins first",
    "Energy-aware task ordering (low energy = easier tasks first)",
    "Clear completion criteria - you know when you're done",
    "Dependency mapping shows logical task order",
    "Permission to stop at any time without guilt",
    "Celebration checkpoints for motivation",
    "Actual countdown timer for each task",
    "'This Is Too Hard' button for further breakdown",
    "Progress tracking shows visual accomplishment",
    "Anti-shame, supportive language throughout",
  ],
  
  executiveFunctionSupport: [
    "No decisions within tasks (removes decision paralysis)",
    "First 5 tasks absurdly simple (momentum building)",
    "Clear start and end points (completion criteria)",
    "Dependency mapping (removes 'what's next?' anxiety)",
    "Energy-aware sequencing (matches tasks to energy level)",
    "Permission to stop at any time (removes 'must finish' pressure)",
    "Celebration checkpoints (positive reinforcement)",
    "Specific 'if stuck' guidance (reduces frustration)",
    "'This Is Too Hard' button (acknowledges limits)",
    "Progress visualization (external motivation)",
    "Timer feature (makes tasks feel finite)",
    "Anti-paralysis strategies (addresses specific overwhelm types)"
  ],
  
  limitations: [
    "Can't do the tasks for you - still need to take action",
    "May generate too many tasks for some projects (that's okay - do what you can)",
    "Task estimates might vary based on individual speed",
    "Can't account for unexpected complications in specific tasks",
    "Requires honest assessment of energy level for best results",
    "Works best when you do tasks in suggested order",
    "Tool is supportive but not a replacement for professional help with severe executive dysfunction"
  ],
  
  exampleProjects: [
    "Clean garage → 25 micro-tasks, starting with 'stand in doorway'",
    "Write thesis → 30 tasks, starting with 'open document'",
    "Plan wedding → 40 tasks, starting with 'create folder'",
    "Organize finances → 20 tasks, starting with 'get one bill'",
    "Declutter bedroom → 15 tasks, starting with 'get trash bag'",
    "Job application → 12 tasks, starting with 'create resume folder'",
    "Pack for move → 35 tasks, starting with 'get one box'",
    "Study for exam → 18 tasks, starting with 'open textbook'"
  ]
},
// PetWeirdnessDecoder-metadata.js
{
  id: "PetWeirdnessDecoder",
  title: "Pet Weirdness Decoder",
  description: "Is your pet's weird behavior quirky or concerning? Get AI analysis to distinguish between adorable quirks and symptoms that need a vet visit.",
  tagline: "Is it quirky or concerning? Let's find out",
  category: "Daily Life",
  icon: "🐾",
  gradient: "from-yellow-500 to-amber-600",
  featured: true,
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
  },
  keywords: [
    "pet behavior",
    "dog behavior",
    "cat behavior",
    "weird pet behavior",
    "pet health",
    "when to call vet",
    "pet anxiety",
    "quirky pet",
    "pet parent anxiety",
    "veterinary advice",
    "pet symptoms",
    "animal behavior"
  ],
  
  tags: ["Pets", "Health", "Behavior Analysis", "Veterinary"],
  
  difficulty: "easy",
  
  useCases: [
    "Dog spinning before bed - normal or neurological?",
    "Cat chattering at birds - should I worry?",
    "Bunny doing weird jumps (binkies) - is this okay?",
    "Bird plucking feathers - stress or medical?",
    "Puppy zoomies at 3am - is this a phase?",
    "Senior dog head pressing - emergency check",
    "Cat excessive grooming creating bald spots",
    "Dog tilting head constantly - cute or concerning?",
    "New kitten behaviors - learning what's normal",
    "Anxious pet parent needing reassurance"
  ],
  
  benefits: [
    "Reduces pet parent anxiety about normal quirky behaviors",
    "Helps distinguish quirks from medical concerns",
    "Provides clear urgency levels (😂🤔⚠️🚨)",
    "Considers breed-specific and age-related behaviors",
    "Gives specific red flags to watch for",
    "Generates questions to ask your vet",
    "Suggests what to monitor and how to document",
    "Offers enrichment ideas for normal behaviors",
    "Provides realistic timelines for behavioral changes",
    "Warm, understanding tone for worried pet parents",
    "Clear guidance on when to call vet vs when to relax",
    "Celebrates adorable quirks instead of pathologizing them"
  ],
  
  limitations: [
    "NOT a replacement for veterinary medical advice",
    "Cannot physically examine your pet",
    "Cannot diagnose medical conditions",
    "Cannot prescribe treatment",
    "Works best with detailed behavior descriptions",
    "Breed info helps but not required",
    "Cannot account for every rare condition",
    "Emergency situations require immediate vet call, not this tool",
    "Tool is educational/informational only",
    "Always trust your vet over any online tool"
  ],
  
  urgencyLevels: {
    "not_urgent": {
      "emoji": "😂",
      "label": "Quirky & Normal",
      "meaning": "Totally normal behavior, enjoy the quirk!",
      "action": "Celebrate it, maybe video it, definitely appreciate your weird pet"
    },
    "monitor": {
      "emoji": "🤔",
      "label": "Worth Monitoring",
      "meaning": "Keep an eye on it, not immediately concerning",
      "action": "Watch for changes, track patterns, call vet if escalates"
    },
    "vet_soon": {
      "emoji": "⚠️",
      "label": "Vet Consultation Recommended",
      "meaning": "Should schedule vet appointment within days",
      "action": "Call vet, schedule appointment, monitor in the meantime"
    },
    "vet_now": {
      "emoji": "🚨",
      "label": "Call Vet Now",
      "meaning": "Potential emergency or urgent medical concern",
      "action": "Call your vet immediately or go to emergency animal hospital"
    }
  },
  
  importantDisclaimer: "This tool is for educational purposes only and does NOT replace professional veterinary care. Always consult your veterinarian for medical advice, diagnosis, or treatment. In emergencies (difficulty breathing, seizures, collapse, severe bleeding, toxin ingestion), call your vet or emergency animal hospital immediately. You are a good pet parent for paying attention to your pet's behavior - when in doubt, call your vet!"
},
// FakeReviewDetective-metadata.js
{
  id: "FakeReviewDetective",
  title: "Fake Review Detective",
  description: "Import reviews from a URL or paste them manually. Computes real statistics, then AI scores each review individually and detects manipulation patterns.",
  tagline: "Spot fake reviews before you get burned",
  category: "Daily Life",
  icon: "🔍",
  gradient: "from-blue-500 to-cyan-600",
  featured: true,
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
  },
  
  keywords: [
    "fake reviews", "review detection", "amazon reviews", "product reviews",
    "review analysis", "fake review detector", "shopping helper", "url",
    "review trust", "product research", "review patterns",
    "verified purchase", "shopping anxiety", "import reviews"
  ],
  
  tags: ["Shopping", "AI Detection", "Consumer Protection", "Reviews"],
  difficulty: "easy",
},
// CrashPredictor.js
  {
    id: "CrashPredictor",
    title: "Crash Predictor",
    category: "Daily Life",
    icon: "⚠️",
    description: "Track daily energy, sleep, and stress to identify YOUR personal burnout patterns before you crash. For people who push through warning signs, mask symptoms, or have poor interoception (can't sense body signals). The tool uses objective data to warn you when a crash is coming - because your feelings might say 'I'm fine' even when the pattern shows you're not. Get specific, actionable interventions prioritized by urgency. Built especially for people who can't trust their own assessment.",
    tagline: "Spot your burnout patterns before the crash",

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
// DreamPatternSpotter-metadata.js
   {
    id: "DreamPatternSpotter",
    title: "Dream Pattern Spotter",
    category: "Daily Life",
    icon: "🌙",
    description: "Analyze your dreams for recurring themes, symbols, and emotional patterns. Uses psychological frameworks (Jungian, Freudian, neuroscience) to help you understand what your subconscious might be processing. Two modes: analyze a single dream in depth, or find patterns across multiple dreams. Get reflection questions for journaling or therapy. This is pattern recognition for self-exploration, not fortune-telling.",
    tagline: "Find the recurring themes hidden in your dreams",

    guide: {
      overview: "The Dream Pattern Spotter uses depth psychology to analyze dreams for recurring themes, symbols, emotional patterns, and correlations with life events. It provides insights from Jungian (archetypes, shadow), Freudian (wish fulfillment, repression), and modern neuroscience (memory consolidation, threat simulation) perspectives. The tool promotes self-reflection and therapeutic exploration, not mystical interpretation or fortune-telling.",
      howToUse: [
        "Choose your mode: Single Dream (analyze one dream in depth) or Pattern Analysis (find patterns across 2+ dreams)",
        "For single dream: Describe your dream in detail, select the date, check emotional tones you felt, optionally add what was happening in your life",
        "For pattern analysis: Add 2+ dreams with descriptions and dates. The more dreams, the better pattern recognition",
        "Generate analysis to see recurring themes, symbols, emotional patterns, people/figures that appear, life event correlations, and subconscious preoccupations",
        "Use the reflection questions for journaling or therapy to explore what patterns might mean for YOUR life"
      ],
      example: {
        scenario: "You've been having recurring dreams about being chased. You enter 3 dreams from the past month where you're being pursued, each with context about work stress.",
        action: "Pattern Analysis mode: Add 3 dreams describing being chased in different scenarios (by unknown person, by animal, through building). Note emotions: anxious, scared. Add context: 'Started high-pressure project at work'",
        result: "Analysis shows: Recurring theme 'Pursuit/Escape' (3x) suggesting avoidance of something in waking life. Emotional pattern: High anxiety correlating with work project start date. Symbol: Pursuer represents 'pressure/expectations'. Subconscious preoccupation: Fear of failure/not meeting expectations. Reflection questions: 'What in your work life feels like being chased? What are you avoiding confronting? How do you typically respond to pressure?' Insight: Dreams may be processing work anxiety through symbolic pursuit scenarios - common stress dream pattern. Suggests exploring stress management and examining expectations (yours vs others')."
      },
      tips: [
        "Write dreams down immediately upon waking - details fade quickly",
        "Include ALL details: colors, emotions, people, symbols, actions, even if they seem silly",
        "For pattern analysis, enter at least 3-5 dreams for meaningful patterns",
        "Add life context - dreams often process daily experiences symbolically",
        "Use reflection questions in your journal or with a therapist",
        "Remember: interpretations are suggestions for self-reflection, not definitive truths. YOU decide what resonates.",
        "Recurring dreams often indicate unresolved issues - they'll stop once the issue is addressed"
      ]
    }
  },
// MeetingHijackPreventer-metadata.js
   {
    id: "MeetingHijackPreventer",
    title: "Meeting Hijack Preventer",
    category: "Productivity",
    icon: "🛡️",
    description: "Create structured, inclusive meeting agendas with time-boxed items, facilitator scripts, and anti-hijack strategies. Prevents dominant personalities from derailing discussions and ensures all voices are heard. Built with neurodivergent users in mind.",
    tagline: "Keep meetings structured, inclusive, and on track",

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
  // DoctorVisitTranslator-metadata.js
   {
    id: "DoctorVisitTranslator",
    title: "Doctor Visit Translator",
    category: "Health",
    icon: "🩺",
    description: "Translate medical jargon from doctor visits into plain English. Get action checklists, medication explanations, test result interpretations, and questions to ask next time. Perfect for when you're too stressed to process everything during the appointment. Includes medical disclaimer and focuses on health literacy.",
    tagline: "Turn medical jargon into plain English",

    guide: {
      overview: "The Doctor Visit Translator helps you understand your doctor visits by translating medical terminology into clear, actionable language. Paste your visit notes or describe what the doctor said, and get a plain English summary, medical term definitions, action checklist with priorities, medication explanations with side effects, test result interpretations, follow-up requirements, and questions to ask next time. Built for patients who struggle to process medical information during stressful appointments.",
      howToUse: [
        "Paste your visit summary/notes OR write what you remember the doctor saying - include medications, test results, diagnosis, and instructions",
        "Select your visit type (Diagnosis, Follow-up, Treatment plan, Test results, Preventive care, Urgent care, or Specialist consultation)",
        "Optionally add your main concerns - what you're worried or confused about",
        "Click 'Translate to Plain English' to get a comprehensive breakdown with plain language summary, medical terms explained, prioritized action checklist, medication details, test results interpretation, follow-up requirements, and questions for your next visit"
      ],
      example: {
        scenario: "You just left a doctor appointment where they said you have 'hypertension' and prescribed 'lisinopril 10mg.' Your blood pressure was 145/92. You're confused about what this means and worried about taking medication.",
        action: "Paste: 'Doctor said I have hypertension. BP was 145/92. Prescribed lisinopril 10mg once daily. Need to reduce sodium and exercise. Come back in 3 months.' Add concern: 'Worried about medication side effects and if I'll be on it forever.' Select 'Diagnosis' visit type.",
        result: "You receive: Plain English summary explaining high blood pressure in simple terms, definition of 'hypertension' and what 145/92 means, action checklist (HIGH: Start medication, MEDIUM: Reduce sodium to under 2300mg/day, MEDIUM: Exercise 30min 5x/week, LOW: Schedule 3-month follow-up), lisinopril explanation (lowers blood pressure by relaxing blood vessels, take in morning, watch for dizziness/dry cough), follow-up requirements (check BP at home weekly, call if systolic >180), and questions to ask (Will I need this forever? Can lifestyle changes alone work? What if I get side effects?)."
      },
      tips: [
        "Bring a copy of this translation to your next appointment - your doctor will appreciate that you're engaged and informed",
        "Use the 'Questions for Next Visit' section to prepare before your appointment - write them down and bring the list",
        "If test results show abnormal values, the tool explains what that means AND what typically happens next, reducing anxiety about the unknown",
        "The action checklist has priority levels (high/medium/low) so you know what's urgent vs what can wait - don't overwhelm yourself trying to do everything at once"
      ]
    }
  },
  // EmailUrgencyTriager-metadata.js
{
  id: "EmailUrgencyTriager",
  title: "Email Urgency Triager",
  description: "Analyze email urgency and cut through inbox anxiety. Find out what actually needs a response today vs what can wait.",
  tagline: "Find out what actually needs a reply today",
  category: "Productivity",
  icon: "📬",
  gradient: "from-emerald-500 to-teal-600",
  featured: true,
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
  },
  
  keywords: [
    "email",
    "inbox",
    "urgency",
    "priority",
    "triage",
    "anxiety",
    "overwhelm",
    "response",
    "deadline",
    "productivity",
    "time management",
    "email management",
    "inbox zero",
    "prioritization"
  ],
  
  tags: ["Productivity", "Email", "Time Management", "Anxiety Relief"],
  
  difficulty: "easy",
  
  useCases: [
    "Feeling overwhelmed by inbox volume",
    "Unsure which emails need immediate responses",
    "Anxiety about unanswered emails",
    "Wanting to achieve inbox zero systematically",
    "Batch processing emails at end of day",
    "Separating real urgency from artificial urgency",
    "Managing email as a manager (vs employee)",
    "Freelancer juggling multiple client emails",
    "Student managing professor vs club emails",
    "Getting permission to ignore low-priority emails"
  ],
  
  benefits: [
    "Reduces email anxiety by showing what can actually wait",
    "Prevents important messages from getting buried",
    "Gives you permission to ignore non-urgent emails",
    "Provides specific response timelines",
    "Includes quick response templates for urgent items",
    "Separates real urgency from perceived urgency",
    "Batch processing tips for efficiency",
    "Role-aware analysis (what's urgent depends on your role)",
    "Shows consequences of waiting on urgent items",
    "Reassuring 'Permission to Breathe' messages"
  ],
  
  limitations: [
    "Can't access your calendar or other context you have",
    "Works best with emails in English",
    "Requires you to paste email content (privacy consideration)",
    "May not understand very domain-specific jargon",
    "Your judgment should override if you have additional context"
  ]
},     
// LeaseTrapDetector-metadata.js
{
  id: "LeaseTrapDetector",
  title: "Lease Trap Detector",
  category: "Daily Life",
  icon: "🏡",
  description: "Analyze rental agreements and identify predatory clauses, illegal provisions, unusual fees, and missing tenant protections. Upload your lease (PDF or text), get color-coded red/yellow/green flags with plain language explanations, negotiation scripts, and comparison to local housing laws. Flags concerning clauses, explains your rights, provides negotiation strategies, and connects you to tenant resources. Built for first-time renters and tenant protection.",
  tagline: "Find predatory clauses hiding in your lease",

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
// FriendshipFadeAlerter-metadata.js
{
  id: "FriendshipFadeAlerter",
  title: "Friendship Fade Alerter",
  category: "Daily Life",
  icon: "💔",
  description: "Never lose touch with people you care about due to time-blindness. Track important relationships, get alerts when it's been too long, and generate personalized conversation starters. Visual color-coded urgency (red/yellow/green), configurable contact frequencies, snooze for busy periods, and guilt-free reconnection scripts. Built specifically for people who care deeply but struggle with time awareness and executive function. Maintain connections without shame.",
  tagline: "Never lose touch with people you care about",

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
      "Don't ignore yellow warnings thinking 'I still have time' - time-blindness means yellow becomes red fast. Act when it turns yellow.",
      "Context notes aren't optional if you want good conversation starters - 'close friend' generates generic, 'close friend, loves rock climbing, planning Yosemite trip' generates specific.",
      "Don't apologize in your messages for the time gap (tool explicitly tells you not to) - most people don't notice gaps like you do, leading with apology makes it awkward.",
      "Mark as contacted immediately after sending - if you wait to update 'until they respond', you'll forget and the data becomes inaccurate.",
      "Don't use snooze as avoidance - snooze is for 'I'm genuinely too busy right now', not 'I don't want to deal with this person'. If you keep snoozing someone, maybe reassess the relationship."
    ]
  }
},

// SensoryMinefieldMapper-ENHANCED-metadata.js
{
  id: "SensoryMinefieldMapper",
  title: "Sensory Minefield Mapper",
  category: "Health",
  icon: "🎯",
  description: "Comprehensive sensory environment prediction with saved profiles, accessibility integration, visual mapping, community ratings, and post-visit learning. Predict crowd density, noise, lighting, and sensory overwhelm before you go. Get wheelchair access info, service animal policies, accessible bathroom locations, visual escape route maps, real-time check-ins during visit, and track prediction accuracy over time. Built for autistic individuals, sensory processing disorder, migraine sufferers, PTSD, and anxiety. Know before you go, adapt during, learn after.",
  tagline: "Predict and avoid overwhelming sensory environments",

  guide: {
    overview: "Enhanced Sensory Minefield Mapper predicts sensory environments with comprehensive features: saved sensory profiles (set once, use always), accessibility integration (wheelchair access, service animals, accessible bathrooms), visual mapping (see quiet zones and escape routes), real-time check-ins during visit ('How are you doing?'), community-sourced ratings from other sensory-sensitive users, and post-visit learning (predicted vs actual comparison improves future predictions). Complete sensory planning system from before-during-after.",
    
    howToUse: [
      "FIRST TIME: Create your sensory profile - select sensitivities, accessibility needs, triggers, warning signs, successful coping strategies. Save it - you'll never need to re-enter.",
      "For each visit: Enter location, date/time, place type. Your saved profile auto-applies (or edit for this specific visit).",
      "Review predictions: sensory factors, accessibility info, visual map with escape routes, optimal time, preparation strategies.",
      "DURING VISIT: Use check-in feature if needed - 'How are you doing?' with emergency protocols if worse than predicted.",
      "AFTER VISIT: Submit 'How did it go?' report - rate predicted vs actual, share with community, improve future predictions.",
      "Browse community ratings to see what other sensory-sensitive people say about locations you're considering.",
      "Track your success rate over time - see which predictions were accurate, which places work for you."
    ],
    
    example: {
      scenario: "You're autistic, use a wheelchair, and have high sensitivity to fluorescent lights and crowds. You need groceries. You've used the tool before and saved your sensory profile. Last time you visited Target at 6pm Saturday it was overwhelming and you left after 5 minutes. You want to try again but prepared this time.",
      action: "Enter 'Target on Main Street', select 'Tomorrow 2pm Tuesday', choose 'Grocery Store'. Toggle 'Use saved profile' (loads: wheelchair access needed, service animal, sensitive to lights/crowds, triggers: flickering lights, warning sign: jaw tension, coping: sunglasses work). Click Analyze.",
      result: "Prediction: MODERATE (manageable with preparation). Accessibility: Wheelchair accessible (automatic doors, wide aisles, accessible checkout, accessible bathroom near customer service). Noise: 60-70 dB (moderate). Crowds: 40% capacity (vs 85% Saturday 6pm = 53% reduction). Lights: Bright fluorescent throughout (HIGH sensitivity match - sunglasses recommended, ask for dimmer aisle if available). Visual map shows: Quietest area = garden section (back left), Escape routes = (1) Garden section, (2) Accessible bathroom (customer service), (3) Outdoor exit (east side). Optimal time: 10am Tuesday = 70% less crowded. Preparation: Bring sunglasses, noise-canceling headphones, service animal welcome, accessible parking spots available. During-visit check-ins enabled. After visit: You can submit 'How did it go?' to help improve predictions and help community."
    },
    
    tips: [
      "SAVE YOUR PROFILE on first use - you'll never need to re-enter sensitivities, accessibility needs, triggers, warning signs again",
      "Check community ratings before new locations - see what other autistic/sensory-sensitive users say",
      "Visual maps show actual escape routes - screenshot them before you go so you have them offline",
      "Use check-in feature during visit if you're struggling - it provides emergency protocols and nearby recovery locations",
      "Submit post-visit reports even for successful trips - helps improve predictions and helps community",
      "Accessibility info is integrated: wheelchair access, service animal policies, accessible bathrooms, elevator locations all in one place",
      "Your post-visit reports improve YOUR future predictions - the tool learns which factors matter most to you",
      "Community intelligence builds over time - the more users submit reports, the better predictions get for everyone",
      "Visual map includes parking-to-entrance route if you need accessible parking proximity",
      "Real-time adaptation: if it's worse than predicted, tool provides emergency exit strategies and nearby quiet recovery locations"
    ],
    
    pitfalls: [
      "Don't skip saving your profile thinking you'll remember - sensory needs are consistent, set it once and benefit always",
      "Community ratings need YOUR contribution - submit reports to help other sensory-sensitive people",
      "Visual maps require location-specific data - generic place types won't have detailed maps, but named locations will",
      "Post-visit reports are anonymous but valuable - your experience helps others, no personal info shared",
      "Accessibility info relies on business reporting - if missing, tool provides typical patterns for place type but may not be specific",
      "Check-in feature during visit requires keeping phone/tool accessible - plan for this before you go",
      "Don't ignore 'worse than predicted' protocols - if it's more overwhelming than expected, use emergency exit strategies immediately",
      "Saved profiles are device-specific (localStorage) - if you use multiple devices, you'll need to save profile on each"
    ]
  }
},
// TimeVanishingExplainer-metadata.js
{
  id: "TimeVanishingExplainer",
  title: "Time Vanishing Explainer",
  category: "Productivity",
  icon: "⏰",
  description: "Understand where time actually went vs where you thought it went. Advanced features include automatic time tracking, meeting tax calculator, deep work vs shallow work analysis, economic impact analysis, peak productivity mapping, and realistic week planner. Built specifically for people with time blindness with non-judgmental, pattern-based insights.",
  tagline: "See where your time actually went today",

  guide: {
    overview: "Time Vanishing Explainer is a comprehensive time analysis tool that goes beyond simple tracking. It analyzes your actual time usage patterns, identifies expensive time leaks (context switching costs money!), classifies work types (deep vs shallow), maps your peak productivity hours, calculates the economic cost of meetings, and generates realistic schedules based on YOUR patterns - not idealized productivity advice. Includes automatic tracking options, trend analysis, and always celebrates what you accomplished.",
    
    howToUse: [
      "Choose input method: Manual log, paste calendar, upload CSV, or enable automatic tracking (browser extension/app integration)",
      "Optional: Add your hourly rate for economic analysis (meeting cost calculator, context switching tax)",
      "Select time period and comparison mode (this week vs last week, this month vs last month, or single period analysis)",
      "Add perception if desired: 'I thought I spent X hours on Y' to see time blindness gaps",
      "Click 'Analyze Time' to get comprehensive analysis with: time leaks, work type classification, economic impact, peak productivity hours, realistic capacity, and celebration",
      "Use generated insights: Protect deep work blocks, schedule tasks during peak hours, batch admin work, add realistic buffers, decline expensive meetings",
      "Generate Ideal Week template based on your actual patterns (not aspirational planning)",
      "Track trends over time to see improvement and identify recurring patterns"
    ],
    
    example: {
      scenario: "You work remote and feel like you're always busy but never productive. You track one full week of time, including a 2-hour meeting with 8 people. Your hourly rate is $75. You want to compare this week to last week and see where time is vanishing.",
      action: "Select 'This week', choose 'Compare to last week', paste your calendar entries for both weeks, enter hourly rate '$75', add perception 'I thought I did 6 hours of deep work per day'. Click Analyze.",
      result: "Analysis shows: Total time: 40h. Deep work: 12h (30%), Shallow work: 15h (37.5%), Meetings: 8h (20%), Context switching: 5h (12.5%). Meeting tax: $1,200 for one 2h meeting ($75 × 8 people × 2h). Context switching cost: $375 lost. Peak productivity: 9-11am (protect this!). Comparison: Last week had 15h deep work vs this week 12h (-20%). Time blindness insight: 'You thought 6h deep work/day (30h/week) but actually 12h/week - you're overestimating by 2.5x'. Ideal week template generated: Block 9-11am daily for deep work (no meetings), batch email 2-3pm, meetings only Tues/Thurs afternoon, add 30min buffers. Celebration: 'You completed 15 major deliverables and handled 47 smaller tasks this week - significant accomplishment even though it took longer than expected.'"
    },
    
    tips: [
      "Enable automatic tracking for most accurate data - manual logs miss context switches and transition time",
      "Add your hourly rate to see the true economic cost of meetings and interruptions - this makes time leaks visceral",
      "Use the meeting tax calculator before accepting meeting invites - 'Is this 2-hour meeting worth $1,200 of company time?'",
      "Protect your peak productivity hours (usually 9-11am) - schedule ZERO meetings during these blocks",
      "Deep work blocks need 90+ minutes minimum - anything shorter gets eaten by context switching",
      "Use the work type classification to identify if you're spending too much time in shallow work vs deep work",
      "Compare weeks to identify trends - are you improving at time estimation? Getting better at protecting deep work?",
      "The 'Ideal Week' template is based on YOUR actual patterns, not generic advice - actually use it!",
      "Energy mapping shows when you're most effective - schedule hard tasks during peak energy, admin during low energy",
      "Track for at least 2 weeks to see meaningful patterns - one week might be atypical"
    ],
    
    pitfalls: [
      "Don't skip the hourly rate input - without it, you miss the powerful economic analysis showing what time actually costs",
      "Automatic tracking catches things manual logs miss - if available, use it instead of relying on memory",
      "Don't ignore the meeting tax calculator - seeing '$1,200' makes declining unnecessary meetings much easier",
      "The tool will tell you 'you can do 2 major tasks per day, not 5' - believe it and plan accordingly, don't keep overestimating",
      "Protected deep work time means PROTECTED - no 'just this one meeting' exceptions or the pattern breaks",
      "Comparison mode requires data from both periods - don't compare if you only tracked this week",
      "Peak productivity hours are YOUR hours, not what productivity books say - if you're a night person, your peaks will be different"
    ]
  }
},
  {
    id: "GradeGraveyard",
    title: "Grade Graveyard",
    category: "Academic",
    icon: "💀",
    description: "The community morgue for lethal courses. Search post-mortems and report academic casualties before you register.",
    tagline: "Post-mortems and warnings for lethal courses",
    
    guide: {
      overview: "GradeGraveyard is a student-curated database of the hardest courses at your school. Students share 'post-mortems' of brutal classes - what went wrong, how much time it took, and survival strategies. Think of it as your defensive intelligence before registration.",
      
      howToUse: [
        "Search for a course you're considering (e.g., 'ORGO', 'Linear Algebra')",
        "Read the 'mortality rate' (% of students who dropped or failed)",
        "Review student post-mortems explaining the challenges",
        "Check the recommended prep work and prerequisites",
        "Submit your own post-mortem after completing a difficult course"
      ],
      
      example: "Search 'Organic Chemistry' → See 34% drop rate → Read post-mortems revealing the course requires 20+ hrs/week → Decide to take it in a lighter semester instead of alongside 4 other hard classes.",
      
      tips: [
        "Don't take multiple 'graveyard courses' in the same semester",
        "Use post-mortems to find study groups and resources",
        "Submit your own experience to help future students",
        "Check if the professor changed - difficulty varies wildly"
      ]
    }
  },
  
  {
    id: "LeverageLogic",
    title: "Leverage Logic",
    category: "Productivity",
    icon: "⚖️",
    description: "Identify high-yield opportunities and calculate the force multiplication of your current resources.",
    tagline: "Find the highest-yield opportunity in front of you",
    
    guide: {
      overview: "LeverageLogic helps you identify opportunities where small inputs create disproportionate outputs. Enter your current resources (time, money, skills, connections) and it calculates which opportunities will give you the highest return on investment.",
      
      howToUse: [
        "Input your available resources (hours/week, budget, skills, network)",
        "Add opportunities you're considering (internship, side project, club leadership, etc.)",
        "Review the calculated leverage score for each opportunity",
        "See the projected ROI in terms of career advancement, skills gained, or income",
        "Sort by highest leverage to prioritize your time"
      ],
      
      example: "You have 10 hrs/week free. Options: (1) Part-time job: $15/hr = $150/week. (2) Unpaid internship at startup. (3) Build portfolio project. LeverageLogic shows internship has 8x leverage (leads to $80k job offers), portfolio has 5x leverage, job has 1x leverage. You choose the internship.",
      
      tips: [
        "Leverage compounds - skills and connections multiply over time",
        "Short-term cash sometimes has lower leverage than long-term opportunity",
        "Update your resources quarterly as your skills increase",
        "Don't just chase the highest leverage - consider your goals too"
      ]
    }
  },
    {
    id: "LiquidCourage",
    title: "Liquid Courage",
    category: "Communication",
    icon: "🍸",
    description: "The ultimate safety-first hydration and pacing logic. Real-world math for a better, safer night out.",
    tagline: "Safety-first hydration and pacing math",
    
    guide: {
      overview: "LiquidCourage calculates safe drinking pacing based on your weight, gender, time span, and food intake. It tells you exactly when to drink water, when to stop drinking alcohol, and tracks your estimated BAC to keep you safe and functional.",
      
      howToUse: [
        "Input your weight, gender, and whether you've eaten",
        "Set your event duration (e.g., 4 hours)",
        "Enter each drink as you consume it",
        "Follow the hydration schedule (drink water when app alerts)",
        "Stop drinking when the app shows you're approaching your limit"
      ],
      
      example: "150lb person, 8pm-12am party. App says: Max 4 drinks over 4 hours. Drink 1 glass of water between each drink. Stop drinking by 11pm to sober up by midnight. You follow it, have a great time, feel fine the next day.",
      
      tips: [
        "Always eat before drinking - the app accounts for this",
        "Set a 'must stop by' time if you're driving later",
        "Water between drinks isn't optional - it prevents hangovers",
        "Stronger drinks (shots) = count as 1.5x in the app",
        "If you feel bad, stop immediately regardless of what the app says"
      ],
      
      pitfalls: [
        "Don't lie to the app about your drinks - it's for YOUR safety",
        "Don't ignore the water alerts - dehydration makes everything worse",
        "App is a guide, not a guarantee - everyone metabolizes differently"
      ]
    }
  },
{
  id: "MoneyShameRemover",
  title: "Money Shame Remover",
  category: "Money",
  icon: "💰",
  description: "Reframes money situations without judgment. Separates systemic issues from personal responsibility. Validates financial struggles, provides practical solutions, teaches how to decline invites/ask for help without shame. 'This is economic structure, not personal failure.'",
  tagline: "Reframe your money situation without judgment",
  
  guide: {
    overview: "Financial shame prevents people from taking action and damages mental health. This tool reframes money struggles by separating systemic factors (wages, medical debt, student loans) from personal responsibility, provides shame-free solutions, and gives scripts for social situations.",
    
    howToUse: [
      "Describe your money shame",
      "Add context if relevant",
      "Get systemic vs personal factor analysis",
      "Receive shame removal reframe",
      "Access practical solutions with resources",
      "Learn scripts for social situations (declining invites, asking for help)"
    ],
    
    example: {
      scenario: "You feel ashamed that you can't afford to go to your friends' wedding destination weekend. They're all going and you have to decline because you can't afford $800 for travel/hotel/events. You feel like a bad friend and financial failure.",
      action: "Money shame: 'Can't afford friends' wedding destination weekend, feel like bad friend'.",
      result: "Shame removal: The truth: Destination weddings cost $500-1500+ per guest. That's a significant expense most people struggle with but don't talk about. This isn't about being a bad friend - it's about having different financial priorities/capacity. Why not failure: You're making responsible financial choices. Going into debt for a party isn't friendship - it's financial self-harm. Others feel same pressure but hide it. Systemic factors: Wage stagnation (median wage growth hasn't matched cost of living), Destination wedding trend (puts financial burden on guests), Social media pressure (makes this feel like personal failing when it's widespread). Personal factors: Your current budget priorities (rent, food, debt payments come first). Practical solutions: 1. Send generous card/small gift within budget ($30-50 shows thought without breaking bank). Script: 'I can't make the destination weekend but I'm so happy for you! Sending love and a gift.' 2. Offer alternative celebration: 'Can we celebrate when you're back? Dinner on me.' 3. Be honest if asked: 'Travel costs aren't in my budget right now, but I'll be thinking of you!' Social scripts: Declining: 'I can't swing the travel costs, but I'm so excited for you!' (Don't over-explain). Suggesting alternative: 'Want to do a local celebration when you're back?' Permission: Your budget is not a referendum on how much you care. Real friends understand financial constraints."
    },
    
    tips: [
      "Systemic factors section validates that many struggles aren't personal failure",
      "Social scripts are brief and unapologetic - don't over-explain financial situations",
      "Alternative celebrations show you care without the financial burden",
      "Permission statements counter internalized shame messages",
      "Practical solutions focus on what you CAN do, not what you can't"
    ],
    
    pitfalls: [
      "Don't go into debt to avoid money shame - that creates worse problems",
      "Don't feel you must disclose full financial details - 'not in my budget' is complete answer",
      "Don't isolate due to money shame - there are free/low-cost ways to maintain friendships"
    ]
  }
},
   // NameAnxietyDestroyer-metadata.js
{ id: "NameAnxietyDestroyer",
  title: "Name Anxiety Destroyer",
  description: "Learn to pronounce any name from any language with confidence. Get phonetic guidance, cultural context, and respect-focused practice tips.",
  tagline: "Learn any name with confidence and cultural respect",
  category: "Communication",
  icon: "📛",
  gradient: "from-violet-500 to-purple-600",
  featured: true,
  guide: {
    overview: "Name Anxiety Destroyer helps you learn correct pronunciation of names from any language or culture. Enter any name and receive detailed phonetic guidance, syllable breakdowns, cultural context, and respectful practice tips. The tool emphasizes cultural respect and builds confidence by framing pronunciation as a learning journey, not a test. Perfect for anyone who wants to honor people by getting their names right.",
    
    howToUse: [
      "Enter the name exactly as written, including any special characters or accent marks (ñ, é, ü, etc.)",
      "Add optional context like the person's cultural background or where they're from to get more accurate guidance",
      "Select your native language to get pronunciation comparisons tailored to familiar sounds",
      "Review the phonetic spelling, syllable breakdown, and stress patterns",
      "Listen to browser audio (if available) and practice slowly",
      "Study common mistakes to avoid and learn the cultural context around the name",
      "Use the 'Ask for Help' script to respectfully request correction from the person",
      "Save frequently-used names to your learned collection for quick reference"
    ],
    
    example: {
      scenario: "You're meeting a new colleague named Siobhan and want to pronounce her Irish name correctly",
      action: "Enter 'Siobhan' and optionally add context 'Irish colleague'. Select 'English (American)' as your language",
      result: "You learn it's pronounced 'shi-VAWN' (not 'see-oh-ban'), see the syllable breakdown (Shiv-awn), learn that the 'bh' in Irish makes a 'v' sound, and get cultural context about Irish naming conventions. You also get a respectful script for double-checking your pronunciation with Siobhan directly."
    },
    
    tips: [
      "Practice names 10 times before using them in conversation - muscle memory helps!",
      "Focus on the stressed syllable first, then add the rest",
      "Record yourself saying the name and listen back to check",
      "Don't worry about perfection - sincere effort shows respect",
      "When in doubt, politely ask the person to say their name and repeat it back",
      "Save names you've learned so you can review before meetings",
      "Pay attention to cultural context about name order (some cultures put family name first)",
      "Some names have regional pronunciation variations - that's okay!",
      "If a name has special characters (é, ñ, ü), they're pronunciation guides - use them!",
      "Practice with the audio feature at slow speed multiple times"
    ],
    
    pitfalls: [
      "Don't say 'Your name is too hard' - instead say 'I want to make sure I say it correctly'",
      "Don't anglicize names without permission (turning Xiaomei into 'Shawmay')",
      "Don't assume nicknames are okay - always use the full name unless invited otherwise",
      "Don't skip learning names from unfamiliar cultures - that's when it matters most",
      "Don't be embarrassed to ask for correction - it shows you care",
      "Don't practice just once - names need repetition to stick",
      "Don't ignore the cultural context section - it helps you understand name usage",
      "Don't assume all names from one region sound the same (Chinese has many dialects!)"
    ],
    
    quickReference: {
      "Best for": "Names from any language, especially unfamiliar ones",
      "Audio": "Browser text-to-speech (quality varies)",
      "Cultural contexts": "150+ languages and regions",
      "Save names": "Yes, stored locally",
      "Offline use": "No, requires API for analysis"
    }
  },
  
  keywords: [
    "pronunciation",
    "names",
    "cultural respect",
    "phonetic",
    "linguistics",
    "etiquette",
    "international",
    "languages",
    "IPA",
    "syllables",
    "practice",
    "confidence",
    "communication",
    "diversity",
    "inclusion"
  ],
  
  tags: ["Communication", "Cultural", "Learning", "Respect", "International"],
  
  difficulty: "easy",
  
  useCases: [
    "Meeting international colleagues or classmates",
    "Preparing for job interviews with diverse hiring panels",
    "Customer service roles with diverse clientele",
    "Teaching in multicultural classrooms",
    "Healthcare providers meeting patients with unfamiliar names",
    "Event hosts or emcees introducing speakers",
    "Journalists or reporters interviewing diverse sources",
    "Anyone who wants to show respect by getting names right"
  ],
  
  benefits: [
    "Reduces social anxiety around unfamiliar names",
    "Shows cultural respect and awareness",
    "Builds confidence in international communication",
    "Provides linguistically accurate pronunciation guides",
    "Teaches cultural context beyond just sounds",
    "Encourages asking for help in respectful ways",
    "Saves frequently-used names for quick reference",
    "Helps avoid common anglicization mistakes"
  ],
  
  limitations: [
    "Audio quality depends on browser text-to-speech capabilities",
    "Regional pronunciation variations may exist within cultures",
    "Some tonal languages require hearing native pronunciation",
    "Doesn't replace asking the person directly for their preference",
    "Requires internet connection for analysis"
  ]},
{
  id: "MeetingBSDetector",
  title: "Meeting BS Detector",
  category: "Productivity",
  icon: "🔇",
  description: "Detects whether meetings are necessary or could be emails/async updates. Analyzes red flags like 'status update', 'touch base', no agenda. Provides alternative approaches (Loom, doc, Slack) with time saved estimates and permission to decline.",
  tagline: "Is this meeting necessary or could it be an email?",
  
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
  id: "RecipeChaosSolver",
  title: "Recipe Chaos Solver",
  category: "Daily Life",
  icon: "🍳",
  description: "Mid-cook crisis? Missing ingredients, burnt sauce, flat flavor? Get instant rescue solutions, smart substitutions (single or multi-ingredient), recipe scaling with non-linear adjustments, pre-flight readiness checks, flavor fix upgrades, 60-second cooking lessons, a wins journal, and a hands-free Kitchen Companion mode for flour-covered hands.",
  tagline: "Your kitchen 911 — from crisis to confidence",

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
  id: "BillRescue",
  title: "Bill Rescue",
  category: "Money",
  icon: "🧾",
  description: "Turn bill anxiety into a clear action plan with 9 tools: paste or photograph a bill for an AI autopsy, Quick Check any charge in 5 seconds, practice negotiation calls with an AI billing rep, generate 7 types of ready-to-send letters, triage multiple bills by priority, track plans, log call outcomes, view your bill calendar, and celebrate victories with a running savings total.",
  tagline: "Your bill anxiety ends here",

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
  }
},{
  id: "SubSweep",
  title: "SubSweep",
  category: "Money",
  icon: "🧹",
  description: "Your complete subscription management toolkit — 9 views. Audit every sub with honest verdicts and cost-per-use math. Get renewal date alerts before surprise charges. Detect price hikes automatically. Optimize plans with annual/family/bundle deals. Get retention scripts to negotiate discounts. Split shared subs and track who owes what. Monitor free trials with usage counters and cancel reminders. Set category budgets with over-limit alerts. Track cancellation savings over time with a spending timeline.",
  tagline: "Find what you're wasting and sweep it away",

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
  id: "ApologyCalibrator",
  title: "Apology Calibrator",
  category: "Communication",
  icon: "🙏",
  description: "Calibrates apology level to actual harm caused. 5 levels: no apology needed, brief acknowledgment, simple apology, full accountability apology, major repair. Stops over-apologizing for existing and under-apologizing for real harm. Templates for each level.",
  tagline: "Match your apology to the actual harm caused",
  
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
  id: "DoubleBookingDiplomat",
  title: "Double-Booking Diplomat",
  category: "Communication",
  icon: "📅",
  description: "Handles scheduling conflicts diplomatically. Analyzes which event to prioritize (professional obligations, first commitment, relationship importance). Provides honest/partial truth/white lie decline scripts. Includes reschedule options and 'if confronted' responses.",
  tagline: "Handle scheduling conflicts without burning bridges",
  
  guide: {
    overview: "You accidentally double-booked and need to decline one event without damaging the relationship. This tool weighs which to prioritize based on obligation type, relationship, and flexibility, then provides diplomatic scripts ranging from honest to tactful.",
    
    howToUse: [
      "Describe both conflicting events",
      "Optionally state your preference",
      "Get analysis of which to prioritize and why",
      "Receive multiple decline script options (honest/partial truth/reschedule)",
      "Learn pros and cons of each approach",
      "Get 'if confronted' scripts if they discover the conflict"
    ],
    
    example: {
      scenario: "You committed to your friend's birthday dinner (committed first). Then you accepted a work networking event the same night (could help your career). Both at 7pm Saturday.",
      action: "Event 1: Friend's birthday dinner, Event 2: Work networking event.",
      result: "Recommendation: Attend friend's birthday (first commitment + personal relationship). Decline: Work event. Strategy: Partial truth. Why: Friend committed first (fairness), birthday is once/year (can't reschedule), work event is fungible (network other times). Decline script options: 1. Honest conflict: 'I have a prior commitment I can't move. Will there be another networking event soon?' (Pro: honest, Con: they might ask what commitment). 2. Partial truth: 'I'm not available Saturday evening. Are there other events coming up?' (Pro: polite, true, no details needed). 3. If you want work event instead: Reschedule with friend: 'Something came up for work on Saturday. Can we celebrate Friday instead? Dinner on me.' If confronted (friend sees you posted about work event): 'I messed up. I should have been honest about the conflict instead of being vague. Your birthday was important and I prioritized work when I shouldn't have. I'm sorry.'"
    },
    
    tips: [
      "First commitment usually wins on fairness grounds",
      "Professional obligations often (but not always) trump social ones",
      "Can't-reschedule events (birthdays, weddings) win over recurring events",
      "Honest approach is best for close relationships, partial truth for acquaintances",
      "The reschedule option is often best of both worlds if timing allows"
    ],
    
    pitfalls: [
      "Don't lie if you might get caught - social media makes this risky",
      "Don't double-book intentionally as strategy - it's disrespectful",
      "Don't ghost - even 'I can't make it' is better than no-show"
    ]
  }
},
{
  id: "AwkwardSilenceFiller",
  title: "Awkward Silence Filler",
  category: "Communication",
  icon: "💬",
  description: "Panic Mode gives you one line instantly when you're in an awkward silence right now. Full mode generates conversation chains (not just openers — full 3-turn exchanges) tailored to who you're talking to, your comfort level, and topics to avoid. Includes exit strategies, body language, and a silence reframe.",
  tagline: "Context-smart conversation rescue — including a panic button",
  
  guide: {
    overview: "Most conversation tools give you a list of questions. That's not how real conversations work. This tool gives you conversation chains — your opener, their likely response, and your follow-up — so you can see how the conversation flows before you start it. Panic Mode is the headline feature: one big red button, one line, no form filling — for when you're in the silence right now. Full mode lets you pick a scenario, set your relationship and comfort level, flag topics to avoid, and get 5-6 tailored conversation chains plus body language, exit strategies, and what NOT to say.",
    
    howToUse: [
      "Panic Mode: Hit the red button for an instant conversation line — no setup needed",
      "Or pick a Quick Scenario (elevator with boss, first date, hairdresser, etc.)",
      "Select who you're talking to (stranger, coworker, boss, date, in-laws...)",
      "Set your comfort level from Panicking to Mostly Fine — this calibrates risk level",
      "Add topic landmines — things to avoid (politics, their divorce, your job search)",
      "Hit 'Get Conversation Lines' for full conversation chains",
      "Tap 'See how it plays out' on any chain to see the 3-turn flow",
      "Use the refresh button if the suggestions don't feel right"
    ],
    
    example: {
      scenario: "You're at your partner's family dinner. Seated next to their uncle you've never met. Conversation died after 'So what do you do?' and you're panicking. Avoid politics or religion.",
      action: "Scenario: Family gathering, Relationship: In-laws, Comfort: Panicking, Landmines: 'politics, religion'",
      result: "Silence Reframe: 'At family dinners, there are natural pauses when food arrives. Nobody is keeping score.' Read the Room: 'If he's focused on his food, he's comfortable. If he keeps glancing at you, he's also trying to think of something.' Chains: 1. (Low risk) 'This dish is incredible. Family recipe?' -> Food story -> 'I should ask [partner] to teach me some family recipes.' 2. (Low risk) 'How far did you have to drive today?' -> Mentions area -> 'Nice, I've heard that area is great.' Exit: 'Going to check if [partner] needs help in the kitchen.'"
    },
    
    tips: [
      "Panic Mode is the killer feature — use it when you're actually in the silence, no setup needed",
      "Observations beat questions: 'This place has great energy' feels natural, 'So what do you do?' feels like an interview",
      "The conversation chains show you the full flow — knowing what comes next is the real confidence builder",
      "Topic landmines prevent the AI from suggesting 'So how's dating going?' to someone who just broke up",
      "The silence reframe is always worth reading — sometimes the best move is to be comfortable with quiet"
    ],
    
    pitfalls: [
      "Don't rapid-fire all 5 conversation chains at someone — pick one and let it breathe",
      "Don't memorize scripts word-for-word — use them as a direction, not a teleprompter",
      "Don't force conversation if they clearly want quiet — the exit strategies exist for a reason"
    ]
  },
  
  keywords: [
    "awkward", "silence", "conversation", "small talk", "social anxiety",
    "what to say", "nervous", "uncomfortable", "filler", "icebreaker",
    "panic", "meeting people", "shy", "introvert"
  ],
  
  tags: ["Communication", "Social", "Anxiety", "Conversation"],
  difficulty: "easy",
},
{
  id: "MicroAdventureMapper",
  title: "Micro-Adventure Mapper",
  category: "Daily Life",
  icon: "🗺️",
  description: "Plans accessible mini-adventures: 2-4 hours, under $20, in/near your city. Detailed itineraries for urban exploration, nature, culture, social experiences. Creates novelty within ordinary constraints. Removes 'need full day/lots of money' barrier to adventure.",
  tagline: "Mini-adventures near you, under $20, in 2-4 hours",
  
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
  id: "DateNight",
  title: "DateNight",
  category: "Daily Life",
  icon: "💘",
  description: "Budget-driven evening planner for two. Pick your currency, set a budget and vibe, get a complete itinerary with timing, cost per stop, budget buffer, transportation, conversation starters, and a Plan B. Works worldwide — adapts to local culture, venues, and pricing.",
  tagline: "Budget-smart evening plans that feel intentional, not improvised",
  
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
      "Hit 'New Plan' if you want a different itinerary with the same constraints"
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
      "Hit 'New Plan' to get a completely different itinerary without changing your inputs",
      "Add what you did last time so the AI avoids repeating it"
    ],
    
    pitfalls: [
      "Venue suggestions are types, not specific business names — confirm availability before going",
      "Prices are estimates for the area — check actual menus and local pricing",
      "Make reservations if the tips suggest it, especially on weekends or holidays"
    ]
  },
  
  keywords: [
    "date night", "date ideas", "evening plan", "budget date", "romantic",
    "couple", "itinerary", "restaurant", "going out", "dinner plan",
    "first date", "anniversary", "stay in", "date planning"
  ],
  
  tags: ["Relationships", "Planning", "Budget", "Going Out"],
  difficulty: "easy",
},
  {
    id: "CrisisPrioritizer",
    title: "Crisis Prioritizer",
    category: "Productivity",
    icon: "🚨",
    description: "When everything feels urgent, this tool separates real urgency from anxiety urgency. Consequence-based triage ranks tasks by what actually breaks if you skip them. Brain dump mode extracts tasks from panicked thoughts. Time-block generator builds a concrete schedule. 'Only 2 of your 12 tasks actually need to happen today.'",
    tagline: "Separate real urgency from anxiety urgency",

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
        result: "Reality check: Of 8 tasks, only 2 are time-sensitive today. Anxiety audit shows 4 tasks feel urgent due to guilt, not consequences. Time-blocked schedule: 9:00–9:25 reply to client (critical), 9:25–9:35 break, 9:35–10:15 prep meeting slides (important), 10:15–10:30 break. Remaining 6 tasks get guilt-free deferral permissions with specific reasoning. After finishing the first two, hit 'What's next?' — the tool says 'You can stop now. Everything else can wait until tomorrow.'"
      },
      tips: [
        "The 'Just One Thing' panic button is there for your worst moments — it cuts through everything and gives you one clear action",
        "Brain dump mode works great when you can't even organize your thoughts into a list",
        "Use the voice selector to match what you need — Gentle when fragile, Tough Love when you need a push",
        "After 3+ sessions, check Pattern Analysis to see if you consistently overrate urgency in certain areas",
        "The Dashboard tracks your triage history — most people discover 60-70% of their 'urgent' tasks could always wait",
        "Task splitting (🧩) is powerful for tasks that feel huge — they're usually 3-5 smaller tasks in disguise"
      ]
    }
  },

{
  id: "VirtualBodyDouble",
  title: "Virtual Body Double",
  category: "Productivity",
  icon: "👥",
  description: "A quiet coworking companion for solo tasks with 6 session modes that change how your buddy behaves. Choose Deep Work (silent library), Sprint (high-energy burst), Grind (trench warfare solidarity), Creative (non-linear explorer), Avoidance Buster (extra-gentle first steps), or Standard. AI task breakdown, live check-ins with sound chimes and notifications, ambient presence between check-ins, shareable accountability cards at session end, quick-start repeat, mood tracking, 'I'm stuck' with micro-steps, session logging with streaks, and AI-powered insights. Like a coffee shop for your focus — someone's there, no pressure.",
  tagline: "A quiet coworking partner for solo tasks",

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
  },

  keywords: [
    "body double", "coworking", "focus", "accountability", "timer",
    "work session", "productivity", "pomodoro", "study buddy",
    "focus buddy", "deep work", "sprint", "grind", "creative",
    "avoidance", "session mode", "accountability card"
  ],

  tags: ["Productivity", "Focus", "Accountability"],
  difficulty: "easy",
},
{
  id: "WaitingModeLiberator",
  title: "Waiting Mode Liberator",
  category: "Mind & Energy",
  icon: "⏳",
  description: "Reclaims the hours around appointments that would otherwise be lost to 'I have a thing later so I can't start anything.' Add multiple events to map all your free windows. Set energy level for intensity-matched task blocks. 'Start With Me' walks you step-by-step from frozen to doing — a guided 60-second launch into any block with a built-in timer. Pre-appointment anxiety slider builds a history: after a few sessions, the tool proves your anxiety was lying ('Last 4 medical appointments: anxiety 8/10, reality 3/10'). Post-appointment debrief in 3 taps makes every session smarter. Pattern tracking reveals your triggers across sessions.",
  tagline: "Break free when upcoming events freeze your day",

  guide: {
    overview: "You have a dentist at 2pm and a dinner at 7pm. It's 10am. You know you should do things, but you're frozen because 'I have stuff later.' This tool does the math you won't: you have 3 free hours across 2 windows, your first prep alarm is at 1:25pm, and until then the dentist doesn't exist. Tell the tool your actual tasks and energy level — it maps them to time blocks with intensity badges (Easy/Medium/Deep). Can't start? 'Start With Me' walks you through the first 60 seconds of any block: 'Open your laptop. Now open the document. Read the first sentence. Good — timer started.' After the appointment, a 3-tap debrief tracks whether your anxiety matched reality. Over time, the tool builds proof that your fears overestimate: 'Your medical appointment anxiety averages 8/10 but outcomes average 3/10.'",

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
  },

  keywords: [
    "waiting mode", "appointment", "paralysis", "frozen", "before appointment",
    "time before", "can't start", "reclaim time", "free time", "prep alarm",
    "time blocks", "reframe", "one thing", "energy", "multiple appointments",
    "calendar", "free windows", "anxiety", "debrief", "guided", "start with me"
  ],

  tags: ["Mind & Energy", "Productivity", "Time"],
  difficulty: "easy",
},
{
  id: "BrainDumpStructurer",
  title: "Brain Dump Structurer",
  category: "Mind & Energy",
  icon: "🧠",
  description: "Turns the chaotic contents of your overwhelmed brain into one clear next step — then helps you actually do it. Dump everything via typing, rapid-fire, or voice. AI sorts into 9 categories and shows the therapeutic truth: most of what feels like 47 urgent tasks is actually 8 real things and a lot of noise. 'Shrink the List' challenges every item — is it really urgent? Could a 3-minute version handle 80% of the stress? 'Map to My Day' converts your sorted list into a real schedule with breaks. Worry Excavator digs into anxieties to find hidden tasks buried inside. Reclassify anything the AI got wrong. Emergency mode gives you exactly 3 things when you can barely function. After multiple dumps, pattern analysis reveals your brain's inflation ratio.",
  tagline: "Everything in your head → one clear next step",

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

  keywords: [
    "brain dump", "overwhelm", "structure", "organize", "thoughts", "tasks",
    "anxiety", "sort", "chaos", "clarity", "next step", "prioritize",
    "decisions", "worries", "feelings", "delegate", "action items",
    "shrink", "schedule", "time map", "excavate", "emergency",
    "voice", "reclassify", "carry forward", "patterns"
  ],

  tags: ["Mind & Energy", "Productivity"],
  difficulty: "easy",
},
{
  id: "GentlePushGenerator",
  title: "Gentle Push Generator",
  category: "Mind & Energy",
  icon: "🫸",
  description: "Micro-challenges slightly outside comfort zone, calibrated to current capacity. Achievable but slightly scary. Not aggressive motivation - gentle expansion. Celebrates attempts regardless of outcome. Growth without pressure.",
  tagline: "Micro-challenges just outside your comfort zone",
  
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
  id: "BrainStateDeejay",
  title: "Brain State Deejay",
  category: "Productivity",
  icon: "🎧",
  description: "Get science-backed music playlists personalized to your current brain state and desired transition. Goes beyond generic 'focus music' with tempo, complexity, and neurodivergent considerations (ADHD stimulation needs, autism sensory sensitivities).",
  tagline: "Science-backed playlists for your current brain state",
  
  guide: {
    overview: "Music affects cognitive states through tempo, complexity, and familiarity. This tool creates progressive playlists that transition you from anxious to calm, scattered to focused, or low-energy to motivated. Considers ADHD needs (stimulation without distraction) and autism needs (predictability, no surprises).",
    
    howToUse: [
      "Select your current state (anxious, scattered, low energy, overwhelmed, foggy)",
      "Select your desired state (focused, calm, energized, creative, grounded)",
      "Optionally add task context, music preferences, neurodivergent profile",
      "Get 3-phase playlist strategy with specific genres and search terms",
      "Search recommendations on Spotify/Apple Music and start your transition"
    ],
    
    example: {
      scenario: "You're scattered and can't focus on writing a report. You have ADHD and need auditory stimulation but lyrics distract you.",
      action: "Select 'Scattered/Unfocused' → 'Focused/Productive', add 'Writing report', note 'ADHD - need stimulation, no lyrics'.",
      result: "3-phase playlist: (1) Familiar upbeat songs (10 min) to engage dopamine, (2) Lo-fi instrumental at 90-95 BPM (60 min) for sustained focus without distraction, (3) Minimal ambient (30 min) to maintain flow. Includes Spotify search terms and alternatives if too/not enough stimulation."
    },
    
    tips: [
      "Start the playlist BEFORE starting work - music helps transition your brain state",
      "Let the phases play through - don't shuffle, the progression is intentional",
      "If you need MORE stimulation (ADHD restlessness), use the alternative playlist suggestions",
      "If you're overwhelmed by the music, switch to the 'too stimulating' alternative (often just brown noise)",
      "Headphones recommended for better focus cue and isolation"
    ],
    
    pitfalls: [
      "Don't use new/unfamiliar music for focus work - cognitive load of processing new music distracts",
      "Don't use lyrical music for verbal tasks (writing, reading) - language processing interferes",
      "Don't ignore the 'too much/too little stimulation' signals - adjust playlist accordingly"
    ]
  }
},
// SpiralStopper v2 — 3 modes (absorbs FreezeStateUnblocker, ShutdownRecoveryGuide)
{
  id: 'SpiralStopper',
  title: 'Spiral Stopper',
  description: "Emergency intervention for three crisis states. Spiraling: dump your racing thoughts and get immediate grounding, cognitive distortion identification with evidence-based reality checks, and a compassionate anchor statement. Frozen: when you can't start, can't decide, can't move — get one micro-action at a time with clear completion signals and explicit permission to stop. Crashed: when you're completely spent, get a severity-matched recovery protocol with staged instructions, basics checklists, permission statements, and recovery signs. All three modes log episodes persistently, offer post-crisis debriefs, and unlock pattern analysis after 3+ episodes to build your personal intervention toolkit.",
  category: 'wellness',
  icon: '🌀',
  tagline: "Emergency intervention for spirals, freezes, and crashes",
gradient: 'from-purple-500 to-emerald-500',
  route: 'spiral-stopper',
  actions: ['spiral', 'unfreeze', 'recover', 'reflect', 'patterns'],
  promptKeys: {
    spiral: ['thoughts', 'physical_symptoms', 'trigger', 'intensity', 'history'],
    unfreeze: ['stuck_on', 'current_step', 'completed_steps', 'can_move'],
    recover: ['crash_type', 'severity', 'duration', 'can_do'],
    reflect: ['trigger', 'distortion', 'intensity_before', 'intensity_after', 'what_helped'],
    patterns: ['episode_log'],
  },
  exampleScenario: `You open Spiral Stopper and see three big buttons: 🌀 Spiraling, ❄️ Frozen, 🔋 Crashed.

SPIRALING: It's 11pm and you just remembered you sent an email with a typo to your boss. You tap Spiraling, dump all of it, set intensity to 4/5. First: "Put your phone face down. Press both palms flat on the surface in front of you." Then the breakdown: mind-reading + catastrophizing. Reality check with evidence. The anchor: "Your brain jumped from one typo to homelessness in 3 seconds. That's not analysis — that's catastrophizing."

FROZEN: Next morning, you can't start a project. You tap Frozen. Step 1: "Stand up." Done. Step 2: "Walk to kitchen." Done. Step 3: "Drink water." Done. After 3 physical steps, it micro-steps toward the task. Each step has one action, one completion signal, and permission to stop.

CRASHED: Friday, you've been running on empty for 2 weeks. You tap Crashed, Burnout, Severe. Staged protocol: Stage 1: "If water is within reach, drink some. Breathing is enough." Stage 2: "Text one person." Stage 3: "Eat anything. A cracker counts." Permissions and recovery signs included.

After each episode, a quick debrief builds your personal toolkit over time.`,
  features: [
    'Thought dump: unfiltered text entry for racing thoughts',
    'Cognitive distortion detection: catastrophizing, mind-reading, fortune-telling, all-or-nothing, overgeneralization, emotional reasoning, should statements',
    'Evidence-based reality checks: counters with specific evidence, not generic reassurance',
    'Immediate physical grounding: first action is always physical to interrupt the neural loop',
    'Guided grounding exercise with step-by-step instructions',
    'Compassionate anchor statement: the truth about what is actually happening',
    'Intensity tracking (1-5) with before/after comparison',
    'Pattern recognition from previous spiral history',
    'One micro-action at a time: never more than one instruction',
    'Physical-first progression: body movement before task steps',
    'Clear completion signals for each step',
    'Explicit permission to stop after every step',
    'Gradual task approach: after 3+ physical steps, micro-steps toward the actual task',
    'Five crash types: total exhaustion, emotional overload, burnout, overwhelm collapse, sensory overload',
    'Severity matching: instructions scaled to actual capability',
    'Staged recovery: progressive stages from survival to basic function',
    'Permission statements: explicit permission to drop obligations',
    'Recovery signs: how to know you are coming back',
    'Episode logging: persistent history across all three modes (up to 100 episodes)',
    'Post-crisis debrief: intensity comparison, what helped, reflection',
    'Pattern analysis: unlocks after 3+ episodes with trigger patterns, improvement trends, personalized toolkit',
    'Status timeline: color-coded episode history bar',
    'Breathing prompt: shown before every crisis input',
  ],
  relatedTools: ['DopamineMenuBuilder', 'CrisisPrioritizer', 'BrainDumpStructurer'],
},
{
  id: "CaptionMagic",
  title: "Caption Magic",
  category: "Communication",
  icon: "📸",
  description: "Turn mundane photos into engaging social media captions. Upload any image and get 3-5 authentic caption options tailored to your platform and tone preferences.",
  tagline: "Turn any photo into engaging social media captions",
  
  guide: {
    overview: "The Social Proof Generator transforms ordinary photos into shareable social media content. Whether it's your coffee cup, desk setup, or another sunset pic, this tool crafts captions that acknowledge the mundane with charm. It analyzes your image, understands the platform you're posting to, and generates multiple caption options that feel authentic—not try-hard or overly enthusiastic.",
    
    howToUse: [
      "Upload an image (or paste from clipboard) OR describe what's in your photo",
      "Select your platform: Instagram, LinkedIn, Facebook, or Twitter/X",
      "Choose 1-3 tones that match your vibe: funny, reflective, professional, casual, inspirational, or minimal",
      "Add optional context about where/when the photo was taken",
      "Click 'Generate Captions' and review 3-5 customized options with hashtags and character counts"
    ],
    
    example: {
      scenario: "You took a photo of your coffee mug on your desk with your laptop in the background—the millionth 'working from home' photo.",
      action: "Upload the image, select Instagram, choose 'funny' and 'casual' tones, then generate captions.",
      result: "You get options like: 'Fancy meeting you here ☕️ (day 847 of pretending my desk is an office)' with relevant hashtags, character count, and a 'why this works' explanation. If one caption feels too enthusiastic, click 'Make it less try-hard' to instantly tone it down."
    },
    tips: [
      "Mix tones for variety—combining 'funny' with 'reflective' often yields the most authentic-feeling options",
      "Use the 'Make it less try-hard' button if a caption feels forced or overly enthusiastic",
      "The alt text suggestion helps make your posts accessible—copy it when posting",
      "Platform matters: LinkedIn captions are more professional, Instagram more casual with emoji",
      "Add context about the moment ('team retreat in Colorado') for more personalized captions"],
   pitfalls:[ 
      "Don't select too many tones at once—stick to 2-3 for focused, quality captions rather than scattered results",
      "Watch character counts for your platform—Twitter has stricter limits than Instagram",
      "The tool works best when you're honest about mundane photos rather than trying to oversell them—self-aware captions perform better than fake enthusiasm"
 ]}},
 {
  id: "VelvetHammer",
  title: "Velvet Hammer",
  category: "Communication",
  icon: "🔨",
  description: "Transform angry draft messages into professional communication. Type what you really want to say, then get three polished versions that preserve your point while removing the fire.",
  tagline: "Transform furious drafts into professional messages",
  
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
    id: "RamenRatio",
    title: "Ramen Ratio",
    category: "Money",
    icon: "🍜",
    description: "See the true cost of purchases in units that matter to you.",
    tagline: "See every purchase in meals, not dollars",
    
    guide: {
      overview: "RamenRatio measures your financial security in 'days of food' rather than dollars. Every purchase is translated into 'X days of meals', making spending decisions visceral and survival-focused. This triggers loss aversion psychology - spending money feels like reducing your food supply.",
      
      howToUse: [
        "Set your daily meal cost (how much you spend per day on food)",
        "Enter your monthly income",
        "View your 'food security' (how many days of meals you can afford)",
        "Before any purchase, enter the amount to see how many days it costs",
        "Watch your food security number - keep it above 90 days (3 months)"
      ],
      
      example: {
        scenario: "Alex has $1,200 and spends $3.50/day on food. That's 342 days of food security. He's considering buying $120 concert tickets.",
        action: "Alex enters '$120 - Concert tickets' into RamenRatio.",
        result: "The tool shows: '34 days of food security'. Alex sees his security would drop from 342 to 308 days. The concert is worth almost 5 weeks of food. He decides to buy the tickets because they're for his favorite band, but he's now aware of the real trade-off."
      },
      
      tips: [
        "Keep your food security above 90 days minimum (3 months safety net)",
        "Calculate based on your cheapest sustainable meals, not restaurant prices",
        "Use this for discretionary spending, not for actual food purchases",
        "The 'days' metric is psychological - it's about awareness, not literal survival",
        "Update your daily meal cost monthly as grocery prices change"
      ],
      
      pitfalls: [
        "Don't include rent/bills in daily meal cost - only actual food",
        "Don't let the number stress you out - it's a tool for awareness, not anxiety",
        "Don't feel guilty about necessary purchases that reduce your days"
      ]
    }
  },
    {
    id: "ProfVibe",
    title: "Prof Vibe",
    category: "Academic",
    icon: "🎓",
    description: "AI sentiment analysis of professor reviews. Filter the ego from the education to see what a class is really like.",
    tagline: "AI sentiment analysis of professor reviews",
    
    guide: {
      overview: "ProfVibe uses AI to analyze thousands of professor reviews and extract genuine insights about teaching quality, workload, and grading fairness. It filters out emotional rants and focuses on actionable information to help you choose the right professor.",
      
      howToUse: [
        "Search for your course or professor name",
        "Review the AI-generated summary showing teaching style, difficulty level, and grading patterns",
        "Check the sentiment breakdown (positive/negative/neutral)",
        "Read key themes extracted from reviews",
        "Compare multiple professors teaching the same course"
      ],
      
      example: {
        scenario: "You need to take ECON 101 and there are three professors available. You want someone who explains concepts clearly but isn't too easy.",
        action: "Search 'ECON 101' in ProfVibe and compare the three professors' AI summaries.",
        result: "Prof. Smith: 'Clear explanations, challenging exams, fair grading.' Prof. Jones: 'Disorganized lectures, easy tests.' Prof. Lee: 'Engaging style, moderate difficulty, helpful office hours.' You choose Prof. Lee for the best balance."
      },
      
      tips: [
        "Look for consistency in themes - if 50+ reviews mention 'unclear grading', it's probably true",
        "Focus on recent reviews (last 2 years) - professors change over time",
        "Don't avoid 'hard' professors if they're rated as good teachers",
        "Compare teaching style to your learning style (visual vs. lecture vs. hands-on)"
      ]
    }
  }, 
  {
    id: "WingMan",
    title: "Wingman",
    category: "Communication",
    icon: "🦅",
    description: "AI-generated icebreakers and social strategy. Never walk into a mixer or a career fair without a tactical plan.",
    tagline: "AI-generated icebreakers and social strategy",
    
    guide: {
      overview: "Wingman prepares you for social situations with AI-generated conversation starters, questions to ask, and follow-up strategies. Input the context (career fair, party, networking event) and get a tactical social plan.",
      
      howToUse: [
        "Select the event type (career fair, party, networking, date, etc.)",
        "Add context (industry, mutual friends, your goals)",
        "Review AI-generated icebreakers and conversation topics",
        "Get suggested questions to ask and topics to avoid",
        "Practice the conversation flow before the event"
      ],      
      example: "Career fair tomorrow - you want to talk to Google recruiters. Wingman suggests: Opening: 'I saw your team launched [recent product] - what's it like working on that?' Follow-ups: Ask about internship timeline, team culture, skills they look for. Avoid: Asking about salary in first conversation.",
      
      tips: [
        "Customize suggestions to sound like YOU - don't read them verbatim",
        "Have 3-5 conversation starters ready, not just one",
        "Ask follow-up questions based on their answers, don't just run through your list",
        "After events, note what worked to train the AI for next time"
      ]
    }
  },
  
  {
    id: "HabitChain",
    title: "Habit Chain",
    category: "Productivity",
    icon: "🔗",
    description: "Visual momentum tracker for unbreakable streaks. Build the habits that actually move the needle.",
    tagline: "Visual momentum tracker for unbreakable streaks",
    
    guide: {
      overview: "HabitChain uses visual momentum psychology to make you never want to break your streak. Each day you complete your habit adds a link to the chain. Breaking the streak resets it to zero, creating strong motivation to maintain consistency.",
      
      howToUse: [
        "Create a new habit you want to build (e.g., 'Study 1 hour daily')",
        "Set the minimum completion criteria (what counts as 'done')",
        "Mark each day complete when you finish",
        "Watch your chain grow - each link represents a day of success",
        "Don't break the chain - reset means starting from zero"
      ],
      
      example: "You want to exercise daily. Set habit: 'Exercise 20 min'. Day 1: ✓. Day 2: ✓. Day 3: ✓. Chain = 3 days. On Day 4, you're tired but seeing that 3-day chain makes you do it anyway. Chain = 4 days. By Day 30, you won't break a 30-day chain.",
      
      tips: [
        "Start with minimum viable completion (10 min, not 2 hours)",
        "Track 1-3 habits max - too many chains dilute focus",
        "Put it somewhere you'll see daily (home screen, bathroom mirror)",
        "If you break a chain, analyze why and adjust the habit difficulty",
        "Celebrate milestone numbers (7 days, 30 days, 100 days)"
      ]
    }
  },
  {
    id: "CiteSight",
    title: "CiteSight",
    category: "Academic",
    icon: "📑",
    description: "Scan book barcodes to generate perfect citations in MLA/APA.",
    tagline: "Scan barcodes, get perfect citations instantly",
    
    guide: {
      overview: "CiteSight uses your phone camera to scan book ISBNs and automatically generates properly formatted citations in MLA, APA, Chicago, or any other style. No more manual typing or formatting errors.",
      
      howToUse: [
        "Open the camera scanner",
        "Point at the barcode on the back of the book",
        "Wait for the green checkmark (book identified)",
        "Select your citation style (MLA, APA, Chicago, etc.)",
        "Copy the formatted citation to your clipboard"
      ],
      
      example: "Writing a paper, need to cite 5 books. Scan each barcode (takes 5 seconds per book), select APA style, copy all citations. Paste into your bibliography. Done in 30 seconds instead of 15 minutes of manual formatting.",
      
      tips: [
        "Scan the barcode, not the QR code",
        "Good lighting helps - avoid glare and shadows",
        "Save citations to 'favorites' for papers you're still writing",
        "Can cite page numbers later by editing the citation"
      ]
    }
  },
  
  {
    id: "TheCurve",     
    title: "The Curve",     
    category: "Academic",     
    icon: "📈",
    description: "Standard GPA tracker and weighted average calculator.",
    tagline: "Track your GPA with weighted grade calculations",
    
    guide: {
      overview: "TheCurve helps you track your GPA in real-time and shows exactly what grades you need on remaining assignments to hit your target GPA. Enter your courses, credit hours, and current grades to see your cumulative and semester GPAs.",
      
      howToUse: [
        "Add each course with credit hours and grading scale",
        "Enter completed assignments and their weights",
        "Set your target GPA (e.g., 3.5)",
        "See what grades you need on remaining work to hit your target",
        "Update as you get new grades to track progress"
      ],
      
      tips: [
        "Update after every major grade to stay accurate",
        "Focus effort on classes where improvement is still possible",
        "If you need a 105% to reach your target, pivot to damage control"
      ]
    }
  },
  
  {
    id: "GroupTherapy",
    title: "GroupTherapy",
    category: "Academic",
    icon: "👋",
    description: "Impartial AI project manager that assigns tasks and nags slackers.",
    tagline: "AI project manager that assigns tasks and nags slackers",
    
    guide: {
      overview: "GroupTherapy is an AI mediator for group projects. It distributes tasks fairly, tracks who's doing their share, and sends automated reminders to slackers. No more awkward confrontations about unequal workload.",
      
      howToUse: [
        "Create a group and invite members",
        "Input the project requirements and deadline",
        "AI suggests fair task distribution based on skills and availability",
        "Each person accepts their tasks",
        "AI sends reminders and flags anyone falling behind"
      ],
      
      tips: [
        "Set task deadlines earlier than the final deadline for buffer time",
        "Let the AI handle the nagging - keeps friendships intact",
        "Review task completion percentages before grading each other"
      ]
    }
  },
  
  {
    id: "SourceCheck",
    title: "SourceCheck",
    category: "Academic",
    icon: "🔍",
    description: "Instant credibility analysis for websites and research sources.",
    tagline: "Instant credibility analysis for any source",
    
    guide: {
      overview: "SourceCheck analyzes websites and academic sources for credibility. It checks author credentials, publication reputation, citation count, bias indicators, and factual accuracy to help you determine if a source is trustworthy.",
      
      howToUse: [
        "Paste the URL or enter the source details",
        "Review the credibility score (0-100)",
        "Read the breakdown: author expertise, publication quality, bias rating",
        "See if the source is peer-reviewed or cited by credible sources",
        "Decide whether to use it in your paper"
      ],
      
      tips: [
        "Score above 70 = generally safe to cite",
        "Check bias rating even for credible sources",
        "Wikipedia gets low score but its cited sources might be great"
      ]
    }
  },
  {
    id: "Recall",
    title: "Recall",
    category: "Academic",
    icon: "🧠",
    description: "Transcribes 90-minute lectures into 10 key bullet points.",
    tagline: "Turn 90-minute lectures into 10 key bullet points",
    
    guide: {
      overview: "Recall records lectures and uses AI to extract the 10 most important points, cutting through tangents and repetition. Perfect for review sessions or when you missed a class.",
      
      howToUse: [
        "Start recording at the beginning of lecture",
        "Let it run for the entire class",
        "After class, wait 2-3 minutes for AI processing",
        "Review the 10 key bullet points",
        "Click any point to jump to that timestamp in the audio"
      ],
      
      tips: [
        "Still take notes - this is for review/reinforcement",
        "Professor says 'This will be on the test'? Recall will catch it",
        "Listen to full audio for context on confusing topics"
      ]
    }
  },
  
  {
    id: "TheGap",
    title: "The Gap",
    category: "Academic",
    icon: "📝",
    description: "Links current confusing concepts back to the missing prerequisites.",
    tagline: "Link confusing concepts back to missing prerequisites",
    
    guide: {
      overview: "TheGap identifies knowledge gaps when you're struggling with a concept. Enter what you don't understand, and it traces back to show what prerequisite concept you're missing.",
      
      howToUse: [
        "Enter the concept you're struggling with (e.g., 'chain rule in calculus')",
        "TheGap shows the prerequisite chain",
        "Click each prerequisite to get a quick refresher",
        "Work backwards until you find where your understanding broke",
        "Fill in the gaps before returning to current material"
      ],
      
      example: "Struggling with integrals. TheGap shows: Integrals → Derivatives → Limits → Functions. You realize you never really understood limits. Watch a 5-min video on limits, suddenly integrals make sense.",
      
      tips: [
        "Often the gap is 2-3 steps back, not the immediate prerequisite",
        "Don't skip ahead until you fill the gap - it'll keep haunting you"
      ]
    }
  },
  
  {
    id: "FlashScan",
    title: "FlashScan",
    category: "Academic",
    icon: "⚡",
    description: "Converts photos of handwritten notes into digital flashcards.",
    tagline: "Photos of handwritten notes become digital flashcards",
    
    guide: {
      overview: "FlashScan uses OCR to read your handwritten notes and automatically creates digital flashcards. Take a photo of your notes, and it generates question/answer pairs for studying.",
      
      howToUse: [
        "Take clear photos of your handwritten notes",
        "Upload to FlashScan",
        "AI extracts key concepts and creates Q&A pairs",
        "Review and edit the generated flashcards",
        "Study using spaced repetition"
      ],
      
      tips: [
        "Write clearly - messy handwriting reduces accuracy",
        "Edit AI-generated cards - they're good but not perfect",
        "Works best with structured notes (definitions, formulas, key points)"
      ]
    }
  },
  
  {
    id: "TheMirror",
    title: "The Mirror",
    category: "Academic",
    icon: "🪞",
    description: "AI interview coach that analyzes your speech and eye contact.",
    tagline: "AI interview coach for speech and confidence",
    
    guide: {
      overview: "TheMirror records mock interviews and uses AI to analyze your body language, eye contact, filler words (um, like, uh), speech pace, and confidence. Get feedback before your real interview.",
      
      howToUse: [
        "Select interview type (technical, behavioral, case study)",
        "Practice answering AI-generated questions on camera",
        "Review the analysis: eye contact %, filler word count, pace",
        "Watch playback with annotations showing issues",
        "Practice again to improve weak areas"
      ],
      
      tips: [
        "Practice multiple times - first attempt is always rough",
        "Focus on one issue per practice (fix filler words, then work on eye contact)",
        "Real interviews are less scary after 10 practice sessions"
      ]
    }
  },
  
  {
    id: "WikiWeb",
    title: "WikiWeb",
    category: "Academic",
    icon: "🌐",
    description: "Visual node-graph of Wikipedia articles to see connections.",
    tagline: "Visualize how Wikipedia topics connect",
    
    guide: {
      overview: "WikiWeb creates an interactive graph showing how Wikipedia articles connect. Start with any topic and see related concepts, sub-topics, and prerequisite knowledge visually mapped.",
      
      howToUse: [
        "Enter a Wikipedia topic",
        "See the central node with connecting nodes for related articles",
        "Click any node to expand and see its connections",
        "Zoom in/out to explore the knowledge map",
        "Use this to understand topic relationships and find research angles"
      ],
      
      tips: [
        "Great for seeing the 'big picture' of a subject",
        "Find unexpected connections for unique paper angles",
        "Trace from complex topics back to fundamentals"
      ]
    }
  },
  
  {
    id: "BuyWise",
    title: "Buy Wise",
    category: "Money",
    icon: "🧠",
    description: "Pre-purchase research assistant. Enter what you're buying and get fair price analysis, timing advice, total cost of ownership, cheaper alternatives, regret predictions, negotiation scripts, and an impulse check. Like having a knowledgeable friend who stops you from overpaying.",
    tagline: "The research you'd do if you had an hour — done in seconds",
    
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
    },
    
    keywords: [
      "buy", "purchase", "price", "cheap", "deal", "sale", "compare", "review",
      "worth it", "should I buy", "alternative", "negotiate", "cost", "budget",
      "shopping", "refurbished", "impulse", "regret", "value"
    ],
    
    tags: ["Money", "Shopping", "Research", "Decisions"],
    difficulty: "easy",
  },
  
  {
    id: "Presenter",
    title: "Presenter",
    category: "Academic",
    icon: "🎤",
    description: "Pacing tool that listens to your speech and tells you to slow down.",
    tagline: "Real-time pacing coach for presentations",
    
    guide: {
      overview: "Presenter uses real-time speech analysis to help you maintain good presentation pacing. It listens as you speak and vibrates/alerts when you're talking too fast, using filler words, or need to pause.",
      
      howToUse: [
        "Set your presentation duration (e.g., 10 minutes)",
        "Start Presenter and begin your presentation",
        "Watch the real-time feedback: pace indicator, filler word counter",
        "Feel haptic alerts when you speed up too much",
        "Review the summary after: average pace, filler words, pauses"
      ],
      
      tips: [
        "Practice with Presenter 3-5 times before the real presentation",
        "Pauses feel awkward to you but natural to audience",
        "Aim for 120-150 words per minute"
      ]
    }
  },
  {
    id: "FridgeAlchemy",
    title: "Fridge Alchemy",
    category: "Daily Life",
    icon: "🧪",
    description: "Generates creative meals from the random 2-8 ingredients left in your fridge. Honest about what's possible, playful about constraints. Snap a fridge photo or type what you have.",
    tagline: "A meal from whatever's left in your fridge",
    guide: {
      overview: "FridgeAlchemy takes whatever random ingredients you have — even just 2 or 3 — and generates 2-3 creative recipes using ONLY those ingredients plus basic staples. Snap a fridge photo for AI ingredient detection, or just type what you've got. Each recipe comes with a vibe tag, honest rating, and a 'What if you had ONE more thing?' bonus suggestion.",
      howToUse: [
        "Type ingredients and press Enter (or comma) to add them as chips — or snap a photo of your fridge for AI detection",
        "Toggle which kitchen staples you always have (salt, pepper, oil are checked by default)",
        "Optionally set constraints: time limit, equipment, dietary needs, effort level",
        "Hit 'Alchemize' to get 2-3 recipes with step-by-step instructions",
        "Check off steps as you cook, refine recipes (spicier, different, microwave only), or copy to clipboard"
      ],
      example: {
        scenario: "It's 9 PM. You have eggs, tortillas, and cheese. You're not going to the store.",
        action: "Add eggs, tortillas, cheese. Hit Alchemize.",
        result: "Recipe 1: Crispy Cheese Quesadilla with Egg (😌 Comfort classic, 10 min, Easy). Recipe 2: Egg & Cheese Tortilla Wrap (⚡ 5-minute save). Plus: 'If you also had an onion, you could make caramelized onion quesadillas or huevos rancheros.'"
      },
      tips: [
        "The fridge photo scanner works best with good lighting — it identifies visible ingredients and adds them as chips you can edit",
        "Don't forget to check off staples you actually have (butter, garlic, soy sauce) — they expand your options without counting as 'ingredients'",
        "The 'one more thing' suggestion tells you the single highest-impact item to grab if you do make a quick store run",
        "Use the refinement buttons to adjust recipes without starting over — 'Spicier', 'Different', or 'Microwave only'",
        "2-3 ingredients = simple dishes, and that's fine. The tool is honest, not pretentious."
      ]
    }
  },
{
  id: "SafeWalk",
  title: "Safe Walk",
	category: ["Daily Life", "Academic"],
  icon: "🚶",
  description: "Pre-walk safety planner and active walk companion. AI assesses your route and timing with personalized awareness tips and a checkable prep list — then switches to companion mode with a check-in timer, convincing fake incoming call generator, flashlight, one-tap location sharing, and a loud emergency alarm. Designed for one-handed nighttime phone use.",
  tagline: "Prepare smart, walk safe",

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
      "The alarm is LOUD — it uses your phone's speaker at maximum. Use it to draw attention if needed"
    ],

    pitfalls: [
      "Don't rely on this tool as your only safety measure — tell someone where you're going in person too",
      "Flashlight uses the torch API on Android but falls back to a white screen on iOS — use Control Center for the real flashlight on iPhone",
      "The AI can't tell you if a specific street is dangerous right now — it applies general urban safety principles to your scenario",
      "Don't skip the check-in timer — it's the feature that actually prompts someone to look for you if something goes wrong"
    ]
  }
},
  {
    id: "ZenMode",
    title: "ZenMode",
    category: "Daily Life",
    icon: "🧘",
    description: "Batches notifications to deliver them only twice a day.",
    tagline: "Batch your notifications to twice a day",
    
    guide: {
      overview: "ZenMode holds all your non-urgent notifications and delivers them in two batches per day (you choose the times). Stop the constant dings and buzzes disrupting your focus.",
      
      howToUse: [
        "Set your notification batch times (e.g., 12pm and 6pm)",
        "Choose which apps to batch (can exclude texts/calls)",
        "Enable ZenMode",
        "Check notifications only at your scheduled times",
        "Urgent contacts can always get through"
      ],
      
      tips: [
        "Add important contacts to 'always notify' list",
        "Start with 2x daily, can reduce to 1x daily later",
        "First few days feel weird, then you'll never go back"
      ]
    }
  },
  {
  id: "RoommateCourt",
  title: "RoommateCourt",
  category: ["Daily Life", "Communication"],
  icon: "⚖️",
  description: "Two tools in one: AI-powered dispute mediation that analyzes fault, surfaces the real underlying conflict, and gives you a word-for-word conversation script — plus a fair chore assignment engine that balances effort across rounds using history, so nobody can claim it's unfair. Includes a 'That's Not Fair!' button that reviews complaints against actual data.",
  tagline: "Settle disputes and assign chores — no arguments",

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
  id: "RentersDepositSaver",
  title: "Renter's Deposit Saver",
  category: "Daily Life",
  icon: "🏦",
  description: "Walk through your apartment room by room on move-in day. Generates a formal condition report, landlord cover letter, photo shot list, and your state-specific deposit rights.",
  tagline: "Protect your security deposit on move-in day",

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
    id: "LaundroMat",
    title: "LaundroMat",
    category: "Daily Life",
    icon: "🧺",
    description: "Laundry companion with smart timers, AI load advisor, and stain SOS. Set countdown alerts for washer/dryer, get AI care instructions for any load, and get emergency stain treatment steps.",
    tagline: "Never lose track of your laundry again",
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
    id: "Unsubscribe",
    title: "Unsubscribe",
    category: "Daily Life",
    icon: "✂️",
    description: "Finds the tiny unsubscribe link in emails and makes it a huge button.",
    tagline: "Make tiny unsubscribe links impossible to miss",
    
    guide: {
      overview: "Unsubscribe detects marketing emails and creates a prominent 'UNSUBSCRIBE NOW' button at the top. No more hunting for the tiny link in 8pt gray text at the bottom.",
      
      howToUse: [
        "Install the browser extension or email plugin",
        "Open any marketing email",
        "See the big 'UNSUBSCRIBE' button at the top",
        "Click once to unsubscribe",
        "Email automatically moves to trash"
      ],
      
      tips: [
        "Unsubscribe from everything you don't actively read",
        "If you haven't opened their emails in 30 days, unsubscribe",
        "Can bulk-unsubscribe from multiple senders at once"
      ]
    }
  },
  // ========================================================================
  // SOCIAL
  // ========================================================================
  {
    id: "KidBot",
    title: "KidBot",
    category: "Communication",
    icon: "🧒",
    description: "Generates texts to your parents that sound like you, to keep them happy.",
    tagline: "Generate texts to parents that sound like you",
    
    guide: {
      overview: "KidBot learns your texting style and generates realistic messages to your parents. Keep them happy and worry-free with regular check-ins, without spending time crafting messages.",
      
      howToUse: [
        "Let KidBot analyze your previous texts to parents",
        "Set desired check-in frequency (daily, weekly)",
        "Review and approve/edit suggested messages",
        "Send directly or schedule for later",
        "Respond to their replies normally"
      ],
      
      tips: [
        "Always review before sending - don't auto-send",
        "Use for basic check-ins, not important conversations",
        "Adjust formality to match your actual relationship",
        "Mix in real messages too - don't become 100% automated"
      ],
      
      pitfalls: [
        "Don't use for serious topics or important news",
        "Parents will notice if messages are too repetitive",
        "Some parents prefer actual calls - know your audience"
      ]
    }
  },
  
  {
    id: "Impartial",
    title: "Impartial",
    category: "Communication",
    icon: "⚖️",
    description: "Fact-checker to instantly settle trivia arguments between friends.",
    tagline: "Settle trivia arguments with instant fact-checks",
    
    guide: {
      overview: "Impartial is an AI fact-checker that settles debates by finding credible sources. End the 'I'm pretty sure...' arguments with actual verified facts.",
      
      howToUse: [
        "Type or speak the disputed claim",
        "Wait 5 seconds for AI to search credible sources",
        "Get the verdict: True, False, or Partially True",
        "See the sources cited",
        "Accept defeat gracefully or vindication graciously"
      ],
      
      tips: [
        "Works best for factual claims, not opinions",
        "Check the sources if the answer seems wrong",
        "Don't use to be 'that guy' who fact-checks everything"
      ]
    }
  },
  
  {
    id: "TheNetwork",
    title: "The Network",
    category: "Communication",
    icon: "🤝",
    description: "Connects you with alumni from your college in your dream job.",
    tagline: "Connect with alumni in your dream career",
    
    guide: {
      overview: "TheNetwork is a searchable database of alumni willing to give career advice. Find people who went to your school and now work in your target industry/company, then request informational interviews.",
      
      howToUse: [
        "Enter your school and target industry/company",
        "Browse alumni profiles with their current roles",
        "Read their 'happy to discuss' topics",
        "Send a connection request with your questions",
        "Schedule a 15-30 minute call/coffee chat"
      ],
      
      tips: [
        "Lead with your school connection, not a job request",
        "Ask about their path, not if they're hiring",
        "Send thank-you notes after every conversation",
        "Offer to help future students when you graduate"
      ]
    }
  },
  
  {
    id: "TheHub",
    title: "The Hub",
    category: "Communication",
    icon: "🔌",
    description: "Aggregates every campus event from flyers and Facebook into one map.",
    tagline: "Every campus event in one searchable map",
    
    guide: {
      overview: "TheHub consolidates all campus events from Facebook groups, flyers, department emails, and club announcements into one searchable calendar and map.",
      
      howToUse: [
        "View today's events on the map or calendar",
        "Filter by category (social, academic, free food, sports)",
        "Set alerts for keywords (free food, study break, guest speaker)",
        "RSVP directly through the app",
        "Share events with friends"
      ],
      
      tips: [
        "Set free food alerts - never miss free pizza again",
        "Check the 'happening now' tab for last-minute events",
        "Submit events to help build the community"
      ]
    }
  },

  // ========================================================================
  // FINANCE
  // ========================================================================
  {
    id: "TheGhost",
    title: "The Ghost",
    category: "Money",
    icon: "👻",
    description: "Finds and cancels zombie subscription trials instantly.",
    tagline: "Find and cancel zombie subscription trials",
    
    guide: {
      overview: "TheGhost automatically detects subscription trials that are about to auto-renew and forgotten recurring charges. It monitors your bank/card transactions, identifies subscription patterns, and helps you cancel unwanted services before they charge you again.",
      
      howToUse: [
        "Connect your bank account or credit card securely (read-only access)",
        "TheGhost scans your transaction history for subscription patterns",
        "Review detected subscriptions - active, upcoming renewals, and forgotten charges",
        "Click 'Cancel' on any unwanted subscription",
        "TheGhost handles the cancellation process automatically"
      ],
      
      example: {
        scenario: "Mike signed up for a 7-day free trial of a meditation app 6 days ago and forgot about it. The trial auto-renews tomorrow at $89.99/year.",
        action: "TheGhost detects the upcoming charge, sends Mike an alert, and shows the subscription with a red 'RENEWS TOMORROW' badge.",
        result: "Mike clicks 'Cancel Subscription'. TheGhost automatically navigates the cancellation flow and confirms the trial is canceled. Mike saves $89.99."
      },
      
      tips: [
        "Connect all cards you use for online purchases to catch everything",
        "Check TheGhost weekly - new trials appear constantly",
        "Set trial reminders 2 days before renewal to have time to decide",
        "Use the 'Maybe Keep' list for subscriptions you want to evaluate",
        "Annual subscriptions save money BUT only if you'll use them all year"
      ],
      
      pitfalls: [
        "Don't ignore 'upcoming renewal' alerts - they're time-sensitive",
        "Don't cancel subscriptions you actually use regularly",
        "Remember: 'Free trial' often means 'starts charging soon'"
      ]
    }
  },
  
  {
    id: "FairShare",
    title: "FairShare",
    category: "Money",
    icon: "🍕",
    description: "Scan receipts to split bills item-by-item with tax and tip included.",
    tagline: "Split bills item-by-item with tax and tip",
    
    guide: {
      overview: "FairShare uses AI to read restaurant receipts and split bills fairly by item. No more 'split evenly' where you overpay because someone ordered the expensive steak and three cocktails. Tax and tip are proportionally distributed based on what each person actually ordered.",
      
      howToUse: [
        "Take a photo of the receipt after your meal",
        "FairShare OCR reads all items, prices, tax, and tip automatically",
        "Assign each item to the person who ordered it (tap item, select person)",
        "Review the split - each person sees their subtotal, tax share, and tip share",
        "Send payment requests via Venmo/CashApp or show them their amount"
      ],
      
      example: {
        scenario: "Four friends go to dinner. Sarah gets a $12 salad. Tom orders a $38 steak and $15 in drinks. Lisa and Mike each get $18 entrees. Bill total: $128 before tax/tip.",
        action: "Sarah takes a receipt photo. FairShare reads it. She assigns items: Sarah→salad, Tom→steak+drinks, Lisa→entree, Mike→entree. Tax is $11.52, tip is $25.60.",
        result: "FairShare calculates: Sarah pays $16.24, Tom pays $70.62, Lisa pays $24.16, Mike pays $24.16. Sarah saves $15.76 vs. splitting evenly ($32/person). Tom pays his fair share."
      },
      
      tips: [
        "Assign shared appetizers to 'Everyone' and FairShare divides them equally",
        "For couples sharing meals, assign items to one person then manually split 50/50",
        "Take the photo before the receipt gets crumpled or stained",
        "Review the OCR - sometimes it misreads prices, you can edit them",
        "Use the 'Favorite Groups' feature for regular friend groups"
      ],
      
      pitfalls: [
        "Don't forget to assign ALL items before finalizing - unassigned items default to split evenly",
        "Don't split evenly 'to be nice' if you ordered way less - that's why FairShare exists",
        "Make sure everyone agrees on tip percentage BEFORE splitting"
      ],
      
      quickReference: {
        "Photo clarity": "Good lighting, flat receipt",
        "Edit mode": "Tap any price to manually correct",
        "Tax/tip": "Auto-distributed proportionally",
        "Venmo": "One-tap to send requests"
      }
    }
  },
  
  {
    id: "TheGig",
    title: "The Gig",
    category: "Money",
    icon: "💼",
    description: "Aggregates one-off cash jobs that pay today.",
    tagline: "One-off cash jobs that pay today",
    
    guide: {
      overview: "TheGig aggregates quick-pay gig opportunities from multiple platforms (TaskRabbit, Handy, Instawork, etc.) into one feed. AI ranks them by hourly rate, distance, and your skill match. Focus on gigs that pay same-day or next-day rather than waiting weeks for payment.",
      
      howToUse: [
        "Set your location and available hours",
        "Select your skills (moving, cleaning, handyman, delivery, etc.)",
        "Set your minimum acceptable hourly rate",
        "Review the ranked feed - highest value opportunities at top",
        "Claim gigs directly through the app",
        "Complete the work and get paid same/next day"
      ],
      
      example: {
        scenario: "Jordan needs $200 by tomorrow for rent. He has 6 hours free today. He's good at moving and handyman work.",
        action: "Jordan opens TheGig, sets location, selects 'Moving' and 'Handyman' skills, sets minimum $30/hr. The AI shows: (1) Moving job: $45/hr, 3hrs, 2 miles away, pays today. (2) Furniture assembly: $35/hr, 2hrs, 5 miles, pays tomorrow.",
        result: "Jordan claims the moving job (earns $135 in 3hrs). He still needs $65, so he claims a 2hr cleaning gig at $35/hr (earns $70). Total: $205 in 5 hours, paid same day. Rent covered."
      },
      
      tips: [
        "Early morning (6-8am) is when new gigs drop - check then first",
        "Set alerts for high-paying gigs in your area",
        "Your rating affects which gigs you can access - be professional",
        "Bundle gigs in the same neighborhood to save travel time",
        "Cash tip gigs (moving, cleaning) often pay more than posted rate"
      ],
      
      pitfalls: [
        "Don't claim gigs you can't complete on time - damages your rating",
        "Don't accept gigs below your minimum - devalues your time",
        "Avoid gigs with vague descriptions - often more work than advertised"
      ]
    }
  },
  // ========================================================================
  // HEALTH
  // ========================================================================
  {
    id: "SleepDebt",
    title: "SleepDebt",
    category: "Health",
    icon: "😴",
    description: "Calculates exactly how and when to nap to recover from an all-nighter.",
    tagline: "Calculate exactly how and when to recover lost sleep",
    
    guide: {
      overview: "SleepDebt tracks your sleep deficit and calculates optimal nap times and durations to recover without ruining your sleep schedule. Based on circadian rhythm science and sleep cycle research.",
      
      howToUse: [
        "Enter how much you slept (or didn't) last night",
        "SleepDebt calculates your deficit",
        "See recommended nap times (when) and durations (how long)",
        "Set alarms for suggested naps",
        "Track recovery over multiple days"
      ],
      
      example: "All-nighter for exam. Slept 0 hours. SleepDebt recommends: (1) 20-min power nap at 2pm. (2) 90-min nap at 5pm (full sleep cycle). (3) Normal bedtime at 10pm. You'll be recovered by tomorrow morning.",
      
      tips: [
        "Never nap after 6pm or you'll mess up tonight's sleep",
        "20-min naps prevent grogginess, 90-min naps complete a full cycle",
        "Can't fully recover in one day - debt accumulates"
      ]
    }
  },
  {
    id: "DrinkWater",
    title: "DrinkWater",
    category: "Health",
    icon: "💧",
    description: "Browser tab that makes pouring sounds to remind you to hydrate.",
    tagline: "Gentle hydration reminders throughout your day",
    
    guide: {
      overview: "DrinkWater is a simple browser tab that plays water pouring sounds every hour to remind you to drink water. Surprisingly effective at building the hydration habit.",
      
      howToUse: [
        "Keep DrinkWater tab open while working",
        "Every hour, hear water pouring sound",
        "Drink a glass of water",
        "Click 'Done' to reset timer",
        "Track daily water intake"
      ],
      
      tips: [
        "Keep water bottle at desk so you actually drink when reminded",
        "Aim for 8 glasses (64oz) per day",
        "More if you exercise or drink coffee"
      ]
    }
  },
  {
    id: "SymptomSolver",
    title: "SymptomSolver",
    category: "Health",
    icon: "🩺",
    description: "Filters WebMD panic to tell you if you actually need the ER.",
    tagline: "Filter WebMD panic — do you actually need the ER?",
    
    guide: {
      overview: "SymptomSolver takes your symptoms and gives you straight answers: (1) Go to ER now, (2) See doctor this week, (3) Self-care at home. Cuts through the WebMD 'you're dying' panic.",
      
      howToUse: [
        "Enter your symptoms",
        "Answer follow-up questions (severity, duration)",
        "Get clear recommendation: ER, Doctor, or Home care",
        "See specific actions to take",
        "Track symptoms over time if doing home care"
      ],
      
      example: "Headache + fever + stiff neck = 'Go to ER now - possible meningitis'. Headache + tired + stress = 'Self-care: rest, hydrate, OTC pain relief'.",
      
      tips: [
        "Always err on side of caution - if it says ER, go",
        "Track symptom progression to show doctor later",
        "Not a replacement for actual medical advice"
      ],
      
      pitfalls: [
        "If you're having a medical emergency, call 911 - don't use an app",
        "App can't examine you - doctor visit when recommended",
        "Don't ignore worsening symptoms"
      ]
    }
  }
];
export const getToolById = (id) => {
  return tools.find(tool => tool.id === id);
};
