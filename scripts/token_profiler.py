#!/usr/bin/env python3
"""
token_profiler.py — DeftBrain tool output token profiler
Runs against all backend routes, calls the Claude API with a realistic payload,
measures actual output tokens vs max_tokens, and flags calibration issues.

Usage:
  ANTHROPIC_API_KEY=sk-... python3 token_profiler.py --routes ./routes
  python3 token_profiler.py --routes ./routes --delay 2.5 --model claude-haiku-4-5-20251001
  python3 token_profiler.py --routes ./routes --only roast-me,markup-detective,giftology

Output:
  token_profile_results.json  — full results
  token_profile_report.txt    — human-readable summary table
"""

import os, re, sys, json, time, argparse, urllib.request, urllib.error
from pathlib import Path


# ── Sample payloads ─────────────────────────────────────────────────────────
# Realistic inputs keyed by field name. The profiler fills these in
# when constructing a test user prompt for each tool.

SAMPLE_VALUES = {
    # Identity / people
    'name': 'Alex Johnson',
    'person': 'Alex Johnson',
    'recipient': 'Sarah Chen',
    'recipientName': 'Sarah Chen',
    'yourRelationship': 'manager for 3 years',
    'relationship': 'close friend of 5 years',
    'target': 'LinkedIn profile',
    'who': 'my sister',

    # Content / text inputs
    'content': (
        "I've been working really hard lately but feel like nothing's moving forward. "
        "My LinkedIn says 'passionate about synergy' which I wrote in 2019 and now hate. "
        "I spend most of my day in meetings that could be emails."
    ),
    'text': (
        "The company hereby agrees to indemnify and hold harmless the second party "
        "from any and all claims arising from the use of the software product, "
        "notwithstanding any provisions to the contrary."
    ),
    'message': (
        "Hey, just checking in — haven't heard from you in a while. "
        "Hope everything's okay on your end! Let me know if you want to grab coffee."
    ),
    'description': 'A vintage 1974 Yamaha upright piano in good condition, needs minor tuning.',
    'belief': 'Hard work always leads to success if you stay consistent and patient.',
    'opinion': 'Remote work is strictly better than office work for productivity.',
    'statement': 'Successful people simply work harder than everyone else.',
    'samples': 'omg this is literally the best day ever!! 🎉 cant believe we actually did it lol',
    'sourceType': 'texts',

    # Routines / schedules
    'routine': (
        "Wake up 7am, snooze twice, check phone for 45 mins in bed. "
        "Coffee, skip breakfast. Commute 40 min. Check email for an hour. "
        "Back-to-back meetings 10am-1pm. Lunch at desk while on Slack. "
        "More meetings 2-4pm. Try to do actual work 4-6pm. "
        "Home 7pm, dinner, scroll phone, sleep midnight."
    ),
    'goals': 'Get promoted to senior role within 18 months, improve work-life balance',
    'painPoints': 'Constant interruptions, feeling reactive instead of proactive, no deep work time',
    'context': 'I work in a mid-size tech company, been here 2 years, trying to make a bigger impact',

    # Product / purchase inputs
    'product': 'Starbucks Grande Oat Milk Latte',
    'item': 'Starbucks Grande Oat Milk Latte',
    'purchase': 'noise-cancelling headphones for $350',
    'budget': '$50-100',
    'deadline': 'this weekend',

    # Decision / situation inputs
    'decision': 'Whether to quit my stable job to join an early-stage startup at 30% pay cut',
    'optionNotChosen': 'staying at my current company and negotiating a raise instead',
    'situation': 'My coworker keeps taking credit for my work in meetings with senior leadership',
    'plan': 'Launch a B2B SaaS product for restaurant inventory management in 6 months',
    'stakes': 'high',
    'whatsFeelingStuck': 'I keep starting things and not finishing them, losing motivation mid-project',

    # Communication inputs
    'message_to_send': (
        "I'm really frustrated that you didn't tell me about the deadline change. "
        "It made me look incompetent in front of the whole team."
    ),
    'complaint': "My internet has been down for 3 days and the provider keeps giving me runaround.",
    'apology': "I'm sorry you felt that way about what I said.",
    'problem': 'I need to tell my coworker that their presentation style is losing the room',

    # Health / wellness inputs
    'symptoms': 'Persistent lower back pain for 2 weeks, worse in the morning, improves with movement',
    'medicalRecord': (
        "Dx: L4-L5 disc herniation. MRI shows mild compression. "
        "Rx: ibuprofen 400mg TID PRN, PT referral. Follow up in 6 weeks."
    ),
    'sleepIssues': 'Takes 45+ minutes to fall asleep, wakes up at 3am, tired all day',
    'bedtime': '11:30pm',
    'wakeTime': '7:00am',

    # Creative / fun inputs
    'modernThing': 'DoorDash food delivery',
    'historicalPeriod': 'Ancient Rome',
    'format': 'Yelp review',
    'title': 'Star Wars: The Last Jedi',
    'mediaType': 'show',
    'theory': (
        "Jar Jar Binks was originally written as a Sith lord pulling strings behind the scenes, "
        "which is why he has unnaturally perfect timing and orchestrates key events."
    ),

    # Work / career inputs
    'accomplishment': (
        "Led the redesign of our customer onboarding flow and it got better."
    ),
    'jobDescription': (
        "Senior Product Manager — 5+ years PM experience, strong data analysis, "
        "experience with B2B SaaS, leadership experience required."
    ),
    'currentRole': 'Mid-level software engineer at a 200-person startup',
    'targetRole': 'Engineering Manager at a Series B company',

    # Finance inputs
    'bills': 'Rent $2100, subscriptions Netflix/Spotify/Adobe ~$50, phone $80, gym $45',
    'subscriptions': 'Netflix $22, Hulu $18, Disney+ $14, Spotify $11, Adobe CC $55, Duolingo $7',
    'monthlyIncome': '$6500',

    # Misc
    'hobby': 'I like reading, cooking, and occasional hiking but I have a bad back',
    'interests': 'history, science, cooking, true crime podcasts',
    'occasion': 'birthday',
    'heatLevel': 'medium',
    'question': 'What causes inflation?',
    'topic': 'Does drinking coffee improve cognitive performance?',
    'argument': 'Social media does more harm than good to society overall',
    'claim': 'Vaccines cause autism',
    'position': 'Remote work is strictly better for productivity than office work',
    'document': (
        "TERMS AND CONDITIONS: By using this service you agree to our privacy policy. "
        "We may share your data with third parties for marketing purposes. "
        "Cancellation requires 30 days written notice. Auto-renewal applies."
    ),
    'tasks': 'Write Q3 report, respond to 20 emails, review PR, prep for 1-1, buy birthday gift for mom',
    'lease': (
        "Tenant shall pay $2,400/mo. Late fee of 10% applies after 3-day grace. "
        "No pets. Landlord may enter with 24hr notice. Security deposit $4,800 non-refundable."
    ),
    'symptom': 'clicking sound when shifting gears and chain slipping on climbs',
    'person_info': 'My sister loves hiking, cooking Italian food, and true crime podcasts. She just got promoted.',
}

