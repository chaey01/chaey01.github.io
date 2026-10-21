/* ========================================
   GLASS CURSOR — 마우스를 따라다니는 작은 유리구슬

   인트로의 물방울처럼, 메인 화면에서도 작은 유리구슬이
   마우스를 살짝 늦게 따라다녀요.
   - 구슬 아래의 화면이 살짝 뿌옇고 맑게 비쳐 보여요.
   - 카드나 버튼 위에 올라가면 구슬이 커져요.
   - 클릭하면 말랑하게 눌렸다 돌아와요.
   - 휴대폰(터치 화면)이나 '동작 줄이기' 설정에서는 나타나지 않아요.
======================================== */

(function () {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // ---- 조절하기 좋은 값들 ----
  const SIZE = 6;           // 평소 구슬 크기(px)
  const HOVER_SIZE = 10;    // 카드·버튼 위에서의 크기(px)
  const FOLLOW = 0.18;      // 따라오는 속도 (1이면 바로, 작을수록 느긋하게)
  const HOVER_TARGETS = "a, button, .week";   // 이 위에 올라가면 커져요

  const ball = document.createElement("div");
  ball.className = "glass-cursor";
  document.body.append(ball);

  let mx = -200, my = -200;   // 마우스 위치
  let x = mx, y = my;         // 구슬 위치
  let size = SIZE, targetSize = SIZE;
  let press = 1;              // 클릭할 때 눌리는 정도
  let shown = false;

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

    requestAnimationFrame(tick);
  }
  tick();
})();
