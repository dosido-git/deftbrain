#!/usr/bin/env python3
# v1.0 · 2026-05-16
"""
DeftBrain API Performance Baseline

Hits every tool endpoint with a minimal probe payload, records response time,
compares against a stored baseline, and reports regressions and wins.

Usage:
    python3 perf_baseline.py --url https://deftbrain.com
    python3 perf_baseline.py --url http://localhost:3001 --save       # save new baseline
    python3 perf_baseline.py --url https://deftbrain.com --tool OnePercenter
    python3 perf_baseline.py --url https://deftbrain.com --concurrency 3
    python3 perf_baseline.py --url https://deftbrain.com --json

Baseline file: perf_baseline.json (created in CWD on first --save run).
On subsequent runs, deltas are shown vs baseline. Regressions (>20% slower)
are flagged. Improvements (>20% faster) are highlighted.

Exit code: number of regressions (0 = clean).
"""

import argparse, json, os, re, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

try:
    import urllib.request, urllib.error
    HAS_URLLIB = True
except ImportError:
    HAS_URLLIB = False

# ─── PascalCase → kebab-case ──────────────────────────────────────────────
def to_kebab(name):
    # Insert hyphen before uppercase letters that follow a lowercase or digit
    s = re.sub(r'([a-z0-9])([A-Z])', r'\1-\2', name)
    return s.lower()

# ─── Tool ID list (from tools.js, 121 tools) ──────────────────────────────
TOOL_IDS = [
    'AlternatePath', 'AnalogyEngine', 'ApologyCalibrator', 'ArgumentSimulator',
    'AwkwardSilenceFiller', 'BatchFlow', 'BeliefStressTest', 'BikeMedic',
    'BillRescue', 'Bookmark', 'BragSheetBuilder', 'BrainDumpBuddy',
    'BrainRoulette', 'BrainStateDeejay', 'BuyWise', 'CaptionMagic',
    'ChaosPilot', 'ColdOpenCraft', 'ComebackCooker', 'ComplaintEscalationWriter',
    'ConflictCoach', 'ContextCollapse', 'ContrastReport', 'CrashPredictor',
    'CrisisPrioritizer', 'CrowdWisdom', 'DateNight', 'DebateMe',
    'DecisionCoach', 'DecoderRing', 'DifficultTalkCoach', 'DoctorVisitPrep',
    'DoctorVisitTranslator', 'DreamPatternSpotter', 'DriveHome', 'EgoKiller',
    'EmailUrgencyTriager', 'FakeReviewDetective', 'FanTheory', 'FinalWish',
    'FocusPocus', 'FocusSoundArchitect', 'FriendshipFadeAlerter', 'FutureProof',
    'GentlePushGenerator', 'GhostWriter', 'Giftology', 'GratitudeDebtClearer',
    'GravityWell', 'HecklerPrep', 'HistoryToday', 'HobbyMatch',
    'JargonAssassin', 'LaundroMat', 'LayoverMaximizer', 'LazyWorkoutAdapter',
    'LeaseTrapDetector', 'LedeBuilder', 'LeverageLogic', 'LuckSurface',
    'MagicMouth', 'MarkupDetective', 'MeetingBSDetector', 'MeetingHijackPreventer',
    'MicroAdventureMapper', 'MiseEnPlace', 'MoneyDiplomat', 'NameAudit',
    'NameStorm', 'NameThatFeeling', 'NerveCheck', 'NoiseCanceler',
    'OnePercenter', 'PEP', 'PartyArchitect', 'PetWeirdnessDecoder',
    'PlainTalk', 'PlantRescue', 'PlotHole', 'PlotTwist',
    'PreMortem', 'ProcedureProbe', 'PronounceItRight', 'Recall',
    'RechargeRadar', 'RecipeChaosSolver', 'RentersDepositSaver', 'ResearchDecoder',
    'RoastMe', 'RoomReader', 'RoommateCourt', 'RulebookBreaker',
    'SafeWalk', 'SensoryMinefieldMapper', 'SignalVsNoise', 'SixDegreesOfMe',
    'SkillGapMap', 'SocialEnergyAudit', 'SpiralStopper', 'SubSweep',
    'SubscriptionGuiltTrip', 'TaskAvalancheBreaker', 'TheAlibi', 'TheDebrief',
    'TheFinalWord', 'TheGap', 'TheRunthrough', 'TimeWarp',
    'TipOfTongue', 'ToastWriter', 'ToolFinder', 'TruthBomb',
    'UpsellShield', 'VelvetHammer', 'VirtualBodyDouble', 'WaitingModeLiberator',
    'WardrobeChaosHelper', 'WhatIf', 'WhatsMyVibe', 'WhereDidTheTimeGo',
    'WrongAnswersOnly',
    # New tools (not yet in tools.js)
    'ContractDecoder', 'CultureBriefing', 'GriefGuide', 'IdeaAutopsy',
    'MentalHealthNavigator', 'ScamRadar', 'SleepArchitect',
]

# ─── Probe payloads ────────────────────────────────────────────────────────
# Minimal payloads that satisfy each backend's validation without triggering
# excessive Claude output. Override here when the default probe fails.
# Default: { text: '...' } — works for most single-input tools.

DEFAULT_PAYLOAD = {'text': 'Test input for performance baseline measurement.'}

