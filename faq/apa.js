// Source entries from the APA Dictionary of Psychology, shared by the
// Decisions and Ideas & Diversions FAQ topics. Read 2026-11-25.
const apa = term => ({
  label: `APA Dictionary of Psychology: ${term.replace(/-/g, ' ')} (American Psychological Association)`,
  url: `https://dictionary.apa.org/${term}`,
});
module.exports = { apa };