# Per-tool override payloads for tools that need very specific inputs
TOOL_PAYLOADS = {
    'roast-me': {
        'content': SAMPLE_VALUES['content'],
        'contentType': 'linkedin_bio',
        'heatLevel': 'medium',
        'userLanguage': 'en',
    },
    'markup-detective': {
        'product': SAMPLE_VALUES['product'],
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'whats-my-vibe': {
        'samples': SAMPLE_VALUES['samples'],
        'sourceType': 'texts',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'wrong-answers-only': {
        'question': SAMPLE_VALUES['question'],
        'confidence': 'expert',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'giftology': {
        'recipient': SAMPLE_VALUES['person_info'],
        'occasion': 'birthday',
        'budget': '$50-100',
        'deadline': 'this weekend',
        'alreadyGiven': 'wine, book',
        'avoid': 'anything tech-related',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'chaos-pilot': {
        'routine': SAMPLE_VALUES['routine'],
        'context': SAMPLE_VALUES['context'],
        'goals': SAMPLE_VALUES['goals'],
        'whatsFeelingStuck': SAMPLE_VALUES['whatsFeelingStuck'],
        'userLanguage': 'en',
    },
    'ego-killer': {
        'belief': SAMPLE_VALUES['belief'],
        'context': 'I use this to motivate myself when I feel lazy',
        'howStrongly': '8/10',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'belief-stress-test': {
        'belief': SAMPLE_VALUES['belief'],
        'context': 'I use this as a core life philosophy',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'pre-mortem': {
        'plan': SAMPLE_VALUES['plan'],
        'planType': 'product launch',
        'stakes': 'high',
        'assumptions': 'customers want this, we can build it in 6 months, B2B sales cycle is short',
        'userLanguage': 'en',
    },
    'what-if': {
        'decision': SAMPLE_VALUES['decision'],
        'optionNotChosen': SAMPLE_VALUES['optionNotChosen'],
        'context': '2 kids, mortgage, 5 years of savings runway',
        'timeframe': '2 years',
        'userLanguage': 'en',
    },
    'tip-of-tongue': {
        'description': 'that feeling when you accomplish something but it feels hollow and you expected to feel better',
        'category': 'emotions',
        'userLanguage': 'en',
    },
    'tool-finder': {
        'problem': 'I need to have a difficult conversation with my coworker who keeps interrupting me',
        'userLanguage': 'en',
    },
    'toast-writer': {
        'person': 'my best friend Jamie who is getting married',
        'occasion': 'wedding',
        'relationship': 'best friends since college, 12 years',
        'stories': "We met in a stats class we both failed. She helped me through my divorce. She once drove 4 hours to bring me soup.",
        'tone': 'warm_and_funny',
        'duration': '2_minutes',
        'avoid': "don't mention her ex",
        'userLanguage': 'en',
    },
    'crowd-wisdom': {
        'question': 'Should I quit my job to start a business?',
        'context': 'Stable income, 2 kids, some savings, been at company 4 years',
        'userLanguage': 'en',
    },
    'alternate-path': {
        'counterfactual': 'What if the printing press had been invented in ancient China instead of 15th century Europe?',
        'focus': 'social and political impact',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'argument-simulator': {
        'topic': SAMPLE_VALUES['argument'],
        'side_a': 'social media causes real harm to mental health and democracy',
        'side_b': 'social media is a neutral tool and the benefits outweigh harms',
        'mode': 'debate',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'future-proof': {
        'subject': 'mid-level software engineer skills (Python, SQL, some ML)',
        'context': '6 years experience, at a stable company, worried about AI',
        'timeframe': '5 years',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'plot-hole': {
        'title': 'The Dark Knight Rises',
        'plotHole': 'How did Bruce Wayne get back into Gotham City when it was completely blockaded?',
        'action': 'analyze',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'time-warp': {
        'modernThing': SAMPLE_VALUES['modernThing'],
        'historicalPeriod': SAMPLE_VALUES['historicalPeriod'],
        'format': SAMPLE_VALUES['format'],
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'fan-theory': {
        'title': 'Breaking Bad',
        'mediaType': 'show',
        'direction': 'generate',
        'action': 'generate',
        'userLanguage': 'en',
    },
    'signal-vs-noise': {
        'topic': SAMPLE_VALUES['topic'],
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'where-did-the-time-go': {
        'dayDescription': (
            "Worked 9-6, had 4 meetings, lunch break, gym after work, "
            "made dinner, watched TV for an hour, some emails."
        ),
        'totalHours': '16',
        'userLanguage': 'en',
    },
    'doctor-visit-prep': {
        'symptoms': SAMPLE_VALUES['symptoms'],
        'duration': '2 weeks',
        'medications': 'ibuprofen occasionally',
        'concerns': 'worried it might be serious, want to know if I need imaging',
        'visitType': 'GP',
        'userLanguage': 'en',
    },
    'analogy-engine': {
        'concept': 'transformer neural network attention mechanism',
        'audience': 'software engineer who has never studied ML',
        'style': 'multiple',
        'userLanguage': 'en',
    },
    'pronounce-it-right': {
        'word': 'quinoa',
        'context': 'ordering at a restaurant',
        'userLanguage': 'en',
    },
    'cold-open-craft': {
        'goal': 'get an informational interview with a VP of Product at a company I want to join',
        'recipientInfo': 'VP of Product at Stripe, posts about product strategy, been there 4 years',
        'myBackground': 'PM with 5 years experience, big fan of their API product',
        'channel': 'LinkedIn DM',
        'userLanguage': 'en',
    },
    'hobby-match': {
        'personality': 'introvert, analytical, likes being outdoors but not in big groups, has 5-10 hrs/week',
        'interests': 'history, nature, tinkering with things',
        'lifestyle': 'lives in a city, small apartment, modest budget',
        'tried': 'gym (hated it), book club (too social)',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'mise-en-place': {
        'ingredients': 'chicken breast, garlic, lemon, olive oil, rosemary, potatoes, green beans',
        'servings': '4',
        'timeAvailable': '45 minutes',
        'action': 'generate',
        'userLanguage': 'en',
    },
    'ghost-writer': {
        'recipientName': 'Dr. Sarah Mitchell',
        'yourRelationship': 'direct manager for 3 years',
        'whatTheyreApplyingFor': 'Director of Research position at a major university',
        'letterType': 'recommendation',
        'qualities': ['leadership', 'innovation', 'mentorship'],
        'anecdotes': 'Led a team through a pivotal product pivot under pressure',
        'duration': '3 years',
        'formalityLevel': 'formal',
        'userLanguage': 'en',
    },
    'velvet-hammer': {
        'draft': "Why did you change the deadline without telling anyone?? This made me look completely incompetent in front of the entire team and I'm beyond frustrated.",
        'context': 'coworker changed a project deadline without notifying the team',
        'relationship': 'colleague',
        'goal': 'get an explanation and prevent it from happening again',
        'userLanguage': 'en',
    },
    'context-collapse': {
        'message': "Finally done with that nightmare project. Never again. 🙃",
        'platform': 'Twitter/X',
        'audience': 'mixed professional and personal followers',
        'intent': 'venting and celebrating',
        'userLanguage': 'en',
    },
    'decoder-ring': {
        'message': "I appreciate your perspective and I'll definitely take it into consideration going forward.",
        'context': 'boss responding to my proposal for a raise',
        'relationship': 'professional',
        'userLanguage': 'en',
    },
    'noise-canceler': {
        'documentType': 'insurance policy',
        'document': SAMPLE_VALUES['document'],
        'userContext': 'individual consumer reviewing their health insurance EOB',
        'userLanguage': 'en',
    },
    'contrast-report': {
        'decision': SAMPLE_VALUES['decision'],
        'option_a': 'stay at current job, negotiate raise',
        'option_b': 'join startup at 30% pay cut for equity',
        'context': '2 kids, mortgage, 6 month emergency fund',
        'action': 'contrast',
        'userLanguage': 'en',
    },
    'gravity-well': {
        'targetPerson': 'VP of Engineering at a company I want to work at, active on LinkedIn',
        'myBackground': 'Senior engineer, 6 years experience, interested in their stack',
        'goal': 'get a referral or informational interview',
        'currentGravityScore': '2',
        'userLanguage': 'en',
    },
    'luck-surface': {
        'situation': 'Mid-career software engineer wanting to move into engineering leadership',
        'currentActions': 'Going to work, doing my job, attending company all-hands',
        'timeAvailable': '5 hours/week for external activities',
        'userLanguage': 'en',
    },
    'truth-bomb': {
        'truth': "My best friend's business idea is not viable and they're about to invest their savings into it",
        'relationship': 'best friend of 10 years',
        'stakes': 'they could lose $40k',
        'context': "They've asked for my honest opinion",
        'userLanguage': 'en',
    },
    'name-that-feeling': {
        'description': 'the bittersweet nostalgia you feel looking at old photos — happy the memories exist but sad they are in the past',
        'userLanguage': 'en',
    },
    'meeting-hijack-preventer': {
        'meetingType': 'weekly team standup',
        'participants': '8 people, one dominant talker who goes on tangents',
        'duration': '30 minutes',
        'goal': 'quick status updates, identify blockers',
        'problem': 'one team member turns every status into a 10-minute deep dive',
        'userLanguage': 'en',
    },
    'plot-twist': {
        'situation': SAMPLE_VALUES['decision'],
        'context': '2 kids, mortgage, 5 years experience',
        'stuckOn': 'fear of failure and financial risk',
        'userLanguage': 'en',
    },
    'the-alibi': {
        'event': "friend's destination bachelorette party in Vegas for a long weekend",
        'relationship': 'friend from college, not super close',
        'reason': "genuinely can't afford it and don't want to go",
        'style': 'warm',
        'userLanguage': 'en',
    },
    'six-degrees-of-me': {
        'thingA': 'Taylor Swift',
        'thingB': 'the French Revolution',
        'action': 'connect',
        'userLanguage': 'en',
    },
    'friendship-fade-alerter': {
        'friend': 'college friend Jake — used to talk every week, now it has been 4 months',
        'lastContact': '4 months ago',
        'relationshipHistory': '8 years, very close in college, drifted after moving cities',
        'action': 'reconnect-message',
        'userLanguage': 'en',
    },
    'bookmark': {
        'title': 'Succession',
        'mediaType': 'show',
        'stoppedAt': 'Season 2 Episode 4, right after the shareholders meeting',
        'timeAway': '8 months',
        'userLanguage': 'en',
    },
    'rulebook-breaker': {
        'situation': 'airline cancelled my flight 2 hours before departure and is only offering a voucher, not a cash refund',
        'outcome': 'full cash refund for my $800 ticket',
        'company': 'major US airline',
        'userLanguage': 'en',
    },
    'focus-pocus': {
        'whatsHappening': 'trying to write a report but keep checking email and social media',
        'environment': 'home office, laptop, lots of notifications',
        'energyLevel': '6',
        'timeAvailable': '2 hours',
        'action': 'unstick',
        'userLanguage': 'en',
    },
    'doctor-visit-translator': {
        'document': SAMPLE_VALUES['medicalRecord'],
        'documentType': 'clinical notes',
        'patientContext': 'first time seeing this diagnosis, not a medical professional',
        'action': 'translate',
        'userLanguage': 'en',
    },
    'layover-maximizer': {
        'airport': 'CDG',
        'layoverDuration': '6 hours',
        'inbound': 'New York JFK',
        'outbound': 'Tokyo NRT',
        'hasGlobalEntry': True,
        'interests': 'food, architecture, avoiding tourist traps',
        'action': 'plan',
        'userLanguage': 'en',
    },
    'skill-gap-map': {
        'currentRole': 'Mid-level frontend engineer, 4 years React, some Node',
        'targetRole': 'Senior Full-Stack Engineer at a FAANG company',
        'currentSkills': 'React, TypeScript, CSS, Git, basic REST APIs',
        'timeframe': '12 months',
        'action': 'generate',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'money-diplomat': {
        'situation': "dinner with 6 friends, bill came to $420 total, 2 people ordered alcohol and expensive entrees but suggest splitting evenly",
        'relationship': 'close friends',
        'action': 'split',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'debate-me': {
        'topic': 'Universal Basic Income would do more harm than good',
        'myPosition': 'against UBI',
        'difficulty': 'hard',
        'action': 'challenge',
        'userLanguage': 'en',
    },
    'crisis-prioritizer': {
        'tasks': (
            "1. Respond to angry client email marked URGENT\n"
            "2. Prepare for tomorrow's board presentation\n"
            "3. Review 3 team member PRs blocking their work\n"
            "4. Fix production bug that affects 2% of users\n"
            "5. Write performance review for direct report due today\n"
            "6. Reschedule dentist appointment I've cancelled 3x\n"
            "7. Read 47 unread Slack messages\n"
            "8. Update project roadmap for Q4"
        ),
        'emotionalState': 'overwhelmed',
        'action': 'generate',
        'userLanguage': 'en',
    },
    'difficult-talk-coach': {
        'situation': "Need to tell my direct report that their performance has been declining and they're at risk of being put on a PIP",
        'relationship': 'manager to direct report, 2 years',
        'stakes': 'high',
        'worries': "They'll get defensive, I'll cave to avoid conflict, it'll damage the relationship",
        'action': 'prepare',
        'userLanguage': 'en',
    },
    'decision-coach': {
        'decision': 'Whether to accept a job offer from a competitor at $30k more salary but requiring relocation',
        'factors': 'family is settled here, kids in school, spouse has job here, not happy at current company',
        'deadline': '1 week',
        'action': 'analyze',
        'userLanguage': 'en',
    },
    'brag-sheet-builder': {
        'accomplishment': "Led a cross-functional team to redesign the checkout flow. We shipped it in 3 months and it performed well.",
        'role': 'Product Manager',
        'audience': 'performance review',
        'action': 'transform',
        'userLanguage': 'en',
    },
    'dream-pattern-spotter': {
        'dreams': [
            {'date': '2024-01-15', 'description': 'Being chased through empty school hallways, unable to run fast enough'},
            {'date': '2024-01-22', 'description': 'Teeth falling out one by one while giving a presentation'},
            {'date': '2024-02-01', 'description': 'Late to an important exam I forgot to study for'},
            {'date': '2024-02-08', 'description': 'Flying over my childhood neighborhood, feeling free'},
        ],
        'action': 'analyze',
        'userLanguage': 'en',
    },
    'complaint-escalation-writer': {
        'complaint': 'ISP has failed to fix intermittent outages affecting work-from-home for 6 weeks despite 5 service calls',
        'desiredOutcome': 'Full refund for 6 weeks service ($180) and guaranteed fix',
        'previousAttempts': '5 tech visits, 12 customer service calls, no resolution',
        'evidenceAvailable': 'Ping logs, ticket numbers, chat transcripts',
        'action': 'write-escalation',
        'userLanguage': 'en',
    },
    'buy-wise': {
        'item': 'Sony WH-1000XM5 noise-cancelling headphones at $349',
        'reason': 'for working from home with a noisy family',
        'alternatives': 'already considered AirPods Max ($549) and cheaper $80 options',
        'budget': '$350 max',
        'action': 'analyze',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'drive-home': {
        'situation': 'Had 3 beers over 2.5 hours at a work event, last drink was 45 minutes ago, 12 miles home on highway',
        'weight': '180 lbs',
        'food': 'had dinner',
        'userLanguage': 'en',
    },
    'recipe-chaos-solver': {
        'problem': 'out of eggs',
        'recipe': 'chocolate chip cookies (calls for 2 eggs)',
        'available': 'flax seeds, banana, yogurt',
        'action': 'substitute',
        'userLanguage': 'en',
    },
    'lease-trap-detector': {
        'leaseText': SAMPLE_VALUES['lease'],
        'state': 'California',
        'action': 'analyze',
        'userLanguage': 'en',
    },
    'leverage-logic': {
        'situation': 'Negotiating salary for a new job offer — they offered $110k, I want $130k, competing offer at $125k',
        'myLeverage': 'competing offer, specialized skills they need, start date flexibility',
        'theirLeverage': 'strong brand name, good benefits, remote option',
        'action': 'prepare',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'magic-mouth': {
        'goal': 'ask my landlord to fix a broken heater that has been out for 2 weeks',
        'context': 'have asked twice verbally, no response, winter',
        'relationship': 'tenant-landlord',
        'action': 'craft',
        'userLanguage': 'en',
    },
    'room-reader': {
        'situation': "Walked into a party and the conversation stopped. People smiled but seemed tense. Host seemed nervous.",
        'goal': 'understand the vibe and know what to do next',
        'action': 'read',
        'userLanguage': 'en',
    },
    'safe-walk': {
        'destination': 'apartment from subway station, 6 blocks, 10pm',
        'location': 'Brooklyn, NY',
        'concerns': 'well-lit route, but unfamiliar area',
        'userLanguage': 'en',
    },
    'scam-radar': {
        'message': "Congratulations! You've been selected for our exclusive rewards program. Click here to claim your $500 Amazon gift card. Offer expires in 24 hours. Reply STOP to unsubscribe.",
        'messageType': 'SMS',
        'senderInfo': 'unknown number with area code 555',
        'userLanguage': 'en',
    },
    'brain-dump-buddy': {
        'dump': (
            "Have to finish Q3 report but don't know where to start. Also worried about mom's health appointment next week. "
            "The team seems unhappy and I don't know why. Need to cancel Netflix. Haven't called my college friend in months. "
            "Should I get a therapist? The apartment is a mess. Need groceries. Big presentation Friday and I'm not ready."
        ),
        'action': 'structure',
        'userLanguage': 'en',
    },
    'apology-calibrator': {
        'situation': 'I forgot my partner\'s birthday completely — they had planned a surprise dinner',
        'apologySoFar': "I\'m so sorry, I\'ve just been really stressed with work.",
        'relationship': 'romantic partner, 3 years',
        'action': 'analyze',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'conflict-coach': {
        'message': "You never listen to me and always make decisions without consulting the team. It's really demoralizing.",
        'context': 'team member to manager, after being excluded from a product decision',
        'action': 'respond',
        'userLanguage': 'en',
    },
    'comeback-cooker': {
        'insult': "You always overthink everything. Just make a decision for once.",
        'context': 'meeting with colleagues, said in front of team',
        'relationship': 'coworker, same level',
        'heatLevel': 'medium',
        'userLanguage': 'en',
    },
    'jargon-assassin': {
        'text': (
            "We need to leverage our core competencies to synergize cross-functional alignment "
            "and optimize the end-to-end value chain through proactive stakeholder engagement "
            "to drive holistic transformation and unlock sustainable competitive differentiation."
        ),
        'documentType': 'corporate memo',
        'action': 'translate',
        'userLanguage': 'en',
    },
    'gratitude-debt-clearer': {
        'person': 'my mentor who helped me get my first job 5 years ago',
        'whatTheyDid': "Spent hours reviewing my portfolio, made 3 introductions, and wrote me a reference letter",
        'timeSince': '5 years',
        'action': 'write',
        'userLanguage': 'en',
    },
    'recall': {
        'material': 'Chapter 5: Photosynthesis — light reactions, Calvin cycle, electron transport chain',
        'examType': 'biology midterm',
        'weakAreas': 'keeping the two stages straight, ATP vs NADPH',
        'action': 'study-guide',
        'userLanguage': 'en',
    },
    'sub-sweep': {
        'subscriptions': SAMPLE_VALUES['subscriptions'],
        'monthlyBudget': '$50',
        'action': 'analyze',
        'userLanguage': 'en',
    },
    'history-today': {
        'date': 'July 4',
        'focus': 'global events',
        'action': 'today',
        'userLanguage': 'en',
    },
    'party-architect': {
        'occasion': "housewarming",
        'guestCount': '25',
        'budget': '$300',
        'space': 'small apartment, living room and kitchen',
        'vibe': 'casual and fun, mixed group of work and college friends',
        'action': 'plan',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'name-audit': {
        'name': 'Nexify',
        'industry': 'B2B SaaS project management',
        'target': 'small to mid-size tech companies',
        'competitors': 'Asana, Monday.com, Linear',
        'action': 'audit',
        'userLanguage': 'en',
    },
    'procedure-probe': {
        'procedure': 'lumbar MRI with and without contrast',
        'reason': 'doctor recommended after 3 weeks of back pain',
        'insurance': 'employer PPO',
        'concerns': 'is this really necessary or just defensive medicine',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'gentle-push-generator': {
        'about': 'I\'ve been meaning to start exercising but never follow through. Always have an excuse.',
        'comfortZone': 'sitting on couch, low energy, hate gyms',
        'action': 'generate',
        'userLanguage': 'en',
    },
    'awkward-silence-filler': {
        'situation': 'elevator with my boss I barely know, 30 seconds',
        'personality': 'introverted, not great at small talk',
        'action': 'full',
        'userLanguage': 'en',
    },
    'sleep-architect': {
        'sleepIssues': SAMPLE_VALUES['sleepIssues'],
        'currentBedtime': SAMPLE_VALUES['bedtime'],
        'currentWakeTime': SAMPLE_VALUES['wakeTime'],
        'lifestyle': 'desk job, coffee until 3pm, screen time before bed, irregular schedule weekends',
        'userLanguage': 'en',
    },
    'batch-flow': {
        'tasks': SAMPLE_VALUES['tasks'],
        'energy_curve': 'high morning, crashes after lunch, second wind 4pm',
        'day_type': 'deep work day',
        'time_available': '8 hours',
        'start_time': '9:00am',
        'fixed_commitments': [{'time': '12:00pm', 'label': 'team standup', 'duration': 30}],
        'action': 'generate',
        'userLanguage': 'en',
    },
    'bike-medic': {
        'symptom': SAMPLE_VALUES['symptom'],
        'bikeType': 'road bike',
        'mode': 'diagnose',
        'userLanguage': 'en',
    },
    'bill-rescue': {
        'bill': 'AT&T wireless bill $180/month for one line',
        'situation': 'been a customer 8 years, bill went up $30 last month with no notice',
        'action': 'negotiate',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'brain-roulette': {
        'topic': 'anything fascinating',
        'mood': 'curious',
        'action': 'spark',
        'userLanguage': 'en',
    },
    'brainstate-deejay': {
        'currentState': 'unfocused, scattered',
        'targetState': 'deep focused work',
        'duration': '2 hours',
        'userLanguage': 'en',
    },
    'caption-magic': {
        'imageDescription': 'Photo of a latte art coffee cup on a wooden table at sunrise, warm golden light',
        'platform': 'instagram',
        'tone': 'authentic',
        'action': 'generate',
        'userLanguage': 'en',
    },
    'contract-decoder': {
        'contractText': SAMPLE_VALUES['text'],
        'contractType': 'freelance service agreement',
        'userContext': 'freelancer reviewing before signing',
        'action': 'decode',
        'userLanguage': 'en',
    },
    'crash-predictor': {
        'logs': [
            {'date': '2024-01-08', 'energy': 4, 'stress': 8, 'sleep': 5, 'notes': 'Back-to-back meetings'},
            {'date': '2024-01-09', 'energy': 3, 'stress': 9, 'sleep': 4, 'notes': 'Big deadline'},
            {'date': '2024-01-10', 'energy': 2, 'stress': 9, 'sleep': 4, 'notes': 'Headache all day'},
            {'date': '2024-01-11', 'energy': 5, 'stress': 7, 'sleep': 6, 'notes': 'Slightly better'},
        ],
        'action': 'analyze',
        'userLanguage': 'en',
    },
    'culture-briefing': {
        'destination': 'Japan',
        'purpose': 'business meetings with potential partners',
        'duration': '5 days in Tokyo',
        'userBackground': 'American, first time in Japan',
        'userLanguage': 'en',
    },
    'date-night': {
        'relationship': '3 years together, married 1 year',
        'budget': '$100',
        'location': 'Chicago',
        'timeAvailable': 'Saturday evening, 4 hours',
        'preferences': 'prefer active over just dinner, love trying new cuisines',
        'avoid': 'movies (done it too much lately)',
        'action': 'generate',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'fake-review-detective': {
        'productName': 'LifePro Vibration Plate Exercise Machine',
        'reviews': [
            'AMAZING!! Changed my life!! Lost 20 lbs in 2 weeks!! 5 stars!!!',
            'Good product, works as described, solid build quality.',
            'Received this product and am very satisfying with the results after using 3 weeks.',
            'My husband bought for me as gift, we are both happy with purchase.',
            'This vibration plate is life changing!!! AMAZING PRODUCT!!!',
        ],
        'action': 'analyze',
        'userLanguage': 'en',
    },
    'final-wish': {
        'text': 'Gmail, work email, Chase bank, investment account at Fidelity, Instagram, LinkedIn',
        'trustedPerson': 'spouse',
        'existingNames': '',
        'mode': 'parse-accounts',
        'payload': {
            'text': 'Gmail, Chase bank, Fidelity 401k, Instagram, LinkedIn, Netflix',
            'trustedPerson': 'spouse',
        },
        'userLanguage': 'en',
    },
    'focus-sound-architect': {
        'task': 'deep coding work — complex algorithm implementation',
        'duration': '90 minutes',
        'environment': 'open office with background noise',
        'preferences': 'no lyrics, something that masks distraction',
        'action': 'design',
        'userLanguage': 'en',
    },
    'grief-guide': {
        'lossType': 'parent',
        'timeSince': '3 weeks',
        'relationship': 'close, lived nearby, spoke daily',
        'whoFor': 'myself',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'idea-autopsy': {
        'idea': 'An app that connects local amateur chefs with people who want home-cooked meals delivered',
        'stage': 'concept',
        'resources': 'limited savings, no tech background, evenings and weekends',
        'userLanguage': 'en',
    },
    'laundro-mat': {
        'garment': '100% merino wool sweater, hand-wash label',
        'stain': 'red wine on chest area',
        'urgency': 'wearing it tomorrow',
        'action': 'advise',
        'userLanguage': 'en',
    },
    'lazy-workout-adapter': {
        'constraints': 'no gym, 20 min max, back pain flares with high impact',
        'goal': 'stay active without making back worse',
        'currentActivity': 'occasional walks, nothing structured',
        'action': 'generate',
        'userLanguage': 'en',
    },
    'mental-health-navigator': {
        'situation': 'Been feeling low and unmotivated for 3 months, hard to get out of bed, lost interest in hobbies',
        'barriers': 'cost, not sure where to start, afraid of stigma',
        'location': 'United States',
        'insurance': 'employer health plan',
        'userLanguage': 'en',
    },
    'micro-adventure-mapper': {
        'location': 'Boston, MA',
        'timeAvailable': '3 hours this Sunday afternoon',
        'transport': 'public transit or walking',
        'interests': 'history, food, something I haven\'t done before',
        'budget': '$20',
        'action': 'generate',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'name-storm': {
        'description': 'A B2B project management tool focused on reducing meeting overhead for engineering teams',
        'vibe': 'professional but approachable, modern, not corporate',
        'avoid': 'anything with "flow", "sync", or "hub"',
        'action': 'generate',
        'userLanguage': 'en',
    },
    'nerve-check': {
        'event': 'giving a 20-minute conference talk to 300 people next week — first time speaking at a major conference',
        'specificFear': 'blanking on my material in front of everyone',
        'action': 'prep',
        'userLanguage': 'en',
    },
    'one-percenter': {
        'routine': SAMPLE_VALUES['routine'],
        'goals': SAMPLE_VALUES['goals'],
        'painPoints': SAMPLE_VALUES['painPoints'],
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'pep': {
        'currentEnergy': '4/10',
        'availableTime': '45 minutes',
        'mustDo': 'finish expense report',
        'avoiding': 'a difficult email I need to write',
        'action': 'generate',
        'userLanguage': 'en',
    },
    'pet-weirdness-decoder': {
        'pet': 'cat',
        'behavior': 'knocks things off tables while making direct eye contact',
        'age': '3 years',
        'breed': 'domestic shorthair',
        'userLanguage': 'en',
    },
    'plain-talk': {
        'document': SAMPLE_VALUES['document'],
        'documentType': 'terms and conditions',
        'action': 'translate',
        'userLanguage': 'en',
    },
    'plant-rescue': {
        'problem': 'yellow leaves, drooping, soil staying wet for too long',
        'plant': 'monstera deliciosa',
        'location': 'bright indirect light, apartment',
        'care': 'watering once a week',
        'action': 'diagnose',
        'userLanguage': 'en',
    },
    'recharge-radar': {
        'upcomingWeek': [
            {'event': 'All-hands company meeting', 'day': 'Monday', 'duration': 3, 'people': 200},
            {'event': 'One-on-one with boss', 'day': 'Tuesday', 'duration': 1, 'people': 1},
            {'event': 'Friend\'s birthday dinner', 'day': 'Friday', 'duration': 3, 'people': 12},
            {'event': 'Family Sunday lunch', 'day': 'Sunday', 'duration': 4, 'people': 8},
        ],
        'currentBattery': '60',
        'action': 'forecast',
        'userLanguage': 'en',
    },
    'renters-deposit-saver': {
        'moveOutDate': 'in 30 days',
        'depositAmount': '$2400',
        'tenancyLength': '2 years',
        'state': 'California',
        'concerns': 'landlord has reputation for not returning deposits',
        'action': 'prepare',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'research-decoder': {
        'study': (
            "A 2023 meta-analysis of 24 studies found that cold water immersion reduced "
            "muscle soreness by 40% compared to passive recovery in athletes."
        ),
        'claim': 'Ice baths dramatically speed up athletic recovery',
        'action': 'decode',
        'userLanguage': 'en',
    },
    'roommate-court': {
        'situation': 'Roommate leaves dishes in sink for days and uses my food without asking',
        'myPerspective': 'I asked twice nicely, no change, living space feels disrespected',
        'theirPerspective': 'They might think it\'s not a big deal',
        'action': 'mediate',
        'userLanguage': 'en',
    },
    'sensory-minefield-mapper': {
        'place': 'IKEA on a Saturday afternoon',
        'concerns': 'crowds, fluorescent lighting, loud PA announcements',
        'goal': 'buy specific items without getting overwhelmed',
        'timeLimit': '90 minutes',
        'action': 'map',
        'userLanguage': 'en',
    },
    'social-energy-audit': {
        'week': [
            {'activity': 'Team meeting', 'duration': 2, 'energyBefore': 6, 'energyAfter': 4},
            {'activity': 'Coffee with friend', 'duration': 1.5, 'energyBefore': 5, 'energyAfter': 7},
            {'activity': 'Networking event', 'duration': 3, 'energyBefore': 5, 'energyAfter': 2},
            {'activity': 'Family dinner', 'duration': 3, 'energyBefore': 6, 'energyAfter': 5},
        ],
        'action': 'audit',
        'userLanguage': 'en',
    },
    'spiral-stopper': {
        'thought': "I made a mistake in that presentation and now everyone thinks I'm incompetent and my career is over",
        'intensity': '8',
        'action': 'spiral',
        'userLanguage': 'en',
    },
    'subscription-guilt-trip': {
        'subscriptions': SAMPLE_VALUES['subscriptions'],
        'monthlyIncome': SAMPLE_VALUES['monthlyIncome'],
        'action': 'audit',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'task-avalanche-breaker': {
        'task': 'Write a 20-page technical documentation for our API that I\'ve been putting off for 3 weeks',
        'avoiding': 'I don\'t know where to start, it feels overwhelming',
        'timeAvailable': '2 hours today',
        'action': 'break-down',
        'userLanguage': 'en',
    },
    'the-debrief': {
        'meetingNotes': (
            "Discussed Q4 roadmap. Marketing wants feature X by October. Engineering says 3 months minimum. "
            "Sarah will check with design. Budget question unresolved. John will send cost estimates by Friday. "
            "Next meeting Thursday 2pm."
        ),
        'action': 'debrief',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'the-final-word': {
        'claim': 'Humans only use 10% of their brains',
        'context': 'friend cited this in an argument',
        'action': 'verdict',
        'userLanguage': 'en',
    },
    'the-gap': {
        'subject': 'calculus',
        'confusingConcept': 'derivatives — I understand the definition but not why they represent the slope',
        'level': 'undergraduate',
        'action': 'find-gap',
        'userLanguage': 'en',
    },
    'the-runthrough': {
        'content': (
            "Today I want to talk about why most meetings are unnecessary. "
            "Research shows the average professional wastes 31 hours per month in unproductive meetings. "
            "The real problem isn't the meetings themselves — it's that we've confused presence with productivity."
        ),
        'eventType': 'TED-style talk',
        'audience': 'business professionals',
        'duration': '5 minutes',
        'action': 'rehearse',
        'userLanguage': 'en',
    },
    'upsell-shield': {
        'situation': 'buying a mattress at a store',
        'about_to_face': 'mattress salesperson about to pitch extended warranty, mattress protector, and bed frame',
        'action': 'prepare',
        'userLanguage': 'en',
        'userLocale': 'en-US',
        'userCurrency': 'USD',
        'userRegion': 'US',
    },
    'virtual-body-double': {
        'task': 'Fill out my quarterly expense report — takes about 30 minutes but I keep avoiding it',
        'energyLevel': '5',
        'environment': 'home office, quiet',
        'action': 'start',
        'userLanguage': 'en',
    },
    'waiting-mode-liberator': {
        'event': 'dentist appointment in 25 minutes',
        'location': 'dentist waiting room',
        'anxiety': '6/10',
        'action': 'liberate',
        'userLanguage': 'en',
    },
    'wardrobe-chaos-helper': {
        'description': 'Client meeting, business casual, fall weather 60°F',
        'closet': ['navy blazer', 'white button-down', 'grey trousers', 'jeans', 'black turtleneck', 'chinos'],
        'concerns': 'sensory — no tight collars or scratchy fabrics',
        'action': 'outfit',
        'userLanguage': 'en',
    },
    'email-urgency-triager': {
        'emails': [
            {'subject': 'URGENT: Production down', 'from': 'CTO', 'preview': "Customers can't log in"},
            {'subject': 'Re: lunch plans', 'from': 'friend@company.com', 'preview': 'Tuesday work for you?'},
            {'subject': 'Your invoice is overdue', 'from': 'vendor@company.com', 'preview': 'Payment 15 days late'},
            {'subject': 'Newsletter: 10 productivity tips', 'from': 'noreply@tips.com', 'preview': ''},
            {'subject': 'Team meeting moved', 'from': 'boss@company.com', 'preview': 'Thursday 2pm instead of 3pm'},
        ],
        'action': 'triage',
        'userLanguage': 'en',
    },
    'meeting-bs-detector': {
        'meetingDescription': 'Alignment meeting to discuss the Q4 strategic priorities and ensure cross-functional stakeholder buy-in for the transformation initiative',
        'duration': '90 minutes',
        'attendees': 12,
        'action': 'analyze',
        'userLanguage': 'en',
    },
}

# ── Route extraction ─────────────────────────────────────────────────────────

def extract_route_info(filepath):
    """Extract system prompt, model, max_tokens, and primary action from a route file."""
    with open(filepath) as f:
        src = f.read()

    # Skip non-route files
    if 'router.post' not in src and 'router.get' not in src:
        return None

    # Extract max_tokens values — take the LARGEST (most expensive action)
    max_tokens_vals = [int(m) for m in re.findall(r'max_tokens:\s*(\d+)', src)]
    if not max_tokens_vals:
        return None
    max_tokens = max(max_tokens_vals)
    # Also track the primary (generate) action's max_tokens for action-dispatched tools
    # Use the first max_tokens after the 'generate' action if present
    gen_idx = src.find("action === 'generate'")
    if gen_idx == -1:
        gen_idx = src.find("case 'generate'")
    if gen_idx != -1:
        after_gen = src[gen_idx:]
        gen_mt = re.search(r'max_tokens:\s*(\d+)', after_gen)
        if gen_mt:
            max_tokens = int(gen_mt.group(1))

    # Extract model — prefer the one used in generate action
    models = re.findall(r"model:\s*'([^']+)'", src)
    model = models[0] if models else 'claude-sonnet-4-6'

    # Extract system prompt — try several patterns
    system_prompt = None
    for pattern in [
        r"const PERSONALITY = `(.*?)`;",
        r"const SYSTEM_PROMPT = `(.*?)`;",
        r"const MECHANIC_PERSONA = `(.*?)`;",
        r"const BRAIN_STATE_PERSONA = `(.*?)`;",
    ]:
        m = re.search(pattern, src, re.DOTALL)
        if m:
            system_prompt = m.group(1).strip()
            break

    if not system_prompt:
        # Try inline systemPrompt (defined inside handler) — grab the first one
        m = re.search(r"const systemPrompt = `(.*?)`;", src, re.DOTALL)
        if m:
            system_prompt = m.group(1).strip()

    # Fallback: no system prompt found — build generic one from route name
    if not system_prompt:
        name = Path(filepath).stem.replace('-', ' ').title()
        system_prompt = f"You are an AI assistant for the {name} tool. Help users with their request. Return ONLY valid JSON."

    # Extract the JSON schema from the source (look for JSON-shaped template strings)
    schema_match = re.search(
        r'Return ONLY valid JSON[^`\n]*[\n\s]*(\{.*?\})\s*`',
        src, re.DOTALL
    )
    schema_hint = schema_match.group(1)[:600] if schema_match else ''

    return {
        'model': model,
        'max_tokens': max_tokens,
        'system_prompt': system_prompt,
        'schema_hint': schema_hint,
        'all_max_tokens': sorted(set(max_tokens_vals)),
    }


def build_user_prompt(route_name, route_info):
    """Build a realistic user prompt for the tool."""
    # Use tool-specific override if available
    payload = TOOL_PAYLOADS.get(route_name)

    if payload:
        # Format as a readable input block
        lines = ['Generate a complete response for the following inputs:']
        for k, v in payload.items():
            if k == 'userLanguage':
                continue
            if isinstance(v, list):
                lines.append(f'{k}: {", ".join(str(i) for i in v)}')
            elif isinstance(v, bool):
                lines.append(f'{k}: {str(v).lower()}')
            else:
                lines.append(f'{k}: {v}')
        user_prompt = '\n'.join(lines)
    else:
        # Generic prompt that triggers full output
        name = route_name.replace('-', ' ').title()
        user_prompt = (
            f"Generate a complete, detailed example response for the {name} tool.\n"
            f"Use this realistic scenario:\n"
            f"- Person: {SAMPLE_VALUES['name']}, working professional, 32 years old\n"
            f"- Situation: {SAMPLE_VALUES['situation']}\n"
            f"- Context: {SAMPLE_VALUES['context']}\n"
            f"- Goals: {SAMPLE_VALUES['goals']}\n\n"
            f"Return a COMPLETE JSON response with all fields populated with realistic, detailed content."
        )

    if route_info['schema_hint']:
        user_prompt += f"\n\nExpected output format:\n{route_info['schema_hint'][:400]}"

    user_prompt += "\n\nReturn ONLY valid JSON. No markdown, no explanation."
    return user_prompt


# ── API call ─────────────────────────────────────────────────────────────────

def call_api(system_prompt, user_prompt, model, max_tokens, api_key):
    """Call the Anthropic API and return (output_tokens, stop_reason, error)."""
    payload = {
        'model': model,
        'max_tokens': max_tokens,
        'system': system_prompt,
        'messages': [{'role': 'user', 'content': user_prompt}],
    }

    req = urllib.request.Request(
        'https://api.anthropic.com/v1/messages',
        data=json.dumps(payload).encode(),
        headers={
            'content-type': 'application/json',
            'x-api-key': api_key,
            'anthropic-version': '2023-06-01',
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
            usage = data.get('usage', {})
            return (
                usage.get('output_tokens', 0),
                data.get('stop_reason', 'unknown'),
                None
            )
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return 0, 'error', f"HTTP {e.code}: {body[:200]}"
    except Exception as e:
        return 0, 'error', str(e)


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='DeftBrain token profiler')
    parser.add_argument('--routes', default='./routes', help='Path to routes directory')
    parser.add_argument('--delay', type=float, default=2.0, help='Seconds between API calls')
    parser.add_argument('--model', default=None, help='Override model for all calls (e.g. claude-haiku-4-5-20251001)')
    parser.add_argument('--only', default=None, help='Comma-separated list of route names to profile')
    parser.add_argument('--output', default='token_profile_results.json', help='Output JSON file')
    parser.add_argument('--skip-done', action='store_true', help='Skip routes already in output file')
    args = parser.parse_args()

    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    routes_dir = Path(args.routes)
    if not routes_dir.exists():
        print(f"ERROR: Routes directory not found: {routes_dir}", file=sys.stderr)
        sys.exit(1)

    # Load existing results if skip-done
    existing = {}
    if args.skip_done and Path(args.output).exists():
        with open(args.output) as f:
            existing = {r['route']: r for r in json.load(f).get('results', [])}
        print(f"Loaded {len(existing)} existing results")

    # Filter routes
    skip_files = {'index.js', 'route-template.js'}
    route_files = sorted([
        f for f in routes_dir.glob('*.js')
        if f.name not in skip_files and not f.name.startswith('._')
    ])

    if args.only:
        only = {n.strip() for n in args.only.split(',')}
        route_files = [f for f in route_files if f.stem in only]

    print(f"\nDeftBrain Token Profiler")
    print(f"{'─'*60}")
    print(f"Routes to profile:  {len(route_files)}")
    print(f"Delay between calls: {args.delay}s")
    print(f"Model override:      {args.model or 'per-route'}")
    print(f"{'─'*60}\n")

    results = []
    warned = []
    errored = []
    max_hit = []

    for i, route_file in enumerate(route_files, 1):
        route_name = route_file.stem
        prefix = f"[{i:3d}/{len(route_files)}] {route_name:<35}"

        if args.skip_done and route_name in existing:
            r = existing[route_name]
            print(f"{prefix} SKIPPED (cached: {r['output_tokens']}/{r['max_tokens']} = {r['ratio']:.0%})")
            results.append(r)
            continue

        info = extract_route_info(route_file)
        if not info:
            print(f"{prefix} SKIP (not a tool route)")
            continue

        model = args.model or info['model']
        user_prompt = build_user_prompt(route_name, info)

        output_tokens, stop_reason, error = call_api(
            info['system_prompt'],
            user_prompt,
            model,
            info['max_tokens'],
            api_key
        )

        if error:
            print(f"{prefix} ERROR: {error[:60]}")
            errored.append(route_name)
            result = {
                'route': route_name,
                'model': model,
                'max_tokens': info['max_tokens'],
                'all_max_tokens': info['all_max_tokens'],
                'output_tokens': 0,
                'ratio': 0,
                'stop_reason': 'error',
                'status': 'ERROR',
                'error': error,
                'recommended_max_tokens': info['max_tokens'],
            }
        else:
            ratio = output_tokens / info['max_tokens'] if info['max_tokens'] else 0
            recommended = max(int(output_tokens * 1.25), 256)
            # Round to nearest 250
            recommended = round(recommended / 250) * 250

            if stop_reason == 'max_tokens':
                status = '🔴 MAX_HIT'
                max_hit.append(route_name)
            elif ratio > 0.85:
                status = '🟡 WARN'
                warned.append(route_name)
            elif ratio < 0.35 and info['max_tokens'] > 1000:
                status = '⬇  OVER'  # max_tokens is more than 3x actual
            else:
                status = '✅ OK'

            flag = ''
            if stop_reason == 'max_tokens':
                flag = ' ← TRUNCATED!'
            elif ratio > 0.85:
                flag = ' ← near limit'
            elif ratio < 0.35 and info['max_tokens'] > 1000:
                flag = f' ← can reduce to {recommended}'

            print(f"{prefix} {output_tokens:5d}/{info['max_tokens']:5d} = {ratio:5.1%}  {status}{flag}")

            result = {
                'route': route_name,
                'model': model,
                'max_tokens': info['max_tokens'],
                'all_max_tokens': info['all_max_tokens'],
                'output_tokens': output_tokens,
                'ratio': round(ratio, 4),
                'stop_reason': stop_reason,
                'status': status.strip(),
                'error': None,
                'recommended_max_tokens': recommended,
            }

        results.append(result)

        if i < len(route_files):
            time.sleep(args.delay)

    # Save results
    output = {
        'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'total_routes': len(results),
        'summary': {
            'max_tokens_hit': len(max_hit),
            'near_limit_warnings': len(warned),
            'errors': len(errored),
        },
        'results': sorted(results, key=lambda r: -r.get('ratio', 0)),
    }

    with open(args.output, 'w') as f:
        json.dump(output, f, indent=2)

    # Write human-readable report
    report_path = args.output.replace('.json', '_report.txt')
    with open(report_path, 'w') as f:
        f.write('DeftBrain Token Profile Report\n')
        f.write('=' * 70 + '\n\n')
        f.write(f"{'Route':<35} {'Output':>7} {'Limit':>7} {'Ratio':>7}  {'Status'}\n")
        f.write('-' * 70 + '\n')
        for r in sorted(results, key=lambda x: -x.get('ratio', 0)):
            flag = ''
            if r['stop_reason'] == 'max_tokens':
                flag = ' ← TRUNCATED - INCREASE NOW'
            elif r['ratio'] > 0.85:
                flag = ' ← near limit'
            elif r['ratio'] < 0.35 and r['max_tokens'] > 1000:
                flag = f" ← reduce to {r['recommended_max_tokens']}"
            f.write(
                f"{r['route']:<35} {r['output_tokens']:>7} {r['max_tokens']:>7} "
                f"{r['ratio']:>6.1%}  {r['status']}{flag}\n"
            )
        f.write('\n' + '=' * 70 + '\n')
        f.write(f"MAX_TOKENS HIT (truncated — must fix):\n")
        for r in results:
            if r['stop_reason'] == 'max_tokens':
                f.write(f"  {r['route']}: actual≥{r['output_tokens']}, set {r['max_tokens']} → raise to {r['recommended_max_tokens']}\n")
        f.write(f"\nNEAR LIMIT (>85% — monitor):\n")
        for r in results:
            if r['ratio'] > 0.85 and r['stop_reason'] != 'max_tokens':
                f.write(f"  {r['route']}: {r['output_tokens']}/{r['max_tokens']} = {r['ratio']:.0%}\n")
        f.write(f"\nOVER-ALLOCATED (actual < 35% of limit):\n")
        for r in sorted(results, key=lambda x: x.get('ratio', 1)):
            if r['ratio'] < 0.35 and r['max_tokens'] > 1000 and r['status'] != 'ERROR':
                saving = r['max_tokens'] - r['recommended_max_tokens']
                f.write(f"  {r['route']}: {r['output_tokens']}/{r['max_tokens']} → recommend {r['recommended_max_tokens']} (save {saving})\n")

    # Write calibration patch commands
    patch_path = args.output.replace('.json', '_patch.sh')
    with open(patch_path, 'w') as f:
        f.write('#!/bin/bash\n')
        f.write('# Auto-generated max_tokens calibration patch\n')
        f.write('# Review before applying. Run from your routes directory.\n\n')
        needs_change = [
            r for r in results
            if r['stop_reason'] == 'max_tokens' or
               (r['ratio'] < 0.35 and r['max_tokens'] > 1000 and r['status'] not in ('ERROR',))
        ]
        if needs_change:
            f.write(f'# {len(needs_change)} routes need recalibration\n\n')
            for r in sorted(needs_change, key=lambda x: -x.get('ratio', 0)):
                old = r['max_tokens']
                new = r['recommended_max_tokens']
                if old != new:
                    direction = '↑ INCREASE' if new > old else '↓ reduce'
                    f.write(f"# {r['route']}: {old} → {new} ({direction}, ratio={r['ratio']:.0%})\n")
                    f.write(f"sed -i 's/max_tokens: {old},/max_tokens: {new},/' {r['route']}.js\n\n")
        else:
            f.write('# All routes are within calibration. No changes needed.\n')

    print(f"\n{'='*60}")
    print(f"Results: {args.output}")
    print(f"Report:  {report_path}")
    print(f"Patch:   {patch_path}")
    print(f"\n🔴 MAX_HIT (must fix):  {len(max_hit)}")
    if max_hit:
        for r in max_hit:
            print(f"   {r}")
    print(f"🟡 WARN (>85%):         {len(warned)}")
    print(f"❌ ERRORS:              {len(errored)}")
    total_ok = len([r for r in results if r.get('status', '').startswith('✅')])
    print(f"✅ OK:                  {total_ok}/{len(results)}")


if __name__ == '__main__':
    main()
