const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/bill-guilt-eraser', async (req, res) => {
  try {
    const {
      billType, amount, currency, overdueStatus, reason,
      details, canAffordMonthly, pastedBill, userLanguage
    } = req.body;

    if (!billType) return res.status(400).json({ error: 'Please select a bill type.' });

    const sym = currency || '$';
    const hasAmount = amount != null && amount > 0;
    const hasAfford = canAffordMonthly != null && canAffordMonthly > 0;
    const hasBillText = pastedBill && pastedBill.trim().length > 10;
    const isCollections = overdueStatus === 'collections';

    // Bill-type-specific knowledge injections
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
    };

    const typeKnowledge = TYPE_KNOWLEDGE[billType] || '';

    const systemPrompt = `You are a financial advocate who helps people deal with bills without shame. You combine the warmth of a supportive friend with the tactical knowledge of a consumer rights advocate.

YOUR PERSONALITY:
- You acknowledge the emotional weight FIRST, then give tactical advice.
- You never judge. Someone 6 months behind on rent gets the same respect as someone who forgot one payment.
- You give specific scripts, not vague advice. "Call them" is useless. "Say these exact words" is useful.
- You know insider tricks that billing departments don't volunteer.
- All amounts in ${sym}. Calibrate advice to the user's likely location based on currency.

${typeKnowledge}

${isCollections ? `COLLECTIONS SITUATION — CRITICAL:
This debt is in collections. This changes everything:
- The user has specific legal rights (FDCPA in the US, similar laws elsewhere).
- ALWAYS include a debt validation letter — collectors must prove they own the debt.
- NEVER acknowledge the debt on the phone until it's validated in writing.
- Pay-for-delete negotiation is possible — get it in writing before paying.
- The statute of limitations may have expired — making a partial payment can RESTART it.
- Include the collections_defense section with specific scripts and letters.` : ''}

RULES:
- Every script must be copy-paste ready — complete sentences a real person would say.
- Assistance programs should be real, not generic. Name specific programs relevant to the bill type and region.
- The hardship letter should be a complete, ready-to-send letter, not a template with blanks.
- If bill text was pasted, do a line-by-line analysis and flag anything suspicious.
- Shame-to-action section must start with the smallest possible first step — absurdly small. "Put the bill on your table face-up. That's today's step."
- Know Your Rights must be specific to this bill type, not generic consumer advice.`;

    let userPrompt = `BILL SITUATION:
Type: ${billType}
${hasAmount ? `Amount: ${sym}${amount}` : 'Amount: Not specified'}
How late: ${overdueStatus || 'unknown'}
Why it's hard: ${reason || 'not specified'}
${hasAfford ? `Can afford monthly: ${sym}${canAffordMonthly}` : 'Monthly budget: Not specified'}
${details ? `Additional context: ${details}` : ''}
${hasBillText ? `\nPASTED BILL TEXT (analyze for overcharges):\n${pastedBill.substring(0, 2000)}` : ''}

Return ONLY valid JSON with ALL applicable sections:
{
  "shame_to_action": {
    "reframe": "Warm, specific acknowledgment of the difficulty. Not 'it's okay' — something that shows you understand WHY this is hard. Then reframe: dealing with this bill IS the responsible thing to do, no matter how late.",
    "micro_step": "The absurdly small first step. 'Put the bill on your kitchen table. That's all you need to do today.' Make it so easy it feels silly NOT to do it."
  }${hasBillText ? `,

  "bill_autopsy": {
    "verdict": "LOOKS FAIR | FLAGS FOUND | LIKELY OVERCHARGED",
    "analysis": "Line-by-line breakdown of what you found. Flag duplicates, inflated charges, fees that can be waived.",
    "flagged_charges": [
      {"charge": "Specific charge name and amount", "issue": "Why this looks wrong and what to do about it"}
    ],
    "request_itemized": "If relevant: advice to request an itemized bill. null if not medical."
  }` : ''},

  "know_your_rights": [
    {
      "right": "A specific legal right or protection relevant to THIS bill type and overdue status.",
      "explanation": "What this means in plain language and how to use it."
    }
  ],

  "action_steps": [
    {
      "title": "Short title",
      "action": "Specific action with exact instructions. Not 'call them' — 'Call the number on your bill, press 2 for billing, then ask for...'",
      "script": "Exact words to say. Complete sentence, copy-paste ready. null if not a phone/message step.",
      "when": "Today | Tomorrow | This week | After step X"
    }
  ],

  "phone_script": {
    "opening": "Exact first sentence to say when they answer. Include your account reference.",
    "key_phrases": ["3-5 specific phrases that unlock better treatment. These are magic words for this bill type."],
    "if_they_say_no": "Exact response when the first person refuses. Who to escalate to and what to say."
  }${hasAfford || hasAmount ? `,

  "payment_plan": {
    "strategy": "How to approach the negotiation. What percentage to start with, what they'll counter, what to accept.",
    "offer_amount": "Specific ${sym} amount to offer${hasAfford ? ` (based on ${sym}${canAffordMonthly}/month budget)` : ''}",
    "they_will_counter": "What they'll likely come back with",
    "accept_up_to": "Maximum you should agree to",
    "script": "Exact words to propose the payment plan. Copy-paste ready."
  }` : ''},

  "escalation_ladder": [
    {
      "who": "Level 1: Frontline rep → Level 2: Billing supervisor → Level 3: Financial hardship dept → Level 4: Written complaint to regulator",
      "what_to_say": "Exact phrase to use at this level"
    }
  ]${isCollections ? `,

  "collections_defense": {
    "overview": "What the user needs to know about their rights with debt collectors.",
    "validation_letter": "Complete, ready-to-send debt validation letter. Include: date, collector name/address placeholder, account reference, and the specific legal language requesting validation under FDCPA Section 809(b) or equivalent.",
    "what_to_say_on_phone": "Exact sentence to say if a collector calls. Short, firm, legally protective.",
    "never_do": ["3-4 things to NEVER do when dealing with collectors (e.g., never acknowledge the debt verbally, never give bank info)"]
  }` : ''},

  "hardship_letter": "A COMPLETE hardship letter ready to send. Include: date, 'To Whom It May Concern', the user's situation (${reason}), specific request (payment plan/reduction/forgiveness), proposed terms${hasAfford ? ` of ${sym}${canAffordMonthly}/month` : ''}, and polite closing. This should be 150-250 words and ready to email or mail. Not a template with blanks — fill in realistic details based on what you know.",

  "what_they_wont_tell_you": [
    "3-5 insider facts specific to this bill type. Things the billing department won't volunteer but are game-changers. Be specific."
  ],

  "assistance_programs": [
    {
      "program": "Specific program name",
      "who_qualifies": "Eligibility in plain language",
      "how_to_apply": "Exact steps — phone number, website, or where to go"
    }
  ],

  "worst_case": "What actually happens if they do nothing? Not fear-mongering — realistic. 'Your credit score drops X points. They can/cannot garnish wages. The debt expires after X years.'",
  "worst_case_reassurance": "Even the worst case is survivable. A warm sentence about why even the worst outcome is manageable.",

  "follow_up": {
    "document_this": "What to write down after the call: rep name, confirmation number, what was agreed.",
    "calendar_reminder": "Specific reminder to set: 'Set a reminder for [date] to confirm [action] was processed correctly.'",
    "if_they_dont_follow_through": "What to do if the company doesn't honor the agreement."
  },

  "permission": "One warm, powerful sentence giving them permission to deal with this imperfectly. Not generic — specific to their situation."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('Bill Guilt Eraser error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

module.exports = router;
