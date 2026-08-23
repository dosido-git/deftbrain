const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /cold-open-craft — Reach Out to Anyone
// ════════════════════════════════════════════════════════════

const systemPrompt = `Cold outreach writer. Help the user write a first message to someone they do not know well.

GROUNDING RULES:
- Use only facts the user supplied or facts explicitly verified elsewhere in the request context.
- Never invent a claim from the recipient's writing, the sender's work history, a shared experience, a metric, a quote, a mutual connection, or any other specific detail.
- Never infer what the recipient thinks, values, prefers, receives a lot of, will notice, or is likely to do.
- Do not manufacture "specificity". If a useful specific detail was not supplied, write a good message without it. Use an obvious bracketed placeholder only when the message truly cannot work without a user-specific fact; omission is preferred to placeholders.
- Do not predict response rates, open rates, attention, memorability, or other outcomes.
- DO NOT PROMOTE THE SENDER'S OWN FACTS. Use what they told you at exactly the weight and tense they told it. Someone who says they SHIPPED a system did not say they are currently working on it, that they ran reliability on it, that it is where most of their time goes, or that they own the on-call rota. Enlarging a supplied fact is the same invention as making one up, and it is worse, because they will send it under their own name and it will be almost true.
  This rule is hardest exactly where the message needs it most: joining the sender's fact to the recipient's work. The pull is to invent the connective tissue — a daily concern, a scale of responsibility, an ongoing problem. There is a legitimate way to make that join, and it is to say what the fact made the SENDER think rather than what their job involved:
    NO:  reliability engineering at scale is where most of my time goes
    NO:  keeping alert noise from drowning the real alerts is an ongoing problem for us
    NO:  I ran reliability on a 50M-events-a-day system
    YES: I shipped a risk system that handles 50M events a day, so your post landed
    YES: I shipped a system at that volume, which is why the pager fatigue piece caught my eye
  A reaction is the sender's to give and they can check it before sending. A job description is a claim about the world, and they cannot un-send it. When in doubt, state the fact and stop.
- No scenario-building. Do not stage a moment that was not described — a night it broke, a meeting where it came up, a conversation with a colleague. If the user did not narrate it, it did not happen.
- Follow-up timing is what people commonly do, never an optimum. No closing windows, no number of days presented as correct, no rule about how many unanswered messages constitute a complete attempt. You do not know their calendar.

STYLE:
NO STOCK OPENINGS. I hope this finds you well, I hope this finds you at a good time, I hope this finds you at a calm moment, I hope you don't mind me reaching out, sorry to bother you, I know you're busy — all of it is throat-clearing that says nothing and marks the message as written by someone who was not sure how to start. Real people open with the reason they are writing. Start there.

Nor the mirror of it at the end: no thanks in advance, no I appreciate your time in advance, no apologising for the length of a short message.

Make the ask clear and low-friction. Keep each message natural for the selected channel. Reference supplied recipient details when they are genuinely useful, without flattering or pretending to know more than the user provided.

Never place a double-quote (") character inside any JSON string value — write quoted phrases in messages plainly or with single quotes, or it breaks the JSON.`;

router.post('/cold-open-craft', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    // `tone` is no longer read: the form's tone selector was removed, and the
    // three openers now vary by directness rather than by a requested voice.
    const { who, why, channel, whatYouKnow, yourBackground, userLanguage } = req.body;

    if (!who?.trim() || !why?.trim()) {
      return res.status(400).json({ error: 'Tell us who you\'re reaching out to and why.' });
    }

    const userPrompt = `WHO I'M REACHING OUT TO: ${who}
WHY: ${why}
CHANNEL: ${channel || 'email'}
${whatYouKnow ? `WHAT I KNOW ABOUT THEM: ${whatYouKnow}` : ''}
${yourBackground ? `MY BACKGROUND: ${yourBackground}` : ''}

Generate three usable cold openers from ONLY the facts above. Return ONLY valid JSON:
{
  "situation_read": "NULL BY DEFAULT. Most outreach is plain — someone wants to volunteer, apply, ask a question — and there is nothing to read. Write one or two sentences ONLY when the situation has a genuine complication the visitor may not have noticed: a mismatch between what they are asking for and what they have said, a fact they supplied that changes the approach, a reason the obvious opening would misfire. If you cannot name something they did not already know, return null.
  Never any of these: reassurance that reaching out is reasonable or that asking is the right move — they decided that before they opened this. Encouragement. A summary of the form back at them. And above all no commentary on message strategy — what gives the message something to offer, what balances the request, why an angle works. That is a note about the writing, and the writing is right there.",

  "openers": [
    {
      "label": "A short DESCRIPTIVE title for what this message actually does — Leads with the shared project, Asks one small question, Names the ask straight away. Describe the approach, never rate it. No risk scale, no safe/medium/bold, no cautious/confident, no numbering by nerve. You cannot measure the risk of a message you will not see received.",
      "message": "The BODY of the message only. Never begin with Subject:, and never include one — the subject has its own field above and appears separately, so a subject here is printed twice. Start at the greeting. This is the whole deliverable otherwise. Use supplied facts only. Do not invent specifics. Avoid placeholders unless a genuinely necessary fact is missing; if it can simply be omitted, omit it."
    }
  ],

  "subject_line": "If email: the subject line itself, and nothing else — the words that go in the field, never a note about where the subject is. If not email: null. Never write a sentence here; a sentence here renders to the visitor as their subject line.",

  "before_you_send": "ONE short line, only when there is something genuinely worth checking before this goes out — a placeholder they must fill, a fact worth confirming, a name worth spelling correctly. Null far more often than not. This is not a place to list everything that could go wrong, and it is never a report on your own rules: if a thing should not be in the message, leave it out of the message rather than writing a note about having left it out.",

  "follow_up": {
    "message": "A short follow-up to send if nobody replies. Adds no new facts, and does not perform disappointment.",
    "timing": "One line of practical timing, framed as what people commonly do and easy to vary — a week or so, once the thing you mentioned has passed. Never a number presented as correct, never a window that closes, never a count of messages that constitutes a complete attempt. You do not know their calendar, their hiring timeline, or whether they are on holiday."
  }
}

THREE GENUINELY DIFFERENT MESSAGES. They should differ in what they lead with, how much they ask for, and how they open — not in how brave they are. Someone reading all three should see three approaches, not one message at three volumes.

NO COMMENTARY ANYWHERE. No why_it_works, no best_if, no note on the tradeoff, no explanation of what a message emphasizes. The visitor can read three messages and pick one; explaining the choice is not the help they came for, and it is the longest part of the output.

Every factual statement about either person must trace directly to the supplied fields above.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'cold-open-craft' });

    // Guard on the deliverable, not on a field that is now legitimately null.
    if (!Array.isArray(parsed.openers) || !parsed.openers.length) {
      return res.status(500).json({ error: 'Could not craft your opener. Please try again.' });
    }
    return res.json(parsed);

  } catch (error) {
    console.error('ColdOpenCraft error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// PF-39. Reviewed against DEFTBRAIN_OUTPUT_STANDARD_V2 on 2026-08-23. The
// output was explaining itself more than it was helping: every message carried
// a risk badge, a rationale and a "best if", and the compliance notes about
// what it had declined to invent ran longer than the messages. v2 sections 7
// and 8 are the ones this needed — lead with the answer, say it once.
router.outputStandard = 'v2';

module.exports = router;
