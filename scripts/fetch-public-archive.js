const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const file = path.join(__dirname, '../public/djLowerCBCT.zip');

async function hydrateArchive() {
  if (!fs.existsSync(file) || fs.statSync(file).size > 1024) return;
  const pointer = fs.readFileSync(file, 'utf8');
  const match = /^version https:\/\/git-lfs\.github\.com\/spec\/v1\noid sha256:([a-f0-9]{64})\nsize (\d+)\s*$/.exec(pointer);
  if (!match) throw new Error('Invalid ZIP or Git LFS pointer.');

  const temp = file + '.download';
  try {
    const url = 'https://media.githubusercontent.com/media/dosido-git/deftbrain/ce078dc49/public/djLowerCBCT.zip';
    const response = await fetch(url, { signal: AbortSignal.timeout(180_000) });
    if (!response.ok || !response.body) throw new Error('Archive download returned HTTP ' + response.status);

    const hash = createHash('sha256');
    await pipeline(Readable.fromWeb(response.body), async function* (chunks) {
      for await (const chunk of chunks) {
        hash.update(chunk);
        yield chunk;
      }
    }, fs.createWriteStream(temp));
    if (fs.statSync(temp).size !== Number(match[2]) || hash.digest('hex') !== match[1]) {
      throw new Error('Downloaded archive does not match the Git LFS pointer.');
    }
    fs.renameSync(temp, file);
  } finally {
    fs.rmSync(temp, { force: true });
  }
}

hydrateArchive().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
