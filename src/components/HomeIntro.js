import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Caret from './Caret';

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
  // 2026-09-20: the plane-doing-loops photo moved (Finder rename, not a code
  // change) from RutBuster.jpg back to ChaosPilot.jpg — owner call. ChaosPilot
  // (id, renamed 2026-09-19 — was Crisis Prioritizer, see audit/RENAMES.md)
  // gets its tile back with copy that's actually accurate for it now. RutBuster
  // has no photo of its own at the moment, so it's out of this carousel until
  // one exists, same as any other tool without a home-scene image.
  { toolId:'ChaosPilot', problem:'Everything feels urgent at once.', body:'Sort the pile and find the next move.' },
  { toolId:'FinalWish', problem:'I need to say something that matters.', body:'Find the words without making them sound borrowed.' },
  { toolId:'FocusSoundArchitect', problem:'My surroundings are making it hard to work.', body:'Build a background your attention can live with.' },
  { toolId:'AlternatePath', problem:'What if I’d made a different choice?', body:'See where the other path would have led.' },
  { toolId:'AnalogyEngine', problem:'I need to explain something complicated.', body:'Get an analogy built for exactly who’s listening.' },
  { toolId:'ArgueSmarter', problem:'I think I’m right, but I want to be sure.', body:'Pressure-test your case against the strongest pushback.' },
  { toolId:'AwkwardSilenceFiller', problem:'The conversation just stalled.', body:'Get something to say that actually fits the moment.' },
  { toolId:'BatchFlow', problem:'My to-do list is a mess of unrelated tasks.', body:'Group them so your day stops fighting you.' },
  { toolId:'BeforeHello', problem:'I have a first date, interview, or intro coming up.', body:'Get ready before you say hello.' },
  { toolId:'BeforeTheCrash', problem:'I keep running myself into the ground.', body:'Learn the pattern before it happens again.' },
  { toolId:'BeliefStressTest', problem:'I’ve held this belief for years.', body:'See where it holds — and where it breaks.' },
  { toolId:'BikeMedic', problem:'Something’s wrong with my bike.', body:'Figure out what it is and what to do next.' },
  { toolId:'Bookmark', problem:'I stopped reading and can’t remember where I was.', body:'Pick up again — without the spoilers.' },
  { toolId:'BragSheetBuilder', problem:'I need to talk about my own work.', body:'Remember it clearly and say it with confidence.' },
  { toolId:'BrainDumpBuddy', problem:'Everything is stuck in my head at once.', body:'Get it out and find the one next step.' },
  { toolId:'BrainRoulette', problem:'I want to think about something new.', body:'Follow your curiosity somewhere unexpected.' },
  { toolId:'BrainStateDeejay', problem:'I need to feel different than I do right now.', body:'Get music that moves you there.' },
  { toolId:'BreakMyPlan', problem:'I think my plan is solid, but I’m not sure.', body:'Find its weak spots before they find you.' },
  { toolId:'BuyWise', problem:'I’m about to buy something big.', body:'Go in with your eyes open.' },
  { toolId:'CaptionMagic', problem:'I have the photo. I don’t have the words.', body:'Find the caption that actually fits.' },
  { toolId:'ColdOpenCraft', problem:'I don’t know how to start the message.', body:'Make the first line easier to send — and answer.' },
  { toolId:'ContextCollapse', problem:'The same message reads differently to my boss, my partner, and my friend.', body:'See how each of them will actually read it — before you send it.' },
  { toolId:'DecoderRing', problem:'I can’t tell what they actually meant by that.', body:'Explore what might really be going on beneath the words.' },
  { toolId:'DoctorVisitTranslator', problem:'My diagnosis is full of words I don’t understand.', body:'Turn the medical jargon into plain English.' },
  { toolId:'HistoryToday', problem:'This feels unprecedented, but does it?', body:'Find the real historical parallel — not the obvious one.' },
  { toolId:'Mend', problem:'I need to apologize, but not over- or under-do it.', body:'Match the apology to the actual harm.' },
  { toolId:'MentalHealthNavigator', problem:'I don’t know what kind of help I actually need.', body:'Find the right support for what you’re going through.' },
  { toolId:'MiseEnPlace', problem:'I can cook. I just can’t decide what to cook.', body:'Get the plan, not just the recipe.' },
  { toolId:'MissingLink', problem:'I’m stuck on a concept and don’t know why.', body:'Find exactly where your understanding broke.' },
  { toolId:'NotSoFast', problem:'I got a flat no, and I don’t think it’s final.', body:'Find the appeal, the escalation path, or the conversation nobody explained.' },
  { toolId:'PlantRescue', problem:'My plant looks off and I don’t know why.', body:'Get a few plausible explanations and what to check first.' },
  { toolId:'RoastMe', problem:'I’ve read this so many times I can’t see what’s wrong anymore.', body:'Find the clichés and buzzwords you stopped noticing.' },
  { toolId:'SixDegreesOfMe', problem:'My interests feel scattered and unrelated.', body:'Discover the surprising threads that connect them.' },
  { toolId:'SomeoneSaidItBetter', problem:'I know the feeling. I just can’t find the words.', body:'Get the words you needed, already said.' },
  { toolId:'TheDebrief', problem:'The meeting ended and I’m still not sure what was decided.', body:'Figure out what actually happened.' },
  { toolId:'TheWholeStory', problem:'I need to explain a messy chapter of my life.', body:'Frame the real story — honest, but strategic.' },
  { toolId:'VirtualBodyDouble', problem:'I focus better with someone else in the room.', body:'Work alongside a presence that keeps you on task.' },
  { toolId:'WhatsThatMean', problem:'I don’t know what that phrase actually means.', body:'Get the plain explanation, not just the dictionary entry.' },
  { toolId:'WhichLife', problem:'I can only see the road not taken in hindsight.', body:'Feel both futures before you choose.' },
  { toolId:'WrongAnswersOnly', problem:'I need something ridiculous to lighten the mood.', body:'Get a confidently, beautifully wrong answer.' },
];

