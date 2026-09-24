/**
 * THE LIFTERS // High Performance Strength Sanctum
 * 3D Scroll Canvas Engine & Section Orchestrator
 */

// --- CONFIGURATION ---
const SECTION_FRAMES = 240; // 240 frames per transition
const FOLDERS = ['sec1to2', 'sec2to3', 'sec3to'];
const TOTAL_GLOBAL_FRAMES = SECTION_FRAMES * FOLDERS.length; // 720 frames total

const FRAME_PATH = (folder, index) => {
  const num = String(index + 1).padStart(3, '0');
  return `./frames/${folder}/ezgif-frame-${num}.jpg`;
};

// --- DOM ELEMENTS ---
const canvas = document.getElementById('experience-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

const preloader = document.getElementById('preloader');
const preloaderFill = document.getElementById('preloader-fill');
const preloaderPercent = document.getElementById('preloader-percent');
const preloaderStatus = document.getElementById('preloader-status');

const navPills = document.querySelectorAll('.nav-pill');
const scrollTriggers = document.querySelectorAll('.scroll-trigger');

const telemetryStage = document.getElementById('telemetry-stage');
const telemetryFrame = document.getElementById('telemetry-frame');
const telemetryProgress = document.getElementById('telemetry-progress-bar');
const scrollCue = document.getElementById('scroll-cue');

const sections = [
  document.getElementById('sec-1'),
  document.getElementById('sec-2'),
  document.getElementById('sec-3'),
  document.getElementById('sec-4'),
];

const modal = document.getElementById('membership-modal');
const inquiryBtn = document.getElementById('inquiry-btn');
const ctaFinal = document.getElementById('cta-final');
const modalClose = document.getElementById('modal-close');
const membershipForm = document.getElementById('membership-form');
const formSuccess = document.getElementById('m-success');

const audioToggle = document.getElementById('audio-toggle');
const audioState = document.getElementById('audio-state');

// --- ASSET CACHE ---
const frameCache = {
  sec1to2: new Array(SECTION_FRAMES),
  sec2to3: new Array(SECTION_FRAMES),
  sec3to: new Array(SECTION_FRAMES),
};

let loadedCount = 0;
let isFirstFrameReady = false;

// Physics / Lerp Rendering State
let currentGlobalFrame = 0;
let targetGlobalFrame = 0;
let isPreloaderComplete = false;

// ==========================================================================
// 1. HIGH-SPEED ASSET PRELOADER
// ==========================================================================
function preloadFrames() {
  let initialDrawn = false;

  // Phase A: Preload key benchmark frames first for immediate visual feedback
  FOLDERS.forEach((folder) => {
    for (let i = 0; i < SECTION_FRAMES; i++) {
      const img = new Image();
      img.src = FRAME_PATH(folder, i);

      img.onload = () => {
        loadedCount++;
        const pct = Math.min(100, Math.floor((loadedCount / TOTAL_GLOBAL_FRAMES) * 100));
        preloaderFill.style.width = `${pct}%`;
        preloaderPercent.textContent = `${pct}%`;

        // Render first frame as soon as frame 0 of sec1to2 is ready
        if (folder === 'sec1to2' && i === 0 && !initialDrawn) {
          initialDrawn = true;
          isFirstFrameReady = true;
          resizeCanvas();
          drawCurrentFrame(0, 0);
        }

        // When critical batch or all frames are ready, reveal experience
        if (loadedCount >= Math.min(120, TOTAL_GLOBAL_FRAMES) && !isPreloaderComplete) {
          dismissPreloader();
        }
      };

      img.onerror = () => {
        // Fallback gracefully without breaking counter
        loadedCount++;
        if (loadedCount >= Math.min(120, TOTAL_GLOBAL_FRAMES) && !isPreloaderComplete) {
          dismissPreloader();
        }
      };

      frameCache[folder][i] = img;
    }
  });
}

function dismissPreloader() {
  isPreloaderComplete = true;
  preloaderStatus.textContent = 'SYSTEM SYNCHRONIZED. ENTERING SANCTUM.';
  setTimeout(() => {
    preloader.classList.add('fade-out');
  }, 350);
}

// ==========================================================================
// 2. ASPECT-COVER CANVAS ENGINE
// ==========================================================================
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
  ctx.scale(dpr, dpr);
}

function getFrameImage(globalIndex) {
  const safeGlobal = Math.max(0, Math.min(TOTAL_GLOBAL_FRAMES - 1, globalIndex));
  const folderIndex = Math.min(Math.floor(safeGlobal / SECTION_FRAMES), FOLDERS.length - 1);
  const localIndex = Math.min(SECTION_FRAMES - 1, Math.floor(safeGlobal % SECTION_FRAMES));
  const folder = FOLDERS[folderIndex];

  return frameCache[folder][localIndex];
}

