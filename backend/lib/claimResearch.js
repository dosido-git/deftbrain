// Research pre-pass for Signal vs. Noise.
//
// groundedFacts remains the shared search/cache primitive. This wrapper gives
// it a different policy: research a small set of open claims, preserve source
// metadata, and return a compact evidence packet that the main generation call
// can synthesize without live search.

const { groundedFacts, groundedData, normalizeKeyPart } = require('./groundedFacts');

const RESEARCH_TTL_MS = Number(process.env.SIGNAL_RESEARCH_TTL_MS || 24 * 60 * 60 * 1000);
const COLD_WAIT_MS = Number(process.env.SIGNAL_RESEARCH_COLD_WAIT_MS || 60_000);
const SEARCH_TIMEOUT_MS = Number(process.env.SIGNAL_RESEARCH_TIMEOUT_MS || 100_000);
const MAX_USES = Number(process.env.SIGNAL_RESEARCH_MAX_USES || 6);

function compact(s, n = 240) {
  return String(s || '').trim().replace(/\s+/g, ' ').slice(0, n);
}

function researchKey({ topic, conflictingAdvice }) {
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
    seen.add(id.toUpperCase());
    cleanSources.push({
      id: id.toUpperCase(),
      title: compact(src?.title, 220),
      publisher: compact(src?.publisher, 120),
      url,
      date: compact(src?.date, 40) || null,
      source_type: compact(src?.source_type, 60) || 'other',
    });
  }

  const validIds = new Set(cleanSources.map(s => s.id));
  const claims = (Array.isArray(raw.claims) ? raw.claims : []).slice(0, 6).map(c => ({
    claim: compact(c?.claim, 500),
    assessment: ['supported', 'overstated', 'mixed', 'unresolved'].includes(c?.assessment) ? c.assessment : 'unresolved',
    findings: (Array.isArray(c?.findings) ? c.findings : []).slice(0, 5).map(f => ({
      text: compact(f?.text, 900),
      source_ids: (Array.isArray(f?.source_ids) ? f.source_ids : [])
        .map(x => compact(x, 20).toUpperCase())
        .filter(id => validIds.has(id))
        .slice(0, 4),
    })).filter(f => f.text && f.source_ids.length),
    limits: (Array.isArray(c?.limits) ? c.limits : []).map(x => compact(x, 500)).filter(Boolean).slice(0, 4),
  })).filter(c => c.claim && c.findings.length);

  if (!cleanSources.length || !claims.length) return null;
  return {
    researched_at: compact(raw.researched_at, 50) || new Date().toISOString(),
    claims,
    sources: cleanSources,
  };
}

function renderResearchBlock(packet) {
  if (!packet) return '';
  return `\n\nWEB RESEARCH PACKET — these are the ONLY outside-world findings you may present as researched facts. Every empirical conclusion must cite one or more source IDs from this packet. If the packet does not establish something, say it remains unresolved.\n${JSON.stringify(packet)}`;
}

async function claimResearch({ topic, conflictingAdvice, userContext, region }) {
  const key = researchKey({ topic, conflictingAdvice });
  const block = await groundedFacts({
    cacheKey: key,
    label: 'signal-vs-noise-research',
    ttlMs: RESEARCH_TTL_MS,
    coldWaitMs: COLD_WAIT_MS,
    timeoutMs: SEARCH_TIMEOUT_MS,
    maxTokens: 6500,
    maxUses: MAX_USES,
    system: `You are the research pre-pass for Signal vs. Noise. Use web search to investigate the visitor's ACTUAL competing claims. Prefer sources in this order when appropriate: systematic reviews/meta-analyses and primary research; government/public-health/regulatory sources; professional or standards bodies; official datasets; then high-quality secondary sources. Do not use search-result snippets as evidence when a source page is available. Do not count sources as votes. Distinguish direct evidence from commentary. If credible sources disagree or evidence is thin, mark the claim mixed or unresolved. Never invent a source, title, URL, date, study result, or limitation. Return ONLY valid JSON. Never place a double-quote character inside any JSON string value.`,
    userPrompt: `Research the following topic with web_search as of today.

TOPIC:
${compact(topic, 1000)}

${conflictingAdvice ? `CLAIMS / CONFLICTING ADVICE:\n${compact(conflictingAdvice, 3000)}\n` : ''}
${userContext ? `VISITOR CONTEXT (use only to understand relevance; do not research or infer private facts):\n${compact(userContext, 1500)}\n` : ''}
${region ? `VISITOR REGION: ${compact(region, 120)}\n` : ''}

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
      "source_type": "systematic_review | meta_analysis | primary_study | government | regulator | professional_body | official_dataset | methodology | high_quality_secondary | other"
    }
  ]
}`,
    render: (raw) => {
      const packet = cleanPacket(raw);
      return packet ? { block: renderResearchBlock(packet), data: packet } : { block: '', data: null };
    },
  });

  const packet = block ? cleanPacket(groundedData(key)) : null;
  return { block: packet ? renderResearchBlock(packet) : '', packet, cacheKey: key };
}

module.exports = { claimResearch, cleanPacket, researchKey };
