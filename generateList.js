const matches = require("./data/matches.json");
const fs = require("fs");
var slugify = require("slugify");

const NFTMAX = 0;

// filter games that already happened
const filteredMatches = matches.filter(
  (game) => new Date(game.datetime) < new Date()
);

const list = filteredMatches.map((game, i) => {
  const date = new Date(game.datetime);
  let stringDate = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

  return {
    id: i,
    title: `${game.home_team.name} x ${game.away_team.name}`,
    url: `${slugify(game.home_team.name)}-${slugify(game.away_team.name)}-${i}`,
    stage: `${game.stage_name}`,
    date: stringDate,
    image: `${`${i}`.padStart(2, "0")}_${game.home_team.code}x${
      game.away_team.code
    }.jpg`,
    stats: {
      ballPossession: {
        home: game.home_team_statistics.ball_possession,
        away: game.away_team_statistics.ball_possession,
      },
      attempts: {
        home: game.home_team_statistics.attempts_on_goal,
        away: game.away_team_statistics.attempts_on_goal,
      },
      passes: {
        home: game.home_team_statistics.num_passes,
        away: game.away_team_statistics.num_passes,
      },
      distance: {
        home:
          game.home_team_statistics.distance_walking +
          game.home_team_statistics.distance_jogging +
          game.home_team_statistics.distance_speedrunning +
          game.home_team_statistics.distance_speedsprinting,
        away:
          game.away_team_statistics.distance_walking +
          game.away_team_statistics.distance_jogging +
          game.away_team_statistics.distance_speedrunning +
          game.away_team_statistics.distance_speedsprinting,
      },
    },
  };
});

const json = JSON.stringify(list);
fs.writeFile("./list.json", json, "utf8", () => {
  console.log(`Done`);
});
