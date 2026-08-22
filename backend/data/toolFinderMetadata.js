// Routing metadata for Tool Finder.
//
// Deliberately NOT in src/data/tools.js. That file is the public catalog —
// identity, taxonomy, presentation, SEO, and the guidance a visitor reads.
// What follows is a different thing entirely: instructions for a router, read
// by one backend route and never rendered. Keeping them apart stops tools.js
// from accumulating responsibilities that have nothing to do with the page it
// describes.
//
// Joined to the catalog by id in backend/lib/toolCatalog.js. An id with no
// entry here is not an error — that tool routes on its tagline and description
// alone, which is what every tool did before this file existed.
//
// What each field is for:
//   problems           the visitor's own words for the situation, not ours
//   capabilities       what the tool actually produces — check it against the
//                      built tool, not the marketing. An incomplete list makes
//                      a tool invisible for its own job.
//   accepts            the literal inputs the form takes. Binding: if it isn't
//                      here, Tool Finder must not tell someone to bring it.
//   notFor             the disqualifiers, especially the near-misses. Name the
//                      destination where there is one ("— Bill Rescue handles
//                      those"); a bare exclusion repeated across sibling tools
//                      reads as the catalog having no tool for that thing.
//   primaryIntent      the job, in one sentence
//   whenToRecommend    the situation that makes this the right answer. Describe
//                      the situation, never the visitor's motive — "the pressure
//                      is financial rather than informational" reads as a rule
//                      and silently excluded every bill someone did not
//                      understand.
//   whenNotToRecommend the situation that rules it out, naming the tool that
//                      owns that case instead.

