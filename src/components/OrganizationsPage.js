import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import { useTheme } from '../hooks/useTheme';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { TOOL_COUNT_LABEL } from '../data/toolCount';
import CENTER from '../data/partnerCenter.json';
import { SCRAMBLE_COLORS, SCRAMBLE_SCALE, SCRAMBLE_TILT } from './HomeIntro';
import './OrganizationsPage.css';

const MOMENTS = [
  "I don't understand this lease.",
  'I think this email might be a scam.',
  'What should I ask my doctor?',
  'I need to have a difficult conversation.',
  'Am I paying too much?',
  "What am I supposed to do next?",
];

// The "one place to start" name field: the home page's Tool Scramble look, names only.
const NAME_FIELD_IDS = ['DoctorVisitPrep','ScamRadar','DifficultTalkCoach','BuyWise','LeaseTrapDetector','WaitingModeLiberator','Giftology','BillRescue','ProcedureProbe','SafeWalk','PaperworkPath','PlainTalk'];

const SHOWCASE_IDS = ['ScamRadar','DoctorVisitPrep','DifficultTalkCoach','LeaseTrapDetector','BuyWise','PaperworkPath','MoneyDiplomat','PlainTalk'];

// Each `key` is also the section's id, so outreach can link straight to it
// (deftbrain.com/organizations#libraries). Package ids are partnerCenter.json's.
const AUDIENCES = [
  { key:'credit-unions', people:'members', icon:'🏦', eyebrow:'Credit unions and banks', title:'Help members before they pay, sign or reply.',
    moments:'A text saying their account is locked. A medical bill that looks wrong. A dealer’s add-ons. A contractor’s quote.',
    copy:'Members already trust you with their money. DeftBrain gives them a calm place to look at a decision before it costs them, with your member-service line right beside it.',
    packages:['pay-or-reply','money-conversations'], pilot:'Pilot', tools:['ScamRadar','BillRescue','BuyWise'] },
  { key:'libraries', people:'patrons', icon:'📚', eyebrow:'Libraries', title:'A starting point for questions that arrive after the desk closes.',
    moments:'A letter from a government office. A lease to read by Friday. What to ask the doctor. A book whose title won’t come.',
    copy:'Extend the library’s role as a trusted source of practical information, in plain language and in 13 languages, with reader’s advisory and the reference desk one click away.',
    packages:['everyday-paperwork','judging-what-you-read','ideas-and-diversions'], pilot:'Pilot', tools:['PaperworkPath','PlainTalk','TipOfTongue'] },
  { key:'education', people:'students', icon:'🎓', eyebrow:'Colleges and universities', title:'Help students with everything outside the syllabus.',
    moments:'A first lease. A roommate standoff. Four deadlines in one week. A hard stretch they can’t quite name.',
    copy:'Give students practical help at any hour, alongside student services and the counseling center, never instead of them. Works for first-year programs, housing, career centers and adult education.',
    packages:['starting-on-campus','support-wellbeing','judging-what-you-read'], pilot:'Pilot', tools:['LeaseTrapDetector','ConceptCoach','MentalHealthNavigator'] },
  { key:'community', people:'the people you serve', icon:'🏘️', eyebrow:'Community organizations', title:'An approachable first step for the people you serve.',
    moments:'A form in confusing language. A deposit a landlord won’t return. A message that might be a scam. An appointment to get ready for.',
    copy:'No account and no technical experience needed: a starting point your staff can hand anyone, with your own help line beside it.',
    packages:['everyday-paperwork','sign-or-move-in','health-visits'], pilot:'Pilot', tools:['PaperworkPath','RentersDepositSaver','ScamRadar'] },
  { key:'employers', people:'employees', icon:'🏢', eyebrow:'Employers', title:'Support people beyond the job description.',
    moments:'A raise to ask for. A conflict with a coworker. A parent’s medical appointment. A bill that won’t wait for the weekend.',
    copy:'Help with the everyday problems that follow people to work, and nothing about what anyone asks is reported back to you.',
    packages:['work-conversations','money-conversations','health-visits'], pilot:'Pilot', tools:['DifficultTalkCoach','MoneyDiplomat','DoctorVisitPrep'] },
];

