/* ========================================
   SOUND — 우주 소리 (sketch.js와 함께)

   - 페이지가 열리면 바로 소리를 켜 봐요.
     브라우저가 막으면, 클릭·키보드·터치 중 아무거나 처음 하는 순간 켜져요.
   - 낮게 울리는 우주 배경음이 깔려요.
   - 입을 벌려 별이 퍼지면 반짝이는 종소리가 나요.

   sketch.js는 고칠 필요 없어요. 이 파일이 알아서 따라 움직여요.
======================================== */

// ---- 소리 조절 값 ----
const DRONE_VOLUME = 0.05;   // 배경음 크기 (0~1)
const BELL_VOLUME = 0.12;    // 종소리 크기 (0~1)
const ECHO = 4;              // 울림(잔향) 길이(초). 클수록 우주처럼 길게 퍼져요
// 종소리 음들 (도 레 미 솔 라, 높은 음역) — 어떤 조합으로 울려도 예쁘게 어울려요
const NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

let soundOn = false;
let drone1, drone2, reverb;
let bells = [];
let bellIndex = 0;
let wasOpen = false;
let nextTwinkle = 0;
let soundHint;

// 화면에 "click for sound" 안내 띄우기
window.addEventListener("DOMContentLoaded", () => {
  soundHint = document.createElement("p");
  soundHint.textContent = "click anywhere for sound";
  soundHint.style.cssText =
    "position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:3;" +
    "margin:0;font:400 11px 'Geist Mono',monospace;letter-spacing:.3em;" +
    "text-transform:uppercase;color:rgba(255,255,255,.55);pointer-events:none;";
  document.body.appendChild(soundHint);
});

// 페이지가 열리면 바로 소리 준비 + 켜 보기
window.addEventListener("load", () => {
  startSound();
  setTimeout(checkSound, 300);
});

// 소리가 실제로 나는지 확인해서, 나면 안내 문구 숨기기
function checkSound() {
  if (getAudioContext().state === "running") {
    if (soundHint) soundHint.remove();
  }
}

// 브라우저가 막았을 때: 아무 클릭·키보드·터치에 바로 켜기
function unlockSound() {
  userStartAudio();
  setTimeout(checkSound, 100);
}
["pointerdown", "keydown", "touchstart"].forEach((type) =>
  window.addEventListener(type, unlockSound, { once: true })
);

function startSound() {
  reverb = new p5.Reverb();

  // 배경음: 낮은 두 음이 천천히 커지며 깔려요
  drone1 = new p5.Oscillator("sine");
  drone1.freq(110);
  drone1.amp(0);
  drone1.start();
  drone1.amp(DRONE_VOLUME, 4);

  drone2 = new p5.Oscillator("sine");
  drone2.freq(164.81);
  drone2.amp(0);
  drone2.start();
  drone2.amp(DRONE_VOLUME * 0.6, 4);

  reverb.process(drone1, ECHO, 2);
  reverb.process(drone2, ECHO, 2);

  // 종소리: 여러 음이 겹쳐 울릴 수 있게 6개 준비
  for (let i = 0; i < 6; i++) {
    const osc = new p5.Oscillator("triangle");
    osc.amp(0);
    osc.start();
    reverb.process(osc, ECHO, 2);
    const env = new p5.Envelope();
    env.setADSR(0.005, 0.5, 0, 0.1);   // 톡 치고 사르르 사라지는 모양
    env.setRange(BELL_VOLUME, 0);
    bells.push({ osc, env });
  }

  soundOn = true;
  userStartAudio();   // 브라우저가 허락하면 바로 소리가 나요
}

// 종소리 한 번 울리기
function ping() {
  const b = bells[bellIndex];
  bellIndex = (bellIndex + 1) % bells.length;
  b.osc.freq(random(NOTES));
  b.env.play(b.osc);
}

// 매 프레임 그림을 그린 뒤에 자동으로 실행돼요
p5.prototype.registerMethod("post", function () {
  if (!soundOn) return;

  const open = mouthW > OPEN_MOUTH;

  // 입을 막 벌린 순간: 종소리가 또르르 연달아
  if (open && !wasOpen) {
    for (let k = 0; k < 4; k++) setTimeout(ping, k * 90);
  }

  // 별이 퍼져 있는 동안: 가끔씩 반짝반짝
  if (spread > 0.2 && millis() > nextTwinkle) {
    ping();
    nextTwinkle = millis() + random(150, 450) / max(spread, 0.3);
  }

  // 별이 퍼질수록 배경음이 살짝 높아져요
  drone2.freq(164.81 * (1 + spread * 0.5), 0.3);

  wasOpen = open;
});
