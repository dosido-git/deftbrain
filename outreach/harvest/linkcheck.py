"""Check every sent prospect page for a link to DeftBrain; fill link_placed + link_checked.

Usage: python3 linkcheck.py [../all-sent.csv]

link_placed: follow | nofollow (rel has nofollow, ugc or sponsored) | removed (was
placed, now gone) | blank (not there yet). link_checked: date of the last page
that loaded. A page that fails to load leaves both columns as they were.
"""
import csv, datetime, io, re, sys, unicodedata, urllib.request
from concurrent.futures import ThreadPoolExecutor

PATH = sys.argv[1] if len(sys.argv) > 1 else '/Users/SRsr/Desktop/deftbrain/outreach/all-sent.csv'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
A_TAG = re.compile(r'<a\b[^>]*>', re.I | re.S)
HREF = re.compile(r'''href\s*=\s*["']?[^"'\s>]*deftbrain\.com''', re.I)
REL = re.compile(r'''rel\s*=\s*["']?([^"'>]*)''', re.I)
NOFOLLOW = {'nofollow', 'ugc', 'sponsored'}


def placed(html):
    """'follow' if any DeftBrain link is followed, 'nofollow' if all are tagged, '' if none."""
    kinds = []
    for tag in A_TAG.findall(html):
        if HREF.search(tag):
            m = REL.search(tag)
            kinds.append('nofollow' if m and NOFOLLOW & set(m.group(1).lower().split()) else 'follow')
    return 'follow' if 'follow' in kinds else ('nofollow' if kinds else '')


assert placed('<a href="https://deftbrain.com/BillRescue">x</a>') == 'follow'
assert placed("<a rel='nofollow noopener' href='https://www.deftbrain.com/'>x</a>") == 'nofollow'
assert placed('<a href="https://example.com/">x</a>') == ''


def fetch(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'text/html,*/*'})
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.read(3_000_000).decode('utf-8', 'replace')
    except Exception:
        return None


def mac(s):
    out = []
    for ch in s:
        try: ch.encode('mac_roman'); out.append(ch)
        except UnicodeEncodeError: out.append(unicodedata.normalize('NFKD', ch).encode('ascii', 'ignore').decode() or ' ')
    return ''.join(out)


rows = list(csv.DictReader(io.StringIO(open(PATH, 'rb').read().decode('mac_roman'), newline='')))
cols = list(rows[0].keys())
todo = [r for r in rows if r['sent'].strip() == '1' and r['bounced'].strip() != '1' and r['prospect_url'].startswith('http')]
pages = sorted({r['prospect_url'] for r in todo})
with ThreadPoolExecutor(12) as ex:
    html = dict(zip(pages, ex.map(fetch, pages)))

today = datetime.date.today()
stamp = f'{today.month}/{today.day}/{today:%y}'
tally = {'follow': 0, 'nofollow': 0, 'removed': 0, 'not yet': 0, 'did not load': 0}
for r in todo:
    h = html[r['prospect_url']]
    if h is None:
        tally['did not load'] += 1; continue
    p = placed(h)
    if not p and r['link_placed'] in ('follow', 'nofollow', 'removed'): p = 'removed'
    r['link_placed'], r['link_checked'] = p, stamp
    tally[p or 'not yet'] += 1

buf = io.StringIO()
w = csv.DictWriter(buf, fieldnames=cols, lineterminator='\r\n')
w.writeheader(); w.writerows(rows)
data = mac(buf.getvalue().rstrip('\r\n')).encode('mac_roman')  # built fully before the file is opened
open(PATH, 'wb').write(data)
print(len(pages), 'pages checked:', ', '.join(f'{k} {v}' for k, v in tally.items()))
