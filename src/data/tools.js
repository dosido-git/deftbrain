// src/data/tools.js

/**
 * TOOLS DATABASE
 *
 * Each tool: id, title, tagline, description, tags, categories, icon, primer
 * (In a Nutshell: when / give / get / edge), seo*, faq, and guide:
 *   guide.tips        — the "Good to Know" list
 *   guide.beforeYouGo — optional; the one caveat to read before acting
 * Only fields the page shows belong here (2026-10-08: overview, howToUse,
 * example and pitfalls removed — the page stopped showing them on 2026-08-09).
 */
export const tools = [
{
  id: "MentalHealthNavigator",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You know you need help but not what kind, or who to call first.",
    give: "What's been on your mind, your situation in your own words, and anything you have already tried. Two minutes.",
    get: "Which kind of professional actually fits — therapist, psychiatrist, GP, coach, group — what each one does differently, and how to get in the door.",
    edge: "It answers the question that comes before therapy: who to call. Most mental-health tools assume you already know.",
  },
  seoDescription: "Describe what you're going through and get free, instant guidance on the right type of mental health support, what it costs, and how to reach out.",
  seoTitle: "Find a Therapist",
  title: "Mental Health Navigator",
  tagline: "Find the right support for what you're going through",
  tags: ['mental health', 'therapy', 'therapist', 'counseling', 'psychiatrist', 'anxiety', 'depression', 'stress', 'support', 'help', 'burnout', 'grief', 'trauma', 'wellbeing', 'professional help', 'finding a therapist', 'mental health resources'],
  icon: "🧭",
  categories: ['Health & Wellness'],
  headerColor: "#c0d8e8",
  description: "Describe what you're going through and get clear guidance on what type of support fits your situation, how to find it, what it costs, what to say when you reach out, and what you can do in the next 48 hours.",
  exampleOutput: {
    title: "See what Mental Health Navigator gives you",
    expandLabel: "See the full real example results ↓",
    nextStepLabel: "What happens with your situation",
    intro: "This is the complete, real output from an actual Mental Health Navigator run on the sample situation below — nothing here is invented or shortened.",
    sampleLabel: "Sample situation",
    sampleText: "I've been having really bad anxiety for the past 6 months, mostly around work. I can't sleep, I overthink everything, and I've started avoiding situations that make me nervous. I'm not sure if I need a therapist or a doctor. I tried talking to my GP once but they just told me to exercise more. (Tagged: Anxiety / worry, Work / career, Sleep problems)",
    context: "Real run, 2026-09-23 — the tool's own built-in example scenario.",
    sections: [
      {
        label: "What we heard",
        tone: "green",
        text: "It sounds like the past six months have been genuinely exhausting — the worry, the sleepless nights, the sense that you're constantly bracing for the next thing, and then the frustration of not feeling heard when you did reach out for help. What you're carrying is real, and wanting to figure out the right kind of support takes courage.",
      },
      {
        label: "Recommended support",
        tone: "neutral",
        items: [
          "Licensed therapist, CBT or ACT-focused (best fit) — structured talk therapies like CBT or ACT are designed to work with persistent worry, broken sleep, and avoidance. Expect weekly or biweekly 50-minute sessions working through patterns in thinking and behavior. Find one: Psychology Today's therapist finder (psychologytoday.com/us/therapists) — filter by zip code, then Insurance/Fees, and add Anxiety and Workplace Stress as issues; most profiles let you message directly. Other options: Alma or Headway, which verify insurance coverage upfront. Cost: with insurance, a $20–$50 copay per session is common; without insurance, many therapists offer sliding scale starting around $50–$80.",
          "Employee Assistance Programme, EAP (lowest cost) — since the anxiety is tied closely to work, the employer may already pay for short-term counseling at no cost. Expect 3–8 free sessions with a licensed counselor via a confidential hotline, separate from HR. Find one: check the employee benefits portal or email HR and ask whether the benefits package includes an EAP and what number to call. Cost: typically free, employer-funded.",
          "Psychiatrist or psychiatric nurse practitioner — if therapy alone doesn't feel like enough after a few months, or sleep deteriorates further, a psychiatrist can evaluate whether medication might help alongside therapy. Expect an initial 45–60 minute evaluation, then shorter follow-ups if medication is part of the plan. Find one: ZocDoc (zocdoc.com) lets you filter by psychiatrist, insurance, and availability, often showing real open slots. Cost: covered by most insurance plans; telehealth can reduce cost and wait time.",
        ],
      },
      {
        label: "What to say when reaching out",
        tone: "neutral",
        items: [
          "Hi, I've been dealing with anxiety and sleep problems for about six months, mostly connected to work stress, and I'm looking for someone who can help me work through it.",
          "I've tried my GP but didn't feel like it got to the root of things — I'm hoping to find a therapist or counselor who works with anxiety and avoidance.",
          "I'm not sure exactly what I need yet, but I wanted to reach out and ask whether you work with people dealing with work-related anxiety and sleep difficulties.",
        ],
      },
      {
        label: "Addressing your barriers",
        tone: "yellow",
        text: "For cost: start by asking HR about an EAP — it's the most overlooked free resource, and your employer likely already offers it. If not, search Psychology Today with the Sliding Scale filter on, and mention cost directly when you contact a therapist. For not knowing where to start: you only need to take one step — open psychologytoday.com/us/therapists, put in your zip code, and send one message to one person whose profile sounds right.",
      },
      {
        label: "Immediate steps",
        tone: "green",
        items: [
          "Today: call or email HR, or log into your benefits portal, and ask one question — does the company have an EAP and what is the number?",
          "Today or tomorrow: go to psychologytoday.com/us/therapists, filter by your location and anxiety, and send a short message to one therapist whose profile feels right.",
          "In the next 48 hours: if you want insurance verified upfront before booking, go to headway.co or helloalma.com and enter your insurance details — both show confirmed in-network therapists with real availability.",
          "Tonight: try Sleep Architect — not as a replacement for support, but because getting even a little more sleep will make every other step easier.",
        ],
      },
    ],
    nextStep: "With your own situation, Mental Health Navigator maps what you're going through to the kinds of support most likely to fit, gives you real ways to find and contact them, exact words to use when reaching out, and immediate next steps you can take today.",
    disclaimer: "This is a real, complete tool run against a realistic sample situation. This tool does not diagnose or treat anything. If things feel overwhelming or unsafe right now, please reach out — US/Canada: call or text 988. UK/Ireland: Samaritans 116 123. Or your local emergency number."
  },

  guide: {
    tips: [
      "You don't need to have it figured out before using this — 'general / not sure' is a valid starting point",
      "The 'What to say' section removes the most common blocker: not knowing how to start the conversation when calling a professional",
      "If cost is a barrier, always mention it — sliding scale fees, community mental health centers, and low-cost options exist in most countries",
      "This tool is for navigation, not diagnosis — it helps you find the right door, not tell you what's on the other side",
      "If you're in crisis right now, please reach out to a crisis line directly rather than using this tool",
      "Works across all 12 DeftBrain languages",
    ],

  },
},
{
  id: "GriefGuide",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Someone died, or someone you love is grieving and you don't know what to say.",
    give: "Who it's for, what kind of loss, and roughly when it happened.",
    get: "What you said, reflected back — plus a few things that may help and one gentle next step.",
    edge: "It works in both directions — for the person grieving and for the person trying to help without making it worse.",
  },
  seoDescription: "Free, careful guidance for a loss — whether you're grieving or supporting someone. It stays close to what you tell it: what may help, words if you need them, one next step.",
  seoTitle: "Grief Support: Coping With Loss",
  title: "GriefGuide",
  tagline: "Compassionate guidance for navigating loss — yours or someone else's",
  tags: [
    'grief', 'grief support', 'loss', 'death', 'bereavement', 'mourning', 'grieving',
    'coping with loss', 'death of loved one', 'pet loss', 'support someone grieving',
    'how to help someone grieve', 'what to say after a death', 'condolence', 'sympathy',
  ],
  icon: "💙",
  categories: ['Health & Wellness', 'Self & Reflection'],
  headerColor: "#c0cce0",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what GriefGuide gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the situation below — the full result, nothing reworded.",
    sampleLabel: "The situation",
    sampleText: "My coworker’s husband died last week. I want to support her, but I am afraid of saying something wrong. We are not close friends, and I do not want to intrude or make her manage my discomfort.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples (supporting someone else).",
    sections: [
      {
        label: "What you described",
        tone: "neutral",
        text: "You want to acknowledge what your coworker is going through without overstepping a relationship that is collegial rather than close. The concern you named — that she might end up managing your discomfort rather than receiving support — is a real and specific one worth keeping in mind.",
      },
      {
        label: "Worth knowing",
        tone: "neutral",
        items: [
          "A brief, low-demand acknowledgment from a coworker can carry its own kind of weight without requiring closeness. It does not need to be deep to be meaningful.",
          "Vague offers ('let me know if you need anything') put the work of asking on the person who is grieving. Something specific and optional is easier to say yes or no to.",
        ],
      },
      {
        label: "Ways to help",
        tone: "green",
        items: [
          "Say something brief and direct. A short message or a quiet word that acknowledges her loss — without a question attached — lets her receive it without having to respond. It does the job without opening a conversation she may not have energy for.",
          "Offer something specific, not open-ended. If you want to do something concrete, name it: 'I'm going to the coffee cart — can I bring you something?' or leaving something at her desk. A specific, small gesture requires nothing back from her.",
          "Follow her lead at work. Some people find routine a relief; others find it hard. Let her set the pace for when and how she re-engages. Treating her normally when she signals she wants that, and not pressing when she doesn't, respects whatever she's navigating.",
        ],
      },
      {
        label: "Words you could use",
        tone: "green",
        items: [
          "I was so sorry to hear about your husband.",
          "I've been thinking of you this week.",
          "There's no need to catch up on anything — just let me know whenever you're ready.",
        ],
      },
      {
        label: "Best avoided",
        tone: "yellow",
        items: [
          "'He's in a better place' or 'everything happens for a reason' — These redirect from her loss toward a framework she may not share and may not find comforting.",
          "'I can't imagine what you're going through' — It centers your reaction rather than acknowledging hers, and she may feel she now needs to reassure you.",
        ],
      },
      {
        label: "One next step",
        tone: "green",
        text: "Send or say one short sentence — something along the lines of 'I was so sorry to hear about your husband' — with no question after it.",
      },
    ],
    disclaimer: "GriefGuide offers guidance, not therapy. If you or someone else is in danger, contact local emergency services; in the US you can also call or text 988.",
  },
  faq: [
    { q: "What should I say to a coworker whose family member died?",
      a: "Keep it short and don't ask for a reply: 'I was so sorry to hear about your husband' or 'I've been thinking of you this week.' If you want to help, offer something specific and small, like bringing a coffee, rather than 'let me know if you need anything.'" },
    { q: "What should you not say to someone who is grieving?",
      a: "Avoid explanations of the loss ('everything happens for a reason', 'they're in a better place') and lines that make them reassure you ('I can't imagine what you're going through'). Short and sincere beats clever." },
    { q: "Is there a right way to grieve?",
      a: "No. Grief doesn't follow fixed stages or a timetable, and it can come and go for months or years. GriefGuide responds to what you describe rather than to a model of how grief should go." },
    { q: "What if I'm struggling to cope?",
      a: "If the loss is affecting your daily life for a long time, a grief counselor, your doctor or a support group can help. If you are thinking of harming yourself, contact emergency services now; in the US, call or text 988." },
  ],
  description: "Guidance for a loss — whether you're grieving yourself, supporting someone who is, or both. It stays close to what you tell it: what it heard, a few things that may help, words if you need them, and one gentle next step.",
  guide: {
    tips: [
      "You don't have to share everything — even minimal input gets useful guidance",
      "The 'Helping someone grieve' mode gives you phrases to use and phrases to avoid, built only from what you told it — it will not invent a memory to make a line sound personal",
      "Grief over non-death losses (relationships, jobs, health, identity) is just as real and often less validated — this tool treats all loss seriously",
      "More support is offered as an option, not as evidence that something is wrong with how you are grieving",
      "If you're in crisis right now, please reach out to a crisis line in your area directly",
    ],

  },
},
{
  id: "ConceptCoach",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Before you quit, incorporate, or spend real money.",
    give: "Your idea in detail — what it is, who it's for, how it makes money — and how far along you are.",
    get: "The specific ways it fails: market size, willingness to pay, cold start, moat. Ranked, with what would have to be true for it to work.",
    edge: "It assumes the idea dies and works out why. Feedback from friends tells you what's good; this tells you what kills it.",
  },
  seoDescription: "Stress-test your business idea before you spend a dime. Get a free, brutally honest viability score, ranked failure modes, and a 30-day validation plan.",
  seoTitle: "Business Idea Validator",
  title: "Concept Coach",
  tagline: "Stress-test your business idea before you invest time or money",
  tags: ["business idea", "startup idea", "idea validation", "business validation", "business model", "customer demand", "market demand", "weak assumptions", "business risk", "validation test", "founder", "entrepreneur", "side hustle", "competition", "business concept"],
  icon: "🔬",
  categories: ['Career', 'Decisions'],
  headerColor: "#d8c8b8",
  description: "Describe your business idea and Concept Coach will challenge it, surface weak assumptions, point out genuine strengths, and help you figure out what to test before you commit more time or money.",
  guide: {
    tips: [
      "The more specific your description, the better the autopsy — 'Airbnb for skills' is less useful than a detailed description of how the marketplace works and how you acquire both sides",
      "Add your founder context — a critical risk for one person may not apply to another with the right background or network",
      "Viability score is honest: most ideas are 3-6. A 4 means 'fixable with serious work' — that's actually useful information",
      "Kill questions are the most valuable output: these are the hypotheses that MUST be true for the idea to work. If you can't answer them, the idea might be dead",
      "Next steps prioritize validation over building — the goal is to find out if the idea works as cheaply as possible",
      "Run the autopsy again after you've done validation work — the score should improve as you answer kill questions",
    ],

  },
},
{
  id: "SleepArchitect",
  modified: "2026-09-11",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Your sleep is not working and generic advice has not helped you figure out what to change first.",
    give: "Your schedule, what sleep has actually been like, what may be disrupting it, and anything you've already tried.",
    get: "One practical sleep experiment, what to watch for, and what to try next if it doesn't help.",
    edge: "It changes one useful variable at a time instead of diagnosing you or handing you a giant sleep protocol.",
  },
  seoDescription: "Build a personalized sleep experiment from your actual schedule and disruptions. Try one practical change, track what happens, and decide what to test next. No diagnosis or sleep score.",
  seoTitle: "Sleep Improvement Plan",
  title: "Sleep Architect",
  tagline: "Better sleep, one useful experiment at a time.",
  tags: ['sleep', 'insomnia', 'bedtime', 'rest', 'tired', 'fatigue', 'wake up', 'energy', 'schedule', 'circadian', 'routine', 'stress', 'anxiety', 'night', 'sleep hygiene'],
  icon: "😴",
  categories: ['Health & Wellness'],
  headerColor: "#c8c0e8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Sleep Architect gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the sleep below — an excerpt of a longer result, nothing reworded.",
    sampleLabel: "The sleep",
    sampleText: "Bed at midnight, up at 7am, about 5 hours of actual sleep. Disruptors: screens, stress, caffeine. I lie in bed for at least an hour before falling asleep. My mind just races. I have coffee at 3pm most days. I scroll my phone in bed every night. Weekends I sleep until 10am which I think messes up my weekday schedule.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "What you described",
        tone: "neutral",
        text: "You report lying awake for roughly an hour most nights before sleep comes, with your mind racing during that time. Based on what you supplied, you are getting around 5 hours of sleep on weeknights despite a 7-hour window, and you note that weekend sleep until 10 AM may be affecting your weekday pattern. The variable most worth testing first is your phone use in bed, since you scroll every night and are trying to fall asleep at midnight — whether removing that habit shortens the time it takes your mind to settle is a question this experiment can help answer.",
      },
      {
        label: "Tonight",
        tone: "green",
        items: [
          "Tonight, stop scrolling and put your phone out of arm's reach before you get into bed — leave it across the room if that helps",
          "If your mind is busy when you lie down, try spending 5 minutes writing out whatever is on your mind before you get into bed — not a to-do list, just a brain dump on paper",
        ],
      },
      {
        label: "This week's experiment: Take your phone out of bed for one week",
        tone: "green",
        text: "You report scrolling your phone in bed every night and lying awake for at least an hour. Testing what happens when the phone is no longer part of the in-bed experience is a direct way to find out whether that habit is connected to how long it takes your mind to settle.",
      },
      {
        label: "Test next, one at a time",
        tone: "neutral",
        items: [
          "Afternoon caffeine timing",
          "Weekend wake time consistency",
        ],
      },
    ],
    disclaimer: "Sleep Architect suggests one experiment at a time; it does not diagnose sleep disorders. If you snore loudly, stop breathing in your sleep, or are sleepy enough to nod off while driving, see a doctor.",
  },
  faq: [
    { q: "Why can't I fall asleep even when I'm tired?",
      a: "Common reasons are a racing mind at bedtime, screens in bed, caffeine late in the day, and an irregular schedule, such as sleeping much later at weekends. Changing one thing at a time shows which one matters for you." },
    { q: "How late can I drink coffee and still sleep?",
      a: "Caffeine stays in the body for hours, so afternoon coffee can still affect sleep at night. Many sleep guides suggest stopping six or more hours before bed; testing a cut-off is the simplest way to find yours." },
    { q: "Does using my phone in bed affect sleep?",
      a: "It can: scrolling keeps your mind engaged and pushes bedtime later. Putting the phone out of reach and starting a short wind-down before bed is an easy experiment to see whether it makes a difference for you." },
    { q: "Why one change at a time?",
      a: "If you change five things at once and sleep improves, you won't know what worked or what you can drop. Sleep Architect gives you one experiment, then the next." },
  ],
  description: "Tell us what sleep has been like lately — your schedule, what gets in the way, and what you want to improve. Sleep Architect turns it into one practical experiment you can try and learn from.",
  guide: {
    tips: [
      "The freeform description is the strongest input — concrete observations are more useful than labels like 'bad sleeper'",
      "A selected disruptor means it may matter; the tool should not silently promote it into the cause of your sleep problem",
      "One experiment means one independent variable at a time, with other ideas held for later",
      "Target Schedule appears only when your own information supports a useful experimental baseline; it is never presented as a biologically ideal schedule",
      "Rotating shifts and near-total sleep loss get extra caution — the tool should not tell you to restrict sleep, hold a wake time despite severe sleep loss, or force a rapid schedule change",
      "Pain, breathing concerns, persistent severe sleep difficulty, or substantial daytime sleepiness may deserve professional evaluation rather than another home experiment",
    ],

  },
},
{
  id: "CultureBriefing",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You've booked the trip and you don't want to be the rude tourist.",
    give: "Destination, trip purpose, how long, and where you're from.",
    get: "What is widely observed, what tends to cause friction, what varies by region or setting, and what to check locally before you rely on it.",
    edge: "Specific and calibrated to where you are from, rather than 'respect local customs' — and it separates a strong convention from a practice that varies, instead of presenting a country as one thing.",
  },
  seoDescription: "A free travel etiquette briefing for any country — greetings, taboos, tipping, dining and dress — separating what is widely observed from what varies, and flagging what to check locally. Know before you go.",
  seoTitle: "Travel Etiquette by Country",
  title: "Culture Briefing",
  tagline: "Know before you go — cultural intelligence for any destination",
  tags: ['culture', 'travel', 'travel etiquette', 'cultural etiquette', 'local customs', 'customs', 'taboos', 'tipping', 'dress code', 'dining etiquette', 'business etiquette', 'greetings', 'gift etiquette', 'religion', 'manners', 'social norms', 'cultural norms', 'cultural differences', 'destination guide', 'country guide', 'family visit', 'moving abroad', 'expat', 'study abroad', 'remote work', 'travel safety', 'key phrases'],
  icon: "🌍",
  categories: ['Relationships', 'Travel & Events'],
  headerColor: "#b8d4e8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Culture Briefing gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the trip below — an excerpt of a longer briefing, nothing reworded.",
    sampleLabel: "The trip",
    sampleText: "Business trip to Osaka, Japan, for a week, from the United States. Vegetarian and don't drink alcohol; meeting a client's executive team.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "Overview",
        tone: "neutral",
        text: "Osaka is Japan's second-largest metropolitan area with a more informal business culture than Tokyo, though formality in first meetings remains higher than typical US practice. Business etiquette and hierarchy matter significantly; social settings are noticeably more relaxed. Vegetarian dining is feasible but requires advance planning, particularly for business meals. Alcohol is central to after-work socializing; as a non-drinker, you can decline.",
      },
      {
        label: "Business etiquette",
        tone: "green",
        items: [
          "The business card exchange (meishi koukan) is a formal ritual: present your card with both hands, read the card you receive carefully for a few seconds, place it in front of you on the table (never in a back pocket or written on), and thank the person. This applies in first meetings or formal introductions.",
          "Hierarchy and seniority are significant; allow senior figures to speak first, and address them by their title and family name unless explicitly invited otherwise.",
          "Direct disagreement in a group setting, particularly with a senior person, contrasts with stating reservations indirectly — phrasing concerns as 'that is one perspective' or 'there may be other considerations' is more typical in business meetings.",
        ],
      },
      {
        label: "For you specifically",
        tone: "green",
        items: [
          "Confirm vegetarian dining preferences with your client or restaurant contact at least a day before any business meal — day-of requests often cannot be fulfilled. Specify 'no fish, no fish stock, no meat broth' clearly, as some vegetarian dishes include dashi or fish-based ingredients.",
        ],
      },
      {
        label: "Higher-stakes missteps",
        tone: "yellow",
        items: [
          "Disagreeing with a client or senior figure directly in front of others — raising concerns privately afterward is the more typical approach in this context.",
          "Handling a business card casually — putting it in a back pocket, writing on it, or not examining it — departs from the standard of receiving with both hands and studying it briefly.",
        ],
      },
      {
        label: "Tipping and payment",
        tone: "neutral",
        items: [
          "No tipping in Japan — not in restaurants, taxis, hotels, or any service context. Leaving cash on the table or offering it directly can be awkward or even refused.",
          "Paying the bill: in a business context, the person who invited or has higher rank typically pays. Accept graciously if someone pays for you.",
        ],
      },
    ],
    disclaimer: "Customs vary by person, company and region. Culture Briefing describes what is widely observed and says what varies; your host is the best guide to their own expectations.",
  },
  faq: [
    { q: "What should I know about business etiquette in Japan?",
      a: "First meetings are more formal than in the US: a slight bow, family names with -san, and a careful business-card exchange — offered and received with both hands, read briefly, and kept on the table in front of you. Senior people usually speak first, and disagreement is normally raised privately or indirectly rather than in front of the group." },
    { q: "Do you tip in Japan?",
      a: "No. Tipping is not customary in restaurants, taxis or hotels, and leaving cash can cause awkwardness. Good service is included in the price." },
    { q: "How do I eat vegetarian in Japan?",
      a: "Plan ahead. Many dishes that look vegetarian use dashi, a fish-based stock, so ask specifically for no fish, no fish stock and no meat broth, and tell your host or the restaurant in advance of a business meal." },
    { q: "Can Culture Briefing cover anywhere?",
      a: "Yes — any country or region, for business, family, study or travel. Add your home country and anything about your situation, such as dietary needs or who you will meet, and the briefing focuses on what matters for you." },
  ],
  description: "A practical cultural briefing before you travel — greetings, taboos, dining, dress, tipping, business etiquette, religion and safety. It separates the practices that are widely observed from the ones that vary by region, generation or setting, and flags what is worth checking locally rather than taking on trust. Tailored to your trip purpose.",
  guide: {
    tips: [
      "Add your home country — the AI tailors the advice to highlight differences that specifically trip up travelers from your background",
      "Business travelers: select 'Business' to get card exchange etiquette, hierarchy norms, meeting behavior, and negotiation style",
      "Religion section appears automatically for destinations where it's culturally central — pay attention to it even if you're not religious",
      "Key phrases go beyond 'hello' and 'thank you' — they're chosen for genuine utility and positive impression",
      "Insider tips are the real value: things most travelers discover the hard way after an embarrassing moment",
      "Works across all 12 DeftBrain languages — get your briefing in your native language",
    ],

  },
},
{
  id: "ContractDecoder",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Before you sign or renew a contract and want to understand what it actually says.",
    give: "Paste the contract or upload the file. Optionally add the governing location and anything about your situation that matters.",
    get: "A plain-English overview, important terms, questions to clarify, and practical things to check before you sign.",
    edge: "It stays anchored to the document — quoting the language it is explaining and separating what the contract says from what still needs to be verified.",
  },
  seoDescription: "Paste or upload a contract and get a plain-English breakdown of important terms, questions to clarify, and possible points to negotiate before you sign.",
  seoTitle: "Plain-English Contract Review",
  title: "Contract Decoder",
  tagline: "Understand what you're agreeing to before you sign.",
  tags: ['contract', 'agreement', 'contract review', 'contract terms', 'contract clause', 'plain english', 'fine print', 'before signing', 'legal document', 'NDA', 'employment agreement', 'freelance contract', 'service agreement', 'SaaS agreement', 'subscription agreement', 'purchase agreement', 'lease', 'auto renewal', 'termination', 'payment terms', 'intellectual property', 'non-compete', 'liability', 'indemnification', 'dispute resolution', 'data privacy', 'negotiate contract', 'contract questions', 'governing law'],
  icon: "📋",
  categories: ['Home & Daily Life', 'Money', 'Work & Meetings'],
  headerColor: "#c0d8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Contract Decoder gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the contract below — an excerpt of a longer result, nothing reworded.",
    sampleLabel: "The contract",
    sampleText: "FREELANCE SERVICES AGREEMENT\n\nThis Agreement is entered into as of the date of signing between ACME Corp (\"Client\") and the undersigned designer (\"Contractor\").\n\n1. SERVICES\nContractor agrees to provide graphic design services as directed by Client.\n\n2. COMPENSATION\nClient shall pay Contractor $75/hour. Payment is due within 60 days of invoice. Client may dispute any invoice within 90 days of receipt. Contractor waives all right to payment if not claimed within 6 months of completion.\n\n3. INTELLECTUAL PROPERTY\nAll work product, including preliminary designs, sketches, and concepts, shall be the sole and exclusive property of Client upon creation, regardless of payment status. Contractor hereby assigns all rights, title, and interest in any work product to Client. Contractor waives all moral rights. Client may use Contractor's name and portfolio samples in perpetuity for marketing purposes.\n\n4. TERMINATION\nClient may terminate this agreement at any time with or without cause, with zero notice. Upon termination, Contractor shall deliver all work in progress immediately. No compensation shall be due for work not yet invoiced at time of termination.\n\n5. NON-COMPETE\nContractor agrees not to perform design services for any company in the technology sector for a period of 24 months following termination of this agreement.\n\n6. CONFIDENTIALITY\nContractor shall keep all Client information confidential in perpetuity, including after termination, and shall not discuss the existence of this agreement with any third party.\n\n7. DISPUTE RESOLUTION\nAny disputes shall be resolved by binding arbitration in the Client's jurisdiction. Contractor waives all right to jury trial. Client may seek injunctive relief in any court without posting bond.\n\n8. GOVERNING LAW\nThis agreement shall be governed by the laws of Delaware, regardless of Contractor's location.\n\n9. ENTIRE AGREEMENT\nThis agreement supersedes all prior agreements. Client may modify this agreement at any time by posting updates to its website.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples. Context given: I'm a freelance designer being asked to sign this before starting a project for a startup.",
    sections: [
      {
        label: "In plain English",
        tone: "neutral",
        text: "This is a freelance services agreement between you (the designer) and ACME Corp, covering a graphic design engagement. As written, ownership of all work transfers to the client from the moment it is created, payment timelines favor the client significantly, and several clauses extend obligations well beyond the end of the project — including a 24-month restriction on working in the technology sector, perpetual confidentiality, and a non-disparagement-adjacent clause preventing you from discussing the agreement's existence.",
      },
      {
        label: "Ownership transfers immediately, regardless of payment",
        tone: "yellow",
        text: "The client owns everything you create — including early drafts and concepts — the moment you make it, whether or not they have paid you anything yet.",
      },
      {
        label: "Work completed before invoicing is not compensable at termination",
        tone: "yellow",
        text: "The client can end the agreement instantly, for any reason or no reason. You must hand over everything immediately. Work you have done but not yet invoiced is expressly excluded from compensation under this clause.",
      },
      {
        label: "Payment timeline and waiver of unpaid claims",
        tone: "yellow",
        text: "You will be paid $75/hour, but invoices do not have to be paid for 60 days. The client has 90 days to dispute an invoice — longer than the payment window itself. Any payment you have not claimed within 6 months of project completion is given up under this clause.",
      },
      {
        label: "24-month restriction on technology-sector design work",
        tone: "yellow",
        text: "For two years after this agreement ends, you agree not to do design work for any company in the technology sector — regardless of how short or narrow the ACME project was.",
      },
      {
        label: "Questions to ask before you sign",
        tone: "neutral",
        items: [
          "Which specific work samples are covered, and do you have any right to approve or withdraw consent for how your name is used?",
          "Which arbitration body and rules apply, where specifically does arbitration take place, and who bears the costs?",
          "Can you invoice at any time, including the moment termination is communicated?",
        ],
      },
      {
        label: "Before you sign",
        tone: "green",
        items: [
          "Identify every current or likely future client of yours that could fall within 'the technology sector' as you would define it broadly — if any do, that restriction as written would cover them for 24 months after this project ends.",
          "Find the client's website and locate the page where agreement updates are posted, if it exists. Note what it currently says, so you have a record of the terms at signing.",
          "Establish your invoicing cycle before signing and confirm in writing with the client that you may submit a final invoice immediately upon any termination, to address the gap the current termination clause creates.",
        ],
      },
    ],
    disclaimer: "Contract Decoder explains what the document says and what to check. It is not legal advice, and whether a clause is enforceable depends on where you are; a lawyer can confirm that for a contract that matters.",
  },
  faq: [
    { q: "What should I look for before signing a contract?",
      a: "Who owns the work and when, how and when you get paid, how either side can end it and what happens to unpaid work, any restriction on what you can do afterwards (non-compete, confidentiality), how disputes are handled, and whether one side can change the terms on its own. Those are the clauses that decide what the contract costs you." },
    { q: "Can I ask to change a contract before I sign it?",
      a: "Yes. A contract you have been sent is usually a starting draft. Asking for a specific change — payment within 30 days instead of 60, ownership passing on payment rather than on creation, a narrower non-compete — is normal, and it is easier before you sign than after." },
    { q: "Is a clause like this enforceable?",
      a: "It depends on the jurisdiction and the details. Non-competes, waivers and one-sided change clauses are treated very differently from place to place. Contract Decoder says what a clause states and what to clarify; for whether it would hold up, ask a lawyer where you live." },
    { q: "Can I upload the contract as a file?",
      a: "Yes. Paste the text or upload the file, and optionally add where the contract is governed and anything about your situation that matters." },
  ],
  description: "Paste a contract — or upload the file — and get a plain-English breakdown of important terms, questions to consider, and possible points to clarify or negotiate before you sign.",
  guide: {
    tips: [
      "Use the full agreement when you can. An extract may omit definitions, notice provisions, exceptions, schedules, or riders that change how a clause reads",
      "If the contract names a governing law or jurisdiction, enter that location rather than your own physical location",
      "Use 'Your situation' for context the document cannot know — for example, a renewal invoice you received, a deadline, or a practical constraint",
      "Treat quoted contract language as the anchor. If an explanation seems broader than the quoted text, check the surrounding section in the original document",
      "Questions to clarify are especially useful when the document refers to something it does not define, leaves a field blank, or depends on another document you have not supplied",
      "Possible negotiation asks are optional starting points. Choose only the ones that matter to you and fit the actual relationship",
    ],

  },
},
{
  id: "ScamRadar",
  modified: "2026-09-11",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A message arrived and something feels off.",
    give: "The full message, whatever you know about the sender, and what — if anything — you've already done.",
    get: "What looks concerning, what to do right now, how to verify it safely, and what still isn't settled.",
    edge: "It separates the message itself from known scam patterns and from facts that would need outside verification.",
  },
  seoDescription: "Paste a suspicious email, text, DM, phone script, or invoice. See what's concerning, what to do now, and how to verify it safely — without false certainty. Free, no signup.",
  seoTitle: "Scam Checker: Is This a Scam?",
  title: "Scam Radar",
  tagline: "Spot the warning signs before you click, pay, or reply.",
  tags: ['scam', 'phishing', 'fraud', 'email', 'sms', 'smishing', 'suspicious', 'fake', 'security', 'safety', 'identity theft', 'spam', 'social engineering', 'consumer', 'protect', 'scammer', 'verify'],
  icon: "🎣",
  categories: ['Money'],
  headerColor: "#c0d8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Scam Radar gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the message below — an excerpt of a longer result, nothing reworded.",
    sampleLabel: "The message",
    sampleText: "Hi David! Sorry for the late reply, this is Wenjing from the tennis club. Is this still your number?\n\n[after reply]\n\nOh I'm so sorry, wrong number! But you seem nice. I'm new to the area, I moved here from Singapore last year for work. Do you live nearby?\n\n[three days of friendly conversation later]\n\nMy uncle works in commodities and he's been helping me with a gold trading account. I made 2,400 last month just following his signals. I'm not trying to sell you anything, I just think you'd be good at it. I can show you the platform if you're curious, no pressure at all.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "Likely scam",
        tone: "red",
        text: "The message follows a recognizable sequence: an unsolicited wrong-number opener, several days of relationship-building with no apparent purpose, then an introduction to an investment opportunity framed as a personal favor. Each stage is consistent with a well-documented scam pattern. No single element proves fraud, but the combination is a strong signal.",
      },
      {
        label: "The pattern",
        tone: "neutral",
        text: "This sequence is consistent with a pattern in which a stranger initiates contact through an apparently accidental message, builds rapport over days or weeks, then introduces a trading or investment platform — often described as a family member's or trusted contact's method. The platform introduction typically comes with an offer to 'show you' how it works. If the pattern continues, the next steps often involve depositing money, seeing apparent profits, and then finding that withdrawals are blocked or require additional fees. That the sender says 'I'm not trying to sell you anything' and frames the opportunity as a personal favor are features of the approach, not evidence against it.",
      },
      {
        label: "Why it is concerning",
        tone: "yellow",
        items: [
          "'My uncle works in commodities and he's been helping me with a gold trading account. I made 2,400 last month just following his signals.' A specific, modest-sounding profit figure from a trusted family member's guidance is a common feature of investment approaches that build credibility through personal referral rather than verifiable claims.",
          "'I'm not trying to sell you anything' and 'no pressure at all.' Explicitly disclaiming a sales motive while making an unsolicited investment offer does not reduce the risk — it is a feature of the approach that makes the invitation feel lower-stakes.",
          "The offer is to 'show you the platform,' not to describe it in detail. Directing someone to a specific platform introduced through this contact — rather than one the person found independently — is where financial exposure in this pattern typically begins.",
        ],
      },
      {
        label: "What does not settle it",
        tone: "neutral",
        items: [
          "The sender's friendly, natural-sounding writing does not verify who they are or whether they are who they claim to be.",
          "The mention of Singapore, a tennis club, and a named uncle adds personal detail but none of it can be checked from this conversation alone.",
          "The offer being framed as low-pressure and personal does not establish that the platform or the opportunity is legitimate.",
        ],
      },
      {
        label: "What to do now",
        tone: "green",
        items: [
          "Do not engage with the platform offer. If the conversation has been ongoing (as your pasted transcript suggests), stopping now is reasonable — you do not owe an explanation.",
          "Do not deposit money into, register on, or share financial credentials with any platform this contact introduces.",
          "Do not share bank details, identity documents, or payment information with this person.",
        ],
      },
    ],
    disclaimer: "Scam Radar reads the message you paste. It does not open links or look up the sender, and a verdict is an assessment of the pattern, not proof.",
  },
  faq: [
    { q: "How can I tell if a text message is a scam?",
      a: "Look for the pattern rather than any one detail: an unexpected contact, urgency or a deadline, a request for money, codes or personal details, a link to a site you did not find yourself, and payment by gift card, crypto or wire. Then check the claim through a channel you already trust, such as the number on your card or the company's own website — never through the message itself." },
    { q: "What is a wrong-number or pig-butchering scam?",
      a: "A stranger texts as if they had the wrong number, keeps chatting for days or weeks to build trust, then mentions an investment or crypto platform that a relative or mentor supposedly uses. Victims are often shown fake profits at first; the money usually cannot be withdrawn later." },
    { q: "What should I do if I already sent money or shared details?",
      a: "Contact your bank or payment provider straight away, using a number you look up yourself, and say exactly what happened. Change any password you shared. In the US you can also report it at ReportFraud.ftc.gov, and online fraud at ic3.gov; elsewhere, your national fraud-reporting service or the police." },
    { q: "Does Scam Radar check the link or the phone number?",
      a: "No. It reads the text you paste and explains which parts match known scam patterns, what would and would not settle the question, and what to do next. It does not visit links or look anything up, so verify through a source you find yourself." },
  ],
  description: "Paste a suspicious email, text, DM, phone script, invoice, or message. Scam Radar shows you what in it deserves caution, what to do next, and how to verify the request without relying on the message itself.",
  guide: {
    tips: [
      "A full paste is more useful than a summary because wording, requests, sender details, and sequence can all matter",
      "'No clear scam signs' is not the same as 'verified safe' — sensitive requests still deserve independent verification",
      "A familiar company name, logo, or sender display name does not establish who actually sent the message",
      "If you already interacted with the message, the next step depends on what happened; include that rather than asking only whether the message looks suspicious",
      "Pattern language is descriptive: 'resembles a known tactic' is different from claiming this particular sender is following a proven script",
    ],

  },
},
{
  modified: "2026-04-24",
  id: "DoctorVisitPrep",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "The night before an appointment you can't afford to waste.",
    give: "Your main concern, how long it's been going on, what you've tried, and what worries you most.",
    get: "A one-sentence opener, the questions to ask, and what to bring — ordered so the important thing gets said first.",
    edge: "Appointments run short and the real concern often comes out last. This front-loads it.",
  },
  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    { q: "What questions should I ask my doctor at an appointment?",
      a: "The highest-value questions are specific to your situation: what could explain my symptoms, what would change your recommendation, what happens if we wait, and what should bring me back sooner. Doctor Visit Prep turns your symptoms and worries into a prioritized question list so the important ones get asked before time runs out." },
    { q: "How do I describe my symptoms to a doctor clearly?",
      a: "Doctors listen for onset, duration, severity, triggers, and what makes it better or worse. The tool takes your plain description — 'my knee hurts going downstairs since March' — and structures it that way, so your two minutes of history actually lands." },
    { q: "How do I make the most of a short doctor's appointment?",
      a: "Lead with your biggest concern first (not last), bring a written symptom timeline, and have your questions ranked — appointments end, lists don't get finished. The prep sheet the tool builds is designed to be read from the top down as time allows." },
    { q: "What should I bring to a doctor's appointment?",
      a: "A current medication list (including supplements), your symptom timeline, relevant history, and your question list. If you're seeing a specialist, bring or reference prior test results — repeating tests because records didn't transfer wastes your visit." },
    { q: "How do I prepare for an appointment I'm nervous about?",
      a: "Write everything down beforehand — nerves erase details in the room. The tool's prep sheet acts as your script: your concerns stated plainly, your questions in priority order, and a reminder of what you wanted to say when your mind goes blank." },
  ],
  seoDescription: "Turn scattered symptoms and worries into a focused script for your doctor visit. Get a free opener, prioritized questions, and a pre-visit checklist.",
  seoTitle: "Doctor Visit Prep: Questions to Ask Checklist",
  title: "Doctor Visit Prep",
  tagline: "Walk in prepared — because fifteen minutes goes by quickly.",
  tags: ['doctor', 'appointment', 'prep', 'questions', 'symptoms', 'health', 'medical', 'visit', 'preparation'],
  icon: "📝",
  categories: ['Health & Wellness', 'Home & Daily Life'],
  headerColor: "#ccdfc4",
  description: "Turn your scattered worries and symptoms into a focused script for your next doctor visit — a clear opener, prioritized questions, things to mention even if the doctor doesn't ask, and a pre-visit checklist.",

  // Public, reviewed demonstration used by both the React page and prerenderer.
  exampleOutput: {
    title: "See what Doctor Visit Prep gives you",
    expandLabel: "See the full real example results ↓",
    nextStepLabel: "What happens with your visit",
    intro: "This is the complete, real output from an actual Doctor Visit Prep run on the sample situation below — nothing here is invented or shortened.",
    sampleLabel: "Sample situation",
    sampleText: "Right-sided lower back pain for about three weeks, gradually worsening, sometimes shooting down the back of the right leg to the knee. Worse after sitting more than 30 minutes or bending forward; better with walking, lying flat, and ibuprofen (400mg, 2-3x/day for the past week). Morning stiffness that loosens with movement. Desk job. Mother had kidney stones twice, prompting worry about a kidney connection. Allergy to sulfa drugs. No prior back injuries.",
    context: "Real run, 2026-09-23 — the tool's own built-in example scenario, a scheduled visit for new back pain.",
    sections: [
      {
        label: "Mention these first (3)",
        tone: "red",
        items: [
          "If you develop a fever, chills, or feel suddenly unwell alongside the back pain, don't wait for a scheduled appointment — those deserve same-day attention.",
          "If you notice blood in your urine, pain when urinating, or a significant change in how often you're urinating, call the office before your next appointment rather than waiting for it.",
          "If the leg symptom spreads below the knee, becomes numbness or weakness, or you have any loss of bladder or bowel control, seek same-day care immediately.",
        ],
      },
      {
        label: "Your opening line",
        tone: "green",
        text: "Say this in the first minute: “I've had a dull, deep ache in my lower right back for about three weeks — it's gradually getting worse, and it sometimes shoots down the back of my right leg to the knee.” Clinical-ready description: the pain is on the right side, lower back, dull and deep in quality, rated about 6 out of 10. It radiates down the back of the right leg to the knee and is worse after sitting more than 30 minutes or bending forward, but improves with walking, lying flat, and ibuprofen. Stiff in the mornings but loosens up after a few minutes of movement — three weeks with a gradual onset, desk job with most of the day spent sitting. Your goal for this visit: leave with either a clear working explanation, a specific test or referral ordered, or a concrete plan — including what symptom change or timeline would trigger the next step.",
      },
      {
        label: "Prioritized questions (5)",
        tone: "neutral",
        items: [
          "[High — possible causes] Based on where the pain is, how it moves, and what makes it better or worse — what explanations best fit what we're seeing? Why: this is your primary goal for the visit and frames everything else that follows.",
          "[High — next steps] I'm worried about a kidney connection given my mother's history with kidney stones. Is there a quick way to tell whether this is coming from my spine or somewhere else — and what would we check first? Why: this addresses your biggest worry directly and asks the doctor to help you prioritize without over-testing.",
          "[High — medication] I've been taking ibuprofen 400mg two or three times a day for the past week — is that safe to keep up, and is there something that would work better for what's going on? Why: daily NSAID use for a week warrants a conversation about whether it's appropriate to continue and at what dose.",
          "[Medium — day to day] What should I do differently day-to-day — with sitting, movement, or posture — while we're figuring this out? Why: you have a desk job that is likely making things worse, and concrete guidance now prevents you from inadvertently aggravating it.",
          "[Medium — next steps] If this doesn't improve in the next few weeks, what's the next step — and what would need to happen for you to order imaging? Why: establishes a clear decision point so you're not left waiting indefinitely without a plan.",
        ],
      },
      {
        label: "Mention proactively, even if not asked (4)",
        tone: "yellow",
        items: [
          "I have an allergy to sulfa drugs — I get a rash.",
          "My mother had kidney stones twice, which is part of why I'm concerned about the right-sided location.",
          "I have no history of back injuries — this came on gradually with no specific incident I can point to.",
          "The leg symptom goes down the back of my right leg to the knee — not past the knee, not to the foot.",
        ],
      },
      {
        label: "Pre-visit checklist (5)",
        tone: "neutral",
        items: [
          "Write down the exact date the pain started and whether anything was different that week — even if there was no obvious injury.",
          "Note the two or three positions or activities that reliably make it worse, so you can describe them quickly if the doctor asks.",
          "Count roughly how many ibuprofen doses you've taken in the past week so you can give the doctor an accurate number.",
          "Think through whether you've had any changes in urination — frequency, color, discomfort — so you can answer honestly if asked.",
          "Decide in advance what you'd consider a good outcome from this visit, so you can say it out loud if the appointment feels like it's ending without a plan.",
        ],
      },
      {
        label: "If medication is prescribed, ask (5)",
        tone: "neutral",
        items: [
          "What is this treating or targeting — the pain itself, or something else going on?",
          "Are there any interactions with ibuprofen, or should I stop taking it while I'm on this?",
          "What side effects should I watch for in the first week?",
          "How will we know if it's working, and what would make us reconsider it?",
          "Is there a generic version available?",
        ],
      },
      {
        label: "What to bring (4)",
        tone: "neutral",
        items: [
          "Your ibuprofen bottle or a note with the exact dose and how often you've been taking it.",
          "Insurance card and a photo ID.",
          "A phone or notebook to write down what the doctor says the next steps are.",
          "A written note of your mother's kidney stone history in case the detail matters and you go blank under pressure.",
        ],
      },
      {
        label: "Conversation tips",
        tone: "green",
        items: [
          "Lead with the leg symptom early — if the doctor knows the pain radiates down your leg, that changes which questions they'll ask and may save time.",
          "If you reach the end of the visit without a clear next step, it's fair to say: ‘Can you tell me what I should do, what to watch for, and when I should come back or call?’",
          "You don't need to choose between the kidney worry and the back worry — ask the doctor to help you sort out which is worth investigating first, and let them lead.",
          "If something the doctor says doesn't make sense, ask them to repeat it in different words — not to challenge them, just to make sure you leave with something you can actually act on.",
        ],
      },
    ],
    nextStep: "With your own concern, timeline, medications, and worries, Doctor Visit Prep turns what you already know into a short, prioritized visit sheet — mention-first items, an opening line, prioritized questions, and a pre-visit checklist — so the important part does not get buried at the end of the appointment.",
    disclaimer: "This is a real, complete tool run against a realistic sample situation. It does not diagnose symptoms, recommend treatment, or replace urgent medical care when needed."
  },

  guide: {
    tips: [
      "Be specific in the chief concern field — 'right-sided lower back pain for 3 weeks' beats 'my back hurts'",
      "Fill in the 'what you're most worried about' field honestly — the output will address it directly instead of dancing around it",
      "Use it the night before the visit, then again in the waiting room — you'll retain it better in two passes",
      "Save the output to your phone and scroll to it when the doctor asks 'so what's going on?'",
      "Pair with Doctor Visit Translator afterward to decode what the doctor said"
    ],
    beforeYouGo: "Severe or sudden symptoms, such as chest pain, the worst headache of your life, signs of stroke or heavy bleeding, need urgent care or the ER, not an appointment.",
  }
},
{
  modified: "2026-08-25",
  id: "DriveHome",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You are about to start a drive and something in you is hesitating.",
    give: "How long the drive is, when it is, the conditions, the road type, and how you are feeling.",
    get: "A straight call — go, pause, or don't start — with what makes this drive harder and what to do instead.",
    edge: "It works only from what you report, so it never talks you into a drive on facts it invented.",
  },
  seoDescription: "Free pre-drive decision helper. Say how long the drive is, what the conditions are, and how you're feeling — get a straight go, pause, or don't-start call, with safer options if the answer is wait.",
  seoTitle: "Should I Drive? A Pre-Drive Check",
  title: "Drive Home",
  tagline: "A clearer call before you get behind the wheel",
  tags: [
    'drive', 'driving', 'should i drive', 'should i drive home', 'drive or wait',
    'too tired to drive', 'drowsy driving', 'tired driving', 'fatigued driving', 'nervous driving',
    'night driving', 'late night driving', 'long drive', 'highway driving', 'solo drive',
    'bad weather driving', 'snow driving', 'rain driving', 'fog driving', 'road safety',
    'pre-drive check', 'arrival reminder'
  ],
  icon: "🚗",
  categories: ['Decisions', 'Health & Wellness', 'Home & Daily Life'],
  headerColor: "#1e2a3a",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Drive Home gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the drive below — the full result, nothing reworded.",
    sampleLabel: "The drive",
    sampleText: "Office in downtown Seattle to home in Bellevue, about 45 minutes, evening. Rain and heavy traffic, mixed roads. Feeling a little tired. \"I caught myself yawning on the walk to the car and it is raining harder than when I arrived.\"",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "Pause: Wait and reassess your alertness before starting — the yawning before you even reach the car is worth taking seriously.",
        tone: "yellow",
        text: "You reported feeling a little tired and caught yourself yawning on the walk to the car. Combined with 45 minutes of heavy traffic in rain, this is worth pausing on before starting. The question is whether you feel clearly alert enough to sustain attention for the full drive, not just alert enough to begin.",
      },
      {
        label: "What makes this drive harder",
        tone: "neutral",
        items: [
          "Self-reported tiredness before departure",
          "Yawning already present on the walk to the car",
          "Reported heavy traffic — demands more sustained attention than light traffic",
          "Reported rain, harder than earlier in the day",
          "45-minute drive on mixed roads",
        ],
      },
      {
        label: "Before you decide",
        tone: "green",
        text: "Sit somewhere off the road for a genuine rest — not a brief pause — then honestly assess whether you feel clearly alert and able to hold attention for the full 45 minutes, not just the first few minutes. If the tiredness and yawning persist, that is your answer: do not start.",
      },
      {
        label: "Safer options",
        tone: "green",
        items: [
          "Wait in a safe, stationary location until you feel clearly alert, then reassess",
          "If someone at your destination or nearby could collect you, that removes the driving requirement",
          "If public transit is available and practical from your location, that removes the fatigue risk of driving",
          "If the drive can be delayed until you have had proper rest, delay it",
        ],
      },
    ],
    disclaimer: "Drive Home doesn't have live traffic, weather, or road-condition data. This assessment uses only what you reported. If conditions change, reassess before leaving.",
  },
  faq: [
    { q: "How do I know if I'm too tired to drive?",
      a: "Yawning, heavy eyelids, drifting thoughts, missing an exit or not remembering the last few miles are all warning signs. The question isn't whether you can start the drive but whether you can stay clearly alert for all of it. If you're unsure, don't start." },
    { q: "Does coffee or opening the window fix drowsy driving?",
      a: "No. Coffee takes time to work and wears off, and cold air or loud music only mask tiredness briefly. Real options are rest before driving, a short nap somewhere safe, someone else driving, or another way home." },
    { q: "Is it more dangerous to drive tired in rain and traffic?",
      a: "Yes. Rain and heavy traffic need more sustained attention and quicker reactions, which is exactly what tiredness takes away. Each condition makes the others matter more." },
    { q: "Does Drive Home check live traffic or weather?",
      a: "No. It reasons only from what you report and doesn't certify a drive as safe. It helps you make the call before you start, and you should reassess if conditions change." },
  ],
  description: "Tell it about the drive and how you're feeling, and it gives you one clear call — go, pause, or don't start — plus what makes this drive harder and what to do instead. It has no live traffic or weather data and never claims to: it reasons only from what you report.",
  guide: {
    tips: [
      "Answer the condition question about now, not about the forecast — it reasons from what you report, so a stale answer gives a stale call",
      "The hesitation box is the highest-value field on the form; a specific worry gets a specific answer",
      "A go call is not a safety guarantee — it means nothing you reported gave a clear reason to wait",
      "If the answer is pause and you resolve the missing fact, run it again rather than talking yourself past it",
      "Walking home instead? SafeWalk covers that trip"
    ],
    beforeYouGo: "Never use Drive Home while the vehicle is moving.",

  }
},
{
  modified: "",
  id: "ToolFinder",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You have a problem and no idea which tool solves it.",
    give: "Your problem in plain language.",
    get: "One to five tools ranked, each with why it fits your situation specifically.",
    edge: "It reads between the lines, so you don't have to know what the tool would be called.",
  },
  seoDescription: "Describe your problem in plain language and instantly find the right DeftBrain tool for it. Get matched picks, why each fits, and what to enter. Free, no signup.",
  seoTitle: "Find the Right Tool for a Problem",
  // Renamed to "Start Here" on 2026-08-05 and back to "Tool Finder" on
  // 2026-08-21. The 2026-08-05 reasoning was that users want to solve problems
  // rather than find tools — true of every OTHER tool on the site, and exactly
  // backwards here: this is the one page whose entire job is finding the tool,
  // and "Start Here" describes a position in a menu rather than what happens.
  // The id and route have stayed /ToolFinder throughout, so both renames are
  // display-only — no redirects, no lost inbound links.
  title: "Tool Finder",
  tagline: "Tell me what you're dealing with — I'll find the right tool.",
  tags: ['find tool', 'search', 'which tool', 'help me', 'recommend', 'browse', 'discover', 'guide', 'navigate', 'right tool', 'suggest', 'match'],
  icon: "🧰",
  categories: ['Tasks'],
  headerColor: "#e0b8b8",
  description: "Not sure where to start? Describe what's going on in your own words. We'll find the best match and show you what comes next.",
  guide: {
    tips: [
      "More detail gets better matches — 'money problem' is vague, 'my roommate owes me $200 and it's awkward' is specific",
      "The workflow section shows how to chain tools together",
      "Quick-pick buttons are great starting points if you're not sure how to describe it",
      "If results aren't perfect, add more context and search again"
    ]
  }
},
{
  modified: "2025-03-05",
  id: "FutureProof",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Before you commit years to a skill, career, or bet.",
    give: "What you're stress-testing and what type it is. Your industry and experience help.",
    get: "Over the horizon you choose: the forces for and against it, what could change, three conditional scenarios, and one low-regret move.",
    edge: "It separates what can be observed now from what is only projected, and maps the exits as well as the path.",
  },
  seoDescription: "Free stress-test for any skill, career, technology, investment or long-term bet — what is working for it, what is working against it, what could change, and one move that holds up across several outcomes.",
  seoTitle: "Stress-Test a Career or Skill",
  title: "Future Proof",
  tagline: "Stress-test a career, skill, technology, investment or long-term bet — before you go all in",
  tags: ["career future", "future of my job", "skill worth learning", "career resilience", "automation risk", "ai job risk", "technology outlook", "investment thesis", "long-term decision", "future scenarios", "stress test career", "stress test investment", "stress test skill", "stress test technology", "what should i learn", "career pivot", "future uncertainty", "low-regret move", "tailwinds headwinds"],
  icon: "🔮",
  categories: ['Career', 'Decisions'],
  headerColor: "#ccdfc4",
  description: "Stress-test a career, skill, technology, investment, or long-term bet. See what's working for it, what's working against it, what could change, and what you can do now without betting everything on one forecast. Choose a 1, 3, 5 or 10 year horizon; get tailwinds, headwinds, three conditional scenarios, and one low-regret action.",
  guide: {
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
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Something costs more than it should and you want to know why.",
    give: "The product or service, and the price you saw.",
    get: "Where your money actually goes — materials, labor, brand premium, pure margin — and the pricing psychology in play.",
  },
  seoDescription: "Ever wonder why that coffee costs $5? Describe any product and get a free breakdown of its real cost, the markup multiplier, the typical price elsewhere, and how to pay less.",
  seoTitle: "Why Does It Cost That Much?",
  title: "Markup Detective",
  tagline: "Why does this cost that? Follow the money.",
  tags: ['markup', 'pricing', 'cost', 'price breakdown', 'product', 'overpriced', 'why so expensive'],
  icon: "🏷️",
  categories: ['Just for Fun', 'Money'],
  headerColor: "#c0d8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what Markup Detective gives you",
    expandLabel: "See the full real example ↓",
    intro: "Real output from an actual run on the item below. Most of the result is shown; nothing is reworded.",
    sampleLabel: "The item",
    sampleText: "Hospital aspirin charged at $25/tablet on a bill",
    context: "Real run, 2026-10-07 — one of the tool's own built-in examples. Figures are estimates.",
    sections: [
      {
        label: "Paid $25 · about 500× the cost of the pill",
        tone: "red",
        text: "The pill costs pennies, but the line item is really a packaging label stuck onto the hospital's nursing, pharmacy, and overhead costs — which is why it reconciles to $25 even though no single aspirin ever cost that.",
      },
      {
        label: "What it actually costs",
        tone: "neutral",
        items: [
          "The tablet itself: about $0.02 to $0.05 for the tablet itself",
          "At a pharmacy: roughly $0.03 to $0.10 per tablet at a pharmacy or supermarket (a 200-count bottle commonly runs a few dollars)",
        ],
      },
      {
        label: "Where the $25 goes (estimated)",
        tone: "yellow",
        items: [
          "The tablet itself (acquisition cost): $0.04",
          "Pharmacy handling, dispensing, and verification labor: $5.00",
          "Nursing administration and documentation time: $6.00",
          "Facility overhead allocation (space, utilities, regulatory, licensing): $7.00",
          "Cost-shifting / uncompensated-care recovery built into the chargemaster: $5.00",
          "Margin / institutional surplus: $1.96",
        ],
      },
      {
        label: "How the pricing works on you",
        tone: "neutral",
        items: [
          "The price nobody is expected to actually pay: The chargemaster figure is a list price that insurers negotiate down from and self-pay patients can often contest. Posting a high number anchors every downstream negotiation above the real reimbursement, so the $25 is less a price than a starting point. What it is worth to the hospital: it sets the ceiling for every payer conversation.",
          "The receipt you see only after it is impossible to refuse: Unlike a store shelf, the price of this tablet is not shown at the point of consumption — you learn it on the bill, long after the pill was swallowed. Pricing disclosed after the decision cannot be comparison-shopped, which is part of why unbundled line items like a single aspirin can carry numbers that would never survive on a pharmacy shelf.",
          "Charging for the whole hospital through one small object: The aspirin is a vehicle for recovering fixed costs that have no tidy line of their own — 24/7 staffing, licensed pharmacy infrastructure, and care for patients who never pay. Attaching those costs to discrete billable items lets the institution spread overhead across everything it touches, so the pill carries far more than the pill.",
        ],
      },
      {
        label: "How the industry prices it",
        tone: "neutral",
        items: [
          "Hospital chargemaster prices are internal list rates that frequently bear little relationship to what any payer actually pays; negotiated insurer rates and cash-pay settlements are commonly a fraction of the posted figure, so a line-item price is not the same as a market price.",
          "Many inpatient stays are reimbursed as a bundled case rate (such as a DRG) rather than itemized, which means individual line items like a single aspirin may be itemized for the statement without each one being separately collected — the detailed bill and the amount ultimately paid can be two different numbers.",
          "Hospitals in the US are generally required to post standard charges and a list of shoppable-service prices publicly, so the chargemaster that produced the $25 figure is often something a patient has a right to request and review.",
        ],
      },
      {
        label: "How to pay less",
        tone: "green",
        items: [
          "Request a fully itemized bill (not a summary) and specifically flag the aspirin line — ask the billing office to justify or remove line items for over-the-counter medications you could have taken yourself.",
          "Ask whether your stay was reimbursed as a bundled case rate; if so, question why OTC items are being charged separately on top of the bundle.",
          "If you are self-pay or uninsured, ask directly for the cash price, the financial-assistance / charity-care policy, and a prompt-pay discount — posted charges are routinely negotiable for individuals.",
          "For planned admissions, bring your own clearly-labeled OTC medications and ask in advance whether the hospital permits self-administration, which can keep items like aspirin off the bill entirely.",
          "Have your insurer's explanation of benefits reviewed against the itemized bill — you generally owe the negotiated/allowed amount, not the chargemaster list price, and discrepancies are worth disputing.",
        ],
      },
    ],
    disclaimer: "Cost splits are estimates of how a price like this is built up, not figures from any particular hospital.",
  },
  faq: [
    { q: "Why does a hospital charge $25 for an aspirin?",
      a: "The pill costs a few cents; the line item carries pharmacy handling, nursing time, overhead and the hospital's list-price system. The real example on this page breaks that $25 down and explains the pricing behind it." },
    { q: "What is a markup?",
      a: "The gap between what something costs to make or supply and what you're charged, often shown as a multiple. Markup Detective estimates the real cost, a fair price, and where the rest of the money goes." },
    { q: "What can I check?",
      a: "Anything with a price: a latte, a bottle of restaurant wine, a hospital line item, printer ink, concert fees. Adding the price you paid and where gets a more precise breakdown." },
    { q: "Are the numbers exact?",
      a: "No — they're informed estimates of how prices like this are usually built up, not a specific company's accounts. They're meant to show where the money goes, not to prove a particular charge wrong." },
    { q: "Does it show how to pay less?",
      a: "Yes. Each result ends with specific ways to get the same thing for less, or to question the charge — for a hospital bill, starting with the itemized statement." },
  ],
  description: "Ever wonder why a $5 coffee costs $5 or hospital aspirin costs $25? Describe any product or service, and Markup Detective will show you where the money goes and why the price may be much higher than you expected.",
  guide: {
    tips: [
      "Adding the specific price and context gets more precise breakdowns",
      "The pricing-practice section explains how the industry actually sets its prices",
      "The comparison shows what the same thing usually costs away from this particular venue or channel",
      "Save money tips are specific to each item, not generic advice"
    ],

  }
},

{
  modified: "2026-09-11",
  id: "SignalVsNoise",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You've read confident claims that contradict each other and want to know what the evidence actually supports.",
    give: "The contested topic or claim. One line is enough.",
    get: "What checked sources support, what's overstated or mixed, what's unresolved, and which sources establish each point.",
    edge: "It researches first, then synthesizes only from that evidence packet — so 'not established' does not quietly become 'false.'",
  },
  seoDescription: "Research a contested health, finance, science, productivity, or lifestyle claim. See what checked sources support, what's overstated, and what remains unresolved — with sources. Free, no signup.",
  seoTitle: "Evidence Checker: Signal vs. Noise",
  title: "Signal vs. Noise",
  tagline: "Find what holds up — and what doesn't.",
  tags: ['research', 'health', 'science', 'evidence', 'fact check', 'contradictory', 'study', 'debunked', 'diet', 'finance', 'productivity', 'truth'],
  icon: "📡",
  categories: ['Learning'],
  headerColor: "#d4dde8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 (strict index review: indexed only once it shows real output).
  exampleOutput: {
    title: "See what Signal vs. Noise gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the topic below, with its sources. Part of the result is shown; nothing is reworded.",
    sampleLabel: "The topic",
    sampleText: "Sleep optimization. The conflicting advice: sleep 8 hours vs. polyphasic sleep; phone before bed ruins sleep vs. blue-light glasses fix it; sleep debt is real vs. you can't catch up.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "Why it's noisy",
        tone: "blue",
        text: "Most of these conflicts dissolve when you separate 'the core mechanism is real' from 'the popular fix based on it works as advertised.' Evidence supports ranges and partial effects, not the clean rules circulating online.",
      },
      {
        label: "The signal",
        tone: "green",
        items: [
          "Most adults need 7-9 hours of sleep, not exactly 8; both meaningfully shorter and longer sleep are associated with worse health outcomes. Limits: Duration data is mostly self-reported and observational; individual genetic variation means some adults genuinely function on less or need more.",
          "Weekend catch-up sleep provides only partial recovery from sleep debt and cannot fully offset chronic deprivation. Limits: Evidence for partial recovery is stronger for short-term debt than chronic restriction; subjective feeling of recovery can precede actual cognitive recovery.",
        ],
      },
      {
        label: "The noise: “Blue light glasses fix the sleep damage from phone use before bed”",
        tone: "yellow",
        text: "Evening blue light can delay sleep onset; blue-light blocking glasses show only small, statistically non-significant effects on objective sleep in RCTs reviewed in a 2025 meta-analysis. Kernel of truth: evening light exposure, including from phones, can measurably shift circadian timing.",
      },
      {
        label: "Some of the sources it checked",
        tone: "purple",
        items: [
          "Sleep duration and health in adults: an overview of systematic reviews — Applied Physiology, Nutrition, and Metabolism (Canadian Science Publishing) (2020)",
          "National Sleep Foundation's sleep time duration recommendations: methodology and results summary — Sleep Health: Journal of the National Sleep Foundation (2015)",
          "About Sleep — Centers for Disease Control and Prevention (CDC)",
          "Nighttime sleep duration, 24-hour sleep duration and risk of all-cause mortality among adults: a meta-analysis of prospective cohort studies — NCBI / PubMed Central (2016)",
        ],
      },
    ],
  },
  faq: [
    { q: "How much sleep do adults actually need?",
      a: "Most adults need 7–9 hours; that range — not exactly 8 — is what the CDC and the National Sleep Foundation recommend, and individual needs vary within it." },
    { q: "Do blue-light glasses help you sleep?",
      a: "The evidence is thin. Evening light can delay sleep, but trials of blue-light-blocking glasses are small and haven't shown a clear effect on measured sleep." },
    { q: "Where does Signal vs. Noise get its answers?",
      a: "It searches for sources first — reviews, professional bodies, government health agencies — then answers only from what it found, and lists each source so you can check it." },
  ],
  description: "Conflicting claims everywhere? Signal vs. Noise researches the question first, then shows what the checked sources actually support, what is overstated or mixed, and what is still unresolved — with the sources behind each conclusion.",
  guide: {
      tips: [
        "Ask a claim specific enough to research — a concrete proposition usually produces a better evidence packet than a huge topic",
        "A logical inference is only as strong as its empirical premises; reasoning cannot turn remembered background knowledge into retrieved evidence",
        "'Not established by the checked sources' is different from 'disproven' — the tool preserves that distinction",
        "Comparative claims require evidence that actually makes the comparison; separate unrelated findings do not establish which option is better",
        "Recent Checks reopen the saved researched result without another search; use Check again with current sources when you want the evidence refreshed",
      ]
    }
},

{
  modified: "2025-03-05",
  id: "BreakMyPlan",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "The plan is written and everyone agrees. That's the dangerous moment.",
    give: "The plan in specific terms and what type it is.",
    get: "The memo from the future explaining why it failed, working backward to what you'd change now.",
    edge: "Assuming failure surfaces risks that forward planning misses. NASA and venture investors use the same inversion.",
  },
  seoDescription: "Have a plan you're about to put into action? Describe it and find the weak assumptions, warning signs, and failure paths worth thinking about now — while you can still do something about them. Free.",
  seoTitle: "Break My Plan? — Find the Weak Spots First",
  title: "Break My Plan?",
  tagline: "Find the weak spots in your plan before they find you.",
  tags: ['plan stress test', 'break my plan', 'pre-mortem', 'premortem', 'planning', 'failure modes', 'what could go wrong', 'risk planning', 'warning signs', 'assumption testing', 'weak assumptions', 'project risk', 'contingency planning', 'startup plan', 'business plan', 'career plan', 'personal plan', 'launch plan'],
  icon: "💀",
  categories: ['Decisions', 'Work & Meetings'],
  headerColor: "#d4dde8",
  description: "Have a plan you're about to put into action? Describe it and Break My Plan? will work backward from an imagined failure to find the weak assumptions, warning signs, and failure paths worth thinking about now — while you can still do something about them.",
  guide: {
      tips: [
        "The more specific your plan, the more specific and actionable the failure modes",
        "The Assumption to Test First is the most important output — test it before you execute",
        "Use the Assumptions Autopsy to build a pre-launch checklist",
        "Run this on plans you're most excited about — excitement is when blind spots are largest"
      ]
    }
},

{
  modified: "2025-03-05",
  id: "SmallChangeBigDifference",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You want one change to try, not a list of twelve.",
    give: "Your typical day, honestly, and what you'd like to make better.",
    get: "One small, concrete change worth trying, and what to watch for to know if it's helping.",
    edge: "Not a mathematically optimal bottleneck — a sensible first experiment, grounded in the day you actually described.",
  },
  seoDescription: "Walk through a typical day and get one small, concrete change worth trying — grounded in your actual routine, with what to watch for to know if it helped. Free.",
  seoTitle: "One Change to Try",
  title: "Small Change, Big Difference",
  tagline: "One small change that could make the rest easier.",
  tags: ['small change', 'habit', 'routine', 'daily routine', 'behavior change', 'personal improvement', 'habit experiment', 'friction', 'bottleneck', 'productivity', 'focus', 'morning routine', 'evening routine', 'systems thinking', 'what should I change'],
  icon: "⚡",
  categories: ['Decisions', 'Self & Reflection'],
  headerColor: "#e0b8b8",
  description: "Walk through a typical day and tell us what you want to improve. Small Change, Big Difference looks for one small adjustment that could make the rest of your routine easier — and gives you a practical way to try it.",
  guide: {
      tips: [
        "Be honest about the routine — the tool can only reason from what you share",
        "There's no claim this is the mathematically optimal change — it's a sensible first experiment",
        "'What to Watch For' is the actual test — give the change a real try before judging it",
        "If it doesn't help, that's useful information too — try the tool again with what you learned"
      ]
    }
},


{
  modified: "2025-03-05",
  id: "BeliefStressTest",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A rule you live by keeps producing results you don't like.",
    give: "The belief, and how you apply it.",
    get: "Where it holds, where it breaks, and the specific situations where it misleads you.",
    edge: "It isn't trying to demolish the belief — it finds the boundary where a useful simplification stops being useful.",
  },
  seoDescription: "Pressure-test the beliefs you live by against historical, logical, and cultural edge cases. See where each one holds, where it breaks, and what survives. Free.",
  seoTitle: "Belief Stress Test: Pressure-Test Your Beliefs",
  title: "Belief Stress Test",
  tagline: "Your guiding beliefs, pressure-tested. Where they hold. Where they break.",
  tags: ['belief', 'critical thinking', 'philosophy', 'assumptions', 'test', 'logic', 'values', 'worldview', 'self-awareness', 'bias', 'edge case'],
  icon: "🔬",
  categories: ['Just for Fun', 'Learning', 'Self & Reflection'],
  headerColor: "#d4dde8",
  description: "Pressure-tests the guiding beliefs you live by across multiple dimensions: historical counterexamples, logical edge cases, cultural variations, empirical exceptions. Finds where the belief holds, where it breaks, the psychological function it serves, and the more precise version that actually survives scrutiny.",
  guide: {
      tips: [
        "The 'psychological function' section is often the most revealing part",
        "Severity ratings on stress tests help you prioritize what's worth acting on",
        "Most useful for beliefs you've held so long you've stopped examining them"
      ]
    }
},

{
  modified: "2025-03-05",
  id: "GetNoticed",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "When useful things keep happening to other people and you want more chances at them.",
    give: "Where your life puts you in contact with new people or ideas, and what you would like more chances to encounter.",
    get: "A plain read of how new people and ideas currently reach you, what narrows that, what already works, and three to five practical ways to widen it.",
    edge: "It works only from what you supplied — no luck score, no percentage, and no claim about what any move will produce.",
  },
  seoDescription: "Find practical ways to become more visible to the people who could matter. Describe how your work, interests and relationships already put you in contact with new people and ideas, and get concrete moves to widen it — no score, no predictions.",
  seoTitle: "Get Noticed: Be Visible to People Who Matter",
  title: "Get Noticed",
  tagline: "Widen the circle of people who know what you do",
  tags: ['luck', 'serendipity', 'opportunity', 'networking', 'connections', 'visibility', 'career'],
  icon: "🧲",
  categories: ['Career', 'Relationships'],
  headerColor: "#e8d5b7",
  description: "Want more opportunities to be seen? Describe how your work, interests, and relationships put you in contact with new people and ideas. Get Noticed suggests practical ways to become more visible and create more opportunities for meaningful connections.",
  guide: {
      tips: [
        "Say what you actually do, not what you think sounds impressive — every move has to connect to something you supplied",
        "Leaving a field blank is fine; it will say so rather than invent an answer",
        "Nothing here predicts a result. A move is worth doing if it would still be worth doing when nobody unexpected replies",
        "If a suggestion names a specific event or venue you never mentioned, that is a bug — tell us"
      ]
    }

},

{
  modified: "2026-03-11",
  id: "BeforeHello",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "There's someone you'd like to know professionally, and you don't want to arrive as a stranger with an ask.",
    give: "Who they are, why them, and what you already bring.",
    get: "What's worth strengthening first, where the real overlap is, and whether there's already a good reason to say hello.",
    edge: "Every step it suggests is worth taking even if that person never sees it.",
  },
  seoDescription: "Work out what should be true before you introduce yourself to someone in your field — what to strengthen, where the real overlap is, and whether it's already time to reach out. Free, no signup.",
  seoTitle: "Before You Reach Out to Someone",
  title: "Before Hello",
  tagline: "Become worth knowing before you ask to be known.",
  tags: [
    'professional networking', 'cold outreach', 'reach out', 'professional introduction',
    'mentor outreach', 'investor outreach', 'collaborator', 'employer', 'client', 'networking strategy',
    'professional visibility', 'linkedin', 'first contact', 'connection',
  ],
  icon: "🌀",
  categories: ['Career', 'Relationships'],
  headerColor: "#e0b8b8",
  description: "Want to connect with someone in your professional world, but don't want to show up as a stranger with an ask? Build a practical plan to become more visible, relevant, and useful first—then recognize when there's a genuine reason to reach out.",
  guide: {
      tips: [
        "The readiness verdict can say 'ready now' — a direct, specific, easy-to-decline message is often the whole answer",
        "If a suggested step would only make sense because this person might notice it, the tool is supposed to reject it; treat one that slips through as a bug",
        "Being specific about your own background is what separates a real overlap from a generic one",
        "Works for mentors, collaborators, investors, employers, clients, and peers in your field"
      ],
    }
},

{
  modified: "2025-03-05",
  id: "NotSoFast",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You've been told no by a company, agency, or institution.",
    give: "The system you're up against, the problem, and the outcome you want.",
    get: "The exceptions that exist but aren't advertised, the phrases that route your call differently, the regulator that actually investigates, and the escalation ladder.",
    edge: "Every formal system has an informal architecture. This maps that one, not the published policy.",
  },
  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    { q: "How do I get an exception to a company policy?",
      a: "Ask the person with discretion, in the channel where discretion lives, with a reason that gives them cover to say yes. Front-line staff often can't bend rules; supervisors, retention teams, and written-escalation routes often can. Not So Fast! maps the legitimate exception paths for your specific situation — who to ask, in what order, and with what wording." },
    { q: "Is any of this bending the rules?",
      a: "The tool only deals in legitimate paths: published exceptions, discretionary waivers, escalation routes, and rights you already have but weren't told about. That's not gaming the system — it's using the system as designed but not advertised. Anything that depends on misleading someone stays out — it is the fastest way to lose a case you would otherwise win." },
    { q: "How do I get fees waived?",
      a: "Most waivable fees (late fees, service charges, change fees) have an internal forgiveness policy — usually one courtesy waiver per year that agents grant if asked directly and politely: 'I've been a customer for X years, can you waive this as a one-time courtesy?' The tool tells you which fee types typically carry discretion and scripts the ask." },
    { q: "What do I do when a company says a rule can't be changed?",
      a: "'That's our policy' from front-line staff means 'I don't have authority', not 'nobody does'. The next moves are asking who can make exceptions, invoking published exception criteria, or escalating in writing where the reputational calculus changes. Persistence with the right person beats volume with the wrong one." },
    { q: "When should I NOT try to work around a rule?",
      a: "When the rule is safety-related, when the workaround requires misrepresenting facts, or when the relationship is worth more than the win. Part of the tool's output is win-likelihood — and sometimes the honest answer is that this rule holds, and your effort is better spent on an alternative." },
  ],
  seoDescription: "Told no by an insurer, agency, HOA or provider? Find the appeal routes, documented exceptions, regulators and decision-makers that the first answer never mentions. Free, no signup.",
  seoTitle: "Appeals & Escalation Paths",
  title: "Not So Fast!",
  tagline: "The overlooked options, key conversations, and escalation paths nobody ever explains",
  tags: ['complaint', 'escalate', 'insurance', 'landlord', 'hoa', 'customer service', 'dispute', 'refund', 'bureaucracy', 'rights', 'exception', 'escalation', 'appeal'],
  icon: "🚪",
  categories: ['Decisions', 'Home & Daily Life', 'Learning', 'Money'],
  headerColor: "#d4dde8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "Discovered – not indexed" page real substance.
  exampleOutput: {
    title: "See what Not So Fast! gives you",
    expandLabel: "See the full real example ↓",
    intro: "Real output from an actual run on the situation below. Most of the result is shown; nothing is reworded.",
    sampleLabel: "The situation",
    sampleText: "Health insurance. Denied claim for procedure my doctor says was medically necessary. Already appealed once and got denied again.",
    context: "Real run, 2026-10-07 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "Why this happened",
        tone: "neutral",
        text: "Two-level denials often reflect a review process that is checklist-driven at both stages, not a final judgment by someone with full clinical discretion.",
      },
      {
        label: "Common reasons for a denial like this",
        tone: "neutral",
        items: [
          "The procedure code used does not match the insurer's criteria for the listed diagnosis code",
          "The clinical documentation submitted did not explicitly address the insurer's specific medical necessity criteria language",
          "The reviewing clinician at the appeals stage was not a specialist in the relevant field",
          "The insurer's coverage policy excludes the specific procedure variant billed, even if a related procedure is covered",
          "A required prior authorization step was missing or retroactively contested",
        ],
      },
      {
        label: "Where the power is",
        tone: "yellow",
        text: "The insurer's Medical Director (or Associate Medical Director for the relevant specialty) is the first internal actor with documented authority to grant an exception; above that, an external Independent Review Organization assigned by your state regulator has binding authority the insurer cannot override.",
      },
      {
        label: "The escalation ladder",
        tone: "green",
        items: [
          "1. Request Peer-to-Peer Review with Medical Director: Have your treating physician call the insurer's provider line and request a peer-to-peer clinical review with the Medical Director or a specialist reviewer in the relevant field — not a general appeals rep.",
          "2. Request External Independent Medical Review: File a formal request for External Review (also called Independent Review) through your state insurance department or directly with the insurer, who is required to provide this option after two internal denials.",
          "3. File a Complaint with Your State Insurance Department: Submit a written complaint to your state's insurance regulatory department, attaching both denial letters, your doctor's medical necessity letter, and your external review request if filed.",
          "4. Employer Benefits Administrator (if employer-sponsored plan): If your insurance is through an employer, contact your HR or benefits department and request that they escalate the denial through their account representative at the insurer.",
        ],
      },
      {
        label: "A route most people miss",
        tone: "green",
        items: [
          "Expedited External Review for urgent or ongoing medical situations: Ask the insurer in writing for expedited external review and have your doctor document that delay poses a health risk — most states require a decision within 72 hours under expedited rules.",
        ],
      },
      {
        label: "Words that route your request differently",
        tone: "neutral",
        items: [
          "“I am requesting the name and specialty of the physician who reviewed my appeal” — when speaking with the insurer after the second denial.",
          "“Please provide the specific clinical criteria used to determine that this procedure does not meet medical necessity” — in any written communication requesting the denial rationale.",
          "“I am formally requesting external independent review as provided under my plan and applicable state law” — in the written request you send after the second internal denial.",
        ],
      },
      {
        label: "Honest assessment: medium chance",
        tone: "yellow",
        text: "A well-documented peer-to-peer review combined with a formal external review request gives a genuine path to reversal, particularly if the treating physician can directly address the insurer's stated criteria — success is possible but not certain.",
      },
      {
        label: "The first move",
        tone: "green",
        text: "Call your doctor's office today and ask them to request a peer-to-peer review with the insurer's Medical Director, while you simultaneously request the specific clinical criteria used to deny the claim in writing.",
      },
    ],
    disclaimer: "General information, not legal advice. Appeal rights and deadlines depend on your state and on whether your plan is insured or self-funded — your denial letter says which rules apply.",
  },
  description: "We'll help you understand the appeals process, identify overlooked options, find the right escalation path, and prepare for conversations with the people who can actually make decisions.",
  guide: {
      tips: [
        "The 'magic phrases' section is literal — use the exact wording provided",
        "The regulatory angle works even if the complaint goes nowhere — it signals seriousness",
        "The win-likelihood assessment tells you if this battle is worth the time investment",
        "Pair with MagicMouth to script the actual phone calls"
      ],

    }
},

{
  modified: "2025-03-05",
  id: "TruthBomb",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "There's something you haven't said and it's costing you.",
    give: "The thing you're hiding, who it's about, and why you haven't said it.",
    get: "What's really driving the silence, an honest reality check instead of a prediction, and three ways to say it.",
    edge: "It costs something to say nothing, and that side is usually invisible. This prices both.",
  },
  // 2026-09-14: two corrections in the same direction. First rewrite
  // replaced "what would actually happen" (a prediction of a real
  // person's reaction the tool cannot actually make) with a reality_check
  // that separates what's known from what's genuinely uncertain, and
  // renamed "Direct Statement" to "Clear Statement" — the three scripts
  // are options, not an escalation ladder. Final correction: reframed
  // "what hiding it costs" from an assumed cost to "what staying silent
  // does" — speaking and silence are equally legitimate choices, so the
  // tool no longer treats silence as inherently the thing going wrong.
  // The old example ("distance already building", "that's not fair to
  // either of us") modeled exactly the assumed-harm framing the prompt
  // now forbids; rewritten to show what silence preserves alongside what
  // it leaves unresolved.
  seoDescription: "Say the hard thing you've been hiding. Understand what staying silent actually does, get an honest reality check instead of a guess, and get it scripted three ways — gentle opening, clear statement, full truth.",
  seoTitle: "How to Say the Hard Thing",
  title: "Truth Bomb",
  tagline: "Get clear on the thing you haven't said.",
  tags: ['honest', 'hard conversation', 'truth', 'unsaid', 'relationship', 'conflict', 'feelings', 'scared', 'say it', 'communication', 'hiding', 'difficult'],
  icon: "💣",
  categories: ['Conversations', 'Relationships', 'Self & Reflection'],
  headerColor: "#e0b8b8",
  description: "Some things get harder the longer they go unsaid. Truth Bomb helps you separate what you know from what you're assuming, understand what speaking — or staying silent — would actually change, and decide what you want to do next.",
  guide: {
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
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You've explained it three times and they still don't get it.",
    give: "The concept, and who you're explaining it to — especially what they're into.",
    get: "Several analogies built from that person's world, with where each one breaks down.",
    edge: "It builds from the listener's interests, not generic comparisons — and tells you where the analogy stops being true.",
  },
  seoDescription: "Explain anything to anyone using their world. Tailored analogies with accuracy ratings, where each one breaks down, and a teaching tip for delivery. Free.",
  seoTitle: "Analogy Generator for Any Topic",
  title: "Analogy Engine",
  tagline: "Explain anything to anyone — using their world.",
  tags: ['explain', 'analogy', 'understand', 'teach', 'simplify', 'metaphor', 'learning', 'teaching', 'communication', 'explanation', 'concept', 'audience', 'clarity'],
  icon: "💡",
  categories: ['Conversations', 'Learning'],
  headerColor: "#d4dde8",
  description: "The right explanation doesn't begin with the subject. It begins with the listener. Tell DeftBrain what you're trying to explain and who you're explaining it to, and we'll translate it into their world.",
  guide: {
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
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You need to message a stranger and not sound like spam.",
    give: "Who they are, and what you want from the connection.",
    get: "Three ready-to-send messages that open differently, and a follow-up for when nobody replies.",
  },
  seoDescription: "Need to contact someone you do not know? Get three ready-to-send first messages that open differently, plus a follow-up for when nobody replies. Free, no signup.",
  seoTitle: "Cold Outreach Message Writer",
  title: "Cold Open Craft",
  tagline: "Make the first message easier to send — and easier to answer.",
  tags: ["cold email", "cold outreach", "first message", "outreach message", "networking message", "linkedin message", "dm", "introduction", "reach out", "follow up", "mentor", "collaboration", "job outreach", "professional networking", "stranger", "email"],
  icon: "📬",
  categories: ['Career', 'Conversations'],
  headerColor: "#d4dde8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Cold Open Craft gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the details below — one of three openers it wrote, nothing reworded.",
    sampleLabel: "The details",
    sampleText: "To: A senior engineering manager at Stripe whose Substack on on-call rotations I follow. Why: Open conversation about a Staff Engineer role she posted about last week. What I know: She wrote a thoughtful piece on reducing pager fatigue. Worked at Square before Stripe. Comments occasionally on Twitter about backend reliability — friendly tone. My background: 8 years backend at fintech startups (Plaid, Brex), currently tech-leading a 6-person team. Shipped a real-time risk system handling 50M events/day. By email.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "Subject line",
        tone: "neutral",
        text: "Staff Engineer role — reaching out from Plaid/Brex background",
      },
      {
        label: "Opens with the Substack, then surfaces the role",
        tone: "green",
        text: "Hi [Name],\n\nI follow your Substack — your piece on reducing pager fatigue was thoughtful.\n\nI noticed you posted a Staff Engineer role last week. I've spent eight years on backend systems at Plaid and Brex, and I'm currently tech-leading a six-person team. I shipped a real-time risk system handling 50M events per day.\n\nIf you have a few minutes to talk, I'd welcome it.\n\n[Your name]",
      },
      {
        label: "Follow-up, if needed",
        tone: "neutral",
        text: "Hi [Name],\n\nJust bumping this up in case it got buried. Still interested in the Staff Engineer role if you have a moment to connect.\n\n[Your name] — Give the first message some room before following up, and adjust if the role has a posted deadline.",
      },
    ],
  },
  faq: [
    { q: "How do I write a cold email that gets a reply?",
      a: "Keep it short, say why you're writing to this person specifically, state the ask in the first lines, and give one or two concrete facts about you that make the ask worth their time. End with an easy question they can say yes to." },
    { q: "Should I mention their work in a cold message?",
      a: "Yes, if it's genuine and specific — one line about something they wrote or did. Generic flattery ('love your work') reads as a template." },
    { q: "When should I follow up on a cold email?",
      a: "After about a week, once, briefly. If a role or event has a deadline, follow up before it." },
    { q: "Will it invent things about me?",
      a: "No. The openers use only the background you give it, so every claim in the message is one you can stand behind." },
  ],
  description: "Reaching out to someone you don’t know can make even a simple message feel awkward. Tell us who you’re contacting, why you’re reaching out, and what you know about them. Cold Open Craft gives you three ready-to-send ways to begin — each opening differently and asking for something different — plus a follow-up for when nobody replies.",
  guide: {
    tips: [
      "Specific real details make outreach feel more natural; invented familiarity does the opposite",
      "Include only the parts of your background that help explain why this connection makes sense",
      "Choose the version whose voice you could plausibly use yourself, not simply the most polished one",
      "Before sending, check names, titles, links, dates, and any other detail that would be awkward to get wrong"
    ]
  }
},

{
  modified: "",
  id: "ToastWriter",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You have to stand up and say something, and you're dreading it.",
    give: "Who it's for, the occasion, your relationship, and any stories or details.",
    get: "Three takes on your requested tone, built only from what you supplied, with delivery notes.",
  },
  // 2026-09-14: rewrite made the 3 versions structural takes on the ONE
  // requested tone (not independent warm/funny/elegant personas regardless
  // of selection) and made non-fabrication a first-class rule, not just a
  // style preference. Copy updated to match — "warm, funny, elegant" as a
  // fixed set was never accurate to what got generated.
  seoDescription: "Write a toast, speech, or tribute that sounds like you. Three takes on your tone, built only from the details you give it, with delivery cues and an emergency closer if you freeze. Free.",
  seoTitle: "Toast & Speech Writer",
  title: "Toast Writer",
  tagline: "Toasts, speeches, and tributes that sound like you.",
  tags: ['toast', 'speech', 'wedding', 'tribute', 'public speaking', 'celebration', 'best man', 'retirement', 'birthday', 'roast', 'memorial', 'farewell'],
  icon: "🥂",
  categories: ['Conversations', 'Relationships'],
  headerColor: "#e0b8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Toast Writer gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the details below — one of three versions it wrote, nothing reworded.",
    sampleLabel: "The details",
    sampleText: "Retirement toast for Maria. Worked together for 12 years; she was my mentor. Stories: She stayed late to help me through my first big presentation. She remembered everyone's birthday. She started every Monday with a corny joke that somehow made the week better. Tone: warm and funny.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples. It also wrote a story-led and a shorter version.",
    sections: [
      {
        label: "The toast (straightforward version)",
        tone: "green",
        text: "I've worked with Maria for twelve years, and she's been my mentor through all of it. I want to tell you a few things about her before she goes.\n\nWhen I was preparing for my first big presentation, I was nervous — really nervous. Maria stayed late to help me through it. No fanfare, no big speech about believing in me. She just stayed, and we worked through it together.\n\nShe remembered everyone's birthday. Not just the milestone ones — everyone's. There's something about that kind of attention that makes you feel seen.\n\nAnd every Monday, without fail, she started the week with a corny joke. The kind that makes you groan a little. But somehow, it always made the week better.\n\nMaria, thank you for twelve years of showing up, remembering, and starting Mondays the right way. Congratulations on your retirement. [RAISE GLASS] To Maria.",
      },
      {
        label: "Delivery tips",
        tone: "neutral",
        items: [
          "When you describe staying late for the presentation, pause briefly after naming it — let the audience picture that night before you explain what happened.",
          "The Monday-joke line invites a small smile before you deliver it. Give yourself a beat to let the audience picture those mornings.",
        ],
      },
    ],
  },
  faq: [
    { q: "How long should a toast be?",
      a: "Usually one to three minutes. A wedding toast from a best man or parent can run to about three; retirement, birthday and dinner toasts work best around one or two. Short and specific beats long and general." },
    { q: "What should a toast include?",
      a: "Who you are to the person, one or two specific stories that show who they are, a line about what they mean to you or others, and a clear finish that raises the glass. Skip inside jokes nobody else will get." },
    { q: "How do I end a toast?",
      a: "Say their name and raise your glass: 'Please join me in raising a glass — to Maria.' A clear final line tells everyone when to drink." },
    { q: "Will the toast sound like me?",
      a: "It is built only from the stories and details you give it, in the tone you choose, and it writes three versions so you can pick the one that sounds most like you. Read it aloud and change any line you wouldn't say." },
  ],
  description: "You know the stories. You know what the person means to you. Toast Writer helps you turn that into something worth saying out loud.",
  guide: {
    tips: [
      "The more stories and details you provide, the more personal the toast becomes",
      "The opening and closing lines are highlighted separately — memorize those especially",
      "Read the delivery tips before practicing — HOW you say it matters as much as WHAT you say",
      "The emergency closer works regardless of where you are in the speech"
    ]
  }
},


{
  modified: "2026-03-11",
  id: "HobbyMatch",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You want a new hobby and keep landing on yoga or painting.",
    give: "What you're like, what you're after, plus your schedule, budget and physical situation.",
    get: "Hobbies you'd never have searched for, matched to your actual constraints, with how to start each.",
    edge: "It reaches well past the obvious list — urban sketching, historical fencing — because you can't search for something you don't know exists.",
  },
  seoDescription: "Discover 5-6 new hobbies you've never considered, matched to your personality, schedule, and budget — plus the first step you can take today. Free, no signup.",
  seoTitle: "New Hobby Finder & Idea Generator",
  title: "Hobby Match",
  tagline: "Discover hobbies you didn't know existed.",
  tags: [
    'hobby', 'hobby ideas', 'find a hobby', 'new hobby', 'what hobby should i try', 'activity ideas',
    'interests', 'bored', 'pastime', 'creative hobbies', 'solo hobbies', 'social hobbies',
    'low cost hobbies', 'learn something new',
  ],
  icon: "🧭 ",
  categories: ['Travel & Events'],
  headerColor: "#ccdfc4",
  description: "Looking for a hobby that actually fits your life? Tell Hobby Match what you enjoy, what you want more of, and the limits that matter. Get a short list of well-matched possibilities, why each might fit, what it takes to try, and an easy first step.",
  guide: {
    tips: [
      "List what you have tried, and why it did or did not work — the reason matters more than the hobby",
      "Tap 'Something weird' in the goals for the most unexpected recommendations",
      "The 'try it once' step is meant to test the hobby before you buy equipment",
      "The wildcard, when there is one, approaches what you asked for from a different angle"
    ]
  }
},

{
  modified: "",
  id: "ProcedureProbe",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A procedure was recommended and you're about to say yes.",
    give: "The procedure and the type of provider.",
    get: "What it is in plain language, whether it's standard for your situation, the exact questions to ask, and the alternatives.",
    edge: "It tells you whether the recommendation itself is standard — the question most patients don't know to ask.",
  },
  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    { q: "What questions should I ask before agreeing to surgery or a procedure?",
      a: "The core set: why this procedure now, what are the realistic success rates and complication rates for someone like me, what are the alternatives (including doing nothing for now), what's the recovery actually like, and what happens if I wait. Procedure Probe generates these tailored to your specific procedure so you walk in with an informed checklist." },
    { q: "How do I know if a recommended procedure is really necessary?",
      a: "Ask what the procedure changes about your outcome, not just your diagnosis — some procedures treat images and lab values more than symptoms. Red flags worth probing: urgency without explanation, no discussion of alternatives, and statistics quoted without your age and health factored in. The tool surfaces the questions that make necessity concrete." },
    { q: "When should I get a second opinion before a procedure?",
      a: "For anything irreversible, expensive, or elective-but-major, a second opinion is standard practice — good surgeons expect it and insurers often cover it. It's especially worth it when the diagnosis is uncertain, the recommendation came fast, or different specialties treat the same condition differently." },
    { q: "What are the alternatives to surgery I should ask about?",
      a: "Depending on the condition: watchful waiting, physical therapy, medication, or less invasive versions of the same procedure. The honest question is 'what would you recommend if this were you' — and the tool helps you frame alternatives so the conversation compares real options rather than yes/no." },
    { q: "Does this replace medical advice?",
      a: "No — it prepares you to get better medical advice. It generates the questions and context for the conversation with your clinician; the decision stays between you and them. Being the patient who asks structured questions measurably changes the quality of the answers you get." },
  ],
  seoDescription: "A doctor recommended a procedure? Before you say yes, get the questions to ask, typical costs, insurance coverage, and red flags. Free, for informed patients.",
  seoTitle: "Questions Before a Procedure",
  title: "Procedure Probe",
  tagline: "Be an informed patient before you say yes.",
  tags: ['doctor', 'dentist', 'procedure', 'medical', 'appointment', 'health', 'informed patient', 'surgery', 'root canal', 'insurance', 'second opinion', 'cost', 'questions to ask'],
  icon: "🔬",
  categories: ['Health & Wellness', 'Home & Daily Life', 'Money'],
  headerColor: "#ccdfc4",
  description: "A procedure was recommended. Before you schedule it, get the briefing. We'll help you understand the procedure, what questions to ask, what it might cost, what recovery looks like, and what to watch for. Not medical advice—just medical literacy.",
  exampleOutput: {
    title: "See what Procedure Probe gives you",
    expandLabel: "See the full real example results ↓",
    nextStepLabel: "What happens with your procedure",
    intro: "This is the complete, real output from an actual Procedure Probe run on the sample situation below — nothing here is invented or shortened.",
    sampleLabel: "Sample situation",
    sampleText: "Wisdom teeth removal (all four), already booked, elective / can wait. Quoted $2,400 after insurance, with a $1,500 annual PPO maximum. Worried about whether all four really need to come out at once.",
    context: "Real run, 2026-09-23 — the tool's own built-in example scenario.",
    sections: [
      {
        label: "In plain language",
        tone: "neutral",
        text: "Wisdom teeth are your third and final set of molars, usually the last to come in. Removal involves numbing the area (or sedating you), cutting through gum tissue if needed, and extracting each tooth — sometimes in pieces if they are impacted (stuck under the gum or bone). The goal is to prevent crowding, infection, decay, or damage to neighboring teeth.",
      },
      {
        label: "Time-sensitive?",
        tone: "yellow",
        text: "If any of your wisdom teeth are actively infected, pressing on a neighboring tooth root, or causing damage that is progressing, delay does carry real risk — but if none of the four is currently causing symptoms or active damage, taking two to four weeks to get a second opinion and review your options is unlikely to change your outcome and may save you from an unnecessary procedure or unnecessary cost.",
      },
      {
        label: "Common but alternatives exist",
        tone: "neutral",
        text: "Removing all four at once is a common approach when all four are impacted or pose a risk, since it means one round of anesthesia and one recovery. However, removing teeth that are fully erupted, not causing problems, and not at elevated risk is not universally agreed upon — some dental professionals advocate a watch-and-wait approach for teeth that are symptom-free and healthy.",
        items: [
          "Watch-and-wait: if one or more teeth are fully erupted and not causing problems, some providers recommend monitoring with periodic X-rays rather than removing them preemptively.",
          "Staged removal: removing only the problematic teeth now and reassessing the others later — reduces immediate cost and recovery burden.",
          "Coronectomy: a less common procedure where only the crown of a deeply impacted tooth is removed, leaving the roots in place to avoid nerve injury risk — relevant mainly when roots are very close to the inferior alveolar nerve.",
        ],
      },
      {
        label: "Questions to ask your provider (6)",
        tone: "neutral",
        items: [
          "“Can you show me on my X-rays exactly why each of the four teeth needs to come out now, and what happens if I wait on any of them?” This forces a tooth-by-tooth clinical justification and helps you distinguish between teeth that are genuinely urgent versus ones that could be monitored.",
          "“Are any of my tooth roots close to the inferior alveolar nerve or the sinus cavity, and how does that affect your technique and the risk of nerve damage?” Root proximity to the nerve is the primary risk factor for temporary or permanent numbness of the lip, chin, or tongue.",
          "“Will you be performing the extractions, or will I be referred to an oral surgeon — and does that affect the quoted price?” General dentists and oral surgeons have different training for complex extractions.",
          "“What type of anesthesia is included in this quote — local only, nitrous oxide, or IV sedation — and what are the risks of the sedation you are recommending?” Sedation level significantly affects both cost and risk profile.",
          "“Is the $2,400 quote a fixed fee, or could it change if the extractions turn out to be more complex than expected?” Some offices quote a base price that can increase if impaction is deeper or surgical time is longer than anticipated.",
          "“Would removing fewer teeth now — for example, only the ones currently causing concern — reduce my cost and still address the immediate risk?” This directly tests whether the all-four recommendation is clinically driven or driven by convenience.",
        ],
      },
      {
        label: "What this usually costs",
        tone: "yellow",
        text: "Dental pricing varies substantially by area and provider type; ask for an itemized fee schedule to compare. Dental PPO plans vary widely in how they classify wisdom tooth extractions, and many apply the cost toward your annual maximum. In this example, the patient was quoted $2,400 after insurance, against a $1,500 annual PPO maximum already factored in — confirm with your insurer exactly how much benefit remains before paying. Worth asking: whether splitting the procedure across two calendar years (two teeth now, two in January) would let you use this year's remaining maximum for the first pair and a fresh maximum for the second, potentially cutting the total out-of-pocket significantly.",
      },
      {
        label: "What to expect",
        tone: "neutral",
        items: [
          "Duration: the extraction appointment for all four teeth commonly runs roughly 45 minutes to an hour and a half, depending on impaction complexity and anesthesia type.",
          "Recovery: most people return to non-strenuous activity within a few days; full soft-tissue healing takes several weeks, and bone remodeling continues for months — the first three to five days are typically the most uncomfortable.",
          "Pain level: expect meaningful soreness and swelling in the first two to four days, generally managed with prescribed or over-the-counter pain medication.",
          "Lifestyle impact: plan to be away from work or school for two to four days, stick to soft foods for roughly a week, and avoid straws, smoking, and vigorous rinsing to protect against dry socket.",
          "Follow-up: typically scheduled around one week after the procedure to check healing; clarify whether it's included in the quoted fee or billed separately.",
        ],
      },
      {
        label: "Red flags to watch for",
        tone: "red",
        items: [
          "The provider cannot point to a specific clinical reason on your X-rays for removing each individual tooth — a recommendation to remove all four without a tooth-by-tooth explanation warrants closer scrutiny.",
          "You feel pressured to schedule immediately without being given time to review your imaging, ask questions, or seek a second opinion — genuine urgency should be explainable in clinical terms.",
          "The quote is presented as a single lump sum with no itemized breakdown showing what is charged for each tooth, the type of impaction, and the anesthesia.",
        ],
      },
      {
        label: "Second opinion recommended",
        tone: "yellow",
        text: "Because the all-four-at-once recommendation involves real surgical risk and a meaningful out-of-pocket cost, a second opinion from an oral surgeon — who can review your X-rays independently — is a reasonable step before committing, especially if any of the four teeth are currently asymptomatic. You are entitled to see your own X-rays, ask for an itemized written quote, and take as much time as you reasonably need to make this decision.",
      },
    ],
    nextStep: "With your own procedure, cost, and concerns, Procedure Probe gives you a plain-language explanation, the questions worth asking your provider, what the procedure usually involves, and the specific red flags worth watching for before you say yes.",
    disclaimer: "This is a real, complete tool run against a realistic sample situation. Educational information to help you have better conversations with your healthcare provider — not medical advice. Always discuss treatment decisions with your doctor or dentist."
  },

  guide: {
    tips: [
      "The questions to ask section is your most powerful tool — bring them to your appointment",
      "Adding your insurance situation helps the cost picture be more accurate",
      "If it flags 'get a second opinion,' that's worth taking seriously",
      "The urgency check will tell you if delaying is risky — important for time-sensitive procedures"
    ]
  }
},

{
  modified: "2026-09-14",
  id: "UpsellShield",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Before you walk into a dealership, a showroom, or a sales call.",
    give: "Where you're going, what you want, and your budget.",
    get: "Your plan, your exit line, and what to watch for if the conversation drifts.",
    edge: "The easiest time to resist pressure is before you're under it.",
  },
  // 2026-09-14: rewrite. The old copy assumed sales environments are
  // scripted and adversarial before knowing the situation, and promised
  // an "exact playbook" the tool can't actually know (real margins, an
  // insider price, quota timing were fabricated to sustain that promise).
  // Reframed around the user's own priorities first, tactics described as
  // possibilities the user may encounter rather than predictions.
  seoDescription: "Walk into any high-pressure sale knowing what matters and what you'll say. Your plan, your exit line, and the moments worth watching for — no invented margins or insider tricks.",
  seoTitle: "Walk Into a Sale Prepared",
  title: "Upsell Shield",
  tagline: "Walk in knowing what matters—and what you'll say.",
  tags: ['upsell', 'sales', 'car dealership', 'pressure', 'negotiate', 'buying', 'pushy', 'negotiation', 'consumer', 'tactics', 'high pressure', 'defense'],
  icon: "🛡️",
  categories: ['Money'],
  headerColor: "#c0d8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 (strict index review: indexed only once it shows real output).
  exampleOutput: {
    title: "See what Upsell Shield gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the situation below. Most of the result is shown; nothing is reworded.",
    sampleLabel: "The situation",
    sampleText: "Buying a used 2020 Honda CR-V from a dealership tomorrow afternoon. Want: the base trim, no extended warranty, no add-ons. Budget: pre-approved for $24,000 max from a credit union. Worry: \"Last time they wore me down for 4 hours and I added $3K of stuff I didn't want.\"",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "Watch for",
        tone: "yellow",
        items: [
          "Monthly payment framing — The conversation could shift away from the total price toward what you would pay per month, making the overall number harder to track. Say: I am working from a total purchase price, not a monthly payment. What is the all-in number before I sign?",
          "Finance office add-ons — After agreeing on the car price, you may be presented with a menu of products — protection plans, GAP coverage, extended warranties — often presented as routine or already included. Before entering the finance office, decide now: your answer to every optional product is no. You can say: I am not adding anything to this purchase.",
          "Trim or upgrade substitution — You may be told the base trim is unavailable, sold, or that a higher trim is a better value for a little more. Say: I came in for the base trim specifically. If that one is not available today, I will need to look elsewhere.",
        ],
      },
      {
        label: "Questions worth asking",
        tone: "blue",
        items: [
          "What is the total out-the-door price, including all taxes, fees, and any dealer charges?",
          "Are there any products, coatings, or protections already added to the vehicle that I would be required to pay for?",
          "What is the interest rate and loan term you are offering, and can I use my own financing instead?",
        ],
      },
      {
        label: "Before you commit",
        tone: "green",
        items: [
          "CHECK: Confirm the total out-the-door price — taxes, title, registration, and all dealer fees included — is at or under $24,000.",
          "CHECK: Read every line of the purchase agreement before signing. If anything appears that you did not agree to, ask for it to be removed in writing before you proceed.",
          "DECIDE NOW, before you walk in: your answer to every optional product in the finance office is no. Having that answer settled in advance makes it easier to hold when you are tired.",
        ],
      },
      {
        label: "If you need to leave",
        tone: "purple",
        text: "“Thanks for your time. I am not ready to agree to this today, so I am going to head out and think it over.”",
      },
    ],
  },
  faq: [
    { q: "How do I avoid add-ons when buying a car?",
      a: "Decide before you walk in that your answer to every optional product is no, negotiate the total out-the-door price rather than a monthly payment, and read every line of the contract for items you didn't agree to." },
    { q: "What is an out-the-door price?",
      a: "The total you'll pay including taxes, title, registration and dealer fees. It's the only number that tells you whether a deal fits your budget." },
    { q: "Does Upsell Shield work for things other than cars?",
      a: "Yes — anywhere you expect to be sold more than you came for: phone plans, funerals, home repairs, gym memberships, travel bookings." },
  ],
  description: "Sometimes it's hard to keep track of what you wanted in the first place once you're in the room. Upsell Shield helps you go in with your priorities clear, recognize the moments that tend to pull people off course, and know what to say when the conversation starts drifting from your plan.",
  guide: {
    tips: [
      "Read through Your Plan before you walk in — it's your own priorities, not the seller's",
      "Your exit line requires no excuse — practice saying it once out loud",
      "Questions Worth Asking are for getting real information, not for sounding sophisticated",
      "Works for any high-pressure situation, not just cars"
    ]
  }
},

{
  modified: "2026-03-11",
  id: "HecklerPrep",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Before a pitch or presentation with a skeptical room.",
    give: "What you're proposing and who's in the audience.",
    get: "The hardest questions that audience will actually ask, with strong answers.",
    edge: "It writes real challenges, not softballs — which is the only kind worth rehearsing.",
  },
  seoDescription: "Anticipate the 10 hardest questions before you pitch or present. A coached answer for each, the real concern behind it, and what to do if you don't know. Free.",
  seoTitle: "Tough Q&A Prep for Presentations",
  title: "Heckler Prep",
  tagline: "Anticipate the hardest questions before they land.",
  tags: [
    'presentation', 'presentation prep', 'pitch', 'pitch prep', 'q&a', 'hard questions',
    'tough questions', 'hostile questions', 'skeptical audience', 'objections', 'defend proposal',
    'executive presentation', 'public speaking', 'question prep',
  ],
  icon: "🎤",
  categories: ['Work & Meetings'],
  headerColor: "#d4dde8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Heckler Prep gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the presentation below — two of its questions, nothing reworded.",
    sampleLabel: "The presentation",
    sampleText: "Q3 security budget increase, to C-suite executives — CFO, COO, and CTO. Proposal: Increase our security tooling and headcount budget by 40% next quarter ($1.2M total) to address the gaps surfaced in the recent pen test. Expected pushback: They'll push on: why now, why this much, why we didn't catch it earlier, whether we explored cheaper alternatives, and what the ROI looks like in 12 months. High stakes.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "“What alternatives were assessed before landing on this number — reduced scope, phased spend, managed services, or something else — and why were they set aside?”",
        tone: "yellow",
        items: [
          "What they're really asking: Tests whether the $1.2M is the result of a genuine cost-optimization process or the first number that was put together. If alternatives were not evaluated, the ask loses credibility.",
          "If you don't know: We have not completed a formal alternatives analysis. That is a gap I can acknowledge directly. What I can speak to is why the gaps themselves require a response of this scale.",
          "Don't say: We looked at options but this was clearly the best path forward.",
        ],
      },
      {
        label: "“Who owns the remediation plan once this budget is approved — your team, a vendor, or a shared structure — and what is the escalation path if a workstream falls behind schedule or encounters an obstacle?”",
        tone: "yellow",
        items: [
          "What they're really asking: Tests whether ownership and escalation paths are defined, or whether approval buys spend without clear accountability.",
          "If you don't know: The accountability structure is still being finalized; I can name that as a gap and bring a proposed RACI to the approval decision.",
          "Don't say: The security team will handle it — avoid any answer that treats ownership as self-evident without naming a decision-maker.",
        ],
      },
    ],
  },
  faq: [
    { q: "How do I prepare for tough questions after a presentation?",
      a: "List the questions you most hope nobody asks, then write a short answer for each — and an honest 'I don't know yet, here's when I'll have it' for the ones you can't answer. Rehearse those answers out loud, not just the talk." },
    { q: "What should I say when I don't know the answer?",
      a: "Say so plainly, say what you do know, and commit to when you'll follow up: 'I don't have that split yet; I'll send it by Friday.' Guessing in front of senior people costs more credibility than admitting a gap." },
    { q: "How do I handle executives pushing on a budget request?",
      a: "Expect three questions: why now, why this much, and what else you considered. Have the breakdown, the alternatives you ruled out and why, and who owns delivery ready before you walk in." },
    { q: "Does Heckler Prep write the answers for me?",
      a: "It drafts model answers built only from what you give it, with blanks where you need to supply a figure or date, and it says what to avoid saying." },
  ],
  description: "About to present, pitch, or propose something? Describe your topic and audience, and Heckler Prep generates the 10 hardest questions they may ask — the skeptical ones, the gotcha ones, the ones you're hoping nobody brings up. Each comes with a coached answer, what the question is testing, and what to do if you don't know the answer.",
  guide: {
    tips: [
      "The questions get harder as the list goes on — if you can handle #10, you're ready",
      "The 'what this tests' line tells you what the question is really about, so you answer that rather than the words",
      "Practice answering out loud, not just reading the model answers",
      "The bail-out strategies are for genuine unknowns — don't fake answers"
    ],
  }
},

{
  modified: "",
  id: "PartyArchitect",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You're hosting and the fear is dead air.",
    give: "The occasion, the vibe, guest count, who's coming, space and budget.",
    get: "A timeline: arrival flow, when food lands, when energy peaks, how it ends.",
    edge: "It designs the flow rather than the menu — the part that decides whether it felt good.",
  },
  seoDescription: "Host a gathering people actually remember. The full event flow — arrival, conversation catalysts, activity timing, and how to mix groups. Free, no signup.",
  seoTitle: "Party & Event Flow Planner",
  title: "Party Architect",
  tagline: "Host events people actually remember.",
  tags: ['party planning', 'event planning', 'party', 'gathering', 'hosting', 'host', 'party flow', 'event flow', 'guest list', 'party timeline', 'housewarming', 'birthday party', 'celebration', 'social gathering', 'party ideas', 'conversation', 'small party'],
  icon: "🎪",
  categories: ['Relationships', 'Travel & Events'],
  headerColor: "#ccdfc4",
  description: "Hosting a gathering and want it to not be boring? Describe the guest list, space, budget, and vibe, and PartyArchitect designs the full event flow: arrival experience, conversation catalysts, when to introduce activities, how to mix groups that don't know each other, and when to shift energy. Not a Pinterest board — an event strategy.",
  guide: {
    tips: [
      "The guest mix description is crucial — 'people who don't know each other' triggers specific mixing strategies",
      "Follow the energy curve — events that stay at one energy level get boring",
      "The conversation catalysts are designed to feel natural, not forced",
      "Budget-conscious options are built in — good events don't require big spending"
    ]
  }
},

{
  modified: "2026-09-14",
  id: "WhereDidTheTimeGo",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "The day is over and you can't account for it.",
    give: "A timeframe and your account of what you did, as you remember it.",
    get: "The day reconstructed from what you actually described, and why it may have felt the way it did.",
    edge: "It reconstructs your account — it doesn't invent minutes you never gave it.",
  },
  // 2026-09-14: rewrite. Reconstruct; do not fabricate. Removed the invented
  // arithmetic (you-think/likely time pairs, invisible-hours categories,
  // honest_capacity) — none of it was grounded in what the user supplied.
  seoDescription: "Ever reach the end of a day wondering where the time went? Reconstruct it as you remember it and see what filled the hours. Free, no invented numbers.",
  seoTitle: "Reconstruct Your Day",
  title: "Where Did the Time Go?",
  tagline: "Make sense of the day that disappeared.",
  tags: ["where did the time go", "reconstruct my day", "time reconstruction", "lost time", "day review", "time gaps", "fragmented day", "unexpected time", "timeline", "how I spent my day"],
  icon: "⏳",
  categories: ['Self & Reflection', 'Tasks'],
  headerColor: "#e0b8b8",
  description: "Ever reach the end of a day wondering where the time went? Walk through it as you remember it. Where Did the Time Go? helps you see what filled the hours, what broke up your day, and why it may have felt so different from the day you expected.",
  guide: {
    tips: [
      "The 'what feels off' field is optional but sharpens the reconstruction — it's what you're actually confused about, not another number to estimate",
      "Times you're unsure of are fine left rough — the tool won't invent false precision",
      "Not every day has a clean 'biggest mismatch' or a useful next-time change, and the tool will say so rather than force one",
      "Recent Days lets you reopen a past reconstruction with one click"
    ]
  }
},

{
  modified: "2026-03-11",
  id: "Giftology",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Someone impossible to shop for, and a date approaching.",
    give: "Everything you know about them — interests, quirks, offhand remarks. Occasion, budget, deadline.",
    get: "Ideas with the reasoning chain from a specific detail about them to a specific gift.",
    edge: "The reasoning is the product. It connects things you already knew but hadn't put together.",
  },
  seoDescription: "Find the perfect gift for the hardest person to shop for. Turn what you know about them into thoughtful ideas, with where to buy and what to write. Free.",
  seoTitle: "Gift Ideas for the Hard to Shop For",
  title: "Giftology",
  tagline: "The perfect gift for the hardest person to shop for.",
  tags: ["gift ideas", "personalized gift ideas", "thoughtful gift ideas", "hard to shop for", "gift for someone who has everything", "what gift should i get", "last-minute gift idea", "gift on a budget", "birthday gift", "thank you gift", "gift for boss", "gift for mom", "wedding gift", "graduation gift", "gift recommendation", "personal gift", "gift card message", "gift presentation", "gift reasoning"],
  icon: "🎁",
  categories: ['Money', 'Relationships'],
  headerColor: "#e0b8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Giftology gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the person below — an excerpt of a longer result, nothing reworded.",
    sampleLabel: "The person",
    sampleText: "My mom, 60s, retired teacher, loves gardening and mystery novels. Practical person who says \"don't get me anything\" every year. Occasion: birthday.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "A substantial, well-made garden journal — not a pretty notebook, but one with structured space for planting dates, what worked, what didn't, and seasonal notes",
        tone: "green",
        text: "A practical person who actively gardens has accumulated years of hard-won knowledge and probably carries it in her head. A journal built for that purpose says: what you know is worth keeping. It is useful rather than decorative, which is exactly the kind of gift she will not feel guilty accepting.",
      },
      {
        label: "A curated set of a few mystery novels from an author she has not read yet, chosen to extend rather than repeat what she already knows",
        tone: "green",
        text: "A mystery lover who reads widely has probably worked through the obvious names, and the most useful gift is a well-reasoned introduction to someone new. This requires actual thought on the giver's part — which is exactly what she will notice, and what separates it from a gift card.",
      },
      {
        label: "A high-quality pair of gardening gloves — genuinely durable, properly fitted, the kind a serious gardener reaches for every single time",
        tone: "green",
        text: "Practical people often under-invest in their own tools because it feels indulgent. A really good pair of gloves — well made, the right weight for her kind of gardening — is something she uses constantly and would not necessarily buy for herself. It is unglamorous in exactly the right way.",
      },
      {
        label: "The wildcard: Book a place on a half-day or full-day garden visit — a notable private or historic garden that opens to the public — and give the ticket as the gift, framed as a day out rather than an object",
        tone: "neutral",
        text: "Every other idea gives her something to use or read at home; this gives her somewhere to go, which approaches her through the gardening interest rather than around it.",
      },
    ],
  },
  faq: [
    { q: "What do you get someone who says they don't want anything?",
      a: "Something useful they wouldn't buy for themselves — a better version of a tool they use constantly — or something that shows thought rather than money, such as a book chosen for them. Practical people accept practical gifts more easily than luxuries." },
    { q: "How do I find a gift for someone who has everything?",
      a: "Look at what they do, not what they own: an upgrade to something they use daily, a consumable they enjoy, or an experience connected to an interest. Specific beats expensive." },
    { q: "What should I write in a gift card?",
      a: "One or two sentences on why you chose it: 'I thought this would be useful for tracking what you grow.' A reason makes even a small gift feel considered." },
    { q: "Does Giftology recommend specific products to buy?",
      a: "It suggests the kind of thing to look for, why it fits the person, and where to find it, rather than naming a product or shop it can't check is in stock." },
  ],
  description: "Tell us a little about who you're shopping for. Giftology turns what you know about them into thoughtful gift ideas—with help choosing, finding, and making each one feel personal.",
  guide: {
    tips: [
      "The more specific you are about the person, the more personal the gift ideas get",
      "Mention things they've said offhand — 'she once mentioned wanting to learn pottery' is gold",
      "The card message is the secret weapon — it makes any gift feel intentional",
      "Use the wildcard when you want to surprise someone who's hard to shop for"
    ],
  }
},

{
  modified: "",
  id: "AwkwardSilenceFiller",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "The conversation just died and you're still standing there.",
    give: "The setting, and any context.",
    get: "Five to seven things you can safely say right now, matched to that setting.",
  },
  seoDescription: "Rescue any awkward silence with 5-7 safe things to say, matched to your setting — work, party, date, or family. Exit lines and what not to say included.",
  seoTitle: "Conversation Starters",
  title: "Awkward Silence Filler",
  tagline: "Context-appropriate conversation rescues on demand",
  tags: ['conversation', 'awkward', 'small talk', 'social', 'silence', 'chat', 'date', 'networking', 'ice breaker', 'what to say', 'first date', 'elevator', 'coworker'],
  icon: "💬",
  categories: ['Conversations', 'Relationships', 'Work & Meetings'],
  headerColor: "#e0b8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what Awkward Silence Filler gives you",
    expandLabel: "See the full real example ↓",
    intro: "Real output from an actual run on the moment below. Most of the result is shown; nothing is reworded.",
    sampleLabel: "The moment",
    sampleText: "First date at a wine bar. We've been talking for 40 minutes and just hit a lull. We matched on a dating app, both into hiking and travel.",
    context: "Real run, 2026-10-07 — relationship: a date; feeling: nervous. One of the tool's own built-in examples.",
    sections: [
      {
        label: "First, the silence itself",
        tone: "green",
        text: "Forty minutes in, a comfortable quiet is actually a sign you're not performing for each other anymore — it means you've moved past the nervous stage where every second has to be filled.",
      },
      {
        label: "Read the room",
        tone: "neutral",
        text: "If they're making eye contact and their shoulders are relaxed toward you, they're comfortable; if they're scanning the room or checking their phone, they might need a low-pressure opener to restart without pressure.",
      },
      {
        label: "Things to say, and where they lead",
        tone: "neutral",
        items: [
          "Observation: “I'm realizing I have no idea what wine you actually like — are you one of those people with strong opinions, or is it more 'if it tastes good, it works'?” — Naturally into what they do like (food, flavors, travel food experiences), which connects back to your shared hiking interest.",
          "Shared experience: “Have you ever been on a hike where you realized halfway through you were completely unprepared — like wrong shoes or something?” — Into stories about specific hikes, lessons learned, maybe somewhere they want to go that they're nervous about.",
          "Genuine curiosity: “When you're planning a trip, are you the person who researches every detail, or do you like to show up and figure it out?” — Into travel philosophy, adventure tolerance, what makes a trip feel good to them — reveals values.",
          "Humor: “What's the most pretentious thing you've ever caught yourself doing at a place like this?” — Into a lighter, more playful tone; you're both admitting you're a little nervous, which releases tension.",
        ],
      },
      {
        label: "What not to say",
        tone: "red",
        items: [
          "Don't apologize for the silence itself ('Sorry, I'm terrible at this')—it makes them feel like they need to fix you or reassure you instead of just being present.",
          "Don't ask generic rapid-fire questions to fill the gap ('So what's your family like, where do you work, what's your biggest fear')—you'll both feel like you're on an interview panel.",
          "Don't mention another date or person you've been on ('This reminds me of this other coffee date I went on')—it takes the focus off them and signals your mind is elsewhere.",
        ],
      },
      {
        label: "A graceful exit, if you want one",
        tone: "neutral",
        text: "“I'm really glad we did this. I've had a genuinely good time talking with you. I should probably head out, but I hope you have a great rest of your week.”",
      },
    ],
  },
  faq: [
    { q: "What do you say when a conversation goes quiet?",
      a: "Often nothing — a pause can mean you're comfortable. When you do want to restart, an observation about where you are or a question about something they've already mentioned works better than a new topic out of nowhere. The real example on this page shows openers for a quiet moment on a first date, with where each one tends to lead." },
    { q: "What are good conversation starters on a first date?",
      a: "Ones built on what you already know about each other — a shared interest, the place you're in — rather than interview questions. Awkward Silence Filler gives several, each with the likely reply and a follow-up, so the conversation keeps going on its own." },
    { q: "Does it work for work situations too?",
      a: "Yes — an elevator with a senior boss, a networking event, a team lunch, a client dinner. You choose who you're with and how nervous you are, and it adjusts how safe or playful the openers are." },
    { q: "What if I just want to leave?",
      a: "Every result includes a graceful exit line, and there's a quick panic button for a single thing to say right now." },
    { q: "Is silence always a bad sign?",
      a: "No. The tool starts by reframing the silence itself, because a lull forty minutes into a good conversation usually means the nerves have worn off, not that it's going badly." },
  ],
  description: "Not every silence needs rescuing. But when it does, we'll help you find something natural to say.",
  guide: {
    tips: [
      "Low-risk options are always safe; use medium-risk when feeling more comfortable",
      "Environmental observations are universally safe across contexts",
      "Exit strategies give you graceful out if conversation just isn't flowing",
      "What NOT to say prevents common mistakes for each setting",
      "Some silences are fine - you don't need to fill every pause"
    ],
    
  }
},

{
  modified: "2026-08-22",
  id: "TipOfTongue",

  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You can picture it, taste it, or hum it, but not name it.",
    give: "Whatever you remember — sensory fragments, vibes, partial facts. A category if you have one.",
    get: "What it most likely is, with alternatives if it's ambiguous.",
    edge: "Built for fragments. You don't need to know the name to start looking.",
  },

  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    {
      q: "How do I find a word that's on the tip of my tongue?",
      a: "Describe whatever you remember — meaning, sound, context, first letter, what it reminds you of, or what it definitely isn't. Tip of Tongue uses those fragments to suggest likely matches and explain what clues led to each one."
    },
    {
      q: "Can it find a movie or song I can't remember the name of?",
      a: "Yes. Describe the era, mood, scene, instruments, voice, plot fragment, half-remembered lyric, or anything else that stuck with you. Tip of Tongue suggests likely matches and gives you details you can use to check them."
    },
    {
      q: "What kinds of things can it identify?",
      a: "Songs, movies and shows, foods and drinks, products, scents, colors, places, fabrics, words and other things you can describe from partial memory. Different clues matter for different categories — flavor and texture for food, for example, or era and vocal style for music."
    },
    {
      q: "What if none of the matches are right?",
      a: "Mark what was close, rule out what was wrong, and add any new detail that surfaced. Even a near miss can help narrow the next round."
    },
    {
      q: "Why does a word disappear right when I try to remember it?",
      a: "A tip-of-the-tongue moment usually means the word feels familiar but isn't immediately accessible. Indirect clues — sounds, syllables, related ideas, or context — can sometimes help bring it back. Describing around the missing word gives you more routes to the answer than simply trying harder to recall it."
    },
  ],

  seoDescription:
    "Can't remember the name of a song, movie, food, product, color, scent or place? Describe the fragments you remember and narrow down what it was. Free, no signup.",

  seoTitle: "Tip-of-the-Tongue Word Finder",

  title: "Tip of Tongue",

  tagline:
    "Describe it from memory — DeftBrain will figure out what it is.",

  tags: [
    "remember",
    "forgot",
    "can't remember name",
    "what is it called",
    "tip of tongue",
    "identify from clues",
    "partial memory",
    "name that thing"
  ],

  icon: "💭",

  categories: ['Just for Fun'],

  headerColor: "#d4dde8",

  description:
    "You know the thing — you can almost see it, taste it, hear it — but you can't name it. Describe whatever you remember—even if it's incomplete. DeftBrain will use those clues to figure it out.",

  guide: {
    tips: [
      "Sensory details can be surprisingly useful — 'it felt creamy and came in a green jar' may be more distinctive than a vague factual description.",
      "Say what it definitely isn't. Ruling out an obvious near-match can narrow the search quickly.",
      "When and where you encountered it can be especially useful — a coffee shop, TV episode, vacation, store, or approximate year.",
      "If one result is close, say so. Knowing what almost fits often reveals which direction to search next."
    ],

  },
},

{
  modified: "",
  id: "MagicMouth",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You need to ask someone for something, and how you ask will decide the answer.",
    give: "Exactly what you are asking for, who you are asking, and the situation around it.",
    get: "The power dynamics, your strongest angle, and the words to use.",
  },
  seoDescription: "Get a refund, an upgrade, a waived fee, or a table at a full restaurant. Find your best angle, get the exact script, and be coached on the delivery. Free.",
  seoTitle: "Ask for a Refund or Upgrade",
  title: "Magic Mouth (M²)",
  tagline: "The art of the ask.",
  tags: ['ask', 'script', 'phone', 'negotiate', 'charm', 'request', 'refund', 'upgrade', 'fee waived', 'customer service', 'escalate', 'nuclear', 'legal', 'leverage', 'complaint'],
  icon: "🗣️",
  categories: ['Conversations', 'Money'],
  headerColor: "#c0d8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Magic Mouth gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the ask below — an excerpt of a longer result, nothing reworded.",
    sampleLabel: "The ask",
    sampleText: "A refund on shoes I wore once — 2 weeks past the return window. The sole started peeling after one wear but I don't have the receipt.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "The read",
        tone: "neutral",
        text: "This is really a product defect complaint wearing the costume of a late return — and that distinction is worth making loudly. The receipt gap is annoying but secondary once the conversation is about a shoe that fell apart on its first outing.",
      },
      {
        label: "Best angle: Lead With The Defect",
        tone: "green",
        text: "If you open with the return, you're already losing — the window and the receipt become the whole story. If you open with the defect, you've reframed this as a quality issue, and the question becomes whether they stand behind what they sell, not whether you followed the right procedure.",
      },
      {
        label: "What to say",
        tone: "green",
        items: [
          "Hi — I'm hoping you can point me in the right direction, because I'm genuinely not sure who handles this kind of thing.",
          "I bought a pair of shoes here and wore them exactly once. By the end of that first day the sole had already started peeling away from the upper — which I'd expect after a year, not a single outing. I don't have the receipt on me, and I know I'm past your usual return window, but this feels less like a return situation and more like the shoes were defective. Is there anything you can do for me — a replacement, a store credit, even just getting it looked at?",
        ],
      },
      {
        label: "If they hesitate",
        tone: "neutral",
        text: "I completely understand the window is the window — I'm not trying to make your job harder. I guess my question is just whether there's any path for something that was defective from the start, even if the process looks different. I'm open to whatever that looks like on your end.",
      },
      {
        label: "Don't do this",
        tone: "yellow",
        text: "Don't lead by mentioning the return window or the missing receipt — those are obstacles, not your opening move. Let them raise the procedural issues; you stay focused on what actually happened to the shoe.",
      },
      {
        label: "Backup: Go Directly To The Brand",
        tone: "neutral",
        text: "If the store hits a dead end, the shoe manufacturer may have a separate warranty or quality claim process that doesn't depend on a retailer receipt or return window at all.",
      },
    ],
  },
  faq: [
    { q: "Can I return something after the return window?",
      a: "Sometimes. If the item was defective rather than unwanted, ask about that specifically — many stores and most manufacturers handle faults separately from ordinary returns. Lead with what went wrong, calmly, and ask what they can do." },
    { q: "Can I get a refund without a receipt?",
      a: "Often you can get a store credit or exchange, especially if the purchase shows on a card statement or in your account. A card or bank statement is worth bringing." },
    { q: "How do I ask for something without sounding entitled?",
      a: "Be specific about what happened, ask a question rather than make a demand ('Is there anything you can do?'), give the person a reason to say yes, and accept a no gracefully — politeness is what makes someone go out of their way." },
    { q: "What kinds of asks does Magic Mouth help with?",
      a: "Refunds, upgrades, discounts, fee waivers, favors and second chances. It also helps you get through a phone tree and plan escalation when the polite ask doesn't work." },
  ],
  description: "Tell it what you want — a refund, an upgrade, a free donut, a waived fee, a table at a full restaurant. AI reads the situation, finds your best angle, writes the exact script, and coaches the delivery. Charm, not fraud.",
  guide: {
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
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You feel something and 'sad' or 'anxious' isn't it.",
    give: "The feeling in your own messy words — when it happens, what it's near but not quite.",
    get: "The precise word, from forgotten English terms to ones other languages have and English doesn't.",
  },
  seoDescription: "Can't name what you're feeling? Describe it in your own messy words and get the precise word back — from English to terms other languages nailed.",
  seoTitle: "Find the Word for a Feeling",
  title: "Name That Feeling",
  tagline: "There's a word for that. Let's find it.",
  tags: ['emotion', 'feelings', 'name a feeling', 'word for a feeling', 'emotional vocabulary', 'mixed emotions', 'hard to describe feeling', 'emotion word', 'foreign language word', 'plain english phrase', 'feeling dictionary', 'personal vocabulary', 'invented phrase', 'nuanced emotion', 'bittersweet', 'saudade'],
  icon: "🎭",
  categories: ['Health & Wellness', 'Self & Reflection'],
  headerColor: "#e0b8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Name That Feeling gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the feeling below — the main result, nothing reworded.",
    sampleLabel: "The feeling",
    sampleText: "That bittersweet feeling on the last day of a vacation — happy I went, sad it's ending, and somehow already nostalgic for it before I'm even home. Happens every time, even on short trips. Worse when the place felt like somewhere I could have lived.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "What you described",
        tone: "neutral",
        text: "You are still in the middle of something good, but already missing it — the joy and the loss are happening simultaneously, not one after the other",
      },
      {
        label: "Best match: bittersweet",
        tone: "green",
        text: "A mixture of happiness and sadness at the same time; the pleasure of something also carrying the pain of its ending or incompleteness. You named this feeling bittersweet yourself, and the word captures exactly what you described: genuine happiness about the trip alongside genuine sadness that it is ending. The word does not require the happiness or sadness to be false or secondary — both are real and present together.",
      },
      {
        label: "Also: wistful (English)",
        tone: "neutral",
        text: "Captures: The premature nostalgia and the sense of longing for a place you could have lived. Wistful can name that particular note of 'what if' without requiring the joy to disappear.. Misses: Does not as naturally include the happiness you felt during the trip itself — wistful leans more into the longing and sadness than into the simultaneous joy of having been there.",
      },
      {
        label: "Also: saudade (Portuguese, sow-DAH-duh)",
        tone: "neutral",
        text: "Captures: The way nostalgia arrives before you have even left — that tender, aching sense of already missing something while it is still happening. Misses: Saudade carries a weight of loss and longing that may outweigh the happiness you described. It is less about the joy of having been there and more about the pain of its distance.",
      },
    ],
  },
  faq: [
    { q: "Is there a word for feeling nostalgic about something before it's over?",
      a: "'Bittersweet' covers the mix of happiness and sadness; 'anticipatory nostalgia' is used for missing something while it is still happening. Portuguese 'saudade' names a deeper longing for something absent." },
    { q: "Why does naming a feeling help?",
      a: "Putting a precise word to a feeling makes it easier to understand, talk about and decide what to do with. A vague 'I feel weird' is harder to work with than 'I feel wistful'." },
    { q: "Does it only give English words?",
      a: "No. It looks across languages — Portuguese saudade, German Wehmut, Japanese mono no aware — and says what each captures and misses for the feeling you described." },
    { q: "What if no word fits?",
      a: "It says so, gives a plain-English description, and, where useful, offers a made-up name so you have a handle for it." },
  ],
  description: "Describe a feeling you can't quite name — that weird mix of emotions, the thing there should be a word for. AI finds the precise word, whether it's in English, German, Japanese, or any language that nailed it.",
  guide: {
    tips: [
      "The weirder and more specific your description, the better the match",
      "If the first word doesn't quite fit, tell it why — it'll dig deeper",
      "Some of the best emotion words come from German, Japanese, Portuguese, and Finnish",
      "This is a surprisingly fun party game — describe a feeling and see who guesses closest"
    ]
  }
},

{
  modified: "2026-09-14",
  id: "WhatsMyVibe",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Before a job application, a dating profile, or a message that matters.",
    give: "A sample of your real writing — texts, emails, posts. Variety helps.",
    get: "The writing patterns actually visible in your sample, and how they might land on a reader.",
    edge: "It reads what you wrote, not what you meant. Nobody can see their own tone.",
  },
  // 2026-09-14: rewrite. The tool analyzes writing, not the writer — removed
  // Energy, Sounds Like, Emotional Temperature, and the Secret Tell, all of
  // which turned a small writing sample into unsupported claims about the
  // writer's inner life. Punctuation Personality and Vocabulary Read (the
  // strongest existing material) became What You Do and Your Signature Moves.
  seoDescription: "Paste your texts, emails, or messages and see the patterns in your writing — your tone, habits, and the ways it might land on a reader. Free.",
  seoTitle: "Tone & Writing Pattern Checker",
  title: "What's My Vibe?",
  tagline: "See the patterns hiding in the way you write.",
  tags: ["writing tone", "tone analysis", "writing patterns", "communication style", "how do I sound", "text messages", "email tone", "work chat", "directness", "humor", "writing habits", "reader impression"],
  icon: "✨",
  categories: ['Conversations', 'Self & Reflection'],
  headerColor: "#e0b8b8",
  description: "How you write leaves impressions you may not notice yourself. Paste some messages you've written and What’s My Vibe points out the patterns in your words—your tone, habits, humor, directness, and the ways your writing might land on someone reading it.",
  guide: {
    tips: [
      "Paste at least a few messages for a meaningful read — one text isn't enough",
      "Mixing casual and professional writing reveals how much the patterns shift by context",
      "Your Signature Moves is often the most eye-opening part",
      "This is a fun one to do side-by-side with a friend"
    ]
  }
},

{
  modified: "",
  id: "TheRunthrough",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "The talk is written and you have one rehearsal left.",
    give: "Your presentation text, notes or outline. Pick Cut, Anticipate or Hook.",
    get: "Trimmed to time with the core intact, the hard questions predicted, or a rewritten open and close.",
  },
  seoDescription: "Rehearse smarter. Cut your talk to time, predict the toughest Q&A with draft answers, and rewrite your opening to land harder. Free presentation coaching.",
  seoTitle: "Speech & Presentation Practice",
  title: "The Run-Through",
  tagline: "Presentation coach in your pocket.",
  tags: ['presentation', 'public speaking', 'rehearsal', 'practice', 'timing', 'cut speech', 'q&a', 'tough questions', 'presentation prep', 'opening', 'closing', 'transitions', 'speech', 'pitch', 'presentation coach'],
  icon: "🎙️",
  categories: ['Career', 'Work & Meetings'],
  headerColor: "#ccdfc4",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 (strict index review: indexed only once it shows real output).
  exampleOutput: {
    title: "See what The Run-Through gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual Cut-mode run on the update below, with a 3-minute target. Most of the result is shown; nothing is reworded.",
    sampleLabel: "The talk (222 words, for a weekly standup that keeps running over)",
    sampleText: "So I wanted to give everyone an update on where we are with the migration project. As you all know, we started this back in March, and honestly it's been a bit of a journey. We hit some unexpected issues with the legacy database schema that nobody had really documented well, so the first month was mostly discovery. Then we spent about six weeks building the migration scripts and testing them against a copy of production data, which took longer than expected because we found several edge cases with old customer records that had inconsistent formatting. We're now about 80% through the actual migration, running it in batches overnight to avoid downtime. There have been a couple of hiccups — one batch failed last Tuesday because of a timeout issue, but we caught it before it affected any customers and fixed the root cause. Current plan is to finish the remaining 20% over the next two weeks and then run a full validation pass before we decommission the old system. I also want to flag that we'll need about a week of buffer for that validation, so the total timeline is pushing about two weeks past our original estimate.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "Trimmed version (147 words)",
        tone: "green",
        text: "Quick update on the migration project. We started in March — first month was mostly discovery because the legacy database schema wasn't well documented. Then about six weeks building and testing migration scripts, which took longer than expected due to edge cases with old customer records that had inconsistent formatting. We're now 80% through the actual migration, running it in batches overnight to avoid downtime. There was a hiccup last Tuesday — one batch failed due to a timeout — but we caught it before it affected any customers and fixed the root cause. Plan is to finish the remaining 20% over the next two weeks, then run a full validation pass before we decommission the old system. That validation needs about a week of buffer, so total timeline is pushing roughly two weeks past our original estimate. Flagging that now so there are no surprises.",
      },
      {
        label: "What was cut, and why",
        tone: "yellow",
        items: [
          "'As you all know' opener and 'honestly it's been a bit of a journey' — Throat-clearing that the standup setting does not need — gets to the facts faster without losing anything the audience requires",
          "'I also want to flag that' lead-in before the timeline slip — The flag itself is kept; the verbal setup for it is redundant in tight standup speech",
        ],
      },
      {
        label: "The point that survives",
        tone: "blue",
        text: "The migration is 80% done, on track to finish in two weeks, but the total timeline is slipping about two weeks past the original estimate due to a needed validation buffer.",
      },
      {
        label: "How to deliver it",
        tone: "purple",
        text: "Slow slightly on 'two weeks past our original estimate' — that is the number people will want to register and possibly react to, so give it a beat. The Tuesday timeout incident is context, not alarm; keep that section matter-of-fact and move through it. End on 'no surprises' with a full stop — do not trail off or immediately invite questions, let the room absorb the timeline news first.",
      },
    ],
  },
  faq: [
    { q: "How do I cut a presentation down to time?",
      a: "Decide the one point the audience must leave with, then cut throat-clearing, backstory and repeated setups before you touch substance. Read the trimmed version aloud with a timer — most people speak about 130–150 words a minute." },
    { q: "How do I prepare for questions after a talk?",
      a: "Use Anticipate mode: give the talk, the audience and what you're asking for, and it predicts the hard questions with draft answers." },
    { q: "Can it help me start and end a talk more strongly?",
      a: "Hook mode rewrites your opening and closing in the tone you choose — provocative, conversational, authoritative or inspirational." },
  ],
  description: "A presentation can look ready on the page and still stumble in the room. The Run-Through helps you find what to cut, what to prepare for, and what needs a stronger landing — before you're standing in front of an audience.",
  guide: {
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
  id: "WhichLife",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Two paths, and the pro/con list didn't settle it.",
    give: "Path A and Path B, described honestly.",
    get: "A vivid ordinary day inside each future — specific, not idealized.",
    edge: "Pro/con lists compare features. This compares what it feels like on a Tuesday, which is what you're actually choosing between.",
  },
  seoDescription: "Torn between two paths? Instead of a pro/con list, read a vivid 'day in the life' for each future so your gut reacts before your brain does. Free, no signup.",
  seoTitle: "Which Life? Compare Two Paths Side by Side",
  title: "Which Life?",
  tagline: "Feel both futures before you choose.",
  tags: ['decision', 'two paths', 'compare choices', 'life decision', 'life choice', 'choose between two options', 'stay or leave', 'move or stay', 'career decision', 'relationship decision', 'future', 'future self', 'day in the life', 'decision simulation', 'imagine both options', 'tradeoff', 'pros and cons', 'what if'],
  icon: "🔮",
  categories: ['Decisions', 'Ideas & Imagination'],
  headerColor: "#f5e0c0",
  description: "Describe two paths you're considering. Instead of another pro/con list, Which Life? imagines an ordinary day in each future so you can see how each one feels to live.",
  exampleOutput: {
    title: "See what Which Life? gives you",
    expandLabel: "See the full real example results ↓",
    nextStepLabel: "What happens with your two paths",
    intro: "This is the complete, real output from an actual Which Life? run on the sample choice below — nothing here is invented or shortened.",
    sampleLabel: "Sample choice (2 years out)",
    sampleText: "Path A: stay in my current city, keep my job, stay close to family, and buy a small place in two or three years. Path B: take the offer in Seattle, with a 30% raise and a genuinely better role, and leave behind twelve years of friendships and parents twenty minutes away.",
    context: "Real run, 2026-09-23 — the tool's own built-in example scenario.",
    sections: [
      {
        label: "Path A — Stay, save, stay close",
        tone: "neutral",
        text: "You are up before your partner, coffee on, the familiar sound of the street below. The commute is the commute — you know which lane to be in, which light takes forever. At your desk by nine, and there is a small satisfaction in that: the competence of a place where you already know where everything is. Mid-morning, your mother texts a photo of something in her garden. You reply immediately because you are twenty minutes away and it costs nothing. Lunch is with two people you have known for seven years — nobody has to explain their history. The afternoon is ordinary in the way afternoons here are ordinary; whether manageable is enough is a question that surfaces around three o'clock, then recedes. On the way home you stop at the place you have been looking at online, the one that might be realistic in another year or so if the savings hold. Dinner is easy. One of your oldest friends drops by unannounced and stays two hours. The question you brought into this year is still there. You have not answered it.",
      },
      {
        label: "Path B — Seattle, new role, starting over",
        tone: "neutral",
        text: "The alarm goes at six-forty and for a half-second you still do not quite know which city this is. The commute is not what you expected — some mornings it is fine, this morning there is a delay and you stand in it, aware that you still do not know anyone well enough to text about something small. The work is harder than the old job — that is mostly good. A problem lands on your desk that you have not seen before, and by noon you have something that might hold. The raise is real. The responsibility is real. Somebody from the team suggests lunch; the conversation is careful in the way it is with people you are still learning — not bad, just not fast yet. At three your phone shows a missed call from home; it lasted four minutes and you were glad for it, and also aware of the distance in a way that does not go away after you hang up. You have started to learn the neighbourhood. You make dinner. The raise is in your account. Twelve years of friendships are in a different time zone, and you have texted two of them this week, and it is not the same as a friend who just drops by.",
      },
      {
        label: "The tradeoff you described",
        tone: "yellow",
        text: "You named it plainly: the money and the work are genuinely better there, and you would be choosing that over the people who show up when something goes wrong — parents twenty minutes away, twelve years of friendships, the kind of presence that does not translate to a different time zone. That is the actual exchange you are weighing: a better role and a 30% raise on one side, and proximity to the people you rely on in a crisis on the other.",
      },
      {
        label: "Watch your reaction",
        tone: "neutral",
        text: "Notice which moments pulled you in and which ones felt off or flat — both are useful. A moment that feels wrong tells you where the sketch missed your actual life; a moment that pulls you in is worth looking at more closely, though a scene can pull because it is unfamiliar or because it is frightening, not only because it is wanted.",
      },
      {
        label: "A question to sit with",
        tone: "green",
        text: "“If your parents were not ageing and the friendships would somehow stay as easy at a distance, would the Seattle offer still feel like a hard choice?”",
      },
    ],
    nextStep: "Describe both paths honestly, with real details about what would change and what would stay the same. Which Life? makes each future concrete enough to react to — not a prediction, but a way to notice what actually pulls you toward, or away from, each one.",
    disclaimer: "This is a real, complete tool run against a realistic sample decision. AI-generated narratives — simulations, not predictions or advice. Notice what draws you in, what pushes you away, and what feels wrong."
  },

  guide: {
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
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Hours later, still replaying it.",
    give: "What happened, ideally their exact words, and the mood you want.",
    get: "Responses in that register — surgical, witty, petty or dignified — plus whether to send at all.",
  },
  seoDescription: "Still replaying what someone said? Describe the moment and get comeback ideas from witty to dignified, plus help deciding whether any response is worth sending.",
  seoTitle: "Comeback & Clapback Generator",
  title: "Comeback Cooker",
  tagline: "For the response that arrived three hours too late.",
  tags: ["comeback", "comeback ideas", "what to say", "witty response", "clever response", "clapback", "awkward comment", "intrusive question", "replay conversation", "cathartic", "petty", "dignified response", "high road", "sharp response", "roast", "regret"],
  icon: "🍳",
  categories: ['Conversations', 'Just for Fun', 'Relationships'],
  headerColor: "#e0b8b8",
  description: "Still replaying something someone said? Tell us what happened, what they said if you remember it, and who you were dealing with. Comeback Cooker gives you several ways you could have answered — from satisfying to sharp to actually useful.",
  guide: {
    tips: [
      "Exact quotes give the tool more to play with than a general description of the insult",
      "Try the same situation in another mood if the first batch is too sharp or too tame",
      "Treat the High Road as a separate option, not a moral judgment about the funnier lines",
      "Comebacks can invent attitude and comic voice; they should not invent facts about your life to make the line work"
    ]
  }
},

{
  modified: "2026-08-22",
  id: "AlternatePath",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You want to know whether one moment in history actually changed anything.",
    give: "A historical event, and the one detail you'd change.",
    get: "A plausible alternate timeline, each consequence cascading into the next.",
    edge: "It explores what might have happened if history changed, rather than what did happen or what you should do.",
  },
  seoDescription: "Pick any moment in history, change one detail, and watch the consequences cascade through a plausible alternate timeline — politics, tech, and culture, up to today.",
  seoTitle: "Alternate History Generator",
  title: "Alternate Path",
  tagline: "What if history went differently?",
  tags: ['alternate history', 'what if history', 'alternate timeline', 'counterfactual history', 'historical what if', 'historical thought experiment'],
  icon: "🌀",
  categories: ['Ideas & Imagination'],
  headerColor: "#b8dcd8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what Alternate Path gives you",
    expandLabel: "See the full real example ↓",
    intro: "Real output from an actual run on the change below. Most of the result is shown; nothing is reworded.",
    sampleLabel: "The change",
    sampleText: "What if the printing press was invented 500 years earlier? (c. 940 CE — movable type spreads through Europe five centuries early.)",
    context: "Real run, 2026-10-07 — reach: the following decades; tone: plausible. One of the tool's own built-in examples.",
    sections: [
      {
        label: "The point where history splits",
        tone: "neutral",
        text: "Around 940 CE, a craftsman in the Rhineland — working in the orbit of Ottonian monastic scriptoria — assembles a workable movable-type press from carved wooden type blocks and a screw-press frame adapted from wine-making, producing reproducible pages at roughly fifty times the speed of a copyist.",
      },
      {
        label: "What actually happened",
        tone: "neutral",
        text: "Movable type printing arrived in Europe only around 1440 CE with Gutenberg's press, after centuries in which manuscript culture kept literacy and textual authority tightly controlled by monastic and clerical institutions. The slow circulation of texts meant that theological, scientific, and legal knowledge remained largely inaccessible outside cathedral schools and monasteries.",
      },
      {
        label: "The alternate timeline",
        tone: "yellow",
        items: [
          "940-970 CE: Ottonian monasteries and cathedral schools in Cologne, Mainz, and Reims begin ordering printed liturgical texts and psalters, slashing the cost of a psalter from a year of a monk's labor to roughly a week of press time. Because: The press's first customers are the same institutions that already purchase manuscripts in bulk — the church — and liturgical texts are the most standardized content available, making them ideal for uniform type-setting.",
          "970-1000 CE: Cheaper printed texts reach merchant families in Cologne and Bruges, and vernacular primers in Old High German and early Old French begin circulating — literacy among urban laypeople rises noticeably within a single generation. Because: Once printed books exist and their price falls, the economic barrier to owning a text drops far enough that prosperous non-clerical households can acquire them, and printers quickly discover that vernacular texts sell to a wider audience than Latin ones.",
          "990-1020 CE: A cluster of theological disputes that in real history would have simmered quietly inside monasteries instead erupts into open public argument, as printed pamphlets carrying competing positions on predestination and the Eucharist circulate through market towns from Saxony to Burgundy. Because: Lay literacy now exists alongside cheap printing, which means doctrinal disagreements can leave the monastery and reach a reading public before bishops can suppress them through manuscript control — the same dynamic that powered the Reformation, arriving four centuries early.",
          "1010-1040 CE: Pope Benedict VIII, confronted with printed pamphlets spreading unauthorized theological opinion, issues a formal condemnation of unlicensed printing in 1013 CE — the first press-censorship decree in history — and demands that bishops appoint examiners to approve texts before printing. Because: An institution whose authority rests partly on controlling access to sacred texts will predictably attempt to regulate the new technology once it threatens that control, and the papacy of the early eleventh century already had both the organizational reach and the doctrinal motivation to act.",
        ],
      },
      {
        label: "The biggest surprise",
        tone: "green",
        text: "The most unexpected but logical consequence is that the Roman Catholic Church's attempt to license the press in 1013 CE inadvertently accelerates the growth of secular municipal institutions by giving city councils a concrete political reason to sponsor independent presses — making urban self-governance structurally stronger four centuries before it fully emerged in our timeline.",
      },
      {
        label: "The butterfly moment",
        tone: "neutral",
        text: "The decision by Rhineland printers in the 960s to produce vernacular-language primers alongside Latin liturgical texts — a purely commercial choice to expand the paying audience — is the smallest change with the largest downstream effect, because it creates lay literacy as a social fact before the church has organized any response to it.",
      },
      {
        label: "Plausibility: 6/10",
        tone: "neutral",
        text: "By October 2026 in this timeline, the Western world has had roughly 1,080 years of print culture rather than 580 — long enough that the Enlightenment, or something recognizable as its equivalent, may have arrived in the twelfth or thirteenth century rather than the eighteenth. Daily life would be shaped by layers of institutional consequence too deep to summarize simply, but one vivid detail stands out: the concept of an 'oral tradition' in European cultures would be an artifact of scholarly study rather than living memory, because cheap text has been woven into everyday communication for so long that no one alive remembers a world without it. The political map of Europe might bear almost no resemblance to the one in our timeline, since the press-censorship battles of the early eleventh century could have reshuffled the church-state relationship centuries before feudalism consolidated into the nation-state forms we know.",
      },
    ],
    disclaimer: "An imagined history. Each step says what really happened instead, so the fiction stays visibly separate from the record.",
  },
  faq: [
    { q: "How does an alternate history generator work?",
      a: "Name one change to the past — an invention arriving early, a battle going the other way — and Alternate Path traces what would plausibly follow, step by step, with the reason each step follows from the last and what really happened instead." },
    { q: "Is it historically accurate?",
      a: "The starting facts and the “what actually happened” notes are real history; everything after the change is reasoned speculation. It rates its own plausibility out of 10 so you can see how far the chain has stretched." },
    { q: "What makes a good “what if”?",
      a: "A specific moment with a clear change — “What if movable type spread in 940 CE” gives a richer timeline than “what if Europe were different.” Small changes often produce the most surprising consequences." },
    { q: "How far forward does it go?",
      a: "You choose: the next few decades after the change, or all the way to today, when it also describes what daily life might look like now." },
    { q: "Can I use it for fiction or worldbuilding?",
      a: "Yes — the timeline, the “butterfly moment” and the biggest surprise are built to spark ideas. The weird tone loosens the plausibility rules for stranger worlds." },
  ],
  description: "One small change can rewrite centuries. Name the moment you'd change, and follow what happens next — politics, technology, culture, ordinary life — for fifty years or five hundred.",
  guide: {
    tips: [
      "Specific pivots produce richer timelines — 'What if Napoleon won at Waterloo' beats 'What if France was different'",
      "Try small changes for surprising big consequences",
      "Modern events work too — not just ancient history",
      "The fun is in the unexpected second- and third-order effects"
    ],

  }
},


{
  // FULL RENAME, 2026-09-06: PlotHole -> PlotHoleFinder (id/URL/catalog
  // fields only — the backend route stays backend/routes/plot-hole.js,
  // the i18n prefix stays plh_*, and localStorage keys stay
  // plothole-result/plothole-history. See audit/tool-notes/PLOTHOLE-NOTES.md
  // and audit/REWRITE-INSTALL-KIT.md §7 for the full checklist this
  // followed. Also a V2 REWRITE of the tool itself: the old version forced
  // 4-7 "holes" and a mix of severities regardless of what the evidence
  // supported; this version sorts a genuine contradiction from an
  // unexplained gap, a debatable character decision, or a convenience
  // BEFORE deciding whether the story actually broke its own logic.
  modified: "2026-09-06",
  id: "PlotHoleFinder",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Something in the plot bothered you and you can't articulate what.",
    give: "The title and media type. A specific scene, rule, or decision helps.",
    get: "Which of those are genuine contradictions, which are just gaps or debatable choices, and why.",
    edge: "It's more likely to tell you something isn't actually a plot hole than to pad the list to look impressive.",
  },
  seoDescription: "Name any movie, show, book, or game and see where its own logic actually breaks — sorted from genuine contradictions to gaps, conveniences, and debatable decisions. Free.",
  seoTitle: "Plot Hole Finder for Movies, Shows & Books",
  title: "Plot Hole Finder",
  tagline: "Find where the story stops adding up",
  tags: ['plot hole', 'plot holes', 'plot hole finder', 'story logic', 'movie logic', 'show logic', 'book plot', 'game story', 'continuity error', 'continuity', 'timeline contradiction', 'rule contradiction', 'story inconsistency', 'unexplained gap', 'plot convenience', 'character decision', 'fiction analysis', 'find plot holes'],
  icon: "🕳️",
  categories: ['Just for Fun'],
  headerColor: "#b8dcd8",
  description: "Name a movie, show, book, or game. Plot Hole Finder looks for places where the story's own rules, timeline, character knowledge, or cause-and-effect stop adding up—and separates genuine holes from things the story actually explains.",
  guide: {
    tips: [
      "The 'Defend a Hole' mode is great for settling arguments with friends",
      "Ask about a specific scene or decision for a focused answer instead of a scan of the whole work",
      "Not every 'why didn't they just...?' question is a plot hole — the tool is built to tell the difference"
    ]
  }
},

{
  modified: "",
  id: "FanTheory",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You've finished it and want to keep thinking about it.",
    give: "The title, and a direction if you have one.",
    get: "A theory that cites actual plot details as evidence and holds together internally.",
  },
  seoDescription: "Name any movie, show, book, or game and get a wild but defensible fan theory with cited evidence and a smoking gun. Or grade your own. Free, no signup.",
  seoTitle: "Fan Theory Generator for Any Movie or Show",
  title: "Fan Theory",
  tagline: "Wild but defensible fan theories about anything",
  tags: ['fan theory', 'fan theories', 'theory generator', 'movie fan theory', 'tv fan theory', 'book fan theory', 'game fan theory', 'plot theory', 'hidden meaning', 'plot twist', 'secret villain', 'shared universe', 'timeline theory', 'simulation theory', 'fiction analysis', 'story evidence', 'grade my theory'],
  icon: "🧵",
  categories: ['Ideas & Imagination'],
  headerColor: "#b8dcd8",
  description: "Create a wild but defensible fan theory about any movie, show, book, or game—or put your own theory to the test.",
  guide: {
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
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You want to be made fun of accurately.",
    give: "Your resume, dating profile, LinkedIn, or whatever else.",
    get: "A roast aimed at what is specifically ridiculous about what you sent.",
  },
  seoDescription: "Paste your resume, dating profile, LinkedIn bio, or any text and get a personalized comedy roast targeting your specific content. Three heat levels, zero generics.",
  seoTitle: "Roast My Resume or Bio",
  title: "Roast Me",
  tagline: "Find the clichés, buzzwords, humblebrags, and cringeworthy phrases you stopped noticing long ago.",
  tags: ['roast', 'funny', 'comedy', 'humor', 'joke', 'resume', 'dating', 'linkedin', 'burn', 'fun'],
  icon: "🔥",
  categories: ['Career', 'Just for Fun'],
  headerColor: "#ccdfc4",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what Roast Me gives you",
    expandLabel: "See the full real example ↓",
    intro: "Real output from an actual run on the LinkedIn bio below, unedited.",
    sampleLabel: "The LinkedIn bio",
    sampleText: "Experienced Product Manager | 7+ Years Turning Coffee Into Roadmaps ☕ — I'm passionate about building products that matter at the intersection of human insight and scalable technology. Key wins: Led cross-functional team to 3x revenue (through strategic pivoting and stakeholder alignment) • Championed data-driven culture (literally brought in a whiteboard) • Managed $2M budget (mostly meetings about meetings). Currently seeking my next opportunity to disrupt, iterate, and move the needle. 🚀",
    context: "Real run, 2026-10-07 — heat level: medium. One of the tool's own built-in examples.",
    sections: [
      {
        label: "First impression",
        tone: "neutral",
        text: "A product manager who has discovered corporate Mad Libs and is very proud of their newfound vocabulary.",
      },
      {
        label: "The roast",
        tone: "red",
        items: [
          "Turning Coffee Into Roadmaps is a nice way to say you attended meetings while caffeinated.",
          "You didn't champion a data-driven culture — you bought a whiteboard. That's what Staples calls a Tuesday.",
          "3x revenue through strategic pivoting and stakeholder alignment is how you describe something that worked and you were in the room when it happened.",
          "Mostly meetings about meetings is the most honest thing you've written, and it's buried in parentheses like you hoped nobody would notice.",
          "Obsessed with the why behind user behavior is a polite way of saying you ask people why they do things, which is called talking to humans.",
          "You want to disrupt, iterate, and move the needle — three things that sound important and mean nothing without specifics.",
        ],
      },
      {
        label: "The summary",
        tone: "yellow",
        text: "This is a solid reminder that LinkedIn bios are where specificity goes to die. You've got real wins buried under so much jargon that even you don't quite remember what you actually did — and that whiteboard comment proves you know it. One more round of feedback and you'll have said nothing perfectly.",
      },
      {
        label: "One nice thing",
        tone: "green",
        text: "The self-aware joke about meetings-about-meetings shows you actually see what's happening; you just needed to trust that observation instead of drowning it in corporate vocabulary.",
      },
    ],
  },
  faq: [
    { q: "How do I get my resume or LinkedIn bio roasted?",
      a: "Paste the text, pick a heat level — Gentle, Medium or Scorched — and Roast Me writes lines aimed at what you actually wrote: the buzzwords, the vague wins, the humblebrags. The real example on this page is a LinkedIn bio at Medium." },
    { q: "Is the roast useful or just funny?",
      a: "Both. Every line points at something specific, so it doubles as an edit list — the parts people would quietly roll their eyes at. Each roast also includes one genuinely nice observation." },
    { q: "What can I roast?",
      a: "Resumes, LinkedIn profiles, dating profiles, emails, social posts — any text. It detects the type and goes after what that kind of writing usually gets wrong." },
    { q: "How harsh is Scorched?",
      a: "Sharp, but aimed at the writing rather than at you as a person. Gentle is closer to friendly teasing; Medium is in between." },
    { q: "Can I get different jokes on the same text?",
      a: "Yes — roast again for a fresh set of lines, or switch heat levels to hear the same flaws at a different temperature." },
  ],
  description: "Paste your resume, dating profile, LinkedIn bio, email, tweet, or any text and get a personalized comedy roast. Three heat levels: Gentle, Medium, and Scorched. Every roast line targets specific content you submitted — zero generic insults. DeftBrain detects content type automatically and targets the right things: buzzwords in resumes, clichés in dating profiles, humblebrags on LinkedIn. Every roast includes one genuinely nice observation, plus a shareable one-liner you'll either laugh at or immediately regret showing your friends. The roast is the mechanism; noticing what you actually wrote is the point.",
  guide: {
    tips: [
      "Scorched is funniest on content that takes itself too seriously",
      "Try roasting the same content at different heat levels",
      "Hit 'Roast Again' to get completely different lines on the same content"
    ],

  }
},

{
  modified: "2026-09-14",
  id: "TimeWarp",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You want something funny, not a history lesson.",
    give: "A modern thing and a historical period.",
    get: "A playful collision, a short reflection on what it reveals, and a next collision to try.",
  },
  // 2026-09-14: ground-up redesign. Time Warp no longer offers a format
  // menu (explain/review/news/letter/debate/ad) or historical footnotes —
  // the model picks whatever form makes the collision funniest, and
  // history is deliberately kept modest rather than positioned as
  // something the user learns. See backend/routes/time-warp.js
  // PERSONALITY: "Time Warp is not a history tool. History is the
  // playground." Replaces the prior "secretly educational" framing.
  seoDescription: "Collide anything modern with any historical era and get a playful, imaginative result, plus a short reflection on what the collision reveals about the modern thing.",
  seoTitle: "History Meets Modern Life: Comedy",
  title: "Time Warp",
  tagline: "Collide anything modern with any historical period.",
  tags: ['history', 'time', 'historical', 'modern', 'funny', 'ancient', 'medieval', 'comedy', 'fun'],
  icon: "⏰",
  categories: ['Ideas & Imagination', 'Just for Fun'],
  headerColor: "#b8dcd8",
  description: "What happens when something from today lands in a world that was never ready for it? Time Warp collides the present with the past to reveal just how strange both of them really are.",
  guide: {
    tips: [
      "The more specific your modern thing, the funnier the result",
      "'Same Combo, Different Warp' reruns the pairing for a fresh take",
      "'One More?' teases the next collision worth trying"
    ]
  }
},

{
  modified: "",
  id: "WrongAnswersOnly",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You want an answer that's wrong on purpose.",
    give: "Any real question, and how straight-faced you want the answer.",
    get: "A confident, impeccably structured, completely incorrect answer.",
  },
  seoDescription: "Ask any real question and get a confidently, beautifully wrong answer — fake studies, invented experts, nonsense equations. Three absurdity levels. Real answer on toggle.",
  seoTitle: "Wrong Answers Only: Confidently Wrong",
  title: "Wrong Answers Only",
  tagline: "Ask anything — get a confidently, beautifully wrong answer",
  tags: ['wrong', 'funny', 'trivia', 'quiz', 'comedy', 'fake', 'humor', 'absurd', 'fun'],
  icon: "🙃",
  categories: ['Ideas & Imagination', 'Just for Fun'],
  headerColor: "#b8dcd8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what Wrong Answers Only gives you",
    expandLabel: "See the full real example ↓",
    intro: "Real output from an actual run. Every “fact” in it is invented on purpose — that's the joke — and the real answer comes at the end.",
    sampleLabel: "The question",
    sampleText: "Why do we yawn when we see someone else yawn?",
    context: "Real run, 2026-10-07 — playful mode. One of the tool's own built-in examples.",
    sections: [
      {
        label: "The confidently wrong answer",
        tone: "yellow",
        text: "Contagious yawning is driven by what we call synchronized laryngeal resonance frequency matching, a phenomenon first documented by Dr. Marcus Vollrath at the Max Planck Institute in 2009. When you observe someone yawn, your brain's auditory cortex detects the specific acoustic frequency of their yawn—typically between 487 and 523 Hz—and your own laryngeal muscles involuntarily match this frequency to create harmonic alignment. This is actually a vestigial predator-detection system: in our evolutionary past, when one member of a group yawned, it signaled the presence of a nearby threat, and synchronized yawning allowed the group to achieve acoustic camouflage by matching ambient sound patterns. Approximately 78% of humans retain this reflex, though interestingly, psychopathic individuals show zero contagion rates, which is why they're useful as control subjects. The response is strongest between 4 and 6 seconds after the observed yawn, and recent neuroimaging by the Copenhagen Institute (2023) shows that the superior temporal sulcus actually vibrates in sympathy with the observed yawn's frequency.",
      },
      {
        label: "The expert tip (also wrong)",
        tone: "yellow",
        text: "Elite performers like professional athletes and opera singers actually train their laryngeal muscles to resist synchronization through a technique called Competitive Yawn Independence, allowing them to maintain mental focus in group settings without being derailed by others' acoustic frequencies.",
      },
      {
        label: "How wrong it was: 8/10",
        tone: "neutral",
        items: [
          "Laryngeal resonance frequency matching accounts for 94% of contagious yawn transmission in laboratory settings — what's actually wrong: There is no established acoustic frequency theory of yawning; the real answer involves mirror neurons and theory of mind, not sound matching",
          "Deaf individuals show a 12% contagion rate due to vibration sensing through bone conduction — what's actually wrong: Contagious yawning in deaf people is actually similar to hearing people and involves visual processing, not vibration; this invents an impossible mechanism",
          "The superior temporal sulcus exhibits measurable oscillation when observing yawns, with amplitude correlating to yawn duration — what's actually wrong: The STS is involved in social perception, but it doesn't vibrate; this confuses brain activation with literal physical resonance",
        ],
      },
      {
        label: "The real answer",
        tone: "green",
        text: "The actual mechanism involves mirror neurons, theory of mind simulation, and social bonding—you yawn when you see someone yawn because your brain is modeling their mental state, not because of sound frequencies.",
      },
    ],
    disclaimer: "Names, studies and numbers in the wrong answer are made up for the joke, including any that borrow real-sounding institutions.",
  },
  faq: [
    { q: "What is Wrong Answers Only?",
      a: "A comedy tool: ask any real question and get an impressively confident, well-structured and completely wrong answer — invented studies, fake experts and all. The real answer is one button away afterwards." },
    { q: "Is any of the answer true?",
      a: "No — the wrong answer is wrong on purpose, including the sources it cites. Each piece of fake evidence comes with a note on what's actually wrong about it, and the real answer is shown at the end." },
    { q: "What questions work best?",
      a: "Simple, familiar questions — why we yawn, why the sky is blue, why cats knead — because everyone half-knows the real answer, so the confident nonsense lands harder." },
    { q: "Can I use it to fool my friends?",
      a: "That's what deadpan mode is for. It reads straight-faced enough that people may not notice at first, so do tell them before it spreads any further." },
    { q: "Will it answer any question?",
      a: "Not quite: questions where a convincingly wrong answer could hurt someone, such as medical doses or emergencies, are declined rather than played for laughs." },
  ],
  description: "Ask a real question. Get an impressively wrong answer, delivered with total confidence. There is a button for the real answer afterwards, if you want it.",
  guide: {
    tips: [
      "Simple, well-known questions get the funniest wrong answers",
      "Deadpan mode fools friends who won't realize it's wrong at first",
      "Try the same question in different categories for wildly different answers"
    ],

  }
},

{
  // Ground-up rebuild (2026-09-11), installed from an owner-supplied
  // rewrite: replaces the six-mode weekly-audit design (Weekly Audit, Week
  // Planner, Quick Check, Daily Check-In, Energy Forecast, Journal — energy
  // budgets, performance-cost arithmetic, crash forecasting) with two
  // states: log one interaction, then review patterns across your logs.
  // No energy score, no weekly budget, no crash prediction — see Before
  // the Crash for that boundary.
  modified: "2026-09-11",
  id: "SocialBatteryAdvisor",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You want to know which interactions actually cost you energy, not just guess.",
    give: "One interaction at a time — what it was, your energy before and after, and how much you had to be 'on'.",
    get: "Patterns and contrasts across what you've logged, and one small experiment worth testing next.",
    edge: "It won't score your week or forecast a crash — just what your own logged interactions actually show.",
  },
  seoDescription: "Notice what leaves you with more energy — and what leaves you with less. Log an interaction before and after; over time, spot patterns in your own experience and decide what might be worth changing. Free, no signup.",
  seoTitle: "Social Energy Tracker",
  title: "Social Battery Advisor",
  tagline: "Learn which interactions affect your energy — and what makes the difference.",
  tags: ['social battery', 'social energy', 'interactions', 'drained', 'energized', 'recharge', 'socializing', 'being on', 'energy patterns', 'after socializing', 'track energy'],
  icon: "⚡",
  categories: ['Health & Wellness', 'Relationships'],
  headerColor: "#e0b8b8",
  description: "Notice what leaves you with more energy — and what leaves you with less. Log an interaction before and after; over time, Social Battery Advisor helps you spot patterns in your own experience and decide what might be worth changing.",
  guide: {
    tips: [
      "Log right after the interaction — energy ratings from memory a day later are a guess, not data",
      "One log tells you what happened once; it takes two or three comparable logs before a pattern means much",
      "There's no energy score or weekly budget here — just what your own logs show",
      "The tool suggests at most one experiment at a time — try that before logging a dozen more interactions",
      "If a note sounds like you're heading toward a bigger crash, not just one draining interaction, the tool may point you to Before the Crash instead of another experiment"
    ]
  }
},
{
  modified: "2026-03-24",
  id: "PronounceItRight",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Before you have to say it out loud in front of someone.",
    give: "The word, its category, and your native language.",
    get: "A phonetic guide built from sounds you already have, plus what to avoid.",
    edge: "It calibrates to your native language — the hard part of a word is different for a Spanish speaker than a Mandarin one.",
  },
  seoDescription: "Type any name, dish, brand, or place and get the clearest pronunciation guidance possible from the spelling and context you give — tuned to your native language, honest about what's genuinely uncertain.",
  seoTitle: "How to Pronounce Any Word",
  title: "Pronounce It Right",
  tagline: "Know how to say it before you have to.",
  tags: ['pronounce', 'pronunciation', 'how to pronounce', 'how to say', 'pronunciation guide', 'mispronounce', 'phonetic spelling', 'phonetics', 'ipa', 'syllables', 'stress', 'mouth position', 'native language', 'foreign word', 'foreign name', 'name pronunciation', 'place pronunciation', 'food pronunciation', 'brand pronunciation', 'phrase pronunciation', 'restaurant', 'travel'],
  icon: "🗣️",
  categories: ['Conversations', 'Learning'],
  headerColor: "#9a4040",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Pronounce It Right gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the name below — the main result, nothing reworded.",
    sampleLabel: "The name",
    sampleText: "Siobhan (a name), for an American English speaker",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "shih-VAWN  ·  /ʃɪˈvɔːn/",
        tone: "green",
        text: "Two syllables with clear stress on the second: shih-VAWN — the first syllable is short and unstressed, the second carries the weight.",
      },
      {
        label: "Sounds like",
        tone: "neutral",
        text: "Rhymes with 'dawn' — the final syllable sounds like VAWN, as in 'fawn' with a V at the front.",
      },
      {
        label: "Common mistakes",
        tone: "yellow",
        items: [
          "Reading 'Si' as 'see' and 'bh' as 'b' produces something like 'see-uh-BON', following English letter-by-letter reading habits. The whole name sounds like shih-VAWN — the opening 'Siob' sounds like 'shiv' and the 'an' ending sounds like 'awn'.",
          "Pronouncing the 'h' in 'Siobh' as a separate sound or omitting the SH entirely. The 'S' and 'iobh' together produce a SH sound followed by a V — say shih-VAWN as a single smooth unit.",
        ],
      },
      {
        label: "If you are meeting them",
        tone: "green",
        text: "If you are meeting this person, you might say: 'I want to make sure I say your name correctly — could you say it for me?' A common pronunciation is shih-VAWN, but individuals may say it differently.",
      },
    ],
  },
  faq: [
    { q: "How do you pronounce Siobhan?",
      a: "shih-VAWN, with the stress on the second syllable (IPA /ʃɪˈvɔːn/). It is an Irish name: 'Si' sounds like 'sh' and 'bh' like 'v'. As with any name, the person's own pronunciation is the one to use." },
    { q: "How can I check how someone says their own name?",
      a: "Ask once, early and simply: 'I want to make sure I say your name right — how do you say it?' Then use it. Email signatures, voicemail greetings and video introductions are other good sources." },
    { q: "Does Pronounce It Right only do names?",
      a: "No. It covers names, places, food, brands, music and art, and foreign phrases, and it gives the stress, a sounds-like guide and the common mistakes for each." },
    { q: "Can it adjust for my own accent?",
      a: "Yes. Tell it your first language or accent and the guide is written for the sounds you already make." },
  ],
  description: "Type a name, food, place, brand, word, or phrase. Pronounce It Right shows you how to say it, where the stress goes, and how to make unfamiliar sounds — with guidance adapted to the language you already speak. When the spelling alone can't settle a reading (a name especially), it says so instead of guessing.",
  guide: {
    tips: [
      "Your native language selection matters — a Spanish speaker needs different guidance than a Korean speaker for the same word.",
      "For a person's name, the guide gives the common reading when one exists plus a respectful script for confirming it — spelling alone can't tell you how someone says their own name.",
      "When a reading could go more than one way, the guide says so and explains what context would settle it, instead of picking one and hoping.",
      "IPA notation is hidden by default but available if you read it — tap 'Show IPA' in the result.",
      "'Hear it' speaks the exact IPA transcription shown above, not a guess from the raw spelling — so it only appears when the guide was confident enough to produce genuine IPA, and it's a convenience, not proof of the correct reading."
    ]
  }
},
{
  modified: "",
  id: "TheDebrief",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "The meeting ended and nobody wrote anything down.",
    give: "The transcript — Zoom captions, Teams, Otter. Pick Distill, Follow Up or Spot Patterns.",
    get: "Decisions, action items with owners, open questions, and drafted follow-up messages.",
  },
  seoDescription: "Paste any meeting transcript and instantly get the decisions, action items with owners and deadlines, and ready-to-send follow-ups — without digging through notes.",
  seoTitle: "Meeting Notes to Action Items",
  title: "The Debrief",
  tagline: "The meeting ended. Now figure out what actually happened.",
  tags: ['meeting', 'transcript', 'notes', 'minutes', 'action items', 'decisions', 'follow up', 'standup', 'recap'],
  icon: "📋",
  categories: ['Decisions', 'Tasks', 'Work & Meetings'],
  headerColor: "#d4dde8",
  description: "What did we actually decide? Who's doing what? And what still needs follow-up? Paste your meeting transcript or notes. We'll pull out the decisions, commitments, deadlines, and loose ends.",
  exampleOutput: {
    title: "See what The Debrief gives you",
    expandLabel: "See the full real example results ↓",
    nextStepLabel: "What happens with your meeting",
    intro: "This is the complete, real output from an actual The Debrief run on the sample meeting note below — nothing here is invented or shortened.",
    sampleLabel: "Sample meeting transcript (excerpt)",
    sampleText: "Weekly v2 product review. Sarah (Eng Lead) flags a 3-week slip risk on the full analytics dashboard due to slow aggregation queries and a customer-level data exposure issue. Priya wants the dashboard in given direct customer feedback. Marcus proposes shipping a simplified version (top-line metrics only, no drill-down) at launch, with the full version as a fast-follow. Priya agrees. PM will write up the simplified scope by end of day; Sarah will give a real engineering estimate tomorrow.",
    context: "Real run, 2026-09-23 — the tool's own built-in example scenario, Distill mode.",
    sections: [
      {
        label: "Meeting summary",
        tone: "neutral",
        text: "Product scope alignment meeting — a structured weekly review that moved from status update into a live scope decision. Duration: 15–25 minutes, based on transcript volume and the focused single-topic resolution. Weekly v2 product review where the team resolved a scope conflict over the analytics dashboard, deciding to ship a simplified version at launch with a full version to follow.",
      },
      {
        label: "At risk",
        tone: "red",
        items: [
          "The fast-follow full analytics dashboard has no named owner, no deadline, and no definition of what distinguishes it from the v1 version being shipped — it could drift without a follow-up commitment.",
          "Sarah's estimate for the simplified dashboard ('about a week') is a rough read, not a confirmed scope — her real estimate is not due until tomorrow, meaning the launch date has not actually been validated yet.",
        ],
      },
      {
        label: "Decisions made (2)",
        tone: "green",
        items: [
          "The analytics dashboard will ship as a simplified version (top-line metrics only, no drill-down) at v2 launch rather than being cut or delayed. Engineering flagged a three-week slip risk due to slow aggregation queries and a security issue; Marcus proposed a scoped-down version, which Priya preferred over shipping nothing. Proposed by PM, confirmed by Priya, accepted by Sarah. Can this still change? Probably — could reopen if Sarah's real estimate tomorrow shows the simplified version is also not achievable in the launch window.",
          "The full analytics dashboard with drill-down capability is deferred to a fast-follow release after v2 launch. The security issue with customer-level data exposure and slow aggregation queries made the full version infeasible for the current launch timeline. Proposed by PM, agreed by Priya. Can this still change? Probably — timing and ownership of the fast-follow have not been set.",
        ],
      },
      {
        label: "Action items (2)",
        tone: "neutral",
        items: [
          "[High] Write up the v2 scope — specifically what is in scope for the simplified analytics dashboard. Owner: Me (PM). Due: end of day today (Wednesday, September 23, 2026).",
          "[High] Provide a real engineering estimate for the simplified dashboard. Owner: Sarah (Eng Lead). Due: tomorrow (Thursday, September 24, 2026). Depends on: PM scope write-up may inform the estimate boundary.",
        ],
      },
      {
        label: "Tensions detected",
        tone: "yellow",
        text: "Analytics dashboard at launch: include vs. cut. Priya wanted the dashboard in given direct customer feedback; Sarah had flagged a multi-week slip risk due to technical issues. Resolution: resolved by Marcus's suggestion to ship a simplified version — both positions partially accommodated.",
      },
      {
        label: "Open questions (3)",
        tone: "yellow",
        items: [
          "What is the exact scope of the simplified dashboard — which top-line metrics are included, and what is explicitly excluded? The concept was agreed on but the content was not defined in the meeting. Suggested owner: Me (PM), with input from Marcus and Sarah.",
          "What is the timeline and owner for the full analytics dashboard fast-follow? The meeting focused on resolving the immediate launch decision; the fast-follow was named but not planned. Suggested owner: Me (PM) to initiate, Sarah and Marcus to estimate.",
          "Has the security issue with customer-level data exposure been resolved or just deferred by descoping drill-down? Sarah raised it as a reason for the slip but the conversation moved to scope options without confirming whether the simplified version is clear of the same issue. Suggested owner: Sarah (Eng Lead).",
        ],
      },
      {
        label: "Parking lot",
        tone: "neutral",
        items: [
          "Full analytics dashboard with drill-down — deferred to post-launch fast-follow, needs its own planning.",
          "Security issue with customer-level data exposure — raised but not confirmed resolved by the scope change.",
        ],
      },
      {
        label: "What this meeting revealed",
        tone: "neutral",
        text: "Tight and focused — the meeting moved quickly from status to a concrete decision with no extended tangents, though the simplified dashboard scope and fast-follow details were left to be worked out separately. Ownership is clear for the two immediate actions — PM owns the scope write-up today, Sarah owns the estimate tomorrow — but the fast-follow dashboard has no owner and no deadline attached to it yet. The analytics dashboard has been a point of disagreement between engineering and the CEO heading into this meeting; if the simplified scope or fast-follow timeline is not pinned down quickly, this topic may resurface at the next review.",
      },
      {
        label: "Ready-to-send follow-up",
        tone: "green",
        text: "Hi all — quick recap from today's v2 review. We decided to ship a simplified analytics dashboard at launch (top-line metrics, no drill-down), with the full version as a fast-follow. Two actions coming out of this: I will send a scope write-up for the simplified dashboard by end of day today, and Sarah will have a real engineering estimate by tomorrow. Open item to schedule: we still need to assign ownership and a timeline for the full dashboard fast-follow — I will propose a path on that once the estimate is in.",
      },
    ],
    nextStep: "Paste your transcript or notes and choose the kind of debrief you need. The Debrief separates what was decided from what was merely discussed, flags what's still at risk, and turns commitments into a ready-to-send follow-up you can use.",
    disclaimer: "This is a real, complete tool run against a realistic sample meeting transcript."
  },

  guide: {
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
  modified: "2026-09-13",
  id: "HeartOfTheMatter",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "An hour of material where maybe ten minutes actually matters.",
    give: "The transcript or text — paste it, or upload a text file, PDF, or audio recording. Pick Distill, Understand, or Connect.",
    get: "The ideas doing the most work — as ranked notes, a plainer breakdown of what to understand, or themes across sources.",
    edge: "Everything content-specific stays grounded in what you supplied — it won't predict an exam, guess a professor's intent, or add outside facts to fill a gap.",
  },
  seoDescription: "Paste or upload a talk, lecture, podcast transcript, sermon, article, or notes (text, PDF, or audio) and find the ideas doing the most work — the signal without the noise. Distill, Understand, and Connect modes. Free.",
  seoTitle: "Key Points From a Lecture",
  title: "Heart of the Matter",
  tagline: "Find what matters in something long.",
  tags: ['summarize', 'distill', 'understand', 'connect ideas', 'throughline', 'themes', 'key points', 'lecture', 'podcast', 'sermon', 'article', 'transcript', 'notes', 'long text', 'multiple sources'],
  icon: "🎯",
  categories: ['Conversations', 'Learning'],
  headerColor: "#d4dde8",
  description: "Paste or upload a talk, lecture, podcast transcript, sermon, article, or notes — text, a PDF, or an audio recording. Heart of the Matter finds the ideas doing the most work, breaks down what to understand, or connects themes across multiple pieces.",
    guide: {
    tips: [
      "Auto-captions are fine — Heart of the Matter handles imperfect transcription (typos, missed words) well",
      "The emphasis-signals section catches phrases like 'the key point here', 'make sure you remember', or ideas repeated 3+ times — only when the material actually says them",
      "Distill's point types (definition, process, cause/effect, etc.) tell you HOW to hold on to each point",
      "Connect mode shines across sources — paste or upload 3-5 transcripts (talks, lectures, or articles) and it finds the themes that are actually supported across all of them",
      "An uploaded PDF or audio file is read in as text before anything else happens — if the extracted text looks off, you can edit it directly before running a mode"
    ],
  }
},

{
  modified: "",
  id: "TheWholeStory",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A gap, a firing, or a mess you'll have to explain.",
    give: "The real story, honestly and in detail, and who you're telling.",
    get: "The same true story framed for that audience — what to lead with, what to leave out.",
    edge: "Not a cover story. The facts stay true; the emphasis changes with who's listening.",
  },
  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    { q: "How do I explain a gap in my resume?",
      a: "Briefly, honestly, and framed around what the time gave you — then pivot to what you're bringing now. Interviewers care less about the gap than about how you talk about it; discomfort reads as concealment. The Whole Story builds your specific gap story: the one-line resume version, the interview answer, and the follow-up responses." },
    { q: "Is it lying to reframe a resume gap?",
      a: "No — reframing is choosing which true things to emphasize, and every polished candidate does it. Caring for a parent, recovering health, a failed business, or simply needing out are all legitimate; the tool never invents facts, it words the real ones so they read as intentional rather than apologetic." },
    { q: "What do I say in an interview about being unemployed?",
      a: "A three-part answer: the brief honest reason, what you did or learned in the time (even informally), and an energetic pivot to why this role now. Rehearse it until it's boring to you — the goal is delivering it with the same tone you'd use describing any other career chapter." },
    { q: "Should I address a resume gap in my cover letter?",
      a: "Only if it's recent and large enough that silence looks evasive — one confident sentence, not a paragraph. For older or shorter gaps, let the interview handle it. The tool gives you both versions so you can judge which your situation needs." },
    { q: "How do employers actually view career gaps now?",
      a: "Far more neutrally than the advice industry suggests — post-2020, gaps are common enough that a well-told one barely registers. What still hurts candidates is the badly-told gap: defensive, over-explained, or visibly rehearsed-with-shame. The telling matters more than the timeline." },
  ],
  seoDescription: "Explain a resume gap, a firing, or any messy story honestly but strategically. Get 2-3 framed versions tailored to your audience, each with a script and warnings.",
  seoTitle: "Explain a Resume Gap",
  title: "The Whole Story",
  tagline: "Frame your real story for any audience — honest but strategic",
  tags: ['resume gap', 'career pivot', 'fired', 'explain', 'story', 'interview', 'framing', 'narrative'],
  icon: "📖",
  categories: ['Career', 'Conversations'],
  headerColor: "#ccdfc4",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "Discovered – not indexed" page real substance.
  exampleOutput: {
    title: "See what The Whole Story gives you",
    expandLabel: "See the full real example ↓",
    intro: "Real output from an actual run on the story below. Most of the result is shown; nothing is reworded.",
    sampleLabel: "The real story",
    sampleText: "I have a 2-year gap on my resume from 2021-2023. The truth is I was dealing with burnout and took time off to figure out what I wanted. I did some freelance work here and there but nothing consistent.",
    context: "Real run, 2026-10-07 — telling it to: a job interviewer; tone: professional. The tool's own built-in example.",
    sections: [
      {
        label: "The reframe",
        tone: "neutral",
        text: "A deliberate pause to recalibrate is often a sign of good judgment; what matters now is that you're back, clear about what you want, and the work you've done since then (even if freelance) proves you stayed engaged.",
      },
      {
        label: "Version: Freelance & Growth Story",
        tone: "green",
        items: [
          "What to say: “From 2021 to 2023, I transitioned to project-based freelance work that kept me active in the space while giving me flexibility to take on projects that genuinely interested me. I worked on a few different things—nothing I need to hide, just varied work that didn't add up to a straight-line resume. What mattered was I stayed current, and I learned a lot about what kind of work energizes me versus what drains me. That clarity is why I'm here now, looking to bring that focus and energy to a team like yours.”",
          "When it fits: Works with almost any interviewer because it emphasizes output and stays in professional language. Safe middle ground. Use this if you're unsure of the interviewer's values.",
          "The risk: Vague reference to varied work without specifics can sound evasive. They may press for details and catch you being unclear about what you actually did. Only use this if you can name actual projects or client names.",
        ],
      },
      {
        label: "Version: Self-Awareness Play",
        tone: "green",
        items: [
          "What to say: “Between 2021 and 2023, I hit a wall with burnout and made the intentional choice to step back rather than crash harder. I did some freelance projects to stay sharp, but mostly I focused on understanding what was driving that burnout and what I actually wanted from my career. That time away was clarifying—I came back with much better boundaries and a clearer sense of what kind of role and environment I thrive in. I'm stronger for it.”",
          "When it fits: With interviewers who seem thoughtful, companies with strong mental health messaging, or roles where you'll be pitching yourself as self-aware and intentional",
          "The risk: If the interviewer is old-school or comes from a hustle-culture background, mentioning burnout directly might trigger bias. They may see it as weakness rather than wisdom.",
        ],
      },
      {
        label: "Version: Sabbatical Frame",
        tone: "green",
        items: [
          "What to say: “I took a sabbatical from 2021 to 2023 to step back from full-time work and figure out what I wanted to focus on long-term. During that time I did freelance work across a few projects, and more importantly, I invested in myself—learning, thinking, and getting clear about my next chapter. I'm back now with a much stronger sense of direction and I'm excited to bring that focus to a role like this one.”",
          "When it fits: With companies that value autonomy and self-direction, or interviews where the tone is already collaborative and relaxed. Works well for startups and growth-stage companies.",
          "The risk: If the role involves heavy collaboration or you're returning to a traditional industry (finance, law, etc.), sabbatical language can sound too leisurely or like you're overqualified and might leave again.",
        ],
      },
      {
        label: "Likely follow-up: “Can you tell me more about the freelance work you did during that time?”",
        tone: "neutral",
        items: [
          "A way to answer: “I took on projects in [specific domain/skill area], mostly contract work for [types of companies or specific names if you have them]. It wasn't a continuous role, which is exactly what I needed at the time, but it kept me engaged with the work itself. The projects ranged from [example 1] to [example 2], so I got exposure to different sides of the business.”",
          "The trap: Don't stay vague or say you can't remember details. Have 2-3 actual projects or clients you can name. Don't trash your previous employer or make it sound like you were hiding from anything.",
        ],
      },
      {
        label: "Likely follow-up: “Won't you just leave again if things get tough?”",
        tone: "neutral",
        items: [
          "A way to answer: “Not the same way. What I learned is that I need to set boundaries *before* I'm at a breaking point—not wait until I'm fried. I'm looking for a role and a team where I can be honest about my capacity, and I'm confident about that now. I wouldn't take this role if I didn't believe I could sustain it.”",
          "The trap: Don't over-promise or make it sound like you'll never take time off again (that's not credible). Don't get defensive. Own that you made a call that worked for you and you've learned from it.",
        ],
      },
    ],
  },
  description: "Some stories are hard to tell. Share the real story—even the messy parts—and we'll help you explain it honestly and strategically.",
  guide: {
    tips: [
      "The messier and more honest your input, the better the framing — don't self-censor",
      "Each version has a genuinely different strategic approach, not just different words for the same thing",
      "Follow-up prep includes 'trap to avoid' warnings — things that sound natural but hurt your case",
      "Body language tips are tailored to your specific situation and audience, not generic advice",
      "Try the same story with different audiences to see how framing shifts — it's eye-opening"
    ],

  }
},

{
  modified: "2026-09-12",
  id: "DocumentDetective",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A long document arrived and most of it isn't about you.",
    give: "The full text and the document type.",
    get: "Only the parts that affect your situation, and what to do about each.",
    edge: "Not a summary. A shorter version of irrelevant information is still irrelevant — this filters by whether it applies to you.",
  },
  seoDescription: "Paste any long document — insurance EOB, HOA notice, lease, policy update — describe your situation, and see only what costs you money or needs action.",
  seoTitle: "Document Detective: What Affects You",
  title: "Document Detective",
  tagline: "Paste the document. Find what matters to you.",
  tags: ['document', 'document analysis', 'long document', 'what matters', 'personalized document', 'fine print', 'notice', 'policy', 'benefits', 'EOB', 'lease amendment', 'company policy', 'government notice', 'medical bill', 'legal document', 'deadline', 'action required', 'fee', 'document question', 'document relevance', 'understand document'],
  icon: "🔎",
  categories: ['Health & Wellness', 'Home & Daily Life', 'Money'],
  headerColor: "#d4dde8",
  description: "Insurance EOBs, HOA notices, school newsletters, corporate policy updates, lease amendments, benefits packets — you receive them, you skim them, you miss the one thing that mattered. Paste the full document and describe your situation ('renter, no kids, have a dog'), and Document Detective extracts ONLY what requires your action, costs you money, saves you money, or affects you personally. Not a summarizer — a personalized relevance filter.",
  guide: {
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
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Before you post or send something that could be read badly.",
    give: "The message, and the platform.",
    get: "How different readers will take it, where it could land wrong, and a safer wording.",
    edge: "The same words land differently by audience. This shows you the readings you didn't intend.",
  },
  seoDescription: "Before you hit send, see how each person reads your message — how your boss, coworker, or mom interprets it, with risk ratings and safer rewrites.",
  seoTitle: "How Will My Message Read?",
  title: "Context Collapse",
  tagline: "See how different people will read the same message — before you send it",
  tags: ['my boss', 'my manager', 'message', 'audience', 'post', 'social media', 'group chat', 'interpret', 'misread', 'tone', 'send', 'communication', 'misunderstanding', 'context', 'email', 'slack', 'public', 'preview', 'perception'],
  icon: "📢",
  categories: ['Conversations', 'Relationships'],
  headerColor: "#e0b8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what Context Collapse gives you",
    expandLabel: "See the full real example ↓",
    intro: "Real output from an actual run on the post below. Most of the result is shown; nothing is reworded.",
    sampleLabel: "The post",
    sampleText: "After eleven years, Friday was my last day at the company. Not my choice, but I'm okay. Open to what's next — if you know of anything, I'd love to hear it.",
    context: "Real run, 2026-10-07 — one announcement read by former colleagues and an old manager, recruiters, and family (including a mother who doesn't know yet). One of the tool's own built-in examples.",
    sections: [
      {
        label: "Former colleagues and old manager — mild risk",
        tone: "yellow",
        items: [
          "This may land as a clear, non-accusatory announcement that sidesteps detail. They could interpret 'Not my choice' as a euphemism for a decision made by leadership (which includes your manager), which may prompt them to either assume they know what happened or wonder if you're being diplomatic. The lack of any reference to shared history might feel neutral to some and notably absent to others — particularly your manager, who may read the silence around those 11 years as either gracious discretion or a signal that the relationship mattered less than the transaction.",
          "What drives it: The phrase 'Not my choice' combined with the absence of any acknowledgment of the relationship. Your manager does not know whether you're protecting them, protecting yourself, or both.",
        ],
      },
      {
        label: "Recruiters and people who might hire — safe",
        tone: "green",
        items: [
          "This could read as professionally appropriate — you're not venting, not over-explaining, and you're signaling openness to opportunity. However, 'Not my choice' may trigger a pattern-recognition question: was this a performance issue, a layoff, a restructure, or something else? Recruiters may read this as transparent (good) or as deliberately vague (also good for them — no red flags yet, but also no clarity). The 'I'm okay' might read as stability or as 'I'm not panicking,' depending on what they want to hear.",
          "What drives it: The vagueness around 'Not my choice' — recruiters will assume something, and if it is the wrong something, it could close doors. But right now, the statement is neutral enough that they can ask for clarification without judgment.",
        ],
      },
      {
        label: "Family, including your mother — risky",
        tone: "red",
        items: [
          "Your mother may read this and feel shock, then confusion — 'Not my choice' signals something happened to you, but 'I'm okay' could mean anything from 'I have savings' to 'I am pretending I'm fine so you don't worry.' The announcement format (public, brief) might feel like she is hearing major life news from a social platform rather than from you directly, which could read as distance or as a sign that you needed control over the narrative. She may also read the 'if you know of anything' as a request for help that she cannot actually provide, which could trigger guilt or a sense of helplessness.",
          "What drives it: 'I'm okay' without context. To a parent, this often reads as reassurance-to-forestall-questions rather than as a statement of actual status. Combined with the lack of a private heads-up, she may read this as you managing her emotions rather than confiding in her.",
        ],
      },
      {
        label: "Verdict: minor tweaks",
        tone: "yellow",
        text: "The message itself is sound for colleagues and recruiters, but sending it to all three audiences simultaneously, with your mother not yet aware, creates a foreground risk that overshadows the message quality. A small structural fix (tell your mother first, then send this) solves the primary problem. If you must send it as a broadcast to all three at once, one minor addition addresses the gap without changing your voice.",
      },
      {
        label: "If you must broadcast to all three simultaneously: One clarifying phrase for family without shifting tone",
        tone: "green",
        items: [
          "“After eleven years, Friday was my last day at the company. Not my choice, but I'm doing okay and not looking for sympathy — just wanted to say it myself before someone else did. Open to what's next, though, and genuinely grateful for any leads. If you know of anything, I'd love to hear it.”",
          "The tradeoff: You gain: 'doing okay' becomes slightly more credible; 'not looking for sympathy' sets a boundary that can actually help your mother (it gives her permission not to panic, and guides how to respond). 'Genuinely grateful' nods to the 11 years without editorializing. You lose: slightly more words, and the tone moves from 'cool distance' to 'warm professionalism.' It is still your voice, but it reaches a little more. This is a middle option if you cannot reach your mother before posting.",
        ],
      },
    ],
  },
  faq: [
    { q: "How will my message come across to different people?",
      a: "Paste it, name who will see it, and say what you want it to do. Context Collapse reads it from each audience's side — how it's likely to land, how risky it is, and the exact phrase driving that — then suggests rewrites that keep your voice." },
    { q: "What is context collapse?",
      a: "When one message reaches several audiences at once — a post your boss, recruiters and your mother all see — and each reads it differently. The words that reassure one group can worry or offend another." },
    { q: "Should I post that I was laid off?",
      a: "It depends on who will read it and what you want from them. The real example on this page shows how one short layoff post reads to old colleagues, recruiters and family, and the small change that fixes the riskiest reading." },
    { q: "Does it rewrite the message for me?",
      a: "It offers rewrites, each with the tradeoff spelled out — what you gain and what you lose — so you choose. Sometimes the fix isn't in the words at all, like telling one person privately first." },
    { q: "What kinds of messages does it handle?",
      a: "Emails, group chats, social posts, team announcements — anything more than one kind of reader will see. It also notes platform risks like screenshots and forwarding." },
  ],
  description: "A message doesn't mean the same thing to everyone who reads it. Tell DeftBrain what you're about to send, and we'll show you where your intent and your audience's interpretation may not match.",
  guide: {
    tips: [
      "Add relationship context for each audience — 'My boss (we had a disagreement last week)' changes the reading dramatically",
      "The 'Key Trigger' field shows the exact word or phrase driving each audience's interpretation",
      "Rewrite suggestions preserve your voice while fixing the gaps — they don't make you sound corporate",
      "Platform notes flag things like screenshot risk, forwarding risk, and social media permanence",
      "Use this before any announcement that goes to mixed audiences — it prevents 90% of 'that came out wrong' moments"
    ],

  }
},

{
  modified: "",
  id: "Bookmark",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You abandoned a show or book and want back in without spoilers.",
    give: "The title and exactly where you stopped.",
    get: "A recap up to that point and no further, plus whether it's worth resuming.",
    edge: "Wikis and search results spoil you on the way to the answer. This stops at your bookmark.",
  },
  seoDescription: "Returning to a show, book, game, or season after time away? Get a spoiler-free recap calibrated to exactly where you stopped. Free, no signup.",
  seoTitle: "Spoiler-Free Show & Book Recaps",
  title: "Bookmark",
  tagline: "Pick up where you left off — without spoilers",
  tags: ['show', 'book', 'game', 'sports', 'recap', 'spoiler', 'abandoned', 'catch up', 'catch-up', 'tv', 'season', 'remember', 'forgotten', 'series', 'chapter', 'binge', 'rewatch', 'pick up', 'return', 'summary', 'plot', 'characters', 'episode', 'where was i'],
  icon: "🔖",
  categories: ['Just for Fun'],
  headerColor: "#ccdfc4",
  description: "Coming back to a book, show, game, or sports season after time away? Tell Bookmark where you stopped and get the context you need to jump back in—without spoiling what comes next.",
  guide: {
    tips: [
      "The 'What do you remember?' field dramatically improves accuracy — even wrong memories help calibrate",
      "Sports mode's must-watch games with '🔒 Watch blind' tags let you catch up on storylines while preserving big moments",
      "Conversation-ready talking points (sports mode) are designed to hold up in real fan discussions",
      "Confidence indicators tell you when the model is less certain about exact episode-level details — useful for older or obscure titles",
      "Use the 'specific questions' field for things like 'Did they make any trades?' or 'Is that character dead?' — answers respect your spoiler level"
    ]
  }
},
{
  modified: "2026-03-11",
  id: "DecoderRing",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A message arrived and the words don't match the feeling.",
    give: "The exact message and where it came from.",
    get: "What the message could mean, how loosely to hold that, and three ways you could reply.",
  },
  seoDescription: "Paste a confusing or passive-aggressive message and see what it might mean, what's worth noticing, and 3 ready-to-send replies. Free, no signup.",
  seoTitle: "Text Message Subtext Decoder",
  title: "Decoder Ring",
  tagline: "Explore what might be happening beneath the words",
  tags: ['my boss', 'my manager', 'message', 'subtext', 'passive aggressive', 'email', 'text', 'meaning', 'tone', 'confusing'],
  icon: "🔍",
  categories: ['Conversations', 'Relationships'],
  headerColor: "#e0b8b8",
  description: "Confusing messages rarely come with a translation. Paste a message and DeftBrain will help you separate what was said from what may have been meant.",
  exampleOutput: {
    title: "See what Decoder Ring gives you",
    expandLabel: "See the full real example results ↓",
    nextStepLabel: "What happens with your message",
    intro: "This is the complete, real output from an actual Decoder Ring run on the sample message below — nothing here is invented or shortened.",
    sampleLabel: "Sample message (from a partner/spouse, text message)",
    sampleText: "I totally get where you're coming from — maybe we should take some time to think about things separately. No pressure at all, whenever you're ready to talk. Or not! Totally fine either way, with a smiling emoji. (Sent after the sender learned about a trip that was booked without checking in with them first.)",
    context: "Real run, 2026-09-23 — the tool's own built-in example scenario.",
    sections: [
      {
        label: "On the surface",
        tone: "neutral",
        text: "Your partner acknowledges what you said, says they want some time apart to think, and leaves the door open for future conversation — or not — with a friendly, low-pressure tone.",
      },
      {
        label: "One possible reading",
        tone: "yellow",
        text: "One reading is that they felt sidelined by your decision to take the trip without checking in first, and this message is their way of saying so without saying it outright. Rather than arguing or accusing, they may be stepping back to create some distance — and possibly to see whether you will close that distance. The lightness of the tone could be genuine, or it could be doing a lot of work to keep something harder from showing. Emotional undercurrent: hurt or disappointment plus uncertainty about how to raise it directly. Tone analysis — warmth 6/10, directness 3/10, ambiguity 7/10, emotional intensity 5/10. This one could genuinely be read several ways; hold the reading loosely.",
      },
      {
        label: "Layer-by-layer breakdown (5 layers)",
        tone: "neutral",
        items: [
          "“I totally get where you're coming from” — Surface: they understand your perspective. Subtext: could be genuine acknowledgment, or a quick concession before pivoting to their own position (the 'I get it, but...' move); 'totally' could be plain enthusiasm or doing extra work to soften what follows. Read as: cushioning before a turn (low confidence).",
          "“maybe we should take some time to think about things separately” — Surface: suggesting a period of individual reflection rather than immediate conversation. Subtext: could be a straightforward request for processing space, or the opening of a larger conversation about the relationship itself — 'things' is broad enough to include more than the trip. Read as: handing off the next move (medium confidence).",
          "“No pressure at all, whenever you're ready to talk” — Surface: no urgency, respond on your own timeline. Subtext: could be a sincere offer of patience, or naming 'no pressure' creates an awareness of pressure that wasn't explicitly there before. Read as: mixed signals (low confidence).",
          "“Or not! Totally fine either way” — Surface: talking is optional, either outcome acceptable. Subtext: could be genuinely releasing you from any obligation to respond, or leaving the relationship's next step entirely to you, which could feel like distance or an invitation to take initiative. Read as: unclear intentions (low confidence).",
          "“😊” — Surface: a friendly, light closing emoji. Subtext: could be a genuine signal this isn't meant as cold or hostile, or could be functioning to soften or offset the weight of what was said — a tonal buffer. Read as: playing it down (low confidence).",
        ],
      },
      {
        label: "Worth noticing",
        tone: "yellow",
        text: "What could matter: the message leaves the terms of 'thinking separately' entirely undefined — worth checking whether you two mean the same thing by it. The scope of 'things' is vague — it could mean only the trip, or something larger; that gap may be worth addressing. What's reassuring: the sender explicitly says they understand your perspective rather than leading with accusation or blame; the message leaves the door open rather than closing it; the overall tone, whatever is underneath it, is not hostile or punishing in its wording.",
      },
      {
        label: "Three ways you could respond",
        tone: "green",
        items: [
          "Acknowledge and open the door — let them know you noticed something is there and that you want to actually talk about it, without forcing the conversation before they are ready. Sample: “Hey. I read your message and I wanted you to know I did not just take it at face value. I think there is something worth talking through — not 'or not' for me. Whenever you want to, I am here.” Risk: if they genuinely wanted space and meant the 'no pressure' sincerely, this could feel like you are not respecting what they asked for.",
          "Name your part directly — address the thing that likely prompted the message (the trip decision) rather than responding only to the tone. Sample: “I have been sitting with this. I think I should have talked to you before I said yes to the trip, and I did not. That was not a good call on my part. I would like to talk about it when you are ready.” Risk: if there is more underneath this than just the trip, this response may not reach it.",
          "Ask what they need — rather than guessing what 'thinking separately' means, ask plainly. Sample: “I want to make sure I understand what you need right now. When you say take some time separately — are you saying you want a few days before we talk, or is there something bigger you want to think through? I am asking because I want to get it right.” Risk: this puts a question back to someone who may have been hoping you would already know the answer, which could land as deflecting rather than engaging.",
        ],
      },
    ],
    nextStep: "Paste the exact message and add the surrounding context. Decoder Ring separates the words from reasonable subtext, breaks the message down phrase by phrase, and gives you reply options matched to the actual ambiguity — not a single guess at what they meant.",
    disclaimer: "This is a real, complete tool run against a realistic sample message. AI analysis — use your own judgment when interpreting messages."
  },

  guide: {
    tips: [
      "Paste the EXACT wording — paraphrasing loses the tone cues the read depends on",
      "Adding relationship context makes a much bigger difference than people expect on an ambiguous message",
      "Check the ambiguity score first. A high one means the message genuinely supports several readings, and no tool can narrow it further",
      "Response strategies include risk assessments — check the downsides before sending"
    ],
  }
},
{
  modified: "",
  id: "DecisionPrism",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A hard decision you keep circling.",
    give: "The decision, what makes it hard, and your options.",
    get: "The same choice run through several decision frameworks, so you can see which considerations you've been ignoring.",
    edge: "It doesn't pick for you. It shows you which framework you've been using without noticing.",
  },
  seoDescription: "Stuck on a tough decision? Run it through 6 proven decision frameworks free — pre-mortem, 10/10/10, reversibility, values check — and finally decide with clarity.",
  seoTitle: "Decision Helper for Hard Calls",
  title: "Decision Prism",
  tagline: "See a tough decision from every angle",
  tags: ['decision', 'decision analysis', 'hard decision', 'stuck deciding', 'choose between options', 'compare choices', 'tradeoffs', 'opportunity cost', 'reversibility', 'values', 'what matters most', 'decision frameworks', 'pros cons', 'regret', 'uncertainty', 'career decision', 'life decision', 'dilemma'],
  icon: "🔀",
  categories: ['Decisions', 'Ideas & Imagination'],
  headerColor: "#f5e0c0",
  description: "Stuck between choices? Describe the decision, your options, and what matters to you. Decision Prism looks at the tradeoffs from several useful angles, shows what each choice could cost or preserve, and helps you see what you still need to know before deciding.",
  guide: {
    tips: [
      "The more context you provide, the sharper the analysis — but it will never invent facts you didn't give it",
      "Decision Prism only analyzes the options you name — it won't add 'do nothing' unless you're already weighing it",
      "The 'Still Stuck' exercises (coin-flip reaction, future-self exercise, smallest step) are genuinely effective — try them",
      "Use the comparison matrix to have structured conversations with people you trust"
    ]
  }
},

{
  modified: "",
  id: "MiseEnPlace",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "There's food in the fridge and no plan.",
    give: "What you have, or a photo. Your time, skill level and dietary needs.",
    get: "A meal plus the order of operations — what to start first, what to do while it cooks.",
    edge: "Sequencing, not recipes. The hard part of home cooking is what to do when, and that's what it plans.",
  },
  seoDescription: "List your ingredients or snap a photo of your fridge and get a minute-by-minute cooking plan with timing alerts and leftover ideas. Free, no signup.",
  seoTitle: "Recipes From Your Ingredients",
  title: "Mise en Place",
  tagline: "The hard part isn't the cooking. It's deciding.",
  tags: ['cooking', 'food', 'recipe', 'kitchen', 'ingredients', 'dinner', 'meal prep', 'fridge', 'dietary', 'substitute', 'swap'],
  icon: "🍳",
  categories: ['Decisions', 'Home & Daily Life'],
  headerColor: "#d4dde8",
  description: "Dinner is rarely difficult because of the cooking. It's difficult because you're hungry, short on time, juggling multiple dishes, and trying not to waste what's already in the refrigerator.",
  exampleOutput: {
    title: "See what Mise en Place gives you",
    expandLabel: "See the full real example results ↓",
    nextStepLabel: "What happens with your ingredients",
    intro: "This is the complete, real output from an actual Mise en Place run on the sample kitchen below — nothing here is invented or shortened.",
    sampleLabel: "Sample kitchen",
    sampleText: "Working with: chicken thighs, rice, frozen broccoli, garlic, soy sauce, sesame oil, ginger, scallions, eggs. Dinner, 45 minutes available, intermediate skill, no dietary restrictions.",
    context: "Real run, 2026-09-23 — the tool's own built-in example scenario.",
    sections: [
      {
        label: "Tonight's move",
        tone: "green",
        text: "One-Pan Soy Chicken with Ginger Rice and Broccoli. Works within your 45-minute window, uses everything in your pantry (chicken thighs, rice, frozen broccoli, garlic, soy sauce, sesame oil, ginger, scallions, eggs), delivers restaurant-quality depth with minimal oversight, and teaches the most useful technique — searing protein before braising it in aromatic liquid.",
      },
      {
        label: "Meal options (2)",
        tone: "neutral",
        items: [
          "One-Pan Soy Chicken with Ginger Rice and Broccoli (40 min, medium) — chicken thighs seared and braised in a ginger-soy glaze, served over fluffy rice with roasted broccoli and a soft scrambled egg stirred through. Uses every ingredient you have, delivers savory umami depth, requires only one cooking vessel.",
          "Egg-Fried Rice with Chicken and Broccoli (30 min with cooked rice / 50 min from raw, easy) — quick-cooking fried rice made with cooked rice, shredded chicken, frozen broccoli, and a scrambled egg base, spiked with soy, sesame, and ginger. Fastest option if you have cooked rice on hand.",
        ],
      },
      {
        label: "Cook along (40 minutes, step by step)",
        tone: "neutral",
        items: [
          "0:00 (3 min) Prep mise en place — mince garlic (~4 cloves), slice ginger into matchsticks, chop scallions keeping white/green separate, pat chicken thighs dry.",
          "0:03 (2 min) Mix braising liquid — whisk 1.5 cups stock, 3 tbsp soy sauce, 1 tbsp sesame oil, the ginger, and a pinch of pepper; set aside.",
          "0:05 (4 min) Sear chicken thighs skin-side down in 2 tbsp hot oil, undisturbed, until golden. Checkpoint at 0:09: skin should be deep golden and release easily when jiggled — if not, cook 2-3 more minutes.",
          "0:09 (2 min) Flip chicken, sear the other side ~90 seconds until light golden — not cooking through, just building color.",
          "0:11 (1 min) Add minced garlic and white scallions to the pan, stir ~20 seconds until fragrant. (Watch garlic carefully — if it browns or smells harsh, pull the pan off heat for 5 seconds.)",
          "0:12 (1 min) Pour braising liquid over the chicken, bring to a simmer, reduce to medium-low, cover partially. Meanwhile start rice separately (2 cups liquid to 1 cup rice).",
          "0:13 (18 min) Braise chicken while rice cooks simultaneously on a separate burner. Checkpoint at 0:21: liquid should smell fragrant, chicken mostly submerged. At minute 8 beat 2 eggs with a splash of soy and sesame oil; at minute 15 add frozen broccoli to the braising liquid.",
          "0:31 (3 min) Check rice is tender and liquid absorbed (cook 2 more minutes if not); chicken should be easily pierced with a fork.",
          "0:34 (3 min) Scramble eggs into the braising liquid — push chicken/broccoli aside, increase heat to medium, pour in beaten eggs, stir gently until set but still creamy (~2 min). Eggs curdle fast, so stir constantly and pull off heat the moment they set.",
          "0:37 (2 min) Finish and plate — fluff rice, divide among bowls, top with chicken, broccoli, and a spoonful of the egg-braising liquid; garnish with green scallions.",
        ],
      },
      {
        label: "Quick shopping list",
        tone: "yellow",
        text: "Essential: white or black pepper, neutral oil (vegetable or canola), chicken or vegetable stock. Nice to have: chili flakes or fresh chilies, rice vinegar.",
      },
      {
        label: "Pro tips",
        tone: "neutral",
        items: [
          "Dry your chicken before searing — moisture on the surface steams the skin instead of letting it crisp. This is the single biggest difference between home and restaurant results. (Intermediate)",
          "Do not move the chicken while searing — every flip or jiggle resets the browning process. Let it sit undisturbed for a full 4 minutes; if it sticks, wait 30 seconds more. (Intermediate)",
          "Scramble eggs into hot liquid off-heat or at very low heat — eggs set nearly instantly in boiling liquid and become grainy; reduce heat, stir constantly, and pull off heat the moment curds form. (Intermediate)",
        ],
      },
      {
        label: "Tomorrow's meal (leftovers)",
        tone: "green",
        text: "Storage: store chicken, broccoli, rice, and braising liquid together in an airtight container for up to 3 days; keep eggs separate if possible. Transform into: fried rice remix — shred leftover chicken, stir-fry cold rice and broccoli in oil until crispy (~3 min), scramble a fresh egg into the center, fold in soy sauce, sesame oil, and the shredded chicken; finish with fresh scallions and a drizzle of the reserved braising liquid. Total time: 8 minutes. Scaling for 1 person: 1 large thigh, halve stock/soy to 3/4 cup and 1.5 tbsp, keep sesame oil at 2 tbsp (doesn't halve linearly), 1 egg — rice ratio stays the same by volume. Scaling to 4-6 people: 8 thighs, double the braising liquid and rice, 3-4 eggs; the braise may need an extra 5-8 minutes (use a fork test, not a timer) — rice cooking time never changes.",
      },
    ],
    nextStep: "Give Mise en Place what you actually have plus your time and constraints. It builds the sequence around your kitchen instead of handing you another recipe to organize yourself — a timed cook-along, checkpoints if something looks off, and what to do with the leftovers tomorrow.",
    disclaimer: "This is a real, complete tool run against a realistic sample kitchen. AI-generated meal plans — always use your own judgement about food safety and dietary needs."
  },

  guide: {
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
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Someone asked you for a reference and the deadline is close.",
    give: "Their name, your relationship, what they're applying for, and what you know about them.",
    get: "A finished letter with specific evidence, in a voice that sounds like you wrote it carefully.",
  },
  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    { q: "How do I write a letter of recommendation?",
      a: "Strong letters make one clear claim about the person, prove it with two or three specific stories, and state the stakes ('I would hire them again without hesitation'). Weak letters list adjectives. GhostWriter drafts the letter from what you tell it about the person, the role, and your relationship — structured the way selection committees actually read." },
    { q: "What should I do when someone asks me to write my own recommendation letter?",
      a: "It's more common than anyone admits — write the honest strong version, not the modest one, because your recommender chose delegation over drafting and will happily sign genuine strengths. Give the tool your real accomplishments and relationship context, and it writes in a credible third-person voice that doesn't sound like you praising yourself." },
    { q: "What makes a recommendation letter strong instead of generic?",
      a: "Specificity and stakes. 'Maria is hardworking' does nothing; 'Maria rebuilt our reporting pipeline in a quarter, and I've trusted her with every ambiguous project since' does everything. One vivid, verifiable story outweighs five adjectives — the drafts are built around extracting those stories from you." },
    { q: "How long should a letter of recommendation be?",
      a: "One page — three to five paragraphs. Committees skim; a tight page that leads with the strongest claim beats two pages of throat-clearing. Academic letters run slightly longer by convention, and the tool adjusts length and register for academic, professional, or character references." },
    { q: "Can I decline to write a recommendation letter?",
      a: "You should, if you can't write a genuinely positive one — a lukewarm letter damages the candidate more than a polite no. 'I don't think I'm the strongest advocate for this — you deserve someone who can speak to your recent work' is a kindness. If you're on the fence, drafting with the tool sometimes reveals you have more to say than you thought." },
  ],
  seoDescription: "Turn rough notes into a polished recommendation letter in seconds. Get 3 free versions — narrative, structured, and concise — tuned to formality and context.",
  seoTitle: "Recommendation Letter Generator",
  title: "Ghost Writer",
  tagline: "You know why they deserve it. This helps you say it.",
  tags: ['recommendation', 'letter', 'reference', 'job', 'linkedin', 'writing', 'grad school', 'scholarship'],
  icon: "✍️",
  categories: ['Career', 'Conversations'],
  headerColor: "#ccdfc4",
  description: "You already know why this person deserves your recommendation. The difficult part is turning years of experience, impressions, and memories into a letter that does them justice.",
  exampleOutput: {
    title: "See what Ghost Writer gives you",
    expandLabel: "See the full real example results ↓",
    nextStepLabel: "What happens with your notes",
    intro: "This is the complete, real output from an actual Ghost Writer run on the sample notes below — nothing here is invented or shortened.",
    sampleLabel: "Sample notes (job recommendation, professional tone)",
    sampleText: "Letter for Jordan Kim (she/her), job recommendation, professional tone. Traits: leadership, communication, initiative, technical skills. I managed Jordan for 3 years as a product manager. She stepped in during a hiring freeze to run a stalled project with no formal authority over the engineers, and delivered it on time — two engineers later asked to work with her again. She also drove an onboarding redesign across design, engineering, and data that cut drop-off by 34%, run in a way that left every stakeholder feeling heard. Fintech startup context.",
    context: "Real run, 2026-09-23 — the tool's own built-in example scenario, Narrative style.",
    sections: [
      {
        label: "The letter (narrative style)",
        tone: "neutral",
        text: "There is a moment I think about when someone asks me what kind of product manager Jordan Kim is. We were eight weeks into a hiring freeze, a critical project was stalled, and the engineers assigned to it had no formal PM support. Jordan stepped in. She had no direct authority over the four engineers on that team — no reporting line, no leverage — and she never seemed to need it. She ran standups, cleared blockers, kept the roadmap honest, and delivered the project on time. I found out later that two of those engineers had specifically asked to work with her again. I managed Jordan for three years, and I will say plainly: her resume does not capture what she actually is. What she is, is someone who makes the people around her better — and does it so quietly that you only notice it when you look at what the team produced. The onboarding rebrand is another example worth naming. Jordan identified that our activation funnel was losing users at a rate that had become structural, not incidental. She drove the redesign of the onboarding flow end to end — working across design, engineering, and data — and the result was a 34% reduction in drop-off. What I remember most is not the number. It is that she ran the project in a way that left every stakeholder feeling heard. Nobody felt steamrolled. The outcome was significant; the process was clean. Jordan is also the person you want when something goes wrong. She does not perform calm — she is calm. In [NUMBER] years of managing product teams, I have worked with very few people who can hold a room steady during a real crisis without losing the thread of what needs to happen next. She is one of them. She is ready for a senior role. More than ready — she has been operating at that level for some time without the title. I would hire her again without hesitation, and whoever brings her in next will benefit from something that does not show up in a job description: a person who makes the work around her better, every time.",
      },
      {
        label: "Personalize these parts",
        tone: "yellow",
        items: [
          "Add the name of the project the engineers asked to work on again, if you recall it.",
          "Replace [NUMBER] with your actual years managing product teams.",
          "If there is a specific crisis moment you witnessed firsthand, name it — even briefly.",
        ],
      },
      {
        label: "Fill in these details (3)",
        tone: "yellow",
        items: [
          "[SPECIFIC CRISIS OR INCIDENT] — name the actual high-pressure event you have in mind (a launch that nearly failed, a sudden stakeholder shift, a production incident) so the reader sees a real situation, not a category.",
          "[WRITER'S CONTACT INFORMATION] — add your direct email and, optionally, a phone number if you are open to a call.",
          "[name of the onboarding project or product] — if the project had an internal name or the product line is something you can mention, adding it makes the claim verifiable.",
        ],
      },
      {
        label: "Power phrases",
        tone: "green",
        items: [
          "“She managed by earning trust, staying organized when the situation was not, and making sure credit landed where it belonged.”",
          "“She spent the first weeks of that project making sure the engineers and designers felt heard before she proposed a single solution.”",
          "“She calibrates without being told to.”",
          "“Her steadiness in those situations set the tone for everyone around her.”",
          "“Whoever hires her will benefit not just from what she delivers, but from what she draws out of the people she works with.”",
        ],
      },
      {
        label: "Writing tips",
        tone: "neutral",
        items: [
          "The 34% drop-off stat is your strongest hard evidence — make sure it appears early enough to anchor credibility, not just as a footnote.",
          "Avoid adding any accomplishments Jordan did not tell you about; the letter is already compelling without invention.",
          "Read it aloud once before sending — any sentence that sounds like a press release should be rewritten in your own voice.",
          "The fintech startup context rewards specificity about cross-functional coordination and comfort with ambiguity; both are already in the letter, but you can amplify them if you have a concrete example from a scrappy or under-resourced moment.",
        ],
      },
    ],
    nextStep: "Give Ghost Writer the relationship, destination, and real examples you remember. It turns your evidence into a polished draft — in narrative, structured, or concise style — while keeping every claim grounded in what you actually supplied, and flags exactly what still needs filling in before you send it.",
    disclaimer: "This is a real, complete tool run against realistic sample notes."
  },

  guide: {
    tips: [
      "Even vague bullet points ('she's great with clients') get turned into compelling examples",
      "Placeholders in [BRACKETS] are flagged so you know exactly what to personalize",
      "The Refine button lets you adjust tone, length, or add specific details after generation",
      "Power Phrases section shows which lines carry the most persuasive weight — keep those"
    ],
  }
},

{
  modified: "",
  id: "CaptionMagic",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "The photo's ready and the caption isn't.",
    give: "The image, and anything it can't show — who's in it, what was happening, the joke behind it.",
    get: "Six captions, from the plain one to one that goes somewhere strange. Then ask for funnier, drier or weirder.",
    edge: "It won't invent a backstory for your photo, and it won't play it safe with the joke either.",
  },
  seoDescription: "Share a photo or describe it, tell us anything the picture cannot, and get six captions across the range — plain, warm, clever, dry, playful and one that goes somewhere else entirely. Free, no signup.",
  seoTitle: "Social Media Caption Generator",
  title: "Caption Magic",
  tagline: "Find the words that fit the photo.",
  tags: ["caption", "photo caption", "image caption", "caption ideas", "social media", "instagram", "linkedin", "twitter", "tiktok", "facebook", "threads", "funny caption", "clever caption", "playful caption", "dry humor", "hashtags", "alt text", "photo context"],
  icon: "📸",
  categories: ['Career', 'Conversations', 'Just for Fun'],
  headerColor: "#ccdfc4",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 (strict index review: indexed only once it shows real output).
  exampleOutput: {
    title: "See what Caption Magic gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the photo description below. Four of its six captions are shown; nothing is reworded.",
    sampleLabel: "The photo",
    sampleText: "Golden hour shot of my dog mid-leap catching a frisbee at the beach, sand spraying everywhere, ocean blurred in the background. For Instagram — a feed about outdoor adventures with my rescue dog Max.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "Captions",
        tone: "green",
        items: [
          "Golden hour with Max doing what he does best—everything at full volume.",
          "There's something about watching a dog move through the world with complete certainty that he belongs in every moment of it.",
          "Max doesn't catch frisbees. Max becomes the frisbee. The sand is just reporting on the physics.",
          "Max mid-everything and completely sure that this is exactly where he was supposed to be. I believe him.",
        ],
      },
      {
        label: "Alt text",
        tone: "blue",
        text: "A dog mid-leap catching a frisbee at the beach during golden hour, sand spraying in an arc around him. The ocean is blurred in the background. The moment captures movement and joy frozen in time.",
      },
    ],
  },
  faq: [
    { q: "What makes a good Instagram caption?",
      a: "One that adds something the photo can't say on its own — a detail, a joke, a reason it matters to you. Short usually wins; front-load the line people see before \"more.\"" },
    { q: "Can I upload the photo instead of describing it?",
      a: "Yes. Upload it, or describe it if you'd rather not share the image. Either way it writes only from what's actually there and what you tell it." },
    { q: "Does it write alt text?",
      a: "Yes. Every set comes with a plain description of the image for people using screen readers." },
  ],
  description: "A good photo doesn’t always come with the right words. Share the image, and tell us the part it can’t show — who’s in it, what was happening, the joke behind it. Caption Magic gives you six captions to pick from, from plainly useful to genuinely strange, and you can keep asking for funnier, warmer, drier or weirder until one of them makes you laugh.",
  guide: {
    tips: [
      "A short piece of real context often gives the captions more personality than adding more style instructions",
      "If the first six all feel too similar, use Surprise me or Six more rather than over-editing the form",
      "Use Funnier, Warmer, Drier, or More unhinged when you know the direction you want",
      "The playful captions may invent a comic voice or metaphor, but concrete backstory about real people should come from you"
    ]
  }
},

{
  modified: "2026-09-05",
id: "PEP",
// Preamble — the four questions a new visitor has, in order.
// `give` states the input burden before the form; see ToolPageWrapper.
// FOCUSED REBUILD, 2026-09-05 (installed from an owner-supplied rewrite —
// see audit/tool-notes/PEP-NOTES.md): reduces the earlier FULL V2 REWRITE's
// five modes (Right Now / Prioritize / Week / Patterns / Adapt) to one
// product loop — report capacity, get a suggestion, try it, report what
// happened, PEP uses that evidence next time. Prioritize/Week/Patterns/
// Adapt/Shared menu/Match/build-a-plan sequencing are REMOVED, not reworded.
primer: {
  when: "You're not sure what fits the energy you have right now.",
  give: "How much capacity and time you have right now, and anything else worth knowing about the moment.",
  get: "One manageable suggestion that fits, plus a couple of alternatives.",
  edge: "It treats your own reported energy and what you've actually tried as the evidence — not a formula that claims to measure or predict it.",
},
  seoDescription: "Not sure what fits the energy you have right now? PEP suggests something manageable based on your capacity, time, and mood — then learns from what you tell it worked. Free, no signup.",
seoTitle: "Activity Ideas",
title: "PEP — Personal Energy Planner",
tagline: "Work with the energy you have.",
  tags: ['low energy', 'energy', 'personal energy planner', 'what should I do', 'activity suggestion', 'tired', 'low motivation', 'rest', 'self care', 'capacity', 'mood', 'screen fatigue', 'low demand activity', 'quick activity', 'energy slump', 'something manageable'],
  icon: '✨',
  categories: ['Health & Wellness', 'Self & Reflection'],
  headerColor: "#b8dcd8",
  description: "Low on energy and not sure what to do with it? Tell PEP how much you have in you right now. Get something that fits. Try it. Tell PEP how it went. PEP uses your own history to make better suggestions next time.",
  guide: {
    tips: [
      "The open 'anything else PEP should know?' field is powerful — mention what you've been doing or what sounds awful right now and the suggestion adjusts",
      "Rate activities after trying them — that's what makes future suggestions genuinely personal instead of generic",
      "My Menu shows real numbers (times tried, typical rating) only once you've actually logged a few attempts at the same activity"
    ],
  }
},
{
  modified: "",
  id: "BatchFlow",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A scattered list and a day of constant gear-shifting ahead.",
    give: "Everything on your plate, unfiltered. Or paste a raw list.",
    get: "Tasks grouped by the kind of thinking each needs, sequenced to minimize switching.",
    edge: "It groups by cognitive mode, not topic or deadline. Switching between creative and analytical work is what costs you the day.",
  },
  seoDescription: "Batch similar tasks by mental mode to kill context switching and protect your focus. Get a ready-to-run schedule built around your energy in seconds. Free, no signup.",
  seoTitle: "Task Batching & Focus Planner",
  title: 'Batch Flow',
  tagline: "Your tasks, grouped so the day stops fighting you",
  tags: ['batch', 'tasks', 'focus', 'productivity', 'context switching', 'schedule', 'cognitive', 'todo', 'time management', 'deep work', 'flow state', 'energy', 'batching'],
  icon: '⚡',
  categories: ['Tasks', 'Work & Meetings'],
  headerColor: "#d4dde8",
  description: "A scattered day can feel busy without accomplishing much. Tell DeftBrain what's on your plate, and we'll group your tasks into a schedule that works with your energy instead of against it.",
  guide: {
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
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You know you should move and you really don't want to.",
    give: "Your energy, what happened today, where it hurts, and how long you've got.",
    get: "A workout sized to that, with swaps if a movement is wrong for you today. Also two-minute micro-moves, a week's plan, and recovery, sleep and breathing sets.",
    edge: "It starts from having no motivation rather than assuming some. Nothing here requires you to feel like it.",
  },
  seoDescription: "For the days you don't want to move. Get a workout matched to your real energy, what hurts, and how your day went — from a 2-minute floor up. Free, no signup.",
  seoTitle: "Low-Energy Workouts",
  title: "Lazy Workout Adapter",
  tagline: "Low-barrier movement that meets you where you are",
  tags: ["low energy workout", "easy workout", "gentle movement", "exercise", "workout", "no motivation", "exercise when tired", "2 minute workout", "micro workout", "movement break", "low barrier exercise", "workout adapter", "body stiffness", "recovery movement"],
  icon: "🧘",
  categories: ['Health & Wellness'],
  headerColor: "#ccdfc4",
  description: "Don't feel like working out? Tell us how much energy and time you have, what's bothering you, and what kind of day you've had. Lazy Workout Adapter turns that into movement you can actually manage right now.",
  guide: {
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
  modified: "2026-03-10",
  id: "ArgueSmarter",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You hold a position and have only heard weak versions of the other side.",
    give: "Your position, how you want it challenged, and how hard.",
    get: "The strongest honest counter-case, then pressure on your answers — plus a scorecard, the fallacies on both sides named, and a replay of where you lost ground.",
    edge: "It argues the best version of the opposing case, not the caricature — which is the only version worth beating.",
  },
  seoDescription: "State any position and face the strongest opposing case — a real steelman, not a strawman. Practice debates, spot fallacies, and sharpen your thinking. Free.",
  seoTitle: "Argue Smarter: Debate Practice Trainer",
  title: "Argue Smarter",
  tagline: "Test your ideas against the strongest criticism you can find",
  tags: ['debate', 'argue', 'logic', 'steelman', 'critical thinking', 'opinion', 'persuade', 'fallacy', 'rhetoric'],
  icon: "🥊",
  categories: ['Conversations', 'Just for Fun', 'Learning'],
  headerColor: "#b8dcd8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "Discovered – not indexed" page real substance.
  exampleOutput: {
    title: "See what Argue Smarter gives you",
    expandLabel: "See the full real example ↓",
    intro: "Real output from the opening move of an actual practice debate on the position below, unedited.",
    sampleLabel: "Your position",
    sampleText: "Requiring people back in the office four days a week costs more than it recovers — you lose your best people first, and the ones who stay are the ones with the fewest options.",
    context: "Real run, 2026-10-07 — challenge level: curious; format: Socratic. You answer, and it keeps pressing. One of the tool's own built-in examples.",
    sections: [
      {
        label: "The strongest criticism",
        tone: "red",
        text: "The claim that 'best people leave first' may be true in some contexts and false in others, but the position treats it as universal without examining what determines who actually has outside options in a given role, industry, or labor market moment.",
      },
      {
        label: "Where the debate turns",
        tone: "yellow",
        text: "Whether 'most mobile' and 'most valuable' are the same population determines whether the whole argument holds.",
      },
      {
        label: "Opening challenge",
        tone: "neutral",
        text: "I love this argument and I think it has real force — but let me poke at it a little, the way a friend who's read too much organizational research might. Here's what I keep coming back to: when you say 'best people,' what are you actually measuring? Is it the people with the most LinkedIn connections? The ones who get the most recruiter calls? The ones whose output is highest? Because those might not be the same person, and the argument kind of needs them to be the same person to really land. So I guess my first gentle question is: what does 'best' mean to you here, and how confident are you that 'most mobile' and 'most valuable' are tracking the same population? Then there's the second half — 'the ones who stay have the fewest options.' That's a really vivid image, and it might be exactly right. But I wonder if you've stress-tested it. What about people who stay because they genuinely prefer in-person work, or because their role is deeply collaborative, or because they have strong relationships at that specific company that are genuinely hard to replicate elsewhere? Are those people captured by 'fewest options,' or does that framing kind of write them out of the picture? And then there's the recovery side of the ledger. Your position assumes the costs outweigh the recoveries — but have you spelled out what the recovery side actually contains? There might be things there worth naming before dismissing them.",
      },
      {
        label: "Key challenges",
        tone: "neutral",
        items: [
          "Logical: The claim that your best people leave first assumes that labor market mobility and job performance are strongly correlated, but that link hasn't been established in the argument. Why it matters: If the most mobile workers are not reliably the highest performers — just the most credentialed or networked — the whole cascade falls apart.",
          "Empirical: The 'fewest options' characterization of those who stay may be a narrative frame rather than an empirical description, potentially writing off people who have genuine preferences for in-person work or strong firm-specific ties. Why it matters: If a meaningful portion of stayers are high performers who simply prefer the office, the morale and talent-quality story gets much more complicated.",
          "Logical: The position doesn't specify what the 'recovery' side of the cost-benefit ledger contains, which makes it hard to evaluate whether it's truly negative without knowing what's being weighed against it. Why it matters: An argument that costs exceed recoveries without naming the recoveries is structurally incomplete, even if directionally correct.",
          "Empirical: The labor market conditions of late 2026 may look meaningfully different from the period when most remote-work retention data was generated, which could shift who has options and who doesn't. Why it matters: If outside options have narrowed for even highly skilled workers, the 'best people leave first' mechanism may be weaker now than when the intuition was formed.",
        ],
      },
      {
        label: "What your argument gets right",
        tone: "green",
        items: [
          "The directional intuition — that rigid location mandates create friction that disproportionately affects workers with outside options — is structurally coherent and worth taking seriously.",
          "The point about adverse selection among those who stay is genuinely underappreciated in most corporate conversations about return-to-office mandates.",
        ],
      },
      {
        label: "The question to answer",
        tone: "neutral",
        text: "If you learned that at a specific company, the employees who returned without complaint had measurably higher performance reviews than those who left — would that change your argument, or would you reframe it, and what would that tell you about which part of your position you're most attached to?",
      },
    ],
  },
  faq: [
    { q: "How can I practice debating on my own?",
      a: "State a position you hold and Argue Smarter takes the other side, then responds to each of your answers. You choose the format — freeform, Socratic, Lincoln-Douglas, cross-examination or Oxford — and how hard it pushes. At the end you get a scorecard with your blind spots and the fallacies on both sides named." },
    { q: "How do I find the weak points in my own argument?",
      a: "Have someone make the strongest honest case against it — not a caricature. The real example on this page shows that for a return-to-office argument: the single strongest criticism, the point the whole debate turns on, and four specific challenges, each with why it matters." },
    { q: "Can it argue my side so I can hear the other one?",
      a: "Yes. Mid-debate you can switch sides and argue the position you were just defending against, which is often the fastest way to see where your own case is thin." },
    { q: "Is it trying to change my mind?",
      a: "No. It argues its side forcefully because that's what sharpens your thinking, and it names what your argument gets right as well. Plenty of people finish a debate holding the same view, with better reasons for it." },
    { q: "Can it help me prepare for a real meeting or presentation?",
      a: "Devil's Advocate Prep takes your position, your audience and what's at stake, and gives you the hardest questions they're likely to ask, with ways in and things to avoid. From there you can start a full practice debate." },
  ],
  description: "The strongest arguments are usually the ones we haven't heard yet. State your position and you'll get the strongest case against it — not to prove you wrong, but to help you think more clearly.",
  guide: {
    tips: [
      "Devil's Advocate Prep before any important meeting, presentation, or difficult conversation — it's the highest-ROI mode",
      "Try Socratic format at least once — being questioned without the AI asserting anything forces you to examine your own assumptions in a way nothing else does",
      "Source Check your own claims, not just the AI's — discovering your own weak evidence mid-debate is better than discovering it in the real conversation",
      "The Fallacy Gym streak is addictive and genuinely useful — try 5 minutes a day at increasing difficulty",
      "Rematch is where real growth happens — same topic, but the AI remembers your blind spots and specifically targets them"
    ],
  }
},
{
  modified: "",
  id: "ResearchDecoder",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You read a research finding — a paper, an abstract, or a headline about one — and want to know what it actually says.",
    give: "The abstract, excerpt, or paper text — or upload it. A headline or a second paper, if you're checking coverage or comparing studies.",
    get: "The actual finding, what the study did, what the numbers mean, and what it does and doesn't support — without inventing outside research or a confidence label it can't back up.",
    edge: "It says outright when you've only given it an abstract, not the full paper, and when a question needs outside research it doesn't have.",
  },
  seoDescription: "Paste an abstract, excerpt, or research paper. Research Decoder explains what the researchers found, what they actually did, what the numbers mean, and what the study can — and cannot — tell you. Free.",
  seoTitle: "Research Paper Explainer",
  title: "Research Decoder",
  tagline: "Understand the research without becoming a researcher.",
  tags: ['research', 'research paper', 'scientific paper', 'academic paper', 'study', 'abstract', 'research summary', 'plain language research', 'study results', 'methodology', 'statistics', 'confidence interval', 'correlation', 'causation', 'limitations', 'headline check', 'research headline', 'compare studies', 'research jargon', 'evidence'],
  icon: "📄",
  categories: ['Learning'],
  headerColor: "#d4dde8",
  description: "Paste an abstract, excerpt, or research paper. Research Decoder explains what the researchers found, what they actually did, what the numbers mean, and what the study can—and cannot—tell you.",
  guide: {
      tips: [
        "Only paste what you actually have — an abstract works fine, and the tool says so rather than treating it as the full paper",
        "Headline Check needs the underlying research, not just the headline — without the paper, there's no way to tell whether the coverage matches it",
        "'What does this mean for me?' only appears after a decode, and it grounds every answer in the actual paper text plus what you say about your situation — never a generic risk score",
        "The tool says plainly when a question needs outside research it doesn't have, rather than inventing a scientific consensus to sound complete"
      ]
    }
},

{
  modified: "",
  id: "ReadTheRoom",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Before an event you're dreading, in the middle of a conversation, or after one you're replaying.",
    give: "What's going on — the event, the person, or what just happened. It works from what you actually know.",
    get: "A real read on the situation, actual lines to say, and cautions grounded in your own account — never a guess at what a stranger is thinking.",
    edge: "It reasons about plausible interpretations and gives a real judgment when the evidence supports one — it never claims to know what anyone else actually felt.",
  },
  seoDescription: "Prepare for a social situation, find words in the moment, decode what happened, or make sense of it afterward. Free social coach that reasons from what you know — never claims to read minds. No signup.",
  seoTitle: "Social Situation Coach",
  title: "Read the Room",
  tagline: "Know what to say when you're not sure what to do.",
  tags: ['read the room', 'social situation', 'social skills', 'conversation', 'small talk', 'awkward conversation', 'awkward moment', 'what to say', 'conversation stalled', 'social cues', 'what did they mean', 'networking', 'party', 'first date', 'follow up text', 'social debrief', 'social confidence', 'need to leave'],
  icon: "🎭",
  categories: ['Conversations', 'Relationships'],
  headerColor: "#e0b8b8",
  description: "Not sure what to say, how to join in, or what an interaction might have meant? Read the Room helps you prepare for social situations, find words in the moment, recover from awkward moments, and make sense of what happened afterward — without pretending it can read anyone's mind.",
  guide: {
      tips: [
        "Right Now → I said something awkward doesn't produce a severity score — most things need no repair at all, and the tool says so honestly",
        "Track recurring people and log what happened each time — after a few logged interactions, the fresh approach draws on real outcomes, not a guess at their personality",
        "Decode → What might that have meant? will give you a real judgment when the details point somewhere; it says plainly when they don't",
        "A tactic only lands in your Playbook when you click to save it after a debrief — nothing is added automatically just because the model suggested it",
        "Save a Prepare → An Event plan to pull up on your phone before you walk in"
      ]
    }
},

{
  modified: "",
  id: "MoneyDiplomat",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A money moment with a social edge — a tip, a split, a gift, a salary number.",
    give: "The situation type and the details. A saved profile sharpens everything.",
    get: "The right number, plus the words to say and how to handle the awkwardness.",
    edge: "It handles the etiquette as well as the arithmetic. Knowing the number isn't the hard part.",
  },
  seoDescription: "Navigate every awkward money moment — tips, bill splits, lending, gifts, and salary talks. Get the right number and the words to say it. Free, no signup.",
  seoTitle: "Tip & Bill Split Calculator",
  title: "Money Diplomat",
  tagline: "The right number for every money moment — tips, splits, gifts, salary",
  tags: ['money', 'money etiquette', 'money conversation', 'awkward money', 'split bill', 'who pays', 'tipping', 'pay me back', 'lending money', 'salary expectations', 'salary negotiation', 'group expenses', 'roommate money', 'family money', 'gift amount', 'donation amount', 'affordability', 'inheritance', 'subscriptions', 'travel money', 'cultural money'],
  icon: "💵",
  categories: ['Conversations', 'Money', 'Relationships'],
  headerColor: "#e0b8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Money Diplomat gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the bill below — an excerpt of a longer result, nothing reworded. The amounts are computed in code from the bill, so they add up to the cent.",
    sampleLabel: "The bill",
    sampleText: "Four of us at dinner: Ana, Ben, Cara and me. Ana and Ben shared a $48 bottle of wine and a $12 dessert that Cara and I never touched. Mains: Ana $24, Ben $22, Cara $19, me $21. Subtotal $146, tax $12.41. Everyone just assumes we're splitting the check evenly like always.",
    context: "Real run, 2026-10-08, on a bill written for this page.",
    sections: [
      {
        label: "The awkward part",
        tone: "yellow",
        text: "Cara and I would each overpay under the usual even split solely because Ana and Ben ordered a bottle of wine and a dessert the rest of us never had — roughly $22 for Cara and roughly $20 for me.",
      },
      {
        label: "Equal split (total with a 20% tip: $187.61)",
        tone: "neutral",
        items: [
          "Ana: $46.91",
          "Ben: $46.90",
          "Cara: $46.90",
          "Me: $46.90",
        ],
      },
      {
        label: "Each pays for what they had, tax and tip shared in proportion",
        tone: "green",
        items: [
          "Ana: $69.39",
          "Ben: $66.82",
          "Cara: $24.42",
          "Me: $26.98",
        ],
      },
      {
        label: "How to bring it up",
        tone: "neutral",
        text: "Hey, since Ana and Ben had the wine and dessert and the rest of us skipped those, should we just have them cover that part and split our mains separately? Probably easier than an even four-way.",
      },
      {
        label: "Next time",
        tone: "neutral",
        text: "Before the first order arrives, a quick 'should we split evenly or go by what we get?' takes ten seconds and prevents the whole awkward calculation at the end.",
      },
    ],
  },
  faq: [
    { q: "What is the fairest way to split a restaurant bill?",
      a: "When everyone ordered about the same, split evenly — it is quick and nobody minds. When orders differ a lot, or some people shared things others did not touch, each person pays for what they had, with tax and tip shared in proportion to that. Shared items are divided among the people who shared them." },
    { q: "How much should I tip on a restaurant bill in the US?",
      a: "For sit-down service in the US, 18–20% of the pre-tax bill is the usual range, and 20% is common in cities. Customs differ widely in other countries, where service may be included or tipping less expected." },
    { q: "How do I suggest not splitting evenly without being awkward?",
      a: "Say it early and make it about the specific items, not the people: 'Since you two had the wine and dessert, want to cover that and we split the rest?' Before ordering is easiest; at the end, name the items and keep it light." },
    { q: "Does Money Diplomat do the maths for me?",
      a: "Yes. When you list the items and prices, the split is calculated in code — shared items divided among the people who shared them, tax and tip in proportion — so the shares add up exactly to the bill. It also flags when the items you listed do not add up to the subtotal." },
  ],
  description: "Navigate every awkward money situation with confidence. 18 scenario types covering tips, bill splits, Venmo requests, lending, dating, gifts, roommates, salary negotiation, inheritance, group travel, subscriptions, affordability checks, cultural money norms, charity, weddings, family, and coworker collections. Plus 5 bonus modes: instant tip/split calculator, debt tracker with AI nudge messages, conversation practice simulator, usage trends with charts, and a persistent profile so you never re-explain your budget or culture.",
  guide: {
      tips: [
        "Set your profile once and forget it — every situation response will automatically factor in your budget comfort level and cultural norms without you re-explaining each time",
        "Use Quick Math mode for the 60% of situations that just need fast arithmetic — save the AI-powered mode for socially complex scenarios where you need scripts and strategy",
        "The Practice simulator is especially valuable before salary negotiations and family money conversations — rehearsing with AI builds real confidence for the actual conversation",
        "Check Trends periodically to spot patterns — if you're constantly in 'lending' situations with the same person, the data makes it easier to set a boundary"
      ]
    }
},

{
  modified: "2026-09-11",
  id: "SkillGapMap",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You want a different job and don't know what already carries over or what to investigate next.",
    give: "Your current role and the role you want — or your interests, if you're still exploring — plus the experience you want considered.",
    get: "What your experience already demonstrates, possible connections to investigate, one gap worth checking first, and a concrete next move.",
    edge: "It won't invent a proficiency score or pretend generic role knowledge is a verified job requirement.",
  },
  seoDescription: "Map what your experience already demonstrates, identify possible skill gaps to verify for a target role, and choose a practical next move. Free, no signup.",
  seoTitle: "Career Change Skill Gap Analyzer",
  title: "Skill Gap Map",
  tagline: "See what carries over. Find what to build next.",
  tags: ['career', 'skills', 'job', 'transition', 'learning', 'gap', 'resume'],
  icon: "🗺️",
  categories: ['Career', 'Decisions'],
  headerColor: "#ccdfc4",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Skill Gap Map gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the move below — an excerpt of a longer result, nothing reworded.",
    sampleLabel: "The move",
    sampleText: "From: Software engineer, 5 years backend Python/APIs. No management experience. To: Product Manager at a mid-size tech company. Skills: Python, system design, API architecture, SQL, cross-functional collaboration, some informal product work — written specs, run user interviews once. About 5 hours a week.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "Where you are starting",
        tone: "neutral",
        text: "Your backend engineering background gives you direct experience with system design, APIs, and SQL, plus some cross-functional collaboration and informal product work — written specs and at least one round of user interviews. That combination is a meaningful foundation to compare against PM roles you are considering.",
      },
      {
        label: "What carries over",
        tone: "green",
        items: [
          "Writing product specifications: Spec-writing experience may translate into producing the kind of written artifacts — requirements, briefs, acceptance criteria — that could be relevant in PM roles, depending on what those roles ask for.",
          "System design and API knowledge: This technical depth may help you evaluate technical trade-offs, communicate with engineering teams, and scope work in roles where engineering collaboration is part of the job.",
        ],
      },
      {
        label: "Start here: Product decision reasoning and trade-offs",
        tone: "yellow",
        text: "There is no supplied evidence of how you reason through competing priorities or how you would explain a product decision to a non-technical audience.",
      },
      {
        label: "Your next move",
        tone: "green",
        text: "Take a real decision from your current work — a spec you wrote, a trade-off you faced — and write out how you reasoned through it. The proof: A written decision narrative: what the situation was, what options existed, what you chose and why — a document you can review and refine, and potentially reference when talking through your product thinking.",
      },
    ],
  },
  faq: [
    { q: "How do I know which of my skills transfer to a new career?",
      a: "List what you actually did, not your job titles, then match each piece to what real job postings in the target role ask for. Strengths you can show with evidence transfer; ones you can only claim need building first." },
    { q: "Can a software engineer become a product manager?",
      a: "Yes, it's one of the more common moves. Technical depth carries over directly; the usual gap is showing how you make product trade-offs and explain decisions to non-technical people, which you can practise and document before applying." },
    { q: "What should I learn first for a career change?",
      a: "The one capability the target role expects that you can't yet show evidence of — not the longest course on the list. Skill Gap Map picks that starting point and a concrete way to prove it." },
    { q: "Does it work with a specific job posting?",
      a: "Yes, and it's more precise that way: paste a real posting and the gaps come from that employer's requirements rather than general ones." },
  ],
  description: "Thinking about a career move? Skill Gap Map starts with what your own experience actually demonstrates, then shows possible connections and gaps worth checking against the roles or job postings you're considering.",
  guide: {
      tips: [
        "Use Help Me Explore when the target itself is uncertain — the output should give you directions to investigate, not diagnose your ideal career",
        "'Not established yet' means the information you supplied does not show it; it does not mean you lack the skill",
        "A real job posting is the strongest way to turn a possible gap into a job-specific one",
        "Descriptions of your own supplied experience can be confident; descriptions of an unsourced target role should stay conditional",
        "Optional deeper sections are secondary — the first screen should still tell you what carries over, what to check, and what to do next",
      ]
    }
},

{
  modified: "2026-03-11",
  id: "HistoryToday",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Something is happening and 'this is just like Rome' isn't helping.",
    give: "The current event or trend. An angle, if you have one.",
    get: "A structural parallel — same underlying mechanism, not same surface — and what happened next that time.",
    edge: "It matches on mechanism rather than resemblance, which is why the parallel it finds isn't the obvious one.",
  },
  seoDescription: "Enter any current event and get 2-3 deep historical parallels based on real power dynamics — what happened next, and where the comparison breaks down. Free.",
  seoTitle: "History Parallels for Today",
  title: "History Today",
  tagline: "Find the structural historical parallel — not the obvious one",
  tags: ['history', 'current events', 'parallels', 'context', 'analysis', 'pattern', 'news'],
  icon: "📰",
  categories: ['Just for Fun', 'Learning'],
  headerColor: "#b8dcd8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what History Today gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the event below — the opening summary and the first of its two parallels, nothing reworded.",
    sampleLabel: "The current event",
    sampleText: "A billionaire buying a major media platform",
    context: "Real run, 2026-10-07 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "The big idea",
        tone: "green",
        items: [
          "When one person buys the platform everyone else depends on to know what is happening, owning it is the power — whatever they say they plan to do with it.",
          "Throughout history, people have consistently underestimated how much the owner of a shared information channel shapes what the public thinks is true and what it thinks matters, because the shaping happens through selection and emphasis rather than outright lies. Institutions built to check that kind of power tend to discover, too late, that they were designed for a world where no single private hand held the whole pipe.",
        ],
      },
      {
        label: "Parallel: Hearst and the press wars · structural match 81%",
        tone: "neutral",
        items: [
          "The owner uses the platform's reach as a direct instrument of personal political ambition, making the commercial and the ideological impossible to untangle from the outside. Then: Hearst ran papers at a financial loss for years because the circulation numbers gave him leverage over politicians and parties; advertisers and readers subsidized an operation whose real product was Hearst's influence, not news. Now: A billionaire acquiring a major platform today similarly holds something whose value to the owner may be primarily political — the ability to set the terms of public conversation, reward allies, and punish opponents — rather than the return on the investment itself.",
          "Ownership of the distribution infrastructure is the prize, because whoever controls what stories reach the public controls which version of reality becomes the default one. Then: Hearst did not need to invent events from nothing; he could simply choose which real events to amplify, which to ignore, and what framing to wrap around them — and his competitors had to respond to his agenda even when they despised it. Now: A social media platform exercises the same structural power through what it surfaces and suppresses algorithmically, meaning the owner shapes the information environment without needing to write a single word of content.",
        ],
      },
      {
        label: "Where the comparison breaks down",
        tone: "yellow",
        items: [
          "Hearst's power was additive and slow — each new paper took years to build circulation and required a city with a printing press and a newsroom full of humans — whereas a platform acquisition today transfers billions of existing relationships instantly, so the speed at which the new owner can reshape the information environment is categorically different and gives regulators and competitors almost no adjustment period.",
          "Hearst operated in a fragmented media market where a reader in Cleveland could simply not encounter his New York paper; a global platform has no geographic walls, which means the owner's editorial choices propagate everywhere simultaneously and the concept of a local competing alternative that insulates some audience from the owner's influence barely exists.",
        ],
      },
      {
        label: "The surprise",
        tone: "neutral",
        text: "Hearst's papers were most politically powerful not when they were profitable but when he was willing to lose money on them — the capacity to absorb losses that would destroy a normal business was itself the weapon, and that same logic applies today: a billionaire owner who does not need the platform to pay for itself is structurally immune to the market pressures that ordinarily discipline media behavior.",
      },
      {
        label: "What the pattern suggests",
        tone: "neutral",
        items: [
          "Where this went before was a slow merger of the owner's personal interests with what the platform treated as newsworthy, followed eventually by a backlash that produced new rules — but only after the owner had already used the window to reshape the political landscape in ways the new rules could not reverse.",
          "When it stops applying: These parallels stop applying if the platform in question no longer functions as a genuine shared public square — if audiences have already fragmented so thoroughly that no single outlet, however large, can set the agenda the way Hearst's papers or Rome's grain supply once did.",
          "How far to trust it: These parallels are reliable about the structural incentive — that owning distribution is owning influence — but they are a poor guide to speed and scale, since the feedback loops of a global real-time network have no clean historical equivalent.",
        ],
      },
    ],
    disclaimer: "Historical parallels are a way to think, not a forecast. Dates and figures are worth checking against a history source before you quote them.",
  },
  faq: [
    { q: "Has anything like this happened before?",
      a: "Often, yes — not the same event, but situations driven by the same mechanism. History Today finds two parallels, explains what's structurally the same and, just as important, where the comparison breaks down. The real example on this page compares a billionaire buying a media platform with William Randolph Hearst's newspaper empire." },
    { q: "How is this different from “it's just like the fall of Rome”?",
      a: "It matches on mechanism — who controls what, which incentives are at work — rather than on surface resemblance, and it avoids the most overused analogies unless they genuinely fit best. Every parallel comes with its weak points." },
    { q: "Can history predict what happens next?",
      a: "No. It can show where similar situations went before and under what conditions that pattern would stop applying. Each result says how far to trust the parallel and what it's a poor guide to." },
    { q: "Can I go deeper on one parallel?",
      a: "Yes — Dig Deeper expands a parallel into a fuller timeline, and the Counter-Example finds a case where similar conditions led somewhere different." },
    { q: "Is the history accurate?",
      a: "It aims to be, and names real people, dates and books, but it can slip on specific details. Treat it as a starting point and check any date or figure before you rely on it." },
  ],
  description: "Today's headlines rarely happen for the first time. Enter a current event, and DeftBrain will find historical situations that unfolded for similar reasons — including where the comparison succeeds and where it fails.",
  guide: {
    tips: [
      "Specific events get better parallels than broad trends. 'Congress debating AI regulation' is better than 'AI is changing things.'",
      "Use the angle field to steer toward what you care about — same event can parallel different things depending on the lens.",
      "The 'Where It Breaks Down' section is where the real insight lives. Read it carefully.",
      "Dig Deeper is worth it for the echoing quotes — hearing what people said 200 years ago that sounds like today's headlines.",
      "The Counter-Example is the intellectual honesty check. If similar conditions sometimes produce different outcomes, you can't be certain of the prediction.",
      "Try the same event with different angles to see multiple facets."
    ],
    
  }
},

{
  modified: "",
  id: "BragSheetBuilder",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Review season, a promotion case, or a resume that undersells you.",
    give: "What you did in your own words. The Memory Jogger helps if you've forgotten.",
    get: "Power statements with real verbs and numbers, plus the case built around them.",
    edge: "Most people describe their work in the language of tasks. This converts it to the language of impact without inflating it.",
  },
  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    { q: "What is a brag sheet and why do I need one?",
      a: "A brag sheet is a running record of your wins, impact, and praise — the raw material for performance reviews, promotion cases, and resume updates. You need one because memory fails exactly when reviews happen: you'll remember last month, forget February's fire you put out, and undersell a year of work. Brag Sheet Builder turns your rough notes into structured, quantified accomplishment bullets." },
    { q: "How do I write self-review bullets that don't sound like bragging?",
      a: "Anchor every claim to outcomes and evidence: 'reduced onboarding time by three weeks by rewriting the setup docs' isn't bragging, it's reporting. The discomfort usually comes from adjectives; the fix is numbers and nouns. The tool rewrites your plain descriptions into that evidence-first register." },
    { q: "How do I quantify accomplishments when I don't have exact numbers?",
      a: "Use honest magnitudes: 'roughly halved', 'from about ten hours to two', 'across four teams'. Reasonable estimates labeled as estimates beat vague adjectives every time. The tool prompts you for the dimensions you can estimate — time saved, frequency, people affected, money involved — and builds bullets from those." },
    { q: "What should I do when I can't remember what I accomplished this year?",
      a: "Mine your artifacts: sent emails, closed tickets, merged PRs, calendar entries, praise messages you half-remember. Dump whatever fragments you find into the builder — reconstructing impact from fragments is specifically what it does. Then keep the sheet running so next cycle isn't archaeology." },
    { q: "When should I update my brag sheet?",
      a: "Little and often — a two-line note the day something lands, while the details and numbers are fresh. A monthly fifteen-minute pass beats a yearly panic. The painful truth of review season is that undocumented impact reads as no impact." },
  ],
  seoDescription: "Turn humble work notes into polished achievement statements, then tailor them to any job, prep interviews, and build raise ammunition. Free brag sheet tool, no signup.",
  seoTitle: "Brag Sheet Generator",
  title: "Brag Sheet Builder",
  tagline: "Remember your work. Recognize your strengths. Tell your story with confidence.",
  tags: ['my boss', 'my manager', 'resume', 'achievements', 'career', 'promotion', 'accomplishments', 'interview', 'linkedin', 'performance review', 'raise', 'salary negotiation', 'job search', 'brag sheet', 'bullets', 'cv', 'job application', 'cover letter', 'behavioral interview', 'confidence', 'work history', 'wins', 'strengths', 'star stories', 'voice match'],
  icon: "🏆",
  categories: ['Career', 'Work & Meetings'],
  headerColor: "#d4dde8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what Brag Sheet Builder gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on a list of seven accomplishments — an excerpt, nothing reworded.",
    sampleLabel: "One of the accomplishments, as written",
    sampleText: "Led the migration of our payment processing system from a legacy monolith to a microservices architecture, reducing checkout latency by 38% and eliminating a class of timeout-related support tickets that had been the #1 source of customer complaints.",
    context: "Real run, 2026-10-07 — senior engineer, B2B SaaS, for a résumé. One of the tool's own built-in examples.",
    sections: [
      {
        label: "Rewritten",
        tone: "green",
        text: "Led end-to-end migration of payment processing system from legacy monolith to microservices architecture, cutting checkout latency 38% and eliminating the #1 category of customer-facing support tickets — timeout errors that had persisted as the top complaint driver.",
      },
      {
        label: "What changed",
        tone: "neutral",
        text: "Anchored 'end-to-end' to signal full ownership scope; reframed ticket elimination as a customer experience outcome, not just an ops win; sharpened the causal chain so the reader sees business impact, not just technical change.",
      },
      {
        label: "Why it counts",
        tone: "neutral",
        text: "You did not just execute a migration — you owned the outcome on both the performance side (38%, a hard number) and the customer experience side (eliminated the #1 complaint category). That is a product-level result delivered by an engineer.",
      },
      {
        label: "Numbers worth finding",
        tone: "yellow",
        items: [
          "Do you know the volume of timeout-related support tickets per week or month before the migration, and how many remained after? Ticket count before and after turns 'eliminated a class of tickets' from a qualitative claim into a quantifiable support cost reduction — and signals scale to a hiring reader.",
          "How many mid-level engineers are on the team or were in the broader org at the time? And do you know the typical time-to-senior for engineers at your company? If the org average time-to-senior is longer than 18 months, your mentees outpaced it — which reframes your 2-of-3 figure from a raw number into a benchmark-beating result.",
        ],
      },
      {
        label: "Résumé bullets",
        tone: "green",
        items: [
          "Led end-to-end migration of payment processing system from legacy monolith to microservices, cutting checkout latency 38% and eliminating the #1 source of customer support tickets — timeout errors that had persisted as the top complaint category.",
          "Diagnosed and resolved a recurring production memory leak in the background job processor, eliminating a daily 3am on-call incident pattern; authored the postmortem, adopted as required onboarding reading for new infrastructure hires.",
        ],
      },
    ],
    disclaimer: "Check every bullet against what actually happened before you use it — a résumé claim has to survive an interview question.",
  },
  description: "Most people remember their mistakes more easily than their accomplishments. Tell DeftBrain what you've been working on, and we'll help you recognize, organize, and communicate the value you've already created.",
  crossRefs: ['DifficultTalkCoach', 'ColdOpenCraft'],
  guide: {
    tips: [
      "Use the Journal between reviews. Even one sentence a week produces dramatically better brag sheets.",
      "The Excavator is most powerful when you fill in role + industry first — questions get very specific.",
      "After building, check Radar FIRST. It tells you where to dig for more accomplishments.",
      "For job applications: Build → Tailor with JD → Interview tab → Voice Match. That's the complete pipeline.",
      "Tweak buttons (Softer / Stronger / Reword) let you fine-tune without regenerating everything.",
      "You can add accomplishments to existing results without starting over — hit Add More.",
      "Voice Match works best with a 100+ word sample of casual professional writing."
    ],
    
  }
},

{
  modified: "2026-03-11",
  id: "LayoverMaximizer",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Before you book, the night before you fly, or standing in the terminal right now.",
    give: "The airport, how long you have, and what you want out of it.",
    get: "Go, stay, or risky — the arithmetic that decided it, one recommended plan, and a time to be back by.",
    edge: "It won't invent what you didn't tell it. No passport means no immigration estimate, and it says so — then asks for the one fact that would change the answer.",
  },
  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    { q: "Can I leave the airport during a layover?",
      a: "Often yes — if you have enough time, the right visa situation for the country you're connecting in, and your bags are checked through. The three gating questions are: do I need a transit visa, will I have to re-clear security (and possibly immigration), and when must I be back airside. Layover Maximizer runs that math for your specific airport and layover length before suggesting anything." },
    { q: "How much layover time do I need to leave the airport?",
      a: "A working rule: under 4 hours, stay airside; 5-7 hours buys a quick nearby excursion if transit to the city is fast; 8+ hours makes a real visit possible. The honest calculation isn't the attraction time — it's transit both ways, security re-entry, and a safety buffer, which is exactly the time math the tool makes conservative and explicit." },
    { q: "What happens to my luggage during a long layover?",
      a: "On one ticket, checked bags are usually tagged through to your final destination — you roam free. On separate tickets, you'll likely have to collect and re-check, which can consume the whole layover. Verify at check-in with the phrase 'is my bag tagged through to [final city]?' before making plans." },
    { q: "Do I need a visa to leave the airport during a layover?",
      a: "It depends on the country and your passport — some places offer visa-free transit or special transit visas, others require a full visa the moment you cross immigration. This changes frequently and by nationality, so verify with official sources; the tool flags when your plan involves crossing immigration so you know to check." },
    { q: "What should I do on a long layover if I stay in the airport?",
      a: "Airports reward planning: lounges with day passes, sleep pods, showers, and sometimes free city tours run by the airport itself for transit passengers. Tell the tool your airport and hours and it builds an airside plan ranked by what's actually worth your specific window." },
  ],
  seoDescription: "Turn dead layover time into the best part of your trip. Get a YES/NO/RISKY verdict with exact time math, gate-to-gate routes, and lounge finds. Free, no signup.",
  seoTitle: "Layover Trip Planner",
  title: "Layover Maximizer",
  tagline: "Turn dead time into a memorable part of your trip",
  tags: ['layover', 'stopover', 'connecting flight', 'airport', 'long layover', 'leave the airport', 'transit visa', 'kill time', 'airport lounge', 'city tour', 'connection time', 'travel'],
  icon: "✈️",
  categories: ['Travel & Events'],
  headerColor: "#ccdfc4",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what Layover Maximizer gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the layover below — an excerpt, nothing reworded.",
    sampleLabel: "The layover",
    sampleText: "Amsterdam Schiphol (AMS), 5 hours, landing 08:30. US passport, no checked bags. Arriving at non-Schengen arrivals, connecting to Schengen departures. Travel style: efficient.",
    context: "Real run, 2026-10-07 — one of the tool's own built-in examples. Queue times are estimates.",
    sections: [
      {
        label: "Leaving the airport: risky",
        tone: "yellow",
        text: "Five hours sounds comfortable, but a US passport holder arriving into Schengen from a non-Schengen flight must clear passport control on the way out — and that queue alone can run 30–45 minutes unpredictably; the arithmetic leaves roughly 130 minutes in the city, which is tight enough that one slow queue kills the plan.",
      },
      {
        label: "The time math: 130 minutes in the city, back by 12:20",
        tone: "neutral",
        text: "300 minutes total, minus 15 (deplaning and walking to passport control), minus 45 (Schengen entry immigration — worst-case with 15-minute buffer added), minus 20 (Sprinter train to Amsterdam Centraal), minus 20 (train back to Schiphol), minus 40 (security re-entry into departures), minus 30 (buffer before gate) leaves 130 minutes in the city. You must be back at Schiphol by 12:20 to protect that buffer.",
      },
      {
        label: "Know before you go",
        tone: "red",
        text: "Schiphol is a single-terminal building, but Non-Schengen arrivals and Schengen departures use different landside and airside zones — after clearing passport control and customs you will be in the main departure hall, and will need to find and queue for Schengen security on your return; budget the full 40 minutes for this re-entry step.",
      },
      {
        label: "The plan it suggests: clear customs, then own the lounge.",
        tone: "green",
        items: [
          "08:30 — Deplane and follow Non-Schengen arrival signs.",
          "08:45 — Clear passport control and customs.",
          "09:15 — Clear Schengen security and enter departure area.",
          "09:30 — Settle into a lounge until 12:45.",
          "Leave for the gate: 12:45",
        ],
      },
      {
        label: "What would change the answer",
        tone: "neutral",
        items: [
          "Which airport are you arriving from — is it a Schengen country or non-Schengen? If your inbound flight is actually from within Schengen, you will not face passport control on arrival and would save 30–45 minutes, changing the verdict to a clearer YES with more comfortable city time.",
          "What time does your departing Schengen flight board — is there an early boarding call? Some short Schengen hops board 45–50 minutes before departure; if boarding is earlier than 13:00, your return-by deadline tightens and the plan becomes riskier.",
        ],
      },
    ],
    disclaimer: "Border and security wait times vary by day and season; check the airport's own guidance before you leave the terminal.",
  },
  description: "Your layover isn't just a block of time. It's a puzzle to solve. DeftBrain looks at your connection, subtracts everything that gets in the way, and tells you what remains. Then it builds a plan around the hours you actually have—not the hours you thought you had.",
  guide: {
    tips: [
      "Use Compare when booking — the layover can make or break a trip",
      "Gate-to-Gate is useful on every connection, not just long layovers",
      "Generate the Survival Kit before you fly — you might not have WiFi when you land",
      "The Delay Tracker threshold scale shows exactly when to abandon your exploration plan",
      "Save your hub airports — frequent flyers keep rediscovering the same places"
    ],
    beforeYouGo: "Before leaving the airport, check the entry rules for your passport on an official government site. This plan assumes you're allowed out.",

  }
},

{
  modified: "",
  id: "TheFinalWord",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "An argument that won't end, or a fact nobody can confirm.",
    give: "The question or the dispute. Pick Quick Answer, Settle It, Fact Check or Trivia.",
    get: "A confident answer with a confidence rating, or a verdict on the disagreement.",
  },
  seoDescription: "Settle any argument for good — get confident answers, impartial verdicts with accuracy scores, fact-checks, and trivia rounds. Free argument settler, no signup.",
  seoTitle: "Argument Settler & Fact Checker",
  title: "The Final Word",
  tagline: "Arguments settled. Facts checked. No appeals.",
  tags: ['fact check', 'factual question', 'settle argument', 'disagreement', 'who is right', 'truth', 'myth', 'misleading claim', 'quick answer', 'trivia', 'debate', 'verify claim', 'confidence'],
  icon: "⚖️",
  categories: ['Conversations', 'Learning'],
  headerColor: "#e0b8b8",
  description: "Some questions have an answer. Some arguments have two. The Final Word sorts out what’s true, what’s uncertain, and what’s just opinion — clearly, fairly, and without pretending to know more than it does.",
  guide: {
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
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You have a shortlist and need to know which name survives contact.",
    give: "The name or names, and what it's for.",
    get: "A twelve-dimension read — first impression, sound, spelling, crowding, trademark risk — and a verdict.",
    edge: "It's the other half of naming: NameStorm gives you options, this tells you which ones break.",
  },
  seoDescription: "Stress-test any name — business, pet, band, baby, or brand — across 12 dimensions before you commit. Free, with live domain and social checks.",
  seoTitle: "Name Checker: Business, Pet, Baby",
  title: "Name Audit",
  tagline: "Stress-test any name before you commit",
  tags: ['name', 'naming', 'brand name', 'business name', 'product name', 'project name', 'name evaluation', 'name audit', 'naming decision', 'compare names', 'naming finalists', 'pronunciation', 'spelling', 'memorability', 'word of mouth', 'distinctiveness', 'brand fit', 'naming risk', 'trademark concern', 'domain availability'],
  icon: "🔍",
  categories: ['Career', 'Decisions'],
  headerColor: "#ccdfc4",
  description: "The deepest name analysis you can get without hiring a naming agency. Stress-tests any name across 12 dimensions: phonetics, memorability (including the drunk test), global language scan for unintended meanings, visual analysis, radio test, SEO, competitive landscape, longevity, and emotional resonance. Includes live domain and social handle availability checks. Also has a head-to-head Compare mode for choosing between finalists.",
  guide: {
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
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You need a name and the good ones feel taken.",
    give: "What needs naming, and the energy you want.",
    get: "Twenty-five to thirty-five names across styles, with the reasoning behind each.",
  },
  seoDescription: "Generate dozens of brandable names for your business, product, pet, or band in seconds. Free namer with pronunciation guides and live domain checks.",
  seoTitle: "Business & Brand Name Generator",
  title: "Name Storm",
  tagline: "Name anything. Know it works before you commit.",
  tags: ['name', 'brand', 'brainstorm', 'business', 'product', 'startup'],
  icon: "⚡",
  categories: ['Career', 'Ideas & Imagination'],
  headerColor: "#ccdfc4",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what Name Storm gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the brief below — an excerpt of a long result, nothing reworded.",
    sampleLabel: "The brief",
    sampleText: "Business name for subscription meal planning for busy families who want to eat healthier. Vibe: bold, minimalist — confident and a little playful, feels premium but approachable. Constraints: 2 syllables, easy to spell and say, works as a .com.",
    context: "Real run, 2026-10-07 — one of the tool's own built-in examples. The full result had 20 names in five styles.",
    sections: [
      {
        label: "The brief, as it read it",
        tone: "neutral",
        text: "These names treat the service as something confident and a bit clever — short, easy to remember, and they make people smile without being loud about it.",
      },
      {
        label: "Top picks",
        tone: "green",
        items: [
          "Vorda: Short, invented, and nothing else in food sounds like it — easy to spell the first time you hear it, and it has the punch the brief asks for without any of the flags dragging it down.",
          "Fable: Two clean syllables, nothing to puzzle over when spelling it, and it quietly says that family dinner together is worth telling a story about — minimal and approachable without feeling hollow.",
          "Mise: Borrows from the chef term for having everything ready before you cook, which is the exact promise to families — a little bit insider knowledge without being obscure enough to confuse people.",
        ],
      },
      {
        label: "A name with flags: Plato",
        tone: "yellow",
        items: [
          "It is a plate plus a plan smashed together, and it sounds like a name people already know how to say. It has a little wit without trying too hard.",
          "Caution: Plato's Closet is a known retail chain — some association bleed possible",
          "Warning: Plato as a standalone word has existing trademark registrations across food and education categories worth searching",
          "Domain: Almost certainly taken — common word with wide appeal.",
        ],
      },
    ],
    disclaimer: "Trademark and domain notes are flags to check, not legal clearance — the live availability check and a trademark search are the next steps.",
  },
  faq: [
    { q: "How do I come up with a business name?",
      a: "Describe what you're naming, the feeling you want and any hard rules (length, spelling, a .com). Name Storm generates names across several styles, flags problems with each, and picks a top five with reasons — the real example on this page is a meal-planning brand." },
    { q: "Does it check if the name is taken?",
      a: "It flags likely conflicts as it goes — existing brands, trademark risk, crowded domains — and has a live check for domain and social handle availability. Neither replaces a proper trademark search before you commit." },
    { q: "What can it name?",
      a: "Businesses and products, but also babies, bands, pets, podcasts, Wi-Fi networks and more — each category gets the styles that suit it." },
    { q: "What does “say it out loud” mean?",
      a: "A test for names that look fine written down but trip people up when spoken: hard to spell after hearing it, easy to mishear, or shortened into something you wouldn't choose." },
    { q: "I almost like one of the names. Can I get more like it?",
      a: "Yes — “More like this” generates variations on any single name, keeping what you liked about it." },
  ],
  description: "Names are deceptively hard. They need to sound right, fit your audience, be easy to remember, and still feel right six months from now. Describe what you're naming, and DeftBrain will help you find a name that works before you commit.",
  guide: {
      tips: [
        "Vibe chips prime the AI's creative direction — select 2-4 that describe the energy, then add nuance in the text field",
        "The 'More Like This' button is the most powerful feature — when you see a name you 70% love, use it to find the one you 100% love",
        "Domain checks use DNS lookups — 'likely available' means the domain doesn't resolve, but confirm with a registrar before purchasing",
        "Problem flags check major world languages — a clean flag (✓) means no issues were found, but consider checking with native speakers for important names",
        "For business names, the best names are often in the Mashup/Coined category — they're unique, trademarkable, and more likely to have domains available"
      ],
      beforeYouGo: "Before you buy a domain or print anything, search the trademark register yourself. The availability notes here are early warnings, not clearance.",

    }
},

{
  modified: "2026-03-11",
  id: "GratitudeDebtClearer",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You owe someone a thank-you and keep not writing it.",
    give: "Who it's for and bullet points of what you're grateful for. Specifics matter.",
    get: "A finished message that sounds like you meant it.",
  },
  seoDescription: "Turn a few bullet points into a heartfelt, genuine thank-you message in seconds. For when you mean it but freeze up writing it. Free, no signup.",
  seoTitle: "Thank-You Note Writer",
  title: "Gratitude Debt Clearer",
  tagline: "Turn what happened into the thank-you you've been meaning to send.",
  tags: [
    'thank you', 'thank you message', 'thank you note', 'thank you email', 'thank you card',
    'gratitude', 'appreciation', 'appreciation message', 'sincere thanks', 'professional thank you',
    'personal thank you', 'what to say',
  ],
  icon: "💝",
  categories: ['Conversations', 'Relationships'],
  headerColor: "#e0b8b8",
  description: "Tell us who you want to thank and what they did. Get a few natural ways to say it—so your message feels specific, sincere, and like something you would actually send.",
  guide: {
      tips: [
        "Be SPECIFIC in your gratitude points. Instead of 'helped me,' write 'spent 4 hours debugging my code' or 'listened without judging when I was struggling.' Specific details = personal messages.",
        "If a message feels too formal or mushy, click 'Too mushy?' to get a more understated version. If it's too vague, click 'More specific?' to elaborate on the details.",
        "The 'awkwardness acknowledgment' box at the top is there for a reason — it's totally normal to feel weird about formal thank-yous. The tool validates this while helping you do it anyway.",
        "Use the delivery suggestions! The AI recommends the best method (text, email, handwritten card) and timing based on your context. A post-interview thank-you should go out within 24 hours, but a friend who helped you move can get a card a few days later.",
        "Save the personalization tips — they're gold. They suggest specific details you could add to make the message even more meaningful, like mentioning how their help affected you or what you learned from them."
      ],
    }
},
// ── DifficultTalkCoach tools.js entry ──
// Replace existing entry (id: "DifficultTalkCoach")

{
  modified: "2026-03-11",
  id: "DifficultTalkCoach",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A conversation you keep postponing.",
    give: "What you need to say, who it's with, your goal, and how much resistance you expect.",
    get: "Several approaches with exact scripts, the pushback each will get, and how to answer it.",
    edge: "It rehearses their side too, so the sentence you didn't prepare for isn't the one that ends the conversation.",
  },
  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    { q: "How do I start a difficult conversation?",
      a: "The first sentence carries the whole conversation — start with your purpose and care for the relationship, not the accusation: 'I want to talk about something because the friendship matters to me' beats any opening that begins with 'you'. Difficult Talk Coach scripts your actual opener, plus the follow-ups, from what you tell it about the situation and what you're afraid of." },
    { q: "What if the other person gets defensive?",
      a: "Expect it and plan for it — defensiveness is a first reaction, not a final answer. The coach builds you responses for the likely reactions (denial, counter-attack, shutting down), so you're not improvising at the exact moment you're most emotional. Naming their feeling ('I can see this landed badly') usually de-escalates faster than repeating your point." },
    { q: "Should I have a hard conversation in person, by phone, or by text?",
      a: "In person or by phone for anything with real emotional weight — tone carries the repair signals text strips out. Text works for scheduling the conversation ('can we talk this week about…'), which is often the courageous first step. Never deliver a hard truth for the first time in a message they'll re-read forever." },
    { q: "How do I prepare emotionally for a confrontation?",
      a: "Rehearse the opener out loud, decide in advance the one outcome you need (versus the ten you'd like), and script your exit line for if it goes badly. Knowing what you'll say when it goes wrong is what keeps your nervous system in the room. The coach includes exactly this contingency planning." },
    { q: "What if I've already tried talking to them before?",
      a: "Tell the coach that — prior failed attempts change the script. A conversation that ignores history invites 'we've been over this'; one that opens with it ('I know we've talked about this and it didn't stick — I want to try differently') resets the frame instead of replaying it." },
  ],
  seoDescription: "Prepare for any hard conversation with exact scripts, predicted pushback, and a live practice mode. Set boundaries, give feedback, or say no. Free coaching.",
  seoTitle: "Hard Conversation Coach",
  title: "Difficult Talk Coach",
  tagline: "Practice hard conversations before they happen",
  tags: ['my boss', 'my manager', 'difficult conversation', 'hard talk', 'confrontation', 'feedback', 'conflict', 'nervous', 'boundary', 'script', 'rehearse'],
  icon: "🗣️",
  categories: ['Conversations', 'Relationships'],
  headerColor: "#e0b8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what Difficult Talk Coach gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the conversation below — an excerpt of a long result, nothing reworded.",
    sampleLabel: "The conversation",
    sampleText: "Asking my manager for a raise. I've taken on more responsibility this year and want to make the case before annual review cycle ends. Biggest fear: they'll say no and then think of me as 'the one who asked' for the rest of the year. Hinted twice in 1:1s about wanting to grow into a senior role; both times the conversation moved on.",
    context: "Real run, 2026-10-07 — style: straightforward. One of the tool's own built-in examples.",
    sections: [
      {
        label: "First",
        tone: "green",
        text: "You've taken on more than your original role and you're asking for that to be recognized before the review window closes — that's a straightforward professional request, not an imposition. The fact that you've already hinted twice and been passed over in conversation means going direct is overdue, not pushy. Asking for a raise when your responsibilities have grown is how these things are supposed to work.",
      },
      {
        label: "A reality check",
        tone: "neutral",
        text: "Your manager may respond with something about budget timing being out of their hands right now — and that may genuinely be true, not just a brush-off. If that happens, it doesn't mean they think less of you for asking; it more likely means the conversation landed and they're navigating something you can't fully see from your seat.",
      },
      {
        label: "One approach: collaborative",
        tone: "green",
        items: [
          "Opening: “Hey, I wanted to carve out a few minutes to talk about something that's been on my mind. I know budget stuff is happening at a higher level right now, so I want to be upfront that I'm not expecting an answer today — I just want to have the actual conversation before review season wraps.”",
          "Name what has changed in your role — not as a complaint, but as a plain description: 'Since [whatever shifted], I've been doing [specific thing] that wasn't really part of my original scope. I've been glad to take it on, but I think it's worth talking about whether my comp reflects where the role actually is now.'",
          "Ask what their view is before pushing further: 'I'm curious how you see it — do you think the role has grown, or am I framing it in a way that doesn't match what you're seeing?' This is a real question, not a trap. Their answer tells you a lot about what the path forward looks like.",
          "Put a number or a range on the table — vagueness has already let this slide twice in your 1:1s: 'If this is something you can go to bat for, I'm thinking something in the range of [X]. I'd rather name it than leave it fuzzy.'",
        ],
      },
      {
        label: "If they say the timing is bad",
        tone: "yellow",
        items: [
          "The instinct: Say 'oh no, totally, I get it, we can revisit this later' — and then later never comes.",
          "Instead: Say something like: 'I hear you on the timing. I guess what I'm asking is — is this something you'd want to go to bat for when that window opens, or is there something I should know about where I stand?'",
        ],
      },
      {
        label: "If they push back",
        tone: "neutral",
        items: [
          "If they deflect or change the subject, say: 'I want to come back to the compensation question before we move on — can we stay on that for a few more minutes?'",
          "If they try to negotiate, say: 'I'm open to talking through what's possible — what I need is to know we're actually moving toward something, and roughly when.'",
          "If they go silent, say: 'I'll give you some time to think. Can we reconnect on this by [specific date] so I'm not just waiting without knowing where things stand?'",
        ],
      },
    ],
  },
  description: "Some conversations become difficult long before they actually happen. Tell DeftBrain what's weighing on you, and we'll help you plan the conversation, practice it, and prepare for what might happen next.",
  guide: {
    tips: [
      "The 'biggest fear' field is the most important optional input — it directly shapes the emotional landmine analysis",
      "Practice mode calibrates to your resistance slider — start at 40% to build confidence, then crank it to 70-80% for stress testing",
      "The opening line is the hardest part — practice saying it out loud 3-5 times before the real conversation",
      "If you get overwhelmed in practice mode, that's useful information — it tells you which moments need more preparation",
      "The debrief is more useful if you do it within 24 hours while the conversation is still fresh"
    ],
  }
},
{
  modified: "",
  id: "ComplaintEscalationWriter",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You've complained once, been fobbed off, and stopped.",
    give: "The company, the industry, and what happened — dates, amounts, promises, names.",
    get: "A step-by-step plan with the rules that may apply, the letters to send, and who to contact at each step.",
    edge: "Most complaints fail because people don't know what leverage they have. This finds the statute and the regulator before it writes a word.",
  },
  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    { q: "How do I write a complaint letter that actually gets results?",
      a: "Effective complaints are factual, specific, and quietly signal you'll escalate: what happened with dates and amounts, what you've already tried, exactly what resolution you want, and a reasonable deadline. Complaint Escalation Writer drafts this for you at the right temperature — firm without ranting, because rants get filed and facts get processed." },
    { q: "What do I do when a company ignores my complaint?",
      a: "Escalate in stages, in writing: front-line support, then a supervisor or the executive/CEO email route, then external pressure (regulator, consumer-protection agency, chargeback, or small claims where it applies). Each stage gets a different letter — the tool generates the full 5-stage ladder so you always know your next move." },
    { q: "How long should I wait before escalating a complaint?",
      a: "Give each stage one reasonable deadline — typically 7 to 14 days, stated explicitly in your letter ('I expect a response by…'). Silence past your stated deadline is your green light. Escalating without having set a deadline is the most common complaint mistake; it lets each level restart the clock." },
    { q: "Should I threaten legal action in a complaint letter?",
      a: "Not early, and never vaguely — empty threats get complaints routed to legal and slow everything down. The escalation ladder saves formal remedies (regulator complaints, chargebacks, small claims) for the stage where you actually intend to use them, and words them as stated next steps rather than threats." },
    { q: "Who do I complain to when customer service can't help?",
      a: "Above and outside: the company's executive contact route, then the external body with actual power over them — a financial ombudsman for banks, aviation authority for airlines, consumer-protection agency for retail. The tool identifies which external stage fits your situation and drafts that letter in the formal register those bodies expect." },
  ],
  seoDescription: "Won't they make it right? Get a full escalation campaign — ready-to-send complaint letters, cited laws, chargeback steps — to win your refund. Free, no signup.",
  seoTitle: "Complaint Letters",
  title: "Complaint Escalation Writer",
  tagline: "A clear plan for when a company stops answering",
  tags: ['complaint', 'customer service', 'escalate', 'refund', 'manager', 'dispute', 'letter', 'consumer rights', 'legal', 'chargeback', 'negotiate', 'advocate', 'rights', 'BBB', 'FTC', 'regulate', 'company', 'billing'],
  icon: "📧",
  categories: ['Conversations', 'Money'],
  headerColor: "#c0d8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what Complaint Escalation Writer gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the complaint below — an excerpt of a five-stage plan, nothing reworded.",
    sampleLabel: "The complaint",
    sampleText: "Switched plans in June and was quoted a $45/month rate in writing over chat. Every bill since has been $71. Support says the chat quote 'does not reflect current promotions' and has refused to honor it. This is the fourth billing cycle at the wrong rate. Three chat sessions (transcripts saved), one phone call transferred four times and disconnected, no callback.",
    context: "Real run, 2026-10-07 — a fictional mobile company (“Horizon Mobile”) from the tool's own built-in examples; tone: firm.",
    sections: [
      {
        label: "Where you stand",
        tone: "green",
        text: "You have a written quote — from the company's own chat system — for a specific rate. That is the most durable piece of evidence in a billing dispute. The subsequent bills at a higher rate, paired with three inconsistent explanations, mean the factual record is almost entirely on your side. The next step is to put that record in front of someone at the company who has the authority to act on it, in writing, all at once.",
      },
      {
        label: "Evidence to gather",
        tone: "neutral",
        items: [
          "Chat transcripts from all three support sessions — The original rate quote lives here, and the three different explanations are your clearest evidence of an inconsistent company position.",
          "Four months of billing statements showing the $71 charge — These establish the gap between the quoted rate and the billed rate, and show the duration of the dispute.",
          "Documentation of the phone call and the missed callback — A promised callback that was not delivered is relevant context when describing how the dispute has been handled.",
        ],
      },
      {
        label: "Stage 1 — send this today",
        tone: "neutral",
        items: [
          "Subject: Billing discrepancy since June — written quote of $45/month not reflected in charges",
          "When I switched plans in June, I received a written quote of $45 per month via Horizon Mobile's own chat support. Every bill since has come to $71, a difference of $26 per month that has now persisted across four billing cycles. I have saved the original chat transcript confirming the quoted rate, as well as records of three follow-up chat sessions and a phone call that ended in a disconnection with no callback as promised. I am asking for a written review of this account and a resolution that reflects the rate I was quoted — including an adjustment for the amounts billed above that figure since June. A written quote provided by your representative at the point of a plan change may be considered part of the agreement that led me to make that switch, and I would appreciate confirmation that this is being treated accordingly.",
          "Deadline to set: Give them 14 calendar days to respond in writing before moving to the next step",
        ],
      },
      {
        label: "If there's no answer",
        tone: "yellow",
        items: [
          "If no substantive written response has arrived, file a complaint with the FCC at consumercomplaints.fcc.gov — the FCC routes telecom billing complaints to the carrier and requires a response.",
        ],
      },
      {
        label: "Rules that may apply",
        tone: "neutral",
        items: [
          "FTC Act Section 5 — Unfair or Deceptive Acts or Practices: Based on what you have described — a specific rate confirmed in writing by the company, followed by billing at a higher rate with no agreed amendment — this appears inconsistent with the prohibition on deceptive acts or practices, which may strengthen your position.",
          "FCC Truth-in-Billing Rules (47 CFR Part 64, Subpart Y): Based on what you have described, receiving three different explanations for the same overcharge across three contacts may appear inconsistent with the requirement that billing be clear and substantiated, which may be relevant to a complaint with the FCC.",
        ],
      },
    ],
    disclaimer: "General information, not legal advice. Contact details for a real company are worth confirming before you send anything.",
  },
  description: "When a company ignores you, the problem isn't always the complaint. It's knowing what to do next. Tell DeftBrain what happened, and we'll build a step-by-step escalation plan — from your next email to regulatory complaints and executive outreach if necessary.",
  guide: {
    tips: [
      "The more specific your description, the stronger every stage of the campaign will be — include dates, amounts, names, reference numbers",
      "Gather your evidence before you send step 1 — the checklist tells you exactly what to collect",
      "The tool identifies specific laws that apply to your situation — these are referenced in the letters to signal you know your rights",
      "The regulatory complaint is often the step that moves things — companies are required to respond to regulatory complaints within specific timelines",
      "There is no need to jump ahead — each step leaves a record that makes the next one easier"
    ],
    beforeYouGo: "Confirm any email address or department before you send. The ones suggested are likely contacts, not verified ones.",

  }
},

{
  modified: "",
  id: "PlainTalk",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A text you can read but can't follow.",
    give: "The text or a PDF. Any length, any subject.",
    get: "A plain-English translation plus a structural read — what it's really doing, and what it leaves out.",
    edge: "Two passes, not one: what it says, and what its shape tells you about intent.",
  },
  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    { q: "How do I understand a contract before signing it?",
      a: "Paste it into Plain Talk — it translates the legal language into plain English section by section, then flags the clauses that most often surprise people: auto-renewals, unilateral change rights, arbitration requirements, and termination penalties. You come away knowing what you're agreeing to and which two or three clauses deserve a closer look." },
    { q: "What should I look for in the fine print?",
      a: "The fine print that bites is predictable: automatic renewal windows, fees triggered by ordinary behavior, rights you're waiving (class actions, jury trials), one-sided modification clauses, and data-sharing permissions. The translation highlights these categories specifically rather than treating every paragraph as equally important." },
    { q: "Can it explain medical or insurance documents?",
      a: "Yes — explanation-of-benefits statements, policy documents, and consent forms are dense in exactly the way it's built for. It decodes the jargon and tells you what the document commits you to, so you can spot the deductible trap or the exclusion before it matters." },
    { q: "Is the plain-English version legally reliable?",
      a: "It's an understanding aid, not legal advice — the original text is what binds you. Use the translation to know what questions to ask, then take genuinely high-stakes documents (big money, long commitment, unusual terms) to a professional. Its job is making sure you're never signing blind." },
    { q: "Is my document stored after I paste it?",
      a: "Your text is processed to generate the translation, not kept to build a profile. Still, good practice with sensitive documents: redact account numbers and identifiers you don't need translated — the plain-English rendering works the same without them." },
  ],
  seoDescription: "Paste any contract, medical form, or dense document and get a plain-English translation plus a structural breakdown in seconds. Free, no signup.",
  seoTitle: "Plain English Translator",
  title: "Plain Talk",
  tagline: 'See through any text — plain language plus structural X-ray',
  tags: ['document', 'plain english', 'translate', 'confusing', 'contract', 'legal', 'medical', 'simplify'],
  icon: '🔍',
  categories: ['Learning'],
  headerColor: "#d4dde8",
  description: "Most complex text isn't trying to confuse you — it was written for an audience that already shares a context you don't have. Paste anything and PlainTalk bridges the gap: plain-English translation plus a structural X-ray showing how the text is built — its argument, narrative, logic, or obligations — adapted automatically to what you're reading.",
  exampleOutput: {
    title: "See what Plain Talk gives you",
    expandLabel: "See the full real example results ↓",
    nextStepLabel: "What happens with your text",
    intro: "This is the complete, real output from an actual Plain Talk run on the sample clause below — nothing here is invented or shortened.",
    sampleLabel: "Sample clause (lease indemnification)",
    sampleText: "Tenant shall be liable for and shall indemnify, defend, and hold harmless Landlord from and against any and all claims, damages, losses, and expenses, including reasonable attorneys' fees, arising in whole or in part from any injury to person or property occurring at the Premises, including injury caused by Tenant's guests, invitees, contractors, concessionaires, or licensees.",
    context: "Real run, 2026-09-23 — the tool's own built-in example scenario, auto-detected as Legal / Contract.",
    sections: [
      {
        label: "Reading level & plain translation",
        tone: "neutral",
        text: "Legal / Contract, high confidence. Simplified by 8 grade levels — original: Graduate/Professional (grade 16), translated: 8th grade. Plain English: this clause makes the tenant legally responsible for paying any costs — lawsuits, damages, injuries — that arise from anything happening at the rental property, even if caused by the tenant's guests or workers.",
      },
      {
        label: "What matters to you",
        tone: "yellow",
        text: "As the tenant, you are accepting broad financial liability. If a guest trips and falls, if a contractor damages something, or if any incident occurs on the property, the landlord can look to you to cover their losses and legal fees. This is a significant one-sided obligation — verify whether your renter's or business liability insurance covers this scope, and check the indemnification laws in your jurisdiction, as some courts have limited how far such clauses can extend.",
      },
      {
        label: "Key takeaways",
        tone: "neutral",
        items: [
          "You (the tenant) must cover the landlord's legal costs and damages if anyone is hurt or property is damaged at your premises.",
          "This responsibility extends to people you invite or hire — guests, contractors, employees — not just your own direct actions.",
          "The landlord is fully shielded from liability for incidents on the property; all financial risk sits with you.",
        ],
      },
      {
        label: "Red flags",
        tone: "red",
        items: [
          "The obligation is entirely one-directional — the tenant bears all risk, the landlord bears none under this clause.",
          "The clause covers 'any and all' claims with no cap on the dollar amount you could owe.",
          "Liability extends to acts of third parties you bring onto the property, including contractors and licensees, which may be beyond your control.",
          "No carve-out exists for incidents caused by the landlord's own negligence or building defects — in some jurisdictions such clauses are unenforceable to that extent, but you must verify current local law.",
        ],
      },
      {
        label: "Action items",
        tone: "green",
        items: [
          "Review your liability insurance policy to confirm it covers indemnification obligations of this scope.",
          "Consult a local attorney to verify whether this clause is fully enforceable in your jurisdiction under current law.",
          "Negotiate a carve-out so the clause does not apply when an incident results from the landlord's own negligence or property defects.",
          "Request a liability cap or mutual indemnification provision to balance obligations between both parties.",
        ],
      },
      {
        label: "Deep analysis — power & obligation",
        tone: "red",
        text: "Strong landlord advantage. Your obligations as tenant: indemnify the landlord, cover all legal costs, absorb liability for anyone you invite or hire, even if fault is only partial. Their obligations: none stated in this clause. Asymmetry: the landlord owes you nothing here — this is a one-way shield protecting only the landlord. Compared to standard: this clause is on the broader end of standard commercial lease indemnification language; there is no mutual indemnification, no carve-out for landlord negligence, and no liability cap — all three are common negotiating points that more tenant-favorable versions include.",
      },
      {
        label: "Commonly negotiated",
        tone: "neutral",
        items: [
          "Add a mutual indemnification clause so the landlord also indemnifies the tenant.",
          "Insert a carve-out excluding tenant liability for incidents caused solely by landlord negligence or willful misconduct.",
          "Add a liability cap (e.g., capped at insurance policy limits).",
          "Narrow 'in part' language so tenant is only liable proportionate to their actual fault.",
          "Remove 'concessionaires' and 'licensees' if those categories do not apply to your use of the space.",
        ],
      },
    ],
    nextStep: "Paste the text you are trying to understand. Plain Talk translates the wording, maps the obligations or argument, and — for dense clauses like this one — runs a deeper power-and-obligation X-ray showing exactly who benefits and what's commonly negotiated, without replacing the original document.",
    disclaimer: "This is a real, complete tool run against a realistic sample clause. For legal, medical, financial, or other high-stakes documents, use the explanation to prepare questions and verify important decisions with an appropriate professional."
  },

  guide: {
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
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You need to concentrate and music keeps pulling you out of it.",
    give: "Your task, your environment, and any sounds you can't tolerate.",
    get: "A soundscape recipe you can build, tuned to that combination.",
    edge: "It accounts for auditory sensitivities, so the recommendation isn't 'lo-fi beats' for everyone.",
  },
  seoDescription: "Build an adjustable background sound mix tuned to what's actually getting in your way — white noise, nature sounds, and ambient layers you can adjust as you listen. Free, no signup.",
  seoTitle: "Focus Soundscapes",
  title: "Focus Sound Architect",
  tagline: "Build a background your attention can live with.",
  tags: ["focus sounds", "concentration sounds", "background noise", "soundscape", "white noise", "pink noise", "brown noise", "ambient sound", "mask distractions", "noisy workspace", "voices distracting", "auditory sensitivity", "sensory needs", "study sounds", "work sounds"],
  icon: " 🎧",
  categories: ['Health & Wellness'],
  headerColor: "#b8dcd8",
  description: "Sometimes the problem isn't your focus. It's what your ears have to deal with. Focus Sound Architect builds an adjustable background that can mask distractions, soften an uncomfortable space, or simply give you something better to work alongside.",
  guide: {
      tips: [
        "Start with fewer layers than feels thorough — one steady layer you can actually ignore usually beats three that compete for attention",
        "Use 'How does it sound?' rather than regenerating from scratch — it changes the smallest number of layers needed and leaves the rest alone",
        "If you're sensitive to sudden sounds, say so — rain and fire are filtered out automatically",
        "Binaural beats are available as a manual add-on for anyone who wants them, but the generated mix won't suggest them — there's no need for a scientifically loaded option when ordinary layers can do the job"
      ]
    }
},

{
  modified: "2026-08-26",
  id: "FocusPocus",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You need to start something, and you know you will not stop on your own.",
    give: "What you are working on, how long, and what would make this session enough.",
    get: "A bounded session with a stopping point you set in advance — and a note telling you where to pick up if you do not finish.",
    edge: "It is built to get you out, not to keep you going. The extensions run out on purpose.",
  },
  seoDescription: "Free focus session timer that helps you stop, not just start. Set a concrete 'enough for now' before you begin, get pulled out when time is up, and leave yourself a note about where to pick up.",
  seoTitle: "Focus Timer That Helps You Stop",
  title: "Focus Pocus",
  tagline: "Get something done without disappearing into it",
  tags: ["focus", "focus timer", "focus session", "deep work", "time boxing", "stop working", "know when to stop", "hyperfocus", "lose track of time", "work session", "pomodoro alternative", "stopping point", "enough for now", "take a break", "break reminder", "finish focus session", "restart note", "pick up where i left off", "get unstuck"],
  icon: "\ud83c\udfa9",
  categories: ['Health & Wellness', 'Tasks'],
  headerColor: "#b8dcd8",
  description: "Turn an open-ended task into a clear stopping point, work toward one concrete result, and stop without losing your place. Focus Pocus helps define what \u201cenough for now\u201d means, gives you one next move if you get stuck, and saves a restart breadcrumb when time is up.",
  guide: {
    tips: [
      "Pick the stopping point before you start; it is much harder to judge once you are absorbed",
      "'Enough for now' should be something you can answer yes or no to when the timer ends",
      "Finishing early is a real outcome — the session is a boundary, not a quota",
      "The three extensions are the whole budget; when they are gone that is the answer"
    ],

  }
},
// ── DecisionCoach tools.js entry ──

{
  modified: "2026-03-11",
  id: "DecisionCoach",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Too depleted to choose, but you still have to.",
    give: "A sentence saying what you are stuck on. Constraints and preferences are optional.",
    get: "One answer. Not options.",
    edge: "It gives a single decision on purpose. A ranked list is another choice to make, which is the thing you couldn't do.",
  },
  seoDescription: "Too stuck to choose? Get ONE clear answer with execution steps — no endless options, no second-guessing. Free, built for choice paralysis.",
  seoTitle: "Pick an Answer When Stuck",
  title: "Decision Coach",
  tagline: "One answer. No second-guessing.",
  tags: ['decision help', 'make a decision', 'choose for me', 'pick one', 'decision paralysis', 'choice paralysis', 'too many options', 'stuck choosing', "can't decide", 'overwhelmed by choices', 'one answer', 'what should i do', 'what should i choose'],
  icon: "🎯",
  categories: ['Decisions', 'Tasks'],
  headerColor: "#f5e0c0",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Decision Coach gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the decision below — the full result, nothing reworded. The pay comparison is computed in code from the numbers given.",
    sampleLabel: "The decision",
    sampleText: "Two job offers and I have to answer by Friday. Brightline: $96,000 salary, plus a one-time $5,000 signing bonus. Northfield: $95,000 salary plus an annual bonus of up to $8,000, but it is discretionary and they said last year it was not paid to everyone. Both are hybrid, similar commute. Which should I take? Constraint: I need stable income; I have rent and a car loan.",
    context: "Real run, 2026-10-08, on a decision written for this page.",
    sections: [
      {
        label: "The call",
        tone: "green",
        text: "Take Brightline — unless you can confirm that Northfield's discretionary bonus is reliably paid to most employees most years.",
      },
      {
        label: "Why",
        tone: "neutral",
        text: "You told me you need stable income to cover rent and a car loan. Brightline guarantees $96,000 every year and $101,000 in year one including the signing bonus. Northfield's $8,000 bonus is discretionary — they already told you it was not paid to everyone last year — so you cannot count on it. On guaranteed pay alone, Brightline leads by $6,000 in year one and $1,000 in every year after. Against fixed obligations, certain money is the right money.",
      },
      {
        label: "The one thing that could change it",
        tone: "yellow",
        text: "Can you find out what percentage of Northfield employees actually received the bonus last year, and whether it has been paid consistently in prior years? If the bonus is reliably paid to most people most years, Northfield pays $7,000 more annually after year one — that gap is large enough to change the call even given your stability need. If it is genuinely hit-or-miss, Brightline wins cleanly.",
      },
      {
        label: "If the answer confirms it",
        tone: "green",
        text: "The call stands: take Brightline.",
      },
      {
        label: "If it changes it",
        tone: "neutral",
        text: "That changes the call: take Northfield — the recurring pay advantage outweighs the signing bonus and the stability risk shrinks considerably.",
      },
    ],
  },
  faq: [
    { q: "How do I make a decision when I'm stuck?",
      a: "Write down the constraints that actually matter — money, time, energy — and let them eliminate options. If you still can't choose, hand the call to something outside your head: a coin, a trusted person, or a tool that picks one answer. Then act on it rather than reopening it." },
    { q: "How do I compare two job offers?",
      a: "Compare guaranteed pay first, then one-time pay (such as a signing bonus) for the first year only, and treat bonuses that may not be paid as uncertain rather than money in hand. Then weigh what the money can't capture: the work, the manager, the commute." },
    { q: "Why does Decision Coach give one answer instead of options?",
      a: "Because when you're stuck, more options make it worse. It commits to one call, says why, and names the single fact that could change it, so you know exactly what to check." },
    { q: "What if I don't like the answer?",
      a: "Reject it and say why. Your reaction is useful information, and the next answer takes it into account." },
  ],
  description: "Makes the decision for you when you're too stuck to choose. Applies your constraints and preferences to give you ONE answer with execution steps — no options, no second-guessing.",
  guide: {
    tips: [
      "Pre-load preferences clearly (hard constraints like allergies vs preferences like mood)",
      "The tool gives ONE answer intentionally - options would restart the paralysis",
      "Actually follow the 'no second-guessing' instruction - that's the hardest part",
      "Use this proactively when you feel paralysis starting, not after 30 min of agonizing",
      "The decision is good enough - perfect doesn't exist when you're overwhelmed"
    ],

  }
},
{
  modified: "",
  id: "SixDegreesOfMe",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Idle curiosity about how your life fits together.",
    give: "Two things from your life. A profile makes every chain richer.",
    get: "The chain connecting them, link by link.",
  },
  seoDescription: "Find the hidden chain linking any two parts of your life — your degree and your career, your fear and your favorite food. Free, and surprisingly personal.",
  seoTitle: "Find Hidden Connections",
  title: "Six Degrees of Me",
  tagline: "Discover the surprising threads that connect your experiences",
  tags: ['connection', 'network', 'path', 'introduction', 'reach', 'who knows who'],
  icon: "🔗",
  categories: ['Just for Fun', 'Self & Reflection'],
  headerColor: "#d4dde8",
  description: "Find the hidden connections between seemingly unrelated parts of your life.\nYour favorite movie and your career. Your childhood hobby and your closest friendship.\n\nThe chain is always there. You just can't see it yet.",
  exampleOutput: {
    title: "See what Six Degrees of Me gives you",
    expandLabel: "See the full real example results ↓",
    nextStepLabel: "What happens with your two things",
    intro: "This is the complete, real output from an actual Six Degrees of Me run on the sample pair below — nothing here is invented or shortened.",
    sampleLabel: "Sample pair (Chain mode)",
    sampleText: "One part of your life: my first job. Another part of your life: my closest friendship.",
    context: "Real run, 2026-09-23 — one of the tool's own built-in Try These pairings.",
    sections: [
      {
        label: "The chain",
        tone: "neutral",
        text: "This isn't a biography. It's one possible story connecting two experiences. Keep what resonates and ignore what doesn't. Your first job asked you to do something specific — learn a role, meet expectations, deliver something measurable. You likely discovered what you were capable of. Once you showed you could do something well, others began to depend on that skill. You may have become the person people turned to — reliable, capable, consistent. Over time, it is possible that a quiet expectation formed: if you did something, you did it fully, thoroughly, without cutting corners. Care and execution became tangled. You may have gravitated toward people who either shared that standard or who needed someone to hold it. Friendships began where trust meant: this person will not let it fall apart. Your closest friendship may have crystallized around someone who either matched your care for how things are done, or who trusted you precisely because you would not let the friendship become careless.",
      },
      {
        label: "Link by link",
        tone: "neutral",
        items: [
          "First job → Early competence (career): your first job asked you to do something specific — learn a role, meet expectations, deliver something measurable. You likely discovered what you were capable of.",
          "Early competence → Being relied on (skill): once you showed you could do something well, others began to depend on that skill. You may have become the person people turned to — reliable, capable, consistent.",
          "Being relied on → Unspoken standard (identity): over time, a quiet expectation formed — if you did something, you did it fully, thoroughly, without cutting corners. Care and execution became tangled.",
          "Unspoken standard → Choosing your people (belief): you may have gravitated toward people who either shared that standard or who needed someone to hold it. Friendships began where trust meant: this person will not let it fall apart.",
          "Choosing your people → Closest friendship (relationship): your closest friendship may have crystallized around someone who either matched your care for how things are done, or who trusted you precisely because you would not let the friendship become careless.",
        ],
      },
      {
        label: "A possible insight",
        tone: "green",
        text: "Care learned to speak through reliability. Perhaps your first job taught you that affection and competence were inseparable — that showing up fully for something was how you showed it mattered. Your closest friendship may be the place where that same language is spoken fluently back to you: someone who understands that you are present not despite the standards, but because of them. The pattern worth noticing: you may not separate love from doing something well. Through-line: competence became your native dialect of care.",
      },
    ],
    nextStep: "Give the tool two pieces of your life — in Chain mode, or map your whole Life Web, find your Story, or compare two people. It builds a plausible link-by-link chain and shows where the connection is strong, surprising, or speculative.",
    disclaimer: "This is a real, complete tool run against a realistic sample pair. These connections are possibilities, not conclusions — a way to think about your life, not an explanation of it."
  },

  guide: {
    tips: [
      "The more profile context you give, the more personal and surprising the chains get",
      "Try pairing things from very different life domains -- the wider the gap, the more interesting the chain",
      "Flip It often finds a completely different path -- same endpoints, new insight",
      "Share chains with friends -- they'll see connections in your life you missed",
      "This is great for self-reflection, journaling prompts, and 'how did I get here' moments"
    ],

  }
},

{
  modified: "2026-03-10",
  id: "BrainRoulette",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You want to fall down a rabbit hole worth the time.",
    give: "Two or more interests, and how deep you want to go.",
    get: "A rabbit hole at the intersection of them.",
    edge: "It works the overlap between your interests rather than serving one at a time, so what comes back isn't findable by searching either.",
  },
  seoDescription: "Spin up surprising rabbit holes at the intersection of your interests, with claims checked and follow-up paths to explore. Free, no signup.",
  seoTitle: "Random Rabbit Hole Generator",
  title: "Brain Roulette",
  tagline: "Follow your curiosity somewhere unexpected.",
  tags: ['random', 'interesting', 'curious', 'learn', 'discover', 'bored', 'fun', 'trivia', 'facts', 'knowledge', 'rabbit hole', 'explore', 'learning', 'curiosity', 'deep dive', 'debate', 'digest', 'daily', 'discovery', 'interests', 'spin', 'mind expanding', 'education'],
  icon: '🎲',
  categories: ['Just for Fun', 'Learning'],
  headerColor: "#b8dcd8",
  description: "Follow your curiosity somewhere unexpected. Choose a few things that interest you—or leave it to chance—and Brain Roulette finds surprising connections, questions, and rabbit holes worth exploring.",
  guide: {
    tips: [
      "Pick interests that seem unrelated — that's where the best connections hide",
      "Use 'Surprise Me' when your usual interests feel stale — the wildcard might reveal a new obsession",
      "The 'Go Deeper' threads are where the real magic happens — they often lead to even better discoveries",
      "Share snippets with friends — these make great conversation starters",
      "Your spin streak tracks consecutive sessions — see how long you can keep it going",
      "The AI remembers what you've already seen and won't repeat topics"
    ],
  },
  crossRefs: ['BeliefStressTest', 'SixDegreesOfMe', 'DecisionCoach'],
},

{
  modified: "",
  id: "FinalWish",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Nobody else knows your passwords, your accounts, or what you'd want.",
    give: "A guided interview across accounts, documents, finances, messages and wishes. Take it in sittings.",
    get: "A self-contained encrypted package for the person you trust.",
    edge: "It covers the digital estate — accounts, devices, subscriptions — which wills predate and rarely mention.",
  },
  seoDescription: "Organize your accounts, documents, finances, and personal messages into one printable legacy document for someone you trust. Free, guided, nothing stored.",
  seoTitle: "Digital Legacy Planner",
  title: "Final Wish",
  tagline: "Organize what matters. Say what needs to be said.",
  tags: ['legacy', 'estate', 'end of life', 'planning', 'documents', 'death', 'wishes'],
  icon: "📜",
  categories: ['Home & Daily Life', 'Relationships', 'Self & Reflection'],
  headerColor: "#e0b8b8",
  description: "One day, someone you care about may need to find your accounts, understand your finances, locate important documents, or simply know what mattered to you. Final Wish helps you put it all in one place.",
  exampleOutput: {
    title: "See what Final Wish gives you",
    expandLabel: "See the full real example results ↓",
    nextStepLabel: "What happens with your own document",
    intro: "This is the complete, real output from an actual Final Wish run using the tool's own example scenario — nothing here is invented or shortened. Only two sections are shown; the tool also organizes documents, financial accounts, and end-of-account wishes the same way.",
    sampleLabel: "Sample scenario",
    sampleText: "Alex Rivera, writing for primary trusted person Jordan Rivera (a sibling) and additional trusted person Sam Chen. Message recipient: Jordan. Relationship: younger sibling — grew up close, drifted in their 20s, reconnected in recent years. What Alex wants Jordan to know: proud of who they've become, and that Jordan should let go of guilt over the year they didn't speak much. Tone requested: Heartfelt.",
    context: "Real run, 2026-09-23 — the tool's own built-in example names, using the AI Interview / message-drafting flow.",
    sections: [
      {
        label: "Drafted message to Jordan (heartfelt tone)",
        tone: "green",
        text: "“Jordan — I want you to know that I am proud of the person you have become, and I mean that without any qualifications. Whatever guilt you have been carrying about the year we drifted, put it down: those childhood arguments never mattered half as much as you probably thought they did, and neither did the quiet spell in our 20s. What I actually remember is the Big Sur road trip in 2018, Christmas in the kitchen, and the way you always start laughing at your own jokes before you even get to the punchline — and I would not trade any of that. You are my sibling and I love you, full stop. — Alex”",
      },
      {
        label: "Top critical accounts (from the Emergency quick plan)",
        tone: "neutral",
        items: [
          "Apple iCloud — photos and personal documents; recovery key in the fireproof safe.",
          "Gmail (alex.rivera@gmail.com) — 2FA via Authenticator app on phone; backup codes in the safe envelope marked GMAIL.",
          "1Password — master password is in the sealed envelope in the filing cabinet, top drawer; has access to most other accounts.",
          "Instagram (@alex.rivera) — login saved in 1Password.",
        ],
      },
    ],
    nextStep: "Final Wish organizes your accounts, documents, financial details, personal wishes, and messages that matter into one document, drafted in your voice and refinable in tone (warmer, funnier, shorter, more direct) — built step by step, through an AI interview, or all at once in an emergency 5-minute version.",
    disclaimer: "This is a real, complete tool run using the tool's own example scenario. This is not a legal document. Consult an attorney for legal estate planning."
  },

  guide: {
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
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Something's wrong with the bike and the shop is closed.",
    give: "The symptom, or answers to a few diagnostic questions.",
    get: "The likely cause and a step-by-step fix with visual demos.",
  },
  seoDescription: "Troubleshoot common bike problems with safe checks, verified component specifications, step-by-step guidance, and clear advice on when not to ride or when to use a bike shop.",
  seoTitle: "Bike Repair Troubleshooter",
  title: "Bike Medic",
  tagline: "Figure out what's wrong with your bike — and what to do next.",
  tags: ['bike', 'bicycle', 'repair', 'maintenance', 'cycling', 'fix', 'mechanic', 'flat', 'tire', 'brakes', 'shifting', 'gears', 'derailleur', 'chain', 'wheel', 'spoke', 'noise', 'trailside', 'DIY'],
  icon: "🚲",
  categories: ['Home & Daily Life'],
  headerColor: "#d4dde8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Bike Medic gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the problem below — an excerpt of a longer result, nothing reworded.",
    sampleLabel: "The problem",
    sampleText: "My rear derailleur is skipping under load when I push hard on the pedals, especially going uphill. Started after a wet ride last week.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples. Rated moderate, safe to ride.",
    sections: [
      {
        label: "What is probably going on",
        tone: "neutral",
        text: "After a wet ride, water and grit work into the cable housing and increase friction, which changes the effective cable tension when you load the drivetrain. The derailleur then cannot hold the chain precisely on the sprocket under pedaling force, causing it to skip toward an adjacent sprocket and back. This is a cable-and-housing problem until proven otherwise — it is the most common mechanical consequence of riding in wet conditions and the cheapest to address.",
      },
      {
        label: "Check these",
        tone: "yellow",
        items: [
          "Cable friction or contamination from the wet ride: check by shifting through all gears while stationary — if indexing feels sluggish or imprecise, or if the barrel adjuster is already wound well out from its original position, this is the likely culprit. Confirm by inspecting the housing ends for grit and by feeling whether the cable moves freely when you pull it by hand at the derailleur.",
          "Chain wear: wet conditions accelerate chain wear, and a worn chain skips under load even with perfect indexing. Measure with a chain-wear indicator tool — replace at 0.5% stretch for 11 or 12-speed chains, 0.75% for 10-speed and below. If the chain measures worn, check the cassette too: a worn cassette will skip with a new chain until the cassette is replaced as well.",
        ],
      },
      {
        label: "Fix it",
        tone: "green",
        items: [
          "SAFETY FIRST: Confirm the derailleur hanger is not bent before any adjustment. Look directly behind the bike at the hanger — it should be parallel to the cassette and frame. A bent hanger will not index correctly no matter how much you adjust, and riding with a severely bent hanger risks the derailleur being pulled into the wheel. If it is visibly bent, stop here and take it to a shop for straightening before proceeding.",
          "Check the barrel adjuster on the derailleur (and the one at the shifter if present). Wind it all the way in (clockwise) gently, then back it out two full turns. This gives you a neutral starting point.",
          "Shift through all gears in a stand or slowly on flat ground. If the chain hesitates to shift to larger sprockets (easier gears), turn the barrel adjuster counter-clockwise (out) a half-turn, then test again. Repeat until shifts are clean in both directions.",
        ],
      },
      {
        label: "Pro tip",
        tone: "green",
        text: "When you re-lube the cable, put the lube at the housing entry points and then cycle the shifter several times to work it in — lubing only the exposed cable section between housing segments does little for the friction that actually causes indexing shift.",
      },
      {
        label: "When to take it to a shop",
        tone: "neutral",
        text: "Take it to a shop if the derailleur hanger appears bent, if new cable and housing does not resolve the skipping under load, if the cassette shows worn teeth and you are unsure how to match a replacement to your drivetrain specification, or if you are not comfortable measuring chain wear accurately.",
      },
    ],
  },
  faq: [
    { q: "Why does my bike chain skip under load?",
      a: "The usual causes are a shifting cable with grit or friction in its housing (common after a wet ride), indexing that needs a small barrel-adjuster tweak, a bent derailleur hanger, or a worn chain or cassette. Check the hanger first, then the cable, then measure the chain." },
    { q: "When should I replace my bike chain?",
      a: "Measure it with a chain-wear checker. A common rule is to replace at 0.5% stretch for 11- and 12-speed chains and 0.75% for 10-speed and below. A worn chain left too long wears the cassette too, and then both need replacing." },
    { q: "Which way do I turn the barrel adjuster?",
      a: "If the chain is slow to shift to bigger sprockets, turn the barrel adjuster counter-clockwise (out) a half-turn at a time to add cable tension. If it is slow to shift to smaller ones, turn it clockwise. Test after each half-turn." },
    { q: "Is it safe to ride with a skipping chain?",
      a: "Usually yes for a short, gentle ride, but a skip under hard pedaling can throw you off balance, and a badly bent hanger can pull the derailleur into the wheel. Bike Medic tells you whether it's safe to ride and when it needs a shop." },
  ],
  crossRefs: ['BuyWise', 'DecisionCoach'],
  description: "Something wrong with your bike? Describe what you notice—or choose the part that's giving you trouble. Bike Medic starts with safe checks and helps you narrow down likely causes and work through what to try next, including when not to ride and when it's time for a bike shop.",
  guide: {
      tips: [
        "Set up your Bike Profile via the gear icon to auto-skip questions about brake type, shifting system, and tire setup",
        "The static troubleshooting tree works without AI — great for trailside or offline use",
        "Use Quick Checks before long rides or after crashes to catch problems before they strand you",
        "Every fix includes a Parts & Shopping List with real part names, examples, and price ranges"
      ]
    }
},

{
  modified: "2026-09-06",
  id: "PlantRescue",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  // V2 REWRITE, 2026-09-06: replaced a forced diagnosis (single primary_problem,
  // numeric identification confidence, is_saveable boolean, a recovery_timeline,
  // a 12-month seasonal calendar, an unconditional propagation guide with a
  // success rate) with an evidence-first structure — a small set of plausible
  // explanations, each paired with a check that would distinguish it, and a
  // single most-useful check before any conditional treatment. Name unchanged;
  // see audit/tool-notes/PLANTRESCUE-NOTES.md.
  primer: {
    when: "Something's off with a plant and you're not sure why.",
    give: "A photo or description, plus light, watering, and what's changed recently.",
    get: "A few plausible explanations, what to check first, and what to do next.",
    edge: "It won't diagnose your plant with certainty or promise a recovery timeline — only what the evidence you gave it does and doesn't support.",
  },
  seoDescription: "Upload a photo or describe what you're seeing and get plausible explanations, the one thing worth checking first, and a practical next step for your plant. Free, no signup.",
  seoTitle: "Plant Rescue: What's Wrong and What to Do",
  title: "Plant Rescue",
  tagline: "Figure out what's wrong—and what to do next",
  tags: ['plant rescue', 'overwatered', 'underwatered', 'overwatering', 'underwatering', 'plant care', 'plant identification', 'identify plant', 'dying plant', 'houseplant', 'houseplant care', 'plant problems', 'yellow leaves', 'brown leaves', 'drooping plant', 'watering', 'what is wrong with my plant', 'plant health', 'gardening', 'save plant'],
  icon: '🪴',
  categories: ['Home & Daily Life'],
  headerColor: "#1e2a3a",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Plant Rescue gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the plant below — an excerpt of a longer result, nothing reworded.",
    sampleLabel: "The plant",
    sampleText: "Pothos in a 6-inch pot. Leaves yellowing from the bottom up over the past two weeks. A few have brown tips. New growth still green but smaller than before. Indoors, partial shade, watered weekly on a schedule, pot has drainage. Pets in the house.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples, described in words without a photo.",
    sections: [
      {
        label: "Watch and check",
        tone: "yellow",
        text: "Bottom-up yellowing with active new growth still present suggests the plant is under some stress, but is not in immediate crisis. The pattern fits a few different causes that need to be distinguished before acting. Check soil moisture and watering practice first.",
      },
      {
        label: "Check this first",
        tone: "neutral",
        items: [
          "Soil moisture before your next watering: Push a finger or wooden chopstick well into the potting mix, below the dry surface layer. Note whether it comes out damp, wet, or dry. If it is still damp or wet: hold off watering and switch to watering only when the top portion of the mix has dried out. This is the single most useful change you can make right now.",
        ],
      },
      {
        label: "What to do now",
        tone: "green",
        items: [
          "Switch from a fixed watering schedule to watering based on soil feel. A calendar interval does not account for how quickly this particular pot, mix, and plant actually use water. Checking the soil directly removes the guesswork that a fixed schedule introduces.",
          "Remove yellowed leaves that have little healthy green tissue remaining. Leaves that are mostly yellow will not recover. Removing them is tidier and lets you see clearly whether yellowing continues to spread to leaves that were green before.",
        ],
      },
      {
        label: "What improvement looks like",
        tone: "neutral",
        items: [
          "Yellowing stops progressing to leaves that were green before",
          "New leaves grow to a comparable size as earlier growth, rather than continuing to shrink",
          "The plant does not produce more yellowed leaves after you correct the watering practice",
        ],
      },
      {
        label: "Pets",
        tone: "red",
        text: "Pothos is considered toxic to cats and dogs if ingested, primarily causing oral irritation and gastrointestinal upset. Keep the plant out of reach of pets. If you have reason to think a pet has chewed on or eaten part of it, contact your vet or a pet poison information service.",
      },
    ],
    disclaimer: "Plant Rescue works from what you describe and any photo you add. It gives the checks that tell causes apart rather than a guess; a local nursery can look at the plant itself.",
  },
  faq: [
    { q: "Why are my plant's lower leaves turning yellow?",
      a: "Often it is watering — too much, so roots sit in wet soil, or too little. Older lower leaves also yellow naturally as a plant grows, but slowly. Check the soil a couple of inches down before you water: if it is still damp, water less often." },
    { q: "How often should I water a pothos?",
      a: "Not on a fixed schedule. Water when the top part of the soil has dried out, then let the excess drain away. How often that is depends on light, temperature, pot size and season." },
    { q: "Is pothos toxic to cats and dogs?",
      a: "Yes. The ASPCA lists pothos as toxic to cats and dogs; chewing it usually causes mouth irritation, drooling and vomiting. Keep it out of reach, and call your vet or a pet poison line if your pet has eaten some." },
    { q: "Do I need a photo?",
      a: "No, a description works, as in the example above. A clear photo of the affected leaves, the soil and the drainage hole makes the checks more specific." },
  ],
  description: "Something wrong with your plant? Upload a photo or describe what you're seeing and Plant Rescue helps you narrow down what may be happening, decide what to check next, and make a practical rescue plan.",
  guide: {
    tips: [
      "A photo of the affected leaf and one of the soil surface help more than a single whole-plant shot",
      "How you decide to water (checking the soil vs. a fixed schedule) matters more than how often",
      "The single suggested check usually matters more than jumping straight to a fix",
      "Selecting more symptoms doesn't make the read more certain — describing what changed recently often does",
      "Save a plant to build a short observation history instead of starting over each time"
    ],

  }
},

{
  modified: "",
  id: "ConflictCoach",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A tense message landed and you want help choosing what to say back.",
    give: "The message, your relationship to the sender, and what you want your response to accomplish.",
    get: "A brief grounded read and four ready-to-send responses that pursue your goal in different ways.",
    edge: "It stays with what the message actually says instead of diagnosing the sender, then gives you several usable ways to respond.",
  },
  seoDescription: "Got a tense message? Slow down the reply, see several ways to respond, and get drafts for setting a boundary, de-escalating, or moving the conversation forward.",
  seoTitle: "Reply to a Tense Text",
  title: "Conflict Coach",
  tagline: "Respond to the message — not the heat of the moment.",
  tags: ["tense text", "difficult message", "conflict", "respond to text", "message response", "communication", "de-escalate", "boundary", "set a boundary", "relationship conflict", "texting", "passive aggressive text", "sarcastic message", "acknowledge without agreeing", "step away", "move conversation off text"],
  icon: "🧯",
  categories: ['Conversations', 'Relationships'],
  headerColor: "#e0b8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Conflict Coach gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the message below — the full result, nothing reworded.",
    sampleLabel: "The message you got",
    sampleText: "I just think it's interesting how you only show up when it's convenient for you. Must be nice to have that kind of flexibility.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples. From a roommate; you felt hurt and frustrated.",
    sections: [
      {
        label: "How the message reads",
        tone: "neutral",
        text: "'Only show up when it's convenient for you' makes a broad claim about a pattern without naming a specific incident. 'Must be nice to have that kind of flexibility' can read as sarcastic — it is not a direct ask for anything, which leaves the exchange without a clear opening to resolve.",
      },
      {
        label: "Ask what's actually going on (calm)",
        tone: "green",
        text: "I'd rather talk about this directly than leave it hanging. What's been going on?",
      },
      {
        label: "Name the impact and invite clarity (warm)",
        tone: "green",
        text: "I want to take this seriously. Can you tell me what specifically you've felt I've gotten wrong? I'd like to understand what you're referring to.",
      },
      {
        label: "Acknowledge the tension, hold your ground gently (firm)",
        tone: "green",
        text: "I hear that something's not working for you, and I'm open to talking about it. I'd respond better if I knew what specifically you're pointing at. What's the thing that's been bothering you?",
      },
      {
        label: "Short and direct (direct)",
        tone: "green",
        text: "What specifically have I done that's bothering you?",
      },
    ],
  },
  faq: [
    { q: "How do I respond to a passive-aggressive message?",
      a: "Don't argue with the tone; answer the subtext and ask for specifics: 'I'd rather talk about this directly — what's been going on?' Asking what exactly is bothering them gives them a way to say it plainly." },
    { q: "Should I reply right away to a hurtful text?",
      a: "Usually not. Waiting even twenty minutes lets you reply to what the message says rather than how it made you feel, and it rarely makes things worse." },
    { q: "Why give several possible replies?",
      a: "The right reply depends on the relationship and on what you want — to clear the air, to set a limit, or to keep it short. Conflict Coach writes options in different tones so you can pick the one that sounds like you." },
    { q: "Can it check a reply I've already written?",
      a: "Yes. Add your draft and what you actually want from the exchange, and it shows how your reply is likely to land and how to adjust its tone." },
  ],
  description: "A tense message can make the first reply feel urgent. Paste what you received, tell us the relationship and what you want the response to accomplish, and Conflict Coach lays out several ways to answer so you can choose deliberately before you send anything.",
  guide: {
    tips: [
      "Use the exact message rather than paraphrasing when possible; wording is often what changes the response",
      "Pick the outcome you actually want before choosing a tone",
      "A good strategy should be sendable as written and should not depend on guessing what the other person feels or intends",
      "If the reply changes the situation, use Follow-up Coaching with what they actually said rather than predicting the next move"
    ]
  }
},

{
  modified: "2026-09-13",
  id: "TaskAvalancheBreaker",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A project so big you can't find anywhere to start.",
    give: "The project, and optionally what makes starting hard.",
    get: "One useful first move grounded in what you actually said, a smaller fallback if it's still too much, and a preview of what comes after.",
    edge: "This isn't a task list — you already have too much list. It's one foothold, not a plan for the whole project. It won't invent structure your project doesn't have just to sound clever.",
  },
  seoDescription: "Stuck on a project that feels too big to start? Task Avalanche Breaker finds one useful place to begin — not another giant to-do list. Free, no signup.",
  seoTitle: "Start a Big Project",
  title: "Task Avalanche Breaker",
  tagline: "Find one foothold in a project that feels too big to start",
  tags: ['overwhelm', 'overwhelming project', 'too big to start', 'getting started', 'first step', 'next step', 'stuck', 'procrastination', 'project paralysis', 'micro step', 'break down project', 'where to start'],
  icon: "⛏️",
  categories: ['Health & Wellness', 'Tasks'],
  headerColor: "#d4dde8",
  description: "Stuck on a project that feels too big to start? Task Avalanche Breaker finds one useful place to begin — not another giant to-do list.",
  guide: {
    tips: [
      "The reasons you check aren't diagnosed or explained back to you — they just help size the first move to what's actually in the way",
      "'Still too much?' gives a smaller version of the SAME move, not a different, easier task",
      "If the right first move depends on something you haven't said, the tool will often make finding that out the move itself, rather than guess",
      "The later footholds are a preview, not a commitment — nothing requires you to do more than the one you're on"
    ],
  }
},

{
  modified: "2026-09-06",
  id: "PetBehaviorDecoder",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  // V2 REWRITE, 2026-09-05, then FULL RENAME 2026-09-06 (PetWeirdnessDecoder
  // -> PetBehaviorDecoder): id, this file's frontend filename, TOOL_IDS,
  // LEGACY_REDIRECTS, TOOL_ALIASES, and tool-og-slugs.json all updated per
  // audit/REWRITE-INSTALL-KIT.md §7 (see audit/tool-notes/
  // PETWEIRDNESSDECODER-NOTES.md — filename kept, matching the
  // CrashPredictor/BeforeTheCrash precedent). The backend route
  // (pet-weirdness-decoder.js) and the i18n key prefix (pwd_) are
  // DELIBERATELY kept as the old name — internal, renaming them buys
  // nothing and breaks saved state. Replaced likelihood-scored
  // "differentials," breed genetic predispositions, arbitrary age-bucket
  // rules, invented prevalence, fabricated anecdotes, and behavior-mod
  // timelines with plausible explanations grounded in what was actually
  // reported, what would make each more or less likely, and observable
  // next-step triggers instead of a countdown.
  primer: {
    when: "Your pet is doing something odd and you're wondering whether to call the vet.",
    give: "Species, breed, age, and what they're doing — plus anything else you've noticed.",
    get: "Plausible explanations grounded in what you reported, what to watch for, and whether a vet call makes sense.",
    edge: "It won't diagnose your pet or rank explanations by probability — only a vet can do that. It tells you what the facts you gave it do and don't suggest.",
  },
  seoDescription: "Not sure what to make of something your pet is doing? Describe what you're seeing and get plausible explanations, what to watch for, and when it's worth calling a vet. Free, no signup.",
  seoTitle: "Pet Behavior Decoder: Quirk or Vet Visit?",
  title: "Pet Behavior Decoder",
  tagline: "Weird, normal, or worth a vet call?",
  tags: ['pet behavior', 'dog behavior', 'cat behavior', 'weird pet behavior', 'pet symptoms', 'pet health', 'animal behavior', 'vet call', 'veterinarian', 'should I call the vet', 'pet concern', 'pet changes', 'pet observation', 'track pet behavior', 'pet weirdness'],
  icon: "🐾",
  categories: ['Health & Wellness', 'Home & Daily Life'],
  headerColor: "#d4dde8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Pet Behavior Decoder gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the behavior below — an excerpt of a longer result, nothing reworded.",
    sampleLabel: "The behavior",
    sampleText: "Dog, Labrador mix, 2 years old, about a week: He's started eating grass obsessively on every walk, then vomiting within an hour. It's happened 4 times this week. His regular food hasn't changed.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "Contact your vet",
        tone: "yellow",
        text: "Four vomiting episodes in a single week is a pattern worth discussing with your vet, even without other changes reported. This is not a clear emergency, but the frequency makes watchful waiting alone a less comfortable option.",
      },
      {
        label: "What could explain it",
        tone: "neutral",
        items: [
          "An underlying GI issue prompting the grass eating: A dog with GI discomfort may seek out grass; the vomiting that follows could reflect the underlying issue rather than the grass alone.",
          "The grass itself triggering vomiting: Eating a significant amount of grass can cause vomiting in dogs; if the grass has been recently treated with a lawn product, that could also be a factor.",
        ],
      },
      {
        label: "What would change the next step",
        tone: "red",
        items: [
          "Blood in the vomit — contact your vet promptly",
          "Vomiting becomes more frequent, or he cannot keep water down",
          "He seems lethargic, painful, or clearly unwell between episodes",
          "Episodes continue to accumulate beyond the four already reported this week",
        ],
      },
      {
        label: "What you can do now",
        tone: "green",
        items: [
          "Contact your vet to describe the pattern — four vomiting episodes in a week is specific enough to be worth reporting rather than waiting.",
          "If it is practical and safe on some walks, redirect him away from grass and note whether the vomiting still occurs — that observation may help your vet.",
          "Note the location of each episode where possible, and whether the grass area could have been recently treated with any lawn product.",
        ],
      },
    ],
    disclaimer: "Pet Behavior Decoder does not diagnose. It sorts possibilities and tells you how soon to involve a vet; if your pet seems seriously unwell, call a vet now.",
  },
  faq: [
    { q: "Why does my dog eat grass and then throw up?",
      a: "Many dogs eat grass now and then without problems. Eating a lot of it can itself cause vomiting, and an upset stomach can also lead a dog to seek grass. A one-off is usually nothing; vomiting several times in a week, vomiting without grass, or any other change such as appetite, stool or energy is worth a call to the vet." },
    { q: "When is a pet's behavior an emergency?",
      a: "Call a vet immediately for trouble breathing, collapse, pale or blue gums, a swollen belly with unproductive retching, suspected poisoning, seizures, or blood in vomit or stool. Those don't wait for a pattern." },
    { q: "What should I tell the vet?",
      a: "Dates and times of each episode, what happened just before, anything else that has changed — food, routine, environment — and any medications. A short written log is more useful than memory." },
    { q: "Can Pet Behavior Decoder diagnose my pet?",
      a: "No. It explains what could account for the behavior, what to watch for, and how urgently to involve a vet, based only on what you describe. Only an examination can diagnose." },
  ],
  description: "Not sure what to make of something your pet is doing? Describe what you're seeing and Pet Behavior Decoder helps you understand plausible explanations, what to watch for, and when it's worth calling a vet.",
  guide: {
    tips: [
      "Be specific about what happens before, during, and after the behavior — that's often more useful than the behavior alone",
      "\"Anything else that changed?\" is worth checking carefully — a combination of changes matters more than any one alone",
      "Save an observation after each notable episode — a couple of saved entries let it compare on the details that actually matter, not just guess",
      "The vet summary is meant to be handed to or emailed to your vet — it states only what you reported, never a suspected diagnosis",
      "If you're worried enough to use this tool and something feels urgent, don't wait for an answer — use the emergency guidance at the top"
    ],
    beforeYouGo: "If your pet is in distress right now (trouble breathing, collapse, a suspected poisoning), call a vet first.",
  }
},

{
  modified: "",
  id: "FakeReviewDetective",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Great reviews and a nagging feeling.",
    give: "A product URL, or paste the review text.",
    get: "Star distribution, verified share, date clustering and language flags, then a read on which reviews are real.",
    edge: "The statistics are computed from your actual reviews before any judgment is made, so the numbers aren't an impression.",
  },
  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    { q: "How can I tell if product reviews are fake?",
      a: "The reliable tells are patterns, not individual reviews: bursts of five-star reviews in a short window, repeated phrasing across 'different' reviewers, reviews that describe the product category but not the specific product, and star distributions with no middle. Fake Review Detective analyzes the reviews you paste and scores the manipulation patterns it finds." },
    { q: "What percentage of online reviews are fake?",
      a: "Estimates vary by platform and category, but researchers and platforms themselves have suggested that a meaningful share of reviews on major marketplaces are inauthentic — some analyses have put problem categories north of a quarter. The safer assumption is that any product with heavy incentives to fake (dominant categories, low margins) has some contamination — which is why reading the pattern matters more than trusting the average." },
    { q: "What are the red flags of a fake review?",
      a: "Extreme sentiment with no specifics, marketing copy vocabulary ('game-changer'), timing clusters, reviewer histories full of same-category five-stars, and reviews that answer objections nobody raised. Real reviews complain about weird specific things — the absence of weird specifics is itself a flag." },
    { q: "Does it work for reviews from any website?",
      a: "Yes — it analyzes the review text you paste rather than scraping a specific platform, so marketplace listings, app-store reviews, hotel and restaurant reviews all work. Paste a representative sample including some negatives; the pattern analysis improves with more text." },
    { q: "Why do fake reviews matter if the product is decent?",
      a: "Because manipulated ratings redirect your money from honest products to whoever paid for the campaign — and sellers who buy reviews tend to cut corners elsewhere (warranty games, review-gating, quiet relistings). Manipulation detected in reviews is a vendor-trust signal, not just a product-quality one." },
  ],
  seoDescription: "Paste reviews or a product URL and get real stats plus an authenticity score for each one, flagging fakes and manipulation. Shop smart — free, no signup.",
  seoTitle: "Fake Review Checker",
  title: "Fake Review Detective",
  tagline: "Spot fake reviews before you get burned",
  tags: ['review', 'paranoid', 'feedback', 'rating', 'fake', 'trust', 'product'],
  icon: "🔍",
  categories: ['Money'],
  headerColor: "#c0d8b8",
  description: "Five stars doesn't always mean five-star quality. Paste reviews or import them from a product page, and DeftBrain will help you separate genuine experiences from marketing disguised as customer feedback.",

  // Public, reviewed demonstration used by both the React page and prerenderer.
  exampleOutput: {
    title: "See what Fake Review Detective gives you",
    expandLabel: "See the full real example results ↓",
    nextStepLabel: "What happens with your reviews",
    intro: "This is the complete, real output from an actual Fake Review Detective run on the sample reviews below — nothing here is invented or shortened.",
    sampleLabel: "Sample review set (6 reviews, wireless earbuds)",
    sampleText: "Six reviews for a pair of wireless earbuds: four unverified 5-star reviews posted 19-25 weeks ago using broad superlative praise (“amazing product,” “perfect in every way,” “phenomenal,” “wow just wow”) with no product-specific detail; one unverified 3-star review naming an awkward fit and an intermittent connection drop on one side; one unverified 2-star review reporting the left side stopped charging within 3 days and slow customer service.",
    context: "Real run, 2026-09-23 — the tool's own built-in example scenario, deciding whether to buy the product.",
    sections: [
      {
        label: "Stats & trust score",
        tone: "red",
        text: "6 reviews, 4.2★ average, 0% verified purchases, 1 generic-praise review, no timing clusters detected. Trust score: 22/100 — Approach with Caution. Four of six reviews show signs of being promotional rather than genuine, and zero are verified purchases, so the 4.2-star average probably overstates real-world quality. The star rating looks less trustworthy than it first appears.",
      },
      {
        label: "What genuine reviews say",
        tone: "yellow",
        text: "The two reviews that read as genuine describe a product with acceptable sound for the price but real reliability problems: connectivity dropouts, a charging failure within days, and slow customer service. Genuine-only rating: 2.5/5★. Pros: sound quality described as adequate for the price point. Cons: one side loses connection intermittently; left side stopped charging within 3 days of use; customer service took a week to respond; fit described as awkward.",
      },
      {
        label: "Recommendation: look for another option (medium confidence)",
        tone: "red",
        text: "The only reviews that describe actual use report a unit that failed within days and a seller slow to respond — worth looking at alternatives with verified buyers and more consistent reliability reports before committing here.",
      },
      {
        label: "Review-by-review scores (6, suspicious first)",
        tone: "red",
        items: [
          "Score 12/100, likely fake — ★★★★★ “Amazing product! Best purchase I ever made. My life changed completely. Everyone should buy these immediately. 10/10 recommend to all family members!” Unverified, 23w old. No verified purchase; pure superlative praise with zero product detail; life-changing claim combined with urgent recommendation to everyone reads as promotional boilerplate; stars embedded in text suggest copy-paste from a template. Every phrase is interchangeable with any other product category.",
          "Score 18/100, likely fake — ★★★★★ “Perfect in every way!! I've tried many similar products and these are THE BEST. My partner who has very high standards also loves them.” Unverified, 25w old. Emphatic superlative ('THE BEST') with no product-specific support; third-party endorsement from an unnamed partner is an unverifiable social-proof device; caps-heavy phrasing and double exclamation combined with zero functional detail.",
          "Score 28/100, likely fake — ★★★★★ “I was skeptical but these exceeded ALL my expectations. The sound quality is phenomenal. Five stars isn't enough!” Unverified, 19w old. Skeptic-turned-believer framing is a common promotional pattern; 'phenomenal' sound quality stated but not described in any way; no mention of use context or comparison point.",
          "Score 30/100, likely fake — ★★★★★ “Wow just wow. Received yesterday and already love it. Great sound great quality great everything. Will buy again as gifts!” Unverified, 21w old, posted 1 day after receipt. Three consecutive vague praise units with no elaboration; posted 1 day after receipt yet expresses complete confidence across all dimensions; mentions sound but says nothing about it.",
          "Score 72/100, likely genuine — ★★★☆☆ “Sound is decent for the price. Fit is awkward and one side occasionally loses connection. Battery life as advertised.” Unverified, 20w old. Names a specific physical problem (awkward fit) and a specific technical problem (intermittent connection drop on one side); distinguishes between what works and what doesn't; measured, non-promotional tone consistent with real use over time.",
          "Score 78/100, likely genuine — ★★☆☆☆ “Returned after 3 days. Left side stopped charging. Customer service took a week to respond. Sound was fine until it died.” Unverified, 22w old. Names a specific hardware failure (left side stopped charging) and a specific service experience (one-week response time).",
        ],
      },
      {
        label: "Positive campaign detected (high confidence)",
        tone: "red",
        text: "Four reviews pile on superlatives with no functional detail, while the two credible reviews — a 3-star and a 2-star — describe specific problems. The shape of that split suggests the positive reviews are not coming from ordinary buyers. Reviews 0, 1, 2, and 4 all award 5 stars yet cannot name a single concrete feature, use case, or comparison point. None of the six reviews carry a verified purchase badge, removing the one platform-level check that separates buyers from non-buyers.",
      },
      {
        label: "Category comparison",
        tone: "yellow",
        text: "Unusual for this category: 0% verified purchases across all six reviews is atypical — most product listings with real buyers accumulate at least some verified badges; stars embedded in review text suggest copy-paste from a template rather than organic typing. Normal for this category: a mix of high and low ratings is normal; the problem here is that the high-rated ones lack any substance to back them up.",
      },
      {
        label: "What to watch for next time",
        tone: "neutral",
        items: [
          "Praise with no receipts — a review that gives the highest rating but cannot describe what the product actually does. Reviews 0, 1, 2, and 4 offer 'life-changing,' 'great everything,' 'phenomenal,' and 'perfect in every way' but zero specifics. How to spot it: ask whether the review could be copy-pasted onto any product in the category and still make sense.",
          "The someone-else-loved-it move — borrowing credibility from an unnamed third party whose opinion cannot be checked. Review 4 invokes a partner with 'very high standards' who also approves. How to spot it: ask what you actually know about that off-screen person — the answer is always nothing.",
        ],
      },
    ],
    nextStep: "With a larger review sample, Fake Review Detective computes the patterns present in the material you provide, flags reviews that deserve scrutiny, scores each one individually, and summarizes what the more credible reviews consistently say.",
    disclaimer: "This is a real, complete tool run against a realistic sample review set. Review-pattern analysis can identify reasons for caution, not prove who wrote a review or whether a particular review is fraudulent."
  },
  guide: {
    tips: [
      "Include as many reviews as possible — pattern detection improves with volume (minimum 100 characters, 3+ reviews recommended)",
      "Copy reviews with their star ratings and dates for timeline analysis",
      "The instant stats panel gives useful data even before the AI runs",
      "Sort reviews 'Most suspicious first' to quickly find the fakes",
      "The Genuine Consensus section is the most actionable — it tells you what the product actually is based on reviews you can trust",
      "Try the example reviews to see the tool in action before pasting your own"
    ],
    
  }
},

{
  modified: "",
  id: "BeforeTheCrash",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You've burned out before and don't want to again.",
    give: "A sixty-second daily check-in: energy, sleep, stress, symptoms, warning signs.",
    get: "Your own pattern before a crash — what tended to change in the days before it.",
    edge: "It learns your indicators rather than generic burnout symptoms — which is why it needs a few days before it's useful.",
  },
  seoDescription: "Track energy, sleep, and stress to spot YOUR personal burnout pattern before you crash. See what tended to change in the days beforehand. Free.",
  seoTitle: "Burnout Warning Signs",
  title: "Before the Crash",
  tagline: "Learn what tends to happen before you run out of steam",
  tags: ["energy patterns", "low energy", "hit a wall", "crash", "daily check-in", "pattern tracking", "energy tracker", "sleep", "stress", "workload", "symptoms", "routines", "personal patterns", "fatigue", "warning signs", "burnout patterns"],
  icon: "⚡",
  categories: ['Health & Wellness', 'Self & Reflection', 'Work & Meetings'],
  headerColor: "#b8dcd8",
  description: "Track a few daily signals and look for patterns in the days when your energy drops or life starts feeling harder. Over time, Before the Crash helps you compare what changed beforehand — sleep, stress, workload, symptoms, routines, and anything else you choose to track.",
  guide: {
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

{
  modified: "2026-03-11",
  id: "DreamPatternSpotter",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "The same dream keeps coming back.",
    give: "One dream in detail, or several to compare. Emotions and what's happening in your life help.",
    get: "Recurring themes across dreams and what's changing alongside them.",
  },
  seoDescription: "Find the recurring themes, symbols, and emotional patterns hiding in your dreams. Free dream analysis with reflection questions that connect to waking life.",
  seoTitle: "Recurring Dream Patterns",
  title: "Dream Pattern Spotter",
  tagline: "Find recurring themes and emotional patterns in your dreams",
  tags: ['dreams', 'dream meaning', 'dream interpretation', 'recurring dreams', 'repeated dreams', 'dream patterns', 'dream symbols', 'dream analysis', 'what does my dream mean', 'emotional patterns', 'waking life', 'dream journal', 'jungian dreams', 'freudian dreams'],
  icon: "🌙",
  categories: ['Health & Wellness', 'Self & Reflection'],
  headerColor: "#b8dcd8",
  description: "Spots notable elements, possible associations, and recurring patterns in your dreams — then gives you thoughtful questions to explore what, if anything, they mean to you. Includes optional Jungian, Freudian, and dream-science perspectives for additional ways of looking at them.",
  guide: {
    tips: [
      "Write down dreams immediately after waking — they fade fast",
      "The life context field significantly improves the analysis",
      "Pattern mode needs at least 2 dreams, but 4-5 gives much richer results",
      "Don't try to interpret before you see the analysis — your pre-formed interpretation may block deeper patterns"
    ],
  }
},
{
  modified: "",
  id: "MeetingHijackStopper",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You are running a meeting and want it to actually reach the thing it was called for.",
    give: "What needs to happen by the end, how long you have, and roughly who is there.",
    get: "An agenda built around that outcome, words to say when it drifts, and a short list for before people leave. Then a timer to run it by, and a follow-up written from what you actually captured.",
    edge: "It writes the sentence you would have to improvise in the room — the redirect, the widening, the close — and it builds the plan around your stated outcome instead of a template.",
  },
  seoDescription: "Build a meeting agenda around what actually has to happen, with the words to say when it drifts and a checklist for before people leave. Free, no signup.",
  seoTitle: "Meeting Agenda Builder",
  title: "Meeting Hijack Stopper",
  tagline: "A plan for the meeting—and the moments that could derail it.",
  tags: ['meeting', 'agenda', 'facilitation', 'hijack', 'inclusive', 'structure', 'work'],
  icon: "🛡️",
  categories: ['Work & Meetings'],
  headerColor: "#97b4d8",
  description: "Tell it what needs to happen by the time the meeting ends, and it builds an agenda around that — with the words to say when the conversation wanders, a plan for reaching the decision, and a short checklist for before people leave. Then run it live against a timer, and write the follow-up from what you actually captured.",
  guide: {
      tips: [
        "Describe the outcome, not the topic. 'Decide which two proposals advance' produces a usable agenda; 'discuss the proposals' produces a meeting about proposals",
        "The scripts are the point. Read them once before you go in — improvising a redirect while someone is mid-sentence is the hard part",
        "Leaving a field blank is a real answer. If you do not know who decides, say so, and the plan will treat that as the first thing to settle",
        "The follow-up is generated after the meeting from what you captured. Anything you leave blank stays out of it rather than becoming a placeholder"
      ],
    }
},

{
  modified: "2026-03-11",
  id: "DoctorVisitTranslator",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You're home from the appointment and don't know what you were told.",
    give: "Your visit notes, or what you remember — medications, results, diagnosis, instructions.",
    get: "Plain English, what matters, and what to ask at the follow-up.",
    edge: "The companion to Doctor Visit Prep: that one shapes what you say going in, this decodes what you heard coming out.",
  },
  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    { q: "How can I understand what my doctor said at my appointment?",
      a: "Paste your visit summary, diagnosis, or aftercare notes into Doctor Visit Translator and it rewrites the medical language in plain English — what each term means, what the findings suggest, and which follow-up items actually matter. It's built for the moment you get home and realize you understood half the appointment." },
    { q: "What do the abbreviations in my medical notes mean?",
      a: "Clinical notes are dense with shorthand — HPI, PRN, BID, w/u, r/o — that doctors write for other doctors, not for you. The translator expands the abbreviations in context, so 'r/o DVT, start ASA 81 QD' becomes an actual sentence about what's being checked and what to take." },
    { q: "Can I paste my lab results or test results into it?",
      a: "Yes — lab reports, imaging summaries, and discharge notes are exactly what it's for. It explains what each value measures and what 'out of range' flags typically mean, so you can have an informed conversation with your clinician instead of panic-googling individual numbers." },
    { q: "Is this a substitute for asking my doctor questions?",
      a: "No. It translates what your clinician already told you — it doesn't diagnose, and it will tell you when something in your notes is worth a follow-up question rather than guessing. Understanding your notes better usually leads to asking your doctor sharper questions, not fewer." },
    { q: "Is my medical information stored when I use it?",
      a: "Your text is processed to generate the translation and isn't used to build a profile of you. As with anything medical online, leave out identifiers you don't need to include — the translation works the same without your name or record numbers." },
  ],
  seoDescription: "Paste any visit note, lab result, or prescription and get a plain-English summary, action checklist, and questions to ask. Free instant medical jargon translator.",
  seoTitle: "Medical Jargon Decoder",
  title: "Doctor Visit Translator",
  tagline: "Turn medical jargon into plain English",
  tags: ['doctor', 'medical', 'jargon', 'health', 'appointment', 'diagnosis', 'plain language', 'prescription', 'lab results'],
  icon: "👩‍⚕️",
  categories: ['Conversations', 'Health & Wellness', 'Home & Daily Life'],
  headerColor: "#ccdfc4",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what Doctor Visit Translator gives you",
    expandLabel: "See the full real example ↓",
    intro: "Real output from an actual run on the visit notes below. Most of the result is shown; nothing is reworded.",
    sampleLabel: "The visit notes",
    sampleText: "Type 2 diabetes follow-up. A1C today 7.8% (was 8.2% three months ago). Adding metformin 500mg twice daily with meals. Continue lisinopril 10mg. Repeat A1C and basic metabolic panel in 3 months. Call if fasting BG over 300 or symptoms of hypoglycemia. Consider GLP-1 agonist if A1C does not improve. Patient tolerating current meds well, BP 128/82, weight down 4 lbs.",
    context: "Real run, 2026-10-07 — a follow-up visit. One of the tool's own built-in examples; not a real patient.",
    sections: [
      {
        label: "In plain English",
        tone: "green",
        items: [
          "This was a follow-up for type 2 diabetes, a condition where blood sugar runs higher than it should over time.",
          "You're starting a new medication (metformin) twice a day with meals, staying on your current blood pressure pill (lisinopril), and getting repeat blood work in 3 months.",
          "Your A1C improved from 8.2% to 7.8% over three months, which is movement in the right direction, and your doctor noted you're tolerating your medications well.",
          "The next check is in about 3 months, and your doctor noted that another medication type could be considered then if your blood sugar hasn't improved enough.",
        ],
      },
      {
        label: "Terms explained",
        tone: "neutral",
        items: [
          "A1C: a blood test showing your average blood sugar over the past 2-3 months. Yours went from 8.2% to 7.8%, so it's improving; this is the number your doctor is tracking to decide whether your current plan is working or needs to change.",
          "GLP-1 agonist: a class of diabetes medication. Your doctor mentioned this as a possible next step only if your A1C doesn't improve enough over the next three months, so it's a 'maybe later,' not something starting now.",
        ],
      },
      {
        label: "Your test result",
        tone: "neutral",
        items: [
          "A1C — 7.8% today. A non-diabetes level is generally below 5.7%; a common target for many adults with diabetes is below about 7%, but confirm your personal goal with your doctor. Trend: Improving, from 8.2% three months ago to 7.8% now.",
        ],
      },
      {
        label: "What to do",
        tone: "green",
        items: [
          "Start metformin 500mg twice a day, taken with meals. Take one 500mg tablet with food in the morning and one with food in the evening to reduce stomach upset.",
          "Continue taking lisinopril 10mg as before. Keep taking it exactly as you have been.",
          "Schedule repeat A1C and basic metabolic panel for about 3 months from now. Call your clinic or lab to book the blood draw, ideally timed just before your next appointment.",
        ],
      },
      {
        label: "When to call",
        tone: "red",
        items: [
          "Symptoms of low blood sugar such as shakiness, sweating, confusion, or feeling faint",
          "Fasting blood sugar over 300, which your doctor specifically asked you to call about",
        ],
      },
      {
        label: "Questions for next time",
        tone: "neutral",
        items: [
          "What is my personal A1C target?",
          "At what A1C would you decide to add the GLP-1 medication you mentioned?",
          "How should I check and record my blood sugar at home?",
          "Should my metformin dose change if I'm tolerating it well?",
        ],
      },
    ],
    disclaimer: "Explains what the notes say; it doesn't replace your doctor's or pharmacist's advice.",
  },
  description: "Medical conversations often make perfect sense while you're sitting in the exam room and almost no sense once you get home. Paste your visit notes, lab results, or the instructions they sent you home with, and DeftBrain will translate them into plain English.",
  guide: {
    tips: [
      "The more detail you include, the more accurate the translation — paste the actual notes if possible",
      "Add your current medications to flag potential drug interactions",
      "Use the Symptom Journal to track symptoms over time and share trends with your doctor",
      "Save translations to your health history for comparison across visits"
    ],
  }
},
{
  modified: "",
  id: "EmailUrgencyTriager",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Your inbox has piled up and you cannot tell what actually needs you today.",
    give: "Paste a batch of emails and your role. A minute or two.",
    get:  "Every email sorted into now, this week, or optional — with the reason, any deadline it found, and what happens if you wait. Then the batch view: total time to clear it, what to delegate, what to ignore.",
    edge: "It gives you permission to wait. Alongside the triage it names what to ignore outright and which senders are never actually urgent — it is built to shrink the list, not to make you answer faster.",
  },
  seoDescription: "Cut through inbox anxiety in seconds. Paste your emails and find out what actually needs a reply today versus what can wait or be ignored. Free, no signup.",
  seoTitle: "Email Priority Sorter",
  title: "Email Urgency Triager",
  tagline: "Find out what actually needs a reply today",
  tags: ['email urgency', 'email triage', 'inbox triage', 'which emails to answer', 'what to reply today', 'email priorities', 'prioritize email', 'urgent email', 'reply now', 'reply this week', 'can this email wait', 'overwhelmed inbox', 'inbox anxiety', 'unread emails', 'email deadlines', 'ignore email', 'delegate email'],
  icon: "📬",
  categories: ['Conversations', 'Tasks', 'Work & Meetings'],
  headerColor: "#d4dde8",
  description: "Analyze email urgency and cut through inbox anxiety. Find out what actually needs a response today vs what can wait.",
  guide: {
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
    
  }
},

{
  modified: "",
  id: "LeaseTrapDetector",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Before you sign a lease.",
    give: "The lease as a PDF or text, plus your city and state.",
    get: "Predatory clauses flagged, compared against local tenant law, with what's unenforceable where you live.",
    edge: "It checks against your own jurisdiction, so a clause that is routine in one place and unlawful in another is read the right way round.",
  },
  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    { q: "What should I look for before signing an apartment lease?",
      a: "The clauses that cost renters the most are automatic renewal terms, broad landlord entry rights, vague maintenance responsibilities, fee stacking (late fees, admin fees, lease-break fees), and deposit-deduction language. Lease Trap Detector reads your actual lease text and flags these clause-by-clause, in plain English, so you know what you're agreeing to before you sign." },
    { q: "Can a landlord put illegal clauses in a lease?",
      a: "Yes — leases sometimes contain clauses that aren't enforceable in your jurisdiction, like waiving your right to sue or shifting legally-required repairs onto you. An unenforceable clause doesn't disappear just because it's invalid; landlords may still act on it until challenged. The tool flags clauses that commonly conflict with tenant protections so you can verify them against your local law." },
    { q: "What is the biggest red flag in a rental lease?",
      a: "Vague language around money — undefined 'reasonable' fees, cleaning standards left to the landlord's judgment, or deposit deductions without an itemization requirement. Ambiguity almost always resolves in the landlord's favor at move-out. Specific numbers, timelines, and definitions are what protect you." },
    { q: "Can I negotiate a lease before signing it?",
      a: "Usually yes — especially clauses rather than rent. Landlords expect pushback on things like early-termination penalties, guest policies, and renewal terms far more than tenants realize. Once the detector flags a problem clause, ask for it to be struck or amended in writing before you sign; verbal promises don't survive a dispute." },
    { q: "Is a lease review service worth it for an apartment?",
      a: "A lawyer review makes sense for unusual situations (commercial leases, long terms, big deposits). For a standard apartment lease, an automated clause-by-clause review catches the common traps in minutes and is free here — and it tells you which clauses are worth escalating to a real lawyer or your local tenant union." },
  ],
  seoDescription: "Spot predatory clauses, illegal fees, and missing protections in your lease. Color-coded red flags, your rights, and negotiation scripts in seconds. Free.",
  seoTitle: "Lease Red-Flag Checker",
  title: "Lease Trap Detector",
  tagline: "Find predatory clauses hiding in your lease",
  tags: ['lease', 'rent', 'apartment', 'landlord', 'tenant', 'housing'],
  icon: "🏡",
  categories: ['Home & Daily Life', 'Money'],
  headerColor: "#c0d8b8",
  description: "Leases are full of language most renters never question until something goes wrong. Upload your lease, and DeftBrain will flag unusual clauses, explain them in plain English, and help you spot problems before they become expensive surprises.",

  // Public, reviewed demonstration. This is deliberately static: the React page
  // and scripts/prerender.js both render this same object, so visitors and
  // crawlers see the same substantive example. It is sample analysis, not a
  // jurisdiction-specific legal conclusion.
  exampleOutput: {
    title: "See what Lease Trap Detector gives you",
    expandLabel: "See the full real example results ↓",
    nextStepLabel: "What happens with your lease",
    intro: "This is the complete, real output from an actual Lease Trap Detector run on the sample lease shown below — nothing here is invented or shortened.",
    sampleLabel: "Sample lease (excerpt)",
    sampleText: "RESIDENTIAL LEASE AGREEMENT — 1428 Elm Street, Apt. 3B, San Francisco, CA. Rent $2,800/month (Clause 4), due on the 1st with a 5-day grace period; $200 flat late fee plus $50/day thereafter, tenant waives right to challenge. Security deposit $4,200 (Clause 5), returned within 30 days, sole landlord discretion on deductions; holes in walls forfeit entire deposit (Clause 7). $75/month building services fee. Section 3: auto-renews month-to-month at 110% of rent absent 60 days notice. Section 8: landlord may enter at any reasonable time with or without notice. Section 9: no subletting without consent, sole discretion; unauthorized occupancy over 7 days is breach. Section 10: tenant pays landlord's attorney's fees even if landlord does not prevail. Section 12: early termination requires 2 months rent plus full deposit forfeiture.",
    context: "Real run, 2026-09-23 — a realistic San Francisco residential lease (the tool's own built-in example scenario).",
    sections: [
      {
        label: "3 things to fix before you sign",
        tone: "red",
        items: [
          "Remove the automatic 10% rent increase in Section 3 and replace it with a renewal at the same rent, or delete the auto-renewal clause entirely and negotiate renewal terms at the time. Why: if you miss the 60-day notice window, your rent increases by $280/month immediately with no further negotiation possible.",
          "Strike the one-sided attorney's fees clause in Section 10 and replace it with a mutual prevailing-party clause: each party pays their own fees unless a court awards them to the prevailing party. Why: as written, you owe the landlord's legal fees even if you win; this may conflict with Cal. Civ. Code § 1717 and creates serious financial exposure if any dispute arises.",
          "Reduce the security deposit from $4,200 to $2,800 (one month's rent) to comply with California AB 12, effective July 1, 2024, which capped residential security deposits at one month's rent for most landlords — Cal. Civ. Code § 1950.5(c). Why: the $4,200 deposit appears to exceed the current statutory cap, meaning $1,400 may be recoverable if you paid it, but disputing it mid-tenancy creates friction — fix it before signing.",
        ],
      },
      {
        label: "Overall assessment",
        tone: "red",
        text: "High risk — 4 major concerns. Several clauses in this lease appear to conflict with California law or San Francisco local rules and should be corrected or struck before signing. Jurisdiction type: tenant-favorable. Rent control: San Francisco's Rent Ordinance (SF Admin. Code Ch. 37) likely applies to this unit if it was built before June 13, 1979 — verify the building's construction date, as rent increases and eviction protections under the Ordinance are substantial.",
      },
      {
        label: "Financial exposure",
        tone: "yellow",
        items: [
          "Monthly rent: $2,800 per month, due on the 1st of each month per Clause 4.",
          "Move-in cost: $7,000 (first month's rent of $2,800 plus security deposit of $4,200).",
          "Annual extras: the $75/month building services fee adds $900 over 12 months; if no late fees are triggered, total fees beyond rent are approximately $900 for the year.",
          "Worst case: if rent is paid late once (10 days late), early termination is exercised, and the full deposit is forfeited — approximately $200 flat late fee + $500 in daily late fees + $5,600 early termination payment (2 months rent) + $4,200 forfeited deposit = roughly $10,500 in penalties on top of rent already paid.",
        ],
      },
      {
        label: "Security deposit",
        tone: "yellow",
        text: "Lease charges $4,200 against a legal max of $2,800. Over limit. Under Cal. Civ. Code § 1950.5, as amended by AB 12 (effective July 1, 2024), the maximum security deposit for an unfurnished residential unit is one month's rent — $2,800 in this case — for most landlords; the tenant should verify whether the landlord qualifies for any narrow exception (small individual landlords who own no more than two residential rental properties totaling no more than four dwelling units may still charge up to two months' rent under the AB 12 exception, but this should be confirmed directly). Return: 21 days is required by Cal. Civ. Code § 1950.5(g); the lease states 30 days, which appears to conflict with this statute. Interest: no. Walkthrough: required.",
        items: [
          "The deposit of $4,200 (1.5 months' rent) likely exceeds the one-month cap established by AB 12 (Cal. Civ. Code § 1950.5, eff. July 1, 2024) for most landlords — the tenant should ask the landlord to confirm which exception, if any, applies and request that in writing.",
          "The lease states the itemized statement will be provided within 30 days, but Cal. Civ. Code § 1950.5(g) sets the deadline at 21 days; the statute controls, but the discrepancy is worth flagging so the tenant knows their actual legal deadline.",
          "Clause 5 gives the landlord sole discretion to apply the deposit to any cleaning, repairs, or unpaid charges without defining the standard; California law limits deductions to damage beyond ordinary wear and tear — deductions for ordinary wear are not permitted regardless of what the lease says.",
          "Clause 7 states that holes in walls shall cause forfeiture of the entire security deposit; a blanket forfeiture provision for a single category of damage may not reflect the proportionality California law requires for deposit deductions, and the tenant should document wall condition thoroughly at move-in.",
        ],
      },
      {
        label: "Red flags — likely unenforceable (4)",
        tone: "red",
        items: [
          "Section 8: “Landlord may enter the Premises at any reasonable time with or without notice for any purpose Landlord deems necessary.” This clause eliminates the 24-hour advance written notice California law requires before landlord entry in nearly all circumstances. Unenforceable — Cal. Civ. Code § 1954 requires at least 24 hours written notice before entry except in a documented emergency; a lease cannot waive this right. Your script: “California Civil Code Section 1954 requires 24 hours written notice before entry and this cannot be waived by lease. Please revise Section 8 to reflect the statutory notice requirement.”",
          "Section 10: “Tenant shall pay Landlord's attorney's fees and costs, including in actions where Landlord is not the prevailing party.” Requiring the tenant to pay the landlord's fees even when the landlord loses is one-sided. Unenforceable — Cal. Civ. Code § 1717 makes a contractual attorney's fees clause mutual by operation of law in contract actions, and courts may decline to enforce a clause that purports to award fees to a non-prevailing party. Your script: “Section 10 purports to make me liable for fees even if the landlord does not prevail, which conflicts with California Civil Code Section 1717. I am willing to accept a standard mutual prevailing-party attorney's fees clause in its place.”",
          "Section 4: “A late fee of $200 plus $50 per day shall apply if rent is received after the 5th. Tenant agrees that all late fees are reasonable and waives any right to challenge them.” The compounding daily fee structure and the embedded waiver of the right to challenge reasonableness are both legally suspect. Unenforceable — under California common law liquidated damages principles (Cal. Civ. Code § 1671), a late fee must represent a reasonable estimate of actual loss; an escalating daily penalty and a pre-signed waiver of challenge do not insulate the clause from court scrutiny. Your script: “The $50-per-day escalating late fee and the waiver of challenge in Section 4 are likely unenforceable under California liquidated damages law. I would like to replace these with a flat, reasonable late fee and remove the waiver language.”",
          "Section 5: “Landlord may apply the deposit to any cleaning, repairs, or unpaid charges at Landlord's sole discretion. Itemized statement will be provided within 30 days of move-out.” The 30-day return timeline exceeds the 21-day deadline California law requires. Unenforceable — Cal. Civ. Code § 1950.5(g) requires the landlord to return the deposit and any itemized statement of deductions within 21 calendar days of the tenant vacating. Your script: “Section 5 states 30 days for the deposit return, but California Civil Code Section 1950.5 requires 21 days. Please correct the timeline and add language confirming deductions will not include normal wear and tear.”",
        ],
      },
      {
        label: "Yellow flags — worth clarifying (3)",
        tone: "yellow",
        items: [
          "Section 3 — Term and Renewal: “Unless either party gives 60 days written notice prior to expiration, this lease shall automatically renew on a month-to-month basis at a rent equal to 110% of the most recent monthly rent.” The 10% rent increase on automatic renewal may conflict with San Francisco Rent Ordinance limits if the unit is rent-controlled, and 60 days notice to exit is longer than the 30 days California law requires of tenants on month-to-month tenancies. Questions to ask: Is this unit covered by the San Francisco Rent Ordinance, and if so, how does the 110% renewal rent comply with allowable annual increase limits? If I miss the 60-day window and the lease converts, am I still bound to 60 days notice to vacate rather than the statutory 30 days?",
          "Section 9 — Assignment and Subletting: “Tenant may not sublet or assign without written consent withheld at sole discretion, and any unauthorized occupancy of more than 7 days by a non-tenant shall constitute breach.” California Civil Code Section 1995.310 and San Francisco Rent Ordinance Section 6.15 give tenants qualified rights to sublet in rent-controlled units. Questions to ask: Does the landlord consider a regular overnight guest who stays more than 7 days cumulatively or consecutively to be an unauthorized occupant? Under what circumstances would the landlord approve a sublet request?",
          "Section 12 — Early Termination: “Tenant may terminate early by paying 2 months rent as liquidated damages plus forfeiting the security deposit.” Requiring both a liquidated damages payment and full deposit forfeiture could amount to a penalty exceeding actual damages under California Civil Code Section 1671. Questions to ask: Is the landlord willing to separate the deposit from the early termination fee? Would the landlord accept a mitigation-based early termination clause where the fee reduces if the unit is re-rented quickly?",
        ],
      },
      {
        label: "May not hold up in court (3)",
        tone: "red",
        items: [
          "Section 5's 30-day deposit-return timeline appears to conflict with the 21-day statutory deadline under Cal. Civ. Code § 1950.5, so a court may decline to treat the longer period as controlling. Note in writing before move-out that you expect the deposit accounting within 21 days, and document the unit's condition thoroughly at move-out.",
          "Section 8's no-notice entry provision appears to conflict with Cal. Civ. Code § 1954's 24-hour notice requirement, and a court may decline to enforce entry without the required notice except in genuine emergencies. If the landlord attempts to enter without notice in a non-emergency, you can cite Cal. Civ. Code § 1954 in writing.",
          "Section 10's attorney's-fees clause — requiring the tenant to pay fees even when the landlord loses — appears to conflict with California's reciprocal fee statute (Cal. Civ. Code § 1717) and public policy, and a court may not uphold it as written. Request that this clause be revised to a standard mutual prevailing-party fee provision, or ask that it be removed entirely.",
        ],
      },
      {
        label: "Green flags (2)",
        tone: "green",
        items: [
          "“The security deposit is set at $4,200, equal to 1.5 months rent, and an itemized statement will be provided within 30 days of move-out.” As of July 1, 2024, California AB 12 limits residential security deposits to one month's rent for most tenants, so the deposit here appears to exceed that cap and may be reducible — but the commitment to an itemized statement is consistent with the statute's requirement and gives you a documented basis to dispute improper deductions.",
          "“Monthly rent of $2,800 is due on the 1st of each month with a 5-day grace period before any late fee applies.” A 5-day grace period before late fees trigger is a concrete buffer that limits your exposure if a payment is delayed by a weekend or bank processing, and it is stated clearly enough to be enforceable as written in your favor.",
        ],
      },
      {
        label: "Missing from this lease (4)",
        tone: "yellow",
        items: [
          "No lead paint disclosure or acknowledgment. For housing built before 1978, federal law (42 U.S.C. § 4852d) requires landlords to disclose known lead paint hazards and provide the EPA pamphlet before a tenant is bound. Ask the landlord to confirm the building's construction date and, if applicable, provide the required disclosure before signing.",
          "No move-in inspection or move-in condition checklist. Without a documented baseline, disputes about pre-existing versus tenant-caused damage become much harder to resolve. Cal. Civ. Code § 1950.5(f) gives tenants the right to request an initial inspection before moving in; this lease does not mention that right. Request a joint move-in inspection and a signed condition checklist.",
          "No mention of San Francisco Rent Ordinance coverage. If this unit is covered, the landlord's ability to raise rent and permissible grounds for eviction are governed by local law regardless of what the lease says. Ask the landlord in writing whether the unit is subject to the Ordinance, and verify separately with the Rent Board.",
          "The $4,200 deposit (1.5 months rent) should be verified against the current California cap. AB 12, effective July 1, 2024, caps most deposits at one month's rent — $2,800 here — meaning this deposit may exceed the current legal limit by $1,400. Ask whether the landlord qualifies for any AB 12 exemption before paying.",
        ],
      },
      {
        label: "Unusual fees (3)",
        tone: "yellow",
        items: [
          "Building services fee: $75/month ($900/year), flagged as unusual (depends on jurisdiction). Ask the landlord to itemize exactly what this covers and whether it duplicates costs already reflected in rent.",
          "Daily late fee accrual: $50/day after the 5th, flagged as unusual (depends on jurisdiction). California courts have declined to enforce late fees disproportionate to actual damages; ask for a single flat fee instead.",
          "Early termination deposit forfeiture: $4,200 (full deposit, per Clause 12), flagged as unusual (depends on jurisdiction). Request that early termination be a standalone liquidated-damages provision without the additional automatic deposit forfeiture.",
        ],
      },
      {
        label: "Negotiation strategy",
        tone: "neutral",
        text: "Key points to hit: correct the security deposit to $2,800 to comply with AB 12 / Cal. Civ. Code § 1950.5(c); revise Section 8 to require 24 hours written notice before entry per Cal. Civ. Code § 1954; replace the one-sided attorney's fees clause in Section 10 with a mutual prevailing-party clause. Stand firm on: 24-hour written notice before entry (non-waivable under Cal. Civ. Code § 1954); the 21-day deposit return timeline (cannot be extended by contract under Cal. Civ. Code § 1950.5(g)); a deposit at or below one month's rent (AB 12's $2,800 cap for this unit). Opening email: “I have reviewed the proposed lease for 1428 Elm Street, Apt. 3B and identified several provisions that appear to conflict with California Civil Code and San Francisco local ordinances. I would like to resolve these before signing and have listed the specific changes I am requesting below.” If the landlord says “The late fee clause is standard and you already agreed it is reasonable,” you respond: “California Civil Code Section 1671 allows courts to evaluate whether a late fee is a reasonable estimate of actual loss regardless of any pre-signed agreement, so the waiver language does not remove that right.” If the landlord says “The 1.5-month deposit is what we charge everyone and has always been our policy,” you respond: “California AB 12, effective July 1, 2024, limits residential security deposits to one month's rent for most landlords, so the current statutory cap for this unit is $2,800.”",
      },
      {
        label: "Resources",
        tone: "neutral",
        items: [
          "San Francisco Rent Board (housing authority) — can confirm whether this unit is covered by the San Francisco Rent Ordinance, explain lawful rent increase limits, and provide free counseling; search sf.gov for the Rent Board contact page.",
          "Tenderloin Housing Clinic or Bay Area Legal Aid (legal aid) — provide free or low-cost legal advice to San Francisco tenants on lease disputes, security deposit issues, and unlawful lease terms.",
          "San Francisco Tenants Union (tenant union) — offers counseling sessions where tenants can review lease terms with experienced advisors before signing; search sf-tenants.org for current hours.",
        ],
      },
    ],
    nextStep: "With your full lease, Lease Trap Detector examines every clause in context against the law that actually applies to your unit's location, and gives you a negotiation strategy, an amendment you can send, and a personalized move-in/move-out checklist.",
    disclaimer: "This is a real, complete tool run against a realistic sample lease. It is general guidance, not legal advice — consult a tenant rights attorney for your specific situation."
  },

  guide: {
    tips: [
      "LOCATION IS CRITICAL - renting law varies sharply between regions and even between neighbouring cities, so name the city and the region or country it is in.",
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
    beforeYouGo: "Check the lease before you sign. Once it's signed, even a clause the law won't enforce can take a fight to remove.",
    
  }
},

{
  modified: "",
  id: "FriendshipFadeAlerter",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You keep meaning to reach out and months go by.",
    give: "The people who matter, how often you'd like to be in touch, and when you last were.",
    get: "Who's fading, and something specific to say to each.",
    edge: "Built for time-blindness. It notices the drift you can't feel, because three months doesn't feel like three months.",
  },
  seoDescription: "Never lose touch with people you care about. Track relationships, get alerts when it's been too long, and get guilt-free conversation starters. Free, no signup.",
  seoTitle: "Keep-in-Touch Reminder",
  title: "Friendship Fade Alerter",
  tagline: "Stay connected to the people you care about",
  tags: ["stay in touch", "losing touch", "friendship drift", "reconnect with friend", "reach out after a long time", "what to say to a friend", "keep in touch", "friendship reminder", "contact reminder", "contact rhythm", "forgot to text", "awkward reconnect", "maintain friendships", "relationship maintenance", "time blindness friendship", "who should i reach out to"],
  icon: "💛",
  categories: ['Decisions', 'Relationships'],
  headerColor: "#e0b8b8",
  description: "Choose a comfortable rhythm for the people you care about. Friendship Fade Alerter gently shows when it may be worth saying hello, and helps you reconnect when time has slipped by — without guilt or awkwardness.",
  guide: {
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
  }
},

{
  modified: "2026-09-11",
  id: "TripRecon",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Going somewhere that might be noisy, crowded, bright, smelly, warm, or otherwise hard to handle.",
    give: "What matters to you and whatever you already know about the place or route. Save a profile once if you want.",
    get: "What may be worth preparing for, practical steps, words to ask for what you need, and a backup plan.",
    edge: "It prepares for possibilities without pretending it knows what the place will actually be like when you arrive.",
  },
  seoDescription: "Going somewhere that might be noisy, crowded, bright, smelly, or otherwise hard to handle? Build a practical preparation and backup plan without fake predictions. Free, no signup.",
  seoTitle: "Sensory Prep for a Place or Route",
  title: "Trip Recon",
  tagline: "Prepare for the sensory parts of going somewhere.",
  tags: [
    'sensory', 'noise', 'crowds', 'lighting', 'smells',
    'environment', 'planning', 'location', 'scouting', 'map', 'visit',
    'sensitive', 'temperature', 'place', 'before you go', 'accommodations'
  ],
  icon: "🗺️",
  categories: ['Health & Wellness', 'Self & Reflection', 'Travel & Events'],
  headerColor: "#2a3820",
  description: "Going somewhere that may be noisy, crowded, bright, smelly, warm, or otherwise hard to handle? Tell Trip Recon what matters to you and what you already know. It helps you prepare for possibilities, ask for what you need, and make a backup plan without inventing conditions at the place.",
  guide: {
    tips: [
      "What you already know about a place is stronger than what its category merely suggests — include past experience or verified details when you have them",
      "A selected concern says what matters to you; it does not prove the place will contain that problem",
      "Comfort Kit should be built from the concerns and constraints you selected, not from a generic packing list",
      "Accommodation language should ask clearly for what would help without promising that a venue can or will provide it",
      "Save what matters to you as a profile if useful — it is a preference preset you control, not a diagnosis",
    ]
  }
},
{
  modified: "",
  id: "LeverageLogic",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Before a negotiation, when you are not sure what you actually have.",
    give: "The situation, what you want, and anything you think is working for either side.",
    get: "Your position and theirs, separated into what is established and what you are assuming, what is still unknown and how to find it out, and words you could use.",
    edge: "It asks what the other side has too, and leaves their column empty rather than inventing one.",
  },
  seoDescription: "Work out what leverage you actually have before a negotiation. Separates the facts you supplied from the assumptions built on them, names what is still unknown, and turns it into words you can use.",
  seoTitle: "Leverage Logic: Know Where You Stand",
  title: "Leverage Logic",
  tagline: "Know where you stand before you negotiate",
  tags: ["my boss", "my manager", "negotiation", "negotiation strategy", "negotiation prep", "leverage", "salary negotiation", "raise", "freelance rate", "vendor negotiation", "lease negotiation", "price negotiation", "contract negotiation", "dispute", "counteroffer", "bargaining", "counter move", "negotiation email"],
  icon: "⚖️",
  categories: ['Career', 'Decisions', 'Money'],
  headerColor: "#d4dde8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Leverage Logic gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the situation below — an excerpt of a longer result, nothing reworded.",
    sampleLabel: "The situation",
    sampleText: "Asking my employer to keep me remote. The company has announced four days in the office from January. I moved 90 minutes away two years ago, with my manager's written agreement that the role was remote-first. My side: The written agreement, and that I am the only person who knows the billing integration. Against that: they are not short of applicants, two colleagues have already agreed to come in, and I cannot actually afford to leave. Their side: They said the raise pool was set in January. Two people left the team this quarter. What I want: Keep two days remote permanently, in writing. I would settle for a six-month trial with a review date rather than a flat no.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "What matters most",
        tone: "yellow",
        items: [
          "Whether your manager has authority to grant an individual exception to the four-day policy. If the policy was set above your manager's level, the written agreement may be a useful reference point but your manager may not be the right — or only — decision-maker.",
          "The content and formality of the written remote-first agreement. The practical weight of your strongest documented fact depends entirely on what the agreement actually says and the level at which it was made.",
          "Whether your employer understands your billing integration knowledge as genuinely difficult to replace. If they do not, the transition-cost argument carries less weight; if they do, it may support a case for accommodation.",
        ],
      },
      {
        label: "The approach",
        tone: "green",
        text: "Present your request as a documented individual exception grounded in the written agreement, framed around continuity of a function the team depends on — not as resistance to the policy itself.",
      },
      {
        label: "Don't give away",
        tone: "red",
        text: "Do not disclose that you cannot afford to leave, because once that is known it removes any implicit pressure that your request might otherwise carry.",
      },
      {
        label: "What to say",
        tone: "green",
        items: [
          "When opening the conversation with your manager. “I want to talk through the January office policy in the context of the arrangement we set up in writing two years ago, when I moved to a location 90 minutes away on the basis that this role was remote-first. I am hoping we can find a path that works.”",
          "When making your specific ask. “What I am asking for is two remote days per week on a permanent basis, in writing. If that is difficult to commit to outright, I would welcome a six-month trial with a review date — I want something we can both point to.”",
        ],
      },
      {
        label: "Trap to avoid",
        tone: "neutral",
        text: "Treating the written agreement as legally enforceable without knowing what it says or what law applies. Reference it as a documented basis for your request and let its existence do the work, without making claims about its legal effect that you cannot establish.",
      },
    ],
  },
  faq: [
    { q: "How do I know how much leverage I have in a negotiation?",
      a: "List what you have that they value and can't easily replace, what they have that you need, and what each side can do if there is no deal. Then separate what is established from what you are assuming — leverage the other side doesn't believe in doesn't count." },
    { q: "Should I tell my employer I can't afford to leave?",
      a: "Generally no. Once they know you have no alternative, a request carries less weight. You don't have to bluff either; just keep the conversation on your case, not your constraints." },
    { q: "How do I ask to keep working remotely?",
      a: "Ask for a specific arrangement in writing, ground it in anything already agreed, frame it around the work rather than objecting to the policy, and have a fallback ready, such as a trial period with a review date." },
    { q: "What kinds of negotiation does Leverage Logic cover?",
      a: "Salary and remote-work requests, freelance rates, vendor prices, lease renewals, purchases and more. It maps where you stand, what's unknown, what to say and what not to give away." },
  ],
  description: "Facing a negotiation? Describe the situation, what you want, and anything you think gives you leverage. Leverage Logic helps you see where each side has room to move, what you may be assuming, and how to make your case without giving away more than you need to.",
  guide: {
      tips: [
        "Fill in their side if you can, even partially — with it blank, the tool will not guess it for you",
        "The amber lines are the point: they mark where a fact stops being worth what you think it is",
        "If a piece of leverage has no established fact under it, it is an assumption wearing a suit",
        "Am I ready? gives you a verdict and what it turns on, not a score"
      ]
    }

},

{
  modified: "",
  id: "JustifyMyMeeting",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A meeting is on the calendar and you are not sure it deserves to be.",
    give: "The invite, or a description of what actually happens. Duration and headcount if you know them.",
    get: "A verdict — keep it, shorten it, fix it, or make it async — with the reasoning, what would change the verdict, and what to send. Then an agenda if it should happen, or the message if it should not.",
    edge: "It weighs whether being in the room at the same time is what the goal actually needs, instead of grading the meeting on vibes.",
  },
  seoDescription: "Should this meeting happen? Get a verdict — keep it, shorten it, fix it, or make it async — with the reasoning, the time it costs, and the message to send. Free.",
  seoTitle: "Should This Be a Meeting?",
  title: "Justify My Meeting",
  tagline: "Is a meeting justified?",
  tags: ['meeting', 'waste time', 'unnecessary', 'decline', 'calendar', 'work'],
  icon: "🕵️",
  categories: ['Work & Meetings'],
  headerColor: "#d4dde8",
  description: "Have a meeting coming up? Paste the invite or describe what happens. Justify My Meeting looks at the goal of the meeting and whether having everyone there at the same time is the best use of everyone’s time. Then it tells you whether to keep it, shorten it, fix it, or replace it with something better.",
  guide: {
    tips: [
      "Describe what actually happens, not what the invite claims — that is where the answer usually lives",
      "Duration and headcount are optional, but supplying them is what makes the time footprint real rather than guessed",
      "'Anything else that matters?' is where context belongs — who is not invited, what was already decided, who is not speaking to whom",
      "A NOT ENOUGH TO TELL verdict is a real answer: it tells you what is missing rather than guessing",
      "Some meetings genuinely earn their hour. A tool that never says 'keep it' would not be worth consulting."
    ],

  }
},

{
  modified: "",
  id: "RecipeChaosSolver",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Mid-cook and something has gone wrong.",
    give: "What you're making, what's going wrong, and what you have on hand. Or run Check Before I Start before you begin.",
    get: "A fix grounded in your actual recipe — or, beforehand, what's missing before you start.",
    edge: "It won't invent quantities your recipe never gave it, or predict a result it can't actually know.",
  },
  seoDescription: "Something going wrong in the kitchen? Get a rescue grounded in your actual recipe, ingredient substitutions, flavor fixes, a pre-cook readiness check, and recipe scaling. Free, no signup.",
  seoTitle: "Ingredient Substitutions",
  title: "Recipe Chaos Solver",
  tagline: "When the recipe stops going according to plan.",
  tags: ['cooking', 'recipe', 'recipe rescue', 'cooking problem', 'cooking mistake', 'ingredient substitution', 'substitute ingredient', 'missing ingredient', 'flavor fix', 'bland food', 'recipe scaling', 'scale recipe', 'kitchen rescue', 'baking substitution', 'fix recipe', 'cooking help', 'dietary needs'],
  icon: "🍳",
  categories: ['Home & Daily Life'],
  headerColor: "#d4dde8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Recipe Chaos Solver gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the problem below — the full result, nothing reworded.",
    sampleLabel: "The problem",
    sampleText: "Out of eggs and buttermilk. Baking a chocolate cake and just realized I'm out of both.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples (Substitute).",
    sections: [
      {
        label: "The plan",
        tone: "green",
        text: "Use a flax egg for binding and structure, and make a quick buttermilk stand-in from whatever milk or milk alternative you have plus an acid — these two substitutes work compatibly and together cover what both originals contribute.",
      },
      {
        label: "Eggs: workable with changes",
        tone: "yellow",
        text: "Mix ground flaxseed with water and let it rest a few minutes until thickened. Use one flax mixture per egg your recipe calls for. Flax egg provides binding when mixed and rested. It won't fully replicate the lift that eggs provide — your leavening agent will need to carry more of that responsibility.",
      },
      {
        label: "Buttermilk: close match",
        tone: "green",
        text: "Take the milk or milk alternative you have on hand. Add an acid — white vinegar or lemon juice — at a ratio of about 1 tablespoon acid per cup of milk. Stir and let sit 5 minutes before using. A milk-and-acid mixture replaces both the liquid volume and acidity that buttermilk contributes. The acidity matters especially because it works with your leavening agent.",
      },
      {
        label: "How the two swaps interact",
        tone: "neutral",
        text: "The flax egg contributes no acidity, so getting the buttermilk substitute right matters more than usual — the acid is what activates your baking soda, if the recipe uses it.",
      },
      {
        label: "What will be different",
        tone: "neutral",
        text: "The main variable is how many eggs your recipe calls for — more eggs mean the flax substitute has more structural work to do. Without knowing the original egg quantity, it's difficult to predict the exact texture change.",
      },
    ],
  },
  faq: [
    { q: "What can I use instead of buttermilk?",
      a: "Stir about 1 tablespoon of lemon juice or white vinegar into 1 cup of milk and let it sit for 5 minutes. Plain yogurt thinned with a little milk also works. The acid matters: it reacts with baking soda to make the cake rise." },
    { q: "What can I substitute for eggs in a cake?",
      a: "A flax egg — 1 tablespoon ground flaxseed mixed with about 3 tablespoons of water and left to thicken — replaces one egg's binding. It gives less lift, so it works best in recipes with one or two eggs." },
    { q: "Can I swap two missing ingredients at once?",
      a: "Yes, but the swaps affect each other. Recipe Chaos Solver checks the combination, for example making sure the acid that buttermilk provided is still there to react with the leavening." },
    { q: "What else does Recipe Chaos Solver do?",
      a: "It rescues a dish that went wrong partway through, scales a recipe up or down without breaking it, and checks you have what you need before you start." },
  ],
  description: "Something going wrong in the kitchen? Tell us what you're making, what happened, and what you have on hand. Recipe Chaos Solver helps you recover the dish, replace missing ingredients, fix the flavor, check a recipe before you start, or scale it without creating a new problem.",
  guide: {
    tips: [
      "Upload a photo of your recipe, your pantry, or the dish itself — Rescue reads what it can clearly make out from any of them",
      "Substitute handles one missing ingredient or several at once — list them all together so it can account for how the substitutions interact",
      "Fix the Flavor works best when you can say more than 'it's off' — but if that's all you've got, it'll ask a narrowing question first",
      "Check Before I Start won't invent a 'realistic cooking time' from a recipe it wasn't given enough to judge — if you want the full prep and timing workflow, it'll point you to Mise en Place",
      "Recent keeps a running log across every mode — View shows the original result again, Use Again restores your inputs so you can adjust and rerun"
    ],

  }
},

{
  modified: "",
  id: "BillRescue",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A bill arrives that's wrong, larger than it should be, or already late.",
    give: "What kind of bill, how much, and how far behind you are.",
    get: "Where you stand, one thing to do today, and the words to say when you do it.",
    edge: "It answers the question you actually have — am I in trouble — before it hands you anything to read. Then one job for today, and nothing else until that's done.",
  },
  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    { q: "Can you actually negotiate bills?",
      a: "Yes — far more than most people try. Medical bills, telecom and internet plans, insurance premiums, and many fees have negotiation room built in: retention offers, hardship programs, prompt-pay discounts, and billing-error corrections. Bill Rescue analyzes your specific bill and generates the scripts and escalation path for it." },
    { q: "How do I negotiate a medical bill?",
      a: "Request an itemized bill first (errors are common and give leverage), then ask about financial assistance and prompt-pay discounts — many providers offer meaningful reductions to patients who ask before collections. If you're uninsured or under-insured, ask for their self-pay rate. Every one of these is a normal request billing departments handle daily." },
    { q: "What do I say to lower my internet or phone bill?",
      a: "Call retention (say 'cancel service' at the menu to get routed there), name a competitor's current offer, and ask directly: 'what can you do to keep me?' Retention agents have discounts front-line support can't see. The tool scripts the call, including responses to the first two rebuttals." },
    { q: "What if I genuinely can't afford to pay a bill?",
      a: "Say so before it goes to collections — hardship programs, payment plans, and charity-care policies exist at most utilities, hospitals, and lenders, but almost all of them require you to ask. A documented payment arrangement also protects your credit in most systems. The tool helps you word the hardship request plainly and without shame." },
    { q: "Does bill negotiation work outside the US?",
      a: "The scripts adapt — negotiation culture and consumer rights differ by country, and the tool factors your location in. Medical billing negotiation is largely a US phenomenon, but telecom retention offers, fee waivers, and hardship programs are near-universal." },
  ],
  seoDescription: "Turn bill anxiety into a clear plan. Negotiation scripts, ready-to-send dispute letters, and a call rehearsal to lower medical and overdue bills. Free.",
  seoTitle: "Medical Bill Negotiation Help",
  title: "Bill Rescue",
  tagline: "A bill isn't a verdict. It's a puzzle to solve.",
  tags: ['bill', 'medical bill', 'negotiate', 'reduce', 'lower', 'financial', 'debt', 'collections', 'late fee', 'overdue', 'dispute', 'hardship', 'credit', 'waive', 'fight', 'utilities', 'medical', 'rent', 'insurance', 'phone', 'scripts', 'letters'],
  icon: "🧾",
  categories: ['Conversations', 'Home & Daily Life', 'Money'],
  headerColor: "#c0d8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what Bill Rescue gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the bill below — an excerpt of a long result, nothing reworded.",
    sampleLabel: "The bill",
    sampleText: "Medical bill, $2,400, 60 days overdue. Emergency room visit for a kidney stone. Insurance covered most but I owe the deductible. Can't afford it, and don't understand it.",
    context: "Real run, 2026-10-07 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "Serious, but you're still early",
        tone: "yellow",
        items: [
          "Your credit is not at risk yet — medical debt under a year old cannot be reported.",
          "You are still dealing with the original provider, not a collector.",
          "The billed amount is likely not the final amount you owe.",
        ],
      },
      {
        label: "Today's job: request your itemized bill",
        tone: "green",
        items: [
          "Hospital bills routinely contain duplicate charges, incorrect codes, and inflated facility fees — you cannot negotiate or apply for help against a number you haven't verified.",
          "What to say: 'Hi, I received a bill for an emergency room visit and I need a complete itemized bill — every charge listed with its CPT code. My account number is [your account number]. Can you mail or email that to me? I won't be discussing payment until I have reviewed it.'",
        ],
      },
      {
        label: "The order that protects you",
        tone: "neutral",
        items: [
          "Request the itemized bill today.",
          "Apply for financial assistance this week.",
          "Negotiate only after both are done.",
          "Not today: Don't make any payment today.",
          "Not today: Don't discuss what you can afford.",
          "Not today: Don't ignore the bill entirely.",
        ],
      },
      {
        label: "What they won't tell you",
        tone: "neutral",
        items: [
          "Emergency room bills often arrive as two separate charges: one from the hospital (facility fee) and one from the ER physician group (a separate company). Make sure you know whether this $2,400 is one bill or two, and whether separate negotiation is needed.",
          "Charity care can be applied retroactively. If you qualify, the hospital can zero out or reduce a bill that already exists — you do not have to have applied before the visit.",
        ],
      },
      {
        label: "Your rights",
        tone: "neutral",
        items: [
          "Nonprofit hospital charity care obligation: If the hospital is a nonprofit (most are), it is required by federal tax law under IRS 501(r) to maintain a financial assistance program and to screen patients for eligibility. Say: 'I would like to apply for your financial assistance program.' They cannot legally deny you an application.",
        ],
      },
      {
        label: "If nothing is done",
        tone: "neutral",
        items: [
          "If nothing is done, the hospital may transfer the $2,400 to a collections agency, typically after 90-180 days. At that point it could appear on your credit report and remain there up to 7 years, lowering your score. For a balance this size, wage garnishment is possible but requires the collector to sue you and win a judgment first — a process that takes time and is not guaranteed. State debt collection statutes of limitations vary, but most run 3-6 years from the date of last activity.",
          "A collections entry for medical debt, while genuinely frustrating, is one of the most commonly negotiated items on a credit report — and the hospital can still accept payment or a settlement even after sending it to collections. You have not missed the window to fix this; you are still in the easiest phase of the process.",
        ],
      },
    ],
    disclaimer: "General information, not legal or financial advice. Credit-reporting and debt rules change; check the current rules where you live.",
  },
  description: "That envelope, email, or collection notice doesn't have to ruin your week. Tell DeftBrain what's happening, and we'll help you turn an intimidating bill into a practical, step-by-step plan for understanding the bill, protecting your rights, reducing what you owe, and deciding what to do next.",
  guide: {
    tips: [
      "Start with Quick Check for any charge you're unsure about — it takes 5 seconds",
      "Use Rehearsal on Hard Mode before big calls — if you can handle the worst-case rep, the real one feels easy",
      "Save your plan BEFORE making the call so you can reference scripts during the conversation",
      "Log victories immediately — watching your savings total grow builds the habit",
      "The Letters tab covers 7 types — most people don't know they can request a goodwill adjustment to fix their credit"
    ],
    beforeYouGo: "If a collector has the bill, don't pay or agree the debt is yours until they've validated it in writing. On an old debt, even a small payment can restart the time limit for collecting it.",

  },
  crossRefs: ['MoneyDiplomat', 'ChaosPilot'],
},

{
  modified: "",
  id: "Mend",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You've done something and don't know how big the apology should be.",
    give: "What happened and your relationship to the person.",
    get: "The actual harm versus your actual responsibility, and an apology sized to it.",
    edge: "It corrects in both directions — over-apologizing for nothing and under-apologizing for something are the same failure to calibrate.",
  },
  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    { q: "How do I apologize sincerely without making it worse?",
      a: "A sincere apology names what you did, acknowledges the impact on them, takes responsibility without 'but', and states what changes. What makes it worse: explaining your intentions at length, apologizing for their feelings ('sorry you were upset'), or over-apologizing until they must comfort you. Mend drafts the apology matched to what happened and who it's for." },
    { q: "What's the difference between an apology and an explanation?",
      a: "An apology centers the other person's experience; an explanation centers your reasoning. Both have a place — but an explanation delivered before responsibility reads as an excuse. The strongest structure is responsibility first, brief context second (only if they ask), repair last." },
    { q: "How do I apologize at work professionally?",
      a: "Workplace apologies need calibration: enough ownership to rebuild trust, without the self-flagellation that damages your standing. Name the miss, its impact on the team or deadline, and your prevention plan — in about three sentences. The tool has a work mode that keeps the register professional rather than emotional." },
    { q: "Can you over-apologize? How much is too much?",
      a: "Yes — repeated apologies for the same offense shift the burden to the other person to reassure you, which quietly makes your apology about you. One calibrated apology, then changed behavior, outperforms five escalating ones. If you tend to over-apologize, the calibration output shows you what 'enough' looks like." },
    { q: "What if my apology isn't accepted?",
      a: "Acceptance is theirs to give, on their timeline — an apology is complete when it's delivered sincerely, not when it's accepted. Pushing for immediate forgiveness reopens the offense. Say it once, mean it, give space, and let the changed behavior argue for you." },
  ],
  seoDescription: "Match your apology to the actual harm caused. Find out what this really needs, what to say, what makes it worse, and one thing to do today. Free, no signup.",
  seoTitle: "Apology Message Writer — Mend",
  title: "Mend",
  tagline: "Match your apology to the actual harm caused",
  tags: ['sorry', 'apology', 'apologize', 'mistake', 'forgiveness', 'conflict', 'over-apologizing', 'repair', 'relationship', 'accountability', 'letter', 'cultural', 'communication'],
  icon: "⚖️",
  categories: ['Conversations', 'Relationships'],
  headerColor: "#e0b8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "Discovered – not indexed" page real substance.
  exampleOutput: {
    title: "See what Mend gives you",
    expandLabel: "See the full real example ↓",
    intro: "Real output from an actual run on the situation below. Most of the result is shown; nothing is reworded.",
    sampleLabel: "What happened",
    sampleText: "I missed my best friend's birthday dinner. I knew the date for weeks. I'd been working long hours and let myself get sucked into a Friday-evening fire drill at work; by the time I looked up it was 9pm and dinner was over. I texted with apologies, but my friend's reply was short. We haven't talked in five days. (Best friend of 12 years. They were turning 40, invited only 8 people, and I was supposed to give a toast. It wasn't the first time I've prioritized work this year.)",
    context: "Real run, 2026-10-07 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "Level 3: This needs repair, not just words.",
        tone: "red",
        text: "Your friendship isn't broken — twelve years of showing up doesn't dissolve in one night. But this wasn't just a missed dinner; you missed a toast you promised at a milestone they built around eight people. The silence tells you they're not brushing it off, and that's actually useful — it means they still care enough to feel it.",
      },
      {
        label: "Today's job: Ask for a real conversation.",
        tone: "green",
        items: [
          "Everything else — explaining, apologizing, promising — needs to happen out loud, not in a thread where they read it alone and you can't hear each other.",
          "Not yet: No more apology texts.",
          "Not yet: Not a long explanation message.",
          "Not yet: No gifts or gestures yet.",
        ],
      },
      {
        label: "Why it landed the way it did",
        tone: "neutral",
        items: [
          "Missing the dinner confirmed a pattern they'd already named. Two conversations where they gently said 'I feel you slipping' made this birthday the test case — and the result felt like an answer.",
          "The toast made it personal, not just logistical. You weren't just a guest they could seat someone else in for; you were supposed to stand up and say something true about them in front of everyone they love.",
          "A 9pm text after dinner ended is the floor, not a credit. It was the right instinct, but it landed after the moment was already gone, which meant it read more like damage control than real remorse.",
          "Turning 40 with only eight people means every seat is a statement. The smallness of that list is what made your absence so visible — there was no crowd to absorb it.",
        ],
      },
      {
        label: "Words to use",
        tone: "green",
        items: [
          "“I don't want to do this over text anymore — can we talk, either on the phone or in person, whenever you're ready?” — Send this today as your one message — it's not an apology, it's an open door.",
          "“I missed one of the most important nights of your year, and I missed it because I let the wrong thing win. I'm so sorry, and I want to say that properly — not in a message.” — For the actual conversation when you're face to face or on the phone.",
          "“I know a toast I never gave doesn't come back. I want to make sure you know what I would have said, and I want to say it to you directly.” — If they agree to talk and you want to honor what was specifically lost.",
        ],
      },
      {
        label: "What not to say",
        tone: "red",
        items: [
          "“You know how insane work has been — I honestly lost track of time.” — They've already heard the work explanation twice this year; leading with it again makes the apology about your circumstances instead of their hurt.",
          "“I texted you as soon as I realized.” — Framing the 9pm text as quick action makes it sound like you want credit, when the reality is dinner was already over.",
          "“I feel terrible — I've barely slept over this.” — Your guilt is real, but centering it puts them in the position of managing your feelings instead of being heard.",
          "“I know you're probably still upset, but...” — The 'but' erases whatever came before it, and 'probably' minimizes what the five-day silence is already telling you.",
        ],
      },
      {
        label: "The roadmap",
        tone: "neutral",
        items: [
          "Today: Send the one short message asking to talk.",
          "During the conversation: Name the pattern, not just the night.",
          "During the conversation: Say what the toast would have been.",
          "During the conversation: Let them respond without jumping to fix it.",
          "During the conversation: Propose one specific, concrete change.",
          "Afterward: Follow through on that change visibly.",
        ],
      },
    ],
  },
  description: "Not every mistake needs the same apology, and getting the size wrong in either direction makes it worse. Describe what happened and you'll find out what this actually needs — the words to say, the ones that make it worse, and one thing to do today. It corrects over-apologizing as readily as under-apologizing.",
  guide: {
    tips: [
      "Small misses are far more common than people think — most interactions don't need an apology at all",
      "Templates scale to relationship (different wording for boss vs close friend)",
      "The 'what NOT to say' section prevents common apology mistakes",
      "Over-apologizing trains people to expect apologies for normal interactions",
      "Under-apologizing (level 3 when you need 4-5) damages relationships"
    ],
    
  }
},

{
  modified: "",
  id: "MicroAdventureMapper",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You have a free hour or two and no plan for it.",
    give: "Where you are, how long you have, what sounds good, and how you are getting around.",
    get: "A small local outing built around those constraints — a few stops, a route, and what to check before you leave.",
    edge: "It names the type of place to look for rather than inventing a venue it cannot currently see, so the plan survives a closed door.",
  },
  seoDescription: "Got a free hour? Get a small local outing built around your time, budget, transport and interests — with what to check before you go. Free, no signup.",
  seoTitle: "Cheap Micro-Adventures",
  title: "Micro-Adventure Mapper",
  tagline: "Turn a free hour into a small adventure",
  tags: ['bored', 'adventure', 'explore', 'fun', 'weekend', 'activity'],
  icon: "🗺️",
  categories: ['Just for Fun', 'Travel & Events'],
  headerColor: "#ccdfc4",
  description: "Got an hour or two and want to do something different? Tell us where you are, how much time you have, what sounds good, and how you're getting around. Micro-Adventure Mapper builds a small local outing that fits the time, budget, and constraints you actually have.",
  guide: {
    tips: [
      "Specific itineraries remove 'I don't know what to do' barrier",
      "Most micro-adventures are free or nearly free - cost isn't a barrier",
      "2-3 hours is perfect for maintaining novelty without exhaustion",
      "Photography theme works anywhere - transforms familiar into exploration",
      "The 'pro tip' section adds insider knowledge that makes it feel special"
    ],
    
  }
},
{
  modified: "2026-03-10",
  id: "DateNight",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "'I dunno, what do you want to do?'",
    give: "Your budget, the vibe, and where you are.",
    get: "A full evening with a timeline, per-stop costs, and a buffer so you don't overshoot.",
    edge: "It plans to a hard budget with the buffer built in, so the plan survives contact with the bill.",
  },
  seoDescription: "Get a complete date night itinerary on your budget, anywhere in the world. Free plan for every stop — timing, costs, a buffer, and a backup. No signup.",
  seoTitle: "Date Night Planner with Budget Itinerary",
  title: "Date Night",
  tagline: "Plan an evening that feels special—without spending hours figuring it out.",
  tags: ['date', 'date night', 'couples', 'relationship', 'romantic', 'activity', 'itinerary', 'anniversary', 'first date', 'budget'],
  icon: "💘",
  categories: ['Money', 'Relationships', 'Travel & Events'],
  headerColor: "#ccdfc4",
  description: "Tell DeftBrain where you are, what you want to spend, and what kind of night you're hoping for. You'll get a complete plan—including where to go, when to go, what it should cost, and what to do if plans change.",
  guide: {
    tips: [
      "First date? We'll favour places where conversation comes easily and you can comfortably wrap things up.",
      "Staying in? We'll account for delivery fees and tips.",
      "Don't want a repeat? Tell us what you did last time.",
      "Want a different feel? Choose more relaxed, more romantic or more adventurous and reimagine the evening — no need to start over."
    ],
    beforeYouGo: "Hours, prices and availability can change. Confirm the details and make reservations where needed.",
  }
},
{
  modified: "2026-03-10",
  id: "ChaosPilot",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Several things are competing for your attention and you can't tell what to start with.",
    give: "Your tasks, and a timeframe — today, this week, or a few weeks out.",
    get: "An order to work in, what the supplied facts don't show a need to rush, and the one missing detail that would change it.",
    edge: "It ranks only from what you supply — deadlines, consequences, who is waiting — and puts a task in 'need one fact' rather than inventing a reason to move it.",
  },
  seoDescription: "Put a crowded task list in a defensible order using the deadlines, consequences and dependencies you actually have — and see the one missing fact that would change it. Free.",
  seoTitle: "Task Triage: What's Urgent?",
  title: "Chaos Pilot",
  tagline: "Figure out what matters now — and what can wait",
  tags: ['crisis', 'prioritize', 'task triage', 'urgent tasks', 'what to do first', 'overwhelmed', 'too much to do', 'tasks', 'deadlines', 'consequences', 'dependencies', 'people waiting', 'limited time', 'low energy', 'brain dump', 'just one thing', 'task breakdown', 'time blocking', 'delegation', 're-prioritize'],
  icon: "🚨",
  categories: ['Health & Wellness', 'Tasks'],
  headerColor: "#d4dde8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what Chaos Pilot gives you",
    expandLabel: "See the full real example ↓",
    intro: "Real output from an actual run on the list below, unedited.",
    sampleLabel: "The list",
    sampleText: "Send the Q3 numbers to Dana (by Friday, Dana is waiting) · Reply to the landlord about the lease renewal (landlord waiting) · Renew the car registration · Book a dentist appointment. About 2 hours, low energy. Two of these have been on the list for a fortnight.",
    context: "Real run, 2026-10-07 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "The headline",
        tone: "neutral",
        text: "One task has a supplied deadline and a named person waiting by Friday; that is the clearest time-sensitive signal in the supplied information.",
      },
      {
        label: "Do first",
        tone: "red",
        items: [
          "Send the Q3 numbers to Dana — Supplied deadline is Friday; Dana is supplied as waiting. Next step: Assemble or locate the Q3 figures and draft the message to Dana.",
        ],
      },
      {
        label: "Do next",
        tone: "yellow",
        items: [
          "Reply to the landlord about the lease renewal — A named person is waiting. No deadline was supplied, but a lease renewal is the kind of correspondence where delay may affect the landlord's ability to act. It follows the Dana task in that it is a reply owed to someone rather than a self-contained errand.",
        ],
      },
      {
        label: "Can probably wait",
        tone: "green",
        items: [
          "Book a dentist appointment — No deadline, no person waiting, and no consequence of delay was supplied. The supplied information does not establish that this must happen sooner.",
        ],
      },
      {
        label: "One fact would change the order",
        tone: "neutral",
        items: [
          "Renew the car registration: When does the current registration expire, or is it already expired? If the expiry date is at or before Friday, this task would compete with the Dana task for the first slot. If it is further out, it likely belongs in do_next or can_probably_wait.",
        ],
      },
      {
        label: "Does it fit in the time you have?",
        tone: "neutral",
        text: "With low energy and roughly two hours, completing the Dana task and a landlord reply is plausible if the Q3 numbers are already assembled. If the numbers still need significant work, two hours may be tight for both. The car registration fact is also unresolved and could add to the load.",
      },
    ],
  },
  faq: [
    { q: "How do I decide what to do first when everything feels urgent?",
      a: "Look at what you actually know: real deadlines, who's waiting, and what happens if it slips. Chaos Pilot orders your list on exactly those facts, says why each task sits where it does, and gives a first step for the top one — the real example on this page shows a four-item list sorted that way." },
    { q: "What if I don't know a deadline?",
      a: "It doesn't guess. When one missing fact would change the order — like when a registration expires — it asks for that fact and explains how the answer would move the task." },
    { q: "Can I just paste my whole messy list?",
      a: "Yes. Paste everything at once and it pulls out the tasks, deadlines and who's waiting before sorting them." },
    { q: "What if I'm too overwhelmed to read a full plan?",
      a: "Use “Just One Thing”: it returns a single task and the very first action to take, nothing more." },
    { q: "Does it consider how much energy I have?",
      a: "Yes — tell it your energy and roughly how much time you have, and it says whether the top tasks realistically fit and what to drop if they don't." },
  ],
  description: "Everything feels urgent at once, and it's hard to trust your own read on what actually needs you first. Chaos Pilot works only from what you know — deadlines, consequences, who's waiting — to put your tasks in a defensible order. When a missing fact would change that order, it says so instead of guessing.",
  guide: {
    tips: [
      "The 'Just One Thing' panic button is there for your worst moments — it cuts through everything and gives you one clear action",
      "Paste-it-all-in mode works great when you can't even organize your thoughts into a list",
      "Use the voice selector to match what you need — Gentle when fragile, Tough Love when you need a push",
      "After 3+ sessions, check Pattern Analysis to see if you consistently overrate urgency in certain areas",
      "The Dashboard tracks your triage history — most people discover 60-70% of their 'urgent' tasks could always wait",
      "Task splitting (🧩) is powerful for tasks that feel huge — they're usually 3-5 smaller tasks in disguise"
    ],
  }
},

{
  modified: "",
  id: "VirtualBodyDouble",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A task you'd do fine with someone else in the room.",
    give: "Your task and a session mode. It can split the task for you.",
    get: "A working session with check-ins, in a personality you picked.",
    edge: "It recreates body doubling — the reason coffee shops and libraries work — without needing anyone to be there.",
  },
  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    { q: "What is body doubling?",
      a: "Body doubling is working alongside another person whose presence keeps you anchored to the task — not helping, not supervising, just there. It's one of the most consistently reported focus strategies in the ADHD community, and it works for plenty of neurotypical brains too. Virtual Body Double simulates that presence digitally: a companion that checks in, notices when you stall, and celebrates when you finish." },
    { q: "Does body doubling really work for ADHD?",
      a: "Many people with ADHD report it's the difference between starting and not starting — external presence supplies the activation and accountability that executive function isn't providing. It's a strategy, not a treatment; but it's free to try, low-stakes, and you'll know within one session whether your brain responds to it." },
    { q: "How does a virtual body double work?",
      a: "You tell it what you're working on, how long, and how you're feeling; it builds the session — an opening nudge to start, check-ins at your chosen rhythm, ambient encouragement, help when you're stuck, and a proper wrap-up. It runs in a tab beside your work. No camera, no other humans, no scheduling." },
    { q: "Which session mode should I pick?",
      a: "Deep Work for near-silent library presence, Sprint for short intense bursts, Long Haul for boring repetitive tasks (steady company, no fake enthusiasm), Creative for non-linear work where wandering is part of the process, and Avoidance Buster when the task is the one you've been dreading — extra-gentle, extra-small first steps." },
    { q: "What if I get stuck mid-session?",
      a: "Hit the stuck button and it triages: diagnoses why you stalled (unclear next step, energy crash, task too big), gives you a literal next physical action, and offers micro-steps or a productive pivot. Getting unstuck without abandoning the session is most of the value." },
  ],
  seoDescription: "Focus better with a coworking partner that stays with you, checks in, and helps you get unstuck. Pick from 6 modes. Free body double, instant, no signup.",
  seoTitle: "Virtual Body Double: Focus & Coworking Sessions",
  title: "Virtual Body Double",
  tagline: "Work together. Even when you're working alone.",
  tags: ['focus', 'productivity', 'body double', 'accountability', 'cowork', 'solo tasks'],
  icon: "👥",
  categories: ['Health & Wellness', 'Tasks', 'Work & Meetings'],
  headerColor: "#b8dcd8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what Virtual Body Double gives you",
    expandLabel: "See the full real example ↓",
    intro: "Real output from an actual session start on the task below, unedited.",
    sampleLabel: "The task",
    sampleText: "Finish writing the first draft of my performance self-review — I keep starting and stopping and it's due tomorrow. Mood: avoidant, low motivation. Goal: a complete first draft, even if rough.",
    context: "Real run, 2026-10-07 — 25 minutes, check-ins every 15, home office. One of the tool's own built-in examples.",
    sections: [
      {
        label: "Your companion: Ren (steady, low-key)",
        tone: "green",
        items: [
          "Alright, I'm here with you. Let's get this thing out of your head and onto the page.",
          "First step: Type one sentence — anything you shipped, fixed, or showed up for this year, even if it feels too small to matter.",
          "Before you start: Flip the phone face-down and slide it to the edge of the desk.",
        ],
      },
      {
        label: "Quiet messages during the session",
        tone: "neutral",
        items: [
          "Still here with you.",
          "You're doing it.",
          "Draft, not final. Keep going.",
          "Ugly words still count.",
          "One more line.",
          "Almost there, seriously.",
        ],
      },
      {
        label: "A break",
        tone: "neutral",
        text: "Around the 20-minute mark, 5 min: Step away from the screen, get some water, and look out a window for a minute.",
      },
      {
        label: "When the timer ends",
        tone: "green",
        items: [
          "You have a draft — that's the whole game, and you did it.",
          "What's one thing in there you actually feel okay about, even a little?",
        ],
      },
    ],
  },
  description: "Working alone is hard. Working near someone else is easier. That's body doubling — the focus effect of another person's presence. This tool simulates it with an AI companion who checks in, cheers you on, and stays with you until the timer ends. Say what you're working on, pick a companion, and you're not alone anymore.",
  guide: {
    tips: [
      "Match the mode to the task: Deep Work for writing, Sprint for email blitzes, Long Haul for data entry, Creative for brainstorming, Avoidance Buster for that thing you keep putting off",
      "The accountability card is designed for screenshots — use it to build social momentum",
      "25-45 minute sessions tend to work better than marathons. Start short, extend if you're in flow.",
      "Invite a real friend to cowork using the built-in message generator"
    ],

  }
},

{
  modified: "",
  id: "WaitingModeLiberator",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Something's happening later and the whole day is frozen around it.",
    give: "Your events with times, prep and travel. Your energy level.",
    get: "The actual free windows and what fits in each.",
    edge: "It does the arithmetic you're avoiding. 'I have stuff later' usually means three usable hours you can't see.",
  },
  seoDescription: "Stop letting 'I have a thing later' freeze your whole day. Map the free windows around your appointments and match tasks to your energy. Free, no signup.",
  seoTitle: "Beat Waiting Mode",
  title: "Waiting Mode Liberator",
  tagline: "Break free when upcoming events freeze your day",
  tags: ['waiting mode', 'appointments', 'time block', 'freeze', 'productivity', 'energy'],
  icon: "⏳",
  categories: ['Health & Wellness', 'Tasks'],
  headerColor: "#b8dcd8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what Waiting Mode Liberator gives you",
    expandLabel: "See the full real example ↓",
    intro: "Real output from an actual run on the day below. Most of the result is shown; nothing is reworded.",
    sampleLabel: "The day ahead",
    sampleText: "Tomorrow: annual physical at 2:30 PM, second-round video interview at 4:00 PM. To do: respond to 3 emails I've been avoiding, prep questions for the interview, take the dog for a real walk, drink water (I keep forgetting). Also meant to call mom back from yesterday.",
    context: "Real run, 2026-10-07 — energy: 3 of 5; anxiety: 6 of 10. One of the tool's own built-in examples.",
    sections: [
      {
        label: "How much time you actually have",
        tone: "green",
        text: "You have a wide open today, then tomorrow morning until 1:55 PM — roughly eight and a half hours of actual free time across the two days.",
      },
      {
        label: "Permission",
        tone: "green",
        text: "Every task on your list fits somewhere in the next two days with time left over, and both alarms are already set.",
      },
      {
        label: "Your free windows",
        tone: "neutral",
        items: [
          "Today (Wide open): Call mom back — you've got room for a real conversation, not a rushed one; Take the dog for the walk; Knock out one or two of the emails you've been avoiding; Nothing. Leaving today unscheduled is a real option.",
          "Appointment morning (Until 1:55 PM): Finish any remaining emails; Write out your questions for the interview; Drink some water; Nothing. The morning before an appointment is yours until the alarm fires.",
          "Between appointments (30 minutes): Glance over your interview questions; Drink some water; Nothing — 30 minutes is short enough to just sit.",
        ],
      },
      {
        label: "Alarms that do the remembering",
        tone: "neutral",
        items: [
          "Tomorrow, 2:30 PM — alarm at 1:55 PM: Alarm fires at 1:55 PM — this is your cue to shift gears The 35 minutes after it are yours for getting ready and getting there Bring anything you know you'll need (insurance card, ID, or anything else you'd typically take)",
          "Tomorrow, 4:00 PM — alarm at 3:30 PM: Alarm fires at 3:30 PM — find a quiet spot if you need one Pull up your interview questions for a quick scan The 30 minutes after the alarm are yours to get ready and settled for the call",
        ],
      },
      {
        label: "Why it helps",
        tone: "neutral",
        text: "Two appointments can hover over a whole day like browser tabs that won't close — setting the alarms hands that job to something else so the hours in between are actually yours.",
      },
    ],
  },
  faq: [
    { q: "What is waiting mode?",
      a: "The frozen feeling of having an appointment later in the day: you can't start anything because “I have a thing at 2,” so the hours before it disappear. It's common, and especially familiar to people with ADHD." },
    { q: "How do I get things done before an appointment?",
      a: "Find out how much time you really have, set an alarm for when you need to start getting ready, and stop tracking the clock until it goes off. Waiting Mode Liberator does that math and sorts your to-do list into the free windows, as the real example on this page shows." },
    { q: "Does it set the alarm for me?",
      a: "It works out when each alarm should go off — the appointment time minus your prep and travel time — and counts down to the first one while the page is open. Setting a phone alarm for that time is the reliable backup." },
    { q: "What if my energy is low?",
      a: "You rate your energy first, and the suggestions match it: on a low day it offers small, easy blocks — and “nothing” is always a valid option." },
    { q: "Can it handle two appointments in a day?",
      a: "Yes — it finds the gaps between them, including short ones, and gives each appointment its own prep alarm." },
  ],
  description: "Got a thing later and can't start anything? That frozen feeling is real. This tool shows you how much free time you actually have, helps you decide what to do with it, and lets you stop thinking about the appointment until it's time.",
  guide: {
    tips: [
      "'Start With Me' is the most important button. The gap between seeing the plan and doing the plan is where most tools fail — this one walks you across it.",
      "Always do the debrief, even if you skip the blocks. The anxiety data compounds fast.",
      "Be honest about energy. The tool adjusts. Lying to yourself gives you a plan you can't execute.",
      "After 3+ debriefs for the same appointment type, check Patterns — the anxiety trend is eye-opening."
    ],

  }
},

{
  modified: "",
  id: "BrainDumpBuddy",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Head full, everything blurring together.",
    give: "All of it, unsorted. Type, rapid-fire, or talk.",
    get: "Sorted into buckets, with one clear next step.",
    edge: "It ends with a single next action rather than a tidy list — the list is what you already had.",
  },
  seoDescription: "Dump everything on your mind and sort it into what needs action, what needs a decision, what can wait, and what requires nothing from you. Find one manageable next step.",
  seoTitle: "Brain Dump Organizer",
  title: "Brain Dump Buddy",
  tagline: "Everything in your head → one clear next step",
  tags: ['brain dump', 'overwhelm', 'organize thoughts', 'clarity', 'tasks', 'next step', 'anxiety', 'racing thoughts', 'stressed', 'too much to do', 'prioritize', 'clear head', 'task sorting', 'worry', 'chaos', '3am thoughts', 'can\'t focus', 'voice input', 'emergency mode', 'to-do list', 'mental load', 'structure thoughts', 'productive'],
  icon: "🧠",
  categories: ['Health & Wellness', 'Self & Reflection', 'Tasks'],
  headerColor: "#e0b8b8",
  description: "When everything in your head feels like one big pile, put it here exactly as it comes. Brain Dump Buddy sorts out what needs action, what needs a decision, what can wait, and what doesn't require anything from you—then helps you find a manageable next step.",
  guide: {
    tips: [
      "Voice mode is best when your hands are shaking or thoughts are racing fastest.",
      "Emergency mode isn't failure — it's the right tool for acute overwhelm.",
      "Shrink the List after every dump. Most people's lists can lose 30-50% of items.",
      "The inflation ratio in Patterns is the big insight: most brains inflate to-do lists by 3-5x.",
      "Reclassify freely — the AI's first sort is a starting point, not gospel."
    ],

  },
  // ChaosPilot appeared twice here before the 2026-09-19 rename (see
  // audit/RENAMES.md) — once correctly, as the old CrisisPrioritizer, and
  // once under its own old (mislabeled) name with near-identical reasoning
  // ("For urgent situations where you need to decide what to do right now").
  // Both pointed at the same real tool once the rename landed; merged into
  // the one entry below rather than listing ChaosPilot as its own related
  // tool twice.
  crossRefs: [
    { id: 'ChaosPilot', reason: 'When you\'re completely overwhelmed — cuts to the 3 things that matter most right now' },
    { id: 'VirtualBodyDouble', reason: 'Once you know what to do, need someone to work beside you and keep you on track' },
    { id: 'WaitingModeLiberator', reason: 'When many worries are about things blocked waiting on others' },
  ]
},

{
  modified: "2026-03-11",
  id: "GentlePushGenerator",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You want to grow and every motivational thing makes it worse.",
    give: "Your comfort zone and where you want to expand.",
    get: "A challenge sized to today's capacity — achievable, slightly scary.",
    edge: "Attempting counts as success. It's built so a bad day doesn't become a failure.",
  },
  seoDescription: "Get a free micro-challenge sized to your real capacity — achievable but slightly scary. Grow at the edge of your comfort zone without pressure or burnout.",
  seoTitle: "Comfort Zone Challenges",
  title: "Gentle Push Generator",
  tagline: "Micro-challenges just outside your comfort zone",
  tags: ["comfort zone", "comfort zone challenge", "small challenge", "micro challenge", "small step", "try something new", "do something uncomfortable", "push myself", "build confidence", "fear of trying", "personal growth", "gentle challenge", "get out of comfort zone", "one small step", "low pressure challenge", "challenge sized to capacity", "slightly uncomfortable"],
  icon: "🫸",
  categories: ['Health & Wellness', 'Self & Reflection'],
  headerColor: "#ccdfc4",
  description: "Turn something you'd like to get better at into a small, doable challenge just beyond what's comfortable today. No pep talks, no pressure—the attempt counts.",
  guide: {
    tips: [
      "Actually attempt the challenge if you can - reading about it isn't growth",
      "Use the 'if too much' alternative without guilt - it's there for a reason",
      "Celebrate the attempt even if it went badly - you did the scary thing",
      "Current capacity matters - don't force growth during crisis/low periods",
      "Multiple small pushes compound better than one giant leap"
    ],
    
  }
},

{
  modified: "",
  id: "BrainStateDeejay",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You need to get from the state you're in to the one you need.",
    give: "Where you are now and where you want to be.",
    get: "A phased listening plan for moving from your current state toward the one you need.",
    edge: "It treats changing state as a transition, with different sound profiles for the beginning, middle and sustained phase.",
  },
  seoDescription: "Tell DeftBrain how you feel now and where you need to get. Get a phased listening plan with sound profiles and music-service search terms. Free, no signup.",
  seoTitle: "Focus Music Planner",
  title: "Brain State Deejay",
  tagline: "Music that moves you from where you are to where you need to be.",
  tags: ["music", "focus music", "mood music", "listening plan", "study music", "work music", "calm music", "energy", "unwind", "winding down", "ambient", "lofi", "instrumental", "concentration", "creative work", "brain fog", "restless", "scattered", "overwhelmed", "music search"],
  icon: "🎧",
  categories: ['Health & Wellness', 'Self & Reflection'],
  headerColor: "#b8dcd8",
  description: "Changing mental state is a transition, not a switch. Tell us where your head is now and where it needs to be, and we’ll lay out a listening plan in phases — what each one should sound like, and search terms you can use in your music service.",
  guide: {
    tips: [
      "Treat the first plan as a starting point; your own response to the music matters more than the label on a phase",
      "If a phase is distracting, simplify it rather than forcing yourself through it",
      "If the plan is making you sleepy when you need energy, try a clearer beat or a little more movement",
      "Remember what works for a particular state and task so future plans can start closer to your preferences"
    ]
  }
},

{
  modified: "2026-09-14",
  id: "VelvetHammer",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You've drafted something you shouldn't send.",
    give: "The angry version, unfiltered. Your relationship to the recipient helps.",
    get: "The point, recovered — plus three sendable versions of it.",
    edge: "The complaint survives the rewrite. It removes the heat, not the history.",
  },
  // 2026-09-14: rewrite. "Collaborative" instructed the model to assume
  // good intent — a stance the user never expressed. The old output also
  // invented increasingly serious facts as it got firmer (internal
  // sign-off, real cost, diminished confidence, reassessing the
  // relationship) that never came from the draft. Firmness now comes from
  // wording, not invented consequences, and the three tones are named for
  // what they do (Clear / Tactful / Firm) rather than a stance assumed
  // on the user's behalf.
  seoDescription: "Turn your furious draft into a message you could actually send. Clear, Tactful, and Firm versions that keep your point and lose the fire — no invented facts, no manufactured graciousness.",
  seoTitle: "Angry Email Rewriter",
  title: "Velvet Hammer",
  tagline: "Say the hard thing without losing the point.",
  tags: ['my boss', 'my manager', 'angry message', 'professional email', 'negotiate', 'persuade', 'firm', 'boundary', 'pushback', 'assertive', 'conflict', 'rewrite', 'workplace', 'communication'],
  icon: "🔨",
  categories: ['Conversations', 'Relationships', 'Work & Meetings'],
  headerColor: "#e0b8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Velvet Hammer gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the draft below — the full result, nothing reworded.",
    sampleLabel: "The angry draft",
    sampleText: "This is the THIRD time this month you've sent me a 'final' contract that you then change two days later. Do you have any idea how much time I'm wasting reviewing the same document over and over because YOU can't get your act together? Stop sending me half-baked drafts.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples. To a vendor; goal: change the behavior; you have the leverage.",
    sections: [
      {
        label: "What survives once the heat is gone",
        tone: "neutral",
        text: "You have received three contracts this month that were each described as final but then revised within days. You want the vendor to stop sending documents labeled final before they are actually ready for your review.",
      },
      {
        label: "Clear — when you simply want the point understood",
        tone: "green",
        text: "This is the third time this month I've received a document marked as the final contract, only to get a revised version two days later. That cycle is costing me significant review time. Please don't send a contract as final until it's actually in its final state.",
      },
      {
        label: "Tactful — when the relationship needs extra care",
        tone: "green",
        text: "Three times this month I've reviewed a document sent as the final contract, then received a revised version shortly after. Each round takes real time on my end. Going forward, could you hold off on sending until you're confident no further changes are coming?",
      },
      {
        label: "Firm — when the point or boundary cannot be missed",
        tone: "green",
        text: "I've now received three contracts this month labeled as final, each followed by revisions within two days. I can't keep absorbing the time required to re-review the same document. I need what you send as final to actually be final before it comes to me.",
      },
    ],
  },
  faq: [
    { q: "How do I rewrite an angry email so it sounds professional?",
      a: "Keep the facts and the request; drop the insults, the guesses about motive and the exaggeration. State what happened, what it is costing you, and what you need to change, in that order. A specific request ('don't send a contract as final until it is') does more than any amount of heat." },
    { q: "Should I send an angry email?",
      a: "Write it if you need to, but don't send the first draft. Wait, then rewrite it so it keeps your point at full strength without the parts that give the other person something else to argue about." },
    { q: "What's the difference between clear, tactful and firm?",
      a: "They make the same request. Clear states it plainly; tactful softens the delivery for a relationship that needs care; firm makes it impossible to miss, without threats you haven't decided on." },
    { q: "Will it change what I'm asking for?",
      a: "No. Velvet Hammer keeps your facts, numbers and request exactly as you gave them, and checks that nothing was added or widened." },
  ],
  description: "Sometimes the message you need to send starts out angrier than you want it to land. Velvet Hammer helps you keep what matters, lose what doesn't, and say it in a way the other person can actually hear.",
  guide: {
    tips: [
      "The angrier your draft, the better — the tool is designed to find the point underneath it",
      "Context fields calibrate directness only — they never invent leverage or soften a boundary you stated plainly",
      "Firm is direct, not a threat — it should never contain a consequence you didn't actually state",
      "Read The Point before the three versions — it's the plain fact of what survived",
      "Your original angry draft stays completely private and is never stored anywhere"
    ],
  }
},

{
  modified: "",
  id: "MissingLink",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You've re-read the hard part four times and it still won't go in.",
    give: "The concept and your level. The subject is worked out from the concept.",
    get: "The prerequisite you're actually missing, and what to learn first.",
    edge: "The block is almost never the hard material — it's something earlier. Re-reading the hard part is why you're stuck.",
  },
  seoDescription: "Stuck on a concept? Trace backward through the prerequisites to find the exact point your understanding broke — then get a focused fix. Free.",
  seoTitle: "Find Your Knowledge Gap",
  title: "Missing Link",
  tagline: "Stuck on a concept? We'll find where your understanding broke.",
  tags: ['stuck', 'concept', 'confused', 'gap', 'knowledge', 'study', 'struggling', 'fundamentals'],
  icon: "⛓️",
  categories: ['Learning'],
  headerColor: "#d4dde8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "Discovered – not indexed" page real substance.
  exampleOutput: {
    title: "See what Missing Link gives you",
    expandLabel: "See the full real example ↓",
    intro: "Real output from an actual run on the concept below. Most of the result is shown; nothing is reworded.",
    sampleLabel: "The concept you're stuck on",
    sampleText: "Recursion",
    context: "Real run, 2026-10-07 — subject: Computer Science; level: undergraduate. The tool's own built-in example.",
    sections: [
      {
        label: "What it depends on, in order",
        tone: "neutral",
        items: [
          "1. Functions and return values — chance this is the gap: low",
          "2. The call stack — chance this is the gap: high",
          "3. Base case vs. recursive case — chance this is the gap: high",
          "4. Trusting the recursive leap — chance this is the gap: medium",
          "5. Recursion itself — chance this is the gap: low",
        ],
      },
      {
        label: "The likely gap: the call stack",
        tone: "yellow",
        text: "A very common pattern when students say recursion feels impossible to follow is that they are trying to track the logic of the function without a model of what the machine is doing underneath. Without understanding that each call is a separate, paused frame with its own variables — waiting for the call below it to finish before it can continue — recursion looks like the function is somehow running in parallel with itself, which is disorienting. This trips up a lot of people before they ever get to worrying about base cases.",
      },
      {
        label: "How sure it is: medium",
        tone: "neutral",
        items: [
          "The call stack is a very common gap at the undergraduate level for students new to recursion, and it directly explains the most frequently reported symptom of not being able to follow what the function does.",
          "The student gave only the concept name and no description of exactly where they get lost, so it is not possible to confirm whether the confusion is about execution order, base cases, or something else.",
          "If the student already has a solid call-stack model, the gap is more likely to be the recursive leap — the diagnosis could shift with one more piece of information about what specifically feels wrong.",
        ],
      },
      {
        label: "The quick refresher",
        tone: "green",
        text: "When your program calls a function, it creates a little box — called a stack frame — that holds that function's inputs and local variables. The program then pauses whatever it was doing and works inside that new box. When the function returns a value, that box is destroyed and the program resumes exactly where it paused, now holding the returned value. Recursion stacks these boxes on top of each other: each recursive call creates a new frame, pauses the one above it, and the whole tower unwinds from the bottom up once the base case is reached — each returning frame hands its value up to the frame that called it.",
      },
      {
        label: "The common confusion",
        tone: "neutral",
        text: "Students often imagine the function re-running from the top each time and overwriting its own variables. In reality, each call gets its own completely separate copy of the local variables. The version of the function at level 3 of the stack has no idea what level 2 stored in its variables — they are separate boxes.",
      },
      {
        label: "If that's not it",
        tone: "neutral",
        items: [
          "Trusting the recursive leap: You understand the call stack and can draw it, you can identify the base case and recursive case correctly, but you still feel you have to trace every nested call to convince yourself the function works — writing recursive functions from scratch feels impossible even on simple problems.",
          "Base case vs. recursive case: You can follow a recursive function someone else wrote when it is short, but when you try to write your own you either end up with infinite recursion or you are not sure what condition to check to stop the calls.",
        ],
      },
      {
        label: "Study plan (2-4 hours across 2 study sessions)",
        tone: "green",
        items: [
          "Build the call stack mental model: take factorial(4) or sum([1,2,3]) and draw every frame by hand — the input value going in, the recursive call pausing that frame, and the return value coming back up. Do this without running the code first.",
          "Add print statements before and after the recursive call in a function, run it, and check that the output matches your hand-drawn stack exactly. If it does, your model is accurate.",
          "Return to whatever recursive problem or explanation first confused you. This time, instead of reading the whole function at once, identify just the base case and just the recursive case, then ask: what does one frame do with the value returned from the frame below it?",
        ],
      },
    ],
  },
  faq: [
    { q: "Why can't I understand recursion?",
      a: "Often the trouble isn't recursion itself but something it depends on — most commonly the call stack: the way each call waits, with its own copy of the variables, until the call below it returns. The real example on this page traces that chain for recursion and shows the refresher Missing Link gives." },
    { q: "How do I figure out what I'm missing when I don't understand something?",
      a: "Work backwards. Every concept rests on earlier ones, and the confusion usually starts at one of those rather than at the topic you keep re-reading. Missing Link lists what your concept depends on, in order, and points to the link most likely to be missing — with a quick question you can use to check each one." },
    { q: "What is a prerequisite or knowledge gap?",
      a: "It's an earlier idea a topic quietly assumes you already have. When it's missing, the new topic feels impossible however many times you read it. Missing Link also says what kind of gap it is — a missing mental model, a missing procedure, or a missing definition — because each one is filled differently." },
    { q: "Does it work for subjects besides math and programming?",
      a: "Yes. Its built-in examples include supply and demand in economics, biology and statistics, at levels from high school up. Name the concept, and add the subject and your level if you know them." },
    { q: "What if it points to the wrong gap?",
      a: "It says how sure it is, and why, and lists the next most likely gaps with the symptoms that would point to each. Describing exactly where you get lost sharpens the diagnosis, and you can ask for a worked example or a visual of any step." },
  ],
  description: "Name the concept you're stuck on. Missing Link traces backwards through everything it depends on and finds the exact point where your understanding broke — the missing building block, not the hard part you keep re-reading.",
  guide: {
    tips: [
      "The 'What do you understand?' field is gold — it lets the tool skip prerequisites you already have",
      "Gap types matter: a conceptual gap needs explanation, a procedural gap needs practice, a definitional gap just needs a definition",
      "Quick tests at each node are honest diagnostics — don't skip them, they're how you find the real gap",
      "The likely gap is usually 2-3 steps back from where you think the problem is",
      "Deep Dive practice problems go easy → hard — if you nail the easy one, the gap is probably elsewhere",
      "Works for any subject: STEM, humanities, social sciences, languages — anything with prerequisite knowledge"
    ],

  }
},

{
  modified: "",
  id: "BuyWise",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Something's in the cart and you're not sure.",
    give: "What you're buying. The price you've seen helps.",
    get: "Whether the price is fair, buy now or wait, the true cost including consumables, and what actually goes wrong with it.",
    edge: "Total cost of ownership, not sticker price — the cheap printer with expensive ink is the whole point.",
  },
  seoDescription: "Should you buy it? Check current facts, weigh the price and tradeoffs, compare alternatives, and see what to verify before you pay. Free, no signup.",
  seoTitle: "Should I Buy It? Purchase Check",
  title: "Buy Wise",
  tagline: "Make the purchase with your eyes open.",
  tags: ['buy', 'purchase', 'worth it', 'price', 'research', 'shopping', 'impulse', 'regret', 'gift', 'compare', 'budget', 'negotiate', 'deal', 'overpaying'],
  icon: "💲",
  categories: ['Decisions', 'Money', 'Tasks'],
  headerColor: "#c0d8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 (strict index review: indexed only once it shows real output).
  exampleOutput: {
    title: "See what Buy Wise gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the purchase below. Part of the result is shown; nothing is reworded.",
    sampleLabel: "The purchase",
    sampleText: "Standing desk — considering FlexiSpot E7 or UPLIFT V2. Price: $600. No rush. Work from home full-time, lower back issues, been using my kitchen table for two years.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "The verdict",
        tone: "green",
        text: "After two years at a kitchen table working full-time with back issues, a quality sit-stand desk is a reasonable buy — and both models you named are credible candidates in this price range.",
      },
      {
        label: "Is $600 fair?",
        tone: "yellow",
        text: "I could not verify today's street price for either the FlexiSpot E7 or the UPLIFT V2, so treat $600 as the number to test rather than one I can confirm good or bad. What drives cost in this category is the frame — dual motors, the lift mechanism, stability at full height and the stated weight rating — plus the desktop material and size, so check whether your $600 is for frame-plus-top in the size you want or frame only with the top extra.",
      },
      {
        label: "Check before you buy",
        tone: "blue",
        items: [
          "Confirm what the $600 actually buys on the configuration you want — on both the FlexiSpot E7 and UPLIFT V2, the frame and desktop size, desktop material, and any surcharge for a larger or solid-core top can move the price; check whether $600 is the frame-plus-top you'd actually order or a base config before add-ons.",
          "Ask whether the warranty covers the motors and electronics and for how long, and whether it transfers if you ever resell — on a motorized desk the electronics are the expensive failure point, so a frame-only warranty that excludes the controller is a weaker promise than it looks.",
          "Check the stated weight capacity against everything you'll put on top — monitor arm, dual monitors, laptop dock — and confirm it's the rated lifting capacity, not just a static load number; if you run a heavy multi-monitor setup you want margin above your actual load.",
        ],
      },
      {
        label: "A cheaper way to get most of it",
        tone: "purple",
        text: "A single-motor frame or a smaller/laminate desktop does most of the same sit-stand job for less than a dual-motor, larger, or bamboo-top configuration — look for the base frame size and a standard laminate top, which tends to run a meaningful share below the loaded config. Tradeoff: single-motor frames can lift more slowly and sometimes rack slightly under uneven loads, and a smaller or laminate top gives you less surface and a less premium feel — but the core raise-and-lower function is the same.",
      },
    ],
  },
  faq: [
    { q: "Is a standing desk worth it if I work from home?",
      a: "If you work at a desk most of the day, being able to change position is the main benefit. Before buying, check what the price actually includes (frame only, or frame plus desktop), the weight rating against your setup, and whether the warranty covers the motors." },
    { q: "Does Buy Wise know today's prices?",
      a: "Not always. When it can't verify a current price it says so and tells you what to check, rather than guessing a number." },
    { q: "Can it tell me not to buy something?",
      a: "Yes. It weighs the purchase against what you told it — need, timing, budget, impulse — and says when waiting, buying used or skipping it makes more sense." },
  ],
  description: "Thinking about a purchase? Tell Buy Wise what you're considering, the price you found, and what matters to you. It helps you judge the tradeoffs, think through the real cost, spot reasons to buy or wait, and identify what you should verify before you pay.",
  guide: {
      tips: [
        "The Total Cost of Ownership often reveals the real price — a cheap printer needs expensive ink",
        "Impulse check mode is genuinely useful — it asks questions you're avoiding",
        "Comparison mode works best when you specify your priority so it can weight the recommendation",
        "The negotiation scripts only appear when haggling is realistic — cars, furniture, services, rent",
        "Adding context ('replacing old one', 'gift', 'bake once a month') dramatically improves the advice",
        "Timing advice includes sale calendars — waiting 3 weeks can save 30%"
      ],
      
    }
},
{
  modified: "2026-03-24",
  id: "SafeWalk",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Walking somewhere alone.",
    give: "Where you're going, when, and anything you already know about the route.",
    get: "A practical plan to think through before you leave, plus tools to keep close on the way.",
    edge: "It plans from what you actually know — it doesn't invent lighting, foot traffic, or a neighborhood's crime reputation to sound more authoritative.",
  },
  seoDescription: "Plan a solo walk from what you actually know about the route, then keep a check-in reminder, a pretend call, and emergency tools close on the way. Free.",
  seoTitle: "Walking Home Safety Check-In",
  title: "Safe Walk",
  tagline: "A little preparation before you head out.",
  tags: ['safe walk', 'walking alone', 'solo walk', 'walk home', 'walking home', 'walk safety', 'personal safety', 'pedestrian safety', 'night walk', 'late night walk', 'unfamiliar route', 'route planning', 'check-in', 'check-in message', 'location link', 'pretend call', 'fake call', 'emergency tools', 'flashlight'],
  icon: "🚶",
  categories: ['Home & Daily Life'],
  headerColor: "#1e2a3a",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 (strict index review: indexed only once it shows real output).
  exampleOutput: {
    title: "See what Safe Walk gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the walk below. Most of the result is shown; nothing is reworded.",
    sampleLabel: "The walk",
    sampleText: "Union Station, Chicago to a hotel on N Clark St, late at night, 20–30 minutes. First time in the city; the map shows the route passing a parking garage and an underpass. Arriving on a delayed train around 11:40pm with a suitcase.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "What matters",
        tone: "blue",
        text: "The main things to plan around are your phone as a navigation tool in an unfamiliar city, managing a suitcase over a 20-30 minute walk, and the fact that you don't yet know which streets on this route will have foot traffic or how the underpass and parking garage feel on the ground.",
      },
      {
        label: "Before you go",
        tone: "green",
        items: [
          "Make sure your phone has enough charge to run navigation for 20-30 minutes plus a buffer.",
          "Pull up your navigation app and get the route loaded before you leave the station.",
          "Note your hotel's address and phone number somewhere you can access without signal, such as a screenshot or written note.",
        ],
      },
      {
        label: "Watch for",
        tone: "yellow",
        items: [
          "If the stretch near the underpass or parking garage looks or feels substantially different from what the map suggested — darker, more enclosed, or blocked — and you're not comfortable continuing. Use your navigation app to check whether there's another pedestrian route around that section, rather than improvising one.",
          "If your navigation app re-routes you or shows a street closure that wasn't visible when you planned. Follow the app's updated route rather than your memory of the original one — it will have current road information.",
        ],
      },
      {
        label: "A check-in text you could send",
        tone: "purple",
        text: "Just arrived at Union Station in Chicago. About to walk to my hotel on N Clark St — the walk should take me roughly 20-30 minutes based on my estimate, so I'm expecting to arrive somewhere between midnight and 12:15am. I'll text you when I'm in.",
      },
    ],
  },
  faq: [
    { q: "How do I stay safe walking alone at night in a new city?",
      a: "Charge your phone, load the route before you leave, keep your destination's address somewhere you can read offline, and tell someone when you expect to arrive. If a stretch looks worse than the map suggested, reroute rather than improvise." },
    { q: "Does Safe Walk know which streets are safe?",
      a: "No, and it says so. It doesn't rate neighborhoods; it helps you plan around what you know and what you can't know yet, and it checks for verified closures or disruptions on your route." },
    { q: "Does it track my location?",
      a: "No. It plans the walk with you before you go; check-ins are messages you send to someone you choose." },
  ],
  description: "Walking somewhere alone? Tell Safe Walk where you're going, when, and anything you already know about the route. It helps you think through the walk before you leave, make a simple check-in plan, and keep useful tools close while you're on the way.",
  guide: {
    tips: [
      "What you already know about the route is the most useful field on the Plan tab — Safe Walk has no live data of its own, so specific details are what make the plan specific",
      "The check-in reminder is local to your device — pair it with copying the check-in message to someone yourself if you want another person to know",
      "Emergency tools is a manual panel, not a monitoring service — nothing inside it contacts anyone or shares your location until you tap it",
      "The pretend call discloses itself before it starts — it's a social exit tool, not something to rely on in place of moving toward help",
      "If the browser can't access your phone's actual flashlight, the flashlight tile brightens the screen instead rather than failing silently"
    ],
    beforeYouGo: "The check-in reminder doesn't alert anyone. If someone should know your route, text them before you set out.",

  }
},
{
  modified: "",
  id: "RoommateCourt",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "The same roommate argument for the third time — or chores that need dividing.",
    give: "What's going on, your side, and — if you know it — what they'd say. Don't guess just to fill that in.",
    get: "Where the actual disagreement sits, practical options worth trying, and words to start the conversation with.",
    edge: "It only has your account, and says so — no fault percentages, no invented 'real conflict,' no fictional conversation where they agree.",
  },
  seoDescription: "Roommate problem? Tell Roommate Court what's happening and what each side says. It helps you separate facts from disagreement and gives you words to start the conversation — plus a chore-dividing wheel that rotates the load over time. Free.",
  seoTitle: "Roommate Dispute Mediator",
  title: "Roommate Court",
  tagline: "Work it out without making it worse.",
  tags: ['roommate', 'roommate conflict', 'roommate problem', 'housemate', 'shared living', 'shared apartment', 'household conflict', 'roommate disagreement', 'conflict resolution', 'roommate conversation', 'boundaries', 'household rules', 'chores', 'chore rotation', 'chore assignment', 'split chores', 'fair chores', 'chore roulette'],
  icon: "⚖️",
  categories: ['Home & Daily Life', 'Relationships'],
  headerColor: "#e0b8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Roommate Court gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the dispute below — an excerpt of a longer result, nothing reworded.",
    sampleLabel: "The dispute",
    sampleText: "Dishes left in the sink for days at a time, sometimes a full week. My side: I work from home and the kitchen is right next to my desk. I end up staring at a sink full of dirty dishes for half my workday. I'm not asking for spotless — just for them not to sit overnight more than once. Her side: She works long hours at the hospital and says she's too tired to wash dishes when she gets home at 9pm. She'll do them on her days off. She thinks I'm being uptight because I'm home all day. Going on for months; raised more than once.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "You're talking past each other",
        tone: "yellow",
        text: "You are asking for a timeline — no dish sits overnight more than once. She is describing a physical limit — she cannot wash dishes at 9pm after a hospital shift. These are two different problems being treated as one. She is not refusing to do dishes; you are not asking for perfection. The gap is whether 'days off' is a workable schedule when you are looking at the sink all day, every day.",
      },
      {
        label: "Where it collides",
        tone: "neutral",
        text: "Her reported 'days off' cycle may mean dishes sit for several days in a row — the exact situation that disrupts your workspace. Her solution may feel reasonable to her while still not solving your problem at all.",
      },
      {
        label: "What to try",
        tone: "green",
        items: [
          "Name the specific standard clearly — one overnight maximum — rather than asking her to 'clean up more' or 'do dishes sooner'. Vague requests are easy to feel you are meeting. A concrete threshold gives both of you something unambiguous to agree to or negotiate around.",
          "Separate the timeline problem from the late-night washing problem. Ask whether she could rinse and stack dishes before bed — not fully wash them — so the sink is not visually overwhelming during your workday. A quick rinse and stack is much lighter than a full wash and may address your actual concern without requiring her to do the thing she says she cannot do at 9pm.",
          "Propose a day-of-week anchor instead of a hourly rule — for example, any dishes from Sunday through Tuesday get done by Wednesday, and so on — timed around her known days off. This meets her where she actually is while giving you a predictable limit on how long the sink fills up.",
        ],
      },
      {
        label: "Start the conversation with",
        tone: "green",
        text: "Frame it around what you actually need: that staring at a full sink during your workday is affecting your ability to focus, and you want to find something workable given her schedule. Skip the exact words and go straight to: you need to talk about what a realistic timeline actually is for her, and what would reduce the visual disruption for you during work hours.",
      },
    ],
    disclaimer: "Roommate Court only has your account of the conflict, and it says so. It looks for a workable arrangement, not a verdict on who is at fault.",
  },
  faq: [
    { q: "How do I get my roommate to do the dishes?",
      a: "Agree on a specific standard rather than 'clean up more' — for example, nothing left in the sink more than one night — and fit it to both schedules. If late evenings are impossible for them, a quick rinse-and-stack or a set catch-up day can work." },
    { q: "How do I bring up a problem with a roommate without a fight?",
      a: "Pick a calm time, describe it as a shared problem, ask how they see it before proposing anything, and suggest a simple system rather than a favor." },
    { q: "What if we've already talked about it and nothing changed?",
      a: "The request was probably too general. Name the exact standard you need, check what is actually stopping them, and agree a system you can both see working, such as a rota or a set day." },
    { q: "Does Roommate Court decide who is right?",
      a: "No. It shows where the two positions actually collide, what is still unknown, and what to try and say, so you can agree something that works for both of you." },
  ],
  description: "Roommate problem? Tell Roommate Court what's happening and what each side says. It helps you separate the facts from the disagreement, figure out what might actually resolve it, and gives you words to start the conversation. Or use Chore Roulette to divide household chores and rotate the load over time.",
  guide: {
    tips: [
      "Only fill in 'What would they say?' if you actually know — leaving it blank is honest input, guessing isn't",
      "The proposal is something to bring to the conversation, not something already settled — say so if you use it",
      "In Chore Roulette, save rounds consistently so the rotation history stays useful — history doesn't judge who worked harder, only who had what",
      "Load labels (Lighter/Medium/Heavier) are optional and reflect your household's own sense of a chore's weight — nothing invents that for you",
      "Use 'Something Doesn't Work?' with a specific reason ('I did the bathroom last time') rather than a general complaint — it's treated as new information, not a fairness dispute to win"
    ],
  }
},

{
  modified: "",
  id: "RentersDepositSaver",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "The day you move in, before you unpack.",
    give: "Address, landlord, deposit amount, and a room-by-room walkthrough. About five minutes.",
    get:  "Five documents: a dated condition report, a letter to your landlord, a photo shot list, your local deposit rights, and a move-out sequence.",
    edge: "It is built for move-IN. Most deposit tools help you fight a deduction after it happens; this one creates the evidence a year before you need it.",
  },
  // FAQ — rendered in the guide aside (ToolPageWrapper) and the prerendered
  // static page (+ FAQPage JSON-LD). Part of the 2026-07 focus-tools enrichment.
  faq: [
    { q: "How do I get my full security deposit back?",
      a: "Three things decide most deposit disputes: move-in documentation (dated photos of every existing flaw), written communication about repairs during the tenancy, and a proper move-out process (cleaning to the lease's stated standard, a walkthrough, and a forwarding address in writing). Renter's Deposit Saver builds you a checklist and timeline for each stage so nothing is missed." },
    { q: "What can a landlord legally deduct from a security deposit?",
      a: "Generally: unpaid rent, damage beyond normal wear and tear, and costs the lease explicitly makes yours (like professional cleaning, where enforceable). Faded paint, minor scuffs, and worn carpet from ordinary living are normal wear in most jurisdictions and shouldn't be deducted. Most places also require an itemized statement for any deduction." },
    { q: "How long does a landlord have to return a deposit?",
      a: "It varies by jurisdiction — commonly 14 to 45 days after move-out, often with penalties (sometimes double or triple the deposit) if they miss the deadline. The tool asks where you rent and builds your timeline around the rules that apply to you rather than assuming one country's law." },
    { q: "What should I do if my landlord won't return my deposit?",
      a: "Escalate in writing, in stages: a formal demand letter citing your jurisdiction's deadline and penalty, then the local dispute route (small claims court, tenancy tribunal, or deposit-scheme arbitration depending on where you live). Documented move-in photos and your written demand letter win most of these cases — landlords frequently return deposits at the demand-letter stage." },
    { q: "When should I start protecting my security deposit?",
      a: "On day one, not at move-out. The single highest-leverage act is a dated photo record of every existing flaw before you unpack, sent to the landlord in writing. Disputes are decided on evidence, and the tenant who documented move-in almost always keeps more of their deposit." },
  ],
  seoDescription: "Protect your security deposit on move-in day. Free room-by-room walkthrough generates a condition report, landlord letter, photo list, and your state rights.",
  seoTitle: "Security Deposit Saver",
  title: "Renter's Deposit Saver",
  tagline: "Protect your security deposit on move-in day",
  tags: ['deposit', 'renter', 'move in', 'apartment', 'damage', 'landlord', 'documentation'],
  icon: "🏦",
  categories: ['Home & Daily Life', 'Money'],
  headerColor: "#ccdfc4",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "crawled/discovered – not indexed" page substance.
  exampleOutput: {
    title: "See what Renter's Deposit Saver gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from the deposit-rights check for one location — an excerpt, nothing reworded. The full tool also builds your move-in record.",
    sampleLabel: "The location",
    sampleText: "California, United States",
    context: "Real run, 2026-10-07.",
    sections: [
      {
        label: "Your deposit rights, in short",
        tone: "neutral",
        text: "California law limits how much a landlord can collect as a security deposit and sets strict rules for returning it. After a tenancy ends, the landlord must return the deposit — or a written itemized accounting of any deductions — within a specific deadline. Failure to follow these rules can expose the landlord to liability beyond the deposit amount itself.",
      },
      {
        label: "Key rights",
        tone: "green",
        items: [
          "Return deadline: the landlord must return the deposit and/or an itemized statement of deductions within 21 days after you vacate",
          "Itemization required: any deductions must be listed in writing with a description of the work or loss and, for repairs over a threshold amount, copies of invoices or receipts",
          "Deductions allowed only for: unpaid rent, cleaning to restore the unit to move-in condition, and repair of damage beyond normal wear and tear — normal wear and tear cannot be charged to the tenant",
          "Pre-move-out inspection: you have the right to request an inspection before vacating so the landlord must identify correctable deficiencies in advance, giving you a chance to fix them",
          "Interest on deposit: California state law does not generally require landlords to pay interest on security deposits, though some local ordinances may — check your city or county rules",
          "Penalty for bad faith withholding: a landlord who wrongfully withholds a deposit in bad faith may owe the tenant up to twice the deposit amount in addition to the actual deposit, as a statutory penalty",
        ],
      },
      {
        label: "Where the rules come from",
        tone: "neutral",
        text: "Core security deposit rules are found in California Civil Code Section 1950.5, which you should verify directly or through a local tenant rights organization, as amendments — including a 2024 law affecting deposit caps — may affect your specific situation.",
      },
    ],
    disclaimer: "General information, not legal advice. Deposit law changes — California capped most deposits at one month's rent from July 2024 — so check the current rule for your lease date.",
  },
  description: "Don't get charged later for damage that was already there. Walk through your apartment once. We'll help you document its condition, take the right photos, and create a record you can send your landlord.",
  guide: {
    tips: [
      "Do this BEFORE unpacking — it's much easier to spot damage in an empty apartment",
      "Email the condition report + photos to your landlord AND yourself on move-in day (creates a timestamp)",
      "Don't skip rooms you think are fine — document good condition too, so landlords can't claim damage later",
      "Take photos with your phone's location and date metadata enabled",
      "Keep everything for the entire duration of your lease",
      "Pairs well with the Lease Trap Detector — use that before signing, use this on move-in day"
    ],

  }
},

{
  modified: "",
  id: "LaundroMat",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "An unfamiliar load, a fresh stain, or something already ruined.",
    give: "Describe the load, or photograph the care label or the stain.",
    get: "What to separate, cycle settings, drying risks, or a rescue for the thing you've already damaged.",
  },
  seoDescription: "Free laundry expert: get a load plan, treat any stain fast, rescue shrunk or bled clothes, translate care labels, and run smart wash and dry timers.",
  seoTitle: "Laundry Stain & Care Label Help",
  title: "LaundroMat",
  tagline: "What to wash, how to wash it, and what to do when things go wrong",
  tags: ["laundry", "wash clothes", "washing machine", "laundromat", "stain removal", "remove stain", "care label", "laundry symbols", "fabric care", "garment care", "shrunk clothes", "color bleed", "garment rescue", "dryer", "laundry timer"],
  icon: "🧺",
  categories: ['Home & Daily Life'],
  headerColor: "#d4dde8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what LaundroMat gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the load below — an excerpt of a longer result, nothing reworded.",
    sampleLabel: "The load",
    sampleText: "Mixed whites, a wool sweater, dark jeans, and a down jacket. Can I wash these together or do I need to separate them?",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples, for a home machine.",
    sections: [
      {
        label: "Wash these separately",
        tone: "yellow",
        items: [
          "Wool sweater: Wool requires a cold, gentle or hand-wash cycle with wool-safe detergent; any agitation, heat, or spin from a normal or heavy cycle can cause irreversible shrinkage and felting.",
          "Down jacket: Down needs a specific wash-and-dry process (gentle cycle, low heat drying with dryer balls) that conflicts with every other item in this load, and its bulk can unbalance a mixed load.",
          "Dark jeans: Dark denim can bleed dye onto whites, especially in warm or hot water.",
        ],
      },
      {
        label: "Drying",
        tone: "neutral",
        items: [
          "Wool sweater: Dry flat on a clean towel away from direct heat or sunlight, reshaping it to its original dimensions while damp.",
          "Down jacket: Tumble dry on low heat with two or three clean dryer balls, stopping periodically to break up any clumped fill by hand, until fully dry — damp down can develop odor or mildew.",
          "Dark jeans: Turn inside out and either hang to dry or tumble dry on low heat to reduce dye fade and shrinkage.",
        ],
      },
      {
        label: "Before you wash",
        tone: "green",
        items: [
          "Down jacket: Close all zippers and fasten any snaps before washing to protect the shell fabric and keep the jacket from snagging itself.",
          "Dark jeans: Turn inside out before washing to slow surface dye loss.",
        ],
      },
      {
        label: "One thing not to skip",
        tone: "green",
        text: "The down jacket must be completely dry before storage — even a small amount of residual moisture inside the baffles can cause mildew that is very difficult to remove.",
      },
    ],
    disclaimer: "LaundroMat works from what you describe or a photo of the care label. When a label says otherwise, follow the label.",
  },
  faq: [
    { q: "Can I wash a wool sweater with other clothes?",
      a: "Usually not. Wool shrinks and felts with heat and agitation, so wash it on its own — cold, on a wool or hand-wash cycle with wool-safe detergent — and dry it flat. Follow the care label if it says dry clean only." },
    { q: "How do you wash a down jacket?",
      a: "On its own, on a gentle cycle with a mild or down-specific detergent, zips and snaps closed. Tumble dry on low with two or three dryer balls until it is completely dry, breaking up clumps as you go; damp down can turn musty." },
    { q: "Will dark jeans bleed onto whites?",
      a: "They can, especially in warm water and in the first few washes. Wash dark denim inside out with darks or on its own, in cold water." },
    { q: "Can LaundroMat read a care label?",
      a: "Yes. Add a photo of the label and it explains the symbols and the settings to use. It also helps with stains and with sorting a mixed load." },
  ],
  description: "Not sure how to wash it, remove the stain, read the care label, or fix what went wrong? LaundroMat gives you practical laundry help for the clothes in front of you.",
  guide: {
    tips: [
      "Rescue works best when you act quickly — the sooner after the incident, the better the chances",
      "Enable browser notifications on first use so Timer alerts work even when you've switched tabs",
      "The Advisor's 'Set these timers' button automatically creates timer countdowns from the AI's time estimate",
      "For Stain SOS, be specific about the fabric — treatment for silk is very different from cotton",
      "Snap a care label photo in Symbols if you're unsure — it reads every symbol and recommends settings"
    ]
  }
},
{
  modified: "",
  id: "NerveCheck",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "The day before something you are dreading, or ten minutes before it starts.",
    give: "Prep mode: what you're facing and who's involved. SOS mode: just start.",
    get: "A fear breakdown and a plan, or immediate help mid-panic.",
    edge: "Two modes because preparation and panic need opposite things — one wants detail, the other wants none.",
  },
  seoDescription: "Free confidence coach for interviews, presentations, dates, and hard talks. Break down the fear, build a prep plan, and hit SOS mode for live panic.",
  seoTitle: "Interview Confidence Coach",
  title: "Nerve Check",
  tagline: 'Real confidence for scary moments.',
  tags: ['nervous', 'nerve-racking', 'anxiety', 'interview nerves', 'presentation nerves', 'performance nerves', 'stage fright', 'difficult conversation prep', 'date nerves', 'medical appointment nerves', 'pre-event prep', 'help me now', 'readiness', 'what to say', 'blanking', 'grounding', 'calm down', 'prepare for interview'],
  icon: '💪',
  categories: ['Conversations', 'Health & Wellness', 'Self & Reflection'],
  headerColor: "#b8dcd8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 (strict index review: indexed only once it shows real output).
  exampleOutput: {
    title: "See what Nerve Check gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual Prep-mode run on the situation below. Most of the result is shown; nothing is reworded.",
    sampleLabel: "The situation",
    sampleText: "Job interview at a tech company tomorrow morning. Readiness: 4 out of 10. The fear: \"They'll ask something I can't answer and I'll freeze.\"",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples.",
    sections: [
      {
        label: "What you know, what might happen, what you can't know yet",
        tone: "blue",
        items: [
          "Known: You're worried you'll be asked something you can't answer and will freeze",
          "Possible: A technical question comes up that's outside what you've prepared",
          "Possible: You start an answer and lose the thread partway through",
          "Unknown: What specific questions they'll ask",
          "Unknown: How the interviewer responds to moments of uncertainty",
          "Unknown: What they're prioritizing in this hire",
        ],
      },
      {
        label: "What you can prepare tonight",
        tone: "green",
        items: [
          "Write down and rehearse one 'buying time' sentence out loud before you sleep tonight — when a question catches you off guard, you'll have a specific sentence already available instead of searching for words in that moment",
          "Pick two or three things you genuinely know well from your background and have a brief, clear version of each ready — if an answer gets uncertain, you can steer toward something concrete you can actually speak to with confidence",
          "Decide in advance that 'I don't know, but here's how I'd approach finding out' is a complete and usable answer — having a predetermined response to not-knowing means the gap in your knowledge doesn't have to become a gap in your speaking",
        ],
      },
      {
        label: "Words if you need them",
        tone: "yellow",
        items: [
          "If you blank mid-answer: “Let me take a second to think about that properly.”",
          "If you genuinely don't know the answer: “I don't have that off the top of my head, but the way I'd approach it is... [describe your reasoning process or what you'd look into]”",
          "If you need to restart an answer: “Actually, let me back up and give you a clearer answer on that.”",
        ],
      },
      {
        label: "Remember",
        tone: "purple",
        text: "Not knowing one answer is a specific moment in the interview, not the whole interview — and you can prepare for what to do in that moment.",
      },
    ],
  },
  faq: [
    { q: "How do I stop freezing when I don't know an interview answer?",
      a: "Prepare the moment, not every answer: rehearse one sentence that buys you time (\"Let me take a second to think about that\") and decide in advance that \"I don't know, but here's how I'd find out\" is a complete answer." },
    { q: "What can I do the night before a stressful interview or presentation?",
      a: "Pick a few small, concrete preparations — say your opening and your fallback sentences out loud once, and have two or three things you know well ready to steer toward. More cramming rarely helps as much as rehearsing what you'll do if it goes wrong." },
    { q: "What is SOS mode?",
      a: "For when the nerves hit right before or during the moment. It skips the questions and gives you something immediate to do and say." },
    { q: "Is Nerve Check therapy?",
      a: "No. It helps you prepare for one specific moment. If anxiety is affecting your daily life, a doctor or licensed therapist is the right place to start." },
  ],
  description: "Pre-game toolkit for interviews, presentations, hard conversations, dates, and medical appointments. Breaks down fear, builds a prep plan, and has an SOS mode for live panic.",
  guide: {
    tips: [
      "The fear breakdown is the most valuable part — read it carefully. Most fears are real but inflated, and seeing that in writing changes your relationship to them",
      "SOS mode works best if you've done Prep mode first — it references your anchor",
      "For medical appointments, add your specific concern (getting bad news, not being heard) — generic prep misses the point",
      "Run Prep mode 24 hours before, not 5 minutes before — give yourself time to actually absorb the plan"
    ]
  }
},
{
  modified: "2026-07-21",
  id: "PaperworkPath",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A death, a move, a divorce, a new job — and a pile of forms.",
    give: "The life event and your location.",
    get: "Every document you need, in dependency order.",
    edge: "The order is the product. Most of these tasks block each other, and doing them in the wrong sequence means doing them twice.",
  },
  seoDescription: "Handling a move, new baby, new job, marriage, divorce, or loss? Get the exact documents you need and the right order to handle them — so nothing falls through the cracks. Free, no signup.",
  seoTitle: "Life Admin Paperwork Checklist",
  title: "Paperwork Path",
  tagline: "The documents you need — and the order to handle them",
  tags: ["paperwork", "life admin", "paperwork checklist", "documents needed", "moving paperwork", "new baby paperwork", "new job paperwork", "marriage paperwork", "divorce paperwork", "death paperwork", "estate paperwork", "buying a home paperwork", "retirement paperwork", "life event checklist", "order of operations", "document order", "bureaucracy", "forms", "what paperwork do i need", "paperwork sequence"],
  icon: "🗂️",
  categories: ['Home & Daily Life', 'Money'],
  headerColor: "#c9d6e5",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Paperwork Path gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the move below — an excerpt of a longer checklist, nothing reworded.",
    sampleLabel: "The situation",
    sampleText: "Moving to a new home: moving out of state to Austin, Texas, with two kids and starting a new job the same month.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples. Each deadline comes with where to confirm it.",
    sections: [
      {
        label: "The situation",
        tone: "neutral",
        text: "Out-of-state move to Austin, Texas with two children while starting a new job in the same month, requiring coordinated handling of address changes, Texas licensing, school enrollment, and employer onboarding paperwork under tight timing.",
      },
      {
        label: "Texas Driver License (convert out-of-state license)",
        tone: "yellow",
        text: "Texas requires new residents to obtain a Texas DL within 90 days of establishing residency — confirm this figure at dps.texas.gov as current. Where: In person at a Texas DPS driver license office; bring your current out-of-state license, proof of Texas residency (two documents), Social Security card, and proof of citizenship or lawful presence.",
      },
      {
        label: "USPS Change of Address",
        tone: "green",
        text: "Mail forwarding from your old address ensures no critical documents, tax notices, or financial statements are lost during the transition. Where: File online at usps.com/move or in person at any post office; there is a small identity-verification fee for the online option.",
      },
      {
        label: "Children's School Enrollment Records",
        tone: "green",
        text: "Austin ISD and other local districts require proof of residency, immunization records, and prior school records before children can begin attending. Where: Contact your zoned Austin-area school district directly (Austin ISD at austinisd.org or the appropriate district for your address) to confirm their specific document list and enrollment timeline.",
      },
      {
        label: "Children's Immunization Records (Texas-compliant)",
        tone: "green",
        text: "Texas schools require immunization records that meet state-mandated schedules, and records from another state may need a physician review to confirm compliance. Where: Obtain from your children's current pediatrician before moving; if gaps exist, schedule a catch-up appointment in Austin promptly through a new pediatrician or Austin Public Health.",
      },
      {
        label: "Health Insurance Enrollment or Transfer",
        tone: "green",
        text: "Leaving a state can qualify as a Special Enrollment Period for ACA marketplace plans, and your new employer plan will have its own enrollment window — missing either window can leave your family uninsured. Where: For employer coverage, enroll through your new HR portal within the window they specify; for marketplace coverage, visit healthcare.gov and confirm your SEP eligibility and deadline.",
      },
      {
        label: "Do this first",
        tone: "green",
        text: "Gather all critical documents you will need in Texas: both children's immunization records and school records, your out-of-state title and registration, Social Security cards, birth certificates, and passport or citizenship documents for the DL application. Nearly every downstream step — school enrollment, Texas DL, vehicle registration, and employer I-9 — requires original documents you cannot afford to be hunting for after you arrive.",
      },
    ],
    disclaimer: "All deadlines and requirements listed here reflect commonly cited Texas rules as of this writing and should be confirmed directly with the Texas DPS (dps.texas.gov), TxDMV (txdmv.gov), Travis County tax office, Austin ISD or your local district, and your employer HR department before relying on them.",
  },
  crossRefs: ['RentersDepositSaver', 'BillRescue', 'FinalWish'],
  description: "Pick a life event — moving, a new baby, a new job, marriage, divorce, a loss, buying a home, retiring — and Paperwork Path gives you the documents to gather, why each matters and where to get it, plus the order to handle everything so a later step never gets blocked by one you skipped. Requirements vary by location, so it flags what to confirm for your jurisdiction.",
  guide: {
    tips: [
      "The order is the point — doing step 4 before step 2 is how people end up redoing paperwork.",
      "Add your location: 'within 30 days' beats 'within a grace period'.",
      "Copy the whole path to a notes app or print it, then check items off as you go."
    ]
  },
  faq: [
    { q: "What documents do I need when I move?",
      a: "Typically a change-of-address with the postal service, updates to your license/ID and voter registration, utility transfers, and address updates with your bank, employer, and insurers. Paperwork Path builds the full checklist for your situation and the order to do it in." },
    { q: "What paperwork do I need after a death in the family?",
      a: "Usually multiple certified copies of the death certificate first (almost everything else depends on it), then notifying Social Security/pensions, banks, and insurers, and locating the will or estate documents. Paperwork Path sequences these so you don't get stuck waiting on a prerequisite." },
    { q: "Does the order really matter?",
      a: "Often yes — many steps depend on an earlier one (you need the new address before you can update it everywhere; the death certificate before you can close accounts). Paperwork Path orders steps by dependency, not alphabetically." }
  ],
},
{
  modified: "2026-07-15",
  id: "QuoteCheck",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A repair quote arrived and you're not sure what you're actually being asked to pay for.",
    give: "The quote and the repair type.",
    get: "What the quote actually includes, any concrete concerns, what's still unknown, and what to ask before you approve it.",
    edge: "It audits the quote you have instead of inventing a market price it can't actually know — no fairness verdict it can't back up.",
  },
  seoDescription: "Paste your repair quote — or upload the invoice — and get an honest audit: what the price includes, questions worth asking, a second-quote comparison, and what to clarify before you approve the work. Free, no signup.",
  seoTitle: "Repair Quote Checker: What Am I Paying For?",
  title: "Quote Check",
  tagline: "Know what you're paying for before you approve the repair.",
  tags: ['repair quote', 'repair estimate', 'quote check', 'mechanic quote', 'car repair quote', 'auto repair estimate', 'appliance repair quote', 'home repair quote', 'repair invoice', 'itemized quote', 'parts and labor', 'repair warranty', 'compare repair quotes', 'second quote', 'second opinion', 'overcharge', 'fair price', 'repair cost', 'quote breakdown', 'before approving repair'],
  icon: "🧾",
  categories: ['Money'],
  headerColor: "#c0d8b8",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Quote Check gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the quote below — an excerpt of a longer result, nothing reworded.",
    sampleLabel: "The quote",
    sampleText: "2016 Ford Focus, 78,000 miles, 9 years old. Went in for an MOT. It failed on a worn brake disc. They rang to say that while it was on the ramp they had also found the rear discs, both front tyres, a leaking shock absorber and a cracked coolant hose, and recommended doing all of it at once. Quoted £1,290. Itemised: front discs and pads, rear discs and pads, two tyres fitted and balanced, one rear shock absorber, coolant hose, four hours labour, MOT retest fee.",
    context: "Real run, 2026-10-08 — one of the tool's own built-in examples, run in pounds.",
    sections: [
      {
        label: "Needs clarification",
        tone: "yellow",
        text: "The itemised breakdown is reasonably detailed and the scope of work is clear, but several material details are absent that would let you properly evaluate the £1,290 total: individual line-item prices are not provided, so you cannot tell how the total is built up, whether the labour rate is as expected, or where the bulk of the cost sits. The quote also covers a wide range of work found during the same ramp inspection, and a few of the items are worth asking about before you approve — not because anything is provably wrong, but because understanding them gives you a better basis for deciding.",
      },
      {
        label: "What the quote does not tell you",
        tone: "neutral",
        items: [
          "No individual line-item prices are given, so you cannot see how the £1,290 breaks down between parts and labour, or identify whether any single item is priced unexpectedly high.",
          "The labour rate per hour is not stated, so you cannot verify whether four hours at that rate accounts for the full total or whether additional charges make up the difference.",
          "Only one rear shock absorber is listed. It is worth asking whether the other rear shock was inspected and what its condition is, so you can make an informed decision about whether to address both now or later.",
          "No warranty terms are stated anywhere in the quote — neither for parts nor labour — which affects your financial exposure if any of the repaired items develops a problem shortly after collection.",
        ],
      },
      {
        label: "Questions to ask",
        tone: "neutral",
        items: [
          "Can you send me a written breakdown showing the price of each item separately — parts and labour — so I can see how the £1,290 is made up?",
          "What warranty do you offer on the parts and labour for this work?",
          "The quote lists one rear shock absorber — was the other rear shock inspected, and what is its current condition?",
          "What make and specification of parts are you using — for example, are the discs and pads OEM or aftermarket?",
        ],
      },
      {
        label: "What to say",
        tone: "green",
        text: "Thanks for the quote. Before I approve the work, could you send me an itemised breakdown showing each part and labour charge separately? I would also like to know what warranty you provide on parts and labour, and what specification of parts you are using. Once I have that detail I can give you the go-ahead.",
      },
    ],
    disclaimer: "Quote Check reads the quote you give it. It cannot see the car or the part, and it does not know local prices, so it tells you what to ask rather than what the job should cost.",
  },
  faq: [
    { q: "How do I know if a repair quote is fair?",
      a: "Ask for it itemised: each part and each labour charge priced separately, the hourly rate, the part specification and the warranty. A fair quote can be explained line by line. Then compare like with like — a second quote for the same scope, not just the same total." },
    { q: "Should I approve extra work a garage finds while the car is in?",
      a: "Ask which items are needed now for safety or the test, and which could wait. Get each one priced on its own, so you can approve the urgent work and decide on the rest later, or get a second quote for it." },
    { q: "Is it rude to ask for a second quote?",
      a: "No. For anything beyond a small job it is normal, and a reputable repairer expects it. Ask the second shop to quote the same scope of work so the two prices are comparable." },
    { q: "Does Quote Check know what my repair should cost?",
      a: "No. It does not look up local prices. It reads the quote — what is itemised, what is missing, whether the arithmetic adds up — and tells you what to ask before you approve." },
  ],
  crossRefs: ['LeverageLogic', 'ContractDecoder', 'ScamRadar'],
  description: "Paste a repair quote for an appliance, vehicle, or other repair — or upload the quote itself. Quote Check checks what the price actually includes, flags questions worth asking, compares a second quote if you have one, and helps you decide what to clarify before approving the work.",
  guide: {
    tips: [
      "Be specific about what you were told — 'they said the compressor is bad' surfaces different questions than 'they didn't really explain it'",
      "A non-itemized lump-sum quote isn't automatically a red flag — it's a reason to ask for a breakdown, which Quote Check will tell you to do",
      "NOT ENOUGH INFORMATION isn't a failure — some quotes are too thin to say anything useful about, and that honesty is the point",
      "If a symptom could plausibly be a safety issue (brakes, gas, electrical), Quote Check will say so plainly without pretending to diagnose it",
      "The script under 'What to Say' is meant to be used as-is — read it back or send it as a text/email",
    ],

  },
},
{
  id: "TicketTackler",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "A parking or camera ticket, before the deadline to contest.",
    give: "The ticket type, your city, and the citation itself or what happened.",
    get: "An honest read on what may matter, what's still uncertain, and whether contesting makes sense.",
    edge: "It starts by telling you to probably just pay it when the facts don't support an appeal, which is most of the time.",
  },
  seoTitle: "Parking Ticket Case Review",
  seoDescription: "Review a parking or red-light camera ticket — what may matter, what to verify, evidence worth getting, and (when it's warranted) a factual appeal letter. Free.",
  title: "Ticket Tackler",
  tagline: "Got a ticket? See what kind of case you actually have.",
  tags: ["parking ticket", "camera ticket", "red light camera", "speed camera", "contest ticket", "appeal ticket", "fight ticket", "dispute parking fine", "citation", "appeal letter", "parking fine", "ticket dismissal", "should i fight this ticket", "parking ticket appeal", "camera ticket appeal", "ticket evidence", "ticket deadline", "traffic citation"],
  icon: "🚦",
  categories: ['Decisions', 'Money'],
  headerColor: "#d9a04e",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-08 so the page shows what the tool does before it is indexed.
  exampleOutput: {
    title: "See what Ticket Tackler gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run on the ticket below — an excerpt of a longer result, nothing reworded.",
    sampleLabel: "The ticket",
    sampleText: "CITY OF SEATTLE — PARKING INFRACTION NOTICE. Violation: SMC 11.23.180 — Parking in passenger load zone. Date: 07/22/2026 Time: 6:40 PM. Location: 1400 block, E Pine St. Penalty: $47. Respond within 15 days of issue date. What happened: The load-zone sign says the restriction runs 'Passenger Load Zone 7AM–6PM'. I parked at 6:40 PM, after the posted end time. The sign is also partially bent behind a tree branch — you can barely read it from the street side.",
    context: "Real run on 2026-10-08, eleven weeks after the ticket date — which is why it starts with the deadline. One of the tool's own built-in examples.",
    sections: [
      {
        label: "May be worth contesting",
        tone: "yellow",
        text: "Your core defense is time-based: you parked at 6:40 PM and the sign posts a restriction of 7AM–6PM. If those posted hours determine when the restriction applies, the citation falls outside the enforcement window. However, the appeal deadline of 15 days from July 22, 2026 was approximately August 6, 2026 — more than two months ago. Before pursuing any defense, you must contact Seattle Municipal Court to check whether the deadline has lapsed and whether a late contest is still available.",
      },
      {
        label: "Evidence to get now",
        tone: "green",
        items: [
          "Your Seattle Municipal Court case record for this citation — check online or call the court. Confirms whether a default has been entered and whether any late-contest avenue still exists.",
          "Photographs of every sign on the 1400 block of E Pine St, both blockfaces, including any RPZ, paid parking, or time-limit signs. Establishes whether the load zone sign reads as the user states and whether any other restriction independently covers 6:40 PM on a Wednesday.",
          "Close-up photograph of the load zone sign, including any bending or obstruction by the tree branch. Documents the posted hours and the legibility issue if the time-based defense or sign-adequacy argument is raised at a hearing.",
        ],
      },
      {
        label: "What still needs checking",
        tone: "neutral",
        items: [
          "Whether the contest deadline has passed and whether any late-response option remains available through Seattle Municipal Court.",
          "Whether any sign on the 1400 block of E Pine St imposes a separate restriction — RPZ or paid parking — that applies at 6:40 PM on a Wednesday.",
        ],
      },
      {
        label: "The appeal letter (excerpt)",
        tone: "neutral",
        text: "I am writing to respectfully request that this citation be dismissed or reviewed on the following grounds.\n\n1. The parking time fell outside the posted restriction hours. The load zone sign at the cited location states a restriction of 7AM–6PM. The citation was issued at 6:40 PM — 40 minutes after the posted restriction ended. If the restriction ended at 6PM as posted, the infraction as cited was issued outside that period.\n\n2. The sign governing this zone was partially obstructed by vegetation and difficult to read from street level. I am prepared to provide photographs documenting the sign's condition at the time of citation.\n\nI respectfully request that this citation be dismissed. I am prepared to provide photographs of the posted sign and the blockface signage in support of these points at any scheduled review.",
      },
    ],
    disclaimer: "Ticket Tackler is not legal advice. It checks the rule on the ticket against what you describe and tells you what to verify; the court or the city decides the outcome.",
  },
  faq: [
    { q: "Is it worth contesting a parking ticket?",
      a: "It can be when you have a specific, checkable defence: the restriction did not apply at that time, the sign was missing or unreadable, the details on the ticket are wrong, or you were legally allowed to be there. A general sense that it was unfair rarely works. Contest before the deadline, with photos." },
    { q: "What evidence helps when appealing a parking ticket?",
      a: "Photos of every sign on the block, taken soon after and showing the posted hours and anything blocking them; a copy of the ticket; and anything showing the time you parked, such as a receipt or a phone photo with its timestamp." },
    { q: "What happens if I miss the deadline to contest a ticket?",
      a: "Rules vary by city and court. Often the fine stands, late fees can be added, and it may go to collections. Some courts still accept a late request in some circumstances, so contact the court that issued it straight away and ask what options remain." },
    { q: "Does Ticket Tackler know my city's parking rules?",
      a: "It researches the rule cited on your ticket for your city and checks each condition of it against what you describe, then says which facts still need verifying. It cannot see the sign or the street, so photos are still what decide most cases." },
  ],
  description: "A ticket isn't automatically worth fighting—or paying. Ticket Tackler helps you understand what the citation says, spot the facts that may matter, gather the evidence worth preserving, and decide whether an appeal makes sense. If it does, it helps you make your case clearly.",
  guide: {
    tips: [
      "Photograph everything today — signage, curb markings, your parked position, meter screens. Evidence can disappear or change, and the tool prioritizes exactly that",
      "The exact wording on the sign matters more than what you remember it meaning — a photo of the sign beats a description of it",
      "Never argue you 'didn't know the rule' — the tool's don't-say list exists because some honest sentences weaken an otherwise supported case",
      "A 'verify first' assessment usually means one specific fact or rule decides it — check that before deciding to pay or contest",
      "Watch the deadline printed on the ticket — a well-supported appeal filed late is worth nothing",
    ],
  },
},

{
  modified: "",
  id: "WhatsThatMean",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "Someone said or wrote something and you're not sure what it actually means.",
    give: "The phrase, and the sentence or conversation around it if you have it.",
    get: "What kind of expression it is, what it means, and what it means here — without guessing at what they were really thinking.",
    edge: "It tells you when the phrase genuinely could mean two different things, instead of picking one.",
  },
  seoDescription: "Heard or read a confusing phrase — an idiom, slang, jargon, or something else? What's That Mean? identifies what kind of expression it is and explains what it means, plainly and in context. Free.",
  seoTitle: "Idiom & Slang Decoder",
  title: "What's That Mean?",
  tagline: "What did they really mean.",
  tags: ["idiom", "slang", "jargon", "metaphor", "euphemism", "phrase meaning", "what does this mean", "what does this phrase mean", "expression", "proverb", "workplace phrase", "regional expression", "cultural reference", "literal or figurative", "plain meaning", "meaning in context", "decode phrase", "language meaning"],
  icon: "💬",
  categories: ['Conversations', 'Learning', 'Work & Meetings'],
  headerColor: "#cfe3e6",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "Discovered – not indexed" page real substance.
  exampleOutput: {
    title: "See what What's That Mean? gives you",
    expandLabel: "See the full real example ↓",
    intro: "Real output from an actual run on the phrase below, unedited.",
    sampleLabel: "The phrase, and where it came up",
    sampleText: "\u201cLet's not boil the ocean.\u201d My manager said this when we were talking about everything we wanted to include in the first version of a project.",
    context: "Real run, 2026-10-07 — the tool's own built-in example.",
    sections: [
      {
        label: "What kind of phrase is it?",
        tone: "neutral",
        items: [
          "Idiom: the phrase carries a fixed figurative meaning that cannot be derived from the individual words.",
          "Metaphor: the deliberately impossible image of boiling an entire ocean is what gives the phrase its force — understanding the image helps the meaning land.",
          "Workplace phrase: used in professional settings to push back on scope creep.",
        ],
      },
      { label: "Plain meaning", tone: "green", text: "Don't try to do everything at once — keep the scope manageable." },
      { label: "What it means here", tone: "green", text: "Your manager is suggesting that the first version of the project should include less, not everything the team has discussed. The implication is: narrow the scope now and add more later." },
      { label: "The tone", tone: "neutral", text: "Mildly cautionary, collegial — it frames a constraint as shared common sense rather than a direct rejection." },
      { label: "Say it plainly", tone: "neutral", text: "Let's not try to include everything in this first version — let's keep the scope realistic." },
      { label: "Why this phrase?", tone: "neutral", text: "The image is deliberately impossible: boiling an entire ocean is a task so vast it could never be completed. That impossibility maps onto the idea of taking on an unrealistically large scope — something that sounds productive but cannot actually be finished." },
    ],
  },
  faq: [
    { q: "What does \u201clet's not boil the ocean\u201d mean?",
      a: "It means don't try to do everything at once — keep the scope manageable. It's an idiom built on an impossible image (no one can boil an ocean), and at work it's usually a gentle way of saying a plan has grown too big. The real example on this page shows the full breakdown What's That Mean? gives for it." },
    { q: "How can I tell whether a phrase is an idiom, slang, or jargon?",
      a: "An idiom has a fixed figurative meaning you can't work out from the words. Slang is informal and often tied to a group or a moment. Jargon is the technical vocabulary of a field and usually means exactly what it says to insiders. What's That Mean? names which kind a phrase is — sometimes more than one — and says why." },
    { q: "Can it explain office phrases like \u201ccircle back\u201d or \u201ctake this offline\u201d?",
      a: "Yes. Workplace phrases are one of the kinds it recognizes. Paste the sentence they appeared in, because the same phrase can be routine in one meeting and pointed in another, and the meaning it gives you is for that situation." },
    { q: "What if a phrase could mean two different things?",
      a: "It says so and lists the possible readings, rather than picking one and sounding sure. It also tells you what extra context would settle it — usually the sentence before, or who said it." },
    { q: "Can it help with phrases from another language?",
      a: "It answers in any of DeftBrain's 13 languages, and it can suggest a phrase in another language that does the same job. When no tidy equivalent exists, it tells you that rather than inventing one." },
  ],
  description: "Heard or read a phrase that doesn't make sense? Enter it—or paste the sentence around it. What's That Mean? tells you whether it's an idiom, slang, jargon, metaphor, euphemism, regional expression, workplace phrase, cultural reference, proverb, or something literal, then explains what it means in plain language and in your context.",
  guide: {
    tips: [
      "Context changes everything — the same words can be literal or figurative depending on the situation, and What's That Mean? classifies the use, not just the words",
      "If it comes back genuinely ambiguous, that's the honest answer, not a failure — add more context to narrow it down",
      "For jargon, it focuses on what the term means and skips manufacturing cultural history or tone that ordinary technical language doesn't have",
      "The cross-language equivalent is honest when nothing tidy exists — it won't invent an idiom just to give you a neat answer"
    ],

  }
},

{
  modified: "2026-09-11",
  id: "SomeoneSaidItBetter",
  // Preamble — the four questions a new visitor has, in order.
  // `give` states the input burden before the form; see ToolPageWrapper.
  primer: {
    when: "You're facing something and your own words for it feel thin.",
    give: "The situation in your own words, what would help, and what kind of voice you want.",
    get: "Two or three real, verified quotations that fit — with why each one connects and a link to check it yourself.",
    edge: "It won't invent a comforting quote. If nothing verifiable fits, it says so instead of manufacturing one.",
  },
  seoDescription: "Facing something hard to put into words? Someone Said It Better finds real, verified quotations that fit your situation — checked against outside sources, never invented. Free.",
  seoTitle: "Find a Quote That Fits",
  title: "Someone Said It Better",
  tagline: "The words you needed, already said.",
  tags: ["quotes", "quotations", "find a quote", "verified quotes", "real quotes", "quote for my situation", "words for what i am going through", "wisdom", "perspective", "comfort", "motivation", "reality check", "witty quote", "famous quotes", "inspiration", "grief quote", "career change quote", "quote attribution", "documented quotation"],
  icon: "📚",
  categories: ['Learning', 'Self & Reflection'],
  headerColor: "#e3eef0",
  // Real output, shown on the page (PublicProductDemo + prerender). Added
  // 2026-10-07 to give this "Discovered – not indexed" page real substance.
  exampleOutput: {
    title: "See what Someone Said It Better gives you",
    expandLabel: "See a real example ↓",
    intro: "Real output from an actual run: two of the three quotations it found, exactly as given.",
    sampleLabel: "The situation",
    sampleText: "My daughter is getting married. I am happy for her, but I want words that capture how big this moment feels.",
    context: "Real run, 2026-10-07 — what would help: comfort; voice: wise. One of the tool's own built-in examples.",
    sections: [
      {
        label: "One to keep",
        tone: "green",
        items: [
          "\u201cWhat greater thing is there for two human souls than to feel that they are joined for life?\u201d — George Eliot, Adam Bede (1859)",
          "Why this one: Eliot's question — 'what greater thing is there' — doesn't answer itself, and that open weight is what makes it fit a moment you've described as simply big. It names the scale without reducing it.",
          "Source checked: Wikisource, a scan of the 1859 first-edition page. From the chapter immediately before 'Marriage Bells,' the novel's wedding chapter.",
        ],
      },
      {
        label: "A different way to see it",
        tone: "neutral",
        items: [
          "\u201cYou are the bows from which your children as living arrows are sent forth.\u201d — Kahlil Gibran, The Prophet (1923)",
          "Why this one: Gibran's image of the bow and the living arrow places you — the parent — at the center of the moment rather than beside it: your role was the launch, and the wedding is the arrow in flight.",
          "Source checked: the public-domain text of 'On Children' from The Prophet.",
        ],
      },
    ],
    disclaimer: "Every quotation it shows has been checked for exact wording and attribution against a source it actually visited, and links to that source so you can check it yourself.",
  },
  faq: [
    { q: "How do I find a quote that fits what I'm going through?",
      a: "Describe the situation in your own words — the more specific, the better the match. Choose what would help (perspective, comfort, courage, a reality check, humor) and, if you like, a voice. Someone Said It Better finds two or three real quotations that fit, and says why each one connects to what you described." },
    { q: "How do I know a quote is real and not made up?",
      a: "Someone Said It Better never writes quotation text itself. It looks for candidate quotations, checks the exact wording and the attribution against a source it actually visits, and shows you that source with a link. If it can't verify enough quotations, it tells you so instead of filling the gap." },
    { q: "Can it find a quote for a wedding toast, eulogy, or retirement speech?",
      a: "Yes. Describe the occasion and who it's for — 'my daughter is getting married and I want words for how big this feels' finds sharper quotations than 'wedding quote'. The real example on this page is that exact situation." },
    { q: "Why are so many famous quotes misattributed?",
      a: "Popular lines get paraphrased as they're shared, and a well-known name often gets attached to someone else's words. That's why it checks each quotation against a source before showing it, and tells you what kind of source that is — the original text, or a reliable reference that documents it." },
    { q: "Why did it give me only two quotes, or none?",
      a: "It shows only quotations it could verify that genuinely fit. Two means a third distinct angle didn't check out cleanly. None means the source check didn't finish in time — trying again in a moment, or rewording the situation, usually works." },
  ],
  description: "Tell us what you're facing in your own words. Someone Said It Better discovers documented real quotations that fit the moment — words of wisdom, comfort, perspective, wit, or hard-earned truth from people who found a way to say it better.",
  guide: {
    tips: [
      "The more specific your situation, the better the match — 'my daughter is getting married and I want to capture how big this feels' finds sharper quotes than 'big life moment'",
      "If it comes back with only 2 quotes instead of 3, that's it being honest that a third genuinely-different angle didn't verify cleanly — not a bug",
      "'Surprise me' as the need and 'Unexpected' as the voice together tend to produce the least predictable, most memorable results",
      "Every quote links to the actual source page — worth clicking, especially for anything you plan to repeat or share"
    ],

  }
},

];
export const getToolById = (id) => {
  return tools.find(tool => tool.id === id);
};