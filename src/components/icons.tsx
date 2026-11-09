import type { SVGProps } from 'react';
import type { SportId } from '../types';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 20) => ({ width: size, height: size, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true as const });

/** The Housebets "H in a ring" mark, as used for House Games in the live nav. */
export function HouseMark({ size = 28, ...p }: P) {
  return (
    <svg {...base(size)} {...p}>
      <path fill="#fff" d="M10.47.84a9.17 9.17 0 0 1 8.7 9.16v.47a9.17 9.17 0 0 1-9.17 8.7l-.47-.02A9.17 9.17 0 0 1 .84 10.47V10A9.17 9.17 0 0 1 10 .83zM10 2.08a7.92 7.92 0 1 0 0 15.83 7.92 7.92 0 0 0 0-15.83" />
      <path fill="#02F7FD" d="M13.32 6.82V5.83h-1.84v3.34H8.5V5.83H6.65v8.52H8.5V11.02l1.49-.93 1.49.92v3.34h1.84z" />
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <HouseMark size={28} />
      <span className="font-display text-[19px] font-extrabold tracking-[-0.01em] text-tx max-sm:hidden">
        house<span className="text-accent">bets</span>
      </span>
    </span>
  );
}

export function SportIcon({ sport, size = 18, ...p }: P & { sport: SportId | 'all' | 'live' }) {
  const s = { stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (sport) {
    case 'football':
      return (
        <svg {...base(size)} {...p}>
          <circle cx="10" cy="10" r="7.5" {...s} />
          <path d="m10 6.3 3 2.2-1.1 3.5H8.1L7 8.5z" {...s} />
          <path d="M10 6.3V2.6M13 8.5l3.4-1.2M11.9 12l2.1 3M8.1 12 6 15M7 8.5 3.6 7.3" {...s} />
        </svg>
      );
    case 'tennis':
      return (
        <svg {...base(size)} {...p}>
          <circle cx="10" cy="10" r="7.5" {...s} />
          <path d="M3.3 6.6c3 1 4.6 3.3 4.6 6.4 0 1.6-.4 3-1.1 4.2M16.7 13.4c-3-1-4.6-3.3-4.6-6.4 0-1.6.4-3 1.1-4.2" {...s} />
        </svg>
      );
    case 'basketball':
      return (
        <svg {...base(size)} {...p}>
          <circle cx="10" cy="10" r="7.5" {...s} />
          <path d="M2.5 10h15M10 2.5v15M4.7 4.7c2.2 2 2.8 4 2.8 5.3s-.6 3.3-2.8 5.3M15.3 4.7c-2.2 2-2.8 4-2.8 5.3s.6 3.3 2.8 5.3" {...s} />
        </svg>
      );
    case 'hockey':
      return (
        <svg {...base(size)} {...p}>
          <path d="M6 2.5v10.2c0 1 .8 1.8 1.8 1.8h4.4M14 2.5v10.2c0 1-.8 1.8-1.8 1.8" {...s} />
          <ellipse cx="10" cy="16.2" rx="3" ry="1.3" {...s} />
        </svg>
      );
    case 'esports':
      return (
        <svg {...base(size)} {...p}>
          <path d="M6.2 5.5h7.6a3.4 3.4 0 0 1 3.3 2.9l.6 4.6a2.2 2.2 0 0 1-3.9 1.7l-1.1-1.3H7.3l-1.1 1.3a2.2 2.2 0 0 1-3.9-1.7l.6-4.6a3.4 3.4 0 0 1 3.3-2.9" {...s} />
          <path d="M6.5 8.4v2.4M5.3 9.6h2.4M13 9.1h.01M14.6 10.5h.01" {...s} />
        </svg>
      );
    case 'cricket':
      return (
        <svg {...base(size)} {...p}>
          <path d="m12.8 2.8 4.4 4.4-8.3 8.3-4.4-4.4zM4.5 11.1l-2 2a1.2 1.2 0 0 0 0 1.7l2.7 2.7a1.2 1.2 0 0 0 1.7 0l2-2" {...s} />
          <circle cx="15.6" cy="15.6" r="1.6" {...s} />
        </svg>
      );
    case 'live':
      return (
        <svg {...base(size)} {...p}>
          <circle cx="10" cy="10" r="2.2" fill="currentColor" />
          <path d="M6.2 13.8a5.4 5.4 0 0 1 0-7.6M13.8 6.2a5.4 5.4 0 0 1 0 7.6M3.8 16.2a8.8 8.8 0 0 1 0-12.4M16.2 3.8a8.8 8.8 0 0 1 0 12.4" {...s} />
        </svg>
      );
    default:
      return (
        <svg {...base(size)} {...p}>
          <rect x="3" y="3" width="5.5" height="5.5" rx="1.4" {...s} />
          <rect x="11.5" y="3" width="5.5" height="5.5" rx="1.4" {...s} />
          <rect x="3" y="11.5" width="5.5" height="5.5" rx="1.4" {...s} />
          <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.4" {...s} />
        </svg>
      );
  }
}

/** Price movement triangle (SVG so it never depends on font glyph coverage). */
export function Tri({ up, size = 8, className = '' }: { up: boolean; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" aria-hidden className={`shrink-0 ${className}`}>
      <path d={up ? 'M4 1 7.5 7h-7z' : 'M4 7 .5 1h7z'} fill="currentColor" />
    </svg>
  );
}
