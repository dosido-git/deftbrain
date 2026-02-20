const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/email-urgency-triager', async (req, res) => {
  console.log('✅ Email Urgency Triager V2 endpoint called');
  
  try {
    const { 
      emailContent, 
      userRole, 
      userTimezone,
      senderHistory 
    } = req.body;
    
    console.log('📝 Request:', { 
      userRole, 
      userTimezone,
      emailLength: emailContent?.length,
      learnedSenders: Object.keys(senderHistory || {}).length
    });

    // Validation
    if (!emailContent || !emailContent.trim()) {
      return res.status(400).json({ error: 'Email content is required' });
    }

    const role = userRole || 'Employee';
    const timezone = userTimezone || 'UTC';
    const emails = emailContent.trim();
    const history = senderHistory || {};

    const prompt = `You are an advanced email urgency analyzer with AI learning capabilities. Analyze emails with:
1. **Thread intelligence** - detect escalation patterns
2. **Sender profiling** - use historical patterns to detect "cry wolf" senders
3. **Auto-categorization** - FYI vs Action Required vs Response Expected
4. **Smart scheduling** - timezone-aware response timing

USER ROLE: ${role}
USER TIMEZONE: ${timezone}
CURRENT TIME: ${new Date().toISOString()}

EMAILS TO ANALYZE:
${emails}

SENDER HISTORY (learned patterns):
${Object.keys(history).length > 0 ? JSON.stringify(history, null, 2) : 'No history yet'}

ANALYSIS FRAMEWORK:

## 1. THREAD INTELLIGENCE
Analyze the full email thread, not just latest message:

**Thread Detection:**
- Look for "Re:", "Fwd:", ">" quote markers, "On [date], [sender] wrote:"
- Count messages in thread
- Detect if user is on TO line vs CC line (TO = higher urgency)
- Track follow-up frequency

**Escalation Detection:**
- 1st message = baseline urgency
- 2nd follow-up = slight increase
- 3rd follow-up = significant escalation
- 4+ follow-ups = URGENT (shows frustration/importance)

**Patterns:**
- "Re: Re: Re:" = long thread, likely escalating
- "Following up on..." = 2nd+ attempt to get response
- "Gentle reminder" → "Second reminder" → "Final reminder" = clear escalation
- Increasing ALL CAPS or exclamation marks = escalating emotion

## 2. SENDER PROFILING
Use sender history to adjust urgency:

**Cry Wolf Detection:**
If sender has pattern:
- markedUrgent > 50% of emails
- actuallyUrgent < 20% of emails
- cryWolfScore > 0.5

Then: Downgrade their urgency claims. Example:
"Sender marks everything URGENT but only 15% actually are. Treating as THIS_WEEK despite subject line."

**VIP Identification:**
If sender has pattern:
- actuallyUrgent / total > 70%

Then: Upgrade priority. Example:
"This sender's emails are urgent 80% of the time. Treating seriously even though subject seems casual."

**New Senders:**
No history = trust subject line signals at face value, but note: "New sender - learning pattern"

## 3. AUTO-CATEGORIZATION
Categorize every email:

**FYI (no response needed):**
- "FYI", "For your information", "Keeping you in the loop"
- "No action needed"
- User is CC'd, not TO'd
- Meeting notes, status updates without questions

**Action Required (must DO something, not just reply):**
- "Please approve", "Review and sign", "Complete this form"
- Task assignment: "Can you handle X"
- Deadline-driven tasks

**Response Expected (social/professional courtesy):**
- Direct questions to user
- Meeting invitations requiring RSVP
- Requests for input/feedback
- "What do you think?"

**Automated (system-generated):**
- From: noreply@, no-reply@, automated@
- Calendar notifications
- System alerts

**Newsletter (marketing/promotional):**
- Contains "Unsubscribe" link
- Weekly/monthly recurring content
- Marketing copy tone
- From known newsletter domains

## 4. RESPONSE OPTIMIZATION

**Timezone-Aware Scheduling:**
- Detect recipient timezone from:
  * Email signature
  * Domain (.co.uk = UK, .de = Germany)
  * Explicit mentions ("I'm in London", "PST here")
  * Business hours references

- Suggest response time when recipient is likely available:
  * EU recipients: Respond by 11am user time (before they leave for day)
  * Asia recipients: Respond after 5pm user time (start of their day)
  * US East Coast from West Coast: Morning or late afternoon work

**Time Estimation:**
- Quick acknowledge: "5 min"
- Thoughtful response: "30 min"
- Research required: "1-2 hours"

**Batching Suggestions:**
- Group similar emails: "All client questions", "All feedback requests"
- Suggest batch timing: "Handle all tomorrow 2-3pm"

**Delegation Detection:**
- "Can someone review..." = delegate to team
- Technical issue outside your expertise = delegate to tech team
- Routine task others could handle = note delegation opportunity

URGENCY TIERS:

**NOW (reply today):**
- Explicit deadline within 24 hours
- Business-critical (systems down, revenue impact)
- Thread with 3+ escalating follow-ups
- Blocking someone's work RIGHT NOW
- VIP sender with deadline

**THIS_WEEK (reply within 3-5 days):**
- Deadline within week
- Important but not blocking immediately
- Routine business requests
- Single follow-up (not yet escalated)

**OPTIONAL (no response needed):**
- FYI emails
- Newsletters/marketing (ALWAYS optional)
- Automated notifications
- "Just checking in" with no ask
- User is CC'd not TO'd

OUTPUT (JSON only):
{
  "urgency_analysis": [
    {
      "email_subject": "subject",
      "from": "sender email",
      "urgency_tier": "now / this_week / optional",
      "email_category": "FYI / Action Required / Response Expected / Automated / Newsletter",
      "reasoning": "why this tier and category - reference thread/sender history if relevant",
      "sender_marked_urgent": true/false,
      "thread_analysis": {
        "follow_up_count": 0,
        "is_escalating": false,
        "urgency_trend": "description if escalating",
        "on_cc": false
      },
      "deadline_detected": "deadline or null",
      "consequence_of_delay": "what happens if you wait",
      "response_optimization": {
        "best_time": "When to respond with timezone consideration",
        "recipient_timezone": "detected timezone or null",
        "estimated_time": "5 min / 30 min / 1-2 hours",
        "can_delegate": true/false,
        "delegate_to": "who/what role" or null
      }
    }
  ],
  "summary": {
    "total_emails": 0,
    "urgent_count": 0,
    "this_week_count": 0,
    "optional_count": 0
  },
  "batch_insights": {
    "similar_emails": ["Batch description 1", "Batch description 2"],
    "delegation_opportunities": "Summary of delegatable emails"
  },
  "anxiety_relief": {
    "permission_to_wait": "Reassuring message",
    "what_to_ignore": "List of ignorable emails",
    "batch_processing_tip": "Batching strategy"
  },
  "response_templates": [
    {
      "for_urgency": "type",
      "template": "Quick response template"
    }
  ]
}

CRITICAL RULES:
1. **Thread Escalation:** 3+ follow-ups = automatic upgrade to NOW
2. **Cry Wolf Override:** High cry wolf score = downgrade urgency claims
3. **VIP Priority:** High actual urgency rate = upgrade priority
4. **CC vs TO:** CC = lower urgency than TO (unless explicitly mentioned)
5. **Newsletter Detection:** Unsubscribe link = always OPTIONAL
6. **FYI Category:** No action needed = always OPTIONAL
7. **Timezone Intelligence:** Consider recipient location for timing
8. **Specific Reasoning:** Reference thread position, sender history, category
9. **Delegation Practical:** Only suggest if actually delegatable
10. **Batching Useful:** Group actionable similar emails

EXAMPLE ANALYSIS:

Email: 
From: client@uk.com
Subject: Re: Re: Re: Project deadline
Body: This is my 4th email about this. Really need answer today.
Thread: Shows 3 previous unanswered messages over 2 days

Analysis:
{
  "urgency_tier": "now",
  "email_category": "Response Expected",
  "reasoning": "Thread has escalated to 4th follow-up in 2 days showing clear frustration. Client is awaiting your response to proceed. Explicit deadline mentioned (today).",
  "thread_analysis": {
    "follow_up_count": 3,
    "is_escalating": true,
    "urgency_trend": "Started as routine question, now urgent after 3 unanswered follow-ups",
    "on_cc": false
  },
  "response_optimization": {
    "best_time": "Respond within 2 hours. Client is in UK (5 hours ahead of PST) - it's late afternoon there",
    "recipient_timezone": "Europe/London",
    "estimated_time": "10 min",
    "can_delegate": false
  }
}

Return ONLY valid JSON. No markdown, no explanations.`;

    console.log('🤖 Calling Claude API...');

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
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
      total: parsed.summary?.total_emails,
      urgent: parsed.summary?.urgent_count,
      thisWeek: parsed.summary?.this_week_count,
      optional: parsed.summary?.optional_count,
      threadEscalations: parsed.urgency_analysis?.filter(e => e.thread_analysis?.is_escalating).length || 0
    });

    // Send response
    res.json(parsed);

  } catch (error) {
    console.error('❌ Reply Urgency Triager V2 error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to analyze email urgency' 
    });
  }
});


module.exports = router;
