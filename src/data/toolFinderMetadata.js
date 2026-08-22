export const toolFinderMetadata = {
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
      "I am torn between two life paths and a pro-con list is not helping",
      "I want to imagine what ordinary life might feel like under each option",
      "I am deciding whether to stay or leave, move or stay, take one path or another",
    ],
    capabilities: [
      "creates two explicitly invented ordinary-day narratives based on the user’s two paths",
      "uses stated priorities and tensions to ground the simulations",
      "invites the user to notice reactions without treating the stories as predictions or advice",
    ],
    accepts: [
      "Path A",
      "Path B",
      "what matters in the decision",
      "what makes the choice hard",
      "a future time horizon",
    ],
    notFor: [
      "factual prediction of what will happen",
      "counterfactual history",
      "ranked comparison of arbitrary products or known alternatives",
    ],
    handoffs: [
      { when: "the user wants to change a real historical event and trace the alternate consequences", toolId: "AlternatePath" },
    ],
    primaryIntent: "help the user feel two personal future paths by imagining an ordinary day in each",
    whenToRecommend: "Recommend when the user is weighing two meaningful personal life choices and wants experiential simulation rather than another pro-con list.",
    whenNotToRecommend: "Do not recommend for factual forecasts, historical counterfactuals, or general product comparison.",
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
