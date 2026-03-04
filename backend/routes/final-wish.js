const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS, DIVERSION_LIMITS } = require('../lib/rateLimiter');
// ════════════════════════════════════════════════════════════
// FINAL WISH v3 — Backend Route
// Seven call types: parse-accounts, parse-financial,
//   generate-message, adjust-message, interview-question,
//   smart-gaps, translate-message
// ════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are the AI assistant inside FinalWish, a digital legacy planning tool. Your role is to help users organize their digital life and write meaningful messages for their loved ones.

TONE: Warm, grounded, practical. Not morbid. Not overly cheerful. Think "a kind friend who's good at organizing" — someone who makes a hard task feel manageable.

WHEN HELPING WRITE MESSAGES:
- Write in the user's voice, not yours. Use their words, their level of formality, their humor.
- Favor specific details over generic sentiment.
- Don't add flourishes the user didn't express. If they're matter-of-fact, be matter-of-fact.
- Keep the emotional register honest — don't inflate feelings the user didn't express.
- It's okay for messages to be short. A genuine 3-sentence message beats a flowery page.

WHEN PARSING ACCOUNTS/ITEMS:
- Extract structured data from free-text responses.
- Auto-categorize intelligently.
- Don't ask for information the user shouldn't put in this document (actual passwords, SSNs, PINs).

FORMAT: Always respond in valid JSON matching the schema requested. No markdown fences, no preamble. Pure JSON only.`;

// Helper: parse arrays from Claude response (handles both [ and { first)
function parseArrayResponse(raw) {
  const bracket = raw.indexOf('[');
  const brace = raw.indexOf('{');
  if (bracket !== -1 && (brace === -1 || bracket < brace)) {
    const arrStr = raw.substring(bracket);
    const lastBracket = arrStr.lastIndexOf(']');
    return JSON.parse(arrStr.substring(0, lastBracket + 1));
  }
  const cleaned = cleanJsonResponse(raw);
  const result = JSON.parse(cleaned);
  return Array.isArray(result) ? result : [result];
}

router.post('/final-wish', rateLimit(), async (req, res) => {
  console.log('FinalWish v3 endpoint called');

  try {
    const { mode, payload, locale } = req.body;
    const lang = withLanguage(locale);

    // ── MODE 1: Parse accounts from free text ──
    if (mode === 'parse-accounts') {
      const { text, trustedPerson, existingNames } = payload || {};
      if (!text || text.trim().length < 3) {
        return res.status(400).json({ error: 'Please describe your accounts' });
      }

      console.log('Parsing accounts from freetext');

      const prompt = `The user is creating a digital legacy document for "${trustedPerson || 'their trusted person'}". They described their important accounts:

"${text.trim()}"

${existingNames ? `They already have these accounts listed: ${existingNames}. Only extract NEW accounts not already listed.` : ''}

Extract each account/service mentioned. For each, determine:
- name: the service name
- category: one of: financial, email, social, cloud, subscription, work, medical, other
- priority: one of: critical, important, nice-to-have
- accessNotes: any access hints they mentioned (NOT actual passwords)
- isSocialMedia: boolean

Return JSON array: [{ "name": "...", "category": "...", "priority": "...", "accessNotes": "...", "isSocialMedia": false }]

If no clear accounts found, return an empty array.${lang}`;

      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = msg.content[0]?.text || '[]';
      return res.json({ accounts: parseArrayResponse(raw) });
    }

    // ── MODE 2: Parse financial from free text ──
    if (mode === 'parse-financial') {
      const { text } = payload || {};
      if (!text || text.trim().length < 3) {
        return res.status(400).json({ error: 'Please describe your financial accounts' });
      }

      console.log('Parsing financial accounts');

      const prompt = `The user described their financial accounts for a digital legacy document:

"${text.trim()}"

Extract each financial item. Categorize as: bank, investment, debt, income, insurance.
Return JSON array: [{ "name": "...", "type": "...", "institution": "...", "notes": "..." }]

