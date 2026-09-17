import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const NAVY = '#0f2540';
const NAVY2 = '#1e3550';
const SAND2 = '#f3efe8';
const BORDER = '#e8e1d5';
const WARM = '#5a544a';
const SERIF = "'Playfair Display', Georgia, serif";

// Situation copy is intentionally about the visitor's predicament, not the
// product taxonomy. The tool metadata remains the source of truth for title,
// icon and route; these lines only explain why someone might reach for it.
const ROTATION = [
  { toolId: 'LeaseTrapDetector', eyebrow: 'Something in my lease looks wrong.', body: 'Find the clause. Understand the risk. Know what to ask.', art: '🏠' },
  { toolId: 'DoctorVisitPrep', eyebrow: 'I have a doctor appointment coming up.', body: 'Walk in knowing what matters.', art: '🩺' },
  { toolId: 'DifficultTalkCoach', eyebrow: 'I need to have a difficult conversation.', body: 'Think it through before you say it.', art: '💬' },
  { toolId: 'BillRescue', eyebrow: 'This bill doesn’t look right.', body: 'Figure out what to question and what to do next.', art: '🧾' },
  { toolId: 'FakeReviewDetective', eyebrow: 'Can I trust these reviews?', body: 'Look for the patterns that don’t add up.', art: '🛒' },
  { toolId: 'TipOfTongue', eyebrow: 'I know it. I just can’t remember it.', body: 'Work backward from the clues you still have.', art: '💡' },
  { toolId: 'ComplaintEscalationWriter', eyebrow: 'They’re not listening to my complaint.', body: 'Make the next message harder to ignore.', art: '📣' },
  { toolId: 'PlainTalk', eyebrow: 'I don’t understand this document.', body: 'Turn dense language into something usable.', art: '📄' },
  { toolId: 'LayoverMaximizer', eyebrow: 'I have hours to kill between flights.', body: 'Find out what you can realistically do.', art: '✈️' },
  { toolId: 'RentersDepositSaver', eyebrow: 'I want my security deposit back.', body: 'Prepare before move-out, not after the dispute.', art: '🔑' },
  { toolId: 'ProcedureProbe', eyebrow: 'A procedure was recommended. What should I ask?', body: 'Understand the decision before you say yes.', art: '🔬' },
  { toolId: 'MarkupDetective', eyebrow: 'Is this price actually reasonable?', body: 'Look past the sticker and inspect the markup.', art: '🏷️' },
  { toolId: 'GhostWriter', eyebrow: 'I know what I mean. I can’t get the words right.', body: 'Turn the thought into something you can send.', art: '✍️' },
  { toolId: 'WaitingModeLiberator', eyebrow: 'I’m stuck waiting and can’t start anything.', body: 'Get some of your day back.', art: '⏳' },
  { toolId: 'NameStorm', eyebrow: 'I need a name that doesn’t sound generic.', body: 'Generate directions worth reacting to.', art: '✨' },
  { toolId: 'ChaosPilot', eyebrow: 'Everything feels urgent at once.', body: 'Sort the pile and find the next move.', art: '🧭' },
  { toolId: 'FinalWish', eyebrow: 'I need to say something that matters.', body: 'Find the words without making them sound borrowed.', art: '💌' },
  { toolId: 'FocusSoundArchitect', eyebrow: 'My surroundings are making it hard to work.', body: 'Build a background your attention can live with.', art: '🎧' },
];

const INITIAL = [0, 1, 2, 3, 4, 5];

