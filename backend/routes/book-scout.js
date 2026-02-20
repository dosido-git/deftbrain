const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/book-scout', async (req, res) => {
  try {
    const { interests, readingGoal, mood } = req.body;

    if (!interests && !readingGoal && !mood) {
      return res.status(400).json({ error: 'Please provide your interests, reading goal, or current mood' });
    }

    const prompt = `You are a book recommendation specialist.
INTERESTS: ${interests || 'General fiction'}
READING GOAL: ${readingGoal || 'Entertainment'}
MOOD: ${mood || 'Any'}

TASK: Recommend 3-5 books with specific reasons.

OUTPUT (JSON only):
{
  "recommendations": [
    {
      "title": "book title",
      "author": "author name",
      "genre": "genre",
      "why_this_book": "specific reason based on their interests/goal/mood",
      "similar_to": "comparable books/authors",
      "reading_time": "estimated time",
      "content_warnings": ["if any"],
      "where_to_find": "library/bookstore/free online"
    }
  ],
  "reading_strategy": "how to approach these books",
  "if_you_dont_like_these": "what to try instead"
}
Return ONLY valid JSON.`;
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });
    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) {
    console.error('BookScout error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
