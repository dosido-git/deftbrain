const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/jargon-assassin', async (req, res) => {
  try {
    const { documentText, documentType } = req.body;

    if (!documentText || !documentText.trim()) {
      return res.status(400).json({ error: 'Document text is required' });
    }

    const prompt = `You are a plain language expert who translates complex documents into 5th-grade reading level while preserving ALL critical information.

DOCUMENT TYPE: ${documentType || 'general'}

ORIGINAL DOCUMENT:
"""
${documentText}
"""

TRANSLATION REQUIREMENTS:
1. Maintain ALL factual content - do not omit any important details
2. Replace jargon with common words (e.g., "terminate" → "end", "pursuant to" → "according to")
3. Break long sentences into short ones (max 15-20 words per sentence)
4. Eliminate passive voice (e.g., "The contract must be signed" → "You must sign the contract")
5. Define necessary technical terms in parentheses
6. Use concrete examples for abstract concepts
7. Identify and flag:
   - Important sections that need attention
   - Decisions the reader needs to make
   - Unusual or concerning clauses
   - Critical dates and deadlines

OUTPUT FORMAT - Return ONLY valid JSON:
{
  "summary": "2-3 sentence summary of what this document is asking/telling you",
  "translation": "The full plain-language translation of the document",
  "reading_level": "estimated grade level (e.g., '5th grade')",
  "key_sections": [
    {
      "type": "important" | "decision" | "red_flag" | "deadline",
      "title": "Brief title",
      "original_text": "Original text from document",
      "simplified": "Plain language explanation",
      "why_it_matters": "Why this is flagged"
    }
  ],
  "glossary": [
    {
      "term": "technical term from document",
      "definition": "simple definition"
    }
  ],
  "checklist": [
    "Before you sign/agree, verify this...",
    "Make sure you understand...",
    "Check that..."
  ]
}

CRITICAL: Return ONLY the JSON object. No preamble, no markdown, no explanation.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    
    // Clean JSON
    let jsonText = textContent.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const firstBrace = jsonText.indexOf('{');
    if (firstBrace > 0) {
      jsonText = jsonText.substring(firstBrace);
    }
    
    const lastBrace = jsonText.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < jsonText.length - 1) {
      jsonText = jsonText.substring(0, lastBrace + 1);
    }
    
    jsonText = jsonText.trim();
    
    const parsed = JSON.parse(jsonText);
    res.json(parsed);

  } catch (error) {
    console.error('Jargon Assassin error:', error);
    
    if (error instanceof SyntaxError) {
      console.error('JSON Parse Error:', error.message);
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to translate document' 
    });
  }
});


module.exports = router;
