import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface PinnedSectionProps {
  id: string;
  headline: string[];
  subheadline: string;
  cta: string;
  caption: string;
  image: string;
  alt: string;
  imageWidth: number;
  imageHeight: number;
  zIndex: number;
  endOffset?: string;
  ctaAction?: () => void;
}

export default function PinnedSection({
  id,
  headline,
  subheadline,
  cta,
  caption,
  image,
  alt,
  imageWidth,
  imageHeight,
  zIndex,
  endOffset = '+=130%',
  ctaAction,
}: PinnedSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Respect reduced-motion: skip the pinned parallax/scroll timeline entirely.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: endOffset,
          pin: true,
          scrub: 0.6,
        },
      });

      // ENTRANCE (0-30%)
      // Background entrance
      scrollTl.fromTo(
        bgRef.current,
        { scale: 1.12, opacity: 0.6 },
        { scale: 1, opacity: 1, ease: 'none' },
        0
      );

      // Headline entrance
      scrollTl.fromTo(
        headlineRef.current,
        { x: '-50vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0
      );

      // Subheadline entrance
      scrollTl.fromTo(
        subheadlineRef.current,
        { y: '10vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'power2.out' },
        0.1
      );

      // CTA entrance
      scrollTl.fromTo(
        ctaRef.current,
        { y: '10vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'power2.out' },
        0.12
      );

      // Caption entrance
      scrollTl.fromTo(
        captionRef.current,
        { x: '10vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0.15
      );

      // SETTLE (30-70%): Elements hold position - no animation needed

      // EXIT (70-100%)
      // Headline exit
      scrollTl.fromTo(
        headlineRef.current,
        { x: 0, opacity: 1 },
        { x: '-18vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      // Subheadline exit
      scrollTl.fromTo(
        subheadlineRef.current,
        { y: 0, opacity: 1 },
        { y: '8vh', opacity: 0, ease: 'power2.in' },
        0.72
      );

      // CTA exit
      scrollTl.fromTo(
        ctaRef.current,
        { y: 0, opacity: 1 },
        { y: '8vh', opacity: 0, ease: 'power2.in' },
        0.74
      );

      // Caption exit
      scrollTl.fromTo(
        captionRef.current,
        { x: 0, opacity: 1 },
        { x: '8vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      // Background exit
      scrollTl.fromTo(
        bgRef.current,
        { scale: 1 },
        { scale: 1.05, ease: 'none' },
        0.7
      );
    }, section);

    return () => ctx.revert();
  }, [endOffset]);

  return (
    <section
      ref={sectionRef}
      id={id}
      className="section-pinned"
      style={{ zIndex }}
      aria-label={headline.join(' ')}
    >
      {/* Background Image (below the fold: lazy + blur-up placeholder) */}
      <img
        ref={bgRef}
        src={image}
        alt={alt}
        width={imageWidth}
        height={imageHeight}
        loading="lazy"
        decoding="async"
        onLoad={() => setImageLoaded(true)}
        className={`bg-image img-blur-up${imageLoaded ? ' is-loaded' : ''}`}
      />

      {/* Scrims for text readability over photography */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-[6vw]">
        {/* Headline */}
        <div
          ref={headlineRef}
          className="absolute left-[6vw] top-[16vh] md:top-[18vh] w-[88vw] md:w-[44vw]"
        >
          <h2 className="headline-xl text-white text-overlay-shadow">
            {headline.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h2>
        </div>

        {/* Subheadline */}
        <p
          ref={subheadlineRef}
          className="absolute left-[6vw] top-[52vh] w-[88vw] md:w-[30vw] text-white text-base md:text-lg leading-relaxed text-overlay-shadow"
        >
          {subheadline}
        </p>

        {/* CTA */}
        {cta && (
          <button
            ref={ctaRef}
            onClick={ctaAction}
            className="cta-button cta-button-dark absolute left-[6vw] top-[66vh]"
          >
            {cta}
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        )}

        {/* Caption (decorative; hidden on small screens) */}
        <div
          ref={captionRef}
          className="hidden md:block absolute right-[4vw] top-[18vh] w-[20vw] text-right"
        >
          <p className="caption-mono text-white/90 leading-relaxed text-overlay-shadow">
            {caption}
          </p>
        </div>
      </div>
    </section>
  );
}
