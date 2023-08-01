import random from "canvas-sketch-util/random";

import matches from "../data/matches.json";
import { colors, schema } from "./colors.js";
import noiseImg4 from "../assets/noise4.png";
import noiseImg5 from "../assets/noise5.png";

import FontFaceObserver from "fontfaceobserver";

import { paper, Path, PointText, Color, Group } from "paper";

import { saveAs } from "file-saver";

const fontA = new FontFaceObserver("Orelega One");
const fontB = new FontFaceObserver("Helvetica Now Text");

// CONSTANTS
// ------------------------------------------
const SCALE = 5;
const MARGIN = {
  x: 65 * SCALE,
  y: 65 * SCALE,
};

// EXPOSE PROPS UI
// ------------------------------------------
export let props = {
  match: {
    value: "New Zealand x Norway",
    params: {
      // String because fragment don't work well with label and value
      options: matches.map(
        (m, i) => `${m.home_team.name} x ${m.away_team.name}`
      ),
    },
  },
  seed: {
    value: 1,
  },
  gradientMix: {
    value: 0.4,
    params: {
      min: 0,
      max: 1,
      step: 0.01,
    },
  },
  noise: {
    value: true,
  },
  invertGradients: {
    value: true,
  },
  background: {
    value: "#1d1d1d",
  },
  teamAColor: {
    value: false,
    type: "color",
  },
  teamBColor: {
    value: false,
    type: "color",
  },
};

// INTERNAL VARIABLES
// ------------------------------------------
export let rendering = "2d";
export let fps = 0;
export let resizing = "preset";
export let preset = "a3";
export let buildConfig = {
  backgroundColor: "rgb(236, 236, 236)",
  dimensions: [3502, 4962],
  gui: false,
  styles: /* css */ `
    @import url('https://fonts.googleapis.com/css2?family=Orelega+One&display=swap');

    canvas {
      box-shadow: 0px 2px 12px -2px rgba(0, 0, 0, 0.35);
    }
  }`,
};

