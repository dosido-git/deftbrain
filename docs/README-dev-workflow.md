## Development workflow

DeftBrain runs as two processes: a React dev server (port 3000) for the
single-page app, and an Express server (port 3001) for everything else —
APIs, prerendered guide HTML, guide indexes, server-side redirects, and the
soft-404 catch-all.

The React dev server only knows about React routes. Anything Express adds
on top — `/guides`, `/api/*`, the case-insensitive tool redirects — will
404 on port 3000 because the dev server has no idea those routes exist.

### Which port serves what

| Port | What works | What breaks |
|---|---|---|
| **3000** (`npm start`) | Dashboard, tool pages, React hot reload | `/guides`, `/guides/by-tool`, `/guides/{category}`, individual guide articles, redirects, 404 status |
| **3001** (`npm run build` && `npm run server`) | Everything — full production-equivalent behavior | Hot reload (each change requires rebuild + restart) |

### When to use which

- Editing React components (DashBoard, ToolRenderer, individual tool pages,
  NotFound, Footer) — **port 3000**. Instant feedback via HMR.
- Editing guide specs (`guides/{category}/{slug}.js`), build scripts
  (`scripts/build-guides*.js`), or `backend/server.js` — **port 3001**, after
  `npm run build`.
- Smoke-testing server behavior — redirects, 404 status, sitemap output,
  trailing-slash handling, prerendered HTML — **port 3001 only**. The dev
  server can't replicate any of it.

### Common gotcha

If a guide URL works in production but 404s locally, check which port
you're on. `localhost:3000/guides/workplace/foo` will always 404 because
the React dev server doesn't proxy to Express. The same URL on
`localhost:3001` serves the prerendered HTML correctly.

### Optional: setupProxy.js

A `src/setupProxy.js` file (≈15 lines) would forward unmatched non-React
routes from the dev server to Express, eliminating the port-switching.
Not currently in place — the manual port discipline above works fine for
the typical workflow. Worth adding if you're frequently editing guide
content and React components in the same session.
