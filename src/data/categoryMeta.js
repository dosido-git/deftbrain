// Shared by DashBoard.js (category filter pills) and HomeIntro.js (homepage
// category chips) — pulled into its own module rather than exported from
// DashBoard.js because HomeIntro.js is rendered BY DashBoard.js, so an
// import the other way would be circular.
//
// Permanent category names (2026-09-21) — replaces the playful names as the
// primary label. The playful name isn't gone: it moved into `tag`, the small
// plain-language line TilePill renders under the big label (DashBoard.js) —
// hierarchy flipped. `sub` is DashBoard's hover-tooltip text; unused by the
// homepage chips.
export const CATEGORY_META = [
  { name: 'Home & Daily Life',   emoji: '🌅', tag: 'the grind', sub: 'home · household · daily life' },
  { name: 'Travel & Events',     emoji: '🗺️',  tag: 'out & about', sub: 'travel · events · adventure'  },
  { name: 'Relationships',       emoji: '👥', tag: 'humans', sub: 'relationships · people · bonds' },
  { name: 'Money',               emoji: '💰', tag: 'loot', sub: 'money · finances · consumer'   },
  { name: 'Career',              emoji: '🚀', tag: 'pursuits', sub: 'career · growth · identity'    },
  { name: 'Work & Meetings',     emoji: '🏢', tag: 'the office', sub: 'work · meetings · tools'       },
  { name: 'Health & Wellness',   emoji: '⚡', tag: 'energy', sub: 'mind · body · fuel'  },
  { name: 'Conversations',       emoji: '🗣️ ', tag: 'discourse', sub: 'say it well!'           },
  { name: 'Learning',            emoji: '🔬', tag: 'go deep!', sub: 'research · learning · knowledge'},
  { name: 'Just for Fun',        emoji: '🧩', tag: 'diversions', sub: 'fun · curiosity · play'  },
  { name: 'Self & Reflection',   emoji: '🪞', tag: 'me', sub: 'self · reflection · growth'    },
  { name: 'Ideas & Imagination', emoji: '✨', tag: 'what if?', sub: 'imagination · creativity'      },
  { name: 'Decisions',           emoji: '🧭', tag: 'veer', sub: 'decisions · direction · choices'},
  { name: 'Tasks',               emoji: '✅', tag: 'do it!', sub: 'execution · unstuck · tasks'   },
];
