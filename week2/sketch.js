// ========================================
// Week 2: Specters of the Web — 404 Bubbles
//
// 비눗방울들이 모여 "404"를 만들어요.
// 방울은 유리처럼 투명하고, 가장자리에 무지갯빛이 일렁여요.
// - 방울 색은 페이지 배경의 빛 색을 따라 천천히 바뀌어요.
// - 마우스를 가까이 대면: 방울들이 살짝 흩어지고 더 자주 반짝여요.
// - 클릭하면: 방울이 톡 터졌다가, 잠시 뒤 제자리에서 다시 부풀어 올라요.
// ========================================

// ---- 조절하기 좋은 값들 ----
const TEXT = "404";            // 만들 글자 (4와 0만 모양이 준비되어 있어요)
const CHANGE_SPEED = 0.012;    // 조각이 다른 아이콘으로 바뀌는 확률 (클수록 자주)
const PUSH_RANGE = 140;        // 마우스가 이 거리(px) 안에 오면 조각이 흩어져요
const PUSH_POWER = 18;         // 흩어지는 거리(px)
const STRAY = 10;              // 글자 밖에 흩어져 있는 떠돌이 조각 수
const GAP = 0.0;               // 조각 사이 틈 (조각 크기 대비)

// 조각 바탕색 (사이트 배경의 푸른·보라 빛과 어울리게)
const COLORS = [
  "#2f4bff", "#5b6cff", "#1d1d22",               // 파랑이 많고 검정은 조금
  "#2f4bff", "#5b6cff", "#8b5cf6",              // 파랑·보라
  "#22c55e", "#ff6b4a", "#ff9ad5", "#ffd23f",
  "#e9eaf2",                                    // 밝은 회색 (조금만)
];
// 기호 색: 어두운 바탕에는 밝은 색, 밝은 바탕에는 어두운 색
const LIGHT_INK = ["#ffffff", "#ffffff", "#ffd23f", "#9ef0b8", "#ffc2e6", "#aeb8ff"];
const DARK_INK = ["#111111", "#111111", "#2f4bff", "#8b5cf6"];
const LIGHT_BG = ["#ffd23f", "#ff9ad5", "#e9eaf2", "#22c55e"];

// 조각 위에 올라가는 기호들 (사라진 사이트의 파비콘 느낌)
const GLYPHS = ["H", "A", "M", "G", "y!", "@", "#", "{ }", "▶", "✕", "◐", "♥", "☺", "⌘", "?", "★", "~", "://", "■", "●", "▲", ":)", "</>", "§"];

// 4와 0의 모양 (5칸 × 7줄, # 자리에 조각이 놓여요)
const DIGITS = {
  "4": [
    "...#.",
    "..##.",
    ".#.#.",
    "#..#.",
    "#####",
    "...#.",
    "...#.",
  ],
  "0": [
    ".###.",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    ".###.",
  ],
};

let tiles = [];
let cell = 40;           // 조각 한 칸 크기(px) — 화면 크기에 맞춰 자동으로 정해져요
let blasts = [];         // 클릭으로 생긴 폭발들


function setup() {
  const c = createCanvas(windowWidth, windowHeight);
  pixelDensity(min(2, displayDensity()));
  if (!window.previewMode && document.getElementById("sketch")) c.parent("sketch");
  build();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  build();
}


// 화면 크기에 맞춰 404 조각들 배치하기
function build() {
  tiles = [];
  const cols = TEXT.length * 5 + (TEXT.length - 1) * 1.6;    // 글자 사이 1.6칸 띄우기
  const fw = window.previewMode ? 0.9 : 0.7;    // 썸네일에서는 화면을 더 크게 채워요
  const fh = window.previewMode ? 0.66 : 0.48;
  cell = min((width * fw) / cols, (height * fh) / 7);
  const totalW = cols * cell;
  const ox = (width - totalW) / 2;
  const oy = height * (window.previewMode ? 0.5 : 0.46) - (7 * cell) / 2;

  for (let n = 0; n < TEXT.length; n++) {
    const shape = DIGITS[TEXT[n]];
    if (!shape) continue;
    const gx = ox + n * (5 + 1.6) * cell;
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 5; c++) {
        if (shape[r][c] !== "#") continue;
        tiles.push(makeTile(gx + c * cell, oy + r * cell, false));
      }
    }
  }

  // 글자 밖 떠돌이 조각들 (404에서 떨어져 나온 듯이)
  for (let i = 0; i < STRAY; i++) {
    const t = random(tiles);
    tiles.push(makeTile(t.hx + random(-2.5, 2.5) * cell, t.hy + random(-2.5, 2.5) * cell, true));
  }
}