function drawCurrentFrame(folderIdx, localIdx) {
  const folder = FOLDERS[folderIdx];
  const img = frameCache[folder] ? frameCache[folder][localIdx] : null;

  if (!img || !img.complete || img.naturalWidth === 0) {
    // If exact frame not yet loaded, find nearest loaded frame in that folder
    if (frameCache[folder]) {
      for (let offset = 1; offset < 20; offset++) {
        const prev = frameCache[folder][localIdx - offset];
        if (prev && prev.complete && prev.naturalWidth > 0) {
          renderToCanvas(prev);
          return;
        }
        const next = frameCache[folder][localIdx + offset];
        if (next && next.complete && next.naturalWidth > 0) {
          renderToCanvas(next);
          return;
        }
      }
    }
    return;
  }

  renderToCanvas(img);
}

function renderToCanvas(img) {
  const cw = window.innerWidth;
  const ch = window.innerHeight;
  const iw = img.naturalWidth || 1280;
  const ih = img.naturalHeight || 720;

  // Aspect-cover math: covers full viewport seamlessly
  const imgRatio = iw / ih;
  const canvasRatio = cw / ch;

  let rw, rh, ox, oy;
  if (canvasRatio > imgRatio) {
    rw = cw;
    rh = cw / imgRatio;
    ox = 0;
    oy = (ch - rh) / 2;
  } else {
    rh = ch;
    rw = ch * imgRatio;
    ox = (cw - rw) / 2;
    oy = 0;
  }

  ctx.drawImage(img, ox, oy, rw, rh);
}

// ==========================================================================
// 3. SCROLL-DRIVEN TRANSITION ORCHESTRATOR
// ==========================================================================
function updateScrollState() {
  const scrollY = window.scrollY || window.pageYOffset;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const totalProgress = Math.min(1, Math.max(0, scrollY / maxScroll));

  // Telemetry Progress Bar
  telemetryProgress.style.width = `${(totalProgress * 100).toFixed(1)}%`;

  // Hide scroll cue once user starts scrolling
  if (scrollY > 50) {
    scrollCue.style.opacity = '0';
    scrollCue.style.pointerEvents = 'none';
  } else {
    scrollCue.style.opacity = '1';
  }

  // Measure section positions
  const offsets = sections.map((sec) => sec.offsetTop);
  const s0 = offsets[0];
  const s1 = offsets[1];
  const s2 = offsets[2];
  const s3 = offsets[3];

  let targetFrame = 0;
  let activeIndex = 0;
  let stageLabel = '01 // THE KNURL';

  // Section 1 to Section 2 Transition (sec1to2: 0..240)
  if (scrollY < s1) {
    const span = Math.max(1, s1 - s0);
    const t = Math.min(1, Math.max(0, (scrollY - s0) / span));
    targetFrame = t * (SECTION_FRAMES - 1);

    // Opacity transitions targeted on .section-inner
    const inner1 = sections[0].querySelector('.section-inner');
    const inner2 = sections[1].querySelector('.section-inner');

    if (inner1) {
      const op1 = Math.max(0, 1 - t * 2.2);
      inner1.style.opacity = op1.toFixed(3);
      inner1.style.transform = `translateY(${-t * 30}px)`;
    }
    if (inner2) {
      const op2 = Math.min(1, Math.max(0, (t - 0.55) * 2.2));
      inner2.style.opacity = op2.toFixed(3);
      inner2.style.transform = `translateY(${(1 - t) * 30}px)`;
    }

    activeIndex = t < 0.6 ? 0 : 1;
    stageLabel = t < 0.6 ? '01 // THE KNURL' : '02 // THE FOUNDATION';
  }
  // Section 2 to Section 3 Transition (sec2to3: 0..240)
  else if (scrollY < s2) {
    const span = Math.max(1, s2 - s1);
    const t = Math.min(1, Math.max(0, (scrollY - s1) / span));
    targetFrame = SECTION_FRAMES + t * (SECTION_FRAMES - 1);

    const inner2 = sections[1].querySelector('.section-inner');
    const inner3 = sections[2].querySelector('.section-inner');

    if (inner2) {
      const op2 = Math.max(0, 1 - t * 2.2);
      inner2.style.opacity = op2.toFixed(3);
      inner2.style.transform = `translateY(${-t * 30}px)`;
    }
    if (inner3) {
      const op3 = Math.min(1, Math.max(0, (t - 0.55) * 2.2));
      inner3.style.opacity = op3.toFixed(3);
      inner3.style.transform = `translateY(${(1 - t) * 30}px)`;
    }

    activeIndex = t < 0.6 ? 1 : 2;
    stageLabel = t < 0.6 ? '02 // THE FOUNDATION' : '03 // THE SANCTUARY';
  }
  // Section 3 to Section 4 Transition (sec3to: 0..240)
  else {
    const span = Math.max(1, s3 - s2);
    const t = Math.min(1, Math.max(0, (scrollY - s2) / span));
    targetFrame = SECTION_FRAMES * 2 + t * (SECTION_FRAMES - 1);

    const inner3 = sections[2].querySelector('.section-inner');
    const inner4 = sections[3].querySelector('.section-inner');

    if (inner3) {
      const op3 = Math.max(0, 1 - t * 2.2);
      inner3.style.opacity = op3.toFixed(3);
      inner3.style.transform = `translateY(${-t * 30}px)`;
    }
    if (inner4) {
      const op4 = Math.min(1, Math.max(0, (t - 0.55) * 2.2));
      inner4.style.opacity = op4.toFixed(3);
      inner4.style.transform = `translateY(${(1 - t) * 30}px)`;
    }

    activeIndex = t < 0.6 ? 2 : 3;
    stageLabel = t < 0.6 ? '03 // THE SANCTUARY' : '04 // THE APEX';
  }

  targetGlobalFrame = Math.max(0, Math.min(TOTAL_GLOBAL_FRAMES - 1, targetFrame));

  // Update Telemetry & Navigation state
  telemetryStage.textContent = stageLabel;
  navPills.forEach((pill, idx) => {
    if (idx === activeIndex) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

// Physics Lerp Loop for Buttery Smooth Forward & Reverse Scrubbing
function renderLoop() {
  // Lerp smoothing factor (0.12 gives responsive yet silky smooth cinematic scrub)
  const diff = targetGlobalFrame - currentGlobalFrame;
  if (Math.abs(diff) > 0.005) {
    currentGlobalFrame += diff * 0.12;
  } else {
    currentGlobalFrame = targetGlobalFrame;
  }

  const frameNum = Math.round(currentGlobalFrame);
  const folderIdx = Math.min(Math.floor(frameNum / SECTION_FRAMES), FOLDERS.length - 1);
  const localIdx = Math.min(SECTION_FRAMES - 1, Math.floor(frameNum % SECTION_FRAMES));

  drawCurrentFrame(folderIdx, localIdx);

  // Update telemetry frame display
  const paddedIndex = String(frameNum + 1).padStart(3, '0');
  telemetryFrame.textContent = `${paddedIndex} / ${TOTAL_GLOBAL_FRAMES}`;

  requestAnimationFrame(renderLoop);
}

// ==========================================================================
// 4. NAVIGATION & SMOOTH SCROLL HANDLERS
// ==========================================================================
function setupNavigation() {
  function scrollToSection(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    
    // Position target cleanly in viewport
    const offset = el.offsetTop;
    window.scrollTo({
      top: offset,
      behavior: 'smooth',
    });
  }

  navPills.forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = pill.getAttribute('data-target');
      scrollToSection(targetId);
    });
  });

  scrollTriggers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      scrollToSection(targetId);
    });
  });

  document.getElementById('brand-link').addEventListener('click', (e) => {
    e.preventDefault();
    scrollToSection('sec-1');
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      // Allow natural scroll
    } else if (e.key === 'Home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (e.key === 'End') {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
  });
}

