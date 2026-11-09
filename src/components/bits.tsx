import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Info, Star } from 'lucide-react';
import type { Match } from '../types';
import { useStore } from '../store';
import { clockSeconds } from '../engine/pricing';
import { fmtKickoff, fmtPct } from '../lib/format';

export function useMatch(id: string) {
  return useStore((s) => s.matches[id]);
}

export function clockText(m: Match, now: number): { text: string; live: boolean } {
  if (m.status === 'pre') return { text: fmtKickoff(m.kickoff, now), live: false };
  if (m.status === 'ft') return { text: 'FT', live: false };
  if (m.status === 'ht') return { text: 'HT', live: true };
  if (m.sport === 'football') {
    const sec = clockSeconds(m, now);
    const cap = m.period === 1 ? 2700 : 5400;
    if (sec >= cap) return { text: `${cap / 60}+${Math.floor((sec - cap) / 60) + 1}'`, live: true };
    const mm = Math.floor(sec / 60);
    const ss = Math.floor(sec % 60);
    return { text: `${mm}:${String(ss).padStart(2, '0')}`, live: true };
  }
  if (m.sport === 'basketball' || m.sport === 'hockey') {
    const n = m.sport === 'basketball' ? 4 : 3;
    const len = m.sport === 'basketball' ? 12 : 20;
    const q = Math.min(1, m.progress * n - (m.period - 1));
    const rem = Math.max(0, (1 - q) * len * 60);
    const label = m.sport === 'basketball' ? `Q${m.period}` : `P${m.period}`;
    return { text: `${label} ${Math.floor(rem / 60)}:${String(Math.floor(rem % 60)).padStart(2, '0')}`, live: true };
  }
  if (m.sport === 'tennis') return { text: `Set ${m.score[0] + m.score[1] + 1}`, live: true };
  if (m.sport === 'esports') return { text: `Map ${m.score[0] + m.score[1] + 1}`, live: true };
  return { text: 'Live', live: true };
}

export function LiveClock({ m, className = '' }: { m: Match; className?: string }) {
  const now = useStore((s) => s.now);
  const { text, live } = clockText(m, now);
  return (
    <span className={`num inline-flex items-center gap-1.5 text-[12px] font-bold ${live ? 'text-live' : 'text-tx2'} ${className}`}>
      {live && <span aria-hidden className="size-1.5 rounded-full bg-live animate-pulse-dot" />}
      <span>{text}</span>
    </span>
  );
}

export function LivePill({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex h-5 items-center gap-1 rounded-full bg-live/15 px-2 text-[10px] font-bold uppercase tracking-wider text-live ${className}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-live animate-pulse-dot" />
      Live
    </span>
  );
}

export function SectionHead({ title, count, to, toLabel = 'See all', right, icon }: { title: string; count?: number; to?: string; toLabel?: string; right?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="flex items-center gap-2 font-display text-[19px] font-bold leading-tight tracking-[-0.01em] text-tx">
        {icon}
        {title}
        {count !== undefined && <span className="num rounded-md bg-s3 px-1.5 py-0.5 text-[12px] font-bold text-tx2">{count}</span>}
      </h2>
      <div className="flex items-center gap-2">
        {right}
        {to && (
          <Link to={to} className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-tx2 transition-colors hover:text-tx">
            {toLabel}
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}

/** Edge chip: the house margin on a market, the core of the Open Book idea. */
export function EdgeChip({ edge, compact = false }: { edge: number; compact?: boolean }) {
  const level = edge < 0.05 ? 'low' : edge < 0.08 ? 'mid' : 'high';
  const tone = level === 'low' ? 'text-accent bg-accent/8 border-accent/20' : level === 'mid' ? 'text-tx2 bg-s3 border-line2' : 'text-warn bg-warn/8 border-warn/25';
  return (
    <span className={`num inline-flex h-5 shrink-0 items-center gap-1 rounded-md border px-1.5 text-[10.5px] font-bold ${tone}`} title="House edge: the expected share of each stake the house keeps on this market">
      {!compact && <span className="font-sans font-semibold opacity-80">Edge</span>}
      {fmtPct(edge)}
    </span>
  );
}

export function FollowButton({ kind, id, name, size = 'md' }: { kind: 'team' | 'comp'; id: string; name: string; size?: 'sm' | 'md' }) {
  const on = useStore((s) => (kind === 'team' ? s.followTeams : s.followComps).includes(id));
  const toggle = useStore((s) => (kind === 'team' ? s.toggleFollowTeam : s.toggleFollowComp));
  const sm = size === 'sm';
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Unfollow ${name}` : `Follow ${name}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border font-semibold transition-colors ${sm ? 'size-8' : 'h-8 px-2.5 text-[12px]'} ${
        on ? 'border-gold/40 bg-gold/10 text-gold' : 'border-line2 bg-s2 text-tx2 hover:text-tx'
      }`}
    >
      <Star size={sm ? 15 : 14} strokeWidth={2} fill={on ? 'currentColor' : 'none'} />
      {!sm && (on ? 'Following' : 'Follow')}
    </button>
  );
}

export function InfoTip({ children, label = 'More info' }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => {
      document.removeEventListener('mousedown', h);
      document.removeEventListener('keydown', k);
    };
  }, [open]);
  return (
    <span ref={ref} className="relative inline-flex">
      <button type="button" aria-label={label} aria-expanded={open} onClick={() => setOpen((v) => !v)} className="inline-flex size-6 items-center justify-center rounded-md text-tx3 hover:bg-s3 hover:text-tx">
        <Info size={14} />
      </button>
      {open && (
        <span role="tooltip" className="rise absolute right-0 top-7 z-50 w-64 rounded-lg border border-line2 bg-s3 p-3 text-left text-[12.5px] font-normal leading-relaxed text-tx2 shadow-2xl shadow-black/50">
          {children}
        </span>
      )}
    </span>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line2 bg-s1/60 px-6 py-10 text-center">
      {icon && <div className="mb-1 text-tx3">{icon}</div>}
      <p className="font-display text-[16px] font-bold text-tx">{title}</p>
      {body && <p className="max-w-sm text-[13px] leading-relaxed text-tx2">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function useMedia(q: string) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const h = () => setM(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [q]);
  return m;
}
