// ============================================================
// guide-specs/workplace/what-does-kindly-mean-in-an-email.js
// ============================================================
// Source of truth for /guides/workplace/what-does-kindly-mean-in-an-email.
// Edit here; run `node scripts/build-guides.js workplace` to regenerate.
// ============================================================

module.exports = {
  slug:          'what-does-kindly-mean-in-an-email',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         'What "Kindly" Actually Means at the Start of an Email (And Why It Lands So Differently)',
  titleHtml:     'What "Kindly" Actually Means at the Start of an Email <em>(And Why It Lands So Differently)</em>',
  shortTitle:    'What "Kindly" Means in an Email',
  navTitle:      'What does kindly mean at the start of an email and why it lands differently',

  description:   "'Kindly send the report by Friday' isn't always cold. Sometimes it's standard polite English; sometimes it's a flag. Five contexts that change what 'kindly' actually signals.",
  deck:          "'Kindly send the report by Friday' isn't always cold. Sometimes it's standard polite English; sometimes it's a flag. Five contexts that change what 'kindly' actually signals.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `An email arrives. "Kindly send the deck by end of day." Two reactions are possible: a normal polite request, or a quiet correction with a smile attached. Which one it actually is depends almost entirely on context that has nothing to do with the word itself.`,
    `"Kindly" is one of the most context-dependent words in business email. In large parts of the world, it's just standard polite phrasing — interchangeable with "please" and carrying no extra weight at all. In American workplace English, the same word increasingly reads as cold or pointed. The difference between the two readings isn't the word. It's who sent it, where they learned business writing, and what came before.`,
  ],

  steps: [
    {
      name: "Read the standard polite usage",
      body: "The most common version globally, and the one Americans most often misread. In South Asian English, British English, much of African and Southeast Asian business English, and large stretches of customer service worldwide, 'kindly' is simply how polite requests open. 'Kindly send the report' carries the same warmth as 'please send the report' — sometimes more. The tell is regional and contextual: if the sender writes in a register that's consistently formal, if they use 'kindly' in routine messages with no friction attached, or if they're writing from a context where 'kindly' is the standard business idiom, the word means exactly what it says. Reading hostility into it usually says more about the reader's frame than the sender's intent.",
    },
    {
      name: "Spot the patient-but-firm version",
      body: "Sender is mildly frustrated but maintaining professionalism. The tell: 'kindly' appears in a follow-up to something that went unanswered, or in a message asking for the same thing again. The word is doing softening work — making a slightly sharper request feel less sharp by wrapping it in a polite register. Common in vendor relationships, project management, and contexts where the sender has authority but doesn't want to lean on it. The right response is to address the substance promptly and acknowledge the timing if relevant ('Sorry for the delay — sending now'). Don't over-apologize, but don't pretend you didn't notice the second ask, either.",
    },
    {
      name: "Recognize the status-imposition version",
      body: "Where 'kindly' is doing the opposite of what the word suggests. The sender is positioning themselves as being more patient, more polite, or more professional than the situation warrants — implying that you have been less so. The tell: the request itself is reasonable enough that it doesn't need softening, the rest of the email is unusually formal, or this person doesn't normally use 'kindly' but reached for it specifically here. The plausible deniability is the feature — they can claim they're just being polite if challenged, but the social meaning is a quiet correction of your tone or behavior. The right response is to handle the content cleanly without mirroring the framing. Answer the request, supply what's needed, don't escalate the formality. Directness, applied without performance, is the move.",
    },
    {
      name: "Notice the formal-request escalation",
      body: "When 'kindly' starts appearing in a relationship that was previously informal, that's a signal. The register is shifting because something is becoming more serious — a deadline that's been missed multiple times, a deliverable that's overdue, an issue that's becoming a problem. The tell: prior emails from this person were casual and 'kindly' is new, or the email otherwise reads more formally than the working relationship usually requires (cc'd people who weren't on prior threads, dates and details made specific, references to original commitments). The right move is to take the register shift seriously — match the formality, address the specifics directly, and assume the email may be read by people beyond the direct recipient. Don't be defensive in writing. Treat the formality as information rather than as an insult.",
    },
    {
      name: "Know the pattern that needs attention",
      body: "Where 'kindly' is the dominant register from someone who has had no friction with you and no escalation context. This usually isn't about you at all. The phrase appears constantly in messages that are otherwise routine because the sender learned business writing in a tradition where 'kindly' is the default polite opener, or because they're writing through an organizational template, or because they're doing customer-facing work where a fixed register is required. If every message from this person opens with 'kindly,' the word is just their standard register — not a flag of anything specific. Reading meaning into individual instances will lead you astray. The pattern is the meaning: this person writes formally. Adjust expectations, not interpretations.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Where did this person learn to write business email, and how do they normally start messages?",
    explanation: "The two questions that decode most 'kindly' moments. If the sender's regional register or organizational tradition uses 'kindly' as standard polite phrasing, the word means exactly what it says. If 'kindly' is unusual for this person specifically, or appears in a context where the request didn't need softening, it's doing something else. The word's social meaning is almost entirely set by who's sending it, not by what it dictionary-means.",
  },

  cta: {
    glyph:    '🔍',
    headline: "Get a read on the specific 'kindly' email you received",
    body:     "This guide covers five common contexts. Decoder Ring takes the actual email and the relationship context — who sent it, how they normally write, what came before in the thread — and tells you which interpretation is most likely, plus three response strategies calibrated to whichever reading you choose.",
    features: [
      "A specific read on the specific email you received",
      "The most likely interpretation, plus alternatives ranked",
      "Subtext and register analysis — regional norms, status moves, escalation cues",
      "Three response strategies calibrated to different readings",
      "Draft language that matches the right register without overcorrecting",
    ],
    toolId:   'DecoderRing',
    toolName: 'Decoder Ring',
  },
};
