import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandMark from './BrandMark';
import { TOOL_COUNT_LABEL } from '../data/toolCount';
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

function ToolMiniCard({ tool }) {
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

  useEffect(() => {
    const previous = document.body.style.background;
    document.body.style.background = '#faf8f5';
    document.title = 'DeftBrain for Organizations | Practical everyday guidance';
    return () => { document.body.style.background = previous; };
  }, []);

  return (
    <main className="org-page">
      <nav className="org-nav" aria-label="Primary">
        <a href="/" className="org-brand-link"><BrandMark size="sm" /></a>
        <div className="org-nav-links"><Link to="/tools">Tools</Link><a href="/guides">Guides</a><a href="/about">About</a></div>
      </nav>

      <section className="org-hero org-shell">
        <div className="org-kicker">DEFTBRAIN FOR ORGANIZATIONS</div>
        <h1>Practical help for the things life throws at your people.</h1>
        <p className="org-lede">DeftBrain gives employees, members, patrons, and communities an easy way to explore the everyday situations they're facing — the possibilities, the alternatives, the things they might not have considered.</p>
        <div className="org-actions"><a className="org-btn org-btn-primary" href="mailto:hello@deftbrain.com?subject=DeftBrain%20for%20Organizations">Bring DeftBrain to your organization →</a><span>No AI expertise required.</span></div>
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
        <div className="org-section-heading"><div className="org-kicker">PRIVACY BY DESIGN</div><h2>Private for them. Useful for you.</h2><p className="org-privacy-lead">What someone asks DeftBrain should be their business.</p><p>For an organizational offering, our goal is to give organizations useful aggregate adoption information without turning individual questions, answers, or results into employer or sponsor reporting.</p><div className="org-product-note"><strong>Product commitment:</strong> organizational privacy and reporting controls will be finalized before pilots begin. This page does not promise capabilities that haven't been implemented yet.</div></div>
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
        <div><div className="org-kicker">START SMALL</div><h2>Bring DeftBrain to your organization.</h2><p>Start with a limited pilot. Give your people access, see what they actually use, and decide whether DeftBrain belongs in the resources you provide.</p><a className="org-btn org-btn-primary" href="mailto:hello@deftbrain.com?subject=DeftBrain%20Organization%20Pilot">Discuss a pilot →</a></div>
        <div className="org-pilot-points"><article><h3>Easy to introduce</h3><p>We'll provide materials to help people discover what's available.</p></article><article><h3>Easy to use</h3><p>No training or AI expertise required.</p></article><article><h3>Easy to evaluate</h3><p>We'll define useful, privacy-respecting pilot measures before launch.</p></article></div>
      </section>

      <section className="org-final"><div className="org-shell"><h2>There's almost always more than one way forward.</h2><p>DeftBrain helps people discover possibilities.</p><a className="org-btn org-btn-light" href="mailto:hello@deftbrain.com?subject=DeftBrain%20for%20Organizations">Bring DeftBrain to your organization →</a></div></section>
    </main>
  );
}
