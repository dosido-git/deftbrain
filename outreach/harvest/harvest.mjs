// Broken-link prospect harvester.
// Usage: node harvest.mjs <orgs.tsv name\turl\ttype> <results.jsonl> [--limit N] [--workers N]
// Per org: find topic pages (sitemap, else homepage links) -> outbound links whose
// URL/anchor matches a DeftBrain tool topic -> check each (404/410/no DNS = dead)
// -> one prospect per org with a published email, else recorded as no-email.
// Resumable: orgs already in results.jsonl are skipped.
import fs from 'node:fs';

const [, , orgFile, outFile, ...rest] = process.argv;
const opt = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? Number(rest[i + 1]) : d; };
const LIMIT = opt('--limit', Infinity), WORKERS = opt('--workers', 8);
// --from N: skip the N best-scoring pages (a deeper second pass over the same sites)
const FROM = opt('--from', 0), NPAGES = opt('--pages', 20);
// --multi: keep every broken link with its own email (one line each) instead of one per org
const MULTI = rest.includes('--multi');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';


// tool id, display name, test on "dead url + anchor" (lowercase). First match wins.
const TOOLS = [
  ['ScamRadar', 'Scam Radar', /\bscam|fraud|phish|identity[- ]?theft|idtheft|imposter|impostor|(lottery|sweepstakes?|prize|romance) (scam|fraud)|robocall|do-?not-?call|onguardonline|ftccomplaintassistant|elder (financial )?abuse|ponzi|spoof|counterfeit check|fake check/],
  ['BillRescue', 'Bill Rescue', /debt|collection agenc|collector|medical bill|billing error|foreclos|mortgage (help|relief|trouble|modif)|loan modif|bankrupt|garnish|credit counsel|payday|making home affordable|hope now|995hope/],
  ['FinalWish', 'Final Wish', /advance directive|living will|end[- ]of[- ]life|funeral|burial|estate plan|power of attorney|cremation|final wishes|caringinfo/],
  ['GriefGuide', 'GriefGuide', /grief|bereave|mourning|grieving/],
  ['RentersDepositSaver', "Renter's Deposit Saver", /security deposit|move[- ]in checklist|move[- ]out checklist|move-in inspection/],
  ['LeaseTrapDetector', 'Lease Trap Detector', /\blease|tenant|renter|landlord|rental agreement|off[- ]campus housing/],
  ['NerveCheck', 'Nerve Check', /interview (tips|prep|skills)|job interview|interviewing|public speaking|test anxiety|stage fright/],
  ['MentalHealthNavigator', 'Mental Health Navigator', /mental health|mentalhealth|therapist|psychotherap|depression|anxiety|psychiatr|counseling center|find (a )?counselor/],
  ['SleepArchitect', 'Sleep Architect', /\bsleep|insomnia/],
  ['DriveHome', 'Drive Home', /drowsy driv|drunk driv|impaired driv|designated driver|\bdui\b|\bdwi\b|buzzed driv/],
  ['SafeWalk', 'Safe Walk', /walk(ing)? (alone|safely|safety)|safety escort|safe ?walk|personal safety|pedestrian safety|safe ?ride/],
  ['TicketTackler', 'Ticket Tackler', /parking ticket|traffic ticket|parking citation|traffic citation|traffic court|contest (a|your) ticket/],
  ['ComplaintEscalationWriter', 'Complaint Escalation Writer', /complaint letter|consumer complaint|file a complaint|bbb\.org|better business bureau/],
  ['QuoteCheck', 'Quote Check', /contractor|home repair|home improvement|auto repair|car repair/],
  ['FakeReviewDetective', 'Fake Review Detective', /fake review|online reviews|review fraud/],
  ['UpsellShield', 'Upsell Shield', /car buying|buying a (new |used )?car|extended warrant|service contract|timeshare|high[- ]pressure sales/],
  ['DoctorVisitPrep', 'Doctor Visit Prep', /questions to ask (your )?doctor|doctor visit|talking (to|with) your doctor|prepare for (your )?(doctor|medical) (visit|appointment)/],
  ['DoctorVisitTranslator', 'Doctor Visit Translator', /medical (terms|terminology|dictionary|jargon|words)|lab tests? online|understanding (your )?lab/],
  ['ProcedureProbe', 'Procedure Probe', /before (your )?surgery|surgery (prep|guide)|colonoscopy|anesthesia/],
  ['GhostWriter', 'Ghost Writer', /recommendation letter|letter of recommendation|reference letter/],
  ['PlantRescue', 'Plant Rescue', /plant (disease|problem|clinic)|houseplant|plant pest|master gardener|plant diagnos/],
  ['BikeMedic', 'Bike Medic', /bike (repair|maintenance|mechanic)|bicycle (repair|maintenance)|fix (a |your )?flat/],
  ['PetBehaviorDecoder', 'Pet Behavior Decoder', /pet behavior|dog behavior|cat behavior|animal behavior|pet (problems|training)/],
  ['LaundroMat', 'LaundroMat', /laundry|stain removal|remove stains|care label|washing clothes/],
  ['CultureBriefing', 'Culture Briefing', /culture shock|cultural (etiquette|norms|differences)|country (guides|profiles)|customs and etiquette/],
  ['TripRecon', 'Trip Recon', /travel (safety|tips|advisor|warning|health)|traveler'?s? (checklist|health)|study abroad (safety|health)/],
  ['PaperworkPath', 'Paperwork Path', /marriage license|name change|vital records|birth certificate|death certificate|probate/],
  ['MoneyDiplomat', 'Money Diplomat', /tipping (guide|etiquette)|how much to tip|gratuity guide/],
  ['LeverageLogic', 'Leverage Logic', /salary negotiat|negotiat(e|ing) (your )?(salary|offer|pay)/],
  ['SkillGapMap', 'Skill Gap Map', /skills (assessment|inventory|gap)|transferable skills|career (explor|assessment)/],
  ['PronounceItRight', 'Pronounce It Right', /pronunciation|how to pronounce|pronounce names/],
  ['LazyWorkoutAdapter', 'Lazy Workout Adapter', /physical activity guidelines|exercise (tips|guidelines|at home)|get moving/],
  ['RecipeChaosSolver', 'Recipe Chaos Solver', /ingredient substitut|baking substitut|recipe (fix|rescue)|cooking tips/],
];
const NAV = /press release|news release|^news$|log ?in|sign ?in|sign ?up|enroll|apply|download|app store|google play|privacy|terms|cookie|accessib|careers|locations?|contact|home|menu|search|more|read more|click here|learn more|facebook|twitter|instagram|linkedin|youtube|map|directions|calendar|subscribe|donate|equal housing|fdic|ncua|member fdic|^here$|^\W*$/i;
const JUNK_PATH = /donat|login|log-in|signin|sign-in|register|checkout|cart|store|dashboard|portal|calculat|presenter|account|welcome|student\/|member|apply|enroll|\/form|survey|ticket(s)?\/|event(s)?\/|job(s)?\/|career(s)?\/|\.(jpe?g|png|gif|mp3|mp4)$/i;
const INFO = /ftc|trade commission|consumer|guide|tips|how to|protect|avoid|rights|warning|alert|report|what (is|to)|identity|credit|debt|privacy rights|resource/i;
const PAGE_KEY = /scam|fraud|security|identity|phish|elder|senior|consumer|debt|credit|financ|scholarship|resource|links|counsel|mental|wellness|health|sleep|safety|career|interview|housing|tenant|renter|lease|grief|bereave|estate|funeral|parking|ticket|complaint|garden|plant|bike|bicycle|pet|travel|abroad|nutrition|exercise|fitness|legal|help|tips|education|learn|protect|alert/i;
const SKIP_DEAD_HOST = /facebook|twitter|x\.com|linkedin|instagram|youtube|pinterest|google|apple\.com|microsoft|tiktok|doubleclick|addthis|sharethis|bit\.ly/;

const reg = (h) => { h = (h || '').toLowerCase().replace(/^www\d?\./, ''); const p = h.split('.'); return (/^(gov|us|edu)$/.test(p.at(-1)) && p.length > 2 && p.at(-1) !== 'edu') ? p.slice(-3).join('.') : p.slice(-2).join('.'); };
// Already-contacted organisations (tracker, send log, earlier prospect files).
const KNOWN = new Set(fs.readFileSync(new URL('./known_hosts.txt', import.meta.url), 'utf8').split('\n').filter(Boolean).map(h => reg(h)));
const hostOf = (u) => { try { const h = new URL(u).hostname; return h.includes('.') ? h : ''; } catch { return ''; } };

async function get(url, { method = 'GET', timeout = 15000, text = true } = {}) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(url, { method, headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*' }, redirect: 'follow', signal: ctl.signal });
    const body = text && method === 'GET' ? (await r.text()).slice(0, 3_000_000) : '';
    return { status: r.status, url: r.url, body };
  } catch (e) {
    return { status: 0, err: (e.cause && e.cause.code) || e.name };
  } finally { clearTimeout(t); }
}

const decode = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&rsquo;|&lsquo;/gi, "'").replace(/&#8217;/g, "'").replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
function anchors(html, base) {
  const out = [];
  for (const m of html.matchAll(/<a\b[^>]*?href\s*=\s*["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let u; try { u = new URL(m[1].trim(), base).href; } catch { continue; }
    if (!/^https?:/.test(u)) continue;
    out.push({ url: u, text: decode(m[2]).slice(0, 160) });
  }
  return out;
}

// Link liveness, shared across orgs. Dead = 404/410 twice, or the host no longer resolves.
const linkCache = new Map();
function checkLink(url) {
  if (!linkCache.has(url)) linkCache.set(url, (async () => {
    let r = await get(url, { method: 'HEAD', timeout: 12000 });
    if (r.status === 0 && /ENOTFOUND/.test(r.err || '')) { const r2 = await get(url, { timeout: 12000, text: false }); return r2.status === 0 && /ENOTFOUND/.test(r2.err || '') ? 'dead' : 'ok'; }
    if (r.status === 404 || r.status === 410 || r.status === 405 || r.status === 403 || r.status === 0) {
      const r2 = await get(url, { timeout: 15000 });
      if (r2.status === 404 || r2.status === 410) return 'dead';
      return r2.status >= 200 && r2.status < 400 ? 'ok' : 'unsure';
    }
    return r.status >= 200 && r.status < 400 ? 'ok' : 'unsure';
  })());
  return linkCache.get(url);
}

const EMAIL_BAD = /admission|alumni|apply@|registrar|bursar|athletic|giving|foundation@|donat|advancement|orientation|earlyaccess|dualenroll|transcript|police|helpdesk|servicedesk|itsupport|noreply|no-reply|donotreply|do-not-reply|privacy|abuse|^jobs|careers|^hr@|recruit|payroll|foia|unsubscribe|example|sentry|wixpress|test@|user@|name@|email@|yourname|\.png|\.jpg|@2x|webinar|^security@|fraud@|dispute|claims@/i;
const EMAIL_ROLE = /^(counsel|wellness|health|webmaster|web@|marketing|communications|comms|info|contact|hello|help@|customer|service|library|news|media|press|outreach|general|ask|engage|digital)/i;
const PERSON = /^[a-z]+([._-]?[a-z]+)?@/;
function emailsIn(html) {
  const s = new Set();
  const t = html.replace(/&#0*64;|&#x0*40;|%40/gi, '@').replace(/\s*[\[(]\s*at\s*[\])]\s*/gi, '@').replace(/\s*[\[(]\s*dot\s*[\])]\s*/gi, '.');
  for (const m of t.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) s.add(m[0].replace(/^\.+|\.+$/g, '').toLowerCase());
  for (const m of html.matchAll(/data-cfemail="([0-9a-f]+)"/gi)) { const h = m[1], k = parseInt(h.slice(0, 2), 16); let e = ''; for (let i = 2; i < h.length; i += 2) e += String.fromCharCode(parseInt(h.slice(i, i + 2), 16) ^ k); s.add(e.toLowerCase()); }
  return [...s].filter(e => !EMAIL_BAD.test(e) && e.length < 70);
}
function pickEmail(list, orgReg, freeMailOk = false) {
  const ok = list.filter(e => { const d = reg(e.split('@')[1]); return d === orgReg || (freeMailOk && /^(gmail|yahoo|outlook|hotmail|aol|icloud)\.com$/.test(e.split('@')[1])); });
  return ok.find(e => EMAIL_ROLE.test(e)) || null;
}

async function discoverPages(root, orgReg) {
  const urls = new Set();
  const robots = await get(new URL('/robots.txt', root).href, { timeout: 10000 });
  const maps = robots.status === 200 ? [...robots.body.matchAll(/sitemap:\s*(\S+)/gi)].map(m => m[1]) : [];
  if (!maps.length) maps.push(new URL('/sitemap.xml', root).href, new URL('/sitemap_index.xml', root).href);
  let fetched = 0;
  for (const sm of maps.slice(0, 3)) {
    const x = await get(sm, { timeout: 15000 }); if (x.status !== 200) continue;
    const locs = [...x.body.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\s\]]+)/gi)].map(m => m[1]);
    for (const l of locs) {
      if (/\.xml(\.gz)?$/i.test(l)) { if (fetched < 6 && !/\.gz$/.test(l) && !/product|image|video|event|news-sitemap|author|tag|categor/i.test(l)) { fetched++; const y = await get(l, { timeout: 15000 }); if (y.status === 200) for (const m of y.body.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\s\]]+)/gi)) urls.add(m[1]); } }
      else urls.add(l);
    }
  }
  const home = await get(root, { timeout: 15000 });
  if (home.status === 200) for (const a of anchors(home.body, home.url)) if (reg(hostOf(a.url)) === orgReg) urls.add(a.url.split('#')[0]);
  const scored = [...urls].filter(u => { try { const p = new URL(u); return reg(p.hostname) === orgReg && !/\.(pdf|jpg|png|docx?|xlsx?)$/i.test(p.pathname); } catch { return false; } })
    .map(u => { const p = decodeURIComponent(new URL(u).pathname).toLowerCase(); let s = 0; for (const [, , re] of TOOLS) if (re.test(p.replace(/[-_/]/g, ' '))) s += 3; if (PAGE_KEY.test(p)) s += 1; if (/resource|helpful|useful|links|community|referral/.test(p)) s += 4; return [u, s]; })
    .filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]);
  return scored.slice(FROM, FROM + NPAGES).map(([u]) => u);
}

