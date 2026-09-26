import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Caret from './Caret';
import { TOOL_COUNT_LABEL } from '../data/toolCount';
import { CATEGORY_META } from '../data/categoryMeta';
import './HomeIntro.css';

const NAVY = '#142a43';
const MUTED = '#655f56';
const BORDER = '#e4ddd2';
const SERIF = "'Playfair Display', Georgia, serif";

// Stable entry points: visitors can finish reading before choosing a tool.
// Shown four at a time; "Show other situations" steps through the rest
// (2026-09-27) — variety the visitor asks for, instead of the old cards
// flipping on their own. The first four are the default set; the rest are
// the earlier rotation's situations (each has a card photo in
// public/home-scenes/flip-cards/), in that list's order.
const SITUATIONS = [
  { toolId: 'LeaseTrapDetector', problem: 'Something in my lease looks wrong.', body: 'Understand the risk and what to ask.' },
  { toolId: 'DoctorVisitPrep', problem: 'I have a doctor appointment coming up.', body: 'Walk in knowing what matters.' },
  { toolId: 'DifficultTalkCoach', problem: 'I need to have a difficult conversation.', body: 'Think it through before you say it.' },
  { toolId: 'WhichLife', problem: 'I want to explore a different path.', body: 'See possibilities you haven’t considered.' },
  { toolId: 'BillRescue', problem: 'This bill doesn’t look right.', body: 'Figure out what to question and what to do next.' },
  { toolId: 'FakeReviewDetective', problem: 'Can I trust these reviews?', body: 'Look for the patterns that don’t add up.' },
  { toolId: 'TipOfTongue', problem: 'I know it. I just can’t remember it.', body: 'Work backward from the clues you still have.' },
  { toolId: 'ComplaintEscalationWriter', problem: 'They’re not listening to my complaint.', body: 'Make the next message harder to ignore.' },
  { toolId: 'PlainTalk', problem: 'I don’t understand this document.', body: 'Turn dense language into something usable.' },
  { toolId: 'LayoverMaximizer', problem: 'I have hours between flights.', body: 'Find out what you can realistically do.' },
  { toolId: 'RentersDepositSaver', problem: 'I want my security deposit back.', body: 'Prepare before move-out, not after the dispute.' },
  { toolId: 'ProcedureProbe', problem: 'A procedure was recommended. What should I ask?', body: 'Understand the decision before you say yes.' },
  { toolId: 'MarkupDetective', problem: 'Is this price actually reasonable?', body: 'Look past the sticker and inspect the markup.' },
  { toolId: 'GhostWriter', problem: 'I know what I mean. I can’t get the words right.', body: 'Turn the thought into something you can send.' },
  { toolId: 'WaitingModeLiberator', problem: 'I’m stuck waiting and can’t start anything.', body: 'Get some of your day back.' },
  { toolId: 'NameStorm', problem: 'I need a name that doesn’t sound generic.', body: 'Generate directions worth reacting to.' },
  { toolId: 'ChaosPilot', problem: 'Everything feels urgent at once.', body: 'Sort the pile and find the next move.' },
  { toolId: 'FinalWish', problem: 'I need to say something that matters.', body: 'Find the words without making them sound borrowed.' },
  { toolId: 'FocusSoundArchitect', problem: 'My surroundings are making it hard to work.', body: 'Build a background your attention can live with.' },
  { toolId: 'AlternatePath', problem: 'What if I’d made a different choice?', body: 'See where the other path would have led.' },
  { toolId: 'AnalogyEngine', problem: 'I need to explain something complicated.', body: 'Get an analogy built for exactly who’s listening.' },
  { toolId: 'ArgueSmarter', problem: 'I think I’m right, but I want to be sure.', body: 'Pressure-test your case against the strongest pushback.' },
  { toolId: 'AwkwardSilenceFiller', problem: 'The conversation just stalled.', body: 'Get something to say that actually fits the moment.' },
  { toolId: 'BatchFlow', problem: 'My to-do list is a mess of unrelated tasks.', body: 'Group them so your day stops fighting you.' },
  { toolId: 'BeforeHello', problem: 'There’s someone in my field I’d like to know.', body: 'Get ready before you say hello.' },
  { toolId: 'BeforeTheCrash', problem: 'I keep running myself into the ground.', body: 'Learn the pattern before it happens again.' },
  { toolId: 'BeliefStressTest', problem: 'I’ve held this belief for years.', body: 'See where it holds — and where it breaks.' },
  { toolId: 'BikeMedic', problem: 'Something’s wrong with my bike.', body: 'Figure out what it is and what to do next.' },
  { toolId: 'Bookmark', problem: 'I stopped reading and can’t remember where I was.', body: 'Pick up again — without the spoilers.' },
  { toolId: 'BragSheetBuilder', problem: 'I need to talk about my own work.', body: 'Remember it clearly and say it with confidence.' },
  { toolId: 'BrainDumpBuddy', problem: 'Everything is stuck in my head at once.', body: 'Get it out and find the one next step.' },
  { toolId: 'BrainRoulette', problem: 'I want to think about something new.', body: 'Follow your curiosity somewhere unexpected.' },
  { toolId: 'BrainStateDeejay', problem: 'I need to feel different than I do right now.', body: 'Get music that moves you there.' },
  { toolId: 'BreakMyPlan', problem: 'I think my plan is solid, but I’m not sure.', body: 'Find its weak spots before they find you.' },
  { toolId: 'BuyWise', problem: 'I’m about to buy something big.', body: 'Go in with your eyes open.' },
  { toolId: 'CaptionMagic', problem: 'I have the photo. I don’t have the words.', body: 'Find the caption that actually fits.' },
  { toolId: 'ColdOpenCraft', problem: 'I don’t know how to start the message.', body: 'Make the first line easier to send — and answer.' },
  { toolId: 'ContextCollapse', problem: 'The same message reads differently to my boss, my partner, and my friend.', body: 'See how each of them will actually read it — before you send it.' },
  { toolId: 'DecoderRing', problem: 'I can’t tell what they actually meant by that.', body: 'Explore what might really be going on beneath the words.' },
  { toolId: 'DoctorVisitTranslator', problem: 'My diagnosis is full of words I don’t understand.', body: 'Turn the medical jargon into plain English.' },
  { toolId: 'HistoryToday', problem: 'This feels unprecedented, but does it?', body: 'Find the real historical parallel — not the obvious one.' },
  { toolId: 'Mend', problem: 'I need to apologize, but not over- or under-do it.', body: 'Match the apology to the actual harm.' },
  { toolId: 'MentalHealthNavigator', problem: 'I don’t know what kind of help I actually need.', body: 'Find the right support for what you’re going through.' },
  { toolId: 'MiseEnPlace', problem: 'I can cook. I just can’t decide what to cook.', body: 'Get the plan, not just the recipe.' },
  { toolId: 'MissingLink', problem: 'I’m stuck on a concept and don’t know why.', body: 'Find exactly where your understanding broke.' },
  { toolId: 'NotSoFast', problem: 'I got a flat no, and I don’t think it’s final.', body: 'Find the appeal, the escalation path, or the conversation nobody explained.' },
  { toolId: 'PlantRescue', problem: 'My plant looks off and I don’t know why.', body: 'Get a few plausible explanations and what to check first.' },
  { toolId: 'RoastMe', problem: 'I’ve read this so many times I can’t see what’s wrong anymore.', body: 'Find the clichés and buzzwords you stopped noticing.' },
  { toolId: 'SixDegreesOfMe', problem: 'My interests feel scattered and unrelated.', body: 'Discover the surprising threads that connect them.' },
  { toolId: 'SomeoneSaidItBetter', problem: 'I know the feeling. I just can’t find the words.', body: 'Get the words you needed, already said.' },
  { toolId: 'TheDebrief', problem: 'The meeting ended and I’m still not sure what was decided.', body: 'Figure out what actually happened.' },
  { toolId: 'TheWholeStory', problem: 'I need to explain a messy chapter of my life.', body: 'Frame the real story — honest, but strategic.' },
  { toolId: 'VirtualBodyDouble', problem: 'I focus better with someone else in the room.', body: 'Work alongside a presence that keeps you on task.' },
  { toolId: 'WhatsThatMean', problem: 'I don’t know what that phrase actually means.', body: 'Get the plain explanation, not just the dictionary entry.' },
  { toolId: 'WrongAnswersOnly', problem: 'I need something ridiculous to lighten the mood.', body: 'Get a confidently, beautifully wrong answer.' },
];
const SITUATIONS_PER_SET = 4;

