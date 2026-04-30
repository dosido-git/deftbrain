// ============================================================
// guides/career/how-to-identify-your-transferable-skills.js
// ============================================================

module.exports = {
  slug:          'how-to-identify-your-transferable-skills',
  category:      'career',
  categoryLabel: 'Career',

  title:         "How to Identify Your Transferable Skills",
  titleHtml:     "How to Identify Your <em>Transferable Skills</em>",
  shortTitle:    "Identify Transferable Skills",
  navTitle:      "How to identify your transferable skills before a career switch",

  description:   "Career switchers underestimate themselves. Here's how to extract the real skills hiding inside your past jobs — including the ones you didn't realize you had.",
  deck:          "Career switchers underestimate themselves. Here's how to extract the real skills hiding inside your past jobs — including the ones you didn't realize you had.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `You're thinking about switching careers and the first thing you've done is look at the gap between where you are and where you want to be — and the gap looks enormous. You don't have the title, you don't have the obvious credentials, you don't have the network. What you have is years of experience that doesn't map cleanly onto the new role's job description, so you've quietly started discounting it. This is the universal mistake of the career switcher: you can see the gap clearly and the bridge to it not at all.`,
    `Most of the bridge is already built — you just don't see it because the language is different. Identifying transferable skills isn't creative resume writing; it's extracting capabilities from work you already did. Five steps that surface them in language the next industry will recognize.`,
  ],

  steps: [
    {
      name: "List the work, not the title",
      body: "Job titles are local — what 'Operations Manager' meant at your previous company is different from what it means at the next one. Forget your titles for a moment. Write down the actual work: the projects you led, the problems you solved, the systems you built, the people you managed, the things you shipped. The work is portable; the title isn't. Start the audit at the work layer.",
    },
    {
      name: "Translate each project into capabilities",
      body: "For every project you listed, write the underlying capability it demonstrates. 'Reorganized the team's intake process' is a project; 'designed and shipped a workflow that reduced cycle time by 40%' is the capability. Capabilities transfer; projects often don't, because the next industry doesn't recognize the project. The capability is what survives the translation.",
    },
    {
      name: "Match capabilities to the target job",
      body: "Pull three job descriptions for the role you want. Read them with your capability list in hand. For each capability you have, find where it appears in the job description — often it's there, just under a different name. 'Strategic alignment' on their side is 'getting the team on the same page' on yours. 'Data analysis' on their side might be 'pattern recognition in operational metrics' on yours. Most of the gap closes the moment you match the labels.",
    },
    {
      name: "Identify the real gaps, not the imaginary ones",
      body: "Once the matching is done, what remains is the actual gap. Some of it is technical — a tool, a domain, a credential. Some of it is structural — you've never managed a budget, never owned a P&L, never run a hiring loop. Write the real gaps down separately from the imaginary ones. Imaginary gaps come from comparing your specific past to a generic future; real gaps come from the residual after careful matching.",
    },
    {
      name: "Validate with someone in the target role",
      body: "Your assessment of your own transferable skills is approximate at best. The honest test is showing your list to someone already in the target role and asking 'does this map?' Most people in the role will identify two things you have that you didn't recognize as relevant, and one thing you thought was a strength that doesn't transfer cleanly. Twenty minutes with the right person is worth a week of solo analysis. The validation is what makes the rest of the plan credible.",
    },
  ],

  cta: {
    glyph:    '🗺',
    headline: "Get the skill audit and the matched mapping",
    body:     "Skill Gap Map takes your work history and the role you want, extracts the underlying capabilities, matches them against the target job description, and shows the real residual gap — distinct from the imaginary one.",
    features: [
      "Project-to-capability translation",
      "Job-description matching",
      "Real-gap identification",
      "Resume-language suggestions",
      "Mentor-validation prompts",
    ],
    toolId:   'SkillGapMap',
    toolName: 'Skill Gap Map',
  },
};
