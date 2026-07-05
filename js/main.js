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
function initSplashScreen() {
  const splash = document.getElementById('splash');
  const path = document.getElementById('signature-path');
  const pen = document.getElementById('splash-pen');
  if (!splash || !path || typeof SIGNATURE_PATH === 'undefined') return;

  path.setAttribute('d', SIGNATURE_PATH);

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

  const measurePathLength = () => {
    const measured = Math.ceil(path.getTotalLength());
    if (measured > 0) return measured;
    if (typeof SIGNATURE_LENGTH === 'number' && SIGNATURE_LENGTH > 0) {
      return Math.ceil(SIGNATURE_LENGTH);
    }
    return 0;
  };

  const setPathDash = (length, offset) => {
    const dash = `${length} ${length}`;
    path.setAttribute('stroke-dasharray', dash);
    path.setAttribute('stroke-dashoffset', String(offset));
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
    const length = measurePathLength();
    if (length > 0) {
      setPathDash(length, 0);
    } else {
      const image = splash.querySelector('.splash__image');
      if (image) image.removeAttribute('mask');
    }
    splash.classList.add('splash--drawing', 'splash--revealed');
    finishSplash();
  };

  const startSignatureDraw = () => {
    splash.classList.add('splash--drawing');

    requestAnimationFrame(() => {
      const length = measurePathLength();
      if (!length) {
        revealSignatureImmediately();
        return;
      }

      setPathDash(length, length);

      if (prefersReducedMotion) {
        setPathDash(length, 0);
        splash.classList.add('splash--revealed');
        finishSplash();
        return;
      }

      const start = performance.now();

      const tick = (now) => {
        const t = Math.min((now - start) / drawDuration, 1);
        const progress = easeOutCubic(t);
        const offset = length * (1 - progress);

        setPathDash(length, offset);

        if (pen) {
          const point = path.getPointAtLength(length * progress);
          pen.setAttribute('cx', point.x);
          pen.setAttribute('cy', point.y);
        }

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          finishSplash();
        }
      };

      requestAnimationFrame(tick);
    });
  };

  requestAnimationFrame(() => {
    splash.classList.add('splash--name-visible');
  });

  setTimeout(startSignatureDraw, nameRevealDuration + nameHoldDuration);
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