async function doOrg(org) {
  const res = { org: org.name, type: org.type, site: org.url };
  let root = org.url.trim(); if (!/^https?:/i.test(root)) root = 'https://' + root;
  let orgReg; try { orgReg = reg(new URL(root).hostname); } catch { return { ...res, status: 'badurl' }; }
  res.reg = orgReg;
  if (KNOWN.has(orgReg)) return { ...res, status: 'known' };
  const pages = await discoverPages(root, orgReg);
  if (!pages.length) return { ...res, status: 'nopages' };
  const hits = [];
  const htmlByPage = {};
  const tally = { checked: 0, unsure: 0 };
  for (const page of pages) {
    const r = await get(page); if (r.status !== 200 || !/<a\b/i.test(r.body)) continue;
    htmlByPage[page] = r;
    const title = decode((r.body.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [, ''])[1]).split(/ [|–—-] | :: /)[0].trim().slice(0, 100);
    const seen = new Set();
    const pageHay = (decodeURIComponent(new URL(r.url).pathname).replace(/[-_/]/g, ' ') + ' ' + title).toLowerCase();
    const pageTool = TOOLS.slice(0, 1).find(([, , re]) => re.test(pageHay));  // scams, bills, end of life, grief, deposits, leases
    let pageChecks = 0;
    for (const a of anchors(r.body, r.url)) {
      const h = hostOf(a.url); if (!h || reg(h) === orgReg || SKIP_DEAD_HOST.test(h) || seen.has(a.url) || !a.text || a.text.length < 3) continue;
      seen.add(a.url);
      const hay = (decodeURIComponent(a.url).replace(/[-_/+]/g, ' ') + ' ' + a.text).toLowerCase();
      let tool = TOOLS.find(([, , re]) => re.test(hay)); let inherited = false;
      // On a topic page, a resource-looking link inherits the page's topic.
      if (!tool && pageTool && !NAV.test(a.text) && (INFO.test(a.text) || /\.gov$/.test(h)) && pageChecks < 40) { tool = pageTool; pageChecks++; inherited = true; }
      if (!tool) continue;
      let du; try { du = new URL(a.url); } catch { continue; }
      if (du.pathname.length <= 1 && !/\.gov$/.test(du.hostname)) continue;
      if (JUNK_PATH.test(du.pathname + du.search)) continue;
      if (tool[0] === 'MentalHealthNavigator' && /\/(services?|locations?|providers?|doctors?|clinics?|find-a)\b/i.test(du.pathname)) continue;
      const v = await checkLink(a.url); tally.checked++; if (v === 'unsure') tally.unsure++;
      if (v === 'dead') hits.push({ how: inherited ? 'page' : 'link', page: r.url, title, dead: a.url, anchor: a.text, tool: tool[0], toolName: tool[1], rank: TOOLS.indexOf(tool) });
    }
    if (hits.length >= (MULTI ? 15 : 3)) break;
  }
  if (!hits.length) return { ...res, status: 'nohit', pages: pages.length, ...tally };
  hits.sort((a, b) => a.rank - b.rank);
  // email: the prospect page, then its contact/about links, then /contact
  const found = [], used = new Set();
  for (const hit of hits) {
    const html = htmlByPage[hit.page] ? htmlByPage[hit.page].body : (await get(hit.page)).body || '';
    const onPage = emailsIn(html);
    let email = pickEmail(onPage, orgReg);
    if (!email) {
      const cands = anchors(html, hit.page).filter(a => reg(hostOf(a.url)) === orgReg && /contact|about|staff|connect|reach/i.test(a.url + ' ' + a.text)).map(a => a.url).slice(0, 4);
      cands.push(new URL('/contact', root).href, new URL('/contact-us', root).href, new URL('/about', root).href);
      for (const c of [...new Set(cands)]) { const r = await get(c, { timeout: 12000 }); if (r.status === 200) { email = pickEmail(emailsIn(r.body), orgReg, /contact/i.test(c)); if (email) break; } }
    }
    if (!email) email = onPage.find(e => reg(e.split('@')[1]) === orgReg && PERSON.test(e) && !EMAIL_ROLE.test(e)) || null;
    if (email && !MULTI) return { ...res, status: 'prospect', ...hit, email, otherHits: hits.length - 1 };
    if (email && !used.has(email.toLowerCase())) { used.add(email.toLowerCase()); found.push({ ...res, status: 'prospect', ...hit, email }); }
  }
  if (found.length) return found;
  return { ...res, status: 'noemail', ...hits[0] };
}

