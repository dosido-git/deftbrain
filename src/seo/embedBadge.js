const fs = require('node:fs');
const path = require('node:path');
const tools = require('../../public/search/tools.json');

const catalog = new Map(tools.map(tool => [tool.id, tool]));
// SVGs loaded as images cannot fetch an external logo.
const brain = fs.readFileSync(path.join(__dirname, '../../public/pBrain-r.png')).toString('base64');

function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderEmbedBadge(id, theme) {
  const tool = catalog.get(id);
  const title = id === 'deftbrain' ? 'DeftBrain' : tool?.title;
  if (!title || !['light', 'dark'].includes(theme)) return null;

  const dark = theme === 'dark';
  const background = dark ? '#18283b' : '#fffaf1';
  const foreground = dark ? '#fffaf1' : '#18283b';
  const accent = dark ? '#ffc46e' : '#87520d';
  const brand = dark ? '#acd2f4' : '#165b9a';
  const gold = dark ? '#ffc46e' : '#986018';
  const top = tool ? 6 : 21;
  const fontSize = Math.min(23, Math.floor(298 / (title.length * 0.65)));
  const toolRow = tool ? `
      <path d="M16 65h343" stroke="${accent}" opacity=".35"/>
      <text x="18" y="91" fill="${foreground}" font-size="21">${escapeXml(tool.icon || '')}</text>
      <text x="48" y="91" fill="${foreground}" font-size="${fontSize}" font-weight="700">${escapeXml(title)}</text>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="375" height="105" viewBox="0 0 375 105">
      <title>${escapeXml(title)}</title>
      <rect x="1" y="1" width="373" height="103" rx="16" fill="${background}" stroke="${accent}" stroke-width="2"/>
      <g font-family="system-ui,sans-serif">
        <image x="15" y="${top}" width="82" height="54" href="data:image/png;base64,${brain}"/>
        <text x="105" y="${top + 28}" fill="${brand}" font-size="33" font-weight="800">Deft<tspan fill="${gold}">Brain</tspan></text>
        <text x="105" y="${top + 43}" fill="${brand}" font-size="13">
          <tspan x="105">Interactive guidance for life’s awkward,</tspan>
          <tspan x="105" dy="14">confusing, and curious moments.</tspan>
        </text>
        ${toolRow}
      </g>
    </svg>`;
}

module.exports = { renderEmbedBadge, badgeIds: ['deftbrain', ...catalog.keys()] };
