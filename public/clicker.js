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
// maybe remove because of was paused
var isPaused = false; // boolean for if video is paused for timer purposes
var canSubmit = false; // boolean for submitting scores - maybe i can remove this

// list objects
var importData = []; // object that features the clicks by each judge for a specific freestyle
var replayData = []; // unformatted array of clicks for individual judge on view
var displayData = []; // configured array with text for clicks
var initialExport = []; // list of clicks on score
var formattedExport = []; // array for formatted version of clicks that gets appended to db
var judgeNames = [];
var ticks = [];
var resultArray = [];

// timer data
var replayTimeout; // timeout object for viewing
var replayInterval;
// interval for checking seeking
var checkInterval;
var viewSeconds = 0; // timer for display scores
var seekMarker; // marker for checking if user manually seeked
var wasPaused;

// keybinds
var positiveKey = 75;
var negativeKey = 74;
var doubleKey = 50;
var submitKey = 48;

var chartSelection = null;
var chart;
var chartOptions;
var data;

var pageWidth = window.innerWidth;
var pageHeight = window.innerHeight;

var judge_codes;

// css functions to hide components, assigning keys
$(document).ready(function () {
  getCodes();
  getJudges();
  getFreestyles();
  // gets url of location
  let myurl = new URL(window.location.href);
  // code for adjusting keybinds
  $("#positive-key").on("keydown", function (pos_e) {
    positiveKey = pos_e.keyCode;
  });
  $("#negative-key").on("keydown", function (neg_e) {
    negativeKey = neg_e.keyCode;
  });
  $("#double-key").on("keydown", function (double_e) {
    doubleKey = double_e.keyCode;
  });
  $("#submit-key").on("keydown", function (submit_e) {
    submitKey = submit_e.keyCode;
  });
  $(document).on("change", "#judge-pick", handleSelectChange);
  $("#yt-link").on("mousedown", function (event) {
    $(this).focus();
    event.preventDefault();
  });

  window.onerror = function (message, source, lineno, colno, error) {
    console.error('Error message:', message);
    console.error('Source:', source);
    console.error('Line number:', lineno);
    console.error('Column number:', colno);
    console.error('Error object:', error);
    alert("There has been an error with this application, please refresh.");
  }
});

function handleSelectChange() {
  chartSelection = null;
  selectJudge();
}
// key click functions
$("html").on("keydown", function (event) {
  if (!isReplayMode && playerExists()) {
    // negative click
    if (event.which == negativeKey && player.getPlayerState() == 1) {
      canSubmit = true;
      negativeScore += 1;
      raw = positiveScore - negativeScore;
      seconds = Number(player.getCurrentTime().toFixed(1));
      initialExport.push([seconds, raw]);
      $("#negative-display").text("-" + String(negativeScore));
      if (isFlash == true) {
        changeColors("neg");
      }
      // positive click
    } else if (event.which == positiveKey && player.getPlayerState() == 1) {
      canSubmit = true;
      positiveScore += 1;
      raw = positiveScore - negativeScore;
      seconds = Number(player.getCurrentTime().toFixed(1));
      initialExport.push([seconds, raw]);
      $("#positive-display").text("+" + String(positiveScore));
      if (isFlash == true) {
        changeColors("pos");
      }
      // double click
    } else if (event.which == doubleKey && player.getPlayerState() == 1) {
      canSubmit = true;
      positiveScore += 2;
      raw = positiveScore - negativeScore;
      seconds = Number(player.getCurrentTime().toFixed(1));
      initialExport.push([seconds, raw]);
      $("#positive-display").text("+" + String(positiveScore));
      if (isFlash == true) {
        changeColors("dub");
      }
      // submit
    } else if (event.which == submitKey && canSubmit == true) {
      beginSave();
    }
  }
});

function beginSave() {
  isReplayMode = false;
  clearInterval(checkInterval);
  player.stopVideo();
  var confirmSave = setTimeout(openSave, 500);
}