const POPULAR = ['LeaseTrapDetector','DoctorVisitPrep','DifficultTalkCoach','FakeReviewDetective','BillRescue','TipOfTongue'];

// "There's probably a DeftBrain for that" word cloud — each phrase links to
// the tool it actually describes (checked against real tags/taglines, not
// guessed from the words alone — see the ChaosPilot/CrisisPrioritizer
// mislabeling this session already found and fixed for exactly that kind of
// mistake). A few phrases share a tool on purpose (e.g. two doctor-visit
// phrases both point at DoctorVisitPrep) — the cloud is about breadth of
// situations, not a 1:1 map to the catalog.
const PROBLEM_CLOUD = [
  ['weird lease','LeaseTrapDetector'],
  ['doctor visit','DoctorVisitPrep'],
  ['bad bill','BillRescue'],
  ['awkward talk','ReadTheRoom'],
  ['forgotten word','TipOfTongue'],
  ['suspicious review','FakeReviewDetective'],
  ['security deposit','RentersDepositSaver'],
  ['presentation','NerveCheck'],
  ['paperwork','PaperworkPath'],
  ['focus','FocusPocus'],
  ['layover','LayoverMaximizer'],
  ['apology','Mend'],
  ['big decision','DecisionCoach'],
  ['purchase','BuyWise'],
  ['meeting','JustifyMyMeeting'],
  ['travel','TripRecon'],
  ['name something','NameStorm'],
  ['say it better','SomeoneSaidItBetter'],
  ['roommate trouble','RoommateCourt'],
  ['scam?','ScamRadar'],
  ['hard email','VelvetHammer'],
  ['career change','SkillGapMap'],
  ['what did they mean?','WhatsThatMean'],
  ['prep for a procedure','ProcedureProbe'],
  ['fake reviews','FakeReviewDetective'],
  ['make a toast','ToastWriter'],
  ['lost the day','WhereDidTheTimeGo'],
  ['need a gift','Giftology'],
  ['explain this','AnalogyEngine'],
  ['plan went sideways','BreakMyPlan'],
  ['what should I ask?','DoctorVisitPrep'],
  ['before I sign','ContractDecoder'],
  ['too much to do','ChaosPilot'],
  ['find the right words','SomeoneSaidItBetter'],
  ['price feels wrong','MarkupDetective'],
  ['difficult customer','DifficultTalkCoach'],
  ['can’t get started','TaskAvalancheBreaker'],
  ['remember this','Bookmark'],
  ['prepare for move-out','RentersDepositSaver'],
  ['stress-test an idea','ConceptCoach'],
  ['understand research','ResearchDecoder'],
  ['what happens next?','BeforeTheCrash'],
  ['need a comeback','ComebackCooker'],
  ['before the meeting','MeetingHijackStopper'],
  ['something feels off','DecoderRing'],
];

