// Kinetic Type and FaceMesh + 별 하늘 배경
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/0-introduction/patt-vira
// https://youtu.be/2h8VArJ3gnQ
// Subscribe to Patt Vira's channel! https://youtube.com/@PattVira

let center;
let angle = 0;
let dots = [];              // 퍼지는 별들
let size = 28;             // 별 사이 간격(px) — 키우면 별 수가 줄어 빨라져요
let fakeFace = [];         // 썸네일용 가짜 얼굴 점
let spread = 0;            // 얼굴 움직임으로 퍼진 정도 (0~1)
let lastFace = null;       // 지난 프레임 얼굴 위치 (움직임 계산용)
let headMove = 0;          // 이번 프레임에 얼굴이 움직인 거리

let video;
let faceMesh;
let faces = [];
let mouthX, mouthY;
let mouthW = 0;

// 카메라 영상 크기
const VW = 640;
const VH = 480;

// ========================================
// 별 하늘 조절 값
// ========================================
const SKY_COLOR = [5, 4, 10];     // 하늘 색 (R, G, B)

// 큰 별 색 (R, G, B) — 여기 숫자를 바꾸면 별 색이 바뀌어요
const STAR_BLUE   = [50, 70, 255];
const STAR_PINK   = [255, 160, 210];
const STAR_ORANGE = [255, 175, 120];
const STAR_WHITE  = [210, 220, 255];

// 작은 별(먼지) 색
const DUST_WHITE = [230, 230, 255];
const DUST_BLUE  = [130, 150, 255];
const DUST_RED   = [255, 170, 150];

const DUST = 1 / 170;       // 작은 별 밀도 (분모가 작을수록 빽빽)
const BRIGHT = 1 / 28000;   // 큰 별 밀도
const STAR_SIZE = 0.6;      // 큰 별 크기 배율 (1이면 원래 크기)
const TWINKLE = 0.25;       // 반짝임 정도 (0이면 안 반짝임)
const DRIFT = 0.12;         // 하늘 전체가 흘러가는 속도 (0이면 멈춤)
const WOBBLE = 1.5;         // 큰 별이 제자리에서 살랑이는 정도(px)

let skyLayer;     // 움직이지 않는 별들을 미리 그려 둔 그림
let brightStars = [];
let skyShift = 0; // 하늘이 흘러간 거리

function makeSky() {
  skyLayer = createGraphics(width, height);
  skyLayer.pixelDensity(1);
  const g = skyLayer;
  g.background(SKY_COLOR[0], SKY_COLOR[1], SKY_COLOR[2]);
  g.noStroke();

  // 은하수: 오른쪽 위에서 아래로 비스듬히 지나가는 희미한 띠
  const ax = width * 0.95, ay = -height * 0.05;
  const bx = width * 0.45, by = height * 1.05;
  for (let i = 0; i < 60; i++) {
    const t = random();
    const x = lerp(ax, bx, t) + randomGaussian() * width * 0.08;
    const y = lerp(ay, by, t) + randomGaussian() * height * 0.05;
    g.fill(55, 45, 90, 4);
    g.circle(x, y, random(width * 0.15, width * 0.35));
  }

  // 작은 별 먼지
  const total = floor(width * height * DUST);
  for (let i = 0; i < total; i++) {
    let x, y;
    if (random() < 0.45) {        // 일부는 은하수 띠 쪽에 몰리게
      const t = random();
      x = lerp(ax, bx, t) + randomGaussian() * width * 0.09;
      y = lerp(ay, by, t) + randomGaussian() * height * 0.06;
    } else {
      x = random(width);
      y = random(height);
    }
    dustDot(g, x, y);
  }

  // 별무리 (오른쪽 가운데의 빽빽한 덩어리)
  const cx = width * 0.77, cy = height * 0.44;
  for (let i = 0; i < 260; i++) {
    dustDot(g, cx + randomGaussian() * 22, cy + randomGaussian() * 18);
  }

  // 큰 별: 파랑이 대부분, 가끔 분홍·주황·흰색
  brightStars = [];
  const n = floor(width * height * BRIGHT);
  for (let i = 0; i < n; i++) {
    const pick = random();
    let c;
    if (pick < 0.62) c = STAR_BLUE;
    else if (pick < 0.78) c = STAR_PINK;
    else if (pick < 0.9) c = STAR_ORANGE;
    else c = STAR_WHITE;
    brightStars.push({
      x: random(width), y: random(height),
      r: (random() < 0.25 ? random(5, 8) : random(2.5, 4.5)) * STAR_SIZE,
      c: c,
      speed: random(0.01, 0.03), phase: random(TWO_PI),
      wob: random(0.003, 0.008),  // 살랑이는 속도
    });
  }
}

