/* ========================================
   PARTICLE INTRO

   1. 흩어져 있던 점들이 모여서 글자(data-word)를 만들어요.
   2. 마우스를 가까이 대면 점들이 밀려나며 흩어져요.
   3. 클릭(또는 Enter)하면 점들이 사방으로 터지며
      인트로가 사라지고 사이트가 나타나요.

   같은 탭에서 한 번 본 뒤에는 다시 나오지 않아요.
   (Week 페이지에 갔다가 돌아올 때마다 인트로가 나오면 번거로우니까)
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
  const ctx = canvas.getContext("2d");
  const WORD = intro.dataset.word || "HELLO";

  // ---- 조절하기 좋은 값들 ----
  const SPRING = 0.03;        // 글자 자리로 돌아가려는 힘
  const FRICTION = 0.85;      // 클수록 오래 미끄러짐
  const MOUSE_RADIUS = 90;    // 마우스가 밀어내는 범위(px)
  const MOUSE_FORCE = 6;      // 밀어내는 세기
  const DOT = 2;              // 점 크기(px)

  let W, H, dpr;
  let particles = [];
  let leaving = false;
  let rafId;
  const mouse = { x: -9999, y: -9999 };


  // 글자를 보이지 않는 캔버스에 그린 뒤, 글자 픽셀 위치만 골라내요
  function sampleText() {
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const o = off.getContext("2d");

    // 모노스페이스 한 글자 폭 ≈ 0.6em → 화면 너비의 80%에 맞춤
    const size = Math.min((W * 0.8) / (WORD.length * 0.6), H * 0.3);
    o.font = `600 ${size}px "Geist Mono", "Courier New", monospace`;
    o.textAlign = "center";
    o.textBaseline = "middle";
    o.fillStyle = "#fff";
    o.fillText(WORD, W / 2, H / 2);

    const data = o.getImageData(0, 0, W, H).data;
    const gap = Math.max(4, Math.round(size / 20)); // 점 간격
    const points = [];

    for (let y = 0; y < H; y += gap) {
      for (let x = 0; x < W; x += gap) {
        if (data[(y * W + x) * 4 + 3] > 128) points.push({ x, y });
      }
    }
    return points;
  }


  function build() {
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const targets = sampleText();

    targets.forEach((t, i) => {
      if (particles[i]) {
        particles[i].tx = t.x;
        particles[i].ty = t.y;
      } else {
        // 처음엔 화면 아무 데나 흩어진 상태에서 시작
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: 0,
          vy: 0,
          tx: t.x,
          ty: t.y,
        });
      }
    });
    particles.length = targets.length;
  }


  function frame() {
    // 반투명 검정으로 덮어서 살짝 잔상이 남게
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#f2f2f0";

    for (const p of particles) {
      if (!leaving) {
        // 글자 자리로 끌려감
        p.vx += (p.tx - p.x) * SPRING;
        p.vy += (p.ty - p.y) * SPRING;

        // 마우스 근처면 밀려남
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < MOUSE_RADIUS * MOUSE_RADIUS) {
          const d = Math.sqrt(d2) || 1;
          const f = ((MOUSE_RADIUS - d) / MOUSE_RADIUS) * MOUSE_FORCE;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }

        p.vx *= FRICTION;
        p.vy *= FRICTION;
      } else {
        // 클릭 후: 점점 빨라지며 바깥으로 날아감
        p.vx *= 1.03;
        p.vy *= 1.03;
      }

      p.x += p.vx;
      p.y += p.vy;
      ctx.fillRect(p.x, p.y, DOT, DOT);
    }

    rafId = requestAnimationFrame(frame);
  }


  // ---- 클릭: 흩어지면서 입장 ----
  function enter(cx, cy) {
    if (leaving) return;
    leaving = true;

    const ox = cx ?? W / 2;
    const oy = cy ?? H / 2;

    for (const p of particles) {
      const a = Math.atan2(p.y - oy, p.x - ox) + (Math.random() - 0.5) * 0.6;
      const speed = 6 + Math.random() * 18;
      p.vx = Math.cos(a) * speed;
      p.vy = Math.sin(a) * speed;
    }

    try { sessionStorage.setItem("introSeen", "1"); } catch (e) {}

    intro.classList.add("leaving");
    document.body.classList.remove("intro-active");
    document.body.classList.add("entered");

    setTimeout(() => {
      cancelAnimationFrame(rafId);
      intro.remove();
    }, 1200);
  }


  // ---- 이벤트 ----
  intro.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  intro.addEventListener("pointerleave", () => {
    mouse.x = mouse.y = -9999;
  });
  intro.addEventListener("click", (e) => enter(e.clientX, e.clientY));
  intro.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      enter();
    }
  });
  window.addEventListener("resize", () => { if (!leaving) build(); });


  // 폰트가 다 불러와진 뒤에 글자를 샘플링해야 모양이 정확해요
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
