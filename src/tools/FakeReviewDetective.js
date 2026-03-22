import React, { useState, useCallback, useMemo } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { CopyBtn, PrintBtn, ActionBar } from '../components/ActionButtons';


// ════════════════════════════════════════════════════════════
// REVIEW PARSER — all JavaScript, no AI
// ════════════════════════════════════════════════════════════
const GENERIC_PRAISE = ['best ever','amazing','love it','love this','loved it','highly recommend','five stars','5 stars','must buy','must have',"don't hesitate",'do not hesitate',"won't regret",'will not regret','game changer','life changing','life changer','blown away','exceeded expectations','absolutely love','perfect product','couldn\'t be happier','best purchase','buy this now','worth every penny'];
const SPECIFIC_DETAIL_PATTERNS = [/\d+\s*(hours?|hrs?|minutes?|mins?|days?|weeks?|months?|years?|inches?|in|cm|mm|ft|feet|lbs?|kg|g|oz|ml|watts?|mah|gb|tb|mb)/i,/\b(after|for)\s+\d+\s*(hours?|days?|weeks?|months?|years?)/i,/\b(battery|screen|display|weight|size|dimension|resolution|speed|capacity|voltage)\b/i,/\b(compared to|better than|worse than|similar to|unlike|switch from|switched from)\b/i,/\b(i use(d)? (this|it|them) for)\b/i,/\b(after \d+ (months?|weeks?|years?) of use)\b/i];
const COMPETITOR_PATTERNS = [/\b(better than|worse than|compared to|unlike|switch(ed)? from|go with)\b.*\b[A-Z][a-z]+\b/i,/\b[A-Z][a-z]+\b.*(is|was|much) better/i];
const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5 };

function parseStarRating(text) {
  const f = (text.match(/⭐/g)||[]).length; if (f>=1&&f<=5) return f;
  const b = (text.match(/★/g)||[]).length; if (b>=1&&b<=5) return b;
  let m = text.match(/(\d)\s*\/\s*5/); if (m) return Math.min(5,Math.max(1,parseInt(m[1])));
  m = text.match(/(\d)\s*stars?/i); if (m) return Math.min(5,Math.max(1,parseInt(m[1])));
  m = text.match(/\b(one|two|three|four|five)\s*stars?\b/i); if (m) return NUMBER_WORDS[m[1].toLowerCase()];
  m = text.match(/(\d)\s*out\s*of\s*5/i); if (m) return Math.min(5,Math.max(1,parseInt(m[1]))); return null;
}
function parseDaysAgo(text) {
  const l=text.toLowerCase(); if (/\btoday\b/.test(l)||/\bjust now\b/.test(l)) return 0; if (/\byesterday\b/.test(l)) return 1;
  let m=l.match(/(\d+)\s*(day|week|month|year)s?\s*ago/); if(m){const n=parseInt(m[1]),u=m[2];return u==='day'?n:u==='week'?n*7:u==='month'?n*30:n*365;}
  m=l.match(/\ba\s*(day|week|month|year)\s*ago/); if(m){const u=m[1];return u==='day'?1:u==='week'?7:u==='month'?30:365;}
  for(const p of [/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s*(\d{4})/i,/\b(\d{1,2})\/(\d{1,2})\/(\d{4})/,/\b(\d{4})-(\d{1,2})-(\d{1,2})/]){m=text.match(p);if(m)try{const d=new Date(m[0]);if(!isNaN(d.getTime()))return Math.max(0,Math.round((Date.now()-d.getTime())/86400000));}catch{}}
  return null;
}
function splitIntoReviews(t){t=t.trim();if(!t)return[];let s=t.split(/(?=^⭐)/m).filter(x=>x.trim());if(s.length>1)return s.map(x=>x.trim());s=t.split(/(?=^[★☆])/m).filter(x=>x.trim());if(s.length>1)return s.map(x=>x.trim());s=t.split(/(?=^\d\s*\/\s*5)|(?=^\d\s*stars?\b)|(?=^\d\s*out\s*of\s*5)/mi).filter(x=>x.trim());if(s.length>1)return s.map(x=>x.trim());s=t.split(/\n\s*\n/).filter(x=>x.trim());if(s.length>1)return s.map(x=>x.trim());return[t];}
function parseReview(raw,idx){const w=raw.split(/\s+/).filter(x=>x.length>0),wc=w.length,lt=raw.replace(/[^a-zA-Z]/g,''),up=raw.replace(/[^A-Z]/g,''),cr=lt.length>0?up.length/lt.length:0,ec=(raw.match(/!/g)||[]).length,lo=raw.toLowerCase(),hsd=SPECIFIC_DETAIL_PATTERNS.some(p=>p.test(raw)),gh=GENERIC_PRAISE.filter(p=>lo.includes(p)).length,hgp=gh>=2&&wc<40&&!hsd,mc=COMPETITOR_PATTERNS.some(p=>p.test(raw));return{index:idx,rawText:raw,starRating:parseStarRating(raw),isVerified:/verified\s*(purchase|buyer)|confirmed\s*purchase/i.test(raw),daysAgo:parseDaysAgo(raw),wordCount:wc,charCount:raw.length,exclamationCount:ec,capsRatio:Math.round(cr*100)/100,hasSpecificDetails:hsd,hasGenericPraise:hgp,genericHits:gh,mentionsCompetitor:mc};}
function computeAggregateStats(reviews){const t=reviews.length,sd={1:0,2:0,3:0,4:0,5:0};let rc=0,rs=0,vc=0,sc=0,tw=0,hc=0,he=0,gc=0,spc=0;for(const r of reviews){if(r.starRating){sd[r.starRating]++;rc++;rs+=r.starRating;}if(r.isVerified)vc++;if(r.wordCount<15)sc++;tw+=r.wordCount;if(r.capsRatio>0.3)hc++;if(r.exclamationCount>=3)he++;if(r.hasGenericPraise)gc++;if(r.hasSpecificDetails)spc++;}const ar=rc>0?Math.round(rs/rc*10)/10:null;let sv=null;if(rc>=2&&ar){let s2=0;for(const r of reviews)if(r.starRating)s2+=Math.pow(r.starRating-ar,2);sv=Math.round(Math.sqrt(s2/rc)*100)/100;}const dt=reviews.filter(r=>r.daysAgo!==null).sort((a,b)=>a.daysAgo-b.daysAgo),cls=[];let i=0;while(i<dt.length){const cl=[dt[i]];let j=i+1;while(j<dt.length&&dt[j].daysAgo-dt[j-1].daysAgo<=2){cl.push(dt[j]);j++;}if(cl.length>=3)cls.push({daysAgoRange:cl[0].daysAgo===cl[cl.length-1].daysAgo?`${cl[0].daysAgo} days ago`:`${cl[0].daysAgo}-${cl[cl.length-1].daysAgo} days ago`,count:cl.length,indices:cl.map(r=>r.index)});i=j;}return{totalReviews:t,starDistribution:sd,averageRating:ar,starDeviation:sv,ratedCount:rc,verifiedCount:vc,unverifiedCount:t-vc,verifiedPercent:t>0?Math.round(vc/t*1000)/10:0,avgWordCount:t>0?Math.round(tw/t):0,shortReviewCount:sc,dateClusters:cls,hasTimingCluster:cls.length>0,highCapsCount:hc,highExclamationCount:he,genericPraiseCount:gc,specificDetailCount:spc};}

// ════════════════════════════════════════════════════════════
// SCORE HELPERS
// ════════════════════════════════════════════════════════════
const trustColor = s => s>=76?{bg:'rgb(16,185,129)',ring:'rgb(16,185,129)'}:s>=51?{bg:'rgb(132,204,22)',ring:'rgb(132,204,22)'}:s>=26?{bg:'rgb(245,158,11)',ring:'rgb(245,158,11)'}:{bg:'rgb(239,68,68)',ring:'rgb(239,68,68)'};
const verdictLabel = s => s>=76?'Reviews Look Genuine':s>=51?'Mostly Trustworthy':s>=26?'Approach with Caution':'Likely Manipulated';
const edgeColor = s => s>=60?'border-l-emerald-500':s>=40?'border-l-amber-500':'border-l-red-500';
const badgeBg = s => s>=60?'bg-emerald-500 text-white':s>=40?'bg-amber-500 text-white':'bg-red-500 text-white';
function sampleConfidence(n){if(n>=15)return{level:'high',label:'High Confidence',color:'green',note:'Strong sample'};if(n>=8)return{level:'medium',label:'Medium',color:'amber',note:`${n} reviews`};if(n>=3)return{level:'low',label:'Low',color:'red',note:`Only ${n} reviews`};return{level:'very_low',label:'Very Low',color:'red',note:`Only ${n} — directional only`};}