function dustDot(g, x, y) {
  const p = random();
  let c;
  if (p < 0.6) c = DUST_WHITE;
  else if (p < 0.85) c = DUST_BLUE;
  else c = DUST_RED;
  g.fill(c[0], c[1], c[2], random(40, 190));
  g.circle(x, y, random() < 0.92 ? random(0.5, 1.0) : random(1.1, 1.6));
}

function drawSky() {
  // 하늘 전체가 천천히 왼쪽으로 흘러가요 (끝에 닿으면 이어 붙여요)
  skyShift = (skyShift + DRIFT) % width;
  image(skyLayer, -skyShift, 0);
  image(skyLayer, width - skyShift, 0);

  noStroke();
  for (const s of brightStars) {
    const tw = 1 - TWINKLE + TWINKLE * (0.5 + 0.5 * sin(frameCount * s.speed + s.phase));
    const [r, g, b] = s.c;

    // 흘러가는 위치 + 제자리에서 살랑살랑
    let x = s.x - skyShift + sin(frameCount * s.wob + s.phase) * WOBBLE;
    if (x < -20) x += width;
    const y = s.y + cos(frameCount * s.wob * 0.8 + s.phase) * WOBBLE;

    // 바깥으로 부드럽게 번지는 빛
    for (let k = 6; k >= 1; k--) {
      fill(r, g, b, (14 + (6 - k) * 16) * tw);
      circle(x, y, s.r * (0.9 + k * 0.55));
    }
    fill(255, 255, 255, 235 * tw);
    circle(x, y, s.r * 0.55);   // 하얀 심
  }
}



// ========================================
// 얼굴 별 조절 값
// ========================================
const FACE_STAR_SIZE = 1.6;    // 얼굴 별 크기
const FACE_TWINKLE = 0.06;     // 얼굴 별 반짝이는 속도

// 별 하나 그리기: 번지는 빛 + 하얀 심
function drawStar(x, y, r, c, bright) {
  noStroke();
  fill(c[0], c[1], c[2], 30 * bright);
  circle(x, y, r * 4.5);
  fill(c[0], c[1], c[2], 90 * bright);
  circle(x, y, r * 2.4);
  fill(c[0], c[1], c[2], 220 * bright);
  circle(x, y, r * 1.4);
  fill(255, 255, 255, 240 * bright);
  circle(x, y, r * 0.6);
}

// 얼굴 점 i번을 별로 그리기 (점마다 색·크기·반짝임 타이밍이 달라요)
function faceStar(x, y, i) {
  const h = (i * 7919) % 100;   // 점마다 고정된 값 (0~99)
  let c;
  if (h < 60) c = STAR_BLUE;
  else if (h < 78) c = STAR_PINK;
  else if (h < 88) c = STAR_ORANGE;
  else c = STAR_WHITE;

  const r = FACE_STAR_SIZE * (0.6 + (h % 10) / 10);   // 크기도 조금씩 다르게
  const tw = 0.45 + 0.55 * (0.5 + 0.5 * sin(frameCount * FACE_TWINKLE + i * 1.7));
  drawStar(x, y, r, c, tw);
}

