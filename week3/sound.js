/* ========================================
   SOUND — 우주 소리 (sketch.js와 함께)

   - 페이지가 열리면 바로 소리를 켜 봐요.
     브라우저가 막으면, 클릭·키보드·터치 중 아무거나 처음 하는 순간 켜져요.
   - 몽롱한 우주 배경음(패드)이 천천히 숨 쉬듯 깔려요.
     몇 초마다 화음이 부드럽게 바뀌어요.
   - 얼굴을 움직이면 소리가 조금 더 밝아지고,
     입을 벌리면 반짝이는 종소리가 나요.

   sketch.js는 고칠 필요 없어요. 이 파일이 알아서 따라 움직여요.
======================================== */

// ---- 소리 조절 값 ----
const DRONE_VOLUME = 0.035;  // 배경음 크기 (0~1) — 음이 여러 개 겹치니까 작게
const PAD_ECHO = 9;          // 배경음 울림 길이(초). 길수록 몽롱해요
const CHORD_TIME = 12;       // 몇 초마다 화음이 바뀌는지
const BREATH = 0.0004;       // 배경음이 커졌다 작아졌다 숨 쉬는 속도
// 배경음 화음들 (Hz) — 몽롱한 메이저7·9 화음을 돌아가며 울려요
const CHORDS = [
  [130.81, 196.0, 246.94, 293.66, 329.63],   // Cmaj9
  [110.0, 164.81, 196.0, 246.94, 261.63],    // Am9
  [87.31, 130.81, 174.61, 220.0, 329.63],    // Fmaj7(9)
  [98.0, 146.83, 196.0, 246.94, 293.66],     // G6/9
];
const BELL_VOLUME = 0.12;    // 종소리 크기 (0~1)
const ECHO = 4;              // 울림(잔향) 길이(초). 클수록 우주처럼 길게 퍼져요
// 종소리 음들 (도 레 미 솔 라, 높은 음역) — 어떤 조합으로 울려도 예쁘게 어울려요
const NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

let soundOn = false;
let reverb, padReverb, padFilter;
let pad = [];               // 배경음 목소리들
let chordIndex = 0;
let nextChord = 0;
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

  // 배경음(패드): 화음의 음마다 살짝 어긋난 소리 2개씩 → 일렁이는 몽롱한 소리
  padFilter = new p5.LowPass();      // 높은 소리를 깎아서 뿌옇게
  padFilter.freq(700);
  padFilter.res(1);
  padReverb = new p5.Reverb();
  padReverb.process(padFilter, PAD_ECHO, 3);
  padReverb.drywet(0.75);            // 울림을 많이

  const chord = CHORDS[0];
  for (let i = 0; i < chord.length; i++) {
    for (const detune of [-1.2, 1.2]) {           // 아주 살짝 어긋나게 → 일렁임
      const osc = new p5.Oscillator(i === 0 ? "sine" : "triangle");
      osc.disconnect();
      osc.connect(padFilter);
      osc.freq(chord[i] + detune);
      osc.amp(0);
      osc.start();
      osc.amp(DRONE_VOLUME / (i === 0 ? 1 : 1.6), 6);   // 6초에 걸쳐 천천히 커져요
      pad.push({ osc, note: i, detune, phase: random(TWO_PI) });
    }
  }
  nextChord = millis() + CHORD_TIME * 1000;

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

  // 배경음: 천천히 숨 쉬듯 커졌다 작아지기
  for (const v of pad) {
    const breath = 0.6 + 0.4 * sin(millis() * BREATH + v.phase);
    v.osc.amp((DRONE_VOLUME / (v.note === 0 ? 1 : 1.6)) * breath, 0.2);
  }

  // 몇 초마다 다음 화음으로 부드럽게 (4초에 걸쳐 미끄러지듯)
  if (millis() > nextChord) {
    chordIndex = (chordIndex + 1) % CHORDS.length;
    const chord = CHORDS[chordIndex];
    for (const v of pad) v.osc.freq(chord[v.note] + v.detune, 4);
    nextChord = millis() + CHORD_TIME * 1000;
  }

  // 얼굴을 움직이면 소리가 밝아지고, 입을 벌리면 더 열려요
  const bright = 700 + spread * 1500 + (open ? 900 : 0);
  padFilter.freq(bright, 0.4);

  wasOpen = open;
});
