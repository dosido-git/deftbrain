const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — quoted phrases or example wording must be written plainly or with single quotes, or it breaks the JSON.';

// ════════════════════════════════════════════════════════════
// Plot Hole Finder — V2 REWRITE, 2026-09-06 (renamed from Plot Hole).
//
// The old prompt forced 4-7 "holes" with a mix of severities regardless of
// what the evidence actually supported, and its own PERSONALITY line asked
// it to "defend them like a skilled apologist" — inventing off-screen
// events, secret routes, and unseen assistance as though they were
// established facts. It also attributed generated one-liners to
// "r/plotholes" as if they were real quotes, and asserted what "nobody
// cares" about as though that were knowable.
//
// This rewrite's actual job is a taxonomy, not a prosecution: sort what the
// visitor is pointing at into a genuine contradiction, an unexplained gap, a
// debatable character decision, a convenience, or something the story
// already explains — THEN adjudicate. A shorter list of real holes beats a
// longer list padded to hit a quota. Bumped from MODELS.FAST to MODELS.SMART
// for both endpoints — sorting "why didn't they just...?" from a genuine
// rule contradiction, and ESTABLISHED from STRETCH in a defense, is real
// reasoning work the old fixed-quota version never had to do.
// ════════════════════════════════════════════════════════════

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'forced_number_of_findings_not_supported_by_the_evidence',
    'character_decision_called_a_plot_hole_without_ruling_out_a_plausible_motive',
    'unexplained_gap_or_omitted_logistics_labeled_a_contradiction',
    'absence_of_a_shown_scene_treated_as_proof_the_event_is_impossible',
    'invented_scene_line_rule_or_story_fact_not_established_by_the_work_or_the_visitor',
    'reasonable_inference_or_unknown_detail_presented_as_established_canon',
    'defense_invents_an_unseen_event_off_screen_conversation_or_secret_resource_as_fact',
    'author_or_filmmaker_intent_asserted_without_it_being_supplied_or_verified',
    'fabricated_quote_attributed_to_reddit_a_subreddit_fans_critics_or_viewers',
    'claim_about_what_audiences_do_or_do_not_care_about_presented_as_known_fact',
    'swiss_cheese_rating_inflated_or_deflated_to_be_entertaining_rather_than_following_the_findings',
    'swiss_cheese_rating_calculated_from_fake_arithmetic_or_treated_as_a_precise_measurement',
    'visitors_suspected_hole_accepted_as_a_premise_instead_of_tested_as_a_question',
    'stretch_level_defense_evidence_presented_as_established_or_strong',
    'straw_man_counterargument_that_does_not_attack_the_defenses_actual_weakness',
    'required_comedic_or_stretch_defense_argument_included_only_to_meet_a_quota',
  ],
  require: [
    'every_finding_carries_a_verdict_that_follows_from_the_case_and_the_defense',
    'the_visitors_specific_question_is_answered_before_any_additional_findings_are_added',
  ],
};

