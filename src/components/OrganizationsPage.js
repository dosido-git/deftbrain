import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import { useTheme } from '../hooks/useTheme';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { TOOL_COUNT_LABEL } from '../data/toolCount';
import CENTER from '../data/partnerCenter.json';
import './OrganizationsPage.css';

const MOMENTS = [
  "I don't understand this lease.",
  'I think this email might be a scam.',
  'What should I ask my doctor?',
  'I need to have a difficult conversation.',
  'Am I paying too much?',
  "I don't know what I'm supposed to do next.",
];

const SHOWCASE_IDS = ['ScamRadar','DoctorVisitPrep','DifficultTalkCoach','LeaseTrapDetector','BuyWise','PaperworkPath','MoneyDiplomat','PlainTalk'];

const AUDIENCES = [
  { key:'employers', eyebrow:'Employers', title:'Support people beyond the job description.', copy:'Give employees approachable help with the everyday problems that consume attention, create stress, and follow them to work.' },
  { key:'libraries', eyebrow:'Libraries', title:"Help patrons discover options they hadn't considered.", copy:"Extend the library's role as a trusted source of practical information and everyday help." },
  { key:'credit-unions', eyebrow:'Credit unions', title:'Help members make more confident everyday decisions.', copy:'Extend member support beyond transactions with practical guidance for purchases, bills, scams, negotiations, and more.' },
  { key:'community', eyebrow:'Community organizations', title:'Make practical guidance more accessible.', copy:'Offer people an approachable starting point regardless of their technical experience.' },
];

const AUDIENCE_TOOLS = {
  employers: ['DifficultTalkCoach','DoctorVisitPrep','MoneyDiplomat','PlainTalk','ScamRadar','BuyWise'],
  libraries: ['ScamRadar','PaperworkPath','DoctorVisitPrep','PlainTalk','LeaseTrapDetector','ResearchDecoder'],
  'credit-unions': ['BuyWise','BillRescue','ScamRadar','MoneyDiplomat','MarkupDetective','NotSoFast'],
  community: ['PaperworkPath','PlainTalk','DoctorVisitPrep','ScamRadar','LeaseTrapDetector','DifficultTalkCoach'],
};

