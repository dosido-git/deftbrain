const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// TRIAGE ACTION (default)
// ════════════════════════════════════════════════════════════
router.post('/email-urgency-triager', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { action, userLanguage } = req.body;

    // Route to compose handler
    if (action === 'compose') return handleCompose(req, res);

    // Default: triage
    const {
      emailContent, userRole, userTimezone,
      senderHistory, triageHistory
    } = req.body;

    if (!emailContent || !emailContent.trim()) {
      return res.status(400).json({ error: 'Email content is required' });
    }

    const role = userRole || 'Employee';
    const timezone = userTimezone || 'UTC';
    const emails = emailContent.trim();
    const history = senderHistory || {};

    const patternContext = triageHistory?.length
      ? `\n\nPREVIOUS TRIAGE PATTERNS (from ${triageHistory.length} past sessions):\n${triageHistory.slice(0, 5).map(t => `${t.date}: ${t.summary?.total_emails || 0} emails (${t.summary?.urgent_count || 0} urgent, ${t.summary?.optional_count || 0} optional)`).join('\n')}\nUse this to detect recurring senders the user always ignores or always treats as urgent.`
      : '';

    const prompt = `You are an advanced email urgency analyzer with AI learning capabilities. Analyze emails with:
1. **Thread intelligence** - detect escalation patterns
2. **Sender profiling** - use historical patterns to detect "cry wolf" senders
3. **Auto-categorization** - FYI vs Action Required vs Response Expected
4. **Smart scheduling** - timezone-aware response timing
5. **Draft replies** - contextual response drafts for each email needing response

USER ROLE: ${role}
USER TIMEZONE: ${timezone}
CURRENT TIME: ${new Date().toISOString()}

EMAILS TO ANALYZE:
${emails}

SENDER HISTORY (learned patterns):
${Object.keys(history).length > 0 ? JSON.stringify(history, null, 2) : 'No history yet'}${patternContext}

ANALYSIS FRAMEWORK:

## THREAD INTELLIGENCE
- Look for "Re:", "Fwd:", ">", "On [date], [sender] wrote:"
- Count messages in thread, detect TO vs CC
- Escalation: 1st=baseline, 2nd=slight, 3rd=significant, 4+=URGENT

## SENDER PROFILING
- cryWolfScore > 0.5: Downgrade urgency claims
- actuallyUrgent/total > 0.7: Upgrade priority (VIP)
- New sender: trust at face value

## AUTO-CATEGORIZATION
FYI / Action Required / Response Expected / Automated / Newsletter

## RESPONSE OPTIMIZATION
- Timezone-aware scheduling from domain/signature/mentions
- Time estimation: 5min (quick ack), 30min (thoughtful), 1-2hr (research)
- Batching and delegation suggestions

## DRAFT REPLIES
For "now" and "this_week" emails needing response:
- Reference the SPECIFIC email topic (not generic)
- Match formality to sender relationship
- Use [brackets] for user fill-in details
- "now" = ready-to-send; "this_week" = thoughtful framework
- "optional" = null

URGENCY TIERS:
- **NOW** = reply today (24h deadline, business-critical, 3+ follow-ups, blocking, VIP+deadline)
- **THIS_WEEK** = reply within 3-5 days (week deadline, important not blocking, routine, single follow-up)
- **OPTIONAL** = no response (FYI, newsletters, automated, CC-only, no ask)

OUTPUT (JSON only):
{
  "urgency_analysis": [
    {
      "email_subject": "subject — 3-6 words",
      "from": "sender — one sentence",
      "urgency_tier": "now / this_week / optional — 2-4 words",
      "email_category": "FYI / Action Required / Response Expected / Automated / Newsletter — one sentence",
      "reasoning": "why this tier — one sentence",
      "sender_marked_urgent": true/false,
      "thread_analysis": {
        "follow_up_count": 0,
        "is_escalating": false,
        "on_cc": false
      },
      "deadline_detected": "deadline or null — one sentence",
      "consequence_of_delay": "what happens if you wait — one sentence",
      "response_optimization": {
        "best_time": "when to respond — one sentence",
        "recipient_timezone": "detected or null — one sentence",
        "estimated_time": "5 min / 30 min / 1-2 hours (number)",
        "estimated_minutes": 5,
        "can_delegate": false,
        "delegate_to": null
      },
      "draft_reply": "Contextual draft or null for optional — one sentence"
    }
  ],
  "summary": {
    "total_emails": 0,
    "urgent_count": 0,
    "this_week_count": 0,
    "optional_count": 0,
    "total_estimated_minutes": 0,
    "delegation_count": 0
  },
  "batch_insights": {
    "similar_emails": ["Batch description"],
    "delegation_opportunities": "Summary — one sentence",
    "time_block_suggestion": "Suggested time block — one sentence"
  },
  "anxiety_relief": {
    "permission_to_wait": "Reassuring message — one sentence",
    "what_to_ignore": "Safe to ignore — one sentence",
    "batch_processing_tip": "Strategy — one sentence"
  },
  "recurring_patterns": {
    "always_optional_senders": ["sender - reason"],
    "always_urgent_senders": ["sender - reason"],
    "unsubscribe_candidates": ["sender - reason to unsubscribe"],
    "volume_observation": "Pattern observation — one sentence"
  },
  "response_templates": [
    {
      "for_urgency": "now / this_week — one sentence",
      "template": "Contextual template — 2-4 sentences"
    }
  ]
}

CRITICAL RULES:
1. 3+ follow-ups = NOW
2. High cry wolf score = downgrade
3. High actual urgency rate = upgrade (VIP)
4. CC = lower than TO
5. Unsubscribe link = OPTIONAL
6. Draft replies MUST reference actual email content
7. estimated_minutes must be a number

Return ONLY valid JSON.`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }]
    }, { label: 'email-urgency-triage' });

    if (!Array.isArray(parsed.urgency_analysis)) {
      return res.status(500).json({ error: 'Could not analyze your emails. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('Email Urgency Triager error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// COMPOSE ACTION
// ════════════════════════════════════════════════════════════
async function handleCompose(req, res) {
  try {
    const {
      emailSubject, emailFrom, emailBody,
      currentDraft, tone, length, instructions, userRole, userLanguage
    } = req.body;

    if (!emailSubject && !emailBody) {
      return res.status(400).json({ error: 'Email context is required' });
    }

    const toneGuide = {
      professional: 'Professional, polished, business-appropriate. Clear and direct.',
      casual: 'Friendly and conversational. Warm but still competent.',
      firm: 'Assertive and clear. Sets boundaries without being rude. Confident.',
      apologetic: 'Sincere and takes responsibility. Acknowledges the issue without groveling.',
      grateful: 'Warm and appreciative. Shows genuine gratitude.',
      urgent: 'Direct and action-oriented. Emphasizes time sensitivity.',
    };

    const lengthGuide = {
      quick: '2-3 sentences max. Acknowledge and confirm only.',
      standard: '1-2 short paragraphs. Cover key points concisely.',
      detailed: '2-3 paragraphs. Thorough, covers nuances, provides context.',
    };

    const prompt = `You are an expert email composer. Write a polished, ready-to-send reply.

ORIGINAL EMAIL:
Subject: ${emailSubject || 'Unknown'}
From: ${emailFrom || 'Unknown'}
${emailBody ? `Body: ${emailBody}` : ''}

${currentDraft ? `USER'S CURRENT DRAFT (refine this):\n${currentDraft}` : 'Write a fresh reply.'}

TONE: ${toneGuide[tone] || toneGuide.professional}
LENGTH: ${lengthGuide[length] || lengthGuide.standard}
USER ROLE: ${userRole || 'Employee'}
${instructions ? `SPECIAL INSTRUCTIONS: ${instructions}` : ''}

OUTPUT (JSON only):
{
  "composed_reply": "The polished email reply ready to send. No [brackets] unless user needs to fill something. — one sentence",
  "subject_line": "Re: appropriate subject — one sentence",
  "tone_used": "${tone || 'professional'}",
  "word_count": 0,
  "key_points_addressed": ["point 1", "point 2"],
  "alternative_closings": ["Best regards,", "Thanks,", "Looking forward to hearing from you,"]
}

RULES:
1. Directly address the specific email content — no generic filler
2. Match formality of original unless tone override specified
3. Every sentence must earn its place
4. Include clear next step or call to action when appropriate
5. If refining a draft, preserve user intent while improving clarity
6. No "I hope this email finds you well" unless it genuinely fits

Return ONLY valid JSON.`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }]
    }, { label: 'email-urgency-compose' });

    if (!parsed.composed_reply) {
      return res.status(500).json({ error: 'Could not compose the reply. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('Email compose error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = router;
