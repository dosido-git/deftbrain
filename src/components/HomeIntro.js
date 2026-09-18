import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const NAVY = '#142a43';
const INK = '#202326';
const MUTED = '#655f56';
const BORDER = '#e4ddd2';
const SERIF = "'Playfair Display', Georgia, serif";

const ROTATION = [
  { toolId:'LeaseTrapDetector', problem:'Something in my lease looks wrong.', body:'Find the clause. Understand the risk. Know what to ask.' },
  { toolId:'DoctorVisitPrep', problem:'I have a doctor appointment coming up.', body:'Walk in knowing what matters.' },
  { toolId:'DifficultTalkCoach', problem:'I need to have a difficult conversation.', body:'Think it through before you say it.' },
  { toolId:'BillRescue', problem:'This bill doesn’t look right.', body:'Figure out what to question and what to do next.' },
  { toolId:'FakeReviewDetective', problem:'Can I trust these reviews?', body:'Look for the patterns that don’t add up.' },
  { toolId:'TipOfTongue', problem:'I know it. I just can’t remember it.', body:'Work backward from the clues you still have.' },
  { toolId:'ComplaintEscalationWriter', problem:'They’re not listening to my complaint.', body:'Make the next message harder to ignore.' },
  { toolId:'PlainTalk', problem:'I don’t understand this document.', body:'Turn dense language into something usable.' },
  { toolId:'LayoverMaximizer', problem:'I have hours between flights.', body:'Find out what you can realistically do.' },
  { toolId:'RentersDepositSaver', problem:'I want my security deposit back.', body:'Prepare before move-out, not after the dispute.' },
  { toolId:'ProcedureProbe', problem:'A procedure was recommended. What should I ask?', body:'Understand the decision before you say yes.' },
  { toolId:'MarkupDetective', problem:'Is this price actually reasonable?', body:'Look past the sticker and inspect the markup.' },
  { toolId:'GhostWriter', problem:'I know what I mean. I can’t get the words right.', body:'Turn the thought into something you can send.' },
  { toolId:'WaitingModeLiberator', problem:'I’m stuck waiting and can’t start anything.', body:'Get some of your day back.' },
  { toolId:'NameStorm', problem:'I need a name that doesn’t sound generic.', body:'Generate directions worth reacting to.' },
  { toolId:'ChaosPilot', problem:'Everything feels urgent at once.', body:'Sort the pile and find the next move.' },
  { toolId:'FinalWish', problem:'I need to say something that matters.', body:'Find the words without making them sound borrowed.' },
  { toolId:'FocusSoundArchitect', problem:'My surroundings are making it hard to work.', body:'Build a background your attention can live with.' },
];

const POPULAR = ['LeaseTrapDetector','DoctorVisitPrep','DifficultTalkCoach','FakeReviewDetective','BillRescue','TipOfTongue'];

const SCRAMBLE_COLORS = ['#c94f45','#1f6f78','#d28a2e','#6c5aa8','#3f7b4d','#b14f78','#2e5f9e','#e36d32'];
const SCRAMBLE_ROTATE = [-6,-3,-1.5,1.5,3,6];
const SCRAMBLE_SCALE = [.94,.98,1.02,1.06];

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

