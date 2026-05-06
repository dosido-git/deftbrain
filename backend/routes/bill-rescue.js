const express = require('express');
const router = express.Router();
const { anthropic, callClaudeWithRetry, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// SHARED: Bill-type-specific knowledge injections
// ════════════════════════════════════════════════════════════
const TYPE_KNOWLEDGE = {
  medical: `MEDICAL BILL EXPERTISE:
- Always request an itemized bill — hospitals frequently include errors, duplicate charges, and inflated facility fees.
- Ask about charity care / financial assistance programs — every nonprofit hospital is legally required to have one.
- Medical debt under $500 often won't appear on credit reports. Debt under a year old cannot be reported.
- The word "financial hardship" unlocks a different department than "billing."
- You can negotiate AFTER insurance processes the claim. Never accept the first number.
- Ask for the "self-pay discount" — even if you have insurance, if your out-of-pocket is high, this can reduce by 30-60%.`,

  credit_card: `CREDIT CARD EXPERTISE:
- Call and say the word "hardship program" — this is a specific internal program every major issuer has.
- Hardship programs can reduce interest to 0-6% and lower minimums for 6-12 months.
- If you're over 60 days late, they may offer a settlement for 40-60% of the balance.
- Balance transfer to a 0% APR card is viable if credit score hasn't been damaged yet.
- Late fees can almost always be waived — just ask. First-time waivers are policy at most issuers.`,

  utilities: `UTILITIES EXPERTISE:
- Most states/regions have disconnect protections during extreme weather (winter moratorium).
- LIHEAP (Low Income Home Energy Assistance Program) exists in every US state.
- Utility companies are required to offer payment plans — they cannot refuse.
- Budget billing (averaged monthly payments) prevents seasonal spikes.
- Some utilities have "medical necessity" protections if someone in the household has a medical condition.`,

  student_loans: `STUDENT LOAN EXPERTISE:
- Federal loans: Income-Driven Repayment (IDR) can reduce payments to $0/month if income is low enough.
- SAVE/PAYE/IBR plans base payments on discretionary income, not loan balance.
- Forbearance is available but interest still accrues — deferment is better if eligible.
- Public Service Loan Forgiveness (PSLF) forgives remaining balance after 120 qualifying payments at a qualifying employer.
- Federal loans have NO statute of limitations and can garnish wages/tax refunds.
- Private loans are negotiable — they'd rather get something than nothing.`,

  rent: `RENT/HOUSING EXPERTISE:
- Eviction is a legal process — landlords cannot change locks, shut off utilities, or remove belongings without a court order.
- Most jurisdictions require 30-day notice before eviction proceedings begin.
- Emergency rental assistance programs exist in most areas — 211.org or local community action agencies.
- Negotiate: landlords prefer a payment plan over the cost of eviction ($3,000-5,000 in legal fees and lost rent).
- Document everything in writing — verbal agreements mean nothing in housing court.`,

  auto: `AUTO/CAR LOAN EXPERTISE:
- Call BEFORE you miss the payment — most lenders have hardship deferment for 1-3 months.
- Voluntary surrender is better than repossession on your credit report.
- Refinancing to extend the loan term can lower monthly payments significantly.
- Gap insurance may apply if the car is totaled and you owe more than it's worth.`,

  taxes: `TAX DEBT EXPERTISE:
- IRS installment agreements are available for almost anyone — they prefer payment plans to enforcement.
- "Currently Not Collectible" status stops all collection activity if you genuinely can't pay.
- Offer in Compromise lets you settle for less, but approval rates are low (~30%).
- The IRS has a 10-year statute of limitations on collection — after that, the debt expires.
- State tax agencies often have their own payment plan programs.
- Never ignore tax debt — penalties and interest compound rapidly.`,

  phone_internet: `PHONE/INTERNET EXPERTISE:
- Retention departments have better deals than frontline reps — say "I'm thinking about canceling."
- Early termination fees are often negotiable, especially if you've been a long-term customer.
- FCC complaints (US) get escalated to executive customer service — file at fcc.gov/consumers/guides/filing-informal-complaint.
- Many providers have low-income programs (e.g., Lifeline, ACP successor programs).
- Bundled services often hide price increases — ask for line-item breakdown.`,

  insurance: `INSURANCE EXPERTISE:
- Appeal EVERY denial — the initial denial is often automated, and ~50% of appeals succeed.
- Request the specific policy language or code that justifies the denial.
- State insurance commissioners handle complaints and can force reviews.
- "Grace periods" are legally mandated for most insurance types — check your state's rules.
- If you're uninsured, ask about retroactive coverage or special enrollment periods.`,
};

const PERSONALITY = `You are a financial advocate who helps people deal with bills without shame. You combine the warmth of a supportive friend with the tactical knowledge of a consumer rights advocate.

YOUR PERSONALITY:
- You acknowledge the emotional weight FIRST, then give tactical advice.
- You never judge. Someone 6 months behind on rent gets the same respect as someone who forgot one payment.
- You give specific scripts, not vague advice. "Call them" is useless. "Say these exact words" is useful.
- You know insider tricks that billing departments don't volunteer.

RULES:
- Every script must be copy-paste ready — complete sentences a real person would say.
- Assistance programs should be real, not generic.
- The hardship letter should be a complete, ready-to-send letter, not a template with blanks.
- Shame-to-action section must start with the smallest possible first step.
- Know Your Rights must be specific to this bill type, not generic consumer advice.`;

// ════════════════════════════════════════════════════════════
// POST /bill-rescue — Main bill analysis (renamed from bill-guilt-eraser)
// ════════════════════════════════════════════════════════════
router.post('/bill-rescue', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      billType, amount, currency, overdueStatus, reason,
      details, canAffordMonthly, pastedBill, billImageBase64,
      userLanguage
    } = req.body;

    if (!billType) return res.status(400).json({ error: 'Please select a bill type.' });

    const sym = currency || '$';
    const hasAmount = amount != null && amount > 0;
    const hasAfford = canAffordMonthly != null && canAffordMonthly > 0;
    const hasBillText = pastedBill && pastedBill.trim().length > 10;
    const hasBillImage = billImageBase64 && billImageBase64.length > 100;
    const isCollections = overdueStatus === 'collections';

    const typeKnowledge = TYPE_KNOWLEDGE[billType] || '';

    const systemPrompt = `${PERSONALITY}

All amounts in ${sym}. Calibrate advice to the user's likely location based on currency.

${typeKnowledge}

${isCollections ? `COLLECTIONS SITUATION — CRITICAL:
This debt is in collections. This changes everything:
- The user has specific legal rights (FDCPA in the US, similar laws elsewhere).
- ALWAYS include a debt validation letter — collectors must prove they own the debt.
- NEVER acknowledge the debt on the phone until it's validated in writing.
- Pay-for-delete negotiation is possible — get it in writing before paying.
- The statute of limitations may have expired — making a partial payment can RESTART it.
- Include the collections_defense section with specific scripts and letters.` : ''}

${hasBillImage ? `The user has uploaded a photo/screenshot of their bill. Examine it carefully for:
- Duplicate or suspicious charges
- Fees that can typically be waived
- Charges that don't match the bill type
- Any amounts that seem inflated
Include your findings in the bill_autopsy section.` : ''}`;

    let userContent = [];

    // Add bill image if provided
    if (hasBillImage) {
      const mediaType = billImageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const base64Data = billImageBase64.replace(/^data:image\/\w+;base64,/, '');
      userContent.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64Data },
      });
    }

    const userPrompt = `BILL SITUATION:
Type: ${billType}
${hasAmount ? `Amount: ${sym}${amount}` : 'Amount: Not specified'}
How late: ${overdueStatus || 'unknown'}
Why it's hard: ${reason || 'not specified'}
${hasAfford ? `Can afford monthly: ${sym}${canAffordMonthly}` : 'Monthly budget: Not specified'}
${details ? `Additional context: ${details}` : ''}
${hasBillText ? `\nPASTED BILL TEXT (analyze for overcharges):\n${pastedBill.substring(0, 2000)}` : ''}
${hasBillImage ? '\nBILL IMAGE: Uploaded above. Analyze for overcharges and suspicious items.' : ''}

Return ONLY valid JSON with ALL applicable sections:
{
  "shame_to_action": {
    "reframe": "Warm, specific acknowledgment. Not 'it's okay' — show you understand WHY this is hard. Then reframe: dealing with this IS the responsible thing.",
    "micro_step": "Absurdly small first step. 'Put the bill on your kitchen table.' So easy it feels silly NOT to do it."
  }${hasBillText || hasBillImage ? `,

  "bill_autopsy": {
    "verdict": "LOOKS FAIR | FLAGS FOUND | LIKELY OVERCHARGED",
    "analysis": "Breakdown of what you found. Flag duplicates, inflated charges, waivable fees.",
    "flagged_charges": [
      {"charge": "Charge name and amount", "issue": "Why this looks wrong and what to do"}
    ],
    "total_potential_savings": "Estimated ${sym} amount that could be reduced",
    "request_itemized": "If relevant: advice to request an itemized bill. null if not medical."
  }` : ''},

  "know_your_rights": [
    {"right": "Specific legal right for THIS bill type and overdue status.", "explanation": "Plain language + how to use it."}
  ],

  "action_steps": [
    {
      "title": "Short title",
      "action": "Specific action with exact instructions — not 'call them' but 'Call the number on your bill, press 2 for billing...'",
      "script": "Exact words to say. Copy-paste ready. null if not a phone/message step.",
      "when": "Today | Tomorrow | This week | After step X"
    }
  ],

  "phone_script": {
    "opening": "Exact first sentence when they answer. Include account reference.",
    "key_phrases": ["3-5 magic phrases that unlock better treatment for this bill type."],
    "if_they_say_no": "Exact response when they refuse. Who to escalate to and what to say."
  }${hasAfford || hasAmount ? `,

  "payment_plan": {
    "strategy": "How to negotiate. What % to start, what they'll counter, what to accept.",
    "offer_amount": "Specific ${sym} amount to offer${hasAfford ? ` (based on ${sym}${canAffordMonthly}/month)` : ''}",
    "they_will_counter": "Likely counter-offer",
    "accept_up_to": "Maximum to agree to",
    "script": "Exact words to propose the plan. Copy-paste ready."
  }` : ''},

  "escalation_ladder": [
    {"who": "Level title and role", "what_to_say": "Exact phrase at this level"}
  ]${isCollections ? `,

  "collections_defense": {
    "overview": "Key rights with debt collectors.",
    "validation_letter": "Complete debt validation letter. Date, placeholders for collector name/address, account ref, FDCPA Section 809(b) language. Ready to send.",
    "what_to_say_on_phone": "Exact sentence if collector calls. Short, firm, legally protective.",
    "never_do": ["3-4 things to NEVER do with collectors"]
  }` : ''},

  "hardship_letter": "COMPLETE letter ready to send. 150-250 words. Date, 'To Whom It May Concern', situation (${reason}), specific request, proposed terms${hasAfford ? ` of ${sym}${canAffordMonthly}/month` : ''}, polite closing. Not a template — fill in realistic details.",

  "what_they_wont_tell_you": ["3-5 insider facts for this bill type. Game-changers billing depts won't volunteer."],

  "assistance_programs": [
    {"program": "Specific program name", "who_qualifies": "Eligibility in plain language", "how_to_apply": "Exact steps — phone/website/location"}
  ],

  "worst_case": "Realistic worst case if they do nothing. Not fear-mongering. Credit impact, garnishment risk, debt expiry timeline.",
  "worst_case_reassurance": "Why even the worst outcome is survivable. Warm, specific.",

  "follow_up": {
    "document_this": "What to write down after the call: rep name, confirmation number, agreements.",
    "calendar_reminder": "Specific reminder to set with date.",
    "if_they_dont_follow_through": "What to do if the company doesn't honor the agreement."
  },

  "permission": "One warm sentence giving permission to deal with this imperfectly. Specific to their situation."
}`;

    userContent.push({ type: 'text', text: userPrompt });

    // NOTE: Uses anthropic.messages.create directly (not callClaudeWithRetry) because
    // the bill image path requires a multipart content array (image + text blocks).
    // callClaudeWithRetry accepts a string prompt only. Refactor when lib supports multipart.
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userContent }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('BillRescue error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /bill-rescue/triage — Multi-bill priority analysis
// ════════════════════════════════════════════════════════════
router.post('/bill-rescue/triage', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { bills, totalMonthlyBudget, currency, userLanguage } = req.body;

    if (!bills || !Array.isArray(bills) || bills.length < 2) {
      return res.status(400).json({ error: 'Add at least 2 bills for triage.' });
    }

    const sym = currency || '$';

    const billSummary = bills.map((b, i) =>
      `${i + 1}. ${b.type} — ${sym}${b.amount || '?'} — ${b.overdue || 'unknown'} late${b.note ? ` — ${b.note}` : ''}`
    ).join('\n');

    const userPrompt = `MULTI-BILL TRIAGE:
${billSummary}

${totalMonthlyBudget ? `Total monthly budget for ALL bills: ${sym}${totalMonthlyBudget}` : 'Monthly budget: Not specified'}

Return ONLY valid JSON:
{
  "total_owed": "Estimated total across all bills",
  "severity": "MANAGEABLE | STRESSFUL | CRITICAL | EMERGENCY",
  "severity_emoji": "🟢|🟡|🔴|🚨",
  "headline": "One-sentence honest assessment. Not sugar-coated, not scary.",
  "priority_order": [
    {
      "rank": 1,
      "bill": "Bill type + amount",
      "urgency": "PAY NOW | NEGOTIATE FIRST | CAN WAIT | DISPUTE",
      "urgency_emoji": "🔴|🟡|🟢|⚖️",
      "why": "Why this is ranked here — consequences of inaction",
      "recommended_action": "Specific first action for this bill",
      "allocate": "Suggested ${sym} amount from monthly budget" or null
    }
  ],
  "budget_plan": {
    "total_monthly": "${sym} total monthly budget",
    "allocated": "${sym} total allocated to bills",
    "remaining": "${sym} left for living expenses",
    "warning": "If the math doesn't work, say so honestly. Suggest which bills to negotiate down."
  },
  "quick_wins": ["1-3 bills where a single phone call could reduce the amount or buy time"],
  "danger_zones": ["Bills where inaction has severe consequences (eviction, repossession, wage garnishment)"],
  "strategy": "Overall 2-3 sentence strategy. What to tackle first, what to negotiate, what to defer.",
  "encouragement": "Warm, honest encouragement. They came here with multiple bills — that takes courage."
}`;

    const triageSystem = `${PERSONALITY}

You are triaging multiple bills. Your job is to create a clear priority order that prevents the worst consequences while maximizing the user's limited budget. Think like a financial triage nurse: what's bleeding out, what can wait, what can be negotiated down.

All amounts in ${sym}.`;

    const result = await callClaudeWithRetry(userPrompt, {
      label: 'bill-rescue/triage',
      max_tokens: 2500,
      system: withLanguage(triageSystem, userLanguage),
    });
    return res.json(result);

  } catch (error) {
    console.error('BillRescue triage error:', error);
    res.status(500).json({ error: error.message || 'Triage failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /bill-rescue/quick-check — Should I fight this bill?
// ════════════════════════════════════════════════════════════
router.post('/bill-rescue/quick-check', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { billType, charge, amount, currency, userLanguage } = req.body;

    if (!charge?.trim()) {
      return res.status(400).json({ error: 'Describe the charge to check.' });
    }

    const sym = currency || '$';
    const typeKnowledge = TYPE_KNOWLEDGE[billType] || '';

    const systemPrompt = `${PERSONALITY}

You are doing a QUICK CHECK on a single charge. Be fast, decisive, and specific. The user wants a 5-second answer: is this normal, or should they fight it?

${typeKnowledge}

All amounts in ${sym}.`;

    const userPrompt = `QUICK CHECK:
Bill type: ${billType || 'unknown'}
Charge: "${charge}"
${amount ? `Amount: ${sym}${amount}` : ''}

Return ONLY valid JSON:
{
  "verdict": "NORMAL|WORTH QUESTIONING|DEFINITELY FIGHT THIS",
  "verdict_emoji": "✅|🤔|🔴",
  "confidence": "high|medium|low",
  "why": "One sentence explaining the verdict.",
  "best_phrase": "If worth fighting: the single best phone phrase to use. null if normal.",
  "typical_range": "What this charge typically costs, if applicable. null if not relevant.",
  "quick_tip": "One actionable tip specific to this charge type.",
  "potential_savings": "Estimated ${sym} savings if they fight it. null if normal."
}`;

    const result = await callClaudeWithRetry(userPrompt, {
      label: 'bill-rescue/quick-check',
      max_tokens: 800,
      system: withLanguage(systemPrompt, userLanguage),
    });
    return res.json(result);

  } catch (error) {
    console.error('BillRescue quick-check error:', error);
    res.status(500).json({ error: error.message || 'Quick check failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /bill-rescue/rehearse — Practice the negotiation call
// ════════════════════════════════════════════════════════════
router.post('/bill-rescue/rehearse', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { billType, situation, userMessage, conversationHistory, difficulty, currency, userLanguage } = req.body;

    if (!situation?.trim() && !userMessage?.trim()) {
      return res.status(400).json({ error: 'Describe your situation or respond to the rep.' });
    }

    const sym = currency || '$';
    const typeKnowledge = TYPE_KNOWLEDGE[billType] || '';
    const isHardMode = difficulty === 'hard';

    const systemPrompt = `You are role-playing as a billing department representative for rehearsal practice. The user is preparing for a real phone call about their bill.

YOUR ROLE: Play a realistic billing rep. ${isHardMode ? 'HARD MODE: Be difficult. Push back. Say no initially. Cite policy. Make them work for it. Offer bad deals first. Be the worst-case scenario rep.' : 'Be realistic but not impossible. Push back once, then be persuadable with the right approach.'}

${typeKnowledge}

RULES:
- Stay in character as the billing rep. Never break character.
- Respond as the rep would — brief, somewhat corporate, following their script.
- After your in-character response, add a COACH section with feedback on what the user did well and what to try differently.
- All amounts in ${sym}.

FORMAT your response as JSON with these fields:
- rep_response: What the billing rep says (in character, 1-3 sentences)
- rep_tone: "friendly|neutral|resistant|escalating"
- coach_feedback: 1-2 sentences of coaching advice
- coach_rating: "great|good|needs_work|try_again"
- coach_tip: One specific suggestion for what to say next
- negotiation_progress: 0-100 (how close to a successful outcome)
- is_resolved: true if the negotiation reached a conclusion (good or bad)
- resolution: null or "accepted|partial|denied" if resolved`;

    const messages = [];

    // Build conversation history
    if (conversationHistory?.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({ role: msg.role, content: msg.content });
      });
    }

    // Opening or continuation
    if (!conversationHistory?.length) {
      // First message — set up the scenario
      messages.push({
        role: 'user',
        content: `START REHEARSAL:
Situation: ${situation}
Bill type: ${billType || 'unknown'}
The user is calling in now. Generate the rep's greeting and opening.
${userMessage ? `\nUser's opening line: "${userMessage}"` : 'The user just connected to a rep. Generate the rep greeting.'}

Return ONLY valid JSON.`
      });
    } else {
      messages.push({
        role: 'user',
        content: `The caller says: "${userMessage}"\n\nReturn ONLY valid JSON.`
      });
    }

    // NOTE: Uses anthropic.messages.create directly (not callClaudeWithRetry) because
    // rehearsal requires a multi-turn conversation history array, not a single string prompt.
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: withLanguage(systemPrompt, userLanguage),
      messages,
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('BillRescue rehearse error:', error);
    res.status(500).json({ error: error.message || 'Rehearsal failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /bill-rescue/letter — Generate specific letter types
// ════════════════════════════════════════════════════════════
router.post('/bill-rescue/letter', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { letterType, billType, amount, currency, situation, additionalContext, userLanguage } = req.body;

    if (!letterType) return res.status(400).json({ error: 'Select a letter type.' });

    const sym = currency || '$';
    const typeKnowledge = TYPE_KNOWLEDGE[billType] || '';

    const LETTER_INSTRUCTIONS = {
      hardship: 'Write a hardship letter requesting financial assistance, payment plan, or bill reduction. Tone: respectful, honest, specific about circumstances.',
      dispute: 'Write a formal dispute letter challenging specific charges. Cite consumer rights. Request investigation and written response. Tone: firm, factual, professional.',
      goodwill: 'Write a goodwill adjustment letter requesting removal of a negative mark from the credit report. Acknowledge the debt was paid/resolved. Appeal to the company\'s discretion. Tone: polite, appreciative, humble.',
      appeal: 'Write an insurance appeal letter challenging a claim denial. Request specific policy language justifying denial. Cite medical necessity if applicable. Tone: formal, evidence-based, persistent.',
      cease_desist: 'Write a cease and desist letter to a debt collector demanding they stop all contact. Cite FDCPA Section 805(c) or equivalent. Tone: firm, legal, no-nonsense.',
      complaint: 'Write a formal complaint letter to a regulatory body (specify which one based on bill type). Include: account details, timeline of events, previous attempts to resolve, specific relief requested. Tone: factual, detailed, formal.',
      payment_confirm: 'Write a payment agreement confirmation letter documenting what was agreed during a phone call. Include: date of call, rep name placeholder, agreed terms, payment schedule, request written confirmation. Tone: professional, precise.',
    };

    const instruction = LETTER_INSTRUCTIONS[letterType] || LETTER_INSTRUCTIONS.hardship;

    const systemPrompt = `${PERSONALITY}

You are generating a specific type of letter for the user. The letter must be COMPLETE and READY TO SEND — no blanks, no "[insert here]" placeholders except for personal details the user must fill in (name, address, account number). Use realistic placeholder names like [Your Name], [Your Address], [Account Number].

${typeKnowledge}

All amounts in ${sym}.`;

    const userPrompt = `GENERATE LETTER:
Type: ${letterType}
Bill type: ${billType || 'not specified'}
${amount ? `Amount: ${sym}${amount}` : ''}
Situation: ${situation || 'not specified'}
${additionalContext ? `Additional context: ${additionalContext}` : ''}

Instructions: ${instruction}

Return ONLY valid JSON:
{
  "letter_title": "e.g., 'Hardship Letter — Medical Bill'",
  "send_to": "Who to address this to and how to find the right address",
  "send_via": "Email | Certified mail | Both (recommended) | Fax",
  "letter_body": "The complete letter. 200-400 words. Ready to send. Include date, salutation, body, closing, signature line.",
  "important_notes": ["2-3 things to know before sending this letter"],
  "follow_up": "What to do after sending — timeline for response, what to do if no response"
}`;

    const result = await callClaudeWithRetry(userPrompt, {
      label: 'bill-rescue/letter',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
    });
    return res.json(result);

  } catch (error) {
    console.error('BillRescue letter error:', error);
    res.status(500).json({ error: error.message || 'Letter generation failed' });
  }
});

module.exports = router;
