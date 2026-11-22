"""No-email rows + deep-noemail.json -> extra-deepmail.jsonl (role address on the org's own domain only)."""
import json,re,glob
from urllib.parse import urlparse
SLD = re.compile(r'^(ac|co|com|org|net|gov|govt|edu|nhs|ltd|plc|sch|police|mod|gc|nsw|vic|qld|tas|act|health|school|iwi|maori|parliament|asn|id|csiro|mil|on|bc|ab|qc|ns|nb|mb|sk|web|nic)$')
def reg(h):
    h = (h or '').lower()
    for p in ('www.', 'www2.', 'www1.'):
        if h.startswith(p): h = h[len(p):]
    p = h.split('.')
    if len(p) > 2 and (p[-1] in ('gov', 'us') or (len(p[-1]) == 2 and SLD.match(p[-2]))): return '.'.join(p[-3:])
    return '.'.join(p[-2:])
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
        if e: x.update(status='prospect',email=e,emailFrom='deep'); out.append((f,x))
# International recoveries go to their own file so refresh.sh keeps them out of the US export.
us=[x for f,x in out if not f.startswith('extra-intl')]; intl=[x for f,x in out if f.startswith('extra-intl')]
open('extra-deepmail.jsonl','w').write(''.join(json.dumps(x)+'\n' for x in us))
open('extra-intl-deepmail.jsonl','w').write(''.join(json.dumps(x)+'\n' for x in intl))
print(len(us),'recovered (US),',len(intl),'(international)')
