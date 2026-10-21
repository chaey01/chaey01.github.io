/* ========================================
   GLASS CURSOR — 마우스를 따라다니는 작은 유리구슬

   인트로의 물방울처럼, 메인 화면에서도 작은 유리구슬이
   마우스를 살짝 늦게 따라다녀요.
   - 구슬 아래의 화면이 살짝 뿌옇고 맑게 비쳐 보여요.
   - 카드나 버튼 위에 올라가면 구슬이 커져요.
   - 클릭하면 말랑하게 눌렸다 돌아와요.
   - 커서에서 작은 방울들이 보글보글 위로 떠올라요.
   - 휴대폰(터치 화면)이나 '동작 줄이기' 설정에서는 나타나지 않아요.
======================================== */

(function () {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // ---- 조절하기 좋은 값들 ----
  const SIZE = 12;          // 평소 구슬 크기(px)
  const HOVER_SIZE = 18;    // 카드·버튼 위에서의 크기(px)
  const FOLLOW = 0.58;      // 따라오는 속도 (1이면 바로, 작을수록 느긋하게)
  const HOVER_TARGETS = "a, button, .week";   // 이 위에 올라가면 커져요

  // 보글보글 올라가는 방울
  const BUBBLE_GAP = 36;      // 마우스가 이만큼(px) 움직일 때마다 방울 하나
  const BUBBLE_IDLE = 300;    // 가만히 있어도 이 시간(ms)마다 방울 하나 (0이면 안 나와요)
  const BUBBLE_MIN = 4;       // 작은 방울 크기(px)
  const BUBBLE_MAX = 8;      // 큰 방울 크기(px)
  const RISE = 0.9;           // 올라가는 속도
  const SPREAD = 10;          // 방울 무리가 커서 주변에 퍼지는 범위(px)
    const LIFE = 30;            // 방울이 사라지기까지 시간 (프레임, 60이 약 1초)
  const MAX_BUBBLES = 40;     // 화면에 동시에 있을 수 있는 방울 수

  const ball = document.createElement("div");
  ball.className = "glass-cursor";
  document.body.append(ball);

  let mx = -200, my = -200;   // 마우스 위치
  let x = mx, y = my;         // 구슬 위치
  let size = SIZE, targetSize = SIZE;
  let press = 1;              // 클릭할 때 눌리는 정도
  let shown = false;
  let lastSpawnX = 0, lastSpawnY = 0, lastSpawnT = 0;
  const bubbles = [];

  // 방울 하나 만들기
  function spawn() {
    if (bubbles.length >= MAX_BUBBLES) return;
    const el = document.createElement("div");
    el.className = "cursor-bubble";
    const size = BUBBLE_MIN + Math.random() * (BUBBLE_MAX - BUBBLE_MIN);
    el.style.width = el.style.height = size + "px";
    document.body.append(el);
    bubbles.push({
      el, size,
      x: x + (Math.random() - 0.5) * 8,
      y: y,
      vy: RISE * (0.6 + Math.random() * 0.8) * (12 / size),   // 작은 방울이 더 빨리
      phase: Math.random() * Math.PI * 2,
      wob: 0.04 + Math.random() * 0.04,
      life: 0,
      maxLife: 40 + Math.random() * 90,                        // 1.5~3초
    });
    lastSpawnX = x; lastSpawnY = y; lastSpawnT = performance.now();
  }

  // 방울들 위로 띄우기
  function updateBubbles() {
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.life++;
      b.y -= b.vy;
      b.x += Math.sin(b.life * b.wob + b.phase) * 0.35;        // 살랑살랑 흔들리며
      const t = b.life / b.maxLife;
      const grow = 1 + t * 0.4;                                  // 올라가며 살짝 커지고
      const fade = t < 0.15 ? t / 0.15 : t > 0.8 ? (1 - t) / 0.2 : 1;   // 서서히 나타났다 사라지기
      b.el.style.opacity = fade;
      b.el.style.transform =
        "translate(" + (b.x - b.size / 2) + "px," + (b.y - b.size / 2) + "px) scale(" + grow + ")";
      if (t >= 1) { b.el.remove(); bubbles.splice(i, 1); }
    }
  }

  window.addEventListener("pointermove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (!shown) { x = mx; y = my; shown = true; ball.style.opacity = "1"; }
    targetSize = e.target.closest && e.target.closest(HOVER_TARGETS) ? HOVER_SIZE : SIZE;
  }, { passive: true });

  document.addEventListener("pointerleave", () => { ball.style.opacity = "0"; shown = false; });
  window.addEventListener("pointerdown", () => { press = 0.8; });

  function tick() {
    x += (mx - x) * FOLLOW;
    y += (my - y) * FOLLOW;
    size += (targetSize - size) * 0.15;
    press += (1 - press) * 0.15;

    // 빨리 움직이면 움직이는 방향으로 살짝 늘어나요 (물방울처럼)
    const vx = mx - x, vy = my - y;
    const speed = Math.min(Math.hypot(vx, vy) / 120, 0.25);
    const ang = Math.atan2(vy, vx) * 180 / Math.PI;

    ball.style.width = ball.style.height = size + "px";
    ball.style.transform =
      "translate(" + (x - size / 2) + "px," + (y - size / 2) + "px) " +
      "rotate(" + ang + "deg) scale(" + ((1 + speed) * press) + "," + ((1 - speed * 0.6) * press) + ")";

    // 움직인 만큼, 또는 가만히 있어도 가끔 방울이 생겨요
    if (shown) {
      const moved = Math.hypot(x - lastSpawnX, y - lastSpawnY);
      if (moved > BUBBLE_GAP) spawn();
      else if (BUBBLE_IDLE > 0 && performance.now() - lastSpawnT > BUBBLE_IDLE) spawn();
    }
    updateBubbles();

    requestAnimationFrame(tick);
  }
  tick();
})();