function DoorCard({ initial, incoming, toolFor, flipToken, reducedMotion }) {
  const [faces, setFaces] = useState([initial, incoming || initial]);
  const [side, setSide] = useState(0);
  const lastToken = useRef(flipToken);

  useEffect(() => {
    if (lastToken.current === flipToken) return;
    lastToken.current = flipToken;
    if (!incoming) return;
    if (reducedMotion) { setFaces([incoming, incoming]); return; }
    const hidden = side === 0 ? 1 : 0;
    setFaces(f => f.map((v,i) => i === hidden ? incoming : v));
    requestAnimationFrame(() => requestAnimationFrame(() => setSide(hidden)));
  }, [flipToken, incoming, reducedMotion, side]);

  const face = (item, index) => {
    const tool = item && toolFor(item.toolId);
    if (!item || !tool) return null;
    return <Link to={`/${tool.id}`} className="absolute inset-0 rounded-xl overflow-hidden bg-white border shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2" style={{borderColor:BORDER,backfaceVisibility:'hidden',WebkitBackfaceVisibility:'hidden',transform:index===1?'rotateY(180deg)':'rotateY(0deg)'}}>
      <div className="aspect-[9/8] overflow-hidden bg-[#eee8df]"><img src={`/home-scenes/${item.toolId}.jpg`} alt="" className="w-full h-full object-cover" loading="lazy" /></div>
      <div className="px-3.5 py-3">
        <h3 className="text-[13px] font-extrabold leading-[1.18]" style={{color:NAVY}}>{item.problem}</h3>
        <p className="mt-1.5 text-[10.5px] leading-[1.4]" style={{color:MUTED}}>{item.body}</p>
      </div>
    </Link>;
  };

  return <div className="relative h-[295px] md:h-[332px] lg:h-[253px]" style={{perspective:'1400px'}}><div className="absolute inset-0" style={{transformStyle:'preserve-3d',transition:reducedMotion?'none':'transform 2325ms cubic-bezier(.22,.61,.28,1)',transform:`rotateY(${side*180}deg)`}}>{face(faces[0],0)}{face(faces[1],1)}</div></div>;
}

function PopularCard({ tool }) {
  if (!tool) return null;
  return <Link to={`/${tool.id}`} className="rounded-xl overflow-hidden bg-white border shadow-sm hover:shadow-md transition-shadow" style={{borderColor:BORDER}}>
    <div className="h-[78px] overflow-hidden bg-[#eee8df]"><img src={`/home-scenes/${tool.id}.jpg`} alt="" className="w-full h-full object-cover" loading="lazy" /></div>
    <div className="px-3.5 py-3">
      <div className="font-extrabold text-[12px]" style={{color:NAVY}}>{tool.title}</div>
      <p className="mt-1 text-[9.5px] leading-snug line-clamp-2" style={{color:MUTED}}>{tool.tagline || tool.description}</p>
    </div>
  </Link>;
}

function ToolScramble({ allTools, onBrowse }) {
  const eligible = useMemo(() => allTools.filter(t => t?.id && t?.title && t?.tagline), [allTools]);
  const [seed, setSeed] = useState(0);
  const shown = useMemo(() => seededShuffle(eligible, seed).slice(0, 42), [eligible, seed]);

  if (eligible.length === 0) return null;

  return (
    <section className="my-7 rounded-2xl border overflow-hidden" style={{borderColor:BORDER,background:'linear-gradient(120deg,#dff4ff 0%,#eee9ff 35%,#fff2df 68%,#ffe5ee 100%)'}}>
      <div className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <div className="text-[8px] uppercase tracking-[.16em] font-bold text-slate-600">Explore without an agenda</div>
            <h2 className="mt-1 text-[24px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>The Tool Scramble</h2>
            <p className="mt-1 text-[11px] max-w-md" style={{color:MUTED}}>Icons and taglines from real DeftBrain tools. Hover to see the name — click to give it a try.</p>
          </div>
          <button type="button" onClick={()=>setSeed(s=>s+1)} className="rounded-lg px-3.5 py-2 text-[10px] font-bold text-white whitespace-nowrap" style={{background:NAVY}}>↻ Scramble again</button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-4 py-5">
          {shown.map((t,i) => (
            <Link key={t.id} to={`/${t.id}`} className="group flex items-center gap-2 max-w-[210px]" style={{transform:`rotate(${SCRAMBLE_ROTATE[i%SCRAMBLE_ROTATE.length]}deg) scale(${SCRAMBLE_SCALE[i%SCRAMBLE_SCALE.length]})`}}>
              <span className="text-[20px] flex-shrink-0" aria-hidden="true">{t.icon || '✦'}</span>
              <span>
                <b className="block text-[11px] leading-tight" style={{color:SCRAMBLE_COLORS[i%SCRAMBLE_COLORS.length]}}>{t.tagline}</b>
                <em className="block not-italic text-[9px] mt-0.5 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity" style={{color:NAVY}}>{t.title} →</em>
              </span>
            </Link>
          ))}
        </div>
        <button type="button" onClick={onBrowse} className="text-[10px] font-bold underline underline-offset-4" style={{color:NAVY}}>Browse all tools →</button>
      </div>
    </section>
  );
}

