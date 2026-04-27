// ============================================================
// guide-specs/workplace/how-to-write-a-professional-email-when-youre-furious.js
// ============================================================
// Source of truth for /guides/workplace/how-to-write-a-professional-email-when-youre-furious.
// Edit here; run `node scripts/build-guides.js workplace` to regenerate.
// ============================================================

module.exports = {
  slug:          'how-to-write-a-professional-email-when-youre-furious',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Write a Professional Email When You're Actually Furious",
  titleHtml:     "How to Write a Professional Email <em>When You&#39;re Actually Furious</em>",
  shortTitle:    "How to Write a Professional Email When You're Furious",
  navTitle:      "How to write a professional email when you're actually furious",

  description:   "The professional email written from a furious place is a different animal from the one written from a calm one. Five steps for getting from rage to a message that lands without leaking the rage into it.",
  deck:          "The professional email written from a furious place is a different animal from the one written from a calm one. Five steps for getting from rage to a message that lands without leaking the rage into it.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `You're furious. Maybe a colleague took credit for your work. Maybe a vendor missed a third deadline and is now asking for an extension like nothing happened. Maybe your manager just Slacked you something that, read once, makes your hands shake. The cursor is blinking in a reply window and you have a choice to make in the next thirty seconds about what kind of correspondent you want to be remembered as.`,
    `Most professional emails written from a furious place fail in the same way: the author thinks they've sanded the rage off and they haven't. The reader picks up on it instantly — through word choice, sentence rhythm, the precision of the phrasing, the things that aren't said. The rage leaks through despite the surface politeness, which is the worst possible outcome: it gives the recipient permission to discount everything you said while also making you the one who lost composure. The five steps below are the sequence that actually closes that gap.`,
  ],

  steps: [
    {
      name: "Buy yourself a window — but write something now",
      body: "The reflexive advice is 'don't send angry emails — wait.' It's correct as far as it goes, but most people who follow it skip the part where you write the email anyway. The waiting is the right move; sending is the wrong move; but there's a third move in between that does real work: write the message you'd send if you weren't going to send it. Get every word out. The rage draft is a diagnostic — it tells you what you actually care about, what specific phrasing struck you, what the underlying ask is. You can't translate a draft you haven't written. The rule is: write it now, send it later — usually after a meal, a night, or at minimum an hour. The window between drafting and sending is where the actual work of the email gets done.",
    },
    {
      name: "Write the rage draft as the diagnostic, not the deliverable",
      body: "The rage draft has one job: surface what you actually care about. It does this by being unfiltered — insults, sarcasm, exaggerations, all of it. The rage draft is private. It will never leave your computer. So write it as honestly as you can. What's the specific thing that crossed the line? What's the pattern this fits into? What's the outcome you actually want — apology, behavior change, compensation, exit? The answers to these are usually buried in the third paragraph of the rage draft, after you've finished naming what made you angry and started circling toward what you want next. Highlight the answer when you find it. That highlighted sentence is the seed of the email you'll actually send. Everything else can be cut.",
    },
    {
      name: "Translate the content, don't sand the tone",
      body: "The most common mistake at this stage is to take the rage draft and run it through a tone filter — replacing 'this is unacceptable' with 'this is concerning,' 'you constantly do this' with 'this has happened before.' The result is a message that's calmer on the surface and identical underneath, and the reader feels the underneath. Real translation is content work, not tone work. It means moving from 'you did X and it was outrageous' to 'I want to address X — here's the impact and here's what I need.' The structure changes; the surface vocabulary is just one consequence of the structural change. If you find yourself replacing words and leaving the rest alone, you're sanding rather than translating, and the reader will notice.",
    },
    {
      name: "Match the level to the situation, not to your anger",
      body: "There's a continuum of professional firmness, and the right point on the continuum is determined by the situation, not by how angry you are. Three rough levels: Collaborative ('let's figure this out together,' assumes good faith), Balanced ('here's the issue and here's what needs to change'), and Firm ('this is unacceptable, here's what I expect, here are the consequences'). The instinct when furious is to send Firm regardless of context — because Firm matches your internal state. But Firm to a colleague who made a one-time honest mistake reads as wildly out of proportion; Collaborative to a vendor who has missed three deadlines reads as letting them off the hook. The discipline is to pick the level the situation calls for, even when your anger wants something stronger or your conflict-aversion wants something softer. The level should match the actual escalation of the issue — first incident gets Collaborative, repeated pattern gets Balanced, after polite attempts have failed you go Firm.",
    },
    {
      name: "Know when 'professional email' is the wrong tool entirely",
      body: "Some conversations should not happen in writing. Real-time disagreements, accusations, news of consequence, and anything where the recipient's reaction matters as much as your message all do badly in email. The reasons are mechanical: written words are stripped of tone, available for forwarding, harder to walk back, and read in the recipient's worst mood rather than yours. The signal you've reached the wrong tool: are you trying to deliver something the recipient will react to emotionally, in a medium where you can't see or shape the reaction? If yes, the medium is fighting you. The right move is often to send a short email proposing a conversation rather than the conversation itself: 'I want to talk through what happened in yesterday's meeting — do you have fifteen minutes today?' This isn't avoidance — it's recognizing that the work the conversation needs to do can't be done in writing. Email is a great tool for documenting, scheduling, and aligning on facts. It's a poor tool for relationship repair, accountability conversations with people you'll keep working with, and anything where 'how it lands' matters as much as 'what it says.'",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Did I write the rage draft, take a break, and then write the actual email — or am I about to send the rage draft with extra adjectives?",
    explanation: "The single best self-check before sending any email written from anger. The rage draft is a diagnostic; the actual email is a separate piece of writing that uses what the diagnostic surfaced. If the email you're about to send is structurally the same as your first draft with calmer vocabulary, you're sending the rage draft. If the email started from scratch after a window — a meal, a night, an hour minimum — and uses what you learned from the rage draft, you're sending the right message. Same principle, two completely different outcomes.",
  },

  cta: {
    glyph:    '🔨',
    headline: "Translate the rage draft into a professional email that actually lands",
    body:     "VelvetHammer takes the unfiltered angry draft you'd never send and produces three professional variants — Collaborative (assumes good faith), Balanced (clear boundaries), and Firm (direct but professional) — calibrated to your relationship, goal, and power dynamic. The factual claims survive; the inflammatory language doesn't.",
    features: [
      "Three professional variants from one rage draft — Collaborative, Balanced, Firm",
      "Calibration by relationship (boss / peer / direct report / vendor / external)",
      "Calibration by goal (apology, behavior change, compensation, alignment)",
      "Calibration by power dynamic (you have leverage / equal / they have leverage)",
      "Your original rage draft is never stored — privacy by design",
    ],
    toolId:   'VelvetHammer',
    toolName: 'Velvet Hammer',
  },
};
