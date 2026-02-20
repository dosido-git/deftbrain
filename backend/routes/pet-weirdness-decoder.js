const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/pet-weirdness-decoder', async (req, res) => {
  console.log('✅ Pet Weirdness Decoder V2 endpoint called');
  
  try {
    const { 
      petType,
      breed,
      age,
      behavior,
      duration,
      frequency,
      otherChanges
    } = req.body;
    
    console.log('📝 Request:', { 
      petType,
      breed: breed || 'Not specified',
      age,
      duration,
      frequency,
      otherChanges: otherChanges || []
    });

    // Validation
    if (!petType) {
      return res.status(400).json({ error: 'Pet type is required' });
    }

    if (!age || age < 0) {
      return res.status(400).json({ error: 'Valid age is required' });
    }

    if (!behavior || behavior.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide a detailed behavior description (at least 20 characters)' });
    }

    const otherChangesText = otherChanges && otherChanges.length > 0 
      ? `Yes: ${otherChanges.join(', ')}` 
      : 'No other changes noted';

    const prompt = `You are a compassionate pet behavior expert with comprehensive breed knowledge and life stage expertise. Help anxious pet parents understand unusual behaviors while being medically responsible.

PET INFORMATION:
Type: ${petType}
Breed: ${breed || 'Not specified'}
Age: ${age} years old
Behavior Description: ${behavior}
Duration: ${duration}
Frequency: ${frequency}
Other Changes Noticed: ${otherChangesText}

COMPREHENSIVE ANALYSIS FRAMEWORK:

## 1. URGENCY ASSESSMENT WITH EMERGENCY CRITERIA

**CRITICAL - EMERGENCY INDICATORS (vet_now 🚨):**

CALL VET IMMEDIATELY OR GO TO EMERGENCY VET IF BEHAVIOR INVOLVES:

Respiratory Emergency:
- Difficulty breathing, gasping, choking
- Blue/pale gums or tongue
- Excessive panting with distress
- Open-mouth breathing (cats - always emergency)
- Labored breathing, chest heaving

Neurological Emergency:
- Seizures, convulsions, tremors
- Collapse, unconsciousness
- Disorientation, confusion (sudden onset)
- Head pressing against walls (sign of neurological pain)
- Circling compulsively, unable to stop
- Loss of balance, unable to stand

Gastrointestinal Emergency:
- Bloat (distended/hard abdomen + retching) - especially large/deep-chested dogs
- Bloody vomit or diarrhea
- Straining to defecate with no output for 24+ hours
- Foreign object ingestion (string, toy, sock)

Pain/Trauma:
- Severe pain (crying, biting when touched, can't move)
- Visible trauma, bleeding that won't stop
- Lameness (can't bear weight on leg)
- Hunched posture with reluctance to move

Toxicity:
- Known toxin ingestion (chocolate, xylitol, grapes, antifreeze, medications, rat poison)
- Sudden drooling, vomiting, weakness after eating/chewing something
- Plants: lilies (cats), sago palm, oleander

Other Emergency:
- Unable to urinate (especially male cats - can be fatal within hours)
- Pale/white gums
- Extreme lethargy with other symptoms
- Heatstroke (excessive panting, drooling, collapse)

**vet_soon** (⚠️ Schedule Within Days):
- Persistent symptoms (scratching, licking, head shaking)
- Limping for >24 hours
- Changes in bathroom habits
- Decreased appetite for several days
- New lumps or bumps
- Eye discharge, squinting
- Coughing, sneezing (persistent)
- Behavior change with other symptoms

**monitor** (🤔 Watch Closely):
- Unusual but not immediately concerning
- Could be stress, boredom, minor discomfort
- No other symptoms
- Recent within few days

**not_urgent** (😂 Normal Quirk):
- Typical for species/breed/age
- No medical concerns
- No other symptoms
- Quirky, funny, or breed-characteristic

## 2. COMPREHENSIVE BREED-SPECIFIC DATABASE

**DOGS - Breed Categories:**

**Herding Breeds** (Border Collie, Australian Shepherd, German Shepherd, Corgi, Sheltie):
- Common behaviors: Intense staring, circling people/animals, nipping at heels, "eye" (staring to control)
- Genetic predispositions: Hip dysplasia, eye issues (Collies), sensitivity to certain medications (MDR1 gene in herding breeds)
- Energy: VERY high, need jobs and mental stimulation
- Quirks: Obsessive behaviors, controlling, vocal

**Hound Breeds** (Beagle, Bloodhound, Basset, Greyhound, Dachshund):
- Common behaviors: Baying/howling, nose-to-ground obsession, selective hearing when scenting, strong prey drive
- Genetic predispositions: Back problems (Dachshunds), bloat (deep-chested), ear infections
- Quirks: "Hound voice", stubborn when scenting, independent

**Terrier Breeds** (Jack Russell, Bull Terrier, Yorkshire Terrier, Scottish Terrier):
- Common behaviors: Digging, high prey drive, "terrier shake", stubborn, feisty
- Genetic predispositions: Skin allergies, dental issues (small breeds)
- Energy: High, tenacious
- Quirks: Big personality in small body, fearless, mouthy

**Retriever/Sporting** (Golden Retriever, Labrador, Springer Spaniel, Setter):
- Common behaviors: Carrying objects constantly, gentle mouth, love of water, eager to please
- Genetic predispositions: Hip/elbow dysplasia, cancer (Goldens), obesity tendency
- Energy: High, need exercise
- Quirks: "Forever puppy" mentality, food-motivated, friendly to everyone

**Working Breeds** (Husky, Malamute, Rottweiler, Doberman, Great Dane):
- Common behaviors: High energy, strong, need jobs, vocal (Huskies)
- Genetic predispositions: Bloat (large breeds), heart issues (Dobermans), joint problems
- Quirks: Dramatic (Huskies), stubborn, protective

**Brachycephalic** (Pug, Bulldog, Boston Terrier, French Bulldog, Shih Tzu):
- Common behaviors: Snorting, reverse sneezing, overheating easily
- Genetic predispositions: Breathing issues, eye problems, heat sensitivity, spinal issues
- RED FLAG: Any breathing difficulty is MORE concerning in these breeds
- Quirks: Noisy breathers, heat-sensitive, snoring

**Toy/Small Breeds** (Chihuahua, Pomeranian, Maltese, Toy Poodle):
- Common behaviors: Shaking (not always fear), big personality, protective
- Genetic predispositions: Dental issues, tracheal collapse, luxating patella
- Quirks: "Small dog syndrome", can be feisty

**CATS - Breed Categories:**

**Siamese/Oriental:**
- Common behaviors: VERY vocal, demanding, dog-like, social
- Quirks: Will "talk" constantly, need attention
- Normal: Loud meowing, following you everywhere

**Maine Coon:**
- Common behaviors: Chirping/trilling, dog-like, gentle giants, water fascination
- Quirks: Large size, tufted ears, playful into adulthood
- Normal: Chirping instead of meowing

**Bengal:**
- Common behaviors: High energy, climbing, water play, vocalizations
- Quirks: Need lots of stimulation, athletic, "wild" appearance
- Normal: Extreme playfulness, water obsession

**Ragdoll:**
- Common behaviors: Going limp when picked up, laid-back, dog-like
- Quirks: Extremely gentle, follows owners
- Normal: Flopping/going limp (how they got their name!)

**Persian/Himalayan:**
- Common behaviors: Calm, quiet, indoor-oriented
- Genetic predispositions: Eye discharge (facial structure), breathing issues
- Quirks: Low-energy, calm temperament

**All Cats - Universal Behaviors:**
- Zoomies (3am typical - crepuscular hunters)
- Chattering at birds/prey
- Kneading ("making biscuits")
- Head bonks/bunting (affection + scent marking)
- Slow blinks ("I love you")
- Bringing "gifts"/dead animals (teaching you to hunt)
- Loaf position
- Knocking things off tables

**BIRDS:**

**Parrots** (African Grey, Amazon, Macaw):
- Common behaviors: Screaming for attention, mimicking, regurgitating (affection), feather plucking (stress)
- Quirks: Extremely intelligent, need mental stimulation
- RED FLAG: Feather plucking can indicate stress or medical issue

**Cockatiels:**
- Common behaviors: Whistling, head crest position communication, head bobbing
- Quirks: Males sing, females quieter
- Normal: Crest position shows mood

**Budgies/Parakeets:**
- Common behaviors: Beak grinding (contentment), regurgitating to mirror
- Quirks: Very social, need companionship

**RABBITS:**
- Common behaviors: Binkying (jumping for joy), circling feet (courtship), thumping (warning), chinning (scent marking), flopping (relaxation)
- Genetic predispositions: Dental issues, GI stasis (serious!)
- RED FLAG: Not eating for 12+ hours is EMERGENCY (GI stasis can be fatal)

## 3. LIFE STAGE ANALYSIS

**Puppy/Kitten** (0-1 year):
- Normal behaviors: Extreme energy, zoomies, play biting/scratching, chewing (puppies teething), short attention span, learning boundaries, "baby brain"
- Developmental stages: Fear periods (8-11 weeks, 6-14 months), socialization critical period
- What's normal: Mouthing, accidents, destructive chewing, high energy
- When to worry: Lethargy (should be energetic), not eating, vomiting/diarrhea

**Adolescent** (1-2 years):
- Normal behaviors: Testing boundaries, "selective hearing", increased independence, sexual maturity behaviors
- What's normal: Teenage attitude, energy surges, some regression in training
- Spay/neuter consideration: Behavioral changes expected after

**Adult** (1-7 years for small/medium, 1-5 for large breeds):
- Normal behaviors: Established personality, breed-typical behaviors fully emerged, most stable period
- What's normal: Consistent energy level, settled into routines
- When to worry: Sudden personality changes, new behaviors appearing out of nowhere

**Mature/Senior** (7+ years, earlier for giant breeds):
- Normal age changes: Sleeping more, moving slower, possible mild arthritis, graying, slower to get up
- Cognitive decline signs (can start 8-10 years): Disorientation, night waking/pacing, house soiling, decreased interaction, staring at walls
- When to worry: Rapid decline, severe confusion, loss of house training, bumping into things, not recognizing family
- IMPORTANT: Seniors can decline quickly - when in doubt with older pets, call vet sooner

**End of Life** (varies):
- Normal changes: More sleep, decreased appetite, decreased interest in activities, seeking quiet spots
- When to assess quality of life: More bad days than good, pain not controlled, not eating, unable to do favorite activities

## 4. VET VISIT PREPARATION SECTION

When urgency level is vet_soon or vet_now, provide:

**Questions to Ask Vet** (specific to behavior):
- Based on behavior, generate 4-6 specific questions
- Examples: "Do you see signs of ear infection?", "Could this be allergy-related?", "Is there pain when you palpate X area?"

**What to Observe Before Visit:**
- Specific things to track
- Frequency counting
- Triggers to identify
- Pattern to note

**Documentation Tips:**
- Video: "Capture full behavior from start to finish, including what happens right before and after. Date/time stamp if possible. Take multiple videos showing different instances."
- Photos: "For physical symptoms, take clear photos in good lighting. Multiple angles. Daily photos to show progression."
- Written log: "Track date, time, duration, what happened before/after, any other symptoms"

## 5. OUTPUT STRUCTURE (ENHANCED)

{
  "behavior_analysis": {
    "behavior_category": "normal quirk / attention-seeking / stress response / boredom / medical concern / cognitive issue / emergency",
    "urgency_level": "not_urgent / monitor / vet_soon / vet_now",
    "urgency_emoji": "😂 / 🤔 / ⚠️ / 🚨"
  },
  
  "breed_specific_info": {
    "is_breed_typical": true/false,
    "breed_explanation": "Detailed explanation of why this is/isn't typical for the breed",
    "common_breed_behaviors": [
      "Typical behavior 1 for this breed",
      "Typical behavior 2"
    ],
    "genetic_predispositions": [
      "Health issue this breed is prone to (relevant to behavior if applicable)",
      "Another predisposition to be aware of"
    ]
  },
  
  "life_stage_context": {
    "life_stage": "Puppy/Kitten / Adolescent / Adult / Senior",
    "age_appropriate": true/false,
    "stage_explanation": "What's normal for this life stage",
    "age_context": "Specific context about why this behavior does/doesn't fit this age"
  },
  
  "most_likely_explanation": {
    "what_it_is": "Clear explanation",
    "why_they_do_it": "Evolutionary/instinctual reason"
  },
  
  "other_possibilities": [
    {
      "explanation": "Alternative",
      "likelihood": "high/medium/low",
      "signs_that_suggest_this": ["indicator 1", "indicator 2"]
    }
  ],
  
  "when_to_worry": {
    "red_flags": [
      "Specific warning sign that requires immediate vet call",
      "Another red flag"
    ],
    "timeline": "Specific timeline: 'If continues more than 24 hours call vet' or 'Call vet now' or 'Monitor for 1 week, then schedule appointment if not improving'"
  },
  
  "vet_visit_prep": {
    "questions_to_ask": [
      "Specific question based on this behavior",
      "Another specific question"
    ],
    "what_to_observe": [
      "Specific thing to track before vet visit",
      "Another observation to make"
    ],
    "documentation_tips": "Specific video/photo/logging advice for THIS behavior"
  },
  
  "if_its_just_quirky": {
    "why_normal": "Reassuring explanation",
    "enrichment_suggestions": ["activity 1", "activity 2"],
    "enjoy_it": "Warm comment about appreciating the quirk"
  },
  
  "behavioral_modification": [
    {
      "if_you_want_to_change_it": "Whether possible/advisable",
      "how": "Training approach if applicable",
      "patience_required": "Realistic timeline"
    }
  ],
  
  "similar_pet_stories": "Brief community anecdote if relevant, or null"
}

## 6. CRITICAL ANALYSIS RULES

1. **Emergency Detection:**
   - ANY mention of breathing difficulty, seizures, bloat, toxins, collapse = IMMEDIATE vet_now
   - Multiple other changes (eating + energy + mood) = escalate urgency
   - Senior pets with new concerning behaviors = vet_soon minimum

2. **Breed Intelligence:**
   - Match behavior to known breed characteristics
   - Flag behaviors atypical for breed as more concerning
   - Note genetic predispositions relevant to behavior

3. **Age Context:**
   - Puppy zoomies = normal; senior sudden zoomies = investigate
   - Senior confusion at night = possible cognitive decline
   - Adult sudden behavior change = more concerning than gradual

4. **Other Changes Weight:**
   - Behavior alone = often quirky
   - Behavior + 1 other change = monitor
   - Behavior + 2-3 other changes = vet soon
   - Behavior + many changes + emergency signs = vet now

5. **Tone:**
   - Emergency: Clear, direct, "CALL VET NOW"
   - Vet soon: Firm but not alarming
   - Monitor: Calm, attentive
   - Normal quirk: Warm, celebratory

Return ONLY valid JSON with all required fields.`;

    console.log('🤖 Calling Claude API...');

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }]
    });

    console.log('✅ Claude API responded');

    // Extract text content
    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    
    // Robust JSON extraction
    let cleaned = textContent.trim();
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Find first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON object found in response');
    }
    
    // Extract only the JSON object
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    
    console.log('Cleaned JSON length:', cleaned.length);
    
    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Problematic JSON (first 500 chars):', cleaned.substring(0, 500));
      throw new Error('Failed to parse response as JSON: ' + parseError.message);
    }
    
    console.log('✅ Response parsed successfully');
    console.log('📊 Analysis:', {
      category: parsed.behavior_analysis?.behavior_category,
      urgency: parsed.behavior_analysis?.urgency_level,
      breed: parsed.breed_specific_info?.is_breed_typical,
      life_stage: parsed.life_stage_context?.life_stage
    });

    // Send response
    res.json(parsed);

  } catch (error) {
    console.error('❌ Pet Weirdness Decoder V2 error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to analyze pet behavior' 
    });
  }
});


module.exports = router;