function makeTile(x, y, stray) {
  const t = {
    hx: x, hy: y,                     // 원래 자리
    x: x, y: y,                       // 지금 자리
    vx: 0, vy: 0,
    jx: random() < 0.12 ? random(-0.15, 0.15) * cell : 0,   // 살짝 어긋난 조각들
    jy: random() < 0.12 ? random(-0.15, 0.15) * cell : 0,
    s: stray ? random(0.4, 0.7) : (random() < 0.1 ? random(0.65, 0.85) : 1),  // 크기
    stray: stray,
    empty: !stray && random() < 0.03,  // 가끔 비어 있는(깨진) 조각
  };
  shuffleLook(t);
  return t;
}

// 조각의 모양(아이콘)을 새로 정하기
function shuffleLook(t) {
  t.pi = floor(random(3));        // 배경 빛 3가지 중 어떤 색을 쓸지
  t.light = random(0, 0.45);      // 흰색을 얼마나 섞을지 (클수록 연하게)
  t.flash = 1;                    // 바뀌는 순간 반짝
}


function draw() {
  clear();   // 배경은 페이지(흰 바탕 + 빛)가 보이게 투명하게
  if (frameCount % 6 === 1) updatePalette();   // 배경 빛 색 따라가기

  // 마우스 (썸네일에서는 가짜 커서가 천천히 돌아다녀요)
  let mx = mouseX, my = mouseY;
  if (window.previewMode) {
    const tt = frameCount * 0.015;
    mx = width * (0.5 + 0.3 * sin(tt * 1.2));
    my = height * (0.5 + 0.18 * sin(tt * 0.8 + 1));
    // 가끔 커서 근처 방울 하나가 저절로 톡
    if (frameCount % 90 === 0) popAt(mx, my, true);
  }

  // 폭발 효과 줄이기
  for (const b of blasts) b.life -= 0.02;
  blasts = blasts.filter((b) => b.life > 0);

  const k = window.previewMode ? 0.4 : 1;

  for (const t of tiles) {
    // 1) 마우스가 가까우면 바깥으로 살짝 밀리기
    let tx = t.hx + t.jx, ty = t.hy + t.jy;
    const dx = t.hx + cell / 2 - mx;
    const dy = t.hy + cell / 2 - my;
    const d = max(1, sqrt(dx * dx + dy * dy));
    const near = constrain(1 - d / (PUSH_RANGE * k), 0, 1);
    tx += (dx / d) * PUSH_POWER * k * near * near;
    ty += (dy / d) * PUSH_POWER * k * near * near;

    // 2) 클릭 폭발: 튕겨 나가기
    for (const b of blasts) {
      const bx = t.hx - b.x, by = t.hy - b.y;
      const bd = max(1, sqrt(bx * bx + by * by));
      const f = b.life * b.life * max(0, 1 - bd / (cell * 6)) * cell * 4;
      tx += (bx / bd) * f;
      ty += (by / bd) * f;
    }

    // 스프링처럼 부드럽게 따라가기
    t.vx = (t.vx + (tx - t.x) * 0.12) * 0.72;
    t.vy = (t.vy + (ty - t.y) * 0.12) * 0.72;
    t.x += t.vx;
    t.y += t.vy;

    // 3) 가끔 반짝 (마우스 근처는 더 자주)
    if (random() < CHANGE_SPEED * (1 + near * 12)) shuffleLook(t);
    t.flash *= 0.85;

    if (t.empty) continue;

    // 4) 터지기 → 잠깐 사라졌다가 → 다시 부풀기
    if (t.popDelay > 0) {
      t.popDelay--;
      if (t.popDelay === 0) t.pop = 0.001;
    }
    if (t.pop > 0) {
      t.pop += 0.07;
      drawPop(t);
      if (t.pop >= 1) {
        t.pop = 0;
        t.hidden = true;
        t.respawnAt = millis() + random(1200, 2800);
      }
      continue;
    }
    if (t.hidden) {
      if (millis() < t.respawnAt) continue;
      t.hidden = false;
      t.grow = 0;
    }
    if (t.grow === undefined) t.grow = 1;
    t.grow = min(1, t.grow + 0.03);

    drawTile(t);
  }
}


// 비눗방울 조절 값
const BUBBLE_WOBBLE = 0.04;    // 방울이 말랑하게 숨 쉬는 정도
const RAINBOW_SPEED = 0.01;    // 가장자리 빛이 도는 속도
const BUBBLE_SIZE = 1.25;      // 방울 크기 (1이면 칸에 딱 맞게, 클수록 겹치며 커져요)

