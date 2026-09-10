const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');
const { NO_QUOTE_RULE } = require('../lib/factCheck');

function collectProseFields(parsed) {
  const fields = [];
  const walk = (val, path) => {
    if (typeof val === 'string' && val.trim().length > 15) fields.push([path, val]);
    else if (Array.isArray(val)) val.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
  };
  walk(parsed, '');
  return fields;
}

// ═══════════════════════════════════════════════════════════════
// V3 rewrite (2026-09-10, full owner-supplied spec). V2 assigned Impact /
// Effort / ROI (0-100 each), a Readiness percentage, current->target
// proficiency levels, hour estimates, and named commercial tools and
// certificates — all from two role descriptions and an optional skills
// paragraph. None of that has a defensible calculation behind it; a few
// fields (age, name, occasionally hormone/mechanism-style specifics on other
// tools this session) turned out to survive multiple review passes before
// finally landing. See audit/tool-notes/SKILLGAPMAP-NOTES.md.
//
// Scope of this pass: the MAIN route below plus skill-gap-explore and
// skill-gap-timeline (further down this file) are the primary flow and were
// rewritten to v3. The other ~19 secondary drill-down routes in this file
// (Proof, Network, Reframe, Economics, Resume, Companies, Interview,
// Calibrate, Progress, DayLife, Outreach, Decode, Adjacency, Mock, Market,
// Celebrate, Nudge, Mentor) were NOT touched — they still carry the same
// fabricated-precision patterns (salary figures, fit scores, ATS claims)
// this rewrite removes from the primary result. Flagged as follow-up, not
// silently left as-is.
// ═══════════════════════════════════════════════════════════════
const CORE_SYSTEM = `SKILL GAP MAP

NORTH STAR:

MAP THE EVIDENCE, NOT THE PERSON.
MAP THE LIKELY GAP, NOT AN IMAGINARY EXACT GAP.
SHOW WHAT CARRIES OVER.
SHOW WHAT ISN'T ESTABLISHED YET.
GIVE ONE GOOD PLACE TO START.

Reason from the visitor's experience. Do not invent their proficiency. Do
not invent the employer. Do not invent the market. Do not invent precision.

SKILL GAP MAP DOES NOT KNOW THE VISITOR'S SKILLS. IT KNOWS THE EVIDENCE THE
VISITOR HAS PROVIDED.

SKILL GAP MAP DOES NOT KNOW THE EXACT TARGET JOB. IT KNOWS THE ROLE
DESCRIPTION THE VISITOR PROVIDED AND, WHEN AVAILABLE, THE REQUIREMENTS IN
SUPPLIED OR VERIFIED TARGET MATERIAL.

EVIDENCE MODEL — distinguish these at all times:

VISITOR-SUPPLIED EVIDENCE — what the visitor says they have done.
TRANSFERABLE IMPLICATION — what that experience reasonably suggests may carry over.
GENERAL ROLE EXPECTATION — a capability commonly relevant to this kind of work.
TARGET-SPECIFIC REQUIREMENT — established by a supplied job posting or verified source.
UNKNOWN — anything the available evidence does not establish.

Never silently promote:
NO EVIDENCE → NO SKILL
RELATED EXPERIENCE → PROFICIENCY
GENERAL ROLE PATTERN → THIS EMPLOYER'S REQUIREMENT
TIME AVAILABLE → COMPLETION DATE
MODEL PRIORITY → OBJECTIVE ROI
PLAUSIBLE ADVANTAGE → HIRING ADVANTAGE
CAREER ADVICE → MARKET FACT

PRESERVE THE VISITOR'S EVIDENCE AT ITS ACTUAL STRENGTH.
Supplied "written specs" -> allowed: "You have experience writing specs."
Not allowed: "You have a spec-writing habit," "before you've built the
instinct or track record," or any other inferred history of what the
visitor usually, rarely, formally, or informally does. State what they told
you, at the strength they told you, once.

CURRENT-EVIDENCE STATUS — use exactly these four for every capability:
EVIDENCE_YOU_HAVE — the visitor supplied experience directly relevant to it.
SOME_RELATED_EVIDENCE — supplied experience overlaps but doesn't establish the full capability.
NOT_ESTABLISHED — the visitor hasn't supplied evidence of it. This means "we don't have evidence of this from what you told us" — it does NOT mean "you don't have this skill."
NEEDS_CLARIFICATION — the supplied information is insufficient to classify responsibly.

TARGET-RELEVANCE BASIS — use exactly these four for every capability:
COMMONLY_RELEVANT — often part of this kind of role.
ROLE_DEPENDENT — important in some versions of the role but not others.
EMPLOYER_DEPENDENT — depends substantially on the company, team, seniority, or posting.
VERIFIED_TARGET — only when a supplied job posting or verified target-specific evidence establishes it.

Never write, about a target role's expectations: "this is the skill
interviewers probe hardest," "the operational layer [role]s use daily," "a
capability most candidates lack entirely," "applicant tracking systems ...
use it as a filter," what recruiters filter on, what a specific employer
values, what earns trust fastest, ATS behavior, or hiring-market demand —
unless supported by supplied or verified evidence. Use the four basis
states above instead.

DO NOT COMPARE THE VISITOR TO UNNAMED OTHERS OR PREDICT REACTIONS.
Do not write "unlike most candidates" or predict how a coworker,
interviewer, or team will react to something the visitor brings. A
transferable strength is traceable to the visitor's own supplied
experience — full stop, not a favorable comparison to people who weren't
described.

DO NOT INVENT A SELF-EXPERIMENT OR TRACKING PLAN.
Do not assign precise hours, "over weeks," beginner->intermediate style
proficiency jumps, or a measurement regimen the visitor didn't ask for. Use
qualitative sizing only.

DO NOT RECOMMEND A SPECIFIC COMMERCIAL TOOL OR CREDENTIAL WITHOUT A REASON.
"Roadmap Tooling — Productboard or Aha" and "PSPO or Pragmatic Marketing
Certificate" are unsupported product placements. A target role may need
"experience working with roadmap/planning tools" without needing a
particular product. Name a specific tool or credential only when the
visitor asked about credentials, a supplied job posting requires or
prefers one, or verified target-specific evidence makes it materially
relevant. Never invent recruiter/ATS value to justify a certificate.

PRIORITY AND EFFORT — qualitative only, never numeric:
Priority: start_here | important | useful | role_dependent
Effort (only when a reasonable comparison across gaps is possible):
smaller_build | moderate_build | larger_build

Never generate a 0-100 score, a percentage, a "ROI" figure, or an hour
estimate for a skill unless the visitor is working from a defined course,
curriculum, project, or other bounded task they described.

SEMANTIC DEDUPLICATION.
Before returning skill_gaps, ask of every pair: "would meaningfully working
on one of these substantially build the other?" If yes, combine them unless
the distinction is genuinely useful to keep separate. Two schema-shaped
slots existing is not a reason to fill both.

NETWORKING, CREDENTIALS, AND JOB-SEARCH TACTICS ARE NOT SKILL GAPS.
A professional network is not a capability gap in the sense that
prioritization or research synthesis is. Route networking, resume
positioning, outreach, and application tactics to transition_tasks, never
to skill_gaps. Lacking professional connections is not the same category
of thing as lacking a job skill.

VOICE.
Direct, specific, plain. No filler, no padding, no restating what was
asked. Never repeat information across fields — a distinction established
once should be built on by the next section, not restated in different
words.`;

const OUTPUT_GUARD = {
  prohibit: [
    'numeric_score_percentage_or_roi_figure_generated_for_a_skill_or_readiness',
    'proficiency_level_assigned_without_visitor_supplied_evidence',
    'hour_estimate_or_completion_date_invented_without_a_bounded_task',
    'target_role_expectation_stated_as_universal_fact_without_a_basis_label',
    'unverified_hiring_market_or_ats_claim',
    'commercial_tool_or_credential_recommended_without_a_supplied_reason',
    'limited_evidence_promoted_into_an_inferred_habit_or_history',
    'self_experiment_or_tracking_plan_invented',
    'networking_or_job_search_tactic_classified_as_a_skill_gap',
    'duplicate_or_near_duplicate_skill_gap_not_merged',
    'unnamed_candidates_used_as_a_favorable_comparison',
    'coworker_or_interviewer_reaction_predicted',
    'unsupported_natural_fit_or_person_role_compatibility_claimed',
    'unsupported_career_transition_pattern_or_entry_path_claimed',
    'specific_company_named_without_visitor_supplied_or_verified_basis',
    'personal_preference_or_enjoyment_assumed_as_established',
    'general_role_description_elevated_into_a_universal_requirement',
    'plausible_direction_treated_as_a_recommended_career_or_ranked_by_fit',
    'hypothetical_research_findings_described_as_though_they_occurred',
    'employer_confidential_access_or_recorded_user_data_suggested_as_a_practice_source',
    'build_size_or_effort_estimate_generated_for_a_skill_gap',
    'specific_commercial_product_or_brand_named_merely_as_an_example',
    'employer_type_taxonomy_invented_without_basis',
    'third_person_reference_to_the_visitor_instead_of_you',
    'start_here_gap_presented_as_objectively_highest_priority_without_basis',
    'generic_tool_familiarity_classified_as_a_skill_gap_instead_of_a_role_expectation',
    'unsupplied_detail_invented_about_the_purpose_or_audience_of_past_experience',
    'single_supplied_skill_upgraded_into_an_unestablished_technical_scope',
    'invented_subskill_or_named_methodology_more_specific_than_supplied_evidence',
    'general_field_knowledge_presented_as_a_canonical_checklist_of_conventions',
    'portfolio_or_specific_deliverable_destination_assumed_without_basis',
    'unsupported_occupational_generalization_used_to_justify_an_explore_direction',
    'emotional_reaction_or_preference_predicted_instead_of_asked_as_a_dimension',
    'unearned_occupational_authority_claimed_from_limited_supplied_experience',
  ],
  require: ['fulfills_tool_promise'],
};