PAYLOADS = {
    # Ground truth: field names extracted from callToolEndpoint() in each frontend file
    'AlternatePath': {'whatIf': 'What if I had taken the job offer in Tokyo in 2015?', 'yearOrContext': '2015'},
    'AnalogyEngine': {'concept': 'Quantum entanglement', 'audience': 'Non-technical person', 'audienceInterests': 'cooking'},
    'ApologyCalibrator': {'situations': [{'context': "Forgot my partner's birthday completely", 'relationship': 'partner', 'severity': 'serious'}]},
    'ArgumentSimulator': {'hotTake': 'Remote work is more productive than office work'},
    'AwkwardSilenceFiller': {'action': 'generate', 'context': 'conference networking event', 'relationship': 'stranger', 'comfort': 'medium', 'landmines': ''},
    'BatchFlow': {'action': 'generate', 'tasks': [{'task': 'Reply to emails', 'duration': None, 'location': None}, {'task': 'Write weekly report', 'duration': None, 'location': None}], 'energy_curve': None, 'day_type': 'office', 'time_available': None, 'start_time': '09:00', 'fixed_commitments': None},
    'BeliefStressTest': {'belief': 'Success requires working 80-hour weeks', 'context': 'Career advice'},
    'BikeMedic': {'symptom': 'Chain slipping gears and squeaky brakes', 'mode': 'diagnose', 'bikeProfile': 'Road bike', 'totalMiles': 500, 'context': '', 'season': 'summer', 'recentRides': ''},
    'BillRescue': {'amount': '120', 'overdueStatus': 'current', 'reason': 'Too expensive', 'details': 'Internet bill from Comcast, been a customer 3 years', 'canAffordMonthly': True, 'pastedBill': None, 'billImageBase64': None},
    'Bookmark': {'title': 'Project Hail Mary', 'stoppedAt': 'Chapter 15', 'whatYouRemember': 'Ryland is alone on the ship figuring out the Astrophage', 'specificQuestions': ''},
    'BragSheetBuilder': {'accomplishments': 'Reduced API latency by 40%. Mentored two junior developers.', 'industry': 'Technology', 'level': 'mid', 'purposes': ['resume'], 'roleTitle': 'Software Engineer', 'yearsExp': 4, 'tone': 'professional', 'userLanguage': 'en'},
    'BrainDumpBuddy': {'action': 'structure', 'rawThoughts': 'Call dentist, finish Q3 report, buy birthday gift, book flights, clean apartment', 'context': None, 'carryForward': None},
    'BrainRoulette': {'interests': 'technology, psychology, history', 'seenTopics': [], 'isSurprise': False, 'customTopic': None, 'locale': 'en-US'},
    'BrainStateDeejay': {'currentState': 'Scattered and anxious', 'desiredState': 'Focused and calm', 'taskContext': 'Deep work — writing a report', 'musicPreferences': 'No lyrics', 'sensitivities': None},
    'BuyWise': {'product': 'Standing desk', 'question': 'Is this worth buying?', 'originalVerdict': None, 'currency': 'USD'},
    'CaptionMagic': {'imageDescription': 'Sunrise over misty mountains with a hiker in silhouette', 'tones': ['inspirational'], 'context': 'Personal travel Instagram', 'brandVoice': None, 'brandVoiceSummary': None},
    'ChaosPilot': {'routine': 'Wake at 7, coffee, commute 45 min, work 9-5, gym twice a week, bed at midnight', 'context': 'Full-time job, side project on weekends', 'goals': 'More energy and better focus', 'whatsFeelingStuck': 'Always tired by 3pm'},
    'ColdOpenCraft': {'who': 'Remote marketing team of 20', 'why': 'Annual kickoff — motivate for Q1', 'whatYouKnow': 'Team had a rough Q4, one big win with a product launch', 'yourBackground': 'Team lead, been with company 3 years'},
    'ComebackCooker': {'situation': 'In a meeting', 'whatTheySaid': 'That idea is not very original', 'relationship': 'colleague'},
    'ComplaintEscalationWriter': {'company': 'Generic Airlines', 'industry': 'airline', 'issue': 'Flight cancelled with no refund after 3 weeks of waiting', 'previousAttempts': 'Called twice, emailed once, no response', 'desiredOutcome': 'Full refund of $450', 'amountAtStake': '450', 'hasDocumentation': True},
    'ConflictCoach': {'receivedMessage': 'You always leave dishes in the sink. Very disrespectful.', 'emotionalState': 'defensive', 'goals': ['resolve', 'preserve relationship'], 'userDraft': None, 'actualGoal': 'Find a fair solution', 'isThread': False, 'personLabel': 'Roommate'},
    'ContextCollapse': {'message': 'Can you help me with that thing we talked about?', 'audiences': ['colleague', 'manager'], 'intent': 'Get help with project', 'concerns': 'Too vague'},
    'ContractDecoder': {'contractText': 'Tenant shall pay $2000/month. Late fee of $500 after 1 day. Landlord may enter with 24hr notice.', 'contractType': 'lease', 'focusAreas': ['fees', 'termination'], 'context': 'First apartment lease in NYC'},
    'ContrastReport': {'pathA': 'Renting an apartment in the city', 'pathB': 'Buying a house in the suburbs', 'aboutYou': 'Couple in their 30s, one remote worker, no kids yet'},
    'CrashPredictor': {'logs': [{'date': '2025-01-10', 'note': 'Skipped lunch, 4 meetings, exhausted by 3pm'}], 'calendarContext': None, 'userLanguage': 'en'},
    'CrisisPrioritizer': {'action': 'generate', 'tasks': [{'id': 1, 'task': 'Call insurance company', 'deadline': None, 'who_waiting': None}, {'id': 2, 'task': 'Find temporary housing', 'deadline': None, 'who_waiting': 'Family'}], 'energy_level': 'low', 'hours_available': 4, 'emotional_state': 'overwhelmed', 'timeframe': 'today', 'voice': None, 'pastSessions': []},
    'CrowdWisdom': {'question': 'Should I learn Python or JavaScript first?', 'context': 'Complete beginner wanting to get into tech'},
    'CultureBriefing': {'destination': 'Japan', 'duration': '10 days', 'homeCountry': 'United States'},
    'DateNight': {'action': 'generate', 'city': 'Boston', 'vibe': 'romantic', 'budget': 100, 'interests': ['food', 'art'], 'occasion': 'anniversary'},
    'DebateMe': {'position': 'Social media does more harm than good', 'topic': 'Social media impact', 'challengeLevel': 'medium', 'category': 'society', 'format': 'standard'},
    'DecisionCoach': {'decisionNeeded': 'Should I accept a job offer in another city?', 'category': 'career', 'preferences': 'Stability, growth, work-life balance', 'capacityLevel': 'medium', 'recentDecisions': [], 'rejectedChoices': [], 'rejectionReason': None, 'locale': 'en-US'},
    'DecoderRing': {'message': 'Per our conversation, circle back to align stakeholders on deliverables going forward.', 'source': 'Corporate email from manager', 'relationship': 'manager', 'additionalContext': ''},
    'DifficultTalkCoach': {'topic': 'My workload is unsustainable and I need relief', 'fears': ['being seen as complaining', 'retaliation'], 'biggestFear': 'Manager thinks I cannot handle it', 'theirPerspective': 'Probably does not realize how bad it is', 'previousAttempts': 'Hinted at it once, nothing changed', 'userLanguage': 'en'},
    'DoctorVisitPrep': {'chiefConcern': 'Persistent headache for two weeks', 'symptomDetails': 'Throbbing pain behind right eye, worse in the afternoon', 'durationText': '2 weeks', 'severity': '6', 'whatMakesItBetterWorse': 'Better with sleep, worse with screen time', 'currentMedications': 'Ibuprofen 400mg as needed', 'allergies': 'None', 'relevantHistory': 'Family history of migraines', 'specificWorry': 'Could this be something serious?', 'knownMedications': [], 'name': None, 'purpose': None, 'prescribedDate': None},
    'DoctorVisitTranslator': {'doctorNotes': 'CBC unremarkable. Start metformin 500mg BID. Follow up in 3 months. A1c was 7.2.', 'visitType': 'follow-up', 'concerns': 'What does A1c mean?', 'currentMedications': [], 'documentType': 'visit'},
    'DreamPatternSpotter': {'description': 'Being chased through an empty building that kept changing shape', 'date': '2025-01-15', 'emotions': ['fear', 'confusion'], 'lifeContext': 'Stressful week at work, big deadline coming'},
    'DriveHome': {'action': 'assess', 'from': 'Downtown bar', 'to': 'Home 5 miles away', 'timeOfDay': 'Late night', 'conditions': ['Sober driver unsure'], 'feelingState': 'Slightly tired', 'roadType': 'Highway'},
    'EgoKiller': {'belief': 'I am naturally bad at math', 'context': 'Struggling with data analysis at work'},
    'EmailUrgencyTriager': {'emailContent': 'Subject: Server down — production offline\nFrom: IT Alerts\n---\nSubject: Meeting next week\nFrom: Sarah', 'userRole': 'Engineering manager', 'senderHistory': [], 'triageHistory': []},
    'FakeReviewDetective': {'action': 'analyze', 'url': None, 'reviews': 'Amazing product! Life changing!\nPerfect in every way, exactly as described!', 'productName': 'Weight loss supplement'},
    'FanTheory': {'title': 'Breaking Bad'},
    'FinalWish': {'locale': 'en-US', 'mode': 'generate', 'payload': {'wishes': 'Donate my books to the local library', 'assets': 'Savings account, car', 'beneficiaries': 'Spouse'}},
    'FocusPocus': {'activity': 'Writing a quarterly report', 'plannedMinutes': 90, 'actualMinutes': 95, 'overtimeMinutes': 5, 'missedNeeds': []},
    'FocusSoundArchitect': {'currentLayers': [], 'feedback': None, 'task': 'Deep focused writing, 2 hour session, no distractions'},
    'FriendshipFadeAlerter': {'name': 'Alex Chen', 'relationshipType': 'close friend', 'daysSinceContact': 45, 'contextNotes': 'Met in college, used to talk weekly', 'contactLog': [], 'upcomingEvents': [], 'usedTopics': [], 'reciprocity': 'balanced'},
    'FutureProof': {'subject': 'Graphic designer', 'subjectType': 'role', 'context': 'Mid-career, primarily print and brand work'},
    'GentlePushGenerator': {'action': 'generate', 'domain': 'exercise', 'comfortZone': 'Walking 20 min', 'growthArea': 'Run a 5K', 'currentCapacity': 'medium', 'pushHistory': []},
    'GhostWriter': {'recipientName': 'Hiring Committee', 'yourRelationship': 'Former manager', 'whatTheyreApplyingFor': 'Senior Product Manager role at Stripe', 'letterType': 'recommendation', 'qualities': ['strategic thinking', 'leadership', 'execution'], 'anecdotes': 'Led our biggest product launch, 40% revenue increase', 'duration': '3 years', 'additionalContext': ''},
    'Giftology': {'recipient': 'Dad, 60s, retired engineer, loves gardening and coffee. Says do not get me anything every year.', 'occasion': 'Birthday', 'budget': 75, 'deadline': None, 'alreadyGiven': '', 'avoid': ''},
    'GratitudeDebtClearer': {'recipientName': 'My mentor Sarah', 'gratitudePoints': 'Spent hours reviewing my resume, did mock interviews, introduced me to 3 contacts who helped me get my first tech job', 'userLanguage': 'en'},
    'GravityWell': {'targetDescription': 'The VP of Engineering at a company I admire', 'targetType': 'person', 'whyThemContext': 'I want to transition into engineering leadership', 'yourBackground': 'Senior software engineer, 6 years experience'},
    'GriefGuide': {'lossType': 'death of a parent', 'timeline': '3 months ago', 'freeform': 'Still struggling to focus at work and feel numb most days', 'country': 'US'},
    'HecklerPrep': {'topic': 'Why our pricing is worth it', 'audience': 'Skeptical mid-market buyers', 'proposal': 'Enterprise SaaS at $50k/yr', 'knownObjections': 'Why so expensive? Competitors charge less.'},
    'HistoryToday': {'event': 'Moon landing — Apollo 11', 'context': None, 'userLanguage': 'en'},
    'HobbyMatch': {'personality': 'Introverted, creative, detail-oriented', 'schedule': 'Weekday evenings, 1-2 hours', 'budget': 'Low — under $50 to start', 'physical': 'No major limitations', 'triedBefore': 'Painting, guitar — neither stuck', 'lookingFor': 'Something meditative and solo'},
    'IdeaAutopsy': {'ideaDescription': 'An app that helps people track their daily mood and correlate it with habits', 'founderContext': 'Solo developer, no startup experience, full-time job'},
    'JargonAssassin': {'documentText': 'We will leverage our core competencies to maximize stakeholder value through synergistic paradigm shifts.', 'documentType': 'business email', 'readingLevel': 'general public', 'imageBase64': None, 'mediaType': None},
    'LaundroMat': {'action': 'advise', 'loadDescription': 'White cotton shirt with red wine stain, 1 day old', 'machineType': 'standard', 'imageBase64': None},
    'LayoverMaximizer': {'airport': 'AMS', 'layoverHours': 7, 'nationality': 'US', 'arrivalTerminal': None, 'connectionTerminal': None, 'arrivalTime': '10:00', 'travelStyle': 'explorer'},
    'LazyWorkoutAdapter': {'history': [], 'streak': 0, 'lastSessionDate': None, 'currentDay': 'Monday', 'currentHour': 7},
    'LeaseTrapDetector': {'leaseText': 'Tenant shall pay $2000/month. Late fee of $500 after 1 day. Landlord may enter without notice. Tenant responsible for all repairs under $500.', 'pdfBase64': None, 'fileBase64': None, 'location': 'New York, NY', 'concerns': 'Late fees and entry rights'},
    'LedeBuilder': {'searchPhrase': 'how to negotiate salary', 'emotionalContext': 'nervous', 'exampleScenario': 'Got an offer but it is 15% below market', 'toolTitle': 'Salary Negotiation Guide'},
    'LeverageLogic': {'situation': 'Salary negotiation — offer is $90k, market rate is $105k', 'leverage': 'Competing offer, strong performance reviews', 'desired': '$105k base plus signing bonus', 'pastAttempts': 'Asked once, they said budget is fixed'},
    'LuckSurface': {'description': 'Mid-career developer wanting to break into ML', 'goals': 'Land an ML engineer role at a top company', 'currentExposures': 'Online courses, no real projects or network'},
    'MagicMouth': {'whatYouWant': 'An extra week to finish the project', 'situation': 'Team is behind, deadline is Friday', 'whoYoureAsking': 'Direct manager', 'triedAlready': 'Mentioned it casually, no response'},
    'MarkupDetective': {'product': 'Hotel room priced at $299/night on hotel site — Booking.com shows $199'},
    'MeetingBSDetector': {'meetingText': 'We need to leverage synergies and align stakeholders to deliver impactful outcomes going forward.', 'duration': 60, 'attendees': 8},
    'MeetingHijackPreventer': {'meetingGoal': 'Decide Q3 roadmap priorities', 'duration': 60, 'participantCount': 6, 'meetingType': 'Decision-making', 'isVirtual': True, 'virtualPlatform': 'Zoom', 'decisionFramework': 'Consensus', 'challenges': {'dominates': True, 'offTopic': False, 'talkOver': False, 'schedule': True, 'quietVoices': False}, 'useTemplate': False, 'selectedTemplate': None},
    'MentalHealthNavigator': {'freeform': 'Feeling overwhelmed and anxious lately, not sleeping well, hard to concentrate at work', 'country': 'US'},
    'MicroAdventureMapper': {'action': 'generate', 'city': 'Boston', 'duration': '2 hours', 'transport': 'walking', 'energy': 'low', 'interests': ['nature', 'history'], 'previousAdventures': []},
    'MiseEnPlace': {'imageBase64': None, 'ingredients': 'chicken breast, garlic, lemon, olive oil, rosemary, pasta', 'timeAvailable': '45 minutes', 'preferences': 'dairy-free'},
    'MoneyDiplomat': {'personName': 'Alex', 'amount': 200, 'context': 'Split a dinner bill 3 months ago and never paid me back', 'daysSince': 90, 'relationship': 'Friend', 'attempts': 1, 'userLanguage': 'en'},
    'NameAudit': {'name': 'Flarbo', 'industry': 'B2B SaaS for HR teams', 'targetAudience': 'HR managers at mid-size companies'},
    'NameStorm': {'whatIsIt': 'A productivity app that helps remote teams stay in sync without constant meetings', 'vibe': 'modern and professional', 'constraints': 'Under 10 characters, easy to spell', 'avoid': 'Tech cliches like Flow, Sync, Hub'},
    'NameThatFeeling': {'description': 'The bittersweet feeling when you finish a great book and feel sad it is over', 'context': ''},
    'NerveCheck': {'situation': 'Presenting to 50 people at a tech conference for the first time', 'specificFears': 'Forgetting my lines and people judging me'},
    'NoiseCanceler': {'document': 'Our revolutionary paradigm-shifting solution leverages cutting-edge AI to disrupt the market and deliver unprecedented value to stakeholders.', 'mySituation': 'Evaluating a vendor proposal', 'concerns': 'Sounds like marketing fluff'},
    'OnePercenter': {'routine': 'Wake at 7, check phone in bed for 30 min, coffee, commute 45 min, work 9-5, dinner, scroll social media, bed at midnight', 'goals': 'More energy, better focus, less procrastination', 'painPoints': 'Always tired by 2pm, cannot focus for more than 20 minutes'},
    'PEP': {'action': 'generate', 'energy': 'medium', 'time_available': 30, 'recent_activities': None, 'context': None},
    'PartyArchitect': {'occasion': 'Birthday party for a 30-year-old', 'guestCount': 25, 'guestMix': 'Close friends and some work colleagues', 'space': 'Backyard with a deck', 'budget': 500, 'vibe': 'relaxed and fun', 'duration': 4, 'constraints': 'One guest is vegan'},
    'PetWeirdnessDecoder': {'petType': 'cat', 'breed': 'Domestic shorthair', 'age': 3, 'behavior': 'Stares at the wall for minutes then suddenly sprints across the room', 'duration': 'weeks', 'frequency': 'daily', 'otherChanges': [], 'currentMeds': None, 'recentDietChanges': None, 'seasonalContext': None},
    'PlainTalk': {'text': 'The aforementioned fiduciary obligations necessitate immediate remediation of the identified compliance deficiencies pursuant to regulatory requirements.', 'focusQuestion': None},
    'PlantRescue': {'extraPhotos': [], 'plantDescription': 'Pothos in a 6-inch pot, indirect light', 'symptoms': 'Yellow leaves, drooping, soil stays wet for days', 'ageOfOwnership': '6 months', 'userLocation': 'Boston, MA', 'plantName': 'Pothos'},
    'PlotHole': {'title': 'Game of Thrones', 'description': 'Ravens travel thousands of miles in hours in season 7'},
    'PlotTwist': {'decision': 'Protagonist chooses to spare the villain', 'options': ['Spare', 'Kill', 'Imprison'], 'filteredOptions': [], 'context': 'Dark thriller — villain killed the protagonist family', 'values': ['justice', 'mercy'], 'deadline': None, 'stuckReason': 'Too predictable either way'},
    'PreMortem': {'plan': 'Launch a new mobile app in 3 months with a team of 3 developers and 1 designer', 'planType': 'project', 'stakes': 'First consumer product — significant budget committed', 'assumptions': 'App store approval, user adoption, team stays intact'},
    'ProcedureProbe': {'procedure': 'MRI scan of the knee', 'quote': '$1,200', 'provider': 'Radiology Partners', 'insurance': 'Blue Cross PPO', 'concerns': 'Is $1,200 a fair price? What should I expect?', 'urgency': 'Non-urgent'},
    'PronounceItRight': {'words': ['Gnocchi', 'Worcestershire'], 'category': 'food', 'nativeLang': 'en-US'},
    'Recall': {'transcript': 'Mitochondria are membrane-bound organelles that produce ATP through cellular respiration. They have a double membrane structure and contain their own DNA.', 'subject': 'Biology', 'lectureTitle': 'Cell organelles'},
    'RechargeRadar': {'description': 'Back-to-back video calls all morning, open office noise, missed lunch break, feeling drained', 'pastProfiles': []},
    'RecipeChaosSolver': {'recipeContext': None, 'recipeImageBase64': None, 'pantryImageBase64': None, 'disasterImageBase64': None, 'problemDescription': 'My pasta sauce is too salty and too thick', 'missingIngredient': None, 'availableSubstitutes': None, 'availableIngredients': 'Pasta, canned tomatoes, garlic, onion, olive oil, parmesan', 'dietaryRestrictions': None, 'timePressure': '30 minutes'},
    'RentersDepositSaver': {'action': 'rights-only', 'location': 'Boston, Massachusetts'},
    'ResearchDecoder': {'text': 'This randomized controlled trial examined the effect of 8-week mindfulness intervention on cortisol levels in 120 adults with chronic stress. Results showed significant reduction in morning cortisol.', 'title': 'Mindfulness and cortisol', 'field': 'psychology'},
    'RoastMe': {'content': 'Software developer who drinks too much coffee, has 12 unfinished side projects, and tells people they are working on a startup.'},
    'RoomReader': {'eventType': 'team meeting', 'eventDetails': 'My idea was dismissed without discussion.', 'people': 'Manager and 5 colleagues', 'concerns': 'Why was I ignored?', 'topicsToAvoid': '', 'comfort': 'medium', 'playbook': False},
    'RoommateCourt': {'action': 'mediate', 'dispute': 'Roommate plays loud music after midnight on weeknights', 'category': 'Noise', 'yourSide': 'I need to sleep — I work early mornings', 'theirSide': 'Claims they do not realize it is that loud', 'duration': '6 months', 'priorCommunication': 'Mentioned it once casually', 'livingSituation': 'Shared apartment'},
    'RulebookBreaker': {'system': 'Hiring', 'problem': 'Cannot get interviews without 5 years experience for entry-level roles', 'whatTried': 'Applying anyway, customizing cover letters', 'goal': 'Get a software engineering job without traditional credentials'},
    'SafeWalk': {'action': 'assess', 'from': 'Downtown bar', 'to': 'Train station 0.8 miles', 'via': '', 'routeFeatures': ['Well-lit street', 'Busy area'], 'userLocation': None, 'timeOfDay': 'Late night', 'areaDescription': 'Urban downtown', 'walkDuration': 15, 'concerns': ''},
    'ScamRadar': {'messageText': 'URGENT: Your Amazon account has been compromised. Click here immediately to secure it: amaz0n-secure.xyz', 'messageType': 'email', 'senderContext': 'Unknown sender claiming to be Amazon'},
    'SensoryMinefieldMapper': {'location': 'IKEA on a Saturday afternoon', 'visitDateTime': 'Saturday 2pm', 'concerns': 'Loud noise, strong smells, fluorescent lighting, crowds', 'specificNotes': '', 'pastVisits': []},
    'SignalVsNoise': {'topic': 'Coffee and health', 'conflictingAdvice': 'Some say it extends life, others say it causes anxiety and disrupts sleep', 'userContext': 'Drink 3 cups a day, mildly anxious'},
    'SixDegreesOfMe': {'nodes': [{'id': '1', 'label': 'My job at a startup'}, {'id': '2', 'label': 'My passion for rock climbing'}], 'locale': 'en-US'},
    'SkillGapMap': {'currentRole': 'Junior software developer', 'targetRole': 'Senior software engineer', 'currentSkills': 'Python, SQL, basic React', 'userLanguage': 'en'},
    'SleepArchitect': {'bedtime': '00:30', 'wakeTime': '07:00', 'hoursActual': 5.5, 'freeform': 'Wake up 2-3 times per night, groggy in the morning even after 7 hours'},
    'SocialEnergyAudit': {'commitment': 'Team offsite — full day of meetings, dinner after', 'currentEnergy': 3, 'weekSoFar': 'Monday: 1-on-1 with manager, Tuesday: client call, Wednesday: two standups'},
    'SpiralStopper': {'action': 'spiral', 'thoughts': 'I made a mistake in the presentation and now everyone thinks I am incompetent and I might get fired', 'physical_symptoms': 'Racing heart, cannot sit still', 'trigger': 'Boss seemed cold in the hallway after the meeting', 'intensity': 7, 'history': []},
    'SubSweep': {'action': 'parse', 'statement': 'Netflix $15.99, Spotify $9.99, Adobe CC $54.99, Duolingo Plus $6.99, New York Times $4.00', 'currency': 'USD'},
    'SubscriptionGuiltTrip': {'subscriptions': [{'name': 'Adobe Creative Cloud', 'amount': 54.99, 'frequency': 'monthly'}], 'inputType': 'manual'},
    'TaskAvalancheBreaker': {'project': 'Launch company newsletter', 'overwhelmReasons': 'Too many moving parts, do not know where to start', 'availableTime': '2 hours today', 'energyLevel': 'medium', 'existingHabit': 'Morning coffee at 8am'},
    'TheAlibi': {'situation': 'I have a 2-year gap on my resume from 2021-2023. I was dealing with burnout and did some freelance work but nothing consistent.', 'customAudience': None, 'concerns': 'Looks like I was fired or struggling', 'context': 'Job interview tomorrow'},
    'TheDebrief': {'transcript': 'Team met to discuss Q3 results. Revenue was 15% below target. Main issue was delayed product launch. Action items assigned.', 'attendees': 'CEO, CTO, VP Sales, VP Marketing', 'context': 'Post-quarter review for board reporting'},
    'TheFinalWord': {'claim': 'Coffee is bad for you'},
    'TheGap': {'concept': 'Integration by parts', 'subject': 'Calculus', 'whatIKnow': 'Something about multiplying functions and integrating one while differentiating the other', 'whereItBroke': 'Do not understand why it works or how to choose which function to integrate'},
    'TheRunthrough': {'content': 'Our team rebuilt the checkout flow. The old 7-step process had 68% abandonment. The new 3-step flow cut abandonment to 31% and increased conversion by 15%.', 'tone': 'confident', 'goal': 'hook'},
    'TimeWarp': {'modernThing': 'Smartphones and social media', 'historicalPeriod': 'Ancient Rome', 'seed': None},
    'TipOfTongue': {'description': 'Creamy pasta with black pepper and crispy pork bits, no cream sauce, had it in Rome', 'notThis': '', 'whenWhere': 'Rome 2019', 'extraClues': 'Simple but incredible, near Trastevere'},
    'ToastWriter': {'person': 'My best friend Jake', 'occasion': 'Wedding', 'relationship': 'Best man — friends since college', 'stories': 'He picked me up from the airport at 3am without complaining. He drove 4 hours to help me move.', 'avoid': 'Embarrassing college stories'},
    'ToolFinder': {'problem': 'I need help writing a difficult message to my manager about my workload being unsustainable'},
    'TruthBomb': {'theUnsaidThing': 'My friend keeps blaming everyone else for his problems but never looks at his own behavior', 'whoItsAbout': 'Close friend', 'whyNotSaying': 'Do not want to damage the friendship', 'relationshipContext': 'Known each other 10 years'},
    'UpsellShield': {'situation': 'Buying a laptop at Best Buy', 'whatYouWant': 'Just the laptop, no extras', 'budget': '1200', 'concerns': 'Extended warranty pitch, Geek Squad, accessories'},
    'VelvetHammer': {'draft': 'Your work has been really bad lately and you need to step it up or there will be consequences.'},
    'VirtualBodyDouble': {'action': 'breakdown', 'task': 'Write performance reviews for 5 direct reports', 'duration': 90, 'mood': 'procrastinating'},
    'WaitingModeLiberator': {'action': 'liberate', 'events': [{'name': 'Doctor appointment', 'time': 'In 3 hours', 'type': 'appointment', 'prepMinutes': 15, 'travelMinutes': 20}]},
    'WardrobeChaosHelper': {'wardrobeInventory': 'Dark jeans, chinos, white shirts, one blazer, sneakers, loafers', 'weather': 'Cool, 58F, cloudy', 'activities': 'Job interview at a startup, lunch with a friend after', 'mood': 'confident', 'userLanguage': 'en'},
    'WhatIf': {'decision': 'Dropping out of college', 'optionNotChosen': 'Staying in college and finishing the degree', 'context': '2010, studying computer science, had a job offer from a startup'},
    'WhatsMyVibe': {'samples': 'Wakes up at 5am to journal. Reads philosophy. Drinks black coffee only. Owns too many plants. Has 12 unfinished Notion pages.'},
    'WhereDidTheTimeGo': {'dayDescription': 'Meetings: 4 hours, email: 2 hours, deep work: 1 hour, social media: 1.5 hours, lunch and breaks: 1 hour', 'perceivedBreakdown': 'Felt like I worked all day but got nothing done'},
    'WrongAnswersOnly': {'question': 'Why do cats knock things off tables?', 'seed': None},
}

