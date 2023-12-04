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
var aX = [];
var aY = [];
var bX = [];
var bY = [];
var cX = [];
var cY = [];
var dX = [];
var dY = [];
var eX = [];
var eY = [];
var judgePick;
var posKey = 75;
var negKey = 74;
var doubleKey = 50;
var submitKey = 48;
var submitBool = false;
var done = false;

// //google api functions
// function initClient() {
//   var API_KEY = "AIzaSyD-6YxG5mymcHxuw2_oa8FmUCzFas72sfk";
//   var CLIENT_ID =
//     "698696933761-acb051hpb6gj7t3aa03g95ed7ocln0le.apps.googleusercontent.com";
//   var SCOPE = "https://www.googleapis.com/auth/spreadsheets";
//   gapi.client
//     .init({
//       apiKey: API_KEY,
//       clientId: CLIENT_ID,
//       scope: SCOPE,
//       discoveryDocs: [
//         "https://sheets.googleapis.com/$discovery/rest?version=v4",
//       ],
//     })
//     .then(function () {
//       gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus);
//       updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
//     });
// }

// function handleClientLoad() {
//   gapi.load("client:auth2", initClient);
// }

// function updateSignInStatus(isSignedIn) {
//   if (isSignedIn) {
//     alert("You are signed in.");
//   }
// }
// function handleSignInClick(event) {
//   handleClientLoad();
//   gapi.auth2.getAuthInstance().signIn();
// }
// function handleSignOutClick(event) {
//   gapi.auth2.getAuthInstance().signOut();
// }

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
    if (selectedJudgeIndex == 0) {
      selectedClicks = [];
      for (var i = 0; i < bX.length; i++) {
        selectedClicks.push([bX[i], bY[i]]);
      }
    } else if (selectedJudgeIndex == 1) {
      selectedClicks = [];
      for (var i = 0; i < bX.length; i++) {
        selectedClicks.push([bX[i], bY[i]]);
      }
    } else if (selectedJudgeIndex == 2) {
      selectedClicks = [];
      for (var i = 0; i < cX.length; i++) {
        selectedClicks.push([cX[i], cY[i]]);
      }
    } else if (selectedJudgeIndex == 3) {
      selectedClicks = [];
      for (var i = 0; i < dX.length; i++) {
        selectedClicks.push([dX[i], dY[i]]);
      }
    } else if (selectedJudgeIndex == 4) {
      selectedClicks = [];
      for (var i = 0; i < eX.length; i++) {
        selectedClicks.push([eX[i], eY[i]]);
      }
    }
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
  // handleSignInClick();
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
  while (viewSeconds == list[viewIncrement][0]) {
    if (viewIncrement == 0) {
      if (list[viewIncrement][1] == 1) {
        positive = 1;
        negative = 0;
        $("#click-display").text(
          "+" + String(positive) + " " + "-" + String(negative)
        );
        viewIncrement += 1;
        if (isFlash) {
          changeColors("pos");
        }
      } else if (list[viewIncrement][1] == 2) {
        positive = 2;
        negative = 0;
        $("#click-display").text(
          "+" + String(positive) + " " + "-" + String(negative)
        );
        viewIncrement += 1;
        if (isFlash) {
          changeColors("dub");
        }
      } else if (list[viewIncrement][1] == -1) {
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
      if (list[viewIncrement][1] == list[viewIncrement - 1][1] + 1) {
        positive++;
        $("#click-display").text(
          "+" + String(positive) + " " + "-" + String(negative)
        );
        viewIncrement += 1;
        if (isFlash) {
          changeColors("pos");
        }
      } else if (list[viewIncrement][1] == list[viewIncrement - 1][1] - 1) {
        negative++;
        $("#click-display").text(
          "+" + String(positive) + " " + "-" + String(negative)
        );
        viewIncrement += 1;
        if (isFlash) {
          changeColors("neg");
        }
      } else if (list[viewIncrement][1] == list[viewIncrement - 1][1] + 2) {
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
  loadVideo();
  getLinks(yt_link)
    .then((result) => {
      const splitByJudge = result.reduce((acc, obj) => {
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
  console.log(scores);

  // Prepare data for the chart
  var data = new google.visualization.DataTable();
  data.addColumn("number", "Seconds");

  // Add columns for each user
  for (const judge in scores) {
    data.addColumn("number", judge);
  }

  // Find the maximum number of rows needed
  const maxRows = Math.max(...Object.values(scores).map((arr) => arr.length));

  // Add data rows
  for (let i = 0; i < maxRows; i++) {
    for (const user in scores) {
      const userData = scores[user];
      row = [userData[i].second];
      const scoreValue = i < userData.length ? userData[i].score : null;
      row.push(scoreValue);
      console.log(row);
    }
    data.addRow(row);
  }

  // Set chart options
  var options = {
    title: "Scores Over Time",
    titleTextStyle: {
      color: "#5bebaf",
    },
    backgroundColor: "#414141",
    colors: ["#5bebaf", "#285e48", "#728a80", "#2a453a", "#b6d1c6"],
    curveType: "function",
    fontName: "Courier",
    legend: { position: "top"},
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
  chart.draw(data, options);
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
      const splitByJudge = result.reduce((acc, obj) => {
        const { judge, second, score } = obj;
        const rest = { second, score };

        acc[judge] = acc[judge] || [];
        acc[judge].push(rest);

        return acc;
      }, {});
      console.log("splitbyjudge", splitByJudge);
      createDropdown(splitByJudge);
      createGraph(splitByJudge);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
  setTimeout(function () {
    loadVideo();
    if (graphReady == false) {
      alert("Nobody has scored this routine.");
    } else {
      //var graphTimer = setTimeout(function () { showChart(clickList, graphB); }, 500);
      showChart(clickList, graphB);
    }
  }, 1500);
}

//creates list for the judge's values for the freestyle they judged
function formatList() {
  for (var i = 0; i < clickList.length; i++) {
    judgeEntry.push([judgeName, yt_link, clickList[i][0], clickList[i][1]]);
  }
  console.log(judgeEntry);
  console.log(JSON.stringify(judgeEntry));
  fetch("http://localhost:3000/appendClicks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dataArray: judgeEntry }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("data", data);
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

//sets up list of other judge scores to match the format of the program
function loadOtherList(list) {
  graphReady = true;
  for (var i = 2; i < list.length; i++) {
    var data = [];
    data = list[i].split(",");
    data[0] = parseFloat(data[0]);
    data[1] = parseInt(data[1]);
    graphB.push([data[0], data[1]]);
  }
  graphB.push(list[0]);
  graphB.push(" ");
}

//adds judge's scores to db
function makeApiCall(list) {
  var params = {
    spreadsheetId: "1KrN4qEuSED2x3R_Y4dOSXoHYix6ccP3SBlMMsDxgLO0",
    range: "Sheet1!A1:FZ1000",
    valueInputOption: "RAW",
    insertDataOption: "OVERWRITE",
  };
  var valueRangeBody = {
    range: "Sheet1!A1:FZ1000",
    majorDimension: "ROWS",
    values: [list],
  };
  var request = gapi.client.sheets.spreadsheets.values.append(
    params,
    valueRangeBody
  );
  request.then(
    function (response) {},
    function (reason) {
      console.error("error: " + reason.result.error.message);
    }
  );
}

function showChart(listA, listB) {
  makeApiCall(judgeEntry);
  var breakpoint = 0;
  var judgeB = "";
  var judgeC = "";
  var judgeD = "";
  var judgeE = "";
  for (var i = 0; i < listB.length; i++) {
    if (listB[i] == " ") {
      breakpoint = i;
      judgeB = listB[i - 1];
      break;
    }
  }
  for (var a = 0; a < listA.length; a++) {
    aX.push(listA[a][0]);
    aY.push(listA[a][1]);
  }
  for (var b = 0; b < breakpoint; b++) {
    bX.push(listB[b][0]);
    bY.push(listB[b][1]);
  }
  breakpoint += 1;
  for (var c = breakpoint; c < listB.length; c++) {
    if (listB[c + 2] == " ") {
      breakpoint = c + 2;
      judgeC = listB[c + 1];
      break;
    } else {
      cX.push(listB[c][0]);
      cY.push(listB[c][1]);
    }
  }
  breakpoint += 1;
  for (var d = breakpoint; d < listB.length; d++) {
    if (listB[d + 2] == " ") {
      breakpoint = d + 2;
      judgeD = listB[d + 1];
      break;
    } else {
      dX.push(listB[d][0]);
      dY.push(listB[d][1]);
    }
  }
  breakpoint += 1;
  for (var e = breakpoint; e < listB.length; e++) {
    if (listB[e + 2] == " ") {
      breakpoint = e + 2;
      judgeE = listB[e + 1];
      break;
    } else {
      eX.push(listB[e][0]);
      eY.push(listB[e][1]);
    }
  }
  if (isViewerMode == true) {
    judgePick = document.getElementById("judge-pick");
    var loopIndex = 0;
    var judgeList = [judgeB, judgeC, judgeD, judgeE];
    while (loopIndex < judgeList.length) {
      if (judgeList[loopIndex] == "") {
        loopIndex += 1;
        continue;
      } else {
        var option = document.createElement("option");
        option.text = judgeList[loopIndex];
        judgePick.add(option);
        loopIndex += 1;
      }
    }
    $("#judge-pick").show();
  }
  var trace1 = {
    x: aX,
    y: aY,
    mode: "lines",
    name: judgeName,
  };
  var trace2 = {
    x: bX,
    y: bY,
    mode: "lines",
    name: judgeB,
  };
  var trace3 = {
    x: cX,
    y: cY,
    mode: "lines",
    name: judgeC,
  };
  var trace4 = {
    x: dX,
    y: dY,
    mode: "lines",
    name: judgeD,
  };
  var trace5 = {
    x: eX,
    y: eY,
    mode: "lines",
    name: judgeE,
  };
  var data = [trace1, trace2, trace3, trace4, trace5];
  var layout = {
    title: "Your Scores",
    xaxis: {
      title: "Time",
      showgrid: false,
      zeroline: false,
      nticks: 12,
      tickformat: ",d",
    },
    yaxis: {
      title: "Score",
      showline: false,
    },
  };
  Plotly.newPlot("chart", data, layout);
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