const SCRAMBLE_COLORS = ['#c94f45','#1f6f78','#d28a2e','#6c5aa8','#3f7b4d','#b14f78','#2e5f9e','#e36d32'];
const SCRAMBLE_ROTATE = [-12,-7,-3,3,7,12];
const SCRAMBLE_SCALE = [.92,.98,1.04,1.1];
// Independent "just landed" tilt for the hover-preview polaroid — deliberately
// NOT the same set/index math as SCRAMBLE_ROTATE, so a card's photo doesn't
// mirror its own tile's tilt (that would read as one rigid rotated unit
// instead of a separate snapshot tossed on top of it).
const SCRAMBLE_TILT = [-5,4,-3,6,-6,3,5,-4];

// Deterministic shuffle so the same seed always renders the same order
// (no layout flash from two different randoms racing on mount).
function seededShuffle(arr, seed) {
  const a = [...arr];
  let x = ((seed + 1) * 2654435761) >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    x = (x * 1664525 + 1013904223) >>> 0;
    const j = x % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ToolScramble({ allTools, onBrowse }) {
  const eligible = useMemo(() => allTools.filter(t => t?.id && t?.title && t?.tagline), [allTools]);
  const [seed, setSeed] = useState(0);
  // A small optional sampler; visitors can request another set explicitly.
  const shown = useMemo(() => seededShuffle(eligible, seed).slice(0, 12), [eligible, seed]);

  if (eligible.length === 0) return null;

  return (
    <section className="my-7 relative rounded-2xl border" style={{borderColor:BORDER}}>
      {/* Background is its own absolutely-positioned, overflow-hidden layer
          (not on the section itself) so a hover-preview image popping above
          or below a tile near the top/bottom edge isn't clipped by the
          card's rounded corners. */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{background:'linear-gradient(120deg,#dff4ff 0%,#eee9ff 35%,#fff2df 68%,#ffe5ee 100%)'}} />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <div className="text-[8px] uppercase tracking-[.16em] font-bold text-slate-600">Explore</div>
            <h2 className="mt-1 text-[24px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>Tool Scramble</h2>
            <p className="mt-1 text-sm max-w-md" style={{color:MUTED}}>A random handful of tools. Open any one, or scramble for another handful.</p>
          </div>
          <button type="button" onClick={()=>setSeed(s=>s+1)} className="rounded-lg px-3.5 py-2 text-sm font-bold text-white whitespace-nowrap" style={{background:NAVY}}>↻ Scramble more</button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-9 gap-y-7 py-6">
          {shown.map((t,i) => {
            const rot = SCRAMBLE_ROTATE[i%SCRAMBLE_ROTATE.length];
            const scale = SCRAMBLE_SCALE[i%SCRAMBLE_SCALE.length];
            const tilt = SCRAMBLE_TILT[i%SCRAMBLE_TILT.length];
            const accent = SCRAMBLE_COLORS[i%SCRAMBLE_COLORS.length];
            return (
              <Link key={t.id} to={`/${t.id}`} className="group relative block max-w-[210px]">
                {/* Scatter transform lives on this inner wrapper, not the
                    Link itself (2026-09-21). A CSS transform always creates
                    its own stacking context, so putting it on the Link
                    would seal that tile's whole subtree (text + popup) away
                    from every sibling — no z-index anywhere could then rank
                    one tile's content against another's popup. Keeping the
                    Link itself un-transformed means the plain z-index rule
                    below actually applies consistently across every tile. */}
                <span className="flex items-center gap-2" style={{transform:`rotate(${rot}deg) scale(${scale})`}}>
                  <span className="text-[20px] flex-shrink-0" aria-hidden="true">{t.icon || '✦'}</span>
                  <span>
                    <b className="block text-sm leading-tight" style={{color:accent}}>{t.tagline}</b>
                    {/* The tool's name is always shown, not revealed on hover (external
                        review, item 7): a tagline alone made visitors decode a
                        clever line before knowing what they'd open, and touch
                        screens never saw the name at all. */}
                    <em className="block not-italic text-xs mt-0.5" style={{color:NAVY}}>{t.title} →</em>
                  </span>
                </span>
                {/* Preview polaroid — only its own independent "just landed"
                    tilt (the Link isn't rotated, so there's no scatter angle
                    to cancel out). Accent border/caption match this tile's
                    own tagline color — ties the photo back to its tile
                    instead of reading as an unrelated insert. Desaturated
                    slightly so it sits closer to the section's pastel
                    palette. Silently disappears (onError) for the ~35 tools
                    with no art yet — the em title reveal above still works
                    either way.

                    z-20 here, explicitly, is the whole fix (2026-09-21,
                    2nd pass): every sibling Link is position:relative with
                    no z-index of its own (z-index:auto), and an element
                    with a real z-index always paints above a z-auto one
                    regardless of DOM order — so this popup reliably sits
                    above ANY neighboring tile's icon+tagline, not just
                    tiles that happen to come earlier in the list. First
                    pass tried the opposite (content always above every
                    popup, everywhere) specifically to stop a popup from
                    hiding a neighbor's name — it did, but a popup covering
                    several tiles' worth of space is common at this size,
                    and every one of THOSE tiles' now-undefeatable text
                    rendered right through the popup's own card, which read
                    as broken, not fixed ("text is bleeding through the
                    popup" — owner, 2026-09-21). A hover preview briefly
                    covering what's behind it (cleanly, opaquely) is normal,
                    expected hover-card behavior — it's the SAME piece of
                    information hidden AND visible at once that actually
                    looked wrong. Sized up on sm:+ (owner asked for bigger)
                    but kept smaller on real phones: it's centered under its
                    tile with no viewport-edge clamping, and a tile near the
                    left/right edge of a ~375px screen has little room
                    either side already. */}
                {/* Preview shows on real hover (mouse/trackpad) and on keyboard
                    focus only. On a touch screen a tap just opens the tool —
                    one predictable action, no half-shown popup first. */}
                <div
                  className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 w-[240px] sm:w-[360px] opacity-0 transition-opacity duration-150 [@media(hover:hover)]:group-hover:opacity-100 group-focus-visible:opacity-100"
                  style={{transform:`rotate(${tilt}deg) translateX(-50%)`}}
                >
                  <div className="rounded-2xl bg-white p-2.5 pb-3.5" style={{border:`2px solid ${accent}`,boxShadow:'0 20px 45px -12px rgba(20,42,67,.4)'}}>
                    <img
                      src={`/scramble/${t.id}.webp`}
                      alt=""
                      loading="lazy"
                      onError={e => { e.currentTarget.closest('div.pointer-events-none').style.display = 'none'; }}
                      className="w-full aspect-[640/566] object-cover rounded-lg"
                      style={{filter:'saturate(.8) contrast(.97)'}}
                    />
                    <div className="mt-2 text-center text-sm font-extrabold" style={{color:accent}}>{t.title}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <button type="button" onClick={() => onBrowse()} className="text-sm font-bold underline underline-offset-4" style={{color:NAVY}}>Browse all {TOOL_COUNT_LABEL} tools →</button>
      </div>
    </section>
  );
}

// The finder is supplied by DashBoard so submitting, Escape, and the
// keyboard shortcut keep using the existing search state and matching logic.
export default function HomeIntro({ allTools = [], onBrowse, finder }) {
  const byId = useMemo(() => new Map(allTools.map(tool => [tool.id, tool])), [allTools]);
  const categoryCounts = useMemo(() => {
    const counts = {};
    allTools.forEach(tool => (tool.categories || []).forEach(category => {
      counts[category] = (counts[category] || 0) + 1;
    }));
    return counts;
  }, [allTools]);
  const allSituations = useMemo(() => SITUATIONS.filter(item => byId.has(item.toolId)), [byId]);
  const [situationSet, setSituationSet] = useState(0);
  // Wraps around the list, so every set is a full four (55 situations don't
  // divide by 4) and it never runs out.
  const hasMoreSituations = allSituations.length > SITUATIONS_PER_SET;
  const situations = Array.from({ length: Math.min(SITUATIONS_PER_SET, allSituations.length) }, (_, k) =>
    allSituations[(situationSet * SITUATIONS_PER_SET + k) % allSituations.length]);

  // Scroll-depth markers (data-db-section, see src/utils/analytics.js) feed the
  // metrics report's "How far down the home page people get". data-db-layout
  // names THIS layout: the report counts only the newest layout's markers, so
  // a redesign that reuses a section name ("hero", "closing") starts a clean
  // funnel instead of blending into the old page's. Change it when the page's
  // sections change.
  return <main className="db-home" id="home-content" data-db-layout="home-2026-09-27">
    <section className="db-home-hero" aria-labelledby="home-title" data-db-section="hero">
      <div className="db-home-hero-copy">
        <h1 id="home-title">Life doesn’t come with instructions.</h1>
        <p className="db-home-description">Simple AI-powered tools to help you understand a document, prepare for a conversation, make a decision, or explore an idea.</p>
        <p className="db-home-reassurance">Free <span aria-hidden="true">·</span> No account needed <span aria-hidden="true">·</span> <a href="/privacy">Nothing you type is stored on our servers</a></p>
      </div>
      <div className="db-home-hero-art">
        <img src="/home-scenes/hero-everyday.jpg" alt="A lease, doctor-visit notes, and a difficult text conversation — everyday situations DeftBrain can help with" fetchpriority="high" />
      </div>
    </section>

    <div data-db-section="finder">{finder}</div>

    <section className="db-home-section" aria-labelledby="home-situations-title" data-db-section="situations">
      <div className="db-home-section-heading">
        <h2 id="home-situations-title">What’s on your mind?</h2>
        <div className="db-home-section-links">
          {hasMoreSituations && <button type="button" className="db-home-text-link" onClick={() => setSituationSet(n => n + 1)} aria-controls="home-situations">Show other situations <span aria-hidden="true">↻</span></button>}
          <Link to="/tools" className="db-home-text-link">Browse all tools <span aria-hidden="true">→</span></Link>
        </div>
      </div>
      <div className="db-home-situations" id="home-situations" aria-live="polite">
        {situations.map(item => <Link key={item.toolId} to={`/${item.toolId}`} className="db-home-situation">
          <img src={`/home-scenes/flip-cards/${item.toolId}.jpg`} alt="" loading="lazy" />
          <div className="db-home-situation-copy">
            <h3>{item.problem}</h3>
            <p>{item.body}</p>
            <span className="db-home-card-arrow" aria-hidden="true">→</span>
          </div>
        </Link>)}
      </div>
    </section>

    {byId.has('DoctorVisitPrep') && <section className="db-home-demo db-home-section" aria-labelledby="home-demo-title" data-db-section="demo">
      <h2 id="home-demo-title">See how it works</h2>
      {/* The "you don't have to figure out what to ask" point moved here from
          the hero (2026-09-27): it's the claim this demo shows, and the hero
          said it a second time right above the finder's own steps line. */}
      <p className="db-home-demo-intro"><strong>You don’t have to figure out what to ask.</strong> Each tool asks about your situation and turns your answers into practical guidance — here, from an upcoming appointment to a plan for the conversation.</p>
      <ol className="db-home-demo-steps">
        <li>
          <h3><span aria-hidden="true">1</span> Your situation</h3>
          <p className="db-home-example">“Right-sided lower back pain, getting worse for 3 weeks.”</p>
          <p>You want to explain what’s happening and remember what to ask.</p>
        </li>
        <li>
          <h3><span aria-hidden="true">2</span> The tool asks</h3>
          <p className="db-home-example">Chief concern <small>The single main reason for the visit</small></p>
          <p className="db-home-example">What are you hoping to get out of this visit?</p>
          <p>A few relevant questions help you organize what matters.</p>
        </li>
        <li>
          <h3><span aria-hidden="true">3</span> What you get</h3>
          {/* A real supplied result screenshot, not invented sample output.
              The fade and caption explicitly mark this as a partial view. */}
          <Link to="/DoctorVisitPrep" className="db-home-result-preview">
            <img src="/see-it-in-action/DoctorVisitPrep.webp" alt="Preview of a real Doctor Visit Prep result. Open Doctor Visit Prep to try it yourself." loading="lazy" />
            <span>Preview of a longer result <span aria-hidden="true">↓</span></span>
          </Link>
          <p className="db-home-result-caption">A real sample result, with more detail below the preview.</p>
        </li>
      </ol>
      <Link to="/DoctorVisitPrep" className="db-home-primary-link">Try Doctor Visit Prep <span aria-hidden="true">→</span></Link>
    </section>}

    <section className="db-home-section db-home-categories" id="categories" aria-labelledby="home-categories-title" data-db-section="categories">
      <div className="db-home-section-heading">
        <h2 id="home-categories-title">Explore by category</h2>
        <Link to="/tools" className="db-home-text-link">Browse all {TOOL_COUNT_LABEL} tools <span aria-hidden="true">→</span></Link>
      </div>
      <nav aria-label="Tool categories" className="db-home-category-list">
        {CATEGORY_META.filter(cat => categoryCounts[cat.name]).map(cat => (
          // Category pages are prerendered documents, not SPA routes.
          <a key={cat.slug} href={`/tools/${cat.slug}`} title={cat.example}>
            <span aria-hidden="true">{cat.emoji}</span> {cat.name}
            <span className="db-home-category-count">{categoryCounts[cat.name]}</span>
          </a>
        ))}
      </nav>
      <p className="db-home-guide-intro">Prefer to read first? Our guides explain common questions in everyday language. <a href="/guides">Browse guides →</a></p>
    </section>

    <div className="db-home-explore" data-db-section="scramble"><ToolScramble allTools={allTools} onBrowse={onBrowse} /></div>
    {/* Objection-handling — collapsed by default, after the tools content
        and before the closing send-off, so lingering doubts get answered
        right before someone leaves rather than sitting mid-scroll. Answers
        reuse language that already exists and was already vetted elsewhere
        on the site (about.html's "preparation tools, not professionals"
        disclaimer; the hero's own free/no-account/privacy line) rather than
        inventing new claims — the one exception is "what's the catch",
        which has no prior answer anywhere on the site. */}
    <section className="py-7" data-db-section="faq">
      <h2 className="text-[22px] sm:text-[25px] font-bold text-center" style={{fontFamily:SERIF,color:NAVY}}>Before you dig in</h2>
      <div className="mt-5 max-w-xl mx-auto divide-y" style={{borderColor:BORDER}}>
        <details className="group py-3">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-3 text-base font-semibold" style={{color:NAVY}}>
            Is this just ChatGPT?
            <Caret groupOpen className="ms-auto" />
          </summary>
          <p className="mt-2 text-sm leading-relaxed" style={{color:MUTED}}>No. DeftBrain isn’t a chat window. Each tool asks the specific questions your situation needs, then organizes the result — a lease review, a question list, a decision breakdown — instead of leaving you to figure out what to ask.</p>
        </details>
        <details className="group py-3">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-3 text-base font-semibold" style={{color:NAVY}}>
            Can I trust this for something serious — a lease, a diagnosis, money?
            <Caret groupOpen className="ms-auto" />
          </summary>
          {/* Plain <a>, not <Link>: /about is a static prerendered page, not
              a React Router route — same convention as /privacy and
              /guides above. */}
          <p className="mt-2 text-sm leading-relaxed" style={{color:MUTED}}>These are preparation tools, not professionals. Lease Trap Detector helps you walk into a lawyer’s office with better questions — it isn’t a lawyer. AI can be wrong, confidently. Treat the output as a well-organized starting point, and verify anything that’s load-bearing. <a href="/about" className="!no-underline hover:!underline underline-offset-2 font-semibold" style={{color:NAVY}}>More on how we think about this →</a></p>
        </details>
        <details className="group py-3">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-3 text-base font-semibold" style={{color:NAVY}}>
            Is my information safe?
            <Caret groupOpen className="ms-auto" />
          </summary>
          <p className="mt-2 text-sm leading-relaxed" style={{color:MUTED}}>Nothing you type into a tool is stored on our servers. No accounts. The only cookies are Google Analytics’, which never see what you type. <a href="/privacy" className="!no-underline hover:!underline underline-offset-2 font-semibold" style={{color:NAVY}}>Read the privacy policy →</a></p>
        </details>
        <details className="group py-3">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-3 text-base font-semibold" style={{color:NAVY}}>
            What’s the catch — how is it free?
            <Caret groupOpen className="ms-auto" />
          </summary>
          <p className="mt-2 text-sm leading-relaxed" style={{color:MUTED}}>There isn’t one. DeftBrain is free to use — no ads, no account, nothing to buy. We’re focused on making DeftBrain genuinely useful before we think about how — or whether — to charge for anything. And an ad-supported or data-selling model would work against the whole point: you should be able to trust us with a lease, a diagnosis, or a hard conversation without wondering what we’re getting out of what you typed.</p>
        </details>
      </div>
    </section>

    <section className="py-8 text-center" data-db-section="closing">
      <h2 className="text-[22px] sm:text-[25px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>You don’t have to figure everything out alone.</h2>
      <p className="mt-1.5 text-sm" style={{color:MUTED}}>Read one, or run a tool — whichever fits.</p>
      {/* Plain <a>, not <Link>: /guides and /guides/:category are static
          prerendered pages (built by scripts/prerender.js), not React Router
          routes — a <Link> here would fall through to the catch-all
          /:toolId route and 404, same convention as the privacy link above
          and Footer.js/RelatedLinks.js. */}
      <nav aria-label="Guides" className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold">
        <a href="/guides/conversations" className="!no-underline hover:!underline underline-offset-4" style={{color:NAVY}}>Conversations</a>
        <a href="/guides/money" className="!no-underline hover:!underline underline-offset-4" style={{color:NAVY}}>Money</a>
        <a href="/guides/workplace" className="!no-underline hover:!underline underline-offset-4" style={{color:NAVY}}>Workplace</a>
        <a href="/guides/home" className="!no-underline hover:!underline underline-offset-4" style={{color:NAVY}}>Home</a>
        <a href="/guides/wellness" className="!no-underline hover:!underline underline-offset-4" style={{color:NAVY}}>Wellness</a>
        <a href="/guides/health" className="!no-underline hover:!underline underline-offset-4" style={{color:NAVY}}>Health</a>
        <a href="/guides" className="font-bold underline underline-offset-4" style={{color:NAVY}}>Browse all guides →</a>
      </nav>
    </section>
  </main>;
}