# Tools that should be skipped (side effects, auth-required, etc.)
SKIP_TOOLS = {
    'SafeWalk',     # Real-time location; calling may have side effects
}

# ─── Endpoint probing ──────────────────────────────────────────────────────

def probe_endpoint(base_url, tool_id, timeout=120):
    """
    POST the probe payload to /api/{kebab-tool-id}.
    Returns dict: { tool, endpoint, status, elapsed, error }.
    """
    endpoint = to_kebab(tool_id)
    url = f"{base_url.rstrip('/')}/api/{endpoint}"
    payload = PAYLOADS.get(tool_id, DEFAULT_PAYLOAD)
    body = json.dumps(payload).encode('utf-8')

    start = time.monotonic()
    result = {
        'tool': tool_id,
        'endpoint': f'/api/{endpoint}',
        'elapsed': None,
        'status': None,
        'error': None,
        'tokens_in': None,
        'tokens_out': None,
    }

    try:
        req = urllib.request.Request(
            url,
            data=body,
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Perf-Probe': '1',   # lets backend skip non-essential work if desired
            },
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            result['elapsed'] = time.monotonic() - start
            result['status'] = resp.status
            raw = resp.read()
            # Try to extract token counts if backend echoes them
            try:
                data = json.loads(raw)
                result['tokens_in']  = data.get('_tokens_in')
                result['tokens_out'] = data.get('_tokens_out')
            except Exception:
                pass
    except urllib.error.HTTPError as e:
        result['elapsed'] = time.monotonic() - start
        result['status'] = e.code
        result['error'] = str(e)
    except urllib.error.URLError as e:
        result['elapsed'] = time.monotonic() - start
        result['error'] = str(e.reason)
    except Exception as e:
        result['elapsed'] = time.monotonic() - start
        result['error'] = str(e)

    return result

