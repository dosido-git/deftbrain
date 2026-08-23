const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted phrases plainly or with single quotes, or it breaks the JSON.';

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
  THE SENDER'S INNER LIFE IS NOT YOURS EITHER. Their opinions, reactions, motives and past actions are facts about a person, and you have only the ones they typed. Told they follow someone's newsletter and thought a piece was thoughtful, you know exactly that — not that it was the most concrete thing they have read, not that they sent it to their team, not that it is why this company appeals to them, not that the tradeoffs in it are familiar from their own system.
    NO:  the most concrete thing I have read on the subject       (an opinion they did not express)
    NO:  I sent it to my team the day it went up                  (an action that did not happen)
    NO:  the pager fatigue piece made Stripe feel like the right fit  (a motive they did not give)
    NO:  the tradeoffs you described are familiar                 (assumes the piece maps to their work)
    NO:  your piece stuck with me / I found it genuinely useful    (a DIFFERENT opinion from the one given)
    YES: I read your piece on pager fatigue and thought it was thoughtful   (their words, their weight)
  Where they gave you an opinion, use theirs. Thoughtful is not the same claim as useful, and neither is the same as it stuck with me — one judges the writing, one judges its effect on them, and swapping between them is still speaking for them. Reuse the word.
    YES: I follow your newsletter. I'm writing about the SRE opening.       (fact, then ask, no bridge)
  Manufacturing enthusiasm is the strongest pull in cold outreach and the easiest place to put words in someone's mouth. A message may be plainer than you would like. It may not have a bridge between the sender's background and the recipient's work, because none was supplied — and two true sentences beat one warm invented one. When in doubt, state the fact and make the ask.
- No scenario-building. Do not stage a moment that was not described — a night it broke, a meeting where it came up, a conversation with a colleague. If the user did not narrate it, it did not happen.
- Follow-up timing is what people commonly do, never an optimum. No closing windows, no number of days presented as correct, no rule about how many unanswered messages constitute a complete attempt. You do not know their calendar.

STYLE:
NO STOCK OPENINGS. I hope this finds you well, I hope this finds you at a good time, I hope this finds you at a calm moment, I hope you don't mind me reaching out, sorry to bother you, I know you're busy — all of it is throat-clearing that says nothing and marks the message as written by someone who was not sure how to start. Real people open with the reason they are writing. Start there.

Nor the mirror of it at the end: no thanks in advance, no I appreciate your time in advance, no apologising for the length of a short message.

Make the ask clear and low-friction. Keep each message natural for the selected channel. Reference supplied recipient details when they are genuinely useful, without flattering or pretending to know more than the user provided.