// Drawing
// ------------------------------------------
export const update = ({ context: ctx, width, height, props, ...rest }) => {
  /******************************************************************
   *
   *
   *  Setup
   *
   *
   *******************************************************************/

  /* Setup Paperjs */
  paper.setup(ctx.canvas);
  paper.view.viewSize = new paper.Size(width, height);
  paper.view.pizelRatio = rest.pixelRatio;

  /* Setup Variables */
  const viewPortWidth = width - MARGIN.x * 2;
  const viewPortHeight = height - MARGIN.y * 2;
  const startX = MARGIN.x;
  const startY = MARGIN.y;
  const fontFamily = "Helvetica Now Text";
  // const fontFamily = "Helvetica Neue";
  const debugStyle = {
    // strokeColor: "#ff0000",
    // strokeWidth: 4,
  };

  /* Get data */
  const rawData = matches.find(
    (m) => `${m.home_team.name} x ${m.away_team.name}` === props.match.value
  );

  const data = parseData(rawData);

  console.log("------------------------------");
  console.log(data);

  /* Setup Random */
  // Use the name of the teams to create a seed from unique random
  random.setSeed(`${props.match.value}${props.seed.value}`);

  /******************************************************************
   *
   *
   *  Main Drawing
   *
   *
   *******************************************************************/

  // Colors
  let teamHomeColor = new Color(colors[schema[data.homeCode]][0]);
  let teamAwayColor = new Color(colors[schema[data.awayCode]][1]);
  const backgroundColor = new Color(props.background.value);

  if (props.teamAColor.value) {
    teamHomeColor = new Color(props.teamAColor.value);
  }

  if (props.teamBColor.value) {
    teamAwayColor = new Color(props.teamBColor.value);
  }

  /* Background */
  const background = new Path.Rectangle({
    point: [0, 0],
    size: [width, height],
    fillColor: backgroundColor,
  });

  const viewPort = new Path.Rectangle({
    point: [startX, startY],
    size: [viewPortWidth, viewPortHeight],
    ...debugStyle,
  });

  const dataRows = 4;
  const dataCols = 4;
  const splitGrid = [2.9, 1.6];
  const dataArea =
    Math.round(viewPortHeight - viewPortHeight / splitGrid[0]) + 1;
  const startYDataArea = Math.round(viewPortHeight / splitGrid[0] + startY);
  const gradientHeight = Math.round(dataArea / dataRows);

  const quadrantWidth = viewPortWidth / dataCols; // TODO: Make dynamic
  const quadrantHeight = gradientHeight;
  const quadData = Array(15).map(() => false);

  const ballPosession = new Path.Rectangle({
    ...debugStyle,
    point: [startX, startYDataArea],
    size: [viewPortWidth, gradientHeight],
    fillColor: {
      gradient: {
        stops: [
          [teamHomeColor, 0],
          [teamHomeColor, data.ballPossession.homeGradient - 0.15],
          [teamAwayColor, 1 - data.ballPossession.awayGradient + 0.15],
          [teamAwayColor, 1],
        ],
      },
      origin: [0, height / 2],
      destination: [width, height / 2],
    },
  });

  const attempts = new Path.Rectangle({
    ...debugStyle,
    point: [startX, startYDataArea + gradientHeight],
    size: [viewPortWidth, gradientHeight],
    fillColor: {
      gradient: {
        stops: generateColorStops(
          teamHomeColor,
          teamAwayColor,
          data.attempts.homeGradient,
          data.attempts.awayGradient,
          props.invertGradients.value
        ),
        // [
        //   [teamHomeColor, props.invertGradients.value ? 1 : 0],
        //   [teamHomeColor, data.attempts.homeGradient - 0.1],
        //   // [teamAwayColor, 1 - data.attempts.awayGradient + 0.1],
        //   [teamAwayColor, props.invertGradients.value ? 0 : 1],
        // ],
      },
      origin: [0, height / 2],
      destination: [width, height / 2],
    },
  });

  attempts.rotate(180);

  const numPasses = new Path.Rectangle({
    ...debugStyle,
    point: [startX, startYDataArea + gradientHeight * 2],
    size: [viewPortWidth, gradientHeight],
    fillColor: {
      gradient: {
        stops: [
          [teamHomeColor, 0],
          [teamHomeColor, data.numOfPasses.homeGradient - 0.07],
          [teamAwayColor, 1 - data.numOfPasses.awayGradient + 0.07],
          [teamAwayColor, 1],
        ],
      },
      origin: [0, height / 2],
      destination: [width, height / 2],
    },
  });

  const coverDistance = new Path.Rectangle({
    ...debugStyle,
    point: [startX, startYDataArea + gradientHeight * 3],
    size: [viewPortWidth, gradientHeight],
    fillColor: {
      gradient: {
        stops: generateColorStops(
          teamHomeColor,
          teamAwayColor,
          data.distanceCovered.homeGradient,
          data.distanceCovered.awayGradient,
          props.invertGradients.value
        ),
      },
      origin: [0, height / 2],
      destination: [width, height / 2],
    },
  });

  coverDistance.rotate(180);

  const cutNoiseGroup = new Group();
  data.timeline.map((t, i) => {
    const position = getPosition(parseInt(t.time), dataRows, dataCols);

    // Hardcode germany goal
    if (data.id === 33 && i === 1) {
      position.row = position.row = 4;
      position.column = 3;
      position.quad = 14;
    }

    // Change position if the goal already exis in that quadrant
    // TODO: If happen in the last quadrand not handle yet
    if (quadData[position.quad]) {
      position.column = position.column + 1;
      if (position.column > dataCols) {
        position.row = position.row + 1;
        position.column = 0;
      }

      position.quad + 1;
    }

    quadData[position.quad] = true;
    // End change position

    const cutShape = drawGoal(
      {
        x: startX + (position.column - 1) * quadrantWidth,
        y: startYDataArea + (position.row - 1) * quadrantHeight,
      },
      { width: quadrantWidth, height: quadrantHeight },
      t.team === "home" ? teamHomeColor : teamAwayColor,
      t.type === "out" ? "squad" : "circle",
      t.time
    );

    cutNoiseGroup.addChild(cutShape);
  });

  // Add Effects
  addPostEffect();

  cutNoiseGroup.bringToFront();

  // Symbol
  drawSymbol(data.score);

  // Text
  drawText(data.text);
  drawPlayers(data.timeline);

  paper.view.draw();

  Promise.all([fontA.load(), fontB.load()]).then(function () {
    paper.view.draw();
  });

  /******************************************************************
   *
   *
   *  Shapes
   *
   *
   ******************************************************************/
  function drawSymbol(score) {
    const { home, away } = score;
    const circleSize = 4 * SCALE;
    const circleMargin = 10 * SCALE;

    const symbol = new Group({ ...debugStyle });
    // symbol.x = viewPortWidth;
    // symbol.y = startY;

    // Circles
    circles(home, 0);
    circles(away, 25 * SCALE);

    const rectWidth =
      symbol.bounds.width + 13 * SCALE > 25 * SCALE
        ? symbol.bounds.width + 13 * SCALE
        : 25 * SCALE;

    // Line
    const rect = new Path.Rectangle({
      point: [0, circleSize + 10 * SCALE],
      size: [rectWidth, 3.5 * SCALE],
      fillColor: getInverseColor(props.background.value),
    });

    symbol.addChild(rect);

    // Align all childrens to center
    const groupCenter = symbol.bounds.center;

    for (var i = 0; i < symbol.children.length; i++) {
      var child = symbol.children[i];
      child.position.x = groupCenter.x - circleSize;
    }

    symbol.position.x = startX + viewPortWidth - symbol.bounds.width / 2;
    symbol.position.y = startY + symbol.bounds.height;

    if (home + away === 0) {
      rect.position.y = rect.position.y + 21 * SCALE;
    }

    if (home === 0 && away > 0) {
      symbol.position.y = symbol.position.y + 13 * SCALE;
    }

    function circles(qty, posY) {
      const circleGroup = new Group();

      for (let i = 0; i < qty; i++) {
        const circle = new Path.Circle({
          center: [0, 0],
          radius: circleSize,
          fillColor: getInverseColor(props.background.value),
        });

        circle.position.x = i * (circleSize + circleMargin);
        circle.position.y = posY + circle.bounds.height / 2;

        circleGroup.addChild(circle);
      }

      symbol.addChild(circleGroup);
    }
  }

  function drawGoal(position, size, color, shape = "circle", min) {
    // draw a white square and a circle inside center aligned
    const goal = new Group();
    const cutNoiseGroup = new Group();

    const goalRect = new Path.Rectangle({
      point: [position.x, position.y],
      size: [size.width, size.height],
      fillColor: backgroundColor,
    });

    // const goalText = new PointText({
    //   point: [position.x, position.y],
    //   content: min,
    //   fillColor: "#fff",
    //   fontFamily: "Orelega One",
    //   fontWeight: "400",
    //   fontSize: 24 * SCALE,
    // });

    let cutShape;

    if (shape === "squad") {
      // draw a retangule in 45dg
      const goalSquadSize = size.height / 2.5;

      const goalSquad = new Path.Rectangle({
        point: [position.x, position.y],
        size: [goalSquadSize, goalSquadSize],
        fillColor: color,
      });

      goalSquad.rotate(45);
      goalSquad.position = goalRect.position;

      goal.addChildren(goalSquad);

      cutShape = goalRect.subtract(goalSquad);
      cutShape.fillColor = backgroundColor;
    } else {
      const goalCircleRadius = size.height / 3.9;

      const goalCircle = new Path.Circle({
        // center: [position.x, position.y],
        radius: goalCircleRadius,
        fillColor: color,
      });

      //align circle in the center of the square
      goalCircle.position = goalRect.position;

      goal.addChildren(goalCircle);

      cutShape = goalRect.subtract(goalCircle);
      cutShape.fillColor = backgroundColor;
    }

    cutNoiseGroup.addChild(cutShape);

    return cutNoiseGroup;
  }

  /* ---------------------------------
  Add Post Effect
  --------------------------------- */

  function addPostEffect(cutNoiseShape) {
    if (props.noise.value === true) {
      const texture = new paper.Raster(noiseImg4);
      texture.onLoad = function () {
        texture.size.width = viewPortWidth;
        texture.size.height = gradientHeight * 4;

        texture.position.x = startX + viewPortWidth / 2;
        texture.position.y = startYDataArea + texture.size.height / 2;
        texture.blendMode = "overlay";
        texture.opacity = 0.3;
      };

      const texture2 = new paper.Raster(noiseImg4);
      texture2.onLoad = function () {
        texture2.size.width = viewPortWidth;
        texture2.size.height = gradientHeight * 4;

        texture2.position.x = startX + viewPortWidth / 2;
        texture2.position.y = startYDataArea + texture2.size.height / 2;
        texture2.blendMode = "overlay";
        texture2.opacity = 0.3;
      };

      const texture3 = new paper.Raster(noiseImg5);
      texture3.onLoad = function () {
        texture3.size.width = viewPortWidth;
        texture3.size.height = gradientHeight * 4;

        texture3.position.x = startX + viewPortWidth / 2;
        texture3.position.y = startYDataArea + texture3.size.height / 2;
        texture3.blendMode = "overlay";
        texture3.opacity = 1;
      };
    }
  }

  /*
    -------------------------------------- 
    Draw Text
    --------------------------------------
  */
  function drawText({ home, away, venue, date }) {
    const sizeBig = 48 * SCALE;
    const sizeSmall = 13 * SCALE;
    const compensation = -5 * SCALE;

    const homeTeamText = new PointText({
      point: [0, 0],
      content: home,
      fillColor: getInverseColor(props.background.value),
      fontFamily: "Orelega One",
      fontWeight: "400",
      fontSize: sizeBig,
    });

    homeTeamText.position.x = startX + homeTeamText.bounds.width / 2;
    homeTeamText.position.y =
      startY + compensation + homeTeamText.bounds.height / 2;

    const awayTeamText = new PointText({
      point: [0, 0],
      content: away,
      fillColor: getInverseColor(props.background.value),
      fontFamily: "Orelega One",
      fontWeight: "400",
      fontSize: sizeBig,
    });

    awayTeamText.position.x = startX + +awayTeamText.bounds.width / 2;
    awayTeamText.position.y =
      45 * SCALE + homeTeamText.bounds.height + awayTeamText.bounds.height / 2;

    const dateText = new PointText({
      point: [0, 0],
      content: date,
      fillColor: getInverseColor(props.background.value),
      fontFamily,
      fontWeight: "400",
      fontSize: sizeSmall,
    });

    dateText.position.x = startX + dateText.bounds.width / 2;
    dateText.position.y =
      awayTeamText.bounds.y +
      awayTeamText.bounds.height +
      awayTeamText.bounds.height / 2;

    const venueText = new PointText({
      point: [0, 0],
      content: venue,
      fillColor: getInverseColor(props.background.value),
      fontFamily,
      fontWeight: "400",
      fontSize: sizeSmall,
    });

    venueText.position.x = startX + venueText.bounds.width / 2;
    venueText.position.y =
      dateText.bounds.y +
      dateText.bounds.height +
      3 * SCALE +
      dateText.bounds.height / 2;
  }

  /*
    -------------------------------------- 
    Draw Players
    --------------------------------------
  */
  function drawPlayers(timeline) {
    let x = startX;
    let y = startYDataArea - 25 * SCALE;
    const fontSize = 13 * SCALE;

    const playersText = new Group();

    timeline.map((goal, i) => {
      const goalTime = new PointText({
        point: [0, 0],
        content: `${goal.time}"`,
        fillColor: getInverseColor(props.background.value),
        fontFamily,
        fontWeight: "400",
        fontSize,
      });

      const goalByWho = new PointText({
        point: [0, 0],
        content: `${goal.player}`,
        fillColor: goal.team === "home" ? teamHomeColor : teamAwayColor,
        fontFamily,
        fontWeight: "400",
        fontSize,
      });

      const space = `${goal.time}`.slice().length < 2 ? 15 * SCALE : 23 * SCALE;

      goalTime.position.x = x + goalTime.bounds.width / 2;
      goalTime.position.y = y + goalTime.bounds.height / 2;

      goalByWho.position.x = x + goalByWho.bounds.width / 2 + space;
      goalByWho.position.y = y + goalByWho.bounds.height / 2;

      x = x + goalByWho.bounds.width + 10 * SCALE + space;

      if (x > viewPortWidth) {
        y = y + goalByWho.bounds.height + 5 * SCALE;
        x = startX;
      }

      playersText.addChild(goalTime);
      playersText.addChild(goalByWho);
    });

    // Align group in the bottom
    playersText.position.y =
      startYDataArea - playersText.bounds.height / 2 - SCALE * 10;
  }
};

