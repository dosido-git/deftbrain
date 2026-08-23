const express = require('express');
const router = express.Router();
const { anthropic, callClaudeWithRetry, cleanJsonResponse, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { groundedFacts, groundedData, normalizeKeyPart, stripCites } = require('../lib/groundedFacts');

// ════════════════════════════════════════════════════════════
// BIKE MEDIC V2 — Backend Route
// Three call types: freeform diagnosis, post-fix follow-up, symptom routing
// Supports optional photo attachment for visual diagnosis
// ════════════════════════════════════════════════════════════

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted phrases or part names plainly or with single quotes, or it breaks the JSON.';

// ════════════════════════════════════════════════════════════
// GROUNDING — mechanical facts, never diagnosis
// ════════════════════════════════════════════════════════════
// What the model remembers about torque values, service limits and
// compatibility is exactly the knowledge that is model-specific, revised by
// manufacturers, and dangerous to approximate. This looks those up.
//
// It deliberately does NOT search the rider's symptom. A page saying a worn
// cassette can cause skipping is a fact about cassettes; it is not evidence
// about this bike. Searching the symptom would produce a confident cause with
// a citation attached, which is the failure this tool has spent every previous
// pass removing. Facts in, diagnosis still reasoned, checks still required.
//
// Keyed on component area plus bike setup rather than on the symptom text, so
// the cache actually hits: a few dozen combinations serve everyone, and the
// free-text description never enters the key.
const COLD_WAIT_MS = 25000;
const SPEC_TTL_MS = 30 * 24 * 60 * 60 * 1000; // torque figures and standards move slowly

// Maps a free-text symptom onto the component area whose specifications matter.
const TOPIC_PATTERNS = [
  ['pedals',      /\bpedal|cleat|clipless|crank|bottom bracket|\bbb\b/i],
  ['brakes',      /\bbrake|rotor|caliper|pad|lever|bleed|squeal|stopping\b/i],
  ['drivetrain',  /\bshift|derailleur|gear|cassette|chain|skip|chainring\b/i],
  ['wheels',      /\bwheel|spoke|hub|rim|axle|true|wobble|bearing\b/i],
  ['tires',       /\btire|tyre|tube|tubeless|puncture|flat|sealant|bead|pressure|psi\b/i],
  ['steering',    /\bheadset|steer|handlebar|stem|fork\b/i],
  ['suspension',  /\bsuspension|shock|damper|sag|travel\b/i],
];
function topicFor(text) {
  const t = String(text || '');
  for (const [name, re] of TOPIC_PATTERNS) if (re.test(t)) return name;
  return 'general';
}

function bikeMedicSetup(bikeProfile) {
  const p = bikeProfile || {};
  return [p.bikeType, p.brakeType, p.shiftType, p.tireSetup].filter(Boolean).join(' ') || 'unspecified';
}

function bikeMedicFactsKey({ symptom, bikeProfile }) {
  return `bikemedic:${normalizeKeyPart(topicFor(symptom))}:${normalizeKeyPart(bikeMedicSetup(bikeProfile).slice(0, 60))}`;
}

function bikeMedicFacts({ symptom, bikeProfile }) {
  const topic = topicFor(symptom);
  const setup = bikeMedicSetup(bikeProfile);
  return groundedFacts({
    cacheKey: bikeMedicFactsKey({ symptom, bikeProfile }),
    label: 'bike-medic-facts',
    ttlMs: SPEC_TTL_MS,
    coldWaitMs: COLD_WAIT_MS,
    maxTokens: 2500,
    system: 'You verify bicycle technical specifications with web search. Prefer manufacturer documentation above everything — Shimano tech documents, SRAM service manuals, the component maker\'s own site — then established technical references such as Park Tool. Do not use forums, marketplace listings or general blogs. Report only figures and procedures you actually saw published, with the range where a range is published. Skip anything you cannot confirm; an empty array is a correct answer. Return ONLY valid JSON. Never place a double-quote (") character inside any JSON string value.',
    userPrompt: `Verify with web_search the published technical facts a home mechanic would need when working on the ${topic} of a bicycle described as: ${setup}.

Look for, and report ONLY what you can see published:
(1) manufacturer torque specifications for the fasteners involved, with units;
(2) service limits and wear thresholds that decide replace-or-keep;
(3) compatibility rules or standards that decide whether a part fits;
(4) manufacturer-documented procedures with a specific required order or tool;
(5) any published recall, service bulletin or manufacturer-acknowledged defect for this kind of component.

These are FACTS ABOUT COMPONENTS, not about any particular bike's problem. Do not search for or report what causes any symptom.

Return ONLY valid JSON:
{ "verified": [{ "kind": "torque | service limit | compatibility | procedure | bulletin", "detail": "The published fact, one sentence, with its figure and units", "source": "The domain you saw it on" }] }`,
    render: (clean) => ({ block: renderSpecBlock(clean.verified), data: clean.verified }),
  });
}

function renderSpecBlock(verified) {
  if (!Array.isArray(verified) || !verified.length) return '';
  return `\n\nPUBLISHED SPECIFICATIONS, CHECKED TODAY — these came from manufacturer or technical documentation and you may state them plainly with their source:\n` +
    verified.map(f => `- [${f.kind}] ${f.detail} (source: ${f.source})`).join('\n') +
    `\n\nWhat these are NOT: evidence about this rider's bike. They tell you what a fastener should be torqued to and when a part is worn out — they do not tell you what is wrong here. A published fact that worn cassettes can cause skipping does not make this skipping a worn cassette. Use them to make your checks exact and your instructions correct; the diagnosis is still a candidate the rider has to confirm.`;
}

const MECHANIC_PERSONA = `Expert bicycle mechanic — diagnostic first, prescriptive second. Identify what's wrong before recommending what to do.

Be specific about cause, not just symptom. Give the fix steps in order, flag the safety-critical issues first, and be honest about when it needs a shop.`;

// Helper: build message content with optional photo
function buildMessageContent(textPrompt, photo) {
  if (!photo) return textPrompt;
  // photo is a base64 data URL
  const match = photo.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return textPrompt;
  return [
    { type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } },
    { type: 'text', text: textPrompt },
  ];
}