// Tier prices from docs/DeftBrain pricing and sales model.xlsx (USD): your
// hours plus the cost of the included uses, at a 40% margin. "People served"
// is the service-area population, members, enrolled students or employees.
const PRICES = [
  { name: 'Pilot', price: '$4,000', unit: '90 days', fits: 'Any size', note: 'About 500 uses. Credited in full to your first year.' },
  { name: 'Small', price: '$4,000', unit: 'per year', fits: 'Up to 25,000 people served', note: 'About 500 uses a year. Up to two packages.' },
  { name: 'Medium', price: '$6,200', unit: 'per year', fits: 'Up to 100,000 people served', note: 'About 2,000 uses a year. Up to two packages.' },
  { name: 'Large', price: '$12,800', unit: 'per year', fits: 'Up to 500,000 people served', note: 'About 10,000 uses a year. Up to two packages.' },
  { name: 'Consortium', price: '30% off', unit: "each member's tier", fits: 'Library consortia, state leagues, university systems', note: 'One contract for every member. Quoted from the five answers below.' },
];

// No backend: the answers become an email the visitor sends from their own app.
function QuoteForm() {
  const [q, setQ] = useState({ org: '', sites: '', packages: [], languages: '', where: 'page', start: '' });
  const set = k => e => setQ(v => ({ ...v, [k]: e.target.value }));
  const togglePkg = title => setQ(v => ({ ...v, packages: v.packages.includes(title) ? v.packages.filter(x => x !== title) : [...v.packages, title] }));
  const body = [
    `Organization: ${q.org}`,
    `Organizations or branches covered: ${q.sites}`,
    `Packages: ${q.packages.join('; ') || 'not sure yet'}`,
    `Languages: ${q.languages || 'English'}`,
    `Where it lives: ${q.where === 'page' ? 'a page on deftbrain.com' : 'inside our own site or app'}`,
    `Target start: ${q.start || 'not set'}`,
  ].join('\n');
  const href = `mailto:Org@deftbrain.com?subject=${encodeURIComponent(`Quote request${q.org ? `: ${q.org}` : ''}`)}&body=${encodeURIComponent(body)}`;
  return (
    <form className="org-quote" onSubmit={e => { e.preventDefault(); window.location.href = href; }} aria-labelledby="org-quote-title">
      <h3 id="org-quote-title">Need more than one institution, or DeftBrain inside your own site?</h3>
      <p>Tell us five things and we'll send a quote. No call needed unless something is unusual.</p>
      <label className="org-quote-wide">Organization<input type="text" value={q.org} onChange={set('org')} autoComplete="organization" placeholder="Example Library Consortium" /></label>
      <label>How many organizations or branches?<input type="number" min="1" inputMode="numeric" value={q.sites} onChange={set('sites')} placeholder="12" /></label>
      <label>Which languages?<input type="text" value={q.languages} onChange={set('languages')} placeholder="English" /></label>
      <fieldset className="org-quote-wide"><legend>Which packages?</legend>
        <div className="org-quote-pkgs">{CENTER.packages.map(p => (
          <label key={p.id}><input type="checkbox" checked={q.packages.includes(p.title)} onChange={() => togglePkg(p.title)} />{p.title}</label>
        ))}</div>
      </fieldset>
      <fieldset><legend>Where should it live?</legend>
        <label><input type="radio" name="org-where" checked={q.where === 'page'} onChange={() => setQ(v => ({ ...v, where: 'page' }))} />A page on deftbrain.com</label>
        <label><input type="radio" name="org-where" checked={q.where === 'embed'} onChange={() => setQ(v => ({ ...v, where: 'embed' }))} />Inside our own site or app</label>
      </fieldset>
      <label>When would you like to start?<input type="month" value={q.start} onChange={set('start')} /></label>
      <div className="org-quote-wide org-quote-send">
        <button type="submit" className="org-btn org-btn-primary">Email my quote request →</button>
        <span>Opens your email app with your answers filled in. Nothing is sent until you press send. Or write to <a href="mailto:Org@deftbrain.com">Org@deftbrain.com</a>.</span>
      </div>
    </form>
  );
}

export function ToolMiniCard({ tool }) {
  if (!tool) return null;
  return (
    <Link className="org-tool-card" to={`/${tool.id}`}>
      <img src={`/scramble/${tool.id}.webp`} alt="" loading="lazy" />
      <div><h3>{tool.title}</h3><p>{tool.tagline || tool.description}</p><span>Try this tool →</span></div>
    </Link>
  );
}