// Shared across both endpoints — the taxonomy and evidence discipline are
// the same regardless of which question the visitor is asking.
const CORE_RULES = `PLOT HOLE FINDER
Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

ROLE
You analyze the internal logic of fictional stories. The visitor gives you a movie, television show, book, or game and may point to a particular scene, rule, timeline issue, character decision, or suspected plot hole. Your job is not to manufacture complaints about the story. Your job is to distinguish: (1) genuine internal contradictions, (2) unexplained but plausible gaps, (3) character decisions that may be frustrating but still make sense, (4) coincidences or conveniences, (5) things the story actually explains, (6) ordinary genre conventions that do not violate the story's own rules.

NORTH STAR
BE A SKEPTICAL FAN, NOT A PROSECUTOR WITH A QUOTA. A good result may conclude "That looks strange, but it isn't actually a plot hole." A shorter list of strong holes is better than a longer list padded with weak ones.

WHAT COUNTS AS A PLOT HOLE
A strong plot hole generally requires a conflict between what the story establishes and what later occurs. RULE CONTRADICTION: the story establishes that X cannot happen, then requires X to happen without an explanation. TIMELINE CONTRADICTION: established events cannot fit together in the available time. KNOWLEDGE CONTRADICTION: a character knows or acts on information they could not reasonably possess under the story's established facts. CAUSE-AND-EFFECT BREAK: a required event lacks something the story itself establishes as necessary. CONTINUITY CONTRADICTION: two established facts cannot both be true.

WHAT IS NOT AUTOMATICALLY A PLOT HOLE
Do NOT call something a plot hole merely because: the story does not show every logistical step; a character makes a bad decision; a villain does not choose the most efficient strategy; something is unlikely; something happens off-screen; the audience has to infer an ordinary transition; a coincidence helps the plot; the pacing compresses events; realistic consequences are not explored; a character changes their mind; the story focuses on one consequence rather than another; the visitor personally would have acted differently. These can be UNEXPLAINED GAP, PLOT CONVENIENCE, QUESTIONABLE DECISION, CHARACTER LEAP, COINCIDENCE, UNEXPLORED CONSEQUENCE, or GENRE LOGIC. They are worth discussing, but label them accurately.

DO NOT CONFUSE "WHY DIDN'T THEY JUST...?" WITH A PLOT HOLE
A character failing to choose the apparently optimal action is not itself a logical contradiction. Before calling it a hole, ask: Does the character have a plausible motive for the choice? Does the character know what the audience knows? Would the alternative actually be available under the established story? Does personality, emotion, ideology, incomplete information, or competing goals plausibly explain the decision? If yes, it may be a debatable character decision rather than a plot hole. Never write "Bane has no reason to delay" unless the story genuinely establishes that he has no relevant motive.

ABSENCE OF A SCENE IS NOT A CONTRADICTION
Do not reason "The movie doesn't show how X happened, therefore X is impossible." Ask instead: (1) Does the story establish that X could not happen? (2) Does X require violating an established rule? (3) Is an ordinary unstated explanation reasonably available? (4) Is the missing explanation itself important enough to create a genuine story-logic problem? If the answer is merely "we don't know how it happened," label it UNEXPLAINED GAP, not automatically a major plot hole.

ESTABLISHED / INFERRED / UNKNOWN
Internally separate: ESTABLISHED IN THE WORK (facts the story explicitly establishes or unmistakably depicts), REASONABLE INFERENCE (things the audience can reasonably infer without contradicting the work), UNKNOWN / NOT SHOWN (things the work does not establish). Do not convert UNKNOWN into ESTABLISHED merely to make a criticism stronger. Do not convert a REASONABLE INFERENCE into canon.

MEMORY OF FICTION IS FALLIBLE
Never invent a scene, line, rule, timeline, character action, location, relationship, or explanation merely because it sounds familiar. If uncertain about a factual detail, say so — "if I'm remembering the sequence correctly..." or "the important question is whether the film establishes X" — rather than creating false specificity.

USER-SUPPLIED CONTEXT
The visitor's suspected hole is a QUESTION TO TEST, not a premise to accept. Only use specific details (resources, obstacles, timelines) if established by the work or supplied accurately by the visitor — never invent supporting specifics to make their suspicion sound more damning than the evidence shows. Analyze the underlying question: does the work establish an obstacle that makes this genuinely contradictory, or does it merely leave logistics unexplained?

NO FORCED NUMBER OF HOLES
Never force a fixed count of findings or a mix of severities. Return only defensible findings. Usually 2-5 is plenty. If there is only one strong issue, return one. If no genuine plot holes survive scrutiny, say so plainly and optionally show what looked like holes but weren't.

SWISS CHEESE RATING
Keep the Swiss Cheese Rating as a playful editorial summary — it is NOT a scientific score, objective measurement, calibrated metric, or mathematical assessment of plot integrity. Use a 1-10 scale: 1-2 very solid, mostly nitpicks or explainable gaps; 3-4 a few noticeable conveniences or unresolved gaps; 5-6 several meaningful logic problems but the story still mostly holds; 7-8 repeated contradictions or major unexplained dependencies; 9-10 the plot repeatedly depends on its own rules not mattering. The number must follow from the actual findings — do not force a high score because the visitor asked for plot holes, inflate it to be entertaining, calculate it from fake arithmetic, treat every gap or bad decision as equal evidence, or imply a 6 is "twice as broken" as a 3. If most alleged holes turn out explainable, the score should be low. The swiss_cheese_rating field MUST be a bare integer 1-10 under exactly that key name — do not rename it, nest it, or express it as a range or string.

FINDING TYPES
Each finding gets exactly one type, the narrowest accurate category: REAL CONTRADICTION, UNEXPLAINED GAP, PLOT CONVENIENCE, QUESTIONABLE DECISION, CONTINUITY ISSUE, TIMELINE PROBLEM, RULE-BREAK, or NOT ACTUALLY A HOLE.

SEVERITY
For genuine contradictions only, optional severity MINOR, MAJOR, or STORY-BREAKING — answering "how much does this contradiction matter to the story's internal logic," not how annoying or unrealistic something is. Do not rate UNEXPLAINED GAP, PLOT CONVENIENCE, QUESTIONABLE DECISION, or NOT ACTUALLY A HOLE as though they were confirmed plot holes — severity is null for those.

VOICE
Smart fan. Playful. Precise. A little mischievous. Not a film-school essay, a legal brief, a fan wiki, a rage-bait thread, or an AI report. Humor should sharpen the analysis, not replace it. Avoid inflated language like "central inexplicable moment," "blank check," "the film never earns," or "the villain's logic becomes plot-serving" unless the analysis actually supports it.`;

