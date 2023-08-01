const fs = require("fs");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const idSeason = 285026;
const matches = require("./data/matches.json");

async function merge(index) {
  // https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idSeason=285026
  const responseCalendar = await fetch(
    `https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idSeason=${idSeason}`
  );
  const dataCalendar = await responseCalendar.json();
  const game = dataCalendar.Results[index];

  console.log("---------------------------------------");
  console.log(game.Home.ShortClubName + " vs " + game.Away.ShortClubName);

  // Create New object from baseObj
  matches[index] = JSON.parse(JSON.stringify(baseObj));

  // Get Infos
  // ----------------------------
  matches[index].id = index;
  matches[index].venue = game.Stadium.Name[0].Description;
  matches[index].location = game.Stadium.CityName[0].Description.split("/")[0];
  matches[index].stage_name = game.StageName[0].Description;
  matches[index].datetime = game.Date;
  matches[index].home_team = {
    goals: game.Home.Score,
    code: game.Home.IdCountry,
    name: game.Home.ShortClubName,
    penalties: game.HomeTeamPenaltyScore,
  };
  matches[index].away_team = {
    goals: game.Away.Score,
    code: game.Away.IdCountry,
    name: game.Away.ShortClubName,
    penalties: game.AwayTeamPenaltyScore,
  };

  // Get Statistic Data
  // ----------------------------
  const idIFES = game.Properties.IdIFES;
  const homeID = game.Home.IdTeam;
  const awayID = game.Away.IdTeam;

  /// https://fdh-api.fifa.com/v1/stats/match/131872/teams.json
  const response = await fetch(
    `https://fdh-api.fifa.com/v1/stats/match/${idIFES}/teams.json`
  );
  const data = await response.json();

  // Ball Possession
  matches[index].home_team_statistics.ball_possession =
    game.BallPossession.OverallHome;
  matches[index].away_team_statistics.ball_possession =
    game.BallPossession.OverallAway;

  const loopTeams = [
    { pos: awayID, place: "away" },
    { pos: homeID, place: "home" },
  ];
  const loopProps = [
    {
      fifaID: "Passes",
      json: "num_passes",
    },
    {
      fifaID: "AttemptAtGoal",
      json: "attempts_on_goal",
    },
    {
      fifaID: "DistanceWalking",
      json: "distance_walking",
    },
    {
      fifaID: "DistanceHighSpeedSprinting",
      json: "distance_speedsprinting",
    },
    {
      fifaID: "DistanceHighSpeedRunning",
      json: "distance_speedrunning",
    },
    {
      fifaID: "DistanceJogging",
      json: "distance_jogging",
    },
  ];

  loopTeams.map((team) => {
    loopProps.map((prop) => {
      let value = data[team.pos].find((item) => item[0] === prop.fifaID)[1];
      matches[index][team.place + "_team_statistics"][prop.json] = value;
    });
  });

  // Get Timline Data
  // ----------------------------
  const idStage = game.IdStage;
  const idMatch = game.IdMatch;

  // https://api.fifa.com/api/v3/timelines/103/285026/285033/400222852?language=en
  console.log(
    `https://api.fifa.com/api/v3/timelines/103/${idSeason}/${idStage}/${idMatch}?language=en`
  );
  const responseTimeline = await fetch(
    `https://api.fifa.com/api/v3/timelines/103/${idSeason}/${idStage}/${idMatch}?language=en`
  );

  const dataTimeline = await responseTimeline.json();

  dataTimeline.Event.filter(
    (e) => e.Type === 0 || e.Type === 41 || e.Type === 34
  ).map((event) => {
    let team = event.IdTeam === homeID ? "home" : "away";

    // Goal contra
    if (event.Type === 34) {
      team = team === "away" ? "home" : "away";
    }

    matches[index][team + "_team_events"].push({
      type_of_event: "goal",
      time: event.MatchMinute,
      player: getUppercaseWords(event.EventDescription[0].Description).replace(
        "(USA)",
        ""
      ),
      // Replace by hand later
      position: "in",
    });
  });

  // Write json
  // ----------------------------
  const json = JSON.stringify(matches);

  fs.writeFile("./data/matches.json", json, "utf8", () => {
    console.log(`Done`);
  });
}

// Execution
// -------------------------------

async function process() {
  for (let index = 37; index < 100; index++) {
    await merge(index);
  }
}

process();

// Helpers
// -------------------------------
function findAccuracy(total, completed) {
  return Math.round((completed / total) * 100);
}

function getUppercaseWords(str) {
  return str
    .split(" ")
    .filter((word) => word === word.toUpperCase())
    .join(" ");
}

// Base
// -------------------------------
const baseObj = {
  id: 1,
  venue: "",
  location: "",
  stage_name: "",
  datetime: "",
  home_team: {
    goals: 0,
    code: "",
    name: "",
    penalties: 0,
  },
  away_team: {
    goals: 0,
    code: "",
    name: "",
    penalties: 0,
  },
  home_team_statistics: {
    ball_possession: 0,
    num_passes: 0,
    attempts_on_goal: 0,
    distance_covered: 0,
  },
  away_team_statistics: {
    ball_possession: 0,
    num_passes: 0,
    attempts_on_goal: 0,
    distance_covered: 0,
  },
  home_team_events: [],
  away_team_events: [],
};

const baseEventObj = {
  id: 151,
  type_of_event: "goal",
  detail: "in",
  player: "Kadeisha BUCHANAN",
  time: "45'",
};
