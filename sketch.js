
let video;
let hands;
let predictions = [];
let osc;
let reverb;
let trail;

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  osc = new p5.Oscillator('sawtooth');
  osc.start();
  osc.amp(0);
  reverb = new p5.Reverb();
  reverb.process(osc, 3, 2);

  trail = createGraphics(width, height);
  trail.clear();

  hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });
  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5
  });
  hands.onResults(onResults);

  const camera = new Camera(video.elt, {
    onFrame: async () => await hands.send({ image: video.elt }),
    width: width,
    height: height
  });
  camera.start();
}

function onResults(results) {
  predictions = results.multiHandLandmarks.map((landmarks, i) => {
    return {
      landmarks: landmarks,
      handedness: results.multiHandedness[i].label  // 'Left' or 'Right'
    };
  });
}

function draw() {
  background(0);
  image(video, 0, 0, width, height);
  image(trail, 0, 0);

  let amp = 0;
  let pitch = 400;

  if (predictions.length > 0) {
    for (let handData of predictions) {
      let hand = handData.landmarks;
      let isRight = handData.handedness === 'Right';

      drawStylizedHand(hand);

      let thumb = hand[4];
      let index = hand[8];
      let x1 = thumb.x * width;
      let y1 = thumb.y * height;
      let x2 = index.x * width;
      let y2 = index.y * height;
      let d = dist(x1, y1, x2, y2);

      let c = color(map(d, 0, 300, 255, 0), 100, map(d, 0, 300, 0, 255), 180);
      trail.stroke(c);
      trail.strokeWeight(2);
      trail.line(x1, y1, x2, y2);

      if (isRight) {
        amp = map(d, 0, 300, 1, 0, true);  // 右手の距離で音量
      } else {
        pitch = map(index.y, 0, 1, 1000, 200, true);  // 左手の高さで音程
      }
    }

    osc.freq(pitch);
    osc.amp(amp, 0.1);
  } else {
    osc.amp(0, 0.1);
  }

  trail.fill(0, 0, 0, 20);
  trail.noStroke();
  trail.rect(0, 0, width, height);
}

function drawStylizedHand(hand) {
  for (let pt of hand) {
    let x = pt.x * width;
    let y = pt.y * height;
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = color(0, 255, 255);
    fill(255, 100);
    noStroke();
    ellipse(x, y, 10);
    drawingContext.shadowBlur = 0;
  }
}
