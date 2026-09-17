import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const NAVY = '#142a43';
const INK = '#202326';
const MUTED = '#655f56';
const SAND2 = '#f2eee7';
const BORDER = '#e4ddd2';
const SERIF = "'Playfair Display', Georgia, serif";

const ROTATION = [
  { toolId:'LeaseTrapDetector', problem:'Something in my lease looks wrong.', body:'Find the clause. Understand the risk. Know what to ask.', scene:'lease' },
  { toolId:'DoctorVisitPrep', problem:'I have a doctor appointment coming up.', body:'Walk in knowing what matters.', scene:'doctor' },
  { toolId:'DifficultTalkCoach', problem:'I need to have a difficult conversation.', body:'Think it through before you say it.', scene:'talk' },
  { toolId:'BillRescue', problem:'This bill doesn’t look right.', body:'Figure out what to question and what to do next.', scene:'bill' },
  { toolId:'FakeReviewDetective', problem:'Can I trust these reviews?', body:'Look for the patterns that don’t add up.', scene:'reviews' },
  { toolId:'TipOfTongue', problem:'I know it. I just can’t remember it.', body:'Work backward from the clues you still have.', scene:'memory' },
  { toolId:'ComplaintEscalationWriter', problem:'They’re not listening to my complaint.', body:'Make the next message harder to ignore.', scene:'complaint' },
  { toolId:'PlainTalk', problem:'I don’t understand this document.', body:'Turn dense language into something usable.', scene:'document' },
  { toolId:'LayoverMaximizer', problem:'I have hours between flights.', body:'Find out what you can realistically do.', scene:'travel' },
  { toolId:'RentersDepositSaver', problem:'I want my security deposit back.', body:'Prepare before move-out, not after the dispute.', scene:'keys' },
  { toolId:'ProcedureProbe', problem:'A procedure was recommended. What should I ask?', body:'Understand the decision before you say yes.', scene:'medical' },
  { toolId:'MarkupDetective', problem:'Is this price actually reasonable?', body:'Look past the sticker and inspect the markup.', scene:'price' },
  { toolId:'GhostWriter', problem:'I know what I mean. I can’t get the words right.', body:'Turn the thought into something you can send.', scene:'writing' },
  { toolId:'WaitingModeLiberator', problem:'I’m stuck waiting and can’t start anything.', body:'Get some of your day back.', scene:'clock' },
  { toolId:'NameStorm', problem:'I need a name that doesn’t sound generic.', body:'Generate directions worth reacting to.', scene:'notes' },
  { toolId:'ChaosPilot', problem:'Everything feels urgent at once.', body:'Sort the pile and find the next move.', scene:'desk' },
  { toolId:'FinalWish', problem:'I need to say something that matters.', body:'Find the words without making them sound borrowed.', scene:'letter' },
  { toolId:'FocusSoundArchitect', problem:'My surroundings are making it hard to work.', body:'Build a background your attention can live with.', scene:'headphones' },
];

const POPULAR = ['LeaseTrapDetector','DoctorVisitPrep','DifficultTalkCoach','FakeReviewDetective','BillRescue','TipOfTongue'];