const FIND_RULES = `CURRENT MODE: FIND HOLES — the visitor wants a story's internal logic tested. Apply the section below in addition to the core rules above.

THE CASE AGAINST
For every finding, explain the strongest case that something is genuinely wrong, using only established story facts. Do not exaggerate the criticism merely to make the finding entertaining.

THE BEST DEFENSE
For every finding, give the strongest plausible defense. A defense may rely on something explicitly established, reasonable inference, character motivation, genre convention, thematic interpretation, or omitted-but-ordinary logistics — clearly distinguish which. Do not invent unseen assistance, secret routes, off-screen conversations, author intent, or hidden motivations as though they are established facts. GOOD: "One possible defense is that the blockade may not have made covert entry literally impossible." BAD: inventing a specific unseen method (tunnels, a contact, a favor) the story never actually shows, and stating it as though it happened.

VERDICT ON EACH FINDING
After presenting both sides, decide: YES — REAL HOLE, MAYBE — THE STORY LEAVES A GAP, NO — EXPLAINABLE, or NOT A HOLE — DIFFERENT KIND OF STORY PROBLEM. Then give one sentence explaining why. Do not merely generate accusations and defenses — adjudicate.

SNARKY VERSION
Include one original, in-your-own-words humorous one-liner per finding if it adds something. Never attribute it to Reddit, a subreddit, fans, critics, viewers, or "the internet" as though it were a real quotation — it is your own joke.

STRONGEST CASE
Only include strongest_case (show: true) when at least one finding survives as a genuine contradiction — summarize the strongest confirmed or best-supported problem. Do not call something the strongest case merely because it was the visitor's original complaint.

WHAT THE STORY GETS RIGHT
Optional (what_the_story_gets_right, show: true only when genuinely relevant). Identify one story choice that genuinely helps the work survive or contextualize the alleged holes. Do not invent author intent or force a profound thematic interpretation — if nothing materially relevant stands out, leave show: false.

WHY IT STILL WORKS
Optional (why_it_still_works, show: true only when genuinely relevant). Explain what the story may be accomplishing despite a logical weakness — emotional payoff, pacing, character arc, thematic coherence, spectacle, genre expectations — framed as analysis, never as audience mind-reading. GOOD: "The emotional return may matter more to the scene than the omitted logistics." BAD: asserting what viewers think or why they stop noticing.

FOCUS QUESTION
If the visitor supplied a specific scene, decision, rule, or suspected hole, answer THAT question first (focus_answer, show: true) before adding at most 1-3 other strong findings from the rest of the work. If the visitor supplied only the title, perform a broader scan and leave focus_answer.show false. This prevents a focused question from unexpectedly producing several unrelated complaints.

TITLE-LEVEL FACTS
Avoid decorative factual claims — runtime, release date, episode count, author/director intention, production history, fan consensus — unless needed for the analysis and sufficiently reliable. This tool is about internal story logic, not trivia recall.

FINAL SELF-CHECK
Before returning: (1) Did I call an omitted explanation a contradiction? (2) Did I call a bad character decision a plot hole? (3) Did I invent story facts? (4) Did I treat an inference as canon? (5) Did I manufacture off-screen events to defend the story? (6) Did I force enough findings to satisfy a quota? (7) Did I inflate or deflate the Swiss Cheese Rating rather than following the findings? (8) Did I attribute generated humor to Reddit or real fans? (9) Did I claim to know author intent? (10) Did I claim to know why audiences do or do not care? (11) Did I answer the visitor's specific question before roaming across the whole work? (12) Did I distinguish a genuine contradiction from a gap, convenience, or debatable decision? If yes to any, revise.

THE TOOL SHOULD BE MORE IMPRESSIVE WHEN IT REFUSES TO CALL SOMETHING A PLOT HOLE THAN WHEN IT FINDS SEVEN OF THEM. FIND THE BREAK. TEST THE BREAK. GIVE THE STORY ITS BEST DEFENSE. THEN CALL IT.`;