function SituationCard({ item, tool, flipToken, reducedMotion }) {
  const [front, setFront] = useState({ item, tool });
  const [back, setBack] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const previousToken = useRef(flipToken);

  useEffect(() => {
    if (previousToken.current === flipToken) return;
    previousToken.current = flipToken;
    if (!item || !tool) return;
    if (reducedMotion) {
      setFront({ item, tool });
      setBack(null);
      setFlipped(false);
      return;
    }
    setBack({ item, tool });
    requestAnimationFrame(() => setFlipped(true));
    const t = window.setTimeout(() => {
      setFront({ item, tool });
      setBack(null);
      setFlipped(false);
    }, 650);
    return () => window.clearTimeout(t);
  }, [flipToken, item, tool, reducedMotion]);

  const face = (data, backFace = false) => {
    if (!data) return null;
    const { item: i, tool: t } = data;
    return (
      <Link
        to={`/${t.id}`}
        className="absolute inset-0 overflow-hidden rounded-2xl bg-white border shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          borderColor: BORDER,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: backFace ? 'rotateY(180deg)' : 'rotateY(0deg)',
          color: NAVY,
        }}
      >
        <div className="h-[104px] sm:h-[118px] flex items-center justify-center relative overflow-hidden"
             style={{ background: `linear-gradient(145deg, ${SAND2}, #e8eef4)` }}>
          <span aria-hidden="true" className="text-5xl sm:text-6xl" style={{ filter: 'saturate(.72)' }}>{i.art || t.icon}</span>
          <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-[.12em] px-2 py-1 rounded-full bg-white/80"
                style={{ color: NAVY2 }}>{t.title}</span>
        </div>
        <div className="p-4">
          <h3 className="font-extrabold leading-[1.15] text-[15px] sm:text-base">{i.eyebrow}</h3>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: WARM }}>{i.body}</p>
        </div>
      </Link>
    );
  };

  return (
    <div className="relative h-[244px] sm:h-[264px]" style={{ perspective: '1100px' }}>
      <div className="absolute inset-0 transition-transform duration-[650ms] ease-in-out"
           style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
        {face(front, false)}
        {face(back, true)}
      </div>
    </div>
  );
}