export default function OrganizationsPage({ allTools = [] }) {
  const byId = useMemo(() => Object.fromEntries(allTools.map(t => [t.id, t])), [allTools]);
  const showcase = SHOWCASE_IDS.map(id => byId[id]).filter(Boolean);
  const pkgById = Object.fromEntries(CENTER.packages.map(p => [p.id, p]));
  const priceOf = name => PRICES.find(p => p.name === name);

  // Arriving on a #section (and Back to where you were) is RouteFocus's job.

  const { isDark, toggleTheme } = useTheme();
  // Same head as scripts/prerender.js STATIC_PAGES.organizations — keep in sync.
  useDocumentHead({
    title: 'For Organizations — Practical Everyday Guidance',
    description: 'Practical guidance for the people you serve, whenever they’re unsure where to start: a contract to sign, a conflict at work, a parking ticket.',
    canonicalPath: '/organizations',
  });
  // The sand page color reaches the body (and overscroll) through a class;
  // src/styles/index.css gives it its light and dark values.
  useEffect(() => {
    document.body.classList.add('db-sand-page');
    return () => { document.body.classList.remove('db-sand-page'); };
  }, []);

  return (
    <main className="org-page">
      {/* The shared site header (SiteHeader.js, 2026-10-04). */}
      <SiteHeader isDark={isDark} onToggleTheme={toggleTheme} showCurrency={false} />

      <section className="org-hero org-shell">
        <div className="org-kicker">DEFTBRAIN FOR ORGANIZATIONS</div>
        <h1>Practical guidance for the people you serve, whenever they’re unsure where to start.</h1>
        <div className="org-actions"><span>No AI expertise required.</span></div>
        <div className="org-moments" aria-label="Examples of everyday questions">
          {MOMENTS.map((m,i) => <div key={m} className={`org-moment m${i+1}`}>“{m}”</div>)}
        </div>
        <h2 className="org-moments-caption">These are the types of moments DeftBrain was built for.</h2>
        <p className="org-moments-pdf"><a className="org-text-link" href="/all-tools.pdf">Printable list of all tools (PDF)</a></p>
      </section>

      <section className="org-section org-shell org-intro">
        <div className="org-section-heading wide"><div className="org-kicker">EVERYDAY SUPPORT</div><h2>Help that doesn't fit neatly into a benefits category.</h2><p>People bring the rest of their lives with them—to work, to school, to the library, and everywhere else. A confusing bill. A difficult conversation. A suspicious message. A major purchase. A medical appointment. A problem with a landlord. DeftBrain guides them through such moments.</p></div>
        <div className="org-tool-grid">{showcase.map(t => <ToolMiniCard key={t.id} tool={t} />)}</div>
        <div className="org-center"><Link className="org-text-link" to="/tools">Explore all DeftBrain tools →</Link></div>
      </section>

      <section className="org-section org-soft">
        <div className="org-shell">
          <div className="org-section-heading centered"><div className="org-kicker">HOW IT WORKS</div><h2>Simple enough for <em>everyone</em> to use.</h2></div>
          <div className="org-steps">
            <article><b>1</b><h3>Select a tool to fit the situation.</h3><p>No prompt writing. No figuring out what to ask an AI.</p></article>
            <article><b>2</b><h3>Answer a few thoughtful questions.</h3><p>DeftBrain asks for the information that matters.</p></article>
            <article><b>3</b><h3>Done!</h3><p>Clear thinking, useful questions, and real options to weigh.</p></article>
          </div>
        </div>
      </section>

      <section className="org-section org-shell org-range">
        {/* {allTools.length} → TOOL_COUNT_LABEL (2026-09-23): the site never
            publishes the exact live catalog count in marketing copy — same
            reason HomeIntro/NotFound/ToolRenderer all use this rounded
            "120+"-style label instead of the real number. This line is
            exactly that context (a headline stat in a sales pitch), so it
            gets the same treatment. */}
        <div className="org-section-heading centered"><div className="org-kicker">ONE PLACE TO START</div><h2>One resource. An extraordinary range of everyday needs.</h2><p><strong>{TOOL_COUNT_LABEL} tools.</strong> Hundreds of guides. One approachable place to begin.</p></div>
        <div className="org-scramble">{NAME_FIELD_IDS.map(id => byId[id]).filter(Boolean).map((t, i) => {
          const accent = SCRAMBLE_COLORS[i % SCRAMBLE_COLORS.length];
          return (
            <Link key={t.id} to={`/${t.id}`} className="org-scramble-item" style={{ '--accent': accent, '--scale': SCRAMBLE_SCALE[i % SCRAMBLE_SCALE.length], '--tilt': `${SCRAMBLE_TILT[i % SCRAMBLE_TILT.length]}deg` }}>
              <span className="org-scramble-name">{t.title}</span>
              {/* Picture preview on hover or keyboard focus only; a tap just opens the tool. */}
              <span className="org-scramble-pop" aria-hidden="true"><img src={`/scramble/${t.id}.webp`} alt="" loading="lazy" onError={e => { e.currentTarget.parentElement.style.display = 'none'; }} /><b>{t.tagline}</b></span>
            </Link>
          );
        })}</div>
      </section>

      <section className="org-section org-soft" aria-labelledby="org-who-title">
        <div className="org-shell">
          <div className="org-section-heading centered"><div className="org-kicker">WHO IT'S FOR</div><h2 id="org-who-title">Built for organizations that help people.</h2><p>Each kind of organization hears different questions. Here is what yours might bring to DeftBrain.</p></div>
          <nav className="org-tabs" aria-label="Kinds of organization">{AUDIENCES.map(a => <a key={a.key} href={`/organizations#${a.key}`}><span aria-hidden="true">{a.icon}</span>{a.eyebrow}</a>)}</nav>
        </div>
      </section>

      {AUDIENCES.map((a, i) => {
        const price = priceOf(a.pilot);
        return (
          <section key={a.key} id={a.key} tabIndex={-1} className={`org-section org-aud${i % 2 ? ' org-soft' : ''}`} aria-labelledby={`org-aud-${a.key}`}>
            <div className="org-shell">
              <div className="org-aud-head">
                <div>
                  <span className="org-aud-icon" aria-hidden="true">{a.icon}</span>
                  <div className="org-kicker">{a.eyebrow.toUpperCase()}</div>
                  <h2 id={`org-aud-${a.key}`}>{a.title}</h2>
                  <p className="org-aud-moments">{a.moments}</p>
                </div>
                <div className="org-aud-detail">
                  <p>{a.copy}</p>
                  <h3>Packages that fit</h3>
                  <ul>{a.packages.map(id => pkgById[id] && <li key={id}><Link className="org-text-link" to={`/partners/packages/${id}`}>{pkgById[id].title}</Link></li>)}</ul>
                  {price && <p className="org-aud-pilot">Start with the {price.name.toLowerCase()}: <strong>{price.price}</strong> for {price.unit}, credited to your first year.</p>}
                  <a className="org-btn org-btn-primary" href={`mailto:Org@deftbrain.com?subject=${encodeURIComponent(`DeftBrain pilot: ${a.eyebrow}`)}`}>Discuss a pilot →</a>
                </div>
              </div>
              {/* Without this line the three cards read as the whole package. */}
              <p className="org-aud-sample">A few of the {TOOL_COUNT_LABEL} tools {a.people} might open first. These are examples, not the package: every partner page keeps the rest of DeftBrain one click away.</p>
              <div className="org-sample-grid">{a.tools.map(id => <ToolMiniCard key={id} tool={byId[id]} />)}</div>
            </div>
          </section>
        );
      })}

      <section className="org-section org-shell org-privacy">
        <div className="org-section-heading"><div className="org-kicker">PRIVACY BY DESIGN</div><h2>Private for them. Useful for you.</h2><p className="org-privacy-lead">What someone asks DeftBrain should be their business.</p><p>For an organizational offering, our goal is to give organizations useful aggregate adoption information without turning individual questions, answers, or results into employer or sponsor reporting.</p><div className="org-product-note"><strong>How it works today:</strong> on your own DeftBrain page, your organization sees only overall usage counts, and any group under 20 is shown as “fewer than 20.” Nothing anyone types is shared with you, and the page sets no advertising or analytics cookies. <Link to="/partners/privacy">Privacy and data details →</Link></div></div>
        <div className="org-privacy-table"><div><h3>Individual</h3><p>Questions <strong>Private</strong></p><p>Answers <strong>Private</strong></p><p>Tool results <strong>Private</strong></p></div><div><h3>Organization</h3><p>Overall adoption <strong>Aggregate</strong></p><p>Popular categories <strong>Aggregate</strong></p><p>Usage trends <strong>Aggregate</strong></p></div></div>
      </section>

      <section className="org-section org-shell org-pilot" id="pilot">
        <div><div className="org-kicker">START SMALL</div><h2>Start with a 90-day pilot.</h2><p>One package, your own page and everything you need to launch it. At the end, look at what people actually used and decide whether DeftBrain belongs in the resources you provide.</p><a className="org-btn org-btn-primary" href="mailto:Org@deftbrain.com?subject=DeftBrain%20Organization%20Pilot">Discuss a pilot →</a><p className="org-partner-link"><a className="org-text-link" href="#pricing">See pricing →</a></p><p className="org-partner-link"><Link className="org-text-link" to="/partners">Everything partners get is in the Partner Center →</Link></p></div>
        <div className="org-pilot-points">
          <article><h3>Pick a package</h3><p>{CENTER.packages.length} ready packages, from scams and bills to leases, health visits, work conversations and pure curiosity, each with your own help line beside it.</p><Link className="org-text-link" to="/partners#pc-packages">See the packages →</Link></article>
          <article><h3>Get your own page</h3><p>A co-branded page at deftbrain.com/for/your-name, with your name, your intro and the rest of DeftBrain one click away.</p><Link className="org-text-link" to="/for/example-cu">See a sample page →</Link></article>
          <article><h3>Launch with ready-made materials</h3><p>Emails, a website card, a staff script, tracked links and a printable handout with a QR code, filled in for you and approved by you.</p><Link className="org-text-link" to="/partners/launch-kit">Open the launch kit →</Link></article>
          <article><h3>Review a report you can share</h3><p>Usage by month, by experience and by link, with no individual data.</p><Link className="org-text-link" to="/partners/privacy#report">See a sample report →</Link></article>
        </div>
      </section>

      {/* Answers the buyer's first question: why pay when DeftBrain is free?
          Only what the Partner Center already delivers; no promised features. */}
      <section className="org-section org-shell org-pilot" id="why-license" aria-labelledby="org-why-title">
        <div><div className="org-kicker">WHY A LICENSE</div><h2 id="org-why-title">DeftBrain is free. So what are you paying for?</h2><p>Not access: anyone can use DeftBrain, and your page never puts any of it behind a fee. A license pays for what lets your organization offer DeftBrain as its own, recommend it with confidence and show what it did.</p></div>
        <div className="org-pilot-points">
          <article><h3>A page that fits your people</h3><p>The public site opens on {TOOL_COUNT_LABEL} tools for everyone. Your page opens on the situations your people bring to you, with your own help line beside them, so staff have something specific to point to.</p><Link className="org-text-link" to="/for/example-cu">See a sample page →</Link></article>
          <article><h3>Evidence for your board or funder</h3><p>Usage by month, by experience and by link, ready to share. Free use leaves you nothing to report; a partner page does, with no individual data.</p><Link className="org-text-link" to="/partners/privacy#report">See a sample report →</Link></article>
          <article><h3>Answers for your review team</h3><p>What the page collects, where typed text goes and how long each service keeps it, in writing. We complete security and vendor questionnaires, including the HECVAT.</p><Link className="org-text-link" to="/partners/privacy">Privacy and data →</Link></article>
          <article><h3>A launch you don't have to write</h3><p>Emails, a website card, a staff script, tracked links and a printed handout, filled in for you. If you stop, your page forwards to DeftBrain's public pages, so no handout ever leads nowhere.</p><Link className="org-text-link" to="/partners/launch-kit">Open the launch kit →</Link></article>
        </div>
      </section>

      <section className="org-section org-soft org-pricing" id="pricing" aria-labelledby="org-pricing-title">
        <div className="org-shell">
          <div className="org-section-heading"><div className="org-kicker">PRICING</div><h2 id="org-pricing-title">Flat prices, in tiers by the people you serve.</h2><p>Your tier follows how many people you serve: a library's service-area population, a credit union's members, enrolled students or employees. There are no per-person fees and no accounts to count. Each tier includes a yearly number of uses; if your people use more, we talk before anything changes. Start with a pilot; its fee counts in full toward your first year.</p></div>
          <div className="org-price-grid">{PRICES.map(x => (
            <article key={x.name}><h3>{x.name}</h3><p className="org-price"><b>{x.price}</b> <span>{x.unit}</span></p><p className="org-price-fits">{x.fits}</p><p>{x.note}</p></article>
          ))}</div>
          <p className="org-price-small">Prices in US dollars. Starting prices while we run our first pilots.</p>
          <QuoteForm />
        </div>
      </section>

      <section className="org-final"><div className="org-shell"><h2>There's almost always more than one way forward.</h2><p>DeftBrain helps people discover possibilities.</p><a className="org-btn org-btn-light" href="mailto:Org@deftbrain.com?subject=DeftBrain%20for%20Organizations">Bring DeftBrain to your organization →</a></div></section>
    </main>
  );
}