/******************************************************************
 *
 *
 *  Data
 *
 *
 ******************************************************************/
function parseData(data) {
  const goals = parseGoals(data);
  const ballPossession = parseBallPossession(data);
  const attempts = parseAttempts(data);
  const numOfPasses = parseNumOfPasses(data);
  const distanceCovered = parseDistanceCovered(data);
  const timeline = parseGameTimeline(data);
  // const penals = parsePenals(data);

  return {
    id: data.id,
    goals,
    ballPossession,
    attempts,
    numOfPasses,
    distanceCovered,
    timeline,
    text: {
      home: data.home_team.name,
      away: data.away_team.name,
      date: formatDate(data.datetime),
      venue: data.location.toUpperCase(),
    },
    homeCode: data.home_team.code,
    awayCode: data.away_team.code,
    score: {
      home: data.home_team.goals,
      away: data.away_team.goals,
    },
  };
}

function parseAttempts(data) {
  const total =
    data.home_team_statistics.attempts_on_goal +
    data.away_team_statistics.attempts_on_goal;

  const homePercent =
    (data.home_team_statistics.attempts_on_goal / total) * 100;
  const homePercentNormalize = homePercent / 100;

  const awayPercent =
    (data.away_team_statistics.attempts_on_goal / total) * 100;
  const awayPercentNormalize = awayPercent / 100;

  return {
    total,
    homeAbsolute: data.home_team_statistics.attempts_on_goal,
    awayAbsolute: data.away_team_statistics.attempts_on_goal,
    homeGradient: homePercentNormalize,
    awayGradient: awayPercentNormalize,
  };
}

