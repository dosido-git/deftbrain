export const toolFinderMetadata = {
  ContractDecoder: {
    problems: [
      "I have a contract and do not understand what some of the clauses actually mean",
      "I want to know which terms deserve attention before I sign or renew",
      "I need plain-English questions to ask about gaps, vague language, or missing details in an agreement",
      "I want possible language for raising or negotiating a contract point without pretending the tool can make the legal decision for me",
    ],
    capabilities: [
      "reads pasted contract text or an uploaded contract file and produces a plain-English overview",
      "identifies important terms and anchors each explanation to quoted contract language",
      "describes the apparent practical effect of contract wording without presenting enforceability or legal outcomes as established facts",
      "surfaces document-specific ambiguities and missing details as questions to clarify",
      "offers optional negotiation asks when a term presents a concrete point the user may want to discuss",
      "finishes with a concise before-you-sign checklist derived from the supplied agreement",
    ],
    accepts: [
      "contract text or an uploaded contract file",
      "optional governing country and state/province, if known",
      "optional situation or concern that should shape the explanation",
    ],
    notFor: [
      "giving a definitive legal opinion on whether a clause is enforceable, valid, fair, or illegal",
      "predicting what a court, regulator, landlord, employer, client, or other party will do",
      "assigning overall contract risk scores or red-flag ratings",
      "reviewing a residential lease when the user wants the lease-specific workflow and protections covered by Lease Trap Detector",
    ],
    handoffs: [
      { when: "the document is a residential lease and the user wants a lease-specific review rather than a general contract explanation", toolId: "LeaseTrapDetector" },
      { when: "the user understands the term but wants help planning how to negotiate leverage around it", toolId: "LeverageLogic" },
    ],
    primaryIntent: "understand the important terms, practical implications, open questions, and possible negotiation points in a specific contract before signing or renewing",
    whenToRecommend: "Recommend when the user has an actual contract, agreement, NDA, subscription terms, employment or freelance agreement, purchase agreement, service agreement, or similar document and wants a grounded plain-English review.",
    whenNotToRecommend: "Do not recommend when the user wants a definitive legal ruling, enforceability opinion, litigation prediction, or an overall risk score rather than an explanation of the supplied document.",
  },

  AlternatePath: {
    problems: [
      "I wonder what would have happened if a historical event had gone differently",
      "I want to change one moment in history and see the consequences",
      "I want an alternate timeline based on a real historical event",
    ],
    capabilities: [
      "builds a speculative alternate timeline from a real historical event and one changed condition",
      "traces first-, second-, and later-order consequences forward through time",
      "connects consequences across politics, technology, culture, economics, and ordinary life",
    ],
    accepts: [
      "a real historical event or turning point",
      "the specific detail or outcome to change",
      "a direct counterfactual question such as What if X had happened instead?",
    ],
    notFor: [
      "predicting future events",
      "current-event forecasting",
      "fictional world-building not anchored to real history",
    ],
    handoffs: [
      { when: "the user wants a structural historical parallel for something happening now rather than an alternate timeline", toolId: "HistoryToday" },
      { when: "the user wants to imagine how two personal life choices might feel in the future", toolId: "WhichLife" },
      { when: "the user wants to pressure-test a belief rather than construct an alternate history", toolId: "BeliefStressTest" },
    ],
    primaryIntent: "explore a counterfactual version of history by changing one real historical event or condition and tracing the consequences",
    whenToRecommend: "Recommend when the user explicitly wants to ask 'what if' about a real historical event and wants a plausible alternate timeline.",
    whenNotToRecommend: "Do not recommend for factual history, future prediction, personal-life simulation, or fictional world-building unrelated to real history.",
  },
  AnalogyEngine: {
    problems: [
      "I understand a concept but cannot explain it to this person",
      "I need an analogy that will make sense to a specific audience",
      "I keep explaining something and they still do not get it",
    ],
    capabilities: [
      "creates multiple analogies tailored to the listener’s interests or familiar world",
      "explains what each analogy clarifies",
      "identifies where each analogy stops being accurate",
    ],
    accepts: [
      "the concept to explain",
      "who the listener is",
      "the listener’s interests, experience, or familiar domain",
    ],
    notFor: [
      "explaining a concept the user themselves does not yet understand",
      "translating a dense document into plain English",
      "finding the prerequisite concept the learner is missing",
    ],
    handoffs: [
      { when: "the user is personally stuck on a concept and needs the missing prerequisite identified", toolId: "MissingLink" },
      { when: "the user has difficult text or a document that needs plain-English explanation", toolId: "PlainTalk" },
    ],
    primaryIntent: "explain a known concept to a particular person using analogies from that person’s world",
    whenToRecommend: "Recommend when the user knows the concept but needs a listener-specific way to explain it.",
    whenNotToRecommend: "Do not recommend when the user needs to understand the concept themselves, translate a document, or diagnose a learning gap.",
  },
  ArgueSmarter: {
    problems: [
      "I want the strongest case against my position",
      "I want to practice a debate",
      "I want to find weaknesses or fallacies in my argument",
    ],
    capabilities: [
      "steelmans the opposing case",
      "runs structured debate practice",
      "identifies fallacies and weak points on both sides",
      "provides post-debate feedback and scorecards",
    ],
    accepts: [
      "the user’s position or claim",
      "preferred debate format or challenge level",
      "optional audience or context",
    ],
    notFor: [
      "testing a personal guiding belief outside a debate context",
      "writing a persuasive message for a real recipient",
      "fact checking a claim without debate practice",
    ],
    handoffs: [
      { when: "the user wants to test where a personal rule or guiding belief holds and breaks rather than debate an opponent", toolId: "BeliefStressTest" },
    ],
    primaryIntent: "pressure-test a position through strong opposing arguments and debate practice",
    whenToRecommend: "Recommend when the user wants an adversarial test, steelman, or practice debate around a stated position.",
    whenNotToRecommend: "Do not recommend when the main need is belief-boundary analysis, message drafting, or simple factual verification.",
  },
  AwkwardSilenceFiller: {
    problems: [
      "The conversation just went quiet and I need something natural to say",
      "I need a safe small-talk opener for this setting",
      "I am on a date or at a social event and the conversation stalled",
    ],
    capabilities: [
      "suggests several context-appropriate conversation rescue lines",
      "matches suggestions to the setting and relationship",
      "avoids making every silence seem like a problem",
    ],
    accepts: [
      "the social setting",
      "who the user is talking with",
      "any context about what has already been discussed",
    ],
    notFor: [
      "planning a difficult or high-stakes conversation",
      "decoding what an incoming message meant",
      "rewriting a message before sending it",
    ],
    handoffs: [
      { when: "the user needs to prepare for a serious or difficult conversation rather than fill a silence", toolId: "DifficultTalkCoach" },
    ],
    primaryIntent: "provide immediate, low-stakes conversation starters when a social interaction stalls",
    whenToRecommend: "Recommend when the user needs something natural to say right now in a low-stakes social silence.",
    whenNotToRecommend: "Do not recommend for conflict, boundary-setting, serious conversations, or analysis of written messages.",
  },
  BatchFlow: {
    problems: [
      "My to-do list is scattered and I keep switching between different kinds of work",
      "I need to group today’s tasks so I can focus",
      "I want a schedule that reduces context switching",
    ],
    capabilities: [
      "groups tasks by cognitive mode",
      "sequences batches around energy patterns and fixed commitments",
      "builds a ready-to-run batched day plan",
    ],
    accepts: [
      "a raw task list",
      "energy pattern or preferred focus times",
      "day type",
      "fixed commitments",
    ],
    notFor: [
      "breaking one overwhelming project into tiny first steps",
      "working alongside an AI companion for accountability",
      "freezing because of an appointment later in the day",
    ],
    handoffs: [
      { when: "the user has one overwhelming project and needs tiny concrete first steps", toolId: "TaskAvalancheBreaker" },
      { when: "the user wants an AI companion to stay with them while they work", toolId: "VirtualBodyDouble" },
      { when: "an upcoming appointment or event is freezing the rest of the day", toolId: "WaitingModeLiberator" },
    ],
    primaryIntent: "group a mixed task list into coherent batches that reduce context switching",
    whenToRecommend: "Recommend when the user has many tasks and the problem is fragmentation, switching, or sequencing across a day.",
    whenNotToRecommend: "Do not recommend when the problem is starting one project, needing companionship to work, or waiting-mode around a later event.",
  },
  BeliefStressTest: {
    problems: [
      "A rule I live by may be too simple",
      "I want to know where one of my beliefs breaks down",
      "I want counterexamples and edge cases for a guiding belief",
    ],
    capabilities: [
      "tests a belief against logical edge cases, historical counterexamples, cultural variation, and empirical exceptions",
      "identifies where the belief remains useful and where it misleads",
      "offers a more precise version that survives scrutiny",
    ],
    accepts: [
      "the belief or rule",
      "how the user applies it",
      "optional examples of where it has helped or failed",
    ],
    notFor: [
      "practice debating an opponent",
      "alternate-history storytelling",
      "deciding between two personal life paths",
    ],
    handoffs: [
      { when: "the user wants a live adversarial debate or steelman against a position", toolId: "ArgueSmarter" },
      { when: "the user wants to change a historical event and trace an alternate timeline", toolId: "AlternatePath" },
    ],
    primaryIntent: "find the boundaries and failure cases of a guiding belief or rule",
    whenToRecommend: "Recommend when the user wants to pressure-test a belief they use to guide decisions or interpret life.",
    whenNotToRecommend: "Do not recommend when the user primarily wants adversarial debate, counterfactual history, or a vivid two-path decision simulation.",
  },
  BikeMedic: {
    problems: [
      "Something is wrong with my bike and I do not know where to start",
      "My bike is making a noise, skipping, rubbing, wobbling, or otherwise behaving differently",
      "I need safe troubleshooting steps before deciding whether to repair it myself or use a bike shop",
    ],
    capabilities: [
      "narrows a bicycle symptom to plausible causes without treating the symptom as proof",
      "uses checks that help separate competing causes",
      "uses manufacturer documentation or established technical references for component-specific specifications when available",
      "gives step-by-step repair guidance and clear stop-riding or shop-escalation advice",
    ],
    accepts: [
      "a free-text description of the bike symptom",
      "a selected bike component or problem area",
      "answers to diagnostic questions",
      "bike setup or component details when known",
    ],
    notFor: [
      "judging whether a bike part is worth its asking price",
      "evaluating a repair shop quote",
      "general purchase decisions about a bike or accessory",
    ],
    handoffs: [
      { when: "the user wants to judge whether a bike, part, or accessory is worth the price rather than diagnose a mechanical problem", toolId: "BuyWise" },
      { when: "the user already has a repair estimate and wants to evaluate the quote rather than troubleshoot the bike", toolId: "QuoteCheck" },
    ],
    primaryIntent: "diagnose and safely troubleshoot a bicycle problem using symptom-based checks plus verified component specifications",
    whenToRecommend: "Recommend when the user has a bicycle symptom or component problem and needs help narrowing causes and deciding what to check or do next.",
    whenNotToRecommend: "Do not recommend when the primary need is shopping advice, price evaluation, or analysis of a repair quote rather than mechanical troubleshooting.",
  },
  BillRescue: {
    problems: [
      "I received a bill that seems wrong, too high, overdue, or in collections",
      "I do not understand a bill and need to know what to do next",
      "I received a hospital, clinic, or other medical bill whose charges I do not understand",
      "I need help disputing, reducing, or negotiating a bill",
    ],
    capabilities: [
      "helps identify what kind of bill problem the user has",
      "organizes a practical next-step plan",
      "helps prepare questions, dispute language, hardship requests, or negotiation steps",
      "addresses overdue and collection situations",
    ],
    accepts: [
      "the bill type",
      "amount",
      "what seems wrong or unaffordable",
      "due or collection status",
      "relevant dates or prior contacts",
    ],
    notFor: [
      "explaining the clinical content of medical visit notes or test results — a medical bill is a bill and belongs here",
      "analyzing why a product’s retail price has a large markup",
      "general contract or document translation unrelated to a billing problem",
    ],
    handoffs: [
      { when: "the user wants plain-English translation of medical visit notes, lab results, or discharge instructions rather than help with a bill", toolId: "DoctorVisitTranslator" },
      { when: "the user wants to understand why a product or service costs what it does rather than resolve a bill", toolId: "MarkupDetective" },
    ],
    primaryIntent: "understand and act on a bill that appears wrong, unaffordable, overdue, or disputed",
    whenToRecommend: "Recommend when the user has an actual bill or collection problem and needs to understand it and decide what action to take.",
    whenNotToRecommend: "Do not recommend for medical-note translation, general price-markup curiosity, or unrelated document comprehension.",
  },
  Bookmark: {
    problems: [
      "I stopped a show or book and cannot remember enough to continue",
      "I want a recap up to exactly where I stopped without spoilers",
      "I am returning to a game or sports season after time away and need the context I already should know",
    ],
    capabilities: [
      "recaps only material established at or before the user’s stopping point",
      "uses chronology checks and omits details that cannot be safely placed before the boundary",
      "refreshes characters, established threads, world details, and the user’s likely re-entry point",
      "uses memory fragments as clues without treating them as certain facts",
    ],
    accepts: [
      "the title of a show, book, game, or sports season",
      "a stopping point such as episode, chapter, page, date, or game",
      "optional memories of the last scene, event, or character state",
    ],
    notFor: [
      "explaining a cryptic message or reference someone sent about a show or book",
      "deciding whether to quit or continue a show for reasons beyond needing a recap",
      "open-ended plot-hole or fan-theory exploration",
    ],
    handoffs: [
      { when: "the user wants a cryptic message, joke, or reference decoded rather than a spoiler-safe recap", toolId: "DecoderRing" },
      { when: "the user’s main question is whether to keep watching or quit rather than what they have forgotten", toolId: "PlotTwist" },
      { when: "the user wants to explore a plot hole after catching up rather than resume from a stopping point", toolId: "PlotHole" },
      { when: "the user wants to develop or explore a fan theory rather than receive a recap", toolId: "FanTheory" },
    ],
    primaryIntent: "restore the context needed to resume a story or season while strictly avoiding anything beyond the user’s stopping point",
    whenToRecommend: "Recommend when the user knows where they stopped and wants a spoiler-safe refresher of what had happened by then.",
    whenNotToRecommend: "Do not recommend for message decoding, keep-watching decisions, plot-hole analysis, or fan-theory exploration when recap is not the main need.",
  },
  BragSheetBuilder: {
    problems: [
      "I need to remember and organize my accomplishments",
      "My resume or performance review undersells what I did",
      "I need stronger achievement bullets for a promotion, raise, resume, or interview",
    ],
    capabilities: [
      "elicits accomplishments the user may have forgotten",
      "converts task descriptions into impact-focused statements",
      "organizes evidence for reviews, promotion cases, resumes, and interviews",
      "uses concrete verbs and numbers without inflating claims",
    ],
    accepts: [
      "projects, responsibilities, wins, praise, metrics, or outcomes",
      "a rough work history or memory dump",
      "the target use such as review, promotion, resume, or interview",
    ],
    notFor: [
      "explaining a firing, career gap, or messy career story",
      "writing a recommendation letter for someone else",
      "inventing achievements the user did not provide",
    ],
    handoffs: [
      { when: "the user needs to frame a firing, career gap, or other difficult true story for an audience", toolId: "TheWholeStory" },
      { when: "the user needs to write a recommendation or reference for someone else", toolId: "GhostWriter" },
    ],
    primaryIntent: "capture and communicate the user’s real accomplishments and impact",
    whenToRecommend: "Recommend when the user needs to remember, organize, or phrase their own work achievements.",
    whenNotToRecommend: "Do not recommend for explaining career setbacks, writing references for another person, or fabricating accomplishments.",
  },
  BrainDumpBuddy: {
    problems: [
      "Everything in my head is mixed together and I cannot tell what actually needs action",
      "I need to dump my thoughts somewhere and sort them without organizing first",
      "I have tasks, worries, decisions, messages, and loose thoughts all competing for attention",
    ],
    capabilities: [
      "sorts an unstructured brain dump by what each thought requires",
      "separates tasks, decisions, communication, waiting, worries, other people’s responsibilities, feelings, and things that can be dropped",
      "preserves user-stated deadlines while labeling inferred timing only as suggested pacing",
      "surfaces one manageable next step before the full sorted list",
      "lets the user reclassify items and continue from recorded progress",
    ],
    accepts: [
      "an unsorted free-text brain dump",
      "rapid-fire entries",
      "voice input where available",
      "optional context about what kind of overwhelm this is",
    ],
    notFor: [
      "triaging an immediate crisis where only the few most urgent actions matter",
      "breaking one large project into detailed micro-steps",
      "providing live companionship or accountability while the user works",
      "freezing because of a later appointment or event",
    ],
    handoffs: [
      { when: "the user needs immediate triage of what matters most right now rather than a full brain-dump sort", toolId: "CrisisPrioritizer" },
      { when: "the problem is one overwhelming project that needs to be broken into tiny concrete steps", toolId: "TaskAvalancheBreaker" },
      { when: "the user already knows the task and wants an AI companion while doing it", toolId: "VirtualBodyDouble" },
      { when: "a later appointment or event is what is making the rest of the day feel unusable", toolId: "WaitingModeLiberator" },
    ],
    primaryIntent: "turn a mixed mental pile into categories based on what each thought requires and identify one manageable next action",
    whenToRecommend: "Recommend when the user describes a head full of mixed tasks, worries, decisions, and obligations and needs sorting before planning.",
    whenNotToRecommend: "Do not recommend when the main need is crisis triage, project decomposition, body doubling, or waiting-mode around a later event.",
  },
  BrainRoulette: {
    problems: [
      "I want an interesting rabbit hole but do not know what to explore",
      "I want to discover a surprising connection between things I already like",
      "I am bored and want to learn something unexpected without choosing a single topic",
    ],
    capabilities: [
      "finds a surprising intersection among two or more selected interests",
      "generates rabbit holes at different depth and technical levels",
      "checks the central factual connection after generation and labels it when the evidence is strong, uncertain, or overstated",
      "offers follow-up questions and related concepts for continuing the exploration",
    ],
    accepts: [
      "two or more selected interests",
      "preferred depth such as quick hit, short rabbit hole, or deep dive",
      "preferred explanation level",
      "a request to choose a random mix instead",
    ],
    notFor: [
      "pressure-testing a belief or argument",
      "building a personal reflection chain between two parts of the user’s own life",
      "researching a single user-specified factual question as the primary task",
    ],
    handoffs: [
      { when: "the user wants to test where a belief or rule holds and breaks rather than discover a curiosity rabbit hole", toolId: "BeliefStressTest" },
      { when: "the user wants a playful chain connecting two elements from their own life", toolId: "SixDegreesOfMe" },
    ],
    primaryIntent: "discover a surprising, evidence-checked rabbit hole at the intersection of multiple interests",
    whenToRecommend: "Recommend when the user wants curiosity, discovery, or an unexpected connection among interests rather than an answer to a predetermined question.",
    whenNotToRecommend: "Do not recommend for belief stress-testing, personal-life connection chains, or straightforward single-topic research.",
  },
  BrainStateDeejay: {
    problems: [
      "I need music that helps me move from how I feel now to the state I need",
      "I am scattered or foggy and want something to listen to while I work or study",
      "I want a listening approach for winding down, getting energized, focusing, creating, or feeling more grounded",
    ],
    capabilities: [
      "builds a phased listening plan from the user's current state toward a desired state",
      "describes the sound profile to try in each phase rather than pretending to create a transferable playlist",
      "opens phase-specific searches in Spotify, Apple Music, YouTube Music, Tidal, or SoundCloud",
      "adapts the plan to a supplied task, genre preferences, and listening sensitivities",
    ],
    accepts: [
      "current state and desired state",
      "optional task such as writing, studying, exercise, chores, or unwinding",
      "optional genre preferences and listening sensitivities",
    ],
    notFor: [
      "diagnosing or treating a mental-health or sleep condition",
      "creating or saving a playlist inside a music service",
      "identifying a song the user cannot remember",
    ],
    handoffs: [
      { when: "the user is trying to identify a song, artist, lyric fragment, or other half-remembered thing rather than choose music for a state transition", toolId: "TipOfTongue" },
      { when: "the user's main problem is allocating work around changing energy rather than choosing what to listen to", toolId: "PEP" },
    ],
    primaryIntent: "choose a phased music-listening approach for moving from a current mental or energy state toward a desired one",
    whenToRecommend: "Recommend when the user wants music or a listening strategy for focus, calming down, energizing, creating, unwinding, or another state transition.",
    whenNotToRecommend: "Do not recommend as treatment for a health condition, when the user expects DeftBrain to create a real playlist inside a music service, or when the task is identifying forgotten media.",
  },
  BuyWise: {
    problems: [
      "I am considering a purchase and do not know whether it is worth it",
      "I found a price and want to know whether it is fair or whether I should wait",
      "I am comparing two products and want the better fit for my priorities",
      "I want to understand the real ownership cost and what to verify before paying",
    ],
    capabilities: [
      "checks selected volatile product facts on the web when available and shows the source",
      "judges a user-supplied price in the context of current evidence and the user’s priorities",
      "compares two known purchase options",
      "considers total cost of ownership, cheaper ways to get the needed benefit, regret risks, and realistic negotiation angles",
      "identifies listing, warranty, configuration, condition, or return details that could change the decision",
    ],
    accepts: [
      "a product or service under consideration",
      "an optional price the user found",
      "the user’s priorities and urgency",
      "optional comparison product",
      "context about use, replacement, budget, or concerns",
    ],
    notFor: [
      "explaining why a known price has a particular markup when the user is not deciding whether to buy",
      "resolving an actual bill, charge, or collection problem",
      "generating gift ideas when the user does not yet know what product to consider",
      "evaluating a contractor or repair quote as a quote rather than a retail purchase",
    ],
    handoffs: [
      { when: "the user wants to understand the cost structure or markup behind a known price rather than decide whether to purchase", toolId: "MarkupDetective" },
      { when: "the user has an actual bill, charge, or collection problem", toolId: "BillRescue" },
      { when: "the user needs help choosing what gift to buy before there is a specific purchase to evaluate", toolId: "Giftology" },
      { when: "the user has a contractor, service, or repair estimate and wants to evaluate the quote itself", toolId: "QuoteCheck" },
    ],
    primaryIntent: "decide whether a specific purchase or one of two known purchase options is worth buying at the price and terms available",
    whenToRecommend: "Recommend when the user is close enough to a purchase to name the item, price, or competing options and wants a decision rather than general shopping inspiration.",
    whenNotToRecommend: "Do not recommend for markup explanation alone, bill disputes, gift ideation before a product is chosen, or quote analysis where no retail purchase decision is involved.",
  },
  CaptionMagic: {
    problems: [
      "I have a photo but cannot think of a caption",
      "I want captions that are funnier, drier, warmer, weirder, or less obvious",
      "I need several caption ideas for a social-media post",
    ],
    capabilities: [
      "generates six distinct caption options from an uploaded image or image description",
      "uses user-supplied context about people, relationships, events, or inside jokes that the image cannot show",
      "can generate a new batch that is funnier, warmer, drier, more unhinged, or surprising",
      "can refine a chosen caption, adapt it for other platforms, and provide alt text",
    ],
    accepts: [
      "an uploaded photo or a description of the image",
      "optional context the image cannot show",
      "anything the captions should avoid mentioning",
      "platform and preferred caption length",
    ],
    notFor: [
      "editing or retouching the image itself",
      "writing a social-media content calendar or campaign strategy",
      "supplying factual backstory about real people or events that the user has not provided",
    ],
    handoffs: [
      { when: "the user needs a first private message to someone they do not know rather than text for a public post", toolId: "ColdOpenCraft" },
    ],
    primaryIntent: "generate useful, clever, funny, or playful captions for a specific photo or social-media image",
    whenToRecommend: "Recommend when the user has a photo or image in mind and wants several caption ideas, especially when they can add context the image alone cannot show.",
    whenNotToRecommend: "Do not recommend for image editing, general social-media planning, or fabricating real-world backstory about the people or event in a photo.",
  },
  ChaosPilot: {
    problems: [
      "My life feels stale even though nothing is obviously wrong",
      "I am stuck in a rut and want one deliberate change",
      "My routine is repeating and I want to shake something loose",
    ],
    capabilities: [
      "identifies a pattern contributing to stagnation",
      "proposes one targeted disruption rather than random novelty",
      "keeps the intervention small and concrete",
    ],
    accepts: [
      "a description of the user’s typical week",
      "what feels stale or repetitive",
      "constraints the disruption should respect",
    ],
    notFor: [
      "a crisis or urgent problem",
      "a task-management problem",
      "freezing around a scheduled event",
      "clinical mental-health support",
    ],
    handoffs: [
    ],
    primaryIntent: "introduce one targeted, low-stakes disruption to a stagnant routine",
    whenToRecommend: "Recommend when the user says life is repetitive, stale, or stuck and wants a deliberate experiment rather than a full plan.",
    whenNotToRecommend: "Do not recommend for emergencies, task scheduling, waiting-mode, or mental-health care navigation.",
  },
  ColdOpenCraft: {
    problems: [
      "I need to message someone I do not know and do not want to sound like spam",
      "I want to reach out to a recruiter, mentor, creator, expert, or potential collaborator",
      "I know why I am contacting someone but cannot find a natural first message",
    ],
    capabilities: [
      "writes three complete ready-to-send outreach messages that open in genuinely different ways",
      "uses only the recipient facts, user background, and connection points the user supplies",
      "adapts the message to email, LinkedIn, Twitter/X DM, Instagram DM, or text",
      "provides a grounded follow-up message if the first outreach gets no reply",
    ],
    accepts: [
      "who the user wants to contact",
      "why the user is reaching out",
      "the communication channel",
      "optional facts the user knows about the recipient",
      "optional relevant background about the user",
    ],
    notFor: [
      "replying to an existing tense or difficult message",
      "preparing for a serious conversation with someone the user already knows",
      "mass cold-email campaigns or automated spam",
    ],
    handoffs: [
      { when: "the user received a tense message and needs help responding", toolId: "ConflictCoach" },
      { when: "the user needs to prepare for a difficult live conversation rather than make first contact", toolId: "DifficultTalkCoach" },
    ],
    primaryIntent: "write a natural first outreach message to someone the user does not know or does not know well",
    whenToRecommend: "Recommend when the user wants to make first contact with a specific person for networking, a job, mentorship, collaboration, a pitch, or another legitimate connection.",
    whenNotToRecommend: "Do not recommend for replies to existing conflict, ongoing difficult conversations, mass outreach, or situations where the user wants the tool to invent a connection or credential.",
  },
  ComebackCooker: {
    problems: [
      "I thought of the perfect response hours too late",
      "I keep replaying something rude, awkward, intrusive, or condescending that someone said",
      "I want a witty, sharp, petty, surgical, or dignified comeback",
    ],
    capabilities: [
      "generates five comeback options in the mood the user chooses",
      "uses the situation, exact words, and relationship context the user supplies without inventing personal facts",
      "includes a High Road response that may be more useful in real life",
      "keeps an intentionally over-the-top Nuclear Option in a clearly cathartic fantasy drawer",
    ],
    accepts: [
      "what happened",
      "optional exact words the other person used",
      "optional relationship or situational context",
      "a comeback mood: Surgical, Witty, Petty, or Dignified",
    ],
    notFor: [
      "analyzing another person's motives, personality, or psychology",
      "planning harassment, threats, or retaliation",
      "working through an active tense-message exchange where the main goal is de-escalation or boundary-setting",
    ],
    handoffs: [
      { when: "the user has an active tense message and wants a grounded response that advances a real conversational goal", toolId: "ConflictCoach" },
      { when: "the user needs to prepare for a difficult conversation rather than enjoy or choose a comeback", toolId: "DifficultTalkCoach" },
    ],
    primaryIntent: "generate satisfying and sometimes useful comeback ideas for something someone already said",
    whenToRecommend: "Recommend when the user is replaying a remark and wants clever response ideas, including playful or cathartic options.",
    whenNotToRecommend: "Do not recommend when the primary need is conflict analysis, de-escalation, safety planning, or retaliation.",
  },
  ComplaintEscalationWriter: {
    problems: [
      "A company has ignored or rejected my complaint and I need to escalate",
      "I need a step-by-step complaint escalation plan",
      "I need the right letter, regulator, or executive contact for a consumer dispute",
    ],
    capabilities: [
      "builds an escalation sequence from the next contact through higher-level channels",
      "helps draft complaint and escalation messages",
      "identifies consumer-protection or regulatory routes when supported",
      "uses dates, amounts, promises, and prior attempts to shape the plan",
    ],
    accepts: [
      "company and industry",
      "what happened",
      "desired resolution",
      "dates, amounts, names, promises, and prior complaint attempts",
    ],
    notFor: [
      "a first-time difficult conversation with a person",
      "a general bill problem before escalation is needed",
      "finding discretionary exceptions or appeal routes after being told no",
    ],
    handoffs: [
      { when: "the user has been told no by a company, agency, insurer, HOA, or institution and wants legitimate appeal or exception paths", toolId: "NotSoFast" },
      { when: "the main problem is understanding, disputing, or reducing a bill rather than escalating a complaint", toolId: "BillRescue" },
    ],
    primaryIntent: "escalate an unresolved consumer complaint through increasingly formal channels",
    whenToRecommend: "Recommend when the user has already complained to a company or provider and needs a structured escalation path.",
    whenNotToRecommend: "Do not recommend for first-step interpersonal conversations, general bill triage, or broad exception/appeal mapping where no complaint sequence exists yet.",
  },
  ConflictCoach: {
    problems: [
      "I received a tense message and do not know how to answer",
      "I want to set a boundary without turning the exchange into a bigger fight",
      "I want to acknowledge what someone said without agreeing with it",
      "I want to step away from a text exchange or move the conversation off text",
    ],
    capabilities: [
      "briefly identifies wording in the received message that materially affects how it can be answered",
      "provides four complete ready-to-send response strategies tied to the user's selected goal",
      "supports goals such as fixing the problem, setting a limit, stepping away, acknowledging without agreeing, or taking the conversation off text",
      "lets the user adjust the tone of a response and continue with Follow-up Coaching after the other person replies",
    ],
    accepts: [
      "the message the user received",
      "the user's relationship to the sender",
      "optional earlier conversation context",
      "optional draft of what the user is tempted to say",
      "one response goal",
    ],
    notFor: [
      "detecting manipulation, gaslighting, contempt, or another person's hidden motives",
      "diagnosing the sender's emotions, needs, personality, or intentions",
      "predicting how the sender will react",
      "generating a witty comeback when usefulness is secondary to catharsis",
    ],
    handoffs: [
      { when: "the user mainly wants a clever or cathartic comeback to something that was said", toolId: "ComebackCooker" },
      { when: "the user needs to prepare for a difficult conversation rather than answer a specific received message", toolId: "DifficultTalkCoach" },
    ],
    primaryIntent: "help the user choose and draft a grounded response to a specific tense message",
    whenToRecommend: "Recommend when the user has received a tense, sarcastic, confrontational, or difficult message and wants several grounded ways to respond toward a specific goal.",
    whenNotToRecommend: "Do not recommend for psychological diagnosis, motive detection, prediction of the other person's reaction, general relationship counseling, or purely cathartic comeback generation.",
  },
  ContextCollapse: {
    problems: [
      "I am about to send or post something and worry different people may read it differently",
      "How will this message land with different audiences?",
      "I want to catch unintended interpretations before I send this",
    ],
    capabilities: [
      "simulates how different audiences may interpret the same outgoing message",
      "identifies wording likely to be misread",
      "suggests safer wording while preserving intent",
    ],
    accepts: [
      "the message or post",
      "the platform or channel",
      "who may see it",
      "optional intended meaning",
    ],
    notFor: [
      "decoding an incoming message",
      "preparing a difficult live conversation",
      "plain-English translation of a dense document",
    ],
    handoffs: [
      { when: "the user received a message and wants to explore what may be meant beneath the words", toolId: "DecoderRing" },
      { when: "the user needs to prepare for a difficult conversation rather than preview a written message", toolId: "DifficultTalkCoach" },
    ],
    primaryIntent: "preview how an outgoing message may be interpreted by different audiences",
    whenToRecommend: "Recommend when the user has written something they may send or post and wants to anticipate unintended readings.",
    whenNotToRecommend: "Do not recommend for interpreting an incoming message, rehearsing a hard conversation, or translating a dense document.",
  },
  DateNight: {
    problems: [
      "I want a complete date-night plan without researching everything myself",
      "I need ideas for a date within a budget",
      "I want an evening plan that fits our preferences and location",
    ],
    capabilities: [
      "builds a date-night itinerary",
      "works within a stated budget and desired vibe",
      "accounts for preferences and practical timing",
      "includes fallback thinking if plans change",
    ],
    accepts: [
      "location",
      "budget",
      "date or time window",
      "desired vibe",
      "partner preferences or dietary needs when relevant",
    ],
    notFor: [
      "general trip planning",
      "planning a layover",
      "relationship counseling or deciding whether to stay in a relationship",
    ],
    handoffs: [
    ],
    primaryIntent: "plan a practical, personalized date-night itinerary from preferences, location, and budget",
    whenToRecommend: "Recommend when the user wants help planning an actual date or evening out.",
    whenNotToRecommend: "Do not recommend for general travel itineraries, layovers, or relationship decisions.",
  },
  DecisionCoach: {
    problems: [
      "I am too stuck or depleted to choose and I want someone to pick for me",
      "I keep cycling through options and need one answer, not another list",
      "I know my constraints and preferences but still cannot make a simple everyday decision",
    ],
    capabilities: [
      "applies the user's stated constraints, preferences, and current capacity to one concrete choice",
      "returns a single decision rather than a ranked list of alternatives",
      "briefly explains why the choice fits what the user supplied",
      "turns the decision into immediate execution steps so the user can stop deliberating",
    ],
    accepts: [
      "the decision the user is stuck on",
      "optional category or context such as food, task, purchase, or activity",
      "hard constraints and softer preferences",
      "the user's current capacity or energy",
    ],
    notFor: [
      "comparing several alternatives in depth",
      "researching current prices, availability, or outside facts",
      "exploring two meaningful life futures",
      "working through a high-stakes decision with multiple frameworks when the user does not want a single delegated answer",
    ],
    handoffs: [
      { when: "the user wants several deliberately different viewpoints rather than one answer", toolId: "CrowdWisdom" },
      { when: "the user wants to imagine how two meaningful personal paths might feel rather than delegate the choice", toolId: "WhichLife" },
      { when: "the user wants a difficult decision analyzed through multiple structured frameworks", toolId: "PlotTwist" },
    ],
    primaryIntent: "make one concrete everyday decision for a user who is experiencing choice paralysis and explicitly wants the burden of choosing removed",
    whenToRecommend: "Recommend when the user says they cannot decide, feels overwhelmed by options, and wants one clear choice that respects stated constraints and preferences.",
    whenNotToRecommend: "Do not recommend when the user wants a comparison, current research, multiple perspectives, a two-future simulation, or a framework-based analysis rather than one delegated answer.",
  },

  DecoderRing: {
    problems: [
      "I received a message and cannot tell what the person really meant",
      "The words seem fine but the tone feels off",
      "I want to separate what was said from plausible subtext",
    ],
    capabilities: [
      "separates literal wording from plausible interpretations",
      "offers multiple possible readings instead of one claimed hidden meaning",
      "highlights uncertainty and contextual clues",
    ],
    accepts: [
      "the incoming message",
      "relationship or context",
      "what happened before the message when relevant",
    ],
    notFor: [
      "previewing how an outgoing message may be received",
      "translating technical or legal jargon",
      "preparing a live difficult conversation",
    ],
    handoffs: [
      { when: "the user wants to see how different audiences may interpret a message before sending it", toolId: "ContextCollapse" },
      { when: "the text is difficult because of jargon or structure rather than interpersonal subtext", toolId: "PlainTalk" },
    ],
    primaryIntent: "explore plausible meanings and subtext in an incoming message without claiming certainty",
    whenToRecommend: "Recommend when the user is confused by an incoming message and wants help interpreting tone or possible intent.",
    whenNotToRecommend: "Do not recommend for outgoing-message audience testing, document translation, or conversation rehearsal.",
  },
  DifficultTalkCoach: {
    problems: [
      "I need to have a difficult conversation and keep postponing it",
      "I need help setting a boundary, giving feedback, saying no, or asking for change",
      "I want to rehearse a hard conversation and prepare for pushback",
    ],
    capabilities: [
      "helps plan a difficult conversation",
      "offers multiple approaches and scripts",
      "prepares for possible responses and pushback",
      "supports live rehearsal and post-conversation debrief",
    ],
    accepts: [
      "the situation and relationship",
      "what the user needs to say",
      "desired outcome",
      "expected resistance",
      "optional fears, prior attempts, or the other person’s perspective",
    ],
    notFor: [
      "writing a simple apology after causing harm",
      "filling an ordinary awkward silence",
      "analyzing a written message’s subtext",
    ],
    handoffs: [
      { when: "the user caused harm and primarily needs to calibrate an apology", toolId: "Mend" },
      { when: "the user only needs an immediate low-stakes conversation starter", toolId: "AwkwardSilenceFiller" },
    ],
    primaryIntent: "prepare and rehearse a consequential interpersonal conversation",
    whenToRecommend: "Recommend when the user needs to say something difficult to a real person and wants planning, wording, or rehearsal.",
    whenNotToRecommend: "Do not recommend for routine small talk, apology calibration after wrongdoing, or decoding a message already received.",
  },
  DoctorVisitPrep: {
    problems: [
      "I have a doctor appointment coming up and do not want to forget what to ask",
      "I need to organize symptoms and concerns before a medical visit",
      "I want a concise script and question list for my appointment",
    ],
    capabilities: [
      "organizes symptoms, concerns, and history into a focused visit brief",
      "prioritizes questions",
      "creates an opener and pre-visit checklist",
      "surfaces items worth mentioning even if the clinician does not ask",
    ],
    accepts: [
      "appointment type",
      "symptoms or concerns",
      "timeline",
      "medications or relevant context",
      "questions the user already has",
    ],
    notFor: [
      "translating notes or lab results after the visit",
      "evaluating whether to undergo a recommended procedure",
      "handling a medical bill",
    ],
    handoffs: [
      { when: "the appointment already happened and the user needs notes, labs, or instructions translated", toolId: "DoctorVisitTranslator" },
      { when: "a doctor or dentist recommended a procedure and the user wants a pre-decision briefing", toolId: "ProcedureProbe" },
      { when: "the problem is a medical bill, charge, collection, or payment dispute", toolId: "BillRescue" },
    ],
    primaryIntent: "prepare a patient to use limited appointment time effectively",
    whenToRecommend: "Recommend when a medical appointment is upcoming and the user wants to organize what to say or ask.",
    whenNotToRecommend: "Do not recommend for post-visit translation, procedure-decision literacy, or medical billing.",
  },
  DoctorVisitTranslator: {
    problems: [
      "I got home from a doctor visit and do not understand the notes or instructions",
      "I need medical jargon from visit notes or lab results translated into plain English",
      "I want to understand what I was told after an appointment",
    ],
    capabilities: [
      "translates medical terminology into plain language",
      "organizes visit notes, lab-result language, or discharge instructions into understandable sections",
      "highlights questions the user may want to take back to the clinician without diagnosing",
    ],
    accepts: [
      "pasted visit notes",
      "lab-result text",
      "after-visit summaries",
      "discharge or follow-up instructions",
    ],
    notFor: [
      "medical bills or insurance charges",
      "preparing questions before an appointment",
      "deciding whether to accept a recommended procedure",
    ],
    handoffs: [
      { when: "the user is preparing for an upcoming medical appointment", toolId: "DoctorVisitPrep" },
      { when: "the user has an actual medical bill or charge problem", toolId: "BillRescue" },
      { when: "the user is deciding how to respond to a recommended medical or dental procedure", toolId: "ProcedureProbe" },
    ],
    primaryIntent: "plain-English translation of information received during or after a medical visit",
    whenToRecommend: "Recommend when the user already has medical notes, results, or instructions and needs help understanding the language.",
    whenNotToRecommend: "Do not recommend for bills, pre-visit preparation, or evaluating a recommended procedure.",
  },
  DreamPatternSpotter: {
    problems: [
      "I keep having the same kind of dream and want to know what pattern is repeating",
      "I want to reflect on what a vivid dream might connect to in my waking life",
      "I have several dreams and want to compare their themes, symbols, and emotional patterns",
    ],
    capabilities: [
      "analyzes one dream for notable elements, emotional themes, and possible associations",
      "compares multiple dreams to surface recurring themes, symbols, emotional signatures, and changes over time",
      "uses optional waking-life context to generate more relevant reflection questions",
      "can add Jungian, Freudian, and dream-science perspectives as optional lenses rather than definitive interpretations",
      "frames the result as self-reflection rather than diagnosis or mystical certainty",
    ],
    accepts: [
      "a detailed description of one dream",
      "two to six dreams for pattern comparison",
      "emotions felt in or after the dream",
      "optional dates and waking-life context",
    ],
    notFor: [
      "predicting the future or treating dreams as supernatural messages",
      "diagnosing a mental-health condition from dream content",
      "treating insomnia, nightmares, or another sleep disorder",
      "finding a mental-health professional when the user is asking for care rather than reflection",
    ],
    handoffs: [
      { when: "the user says the underlying issue is distress they want professional help with rather than dream reflection", toolId: "MentalHealthNavigator" },
      { when: "the user's real problem is a crowded, tangled set of waking thoughts that need sorting rather than dream analysis", toolId: "BrainDumpBuddy" },
    ],
    primaryIntent: "spot recurring themes and emotional patterns in one or more dreams and turn them into grounded questions for self-reflection",
    whenToRecommend: "Recommend when the user wants to explore the possible meaning or recurring pattern of dreams without treating the interpretation as prophecy or diagnosis.",
    whenNotToRecommend: "Do not recommend for supernatural prediction, clinical diagnosis, sleep-disorder treatment, or care navigation.",
  },

  DriveHome: {
    problems: [
      "I am about to drive and something is making me hesitate",
      "I am tired, nervous, facing difficult conditions, or unsure whether to start this drive now",
      "I want a clear go, pause, or do-not-start call based on the conditions I can report",
    ],
    capabilities: [
      "makes a pre-drive go, pause, or do-not-start call using only the facts the user supplies",
      "weighs reported drive length, time of day, visible conditions, road type, and the user's current state",
      "names what makes the drive harder and what is in the user's favor",
      "when the answer is pause, identifies the missing or changeable fact that would help settle the decision",
      "when the answer is not go, suggests practical alternatives or reasons to wait",
      "after a go call, can provide a browser-based arrival reminder and a departure message the user can copy",
    ],
    accepts: [
      "approximate drive duration",
      "time of day",
      "current conditions the user can observe",
      "road type",
      "how the user feels right now",
      "anything specific causing hesitation",
      "optional origin and destination for context only",
    ],
    notFor: [
      "live traffic, weather, road-condition, map, or route lookups",
      "certifying that a drive is safe",
      "navigation or assistance while the vehicle is moving",
      "monitoring the user's trip or contacting someone automatically",
    ],
    handoffs: [
      { when: "the user decides to walk instead and wants a pre-walk safety check plus walking-mode tools", toolId: "SafeWalk" },
    ],
    primaryIntent: "help someone decide whether to start a specific drive right now using only the conditions and personal state they report",
    whenToRecommend: "Recommend immediately before a drive when the user is hesitating because of fatigue, time, weather they can see, road type, nerves, or another reported condition and wants a straight go, pause, or do-not-start call.",
    whenNotToRecommend: "Do not recommend for live traffic or weather information, route planning, a guarantee that driving is safe, trip monitoring, or any use while the vehicle is moving.",
  },

  EmailUrgencyTriager: {
    problems: [
      "My inbox has piled up and I cannot tell what actually needs a reply today",
      "I feel pressure to answer everything and need to know what can wait or be ignored",
      "I want a batch of emails sorted by real urgency rather than sender tone",
    ],
    capabilities: [
      "sorts pasted emails into reply now, reply this week, or optional/never",
      "explains why each message received its priority",
      "extracts explicit deadlines when they appear in the pasted text",
      "states what is likely to happen if the user waits on each message",
      "uses the user's role or context when judging urgency",
      "summarizes the batch with estimated clearing time, delegation opportunities, and messages that can be ignored",
    ],
    accepts: [
      "one or more pasted emails, ideally including subject, sender, and body",
      "the user's role or work context",
      "messy batches separated with delimiters or pasted together",
    ],
    notFor: [
      "reading or triaging the user's live inbox without pasted message content",
      "sending, archiving, labeling, or otherwise managing email accounts",
      "decoding interpersonal subtext when urgency is not the question",
      "organizing a general non-email task list",
    ],
    handoffs: [
      { when: "the user received a short message and mainly wants to understand its possible subtext", toolId: "DecoderRing" },
      { when: "the real problem is a scattered task list and context switching rather than email urgency", toolId: "BatchFlow" },
    ],
    primaryIntent: "triage a pasted batch of emails into what needs attention now, what can wait until this week, and what can be ignored",
    whenToRecommend: "Recommend when the user has multiple emails in front of them and wants help deciding which actually require attention today versus later or never.",
    whenNotToRecommend: "Do not recommend for live inbox management, message sending, general task scheduling, or subtext analysis when urgency is not the main question.",
  },

  FakeReviewDetective: {
    problems: [
      "These product reviews look suspicious",
      "I want to know whether reviews seem genuine or manipulated",
      "I am considering a purchase and do not trust the star rating",
    ],
    capabilities: [
      "analyzes review text for patterns associated with manipulation or marketing",
      "separates useful firsthand experience from low-information praise",
      "summarizes recurring credible positives and negatives",
    ],
    accepts: [
      "pasted review text",
      "review excerpts",
      "product-page review content when the tool supports import",
    ],
    notFor: [
      "judging whether a known price is fair",
      "explaining why a product costs what it does",
      "finding current products, prices, or availability",
    ],
    handoffs: [
      { when: "the user knows the price and wants to understand why it is so high", toolId: "MarkupDetective" },
      { when: "the user has a price and wants to judge whether the purchase is worth it or whether to buy now or wait", toolId: "BuyWise" },
    ],
    primaryIntent: "evaluate the credibility and usefulness of product or service reviews",
    whenToRecommend: "Recommend when the user has reviews or a review page and wants help judging whether the feedback appears trustworthy.",
    whenNotToRecommend: "Do not recommend for price evaluation, markup explanation, or live shopping lookup.",
  },
  FanTheory: {
    problems: [
      "I finished a movie, show, book, or game and want a surprising theory that still fits the story",
      "I want to see ordinary plot details reinterpreted as evidence for a wild fan theory",
      "I have my own fan theory and want it graded for plausibility, creativity, and evidence quality",
    ],
    capabilities: [
      "generates a fan theory from a title and optional theory direction",
      "builds the theory around recognizable story details and separates those observations from speculative interpretation",
      "labels individual evidence items by how strongly they support the theory",
      "identifies the strongest supporting detail as a smoking gun or closest thing to one",
      "gives plausibility and mind-blown scores",
      "includes a strong counterargument and a rabbit-hole prompt for what to revisit in the source",
      "grades a user-supplied theory for plausibility, creativity, and evidence quality",
    ],
    accepts: [
      "the title of a movie, TV show, book, or game",
      "optional media type",
      "an optional theory direction such as secret villain, shared universe, timeline twist, dead or alive, or simulation",
      "a user-written fan theory in grading mode",
    ],
    notFor: [
      "real-world conspiracy theories or allegations about real people",
      "authoritative fact checking or canonical plot reference",
      "a straightforward plot summary or explanation with no speculative theory",
      "stress-testing a real-world belief or claim",
    ],
    handoffs: [
      { when: "the user wants a real-world claim or belief pressure-tested rather than a fictional fan theory", toolId: "BeliefStressTest" },
      { when: "the user wants to find or examine a possible inconsistency in the story rather than construct a theory", toolId: "PlotHole" },
      { when: "the user wants to save a detail, clue, quotation, or moment for later rather than theorize about it", toolId: "Bookmark" },
    ],
    primaryIntent: "generate or grade a deliberately wild but internally defensible theory about a fictional work using story details as evidence",
    whenToRecommend: "Recommend when the user names a fictional movie, show, book, or game and wants an entertaining fan theory, hidden interpretation, or critique of their own theory.",
    whenNotToRecommend: "Do not recommend for real-world conspiracies, authoritative canon lookup, ordinary plot summaries, or testing non-fiction beliefs and claims.",
  },

  FinalWish: {
    problems: [
      "I want my family to know where important accounts and documents are if something happens to me",
      "I need to organize end-of-life practical information and personal wishes",
      "No one else knows how to find my important financial or digital information",
    ],
    capabilities: [
      "organizes practical account, document, contact, and wish information for survivors",
      "helps create a clear inventory and instructions",
      "includes space for personal messages and what matters to the user",
    ],
    accepts: [
      "accounts and document locations",
      "important contacts",
      "financial and household information",
      "wishes and personal notes",
    ],
    notFor: [
      "creating a legally binding will or estate plan",
      "recovering passwords for accounts the user cannot access",
      "urgent crisis or emergency planning",
    ],
    handoffs: [
    ],
    primaryIntent: "organize practical and personal information loved ones may need after the user’s death or incapacity",
    whenToRecommend: "Recommend when the user wants to prepare an organized record of important information and wishes for loved ones.",
    whenNotToRecommend: "Do not recommend as a substitute for legal estate documents, credential recovery, or emergency services.",
  },
  GhostWriter: {
    problems: [
      "Someone asked me to write them a recommendation or reference and I do not know how to start",
      "I know why this person is good but cannot turn it into a strong letter",
      "I need a reference letter that sounds specific and credible",
    ],
    capabilities: [
      "turns the user’s firsthand observations into a recommendation letter",
      "elicits concrete examples and strengths",
      "adapts the letter to the opportunity or audience",
    ],
    accepts: [
      "who the recommendation is for",
      "relationship to that person",
      "specific strengths and examples",
      "the role, school, award, or opportunity",
    ],
    notFor: [
      "writing about the user’s own accomplishments",
      "framing the user’s own difficult career history",
      "writing generic praise without firsthand substance",
    ],
    handoffs: [
      { when: "the user needs to organize and communicate their own accomplishments", toolId: "BragSheetBuilder" },
    ],
    primaryIntent: "write a credible recommendation or reference for another person from real firsthand evidence",
    whenToRecommend: "Recommend when the user has been asked to recommend someone and needs help turning real observations into a letter.",
    whenNotToRecommend: "Do not recommend for the user’s own brag sheet, career-story framing, or fabricated endorsements.",
  },
  HistoryToday: {
    problems: [
      "What historical situation is structurally similar to this current event?",
      "I keep hearing a historical analogy and want a better one",
      "I want to understand today through a past case without pretending history repeats exactly",
    ],
    capabilities: [
      "finds structural historical parallels to current events",
      "explains where each analogy fits and where it breaks",
      "focuses on causal structure rather than superficial resemblance",
    ],
    accepts: [
      "a current event or situation",
      "optional aspect the user wants compared",
    ],
    notFor: [
      "alternate-history what-if scenarios",
      "simple factual history questions",
      "future prediction presented as historical analogy",
    ],
    handoffs: [
      { when: "the user wants to change a historical event and explore an alternate timeline", toolId: "AlternatePath" },
    ],
    primaryIntent: "find and qualify structural historical parallels for a present-day event or situation",
    whenToRecommend: "Recommend when the user wants historical analogies that illuminate a current event and explicitly wants the limits of the comparison.",
    whenNotToRecommend: "Do not recommend for counterfactual history, ordinary history lookup, or prediction of what will happen next.",
  },
  LayoverMaximizer: {
    problems: [
      "I have a layover and want to know whether I can leave the airport or do something useful",
      "I need a safe plan for the time between flights",
      "I want to make a long connection part of the trip",
    ],
    capabilities: [
      "calculates usable layover time after connection constraints",
      "builds an airport or nearby itinerary around the time actually available",
      "accounts for practical buffers and fallback options",
    ],
    accepts: [
      "airports or route",
      "arrival and departure times",
      "connection type and relevant travel constraints",
      "preferences for staying airside or going out",
    ],
    notFor: [
      "general vacation planning",
      "date-night planning",
      "finding live flight status or guaranteeing security and immigration times",
    ],
    handoffs: [
    ],
    primaryIntent: "plan a realistic layover using the time safely available between flights",
    whenToRecommend: "Recommend when the user has a flight connection and wants to know what can reasonably fit into it.",
    whenNotToRecommend: "Do not recommend for full-trip planning, unrelated local itineraries, or live operational flight-status lookup.",
  },
  LeaseTrapDetector: {
    problems: [
      "I am about to sign a lease and want to know what clauses may cause trouble",
      "This lease has language I do not understand or trust",
      "I want unusual or one-sided rental terms flagged before signing",
    ],
    capabilities: [
      "reviews lease text for unusual, costly, or one-sided clauses",
      "explains flagged language in plain English",
      "highlights terms worth questioning before signing",
    ],
    accepts: [
      "lease text or document",
      "jurisdiction or location when relevant",
      "specific clauses the renter is concerned about",
    ],
    notFor: [
      "general plain-English document translation without lease analysis",
      "move-in condition documentation for a security deposit",
      "fighting a deposit deduction after move-out",
    ],
    handoffs: [
      { when: "the user mainly needs a dense document translated and structurally explained rather than renter-specific lease analysis", toolId: "PlainTalk" },
      { when: "the user is moving in and wants to document condition to protect the security deposit", toolId: "RentersDepositSaver" },
    ],
    primaryIntent: "review a residential lease for potentially problematic clauses before the renter signs",
    whenToRecommend: "Recommend when the user has a lease and wants renter-specific clause analysis before signing.",
    whenNotToRecommend: "Do not recommend for generic document explanation, move-in condition documentation, or post-move-out deposit disputes.",
  },
  MarkupDetective: {
    problems: [
      "Why does this product or service cost so much?",
      "I know the price and want to understand where the money goes",
      "What explains the markup on this item or service?",
    ],
    capabilities: [
      "breaks a known price into plausible cost and markup components",
      "explains business, distribution, scarcity, branding, labor, overhead, or market factors that can raise price",
      "distinguishes price explanation from a live price lookup",
    ],
    accepts: [
      "the product or service",
      "the price the user has",
      "optional location, context, or seller details",
    ],
    notFor: [
      "fetching current prices or availability",
      "deciding whether a specific known price is worth paying",
      "resolving an actual bill or collection problem",
    ],
    handoffs: [
      { when: "the user has a specific price and wants to judge whether it is fair, whether to buy now or wait, or the true cost of ownership", toolId: "BuyWise" },
      { when: "the user has an actual bill that seems wrong, unaffordable, overdue, or disputed", toolId: "BillRescue" },
    ],
    primaryIntent: "explain why a known product or service price may be high and where the money plausibly goes",
    whenToRecommend: "Recommend when the user already knows what something costs and wants to understand the price structure or markup.",
    whenNotToRecommend: "Do not recommend for live shopping lookup, purchase-worthiness decisions, or bill disputes.",
  },
  Mend: {
    problems: [
      "I hurt someone and do not know what kind of apology this needs",
      "I need to apologize without overdoing or minimizing it",
      "I want the words to say and one concrete repair action",
    ],
    capabilities: [
      "calibrates the size and tone of an apology to the harm described",
      "suggests words to use and phrases that can make the apology worse",
      "recommends an immediate repair action",
    ],
    accepts: [
      "what happened",
      "who was affected",
      "the relationship",
      "impact or harm as the user understands it",
      "optional prior attempts to repair",
    ],
    notFor: [
      "planning a difficult conversation where the user did not cause the harm",
      "writing a thank-you message",
      "general conflict analysis",
    ],
    handoffs: [
      { when: "the user needs to prepare for a difficult conversation rather than apologize for harm they caused", toolId: "DifficultTalkCoach" },
    ],
    primaryIntent: "calibrate and write an apology after the user has caused harm",
    whenToRecommend: "Recommend when the user acknowledges they did something that hurt or wronged someone and wants to repair it appropriately.",
    whenNotToRecommend: "Do not recommend when the main need is confrontation, boundary-setting, gratitude, or unrelated conflict preparation.",
  },
  MentalHealthNavigator: {
    problems: [
      "I think I need mental-health support but do not know what kind",
      "I do not know whether to look for therapy, psychiatry, a support group, or another service",
      "I need practical next steps for finding mental-health care",
    ],
    capabilities: [
      "maps described needs to types of mental-health support",
      "explains what different providers and services do",
      "helps plan how to search, what to ask, and what to say when reaching out",
      "offers practical near-term steps while keeping care decisions with qualified professionals",
    ],
    accepts: [
      "what the user is going through in their own words",
      "what kind of help they have tried",
      "location or access constraints when relevant",
      "cost, insurance, or format preferences",
    ],
    notFor: [
      "diagnosing a mental-health condition",
      "replacing emergency or crisis services",
      "general productivity or motivation coaching",
    ],
    handoffs: [
    ],
    primaryIntent: "navigate types of mental-health support and practical ways to access appropriate care",
    whenToRecommend: "Recommend when the user wants help figuring out what kind of mental-health support to seek and how to access it.",
    whenNotToRecommend: "Do not recommend for diagnosis, emergency response, or ordinary productivity problems.",
  },
  MiseEnPlace: {
    problems: [
      "I have food in the fridge but no idea what to make",
      "I need dinner planned around what I have, my time, and multiple dishes",
      "I want the cooking order so everything is ready together",
    ],
    capabilities: [
      "turns available ingredients and constraints into a meal plan",
      "sequences prep and cooking steps",
      "coordinates multiple dishes and timing",
      "helps reduce food waste by using what is already available",
    ],
    accepts: [
      "ingredients on hand",
      "time available",
      "dietary needs or preferences",
      "number of people",
      "optional dishes already planned",
    ],
    notFor: [
      "restaurant or date-night planning",
      "identifying a forgotten food from memory",
      "general nutrition or medical dietary advice",
    ],
    handoffs: [
      { when: "the user is trying to remember the name of a food or dish from partial memory", toolId: "TipOfTongue" },
    ],
    primaryIntent: "plan and sequence a meal from available ingredients, time, and preferences",
    whenToRecommend: "Recommend when the user needs to decide what to cook and coordinate the cooking itself.",
    whenNotToRecommend: "Do not recommend for restaurant planning, memory identification, or medical nutrition advice.",
  },
  MissingLink: {
    problems: [
      "I keep rereading a concept and still do not understand it",
      "I think I am missing a prerequisite idea",
      "I need to find exactly where my understanding broke",
    ],
    capabilities: [
      "traces backward through prerequisite concepts",
      "identifies the likely missing building block",
      "explains the missing prerequisite before returning to the original concept",
    ],
    accepts: [
      "the concept the user is stuck on",
      "what they currently understand",
      "optional course, subject, or context",
    ],
    notFor: [
      "explaining a concept to someone else who has different interests",
      "translating a dense document",
      "general tutoring when no specific conceptual gap is identified",
    ],
    handoffs: [
      { when: "the user understands the concept but needs a listener-specific analogy to explain it", toolId: "AnalogyEngine" },
      { when: "the user has difficult text or a PDF that needs plain-language translation and structural explanation", toolId: "PlainTalk" },
    ],
    primaryIntent: "find the prerequisite concept missing from the user’s understanding",
    whenToRecommend: "Recommend when the user is personally stuck on a concept despite repeated attempts and suspects a missing foundation.",
    whenNotToRecommend: "Do not recommend when the user understands the concept and needs an analogy for another person, or when the difficulty is a dense document rather than a conceptual prerequisite.",
  },
  NameStorm: {
    problems: [
      "I need a name for a product, company, project, event, character, or idea",
      "All the names I think of feel generic or taken",
      "I want many naming directions and help judging which names work",
    ],
    capabilities: [
      "generates names in multiple styles including direct names and blends",
      "tests names against audience, memorability, tone, and fit",
      "helps refine promising directions rather than only producing a list",
    ],
    accepts: [
      "what is being named",
      "audience",
      "desired tone or associations",
      "words, concepts, or constraints to include or avoid",
    ],
    notFor: [
      "identifying a name the user has forgotten",
      "researching trademark availability as a legal determination",
      "writing slogans or full brand strategy when the naming problem is already solved",
    ],
    handoffs: [
      { when: "the user is trying to remember an existing name from partial clues", toolId: "TipOfTongue" },
    ],
    primaryIntent: "generate and evaluate candidate names for something the user is creating",
    whenToRecommend: "Recommend when the user needs to invent a name and wants options plus fit testing.",
    whenNotToRecommend: "Do not recommend when the user is trying to remember an existing name or needs a legal trademark clearance.",
  },
  NotSoFast: {
    problems: [
      "A company, insurer, HOA, agency, university, or provider told me no and I think there may be another path",
      "I need an appeal, exception, waiver, or escalation route",
      "I keep hearing that something is policy and want to know who actually has discretion",
    ],
    capabilities: [
      "maps legitimate appeals, exceptions, waivers, and escalation paths",
      "identifies decision-makers or regulators when appropriate",
      "helps prepare wording for requests and appeals",
      "distinguishes legitimate leverage from deceptive workarounds",
    ],
    accepts: [
      "the organization or system",
      "what the user asked for",
      "the denial or rule",
      "what has already been tried",
      "desired outcome",
    ],
    notFor: [
      "writing a complaint after repeated company nonresponse when the main need is a formal escalation sequence",
      "general difficult interpersonal conversations",
      "illegal or deceptive ways to evade rules",
    ],
    handoffs: [
      { when: "the user has already complained to a company or provider and needs a step-by-step formal complaint escalation plan", toolId: "ComplaintEscalationWriter" },
    ],
    primaryIntent: "find legitimate appeal, exception, waiver, and escalation options after an institutional no",
    whenToRecommend: "Recommend when the user has been told no by a formal system and wants to know what legitimate options remain.",
    whenNotToRecommend: "Do not recommend for ordinary interpersonal conflict, deception, or a complaint-writing problem whose main need is a formal consumer escalation sequence.",
  },
  PlainTalk: {
    problems: [
      "I can read this document but I cannot follow what it means",
      "I need a contract, form, paper, speech, or other dense text translated into plain English",
      "I want to understand both what a text says and how it is structured",
    ],
    capabilities: [
      "translates complex text into plain language",
      "provides a structural x-ray showing argument, obligations, narrative, or logic",
      "extracts key takeaways and important asymmetries appropriate to the text type",
    ],
    accepts: [
      "pasted text",
      "uploaded PDF when supported",
      "the user’s specific comprehension question",
      "optional text type",
    ],
    notFor: [
      "specialist medical-procedure evaluation",
      "renter-specific lease trap analysis when the user wants clause-risk review",
      "interpersonal subtext analysis of a short message",
    ],
    handoffs: [
      { when: "the user has a residential lease and specifically wants unusual or risky rental clauses flagged before signing", toolId: "LeaseTrapDetector" },
      { when: "the user received a short interpersonal message and wants plausible subtext rather than document comprehension", toolId: "DecoderRing" },
      { when: "a medical or dental procedure was recommended and the user wants a patient briefing before deciding", toolId: "ProcedureProbe" },
    ],
    primaryIntent: "understand difficult text through plain-language translation plus structural analysis",
    whenToRecommend: "Recommend when the primary problem is comprehension of a text or document the user already has.",
    whenNotToRecommend: "Do not recommend when the user needs specialist procedure guidance, renter-specific lease risk analysis, or interpersonal message subtext.",
  },
  ProcedureProbe: {
    problems: [
      "A doctor or dentist recommended a procedure and I want to understand it before agreeing",
      "I want to know what questions to ask about a procedure, alternatives, cost, and recovery",
      "I need medical literacy before scheduling a recommended procedure",
    ],
    capabilities: [
      "explains the recommended procedure in plain language",
      "helps assess whether the recommendation is commonly used for the stated situation without giving a personal diagnosis",
      "generates questions about alternatives, risks, recovery, cost, and insurance",
      "highlights practical red flags and follow-up questions",
    ],
    accepts: [
      "procedure name",
      "provider type",
      "reason or situation for which it was recommended",
      "optional insurance or cost context",
      "user concerns",
    ],
    notFor: [
      "preparing for a routine doctor visit",
      "translating notes or lab results after a visit",
      "medical bill disputes",
    ],
    handoffs: [
      { when: "the user has an upcoming medical appointment and needs to organize symptoms and questions", toolId: "DoctorVisitPrep" },
      { when: "the user already has visit notes, labs, or instructions and needs them translated", toolId: "DoctorVisitTranslator" },
      { when: "the user has an actual medical bill or charge problem", toolId: "BillRescue" },
    ],
    primaryIntent: "help a patient understand and question a recommended medical or dental procedure before scheduling it",
    whenToRecommend: "Recommend when the user has been recommended a procedure and wants a structured briefing before saying yes.",
    whenNotToRecommend: "Do not recommend for general visit preparation, post-visit translation, or medical billing.",
  },
  RentersDepositSaver: {
    problems: [
      "I am moving into a rental and want to protect my security deposit",
      "I need to document existing damage before I unpack",
      "I want a move-in condition record and photo checklist",
    ],
    capabilities: [
      "guides a room-by-room move-in condition walkthrough",
      "creates a dated condition record and landlord letter",
      "builds a photo shot list",
      "organizes move-out preservation steps and relevant local deposit-rights context",
    ],
    accepts: [
      "rental address or jurisdiction",
      "landlord information",
      "deposit amount",
      "room-by-room condition notes",
      "photos or photo-taking workflow as supported by the form",
    ],
    notFor: [
      "reviewing lease clauses before signing",
      "fighting a deduction after move-out without move-in documentation",
      "general landlord conversation coaching",
    ],
    handoffs: [
      { when: "the user is about to sign a lease and wants problematic clauses reviewed", toolId: "LeaseTrapDetector" },
      { when: "the user needs a formal escalation plan for an unresolved landlord complaint", toolId: "ComplaintEscalationWriter" },
    ],
    primaryIntent: "create evidence at move-in that can protect a renter’s security deposit later",
    whenToRecommend: "Recommend when the user is moving into a rental and wants to document condition before or immediately after taking possession.",
    whenNotToRecommend: "Do not recommend for pre-signing lease review, unrelated landlord disputes, or post-move-out issues where the main need is escalation.",
  },
  RoastMe: {
    problems: [
      "Roast this resume, dating profile, LinkedIn bio, email, or post",
      "I want funny criticism of text I wrote",
      "Show me the clichés and cringey parts I stopped noticing",
    ],
    capabilities: [
      "produces a personalized comedy roast based on the submitted text",
      "targets specific clichés, buzzwords, humblebrags, or awkward phrasing",
      "supports multiple heat levels",
      "includes at least one sincere positive observation",
    ],
    accepts: [
      "the text to roast",
      "content type when not auto-detected",
      "desired roast intensity",
    ],
    notFor: [
      "serious editing where the user wants neutral professional feedback",
      "harassment of a third party",
      "general jokes unrelated to submitted content",
    ],
    handoffs: [
    ],
    primaryIntent: "give the user a personalized comedy roast of their own submitted text",
    whenToRecommend: "Recommend when the user explicitly wants humorous, pointed criticism of text they provide.",
    whenNotToRecommend: "Do not recommend when the user wants serious editing, generic comedy, or targeted harassment of someone else.",
  },
  SixDegreesOfMe: {
    problems: [
      "I want to see a surprising connection between two parts of my life",
      "How might my childhood hobby connect to my career or relationships?",
      "I want a playful chain linking two personal experiences",
    ],
    capabilities: [
      "builds a step-by-step connection between two user-provided life elements",
      "uses profile context when available to make the links more personal",
      "keeps the chain exploratory rather than claiming hidden causation",
    ],
    accepts: [
      "two things from the user’s life",
      "optional personal profile or context",
    ],
    notFor: [
      "professional networking introductions",
      "finding real-world social connections between people",
      "causal psychological analysis presented as fact",
    ],
    handoffs: [
    ],
    primaryIntent: "create a playful, plausible chain connecting two seemingly unrelated parts of the user’s life",
    whenToRecommend: "Recommend when the user wants reflective curiosity about how two personal experiences or interests might connect.",
    whenNotToRecommend: "Do not recommend for real social-network tracing, introductions, or claims of proven psychological causation.",
  },
  TheDebrief: {
    problems: [
      "I have meeting notes or a transcript and need to know what was decided",
      "Who owns which action items after this meeting?",
      "I need a concise recap and follow-up from a meeting",
    ],
    capabilities: [
      "extracts decisions, commitments, owners, deadlines, open questions, and loose ends",
      "creates meeting summaries",
      "drafts follow-up messages",
      "supports pattern spotting across meetings when that mode is selected",
    ],
    accepts: [
      "meeting transcript",
      "meeting notes",
      "captions from common meeting tools",
      "optional mode such as distill, follow up, or spot patterns",
    ],
    notFor: [
      "general document translation",
      "writing minutes without source notes or transcript",
      "analyzing a personal conversation as relationship subtext",
    ],
    handoffs: [
    ],
    primaryIntent: "convert meeting notes or a transcript into decisions, action items, open questions, and follow-up",
    whenToRecommend: "Recommend when the user has meeting source material and wants an operational debrief.",
    whenNotToRecommend: "Do not recommend for generic document explanation, invented minutes, or interpersonal subtext analysis.",
  },
  TheWholeStory: {
    problems: [
      "I need to explain a firing, resume gap, career pivot, or messy true story",
      "I want to tell the truth strategically to an interviewer or other audience",
      "I need help deciding what to lead with and what can be left out without lying",
    ],
    capabilities: [
      "reframes a true story for a specific audience without changing the facts",
      "identifies what to emphasize and what can be omitted",
      "helps create concise audience-appropriate explanations",
    ],
    accepts: [
      "the full true story",
      "the audience",
      "the context in which it will be told",
      "the user’s goal",
    ],
    notFor: [
      "inventing a cover story or false explanation",
      "listing accomplishments for a resume or review",
      "writing a recommendation for someone else",
    ],
    handoffs: [
      { when: "the user needs to organize and phrase their accomplishments rather than explain a difficult history", toolId: "BragSheetBuilder" },
    ],
    primaryIntent: "frame a difficult true personal or career story honestly for a specific audience",
    whenToRecommend: "Recommend when the user has a real, potentially awkward history they need to explain strategically without lying.",
    whenNotToRecommend: "Do not recommend for fabrication, accomplishment inventories, or references for another person.",
  },
  TipOfTongue: {
    problems: [
      "I know what something is like but cannot remember what it is called",
      "A word or name is on the tip of my tongue",
      "I can remember pieces of something but not its name",
      "I am trying to identify a song, movie, food, product, place, color, scent, word, or other thing from partial clues",
    ],
    capabilities: [
      "suggests likely identities from incomplete or uncertain memory clues",
      "uses sensory details, context, partial facts, sounds, fragments, and exclusions to narrow possibilities",
      "explains which remembered clues support each likely match",
      "offers alternatives when more than one match is plausible",
      "supports iterative narrowing after near misses",
    ],
    accepts: [
      "free-text descriptions",
      "sensory details",
      "partial words, names, sounds, syllables, phrases, lyrics, scenes, or other fragments",
      "where or when it was encountered",
      "things the user knows it is not",
      "uncertain remembered details",
      "a category when known",
    ],
    notFor: [
      "explaining something whose name the user already knows",
      "general factual research about an identified thing",
      "fact checking or verifying a claim",
      "recovering passwords, account credentials, or private access information",
    ],
    handoffs: [
      { when: "the user knows what the product is and wants to judge the price, the timing, or what it will really cost to own", toolId: "BuyWise" },
      { when: "the user knows what something costs and wants to understand why it costs that", toolId: "MarkupDetective" },
    ],
    primaryIntent: "identify something the user cannot remember the name of from partial memory",
    whenToRecommend: "Recommend when the user is trying to recall or identify a specific thing from incomplete, indirect, or uncertain clues.",
    whenNotToRecommend: "Do not recommend when the user already knows what the thing is and wants it explained, researched, verified, evaluated, purchased, located, or otherwise acted on.",
  },
  ToolFinder: {
    problems: [
      "I have a problem but do not know which DeftBrain tool fits",
      "I know what is going on but not what kind of help to ask for",
      "Find the right DeftBrain tool for this situation",
    ],
    capabilities: [
      "routes a plain-language problem to one best starting tool by default",
      "explains why the recommendation fits",
      "tells the user what useful context to bring to the destination tool",
      "lets the user correct the match in ordinary language when it is not quite right",
    ],
    accepts: [
      "a plain-language description of the user’s situation",
      "optional correction describing what the first recommendation missed",
    ],
    notFor: [
      "browsing the complete catalog when the user already knows the tool they want",
      "suggesting a brand-new tool before attempting to route an existing one",
    ],
    handoffs: [
    ],
    primaryIntent: "route a plain-language real-life problem to the most appropriate DeftBrain tool",
    whenToRecommend: "Recommend when the user does not know which DeftBrain tool to use and can describe the underlying problem in ordinary language.",
    whenNotToRecommend: "Do not recommend when the user already knows the destination tool or is simply browsing the catalog.",
  },
  VirtualBodyDouble: {
    problems: [
      "I know what I need to do but working alone makes it hard to start or stay with it",
      "I want someone quietly present while I work",
      "I need an accountability-style coworking session",
    ],
    capabilities: [
      "runs a timed AI body-doubling session",
      "uses a chosen companion style and check-in cadence",
      "keeps the task visible and offers low-pressure check-ins",
      "provides an immediate stuck/help action during the session",
    ],
    accepts: [
      "the task",
      "session duration",
      "companion or session style",
      "optional location, mood, and session goal",
    ],
    notFor: [
      "building a detailed task schedule",
      "breaking a large project into micro-tasks as the primary need",
      "mental-health treatment or crisis support",
    ],
    handoffs: [
      { when: "the user has one overwhelming project and needs it broken into tiny concrete steps", toolId: "TaskAvalancheBreaker" },
      { when: "the user has many tasks that need batching and sequencing across the day", toolId: "BatchFlow" },
    ],
    primaryIntent: "provide an AI coworking companion for a defined solo work session",
    whenToRecommend: "Recommend when the user says they can do the work but benefit from another person’s presence, accountability, or check-ins.",
    whenNotToRecommend: "Do not recommend when the main need is project decomposition, scheduling, or mental-health care.",
  },
  WaitingModeLiberator: {
    problems: [
      "I have an appointment or event later and cannot start anything before it",
      "One thing later is making the whole day feel unusable",
      "I keep watching the clock because I have somewhere to be later",
    ],
    capabilities: [
      "calculates actual free windows before and between events",
      "accounts for user-provided prep and travel buffers",
      "suggests optional activities that fit available time and energy",
      "uses an alarm-based handoff so the user does not have to keep watch",
      "supports a post-event debrief about how much of the day felt reclaimed",
    ],
    accepts: [
      "events and times",
      "prep and travel buffers",
      "current energy",
      "optional tasks the user might want to do",
      "optional anxiety or clock-watching inputs",
    ],
    notFor: [
      "general task batching when no later event is causing the freeze",
      "body-doubling companionship",
      "calendar or live reminder services the tool does not actually schedule",
    ],
    handoffs: [
      { when: "the problem is a scattered task list and context switching rather than one later event freezing the day", toolId: "BatchFlow" },
      { when: "the user mainly wants company or accountability while doing a task", toolId: "VirtualBodyDouble" },
    ],
    primaryIntent: "reclaim usable time that feels unavailable because of a later appointment or event",
    whenToRecommend: "Recommend when an upcoming commitment is causing the user to feel unable to begin anything else or to keep checking the clock.",
    whenNotToRecommend: "Do not recommend for ordinary task scheduling, focus companionship, or live calendar/reminder management.",
  },


  WhichLife: {
    problems: [
      "I am torn between two meaningful life paths and a pro-con list is not settling it",
      "I want to imagine what ordinary life might feel like under each of two options",
      "I keep circling a stay-or-leave, move-or-stay, career, relationship, or other two-path decision",
    ],
    capabilities: [
      "creates two explicitly imagined ordinary-day narratives from the paths the user supplies",
      "uses the user's stated priorities, tensions, and uncertainties to keep the simulations relevant",
      "keeps invented texture inside the simulations and grounds the interpretation afterward in user-supplied facts",
      "highlights the tradeoff the user described, invites the user to notice their reaction, and ends with a grounded question to sit with",
    ],
    accepts: [
      "Path A",
      "Path B",
      "what matters in the decision",
      "what makes the choice difficult or uncertain",
      "a future time horizon",
      "optional personal context that would make the imagined days more relevant",
    ],
    notFor: [
      "predicting which future will actually occur",
      "giving a definitive recommendation about which path to choose",
      "historical counterfactuals",
      "product comparison or other factual side-by-side research",
    ],
    handoffs: [
      { when: "the user wants several strongly different viewpoints on the decision rather than two imagined futures", toolId: "CrowdWisdom" },
      { when: "the user wants the decision run through structured frameworks rather than experiential simulation", toolId: "PlotTwist" },
      { when: "the user wants a direct recommendation rather than a simulation", toolId: "DecisionCoach" },
      { when: "the user wants to change a real historical event and trace an alternate timeline", toolId: "AlternatePath" },
    ],
    primaryIntent: "help the user feel the difference between two meaningful personal futures by imagining an ordinary day in each",
    whenToRecommend: "Recommend when the user is choosing between two personal life paths and wants an experiential way to notice the tradeoffs and their own reaction.",
    whenNotToRecommend: "Do not recommend for factual prediction, a request for one definitive answer, historical counterfactuals, or ordinary product comparison.",
  },

  CrashPredictor: {
    problems: [
      "I keep hitting periods where my energy drops hard and I want to see what tends to happen beforehand",
      "I want a lightweight daily record of energy, sleep, stress, mood, workload, and other signals",
      "I have days when I hit a wall and want to compare those days with the check-ins that came before them",
    ],
    capabilities: [
      "stores one user-reported check-in per day and builds a personal history over time",
      "compares recent check-ins with the user's own prior entries rather than population thresholds",
      "surfaces changes, repeated co-occurrences, and possible patterns while explicitly distinguishing thin evidence from repeated evidence",
      "lets the user mark a day as a crash or hit-a-wall day using their own definition and compares preceding check-ins when enough history exists",
      "can suggest one small reversible experiment and what to watch in later check-ins",
      "supports longer-term pattern review after enough check-ins have accumulated",
    ],
    accepts: [
      "daily energy, sleep, stress, and mood ratings",
      "activities, physical or other noticed signals, and optional notes",
      "an optional user-defined marker that the day was a crash or hit-a-wall day",
      "optional details such as caffeine, alcohol, medication notes, HRV, resting heart rate, sleep hours, and steps",
    ],
    notFor: [
      "diagnosing burnout, depression, anxiety, sleep disorders, or another medical or psychological condition",
      "predicting whether or when a crash will happen or assigning crash probability, severity, or risk colors",
      "interpreting biometrics using universal medical thresholds",
      "providing an immediate energy boost or one-off motivation plan when there is no history to compare",
    ],
    handoffs: [
      { when: "the user wants an immediate plan for managing today's available energy rather than longitudinal pattern tracking", toolId: "PEP" },
      { when: "the user mainly needs live accountability or company while completing a task", toolId: "VirtualBodyDouble" },
    ],
    primaryIntent: "help the user learn their own recurring patterns by comparing daily self-reported check-ins over time",
    whenToRecommend: "Recommend when the user wants to track energy, sleep, stress, mood, or other personal signals across days and learn what tends to coincide with lower-energy or self-marked hit-a-wall periods.",
    whenNotToRecommend: "Do not recommend when the user is asking for a medical diagnosis, a burnout verdict, a crash forecast, biometric interpretation, or only an immediate one-time energy intervention.",
  },

  CrisisPrioritizer: {
    problems: [
      "Everything feels urgent and I do not know what to do first",
      "I have more tasks than time and need a defensible order of attack",
      "I know some deadlines or consequences but I am missing facts that could change the ranking",
      "I need one concrete next action because a full plan is too much right now",
    ],
    capabilities: [
      "turns a task list or messy brain dump into a grounded triage based on supplied deadlines, consequences, dependencies, and people waiting",
      "sorts tasks into Do first, Do next, Can probably wait, and Need one fact without inventing missing urgency",
      "uses available time and energy to test whether the proposed plan appears feasible without treating low energy as evidence of urgency",
      "asks for the smallest missing fact that could materially change a task's position and can re-rank after the user supplies it",
      "offers follow-up actions to split a task, build a schedule, draft a delegation handoff, re-triage after progress, plan a longer period, or reduce the result to one next action",
    ],
    accepts: [
      "individual tasks or an unsorted brain dump",
      "optional task details such as deadlines, consequences, dependencies, and who is waiting",
      "optional available time and energy",
      "optional context or constraints that could affect the order",
    ],
    notFor: [
      "emergency-response instructions for a real medical, safety, legal, or other immediate emergency",
      "diagnosing anxiety, burnout, avoidance, procrastination, or another psychological state",
      "breaking one large project into tiny startable steps when prioritization is not the problem",
      "grouping an already-prioritized day by cognitive mode to reduce context switching",
    ],
    handoffs: [
      { when: "the user has a head full of mixed thoughts, worries, decisions, and tasks and needs the whole pile organized before prioritizing", toolId: "BrainDumpBuddy" },
      { when: "one project feels too large to start and the user mainly needs micro-steps", toolId: "TaskAvalancheBreaker" },
      { when: "the tasks are already known and the user wants them batched by cognitive mode into a lower-switching schedule", toolId: "BatchFlow" },
    ],
    primaryIntent: "put competing tasks into a defensible order using only the urgency evidence the user actually supplies",
    whenToRecommend: "Recommend when several tasks are competing for attention and the user's main question is what deserves attention first, especially when deadlines, consequences, dependencies, or people waiting matter.",
    whenNotToRecommend: "Do not recommend for true emergency response, psychological assessment, a single overwhelming project that only needs decomposition, or ordinary task batching after priorities are already clear.",
  },

  CrowdWisdom: {
    problems: [
      "I am stuck on a decision and want to hear several genuinely different ways of looking at it",
      "I want to expose the blind spots in the way I am currently framing a choice",
      "I want strong disagreement and perspective rather than one supposedly correct answer",
    ],
    capabilities: [
      "puts the user's question in front of five deliberately different simulated lenses: Pragmatist, Risk-Taker, Did It and Regretted It, Didn't and Regretted It, and Contrarian",
      "lets each lens argue its position forcefully without presenting the voice as a real person or fabricated testimony",
      "surfaces what each perspective notices and what it may miss",
      "draws out the central tension across the perspectives and offers an additional question the original framing may have overlooked",
    ],
    accepts: [
      "one decision or question",
      "optional context that makes the perspectives more specific",
    ],
    notFor: [
      "real human testimonials, survey results, community consensus, or sourced public opinion",
      "a definitive recommendation about what the user should choose",
      "factual research about which option is objectively better",
      "stress-testing a belief or rule rather than looking at a concrete choice",
    ],
    handoffs: [
      { when: "the user wants one direct recommendation rather than deliberately conflicting perspectives", toolId: "DecisionCoach" },
      { when: "the user wants the choice analyzed through structured decision frameworks", toolId: "PlotTwist" },
      { when: "the user wants to pressure-test a belief or rule that is driving the choice", toolId: "BeliefStressTest" },
      { when: "the user has exactly two personal paths and wants to imagine an ordinary future day inside each", toolId: "WhichLife" },
    ],
    primaryIntent: "help the user see a decision through several strongly different simulated perspectives so disagreement reveals tradeoffs and blind spots",
    whenToRecommend: "Recommend when the user is stuck on a choice and would benefit from hearing multiple opinionated lenses rather than receiving one answer or another pro-con list.",
    whenNotToRecommend: "Do not recommend when the user wants real people's opinions, sourced evidence, one definitive recommendation, or a formal stress test of a belief.",
  },

  CultureBriefing: {
    problems: [
      "I am traveling somewhere unfamiliar and want to avoid obvious etiquette mistakes",
      "I need to know which cultural practices are widely observed and which vary by setting, region, or generation",
      "I am traveling for business, family, study, remote work, tourism, or a move and want the briefing tailored to that context",
      "I have dietary, religious, accessibility, family, or meeting-specific concerns that could affect how I navigate the destination",
    ],
    capabilities: [
      "creates a destination-specific briefing across greetings, dining, dress, tipping and payment, business etiquette, gifts, religion and customs, getting around, safety and scams, and key phrases or attitude",
      "separates widely observed practices from things best avoided and practices that vary by region, generation, company, relationship, or setting",
      "tailors the briefing to trip purpose, home country, duration, region or city, and specific needs supplied by the traveler",
      "provides practical tips plus small slips and higher-stakes missteps without claiming that an entire culture reacts uniformly",
      "flags information that is worth checking locally rather than presenting changing or uncertain practical details as guaranteed fact",
    ],
    accepts: [
      "destination country or city",
      "optional region, state, or city",
      "trip purpose such as tourism, business, family/social, moving/living, study/research, or remote work",
      "optional trip duration",
      "optional home country",
      "optional specific needs, people being met, dietary or religious needs, accessibility needs, or travel-with-children context",
    ],
    notFor: [
      "live visa, entry, legal, health, or government travel requirements",
      "real-time safety advisories or guarantees that a destination or neighborhood is safe",
      "building a sightseeing itinerary or deciding how to use a layover",
      "pronouncing a specific foreign name, place, menu item, or phrase",
    ],
    handoffs: [
      { when: "the user wants help pronouncing a specific name, place, food, brand, or foreign word", toolId: "PronounceItRight" },
      { when: "the user wants to decide whether to leave the airport and build a safe layover itinerary", toolId: "LayoverMaximizer" },
    ],
    primaryIntent: "prepare a traveler for destination-specific cultural etiquette while clearly separating strong conventions from practices that vary or should be checked locally",
    whenToRecommend: "Recommend when the user is preparing for interaction in another country or culture and wants practical etiquette guidance tailored to the destination and purpose of the trip.",
    whenNotToRecommend: "Do not recommend for live entry requirements, real-time safety advisories, itinerary planning, or pronunciation-only questions.",
  },

  WrongAnswersOnly: {
    problems: [
      "Give me a deliberately wrong answer to a real question",
      "I want a deadpan fake explanation for fun",
      "Tell me something confidently incorrect, then let me see the real answer",
    ],
    capabilities: [
      "generates intentionally false explanations with a chosen seriousness level",
      "uses fake evidence, invented studies, and confident structure for comedic effect",
      "offers a real-answer reveal after the joke",
      "keeps the premise explicit that the answer is intentionally wrong",
    ],
    accepts: [
      "a real question",
      "a wrongness style or seriousness level",
    ],
    notFor: [
      "high-stakes requests where a false actionable answer could cause harm",
      "requests for factual answers without the wrong-answer premise",
      "deceptive misinformation intended to be passed off as real",
    ],
    handoffs: [
    ],
    primaryIntent: "generate an entertaining, explicitly intentional wrong answer to a safe real question",
    whenToRecommend: "Recommend when the user explicitly wants an incorrect answer for entertainment.",
    whenNotToRecommend: "Do not recommend when the user wants factual guidance, intends to deceive others, or asks for unsafe actionable misinformation.",
  },
};
