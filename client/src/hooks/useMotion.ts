import { useEffect, useRef, useState } from 'react';
import { useKiosk } from '@/context/KioskContext';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

export function useInView(options?: { threshold?: number; once?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [isVisible, setIsVisible] = useState<boolean>(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setIsVisible(true);
      return;
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (options?.once !== false) {
              observer.unobserve(entry.target);
            }
          }
        }
      },
      {
        threshold: options?.threshold ?? 0.12,
        rootMargin: '0px 0px -24px 0px',
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion, options?.threshold, options?.once]);

  return { ref, isVisible };
}

/**
 * Very light scroll offset for hero visual depth; automatically disabled
 * when prefers-reduced-motion is active or when in Kiosk mode.
 */
export function useLightParallax(maxOffsetPx = 14): number {
  const reducedMotion = usePrefersReducedMotion();
  const { kioskMode } = useKiosk();
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (reducedMotion || kioskMode) {
      setOffset(0);
      return;
    }

    let rafId = 0;
    const update = () => {
      const y = window.scrollY || 0;
      const clamped = Math.min(maxOffsetPx, Math.max(0, y * 0.04));
      setOffset(clamped);
      rafId = 0;
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [reducedMotion, kioskMode, maxOffsetPx]);

  return offset;
}

/**
 * Calm single-run numeric count-up for meaningful process figures.
 * Immediately renders exact target when reduced-motion is enabled.
 */
export function useCountUp(target: number, durationMs = 450): number {
  const reducedMotion = usePrefersReducedMotion();
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (reducedMotion || !Number.isFinite(target) || target <= 0) {
      setDisplay(target);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) {
        frame = window.requestAnimationFrame(step);
      }
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [target, durationMs, reducedMotion]);

  return display;
}

