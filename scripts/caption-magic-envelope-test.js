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
    { text: 'my kitchen at 4pm on a sunday. wood, steel, light.',                      hashtags: [{tag:'kitchen'},{tag:'newbuild'}], why_it_works: 'Grounds it in a specific moment.' },
    { text: 'the quiet of a kitchen when nobody’s using it',                       hashtags: [{tag:'kitchen'}],                  why_it_works: 'Calm framing.' },
    { text: 'wood, steel, and two windows doing the heavy lifting',                     hashtags: [{tag:'kitchen'},{tag:'interiors'}], why_it_works: 'Names what is in the frame.' },
  ],
  alt_text: 'A recently renovated kitchen with wood cabinetry and stainless-steel appliances.',
  engagement_tips: [
    'A caption this plain makes people stop rather than scroll past.',
    'Naming the three materials gives a reply somewhere to land.',
  ],
};

const EXPECT_FLAGGED = ['captions[0].text', 'captions[1].text', 'alt_text', 'engagement_tips[0]'];
const EXPECT_CLEAN   = ['captions[2].text', 'engagement_tips[1]'];
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
  out.engagement_tips.forEach((t, i) => walk(`engagement_tips[${i}]`, t, before.engagement_tips[i]));

  console.log('\nCHANGED:', changed.join(', ') || '(none)');
  const caught = EXPECT_FLAGGED.filter(f => changed.includes(f));
  const falsePos = EXPECT_CLEAN.filter(f => changed.includes(f));
  console.log(`caught  ${caught.length}/${EXPECT_FLAGGED.length}  — missed: ${EXPECT_FLAGGED.filter(f=>!caught.includes(f)).join(', ')||'none'}`);
  console.log(`false positives on clean lines: ${falsePos.join(', ') || 'none'}`);
  console.log('\n── repaired ──');
  out.captions.forEach((c,i)=>{ if(c.text!==before.captions[i].text) console.log(`  captions[${i}].text\n    was: ${before.captions[i].text}\n    now: ${c.text}`); });
  if (out.alt_text !== before.alt_text) console.log(`  alt_text\n    was: ${before.alt_text}\n    now: ${out.alt_text}`);
  out.engagement_tips.forEach((t,i)=>{ if(t!==before.engagement_tips[i]) console.log(`  engagement_tips[${i}]\n    was: ${before.engagement_tips[i]}\n    now: ${t}`); });
  process.exit(0);
})();