// ==========================================================================
// 5. AMBIENT IRON ATMOSPHERE (SYNTHESIZED WEB AUDIO)
// ==========================================================================
let audioCtx = null;
let isAudioActive = false;
let masterGain = null;

function toggleAtmosphereAudio() {
  if (!audioCtx) {
    initAudioEngine();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  isAudioActive = !isAudioActive;

  if (isAudioActive) {
    masterGain.gain.setTargetAtTime(0.18, audioCtx.currentTime, 0.4);
    audioState.textContent = 'ONLINE';
    audioToggle.classList.add('audio-active');
  } else {
    masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.4);
    audioState.textContent = 'MUTED';
    audioToggle.classList.remove('audio-active');
  }
}

function initAudioEngine() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();

  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  masterGain.connect(audioCtx.destination);

  // Sub-bass resonant drone (55Hz)
  const subOsc = audioCtx.createOscillator();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(55, audioCtx.currentTime);

  const subFilter = audioCtx.createBiquadFilter();
  subFilter.type = 'lowpass';
  subFilter.frequency.setValueAtTime(90, audioCtx.currentTime);

  subOsc.connect(subFilter);
  subFilter.connect(masterGain);
  subOsc.start();

  // Subtle acoustic gym air / ambient presence
  const bufferSize = audioCtx.sampleRate * 2;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = audioCtx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;

  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(220, audioCtx.currentTime);
  bandpass.Q.setValueAtTime(3.0, audioCtx.currentTime);

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.04, audioCtx.currentTime);

  whiteNoise.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(masterGain);
  whiteNoise.start();
}

// ==========================================================================
// 6. MEMBERSHIP MODAL
// ==========================================================================
function setupModal() {
  function openModal() {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }

  inquiryBtn.addEventListener('click', openModal);
  if (ctaFinal) ctaFinal.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  if (membershipForm) {
    membershipForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('m-submit');
      submitBtn.style.display = 'none';
      formSuccess.style.display = 'block';

      setTimeout(() => {
        closeModal();
        setTimeout(() => {
          membershipForm.reset();
          submitBtn.style.display = 'inline-flex';
          formSuccess.style.display = 'none';
        }, 400);
      }, 2500);
    });
  }
}

// ==========================================================================
// 7. INITIALIZATION
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
  resizeCanvas();
  preloadFrames();
  setupNavigation();
  setupModal();

  audioToggle.addEventListener('click', toggleAtmosphereAudio);

  window.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', () => {
    resizeCanvas();
    updateScrollState();
  });

  // Initial trigger
  updateScrollState();
  requestAnimationFrame(renderLoop);
});
