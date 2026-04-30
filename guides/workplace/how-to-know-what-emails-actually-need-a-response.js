module.exports = {
  slug:          'how-to-know-what-emails-actually-need-a-response',
  category:      'workplace',
  categoryLabel: 'Workplace',
  title:         "How to know what emails actually need a response",
  titleHtml:     "How to know <em>what emails actually need a response</em>",
  shortTitle:    "Emails that need replies",
  navTitle:      "emails that need replies",
  description:   "A diagnostic for telling which emails actually require your reply and which are informational, social, or noise — so you can stop responding to everything.",
  deck:          "A diagnostic for telling which emails actually require your reply and which are informational, social, or noise — so you can stop responding to everything.",
  ledes: [
    `You feel obligated to reply to most emails. Even the FYIs. Even the ones that copy you on long threads. Even the ones where someone mentions your name in passing. The result is that you spend a lot of your day writing short responses that maintain a perception of engagement without actually moving any work forward. You suspect this is unnecessary. You also worry that if you stop responding, people will think you are ignoring them or not paying attention.\n\nMost email does not actually need a reply. The expectation that it does is a cultural habit you can let go of, with surprisingly little cost. The challenge is being able to tell, in real time, which emails actually need you and which do not.`,
    `Here is how to tell which emails actually need a reply.`,
  ],
  steps: [
    { name: 'Look for an explicit request or question', body: 'Most emails that need a reply contain a question mark or a phrase like \'can you,\' \'please,\' \'I need,\' or \'let me know.\' If the email contains none of these, it is probably informational, not requesting. Informational emails usually do not need a reply. The sender shared something with you. They were not asking for anything. A reply at this point is just acknowledgment, and acknowledgment is usually optional.' },
    { name: 'Check who else is on the email', body: 'If you are CC\'d rather than addressed in the To line, the email is mostly informational for you. The action is for someone else. Replies from CC recipients clutter threads without adding value. Unless you have something substantive to contribute, do not reply just because you were copied. The convention that CC means \'no action expected\' is widely understood; honoring it is appreciated.' },
    { name: 'Notice whether the email is the start or middle of a thread', body: 'If the email is part of an active thread between several people, your reply is only needed if you have specific information or a specific decision to add. Replies that say \'agreed\' or \'sounds good\' from non-decision-makers are noise. Watch the thread, contribute when you have something specific, stay quiet otherwise. The people running the thread will appreciate this.' },
    { name: 'Distinguish \'reply expected\' from \'reply traditional\'', body: 'Some emails culturally seem to expect a reply but functionally do not. Holiday wishes from your manager. Thank-you notes after a meeting. Confirmations that an email was received when there is nothing else to confirm. These are reply-traditional, not reply-expected. Skipping them rarely has consequences. The cumulative time saved by skipping reply-traditional emails is significant, and the cost is essentially zero.' },
    { name: 'When in doubt, wait 24 hours', body: 'If you cannot tell whether an email needs a reply, do not reply. Wait. If it really needed a reply, the sender will follow up. If they do not, the reply was not needed. This is a simple test, and it is a more reliable predictor than your sense of obligation. Most emails that you waited on never required a follow-up, which is the cleanest possible signal that the reply was not necessary.' }
  ],
  cta: {
    glyph:    '📬',
    headline: "What actually needs a reply today.",
    body:     "Email Urgency Triager separates real urgency from perceived urgency. Paste any batch of emails — it sorts them into Reply Now, Reply This Week, and Optional/Never, with reasoning for each. Quick-response templates included for the urgent ones. Permission-to-breathe section for the anxiety.",
    features: [
      "Three-tier sort: Reply Now, Reply This Week, Optional/Never",
      "Detailed reasoning per email — not just labels",
      "Quick-response templates for the urgent items",
      "Permission-to-breathe section for inbox anxiety"
    ],
    toolId:   'EmailUrgencyTriager',
    toolName: 'Email Urgency Triager',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