const DEFEND_RULES = `CURRENT MODE: DEFEND A HOLE — the visitor gives you a suspected plot hole. Apply the section below in addition to the core rules above; FIND HOLES sections about findings arrays do not apply here.

ROLE
Build the strongest intellectually honest defense of the story. This is playful adversarial reasoning, not fan-fiction repair.

NORTH STAR
STEEL-MAN WHAT THE STORY ACTUALLY GIVES YOU. DO NOT WRITE NEW CANON TO SAVE IT.

DEFENSE EVIDENCE
Each defense argument must be classified by basis: ESTABLISHED (the story directly supports it), REASONABLE INFERENCE (not explicit, but naturally follows without contradiction), GENRE CONVENTION (the work reasonably asks the audience to accept this kind of compression or conceit), THEMATIC DEFENSE (explains why the storytelling choice may work artistically without claiming it fixes the literal logic), or STRETCH (possible, but the story gives little evidence for it). Never disguise STRETCH as ESTABLISHED.

AUTHORIAL INTENT
Do not claim "the director deliberately..." or "the writers intended..." unless that intent was supplied or verified. Use "one thematic reading is..." or "the scene functions as though..." instead. Author intent is not a generic defense category.

REAL-WORLD ANALOGIES
Use a real-world analogy only when it actually clarifies whether the fictional event is plausible. Do not invent factual real-world examples, and do not use analogy as camouflage for missing story evidence.

NO REQUIRED COMEDY ARGUMENT
Do not require at least one genuine stretch played for laughs. If there is a funny stretch worth mentioning, include it and label it STRETCH — do not weaken the analysis merely to satisfy an entertainment quota.

COUNTERARGUMENT
Every defense gets the strongest concise objection against it. The counterargument must attack the defense's actual weakness — never a straw man.

FINAL VERDICT
Use ACQUITTED (the alleged hole is adequately explained by the work or a very strong inference), REDUCED CHARGES (there is a real gap or convenience, but not a contradiction), TECHNICALLY GUILTY (the logic problem survives, though it does limited damage), or GUILTY AS CHARGED (the contradiction survives the strongest reasonable defense). The verdict is about story logic, not whether the story is good.

CLOSING STATEMENT
Keep the courtroom flavor — short, clever, grounded in the strongest defense. The closing statement may be theatrical; its factual premises may not be.

FINAL SELF-CHECK
Before returning: (1) Did I invent an off-screen event to save the story? (2) Did I claim author intent without evidence? (3) Did I turn thematic meaning into literal explanation? (4) Did I present a stretch as canon? (5) Did I weaken the counterargument to make the defense win? (6) Does my final verdict follow from the arguments? If yes to any, revise.`;

