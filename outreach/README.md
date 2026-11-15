# Outreach: broken-link finder

Finds dead outbound links on prospect pages (tenant resource lists, off-campus
housing pages, legal-aid link pages) where a DeftBrain tool or guide could be
the replacement.

## Run

From the repo root, in your own terminal (it needs normal internet access):

    node outreach/dead-link-finder.mjs

It reads `outreach/prospects.txt` and writes to `outreach/results/`:

- `prospects-YYYY-MM-DD.csv`: one row per page, sorted by relevant dead
  links: title, last-updated text, newest year on the page, outside-link
  count, nofollow share, contact page and emails.
- `dead-links-YYYY-MM-DD.csv`: one row per dead link, strongest matches
  first: anchor text, error, and the Wayback Machine snapshot and title of
  what the link used to be.

Options: `--concurrency N` (default 8), `--no-wayback`, `--fresh` (ignore the
7-day link cache), `--all-links` (also check same-site navigation links).

## Reading the results

- `verdict`: `dead` (4xx/5xx, no such host, refused) or `soft404` (redirects
  to a home page, or a page titled "not found"). Links that time out, return
  403/429 or fail DNS temporarily are counted as `uncertain` in the prospects
  file, not listed as dead: recheck those by hand.
- `relevance`: `strong` if the anchor, URL or archived title mentions
  deposits, move-in/move-out, checklists, inspections, demand letters or small
  claims; `weak` for general tenant/landlord/housing words. Edit `STRONG` and
  `WEAK` at the top of the script to reuse it for another tool.
- Open `wayback_url` to confirm the dead page did what our replacement does
  before pitching.

Add prospects to `prospects.txt` as you find them; reruns skip links checked
in the last 7 days.
