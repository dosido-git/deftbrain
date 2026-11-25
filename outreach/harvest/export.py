"""Export harvested prospects in the owner's FileMaker format.

Usage: python3 export.py <out.csv> <results.jsonl>... [--extra legacy.csv]
Columns: see COLS. UTF-8 (owner 2026-11-25: FileMaker imports it as UTF-8;
Mac Roman showed as �), curly punctuation folded to ASCII, CRLF, no trailing
newline, no quotes around which_link, which_link cut to 60 characters + "...",
offer_desc = tool name, ps_segment = which /organizations#section the P.S. links.
One row per organisation; rows without a published email are left out, and so
is any email already in another outreach/new-prospects-*.csv (each run writes
only new prospects to its own file).
"""
import csv, io, json, sys
from urllib.parse import urlparse

import re
# Same dead-URL filters as harvest.mjs, applied to rows recorded before they existed.
JUNK = re.compile(r'donat|login|log-in|signin|sign-in|register|checkout|cart|store|dashboard|portal|calculat|presenter|account|welcome|student/|member|apply|enroll|/form|survey|tickets?/|events?/|jobs?/|careers?/|\.(jpe?g|png|gif|mp3|mp4)$', re.I)
MH_LOCAL = re.compile(r'/(services?|locations?|providers?|doctors?|clinics?|find-a)\b', re.I)
# Patterns from spot-checks (2026-11-21): redirectors, link rewriters, calendars,
# demo forms, placeholder emails, and topic words used in another sense.
BAD_DEAD = re.compile(r'calendar|secureforms|mimecast|urldefense|safelinks|exit\.jsp|redirect|onthealert|/terms|finresourcecenter|placess4students|demo|digg\.|reddit\.|/submit|/share|smore\.com|talkcampus', re.I)
BAD_EMAIL = re.compile(r'^(john\.?smith|jane\.?doe|john\.?doe|first\.?last|your|name|email|someone|user|test)', re.I)
WRONG_SENSE = {
    'LeaseTrapDetector': re.compile(r'ground lease|news|buy or lease|lease vs|auto|car|vehicle|equipment|oil|gas|mineral', re.I),
    'BillRescue': re.compile(r'sheriff|foreclosure (sale|auction|list)|auction|debt consolidation loan|apply', re.I),
    'NerveCheck': re.compile(r'elder|relative|oral history|genealog', re.I),
    'QuoteCheck': re.compile(r'cleaning|fire|subcontractor|association|register|bid|procure|rfp|licens', re.I),
    'FinalWish': re.compile(r'veteran', re.I),
    'PlantRescue': re.compile(r'volunteer|become', re.I),
    'DoctorVisitTranslator': re.compile(r'exam|cma|practice|certif', re.I),
    'MentalHealthNavigator': re.compile(r'abortion|pregnan|newsletter|edition', re.I),
}
def good(x):
    hay = x['dead'] + ' ' + x['anchor'] + ' ' + x.get('title', '')
    if BAD_DEAD.search(x['dead']) or BAD_EMAIL.search(x['email']): return False
    if not re.fullmatch(r"[a-z0-9._%+'-]+@(?!www\.)([a-z0-9-]+\.)+[a-z]{2,}", x['email'], re.I): return False
    ws = WRONG_SENSE.get(x['tool'])
    return not (ws and ws.search(hay))
# Tracking columns added 2026-11-22 (owner): follow-up, reply, link placed and its last live check.
COLS = 'bounced,date_sent,dead_url,From,followup_date,link_checked,link_placed,offer_desc,outcome,page_name,prospect_url,replacement_deftbrain,replied,reply_date,sent,Subject,To,which_link,ps_segment'.split(',')

SLD = re.compile(r'^(ac|co|com|org|net|gov|govt|edu|nhs|ltd|plc|sch|police|mod|gc|nsw|vic|qld|tas|act|health|school|iwi|maori|parliament|asn|id|csiro|mil|on|bc|ab|qc|ns|nb|mb|sk|web|nic)$')
def reg(h):
    h = (h or '').lower()
    for p in ('www.', 'www2.', 'www1.'):
        if h.startswith(p): h = h[len(p):]
    p = h.split('.')
    if len(p) > 2 and (p[-1] in ('gov', 'us') or (len(p[-1]) == 2 and SLD.match(p[-2]))): return '.'.join(p[-3:])
    return '.'.join(p[-2:])

