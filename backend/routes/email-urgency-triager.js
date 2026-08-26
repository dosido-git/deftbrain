const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

const NO_QUOTE_RULE =
  'Never place a double-quote (") character inside any JSON string value. Use single quotes or rewrite the phrase, or the JSON breaks.';

// Deterministic strings the model never writes. Thirteen languages, matching
// the catalog; base-language fallback so es-MX resolves to es.
const UI_STRINGS = {
  en: { needContent: 'Email content is required', analyzeFailed: 'Could not analyze your emails. Please try again.', failed: 'Something went wrong. Please try again.', needContext: 'Email context is required' },
  es: { needContent: 'Se necesita el contenido del correo', analyzeFailed: 'No se pudieron analizar tus correos. Inténtalo de nuevo.', failed: 'Algo salió mal. Inténtalo de nuevo.', needContext: 'Se necesita el contexto del correo' },
  zh: { needContent: '需要邮件内容', analyzeFailed: '无法分析你的邮件。请重试。', failed: '出了点问题。请重试。', needContext: '需要邮件的上下文' },
  hi: { needContent: 'ईमेल की सामग्री ज़रूरी है', analyzeFailed: 'आपके ईमेल का विश्लेषण नहीं हो सका। कृपया फिर कोशिश करें।', failed: 'कुछ गड़बड़ हो गई। कृपया फिर कोशिश करें।', needContext: 'ईमेल का संदर्भ ज़रूरी है' },
  ar: { needContent: 'محتوى البريد مطلوب', analyzeFailed: 'تعذر تحليل رسائلك. حاول مرة أخرى.', failed: 'حدث خطأ ما. حاول مرة أخرى.', needContext: 'سياق البريد مطلوب' },
  pt: { needContent: 'O conteúdo do e-mail é obrigatório', analyzeFailed: 'Não foi possível analisar seus e-mails. Tente novamente.', failed: 'Algo deu errado. Tente novamente.', needContext: 'O contexto do e-mail é obrigatório' },
  fr: { needContent: 'Le contenu de l’e-mail est requis', analyzeFailed: 'Impossible d’analyser vos e-mails. Veuillez réessayer.', failed: 'Une erreur est survenue. Veuillez réessayer.', needContext: 'Le contexte de l’e-mail est requis' },
  de: { needContent: 'E-Mail-Inhalt ist erforderlich', analyzeFailed: 'Deine E-Mails konnten nicht analysiert werden. Bitte versuche es erneut.', failed: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.', needContext: 'E-Mail-Kontext ist erforderlich' },
  ja: { needContent: 'メール本文が必要です', analyzeFailed: 'メールを分析できませんでした。もう一度お試しください。', failed: '問題が発生しました。もう一度お試しください。', needContext: 'メールの文脈が必要です' },
  ko: { needContent: '이메일 내용이 필요합니다', analyzeFailed: '이메일을 분석하지 못했습니다. 다시 시도하세요.', failed: '문제가 발생했습니다. 다시 시도하세요.', needContext: '이메일 맥락이 필요합니다' },
  ru: { needContent: 'Требуется текст письма', analyzeFailed: 'Не удалось проанализировать ваши письма. Попробуйте ещё раз.', failed: 'Что-то пошло не так. Попробуйте ещё раз.', needContext: 'Требуется контекст письма' },
  th: { needContent: 'ต้องมีเนื้อหาอีเมล', analyzeFailed: 'วิเคราะห์อีเมลของคุณไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', failed: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', needContext: 'ต้องมีบริบทของอีเมล' },
  vi: { needContent: 'Cần có nội dung email', analyzeFailed: 'Không phân tích được email của bạn. Vui lòng thử lại.', failed: 'Đã xảy ra lỗi. Vui lòng thử lại.', needContext: 'Cần có ngữ cảnh của email' },
};

function t(userLanguage, key) {
  const raw = String(userLanguage || 'en').toLowerCase().trim();
  const lang = UI_STRINGS[raw] ? raw : (UI_STRINGS[raw.split(/[-_]/)[0]] ? raw.split(/[-_]/)[0] : 'en');
  return UI_STRINGS[lang][key] || UI_STRINGS.en[key];
}

function localTimeContext(timeZone) {
  try {
    const now = new Date();
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    const time = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long',
      hour12: false,
    }).format(now);
    return `${date} ${time} (${timeZone})`;
  } catch {
    return `${new Date().toISOString()} (UTC)`;
  }
}

