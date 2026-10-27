// Research pre-pass for Signal vs. Noise.
//
// groundedFacts remains the shared search/cache primitive. This wrapper gives
// it a different policy: research a small set of open claims, preserve source
// metadata, and return a compact evidence packet that the main generation call
// can synthesize without live search.

const { groundedFacts, groundedData, groundedStatus, normalizeKeyPart } = require('./groundedFacts');

const RESEARCH_TTL_MS = Number(process.env.SIGNAL_RESEARCH_TTL_MS || 24 * 60 * 60 * 1000);
const COLD_WAIT_MS = Number(process.env.SIGNAL_RESEARCH_COLD_WAIT_MS || 60_000);
const SEARCH_TIMEOUT_MS = Number(process.env.SIGNAL_RESEARCH_TIMEOUT_MS || 150_000);
const MAX_USES = Number(process.env.SIGNAL_RESEARCH_MAX_USES || 6);

const { checkSourceLink } = require('./publicUrl');

function compact(s, n = 240) {
  return String(s || '').trim().replace(/\s+/g, ' ').slice(0, n);
}

// Blog and user-generated-content platforms are never admitted as sources,
// whatever the research pass labels them. Seen live on the first nutrition
// run: a Medium post sat in the packet as "high_quality_secondary" next to
// the BMJ and the Lancet, and it was not needed. The prompt says so too, but
// the packet is code-owned — a source on one of these hosts is dropped here,
// and any finding that then has no surviving source goes with it. Matched on
// the registrable host or any subdomain of it; a personal blog on its own
// domain is not caught (no list could be), which is what the prompt is for.
const BLOG_PLATFORM_HOSTS = [
  'medium.com', 'substack.com', 'blogspot.com', 'blogger.com', 'wordpress.com',
  'tumblr.com', 'ghost.io', 'dev.to', 'hashnode.dev', 'hubpages.com', 'vocal.media',
  'quora.com', 'reddit.com', 'pinterest.com', 'facebook.com', 'instagram.com',
  'tiktok.com', 'x.com', 'twitter.com', 'threads.net', 'linkedin.com', 'youtube.com',
];

function hostOf(url) {
  try { return new URL(url).hostname.toLowerCase(); } catch { return ''; }
}
function hostMatches(host, list) {
  return list.some(h => host === h || host.endsWith(`.${h}`));
}

function isBlogPlatformUrl(url) {
  const host = hostOf(url);
  return !!host && hostMatches(host, BLOG_PLATFORM_HOSTS);
}

// ── Source priority, enforced in the packet ─────────────────────────────
// The research pass labels each source; the tier is what the packet acts on.
//   1  systematic review / meta-analysis / primary peer-reviewed research
//   2  government, regulator, major public research institution, official data
//   3  authoritative professional body
//   4  everything else — secondary, explanatory, commercial-educational
// A finding that has ANY tier 1–3 support loses its tier-4 sources; a claim
// that has ANY tier 1–3 finding loses findings that rest on tier 4 alone; a
// source nothing cites any more leaves the packet. Tier 4 still counts when
// it is all the research found — the policy is "not when stronger sources
// are available", not "never".
const TIER_BY_TYPE = {
  systematic_review: 1, meta_analysis: 1, primary_study: 1,
  government: 2, regulator: 2, official_dataset: 2, methodology: 2,
  professional_body: 3,
  // Not peer-reviewed primary research, whatever host it sits on (ResearchGate,
  // SSRN, arXiv are hosts, not journals). Strong enough to inform a question,
  // not to carry a verdict alone — rule 20 in the synthesis prompt.
  thesis_or_preprint: 3,
  high_quality_secondary: 4, magazine_or_trade: 4, other: 4,
};
// Commercial educational, coaching, fitness, finance-explainer and advocacy
// sites the research pass has been seen (or is likely) to over-label as
// "professional body" or "primary". Whatever it calls them, they are tier 4
// here. Seen live: Precision Nutrition and ACE cited on a Signal card next
// to PubMed and a journal. Extend when one slips through; do not loosen.
const EXPLAINER_HOST_HINTS = [
  'precisionnutrition.com', 'acefitness.org', 'nasm.org', 'issaonline.com', 'infs.co.in',
  'healthline.com', 'webmd.com', 'medicalnewstoday.com', 'verywellhealth.com', 'verywellmind.com',
  'verywellfit.com', 'examine.com', 'mindbodygreen.com', 'menshealth.com', 'womenshealthmag.com',
  'shape.com', 'eatthis.com', 'livestrong.com', 'nerdfitness.com', 'bodybuilding.com',
  'muscleandstrength.com', 'draxe.com', 'goop.com',
  'investopedia.com', 'nerdwallet.com', 'thebalancemoney.com', 'fool.com', 'bankrate.com',
  'wikihow.com', 'wikipedia.org',
];

