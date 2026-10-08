/* ========================================
   WATER DROP INTRO

   1. 흰 화면 가운데에 이름(data-word)이 있어요.
   2. 물방울 하나가 마우스를 따라다니며 아래 글자를
      볼록렌즈처럼 휘어 보이게 해요.
      마우스가 없으면 이름 위를 천천히 떠다녀요.
   3. 클릭(또는 Enter)하면 물방울이 커지면서
      인트로가 사라지고 사이트가 나타나요.

   같은 탭에서 한 번 본 뒤에는 다시 나오지 않아요.
======================================== */

(function () {
  const intro = document.getElementById("intro");
  if (!intro) return;

  // ---- 이미 봤거나, '동작 줄이기' 설정이면 인트로 건너뛰기 ----
  let seen = false;
  try { seen = sessionStorage.getItem("introSeen") === "1"; } catch (e) {}

  if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    intro.remove();
    document.body.classList.add("entered");
    return;
  }

  document.body.classList.add("intro-active");

  const canvas = intro.querySelector("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const WORD = intro.dataset.word || "HELLO";

  // ---- 조절하기 좋은 값들 ----
  const DROP_SIZE = 0.17;     // 물방울 크기 (화면 짧은 쪽 대비 반지름 비율)
  const FOLLOW = 0.07;        // 마우스를 따라오는 속도 (클수록 빠름)
  const MAGNIFY = 0.16;       // 가운데 확대 정도
  const EDGE_BEND = 0.36;     // 가장자리에서 휘는 정도
  const COLOR_FRINGE = 0.04;  // 가장자리 색 번짐 (0이면 없음)
  const SHADOW = 0.13;        // 바깥 그림자 진하기
  const TEXT_COLOR = "#111";  // 이름 색
  const BG_COLOR = "#fff";    // 배경 색

  let W, H, dp, R;
  let base, bd;               // 이름이 그려진 원본 이미지와 그 픽셀
  const L = { x: 0, y: 0 };   // 물방울 현재 위치
  const T = { x: 0, y: 0 };   // 물방울이 가려는 위치
  const P = { x: 0, y: 0 };   // 이전 프레임 위치 (속도 계산용)
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

    // 모노스페이스 한 글자 폭 ≈ 0.6em → 화면 너비의 80%에 맞춤
    const size = Math.min((W * 0.8) / (WORD.length * 0.6), H * 0.28);
    g.fillStyle = TEXT_COLOR;
    g.font = `600 ${size}px "Geist Mono", "Courier New", monospace`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(WORD, W / 2, H / 2);

    bd = g.getImageData(0, 0, W, H).data;

    R = Math.max(110, Math.min(window.innerWidth, window.innerHeight) * DROP_SIZE) * dp;

    if (first) {
      L.x = T.x = P.x = W / 2;
      L.y = T.y = P.y = H / 2;
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

    L.x += (T.x - L.x) * FOLLOW;
    L.y += (T.y - L.y) * FOLLOW;

    // 빨리 움직이면 진행 방향으로 살짝 늘어나기 (액체 느낌)
    const vx = L.x - P.x;
    const vy = L.y - P.y;
    const vl = Math.hypot(vx, vy) || 1;
    P.x = L.x;
    P.y = L.y;
    const sp = Math.min(vl / (dp * 45), 0.22);
    const ux = vx / vl;
    const uy = vy / vl;

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

    // 3) 물방울 안쪽: 아래 글자를 굴절시켜 다시 그리기
    const reach = r * (1 + sp) + 2;
    const x0 = Math.max(0, Math.floor(L.x - reach));
    const y0 = Math.max(0, Math.floor(L.y - reach));
    const x1 = Math.min(W, Math.ceil(L.x + reach));
    const y1 = Math.min(H, Math.ceil(L.y + reach));
    const bw = x1 - x0;
    const bh = y1 - y0;

    if (bw > 0 && bh > 0) {
      const img = ctx.getImageData(x0, y0, bw, bh);
      const o = img.data;

      for (let j = 0; j < bh; j++) {
        const dy = y0 + j - L.y;
        for (let i = 0; i < bw; i++) {
          const dx = x0 + i - L.x;

          // 움직이는 방향으로 늘어난 타원 안에 있는지
          const along = (dx * ux + dy * uy) / (1 + sp);
          const perp = (-dx * uy + dy * ux) / (1 - sp * 0.4);
          const d = Math.hypot(along, perp) / r;
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

    try { sessionStorage.setItem("introSeen", "1"); } catch (e) {}

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
    document.fonts.load('600 40px "Geist Mono"').then(start, start);
  } else {
    start();
  }
})();
