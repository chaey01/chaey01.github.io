let themes = [
  {bg: [210, 80, 20]}, // blue
  {bg: [100, 70, 40]}, // green
  {bg: [300, 60, 50]}, // Cosmos
  {bg: [15,  80, 30]}, // Sunset
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100); // Set color mode to HSB
  background(themes[0].bg[0], themes[0].bg[1], themes[0].bg[2]);
}

function draw() {
  // 1. 자동 배경 전환 계산 (frameCount와 ler프 활용)
  let transitionSpeed = 0.003; // 값이 작을수록 느리고 부드럽게 전환됩니다.
  let progress = (frameCount * transitionSpeed) % themes.length;
  let idx1 = floor(progress);
  let idx2 = (idx1 + 1) % themes.length;
  let t = progress - idx1; // 0과 1 사이의 보간 값

  // 현재 테마와 다음 테마 색상 가져오기
  let c1 = themes[idx1].bg;
  let c2 = themes[idx2].bg;

  // HSB 값을 부드럽게 보간(lerp)
  let currentH = lerp(c1[0], c2[0], t);
  let currentS = lerp(c1[1], c2[1], t);
  let currentB = lerp(c1[2], c2[2], t);

  // 2. Trail 효과: 변화하는 배경색을 기준으로 잔상 적용
  fill(currentH, currentS, currentB, 0.05); // 5% (0.05) 투명도
  rect(0, 0, width, height); // Cover the entire canvas

  // 3. Calculate mouse speed
  let speed = dist(pmouseX, pmouseY, mouseX, mouseY);

  // 4. Rainbow gradient fill based on frameCount and speed 
  let hueVal = (frameCount + speed * 2) % 360;
  fill(hueVal, 80, 90, 0.5); // HSB, 50% opacity
  noStroke();
  
  // 5. Radius based on speed (faster mouse -> larger shapes)
  let radius = map(speed, 0, 100, 5, 80);

  // 6. Draw glowing, gradient-filled circle trails
  circle(mouseX, mouseY, radius);
}

// 창 크기가 변할 때 화면 맞춤
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}