function section(body, userLanguage) {
  return withLanguage(`${CORE_SYSTEM}\n\n${body}`, userLanguage) + `\n\n${NO_QUOTE_RULE}`;
}

router.outputStandard = 'v2';
router.outputGuard = OUTPUT_GUARD;

// ═══════════════════════════════════════════════════
// ROUTE 1: MAIN — the primary skill-gap map
// ═══════════════════════════════════════════════════
router.post('/skill-gap-map', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, currentSkills, hoursPerWeek, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!currentRole?.trim() || !targetRole?.trim()) {
      return res.status(400).json({ error: 'Describe both your current role and target role.' });
    }

    const skillsCtx = currentSkills?.trim()
      ? `\nEXPERIENCE THE VISITOR SUPPLIED: "${currentSkills.trim()}"`
      : '\nEXPERIENCE THE VISITOR SUPPLIED: none — do not invent any.';

    const hoursCtx = hoursPerWeek
      ? `\nHOURS PER WEEK AVAILABLE (use only to size the plan, never to calculate a completion date): ${hoursPerWeek}`
      : '';

    const brief = `CURRENT ROLE: "${currentRole.trim()}"
TARGET ROLE: "${targetRole.trim()}"
${skillsCtx}
${hoursCtx}

You are producing ONE PART of the analysis. Another analyst is producing
the other part — return only your own keys.`;

    // Two disjoint-key calls in parallel, merged back to one response. Split
    // by what the frontend shows immediately vs. behind a disclosure (see
    // item 16 of the rewrite spec) — a real UI boundary, unlike v2's
    // technical/soft-skill category split, which existed only to avoid
    // duplicate generation and had no meaning past that.
    const primaryPrompt = section(`${brief}

YOUR PART: the primary result — what carries over, the one gap worth
starting with, the next concrete move, and the fuller list of gaps worth
checking.

SKILL GAP MAP IS NOT A MODEL OF A PROFESSION. It is a comparison between
what the visitor told you they have done and capabilities that MAY matter
for the kind of role they named. Without a supplied or verified job
posting, every role-capability claim describes a possibility, not a
specification:

Say: commonly relevant, may involve, some roles require, worth checking,
may transfer, not established by what you supplied.
Avoid: "[role]s regularly...", "[role] requires...", "standard [role]
deliverables are...", "the role expects...", "interviewers look for...",
"employers want...", "this is foundational...", "this is the most
important gap...".

Never turn:
GENERAL OCCUPATIONAL KNOWLEDGE → THIS JOB'S REQUIREMENT
MISSING EVIDENCE → MISSING SKILL
RELATED EXPERIENCE → PROFICIENCY
A PLAUSIBLE GAP → THE MOST IMPORTANT GAP
A PRACTICE EXERCISE → REAL EXPERIENCE
A TOOL CATEGORY → CORE PROFESSIONAL SKILL
GENERAL FIELD KNOWLEDGE → A CHECKLIST OF PROFESSIONAL CONVENTIONS

Do not name specific techniques, named methodologies, or named frameworks
as though the field has one settled set of conventions — "structured
interview facilitation," "published UX interview frameworks," "think-aloud
prompting," "probing for behavior," "neutrality practices" and similar
technique lists assert a canon of professional practice nothing supplied
establishes. Where naming the general skill area is useful, name it at
that level ("interviewing technique," "research facilitation") and point
at investigating real practice instead: "compare your approach with
several credible resources and with what roles you're considering
actually ask for" — never assert what the practice is, only that it's
worth comparing against.

Do not invent what the visitor's past experience was FOR, ABOUT, or
DIRECTED AT beyond what they actually said — if they supplied "survey
design," do not describe its purpose as "understanding marketing
preferences" or any other objective they didn't state. Do not invent the
visitor's stakeholder types, the target employer's stakeholder types, or
how often something happens ("regularly present to product, design, and
business stakeholders") — describe the general possibility only.

Do not upgrade one supplied skill into a specific technical scope it
doesn't establish. "Data analysis in Excel" does not establish
research-data analysis, survey-result analysis, or behavioral-metrics
analysis — state exactly what was supplied, note that the input doesn't
establish what KIND of data or analysis, and describe the transfer as
depending on the target role, not asserted.

ADDRESS THE VISITOR AS "YOU" IN EVERY FIELD. Never write "the visitor,"
"the user," "the candidate," or any other third-person reference — this is
an individual-facing tool advising one person about their own transition.

Return ONLY valid JSON. Your response MUST contain ALL 5 top-level keys:
starting_point, transferable_strengths, start_here, next_move, skill_gaps.

{
  "starting_point": {
    "summary": "One or two sentences: what carries over, stated plainly, grounded only in supplied evidence",
    "important_unknowns": ["1-3 things supplied information doesn't establish, most consequential first — almost always including that the target role varies by company and an actual job posting would replace general expectations with that employer's specifics"]
  },
  "transferable_strengths": [
    {
      "strength": "A capability named directly from supplied experience — 3-6 words",
      "evidence": "The visitor's own supplied experience this rests on, restated at its actual strength — one sentence, addressed to 'you'",
      "transfer": "What that evidence reasonably suggests may carry over — one sentence, conditional, never upgraded into leadership/strategy/judgment/empathy/management unless the visitor supplied evidence for those specifically",
      "confidence": "direct | partial — 'direct' when the supplied evidence squarely establishes this strength; 'partial' when it's plausibly relevant but the input leaves the specifics (what kind, how much, in what context) unestablished — e.g. 'data analysis in Excel' toward a research-analysis capability is partial, not direct"
    }
  ],
  "start_here": {
    "capability": "A capability worth investigating first — 3-6 words. This is a SUGGESTED starting point, not an objectively-ranked priority, unless a supplied job posting or a clear dependency between capabilities justifies calling it the priority. Do not invent a more specific sub-skill or named methodology than the supplied evidence supports — if the visitor supplied 'customer interviews,' name the adjacent AREA ('UX research interviewing'), not a specific technique within it ('structured UX interview facilitation') that nothing they said establishes as the target",
    "why_it_matters": "Why THIS one is worth investigating first — normally because it's adjacent to evidence you already have, not because it's asserted to be the most important gap. If a supplied job posting or a clear dependency between capabilities justifies a stronger claim, say so specifically; otherwise frame it as one reasonable place to start, not the correct answer. Phrase it as an adjacent area worth comparing against roles you're considering, not as a verified priority",
    "current_evidence": "What the visitor's supplied experience does or doesn't establish about this — one sentence",
    "gap": "The specific difference between supplied evidence and the capability — one sentence",
    "next_move": "One short line naming how to build or demonstrate it — the full version is the top-level next_move below",
    "proof": "What observable artifact could demonstrate it — written to cover BOTH cases in one honest sentence when it's not established whether the visitor has already done the underlying activity: what to produce if they haven't done it yet (a plan/draft), and what to document if they have. Never describe hypothetical findings, participants, or observations as though they already happened"
  },
  "next_move": {
    "primary": "ONE feasible move, described concretely enough to act on today — assumes no special access, authority, or permission the visitor didn't mention. If it depends on whether the visitor has already done the underlying activity, cover both cases explicitly ('If you haven't run one yet, draft a plan for X. If you have, document what you did and learned.') rather than blending hypothetical-plan and already-happened language in a way that implies research occurred when it may not have",
    "why": "Why this move specifically, tied to start_here — one sentence",
    "proof": "What you'd have afterward — a concrete artifact you can review, improve, and potentially use to demonstrate your thinking where appropriate — one sentence, consistent with whichever case (plan or documentation) actually applies. Do not assume the target role expects this specifically in a portfolio",
    "alternatives": ["Up to 2 alternatives, each explicitly conditional — e.g. 'If you have access to X, ...' — never assumed. Never suggest accessing an employer's confidential systems, internal user recordings, or anything requiring special permission or raising consent/privacy questions the visitor didn't ask about — prefer a self-contained exercise or something the visitor has clear, legitimate access to"]
  },
  "skill_gaps": [
    {
      "capability": "Specific capability — 3-6 words, not 'learn leadership'. Generic familiarity with a category of tool or software (not a technique or judgment capability) does not belong here — that goes in the other analyst's role_expectations_to_check instead, since specific tool requirements vary by employer",
      "target_relevance": "Why this MAY matter for the target role, framed as a possibility ('commonly relevant to...', 'some roles require...') — never a flat statement of what the role requires or what employers want — one sentence",
      "relevance_basis": "commonly_relevant | role_dependent | employer_dependent | verified_target",
      "current_evidence": "What the visitor actually supplied that bears on this, or 'None supplied.' — one sentence, addressed to 'you'",
      "status": "evidence_you_have | some_related_evidence | not_established | needs_clarification",
      "gap": "The specific difference between supplied evidence and the capability — one sentence",
      "next_move": "One practical, feasible way to strengthen or demonstrate it — one sentence",
      "proof": "What observable artifact could demonstrate it — one sentence, never describing hypothetical findings as though they already occurred",
      "priority": "start_here | important | useful | role_dependent"
    }
  ]
}

RULES:
- 4-7 skill_gaps after semantic deduplication — not padded to fill a count.
- Do not repeat the capability chosen for start_here inside skill_gaps.
- Do not put networking, credentials, resume positioning, or job-search tactics in skill_gaps — those belong to the other analyst's transition_tasks.
- Do not put generic tool/software familiarity in skill_gaps — that belongs in the other analyst's role_expectations_to_check.
- Maximum 5 transferable_strengths, maximum 2 next_move.alternatives, maximum 3 starting_point.important_unknowns.
- Do not name a specific commercial product, tool, or brand anywhere in this response — describe the category instead ("research-specific software," not "Dovetail, Lookback, UserTesting").
- Do not invent a taxonomy of employer types ("agency, startup, mid-size product company, enterprise") — one phrase acknowledging general variability is enough.
- No numeric scores, and no effort/size estimate for a skill gap — priority (start_here/important/useful/role_dependent) is the only prioritization signal; do not add a build-size label.`, userLanguage);

    const secondaryPrompt = section(`${brief}

YOUR PART: what's worth checking about the target role itself, and the
practical non-skill tasks the transition involves.

Follow the same discipline as the other analyst: role capabilities are
possibilities without a supplied job posting ("commonly relevant," "some
roles," "worth checking" — never "the role expects," "employers want").
Address the visitor as "you" in every field, never "the visitor" or "the
user." Do not name specific commercial products or brands. Do not invent
an employer-type taxonomy.

Return ONLY valid JSON. Your response MUST contain ALL 2 top-level keys:
role_expectations_to_check, transition_tasks.

{
  "role_expectations_to_check": [
    {
      "question": "Something about the target role worth verifying rather than assuming — degree of ownership, IC vs. management, customer contact, analytics expectations, technical depth, domain expertise, portfolio expectations, specific tool/software familiarity, travel/on-call/location — one sentence",
      "why_it_matters": "Why this could materially change the plan if the answer differs from the general pattern — one sentence",
      "how_to_verify": "Best source is an actual job posting for this exact role, and comparing several similar postings — one sentence"
    }
  ],
  "transition_tasks": [
    {
      "task": "A networking, resume, outreach, or application task — not a skill to build — one sentence",
      "why": "Why this task specifically matters for this transition — one sentence"
    }
  ]
}

RULES:
- Maximum 4 role_expectations_to_check, 3 transition_tasks.
- Zero of either is allowed — omit rather than manufacture.
- Label every expectation as something to VERIFY, never as a known fact about the target.
- If a target role commonly involves a category of specialized tool or software, that belongs here as something to check ("some employers may expect familiarity with particular research/testing/analysis tools — the specific tools vary; check the posting"), not as a skill_gap in the other analyst's response.
- No numeric scores anywhere in this response.`, userLanguage);

    // primary max_tokens: this exact schema (up to 7 skill_gaps x 10 fields,
    // plus transferable_strengths x5, start_here, next_move) truncated at
    // 3000 under real, richly-supplied input — the same failure v1 already
    // hit and fixed by raising 3000->5000 (see audit/tool-notes and
    // deftbrain-skillgapmap-architecture memory). The v3 rewrite
    // reintroduced the old limit; callClaudeWithRetry hard-throws on
    // stop_reason==='max_tokens' rather than returning partial JSON, so a
    // truncation here is a guaranteed 500 ("Could not map your skill
    // gaps."), not a degraded-but-usable answer.
    const [primaryPart, secondaryPart] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 5000,
        system: withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: primaryPrompt }],
      }, { label: 'SkillGapMap:primary' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 2500,
        system: withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: secondaryPrompt }],
      }, { label: 'SkillGapMap:secondary' }),
    ]);

    const parsed = {
      transition: { current: currentRole.trim(), target: targetRole.trim() },
      ...primaryPart,
      ...secondaryPart,
    };

    if (!parsed.starting_point || !parsed.skill_gaps) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'skill-gap-map',
      fields: collectProseFields(parsed),
      supplied: brief,
      promise: 'Show what supplied experience carries over to the target role, what is not yet established, and one good place to start — without inventing proficiency, the employer, the market, or precision.',
      guard: router.outputGuard,
      userLanguage,
    });

    // Structural cleanup after the guard (guard mutates in place; a repair
    // pass can leave a field incomplete despite being told not to — same
    // lesson as ScamRadar/Sensory Scout/Signal vs Noise this session).
    const nonBlank = (v) => typeof v === 'string' && v.trim().length > 0;
    parsed.transferable_strengths = Array.isArray(parsed.transferable_strengths)
      ? parsed.transferable_strengths.filter(x => nonBlank(x?.strength) && nonBlank(x?.evidence)).slice(0, 5)
      : [];
    parsed.skill_gaps = Array.isArray(parsed.skill_gaps)
      ? parsed.skill_gaps.filter(x => nonBlank(x?.capability) && nonBlank(x?.gap)).slice(0, 7)
      : [];
    parsed.role_expectations_to_check = Array.isArray(parsed.role_expectations_to_check)
      ? parsed.role_expectations_to_check.filter(x => nonBlank(x?.question)).slice(0, 4)
      : [];
    parsed.transition_tasks = Array.isArray(parsed.transition_tasks)
      ? parsed.transition_tasks.filter(x => nonBlank(x?.task)).slice(0, 3)
      : [];
    if (parsed.starting_point) {
      parsed.starting_point.important_unknowns = Array.isArray(parsed.starting_point.important_unknowns)
        ? parsed.starting_point.important_unknowns.filter(nonBlank).slice(0, 3)
        : [];
    }
    if (parsed.next_move) {
      parsed.next_move.alternatives = Array.isArray(parsed.next_move.alternatives)
        ? parsed.next_move.alternatives.filter(nonBlank).slice(0, 2)
        : [];
    }

    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapMap] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: TIMELINE — sequenced, not scheduled. Hours/week may size the