router.post('/bike-medic', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { symptom, context, mode, bikeProfile, photo } = req.body;

    // ── TYPE 4: Seasonal Maintenance Wizard ──
    if (mode === 'seasonal') {
      if (!bikeProfile) {
        return res.status(400).json({ error: 'Bike profile required for seasonal check' });
      }

      const season = context?.season || 'spring';
      const recentRides = context?.recentRides || [];
      const ridesContext = recentRides.length > 0
        ? `\nRECENT RIDES: ${recentRides.map(r => `${r.distance}mi (${r.conditions})`).join(', ')}`
        : '';

      const seasonalUserPrompt = `You are generating a SEASONAL MAINTENANCE CHECKLIST for a cyclist.

CURRENT SEASON: ${season}
BIKE: ${bikeProfile.name || bikeProfile.bikeType || 'unknown'} — type: ${bikeProfile.bikeType || '?'}, brakes: ${bikeProfile.brakeType || '?'}, shifting: ${bikeProfile.shiftType || '?'}, tires: ${bikeProfile.tireSetup || '?'}
TOTAL MILEAGE: ~${bikeProfile.totalMiles || 0} miles${ridesContext}

Generate a personalized seasonal maintenance checklist. Consider:
- The season and likely weather conditions
- The bike type and components
- The rider's mileage (more miles = more wear)
- Recent riding conditions (wet/muddy rides need more attention)
- What specific tasks are most important for THIS bike RIGHT NOW

ACCURACY RULES: Never assert model-specific component standards (bottom-bracket type/threading, pedal thread direction, torque specs) from memory as fact — state the common standard, note it varies by bike, and tell the rider how to verify. (Reference facts you MAY state: on virtually all bikes the LEFT pedal is reverse-threaded, the right is normal; English/BSA bottom brackets have a reverse-threaded drive-side cup. Chain-wear replacement thresholds: 0.5% for 11/12-speed chains, 0.75% for 10-speed and below.)

Return ONLY valid JSON:
{
  "title": "Concise title naming the season only — NO YEAR (e.g., 'Spring Maintenance Checklist', 'Winter Prep') — 3-6 words",
  "summary": "One-sentence overview of priorities for this season — 1-2 sentences",
  "tasks": [
    {
      "task": "Specific maintenance task — one sentence",
      "reason": "Why this matters right now for this bike — one sentence",
      "priority": "high | medium | low",
      "fix_ref": "fix_id from our fix database or null if no matching guide — one sentence"
    }
  ]
}

Available fix_ref IDs: fix_noise_chainlube, fix_chain_worn, fix_chain_inspect, fix_disc_pad_worn, fix_disc_squeal, fix_brake_inspect, fix_tubeless_refresh, fix_ghost_shift, fix_cable_inspect, fix_headset_loose, fix_headset_gritty, fix_bb_creak, fix_noise_creak, fix_true_wheel, fix_hub_play, fix_clipless, fix_rim_weak

Generate 6-10 tasks, ordered by priority. Be specific to the bike and season. The checklist should be evergreen — do not reference the current year, since it will be reused across years.`;

      const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(MECHANIC_PERSONA, req.body.userLanguage) + ' ' + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: seasonalUserPrompt }],
    }, { label: 'bike-medic/seasonal' });
      if (!parsed.recommended_category && !parsed.title && !parsed.tasks) {
        return res.status(500).json({ error: 'Could not generate bike advice. Please try again.' });
      }
      return res.json(parsed);
    }

    // ── TYPE 4b: Custom Situation Checklist ──
    // Like seasonal, but tailored to a user-described scenario (e.g. "first gravel race",
    // "bike sat in shed all winter"). Returns the same {title, summary, tasks[]} shape.
    if (mode === 'custom_check') {
      const situation = (context?.customSituation || symptom || '').trim();
      if (situation.length < 5) {
        return res.status(400).json({ error: 'Describe your situation in a few words' });
      }

      const bp = bikeProfile || {};
      const recentRides = context?.recentRides || [];
      const ridesContext = recentRides.length > 0
        ? `\nRECENT RIDES: ${recentRides.map(r => `${r.distance}mi (${r.conditions})`).join(', ')}`
        : '';

      const customUserPrompt = `You are generating a TAILORED PRE-RIDE / PREP CHECKLIST for a specific situation a cyclist described.

RIDER'S SITUATION: "${situation}"
BIKE: ${bp.name || bp.bikeType || 'unknown'} — type: ${bp.bikeType || '?'}, brakes: ${bp.brakeType || '?'}, shifting: ${bp.shiftType || '?'}, tires: ${bp.tireSetup || '?'}
TOTAL MILEAGE: ~${bp.totalMiles || 0} miles${ridesContext}

Generate a prioritized checklist specifically for this situation. Focus on what actually matters for THIS scenario — not a generic tune-up. If the situation involves wet/muddy conditions, prioritize drivetrain and brake prep. If it's a long tour, prioritize reliability checks. If it's first ride after storage, prioritize safety verification.

ACCURACY RULES: Never assert model-specific component standards (bottom-bracket type/threading, pedal thread direction, torque specs) from memory as fact — state the common standard, note it varies by bike, and tell the rider how to verify. (Reference facts you MAY state: on virtually all bikes the LEFT pedal is reverse-threaded, the right is normal; English/BSA bottom brackets have a reverse-threaded drive-side cup. Chain-wear replacement thresholds: 0.5% for 11/12-speed chains, 0.75% for 10-speed and below.)

Return ONLY valid JSON:
{
  "title": "Concise title reflecting the situation — 3-6 words",
  "summary": "One-sentence overview of what this checklist addresses — 1-2 sentences",
  "tasks": [
    {
      "task": "Specific, actionable task — one sentence",
      "reason": "Why this matters for THIS situation specifically — one sentence",
      "priority": "high | medium | low",
      "fix_ref": "fix_id from our fix database or null if no matching guide — one sentence"
    }
  ]
}

Available fix_ref IDs: fix_noise_chainlube, fix_chain_worn, fix_chain_inspect, fix_disc_pad_worn, fix_disc_squeal, fix_brake_inspect, fix_tubeless_refresh, fix_ghost_shift, fix_cable_inspect, fix_headset_loose, fix_headset_gritty, fix_bb_creak, fix_noise_creak, fix_true_wheel, fix_hub_play, fix_clipless, fix_rim_weak

Generate 5-10 tasks, ordered by priority. Be specific to the situation and the bike.`;

      const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(MECHANIC_PERSONA, req.body.userLanguage) + ' ' + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: customUserPrompt }],
    }, { label: 'bike-medic/custom_check' });
      if (!parsed.recommended_category && !parsed.title && !parsed.tasks) {
        return res.status(500).json({ error: 'Could not generate bike advice. Please try again.' });
      }
      return res.json(parsed);
    }

    // ── TYPE 3: Symptom Routing ──
    if (mode === 'route') {
      if (!symptom || symptom.trim().length < 5) {
        return res.status(400).json({ error: 'Describe the problem in a few words' });
      }

      const routeUserPrompt = `AVAILABLE PROBLEM CATEGORIES — return the id EXACTLY as written here, in English, never translated and never a near-miss. Anything else is a dead end for the rider:
flat (flat tire / puncture), chain (dropped chain / chain issues), brakes (brake problems), shifting (shifting / derailleur), headset (wobbly handlebars / steering), noise (strange noises), pedal_crank (pedal, crank or bottom bracket), wheel (wheel, spokes or hub), tire_seat (tire will not seat or keeps burping), custom (anything none of the above covers, including suspension, dropper posts and electrical)

RIDER SAYS: "${symptom.trim()}"
${bikeProfile ? `RIDER'S BIKE: ${bikeProfile.bikeType || 'unknown'} with ${bikeProfile.brakeType || 'unknown'} brakes, ${bikeProfile.shiftType || 'unknown'} shifting, ${bikeProfile.tireSetup || 'unknown'} tires` : ''}

Based on this description, which problem category should they start troubleshooting in? Think about probability — what's the MOST LIKELY category, not just one that could match.

ACCURACY RULES: Never assert model-specific component standards (bottom-bracket type/threading, pedal thread direction, torque specs) from memory as fact — state the common standard, note it varies by bike, and tell the rider how to verify. (Reference facts you MAY state: on virtually all bikes the LEFT pedal is reverse-threaded, the right is normal; English/BSA bottom brackets have a reverse-threaded drive-side cup. Chain-wear replacement thresholds: 0.5% for 11/12-speed chains, 0.75% for 10-speed and below.)

Return ONLY valid JSON:
{
  "recommended_category": "One id copied verbatim from the list above. Not a description, not a translation, not a plural. Use custom when nothing fits rather than inventing a category.",
  "reasoning": "Where their description points first, and that it is a starting point rather than a finding — 'What you are describing points first toward the drivetrain. Several things cause skipping under load, so we will narrow it down before recommending a fix.' Calm and plain. Never a percentage, a score, a likelihood or any number: nothing here is measured, and a figure would say otherwise. Never 'strongly indicates', 'clearly points to' or 'almost certainly'. — 1-2 sentences",
  "alternative_categories": ["Second-best id, copied verbatim from the list", "Third-best id, copied verbatim from the list"],
  "suggested_first_question": "A good diagnostic question to ask the rider — one sentence"
}`;

      const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(MECHANIC_PERSONA, req.body.userLanguage) + ' ' + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: routeUserPrompt }],
    }, { label: 'bike-medic/route' });
      if (!parsed.recommended_category && !parsed.title && !parsed.tasks) {
        return res.status(500).json({ error: 'Could not generate bike advice. Please try again.' });
      }
      // Must match PROBLEMS in src/tools/BikeMedic.js. The frontend looks this
      // id up to open the guided path and does nothing at all when it misses,
      // so an id the UI cannot act on never leaves here.
      const CATEGORY_IDS = ['flat', 'chain', 'brakes', 'shifting', 'headset', 'noise', 'pedal_crank', 'wheel', 'tire_seat', 'custom'];
      const ALIASES = { pedals: 'pedal_crank', pedal: 'pedal_crank', crank: 'pedal_crank', bottom_bracket: 'pedal_crank',
                        tubeless: 'tire_seat', tire: 'tire_seat', tyre_seat: 'tire_seat', bead: 'tire_seat',
                        wheels: 'wheel', spokes: 'wheel', hub: 'wheel', brake: 'brakes', gears: 'shifting',
                        drivetrain: 'shifting', derailleur: 'shifting', steering: 'headset', noises: 'noise',
                        puncture: 'flat', flat_tire: 'flat', suspension: 'custom', other: 'custom' };
      const canon = (v) => {
        const k = String(v || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
        return CATEGORY_IDS.includes(k) ? k : (ALIASES[k] || null);
      };
      parsed.recommended_category = canon(parsed.recommended_category) || 'custom';
      parsed.alternative_categories = (parsed.alternative_categories || [])
        .map(canon).filter(Boolean).filter(id => id !== parsed.recommended_category);
      return res.json(parsed);
    }

    // ── Validation for Types 1 & 2 ──
    if (!symptom || symptom.trim().length < 10) {
      return res.status(400).json({
        error: 'Please describe the problem in more detail (at least 10 characters)'
      });
    }

    // Published specs for the component area in question. Empty is fine and
    // common; the missing-specification rule below covers that case.
    const specsKey = bikeMedicFactsKey({ symptom, bikeProfile });
    const specs = await bikeMedicFacts({ symptom, bikeProfile }).catch(() => '');

    let prompt;
    const bikeContext = bikeProfile
      ? `RIDER'S BIKE: ${bikeProfile.bikeType || 'unknown'} with ${bikeProfile.brakeType || 'unknown'} brakes, ${bikeProfile.shiftType || 'unknown'} shifting, ${bikeProfile.tireSetup || 'unknown'} tires`
      : '';
    const photoNote = photo ? '\n\nThe rider has also attached a photo of the problem. Examine the image carefully for visual clues about the issue — wear patterns, alignment, damage, contamination, etc.' : '';

    // ── TYPE 2: Post-Fix Follow-up ──
    if (context && context.fix_attempted) {
      prompt = withLanguage(`${MECHANIC_PERSONA}

SITUATION: The rider already attempted a standard fix and it DIDN'T WORK. They need you to think deeper — beyond the obvious causes.

FIX THEY ATTEMPTED: "${context.fix_attempted}"
PROBLEM CATEGORY: ${context.problem_category || 'unknown'}
TREE PATH TAKEN: ${context.tree_path ? context.tree_path.join(' > ') : 'unknown'}
${context.steps_completed ? `STEPS THEY COMPLETED:\n${context.steps_completed.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : ''}

WHAT THE RIDER SAYS NOW: "${symptom.trim()}"
${bikeContext}${photoNote}

IMPORTANT: The obvious fix has been tried. Think about LESS COMMON causes:
- Is there a related component that could be the real culprit?
- Could the symptom have a different root cause than assumed?
- Is there a setup or installation error in what they already did?
- Does the bike need a different tool or technique than the standard approach?
- Should they go to a shop for this?

ACCURACY RULES: Never assert model-specific component standards (bottom-bracket type/threading, pedal thread direction, torque specs) from memory as fact — state the common standard, note it varies by bike, and tell the rider how to verify. (Reference facts you MAY state: on virtually all bikes the LEFT pedal is reverse-threaded, the right is normal; English/BSA bottom brackets have a reverse-threaded drive-side cup. Chain-wear replacement thresholds: 0.5% for 11/12-speed chains, 0.75% for 10-speed and below.)

${specs}

WHERE A SPECIFICATION IS MISSING, SAY IT IS MISSING. If there is no checked figure above for a torque value, a service limit or a compatibility rule this repair actually turns on, do not supply one from memory and do not round to something plausible. Name the figure you could not verify, say where it lives — the component maker's own documentation, or the marking on the part itself — and where the fastener is safety-relevant, say a shop can set it. An improvised torque figure on a part that holds a rider to a moving bicycle is the worst thing this tool can print.

A SYMPTOM SUGGESTS; IT DOES NOT PROVE. Never write a symptom and a cause as an equation or a certainty — no "clicking under load = loose bottom bracket", no "that noise means the hub", no "#1 cause", no share-of-cases figure. Several things produce the same noise, the same play and the same bad shift, which is the entire reason this tool exists.
Write it as a candidate plus the check that would settle it: "clicking under load points first at the pedals — back one out and retighten it, and if the click survives that, move to the crank." Now the rider can tell which it is instead of taking your word.
An equation is only honest AFTER a check establishes it. "Twelve links measuring over 12 and an eighth inches means the chain is worn" is fine, because something was measured. "Weak braking means cable stretch" is not, because nothing was.

SEQUENCE, AND WHY IT IS THIS ORDER: what they are seeing, then what is safe to check, then what is likely causing it, then whether this bike is safe to ride right now, then how to fix it, then when to stop and use a shop. The stop-riding decision comes BEFORE the repair steps, always — a rider who should not be riding needs to know that before they read a procedure, not in a note underneath one.
When the problem touches brakes, wheels, spokes, hubs, axles, the headset, the crank or a tire that is not seated, ride_safe is false unless you have a specific reason otherwise, and the explanation opens by saying so. These parts do not degrade politely; they fail at once.
A shop is a good answer, not a failure of this tool. Say plainly when a job is past a home fix, and describe difficulty honestly rather than encouragingly.

Return ONLY valid JSON:
{
  "diagnosis": "What's most likely wrong (different from what they already tried). Name it as the leading candidate, not a settled finding. Nothing else.",
  "severity": "low | moderate | critical",
  "ride_safe": true/false,
  "explanation": "2-3 sentences explaining why the first fix didn't work and what the real issue likely is",
  "likely_causes": ["The deeper candidate to check first, and the check that would confirm or rule it out", "Second candidate, with its check", "Third candidate, with its check"],
  "fix_steps": ["Step 1 with specific detail", "Step 2 etc."],
  "tools_needed": ["Specific tools with sizes"],
  "difficulty": "easy | moderate | advanced | shop-only",
  "time_estimate": "estimate — one sentence",
  "parts_cost": "Cost estimate for any parts in the user's local currency, or note if it's an adjustment with no parts needed — one sentence",
  "pro_tip": "Insider tip for this specific deeper issue — one sentence",
  "shop_visit": "When to give up DIY and go to a shop (or null if fully DIY-able) — one sentence",
  "prevention": "How to prevent this in the future — one sentence",
  "next_steps": ["Prioritized action 1", "Action 2", "Action 3"],
  "related_issues": ["Other things to check while they're at it"]
}`, req.body.userLanguage);

    } else {
      // ── TYPE 1: Freeform Diagnosis ──
      prompt = withLanguage(`${MECHANIC_PERSONA}

RIDER'S DESCRIPTION: "${symptom.trim()}"
${bikeContext}${photoNote}

Diagnose the most likely cause and provide a clear, step-by-step fix. Start with the most common/probable cause, not the most dramatic one.

ACCURACY RULES: Never assert model-specific component standards (bottom-bracket type/threading, pedal thread direction, torque specs) from memory as fact — state the common standard, note it varies by bike, and tell the rider how to verify. (Reference facts you MAY state: on virtually all bikes the LEFT pedal is reverse-threaded, the right is normal; English/BSA bottom brackets have a reverse-threaded drive-side cup. Chain-wear replacement thresholds: 0.5% for 11/12-speed chains, 0.75% for 10-speed and below.)

${specs}

WHERE A SPECIFICATION IS MISSING, SAY IT IS MISSING. If there is no checked figure above for a torque value, a service limit or a compatibility rule this repair actually turns on, do not supply one from memory and do not round to something plausible. Name the figure you could not verify, say where it lives — the component maker's own documentation, or the marking on the part itself — and where the fastener is safety-relevant, say a shop can set it. An improvised torque figure on a part that holds a rider to a moving bicycle is the worst thing this tool can print.

A SYMPTOM SUGGESTS; IT DOES NOT PROVE. Never write a symptom and a cause as an equation or a certainty — no "clicking under load = loose bottom bracket", no "that noise means the hub", no "#1 cause", no share-of-cases figure. Several things produce the same noise, the same play and the same bad shift, which is the entire reason this tool exists.
Write it as a candidate plus the check that would settle it: "clicking under load points first at the pedals — back one out and retighten it, and if the click survives that, move to the crank." Now the rider can tell which it is instead of taking your word.
An equation is only honest AFTER a check establishes it. "Twelve links measuring over 12 and an eighth inches means the chain is worn" is fine, because something was measured. "Weak braking means cable stretch" is not, because nothing was.

SEQUENCE, AND WHY IT IS THIS ORDER: what they are seeing, then what is safe to check, then what is likely causing it, then whether this bike is safe to ride right now, then how to fix it, then when to stop and use a shop. The stop-riding decision comes BEFORE the repair steps, always — a rider who should not be riding needs to know that before they read a procedure, not in a note underneath one.
When the problem touches brakes, wheels, spokes, hubs, axles, the headset, the crank or a tire that is not seated, ride_safe is false unless you have a specific reason otherwise, and the explanation opens by saying so. These parts do not degrade politely; they fail at once.
A shop is a good answer, not a failure of this tool. Say plainly when a job is past a home fix, and describe difficulty honestly rather than encouragingly.

Return ONLY valid JSON:
{
  "diagnosis": "Short, clear name for the problem. Nothing else.",
  "severity": "low | moderate | critical",
  "ride_safe": true/false,
  "explanation": "2-3 sentence plain-English explanation of what's happening mechanically",
  "likely_causes": ["The candidate to check first, and the check that would confirm or rule it out", "Second candidate, with its check", "Third candidate, with its check"],
  "fix_steps": ["Step 1 with specific detail and tool sizes", "Step 2", "Step 3", "Final verification"],
  "tools_needed": ["Specific tool with size"],
  "difficulty": "easy | moderate | advanced | shop-only",
  "time_estimate": "5-10 min (or similar) — one sentence",
  "parts_cost": "Cost estimate for any parts in the user's local currency, or note if no parts are needed (adjustment only) — one sentence",
  "pro_tip": "One insider tip that saves time, money, or prevents recurrence — one sentence",
  "shop_visit": "When to take to a shop (or null if fully DIY-able) — one sentence",
  "prevention": "How to prevent this in the future (1-2 sentences)",
  "next_steps": ["Prioritized action 1", "Action 2 if that doesn't work", "Action 3 / shop fallback"],
  "related_issues": ["Other things to check while you're at it"]
}

ACCURACY RULES: Never assert model-specific component standards (bottom-bracket type/threading, pedal thread direction, torque specs) from memory as fact — state the common standard, note it varies by bike, and tell the rider how to verify. (Reference facts you MAY state: on virtually all bikes the LEFT pedal is reverse-threaded, the right is normal; English/BSA bottom brackets have a reverse-threaded drive-side cup. Chain-wear replacement thresholds: 0.5% for 11/12-speed chains, 0.75% for 10-speed and below.)

Return ONLY valid JSON. No markdown, no explanation outside the JSON.`, req.body.userLanguage);
    }

    // Cost estimates follow the rider's region/currency, not USD. Appended to the
    // prompt (Types 1 & 2 have no separate system field) so parts_cost is localized.
    prompt += withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    // Types 1 & 2 have no system field — the no-quote rule rides on the user prompt.
    prompt += '\n\n' + NO_QUOTE_RULE;

    // ── Types 1 & 2: Freeform Diagnosis + Post-Fix Follow-up ──
    // NOTE: These use anthropic.messages.create directly (not callClaudeWithRetry) because
    // the photo attachment path requires a multipart content array (image + text blocks).
    // callClaudeWithRetry accepts a string prompt only. Refactor once lib supports multipart.
    const messageContent = buildMessageContent(prompt, photo);

    let message;
    for (let _att = 1; _att <= 3; _att++) {
      try {
        message = await anthropic.messages.create({
          model: MODELS.SMART,
          max_tokens: 4000,
          messages: [{ role: 'user', content: messageContent }]
        });
        break;
      } catch (_e) {
        if (_att === 3) throw _e;
        await new Promise(r => setTimeout(r, 1000 * _att));
      }
    }

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(textContent));

    if (!parsed.diagnosis && !parsed.title && !parsed.tasks) {
      return res.status(500).json({ error: 'Could not generate bike advice. Please try again.' });
    }
    // Only what this answer actually saw, stripped where it leaves the server.
    parsed.verified_specs = specs ? (stripCites(groundedData(specsKey)) || null) : null;
    res.json(parsed);

  } catch (error) {
    console.error('Bike Medic error:', error);
    res.status(500).json({
      error: 'Something went wrong. Please try again.'
    });
  }
});

module.exports = router;