const CATEGORIES = ['Electronics','Home & Kitchen','Beauty','Fashion','Sports','Books','Health','Food','Toys','Automotive','Other'];
const SOURCE_PRESETS = ['Amazon','Best Buy','Walmart','Target','Reddit','YouTube','Other'];
const EXAMPLE_REVIEWS = `⭐⭐⭐⭐⭐ AMAZING product!!! Best headphones I've EVER bought!! You NEED these!! Don't hesitate, just buy them NOW!!!\n- Posted 2 days ago\n\n⭐⭐⭐⭐⭐ Absolutely love these! Five stars! Best purchase ever! Highly recommend to everyone!\n- Posted 2 days ago\n\n⭐⭐⭐⭐⭐ Perfect! Must buy! Game changer!!!\n- Posted 2 days ago\n\n⭐⭐⭐⭐ Decent wireless headphones for the price. Sound quality is solid — bass is a bit weak compared to my old Sony WH-1000XM4s, but the mids are clear. Battery lasts about 8 hours with ANC on. The ear cushions get warm after 2 hours but overall comfortable. Build quality feels plasticky.\n- Verified Purchase, Posted 1 month ago\n\n⭐⭐⭐ They work fine for calls and casual listening. There's a noticeable hissing sound when Bluetooth is connected but no audio is playing. ANC blocks maybe 60% of outside noise — decent for the $45 price point. I've been using them daily for 3 weeks and the left earcup creaks when I adjust them.\n- Verified Purchase, Posted 3 weeks ago\n\n⭐ TERRIBLE. Don't buy these garbage headphones. Worst audio I've ever heard. Save your money and get SoundMax Pro instead — those are 10x better for the same price. Complete waste of money.\n- Posted 3 days ago\n\n⭐⭐⭐⭐⭐ Great sound and comfortable. My daughter uses them for school and loves them. Good battery life.\n- Posted 1 week ago\n\n⭐⭐ Broke after 2 months of daily use. The headband snapped where it connects to the right earcup. I contacted support and they said it's out of warranty because I bought from a third-party seller. Disappointing because the sound was actually decent while they lasted.\n- Verified Purchase, Posted 2 months ago`;

// ════════════════════════════════════════════════════════════
// INLINE HIGHLIGHTING
// ════════════════════════════════════════════════════════════
function highlightText(text, c) {
  if (!text) return null;
  const lo = text.toLowerCase(), spans = [];
  GENERIC_PRAISE.forEach(p => { let i = lo.indexOf(p); while (i !== -1) { spans.push({ start: i, end: i + p.length, cls: c.hlGeneric, t: 'generic' }); i = lo.indexOf(p, i + 1); } });
  let m; const cr = /\b[A-Z]{3,}\b/g; while ((m = cr.exec(text))) spans.push({ start: m.index, end: m.index + m[0].length, cls: c.hlFake, t: 'caps' });
  const er = /!{2,}/g; while ((m = er.exec(text))) spans.push({ start: m.index, end: m.index + m[0].length, cls: c.hlFake, t: 'excl' });
  COMPETITOR_PATTERNS.forEach(p => { const mx = p.exec(text); if (mx) spans.push({ start: mx.index, end: mx.index + mx[0].length, cls: c.hlCompetitor, t: 'competitor' }); });
  if (!spans.length) return null;
  spans.sort((a, b) => a.start - b.start);
  const mg = []; for (const s of spans) { if (mg.length && s.start < mg[mg.length - 1].end) { mg[mg.length - 1].end = Math.max(mg[mg.length - 1].end, s.end); mg[mg.length - 1].cls = s.cls; } else mg.push({ ...s }); }
  const parts = []; let pos = 0;
  mg.forEach((s, i) => { if (pos < s.start) parts.push(<span key={`t${i}`}>{text.slice(pos, s.start)}</span>); parts.push(<mark key={`h${i}`} className={`${s.cls} rounded px-0.5`} title={s.t === 'generic' ? 'Generic praise' : s.t === 'caps' ? 'ALL CAPS' : s.t === 'competitor' ? 'Competitor' : 'Punctuation'}>{text.slice(s.start, s.end)}</mark>); pos = s.end; });
  if (pos < text.length) parts.push(<span key="tail">{text.slice(pos)}</span>);
  return parts;
}

// ════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════
function StatCard({ label, value, color = 'neutral', c }) {
  const vc = color === 'green' ? c.success : color === 'red' ? c.danger : color === 'amber' ? c.warning : c.text;
  return <div className={`${c.statCard} border rounded-lg p-3 text-center`}><p className={`text-[10px] font-bold ${c.textMuteded} uppercase`}>{label}</p><p className={`text-lg font-black mt-0.5 ${vc}`}>{value}</p></div>;
}

