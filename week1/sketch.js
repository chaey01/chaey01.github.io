let themes = [
  {bg: [210, 80, 20]}, // blue
  {bg: [100, 70, 40]}, // green
  {bg: [300, 60, 50]}, // Cosmos
  {bg: [15,  80, 30]}, // Sunset
];

// 캔버스 크기 정하기
function canvasSize() {
  // 홈 썸네일(preview.html)에서는 썸네일 칸에 꽉 차게
  if (window.previewMode) return [windowWidth, windowHeight];
  // Week 페이지에서는 가로 꽉 차게, 세로는 화면의 70%
  const w = document.documentElement.clientWidth;
  return [w, round(windowHeight * HEIGHT_RATIO)];
}

function setup() {
// 캔버스 크기: 항상 브라우저 창 전체
function canvasSize() {
  return [windowWidth, windowHeight];
}

// 브라우저 창 크기를 바꾸면 캔버스도 따라 바뀌어요
function windowResized() {
  const [w, h] = canvasSize();
  resizeCanvas(w, h);
  background(themes[0].bg[0], themes[0].bg[1], themes[0].bg[2]);
}

function draw() {
  // 1. Calculate automatic background transition using lerp
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

  // 2. Trail effect
  fill(currentH, currentS, currentB, 0.05);
  rect(0, 0, width, height);

  // 3. Mouse speed
  let speed = dist(pmouseX, pmouseY, mouseX, mouseY);

  // 4. Rainbow fill
  let hueVal = (frameCount + speed * 2) % 360;
  fill(hueVal, 80, 90, 0.5);
  noStroke();

  // 5. Radius based on speed
  let radius = map(speed, 0, 100, 5, 80);

  // 6. Circle trails
  circle(mouseX, mouseY, radius);
}
