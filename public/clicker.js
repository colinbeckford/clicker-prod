// simple data values
var judgeName = ""; // string for name of judge
var youtubeLink = ""; // string for freestyle link
var positiveScore = 0; // positive clicks
var negativeScore = 0; // negative clicks

// html objects
var player; // youtube video
var judgeSelect; // select object for judge dropdown

// indexes
var selectedIndex = 0; // index in dropdown menu of what judge you are viewing
var replayDataIndex = 0; // value for position in array of viewing scores

// booleans
var isFlash = false; // boolean for if video should have flash border
var isReplayMode = false; // boolean for if judge is viewing
var isPaused = false; // boolean for if video is paused for timer purposes
var canSubmit = false; // boolean for submitting scores - maybe i can remove this
var done = false; // boolean for video playing - maybe i can remove this

// list objects
var importData = []; // object that features the clicks by each judge for a specific freestyle
var replayData = []; // unformatted array of clicks for individual judge on view
var displayData = []; // configured array with text for clicks
var initialExport = []; // list of clicks on score
var formattedExport = []; // array for formatted version of clicks that gets appended to db

// timer data
var replayTimer; // timeout object for viewing
var viewSeconds = 0; // timer for display scoresviewseconds
var seekMarker; // marker for checking if user manually seeked

// keybinds
var positiveKey = 75;
var negativeKey = 74;
var doubleKey = 50;
var submitKey = 48;

// css functions to hide components, assigning keys, last part ?
$(document).ready(function () {
  let myurl = new URL(window.location.href);
  $("#flash-option").hide();
  $("#input-assign").hide();
  $("#judge-select").hide();
  $("#scoring").hide();
  $("#positiveScore-key").on("keydown", function (pos_e) {
    positiveKey = pos_e.keyCode;
  });
  $("#negativeScore-key").on("keydown", function (neg_e) {
    negativeKey = neg_e.keyCode;
  });
  $("#double-key").on("keydown", function (double_e) {
    doubleKey = double_e.keyCode;
  });
  $("#submit-key").on("keydown", function (submit_e) {
    submitKey = submit_e.keyCode;
  });
  if (myurl.searchParams.has("link")) {
    youtubeLink = "https://youtu.be/" + myurl.searchParams.get("link");
    $("#yt-link").val(youtubeLink);
  } else if (myurl.searchParams.has("name")) {
    $("#judge-name").val(myurl.searchParams.get("name"));
  }
});

// key click functions
$("html").on("keydown", function (event) {
  if (event.which == negativeKey && player.getPlayerState() == 1) {
    canSubmit = true;
    negativeScore += 1;
    raw = positiveScore - negativeScore;
    seconds = Number(player.getCurrentTime().toFixed(1));
    initialExport.push([seconds, raw]);
    $("#click-display").text(
      "+" + String(positiveScore) + " " + "-" + String(negativeScore)
    );
    if (isFlash == true) {
      changeColors("neg");
    }
  } else if (event.which == positiveKey && player.getPlayerState() == 1) {
    canSubmit = true;
    positiveScore += 1;
    raw = positiveScore - negativeScore;
    seconds = Number(player.getCurrentTime().toFixed(1));
    initialExport.push([seconds, raw]);
    $("#click-display").text(
      "+" + String(positiveScore) + " " + "-" + String(negativeScore)
    );
    if (isFlash == true) {
      changeColors("pos");
    }
  } else if (event.which == doubleKey && player.getPlayerState() == 1) {
    canSubmit = true;
    positiveScore += 2;
    raw = positiveScore - negativeScore;
    seconds = Number(player.getCurrentTime().toFixed(1));
    initialExport.push([seconds, raw]);
    $("#click-display").text(
      "+" + String(positiveScore) + " " + "-" + String(negativeScore)
    );
    if (isFlash == true) {
      changeColors("dub");
    }
  } else if (event.which == submitKey && canSubmit == true) {
    isReplayMode = false;
    player.stopVideo();
    var confirmSave = setTimeout(openSave, 500);
    $("#query-link").html(
      "http://scalescollective.com/clicker/" + "?link=" + youtubeLink
    );
  }
});

// open howto
function openHowto() {
  document.getElementById("instructions").style.display = "block";
}

