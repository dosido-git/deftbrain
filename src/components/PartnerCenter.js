import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import NotFound from './NotFound';
import { CopyBtn, PrintBtn } from './ActionButtons';
import { useTheme } from '../hooks/useTheme';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { useNoindex } from '../hooks/useNoindex';
import { revealSection } from '../utils/revealSection';
import { TOOL_COUNT_LABEL } from '../data/toolCount';
import CENTER from '../data/partnerCenter.json';
import PARTNERS from '../data/partners.json';
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
];
const HEADS = {
  '': { title: 'Partner Center', description: 'What a DeftBrain partnership includes: your own page, ready-to-send launch materials, and usage reports with no individual data.' },
  'launch-kit': { title: 'Launch kit — Partner Center', description: 'Emails, a website card, a staff script, tracked links and a printable handout, filled in for your organization.' },
  guidelines: { title: 'Guidelines — Partner Center', description: 'How to describe DeftBrain to your people, and the co-branding rules.' },
  privacy: { title: 'Privacy and data — Partner Center', description: 'What a partner page collects, what your organization sees, and which outside services are involved.' },
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
      <p className="org-lede pc-lede">DeftBrain gives the people you serve a free, private place to think through everyday situations: a confusing bill, a lease, a hard conversation, a suspicious message. You choose the package, we build your page, and you launch it with materials ready to send.</p>

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
              <Link className="pc-package-link" to={`/partners/launch-kit?package=${p.id}`}>Preview its launch kit →</Link>
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
  const partner = id && Object.prototype.hasOwnProperty.call(PARTNERS, id) ? PARTNERS[id] : null;
  const fromPartner = partner && CENTER.packages.find(p => p.title === partner.packageTitle);
  const pkg = pkgById[params.get('package')] || fromPartner || CENTER.packages[0];
  return {
    name: partner?.name || '',
    packageId: pkg.id,
    slug: partner ? id : '',
    helpText: partner?.help?.text || '',
    phone: partner?.help?.phone || '',
  };
}

const slugify = s => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

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
  const timeline = `Week 0: approve all copy and placements (owner: ____, approved on: ____)\nLaunch day: send the email, publish the website card, put out handouts\nWeek 1: brief front-line staff with the staff script\nWeek 4: send the reminder\nMonth 3: review the usage report together`;
  const channels = [['Email', 'email'], ['Reminder', 'reminder'], ['Website or portal', 'website'], ['Social posts', 'social'], ['Printed handout', 'print'], ['Staff referrals', 'staff']];

  return (
    <>
      <p className="org-lede pc-lede pc-noprint">Fill in your details and every item below updates. Copy what you need, change the wording to sound like you, and send it to us for a quick check before it goes out.</p>

      <form className="pc-form pc-noprint" onSubmit={e => e.preventDefault()} aria-label="Your details">
        <label>Organization name<input value={kit.name} onChange={set('name')} placeholder="Example Credit Union" autoComplete="organization" /></label>
        <label>Package<select value={kit.packageId} onChange={set('packageId')}>{CENTER.packages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
        <label>Page address<span className="pc-prefix"><span>{SITE}/for/</span><input value={kit.slug} onChange={e => setKit(k => ({ ...k, slug: slugify(e.target.value) }))} placeholder={slugify(kit.name) || 'your-organization'} /></span></label>
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
          <h2 id="pc-handout-title">Printable handout</h2>
          <PrintBtn label="Print handout" />
        </div>
        <p className="pc-section-lead pc-noprint">One page, large type, with the address printed in full beside the QR code. The QR code uses the printed-handout tracking link; download it on its own for posters or cards.</p>
        <article className="pc-handout" aria-label="Handout preview">
          <header><b>{name}</b><span>by DeftBrain</span></header>
          <h2>{pkg.title}</h2>
          <p className="pc-handout-intro">{pkg.intro}</p>
          <h3>How it works</h3>
          <ol><li>Go to the address below.</li><li>Choose what's going on and answer a few questions.</li><li>See what matters, your options and what to ask next.</li></ol>
          <h3>What's included</h3>
          <ul>{tools.map(t => <li key={t.id}><b>{t.title}</b> — {t.tagline || t.description}</li>)}</ul>
          <div className="pc-handout-go">
            <QrCode value={link('print')} label={`QR code that opens ${page}`} />
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

const TITLES = { '': 'Everything you need to offer DeftBrain to your people.', 'launch-kit': 'Launch kit', guidelines: 'Guidelines', privacy: 'Privacy and data' };

export default function PartnerCenter({ allTools = [] }) {
  const { section = '' } = useParams();
  const [params] = useSearchParams();
  const { isDark, toggleTheme } = useTheme();
  const byId = useMemo(() => Object.fromEntries(allTools.map(t => [t.id, t])), [allTools]);
  const known = section === '' || CENTER.pages.includes(section);
  const head = HEADS[section] || { title: 'Page not found' };
  const h1Ref = useRef(null);
  const first = useRef(true);

  useDocumentHead({ title: head.title, description: head.description, canonicalPath: section ? `/partners/${section}` : '/partners' });
  useNoindex();
  useEffect(() => {
    document.body.classList.add('db-sand-page');
    return () => { document.body.classList.remove('db-sand-page'); };
  }, []);
  // Switching pages swaps the whole view: bring the window to its top and focus the heading.
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    const t = setTimeout(() => revealSection(h1Ref.current, { frame: true }), 120);
    return () => clearTimeout(t);
  }, [section]);

  if (!known) return <NotFound />;

  return (
    <main className="org-page pc-page">
      <SiteHeader isDark={isDark} onToggleTheme={toggleTheme} showCurrency={false} />
      <div className="org-shell pc-shell">
        <div className="org-kicker pc-noprint">DEFTBRAIN PARTNER CENTER</div>
        <h1 ref={h1Ref} tabIndex={-1} className="pc-noprint">{TITLES[section]}</h1>
        <nav className="pc-nav pc-noprint" aria-label="Partner Center">
          {SECTIONS.map(s => <Link key={s.id} to={s.id ? `/partners/${s.id}` : '/partners'} aria-current={s.id === section ? 'page' : undefined}>{s.label}</Link>)}
        </nav>
        {section === '' && <Overview byId={byId} />}
        {section === 'launch-kit' && <LaunchKit byId={byId} params={params} />}
        {section === 'guidelines' && <Guidelines />}
        {section === 'privacy' && <PrivacyData />}
      </div>
    </main>
  );
}
