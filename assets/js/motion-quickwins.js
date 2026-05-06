/* ==========================================================================
   BENCH STUDIO — Motion Quick Wins (shared JS, vanilla, no bundler)
   - Lenis smooth scroll (with native fallback if CDN fails)
   - IntersectionObserver reveal-on-scroll for [data-reveal]
   - GSAP subtle polish (hero-pattern drift) — optional, no-op if missing
   - prefers-reduced-motion: hard short-circuit (no JS animations)
   ========================================================================== */

(function () {
  'use strict';

  // ---------- 0. Respect user motion preferences ----------
  var reducedMotionMql = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotionMql.matches) {
    // CSS already neutralizes animations; ensure reveal classes are visible too
    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach(function (el) {
        el.classList.add('is-visible');
      });
    });
    return;
  }

  // ---------- 1. Lenis smooth scroll ----------
  function initLenis() {
    if (typeof window.Lenis !== 'function') return false;
    try {
      var lenis = new window.Lenis({
        duration: 1.15,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      });
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      // Hijack same-page anchor links so they smooth-scroll via Lenis
      document.addEventListener('click', function (e) {
        var link = e.target.closest && e.target.closest('a[href^="#"]');
        if (!link) return;
        var hash = link.getAttribute('href');
        if (!hash || hash.length < 2 || hash === '#') return;
        var target = document.querySelector(hash);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -64, duration: 1.4 });
        // Update URL without jumping (preserve good UX of shareable hash)
        if (history.pushState) history.pushState(null, '', hash);
      });

      window.__bsLenis = lenis;
      return true;
    } catch (err) {
      console.warn('[BS motion] Lenis init failed, falling back to native scroll', err);
      return false;
    }
  }

  // ---------- 2. Reveal-on-scroll via IntersectionObserver ----------
  function initRevealObserver() {
    var els = document.querySelectorAll('[data-reveal], [data-reveal-stagger]');
    if (!els.length) return;

    if (typeof IntersectionObserver !== 'function') {
      // Legacy browser: show everything immediately
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.12,
    });

    els.forEach(function (el) { io.observe(el); });
  }

  // ---------- 3. Optional GSAP polish: hero-pattern continuous drift ----------
  function initGsapPolish() {
    if (typeof window.gsap !== 'object' || !window.gsap) return;
    try {
      var pattern = document.querySelector('.hero-pattern');
      if (pattern) {
        // Very subtle (barely perceptible) drift to add "life" to hero bg
        window.gsap.to(pattern, {
          yPercent: 4,
          xPercent: 2,
          duration: 18,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }
      var heroVisual = document.querySelector('.hero-visual, .hero-product');
      if (heroVisual) {
        window.gsap.to(heroVisual, {
          y: -8,
          duration: 4.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }
    } catch (err) {
      console.warn('[BS motion] GSAP polish failed', err);
    }
  }

  // ---------- Boot ----------
  function boot() {
    initLenis();
    initRevealObserver();
    initGsapPolish();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
