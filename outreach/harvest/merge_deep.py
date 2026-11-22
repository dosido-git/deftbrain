"""No-email rows + deep-noemail.json -> extra-deepmail.jsonl (role address on the org's own domain only)."""
import json,re,glob
from urllib.parse import urlparse
def reg(h):
    h=(h or '').lower()
    for p in ('www.','www2.','www1.'):
        if h.startswith(p): h=h[len(p):]
    p=h.split('.')
    return '.'.join(p[-3:]) if p[-1] in('gov','us') and len(p)>2 else '.'.join(p[-2:])
BAD=re.compile(r'admission|alumni|apply@|registrar|bursar|athletic|giving|foundation@|donat|advancement|orientation|earlyaccess|dualenroll|transcript|police|helpdesk|servicedesk|itsupport|noreply|no-reply|donotreply|privacy|abuse|^jobs|careers|^hr@|recruit|payroll|foia|unsubscribe|example|sentry|wixpress|test@|user@|name@|email@|yourname|webinar|^security@|fraud@|dispute|claims@|^dns|hostmaster|^tuser|^john|^jane',re.I)
ROLE=re.compile(r'^(counsel|wellness|health|webmaster|web@|marketing|communications|comms|info|contact|hello|help@|customer|service|library|news|media|press|outreach|general|ask|engage|digital|member)',re.I)
VALID=re.compile(r"[a-z0-9._%+'-]+@([a-z0-9-]+\.)+[a-z]{2,}")
deep={d['page']:d for d in json.load(open('deep-noemail.json'))}
out=[]
srcs=['results.jsonl','districts.jsonl','gov.jsonl','gov2.jsonl']+[f for f in glob.glob('extra-*.jsonl') if 'deepmail' not in f]
for f in srcs:
    for l in open(f):
        x=json.loads(l)
        if x['status']!='noemail' or x['page'] not in deep: continue
        org=reg(urlparse(x['page']).hostname)
        e=next((c for c in deep[x['page']]['found'] if VALID.fullmatch(c) and reg(c.split('@')[1])==org and not BAD.search(c) and ROLE.search(c)),None)
        if e: x.update(status='prospect',email=e,emailFrom='deep'); out.append(x)
open('extra-deepmail.jsonl','w').write(''.join(json.dumps(x)+'\n' for x in out))
print(len(out),'recovered')
