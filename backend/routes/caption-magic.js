const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit } = require('../lib/rateLimiter');

// ── Helper: extract base64 and media type from data URL ──
function parseDataUrl(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!match) return null;
  // Strict base64 validation: a corrupted upload used to sail through to the
  // API, get a non-retryable 400 on every attempt, and surface as a hard 500
  // (audit 2026-07-19). Reject it here so the route can 400 with a friendly
  // "re-upload" message instead.
  const data = match[2].replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data) || data.length % 4 !== 0) return null;
  return { media_type: match[1], data };
}

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted phrases in caption text plainly or with single quotes, or it breaks the JSON.';

// ── Platform character limits ──
const PLATFORM_LIMITS = {
  instagram: 2200,
  linkedin: 3000,
  facebook: 63206,
  twitter: 280,
  tiktok: 2200,
  threads: 500,
};

const PLATFORM_NAMES = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  twitter: 'Twitter/X',
  tiktok: 'TikTok',
  threads: 'Threads',
};

// ════════════════════════════════════════════
// EVIDENCE ENVELOPE
// ════════════════════════════════════════════
// not_sure_about was prose, and prose is advisory: the model produced an
// accurate list and then contradicted it three sentences later, repeatedly and
// across four prompt rewrites. The fix is not another sentence asking it to
// mean the list. It is to stop the generator being able to see anything the
// list does not cover.
//
//   image → envelope → generation (NO IMAGE) → validation (NO IMAGE) → render
//
// Stage 2 and stage 3 never receive the picture. That is the whole mechanism.
// A generator that cannot see the scene cannot invent a detail from it, and a
// validator that cannot see the scene cannot quietly agree with a claim by
// looking at the image and finding it plausible — it has only the envelope to
// check against, which is exactly the comparison we want made.

// Model-generated lists keep omitting the things that are not visible, because
// the model builds them by looking. Authorship kept falling out of
// not_sure_about for exactly this reason. These are supplied by code so they
// cannot be forgotten; the observer adds scene-specific ones on top.
const NEVER_INFERABLE = [
  'who anyone pictured is, and how they are related to each other or to the poster',
  'whose things these are — whether the poster owns, made, found or bought anything pictured',
  'where this is, beyond what is actually legible in the frame',
  'when it happened — date, day, time of day, season, or how recently',
  'what happened before or after: what someone had just finished doing, or was about to do',
  'the history, provenance, price, age or condition of anything pictured',
  'what a real person actually felt or thought, reported as fact',
  'what viewers will do, feel, notice or how they will respond to the post',
];

function renderEnvelope(env) {
  const list = (a) => (Array.isArray(a) && a.length ? a.map(x => `- ${x}`).join('\n') : '- (none)');
  return `EVIDENCE ENVELOPE

OBSERVED:
${list(env.observed)}

UNCERTAIN:
${list(env.uncertain)}

PROHIBITED INFERENCES:
${list(env.prohibited_inferences)}

OBSERVED is your raw material. Play with it freely — that is what it is for.

UNCERTAIN is what the picture cannot settle. Write about these things all you like; just don't state the answer as fact.

PROHIBITED INFERENCES are concrete claims about the real situation behind the photo that the photo cannot establish.

THE LINE IS BETWEEN INVENTING A VOICE AND INVENTING A FACT.

Invent freely: jokes, absurdity, metaphor, personification, attitude, rhetorical exaggeration, an imagined inner monologue, an unexpected angle on what is in frame. "The cactus remains neutral. The cup knows nothing." invents nothing about the world — nobody reads it as a report on a cactus's mental state. "Me wondering what any of this has to do with anything" is caption voice, not testimony. Neither is a violation and neither should be softened.

Do not invent: who these people are, how they are related, whose things these are, where this is, when it happened, what happened just before or after. "My grandmother gave me this cactus", "first morning in our new apartment", "after three hours of repotting this thing", "she had no idea I was taking this" — each of these would be read as true, and each would be false.

The test is what a reasonable reader comes away believing. If they would believe something untrue about the real situation, it is a violation. If they would only come away smiling, it is the product working.`;
}

// Targeted repair addresses one field. Paths are a closed vocabulary the
// validator is given verbatim, so this parser only ever sees shapes it knows.
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
    if (!(key in obj)) return false;
    obj[key] = value; return true;
  }
  if (!Array.isArray(obj[key])) return false;
  const i = Number(idx);
  if (i < 0 || i >= obj[key].length) return false;
  if (!sub) { obj[key][i] = value; return true; }
  if (!obj[key][i] || typeof obj[key][i] !== 'object') return false;
  obj[key][i][sub] = value; return true;
}

