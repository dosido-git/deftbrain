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
 *   why           why would a form beat a chatbox
 *   categories    how much is here                        (real names, real counts)
 *   how/trust     what happens, and can I trust it
 *   curiosity     what if I do not have a problem
 *   closing       one more way in
 *
 * Deliberate departures from the mockup, agreed before building:
 *   - "tools", not "experiences". Vaguer word, and it is what every listing,
 *     the schema, llms.txt and search all say.
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
import React from 'react';
import { Link } from 'react-router-dom';

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
};

const SERIF = "'Playfair Display', Georgia, serif";

// The three-step spine. Named as outcomes, not features — the point is what
// the reader ends up with, not what the software does.
const STEPS = [
  { icon: '❓', title: 'Thoughtful questions', body: 'The form already knows what to ask about your problem.' },
  { icon: '💡', title: 'Clear understanding',  body: 'Plain language, and honest about what is uncertain.' },
  { icon: '📋', title: 'Practical next steps', body: 'Something you can act on — a letter, a script, a checklist.' },
];

// Every claim here is verifiable in the codebase. Nothing aspirational.
const TRUST = [
  { icon: '🔒', title: 'Private by design',        body: 'No account, and nothing you type is stored. There is no database.' },
  { icon: '💬', title: 'No prompt writing',        body: 'Labelled fields, not a blank box. You never have to phrase it.' },
  { icon: '📖', title: 'Plain language',           body: 'No jargon, and no filler to pad the answer out.' },
  { icon: '⚖️', title: 'Honest about uncertainty', body: 'Several tools will tell you not to act. That is the useful answer.' },
  { icon: '🌍', title: 'Works where you are',      body: '13 languages, and local law and currency where it matters.' },
  { icon: '🆓', title: 'Free, with no catch',      body: 'No trial, no card, no upsell. Every tool, every time.' },
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
    background: '#fff', border: `1px solid ${CLR.sand200}`, borderRadius: 16,
    padding: '20px 22px', ...style,
  }}>{children}</div>
);

