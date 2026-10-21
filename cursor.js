/* ========================================
   LENS CURSOR — 인트로의 유리구슬을 작게 만든 커서

   마우스를 따라다니는 작은 볼록렌즈예요.
   - 구슬 아래 글자와 이미지가 볼록하게 휘어 보이고,
     가장자리에 빨강·파랑 색 번짐이 생겨요. (인트로 물방울과 같은 효과)
   - 카드나 버튼 위에 올라가면 구슬이 커져요.
   - Chrome·Edge에서는 진짜 렌즈처럼 휘어 보여요.
     Safari·Firefox는 이 효과를 지원하지 않아서, 맑은 유리구슬로만 보여요.
   - 휴대폰(터치 화면)이나 '동작 줄이기' 설정에서는 나타나지 않아요.
======================================== */

(function () {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // ---- 조절하기 좋은 값들 ----
  const SIZE = 35;          // 평소 구슬 크기(px)
  const HOVER_SIZE = 50;    // 카드·버튼 위에서의 크기(px)
  const FOLLOW = 0.5;       // 따라오는 속도 (1이면 바로, 작을수록 느긋하게)
  const BEND = 20;           // 휘어지는 정도 (클수록 볼록하게)
  const FRINGE = 2;         // 가장자리 색 번짐 정도 (0이면 없음)
  const HOVER_TARGETS = "a, button, .week";

  // ---- 1) 렌즈 모양 지도 만들기 (가운데→바깥으로 밀어내는 방향을 색으로 저장) ----
  const MAP = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = MAP;
  const g = cv.getContext("2d");
  const img = g.createImageData(MAP, MAP);
  for (let j = 0; j < MAP; j++) {
    for (let i = 0; i < MAP; i++) {
      const dx = (i / (MAP - 1)) * 2 - 1;
      const dy = (j / (MAP - 1)) * 2 - 1;
      const d = Math.hypot(dx, dy);
      // 가운데는 확대(안쪽을 끌어오기), 가장자리로 갈수록 더 크게 휘게
      const k = d < 1 ? (1 - Math.pow(1 - d, 2)) * (d > 0 ? 1 / d : 0) : 0;
      const p = (j * MAP + i) * 4;
      img.data[p] = 128 - dx * k * 127;      // R: 가로 방향
      img.data[p + 1] = 128 - dy * k * 127;  // G: 세로 방향
      img.data[p + 2] = 128;
      img.data[p + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const mapURL = cv.toDataURL();

  // ---- 2) SVG 필터: 빨강·초록·파랑을 조금씩 다르게 휘게 해서 색 번짐까지 ----
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  svg.innerHTML = `
    <filter id="lens-filter" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feImage id="lens-map" href="${mapURL}" x="0" y="0" width="${SIZE}" height="${SIZE}" preserveAspectRatio="none" result="map"/>
      <feDisplacementMap in="SourceGraphic" in2="map" scale="${BEND + FRINGE}" xChannelSelector="R" yChannelSelector="G" result="r"/>
      <feColorMatrix in="r" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="rr"/>
      <feDisplacementMap in="SourceGraphic" in2="map" scale="${BEND}" xChannelSelector="R" yChannelSelector="G" result="g"/>
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="gg"/>
      <feDisplacementMap in="SourceGraphic" in2="map" scale="${BEND - FRINGE}" xChannelSelector="R" yChannelSelector="G" result="b"/>
      <feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="bb"/>
      <feBlend in="rr" in2="gg" mode="screen" result="rg"/>
      <feBlend in="rg" in2="bb" mode="screen"/>
    </filter>`;
  document.body.append(svg);

  // ---- 3) 구슬 만들기 ----
  const ball = document.createElement("div");
  ball.className = "lens-cursor";
  document.body.append(ball);
  // 그림자와 테두리는 따로 (렌즈에 그림자를 주면 휘는 위치가 어긋나요)
  const rim = document.createElement("div");
  rim.className = "lens-rim";
  document.body.append(rim);
  const lensMap = svg.querySelector("#lens-map");
  const disp = svg.querySelectorAll("feDisplacementMap");

  let mx = -200, my = -200;
  let x = mx, y = my;
  let size = SIZE, targetSize = SIZE;
  let shown = false;

  window.addEventListener("pointermove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (!shown) { x = mx; y = my; shown = true; ball.style.opacity = rim.style.opacity = "1"; }
    targetSize = e.target.closest && e.target.closest(HOVER_TARGETS) ? HOVER_SIZE : SIZE;
  }, { passive: true });
  document.addEventListener("pointerleave", () => { ball.style.opacity = rim.style.opacity = "0"; shown = false; });

  function tick() {
    x += (mx - x) * FOLLOW;
    y += (my - y) * FOLLOW;
    size += (targetSize - size) * 0.15;
    ball.style.width = ball.style.height = rim.style.width = rim.style.height = size.toFixed(1) + "px";
    // 렌즈 지도도 구슬 크기에 맞추기 (구슬이 커지면 휘는 정도도 같이 커져요)
    const s = size.toFixed(1);
    lensMap.setAttribute("width", s);
    lensMap.setAttribute("height", s);
    const k = size / SIZE;
    disp[0].setAttribute("scale", ((BEND + FRINGE) * k).toFixed(2));
    disp[1].setAttribute("scale", (BEND * k).toFixed(2));
    disp[2].setAttribute("scale", ((BEND - FRINGE) * k).toFixed(2));
    // transform 대신 left/top으로 옮겨야 렌즈 효과가 구슬 자리에 정확히 생겨요
    ball.style.left = (x - size / 2).toFixed(1) + "px";
    ball.style.top = (y - size / 2).toFixed(1) + "px";
    rim.style.left = ball.style.left;
    rim.style.top = ball.style.top;
    requestAnimationFrame(tick);
  }
  tick();
})();
