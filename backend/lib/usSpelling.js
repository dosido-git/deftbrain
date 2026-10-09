// British spellings in a US-English reply (2026-10-08). Runs set to en-US
// came back with "utilisation", "optimised", "signalling", "favourable"
// (Break My Plan?, Future Proof, Giftology). A prompt line is one more rule
// the model can drop, so the reply is fixed in code instead, the same way
// voiceFix.js fixes "the visitor": every English /api JSON reply passes
// through here when the visitor is in the US (or gave no region).
//
// Deliberately a fixed word list, not a suffix rule: "-ise" is also the end
// of advise, promise, exercise, expertise, otherwise, surprise. Each entry is
// a British stem plus the endings it takes. A word the visitor typed
// themselves (a lease that says "organisation", a guest list that says
// "neighbours") is left exactly as they wrote it.

// -ise/-yse verbs: stem → endings. "analys" keeps "analysis" untouched
// because "is" is not one of its endings.
const ISE = ['optimis', 'organis', 'prioritis', 'recognis', 'realis', 'specialis', 'utilis', 'minimis',
  'maximis', 'summaris', 'categoris', 'apologis', 'criticis', 'emphasis', 'finalis', 'formalis',
  'normalis', 'standardis', 'visualis', 'personalis', 'customis', 'capitalis', 'memoris', 'mobilis',
  'stabilis', 'authoris', 'characteris', 'monetis', 'digitis', 'centralis', 'generalis', 'incentivis',
  'jeopardis', 'scrutinis', 'sympathis', 'familiaris', 'harmonis', 'modernis', 'neutralis',
  'penalis', 'rationalis', 'revitalis', 'sanitis', 'socialis', 'synchronis', 'energis', 'legitimis'];
const ISE_ENDINGS = ['e', 'ed', 'es', 'ing', 'ation', 'ations', 'er', 'ers'];

const WORDS = {
  analyse: 'analyze', analysed: 'analyzed', analyses_verb: null, analysing: 'analyzing',
  colour: 'color', colours: 'colors', coloured: 'colored', colourful: 'colorful',
  favour: 'favor', favours: 'favors', favoured: 'favored', favourable: 'favorable', favourably: 'favorably',
  favourite: 'favorite', favourites: 'favorites', unfavourable: 'unfavorable',
  behaviour: 'behavior', behaviours: 'behaviors', behavioural: 'behavioral',
  neighbour: 'neighbor', neighbours: 'neighbors', neighbourhood: 'neighborhood', neighbourhoods: 'neighborhoods', neighbouring: 'neighboring',
  labour: 'labor', honour: 'honor', honours: 'honors', honoured: 'honored', humour: 'humor', flavour: 'flavor',
  flavours: 'flavors', rumour: 'rumor', rumours: 'rumors', endeavour: 'endeavor', endeavours: 'endeavors',
  centre: 'center', centres: 'centers', centred: 'centered', theatre: 'theater', theatres: 'theaters',
  fibre: 'fiber', litre: 'liter', litres: 'liters', metre: 'meter', metres: 'meters', kilometre: 'kilometer', kilometres: 'kilometers',
  programme: 'program', programmes: 'programs',
  defence: 'defense', offence: 'offense', offences: 'offenses', licence: 'license', licences: 'licenses',
  travelled: 'traveled', travelling: 'traveling', traveller: 'traveler', travellers: 'travelers',
  modelling: 'modeling', modelled: 'modeled', labelled: 'labeled', labelling: 'labeling',
  signalling: 'signaling', signalled: 'signaled', fuelled: 'fueled', counsellor: 'counselor', counsellors: 'counselors',
  jewellery: 'jewelry', catalogue: 'catalog', catalogues: 'catalogs', tyre: 'tire', tyres: 'tires',
  enrolment: 'enrollment', fulfil: 'fulfill', fulfils: 'fulfills', fulfilment: 'fulfillment',
  instalment: 'installment', instalments: 'installments', skilful: 'skillful', aluminium: 'aluminum',
  whilst: 'while', learnt: 'learned', ageing: 'aging', cosy: 'cozy', mould: 'mold', plough: 'plow',
  paediatric: 'pediatric', paediatrician: 'pediatrician', anaesthetic: 'anesthetic', oestrogen: 'estrogen',
  haemorrhage: 'hemorrhage', diarrhoea: 'diarrhea', oesophagus: 'esophagus', manoeuvre: 'maneuver', manoeuvres: 'maneuvers',
};
delete WORDS.analyses_verb; // "analyses" is also the plural of analysis — leave it

for (const stem of ISE) {
  for (const end of ISE_ENDINGS) WORDS[stem + end] = stem.slice(0, -1) + 'z' + end;
}

const PATTERN = new RegExp(`\\b(${Object.keys(WORDS).sort((a, b) => b.length - a.length).join('|')})\\b`, 'gi');

function matchCase(src, out) {
  if (src === src.toUpperCase() && src.length > 1) return out.toUpperCase();
  if (src[0] === src[0].toUpperCase()) return out[0].toUpperCase() + out.slice(1);
  return out;
}

// keep: lowercase British words the visitor typed — left as written.
function fixText(s, keep = new Set()) {
  if (typeof s !== 'string' || !/[a-z]/i.test(s)) return s;
  // URLs (and email-ish tokens) are left alone: a link's path is not prose.
  return s.split(/((?:https?:\/\/|www\.)\S+|\S+@\S+)/i).map((part, i) => (i % 2 ? part : part.replace(PATTERN, (m, _w, at, str) => {
    const lower = m.toLowerCase();
    if (keep.has(lower)) return m;
    // A capital mid-sentence is a name ("European Centre for Disease
    // Prevention", "Labour Party") — names keep their own spelling.
    if (m[0] !== m[0].toLowerCase() && /[^\s.!?:;"“([—–-]\s*$/.test(str.slice(Math.max(0, at - 3), at))) return m;
    const us = WORDS[lower];
    return us ? matchCase(m, us) : m;
  }))).join('');
}

function typedBritish(body) {
  let typed = '';
  try { typed = JSON.stringify(body || {}); } catch (_) { typed = ''; }
  const keep = new Set();
  for (const m of typed.matchAll(PATTERN)) keep.add(m[0].toLowerCase());
  return keep;
}

// US English unless the visitor said otherwise: a non-US region, or an en-*
// locale other than en-US, keeps the model's spelling.
function wantsUS(body) {
  const region = String(body?.userRegion || '').toUpperCase();
  if (region) return region === 'US';
  const locale = String(body?.userLocale || '');
  return !locale || /^en-US$/i.test(locale);
}

module.exports = { fixText, typedBritish, wantsUS };