function parseBallPossession(data) {
  const total =
    data.home_team_statistics.ball_possession +
    data.away_team_statistics.ball_possession;

  const homePercent = (data.home_team_statistics.ball_possession / total) * 100;
  const homePercentNormalize = homePercent / 100;

  const awayPercent = (data.away_team_statistics.ball_possession / total) * 100;
  const awayPercentNormalize = awayPercent / 100;

  return {
    total,
    homeAbsolute: data.home_team_statistics.ball_possession,
    awayAbsolute: data.away_team_statistics.ball_possession,
    homeGradient: homePercentNormalize,
    awayGradient: awayPercentNormalize,
  };
}

function parseNumOfPasses(data) {
  const total =
    data.home_team_statistics.num_passes + data.away_team_statistics.num_passes;

  const homePercent = (data.home_team_statistics.num_passes / total) * 100;
  const homePercentNormalize = homePercent / 100;

  const awayPercent = (data.away_team_statistics.num_passes / total) * 100;
  const awayPercentNormalize = awayPercent / 100;

  return {
    total,
    homeAbsolute: data.home_team_statistics.num_passes,
    awayAbsolute: data.away_team_statistics.num_passes,
    homeGradient: homePercentNormalize,
    awayGradient: awayPercentNormalize,
  };
}

