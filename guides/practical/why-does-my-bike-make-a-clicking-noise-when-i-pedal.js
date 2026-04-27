module.exports = {
  slug:          'why-does-my-bike-make-a-clicking-noise-when-i-pedal',
  category:      'practical',
  categoryLabel: 'Practical',

  title:         "Why Does My Bike Make a Clicking Noise When I Pedal (And How to Find the One That's Yours)",
  titleHtml:     "Why Does My Bike Make a Clicking Noise When I Pedal <em>(And How to Find the One That&#39;s Yours)</em>",
  shortTitle:    "Why Does My Bike Make a Clicking Noise When I Pedal",
  navTitle:      "Why does my bike make a clicking noise when I pedal and how to find the one that's yours",

  description:   "Bike clicks come from about eight common sources, and each has a distinctive timing pattern. Listening for when the click happens — relative to your pedal stroke — narrows it down faster than any visual inspection.",
  deck:          "Bike clicks come from about eight common sources, and each has a distinctive timing pattern. Listening for when the click happens — relative to your pedal stroke — narrows it down faster than any visual inspection.",

  ledes: [
    `It started yesterday. A click. Somewhere on the bike, every time you pedal — or maybe only on the downstroke, or only when you're in a certain gear, or only under load. You can't tell. The bike is otherwise fine. The click is small and not getting worse, but it's also not going away, and you have a vague sense that ignoring it might let it grow into something more expensive. You're standing in your garage staring at the bike, and the bike is saying nothing useful in return.`,
    `Bike clicks have signatures. The same click that's hard to diagnose visually is much easier to diagnose by timing — when in the pedal stroke does it happen, what gear, what conditions, what kind of click. Eight common sources cover roughly 90% of clicks, and each has a distinctive pattern. Two minutes of riding while paying attention to *when* the click occurs will usually narrow it down to one or two suspects. From there, the fix is often something simple — a bolt to tighten, a part to clean, a connection to reseat.`,
  ],

  steps: [
    {
      name: "Click on every pedal stroke, both feet: probably the bottom bracket or pedals",
      body: "If the click happens on every pedal rotation, regardless of which foot is pushing, the source is something that rotates with your pedaling — most commonly the bottom bracket (the bearings inside the frame that the cranks pivot on), the pedals themselves, or the pedal-to-crank connection. Test by pedaling in a high gear with low resistance — if the click persists at low load, it's likely the bottom bracket. If it changes with load, the pedals or pedal connection are more likely. Tightening the pedals into the cranks (clockwise on the right pedal, counterclockwise on the left — pedals have reverse threading on the left side) often resolves this; if not, the bottom bracket may need service.",
    },
    {
      name: "Click only on one foot's downstroke: pedal cleat, pedal bearing, or that side's crank",
      body: "If the click only happens when one specific foot is pushing down, the source is somewhere on that side of the bike. The most common culprits: a worn or loose cleat on your shoe (test by switching shoes if you have another pair), a dry pedal bearing on that side (spin the pedal with your hand and listen for grit), or a crank arm that's loosened on its spindle (check by pulling the crank toward and away from the frame — any movement is a problem). Diagnosing which one usually means trying each in order: shoes first (cheapest fix), then pedal, then crank. The single-side pattern dramatically narrows the search.",
    },
    {
      name: "Click when shifting or only in certain gears: drivetrain alignment",
      body: "If the click is specifically tied to shifting — happens during gear changes, persists in some gears but not others, or appears only in specific chainring/cog combinations — the source is almost always drivetrain alignment. The derailleur indexing is slightly off, the chain is rubbing the front derailleur cage, or the chain is at an extreme angle in a cross-chain combination (big chainring + biggest rear cog, or small chainring + smallest rear cog). Avoid the cross-chain gears as a habit; for indexing issues, the rear derailleur cable tension can usually be adjusted with the barrel adjuster at the shifter or derailleur (a quarter-turn at a time, testing after each adjustment).",
    },
    {
      name: "Click only when standing or under heavy load: frame, seatpost, or saddle rails",
      body: "If the click only appears when you're putting significant force into the bike — climbing standing, sprinting, pushing hard — the source is often something that flexes under load that wouldn't show under normal pedaling. Most common: the seatpost interface with the frame (clean and re-grease the seatpost), the saddle-to-rails connection (tighten the saddle clamp), or in rarer cases, a stress crack in the frame itself (worth a careful visual inspection, especially around welds and joints). The load-only pattern means the click won't appear during routine riding, which makes it easy to dismiss — but it's worth tracking down because frame issues can deteriorate.",
    },
    {
      name: "When the click is intermittent and you can't reproduce it",
      body: "Some clicks are frustrating because they're inconsistent — they show up on some rides and not others, or only after a certain distance, or only in certain weather. These are usually environmental: dry contact points that click until they warm up and lubricant redistributes, bolts that loosen as the bike heats and cools, or contamination (sand, dirt, water) that shifts position with vibration. The fix for intermittent clicks isn't to track down a single cause — it's to do a general drivetrain cleaning and tightening. Clean the chain, derailleur pulleys, and cassette. Re-grease the bottom bracket and pedal threads. Tighten every bolt on the bike to manufacturer torque specs (a torque wrench is a worthwhile $30 investment if you don't have one). After this maintenance pass, ride the bike for a week. If the click is gone, the cause was somewhere in the routine maintenance items. If it persists, it's probably one of the more specific causes above and worth a more focused investigation.",
    },
  ],

  cta: {
    glyph:    '🚲',
    headline: "Find your specific click before you tear the bike apart",
    body:     "Bike Medic walks you through diagnostic questions about where and when the click happens, identifies the most likely sources, and gives you the step-by-step fix with visual demos for each.",
    features: [
      "Click-pattern diagnostic",
      "Step-by-step fixes by source",
      "Visual repair demos",
      "Tool-and-part requirements",
      "Expert escalation when standard fixes fail",
    ],
    toolId:   'BikeMedic',
    toolName: 'Bike Medic',
  },

  published: '2026-04-27',
  modified:  '2026-04-27',
};