export default function HomeIntro({ allTools=[], onBrowse, setSearchTerm }) {
  const byId = useMemo(() => new Map(allTools.map(t => [t.id,t])), [allTools]);
  const available = useMemo(() => ROTATION.filter(x => byId.has(x.toolId)), [byId]);
  const [slots,setSlots] = useState(() => Array.from({length:6},(_,i)=>i));
  const [incoming,setIncoming] = useState(() => Array(6).fill(null));
  const [tokens,setTokens] = useState(() => Array(6).fill(0));
  const [query,setQuery] = useState('');
  const [paused,setPaused] = useState(false);
  const [reducedMotion,setReducedMotion] = useState(false);
  const [page,setPage] = useState(0);
  const PAGE_SIZE = 6;
  const totalPages = Math.max(1, Math.ceil(available.length / PAGE_SIZE));

  useEffect(()=>{ const mq=window.matchMedia('(prefers-reduced-motion: reduce)'); const sync=()=>setReducedMotion(mq.matches); sync(); mq.addEventListener?.('change',sync); return()=>mq.removeEventListener?.('change',sync); },[]);
  useEffect(()=>{ const vis=()=>setPaused(document.hidden); document.addEventListener('visibilitychange',vis); return()=>document.removeEventListener('visibilitychange',vis); },[]);
  useEffect(()=>{
    if(paused || available.length<=6) return;
    const timer=window.setInterval(()=>{
      const slot=Math.floor(Math.random()*6);
      setSlots(current=>{
        const used=new Set(current); const candidates=available.map((_,i)=>i).filter(i=>!used.has(i)); if(!candidates.length)return current;
        const nextIndex=candidates[Math.floor(Math.random()*candidates.length)];
        setIncoming(v=>v.map((x,i)=>i===slot?available[nextIndex]:x));
        setTokens(v=>v.map((x,i)=>i===slot?x+1:x));
        window.setTimeout(()=>setSlots(v=>v.map((x,i)=>i===slot?nextIndex:x)), reducedMotion?0:2425);
        return current;
      });
    }, 9000);
    return()=>window.clearInterval(timer);
  },[available,paused,reducedMotion]);

  const submit=e=>{e.preventDefault(); const q=query.trim(); if(q&&setSearchTerm)setSearchTerm(q);};
  const toolFor=id=>byId.get(id);

  // Manual carousel paging: turns all 6 doors to the next/previous set of six
  // at once, reusing the same flip transition the quiet auto-rotation uses.
  const goToPage=(n)=>{
    if(available.length===0) return;
    const wrapped=((n%totalPages)+totalPages)%totalPages;
    setPage(wrapped);
    const start=wrapped*PAGE_SIZE;
    const next=Array.from({length:PAGE_SIZE},(_,i)=>available[(start+i)%available.length]);
    setIncoming(next);
    setTokens(v=>v.map(x=>x+1));
    window.setTimeout(()=>setSlots(Array.from({length:PAGE_SIZE},(_,i)=>(start+i)%available.length)), reducedMotion?0:2425);
  };

  return <div className="w-full">
    <section className="grid lg:grid-cols-[.92fr_1.08fr] rounded-2xl overflow-hidden border bg-white" style={{borderColor:BORDER}}>
      <div className="px-6 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8 flex flex-col justify-center">
        <h2 className="text-[30px] sm:text-[34px] lg:text-[38px] leading-[.98] tracking-[-.035em] font-bold max-w-[560px]" style={{fontFamily:SERIF,color:INK}}>Life doesn’t come with instructions.</h2>
        <p className="mt-3 text-[15px] sm:text-base max-w-[470px]" style={{color:NAVY}}>DeftBrain helps when you don’t know what to do next.</p>
        <form onSubmit={submit} className="mt-5 flex gap-2 max-w-[520px]"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Describe what you’re dealing with…" className="min-w-0 flex-1 rounded-lg border px-3.5 py-2.5 text-[12px] outline-none focus:ring-2" style={{borderColor:BORDER}}/><button className="rounded-lg px-4 py-2.5 text-[11px] font-bold text-white whitespace-nowrap" style={{background:NAVY}}>Find a tool →</button></form>
        <p className="mt-2 text-[9.5px]" style={{color:MUTED}}>Try: lease agreement · doctor appointment · suspicious charge · difficult conversation</p>
        <button type="button" onClick={onBrowse} className="mt-4 self-start text-[11px] font-semibold underline underline-offset-4" style={{color:NAVY}}>Browse all tools →</button>
      </div>
      <div className="relative min-h-[245px] lg:min-h-[285px] overflow-hidden bg-[#eee8df]"><img src="/home-scenes/hero-everyday.jpg" alt="A lease, doctor-visit notes, and a difficult text conversation — examples of everyday situations DeftBrain can help with" className="absolute inset-0 w-full h-full object-cover" /></div>
    </section>

    <section className="py-7 sm:py-8" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)}>
      <div className="flex items-end justify-between gap-4 mb-5"><div><h2 className="text-[23px] sm:text-[26px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>What’s going on?</h2><p className="mt-1 text-[11px] sm:text-[12px]" style={{color:MUTED}}>Start with what’s on your mind. DeftBrain will help you take the next step.</p></div><p className="hidden sm:block text-[9px] max-w-[170px]" style={{color:MUTED}}>The doors change quietly to show more ways in.</p></div>
      <div className="relative">
        {totalPages>1 && <button type="button" onClick={()=>goToPage(page-1)} aria-label="Previous tools" className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border shadow-sm items-center justify-center text-[15px] hover:shadow-md" style={{borderColor:BORDER,color:NAVY}}>‹</button>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">{slots.map((idx,slot)=>{const current=available[idx%Math.max(available.length,1)];return <DoorCard key={slot} initial={current} incoming={incoming[slot]} toolFor={toolFor} flipToken={tokens[slot]} reducedMotion={reducedMotion}/>;})}</div>
        {totalPages>1 && <button type="button" onClick={()=>goToPage(page+1)} aria-label="More tools" className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border shadow-sm items-center justify-center text-[15px] hover:shadow-md" style={{borderColor:BORDER,color:NAVY}}>›</button>}
      </div>
      {totalPages>1 && <div className="flex justify-center gap-1.5 mt-5">{Array.from({length:totalPages}).map((_,i)=><button key={i} type="button" onClick={()=>goToPage(i)} aria-label={`Go to tools page ${i+1}`} className="rounded-full transition-all duration-300" style={{width:i===page?16:6,height:6,background:i===page?NAVY:'#ddd4c6'}}/>)}</div>}
    </section>

    <section className="my-8 rounded-2xl border overflow-hidden grid lg:grid-cols-[.78fr_1.22fr]" style={{borderColor:'#dce7ee'}}>
        <div className="relative p-6 sm:p-8 flex flex-col justify-center overflow-hidden" style={{background:'linear-gradient(110deg,#eef7fb,#f8fbfd)'}}>
          {/* A soft, blurred, low-opacity crop of the SAME photo's empty
              left/background area sits behind the copy — continuous with
              the crisp tablet photo in the other column, so the text reads
              as overlaid on one scene rather than boxed separately next to
              it. Kept well under the tablet's own opacity/sharpness so it
              never competes with the copy or looks like a masked-out UI. */}
          <img src="/home-scenes/see-it-in-action.jpg" alt="" aria-hidden="true" className="hidden lg:block absolute inset-0 w-full h-full object-cover" style={{objectPosition:'left center',opacity:.16,filter:'blur(20px) saturate(1.2)',transform:'scale(1.2)'}} />
          <div className="relative">
            <h2 className="text-[25px] sm:text-[29px] font-bold leading-[1.05]" style={{fontFamily:SERIF,color:NAVY}}>See it in action</h2>
            <p className="mt-3 text-[12.5px] leading-snug" style={{color:MUTED}}>You tell DeftBrain what’s happening. You get something useful.</p>
            <p className="mt-2 text-[12.5px]" style={{color:MUTED}}><b style={{color:NAVY}}>Clear steps.</b> Better questions. A calmer next move.</p>
            <div className="mt-4 flex gap-4"><Link to="/DoctorVisitPrep" className="rounded-lg px-4 py-2 text-[10px] font-bold text-white" style={{background:NAVY}}>Try a tool →</Link><button onClick={onBrowse} className="text-[10px] font-bold" style={{color:NAVY}}>Explore more tools →</button></div>
          </div>
        </div>
        <div className="relative min-h-[260px] lg:min-h-[300px] overflow-hidden bg-[#eee8df]"><img src="/home-scenes/see-it-in-action.jpg" alt="A tablet showing the DeftBrain chat interface with a doctor-visit prep plan, next to a sticky note reading More prepared. A calmer conversation." className="absolute inset-0 w-full h-full object-cover" loading="lazy" /></div>
    </section>

    <section className="my-7 rounded-2xl border overflow-hidden" style={{borderColor:BORDER,background:'linear-gradient(105deg,#fff0cf 0%,#f8ddd7 35%,#e9e1f5 68%,#d7ebf7 100%)'}}><div className="p-5 sm:p-6"><div className="flex items-end justify-between gap-4 mb-4"><div><h2 className="text-[24px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>Some of our most popular tools</h2><p className="mt-1 text-[11px]" style={{color:MUTED}}>Real situations. Real guidance. A better next step.</p></div><button onClick={onBrowse} className="text-[10px] font-semibold underline underline-offset-4 whitespace-nowrap" style={{color:NAVY}}>Browse all tools →</button></div><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">{POPULAR.map(id=><PopularCard key={id} tool={byId.get(id)}/>)}</div></div></section>

    <ToolScramble allTools={allTools} onBrowse={onBrowse} />

    <section className="py-7"><div className="rounded-2xl border overflow-hidden" style={{borderColor:BORDER,background:'linear-gradient(120deg,#ffe9d6 0%,#fdf3ea 30%,#fbf7f1 60%,#fffaf2 100%)'}}><div className="grid lg:grid-cols-[.62fr_1.38fr]"><div className="p-6 sm:p-7"><div className="text-[8px] uppercase tracking-[.16em] font-bold text-slate-500">More than one kind of problem</div><h2 className="mt-2 text-[25px] font-bold leading-tight" style={{fontFamily:SERIF,color:NAVY}}>There’s probably a DeftBrain for that.</h2><p className="mt-2 text-[10.5px] leading-relaxed" style={{color:MUTED}}>Life rarely arrives sorted into categories. Neither does DeftBrain.</p><button onClick={onBrowse} className="mt-4 text-[10px] font-bold underline underline-offset-4" style={{color:NAVY}}>Browse all tools →</button></div><div className="relative min-h-[205px] px-5 py-6 flex flex-wrap content-center justify-center gap-x-4 gap-y-2 bg-white/30">{['weird lease','doctor visit','bad bill','awkward talk','forgotten word','suspicious review','security deposit','presentation','paperwork','focus','layover','apology','big decision','purchase','meeting','travel','name something','say it better','roommate trouble','scam?','hard email','career change','what did they mean?','prep for a procedure','fake reviews','make a toast','lost the day','need a gift','explain this','plan went sideways','what should I ask?','before I sign','too much to do','find the right words','price feels wrong','difficult customer','can’t get started','remember this','prepare for move-out','stress-test an idea','understand research','what happens next?','need a comeback','before the meeting','something feels off'].map((x,i)=>{const colors=['#c94f45','#1f6f78','#d28a2e','#6c5aa8','#3f7b4d','#b14f78','#2e5f9e'];const deg=[-5,3,-2,5,-4,2,4][i%7];return <span key={x} className="inline-block font-bold whitespace-nowrap" style={{fontFamily:i%4===0?SERIF:'inherit',fontSize:`${9+(i%5)*0.8}px`,color:colors[i%colors.length],transform:`rotate(${deg}deg)`,opacity:.88}}>{x}</span>})}</div></div></div></section>

    <section className="py-8 text-center"><h2 className="text-[22px] sm:text-[25px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>You don’t have to figure everything out alone.</h2><p className="mt-1.5 text-[10.5px]" style={{color:MUTED}}>Practical guidance. Thoughtful questions. Better decisions.</p></section>
  </div>;
}
