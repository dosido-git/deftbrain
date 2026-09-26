import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Caret from './Caret';
import { TOOL_COUNT_LABEL } from '../data/toolCount';
import { CATEGORY_META } from '../data/categoryMeta';

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
  ['find weaknesses in my plan','BreakMyPlan'],
  ['what should I ask?','DoctorVisitPrep'],
  ['before I sign','ContractDecoder'],
  ['too much to do','ChaosPilot'],
  ['find the right words','SomeoneSaidItBetter'],
  ['price feels wrong','MarkupDetective'],
  ['difficult customer','DifficultTalkCoach'],
  ['can’t get started','TaskAvalancheBreaker'],
  ['pick up a book or show again','Bookmark'],
  ['prepare for move-out','RentersDepositSaver'],
  ['stress-test an idea','ConceptCoach'],
  ['understand research','ResearchDecoder'],
  ['understand my energy crashes','BeforeTheCrash'],
  ['need a comeback','ComebackCooker'],
  ['before the meeting','MeetingHijackStopper'],
  ['something feels off','DecoderRing'],
];

// "See it in action" worked examples (2026-09-21) — two shown at once, picked
// per page load (see HomeIntro below). Went through three versions same day:
// (1) a single photo with the DoctorVisitPrep exchange baked into it as
// legible pixels — fine as one fixed example, impossible to rotate without
// the picture contradicting whatever tool the copy named; (2) a hand-built
// chat-bubble mockup (input + a short "here's what you get" list) — honest,
// but a 4-item list undersold what these tools actually produce (owner
// feedback: "gives no clue to the depth of content a user sees" — see the
// real BatchFlow screenshot that prompted this). `shot` is now a REAL
// screenshot: each tool was actually run (Try an example -> submit) and the
// live result captured and cropped, not staged or hand-drawn. `input` is a
// short, accurate paraphrase of what was actually typed for that run (the
// real text is sometimes too long for a caption — e.g. ContractDecoder's
// input was a full pasted contract — but every `shot` is the true, complete
// result for the paraphrase shown, nothing invented on either side).
// Deliberately drawn from OUTSIDE the tools ROTATION[0..5] already leans on
// most often (Lease/DoctorVisit/DifficultTalk/Bill/FakeReview/TipOfTongue),
// so this section stops reinforcing the same handful. To refresh a shot:
// rerun that tool's "Try an example" -> submit, screenshot the result, crop
// to the richest ~1500px band (skip the input form), save as
// public/see-it-in-action/<ToolId>.webp.
const SEE_IT_EXAMPLES = [
  { toolId:'DoctorVisitPrep', input:'Right-sided lower back pain, getting worse for 3 weeks.', shot:'/see-it-in-action/DoctorVisitPrep.webp' },
  { toolId:'DecisionCoach', input:'What should I make for dinner? I have chicken, rice, and broccoli — no more pasta.', shot:'/see-it-in-action/DecisionCoach.webp' },
  { toolId:'ContractDecoder', input:'A freelance services agreement with a client — before I sign it.', shot:'/see-it-in-action/ContractDecoder.webp' },
  { toolId:'TicketTackler', input:'A parking ticket — the sign’s posted hours don’t match when I was cited.', shot:'/see-it-in-action/TicketTackler.webp' },
  { toolId:'BatchFlow', input:'Six unrelated tasks today — writing, code review, calls, errands — no idea where to start.', shot:'/see-it-in-action/BatchFlow.webp' },
  { toolId:'MarkupDetective', input:'$6 latte at a trendy coffee shop.', shot:'/see-it-in-action/MarkupDetective.webp' },
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
  const faceRefs = [useRef(null), useRef(null)];

  // Keyboard focus follows the flip: if the visitor had tabbed onto the card
  // when it turns, the face they were on is about to become the hidden one,
  // and focus left there would sit on a link nobody can see.
  useEffect(() => {
    const hiddenFace = faceRefs[side === 0 ? 1 : 0].current;
    if (hiddenFace && hiddenFace === document.activeElement && faceRefs[side].current) {
      faceRefs[side].current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side]);

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
    // Both faces are real links stacked in the same spot, and backface-
    // visibility only hides the back one VISUALLY — it stayed in the tab
    // order and the accessibility tree, so screen readers announced every
    // card twice (flagged in the 2026-09-21 external home-page review). The
    // face turned away is now hidden from both.
    const isHidden = index !== side;
    return <Link ref={faceRefs[index]} to={`/${tool.id}`} aria-hidden={isHidden ? 'true' : undefined} tabIndex={isHidden ? -1 : undefined} className="group absolute inset-0 rounded-xl bg-white border border-[#e4ddd2] hover:border-[#142a43] shadow-sm hover:shadow-xl transition focus:outline-none focus:ring-2 focus:ring-offset-2 !no-underline" style={{backfaceVisibility:'hidden',WebkitBackfaceVisibility:'hidden',transform:index===1?'rotateY(180deg)':'rotateY(0deg)'}}>
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
      <div className="px-3.5 py-2">
        {/* line-clamp, not just a taller fixed height — the card wrapper
            below is a fixed h-[…] (required for the 3D flip: the faces are
            position:absolute inset:0, sized off it) with no overflow:hidden
            of its own (needed so the hover preview above can escape
            upward). At 4-across the column got narrow enough that a full
            ROTATION sentence ("I need to have a difficult conversation.")
            wraps past 2 lines and, with nothing clipping it, spills
            straight out the bottom of the fixed-height box instead of
            being contained by it. Clamping is the fix that holds at any
            card width, not just today's — a taller magic number would
            just move the same failure to the next narrower breakpoint.

            line-clamp-2 (first pass) overcorrected: measured live, several
            real ROTATION lines need 3 lines to read in full — a 3-sentence
            body ("Find the clause. Understand the risk. Know what to
            ask.") or a longer headline both clamped to 2 lines were losing
            their last sentence/word even though nothing was actually
            overflowing the old box, just wrapping more than expected.
            Bumped to line-clamp-3 and gave the card itself more height
            (below) to match — clamp is still the safety net, not the
            primary fit, so a still-longer line in the future gets cut
            cleanly instead of spilling.

            IMPORTANT if touching the card height below: line-clamp limits
            the MAXIMUM lines, it doesn't shrink text below what a 3-line
            headline + 3-line body actually need — so the wrapper's fixed
            height has a real floor (currently: image height + this box's
            padding + a 3-line h3 + the h3-p gap + a 3-line p). Go below
            that floor and the rare card that genuinely needs 3+3 lines
            overflows again, just less often. py-3->py-2 and the h3-p gap
            below were trimmed specifically to lower that floor (owner:
            the box below the text read as "a little overdone" for the
            common 1-2 line case) — the height a few lines down was
            reduced by the same amount this saved, not further. */}
        <h3 className="text-[13px] font-extrabold leading-[1.18] line-clamp-3" style={{color:NAVY}}>{item.problem}</h3>
        <p className="mt-1 text-[10.5px] leading-[1.4] line-clamp-3" style={{color:MUTED}}>{item.body}</p>
      </div>
    </Link>;
  };

  // Trimmed 2026-09-21: 278px (lg) at the previous pass covered the
  // worst case (a 3-line headline AND a 3-line body on the same card)
  // with ~23px to spare — real, but most cards only use 1-2 lines each,
  // so that margin showed up as empty white space under the text on
  // every card that wasn't the worst case. Recomputed from the actual
  // measured line heights (3-line h3 46px + 6px gap + 3-line p 44px +
  // 24px padding = 120px text zone + 135px image = 255px minimum) and
  // set lg to 260px — ~5px of real margin, not 23, still never clips
  // the worst case. Other two breakpoints trimmed by the same 18px
  // delta without separately re-measuring their own image heights.
  //
  // Trimmed again same day: still read as "a little overdone" below the
  // text for the common 1-2 line case. Rather than shrink the box below
  // its real floor (which would clip the rare 3-line+3-line card again —
  // line-clamp caps the max, it doesn't shrink text to fit whatever
  // height is left), lowered the floor itself: text-box padding and the
  // h3-p gap were trimmed by 10px combined, so the true minimum is now
  // 245px. Set lg to 250px (same ~5px margin as before, just recomputed
  // against the new, lower floor) and carried the same -10px through the
  // other two breakpoints.
  return <div className="relative h-[292px] md:h-[329px] lg:h-[250px] hover:z-30 focus-within:z-30" style={{perspective:'1400px'}}><div className="absolute inset-0" style={{transformStyle:'preserve-3d',transition:reducedMotion?'none':'transform 2325ms cubic-bezier(.22,.61,.28,1)',transform:`rotateY(${side*180}deg)`}}>{face(faces[0],0)}{face(faces[1],1)}</div></div>;
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
            <div className="text-[8px] uppercase tracking-[.16em] font-bold text-slate-600">Explore</div>
            <h2 className="mt-1 text-[24px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>Tool Scramble</h2>
            <p className="mt-1 text-[11px] max-w-md" style={{color:MUTED}}>Some DeftBrain tool taglines. Click for more.</p>
          </div>
          <button type="button" onClick={()=>setSeed(s=>s+1)} className="rounded-lg px-3.5 py-2 text-[10px] font-bold text-white whitespace-nowrap" style={{background:NAVY}}>↻ Scramble more</button>
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
                    <b className="block text-[11px] leading-tight" style={{color:accent}}>{t.tagline}</b>
                    <em className="block not-italic text-[9px] mt-0.5 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity" style={{color:NAVY}}>{t.title} →</em>
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
                <div
                  className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 w-[240px] sm:w-[360px] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100"
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
                    <div className="mt-2 text-center text-[11px] font-extrabold" style={{color:accent}}>{t.title}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <button type="button" onClick={() => onBrowse()} className="text-[10px] font-bold underline underline-offset-4" style={{color:NAVY}}>Browse all {TOOL_COUNT_LABEL} tools →</button>
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

export default function HomeIntro({ allTools=[], onBrowse }) {
  const byId = useMemo(() => new Map(allTools.map(t => [t.id,t])), [allTools]);
  // Counts for the category chips below — same source DashBoard's own
  // filter pills use, so the numbers can't drift between the two views.
  const categoryCounts = useMemo(() => {
    const counts = {};
    allTools.forEach(t => (t.categories || []).forEach(cat => { counts[cat] = (counts[cat] || 0) + 1; }));
    return counts;
  }, [allTools]);
  const available = useMemo(() => ROTATION.filter(x => byId.has(x.toolId)), [byId]);
  // Reduced from 6, settled on 8 (2026-09-21) — the carousel now shares
  // the promoted hero zone with the category grid instead of running
  // full-width. Grid is 4 columns at sm:+ (see JSX below), so PAGE_SIZE=8
  // renders as two full rows of 4, not one — the taller card fix freed
  // enough room for a second row to fit without the section overrunning.
  // Below sm: (real phones), the grid drops to 2 columns — a fixed 4 was
  // never made responsive, so a 375-430px screen was splitting into
  // ~85px columns and force-breaking every headline mid-word ("So met
  // hi..." for "Something...") — found live on a phone screenshot
  // 2026-09-21. 2 columns still renders 8 as 4 rows, just taller.
  // Still cycles through all of ROTATION via the same auto-rotate +
  // manual paging, just 8 doors at a time instead of 6.
  const PAGE_SIZE = 8;
  const [slots,setSlots] = useState(() => Array.from({length:PAGE_SIZE},(_,i)=>i));
  const [incoming,setIncoming] = useState(() => Array(PAGE_SIZE).fill(null));
  const [tokens,setTokens] = useState(() => Array(PAGE_SIZE).fill(0));
  const [paused,setPaused] = useState(false);
  const [reducedMotion,setReducedMotion] = useState(false);
  const [page,setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(available.length / PAGE_SIZE));

  useEffect(()=>{ const mq=window.matchMedia('(prefers-reduced-motion: reduce)'); const sync=()=>setReducedMotion(mq.matches); sync(); mq.addEventListener?.('change',sync); return()=>mq.removeEventListener?.('change',sync); },[]);
  useEffect(()=>{ const vis=()=>setPaused(document.hidden); document.addEventListener('visibilitychange',vis); return()=>document.removeEventListener('visibilitychange',vis); },[]);
  useEffect(()=>{
    if(paused || available.length<=PAGE_SIZE) return;
    const timer=window.setInterval(()=>{
      const slot=Math.floor(Math.random()*PAGE_SIZE);
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

  const toolFor=id=>byId.get(id);

  // "See it in action" examples: two picked per page load (owner feedback
  // 2026-09-21 — one example alone left the section's width mostly empty
  // padding for what it actually showed). Reuses seededShuffle (same one
  // ToolScramble uses) rather than hand-rolling a "pick 2 distinct indices"
  // — it already guarantees no duplicate and a stable order for a given
  // seed. The seed starts random (one useState call) so a fresh page load
  // doesn't always open on the same pair, but setSeeItSeed is exposed so a
  // button can advance it too (owner asked to change tools without a
  // reload) — same "bump a seed, let useMemo re-derive" shape as
  // ToolScramble's own "↻ Scramble more", just one increment instead of a
  // full re-shuffle of 42 tiles.
  const seeItEligible = useMemo(() => SEE_IT_EXAMPLES.filter(x => byId.has(x.toolId)), [byId]);
  const [seeItSeed, setSeeItSeed] = useState(() => Math.floor(Math.random() * 1000));
  const seeItPair = useMemo(() => seededShuffle(seeItEligible, seeItSeed).slice(0, 2), [seeItEligible, seeItSeed]);

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
    {/* Hero rework (2026-09-21): was two stacked sections — a search-first
        hero, then a separate "What's on your mind?" carousel below it,
        both asking the same visitor to describe their situation twice in
        a row. Owner's call: a first-time visitor doesn't know DeftBrain's
        vocabulary yet, so recognizing a written example ("Something in my
        lease looks wrong") costs nothing, while composing a free-text
        query to an unfamiliar site is real friction — recognition over
        recall. Merged into one hero: the cards are now the lead action,
        search is an appended "or" option, not the headline one. The hero
        image is untouched — same position, same proportions, still doing
        the only photographic "what this looks like" work on the page. */}
    <section className="rounded-2xl overflow-hidden border bg-white" style={{borderColor:BORDER}}>
      <div className="grid lg:grid-cols-[.92fr_1.08fr]">
        <div className="px-6 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8 flex flex-col justify-center">
          <h2 className="text-[30px] sm:text-[34px] lg:text-[38px] leading-[.98] tracking-[-.035em] font-bold max-w-[560px]" style={{fontFamily:SERIF,color:INK}}>Life doesn’t come with instructions.</h2>
          {/* Charter 4.5 amendment (2026-09-23): DeftBrain doesn't presume
              there is one next step — it helps people discover possibilities
              and decide for themselves. This line dropped the earlier
              "AI-powered... results you can have confidence in" framing,
              which named AI directly and asserted a single confident
              outcome; "shine light on... uncertainties and possibilities"
              carries the wider-field-of-view idea instead. AI transparency
              still lives on this page, just further down (the "AI can be
              wrong, confidently" disclaimer near the tool grid), so this
              sentence no longer needs to carry that job too. */}
          <p className="mt-3 text-[15px] sm:text-base max-w-[470px]" style={{color:NAVY}}>DeftBrain is a collection of single-purpose tools that shine light on life's uncertainties and possibilities.</p>
          {/* Plain <a>, not <Link>: /privacy is a static prerendered page
              (public/privacy.html), not a React Router route — a <Link> here
              would fall through to the catch-all /:toolId route and 404, the
              same bug already fixed for /guides and /about (see Footer.js and
              RelatedLinks.js, which use the same convention for this exact
              reason). */}
          <p className="mt-3 text-[11px] font-bold" style={{color:NAVY}}>Free · No account · <a href="/privacy" className="underline underline-offset-2">Nothing you type is stored on our servers</a></p>
        </div>
        <HeroImage paused={paused} reducedMotion={reducedMotion} />
      </div>

      {/* Promoted from its own section — this is now the hero's lead
          action, not a follow-up to search. Was also "Some of our most
          popular tools"'s gradient treatment (that section got removed
          outright: its list was the exact same 6 tools as ROTATION[0..5],
          just reordered — a first-time visitor saw the same six twice on
          first paint).

          Split two ways (2026-09-21), search moved out entirely (now the
          persistent bar in DashBoard.js's header — see that file):
          situations on the left answer "recognize yourself in an example";
          categories on the right answer "I already know the general area."
          Different jobs, same visitor decision — which is why they sit
          side by side instead of stacked as two more homepage sections.
          Swapped sides again (2026-09-21) — situations left, categories
          right — with the grid proportions swapped to match (wide side
          now under the 4-across cards, narrow side under the pills).

          Two separate cards, not one shared gradient (2026-09-21): each
          gets its own rounded border + gradient, split from what used to
          be one continuous gradient (warm half for situations, cool half
          for categories) — reinforces "two different paths" instead of
          implying one continuous thing. Browse all tools moved inside the
          categories card specifically, as its closing line. */}
      <div className="p-5 sm:p-6 border-t" style={{borderColor:BORDER}}>
        <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-5">
          <div className="rounded-2xl border p-4 sm:p-5" style={{borderColor:BORDER,background:'linear-gradient(120deg,#fff0cf 0%,#f8ddd7 100%)'}} onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)}>
            <div className="mb-4"><h2 className="text-[20px] sm:text-[22px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>What’s on your mind?</h2><p className="mt-1 text-[11px]" style={{color:MUTED}}>DeftBrain helps you explore the possibilities.</p></div>
            <div className="relative">
              {totalPages>1 && <button type="button" onClick={()=>goToPage(page-1)} aria-label="Previous tools" className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border shadow-sm items-center justify-center text-[15px] hover:shadow-md" style={{borderColor:BORDER,color:NAVY}}>‹</button>}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">{slots.map((idx,slot)=>{const current=available[idx%Math.max(available.length,1)];return <DoorCard key={slot} initial={current} incoming={incoming[slot]} toolFor={toolFor} flipToken={tokens[slot]} reducedMotion={reducedMotion}/>;})}</div>
              {totalPages>1 && <button type="button" onClick={()=>goToPage(page+1)} aria-label="More tools" className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border shadow-sm items-center justify-center text-[15px] hover:shadow-md" style={{borderColor:BORDER,color:NAVY}}>›</button>}
            </div>
            {totalPages>1 && <div className="flex justify-center gap-1.5 mt-4">{Array.from({length:totalPages}).map((_,i)=><button key={i} type="button" onClick={()=>goToPage(i)} aria-label={`Go to tools page ${i+1}`} className="rounded-full transition-all duration-300" style={{width:i===page?16:6,height:6,background:i===page?NAVY:'#ddd4c6'}}/>)}</div>}
          </div>

          {/* Wrapper (2026-09-22) is the actual grid item now, not the
              card itself — added so the guide intro below could sit
              OUTSIDE the categories card (owner: "guides are separate
              from tool categories") while still living in this column's
              white space rather than starting a whole new grid row.
              self-start moved from the card to here for the same reason
              as before: default align-items:stretch would otherwise
              stretch this wrapper's card to match the taller situations
              column. */}
          <div id="categories" className="self-start flex flex-col gap-4" style={{scrollMarginTop:20}}>
            {/* Cropped to its own content height, not stretched to match
                the cards column: stretching (the outer grid's default
                align-items:stretch) plus bottom-aligning the pills inside
                that stretched height (content-end) left a large,
                genuinely awkward gap between the "Categories" heading and
                the first pill row — filling that gap "well" isn't really
                possible when the pill block is just shorter than the
                cards column's natural height. Pills are a plain top-down
                flow (no content-end/flex-1 — nothing left for either to
                do once the card isn't being forced taller than its
                content). */}
            <div className="rounded-2xl border p-4 sm:p-5 flex flex-col" style={{borderColor:BORDER,background:'linear-gradient(120deg,#e9e1f5 0%,#d7ebf7 100%)'}}>
              <div className="mb-4"><h2 className="text-[20px] sm:text-[22px] font-bold" style={{fontFamily:SERIF,color:NAVY}}>Categories</h2></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-4 justify-items-start">
                {CATEGORY_META.map(cat => {
                  const count = categoryCounts[cat.name] || 0;
                  if (!count) return null;
                  // title = the researched per-category example (now on
                  // CATEGORY_META itself, see src/data/categoryMeta.js)
                  // — the pill has no room to show it, but it's not wasted: a
                  // hover reveals the "oh, that might be useful" line instead
                  // of a bare category name.
                  //
                  // onClick passes the category's real /tools/{slug} page
                  // (2026-09-22) — previously passed cat.name to onBrowse,
                  // which routed to /tools?category=X (an in-page filter on
                  // the flat browse page). Now that every category has its
                  // own crawlable page, a homepage pill should land a visitor
                  // there directly rather than on a filtered view of /tools.
                  //
                  // grid-cols-1 below sm: (found live on a phone screenshot
                  // 2026-09-21) — the label span is whitespace-nowrap, and a
                  // 2-column grid on a ~350px-wide card gives each track
                  // ~170px, too narrow for "Home & Daily Life"/"Health &
                  // Wellness"/etc. Grid items default to min-width:auto, so
                  // the nowrap label doesn't shrink or wrap — it just
                  // overflows its track and visually overlaps the pill next
                  // to it. One column gives every pill the full card width.
                  return (
                    <button key={cat.name} type="button" onClick={()=>onBrowse(cat.slug)} title={cat.example} className="flex items-center gap-2 rounded-full border bg-white/70 px-3.5 py-1.5 hover:border-[#142a43] hover:bg-white transition" style={{borderColor:BORDER}}>
                      <span className="text-[18px]" aria-hidden="true">{cat.emoji}</span>
                      <span className="text-[12px] font-semibold whitespace-nowrap" style={{color:NAVY}}>{cat.name}</span>
                      <span className="text-[10px] font-semibold" style={{color:MUTED}}>{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t" style={{borderColor:'#c9c1e0'}}>
                <button type="button" onClick={() => onBrowse()} className="text-[11px] font-semibold underline underline-offset-4" style={{color:NAVY}}>Browse all {TOOL_COUNT_LABEL} tools →</button>
              </div>
            </div>

            {/* Guide intro (2026-09-22) — deliberately its own plain block,
                not inside the categories card: guides aren't a category,
                they're a separate, parallel way to get an answer (read
                instead of run a tool), so giving it the categories card's
                purple/blue gradient would have implied otherwise. Sits in
                this column's own leftover white space below the card
                instead. Plain <a>, not <Link>: /guides is a static
                prerendered page, not a React Router route — same
                convention as the dedicated guides section further down
                the page and Footer.js. */}
            <div>
              <p className="text-[13.5px] leading-relaxed" style={{color:MUTED}}>Browse our library of useful guides, brief articles written to answer common questions that arise in every category. <a href="/guides" className="font-semibold underline underline-offset-4" style={{color:NAVY}}>Browse DeftBrain guides →</a></p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {seeItPair.length > 0 && <section className="my-8 rounded-2xl border overflow-hidden" style={{borderColor:'#dce7ee',background:'linear-gradient(110deg,#eef7fb,#f8fbfd)'}}>
      {/* Was a single photo with one tool's exchange baked into it as
          legible pixels (see SEE_IT_EXAMPLES above for why that couldn't
          rotate), then a single rendered mockup. Now two side by side
          (2026-09-21, owner feedback): one example left a tall column
          mostly empty for what it showed, and gave no sense that the
          catalog is more than one trick. items-start (not the grid
          default stretch) + no vertical-centering on the text column —
          same fix as the Categories card above: let each side be exactly
          as tall as its own content instead of stretching to match
          whichever side is taller. */}
      <div className="grid items-start lg:grid-cols-[.62fr_1.38fr]">
        <div className="p-5 sm:p-6">
          <h2 className="text-[25px] sm:text-[29px] font-bold leading-[1.05]" style={{fontFamily:SERIF,color:NAVY}}>See it in action</h2>
          <p className="mt-2 text-[12.5px] leading-snug" style={{color:MUTED}}>Tell DeftBrain what’s happening. Get something useful.</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button type="button" onClick={()=>setSeeItSeed(s=>s+1)} className="rounded-lg px-3.5 py-2 text-[10px] font-bold text-white whitespace-nowrap" style={{background:NAVY}}>↻ Show different tools</button>
            <button onClick={() => onBrowse()} className="text-[10px] font-bold underline underline-offset-4" style={{color:NAVY}}>Explore more tools →</button>
          </div>
        </div>
        <div className="p-5 sm:p-6 lg:pl-0 grid sm:grid-cols-2 gap-3.5">
          {seeItPair.map(ex => {
            const tool = toolFor(ex.toolId);
            return (
              <div key={ex.toolId} className="rounded-2xl border shadow-sm overflow-hidden bg-white flex flex-col" style={{borderColor:BORDER}}>
                <div className="px-3.5 pt-3 pb-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wide" style={{color:MUTED}}>You type</p>
                  <p className="mt-0.5 text-[11px] leading-snug" style={{color:NAVY}}>{ex.input}</p>
                </div>
                {/* A real screenshot (see SEE_IT_EXAMPLES above), not a
                    mockup — cropped to a fixed-height window with a
                    fade-to-white at the bottom and a "keeps going" label,
                    so it reads honestly as the TOP of a longer page rather
                    than the page's whole content. This is the direct fix
                    for "gives no clue to the depth of content a user
                    sees": the fade is doing the opposite job a fade
                    usually does on this site (elsewhere it eases a photo
                    in — here it's telling the reader there's more below
                    the cut, on purpose). */}
                <Link to={`/${tool.id}`} className="relative block h-[230px] overflow-hidden border-t group/shot" style={{borderColor:BORDER}}>
                  <img src={ex.shot} alt={`The top of ${tool.title}'s real result — click to try it yourself`} loading="lazy" className="w-full h-full object-cover object-top transition group-hover/shot:brightness-95" />
                  <div className="absolute inset-x-0 bottom-0 h-14 pointer-events-none" style={{background:'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,.98))'}} />
                  <div className="absolute inset-x-0 bottom-1.5 text-center text-[9px] font-bold uppercase tracking-wide" style={{color:MUTED}}>keeps going ↓</div>
                </Link>
                <div className="mt-auto px-3.5 py-2.5">
                  <Link to={`/${tool.id}`} className="text-[10px] font-bold" style={{color:NAVY}}>Try {tool.title} →</Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>}

    <ToolScramble allTools={allTools} onBrowse={onBrowse} />

    <section className="py-7"><div className="rounded-2xl border overflow-hidden" style={{borderColor:BORDER,background:'linear-gradient(120deg,#ffe9d6 0%,#fdf3ea 30%,#fbf7f1 60%,#fffaf2 100%)'}}><div className="grid lg:grid-cols-[.62fr_1.38fr]"><div className="p-6 sm:p-7"><div className="text-[8px] uppercase tracking-[.16em] font-bold text-slate-500">More than one kind of problem</div><h2 className="mt-2 text-[25px] font-bold leading-tight" style={{fontFamily:SERIF,color:NAVY}}>There’s probably a DeftBrain for that.</h2><p className="mt-2 text-[10.5px] leading-relaxed" style={{color:MUTED}}>Skip the category — scan for whatever sounds like your day.</p><button onClick={() => onBrowse()} className="mt-4 text-[10px] font-bold underline underline-offset-4" style={{color:NAVY}}>Browse all {TOOL_COUNT_LABEL} tools →</button></div><div className="relative min-h-[205px] px-5 py-6 flex flex-wrap content-center justify-center gap-x-4 gap-y-2 bg-white/30">{PROBLEM_CLOUD.map(([x,toolId],i)=>{const colors=['#c94f45','#1f6f78','#d28a2e','#6c5aa8','#3f7b4d','#b14f78','#2e5f9e'];const deg=[-5,3,-2,5,-4,2,4][i%7];return <Link key={x} to={`/${toolId}`} className="inline-block font-bold whitespace-nowrap hover:underline underline-offset-2" style={{fontFamily:i%4===0?SERIF:'inherit',fontSize:`${9+(i%5)*0.8}px`,color:colors[i%colors.length],transform:`rotate(${deg}deg)`,opacity:.88}}>{x}</Link>})}</div></div></div></section>


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
          <p className="mt-2 text-[11.5px] leading-relaxed" style={{color:MUTED}}>Nothing you type into a tool is stored on our servers. No accounts. The only cookies are Google Analytics’, which never see what you type. <a href="/privacy" className="!no-underline hover:!underline underline-offset-2 font-semibold" style={{color:NAVY}}>Read the privacy policy →</a></p>
        </details>
        <details className="group py-3">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-3 text-[13px] font-semibold" style={{color:NAVY}}>
            What’s the catch — how is it free?
            <Caret groupOpen className="ms-auto" />
          </summary>
          <p className="mt-2 text-[11.5px] leading-relaxed" style={{color:MUTED}}>There isn’t one. DeftBrain is free to use — no ads, no account, nothing to buy. We’re focused on making DeftBrain genuinely useful before we think about how — or whether — to charge for anything. And an ad-supported or data-selling model would work against the whole point: you should be able to trust us with a lease, a diagnosis, or a hard conversation without wondering what we’re getting out of what you typed.</p>
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
