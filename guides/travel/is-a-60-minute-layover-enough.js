module.exports = {
  slug:          'is-a-60-minute-layover-enough',
  category:      'travel',
  categoryLabel: 'Travel',
  title:         "Is a 60-Minute Layover Enough? (When It Works and When It Is a Gamble)",
  titleHtml:     "Is a 60-Minute Layover Enough? <em>(When It Works and When It Is a Gamble)</em>",
  shortTitle:    "Is a 60-Minute Layover Enough?",
  navTitle:      "is a 60 minute layover enough",
  description:   "Is a 60-minute layover enough? Usually for a domestic connection on one ticket, rarely for an international arrival into the U.S. Here is what decides it.",
  deck:          "A 60-minute layover is usually enough for a domestic connection on a single ticket, especially in the same terminal with no checked bags. It is usually too short for an international arrival into the U.S., where you clear immigration and customs and recheck bags, and risky on separate tickets, where a missed flight is your cost.",
  answerTable: {
    head: ['Connection', 'Is 60 minutes enough?'],
    rows: [
      ['Domestic, same terminal, one ticket', 'Usually yes'],
      ['Domestic, change of terminal at a large hub', 'Tight'],
      ['Into the Schengen area from outside it', 'Tight: depends on passport lines'],
      ['International arrival into the U.S.', 'Usually not'],
      ['Separate tickets, any route', 'Risky: a missed flight is your cost'],
    ],
  },
  ledes: [
    `Sixty minutes sounds tight, and sometimes it is. But airlines sell hour-long connections every day, and many of them work without anyone breaking into a run. The difference between an easy hour and an impossible one comes down to a handful of facts about the trip, most of which you can check before you book.

An hour is a different question from 90 minutes, because there is much less room for anything to go slightly wrong: a late arrival, a slow walk off the plane, a long line at passport control. So the factors below matter more, and the margin for each one is thinner.`,
    `What follows: the factors that decide whether an hour is enough, and how to think about the risk. For a little more time, see [is a 90-minute layover long enough](/guides/travel/is-a-90-minute-layover-long-enough).`,
  ],
  steps: [
    { name: 'One ticket or two', body: "This matters more than anything else. When both flights are on one ticket, the airline has agreed the connection is possible: it only sells connections that meet the airport's published minimum connection time. If the first flight is late and you miss the second, the airline is responsible for rebooking you. When the flights are on separate tickets, nobody has checked the connection, and missing the second flight usually means buying a new ticket. A 60-minute connection on separate tickets is a gamble most travelers come to regret." },
    { name: 'Is 60 minutes enough for an international connection?', body: "A domestic connection within the same terminal is the easiest case, and an hour is often enough. Arriving on an international flight into the United States is the hardest: you clear immigration, collect your bags, clear customs, recheck the bags, and go through security again, even when you are only connecting. An hour for that is very tight at most large airports. In Europe, flying between the Schengen area and elsewhere adds a passport check between terminals, which can take a few minutes or most of an hour depending on the time of day." },
    { name: 'The airport and the walk', body: "Some airports are compact, and a connection means a short walk. Others put connecting gates in different terminals linked by trains or buses, and the transfer alone can take 20 to 30 minutes. A terminal map from the airport's website shows the distance between your arrival and departure gates, and the airline's app usually shows the departure gate a few hours ahead. Boarding typically closes 10 to 20 minutes before departure, so the time you actually have is the layover minus that." },
    { name: 'Bags, seats, and the first flight\'s record', body: "Traveling with only a carry-on removes one of the biggest variables, especially on international arrivals. A seat near the front of the first plane can save several minutes getting off. And the first flight's on-time record matters: a flight that is regularly 20 minutes late turns a 60-minute layover into a 40-minute one. Flight-tracking sites show recent arrival times for a given flight number, which gives a realistic picture rather than the schedule's." },
    { name: 'What happens if you miss it', body: "On a single ticket, a missed connection caused by a delay usually means being rebooked on the next available flight, so the real cost depends on when that flight is. If there are several flights a day, missing one is an inconvenience. If it is the last flight of the day, it can mean a night at the airport or a hotel, and airlines differ in what they cover. Weighing the layover against the cost of missing it, not only against the odds, is what turns this from a guess into a decision. If it does go wrong, see [how to handle a missed connection that is not your fault](/guides/travel/how-to-handle-a-missed-connection-when-its-not-your-fault)." },
  ],
  cta: {
    glyph:    '✈️',
    headline: "Know if an hour is enough before you book.",
    body:     "Enter the airport, your flights, and your passport and bag situation. Layover Maximizer works out the time you actually have, gives a clear verdict with the math, and plans the time around it.",
    features: [
      "YES/NO/RISKY verdict with math",
      "Gate-to-gate directions",
      "Lounge finder matched to your cards",
      "Worst-case risk analysis",
    ],
    toolId:   'LayoverMaximizer',
    toolName: 'Layover Maximizer',
  },
  published: '2026-10-05',
  modified:  '2026-10-05',
};
