// toolTagline.js — the tagline as the header should print it.
//
// A tool page header prints the catalog `icon` in its own span and then the
// catalog `tagline` beside it. Several taglines are written with the icon
// already at the front — that is how the owner writes them, and it is right for
// anywhere the tagline appears on its own. In the header it renders twice:
//
//   🗺️🗺️ Turn a free hour into a small adventure
//
// Strip it at render rather than editing the tagline. The wording is the
// owner's; the duplication is ours. Inlined in three tool files before this
// existed, which is two more than a non-obvious regex should be copied.
const LEADING_EMOJI = /^\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*\s*/u;

export function toolTagline(tagline) {
  return String(tagline ?? '').replace(LEADING_EMOJI, '');
}

export default toolTagline;