function cleanString(v, max = 800) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function cleanNullable(v, max = 800) {
  const s = cleanString(v, max);
  return s || null;
}

function cleanArray(v, maxItems = 10, maxLen = 500) {
  if (!Array.isArray(v)) return [];
  return v
    .filter(x => typeof x === 'string' && x.trim())
    .map(x => x.trim().slice(0, maxLen))
    .slice(0, maxItems);
}

function normalizeTier(v) {
  const s = String(v || '').toLowerCase().replace(/\s+/g, '_');
  if (['now', 'today', 'urgent'].includes(s)) return 'now';
  if (['this_week', 'week', 'can_wait'].includes(s)) return 'this_week';
  return 'optional';
}

function sanitizeEmail(item = {}) {
  const tier = normalizeTier(item.urgency_tier);
  const ro = item.response_optimization || {};
  const estimatedMinutes = Number(ro.estimated_minutes);

  return {
    email_subject: cleanString(item.email_subject, 220) || 'No subject',
    from: cleanString(item.from, 220) || 'Unknown sender',
    urgency_tier: tier,
    email_category: cleanString(item.email_category, 80) || 'Response Expected',
    reasoning: cleanString(item.reasoning, 500),
    sender_marked_urgent: Boolean(item.sender_marked_urgent),
    thread_analysis: {
      follow_up_count: Number.isFinite(Number(item.thread_analysis?.follow_up_count))
        ? Math.max(0, Math.min(20, Number(item.thread_analysis.follow_up_count)))
        : 0,
      is_escalating: Boolean(item.thread_analysis?.is_escalating),
      on_cc: Boolean(item.thread_analysis?.on_cc),
    },
    action_requested: cleanNullable(item.action_requested, 350),
    deadline_detected: cleanNullable(item.deadline_detected, 220),
    consequence_of_delay: cleanNullable(item.consequence_of_delay, 450),
    response_optimization: {
      best_time: cleanNullable(ro.best_time, 220),
      recipient_timezone: cleanNullable(ro.recipient_timezone, 120),
      estimated_time: cleanNullable(ro.estimated_time, 100),
      estimated_minutes: Number.isFinite(estimatedMinutes)
        ? Math.max(0, Math.min(240, Math.round(estimatedMinutes)))
        : 0,
      can_delegate: Boolean(ro.can_delegate),
      delegate_to: cleanNullable(ro.delegate_to, 160),
    },
    draft_reply: tier === 'optional' ? null : cleanNullable(item.draft_reply, 1200),
  };
}

function recomputeSummary(items) {
  const summary = {
    total_emails: items.length,
    urgent_count: 0,
    this_week_count: 0,
    optional_count: 0,
    total_estimated_minutes: 0,
    delegation_count: 0,
  };

  for (const item of items) {
    if (item.urgency_tier === 'now') summary.urgent_count++;
    else if (item.urgency_tier === 'this_week') summary.this_week_count++;
    else summary.optional_count++;

    summary.total_estimated_minutes += item.response_optimization?.estimated_minutes || 0;
    if (item.response_optimization?.can_delegate) summary.delegation_count++;
  }

  return summary;
}