FOLD = str.maketrans({'\u2026': '...', '\u2019': "'", '\u2018': "'", '\u201c': '"', '\u201d': '"',
                      '\u2013': '-', '\u2014': '-', '\u2022': '-', '\u203a': '>', '\u2039': '<', '\u00a0': ' '})
def fold(s):
    """Curly punctuation to ASCII; accented letters stay (the file is UTF-8)."""
    return s.translate(FOLD)

def read_csv_text(path):
    """FileMaker exports (all-sent.csv) may still be Mac Roman; newer files are UTF-8."""
    b = open(path, 'rb').read()
    try: return b.decode('utf-8')
    except UnicodeDecodeError: return b.decode('mac_roman')

FIN = re.compile(r'(cu\d*|fcu|creditunion|bank|banking|savings|financial|federal|trust|fed)')
def segment(email):
    """Which /organizations section the P.S. links to, guessed from the address; 'none' = no P.S."""
    e = email.strip().lower()
    local, d = e.split('@', 1); host, tld = d.rsplit('.', 1)
    if local in ('webmaster', 'press', 'media', 'mediarelations', 'news', 'newsroom', 'pressoffice') or local.endswith('-press'): return 'none'
    if tld in ('gov', 'mil') or re.search(r'(^|\.)(co|ci|city|state|town|twp)\.[a-z]{2}\.us$', d): return 'none'
    if d in ('gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'): return 'none'
    if 'librar' in d or re.search(r'(^|\.)lib\.', d) or re.search(r'[a-z]pld?\.org$', d) or local.startswith('librar'): return 'libraries'
    if tld == 'bank' or FIN.search(host) or re.search(r'cu[a-z]*$|^cu|cu\d', host.split('.')[-1]) or local in ('memberservice', 'memberservices'): return 'credit-unions'
    if tld in ('edu', 'university') or '.k12.' in d or (tld != 'com' and re.search(r'college|university|school|academy', d)): return 'education'
    return 'community' if tld in ('org', 'us') else 'none'

assert segment('info@springfieldpubliclibrary.org') == 'libraries' and segment('eref@wnpld.org') == 'libraries'
assert segment('memberservices@acmefcu.org') == 'credit-unions'
assert segment('counseling@state.edu') == 'education'
assert segment('webmaster@foo.org') == 'none'
assert segment('info@city.gov') == 'none'
assert segment('info@helpers.org') == 'community'

def cut(s, n=60):
    s = s.strip().strip('"')
    return s if len(s) <= n else s[:n].rstrip() + '...'
assert cut('x' * 61) == 'x' * 60 + '...' and cut('short') == 'short'

def subject(name):
    """Owner 2026-11-22: one subject per row, naming the page so it reads as a specific fix."""
    name = ' '.join(name.replace('"', '').split())
    if len(name) > 45: name = name[:45].rsplit(' ', 1)[0].rstrip(' ,:;-') + '...'
    return f'A broken link on your "{name}" page'

assert subject('Fraud Protection') == 'A broken link on your "Fraud Protection" page'
assert len(subject('x ' * 60)) < 80

def row(page, title, dead, anchor, tool_id, tool_name, email):
    name = title or urlparse(page).path.strip('/').split('/')[-1].replace('-', ' ').title() or 'Home'
    return {'bounced': '', 'date_sent': '', 'dead_url': dead, 'From': 'Outreach@DeftBrain.com',
            'offer_desc': tool_name, 'outcome': '', 'page_name': name, 'prospect_url': page,
            'replacement_deftbrain': 'https://deftbrain.com/' + tool_id, 'sent': '', 'Subject': subject(name), 'To': email,
            'which_link': cut(fold(anchor)), 'ps_segment': segment(email)}

args = sys.argv[1:]
out_path = args[0]
extra = args[args.index('--extra') + 1] if '--extra' in args else None
inputs = [a for a in args[1:] if a != '--extra' and a != extra]

rows, seen = [], set()
# One row per email (owner 2026-11-22: same-domain rows are fine, repeated emails are not); skip every email already sent.
import os as _os
_sent = '/Users/SRsr/Desktop/deftbrain/outreach/all-sent.csv'
if _os.path.exists(_sent):
    for _r in csv.DictReader(io.StringIO(read_csv_text(_sent), newline='')):
        seen.add(_r['To'].strip().lower())
