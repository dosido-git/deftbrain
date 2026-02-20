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
   {
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
]}},
**/
export const tools = [

  {
    id: "TheFinalWord",
    title: "The Final Word",
    category: "Social",
    icon: "⚖️",
    description: "The argument-settler your friend group needs. Ask any factual question and get a bold verdict card with confidence rating. Settle disputes by entering both sides — it scores each person's accuracy and declares a winner. Fact-check viral claims with clear TRUE/FALSE/IT'S COMPLICATED rulings. Or fire up Trivia Night mode for rapid-fire rounds with scoring and streaks. Includes voice input for hands-free use mid-argument.",
    tagline: "Arguments settled. Facts checked. No appeals.",

    guide: {
      overview: "The Final Word is a real-time fact-resolver designed for the middle of an argument. Instead of everyone pulling out phones and Googling different things, one person asks The Final Word and gets an authoritative verdict card that settles it. Four modes: Quick Answer for straightforward questions, Settle It for two-sided disputes with accuracy scoring, Fact Check for true/false claims, and Trivia Night for competitive quick-fire rounds with streak tracking.",
      howToUse: [
        "Choose your mode: Quick Answer, Settle It, Fact Check, or Trivia Night",
        "Type your question or tap the microphone to speak it",
        "For disputes, enter both sides — optionally name each person",
        "Read the verdict card with answer, confidence level, and supporting facts",
        "Hit 'Actually...' if you think the answer is wrong — it will review your challenge",
        "Share the verdict card to prove you were right (or gracefully accept defeat)"
      ],
      example: {
        scenario: "You and a friend are arguing about whether the Great Wall of China is visible from space.",
        action: "Open Settle It mode. Enter 'You can see the Great Wall from space' and 'No you can't, that's a myth.' Hit Deliver the Verdict.",
        result: "The Final Word scores the myth-caller at 95% accuracy — the Great Wall is NOT visible to the naked eye from low Earth orbit, despite this being one of the most persistent myths in popular culture. Settlement suggestion: 'Loser buys the next round.'"
      },
      tips: [
        "Voice mode works great mid-conversation — tap the mic, ask your question, get your answer",
        "Settle It mode is most fun when you name the participants — the verdict card calls out the winner by name",
        "Trivia Night keeps track of streaks — see how many you can get in a row",
        "The 'Actually...' button lets you challenge any verdict if you think you know better — it's reviewed fairly"
      ]
    }
  },  {
    id: "NameStorm",
    title: "NameStorm",
    category: "Creative",
    icon: "🌪️",
    description: "AI-powered name generation with two modes: Generate creates 16-25 names across 15 style categories with linguistic problem flagging, and Blend takes your seed words, expands them into synonym clouds, then systematically creates portmanteaus using 8 blending strategies. Both modes include Domain Name generation with TLD pairing, primary audience language targeting for 11 languages, live domain and social handle checks, and 'More Like This' variations.",
    tagline: "Name anything. Know it works before you commit.",

    guide: {
      overview: "Naming things is hard because you need creativity, cultural awareness, and practical validation all at once. NameStorm has two modes. Generate mode creates 16-25 names across the style categories most relevant to what you're naming, with pronunciation guides, Name DNA, problem flags, and AI-curated Top 5 picks. Blend mode takes 2-4 seed words, expands each into 8-12 synonyms and related words, then systematically creates portmanteaus using strategies like Overlap Blends, Prefix Swaps, Syllable Mashups, and Sound Bridges. Both modes support Domain Name generation (where the TLD is part of the creative act), primary audience language targeting (generate names that resonate with Spanish, Mandarin, Japanese, Korean, or 7 other language audiences first), live domain and social handle availability checks, and a More Like This button for variations.",
      howToUse: [
        "Choose your mode: Generate (surprise me with names) or Blend (combine my ingredients)",
        "GENERATE: Select what needs a name, choose vibe chips, and optionally set constraints and industry context",
        "GENERATE > DOMAIN NAME: Select Domain Name category to generate complete domains with deliberately chosen TLDs, verbal shareability analysis, and email appearance previews",
        "BLEND: Enter 2-4 seed words or concepts. The AI expands each into a cloud of synonyms before blending across the entire pool",
        "BLEND > DOMAINS: Toggle 'Pair blends with domain TLDs' to get complete domains from your blended words",
        "Set primary audience language to any of 11 languages to generate names that resonate with speakers of that language first",
        "Review Top Picks for the AI's curated best choices, and Say It Out Loud for phonetic traps",
        "Star favorites, check domain availability, and use More Like This on names you almost love",
        "Take your top candidates to NameAudit for deep 12-dimension analysis and head-to-head comparison"
      ],
      example: {
        scenario: "You're building a consumer AI tool that helps non-technical people be more productive. You want a domain name that feels sophisticated but approachable. You also want to explore portmanteaus from your core concepts.",
        action: "First, use Generate mode with Domain Name category, vibes 'Sophisticated + Warm + Friendly', industry 'Consumer AI tools.' You get domains like deft.now, keen.me, claro.app. Then switch to Blend mode, enter seeds 'clever', 'toolkit', 'assist', toggle domain pairing on. The AI expands 'clever' into {deft, savvy, sharp, keen, nimble...}, 'toolkit' into {kit, gear, craft, forge, hub...}, 'assist' into {aid, guide, help, boost, lift...}, then blends across all three clouds.",
        result: "Generate mode surfaces 20 domains across 5 style categories with TLD rationale, email appearance, and verbal form for each. Blend mode produces 20+ portmanteaus like 'Deftkit', 'Savvicraft', 'Keenforge', 'Aidcraft' -- each showing the blend recipe, pronunciation, and Name DNA. You star your favorites from both modes, check domain availability, and take the top 4 to NameAudit Compare for the final decision."
      },
      tips: [
        "Blend mode's real power is the synonym expansion -- entering 'clever + toolkit' actually blends across 20+ words you didn't think of",
        "In Domain Name mode, the TLD is part of the creative act: 'fix.now' reads as a command, 'savvy.app' signals tech. Don't just think of TLDs as suffixes",
        "Set primary audience language before generating -- naming a business for Spanish speakers produces fundamentally different (and better) results than English names with Spanish flavor",
        "The More Like This button is the most powerful feature -- when you see a name you 70% love, use it to find the one you 100% love",
        "Domain checks use DNS lookups -- 'likely available' means no DNS record found, but always confirm with a registrar (like Porkbun) before purchasing",
        "Problem flags check major world languages -- a clean flag means no issues found, but consider checking with native speakers for important names",
        "Use Generate mode for open-ended exploration and Blend mode when you already know the concepts you want combined",
        "Take your top candidates to NameAudit (especially Domain Name mode) for the deep dive before committing"
      ]
    }
  },
    {
    id: "NameAudit",
    title: "NameAudit",
    category: "Creative",
    icon: "🔍",
    description: "The deepest name analysis you can get without hiring a naming agency. Stress-tests any name across 12 dimensions: phonetics, memorability (including the drunk test), global language scan for unintended meanings, visual analysis, radio test, SEO, competitive landscape, longevity, and emotional resonance. A dedicated Domain Name mode adds TLD analysis, browser bar test, typosquatting risk, verbal sharing rating, and email address test. Includes live domain and social handle availability checks. Also has a head-to-head Compare mode for choosing between finalists.",
    tagline: "Stress-test any name before you commit",

    guide: {
      overview: "NameAudit is the other half of the naming problem. NameStorm gives you ideas; NameAudit tells you if they're any good. Enter a name you're considering and get a 12-dimension analysis: first impression, phonetic profile (mouth feel, sound psychology, accent compatibility), five memorability tests (day-after, tell-a-friend, phone, drunk, and shout), radio test (can someone spell it from hearing it?), visual analysis (how it looks in different cases, as a URL, as a logo), global language scan across 15+ languages, abbreviation audit, competitive landscape, SEO outlook, longevity check, and emotional resonance. For business and product names, live domain and social handle availability checks run automatically. Choose the Domain Name mode to analyze full domains like 'deft.now' or 'savvy.app' — the prompt is engineered specifically for URLs, with TLD trust analysis, .com competition risk, browser bar appearance, typosquatting vulnerability, verbal sharing difficulty, and email address viability. Use Compare mode to pit 2-4 finalists against each other for a clear winner — it works for both regular names and domain names.",
      howToUse: [
        "Choose Analyze (single name) or Compare (2-4 names head to head)",
        "Enter the name and select what it's for — Business, Product, Domain Name, Pet, Baby, etc.",
        "For domain names, enter the full domain including TLD (e.g., deft.now, savvy.app, miao.me)",
        "Optionally add industry context and target audience for sharper analysis",
        "Review the overall grade and verdict — STRONG, GOOD, FAIR, WEAK, or RECONSIDER",
        "Check Strengths vs. Weaknesses at a glance, and watch for any Deal Breakers",
        "Expand each analysis section for deep detail — phonetics, memorability tests, language scan, etc.",
        "For domain names, check the TLD Analysis and Domain-Specific Tests sections for URL-focused insights",
        "For business names, scroll to Live Availability to see domain and social handle status",
        "Use the suggestions section for guidance on strengthening the name or pivoting direction"
      ],
      example: {
        scenario: "You've narrowed your domain shortlist to 'deft.now' for a consumer AI tools site. Before committing, you want to know if the domain works as a URL — will people type the right TLD? Who owns deft.com? How does it sound on a podcast?",
        action: "Enter 'deft.now' in Analyze mode, select Domain Name, industry: 'Consumer AI tools,' target audience: 'Mainstream non-technical users.'",
        result: "NameAudit runs the full domain analysis. TLD Analysis flags that .now is novel and users may default to .com. The Radio Test highlights that 'deft dot now' requires clarifying the TLD. The Browser Bar Test shows it reads cleanly. The Email Test rates hello@deft.now as professional but unusual. Domain checks reveal whether deft.com is taken and by whom. The Verbal Sharing rating and Typosquatting risk give you concrete data for the decision."
      },
      tips: [
        "NameAudit and NameStorm are designed to work together — generate candidates with NameStorm, then bring your top 3 here to analyze and compare",
        "Use Domain Name mode for actual URLs — it evaluates TLD trust, .com competition, and how people will type, share, and mistype the address",
        "The global language scan checks 15+ languages — if you're going international, this section alone could save you from an expensive mistake",
        "Pay special attention to the Radio Test — for domain names this is the #1 test: can someone hear it on a podcast and type the correct URL including TLD?",
        "Compare mode gives a definitive winner — use it when you're stuck between domain finalists to see TLD risk ratings side by side",
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

    guide: {
      overview: "The Gratitude Debt Clearer helps you convert bullet points of appreciation into polished thank-you messages. Instead of staring at a blank page wondering how to start, just list what you're grateful for and let AI craft 2-3 message options that sound like you, not a greeting card. Built specifically for people who feel gratitude deeply but struggle with the formality of expressing it in writing.",
     tagline: "Helps you convert bullet points into polished thank you.",
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
    id: "DifficultTalkRehearser",
    title: "Difficult Talk Rehearser",
    category: "Communication",
    icon: "🗣️",
    description: "A conversation flight simulator for hard talks. Analyzes the emotional dynamics, maps the moments most likely to derail you, generates multiple scripted approaches with anticipated responses, then lets you practice the conversation live against an AI playing the other person — with real-time coaching after each exchange. Come back after the real conversation for a debrief.",
    tagline: "Rehearse hard conversations before they happen",

    guide: {
      overview: "Most difficult conversations fail not because of what you planned to say, but because of how you react when they say something you didn't expect. This tool prepares you in three phases: Prepare (situation analysis, emotional landmine mapping, multiple scripted approaches with anticipated responses), Practice (interactive simulation where the AI plays the other person at your chosen resistance level, with coaching after each exchange), and Debrief (come back after the real conversation for constructive feedback comparing what you planned vs. what happened).",
      howToUse: [
        "Describe the conversation you need to have — the more specific you are, the better your strategy",
        "Select who it's with, your goals, their expected resistance level, and your communication style",
        "For a much stronger strategy: fill in what you're most afraid they'll say, their likely perspective, and any previous attempts",
        "Review the Situation Reading to understand their mindset and likely defense mechanisms",
        "Study the Emotional Landmines — these are the moments that will derail you if you're not ready",
        "Choose a conversation approach, practice the opening out loud, and review the anticipated responses",
        "Switch to the Practice tab to run the conversation live — the AI responds in character with real-time coaching",
        "After the real conversation, use the Debrief tab to process what happened and identify growth areas"
      ],
      example: {
        scenario: "You need to tell your boss that a coworker is taking credit for your work. You're afraid your boss will think you're being petty or a 'bad team player,' and the coworker has more seniority.",
        action: "Describe the situation, select Boss, set resistance to 60%, goals: 'Give feedback' and 'Request a change.' In the optional fields: biggest fear = 'They'll tell me to just let it go,' their perspective = 'My boss values team harmony and may not want to pick sides,' previous attempts = 'Hinted once but my boss changed the subject.'",
        result: "You get: a Situation Reading noting your boss likely prioritizes team stability over individual credit disputes. 4 emotional landmines including 'That's just how collaboration works' with strategic responses. 3 approaches from documentation-based (come with specific examples) to direct (name the pattern). Each includes 6-8 anticipated responses with emotional triggers flagged. Then you practice the conversation live — the AI-as-boss pushes back realistically while a coach helps you refine your delivery in real time."
      },
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
  id: 'PlainTalk',
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
    category: "Neurodivergent Support",
    icon: "🎧",
    description: "AI designs a personalized focus soundscape from your task, environment, and sensory needs — then plays it right in your browser with a full layer mixer.",
    tagline: "Custom soundscapes that actually play",
    route: "focus-sound-architect",
    component: "FocusSoundArchitect",

    guide: {
      overview: "Tell the AI what you're working on, where you are, and what sounds you like. It designs a multi-layer soundscape tailored to your focus needs, then synthesizes it live in your browser using Web Audio — no downloads, no external files. Adjust each layer's volume in real time with the built-in mixer. Especially useful for users who need specific audio environments to concentrate.",

      howToUse: [
        "Pick your task type (deep work, creative, studying, relaxing, etc.)",
        "Select your environment so it can calibrate masking intensity",
        "Choose sound types you like — the AI picks the best combination and volumes",
        "Optionally set your energy goal and note any sensory sensitivities",
        "Hit Generate & Play — your soundscape starts automatically",
        "Use the layer mixer to fine-tune each sound in real time"
      ],

      example: {
        scenario: "You're studying in a noisy open-plan office, prefer brown noise and rain, are sensitive to high frequencies, and want a calm energy level.",
        action: "Task: Studying, Environment: Open Plan, Sounds: Brown Noise + Rain, Sensitivity: High frequency sensitive, Energy: 25/100 (Calm).",
        result: "AI generates 3 layers: deep brown noise foundation at 65% for speech masking, gentle rain at 40% for organic texture, and 6Hz theta binaural beats at 20% for relaxed focus. Each layer has its own volume slider. Adjustment guide tells you to lower rain if patter becomes distracting after 30 minutes."
      },

      tips: [
        "Use headphones for binaural beats — they only work with separate left/right ear channels",
        "Start with the AI's suggested volumes, then adjust after 5 minutes once your ears adapt",
        "Lower energy goals pair well with brown noise and ocean; higher goals with pink noise and café",
        "Hit Regenerate to get a different combination with the same preferences",
        "The master volume controls overall loudness without changing the layer balance"
      ],

      pitfalls: [
        "Selecting too many sound preferences — the AI works best with 2-4 types to choose from",
        "Setting all layer volumes to 100 — subtlety makes better soundscapes",
        "Forgetting to note sensitivities — if high-pitched sounds bother you, say so"
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
    id: "FocusSoundArchitect",
    title: "Focus Sound Architect",
    category: "productivity",
    icon: " 🎧",
    description: "Generate personalized soundscapes for concentration based on your task, environment, and sensory needs. Creates custom mixes of white/pink/brown noise, nature sounds, binaural beats, and ambient music. Get sound layering recipes with individual volume controls and specific personalized tips.",
  tagline: "No tag yet.",
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
  id: 'BrainRoulette',
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
  id: 'WardrobeChaosHelper',
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
  id: 'PlantRescue',
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
// ConflictTextCoach-metadata.js
{
  id: "ConflictTextCoach",
  title: "Conflict Text Coach",
  description: "Received a tense message? Don't respond reactively. Get de-escalating response suggestions, emotional analysis, and thoughtful strategies. Prevents regrettable texts.",
  tagline: "Stop, breathe, and craft the right response",
  category: "Communication",
  icon: "📱",
  gradient: "from-yellow-500 to-orange-600",
  featured: true,
  guide: {
    overview: "The Conflict Text Coach helps you respond to tense, upsetting, or confrontational messages without escalating. Paste the message you received, and get emotional analysis, multiple response strategies (validate, set boundaries, disengage gracefully), and warnings about what NOT to say. Built for people who freeze during conflict, escalate when defensive, or struggle to read tone. Includes cooling-off timers and repair strategies.",
    
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
  // DifficultTalkRehearser-metadata.js
   {
    id: "DifficultTalkRehearser",
    title: "Difficult Talk Rehearser",
    category: "Communication",
    icon: "🗣️",
    description: "Practice scripts and strategies for challenging conversations. Get multiple strategic approaches with specific phrases, predicted responses, and counter-scripts. Includes emotional grounding techniques and preparation steps. Built for anyone who finds difficult conversations anxiety-inducing.",
    tagline: "Practice hard conversations before they happen",

    guide: {
      overview: "The Difficult Talk Rehearser helps you prepare for hard conversations by generating multiple strategic approaches with exact scripts, predicted pushback, and counter-responses. Whether you need to set a boundary, request a change, address conflict, or give feedback, you'll get concrete phrases to use, body language tips, and emotional regulation strategies. Perfect for preparing conversations with partners, family, friends, bosses, coworkers, or employees.",
      howToUse: [
        "Describe the difficult conversation you need to have - be specific about what you need to discuss",
        "Select your relationship to the person (Partner, Family, Friend, Boss, Coworker, Employee)",
        "Choose your preferred communication style (Direct, Indirect, Collaborative, or Assertive)",
        "Use the slider to indicate how much resistance you expect (from minimal pushback to major conflict)",
        "Check all conversation goals that apply: set boundary, request change, address conflict, give feedback, or ask for something. Click 'Rehearse This Conversation' to get 3-4 strategic approaches with exact scripts, anticipated responses, emotional preparation techniques, and follow-up plans"
      ],
      example: {
        scenario: "You need to tell your roommate that their late-night noise is affecting your sleep and work performance. You're worried they'll get defensive because they've been dismissive about it before.",
        action: "Enter 'I need to ask my roommate to be quieter after 11pm because it's affecting my sleep and work', select 'Friend' relationship, choose 'Collaborative' style, set resistance slider to 60%, check 'Set a boundary' and 'Request a change' goals.",
        result: "You receive 4 approaches: Direct & Clear ('I need to talk about the noise after 11pm'), Gradual Build ('I wanted to check in about our living situation'), Collaborative Problem-Solving ('Can we brainstorm solutions for the noise issue?'), and Boundary-Setting ('I need quiet after 11pm to function'). Each includes exact opening/closing phrases, anticipated pushback like 'You're being too sensitive' with counter-scripts, body language tips, grounding techniques, and a follow-up plan."
      },
      tips: [
        "Practice the opening line out loud 3-5 times before the actual conversation - hearing yourself say it reduces anxiety and helps you sound more natural",
        "Choose the approach that feels most authentic to you, not the one you think you 'should' use - forced approaches come across as inauthentic",
        "Use the grounding technique (deep breath: in for 4, hold for 4, out for 6) right before starting the conversation to activate your calm nervous system",
        "Remember the exit strategy if you get overwhelmed - it's okay to pause and say 'I need a moment to collect my thoughts, can we continue in 5 minutes?'"
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
  {
    id: "MedsCheck",
    title: "MedsCheck",
    category: "Health",
    icon: "💊",
    description: "Simple 'Red/Green' light for drug and alcohol interactions.",
    tagline: "Simple medication tracking and interaction alerts",
    
    guide: {
      overview: "MedsCheck gives you instant red/yellow/green warnings about drug interactions and alcohol mixing. No medical jargon, just clear 'safe' or 'dangerous' guidance.",
      
      howToUse: [
        "Add your current medications",
        "Enter what you're about to take (new med or alcohol)",
        "See instant color-coded warning",
        "Green = safe, Yellow = caution, Red = don't mix",
        "Read simple explanation if yellow/red"
      ],
      
      example: "Taking antibiotic. Want to drink at party. Enter 'alcohol' into MedsCheck. Red warning: 'Dangerous interaction - can cause severe nausea and reduce effectiveness.' Don't drink tonight.",
      
      tips: [
        "Always check before mixing ANY medication with alcohol",
        "Update your med list when prescriptions change",
        "When in doubt, don't mix - ask a pharmacist"
      ]
    }
  },  
  {
    id: "SafeSpace",
    title: "SafeSpace",
    category: "Health",
    icon: "🏠",
    description: "Timestamps trigger warnings in movies so you can skip safely.",
    tagline: "Skip triggering scenes in movies with confidence",
    
    guide: {
      overview: "SafeSpace provides exact timestamps of potentially triggering content in movies/shows (violence, sexual assault, self-harm, etc.). Skip scenes that might be harmful while still enjoying the rest.",
      
      howToUse: [
        "Search for the movie/show you want to watch",
        "Review the trigger warnings and their timestamps",
        "Note timestamps of scenes you want to skip",
        "Watch the movie, skip forward when timestamps approach",
        "Submit timestamps for content you notice to help others"
      ],
      
      tips: [
        "Set alerts 30 seconds before timestamp so you have time to skip",
        "Can filter by trigger type if only avoiding specific content",
        "Community-submitted so coverage varies - newer content may be incomplete"
      ]
    }
  },
  
  {
    id: "MoodMusic",
    title: "MoodMusic",
    category: "Health",
    icon: "🎵",
    description: "Generates binaural beats tuned to alpha waves for focus.",
    tagline: "Binaural beats tuned to your focus state",
    
    guide: {
      overview: "MoodMusic creates custom binaural beat tracks designed to induce specific brain states (focus, relaxation, sleep) using scientifically-researched frequencies.",
      
      howToUse: [
        "Select desired state (focus, relaxation, sleep, creativity)",
        "Choose session length (15-60 minutes)",
        "Put on headphones (required for binaural beats to work)",
        "Play the generated track",
        "Let the frequencies guide your brain state"
      ],
      
      tips: [
        "Headphones required - binaural beats need stereo separation",
        "Start with 15-minute sessions, work up to longer",
        "Use focus mode while studying, relaxation mode before bed",
        "Doesn't work for everyone - try 3-5 sessions before judging"
      ]
    }
  },
  // FreezeStateUnblocker-metadata.js
{
  id: "FreezeStateUnblocker",
  title: "Freeze State Unblocker",
  category: "Mind & Energy",
  icon: "❄️",
  description: "Get unstuck when completely frozen by depression, anxiety paralysis, or task paralysis. Ultra-minimal interface - just click 'I'm stuck' and get one tiny physical action at a time. No decisions, no planning, no problem-solving. Just: stand up, drink water, look out window. Physical movement breaks the freeze. Permission to stop after any step. Zero judgment. For freeze states, shutdowns, and complete paralysis where even starting feels impossible.",
  tagline: "Get unstuck when you're completely frozen",

  guide: {
    overview: "Freeze State Unblocker is for when you're completely stuck and can't start anything. Not 'I'm procrastinating' stuck - FROZEN stuck. Depression freeze. Anxiety freeze where even tiny decisions feel impossible. The tool removes ALL decision-making and gives you ONE ultra-specific micro-action at a time: 'Stand up.' That's it. You do it. Click 'I did it.' Get next action: 'Walk to kitchen.' Physical movement first - signals brain to shift states. No complex forms. No planning. No solving the whole problem. Just: click button, do tiny thing, click 'next.' Can stop after any step. Zero judgment. The goal isn't productivity - it's MOVEMENT. Break the freeze.",
    
    howToUse: [
      "WHEN FROZEN: Click the single 'I'm stuck' button. That's the only decision you make.",
      "OPTIONAL: If you can, type what you're stuck on ('laundry', 'email', 'leaving house'). If you can't, skip it. The tool works either way.",
      "GET FIRST ACTION: See ONE micro-action. Example: 'Stand up from where you are sitting.' Nothing else. Just that.",
      "DO IT: Stand up. That's all. You don't have to do anything else.",
      "CLICK 'I DID IT': This advances to next micro-action.",
      "REPEAT: Get next tiny action ('Walk to kitchen'), do it, click 'I did it.'",
      "PHYSICAL FIRST: First 3-5 actions are physical movement (stand, walk, drink water, look outside) - breaks freeze state.",
      "NO DECISIONS: Tool tells you exactly what to do. No choices. No planning.",
      "PERMISSION TO STOP: After any step, you can be done. Tool explicitly gives permission. You moved - that matters.",
      "IF STILL STUCK: Click 'Still stuck' and get EVEN SMALLER steps. Can't stand up? 'Wiggle your toes.' Can't do that? 'Blink three times.'"
    ],
    
    example: {
      scenario: "You've been sitting on the couch for 3 hours. You need to do laundry but can't move. Depression freeze. Even thinking about the steps (gather clothes, sort, go to laundry room, etc.) feels overwhelming and impossible. You can't start.",
      action: "Click 'I'm stuck' button. Type 'laundry' in optional box (or leave blank). Click submit.",
      result: "ACKNOWLEDGMENT: 'You're stuck and that's real. Let's just do one tiny thing. You don't have to do the laundry right now. Just this one thing.' FIRST ACTION: 'Stand up from where you are sitting. Time: 5 seconds. Why this helps: Physical movement signals your brain to shift states. You don't have to do anything else.' You stand up. Click 'I did it.' NEXT ACTION: 'Walk to the kitchen or bathroom. Completion signal: You moved to a different room.' You walk to kitchen. Click 'I did it.' NEXT ACTION: 'Get a glass of water and drink it. Completion signal: You drank some water.' You drink water. Click 'I did it.' NEXT ACTION: 'Look out a window for 30 seconds. Find a window. Look outside. Count to 30.' You look outside. Click 'I did it.' NEXT ACTION: 'Name 3 things you can see outside. Say them out loud or in your head.' You do it. Click 'I did it.' CHECK-IN: 'How are you feeling now? Better/Same/Worse?' [You pick 'Better'] RESPONSE: 'Great. The freeze is breaking. Here's the tiniest next thing for laundry: Walk toward where dirty clothes are. Don't pick them up. Don't think about sorting. Just walk toward them. Completion signal: You can see the dirty clothes.' You walk toward laundry pile. Click 'I did it.' NEXT: 'Pick up ONE item of clothing. Just one. You don't have to do more.' You pick up one shirt. Click 'I did it.' NEXT: 'You moved. You did something. You can stop now if you want - you broke the freeze. OR continue: Put that one item in laundry basket. Your choice.' PERMISSION: You can be done. You moved from complete freeze to picking up a shirt. That's real progress."
    },
    
    tips: [
      "USE WHEN COMPLETELY FROZEN - not when procrastinating. This is for paralysis, not motivation.",
      "PHYSICAL ACTIONS FIRST - always start with movement (stand, walk, drink). Don't skip to task.",
      "ONE THING AT A TIME - close your eyes between steps if needed. Just do the one thing.",
      "DON'T PLAN AHEAD - don't think about step 5 while on step 1. Tool removes planning.",
      "PERMISSION TO STOP - you can quit after ANY step. Tool explicitly allows this. No failure.",
      "NO JUDGMENT - being stuck is not weakness. Depression is not laziness. Shutdown is real.",
      "'I did it' button is crucial - clicking it gives dopamine hit, signals completion, allows next step.",
      "IF ACTIONS TOO BIG - click 'Still stuck' for even smaller steps. 'Stand up' → 'Sit up straight' → 'Move one hand.'",
      "GROUNDING ACTIONS HELP - 'name 3 things you see' reconnects you to present moment.",
      "TASK-SPECIFIC STEPS come AFTER physical unsticking - first break freeze, then tiny task steps.",
      "IT'S OKAY TO NOT FINISH - the goal is MOVEMENT, not completion. Moving from freeze = success."
    ],
    
    pitfalls: [
      "Don't skip physical movement steps - 'I'll just start the task' usually leads back to freeze. Do the standing/walking/water first.",
      "Don't add your own steps - tool's job is to remove decisions. Trust the sequence even if seems weird.",
      "Don't judge yourself for being stuck - shame reinforces freeze. Tool explicitly gives permission to struggle.",
      "Don't use this for procrastination - this is for FREEZE states (executive dysfunction, depression paralysis, shutdown). Different from 'I don't feel like it.'",
      "If you can't do a step, don't force it - click 'Still stuck' for smaller version. Can't stand? 'Shift your weight.' Can't drink water? 'Take one sip.'",
      "Don't plan the whole task while doing micro-steps - defeats the purpose. Just do the one thing in front of you.",
      "Don't use complex forms or settings - if tool asks for info you can't provide, skip it. The 'I'm stuck' button alone is enough.",
      "Stopping after 3 steps isn't failure - you moved. That's the win. You don't owe anyone completion.",
      "Don't wait until freeze is extreme - use tool at first sign of paralysis. Easier to break early freeze than deep freeze.",
      "Multiple uses per day is fine - freeze can come back. Tool is available every time."
    ]
  }
},
// SocialBatteryForecaster-metadata.js
{
  id: "SocialBatteryForecaster",
  title: "Social Battery Forecaster",
  category: "Mind & Energy",
  icon: "🔋",
  description: "Predict when you'll need alone time based on upcoming social obligations. Input events (meetings, parties, dinners), get energy depletion forecast with battery visualization showing when you'll hit empty. AI calculates energy cost per event based on: group size, unfamiliarity, your role (hosting vs attending), can you leave early, masking requirements. Warns BEFORE burnout with recommended recovery slots. Includes permission statements ('It's okay to leave early', 'Declining now prevents canceling everything later'). Prevents social overcommitment by showing weekly capacity (e.g., 'You're at 85% capacity - be very selective'). Built for introverts, autistic individuals (masking exhausts), social anxiety, people who say yes then regret it. Treats social energy as limited resource requiring budget.",
  tagline: "Predict when your social energy will run out",

  guide: {
    overview: "Social Battery Forecaster treats social energy like a phone battery that drains throughout the week and needs recharging. You input upcoming social events (work meetings, parties, dinners, family gatherings), and the tool predicts exactly when your social battery will hit critical levels. Each event has an energy cost calculated from: number of people, how well you know them, your role (hosting drains more than attending), noise level, whether you can leave early, masking requirements (for autistic/neurodivergent folks). The tool shows a visual battery draining across the week, warns 'Wednesday: BURNOUT RISK - 15% battery' BEFORE you crash, recommends recovery windows ('Monday evening: 3 hours alone time needed'), and gives permission statements ('It's okay to cancel Friday' or 'Declining now prevents canceling everything later'). Also shows weekly energy budget: if you're at 85% capacity committed, you only have 15% left - be very selective about new invites. Prevents the cycle: say yes to everything → get overwhelmed → cancel last minute → feel guilty.",
    
    howToUse: [
      "ONE-TIME SETUP: Set your energy type on slider (extreme introvert to extrovert). Select recharge activities (alone time, nature, reading, sleep). Set minimum recharge hours needed between events.",
      "ADD EVENTS: Click 'Add Event', enter upcoming social obligations. For each: name ('Team meeting', 'Sarah's birthday party'), date/time/duration, event type (work meeting, social gathering, family, 1-on-1, group, party, networking), number of people, your role (hosting/attending/presenting/observing), can you leave early (yes/no).",
      "VIEW FORECAST: See battery visualization showing depletion across week. Monday starts 100%, meeting costs 15% (85% after), lunch costs 25% (60% after), by Monday evening you're at 35% - LOW ENERGY warning.",
      "CHECK WARNINGS: Tool flags burnout risk dates in red. 'Wednesday: No recovery between Tuesday dinner and Wednesday event - battery at 15% - CANCEL or RESCHEDULE one event.'",
      "RECOVERY PLAN: Tool recommends specific recharge windows. 'Tuesday night: Need 4 hours minimum alone time before Wednesday. Activities: Reading at home (based on your preferences). No social media, no calls.'",
      "ENERGY BUDGETING: See weekly capacity bar. 'Weekly capacity: 100%. Already committed: 85%. Available for new events: 15%. Reality check: You're at 85% - be VERY selective about new commitments.'",
      "PERMISSION STATEMENTS: Tool gives explicit permission. 'It's okay to: Leave the party early. Say no to Friday's event. Take Saturday completely off. Reframe: Declining now prevents canceling everything later.'",
      "EVENT EVALUATOR: For new invites, click 'Should I go?' Input event details, tool calculates if you have capacity. 'Friday party costs 80%. You only have 15% available. Recommendation: DECLINE. You'll be at 15% battery by Friday - this will drain you completely.'",
      "DECLINE MESSAGES: If tool recommends declining, click 'Generate decline message' for polite script. 'Thanks for the invite! I need to recharge this week. Rain check?'",
      "TRACK ACTUAL: After events, log how drained you actually felt (1-10). Tool learns your patterns. 'Large parties drain you 20% more than predicted - adjusting future forecasts.'"
    ],
    
    example: {
      scenario: "You're an introvert. It's Monday. You have: Tuesday 10am team meeting (8 people, 1 hour), Tuesday 7pm dinner with 3 friends (2 hours, one friend you don't know well), Wednesday 6pm work networking event (30+ people, you're presenting, 2 hours), Thursday 12pm coffee with close friend (1 person, 1 hour), Friday 8pm birthday party (15 people, you're hosting, 4 hours). You currently feel at 90% energy. You recharge with alone time and need minimum 3 hours to recover.",
      action: "Add all 5 events to Social Battery Forecaster with details. Set energy type to 'Introvert' (30% on slider). Set recharge: alone time, 3 hours minimum. Click 'Generate Forecast.'",
      result: "ENERGY FORECAST: Monday: 90% start. Tuesday 10am: Team meeting costs 15% (8 people, familiar, attending not hosting) = 75% after. NO RECOVERY TIME (only 9 hours). Tuesday 7pm: Dinner costs 30% (unfamiliar person +10%, group of 3 +15%, restaurant setting +5%) = 45% after. ⚠️ WARNING: Low battery. RECOVERY NEEDED: Tuesday night, 4 hours minimum alone time. Wednesday 6pm: Networking event costs 50% (30+ people +20%, presenting +15%, unfamiliar people +10%, can't leave early +5%) = NEGATIVE 5% if you go without recovery. 🚨 BURNOUT RISK. Battery will be at -5% = COMPLETELY DRAINED. Thursday coffee: Would cost 10% but you'll be too depleted. Friday party: Would cost 60% (hosting +20%, 15 people +15%, 4 hours long +15%, unfamiliar guests +10%) but IMPOSSIBLE - you'll be in burnout. WARNINGS: Wednesday is CRITICAL. No recovery between Tuesday dinner and Wednesday event. Prediction: You'll hit 0% on Wednesday and cancel or perform poorly. Thursday and Friday are IMPOSSIBLE without intervention. RECOMMENDATIONS: (1) CANCEL Tuesday dinner OR Wednesday networking - you cannot do both. (2) If keeping both, schedule 5+ hours alone time Tuesday night (more than your minimum 3 hours due to severe depletion). (3) DECLINE Friday hosting - you will NOT have capacity. Suggest co-hosting instead. (4) Keep Thursday coffee - it's low-cost and with close friend (recharging, not draining). ENERGY BUDGETING: Weekly capacity 100%. Already committed: 165% (!!) You're OVERCOMMITTED by 65%. This is unsustainable. PERMISSION STATEMENTS: It's okay to: Cancel Tuesday dinner (your friends will understand). Decline the networking event (your career won't suffer from missing one event). Cancel Friday party hosting (birthdays can be rescheduled). Take the entire weekend off social obligations. REFRAME: Canceling one event now prevents canceling ALL events later from burnout. Protecting your energy IS self-care, not selfishness. RECOVERY PLAN: If you cancel Tuesday dinner: Tuesday night 3 hours alone time gets you to 70% for Wednesday (manageable). Wednesday night 4 hours alone gets you to 60% for Thursday. Post-Thursday 2 hours alone gets you to 70% for Friday. But Friday hosting STILL costs 60% leaving you at 10% for weekend - NOT recommended. Better plan: Cancel Tuesday dinner AND decline Friday hosting. Then: Tuesday night 3 hours alone → 70% Wednesday. Wednesday night 4 hours alone → 60% Thursday. Thursday is low-cost (50% after). Friday take fully OFF → recharge to 80%. Saturday recharged and available. DECLINE MESSAGE for Friday: 'I'm so honored you want me to host, but I'm hitting my social limits this week. Can we do something smaller/co-host/reschedule to next month when I have more energy? I want to be present, not drained.' SHOULD I GO analysis for Wednesday networking: Base cost 50%. Your current projected battery: 45%. After event: -5%. Recommendation: DO NOT GO. You're at capacity. Alternative: Can you attend for 30 minutes only? Reduces cost to 25% = 20% battery after (low but survivable). Or: SKIP this one. One networking event won't make or break your career, but burnout will."
    },
    
    tips: [
      "SET UP HONESTLY - if you're an extreme introvert, don't set slider to moderate because you 'should' be more social. Tool needs truth to help you.",
      "COUNT MASKING ENERGY - if you're autistic/neurodivergent, any event where you mask (work meetings, unfamiliar people) costs MORE. Add 10-20% to base cost mentally.",
      "SMALL GROUPS ≠ LESS DRAINING - 1-on-1 with someone you don't know well can drain MORE than group with close friends. Number of people isn't the only factor.",
      "HOSTING DRAINS DOUBLE - you're managing space, food, conversations, cleanup. Hosting a 10-person party costs more than attending a 20-person party.",
      "CAN'T LEAVE EARLY = HIGHER COST - being trapped at an event adds anxiety and drains faster. Events you can leave freely cost less.",
      "RECOVERY BETWEEN EVENTS MATTERS - two events in one day with 6 hours between (for alone time) costs LESS than same events with only 2 hours between (no recharge).",
      "RECHARGE TIME IS NON-NEGOTIABLE - tool says you need 3 hours alone? That's minimum. Don't try to get away with 1 hour. You'll crash harder.",
      "WEEKENDS ARE FOR RECOVERY - if your week drains you to 20%, the ENTIRE weekend might be needed to recharge. Don't fill it with social obligations.",
      "PREVENTIVE DECLINING > LAST-MINUTE CANCELING - saying no upfront when at capacity feels hard but is kinder than canceling the day-of when burned out.",
      "CAPACITY IS WEEKLY, NOT DAILY - you might handle 3 events Monday but that leaves less capacity for Tuesday-Sunday. Think cumulative, not per-day.",
      "ENERGY TYPE IS SPECTRUM - extreme introverts might need 48 hours alone after a big event. Moderate introverts might need 6 hours. Extroverts might need 2. Know your number.",
      "CLOSE FRIENDS CAN RECHARGE - for some people, 1-on-1 time with best friend is RECHARGING not draining. Mark these events as 0% cost or even negative cost.",
      "GUILT IS NOT A GOOD REASON - if you're only going because you feel guilty declining, and tool says you're at capacity, the guilt of canceling later will be WORSE.",
      "WORK EVENTS COUNT - don't exclude work meetings from forecast thinking they 'don't count.' They drain energy too, sometimes more than social events (performing for boss/clients).",
      "TRACK ACTUAL DEPLETION - tool learns over time. If it predicts party costs 40% but you felt 70% drained, log that. Future predictions will be more accurate."
    ],
    
    pitfalls: [
      "Don't ignore warnings - if tool says 'burnout risk Wednesday', that's not a suggestion. You WILL crash if you don't intervene.",
      "Don't add events thinking 'I'll just power through' - you can't willpower your way through social depletion. It's like running on empty tank.",
      "Don't set energy type higher than reality - saying you're an ambivert when you're an extreme introvert because you 'should be fine' will give wrong predictions and you'll crash.",
      "Don't skip recovery time to 'fit in' one more event - recovery is non-negotiable. Skipping it compounds depletion.",
      "Don't count work from home as recharging - even if alone, work drains energy. Recharge is NO obligations, just rest.",
      "Don't use tool to justify overscheduling - if tool says you're at 85% capacity, that's a WARNING to slow down, not permission to add 15% more.",
      "Don't decline tool's advice because friend will be disappointed - your friend will be MORE disappointed if you go and are miserable/leave early/crash.",
      "Don't forget about back-to-back days - Friday night party + Saturday brunch + Sunday family dinner = three days straight with NO recovery. That's a crash waiting to happen.",
      "Don't dismiss your own recharge needs as selfish - needing alone time is physiological, not moral failure. Tool gives permission because you need to hear it.",
      "Don't add only 'big' events - daily small interactions (coffee runs, hallway chats, phone calls) add up. If you have 10 small interactions it can equal one big event.",
      "Don't expect tool to make you extroverted - it's a forecaster, not a fixer. It helps you work within your energy limits, not expand them.",
      "Don't use predicted battery % as permission to add more if high - if you're at 60% battery Wednesday, that's not 'room for more events,' that's already depleted from 100%.",
      "Don't confuse social anxiety with introversion - anxiety makes you FEAR social situations. Introversion means they DRAIN you. Both are valid, but different. Tool works for both.",
      "Don't forget to account for preparation/recovery time - a 2-hour party includes 1 hour getting ready + 2 hour event + 1 hour decompressing = 4 hours total commitment."
    ]
  }
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
    id: "LocalDeals",
    title: "LocalDeals",
    category: "Money",
    icon: "🏷️",
    description: "Geo-fenced map of every student discount within walking distance.",
    tagline: "Every student discount within walking distance",
    
    guide: {
      overview: "LocalDeals uses your location to show student discounts and deals within walking distance. It aggregates merchant offers, student-specific deals, flash sales, and time-limited promotions on a real-time map. Get notified when you're near an active deal.",
      
      howToUse: [
        "Allow location access and verify your student status (.edu email)",
        "Browse the map or list view of nearby deals",
        "Filter by category (food, retail, services, entertainment)",
        "Tap a deal to see details and expiration time",
        "Show the deal code/badge at checkout to redeem",
        "Rate deals after using them to help other students"
      ],
      
      example: {
        scenario: "Emma is walking to campus for a 2pm class. She's hungry and wants coffee. It's 1:30pm.",
        action: "Emma opens LocalDeals. The map shows: (1) Café 200ft away: '20% off with student ID, valid until 2pm' (2) Sandwich shop 0.3 miles: '50% off until 3pm' (3) Starbucks 0.5 miles: 'Free pastry with drink purchase, expires 4pm'.",
        result: "Emma sees the café is closest and the 20% off expires in 30min. She stops there, gets coffee and a muffin for $6.40 instead of $8. Saves $1.60 and makes it to class on time."
      },
      
      tips: [
        "Enable push notifications - you'll get alerts when passing by active deals",
        "Flash deals (limited time) have bigger discounts than standing student deals",
        "Check the map before leaving home to plan routes around good deals",
        "Combine deals with cashback apps (Rakuten, Honey) for double savings",
        "Submit deals you find to earn points and unlock premium features"
      ],
      
      pitfalls: [
        "Don't buy things just because they're discounted - only use for planned purchases",
        "Check expiration times - nothing worse than arriving after a deal expires",
        "Verify you have your student ID before going - most places require it"
      ],
      
      quickReference: {
        "Range": "Adjustable 0.5-5 mile radius",
        "Filters": "Food, Retail, Services, Events",
        "Notifications": "Real-time when nearby",
        "Verification": ".edu email required"
      }
    }
  },
  {
  id: "MaskingCostCalculator",
  title: "Masking Cost Calculator",
  category: "Mind & Energy",
  icon: "🎭",
  description: "Tracks energy cost of code-switching and hiding neurodivergence. Log interactions with masking effort (1-10) and energy drain. Identifies which situations/people cost most. Validates that masking exhaustion is real. '12 hours masking = 3 rest days needed.'",
  tagline: "Track the hidden energy cost of code-switching",
  
  guide: {
    overview: "Masking costs enormous energy but is invisible. This tool tracks masking effort across interactions to show which situations drain most, how much total weekly cost, and validate that your exhaustion is real work.",
    
    howToUse: [
      "Log interactions: who/where, masking effort 1-10, energy before/after",
      "Add multiple interactions (ideally a week's worth)",
      "Get analysis: highest cost vs lower cost situations",
      "See total weekly masking cost and recovery needed",
      "Identify safest spaces where you can unmask"
    ],
    
    example: {
      scenario: "You logged: Work meeting with boss (masking 9/10, energy drain 80%), networking event (10/10, drain 95%), one-on-one with close friend (2/10, drain 10%), small team meeting (5/10, drain 40%).",
      action: "Input all those interactions.",
      result: "Highest cost: Work meetings with boss (effort 9/10, drain 80%), Networking events (10/10, 95%). Lower cost: One-on-one with friend (2/10, 10%). Total weekly masking: 12 hours of masking = equivalent to 3 full rest days needed for recovery. Insights: Boss meetings and networking cost most because you're hiding stims, forcing eye contact, scripting responses, and monitoring constantly. Friend is low cost because you can be yourself. Recommendations: Limit networking events to one per month max. Request written reports instead of meetings with boss when possible. Protect Friday nights for friend time (safe space). Validation: Masking is REAL WORK that costs REAL ENERGY. Your exhaustion is legitimate."
    },
    
    tips: [
      "Log consistently for 1-2 weeks to see patterns, not just worst day",
      "Be honest about masking effort - no one sees this but you",
      "High-cost situations might be necessary (work) but knowing the cost helps you plan recovery",
      "Seek out lower-cost situations intentionally to restore",
      "If everything is high-cost, you may not have ANY safe unmask spaces (needs addressing)"
    ],
    
    pitfalls: [
      "Don't conclude 'I should just unmask everywhere' - context matters (safety, livelihood)",
      "Some masking is chosen adaptation vs forced suppression - distinguish these",
      "If masking cost is crushing, consider whether job/relationship alignment is off"
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
      id: "PDF-Fixer",
    title: "PDF-Fixer",
    category: "Academic",
    icon: "📄",
    description: "Flattens messed up Word docs into perfect, un-editable PDFs.",
    tagline: "Turn messy Word docs into clean, perfect PDFs",
    
    guide: {
      overview: "PDF-Fixer converts your Word documents into submission-ready PDFs that look exactly how you formatted them, with no shifting text, broken images, or formatting glitches. Essential for online submissions.",
      
      howToUse: [
        "Upload your Word document (.docx)",
        "Preview the PDF conversion",
        "Check that formatting, images, and page breaks are correct",
        "Download the flattened PDF",
        "Submit to your professor/portal"
      ],
      
      tips: [
        "Always preview before downloading",
        "Convert BEFORE the deadline in case you need fixes",
        "Keep the original .docx file in case you need to edit"
      ]
   } },
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
  icon: "👨‍🍳",
  description: "Creates actual recipes from random ingredients you have. Not 'just throw it together' - real step-by-step recipes using ONLY listed ingredients. Handles dietary restrictions and skill levels. Prevents 'I have food but nothing to make' paralysis.",
  tagline: "Turn random ingredients into an actual meal",
  
  guide: {
    overview: "You have random ingredients but no coherent meal plan. This tool creates 2-3 actual recipes using ONLY what you have (no 'you'll also need...' except basic staples). Adapts to dietary restrictions and cooking skill. Solves the 'staring into fridge' problem.",
    
    howToUse: [
      "List all available ingredients (be thorough)",
      "Add dietary restrictions if any (vegetarian, allergies, etc.)",
      "Set cooking skill level (beginner/intermediate/advanced)",
      "Optionally add time constraint",
      "Get 2-3 complete recipes with step-by-step instructions"
    ],
    
    example: {
      scenario: "You have: chicken breast, rice, onion, bell pepper, garlic, soy sauce, eggs, and random spices. You're vegetarian guest is coming. You're a beginner cook with 45 minutes.",
      action: "Input ingredients, set 'vegetarian' restriction, skill 'beginner', time '45 minutes'.",
      result: "Recipe 1: Chicken Fried Rice (for you) - Uses chicken, rice, egg, onion, bell pepper, garlic, soy sauce. Steps: 1. Cook rice if not cooked. 2. Scramble egg, set aside. 3. Dice chicken, cook in pan with garlic. 4. Add diced peppers and onion. 5. Add rice, soy sauce, egg. Mix. 30 min total. Recipe 2: Veggie Fried Rice (for guest) - Same but skip chicken, double the vegetables. Both recipes use same ingredients, same technique, cook simultaneously. Missing staples: cooking oil (use butter if you have it, or just add water to prevent sticking). Ingredients not used: some spices (save for later)."
    },
    
    tips: [
      "Be honest about ALL ingredients, even small amounts - they might be key",
      "The tool works with limited ingredients - don't feel you need a full pantry",
      "Recipes are designed for your stated skill level - beginners get simpler steps",
      "If missing common staples (oil, salt), tool provides substitutions",
      "Save unused ingredients list - helps you track what's expiring"
    ],
    
    pitfalls: [
      "Don't expect gourmet meals from limited ingredients - these are practical, not fancy",
      "If you list 3 ingredients, you'll get simple recipes (that's fine!)",
      "Tool assumes basic cooking equipment (pan, pot, knife) - mention if you lack these"
    ]
  }
},

{
  id: "BillGuiltEraser",
  title: "Bill Guilt Eraser",
  category: "Money",
  icon: "🧾",
  description: "Turns bill anxiety into a clear action plan. Paste your bill for an AI autopsy that flags overcharges. Get bill-type-specific phone scripts, payment plan proposals with negotiation math, escalation ladders, know-your-rights info, hardship letters, collections defense kits, and insider tricks billing departments don't volunteer. Starts with the smallest possible first step.",
  tagline: "Turn bill anxiety into a clear action plan",
  
  guide: {
    overview: "The real barrier to dealing with bills isn't information. It's shame and paralysis. This tool breaks through both: it starts with an absurdly small first step (put the bill face-up on your table), then builds to a complete tactical playbook. Paste your bill text for an AI autopsy that catches overcharges and duplicate fees. Get bill-type-specific phone scripts with magic phrases that unlock hardship programs, payment plan proposals with exact negotiation math, escalation ladders for when the first person says no, know-your-rights sections with legal protections you didn't know you had, ready-to-send hardship letters, and collections defense kits with debt validation letters. Every script is copy-paste ready.",
    
    howToUse: [
      "Select bill type (medical, credit card, utilities, student loans, rent, auto, phone, insurance, taxes)",
      "Enter the amount and what you can realistically afford per month",
      "Select how late it is (current through to collections) and why it's hard",
      "Paste the bill text if you have it for an AI autopsy of charges",
      "Add any extra context (they keep calling me, I got a court notice, etc.)",
      "Get your personalized action plan with scripts, letters, and programs",
      "Use the copy buttons on any script or letter to use it immediately"
    ],
    
    example: {
      scenario: "You have a $2,400 medical bill from 4 months ago that just went to collections. You can afford $75/month. You're terrified to call.",
      action: "Type: Medical, Amount: $2,400, Overdue: Collections, Reason: Too scared to deal with it, Can afford: $75/month",
      result: "Shame-to-Action: 'Opening this tool is the hard part and you already did it. Your only step today: put the bill face-up on your kitchen table.' Bill Autopsy: Request itemized bill - medical bills have errors 30-80% of the time. Know Your Rights: Medical debt under a year old cannot be reported to credit bureaus. Collections Defense: Debt validation letter (ready to send) - collectors must prove they own the debt before you pay anything. Payment Plan: Offer $75/month, they'll counter at $100, accept under $90. Phone Script: opening line + magic phrase 'I'd like to speak with your financial hardship department.' Hardship Letter: Complete letter ready to email. What They Won't Tell You: Every nonprofit hospital is legally required to have a charity care program."
    },
    
    tips: [
      "Paste your bill text for the AI autopsy - it catches overcharges you'd never notice",
      "The magic phrases are real: 'financial hardship' and 'charity care' unlock hidden programs",
      "Medical bills are the most negotiable - never pay the first number",
      "If it's in collections, send the debt validation letter BEFORE paying anything",
      "The payment plan math works: offer low, they counter, you meet in the middle",
      "Hardship letters are what financial counselors charge $200 to write - this one is free"
    ],
    
    pitfalls: [
      "Don't ignore collections - some have legal deadlines that affect your options",
      "Don't agree to a payment plan you can't sustain - be honest about your budget",
      "Don't give bank account info to a collector until the debt is validated in writing",
      "Don't acknowledge a debt verbally on the phone if it's in collections - this can restart the statute of limitations"
    ]
  },
  
  keywords: [
    "bill", "overdue", "debt", "medical", "collections", "payment plan", "negotiate",
    "credit card", "utilities", "student loan", "rent", "hardship", "can't afford",
    "scared", "anxiety", "money", "phone script", "help"
  ],
  
  tags: ["Money", "Bills", "Anxiety", "Debt"],
  difficulty: "easy",
},

{
  id: "ComplaintEscalationWriter",
  title: "Complaint Escalation Writer",
  category: "Money",
  icon: "📧",
  description: "Writes professional, firm complaint letters that get results. Uses consumer protection frameworks, names names, includes leverage points (BBB, chargeback, regulatory complaints). Professional but firm tone - not angry, not begging. Includes who to send to and next steps if ignored.",
  tagline: "Write complaints that actually get results",
  
  guide: {
    overview: "Consumer complaints often fail because they're too emotional or lack leverage. This tool writes professional escalation letters that reference consumer protections, state clear outcomes with deadlines, and mention (without threatening) next steps like regulatory complaints or chargebacks. Gets results without burning bridges.",
    
    howToUse: [
      "Specify company and issue in detail",
      "Note previous attempts to resolve (if any)",
      "State desired outcome (refund, fix, compensation)",
      "Get complete escalation letter with subject line",
      "Learn who to send to (executives, not customer service)",
      "Receive timeline for follow-up and next steps if ignored"
    ],
    
    example: {
      scenario: "You bought a defective laptop from MegaTech. Returned it within 30 days per policy but they denied refund claiming 'user damage' when it arrived defective. You've called 3 times, been promised callbacks that never came. You paid $1,200 and want full refund.",
      action: "Company: MegaTech, Issue: [detailed description], Previous attempts: 3 calls, no resolution, Desired: Full $1,200 refund.",
      result: "Subject: Formal Complaint - Defective Laptop Return Denied - Account #[your account]. Letter: 'Dear MegaTech Executive Team, I purchased a laptop (Model X, Serial Y) on [date] for $1,200. The device was defective on arrival [specific defect]. I initiated return within your 30-day policy on [date]. Despite three calls to customer service (call logs attached), you've denied my refund claiming user damage. This is inaccurate - the device arrived defective. Per the Magnuson-Moss Warranty Act and [State] consumer protection laws, I'm entitled to refund or replacement for defective merchandise. I expect: 1. Full $1,200 refund by [date 14 days from now], 2. Prepaid return label, 3. Confirmation email within 48 hours. If not resolved by [deadline], I will: 1. File complaint with [State] Attorney General, 2. File BBB complaint, 3. Dispute charge with credit card company, 4. Post detailed review of this experience. I prefer to resolve this amicably. Please confirm receipt and resolution timeline. [Your name, contact info]' Send to: CEO, VP Customer Service (find on LinkedIn), Customer Service Director. Chargeback: If no response in 14 days, contact your credit card company - you have 60-120 days to dispute depending on issuer."
    },
    
    tips: [
      "The letter is firm but professional - emotional language undermines credibility",
      "Mentioning regulatory complaints is NOT a threat if you actually plan to do it",
      "Send to executives, not customer service - they have authority to override policies",
      "Include ALL relevant details: dates, transaction IDs, names of people you spoke with",
      "Keep a copy and note when you sent it for follow-up timeline"
    ],
    
    pitfalls: [
      "Don't make threats you won't follow through on - it weakens your position",
      "Don't be rude or aggressive - you want them to WANT to resolve this",
      "Don't skip the deadline - vague 'as soon as possible' has no teeth"
    ]
  }
},

{
  id: "SubSweep",
  title: "SubSweep",
  category: "Money",
  icon: "🧹",
  description: "Paste your bank statement and instantly see every subscription you're paying for — with brutal cost-per-use math, an interactive What-If simulator, free alternatives, and ready-to-send cancellation messages.",
  tagline: "Find what you're wasting and sweep it away",
  
  guide: {
    overview: "SubSweep is a subscription auditor that goes beyond listing what you pay. Paste a bank statement and it auto-detects subscriptions (even cryptic merchant names like 'AMZN*Prime'). Or add them manually with quick-add buttons. Then it calculates cost-per-use ('Your gym costs $37 per visit'), flags forgotten charges, suggests free alternatives, and gives you exact cancellation steps. The What-If simulator lets you toggle subscriptions on/off and watch savings update in real-time.",
    
    howToUse: [
      "Choose 'Scan Statement' to paste bank/credit card text, or 'Add Manually' to enter subscriptions",
      "For each subscription, set the billing cycle and how often you actually use it",
      "Use quick-add buttons for common services like Netflix, Spotify, etc.",
      "Click 'Analyze My Subscriptions' for the full audit",
      "Review the donut chart to see where your money goes (used vs underused vs forgotten)",
      "Use the What-If simulator — toggle subscriptions to see real-time annual savings",
      "Expand each subscription card for cost-per-use, free alternatives, and cancellation steps",
      "Copy cancellation messages directly from the tool"
    ],
    
    example: {
      scenario: "You paste a credit card statement showing Netflix ($15.49), Spotify ($11.99), a gym ($40), Adobe CC ($59.99), and Headspace ($12.99). You use Netflix weekly, Spotify daily, the gym twice a month, haven't opened Adobe in 3 months, and forgot about Headspace.",
      action: "Scan Statement finds all 5 charges. Set usage levels: Netflix=weekly, Spotify=daily, Gym=monthly, Adobe=rarely, Headspace=forgot I had it.",
      result: "Total: $141.46/mo ($1,698/yr). Wasted: $72.98/mo. Donut chart: 17% used (Spotify), 40% underused (Netflix, Gym), 43% forgotten (Adobe, Headspace). Cost-per-use: Gym = $20/visit (twice a month), Adobe = infinite (zero use). Verdicts: Spotify=KEEP, Netflix=KEEP, Gym=CONSIDER (suggest pay-per-visit alternative), Adobe=CUT (alternative: Canva + DaVinci Resolve), Headspace=CUT (alternative: Insight Timer, free). What-If: cutting Adobe + Headspace = $875/yr — 'That's a weekend trip or 73 good coffees.' Cancellation steps and messages included for each."
    },
    
    tips: [
      "The Statement Scanner catches subscriptions you've genuinely forgotten — that's where the biggest savings hide",
      "Cost-per-use is the killer reframe: '$15/month' feels small, '$7.50 per episode' makes you reconsider",
      "Use the What-If simulator before committing — sometimes seeing the annual number is all the motivation you need",
      "The retention tip tells you what discount to expect when you call to cancel — don't accept the first offer",
      "Seasonal subscriptions (sports streaming, pool service) should be paused, not cancelled"
    ],
    
    pitfalls: [
      "Be honest about usage — 'I might use it' doesn't count if you haven't in 2+ months",
      "Statement scanning detects patterns but may miss annual charges — add those manually",
      "Always verify cancellation steps — some services change their process"
    ]
  },
  
  keywords: [
    "subscription", "cancel", "waste", "money", "budget", "savings",
    "recurring", "charges", "bank statement", "cost per use", "audit",
    "netflix", "spotify", "streaming", "gym", "membership", "cut"
  ],
  
  tags: ["Money", "Budgeting", "Subscriptions", "Savings"],
  difficulty: "easy",
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
  id: "ConfrontationCoach",
  title: "Confrontation Coach",
  category: "Communication",
  icon: "🛡️",
  description: "Generates firm but kind messages for conflict-averse people. Three firmness levels, pushback scripts, and validation that you have the right to say this.",
  tagline: "Firm, kind words for things you need to say",
  
  guide: {
    overview: "Confrontation Coach writes the exact words for you when you need to say no, set a boundary, address disrespect, or push back — but struggle to find the right phrasing. You describe the situation, and it generates three messages at different firmness levels (gentle, balanced, firm) that you can copy-paste directly. It removes apologetic qualifiers, validates your right to say this, and prepares you for pushback with ready-made responses.",
    
    howToUse: [
      "Select what you need to do (say no, set boundary, address disrespect, etc.)",
      "Describe the situation and what you need to communicate",
      "Select the relationship and check any fears you have",
      "Click 'Write My Message' to generate three firmness levels",
      "Pick the level that fits — Balanced is recommended for most situations",
      "Copy the message and send it",
      "Expand 'If They Push Back' for ready-made responses to guilt trips, anger, or negotiation"
    ],
    
    example: {
      scenario: "A family member keeps making critical comments about your life choices — your career, your appearance, your relationship status. It happens every time you see them and you dread family gatherings because of it.",
      action: "Select 'Set a Boundary', describe the situation, select 'Family member', check 'I'll damage the relationship' and 'They'll think I'm selfish'",
      result: "Gentle: 'I know you care about me, and I appreciate that. But when my choices are criticized, it makes me want to share less with you. I'd love for us to enjoy our time together without going there.' Balanced: 'I need you to stop commenting on my career/relationship/appearance. These are my decisions. When you criticize them, it pushes me away.' Firm: 'My life choices are not up for discussion. If the comments continue, I'll start limiting how much time I spend at these gatherings.' Plus pushback scripts for guilt-tripping, 'I'm just trying to help', and 'You're too sensitive.'"
    },
    
    tips: [
      "The Balanced level works for 80% of situations — start there",
      "Use Gentle for first-time conversations with people you care about",
      "Use Firm when you've already tried and been ignored, or for serious boundary violations",
      "You can copy any message directly and send it as-is — no editing needed",
      "Check the pushback scripts BEFORE sending so you're prepared",
      "Checking 'This is a recurring issue' and 'I've tried before' generates firmer messages"
    ],
    
    pitfalls: [
      "Don't soften the message after copying it — the tool already removed unnecessary apologies",
      "Don't over-explain when you send it. The message is complete as written.",
      "If it's a safety issue (abuse, harassment), seek professional support — this tool is for everyday boundaries"
    ]
  },
  
  keywords: [
    "confrontation", "boundary", "say no", "assertive", "conflict",
    "push back", "difficult conversation", "people pleaser", "boundaries",
    "decline", "firmness", "assertiveness", "communication"
  ],
  
  tags: ["Communication", "Boundaries", "Assertiveness", "Scripts"],
  difficulty: "easy",
},

{
  id: "BragSheetBuilder",
  title: "Brag Sheet Builder",
  category: "Productivity",
  icon: "🏆",
  description: "Add accomplishments one at a time (be as humble as you want) and get them transformed with before/after verb upgrades, per-accomplishment imposter syndrome coaching, a metrics excavator that finds hidden numbers, STAR interview stories, resume bullets, LinkedIn about sections, performance review self-assessments, and raise/promotion ammunition with dollar-value estimates and a meeting script.",
  tagline: "Turn humble descriptions into powerful achievement statements",
  
  guide: {
    overview: "Most people chronically understate their work. This tool fixes that. Add accomplishments one at a time in your own words, set your industry, career level, and what you need (resume, LinkedIn, interview, performance review, raise), and the AI transforms each one into a power statement with specific verb upgrades shown inline. It also digs for hidden metrics, builds STAR interview stories, generates resume bullets, writes a LinkedIn about section, drafts a performance review self-assessment, and creates raise/promotion ammunition with business-value dollar estimates and a meeting script. Each transformation includes a per-accomplishment imposter syndrome killer explaining why you deserve to claim it.",
    
    howToUse: [
      "Enter your role title and years of experience (optional but helps calibrate)",
      "Pick your industry (tech, finance, healthcare, etc.) for industry-specific power verbs",
      "Pick your career level (student through executive) for appropriate framing",
      "Select what you need: Resume, LinkedIn, Interview, Performance Review, Raise/Promotion",
      "Add accomplishments one at a time (press Enter to add). Be as vague as you want.",
      "Hit Build My Brag Sheet and get transformations with verb upgrades, STAR stories, formatted outputs",
      "Use the Metrics Excavator questions to find hidden numbers and make your bullets even stronger",
      "Copy any individual bullet, story, or section with one click"
    ],
    
    example: {
      scenario: "You are a mid-level product manager at a tech company. You need to update your resume and prepare for a raise conversation. Your accomplishments: 'helped improve onboarding', 'worked on the new dashboard', 'did some data analysis for quarterly reviews'.",
      action: "Role: Product Manager, Industry: Tech, Level: Mid-level, Purposes: Resume + Raise. Add each accomplishment.",
      result: "Transformation 1: 'helped improve onboarding' -> 'Redesigned user onboarding flow, reducing time-to-first-value by [35%] and improving Day-7 retention by [12 points]' (verb: helped -> redesigned). Imposter killer: 'If the onboarding got better and you were involved, you contributed to that improvement.' Metrics Excavator: 'What was the completion rate before vs after? Check your analytics tool.' STAR Story: S: Onboarding had a 40% drop-off... Resume bullet: Redesigned user onboarding flow... Raise: 'Improved onboarding reduced churn-related revenue loss by approximately $200K annually.'"
    },
    
    tips: [
      "Be as humble as you want in input. 'I kinda helped with a thing' is a perfectly valid starting point.",
      "The verb upgrade pills show you exactly what changed: helped -> spearheaded, worked on -> delivered",
      "The Metrics Excavator tells you WHERE to find numbers you probably already have access to",
      "Select Raise/Promotion to get dollar-value estimates and a script for the actual meeting",
      "The per-accomplishment imposter syndrome killer is the most important part. Read every one.",
      "You can add more accomplishments and rebuild anytime — the tool works incrementally"
    ],
    
    pitfalls: [
      "Don't inflate or lie. The tool reframes truthfully, and so should you.",
      "Estimated metrics in [brackets] are starting points. Replace with real numbers where possible.",
      "Don't use the same bullets for every application. Tailor to each job description."
    ]
  },
  
  keywords: [
    "resume", "brag", "accomplishment", "achievement", "interview", "linkedin",
    "performance review", "raise", "promotion", "career", "job", "hire",
    "imposter syndrome", "bullet", "STAR", "power verb"
  ],
  
  tags: ["Productivity", "Career", "Writing", "Confidence"],
  difficulty: "easy",
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
  id: "LazyWorkoutAdapter",
  title: "Lazy Workout Adapter",
  category: "Health",
  icon: "🏋️",
  description: "Creates genuinely low-barrier workouts matched to current energy (1-10). Can do in pajamas, no equipment, during TV. Tiers: Survival (3-5min), Low energy (10-15min), Moderate, High. 'Something is better than nothing' philosophy. Permission to do easy version.",
  tagline: "Real workouts matched to your actual energy level",
  
  guide: {
    overview: "Traditional workouts assume high energy/motivation. This creates workouts that meet you where you are - if you're at 2/10 energy, you get a 2/10 workout. Can be done in current clothes, in your living room, even during TV. The goal is movement that's actually accessible.",
    
    howToUse: [
      "Set current energy level (1-10 slider)",
      "Add time available (often auto-suggested based on energy)",
      "Note equipment if any (optional, defaults to none)",
      "List physical limitations if relevant",
      "Get adapted workout with exercises, modifications, and duration"
    ],
    
    example: {
      scenario: "Your energy is 2/10. You haven't exercised in months. You have 10 minutes and no equipment. You're in pajamas and don't want to leave your living room.",
      action: "Energy: 2/10, Time: 10 minutes, Equipment: None, Context: In pajamas.",
      result: "Realistic tier: Survival mode (3-5 min gentle movement). Workout: 'Pajama Gentle Movement Session' - Total 5 minutes. Exercise 1: Seated arm circles (30 seconds each direction) - Can do while sitting on couch. Why: Gets blood moving without standing. Easier version: Smaller circles. Exercise 2: Gentle neck rolls (1 min) - Releases tension. Can do during TV commercial. Exercise 3: Seated torso twists (1 min) - Stretches spine gently. Exercise 4: Standing march in place (2 min) - Only if you can stand; otherwise skip. Can do while watching TV. Easier: Just shift weight side to side. Barrier removal: No changing clothes needed (you're in pajamas), No leaving house, No equipment, Can do during TV show commercial breaks. Motivation reframe: 5 minutes of movement is infinitely better than 0. You don't need to earn rest by exercising hard - gentle movement is valuable. Permission: The easy version is the RIGHT version for your current capacity."
    },
    
    tips: [
      "Actually do the low-energy version - don't aspirationally pick higher tier then not do it",
      "The 'can do while...' suggestions remove mental barriers (TV, work breaks)",
      "Modifications are there to be used, not avoided - use the easier version",
      "Track that you DID it, not how hard it was - consistency matters more than intensity",
      "If even the lowest tier feels too hard, that's data that rest might be what you need"
    ],
    
    pitfalls: [
      "Don't judge yourself for needing the low-barrier version - meeting yourself where you are is wisdom",
      "Don't use this as permanent substitute for medical advice if you have chronic fatigue",
      "Don't skip rest days thinking you should do 'at least' this much - rest is also necessary"
    ]
  }
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
  title: "Executive Function Prosthetic",
  id: "ExecutiveFunctionProsthetic",
  category: "Mind & Energy",
  icon: "🧩",
  description: "External working memory for ADHD/executive dysfunction. Tracks what you were doing before interruptions, remembers why you went somewhere, holds multi-step sequences, prompts at critical transitions. 'What was I doing?' recovery.",
  tagline: "External working memory for scattered brains",
  
  guide: {
    overview: "ADHD and executive dysfunction cause working memory failures - you walk into a room and forget why, get interrupted and can't remember your task, or lose your place in sequences. This tool acts as external memory, tracking context and recovering lost threads.",
    
    howToUse: [
      "Select query type: 'What was I doing?', 'Why did I come here?', 'What's next?', or 'Leaving house checklist'",
      "Provide context about your current task or forgetting point",
      "Get task recovery, location memory, or pre-loaded sequences",
      "Use prompts to remember critical transition points"
    ],
    
    example: {
      scenario: "You were making breakfast, your phone rang, you answered it, and now you're standing in the kitchen with no idea what you were doing.",
      action: "Select 'What was I doing?', input 'Making breakfast, then phone rang'.",
      result: "Tool recovers: 'You were making breakfast. Steps completed: Got coffee grounds, filled kettle. Next step: Turn on kettle and wait for water to boil.' Gets you back on track instantly."
    },
    
    tips: [
      "Use 'Leaving house checklist' before every departure - prevents 'forgot my keys' moments",
      "Set up morning routine sequences for consistent execution",
      "When interrupted, immediately query 'What was I doing?' before the context fades",
      "Use this proactively at transition points, not just when already lost",
      "Voice queries work well when hands are full"
    ],
    
    pitfalls: [
      "Don't rely on this instead of treating underlying executive function - it's support, not cure",
      "Won't help if you never encoded the memory in first place (total distraction)",
      "Requires some initial context - can't recover what was never tracked"
    ]
  }
},

{
  id: "EmotionIdentifier",
  title: "Emotion Identifier",
  category: "Mind & Energy",
  icon: "❤️",
  description: "Translate body signals into emotion words. For alexithymia or emotional suppression - turns 'tight chest, restless' into 'You're feeling anxiety.' Maps physical sensations to specific emotions, builds emotional vocabulary, validates feelings.",
  tagline: "Translate body signals into emotion words",
  
  guide: {
    overview: "Many people (especially those with alexithymia, autism, or who learned to suppress emotions) can't identify what they're feeling beyond 'good/bad/stressed.' This tool maps physical sensations and contexts to specific emotion labels, helping you understand and name what's happening.",
    
    howToUse: [
      "Describe physical sensations (tight chest, restless, heavy, etc.)",
      "Add situational context (what's happening in your life)",
      "Optionally note behaviors/urges you're experiencing",
      "Get likely emotions with confidence scores and explanations",
      "Learn what to do with each identified emotion"
    ],
    
    example: {
      scenario: "You notice your chest is tight, you're breathing shallow, you can't sit still, and you just got assigned a huge project with an impossible deadline. But you can't name what you're feeling.",
      action: "Input physical sensations: 'tight chest, shallow breathing, restless', situation: 'huge project, impossible deadline'.",
      result: "Tool identifies: Anxiety (90% confident). Explains: 'Tight chest + shallow breathing are classic anxiety signals. Your body is in fight-or-flight from the deadline pressure.' Validates: 'This is a normal response to overwhelming demands.' Suggests: Box breathing, breaking project into steps, talking to manager about timeline."
    },
    
    tips: [
      "Physical sensations are more reliable than trying to think your way to emotion names",
      "Context matters - same physical sensation can mean different emotions in different situations",
      "Use this regularly to build emotional vocabulary over time",
      "The goal is eventually being able to identify emotions yourself",
      "It's okay if emotions don't have clean labels - they can be complex/mixed"
    ],
    
    pitfalls: [
      "Don't dismiss your own interpretation if tool suggests something different - you know you best",
      "Physical symptoms can also be medical - chronic tight chest needs doctor eval",
      "Not a replacement for therapy if alexithymia is significantly impacting life"
    ]
  }
},

{
  id: "CriticismBuffer",
  title: "Criticism Buffer",
  category: "Mind & Energy",
  icon: "🛡️",
  description: "Extract useful feedback while removing unnecessary cruelty. Separates actionable critique from personal attacks. For rejection-sensitive people - buffers harsh feedback into professional version, identifies what's actually useful vs what's just mean.",
  tagline: "Extract useful feedback, filter out the cruelty",
  
  guide: {
    overview: "Harsh feedback often mixes valid points with unnecessary cruelty. For rejection-sensitive people (especially those with ADHD/RSD), this makes it impossible to access the useful information without emotional damage. This tool separates signal from noise.",
    
    howToUse: [
      "Paste the harsh feedback you received (email, review, comment, etc.)",
      "Add context about who it's from if helpful",
      "Get analysis: actionable vs personal attack vs tone problem",
      "Read buffered professional rewrite with same content, no cruelty",
      "Access action steps based on actual problems identified"
    ],
    
    example: {
      scenario: "Your boss emails: 'This report is completely unprofessional and frankly embarrassing. I can't believe you'd submit something so sloppy. The data is wrong, formatting is a mess, and it's clear you didn't even try. Do better.'",
      action: "Paste that email into the tool.",
      result: "Analysis: Mixed (valid critique + personal attacks). Actionable: Data errors need fixing, formatting needs work. Non-actionable attacks: 'embarrassing', 'didn't even try'. Buffered version: 'This report needs revision. Please correct the data errors on page 3 and standardize the formatting per our style guide.' Action steps: 1. Review data on page 3 for errors, 2. Apply standard formatting, 3. Request style guide if you don't have it. Reality check: The problems are real and fixable. The character attacks ('didn't even try') are about them, not you."
    },
    
    tips: [
      "Use this BEFORE responding to harsh feedback - prevents defensive reaction",
      "The buffered version is safe to re-read when calm to absorb the actual critique",
      "Action steps are concrete - focus on those, not the emotional content",
      "If analysis shows 'mostly personal attacks, little actionable', consider the source",
      "You can use the buffered version as a model for your response"
    ],
    
    pitfalls: [
      "Don't use this to avoid all criticism - growth requires hearing hard truths",
      "If pattern shows someone is consistently cruel, that's a relationship problem to address",
      "Tool identifies abuse patterns - take those seriously and consider escalating"
    ]
  }
},
{
  id: "TransitionSoftener",
  title: "Transition Softener",
  category: "Mind & Energy",
  icon: "🌊",
  description: "Buffer rituals for switching between activities. 5-phase protocols (warning → closure → buffer → preparation → entry) for difficult transitions like work→home, focus→social, awake→sleep. Prevents jarring context switches.",
  tagline: "Smooth the shift between tasks and activities",
  
  guide: {
    overview: "Abrupt transitions are jarring because your brain is still in the previous mode. Autistic people and others sensitive to context changes benefit from structured rituals that ease the shift. This creates personalized transition protocols.",
    
    howToUse: [
      "Specify what you're transitioning FROM and TO",
      "Note time available and difficulty level",
      "Get 5-phase protocol: warning, closure, buffer, preparation, entry",
      "Follow the sequence to soften the transition",
      "Adjust timing if you need faster/slower versions"
    ],
    
    example: {
      scenario: "You finish intense work at 5pm and need to be present with family by 5:30pm, but your mind keeps racing about work and you can't 'switch off.'",
      action: "From: 'Intense work focus', To: 'Home/family time', Time: 30 minutes, Difficulty: High.",
      result: "Phase 1 (4:30pm): Calendar alert 'Work ending in 30 min.' Phase 2 (4:45pm): Brain dump unfinished thoughts, make tomorrow list, close all work tabs, tidy desk (8 min). Phase 3 (5:00-5:10pm): Change clothes immediately (physical signal), decompress playlist during commute, 5-min walk outside, three deep breaths before entering. Phase 4 (5:10pm): Mental prep: 'Work is done. Family deserves present-you.' Shake out physical tension. Phase 5 (5:30pm): Before opening door: 3 breaths. First 5 minutes: Ask family about THEIR day (forces brain into social mode). Why this works: Your nervous system needs time to downshift gears. Each ritual signals 'we're moving to different state now.'"
    },
    
    tips: [
      "The warning phase prevents abrupt 'time to switch NOW' shock",
      "Closure activities give permission to release the previous mode",
      "Physical rituals (changing clothes, location change) are powerful transition signals",
      "If struggling mid-week, Wednesday-Friday may need longer transitions (accumulated fatigue)",
      "Customize buffer activities to what works for you (music, walking, breathing, etc.)"
    ],
    
    pitfalls: [
      "Don't skip phases thinking you can 'just switch' - that's why you need this tool",
      "Minimum version is still 10-15 minutes - instant transitions don't work for sensitive systems",
      "If you can't find time for transition, your schedule is overcommitted"
    ]
  }
},
{
  id: "CrisisPrioritizer",
  title: "Crisis Prioritizer",
  category: "Productivity",
  icon: "🚨",
  description: "When everything feels urgent, this tool separates real urgency from anxiety urgency. Consequence-based analysis ranks tasks by what actually breaks if you don't do them. Includes an anxiety audit that explicitly names what your panic is inflating, energy-matched planning based on your actual capacity, and guilt-free deferral permissions. Three modes: Right Now (today's triage), This Week (day-by-day plan with energy pacing), and Next Few Weeks (sustained crisis management with delegate/delete/rest scheduling).",
  tagline: "Separate real urgency from anxiety urgency",

  guide: {
    overview: "Anxiety makes everything feel equally urgent when only 1-2 things actually are. This tool objectively analyzes deadlines, consequences, and your current state to build a realistic plan. It meets you where you are — panicking, frozen, exhausted, overwhelmed — and gives you a plan sized to your actual energy and time. Three timeframes: 'Right Now' for today's triage, 'This Week' for a day-by-day plan with energy pacing, and 'Next Few Weeks' for sustained crisis management with delegation, deletion, and built-in rest.",

    howToUse: [
      "Choose your timeframe: Right Now (today), This Week (day-by-day), or Next Few Weeks (longer crisis)",
      "Pick your emotional state and energy level — this shapes the plan you'll get",
      "Set how much time you have (hours today, or hours/day for weekly modes)",
      "List everything weighing on you — tap the ℹ️ button to add deadlines and who's waiting",
      "Review the Anxiety Audit to see which tasks are genuinely urgent vs anxiety-inflated",
      "Focus on the Must-Dos checklist — check them off as you go",
      "Read the guilt-free deferrals for explicit permission to let things wait",
      "For weekly/multi-week modes: follow the day-by-day or week-by-week plan with built-in rest"
    ],

    example: {
      scenario: "You're overwhelmed, running on fumes, with 2 hours available. 8 tasks all feel urgent: client proposal due today, reply to mom's text, clean apartment, schedule dentist, buy groceries, respond to 3 emails, pay electric bill, update resume.",
      action: "Select 'Right Now', pick 'Overwhelmed' + 'Running on fumes' + '~2 hours', enter all 8 tasks. Add deadline 'today 5pm' to the client proposal via the ℹ️ button.",
      result: "Reality check: Only 1 of 8 is actually critical. The anxiety audit shows mom's text, cleaning, and the resume are pure anxiety — zero consequences if they wait. Must-dos: Client proposal (2hrs). Energy plan: 'Do the proposal. That's it. Everything else is tomorrow. You have permission.' Guilt-free deferrals: 'Your apartment doesn't need to be clean today. Nobody is coming over. Mom will understand a text tomorrow. The electric bill isn't due for 2 weeks.'"
    },

    tips: [
      "The ℹ️ button lets you add deadlines and who's waiting — the more context, the sharper the analysis",
      "Trust the consequence analysis over your anxiety's assessment",
      "Actually defer the 'can wait' items — don't just deprioritize then do them anyway",
      "If everything ranks as critical, you're overcommitted and need to renegotiate, not work harder",
      "Use 'This Week' when you have a pile-up, 'Next Few Weeks' for sustained difficult periods like moves, job transitions, or caregiving",
      "The breather pause before results is intentional — take that breath, it actually helps",
      "Copy All or Print your plan so you can reference it without reopening the tool"
    ],

    pitfalls: [
      "Don't add artificial urgency ('but I WANT it done today') — that's not the same as urgent",
      "If someone else's poor planning created urgency for you, that's a boundary issue to address",
      "Repeatedly ignoring 'can wait' tasks forever means they should be deleted, not deferred",
      "The multi-week mode works best when you brain-dump EVERYTHING — don't pre-filter"
    ]
  }
},
{
  id: "TaskSwitchingMinimizer",
  title: "Task Switching Minimizer",
  category: "Productivity",
  icon: "🔀",
  description: "Batch similar tasks to reduce context switching costs. Groups by type (communication, deep work, admin, physical), location, tools, energy level. Saves 45+ minutes by minimizing mental gear-shifting. ADHD-optimized batching.",
  tagline: "Batch similar tasks to protect your focus",
  
  guide: {
    overview: "Context switching costs 15-20 minutes of focus recovery each time. ADHD users pay even higher switching costs. This tool batches similar tasks together so you stay in the same cognitive mode, use the same tools, and minimize mental gear-shifting.",
    
    howToUse: [
      "List all tasks from your to-do list",
      "Add time available if relevant",
      "Get batched schedule grouped by type/location/tools/energy",
      "Execute batches in order to minimize switching",
      "See time saved from reduced context switching"
    ],
    
    example: {
      scenario: "Your to-do has: email Sarah about project, write report section, call dentist, file expense report, grocery shopping, respond to 3 client emails, brainstorm presentation ideas, update spreadsheet, call insurance, vacuum apartment.",
      action: "Input all tasks.",
      result: "Before batching: 14 context switches. After batching: 5 batches = saves ~45 min. Batch 1 'Communication Block' (9am-10am): Call dentist, call insurance, email Sarah, respond to 3 client emails. Why batched: All communication, uses phone/email, social mode. Batch 2 'Deep Work' (10am-12pm): Write report section, brainstorm presentation. Why: Both require focused thinking, creative mode. Batch 3 'Admin' (1pm-2pm): File expense report, update spreadsheet. Why: Both use computer, detail-oriented, low creativity. Batch 4 'Physical Errands' (2pm-3pm): Grocery shopping, vacuum apartment. Why: Both physical, same location (home/errands). Time saved: 45 min from not switching between modes repeatedly."
    },
    
    tips: [
      "Don't interleave batches - do each batch completely before moving to next",
      "Communication batch works best at specific times (morning for calls when you're fresh)",
      "Deep work batch should be during your peak focus hours",
      "Physical tasks batched together preserve momentum",
      "If a task doesn't fit any batch, it might not be priority"
    ],
    
    pitfalls: [
      "Don't batch creative + admin together - they use opposite cognitive modes",
      "Email can be batch or deep work - depends if you're just responding vs drafting important message",
      "If batches are too long (3+ hours same type), you'll burn out - add breaks"
    ]
  }
},

{
  id: "DopamineMenuBuilder",
  title: "Dopamine Menu Builder",
  category: "Mind & Energy",
  icon: "🍭",
  description: "Activities that actually restore vs numb. Matched to current energy and time. Distinguishes intentional pleasure (exercise, hobbies, connection) from numbing behaviors (scrolling feels like rest but drains). Depression/ADHD recovery support.",
  tagline: "Activities that restore vs. activities that numb",
  
  guide: {
    overview: "Not all rest is restorative. Scrolling social media feels like rest but often drains you. This tool suggests activities genuinely matched to your current energy that actually restore, plus identifies what to avoid because it feels easy but makes you worse.",
    
    howToUse: [
      "Set current energy level (1-10 slider)",
      "Add available time and recent activities",
      "Get optimal restorative activities for your energy level",
      "See lower-effort alternatives if needed",
      "Note what to avoid (numbing behaviors that drain)"
    ],
    
    example: {
      scenario: "You're at energy 3/10, have 45 minutes, and have been scrolling social media a lot lately but feel worse after. You need actual rest but don't know what to do.",
      action: "Energy: 3/10, Time: 45 min, Recent: 'Been scrolling social media, feel worse after'.",
      result: "Optimal activities (medium effort, high restoration): 15-min walk outside (you've told us this helps you), cook simple favorite meal (satisfying + nourishing), call friend for chat (connection energizes you). Lower effort: Comfort show + hot tea (lower restoration but acceptable), listen to favorite album (mood lift). AVOID: Scrolling social media (feels like rest, actually draining based on your pattern), starting new show (decision fatigue). Why optimal works: Walk gives you nature + movement which your past data shows restores you. Intentional pleasure (chosen show, chosen music) is different from numbing (infinite scroll)."
    },
    
    tips: [
      "High restoration activities require effort but are worth it when you can manage",
      "At very low energy (1-2), even optimal activities might be too much - use lower effort",
      "Track what actually helps you feel better afterward, not what feels easiest in moment",
      "Intentional pleasure (I choose this show I love) is restorative; numbing (infinite scroll) is not",
      "If depressed, follow the recommendations even when nothing sounds appealing"
    ],
    
    pitfalls: [
      "Don't always choose lowest effort - you'll never restore, just maintain depletion",
      "Avoid list isn't judgment - it's pattern recognition of what doesn't actually help you",
      "If you can't do any optimal activities for weeks, that's depression and needs treatment"
    ]
  }
},

{
  id: "VirtualBodyDouble",
  title: "Virtual Body Double",
  category: "Productivity",
  icon: "👥",
  description: "Gentle accountability presence for ADHD. Timed work sessions with check-in messages and completion celebration. Mimics body doubling effect (working near someone helps focus) without social pressure. Just witnessed effort, no judgment.",
  tagline: "Gentle accountability for getting things done",
  
  guide: {
    overview: "Body doubling - working near another person - helps ADHD brains focus through gentle accountability and presence. This provides that effect virtually through timed sessions with periodic check-ins and encouraging completion messages.",
    
    howToUse: [
      "Specify what you're working on and for how long",
      "Set check-in frequency (10-30 minutes)",
      "Start session and work while tool provides gentle presence",
      "Receive periodic 'still working?' check-ins",
      "Get completion celebration when session ends"
    ],
    
    example: {
      scenario: "You need to write a report for 50 minutes but can't start because working alone feels impossible. You know you'd work fine if someone were just... there.",
      action: "Task: 'Writing report', Duration: 50 minutes, Check-ins: Every 15 minutes.",
      result: "Session starts: '0 min: Starting now. I'm here with you.' 15 min: 'Still working? Great. Keep going.' 30 min: 'Halfway there. You're doing it.' 45 min: 'Almost done. Last push.' 50 min: 'Done! You did the thing. ðŸŽ‰' The gentle presence and periodic check-ins create just enough accountability to maintain focus without pressure."
    },
    
    tips: [
      "Set realistic session lengths - 25-50 min Pomodoros work better than 3-hour marathons",
      "Check-in frequency should match your focus span (shorter if you drift easily)",
      "Actually acknowledge the check-ins - they work because you feel witnessed",
      "This works for any task, especially ones you've been avoiding",
      "Combine with actual body doubling (video call with friend) for stronger effect"
    ],
    
    pitfalls: [
      "Don't ignore the check-ins - the accountability only works if you engage",
      "If you habitually dismiss check-ins and don't work, you need different intervention",
      "This provides presence, not motivation - if you can't even start, address that separately"
    ]
  }
},

{
  id: "WaitingModeLiberator",
  title: "Waiting Mode Liberator",
  category: "Mind & Energy",
  icon: "⏳",
  description: "Breaks ADHD 'waiting mode' paralysis before appointments. Calculates usable time, suggests time-appropriate tasks, provides explicit permission: '3.5 hours is enough for deep work.' Reclaims hours lost to appointment anxiety.",
  tagline: "Break free when an upcoming event freezes your day",
  
  guide: {
    overview: "ADHD users lose entire days to 'waiting mode' - paralyzed before appointments because 'I have something later.' This tool calculates actual usable time, subtracts prep buffer, and explicitly permits productive use of those hours.",
    
    howToUse: [
      "Enter appointment time and current time",
      "Add preparation needs (get ready time, travel time)",
      "Get usable time blocks with task suggestions",
      "Receive explicit permission to use this time",
      "See preparation buffer timing"
    ],
    
    example: {
      scenario: "You have a doctor appointment at 2pm. It's 10:30am. You need 20 min to get ready and 15 min to drive. You're sitting there in waiting mode feeling like you can't start anything because 'appointment is later.'",
      action: "Appointment: 2pm, Current: 10:30am, Prep: '20 min ready + 15 min drive'.",
      result: "Time available: 3.5 hours (10:30am-2pm minus 35 min prep = 3 hours usable). Usable blocks: 10:30-12:00 (90 min): Deep work - write report section. 12:00-12:30: Lunch. 12:30-1:00: Quick tasks (emails, calls). 1:00-1:25: Prep and travel buffer. PERMISSION: You have 3 FULL HOURS before you need to leave. That's real time. Use it. Appointment prep starts at 1:00pm - you don't need to think about it before then."
    },
    
    tips: [
      "Actually use the time blocks - the permission statement is there for a reason",
      "Buffer is conservative (35 min for 20+15) to prevent last-minute rushing",
      "Deep work in first block when you're fresh, not scattered by appointment proximity",
      "Set alarm for prep buffer start time so you can fully engage before then",
      "If you still can't use the time, waiting mode might be anxiety needing separate treatment"
    ],
    
    pitfalls: [
      "Don't check the clock every 10 minutes 'making sure' - trust the buffer",
      "If appointment is less than 90 min away, deep work won't work - do quick tasks",
      "Prep buffer includes 'gather thoughts/materials' not just physical prep"
    ]
  }
},

{
  id: "BrainDumpStructurer",
  title: "Brain Dump Structurer",
  category: "Productivity",
  icon: "🧠",
  description: "Dump everything in your head — chaotic, unfiltered, stream of consciousness — and get back: one clear next step, actual tasks separated from worries, decisions that need making, things to tell someone, ideas worth capturing, stuff you can drop, things that aren't your problem, and feelings that deserve acknowledgment but aren't tasks. Includes an overwhelm meter showing how few actual tasks you have vs. how many were just noise.",
  tagline: "Everything in your head → one clear next step",
  
  guide: {
    overview: "When your brain is full of unsorted noise, every thought feels equally urgent. This tool breaks the illusion. Dump everything — don't organize, don't filter, don't punctuate — and the AI sorts it into 9 categories: one next step, action items, decisions needed, things to tell someone, worries (acknowledged but flagged as not-tasks), ideas to capture, things you can drop, things that aren't your problem, and feelings to acknowledge. The overwhelm meter is therapeutic: 'You dumped 47 thoughts. After sorting: 8 actual tasks and 39 things that are either feelings, not urgent, or not your problem.' Two input modes: free-text dump for stream of consciousness, or rapid-fire mode for one thought at a time.",
    
    howToUse: [
      "Pick a context if one fits (work overwhelm, anxiety spiral, 3am thoughts, life transition, etc.)",
      "Choose input mode: Free Dump for stream of consciousness, or One at a Time for individual thoughts",
      "Type everything. Don't organize. Don't filter. Sentence fragments are fine. Swear words are fine.",
      "Hit Structure This and watch 47 swirling thoughts become 8 actual tasks",
      "Start with the one thing in the Do First box — it's chosen to be small and unblocking",
      "Check off action items as you go. Copy the full checklist to keep it somewhere visible.",
      "Read the Worries section — each one gets a gentle, honest reframe",
      "Read the Can Drop section — permission to let go, with reasons why"
    ],
    
    example: {
      scenario: "Sunday night, brain racing: need to email Sarah, groceries, mom's birthday next week, car needs oil change, presentation Tuesday, feeling anxious about everything, forgot to call dentist, should I take that job offer, kitchen is a mess, haven't exercised in weeks, need to respond to Jake about Saturday, I feel like I'm failing at everything...",
      action: "Context: Life chaos. Paste the whole stream into the dump box.",
      result: "Overwhelm Meter: 'Your brain held 12 distinct thoughts. After sorting: 5 actual tasks, 1 decision, and 6 things that are feelings, not urgent, or can wait. That's less than half of what it felt like.' Do First: 'Email Sarah (5 min, clears mental space, unblocks project).' Actions: Email Sarah, Buy groceries, Prepare presentation, Call dentist, Respond to Jake. Decision: Should I take the job offer? (What you need: salary comparison and a gut check with someone you trust.) Tell Someone: Jake about Saturday. Worries: 'Feeling anxious about everything' → reframe: 'You have 5 concrete tasks, not infinite chaos. The anxiety is making 5 things feel like 50.' Can Drop: Kitchen mess (not urgent, won't matter tomorrow), Exercise guilt (beating yourself up isn't a task). Feelings: 'I feel like I'm failing' → 'You're not failing. You're overwhelmed, which is different. Failing people don't make lists.'"
    },
    
    tips: [
      "The more chaotic the dump, the better. Don't pre-organize — that defeats the purpose.",
      "Do the First Thing immediately. It's chosen to be small and to create momentum.",
      "The Worries section is secretly the most valuable part. Most overwhelm is anxiety pretending to be tasks.",
      "Use rapid-fire mode when you can't even form sentences. Just fragments.",
      "Copy the checklist and put it somewhere visible. Your brain can stop holding it all.",
      "Use this regularly, not just in crisis. Sunday evening dumps prevent Monday morning overwhelm."
    ],
    
    pitfalls: [
      "Don't skip the Do First step — making the list without starting creates list-anxiety",
      "Don't treat the Worries section as tasks to solve. They're acknowledged, not assigned.",
      "If the list is genuinely huge (20+ real tasks), that's a workload problem, not an organization problem"
    ]
  },
  
  keywords: [
    "brain dump", "overwhelm", "organize", "thoughts", "chaos", "anxiety",
    "tasks", "to do", "prioritize", "stress", "racing thoughts", "can't think",
    "too much", "where to start", "scattered", "focus", "clarity", "structure"
  ],
  
  tags: ["Productivity", "Anxiety", "Organization", "Mind & Energy"],
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
  id: "BurnoutBreadcrumbTracker",
  title: "Burnout Breadcrumb Tracker",
  category: "Mind & Energy",
  icon: "🔥",
  description: "Spots patterns leading to burnout before crash. Multi-metric monitoring: sleep quality, task completion rate, irritability, social withdrawal, physical symptoms. Alerts early when intervention still possible. '7-10 days until crash if trajectory continues.'",
  tagline: "Spot the warning signs before you hit the wall",
  
  guide: {
    overview: "Burnout doesn't appear suddenly - it leaves breadcrumbs (declining sleep, dropping task completion, increasing irritability). This tool tracks multiple indicators to alert you while intervention is still possible, not after you've crashed.",
    
    howToUse: [
      "Log daily metrics: sleep quality, mood, tasks completed %, social energy, symptoms",
      "Add at least 5-7 days of data for pattern detection",
      "Get burnout risk level and time until crash estimate",
      "See specific indicators detected (what's declining)",
      "Follow prioritized interventions before crash happens"
    ],
    
    example: {
      scenario: "Your logs show: Sleep declining from 7/10 to 4/10 over 2 weeks, task completion dropping from 90% to 50%, mood dropping, social energy low, increasing irritability, canceled 3 social plans this week.",
      action: "Input all those daily logs.",
      result: "Burnout risk: HIGH. Time until crash: 7-10 days if current trajectory continues. Indicators: Sleep quality declining (7→4), Task completion dropping (90%→50%), Irritability increasing, Social withdrawal (3 canceled plans). Interventions: CRITICAL: Sleep 9+ hours next 3 nights. HIGH: Cancel non-essential commitments this weekend. HIGH: Reduce work hours to 6/day this week. MEDIUM: Talk to manager about workload. Reality check: You're not 'being lazy' - your system is in decline. Preventing burnout NOW is easier than treating it after crash."
    },
    
    tips: [
      "Track honestly even on 'good' days - patterns emerge over time",
      "Act on high/critical interventions immediately, not when 'you have time'",
      "Compare to past burnouts if you've had them - your warning signs are consistent",
      "If risk is critical, you're days away from crash - treat as emergency",
      "Prevention is much easier than recovery - take warnings seriously"
    ],
    
    pitfalls: [
      "Don't ignore warnings thinking 'I just need to push through this week' - that's how you crash",
      "If every week shows high risk, you're chronically overcommitted (needs systemic change)",
      "Physical symptoms (headaches, stomach issues, insomnia) are real medical signals"
    ]
  }
},

{
  id: "SpoonBudgeter",
  title: "Spoon Budgeter",
  category: "Mind & Energy",
  icon: "🥄",
  description: "Allocates daily energy (spoons) across tasks using spoon theory. Each task costs spoons. Shows at capacity/over capacity/have margin. Prevents overcommitment by making costs visible. Provides guilt-free permission: 'You don't have the spoons.'",
  tagline: "Budget your daily energy across what matters",
  
  guide: {
    overview: "Spoon theory: people with chronic illness/disability have limited daily energy ('spoons'). Each task costs spoons. Running out means forced shutdown. This tool budgets spoons across tasks to prevent overcommitment and validate 'I don't have the spoons.'",
    
    howToUse: [
      "Set available spoons today (slider 1-20)",
      "List tasks with spoon cost for each (1-10)",
      "Mark priority: required/important/optional",
      "Get budget analysis: at capacity/over/margin",
      "Follow permission to decline optional tasks"
    ],
    
    example: {
      scenario: "You have 8 spoons today. Required tasks: Work meeting (3 spoons), Grocery shopping (4 spoons). Optional: Dinner with friends (5 spoons).",
      action: "Input: 8 spoons, Meeting 3, Groceries 4, Dinner 5 (optional).",
      result: "Available: 8. Required: 7 (meeting + groceries). Remaining: 1. Analysis: AT CAPACITY with required tasks only. Optional tasks possible: 0. Recommendation: Say no to dinner invitation (costs 5 spoons you don't have). Permission: You're not being lazy - you literally don't have the energy. Required tasks will use almost all spoons. Dinner would put you 4 spoons over budget = crash tomorrow."
    },
    
    tips: [
      "Be honest about spoon costs - don't minimize to make things 'fit'",
      "Spoons vary daily based on sleep, health, stress - adjust accordingly",
      "Required tasks are truly required (medication, work, pet care) - everything else negotiable",
      "When at/over capacity, saying no isn't optional, it's necessary",
      "Track patterns - if you're always over capacity, your baseline obligations are too high"
    ],
    
    pitfalls: [
      "Don't guilt yourself into spending spoons you don't have - that's how you crash",
      "If someone pressures you after you've said you don't have spoons, that's their problem",
      "Repeatedly borrowing tomorrow's spoons creates debt spiral - don't do it"
    ]
  }
},

{
  id: "ShutdownRecoveryGuide",
  title: "Shutdown Recovery Guide",
  category: "Mind & Energy",
  icon: "🔋",
  description: "Ultra-simple recovery protocols when completely non-functional. Step-by-step survival instructions for autistic shutdown, burnout, depression episodes. Lowest-barrier steps: 'Stay where you are. Breathe. That's enough.' Permission-focused.",
  tagline: "Step-by-step recovery when you're completely spent",
  
  guide: {
    overview: "During shutdown (autistic shutdown, severe burnout, depression episode), even 'do self-care' is inaccessible. This provides lowest-barrier survival protocols with ultra-simple instructions and permission that basic survival is enough.",
    
    howToUse: [
      "Select shutdown type (autistic/burnout/depression/overwhelm)",
      "Set severity (mild/moderate/severe)",
      "Note duration so far if relevant",
      "Get phased protocol: Hour 1, Hours 2-4, Day 1, Days 2-3",
      "Follow ultra-simple steps with permission statements"
    ],
    
    example: {
      scenario: "You're in severe autistic shutdown. Can barely move. Lying in bed. Can't process anything. Everything is too much.",
      action: "Type: Autistic shutdown, Severity: Severe, Duration: Just started.",
      result: "Hour 1: Stay where you are. Don't force yourself to move yet. If you can reach water, drink some. If not, it's okay. Breathe. That's enough for now. Hours 2-4: Drink water (any amount counts). Eat anything (crackers, banana, whatever requires zero prep). Use bathroom. That's all. Rest more. Day 1: Water every few hours. Eat 2-3 times (simple food okay). Sleep as much as needed. Cancel today's obligations (text: 'I'm unwell, can't make it'). Permission: Shutdown is a real neurological state, not laziness. Your body/brain forced this - you didn't choose it. Recovery takes time - don't rush it. Basic survival is enough right now. When to seek help: If shutdown lasts >48 hours with no improvement, if you can't eat/drink at all, if you feel unsafe."
    },
    
    tips: [
      "Actually follow the 'stay where you are' instruction - movement can worsen shutdown",
      "Ultra-simple means ULTRA-SIMPLE - 'drink water' not 'make nutritious smoothie'",
      "Permission statements aren't just nice words - shutdown is real and not your fault",
      "If you can't do Hour 1 steps, you need immediate help (call someone trusted)",
      "Recovery is gradual - expect 2-3 days minimum, possibly longer"
    ],
    
    pitfalls: [
      "Don't try to 'push through' shutdown - that makes it worse and longer",
      "Don't compare to others' recovery speed - shutdown duration varies",
      "If shutdowns are frequent (weekly/monthly), underlying issues need addressing"
    ]
  }
},
{
  id: "RoutineRuptureManager",
  title: "Routine Rupture Manager",
  category: "Mind & Energy",
  icon: "🔄",
  description: "When life disrupts your routine (sick, travel, emergency), get adapted structure that maintains critical tasks while respecting your constraints. Prevents total system collapse for routine-dependent people.",
  tagline: "Keep structure when life blows up your routine",
  
  guide: {
    overview: "For routine-dependent people, disruptions cause chaos. This tool creates temporary replacement structures that maintain critical tasks (medication, meals, urgent work) while dropping optional ones. You get explicit instructions for altered circumstances instead of floundering.",
    
    howToUse: [
      "Describe your normal daily routine",
      "Select what's disrupting it (sick day, travel, schedule change, emergency)",
      "Add any constraints (low energy, can't leave house, limited resources)",
      "Specify critical tasks that must continue (medication, pet care, deadlines)",
      "Get adapted routine with clear keep/drop/simplify instructions"
    ],
    
    example: {
      scenario: "You're home with flu. Normal routine is impossible but you can't just stop everything - you have pets, medication, and a work deadline.",
      action: "Input normal routine, select 'sick day', add constraints ('very low energy', 'can't leave house'), specify critical tasks ('feed cat', 'take medication', 'check work email once').",
      result: "Adapted routine that drops shower/exercise/cooking, simplifies meals to 'crackers/banana', keeps medication schedule, reduces work to one email check, and gives explicit permission that cleaning/etc can wait. Tells you when to resume normal routine."
    },
    
    tips: [
      "Be honest about constraints - the tool can only help if it knows your real limitations",
      "Critical tasks are truly critical (health, safety, urgent obligations) - everything else can be dropped temporarily",
      "Use permission statements when guilt tries to make you do more than you can",
      "The adapted routine is temporary - your normal routine will return when you're able",
      "When in doubt, survival mode is enough (water, medication, rest)"
    ],
    
    pitfalls: [
      "Don't try to maintain your full routine during a disruption - that's how you crash harder",
      "Don't feel guilty about dropped tasks - they're dropped because they're genuinely optional right now",
      "Don't rush back to normal routine too fast - gradual return prevents re-collapse"
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

{
  id: "SpiralStopper",
  title: "Spiral Stopper",
  category: "Mind & Energy",
  icon: "🌀",
  description: "Detect anxiety spirals and cognitive distortions (catastrophizing, fortune-telling, all-or-nothing thinking) and get immediate reality checks, evidence against anxious predictions, and grounding exercises to break the spiral.",
  tagline: "Catch anxiety spirals and thinking traps early",
  
  guide: {
    overview: "Anxiety spirals happen when catastrophic thoughts feed on themselves. This tool identifies cognitive distortions in your anxious thoughts, provides evidence-based reality checks, and offers grounding exercises to interrupt the spiral. Not therapy - emergency intervention when you're spiraling.",
    
    howToUse: [
      "Type out your anxious thoughts exactly as they are (don't filter)",
      "Optionally add physical symptoms and what triggered this",
      "Get analysis of which cognitive distortions are present",
      "Review reality checks showing evidence against anxious predictions",
      "Do one of the grounding exercises to break the spiral NOW"
    ],
    
    example: {
      scenario: "You sent an email with a typo and you're spiraling: 'My boss will think I'm incompetent → I'll get fired → I'll lose my apartment → I'll be homeless and it's all because of this one typo.'",
      action: "Type those exact thoughts into the tool.",
      result: "Detects catastrophizing (typo → homelessness chain) and fortune-telling ('I'll get fired'). Reality checks: (1) You've sent hundreds of emails with no issues, (2) Typos are common and human, (3) People don't get fired for typos. Grounding: 5-4-3-2-1 sensory exercise and box breathing. Compassionate reality: 'You sent an email with a typo. That's it. Everything else is anxiety's fictional narrative.'"
    },
    
    tips: [
      "Use this WHEN you're spiraling, not after - it's designed for emergency intervention",
      "Actually do the grounding exercises - reading about them isn't enough",
      "The reality checks are based on evidence, not just 'positive thinking' - trust them",
      "If spiral detected, take the 'immediate action' seriously - step away from the trigger",
      "Come back and re-read the reality check after grounding - your thoughts will be clearer"
    ],
    
    pitfalls: [
      "Don't use this as a replacement for therapy - it's first aid, not treatment",
      "Don't dismiss the reality checks because 'but what if' - anxiety always has 'what ifs'",
      "Don't skip the grounding exercises thinking you can just think your way out - spirals need physical interruption"
    ]
  }
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
    title: "BuyWise",
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
  {
    id: "DateNight",
    title: "DateNight",
    category: "Money",
    icon: "💑",
    description: "Generates a full date itinerary based exactly on your remaining budget.",
    tagline: "A full date itinerary within your remaining budget",
    
    guide: {
      overview: "DateNight creates complete date plans that fit your exact budget. Enter how much you can spend, your location, and preferences (dinner, activity, dessert) and get a detailed itinerary with specific restaurants and activities that total your budget amount.",
      
      howToUse: [
        "Enter your total budget (e.g., $60)",
        "Select date components (dinner, activity, dessert)",
        "Add preferences (cuisine type, activity style)",
        "Review the generated itinerary with specific venues",
        "Book/reserve as needed",
        "Execute the perfect date"
      ],
      
      example: "$50 budget, Friday evening. DateNight suggests: (1) Dinner at Thai place: $28 for two. (2) Walk to free outdoor concert: $0. (3) Ice cream at local shop: $12. (4) Reserve $10 for parking/tips. Total: $50.",
      
      tips: [
        "Include 10-15% buffer for tips and parking",
        "Check if activities need advance reservations",
        "Free/cheap activities (walks, parks, concerts) stretch your budget",
        "Save successful dates to repeat with different people"
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
