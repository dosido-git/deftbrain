module.exports = {
  slug:          'how-to-read-a-long-policy-update-without-losing-your-mind',
  category:      'workplace',
  categoryLabel: 'Workplace',
  title:         "How to read a long policy update without losing your mind",
  titleHtml:     "How to read a long policy update <em>without losing your mind</em>",
  shortTitle:    "Read long policy updates",
  navTitle:      "read policy updates",
  description:   "A method for reading the long policy update that just landed in your inbox without giving up halfway through and without missing the parts that matter.",
  deck:          "A method for reading the long policy update that just landed in your inbox without giving up halfway through and without missing the parts that matter.",
  ledes: [
    `The email subject line says something like 'Updates to Our Terms of Service' or 'Important Changes to Your Account' or 'Revised Employee Handbook — Please Review.' You opened it. It is five thousand words. The first three hundred are throat-clearing about how much they value you. The next four thousand are dense prose with bullet points buried inside it. There is no summary. There is no diff. There is no 'what changed' header. There is just a wall of new text, and you are supposed to know what is different from before.\n\nThis is by design. Long policy updates are written to be technically compliant — they put everything in the document — without being read. The fact that you struggle to parse them is not your fault. But you still have to extract what matters, because the rest of the document is sometimes attempting to commit you to things you would not agree to if you understood them.`,
    `Here is how to read a long policy update efficiently and not miss what matters.`,
  ],
  steps: [
    { name: 'Look for the changes, not the document', body: 'You probably already roughly understand the existing policy. What you need to know is what is different. Some policy updates helpfully include a \'summary of changes\' section — read that first if it exists. If it does not, you have to do the work yourself by scanning for new or modified language. Phrases like \'Section X has been revised,\' \'Effective [date],\' or \'Previously,\' signal modified content. The goal is not to absorb the whole document — it is to identify the deltas.' },
    { name: 'Scan for changes to your obligations or costs', body: 'Of all the things that could change in a policy, the ones that matter to you are: what you are now required to do, what fees or rates have changed, what is now prohibited that was not before, and what data they are now collecting or sharing. Look specifically for these. Most policy updates contain other changes — internal procedures, new disclosures, formatting — that do not affect you. Filter ruthlessly.' },
    { name: 'Watch for arbitration and waiver clauses', body: 'A common change in consumer-facing policy updates is the addition or modification of arbitration clauses, class-action waivers, or limitations of liability. These are not boilerplate — they materially affect your legal rights. If a policy update introduces or expands one of these, that is significant. The language is dense on purpose. Look for words like \'arbitration,\' \'binding,\' \'class action,\' \'waive,\' \'opt out.\' The opt-out language often gives you a window — usually 30 to 60 days — and the window is usually buried.' },
    { name: 'Note any deadlines or default-acceptance language', body: 'Many policy updates state that continued use of the service constitutes acceptance, or that you have a window to opt out before changes take effect. Find this language. If you want to push back on a change, you usually have to do it before a specific date or before you next use the service. Missing the window is the same as agreeing. Set a calendar reminder if there is anything you want to revisit.' },
    { name: 'Save the old version if you can find it', body: 'When in doubt, the most useful exercise is comparing the old version to the new version side by side. If the company published a redline or a \'changes since [date]\' document, that is gold. If they did not, you may be able to find the old version through their archive or through the Wayback Machine. Even ten minutes with both documents open will tell you more than an hour with just the new one.' }
  ],
  cta: {
    glyph:    '🔇',
    headline: "Pull the 10% that matters out of the 90% that doesn't.",
    body:     "Noise Canceler is a relevance filter, not a summarizer. Paste any dense document — HOA notice, insurance EOB, benefits packet, policy update — describe your situation, and it returns only what requires action, what costs you money, what saves you money, and what you can safely ignore.",
    features: [
      "Cross-references the document against your specific situation",
      "Extracts only action items, cost changes, and personally-affecting clauses",
      "Flags 'buried but important' items hidden in dense fine print",
      "Tells you explicitly what you can ignore — most of it"
    ],
    toolId:   'NoiseCanceler',
    toolName: 'Noise Canceler',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
