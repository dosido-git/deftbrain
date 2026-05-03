/**
 * DemoCards — Homepage "see what this actually does" block.
 * ──────────────────────────────────────────────────────────
 * Three example tools rendered as input/output cards. The point is to
 * show a first-time visitor what they actually get when they use the
 * site, instead of asking them to take a wall of tool names on faith.
 *
 * Examples are bucketed by register (practical / social / craft) and
 * one is picked from each bucket per visit. The bucket structure
 * guarantees variety — visitors always see a diagnostic tool, a
 * communication tool, and a writing tool, regardless of which specific
 * ones get rotated in. Stable for the session; refresh = new pick.
 * Uses localStorage to avoid showing the same trio twice in a row.
 *
 * Snippets are hand-curated, NOT live AI calls — keeps the homepage
 * fast, free of API costs, and deterministic. To swap which tools
 * appear, edit the EXAMPLE_BUCKETS object below. Bucket labels are
 * internal-only (they don't render to the user), so feel free to
 * reorganize as the catalog grows.
 *
 * Props:
 *   isDark    — boolean, from useTheme() in the parent (default: false)
 *   className — optional additional classes on the wrapper
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// ─── EXAMPLE BUCKETS ──────────────────────────────────────────────────
// One example is picked from each bucket per visit. Add/remove/edit
// freely within any bucket; just keep the three keys (practical/social/
// craft) populated with at least one example each.
const EXAMPLE_BUCKETS = {
  practical: [
    {
      id: 'PlantRescue',
      title: 'Plant Rescue',
      icon: '🪴',
      tagline: 'Diagnose and rescue your struggling plants',
      input:
        'My monstera has yellow leaves with brown crispy edges. I water it weekly. South-facing window.',
      output:
        'Yellow + crispy edges with that much south sun = sunburn, not water stress. Move it 3 feet back from the glass. The damaged leaves won\u2019t recover, but new growth comes in clean within 2 weeks.',
    },
    {
      id: 'RecipeChaosSolver',
      title: 'Recipe Chaos Solver',
      icon: '🍳',
      tagline: 'Your kitchen 911 — from crisis to confidence',
      input:
        'Making chili and forgot to defrost the ground beef. Guests in 90 minutes.',
      output:
        'Don\u2019t try to defrost \u2014 cook from frozen. Drop the still-frozen block into a hot pot, sear 4 minutes, then break it apart with a wooden spoon as it thaws. 8 more minutes till browned. You lose 20 minutes total, well inside your window.',
    },
    {
      id: 'BikeMedic',
      title: 'Bike Medic',
      icon: '🚴',
      tagline: 'A trailside mechanic in your pocket',
      input:
        'Front brake started squealing this morning, then went spongy on my way home.',
      output:
        'Squeal first, then sponginess = pads got contaminated, probably with chain lube. They won\u2019t recover \u2014 swap them tonight. While you\u2019re in there, check the rotor: if it\u2019s shiny, sand it lightly with 80-grit before installing the new pads.',
    },
    {
      id: 'PetWeirdnessDecoder',
      title: 'Pet Weirdness Decoder',
      icon: '🐾',
      tagline: 'Is it quirky or concerning? Let\u2019s find out',
      input:
        'My cat keeps knocking water glasses off the counter. Always full ones, never empty.',
      output:
        'Probably not malice \u2014 it\u2019s the reflection. Full glasses catch light and motion in a way empty ones don\u2019t, and that\u2019s irresistible to a hunter brain. Swap to a heavy ceramic mug and the behavior usually stops. If it doesn\u2019t, she\u2019s telling you she wants more enrichment in her day.',
    },
  ],

  social: [
    {
      id: 'DecoderRing',
      title: 'Decoder Ring',
      icon: '🔍',
      tagline: 'Decode what they actually mean beneath what they said',
      input:
        'My boss just said: "Let\u2019s circle back on this when you have more bandwidth."',
      output:
        'Translation: this isn\u2019t a priority for them, and they want you to drop it without saying so directly. "When you have more bandwidth" is the tell \u2014 it puts you as the constraint, not the idea. If you still believe in it, come back with data, not the same pitch.',
    },
    {
      id: 'DifficultTalkCoach',
      title: 'Difficult Talk Coach',
      icon: '💬',
      tagline: 'Practice hard conversations before they happen',
      input:
        'I need to tell my roommate the dishes situation has gotten unbearable. We\u2019ve never had this conversation.',
      output:
        'Open with what you noticed, not what they did: "I\u2019ve been doing all the kitchen cleanup for three weeks and I\u2019m starting to resent it." Puts the feeling on you, not blame on them. Then ask what\u2019s going on before suggesting a fix \u2014 they may have a reason that becomes part of the solution.',
    },
    {
      id: 'EmailUrgencyTriager',
      title: 'Email Urgency Triager',
      icon: '📨',
      tagline: 'Find out what actually needs a reply today',
      input:
        '"URGENT: Quick question \u2014 when can you join the steering committee for the Q3 launch retro?"',
      output:
        'Not urgent. The "URGENT" is theater \u2014 actual urgency would name a deadline. This is a recruiting ask dressed up to feel important. Reply tomorrow. If you say yes, scope the time commitment first; steering committees expand without warning.',
    },
    {
      id: 'ComebackCooker',
      title: 'Comeback Cooker',
      icon: '💭',
      tagline: 'The perfect response you thought of 3 hours too late',
      input:
        'At dinner my cousin said "must be nice to have so much free time, working remote." I just smiled.',
      output:
        'Three options, sharpest first: (1) "It is nice \u2014 same workload, fewer meetings about meetings." (2) "I trade the commute for actual outputs. You should try it." (3) "Glad it looks easy from the outside." Land one and move on \u2014 don\u2019t relitigate.',
    },
  ],

  craft: [
    {
      id: 'ToastWriter',
      title: 'ToastWriter',
      icon: '🥂',
      tagline: 'Toasts, speeches, and tributes that land',
      input:
        'Best man toast for my brother Daniel. He\u2019s marrying Sarah. They met when he spilled an iced latte on her.',
      output:
        'Daniel has been spilling things on people for as long as I\u2019ve known him. The difference is that this time, the woman wearing the iced latte didn\u2019t run away \u2014 she said "maybe sit down before you hurt someone." That, ladies and gentlemen, is when my brother fell in love.',
    },
    {
      id: 'BragSheetBuilder',
      title: 'Brag Sheet Builder',
      icon: '🏆',
      tagline: 'Turn humble descriptions into a complete career toolkit',
      input:
        'I led the migration of our customer support stack to a new vendor last quarter.',
      output:
        'RESUME LINE: "Led migration of customer support platform across 4 teams; cut response latency 31% and platform costs by $180K annually." INTERVIEW STORY: open with the stakeholder coordination problem, not the tech choice \u2014 interviewers care about how you handled humans more than which vendor you picked.',
    },
    {
      id: 'ColdOpenCraft',
      title: 'Cold Open Craft',
      icon: '✉️',
      tagline: 'First messages that actually get responses',
      input:
        'I want to message a designer I met briefly at a conference last month \u2014 she mentioned an interesting project.',
      output:
        'Skip the "great to meet you" opener \u2014 she met 40 people too. Lead with her project: "I\u2019ve been thinking about what you said about [specific thing] \u2014 I\u2019m wrestling with the same question on [your context]." Now you\u2019ve earned the next reply.',
    },
    {
      id: 'GratitudeDebtClearer',
      title: 'Gratitude Debt Clearer',
      icon: '🙏',
      tagline: 'Convert bullet points into polished thank-yous',
      input:
        'I owe my old manager a thank-you. He wrote me a recommendation that landed me my current job, and I never properly thanked him.',
      output:
        'Direct and specific lands harder than effusive: "Hey [name] \u2014 I should have written this six months ago, but the recommendation you wrote landed me at [company], and I\u2019m three weeks in and loving it. I credit you specifically with the line about [thing] \u2014 it\u2019s exactly what they hired me to do. Thank you." Send today.',
    },
  ],
};

// Render order is fixed: practical → social → craft. Keeps the layout
// grammar predictable (left = diagnostic, middle = social, right = writing).
const BUCKET_ORDER = ['practical', 'social', 'craft'];

const STORAGE_KEY = 'deftbrain:last-demo-trio';

// localStorage helpers — best-effort, fall through safely on SSR / private mode.
const readLastTrio = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      // Format: "bucket1:id1|bucket2:id2|bucket3:id3"
      return raw.split('|').reduce((acc, pair) => {
        const [bucket, id] = pair.split(':');
        if (bucket && id) acc[bucket] = id;
        return acc;
      }, {});
    }
  } catch (e) { /* localStorage unavailable */ }
  return {};
};

