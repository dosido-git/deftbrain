const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/sensory-minefield-mapper', async (req, res) => {
  try {
    const { 
      location, 
      visitDateTime, 
      placeType, 
      sensitivities,
      accessibilityNeeds,
      specificTriggers,
      savedWarningSigns,
      successfulCoping
    } = req.body;

    console.log('📥 Sensory Mapper Enhanced request:', { location, visitDateTime, placeType });

    // Validation
    if (!location || !location.trim()) {
      return res.status(400).json({ error: 'Location is required' });
    }
    if (!visitDateTime) {
      return res.status(400).json({ error: 'Visit date and time are required' });
    }
    if (!placeType) {
      return res.status(400).json({ error: 'Place type is required' });
    }
    if (!sensitivities || sensitivities.length === 0) {
      return res.status(400).json({ error: 'At least one sensory sensitivity is required' });
    }

    // ENHANCED prompt with STRICT JSON formatting rules
    const prompt = `You are a comprehensive sensory environment analyst helping neurodivergent individuals predict and navigate sensory challenges.

LOCATION: ${location}
VISIT TIME: ${visitDateTime}
PLACE TYPE: ${placeType}
SENSORY SENSITIVITIES: ${sensitivities.join(', ')}
${accessibilityNeeds && accessibilityNeeds.length > 0 ? `ACCESSIBILITY NEEDS: ${accessibilityNeeds.join(', ')}` : ''}
${specificTriggers ? `SPECIFIC TRIGGERS: ${specificTriggers}` : ''}

Provide COMPREHENSIVE analysis with ALL sections below.

⚠️ CRITICAL JSON FORMATTING RULES - FOLLOW EXACTLY:
1. Return ONLY valid JSON - no markdown, no preamble, no explanatory text before or after
2. NO trailing commas - check EVERY array and object
3. Use double quotes for ALL strings, never single quotes
4. NO line breaks inside string values - use spaces instead
5. Limit each array to maximum 10 items to avoid complexity
6. Close ALL brackets and braces properly
7. Use simple string values - avoid nested quotes or special characters
8. Test the structure: every opened bracket must have a closing bracket

Return this COMPLETE structure:

{
  "location_analysis": {
    "location_name": "${location}",
    "expected_visit_time": "${visitDateTime}",
    "overall_sensory_rating": "moderate",
    "rating_explanation": "Brief explanation",
    "community_rating": "3.8 out of 5 from 24 users"
  },
  "sensory_factors": [
    {
      "factor": "Noise level",
      "predicted_level": "moderate 60-70 dB",
      "peak_times": ["checkout area", "entrance"],
      "your_sensitivity": "high",
      "coping_strategies": ["noise-canceling headphones", "visit during quiet hours", "use self-checkout"],
      "community_notes": "Users report checkout is loudest"
    },
    {
      "factor": "Crowd density",
      "predicted_level": "40 percent capacity",
      "peak_times": ["Saturday afternoons", "weekday evenings 5-7pm"],
      "your_sensitivity": "high",
      "coping_strategies": ["visit weekday mornings", "scout exits first", "take breaks"],
      "community_notes": "Much quieter before 11am"
    },
    {
      "factor": "Lighting",
      "predicted_level": "bright fluorescent throughout",
      "peak_times": ["entire store"],
      "your_sensitivity": "high",
      "coping_strategies": ["wear sunglasses", "visit during natural light hours", "limit time"],
      "community_notes": "Sunglasses help significantly"
    },
    {
      "factor": "Smells",
      "predicted_level": "moderate cleaning products and food",
      "peak_times": ["morning cleaning", "food sections"],
      "your_sensitivity": "medium",
      "coping_strategies": ["avoid food court", "fresh air breaks", "visit afternoon"],
      "community_notes": "Cleaning smell strongest before 10am"
    },
    {
      "factor": "Visual chaos",
      "predicted_level": "high - many signs and movement",
      "peak_times": ["promotional areas", "main aisles"],
      "your_sensitivity": "high",
      "coping_strategies": ["make specific list", "avoid browsing", "focus on task"],
      "community_notes": "Perimeter aisles less chaotic"
    }
  ],
  "accessibility_information": {
    "wheelchair_accessible": true,
    "details": "Automatic doors at entrance, wide aisles, accessible checkout lanes",
    "accessible_bathrooms": [
      {
        "location": "Near customer service front of store",
        "features": "Single-stall grab bars automatic door",
        "distance_from_entrance": "50 feet"
      }
    ],
    "elevator_access": "Single floor no elevator needed",
    "service_animal_policy": "Service animals welcome staff trained",
    "accessible_parking": {
      "available": true,
      "number_of_spots": "8 spots",
      "proximity": "20-30 feet to automatic doors"
    },
    "sensory_friendly_features": "Quiet hours Tuesdays 8-9am reduced lighting no music"
  },
  "visual_mapping": {
    "quietest_areas": [
      {
        "area": "Garden section",
        "location_description": "Back left corner",
        "why_quiet": "Low traffic natural light open space",
        "distance_from_entrance": "200 feet straight back then left"
      },
      {
        "area": "Home goods aisle",
        "location_description": "Center back",
        "why_quiet": "Less popular wide aisles",
        "distance_from_entrance": "150 feet straight back"
      }
    ],
    "escape_routes": [
      {
        "route_name": "Garden section path",
        "description": "From entrance go straight back turn left at sporting goods",
        "accessibility": "Fully wheelchair accessible wide aisles",
        "estimated_time": "2 minutes from entrance"
      },
      {
        "route_name": "Side exit emergency",
        "description": "East side near electronics",
        "accessibility": "Exit only alarm will sound",
        "estimated_time": "If overwhelmed use immediately"
      }
    ],
    "bathroom_locations": [
      {
        "name": "Main accessible bathroom",
        "description": "Front left near customer service",
        "accessibility": "Single-stall fully accessible private",
        "from_entrance": "30 feet turn left"
      }
    ],
    "outdoor_access": [
      {
        "location": "Main entrance patio",
        "description": "Covered area with benches",
        "when_available": "Always accessible",
        "use": "Quick fresh air break"
      }
    ],
    "parking_to_entrance": {
      "accessible_route": "Spots adjacent to entrance curb cut automatic doors",
      "distance": "20-30 feet",
      "obstacles": "None fully paved"
    }
  },
  "optimal_visit_time": {
    "recommended": "Tuesday 10:00am",
    "why": "Lowest crowd 25 percent capacity post-opening calm natural light",
    "crowd_reduction": "70 percent less crowded than Saturday 6pm",
    "accessibility_note": "Accessible parking least crowded before 11am"
  },
  "preparation_strategies": {
    "before_you_go": [
      "Make specific list minimize browsing",
      "Bring noise-canceling headphones",
      "Bring sunglasses for lights",
      "Eat first low blood sugar increases sensitivity",
      "Screenshot this map for offline access"
    ],
    "during_visit": [
      "Scout escape routes first",
      "Take breaks every 15 minutes",
      "Use headphones even without music",
      "Stick to list avoid browsing",
      "Set 30 minute time limit"
    ],
    "exit_strategy": "Leave immediately if warning signs appear no guilt about abandoned cart"
  },
  "real_time_checkin": {
    "check_frequency": "Every 10-15 minutes",
    "questions_to_ask_yourself": [
      "Is my jaw or shoulders tense",
      "Am I feeling irritable",
      "Is it harder to make decisions than when I arrived",
      "Do sounds feel louder than 10 minutes ago",
      "Do I have an urge to leave"
    ],
    "if_yes_to_2_or_more": "Go to escape route immediately for 5 minute break then reevaluate",
    "emergency_protocol_triggers": [
      "Feeling panicked or desperate to leave",
      "Physical pain from sensory input",
      "Shutdown approaching feeling disconnected",
      "Meltdown warning signs appearing"
    ]
  },
  "emergency_protocols": {
    "if_worse_than_predicted": [
      "Use nearest escape route immediately",
      "Exit to outdoor patio or parking lot",
      "Do not try to finish shopping leave cart",
      "Call support person if available"
    ],
    "nearby_recovery_locations": [
      {
        "location": "Riverside Park",
        "distance": "0.3 miles 5 minute drive",
        "why": "Quiet natural benches accessible",
        "accessibility": "Wheelchair paths accessible bathrooms"
      },
      {
        "location": "Your car in parking lot",
        "distance": "Immediate",
        "why": "Private controlled environment",
        "tip": "Keep comfort items in car"
      }
    ],
    "exit_script": "If staff ask - I am fine just needed to step out OR Sensory overload I need to leave"
  },
  "warning_signs_to_monitor": [
    "Jaw or shoulder tension",
    "Irritability",
    "Decision difficulty",
    "Sounds feeling louder",
    "Urge to escape",
    "Physical discomfort"
  ],
  "accommodation_requests": [
    {
      "what_to_ask": "Quieter checkout lane",
      "how_to_ask": "Is there a quieter checkout available",
      "likelihood_granted": "high"
    },
    {
      "what_to_ask": "Store map",
      "how_to_ask": "Do you have a map I can use",
      "likelihood_granted": "medium"
    }
  ],
  "backup_plan": "If overwhelmed abandon cart use nearest exit no guilt. Order online or visit during quiet hours Tuesday 8-9am.",
  "post_visit_report_template": {
    "questions": [
      "Overall Better Same or Worse than predicted",
      "Noise level Accurate Louder or Quieter",
      "Crowd level Accurate More or Less crowded",
      "Did you use escape routes Were they helpful",
      "Did you need to leave early At what point",
      "What worked from prep strategies",
      "What would you change for next time",
      "Would you recommend this location and time to others"
    ],
    "share_with_community": true,
    "improves_your_predictions": true
  }
}

Remember: NO trailing commas. Check every array and object before returning.`;

    console.log('🤖 Calling Claude API for enhanced analysis...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,  // Increased for full enhanced response
      messages: [{ role: 'user', content: prompt }]
    });

    console.log('✅ Received response, parsing JSON...');

    // ULTRA-ROBUST JSON PARSING
    let jsonText = message.content[0].text.trim();
    
    console.log('📝 Raw response length:', jsonText.length, 'characters');
    
    // Step 1: Remove markdown code blocks
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '').replace(/```/g, '');
    
    // Step 2: Remove any preamble or postamble text
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      console.error('❌ No JSON braces found in response');
      throw new Error('No JSON structure found in AI response');
    }
    
    jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    
    // Step 3: Aggressive JSON cleaning
    console.log('🧹 Cleaning JSON...');
    
    // Remove trailing commas before } or ]
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
    
    // Remove multiple consecutive commas
    jsonText = jsonText.replace(/,+/g, ',');
    
    // Fix common quote issues - replace smart quotes with straight quotes
    jsonText = jsonText.replace(/[""]/g, '"');
    jsonText = jsonText.replace(/['']/g, "'");
    
    // Remove line breaks inside strings (between quotes)
    // This regex finds strings and removes \n inside them
    jsonText = jsonText.replace(/"([^"]*)\n([^"]*)"/g, '"$1 $2"');
    
    // Remove any control characters that might break JSON
    jsonText = jsonText.replace(/[\x00-\x1F\x7F]/g, '');
    
    console.log('✨ Cleaned JSON length:', jsonText.length, 'characters');
    
    // Step 4: Attempt to parse
    let results;
    let parseAttempt = 1;
    const maxAttempts = 3;
    
    while (parseAttempt <= maxAttempts) {
      try {
        console.log(`🔍 Parse attempt ${parseAttempt}/${maxAttempts}...`);
        results = JSON.parse(jsonText);
        console.log('✅ JSON parsed successfully on attempt', parseAttempt);
        break;
        
      } catch (parseError) {
        console.error(`❌ Parse attempt ${parseAttempt} failed:`, parseError.message);
        
        if (parseAttempt === maxAttempts) {
          // Final attempt failed - show detailed error info
          const match = parseError.message.match(/position (\d+)/);
          if (match) {
            const errorPos = parseInt(match[1]);
            const contextStart = Math.max(0, errorPos - 200);
            const contextEnd = Math.min(jsonText.length, errorPos + 200);
            
            console.error('\n' + '='.repeat(60));
            console.error('CONTEXT BEFORE ERROR:');
            console.error(jsonText.substring(contextStart, errorPos));
            console.error('\n>>> ERROR AT THIS POSITION <<<\n');
            console.error('CONTEXT AFTER ERROR:');
            console.error(jsonText.substring(errorPos, contextEnd));
            console.error('='.repeat(60) + '\n');
          }
          
          throw new Error(`JSON parse failed after ${maxAttempts} attempts: ${parseError.message}`);
        }
        
        // Try additional cleaning for next attempt
        if (parseAttempt === 1) {
          // Second attempt: try fixing unescaped quotes in strings
          jsonText = jsonText.replace(/([^\\])"([^",:}\]]*)"([^,:}\]]*)/g, '$1\\"$2\\"$3');
        } else if (parseAttempt === 2) {
          // Third attempt: try removing problematic characters entirely
          jsonText = jsonText.replace(/[^\x20-\x7E\n\r\t]/g, '');
        }
        
        parseAttempt++;
      }
    }

    // Step 5: Validate structure
    const requiredFields = ['location_analysis', 'sensory_factors', 'backup_plan'];
    const missingFields = requiredFields.filter(field => !results[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Invalid response structure - missing required fields: ${missingFields.join(', ')}`);
    }

    console.log('✅ Validation passed - all required fields present');
    console.log('📊 Response includes', Object.keys(results).length, 'main sections');
    
    res.json(results);

  } catch (error) {
    console.error('❌ Sensory Minefield Mapper Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze location',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


module.exports = router;
