// The general emergency number for a region, as fact rather than recall.
//
// WHY THIS IS CODE AND NOT A PROMPT. A wrong crisis number is worse than no
// number: someone dials it at the worst moment of their life, gets a dead line
// or a stranger, and may not try again. The old GriefGuide prompt listed five
// countries as exemplars, which invited the model to produce a sixth for the
// ~190 it did not cover. The rewrite removed the exemplars and told the model
// to give country-specific information "only when confident it is correct" —
// but calibrated confidence is exactly what a model does not have. So the part
// that must never be wrong comes from a table, and the model is left with the
// part we genuinely cannot know.
//
// THE RULE FOR ADDING A ROW. Only the nationally-published general emergency
// number — the one that dispatches an ambulance. Not a crisis or suicide
// helpline: those change, they are frequently misremembered, and they are the
// single thing most likely to be confabulated. When there is any doubt about a
// country, leave it out. The caller's fallback ("contact your local emergency
// services") is vague but never wrong, and vague-and-correct beats
// specific-and-wrong every time.
//
// Deliberately NOT here: national suicide/crisis lines, mental-health warmlines,
// text services, and per-city numbers.

// 112 is the single European emergency number: it reaches emergency services
// in every EU and EEA state, and in several neighbouring countries that adopted
// it. Listed by country so a lookup is explicit rather than inferred.
const EU_112 = [
  'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR',
  'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MT', 'NL',
  'NO', 'PL', 'PT', 'RO', 'RS', 'SE', 'SI', 'SK', 'TR', 'UA',
];

const NUMBERS = {
  // Americas
  US: '911', CA: '911', MX: '911', AR: '911', BR: '192', CL: '131', CO: '123',
  // Europe (112 block below) plus the ones with their own primary number
  GB: '999', RU: '112',
  // Asia-Pacific
  AU: '000', NZ: '111', JP: '119', KR: '119', CN: '120', TW: '119',
  HK: '999', SG: '995', MY: '999', ID: '112', PH: '911', IN: '112',
  TH: '1669', VN: '115',
  // Middle East and Africa
  IL: '101', AE: '998', SA: '997', EG: '123', ZA: '112', NG: '112', KE: '999',
};
for (const cc of EU_112) NUMBERS[cc] = '112';

// `region` is whatever the client sent (an ISO alpha-2, or a locale such as
// "pt-BR"). Returns null when the region is unknown or unmapped — the caller
// must treat null as "say local emergency services" and not guess.
function emergencyNumberFor(region) {
  if (!region || typeof region !== 'string') return null;
  const cc = (region.includes('-') ? region.split('-').pop() : region).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return null;
  return NUMBERS[cc] || null;
}

module.exports = { emergencyNumberFor, NUMBERS };