// 비눗방울 하나 그리기
function drawTile(t) {
  const ctx = drawingContext;
  const g0 = t.grow === undefined ? 1 : t.grow;
  const grow = g0 < 1 ? 1 + 2.2 * pow(g0 - 1, 3) + 1.2 * pow(g0 - 1, 2) : 1;   // 톡 부풀어 오르기
  const base = cell * (1 - GAP) * t.s * BUBBLE_SIZE * grow;
  if (base < 1) return;
  const cx = t.x + cell / 2;
  const cy = t.y + cell / 2;
  if (t.ph === undefined) t.ph = random(TWO_PI);

  // 말랑말랑: 가로·세로가 번갈아 살짝 늘었다 줄었다
  const wob = sin(frameCount * 0.04 + t.ph) * BUBBLE_WOBBLE;
  const rx = (base / 2) * (1 + wob);
  const ry = (base / 2) * (1 - wob);
  const r = max(rx, ry);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(rx / r, ry / r);

  // 이 방울의 색 (배경 빛 색 + 흰색 조금)
  const c = mixWhite(palette[t.pi], t.light);
  const c2 = mixWhite(palette[(t.pi + 1) % 3], 0.2);
  const c3 = mixWhite(palette[(t.pi + 2) % 3], 0.2);

  // 1) 방울 속: 가운데는 거의 투명, 가장자리로 갈수록 살짝 진하게 (유리 두께)
  let g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
  g.addColorStop(0, "rgba(255,255,255,0.05)");
  g.addColorStop(0.7, rgba(c, 0.1));
  g.addColorStop(1, rgba(c, 0.32));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // 2) 테두리: 배경 빛 색들이 천천히 돌아요
  const turn = frameCount * RAINBOW_SPEED + t.ph;
  if (ctx.createConicGradient) {
    const cg = ctx.createConicGradient(turn, 0, 0);
    cg.addColorStop(0.0, rgba(c, 0.85));
    cg.addColorStop(0.25, "rgba(255,255,255,0.75)");
    cg.addColorStop(0.5, rgba(c2, 0.8));
    cg.addColorStop(0.75, rgba(c3, 0.75));
    cg.addColorStop(1.0, rgba(c, 0.85));
    ctx.strokeStyle = cg;
  } else {
    ctx.strokeStyle = rgba(c, 0.7);
  }
  ctx.lineWidth = max(1, r * 0.09);
  ctx.beginPath();
  ctx.arc(0, 0, r - ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.stroke();

  // 4) 얇은 바깥 선 (유리 가장자리)
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = max(0.6, r * 0.025);
  ctx.beginPath();
  ctx.arc(0, 0, r - 0.5, 0, Math.PI * 2);
  ctx.stroke();

  // 5) 반사광: 왼쪽 위 큰 하이라이트 + 오른쪽 아래 작은 반사
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.38, -r * 0.42, r * 0.26, r * 0.12, -0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(r * 0.45, r * 0.42, r * 0.07, 0, Math.PI * 2);
  ctx.fill();

  // 6) 바뀌는 순간: 방울 전체가 하얗게 반짝
  if (t.flash > 0.05) {
    ctx.fillStyle = "rgba(255,255,255," + (0.6 * t.flash).toFixed(3) + ")";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ---- 배경 빛 색 따라가기 ----
// style.css의 --blob1~3 색을 읽고, 배경이 돌고 있는 색상 각도(hue-rotate)만큼 같이 돌려요.
let palette = [[130, 213, 255], [97, 160, 255], [147, 70, 235]];
let baseColors = null;
let bgEl = null;

function updatePalette() {
  if (!baseColors) {
    const css = getComputedStyle(document.documentElement);
    baseColors = ["--blob1", "--blob2", "--blob3"].map((v) => {
      const h = css.getPropertyValue(v).trim();
      return /^#[0-9a-f]{6}$/i.test(h) ? hexToArr(h) : null;
    });
    if (baseColors.some((x) => !x)) baseColors = palette.map((x) => x.slice());
    bgEl = document.querySelector(".bg");
  }
  // 지금 배경이 몇 도 돌아갔는지 (배경이 없으면 13초에 한 바퀴로 계산)
  let deg = ((millis() / 13000) * 360) % 360;
  if (bgEl) {
    const m = /hue-rotate\(([-\d.]+)deg\)/.exec(getComputedStyle(bgEl).filter);
    if (m) deg = parseFloat(m[1]);
  }
  palette = baseColors.map((c) => hueRotate(c, deg));
}

// CSS hue-rotate와 같은 계산
function hueRotate([r, g, b], deg) {
  const a = (deg * Math.PI) / 180, cs = Math.cos(a), sn = Math.sin(a);
  const m = [
    0.213 + cs * 0.787 - sn * 0.213, 0.715 - cs * 0.715 - sn * 0.715, 0.072 - cs * 0.072 + sn * 0.928,
    0.213 - cs * 0.213 + sn * 0.143, 0.715 + cs * 0.285 + sn * 0.140, 0.072 - cs * 0.072 - sn * 0.283,
    0.213 - cs * 0.213 - sn * 0.787, 0.715 - cs * 0.715 + sn * 0.715, 0.072 + cs * 0.928 + sn * 0.072,
  ];
  return [
    constrain(r * m[0] + g * m[1] + b * m[2], 0, 255),
    constrain(r * m[3] + g * m[4] + b * m[5], 0, 255),
    constrain(r * m[6] + g * m[7] + b * m[8], 0, 255),
  ];
}

function mixWhite(c, t) {
  return [c[0] + (255 - c[0]) * t, c[1] + (255 - c[1]) * t, c[2] + (255 - c[2]) * t];
}
function rgba(c, a) {
  return "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + a + ")";
}
function hexToArr(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}


// ---- 터지는 모습 ----
function drawPop(t) {
  const ctx = drawingContext;
  const p = t.pop;                                  // 0 → 1
  const r = (cell * (1 - GAP) * t.s * BUBBLE_SIZE) / 2;
  const cx = t.x + cell / 2, cy = t.y + cell / 2;
  const c = mixWhite(palette[t.pi], 0.2);
  const e = 1 - pow(1 - p, 3);                       // 빠르게 시작해서 느려지기

  ctx.save();
  ctx.translate(cx, cy);

  // 순간 하얀 번쩍
  if (p < 0.25) {
    ctx.fillStyle = "rgba(255,255,255," + (0.7 * (1 - p / 0.25)).toFixed(3) + ")";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 퍼져 나가며 사라지는 막
  ctx.strokeStyle = rgba(c, (0.8 * (1 - p)).toFixed(3));
  ctx.lineWidth = max(0.5, r * 0.08 * (1 - p));
  ctx.beginPath();
  ctx.arc(0, 0, r * (1 + e * 0.6), 0, Math.PI * 2);
  ctx.stroke();

  // 튀어 나가는 작은 물방울들
  for (let i = 0; i < 9; i++) {
    const a = t.ph + (i / 9) * Math.PI * 2;
    const dist = r * (1 + e * 1.3 + (i % 3) * 0.15);
    ctx.fillStyle = i % 2 ? "rgba(255,255,255," + (0.9 * (1 - p)).toFixed(3) + ")" : rgba(c, (0.9 * (1 - p)).toFixed(3));
    ctx.beginPath();
    ctx.arc(Math.cos(a) * dist, Math.sin(a) * dist + e * e * r * 0.4, max(0.5, r * 0.08 * (1 - p)), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// (x, y)에 있는 방울 터뜨리기. 옆 방울들도 살짝 늦게 연달아 톡톡
function popAt(x, y, onlyOne) {
  let hit = null, best = Infinity;
  for (const t of tiles) {
    if (t.empty || t.hidden || t.pop > 0 || t.popDelay > 0) continue;
    const d = dist(x, y, t.x + cell / 2, t.y + cell / 2);
    const r = (cell * t.s * BUBBLE_SIZE) / 2;
    if (d < max(r, onlyOne ? cell * 3 : r) && d < best) { best = d; hit = t; }
  }
  if (!hit) return false;
  hit.pop = 0.001;
  if (onlyOne) return true;
  for (const t of tiles) {
    if (t === hit || t.empty || t.hidden || t.pop > 0) continue;
    const d = dist(hit.x, hit.y, t.x, t.y);
    if (d < cell * 1.6 && random() < 0.6) t.popDelay = floor(map(d, 0, cell * 1.6, 3, 12));
  }
  return true;
}


// 클릭하면 방울이 톡 터져요 (빈 곳을 클릭하면 주변 방울이 살짝 밀려나요)
function mousePressed() {
  if (window.previewMode) return;
  if (!popAt(mouseX, mouseY, false)) blasts.push({ x: mouseX, y: mouseY, life: 0.6 });
}