function reset() {
  setViewingMode(false);
  positiveScore = 0;
  negativeScore = 0;
  judgeSelect = null;
  selectedIndex = 0;
  replayDataIndex = 0;
  importData = {};
  replayData = [];
  displayData = [];
  initialExport = [];
  formattedExport = [];
  replayTimeout = null;
  viewSeconds = 0;
  seekMarker = 0;
  // document.getElementById("judge-select").innerHTML = "";
  $("#positive-display").text("+0");
  $("#negative-display").text("-0");
  clearInterval(replayInterval);
  chartSelection = null;
  ticks = [];
  if ($("#player").length) {
    document.getElementById("player").innerHTML = "";
  }
}

// hide intro css
function closeIntro() {
  $("#intro").hide();
  $("#main").css("display", "flex");
  // $("#main").show();
}

// popup for flash option
function openFlash() {
  $("#flashPromptModal").modal('show');
}

// close popup for flash option
function closeFlash(response) {
  $("#flashPromptModal").modal('hide');
  if (response) {
    isFlash = true;
  } else {
    isFlash = false;
  }
  if (isReplayMode) {
    importScores();
    openSelect();
  }
  setTimeout(() => {
    loadVideo();
  }, 500);
}

// opens save popup
function openSave() {
  $("#save-prompt").show();
}

// closes save popup
function closeSave(response) {
  $("#save-prompt").hide();
  if (response) {
    handleFocus(false);
    isReplayMode = true;
    formatList();
  }
}

// opens judge select
function openSelect() {
  $("#judge-select").show();
  openScoring();
  setTimeout(function () {
    if (isReplayMode) {
      createDropdown(importData);
    }
  }, 1000);
}

// closes judge select
function closeSelect() {
  $("#judge-select").hide();
}

// opens the inputs for judge name and keybinds
function openInputs() {
  $("#inputsModal").modal('show');
}

// opens the scoring display
function openScoring() {
  $("#scoring").show();
}

// closes the inputs for judge name and keybinds
function closeInputs() {
  isFlash = $("#flash-border-toggle").prop("checked");
  judgeName = $("#judge-name").val();
  $("#inputsModal").modal('hide');
  openScoring();
  if (isReplayMode) {
    importScores();
    openSelect();
    createDropdown(importData);
  }

  loadVideo();
}

// returns boolean if the youtube player has been initialized
function playerExists() {
  return player && typeof player.loadVideoById === "function";
}

function loadData(replay) {
  reset();
  isReplayMode = replay;
  youtubeLink = chopLink($("#initial-yt-link").val());
  if (playerExists()) {
    youtubeLink = chopLink($("#yt-link").val());
    player.cueVideoById(youtubeLink);
  }
  closeIntro();
  if (!isReplayMode) {
    openInputs();
  } else {
    openFlash();
  }
}

