import type { ReactNode } from 'react';
import { useInView } from '@/hooks/useMotion';

export function RevealOnScroll({
  children,
  direction = 'up',
  delayMs = 0,
  className = '',
}: {
  children: ReactNode;
  direction?: 'up' | 'left' | 'right';
  delayMs?: number;
  className?: string;
}) {
  const { ref, isVisible } = useInView();

  const baseClass =
    direction === 'left'
      ? 'cb-reveal-left'
      : direction === 'right'
        ? 'cb-reveal-right'
        : 'cb-reveal';

  return (
    <div
      ref={ref}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`${baseClass} ${isVisible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

