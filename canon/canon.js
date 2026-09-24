/**
 * Canon — See Impossible.
 * Master JS: Opening entrance, scroll-driven intro canvas,
 * auto-scroll product carousel, looping craft canvas.
 */

// ═══════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════
const CFG = {
  opening: { total: 120, fps: 50, path: (i) => `./canon/opening/ezgif-frame-${String(i+1).padStart(3,'0')}.jpg` },
  intro:   { total: 240, path: (i) => `./canon/intro/ezgif-frame-${String(i+1).padStart(3,'0')}.jpg` },
  craft:   { total: 300, fps: 30, path: (i) => `./canon/4th/ezgif-frame-${String(i+1).padStart(3,'0')}.jpg` },
};

const PRODUCTS = [
  { id: 1, name: 'EOS M10', series: 'Mirrorless · EF-M', specs: ['24.2MP','Wi-Fi','1080p'], price: '$549', img: './canon/carousel/1.png' },
  { id: 2, name: 'EOS 60D', series: 'DSLR · EF-S', specs: ['18MP','3" Vari-Angle','Full HD'], price: '$749', img: './canon/carousel/2.png' },
  { id: 3, name: 'EOS 60D MkII', series: 'DSLR Pro · EF-S', specs: ['24.1MP','Dual AF','Full HD'], price: '$899', img: './canon/carousel/3.png' },
  { id: 4, name: 'EOS R', series: 'Full-Frame · RF', specs: ['30.3MP','Dual Pixel AF','4K'], price: '$1,799', img: './canon/carousel/4.png' },
  { id: 5, name: 'EOS R5', series: 'Full-Frame Pro · RF', specs: ['45MP','8K RAW','IBIS'], price: '$3,899', img: './canon/carousel/5.png' },
  { id: 6, name: 'EOS R3', series: 'Speed Demon · RF', specs: ['24.1MP','30fps','Eye-CF'], price: '$5,999', img: './canon/carousel/6.png' },
];

// ═══════════════════════════════════════════
// IMAGE CACHE HELPER
// ═══════════════════════════════════════════
function loadImages(total, pathFn, onProgress) {
  const cache = new Array(total);
  let loaded = 0;
  return new Promise((resolve) => {
    for (let i = 0; i < total; i++) {
      const img = new Image();
      img.src = pathFn(i);
      img.onload = img.onerror = () => {
        loaded++;
        onProgress?.(loaded / total);
        if (loaded === total) resolve(cache);
      };
      cache[i] = img;
    }
  });
}

// Aspect-cover draw
function drawCover(ctx, img, w, h) {
  if (!img || !img.complete || !img.naturalWidth) return;
  const iR = img.naturalWidth / img.naturalHeight;
  const cR = w / h;
  let rw, rh, ox, oy;
  if (cR > iR) { rw = w; rh = w / iR; ox = 0; oy = (h - rh) / 2; }
  else          { rh = h; rw = h * iR; ox = (w - rw) / 2; oy = 0; }
  ctx.drawImage(img, ox, oy, rw, rh);
}

// Resize canvas to device pixel ratio
function setCanvasSize(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.offsetWidth || window.innerWidth;
  const h = canvas.offsetHeight || window.innerHeight;
  canvas.width  = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.setTransform(1,0,0,1,0,0);
  ctx.scale(dpr, dpr);
  return ctx;
}

// ═══════════════════════════════════════════
// 1. OPENING ENTRANCE ANIMATION
//    120 frames auto-play at ~50fps → ~2.4s
// ═══════════════════════════════════════════
const openingEl   = document.getElementById('opening-screen');
const openingCvs  = document.getElementById('opening-canvas');
const openingBrand = document.getElementById('opening-brand');
const openingSkip = document.getElementById('opening-skip');

let openingCtx, openingFrames, openingFrame = 0, openingRaf;
let openingDone = false;

function runOpeningAnimation() {
  openingCtx = setCanvasSize(openingCvs);
  const w = window.innerWidth, h = window.innerHeight;

  const interval = 1000 / CFG.opening.fps;
  let last = 0;

  function tick(ts) {
    if (openingDone) return;
    if (ts - last >= interval) {
      last = ts;
      openingCtx.clearRect(0, 0, w, h);
      drawCover(openingCtx, openingFrames[openingFrame], w, h);

      // Show brand text at 60% through the animation
      if (openingFrame === Math.floor(CFG.opening.total * 0.6)) {
        openingBrand.classList.add('visible');
      }

      openingFrame++;
      if (openingFrame >= CFG.opening.total) {
        dismissOpening();
        return;
      }
    }
    openingRaf = requestAnimationFrame(tick);
  }
  openingRaf = requestAnimationFrame(tick);
}

