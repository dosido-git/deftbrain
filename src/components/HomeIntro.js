/**
 * HomeIntro — the rethought top of the home page.
 * ─────────────────────────────────────────────────────────────────────────
 * Replaces the old hero (rotating task triplet + two CTAs), which assumed a
 * visitor already knew they wanted a tool. A usability review found the site
 * was accidentally two products — a library, and something that listens to
 * your problem and routes you — and that the second should be the front door
 * to the first. This is that front door.
 *
 * Order is deliberate and each block answers one question:
 *   hero          what is this, and what do I do first    (search IS the CTA)
 *   gets stuck    is it for someone like me
 *   why           why would a form beat a chatbox         (+ the three-step spine)
 *   categories    how much is here                        (real names, real counts)
 *   how/trust/    what happens, can I trust it, who else  (three columns)
 *   curiosity     what if I do not have a problem
 *   closing       one more way in
 *
 * Deliberate departures from the mockup, agreed before building:
 *   - Two font families, not three. The mockup added Source Serif 3 for one
 *     role; Playfair already covers it and a third family is real payload.
 *   - Category names and counts come from the live catalog, not the mockup's
 *     invented ten. Passed in as `categories` so there is one source of truth.
 *   - Testimonials are PLACEHOLDERS and marked as such in the UI. There is no
 *     real feedback yet — the metrics sink reports none — and inventing quotes
 *     on a site whose pitch is honesty would be the one unforced error.
 *
 * Light mode only, like the rest of the dashboard (see DashBoard.js CLR).
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// ── Density ────────────────────────────────────────────────────────────────
// The mockup was drawn on a fixed 1024px artboard. Rendered 1:1 in a real
// browser it read about a fifth too large — the page wanted two zoom-outs in
// Firefox, one in Safari, to sit right.
//
// Two tracks rather than one blunt multiplier. Display type and spacing take
// the full reduction, because that is what actually reads as "too big": the
// headings and the air around them. Body copy takes a gentler one and never
// drops below 13px, since "looks right zoomed out" and "is still readable"
// stop agreeing somewhere around 12px, and the people this site is for are
// often reading it stressed, on a phone, about a lease.
//
// Retune the whole page from these two lines.
const d = (n) => +(n * 0.82).toFixed(1);               // display type + spacing
const b = (n) => Math.max(13, +(n * 0.92).toFixed(1)); // reading copy, with a floor
// Captions carry no argument — counts, attributions, one-line blurbs. They can
// go below the reading floor without costing anyone the thread, and if they
// could not they would floor at 13 too and stop reading as secondary at all.
const cap = (n) => Math.max(11, +(n * 0.92).toFixed(1));

// Air, not size, is what stops display type shouting. The first density pass
// shrank the type and kept the old tight rhythm, which made the page read as
// small AND loud at once. The mockup holds nearly the same type sizes but
// gives every section room and every heading a short measure, so the words
// land instead of announcing themselves. MEASURE caps the reading column —
// display lines wrap at a comfortable length rather than running the full
// width of a desktop.
const SECTION = d(52);
const MEASURE = 500;

// ── What we call the things ────────────────────────────────────────────────
// "Tools" is accurate but cold, and it describes the mechanism rather than
// what the visitor gets. "Experiences" (the mockup's word) is vaguer still.
// "Helpers" is the word the hero copy already reaches for — "DeftBrain helps
// you think it through" — and it survives every slot: browse all 125 helpers,
// 18 helpers, see all helpers. Change it here and the page follows.
//
// Scoped to this page for now. The catalog, schema, llms.txt, sitemaps and
// the About-page count check all still say "tools"; renaming those is a
// separate pass with a much wider blast radius.
const UNIT = { one: 'helper', many: 'helpers' };

const CLR = {
  sand50:  '#faf8f5',
  sand100: '#f3efe8',
  sand200: '#e8e1d5',
  sand300: '#d5cab8',
  navy500: '#2c4a6e',
  navy600: '#1e3550',
  navy700: '#16283c',
  gold500: '#c8872e',
  gold700: '#8a5d1c',
  warm500: '#8a8275',
  warm700: '#5a544a',
  warm800: '#3d3935',
  // Accents lifted from the designer's palette, used only as icon tints.
  green:   '#5a7f6a',
  blue:    '#4c6fae',
  lavender:'#ede7f6',
};

const SERIF = "'Playfair Display', Georgia, serif";

// Feathers the illustration's rectangle away so it sits in the page rather
// than on it. Off-centre to the right because that is where the signpost is —
// the subject stays solid while the sky and foreground dissolve.
const MASK = 'radial-gradient(116% 106% at 72% 46%, #000 44%, transparent 84%)';

// ── Step icons ─────────────────────────────────────────────────────────────
// Inline SVG rather than emoji, only here. The mockup's three-step spine is
// carried by the icons — matched weight, matched corners, one tint each — and
// emoji cannot hold that line: they arrive at whatever weight and palette the
// visitor's OS ships. Three hand-written paths, no icon dependency (the
// no-lucide-react rule stands; nothing is imported). Everything else on the
// page, categories included, still uses the catalog's emoji.
const stroke = {
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.7,
  strokeLinecap: 'round', strokeLinejoin: 'round',
};
const IconAsk = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
    <path {...stroke} d="M20.5 11.6a8 8 0 0 1-8 7.9 8.6 8.6 0 0 1-3.7-.8l-5 1.5 1.6-4.7a7.7 7.7 0 0 1-1.1-3.9 8 8 0 0 1 8.2-7.9 8 8 0 0 1 8 7.9Z" />
    <path {...stroke} d="M10.1 9.6a2.2 2.2 0 0 1 4.3.7c0 1.4-2.1 1.9-2.1 3.1" />
    <circle cx="12.3" cy="15.6" r="0.75" fill="currentColor" />
  </svg>
);
const IconClear = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
    <path {...stroke} d="M12 3.2a5.9 5.9 0 0 0-3.5 10.6c.6.5.9 1.1 1 1.7l.1.5h4.8l.1-.5c.1-.6.4-1.2 1-1.7A5.9 5.9 0 0 0 12 3.2Z" />
    <path {...stroke} d="M9.6 18.4h4.8M10.5 20.8h3" />
  </svg>
);
// Two figures in an outlined disc — the mockup's "Everyone gets stuck" mark.
const IconPeople = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
    <circle {...stroke} cx="9" cy="7.8" r="3.2" />
    <circle {...stroke} cx="16.8" cy="9.4" r="2.5" />
    <path {...stroke} d="M3.6 19.4a5.4 5.4 0 0 1 10.8 0" />
    <path {...stroke} d="M15.6 14.4a4.4 4.4 0 0 1 4.8 4.3" />
  </svg>
);
const IconSteps = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
    <path {...stroke} d="M10.2 6.4h9.4M10.2 12h9.4M10.2 17.6h9.4" />
    <path {...stroke} d="m3.6 6.1 1.3 1.3 2.2-2.3M3.6 11.7l1.3 1.3 2.2-2.3M3.6 17.3l1.3 1.3 2.2-2.3" />
  </svg>
);

// The three-step spine. Named as outcomes, not features — the point is what
// the reader ends up with, not what the software does.
const STEPS = [
  { Icon: IconAsk,   tint: CLR.green,   bg: '#eaf1ec', l1: 'Thoughtful', l2: 'Questions' },
  { Icon: IconClear, tint: CLR.gold500, bg: '#fbf1de', l1: 'Clear',      l2: 'Understanding' },
  { Icon: IconSteps, tint: CLR.blue,    bg: '#e8eef7', l1: 'Practical',  l2: 'Next Steps' },
];

// What actually happens, in order, from the visitor's side of the screen.
const HOW = [
  { n: 1, tint: CLR.green,   title: 'Describe your situation.',        body: 'Tell us what’s going on, in your own words.' },
  { n: 2, tint: CLR.gold500, title: 'Answer a few thoughtful questions.', body: 'We’ll ask what matters so we understand your context.' },
  { n: 3, tint: CLR.navy500, title: 'Leave with clarity and next steps.', body: 'Clear advice, options to consider, and actions you can take.' },
];

// Every claim here is verifiable in the codebase. Nothing aspirational.
const TRUST = [
  { icon: '🔒', title: 'Private by design',        body: 'No account, and nothing you type is stored. There is no database.' },
  { icon: '💬', title: 'No prompt writing',        body: 'Labelled fields, not a blank box. You never have to phrase it.' },
  { icon: '📖', title: 'Plain language',           body: 'No jargon, and no filler to pad the answer out.' },
  { icon: '⚖️', title: 'Honest about uncertainty', body: 'Several will tell you not to act. That is the useful answer.' },
  { icon: '🌍', title: 'Works where you are',      body: '13 languages, and local law and currency where it matters.' },
  { icon: '🆓', title: 'Free, with no catch',      body: 'No trial, no card, no upsell. Every one, every time.' },
];

// PLACEHOLDER. Swap for real quotes once the feedback sink has any; until
// then the UI says so rather than implying these are customers.
const STORIES = [
  { quote: 'I almost signed a lease with a clause that would have cost me thousands.', who: 'Placeholder', role: 'Renter' },
  { quote: 'It helped me ask the questions I did not know to ask at my appointment.',  who: 'Placeholder', role: 'Patient' },
  { quote: 'I finally understood what that contract actually meant.',                  who: 'Placeholder', role: 'Small business owner' },
];

const CURIOUS = [
  { id: 'WrongAnswersOnly', name: 'Wrong Answers Only', blurb: 'Confidently, beautifully incorrect' },
  { id: 'PlotTwist',        name: 'Plot Twist',         blurb: 'See every angle of a decision' },
  { id: 'AnalogyEngine',    name: 'Analogy Engine',     blurb: 'Explain anything, using their world' },
];

const Card = ({ children, style }) => (
  <div style={{
    background: '#fff', border: `1px solid ${CLR.sand200}`, borderRadius: d(16),
    padding: `${d(20)}px ${d(22)}px`, ...style,
  }}>{children}</div>
);

const SectionTitle = ({ children, style }) => (
  <h3 style={{
    fontFamily: SERIF, fontSize: d(21), fontWeight: 700,
    color: CLR.navy700, margin: 0, ...style,
  }}>{children}</h3>
);

const HomeIntro = ({ categories = [], toolCount = 0, onBrowse }) => {
  const navigate = useNavigate();
  const [ask, setAsk] = useState('');

  // The hero asks a question, so it should accept an answer. Submitting hands
  // the text to ToolFinder as ?q=, which runs it on arrival — the visitor
  // types their problem once, on the first screen, and never retypes it.
  // An empty submit still goes there rather than doing nothing, because the
  // question is also the label on the way in.
  const askSubmit = (e) => {
    e.preventDefault();
    const q = ask.trim();
    navigate(q ? `/ToolFinder?q=${encodeURIComponent(q)}` : '/ToolFinder');
  };

  return (
    <div className="db-home-intro">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section style={{ paddingBlock: `${d(14)}px ${d(46)}px` }}>
        <h2 style={{
          fontFamily: SERIF, fontWeight: 700, color: CLR.navy700,
          fontSize: `clamp(${d(30)}px, 4.3vw, ${d(48)}px)`,
          lineHeight: 1.17, letterSpacing: '-0.5px', margin: 0, maxWidth: MEASURE,
        }}>
          Life doesn&rsquo;t come with instructions.
        </h2>
        <p style={{
          fontFamily: SERIF, fontWeight: 600, color: CLR.gold700,
          fontSize: `clamp(${d(22)}px, 3.1vw, ${d(34)}px)`,
          lineHeight: 1.24, letterSpacing: '-0.2px',
          margin: `${d(10)}px 0 0`, maxWidth: d(440),
        }}>
          You don&rsquo;t have to figure everything out alone.
        </p>
        <p style={{ maxWidth: MEASURE, marginTop: d(22), fontSize: b(15.5), lineHeight: 1.7, color: CLR.warm700 }}>
          When you&rsquo;re facing an important decision, confusing paperwork, a difficult
          conversation, or simply don&rsquo;t know what to do next, DeftBrain helps you think
          it through — one thoughtful question at a time.
        </p>

        <form onSubmit={askSubmit} style={{ marginTop: d(26), maxWidth: MEASURE }}>
          <label htmlFor="db-ask" className="sr-only">What do you need help with?</label>
          <div className="flex items-stretch" style={{
            background: '#fff', border: `1.5px solid ${CLR.sand300}`,
            borderRadius: d(14), overflow: 'hidden',
          }}>
            <span aria-hidden="true" style={{
              display: 'flex', alignItems: 'center', paddingInlineStart: d(14), fontSize: b(15),
            }}>🔍</span>
            <input
              id="db-ask" type="text" value={ask} onChange={(e) => setAsk(e.target.value)}
              placeholder="What do you need help with?"
              autoComplete="off"
              style={{
                flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent',
                padding: `${d(15)}px ${d(12)}px`, fontSize: b(15.5),
                color: CLR.warm800, fontFamily: 'inherit',
              }}
            />
            <button type="submit" aria-label={`Find the right ${UNIT.one}`}
              className="transition-opacity hover:opacity-90 flex-shrink-0"
              style={{
                background: CLR.navy600, color: '#fff', border: 0,
                padding: `0 ${d(20)}px`, fontSize: b(16), fontWeight: 700,
                cursor: 'pointer', minWidth: d(56),
              }}>
              &rarr;
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-3" style={{ marginTop: d(18) }}>
          {/* The fast path a returning visitor needs. The mockup put two full
              sections above the catalog; someone coming back to finish a lease
              review should not have to scroll past all of it. */}
          <button onClick={onBrowse} className="hover:underline inline-flex items-center min-h-[44px]"
            style={{ color: CLR.gold700, fontSize: b(14), fontWeight: 600, background: 'none' }}>
            or browse all {toolCount} {UNIT.many} &darr;
          </button>
          {/* Dropped the "search ⌘K" link that used to sit here: with a text
              box directly above it, two search affordances a line apart is one
              too many. ⌘K still works — the catalog box below owns it. */}
        </div>
      </section>

      {/* ── Everyone gets stuck ────────────────────────────────────────── */}
      <section style={{
        background: CLR.sand100, border: `1px solid ${CLR.sand200}`,
        borderRadius: d(18), padding: `${d(30)}px ${d(32)}px`, marginBottom: SECTION,
      }}>
        <div className="flex flex-col sm:flex-row sm:items-center" style={{ gap: d(28) }}>
          <span aria-hidden="true" style={{
            width: 92, height: 92, flexShrink: 0, borderRadius: '50%', padding: 22,
            border: `1px solid ${CLR.sand300}`, color: CLR.gold500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconPeople />
          </span>
          <div style={{ maxWidth: 620 }}>
            <SectionTitle>Everyone gets stuck.</SectionTitle>
            <p style={{ marginTop: d(10), fontSize: b(14.5), lineHeight: 1.7, color: CLR.warm700 }}>
              Sometimes it&rsquo;s a lease. Sometimes it&rsquo;s a medical appointment.
              Sometimes it&rsquo;s a suspicious email. Sometimes it&rsquo;s knowing what to say.
              Sometimes it&rsquo;s simply not knowing where to begin.
            </p>
            <p style={{ marginTop: d(14), fontSize: b(14.5), lineHeight: 1.7, color: CLR.gold700, fontWeight: 600 }}>
              Most people don&rsquo;t need more information. They need someone to help them
              think clearly. That&rsquo;s why DeftBrain exists.
            </p>
          </div>
        </div>
      </section>

      {/* ── Why: better questions, and the three-step spine ────────────── */}
      <section style={{ marginBottom: SECTION }}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
          <div style={{ flex: '1 1 420px', minWidth: 0 }}>
            <SectionTitle>Why DeftBrain?</SectionTitle>
            <p style={{ marginTop: d(10), fontSize: b(15), fontWeight: 600, color: CLR.warm800 }}>
              Better questions lead to better decisions.
            </p>
            <p style={{ marginTop: d(10), maxWidth: MEASURE, fontSize: b(14.5), lineHeight: 1.7, color: CLR.warm700 }}>
              Most websites give you information. Most chatbots begin with a blank page.
              DeftBrain begins with the questions someone who knew this problem would ask you.
            </p>

            {/* The spine, laid out as the flow it describes. Arrows are
                decorative and drop out when the row stacks on a phone —
                a "→" pointing down a column is a lie about the layout. */}
            <div className="flex flex-col sm:flex-row sm:items-center" style={{ marginTop: d(30), gap: d(16) }}>
              {STEPS.map((s, i) => (
                <React.Fragment key={s.l2}>
                  <div className="flex items-center flex-shrink-0" style={{ gap: d(13) }}>
                    {/* Literal, not d() — like the category tiles, these discs
                        are the section's landmark and shrinking them is what
                        made the flow read as a footnote. */}
                    <span style={{
                      width: 54, height: 54, flexShrink: 0, borderRadius: '50%',
                      background: s.bg, color: s.tint, padding: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <s.Icon />
                    </span>
                    <span style={{
                      fontSize: b(13), fontWeight: 700, color: CLR.navy700,
                      lineHeight: 1.25, letterSpacing: '-0.1px',
                    }}>
                      {s.l1}<br />{s.l2}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span aria-hidden="true" className="hidden sm:inline flex-shrink-0"
                      style={{ color: CLR.warm500, fontSize: b(15), lineHeight: 1 }}>&rarr;</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 2.05 MB source down to 198 KB / 99 KB. srcSet so a phone does not
              pull the desktop file; lazy + async so it never blocks the hero,
              and width/height so it reserves its space and cannot shift the
              layout as it arrives. */}
          <img
            src="/illustrations/clarity-signpost.jpg"
            srcSet="/illustrations/clarity-signpost-sm.jpg 760w, /illustrations/clarity-signpost.jpg 1200w"
            sizes="(max-width: 1023px) 100vw, 380px"
            width={1200} height={800}
            loading="lazy" decoding="async"
            alt="A signpost beside a winding path at sunrise, pointing to Clarity, Confidence and Next Steps."
            style={{
              flex: '0 1 400px', width: '100%', maxWidth: 400, height: 'auto', display: 'block',
              // Bordered card in, soft edge out. The mockup lets the
              // illustration dissolve into the page rather than sit in a box,
              // and the box was reading as a screenshot pasted onto the page.
              WebkitMaskImage: MASK, maskImage: MASK,
            }}
          />
        </div>
      </section>

      {/* ── Wherever life takes you — real categories, real counts ─────── */}
      {categories.length > 0 && (
        <section style={{ marginBottom: SECTION }}>
          <SectionTitle>Wherever life takes you&hellip;</SectionTitle>
          {/* Tiles, not pills, and the one place that deliberately inverts the
              density pass: the icon gets BIGGER while the label gets smaller.
              A wall of fourteen is scanned by shape, not read, so the emoji is
              doing the work and the words are only confirming it. Sizes here
              are literal, not d()/b(), because shrinking them is exactly wrong.

              Column count via clamp inside minmax rather than a fixed track:
              auto-fit alone cannot be both 3-up on a phone and 7-up on a
              desktop, and 7-up is what makes fourteen land as two full rows
              instead of a ragged 11 + 3. */}
          <div style={{
            marginTop: d(14), display: 'grid', gap: d(10),
            gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(104px, 11vw, 150px), 1fr))',
          }}>
            {categories.map(c => (
              <button key={c.name} onClick={() => c.onSelect && c.onSelect(c.name)}
                className="transition-colors hover:bg-white"
                style={{
                  background: '#fff', border: `1px solid ${CLR.sand200}`, borderRadius: d(14),
                  padding: `${d(14)}px ${d(8)}px ${d(12)}px`, minHeight: 44,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: d(7),
                }}>
                <span aria-hidden="true" style={{
                  width: 46, height: 46, borderRadius: '50%', background: CLR.sand50,
                  border: `1px solid ${CLR.sand200}`, display: 'flex', flexShrink: 0,
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, lineHeight: 1,
                }}>{c.emoji}</span>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: CLR.navy700,
                  lineHeight: 1.25, textAlign: 'center',
                }}>{c.name}</span>
                <span style={{ fontSize: 11, color: CLR.warm500, lineHeight: 1 }}>
                  {c.count} {UNIT.many}
                </span>
              </button>
            ))}
          </div>
          <p style={{ marginTop: d(12), fontSize: b(13.5), color: CLR.warm500 }}>
            {toolCount} {UNIT.many}, each built for one specific problem.
          </p>
        </section>
      )}

      {/* ── How it works · trust · stories ─────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ marginBottom: SECTION }}>
        <Card>
          <SectionTitle style={{ fontSize: d(19) }}>How it works</SectionTitle>
          {/* Numbered spine with a rule running behind it, so three steps read
              as one sequence rather than three unrelated notes. The rule is
              drawn per-item and skipped on the last so it stops at step 3. */}
          <ol style={{ marginTop: d(14), padding: 0, listStyle: 'none', display: 'grid', gap: d(14) }}>
            {HOW.map((h, i) => (
              <li key={h.n} className="flex items-start" style={{ gap: d(12), position: 'relative' }}>
                {i < HOW.length - 1 && (
                  <span aria-hidden="true" style={{
                    position: 'absolute', insetInlineStart: d(13), top: d(28),
                    width: 1, bottom: -d(14), background: CLR.sand200,
                  }} />
                )}
                <span style={{
                  width: d(27), height: d(27), flexShrink: 0, borderRadius: '50%',
                  background: h.tint, color: '#fff', fontSize: b(12), fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', zIndex: 1,
                }}>{h.n}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: b(13.5), fontWeight: 700, color: CLR.navy700, margin: 0, lineHeight: 1.35 }}>
                    {h.title}
                  </p>
                  <p style={{ fontSize: b(13), lineHeight: 1.5, color: CLR.warm700, margin: `${d(3)}px 0 0` }}>
                    {h.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <SectionTitle style={{ fontSize: d(19) }}>Built around trust</SectionTitle>
          <div style={{ marginTop: d(12), display: 'grid', gap: d(11) }}>
            {TRUST.map(t => (
              <div key={t.title} className="flex items-start gap-2.5">
                <span style={{ fontSize: b(15), lineHeight: 1.3, flexShrink: 0 }} aria-hidden="true">{t.icon}</span>
                <div>
                  <p style={{ fontSize: b(13.5), fontWeight: 700, color: CLR.navy700, margin: 0 }}>{t.title}</p>
                  <p style={{ fontSize: b(13), lineHeight: 1.5, color: CLR.warm700, margin: `${d(2)}px 0 0` }}>{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-1.5">
            <SectionTitle style={{ fontSize: d(19) }}>Real stories from real people</SectionTitle>
            {/* Says so in the UI. There is no feedback in the sink yet, and a
                site that promises honesty cannot quietly invent customers. */}
            <span style={{
              fontSize: cap(10), fontWeight: 800, letterSpacing: '0.08em', color: CLR.gold700,
              border: `1px solid ${CLR.sand300}`, borderRadius: 999,
              padding: `${d(2)}px ${d(8)}px`, alignSelf: 'flex-start',
            }}>PLACEHOLDER — AWAITING REAL FEEDBACK</span>
          </div>
          <div style={{ marginTop: d(12), display: 'grid', gap: d(12) }}>
            {STORIES.map((s, i) => (
              <figure key={i} style={{ margin: 0 }}>
                <blockquote style={{ margin: 0, fontSize: b(13.5), lineHeight: 1.55, color: CLR.warm800 }}>
                  &ldquo;{s.quote}&rdquo;
                </blockquote>
                <figcaption style={{ marginTop: d(3), fontSize: cap(12), color: CLR.warm500 }}>
                  {s.who} &middot; {s.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </Card>
      </section>

      {/* ── Curiosity ──────────────────────────────────────────────────── */}
      {/* Lavender, from the designer's palette, and the only place it appears:
          this is the one section that is not about being stuck, and the shift
          in colour is what says so before the heading does. */}
      <section style={{
        background: CLR.lavender, borderRadius: d(18),
        padding: `${d(26)}px ${d(28)}px`, marginBottom: SECTION,
      }}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Decorative, so alt="" — the heading beside it already says this.
              multiply is load-bearing: the asset's background was lifted to
              pure white precisely so this blend erases it and the lavender
              runs straight through. Swap the file for one with a coloured or
              off-white background and it will reappear as a grey box. */}
          <img
            src="/illustrations/thinking-brain.png"
            width={250} height={180}
            loading="lazy" decoding="async"
            alt=""
            style={{
              width: d(180), height: 'auto', flexShrink: 0,
              display: 'block', mixBlendMode: 'multiply',
            }}
          />
          <div style={{ flex: '1 1 330px', minWidth: 0 }}>
            <SectionTitle style={{ fontSize: d(19), lineHeight: 1.4 }}>
              Not every visit begins with a problem.<br />Sometimes it begins with curiosity.
            </SectionTitle>
            <p style={{ marginTop: d(10), fontSize: b(14), lineHeight: 1.7, color: CLR.warm700 }}>
              Explore the ones built to help you imagine, laugh, discover, and think differently.
            </p>
          </div>
          {/* Two fixed columns, not auto-fit: four tiles want to be a 2x2
              block, and auto-fit kept resolving to three and orphaning
              "More" on a row of its own. */}
          <div style={{
            flex: '1 1 340px', display: 'grid', gap: d(9),
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          }}>
            {CURIOUS.map(c => (
              <Link key={c.id} to={`/${c.id}`}
                className="transition-colors hover:bg-white"
                style={{
                  background: '#fff', border: `1px solid ${CLR.sand200}`, borderRadius: d(12),
                  padding: `${d(10)}px ${d(14)}px`, minHeight: 44, display: 'inline-block',
                }}>
                <span style={{ display: 'block', fontSize: b(13.5), fontWeight: 700, color: CLR.navy700 }}>{c.name}</span>
                <span style={{ display: 'block', fontSize: cap(12), color: CLR.warm500 }}>{c.blurb}</span>
              </Link>
            ))}
            {/* The mockup's fourth tile. Three named examples imply the set is
                three; this says the door is wider and reuses the same scroll
                the hero's browse link uses. */}
            <button onClick={onBrowse} className="transition-colors hover:bg-white text-start"
              style={{
                background: '#fff', border: `1px solid ${CLR.sand200}`, borderRadius: d(12),
                padding: `${d(10)}px ${d(14)}px`, minHeight: 44,
              }}>
              <span style={{ display: 'block', fontSize: b(13.5), fontWeight: 700, color: CLR.navy700 }}>More</span>
              <span style={{ display: 'block', fontSize: cap(12), color: CLR.gold700 }}>Explore all &rarr;</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Closing ────────────────────────────────────────────────────── */}
      <section style={{
        background: CLR.navy600, borderRadius: d(18),
        padding: `${d(26)}px ${d(30)}px`, marginBottom: d(28),
      }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:justify-between">
          <div>
            <p style={{ fontFamily: SERIF, fontSize: d(20), fontWeight: 700, color: '#fff', margin: 0 }}>
              Whatever brought you here&hellip;
            </p>
            <p style={{ fontFamily: SERIF, fontSize: d(20), fontWeight: 700, color: '#e8be7a', margin: `${d(2)}px 0 0` }}>
              Let&rsquo;s think it through together.
            </p>
          </div>
          {/* Button and mark travel together, or justify-between spreads all
              three children and strands the CTA in the middle of the band. */}
          <div className="flex items-center flex-shrink-0" style={{ gap: d(20) }}>
            <Link to="/ToolFinder" className="inline-flex items-center gap-2 transition-opacity hover:opacity-90"
              style={{
                background: '#e8be7a', color: CLR.navy700, borderRadius: d(12),
                padding: `${d(12)}px ${d(22)}px`, fontSize: b(15), fontWeight: 800, minHeight: 48,
              }}>
              Start here &rarr;
            </Link>
            {/* Decorative — the wordmark above already names us, and a second
                "DeftBrain" read aloud after the CTA helps nobody. Hidden below
                sm, where the row stacks and it would only add height. */}
            <img src="/pBrain-r.png" alt="" width={560} height={366}
              loading="lazy" decoding="async"
              className="hidden sm:block flex-shrink-0"
              style={{ height: d(62), width: 'auto' }}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeIntro;
