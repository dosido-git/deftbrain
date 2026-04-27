module.exports = {
  slug:          'how-to-escalate-a-customer-service-complaint',
  category:      'money',
  categoryLabel: 'Money',

  title:         "How to Escalate a Customer Service Complaint (When the Front Line Has Run Out of Options)",
  titleHtml:     "How to Escalate a Customer Service Complaint <em>(When the Front Line Has Run Out of Options)</em>",
  shortTitle:    "How to Escalate a Customer Service Complaint",
  navTitle:      "How to escalate a customer service complaint when the front line has run out of options",

  description:   "Escalation isn't shouting louder at the same person. It's getting onto a different ladder where the rules are different — and there are usually four ladders worth knowing about.",
  deck:          "Escalation isn't shouting louder at the same person. It's getting onto a different ladder where the rules are different — and there are usually four ladders worth knowing about.",

  ledes: [
    `You've explained the problem twice to two different agents and gotten the same answer both times. The agents are friendly. The answer is unhelpful. You've been told the policy, told the system, told that there's nothing they can do — and you're starting to suspect that the people you're talking to genuinely can't help you, regardless of how clearly you explain or how reasonable you sound. They probably can't. That's not the failure mode you came in expecting, but it's almost always what's happening.`,
    `Customer service has tiers, and the tier you're talking to is the tier with the least authority. Escalation isn't about being louder or angrier; it's about routing yourself to a tier that *has* the authority to do what you need. There are usually four ladders inside any large company, and the one you should use depends on what kind of problem you have. Knowing which is which saves you days of repeating yourself to people who can't help.`,
  ],

  steps: [
    {
      name: "The supervisor ladder — for policy exceptions",
      body: "If the issue is that policy says no but your situation is unusual, you need someone with discretionary authority. Ask for a supervisor — not aggressively, just clearly: 'I appreciate that you're following policy. Could you transfer me to someone who can make an exception?' Most agents will. Supervisors have a small budget for exceptions specifically because some cases don't fit the script. If the supervisor also can't help, ask for *their* supervisor. The ladder usually goes two or three levels deep before you've actually exhausted it.",
    },
    {
      name: "The retention ladder — for billing and cancellation issues",
      body: "If the issue involves money the company is currently collecting from you, the retention team has authority that regular support doesn't. They can issue refunds, change billing dates, restructure plans, waive fees. The path is usually: call regular support, mention you're considering canceling because of the issue, and the call gets transferred. This is the ladder for refund disputes, billing errors, and rate complaints — and it works because retention has different metrics than support, and helping you costs them less than losing you.",
    },
    {
      name: "The corporate ladder — for issues that need real authority",
      body: "When neither support nor retention can resolve it, the executive office can. Most companies have a customer-relations team reporting to senior leadership — variously called 'Executive Customer Service,' 'Office of the President,' or 'Customer Advocacy.' The way to reach them is by emailing a senior executive directly (CEO, COO, or Chief Customer Officer). The email is read by an assistant or a routing team, not the executive, but it goes to people empowered to make decisions support can't make. Use this when you've got a real grievance and the lower tiers have refused to address it.",
    },
    {
      name: "The external ladder — for issues that won't move internally",
      body: "If three internal escalations have failed, the next move is external pressure: regulators (CFPB for banks, FCC for telecom, DOT for airlines, state AG for general consumer issues), credit card chargebacks for billing disputes, social media for companies that depend on public reputation, or small claims court for clear monetary harm. Each of these takes 10–30 minutes to initiate and triggers a different response timeline. External escalation is what you reach for when the company has formally said no and you believe the no is wrong. Done well, it's how cases that 'can't be resolved' suddenly become resolvable.",
    },
    {
      name: "When you're escalating a problem that isn't actually escalatable",
      body: "Honest test before any escalation: is your complaint about a clear, specific harm — wrong charge, broken product, service not delivered, policy misapplied — or is it about something more diffuse, like the experience being frustrating or the agent being unhelpful? Escalation works for specific harms; it rarely works for diffuse dissatisfaction. If your complaint can be summarized in one sentence with a specific outcome you want ('refund the $87 charge from March 14th'), it's escalatable. If it's harder to summarize than that, it might be worth pausing before escalating — because the company isn't going to solve a problem you can't state crisply, and the escalation will run aground on the same vagueness that the original complaint did.",
    },
  ],

  cta: {
    glyph:    '📧',
    headline: "Pick the right ladder before you climb",
    body:     "Complaint Escalation Writer maps your specific complaint to the right escalation path — supervisor, retention, executive, or regulator — and drafts the messages for each rung with the laws and policies that apply.",
    features: [
      "Ladder selection by complaint type",
      "Tier-specific message drafting",
      "Authority and rights citations",
      "Sequenced escalation timing",
      "Outcome-clarity framing",
    ],
    toolId:   'ComplaintEscalationWriter',
    toolName: 'Complaint Escalation Writer',
  },

  published: '2026-04-27',
  modified:  '2026-04-27',
};
