import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// This enhancement is deliberately scoped below the approved cinematic hero.
// Content is visible in HTML/CSS even when this bundle is unavailable.
const main = document.querySelector('main');
const media = gsap.matchMedia();
let mounted = false;

function mount() {
  if (!main || mounted) return;
  mounted = true;
  media.add('(prefers-reduced-motion: no-preference)', () => {
    const reveal = (elements, trigger = elements[0]) => {
      if (!elements.length || !trigger) return;
      // Leave already-visible content alone, including restored scroll positions.
      if (trigger.getBoundingClientRect().top < innerHeight * .94) return;
      gsap.from(elements, {
        y: 28, opacity: 0, duration: .85, stagger: .09, ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {trigger, start: 'top 94%', once: true},
      });
    };

    const groups = [
      '.proof-deck-lead > *', '.proof-deck-rail > .deck-stat',
      '.registry-course-copy > *', '.course-map > article',
      '.services-heading > *', '.service-ledger > .service-row',
      '.marine-copy > *', '.journey-head > *', '.journey-steps > article',
      '.pricing-head > *', '.price-v3-grid > article',
      '.tracking-grid > *', '.testimonials-v3 .section-heading > *',
      '.contact-copy > *', '.faq-list > details', '.closing-v3 > *',
    ];
    groups.forEach(selector => {
      const elements = [...main.querySelectorAll(selector)];
      // Individual triggers avoid delaying long stacks on small screens.
      if (innerWidth < 701) elements.forEach(element => reveal([element]));
      else reveal(elements);
    });

    const line = main.querySelector('.journey-line span');
    if (line) gsap.fromTo(line, {scaleX: 0}, {
      scaleX: 1, ease: 'none',
      scrollTrigger: {trigger: '.journey-v3', start: 'top 75%', end: 'bottom 70%', scrub: .5},
    });

    // Small, scroll-linked image movement; no scroll hijacking or pinned content.
    const image = main.querySelector('.marine-feature-v3 .marine-image img');
    if (image && innerWidth > 1000) gsap.fromTo(image, {yPercent: -3, scale: 1.08}, {
      yPercent: 3, scale: 1.08, ease: 'none',
      scrollTrigger: {trigger: '.marine-feature-v3', start: 'top bottom', end: 'bottom top', scrub: .7},
    });

    // Keyboard focus must never land on content waiting for a scroll reveal.
    const showFocused = event => {
      for (const animation of gsap.globalTimeline.getChildren()) {
        if (!animation.scrollTrigger || !animation.targets) continue;
        if (animation.targets().some(target => target === event.target || target.contains?.(event.target))) {
          animation.progress(1);
        }
      }
    };
    main.addEventListener('focusin', showFocused);
    return () => main.removeEventListener('focusin', showFocused);
  }, main);
}

mount();
document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('pagehide', () => { media.revert(); mounted = false; });
window.addEventListener('pageshow', event => { if (event.persisted) { mount(); ScrollTrigger.refresh(); } });
