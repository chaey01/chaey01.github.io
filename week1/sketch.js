let themes = [
  {bg: [210, 80, 20]}, // blue
  {bg: [100, 70, 40]}, // green
  {bg: [300, 60, 50]}, // Cosmos
  {bg: [15,  80, 30]}, // Sunset
];

// 캔버스 크기: 항상 브라우저 창 전체
function canvasSize() {
  return [windowWidth, windowHeight];
}

function setup() {
  const size = canvasSize();
  const c = createCanvas(size[0], size[1]);
  if (!window.previewMode) c.parent("sketch");

  colorMode(HSB, 360, 100, 100);
  background(themes[0].bg[0], themes[0].bg[1], themes[0].bg[2]);
}

// 브라우저 창 크기를 바꾸면 캔버스도 따라 바뀌어요
function windowResized() {
  const size = canvasSize();
  resizeCanvas(size[0], size[1]);
  background(themes[0].bg[0], themes[0].bg[1], themes[0].bg[2]);
}

function draw() {
  // 1. 배경색이 자동으로 바뀌기
  let transitionSpeed = 0.012;
  let progress = (frameCount * transitionSpeed) % themes.length;
  let idx1 = floor(progress);
  let idx2 = (idx1 + 1) % themes.length;
  let t = progress - idx1;

  let c1 = themes[idx1].bg;
  let c2 = themes[idx2].bg;

  let currentH = lerp(c1[0], c2[0], t);
  let currentS = lerp(c1[1], c2[1], t);
  let currentB = lerp(c1[2], c2[2], t);

  // 2. 잔상 효과
  fill(currentH, currentS, currentB, 0.05);
  rect(0, 0, width, height);

  // 3. 마우스 속도
  let speed = dist(pmouseX, pmouseY, mouseX, mouseY);

  // 4. 무지개 색
  let hueVal = (frameCount + speed * 2) % 360;
  fill(hueVal, 80, 90, 0.5);
  noStroke();

  // 5. 빠를수록 큰 원
  let radius = map(speed, 0, 100, 5, 80);

  // 6. 원 그리기
  circle(mouseX, mouseY, radius);
}