function parseDistanceCovered(data) {
  const totalHome =
    data.home_team_statistics.distance_walking +
    data.home_team_statistics.distance_speedsprinting +
    data.home_team_statistics.distance_speedrunning +
    data.home_team_statistics.distance_jogging;
  const totalAway =
    data.away_team_statistics.distance_covered +
    data.away_team_statistics.distance_speedsprinting +
    data.away_team_statistics.distance_speedrunning +
    data.away_team_statistics.distance_jogging;
  const total = totalHome + totalAway;

  const homePercent = (totalHome / total) * 100;
  const homePercentNormalize = homePercent / 100;

  const awayPercent = (totalAway / total) * 100;
  const awayPercentNormalize = awayPercent / 100;

  return {
    total,
    homeAbsolute: totalAway,
    awayAbsolute: totalAway,
    homeGradient: homePercentNormalize,
    awayGradient: awayPercentNormalize,
  };
}

function parsePenals(data) {
  return {
    home: data.home_team.penalties,
    away: data.away_team.penalties,
  };
}

function parseGoals(data) {
  return {
    home: data.home_team.goals,
    away: data.away_team.goals,
    total: data.home_team.goals + data.away_team.goals,

    isDraw: data.winner_code === "Draw" || data.winner_code === null,
  };
}

function parseGameTimeline(data) {
  const awayTimeline = data.away_team_events
    .filter((event) => event.type_of_event.includes("goal"))
    .map((event) => {
      return {
        time: parseInt(event.time),
        type: event.position,
        team: "away",
        player: getUppercaseWords(event.player),
      };
    });

  const homeTimeline = data.home_team_events
    .filter((event) => event.type_of_event.includes("goal"))
    .map((event) => {
      return {
        time: parseInt(event.time),
        type: event.position,
        team: "home",
        player: getUppercaseWords(event.player),
      };
    });

  const timeline = homeTimeline
    .concat(awayTimeline)
    .sort((a, b) => a.time - b.time);

  return timeline;
}

/******************************************************************
 *
 *
 *  Utils
 *
 *
 ******************************************************************/

const getCrossings = (path1, path2) =>
  path1.getIntersections(path2, (inter) => inter.isCrossing());

const normalizeNumbers = (val, max, min) => {
  return (val - min) / (max - min);
};

const getData = () => {
  const rawData = matches.find(
    (m) => `${m.home_team.name} x ${m.away_team.name}` === props.match.value
  );

  const data = parseData(rawData);

  return data;
};

