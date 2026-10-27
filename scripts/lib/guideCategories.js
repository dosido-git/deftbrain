// scripts/lib/guideCategories.js
//
// Guides are shown under the SAME 14 categories as the tools (2026-10-24).
// Each guide's folder stays its URL (/guides/<folder>/<slug>) — nothing about
// a guide's address changes. src/data/guide-categories.json says which one or
// two of the 14 categories each guide belongs to (assigned by hand from the
// titles); everything that groups guides reads it through this file:
// the guides home and tool category pages (guideShelves.js), the category
// hubs (build-guides-indexes.js), each guide's own label (build-guides.js),
// search (build-search-assets.js) and the guides sitemap.
//
// Hubs live at /guides/<tool-category-slug>. Five old folder hubs share their
// slug with a tool category (money, career, learning, decisions,
// conversations) and simply become the new hub; the other 13 redirect
// (OLD_HUB_REDIRECTS, backend/server.js).

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

function loadToolCategories() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'data', 'categoryMeta.js'), 'utf8').replace(/\bexport\s+const\b/g, 'const');
  // eslint-disable-next-line no-new-func
  return new Function(`${src}\n;return CATEGORY_META;`)();
}

const ASSIGNED = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'guide-categories.json'), 'utf8')).guides;

// What each hub's page says about the guides in it (the tool pages' own
// descriptions are about tools).
const HUB_COPY = {
  'Home & Daily Life':   ['Leases and deposits, roommates, laundry, cooking, plants, pets and bikes: the everyday running of a home.', 'Reading a lease before you sign it. Getting red wine out of a shirt. Why the plant is turning yellow.'],
  'Travel & Events':     ['Layovers and connections, parties and get-togethers, and things worth doing on a free day.', 'Whether 60 minutes is enough for a connection. Hosting a party people remember. What to do once you have done the touristy stuff.'],
  'Relationships':       ['Friends, partners, family and roommates: keeping in touch, dates, gifts, and the moments in between.', 'Reaching out to a friend you have lost touch with. Date ideas that are not dinner and a movie. A gift for the person who has everything.'],
  'Money':               ['Bills, fees, refunds, reviews, big purchases and splitting costs, and getting a company to fix things.', 'Getting a medical bill reduced. Spotting fake reviews. Escalating when customer service says there is nothing they can do.'],
  'Career and Business': ['Raises and promotions, resumes and reviews, job offers, meetings, email and presentations: work, and getting it done with other people.', 'Writing self-review bullets that get you the raise. Running a meeting that stays on track. Pushing back on an unreasonable email.'],
  'Health & Wellness':   ['Doctor visits and test results, energy and burnout, focus and movement.', 'What to ask your doctor. Telling burnout from tiredness. The smallest workout that still counts.'],
  'Conversations':       ['What to say, and how it will land: texts, hard talks, thank-yous, toasts and apologies.', 'Replying to a passive-aggressive text. Keeping a dying conversation going. A best man speech that lands.'],
  'Learning':            ['Studying, reading research, checking facts and finding the thing you half-remember.', 'Knowing whether a study is reliable. Turning a transcript into a study guide. Finding a book whose title you forgot.'],
  'Just for Fun':        ['Hobbies, shows and games, captions, comebacks and small adventures.', 'Hobbies for adults who do not know what they like anymore. Catching up on a show without spoilers. Free things to do near you.'],
  'Self & Reflection':   ['Feelings you cannot name, dreams, energy and where your days actually go.', 'The word for that feeling. Why the same dream keeps coming back. Why it feels like you did nothing today.'],
  'Ideas & Imagination': ['Naming things, testing a business idea, and taking the first step on a creative project.', 'Coming up with a business name that is not terrible. Whether a name passes the drunk test. The smallest first step for writing a book.'],
  'Decisions':           ['Choosing between options, weighing a plan, and arguing a position well.', 'Choosing between two good options. Deciding when your gut and your logic disagree. Pressure-testing a plan before you bet money on it.'],
  'Tasks':               ['To-do lists, big projects, focus and getting started when it all feels like too much.', 'What to do first when you are overwhelmed. Breaking down a project that is too big to start. Turning a brain dump into actual tasks.'],
};

// Old folder hub → the tool-category hub that took over its guides.
const OLD_HUB_REDIRECTS = {
  apologies: 'conversations',
  cooking: 'home-daily-life',
  health: 'health-wellness',
  home: 'home-daily-life',
  meetings: 'career',
  pets: 'home-daily-life',
  planning: 'decisions',
  practical: 'home-daily-life',
  presentations: 'career',
  speeches: 'conversations',
  travel: 'travel-events',
  wellness: 'health-wellness',
  'work-meetings': 'career', // merged into Career and Business, 2026-10-27
  workplace: 'career',
};

const TOOL_CATS = loadToolCategories();
const SLUG_BY_NAME = Object.fromEntries(TOOL_CATS.map(c => [c.name, c.slug]));

// [main, second?] category names for a guide spec ({category: folder, slug}).
function categoriesForGuide(spec) {
  const cats = ASSIGNED[`${spec.category}/${spec.slug}`];
  if (!cats) throw new Error(`guide-categories.json has no entry for guides/${spec.category}/${spec.slug} — add one (main category, optional second)`);
  return cats;
}

// The hubs, in the tools' own order.
function guideHubs() {
  return TOOL_CATS.map(c => ({ name: c.name, slug: c.slug, emoji: c.emoji, desc: HUB_COPY[c.name][0], examples: HUB_COPY[c.name][1] }));
}

const hubSlugFor = name => SLUG_BY_NAME[name];

module.exports = { categoriesForGuide, guideHubs, hubSlugFor, OLD_HUB_REDIRECTS, ASSIGNED };
