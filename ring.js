/* ========================================
   RING WORK LAYOUT

   홈의 Week 카드들(.week-grid 안의 .week)을 원형으로 배치해요.
   - Flat / Tilt / Ring / Gallery 버튼으로 배열을 바꿀 수 있어요.
   - 카드 영역 위에서 스크롤하면 원이 돌아가요.
   - 카드에 마우스를 올리면 커지고, 가운데에 번호와 제목이 떠요.
   - 카드를 클릭하면 원래처럼 해당 Week 페이지로 이동해요.

   index.html의 카드 HTML은 그대로 두고, 이 파일이 배치만 바꿔요.
   화면이 좁으면(휴대폰) 원형 배열을 쓰지 않고 원래 격자로 보여요.
======================================== */

(function () {
  const grid = document.querySelector(".week-grid");
  if (!grid) return;

  // 휴대폰처럼 좁은 화면에서는 원래 격자 그대로
  if (window.matchMedia("(max-width: 700px)").matches) return;

  const cards = Array.from(grid.querySelectorAll(".week"));
  const N = cards.length;
  if (!N) return;

  // ---- 조절하기 좋은 값들 ----
  const START_MODE = "flat";   // 처음 보일 배열: "flat", "tilt", "ring", "gallery"
  const AUTO_SPIN = 0.001;     // 가만히 있을 때 저절로 도는 속도 (0이면 멈춤)
  const SCROLL_SPEED = 0.0005; // 스크롤할 때 도는 정도
  const HOVER_SCALE = 1.25;    // 마우스를 올렸을 때 커지는 정도
  const SMOOTH = 0.1;          // 배열이 바뀔 때 움직임의 부드러움 (작을수록 느긋하게)
  const CARD = 170;            // 카드 너비(px). style.css의 .ring-on .week width와 같게 맞춰요

  const MODES = ["flat", "tilt", "ring", "gallery"];
  let mode = START_MODE;


  // ---- 1) 배열 바꾸는 버튼 만들기 ----
  const bar = document.createElement("div");
  bar.className = "ring-modes";
  MODES.forEach((m) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = m[0].toUpperCase() + m.slice(1);
    if (m === mode) b.classList.add("on");
    b.addEventListener("click", () => {
      mode = m;
      bar.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    });
    bar.append(b);
  });
  grid.before(bar);


  // ---- 2) 카드들을 무대(stage) 안으로 옮기기 ----
  grid.classList.add("ring-on");
  const stage = document.createElement("div");
  stage.className = "ring-stage";
  cards.forEach((c) => stage.append(c));
  grid.append(stage);

  // 가운데 제목 표시
  const label = document.createElement("div");
  label.className = "ring-label";
  grid.append(label);

  // 아래쪽 안내 문구
  const foot = document.createElement("div");
  foot.className = "ring-foot";
  foot.innerHTML =
    "<span>SCROLL TO EXPLORE</span><span>01 — " + String(N).padStart(2, "0") + "</span>";
  grid.after(foot);


  // ---- 3) 상태 값 ----
  const state = cards.map(() => ({ x: 0, y: 0, z: 0, ry: 0, s: 1 }));
  let rot = 0;
  let vel = 0;
  let hovered = -1;
  let R = 200;
  let W = 1000;

  function resize() {
    W = grid.clientWidth;
    R = Math.min(W * 0.32, CARD * 1.75);
  }
  resize();
  window.addEventListener("resize", resize);


  // ---- 4) 마우스 올리기 / 스크롤 ----
  cards.forEach((c, i) => {
    c.addEventListener("mouseenter", () => {
      hovered = i;
      const title = c.querySelector("h2") ? c.querySelector("h2").textContent : "";
      const num = c.querySelector(".num") ? c.querySelector(".num").textContent : "";
      label.innerHTML = "<span>" + num + "</span><br>" + title;
      label.classList.add("show");
    });
    c.addEventListener("mouseleave", () => {
      hovered = -1;
      label.classList.remove("show");
    });
  });

  grid.addEventListener(
    "wheel",
    (e) => {
      if (mode === "gallery") return;   // 격자에서는 페이지가 그냥 스크롤돼요
      e.preventDefault();
      vel += e.deltaY * SCROLL_SPEED;
    },
    { passive: false }
  );


  // ---- 5) 배열마다 카드가 있어야 할 자리 ----
  function target(i) {
    const a = (i / N) * Math.PI * 2 + rot;

    // 평평한 원
    if (mode === "flat") {
      return { x: R * Math.cos(a), y: R * Math.sin(a), z: 0, ry: 0 };
    }

    // 비스듬히 눕힌 원
    if (mode === "tilt") {
      return { x: R * 1.3 * Math.cos(a), y: R * 0.42 * Math.sin(a), z: R * 0.9 * Math.sin(a), ry: 0 };
    }

    // 회전목마
    if (mode === "ring") {
      const r = R * 1.4;
      return { x: r * Math.sin(a), y: 0, z: r * Math.cos(a) - r, ry: (a * 180) / Math.PI };
    }

    // 격자 (화면 폭에 맞춰 줄 수 자동)
    const step = CARD + 24;
    const cols = Math.max(1, Math.floor((W - 40) / step));
    const rows = Math.ceil(N / cols);
    const col = i % cols;
    const row = Math.floor(i / cols);
    const rowStep = CARD * 1.05 + 24;
    return { x: (col - (cols - 1) / 2) * step, y: (row - (rows - 1) / 2) * rowStep, z: 0, ry: 0 };
  }


  // ---- 6) 매 프레임 움직이기 ----
  function tick() {
    vel *= 0.92;
    rot += vel + (mode === "gallery" ? 0 : AUTO_SPIN);

    cards.forEach((c, i) => {
      const t = target(i);
      const s = state[i];

      s.x += (t.x - s.x) * SMOOTH;
      s.y += (t.y - s.y) * SMOOTH;
      s.z += (t.z - s.z) * SMOOTH;

      // 각도는 가장 가까운 방향으로 돌기
      let dr = t.ry - s.ry;
      dr = ((dr + 540) % 360) - 180;
      s.ry += dr * SMOOTH;

      const ts = hovered === i ? HOVER_SCALE : 1;
      s.s += (ts - s.s) * 0.2;

      c.style.transform =
        "translate3d(" + s.x.toFixed(1) + "px," + s.y.toFixed(1) + "px," + s.z.toFixed(1) + "px) " +
        "rotateY(" + s.ry.toFixed(1) + "deg) scale(" + s.s.toFixed(3) + ")";
      c.style.zIndex = hovered === i ? 3000 : Math.round(1000 + s.z);
    });

    requestAnimationFrame(tick);
  }
  tick();
})();
