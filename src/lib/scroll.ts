/**
 * Smooth-scrolls to a section by id.
 *
 * GSAP-pinned sections live inside a `.pin-spacer` wrapper; scrolling to the
 * spacer's document position lands at the start of the pin, which is what
 * users expect when they click a nav link. Honors prefers-reduced-motion.
 */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth';

  const spacer = el.closest('.pin-spacer');
  if (spacer) {
    const top = spacer.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior });
  } else {
    el.scrollIntoView({ behavior });
  }
}
