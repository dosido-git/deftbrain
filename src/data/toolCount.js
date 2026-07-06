// The public-facing tool count. Copy uses a decade floor ("120+") rather than
// the exact number, so the catalog can gain or lose a few tools without every
// piece of copy going stale — The Operator's call, 2026-07-06. Computed from
// the catalog so it can never drift; scripts/verify-build.js enforces that the
// static HTML (homepage title/meta, About) uses the same label.
import { tools } from './tools';

export const TOOL_COUNT_LABEL = `${Math.floor(tools.length / 10) * 10}+`;