// 썸네일용: 얼굴 모양(타원)으로 별 흩어 놓기
function makeFakeFace() {
  fakeFace = [];
  const rx = min(width, height) * 0.22;
  const ry = rx * 1.3;
  for (let i = 0; i < 140; i++) {
    const a = random(TWO_PI);
    const rr = sqrt(random());
    fakeFace.push({ x: width / 2 + cos(a) * rr * rx, y: height * 0.5 + sin(a) * rr * ry });
  }
}

// 별 움직이기
// - 얼굴을 움직이면: 얼굴에서 멀어지는 쪽으로 퍼져요
// - 입을 벌리면: 화면 전체의 별이 입 속으로 소용돌이치며 흘러 들어가요
//   (먹힌 별은 화면 먼 곳에서 다시 생겨나서 끝없이 흘러 들어와요)
// - 입을 다물면: 별들이 제자리로 천천히 돌아가요
function drawDots() {
  // 썸네일처럼 작은 화면에서는 거리도 작게
  const k = window.previewMode ? min(width, height) / 600 : 1;
  const open = mouthW > OPEN_MOUTH;
  const far = max(width, height);

  for (const d of dots) {
    // 입을 다물었는데 먹힌 상태면: 제자리에서 다시 태어나요
    if (d.eaten && !open) {
      d.eaten = false;
      d.x = d.hx;
      d.y = d.hy;
      d.vx = d.vy = 0;
      d.alpha = 0;
    }
    d.alpha = min(1, d.alpha + 0.02);

    const mx = center.x - d.x;
    const my = center.y - d.y;
    const md = max(1, sqrt(mx * mx + my * my));
    let shrink = 1;

    if (open) {
      // 입 쪽으로 끌어당기는 힘: 가까울수록 세지만, 멀어도 0이 되지 않아요
      // → 화면 끝까지 경계 없이 다 같이 흘러 들어와요
      const pull = SUCK_POWER * k * (300 * k) / (md + 60 * k);
      const ux = mx / md;
      const uy = my / md;
      // 멀리서는 크게 휘감고, 입 가까이 올수록 곧장 빨려 들어가요
      const sw = SUCK_SWIRL * constrain((md - 40 * k) / (260 * k), 0, 1);
      d.vx += (ux - uy * sw) * pull;   // 안쪽 + 옆으로 → 소용돌이
      d.vy += (uy + ux * sw) * pull;

      // 옆으로 도는 속도는 조금씩 줄여서, 입 주위를 맴돌지 않고 결국 들어오게
      const vr = d.vx * ux + d.vy * uy;          // 입 쪽 속도
      const tx_ = d.vx - vr * ux;                // 옆으로 도는 속도
      const ty_ = d.vy - vr * uy;
      d.vx = ux * vr * 0.96 + tx_ * 0.9;
      d.vy = uy * vr * 0.96 + ty_ * 0.9;
      d.x += d.vx;
      d.y += d.vy;
      shrink = constrain(md / (70 * k), 0.15, 1);   // 입 가까이에서 작아지기

      // 입에 닿으면: 화면 먼 곳에서 다시 생겨나서 또 흘러 들어와요
      if (md < 10 * k) {
        let nx, ny;
        do {
          nx = random(-0.1, 1.1) * width;
          ny = random(-0.1, 1.1) * height;
        } while (dist(nx, ny, center.x, center.y) < far * 0.25);
        d.x = nx;
        d.y = ny;
        d.vx = d.vy = 0;
        d.alpha = 0;
        d.eaten = true;
      }
    } else {
      // 얼굴 움직임 → 바깥으로 퍼지기 (아니면 제자리로)
      const dx = d.hx - center.x;
      const dy = d.hy - center.y;
      const dist0 = max(1, sqrt(dx * dx + dy * dy));
      const near = exp(-dist0 / (SPREAD_RANGE * k));
      const push = spread * SPREAD_DIST * k * near;
      const a = atan2(dy, dx) + d.swirl * spread * near;
      const tx = d.hx + cos(a) * push;
      const ty = d.hy + sin(a) * push;
      d.vx *= 0.8;
      d.vy *= 0.8;
      d.x += (tx - d.x) * 0.06 + d.vx;
      d.y += (ty - d.y) * 0.06 + d.vy;
    }

    // 그리기
    const tw = 0.6 + 0.4 * sin(frameCount * 0.04 + d.phase);
    const speed = sqrt(d.vx * d.vx + d.vy * d.vy);
    const excite = open ? min(1, speed / 6) : spread;
    const glow = (0.35 + 0.65 * max(excite, tw * 0.5)) * d.alpha;
    const r = d.r * (1 + excite * 1.2) * shrink;
    const c = d.c;

    // 빠르게 흘러 들어갈 때 가느다란 꼬리
    if (TRAIL > 0 && speed > 1.5) {
      stroke(c[0], c[1], c[2], 55 * glow);
      strokeWeight(max(0.5, r * 0.45));
      line(d.x, d.y, d.x - d.vx * TRAIL, d.y - d.vy * TRAIL);
    }
    noStroke();
    fill(c[0], c[1], c[2], 70 * glow);
    circle(d.x, d.y, r * 3);
    fill(255, 255, 255, 230 * glow);
    circle(d.x, d.y, r);
  }
}