function dismissOpening() {
  if (openingDone) return;
  openingDone = true;
  cancelAnimationFrame(openingRaf);
  openingEl.classList.add('dismissed');
  // Reveal nav after 400ms
  setTimeout(() => {
    document.getElementById('site-nav').classList.add('visible');
    startIntroSystem();
    startCraftLoop();
  }, 400);
  // Remove from DOM after transition
  setTimeout(() => openingEl.remove(), 1000);
}

openingSkip.addEventListener('click', dismissOpening);

// Load opening frames then start
loadImages(CFG.opening.total, CFG.opening.path, (p) => {
  // First frame renders immediately
}).then(frames => {
  openingFrames = frames;
  // Draw first frame right away
  openingCtx = setCanvasSize(openingCvs);
  drawCover(openingCtx, openingFrames[0], window.innerWidth, window.innerHeight);
  runOpeningAnimation();
});

// ═══════════════════════════════════════════
// 2. INTRO SCROLL CANVAS (Sections 1 & 2)
//    Frames scrub based on scroll position
//    through the 400vh scroll-zone
// ═══════════════════════════════════════════
const introCvs    = document.getElementById('intro-canvas');
const scrollZone  = document.getElementById('scroll-zone');
const heroContent = document.getElementById('hero-content');
const exploreContent = document.getElementById('explore-content');
const navEl       = document.getElementById('site-nav');

let introCtx, introFrames;
let currentIntroFrame = 0, targetIntroFrame = 0;
let introRafRunning = false;

function startIntroSystem() {
  // Load intro frames
  loadImages(CFG.intro.total, CFG.intro.path).then(frames => {
    introFrames = frames;
    introCtx = setCanvasSize(introCvs);
    drawCover(introCtx, introFrames[0], window.innerWidth, window.innerHeight);
    window.addEventListener('scroll', onIntroScroll, { passive: true });
    onIntroScroll(); // initial state
    requestAnimationFrame(introRenderLoop);
    introRafRunning = true;
  });
}

function onIntroScroll() {
  const scrollY = window.scrollY;
  const zoneTop   = scrollZone.offsetTop;
  const zoneH     = scrollZone.offsetHeight; // 400vh
  const relScroll = scrollY - zoneTop;
  const totalScrollRange = zoneH - window.innerHeight;
  const t = Math.min(1, Math.max(0, relScroll / totalScrollRange));

  // Map t → frame index across all 240 frames
  targetIntroFrame = Math.floor(t * (CFG.intro.total - 1));

  // ── Section content opacity ──
  // Hero fades out from t=0.25 → t=0.45
  const heroOp = Math.max(0, 1 - (t - 0.18) / 0.22);
  const heroY  = -Math.min(40, t * 80);
  heroContent.style.opacity  = heroOp.toFixed(3);
  heroContent.style.transform = `translateY(${heroY}px)`;

  // Explore fades in from t=0.45 → t=0.65
  const explOp = Math.min(1, Math.max(0, (t - 0.45) / 0.2));
  const explY  = Math.max(0, (1 - explOp) * 40);
  exploreContent.style.opacity  = explOp.toFixed(3);
  exploreContent.style.transform = `translateY(${explY}px)`;

  // Scrolled nav style
  if (scrollY > 80) navEl.classList.add('scrolled');
  else              navEl.classList.remove('scrolled');
}

function introRenderLoop() {
  // Smooth lerp toward target
  const diff = targetIntroFrame - currentIntroFrame;
  if (Math.abs(diff) > 0.05) {
    currentIntroFrame += diff * 0.14;
  } else {
    currentIntroFrame = targetIntroFrame;
  }

  if (introFrames) {
    const idx = Math.round(currentIntroFrame);
    const w = window.innerWidth, h = window.innerHeight;
    introCtx.clearRect(0, 0, w, h);
    drawCover(introCtx, introFrames[Math.min(idx, CFG.intro.total - 1)], w, h);
  }

  requestAnimationFrame(introRenderLoop);
}

// ═══════════════════════════════════════════
// 3. PRODUCT CAROUSEL
//    Auto-scrolls left→right infinitely
//    + drag interaction + dot indicators
// ═══════════════════════════════════════════
const track = document.getElementById('carousel-track');
const dotsEl = document.getElementById('carousel-dots');