// char_count is a consumed hero stat — code-compute it (the model understated
// all three counts in the audit). And asking for funnier captions produced
// funnier hashtags — "make it make sense", "jellyfish energy" — where a space
// means it is not a hashtag on any platform that has them. Both are mechanical
// properties of a string rather than judgements worth model attention.
function normaliseCaptions(out) {
  if (!Array.isArray(out?.captions)) return;
  out.captions.forEach(c => {
    if (c && typeof c.text === 'string') c.char_count = c.text.length;
    if (!Array.isArray(c?.hashtags)) return;
    c.hashtags = c.hashtags
      .map(h => (typeof h === 'object' ? h?.tag : h))
      .map(tag => String(tag || '').replace(/^#+/, '').trim())
      // Two or three words close up into something readable — summer night
      // becomes #summernight. Four or more does not: "come what may it" came
      // back as #comewaitmayit, which is not a word in any language. Drop
      // those rather than ship the mash.
      .filter(tag => tag && tag.split(/[\s_]+/).filter(Boolean).length <= 3)
      .map(tag => tag.replace(/[\s_]+/g, ''))
      .filter(Boolean)
      .map(tag => ({ tag }));
  });
}

// ════════════════════════════════════════════
// MAIN ENDPOINT: Generate captions
// ════════════════════════════════════════════
router.post('/caption-magic', rateLimit(), async (req, res) => {
  try {
    const { imageBase64, imageDescription, platform, context, avoidMention, captionLength, userLanguage } = req.body;

    if (!imageBase64 && !imageDescription) {
      return res.status(400).json({ error: 'Provide an image or image description' });
    }

    const platformName = platform || 'instagram';
    const charLimit = PLATFORM_LIMITS[platformName] || 2200;
    const lengthPref = captionLength || 'medium';
    const locale = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = parseDataUrl(imageBase64);
    if (imageBase64 && !parsed && !imageDescription) {
      return res.status(400).json({ error: "That image didn't upload correctly — try re-uploading it." });
    }

    // ── STAGE 1 — OBSERVE ─────────────────────────────────────────────
    let envelope;
    if (parsed) {
      const observePrompt = `You are looking at an image for a captioning tool. You are not writing captions. Your only job is to say what is in the picture and what is not knowable from it.

${imageDescription ? `The person also described it: ${imageDescription}` : ''}
${context ? `And gave this context: ${context}` : ''}
Anything the person told you is established fact. It belongs in observed, never in uncertain — you cannot doubt what you were told, only what you are looking at.

OBSERVED is what you could point at: objects, materials, colours, counts, setting, text you can read. Short noun phrases, not sentences. Nothing about cause, purpose, history or feeling.

The test is whether the word names a CAUSE for what you can see. "Bright highlight on the upper surface" is observed; "glowing" is not, because it says the object is producing the light, and a flat picture cannot show you that. The same applies in every language and to every word of that kind in it — lit, wet, warm, heavy, old, handmade, expensive, used. Whether something emits light, what it is made of, how old it is and whether anyone has touched it are never observable from a photograph. If it matters, put the QUESTION in uncertain; never put the answer in observed.

This field is the tool's ground truth. Everything after it is written by someone who cannot see the picture and must take this list as fact, so a cause smuggled in here is not corrected later — it becomes true.

UNCERTAIN is what you can see but cannot identify, where getting it wrong would change a caption. Short noun phrases naming the open question — "countertop material", "whether the sphere emits light" — not sentences about your confidence. Empty array if the image is unambiguous.

PROHIBITED_INFERENCES is what this particular picture invites someone to assume and cannot support. Add only what is specific to this scene; the general ones are already handled.

OUTPUT (JSON only):
{
  "observed": ["short noun phrase", "short noun phrase"],
  "uncertain": ["short noun phrase naming the open question"],
  "prohibited_inferences": ["scene-specific assumption this image invites but cannot support"]
}

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

      const obs = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 1500,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: parsed.media_type, data: parsed.data } },
          { type: 'text', text: withLanguage(observePrompt, userLanguage) + locale },
        ] }],
      }, { label: 'CaptionMagicObserve' });

      if (!Array.isArray(obs.observed)) {
        return res.status(500).json({ error: 'Could not read the image. Please try again.' });
      }
      envelope = {
        observed: obs.observed,
        uncertain: Array.isArray(obs.uncertain) ? obs.uncertain : [],
        prohibited_inferences: [...NEVER_INFERABLE, ...(Array.isArray(obs.prohibited_inferences) ? obs.prohibited_inferences : [])],
      };
    } else {
      // No image: nothing is being interpreted. Every fact came from the person,
      // so it is all observed and nothing is uncertain — asking a model to
      // re-derive that produced the old bug where a fact the visitor supplied
      // got listed as doubtful and then blocked downstream.
      envelope = {
        observed: [imageDescription, context].filter(Boolean),
        uncertain: [],
        prohibited_inferences: [...NEVER_INFERABLE],
      };
    }

    // ── STAGE 2 — GENERATE (no image) ─────────────────────────────────
    const genPrompt = `You are a social media caption specialist who writes captions that sound like a real person, not a brand.

You cannot see the picture. Everything you know about it is below. That is deliberate — write from it and the captions will be true.

${renderEnvelope(envelope)}
${context ? `\nWHAT THEY TOLD US ABOUT THIS PHOTO: ${context}
This is established fact and it is the best material you have — better than anything you can see. A photograph shows you a hat; only they can tell you it was a bad purchase their wife has not stopped mentioning. Use it. Nothing here needs hedging, and captions that use it will beat captions that do not.` : ''}
${avoidMention ? `\nWHAT THEY ASKED FOR: ${avoidMention}
Follow this. If it names something to leave out, leave it out of all six.` : ''}

${platformName === 'none'
  ? `NO PLATFORM: they have not said where this is going — a photo book, a message, a print, somewhere with no conventions of its own. Write captions that stand on their own: no platform-shaped length, no hashtag-bait phrasing, no calls to action about following or commenting. Hashtags are still fine as suggestions, since they may add them later, but nothing in the caption itself should assume a feed.`
  : `PLATFORM: ${platformName} (character limit: ${charLimit})`}
LENGTH PREFERENCE: ${lengthPref} (short = 1-2 lines, medium = 2-4 lines, long = 4-8 lines)

RULES:
- Write like a real person posting to their own feed, not a copywriter
- For ${platformName}, respect the ${charLimit} character limit
- Each caption should feel distinctly different, not just rephrased
- If platform is Twitter/X, keep it tight and punchy
- If platform is LinkedIn, be slightly more polished but never corporate-speak
- Include emojis naturally where they fit the tone, don't force them

FUN IS A REQUIREMENT, NOT A PERMISSION.

This tool exists to make someone smile and hand them a line they would not have
arrived at on their own. A caption that describes the photograph accurately and
does nothing else has failed, however true it is.

At least ONE of the three must take a real creative swing: an absurd premise, a
personification, a joke that runs away with a detail, a voice with an attitude,
a line that surprises. Not a competent description with a wink at the end. The
peculiar specifics in OBSERVED are the funniest thing you have — the odd object,
the wrong scale, the thing nobody would put next to the other thing. Use them.

The envelope is not a reason to be careful. It rules out inventing the
backstory. It rules out nothing about how strange the caption may be.

For HASHTAGS: tags that genuinely fit this post. Do not label any of them trending, high-volume or high-competition — you cannot see what is trending, nobody counted the posts, and a tag presented as trending is a measurement claim.

The voice-versus-fact line applies to tags too, and it cuts finely. A tag stating a fact the picture cannot support is a claim in one word: #sundaymorning assigns a day nobody established, #handmade assigns an author, #vintage assigns an age. A tag that is obviously part of the joke is not: #morningsomewhere claims nothing, because no one reads it as a timestamp. Play in tags where the play reads as play. Never write the leading # — the interface adds it.

SIX CAPTIONS, AND THEY ARE NOT ALL JOKES.

The set is a portfolio, not a comedy routine. Most photographs are ordinary, and
most people posting one want a caption, not a bit. A large outdoor gathering on
a summer evening does not need "the lawn organised this" six times; somebody
just wants "Perfect night to be outside."

WRITE 1, 2 AND 3 FIRST, BEFORE READING THE WORKSHOP SECTION BELOW. They are not
jokes and the workshop is not for them:

1. NATURAL — what an ordinary person would simply post. No joke, no angle, no
   wink, no clever turn, no detached irony. "Perfect night to be outside."
   "Summer nights with good company." If the visitor told you what the occasion
   was, name it plainly: "Another great night at Concerts on the Common." This
   caption is the reason the tool is useful on a day when nothing is funny.
2. WARM — human, affectionate, celebratory. About the people or the moment
   rather than the objects. Fondness without sentimentality, and no punchline.
3. CLEVER — an interesting observation, not a joke. Something true about this
   scene that most people would not have put into words. It can make someone
   nod; it does not have to make them laugh.

NOW THE WORKSHOP, and it is only for captions 4, 5 and 6.

The first joke available about any photograph is the one everybody makes. A wall
of hangers gets "the hangers have unionized" — competent, and the same idea the
last four people had. Comedy is a search, and the good ones sit further out than
the first competent idea.

Push the most striking thing in OBSERVED through these separately. They are
different machines and they produce different jokes:

- MISINTERPRETATION — what else could this plausibly, or absurdly, be?
- UNDERSTATEMENT — describe the ridiculous thing as though it were completely ordinary.
- ESCALATION — take one visible detail to an absurd conclusion.
- SPECIFIC ANALOGY — what unexpectedly familiar thing does this resemble?
- DEADPAN — what would the driest possible observer say about this?
- WORDPLAY — is there a genuinely good linguistic connection here? Do not force one; a bad pun is worse than no pun.
- POV / PERSONIFICATION — let an object speak or act, but only if the premise is actually fresh.
- CONTEXT COLLISION — import the language of an unrelated world: corporate meetings, dating, airports, bureaucracy, true crime, customer service, estate agents, sports commentary.
- LITERALIZATION — take an expression absurdly literally.
- WILD CARD — an angle unlike any of the above.

To see the difference the mechanisms make: given a photograph of one enormous
traffic cone, the first idea is the cone having feelings about its job. The
workshop instead reaches "asked for a cone and they took it personally"
(misinterpretation), "standard issue" (understatement), "at this rate the road
works will finish sometime in the next administration" (escalation), "municipal
Christmas tree" (analogy), "there has been an incident" (deadpan), "someone in
procurement misread a field" (context collision). Six machines, six jokes, and
not one of them is the cone behaving like a person.

THAT IS AN ILLUSTRATION OF SHAPE, NOT A SUPPLY OF LINES. It is about a traffic
cone; your photograph is not. Do not reproduce or adapt any of it — the shape is
what transfers, and the words are already used.

Write 18 to 24 candidates into _candidates. Then throw most of them away.

DISCARD, without sentiment:
- anything merely competent — the joke that works but that anyone would have found
- anything leaning on a familiar meme or template ("POV:", "nobody: / me:", "it's giving", "understood the assignment", "rent free", "the way that…")
- any candidate whose mechanism another surviving candidate already used
- anything that needs explaining, or that explains itself inside the caption

THEN, AMONG WHAT SURVIVES, PREFER THE CAPTION THAT FEELS DISCOVERED IN THIS
PARTICULAR PHOTOGRAPH over one that could have been generated from a list of its
objects. That is the whole difference between "POV: you're a hanger" — which
needs only the word hanger — and "This meeting could have been a closet", which
needs someone to have actually stood in the room. If a caption would still work
with one noun swapped out, it came from the list, not the picture.

FUNNY IS NOT SNARKY. Mockery is the easiest register to reach and the least
interesting one, and there is usually a person in these photographs. Affection,
delight, close observation, absurdity, cleverness and plain joy are all funny,
and a set that only sneers is as narrow as a set that only personifies. Never
make the subject of the photograph the butt of the joke — laugh at the
situation, the objects, the scale of the thing, yourself.

ONE THING THE COMIC LICENCE DOES NOT COVER: denying a real fact. Giving an
object an impossible role invents nothing anybody could believe — the lawn did
not organise the evening and no reader thinks it did. But "nobody organised
this", or the tag #unplanned, says something about the actual event that may
simply be false, and a gathering of hundreds usually had organisers. Absurd
causes are yours. Absent ones are not.

DO NOT EXPLAIN THE JOKE. Prefer the shortest version that keeps it. Specificity
and surprise beat elaboration every time:

  WEAKER: the sourdough starter has developed opinions about my schedule and is expressing them through unpredictable rising times, which i think is a boundary issue we will need to work through together
  BETTER: The starter has opinions about my schedule now.

Same premise, a fifth of the words, twice the joke. Make that edit on every
candidate before it becomes one of the six. The example is about bread on
purpose: it demonstrates trimming, and it is nothing you could hand in.

The three the workshop is for:

4. FUNNY — the best joke it produced. This one is actually trying to be funny.
5. DRY OR WEIRD — a less expected perspective. Flat, strange, or quietly off.
   It does not need a punchline.
6. WILD CARD — permission to surprise us. Allowed to be too much and allowed
   not to work.

THEN READ ALL SIX BACK TOGETHER AND CHECK THE SPREAD.

The failure this set falls into is one comic voice used six times: an ordinary
detail given agency or outsized significance — the coolers organised it, the sky
said no, the trees have been documenting, the lawn decided. Each is fine alone;
five of them is one idea wearing six hats, and captions 1 to 3 have quietly
turned into jokes with the punchline removed.

So: if more than two captions hand agency to an object, rewrite until they do
not. If 1, 2 and 3 have a detached or ironic tone, they are wrong — 1 should be
postable by someone having a nice evening who is not being funny at all. The
range runs from plainly useful to genuinely strange, and both ends have to be
occupied.

These are instructions to you, never labels for the visitor: no register, number
or mechanism appears anywhere in the output. Do not write six versions of one
joke.

OUTPUT (JSON only):
{
  "_candidates": ["18 to 24 one-line candidates from the workshop, across the different mechanisms. Scratch paper: deleted before anyone sees the result, so the weak ones belong here too. A short list means the search did not happen, and the six will be the obvious six."],
  "captions": [
    {
      "text": "The caption. Nothing else — no explanation, no note about what it does, no reason it works.",
      "hashtags": [{ "tag": "hashtag1" }, { "tag": "hashtag2" }, { "tag": "hashtag3" }],
      "char_count": 150
    }
  ],
  "alt_text": "Descriptive accessibility text, built from OBSERVED. A screen-reader user gets this INSTEAD of the picture and has no way to see past a wrong word, so it carries the envelope more strictly than anything else here, not less."
}

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

    const out = await callClaudeWithRetry({
      model: MODELS.FAST,
      // 4000 was sized for six captions. The workshop writes twenty candidates
      // above them — scratch paper, cheap, and the entire point.
      max_tokens: 6000,
      messages: [{ role: 'user', content: withLanguage(genPrompt, userLanguage) + locale }],
    }, { label: 'CaptionMagicGenerate' });

    if (!Array.isArray(out.captions)) {
      return res.status(500).json({ error: 'Could not generate captions. Please try again.' });
    }

    // ── STAGE 3/4 — VALIDATE, THEN REPAIR WHAT FAILED ─────────────────
    // Fail-open throughout. This is a safety net over a working answer, and a
    // net that can drop the answer is worse than no net.
    try {
      await enforceEnvelope(out, envelope, { userLanguage, locale, context });
    } catch (err) {
      console.error('CaptionMagic validation skipped:', err.message);
    }

    // Scratch paper never leaves the building. Logged rather than silently
    // dropped: "generate twenty and keep six" is exactly the kind of invisible
    // instruction that gets quietly ignored, and a count is the only way to
    // know whether the search happened or the model wrote six and moved on.
    const searched = Array.isArray(out._candidates) ? out._candidates.length : 0;
    console.log(`[caption-magic] workshop: ${searched} candidate(s) → 6`);
    delete out._candidates;

    normaliseCaptions(out);

    // The whole envelope travels back. "Six more" and the nudges have to stay
    // grounded in the same observation, and re-reading the image on every nudge
    // would cost a vision call and could drift — the visitor would be playing
    // with a photo the tool kept re-interpreting underneath them.
    res.json({ ...out, envelope });

  } catch (error) {
    console.error('CaptionMagic error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// Every generated string the visitor will see, addressed by a path the
// validator is handed verbatim. Enumerated in code so the validator cannot
// invent a field name and the repair cannot write to one that does not exist.
function checkableFields(out) {
  const fields = [];
  (out.captions || []).forEach((c, i) => {
    if (typeof c?.text === 'string') fields.push([`captions[${i}].text`, c.text]);
    if (Array.isArray(c?.hashtags) && c.hashtags.length) {
      fields.push([`captions[${i}].hashtags`, c.hashtags.map(h => (typeof h === 'object' ? h?.tag : h)).filter(Boolean).join(', ')]);
    }
  });
  if (typeof out.alt_text === 'string') fields.push(['alt_text', out.alt_text]);
  return fields;
}

// Stage 3 and 4. Adversarial by construction: this call is never asked to
// write a caption, only to find propositions the envelope does not support.
// The distinction matters — a model asked to improve its own output rates it
// as fine, and asking the generator to check itself is the instruction we have
// already watched fail four times.
async function enforceEnvelope(out, envelope, { userLanguage, locale, context }) {
  const fields = checkableFields(out);
  if (!fields.length) return;

  const proposed = fields.map(([path, value]) => `${path}: ${value}`).join('\n');
  const supplied = context ? `\nUSER-PROVIDED FACTS (established, always supported):\n${context}\n` : '';

  const validatePrompt = `Caption Magic is a creative-writing tool. You are checking a draft for MISLEADING invention, which is a much narrower thing than untrue invention. You are not writing or improving the draft, and you are not making it more literal.

${renderEnvelope(envelope)}
${supplied}
PROPOSED OUTPUT:
${proposed}

Captions and their hashtags may freely use humour, imagination, metaphor, personification, attitude, rhetorical exaggeration and an invented caption voice. Do not reject creative language merely because the image does not literally establish it.

Reject invention only where a reasonable reader could take it as a concrete claim about the real photograph or its circumstances — identity, relationships, ownership, location, date or time, history, events, activities, provenance, condition, or other consequential facts the visitor did not supply and the image does not establish.

Worked pairs, because this line is the whole job:

  FINE: the cactus remains neutral. the cup knows nothing.
        (personification; nobody reads it as a report on a cactus)
  FINE: me wondering what any of this has to do with anything
        (caption voice; requiring proof the poster wondered it would be absurd)
  FINE: #morningsomewhere
        (the "it's five o'clock somewhere" construction — somewhere is the word
         that voids the claim. It says explicitly that it is NOT asserting when
         this was. A tag naming a time is only a violation when it names THIS
         time: #sundaymorning does, #morningsomewhere refuses to.)

A hashtag is checked one at a time, never as a set. The list is flagged only for
the specific tags that assert something, and a clean tag beside a dirty one is
not evidence against it: #kitchen, #morningsomewhere is a violation of neither.
Flagging the whole list because one tag looked borderline costs the visitor
every other tag with it.
  FINE: some kind of resin, maybe
        (visibly preserves an UNCERTAIN detail)
  FINE: this little guy really said 'i'm not like other spheres'
        (voice; nobody believes the sphere said anything)
  VIOLATION: #sundaymorning
        (assigns a day nobody established, and reads as a fact)
  VIOLATION: nobody organized this  /  #unplanned
        (the mirror image of the personification above, and the line is sharp:
         "the lawn organized this" invents an absurd cause and asserts nothing,
         because lawns do not organize anything. "Nobody organized this" DENIES
         a real one — a gathering of hundreds usually had organisers, and a
         reader comes away believing it did not. A joke that negates a fact is
         still a claim about the world. The comic exemption covers impossible
         causes, never a plausible thing declared absent.)
  VIOLATION: brought this home. it sits in the corner now.
        (playful, but a reader comes away believing the poster has it)
  VIOLATION: it glows a bit
        (whether it emits light is in UNCERTAIN; a light register does not
         make it less of an answer)

The register is not the test. A joke can carry a fact, and a flat sentence can carry none. "Brought this home" is warm and casual and still tells the reader something about the world that may be false; "the cup knows nothing" is a straight declarative sentence about a cup and tells them nothing at all. Ask only what they would believe afterwards.
  VIOLATION: my grandmother gave me this cactus
  VIOLATION: first morning in our new apartment
  VIOLATION: after three hours of repotting this thing
  VIOLATION: she had no idea I was taking this

alt_text is different in kind. It is a description for someone who cannot see the picture, not caption voice, and it gets no creative licence at all: no jokes, no personification, no invented detail. A screen-reader user has no way to see past a wrong word.

WHEN UNCERTAIN, PRESERVE CREATIVITY. The purpose of this check is to prevent misleading fabrication, not to make captions descriptive. A flagged line gets rewritten, so a wrong flag costs the visitor a joke — flag only where an invented detail could genuinely mislead someone about the real circumstances behind the photograph. Silence is the right answer far more often than not.

Return PASS or FAIL. If FAIL, identify the offending fields and the misleading propositions. Do not rewrite them.

OUTPUT (JSON only):
{
  "verdict": "PASS or FAIL",
  "violations": [
    { "field": "exact identifier from the proposed output", "proposition": "the misleading claim, quoted from the field", "why": "what a reader would wrongly believe, in a few words" }
  ]
}

verdict and field are machine identifiers, not prose. Write verdict as the English word PASS or FAIL whatever language the rest of this is in, and copy field character-for-character from the list above — captions[0].text stays captions[0].text. Code compares both literally; a translated one matches nothing and the check is silently lost. proposition and why are prose and may be in any language, since nobody reads them.

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

  // withLanguage applies here like every other call, with verdict and field
  // pinned to English inside the prompt. Leaving it off would have been the
  // other way to protect the enum, but it also puts a German draft in front of
  // an English-reasoning check, and S7.4 exists because that kind of local
  // exception is how a route quietly stops speaking the visitor's language.
  const check = await callClaudeWithRetry({
    model: MODELS.FAST,
    max_tokens: 2000,
    messages: [{ role: 'user', content: withLanguage(validatePrompt, userLanguage) }],
  }, { label: 'CaptionMagicValidate' });

  // One repair per field. The validator sometimes reports two propositions in
  // the same line, and the second replacement would silently overwrite the
  // first — repairing the original text twice rather than the fixed text once.
  const seen = new Set();
  const violations = (Array.isArray(check?.violations) ? check.violations : [])
    .filter(v => v && typeof v.field === 'string' && getByPath(out, v.field) !== undefined)
    .filter(v => !seen.has(v.field) && seen.add(v.field));

  // Logged on every call, not only on failure. A validator that silently stops
  // working looks exactly like a validator finding nothing wrong, and this
  // project has already shipped one audit that passed because it crashed.
  console.log(`[caption-magic] envelope check: ${String(check?.verdict).toUpperCase() === 'FAIL' ? 'FAIL' : 'PASS'} (${violations.length} violation(s)${violations.length ? ': ' + violations.map(v => v.field).join(', ') : ''})`);

  if (String(check?.verdict).toUpperCase() !== 'FAIL' || !violations.length) return;

  // ── STAGE 4 — repair only what failed ───────────────────────────────
  const repairPrompt = `You are repairing specific lines of a social caption draft that made claims the evidence does not support. Everything else has been accepted and is not your concern.

${renderEnvelope(envelope)}
${supplied}
Rewrite each line below so it keeps its voice, tone, length and joke, and drops only the misleading claim. Do not make it cautious, do not add a hedge where the fix is simply to cut three words, and do not replace a specific image with a vague one, and above all do not make it more literal — a line that has lost its joke has not been repaired, it has been damaged. The fix for "my kitchen at 4pm on a sunday" is not "a kitchen": the claim was the possessive and the timestamp, so the invention worth keeping is whatever made the line worth reading. Invent something else in its place if you need to. The line should read as though the claim was never there — not as though it was removed.

Check your replacement before you return it: the unsupported claim must be absent, not softened and not paraphrased. "After three hours of repotting, the light finally did something" repaired to "after three hours of repotting, the light finally showed up" has changed nothing that mattered — the three hours of repotting was the invention, and it is still there. Delete the claim; keep the line.

${violations.map((v, i) => `${i}. [${v.field}]
   current: ${getByPath(out, v.field)}
   unsupported: ${v.proposition}${v.why ? ` (${v.why})` : ''}`).join('\n\n')}

Where the item is alt_text, the replacement is a plain description for someone who cannot see the picture — no joke, no voice, nothing invented.

Return one replacement per numbered item, keyed by its number.
${violations.some(v => v.field.endsWith('.hashtags')) ? 'For a hashtags item, return a comma-separated list of tags with no leading #.\n' : ''}
OUTPUT (JSON only):
{ "fixes": [ { "n": 0, "value": "the rewritten line" } ] }

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

  const repair = await callClaudeWithRetry({
    model: MODELS.FAST,
    max_tokens: 2500,
    messages: [{ role: 'user', content: withLanguage(repairPrompt, userLanguage) + locale }],
  }, { label: 'CaptionMagicRepair' });

  // Keyed by number, not by path: withLanguage translates JSON string values,
  // and a translated field path addresses nothing.
  (Array.isArray(repair?.fixes) ? repair.fixes : []).forEach(fix => {
    const v = violations[Number(fix?.n)];
    if (!v || typeof fix.value !== 'string' || !fix.value.trim()) return;
    if (v.field.endsWith('.hashtags')) {
      // A tag list is repaired per tag, not wholesale. Asked to fix a list
      // containing one bad tag, the model rewrites all of them — which is how
      // #morningsomewhere, a joke that claims nothing, kept dying next to
      // #sundaymorning, which claims a day. Keep every tag the violation did
      // not actually name, and take the model's replacements for the rest.
      const accused = String(v.proposition || '').toLowerCase();
      const kept = (getByPath(out, v.field) || [])
        .map(h => (typeof h === 'object' ? h?.tag : h))
        .filter(tag => tag && !accused.includes(String(tag).toLowerCase()));
      const added = fix.value.split(',').map(x => x.trim().replace(/^#+/, '')).filter(Boolean);
      const merged = [...new Set([...kept, ...added])];
      if (merged.length) setByPath(out, v.field, merged.map(tag => ({ tag })));
      return;
    }
    setByPath(out, v.field, fix.value.trim());
  });
}

// ════════════════════════════════════════════
// REVISE ENDPOINT: Refine a caption
// ════════════════════════════════════════════
router.post('/caption-magic/revise', rateLimit(), async (req, res) => {
  try {
    const { captionText, direction, platform, userLanguage } = req.body;
    if (!captionText) return res.status(400).json({ error: 'Caption text is required' });

    const charLimit = PLATFORM_LIMITS[platform] || 2200;
    const directionMap = {
      'drier': 'Same caption, flatter delivery. Take out whatever is doing the winking — the exclamation, the explanation, the second beat that made sure you got it. Understatement carries this now, and the funniest version should look at first glance like it is not trying.',
      'more_like_this': 'They liked this one. Write another with the same voice, rhythm and kind of joke, about the same picture — a sibling, not a rephrasing. If the original personifies something, personify something else. If it is dry, stay dry. Do not reuse its best phrase.',
      'shorter': `Cut it down. Same joke, fewer words — find the shortest version that still lands, and delete the setup if the punchline can carry itself. Max ${Math.min(charLimit, 280)} characters.`,
      'punch_up': 'Make it funnier. Sharpen the joke, commit harder to whatever premise it already has, or take the odd detail further than it currently goes. Same length, more nerve. If it was merely accurate, it needs an angle now.',
    };

    const instruction = directionMap[direction] || directionMap['punch_up'];
    const basePrompt = `${instruction}

ORIGINAL CAPTION:
"${captionText}"

PLATFORM: ${platform || 'instagram'} (limit: ${charLimit} chars)

Return ONLY a JSON object:
{
  "revised_text": "the revised caption, and nothing else — no note about what you changed"
}

${NO_QUOTE_RULE}

CRITICAL: Return ONLY valid JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(basePrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'CaptionMagicRevise' });
    res.json(parsed);

  } catch (error) {
    console.error('CaptionMagic revise error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════
// ADAPT ENDPOINT: Multi-platform export (#4)
// Takes one caption and adapts it for all platforms
// ════════════════════════════════════════════
router.post('/caption-magic/adapt', rateLimit(), async (req, res) => {
  try {
    const { captionText, hashtags, sourcePlatform, targetPlatforms, userLanguage } = req.body;
    if (!captionText) return res.status(400).json({ error: 'Caption text is required' });

    const targets = Array.isArray(targetPlatforms) && targetPlatforms.length > 0
      ? targetPlatforms
      : Object.keys(PLATFORM_LIMITS).filter(p => p !== sourcePlatform);

    const platformSpecs = targets.map(p =>
      `- ${PLATFORM_NAMES[p] || p}: ${PLATFORM_LIMITS[p] || 2200} char limit`
    ).join('\n');

    const hashtagCtx = Array.isArray(hashtags) && hashtags.length > 0
      ? `\nORIGINAL HASHTAGS: ${hashtags.map(h => typeof h === 'object' ? h.tag : h).join(', ')}`
      : '';

    const basePrompt = `You are a social media expert. Take this caption written for ${PLATFORM_NAMES[sourcePlatform] || sourcePlatform} and adapt it for each target platform.

ORIGINAL CAPTION:
"${captionText}"
${hashtagCtx}

TARGET PLATFORMS:
${platformSpecs}

RULES:
- Each adaptation should feel native to its platform, not just trimmed/padded
- Twitter/X: tight, punchy, max 280 chars. Often drop hashtags or use 1-2 max
- LinkedIn: slightly more polished, can be longer, fewer emojis, 3-5 professional hashtags
- TikTok: conversational, hook-first, trend-aware, include relevant hashtags
- Threads: conversational, medium length, minimal hashtags
- Facebook: can be more personal/narrative, moderate hashtags
- Instagram: emoji-friendly, 5-15 hashtags, can use line breaks for readability
- Adapt hashtags per platform (fewer for Twitter, more niche for LinkedIn, etc.)

OUTPUT (JSON only):
{
  "adaptations": [
    {
      "platform": "twitter",
      "platform_name": "Twitter/X",
      "text": "adapted caption",
      "hashtags": ["tag1", "tag2"],
      "char_count": 120,
      "adaptation_note": "what was changed and why"
    }
  ]
}

${NO_QUOTE_RULE}

CRITICAL: Return ONLY valid JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 3000,
      messages: [{ role: 'user', content: withLanguage(basePrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'CaptionMagicAdapt' });
    res.json(parsed);

  } catch (error) {
    console.error('CaptionMagic adapt error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// ════════════════════════════════════════════
// MORE ENDPOINT: six more, or six in a different direction
// ════════════════════════════════════════════
// Replaces Remix. Remix asked the visitor to select captions, type merge
// instructions and press a button — analysis, dressed as play. This is one tap:
// funnier, weirder, warmer, drier, surprise me, or just six more. The envelope
// comes back from the client so the new six are grounded in the same reading of
// the photograph rather than a fresh one.
const NUDGES = {
  funnier:  'Drop the useful one. All six now compete on comedy alone, and they must use SIX DIFFERENT MECHANISMS from the workshop — six jokes built the same way is one joke told six times. Nobody asked for a caption they could post; they asked to laugh.',
  unhinged: 'Go off the rails. Premises that have no business existing, a voice that has clearly lost the plot, reactions wildly disproportionate to a photograph. The bar for "too much" is gone. Commit — a timid unhinged caption is just a strange one, and half-committing is the only way to fail this.',
  warmer:   'Warmer and more affectionate. Real fondness for whatever is in this picture, without turning sentimental or greeting-card. Warm is not the same as soft: it can still be funny.',
  drier:    'Drier. Flat delivery, understatement, the joke left entirely unremarked. Nothing explains itself, nothing winks, and the funniest one should look at first glance like it is not trying at all.',
  surprise: 'Six angles nobody would predict from this photograph. Not the obvious read, not the second-most obvious. Use six different mechanisms and skip whichever one the last set already used.',
};

router.post('/caption-magic/more', rateLimit(), async (req, res) => {
  try {
    const { envelope, previous, nudge, platform, context, avoidMention, captionLength, userLanguage } = req.body;

    if (!envelope || !Array.isArray(envelope.observed)) {
      return res.status(400).json({ error: 'Missing what the photo showed. Generate captions first.' });
    }

    const platformName = platform || 'instagram';
    const charLimit = PLATFORM_LIMITS[platformName] || 2200;
    const locale = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    const env = {
      observed: envelope.observed,
      uncertain: Array.isArray(envelope.uncertain) ? envelope.uncertain : [],
      prohibited_inferences: Array.isArray(envelope.prohibited_inferences) && envelope.prohibited_inferences.length
        ? envelope.prohibited_inferences
        : [...NEVER_INFERABLE],
    };

    const already = Array.isArray(previous) && previous.length
      ? `\nALREADY WRITTEN — do not repeat these, and do not rephrase them either:\n${previous.map(t => `- ${t}`).join('\n')}\n`
      : '';

    const morePrompt = `You are writing captions for a photograph you cannot see. Everything you know about it is below.

${renderEnvelope(env)}
${context ? `\nWHAT THEY TOLD US ABOUT THIS PHOTO: ${context}\nEstablished fact, and the best material you have. Use it.` : ''}
${avoidMention ? `\nWHAT THEY ASKED FOR: ${avoidMention}\nFollow this.` : ''}
${already}
${nudge && NUDGES[nudge] ? `THE DIRECTION THEY ASKED FOR:\n${NUDGES[nudge]}\n\nThis is the whole point of the request — if the six do not clearly read as ${nudge}, they have failed, and playing it safe is the only way to get this wrong.` : 'Six more, spanning the same range: straightforward, warm, clever, dry, playful, and one wild card that goes somewhere nobody expects.'}

${platformName === 'none' ? 'NO PLATFORM: captions that stand on their own, with nothing that assumes a feed.' : `PLATFORM: ${platformName} (character limit: ${charLimit})`}
LENGTH PREFERENCE: ${captionLength || 'medium'} (short = 1-2 lines, medium = 2-4 lines, long = 4-8 lines)

WORK BEFORE YOU WRITE. The first joke available about any photograph is the one everybody makes. Push the most striking thing here through several different comic machines before choosing anything: MISINTERPRETATION (what else could this be), UNDERSTATEMENT (describe the ridiculous as ordinary), ESCALATION (one detail to an absurd conclusion), SPECIFIC ANALOGY (what unexpectedly familiar thing does it resemble), DEADPAN (the driest possible observer), WORDPLAY (only if genuinely good), POV/PERSONIFICATION (only if the premise is fresh), CONTEXT COLLISION (the language of an unrelated world — corporate meetings, dating, airports, bureaucracy, true crime, customer service), LITERALIZATION (an expression taken absurdly literally), WILD CARD.

Write 18 to 24 candidates into _candidates, then discard anything merely competent, anything built on a familiar meme or template ("POV:", "nobody: / me:", "it's giving"), anything whose mechanism another survivor already used, and anything that needs explaining. Among what is left, prefer the caption that feels DISCOVERED IN THIS PARTICULAR PHOTOGRAPH over one that could have been written from a list of its objects — if swapping one noun would leave it working, it came from the list.

FUNNY IS NOT SNARKY. Mockery is the easiest register and the least interesting, and there is often a person in these photographs. Affection, delight, close observation, absurdity and plain joy are all funny. Never make the subject the butt of the joke.

FUNNY IS NOT THE SAME AS WHIMSICAL. Cute personification, "POV:", mock drama, objects holding meetings — common first ideas. Four of six running the same machine means the search did not happen.

DO NOT EXPLAIN THE JOKE. Shortest version that keeps it — "The starter has opinions about my schedule now." beats the same premise with three more sentences of detail. That example is about bread deliberately: it shows the trim, and it is not a line you could hand in.

Write like a real person posting to their own feed. No explanation of any caption, ever — no note about what it does, no reason it works, no label.

OUTPUT (JSON only):
{
  "_candidates": ["twenty or more one-line candidates across the different mechanisms — scratch paper, deleted before anyone sees it"],
  "captions": [
    { "text": "the caption", "hashtags": [{ "tag": "tag1" }, { "tag": "tag2" }], "char_count": 120 }
  ]
}

Exactly six captions.

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

    const out = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 5500,
      messages: [{ role: 'user', content: withLanguage(morePrompt, userLanguage) + locale }],
    }, { label: 'CaptionMagicMore' });

    if (!Array.isArray(out.captions)) {
      return res.status(500).json({ error: 'Could not write more captions. Please try again.' });
    }

    const searched = Array.isArray(out._candidates) ? out._candidates.length : 0;
    console.log(`[caption-magic] workshop (${nudge || 'more'}): ${searched} candidate(s) → 6`);
    delete out._candidates;

    try {
      await enforceEnvelope(out, env, { userLanguage, locale, context });
    } catch (err) {
      console.error('CaptionMagic validation skipped:', err.message);
    }
    normaliseCaptions(out);

    res.json(out);
  } catch (error) {
    console.error('CaptionMagicMore error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';

// Exposed for the enforcement test: the validator is the one part of this file
// whose failure mode is silence, so it has to be callable without a live image
// and a full generation in front of it.
router._enforceEnvelope = enforceEnvelope;
router._renderEnvelope = renderEnvelope;

module.exports = router;
