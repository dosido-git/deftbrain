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
      <div className="h-[78px] overflow-hidden bg-[#eee8df]"><img src={`/home-scenes/${item.toolId}.svg`} alt="" className="w-full h-full object-cover" loading="lazy" /></div>
      <div className="px-3.5 py-3">
        <div className="text-[8px] uppercase tracking-[.13em] font-bold text-slate-500 truncate">{tool.title}</div>
        <h3 className="mt-1.5 text-[13px] font-extrabold leading-[1.18]" style={{color:NAVY}}>{item.problem}</h3>
        <p className="mt-1.5 text-[10.5px] leading-[1.4]" style={{color:MUTED}}>{item.body}</p>
      </div>
    </Link>;
  };

  return <div className="relative h-[184px]" style={{perspective:'1400px'}}><div className="absolute inset-0" style={{transformStyle:'preserve-3d',transition:reducedMotion?'none':'transform 2325ms cubic-bezier(.22,.61,.28,1)',transform:`rotateY(${side*180}deg)`}}>{face(faces[0],0)}{face(faces[1],1)}</div></div>;
}

function PopularCard({ tool }) {
  if (!tool) return null;
  return <Link to={`/${tool.id}`} className="group rounded-xl border bg-white hover:shadow-md transition-shadow p-3.5" style={{borderColor:BORDER}}>
    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[18px]" style={{background: tool.headerColor ? `${tool.headerColor}22` : '#eef3f6'}}>{tool.icon || '✨'}</div>
    <div className="mt-2 font-extrabold text-[12px]" style={{color:NAVY}}>{tool.title}</div>
    <div className="mt-1 text-[9.5px] leading-snug line-clamp-2" style={{color:MUTED}}>{tool.tagline || tool.description}</div>
  </Link>;
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

  return <div className="w-full">
    <section className="grid lg:grid-cols-[.92fr_1.08fr] rounded-2xl overflow-hidden border bg-white" style={{borderColor:BORDER}}>
      <div className="px-6 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8 flex flex-col justify-center">
        <h2 className="text-[30px] sm:text-[34px] lg:text-[38px] leading-[.98] tracking-[-.035em] font-bold max-w-[560px]" style={{fontFamily:SERIF,color:INK}}>Life doesn’t come with instructions.</h2>
        <p className="mt-3 text-[15px] sm:text-base max-w-[470px]" style={{color:NAVY}}>DeftBrain helps when you don’t know what to do next.</p>
        <form onSubmit={submit} className="mt-5 flex gap-2 max-w-[520px]"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Describe what you’re dealing with…" className="min-w-0 flex-1 rounded-lg border px-3.5 py-2.5 text-[12px] outline-none focus:ring-2" style={{borderColor:BORDER}}/><button className="rounded-lg px-4 py-2.5 text-[11px] font-bold text-white whitespace-nowrap" style={{background:NAVY}}>Find a tool →</button></form>
        <p className="mt-2 text-[9.5px]" style={{color:MUTED}}>Try: lease agreement · doctor appointment · suspicious charge · difficult conversation</p>
        <button type="button" onClick={onBrowse} className="mt-4 self-start text-[11px] font-semibold underline underline-offset-4" style={{color:NAVY}}>Browse all tools →</button>
      </div>
      <div className="relative min-h-[245px] lg:min-h-[285px] overflow-hidden bg-[#eee8df]"><img src="/home-scenes/hero-everyday.svg" alt="A lease, doctor-visit notes, and a difficult text conversation — examples of everyday situations DeftBrain can help with" className="absolute inset-0 w-full h-full object-cover" /></div>
    </section>

    <section className="py-7 sm:py-8" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)}>
      <div className="flex items-end justify-between gap-4 mb-5"><div><h2 className="text-[23px] sm:text-[26px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>What’s going on?</h2><p className="mt-1 text-[11px] sm:text-[12px]" style={{color:MUTED}}>Start with what’s on your mind. DeftBrain will help you take the next step.</p></div><p className="hidden sm:block text-[9px] max-w-[170px]" style={{color:MUTED}}>The doors change quietly to show more ways in.</p></div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">{slots.map((idx,slot)=>{const current=available[idx%Math.max(available.length,1)];return <DoorCard key={slot} initial={current} incoming={incoming[slot]} toolFor={toolFor} flipToken={tokens[slot]} reducedMotion={reducedMotion}/>;})}</div>
    </section>

    <section className="my-8 rounded-2xl border overflow-hidden grid lg:grid-cols-[.78fr_1.22fr]" style={{borderColor:'#dce7ee',background:'linear-gradient(110deg,#eef7fb,#f8fbfd)'}}><div className="p-6 sm:p-8 flex flex-col justify-center"><div className="text-[8px] uppercase tracking-[.16em] font-bold" style={{color:NAVY}}>See it in action</div><h2 className="mt-2 text-[25px] sm:text-[29px] font-bold leading-[1.05]" style={{fontFamily:SERIF,color:NAVY}}>You tell DeftBrain what’s happening. You get something useful.</h2><p className="mt-2 text-[11px]" style={{color:MUTED}}>Clear steps. Better questions. A calmer next move.</p><div className="mt-4 flex gap-4"><Link to="/DoctorVisitPrep" className="rounded-lg px-4 py-2 text-[10px] font-bold text-white" style={{background:NAVY}}>Try a tool →</Link><button onClick={onBrowse} className="text-[10px] underline underline-offset-4" style={{color:NAVY}}>Explore more →</button></div></div><div className="p-5"><div className="rounded-xl border bg-white shadow-md p-4" style={{borderColor:BORDER}}><div className="text-[10px] font-extrabold" style={{color:NAVY}}>Doctor Visit Prep</div><div className="mt-3 grid grid-cols-2 gap-3 text-[9px]"><div className="rounded-lg p-3 bg-slate-50"><b>1. Tell me what’s going on</b><div className="mt-2 rounded bg-white p-2 text-slate-600">I have a follow-up appointment and I’m not sure what questions to ask.</div></div><div className="rounded-lg p-3 bg-slate-50"><b>2. Your prep plan</b><div className="mt-2 text-slate-600 leading-4">○ What should I ask?<br/>○ What should I bring?<br/>○ What should I track?</div></div></div></div></div></section>

    <section className="py-7 border-t" style={{borderColor:BORDER}}><div className="flex items-end justify-between mb-4"><div><div className="text-[8px] uppercase tracking-[.16em] font-bold text-slate-500">Popular tools</div><h2 className="mt-1 text-[24px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>Good places to start.</h2></div><button onClick={onBrowse} className="text-[10px] font-semibold underline underline-offset-4" style={{color:NAVY}}>See all tools →</button></div><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">{POPULAR.map(id=><PopularCard key={id} tool={byId.get(id)}/>)}</div></section>

    <section className="py-7"><div className="rounded-2xl border overflow-hidden" style={{borderColor:BORDER,background:'#fffaf2'}}><div className="grid lg:grid-cols-[.62fr_1.38fr]"><div className="p-6 sm:p-7"><div className="text-[8px] uppercase tracking-[.16em] font-bold text-slate-500">More than one kind of problem</div><h2 className="mt-2 text-[25px] font-bold leading-tight" style={{fontFamily:SERIF,color:NAVY}}>There’s probably a DeftBrain for that.</h2><p className="mt-2 text-[10.5px] leading-relaxed" style={{color:MUTED}}>Life rarely arrives sorted into categories. Neither does DeftBrain.</p><button onClick={onBrowse} className="mt-4 text-[10px] font-bold underline underline-offset-4" style={{color:NAVY}}>Browse all tools →</button></div><div className="relative min-h-[205px] px-5 py-6 flex flex-wrap content-center justify-center gap-x-4 gap-y-2 bg-white/30">{['weird lease','doctor visit','bad bill','awkward talk','forgotten word','suspicious review','security deposit','presentation','paperwork','focus','layover','apology','big decision','purchase','meeting','travel','name something','say it better','roommate trouble','scam?','hard email','career change','what did they mean?','prep for a procedure','fake reviews','make a toast','lost the day','need a gift','explain this','plan went sideways','what should I ask?','before I sign','too much to do','find the right words','price feels wrong','difficult customer','can’t get started','remember this','prepare for move-out','stress-test an idea','understand research','what happens next?','need a comeback','before the meeting','something feels off'].map((x,i)=>{const colors=['#c94f45','#1f6f78','#d28a2e','#6c5aa8','#3f7b4d','#b14f78','#2e5f9e'];const deg=[-5,3,-2,5,-4,2,4][i%7];return <span key={x} className="inline-block font-bold whitespace-nowrap" style={{fontFamily:i%4===0?SERIF:'inherit',fontSize:`${9+(i%5)*0.8}px`,color:colors[i%colors.length],transform:`rotate(${deg}deg)`,opacity:.88}}>{x}</span>})}</div></div></div></section>

    <section className="py-8 text-center"><h2 className="text-[22px] sm:text-[25px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>You don’t have to figure everything out alone.</h2><p className="mt-1.5 text-[10.5px]" style={{color:MUTED}}>Practical guidance. Thoughtful questions. Better decisions.</p></section>
  </div>;
}
