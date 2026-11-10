const fs = require('node:fs');
const path = require('node:path');
const { renderEmbedBadge, badgeIds } = require('../src/seo/embedBadge');

const output = path.join(__dirname, '..', 'build', 'embeds');
for (const id of badgeIds) {
  const directory = path.join(output, id);
  fs.mkdirSync(directory, { recursive: true });
  for (const theme of ['light', 'dark']) {
    fs.writeFileSync(path.join(directory, theme + '.svg'), renderEmbedBadge(id, theme));
  }
}
console.log(`Built ${badgeIds.length * 2} DeftBrain embed badges.`);