// Hero banner rotation — one photoreal "everyday life" scene at a time, each
// staged around a different slice of what DeftBrain covers. Alt text names
// what's actually in the frame (the photo is the only place that content
// lives — nothing else on the page repeats it), matching the original
// hero-everyday.jpg's alt convention.
const HERO_IMAGES = [
  { src:'/home-scenes/hero-everyday.jpg', alt:'A lease, doctor-visit notes, and a difficult text conversation — examples of everyday situations DeftBrain can help with' },
  { src:'/home-scenes/hero-everyday-choices.jpg', alt:'A signpost, two small doors with keys, and a checklist of options — examples of the decisions DeftBrain can help you think through' },
  { src:'/home-scenes/hero-everyday-growth.jpg', alt:'A trophy, a set of wooden steps, and a notebook labeled Skills, Ideas, Projects — examples of the growth and next-step questions DeftBrain can help with' },
  { src:'/home-scenes/hero-everyday-household.jpg', alt:'A utility bill, a stack of subscription envelopes, a parking ticket, and a maze of government forms — examples of household paperwork DeftBrain can help untangle' },
  { src:'/home-scenes/hero-everyday-occasion.jpg', alt:'A wedding toast card, a table seating chart, and a bowl of conversation prompts — examples of occasions and speeches DeftBrain can help you prepare for' },
  { src:'/home-scenes/hero-everyday-overload.jpg', alt:'A tangle of cords, an overflowing laundry basket, and a to-do list — examples of the overwhelm DeftBrain can help you sort through' },
  { src:'/home-scenes/hero-everyday-consumer.jpg', alt:'A repair estimate, a part with retail and wholesale price tags, and a suspicious payment request — examples of purchase decisions DeftBrain can help you make' },
  { src:'/home-scenes/hero-everyday-kitchen.jpg', alt:'Kitchen vegetables, a drooping houseplant, and a sleep mask beside a nightstand clock — examples of everyday home questions DeftBrain can help with' },
  { src:'/home-scenes/hero-everyday-relationships.jpg', alt:'An unsent text message, a framed photo of two friends, and a party invitation — examples of relationship questions DeftBrain can help you navigate' },
  { src:'/home-scenes/hero-everyday-travel.jpg', alt:'A passport, a boarding pass, and a phrasebook note in Spanish — examples of travel questions DeftBrain can help you prepare for' },
];

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
    // !no-underline (not plain no-underline): same Firefox quirk already
    // found and fixed in DashBoard.js's nav — a plain class doesn't
    // reliably beat the browser's default <a> underline in Firefox/Opera
    // even though Chrome/Safari resolve it fine. This card's h3/p never
    // had ANY underline reset before, relying entirely on that unreliable
    // inherited default.
    return <Link to={`/${tool.id}`} className="group absolute inset-0 rounded-xl bg-white border border-[#e4ddd2] hover:border-[#142a43] shadow-sm hover:shadow-xl transition focus:outline-none focus:ring-2 focus:ring-offset-2 !no-underline" style={{backfaceVisibility:'hidden',WebkitBackfaceVisibility:'hidden',transform:index===1?'rotateY(180deg)':'rotateY(0deg)'}}>
      <div className="relative">
        <div className="aspect-[9/8] overflow-hidden rounded-t-xl bg-[#eee8df]"><img src={`/home-scenes/flip-cards/${item.toolId}.jpg`} alt="" className="w-full h-full object-cover" loading="lazy" /></div>
        {/* Hover preview — a larger, less-cropped version of the same photo,
            bottom-anchored to the image's own box so it only ever grows
            upward and outward, never over the problem/body text below.
            Desktop only (lg:); a hover reveal serves no touch device, and
            the fixed 6-column grid there means each tile has room on
            either side. The Link above deliberately has no overflow-hidden
            of its own (this needs to escape the card's box) — the normal
            image keeps its own top corners via rounded-t-xl + overflow-
            hidden right on its own wrapper instead.

            Sized via transform: scale(1.7) + origin-bottom, NOT a
            percentage width (w-[170%]). A percentage width on this img
            resolves against this flex child's own containing block, which
            is itself an auto-sized position:absolute box (inset-x-0, no
            explicit width) — Chrome/Safari and Firefox/Opera don't agree
            on that resolution (confirmed live 2026-09-21: Chrome/Safari
            rendered ~2x the base image, Firefox/Opera rendered close to
            1x, leaving the base thumbnail peeking out above the
            undersized preview). transform:scale() operates on the box's
            already-computed size, sidestepping the ambiguity — same final
            rendered size (base * 1.7 in both dimensions), identical
            across every engine because transform math isn't part of the
            percentage-resolution spec area that disagreed. */}
        <div className="hidden lg:flex justify-center pointer-events-none absolute inset-x-0 bottom-0 z-20 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-150">
          <img src={`/home-scenes/flip-cards/${item.toolId}.jpg`} alt="" loading="lazy" className="w-full aspect-[8/5] object-cover rounded-xl origin-bottom scale-[1.7]" style={{border:'2px solid #142a43',boxShadow:'0 20px 45px -12px rgba(20,42,67,.45)'}} />
        </div>
      </div>
      <div className="px-3.5 py-3">
        <h3 className="text-[13px] font-extrabold leading-[1.18]" style={{color:NAVY}}>{item.problem}</h3>
        <p className="mt-1.5 text-[10.5px] leading-[1.4]" style={{color:MUTED}}>{item.body}</p>
      </div>
    </Link>;
  };

  return <div className="relative h-[295px] md:h-[332px] lg:h-[253px] hover:z-30 focus-within:z-30" style={{perspective:'1400px'}}><div className="absolute inset-0" style={{transformStyle:'preserve-3d',transition:reducedMotion?'none':'transform 2325ms cubic-bezier(.22,.61,.28,1)',transform:`rotateY(${side*180}deg)`}}>{face(faces[0],0)}{face(faces[1],1)}</div></div>;
}