const toolFinderMetadata = {
  AlternatePath: {
    problems: [
      "What if this event in history had gone differently",
      "I want to know if one moment really mattered",
      "What would have happened if that decision went the other way",
    ],
    capabilities: [
      "Builds a plausible alternate timeline from one changed detail",
      "Traces consequences forward through politics, technology, culture, and daily life",
      "Follows an impossible premise as seriously as a real one",
    ],
    accepts: [
      "A historical event",
      "The one detail you'd change",
      "How far forward to run it",
    ],
    notFor: [
      "Decisions in your own life or future",
      "Anything requiring real advice or a next step",
      "Checking historical facts",
      "Regret about choices you personally made",
    ],
    primaryIntent: "Explore what might have happened if one moment in history had gone differently.",
    whenToRecommend: "The person is curious about history and the question is speculative, not personal.",
    whenNotToRecommend: "The two paths being weighed are the person's own (that's Which Life?) — this is diversion, not decision support.",
  },

  ArgueSmarter: {
    problems: [
      "I want to know if my position holds up",
      "I've only ever heard weak versions of the other side",
      "I need to prepare for people who disagree with me",
      "I think I'm right but I'm not sure why",
      "I want to argue better without just winning",
    ],
    capabilities: [
      "Builds the strongest honest case against your position",
      "Presses on your answers and scores how they held",
      "Names the fallacies on both sides, yours included",
      "Replays where you lost ground",
    ],
    accepts: [
      "Your position",
      "How you want it challenged, and how hard",
    ],
    notFor: [
      "Interpersonal conflict with someone you know",
      "Winning an argument that's already underway",
      "Choosing between two life paths",
      "Complaints or disputes with an organisation",
    ],
    primaryIntent: "Test a belief against the best case against it.",
    whenToRecommend: "The person holds a view and wants it stressed rather than confirmed.",
    whenNotToRecommend: "The disagreement is with a specific person in their life and the goal is the relationship rather than the reasoning.",
  },

  AwkwardSilenceFiller: {
    problems: [
      "The conversation died and I don't know what to say",
      "I'm stuck talking to someone and running out of things",
      "I freeze in small talk",
      "I need to get out of this conversation politely",
    ],
    capabilities: [
      "Gives five to seven things you can say right now",
      "Matches them to the specific setting you're in",
      "Includes graceful ways to end the conversation",
    ],
    accepts: [
      "The setting you're in",
      "Any context about who you're with",
    ],
    notFor: [
      "Conversations you need to prepare for in advance",
      "Anything with stakes — conflict, boundaries, bad news",
      "Written messages",
      "Building a relationship over time",
    ],
    primaryIntent: "Have something to say in the next thirty seconds.",
    whenToRecommend: "The moment is happening now and the need is immediate and low-stakes.",
    whenNotToRecommend: "The conversation matters and there is time to prepare (that's Difficult Talk Coach).",
  },

  BillRescue: {
    problems: [
      "This bill is bigger than it should be",
      "I'm behind on a bill and don't know what happens next",
      "I got a collection notice",
      "I can't pay this and I don't know who to call",
      "I don't know if this charge is even correct",
      "I don't understand what these charges are for",
    ],
    capabilities: [
      "Tells you where you actually stand, including what happens if you do nothing",
      "Goes through the charges and flags duplicates, inflated line items, and waivable fees",
      "Names money you might not owe — assistance programmes, billing protections",
      "Names one thing to do today and nothing else until it's done",
      "Writes the words to say on the call or in the letter",
      "Explains payment plans, hardship options, and how to dispute a charge",
    ],
    accepts: [
      "What kind of bill it is",
      "The amount",
      "How far behind you are",
      "The bill's line items, pasted, if you want the charges checked",
      "A single charge you want to question on its own",
    ],
    notFor: [
      "Explaining a diagnosis, test result, or clinical terminology",
      "Contracts, leases, or agreements you haven't signed yet",
      "Everyday budgeting or spending decisions",
      "Legal advice about a lawsuit or judgment",
      "Landlord disputes over a security deposit",
    ],
    primaryIntent: "Turn a bill that is wrong, too large, or late into one thing you can do today.",
    whenToRecommend: "The person is holding a bill, invoice, or collection notice — of any kind, medical included — and needs to understand it, question it, or deal with paying it.",
    whenNotToRecommend: "The document is clinical — notes, results, a diagnosis — rather than a charge. An unclear medical charge is still a bill and belongs here.",
  },

  BragSheetBuilder: {
    problems: [
      "My review is coming up and I can't remember what I did",
      "I know I did good work but I can't describe it",
      "I'm asking for a promotion and need the case",
      "My resume undersells me",
      "I don't know how to talk about my work without sounding arrogant",
    ],
    capabilities: [
      "Turns what you did into statements with strong verbs and real numbers",
      "Prompts you to recall work you've forgotten",
      "Builds the case around the statements for a review or promotion",
    ],
    accepts: [
      "What you did, in your own words",
      "Rough details and estimates it can help you firm up",
    ],
    notFor: [
      "Writing a reference letter for someone else",
      "Preparing for a salary negotiation conversation",
      "Explaining a gap or a firing",
      "Job searching or interview practice",
    ],
    primaryIntent: "Turn work you did into language that shows what it was worth.",
    whenToRecommend: "A review, promotion case, or resume is coming and the person is describing their own work in the language of tasks.",
    whenNotToRecommend: "The writing is about someone else (that's Ghost Writer), or the hard part is a difficult episode to explain (that's The Whole Story).",
  },

  ChaosPilot: {
    problems: [
      "Every week looks the same",
      "Nothing's wrong but nothing's moving",
      "I'm in a rut and don't know how to get out",
      "I feel stuck without knowing why",
    ],
    capabilities: [
      "Diagnoses the pattern behind the stagnation",
      "Names one specific disruption aimed at that pattern",
      "Gives you something you can do today",
    ],
    accepts: [
      "What your typical week looks like",
      "What feels stale about it",
    ],
    notFor: [
      "Situations where something is actually wrong",
      "Career or life decisions between real options",
      "Building routines or habits",
      "Starting a task you're avoiding",
    ],
    primaryIntent: "Break a rut with one disruption chosen for the pattern causing it.",
    whenToRecommend: "The person describes flatness rather than trouble — nothing broken, nothing moving.",
    whenNotToRecommend: "There's a real problem to solve, or the stuckness is about one task rather than the shape of the week.",
  },

  ComplaintEscalationWriter: {
    problems: [
      "I complained to a company and got nowhere",
      "Customer service keeps fobbing me off",
      "I don't know who to contact above the person ignoring me",
      "I want to escalate but don't know if I have grounds",
      "They promised a refund and it never came",
    ],
    capabilities: [
      "Finds the rules, statutes, and regulators that apply to your case",
      "Builds a step-by-step escalation ladder",
      "Writes the letter or email for each step",
      "Names who to contact at each level and what to say",
    ],
    accepts: [
      "The company and its industry",
      "What happened — dates, amounts, promises, names",
    ],
    notFor: [
      "A first complaint you haven't made yet",
      "Disputes with a government agency or institution rather than a company",
      "Bills you can't pay or that are overdue",
      "Rehearsing a conversation with a person you know",
    ],
    primaryIntent: "Escalate a complaint a company has ignored, using the leverage you actually have.",
    whenToRecommend: "The person has already complained to a company at least once and been brushed off.",
    whenNotToRecommend: "The opponent is an agency, insurer, or institution enforcing a policy rather than a business handling a complaint (that's Not So Fast!), or the pressure is a bill rather than a grievance (that's Bill Rescue).",
  },

  ContextCollapse: {
    problems: [
      "I'm about to post something and I'm not sure how it'll land",
      "This message could be taken the wrong way",
      "I don't know if this reads as rude",
      "Different people will read this differently and I can't tell how",
    ],
    capabilities: [
      "Shows how different audiences will read the same message",
      "Points to where it could land wrong",
      "Offers a safer wording",
    ],
    accepts: [
      "The message you're about to send or post",
      "The platform or audience it's going to",
    ],
    notFor: [
      "Messages you have received and don't understand",
      "Conversations you'll have out loud",
      "Formal complaints or escalation letters",
      "Writing the message from scratch",
    ],
    primaryIntent: "See how a message will be read before you send it.",
    whenToRecommend: "The message is written, unsent, and the worry is reception.",
    whenNotToRecommend: "The message came in rather than going out (that's Decoder Ring).",
  },

  DecoderRing: {
    problems: [
      "I got a message and I can't tell what they meant",
      "The words are fine but the tone is off",
      "I don't know if I'm reading too much into this",
      "I don't know how to reply to this",
    ],
    capabilities: [
      "Lays out the ways a message could reasonably be read",
      "Rates how confident any reading deserves to be",
      "Offers a few ways you could reply",
    ],
    accepts: [
      "The exact message, pasted",
      "Where it came from and your relationship to the sender",
    ],
    notFor: [
      "Messages you're about to send",
      "Telling you what the sender definitely meant — nobody can know that",
      "Deciding whether to end a relationship",
      "Conflict that's already open and spoken",
    ],
    primaryIntent: "Widen the readings of a message you can't place, without pretending to certainty.",
    whenToRecommend: "A message has arrived and the words and the feeling don't match.",
    whenNotToRecommend: "The message is outgoing (that's Context Collapse), or the situation needs a spoken conversation.",
  },

  DifficultTalkCoach: {
    problems: [
      "I need to say something and keep putting it off",
      "I don't know how to bring this up without a fight",
      "I need to set a boundary and don't have the words",
      "I know what I want to say but not how they'll react",
      "I freeze when the conversation gets hard",
    ],
    capabilities: [
      "Gives several approaches with exact opening scripts",
      "Predicts the pushback each approach will get, and how to answer it",
      "Lets you rehearse the conversation and debriefs how it went",
      "Covers boundaries, requests, conflict, and feedback",
    ],
    accepts: [
      "What you need to say",
      "Who it's with",
      "What you want to come out of it",
      "How much resistance you expect, and what you're afraid of",
    ],
    notFor: [
      "Apologising for something you've already done",
      "Complaints to a company or institution",
      "Writing a message you'll send instead of speaking",
      "Conversations that have already happened",
    ],
    primaryIntent: "Prepare and rehearse a hard conversation before you have it.",
    whenToRecommend: "The conversation is still ahead of the person and the fear is about how the other side will react.",
    whenNotToRecommend: "Harm has already been done and an apology is what's owed (that's Mend), or the other party is an organisation rather than a person.",
  },

  DoctorVisitPrep: {
    problems: [
      "I have an appointment and I always forget what I meant to ask",
      "The last visit ended before I got to the real thing",
      "I have too many symptoms to explain in fifteen minutes",
      "I'm nervous about being taken seriously",
      "I don't know what to bring or mention",
    ],
    capabilities: [
      "Writes a one-sentence opener that leads with the real concern",
      "Turns scattered worries into an ordered question list",
      "Names what to mention even if the doctor doesn't ask",
      "Builds a pre-visit checklist of what to bring",
    ],
    accepts: [
      "Your main concern, in your own words",
      "How long it has been going on",
      "What you have already tried",
      "What worries you most",
    ],
    notFor: [
      "Explaining notes or results from a visit that already happened",
      "Medical bills or insurance statements — Bill Rescue handles those",
      "Deciding whether to accept a recommended procedure",
      "Diagnosing what you have or telling you if it's serious",
    ],
    primaryIntent: "Walk into an appointment that hasn't happened yet with the important thing said first.",
    whenToRecommend: "An appointment is coming up and the person is worried the short visit will get away from them.",
    whenNotToRecommend: "The visit already happened (that's Doctor Visit Translator), or the decision on the table is a specific named procedure (that's Procedure Probe).",
  },

  DoctorVisitTranslator: {
    problems: [
      "I don't understand what my doctor told me",
      "There are medical terms in my notes I can't read",
      "I forgot half of what was said at the appointment",
      "My test results came back and I don't know what they mean",
      "I don't know which of these instructions actually matters",
    ],
    capabilities: [
      "Translates medical terminology into plain language",
      "Explains what a diagnosis or test result means",
      "Sorts the instructions by what matters most",
      "Explains what each medication is for",
      "Writes the questions to ask at the follow-up",
    ],
    accepts: [
      "Typed or pasted visit notes",
      "A description of what the doctor said, from memory",
      "A diagnosis, test result, or medication name",
    ],
    notFor: [
      "Medical bills or insurance statements — Bill Rescue handles those",
      "Photos, scans, or uploaded files of any kind",
      "Deciding whether to have a procedure",
      "Preparing for an appointment that hasn't happened yet",
      "Diagnosing a symptom or giving medical advice",
    ],
    primaryIntent: "Understand what you were told at an appointment that already happened.",
    whenToRecommend: "The visit is over and the person is holding words they can't read — notes, a diagnosis, a result, a medication list.",
    whenNotToRecommend: "The appointment hasn't happened yet (that's Doctor Visit Prep), a specific procedure is being decided (that's Procedure Probe), or the document is a bill (that's Bill Rescue).",
  },

  FakeReviewDetective: {
    problems: [
      "These reviews look too good to be true",
      "I don't know if I can trust this product's rating",
      "All the five-star reviews sound the same",
      "I'm about to buy something and the reviews feel off",
    ],
    capabilities: [
      "Computes star distribution, verified share, and date clustering from the reviews",
      "Flags language patterns common in planted reviews",
      "Scores individual reviews for authenticity and says why",
    ],
    accepts: [
      "Pasted review text",
      "A product page URL to pull reviews from",
    ],
    notFor: [
      "Deciding which of two products to buy",
      "Judging whether a product is good, only whether the reviews are real",
      "Checking a business, a person, or a news source",
      "Reviews you want written rather than checked",
    ],
    primaryIntent: "Find out whether a product's reviews are real before you trust them.",
    whenToRecommend: "The person is suspicious of a rating or a run of reviews and has the reviews or the page.",
    whenNotToRecommend: "The doubt is about the price rather than the reviews, or about a claim rather than a product.",
  },

  FinalWish: {
    problems: [
      "Nobody knows my passwords if something happens to me",
      "My accounts and documents are scattered and nobody could find them",
      "I want to leave instructions for the people I trust",
      "I keep meaning to get my affairs in order",
    ],
    capabilities: [
      "Guides you through accounts, documents, finances, devices, and subscriptions",
      "Covers the digital estate a will usually doesn't mention",
      "Lets you write messages and wishes alongside the practical details",
      "Produces one encrypted package for the person you trust",
    ],
    accepts: [
      "Your answers to a guided interview, taken in as many sittings as you want",
    ],
    notFor: [
      "Writing a legal will or anything a lawyer must draft",
      "Grief, loss, or a death that has already happened",
      "Immediate medical or end-of-life decisions",
      "Day-to-day password management",
    ],
    primaryIntent: "Put everything the people you trust would need in one place they can open.",
    whenToRecommend: "The person is thinking ahead about what others would need, and nothing has happened yet.",
    whenNotToRecommend: "Someone has died or is dying and the need is support rather than preparation.",
  },

  GhostWriter: {
    problems: [
      "Someone asked me for a recommendation letter and I've been putting it off",
      "I know they're great but I can't get it on the page",
      "The reference deadline is close and I have nothing",
      "I don't know what a letter like this should say",
    ],
    capabilities: [
      "Writes a finished recommendation letter in your voice",
      "Pulls specific evidence out of what you know about the person",
      "Structures the letter for what they're applying to",
    ],
    accepts: [
      "Their name and your relationship to them",
      "What they're applying for",
      "What you know about them, however rough",
    ],
    notFor: [
      "Writing about your own accomplishments",
      "Letters that aren't recommendations or references",
      "Anything you'd send as if the other person wrote it themselves",
    ],
    primaryIntent: "Get a recommendation letter written that does the person justice.",
    whenToRecommend: "The person has been asked to recommend someone else and the blocker is writing, not opinion.",
    whenNotToRecommend: "The subject of the writing is the person themselves (that's Brag Sheet Builder).",
  },

  HistoryToday: {
    problems: [
      "Has anything like this happened before",
      "I want a historical parallel that isn't the obvious one",
      "Everyone says this is like Rome and I don't buy it",
      "I want to know how this kind of situation usually ends",
    ],
    capabilities: [
      "Finds a parallel matched on the underlying mechanism, not surface resemblance",
      "Says what happened next that time",
      "Says where the comparison holds and where it breaks",
    ],
    accepts: [
      "A current event or trend",
      "An angle, if you have one",
    ],
    notFor: [
      "Predicting what will happen",
      "Personal decisions or advice",
      "Counterfactuals about how history could have gone",
      "Checking whether a claim about the news is true",
    ],
    primaryIntent: "Find the structural historical parallel to something happening now.",
    whenToRecommend: "The question is about a current event and the person wants perspective rather than a decision.",
    whenNotToRecommend: "They want to change history rather than compare it (that's Alternate Path), or they want to know what to do.",
  },

  LayoverMaximizer: {
    problems: [
      "I have a long layover and don't know if I can leave the airport",
      "Is there time to see the city between flights",
      "I don't know how much of my connection is actually free",
      "I'm stuck in a terminal for six hours",
    ],
    capabilities: [
      "Subtracts deplaning, immigration, transit, security, and a buffer from your connection",
      "Gives a go, stay, or risky verdict and shows the arithmetic",
      "Recommends one plan that fits the time that's left",
      "Sets the time you need to be back by",
    ],
    accepts: [
      "The airport",
      "How long the layover is",
      "Whether you have a passport or visa, and what you want out of it",
    ],
    notFor: [
      "Planning a whole trip or itinerary",
      "Finding flights or booking anything",
      "Delays, cancellations, or missed connections",
      "Places you're staying overnight rather than connecting through",
    ],
    primaryIntent: "Find out what you can actually do between two flights.",
    whenToRecommend: "There's a connection with real hours in it and the person is deciding whether to leave the airport.",
    whenNotToRecommend: "The trip itself is what needs planning, or the flight has already gone wrong.",
  },

  LeaseTrapDetector: {
    problems: [
      "I'm about to sign a lease and don't know what I'm agreeing to",
      "There's a clause in my lease that seems unfair",
      "My landlord added something unusual to the contract",
      "I don't know if this lease term is even legal here",
      "I want someone to read this before I sign",
    ],
    capabilities: [
      "Flags unusual or predatory clauses in a lease",
      "Explains what each flagged clause actually means",
      "Compares clauses against tenant law in your city and state",
      "Says which terms are likely unenforceable where you live",
    ],
    accepts: [
      "The lease as a PDF",
      "The lease text, pasted",
      "Your city and state",
    ],
    notFor: [
      "Documenting the condition of a place you're moving into",
      "Getting a deposit back after a deduction",
      "Disputes with a landlord about something that already happened",
      "Contracts that aren't residential leases",
      "Legal representation or a lawyer's opinion",
    ],
    primaryIntent: "Read a lease before you sign it and find what's in there that shouldn't be.",
    whenToRecommend: "A lease is unsigned or newly signed and the person wants to know what's in it.",
    whenNotToRecommend: "The person has already moved in and the question is about protecting a deposit (that's Renter's Deposit Saver), or the dispute is with a company rather than about contract language.",
  },

  MarkupDetective: {
    problems: [
      "This costs way more than it should",
      "I want to know if I'm being ripped off",
      "Why is this so expensive",
      "I don't understand what I'm paying for",
      "Is this price normal",
    ],
    capabilities: [
      "Breaks a price into materials, labour, brand premium, and margin",
      "Explains the pricing psychology being used on you",
      "Says whether the price is typical for that thing",
    ],
    accepts: [
      "The product or service",
      "The price you saw",
    ],
    notFor: [
      "Bills you have already been charged and need to deal with",
      "Deciding between two specific products to buy",
      "Negotiating a price down",
      "Repair quotes and whether they're fair",
    ],
    primaryIntent: "Understand where the money in a price actually goes.",
    whenToRecommend: "The person is curious or suspicious about a price, and hasn't paid yet or isn't disputing it.",
    whenNotToRecommend: "A bill has arrived and needs handling (that's Bill Rescue) — this explains pricing, it doesn't resolve a charge.",
  },

  Mend: {
    problems: [
      "I said something and I don't know how bad it was",
      "I don't know if I owe an apology or I'm overthinking it",
      "I apologized and it made things worse",
      "I keep apologizing for things that may not be my fault",
      "I don't know what to actually say",
    ],
    capabilities: [
      "Separates the actual harm from your actual responsibility",
      "Sizes the apology to what happened, in both directions",
      "Writes what to say and names the phrases that make it worse",
      "Gives one thing to do after the words",
    ],
    accepts: [
      "What happened, in your own words",
      "Your relationship to the person",
    ],
    notFor: [
      "Rehearsing a hard conversation that isn't an apology",
      "Ongoing conflict where nobody has done anything wrong yet",
      "Deciding whether to end a relationship",
      "Workplace complaints or escalation",
    ],
    primaryIntent: "Find out how big this apology should actually be, then say it right.",
    whenToRecommend: "Something has already happened, the person did it, and the question is what it costs and how to say so.",
    whenNotToRecommend: "The conversation hasn't happened yet and no harm has been done (that's Difficult Talk Coach), or the trouble is mutual rather than owed.",
  },

  MentalHealthNavigator: {
    problems: [
      "I know I need help but not what kind",
      "Therapist, psychiatrist, or something else — I don't know the difference",
      "I don't know who to call first",
      "I've been struggling and don't know where to start",
      "I don't know what this will cost or if I can afford it",
    ],
    capabilities: [
      "Says which kind of professional fits your situation and what each does differently",
      "Explains how to get in the door and what it tends to cost",
      "Gives you what to say when you reach out",
      "Names what you can do in the next couple of days",
    ],
    accepts: [
      "What's been on your mind, in your own words",
      "Your situation and anything you've already tried",
    ],
    notFor: [
      "Crisis or emergency — it is not a crisis line",
      "Therapy itself, or ongoing counselling",
      "Diagnosing a condition",
      "Medication questions",
    ],
    primaryIntent: "Answer the question that comes before therapy: who to call.",
    whenToRecommend: "The person knows something is wrong and the obstacle is not knowing what kind of help exists or how to reach it.",
    whenNotToRecommend: "There is immediate danger, or they already have a provider and want help with the work itself.",
  },

  MiseEnPlace: {
    problems: [
      "There's food in the fridge and I don't know what to make",
      "I don't know what to start first when I'm cooking several things",
      "I have thirty minutes and no plan",
      "I keep wasting ingredients",
    ],
    capabilities: [
      "Builds a meal from what you actually have",
      "Puts the steps in order — what to start first, what to do while it cooks",
      "Fits the plan to your time, skill, and dietary needs",
    ],
    accepts: [
      "A list of what you have",
      "A photo of the fridge or pantry",
      "Your time, skill level, and dietary needs",
    ],
    notFor: [
      "Finding a specific named recipe",
      "Weekly meal planning or shopping lists",
      "Nutrition, calories, or diet programmes",
      "Restaurant or takeout decisions",
    ],
    primaryIntent: "Get from what's in the fridge to a meal, in the right order.",
    whenToRecommend: "There are ingredients and a time window, and the blocker is deciding and sequencing.",
    whenNotToRecommend: "They already know what they're making and want the recipe itself.",
  },

  MissingLink: {
    problems: [
      "I've read this four times and still don't get it",
      "I'm stuck on a concept and don't know why",
      "I keep failing at this topic no matter how much I study",
      "I don't know what I'm missing",
    ],
    capabilities: [
      "Traces backwards to find the prerequisite you're actually missing",
      "Says what to learn first, before the hard part",
      "Works out the surrounding subject from the concept you name",
    ],
    accepts: [
      "The concept you're stuck on",
      "Your level",
    ],
    notFor: [
      "Teaching the concept itself in full",
      "Homework answers or problem solving",
      "Study schedules or exam planning",
      "Deciding what subject to study",
    ],
    primaryIntent: "Find where your understanding actually broke, which is earlier than where you're stuck.",
    whenToRecommend: "The person is stuck on a specific concept and re-reading isn't working.",
    whenNotToRecommend: "Nothing specific is named, or they want the material taught rather than diagnosed.",
  },

  NameStorm: {
    problems: [
      "I need a name for my business and everything good is taken",
      "I can't name this project",
      "I need a name that sounds right and isn't already used",
      "I've been going in circles on a name for weeks",
    ],
    capabilities: [
      "Generates twenty-five to thirty-five names across different styles",
      "Explains the reasoning behind each one",
      "Checks a shortlist for how well it holds up before you commit",
    ],
    accepts: [
      "What needs naming",
      "The energy or feel you want",
    ],
    notFor: [
      "Trademark clearance or legal availability",
      "Registering a domain or checking one is free",
      "Logos, branding, or visual identity",
      "Renaming something after it's already established, unless you want fresh options",
    ],
    primaryIntent: "Find a name you can actually commit to.",
    whenToRecommend: "Something needs a name and the person is stuck for options or second-guessing a shortlist.",
    whenNotToRecommend: "The question is legal — whether a name is free to use — which this does not determine.",
  },

  NotSoFast: {
    problems: [
      "I was denied and I don't think the decision is right",
      "My claim was rejected and the letter explains nothing",
      "I keep getting told it's policy",
      "I don't know how to appeal",
      "Nobody I can reach has the authority to help me",
    ],
    capabilities: [
      "Finds the exceptions a system has but doesn't advertise",
      "Names the phrases that route your call to someone who can decide",
      "Identifies the regulator or ombudsman that actually investigates",
      "Lays out the escalation ladder step by step",
    ],
    accepts: [
      "The system you're up against — agency, insurer, institution, company",
      "What the problem is",
      "The outcome you want",
    ],
    notFor: [
      "A complaint about service quality you haven't raised yet",
      "Bills that are simply too large or overdue",
      "Reading a contract you haven't signed",
      "Legal advice or representation in a case",
    ],
    primaryIntent: "Find the way through after a formal system has told you no.",
    whenToRecommend: "A denial, rejection, or refusal has been issued by an organisation with rules — insurance, benefits, a school, a bank, an agency.",
    whenNotToRecommend: "The trouble is a company ignoring a customer complaint (that's Complaint Escalation Writer), or a ticket or fine (that's Ticket Tackler).",
  },

  PlainTalk: {
    problems: [
      "I can read this but I have no idea what it means",
      "This document is deliberately hard to follow",
      "I need to understand a contract, a form, or a policy",
      "What is this text actually trying to do",
      "I don't know what they left out",
    ],
    capabilities: [
      "Translates dense text into plain English",
      "Shows how the text is built and what each part is doing",
      "Names what the text avoids saying",
    ],
    accepts: [
      "Pasted text of any length and subject",
      "A PDF",
    ],
    notFor: [
      "Checking a lease against tenant law",
      "Medical notes and results, which have their own tool",
      "Writing or rewriting text for you",
      "Deciding what to do about what the document says",
    ],
    primaryIntent: "Understand a difficult piece of text, and see what its shape reveals.",
    whenToRecommend: "The person has the text in front of them and comprehension is the whole problem.",
    whenNotToRecommend: "The document is a lease being signed (that's Lease Trap Detector) or clinical notes from a visit (that's Doctor Visit Translator) — those read the same text against something specific.",
  },

  ProcedureProbe: {
    problems: [
      "A procedure was recommended and I don't know if I need it",
      "I don't know what questions to ask before I agree",
      "I want to know if there's an alternative to surgery",
      "I'm not sure this recommendation is standard",
      "I don't know what recovery involves",
    ],
    capabilities: [
      "Explains a named procedure in plain language",
      "Says whether the recommendation is standard for that situation",
      "Lists the exact questions to ask before agreeing",
      "Names the alternatives, including doing nothing",
      "Describes what recovery and cost tend to look like",
    ],
    accepts: [
      "The name of the procedure",
      "The type of provider who recommended it",
      "Why it was recommended, if you know",
    ],
    notFor: [
      "Explaining notes or results from a past visit",
      "General appointment preparation with no specific procedure named",
      "Medical bills or insurance statements — Bill Rescue handles those",
      "Telling you whether to go ahead — it prepares the question, not the answer",
    ],
    primaryIntent: "Understand a specific recommended procedure well enough to answer yes or no.",
    whenToRecommend: "A named procedure, surgery, or test has been recommended and the person is deciding whether to schedule it.",
    whenNotToRecommend: "Nothing specific has been recommended yet (that's Doctor Visit Prep), or the question is about understanding what was already said (that's Doctor Visit Translator).",
  },

  RentersDepositSaver: {
    problems: [
      "I'm moving in and don't want to be blamed for damage that was already here",
      "I don't know what to photograph before I unpack",
      "I want a record my landlord can't argue with later",
      "Last time I lost my deposit and had nothing to show",
    ],
    capabilities: [
      "Walks you room by room through what to check",
      "Says which photos to take and what they need to show",
      "Produces a formal condition report",
      "Writes a cover letter to send the landlord with it",
    ],
    accepts: [
      "The address and landlord",
      "The deposit amount",
      "Your room-by-room notes on what you find",
    ],
    notFor: [
      "Reading or checking a lease before signing",
      "Fighting a deduction that has already been made",
      "Getting money back after you've moved out",
      "Anything after the first days of a tenancy — it is built for move-in",
    ],
    primaryIntent: "Create the move-in evidence a year before you need it.",
    whenToRecommend: "The person is moving in now, or has just moved in, and the deposit is still whole.",
    whenNotToRecommend: "The deduction has already happened or the tenancy has ended — this builds a record, it does not dispute one. Reading the lease itself is Lease Trap Detector.",
  },

  RoastMe: {
    problems: [
      "I want my writing made fun of",
      "My LinkedIn bio is probably full of clichés",
      "I can't tell if my dating profile sounds ridiculous",
      "I want honest feedback but funnier",
    ],
    capabilities: [
      "Roasts the specific content you submitted, not generic insults",
      "Names the clichés, buzzwords, and humblebrags you stopped noticing",
      "Runs at three heat levels",
    ],
    accepts: [
      "Any text — resume, dating profile, LinkedIn bio, email, post",
    ],
    notFor: [
      "Serious editing or rewriting",
      "Roasting another person",
      "Career or dating advice",
      "Anything where the person wants encouragement",
    ],
    primaryIntent: "Be made fun of accurately, for what's actually on the page.",
    whenToRecommend: "The person is asking to be roasted, or wants their own writing punctured for laughs.",
    whenNotToRecommend: "They want the text improved rather than mocked, or the target is somebody else.",
  },

  SixDegreesOfMe: {
    problems: [
      "I wonder how these two parts of my life connect",
      "I want something to play with about myself",
      "Is there a thread between my hobby and my job",
    ],
    capabilities: [
      "Traces the chain between any two things in your life, link by link",
      "Gets richer if you build a profile first",
    ],
    accepts: [
      "Two things from your life",
      "An optional profile you build once and reuse",
    ],
    notFor: [
      "Career decisions or life planning",
      "Genealogy or family history",
      "Connections between real public people or events",
      "Anything with a practical outcome",
    ],
    primaryIntent: "See the thread between two unrelated-looking parts of your own life.",
    whenToRecommend: "The mood is curiosity and there's nothing to decide.",
    whenNotToRecommend: "There's an actual problem or choice on the table — this is a diversion.",
  },

  TheDebrief: {
    problems: [
      "The meeting ended and nobody wrote anything down",
      "I don't know what we actually decided",
      "Who agreed to do what",
      "I have a transcript and no notes",
      "I need to send a follow-up and don't know what to say",
    ],
    capabilities: [
      "Pulls decisions, action items, owners, and deadlines out of a transcript",
      "Lists the questions left open",
      "Drafts the follow-up messages",
      "Spots patterns across meetings",
    ],
    accepts: [
      "A meeting transcript — Zoom captions, Teams, Otter",
      "Your own rough notes",
    ],
    notFor: [
      "Meetings that haven't happened yet",
      "Lectures, talks, or long reads",
      "Audio or video files — it takes text",
      "Deciding whether a meeting was worth having",
    ],
    primaryIntent: "Turn a meeting transcript into decisions, owners, and follow-ups.",
    whenToRecommend: "The meeting is over and there is a transcript or notes to work from.",
    whenNotToRecommend: "There's no record of what was said, or the material is a lecture rather than a meeting.",
  },

  TheWholeStory: {
    problems: [
      "I have a gap on my resume I'll have to explain",
      "I was fired and don't know how to talk about it",
      "There's a messy thing in my past that keeps coming up",
      "I need to explain a bankruptcy, a break, a bad exit",
      "I don't want to lie but the truth sounds bad",
    ],
    capabilities: [
      "Reframes a true story for a specific audience",
      "Says what to lead with and what to leave out",
      "Gives several versions for different listeners",
      "Prepares you for the follow-up questions",
    ],
    accepts: [
      "The real story, in detail, including the messy parts",
      "Who you're telling and why",
    ],
    notFor: [
      "Making up a cover story or changing the facts",
      "Apologising to someone you've hurt",
      "Rehearsing a live conversation back and forth",
      "Writing a resume or cover letter",
    ],
    primaryIntent: "Tell a true and difficult story in a way a particular audience can hear.",
    whenToRecommend: "Something real happened that the person will have to explain to someone, and they want it told truthfully and well.",
    whenNotToRecommend: "The request is to invent, hide, or misrepresent what happened.",
  },

  TipOfTongue: {
    problems: [
      "I can't remember what it's called",
      "There's a song stuck in my head and I don't know it",
      "I'm trying to find a book I read as a kid",
      "I remember the taste but not the name",
      "I can picture the movie but nothing else",
    ],
    capabilities: [
      "Identifies something from partial, sensory, or half-remembered details",
      "Offers alternatives when the clues are ambiguous",
      "Explains why each candidate fits what you described",
    ],
    accepts: [
      "Whatever fragments you remember — a flavour, a lyric, a colour, a scene, an era",
      "A category, if you have one",
    ],
    notFor: [
      "Looking up something you can already name",
      "Finding where to buy something",
      "Facts, definitions, or explanations",
      "Remembering something about your own life",
    ],
    primaryIntent: "Put a name to the thing you can describe but not call.",
    whenToRecommend: "The person has fragments and no name, and a search engine would need the name they don't have.",
    whenNotToRecommend: "They already know what it is and want information about it.",
  },

  VirtualBodyDouble: {
    problems: [
      "I can't get started on this",
      "I work better when someone else is around",
      "I keep drifting off the task",
      "I have a boring task I've been avoiding for days",
      "I need someone to sit with me while I do this",
    ],
    capabilities: [
      "Runs a timed working session with a companion who checks in",
      "Splits a vague task into steps you can start on",
      "Offers different companion personalities for different work",
      "Handles getting stuck and taking breaks during the session",
    ],
    accepts: [
      "What you're working on",
      "How long you want to work",
      "A session mode and a mood",
    ],
    notFor: [
      "Planning a week or organising a backlog",
      "Deciding what to work on",
      "Doing the work for you",
      "Long-term habit or accountability tracking",
    ],
    primaryIntent: "Sit down and actually start, with someone in the room.",
    whenToRecommend: "The person knows what they need to do and cannot begin, or begins and drifts.",
    whenNotToRecommend: "The problem is which task to pick or how to structure a whole day rather than starting one thing.",
  },

  WaitingModeLiberator: {
    problems: [
      "I have something later and can't start anything",
      "My whole day is frozen around one appointment",
      "I keep checking the clock",
      "I know I have hours free but I can't use them",
      "I have a thing at 2 and it's 10 and I've done nothing",
    ],
    capabilities: [
      "Works out the free windows your day actually has",
      "Says what realistically fits in each one, including nothing",
      "Tells you when to set the prep alarm so you can stop tracking time",
      "Debriefs afterwards on how the waiting went",
    ],
    accepts: [
      "What's happening later, and when",
      "Prep and travel time",
      "How you're feeling and how much you're watching the clock",
    ],
    notFor: [
      "Planning a week or a project",
      "Scheduling or booking anything",
      "Deciding whether to go to the thing",
      "Anxiety about the event itself rather than the waiting",
    ],
    primaryIntent: "Get the day back from an appointment that hasn't happened yet.",
    whenToRecommend: "There is a fixed thing later today and the person is stalled by it.",
    whenNotToRecommend: "The stalling is about starting one task (that's Virtual Body Double), or the day has no fixed event in it.",
  },

  WhichLife: {
    problems: [
      "I'm choosing between two paths and the pro/con list didn't help",
      "Stay or leave",
      "I can't tell which of these I actually want",
      "Both options look fine on paper",
      "I keep going back and forth",
    ],
    capabilities: [
      "Writes an ordinary day inside each future, specific rather than idealised",
      "Names the real trade-off between them",
      "Separates what you told it from what it imagined",
      "Gives you something to notice in your own reaction",
    ],
    accepts: [
      "Path A and Path B, described honestly",
      "What's making the choice hard",
      "What matters to you here",
    ],
    notFor: [
      "Choosing between more than two options",
      "Historical or hypothetical scenarios that aren't yours",
      "Telling you which to pick",
      "Financial modelling or cost comparisons",
    ],
    primaryIntent: "Feel what each of two futures is like to live before choosing between them.",
    whenToRecommend: "There are exactly two real paths, both plausible, and analysis has stopped helping.",
    whenNotToRecommend: "The question is speculative or historical rather than the person's own life (that's Alternate Path), or they want a recommendation rather than a feel for it.",
  },

  WrongAnswersOnly: {
    problems: [
      "I want a deliberately wrong answer",
      "I need something silly right now",
      "Give me the funniest possible explanation",
      "I want to be entertained, not informed",
    ],
    capabilities: [
      "Answers a real question confidently and completely incorrectly",
      "Keeps the wrong answer internally consistent and well structured",
      "Offers the real answer afterwards if you want it",
      "Runs at three levels of straight-facedness",
    ],
    accepts: [
      "Any real question",
      "How straight-faced you want the answer",
    ],
    notFor: [
      "Anything the person might act on",
      "Real information or a genuine explanation",
      "Medical, legal, safety, or financial questions",
      "Anything sensitive where a wrong answer isn't funny",
    ],
    primaryIntent: "Get an answer that is wrong on purpose and knows it.",
    whenToRecommend: "The person wants amusement and there is nothing at stake.",
    whenNotToRecommend: "There is a real problem underneath the question — never route a person who needs help into a joke.",
  },
};

module.exports = { toolFinderMetadata };