Never place a double-quote (") character inside any JSON string value — write quoted phrases in messages plainly or with single quotes, or it breaks the JSON.`;


// ════════════════════════════════════════════════════════════
// SUPPLIED-FACTS CHECK
// ════════════════════════════════════════════════════════════
// The generator has now invented first-person material three reviews running:
// a job role from a shipped project, then an opinion ("the most concrete thing
// I have read"), an action ("I sent it to my team the day it went up") and a
// motive ("made Stripe feel like the right fit"). Each was fixed in the prompt
// and the next one arrived in a different costume, because manufacturing
// enthusiasm is what cold outreach pulls toward and a rule is only a rule until
// the sentence needs a bridge.
//
// So this is a second pass, and it is adversarial by construction: its only job
// is to find claims the form does not support. It is never asked to write a
// better message — a model asked to improve its own draft rates it as fine.
// The envelope here needs no assembling, because the four form fields ARE the
// envelope: everything true about either person arrived in them.
//
// Fail-open throughout. A net that can drop the answer is worse than no net.

function getByPath(obj, path) {
  const m = String(path).match(/^([a-z_]+)(?:\[(\d+)\])?(?:\.([a-z_]+))?$/);
  if (!m) return undefined;
  const [, key, idx, sub] = m;
  let cur = obj[key];
  if (idx !== undefined) cur = Array.isArray(cur) ? cur[Number(idx)] : undefined;
  if (sub) cur = cur && typeof cur === 'object' ? cur[sub] : undefined;
  return cur;
}

function setByPath(obj, path, value) {
  const m = String(path).match(/^([a-z_]+)(?:\[(\d+)\])?(?:\.([a-z_]+))?$/);
  if (!m) return false;
  const [, key, idx, sub] = m;
  if (idx === undefined) {
    if (!sub) { if (!(key in obj)) return false; obj[key] = value; return true; }
    if (!obj[key] || typeof obj[key] !== 'object') return false;
    obj[key][sub] = value; return true;
  }
  if (!Array.isArray(obj[key])) return false;
  const i = Number(idx);
  if (i < 0 || i >= obj[key].length) return false;
  if (!sub) { obj[key][i] = value; return true; }
  if (!obj[key][i] || typeof obj[key][i] !== 'object') return false;
  obj[key][i][sub] = value; return true;
}

async function enforceSuppliedFacts(parsed, supplied, { userLanguage, locale }) {
  const fields = [];
  (parsed.openers || []).forEach((o, i) => {
    if (typeof o?.message === 'string') fields.push([`openers[${i}].message`, o.message]);
  });
  if (typeof parsed.follow_up?.message === 'string') fields.push(['follow_up.message', parsed.follow_up.message]);
  if (!fields.length) return;

  const envelope = `WHAT THE VISITOR ACTUALLY TYPED — the complete set of true things:

WHO THEY ARE WRITING TO: ${supplied.who}
WHY: ${supplied.why}
WHAT THEY KNOW ABOUT THE RECIPIENT: ${supplied.whatYouKnow || '(nothing supplied)'}
WHAT THEY SAID ABOUT THEMSELVES: ${supplied.yourBackground || '(nothing supplied)'}`;

  const checkPrompt = `You are checking draft outreach messages for claims the visitor did not make. You are not writing or improving them.

${envelope}

DRAFTS:
${fields.map(([path, value]) => `${path}:\n${value}`).join('\n\n')}

These messages go out under the visitor's own name. Every first-person statement is therefore a claim they will be taken to have made. For each draft, find any of these that the fields above do not support:

- an OPINION they did not express ("the most concrete thing I have read", "easily the best team in the space") — including a DIFFERENT opinion swapped for one they did give: told a piece was thoughtful, "it stuck with me" and "I found it genuinely useful" are both claims they did not make
- an ACTION they did not report ("I sent it to my team", "I have been following since the beginning", "I have read everything you've written")
- a MOTIVE they did not give ("which is why this company appeals to me", "it made the role feel right")
- a RELEVANCE they did not claim ("the tradeoffs you described are familiar", "exactly the problem we hit")
- an enlargement of something they did say — a role bigger than the fact, a tense moved into the present, a scale added, or ONE PROJECT GENERALISED INTO A FIELD OR A CAREER: told "I shipped a risk system that handles 50M events a day", the drafts "I've been building in the reliability space" and "my background is in high-volume reliability work" both describe a career from a single project
- anything about the RECIPIENT beyond what was supplied: what they think, prefer, are busy with, will notice

Say nothing about tone, quality, length or persuasiveness. A plain message is not a defect. Brackets like [Name] are intentional and are not violations. Where the visitor said they thought something was thoughtful, the draft may say it was thoughtful — at that weight and no more.

OUTPUT (JSON only):
{
  "verdict": "PASS or FAIL",
  "violations": [
    { "field": "exact identifier from the drafts above", "claim": "the unsupported phrase, quoted", "why": "what it asserts that was never supplied, in a few words" }
  ]
}

verdict and field are machine identifiers, not prose. Write verdict as the English word PASS or FAIL whatever language the rest of this is in, and copy field character-for-character — openers[0].message stays openers[0].message. Code compares both literally; a translated one matches nothing and the check is silently lost.

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

  const check = await callClaudeWithRetry({
    model: MODELS.FAST,
    max_tokens: 2000,
    messages: [{ role: 'user', content: withLanguage(checkPrompt, userLanguage) }],
  }, { label: 'cold-open-craft-check' });

  const seen = new Set();
  const violations = (Array.isArray(check?.violations) ? check.violations : [])
    .filter(v => v && typeof v.field === 'string' && getByPath(parsed, v.field) !== undefined)
    .filter(v => !seen.has(v.field) && seen.add(v.field));

  console.log(`[cold-open-craft] supplied-facts check: ${String(check?.verdict).toUpperCase() === 'FAIL' ? 'FAIL' : 'PASS'} (${violations.length} violation(s)${violations.length ? ': ' + violations.map(v => v.field).join(', ') : ''})`);

  if (String(check?.verdict).toUpperCase() !== 'FAIL' || !violations.length) return;

  const repairPrompt = `Repair specific outreach drafts that claim things the visitor never said. Keep everything else.

${envelope}

${violations.map((v, i) => `${i}. [${v.field}]
current:
${getByPath(parsed, v.field)}

unsupported: ${v.claim}${v.why ? ` — ${v.why}` : ''}`).join('\n\n')}

Cut the unsupported claim. Do not replace it with a different unsupported claim, and do not reach for a warmer one to compensate — the usual repair failure is swapping an invented opinion for an invented enthusiasm. The message is allowed to be plainer. If removing the phrase leaves no bridge between the two people, that is correct: there was no bridge in what the visitor typed. State the fact, make the ask, stop.

Return the complete repaired message for each item, ready to send.

OUTPUT (JSON only):
{ "fixes": [ { "n": 0, "message": "the full repaired message" } ] }

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

  const repair = await callClaudeWithRetry({
    model: MODELS.FAST,
    max_tokens: 2500,
    messages: [{ role: 'user', content: withLanguage(repairPrompt, userLanguage) + locale }],
  }, { label: 'cold-open-craft-repair' });

  // Keyed by number: withLanguage translates JSON string values, and a
  // translated field path addresses nothing.
  (Array.isArray(repair?.fixes) ? repair.fixes : []).forEach(fix => {
    const v = violations[Number(fix?.n)];
    if (!v || typeof fix.message !== 'string' || !fix.message.trim()) return;
    setByPath(parsed, v.field, fix.message.trim());
  });
}

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
    "timing": "One short line, and not a claim about anybody's behaviour. No what people commonly do, no typical interval, no number of days: nobody counted. Say to give the first message some room, and to adjust around any deadline the visitor actually mentioned. If there is nothing useful to add, return null."
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
    // Fail-open: this wraps a working answer and must never be able to drop it.
    try {
      await enforceSuppliedFacts(parsed, { who, why, whatYouKnow, yourBackground }, {
        userLanguage,
        locale: withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      });
    } catch (err) {
      console.error('ColdOpenCraft supplied-facts check skipped:', err.message);
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