function tierOf(src) {
  if (hostMatches(hostOf(src.url), EXPLAINER_HOST_HINTS)) return 4;
  // A blog post on a company's own domain is an explainer whatever the domain
  // (seen: a wealth manager's /blog/ and BiggerPockets /blog/ labelled as
  // secondary support for a Signal conclusion).
  if (/\/blogs?\//i.test(String(src.url || ''))) return 4;
  return TIER_BY_TYPE[src.source_type] || 4;
}

// The page's five examples are translated, so one example arrives as 13
// different strings. `exampleId` (1-5, sent only when the form still holds an
// example unchanged) files them all under one key — the pinned seed entry
// scripts/warm-svn-examples.js ships, so an example never waits on a search.
const EXAMPLE_COUNT = 5;
function researchKey({ topic, conflictingAdvice, exampleId }) {
  const n = Number(exampleId);
  if (Number.isInteger(n) && n >= 1 && n <= EXAMPLE_COUNT) return `signal-research:example:${n}`;
  return `signal-research:${normalizeKeyPart(compact(topic, 100))}:${normalizeKeyPart(compact(conflictingAdvice, 180))}`;
}

function cleanPacket(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const sources = Array.isArray(raw.sources) ? raw.sources : [];
  const seen = new Set();
  const cleanSources = [];

  for (const src of sources) {
    const id = compact(src?.id, 20);
    const url = compact(src?.url, 600);
    if (!/^S\d+$/i.test(id) || !url || seen.has(id.toUpperCase())) continue;
    if (isBlogPlatformUrl(url)) continue;
    seen.add(id.toUpperCase());
    cleanSources.push({
      id: id.toUpperCase(),
      title: compact(src?.title, 220),
      publisher: compact(src?.publisher, 120),
      url,
      date: compact(src?.date, 40) || null,
      source_type: compact(src?.source_type, 60) || 'other',
      publisher_stake: (v => (v && v !== 'null' ? v : null))(compact(src?.publisher_stake, 160)),
    });
  }

  const validIds = new Set(cleanSources.map(s => s.id));
  const tierById = new Map(cleanSources.map(s => [s.id, tierOf(s)]));
  const strong = id => tierById.get(id) <= 3;

  const claims = (Array.isArray(raw.claims) ? raw.claims : []).slice(0, 6).map(c => {
    let findings = (Array.isArray(c?.findings) ? c.findings : []).slice(0, 5).map(f => {
      let ids = (Array.isArray(f?.source_ids) ? f.source_ids : [])
        .map(x => compact(x, 20).toUpperCase())
        .filter(id => validIds.has(id))
        .slice(0, 4);
      // Source priority within one finding: stronger sources present → the
      // explanatory ones are not needed to establish it.
      if (ids.some(strong)) ids = ids.filter(strong);
      const scope = {};
      for (const k of ['measure', 'population', 'period', 'excerpt']) { const v = compact(f?.[k], 240); if (v && v !== 'null') scope[k] = v; }
      if (Array.isArray(f?.figures_not_on_page) && f.figures_not_on_page.length) scope.figures_not_on_page = f.figures_not_on_page.slice(0, 6).map(x => compact(x, 20));
      return { text: compact(f?.text, 900), ...scope, source_ids: ids };
    }).filter(f => f.text && f.source_ids.length);
    // …and within one claim: a finding resting on tier 4 alone is dropped
    // when a sibling finding has stronger support.
    if (findings.some(f => f.source_ids.some(strong))) findings = findings.filter(f => f.source_ids.some(strong));
    // Secondary-only support is kept in the packet (it may be all the research
    // found) but named, so the synthesis can route the claim to "still worth
    // verifying" rather than present it as established — and sanitizeResult
    // in the route enforces that for Signal items regardless.
    const support = findings.some(f => f.source_ids.some(strong)) ? 'primary' : 'secondary_only';
    return {
      claim: compact(c?.claim, 500),
      assessment: ['supported', 'overstated', 'mixed', 'unresolved'].includes(c?.assessment) ? c.assessment : 'unresolved',
      support,
      findings,
      limits: (Array.isArray(c?.limits) ? c.limits : []).map(x => compact(x, 500)).filter(Boolean).slice(0, 4),
    };
  }).filter(c => c.claim && c.findings.length);

  // A source nothing cites any more (an explainer displaced by a journal, a
  // blog dropped above) leaves the packet, so the synthesis never sees it.
  const cited = new Set();
  for (const c of claims) for (const f of c.findings) for (const id of f.source_ids) cited.add(id);
  const citedSources = cleanSources.filter(s => cited.has(s.id));

  if (!citedSources.length || !claims.length) return null;
  return {
    // Stamped by us at fetch time, not taken from the model: its notion of
    // "today" is unreliable, and a date-only string ("2026-09-11") parses as
    // UTC midnight in the browser — which showed a check made this afternoon
    // as "Researched Yesterday" in US time zones. A full ISO timestamp does
    // not have that problem.
    researched_at: new Date().toISOString(),
    claims,
    sources: citedSources,
  };
}

// Figures worth checking on a page: decimals and numbers above 12, not years.
const normFig = f => { let x = f.replace(/[\s ]/g, ''); if (/^\d{1,3}([,.]\d{3})+$/.test(x)) x = x.replace(/[,.]/g, ''); else x = x.replace(',', '.'); return x.replace(/\.$/, ''); };
const normText = t => t.replace(/(\d)[,.](\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
function checkableFigures(text) {
  return [...new Set((String(text || '').match(/\d+(?:[,.]\d+)*/g) || []).map(normFig))]
    .filter(n => (/\./.test(n) || Number(n) > 12) && !/^(19|20)\d\d$/.test(n));
}
const hasFigure = (page, n) => new RegExp(`(?<![\\d.])${n.replace('.', '\\.')}(?![\\d]|\\.\\d)`).test(page);

// T13 (audit/DEFECT-TYPES.md): a source must still lead to the page holding
// its finding, dated as that page dates itself. Checked once per cached
// packet (the flag lives on the cached object). A dead link or one that now
// redirects to a home or section page is dropped, with the findings resting
// on it alone — unless that would leave nothing, when the packet is kept.
async function verifySources(stored) {
  if (!stored || stored.links_checked || !Array.isArray(stored.sources)) return;
  const results = await Promise.all(stored.sources.map(s => checkSourceLink(s.url)));
  stored.sources.forEach((s, i) => { if (results[i].date) s.date = results[i].date; });
  // A finding's figures must be on a page it cites. The research pass wrote
  // "10 to 20 percentage points" that no cited page held (owner's review,
  // 2026-10-27). Judged only when every cited page was read as text; a page
  // that could not be read (blocked, PDF, script-rendered) proves nothing.
  // Not dropped — a difference the pass computed is legitimately absent —
  // but marked, and the synthesis and checks treat it as not established.
  const textById = new Map(stored.sources.map((s, i) => [s.id, results[i].text && results[i].text.length > 3000 ? normText(results[i].text) : null]));
  let unseen = 0;
  for (const c of stored.claims || []) for (const f of c.findings || []) {
    const pages = (f.source_ids || []).map(id => textById.get(id));
    if (!pages.length || pages.some(p => !p)) continue;
    const missing = checkableFigures(f.text).filter(n => !pages.some(p => hasFigure(p, n)));
    if (missing.length) { f.figures_not_on_page = missing; unseen++; }
  }
  if (unseen) console.log(`[signal-vs-noise-research] ${unseen} finding(s) carry figures not found on their cited pages`);
  const kept = stored.sources.filter((s, i) => !['dead', 'moved'].includes(results[i].status));
  const dropped = stored.sources.length - kept.length;
  if (dropped && cleanPacket({ ...stored, sources: kept })) {
    stored.sources = kept;
    console.log(`[signal-vs-noise-research] dropped ${dropped} source(s) whose link is dead or moved`);
  }
  stored.links_checked = true;
}

function renderResearchBlock(packet) {
  if (!packet) return '';
  return `\n\nWEB RESEARCH PACKET — these are the ONLY outside-world findings you may present as researched facts. Every empirical conclusion must cite one or more source IDs from this packet. If the packet does not establish something, say it remains unresolved. A finding's figures_not_on_page were not found on the page it cites: do not state those figures as findings. A claim marked "support": "secondary_only" rests on explanatory or commercial sources alone — it may be reported as worth verifying, or a Noise item may note that only secondary sources were found, but it is never a Signal conclusion.\n${JSON.stringify(packet)}`;
}

// `coldWaitMs` overrides the default cold wait. The main route keeps the
// default (a researched answer or a 503); the /research status endpoint
// passes 0 so a poll returns immediately — cached packet or "pending" —
// while the fetch it just started runs on in the background.
// `force` = "check again with current sources": drop the cached packet for
// this topic and research afresh (paying the cold path on purpose).
async function claimResearch({ topic, conflictingAdvice, userContext, region, exampleId, coldWaitMs = COLD_WAIT_MS, force = false }) {
  const key = researchKey({ topic, conflictingAdvice, exampleId });
  const block = await groundedFacts({
    cacheKey: key,
    label: 'signal-vs-noise-research',
    ttlMs: RESEARCH_TTL_MS,
    coldWaitMs,
    force,
    timeoutMs: SEARCH_TIMEOUT_MS,
    maxTokens: 9000, // finding scope fields (2026-10-27) lengthen the packet
    maxUses: MAX_USES,
    system: `You are the research pre-pass for Signal vs. Noise. Use web search to investigate the visitor's ACTUAL competing claims. Prefer sources in this order when appropriate: systematic reviews/meta-analyses and primary research; government/public-health/regulatory sources; professional or standards bodies; official datasets; then high-quality secondary sources such as established news organizations or reference works. NEVER use blog platforms or user-generated content as a source — Medium, Substack, Blogspot, WordPress.com, Quora, Reddit, LinkedIn posts, YouTube, social media, or personal blogs on any domain — even when a post there summarizes research; go to the research it summarizes instead, or leave the point unresolved. Do not use commercial educational, coaching, fitness, nutrition-explainer, finance-explainer, advocacy, or general explanatory sites (Healthline, WebMD, Precision Nutrition, ACE, Examine, Investopedia, NerdWallet and their kind) to establish a conclusion when a primary study, review, government source, or professional body is available — and label such a site high_quality_secondary, never professional_body or primary_study. Label source_type by what the page actually is, not by how authoritative it sounds: a thesis, dissertation, preprint, working paper, or conference poster is thesis_or_preprint, not primary_study; a magazine, trade, or professional-publication article is magazine_or_trade; ResearchGate, SSRN, and arXiv are HOSTS — label the document, not the host. Do not use search-result snippets as evidence when a source page is available. Do not count sources as votes. Distinguish direct evidence from commentary. If credible sources disagree or evidence is thin, mark the claim mixed or unresolved. Never invent a source, title, URL, date, study result, or limitation. Return ONLY valid JSON. Never place a double-quote character inside any JSON string value.`,
    userPrompt: `Research the following topic with web_search as of today.

TOPIC:
${compact(topic, 1000)}

${conflictingAdvice ? `CLAIMS / CONFLICTING ADVICE:\n${compact(conflictingAdvice, 3000)}\n` : ''}
${userContext ? `VISITOR CONTEXT (use only to understand relevance; do not research or infer private facts):\n${compact(userContext, 1500)}\n` : ''}
${region ? `VISITOR REGION: ${compact(region, 120)}\n` : ''}

Keep every finding's scope exactly as its source states it: the measure (a growth rate is not a level; base pay is not gross pay; median is not average), the population (a top-100 ranking is not all graduates), the period (a January report is not an August one), the design and count (five studies are not five experiments). Never merge figures from different measures, populations or periods into one finding. A figure you cannot find on a source page you visited does not go in. The source's date is the date the page itself shows — never the date you searched. official_dataset is a statistical release or dataset itself; a company's commentary, blog or summary of its own data is magazine_or_trade or high_quality_secondary. Each url is the specific page holding the finding, never a site's home or section page.

Research only the claims actually raised or distinctions necessary to evaluate them. Aim for 2-4 strong sources per material claim, but fewer is correct when the evidence base does not support more. For health/science claims, prefer reviews, primary papers, government health agencies, and major professional bodies. For finance/economics, prefer regulators, official data, peer-reviewed research, and primary methodology documents. For law/policy, prefer statutes, regulators, courts, and government sources.

Return ONLY:
{
  "researched_at": "ISO date/time or date",
  "claims": [
    {
      "claim": "the visitor claim or a neutral decomposition of it",
      "assessment": "supported | overstated | mixed | unresolved",
      "findings": [
        {
          "text": "one calibrated empirical finding actually supported by the cited sources",
          "measure": "exactly what was measured, in the source's own terms (median annual base-pay growth; total cost of attendance; persistence after a difficult task) — or null",
          "population": "who or what it covers (job-changers in US private payrolls; graduates of the FT's top 100 schools; undergraduate participants) — or null",
          "period": "when the data is from, as the source states it (August 2026; within three years of graduating; 2021–2026) — or null",
          "excerpt": "the source's own words for the key figure or result, under 30 words — or null",
          "source_ids": ["S1", "S2"]
        }
      ],
      "limits": ["important limitation, disagreement, scope condition, or unresolved point actually supported by the research"]
    }
  ],
  "sources": [
    {
      "id": "S1",
      "title": "page or paper title actually visited",
      "publisher": "publisher / journal / organization",
      "url": "full URL actually visited",
      "date": "publication/update date if visible, otherwise null",
      "source_type": "systematic_review | meta_analysis | primary_study | government | regulator | professional_body | official_dataset | methodology | thesis_or_preprint | magazine_or_trade | high_quality_secondary | other",
      "publisher_stake": "a few words when the publisher is a company, industry association or advocacy group with an interest in the conclusion (a graduate-business-school association on whether business school pays) — otherwise null"
    }
  ]
}`,
    render: (raw) => {
      const packet = cleanPacket(raw);
      return packet ? { block: renderResearchBlock(packet), data: packet } : { block: '', data: null };
    },
  });

  const stored = block ? groundedData(key) : null;
  if (stored) await verifySources(stored);
  const packet = stored ? cleanPacket(stored) : null;
  // cleanPacket stamps "now" (right for a fresh search, whose own date is
  // unreliable); a cached packet keeps the stamp from when it was searched,
  // or "Researched today" would show on a search from yesterday — or October.
  if (packet && stored.researched_at) packet.researched_at = stored.researched_at;
  return { block: packet ? renderResearchBlock(packet) : '', packet, cacheKey: key };
}

// 'ready' | 'in_flight' | 'failed' | 'none' for the visitor's topic — see
// groundedStatus. Lets the readiness endpoint say "failed" instead of
// "pending" while the negative cache holds after a failed fetch.
function researchState({ topic, conflictingAdvice, exampleId }) {
  return groundedStatus(researchKey({ topic, conflictingAdvice, exampleId }));
}

module.exports = { claimResearch, researchState, verifySources, cleanPacket, researchKey, isBlogPlatformUrl, BLOG_PLATFORM_HOSTS, tierOf, EXPLAINER_HOST_HINTS };

// Self-check: node backend/lib/claimResearch.js --check
if (require.main === module && process.argv.includes('--check')) {
  const assert = require('assert');
  assert.deepStrictEqual(checkableFigures('In 2022, 10 to 20 percentage points; 4.7% vs 3.0%; 310,872 profiles; 3 studies'), ['20', '4.7', '3.0', '310872']);
  const page = normText('Job-changers saw 4.7% growth and stayers 3.0%, across 310,872 profiles.');
  assert.ok(hasFigure(page, '4.7') && hasFigure(page, '310872') && !hasFigure(page, '20') && !hasFigure(page, '47'));
  console.log('claimResearch ok');
  process.exit(0);
}
