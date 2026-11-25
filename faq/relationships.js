// Relationships FAQ pages (topic: relationships) — friendship, closeness and
// loneliness. Every claim is from the page linked in that entry's sources
// (CDC and the APA Dictionary of Psychology), read 2026-11-25.
const { apa } = require('./apa');

const S = {
  cdcAbout: { label: 'Social Connection (Centers for Disease Control and Prevention)', url: 'https://www.cdc.gov/social-connectedness/about/index.html' },
  cdcImprove: { label: 'Improving Social Connectedness (Centers for Disease Control and Prevention)', url: 'https://www.cdc.gov/social-connectedness/improving/index.html' },
};

const MODIFIED = '2026-11-25';

module.exports = [
  {
    slug: 'are-friendships-good-for-your-health',
    question: 'Are friendships good for your health?',
    answer: 'Yes. The CDC says people with stronger social bonds are more likely to live longer, healthier lives, and that social connection can help reduce the risk of heart disease, stroke, dementia, depression and anxiety.',
    paras: [
      'It also lists benefits for managing stress, anxiety and depression, for healthy eating and activity, and for sleep.',
      'Connections give emotional support, people to turn to in good and hard times, and practical support, such as a ride to the doctor or help with childcare at short notice.',
    ],
    sources: [S.cdcAbout],
  },
  {
    slug: 'how-do-you-make-friends-as-an-adult',
    question: 'How do you make friends as an adult?',
    answer: 'The CDC suggests small, regular acts: make time to contact people who care about you, join a group with shared interests, volunteer, and get to know your neighbors.',
    paras: [
      'It notes that no official guidelines exist and that making connections can be harder when you are in poor health, short of money or living alone.',
      'Its other suggestions: ask for help even when it is hard, offer support to others, express gratitude, and share things you already do, such as exercising or cooking, with other people.',
    ],
    sources: [S.cdcImprove],
  },
  {
    slug: 'can-you-feel-lonely-around-people',
    question: 'Can you feel lonely around people?',
    answer: 'Yes. One way psychologists define loneliness is as a gap between the relationships you want and the ones you have, in number or in quality, so it isn’t only about being alone.',
    paras: [
      'The APA Dictionary describes loneliness as discomfort from being, or perceiving yourself to be, alone. Social psychology stresses the distress of unmet needs for intimacy and companionship.',
      'Some existential and humanistic psychologists see it as a painful but inevitable part of life that can also lead to self-awareness and renewal.',
    ],
    sources: [apa('loneliness')],
  },
  {
    slug: 'what-is-the-difference-between-loneliness-and-social-isolation',
    question: 'What is the difference between loneliness and social isolation?',
    answer: 'Social isolation is an absence of contact with others; loneliness is the feeling of discomfort at being, or seeing yourself as, alone. One is a situation, the other an experience.',
    paras: [
      'Isolation can be voluntary or involuntary. The APA Dictionary notes it often produces abnormal behavioral and physical changes.',
      'Because loneliness depends on the gap between the relationships you want and the ones you have, someone can be isolated without feeling lonely, or lonely without being isolated.',
    ],
    sources: [apa('social-isolation'), apa('loneliness')],
  },
  {
    slug: 'what-is-an-attachment-style',
    question: 'What is an attachment style?',
    answer: 'The characteristic way a person relates to others in close relationships, shaped heavily by self-worth and trust. Four adult styles are usually identified: secure, preoccupied, dismissive and fearful.',
    paras: [
      'In theory, how secure an adult’s attachment is relates to how well they bonded with others as a child. The first styles were described in infants by Mary Ainsworth and colleagues.',
    ],
    sources: [apa('attachment-style')],
  },
  {
    slug: 'why-do-we-like-people-we-see-often',
    question: 'Why do we like people we see often?',
    answer: 'Partly the mere exposure effect: people tend to like something more the more often they are exposed to it, as long as they didn’t dislike it to begin with.',
    paras: [
      'The effect was identified in 1968 by psychologist Robert Zajonc. Physical nearness, called propinquity, is also an element in how close relationships form.',
    ],
    sources: [apa('mere-exposure-effect'), apa('propinquity')],
  },
  {
    slug: 'does-sharing-personal-things-bring-people-closer',
    question: 'Does sharing personal things bring people closer?',
    answer: 'Research says it does. Relationship studies show self-disclosure, revealing personal or private things about yourself, fosters feelings of closeness and intimacy.',
    paras: [
      'Social penetration theory, proposed in 1973 by Irwin Altman and Dalmas Taylor, describes relationships growing closer through increasingly intimate disclosures.',
    ],
    sources: [apa('self-disclosure'), apa('social-penetration-theory')],
  },
  {
    slug: 'why-do-we-like-people-who-like-us',
    question: 'Why do we like people who like us?',
    answer: 'Psychologists call it reciprocal liking: people feel attracted and warm toward others who are attracted to them.',
    paras: [
      'It sits alongside the wider norm of reciprocity, the expectation that people who help others will get equivalent help back.',
    ],
    sources: [apa('reciprocal-liking'), apa('reciprocity-norm')],
  },
  {
    slug: 'do-you-have-to-return-a-favor',
    question: 'Do you have to return a favor?',
    answer: 'There is no rule, but there is a strong social standard: the norm of reciprocity, the expectation that people who help others will receive equivalent benefits in return.',
    paras: [
      'The APA Dictionary says the expectation is common in many encounters and relationships.',
    ],
    sources: [apa('reciprocity-norm')],
  },
  {
    slug: 'what-kinds-of-social-support-are-there',
    question: 'What kinds of social support are there?',
    answer: 'Three main kinds: practical help, such as chores or advice; tangible support, such as money; and emotional support that leaves someone feeling valued, accepted and understood.',
    paras: [
      'Support can come from anyone in a person’s network: family, friends, neighbors, colleagues, caregivers, religious communities or support groups.',
    ],
    sources: [apa('social-support')],
  },
].map(p => ({ modified: MODIFIED, topic: 'relationships', ...p }));
