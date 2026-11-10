const tools = require('../../public/search/tools.json');

const titles = new Map(tools.map(({ id, title }) => [id, title]));

function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderEmbedBadge(id, theme) {
  const title = id === 'deftbrain' ? 'DeftBrain' : titles.get(id);
  if (!title || !['light', 'dark'].includes(theme)) return null;

  const dark = theme === 'dark';
  const background = dark ? '#18283b' : '#fffaf1';
  const foreground = dark ? '#fffaf1' : '#18283b';
  const accent = dark ? '#ffc46e' : '#87520d';
  const fontSize = Math.min(24, Math.floor(290 / (title.length * 0.65)));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="375" height="105" viewBox="0 0 375 105">
      <title>${escapeXml(title)}</title>
      <rect x="1" y="1" width="373" height="103" rx="16" fill="${background}" stroke="${accent}" stroke-width="2"/>
      <text x="20" y="33" fill="${accent}" font-family="system-ui,sans-serif" font-size="18" font-weight="700">${id === 'deftbrain' ? 'GUIDED TOOLS' : 'DEFTBRAIN'}</text>
      <text x="20" y="71" fill="${foreground}" font-family="system-ui,sans-serif" font-size="${fontSize}" font-weight="700">${escapeXml(title)}</text>
      <text x="332" y="71" fill="${accent}" font-family="system-ui,sans-serif" font-size="27">→</text>
    </svg>`;
}

module.exports = { renderEmbedBadge, badgeIds: ['deftbrain', ...titles.keys()] };