// close howto
function closeHowto() {
  document.getElementById("instructions").style.display = "none";
}

// function called when user wants to score a freestyle
function saveData() {
  openFlash();
  youtubeLink = $("#yt-link").val();
  youtubeLink = chopLink(youtubeLink);
  $("#input-assign").show();
  $("#scoring").show();
  judgeName = $("#judge-name").val();
  getLinks(youtubeLink)
    .then((result) => {
      importData = result.reduce((acc, obj) => {
        const { judge, second, score } = obj;
        const rest = { second, score };

        acc[judge] = acc[judge] || [];
        acc[judge].push(rest);

        return acc;
      }, {});
    })
    .catch((error) => {
      console.error("Error:", error);
    });
  loadVideo();
}

// function called when wanting to view scores for a video
function getScores() {
  openFlash();
  isReplayMode = true;
  $("#judge-select").show();
  $("#scoring").show();
  youtubeLink = $("#yt-link").val();
  youtubeLink = chopLink(youtubeLink);
  getLinks(youtubeLink)
    .then((result) => {
      importData = result.reduce((acc, obj) => {
        const { judge, second, score } = obj;
        const rest = { second, score };

        acc[judge] = acc[judge] || [];
        acc[judge].push(rest);

        return acc;
      }, {});
      createDropdown(importData);
      createGraph(importData);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
  setTimeout(function () {
    loadVideo();
  }, 1500);
}

// popup for flash option
function openFlash() {
  document.getElementById("flash-prompt").style.display = "block";
}

// close popup for flash option
function closeFlash(response) {
  document.getElementById("flash-prompt").style.display = "none";
  if (response) {
    isFlash = true;
  } else {
    isFlash = false;
  }
}

// pulls id from youtube link - there's gotta be a regex line i can replace with
function chopLink(link) {
  for (var i = 0; i < link.length; i++) {
    if (link.charAt(i) == "v" && link.charAt(i + 1) == "=") {
      link = link.slice(i + 2);
    } else if (link.charAt(i) == "e" && link.charAt(i + 1) == "/") {
      link = link.slice(i + 2);
    }
  }
  if (link.includes("list")) {
    link = link.slice(0, link.indexOf("&"));
  }
  if (link.includes("?si")) {
    link = link.slice(0, link.indexOf("?"));
  }
  if (link.includes("&ab")) {
    link = link.slice(0, link.indexOf("&"));
  }

  return link;
}

// api call to get other instances of freestyle scored
function getLinks(link) {
  return fetch(`http://localhost:3000/getClicks/${link}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      return data;
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      throw error;
    });
}

// creates dropdown list of other judges to select from - need to add logic for selecting different udges
function createDropdown(options) {
  judgeSelect = document.getElementById("judge-pick");
  const judgeNames = Object.keys(options);
  for (const judge of judgeNames) {
    var option = document.createElement("option");
    option.text = judge;
    judgeSelect.add(option);
  }
  document.getElementById("judge-pick").addEventListener("change", selectJudge);
  $("#judge-pick").show();
}

// function that calls drawchart
function createGraph(options) {
  google.charts.setOnLoadCallback(drawChart(options));
}

// draws chart of scores - only works for view scores, need to make version for indiv scoring
function drawChart(scores) {
  const scoreMap = {};
  for (const key in scores) {
    const judgeArray = scores[key];
    judgeArray.forEach(({ second, score }) => {
      if (!scoreMap[second]) {
        scoreMap[second] = Array(Object.keys(scores).length).fill(null);
      }
      scoreMap[second][Object.keys(scores).indexOf(key)] = score;
    });
  }
  var resultArray = Object.entries(scoreMap).map(([second, scores]) => {
    const row = [parseInt(second, 10)];
    scores.forEach((score) => row.push(score));
    return row;
  });
  resultArray.sort((a, b) => a[0] - b[0]);

  for (var i = 0; i < resultArray.length; i++) {
    if (i == 0) {
      for (var j = 1; j < resultArray[i].length; j++) {
        if (resultArray[i][j] == null) {
          resultArray[i][j] = 0;
        }
      }
    } else {
      for (var j = 1; j < resultArray[i].length; j++) {
        if (resultArray[i][j] == null) {
          resultArray[i][j] = resultArray[i - 1][j];
        }
      }
    }
  }

  const keys = Object.keys(scores);
  const firstLine = ["Seconds", ...keys];
  resultArray.unshift(firstLine);

  var data = google.visualization.arrayToDataTable(resultArray);

  var options = {
    title: "Scores Over Time",
    titleTextStyle: {
      color: "#5bebaf",
    },
    backgroundColor: "#414141",
    colors: ["#5bebaf", "#23f7e2", "#adefff"],
    curveType: "function",
    fontName: "Courier",
    legend: {
      position: "top",
      textStyle: {
        color: "#5bebaf",
      },
    },
    hAxis: {
      title: "Time",
      titleTextStyle: {
        color: "#5bebaf",
      },
      textStyle: {
        color: "#5bebaf",
      },
      gridlines: { count: 5 },
    },
    vAxis: {
      title: "Score",
      titleTextStyle: {
        color: "#5bebaf",
      },
      textStyle: {
        color: "#5bebaf",
      },
      gridlines: { count: 5 },
    },
  };

  var chart = new google.visualization.LineChart(
    document.getElementById("chart")
  );

  google.visualization.events.addListener(chart, "select", function () {
    var selection = chart.getSelection();
    if (selection.length > 0) {
      var point = selection[0];
      var xValue = data.getValue(point.row, 0);
      videoSeek(xValue);
    }
  });

  chart.draw(data, options);
}

// skips to specific second in youtube video and logs the clicker score at the time
function videoSeek(time) {
  player.seekTo(time);
  getScoreAtSecond(time);
}

// creates video player
function loadVideo() {
  document.getElementById("video").innerHTML = "<div id='player'></div>";
  var tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// loads video into youtube player - need to add functionality for loading new videos
function onYouTubeIframeAPIReady() {
  youtubeLink = chopLink(youtubeLink);
  player = new YT.Player("player", {
    width: 1280,
    height: 720,
    videoId: youtubeLink,
    events: {
      onReady: onplayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

// pauses video onload and retrieves index of selected judge
function onplayerReady(event) {
  event.target.pauseVideo();
  if (isReplayMode) {
    selectJudge();
  }
}

function checkCurrentTime() {
  const currentTime = player.getCurrentTime();
  if (Math.abs(currentTime - seekMarker) > 1.3) {
    getScoreAtSecond(Number(currentTime.toFixed(1)));
  }
  seekMarker = currentTime;
}

function selectJudge() {
  selectedIndex = judgeSelect.selectedIndex;
  const judgeSplitAsArray = Object.values(importData);
  replayData = judgeSplitAsArray[selectedIndex];
  configureLiveReplay();
}

// calls view timer function if the user wants to view scores - need to review the done part
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING && !done) {
    seekMarker = player.getCurrentTime();
    setInterval(checkCurrentTime, 1000);
    if (isReplayMode) {
      replayTimer(replayData);
    }
    done = true;
  } else if (event.data == YT.PlayerState.PAUSED && done) {
    pauseTimer();
  } else if (event.data == YT.PlayerState.PLAYING && done) {
    resumeTimer();
  }
}

// changing the colors upon click
function changeColors(type) {
  if (type == "pos") {
    $("#player").css({
      "border-color": "#008000",
      "border-width": "5px",
      "border-style": "solid",
      "border-radius": "10px",
    });
  } else if (type == "neg") {
    $("#player").css({
      "border-color": "#FF0000",
      "border-width": "5px",
      "border-style": "solid",
      "border-radius": "10px",
    });
  } else if (type == "dub") {
    $("#player").css({
      "border-color": "#00FFFF",
      "border-width": "5px",
      "border-style": "solid",
      "border-radius": "10px",
    });
  }
  var flashTimer = setTimeout("change()", 200);
}

// resets the css around the video in between clicks
function change() {
  $("#player").css({
    "border-color": "#635F56",
    "border-width": "5px",
    "border-style": "solid",
    "border-radius": "10px",
  });
}

// loops through scoreset and refactors the scores into normal clicker values of +,-
function configureLiveReplay() {
  displayData.length = 0;
  for (var i = 0; i < replayData.length; i++) {
    if (i == 0) {
      if (replayData[i].score == 1) {
        positiveScore = 1;
        negativeScore = 0;
      } else if (list[replayDataIndex].score == 2) {
        positiveScore = 2;
        negativeScore = 0;
      } else if (list[replayDataIndex].score == -1) {
        positiveScore = 0;
        negativeScore = 1;
      }
    } else {
      if (replayData[i].score == replayData[i - 1].score + 1) {
        positiveScore++;
      } else if (replayData[i].score == replayData[i - 1].score - 1) {
        negativeScore++;
      } else if (replayData[i].score == replayData[i - 1].score + 2) {
        positiveScore = positiveScore + 2;
      }
    }
    displayData.push([
      replayData[i].second,
      "+" + String(positiveScore) + " " + "-" + String(negativeScore),
    ]);
  }
  return displayData;
}

// scrolls through list of scores to retrieve the click value at a specific time
function getScoreAtSecond(time) {
  var i = 0;
  while (displayData[i][0] < time) {
    index++;
  }
  replayDataIndex = index;
  resumeTimer();
}

function viewAdd(list) {
  viewSeconds = Number(player.getCurrentTime().toFixed(1));
  while (viewSeconds == list[replayDataIndex].second) {
    if (replayDataIndex == 0) {
      if (list[replayDataIndex].score == 1) {
        positiveScore = 1;
        negativeScore = 0;
        if (isFlash) {
          changeColors("pos");
        }
      } else if (list[replayDataIndex].score == 2) {
        positiveScore = 2;
        negativeScore = 0;
        if (isFlash) {
          changeColors("dub");
        }
      } else if (list[replayDataIndex].score == -1) {
        positiveScore = 0;
        negativeScore = 1;
        if (isFlash) {
          changeColors("neg");
        }
      }
    } else {
      if (list[replayDataIndex].score == list[replayDataIndex - 1].score + 1) {
        positiveScore++;
        if (isFlash) {
          changeColors("pos");
        }
      } else if (
        list[replayDataIndex].score ==
        list[replayDataIndex - 1].score - 1
      ) {
        negativeScore++;
        if (isFlash) {
          changeColors("neg");
        }
      } else if (
        list[replayDataIndex].score ==
        list[replayDataIndex - 1].score + 2
      ) {
        positiveScore = positiveScore + 2;
        if (isFlash) {
          changeColors("dub");
        }
      }
    }
    $("#click-display").text(displayData[replayDataIndex][1]);
    replayDataIndex += 1;
  }
  replayTimer(list);
}

// timeout function that starts the scan of youtube video time along with the score data
function replayTimer(list) {
  if (isPaused) {
    return;
  }
  replayTimer = setTimeout(function () {
    viewAdd(list);
  }, 10);
}

// function to pause the timer
function pauseTimer() {
  clearTimeout(replayTimer);
  isPaused = true;
}

// Function to resume the timer
function resumeTimer() {
  isPaused = false;
  replayTimer(replayData);
}

// opens save popup
function openSave() {
  document.getElementById("save-prompt").style.display = "block";
}

// closes save popup
function closeSave(response) {
  document.getElementById("save-prompt").style.display = "none";
  if (response) {
    $("#post-data").show();
    formatList();
  } else {
    location.assign(
      "http://scalescollective.com/clicker/" +
        "?link=" +
        youtubeLink +
        "&name=" +
        judgeName
    );
    var refreshTimeout = setTimeout(saveData, 500);
  }
}

// creates object to append to db after judge scores freestyle
function formatList() {
  for (var i = 0; i < initialExport.length; i++) {
    formattedExport.push([
      judgeName,
      youtubeLink,
      initialExport[i][0],
      initialExport[i][1],
    ]);
  }
  const graphData = {};
  formattedExport.forEach(([judgeName, youtubeLink, second, score]) => {
    if (!graphData[judgeName]) {
      graphData[judgeName] = [];
    }

    graphData[judgeName].push({ second, score });
  });
  createGraph(graphData);
  fetch("http://localhost:3000/appendClicks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dataArray: formattedExport }),
  })
    .then((response) => response.json())
    .then((data) => {
      return data;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