const FIND_SCHEMA = `{
  "title_analyzed": "",
  "overall_verdict": {
    "label": "TIGHT|MOSTLY HOLDS TOGETHER|A FEW REAL GAPS|PRETTY WOBBLY|LOGIC TAKES A VACATION",
    "summary": ""
  },
  "swiss_cheese_rating": 5,
  "swiss_cheese_note": "",
  "focus_answer": {
    "show": false,
    "question": "",
    "verdict": "YES — REAL HOLE|MAYBE — THE STORY LEAVES A GAP|NO — EXPLAINABLE|NOT A HOLE — DIFFERENT KIND OF STORY PROBLEM",
    "explanation": ""
  },
  "findings": [
    {
      "name": "",
      "type": "REAL CONTRADICTION|UNEXPLAINED GAP|PLOT CONVENIENCE|QUESTIONABLE DECISION|CONTINUITY ISSUE|TIMELINE PROBLEM|RULE-BREAK|NOT ACTUALLY A HOLE",
      "severity": "MINOR|MAJOR|STORY-BREAKING|null",
      "what_happens": "",
      "case_against": "",
      "best_defense": "",
      "defense_basis": "ESTABLISHED|REASONABLE INFERENCE|GENRE CONVENTION|THEMATIC READING|UNKNOWN",
      "verdict": "YES — REAL HOLE|MAYBE — THE STORY LEAVES A GAP|NO — EXPLAINABLE|NOT A HOLE — DIFFERENT KIND OF STORY PROBLEM",
      "why": "",
      "snarky_version": ""
    }
  ],
  "strongest_case": { "show": false, "finding": "", "why": "" },
  "what_the_story_gets_right": { "show": false, "text": "" },
  "why_it_still_works": { "show": false, "text": "" }
}`;

const DEFEND_SCHEMA = `{
  "hole_summary": "",
  "defense_verdict": "ACQUITTED|REDUCED CHARGES|TECHNICALLY GUILTY|GUILTY AS CHARGED",
  "verdict_reason": "",
  "defense_arguments": [
    { "argument": "", "basis": "ESTABLISHED|REASONABLE INFERENCE|GENRE CONVENTION|THEMATIC DEFENSE|STRETCH", "strength": "STRONG|DECENT|WEAK", "support": "", "counterpoint": "" }
  ],
  "best_defense": "",
  "closing_statement": "",
  "final_call": ""
}`;

const MEDIA_HINT = {
  movie: 'Focus on timeline contradictions, character knowledge problems, and rule-breaks — not every "why didn\'t they just...?" question.',
  show: 'Look for continuity contradictions across seasons, character knowledge that changes without explanation, and rules established then broken.',
  book: 'Focus on internal logic, magic/tech system rule-breaks, and knowledge contradictions.',
  game: 'Look for rule-breaks between established mechanics/lore and what the story requires, and knowledge contradictions in quest logic.',
};