// 얼굴이 얼마나 움직였는지 재서, 퍼지는 정도(spread) 정하기
function updateHeadMove() {
  // 얼굴이 안 보이면: 움직임 0, 입도 다문 걸로
  if (!window.previewMode && faces.length === 0) {
    headMove = 0;
    lastFace = null;
    mouthW = 0;
  } else if (lastFace) {
    headMove = dist(center.x, center.y, lastFace.x, lastFace.y);
  }
  if (window.previewMode || faces.length > 0) lastFace = { x: center.x, y: center.y };

  const k = window.previewMode ? min(width, height) / 600 : 1;
  const target = constrain((headMove - MOVE_MIN * k) / (MOVE_FULL * k), 0, 1);
  spread += (target - spread) * (target > spread ? SPREAD_IN : SPREAD_OUT);
}

function preload() {
  // 홈 썸네일(preview.html)에서는 카메라·얼굴 인식을 쓰지 않아요
  if (window.previewMode) return;
  faceMesh = ml5.faceMesh({ maxFaces: 1, flipped: true });
}

function gotFaces(results) {
  faces = results;
}

function setup() {
  const c = createCanvas(windowWidth, windowHeight);
  pixelDensity(1);   // 레티나에서 4배로 그리지 않게 → 빨라져요
  if (document.getElementById("sketch")) c.parent("sketch");

  if (window.previewMode) {
    size = 13;          // 썸네일은 작으니까 별을 촘촘하게
    makeFakeFace();
  } else {
    video = createCapture(VIDEO, { flipped: true });
    video.size(VW, VH);
    video.hide();
    faceMesh.detectStart(video, gotFaces);
  }

  center = createVector(width / 2, height / 2);
  makeGrid();
  makeSky();
}

// ========================================
// 별 움직임 조절 값
// ========================================
// 얼굴을 움직이면: 별들이 바깥으로 퍼져요
const SPREAD_DIST = 220;     // 별이 밀려나는 거리(px)
const SPREAD_RANGE = 260;    // 얼굴에서 이 거리 안의 별들이 크게 반응해요
const MOVE_MIN = 2;          // 이보다 작은 흔들림은 무시 (얼굴 인식 떨림 방지)
const MOVE_FULL = 18;        // 한 프레임에 이만큼(px) 움직이면 최대로 퍼져요 (작을수록 예민)
const SPREAD_IN = 0.15;      // 퍼지는 속도
const SPREAD_OUT = 0.03;     // 다시 모이는 속도 (작을수록 느긋하게)

