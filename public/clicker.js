var viewSeconds = 0;
var judgeEntry = [];
var clickList = [];
var graphB = [];
var graphC = [];
var graphD = [];
var judgeName = "";
var otherJudgeData = "";
var yt_link = "";
var ct;
var vt;
var positive = 0;
var negative = 0;
var player;
var singleClick = 0;
var doubleClick = 0;
var graphReady = false;
var isFlash = false;
var isViewerMode = false;
var viewIncrement = 0;
var selectedJudgeIndex = 0;
var selectedClicks = [];
var judgePick;
var posKey = 75;
var negKey = 74;
var doubleKey = 50;
var submitKey = 48;
var submitBool = false;
var done = false;
var splitByJudge = [];

//loads freestyle video into the iframe
function loadVideo() {
  document.getElementById("video").innerHTML = "<div id='player'></div>";
  var tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function onYouTubeIframeAPIReady() {
  yt_link = chopLink(yt_link);
  player = new YT.Player("player", {
    width: 1280,
    height: 720,
    videoId: yt_link,
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

//video play functions
function onPlayerReady(event) {
  event.target.pauseVideo();
  if (isViewerMode) {
    selectedJudgeIndex = judgePick.selectedIndex;
    const judgeSplitAsArray = Object.values(splitByJudge);
    selectedClicks = judgeSplitAsArray[selectedJudgeIndex];
  }
}

function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING && !done) {
    if (isViewerMode) {
      viewTimer(selectedClicks);
    }
    done = true;
  }
}

//css functions to hide unecessary features on page opening as well as formatting based on link parameters
$(document).ready(function () {
  let myurl = new URL(window.location.href);
  $("#flash-option").hide();
  $("#input-assign").hide();
  $("#judge-select").hide();
  $("#scoring").hide();
  $("#positive-key").on("keydown", function (pos_e) {
    posKey = pos_e.keyCode;
  });
  $("#negative-key").on("keydown", function (neg_e) {
    negKey = neg_e.keyCode;
  });
  $("#double-key").on("keydown", function (double_e) {
    doubleKey = double_e.keyCode;
  });
  $("#submit-key").on("keydown", function (submit_e) {
    submitKey = submit_e.keyCode;
  });
  if (myurl.searchParams.has("link")) {
    $("#yt-link").val("https://youtu.be/" + myurl.searchParams.get("link"));
    yt_link = "https://youtu.be/" + myurl.searchParams.get("link");
  } else if (myurl.searchParams.has("name")) {
    $("#judge-name").val(myurl.searchParams.get("name"));
  }
});

//key click functions
$("html").on("keydown", function (event) {
  if (event.which == negKey && player.getPlayerState() == 1) {
    negative += 1;
    raw = positive - negative;
    seconds = Math.floor(player.getCurrentTime());
    clickList.push([seconds, raw]);
    $("#click-display").text(
      "+" + String(positive) + " " + "-" + String(negative)
    );
    if (isFlash == true) {
      changeColors("neg");
    }
  } else if (event.which == posKey && player.getPlayerState() == 1) {
    submitBool = true;
    singleClick += 1;
    positive += 1;
    raw = positive - negative;
    seconds = Math.floor(player.getCurrentTime());
    clickList.push([seconds, raw]);
    $("#click-display").text(
      "+" + String(positive) + " " + "-" + String(negative)
    );
    if (isFlash == true) {
      changeColors("pos");
    }
  } else if (event.which == doubleKey && player.getPlayerState() == 1) {
    doubleClick += 1;
    positive += 2;
    raw = positive - negative;
    seconds = Math.floor(player.getCurrentTime());
    clickList.push([seconds, raw]);
    $("#click-display").text(
      "+" + String(positive) + " " + "-" + String(negative)
    );
    if (isFlash == true) {
      changeColors("dub");
    }
  } else if (event.which == submitKey && submitBool == true) {
    isViewerMode = false;
    player.stopVideo();
    clearTimeout(ct);
    var confirmTimeout = setTimeout(openSave, 500);
    $("#query-link").html(
      "http://scalescollective.com/clicker/" + "?link=" + yt_link
    );
  }
});

//changing the colors upon clicker value
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
  var colorFlash = setTimeout("change()", 200);
}

//resets the css around the player in between clicks
function change() {
  $("#player").css({
    "border-color": "#635F56",
    "border-width": "5px",
    "border-style": "solid",
    "border-radius": "10px",
  });
}

function viewAdd(list) {
  viewSeconds = Math.floor(player.getCurrentTime());
  while (viewSeconds == list[viewIncrement].second) {
    if (viewIncrement == 0) {
      if (list[viewIncrement].score == 1) {
        positive = 1;
        negative = 0;
        $("#click-display").text(
          "+" + String(positive) + " " + "-" + String(negative)
        );
        viewIncrement += 1;
        if (isFlash) {
          changeColors("pos");
        }
      } else if (list[viewIncrement].score == 2) {
        positive = 2;
        negative = 0;
        $("#click-display").text(
          "+" + String(positive) + " " + "-" + String(negative)
        );
        viewIncrement += 1;
        if (isFlash) {
          changeColors("dub");
        }
      } else if (list[viewIncrement].score == -1) {
        positive = 0;
        negative = 1;
        $("#click-display").text(
          "+" + String(positive) + " " + "-" + String(negative)
        );
        viewIncrement += 1;
        if (isFlash) {
          changeColors("neg");
        }
      }
    } else {
      if (list[viewIncrement].score == list[viewIncrement - 1].score + 1) {
        positive++;
        $("#click-display").text(
          "+" + String(positive) + " " + "-" + String(negative)
        );
        viewIncrement += 1;
        if (isFlash) {
          changeColors("pos");
        }
      } else if (list[viewIncrement].score == list[viewIncrement - 1].score - 1) {
        negative++;
        $("#click-display").text(
          "+" + String(positive) + " " + "-" + String(negative)
        );
        viewIncrement += 1;
        if (isFlash) {
          changeColors("neg");
        }
      } else if (list[viewIncrement].score == list[viewIncrement - 1].score + 2) {
        positive = positive + 2;
        $("#click-display").text(
          "+" + String(positive) + " " + "-" + String(negative)
        );
        viewIncrement += 1;
        if (isFlash) {
          changeColors("dub");
        }
      }
    }
  }
  viewTimer(list);
}

function viewTimer(list) {
  vt = setTimeout(viewAdd, 1000, list);
}

function openFlash() {
  document.getElementById("flash-prompt").style.display = "block";
}

function closeFlash(response) {
  document.getElementById("flash-prompt").style.display = "none";
  if (response) {
    isFlash = true;
  } else {
    isFlash = false;
  }
}

function openSave() {
  document.getElementById("save-prompt").style.display = "block";
}

function closeSave(response) {
  document.getElementById("save-prompt").style.display = "none";
  if (response) {
    $("#post-data").show();
    formatList();
    showChart(clickList, graphB);
  } else {
    location.assign(
      "http://scalescollective.com/clicker/" +
        "?link=" +
        yt_link +
        "&name=" +
        judgeName
    );
    var refreshTimeout = setTimeout(saveData, 500);
  }
}

function openHowto() {
  document.getElementById("instructions").style.display = "block";
}

function closeHowto() {
  document.getElementById("instructions").style.display = "none";
}

//initializing the information based on input values
function saveData() {
  openFlash();
  yt_link = $("#yt-link").val();
  yt_link = chopLink(yt_link);
  $("#input-assign").show();
  $("#scoring").show();
  judgeName = $("#judge-name").val();
  getLinks(yt_link)
    .then((result) => {
      splitByJudge = result.reduce((acc, obj) => {
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

function createDropdown(options) {
  judgePick = document.getElementById("judge-pick");
  const judgeNames = Object.keys(options);
  for (const judge of judgeNames) {
    var option = document.createElement("option");
    option.text = judge;
    judgePick.add(option);
  }
  $("#judge-pick").show();
}

function createGraph(options) {
  google.charts.setOnLoadCallback(drawChart(options));
}

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

  // Custom function to handle point clicks
  function videoSeek(time) {
    player.seekTo(time);
  }
}

//function that looks up other judges' scores for a freestyle video
function getScores() {
  openFlash();
  isViewerMode = true;
  $("#judge-select").show();
  $("#scoring").show();
  yt_link = $("#yt-link").val();
  yt_link = chopLink(yt_link);
  getLinks(yt_link)
    .then((result) => {
      splitByJudge = result.reduce((acc, obj) => {
        const { judge, second, score } = obj;
        const rest = { second, score };

        acc[judge] = acc[judge] || [];
        acc[judge].push(rest);

        return acc;
      }, {});
      createDropdown(splitByJudge);
      createGraph(splitByJudge);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
  setTimeout(function () {
    loadVideo();
    if (graphReady == false) {
      // alert("Nobody has scored this routine.");
    } else {
      // showChart(clickList, graphB);
    }
  }, 1500);
}

//creates list for the judge's values for the freestyle they judged
function formatList() {
  for (var i = 0; i < clickList.length; i++) {
    judgeEntry.push([judgeName, yt_link, clickList[i][0], clickList[i][1]]);
  }
  fetch("http://localhost:3000/appendClicks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dataArray: judgeEntry }),
  })
    .then((response) => response.json())
    .then((data) => {
      return data;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

//searches db for freestyle link to see if other judges scored it
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
      throw error; // Re-throw the error if needed
    });
}

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
  if (link.includes("&si")) {
    link = link.slice(0, link.indexOf("&"));
  }
  if (link.includes("&ab")) {
    link = link.slice(0, link.indexOf("&"));
  }

  return link;
}
