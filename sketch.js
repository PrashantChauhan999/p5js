let video;
let poseNet;
let poses = [];
let skeleton;

let url = new URL(window.location.href);
let params = new URLSearchParams(url.search);

let width = params.get("width") || 720;
let height = params.get("height") || 1080;
let enableSkeleton = params.get("enableSkeleton") || true;
let enableKeyPoints = params.get("enableKeyPoints") || true;
let color = params.get("color") || "255, 0, 255";
let mode = params.get("mode") || "multiple";
let score = params.get("score") || 0.2;
let isBackCamera = params.get("isBackCamera") || false;
let flipHorizontal = params.get("flipHorizontal") || false;
let RR = color.split(",")[0];
let GG = color.split(",")[1];
let BB = color.split(",")[2];

let isFullScreen = params.get("isFullScreen") || true;

let boundaryBox = {
  x: 100,
  y: 100,
  w: 500,
  h: 800,
};

function setup() {
  let canvasWidth = isFullScreen ? width : windowWidth;
  let canvasHeight = isFullScreen ? height : windowHeight;
  createCanvas(canvasWidth, canvasHeight);
  video = createCapture({
    audio: false,
    video: {
      facingMode: isBackCamera ? "environment" : "user",
      width: { ideal: canvasWidth },
      height: { ideal: canvasHeight },
      aspectRatio: { ideal: 16 / 9 },
      zoom: 1,
    },
  });
  video.size(canvasWidth, canvasHeight);

  poseNet = ml5.poseNet(video, mode, modelReady);
  poseNet.on("pose", function (results) {
    poses = results;
    window?.ReactNativeWebView?.postMessage(JSON.stringify(poses));
  });

  video.hide();
}

function windowResized() {
  let canvasWidth = isFullScreen ? width : windowWidth;
  let canvasHeight = isFullScreen ? height : windowHeight;
  resizeCanvas(canvasWidth, canvasHeight);
  video.size(canvasWidth, canvasHeight);
  if (isFullScreen) {
    document.getElementById("defaultCanvas0").style.height = "100vh";
    document.getElementById("defaultCanvas0").style.width = "100vw";
  }
}

function modelReady() {
  console.log("Model Ready");
  if (isFullScreen) {
    document.getElementById("defaultCanvas0").style.height = "100vh";
    document.getElementById("defaultCanvas0").style.width = "100vw";
  } else {
    console.log("Full visible in camera");
  }
}

function draw() {
  let canvasWidth = isFullScreen ? width : windowWidth;
  let canvasHeight = isFullScreen ? height : windowHeight;
  // if (flipHorizontal === "true") {
  translate(canvasWidth, 0);
  scale(-1, 1);
  // }
  image(video, 0, 0, canvasWidth, canvasHeight);

  let allInside = true;
  let allKeyPointsVisible = false;

  for (let i = 0; i < poses.length; i++) {
    const pose = poses[i].pose;
    let keypointsVisibleCount = 0;
    for (let j = 0; j < pose.keypoints.length; j++) {
      const keypoint = pose.keypoints[j];
      if (keypoint.score > score) {
        keypointsVisibleCount++;
        if (
          keypoint.position.x < boundaryBox.x ||
          keypoint.position.x > boundaryBox.x + boundaryBox.w ||
          keypoint.position.y < boundaryBox.y ||
          keypoint.position.y > boundaryBox.y + boundaryBox.h
        ) {
          allInside = false;
        }
      }
    }
    if (keypointsVisibleCount === 17) {
      allKeyPointsVisible = true;
    }
  }

  if (allInside) {
    stroke(117, 253, 113); // Green if all keypoints are inside
  } else {
    stroke(255, 0, 0); // Red if any keypoint is outside
  }
  noFill();
  rect(boundaryBox.x, boundaryBox.y, boundaryBox.w, boundaryBox.h);

  // Draw keypoints and skeleton only if all 17 keypoints are visible
  if (allKeyPointsVisible) {
    if (enableKeyPoints !== "false") drawKeypoints();
    if (enableSkeleton !== "false") drawSkeleton();
  }
}

function drawKeypoints() {
  for (let i = 0; i < poses.length; i++) {
    const pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      const keypoint = pose.keypoints[j];
      if (keypoint.score > score) {
        fill(RR, 0, 0);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }
}

function drawSkeleton() {
  for (let i = 0; i < poses.length; i++) {
    const skeleton = poses[i].skeleton;
    for (let j = 0; j < skeleton.length; j++) {
      const partA = skeleton[j][0];
      const partB = skeleton[j][1];
      stroke(RR, 0, 0);
      line(
        partA.position.x,
        partA.position.y,
        partB.position.x,
        partB.position.y
      );
    }
  }
}
