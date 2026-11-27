import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import NotFound from './NotFound';
import { CopyBtn, PrintBtn } from './ActionButtons';
import { useTheme } from '../hooks/useTheme';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { useNoindex } from '../hooks/useNoindex';
import { TOOL_COUNT_LABEL } from '../data/toolCount';
import CENTER from '../data/partnerCenter.json';
import { resolvePartner } from '../hooks/usePartner';
import './OrganizationsPage.css';
import './PartnerCenter.css';

// Partner Center: /partners and /partners/<page>. Resources for organizations
// that offer DeftBrain to their people — what a partnership includes, the
// packages, a launch kit filled in for the partner, the messaging and brand
// rules, and what the partner page does with data. Pages are listed in
// src/data/partnerCenter.json, which backend/server.js also reads (200 vs 404).
// noindex: the sales page is /organizations; these are working materials.

const CONTACT = 'Org@deftbrain.com';
const SITE = 'deftbrain.com';
const SECTIONS = [
  { id: '', label: 'Overview' },
  { id: 'launch-kit', label: 'Launch kit' },
  { id: 'guidelines', label: 'Guidelines' },
  { id: 'privacy', label: 'Privacy and data' },
  { id: 'sample-consortium', label: 'Sample consortium' },
];
const HEADS = {
  '': { title: 'Partner Center', description: 'What a DeftBrain partnership includes: your own page, ready-to-send launch materials, and usage reports with no individual data.' },
  'launch-kit': { title: 'Launch kit — Partner Center', description: 'Emails, a website card, a staff script, tracked links and a printable handout, filled in for your organization.' },
  guidelines: { title: 'Guidelines — Partner Center', description: 'How to describe DeftBrain to your people, and the co-branding rules.' },
  privacy: { title: 'Privacy and data — Partner Center', description: 'What a partner page collects, what your organization sees, and which outside services are involved.' },
  'sample-consortium': { title: 'Sample consortium — Partner Center', description: 'Everything a consortium gets, set up for a fictional union: pages, reports, printed materials, letters and forms.' },
};
const pkgById = Object.fromEntries(CENTER.packages.map(p => [p.id, p]));

function ToolLinks({ ids, byId }) {
  return (
    <ul className="pc-tool-list">
      {ids.map(id => byId[id] && <li key={id}><Link to={`/${id}`}>{byId[id].title}</Link></li>)}
    </ul>
  );
}

function Material({ title, note, text }) {
  return (
    <article className="pc-material">
      <div className="pc-material-head">
        <h3>{title}</h3>
        <CopyBtn content={text} label="Copy" exact />
      </div>
      {note && <p className="pc-note">{note}</p>}
      <pre className="pc-copy">{text}</pre>
    </article>
  );
}

