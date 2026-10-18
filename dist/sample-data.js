export const themes = [
  {
    name: "Long waits at peak hours",
    terms: /wait|slow|queue|minutes|took|delay/i,
    action:
      "Set a 10-minute service target during the morning rush. Assign one person to orders and one to the pickup counter.",
    short: "Speed up peak-hour service",
    priority: "High",
  },
  {
    name: "Food & drinks served cold",
    terms: /cold|temperature|lukewarm|hot|warm/i,
    action:
      "Check drink temperatures before handoff. Run a short refresher with the bar team and spot-check five orders each shift.",
    short: "Check temperatures at handoff",
    priority: "High",
  },
  {
    name: "Tables left uncleared",
    terms: /clean|dirty|mess|sticky|clear.*table/i,
    action:
      "Add a table check every 15 minutes and give each shift a named floor owner.",
    short: "Start a 15-minute table check",
    priority: "Medium",
  },
  {
    name: "Inconsistent customer service",
    terms: /rude|staff|friendly|service|ignored|polite/i,
    action:
      "Practice a quick greeting at the start of each shift. Ask the shift lead to check in with waiting guests.",
    short: "Make every arrival feel welcome",
    priority: "Medium",
  },
  {
    name: "Price & portion size",
    terms: /price|expensive|cost|value|portion/i,
    action:
      "Review portion consistency and make the value of your most popular items clearer on the menu.",
    short: "Review value and portions",
    priority: "Medium",
  },
  {
    name: "Noise & comfort",
    terms: /noise|loud|music|seat|wifi|parking/i,
    action:
      "Walk through the guest experience during your busiest hour and resolve the most frequently mentioned friction point.",
    short: "Improve the in-store experience",
    priority: "Medium",
  },
];
export const sampleTexts = [
  [
    "Lovely flat white, but we waited 25 minutes for two coffees. The morning queue needs some attention.",
    3,
  ],
  [
    "I love this place, but the wait at the counter is getting longer every week.",
    3,
  ],
  [
    "Took 20 minutes to get a takeaway coffee. Please add someone to the morning shift.",
    2,
  ],
  ["Beautiful pastries. Such a slow queue though, I was late for work.", 3],
  [
    "The line barely moved for fifteen minutes. Coffee was worth it, just not every day.",
    3,
  ],
  ["Staff were lovely but our order took far too long.", 3],
  ["A 30-minute wait for breakfast on a Tuesday is too much.", 2],
  [
    "My cappuccino arrived lukewarm. A shame, because the flavour was really good.",
    3,
  ],
  ["The latte was cold by the time it reached our table.", 2],
  ["Coffee is delicious but never quite hot enough.", 3],
  ["Second visit, second cold breakfast. Please check before serving.", 2],
  ["Tea was barely warm. They replaced it quickly though.", 3],
  [
    "Lovely atmosphere, but three empty tables still had dirty plates on them.",
    3,
  ],
  ["Our table was sticky and nobody came to clean it.", 2],
  ["Had to clear the table ourselves. The cake made up for it.", 3],
  [
    "Best almond croissant in the neighbourhood. A perfect start to the day.",
    5,
  ],
  [
    "The barista remembered my order. Small things that make a big difference.",
    5,
  ],
  ["Wonderful coffee and a really friendly team. Will be back.", 5],
  ["A cosy little spot with excellent pastries.", 5],
  ["The sourdough toast is incredible. My new favourite breakfast.", 5],
  ["Fresh flowers, beautiful coffee, kind people. Love it here.", 5],
  ["Great place to read on a quiet afternoon.", 5],
  ["The seasonal menu is always a treat.", 5],
  ["Lovely brunch with friends. Everything was fresh and delicious.", 5],
  ["A proper neighbourhood gem. Keep doing what you do.", 5],
];
