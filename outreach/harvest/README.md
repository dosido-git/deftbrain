# Broken-link prospect harvester

Scans public organisation websites for outbound links that are now dead and
that a DeftBrain tool could replace, finds a published email for the page, and
writes prospects in the owner's FileMaker format to
`outreach/new-prospects-2026-11-21-pm.csv`.

Run everything from this folder. Scan data (`orgs/`, `*.jsonl`, `*.tsv`, caches)
is gitignored: large, regenerable, and full of third-party addresses.

## Pipeline

1. **Org list** (`name<TAB>url<TAB>type` per line) from public sources: FDIC
   banks, IPEDS colleges, NCUA credit unions, NCES school districts, CISA .gov
   list, HUD housing counselors, HRSA health centers, Wikidata classes.
   Public libraries: the IMLS Public Libraries Survey (imls.gov, free; names and
   cities, no websites) -> `UV_THREADPOOL_SIZE=64 node library-sites.mjs imls-pls-fy24-ae.csv libraries.tsv`
   guesses each site (about 60% found, 2026-11-25). Yield is low: 3,031 new library
   sites gave 15 prospects.
2. `node harvest.mjs orgs.tsv extra-NAME.jsonl --workers 16 --pages 25`
   - `--from N --pages M`: deeper pass on the same sites (pages N+1 to N+M).
   - `--multi`: keep every dead link that has its own email (used for .edu/.gov).
   - Resumable: re-running skips sites already in the output file.
   - `known_hosts.txt`: organisations already contacted; skipped.
3. Emails for `noemail` rows: list their pages, `node deep.mjs pages.txt out.json`
   (`W=12` workers), merge into `deep-noemail.json`, then `python3 merge_deep.py`.
4. `bash refresh.sh`: export, Haiku fit check (`judge.mjs`, cached in
   `verdicts.json`, uses `backend/.env`; well under $1 per few hundred rows),
   mail-server check (`mxcheck.mjs`), final export.

## International

UK, Canada, Australia, New Zealand, Ireland and South Africa (Wikidata lists,
`intl.tsv`, `za.tsv`; Canada also the CRA List of charities, `cra.tsv`) scan into `extra-intl*.jsonl` and export to
`outreach/new-prospects-intl.csv`, kept apart from the US file so reply rates
can be compared. Country second-level domains (`.org.uk`, `.gov.au`, `.co.za`)
count as separate organisations.

## Export rules (`export.py`)

- Owner format: UTF-8 (curly punctuation folded to ASCII), CRLF, no trailing newline, `offer_desc` = tool name, `ps_segment`,
  `which_link` without quotes, contact-form-only rows left out.
- One row per email; every email in `outreach/all-sent.csv` is skipped.
- Same organisation: at most 3 rows, extra rows only for a different subdomain
  or department address, never a generic one (`info@`, `webmaster@`) once a
  specific one exists, none for organisations already emailed. Extra rows go at
  the end of the file so they are sent days after the first.

## Tracking columns

`followup_date`, `link_checked`, `link_placed`, `replied`, `reply_date` were
added 2026-11-22. One follow-up only, 7–10 days after the first email.

`python3 linkcheck.py` loads every sent, unbounced prospect page and fills
`link_placed` (`follow`, `nofollow` for nofollow/ugc/sponsored, `removed` if a
placed link has gone, blank if not there yet) and `link_checked`. Pages that
fail to load are left as they were. It also checks `outreach/earned-links.csv`:
links found without outreach (Ahrefs, Search Console), added by hand. Run it weekly while replies come in, then
with the quarterly rescan.

## Quarterly rescan (next: late February 2027)

Links keep breaking. Each quarter, rescan the organisations that produced
prospects (banks, colleges, large nonprofits, .edu/.gov) for new dead links:
same export rules, and no second email to an organisation within two weeks of
the last one. Scale up (Common Crawl, English-speaking countries, more tools
and guides) only once reply rates show which sources convert.
