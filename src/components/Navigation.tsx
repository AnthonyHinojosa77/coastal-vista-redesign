import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { scrollToSection } from '../lib/scroll';

const navTargets = [
  { id: 'showreels', label: 'Work' },
  { id: 'realestate', label: 'Services' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'contact', label: 'Contact' },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
    let ticking = false;

    const updateScrollSpy = () => {
      const mid = window.innerHeight * 0.5;
      // Pinned sections can overlap while one slides over another, so the
      // last matching section in document order is the one visibly on top.
      let current: string | null = null;
      for (const { id } of navTargets) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= mid && rect.bottom >= mid) current = id;
      }
      setActiveId(current);
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollYRef.current;

      // Show/hide based on scroll direction (never hide with the menu open)
      if (scrollingDown && currentScrollY > 100 && !menuOpen) {
        setVisible(false);
      } else {
        setVisible(true);
      }

      // Add background when scrolled
      setScrolled(currentScrollY > 50);
      lastScrollYRef.current = currentScrollY;

      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          updateScrollSpy();
          ticking = false;
        });
      }
    };

    updateScrollSpy();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const goTo = (id: string) => {
    setMenuOpen(false);
    scrollToSection(id);
  };

  // Dark text on the light solid bar once scrolled (or when the mobile menu
  // is open); white text over the hero imagery at the top of the page.
  const onLight = scrolled || menuOpen;
  const tone = onLight ? 'text-[#0B0F17]' : 'text-white';

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <nav
        aria-label="Primary"
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        } ${
          onLight
            ? 'bg-[#F4F6F8]/95 backdrop-blur-md shadow-[0_1px_0_rgba(11,15,23,0.08)]'
            : 'bg-gradient-to-b from-black/50 to-transparent'
        } ${tone}`}
      >
        <div className="flex items-center justify-between px-[4vw] py-4">
          {/* Logo */}
          <button
            onClick={() => {
              setMenuOpen(false);
              window.scrollTo({
                top: 0,
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                  ? 'auto'
                  : 'smooth',
              });
            }}
            className={`font-mono text-xs font-medium tracking-[0.08em] uppercase min-h-[44px] flex items-center hover:opacity-70 transition-opacity ${
              onLight ? '' : 'text-overlay-shadow'
            }`}
          >
            COASTAL VISTA
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-2">
            {navTargets.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => goTo(id)}
                aria-current={activeId === id ? 'location' : undefined}
                className={`nav-link px-3 min-h-[44px] flex items-center ${
                  onLight ? '' : 'text-overlay-shadow'
                } ${activeId === id ? 'opacity-100 underline underline-offset-8 decoration-2 decoration-[#3F8EFC]' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen(open => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden w-11 h-11 flex items-center justify-center"
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>

        {/* Mobile nav menu */}
        {menuOpen && (
          <div
            id="mobile-nav-menu"
            className="md:hidden bg-[#F4F6F8] border-t border-[rgba(11,15,23,0.08)] text-[#0B0F17]"
          >
            <div className="flex flex-col px-[4vw] py-2">
              {navTargets.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => goTo(id)}
                  aria-current={activeId === id ? 'location' : undefined}
                  className={`nav-link min-h-[48px] flex items-center border-b border-[rgba(11,15,23,0.06)] last:border-b-0 ${
                    activeId === id ? 'text-[#3F8EFC]' : ''
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