export default function HomeIntro({ allTools = [], onBrowse, setSearchTerm }) {
  const byId = useMemo(() => new Map(allTools.map(t => [t.id, t])), [allTools]);
  const available = useMemo(() => ROTATION.filter(x => byId.has(x.toolId)), [byId]);
  const [slots, setSlots] = useState(INITIAL.map((_, i) => i));
  const [tokens, setTokens] = useState([0, 0, 0, 0, 0, 0]);
  const [query, setQuery] = useState('');
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    const vis = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, []);

  useEffect(() => {
    if (paused || available.length <= 6) return;
    const delay = reducedMotion ? 9000 : 6200;
    const timer = window.setInterval(() => {
      setSlots(current => {
        const next = [...current];
        const slot = Math.floor(Math.random() * 6);
        const inUse = new Set(current);
        const candidates = available.map((_, i) => i).filter(i => !inUse.has(i));
        if (!candidates.length) return current;
        next[slot] = candidates[Math.floor(Math.random() * candidates.length)];
        setTokens(t => t.map((v, i) => i === slot ? v + 1 : v));
        return next;
      });
    }, delay);
    return () => window.clearInterval(timer);
  }, [available, paused, reducedMotion]);

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q && setSearchTerm) setSearchTerm(q);
  };

  return (
    <div className="w-full">
      {/* HERO */}
      <section className="grid lg:grid-cols-[1.02fr_.98fr] overflow-hidden rounded-[28px] border bg-white"
               style={{ borderColor: BORDER }}>
        <div className="px-6 py-9 sm:px-10 sm:py-12 lg:px-12 lg:py-16 flex flex-col justify-center">
          <h2 className="text-[42px] sm:text-[54px] lg:text-[62px] leading-[.98] tracking-[-.035em] font-bold max-w-[700px]"
              style={{ fontFamily: SERIF, color: '#202326' }}>
            Life doesn’t come with instructions.
          </h2>
          <p className="mt-5 text-lg sm:text-xl max-w-[540px] leading-relaxed" style={{ color: NAVY2 }}>
            DeftBrain helps when you don’t know what to do next.
          </p>
          <form onSubmit={submit} className="mt-7 flex flex-col sm:flex-row gap-2 max-w-[620px]">
            <label htmlFor="home-problem-search" className="sr-only">Describe what you’re dealing with</label>
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true">⌕</span>
              <input id="home-problem-search" value={query} onChange={e => setQuery(e.target.value)}
                     placeholder="Describe what you’re dealing with…"
                     className="w-full rounded-xl border bg-white pl-10 pr-4 py-3.5 text-sm outline-none focus:ring-2"
                     style={{ borderColor: BORDER, color: NAVY }} />
            </div>
            <button className="rounded-xl px-6 py-3.5 text-sm font-bold text-white" style={{ background: NAVY }}>
              Find a tool →
            </button>
          </form>
          <p className="mt-3 text-[12px] leading-relaxed" style={{ color: WARM }}>
            Try: lease agreement · doctor appointment · suspicious charge · difficult conversation
          </p>
          <button type="button" onClick={onBrowse} className="mt-6 self-start text-sm underline underline-offset-4 font-semibold"
                  style={{ color: NAVY }}>Browse all tools →</button>
        </div>

        {/* The hero visual is intentionally built from ordinary-life objects rather
            than generic AI imagery. It remains useful without an external image asset. */}
        <div className="relative min-h-[360px] lg:min-h-[520px] overflow-hidden"
             style={{ background: 'linear-gradient(145deg,#d9d2c5 0%,#efe9df 44%,#b9c3b5 100%)' }}>
          <div className="absolute inset-x-[10%] bottom-[-7%] h-[58%] rounded-[45%] rotate-[-5deg] shadow-2xl"
               style={{ background: '#9b7656' }} />
          <div className="absolute left-[10%] bottom-[17%] w-[42%] h-[39%] bg-white shadow-xl rotate-[-8deg] p-5">
            <p className="text-[11px] font-bold tracking-[.16em]" style={{ color: WARM }}>LEASE AGREEMENT</p>
            <div className="mt-5 h-2 w-[78%]" style={{ background: '#d9d9d9' }} />
            <div className="mt-2 h-2 w-[90%]" style={{ background: '#e5e5e5' }} />
            <div className="mt-2 h-2 w-[62%]" style={{ background: '#f3d37c' }} />
            <div className="mt-2 h-2 w-[84%]" style={{ background: '#e5e5e5' }} />
          </div>
          <div className="absolute left-[43%] bottom-[9%] w-[30%] h-[42%] bg-[#f7f1df] shadow-xl rotate-[4deg] p-4">
            <p className="font-semibold" style={{ fontFamily: SERIF, color: NAVY }}>Doctor visit</p>
            <p className="mt-3 text-xs leading-6" style={{ color: WARM }}>• Ask about side effects<br/>• Bring test results<br/>• What are my options?</p>
          </div>
          <div className="absolute right-[7%] bottom-[12%] w-[19%] h-[42%] rounded-[24px] bg-[#16191c] shadow-2xl border-[5px] border-[#333] p-3 rotate-[6deg]">
            <div className="mt-14 rounded-xl bg-[#30363b] text-white text-[11px] p-3">Can we talk?</div>
          </div>
          <div className="absolute right-[22%] top-[9%] w-[22%] aspect-square rounded-full shadow-lg flex items-center justify-center"
               style={{ background: '#eee4d6' }}><span className="text-4xl">☕</span></div>
          {[['Can my landlord do this?','left-[8%] top-[21%]'],['What should I ask my doctor?','right-[10%] top-[9%]'],['How do I say this?','right-[3%] top-[37%]']].map(([text,pos]) => (
            <div key={text} className={`absolute ${pos} bg-white rounded-2xl shadow-lg px-4 py-3 max-w-[155px] text-[13px] font-bold leading-tight`}
                 style={{ color: NAVY }}>{text}</div>
          ))}
        </div>
      </section>

      {/* ROTATING SITUATIONS */}
      <section className="py-12 sm:py-16" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
               onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: SERIF, color: NAVY }}>What’s going on?</h2>
            <p className="mt-2 text-sm sm:text-base" style={{ color: WARM }}>Start with what’s on your mind. DeftBrain will help you take the next step.</p>
          </div>
          <p className="text-[11px]" style={{ color: WARM }}>The doors change quietly to show more ways in.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {slots.map((idx, slot) => {
            const item = available[idx % Math.max(available.length, 1)];
            const tool = item ? byId.get(item.toolId) : null;
            if (!item || !tool) return <div key={slot} />;
            return <SituationCard key={slot} item={item} tool={tool} flipToken={tokens[slot]} reducedMotion={reducedMotion} />;
          })}
        </div>
      </section>

      {/* PRODUCT DEMONSTRATION */}
      <section className="rounded-[28px] border overflow-hidden grid lg:grid-cols-[.82fr_1.18fr]"
               style={{ borderColor: '#dce7ee', background: 'linear-gradient(110deg,#eef7fb,#f8fbfd)' }}>
        <div className="p-7 sm:p-10 lg:p-12 flex flex-col justify-center">
          <p className="text-[11px] uppercase tracking-[.16em] font-bold" style={{ color: NAVY2 }}>See it in action</p>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight" style={{ fontFamily: SERIF, color: NAVY }}>
            You tell DeftBrain what’s happening. You get something useful.
          </h2>
          <p className="mt-4 text-base" style={{ color: WARM }}>Clear steps. Better questions. A calmer next move.</p>
          <div className="mt-7 flex gap-4 items-center">
            <Link to="/DoctorVisitPrep" className="rounded-xl px-5 py-3 text-sm font-bold text-white" style={{ background: NAVY }}>Try a tool →</Link>
            <button type="button" onClick={onBrowse} className="text-sm underline underline-offset-4" style={{ color: NAVY }}>Explore more tools →</button>
          </div>
        </div>
        <div className="p-5 sm:p-8 lg:p-10">
          <div className="rounded-2xl border bg-white shadow-xl overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="h-8 border-b flex items-center gap-2 px-4" style={{ borderColor: BORDER }}>
              <span className="w-2.5 h-2.5 rounded-full bg-[#e9b7a7]"/><span className="w-2.5 h-2.5 rounded-full bg-[#ead49e]"/><span className="w-2.5 h-2.5 rounded-full bg-[#b7d3b9]"/>
            </div>
            <div className="p-5">
              <p className="font-extrabold" style={{ color: NAVY }}>🧠 DeftBrain</p>
              <h3 className="mt-2 text-lg font-extrabold" style={{ color: NAVY }}>Doctor Visit Prep</h3>
              <div className="mt-4 grid sm:grid-cols-2 gap-4 text-[12px]">
                <div className="rounded-xl p-4" style={{ background: '#f4f6f7' }}>
                  <p className="font-bold">1. Tell me what’s going on</p>
                  <div className="mt-3 rounded-lg border bg-white p-3 leading-relaxed" style={{ borderColor: BORDER, color: WARM }}>
                    I have a follow-up appointment about high blood pressure. I’m not sure what questions to ask.
                  </div>
                </div>
                <div className="rounded-xl p-4" style={{ background: '#f4f6f7' }}>
                  <p className="font-bold">2. Your personalized prep plan</p>
                  <p className="mt-3 font-bold">Key questions to ask</p>
                  <ul className="mt-2 space-y-2" style={{ color: WARM }}>
                    <li>○ Is my current medication working as expected?</li>
                    <li>○ Are there side effects I should watch for?</li>
                    <li>○ Do I need any additional tests?</li>
                    <li>○ What should I bring or track?</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: SERIF, color: NAVY }}>You don’t have to figure everything out alone.</h2>
        <p className="mt-2 text-sm" style={{ color: WARM }}>Practical guidance. Thoughtful questions. Better decisions.</p>
      </section>
    </div>
  );
}