function importScores() {
  getScores(youtubeLink)
    .then((result) => {
      importData = result.reduce((acc, obj) => {
        const { judge, second, score } = obj;
        const rest = { second, score };

        acc[judge] = acc[judge] || [];
        acc[judge].push(rest);
        return acc;
      }, {});
      if (JSON.stringify(importData) !== "{}") {
        setViewingMode(true);
        generateTimeTicks(importData);
        createChart(importData);
      } else {
        setViewingMode(false);
        alert("This freestyle has not been scored by anyone.");
        location.reload();
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// pulls id from youtube link
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

function filterJudge(url, data) {
  const urlParams = new URLSearchParams(new URL(url).search);
  const code = urlParams.get('nyyl');
  var filteredJudge;
  for (let judge of judge_codes) {
    if (judge.judgeCode == code) {
      filteredJudge = judge.judgeName;
    }
  }
  let judgeCount = 1;
  let replacedJudges = {};

  data.forEach(entry => {
    if (entry.judge !== filteredJudge && !replacedJudges[entry.judge]) {
      replacedJudges[entry.judge] = `Judge ${judgeCount++}`;
    }

    entry.judge = replacedJudges[entry.judge] || entry.judge;
  });
  return data;
}

function getCodes() {
  fetch('../config/nyyl.json')
  .then(response => response.json())
  .then(data => {
    judge_codes = data.judge_codes;
  })
  .catch(error => console.error('Error loading config:', error));
}

// api call to get other instances of freestyle scored
function getScores(link) {
  if (window.location.href.includes("nyyl")) {
    return fetch(`/getClicks_NYYL/${link}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        filterJudge(window.location.href, data);
        return data;
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        throw error;
      });
  }
  else {
    return fetch(`/getClicks/${link}`)
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

}

function getJudges() {
  if (window.location.href.includes("nyyl")) {
    return fetch(`/getJudges_NYYL`)
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
  else {
    return fetch(`/getJudges`)
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
}


function getFreestyles() {
  if (window.location.href.includes("nyyl")) {
    return fetch(`/getLinks_NYYL`)
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
  else {
    return fetch(`/getLinks`)
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

}

function appendClicks() {
  fetch("/appendClicks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dataArray: formattedExport }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      alert("Your scores for this freestyle have been submitted!");
      importScores();
      return data;
    })
    .catch((error) => {
      alert("There has been an error with saving the score for this routine. Please refresh and try again.");
      console.error("Error:", error);
    });
}

// function to select judge and pull their data from the list of judges that scored the routine
function selectJudge() {
  const judgeSplitAsArray = Object.values(importData);
  if (chartSelection == null) {
    judgeSelect = $("#judge-pick");
    if ($("#judge-pick").children("option").length > 1) {
      selectedIndex = judgeSelect[0].selectedIndex;
    } else {
      selectedIndex = judgeSplitAsArray.length - 1;
    }
  } else {
    selectedIndex = chartSelection;
    $("#judge-pick").val(judgeNames[selectedIndex]);
  }
  replayData = judgeSplitAsArray[selectedIndex];
  configureLiveReplay();
  checkCurrentTime(player.getCurrentTime());
}

// creates dropdown list of other judges to select from
function createDropdown(options) {
  document.getElementById("judge-select").innerHTML =
    "<select id='judge-pick'></select>";
  judgeSelect = $("#judge-pick");
  $("#judge-pick").empty();
  judgeNames = Object.keys(options);
  for (const judge of judgeNames) {
    var option = $("<option></option>").val(judge).text(judge);
    $("#judge-pick").append(option);
  }
}

// function that calls drawchart
function createChart(options) {
  google.charts.load("current", { packages: ["corechart", "line"] });
  google.charts.setOnLoadCallback(drawChart(options));
}

// draws chart of scores
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
  resultArray = Object.entries(scoreMap).map(([second, scores]) => {
    const row = [Number(second)];
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
  for (let index = 0; index < resultArray.length; index++) {
    const subArray = resultArray[index];

    if (index === 0) {
      const newHeader = [];
      for (let i = 0; i < subArray.length; i++) {
        newHeader.push(subArray[i]);
        if (i > 0) {
          newHeader.push({ role: "tooltip", p: { html: true } });
        }
      }
      resultArray[index] = newHeader;
    } else {
      const newRow = [];
      for (let i = 0; i < subArray.length; i++) {
        newRow.push(subArray[i]);
        if (i > 0) {
          var delta;
          var symbol;
          var whileSearcher = index;
          while (
            subArray[i] == resultArray[whileSearcher - 1][i * 2 - 1] &&
            subArray[0] == resultArray[whileSearcher - 1][i * 2 - 1]
          ) {
            whileSearcher -= 1;
          }
          if (index > 1) {
            if (keys.length > 1) {
              delta = subArray[i] - resultArray[index - 2][i * 2 - 1];
            } else {
              delta = subArray[i] - resultArray[index - 1][i * 2 - 1];
            }
          } else {
            delta = 0;
          }
          if (delta >= 0) {
            symbol = "+";
          } else {
            symbol = "";
          }
          var deltaValue = symbol + delta;
          newRow.push(
            "<div>" +
            resultArray[0][i * 2 - 1] +
            "</div>" +
            "<div>" +
            deltaValue +
            " " +
            convertIntegerToTime(subArray[0]) +
            "</div>"
          );
        }
      }
      resultArray[index] = newRow;
    }
  }

  data = google.visualization.arrayToDataTable(resultArray);
  chartOptions = {
    title: "Scores Over Time",
    animation: {
      startup: true,
      duration: 1000,
      easing: "out",
    },
    backgroundColor: "#414141",
    colors: [
      "#FF0000",
      "#00FF00",
      "#0000FF",
      "#FFFF00",
      "#00FFFF",
      "#FF00FF",
      "#FFA500",
      "#800080",
      "#008080",
      "#FF7F50",
    ],
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
      ticks: ticks,
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
      minValue: 0,
      gridlines: { count: 5 },
    },
    tooltip: { isHtml: true, trigger: "selection", enabled: true },
    height: pageHeight * 0.8,
  };

  chart = new google.visualization.LineChart(document.getElementById("chart"));
  chart.draw(data, chartOptions);

  google.visualization.events.addListener(chart, "onmouseover", function (e) {
    return false;
  });

  google.visualization.events.addListener(chart, "hover", function (e) {
    return false;
  });

  google.visualization.events.addListener(chart, "select", function () {
    var selection = chart.getSelection();
    var point = selection[0];
    if (selection.length > 0) {
      var xValue = data.getValue(point.row, 0);
      chartSelection = (selection[0].column + 1) / 2 - 1;
      selectJudge();
      videoSeek(xValue);
    }
  });
}

function convertIntegerToTime(number) {
  var minutesPart = Math.floor(number / 60);
  var secondsPart = Math.floor(number % 60);
  var formattedTime =
    minutesPart + ":" + (secondsPart < 10 ? "0" : "") + secondsPart;
  return formattedTime;
}

function generateTimeTicks(lists) {
  var minSecond = Infinity;
  var maxSecond = -Infinity;
  for (const key in lists) {
    if (lists.hasOwnProperty(key)) {
      const dataList = lists[key];
      dataList.forEach((item) => {
        const secondValue = Math.floor(item.second);
        if (secondValue < minSecond) {
          minSecond = secondValue;
        }
        if (secondValue > maxSecond) {
          maxSecond = secondValue;
        }
      });
    }
  }

  for (
    var totalSeconds = minSecond;
    totalSeconds <= maxSecond;
    totalSeconds += 15
  ) {
    ticks.push({ v: totalSeconds, f: convertIntegerToTime(totalSeconds) });
  }
}

// skips to specific second in youtube video and logs the clicker score at the time
function videoSeek(time) {
  player.seekTo(time);
  selectJudge();
  checkCurrentTime(time);
}

// creates video player
function loadVideo() {
  if (
    !playerExists() &&
    (isReplayMode == false || JSON.stringify(importData) !== "{}")
  ) {
    $("#video").html("<div id='player'></div>");
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }
}

function setViewingMode(type) {
  $("#replay").css("display", "flex");
  if (type == true) {
    if (playerExists()) {
      $("#video").css("width", pageWidth * 0.45);
      $("#video").css("height", pageHeight * 0.8);
      $("#player").css("width", pageWidth);
      $("#player").css("height", pageHeight * 0.8);
    }
    $("#replay").append('<div id="chart"></div>');
  } else {
    if (playerExists()) {
      $("#video").css("width", pageWidth * 0.85);
      $("#video").css("height", pageHeight * 0.8);
      $("#player").css("width", pageWidth * 0.85);
      $("#player").css("height", pageHeight * 0.8);
    }
    $("#chart").remove();
  }
}

// pauses video onload and retrieves index of selected judge
function onPlayerReady(event) {
  $('#focusable').focus();
  event.target.pauseVideo();
  if (isReplayMode) {
    checkInterval = setInterval(seekIndicator, 1000);
  }
}

// calls view timer function if the user wants to view scores
// may need to re-assess/condense - is/was paused
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING && isReplayMode == false) {
    wasPaused = false;
    // need to reimplement this for key inputs interacting with video
    handleFocus(true);
    // $(document).on("keydown", handleKeydown);
  }
  // else if (event.data == YT.PlayerState.PLAYING && isReplayMode) {
  //   wasPaused = false;
  //   selectJudge();
  //   seekMarker = player.getCurrentTime();
  //   isPaused = false;
  //   replayTimer();
  // } 
  else if (event.data == YT.PlayerState.PAUSED) {
    handleFocus(false);
    // $(document).off("keydown", handleKeydown);
    wasPaused = true;
    pauseTimer();
  } else if (event.data == YT.PlayerState.CUED) {
    handleFocus(false);
    wasPaused = true;
  }
}

// loads video into youtube player
function onYouTubeIframeAPIReady() {
  if (isReplayMode == false || JSON.stringify(importData) !== "{}") {
    if (isReplayMode) {
      player = new YT.Player("player", {
        width: pageWidth * 0.45,
        height: pageHeight * 0.8,
        videoId: youtubeLink,
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      });
    } else {
      player = new YT.Player("player", {
        width: pageWidth * 0.85,
        height: pageHeight * 0.8,
        videoId: youtubeLink,
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      });
    }
  }
  $("#positive-display").text("+0");
  $("#negative-display").text("-0");
}

// scrolls through list of scores to retrieve the click value at a specific time
function getScoreAtSecond(time) {
  var i = 0;
  positiveScore = 0;
  negativeScore = 0;
  while (i < replayData.length && replayData[i].second < time) {
    if (i > 0) {
      if (i < replayData.length) {
        var previousScore = replayData[i - 1].score;
        var currentScore = replayData[i].score;
        if (currentScore > previousScore) {
          positiveScore += currentScore - previousScore;
        } else if (currentScore < previousScore) {
          negativeScore += previousScore - currentScore;
        }
      }
    }
    i++;
  }
  var positiveText = "+" + positiveScore;
  var negativeText = "-" + negativeScore;
  $("#positive-display").text(positiveText);
  $("#negative-display").text(negativeText);
  replayDataIndex = i;
}

function checkCurrentTime(time) {
  getScoreAtSecond(time);
  seekMarker = player.getCurrentTime();
}

// calls view timer function if the user wants to view scores
// may need to re-assess/condense - is/was paused
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING && isReplayMode == false) {
    wasPaused = false;
    // need to reimplement this for key inputs interacting with video
    handleFocus(true);
    // $(document).on("keydown", handleKeydown);
  }
  else if (event.data == YT.PlayerState.PLAYING && isReplayMode) {
    wasPaused = false;
    selectJudge();
    seekMarker = player.getCurrentTime();
    isPaused = false;
    replayTimer();
  }
  else if (event.data == YT.PlayerState.PAUSED) {
    handleFocus(false);
    // $(document).off("keydown", handleKeydown);
    wasPaused = true;
    pauseTimer();
  } else if (event.data == YT.PlayerState.CUED) {
    handleFocus(false);
    wasPaused = true;
  }
}

function handleFocus(focus) {
  if (focus == true) {
    $('#focusable').focus();
  }
  else {
    $('#focusable').blur();
  }
}

function handleKeydown(e) {
  e.preventDefault();
}

function seekIndicator() {
  if (wasPaused) {
    var currentTime = player.getCurrentTime();
    if (Math.abs(currentTime - seekMarker) > 1) {
      checkCurrentTime(player.getCurrentTime());
      return true;
    }
    seekMarker = currentTime;
  } else {
    seekMarker = player.getCurrentTime();
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
      } else if (replayData[i].score == 2) {
        positiveScore = 2;
        negativeScore = 0;
      } else if (replayData[i].score == -1) {
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
      "+" + String(positiveScore),
      "-" + String(negativeScore),
    ]);
  }
  dataAnalysis();
  return displayData;
}

function viewAdd(list) {
  viewSeconds = Number(player.getCurrentTime().toFixed(1));
  if (replayDataIndex < list.length) {
    if (Math.abs(viewSeconds - list[replayDataIndex].second) <= 0.25) {
      if (replayDataIndex == 0) {
        if (list[replayDataIndex].score == 1) {
          positiveScore = 1;
          negativeScore = 0;
          $("#positive-display").text(displayData[replayDataIndex][1]);
          clickerEffect("+");
          if (isFlash) {
            changeColors("pos");
          }
        } else if (list[replayDataIndex].score == 2) {
          positiveScore = 2;
          negativeScore = 0;
          $("#positive-display").text(displayData[replayDataIndex][1]);
          clickerEffect("+");
          if (isFlash) {
            changeColors("dub");
          }
        } else if (list[replayDataIndex].score == -1) {
          positiveScore = 0;
          negativeScore = 1;
          $("#negative-display").text(displayData[replayDataIndex][2]);
          clickerEffect("-");
          if (isFlash) {
            changeColors("neg");
          }
        }
      } else {
        if (
          list[replayDataIndex].score ==
          list[replayDataIndex - 1].score + 1
        ) {
          positiveScore++;
          $("#positive-display").text(displayData[replayDataIndex][1]);
          clickerEffect("+");
          if (isFlash) {
            changeColors("pos");
          }
        } else if (
          list[replayDataIndex].score ==
          list[replayDataIndex - 1].score - 1
        ) {
          negativeScore++;
          $("#negative-display").text(displayData[replayDataIndex][2]);
          clickerEffect("-");
          if (isFlash) {
            changeColors("neg");
          }
        } else if (
          list[replayDataIndex].score ==
          list[replayDataIndex - 1].score + 2
        ) {
          positiveScore = positiveScore + 2;
          $("#positive-display").text(displayData[replayDataIndex][1]);
          clickerEffect("+");
          if (isFlash) {
            changeColors("dub");
          }
        }
      }
      setChartPoint(
        replayData[replayDataIndex].second,
        replayData[replayDataIndex].score
      );
      replayDataIndex += 1;
    } else {
      var i = 0;
      while (list[i].second < viewSeconds) {
        i++;
      }
      replayDataIndex = i;
    }
    replayTimer();
  }
}

function setChartPoint(second, score) {
  var chartIndex;
  for (var i = 0; i < resultArray.length; i++) {
    var row = resultArray[i];
    if (row[0] === second && row[selectedIndex * 2 + 1] === score) {
      chartIndex = i;
      break;
    }
  }
  if (
    resultArray[chartIndex][selectedIndex * 2 + 1] ==
    resultArray[chartIndex - 1][selectedIndex * 2 + 1]
  ) {
    return false;
  }
  if (chartIndex > 0 != false) {
    chart.setSelection([{ row: chartIndex, column: selectedIndex * 2 + 1 }]);
  }
}

function clickerEffect(delta) {
  if (delta == "+") {
    $("#positive-display").addClass("updating");
    setTimeout(() => {
      $("#positive-display").removeClass("updating");
    }, 100);
  } else {
    $("#negative-display").addClass("updating");
    setTimeout(() => {
      $("#negative-display").removeClass("updating");
    }, 100);
  }
}

// function to pause the timer
function pauseTimer() {
  clearTimeout(replayTimeout);
  wasPaused = true;
}

// timeout function that starts the scan of youtube video time along with the score data
function replayTimer() {
  if (isReplayMode && wasPaused == false) {
    replayTimeout = setTimeout(function () {
      viewAdd(replayData);
    }, 200);
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
  appendClicks();
}

function dataAnalysis() {
  var maxSequenceScore = Number.NEGATIVE_INFINITY;
  var maxSequenceTime;
  var sequenceIndexStart;
  var sequenceIndexEnd;
  var i;
  var j;
  for (i = 0; i < replayData.length; i++) {
    j = i;
    var sequenceScore = 0;
    while (
      replayData[j].second <= replayData[i].second + 10 &&
      j < replayData.length - 1
    ) {
      sequenceScore += replayData[j + 1].score - replayData[j].score;
      if (sequenceScore > maxSequenceScore) {
        sequenceIndexStart = i;
        sequenceIndexEnd = j;
        maxSequenceScore = sequenceScore;
        maxSequenceTime = replayData[i].second;
      }
      j++;
    }
  }
  console.log(
    "Max Sequence",
    maxSequenceScore,
    maxSequenceTime,
    replayData[j].second,
    displayData[sequenceIndexStart][1],
    displayData[sequenceIndexEnd][1]
  );
}
