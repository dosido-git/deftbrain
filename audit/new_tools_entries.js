// ─── ADD THESE 7 ENTRIES TO tools.js before the closing ]; ───────────────────
// Insert after the last existing tool entry (after SubscriptionGuiltTrip's closing },)

{
  modified: "2026-05-17",
  id: "ScamRadar",
  title: "Scam Radar",
  categories: ["Loot", "Discourse"],
  icon: "🚨",
  description: "Analyzes suspicious messages, emails, calls, and invoices for scam indicators. Rates risk level, explains red flags, and gives exact scripts to verify legitimacy or cut off contact safely.",
  tagline: "Spot scams before they spot you.",
  headerColor: "#1e3020",
  guide: {
    overview: "Scammers rely on urgency, fear, and unfamiliarity. ScamRadar dissects the specific techniques being used against you, rates the risk, and gives you exact phrases to verify or disengage — without tipping off a real scammer or embarrassing yourself if it turns out to be legitimate.",
    howToUse: [
      "Choose the message type (email, SMS, phone, invoice, etc.)",
      "Paste the suspicious message or describe the situation",
      "Get a SCAM / SUSPICIOUS / LIKELY SAFE verdict with confidence rating",
      "See the specific red flags or green flags detected",
      "Use the provided verification script or disengagement phrase"
    ],
    example: {
      scenario: "Received an email claiming your Amazon account is suspended and you must click a link to restore it within 24 hours.",
      action: "Paste the email text, select Email as message type.",
      result: "Verdict: SCAM (high confidence). Red flags: artificial urgency ('24 hours'), generic greeting, link domain doesn't match amazon.com, grammar inconsistencies. What to do: Do not click the link. Go directly to amazon.com in a new browser tab to check your account status. Disengagement: Delete the email."
    },
    tips: [
      "Include the full message — subject lines, signatures, and URLs often contain the clearest red flags",
      "For phone scams, describe exactly what the caller said and what they asked for",
      "If something feels off, it probably is — the tool validates your instinct with specifics"
    ],
    pitfalls: [
      "Don't dismiss 'Likely Safe' results if something still feels wrong — trust your gut and verify directly",
      "Real companies will never be offended if you hang up and call their official number to verify"
    ]
  }
},
{
  modified: "2026-05-17",
  id: "ContractDecoder",
  title: "Contract Decoder",
  categories: ["The Grind", "Loot"],
  icon: "📜",
  description: "Translates dense contract language into plain English. Flags high-risk clauses, identifies missing standard protections, and explains your obligations and rights in each section — before you sign.",
  tagline: "Read every line without a law degree.",
  headerColor: "#1e2a3a",
  guide: {
    overview: "Most people sign contracts they don't fully understand. Contract Decoder reads the legalese, flags what's risky or unusual, and explains what you're actually agreeing to — focusing on the clauses that could matter most if things go wrong.",
    howToUse: [
      "Select the contract type (employment, freelance, lease, SaaS terms, etc.)",
      "Paste the contract text or the specific clauses you want decoded",
      "Get a plain-English breakdown of each section",
      "See risk-flagged clauses highlighted with explanations",
      "Review what standard protections are missing"
    ],
    example: {
      scenario: "Freelance contract includes 'Client retains all intellectual property created during the engagement, including works created outside of project scope.'",
      action: "Paste the clause, select Freelance / NDA as contract type.",
      result: "🚨 HIGH RISK — This clause claims ownership of any creative work you produce during the contract period, even personal projects unrelated to the client. Standard freelance contracts limit IP transfer to deliverables only. Request revision: 'IP assignment limited to deliverables specified in this agreement.'"
    },
    tips: [
      "Focus on termination, IP, non-compete, and liability clauses — these cause the most disputes",
      "Paste specific clauses you're uncertain about for targeted explanations",
      "Use the suggested alternative language when negotiating revisions"
    ],
    pitfalls: [
      "This is educational analysis, not legal advice — consult a lawyer for high-stakes contracts",
      "Don't skip the fine print in renewal and auto-billing clauses"
    ]
  }
},
{
  modified: "2026-05-17",
  id: "CultureBriefing",
  title: "Culture Briefing",
  categories: ["Out & About", "The Grind"],
  icon: "🌍",
  description: "Generates a tailored cultural intelligence briefing for any country and visit purpose. Covers greetings, taboos, business etiquette, dining customs, dress norms, and what not to say — before you land.",
  tagline: "Arrive informed. Leave respected.",
  headerColor: "#567a3a",
  guide: {
    overview: "Cultural missteps aren't just awkward — they can derail business deals, offend hosts, or create safety issues. Culture Briefing gives you a focused, purpose-specific guide: business travelers get negotiation norms, tourists get local customs, expats get what to expect long-term.",
    howToUse: [
      "Enter the country you're visiting",
      "Select your visit purpose (tourism, business, family, relocation, etc.)",
      "Choose which cultural areas to focus on",
      "Get a briefing tailored to your specific situation",
      "Export or copy for offline reference"
    ],
    example: {
      scenario: "First business trip to Japan, meeting with a potential partner company.",
      action: "Country: Japan, Purpose: Business, Focus: Greetings, Business etiquette, Dining.",
      result: "Business card exchange (meishi) is ceremonial — receive with both hands, study it briefly, never write on it or put it in your back pocket. Bowing: slight bow to acknowledge, deeper for senior contacts. Direct 'no' is rare — 'that might be difficult' means no. Decision-making is consensus-based (nemawashi) — don't pressure for immediate answers. Dining: wait to be seated, don't pour your own drink, it's polite to try everything."
    },
    tips: [
      "Include your specific situation in the context field for more targeted advice",
      "Business briefings are different from tourism briefings — select the right purpose",
      "The 'what not to say' section is often the most valuable"
    ],
    pitfalls: [
      "Cultural norms vary by region within a country — mention your specific destination if known",
      "Generational differences matter — urban Japan behaves differently from rural Japan"
    ]
  }
},
{
  modified: "2026-05-17",
  id: "SleepArchitect",
  title: "Sleep Architect",
  categories: ["Body", "Energy"],
  icon: "🌙",
  description: "Builds a personalized sleep improvement plan based on your current patterns, goals, and lifestyle. Provides a phased action schedule with science-backed techniques for falling asleep faster, staying asleep, and waking rested.",
  tagline: "Engineer the sleep you've been missing.",
  headerColor: "#2a3820",
  guide: {
    overview: "Poor sleep compounds every other problem. Sleep Architect analyzes your specific situation — schedule, habits, barriers — and builds a concrete plan with immediate actions, week-one habits, and ongoing practices. No generic advice; everything is calibrated to your inputs.",
    howToUse: [
      "Select your primary sleep goal",
      "Describe your current sleep schedule and patterns",
      "Note your biggest sleep disruptors",
      "Get a phased improvement plan: tonight, this week, ongoing",
      "Track progress and iterate"
    ],
    example: {
      scenario: "Takes 90 minutes to fall asleep, wakes at 3am, feels groggy despite 7 hours in bed.",
      action: "Goal: Fall asleep faster + Stay asleep. Describe current patterns and disruptors (phone in bed, late caffeine, racing thoughts).",
      result: "Tonight: Stop caffeine by 2pm, dim screens 90 min before bed, try the 4-7-8 breathing technique when lying down. This week: Establish consistent wake time (even weekends), add 10-min wind-down routine, move phone charger outside bedroom. Ongoing: Cognitive shuffling technique for racing thoughts, sleep restriction protocol if insomnia persists."
    },
    tips: [
      "Be honest about your current habits — the plan only works if it's based on reality",
      "Consistent wake time is often more powerful than consistent bedtime",
      "Small environmental changes (temperature, darkness, sound) have outsized impact"
    ],
    pitfalls: [
      "Don't try to implement everything at once — the phased plan is ordered intentionally",
      "Sleep restriction (temporarily reducing time in bed) feels counterintuitive but is highly effective"
    ]
  }
},
{
  modified: "2026-05-17",
  id: "IdeaAutopsy",
  title: "Idea Autopsy",
  categories: ["Go Deep!", "The Grind"],
  icon: "🔬",
  description: "Stress-tests ideas, projects, and business concepts by systematically identifying what could kill them. Surfaces critical risks, missing assumptions, and weak points — before you invest time and money.",
  tagline: "Find the fatal flaw before it finds you.",
  headerColor: "#1e2a3a",
  guide: {
    overview: "Most ideas fail for predictable reasons that were visible from the start. Idea Autopsy applies structured adversarial thinking — market, execution, financial, competitive, and timing risks — to expose what's likely to go wrong and what you'd need to believe for this to succeed.",
    howToUse: [
      "Describe your idea, project, or plan",
      "Select the stage (early idea, exploring, building, already launched)",
      "Get a structured risk analysis across multiple dimensions",
      "See the critical assumptions your idea depends on",
      "Review what would need to be true for this to work"
    ],
    example: {
      scenario: "Launching a subscription meal kit service for people with dietary restrictions.",
      action: "Describe the concept at 'Early exploration' stage.",
      result: "Critical risks: Unit economics — meal kits have thin margins and high churn; most large players are unprofitable. Differentiation — 'dietary restrictions' is broad; without specific focus (e.g., AIP diet only) you'll compete with established players. Customer acquisition cost is typically $90-150 in this category. Key assumption: People with restrictions will pay a premium vs. cooking themselves. Pre-mortem: Most likely failure mode is running out of runway before achieving unit economics."
    },
    tips: [
      "Be specific about your idea — vague descriptions get vague analysis",
      "The 'what would need to be true' section is where the real insight lives",
      "Use this before pitching investors or committing significant resources"
    ],
    pitfalls: [
      "Don't dismiss critical risks as 'we'll figure it out' — they're worth taking seriously",
      "A bad autopsy result isn't a reason to quit; it's a map of what to solve first"
    ]
  }
},
{
  modified: "2026-05-17",
  id: "MentalHealthNavigator",
  title: "Mental Health Navigator",
  categories: ["Me", "Humans"],
  icon: "🧭",
  description: "Helps you understand what you're experiencing and find the right type of support — therapy styles, self-help approaches, crisis resources, and questions to ask a provider. A starting point, not a diagnosis.",
  tagline: "Find your way to the right support.",
  headerColor: "#7a2e2e",
  guide: {
    overview: "Knowing you need support is just the first step — figuring out what kind is harder. Mental Health Navigator maps your situation to relevant approaches (CBT, DBT, somatic, peer support, crisis lines) and helps you understand enough to have an informed conversation with a provider.",
    howToUse: [
      "Select the area you're struggling with",
      "Describe what you're experiencing (as much or as little as you want)",
      "Get an overview of relevant approaches and what they address",
      "See what types of professionals specialize in this area",
      "Get questions to ask when searching for a provider"
    ],
    example: {
      scenario: "Experiencing persistent anxiety that's affecting work and relationships.",
      action: "Select Anxiety / worry, describe the pattern.",
      result: "Approaches known to help: CBT (most evidence-based for anxiety — identifies thought patterns), exposure therapy (for specific fears or avoidance), somatic approaches (for anxiety stored in the body). Provider types: licensed therapist or psychologist specializing in anxiety disorders, psychiatrist if medication evaluation is needed. Questions to ask: 'Do you use CBT or ACT for anxiety?' 'What does a typical treatment trajectory look like?' Crisis resource: 988 Suicide & Crisis Lifeline (also for anxiety crises)."
    },
    tips: [
      "This is a starting point — a real provider will assess your situation much more thoroughly",
      "It's okay not to know what you're experiencing; describe what's happening and let the tool help identify it",
      "Different approaches work for different people — finding the right fit may take time"
    ],
    pitfalls: [
      "This is not a diagnostic tool and cannot replace professional assessment",
      "If you're in crisis, please use the crisis resources provided — don't wait"
    ]
  }
},
{
  modified: "2026-05-17",
  id: "GriefGuide",
  title: "Grief Guide",
  categories: ["Me", "Humans"],
  icon: "💙",
  description: "Compassionate, practical guidance for navigating grief — your own or someone else's. Covers what to expect emotionally and practically, what helps, what doesn't, and how to support someone without saying the wrong thing.",
  tagline: "Navigate loss with clarity and care.",
  headerColor: "#4a1e1e",
  guide: {
    overview: "Grief is profoundly individual but has recognizable patterns. Grief Guide provides honest, non-prescriptive guidance on what to expect, how long different phases last, what actually helps, and — for supporters — exactly what to say and not say. It doesn't rush the process or minimize the loss.",
    howToUse: [
      "Choose whether you're grieving, supporting someone, or both",
      "Describe the type of loss and your current situation",
      "Get guidance tailored to where you are in the process",
      "See practical next steps and what to expect",
      "Access resources if you need additional support"
    ],
    example: {
      scenario: "A close friend's parent just died and you don't know what to say or do.",
      action: "Select 'Helping someone grieve', describe the relationship and loss type.",
      result: "What to say: 'I'm so sorry. I loved [parent's name]. I'm here.' What not to say: 'Everything happens for a reason', 'They're in a better place', 'At least they lived a long life.' What helps right now: Show up physically if possible. Bring food without asking. Offer specific help ('I'm going to the grocery store — what do you need?'). What helps in weeks 2-6: Most support drops off after the funeral — that's often when grief peaks. Keep checking in. Remember the loss date. Use the person's name."
    },
    tips: [
      "Grief doesn't follow a timeline — avoid any language that implies it should be 'over by now'",
      "Practical help (meals, errands) is often more useful than emotional processing in the early days",
      "The goal isn't to fix the grief — it's to not be alone in it"
    ],
    pitfalls: [
      "Don't compare losses or suggest 'at least' framings — they invalidate the specific pain",
      "If grief seems to be blocking all functioning for an extended period, professional support may help"
    ]
  }
},
