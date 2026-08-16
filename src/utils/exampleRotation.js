/**
 * src/utils/exampleRotation.js
 * ──────────────────────────────────────────────────────────────────────
 * Which example "Try an example" hands you.
 *
 * WHY THIS EXISTS. 39 tools carried two or more examples and every one of them
 * picked with Math.random() on each click. A coin flip is not rotation: half of
 * all second clicks repeat the first example, and a visitor who comes back
 * tomorrow has an even chance of being shown the one they already saw. The
 * second example was written, translated, and then hidden behind a 50% roll.
 *
 * A counter in localStorage fixes both. Each click advances it, so the second
 * click always shows the other example, and the position survives a reload —
 * come back next week and you continue where you left off rather than
 * re-rolling. One key per tool, so tools do not drag each other along.
 *
 * Not a hook: there is no state React needs to know about. Reading it does not
 * re-render anything, and calling it from inside a click handler is the whole
 * usage. Keeping it a plain function means no rules-of-hooks constraints on
 * where a tool's loadExample can live.
 */

const storageKey = toolKey => `db-ex-${toolKey}`;

/**
 * Advance the rotation and return the example to load.
 *
 * @param {string} toolKey  stable per-tool id — use the component name
 * @param {Array}  list     the tool's examples, in a stable order
 * @returns the next example, or undefined if the list is empty
 */
export function pickExample(toolKey, list) {
  if (!Array.isArray(list) || list.length === 0) return undefined;
  if (list.length === 1) return list[0];

  let i = 0;
  try {
    const raw = window.localStorage.getItem(storageKey(toolKey));
    const n = Number.parseInt(raw, 10);
    i = Number.isFinite(n) && n >= 0 ? n % list.length : 0;
    window.localStorage.setItem(storageKey(toolKey), String((i + 1) % list.length));
  } catch {
    // Private browsing, a full quota, or storage switched off. The example
    // still loads — it just always starts from the first one, which is the
    // behaviour someone with no storage would expect anyway.
    i = 0;
  }
  return list[i];
}

export default pickExample;