# ─── Baseline persistence ──────────────────────────────────────────────────

BASELINE_FILE = 'perf_baseline.json'

def load_baseline():
    if not os.path.exists(BASELINE_FILE):
        return {}
    with open(BASELINE_FILE) as f:
        return json.load(f)

def save_baseline(results):
    data = {
        'saved_at': datetime.now(timezone.utc).isoformat(),
        'tools': {r['tool']: r['elapsed'] for r in results if r['elapsed'] is not None},
    }
    with open(BASELINE_FILE, 'w') as f:
        json.dump(data, f, indent=2)
    print(f'\n✅ Baseline saved → {BASELINE_FILE}')

# ─── Formatting helpers ────────────────────────────────────────────────────

def fmt_elapsed(s):
    if s is None:
        return '  —    '
    return f'{s:6.1f}s'

def delta_marker(elapsed, baseline_elapsed, regression_threshold=0.20, win_threshold=0.20):
    """Return (symbol, description) for a result vs baseline."""
    if elapsed is None or baseline_elapsed is None:
        return ('', '')
    ratio = (elapsed - baseline_elapsed) / baseline_elapsed
    if ratio > regression_threshold:
        return ('🔴', f'+{ratio*100:.0f}% REGRESSION')
    if ratio < -win_threshold:
        return ('🟢', f'{ratio*100:.0f}% FASTER')
    return ('⚪', f'{ratio*100:+.0f}%')

