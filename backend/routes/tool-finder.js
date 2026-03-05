const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

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
console.log(`🧰 ToolFinder: Loaded ${TOOL_CATALOG.length} tools into catalog`);

function catalogToString() {
  return TOOL_CATALOG.map(t =>
    `${t.icon || '🔧'} ${t.title} (/${t.id}) [${t.category}]: ${t.description || t.tagline || 'No description'}`
  ).join('\n');
}

// ════════════════════════════════════════════════════════════
// POST /tool-finder — Recommend tools for a problem
// ════════════════════════════════════════════════════════════
router.post('/tool-finder', async (req, res) => {
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
5. Be honest: if no tool is a great fit, say so and suggest which tool comes closest.
6. Never recommend more than 5 tools — quality over quantity.
7. Match the user's energy. If they're stressed, be calm and direct. If they're curious, be enthusiastic.

IMPORTANT:
- The tool IDs are case-sensitive and used as URL paths. Always return the exact ID from the catalog.
- Some problems genuinely benefit from multiple tools used in sequence. Flag these as a "workflow."
- If the problem is vague, still give your best recommendations but note what clarification would help.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{
        role: 'user',
        content: `My problem: ${problem}

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
      "what_to_do": "One practical sentence: what to enter or select when they open this tool.",
      "relevance": "high | medium"
    }
  ],
  "workflow": "If multiple tools work best in sequence, explain the order and why. Otherwise null.",
  "no_perfect_fit": "If nothing is ideal, explain what comes closest and what's missing. Otherwise null.",
  "clarification": "If the problem was vague, what would help you recommend better? Otherwise null."
}`
      }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);

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
    res.status(500).json({ error: error.message || 'Failed to find tools' });
  }
});

module.exports = router;