If nothing found, return [].${lang}`;

      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = msg.content[0]?.text || '[]';
      return res.json({ financials: parseArrayResponse(raw) });
    }

    // ── MODE 3: Generate message draft ──
    if (mode === 'generate-message') {
      const { recipientName, relationship, whatToKnow, memories, tone, userName, trustedPerson } = payload || {};
      if (!recipientName || !whatToKnow) {
        return res.status(400).json({ error: 'Recipient and message content are required' });
      }

      console.log('Generating message for:', recipientName);

      const prompt = `Write a personal message from the user to "${recipientName}".

Context:
- Relationship: ${relationship || 'not specified'}
- What the user wants them to know: ${whatToKnow}
- Specific memories/references: ${memories || 'none provided'}
- Desired tone: ${tone || 'warm'}
- The user's name: ${userName || 'not provided'}
- This is part of a legacy document prepared for ${trustedPerson || 'someone they trust'}

Write the message in the user's voice based on what they shared. Be specific, not generic. Use their words and details. Keep it authentic — don't inflate emotions beyond what was expressed.

Return JSON: { "draft": "the message text", "lengthWords": number }${lang}`;

      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = msg.content[0]?.text || '{}';
      return res.json({ message: JSON.parse(cleanJsonResponse(raw)) });
    }

    // ── MODE 4: Adjust existing message ──
    if (mode === 'adjust-message') {
      const { draft, adjustment, recipientName, relationship, tone } = payload || {};
      if (!draft || !adjustment) {
        return res.status(400).json({ error: 'Draft and adjustment are required' });
      }

      console.log('Adjusting message for:', recipientName);

      const prompt = `Adjust this personal legacy message. Adjustment requested: "${adjustment}"

Original message:
"${draft}"

Context: Written to ${recipientName || 'someone'} (${relationship || 'relationship not specified'}). Tone: ${tone || 'warm'}.

Return JSON: { "draft": "the adjusted message text" }${lang}`;

      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = msg.content[0]?.text || '{}';
      return res.json({ message: JSON.parse(cleanJsonResponse(raw)) });
    }

    // ── MODE 5: AI Interview — Next Question ──
    if (mode === 'interview-question') {
      const { documentState, previousQuestions } = payload || {};

      console.log('Generating interview question');

      const stateDesc = [];
      if (documentState?.accountCount) stateDesc.push(`${documentState.accountCount} accounts documented`);
      else stateDesc.push('NO accounts documented yet');
      if (documentState?.financialCount) stateDesc.push(`${documentState.financialCount} financial items`);
      else stateDesc.push('NO financial accounts yet');
      if (documentState?.messageCount) stateDesc.push(`${documentState.messageCount} messages drafted`);
      else stateDesc.push('NO messages written yet');
      if (documentState?.hasDocuments) stateDesc.push('documents checklist started');
      if (documentState?.hasPets) stateDesc.push('has pets');
      if (documentState?.hasHomeNotes) stateDesc.push('home notes added');
      if (documentState?.hasDeviceNotes) stateDesc.push('device notes added');
      if (documentState?.hasEmergencyContacts) stateDesc.push('emergency contacts added');
      if (documentState?.accountCategories) stateDesc.push(`account categories: ${documentState.accountCategories}`);
      if (documentState?.trustedPerson) stateDesc.push(`trusted person: ${documentState.trustedPerson}`);

      const prevQs = (previousQuestions || []).join('\n- ');

      const prompt = `You are helping a user complete their FinalWish digital legacy document through an interview. Your job is to ask ONE insightful, specific question that will uncover something they haven't thought of yet.

CURRENT DOCUMENT STATE:
${stateDesc.join('\n')}

${prevQs ? `QUESTIONS ALREADY ASKED (don't repeat these topics):\n- ${prevQs}` : 'No questions asked yet — start with something important but easy.'}

QUESTION GUIDELINES:
- Ask about things people commonly forget: co-signed accounts, cryptocurrency, password managers, 2FA recovery codes, domain registrations, loyalty program points, outstanding debts owed TO them, safety deposit boxes, storage units, business partnerships
- For messages: "Is there someone you've been meaning to thank?" or "Anyone you'd want to clear the air with?"
- Be specific: "Do you have any accounts where someone else is listed as co-owner or beneficiary?" not "Tell me more about your accounts"
- Be warm but efficient — this is a hard topic and people appreciate directness
- If they have accounts but no financial items, ask about financial accounts
- If they have no messages yet, gently suggest writing one
- DON'T ask about things they've already covered

