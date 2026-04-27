module.exports = {
  slug:          'how-to-dispute-a-bill-you-dont-recognize',
  category:      'money',
  categoryLabel: 'Money',

  title:         "How to Dispute a Bill You Don't Recognize (And the Sequence That Actually Resolves It)",
  titleHtml:     "How to Dispute a Bill You Don&#39;t Recognize <em>(And the Sequence That Actually Resolves It)</em>",
  shortTitle:    "How to Dispute a Bill You Don't Recognize",
  navTitle:      "How to dispute a bill you don't recognize and the sequence that actually resolves it",

  description:   "A bill from a name you don't know, for an amount you weren't expecting, demands a specific response sequence. Skip steps and it goes to collections. Do them in order and most of these resolve cleanly.",
  deck:          "A bill from a name you don't know, for an amount you weren't expecting, demands a specific response sequence. Skip steps and it goes to collections. Do them in order and most of these resolve cleanly.",

  ledes: [
    `An envelope arrived with an unfamiliar return address, and inside is a bill for an amount you don't recognize from a company you've never heard of. Maybe it's a medical bill from a lab you didn't know was involved in a visit. Maybe it's a utility from a service you canceled. Maybe it's something genuinely fraudulent — a bill for services that never existed, sent to thousands of people on the chance that some of them will pay it without checking. You don't know which of these you're holding, and the response is different for each.`,
    `Don't pay it yet. But also don't ignore it. The wrong move in either direction creates problems — paying confirms a bill that might not be legitimate, ignoring it lets a possibly-real bill drift toward collections. The right move is a specific sequence that establishes what kind of bill you're holding before you respond to it. The sequence takes about a week of low-effort steps and resolves the vast majority of unfamiliar bills without anyone going to collections or court.`,
  ],

  steps: [
    {
      name: "Don't ignore it — but don't pay it either",
      body: "Unfamiliar bills sit in a dangerous middle zone. Paying without verification confirms charges that might be wrong. Ignoring lets legitimate-but-confusing bills age into collections, where they damage your credit and become much harder to dispute. The right first move is to respond in writing, within the bill's stated due date, requesting verification. This stops the clock on collections (most jurisdictions require billers to validate disputed debts before pursuing them) and creates a paper trail. The verification request itself is short and standard — you don't need to explain anything yet, just ask for proof.",
    },
    {
      name: "Send a written debt validation request",
      body: "Federal law (the Fair Debt Collection Practices Act) gives you the right to request validation of any debt within 30 days of first notification. Send a brief letter (certified mail, return receipt) saying: 'I am writing to request validation of this alleged debt. Please provide the original contract or agreement, an itemized statement of charges, and proof that you are authorized to collect on this account.' This requirement is often ignored by smaller billers, who simply give up and stop pursuing the debt rather than producing documentation. For legitimate billers, it produces the records you need to figure out whether the bill is real. Either way, you've created a written record that you disputed the bill before paying.",
    },
    {
      name: "Search the company name and the amount",
      body: "While waiting for the response, do basic verification. Search the company name, especially with terms like 'scam,' 'complaint,' or 'BBB.' Look for the company in your state's business registry. Search the exact amount — sometimes scam bills go out in identical amounts to thousands of people, and you'll find others reporting the same bill on Reddit or consumer forums. If the company has a pattern of sending unsolicited bills, you'll often find a clear public record of it. If the company appears legitimate but you still don't recognize the service, the issue is more likely a billing mix-up than a scam.",
    },
    {
      name: "Check whether you actually used the service in disguise",
      body: "Some unfamiliar bills are real but come from a third party you didn't know was involved. Medical bills from radiologists, anesthesiologists, or pathologists — services rendered during a hospital visit but billed separately. Utility bills from a sub-provider that handles part of your service. Subscription charges that show up under a parent company name you don't recognize. Pull up your records — bank statements, calendar entries, prior receipts — for the time period the bill claims to cover. Most 'unfamiliar' bills turn out to be legitimate-but-poorly-labeled bills for things you actually did receive. Recognizing this saves you from disputing a real bill.",
    },
    {
      name: "When the bill is fraudulent, file the right reports",
      body: "If the verification process reveals the bill is for services you never received from a company you have no relationship with, you're looking at fraud — possibly identity theft. The right escalation is specific. File a report with the FTC at IdentityTheft.gov. File with your state attorney general's consumer protection division. Place a fraud alert on your credit reports (it's free at any of the three bureaus). And report the company to the Better Business Bureau and any relevant regulator. Don't pay the bill. Don't engage with the collection agency if it gets that far — they're required to cease collection on validated fraud claims. The cleanup is more administrative than dramatic, and most fraudulent bills disappear once you've established the paper trail. The patients who get burned by these are the ones who panic and pay rather than working through the steps. You don't have to be one of them.",
    },
  ],

  cta: {
    glyph:    '🧾',
    headline: "Sort out the unfamiliar bill before it becomes a problem",
    body:     "Bill Rescue analyzes any bill — paste or photograph it — flags whether it's likely legitimate, generates the verification letter, and walks you through the dispute sequence step by step.",
    features: [
      "Bill autopsy and legitimacy check",
      "Debt validation letter generation",
      "Fraud-versus-confusion classification",
      "Dispute sequence and timing",
      "Collection-prevention guidance",
    ],
    toolId:   'BillRescue',
    toolName: 'Bill Rescue',
  },

  published: '2026-04-27',
  modified:  '2026-04-27',
};