const downloadAsSVG = function (fileName) {
  if (!fileName) {
    fileName = "paperjs_example.svg";
  }

  const data = getData();

  var url =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(paper.project.exportSVG({ asString: true }));

  var link = document.createElement("a");
  link.download = `${data.id}_${data.homeCode}x${data.awayCode}.svg`;
  link.href = url;
  link.click();
};

const downloadAsPNG = function (fileName) {
  const data = getData();
  console.log("downloadAsPNG");
  console.log(paper);
  paper.view.context.canvas.toBlob(function (blob) {
    saveAs(blob, `${data.id}_${data.homeCode}x${data.awayCode}.jpg`);
  });
};

export let init = async ({ context, width, height, ...params }) => {
  const keypress = new paper.Tool();

  //Listen for SHIFT-P to save content as SVG file.
  keypress.onKeyUp = function (event) {
    if (event.character == "0") {
      downloadAsSVG();
    }

    if (event.character == "9") {
      downloadAsPNG();
    }
  };

  return { teste: "teste" };
};

function generateColorStops(colorA, colorB, stopA, stopB, invert) {
  let mod = props.gradientMix.value;

  if (stopA === 0 || stopB === 0) {
    mod = 0;
  }

  if (stopA < 0.15 || stopB < 0.15) {
    mod = 0.1;
  }

  if (stopA > stopB) {
    return [
      [colorA, 0],
      [colorA, stopA - mod],
      [colorB, stopA],
      [colorB, 1],
    ];
  } else {
    return [
      [colorA, 0],
      [colorA, stopA],
      [colorB, 1 - stopB + mod],
      [colorB, 1],
    ];
  }
}

function generateIntervals(totalMinutes, numberOfIntervals) {
  let intervalLength = totalMinutes / numberOfIntervals;
  let intervals = [];

  for (let i = 0; i < numberOfIntervals; i++) {
    intervals.push([i * intervalLength, (i + 1) * intervalLength]);
  }

  return intervals;
}

function getPosition(num, rows, columns) {
  let intervals = generateIntervals(90, 16);

  const quad = intervals.findIndex(
    (interval, i) => interval[0] <= num && interval[1] > num
  );

  switch (quad) {
    case 0:
      return { quad: 0, row: 1, column: 1 };
    case 1:
      return { quad: 1, row: 1, column: 2 };
    case 2:
      return { quad: 2, row: 1, column: 3 };
    case 3:
      return { quad: 3, row: 1, column: 4 };
    case 4:
      return { quad: 4, row: 2, column: 1 };
    case 5:
      return { quad: 5, row: 2, column: 2 };
    case 6:
      return { quad: 6, row: 2, column: 3 };
    case 7:
      return { quad: 7, row: 2, column: 4 };
    case 8:
      return { quad: 8, row: 3, column: 1 };
    case 9:
      return { quad: 9, row: 3, column: 2 };
    case 10:
      return { quad: 10, row: 3, column: 3 };
    case 11:
      return { quad: 11, row: 3, column: 4 };
    case 12:
      return { quad: 12, row: 4, column: 1 };
    case 13:
      return { quad: 13, row: 4, column: 2 };
    case 14:
      return { quad: 14, row: 4, column: 3 };
    case 15:
      return { quad: 15, row: 4, column: 4 };
    default:
      return { quad: 15, row: 4, column: 4 };
  }
}

function getUppercaseWords(str) {
  return str
    .split(" ")
    .filter((word) => word === word.toUpperCase())
    .join(" ");
}

function getInverseColor(hexColor) {
  // Remove the hash from the color if it's there
  hexColor = hexColor.replace("#", "");

  // Convert the hex color to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Get the inverse by subtracting from 255
  const rInv = 255 - r;
  const gInv = 255 - g;
  const bInv = 255 - b;

  // Convert back to hex and add leading zeros if necessary
  const rHex = ("0" + rInv.toString(16)).slice(-2);
  const gHex = ("0" + gInv.toString(16)).slice(-2);
  const bHex = ("0" + bInv.toString(16)).slice(-2);

  // Combine the colors and return
  return "#" + rHex + gHex + bHex;
}

function formatDate(dateStr) {
  // Create a new Date object from the date string
  const date = new Date(dateStr);

  // Get the day, month, and year
  const day = date.getUTCDate();
  const month = date
    .toLocaleString("default", { month: "short" })
    .toUpperCase();
  const year = date.getUTCFullYear();

  // Return the formatted date
  return `${month} ${day}, ${year}`;
}