// A QR code drawn as one SVG path, with the standard four-module quiet zone.
// The encoder is loaded only when the launch kit opens.
function QrCode({ value, label }) {
  const [path, setPath] = useState(null);
  const svgRef = useRef(null);
  useEffect(() => {
    let alive = true;
    import('qrcode-generator').then(({ default: qrcode }) => {
      const qr = qrcode(0, 'M');
      qr.addData(value);
      qr.make();
      const n = qr.getModuleCount();
      let d = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
      if (alive) setPath({ d, size: n + 8 });
    });
    return () => { alive = false; };
  }, [value]);
  const download = () => {
    const blob = new Blob([svgRef.current.outerHTML], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'deftbrain-qr-code.svg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  if (!path) return <div className="pc-qr pc-qr-loading" aria-hidden="true" />;
  return (
    <div className="pc-qr-wrap">
      <svg ref={svgRef} className="pc-qr" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${path.size} ${path.size}`} role="img" aria-label={label} shapeRendering="crispEdges">
        <rect width={path.size} height={path.size} fill="#fff" />
        <path d={path.d} fill="#000" />
      </svg>
      <button type="button" className="pc-qr-download pc-noprint" onClick={download}>Download QR code (SVG)</button>
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────
function Overview({ byId }) {
  return (
    <>
      <p className="org-lede pc-lede">DeftBrain gives the people you serve a free, private place to think through everyday situations: a roommate dispute, a performance review, a form in dense language, a trip to plan. You choose the package, we build your page, and you launch it with materials ready to send.</p>

      <section className="pc-section" aria-labelledby="pc-includes">
        <h2 id="pc-includes">What a partnership includes</h2>
        <div className="pc-cards">
          <article><span aria-hidden="true">🏠</span><h3>Your own page</h3><p>A co-branded page at {SITE}/for/your-name with the guided experiences you chose, your help line beside them, and the rest of DeftBrain one click away.</p><Link to="/for/example-cu">See a sample page →</Link></article>
          <article><span aria-hidden="true">📣</span><h3>A launch kit</h3><p>Emails, a website card, a staff script, tracked links and a printable handout, written in plain language and filled in for you.</p><Link to="/partners/launch-kit">Open the launch kit →</Link></article>
          <article><span aria-hidden="true">🔒</span><h3>Privacy you can explain</h3><p>No accounts and no sign-in. Your organization never sees what anyone types, and the page sets no advertising or analytics cookies.</p><Link to="/partners/privacy">Privacy and data →</Link></article>
          <article><span aria-hidden="true">📊</span><h3>Reports without individual data</h3><p>Overall usage counts by month and by experience. Any group under 20 sessions is shown only as “fewer than 20.”</p><Link to="/partners/privacy#report">See a sample report →</Link></article>
        </div>
      </section>

      <section className="pc-section" aria-labelledby="pc-how">
        <h2 id="pc-how">How it works</h2>
        <ol className="pc-steps">
          <li><b>Choose a package.</b> Pick the situations your people bring to you most. We confirm the experiences, the help line and the languages with you.</li>
          <li><b>We build your page.</b> Your name, your intro and your help line, on a page we set up and you review before launch.</li>
          <li><b>You launch it.</b> Send the emails, place the website card and hand out the flyer. Every word is yours to approve first.</li>
          <li><b>Review together.</b> Look at the usage report, see what people used, and decide what to keep or change.</li>
        </ol>
      </section>

      <section className="pc-section" aria-labelledby="pc-packages">
        <h2 id="pc-packages">Packages</h2>
        <p className="pc-section-lead">Each package is three to five existing experiences for one kind of situation, with your own help line beside them. The full catalog of {TOOL_COUNT_LABEL} guided experiences stays one click away.</p>
        <div className="pc-packages">
          {CENTER.packages.map(p => (
            <article key={p.id} className="pc-package">
              <h3>{p.title}{p.sensitive && <span className="pc-tag">By request</span>}</h3>
              <p>{p.intro}</p>
              <ToolLinks ids={p.tools} byId={byId} />
              <dl>
                <div><dt>Often chosen by</dt><dd>{p.buyers}</dd></div>
                <div><dt>Help line shown beside it</dt><dd>{p.help}</dd></div>
              </dl>
              {p.sensitive && <p className="pc-note">Offered only after a review of your launch copy, never as a first pilot, and reported for the package as a whole.</p>}
              <Link className="pc-package-link" to={`/partners/packages/${p.id}`}>See what's included →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="pc-section" aria-labelledby="pc-faq">
        <h2 id="pc-faq">Questions partners ask</h2>
        <div className="pc-faq">
          <h3>Does it cost our people anything?</h3><p>No. It's free to them, with no account and no sign-in.</p>
          <h3>What do we see?</h3><p>Overall usage counts only: visits, experiences started and finished, by month. Never what anyone typed or what they were shown.</p>
          <h3>Is this advice?</h3><p>No. It helps people see what matters, what their options are and what to ask next. Each page points to your own help line for decisions.</p>
          <h3>Which languages?</h3><p>Materials are in English. Another language can be added when every experience in your package has been checked in it.</p>
          <h3>What if we stop?</h3><p>Remove your placements within 30 days. Your page address then forwards to DeftBrain's public pages, so printed handouts never lead nowhere.</p>
          <h3>How do people report a problem?</h3><p>Every page links to a short form, and you can always write to <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
        </div>
      </section>

      <section className="pc-cta">
        <h2>Ready to talk about a pilot?</h2>
        <p>Tell us who you serve and what they bring to you most. We'll suggest a package and send a sample page.</p>
        <a className="org-btn org-btn-primary" href={`mailto:${CONTACT}?subject=DeftBrain%20partner%20pilot`}>Email us about a pilot →</a>
      </section>
    </>
  );
}

// ─── Launch kit ──────────────────────────────────────────────
function initialKit(params) {
  const id = params.get('partner');
  // Partners and consortium members (<consortium>/<member>) both prefill the kit.
  const partner = id ? resolvePartner(id) : null;
  const fromPartner = partner && CENTER.packages.find(p => p.title === partner.packageTitle);
  const pkg = pkgById[params.get('package')] || fromPartner || CENTER.packages[0];
  return {
    name: partner?.name || '',
    packageId: pkg.id,
    slug: partner ? id : '',
    // First contact with a phone (older records: the single `help` line).
    helpText: (partner?.contacts || []).find(ct => ct.phone)?.label || partner?.help?.text || '',
    phone: (partner?.contacts || []).find(ct => ct.phone)?.phone || partner?.help?.phone || '',
    sample: partner?.sample === true,
    logo: partner?.logo || '',
    format: 'handout',
  };
}

const slugify = s => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

// One picker, shown in the form and again beside the handout; both edit the same state.
const PackageSelect = ({ value, onChange }) => (
  <select value={value} onChange={onChange}>{CENTER.packages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
);

function LaunchKit({ byId, params }) {
  const [kit, setKit] = useState(() => initialKit(params));
  const set = key => e => setKit(k => ({ ...k, [key]: e.target.value }));
  const pkg = pkgById[kit.packageId] || CENTER.packages[0];
  const name = kit.name.trim() || 'Your organization';
  const slug = kit.slug.trim() || slugify(kit.name) || 'your-organization';
  const page = `${SITE}/for/${slug}`;
  const link = ch => `https://${page}?ref=${slug}-${ch}`;
  const help = [kit.helpText.trim() || `For decisions, talk to ${name}.`, kit.phone.trim()].filter(Boolean).join(' ');
  const tools = pkg.tools.map(id => byId[id]).filter(Boolean);
  const toolLines = tools.map(t => `• ${t.title}: ${t.tagline || t.description}`).join('\n');

  const shortEmail = `${pkg.intro}\n\n${name} now offers free, private guidance from DeftBrain. No account needed, and we never see what you type.\n\nStart here: ${link('email')}\n\n${help}`;
  const longEmail = `Subject: New from ${name}: ${pkg.title}\n\n${pkg.intro}\n\n${name} now offers free, private guidance from DeftBrain. You answer a few questions and see what matters, what your options are and what to ask next. It takes a few minutes, there's no account to create, and ${name} never sees what you type.\n\nWhat's included:\n${toolLines}\n\nStart here: ${link('email')}\n\nIt's a starting point, not a decision. ${help}`;
  const reminder = `A reminder from ${name}: ${pkg.title}.\n\n${pkg.intro} It's free and private, with no account needed.\n\n${link('reminder')}`;
  const card = `Title: ${pkg.title}\nSentence: ${pkg.intro}\nButton: Get started\nLink: ${link('website')}\nImage alt text: ${pkg.title}, free guidance from ${name} and DeftBrain`;
  const script = `"If you're not sure about this, there's a free guide on our website called '${pkg.title}'. It asks a few questions and helps you see your options, and we never see what you type."\n\nThen point them to ${page}.`;
  const social = `${pkg.intro} ${name} now offers free, private guidance from DeftBrain, with no account needed. ${link('social')}`;
  const embed = `<iframe src="${link('embed')}" title="${pkg.title}, from ${name}" loading="lazy" style="width:100%;height:900px;border:0"></iframe>`;
  // One short blurb a month, one tool each, for a newsletter or e-statement message.
  const blurbs = tools.map((t, i) => `Month ${i + 1}: ${t.title}\n${t.tagline || t.description} Free and private from ${name}, with no account needed. ${link('newsletter')}`).join('\n\n');
  // The finished example fills in what a real launch would: an owner for each step and where it goes.
  const timeline = kit.sample
    ? `Week 0, Monday: member communications lead approves all copy and placements, after compliance signs off on the help line sentence\nWeek 0, Thursday: DeftBrain checks the final wording and the tracked links\nLaunch day (Tuesday, week 1): newsletter goes out with the long email; website card goes live on the Help & Security page; handouts at every branch teller line and drive-through\nWeek 1: branch managers brief tellers and the call center with the staff script at the morning huddle\nWeek 2: social post on the credit union's usual channels\nWeek 4: reminder in the e-statement message area\nMonth 3: member communications lead and DeftBrain review the usage report and decide what to keep, move or stop`
    : `Week 0: approve all copy and placements (owner: ____, approved on: ____)\nLaunch day: send the email, publish the website card, put out handouts\nWeek 1: brief front-line staff with the staff script\nWeek 4: send the reminder\nMonth 3: review the usage report together`;
  const channels = [['Email', 'email'], ['Reminder', 'reminder'], ['Monthly newsletter', 'newsletter'], ['Website or portal', 'website'], ['Social posts', 'social'], ['Printed handout', 'print'], ['Poster or flier', 'poster'], ['Inside your website', 'embed'], ['Staff referrals', 'staff']];
  const poster = kit.format === 'poster';

  return (
    <>
      {kit.sample ? (
        <div className="pc-example pc-noprint" role="note">
          <p><b>A finished example.</b> This is the whole kit filled in for {name}, a made-up credit union: every message, link, owner and step a real launch would have. Change any field to see it update.</p>
          <p className="pc-example-links"><Link to={`/for/${slug}`}>See its member page →</Link><Link to="/partners/launch-kit">Start your own kit →</Link></p>
        </div>
      ) : (
        <p className="org-lede pc-lede pc-noprint">Fill in your details and every item below updates. Copy what you need, change the wording to sound like you, and send it to us for a quick check before it goes out. <Link to="/partners/launch-kit?partner=example-cu">See a finished example →</Link></p>
      )}

      <form className="pc-form pc-noprint" onSubmit={e => e.preventDefault()} aria-label="Your details">
        <label>Organization name<input value={kit.name} onChange={set('name')} placeholder="Example Credit Union" autoComplete="organization" /></label>
        <label>Package<PackageSelect value={kit.packageId} onChange={set('packageId')} /></label>
        <label>Page address<span className="pc-prefix"><span>{SITE}/for/</span><input value={kit.slug} onChange={e => setKit(k => ({ ...k, slug: e.target.value.split('/').slice(0, 2).map(slugify).join('/')}))} placeholder={slugify(kit.name) || 'your-organization'} /></span></label>
        <label>Help line sentence<input value={kit.helpText} onChange={set('helpText')} placeholder={`For decisions, talk to ${name}.`} /></label>
        <label>Phone number (optional)<input value={kit.phone} onChange={set('phone')} placeholder="1-800-555-0100" inputMode="tel" /></label>
      </form>

      <section className="pc-section pc-noprint" aria-labelledby="pc-messages">
        <h2 id="pc-messages">Messages</h2>
        <div className="pc-materials">
          <Material title="Email or newsletter, short" text={shortEmail} />
          <Material title="Email or newsletter, long" text={longEmail} />
          <Material title="Reminder, for week 4" text={reminder} />
          <Material title="Website or portal card" note="Use any photo you have rights to; keep the words on the page, not baked into the image." text={card} />
          <Material title="Staff script" note="Two sentences a teller, librarian or front-desk colleague can say out loud." text={script} />
          <Material title="Social post" note="Works on any platform you use." text={social} />
          <Material title="Newsletter blurbs, one a month" note="A short item for each month after launch, one tool at a time." text={blurbs} />
          <Material title="Inside your website or app" note="Paste this where your page should appear. Send us the website address first: browsers show it only on sites we have switched on, and blank everywhere else." text={embed} />
        </div>
      </section>

      <section className="pc-section pc-noprint" aria-labelledby="pc-links">
        <h2 id="pc-links">Tracked links</h2>
        <p className="pc-section-lead">Use a different link in each place, so the usage report can show which placement worked. Nothing in these links identifies a person.</p>
        <table className="pc-table">
          <thead><tr><th scope="col">Where it goes</th><th scope="col">Link</th><th scope="col"><span className="pc-sr">Copy</span></th></tr></thead>
          <tbody>{channels.map(([label, ch]) => <tr key={ch}><td>{label}</td><td><code>{link(ch)}</code></td><td><CopyBtn content={link(ch)} label="Copy" exact quiet /></td></tr>)}</tbody>
        </table>
      </section>

      <section className="pc-section pc-noprint" aria-labelledby="pc-timeline">
        <h2 id="pc-timeline">Launch timeline</h2>
        <Material title="Placement calendar" note="Name one owner and an approval date before anything goes out." text={timeline} />
      </section>

      <section className="pc-section" aria-labelledby="pc-handout-title">
        <div className="pc-material-head pc-noprint">
          <h2 id="pc-handout-title">Printable handout and poster</h2>
          <PrintBtn label={poster ? 'Print poster' : 'Print handout'} />
        </div>
        <p className="pc-section-lead pc-noprint">One page, with the address printed in full beside the QR code. The poster is for a wall, a counter or a flier: few words and a QR code large enough to scan from a few steps away, with its own tracked link. Large print sets every word at 18 points or more. To list every tool instead: <a href="/all-tools.pdf">printable list (PDF)</a> or <a href="/all-tools-large.pdf">large print (PDF)</a>; we make both with your name and QR code on request.</p>
        <div className="pc-handout-picks pc-noprint">
          <label className="pc-handout-pick">Package<PackageSelect value={kit.packageId} onChange={set('packageId')} /></label>
          <label className="pc-handout-pick">Format<select value={kit.format} onChange={set('format')}><option value="handout">Handout</option><option value="large">Handout, large print</option><option value="poster">Poster or flier</option></select></label>
        </div>
        <article className={`pc-handout pc-handout-${kit.format}`} aria-label={poster ? 'Poster preview' : 'Handout preview'}>
          <header><b className="pc-handout-name">{kit.logo && <img src={kit.logo} alt="" width="36" height="36" />}{name}</b><span>by DeftBrain</span></header>
          <h2>{pkg.title}</h2>
          <p className="pc-handout-intro">{pkg.intro}</p>
          {!poster && <>
            <h3>How it works</h3>
            <ol><li>Go to the address below.</li><li>Choose what's going on and answer a few questions.</li><li>See what matters, your options and what to ask next.</li></ol>
            <h3>What's included</h3>
            <ul>{tools.map(t => <li key={t.id}><b>{t.title}</b> — {t.tagline || t.description}</li>)}</ul>
          </>}
          <div className="pc-handout-go">
            <QrCode value={link(poster ? 'poster' : 'print')} label={`QR code that opens ${page}`} />
            <p className="pc-handout-url">{page}</p>
          </div>
          <p>Free and private. No account needed. {name} never sees what you type.</p>
          <p className="pc-handout-help">{help}</p>
          <footer>Guidance to widen your view, not a verdict.</footer>
        </article>
      </section>
    </>
  );
}

// ─── Guidelines ──────────────────────────────────────────────
function Guidelines() {
  return (
    <>
      <p className="org-lede pc-lede">Describe DeftBrain the way it works: as guidance that helps people see their situation, not as a service that decides for them. These rules keep your materials accurate and keep the promise your page makes.</p>
      <section className="pc-section" aria-labelledby="pc-say">
        <h2 id="pc-say">What to say</h2>
        <table className="pc-table">
          <thead><tr><th scope="col">Say</th><th scope="col">Avoid</th></tr></thead>
          <tbody>
            <tr><td>Guidance; helps you understand, prepare, compare and see your options</td><td>AI, chatbot, prompt, model, or “powered by AI” as the headline</td></tr>
            <tr><td>“See what matters and what to ask next”</td><td>“Tells you what to do,” “the right answer,” “your next step”</td></tr>
            <tr><td>“Free and private; {'{'}your organization{'}'} sees only overall usage”</td><td>“Anonymous” or “confidential” without the plain explanation</td></tr>
            <tr><td>“A starting point; for decisions, talk to {'{'}your help line{'}'}”</td><td>Promises of outcomes: money saved, scams stopped, disputes won</td></tr>
            <tr><td>“{TOOL_COUNT_LABEL} guided experiences” or “over 500 guides”</td><td>Exact counts</td></tr>
          </tbody>
        </table>
      </section>
      <section className="pc-section" aria-labelledby="pc-brand">
        <h2 id="pc-brand">Co-branding</h2>
        <ul className="pc-rules">
          <li>Your name and logo come first, “by DeftBrain” second. DeftBrain's name is always visible.</li>
          <li>Send us your approved logo files. We use them only on the placements we agree, for the length of the agreement.</li>
          <li>Using your name, logo or results in a public case study needs your separate written approval.</li>
          <li>Every message is approved by you before it goes out. Send drafts to <a href={`mailto:${CONTACT}`}>{CONTACT}</a> for a quick check.</li>
        </ul>
      </section>
      <section className="pc-section" aria-labelledby="pc-access">
        <h2 id="pc-access">Accessible materials</h2>
        <ul className="pc-rules">
          <li>Alt text on every image.</li>
          <li>Text contrast of at least 4.5 to 1.</li>
          <li>No words baked into an image unless the same words appear next to it.</li>
          <li>Plain language: short sentences, everyday words.</li>
          <li>Print the full page address beside any QR code.</li>
        </ul>
      </section>
      <section className="pc-section" aria-labelledby="pc-lang">
        <h2 id="pc-lang">Languages and ending</h2>
        <ul className="pc-rules">
          <li>Publish materials only in languages your package supports.</li>
          <li>The sensitive package (support and wellbeing) always shows crisis lines beside your own support service.</li>
          <li>If the partnership ends, remove placements within 30 days. Your page address will forward to DeftBrain's public pages.</li>
        </ul>
      </section>
    </>
  );
}

// ─── Privacy and data ────────────────────────────────────────
function PrivacyData() {
  const rows = [['Scam Radar', 412, 371], ['Bill Rescue', 188, 160], ['Buy Wise', 96, 81], ['Quote Check', 31, 24], ['Upsell Shield', null, null]];
  return (
    <>
      <p className="org-lede pc-lede">Your page is built so you can promise people one simple thing: what they type is theirs. Here is exactly what the page collects, what you see, and who else is involved.</p>
      <section className="pc-section" aria-labelledby="pc-collect">
        <h2 id="pc-collect">What your page collects</h2>
        <ul className="pc-rules">
          <li>No accounts, sign-in or email addresses.</li>
          <li>No advertising or analytics cookies. Google Analytics does not load on partner pages.</li>
          <li>DeftBrain's own usage counter records page visits and which experiences were started and finished. It sets no cookies and stores no names, typed text or IP addresses.</li>
          <li>The suggestion box and newsletter signup appear only if you agree, and each says it goes to DeftBrain, not to you.</li>
          <li>Your contact details (phone, web link, hours) appear inside the experiences people open from your page. That is a plain link or phone number; nothing is sent to you when someone uses it.</li>
          <li>You open your report yourself at <a href="/partners/report">deftbrain.com/partners/report</a> with a report code we send you.</li>
        </ul>
      </section>
      <section className="pc-section" aria-labelledby="pc-see">
        <h2 id="pc-see">What you see, and what you never see</h2>
        <table className="pc-table">
          <thead><tr><th scope="col">You see</th><th scope="col">You never see</th></tr></thead>
          <tbody>
            <tr><td>Visits to your page, by month</td><td>What anyone typed</td></tr>
            <tr><td>Experiences started and finished</td><td>What anyone was shown</td></tr>
            <tr><td>Which tracked link brought people in</td><td>Names, emails or IP addresses</td></tr>
            <tr><td>Topics people came for, and the busiest days of the week</td><td>Who looked at which topic</td></tr>
            <tr><td>For a group of organizations: each member's totals</td><td>Anything a member couldn't see in its own report</td></tr>
            <tr><td>Totals only; any group under 20 sessions shown as “fewer than 20”</td><td>Anything that could identify one person</td></tr>
          </tbody>
        </table>
      </section>
      <section className="pc-section" aria-labelledby="report">
        <h2 id="report">Sample report</h2>
        <p className="pc-section-lead">Fictional numbers for the “Check before you pay or reply” package, one quarter.</p>
        <table className="pc-table pc-num">
          <thead><tr><th scope="col">Experience</th><th scope="col">Started</th><th scope="col">Finished</th></tr></thead>
          <tbody>{rows.map(([t, s, f]) => <tr key={t}><td>{t}</td><td>{s ?? 'fewer than 20'}</td><td>{f ?? 'fewer than 20'}</td></tr>)}</tbody>
        </table>
      </section>
      <section className="pc-section" aria-labelledby="pc-services">
        <h2 id="pc-services">Where typed text goes</h2>
        <p className="pc-section-lead">To write the guidance, what someone types is sent to the company that runs the language model, then the result comes back to their screen. DeftBrain does not store it.</p>
        <table className="pc-table">
          <thead><tr><th scope="col">Service</th><th scope="col">What it receives</th><th scope="col">How long it keeps it</th></tr></thead>
          <tbody>
            <tr><td>Anthropic</td><td>What is typed into most experiences</td><td>Deleted within 30 days; not used to train its models</td></tr>
            <tr><td>OpenAI</td><td>What is typed into Roommate Court</td><td>Up to 30 days in abuse-monitoring logs; not used for training</td></tr>
            <tr><td>Google Web Risk</td><td>Links found in a message pasted into Scam Radar, and nothing else</td><td>Per Google's terms</td></tr>
            <tr><td>Railway (hosting)</td><td>Standard request logs: IP address, browser, page address</td><td>7 days</td></tr>
          </tbody>
        </table>
        <p className="pc-note">The full list, including services used by experiences outside the packages, is in the <a href="/privacy">privacy policy</a>.</p>
      </section>
      <section className="pc-section" aria-labelledby="pc-docs">
        <h2 id="pc-docs">For your review team</h2>
        <ul className="pc-rules">
          <li>We complete security and vendor questionnaires, including the HECVAT for colleges and universities.</li>
          <li>Accessibility: DeftBrain is working toward WCAG 2.1 AA, and a formal conformance report is being prepared.</li>
          <li>Ask for documents or a call at <a href={`mailto:${CONTACT}?subject=Partner%20review%20documents`}>{CONTACT}</a>.</li>
        </ul>
      </section>
    </>
  );
}

// ─── One package (/partners/packages/<id>) ─────────────────────
// Each experience is described from its own primer in src/data/tools.js
// (when it helps, what someone brings, what they get), so the page never
// drifts from what the experience itself tells a visitor.
function PackageDetail({ pkg, byId }) {
  const tools = pkg.tools.map(id => byId[id]).filter(Boolean);
  return (
    <>
      <p className="pc-back"><Link to="/partners#pc-packages">← All packages</Link></p>
      <p className="org-lede pc-lede">{pkg.intro}</p>
      <p className="pc-note">That sentence is how the package introduces itself to the people you serve, on your page and in the launch materials.</p>
      <dl className="pc-facts">
        <div><dt>Often chosen by</dt><dd>{pkg.buyers}</dd></div>
        <div><dt>Help line shown beside it</dt><dd>{pkg.help}</dd></div>
        <div><dt>Experiences</dt><dd>{tools.length}, plus the rest of DeftBrain one click away</dd></div>
      </dl>
      {pkg.sensitive && <p className="pc-note pc-sensitive">Offered by request only: after a review of your launch copy, never as a first pilot, with crisis lines always shown beside your own support service, and usage reported for the package as a whole, never per experience.</p>}

      <section className="pc-section" aria-labelledby="pc-pkg-included">
        <h2 id="pc-pkg-included">What's included</h2>
        <div className="pc-pkg-tools">
          {tools.map(t => (
            <article key={t.id} className="pc-material">
              <h3><span aria-hidden="true">{t.icon}</span> <Link to={`/${t.id}`}>{t.title}</Link></h3>
              <p className="pc-pkg-tagline">{t.tagline || t.description}</p>
              {t.primer ? (
                <dl>
                  {t.primer.when && <div><dt>When it helps</dt><dd>{t.primer.when}</dd></div>}
                  {t.primer.give && <div><dt>What someone brings</dt><dd>{t.primer.give}</dd></div>}
                  {t.primer.get && <div><dt>What they get</dt><dd>{t.primer.get}</dd></div>}
                </dl>
              ) : <p>{t.description}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="pc-section" aria-labelledby="pc-pkg-price">
        <h2 id="pc-pkg-price">Starting with this package</h2>
        <p className="pc-section-lead">{pkg.sensitive ? 'Added to an existing partnership after its first pilot.' : 'Start with a 90-day pilot, credited in full to your first year.'} Each license covers up to two packages. <Link to="/organizations#pricing">See pricing →</Link></p>
        <div className="pc-pkg-actions">
          <Link className="org-btn org-btn-primary" to={`/partners/launch-kit?package=${pkg.id}`}>Preview its launch kit →</Link>
          <a className="org-text-link" href={`mailto:${CONTACT}?subject=${encodeURIComponent(`Package: ${pkg.title}`)}`}>Ask about this package</a>
        </div>
      </section>
    </>
  );
}


// ─── Sample consortium (/partners/sample-consortium) ─────────
// Everything a consortium gets, set up for a fictional union and two of its
// locals (owner, 2026-11-27): the edition and member pages, the contacts
// inside every experience, reports from fictional usage, printed materials,
// letters, and the forms a consortium uses. All from partners.json
// "example-union" (sample: true), so it shows exactly what the real thing does.
const SAMPLE_ID = 'example-union';

function MailForm({ id, title, lead, subject, fields, submit }) {
  const [v, setV] = useState(() => Object.fromEntries(fields.map(f => [f.name, f.sample || ''])));
  const body = fields.map(f => `${f.label}: ${v[f.name] || ''}`).join('\n');
  const href = `mailto:${CONTACT}?subject=${encodeURIComponent(subject(v))}&body=${encodeURIComponent(body)}`;
  return (
    <form className="pc-material pc-mailform" onSubmit={e => { e.preventDefault(); window.location.href = href; }} aria-labelledby={id}>
      <h3 id={id}>{title}</h3>
      <p className="pc-note">{lead}</p>
      <div className="pc-form">
        {fields.map(f => (
          <label key={f.name} className={f.wide ? 'pc-wide' : undefined}>{f.label}
            {f.long
              ? <textarea rows={3} value={v[f.name]} onChange={e => setV(x => ({ ...x, [f.name]: e.target.value }))} />
              : <input type="text" value={v[f.name]} onChange={e => setV(x => ({ ...x, [f.name]: e.target.value }))} />}
          </label>
        ))}
      </div>
      <p className="pc-note"><button type="submit" className="org-btn org-btn-primary">{submit}</button> Opens your email app with these answers filled in. Nothing is sent until you press send.</p>
    </form>
  );
}

function SampleConsortium({ byId }) {
  const u = resolvePartner(SAMPLE_ID);
  if (!u) return null;
  const memberIds = Object.keys(u.members || {});
  const m1 = resolvePartner(`${SAMPLE_ID}/${memberIds[0]}`);
  const m2 = resolvePartner(`${SAMPLE_ID}/${memberIds[1]}`);
  const edition = u.edition || u.name;
  const sample = (q) => `/api/partner-report/sample?${q}`;
  const letter = `Subject: ${edition}: free, private help for every member

Dear local officers,

${u.name} now offers ${edition}, free to every member and their family. It is guided help for the moments members bring to us: reading a contract, a problem at work, a confusing bill, a hard conversation. Members answer a few questions and see what matters, what their options are and what to ask next. No account, no cost to members, and the union never sees what anyone types.

Every local gets its own page, with your local's name and your own contacts shown inside every experience, so members are pointed back to you:
${memberIds.map(id => `  • ${u.members[id].name}: https://${SITE}/for/${SAMPLE_ID}/${id}`).join('\n')}

What we ask of each local:
  1. Check your page and send any changes to your contacts (phone, web link, hours).
  2. Share your page in your next newsletter, on your website and at your next meeting.
  3. Put the printed list of tools on the hall's notice board.

Each local receives a quarterly usage report (totals only) and the consortium receives one report covering every local.

In solidarity,
[Name]
[Title], ${u.name}`;
  const checklist = `${edition}: member setup checklist

☐ Local name as it should appear on the page
☐ Who members should contact (label, phone, web link, hours), or use the union hall's
☐ Page checked and approved by the local
☐ Report code received (for the local's own usage report)
☐ Launch: newsletter item, website card, notice-board list, staff/steward script
☐ Month 3: review the usage report with the consortium`;
  const board = `${edition}: summary for the executive board

What it is: free, private guided help for members' everyday situations (contracts, work problems, bills, health visits, hard conversations), on a page in our name, with every local's own contacts built in.

What members get: help at any hour, in 13 languages, with no account. Every experience points members back to their local or the union hall.

What we see: a quarterly report for the whole union and for each local, with visits, what people came for and which channels worked. Totals only; small groups hidden; never what anyone typed.

What it costs: one contract for every local. [Price from your DeftBrain quote.]`;
  return (
    <>
      <p className="org-lede pc-lede">Everything a consortium gets, set up for a fictional union with two locals. Every name, number and phone number here is made up; the pages, reports and materials work exactly as they would for you.</p>

      <section className="pc-section" aria-labelledby="sc-edition">
        <h2 id="sc-edition">1. Your edition and every member's page</h2>
        <p className="pc-section-lead">One page in the consortium's name, and one for each member, made from a list. Each member keeps the consortium's experiences and can have its own contacts.</p>
        <div className="pc-cards">
          <article><span aria-hidden="true">🏛️</span><h3>{edition}</h3><p>The consortium's page, listing every member.</p><Link to={`/for/${SAMPLE_ID}`}>Open the edition →</Link></article>
          {m1 && <article><span aria-hidden="true">📍</span><h3>{m1.name}</h3><p>A member with its own steward line, plus the hall's.</p><Link to={`/for/${m1.id}`}>Open the member page →</Link></article>}
          {m2 && <article><span aria-hidden="true">📍</span><h3>{m2.name}</h3><p>A member that uses the consortium's contacts.</p><Link to={`/for/${m2.id}`}>Open the member page →</Link></article>}
        </div>
      </section>

      <section className="pc-section" aria-labelledby="sc-inside">
        <h2 id="sc-inside">2. Your contacts inside every experience</h2>
        <p className="pc-section-lead">Once someone arrives through a member page, every experience they open ends with how to reach a person there, and printouts and copied results say who provided them.</p>
        <p className="pc-note">Try it: open <Link to={`/for/${m1 ? m1.id : SAMPLE_ID}`}>{m1 ? m1.name : edition}</Link>, then any experience on it{u.tools?.[0] && byId[u.tools[0]] ? <> (for example {byId[u.tools[0]].title})</> : null}, and look below the answer.</p>
      </section>

      <section className="pc-section" aria-labelledby="sc-reports">
        <h2 id="sc-reports">3. Reports</h2>
        <p className="pc-section-lead">Each member opens its own report with a report code at <Link to="/partners/report">deftbrain.com/partners/report</Link>; the consortium's code covers every member. These samples use fictional usage.</p>
        <div className="pc-cards">
          <article><span aria-hidden="true">📊</span><h3>Consortium report</h3><p>All members together, plus a table by member.</p><a href={sample(`partner=${SAMPLE_ID}`)} target="_blank" rel="noopener noreferrer">Open sample ↗</a></article>
          {m1 && <article><span aria-hidden="true">📈</span><h3>A member's report</h3><p>{m1.name} sees only its own numbers.</p><a href={sample(`partner=${encodeURIComponent(m1.id)}`)} target="_blank" rel="noopener noreferrer">Open sample ↗</a></article>}
          <article><span aria-hidden="true">🧾</span><h3>One page for funders and boards</h3><p>Reach, completion and topics, with how the numbers were counted.</p><a href={sample(`partner=${SAMPLE_ID}&view=funder`)} target="_blank" rel="noopener noreferrer">Open sample ↗</a></article>
        </div>
      </section>

      <section className="pc-section" aria-labelledby="sc-print">
        <h2 id="sc-print">4. Printed materials and launch kits</h2>
        <div className="pc-cards">
          <article><span aria-hidden="true">📄</span><h3>Printable list of every tool</h3><p>Two pages, "Provided by" the consortium or the member, with a QR code to their own page.</p><a href="/partners/example-union-all-tools.pdf" target="_blank" rel="noopener noreferrer">Edition PDF ↗</a> · <a href="/partners/example-union-large-all-tools.pdf" target="_blank" rel="noopener noreferrer">Large print ↗</a> · <a href="/partners/example-union-local-101-all-tools.pdf" target="_blank" rel="noopener noreferrer">Local 101 PDF ↗</a> · <a href="/partners/example-union-local-101-large-all-tools.pdf" target="_blank" rel="noopener noreferrer">Local 101 large print ↗</a> · <a href="/partners/example-union-local-202-all-tools.pdf" target="_blank" rel="noopener noreferrer">Local 202 PDF ↗</a> · <a href="/partners/example-union-local-202-large-all-tools.pdf" target="_blank" rel="noopener noreferrer">Local 202 large print ↗</a></article>
          <article><span aria-hidden="true">🧰</span><h3>Launch kits</h3><p>Emails, a website card, a staff script, tracked links, a handout with a QR code and a timeline, filled in.</p><Link to={`/partners/launch-kit?partner=${SAMPLE_ID}`}>For the consortium →</Link>{m1 && <> · <Link to={`/partners/launch-kit?partner=${encodeURIComponent(m1.id)}`}>For {m1.name} →</Link></>}</article>
        </div>
      </section>

      <section className="pc-section" aria-labelledby="sc-docs">
        <h2 id="sc-docs">5. Letters and documents</h2>
        <div className="pc-materials">
          <Material title="Letter to member organizations" note="From the consortium to every member, announcing the edition." text={letter} />
          <Material title="Member setup checklist" note="What each member does, in order." text={checklist} />
          <Material title="Summary for the board" note="For the consortium's executive board or annual report." text={board} />
        </div>
      </section>

      <section className="pc-section" aria-labelledby="sc-forms">
        <h2 id="sc-forms">6. Forms</h2>
        <p className="pc-section-lead">How a consortium keeps its edition up to date. Filled in with sample answers.</p>
        <div className="pc-materials">
          <MailForm id="sc-f-member" title="Add or update a member" lead="A new member page, or new contacts for an existing one." submit="Send member details"
            subject={v => `${edition}: member ${v.member || ''}`}
            fields={[
              { name: 'member', label: 'Member name', sample: 'Example Union Local 303', wide: true },
              { name: 'label', label: 'What members should contact you about', sample: 'Talk to your Local 303 steward.', wide: true },
              { name: 'phone', label: 'Phone', sample: '1-800-555-0303' },
              { name: 'hours', label: 'Hours', sample: 'weekdays 9–5' },
              { name: 'url', label: 'Web link (optional)', sample: '', wide: true },
            ]} />
          <MailForm id="sc-f-tool" title="Request a new experience" lead="A situation your people keep bringing you that DeftBrain doesn't cover yet." submit="Send request"
            subject={() => `${edition}: experience request`}
            fields={[
              { name: 'situation', label: 'The situation', sample: 'Members preparing for a grievance meeting.', wide: true, long: true },
              { name: 'who', label: 'Who it is for', sample: 'Members and stewards', wide: true },
            ]} />
          <MailForm id="sc-f-codes" title="Request report codes" lead="A report code for a member, or a new one if a code was lost." submit="Request codes"
            subject={() => `${edition}: report codes`}
            fields={[
              { name: 'members', label: 'Which members', sample: 'Local 101, Local 202', wide: true },
              { name: 'sendto', label: 'Send codes to (name and role)', sample: 'Pat Doe, Communications director', wide: true },
            ]} />
        </div>
      </section>

      <section className="pc-section" aria-labelledby="sc-privacy">
        <h2 id="sc-privacy">7. Privacy and your review team</h2>
        <p className="pc-section-lead">What the pages collect, what the consortium and each member see, and which outside services are involved: <Link to="/partners/privacy">Privacy and data</Link>.</p>
      </section>

      <section className="pc-section" aria-labelledby="sc-approval">
        <h2 id="sc-approval">8. Documents for your approval</h2>
        <p className="pc-section-lead">The packet your IT, privacy, legal, accessibility and procurement teams usually ask for, in one file. We send it on request.</p>
        <ul className="pc-rules">
          <li><b>Vendor profile:</b> who we are, what the service is, what is and isn't collected.</li>
          <li><b>Security questionnaire answers,</b> in HECVAT Lite order: hosting, encryption, access, logging, abuse protection.</li>
          <li><b>Data processing addendum</b> (template): roles, data, purposes, retention, end of the partnership.</li>
          <li><b>Subprocessors:</b> each outside service, what it receives and how long it keeps it.</li>
          <li><b>Sector statements:</b> FERPA, GLBA, HIPAA, COPPA, state privacy laws and GDPR.</li>
          <li><b>AI use and safety statement:</b> what the tools do and don't do, and how answers are checked.</li>
          <li><b>Accessibility statement</b> and our conformance report plan.</li>
          <li><b>Incident response and continuity.</b></li>
          <li><b>Pilot agreement outline.</b></li>
        </ul>
        <p className="pc-note"><a className="org-btn org-btn-primary" href={`mailto:${CONTACT}?subject=${encodeURIComponent('Approval packet request')}&body=${encodeURIComponent('Organization:\nYour name and role:\nWhich review teams need it (IT, privacy, legal, accessibility, procurement):\n')}`}>Request the approval packet</a></p>
      </section>
    </>
  );
}

const TITLES = { '': 'Everything you need to offer DeftBrain to your people.', 'launch-kit': 'Launch kit', guidelines: 'Guidelines', privacy: 'Privacy and data', 'sample-consortium': 'A sample consortium, fully set up' };

export default function PartnerCenter({ allTools = [] }) {
  const { section: page = '', pkg: pkgId } = useParams();
  const pkg = pkgId !== undefined && Object.prototype.hasOwnProperty.call(pkgById, pkgId) ? pkgById[pkgId] : null;
  const section = pkgId !== undefined ? 'packages' : page;
  const [params] = useSearchParams();
  const kitPartner = params.get('partner') || '';
  const { isDark, toggleTheme } = useTheme();
  const byId = useMemo(() => Object.fromEntries(allTools.map(t => [t.id, t])), [allTools]);
  const known = section === 'packages' ? !!pkg : section === '' || CENTER.pages.includes(section);
  const head = pkg ? { title: `${pkg.title} — Partner Center`, description: pkg.intro } : HEADS[section] || { title: 'Page not found' };
  const h1Ref = useRef(null);

  useDocumentHead({ title: head.title, description: head.description, canonicalPath: pkg ? `/partners/packages/${pkg.id}` : section ? `/partners/${section}` : '/partners' });
  useNoindex();
  useEffect(() => {
    document.body.classList.add('db-sand-page');
    return () => { document.body.classList.remove('db-sand-page'); };
  }, []);
  // Arriving on a page or #section (and Back to where you were) is RouteFocus's job.

  if (!known) return <NotFound />;

  return (
    <main className="org-page pc-page">
      <SiteHeader isDark={isDark} onToggleTheme={toggleTheme} showCurrency={false} />
      <div className="org-shell pc-shell">
        <div className="org-kicker pc-noprint">DEFTBRAIN PARTNER CENTER</div>
        <h1 ref={h1Ref} tabIndex={-1} className="pc-noprint">{pkg ? pkg.title : TITLES[section]}</h1>
        <nav className="pc-nav pc-noprint" aria-label="Partner Center">
          {SECTIONS.map(s => <Link key={s.id} to={s.id ? `/partners/${s.id}` : '/partners'} aria-current={s.id === section ? 'page' : undefined}>{s.label}</Link>)}
        </nav>
        {section === '' && <Overview byId={byId} />}
        {section === 'launch-kit' && <LaunchKit key={kitPartner} byId={byId} params={params} />}
        {section === 'guidelines' && <Guidelines />}
        {section === 'privacy' && <PrivacyData />}
        {section === 'sample-consortium' && <SampleConsortium byId={byId} />}
        {pkg && <PackageDetail pkg={pkg} byId={byId} />}
      </div>
    </main>
  );
}
