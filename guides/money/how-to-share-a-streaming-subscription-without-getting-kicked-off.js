module.exports = {
  slug:          'how-to-share-a-streaming-subscription-without-getting-kicked-off',
  category:      'money',
  categoryLabel: 'Money',
  title:         "How to Share a Streaming Subscription Without Getting Kicked Off",
  titleHtml:     "How to Share a Streaming Subscription <em>Without Getting Kicked Off</em>",
  shortTitle:    "Share a Subscription",
  navTitle:      "share a streaming subscription",
  description:   "Streaming services have cracked down on password sharing but still allow legitimate household sharing. Here is how to set yours up correctly so nobody gets locked out.",
  deck:          "Streaming services have cracked down on password sharing but still allow legitimate household sharing. Here is how to set yours up correctly so nobody gets locked out.",
  ledes: [
    `You and your partner, or you and a roommate, or you and your parents, share a streaming subscription. It used to just work. Now you keep getting 'this device is not part of your household' prompts, accounts get locked, somebody has to log in again, and the convenience that justified the subscription has turned into a constant friction.\n\nMost services still allow legitimate sharing within a household — they just require setup. The crackdown is on cross-household sharing, not within-household sharing. If you set up the account correctly the first time, the friction goes away. If you do not, every device check creates an opportunity for the system to lock somebody out.`,
    `Here is the setup — and how SubSweep flags accounts that need it.`,
  ],
  steps: [
    { name: 'Designate a primary location and use that wifi as the home base', body: 'Most streaming services define a household by the wifi network the primary device connects to. Set this once. Open each shared service on the device most commonly used at home, on the home wifi. The service registers that location as the household. Devices that connect to that wifi at least once a month are part of the household. Devices that never connect get flagged as outside.' },
    { name: 'Have every household member log in once on home wifi every month', body: 'If your kid uses the service on their phone but only on cellular data while at school, the service eventually marks them as outside the household. A monthly check-in on home wifi keeps them registered. This is invisible if everyone is in the house most of the time but matters for college students, partners who travel, or anyone who is mostly mobile. Tell household members to open the app on home wifi periodically; that is enough.' },
    { name: 'Use the family or premium plan, not standard', body: 'Most services have a tier specifically for multiple users — Premium, Family, Standard with Ads, or branded variants. The bottom-tier plan often only allows one or two simultaneous streams and aggressive household checks. The family plan allows more and is calibrated for shared use. The math usually works out — paying $5 more for a tier that supports four users is cheaper than four people having separate base plans, and avoids the lock-out friction.' },
    { name: 'For services that have stopped allowing real sharing, plan an alternative', body: 'Some services have effectively ended household sharing — even legitimate household members get locked out if they travel for more than a couple weeks. For these, decide whether the subscription is worth keeping for one location only, splitting cost with a single household member, or canceling. The era of one subscription covering an extended family across multiple homes is mostly over for the major services. Plan around it instead of fighting it.' },
    { name: 'Use SubSweep to flag shared accounts and their settings', body: 'SubSweep identifies which of your subscriptions are on shared family plans and notes whether the plan tier is correctly sized for your household. It also flags accounts where the same email is being charged twice — a sign of accidental double-subscriptions across family members. The audit catches both the over-paying problem (multiple subscriptions for the same service) and the under-tier problem (one user on a plan too small for actual use).' }
  ],
  cta: {
    glyph:    '🧹',
    headline: "Find every recurring charge. Cut what you do not use.",
    body:     "Drop in your statement and SubSweep finds every subscription, calculates the annual cost, ranks them by value-per-use, and gives you the cancellation links and scripts for the ones to drop.",
    features: [
      "Finds hidden recurring charges",
      "Annual cost per subscription",
      "Value-per-use ranking",
      "Cancellation links + scripts"
    ],
    toolId:   'SubSweep',
    toolName: 'SubSweep',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
