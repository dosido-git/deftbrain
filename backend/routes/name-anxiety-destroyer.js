const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/name-anxiety-destroyer', async (req, res) => {
  console.log('✅ Name Anxiety Destroyer V2.0 endpoint called');
  
  try {
    const { 
      nameToLearn, 
      context, 
      userLanguage,
      includeIPA = true,
      includeEtymology = true,
      includeFamousBearers = true,
      includeRegionalVariations = true
    } = req.body;
    
    console.log('📝 Request:', { nameToLearn, context, userLanguage });

    // Validation
    if (!nameToLearn || !nameToLearn.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const name = nameToLearn.trim();
    const additionalContext = context?.trim() || 'No additional context provided';
    const nativeLanguage = userLanguage || 'English (American)';

    const prompt = `You are a linguistic and cultural expert helping someone learn to pronounce a name correctly with cultural sensitivity and respect.

NAME TO LEARN: "${name}"
ADDITIONAL CONTEXT: ${additionalContext}
LEARNER'S NATIVE LANGUAGE: ${nativeLanguage}

TASK: Provide a comprehensive pronunciation guide with ENHANCED LINGUISTIC DEPTH and CULTURAL ENRICHMENT.

CRITICAL REQUIREMENTS - PRONUNCIATION:
1. Provide BOTH IPA (International Phonetic Alphabet) AND simplified phonetic spelling
2. Include primary AND secondary stress markers
3. Break down into syllables with clear stress indication
4. Compare to familiar sounds in ${nativeLanguage}
5. Identify 2-3 common mispronunciations with linguistic explanations
6. Note regional pronunciation variations when applicable
7. For tonal languages, explain tone patterns
8. For names with diacriticals (é, ñ, ü), explain each mark

CRITICAL REQUIREMENTS - CULTURAL DEPTH:
1. Full etymology and historical origin of the name
2. Linguistic evolution (how the name changed over time)
3. Famous bearers of this name (historical and contemporary)
4. Name day celebrations (if applicable in the culture)
5. Honorific usage norms by region
6. Cultural significance beyond just meaning
7. Similar-sounding names to avoid confusion

OUTPUT (JSON only):
{
  "name_analysis": {
    "name": "${name}",
    "origin": "detailed cultural/linguistic origin",
    "meaning": "meaning if known, or null"
  },
  "pronunciation": {
    "phonetic_spelling": "simplified phonetic for ${nativeLanguage} speakers (e.g., 'shiv-AWN')",
    "ipa_notation": "International Phonetic Alphabet notation (e.g., /ʃɪˈvɔːn/)",
    "syllable_breakdown": ["individual", "syllables", "separated"],
    "stress_pattern": "which syllable to emphasize with primary/secondary markers if applicable",
    "stress_markers": "detailed explanation of stress (e.g., 'Primary stress on second syllable, secondary on first')",
    "sounds_like": "comparison to familiar words in ${nativeLanguage}",
    "common_mistakes": [
      {
        "wrong": "common incorrect pronunciation",
        "why_wrong": "detailed linguistic explanation (phoneme substitution, etc.)",
        "correction": "how to fix with mouth/tongue position if needed"
      }
    ],
    "regional_variations": [
      {
        "region": "geographic region or dialect",
        "pronunciation": "how it's said in that region",
        "notes": "optional notes about the variation"
      }
    ]
  },
  "etymology": {
    "historical_origin": "detailed historical background of the name's origin",
    "linguistic_evolution": "how the name evolved linguistically over time, root words, etc.",
    "famous_bearers": [
      "Name and brief description of famous person 1",
      "Name and brief description of famous person 2",
      "Name and brief description of famous person 3"
    ],
    "name_day": "name day celebration info if applicable in the culture, or null",
    "cultural_significance": "deeper cultural meaning beyond the literal translation"
  },
  "cultural_context": {
    "name_order": "explanation of name order conventions",
    "honorifics": "titles or honorifics to know",
    "honorific_usage_by_region": "detailed regional variations in honorific usage (e.g., 'In Japan vs. Japanese-American communities')",
    "nickname_conventions": "is it okay to ask about nicknames? Cultural norms",
    "pronunciation_importance": "how much getting it right matters in this culture and why"
  },
  "practice_tips": [
    "Break it into syllables and practice each separately",
    "Record yourself and compare to native pronunciation",
    "Practice 10+ times for muscle memory",
    "Focus on the stressed syllable first",
    "specific linguistic tips based on the name's unique sounds"
  ],
  "similar_names": [
    {
      "name": "similar sounding name that's often confused",
      "difference": "key pronunciation difference to distinguish them"
    }
  ],
  "asking_permission_script": "A respectful, warm script for asking the person to help correct pronunciation",
  "confidence_builder": "Encouraging statement emphasizing respect and effort over perfection"
}

LINGUISTIC ANALYSIS DEPTH:
- Use IPA symbols accurately (e.g., /ʃ/ for 'sh', /ŋ/ for 'ng', /θ/ for 'th')
- Note phonemes that don't exist in ${nativeLanguage}
- Explain allophonic variations if relevant
- For tonal languages (Chinese, Vietnamese, Thai): explain tone contours
- For languages with vowel length: note long vs. short vowels
- Mark primary stress with ˈ and secondary stress with ˌ in IPA

CULTURAL ENRICHMENT DEPTH:
- Research actual historical figures with this name
- Include both ancient and modern bearers of the name
- Mention name day celebrations with specific dates when applicable
- Note any religious or spiritual significance
- Explain how honorific usage differs by region/generation
- Mention any cultural taboos or sensitivities around the name

SPECIAL CASES:
- Transliterated names: Note original script (Arabic, Cyrillic, Chinese characters, etc.)
- Compound names: Break down each element
- Names with silent letters: Explain why they're silent
- Gender-neutral names: Note this if applicable
- Names that change pronunciation by region: List major variations

TONE & APPROACH:
- Never say a name is "difficult" or "hard" - use "unfamiliar to ${nativeLanguage} speakers"
- Emphasize cultural pride and respect
- Acknowledge that even native speakers may vary
- Frame learning as a journey, not a test
- Include encouraging, confidence-building language

Generate a comprehensive, linguistically precise, culturally rich pronunciation guide. Return ONLY valid JSON.`;

    console.log('🤖 Calling Claude API with enhanced prompt...');

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500, // Increased for richer content
      messages: [{ role: 'user', content: prompt }]
    });

    console.log('✅ Claude API responded');

    // Extract and parse response
    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    
    // Clean JSON (remove markdown code blocks)
    let cleaned = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(cleaned);
    
    console.log('✅ Response parsed successfully with enhanced data');

    // Send response
    res.json(parsed);

  } catch (error) {
    console.error('❌ Name Anxiety Destroyer V2.0 error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to analyze name pronunciation' 
    });
  }
});


module.exports = router;