function Scene({ type }) {
  const common = 'absolute shadow-sm border';
  const paper = { background:'#fffdf9', borderColor:'#ded7cb' };
  if (type === 'doctor' || type === 'medical') return <div className="relative h-full overflow-hidden bg-[#dce6e3]">
    <div className={`${common} left-[16%] top-[16%] w-[56%] h-[68%] rotate-[-4deg] rounded-sm p-3`} style={paper}><div className="text-[9px] font-bold tracking-widest text-slate-500">APPOINTMENT</div><div className="mt-3 h-1.5 bg-slate-200 w-4/5"/><div className="mt-2 h-1.5 bg-slate-200"/><div className="mt-2 h-1.5 bg-amber-200 w-3/5"/></div><div className="absolute right-[10%] bottom-[10%] w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center"><div className="w-6 h-6 rounded-full border-[5px] border-slate-500"/></div>
  </div>;
  if (type === 'talk' || type === 'complaint') return <div className="relative h-full overflow-hidden bg-[#e8dfd7]"><div className="absolute left-[12%] top-[17%] w-[38%] rounded-xl bg-white p-3 shadow-md text-[10px] text-slate-600">Can we talk?</div><div className="absolute right-[10%] bottom-[18%] w-[46%] rounded-xl bg-[#24394d] p-3 shadow-md text-[10px] text-white">I want to explain this clearly.</div><div className="absolute left-[22%] bottom-[8%] w-16 h-7 rounded-full bg-[#b99573] opacity-60"/></div>;
  if (type === 'reviews' || type === 'price') return <div className="relative h-full overflow-hidden bg-[#e7e3dc]"><div className={`${common} left-[14%] top-[16%] w-[58%] h-[64%] rotate-[-5deg] rounded-md p-3`} style={paper}><div className="text-[10px] font-bold">Customer reviews</div><div className="mt-2 text-amber-500 text-xs">★★★★★</div><div className="mt-2 h-1.5 bg-slate-200"/><div className="mt-2 h-1.5 bg-slate-200 w-4/5"/></div><div className="absolute right-[12%] top-[27%] rounded-full bg-[#b85c4b] text-white text-[10px] font-bold px-3 py-2 shadow-md">$?</div></div>;
  if (type === 'memory' || type === 'notes' || type === 'writing' || type === 'letter') return <div className="relative h-full overflow-hidden bg-[#ded7c8]"><div className={`${common} left-[18%] top-[13%] w-[55%] h-[70%] rotate-[3deg] rounded-sm p-3`} style={{...paper,background:'#fff4b8'}}><div className="font-serif text-sm text-slate-700">It was something like…</div><div className="mt-4 h-1 bg-slate-400/40"/><div className="mt-3 h-1 bg-slate-400/40 w-4/5"/></div><div className="absolute right-[10%] bottom-[14%] w-20 h-2 bg-[#31485d] rotate-[-35deg] rounded-full shadow"/></div>;
  if (type === 'travel' || type === 'keys') return <div className="relative h-full overflow-hidden bg-[#d9e1dc]"><div className={`${common} left-[10%] top-[18%] w-[62%] h-[55%] rotate-[-4deg] rounded-sm p-3`} style={paper}><div className="text-[9px] tracking-widest font-bold text-slate-500">BOARDING / MOVE</div><div className="mt-3 h-2 bg-slate-200"/><div className="mt-2 h-2 bg-slate-200 w-2/3"/></div><div className="absolute right-[13%] bottom-[14%] w-10 h-10 rounded-full border-4 border-[#a98652] shadow-sm"/><div className="absolute right-[7%] bottom-[22%] w-12 h-1.5 bg-[#a98652] rotate-[-25deg]"/></div>;
  if (type === 'clock' || type === 'headphones') return <div className="relative h-full overflow-hidden bg-[#d9dfe3]"><div className="absolute left-[18%] top-[18%] w-20 h-20 rounded-full bg-white shadow-md border border-slate-200"><div className="absolute left-1/2 top-1/2 w-1 h-6 bg-slate-600 origin-bottom -translate-x-1/2 -translate-y-full rotate-[35deg]"/><div className="absolute left-1/2 top-1/2 w-5 h-1 bg-slate-600 origin-left"/></div><div className="absolute right-[12%] bottom-[12%] w-20 h-12 rounded-[50%] border-[7px] border-[#34495e] border-b-transparent"/></div>;
  if (type === 'desk') return <div className="relative h-full overflow-hidden bg-[#c8b39b]"><div className="absolute left-[10%] top-[14%] w-24 h-16 bg-[#fff4b8] rotate-[-6deg] shadow p-2 text-[9px]">CALL<br/>BILL<br/>EMAIL</div><div className="absolute right-[12%] top-[22%] w-20 h-14 bg-white rotate-[7deg] shadow"/><div className="absolute left-[38%] bottom-[10%] w-24 h-3 bg-[#24394d] rotate-[-18deg] rounded-full"/></div>;
  return <div className="relative h-full overflow-hidden bg-[#ddd5c8]"><div className={`${common} left-[12%] top-[14%] w-[66%] h-[68%] rotate-[-5deg] rounded-sm p-3`} style={paper}><div className="text-[9px] font-bold tracking-[.18em] text-slate-500">DOCUMENT</div><div className="mt-3 h-1.5 bg-slate-200"/><div className="mt-2 h-1.5 bg-slate-200 w-5/6"/><div className="mt-2 h-1.5 bg-amber-200 w-2/3"/><div className="mt-2 h-1.5 bg-slate-200 w-4/5"/></div></div>;
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
      <div className="h-[92px]"><Scene type={item.scene}/></div>
      <div className="px-3.5 py-3">
        <div className="text-[8px] uppercase tracking-[.13em] font-bold text-slate-500 truncate">{tool.title}</div>
        <h3 className="mt-1.5 text-[13px] font-extrabold leading-[1.18]" style={{color:NAVY}}>{item.problem}</h3>
        <p className="mt-1.5 text-[10.5px] leading-[1.4]" style={{color:MUTED}}>{item.body}</p>
      </div>
    </Link>;
  };

  return <div className="relative h-[205px]" style={{perspective:'1400px'}}><div className="absolute inset-0" style={{transformStyle:'preserve-3d',transition:reducedMotion?'none':'transform 1550ms cubic-bezier(.22,.61,.28,1)',transform:`rotateY(${side*180}deg)`}}>{face(faces[0],0)}{face(faces[1],1)}</div></div>;
}

