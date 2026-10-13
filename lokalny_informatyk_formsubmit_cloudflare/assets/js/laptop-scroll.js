/* Progressive, scroll-driven hardware illustration; no dependencies or network requests. */
(() => {
  'use strict';
  const section = document.querySelector('[data-laptop-scroll]');
  if (!section) return;
  const stage = section.querySelector('[data-laptop-stage]');
  const steps = Array.from(section.querySelectorAll('[data-laptop-step]'));
  const counter = section.querySelector('[data-laptop-counter]');
  const bar = section.querySelector('[data-laptop-bar]');
  if (!stage || steps.length !== 4) return;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pending = false;
  let visible = true;
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = (from, to, value) => {
    const x = clamp((value - from) / (to - from));
    return x * x * (3 - 2 * x);
  };
  function setProgress(cover, parts, cooling, progress, selected) {
    stage.style.setProperty('--li-cover', cover.toFixed(4));
    stage.style.setProperty('--li-parts', parts.toFixed(4));
    stage.style.setProperty('--li-cooling', cooling.toFixed(4));
    if (bar) bar.style.transform = `scaleX(${progress.toFixed(4)})`;
    if (counter) counter.textContent = `0${selected + 1} / 04`;
    steps.forEach((step, index) => step.classList.toggle('is-current', selected === index));
  }
  function update() {
    pending = false;
    if (motionQuery.matches) {
      setProgress(1, 1, 1, 1, 3);
      return;
    }
    if (!visible) return;
    const anchor = window.innerHeight * (window.innerWidth < 760 ? .68 : .49);
    const centers = steps.map(step => {
      const rect = step.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });
    const progress = clamp((anchor - centers[0]) / Math.max(1, centers[centers.length - 1] - centers[0]));
    // Keyboard lifts first; RAM and SSD float next; cooling follows last.
    const cover = smooth(.04, .41, progress);
    const parts = smooth(.25, .75, progress);
    const cooling = smooth(.55, 1, progress);
    const closest = centers.reduce((best, center, index) => Math.abs(center - anchor) < Math.abs(centers[best] - anchor) ? index : best, 0);
    setProgress(cover, parts, cooling, progress, closest);
  }
  function queue() {
    if (!pending) {
      pending = true;
      window.requestAnimationFrame(update);
    }
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) queue();
    }, { rootMargin: '140% 0px 140% 0px', threshold: 0 });
    observer.observe(section);
  }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', queue);
  else motionQuery.addListener(queue);
  queue();
})();
