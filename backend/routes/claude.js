// backend/routes/claude.js
// Generic Claude endpoint used by callClaude() on the frontend.
// Accepts a prompt, optional systemPrompt, model, and maxTokens.

const express = require('express');
const router = express.Router();
const { anthropic } = require('../lib/claude');

router.post('/claude', async (req, res) => {
  try {
    const {
      prompt,
      model = 'claude-sonnet-4-20250514',
      maxTokens = 2000,
      systemPrompt = null,
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const params = {
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    };

    if (systemPrompt) {
      params.system = systemPrompt;
    }

    const message = await anthropic.messages.create(params);

    const text = message.content.find(b => b.type === 'text')?.text || '';
    res.json({ response: text });

  } catch (error) {
    console.error('Generic Claude endpoint error:', error);
    res.status(500).json({ error: error.message || 'Failed to get response from Claude' });
  }
});

module.exports = router;