const orgs = fs.readFileSync(orgFile, 'utf8').split('\n').filter(Boolean).map(l => { const [name, url, type] = l.split('\t'); return { name, url, type }; });
const done = new Set(fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l).site) : []);
const queue = orgs.filter(o => o.url && !done.has(o.url)).slice(0, LIMIT);
let i = 0, n = 0, prospects = 0;
async function worker() {
  while (i < queue.length) {
    const o = queue[i++];
    let r; try { r = await Promise.race([doOrg(o), new Promise(res => setTimeout(() => res({ org: o.name, type: o.type, site: o.url, status: "timeout" }), MULTI ? 600000 : 240000))]); }
    catch (e) { r = { org: o.name, type: o.type, site: o.url, status: 'error', err: String(e).slice(0, 120) }; }
    const lines = Array.isArray(r) ? r : [r];
    fs.appendFileSync(outFile, lines.map(x => JSON.stringify(x) + '\n').join(''));
    n++; prospects += lines.filter(x => x.status === 'prospect').length;
    if (n % 25 === 0) process.stderr.write(`${n}/${queue.length} orgs, ${prospects} prospects\n`);
  }
}
await Promise.all(Array.from({ length: WORKERS }, worker));
process.stderr.write(`done: ${n} orgs, ${prospects} prospects\n`);
process.exit(0);