function sanitizeInsights(raw = {}) {
  return {
    batch_insights: {
      similar_emails: cleanArray(raw.batch_insights?.similar_emails, 5, 300),
      delegation_opportunities: cleanNullable(raw.batch_insights?.delegation_opportunities, 400),
      time_block_suggestion: cleanNullable(raw.batch_insights?.time_block_suggestion, 350),
    },
    anxiety_relief: {
      permission_to_wait: cleanNullable(raw.anxiety_relief?.permission_to_wait, 400),
      what_to_ignore: cleanNullable(raw.anxiety_relief?.what_to_ignore, 400),
      batch_processing_tip: cleanNullable(raw.anxiety_relief?.batch_processing_tip, 400),
    },
    recurring_patterns: {
      always_optional_senders: cleanArray(raw.recurring_patterns?.always_optional_senders, 5, 260),
      always_urgent_senders: cleanArray(raw.recurring_patterns?.always_urgent_senders, 5, 260),
      unsubscribe_candidates: cleanArray(raw.recurring_patterns?.unsubscribe_candidates, 5, 260),
      volume_observation: cleanNullable(raw.recurring_patterns?.volume_observation, 350),
    },
    response_templates: Array.isArray(raw.response_templates)
      ? raw.response_templates.slice(0, 3).map(t => ({
          for_urgency: normalizeTier(t?.for_urgency) === 'optional' ? 'this_week' : normalizeTier(t?.for_urgency),
          template: cleanString(t?.template, 900),
        })).filter(t => t.template)
      : [],
  };
}

// ════════════════════════════════════════════════════════════
// TRIAGE
// ════════════════════════════════════════════════════════════
// The triage is finished before the guard runs; never hold it hostage.
const GUARD_ENTRY_MS = Number(process.env.EUT_GUARD_ENTRY_MS || 60_000);

