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

// css functions to hide components, assigning keys, and autofill name/link if applicable
$(document).ready(function () {
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
  // autofilling logic
  if (myurl.searchParams.has("link")) {
    youtubeLink = "https://youtu.be/" + myurl.searchParams.get("link");
    $("#yt-link").val(youtubeLink);
  } else if (myurl.searchParams.has("name")) {
    $("#judge-name").val(myurl.searchParams.get("name"));
  }
  $(document).on("change", "#judge-pick", handleSelectChange);
});

function handleSelectChange() {
  chartSelection = null;
  selectJudge();
}
// key click functions
$("html").on("keydown", function (event) {
  // negative click
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
  // positive click
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
  // double click
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
  // submit
  } else if (event.which == submitKey && canSubmit == true) {
    isReplayMode = false;
    clearInterval(checkInterval);
    player.stopVideo();
    // timer to open save menu - could fix styling logic here
    var confirmSave = setTimeout(openSave, 500);
    $("#query-link").html(
      '<a href="http://scalescollective.com/clicker/?link=' + youtubeLink + '">Link to freestyle on Scales Clicker' + '</a>'
  );
  }
});

function reset() {
  positiveScore = 0;
  negativeScore = 0;
  judgeSelect = null;
  selectedIndex = 0;
  replayDataIndex = 0;
  importData = [];
  replayData = [];
  displayData = [];
  initialExport = [];
  formattedExport = [];
  replayTimeout = null;
  viewSeconds = 0;
  seekMarker = 0;
  document.getElementById("chart").innerHTML = "";
  document.getElementById("click-display").innerHTML = "";
  document.getElementById("judge-select").innerHTML = "";
  clearInterval(replayInterval);
  chartSelection = null;
}

// open howto
function openHowto() {
  $("#instructions").show();
}

// close howto
function closeHowto() {
  $("#instructions").hide();
}

// popup for scoring
function openScoring() {
  $("#scoring").show();
}

// popup for flash option
function openFlash() {
  $("#flash-prompt").show();
}

// close popup for flash option
function closeFlash(response) {
  $("#flash-prompt").hide();
  if (response) {
    isFlash = true;
  } else {
    isFlash = false;
  }
  if (isReplayMode) {
    importScores();
    openSelect();
  }
  else {
    openInputs();
  }
}

// opens save popup
function openSave() {
  $("#save-prompt").show();
}

// opens post data
function openPost() {
  $("#post-data").show();
}


// closes save popup
function closeSave(response) {
  $("#save-prompt").hide();
  if (response) {
    openPost();
    isReplayMode = true;
    formatList();
  } else {
    location.assign(
      "http://scalescollective.com/clicker/" +
        "?link=" +
        youtubeLink +
        "&name=" +
        judgeName
    );
  }
}

// opens judge select
function openSelect() {
  $("#judge-select").show();
  openScoring();
  setTimeout(function () {
    if (isReplayMode) {
      createDropdown(importData);
    };
  }, 1000);
}

// closes judge select
function closeSelect() {
  $("#judge-select").hide();
}

// opens the inputs for judge name and keybinds
function openInputs() {
  $("#inputs-popup").show();
}

// closes the inputs for judge name and keybinds
function closeInputs() {
  judgeName = $("#judge-name").val();
  $("#inputs-popup").hide();
  openScoring();
  setTimeout(function () {
    if (isReplayMode) {
      createDropdown(importData);
    };
  }, 1000);

}

// returns boolean if the youtube player has been initialized
function playerExists() {
  return player && typeof player.loadVideoById === 'function';
}