# ─── Main ──────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='DeftBrain API performance baseline tool')
    parser.add_argument('--url', required=True, help='Base URL, e.g. https://deftbrain.com or http://localhost:3001')
    parser.add_argument('--save', action='store_true', help='Save this run as the new baseline')
    parser.add_argument('--tool', help='Run a single tool only (PascalCase ID)')
    parser.add_argument('--concurrency', type=int, default=4,
                        help='Parallel probes (default: 4). Use 1 for serial; max ~8 before rate limits.')
    parser.add_argument('--timeout', type=int, default=120, help='Per-request timeout in seconds (default: 120)')
    parser.add_argument('--json', dest='json_out', action='store_true', help='Machine-readable JSON output to stdout')
    parser.add_argument('--skip-errors', action='store_true', help='Continue even if a probe returns non-200')
    parser.add_argument('--skip-4xx', action='store_true',
                        help='Exclude 4xx from stats/baseline (payload mismatch — fix PAYLOADS dict to resolve)')
    args = parser.parse_args()

    # Tool selection
    if args.tool:
        if args.tool not in TOOL_IDS:
            print(f'Unknown tool: {args.tool}', file=sys.stderr)
            sys.exit(1)
        targets = [args.tool]
    else:
        targets = [t for t in TOOL_IDS if t not in SKIP_TOOLS]

    baseline = load_baseline()
    baseline_tools = baseline.get('tools', {})

    if not args.json_out:
        print(f'\nDeftBrain API Performance Baseline — {len(targets)} tools')
        print(f'Target: {args.url}')
        if baseline_tools:
            print(f'Baseline: {baseline.get("saved_at", "unknown")}  ({len(baseline_tools)} entries)')
        else:
            print('Baseline: none — run with --save to establish one')
        if args.skip_4xx:
            print('⚠️  --skip-4xx: payload-rejected tools excluded from stats')
        print('─' * 72)

    results = []
    errors = []
    interrupted = False

    def run_one(tool_id):
        if not args.json_out and args.concurrency == 1:
            print(f'  → {tool_id:<35}', end='', flush=True)
        r = probe_endpoint(args.url, tool_id, timeout=args.timeout)
        if not args.json_out:
            sym, desc = delta_marker(r['elapsed'], baseline_tools.get(tool_id))
            status_str = f'HTTP {r["status"]}' if r['status'] else 'TIMEOUT/ERR'
            skip_note = '  [payload err — fix PAYLOADS dict]' if (args.skip_4xx and r.get('status') and 400 <= r['status'] < 500) else ''
            if args.concurrency == 1:
                print(f'{fmt_elapsed(r["elapsed"])}  {status_str}  {sym} {desc}{skip_note}')
                if r['error'] and not (r.get('status') and 400 <= r['status'] < 500):
                    print(f'     ⚠️  {r["error"]}')
            else:
                print(f'  {tool_id:<35} {fmt_elapsed(r["elapsed"])}  {status_str}  {sym} {desc}{skip_note}', flush=True)
        return r

    try:
        if args.concurrency == 1:
            for tool_id in targets:
                r = run_one(tool_id)
                results.append(r)
        else:
            with ThreadPoolExecutor(max_workers=args.concurrency) as ex:
                futures = {ex.submit(probe_endpoint, args.url, t, args.timeout): t for t in targets}
                for fut in as_completed(futures):
                    tool_id = futures[fut]
                    try:
                        r = fut.result()
                    except Exception as e:
                        r = {'tool': tool_id, 'endpoint': to_kebab(tool_id),
                             'elapsed': None, 'status': None, 'error': str(e)}
                    results.append(r)
                    run_one.__doc__  # side-effect free; print is in run_one via fut
                    # re-print inline for concurrent mode
                    if not args.json_out:
                        pass  # already printed in run_one above? No — run_one not called for concurrent
                    # For concurrent, print after result arrives:
                    if not args.json_out:
                        sym, desc = delta_marker(r['elapsed'], baseline_tools.get(r['tool']))
                        status_str = f'HTTP {r["status"]}' if r['status'] else 'TIMEOUT/ERR'
                        skip_note = '  [payload err]' if (args.skip_4xx and r.get('status') and 400 <= r['status'] < 500) else ''
                        print(f'  {r["tool"]:<35} {fmt_elapsed(r["elapsed"])}  {status_str}  {sym} {desc}{skip_note}', flush=True)

    except KeyboardInterrupt:
        interrupted = True
        print(f'\n⚠️  Interrupted — {len(results)}/{len(targets)} tools completed')

    # Filter 4xx from stats if requested
    perf_results = results
    payload_errors = []
    if args.skip_4xx:
        payload_errors = [r for r in results if r.get('status') and 400 <= r['status'] < 500]
        perf_results = [r for r in results if not (r.get('status') and 400 <= r['status'] < 500)]

    # Sort for final report
    perf_results.sort(key=lambda r: r['elapsed'] if r['elapsed'] is not None else 9999)

    if args.json_out:
        print(json.dumps({'run_at': datetime.now(timezone.utc).isoformat(), 'results': results}, indent=2))
    else:
        # Summary stats
        ok = [r for r in perf_results if r['elapsed'] is not None and r.get('status') in (200, 201)]
        failed = [r for r in perf_results if r['elapsed'] is None or r.get('status') not in (200, 201, None)]

        if payload_errors:
            print(f'\n⚠️  PAYLOAD ERRORS ({len(payload_errors)} tools returned 4xx — fix PAYLOADS dict):')
            for r in sorted(payload_errors, key=lambda x: x['tool']):
                print(f'   {r["tool"]:<35} HTTP {r["status"]}')

        if ok:
            times = [r['elapsed'] for r in ok]
            times_sorted = sorted(times)
            n = len(times_sorted)
            p50 = times_sorted[n // 2]
            p95 = times_sorted[min(int(n * 0.95), n - 1)]
            avg = sum(times) / n

            print('\n' + '─' * 72)
            label = f'{len(ok)} succeeded' + (f', {len(failed)} failed' if failed else '') + (f', {len(payload_errors)} payload errors' if payload_errors else '')
            print(f'SUMMARY  ({label})')
            print(f'  Avg    {avg:.1f}s    p50  {p50:.1f}s    p95  {p95:.1f}s')
            print(f'  Fastest: {ok[0]["tool"]} ({ok[0]["elapsed"]:.1f}s)')
            print(f'  Slowest: {ok[-1]["tool"]} ({ok[-1]["elapsed"]:.1f}s)')

            # Regressions
            regressions = [
                r for r in ok
                if baseline_tools.get(r['tool']) is not None
                and r['elapsed'] > baseline_tools[r['tool']] * 1.20
            ]
            wins = [
                r for r in ok
                if baseline_tools.get(r['tool']) is not None
                and r['elapsed'] < baseline_tools[r['tool']] * 0.80
            ]

            if regressions:
                print(f'\n🔴 REGRESSIONS ({len(regressions)}):')
                for r in regressions:
                    base = baseline_tools[r['tool']]
                    pct = (r['elapsed'] - base) / base * 100
                    print(f'   {r["tool"]:<35} {base:.1f}s → {r["elapsed"]:.1f}s  (+{pct:.0f}%)')

            if wins:
                print(f'\n🟢 IMPROVEMENTS ({len(wins)}):')
                for r in wins:
                    base = baseline_tools[r['tool']]
                    pct = (r['elapsed'] - base) / base * 100
                    print(f'   {r["tool"]:<35} {base:.1f}s → {r["elapsed"]:.1f}s  ({pct:.0f}%)')

        if failed:
            print(f'\n❌ FAILED ({len(failed)}):')
            for r in failed:
                print(f'   {r["tool"]:<35} {r["error"]}')

        print()

    # Save baseline: use perf_results (excludes 4xx if --skip-4xx).
    # On interrupt, save whatever completed — partial baselines are useful.
    if args.save:
        to_save = perf_results if args.skip_4xx else results
        if interrupted:
            print(f'  (partial save — {len([r for r in to_save if r.get("status") in (200,201)])} successful probes)')
        save_baseline(to_save)
    elif interrupted:
        print('  Tip: re-run with --save to store completed results as baseline.')

    regressions_count = len([
        r for r in perf_results
        if r.get('elapsed') and baseline_tools.get(r['tool'])
        and r['elapsed'] > baseline_tools[r['tool']] * 1.20
    ])
    return regressions_count


if __name__ == '__main__':
    sys.exit(main())
