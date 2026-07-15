const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// Extract a single-line quoted field value, respecting WHICH quote character
// actually delimits the string (tools.js mixes ' and " across fields). A
// naive [^'"]+ character class excludes both quote types even when only one
// is the real delimiter, so any value containing an apostrophe — "don't",
// "it's", "you're" — got silently truncated right before it. The
// backreference (['"]) ... \1 pattern matches content up to the SAME quote
// that opened the string, allowing the other quote type through untouched.
function extractField(line, field) {
  const re = new RegExp(`^\\s*${field}:\\s*(['"])((?:(?!\\1)[^\\\\]|\\\\.)*)\\1`);
  const m = line.match(re);
  return m ? m[2] : null;
}

// ════════════════════════════════════════════════════════════
// LOAD TOOL CATALOG AT STARTUP
// Reads tools.js once and builds a condensed catalog string
// ════════════════════════════════════════════════════════════
function buildCatalog() {
  try {
    const toolsPath = path.join(__dirname, '../../src/data/tools.js');
    const content = fs.readFileSync(toolsPath, 'utf8');
    const tools = [];
    let current = null;

    for (const line of content.split('\n')) {
      const id = extractField(line, 'id');
      if (id) {
        if (current && current.id) tools.push(current);
        current = { id };
        continue;
      }
      if (!current) continue;

      const title = extractField(line, 'title');
      const categoriesMatch = line.match(/^\s*categories:\s*\[([^\]]*)\]/);
      const description = extractField(line, 'description');
      const tagline = extractField(line, 'tagline');
      const icon = extractField(line, 'icon');

      if (title) current.title = title;
      if (categoriesMatch) {
        const cats = categoriesMatch[1]
          .split(',')
          .map(c => c.replace(/['"]/g, '').trim())
          .filter(Boolean);
        if (cats.length) current.category = cats.join(', ');
      }
      if (description) current.description = description;
      if (tagline) current.tagline = tagline;
      if (icon) current.icon = icon;
    }
    if (current && current.id) tools.push(current);

    // Exclude Tool Finder from its own catalog — a user asking Tool Finder
    // for help is already using it, so "use Tool Finder" is a useless,
    // circular top recommendation.
    return tools.filter(t => t.id && t.title && t.id !== 'ToolFinder');
  } catch (err) {
    console.error('ToolFinder: Failed to load tool catalog:', err.message);
    return [];
  }
}

const TOOL_CATALOG = buildCatalog();
console.log(`🧰 ToolFinder: Loaded ${TOOL_CATALOG.length} tools into catalog`);

function catalogToString() {
  return TOOL_CATALOG.map(t => {
    // Use both tagline (marketing hook) and description (functional detail)
    // when they differ — a narrow tool's scope (e.g. "bicycle") often only
    // appears in one of the two, and giving the model just one halves its
    // chance of grounding a recommendation in what the tool actually covers.
    const blurb = [t.tagline, t.description].filter(Boolean)
      .filter((s, i, arr) => arr.indexOf(s) === i)
      .join(' — ') || 'No description';
    return `${t.icon || '🔧'} ${t.title} (/${t.id}) [${t.category || 'Uncategorized'}]: ${blurb}`;
  }).join('\n');
}

// ════════════════════════════════════════════════════════════
// POST /tool-finder — Recommend tools for a problem
// ════════════════════════════════════════════════════════════
router.post('/tool-finder', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { problem, userLanguage } = req.body;

    if (!problem?.trim()) {
      return res.status(400).json({ error: 'Describe your problem or situation and I\'ll find the right tools.' });
    }

    const catalog = catalogToString();

    const systemPrompt = `You are the guide for DeftBrain, a suite of ${TOOL_CATALOG.length}+ AI-powered tools. A user will describe a problem, situation, or need in plain language. Your job: recommend the best DeftBrain tools for their situation.

HERE IS THE COMPLETE TOOL CATALOG:
${catalog}

YOUR APPROACH:
1. Understand what the user actually needs — read between the lines.
2. Recommend 1-5 tools, ranked by relevance. Most problems need 1-3 tools.
3. For each recommendation, explain WHY this tool fits their specific situation — don't just repeat the description.
4. If multiple tools work together (e.g., research with one, then act with another), explain the workflow order.
5. Be honest: if NO tool actually addresses the user's problem (a true category gap — e.g. they need appliance repair and there's no appliance tool in the catalog), do NOT force a wrong-domain tool into "recommendations" just to have something to show. Leave "recommendations" empty and explain the gap in "no_perfect_fit" instead — name the closest tool there, in prose, only as a last-resort mention, never presented as "your best tool." Reserve "recommendations" for tools that genuinely help, even partially (e.g. a decision-paralysis tool for the stress of a broken appliance is a real, if partial, fit and belongs in "recommendations" normally).
6. Never recommend more than 5 tools — quality over quantity.
7. Match the user's energy. If they're stressed, be calm and direct. If they're curious, be enthusiastic.
8. NEVER generalize a tool's scope beyond what its catalog entry actually says. A tool named/described around one specific thing (e.g. bicycles) covers ONLY that thing, even for a vague problem — do not claim it also handles adjacent categories (appliances, cars, general objects) that aren't in its entry. If the vague problem could mean many different physical things, prefer a genuinely general tool over stretching a narrow one.

IMPORTANT:
- The tool IDs are case-sensitive and used as URL paths. Always return the exact ID from the catalog.
- Some problems genuinely benefit from multiple tools used in sequence. Flag these as a "workflow."
- If the problem is vague, still give your best recommendations but note what clarification would help.`;

    const userPrompt = `My problem: ${problem}

Return ONLY valid JSON:
{
  "understanding": "1-2 sentences showing you understand their actual problem — not just restating it, but reading between the lines.",
  "recommendations": [
    {
      "id": "ExactToolId",
      "title": "Tool Title",
      "icon": "emoji",
      "category": "Category",
      "why": "2-3 sentences explaining why THIS tool fits THEIR specific situation. Be specific, not generic.",
      "what_to_do": "One practical sentence: what to enter or select when they open this tool."
    }
  ],
  "workflow": "If multiple tools work best in sequence, explain the order and why. Otherwise null.",
  "no_perfect_fit": "If it's a true category gap (no tool in the catalog addresses this domain at all), explain what's missing here and mention the closest tool by name in this prose, as a last resort — do NOT also put that tool in 'recommendations'. Otherwise null.",
  "clarification": "If the problem was vague, what would help you recommend better? Otherwise null."
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'tool-finder' });

    if (!parsed.recommendations) {
      return res.status(500).json({ error: 'Could not find matching tools. Please try again.' });
    }

    // Validate that recommended IDs actually exist, and never let Tool Finder
    // recommend itself (excluded from the catalog above, but a defensive
    // second check here since this is the single worst possible result).
    parsed.recommendations = parsed.recommendations.filter(rec => {
      if (rec.id === 'ToolFinder') return false;
      const exists = TOOL_CATALOG.some(t => t.id === rec.id);
      if (!exists) console.warn(`ToolFinder: AI recommended non-existent tool "${rec.id}"`);
      return exists;
    });

    return res.json(parsed);

  } catch (error) {
    console.error('ToolFinder error:', error);
    res.status(500).json({ error: error.message || 'Failed to find tools' });
  }
});

module.exports = router;
