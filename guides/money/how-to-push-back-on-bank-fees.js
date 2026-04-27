module.exports = {
  slug:          'how-to-push-back-on-bank-fees',
  category:      'money',
  categoryLabel: 'Money',

  title:         "How to Push Back on Bank Fees (And Actually Get Them Refunded)",
  titleHtml:     "How to Push Back on Bank Fees <em>(And Actually Get Them Refunded)</em>",
  shortTitle:    "How to Push Back on Bank Fees",
  navTitle:      "How to push back on bank fees and actually get them refunded",

  description:   "Most bank fees are reversible if you know what to ask for and how to ask. The script is short, the success rate is high, and almost no one uses it.",
  deck:          "Most bank fees are reversible if you know what to ask for and how to ask. The script is short, the success rate is high, and almost no one uses it.",

  ledes: [
    `It's $35 for the overdraft. Or $25 for the wire transfer that you didn't realize had a fee. Or $12 for the monthly maintenance charge that's been quietly recurring for two years. The amount feels small enough to ignore but specific enough to be annoying — and you're not sure whether banks actually refund things like this or whether complaining about a thirty-five dollar fee makes you the customer everyone in the call center groans about.`,
    `Banks refund fees routinely. The refund rate on most common fees is much higher than people think — somewhere between 60% and 90% on first request, depending on the fee type and your account history. They don't volunteer this. They don't advertise it. But the script is short, the conversation is brief, and the only thing standing between most people and their refund is the assumption that asking won't work.`,
  ],

  steps: [
    {
      name: "Call the bank, not the chatbot",
      body: "Most fee refunds happen on the phone. The chat tool, the in-app messaging, and the email contact form are all designed to deflect. They route you through scripted decision trees that conclude 'this fee is valid' more than they conclude 'we'll refund it.' Phone agents have refund authority that chat agents don't. Find the customer service number on the back of your card, get past the menu by saying 'representative' until a person picks up, and have the date and amount of the fee ready before you start.",
    },
    {
      name: "Ask for the refund directly — don't argue the fee",
      body: "Resist the urge to explain why the fee is unfair. Banks aren't refunding fees because they agree the fee was unjustified; they're refunding because retaining you costs less than acquiring a new customer. So the right opening isn't 'this fee shouldn't have been charged.' It's 'I'd like to request a refund of the [amount] fee charged on [date].' Direct, polite, no debate. The agent will check, ask a couple of questions, and tell you what they can do. The shorter the request, the higher the success rate.",
    },
    {
      name: "Use 'as a courtesy' if they hesitate",
      body: "If the agent says they can't refund the fee because it was technically valid, the magic phrase is 'I understand it was assessed correctly — could you refund it as a courtesy, given my account history?' This frames the request as a one-time goodwill gesture rather than a dispute, which is how the system is designed to handle these. Agents have specific authority to issue courtesy refunds, separate from disputes. The phrase 'as a courtesy' triggers that authority cleanly.",
    },
    {
      name: "Know the magic words for specific fee types",
      body: "Some fees have refund mechanisms that aren't obvious. *Overdraft fees* are often refundable under 'first-time forgiveness' programs that aren't advertised — ask specifically. *Foreign transaction fees* are usually not refundable but are usually waivable on premium cards if you call before the trip. *Wire fees* are sometimes refundable if the wire was domestic and routine. *Monthly maintenance fees* are almost always reversible and the agent can usually waive future ones too if you ask. The fee type tells you which lever to pull.",
    },
    {
      name: "When the answer is no, escalate calmly",
      body: "If the first agent says no, ask politely whether you can speak with a supervisor. Don't get angry; don't argue. 'I understand you can't help with this — could I speak with someone who has additional authority?' Supervisors have larger refund discretion and a different incentive structure (their job is retention, not call efficiency). If that also fails, your last move is the threat-not-threat: 'If this fee can't be reversed, I'll need to look at whether this is the right account for me.' This isn't a bluff if you mean it. It's also the move that most often produces the refund.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "I'd like to request a refund of the $35 overdraft fee from March 14th. Could you take a look at that as a courtesy?",
    explanation: "Direct ask, specific date and amount, with 'as a courtesy' built in. This is the entire opening line — no preamble about why the fee was unfair, no apology for asking. Brevity is what makes it work.",
  },

  cta: {
    glyph:    '🛡️',
    headline: "Get the script that actually works on the phone",
    body:     "UpsellShield gives you the specific phrases that bank phone agents are trained to respond to — the courtesy-refund opener, the fee-type-specific scripts, the supervisor-escalation language, and the line that closes the call.",
    features: [
      "Fee-type-specific refund scripts",
      "Courtesy refund language",
      "Supervisor escalation phrases",
      "Account-history framing",
      "Multi-fee call sequencing",
    ],
    toolId:   'UpsellShield',
    toolName: 'UpsellShield',
  },

  published: '2026-04-27',
  modified:  '2026-04-27',
};