// plan; it may never be used to calculate a completion date from invented
// per-skill hour estimates — the v2 version did exactly that (total_weeks,
// per-week milestones with a specific week number) despite never being
// given a bounded curriculum to derive it from.
// ═══════════════════════════════════════════════════
router.post('/skill-gap-timeline', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { transitionSummary, skillGaps, hoursPerWeek, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!skillGaps?.length) {
      return res.status(400).json({ error: 'Run the gap analysis first.' });
    }

    const hours = hoursPerWeek || 5;
    const gapCtx = skillGaps.slice(0, 8).map((g, i) =>
      `${i + 1}. ${g.capability || g.skill} (${g.priority})`
    ).join('\n');

    const prompt = section(`Sequence this career transition's skill-building — not a schedule with dates, a SEQUENCE with a reasoning order. The visitor has ${hours} hours/week available.

TRANSITION: ${transitionSummary?.current || transitionSummary?.from || 'Current role'} → ${transitionSummary?.target || transitionSummary?.to || 'Target role'}

SKILL GAPS (prioritized):
${gapCtx}

Return ONLY valid JSON:
{
  "hours_per_week": ${hours},
  "first": {
    "focus": "Which gap(s) to work on first and why that order, given the hours available — one or two sentences",
    "how_youll_know": "A concrete, self-checkable sign this step is genuinely done — not a time-based one — one sentence"
  },
  "then": {
    "focus": "What comes after, and how what's learned in 'first' should inform whether this is still the right next gap — one or two sentences"
  },
  "later": {
    "focus": "Secondary capabilities or transition tasks that can wait until the earlier gaps are underway — one or two sentences"
  },
  "plateau_note": "A realistic, non-date-based note about when motivation typically dips in this kind of learning process and what to do about it — one sentence, or null"
}

RULES:
- Do NOT generate total_weeks, a week number, "~Xh", or any completion estimate ("~6 months", "12 weeks") — nothing here is bounded enough to support one.
- hours_per_week is for SIZING each phase's scope (how much to attempt at once), never for calculating when the visitor will be "done."
- Sequence by what a visitor can self-verify, not by an invented schedule.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1500,
      system: withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapTimeline' });

    if (!parsed.first) {
      return res.status(500).json({ error: 'Could not sequence your plan. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'skill-gap-timeline',
      fields: collectProseFields(parsed),
      supplied: prompt,
      promise: 'Sequence skill-building by reasoning order, without inventing a completion date or schedule.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapTimeline] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: PROOF — Portfolio proof planner for each gap
// ═══════════════════════════════════════════════════
router.post('/skill-gap-proof', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { transitionSummary, skillGaps, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!skillGaps?.length) {
      return res.status(400).json({ error: 'Run the gap analysis first.' });
    }

    const gapCtx = skillGaps.filter(g => g.priority === 'critical' || g.priority === 'high').slice(0, 6).map((g, i) =>
      `${i + 1}. ${g.skill} (${g.category}, target: ${g.target_level})`
    ).join('\n');

    const prompt = withLanguage(`For each critical/high-priority skill gap, design a specific way to PROVE competence without having the target job. Hiring managers don't care about courses — they care about evidence.

TRANSITION: ${transitionSummary?.from || 'Current'} → ${transitionSummary?.to || 'Target'}

HIGH-PRIORITY GAPS:
${gapCtx}

For each skill, provide 2 proof strategies: one project-based and one contribution-based.

Return ONLY valid JSON:
{
  "proof_plans": [
    {
      "skill": "Skill name — 3-6 words",
      "project_proof": {
        "title": "Specific project name — e.g., 'Build a customer churn prediction dashboard' — 3-6 words",
        "description": "What you'd build, 2-3 sentences",
        "time_estimate": "10-15 hours — one sentence",
        "resume_bullet": "How to describe this project on your resume for the target role — one sentence"
      },
      "contribution_proof": {
        "title": "A contribution you could make without being hired — e.g., 'Contribute to open-source X' — 3-6 words",
        "description": "What you'd do, 2-3 sentences",
        "time_estimate": "5-10 hours — one sentence"
      }
    }
  ],
  "portfolio_strategy": {
    "minimum_viable_portfolio": "The 2-3 pieces that would be sufficient to demonstrate readiness — one sentence"
  }
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage('You are a career portfolio strategist who helps people prove competence without credentials. You think like a hiring manager. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapProof' });

    if (!parsed.proof_plans) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapProof] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 4: NETWORK — Who you need to know
// ═══════════════════════════════════════════════════
router.post('/skill-gap-network', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { transitionSummary, targetRole, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!targetRole?.trim()) {
      return res.status(400).json({ error: 'Target role is required.' });
    }

    const prompt = withLanguage(`Map the network this person needs to build for their career transition. Not generic "network more" advice — specific types of people, where to find them, and what to say.

TRANSITION: ${transitionSummary?.from || 'Current role'} → ${targetRole.trim()}

INSTRUCTIONS:
- Identify 4-6 specific types of people they need in their network
- For each, explain why this person matters, where to find them, and a specific opener
- Include at least one "unexpected ally" — someone outside the obvious network
- Be realistic about how networking actually works for career transitioners

Return ONLY valid JSON:
{
  "network_gaps": [
    {
      "type": "Specific type — e.g., 'A senior PM who transitioned from engineering' — one sentence",
      "why_critical": "What this person can do for you that no one else can — one sentence",
      "where_to_find": "Specific place — 'LinkedIn search: PM at [target companies] + previously engineer' — one sentence",
      "opener": "Exact message template to reach out — specific to the transition, not generic — one sentence",
      "what_to_ask": "The specific question that will get you the most useful information — one sentence"
    }
  ],
  "unexpected_ally": {
    "type": "Someone outside the obvious network who surprisingly helps with this transition — one sentence",
    "how_they_help": "The specific advantage they provide — one sentence"
  }
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage('You are a strategic networking advisor for career transitioners. You give specific, actionable advice about who to connect with and what to say. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapNetwork' });

    if (!parsed.network_gaps) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapNetwork] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 5: DEEP DIVE — Expand one specific skill gap
// ═══════════════════════════════════════════════════
router.post('/skill-gap-deep', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { gap, transitionSummary, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!gap?.skill) {
      return res.status(400).json({ error: 'Select a skill gap to explore.' });
    }

    const prompt = withLanguage(`Create a detailed learning plan for this single skill gap. Go deep — the user has decided to focus on this skill and needs a complete roadmap.

SKILL: ${gap.skill}
CURRENT LEVEL: ${gap.current_level || 'unknown'}
TARGET LEVEL: ${gap.target_level || 'advanced'}
CONTEXT: Transitioning from ${transitionSummary?.from || 'current role'} to ${transitionSummary?.to || 'target role'}
ESTIMATED HOURS: ${gap.time_estimate_hours || 40}

Return ONLY valid JSON:
{
  "skill": "${gap.skill}",
  "learning_path": [
    {
      "stage": "Stage name — e.g., 'Understand the fundamentals' — 2-4 words",
      "hours": 8,
      "activities": [
        {
          "activity": "Specific thing to do — e.g., 'Complete chapters 1-4 of...' — one sentence",
          "resource": "Specific resource by name/search term (no URLs) — one sentence",
          "free_or_paid": "free|cheap|moderate"
        }
      ],
      "checkpoint": "How to verify you've completed this stage — specific test or task — one sentence"
    }
  ],
  "good_enough_threshold": "The specific level where you can stop studying and start applying — described concretely — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage('You are a skill development coach who creates detailed, stage-by-stage learning plans. Be specific about resources (by name, not URL) and honest about what "good enough" looks like. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapDeep' });

    if (!parsed.skill) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapDeep] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 6: REFRAME — Translate current experience into target language
// ═══════════════════════════════════════════════════
router.post('/skill-gap-reframe', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, experience, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!currentRole?.trim() || !targetRole?.trim() || !experience?.trim()) {
      return res.status(400).json({ error: 'Current role, target role, and experience description are required.' });
    }

    const prompt = withLanguage(`The user is describing their current experience. Translate EVERYTHING they do into the language and framing of their target role. Show them how much of what they already do is transferable — they just need to rename it.

CURRENT ROLE: "${currentRole.trim()}"
TARGET ROLE: "${targetRole.trim()}"
THEIR EXPERIENCE DESCRIPTION: "${experience.trim()}"

INSTRUCTIONS:
- Take every activity, responsibility, and accomplishment they described
- Translate each one into the vocabulary and framing the target role uses
- Identify which are direct transfers, which need slight reframing, and which reveal gaps
- Write resume bullets in the target role's language

Return ONLY valid JSON:
{
  "translations": [
    {
      "original": "What they said they do / did — one sentence",
      "translated": "How the target role describes this same activity — one sentence",
      "transfer_type": "direct|reframe|partial|gap",
      "resume_bullet": "A polished resume bullet using target-role language — one sentence",
      "strength": "How strong this experience is for the target role: strong|moderate|weak"
    }
  ],
  "coverage_score": 65,
  "coverage_summary": "X out of Y core competencies for the target role are covered by existing experience — 1-2 sentences",
  "strongest_translations": ["The 2-3 translations that would most impress a hiring manager for the target role"],
  "vocabulary_cheat_sheet": [
    {
      "you_say": "Term from current role — one sentence",
      "they_say": "Equivalent term in target role — one sentence",
      "context": "When and how to use the target term — 1-2 sentences"
    }
  ],
  "linkedin_headline": "A LinkedIn headline that bridges current experience with target aspirations — one sentence",
  "elevator_pitch": "A 30-second pitch explaining this transition that sounds intentional, not desperate — max 60 words — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 7500,
      system: withLanguage('You are a resume strategist and career translator who helps people reframe existing experience for new roles. You think like a hiring manager and know what language signals competence in different fields. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapReframe' });

    if (!parsed.translations) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapReframe] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 7: ECONOMICS — Transition financial analysis
// ═══════════════════════════════════════════════════
router.post('/skill-gap-economics', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, transitionSummary, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!currentRole?.trim() || !targetRole?.trim()) {
      return res.status(400).json({ error: 'Both roles are required.' });
    }

    const prompt = withLanguage(`Analyze the financial reality of this career transition. Be honest — sometimes the math doesn't work. People deserve to know before they invest months.

CURRENT ROLE: "${currentRole.trim()}"
TARGET ROLE: "${targetRole.trim()}"
ESTIMATED TRANSITION TIME: ${transitionSummary?.estimated_months || 6} months

INSTRUCTIONS:
- Use realistic salary ranges (not maximums)
- Account for the transition period (reduced income, learning costs)
- Calculate the real ROI over 1, 3, and 5 years
- Be honest about hidden costs
- Consider geographic variation

Return ONLY valid JSON:
{
  "current_salary_range": {
    "low": 45000,
    "mid": 55000,
    "high": 70000,
    "note": "Any relevant context about this range — one sentence"
  },
  "target_salary_range": {
    "low": 65000,
    "mid": 80000,
    "high": 100000,
    "note": "Any relevant context — e.g., 'Entry-level PM pay varies wildly by company size' — one sentence"
  },
  "salary_delta": {
    "realistic_starting_salary": "What you'll actually get in your FIRST target-role job — usually below the midpoint — one sentence"
  },
  "transition_costs": [
    {
      "item": "Specific cost — e.g., 'Google PM Certificate' — one sentence",
      "cost": 300,
      "required_or_optional": "required|recommended|optional",
      "note": "Why this cost exists — one sentence"
    }
  ],
  "total_transition_cost": 1500,
  "roi_analysis": {
    "payback_period_months": 8,
    "year_3_cumulative": "Total additional earnings over 3 years — one sentence",
    "year_5_cumulative": "Total additional earnings over 5 years — one sentence",
    "verdict": "Strong ROI|Good ROI|Marginal — consider carefully|Negative — financial case is weak"
  },
  "negotiation_leverage": "What gives you leverage in salary negotiation for the target role — specific to this transition — one sentence",
  "financial_warning": "Any honest caution about the financial side of this specific transition (or null if the math is clearly good) — one sentence"
}

Do NOT include a percent increase or dollar increase field yourself — those are computed from your own current_salary_range.mid and target_salary_range.mid after you respond, so they always agree with the ranges you gave rather than risking a second, independently-stated number that contradicts them.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage('You are a career economics analyst who gives honest financial assessments of career transitions. Use realistic salary data. Never inflate numbers to make a transition look better. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapEconomics' });

    if (!parsed.current_salary_range) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }

    // Computed here, not asked of the model: a second independently-stated
    // number ("expected 45% increase") could silently disagree with the
    // salary ranges the model just gave, and there is no reason to let it —
    // the ranges already establish everything these two figures need.
    const currentMid = Number(parsed.current_salary_range?.mid);
    const targetMid = Number(parsed.target_salary_range?.mid);
    if (Number.isFinite(currentMid) && currentMid > 0 && Number.isFinite(targetMid)) {
      parsed.salary_delta ??= {};
      parsed.salary_delta.annual_dollar_increase = Math.round(targetMid - currentMid);
      parsed.salary_delta.expected_increase_percent = Math.round(((targetMid - currentMid) / currentMid) * 100);
    }

    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapEconomics] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 8: RESUME AUDIT — Grade real resume against target
// ═══════════════════════════════════════════════════
router.post('/skill-gap-resume', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, resumeText, skillGaps, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!resumeText?.trim() || !targetRole?.trim()) {
      return res.status(400).json({ error: 'Paste your resume and specify the target role.' });
    }

    const gapCtx = skillGaps?.slice(0, 6).map(g => `${g.skill} (${g.priority})`).join(', ') || '';

    const prompt = withLanguage(`Audit this resume for the target role. Be direct — tell them what's working, what's hurting them, and exactly how to fix it.

TARGET ROLE: "${targetRole.trim()}"
CURRENT ROLE: "${currentRole?.trim() || 'Not specified'}"
KNOWN SKILL GAPS: ${gapCtx || 'Not assessed'}

RESUME:
"""
${resumeText.trim().substring(0, 12000)}
"""

Return ONLY valid JSON:
{
  "overall_score": 55,
  "verdict": "One-sentence honest assessment — e.g., 'Solid foundation but reads like a marketing resume, not a PM resume' — one sentence",
  "strengths": [
    {
      "element": "What's working — one sentence",
      "why": "Why this is effective for the target role — one sentence"
    }
  ],
  "problems": [
    {
      "element": "What's hurting them — one sentence",
      "severity": "critical|moderate|minor",
      "why": "Why this is a problem for the target role — one sentence",
      "fix": "Exactly how to fix it — specific rewrite or removal — one sentence"
    }
  ],
  "missing_elements": [
    {
      "element": "What should be on this resume but isn't — one sentence",
      "why": "Why the target role expects this — one sentence",
      "how_to_add": "How to add this even if they don't have direct experience — one sentence"
    }
  ],
  "rewritten_bullets": [
    {
      "original": "Their current bullet — one sentence",
      "rewritten": "The same experience reframed for the target role — one sentence",
      "what_changed": "What we changed and why — one sentence"
    }
  ],
  "format_notes": "Any structural/formatting advice — length, order, sections — one sentence",
  "ats_concerns": "Any issues that might cause problems with applicant tracking systems — one sentence",
  "summary_suggestion": "A rewritten professional summary/objective for the target role — 2-3 sentences"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage('You are a resume auditor who has reviewed thousands of career-transition resumes. You know exactly what hiring managers scan for and what triggers an instant rejection. Be direct and specific. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapResume' });

    if (!parsed.overall_score) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapResume] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 9: COMPANY FIT — What types of companies to target
// ═══════════════════════════════════════════════════
router.post('/skill-gap-companies', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, transitionSummary, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!targetRole?.trim()) {
      return res.status(400).json({ error: 'Target role is required.' });
    }

    const prompt = withLanguage(`Advise this career transitioner on what types of companies to target — and which to avoid. Different companies have wildly different bars for the same title, and some actively value non-traditional backgrounds while others screen them out.

TRANSITION: ${currentRole?.trim() || 'Current role'} → ${targetRole.trim()}
DIFFICULTY: ${transitionSummary?.difficulty || 'Unknown'}

INSTRUCTIONS:
- Identify 4-5 company archetypes (not specific company names — types)
- For each, explain why they're good or bad for this specific transition
- Be honest about where the user's background is an asset vs. a liability
- Include at least one contrarian suggestion

Return ONLY valid JSON:
{
  "ideal_company_types": [
    {
      "type": "Company archetype — e.g., 'Series B-C startups in [industry]' — one sentence",
      "why_good_for_you": "Why this type of company values your specific background — one sentence",
      "what_to_search": "Specific job board filters, search terms, or signals to look for — one sentence",
      "interview_advantage": "How your transition story plays as a STRENGTH here — one sentence",
      "typical_titles": ["Job titles to search for at this type of company"],
      "fit_score": 85
    }
  ],
  "avoid_types": [
    {
      "type": "Company archetype to avoid for now — one sentence",
      "why_avoid": "Why your transition background is a liability here — one sentence",
      "exception": "The one scenario where this could work anyway — one sentence"
    }
  ],
  "stealth_targets": {
    "type": "A company type most transitioners don't think to target — one sentence",
    "why_surprising": "Why this is actually a great fit despite not being obvious — one sentence"
  },
  "application_strategy": {
    "apply_ratio": "How many applications to expect before landing interviews — honest number — one sentence",
    "best_channel": "The most effective way to get interviews for this specific transition (spoiler: it's rarely job boards) — one sentence",
    "timing": "When in the skill-building process to start applying — and why earlier than you think — one sentence"
  },
  "red_flags": ["2-3 things in a job posting that signal this company won't be receptive to career transitioners"]
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 5000,
      system: withLanguage('You are a job search strategist who knows which companies hire career transitioners and which screen them out. Be specific about company types and honest about the odds. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapCompanies' });

    if (!parsed.ideal_company_types) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapCompanies] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 10: INTERVIEW PREP — Full mock interview for target role
// ═══════════════════════════════════════════════════
router.post('/skill-gap-interview', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, skillGaps, transferableSkills, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!currentRole?.trim() || !targetRole?.trim()) {
      return res.status(400).json({ error: 'Both roles required.' });
    }

    const gapCtx = skillGaps?.slice(0, 6).map(g => `${g.skill} (${g.priority}, current: ${g.current_level})`).join(', ') || '';
    const transferCtx = transferableSkills?.slice(0, 4).map(t => `${t.current_name} → ${t.target_name}`).join(', ') || '';

    const prompt = withLanguage(`Build a complete interview prep guide for this career transitioner. They'll face questions that specifically probe the transition — prepare them.

TRANSITION: "${currentRole.trim()}" → "${targetRole.trim()}"
SKILL GAPS: ${gapCtx || 'Not assessed'}
TRANSFERABLE SKILLS: ${transferCtx || 'Not assessed'}

INSTRUCTIONS:
- Include the transition-specific questions they WILL be asked
- Provide answer frameworks, not scripts — they need to sound natural
- Include the "landmine" questions designed to expose transitioners
- Help them flip weaknesses into stories

Return ONLY valid JSON:
{
  "transition_questions": [
    {
      "question": "The exact question they'll be asked — one sentence",
      "why_they_ask": "What the interviewer is really trying to determine — one sentence",
      "landmine": "The bad answer most transitioners give — one sentence",
      "framework": "How to structure a strong answer — specific to their background — one sentence",
      "example_opener": "A strong opening sentence they can adapt — one sentence",
      "key_phrase": "A specific phrase or framing that signals competence — one sentence"
    }
  ],
  "technical_questions": [
    {
      "question": "Technical/domain question for the target role — one sentence",
      "difficulty": "basic|intermediate|advanced",
      "honest_answer_if_learning": "How to answer honestly when you're still building this skill — without sounding incompetent — one sentence",
      "bridge_from_current": "How to connect this to something from their current role — one sentence"
    }
  ],
  "behavioral_questions": [
    {
      "question": "Behavioral question — one sentence",
      "best_story_from": "Which part of their current experience provides the best STAR story — one sentence",
      "opening_line": "Strong opening sentence — one sentence"
    }
  ],
  "questions_to_ask": [
    {
      "question": "A smart question to ask the interviewer — one sentence",
      "why_smart": "What this signals about you — one sentence"
    }
  ],
  "transition_story": {
    "the_narrative": "A 30-second story arc explaining WHY they're making this transition — must sound intentional, not desperate — 1-2 sentences",
    "the_bridge": "The specific sentence that connects their past to their future — the pivot point of their story — one sentence",
    "what_to_never_say": "The thing most transitioners say that immediately undermines their credibility — one sentence"
  },
  "confidence_note": "An honest assessment of how they'll come across in interviews right now, and what would most improve their presence — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage('You are an interview coach who specializes in career transitioners. You know the specific questions they face and the landmines they step on. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapInterview' });

    if (!parsed.transition_questions) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapInterview] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 11: CALIBRATE — Adjust plan based on real constraints
// ═══════════════════════════════════════════════════
router.post('/skill-gap-calibrate', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, skillGaps, constraints, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!constraints) {
      return res.status(400).json({ error: 'Constraints are required.' });
    }

    const gapCtx = skillGaps?.slice(0, 8).map(g =>
      `${g.skill} (${g.priority}, ~${g.time_estimate_hours}h)`
    ).join(', ') || '';

    const prompt = withLanguage(`Recalibrate this career transition plan based on real-life constraints. The original plan assumed ideal conditions — now adjust for reality.

TRANSITION: ${currentRole?.trim() || 'Current'} → ${targetRole?.trim() || 'Target'}
ORIGINAL GAPS: ${gapCtx || 'Not specified'}

CONSTRAINTS:
- Employment status: ${constraints.employmentStatus || 'Not specified'}
- Financial runway: ${constraints.financialRunway || 'Not specified'}
- Family obligations: ${constraints.familyObligations || 'None mentioned'}
- Location flexibility: ${constraints.locationFlexibility || 'Not specified'}
- Timeline pressure: ${constraints.timelinePressure || 'Flexible'}
- Biggest worry: ${constraints.biggestWorry || 'Not specified'}

Return ONLY valid JSON:
{
  "adjusted_timeline_months": 9,
  "adjustment_explanation": "Why the timeline changed — 1 sentence",
  "constraint_specific_advice": [
    {
      "constraint": "Which constraint this addresses — one sentence",
      "advice": "Specific, actionable advice for their situation — one sentence",
      "resource": "A specific resource or strategy for this constraint — one sentence"
    }
  ],
  "risk_assessment": {
    "biggest_risk": "The single biggest risk to this transition given their constraints — one sentence",
    "mitigation": "How to reduce this risk — one sentence"
  },
  "momentum_strategy": "How to maintain momentum given their specific constraints — e.g., 'With only 3h/week and a family, batch learning into Saturday mornings and...' — one sentence",
  "honest_take": "A direct, kind, honest assessment: is this transition realistic given their constraints? What would make it more realistic? — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage('You are a career transition realist who adjusts plans for real life. You are kind but honest — if constraints make a transition significantly harder, you say so while offering solutions. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapCalibrate' });

    if (!parsed.adjusted_timeline_months) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapCalibrate] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 12: EXPLORE — Possible directions, not an invented target mapped
// against itself. This visitor has no target yet; the old version invented
// one (a specific role title, a salary_change percentage, a demand rating)
// and then confidently mapped gaps against its own invention. Now it stops
// after suggesting directions — "Map This Direction" in the frontend hands
// the chosen target_role to the real /skill-gap-map above, which reasons
// from the visitor's OWN evidence, not a role this endpoint made up.
// ═══════════════════════════════════════════════════
router.post('/skill-gap-explore', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      currentRole, currentSkills, interests, userLanguage, userLocale, userCurrency, userRegion,
      excludeDirections, refinementNote, count,
    } = req.body;

    if (!currentRole?.trim()) {
      return res.status(400).json({ error: 'Describe your current role.' });
    }

    // "Show N More Directions" passes count:2 + excludeDirections (the
    // target_roles already shown) so the second batch is genuinely new, not
    // a near-duplicate of the first. Default is 4, not 4-6 — see rule 3
    // below; the ceiling here is a safety bound, not the target.
    const wantCount = Number.isInteger(count) && count > 0 && count <= 6 ? count : 4;
    const excludeList = Array.isArray(excludeDirections)
      ? excludeDirections.filter(x => typeof x === 'string' && x.trim()).slice(0, 12)
      : [];

    const prompt = section(`HELP ME EXPLORE

This visitor knows they want a change but hasn't picked a target yet. Your
job is NOT to decide what career they should pursue. Your job is to
generate a small, varied set of plausible directions traceable to what they
actually supplied, so they can choose one to investigate further — not to
rank, score, or recommend one over the others.

A proposed direction is an EXPLORATION HYPOTHESIS, not a finding about the
visitor and not a verified description of an occupation.

For "why_it_connects", use only: experience the visitor supplied, interests
the visitor supplied, and reasonable semantic connections between those and
the proposed direction. Do not justify a direction by asserting unsupported
occupational facts — "these are the primary methods...", "these are the
core activities...", "people in this role typically...", "this field draws
on...", "this role frequently...", "this work commonly requires..." are all
the same error: an unverified occupational claim doing the justifying work
that only the visitor's own supplied evidence is allowed to do here. THIS
BANS THE PARAPHRASE, NOT JUST THESE EXACT WORDS — "your experience covers
the core activities of many X roles," "reflects what this kind of role
often does," "matches what this field generally involves" commit the
identical error without the flagged words: describing what the ROLE is or
does in general, then using that description to justify the connection.
The connection must run the other direction — from the visitor's specific
supplied experience or interest to the direction — never through a claim
about what the occupation is like in general. Do not describe supplied
experience as giving the visitor "a basis in" a field's work in general —
name the specific concrete reasons the supplied evidence and interests
point at this direction, nothing broader.

For "what_the_work_involves", general occupational knowledge may orient but
must preserve variation, not assert a settled job description: "this kind
of role can involve...", "depending on the organization, the work may
include...", "some versions of this role involve..." — never present
remembered occupational knowledge as verified.

The purpose of "one_way_to_investigate" is precisely to replace this
general orientation with evidence about actual roles — that's where the
verification happens, not in why_it_connects or what_the_work_involves.

CURRENT ROLE: "${currentRole.trim()}"
${currentSkills?.trim() ? `EXPERIENCE SUPPLIED: "${currentSkills.trim()}"` : 'EXPERIENCE SUPPLIED: none — do not invent any.'}
${interests?.trim() ? `INTERESTS SUPPLIED: "${interests.trim()}"` : 'INTERESTS SUPPLIED: none.'}
${excludeList.length ? `\nALREADY SHOWN TO THE VISITOR — do not repeat any of these, and do not produce a near-duplicate variant of one of them (e.g. a second flavor of the same underlying role):\n${excludeList.map(d => `- ${d}`).join('\n')}` : ''}
${refinementNote?.trim() ? `\nTHE VISITOR ADDED THIS CONSTRAINT — apply it to every direction you generate: "${refinementNote.trim()}"` : ''}

Return ONLY valid JSON. Your response MUST contain the top-level key: directions.
{
  "directions": [
    {
      "target_role": "A specific, plausible direction — 3-6 words",
      "why_it_connects": "Why this connects to what the visitor actually supplied — one sentence, traceable to their evidence. Do not claim the visitor's experience establishes something it only makes them familiar with (e.g. backend/API work gives familiarity with technical problems a product addresses — it does not make them 'the kind of user' that product serves)",
      "what_the_work_involves": "What the work generally involves — one or two sentences, general knowledge about the field, calibrated because roles vary considerably by organization. Never state a general role description as a universal requirement ('a core part of how this work gets done') — describe what the work commonly involves instead",
      "worth_learning_more_about": "The single most important uncertainty about whether this direction matches what the visitor wants — one sentence, framed as a DIMENSION OF THE WORK to go find out about, not an imagined emotional reaction. Not 'would you find it frustrating if your work were acted on slowly' or 'do you prefer a shorter feedback loop' — those predict the visitor's reaction before they've seen any real information. Ask about the dimension itself instead, in a form job postings or people doing the work could actually answer — e.g. 'how much influence does this role have over what happens with its output, in the kinds of organizations you're considering', 'how long do projects tend to run, and how quickly does the work produce something you can evaluate or act on'. Let the visitor decide afterward whether the answer appeals to them. Do not use 'genuinely' before a personal-fit question",
      "one_way_to_investigate": "One specific, low-cost, feasible step that doesn't assume a job, access, or budget — one sentence. Point at primary sources (job postings, first-person accounts, a direct question to someone doing the work) rather than naming a specific company, unless the visitor themselves supplied that company or interest"
    }
  ]
}

RULES:
- Return exactly ${wantCount} directions — not a range, not padded, not trimmed.
- Maximize genuine difference between directions. Do not include two directions that are close variants of the same underlying role (e.g. "Technical Product Manager" and "Product Manager, Developer Tools" both competing for a slot) — pick the one that best fits, and note in one_way_to_investigate that variants can be compared once the visitor has chosen a general direction.
- Every "why_it_connects" must trace to something actually supplied (experience or stated interest), not a generic compliment.
- Do not assign a salary figure, salary change, demand rating, difficulty score, training time, or timeline anywhere — this step is about plausible directions, not a market or readiness analysis.
- Do not present directions as ordered by fit, likelihood, or strength. Whatever order you return them in carries no ranking meaning.
- Do not name specific companies as examples of who does this work, unless the visitor's own current role or interests already named that company or a very similar one. Point at job postings and first-person accounts instead of a curated company list.
- Do not claim a common entry path, typical background, easiest transition, growing field, or hiring demand ("many people come from X background," "strong hiring demand," "common transition path") — none of that has been verified for this request.
- Do not infer or imply: personality, aptitude, passion, natural fit, likelihood of success, employability, market demand, salary, transition difficulty, hiring probability, a hidden strength, or what the visitor will enjoy. These are for the visitor to discover, not for you to determine from a role and a skills paragraph.
- Never promote INTEREST into APTITUDE, EXPOSURE into PROFICIENCY, RELATED EXPERIENCE into QUALIFICATION, or a PLAUSIBLE DIRECTION into a RECOMMENDED CAREER.
${excludeList.length ? '- These are ADDITIONAL directions on top of ones already shown — return only new ones, never repeats.' : '- Include at least one direction that is not the obvious first guess, if one genuinely fits the supplied evidence.'}

NORTH STAR:
OPEN DOORS. DON'T CHOOSE ONE FOR THEM.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapExplore' });

    if (!parsed.directions) {
      return res.status(500).json({ error: 'Could not suggest directions. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'skill-gap-explore',
      fields: collectProseFields(parsed),
      supplied: prompt,
      promise: 'Suggest a small, varied set of plausible directions traceable to supplied experience and interests, without ranking them, inventing market data, or claiming fit, aptitude, or enjoyment the evidence cannot establish.',
      guard: router.outputGuard,
      userLanguage,
    });

    const nonBlank = (v) => typeof v === 'string' && v.trim().length > 0;
    parsed.directions = Array.isArray(parsed.directions)
      ? parsed.directions.filter(x => nonBlank(x?.target_role) && nonBlank(x?.why_it_connects)).slice(0, 6)
      : [];

    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapExplore] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 13: PROGRESS CHECK — Reassess readiness with updates
// ═══════════════════════════════════════════════════
router.post('/skill-gap-progress', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, originalGaps, completedSkills, newExperience, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!originalGaps?.length || !completedSkills?.length) {
      return res.status(400).json({ error: 'Original gaps and completed skills are required.' });
    }

    const gapCtx = originalGaps.map(g =>
      `${g.skill} (was: ${g.priority}, ${g.current_level} → ${g.target_level})`
    ).join('\n');

    const completedCtx = completedSkills.map(s => `- ${s}`).join('\n');

    const prompt = withLanguage(`Reassess this person's readiness for their career transition. They've been working on closing gaps — now give them an updated score and revised plan.

TRANSITION: ${currentRole?.trim() || 'Current'} → ${targetRole?.trim() || 'Target'}

ORIGINAL GAPS:
${gapCtx}

SKILLS THEY'VE COMPLETED/IMPROVED:
${completedCtx}

${newExperience?.trim() ? `NEW EXPERIENCE GAINED:\n"${newExperience.trim()}"` : ''}

Return ONLY valid JSON:
{
  "updated_readiness": {
    "score": 68,
    "improvement": "+23 points — one sentence",
    "summary": "Honest reassessment of where they stand now — 1-2 sentences"
  },
  "new_gaps_revealed": ["Any new gaps that have become apparent now that they know more — learning often reveals new unknowns"],
  "ready_to_apply": true,
  "apply_advice": "If ready: what to do this week. If not: what's left and how long. — one sentence",
  "celebration": "One specific thing they should feel good about — people in transition need encouragement — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage('You are a career transition coach doing a progress check. Be encouraging but honest — if they are not ready, say so kindly. If they are, celebrate them. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapProgress' });

    if (!parsed.updated_readiness) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapProgress] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 14: DAY IN THE LIFE — Simulate a typical day in target role
// ═══════════════════════════════════════════════════
router.post('/skill-gap-daylife', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { targetRole, transitionSummary, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!targetRole?.trim()) {
      return res.status(400).json({ error: 'Target role is required.' });
    }

    const prompt = withLanguage(`Simulate a realistic Tuesday in the target role. Not the highlight reel — the actual day, including the boring parts, the frustrating parts, and the moments that make the job worth it. Help this person figure out if they'd actually ENJOY this work.

TARGET ROLE: "${targetRole.trim()}"
TRANSITION FROM: ${transitionSummary?.from || 'Not specified'}

INSTRUCTIONS:
- Walk through a full day hour by hour (8am-6pm)
- Include specific tasks, meetings, tools, and interactions
- Include at least one frustrating moment and one rewarding moment
- Be honest about the parts nobody talks about in job descriptions
- Include decision moments where the user can imagine how they'd react

Return ONLY valid JSON:
{
  "role_reality": {
    "one_sentence": "What this job actually IS in one honest sentence — one sentence",
    "percent_meetings": 35,
    "percent_deep_work": 25,
    "percent_communication": 25,
    "percent_admin": 15
  },
  "schedule": [
    {
      "time": "8:30 AM — one sentence",
      "activity": "What you're doing — specific — one sentence",
      "detail": "The granular reality — tools, people, decisions — one sentence",
      "feeling": "How this typically feels — energizing|draining|neutral|stressful|satisfying",
      "decision_moment": "A choice you'd face here (or null if routine) — one sentence"
    }
  ],
  "the_frustration": {
    "scenario": "A specific frustrating thing that happens regularly in this role — one sentence",
    "how_good_ones_handle_it": "What experienced people in this role do about it — one sentence",
    "would_you_tolerate": "An honest question for the user to ask themselves — one sentence"
  },
  "the_reward": {
    "scenario": "The moment that makes people in this role say 'this is why I do this' — one sentence",
    "frequency": "How often this actually happens — daily|weekly|monthly|quarterly",
    "your_version": "How this reward would specifically manifest given the user's transition background — one sentence"
  },
  "reality_check": {
    "what_surprises_people": "The thing most people don't expect about this role — one sentence",
    "dealbreaker_test": "One question to ask yourself — if the answer is 'no', this role might not be for you — one sentence"
  }
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage('You are a career realist who shows people what jobs actually feel like day-to-day. Not the recruiting pitch — the truth. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapDayLife' });

    if (!parsed.role_reality) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapDayLife] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 15: OUTREACH DRAFTER — Personalized networking message
// ═══════════════════════════════════════════════════
router.post('/skill-gap-outreach', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, personDescription, goal, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!personDescription?.trim() || !targetRole?.trim()) {
      return res.status(400).json({ error: 'Describe the person and your target role.' });
    }

    const prompt = withLanguage(`Write a hyper-personalized cold outreach message to this specific person. NOT a template — a message that references their background and makes a specific, easy-to-say-yes-to ask.

SENDER: Transitioning from "${currentRole?.trim() || 'current role'}" to "${targetRole.trim()}"
RECIPIENT: "${personDescription.trim()}"
GOAL: ${goal?.trim() || 'Informational conversation about the transition'}

INSTRUCTIONS:
- Reference something specific about their background
- Make the ask small and specific (not "can I pick your brain")
- Keep it under 100 words
- Sound like a real person, not a networking bot
- Include a reason they'd want to respond

Return ONLY valid JSON:
{
  "message": "The complete outreach message — ready to send — 2-4 sentences",
  "subject_line": "Email subject line if applicable — one sentence",
  "platform": "LinkedIn|Email|Twitter — where to send this",
  "why_theyd_respond": "What makes this message worth responding to from their perspective — one sentence",
  "followup": "What to send if they don't respond in 5 days — 1 sentence",
  "if_they_say_yes": "What to prepare before the conversation — 2-3 specific things — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1500,
      system: withLanguage('You write networking messages that actually get responses. You sound human, specific, and respectful of the recipient\'s time. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapOutreach' });

    if (!parsed.message) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapOutreach] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 16: JOB POSTING DECODER — Analyze specific posting vs gaps
// ═══════════════════════════════════════════════════
router.post('/skill-gap-decode', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { jobPosting, currentRole, targetRole, skillGaps, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!jobPosting?.trim()) {
      return res.status(400).json({ error: 'Paste a job posting.' });
    }

    const gapCtx = skillGaps?.slice(0, 8).map(g =>
      `${g.skill} (${g.priority}, current: ${g.current_level})`
    ).join(', ') || '';

    const prompt = withLanguage(`Decode this job posting for a career transitioner. Tell them what's real, what's aspirational, what's a red flag, and how competitive they are for THIS specific job.

JOB POSTING:
"""
${jobPosting.trim().substring(0, 12000)}
"""

APPLICANT: Transitioning from "${currentRole?.trim() || 'current role'}" to "${targetRole?.trim() || 'target role'}"
KNOWN GAPS: ${gapCtx || 'Not assessed'}

Return ONLY valid JSON:
{
  "requirements_decoded": [
    {
      "requirement": "What they listed — one sentence",
      "reality": "must_have|strong_preference|nice_to_have|aspirational_wishlist",
      "your_status": "have_it|close|gap|major_gap",
      "translation": "What this requirement actually means in practice — one sentence"
    }
  ],
  "red_flags": [
    {
      "phrase": "Exact phrase from the posting — one sentence",
      "translation": "What this actually means — e.g., 'fast-paced' = understaffed — one sentence",
      "severity": "yellow|orange|red"
    }
  ],
  "green_flags": [
    {
      "phrase": "Positive signal from the posting — one sentence",
      "why_good": "Why this is good for a career transitioner specifically — one sentence"
    }
  ],
  "competitiveness": {
    "score": 62,
    "summary": "How competitive you are for this specific posting — honest — 1-2 sentences",
    "biggest_gap": "The single thing most likely to get you screened out — one sentence",
    "should_you_apply": "Yes, strong candidate|Yes, worth a shot|Maybe, if you...|Probably not, because..."
  },
  "application_strategy": {
    "cover_letter_angle": "The specific angle to take in your cover letter for THIS posting — one sentence",
    "resume_emphasis": "Which 2-3 experiences to highlight for THIS job specifically — one sentence"
  }
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage('You are a job posting analyst who decodes what companies actually want vs. what they write. You know the difference between must-haves and wishlist items. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapDecode' });

    if (!parsed.requirements_decoded) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapDecode] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 17: SKILL ADJACENCY — Learning sequence optimizer
// ═══════════════════════════════════════════════════
router.post('/skill-gap-adjacency', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { skillGaps, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!skillGaps?.length) {
      return res.status(400).json({ error: 'Run the gap analysis first.' });
    }

    const gapCtx = skillGaps.map(g => `${g.id}: ${g.skill} (${g.category})`).join(', ');

    const prompt = withLanguage(`Map the dependency relationships between these skills. Which skills unlock or accelerate other skills? What's the optimal learning SEQUENCE (not just priority)?

SKILLS TO SEQUENCE:
${gapCtx}

Return ONLY valid JSON:
{
  "optimal_sequence": [
    {
      "order": 1,
      "skill": "Skill name — 3-6 words",
      "why_first": "Why this should come before the others — one sentence",
      "unlocks_count": 3
    }
  ],
  "parallel_tracks": [
    {
      "track_name": "Track label — e.g., 'Technical foundation' — 3-6 words",
      "skills": ["Skills that can be learned simultaneously"],
      "reason": "Why these don't depend on each other — one sentence"
    }
  ],
  "bottleneck_skill": {
    "skill": "The single skill that blocks the most other skills — 3-6 words",
    "blocks": ["What it blocks"],
    "recommendation": "Front-load this — everything else gets easier after — one sentence"
  },
  "sequence_insight": "The non-obvious insight about learning order for this specific transition — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage('You are a learning sequence optimizer who maps dependencies between skills. You find the order that minimizes total learning time. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapAdjacency' });

    if (!parsed.optimal_sequence) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapAdjacency] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 18: MOCK CONVERSATION — AI plays interviewer
// ═══════════════════════════════════════════════════
router.post('/skill-gap-mock', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, userAnswer, question, interviewContext, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!targetRole?.trim()) {
      return res.status(400).json({ error: 'Target role is required.' });
    }

    // If no question yet, generate the first one
    if (!question) {
      const prompt = withLanguage(`You're interviewing a career transitioner for the role of "${targetRole.trim()}". They're coming from "${currentRole?.trim() || 'a different field'}".

Start the interview with the single most important question for this specific transition. Make it realistic — this is the question they'll face in every real interview.

Return ONLY valid JSON:
{
  "question": "The interview question — one sentence",
  "context": "What the interviewer is thinking — what they want to hear — 1-2 sentences",
  "difficulty": "opener|standard|probing|curveball",
  "category": "transition|technical|behavioral|situational"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

      const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage('You are a realistic interviewer for the target role. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapMockStart' });
      return res.json({ type: 'question', ...parsed });
    }

    // If user answered, evaluate and follow up
    const prompt = withLanguage(`You're interviewing someone transitioning from "${currentRole?.trim() || 'another field'}" to "${targetRole.trim()}".

QUESTION ASKED: "${question}"
THEIR ANSWER: "${userAnswer?.trim() || '(no answer provided)'}"
${interviewContext ? `PREVIOUS CONTEXT: ${interviewContext}` : ''}

Evaluate their answer and generate a follow-up question.

Return ONLY valid JSON:
{
  "evaluation": {
    "score": 72,
    "verdict": "Strong|Good|Needs work|Concerning",
    "what_worked": "The strongest part of their answer — be specific — one sentence",
    "coach_tip": "A concrete tip — e.g., 'Lead with the metric next time: 30% improvement, THEN the story' — one sentence",
    "rewritten_opener": "How the first sentence of their answer could be stronger — one sentence"
  },
  "next_question": {
    "question": "The follow-up question — either probing deeper on their answer or moving to a new topic — one sentence",
    "context": "What you're testing with this question — 1-2 sentences",
    "difficulty": "opener|standard|probing|curveball",
    "category": "transition|technical|behavioral|situational"
  }
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage('You are a supportive but honest interview coach. You evaluate answers realistically and give specific, actionable feedback. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapMockEval' });

    res.json({ type: 'evaluation', ...parsed });

  } catch (error) {
    console.error('[SkillGapMock] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 19: MARKET PULSE — Is this transition getting easier or harder?
// ═══════════════════════════════════════════════════
router.post('/skill-gap-market', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!targetRole?.trim()) {
      return res.status(400).json({ error: 'Target role is required.' });
    }

    const prompt = withLanguage(`Assess the current market dynamics for this career transition. Is it getting easier or harder? Should they accelerate or wait?

TRANSITION: "${currentRole?.trim() || 'Current'}" → "${targetRole.trim()}"

Return ONLY valid JSON:
{
  "market_outlook": {
    "trend": "Growing|Stable|Shrinking|Volatile",
    "direction": "Getting easier|Getting harder|Stable|Mixed signals",
    "confidence": "High|Medium|Low — how confident in this assessment"
  },
  "demand_factors": [
    {
      "factor": "Specific market factor affecting demand — one sentence",
      "impact": "positive|negative|neutral",
      "detail": "How this specifically affects the user's transition — one sentence"
    }
  ],
  "timing_advice": {
    "recommendation": "Accelerate|Stay on pace|Wait for...|Pivot to...",
    "reasoning": "Why this timing makes sense right now — one sentence",
    "window": "How long this market window is likely to stay open — one sentence"
  },
  "emerging_requirements": ["1-3 new skills or qualifications that are becoming more important for this role"],
  "declining_requirements": ["1-2 things that used to be required but matter less now"],
  "wildcard": "One unexpected market factor that could change everything — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage('You are a labor market analyst who tracks hiring trends and career transition dynamics. Be specific and honest about market conditions. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapMarket' });

    if (!parsed.market_outlook) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapMarket] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 20: MILESTONE CELEBRATION — Personalized achievement moment
// ═══════════════════════════════════════════════════
router.post('/skill-gap-celebrate', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, milestone, completedSkills, readinessScore, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!milestone?.trim()) {
      return res.status(400).json({ error: 'Milestone description required.' });
    }

    const prompt = withLanguage(`This person just hit a milestone in their career transition. Celebrate them! But make it real — not generic cheerleading. Reference what they've specifically accomplished.

TRANSITION: "${currentRole?.trim() || 'Current'}" → "${targetRole?.trim() || 'Target'}"
MILESTONE: ${milestone}
COMPLETED SKILLS: ${completedSkills?.join(', ') || 'Unknown'}
READINESS: ${readinessScore || 'Unknown'}%

Return ONLY valid JSON:
{
  "headline": "A short, punchy celebration headline — like a notification they'd want to see — one sentence",
  "message": "2-3 sentences acknowledging what they've accomplished — specific, not generic. Reference the actual skills.",
  "perspective": "Put this in perspective — how far they've come, what this means for their transition — one sentence",
  "next_nudge": "One gentle, encouraging push toward what's next — not a to-do, more a 'you know what would be cool next...' — one sentence",
  "shareable": "A one-sentence brag they could post on LinkedIn or tell a friend — makes their progress tangible — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage('You are an encouraging career coach who celebrates milestones with specific, genuine acknowledgment — not empty cheerleading. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapCelebrate' });

    if (!parsed.headline) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapCelebrate] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 21: WEEKLY NUDGE — This week's specific assignment
// ═══════════════════════════════════════════════════
router.post('/skill-gap-nudge', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { targetRole, skillGaps, completedSkills, timelinePhase, hoursPerWeek, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!skillGaps?.length) {
      return res.status(400).json({ error: 'Run the gap analysis first.' });
    }

    const completedCtx = completedSkills?.length ? `Already completed: ${completedSkills.join(', ')}` : '';
    const gapCtx = skillGaps.filter(g => !completedSkills?.includes(g.skill)).slice(0, 5).map(g =>
      `${g.skill} (${g.priority}, ~${g.time_estimate_hours}h total)`
    ).join(', ');

    const prompt = withLanguage(`Generate ONE specific, achievable assignment for this week. Not a vague goal — a concrete task with a clear deliverable that fits in ${hoursPerWeek || 5} hours.

TARGET: "${targetRole?.trim() || 'Target role'}"
REMAINING GAPS: ${gapCtx}
${completedCtx}
CURRENT PHASE: ${timelinePhase || 'Early'}
HOURS THIS WEEK: ${hoursPerWeek || 5}

Return ONLY valid JSON:
{
  "assignment": "One specific thing to do this week — concrete and verifiable — one sentence",
  "why_this_week": "Why this is the right thing to work on RIGHT NOW — one sentence",
  "time_estimate": "2-3 hours — one sentence",
  "deliverable": "What you should have at the end — a document, a project, a conversation, a certificate section — one sentence",
  "stretch_goal": "If you have extra time, also do this — one sentence",
  "motivation": "One sentence of encouragement — specific to where they are in the journey",
  "calendar_block": "Suggested calendar title and duration — e.g., 'SkillGapMap: SQL Practice (90 min)' — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1200,
      system: withLanguage('You are a focused accountability partner who gives one clear assignment per week. Never overwhelming — just the next right step. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapNudge' });

    if (!parsed.assignment) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapNudge] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 22: MENTOR MATCH — Describe the ideal mentor
// ═══════════════════════════════════════════════════
router.post('/skill-gap-mentor', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { currentRole, targetRole, skillGaps, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!currentRole?.trim() || !targetRole?.trim()) {
      return res.status(400).json({ error: 'Both roles required.' });
    }

    const topGaps = skillGaps?.slice(0, 4).map(g => g.skill).join(', ') || '';

    const prompt = withLanguage(`Describe the IDEAL mentor for this specific career transition. Not generic "find a mentor" advice — a detailed profile of exactly who would be most useful and why.

TRANSITION: "${currentRole.trim()}" → "${targetRole.trim()}"
TOP SKILL GAPS: ${topGaps || 'Not specified'}

Return ONLY valid JSON:
{
  "ideal_mentor_profile": {
    "background": "Specific career path they should have — e.g., 'Someone who went from marketing to PM, ideally at a Series B startup, within the last 3 years' — 1-2 sentences",
    "why_this_profile": "Why this specific background is most useful for your transition — one sentence",
    "seniority": "How senior — and why more senior isn't always better — one sentence",
    "red_flags": ["Types of mentors that sound good but won't actually help with THIS transition"]
  },
  "what_to_ask_them": [
    {
      "question": "Specific question for the first meeting — one sentence",
      "why": "What you'll learn from this question — one sentence",
      "what_to_listen_for": "The signal in their answer that tells you something actionable — one sentence"
    }
  ],
  "where_to_find_them": [
    {
      "channel": "Specific place to find this type of person — one sentence",
      "search_strategy": "How to search — specific filters, keywords, communities — one sentence"
    }
  ],
  "mentorship_structure": {
    "frequency": "How often to meet — and why more than monthly is usually too much — short phrase",
    "format": "Start with exactly Coffee, video or async, then an em dash, then two to four words on why it suits career-transition mentoring",
    "duration": "How long the mentorship should last — short phrase"
  },
  "alternative_to_formal_mentor": "If you can't find a formal mentor, here's how to get 80% of the value through other means — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage('You are a mentorship strategist who helps career transitioners find exactly the right person to guide them. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'SkillGapMentor' });

    if (!parsed.ideal_mentor_profile) {
      return res.status(500).json({ error: 'Could not map your skill gaps. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[SkillGapMentor] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
