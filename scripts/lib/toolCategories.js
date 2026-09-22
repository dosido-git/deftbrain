// scripts/lib/toolCategories.js
//
// Node-side twin of src/components/AllToolsPage.js's own LEGACY_MAP /
// categoriesFor(). AllToolsPage.js is a React/JSX module and can't be
// require()'d from a plain Node build script, so this is a deliberate,
// minimal duplication rather than a shared import — same convention as
// src/seo/chrome.js's getFooterHTML() vs. the live React Footer.js: if you
// change one, change the other.
//
// Consumed by:
//   - scripts/generate-sitemap.js           (per-category tool-count hashing)
//   - scripts/build-tools-category-pages.js (the actual /tools/{slug} pages)

const LEGACY_MAP = {
  Academic:['Learning'], Communication:['Conversations'], 'Daily Life':['Home & Daily Life'],
  Health:['Health & Wellness'], 'Mind & Energy':['Health & Wellness'], Money:['Money'],
  Productivity:['Tasks'], Detour:['Just for Fun'], Body:['Health & Wellness'], Life:['Home & Daily Life'],
  Lifestyle:['Home & Daily Life'], Finance:['Money'], 'Consumer Rights':['Money'],
  'Mental Health':['Health & Wellness'], 'Health & Wellness':['Health & Wellness'],
  'Neurodivergent Support':['Health & Wellness'], Social:['Relationships'], 'Social Skills':['Relationships'],
  Career:['Career'], Strategic:['Decisions'], Goals:['Tasks'],
  'Focus & Productivity':['Health & Wellness','Tasks'], 'Document Analysis':['Learning'],
  'Conflict Resolution':['Conversations'], 'Content Creation':['Conversations'], Work:['Work & Meetings'],
  Creative:['Ideas & Imagination'], Thinking:['Just for Fun'], 'Brain Games':['Just for Fun'],
  wellness:['Health & Wellness'], Intercourse:['Conversations'], 'Read the Room':['Relationships'],
};

function categoriesFor(tool) {
  if (Array.isArray(tool.categories) && tool.categories.length) return tool.categories;
  if (tool.category) return LEGACY_MAP[tool.category] || [tool.category];
  return [];
}

module.exports = { categoriesFor, LEGACY_MAP };