function PopularCard({ tool }) {
  if (!tool) return null;
  return <Link to={`/${tool.id}`} className="rounded-xl overflow-hidden bg-white border border-[#e4ddd2] hover:border-[#142a43] shadow-sm hover:shadow-xl transition">
    <div className="h-[78px] overflow-hidden bg-[#eee8df]"><img src={`/home-scenes/flip-cards/${tool.id}.jpg`} alt="" className="w-full h-full object-cover" loading="lazy" /></div>
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
    <section className="my-7 relative rounded-2xl border" style={{borderColor:BORDER}}>
      {/* Background is its own absolutely-positioned, overflow-hidden layer
          (not on the section itself) so a hover-preview image popping above
          or below a tile near the top/bottom edge isn't clipped by the
          card's rounded corners. */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{background:'linear-gradient(120deg,#dff4ff 0%,#eee9ff 35%,#fff2df 68%,#ffe5ee 100%)'}} />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <div className="text-[8px] uppercase tracking-[.16em] font-bold text-slate-600">Explore without an agenda</div>
            <h2 className="mt-1 text-[24px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>The Tool Scramble</h2>
            <p className="mt-1 text-[11px] max-w-md" style={{color:MUTED}}>Icons and taglines from real DeftBrain tools. Hover to see a preview — click to give it a try.</p>
          </div>
          <button type="button" onClick={()=>setSeed(s=>s+1)} className="rounded-lg px-3.5 py-2 text-[10px] font-bold text-white whitespace-nowrap" style={{background:NAVY}}>↻ Scramble again</button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-9 gap-y-7 py-6">
          {shown.map((t,i) => {
            const rot = SCRAMBLE_ROTATE[i%SCRAMBLE_ROTATE.length];
            const scale = SCRAMBLE_SCALE[i%SCRAMBLE_SCALE.length];
            const tilt = SCRAMBLE_TILT[i%SCRAMBLE_TILT.length];
            const accent = SCRAMBLE_COLORS[i%SCRAMBLE_COLORS.length];
            return (
              <Link key={t.id} to={`/${t.id}`} className="group relative flex items-center gap-2 max-w-[210px] hover:z-30 focus:z-30" style={{transform:`rotate(${rot}deg) scale(${scale})`}}>
                <span className="text-[20px] flex-shrink-0" aria-hidden="true">{t.icon || '✦'}</span>
                <span>
                  <b className="block text-[11px] leading-tight" style={{color:accent}}>{t.tagline}</b>
                  <em className="block not-italic text-[9px] mt-0.5 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity" style={{color:NAVY}}>{t.title} →</em>
                </span>
                {/* Preview polaroid — counter-rotates the tile's own scatter
                    angle, then adds its own independent "just landed" tilt
                    (rotate happens BEFORE the centering translate so the
                    shift moves along the true horizontal axis, not the
                    tile's). Accent border/caption match this tile's own
                    tagline color — ties the photo back to its tile instead
                    of reading as an unrelated insert. Desaturated slightly
                    so it sits closer to the section's pastel palette.
                    Silently disappears (onError) for the ~35 tools with no
                    art yet — the em title reveal above still works either
                    way, and popups are EXPECTED to sit over neighbors while
                    open, same as any hover card. */}
                <div
                  className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 w-[300px] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100"
                  style={{transform:`rotate(${-rot+tilt}deg) translateX(-50%)`}}
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
                    <div className="mt-2 text-center text-[11px] font-extrabold" style={{color:accent}}>{t.title}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <button type="button" onClick={onBrowse} className="text-[10px] font-bold underline underline-offset-4" style={{color:NAVY}}>Browse all {allTools.length} tools →</button>
      </div>
    </section>
  );
}

// Crossfades through HERO_IMAGES on a slow interval. Only ever mounts one
// <img> at a time — swapping `src` mid-fade rather than stacking all ten
// full-size photos — so the other nine never load until their turn comes.
// The 600ms fade-out-then-swap-then-fade-in mirrors the door-card carousel's
// own pause-on-hidden-tab and prefers-reduced-motion handling above, reusing
// the same two flags instead of re-deriving them.
function HeroImage({ paused, reducedMotion }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (paused || HERO_IMAGES.length <= 1) return;
    const timer = window.setInterval(() => {
      if (reducedMotion) { setIndex(i => (i + 1) % HERO_IMAGES.length); return; }
      setVisible(false);
      window.setTimeout(() => {
        setIndex(i => (i + 1) % HERO_IMAGES.length);
        setVisible(true);
      }, 600);
    }, 14000);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  const img = HERO_IMAGES[index];
  return (
    <div className="relative min-h-[245px] lg:min-h-[285px] overflow-hidden bg-[#eee8df]">
      <img
        src={img.src}
        alt={img.alt}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[750ms]"
        style={{ opacity: reducedMotion ? 1 : (visible ? 1 : 0) }}
      />
    </div>
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
        <p className="mt-2 text-[11px]" style={{color:MUTED}}>Try: lease agreement · doctor appointment · suspicious charge · difficult conversation</p>
        {/* Plain <a>, not <Link>: /privacy is a static prerendered page
            (public/privacy.html), not a React Router route — a <Link> here
            would fall through to the catch-all /:toolId route and 404, the
            same bug already fixed for /guides and /about (see Footer.js and
            RelatedLinks.js, which use the same convention for this exact
            reason). */}
        <p className="mt-1 text-[11px] font-bold" style={{color:NAVY}}>Free · No account · <a href="/privacy" className="underline underline-offset-2">Nothing you type is stored on our servers</a></p>
        <button type="button" onClick={onBrowse} className="mt-4 self-start text-[11px] font-semibold underline underline-offset-4" style={{color:NAVY}}>Browse all {allTools.length} tools →</button>
      </div>
      <HeroImage paused={paused} reducedMotion={reducedMotion} />
    </section>

    <section className="py-7 sm:py-8" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)}>
      <div className="flex items-end justify-between gap-4 mb-5"><div><h2 className="text-[23px] sm:text-[26px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>What’s going on?</h2><p className="mt-1 text-[11px] sm:text-[12px]" style={{color:MUTED}}>Start with what’s on your mind. DeftBrain will help you take the next step.</p></div></div>
      <div className="relative">
        {totalPages>1 && <button type="button" onClick={()=>goToPage(page-1)} aria-label="Previous tools" className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border shadow-sm items-center justify-center text-[15px] hover:shadow-md" style={{borderColor:BORDER,color:NAVY}}>‹</button>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">{slots.map((idx,slot)=>{const current=available[idx%Math.max(available.length,1)];return <DoorCard key={slot} initial={current} incoming={incoming[slot]} toolFor={toolFor} flipToken={tokens[slot]} reducedMotion={reducedMotion}/>;})}</div>
        {totalPages>1 && <button type="button" onClick={()=>goToPage(page+1)} aria-label="More tools" className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border shadow-sm items-center justify-center text-[15px] hover:shadow-md" style={{borderColor:BORDER,color:NAVY}}>›</button>}
      </div>
      {totalPages>1 && <div className="flex justify-center gap-1.5 mt-5">{Array.from({length:totalPages}).map((_,i)=><button key={i} type="button" onClick={()=>goToPage(i)} aria-label={`Go to tools page ${i+1}`} className="rounded-full transition-all duration-300" style={{width:i===page?16:6,height:6,background:i===page?NAVY:'#ddd4c6'}}/>)}</div>}
    </section>

    <section className="my-8 relative rounded-2xl border overflow-hidden lg:min-h-[300px]" style={{borderColor:'#dce7ee',background:'linear-gradient(110deg,#eef7fb,#f8fbfd)'}}>
      {/* Desktop: the tablet photo's box is widened 15% to the left (its
          right edge stays put, same crop logic as before, so the tablet
          itself still renders exactly as it did) so there's real photo
          under the panel below. The panel is ALSO widened 15% beyond the
          original .78fr text column and painted on top with a true
          corner-to-corner diagonal fade — solid at the top-left, 0%
          opacity at the bottom-right.

          A pure alpha fade over a CRISP photo still read as a hard line:
          the reveal zone happens to land on bright, textured window light,
          and eyes register the texture snapping into focus far more
          readily than the gradual alpha change underneath it. Fix: a
          blurred copy of the same photo sits behind the crisp one; the
          crisp copy fades itself in (its own left-to-right mask, ending
          past where the panel finishes) so texture arrives gradually
          instead of all at once under the panel's fade. */}
      <img src="/home-scenes/see-it-in-action.jpg" alt="" aria-hidden="true" className="hidden lg:block absolute inset-y-0 right-0 object-cover" style={{width:'66.85%',height:'100%',filter:'blur(16px)',transform:'scale(1.04)'}} loading="lazy" />
      <img src="/home-scenes/see-it-in-action.jpg" alt="A tablet showing the DeftBrain chat interface with a doctor-visit prep plan, next to a sticky note reading More prepared. A calmer conversation." className="hidden lg:block absolute inset-y-0 right-0 object-cover" style={{width:'66.85%',height:'100%',WebkitMaskImage:'linear-gradient(to right, transparent 0%, black 32%)',maskImage:'linear-gradient(to right, transparent 0%, black 32%)',WebkitMaskRepeat:'no-repeat',maskRepeat:'no-repeat',WebkitMaskSize:'100% 100%',maskSize:'100% 100%'}} loading="lazy" />
      <div className="hidden lg:block absolute inset-y-0 left-0" style={{width:'44.85%', background:'linear-gradient(to bottom right, #eef7fb 0%, #eef7fb 8%, rgba(238,247,251,0) 100%)'}} />
      <div className="relative grid lg:grid-cols-[.78fr_1.22fr]">
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <h2 className="text-[25px] sm:text-[29px] font-bold leading-[1.05]" style={{fontFamily:SERIF,color:NAVY}}>See it in action</h2>
          <p className="mt-3 text-[12.5px] leading-snug" style={{color:MUTED}}>Tell DeftBrain what’s happening. Get something useful.</p>
          <p className="mt-2 text-[12.5px]" style={{color:MUTED}}><b style={{color:NAVY}}>Clear steps.</b> Better questions. A calmer next move.</p>
          <div className="mt-4 flex gap-4"><Link to="/DoctorVisitPrep" className="rounded-lg px-4 py-2 text-[10px] font-bold text-white" style={{background:NAVY}}>Try a tool →</Link><button onClick={onBrowse} className="text-[10px] font-bold" style={{color:NAVY}}>Explore more tools →</button></div>
        </div>
        <div className="relative lg:hidden min-h-[260px] overflow-hidden bg-[#eee8df]"><img src="/home-scenes/see-it-in-action.jpg" alt="A tablet showing the DeftBrain chat interface with a doctor-visit prep plan, next to a sticky note reading More prepared. A calmer conversation." className="absolute inset-0 w-full h-full object-cover" loading="lazy" /></div>
      </div>
    </section>

    <section className="my-7 rounded-2xl border overflow-hidden" style={{borderColor:BORDER,background:'linear-gradient(105deg,#fff0cf 0%,#f8ddd7 35%,#e9e1f5 68%,#d7ebf7 100%)'}}><div className="p-5 sm:p-6"><div className="flex items-end justify-between gap-4 mb-4"><div><h2 className="text-[24px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>Some of our most popular tools</h2><p className="mt-1 text-[11px]" style={{color:MUTED}}>Real situations. Real guidance. A better next step.</p></div><button onClick={onBrowse} className="text-[10px] font-semibold underline underline-offset-4 whitespace-nowrap" style={{color:NAVY}}>Browse all {allTools.length} tools →</button></div><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">{POPULAR.map(id=><PopularCard key={id} tool={byId.get(id)}/>)}</div></div></section>

    <ToolScramble allTools={allTools} onBrowse={onBrowse} />

    <section className="py-7"><div className="rounded-2xl border overflow-hidden" style={{borderColor:BORDER,background:'linear-gradient(120deg,#ffe9d6 0%,#fdf3ea 30%,#fbf7f1 60%,#fffaf2 100%)'}}><div className="grid lg:grid-cols-[.62fr_1.38fr]"><div className="p-6 sm:p-7"><div className="text-[8px] uppercase tracking-[.16em] font-bold text-slate-500">More than one kind of problem</div><h2 className="mt-2 text-[25px] font-bold leading-tight" style={{fontFamily:SERIF,color:NAVY}}>There’s probably a DeftBrain for that.</h2><p className="mt-2 text-[10.5px] leading-relaxed" style={{color:MUTED}}>Life rarely arrives sorted into categories. Neither does DeftBrain.</p><button onClick={onBrowse} className="mt-4 text-[10px] font-bold underline underline-offset-4" style={{color:NAVY}}>Browse all {allTools.length} tools →</button></div><div className="relative min-h-[205px] px-5 py-6 flex flex-wrap content-center justify-center gap-x-4 gap-y-2 bg-white/30">{PROBLEM_CLOUD.map(([x,toolId],i)=>{const colors=['#c94f45','#1f6f78','#d28a2e','#6c5aa8','#3f7b4d','#b14f78','#2e5f9e'];const deg=[-5,3,-2,5,-4,2,4][i%7];return <Link key={x} to={`/${toolId}`} className="inline-block font-bold whitespace-nowrap hover:underline underline-offset-2" style={{fontFamily:i%4===0?SERIF:'inherit',fontSize:`${9+(i%5)*0.8}px`,color:colors[i%colors.length],transform:`rotate(${deg}deg)`,opacity:.88}}>{x}</Link>})}</div></div></div></section>

    {/* Objection-handling — collapsed by default, after the tools content
        and before the closing send-off, so lingering doubts get answered
        right before someone leaves rather than sitting mid-scroll. Answers
        reuse language that already exists and was already vetted elsewhere
        on the site (about.html's "preparation tools, not professionals"
        disclaimer; the hero's own free/no-account/privacy line) rather than
        inventing new claims — the one exception is "what's the catch",
        which has no prior answer anywhere on the site. */}
    <section className="py-7">
      <h2 className="text-[22px] sm:text-[25px] font-bold text-center" style={{fontFamily:SERIF,color:NAVY}}>Before you dig in</h2>
      <div className="mt-5 max-w-xl mx-auto divide-y" style={{borderColor:BORDER}}>
        <details className="group py-3">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-3 text-[13px] font-semibold" style={{color:NAVY}}>
            Is this just ChatGPT?
            <Caret groupOpen className="ms-auto" />
          </summary>
          <p className="mt-2 text-[11.5px] leading-relaxed" style={{color:MUTED}}>No. DeftBrain isn’t a chat window. Each tool asks the specific questions your situation needs, then organizes the result — a lease review, a question list, a decision breakdown — instead of leaving you to figure out what to ask.</p>
        </details>
        <details className="group py-3">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-3 text-[13px] font-semibold" style={{color:NAVY}}>
            Can I trust this for something serious — a lease, a diagnosis, money?
            <Caret groupOpen className="ms-auto" />
          </summary>
          {/* Plain <a>, not <Link>: /about is a static prerendered page, not
              a React Router route — same convention as /privacy and
              /guides above. */}
          <p className="mt-2 text-[11.5px] leading-relaxed" style={{color:MUTED}}>These are preparation tools, not professionals. Lease Trap Detector helps you walk into a lawyer’s office with better questions — it isn’t a lawyer. AI can be wrong, confidently. Treat the output as a well-organized starting point, and verify anything that’s load-bearing. <a href="/about" className="!no-underline hover:!underline underline-offset-2 font-semibold" style={{color:NAVY}}>More on how we think about this →</a></p>
        </details>
        <details className="group py-3">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-3 text-[13px] font-semibold" style={{color:NAVY}}>
            Is my information safe?
            <Caret groupOpen className="ms-auto" />
          </summary>
          <p className="mt-2 text-[11.5px] leading-relaxed" style={{color:MUTED}}>Nothing you type into a tool is stored on our servers. No accounts, no cookies. <a href="/privacy" className="!no-underline hover:!underline underline-offset-2 font-semibold" style={{color:NAVY}}>Read the privacy policy →</a></p>
        </details>
        <details className="group py-3">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-3 text-[13px] font-semibold" style={{color:NAVY}}>
            What’s the catch — how is it free?
            <Caret groupOpen className="ms-auto" />
          </summary>
          <p className="mt-2 text-[11.5px] leading-relaxed" style={{color:MUTED}}>There isn’t one. DeftBrain is free to use — no ads, no account, nothing to buy.</p>
        </details>
      </div>
    </section>

    <section className="py-8 text-center">
      <h2 className="text-[22px] sm:text-[25px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>You don’t have to figure everything out alone.</h2>
      <p className="mt-1.5 text-[10.5px]" style={{color:MUTED}}>Read one, or run a tool — whichever fits.</p>
      {/* Plain <a>, not <Link>: /guides and /guides/:category are static
          prerendered pages (built by scripts/prerender.js), not React Router
          routes — a <Link> here would fall through to the catch-all
          /:toolId route and 404, same convention as the privacy link above
          and Footer.js/RelatedLinks.js. */}
      <nav aria-label="Guides" className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-semibold">
        <a href="/guides/conversations" className="!no-underline hover:!underline underline-offset-4" style={{color:NAVY}}>Conversations</a>
        <a href="/guides/money" className="!no-underline hover:!underline underline-offset-4" style={{color:NAVY}}>Money</a>
        <a href="/guides/workplace" className="!no-underline hover:!underline underline-offset-4" style={{color:NAVY}}>Workplace</a>
        <a href="/guides/home" className="!no-underline hover:!underline underline-offset-4" style={{color:NAVY}}>Home</a>
        <a href="/guides/wellness" className="!no-underline hover:!underline underline-offset-4" style={{color:NAVY}}>Wellness</a>
        <a href="/guides/health" className="!no-underline hover:!underline underline-offset-4" style={{color:NAVY}}>Health</a>
        <a href="/guides" className="font-bold underline underline-offset-4" style={{color:NAVY}}>Browse all guides →</a>
      </nav>
    </section>
  </div>;
}
