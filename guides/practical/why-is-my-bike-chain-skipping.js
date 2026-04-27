module.exports = {
  slug:          'why-is-my-bike-chain-skipping',
  category:      'practical',
  categoryLabel: 'Practical',

  title:         "Why Is My Bike Chain Skipping (And the Three Things That Almost Always Fix It)",
  titleHtml:     "Why Is My Bike Chain Skipping <em>(And the Three Things That Almost Always Fix It)</em>",
  shortTitle:    "Why Is My Bike Chain Skipping",
  navTitle:      "Why is my bike chain skipping and the three things that almost always fix it",

  description:   "A skipping chain is one of the most common bike problems and one of the easiest to diagnose. The cause is almost always one of three things — and once you know which, the fix is usually quick.",
  deck:          "A skipping chain is one of the most common bike problems and one of the easiest to diagnose. The cause is almost always one of three things — and once you know which, the fix is usually quick.",

  ledes: [
    `It happened mid-ride. You were pedaling along, and suddenly the chain jumped — skipped a tooth, or slipped between gears, or made an unsettling clunk before catching again. It happened once. Then twice. Now it's happening regularly, and you can feel it especially when you push hard on the pedals or shift into certain gears. The bike is still ridable, but the skipping is unsettling and there's a real risk it'll leave you stranded if it gets worse.`,
    `Chain skipping has a small set of causes. About 90% of the time, it's one of three things: cable tension is off, the chain or cassette is worn, or the rear derailleur hanger is bent. Diagnosing which one is yours takes about five minutes of careful observation, and the fix for the first one is usually a quarter-turn of an adjustment screw. The other two are slightly more involved but still well within home-mechanic territory.`,
  ],

  steps: [
    {
      name: "Test cable tension first — it's the most common cause and the easiest fix",
      body: "Most chain skipping is caused by the rear derailleur cable being slightly too loose or too tight, which prevents the derailleur from positioning the chain accurately on the cog you've selected. The classic symptom: skipping is worse in some gears than others, and it gets worse over time as cables stretch with use. Test by shifting through every gear in sequence — if skipping is concentrated in 2-3 gears or in one direction (always when shifting up to harder gears, for example), cable tension is almost certainly the issue. The fix is the barrel adjuster at the rear derailleur (or sometimes at the shifter): turn it counterclockwise a quarter-turn at a time if the chain isn't shifting up to easier gears smoothly, clockwise if it's overshifting or skipping in harder gears. Test between adjustments. This single fix resolves a large fraction of chain-skipping problems, takes two minutes, and requires no tools beyond your fingers.",
    },
    {
      name: "Check chain wear — a worn chain skips even when everything else is fine",
      body: "Bike chains stretch with use (technically the pins wear and the chain elongates). A worn chain meshes poorly with cassette cogs, especially under load, and produces skipping that cable adjustment can't fix. The standard test is a chain wear indicator (Park Tool CC-3.2 is the common one, costs about $12), which slots into the chain and tells you if it's worn beyond serviceable limits. As a rough rule, chains last 2,000-3,000 miles for road bikes, less for mountain bikes in muddy conditions. If the chain is worn, replace it — and if it's been worn for a while, you may also need to replace the cassette, because a worn chain wears the cassette teeth into a matching shape that won't mesh properly with a new chain. This is more involved than cable adjustment but still a 30-minute job with basic tools.",
    },
    {
      name: "Check the derailleur hanger — bent hangers are surprisingly common",
      body: "The derailleur hanger is a small piece of metal that connects the rear derailleur to the frame, designed to break or bend before the more expensive frame or derailleur in a crash. Hangers can bend slightly from minor incidents — bumping the bike against something, a small fall, even rough handling during transport — without obvious damage. A bent hanger throws derailleur alignment off in ways that produce skipping that won't respond to cable adjustment. Test by looking at the rear derailleur from behind: the two pulleys should be in line with each cassette cog as you shift through them. If they're consistently off-line in one direction, the hanger is bent. The hanger can usually be straightened with a derailleur hanger alignment tool, or replaced with a new hanger (each frame has its specific hanger type — a cycling shop can identify and order yours).",
    },
    {
      name: "Watch for the symptom that suggests something more serious",
      body: "If you've checked cable tension, replaced the chain, and verified the hanger is straight, but the skipping persists, the issue is probably worn cassette cogs that didn't get replaced when the chain was. When a worn chain has been ridden long enough, the cogs themselves develop a hooked, wave-shaped wear pattern that visibly differs from the symmetric profile of new cogs. Even a brand-new chain will skip on these cogs because the geometry no longer matches. The fix is replacing the cassette — about $40-100 depending on grade, plus the labor or the time to do it yourself. This is the most expensive fix in the chain-skipping diagnostic tree, and it's worth checking the cassette wear visually before going further: if you can see the hook-shaped tooth profile, the cassette needs replacement regardless of what else you do.",
    },
    {
      name: "When the skipping is the first sign of a worn drivetrain",
      body: "Chain skipping that doesn't respond to any of the above fixes — or that returns within a few weeks of replacing parts — usually means the drivetrain has reached the end of its lifespan and individual-part replacement isn't going to keep up. Bikes ridden regularly for years eventually need their drivetrain replaced as a system: chain, cassette, chainrings, sometimes derailleur pulleys. Trying to extend the life of a tired drivetrain by replacing one component at a time often produces the kind of intermittent issue you're now living with. If your bike has more than 5,000 miles on its current drivetrain and is starting to skip in ways that resist fixing, the right move might be a full drivetrain refresh — typically $150-400 in parts depending on grade. Yes, that's significant. But spread across the next 5,000 miles, it's also some of the cheapest reliability you can buy. Bikes that get this maintenance done end up lasting decades; bikes that don't tend to spend more years parked than ridden.",
    },
  ],

  cta: {
    glyph:    '🚲',
    headline: "Diagnose the skip before you spend money on parts",
    body:     "Bike Medic walks you through the chain-skipping diagnostic in order, identifies the specific cause from your observations, and gives you the step-by-step fix with visual demos and tool requirements.",
    features: [
      "Skip-pattern diagnostic",
      "Cable tension adjustment guide",
      "Chain and cassette wear checks",
      "Derailleur hanger alignment",
      "Drivetrain replacement decision frame",
    ],
    toolId:   'BikeMedic',
    toolName: 'Bike Medic',
  },

  published: '2026-04-27',
  modified:  '2026-04-27',
};
