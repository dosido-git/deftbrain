module.exports = {
  slug:          'how-to-read-a-financial-report-like-an-expert',
  category:      'workplace',
  categoryLabel: 'Workplace',
  title:         "How to read a financial report like an expert",
  titleHtml:     "How to read a financial report <em>like an expert</em>",
  shortTitle:    "Read financial reports",
  navTitle:      "read financial reports",
  description:   "A practical method for reading a financial report so you can actually understand what is happening at a company — not just what they want you to think.",
  deck:          "A practical method for reading a financial report so you can actually understand what is happening at a company — not just what they want you to think.",
  ledes: [
    `You opened the company's annual report. It is 180 pages. The first 40 pages are a glossy narrative about strategy, with photos of smiling employees and quotes about innovation. The last 140 pages are dense numerical tables and footnotes. The middle is where the actual information lives, but you do not know where to start, and the document seems designed to make sure you keep not knowing.\n\nFinancial reports are not as opaque as they look. They are constructed according to conventions, and once you know the conventions, you can read one in twenty minutes and have a defensible read on the company. The trick is knowing which sections to read carefully, which to skim, and what to ignore entirely.`,
    `Here is how to read a financial report the way an analyst would, in a fraction of the time it takes to read it cover to cover.`,
  ],
  steps: [
    { name: 'Skip the front, go straight to the financials', body: 'The front of the report — the CEO letter, the strategy section, the photos — is marketing. It is written by communications professionals to shape the narrative. It contains zero information you cannot get more reliably elsewhere. Start at the financial statements: balance sheet, income statement, cash flow statement. These are governed by accounting standards. They cannot lie outright. Marketing language can. The numbers are where the truth lives.' },
    { name: 'Read the cash flow statement before the income statement', body: 'Income statements show profit, which is partly an accounting construction. Cash flow shows cash, which is real. A company can report a profit while burning cash. A company can show a loss while generating cash. The cash flow statement is harder to manipulate and tells you whether the business actually works. Read it first. Look at operating cash flow specifically — that is the engine. If operating cash flow is consistently negative, no narrative in the front of the report can save the company.' },
    { name: 'Read the footnotes — that is where the secrets are', body: 'The numbers on the financial statements are summaries. The footnotes are where the assumptions, exceptions, and worrying details live. Revenue recognition policies. Debt covenants. Pending lawsuits. Off-balance-sheet obligations. Related-party transactions. Auditors put the truly interesting stuff in the footnotes precisely because most readers skip them. Flip directly to the footnotes after the statements. Look for changes from prior years — that is where new problems get disclosed.' },
    { name: 'Compare year over year, and look for patterns', body: 'A single year\'s data tells you almost nothing. The same company across three to five years tells you the trajectory. Is revenue growing or stalling? Are margins expanding or contracting? Is debt rising? Are receivables growing faster than revenue (often a sign of trouble)? Is inventory piling up? The patterns matter more than any single number. The MD&A section discusses these but adopts the company\'s framing. Look at the raw numbers and form your own opinion before reading their interpretation.' },
    { name: 'Compare to peers, not just to itself', body: 'A company growing 5% in an industry growing 15% is losing share, regardless of how good 5% sounds in isolation. A company with a 20% margin in an industry where the average is 30% has a problem. Pull two or three peer companies and compare the same metrics. Most reports look reasonable on their own. Compared to peers, the picture often shifts. The peer comparison is where the actionable insight usually lives.' }
  ],
  cta: {
    glyph:    '🔍',
    headline: "See through any text.",
    body:     "Paste any document — a contract, a research paper, a medical form, a corporate memo — and PlainTalk gives you two things: a plain-English translation, and a structural X-ray showing how the text is built. It surfaces obligations, deadlines, hidden asymmetries, and the parts that actually matter.",
    features: [
      "Plain-English translation of any document, any length",
      "Structural X-ray showing how the text is architecturally built",
      "Side-by-side view to compare original to translation",
      "Auto-detects document type and adapts the analysis"
    ],
    toolId:   'PlainTalk',
    toolName: 'PlainTalk — Document Analyst',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
