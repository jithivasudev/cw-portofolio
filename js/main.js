/**
 * Christian Wulff Portfolio
 * @author Jitheesh Vasudevan
 */

document.addEventListener('DOMContentLoaded', () => {
  initSplashScreen();
  initAboutSignature();
  initNavigation();
  initScrollReveal();
  initTypedText();
  initCounters();
  initSkillBars();
  initContactForm();
});

/* Signature Splash Screen */
const SIGNATURE_VIEWBOX = { width: 1024, height: 674 };
const SIGNATURE_STROKE_WIDTH = 20;

function buildSignaturePathData(pathD) {
  const coords = pathD.replace(/[ML]/g, ' ').trim().split(/\s+/).map(Number);
  const points = [];
  for (let i = 0; i < coords.length; i += 2) {
    points.push([coords[i], coords[i + 1]]);
  }

  const segLengths = [0];
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    segLengths.push(total);
  }

  return { points, segLengths, total };
}

function signaturePathAtLength(data, length) {
  const { points, segLengths, total } = data;
  if (!points.length) return { d: '', pen: [0, 0] };
  if (length <= 0) return { d: `M ${points[0][0]} ${points[0][1]}`, pen: points[0] };
  if (length >= total) {
    return { d: SIGNATURE_PATH, pen: points[points.length - 1] };
  }

  let index = 1;
  while (index < segLengths.length && segLengths[index] < length) index += 1;

  const startLength = segLengths[index - 1];
  const segmentLength = segLengths[index] - startLength;
  const fraction = segmentLength > 0 ? (length - startLength) / segmentLength : 0;
  const [x0, y0] = points[index - 1];
  const [x1, y1] = points[index];
  const pen = [x0 + (x1 - x0) * fraction, y0 + (y1 - y0) * fraction];

  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < index; i += 1) {
    d += ` L ${points[i][0]} ${points[i][1]}`;
  }
  d += ` L ${pen[0]} ${pen[1]}`;

  return { d, pen };
}

function initSplashScreen() {
  const splash = document.getElementById('splash');
  const canvas = document.getElementById('splash-canvas');
  const pen = document.getElementById('splash-pen');
  if (!splash || !canvas || typeof SIGNATURE_PATH === 'undefined') return;

  const ctx = canvas.getContext('2d');
  const pathData = buildSignaturePathData(SIGNATURE_PATH);
  const pathLength = pathData.total || SIGNATURE_LENGTH || 0;
  const signatureImage = new Image();
  signatureImage.decoding = 'async';
  signatureImage.src = 'assets/signature.png';

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = SIGNATURE_VIEWBOX.width;
  maskCanvas.height = SIGNATURE_VIEWBOX.height;
  const maskCtx = maskCanvas.getContext('2d');
  maskCtx.lineWidth = SIGNATURE_STROKE_WIDTH;
  maskCtx.lineCap = 'round';
  maskCtx.lineJoin = 'round';
  maskCtx.strokeStyle = '#fff';

  if (pen && typeof SIGNATURE_START !== 'undefined') {
    pen.setAttribute('cx', SIGNATURE_START[0]);
    pen.setAttribute('cy', SIGNATURE_START[1]);
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nameRevealDuration = prefersReducedMotion ? 0 : 600;
  const nameHoldDuration = prefersReducedMotion ? 100 : 350;
  const drawDuration = prefersReducedMotion ? 0 : 2600;
  const holdDuration = prefersReducedMotion ? 150 : 300;
  const fadeDuration = prefersReducedMotion ? 150 : 400;

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const resizeCanvas = () => {
    const art = canvas.parentElement;
    if (!art) return;

    const rect = art.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  };

  const paintSignature = (drawnLength) => {
    const { d, pen: penPoint } = signaturePathAtLength(pathData, drawnLength);
    if (!d) return;

    maskCtx.clearRect(0, 0, SIGNATURE_VIEWBOX.width, SIGNATURE_VIEWBOX.height);
    maskCtx.stroke(new Path2D(d));

    const dpr = window.devicePixelRatio || 1;
    const scaleX = canvas.width / SIGNATURE_VIEWBOX.width;
    const scaleY = canvas.height / SIGNATURE_VIEWBOX.height;

    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    ctx.clearRect(0, 0, SIGNATURE_VIEWBOX.width, SIGNATURE_VIEWBOX.height);
    ctx.drawImage(signatureImage, 0, 0, SIGNATURE_VIEWBOX.width, SIGNATURE_VIEWBOX.height);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    if (pen) {
      pen.setAttribute('cx', penPoint[0]);
      pen.setAttribute('cy', penPoint[1]);
    }
  };

  const finishSplash = () => {
    splash.classList.add('splash--revealed');
    splash.classList.remove('splash--drawing');

    setTimeout(() => {
      splash.classList.add('splash--hidden');
      document.body.classList.remove('splash-active');
      document.body.classList.add('page-revealed');
      revealHeroContent();

      setTimeout(() => splash.remove(), fadeDuration);
    }, holdDuration);
  };

  const revealSignatureImmediately = () => {
    paintSignature(pathLength);
    splash.classList.add('splash--drawing', 'splash--revealed');
    finishSplash();
  };

  const startSignatureDraw = () => {
    splash.classList.add('splash--drawing');
    resizeCanvas();

    if (!pathLength) {
      revealSignatureImmediately();
      return;
    }

    if (!signatureImage.complete || signatureImage.naturalWidth === 0) {
      revealSignatureImmediately();
      return;
    }

    paintSignature(0);

    if (prefersReducedMotion) {
      paintSignature(pathLength);
      splash.classList.add('splash--revealed');
      finishSplash();
      return;
    }

    const start = performance.now();

    const tick = (now) => {
      const t = Math.min((now - start) / drawDuration, 1);
      const progress = easeOutCubic(t);
      paintSignature(pathLength * progress);

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        finishSplash();
      }
    };

    requestAnimationFrame(tick);
  };

  const scheduleDraw = () => {
    requestAnimationFrame(() => {
      splash.classList.add('splash--name-visible');
    });

    setTimeout(startSignatureDraw, nameRevealDuration + nameHoldDuration);
  };

  if (signatureImage.complete) {
    scheduleDraw();
  } else {
    signatureImage.addEventListener('load', scheduleDraw, { once: true });
    signatureImage.addEventListener('error', scheduleDraw, { once: true });
  }

  window.addEventListener('resize', resizeCanvas, { passive: true });
}