router.post('/email-urgency-triager', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const startedAt = Date.now();
  try {
    const { action, userLanguage } = req.body || {};
    if (action === 'compose') return handleCompose(req, res);

    const {
      emailContent,
      userRole,
      userTimezone,
      senderHistory,
      triageHistory,
      userLocale,
      userCurrency,
      userRegion,
    } = req.body || {};

    if (!emailContent?.trim()) {
      return res.status(400).json({ error: t(userLanguage, 'needContent') });
    }

    const role = cleanString(userRole, 120) || 'Employee';
    const timezone = cleanString(userTimezone, 120) || 'UTC';
    const currentLocalTime = localTimeContext(timezone);

    // Keep the existing safety bound. The model is also told to analyze at most 15.
    let emails = emailContent.trim();
    if (emails.length > 30000) {
      emails =
        emails.slice(0, 30000) +
        '\n[... additional emails truncated — paste fewer at once for full coverage]';
    }

    /*
      IMPORTANT:
      senderHistory is AI-derived in the current frontend. It is therefore NOT
      allowed to promote/demote urgency. We pass only a compact note for optional
      descriptive insights, never as a decision rule.
    */
    const senderHistoryCount =
      senderHistory && typeof senderHistory === 'object'
        ? Object.keys(senderHistory).length
        : 0;

    const priorSessionCount = Array.isArray(triageHistory) ? triageHistory.length : 0;

    const sharedContext = `You are Email Urgency Triager.

CORE JOB:
Sort the user's pasted emails by what genuinely needs attention TODAY, what can wait, and what does not need a reply.

The primary question is NOT 'Does this email sound urgent?'
The primary question is:
WHAT HAPPENS IF THE USER WAITS?

USER ROLE: ${role}
USER TIMEZONE: ${timezone}
CURRENT LOCAL DATE/TIME: ${currentLocalTime}

EMAILS:
---
${emails}
---

CONTEXT ABOUT SAVED DATA:
- ${senderHistoryCount} senders have prior AI-generated triage history.
- ${priorSessionCount} prior triage sessions are stored.
- Do NOT use prior AI classifications, cry-wolf scores, VIP labels, or previous urgency tiers to upgrade or downgrade an email.
- Saved history may be mentioned only for neutral descriptive patterns, never as proof that a new email is urgent.

DECISION ORDER — USE THIS ORDER FOR EACH EMAIL:

1. DOES THE EMAIL REQUIRE ACTION?
   Identify the actual ask. If there is no ask, determine whether acknowledgment is genuinely expected.
   FYI, newsletters, automated notices, and CC-only messages usually do not require a reply, but this is a signal, not an automatic rule.

2. IS THERE AN EXPLICIT DEADLINE?
   Extract the deadline exactly if present.
   Compare it with CURRENT LOCAL DATE/TIME.
   A future deadline is NOT automatically a today deadline.
   Example: 'Need to know by Friday' on Tuesday normally belongs in THIS_WEEK unless a concrete consequence requires action sooner.

3. WHAT HAPPENS IF THE USER WAITS?
   Look for a concrete consequence: another person is blocked, a decision cannot proceed, money/rights/access may be lost, a same-day commitment is at risk, or an explicit today/24-hour deadline exists.
   If no consequence is stated or directly supported, use null. Do not invent one.

4. IS SOMEONE BLOCKED?
   Treat blocking as important only when the email actually establishes it.

5. DOES THIS REQUIRE THIS USER?
   Delegation is allowed only when the email/context supports it. Never invent a colleague, assistant, manager, or team member.

6. ONLY THEN CONSIDER SUPPORTING SIGNALS:
   Thread follow-ups, sender wording, TO vs CC, formatting such as URGENT, and sender relationship can support the analysis.
   They must NEVER determine the tier by themselves.

URGENCY TIERS:

NOW:
- A reply/action is genuinely needed today.
- Typical reasons: explicit today/24-hour deadline, concrete same-day consequence, someone is clearly blocked today, or delay until tomorrow materially worsens the situation.
- 'Urgent' wording alone is insufficient.
- Multiple follow-ups alone are insufficient.
- An important sender alone is insufficient.

THIS_WEEK:
- Action/reply matters, but the supplied facts do not require it today.
- Includes explicit deadlines later this week, routine decisions, thoughtful replies, and important but non-blocking work.
- If a deadline is beyond this week but a reply is still needed, place it here and state the actual deadline.

OPTIONAL:
- No reply is needed based on the supplied email.
- FYI/newsletter/automated/CC-only/unsubscribe signals are useful evidence, not automatic rules.
- If the user needs to read something but not reply, OPTIONAL is still appropriate; explain 'read, no reply needed.'

GROUNDING RULES:
- Every factual claim must be traceable to the pasted email.
- Never infer sender seniority, relationship importance, organizational consequences, timezone, availability of coworkers, or business impact unless supplied.
- Never turn 'Re:' into proof of escalation.
- Never turn a follow-up count into urgency.
- Never invent a deadline from tone.
- Never invent a consequence of delay.
- Never call someone a VIP, cry wolf sender, chronic escalator, or similar personality label.
- If uncertain between NOW and THIS_WEEK, prefer THIS_WEEK unless a today-level consequence is supported.
- If uncertain whether a reply is required, state the uncertainty briefly rather than manufacture an ask.

OUTPUT DISCIPLINE:
- Be sparse.
- Do not fill a field just because it exists.
- Prefer one grounded reason over several generic reasons.
- Do not repeat the same idea across reasoning, consequence, and deadline.
- Keep drafts under 60 words.
- Analyze at most 15 emails; if more are pasted, prioritize emails with the clearest action requests/deadlines and note that not all were covered.

DRAFTS:
- NOW: short, ready-to-send reply when enough information exists; use [brackets] only for a truly missing fact the user must provide.
- THIS_WEEK: concise draft/framework when useful.
- OPTIONAL: null.
- Never make commitments, accept dates, approve money, concede facts, or promise deliverables that the user did not authorize.

ESTIMATED TIME:
- Estimate only the time to write/respond, not the time required to complete the underlying work.
- Use conservative buckets: about 2, 5, 10, 20, 30, or 60 minutes.
- If the reply needs substantial research or a decision not present in the email, estimate the response-writing time and say the missing decision is the blocker.

${NO_QUOTE_RULE}`;

    const analysisPrompt = `${sharedContext}

Return ONLY valid JSON with exactly these top-level keys:
{
  "urgency_analysis": [
    {
      "email_subject": "subject",
      "from": "sender",
      "urgency_tier": "now | this_week | optional",
      "email_category": "FYI | Action Required | Response Expected | Automated | Newsletter",
      "reasoning": "One short sentence explaining the tier from supplied facts",
      "sender_marked_urgent": false,
      "thread_analysis": {
        "follow_up_count": 0,
        "is_escalating": false,
        "on_cc": false
      },
      "action_requested": "Specific ask or null",
      "deadline_detected": "Exact stated deadline or null",
      "consequence_of_delay": "Concrete supported consequence or null",
      "response_optimization": {
        "best_time": "Today / Before Friday / No reply needed / another grounded timing statement",
        "recipient_timezone": null,
        "estimated_time": "about 5 min",
        "estimated_minutes": 5,
        "can_delegate": false,
        "delegate_to": null
      },
      "draft_reply": "Grounded draft or null"
    }
  ],
  "summary": {
    "total_emails": 0,
    "urgent_count": 0,
    "this_week_count": 0,
    "optional_count": 0,
    "total_estimated_minutes": 0,
    "delegation_count": 0
  }
}

TODAY THRESHOLD:

Do not classify an email as NOW merely because failing to act eventually
has a consequence.

NOW requires evidence that waiting until tomorrow would materially worsen
the user's position, miss a same-day or imminent deadline, block someone
today, interrupt a service today, or create another concrete today-level
consequence.

A deadline days or weeks away belongs in THIS_WEEK unless the email
establishes a specific reason action is needed today.

NO REPLY NEEDED THRESHOLD:

NO REPLY NEEDED means the message does not reasonably invite or require
a response.

Do not classify a message as NO REPLY NEEDED merely because the stakes
are low or there is no serious consequence for waiting.

If a person directly asks the user a question, proposes a plan, requests
a call, asks for a decision, or otherwise clearly expects an answer,
classify it as THIS_WEEK unless there is evidence it belongs in NOW.

Reserve NO REPLY NEEDED primarily for FYIs, newsletters, automated
notices, informational CCs, and messages that genuinely require no response.

THREAD FIELDS:
- follow_up_count: report what can actually be counted from the pasted thread; otherwise 0.
- is_escalating: true only when later messages contain a materially stronger ask, deadline, or consequence than earlier messages.
- on_cc: true only when the pasted headers establish CC rather than TO.

recipient_timezone must normally be null. Fill it only if the email explicitly supplies a timezone or location that makes the timezone unambiguous and relevant.

Your response MUST contain urgency_analysis and summary.
Return only the JSON object.`;

    const insightsPrompt = `${sharedContext}

Create only the useful cross-email layer. Do NOT re-score emails.

Return ONLY valid JSON:
{
  "batch_insights": {
    "similar_emails": ["Only genuinely useful batching opportunities"],
    "delegation_opportunities": "Grounded delegation observation or null",
    "time_block_suggestion": "A practical response block based on estimated reply work, or null"
  },
  "anxiety_relief": {
    "permission_to_wait": "One concrete statement about what can safely wait, grounded in the batch",
    "what_to_ignore": "What clearly needs no reply, or null",
    "batch_processing_tip": "One useful batching suggestion, or null"
  },
  "recurring_patterns": {
    "always_optional_senders": [],
    "always_urgent_senders": [],
    "unsubscribe_candidates": ["Only obvious newsletters/marketing with unsubscribe evidence"],
    "volume_observation": null
  },
  "response_templates": [
    {
      "for_urgency": "now | this_week",
      "template": "Only include a reusable template if multiple emails truly share the same response job"
    }
  ]
}

RULES:
- Do not label senders as always urgent/optional from prior AI classifications; leave those arrays empty.
- Do not invent volume trends from the current paste.
- Do not create response templates merely to fill the array.
- If there is no useful cross-email insight, return empty arrays/null fields.
- Keep all prose concise.
Return only the JSON object.`;

    const [analysisRaw, insightsRaw] = await Promise.all([
      callClaudeWithRetry(
        {
          model: MODELS.SMART,
          max_tokens: 6000,
          messages: [
            {
              role: 'user',
              content:
                withLanguage(analysisPrompt, userLanguage) +
                withLocaleContext(userLocale, userCurrency, userRegion),
            },
          ],
        },
        { label: 'email-urgency-triage-analysis-v2' }
      ),
      callClaudeWithRetry(
        {
          model: MODELS.SMART,
          max_tokens: 1400,
          messages: [
            {
              role: 'user',
              content:
                withLanguage(insightsPrompt, userLanguage) +
                withLocaleContext(userLocale, userCurrency, userRegion),
            },
          ],
        },
        { label: 'email-urgency-triage-insights-v2' }
      ),
    ]);

    if (!Array.isArray(analysisRaw?.urgency_analysis)) {
      return res.status(500).json({ error: t(userLanguage, 'analyzeFailed') });
    }

    const urgencyAnalysis = analysisRaw.urgency_analysis
      .slice(0, 15)
      .map(sanitizeEmail);

    const parsed = {
      urgency_analysis: urgencyAnalysis,
      summary: recomputeSummary(urgencyAnalysis),
      ...sanitizeInsights(insightsRaw),
    };

    // Same trade as drive-home: the triage is complete here, and the guard is a
    // quality pass on top of it. Two SMART calls at 6000 + 1400 tokens have
    // already run, so it only gets a slot if there is time left for one.
    const elapsed = Date.now() - startedAt;
    if (elapsed > GUARD_ENTRY_MS) {
      console.log(`[email-urgency-triager-v2] v2 guard: skipped — ${Math.round(elapsed / 1000)}s already spent, answer returned unguarded`);
      return res.json(parsed);
    }

    const fields = [];
    const walk = (val, path) => {
      if (typeof val === 'string' && val.trim().length > 15) fields.push([path, val]);
      else if (Array.isArray(val)) val.forEach((v, i) => walk(v, `${path}[${i}]`));
      else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
    };
    walk({ urgency_analysis: parsed.urgency_analysis, batch_insights: parsed.batch_insights }, '');

    await runOutputGuard(parsed, {
      label: 'email-urgency-triager-v2',
      fields,
      supplied: `THE EMAILS THE VISITOR PASTED, IN FULL — nothing else about their work, their calendar, their relationships or these senders is known:
${emailContent}

Their stated role: ${userRole || 'not given'}. Their local time: ${localTimeContext(userTimezone)}.

WHAT FAILS:
1. A deadline, consequence, or escalation that is not in the pasted text. "They will escalate to your manager" is an invention unless someone wrote it.
2. A claim about the sender — seniority, importance, how they usually behave, whether they are annoyed. A signature block is not a relationship.
3. Treating position in the pile, or a subject line containing the word urgent, as evidence that something is urgent. The sender marking it urgent is a fact about the sender, not about the task.
4. A reply draft that commits the visitor to a date, a deliverable, a price or an apology they never mentioned.
5. Inventing what the visitor's own workload, priorities or availability are in order to justify a tier.`,
      promise: 'Email Urgency Triager sorts pasted emails into what needs a reply today, what can wait, and what needs no reply, using only what the emails themselves say. It then drafts replies on request.',
      guard: router.outputGuard,
      userLanguage,
      locale: withLocaleContext(userLocale, userCurrency, userRegion),
    });

    return res.json(parsed);
  } catch (error) {
    console.error('Email Urgency Triager error:', error);
    return res.status(500).json({ error: t(req.body?.userLanguage, 'failed') });
  }
});