// Starting prices from the Organizations plan (USD, flat by scope: every
// visitor is included, so nobody is counted or capped).
const PRICES = [
  { name: 'Community pilot', price: '$1,500', unit: '90 days', fits: 'Libraries and nonprofits', note: 'Credited in full to your first year.' },
  { name: 'Standard pilot', price: '$4,500', unit: '90 days', fits: 'Credit unions, banks and campuses', note: 'Credited in full to your first year.' },
  { name: 'Community license', price: '$2,500', unit: 'per year', fits: 'One library system or nonprofit', note: 'One package.' },
  { name: 'Standard license', price: '$7,500', unit: 'per year', fits: 'One institution', note: 'Up to two packages.' },
  { name: 'Multi-program or consortium', price: 'From $15,000', unit: 'per year', fits: 'Library consortia, state leagues, university systems', note: 'Quoted from the five answers below.' },
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
  const [audience, setAudience] = useState('employers');
  const byId = useMemo(() => Object.fromEntries(allTools.map(t => [t.id, t])), [allTools]);
  const showcase = SHOWCASE_IDS.map(id => byId[id]).filter(Boolean);
  const audienceTools = (AUDIENCE_TOOLS[audience] || []).map(id => byId[id]).filter(Boolean);

  const { isDark, toggleTheme } = useTheme();
  // Same head as scripts/prerender.js STATIC_PAGES.organizations — keep in sync.
  useDocumentHead({
    title: 'For Organizations — Practical Everyday Guidance',
    description: 'Give employees, members, patrons, and communities an easy way to explore everyday situations: confusing bills, hard conversations, suspicious messages.',
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
        <h1>Practical help for the things life throws at your people.</h1>
        <p className="org-lede">DeftBrain gives employees, members, patrons, and communities an easy way to explore everyday situations they're facing — the possibilities, alternatives, things they might not have considered.</p>
        <div className="org-actions"><a className="org-btn org-btn-primary" href="mailto:Org@deftbrain.com?subject=DeftBrain%20for%20Organizations">Bring DeftBrain to your organization →</a><span>No AI expertise required.</span></div>
        <div className="org-moments" aria-label="Examples of everyday questions">
          {MOMENTS.map((m,i) => <div key={m} className={`org-moment m${i+1}`}>“{m}”</div>)}
        </div>
        <h2 className="org-moments-caption">These are the moments DeftBrain was built for.</h2>
      </section>

      <section className="org-section org-shell org-intro">
        <div className="org-section-heading"><div className="org-kicker">EVERYDAY SUPPORT</div><h2>Help that doesn't fit neatly into a benefits category.</h2><p>People bring the rest of their lives with them—to work, to school, to the library, and everywhere else. A confusing bill. A difficult conversation. A suspicious message. A major purchase. A medical appointment. A problem with a landlord. DeftBrain gives them somewhere to start.</p></div>
        <div className="org-tool-grid">{showcase.map(t => <ToolMiniCard key={t.id} tool={t} />)}</div>
        <div className="org-center"><Link className="org-text-link" to="/tools">Explore all DeftBrain tools →</Link></div>
      </section>

      <section className="org-section org-soft">
        <div className="org-shell">
          <div className="org-section-heading centered"><div className="org-kicker">HOW IT WORKS</div><h2>Simple enough for anyone to use.</h2></div>
          <div className="org-steps">
            <article><b>1</b><h3>Choose what's going on.</h3><p>No prompt writing. No figuring out what to ask an AI.</p></article>
            <article><b>2</b><h3>Answer a few thoughtful questions.</h3><p>DeftBrain asks for the information that matters.</p></article>
            <article><b>3</b><h3>Get practical guidance.</h3><p>Clear thinking, useful questions, and real options to weigh.</p></article>
          </div>
          <blockquote>Your people don't need to learn AI.<br/><strong>They just need to know what's going on.</strong></blockquote>
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
        <div className="org-name-field" aria-hidden="true">Doctor Visit Prep <i>·</i> Scam Radar <i>·</i> Difficult Talk Coach <i>·</i> Buy Wise <i>·</i> Lease Trap Detector <i>·</i> Waiting Mode Liberator <i>·</i> Giftology <i>·</i> Bill Rescue <i>·</i> Procedure Probe <i>·</i> Safe Walk <i>·</i> Paperwork Path <i>·</i> Plain Talk</div>
      </section>

      <section className="org-section org-soft">
        <div className="org-shell">
          <div className="org-section-heading"><div className="org-kicker">WHO IT'S FOR</div><h2>Built for organizations that help people.</h2></div>
          <div className="org-audience-grid">{AUDIENCES.map(a => <article key={a.key}><span>{a.eyebrow}</span><h3>{a.title}</h3><p>{a.copy}</p><a href="#pilot">Discuss a pilot →</a></article>)}</div>
        </div>
      </section>

      <section className="org-section org-shell org-privacy">
        <div className="org-section-heading"><div className="org-kicker">PRIVACY BY DESIGN</div><h2>Private for them. Useful for you.</h2><p className="org-privacy-lead">What someone asks DeftBrain should be their business.</p><p>For an organizational offering, our goal is to give organizations useful aggregate adoption information without turning individual questions, answers, or results into employer or sponsor reporting.</p><div className="org-product-note"><strong>How it works today:</strong> on your own DeftBrain page, your organization sees only overall usage counts, and any group under 20 is shown as “fewer than 20.” Nothing anyone types is shared with you, and the page sets no advertising or analytics cookies. <Link to="/partners/privacy">Privacy and data details →</Link></div></div>
        <div className="org-privacy-table"><div><h3>Individual</h3><p>Questions <strong>Private</strong></p><p>Answers <strong>Private</strong></p><p>Tool results <strong>Private</strong></p></div><div><h3>Organization</h3><p>Overall adoption <strong>Aggregate</strong></p><p>Popular categories <strong>Aggregate</strong></p><p>Usage trends <strong>Aggregate</strong></p></div></div>
      </section>

      <section className="org-section org-soft">
        <div className="org-shell">
          <div className="org-section-heading centered"><div className="org-kicker">TRY THE IDEA</div><h2>What would your people actually use?</h2><p>Choose an organization type and sample the kinds of everyday needs DeftBrain can support.</p></div>
          <div className="org-tabs">{AUDIENCES.map(a => <button key={a.key} onClick={() => setAudience(a.key)} className={audience===a.key?'active':''}>{a.eyebrow}</button>)}</div>
          <div className="org-sample-grid">{audienceTools.map(t => <ToolMiniCard key={t.id} tool={t} />)}</div>
        </div>
      </section>

      <section className="org-section org-shell org-pilot" id="pilot">
        <div><div className="org-kicker">START SMALL</div><h2>Start with a 90-day pilot.</h2><p>One package, your own page and everything you need to launch it. At the end, look at what people actually used and decide whether DeftBrain belongs in the resources you provide.</p><a className="org-btn org-btn-primary" href="mailto:Org@deftbrain.com?subject=DeftBrain%20Organization%20Pilot">Discuss a pilot →</a><p className="org-partner-link"><a className="org-text-link" href="#pricing">See pricing →</a></p><p className="org-partner-link"><Link className="org-text-link" to="/partners">Everything partners get is in the Partner Center →</Link></p></div>
        <div className="org-pilot-points">
          <article><h3>Pick a package</h3><p>Nine ready packages, from scams and bills to leases, health visits and work conversations, each with your own help line beside it.</p><Link className="org-text-link" to="/partners#pc-packages">See the packages →</Link></article>
          <article><h3>Get your own page</h3><p>A co-branded page at deftbrain.com/for/your-name, with your name, your intro and the rest of DeftBrain one click away.</p><Link className="org-text-link" to="/for/example-cu">See a sample page →</Link></article>
          <article><h3>Launch with ready-made materials</h3><p>Emails, a website card, a staff script, tracked links and a printable handout with a QR code, filled in for you and approved by you.</p><Link className="org-text-link" to="/partners/launch-kit">Open the launch kit →</Link></article>
          <article><h3>Review a report you can share</h3><p>Usage by month, by experience and by link, with no individual data.</p><Link className="org-text-link" to="/partners/privacy#report">See a sample report →</Link></article>
        </div>
      </section>

      <section className="org-section org-soft org-pricing" id="pricing" aria-labelledby="org-pricing-title">
        <div className="org-shell">
          <div className="org-section-heading"><div className="org-kicker">PRICING</div><h2 id="org-pricing-title">Flat prices, sized by scope.</h2><p>Every visitor is included: no per-person fees and no accounts to count. Start with a pilot; its fee counts in full toward your first year.</p></div>
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
