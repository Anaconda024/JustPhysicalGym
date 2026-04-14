/* ────────────────────────────────────────────
       CONFIG — add/remove images in this array.
       Supports up to 23+ images.
    ─────────────────────────────────────────────*/
    const SLIDES = [
      'images/ImageCollection1/black-white-photo-muscular.jpg',
      'images/ImageCollection1/black-white-photo-athletic-people.jpg',
      'images/ImageCollection1/Chris-Chapman_3719-scaled.jpg',
      // Add more paths here…
    ];

    const AUTO_MS   = 6500;   // ms between auto-advances
    const SLIDE_DUR = 700;    // must match CSS --dur-slide (approx)
    const ADVANCE_P = 90;     // percentage of vw per advance step

    /* ────────────────────────────────────────────
       STATE
    ─────────────────────────────────────────────*/
    let currentIdx  = 0;
    let isAnimating = false;
    let autoTimer   = null;
    let touchStartX = 0;
    let touchStartY = 0;

    const N = SLIDES.length;

    /* ────────────────────────────────────────────
       ELEMENTS
    ─────────────────────────────────────────────*/
    const track      = document.getElementById('sliderTrack');
    const dividerEl  = document.getElementById('sliderDivider');
    const indicorsEl = document.getElementById('indicators');
    const peekZoneEl = document.getElementById('peekZone');
    const hamburger  = document.getElementById('hamburger');
    const drawer     = document.getElementById('mobileDrawer');
    const navEl      = document.getElementById('mainNav');

    /* ────────────────────────────────────────────
       BUILD SLIDER
       Each slide is positioned at: left = i * ADVANCE_P vw
       Z-index is higher for later slides so the "next"
       slide always sits on top in the peek zone.
    ─────────────────────────────────────────────*/
    function buildSlider() {
      // Preload all images silently
      SLIDES.forEach(src => {
        const img = new Image();
        img.src = src;
      });

      // Create slide elements
      SLIDES.forEach((src, i) => {
        const div = document.createElement('div');
        div.className     = 'slider__slide';
        div.style.backgroundImage = `url('${src}')`;
        div.style.left    = `calc(${i} * ${ADVANCE_P}vw)`;
        div.style.zIndex  = i + 1;
        div.setAttribute('role', 'group');
        div.setAttribute('aria-roledescription', 'slide');
        div.setAttribute('aria-label', `Slide ${i + 1} of ${N}`);
        track.appendChild(div);
      });

      // Create indicators
      SLIDES.forEach((_, i) => {
        const btn = document.createElement('button');
        const active = i === 0;
        btn.className           = `indicators__pip ${active ? 'indicators__pip--active' : 'indicators__pip--inactive'}`;
        btn.setAttribute('role',          'tab');
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
        btn.setAttribute('aria-label',    `Go to slide ${i + 1}`);
        btn.dataset.index       = i;
        btn.addEventListener('click', () => goTo(i));
        indicorsEl.appendChild(btn);
      });

      // Apply initial track position
      setTrackPosition(false);
    }

    /* ────────────────────────────────────────────
       NAVIGATION
    ─────────────────────────────────────────────*/
    function goTo(index) {
      if (isAnimating) return;
      const target = ((index % N) + N) % N;
      if (target === currentIdx) return;

      isAnimating = true;

      // Flash the divider out while animating
      dividerEl.classList.add('is-animating');

      currentIdx = target;
      setTrackPosition(true);
      updateIndicators();

      setTimeout(() => {
        isAnimating = false;
        dividerEl.classList.remove('is-animating');
      }, SLIDE_DUR + 60);

      resetAutoTimer();
    }

    const advance = () => goTo((currentIdx + 1) % N);
    const retreat = () => goTo((currentIdx - 1 + N) % N);

    function setTrackPosition(animate) {
      if (!animate) {
        track.style.transition = 'none';
        void track.offsetHeight; // force reflow
      } else {
        track.style.transition = `transform ${SLIDE_DUR}ms cubic-bezier(0.72, 0.04, 0.28, 1.0)`;
      }
      track.style.transform = `translateX(calc(-${currentIdx} * ${ADVANCE_P}vw))`;
    }

    function updateIndicators() {
      indicorsEl.querySelectorAll('.indicators__pip').forEach((btn, i) => {
        const active = i === currentIdx;
        btn.className           = `indicators__pip ${active ? 'indicators__pip--active' : 'indicators__pip--inactive'}`;
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    /* ────────────────────────────────────────────
       AUTO-ADVANCE
    ─────────────────────────────────────────────*/
    function startAutoTimer() {
      autoTimer = setInterval(advance, AUTO_MS);
    }

    function resetAutoTimer() {
      clearInterval(autoTimer);
      startAutoTimer();
    }

    // Pause on hover over hero
    document.getElementById('hero').addEventListener('mouseenter', () => clearInterval(autoTimer));
    document.getElementById('hero').addEventListener('mouseleave', startAutoTimer);

    /* ────────────────────────────────────────────
       TOUCH / SWIPE
    ─────────────────────────────────────────────*/
    const heroEl = document.getElementById('hero');

    heroEl.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    heroEl.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].screenX - touchStartX;
      const dy = e.changedTouches[0].screenY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 42) {
        dx < 0 ? advance() : retreat();
      }
    }, { passive: true });

    /* ────────────────────────────────────────────
       PEEK ZONE INTERACTION
    ─────────────────────────────────────────────*/
    peekZoneEl.addEventListener('click', advance);
    peekZoneEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advance();
      }
    });

    /* ────────────────────────────────────────────
       KEYBOARD NAVIGATION
    ─────────────────────────────────────────────*/
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') advance();
      if (e.key === 'ArrowLeft')  retreat();
    });

    /* ────────────────────────────────────────────
       HAMBURGER / MOBILE DRAWER
    ─────────────────────────────────────────────*/
    hamburger.addEventListener('click', () => {
      const isOpen = navEl.classList.toggle('nav--open');
      hamburger.setAttribute('aria-expanded', String(isOpen));

      if (isOpen) {
        drawer.style.display = 'flex';
        requestAnimationFrame(() => drawer.classList.add('is-open'));
      } else {
        drawer.classList.remove('is-open');
        setTimeout(() => { drawer.style.display = 'none'; }, 320);
      }
    });

    drawer.querySelectorAll('.nav__drawer-link').forEach(link => {
      link.addEventListener('click', () => {
        navEl.classList.remove('nav--open');
        hamburger.setAttribute('aria-expanded', 'false');
        drawer.classList.remove('is-open');
        setTimeout(() => { drawer.style.display = 'none'; }, 320);
      });
    });

    /* ────────────────────────────────────────────
       INIT
    ─────────────────────────────────────────────*/
    buildSlider();
    startAutoTimer();
  /* ════════════════════════════════════════════
     PRICING SECTION — SCROLL REVEAL
  ════════════════════════════════════════════ */
  (function initPricingReveal() {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const pricingHeader = document.getElementById('pricingHeader');
    if (pricingHeader) revealObserver.observe(pricingHeader);

    document.querySelectorAll('.pricing-card').forEach(card => {
      revealObserver.observe(card);
    });
  })();