// ════════════════════════════════════════════════════════════
// COMPOSE
// ════════════════════════════════════════════════════════════
async function handleCompose(req, res) {
  try {
    const {
      emailSubject,
      emailFrom,
      emailBody,
      currentDraft,
      tone,
      length,
      instructions,
      userRole,
      userLanguage,
      userLocale,
      userCurrency,
      userRegion,
    } = req.body || {};

    if (!emailSubject && !emailBody) {
      return res.status(400).json({ error: t(req.body?.userLanguage, 'needContext') });
    }

    const toneGuide = {
      professional: 'Professional, polished, business-appropriate. Clear and direct.',
      casual: 'Friendly and conversational. Warm but still competent.',
      firm: 'Assertive and clear. Sets boundaries without being rude.',
      apologetic: 'Sincere and accountable without over-apologizing.',
      grateful: 'Warm and appreciative without excess praise.',
      urgent: 'Direct and action-oriented without manufactured pressure.',
    };

    const lengthGuide = {
      quick: '2-3 sentences maximum.',
      standard: '1-2 short paragraphs.',
      detailed: '2-3 concise paragraphs only when the context actually needs it.',
    };

    const prompt = `You are Email Urgency Triager's reply composer.

Write a polished reply using ONLY the supplied email context and user instructions.

ORIGINAL EMAIL CONTEXT:
Subject: ${cleanString(emailSubject, 300) || 'Unknown'}
From: ${cleanString(emailFrom, 300) || 'Unknown'}
Body/context:
${cleanString(emailBody, 6000) || 'Not supplied'}

${currentDraft ? `USER'S CURRENT DRAFT:\n${cleanString(currentDraft, 5000)}` : 'Write a fresh reply.'}

TONE: ${toneGuide[tone] || toneGuide.professional}
LENGTH: ${lengthGuide[length] || lengthGuide.standard}
USER ROLE: ${cleanString(userRole, 120) || 'Employee'}
${instructions ? `SPECIAL INSTRUCTIONS: ${cleanString(instructions, 1500)}` : ''}

GROUNDING RULES:
- Do not invent names, dates, commitments, deliverables, approvals, reasons, meetings, attachments, or facts.
- Do not accept a proposed deadline or make a promise unless the user's instructions/current draft authorize it.
- If a necessary fact is missing, use one concise [bracketed placeholder].
- Preserve the user's intent when refining a draft.
- Match the original level of formality unless tone override says otherwise.
- Every sentence must earn its place.
- No 'I hope this email finds you well' filler.

OUTPUT JSON:
{
  "composed_reply": "Ready-to-send reply",
  "subject_line": "Appropriate Re: subject",
  "tone_used": "${tone || 'professional'}",
  "word_count": 0,
  "key_points_addressed": ["Only points actually addressed"],
  "alternative_closings": ["Up to 3 appropriate closings"]
}

${NO_QUOTE_RULE}
Return ONLY valid JSON.`;

    const parsed = await callClaudeWithRetry(
      {
        model: MODELS.SMART,
        max_tokens: 1800,
        messages: [
          {
            role: 'user',
            content:
              withLanguage(prompt, userLanguage) +
              withLocaleContext(userLocale, userCurrency, userRegion),
          },
        ],
      },
      { label: 'email-urgency-compose-v2' }
    );

    if (!parsed?.composed_reply) {
      return res.status(500).json({
        error: 'Could not compose the reply. Please try again.',
      });
    }

    return res.json({
      composed_reply: cleanString(parsed.composed_reply, 5000),
      subject_line: cleanString(parsed.subject_line, 400),
      tone_used: cleanString(parsed.tone_used, 80) || tone || 'professional',
      word_count: Number.isFinite(Number(parsed.word_count))
        ? Math.max(0, Math.round(Number(parsed.word_count)))
        : cleanString(parsed.composed_reply, 5000).split(/\s+/).filter(Boolean).length,
      key_points_addressed: cleanArray(parsed.key_points_addressed, 6, 250),
      alternative_closings: cleanArray(parsed.alternative_closings, 3, 120),
    });
  } catch (error) {
    console.error('Email compose error:', error);
    return res.status(500).json({ error: t(req.body?.userLanguage, 'failed') });
  }
}

router.outputStandard = 'v2';
// email-urgency-triager-v2. Reviewed 2026-08-25. Urgency is the product, and
// the guard exists to keep it traceable to the pasted text rather than to a
// sender's tone or a subject line that says URGENT.
router.outputGuard = {
  prohibit: [
    'deadline_not_in_the_email',
    'consequence_not_stated_by_the_sender',
    'claim_about_the_sender',           // seniority, mood, how they usually behave
    'urgency_from_tone_not_content',    // ALL CAPS, "urgent" in the subject, exclamation marks
    'invented_commitment_in_a_draft',   // a date, deliverable, price or apology nobody offered
    'invented_visitor_workload',        // their calendar, their other priorities
    'escalation_that_was_not_threatened',
    'now_without_a_today_level_consequence',   // a deadline weeks out is not today
    'no_reply_for_a_message_that_asks_one',    // low stakes is not the same as no ask
  ],
  require: [
    'tier_traceable_to_the_email_text',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
