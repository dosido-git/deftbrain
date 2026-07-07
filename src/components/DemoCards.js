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
    {
      id: 'BillRescue',
      title: 'Bill Rescue',
      icon: '🧾',
      tagline: 'Fight surprise charges and win',
      input:
        'Hospital charged $1,200 for a blood panel my insurance pre-approved. My EOB says I owe $340.',
      output:
        'Your EOB wins. The $1,200 is the hospital\u2019s gross billed rate before insurance adjustment \u2014 you\u2019re contractually bound to $340. Call billing, read them the EOB line item, and ask them to rebill. If they push back, request an itemized statement and file a formal dispute.',
    },
    {
      id: 'LeaseTrapDetector',
      title: 'Lease Trap Detector',
      icon: '🏠',
      tagline: 'Spot the clauses that will cost you later',
      input:
        'Lease says tenant is responsible for all repairs under $200. Is that normal?',
      output:
        'Not standard \u2014 most leases cap tenant repairs at $50 or limit them to consumables like bulbs. At $200 you\u2019re on the hook for a busted lock, a faulty faucet, or a broken toilet flapper. Push to amend to $50 before you sign. If they won\u2019t move, budget $600\u2013900/year in surprise costs.',
    },
    {
      id: 'SubscriptionSlayer',
      title: 'Subscription Slayer',
      icon: '⚔️',
      tagline: 'Slay the subscriptions quietly draining you',
      input:
        'I\u2019m paying for streaming services I haven\u2019t opened in months but can\u2019t figure out exactly what.',
      output:
        'Pull your last two bank statements and scan for these amounts: $6.99, $8.99, $9.99, $13.99, $15.49, $17.99. Each is a subscription fingerprint. Any service you used under 4 hours last month costs more per hour than a cinema ticket. Cut them today \u2014 reinstatement takes 30 seconds.',
    },
    {
      id: 'LayoverMaximizer',
      title: 'Layover Maximizer',
      icon: '✈️',
      tagline: 'Make every layover count',
      input:
        '6-hour layover in Amsterdam. Never been. What can I actually do?',
      output:
        'You have enough time for the city. Schiphol to Centraal is 17 minutes by train. Skip the Rijksmuseum queue and go straight to the Jordaan \u2014 45 minutes of canals and no crowds. One lunch stop, one walk, back by hour 4. Leave 90 minutes minimum for security.',
    },
    {
      id: 'DoctorVisitPrep',
      title: 'Doctor Visit Prep',
      icon: '📋',
      tagline: 'Walk in prepared — so you don\'t waste the visit',
      input:
        'New patient appointment next week. Chronic lower back pain, some fatigue, three daily prescriptions. What do I bring?',
      output:
        'Write down: the three meds (name, dose, frequency), when the back pain started and what makes it better or worse, and a fatigue timeline. Bring your pharmacy printout if you\u2019re unsure of exact doses. Doctors form impressions from your prep quality, not your symptoms.',
    },
    {
      id: 'ProcedureProbe',
      title: 'Procedure Probe',
      icon: '🔬',
      tagline: 'Be an informed patient before you say yes',
      input:
        'My dentist wants to do a root canal on a tooth that only hurts sometimes. Is that normal?',
      output:
        'Intermittent pain is the classic root canal indicator \u2014 it means the nerve is inflamed but not yet dead. Once it goes fully necrotic, pain often stops but the infection continues. \u201cOnly hurts sometimes\u201d is not a reason to wait; it\u2019s a sign you\u2019re in the window where treatment is straightforward.',
    },
    {
      id: 'FakeReviewDetective',
      title: 'Fake Review Detective',
      icon: '🕵️',
      tagline: 'Spot manufactured reviews before you buy',
      input:
        'These headphones have 4.8 stars but the reviews feel off. Lots of \u201cI love this product!\u201d with no detail.',
      output:
        'Four red flags: accounts with one review each, five-star clusters on the same date, identical sentence structure, and enthusiasm with zero specifics. Legitimate headphone reviews mention driver size, soundstage, clamping force, or cable quality. \u201cI love this product!\u201d tells you the reviewer experienced nothing.',
    },
    {
      id: 'MarkupDetective',
      title: 'Markup Detective',
      icon: '🏷️',
      tagline: 'See the real price behind the sale tag',
      input:
        'Furniture store has a sectional marked down from $4,200 to $2,100. Real sale?',
      output:
        'Probably not. Most furniture retailers use MSRP inflation structurally \u2014 the \u201coriginal\u201d price is rarely what anyone paid. Search the model number. If the \u201csale\u201d price matches what competitors charge at full price, the $4,200 was theater. Real furniture discounts live in clearance on floor models and discontinued lines.',
    },
    {
      id: 'BuyWise',
      title: 'BuyWise',
      icon: '🛒',
      tagline: 'The research you\u2019d do if you had an hour — done in seconds',
      input:
        'Torn between a $1,100 laptop and a $1,600 one. The difference is the GPU.',
      output:
        'Ask one question: do you use GPU-accelerated software? Video editing, 3D rendering, ML, high-end gaming \u2014 yes. Everything else \u2014 no. If you\u2019re not in that list, the $500 buys you nothing you\u2019ll use. Get the $1,100 version. Everyday performance lives in the CPU, RAM, and SSD.',
    },
    {
      id: 'LazyWorkoutAdapter',
      title: 'Lazy Workout Adapter',
      icon: '🏋️',
      tagline: 'Adapt any workout to how you actually feel today',
      input:
        'Was supposed to run 8 miles but I got 4 hours of sleep and feel terrible. Do I push through?',
      output:
        'Skip the run. Sleep-deprived training suppresses immune function, increases injury risk, and produces low-quality adaptation \u2014 you\u2019re not building fitness, you\u2019re taxing recovery. 20 minutes easy walking or nothing at all. One missed run doesn\u2019t affect fitness; running wrecked affects the next two weeks.',
    },
    {
      id: 'DoctorVisitTranslator',
      title: 'Doctor Visit Translator',
      icon: '🩺',
      tagline: 'Understand what your doctor actually said',
      input:
        '"You have mild bilateral basal atelectasis. Clinically insignificant."',
      output:
        'Both lower lobes of your lungs have some partially collapsed air sacs \u2014 common from shallow breathing during still imaging. \u201cClinically insignificant\u201d means: this doesn\u2019t explain your symptoms and doesn\u2019t need treatment. Take deeper breaths. It resolves on its own.',
    },
    {
      id: 'LeftoverRoulette',
      title: 'Leftover Roulette',
      icon: '🎲',
      tagline: 'Turn fridge odds and ends into an actual meal',
      input:
        'Half an onion, cooked rice, three eggs, quarter block of firm tofu. What can I make?',
      output:
        'Fried rice in 12 minutes. Dice onion, cube tofu, get a pan screaming hot. Tofu first \u2014 4 minutes till golden. Add onion, 2 minutes. Push everything aside, crack in the eggs and scramble in the center. Add cold rice, break it up, toss everything. Soy sauce if you have it, salt if you don\u2019t.',
    },
  ],

  social: [
    {
      id: 'DecoderRing',
      title: 'Decoder Ring',
      icon: '🔍',
      tagline: 'Decode what they actually mean beneath what they said',
      input:
        'My boss just said: \u201cLet\u2019s circle back on this when you have more bandwidth.\u201d',
      output:
        'Translation: this isn\u2019t a priority for them, and they want you to drop it without saying so directly. \u201cWhen you have more bandwidth\u201d is the tell \u2014 it puts you as the constraint, not the idea. If you still believe in it, come back with data, not the same pitch.',
    },
    {
      id: 'DifficultTalkCoach',
      title: 'Difficult Talk Coach',
      icon: '💬',
      tagline: 'Practice hard conversations before they happen',
      input:
        'I need to tell my roommate the dishes situation has gotten unbearable. We\u2019ve never had this conversation.',
      output:
        'Open with what you noticed, not what they did: \u201cI\u2019ve been doing all the kitchen cleanup for three weeks and I\u2019m starting to resent it.\u201d Puts the feeling on you, not blame on them. Then ask what\u2019s going on before suggesting a fix \u2014 they may have a reason that becomes part of the solution.',
    },
    {
      id: 'EmailUrgencyTriager',
      title: 'Email Urgency Triager',
      icon: '📨',
      tagline: 'Find out what actually needs a reply today',
      input:
        '"URGENT: Quick question \u2014 when can you join the steering committee for the Q3 launch retro?"',
      output:
        'Not urgent. The \u201cURGENT\u201d is theater \u2014 actual urgency would name a deadline. This is a recruiting ask dressed up to feel important. Reply tomorrow. If you say yes, scope the time commitment first; steering committees expand without warning.',
    },
    {
      id: 'ComebackCooker',
      title: 'Comeback Cooker',
      icon: '💭',
      tagline: 'The perfect response you thought of 3 hours too late',
      input:
        'At dinner my cousin said \u201cmust be nice to have so much free time, working remote.\u201d I just smiled.',
      output:
        'Three options, sharpest first: (1) \u201cIt is nice \u2014 same workload, fewer meetings about meetings.\u201d (2) \u201cI trade the commute for actual outputs. You should try it.\u201d (3) \u201cGlad it looks easy from the outside.\u201d Land one and move on \u2014 don\u2019t relitigate.',
    },
    {
      id: 'ApologyCalibrator',
      title: 'Apology Calibrator',
      icon: '🤝',
      tagline: 'Get the tone, weight, and words exactly right',
      input:
        'I snapped at my partner mid-argument and said something I can\u2019t take back. I need to apologize.',
      output:
        'Skip \u201cI\u2019m sorry if you were hurt\u201d \u2014 that\u2019s not an apology. Go specific: \u201cI said [exact thing]. That was cruel and I knew it when I said it.\u201d Then stop. Don\u2019t explain why you were stressed. Don\u2019t ask for forgiveness in the same breath. Let the apology stand on its own.',
    },
    {
      id: 'VelvetHammer',
      title: 'Velvet Hammer',
      icon: '🪶',
      tagline: 'Hard messages delivered without causing damage',
      input:
        'I need to tell a contractor their last three deliverables were late and I\u2019m thinking about ending the contract.',
      output:
        'Don\u2019t soften this into confusion: \u201cThe last three projects came in late \u2014 [dates]. That\u2019s affecting my planning. I need the next deliverable by [date], hard stop. If that\u2019s not feasible, let\u2019s talk about wrapping up cleanly.\u201d Specific dates. Clear stakes. No ambiguity about what happens next.',
    },
    {
      id: 'MeetingBSDetector',
      title: 'Meeting BS Detector',
      icon: '🎯',
      tagline: 'Cut the language that wastes everyone\u2019s time',
      input:
        '"We need to socialize this idea across stakeholders before we can move forward."',
      output:
        'Translation: someone powerful hasn\u2019t approved it and the speaker won\u2019t name them. \u201cSocialize\u201d means get buy-in, not share information. Ask directly: \u201cWho specifically needs to sign off, and what do they need to see?\u201d Forces the real blocker into the open.',
    },
    {
      id: 'ConflictCoach',
      title: 'Conflict Coach',
      icon: '🥊',
      tagline: 'Navigate conflict without making it worse',
      input:
        'My coworker takes credit for our shared work in front of the manager. I need to address it without making it a war.',
      output:
        'Don\u2019t address it publicly \u2014 that creates sides. One private conversation, no accusation: \u201cI\u2019ve noticed our joint work gets introduced as yours in meetings. I want us to be deliberate about how we present shared projects going forward.\u201d You\u2019re not accusing them of intent. You\u2019re establishing a new expectation. If it happens again after that, it\u2019s deliberate.',
    },
    {
      id: 'LeverageLogic',
      title: 'Leverage Logic',
      icon: '⚖️',
      tagline: 'Find and use your leverage in any negotiation',
      input:
        'I have a job offer and want to negotiate the salary up by $15K. They said the number is firm.',
      output:
        '\u201cFirm\u201d is almost never firm \u2014 it means they\u2019d prefer not to move. Lead with the number you want, not a range \u2014 ranges anchor to the bottom. Competing offer is strongest. Market data second. Unique skills third. Ask once, clearly: \u201cGiven [reason], I\u2019m looking for $X. Is there flexibility?\u201d Then stop talking.',
    },
    {
      id: 'FriendshipFadeAlerter',
      title: 'Friendship Fade Alerter',
      icon: '👋',
      tagline: 'Catch a drifting friendship before it\u2019s gone',
      input:
        'My close friend and I used to talk every week. Now it\u2019s been two months of short replies. Do I say something?',
      output:
        'Say something. Friendships fade in silence because both people are waiting for the other to make it normal again. Skip the meta-conversation about the distance \u2014 just reach out like the gap didn\u2019t happen: \u201cI\u2019ve been thinking about you, what\u2019s going on?\u201d If they\u2019re going through something, you\u2019ve opened the door.',
    },
    {
      id: 'SocialBatteryAdvisor',
      title: 'Social Battery Advisor',
      icon: '🔋',
      tagline: 'Understand and manage your social battery',
      input:
        'I feel completely drained after social events, even ones I enjoy. Is something wrong with me?',
      output:
        'Nothing\u2019s wrong. Social drain isn\u2019t about whether you enjoyed it \u2014 it\u2019s about cognitive load. The fix isn\u2019t avoiding people; it\u2019s scheduling recovery. For every 3-hour social event, block 90 minutes of low-input time after. Knowing the recovery is scheduled changes how you experience the event itself.',
    },
    {
      id: 'NerveCheck',
      title: 'Nerve Check',
      icon: '😰',
      tagline: 'Turn pre-event nerves into fuel',
      input:
        'I have a job interview tomorrow and I can\u2019t sleep. I\u2019ve been catastrophizing for two hours.',
      output:
        'The catastrophizing is a sign you care, not a sign you\u2019ll fail. Reframe it: you\u2019re having a conversation where both sides are figuring out fit, not walking into a test. Do one thing tonight: write down three specific things you\u2019ve done that you\u2019re genuinely proud of. Read them before you go in. Concrete evidence beats abstract reassurance.',
    },
    {
      id: 'RoomReader',
      title: 'Room Reader',
      icon: '👀',
      tagline: 'Read any room, any situation, any dynamic',
      input:
        'I gave a presentation and halfway through I could tell I\u2019d lost the room. What should I have done?',
      output:
        'Stop and name it: \u201cI\u2019m going to pause \u2014 I want to make sure this is landing.\u201d That one move resets the room. It signals self-awareness, invites engagement, and gives you permission to adapt. Never power through a lost room \u2014 every slide you push past compounds the disconnect.',
    },
    {
      id: 'MoneyDiplomat',
      title: 'Money Diplomat',
      icon: '💵',
      tagline: 'Navigate money conversations without the awkward',
      input:
        'I need to ask my parents for a loan to cover an emergency. I\u2019ve never asked them for money as an adult.',
      output:
        'Lead with the specific amount and a concrete repayment plan before they can imagine something open-ended: \u201cI need $2,400 for a car repair. I can repay $400/month starting in 60 days.\u201d Specific numbers make it a transaction, not a dependency. The plan is what makes it a loan instead of a gift.',
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
        'Daniel has been spilling things on people for as long as I\u2019ve known him. The difference is that this time, the woman wearing the iced latte didn\u2019t run away \u2014 she said \u201cmaybe sit down before you hurt someone.\u201d That, ladies and gentlemen, is when my brother fell in love.',
    },
    {
      id: 'BragSheetBuilder',
      title: 'Brag Sheet Builder',
      icon: '🏆',
      tagline: 'Turn humble descriptions into a complete career toolkit',
      input:
        'I led the migration of our customer support stack to a new vendor last quarter.',
      output:
        'RESUME LINE: \u201cLed migration of customer support platform across 4 teams; cut response latency 31% and platform costs by $180K annually.\u201d INTERVIEW STORY: open with the stakeholder coordination problem, not the tech choice \u2014 interviewers care about how you handled humans more than which vendor you picked.',
    },
    {
      id: 'ColdOpenCraft',
      title: 'Cold Open Craft',
      icon: '✉️',
      tagline: 'First messages that actually get responses',
      input:
        'I want to message a designer I met briefly at a conference last month \u2014 she mentioned an interesting project.',
      output:
        'Skip the \u201cgreat to meet you\u201d opener \u2014 she met 40 people too. Lead with her project: \u201cI\u2019ve been thinking about what you said about [specific thing] \u2014 I\u2019m wrestling with the same question on [your context].\u201d Now you\u2019ve earned the next reply.',
    },
    {
      id: 'GratitudeDebtClearer',
      title: 'Gratitude Debt Clearer',
      icon: '🙏',
      tagline: 'Convert bullet points into polished thank-yous',
      input:
        'I owe my old manager a thank-you. He wrote me a recommendation that landed me my current job, and I never properly thanked him.',
      output:
        'Direct and specific lands harder than effusive: \u201cHey [name] \u2014 I should have written this six months ago, but the recommendation you wrote landed me at [company], and I\u2019m three weeks in and loving it. I credit you specifically with the line about [thing] \u2014 it\u2019s exactly what they hired me to do. Thank you.\u201d Send today.',
    },
    {
      id: 'JargonAssassin',
      title: 'Jargon Assassin',
      icon: '🗡️',
      tagline: 'Strip the jargon, keep the meaning',
      input:
        '"We\u2019re leveraging synergistic cross-functional alignment to optimize stakeholder outcomes at scale."',
      output:
        '\u201cWe\u2019re getting teams to work together so we can help more customers.\u201d That\u2019s it. The original used 14 words to say less than the 12-word version. Every jargon word you keep is a reader you\u2019re losing.',
    },
    {
      id: 'NameAudit',
      title: 'NameAudit',
      icon: '🔬',
      tagline: 'Know what your name is really saying',
      input:
        'My business name is "Nexaflow Solutions." Thoughts?',
      output:
        '\u201cNexa\u201d appears in 4,300+ company names. \u201cFlow\u201d in 6,800+. \u201cSolutions\u201d in tens of thousands. You\u2019ve assembled three of the least distinctive words in business naming \u2014 the combination reads as a placeholder, not a brand. A name this generic signals a product that hasn\u2019t found its identity yet.',
    },
    {
      id: 'ResearchDecoder',
      title: 'Research Decoder',
      icon: '📄',
      tagline: 'Turn academic papers into plain decisions',
      input:
        '"Effect sizes were modest (Cohen\u2019s d\u2009=\u20090.23) and did not reach conventional significance thresholds (p\u2009=\u20090.08)."',
      output:
        'Translation: it probably doesn\u2019t work, or the effect is too small to matter. d\u2009=\u20090.23 is a small effect \u2014 you\u2019d need to treat roughly 9 people to see one measurable benefit. p\u2009=\u20090.08 means there\u2019s an 8% chance the result is noise. Don\u2019t change your behavior based on this study alone.',
    },
    {
      id: 'SkillGapMap',
      title: 'Skill Gap Map',
      icon: '🗺️',
      tagline: 'Map the exact skills between where you are and where you want to be',
      input:
        'I\u2019m a graphic designer wanting to move into UX. What\u2019s actually in my way?',
      output:
        'Your visual and composition skills transfer directly \u2014 that\u2019s the foundation most UX designers lack. Your gaps: user research methods, information architecture, and the language of product teams (stories, sprints, handoffs). Portfolio fix: redesign one broken app end-to-end with documented research. That one project does more than any course.',
    },
    {
      id: 'ComplaintEscalationWriter',
      title: 'Complaint Escalation Writer',
      icon: '📝',
      tagline: 'Escalate effectively — and get results',
      input:
        'Contractor left the job half-finished and stopped responding three weeks ago. I\u2019ve already texted twice.',
      output:
        'Stop texting \u2014 switch to email for a paper trail. Subject: \u201cOutstanding work \u2014 [project], final notice before dispute.\u201d State the agreed scope, what\u2019s incomplete, the date they stopped responding, and a 7-day deadline. Close with: \u201cIf I don\u2019t hear from you by [date], I\u2019ll pursue resolution through [small claims / licensing board / card dispute].\u201d That last line is what makes contractors call back.',
    },
    {
      id: 'TheAlibi',
      title: 'The Alibi',
      icon: '🎭',
      tagline: 'Frame your career story so it lands every time',
      input:
        'I\u2019m applying for a marketing role but my last three years were freelancing. I\u2019m worried it looks inconsistent.',
      output:
        'Freelancing isn\u2019t inconsistency \u2014 it\u2019s a portfolio. The narrative: \u201cI spent three years choosing my clients, owning full campaigns end-to-end, and learning to work without a safety net.\u201d That\u2019s stronger than \u201cI executed what my manager approved.\u201d The risk is in how you tell it, not what it was. Lead with results.',
    },
    {
      id: 'DebateMe',
      title: 'Debate Me',
      icon: '⚔️',
      tagline: 'Steel-man your position. Demolish theirs.',
      input:
        'My friend argues remote work is always more productive than office work. How do I push back?',
      output:
        '\u201cAlways\u201d is where you win. Ask him to explain why surgery, manufacturing, and restaurants still require physical presence. Then narrow it: remote work outperforms for solo, deep-focus tasks with clear deliverables. It tends to underperform for early-career learning, ambiguous problems, and trust-building. The evidence is task-dependent, not universal.',
    },
    {
      id: 'TheFinalWord',
      title: 'The Final Word',
      icon: '⚖️',
      tagline: 'Arguments settled. Facts checked. No appeals.',
      input:
        'My brother insists Napoleon was short. I think that\u2019s a myth. Who\u2019s right?',
      output:
        'You\u2019re right. Napoleon was 5\u20196\u201d \u2014 average for a Frenchman of his era. The myth traces to British wartime propaganda that exaggerated a mistranslation: he was listed as 5\u20192\u201d in French inches, which British cartoonists ran with. He was also constantly surrounded by his Imperial Guard, who had a minimum height requirement of 5\u201911\u201d.',
    },
    {
      id: 'PlainTalk',
      title: 'Plain Talk',
      icon: '💬',
      tagline: 'Turn any complicated text into plain language',
      input:
        '"The implementation of this initiative is contingent upon the successful completion of the stakeholder alignment process."',
      output:
        '\u201cThis can\u2019t start until we agree internally.\u201d That\u2019s it. The original used 19 words and passive voice to avoid naming who owns the decision. Plain version: 9 words, one clear blocker, one clear action. Every word you cut is a reader who stays with you.',
    },
    {
      id: 'DecisionCoach',
      title: 'Decision Coach',
      icon: '🧭',
      tagline: 'Make better decisions with less second-guessing',
      input:
        'I\u2019ve been offered a promotion with a 40% raise but it requires moving to a city where I know nobody.',
      output:
        'You\u2019re not deciding between the job and the city \u2014 you\u2019re deciding what phase of life you want to be in. The money is concrete and immediate. The social cost is real but temporary; networks rebuild in 18 months with intention. The question: is this the move that opens the next door, or a ceiling with a higher salary? One leads somewhere. The other just pays more.',
    },
    {
      id: 'WhatIf',
      title: 'WhatIf',
      icon: '🌀',
      tagline: 'Explore any idea, scenario, or alternate history',
      input:
        'What if social media had never been invented?',
      output:
        'Political polarization develops more slowly \u2014 the algorithmic amplification of outrage didn\u2019t exist, though cable news was already doing a version of it. The Arab Spring probably doesn\u2019t happen as it did. Misinformation spreads slower but doesn\u2019t disappear. And the teenage mental health data looks dramatically different \u2014 that correlation is one of the strongest in the literature.',
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
  // Light-mode label inks darkened for WCAG: the old #a8a196 labels measured
  // 2.4:1 on white and #c8872e "Try it" 2.9:1 — invisible in sunlight.
  const taglineCol = isDark ? 'text-zinc-400'   : 'text-[#6e6659]';
  const labelColor = isDark ? 'text-zinc-500'   : 'text-[#6e6659]';
  const inputColor = isDark ? 'text-zinc-300'   : 'text-[#5a544a]';   // warm700
  const outputCol  = isDark ? 'text-zinc-100'   : 'text-[#1e2a3a]';   // navy700
  const dividerCol = isDark ? 'border-zinc-700' : 'border-[#f3efe8]'; // sand100
  const ctaColor   = isDark ? 'text-[#e8be7a]'  : 'text-[#9c691c]';   // gold700

  return (
    <section className={`w-full ${className}`}>
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
              <p className={`text-[13px] leading-snug line-clamp-4 ${outputCol}`}>
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
