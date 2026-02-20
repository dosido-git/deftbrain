const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/lease-trap-detector', async (req, res) => {
  try {
    const { leaseText, pdfBase64, location, leaseType, concerns } = req.body;

    if (!location || !location.trim()) {
      return res.status(400).json({ error: 'Location is required' });
    }
    if (!leaseType) {
      return res.status(400).json({ error: 'Lease type is required' });
    }
    if (!leaseText && !pdfBase64) {
      return res.status(400).json({ error: 'Please provide lease text or upload a PDF' });
    }

    // Build multi-modal content blocks
    const contentBlocks = [];

    if (pdfBase64) {
      // Extract raw base64 from data URL
      const commaIndex = pdfBase64.indexOf(',');
      const rawBase64 = commaIndex !== -1 ? pdfBase64.substring(commaIndex + 1) : pdfBase64;
      const sizeKB = Math.round((rawBase64.length * 0.75) / 1024);
      console.log(`[LeaseTrapDetector] PDF received: ${sizeKB}KB`);

      // Send PDF directly to Claude API as a document content block
      contentBlocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: rawBase64
        }
      });
      contentBlocks.push({
        type: 'text',
        text: 'The document above is a rental lease agreement PDF. You MUST read the entire document carefully and analyze every clause.'
      });
    }

    const prompt = `You are an expert tenant rights attorney with deep knowledge of state and local landlord-tenant law. You are analyzing a rental lease agreement.

LEASE TYPE: ${leaseType}
LOCATION: ${location}
${concerns ? `TENANT CONCERNS: ${concerns}` : ''}

${leaseText ? `LEASE TEXT:\n${leaseText}` : 'The lease document was provided as a PDF above. Analyze its full contents.'}

═══════════════════════════════════════════
ANALYSIS REQUIREMENTS
═══════════════════════════════════════════

LEGAL RESEARCH REQUIREMENTS:
- Reference SPECIFIC statutes and code sections for ${location} (e.g., "Cal. Civ. Code § 1950.5" or "NYC Admin Code § 26-511")
- Cite the exact law that makes a clause illegal or unenforceable
- Note jurisdiction-specific timelines (notice periods, cure periods, eviction timelines)
- Identify whether ${location} is in a landlord-favorable or tenant-favorable jurisdiction
- Note any rent control or rent stabilization that may apply

SECURITY DEPOSIT ANALYSIS:
- State-specific maximum deposit amounts for ${location}
- Whether interest on deposits is required and at what rate
- Required return timeline after move-out
- Walk-through/inspection requirements before deduction
- What deductions are legally permitted vs prohibited
- Compare the lease's deposit terms against these legal requirements

ENFORCEABILITY ASSESSMENT:
- Identify which clauses are UNENFORCEABLE in ${location} regardless of what the lease says
- Flag clauses where "what the lease says" differs from "what the law actually allows"
- Note any clauses that would be void as a matter of public policy
- Identify any required disclosures that may be missing (lead paint, mold, bed bugs, etc.)

NEGOTIATION INTELLIGENCE:
- For each red/yellow flag, predict the landlord's likely response if the tenant pushes back
- Classify each point as: "likely negotiable," "possible with leverage," or "non-negotiable standard"
- Identify the tenant's leverage points (local vacancy rates, time of year, lease length)
- Suggest where to compromise vs where to stand firm
- Provide specific "if they say X, respond with Y" scripts

RESOURCES FOR ${location}:
- Local tenant union or tenant rights organization
- Free legal clinics or legal aid for tenants
- Local housing authority contact info
- Mediation services available
- Emergency housing resources if needed

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════

Return ONLY valid JSON (no markdown, no preamble):

{
  "overall_assessment": {
    "risk_level": "high / medium / low",
    "major_concerns_count": number,
    "recommendation": "brief overall recommendation",
    "jurisdiction_type": "tenant-favorable / landlord-favorable / neutral",
    "rent_control_applicable": true/false,
    "rent_control_details": "details if applicable, null otherwise"
  },
  "security_deposit_analysis": {
    "lease_deposit_amount": "what the lease charges",
    "legal_maximum": "maximum allowed by law in ${location}",
    "is_over_limit": true/false,
    "interest_required": true/false,
    "interest_details": "interest rate and payment requirements",
    "return_timeline_days": number,
    "return_timeline_law": "specific statute",
    "walkthrough_required": true/false,
    "walkthrough_details": "requirements for pre-move-out inspection",
    "permitted_deductions": ["what landlord CAN deduct"],
    "prohibited_deductions": ["what landlord CANNOT deduct"],
    "issues_found": ["any deposit-related problems in this lease"]
  },
  "red_flags": [
    {
      "lease_reference": "Section/paragraph/page where this clause appears (e.g., 'Section 12(b)', 'Paragraph 7', 'Page 3, Section 4')",
      "clause_text": "exact clause from the lease",
      "concern": "one-sentence problem summary",
      "why_problematic": "detailed explanation",
      "legal_status": "illegal / unenforceable / exploitative",
      "specific_law": "exact statute or code section",
      "what_lease_says": "what this clause tries to do",
      "what_law_says": "what the law actually allows",
      "your_rights": "tenant's actual legal rights",
      "landlord_likely_response": "how the landlord will probably react if you raise this",
      "negotiability": "likely negotiable / possible with leverage / non-negotiable standard",
      "negotiation_script": "specific language to use when pushing back"
    }
  ],
  "yellow_flags": [
    {
      "lease_reference": "Section/paragraph/page reference",
      "clause_text": "clause text",
      "concern": "issue description",
      "why_concerning": "explanation of potential risk",
      "questions_to_ask": ["specific questions to ask landlord"],
      "landlord_likely_response": "predicted response",
      "negotiability": "likely negotiable / possible with leverage / non-negotiable standard",
      "what_to_watch_for": "red flags during the conversation"
    }
  ],
  "green_flags": [
    {
      "lease_reference": "Section/paragraph/page reference",
      "clause_text": "good clause from the lease",
      "why_good": "why this protects the tenant"
    }
  ],
  "unenforceable_clauses": [
    {
      "lease_reference": "Section/paragraph/page reference",
      "clause_text": "clause that cannot be enforced",
      "specific_law": "statute making it unenforceable",
      "explanation": "why this is void/unenforceable",
      "practical_advice": "what to do about it"
    }
  ],
  "missing_protections": [
    {
      "protection": "what's missing from the lease",
      "why_important": "why the tenant needs this",
      "legal_requirement": "whether this is legally required or just recommended",
      "how_to_add": "specific language to request adding"
    }
  ],
  "missing_disclosures": [
    {
      "disclosure": "required disclosure name",
      "legal_requirement": "specific law requiring it",
      "consequence_if_missing": "what happens if landlord fails to provide this"
    }
  ],
  "unusual_fees": [
    {
      "lease_reference": "Section/paragraph/page reference",
      "fee_name": "name of the fee",
      "amount": "dollar amount",
      "is_typical": true/false,
      "is_legal": "yes / no / depends on jurisdiction",
      "specific_law": "relevant statute if applicable",
      "negotiation_strategy": "how to push back on this fee"
    }
  ],
  "negotiation_strategy": {
    "opening_email": "full email/letter opening to send to landlord",
    "key_points": ["prioritized list of negotiation points"],
    "compromise_positions": ["where to give ground if needed"],
    "stand_firm_on": ["non-negotiable items - rights you should NOT waive"],
    "leverage_points": ["your advantages in this negotiation"],
    "market_context": "assessment of tenant vs landlord market in this area",
    "if_they_say_scripts": [
      {
        "landlord_says": "common landlord pushback",
        "you_respond": "effective response"
      }
    ]
  },
  "resources": [
    {
      "resource": "organization name",
      "type": "tenant union / legal aid / housing authority / mediation / emergency housing",
      "why_useful": "what they can help with",
      "contact": "phone, website, or address",
      "notes": "when to contact them"
    }
  ]
}

CRITICAL RULES:
- Every flag MUST include a lease_reference citing the section, paragraph, page, or clause number where it appears in the lease (e.g., "Section 12(b)", "Paragraph 7", "Page 3, §4", "Clause 14.2"). If no clear numbering exists, use descriptive location (e.g., "Under 'Security Deposit' heading", "3rd paragraph of lease")
- Cite SPECIFIC laws and statutes for ${location} — never give generic advice
- Every red flag MUST include the specific law that applies
- Security deposit analysis MUST reference the exact state statute
- Negotiation scripts should be realistic — assume an adversarial but professional relationship
- For unenforceable clauses, explain that signing doesn't waive the tenant's legal rights
- Be comprehensive but honest — if a clause is standard/acceptable, don't flag it as problematic
- Resources should be REAL organizations that serve ${location}
- Return ONLY valid JSON.`;

    contentBlocks.push({ type: 'text', text: prompt });

    console.log(`[LeaseTrapDetector] Sending ${contentBlocks.length} content blocks (PDF: ${!!pdfBase64}, text: ${!!leaseText})`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: contentBlocks }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    console.log(`[LeaseTrapDetector] Response: ${textContent.length} chars`);

    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    console.log(`[LeaseTrapDetector] Risk: ${parsed.overall_assessment?.risk_level}, Red flags: ${parsed.red_flags?.length || 0}, Unenforceable: ${parsed.unenforceable_clauses?.length || 0}`);
    res.json(parsed);

  } catch (error) {
    console.error('[LeaseTrapDetector] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze lease' });
  }
});


module.exports = router;
