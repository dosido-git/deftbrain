module.exports = {
  slug:          'how-to-do-a-credit-card-chargeback',
  category:      'money',
  categoryLabel: 'Money',

  title:         "How to Do a Credit Card Chargeback (And Why It's More Powerful Than Most People Realize)",
  titleHtml:     "How to Do a Credit Card Chargeback <em>(And Why It&#39;s More Powerful Than Most People Realize)</em>",
  shortTitle:    "How to Do a Credit Card Chargeback",
  navTitle:      "How to do a credit card chargeback and why it's more powerful than most people realize",

  description:   "A chargeback isn't a complaint to your bank — it's a federally-regulated process that forces the merchant to defend the charge or lose it. Used correctly, it's the strongest consumer leverage move available.",
  deck:          "A chargeback isn't a complaint to your bank — it's a federally-regulated process that forces the merchant to defend the charge or lose it. Used correctly, it's the strongest consumer leverage move available.",

  ledes: [
    `You paid for something. The thing didn't arrive, didn't work, didn't match what was promised, was canceled but billed anyway, or was billed twice. You've been trying to get the merchant to fix it, and either they're stalling or they've outright refused. Somewhere in your awareness is a vague memory that you can call your credit card company and 'dispute the charge.' You're unclear on the details. You suspect it's complicated. You also suspect it might be the move that actually works.`,
    `It is. Chargebacks are one of the most powerful consumer-protection tools in everyday use, and almost everyone who has them undersells them in their own head. Federal law (the Fair Credit Billing Act for credit cards, Regulation E for debit) gives you specific rights to dispute charges, and the card networks (Visa, Mastercard, Amex) have built dispute processes the merchant must engage with or lose by default. Done correctly, a chargeback isn't a complaint — it's a procedural move that costs the merchant money to fight even when they win.`,
  ],

  steps: [
    {
      name: "Know the categories — and which one fits your situation",
      body: "Chargebacks are filed under specific reason codes, and picking the right one matters. The most common: 'merchandise not received,' 'merchandise not as described,' 'duplicate charge,' 'continued billing after cancellation,' 'unauthorized transaction,' and 'service not provided.' Each has slightly different documentation requirements and different default outcomes if the merchant doesn't respond. When you call your card company, the agent will ask you to characterize the dispute — your answer maps to one of these codes, and being specific about the right one makes the case stronger. 'I want to dispute this' is fine; 'I'm filing a dispute under merchandise-not-as-described — the laptop arrived but doesn't match the listed specifications' is much better.",
    },
    {
      name: "Try to resolve with the merchant first — and document the attempt",
      body: "Most card networks technically require you to attempt resolution with the merchant before filing. In practice, the requirement is loose, but documenting your attempt strengthens your case dramatically. Save the emails. Note the dates of the calls. Keep the chat transcripts. When you file the chargeback, the bank will ask whether you contacted the merchant — 'yes, I emailed customer service on March 10 and again on March 17, and received only auto-replies' is a much better answer than 'I tried to reach them.' The documentation is what tips close cases in your favor.",
    },
    {
      name: "File within the time limits — they're shorter than you think",
      body: "Federal law gives you 60 days to dispute a credit card charge from the date it appeared on your statement. Card networks often allow longer (Visa typically 120 days, sometimes 540 for specific reason codes), but the 60-day federal window is the safest target. For ongoing service issues — undelivered shipments, services that were promised on a future date — the clock can start later than you think, but file as soon as the failure is clear. Late chargebacks are sometimes accepted but face a much higher bar. Earlier is always better.",
    },
    {
      name: "Provide documentation, but don't overdo it",
      body: "When you file, include the essential evidence: the original charge, the merchant's communication (or lack of), and what you expected versus what you got. A photo if relevant. A receipt or order confirmation. The contract or terms if the dispute hinges on those. Three to five documents tell the story; fifteen documents bury it. Card disputes are reviewed by humans on tight timelines, and the goal is to make your case readable in two minutes. Pick the strongest evidence and lead with it; you can always provide more if the bank asks.",
    },
    {
      name: "When chargeback wins are unwinning — and when they're worth it anyway",
      body: "A successful chargeback returns the money. It also has consequences worth knowing. Some merchants will close your account or ban you from doing business with them again. Some will pursue you in collections for the disputed amount despite losing the chargeback. Some industries (subscriptions, online services) treat chargebacks aggressively and may flag your card across their network. None of this means you shouldn't file when the dispute is legitimate — you absolutely should. But the chargeback is a relationship-ending move with that merchant, and worth using when the relationship was already over or wasn't worth keeping. For most disputes, that calculus is fine. For ongoing relationships you want to preserve, try every other escalation first, and use chargeback as the move you make when the merchant has already chosen not to keep you as a customer.",
    },
  ],

  cta: {
    glyph:    '📧',
    headline: "File the chargeback that actually wins",
    body:     "Complaint Escalation Writer drafts your chargeback with the right reason code, the strongest documentation framing, and the merchant-attempt language that tips close cases in your favor.",
    features: [
      "Reason-code selection",
      "Documentation organization",
      "Merchant-contact recap drafting",
      "Time-window calculation",
      "Outcome-vs-relationship analysis",
    ],
    toolId:   'ComplaintEscalationWriter',
    toolName: 'Complaint Escalation Writer',
  },

  published: '2026-04-27',
  modified:  '2026-04-27',
};