function ReviewCard({ review, expanded, onToggle, c, isDark, fpGroup }) {
  const score = review.authenticity_score ?? 50;
  const vt = review.verdict === 'likely_fake' ? '🔴 Likely Fake' : review.verdict === 'likely_genuine' ? '🟢 Likely Genuine' : '🟡 Uncertain';
  const hl = useMemo(() => expanded ? highlightText(review.rawText, c) : null, [expanded, review.rawText, c]);

  return (
    <div className={`${c.card} border rounded-xl border-l-4 ${edgeColor(score)} overflow-hidden`}>
      <button onClick={onToggle} className="w-full p-4 text-left">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {review.starRating && <span className="text-xs">{'⭐'.repeat(review.starRating)}{'☆'.repeat(5 - review.starRating)}</span>}
              <span className={`text-[10px] font-bold ${c.textMuteded}`}>{vt}</span>
              {fpGroup && <span className={`${c.pillCyan} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>👥 Group {fpGroup}</span>}
            </div>
            <p className={`text-xs ${c.textSecondaryondary} ${expanded ? '' : 'line-clamp-2'}`}>{review.rawText.slice(0, expanded ? undefined : 200)}{!expanded && review.rawText.length > 200 ? '...' : ''}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {(review.red_flags || []).slice(0, expanded ? undefined : 2).map((f, i) => <span key={`r${i}`} className={`${c.danger} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>{f}</span>)}
              {(review.green_flags || []).slice(0, expanded ? undefined : 2).map((f, i) => <span key={`g${i}`} className={`${c.success} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>{f}</span>)}
              {!expanded && <>{review.isVerified && <span className={`${c.success} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>Verified</span>}{review.wordCount && <span className={`${c.pillGray} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>{review.wordCount}w</span>}</>}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 flex-shrink-0"><div className={`w-10 h-10 rounded-full ${badgeBg(score)} flex items-center justify-center`}><span className="text-xs font-black">{score}</span></div><span className={`text-xs ${c.textMuteded}`}>{expanded ? '▲' : '▼'}</span></div>
        </div>
        {expanded && <div className={`mt-3 pt-3 border-t ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
          <div className={`${c.quoteBg} p-3 rounded-lg mb-3`}><p className={`text-xs ${c.textSecondaryondary} italic whitespace-pre-wrap`}>{hl || `"${review.rawText}"`}</p></div>
          {hl && <p className={`text-[9px] ${c.textMuteded} mb-2`}><span className={`${c.hlGeneric} rounded px-0.5`}>generic</span> <span className={`${c.hlFake} rounded px-0.5`}>emphasis</span> <span className={`${c.hlCompetitor} rounded px-0.5`}>competitor</span></p>}
          {review.one_liner && <p className={`text-xs font-semibold ${c.text} mb-2`}>🔍 {review.one_liner}</p>}
          <div className="flex flex-wrap gap-1">
            {review.isVerified ? <span className={`${c.success} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>Verified</span> : <span className={`${c.danger} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>Unverified</span>}
            <span className={`${c.pillGray} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>{review.wordCount}w</span>
            {review.daysAgo != null && <span className={`${c.pillGray} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>{review.daysAgo === 0 ? 'Today' : `${review.daysAgo}d ago`}</span>}
            {review.hasSpecificDetails && <span className={`${c.success} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>Specific details</span>}
            {review.hasGenericPraise && <span className={`${c.danger} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>Generic praise</span>}
            {review.mentionsCompetitor && <span className={`${c.warning} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>Competitor</span>}
          </div>
        </div>}
      </button>
    </div>
  );
}

// FEATURE 2: Forensics Timeline
function ForensicsTimeline({ reviews, scores, c, isDark }) {
  const dated = reviews.filter(r => r.daysAgo !== null).sort((a, b) => b.daysAgo - a.daysAgo);
  if (dated.length < 2) return <p className={`text-xs ${c.textMuteded} text-center py-3`}>Need 2+ dated reviews for timeline</p>;
  const maxDays = Math.max(...dated.map(r => r.daysAgo), 1);
  const W = 100, H = 40, pad = 4;
  const x = (d) => pad + ((maxDays - d) / maxDays) * (W - pad * 2);
  const getScore = (idx) => { const s = scores?.find(sc => sc.index === idx); return s?.authenticity_score ?? 50; };
  const dotColor = (sc) => sc >= 60 ? 'rgb(16,185,129)' : sc >= 40 ? 'rgb(245,158,11)' : 'rgb(239,68,68)';
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 160 }}>
        <line x1={pad} x2={W - pad} y1={H - 6} y2={H - 6} stroke={isDark ? '#3f3f46' : '#e2e8f0'} strokeWidth="0.3" />
        {dated.map((r, i) => {
          const sc = getScore(r.index), cx = x(r.daysAgo), cy = H - 6 - (r.starRating || 3) / 5 * (H - 14);
          return <g key={i}><circle cx={cx} cy={cy} r="2.5" fill={dotColor(sc)} opacity="0.85" stroke={isDark ? '#18181b' : '#fff'} strokeWidth="0.5" />
            {r.isVerified && <circle cx={cx} cy={cy} r="3.5" fill="none" stroke="#10b981" strokeWidth="0.3" strokeDasharray="1,1" />}</g>;
        })}
        <text x={pad} y={H - 1.5} fontSize="2.5" fill={isDark ? '#71717a' : '#94a3b8'}>{maxDays}d ago</text>
        <text x={W - pad} y={H - 1.5} fontSize="2.5" fill={isDark ? '#71717a' : '#94a3b8'} textAnchor="end">Today</text>
      </svg>
      <div className="flex flex-wrap gap-3 justify-center text-[10px] mt-1">
        <span><span style={{ color: 'rgb(16,185,129)' }}>●</span> Genuine</span><span><span style={{ color: 'rgb(245,158,11)' }}>●</span> Uncertain</span><span><span style={{ color: 'rgb(239,68,68)' }}>●</span> Fake</span>
        <span><span style={{ border: '1px dashed #10b981', borderRadius: '50%', display: 'inline-block', width: 8, height: 8 }} /> Verified</span>
      </div>
    </div>
  );
}

// FEATURE 5: Paste Helper content
const PASTE_GUIDES = [
  { platform: 'Amazon', icon: '📦', steps: ['Go to the product page', 'Scroll to "Customer Reviews" section', 'Click "See all reviews" to get more', 'Select all review text (Ctrl+A in the reviews section)', 'Copy (Ctrl+C) and paste here'] },
  { platform: 'Best Buy', icon: '🏪', steps: ['Open the product page', 'Click the "Reviews" tab', 'Select and copy review text', 'Paste here — the tool handles the parsing'] },
  { platform: 'Walmart', icon: '🛒', steps: ['Open product page', 'Scroll to "Customer Reviews"', 'Click "See All Reviews"', 'Select all, copy, paste here'] },
  { platform: 'Reddit', icon: '💬', steps: ['Find a discussion thread about the product', 'Select relevant comments', 'Copy and paste — each paragraph becomes a "review"', 'Great for unbiased opinions!'] },
  { platform: 'General', icon: '🌐', steps: ['Separate reviews with a blank line between each', 'Include star ratings as ⭐ emoji if possible', 'Add "Verified Purchase" if known', 'Add posting dates like "Posted 3 days ago"', 'More info = better analysis'] },
];

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const FakeReviewDetective = ({ tool }) => {
  const { callToolEndpoint } = useClaudeAPI();
  const { isDark } = useTheme();

  const c = {
    card:          isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt:       isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    text:          isDark ? 'text-zinc-50' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-400' : 'text-gray-600',
    textMuted:     isDark ? 'text-zinc-500' : 'text-gray-400',
    input:         isDark ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-cyan-500/20' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500',
    border:        isDark ? 'border-zinc-700' : 'border-gray-200',
    btnPrimary:    isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    btnSecondary:  isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    btnOutline:    isDark ? 'border-zinc-600 hover:border-zinc-500 text-zinc-300' : 'border-gray-300 hover:border-gray-400 text-gray-700',
    danger:        isDark ? 'bg-red-900/20 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    success:       isDark ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning:       isDark ? 'bg-amber-900/20 border-amber-700/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800',
    highlight:     isDark ? 'bg-cyan-900/20 border-cyan-700/50 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-800',
    pillRed:       isDark ? 'bg-red-900/40 text-red-300 border-red-700/40' : 'bg-red-100 text-red-700 border-red-200',
    pillGreen:     isDark ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40' : 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pillGray:      isDark ? 'bg-zinc-700 text-zinc-400 border-zinc-600' : 'bg-gray-100 text-gray-500 border-gray-200',
    pillAmber:     isDark ? 'bg-amber-900/40 text-amber-300 border-amber-700/40' : 'bg-amber-100 text-amber-700 border-amber-200',
    pillCyan:      isDark ? 'bg-cyan-900/40 text-cyan-300 border-cyan-700/40' : 'bg-cyan-100 text-cyan-700 border-cyan-200',
    statCard:      isDark ? 'bg-zinc-700/50 border-zinc-600' : 'bg-white border-gray-200',
    barBg:         isDark ? 'bg-zinc-700' : 'bg-gray-200',
    skeleton:      isDark ? 'bg-zinc-700 animate-pulse' : 'bg-gray-200 animate-pulse',
    quoteBg:       isDark ? 'bg-zinc-900/60' : 'bg-slate-50',
    hlFake:        isDark ? 'bg-red-800/30' : 'bg-red-100',
    hlGeneric:     isDark ? 'bg-amber-800/30' : 'bg-amber-100',
    hlCompetitor:  isDark ? 'bg-zinc-700/60' : 'bg-gray-200',
    deleteHover: isDark ? '${c.deleteHover}' : '${c.deleteHover}',
  };

  const linkStyle = isDark
    ? 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2'
    : 'text-cyan-600 hover:text-cyan-700 underline underline-offset-2';


  // Form
  const [reviewText, setReviewText] = usePersistentState('frd-review-text', '');
  const [category, setCategory] = useState('Electronics');
  const [productUrl, setProductUrl] = useState('');
  const [currentSource, setCurrentSource] = useState('');

  // Phases
  const [phase, setPhase] = useState('input');
  const [scoreProgress, setScoreProgress] = useState('');
  const [error, setError] = useState('');
  const resultsRef = React.useRef(null);

  // Results
  const [parsedReviews, setParsedReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [reviewScores, setReviewScores] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);
  const [synthesis, setSynthesis] = useState(null);

  // UI toggles
  const [sortSuspicious, setSortSuspicious] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareSlot, setCompareSlot] = useState(null);
  const [showPasteHelper, setShowPasteHelper] = useState(false);
  const [showPlaybook, setShowPlaybook] = useState(true);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showFingerprint, setShowFingerprint] = useState(true);
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [synthesisLoading, setSynthesisLoading] = useState(false);

  // Persistent
  const [savedAnalyses, setSavedAnalyses] = usePersistentState('fakereview-history', []);
  const [sourceAnalyses, setSourceAnalyses] = usePersistentState('fakereview-sources', []);

  const toggleCard = useCallback((idx) => setExpandedCards(prev => ({ ...prev, [idx]: !prev[idx] })), []);

  // Fingerprint group lookup
  const fpGroupMap = useMemo(() => {
    if (!fingerprint?.author_groups) return {};
    const map = {};
    fingerprint.author_groups.forEach(g => { g.review_indices?.forEach(i => { map[i] = g.group_id; }); });
    return map;
  }, [fingerprint]);

  // ─── URL EXTRACTION ───
  const extractFromUrl = useCallback(async () => {
    const url = productUrl.trim();
    if (!url || !/^https?:\/\/.+/i.test(url)) { setError('Enter a valid URL.'); return; }
    setError(''); setPhase('extracting'); setScoreProgress('Fetching...');
    try {
      const data = await callToolEndpoint('fake-review-detective', { action: 'extract', url });
      if (!data.reviews?.trim()) { setError(data.message || 'No reviews found.'); setPhase('input'); return; }
      setReviewText(prev => prev ? prev + '\n\n' + data.reviews : data.reviews);
      if (data.category && CATEGORIES.includes(data.category)) setCategory(data.category);
      // Auto-detect source from URL
      if (!currentSource) {
        if (/amazon\./i.test(url)) setCurrentSource('Amazon');
        else if (/bestbuy\./i.test(url)) setCurrentSource('Best Buy');
        else if (/walmart\./i.test(url)) setCurrentSource('Walmart');
        else if (/target\./i.test(url)) setCurrentSource('Target');
        else if (/reddit\./i.test(url)) setCurrentSource('Reddit');
      }
      setPhase('input'); setScoreProgress('');
    } catch (err) { setError(err.message || 'Extract failed.'); setPhase('input'); }
  }, [productUrl, currentSource, callToolEndpoint]);

  // ─── MAIN ANALYSIS ───
  const runAnalysis = useCallback(async () => {
    if (!reviewText.trim() || reviewText.trim().length < 100) { setError('Paste at least 100 characters.'); return; }
    setError(''); setPhase('parsing'); setReviewScores(null); setAnalysis(null); setFingerprint(null); setExpandedCards({}); setShowAllReviews(false);

    const chunks = splitIntoReviews(reviewText);
    const reviews = chunks.map((ch, i) => parseReview(ch, i));
    const aggStats = computeAggregateStats(reviews);
    setParsedReviews(reviews); setStats(aggStats);

    const aiRevs = reviews.slice(0, 6), trunc = reviews.length > 20;

    // Phase 1: Score
    setPhase('scoring'); setScoreProgress(`Scoring ${aiRevs.length} reviews...`);
    let scores = null;
    try {
      const sd = await callToolEndpoint('fake-review-detective', {
        action: 'score', reviews: aiRevs.map(r => ({ index: r.index, rawText: r.rawText, starRating: r.starRating, isVerified: r.isVerified, daysAgo: r.daysAgo, wordCount: r.wordCount, exclamationCount: r.exclamationCount, capsRatio: r.capsRatio, hasSpecificDetails: r.hasSpecificDetails, hasGenericPraise: r.hasGenericPraise, mentionsCompetitor: r.mentionsCompetitor })),
        stats: aggStats, category, truncated: trunc, totalReviewCount: reviews.length,
      });
      scores = sd?.scores || []; setReviewScores(scores);
    } catch (err) { setError('Scoring failed: ' + (err.message || '')); setPhase('done'); return; }

    if (reviews.length < 2) { setPhase('done'); return; }

    // Phase 2: Analyze + Playbook
    setPhase('analyzing'); setScoreProgress('Analyzing patterns...');
    try {
      const ad = await callToolEndpoint('fake-review-detective', {
        action: 'analyze', reviews: aiRevs.map(r => ({ index: r.index, rawText: r.rawText, starRating: r.starRating, isVerified: r.isVerified, daysAgo: r.daysAgo, wordCount: r.wordCount, hasSpecificDetails: r.hasSpecificDetails, hasGenericPraise: r.hasGenericPraise, mentionsCompetitor: r.mentionsCompetitor })),
        scores, stats: aggStats, category,
      });
      setAnalysis(ad);

      // Save snapshot
      const snap = {
        id: Date.now(), date: new Date().toISOString().split('T')[0],
        category, reviewCount: reviews.length, source: currentSource || 'Unknown',
        trustScore: ad.quick_verdict?.trust_score, label: ad.quick_verdict?.label,
        verdict: ad.purchase_recommendation?.verdict,
        fakeCount: scores.filter(s => s.verdict === 'likely_fake').length,
        genuineCount: scores.filter(s => s.verdict === 'likely_genuine').length,
        url: productUrl || null, summary: ad.quick_verdict?.one_liner || '',
        realPros: ad.genuine_consensus?.real_pros || [], realCons: ad.genuine_consensus?.real_cons || [],
        realRating: ad.genuine_consensus?.real_rating, manipulationType: ad.manipulation_detected?.type,
      };
      setSavedAnalyses(prev => [snap, ...prev].slice(0, 6));
      if (currentSource) setSourceAnalyses(prev => [{ ...snap, sourceName: currentSource, preview: (currentSource || reviewText || '').slice(0, 40) }, ...prev].slice(0, 6));
    } catch (err) { setError('Analysis failed: ' + (err.message || '')); }
    setPhase('done');
  }, [reviewText, category, productUrl, currentSource, callToolEndpoint, setSavedAnalyses, setSourceAnalyses]);

  // ─── FINGERPRINT ───
  const runFingerprint = useCallback(async () => {
    if (!parsedReviews.length || !reviewScores) return;
    setFingerprintLoading(true); setError('');
    try {
      const data = await callToolEndpoint('fake-review-detective', {
        action: 'fingerprint', reviews: parsedReviews.slice(0, 6).map(r => ({ index: r.index, rawText: r.rawText, starRating: r.starRating, isVerified: r.isVerified, wordCount: r.wordCount })),
        scores: reviewScores,
      });
      setFingerprint(data);
    } catch (err) { setError('Fingerprint failed: ' + (err.message || '')); }
    setFingerprintLoading(false);
  }, [parsedReviews, reviewScores, callToolEndpoint]);

  // ─── SYNTHESIZE ───
  const runSynthesis = useCallback(async () => {
    if (sourceAnalyses.length < 2) { setError('Need 2+ source analyses.'); return; }
    setSynthesisLoading(true); setError('');
    try {
      const data = await callToolEndpoint('fake-review-detective', { action: 'synthesize', sources: sourceAnalyses.slice(0, 5) });
      setSynthesis(data);
    } catch (err) { setError('Synthesis failed: ' + (err.message || '')); }
    setSynthesisLoading(false);
  }, [sourceAnalyses, callToolEndpoint]);

  const handleReset = useCallback(() => {
    setReviewText(''); setProductUrl(''); setCategory('Electronics'); setCurrentSource('');
    setPhase('input'); setParsedReviews([]); setStats(null); setReviewScores(null);
    setAnalysis(null); setFingerprint(null); setError(''); setExpandedCards({}); setShowAllReviews(false);
  }, []);

  // ─── Try Alternative ───
  const handleTryAlternative = useCallback(() => {
    setReviewText(''); setProductUrl(''); setCurrentSource('');
    setPhase('input'); setParsedReviews([]); setStats(null); setReviewScores(null);
    setAnalysis(null); setFingerprint(null); setError(''); setExpandedCards({}); setShowAllReviews(false);
    // Keep category + history so comparison works
  }, []);

  // ─── Report builder ───
  const buildReport = useCallback(() => {
    if (!analysis?.quick_verdict) return '';
    const qv = analysis.quick_verdict, gc = analysis.genuine_consensus, pr = analysis.purchase_recommendation;
    const sus = reviewScores?.filter(s => s.verdict === 'likely_fake').length || 0, tot = reviewScores?.length || 0;
    return ['FAKE REVIEW DETECTIVE — ANALYSIS REPORT', `Source: ${currentSource || 'Not specified'}`, `Trust Score: ${qv.trust_score}/100 — ${qv.label}`, `Sample: ${sampleConfidence(tot).label} (${tot} reviews)`, qv.one_liner, '', `${sus} of ${tot} flagged suspicious.`, gc?.summary || '', gc?.real_pros?.length ? `Pros: ${gc.real_pros.join(', ')}` : '', gc?.real_cons?.length ? `Cons: ${gc.real_cons.join(', ')}` : '', gc?.real_rating ? `Genuine rating: ${gc.real_rating}/5` : '', '', `Verdict: ${(pr?.verdict || '?').toUpperCase()} — ${pr?.reasoning || ''}`, '', '— Generated by DeftBrain · deftbrain.com'].filter(l => l !== undefined).join('\n');
  }, [analysis, reviewScores, currentSource]);

  // ─── Sorted reviews ───
  const sorted = useMemo(() => {
    if (!reviewScores || !parsedReviews.length) return [];
    const merged = parsedReviews.slice(0, 6).map(r => ({ ...r, ...(reviewScores.find(s => s.index === r.index) || {}) }));
    return sortSuspicious ? [...merged].sort((a, b) => (a.authenticity_score ?? 50) - (b.authenticity_score ?? 50)) : merged;
  }, [parsedReviews, reviewScores, sortSuspicious]);

  const visible = showAllReviews ? sorted : sorted.slice(0, 5);
  const isRunning = ['extracting', 'parsing', 'scoring', 'analyzing'].includes(phase);
  const canAnalyze = reviewText.trim().length >= 100 && !isRunning;
  const confidence = stats ? sampleConfidence(stats.totalReviews) : null;

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className={`space-y-6 ${c.text}`}>
      <div className="mb-2">
        <h2 className={`text-2xl font-bold ${c.text}`}><span className="mr-2">{tool?.icon ?? '🔍'}</span>{tool?.title || 'Fake Review Detective'}</h2>
        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Spot fake reviews before you get burned</p>
      </div>

      {/* INTRO */}
      <div className={`${c.highlight} border rounded-xl p-5 flex items-start gap-3`}>
        <span className="text-xl">🛡️</span>
        <div className="flex-1">
          <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>Paste reviews or import from a URL. Real stats computed instantly, then AI scores each review, detects manipulation patterns, fingerprints authors, and teaches you to spot fakes.</p>
          <button onClick={() => setShowPasteHelper(!showPasteHelper)} className={`text-xs font-semibold ${c.textSecondaryondary} mt-1 hover:underline`}>{showPasteHelper ? 'Hide guide ▲' : '📋 How to copy reviews ▼'}</button>
        </div>
      </div>

      {/* FEATURE 5: PASTE HELPER */}
      {showPasteHelper && (
        <div className={`${c.card} border rounded-xl p-5`}>
          <h3 className={`text-sm font-bold ${c.text} mb-3`}>📋 How to Get Reviews</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PASTE_GUIDES.map(g => (
              <div key={g.platform} className={`${c.cardAlt} border rounded-lg p-3`}>
                <p className={`text-sm font-bold ${c.text} mb-2`}>{g.icon} {g.platform}</p>
                <ol className="space-y-1">{g.steps.map((s, i) => <li key={i} className={`text-xs ${c.textSecondaryondary}`}>{i + 1}. {s}</li>)}</ol>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* URL EXTRACTION */}
      <div className={`${c.card} border rounded-xl p-5`}>
        <div className="flex items-center gap-2 mb-3"><span>🌐</span><h3 className={`text-sm font-bold ${c.text}`}>Import from URL</h3><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.pillGray} border`}>Optional</span></div>
        <div className="flex gap-2">
          <div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔗</span>
            <input type="url" value={productUrl} onChange={e => setProductUrl(e.target.value)} placeholder="https://amazon.com/product-name/..." className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`} disabled={isRunning} /></div>
          <button onClick={extractFromUrl} disabled={!productUrl.trim() || isRunning} className={`${c.btnPrimarySecondaryondary} disabled:opacity-40 font-semibold px-4 py-2.5 rounded-lg text-sm whitespace-nowrap`}>{phase === 'extracting' ? <><span className="animate-spin inline-block">{tool?.icon ?? '🔍'}</span> ...</> : <><span>{tool?.icon ?? '🔍'}</span> Extract</>}</button>
        </div>
        <p className={`text-[11px] ${c.textMuteded} mt-1.5`}>Reviews append to existing text. Works with Amazon, Best Buy, Walmart, etc.</p>
      </div>

      {/* INPUT + SOURCE TAG */}
      <div className={`${c.card} border rounded-xl p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-lg ${isDark ? 'bg-cyan-900/30' : 'bg-cyan-100'}`}><span className="text-xl">🔍</span></div>
          <div className="flex-1"><h2 className={`text-lg font-bold ${c.text}`}>Paste Reviews</h2><p className={`text-xs ${c.textMuteded}`}>Or edit reviews imported from URL</p></div>
        </div>

        {/* FEATURE 1: Source tagger */}
        <div className="mb-4">
          <label className={`text-xs font-semibold ${c.textSecondaryondary} block mb-1.5`}>📌 Source (for multi-platform comparison)</label>
          <div className="flex flex-wrap gap-1.5">
            {SOURCE_PRESETS.map(s => <button key={s} onClick={() => setCurrentSource(s)} className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${currentSource === s ? (isDark ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-emerald-600 border-emerald-600 text-white') : `${c.btnPrimarySecondaryondary} border-transparent`}`}>{s}</button>)}
            {currentSource && !SOURCE_PRESETS.includes(currentSource) && <span className={`px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white`}>{currentSource}</span>}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-sm font-semibold ${c.textSecondaryondary}`}>Product reviews</label>
              <button onClick={() => setReviewText(EXAMPLE_REVIEWS)} className={`text-xs font-semibold ${c.textSecondaryondary} hover:underline`}>Try example</button>
            </div>
            <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Paste reviews here..." className={`w-full p-4 border rounded-lg ${c.input} outline-none focus:ring-2 font-mono text-sm`} rows={8} />
            <p className={`text-xs ${c.textMuteded} mt-1`}>Min 100 chars · {reviewText.length} entered</p>
          </div>

          <div>
            <label className={`text-sm font-semibold ${c.textSecondaryondary} block mb-2`}>Category</label>
            <div className="flex flex-wrap gap-1.5">{CATEGORIES.map(cat => <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${category === cat ? (isDark ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-emerald-600 border-emerald-600 text-white') : `${c.btnPrimarySecondaryondary} border-transparent`}`}>{cat}</button>)}</div>
          </div>

          <div className="flex gap-3">
            <button onClick={runAnalysis} disabled={!canAnalyze} className={`flex-1 ${c.btnPrimaryPrimary} disabled:opacity-40 font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2`}>
              {isRunning ? <><span className="animate-spin inline-block">{tool?.icon ?? '🔍'}</span><span className="text-sm">{scoreProgress || 'Processing...'}</span></> : <><span>{tool?.icon ?? '🔍'}</span> Detect Fakes</>}
            </button>
            {(stats || analysis) && <button onClick={handleReset} className={`px-5 py-3 border-2 ${c.btnPrimaryOutline} font-semibold rounded-lg`}>Reset</button>}
          </div>
        </div>
      </div>

      {error && <div className={`${c.danger} border rounded-lg p-4 flex items-start gap-3`}><span>⚠️</span><p className="text-sm">{error}</p></div>}

      {/* CONFIDENCE BANNER */}
      {stats && confidence && confidence.level !== 'high' && (
        <div className={`${confidence.color === 'red' ? c.danger : c.warning} border rounded-lg p-3 flex items-start gap-2`}>
          <span>{confidence.level === 'very_low' ? '🚨' : '⚠️'}</span>
          <div><p className="text-xs font-bold">Sample: {confidence.label}</p><p className={`text-xs ${c.textSecondaryondary}`}>{confidence.note}</p></div>
        </div>
      )}

      {/* INSTANT STATS */}
      {stats && (
        <div ref={resultsRef} className={`${c.card} border rounded-xl p-6`}>
          <h3 className={`text-sm font-bold ${c.text} mb-4 flex items-center gap-2`}><span>📊</span> Stats <span className={`text-[10px] font-bold ${c.textMuteded} uppercase`}>Instant</span>
            {confidence && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${confidence.color === 'green' ? c.success : confidence.color === 'amber' ? c.warning : c.danger} border`}>{confidence.label}</span>}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
            <StatCard label="Reviews" value={stats.totalReviews} c={c} />
            <StatCard label="Avg Rating" value={stats.averageRating ? `${stats.averageRating} ★` : 'N/A'} color={stats.averageRating >= 3.5 ? 'green' : stats.averageRating >= 2.5 ? 'amber' : 'red'} c={c} />
            <StatCard label="Verified" value={`${stats.verifiedPercent}%`} color={stats.verifiedPercent >= 70 ? 'green' : stats.verifiedPercent >= 40 ? 'amber' : 'red'} c={c} />
            <StatCard label="Short" value={stats.shortReviewCount} color={stats.totalReviews > 0 && stats.shortReviewCount / stats.totalReviews > 0.4 ? 'red' : 'neutral'} c={c} />
            <StatCard label="Clusters" value={stats.hasTimingCluster ? stats.dateClusters.length : 'None'} color={stats.hasTimingCluster ? 'red' : 'green'} c={c} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {stats.ratedCount > 0 && <div><p className={`text-xs font-bold ${c.textSecondaryondary} mb-2`}>Stars</p><div className="space-y-1.5">{[5,4,3,2,1].map(s => { const cnt = stats.starDistribution[s]||0, mx = Math.max(...Object.values(stats.starDistribution),1); return <div key={s} className="flex items-center gap-2"><span className={`w-8 text-xs text-right font-semibold ${c.textSecondaryondary}`}>{s}★</span><div className={`flex-1 h-5 rounded-sm overflow-hidden ${c.barBg}`}><div className={`h-full rounded-sm ${s>=4?'bg-emerald-500':s===3?'bg-amber-500':'bg-red-500'}`} style={{width:`${(cnt/mx)*100}%`,transition:'width 0.4s ease'}}/></div><span className={`w-6 text-xs text-right font-semibold ${c.textMuteded}`}>{cnt}</span></div>; })}</div></div>}
            <div className="space-y-2">
              {stats.hasTimingCluster && stats.dateClusters.map((cl, i) => <div key={i} className={`${c.danger} border rounded-lg p-3 flex items-start gap-2`}><span>🕐</span><p className="text-xs"><span className="font-bold">{cl.count} reviews</span> within 48hrs ({cl.daysAgoRange})</p></div>)}
              {stats.verifiedPercent < 40 && stats.totalReviews >= 3 && <div className={`${c.warning} border rounded-lg p-3 flex items-start gap-2`}><span>⚠️</span><p className="text-xs">Only <span className="font-bold">{stats.verifiedPercent}%</span> verified</p></div>}
              {stats.genericPraiseCount > 0 && <div className={`${c.warning} border rounded-lg p-3 flex items-start gap-2`}><span>ℹ️</span><p className="text-xs"><span className="font-bold">{stats.genericPraiseCount}</span> generic praise reviews</p></div>}
              {!stats.hasTimingCluster && stats.verifiedPercent >= 40 && stats.genericPraiseCount === 0 && <div className={`${c.success} border rounded-lg p-3 flex items-start gap-2`}><span>✅</span><p className="text-xs">No red flags in stats</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* PHASE */}
      {isRunning && <div className={`${c.card} border rounded-xl p-4 flex items-center gap-3`}><span className="animate-spin text-lg">{tool?.icon ?? '🔍'}</span><div><p className={`text-sm font-bold ${c.text}`}>{phase === 'extracting' ? 'Extracting...' : phase === 'parsing' ? 'Parsing...' : phase === 'scoring' ? 'Step 1/2: Scoring' : 'Step 2/2: Patterns'}</p><p className={`text-xs ${c.textMuteded}`}>{scoreProgress}</p></div></div>}

      {/* QUICK VERDICT */}
      {analysis?.quick_verdict && (
        <div className={`${c.card} border rounded-xl p-6 relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundColor: trustColor(analysis.quick_verdict.trust_score).bg }} />
          <div className="relative flex flex-col sm:flex-row items-center gap-5">
            <svg width="90" height="90" viewBox="0 0 90 90" className="flex-shrink-0">
              <circle cx="45" cy="45" r="38" fill="none" stroke={isDark ? '#374151' : '#e2e8f0'} strokeWidth="6" />
              <circle cx="45" cy="45" r="38" fill="none" stroke={trustColor(analysis.quick_verdict.trust_score).ring} strokeWidth="6" strokeDasharray={`${(analysis.quick_verdict.trust_score / 100) * 239} 239`} strokeLinecap="round" transform="rotate(-90 45 45)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
              <text x="45" y="42" textAnchor="middle" className="text-xl font-black" fill={trustColor(analysis.quick_verdict.trust_score).ring}>{analysis.quick_verdict.trust_score}</text>
              <text x="45" y="56" textAnchor="middle" className="text-[9px] font-bold" fill={isDark ? '#9ca3af' : '#64748b'}>/ 100</text>
            </svg>
            <div className="flex-1 text-center sm:text-left">
              <p className={`text-xs font-bold uppercase tracking-wider ${c.textMuteded} mb-1`}>Trust Score {currentSource && `· ${currentSource}`}</p>
              <h3 className={`text-xl font-black ${c.text} mb-1`}>{analysis.quick_verdict.label || verdictLabel(analysis.quick_verdict.trust_score)}</h3>
              <p className={`text-sm ${c.textSecondaryondary}`}>{analysis.quick_verdict.one_liner}</p>
            </div>
            <ActionBar><CopyBtn content={buildReport()} label="Copy" /><PrintBtn content={buildReport()} title="Fake Review Detective" /></ActionBar>
            <p className={`text-xs ${c.textMuteded} mt-2`}>
              AI-generated analysis — use alongside your own judgment.{' '}
              Ready to buy?{' '}
              <a href="/BuyWise" target="_blank" rel="noopener noreferrer" className={linkStyle}>BuyWise</a>{' '}
              stress-tests the decision itself.
            </p>
          </div>
        </div>
      )}

      {/* FEATURE 2: FORENSICS TIMELINE */}
      {reviewScores && parsedReviews.filter(r => r.daysAgo !== null).length >= 2 && (
        <div className={`${c.card} border rounded-xl p-5`}>
          <button onClick={() => setShowTimeline(!showTimeline)} className={`flex items-center gap-2 w-full text-left`}>
            <span>🕵️</span><h3 className={`text-sm font-bold ${c.text} flex-1`}>Forensics Timeline</h3><span className={c.textMuteded}>{showTimeline ? '▲' : '▼'}</span>
          </button>
          {showTimeline && <div className="mt-3">
            <ForensicsTimeline reviews={parsedReviews} scores={reviewScores} c={c} isDark={isDark} />
            <p className={`text-[10px] ${c.textMuteded} text-center mt-2`}>Each dot = one review. Y-axis = star rating. Color = authenticity score. Red clusters = suspicious timing.</p>
          </div>}
        </div>
      )}

      {/* PER-REVIEW CARDS */}
      {reviewScores?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}><span>🛡️</span> Scores ({reviewScores.length})</h3>
            <button onClick={() => setSortSuspicious(p => !p)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold ${c.btnPrimarySecondaryondary}`}>↕️ {sortSuspicious ? 'Suspicious first' : 'Original'}</button>
          </div>
          <div className="space-y-3">{visible.map(r => <ReviewCard key={r.index} review={r} expanded={!!expandedCards[r.index]} onToggle={() => toggleCard(r.index)} c={c} isDark={isDark} fpGroup={fpGroupMap[r.index]} />)}</div>
          {sorted.length > 5 && !showAllReviews && <button onClick={() => setShowAllReviews(true)} className={`w-full mt-3 py-3 rounded-lg text-sm font-semibold ${c.btnPrimarySecondaryondary}`}>▼ Show all {sorted.length}</button>}
        </div>
      )}

      {/* FEATURE 3: FINGERPRINT */}
      {reviewScores && parsedReviews.length >= 3 && (
        <div className={`${c.card} border rounded-xl p-5`}>
          <button onClick={() => setShowFingerprint(!showFingerprint)} className="flex items-center gap-2 w-full text-left">
            <span>🔬</span><h3 className={`text-sm font-bold ${c.text} flex-1`}>Author Fingerprinting</h3>
            {!fingerprint && <button onClick={(e) => { e.stopPropagation(); runFingerprint(); }} disabled={fingerprintLoading} className={`${c.btnPrimarySecondaryondary} text-xs px-3 py-1 rounded-lg disabled:opacity-50`}>{fingerprintLoading ? (tool?.icon ?? '🔍') : '🔬 Analyze'}</button>}
            <span className={c.textMuteded}>{showFingerprint ? '▲' : '▼'}</span>
          </button>
          {showFingerprint && (fingerprint ? (
            <div className="mt-3 space-y-3">
              {fingerprint.overall_assessment && <p className={`text-sm ${c.textSecondaryondary}`}>{fingerprint.overall_assessment}</p>}
              {fingerprint.template_detected && fingerprint.template_structure && <div className={`${c.danger} border rounded-lg p-3`}><p className="text-xs font-bold mb-1">📝 Template Detected</p><p className="text-xs">{fingerprint.template_structure}</p></div>}
              {fingerprint.author_groups?.map(g => (
                <div key={g.group_id} className={`${c.pillCyan} border-2 rounded-lg p-4`}>
                  <div className="flex items-center gap-2 mb-2"><span className="text-lg">👥</span><p className={`text-sm font-bold ${c.text}`}>Group {g.group_id}: Reviews #{g.review_indices?.join(', #')}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${g.confidence === 'high' ? c.danger : c.warning} border`}>{g.confidence}</span></div>
                  <p className={`text-xs font-semibold ${c.text} mb-1 capitalize`}>{(g.pattern_type || '').replace(/_/g, ' ')}</p>
                  <p className={`text-xs ${c.textSecondaryondary} mb-2`}>{g.summary}</p>
                  {g.shared_phrases?.length > 0 && <div className="flex flex-wrap gap-1 mb-2">{g.shared_phrases.map((p, i) => <span key={i} className={`${c.danger} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>"{p}"</span>)}</div>}
                  {g.evidence?.map((e, i) => <p key={i} className={`text-xs ${c.textSecondaryondary}`}>• {e}</p>)}
                </div>
              ))}
              {fingerprint.singleton_reviews?.length > 0 && <p className={`text-xs ${c.textMuteded}`}>✅ Reviews #{fingerprint.singleton_reviews.join(', #')} appear to be from unique authors.</p>}
            </div>
          ) : <p className={`text-xs ${c.textMuteded} mt-3`}>Click "Analyze" to detect same-author patterns across reviews.</p>)}
        </div>
      )}

      {/* PATTERN ANALYSIS */}
      {analysis && (
        <div className="space-y-4">
          {analysis.manipulation_detected && analysis.manipulation_detected.type !== 'none' && (
            <div className={`${c.danger} border rounded-xl p-5 flex items-start gap-3`}><span className="text-lg">🎯</span><div>
              <h4 className="text-sm font-bold mb-1">{analysis.manipulation_detected.type === 'positive_campaign' ? 'Positive Campaign' : analysis.manipulation_detected.type === 'negative_bombing' ? 'Negative Bombing' : 'Mixed Manipulation'} Detected
                {analysis.manipulation_detected.confidence && <span className={`ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${analysis.manipulation_detected.confidence === 'high' ? (isDark ? 'bg-red-800 text-red-200' : 'bg-red-200 text-red-800') : (isDark ? 'bg-amber-800 text-amber-200' : 'bg-amber-200 text-amber-800')}`}>{analysis.manipulation_detected.confidence}</span>}
              </h4>
              {analysis.manipulation_detected.description && <p className="text-sm mb-2">{analysis.manipulation_detected.description}</p>}
              {analysis.manipulation_detected.evidence?.map((e, i) => <p key={i} className="text-xs">• {e}</p>)}
            </div></div>
          )}
          {analysis.manipulation_detected?.type === 'none' && <div className={`${c.success} border rounded-xl p-5 flex items-start gap-3`}><span className="text-lg">✅</span><div><h4 className="text-sm font-bold">No Coordinated Manipulation Detected</h4></div></div>}

          {analysis.genuine_consensus && <div className={`${c.success} border rounded-xl p-5 flex items-start gap-3`}><span className="text-lg">✅</span><div className="flex-1">
            <h4 className="text-sm font-bold mb-2">What Genuine Reviews Say</h4><p className="text-sm mb-3">{analysis.genuine_consensus.summary}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analysis.genuine_consensus.real_pros?.length > 0 && <div><p className="text-xs font-bold mb-1">📈 Pros</p>{analysis.genuine_consensus.real_pros.map((p, i) => <p key={i} className="text-xs">✓ {p}</p>)}</div>}
              {analysis.genuine_consensus.real_cons?.length > 0 && <div><p className="text-xs font-bold mb-1">📉 Cons</p>{analysis.genuine_consensus.real_cons.map((cn, i) => <p key={i} className="text-xs">✗ {cn}</p>)}</div>}
            </div>
            {analysis.genuine_consensus.real_rating && <p className={`text-xs font-bold mt-2 ${c.success}`}>Genuine: {analysis.genuine_consensus.real_rating}/5 ★</p>}
          </div></div>}

          {analysis.sentiment_trajectory?.trend !== 'insufficient_data' && analysis.sentiment_trajectory && <div className={`${c.highlight} border rounded-xl p-5 flex items-start gap-3`}><span className="text-lg">{analysis.sentiment_trajectory.trend === 'improving' ? '📈' : analysis.sentiment_trajectory.trend === 'declining' ? '📉' : '➡️'}</span><div><h4 className="text-sm font-bold mb-1">Trend: {analysis.sentiment_trajectory.trend}</h4><p className="text-sm">{analysis.sentiment_trajectory.description}</p></div></div>}

          {analysis.purchase_recommendation && <div className={`${analysis.purchase_recommendation.verdict === 'buy' ? c.success : analysis.purchase_recommendation.verdict === 'skip' ? c.danger : c.warning} border rounded-xl p-5 flex items-start gap-3`}><span className="text-lg">{analysis.purchase_recommendation.verdict === 'buy' ? '✅' : analysis.purchase_recommendation.verdict === 'skip' ? '🚫' : '⏸️'}</span><div>
            <h4 className="text-sm font-bold mb-1">Verdict: <span className="uppercase">{analysis.purchase_recommendation.verdict}</span> {analysis.purchase_recommendation.confidence && <span className="text-[10px] opacity-70">({analysis.purchase_recommendation.confidence})</span>}</h4>
            <p className="text-sm">{analysis.purchase_recommendation.reasoning}</p>
          </div></div>}

          {/* FEATURE 6: PLAYBOOK */}
          {analysis.playbook?.tactics_detected?.length > 0 && (
            <div className={`${c.card} border rounded-xl p-5`}>
              <button onClick={() => setShowPlaybook(!showPlaybook)} className="flex items-center gap-2 w-full text-left">
                <span>🎓</span><h3 className={`text-sm font-bold ${c.text} flex-1`}>Fake Review Playbook</h3><span className={`text-[10px] ${c.textMuteded}`}>Learn to spot these</span><span className={c.textMuteded}>{showPlaybook ? '▲' : '▼'}</span>
              </button>
              {showPlaybook && <div className="mt-3 space-y-3">
                {analysis.playbook.tactics_detected.map((t, i) => (
                  <div key={i} className={`${c.cardAlt} border rounded-lg p-4`}>
                    <div className="flex items-center gap-2 mb-2"><span className="text-lg">{t.icon || '🎭'}</span><h4 className={`text-sm font-bold ${c.text}`}>{t.name}</h4></div>
                    <p className={`text-xs ${c.textSecondaryondary} mb-2`}>{t.description}</p>
                    <div className={`${c.danger} border rounded-lg p-2 mb-2`}><p className="text-[10px] font-bold mb-0.5">In these reviews:</p><p className="text-xs">{t.evidence_here}</p></div>
                    <div className={`${c.success} border rounded-lg p-2`}><p className="text-[10px] font-bold mb-0.5">🔍 How to spot this:</p><p className="text-xs">{t.how_to_spot}</p></div>
                  </div>
                ))}
                {analysis.playbook.overall_tip && <div className={`${c.highlight} border rounded-lg p-3`}><p className="text-xs font-bold">💡 {analysis.playbook.overall_tip}</p></div>}
              </div>}
            </div>
          )}

          {/* FEATURE 4: TRY ALTERNATIVE */}
          <div className={`${c.card} border-2 border-dashed rounded-xl p-5 text-center`}>
            <p className={`text-sm font-semibold ${c.text} mb-2`}>🔄 Not convinced? Try the alternative.</p>
            <p className={`text-xs ${c.textMuteded} mb-3`}>Analyze reviews from a competing product, then compare side-by-side.</p>
            <button onClick={handleTryAlternative} className={`${c.btnPrimaryPrimary} px-6 py-2.5 rounded-lg text-sm font-semibold`}>🔍 Analyze Another Product</button>
          </div>

          {/* Cross-tool */}
          <div className={`${c.cardAlt} border rounded-lg p-3 flex items-center gap-2`}><span>🛒</span><p className={`text-xs ${c.textSecondaryondary} flex-1`}>Reviews check out? Run through <a href="/BuyWise" target="_blank" rel="noopener noreferrer" className={`font-semibold ${c.textSecondaryondary} hover:underline`}>BuyWise</a> to see if it's worth the price.</p></div>
        </div>
      )}

      {(reviewScores || analysis) && <p className={`text-[10px] ${c.textMuteded} text-center px-4`}>AI-assisted. Cannot verify identities. Use judgment.</p>}

      {/* FEATURE 1: MULTI-SOURCE SYNTHESIS */}
      {sourceAnalyses.length >= 2 && (
        <div className={`${c.card} border rounded-xl p-5`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}><span>🌐</span> Cross-Platform Comparison ({sourceAnalyses.length} sources)</h3>
            <button onClick={runSynthesis} disabled={synthesisLoading} className={`${c.btnPrimaryPrimary} text-xs px-3 py-1.5 rounded-lg disabled:opacity-50`}>{synthesisLoading ? (tool?.icon ?? '🔍') : synthesis ? '🔄 Refresh' : '🔬 Synthesize'}</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            {sourceAnalyses.slice(0, 6).map(sa => (
              <div key={sa.id} className={`${c.cardAlt} border rounded-lg p-3 text-center`}>
                <p className={`text-xs font-bold ${c.text}`}>{sa.sourceName}</p>
                <p className={`text-2xl font-black ${sa.trustScore >= 60 ? c.success : sa.trustScore >= 40 ? c.warning : c.danger}`}>{sa.trustScore ?? '?'}</p>
                <p className={`text-[10px] ${c.textMuteded}`}>{sa.reviewCount}r · {sa.fakeCount}🔴 {sa.genuineCount}🟢</p>
              </div>
            ))}
          </div>
          {synthesis && <div className="space-y-3 mt-3">
            <div className={`${synthesis.unified_verdict === 'buy' ? c.success : synthesis.unified_verdict === 'skip' ? c.danger : c.warning} border-2 rounded-xl p-5 text-center`}>
              <p className={`text-xs font-bold ${c.textMuteded} uppercase mb-1`}>Cross-Platform Verdict</p>
              <p className="text-3xl font-black">{synthesis.unified_trust_score}/100</p>
              <p className="text-sm font-bold uppercase mt-1">{synthesis.unified_verdict} <span className="text-[10px] opacity-70">({synthesis.unified_confidence})</span></p>
            </div>
            {synthesis.consensus && <div className={`${c.success} border rounded-lg p-4`}><h4 className="text-sm font-bold mb-2">✅ Cross-Platform Consensus</h4><p className="text-sm mb-2">{synthesis.consensus.summary}</p>
              <div className="grid grid-cols-2 gap-3">
                {synthesis.consensus.agreed_pros?.length > 0 && <div>{synthesis.consensus.agreed_pros.map((p, i) => <p key={i} className="text-xs">✓ {p}</p>)}</div>}
                {synthesis.consensus.agreed_cons?.length > 0 && <div>{synthesis.consensus.agreed_cons.map((cn, i) => <p key={i} className="text-xs">✗ {cn}</p>)}</div>}
              </div>
            </div>}
            {synthesis.source_rankings?.length > 0 && <div className={`${c.cardAlt} border rounded-lg p-4`}><p className="text-xs font-bold mb-2">📊 Source Reliability</p>{synthesis.source_rankings.map((s, i) => <div key={i} className="flex items-center justify-between mb-1"><span className={`text-xs font-semibold ${c.text}`}>{s.source_name}</span><span className={`text-[10px] px-1.5 py-0.5 rounded ${s.trust_level === 'most_reliable' ? c.success : s.trust_level === 'reliable' ? c.success : s.trust_level === 'somewhat_reliable' ? c.warning : c.danger} border`}>{(s.trust_level||'').replace(/_/g,' ')}</span></div>)}</div>}
            {synthesis.disagreements?.length > 0 && <div className={`${c.warning} border rounded-lg p-4`}><p className="text-xs font-bold mb-2">⚡ Disagreements</p>{synthesis.disagreements.map((d, i) => <div key={i} className="mb-2"><p className={`text-xs font-semibold ${c.text}`}>{d.topic}</p><p className="text-xs">{d.description}</p></div>)}</div>}
            {synthesis.final_recommendation && <div className={`${c.highlight} border rounded-lg p-3`}><p className="text-xs font-bold">💡 {synthesis.final_recommendation}</p></div>}
          </div>}
          {!synthesis && <p className={`text-xs ${c.textMuteded} text-center`}>Click Synthesize to get a cross-platform verdict.</p>}
        </div>
      )}

      {/* COMPARISON */}
      {savedAnalyses.length >= 2 && analysis && (
        <div className={`${c.card} border rounded-xl p-5`}>
          <div className="flex items-center justify-between mb-3"><h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}><span>⚖️</span> Compare</h3><button onClick={() => setShowCompare(!showCompare)} className={`text-xs ${c.textSecondaryondary} font-semibold`}>{showCompare ? 'Hide' : 'Show'}</button></div>
          {showCompare && <div>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">{savedAnalyses.slice(1).map(sa => <button key={sa.id} onClick={() => setCompareSlot(sa)} className={`w-full text-left ${compareSlot?.id === sa.id ? c.highlight : c.cardAlt} border rounded-lg p-3 transition-colors`}><div className="flex items-center justify-between"><span className={`text-sm font-semibold ${c.text}`}>{sa.source || sa.category} · {sa.reviewCount}r</span><span className={`text-lg font-black ${sa.trustScore >= 60 ? c.success : sa.trustScore >= 40 ? c.warning : c.danger}`}>{sa.trustScore ?? '?'}</span></div><p className={`text-xs ${c.textMuteded} truncate`}>{sa.summary || sa.date}</p></button>)}</div>
            {compareSlot && <div className="grid grid-cols-2 gap-3">
              <div className={`${c.card} border rounded-lg p-4 text-center`}><p className={`text-xs ${c.textMuteded} mb-1`}>Current {currentSource && `(${currentSource})`}</p><p className={`text-3xl font-black ${analysis.quick_verdict?.trust_score >= 60 ? c.success : analysis.quick_verdict?.trust_score >= 40 ? c.warning : c.danger}`}>{analysis.quick_verdict?.trust_score ?? '?'}</p><p className={`text-xs font-bold mt-1 uppercase ${analysis.purchase_recommendation?.verdict === 'buy' ? c.success : analysis.purchase_recommendation?.verdict === 'skip' ? c.danger : c.warning}`}>{analysis.purchase_recommendation?.verdict || '—'}</p></div>
              <div className={`${c.card} border rounded-lg p-4 text-center`}><p className={`text-xs ${c.textMuteded} mb-1`}>Previous {compareSlot.source && `(${compareSlot.source})`}</p><p className={`text-3xl font-black ${compareSlot.trustScore >= 60 ? c.success : compareSlot.trustScore >= 40 ? c.warning : c.danger}`}>{compareSlot.trustScore ?? '?'}</p><p className={`text-xs font-bold mt-1 uppercase ${compareSlot.verdict === 'buy' ? c.success : compareSlot.verdict === 'skip' ? c.danger : c.warning}`}>{compareSlot.verdict || '—'}</p></div>
            </div>}
          </div>}
        </div>
      )}

      {/* HISTORY */}
      {savedAnalyses.length > 0 && (
        <div className={`${c.card} border rounded-xl p-5`}>
          <div className="flex items-center justify-between mb-3"><h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}><span>📋</span> History ({savedAnalyses.length})</h3>
            <button onClick={() => { if (window.confirm('Clear history?')) { setSavedAnalyses([]); setSourceAnalyses([]); setSynthesis(null); } }} className={`text-xs ${c.textMuteded} ${c.deleteHover}`}>Clear</button></div>
          <div className="space-y-2 max-h-60 overflow-y-auto">{savedAnalyses.map(sa => <div key={sa.id} className={`${c.cardAlt} border rounded-lg p-3`}>
            <div className="flex items-center justify-between"><div className="flex items-center gap-2 flex-1 min-w-0"><span className={`text-lg font-black ${sa.trustScore >= 60 ? c.success : sa.trustScore >= 40 ? c.warning : c.danger}`}>{sa.trustScore ?? '?'}</span>
              {sa.source && <span className={`${c.pillCyan} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>{sa.source}</span>}
              <span className={`text-xs ${c.text}`}>{sa.category}</span><span className={`text-[10px] ${c.textMuteded}`}>{sa.date}</span></div>
              {sa.verdict && <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${sa.verdict === 'buy' ? c.success : sa.verdict === 'skip' ? c.danger : c.warning} border`}>{sa.verdict}</span>}
            </div>
            <p className={`text-xs ${c.textSecondaryondary} truncate mt-0.5`}>{sa.summary}</p>
          </div>)}</div>
        </div>
      )}
        <div className={`mt-6 pt-4 border-t text-sm ${c.border} ${c.textMuted}`}>
          <p className="mb-2 font-medium">You might also like:</p>
          <div className="flex flex-wrap gap-2">
            {[{slug:'markup-detective',label:'🔍 Markup Detective'},{slug:'upsell-shield',label:'🛡️ Upsell Shield'},{slug:'buy-wise',label:'💰 Buy Wise'}].map(({slug,label})=>(
              <a key={slug} href={`${slug}`} className={linkStyle}>{label}</a>
            ))}
          </div>
        </div>
    </div>
  );
};

FakeReviewDetective.displayName = 'FakeReviewDetective';
export default FakeReviewDetective;
