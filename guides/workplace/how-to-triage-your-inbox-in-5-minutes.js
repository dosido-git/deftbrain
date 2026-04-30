module.exports = {
  slug:          'how-to-triage-your-inbox-in-5-minutes',
  category:      'workplace',
  categoryLabel: 'Workplace',
  title:         "How to triage your inbox in 5 minutes",
  titleHtml:     "How to triage your inbox <em>in 5 minutes</em>",
  shortTitle:    "Triage inbox in 5 minutes",
  navTitle:      "triage inbox fast",
  description:   "A specific protocol for opening your inbox, identifying the urgent stuff, and closing the inbox — all in five minutes, several times a day.",
  deck:          "A specific protocol for opening your inbox, identifying the urgent stuff, and closing the inbox — all in five minutes, several times a day.",
  ledes: [
    `You sit down to check email and an hour later you are still in your inbox, having processed maybe twenty emails and gotten lost in two long threads, and you cannot remember what you sat down to do in the first place. This happens every time you open your inbox. The act of checking email becomes its own task, and the task swallows time you meant to spend on other things.\n\nA five-minute triage is a different protocol. You are not trying to process the inbox. You are trying to find anything that genuinely cannot wait, deal with it, and close the lid. Everything else can wait for your dedicated email block. The key is having a fast, repeatable protocol, so the triage does not become its own thirty-minute trap.`,
    `Here is a five-minute inbox triage protocol you can run multiple times a day.`,
  ],
  steps: [
    { name: 'Sort by sender or subject, not chronologically', body: 'Sort your inbox so that grouping makes the volume legible — by sender, or by thread. This collapses 200 unread messages into maybe 50 distinct conversations or sources. You can scan 50 conversations in a couple of minutes. You cannot scan 200 individual messages in any reasonable time. The sort is the leverage.' },
    { name: 'Scan only the From and Subject columns', body: 'Do not open emails. Just look at who they are from and what they are about. You are looking for two things: anything from a specific person whose emails always need attention (your boss, a key client, a specific colleague), and any subject line that signals real urgency (\'blocked,\' \'deadline,\' \'urgent,\' \'emergency\'). Most emails will be neither. Mark anything that hits these criteria for your urgent pile and keep moving.' },
    { name: 'Open only the urgent flagged items', body: 'Now open only the emails you flagged. Read them. Decide on each: respond now in two minutes or less, or schedule for your real email block later. If you cannot answer in two minutes, do not start. Schedule it. Two-minute responses go out now. Longer ones get queued. Most urgent emails actually only need a two-minute response — quick acknowledgment, quick decision, quick deferral. Long replies usually mean the email is not actually urgent.' },
    { name: 'Close the inbox without reading anything else', body: 'After handling urgent items, close the inbox. Do not browse. Do not get sucked into the thread you are curious about. Do not open the newsletter. Triage is not reading; reading is for your email block later. The discipline of closing the lid is the whole reason this works in five minutes. Without it, every triage session expands to fill the available time.' },
    { name: 'Do this multiple times a day, not constantly', body: 'A five-minute triage at 9 a.m., 1 p.m., and 4 p.m. catches anything urgent within four hours of arrival, which is fast enough for almost any business context. Constant inbox-checking gives you twenty-second response time, which sounds good but destroys your focus and produces no real benefit. The triage windows are deliberate. Outside them, the inbox is closed.' }
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