function initAboutSignature() {
  const path = document.getElementById('about-signature-path');
  if (!path || typeof SIGNATURE_PATH === 'undefined') return;

  path.setAttribute('d', SIGNATURE_PATH);
}

function revealHeroContent() {
  const heroReveals = document.querySelectorAll('.hero .reveal');
  heroReveals.forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), i * 100);
  });
}

/* Navigation */
function initNavigation() {
  const header = document.getElementById('header');
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav__link');

  window.addEventListener('scroll', () => {
    header.classList.toggle('header--scrolled', window.scrollY > 50);
  });

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('show');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navMenu.classList.remove('show');
    });
  });

  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 100;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  });
}

/* Scroll Reveal */
function initScrollReveal() {
  const reveals = [...document.querySelectorAll('.reveal')].filter(
    (el) => !el.closest('.hero')
  );
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  reveals.forEach(el => observer.observe(el));
}

/* Typed Text */
function initTypedText() {
  const el = document.getElementById('typed-text');
  if (!el) return;

  const phrases = [
    'operational excellence',
    'financial restructuring',
    'software team leadership',
    'strategic innovation',
    'global business dynamics',
  ];
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function type() {
    const current = phrases[phraseIndex];
    if (isDeleting) {
      el.textContent = current.substring(0, charIndex - 1);
      charIndex--;
    } else {
      el.textContent = current.substring(0, charIndex + 1);
      charIndex++;
    }

    let delay = isDeleting ? 40 : 80;

    if (!isDeleting && charIndex === current.length) {
      delay = 2000;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 400;
    }

    setTimeout(type, delay);
  }

  type();
}

/* Counters */
function initCounters() {
  const counters = document.querySelectorAll('.stat__number[data-count]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        let current = 0;
        const step = Math.ceil(target / 40);
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            el.textContent = target;
            clearInterval(timer);
          } else {
            el.textContent = current;
          }
        }, 30);
        observer.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach(el => observer.observe(el));
}

/* Skill Bars */
function initSkillBars() {
  const fills = document.querySelectorAll('.skill-card__fill[data-width]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.style.width = `${entry.target.dataset.width}%`;
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.3 }
  );
  fills.forEach(el => observer.observe(el));
}

/* Contact Form */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Message Sent!';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
      form.reset();
    }, 2500);
  });
}