const HomeIntro = ({ categories = [], toolCount = 0, onBrowse, searchRef }) => {
  const focusSearch = (e) => {
    e.preventDefault();
    if (searchRef && searchRef.current) {
      searchRef.current.focus();
      searchRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="db-home-intro">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section style={{ paddingBlock: '8px 28px' }}>
        <h2 style={{
          fontFamily: SERIF, fontWeight: 700, color: CLR.navy700,
          fontSize: 'clamp(30px, 5.2vw, 48px)', lineHeight: 1.12, letterSpacing: '-0.5px', margin: 0,
        }}>
          Life doesn&rsquo;t come with instructions.
        </h2>
        <p style={{
          fontFamily: SERIF, fontWeight: 600, color: CLR.gold700,
          fontSize: 'clamp(22px, 3.8vw, 34px)', lineHeight: 1.2, letterSpacing: '-0.2px', margin: '6px 0 0',
        }}>
          You don&rsquo;t have to figure everything out alone.
        </p>
        <p style={{ maxWidth: 620, marginTop: 16, fontSize: 15.5, lineHeight: 1.6, color: CLR.warm700 }}>
          When you&rsquo;re facing an important decision, confusing paperwork, a difficult
          conversation, or simply don&rsquo;t know what to do next, DeftBrain helps you think
          it through — one thoughtful question at a time.
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-3" style={{ marginTop: 20 }}>
          <Link to="/ToolFinder" className="inline-flex items-center gap-2 transition-opacity hover:opacity-90"
            style={{
              background: CLR.navy600, color: '#fff', borderRadius: 12,
              padding: '13px 22px', fontSize: 15, fontWeight: 700, minHeight: 48,
            }}>
            What do you need help with? &rarr;
          </Link>
          {/* The fast path a returning visitor needs. The mockup put two full
              sections above the catalog; someone coming back to finish a lease
              review should not have to scroll past all of it. */}
          <button onClick={onBrowse} className="hover:underline inline-flex items-center min-h-[44px]"
            style={{ color: CLR.gold700, fontSize: 14, fontWeight: 600, background: 'none' }}>
            or browse all {toolCount} tools &darr;
          </button>
          <button onClick={focusSearch} className="hover:underline inline-flex items-center min-h-[44px]"
            style={{ color: CLR.warm500, fontSize: 13.5, fontWeight: 600, background: 'none' }}>
            search &#8984;K
          </button>
        </div>
      </section>

      {/* ── Everyone gets stuck ────────────────────────────────────────── */}
      <section style={{
        background: CLR.sand100, border: `1px solid ${CLR.sand200}`,
        borderRadius: 18, padding: '22px 24px', marginBottom: 26,
      }}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <span style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">👥</span>
          <div>
            <h3 style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 700, color: CLR.navy700, margin: 0 }}>
              Everyone gets stuck.
            </h3>
            <p style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.65, color: CLR.warm700 }}>
              Sometimes it&rsquo;s a lease. Sometimes it&rsquo;s a medical appointment.
              Sometimes it&rsquo;s a suspicious email. Sometimes it&rsquo;s knowing what to say.
              Sometimes it&rsquo;s simply not knowing where to begin.
            </p>
            <p style={{ marginTop: 10, fontSize: 14.5, lineHeight: 1.65, color: CLR.gold700, fontWeight: 600 }}>
              Most people don&rsquo;t need more information. They need someone to help them
              think clearly. That&rsquo;s why DeftBrain exists.
            </p>
          </div>
        </div>
      </section>

      {/* ── Why: better questions ──────────────────────────────────────── */}
      <section style={{ marginBottom: 26 }}>
        <h3 style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 700, color: CLR.navy700, margin: 0 }}>
          Why DeftBrain?
        </h3>
        <p style={{ marginTop: 6, fontSize: 15, fontWeight: 600, color: CLR.warm800 }}>
          Better questions lead to better decisions.
        </p>
        <p style={{ maxWidth: 660, marginTop: 8, fontSize: 14.5, lineHeight: 1.65, color: CLR.warm700 }}>
          Most websites give you information. Most chatbots begin with a blank page.
          DeftBrain begins with the questions someone who knew this problem would ask you.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ marginTop: 16 }}>
          {STEPS.map((s, i) => (
            <Card key={s.title}>
              <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden="true">{s.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: CLR.gold500 }}>STEP {i + 1}</span>
              </div>
              <p style={{ fontSize: 14.5, fontWeight: 700, color: CLR.navy700, margin: 0 }}>{s.title}</p>
              <p style={{ marginTop: 4, fontSize: 13.5, lineHeight: 1.55, color: CLR.warm700 }}>{s.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Wherever life takes you — real categories, real counts ─────── */}
      {categories.length > 0 && (
        <section style={{ marginBottom: 26 }}>
          <h3 style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 700, color: CLR.navy700, margin: 0 }}>
            Wherever life takes you&hellip;
          </h3>
          <div className="flex flex-wrap gap-2" style={{ marginTop: 14 }}>
            {categories.map(c => (
              <button key={c.name} onClick={() => c.onSelect && c.onSelect(c.name)}
                className="inline-flex items-center gap-2 transition-colors hover:bg-white"
                style={{
                  background: '#fff', border: `1px solid ${CLR.sand200}`, borderRadius: 12,
                  padding: '9px 13px', minHeight: 44,
                }}>
                <span style={{ fontSize: 15, lineHeight: 1 }} aria-hidden="true">{c.emoji}</span>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: CLR.navy700 }}>{c.name}</span>
                <span style={{ fontSize: 12, color: CLR.warm500 }}>{c.count}</span>
              </button>
            ))}
          </div>
          <p style={{ marginTop: 12, fontSize: 13.5, color: CLR.warm500 }}>
            {toolCount} tools, each built for one specific problem.
          </p>
        </section>
      )}

      {/* ── Trust + stories ────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ marginBottom: 26 }}>
        <Card>
          <h3 style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 700, color: CLR.navy700, margin: 0 }}>
            Built around trust
          </h3>
          <div style={{ marginTop: 12, display: 'grid', gap: 11 }}>
            {TRUST.map(t => (
              <div key={t.title} className="flex items-start gap-2.5">
                <span style={{ fontSize: 15, lineHeight: 1.3, flexShrink: 0 }} aria-hidden="true">{t.icon}</span>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: CLR.navy700, margin: 0 }}>{t.title}</p>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: CLR.warm700, margin: '2px 0 0' }}>{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 700, color: CLR.navy700, margin: 0 }}>
              Real stories from real people
            </h3>
            {/* Says so in the UI. There is no feedback in the sink yet, and a
                site that promises honesty cannot quietly invent customers. */}
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: CLR.gold700,
              border: `1px solid ${CLR.sand300}`, borderRadius: 999, padding: '2px 8px',
            }}>PLACEHOLDER — AWAITING REAL FEEDBACK</span>
          </div>
          <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
            {STORIES.map((s, i) => (
              <figure key={i} style={{ margin: 0 }}>
                <blockquote style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: CLR.warm800 }}>
                  &ldquo;{s.quote}&rdquo;
                </blockquote>
                <figcaption style={{ marginTop: 3, fontSize: 12, color: CLR.warm500 }}>
                  {s.who} &middot; {s.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </Card>
      </section>

      {/* ── Curiosity ──────────────────────────────────────────────────── */}
      <section style={{
        background: CLR.sand100, border: `1px solid ${CLR.sand200}`,
        borderRadius: 18, padding: '20px 22px', marginBottom: 26,
      }}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div style={{ flex: '1 1 260px' }}>
            <h3 style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 700, color: CLR.navy700, margin: 0 }}>
              Not every visit begins with a problem.
            </h3>
            <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.6, color: CLR.warm700 }}>
              Sometimes it begins with curiosity.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {CURIOUS.map(c => (
              <Link key={c.id} to={`/${c.id}`}
                className="transition-colors hover:bg-white"
                style={{
                  background: '#fff', border: `1px solid ${CLR.sand200}`, borderRadius: 12,
                  padding: '10px 14px', minHeight: 44, display: 'inline-block',
                }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: CLR.navy700 }}>{c.name}</span>
                <span style={{ display: 'block', fontSize: 12, color: CLR.warm500 }}>{c.blurb}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing ────────────────────────────────────────────────────── */}
      <section style={{
        background: CLR.navy600, borderRadius: 18, padding: '22px 24px', marginBottom: 22,
      }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <div>
            <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>
              Whatever brought you here&hellip;
            </p>
            <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: '#e8be7a', margin: '2px 0 0' }}>
              Let&rsquo;s think it through together.
            </p>
          </div>
          <Link to="/ToolFinder" className="inline-flex items-center gap-2 transition-opacity hover:opacity-90 flex-shrink-0"
            style={{
              background: '#e8be7a', color: CLR.navy700, borderRadius: 12,
              padding: '12px 22px', fontSize: 15, fontWeight: 800, minHeight: 48,
            }}>
            Start here &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomeIntro;
