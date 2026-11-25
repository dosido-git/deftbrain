// Conversations FAQ pages (topic: conversations) — how talk lands. Every claim
// is from the APA Dictionary of Psychology entry linked in that page's sources.
const { apa } = require('./apa');

const MODIFIED = '2026-11-25';

module.exports = [
  {
    slug: 'what-is-active-listening',
    question: 'What is active listening?',
    answer: 'Listening closely, asking questions as needed, to understand both what someone is saying and how strongly they feel it, then restating it to check you understood.',
    paras: [
      'The APA Dictionary describes it as a technique from therapy, particularly client-centered therapy, where the therapist restates what was said to make sure the understanding is accurate.',
      'The same two moves, a question to understand and a restatement to check, carry over to everyday conversations.',
    ],
    sources: [apa('active-listening')],
  },
  {
    slug: 'what-does-it-mean-to-be-assertive',
    question: 'What does it mean to be assertive?',
    answer: 'Expressing your feelings and needs directly while keeping respect for the other person. Psychologists treat it as a healthy, adaptive way of communicating.',
    paras: [
      'The APA Dictionary notes that a lack of assertiveness may contribute to depression and anxiety, while unhealthy attempts at it can come out as aggression.',
      'What separates assertive from aggressive, in that definition, is respect for the other person: both are direct.',
    ],
    sources: [apa('assertiveness')],
  },
  {
    slug: 'can-you-learn-to-be-more-assertive',
    question: 'Can you learn to be more assertive?',
    answer: 'Yes. Assertiveness training teaches people to express emotions, opinions and preferences, positive and negative, clearly, directly and appropriately.',
    paras: [
      'It works on words and on nonverbal signals, and often uses role play or rehearsal so people can practice before the real situation.',
    ],
    sources: [apa('assertiveness-training')],
  },
  {
    slug: 'what-does-passive-aggressive-mean',
    question: 'What does passive-aggressive mean?',
    answer: 'Behavior that looks harmless, accidental or neutral but indirectly expresses aggression.',
    paras: [
      'The APA Dictionary’s example: someone who constantly keeps people waiting and is then baffled that they resent it.',
      'The APA Dictionary describes the aggressive motive behind it as unconscious, so the person doing it may not recognize it.',
    ],
    sources: [apa('passive-aggressive')],
  },
  {
    slug: 'what-does-it-mean-to-be-defensive',
    question: 'What does it mean to be defensive?',
    answer: 'Being sensitive to criticism or comments about your shortcomings, and responding by countering or denying them.',
    paras: [
      'The APA Dictionary defines it as a tendency, so it describes a habit of response rather than a single reaction.',
    ],
    sources: [apa('defensiveness')],
  },
  {
    slug: 'what-is-the-difference-between-empathy-and-sympathy',
    question: 'What is the difference between empathy and sympathy?',
    answer: 'Empathy is understanding someone from their point of view, or sharing their feelings and thoughts. The APA Dictionary notes that empathy does not by itself include a wish to help, though it may turn into sympathy.',
    paras: [
      'Empathy can also turn into personal distress, and either sympathy or distress may lead someone to act.',
      'A related skill is perspective taking: looking at a situation from a viewpoint other than your usual one, such as another person’s.',
    ],
    sources: [apa('empathy'), apa('perspective-taking')],
  },
  {
    slug: 'what-is-nonverbal-communication',
    question: 'What is nonverbal communication?',
    answer: 'Conveying information without words: through facial expressions, gestures, body language, tone of voice and other physical signs of mood or attitude.',
    paras: [
      'The APA Dictionary notes that some nonverbal signals take knowledge of a culture or subculture to understand, so the same gesture can read differently to different people.',
    ],
    sources: [apa('nonverbal-communication')],
  },
  {
    slug: 'what-is-conflict-resolution',
    question: 'What is conflict resolution?',
    answer: 'Reducing discord and friction between people or groups, usually through active strategies such as conciliation, negotiation and bargaining.',
    paras: [
      'The word “active” matters: resolution comes from doing something about the conflict, not waiting for it to fade.',
    ],
    sources: [apa('conflict-resolution')],
  },
  {
    slug: 'why-do-we-blame-people-instead-of-circumstances',
    question: 'Why do we blame people instead of circumstances?',
    answer: 'Psychologists call it the fundamental attribution error: overestimating how much someone’s behavior comes from their personality or beliefs, and underestimating the pressures of their situation.',
    paras: [
      'Situational pressures include things like money or social pressure. The term was coined by social psychologist Lee Ross, and the APA Dictionary notes evidence that the tendency is more common in some societies than others.',
      'It is also called correspondence bias. Asking what situation would make the behavior understandable is one way to check it.',
    ],
    sources: [apa('fundamental-attribution-error')],
  },
  {
    slug: 'are-emotions-contagious',
    question: 'Are emotions contagious?',
    answer: 'They can be. Emotional contagion is the rapid spread of an emotion from one or a few people to others.',
    paras: [
      'The APA Dictionary’s example is fear of catching a disease spreading quickly through a community.',
    ],
    sources: [apa('emotional-contagion')],
  },
].map(p => ({ modified: MODIFIED, topic: 'conversations', ...p }));