// 입을 벌리면: 별들이 입 속으로 빨려 들어가요
const OPEN_MOUTH = 25;       // 이만큼 입을 벌리면 빨아들이기 시작 (작을수록 예민)
const SUCK_POWER = 0.45;     // 빨아들이는 힘 (클수록 빨리 빨려 들어와요)
const SUCK_SWIRL = 0.8;      // 소용돌이 정도 (0이면 곧장, 1이면 크게 휘감으며)
const TRAIL = 1;           // 빨려 들어올 때 꼬리 길이 (0이면 꼬리 없음)

const DOT_SIZE = 1.2;        // 평소 별 크기

// 화면에 고르게 별 깔기
function makeGrid() {
  dots = [];
  for (let x = size / 2; x < width; x += size) {
    for (let y = size / 2; y < height; y += size) {
      const pick = random();
      let c;
      if (pick < 0.6) c = STAR_BLUE;
      else if (pick < 0.78) c = STAR_PINK;
      else if (pick < 0.88) c = STAR_ORANGE;
      else c = STAR_WHITE;
      dots.push({
        hx: x + random(-size * 0.5, size * 0.5),   // 원래 자리 (칸 안에서 아무 데나 → 줄 맞춤이 안 보이게)
        hy: y + random(-size * 0.5, size * 0.5),
        vx: 0, vy: 0,                              // 빨려 들어갈 때의 속도
        x: x, y: y,
        c: c,
        r: DOT_SIZE * random(0.6, 1.3) * (window.previewMode ? 0.55 : 1),
        phase: random(TWO_PI),
        swirl: random(-0.6, 0.6),                  // 퍼질 때 살짝 휘어 나가는 정도
        eaten: false,                              // 입 속으로 들어갔는지
        alpha: 1,                                  // 다시 나타날 때 서서히 밝아지게
      });
    }
  }
}

// 창 크기를 바꾸면 캔버스, 격자, 별 하늘 다시 만들기
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  makeGrid();
  makeSky();
  if (window.previewMode) makeFakeFace();
}

// 카메라(640×480) 좌표 → 화면 좌표
function toScreen(p) {
  const s = max(width / VW, height / VH);
  const ox = (width - VW * s) / 2;
  const oy = (height - VH * s) / 2;
  return { x: p.x * s + ox, y: p.y * s + oy };
}

function draw() {
  // 1) 별 하늘 배경
  drawSky();

  // 썸네일: 가짜 얼굴이 좌우로 움직이고, 가끔 입을 벌려요
  if (window.previewMode) {
    const sway = pow(sin(frameCount * 0.02), 3);      // 가운데서 빠르고 끝에서 느리게
    const ox = sway * width * 0.18;
    center.x = width / 2 + ox;
    center.y = height * 0.62;
    mouthW = cos(frameCount * 0.011) > 0.55 ? 40 : 0;
    for (let i = 0; i < fakeFace.length; i++) {
      faceStar(fakeFace[i].x + ox, fakeFace[i].y, i);
    }
  }

  // 2) 얼굴 인식
  if (faces.length > 0) {
    let keypoints = faces[0].keypoints;
    let mouthTop = keypoints[13];
    let mouthBottom = keypoints[14];

    // 입 벌린 정도 (카메라 기준 값)
    mouthW = mouthBottom.y - mouthTop.y;

    // 입 가운데를 화면 좌표로
    let m = toScreen({
      x: (mouthTop.x + mouthBottom.x) / 2,
      y: (mouthTop.y + mouthBottom.y) / 2,
    });
    mouthX = m.x;
    mouthY = m.y;
    center.x = mouthX;
    center.y = mouthY;

    // 얼굴 점들 → 반짝이는 별
    for (let i = 0; i < keypoints.length; i++) {
      let p = toScreen(keypoints[i]);
      faceStar(p.x, p.y, i);
    }
  }

  // 3) 입 위치: 조금 더 큰 별
  if (faces.length > 0 || window.previewMode) {
    drawStar(center.x, center.y, window.previewMode ? 2 : 4, STAR_WHITE, 1);
  }

  // 4) 별들: 얼굴 움직임이면 퍼지고, 입 벌림이면 빨려 들어가요
  updateHeadMove();
  drawDots();

  angle += 0.005;
}
