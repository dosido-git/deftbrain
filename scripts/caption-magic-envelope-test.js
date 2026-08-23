#!/usr/bin/env node
// Caption Magic's envelope validator, tested against planted violations.
//
// NOT a pre-push gate: it costs two live model calls and takes ~10s. Run it by
// hand after touching the validator or repair prompts:
//
//   node scripts/caption-magic-envelope-test.js
//
// It exists because this component's failure mode is silence. A validator that
// has stopped working returns the same empty violation list as one that found
// nothing wrong, and the route is fail-open by design, so nothing anywhere
// would say so. Planting known violations is the only way to tell the two
// apart. Two of these lines are clean and must come back untouched.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
const router = require(path.join(__dirname, '..', 'backend', 'routes', 'caption-magic.js'));

const envelope = {
  observed: ['interior kitchen', 'wood-frame cabinetry', 'stainless-steel appliances',
             'wood flooring', 'two windows', 'daylight through windows'],
  uncertain: ['countertop material', 'time of day'],
  prohibited_inferences: [
    'ownership — whether the poster owns, made, found, bought or built anything pictured',
    'when the photo was taken — date, day, time of day, season, or how recently',
    'whether anyone uses, lives in, works in or has ever visited the pictured place',
    'the age, condition, price, brand or history of anything pictured',
    'what viewers will do, feel, notice or how they will respond to the post',
  ],
};

const out = {
  captions: [
    // must be flagged: ownership + a timestamp nobody established
    { text: 'my kitchen at 4pm on a sunday. wood, steel, light.', hashtags: [{tag:'kitchen'},{tag:'sundaymorning'}], why_it_works: 'Grounds it in a specific moment.' },
    // must SURVIVE: personification and an absurd premise, inventing no fact
    { text: 'the cabinetry and i have reached an understanding. the appliances remain neutral. the windows know nothing.', hashtags: [{tag:'kitchen'},{tag:'morningsomewhere'}], why_it_works: 'Anthropomorphises the room.' },
    // must SURVIVE: caption voice, first person, provable of nobody
    { text: 'me wondering what any of this has to do with anything', hashtags: [{tag:'interiors'}], why_it_works: 'Reads as a passing thought.' },
    // must be flagged: invented backstory
    { text: 'after three hours of repotting, the light finally did something', hashtags: [{tag:'kitchen'}], why_it_works: 'Rewards the effort.' },
  ],
  alt_text: 'A recently renovated kitchen with wood cabinetry and stainless-steel appliances.',
};

// Deceptive invention — must be caught AND actually gone afterwards. Checking
// only that the field changed is how a repair that reworded around the claim
// ("after three hours of repotting, the light finally showed up") scored as a
// pass. The claim is the thing under test, not the edit.
const EXPECT_FLAGGED = ['captions[0].text', 'captions[0].hashtags', 'captions[3].text', 'alt_text'];
const MUST_BE_GONE = {
  'captions[0].text': /\bmy kitchen\b|4\s*pm|sunday/i,
  'captions[0].hashtags': /sundaymorning/i,
  'captions[3].text': /three hours|repotting/i,
  'alt_text': /recently renovated|renovated/i,
};
// Creative invention — must survive untouched. These are the product working,
// and a validator that "fixes" them has optimised Caption Magic into Caption
// Sensible. A false positive here is a worse failure than a missed violation.
const EXPECT_CLEAN   = ['captions[1].text', 'captions[1].hashtags', 'captions[2].text'];
const before = JSON.parse(JSON.stringify(out));

(async () => {
  await router._enforceEnvelope(out, envelope, { userLanguage: 'en', locale: '', context: '' });
  const changed = [];
  const walk = (p, a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) changed.push(p); };
  out.captions.forEach((c, i) => {
    walk(`captions[${i}].text`, c.text, before.captions[i].text);
    walk(`captions[${i}].hashtags`, c.hashtags, before.captions[i].hashtags);
    walk(`captions[${i}].why_it_works`, c.why_it_works, before.captions[i].why_it_works);
  });
  walk('alt_text', out.alt_text, before.alt_text);

  console.log('\nCHANGED:', changed.join(', ') || '(none)');
  const textOf = (p) => {
    const m = p.match(/^captions\[(\d+)\]\.(\w+)$/);
    if (!m) return JSON.stringify(out[p]);
    const c = out.captions[+m[1]];
    return m[2] === 'hashtags' ? (c.hashtags || []).map(h => h.tag).join(' ') : String(c[m[2]] || '');
  };
  const caught = EXPECT_FLAGGED.filter(f => changed.includes(f) && !MUST_BE_GONE[f].test(textOf(f)));
  const reworded = EXPECT_FLAGGED.filter(f => changed.includes(f) && MUST_BE_GONE[f].test(textOf(f)));
  if (reworded.length) console.log('REWORDED BUT CLAIM SURVIVES:', reworded.join(', '));
  const falsePos = EXPECT_CLEAN.filter(f => changed.includes(f));
  console.log(`caught  ${caught.length}/${EXPECT_FLAGGED.length}  — missed: ${EXPECT_FLAGGED.filter(f=>!caught.includes(f)).join(', ')||'none'}`);
  console.log(`false positives on clean lines: ${falsePos.join(', ') || 'none'}`);
  console.log('\n── repaired ──');
  out.captions.forEach((c,i)=>{ if(c.text!==before.captions[i].text) console.log(`  captions[${i}].text\n    was: ${before.captions[i].text}\n    now: ${c.text}`);
    const bt=JSON.stringify((before.captions[i].hashtags||[]).map(h=>h.tag)), at=JSON.stringify((c.hashtags||[]).map(h=>h.tag));
    if(bt!==at) console.log(`  captions[${i}].hashtags\n    was: ${bt}\n    now: ${at}`); });
  if (out.alt_text !== before.alt_text) console.log(`  alt_text\n    was: ${before.alt_text}\n    now: ${out.alt_text}`);
  process.exit(0);
})();