Return JSON: {
  "question": "The question to ask",
  "category": "accounts|financial|messages|documents|wishes|general",
  "reasoning": "Why this question matters (1 sentence, shown as a subtle hint)",
  "followUpHint": "What to probe deeper on based on their answer"
}${lang}`;

      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = msg.content[0]?.text || '{}';
      return res.json({ interview: JSON.parse(cleanJsonResponse(raw)) });
    }

    // ── MODE 6: Smart Gaps Analysis ──
    if (mode === 'smart-gaps') {
      const { documentState } = payload || {};

      console.log('Running smart gaps analysis');

      const prompt = `Analyze this FinalWish digital legacy document for gaps and missing information. Be specific and actionable — generic advice is useless.

DOCUMENT STATE:
- Accounts (${documentState?.accountCount || 0}): ${documentState?.accountNames || 'none'}
- Account categories covered: ${documentState?.accountCategories || 'none'}
- Financial items (${documentState?.financialCount || 0}): ${documentState?.financialNames || 'none'}
- Financial types covered: ${documentState?.financialTypes || 'none'}
- Messages drafted (${documentState?.messageCount || 0}): to ${documentState?.messageRecipients || 'nobody'}
- Documents checklist: ${documentState?.documentsChecked || 'none checked'}
- Recurring bills noted: ${documentState?.hasRecurringBills ? 'yes' : 'no'}
- Pets: ${documentState?.hasPets ? 'yes' : 'no'}
- Home notes: ${documentState?.hasHomeNotes ? 'yes' : 'no'}
- Device notes: ${documentState?.hasDeviceNotes ? 'yes' : 'no'}
- Emergency contacts: ${documentState?.hasEmergencyContacts ? 'yes' : 'no'}
- Memorial wishes: ${documentState?.hasMemorial ? 'yes' : 'no'}

FIND SPECIFIC GAPS like:
- "You have a Chase account but no mention of who's on the account or if there's a beneficiary"
- "You listed Netflix but haven't documented your email — they'll need email access to cancel subscriptions"
- "No password manager mentioned — how will they access these accounts?"
- "3 pets listed but only 1 has vet info"
- "Financial accounts but no life insurance or will mentioned"
- "No emergency contacts — who should be called first?"
- Cross-dependencies between items (email needed for other accounts, etc.)

Return JSON: {
  "gaps": [
    { "severity": "critical|important|nice-to-have", "section": "accounts|financial|messages|documents|wishes", "finding": "Specific finding", "suggestion": "What to add" }
  ],
  "overallScore": 1-10,
  "summary": "One sentence overall assessment"
}

Return 3-8 gaps, prioritized by severity. Be specific to THEIR data, not generic.${lang}`;

      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = msg.content[0]?.text || '{}';
      return res.json({ analysis: JSON.parse(cleanJsonResponse(raw)) });
    }

    // ── MODE 7: Translate Message ──
    if (mode === 'translate-message') {
      const { draft, targetLanguage, recipientName, relationship } = payload || {};
      if (!draft || !targetLanguage) {
        return res.status(400).json({ error: 'Draft and target language are required' });
      }

      console.log('Translating message to:', targetLanguage);

      const prompt = `Translate this personal legacy message to ${targetLanguage}. This is an intimate, personal message — maintain the emotional tone, warmth, and authenticity of the original. Don't make it more formal or flowery than the original. If the original is casual, keep it casual in the translation.

Original message (written to ${recipientName || 'someone'}, ${relationship || 'relationship not specified'}):
"${draft}"

Return JSON: { "translatedDraft": "the translated message", "language": "${targetLanguage}" }`;

      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = msg.content[0]?.text || '{}';
      return res.json({ translation: JSON.parse(cleanJsonResponse(raw)) });
    }

    return res.status(400).json({ error: 'Invalid mode' });

  } catch (err) {
    console.error('FinalWish error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