function loadData(replay) {
  isReplayMode = replay;
  youtubeLink = chopLink($("#yt-link").val());
  if (playerExists()) {
    reset();
    player.cueVideoById(youtubeLink);
  }
  loadVideo();
  openFlash();
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
      generateTimeTicks(importData);
      createChart(importData);
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

// api call to get other instances of freestyle scored
function getScores(link) {
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

function getJudges() {
  return fetch(`http://localhost:3000/getJudges`)
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

function getFreestyles() {
  return fetch(`http://localhost:3000/getLinks`)
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

function appendClicks() {
  fetch("http://localhost:3000/appendClicks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dataArray: formattedExport }),
  })
    .then((response) => response.json())
    .then((data) => 
      {
      importScores();
      return data;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}


// function to select judge and pull their data from the list of judges that scored the routine
function selectJudge() {
  const judgeSplitAsArray = Object.values(importData);
  if ( chartSelection == null ) {
    judgeSelect = $("#judge-pick");
    if ($("#judge-pick").children("option").length > 1) {
      selectedIndex = judgeSelect[0].selectedIndex;
    }
    else {
      selectedIndex = judgeSplitAsArray.length - 1;
    }
  }
  else {
    selectedIndex = chartSelection;
    $("#judge-pick").val(judgeNames[selectedIndex]);
  }
  replayData = judgeSplitAsArray[selectedIndex];
  configureLiveReplay();
  checkCurrentTime(player.getCurrentTime());
}

// creates dropdown list of other judges to select from 
function createDropdown(options) {
  document.getElementById("judge-select").innerHTML = "<select id='judge-pick'></select>";
  judgeSelect = $("#judge-pick");
  $("#judge-pick").empty();
  judgeNames = Object.keys(options);
  for (const judge of judgeNames) {
    var option = $("<option></option>").val(judge).text(judge);
    $("#judge-pick").append(option);
  }
  openSelect();
}

// function that calls drawchart
function createChart(options) {
  google.charts.load('current', {packages: ['corechart', 'line']});
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

    for (let index = 0; index < resultArray.length; index++) {
    const subArray = resultArray[index];
    
    if (index === 0) {
        const newHeader = [];
        for (let i = 0; i < subArray.length; i++) {
            newHeader.push(subArray[i]);
            if (i > 0) {
                newHeader.push({role: 'tooltip', p: {html: true}});
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
                // var whileSearcher = index;
                // while (subArray[i] == resultArray[whileSearcher - 1][(i*2)-1] && subArray[0] == resultArray[whileSearcher - 1][(i*2)-1]) {
                //   whileSearcher -= 1;
                // }
                // delta = subArray[i] - resultArray[whileSearcher-1][(i*2)-1]
                // if (delta >= 0) {
                //   symbol = "+"
                // }
                // else {
                //   symbol = ""
                // }
                newRow.push("<div>" + resultArray[0][(i*2)-1] + "</div>" + "<div>" + convertIntegerToTime(subArray[0]) + "</div>");
            }
        }
        resultArray[index] = newRow;
    }
}


var data = google.visualization.arrayToDataTable(resultArray);
  
var options = {
  title: "Scores Over Time",
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
      gridlines: { count: 5 },
  },
  tooltip: { isHtml: true, trigger: 'hover' }
};

  var chart = new google.visualization.LineChart(
    document.getElementById("chart")
  );

  chart.draw(data, options);

  // dont show chart till import done

  google.visualization.events.addListener(chart, 'onmouseover', function(e) {
    // Return false to prevent default action
    return false;
});
 
}

function convertIntegerToTime(number) {
  var minutesPart = Math.floor(number / 60);
  var secondsPart = Math.floor(number % 60);
  var formattedTime = minutesPart + ':' + (secondsPart < 10 ? '0' : '') + secondsPart;
  return formattedTime;
}


function generateTimeTicks(lists) {
  var minSecond = Infinity;
  var maxSecond = -Infinity;
  for (const key in lists) {
    if (lists.hasOwnProperty(key)) {
        const dataList = lists[key];
        dataList.forEach(item => {
            const secondValue = item.second;
            if (secondValue < minSecond) {
                minSecond = secondValue;
            }
            if (secondValue > maxSecond) {
                maxSecond = secondValue;
            }
        });
    }
}

  for (var totalSeconds = minSecond; totalSeconds <= maxSecond; totalSeconds += 15) {
      ticks.push({ v: totalSeconds, f: convertIntegerToTime(totalSeconds) });
  }
}

// skips to specific second in youtube video and logs the clicker score at the time
function videoSeek(time) {
  player.seekTo(time);
  // maybe this breaks something? maybe only for isReplayMode?
  console.log("Video seek");
  selectJudge();
  checkCurrentTime(time);
}

// creates video player
function loadVideo() {
  if (!playerExists()) {
    $("#video").html("<div id='player'></div>");
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }
}

// loads video into youtube player 
function onYouTubeIframeAPIReady() {
  youtubeLink = chopLink(youtubeLink);
  player = new YT.Player("player", {
    width: 1280,
    height: 720,
    videoId: youtubeLink,
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

// pauses video onload and retrieves index of selected judge
function onPlayerReady(event) {
  event.target.pauseVideo();
  checkInterval = setInterval(seekIndicator, 1000); 
}

// scrolls through list of scores to retrieve the click value at a specific time
function getScoreAtSecond(time) {
  var i = 0;
  positiveScore = 0;
  negativeScore = 0;
  while (replayData[i].second < time) {
    if (i > 0) { 
      var previousScore = replayData[i - 1].score;
      var currentScore = replayData[i].score;
      if (currentScore > previousScore) {
          positiveScore += currentScore - previousScore;
      } else if (currentScore < previousScore) {
          negativeScore += previousScore - currentScore;
      }
  }
    i++;
  }
  var displayText = "+" + positiveScore + " " + "-" + negativeScore;
  $("#click-display").text(displayText);
  replayDataIndex = i;
}

function checkCurrentTime(time) {
  getScoreAtSecond(time);
  seekMarker = player.getCurrentTime();
}

// calls view timer function if the user wants to view scores 
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING && isReplayMode) {
    wasPaused = false;
    console.log("yt state player");
    selectJudge();
    seekMarker = player.getCurrentTime();
    // identify what this is for
    // maybe move this outside of if else since it should always check? but only for replay mode tho
    // replayInterval = setInterval(checkCurrentTime, 10);
    replayTimer();
  } else if (event.data == YT.PlayerState.PAUSED) {
    wasPaused = true;
    pauseTimer();
  } else if (event.data == YT.PlayerState.CUED) {
    wasPaused = true;
  } 
  else if (isReplayMode) {

  }

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
      "+" + String(positiveScore) + " " + "-" + String(negativeScore),
    ]);
  }
  dataAnalysis();
  return displayData;
}

function viewAdd(list) {
  //this is breaking at end, maybe due to player
  viewSeconds = Number(player.getCurrentTime().toFixed(1));
  if (Math.abs(viewSeconds - list[replayDataIndex].second) <= 0.25) {
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
  else {
    // can prob put in function
    var i = 0;
    while (list[i].second < viewSeconds) {
      i++;
    }
    replayDataIndex = i;
  }
  replayTimer();
}

// function to pause the timer
function pauseTimer() {
  clearTimeout(replayTimeout);
  isPaused = true;
}

// timeout function that starts the scan of youtube video time along with the score data
function replayTimer() {
  isPaused = false;
  if (isReplayMode) {
    replayTimeout = setTimeout(function () {
      viewAdd(replayData);
    }, 1);
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
  // generateTimeTicks(Math.floor(formattedExport[0][2]), Math.ceil(formattedExport[formattedExport.length-1][2]));
  appendClicks();
}

function dataAnalysis() {
  var maxSequenceScore = Number.NEGATIVE_INFINITY;
  var maxSequenceTime;
  var sequenceIndexStart;
  var sequenceIndexEnd;
  var i;
  var j;
  for (i=0; i < replayData.length; i++) {
    j = i;
    var sequenceScore = 0;
    while ( (replayData[j].second <= replayData[i].second + 10) && (j < replayData.length - 1) ) {
      sequenceScore += (replayData[j+1].score - replayData[j].score);
      if (sequenceScore > maxSequenceScore) {
        sequenceIndexStart = i;
        sequenceIndexEnd = j;
        maxSequenceScore = sequenceScore;
        maxSequenceTime = replayData[i].second;

      }
      j++; 
    }
  }
  console.log("Max Sequence", maxSequenceScore, maxSequenceTime, replayData[j].second, displayData[sequenceIndexStart][1], displayData[sequenceIndexEnd][1]);


}

