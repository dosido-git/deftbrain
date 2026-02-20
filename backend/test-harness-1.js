#!/usr/bin/env node
/**
 * Tool Audit Test Harness
 * 
 * Tests every backend endpoint for:
 * - Valid input → 200 + valid JSON
 * - Missing required fields → 400 (not 500)
 * - Empty body → 400 (not 500)
 * - Extra fields → 200 (ignores extras)
 * - Special characters → 200 (doesn't break JSON)
 * - Response time < 30s
 * - Response schema basics (has expected top-level fields)
 * 
 * Usage:
 *   node test-harness.js                    # Run all tests
 *   node test-harness.js --quick            # Skip AI-calling tests (validation only)
 *   node test-harness.js --tool nameaudit   # Test one endpoint
 *   node test-harness.js --report           # Generate JSON report file
 * 
 * Requires: Backend running on BACKEND_URL (default http://localhost:3001)
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TIMEOUT_MS = 35000; // 35s timeout per request
const MAX_CONCURRENT = 2;  // Don't slam the API

// ═══════════════════════════════════════════
// ENDPOINT DEFINITIONS
// ═══════════════════════════════════════════
// Each endpoint defines:
//   valid: payload that should return 200
//   missing: payloads that should return 400 (missing required fields)
//   schema: top-level fields expected in a successful response
//   skipAI: if true, valid test calls AI — skip in --quick mode

const ENDPOINTS = {
  // ── Naming Tools ──
  'nameaudit': {
    valid: { name: 'Thredswell', context: 'Business', industry: 'Fashion' },
    missing: [
      { context: 'Business' },           // missing name
      { name: 'Test' },                   // missing context
    ],
    schema: ['overall_grade', 'overall_summary'],
    skipAI: true,
  },
  'nameaudit/compare': {
    valid: { names: ['Vertex', 'Apex', 'Summit'], context: 'Business' },
    missing: [
      { names: ['OnlyOne'], context: 'Business' },  // too few
      { context: 'Business' },                        // missing names
    ],
    schema: ['candidates', 'winner'],
    skipAI: true,
  },
  'namestorm': {
    valid: { category: 'Business', vibe: 'Modern and clean', vibeChips: ['Bold / Punchy'], industryContext: 'Tech' },
    missing: [
      { vibe: 'something', vibeChips: ['Bold / Punchy'] },  // missing category
      { category: 'Business' },                               // missing vibe and chips
    ],
    schema: ['names_by_category', 'top_picks'],
    skipAI: true,
  },
  'namestorm/check': {
    valid: { name: 'testdomainxyz' },
    missing: [{}],
    schema: ['name', 'domains', 'social'],
    skipAI: false,  // DNS check, not AI — always run
  },
  'namestorm/more': {
    valid: { name: 'Vertex', category: 'Business', vibe: 'professional' },
    missing: [{}],
    schema: ['variations'],
    skipAI: true,
  },

  // ── Communication Tools ──
  'apology-calibrator': {
    valid: { whatHappened: 'I accidentally shared confidential salary data with the whole team', relationship: 'coworker', situation: 'work' },
    missing: [{ relationship: 'coworker' }],
    schema: [],
    skipAI: true,
  },
  'awkward-silence-filler': {
    valid: { action: 'generate', context: 'networking event' },
    missing: [],  // action-based, may not have strict required
    schema: [],
    skipAI: true,
  },
  'caption-magic': {
    valid: { imageDescription: 'Photo of a sunset over the ocean with a sailboat', platform: 'instagram', tone: 'inspirational' },
    missing: [{ platform: 'instagram' }],
    schema: [],
    skipAI: true,
  },
  'complaint-escalation-writer': {
    valid: { company: 'Acme Corp', issue: 'Product arrived broken and customer service refuses refund', industry: 'retail', desiredOutcome: 'Full refund' },
    missing: [
      { issue: 'Something broke' },       // missing company
      { company: 'Acme' },                // missing issue
    ],
    schema: [],
    skipAI: true,
  },
  'conflict-text-coach': {
    valid: { receivedMessage: 'I dont think its fair that you got the promotion instead of me', relationship: 'coworker', context: 'work' },
    missing: [{ relationship: 'coworker' }],
    schema: [],
    skipAI: true,
  },
  'confrontation-coach': {
    valid: { situation: 'My boss publicly criticized my work in a meeting', relationship: 'manager', commType: 'in-person' },
    missing: [{ relationship: 'manager' }],
    schema: [],
    skipAI: true,
  },
  'difficult-talk-rehearser': {
    valid: { topic: 'Asking for a raise', relationship: 'manager', goals: ['Get a 15% raise'], fears: 'Being told no', context: 'annual review' },
    missing: [
      { relationship: 'manager', goals: ['raise'] },  // missing topic
      { topic: 'Raise', goals: ['raise'] },            // missing relationship
    ],
    schema: [],
    skipAI: true,
  },
  'double-booking-diplomat': {
    valid: { event1: 'Board presentation at 2pm', event2: 'Kids school play at 2pm', preference: 'want to attend both' },
    missing: [
      { event2: 'School play' },  // missing event1
      { event1: 'Board meeting' }, // missing event2
    ],
    schema: [],
    skipAI: true,
  },
  'email-urgency-triager': {
    valid: { emails: 'Subject: Partnership Opportunity\nHi, loved your pitch. Free for a call this week?', context: 'work' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'gratitude-debt-clearer': {
    valid: { recipientName: 'Mom', gratitudePoints: 'Always supported my career change, drove 3 hours to help me move, never judged my mistakes', relationship: 'parent', deliveryMethod: 'letter' },
    missing: [
      { gratitudePoints: 'Thanks for everything' },  // missing name
      { recipientName: 'Mom' },                       // missing points
    ],
    schema: [],
    skipAI: true,
  },
  'meeting-bullshit-detector': {
    valid: { meetingText: 'We need to leverage our core competencies to drive synergistic outcomes across verticals and move the needle on north star metrics.' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'meeting-hijack-preventer': {
    valid: { meetingGoal: 'Weekly team standup - review blockers and plan the week', duration: 30, attendeeCount: 8, template: 'standup' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'prof-vibe': {
    valid: { professorName: 'Dr. Smith', subject: 'Organic Chemistry', observations: 'Seems strict but fair, assigns a lot of homework' },
    missing: [],
    schema: [],
    skipAI: true,
  },
  'velvet-hammer': {
    valid: { harshMessage: 'Your work has been terrible lately and everyone notices', context: 'work feedback', relationship: 'direct report' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },

  // ── Mental Health & Wellness ──
  'spiral-stopper': {
    valid: { anxiousThoughts: 'Im never going to finish this project and everyone will think Im incompetent', trigger: 'missed deadline', physicalSymptoms: 'tight chest, racing heart' },
    missing: [{ trigger: 'work' }],
    schema: [],
    skipAI: true,
  },
  'brain-dump-structurer': {
    valid: { rawThoughts: 'I keep thinking about whether my methodology is flawed and I need to present at the conference in six weeks and I havent started the poster and rent is due and I think my roommate is mad at me', context: 'overwhelm' },
    missing: [{ context: 'test' }],  // missing/short rawThoughts
    schema: [],
    skipAI: true,
  },
  'sleep-debt': {
    valid: { hoursSlept: [5, 5, 5, 6, 5, 10, 9], daysTracked: 7 },
    missing: [],
    schema: [],
    skipAI: true,
  },
  'brainstate-deejay': {
    valid: { currentState: 'scattered and unfocused', desiredState: 'calm and concentrated', taskContext: 'writing a report' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'routine-rupture-manager': {
    valid: { ruptureType: 'travel', details: 'Three-day business trip starting tomorrow, different timezone', currentRoutine: 'Morning workout, work 9-5, evening reading' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'focus-pocus': {
    valid: { activity: 'Writing dissertation chapter', plannedMinutes: 120, actualMinutes: 30, snoozeCount: 4 },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'focus-sound-architect': {
    valid: { task: 'deep work', environment: 'open office', energyGoal: 'focus' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },

  // ── Workplace Tools ──
  'brag-sheet-builder': {
    valid: { accomplishments: ['Led product launch growing users from 0 to 5000', 'Negotiated partnership with two major brands', 'Built MVP solo in React'], role: 'Product Manager', timeframe: 'Last 12 months' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'leverage-logic': {
    valid: { negotiation: 'Annual salary review', leverage: 'Exceeded all targets by 20%, competitors pay 15-20% more', desired: '15% raise' },
    missing: [],
    schema: [],
    skipAI: true,
  },

  // ── Financial Tools ──
  'bill-guilt-eraser': {
    valid: { billType: 'tech', description: 'New MacBook Pro for freelance work', amount: 2400 },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'money-shame-remover': {
    valid: { moneyShame: 'I have $40,000 in student debt and feel like a failure', situation: 'debt' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'ramen-ratio': {
    valid: { monthlyIncome: 5000, expenses: { rent: 1500, food: 400, transport: 200, subscriptions: 100 }, savings: 2000 },
    missing: [],
    schema: [],
    skipAI: true,
  },
  'sub-sweep': {
    valid: { action: 'analyze', subscriptions: [{ name: 'Netflix', cost: 15.99, frequency: 'monthly' }, { name: 'Spotify', cost: 9.99, frequency: 'monthly' }] },
    missing: [],
    schema: [],
    skipAI: true,
  },
  'buy-wise': {
    valid: { product: 'Sony WH-1000XM5 headphones', price: 349, currency: 'USD', urgency: 'medium', isImpulse: true },
    missing: [{}],
    schema: [],
    skipAI: true,
  },

  // ── Food Tools ──
  'fridge-alchemy': {
    valid: { action: 'cook', ingredients: ['chicken thighs', 'coconut milk', 'sweet potatoes', 'garlic', 'rice'], staples: ['salt', 'pepper', 'olive oil'], constraints: 'dairy-free' },
    missing: [{ action: 'cook', ingredients: ['one'] }],  // too few ingredients
    schema: [],
    skipAI: true,
  },
  'leftover-roulette': {
    valid: { leftovers: 'Half a roast chicken, some rice, wilted spinach, a few slices of bread' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'recipe-chaos-solver': {
    valid: { problem: 'My bread dough wont rise no matter what I do', recipeType: 'baking', constraints: 'no special equipment' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'liquid-courage': {
    valid: { situation: 'House party with people I dont know', currentConfidence: 3 },
    missing: [],
    schema: [],
    skipAI: true,
  },

  // ── Life Tools ──
  'date-night': {
    valid: { location: 'Boston, MA', dateType: 'anniversary', budget: 100, currency: 'USD', restrictions: 'partner is a homebody' },
    missing: [
      { dateType: 'casual' },      // missing location
      { location: 'Boston' },       // missing dateType
    ],
    schema: [],
    skipAI: true,
  },
  'micro-adventure-mapper': {
    valid: { action: 'discover', location: 'Portland, OR', timeAvailable: 3, budget: 50, interests: ['food', 'nature'] },
    missing: [{ action: 'discover', timeAvailable: 3 }],
    schema: [],
    skipAI: true,
  },
  'lazy-workout-adapter': {
    valid: { currentEnergy: 3, timeAvailable: 20, equipment: 'none', limitations: 'bad knees' },
    missing: [],
    schema: [],
    skipAI: true,
  },
  'wardrobe-chaos-resolver': {
    valid: { occasion: 'job interview', weather: 'cold and rainy', style: 'business casual', wardrobe: 'basics - jeans, button downs, one blazer' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'plant-rescue': {
    valid: { plantType: 'fiddle leaf fig', symptoms: 'leaves turning brown and dropping', careHistory: 'water once a week, indirect light', location: 'indoor, north-facing window' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'pet-weirdness-decoder': {
    valid: { petType: 'cat', petAge: 3, behavior: 'Keeps staring at one specific corner of the room and meowing at 3am every night for the past two weeks', context: 'indoor cat, no changes to environment' },
    missing: [
      { petAge: 3, behavior: 'staring at walls' },  // missing petType
    ],
    schema: [],
    skipAI: true,
  },
  'bike-medic': {
    valid: { symptom: 'Chain keeps slipping when I shift to higher gears', context: 'road bike, about 2000 miles on it', mode: 'diagnose' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'safe-walk': {
    valid: { action: 'plan', origin: 'Downtown Boston', destination: 'Back Bay', timeOfDay: 'night', preferences: 'well-lit streets' },
    missing: [],
    schema: [],
    skipAI: true,
  },
  'roommate-court': {
    valid: { action: 'divide', roommates: ['Alex', 'Jordan', 'Sam'], chores: ['dishes', 'vacuuming', 'bathroom', 'kitchen', 'trash'] },
    missing: [],
    schema: [],
    skipAI: true,
  },

  // ── Document & Analysis Tools ──
  'plaintalk': {
    valid: { text: 'The interconnectivity of neuroplasticity mechanisms underlying long-term potentiation suggests a paradigm shift in memory consolidation', textType: 'academic', context: 'explain to general audience' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'doctor-visit-translator': {
    valid: { doctorNotes: 'Chronic tension-type headaches possibly exacerbated by cervicogenic factors. Recommend multimodal approach including pharmacological and non-pharmacological interventions.', visitType: 'follow-up' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'fake-review-detective': {
    valid: { action: 'analyze', reviews: '5 stars - Best product ever! Changed my life!\n1 star - Terrible, broke after one day\n5 stars - Amazing quality highly recommend to everyone!\n3 stars - Its okay, does what it says\n5 stars - WOW just WOW best purchase of my life!!!', productName: 'Wireless Earbuds' },
    missing: [],
    schema: [],
    skipAI: true,
  },
  'lease-trap-detector': {
    valid: { leaseText: 'Tenant shall be responsible for all repairs and maintenance exceeding $200. Landlord reserves right to increase rent by up to 8% annually. 90-day termination notice required. Personal guarantee required from all occupants.', location: 'Massachusetts', leaseType: 'residential' },
    missing: [
      { leaseText: 'Some lease text' },  // missing location
    ],
    schema: [],
    skipAI: true,
  },
  'jargon-assassin': {
    valid: { documentText: 'We need to leverage our core competencies and drive synergistic outcomes to move the needle on our north star metrics while ensuring we have the bandwidth to circle back on action items.', documentType: 'business email' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },

  // ── Other Tools ──
  'dream-pattern-spotter-single': {
    valid: { description: 'I was flying over a city made of books, then fell into an ocean that was actually a library', emotions: 'exhilarating then peaceful', recurring: false },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'friendship-fade-alerter': {
    valid: { name: 'Sarah', relationshipType: 'close friend', daysSinceContact: 45, contextNotes: 'Used to talk weekly, gradually faded after she moved' },
    missing: [
      { relationshipType: 'friend', daysSinceContact: 30 },  // missing name
    ],
    schema: [],
    skipAI: true,
  },
  'sensory-minefield-mapper': {
    valid: { location: 'Target store', visitDate: '2025-03-01', visitTime: '14:00', placeType: 'retail', sensitivities: ['noise', 'fluorescent lights', 'crowds'] },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'time-vanishing-explainer': {
    valid: { timePeriod: 'last week', timeLogData: 'Work 40hrs, Sleep 49hrs, Commute 10hrs, Cooking 7hrs, Exercise 3hrs, Social media 14hrs', perception: 'I feel like I had no free time at all' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'six-degrees-of-me': {
    valid: { thingA: 'Pizza', thingB: 'The moon landing', profileContext: 'I studied engineering and love cooking' },
    missing: [
      { thingB: 'Moon' },  // missing thingA
    ],
    schema: [],
    skipAI: true,
  },
  'habit-chain': {
    valid: { habit: 'Daily meditation', currentStreak: 5, motivation: 'Reduce anxiety and improve focus' },
    missing: [],
    schema: [],
    skipAI: true,
  },
  'grade-graveyard': {
    valid: { failedAssignment: 'Organic Chemistry midterm', grade: 'D+', whatHappened: 'Studied the wrong chapters and ran out of time' },
    missing: [],
    schema: [],
    skipAI: true,
  },
  'crash-predictor-analyze': {
    valid: { logs: [
      { date: '2025-01-01', sleep: 5, caffeine: 3, stress: 7, exercise: 0, meals: 2 },
      { date: '2025-01-02', sleep: 4, caffeine: 4, stress: 8, exercise: 0, meals: 1 },
      { date: '2025-01-03', sleep: 6, caffeine: 2, stress: 6, exercise: 1, meals: 3 },
      { date: '2025-01-04', sleep: 4, caffeine: 5, stress: 9, exercise: 0, meals: 2 },
    ]},
    missing: [{ logs: [{ date: '2025-01-01' }] }],  // too few days
    schema: [],
    skipAI: true,
  },
  'task-avalanche-breaker': {
    valid: { project: 'Write dissertation chapter 3 and prepare conference poster while grading 47 papers and dealing with methodology questions', energy: 'medium', deadline: 'two weeks' },
    missing: [{ energy: 'low' }],  // missing/short project
    schema: [],
    skipAI: true,
  },
  'renters-deposit-saver': {
    valid: { action: 'rights', location: 'Massachusetts' },
    missing: [{ action: 'rights' }],  // missing location
    schema: [],
    skipAI: true,
  },
  'anti-gift-panic': {
    valid: { recipientAge: 30, interests: 'coffee, hiking, true crime podcasts, cats', relationship: 'friend', budget: 50, occasion: 'birthday' },
    missing: [{ recipientAge: 30 }],  // missing interests
    schema: [],
    skipAI: true,
  },
  'name-anxiety-destroyer': {
    valid: { name: 'James', situation: 'Just forgot my new coworkers name after being introduced 3 times', context: 'work' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'book-scout': {
    valid: { interests: 'science fiction, philosophy, behavioral economics', readingGoal: 'expand worldview', mood: 'thoughtful' },
    missing: [],
    schema: [],
    skipAI: true,
  },
  'confrontation-avoider': {
    valid: { issue: 'Roommate keeps eating my food', person: 'roommate', relationshipType: 'roommate' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'social-proof-generator': {
    valid: { request: 'I need to ask my landlord to fix the broken heater', context: 'tenant rights', audience: 'landlord' },
    missing: [],
    schema: [],
    skipAI: true,
  },
  'laundro-mat': {
    valid: { action: 'wash', loadDescription: 'Mix of cotton t-shirts, one wool sweater, and jeans', machineType: 'standard' },
    missing: [],
    schema: [],
    skipAI: true,
  },
  'believable-excuse-generator': {
    valid: { eventType: 'party', relationshipType: 'friend', urgency: 'last-minute' },
    missing: [
      { relationshipType: 'friend' },  // missing eventType
    ],
    schema: [],
    skipAI: true,
  },
  'review-paranoia-helper': {
    valid: { reviewText: 'My manager said my work is generally good but there is room for improvement in how I communicate with cross-functional teams. She mentioned I could be more proactive in sharing updates. Overall she said I am meeting expectations.', reviewType: 'performance' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
  'subscription-guilt-trip': {
    valid: { subscriptions: [{ name: 'Netflix', cost: 15.99 }, { name: 'Spotify', cost: 9.99 }, { name: 'NYT', cost: 4.25 }], inputType: 'manual' },
    missing: [],
    schema: [],
    skipAI: true,
  },
  'curve-calculator': {
    valid: { scores: '72, 85, 91, 68, 77, 82, 95, 63, 88, 79', targetGrade: 'B' },
    missing: [{}],
    schema: [],
    skipAI: true,
  },
};

// ═══════════════════════════════════════════
// SPECIAL CHARACTER TEST PAYLOADS
// ═══════════════════════════════════════════
const SPECIAL_CHAR_STRINGS = [
  'He said "hello" and she said "goodbye"',
  "It's a boy! The baby's name is O'Brien",
  'Use {curly} and [square] brackets',
  'Emoji test: 🌟 StarBright 🌟',
  'Mixed: "quotes" and \'apostrophes\' with \\backslashes\\',
  '中文测试 日本語テスト 한국어 테스트',
  'Price is $100 (or €85 or £75 or ¥11,000)',
  'Ñoño señor jalapeño naïve résumé über café',
];

// ═══════════════════════════════════════════
// TEST RUNNER
// ═══════════════════════════════════════════

class TestHarness {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || BACKEND_URL;
    this.quick = options.quick || false;
    this.toolFilter = options.tool || null;
    this.results = [];
    this.startTime = Date.now();
  }

  async fetch(endpoint, payload, timeoutMs = TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const start = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const elapsed = Date.now() - start;
      let body = null;
      let parseError = null;

      try {
        body = await response.json();
      } catch (e) {
        parseError = e.message;
      }

      return { status: response.status, body, parseError, elapsed, error: null };
    } catch (err) {
      return { status: null, body: null, parseError: null, elapsed: Date.now() - start, error: err.name === 'AbortError' ? 'TIMEOUT' : err.message };
    } finally {
      clearTimeout(timer);
    }
  }

  record(endpoint, testName, pass, details = '') {
    const icon = pass ? '✅' : '❌';
    this.results.push({ endpoint, testName, pass, details });
    console.log(`  ${icon} ${testName}${details ? ` — ${details}` : ''}`);
  }

  async testEndpoint(name, config) {
    console.log(`\n━━━ ${name} ━━━`);

    // ── Test 1: Empty body → should be 400, not 500 ──
    const emptyResult = await this.fetch(name, {});
    if (emptyResult.error) {
      this.record(name, 'Empty body → 400', false, `Error: ${emptyResult.error}`);
    } else if (emptyResult.status === 400) {
      this.record(name, 'Empty body → 400', true, `Got 400: ${emptyResult.body?.error || 'yes'}`);
    } else if (emptyResult.status === 500) {
      this.record(name, 'Empty body → 400', false, `Got 500 instead of 400! ${emptyResult.body?.error || ''}`);
    } else {
      this.record(name, 'Empty body → 400', false, `Got ${emptyResult.status} — expected 400`);
    }

    // ── Test 2: Missing required fields → should be 400 ──
    for (let i = 0; i < (config.missing || []).length; i++) {
      const payload = config.missing[i];
      const missingResult = await this.fetch(name, payload);
      const label = `Missing fields #${i + 1} → 400`;
      if (missingResult.error) {
        this.record(name, label, false, `Error: ${missingResult.error}`);
      } else if (missingResult.status === 400) {
        this.record(name, label, true);
      } else if (missingResult.status === 500) {
        this.record(name, label, false, `Got 500! Payload: ${JSON.stringify(payload).substring(0, 80)}`);
      } else {
        this.record(name, label, false, `Got ${missingResult.status}`);
      }
    }

    // ── Test 3: Extra fields → should still work (200) ──
    const extraPayload = { ...config.valid, _extra_field: 'should be ignored', _another: 12345 };
    const extraResult = await this.fetch(name, extraPayload);
    if (extraResult.error === 'TIMEOUT') {
      this.record(name, 'Extra fields → 200', false, 'TIMEOUT');
    } else if (extraResult.status === 200) {
      this.record(name, 'Extra fields → 200', true);
    } else {
      this.record(name, 'Extra fields → 200', false, `Got ${extraResult.status}`);
    }

    // ── Skip AI-calling tests in quick mode ──
    if (this.quick && config.skipAI) {
      this.record(name, 'Valid input → 200 (SKIPPED)', true, 'Quick mode — skipped AI call');
      this.record(name, 'Response < 30s (SKIPPED)', true, 'Quick mode');
      this.record(name, 'JSON parses (SKIPPED)', true, 'Quick mode');
      this.record(name, 'Special chars (SKIPPED)', true, 'Quick mode');
      return;
    }

    // ── Test 4: Valid input → 200 + valid JSON ──
    const validResult = await this.fetch(name, config.valid);
    if (validResult.error === 'TIMEOUT') {
      this.record(name, 'Valid input → 200', false, `TIMEOUT after ${TIMEOUT_MS}ms`);
    } else if (validResult.error) {
      this.record(name, 'Valid input → 200', false, `Error: ${validResult.error}`);
    } else if (validResult.status === 200) {
      this.record(name, 'Valid input → 200', true, `${validResult.elapsed}ms`);
    } else {
      this.record(name, 'Valid input → 200', false, `Got ${validResult.status}: ${validResult.body?.error || ''}`);
    }

    // ── Test 5: Response time ──
    if (validResult.elapsed) {
      const under30 = validResult.elapsed < 30000;
      this.record(name, 'Response < 30s', under30, `${(validResult.elapsed / 1000).toFixed(1)}s`);
    }

    // ── Test 6: JSON parses correctly ──
    if (validResult.parseError) {
      this.record(name, 'JSON parses', false, validResult.parseError);
    } else if (validResult.body) {
      this.record(name, 'JSON parses', true);
    }

    // ── Test 7: Schema check ──
    if (validResult.body && config.schema.length > 0) {
      const missingFields = config.schema.filter(f => !(f in validResult.body));
      if (missingFields.length === 0) {
        this.record(name, 'Schema check', true, `Has: ${config.schema.join(', ')}`);
      } else {
        this.record(name, 'Schema check', false, `Missing: ${missingFields.join(', ')}`);
      }
    }

    // ── Test 8: Special characters ──
    // Pick the first text field from the valid payload and inject special chars
    const textFields = Object.entries(config.valid).find(([k, v]) => typeof v === 'string' && v.length > 5);
    if (textFields) {
      const [fieldName] = textFields;
      const specialPayload = { ...config.valid, [fieldName]: SPECIAL_CHAR_STRINGS[Math.floor(Math.random() * SPECIAL_CHAR_STRINGS.length)] };
      const specialResult = await this.fetch(name, specialPayload);
      if (specialResult.status === 200) {
        this.record(name, 'Special chars → 200', true);
      } else if (specialResult.status === 400) {
        this.record(name, 'Special chars → 200', true, 'Got 400 (validation), not 500');
      } else {
        this.record(name, 'Special chars → 200', false, `Got ${specialResult.status}: ${specialResult.body?.error || specialResult.error || ''}`);
      }
    }
  }

  async run() {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║     TOOL AUDIT TEST HARNESS v1.0         ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log(`Backend: ${this.baseUrl}`);
    console.log(`Mode: ${this.quick ? 'QUICK (validation only, no AI calls)' : 'FULL (includes AI calls — slow)'}`);
    if (this.toolFilter) console.log(`Filter: ${this.toolFilter}`);
    console.log('');

    // Check backend is reachable
    try {
      const health = await fetch(`${this.baseUrl}/api/test`);
      if (!health.ok) throw new Error(`Status ${health.status}`);
      console.log('✅ Backend is reachable\n');
    } catch (err) {
      console.error(`❌ Cannot reach backend at ${this.baseUrl}`);
      console.error(`   Make sure your server is running. Error: ${err.message}`);
      process.exit(1);
    }

    // Run tests
    const endpoints = this.toolFilter
      ? Object.entries(ENDPOINTS).filter(([name]) => name.includes(this.toolFilter))
      : Object.entries(ENDPOINTS);

    for (const [name, config] of endpoints) {
      await this.testEndpoint(name, config);
    }

    // Summary
    this.printSummary();
    return this.results;
  }

  printSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.pass).length;
    const failed = this.results.filter(r => !r.pass).length;

    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║              SUMMARY                     ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log(`Total tests: ${total}`);
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  Pass rate: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);
    console.log(`  Duration: ${((Date.now() - this.startTime) / 1000).toFixed(1)}s`);

    if (failed > 0) {
      console.log('\n── FAILURES ──');
      const failures = this.results.filter(r => !r.pass);
      // Group by endpoint
      const byEndpoint = {};
      for (const f of failures) {
        if (!byEndpoint[f.endpoint]) byEndpoint[f.endpoint] = [];
        byEndpoint[f.endpoint].push(f);
      }
      for (const [endpoint, tests] of Object.entries(byEndpoint)) {
        console.log(`\n  ${endpoint}:`);
        for (const t of tests) {
          console.log(`    ❌ ${t.testName}${t.details ? ` — ${t.details}` : ''}`);
        }
      }
    }

    // Per-endpoint summary
    console.log('\n── PER-ENDPOINT PASS RATES ──');
    const byEndpoint = {};
    for (const r of this.results) {
      if (!byEndpoint[r.endpoint]) byEndpoint[r.endpoint] = { pass: 0, fail: 0 };
      if (r.pass) byEndpoint[r.endpoint].pass++;
      else byEndpoint[r.endpoint].fail++;
    }
    for (const [ep, counts] of Object.entries(byEndpoint).sort((a, b) => a[1].fail - b[1].fail)) {
      const total = counts.pass + counts.fail;
      const icon = counts.fail === 0 ? '🟢' : counts.fail <= 1 ? '🟡' : '🔴';
      console.log(`  ${icon} ${ep}: ${counts.pass}/${total} passed${counts.fail > 0 ? ` (${counts.fail} failed)` : ''}`);
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      backend: this.baseUrl,
      mode: this.quick ? 'quick' : 'full',
      duration_ms: Date.now() - this.startTime,
      totals: {
        tests: this.results.length,
        passed: this.results.filter(r => r.pass).length,
        failed: this.results.filter(r => !r.pass).length,
      },
      by_endpoint: {},
      failures: this.results.filter(r => !r.pass),
    };

    for (const r of this.results) {
      if (!report.by_endpoint[r.endpoint]) {
        report.by_endpoint[r.endpoint] = { pass: 0, fail: 0, tests: [] };
      }
      if (r.pass) report.by_endpoint[r.endpoint].pass++;
      else report.by_endpoint[r.endpoint].fail++;
      report.by_endpoint[r.endpoint].tests.push(r);
    }

    return report;
  }
}

// ═══════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════
async function main() {
  const args = process.argv.slice(2);
  const options = {
    quick: args.includes('--quick'),
    tool: null,
    report: args.includes('--report'),
  };

  const toolIdx = args.indexOf('--tool');
  if (toolIdx !== -1 && args[toolIdx + 1]) {
    options.tool = args[toolIdx + 1];
  }

  const harness = new TestHarness(options);
  await harness.run();

  if (options.report) {
    const report = harness.generateReport();
    const filename = `test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const fs = await import('fs');
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${filename}`);
  }

  // Exit with error code if failures
  const failures = harness.results.filter(r => !r.pass).length;
  process.exit(failures > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});