function PopularCard({ tool, scene }) {
  if (!tool) return null;
  return <Link to={`/${tool.id}`} className="group rounded-xl overflow-hidden border bg-white hover:shadow-md transition-shadow" style={{borderColor:BORDER}}><div className="h-[88px]"><Scene type={scene}/></div><div className="p-3"><div className="font-extrabold text-[12px]" style={{color:NAVY}}>{tool.title}</div><div className="mt-1 text-[10px] leading-snug line-clamp-2" style={{color:MUTED}}>{tool.tagline || tool.description}</div></div></Link>;
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
        window.setTimeout(()=>setSlots(v=>v.map((x,i)=>i===slot?nextIndex:x)), reducedMotion?0:1650);
        return current;
      });
    }, 7200);
    return()=>window.clearInterval(timer);
  },[available,paused,reducedMotion]);

  const submit=e=>{e.preventDefault(); const q=query.trim(); if(q&&setSearchTerm)setSearchTerm(q);};
  const toolFor=id=>byId.get(id);
  const popularScenes=['lease','doctor','talk','reviews','bill','memory'];

  return <div className="w-full">
    <section className="grid lg:grid-cols-[.92fr_1.08fr] rounded-2xl overflow-hidden border bg-white" style={{borderColor:BORDER}}>
      <div className="px-6 py-7 sm:px-8 sm:py-9 lg:px-9 lg:py-10 flex flex-col justify-center">
        <h2 className="text-[34px] sm:text-[42px] lg:text-[48px] leading-[.98] tracking-[-.035em] font-bold max-w-[560px]" style={{fontFamily:SERIF,color:INK}}>Life doesn’t come with instructions.</h2>
        <p className="mt-3 text-[15px] sm:text-base max-w-[470px]" style={{color:NAVY}}>DeftBrain helps when you don’t know what to do next.</p>
        <form onSubmit={submit} className="mt-5 flex gap-2 max-w-[520px]"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Describe what you’re dealing with…" className="min-w-0 flex-1 rounded-lg border px-3.5 py-2.5 text-[12px] outline-none focus:ring-2" style={{borderColor:BORDER}}/><button className="rounded-lg px-4 py-2.5 text-[11px] font-bold text-white whitespace-nowrap" style={{background:NAVY}}>Find a tool →</button></form>
        <p className="mt-2 text-[9.5px]" style={{color:MUTED}}>Try: lease agreement · doctor appointment · suspicious charge · difficult conversation</p>
        <button type="button" onClick={onBrowse} className="mt-4 self-start text-[11px] font-semibold underline underline-offset-4" style={{color:NAVY}}>Browse all tools →</button>
      </div>
      <div className="relative min-h-[280px] lg:min-h-[350px] overflow-hidden" style={{background:'linear-gradient(145deg,#d9d2c5 0%,#efe9df 44%,#b9c3b5 100%)'}}><div className="absolute inset-x-[8%] bottom-[-9%] h-[60%] rounded-[45%] rotate-[-4deg] shadow-xl bg-[#9b7656]"/><div className="absolute left-[9%] bottom-[18%] w-[42%] h-[38%] bg-white shadow-lg rotate-[-7deg] p-4"><div className="text-[8px] font-bold tracking-[.18em] text-slate-500">LEASE AGREEMENT</div><div className="mt-4 h-1.5 bg-slate-200 w-4/5"/><div className="mt-2 h-1.5 bg-amber-200 w-3/5"/><div className="mt-2 h-1.5 bg-slate-200"/></div><div className="absolute left-[43%] bottom-[11%] w-[30%] h-[42%] bg-[#f7f1df] shadow-lg rotate-[4deg] p-3"><div className="font-semibold text-sm" style={{fontFamily:SERIF,color:NAVY}}>Doctor visit</div><div className="mt-2 text-[9px] leading-5 text-slate-600">• Ask about side effects<br/>• Bring test results<br/>• What are my options?</div></div><div className="absolute right-[7%] bottom-[13%] w-[19%] h-[41%] rounded-[18px] bg-[#16191c] shadow-xl border-4 border-[#333] p-2 rotate-[6deg]"><div className="mt-10 rounded-lg bg-[#30363b] text-white text-[8px] p-2">Can we talk?</div></div>{[['Can my landlord do this?','left-[7%] top-[20%]'],['What should I ask my doctor?','right-[8%] top-[8%]'],['How do I say this?','right-[2%] top-[35%]']].map(([t,p])=><div key={t} className={`absolute ${p} bg-white rounded-xl shadow-md px-3 py-2 max-w-[130px] text-[10px] font-bold leading-tight`} style={{color:NAVY}}>{t}</div>)}</div>
    </section>

    <section className="py-8 sm:py-10" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)}>
      <div className="flex items-end justify-between gap-4 mb-5"><div><h2 className="text-[26px] sm:text-[30px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>What’s going on?</h2><p className="mt-1 text-[11px] sm:text-[12px]" style={{color:MUTED}}>Start with what’s on your mind. DeftBrain will help you take the next step.</p></div><p className="hidden sm:block text-[9px] max-w-[170px]" style={{color:MUTED}}>The doors change quietly to show more ways in.</p></div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">{slots.map((idx,slot)=>{const current=available[idx%Math.max(available.length,1)];return <DoorCard key={slot} initial={current} incoming={incoming[slot]} toolFor={toolFor} flipToken={tokens[slot]} reducedMotion={reducedMotion}/>;})}</div>
    </section>

    <section className="py-7 border-t" style={{borderColor:BORDER}}><div className="flex items-end justify-between mb-4"><div><div className="text-[8px] uppercase tracking-[.16em] font-bold text-slate-500">Popular tools</div><h2 className="mt-1 text-[24px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>Good places to start.</h2></div><button onClick={onBrowse} className="text-[10px] font-semibold underline underline-offset-4" style={{color:NAVY}}>See all tools →</button></div><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">{POPULAR.map((id,i)=><PopularCard key={id} tool={byId.get(id)} scene={popularScenes[i]}/>)}</div></section>

    <section className="my-8 rounded-2xl border overflow-hidden grid lg:grid-cols-[.78fr_1.22fr]" style={{borderColor:'#dce7ee',background:'linear-gradient(110deg,#eef7fb,#f8fbfd)'}}><div className="p-6 sm:p-8 flex flex-col justify-center"><div className="text-[8px] uppercase tracking-[.16em] font-bold" style={{color:NAVY}}>See it in action</div><h2 className="mt-2 text-[25px] sm:text-[29px] font-bold leading-[1.05]" style={{fontFamily:SERIF,color:NAVY}}>You tell DeftBrain what’s happening. You get something useful.</h2><p className="mt-2 text-[11px]" style={{color:MUTED}}>Clear steps. Better questions. A calmer next move.</p><div className="mt-4 flex gap-4"><Link to="/DoctorVisitPrep" className="rounded-lg px-4 py-2 text-[10px] font-bold text-white" style={{background:NAVY}}>Try a tool →</Link><button onClick={onBrowse} className="text-[10px] underline underline-offset-4" style={{color:NAVY}}>Explore more →</button></div></div><div className="p-5"><div className="rounded-xl border bg-white shadow-md p-4" style={{borderColor:BORDER}}><div className="text-[10px] font-extrabold" style={{color:NAVY}}>Doctor Visit Prep</div><div className="mt-3 grid grid-cols-2 gap-3 text-[9px]"><div className="rounded-lg p-3 bg-slate-50"><b>1. Tell me what’s going on</b><div className="mt-2 rounded bg-white p-2 text-slate-600">I have a follow-up appointment and I’m not sure what questions to ask.</div></div><div className="rounded-lg p-3 bg-slate-50"><b>2. Your prep plan</b><div className="mt-2 text-slate-600 leading-4">○ What should I ask?<br/>○ What should I bring?<br/>○ What should I track?</div></div></div></div></div></section>

    <section className="py-8"><div className="rounded-2xl border overflow-hidden" style={{borderColor:BORDER,background:SAND2}}><div className="grid lg:grid-cols-[.7fr_1.3fr]"><div className="p-6 sm:p-8"><div className="text-[8px] uppercase tracking-[.16em] font-bold text-slate-500">More than one kind of problem</div><h2 className="mt-2 text-[27px] font-bold leading-tight" style={{fontFamily:SERIF,color:NAVY}}>There’s probably a DeftBrain for that.</h2><p className="mt-2 text-[11px] leading-relaxed" style={{color:MUTED}}>Life rarely arrives sorted into categories. Neither does DeftBrain. Start with the thing in front of you.</p><button onClick={onBrowse} className="mt-4 text-[10px] font-bold underline underline-offset-4" style={{color:NAVY}}>Browse all tools →</button></div><div className="relative min-h-[220px] p-5 flex flex-wrap content-center justify-center gap-2 bg-white/45">{['weird lease','doctor visit','bad bill','awkward talk','forgotten word','suspicious review','security deposit','presentation','paperwork','focus','layover','apology','big decision','purchase','meeting','travel','name something','say it better'].map((x,i)=><span key={x} className={`inline-block rounded-full border bg-white shadow-sm px-3 py-2 text-[10px] font-semibold ${i%5===0?'rotate-[-2deg]':i%4===0?'rotate-[2deg]':''}`} style={{borderColor:BORDER,color:NAVY}}>{x}</span>)}</div></div></div></section>

    <section className="py-8 text-center"><h2 className="text-[22px] sm:text-[25px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>You don’t have to figure everything out alone.</h2><p className="mt-1.5 text-[10.5px]" style={{color:MUTED}}>Practical guidance. Thoughtful questions. Better decisions.</p></section>
  </div>;
}
