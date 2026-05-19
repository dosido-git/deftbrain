const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { cleanJsonResponse, withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

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
      const idMatch = line.match(/^\s*id:\s*"([^"]+)"/);
      if (idMatch) {
        if (current && current.id) tools.push(current);
        current = { id: idMatch[1] };
        continue;
      }
      if (!current) continue;

      const titleMatch = line.match(/^\s*title:\s*"([^"]+)"/);
      const categoryMatch = line.match(/^\s*category:\s*"([^"]+)"/);
      const descMatch = line.match(/^\s*description:\s*"([^"]+)"/);
      const taglineMatch = line.match(/^\s*tagline:\s*"([^"]+)"/);
      const iconMatch = line.match(/^\s*icon:\s*"([^"]+)"/);

      if (titleMatch) current.title = titleMatch[1];
      if (categoryMatch) current.category = categoryMatch[1];
      if (descMatch) current.description = descMatch[1];
      if (taglineMatch) current.tagline = taglineMatch[1];
      if (iconMatch) current.icon = iconMatch[1];
    }
    if (current && current.id) tools.push(current);

    return tools.filter(t => t.id && t.title);
  } catch (err) {
    console.error('ToolFinder: Failed to load tool catalog:', err.message);
    return [];
  }
}

const TOOL_CATALOG = buildCatalog();

function catalogToString() {
  return TOOL_CATALOG.map(t =>
    `${t.icon || '🔧'} ${t.title} (/${t.id}) [${t.category}]: ${t.description || t.tagline || 'No description'}`
  ).join('\n');
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

    const systemPrompt = `DeftBrain tool guide. Recommend the best tools for the user's situation.

TOOL CATALOG:
${catalog}

RULES: Read between the lines — understand what they actually need, not just what they said. Recommend 1-5 tools ranked by fit (most problems need 1-3). Explain WHY each tool fits their specific situation. If tools work in sequence, describe the workflow. Be honest if no tool is a great fit. Exact tool IDs are case-sensitive URL paths — use them precisely.`;

    const parsed = await callClaudeWithRetry({
model: 'claude-haiku-4-5-20251001',
      max_tokens: 750,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{
        role: 'user',
        content: `My problem: ${problem}

Return ONLY valid JSON:
{
  "understanding": "1-2 sentences showing you understand their actual problem — not just restating it, but reading between the lines.",
  "recommendations": [
    {
      "id": "ExactToolId — one sentence",
      "title": "Tool Title — 3-6 words",
      "icon": "emoji",
      "category": "Category — one sentence",
      "why": "2-3 sentences explaining why THIS tool fits THEIR specific situation. Be specific, not generic.",
      "what_to_do": "One practical sentence: what to enter or select when they open this tool. — one sentence",
    }
  ],
  "workflow": "If multiple tools work best in sequence, explain the order and why. Otherwise null. — one sentence",
  "no_perfect_fit": "If nothing is ideal, explain what comes closest and what's missing. Otherwise null. — one sentence",
  "clarification": "If the problem was vague, what would help you recommend better? Otherwise null. — 1-2 sentences"
}`
      }],
    }, { label: 'tool-finder' });

    // Validate that recommended IDs actually exist
    if (parsed.recommendations) {
      parsed.recommendations = parsed.recommendations.filter(rec => {
        const exists = TOOL_CATALOG.some(t => t.id === rec.id);
        if (!exists) console.warn(`ToolFinder: AI recommended non-existent tool "${rec.id}"`);
        return exists;
      });
    }

    return res.json(parsed);

  } catch (error) {
    console.error('ToolFinder error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