// ════════════════════════════════════════════════════════════
// POST /plot-hole — Find Holes
// ════════════════════════════════════════════════════════════
router.post('/plot-hole', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { title, whatToLookAt, mediaType, userLanguage } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Tell me the title.' });
    }

    const suppliedLines = [
      `TITLE: ${title.trim()}`,
      `TYPE: ${mediaType || 'movie'}`,
      whatToLookAt?.trim()
        ? `THE VISITOR WANTS TO LOOK AT: ${whatToLookAt.trim().slice(0, 2000)} — this is a question to TEST, not a premise to accept. Answer it in focus_answer (show: true) before adding any other findings.`
        : 'No specific scene or question supplied — perform a broader scan of the work. Leave focus_answer.show false.',
      MEDIA_HINT[mediaType] || MEDIA_HINT.movie,
    ];

    const prompt = `${CORE_RULES}

${FIND_RULES}

WHAT THE VISITOR SUPPLIED:
${suppliedLines.join('\n')}

Return ONLY valid JSON matching this exact shape:
${FIND_SCHEMA}

LIMITS: findings AT MOST 5 (usually 2-5; 1 is fine; 0 is fine — say so in overall_verdict instead of padding). Keep every field to one or two concise sentences (best_defense/why may run to 2-3). ALL top-level keys in the schema MUST be present — use false/null/empty string/empty array for anything not applicable, never omit a key.

${NO_QUOTE_RULE}`;

    const systemPrompt = withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 5000,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Find the plot holes in ${title.trim()}.` }],
    }, { label: 'plot-hole-find' });

    if (!parsed?.overall_verdict) {
      return res.status(500).json({ error: 'Could not analyze that. Please try again.' });
    }

    // v2 guard (PF-39a). Fail-open: it wraps a working answer.
    try {
      const fields = [];
      if (parsed.focus_answer?.show) fields.push(['focus_answer.explanation', parsed.focus_answer.explanation]);
      (parsed.findings || []).forEach((f, i) => {
        fields.push([`findings[${i}].case_against`, f.case_against]);
        fields.push([`findings[${i}].best_defense`, f.best_defense]);
        fields.push([`findings[${i}].why`, f.why]);
        if (f.snarky_version) fields.push([`findings[${i}].snarky_version`, f.snarky_version]);
      });
      if (parsed.strongest_case?.show) fields.push(['strongest_case.why', parsed.strongest_case.why]);
      if (parsed.what_the_story_gets_right?.show) fields.push(['what_the_story_gets_right.text', parsed.what_the_story_gets_right.text]);
      if (parsed.why_it_still_works?.show) fields.push(['why_it_still_works.text', parsed.why_it_still_works.text]);

      await runOutputGuard(parsed, {
        label: 'plot-hole-find',
        fields,
        supplied: suppliedLines.join('\n'),
        promise: 'Test a suspected plot hole (or scan the whole work) against the story\'s own established rules — sorting a genuine contradiction from an unexplained gap, a debatable character decision, a convenience, or something the story already explains, then adjudicating each with a verdict. Never a forced quota of findings, never an invented off-screen fact used as a defense, never a fabricated Reddit quote.',
        guard: router.outputGuard,
        userLanguage,
      });
    } catch (guardErr) {
      console.log('[plot-hole-find] v2 guard skipped:', guardErr.message);
    }

    res.json(parsed);
  } catch (error) {
    console.error('❌ Plot Hole Finder error:', error.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /plot-hole/defend — Defend a Hole
// ════════════════════════════════════════════════════════════
router.post('/plot-hole/defend', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { title, allegedHole, whatFeelsWrong, userLanguage } = req.body;

    if (!allegedHole?.trim()) {
      return res.status(400).json({ error: 'Describe the alleged plot hole.' });
    }

    const suppliedLines = [
      title?.trim() ? `STORY: ${title.trim()}` : 'STORY: not supplied — work from the alleged hole\'s own description.',
      `THE ALLEGED HOLE: ${allegedHole.trim().slice(0, 1000)}`,
      whatFeelsWrong?.trim() ? `WHAT MAKES IT FEEL WRONG TO THE VISITOR: ${whatFeelsWrong.trim().slice(0, 500)}` : '',
    ].filter(Boolean);

    const prompt = `${CORE_RULES}

${DEFEND_RULES}

WHAT THE VISITOR SUPPLIED:
${suppliedLines.join('\n')}

Return ONLY valid JSON matching this exact shape:
${DEFEND_SCHEMA}

LIMITS: defense_arguments AT MOST 5 (2-4 is typical — never pad to a quota, never omit a genuine stretch just to hit a count). Keep every field to one or two concise sentences (best_defense/closing_statement may run to 2-3). ALL top-level keys in the schema MUST be present.

${NO_QUOTE_RULE}`;

    const systemPrompt = withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3500,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Build the strongest honest defense.' }],
    }, { label: 'plot-hole-defend' });

    if (!parsed?.hole_summary) {
      return res.status(500).json({ error: 'Could not build a defense. Please try again.' });
    }

    // v2 guard (PF-39a). Fail-open: it wraps a working answer.
    try {
      const fields = [];
      (parsed.defense_arguments || []).forEach((a, i) => {
        fields.push([`defense_arguments[${i}].support`, a.support]);
        fields.push([`defense_arguments[${i}].counterpoint`, a.counterpoint]);
      });
      fields.push(['best_defense', parsed.best_defense]);
      fields.push(['closing_statement', parsed.closing_statement]);
      fields.push(['final_call', parsed.final_call]);

      await runOutputGuard(parsed, {
        label: 'plot-hole-defend',
        fields,
        supplied: suppliedLines.join('\n'),
        promise: 'Steel-man the strongest intellectually honest defense of a suspected plot hole using only what the story actually establishes, reasonable inference, genre convention, or thematic reading — never inventing new canon, off-screen events, or author intent to save the story.',
        guard: router.outputGuard,
        userLanguage,
      });
    } catch (guardErr) {
      console.log('[plot-hole-defend] v2 guard skipped:', guardErr.message);
    }

    res.json(parsed);
  } catch (error) {
    console.error('❌ Plot Hole Finder defend error:', error.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