const writeLastTrio = (trio) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const value = BUCKET_ORDER.map((b) => `${b}:${trio[b].id}`).join('|');
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  } catch (e) { /* localStorage unavailable */ }
};

const pickFromBucket = (bucket, lastId) => {
  const pool = lastId ? bucket.filter((ex) => ex.id !== lastId) : bucket;
  // Fallback if the bucket was edited down to just the last-shown one.
  const safePool = pool.length > 0 ? pool : bucket;
  return safePool[Math.floor(Math.random() * safePool.length)];
};

const DemoCards = ({ isDark = false, className = '' }) => {
  // Pick once on mount; stable for the session. Refresh = new picks.
  const [trio] = useState(() => {
    const last = readLastTrio();
    const pick = {
      practical: pickFromBucket(EXAMPLE_BUCKETS.practical, last.practical),
      social:    pickFromBucket(EXAMPLE_BUCKETS.social,    last.social),
      craft:     pickFromBucket(EXAMPLE_BUCKETS.craft,     last.craft),
    };
    writeLastTrio(pick);
    return pick;
  });

  // Match the dashboard's sand / navy / gold palette
  const cardBg     = isDark ? 'bg-zinc-800'     : 'bg-white';
  const cardBorder = isDark ? 'border-zinc-700' : 'border-[#e8e1d5]'; // sand200
  const titleColor = isDark ? 'text-zinc-100'   : 'text-[#1e2a3a]';   // navy700
  const taglineCol = isDark ? 'text-zinc-400'   : 'text-[#8a8275]';   // warm500
  const labelColor = isDark ? 'text-zinc-500'   : 'text-[#a8a196]';
  const inputColor = isDark ? 'text-zinc-300'   : 'text-[#5a544a]';   // warm700
  const outputCol  = isDark ? 'text-zinc-100'   : 'text-[#1e2a3a]';   // navy700
  const dividerCol = isDark ? 'border-zinc-700' : 'border-[#f3efe8]'; // sand100
  const ctaColor   = isDark ? 'text-[#e8be7a]'  : 'text-[#c8872e]';   // gold500
  const sectionLab = isDark ? 'text-zinc-500'   : 'text-[#8a8275]';

  return (
    <section className={`w-full ${className}`}>
      <p
        className={`text-[10px] font-extrabold uppercase tracking-[0.15em] mb-3 ${sectionLab}`}
        style={{ paddingLeft: 12 }}
      >
        See what it does
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BUCKET_ORDER.map((bucketKey) => {
          const ex = trio[bucketKey];
          return (
            <Link
              key={bucketKey}
              to={`/${ex.id}`}
              className={`block ${cardBg} border ${cardBorder} rounded-2xl p-4 hover:shadow-md transition-shadow group`}
            >
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-2xl leading-none" aria-hidden="true">{ex.icon}</span>
                <div className="min-w-0">
                  <h3 className={`text-base font-bold leading-tight ${titleColor}`}>
                    {ex.title}
                  </h3>
                  <p className={`text-[11px] leading-tight mt-0.5 ${taglineCol}`}>
                    {ex.tagline}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className={`border-t ${dividerCol} my-3`} />

              {/* Input */}
              <p className={`text-[10px] font-bold uppercase tracking-[0.1em] mb-1 ${labelColor}`}>
                You type
              </p>
              <p className={`text-[13px] italic leading-snug mb-3 ${inputColor}`}>
                &ldquo;{ex.input}&rdquo;
              </p>

              {/* Output */}
              <p className={`text-[10px] font-bold uppercase tracking-[0.1em] mb-1 ${labelColor}`}>
                You get
              </p>
              <p className={`text-[13px] leading-snug ${outputCol}`}>
                {ex.output}
              </p>

              {/* CTA */}
              <p className={`text-xs font-bold mt-3 ${ctaColor} group-hover:underline`}>
                Try it &rarr;
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default DemoCards;