// Build carousel cards × 2 for seamless infinite loop
function buildCarousel() {
  const allProducts = [...PRODUCTS, ...PRODUCTS]; // doubled
  allProducts.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${p.img}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="card-name">${p.name}</div>
      <div class="card-series">${p.series}</div>
      <div class="card-specs">
        ${p.specs.map(s => `<span class="card-spec-tag">${s}</span>`).join('')}
      </div>
      <div class="card-price">${p.price}</div>
      <a href="#" class="card-buy">Buy Now</a>
    `;
    track.appendChild(card);
  });

  // Dots for the real 6 products
  PRODUCTS.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'c-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to product ${i+1}`);
    dot.addEventListener('click', () => goToCard(i));
    dotsEl.appendChild(dot);
  });
}

buildCarousel();

// Auto-scroll state
let carouselX = 0;
let carouselVelocity = 0.8; // px per frame
const CARD_W  = () => track.children[0]?.offsetWidth + 32 || 300; // card width + gap
const HALF_W  = () => CARD_W() * PRODUCTS.length;

let isDragging = false;
let dragStartX = 0, dragStartCarouselX = 0;

track.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStartX = e.clientX;
  dragStartCarouselX = carouselX;
  carouselVelocity = 0;
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  carouselX = dragStartCarouselX - (e.clientX - dragStartX);
});

window.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    carouselVelocity = 0.8; // resume auto
  }
});

// Touch support
track.addEventListener('touchstart', (e) => {
  isDragging = true;
  dragStartX = e.touches[0].clientX;
  dragStartCarouselX = carouselX;
  carouselVelocity = 0;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  carouselX = dragStartCarouselX - (e.touches[0].clientX - dragStartX);
}, { passive: true });

window.addEventListener('touchend', () => {
  isDragging = false;
  carouselVelocity = 0.8;
});

function goToCard(index) {
  carouselX = CARD_W() * index;
  updateDots(index);
}

function updateDots(activeDotIdx) {
  dotsEl.querySelectorAll('.c-dot').forEach((d, i) => {
    d.classList.toggle('active', i === activeDotIdx % PRODUCTS.length);
  });
}

function carouselLoop() {
  if (!isDragging) {
    carouselX += carouselVelocity;
  }

  // Seamless loop: when passed halfway, jump back
  const half = HALF_W();
  if (carouselX >= half) carouselX -= half;
  if (carouselX < 0)     carouselX += half;

  track.style.transform = `translateX(${-carouselX}px)`;

  // Update active dot
  const cw = CARD_W();
  const idx = Math.round(carouselX / cw) % PRODUCTS.length;
  updateDots(idx);

  requestAnimationFrame(carouselLoop);
}
requestAnimationFrame(carouselLoop);

// ═══════════════════════════════════════════
// 4. CRAFT SECTION — Looping frame animation
//    300 frames loop at ~30fps on right half
// ═══════════════════════════════════════════
const craftCvs = document.getElementById('craft-canvas');
const craftContent = document.getElementById('craft-content');
let craftCtx, craftFrames, craftFrame = 0;

function startCraftLoop() {
  loadImages(CFG.craft.total, CFG.craft.path).then(frames => {
    craftFrames = frames;
    craftCtx = setCanvasSize(craftCvs);
    drawCover(craftCtx, craftFrames[0],
      craftCvs.offsetWidth, craftCvs.offsetHeight);

    // Animate loop
    const interval = 1000 / CFG.craft.fps;
    let lastTs = 0;

    function loop(ts) {
      if (ts - lastTs >= interval) {
        lastTs = ts;
        const w = craftCvs.offsetWidth, h = craftCvs.offsetHeight;
        craftCtx.clearRect(0, 0, w, h);
        drawCover(craftCtx, craftFrames[craftFrame], w, h);
        craftFrame = (craftFrame + 1) % CFG.craft.total;
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });

  // Craft content animate-in on scroll into view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        craftContent.style.opacity = '1';
        craftContent.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.2 });
  observer.observe(craftContent);

  // Initial state hidden
  craftContent.style.opacity = '0';
  craftContent.style.transform = 'translateY(30px)';
  craftContent.style.transition = 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)';
}

// ═══════════════════════════════════════════
// 5. RESIZE HANDLER
// ═══════════════════════════════════════════
window.addEventListener('resize', () => {
  if (openingCtx && !openingDone) {
    openingCtx = setCanvasSize(openingCvs);
  }
  if (introCtx && introFrames) {
    introCtx = setCanvasSize(introCvs);
  }
  if (craftCtx && craftFrames) {
    craftCtx = setCanvasSize(craftCvs);
  }
});

// ═══════════════════════════════════════════
// 6. HERO EXPLORE BUTTON SCROLL
// ═══════════════════════════════════════════
document.getElementById('hero-explore-btn')?.addEventListener('click', (e) => {
  e.preventDefault();
  const half = scrollZone.offsetHeight / 2;
  window.scrollTo({ top: scrollZone.offsetTop + half, behavior: 'smooth' });
});
