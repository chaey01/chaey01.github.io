/* ========================================
   WATER DROP INTRO

   1. 흰 화면 가운데에 이름(data-word)이 있어요.
   2. 동그란 물방울 하나가 마우스를 따라다니며 아래 글자를
      볼록렌즈처럼 휘어 보이게 해요.
      마우스가 없으면 이름 위를 천천히 떠다녀요.
   3. 클릭(또는 Enter)하면 물방울이 커지면서
      인트로가 사라지고 사이트가 나타나요.

   새로고침하거나 처음 들어오면 인트로가 나오고,
   내 사이트의 Week 페이지에서 돌아올 때는 건너뛰어요.
======================================== */

(function () {
  const intro = document.getElementById("intro");
  if (!intro) return;

  // ---- 인트로를 건너뛸지 정하기 ----
  // 새로고침하거나 처음 들어오면 → 인트로 나옴
  // 내 사이트의 Week 페이지에서 돌아오면 → 건너뜀
  const nav = performance.getEntriesByType("navigation")[0];
  const isReload = nav && nav.type === "reload";
  const isBack = nav && nav.type === "back_forward";
  let fromInside = false;
  try { fromInside = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
  const skip = !isReload && (fromInside || isBack);

  if (skip || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    intro.remove();
    document.body.classList.add("entered");
    return;
  }

  document.body.classList.add("intro-active");

  const canvas = intro.querySelector("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const WORD = intro.dataset.word || "HELLO";

  // ---- 글씨체 ----
  // 다른 폰트를 쓰려면 style.css 맨 위 @import에 그 폰트를 추가한 뒤
  // 아래 FONT_FAMILY의 첫 번째 이름을 바꿔요.
  const FONT_FAMILY = '"Courier New", Courier, monospace';
  const FONT_WEIGHT = 700;      // Courier New는 보통(400)과 굵게(700) 두 가지예요
  const TEXT_WIDTH = 0.8;       // 이름이 화면 너비에서 차지하는 비율

  // ---- 물방울 조절 값 ----
  const DROP_SIZE = 0.17;       // 물방울 크기 (화면 짧은 쪽 대비 반지름 비율)
  const FOLLOW = 0.2;           // 마우스를 따라오는 속도 (1에 가까울수록 즉시 따라옴)
  const MAGNIFY = 0.16;         // 가운데 확대 정도
  const EDGE_BEND = 0.36;       // 가장자리에서 휘는 정도
  const COLOR_FRINGE = 0.04;    // 가장자리 색 번짐 (0이면 없음)
  const SHADOW = 0.13;          // 바깥 그림자 진하기
  const TEXT_COLOR = "#111";    // 이름 색
  const BG_COLOR = "#fff";      // 배경 색

  let W, H, dp, R;
  let base, bd;                 // 이름이 그려진 원본 이미지와 그 픽셀
  const L = { x: 0, y: 0 };     // 물방울 현재 위치
  const T = { x: 0, y: 0 };     // 물방울이 가려는 위치
  let hover = false;
  let leaving = false;
  let grow = 0;
  let t = 0;
  let rafId;
  let first = true;


  // 화면 크기에 맞춰 원본 이미지(흰 배경 + 이름) 만들기
  function build() {
    dp = Math.min(window.devicePixelRatio || 1, 1.5);   // 성능을 위해 최대 1.5배
    W = Math.round(window.innerWidth * dp);
    H = Math.round(window.innerHeight * dp);
    canvas.width = W;
    canvas.height = H;

    base = document.createElement("canvas");
    base.width = W;
    base.height = H;
    const g = base.getContext("2d");

    g.fillStyle = BG_COLOR;
    g.fillRect(0, 0, W, H);

    // 글자 실제 폭을 재서 화면 너비에 딱 맞추기 (어떤 폰트든 잘리지 않게)
    let size = 100;
    g.font = `${FONT_WEIGHT} ${size}px ${FONT_FAMILY}`;
    const measured = g.measureText(WORD).width || 1;
    size = Math.min(size * (W * TEXT_WIDTH) / measured, H * 0.28);

    g.fillStyle = TEXT_COLOR;
    g.font = `${FONT_WEIGHT} ${size}px ${FONT_FAMILY}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(WORD, W / 2, H / 2);

    bd = g.getImageData(0, 0, W, H).data;

    R = Math.max(110, Math.min(window.innerWidth, window.innerHeight) * DROP_SIZE) * dp;

    if (first) {
      L.x = T.x = W / 2;
      L.y = T.y = H / 2;
      first = false;
    }
  }


  function frame() {
    t += 0.01;

    // 마우스가 없으면 이름 위를 천천히 떠다니기
    if (!hover && !leaving) {
      T.x = W / 2 + Math.cos(t * 0.55) * W * 0.22;
      T.y = H / 2 + Math.sin(t * 0.9) * H * 0.12;
    }

    // 떠다닐 땐 느긋하게, 마우스를 따라갈 땐 빠르게
    const follow = hover ? FOLLOW : 0.06;
    L.x += (T.x - L.x) * follow;
    L.y += (T.y - L.y) * follow;

    // 클릭 후 물방울이 커짐
    if (leaving) grow += (1 - grow) * 0.08;
    const r = R * (1 + grow * 1.4);

    // 1) 원본 그리기
    ctx.drawImage(base, 0, 0);

    // 2) 물방울 바깥 그림자
    ctx.save();
    ctx.shadowColor = `rgba(0, 0, 0, ${SHADOW})`;
    ctx.shadowBlur = 34 * dp;
    ctx.shadowOffsetY = 12 * dp;
    ctx.fillStyle = BG_COLOR;
    ctx.beginPath();
    ctx.arc(L.x, L.y, r * 0.99, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3) 물방울 안쪽: 아래 글자를 굴절시켜 다시 그리기 (항상 동그란 원)
    const x0 = Math.max(0, Math.floor(L.x - r - 1));
    const y0 = Math.max(0, Math.floor(L.y - r - 1));
    const x1 = Math.min(W, Math.ceil(L.x + r + 1));
    const y1 = Math.min(H, Math.ceil(L.y + r + 1));
    const bw = x1 - x0;
    const bh = y1 - y0;

    if (bw > 0 && bh > 0) {
      const img = ctx.getImageData(x0, y0, bw, bh);
      const o = img.data;

      for (let j = 0; j < bh; j++) {
        const dy = y0 + j - L.y;
        for (let i = 0; i < bw; i++) {
          const dx = x0 + i - L.x;
          const d = Math.hypot(dx, dy) / r;
          if (d >= 1) continue;

          // 가운데는 확대, 가장자리는 바깥을 끌어당김
          const d3 = d * d * d;
          const scale = 1 - MAGNIFY + EDGE_BEND * d3 * d;
          const fringe = COLOR_FRINGE * d3;

          // 가장자리 3%는 부드럽게 섞기
          const a = d > 0.97 ? (1 - d) / 0.03 : 1;
          const k = (j * bw + i) * 4;

          for (let ch = 0; ch < 3; ch++) {
            const s = scale + (ch - 1) * fringe;   // R, G, B를 조금씩 다르게 → 색 번짐
            let sx = Math.round(L.x + dx * s);
            let sy = Math.round(L.y + dy * s);
            sx = sx < 0 ? 0 : sx >= W ? W - 1 : sx;
            sy = sy < 0 ? 0 : sy >= H ? H - 1 : sy;
            const v = bd[(sy * W + sx) * 4 + ch];
            o[k + ch] = o[k + ch] * (1 - a) + v * a;
          }
        }
      }

      ctx.putImageData(img, x0, y0);
    }

    rafId = requestAnimationFrame(frame);
  }


  // ---- 클릭: 물방울이 커지며 입장 ----
  function enter() {
    if (leaving) return;
    leaving = true;

    setTimeout(() => {
      intro.classList.add("leaving");
      document.body.classList.remove("intro-active");
      document.body.classList.add("entered");
    }, 350);

    setTimeout(() => {
      cancelAnimationFrame(rafId);
      intro.remove();
    }, 1600);
  }


  // ---- 이벤트 ----
  intro.addEventListener("pointermove", (e) => {
    hover = true;
    T.x = e.clientX * dp;
    T.y = e.clientY * dp;
  });
  intro.addEventListener("pointerleave", () => { hover = false; });
  intro.addEventListener("click", enter);
  intro.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      enter();
    }
  });
  window.addEventListener("resize", () => { if (!leaving) build(); });


  // 폰트가 다 불러와진 뒤에 이름을 그려야 모양이 정확해요
  const start = () => {
    build();
    frame();
    intro.focus();
  };
  if (document.fonts && document.fonts.load) {
    document.fonts.load(`${FONT_WEIGHT} 40px ${FONT_FAMILY}`).then(start, start);
  } else {
    start();
  }
})();
