let song;
var data = [];
var frame = 0;
var frameData = [];
var actualFrames = [];
var strin;
var string;
var frameList = [];
var interval;
var savedFrames;
let ascii = document.getElementById("ascii");
let load = document.getElementById("load2");
let loadTwo = document.getElementById("load1");
document.getElementById("one").value = "+";
document.getElementById("two").value = "&";
document.getElementById("start").style.display = "none";
function fix(string) {
  let splitStuff = string.split("m");
  let smol = [];
  for (let i = 0; i < splitStuff.length; i++) {
    smol.push(splitStuff[i].split(","));
  }
  //console.log(smol[0][0]);
  for (let i = 0; i < smol.length; i++) {
    if (i > 0) {
      smol[i].shift();
    } else if (i < 1) {
      smol[0][0] = 0;
    }
    for (j = 0; j < smol[i].length; j++) {
      smol[i][j] = parseInt(smol[i][j]);
    }
  }
  return smol;
}
async function setup() {
  song = document.querySelector("audio");
  strin = await loadStrings("data.txt");
  noLoop();
  //song.play();
  //console.log(strin);
  data = fix(strin[0]);
  loadFrames();
  //console.log(data);
}
function animate() {
  //fps code from https://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
  requestAnimationFrame(animate);

  // calc elapsed time since last loop

  now = Date.now();
  elapsed = now - then;

  // if enough time has elapsed, draw the next frame

  if (elapsed > fpsInterval) {
    // Get ready for next frame by setting then=now, but also adjust for your
    // specified fpsInterval not being a multiple of RAF's interval (16.7ms)
    then = now - (elapsed % fpsInterval);

    // Put your drawing code here

    //console.log(frameRate())
    if (frame == 1) {
      song.play();
    }
    if (frame != 2697) {
      ascii.innerHTML = savedFrames[Math.floor(frame)];
      frame++;
    }
  }
}
function loadFrames() {
  load.style.display = "block";
  loadTwo.style.display = "block";
  document.getElementById("start").style.opacity = "0%";
  setTimeout(() => {
    actualFrames = [];
    var one = document.getElementById("one").value;
    var two = document.getElementById("two").value;
    var tempFrame = "";
    for (j = 0; j < 2697; j++) {
      tempFrame = "";
      frameData = data[j];
      var x = 1;
      for (i = 1; i <= frameData.length; i += 2) {
        for (c = 0; c < frameData[i]; c++) {
          if (frameData[i - 1] == 255) {
            tempFrame += one;
          } else {
            tempFrame += two;
          }
          x++;
          if (x == 100) {
            x = 1;
            tempFrame += "<br>";
          }
        }
      }
      actualFrames.push(tempFrame);
    }
    document.getElementById("start").style.opacity = "100%";
    document.getElementById("start").style.display = "";
    if (checkWidth(one) == checkWidth(two)) {
      document.getElementById("warning").style.display = "none";
      document.getElementById("start").style.margin = "10px";
      ascii.style.letterSpacing = 11.195571899414062 / 2 + "px";
    } else {
      document.getElementById("start").style.margin = "auto";
      document.getElementById("warning").style.display = "";
    }
    load.style.display = "none";
    loadTwo.style.display = "none";
  }, 100);
}
function checkWidth(txt) {
  let canvas =
    checkWidth.canvas || (checkWidth.canvas = document.createElement("canvas"));
  let context = canvas.getContext("2d");
  context.font = "14pt monospace";
  let metrics = context.measureText(txt);
  return metrics.width;
}

function go() {
  savedFrames = actualFrames;
  frame = 0;
  var tempFrame;
  song.pause();
  song.currentTime = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      tempFrame = frame;
      song.pause();
    } else {
      frame = tempFrame;
      song.play();
    }
  });
  startAnimating(12.4);
}
//fps code from https://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
var stop = false;
var fps, fpsInterval, startTime, now, then, elapsed;

function startAnimating(fps) {
  fpsInterval = 1000 / fps;
  then = Date.now();
  startTime = then;
  animate();
}
