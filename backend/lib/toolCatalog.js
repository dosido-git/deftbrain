// The tool catalog, read once from src/data/tools.js at startup.
//
// Lifted out of routes/tool-finder.js so other routes can recommend tools
// without importing a route module. date-night's "anything else before
// tonight?" needs the same list, and every recommendation MUST be validated
// against it — a model asked to name a tool will happily invent one, and an
// invented id is a dead link on a results page.
const fs = require('fs');
const path = require('path');

// Extract a single-line quoted field value, respecting WHICH quote character
// actually delimits the string (tools.js mixes ' and " across fields). A
// naive [^'"]+ character class excludes both quote types even when only one
// is the real delimiter, so any value containing an apostrophe — "don't",
// "it's", "you're" — got silently truncated right before it. The
// backreference (['"]) ... \1 pattern matches content up to the SAME quote
// that opened the string, allowing the other quote type through untouched.
function extractField(line, field) {
  const re = new RegExp(`^\\s*${field}:\\s*(['"])((?:(?!\\1)[^\\\\]|\\\\.)*)\\1`);
  const m = line.match(re);
  // Read as text, not JS: a \n written in the source arrives here as two
  // characters. These strings go straight into a prompt, so flatten it.
  return m ? m[2].replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim() : null;
}

// ════════════════════════════════════════════════════════════
// LOAD TOOL CATALOG AT STARTUP
// Reads tools.js once and builds a condensed catalog string
// ════════════════════════════════════════════════════════════
function buildCatalog() {
  try {
    const toolsPath = path.join(__dirname, '../../src/data/tools.js');
    const content = fs.readFileSync(toolsPath, 'utf8');
    const tools = [];
    let current = null;

    for (const line of content.split('\n')) {
      const id = extractField(line, 'id');
      if (id) {
        if (current && current.id) tools.push(current);
        current = { id };
        continue;
      }
      if (!current) continue;

      const title = extractField(line, 'title');
      const categoriesMatch = line.match(/^\s*categories:\s*\[([^\]]*)\]/);
      const description = extractField(line, 'description');
      const tagline = extractField(line, 'tagline');
      const icon = extractField(line, 'icon');
      const give = extractField(line, 'give');   // primer.give — what the tool accepts

      if (title) current.title = title;
      if (categoriesMatch) {
        const cats = categoriesMatch[1]
          .split(',')
          .map(c => c.replace(/['"]/g, '').trim())
          .filter(Boolean);
        if (cats.length) current.category = cats.join(', ');
      }
      if (description) current.description = description;
      if (tagline) current.tagline = tagline;
      if (icon) current.icon = icon;
      if (give && !current.give) current.give = give;
    }
    if (current && current.id) tools.push(current);

    // Exclude Tool Finder from its own catalog — a user asking Tool Finder
    // for help is already using it, so "use Tool Finder" is a useless,
    // circular top recommendation.
    return tools.filter(t => t.id && t.title && t.id !== 'ToolFinder');
  } catch (err) {
    console.error('ToolFinder: Failed to load tool catalog:', err.message);
    return [];
  }
}

const TOOL_CATALOG = buildCatalog();
console.log(`🧰 ToolFinder: Loaded ${TOOL_CATALOG.length} tools into catalog`);

const TOOL_IDS = new Set(TOOL_CATALOG.map(t => t.id));
const isRealTool = (id) => TOOL_IDS.has(id);

module.exports = { TOOL_CATALOG, isRealTool };