# Emails already queued in an earlier export file are not new prospects.
import glob as _glob
for _f in _glob.glob('/Users/SRsr/Desktop/deftbrain/outreach/new-prospects-*.csv'):
    if _os.path.abspath(_f) == _os.path.abspath(out_path): continue
    for _r in csv.DictReader(io.StringIO(read_csv_text(_f), newline='')):
        seen.add(_r.get('To', '').strip().lower())
if extra:  # earlier hand-found rows, old 8-column layout
    for x in csv.DictReader(open(extra, newline='', encoding='utf-8')):
        if x['to'].startswith('(no email'): continue
        name = 'Scam Radar' if x['replacement_deftbrain'].endswith('ScamRadar') else 'Bill Rescue'
        r = row(x['prospect_url'], x['page_name'], x['dead_url'], x['which_link'], x['replacement_deftbrain'].rsplit('/', 1)[1], name, x['to'])
        if r['To'].lower() in seen: continue
        seen.add(r['To'].lower()); rows.append(r)
for f in inputs:
    for line in open(f):
        x = json.loads(line)
        if x.get('status') != 'prospect': continue
        du = urlparse(x['dead'])
        if JUNK.search(du.path + ('?' + du.query if du.query else '')): continue
        if x['tool'] == 'MentalHealthNavigator' and MH_LOCAL.search(du.path): continue
        if not good(x): continue
        k = x['email'].strip().lower()
        if k in seen: continue
        seen.add(k)
        rows.append(row(x['page'], x.get('title', ''), x['dead'], x['anchor'], x['tool'], x['toolName'], x['email']))

# Haiku fit check (judge.mjs): rows it judged DROP are left out.
import os
_v = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'verdicts.json')
if os.path.exists(_v):
    verdicts = json.load(open(_v))
    rows = [r for r in rows if verdicts.get(r['prospect_url'] + '|' + r['dead_url'], {'keep': True})['keep']]

# Mail-server check (mxcheck.mjs): drop emails whose domain accepts no mail.
_mx = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mx.json')
if os.path.exists(_mx):
    mx = json.load(open(_mx))
    rows = [r for r in rows if mx.get(r['To'].split('@')[1].lower(), True)]

# Same-domain rules (owner 2026-11-22): at most 3 rows per organisation; a 2nd/3rd row
# only for a different subdomain or a different department address; no generic address
# once the org has a specific one; none for orgs already emailed; extras go to the end
# of the file so they are sent days after the first.
GENERIC = re.compile(r'^(info|contact|contactus|webmaster|web|hello|general|office|admin|inquir|questions|help)\b', re.I)
sent_orgs = set()
if _os.path.exists(_sent):
    for _r in csv.DictReader(io.StringIO(read_csv_text(_sent), newline='')):
        if '@' in _r['To']: sent_orgs.add(reg(_r['To'].split('@')[1]))
        if _r['prospect_url'].startswith('http'): sent_orgs.add(reg(urlparse(_r['prospect_url']).hostname))
by_org = {}
for r in rows:
    by_org.setdefault(reg(urlparse(r['prospect_url']).hostname), []).append(r)
first, extra_rows = [], []
for org, rs in by_org.items():
    if org in sent_orgs: continue
    rs.sort(key=lambda r: bool(GENERIC.match(r['To'])))  # specific addresses first
    kept = []
    for r in rs:
        if len(kept) == 3: break
        host, local = urlparse(r['prospect_url']).hostname, r['To'].split('@')[0].lower()
        if kept:
            if GENERIC.match(local): continue
            if any(urlparse(k['prospect_url']).hostname == host and k['To'].split('@')[0].lower() == local for k in kept): continue
        kept.append(r)
    first.append(kept[0]); extra_rows += kept[1:]
rows = first + extra_rows
buf = io.StringIO()
w = csv.DictWriter(buf, fieldnames=COLS, lineterminator='\r\n', restval='')
w.writeheader(); w.writerows(rows)
text = buf.getvalue().rstrip('\r\n')
assert all(r['To'] and '@' in r['To'] for r in rows)
data = fold(text).encode('utf-8')  # built fully before the file is opened
open(out_path, 'wb').write(data)
print(len(rows), 'rows')
