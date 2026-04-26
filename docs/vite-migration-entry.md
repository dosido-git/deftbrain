## Build tool migration: Create React App → Vite

**Status:** Deferred
**Added:** 2026-04-25
**Owner:** Bruce

### Context

Create React App (CRA) was officially deprecated by the React team on
February 14, 2025. The React docs no longer recommend it for new or
existing projects, and direct migrations to either a framework
(Next.js, React Router) or a build tool (Vite, Parcel, RSBuild).

DeftBrain currently runs on CRA via `react-scripts`. The app builds
and runs fine, but the toolchain is no longer maintained:

- No security patches for CRA itself or its frozen webpack dep tree
- No compatibility fixes — React 19 already breaks new CRA setups
  via peer dependency conflicts
- No new feature support — modern React features land in framework
  and build tools first

The risk compounds. Each month without migration accumulates more
unpatched CVEs in the transitive dep tree, and the migration cost
grows with every new feature built on the current stack.

### Current state

CRA setup is standard:
- `react-scripts` for dev server and production build
- Frontend on port 3000 (CRA dev server) in dev, served from `build/`
  by Express in prod
- Custom prerender step writes flat HTML files to `build/{ToolName}.html`
  for SEO (referenced in `backend/server.js`)
- `public/index.html` template
- `REACT_APP_*` environment variables
- Express backend on port 3001 (dev) handling API routes, redirects,
  and serving the React build in production

### Decision

When migration is triggered, target **Vite** specifically — not Next.js
or another framework.

Reasons Vite is the right target for DeftBrain:
- DeftBrain is a pure SPA with an Express backend handling routing,
  prerendering, and redirects. Vite imposes no opinions on architecture;
  Next.js would force a rewrite of the routing model and conflict
  with the existing prerender setup.
- Vite's dev server (sub-second cold start, near-instant HMR) is a
  meaningful upgrade for a sole developer iterating on 120+ tools.
- Migration tooling is mature (`viject` automates much of the mechanical
  work); the path is well-trodden.
- Vite output is static files, same shape as CRA's — Express server.js
  needs minimal changes.
- Vite 8 (March 2026) ships with Rolldown, eliminating the previous
  esbuild-vs-Rollup dev/prod inconsistency.

### Trigger — revisit when any of these happen

- A security advisory affects a CRA dependency that can't be patched
  without updating beyond CRA's frozen tree
- A library DeftBrain wants to use requires React 19+ (CRA's peer-dep
  tree blocks this)
- Dev server cold-start or HMR latency crosses the threshold where it's
  costing meaningful developer time
- A CRA-specific bug surfaces that won't get fixed (since CRA is
  in maintenance mode only)
- The launch arc finishes (compliance audit complete, content cluster
  shipped, trademark filed, GSC traffic flowing) — at which point this
  becomes the right discrete project to take on next

### Implementation notes for future-you

- **Estimated effort:** 1–3 days of focused work, ideally a long weekend
- **Approach:** discrete project, not interleaved with feature work.
  Use a dedicated branch; don't ship partial migration.
- **Staging dry-run before swap:** deploy the Vite build to a Railway
  staging service first, diff against prod, then promote
- **Mechanical migration steps (rough):**
  - `npm uninstall react-scripts`
  - `npm install -D vite @vitejs/plugin-react vite-tsconfig-paths`
  - Move `public/index.html` to project root, update `<script>`
    reference to `/src/index.jsx`
  - Create `vite.config.js` with `react()` plugin and any path aliases
  - Find/replace `process.env.REACT_APP_` → `import.meta.env.VITE_`
    across `src/` and any `.env*` files
  - Update `package.json` scripts: `"start": "vite"`,
    `"build": "vite build"`
  - Verify Express `server.js` still finds the build output —
    Vite defaults to `dist/`, may need to set `build.outDir: 'build'`
    in vite.config.js to keep server.js paths working
- **The wrinkle that needs verification first:** the custom prerender
  script (whatever produces `build/SpiralStopper.html` etc.). Most
  prerender solutions (Puppeteer, react-snap variants) port forward
  to Vite without issue, but confirm before committing to a date.
  Read the prerender script and identify any CRA-specific
  assumptions (webpack chunks, asset paths) before starting.
- **Tools to consider:** `viject` for one-shot automated migration
  (https://github.com/bhbs/viject) — applies most of the mechanical
  changes automatically and absorbs differences in `vite.config`
- **Verification after migration:**
  - `npm run build` succeeds and produces `build/` (or `dist/`)
    with same shape as CRA output
  - `NODE_ENV=production node backend/server.js` serves the new
    build correctly
  - Sample 3–5 tools across categories — they render and behave
    identically to prod
  - All prerendered tool HTML files are present and load standalone
  - Dev server starts in under 2 seconds (`npm run dev`)
  - HMR works on a representative tool component

### Counter-argument to revisit

The strongest case for staying on CRA is that the application works
today, and migration introduces real risk for zero user-facing
benefit. The dev experience improvement is real but modest in
absolute terms — Bruce's iteration cycle isn't blocked by build
times today. Security risk from frozen webpack deps is real but
diffuse, not acute.

If 12 months pass and none of the triggers fire — no security
advisory forces migration, no needed library requires React 19, no
critical CRA bug surfaces, dev-time friction stays manageable — the
right move may be to keep deferring rather than migrate on
principle. The migration window stays open. The cost of waiting is
non-zero but bounded.

Don't migrate to follow the deprecation news. Migrate when a real
signal warrants it.
