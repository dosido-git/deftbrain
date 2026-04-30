module.exports = {
  slug:          'is-a-90-minute-layover-long-enough',
  category:      'travel',
  categoryLabel: 'Travel',
  title:         "Is a 90-Minute Layover Long Enough? (It Depends on These Five Things)",
  titleHtml:     "Is a 90-Minute Layover Long Enough? <em>(It Depends on These Five Things)</em>",
  shortTitle:    "Is a 90-Minute Layover Enough?",
  navTitle:      "is a 90-minute layover enough",
  description:   "Sometimes 90 minutes is plenty. Sometimes it is impossible. Here are the five variables that decide which side you are on, and how to do the math before you book.",
  deck:          "Sometimes 90 minutes is plenty. Sometimes it is impossible. Here are the five variables that decide which side you are on, and how to do the math before you book.",
  ledes: [
    `You are looking at a flight. The layover is 90 minutes. The booking site says it is a legal connection, which is the airline's way of saying it is technically possible without saying it is actually advisable. You are trying to decide if 90 minutes is enough to make the second flight without sprinting through a terminal, recheck bags, clear immigration, or have a heart attack about whether you will make it. The booking site is not going to tell you. You have to work it out yourself.

Whether 90 minutes is enough depends on five specific things. None of them are mysterious. The math is roughly the same every time. Once you know the variables, you can look at any layover and have a real answer in two minutes — instead of guessing and then sweating through the entire trip wondering if you got it right.`,
    `What follows: the five variables. Then a tool that does the calculation for you.`,
  ],
  steps: [
    { name: 'Variable 1: domestic vs international', body: 'A domestic-to-domestic connection in the same terminal can be made in 30 to 45 minutes if everything goes well. An international arrival adds roughly 30 to 60 minutes for immigration, sometimes more at large hubs during peak hours. International-to-international through a country requires customs and re-clearing security in many cases. Domestic 90 minutes is usually plenty. International 90 minutes is often tight. International with a customs/recheck is usually too tight.' },
    { name: 'Variable 2: same terminal vs different terminals', body: 'Same terminal, gates near each other: 15 minutes of walking, plus boarding time. Same terminal, opposite ends: 25 to 35 minutes including a tram or shuttle. Different terminals at large airports (DFW, LAX, JFK): 30 to 50 minutes — sometimes longer if a bus is involved. Some airports (Beijing, Doha, Frankfurt) have notoriously long terminal-to-terminal transfers that can eat 45 minutes of your layover by themselves.' },
    { name: 'Variable 3: bag handling', body: 'If you are checking bags through, the airline handles the transfer and you do not need to claim and recheck. If you are stopping in a country that requires you to clear customs even for connections (the U.S., Canada in many cases, Australia), you will claim, clear, and recheck — that adds 30 to 60 minutes minimum. If you have a separate ticket on a different airline, you almost always have to claim and recheck. Separate tickets with a 90-minute layover are rarely safe.' },
    { name: 'Variable 4: time of day and arrival reliability', body: 'Morning flights are more punctual than evening flights, which accumulate delays through the day. A 90-minute layover after a 7am arrival is much safer than the same layover after a 7pm arrival. Connecting through weather-prone hubs (ORD, DEN, ATL, EWR) in summer or winter increases delay risk. Look at the on-time performance for your arrival flight on a tracking site before booking — if it is below 75%, treat the 90-minute layover as risky regardless of the geographic factors.' },
    { name: 'Variable 5: what happens if you miss it', body: 'If you miss a connection on a single ticket and the cause is the airline\'s fault (delay), they rebook you free, often on the next flight. If the next flight is in two hours, the cost of missing is small. If it is the only flight that day, the cost is a hotel night and a delayed trip. If you are on separate tickets and miss the connection, you are paying for the second ticket again — sometimes the full walk-up fare. Build the layover length around the cost of missing, not just the average case.' }
  ],
  cta: {
    glyph:    '✈️',
    headline: "Know if you'll make it before you book.",
    body:     "Enter the airport, your terminals, and your passport situation. Get a YES/NO/RISKY verdict with the actual time math, gate-to-gate directions, and a plan for the time you have.",
    features: [
      "YES/NO/RISKY verdict with math",
      "Gate-to-gate directions",
      "Lounge finder matched to your cards",
      "Worst-case risk analysis"
    ],
    toolId:   'LayoverMaximizer',
    toolName: 'Layover Maximizer',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
