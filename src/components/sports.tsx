import { Link } from 'react-router-dom';
import { Eye, EyeOff, Search, X } from 'lucide-react';
import { useStore } from '../store';
import { SPORTS } from '../data/catalog';
import type { SportId } from '../types';
import { SportIcon } from './icons';
import { InfoTip } from './bits';

export function OpenBookToggle({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const on = useStore((s) => s.openBook);
  const set = useStore((s) => s.setOpenBook);
  return (
    <span className="inline-flex items-center gap-0.5">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => set(!on)}
        className={`inline-flex items-center gap-2 rounded-lg border font-semibold transition-colors ${size === 'sm' ? 'h-8 px-2.5 text-[12px]' : 'h-9 px-3 text-[13px]'} ${
          on ? 'border-accent/40 bg-accent/10 text-accent' : 'border-line2 bg-s2 text-tx2 hover:text-tx'
        }`}
      >
        {on ? <Eye size={15} /> : <EyeOff size={15} />}
        Open Book
        <span className={`relative h-4 w-7 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-s5'}`} aria-hidden>
          <span className={`absolute left-0 top-0.5 size-3 rounded-full bg-white transition-transform ${on ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
        </span>
      </button>
      <InfoTip label="What is Open Book?">
        <b className="text-tx">Open Book</b> shows the fair price under every odd: the price with no house margin, from our own model. Every market also shows its <b className="text-tx">house edge</b>, and your bet slip shows the share that comes back to you as instant rakeback.
      </InfoTip>
    </span>
  );
}

export function SearchField() {
  const set = useStore((s) => s.set);
  return (
    <button type="button" onClick={() => set({ searchOpen: true })}
      className="group flex h-12 w-full items-center gap-3 rounded-xl border border-line2 bg-s1 px-4 text-left transition-colors hover:border-accent/30 hover:bg-s2">
      <Search size={18} className="text-tx3 group-hover:text-accent" />
      <span className="flex-1 truncate text-[14px] text-tx3">Search teams, players, competitions, markets</span>
      <kbd className="hidden rounded-md border border-line2 px-1.5 text-[11px] font-semibold text-tx3 sm:block">/</kbd>
    </button>
  );
}

/** Horizontal sports navigation with live counts. */
export function SportsNav({ active, mode = 'route', onPick }: { active?: SportId | 'all' | 'live'; mode?: 'route' | 'filter'; onPick?: (s: SportId | 'all') => void }) {
  const matches = useStore((s) => s.matches);
  const nothingLive = useStore((s) => s.demo.nothingLive);
  const all = Object.values(matches);
  const live = (sp?: SportId) => (nothingLive ? 0 : all.filter((m) => (m.status === 'live' || m.status === 'ht') && (!sp || m.sport === sp)).length);
  const items: { id: SportId | 'all' | 'live'; label: string; to: string; n: number; isLive?: boolean }[] =
    mode === 'route'
      ? [
          { id: 'live', label: 'Live', to: '/sports/live', n: live(), isLive: true },
          ...SPORTS.map((s) => ({ id: s.id, label: s.name, to: `/sports/${s.id}`, n: all.filter((m) => m.sport === s.id && m.status !== 'ft').length })),
        ]
      : [
          { id: 'all', label: 'All sports', to: '', n: live(), isLive: true },
          ...SPORTS.map((s) => ({ id: s.id, label: s.name, to: '', n: live(s.id), isLive: true })),
        ];
  return (
    <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0" role={mode === 'filter' ? 'tablist' : undefined} aria-label="Sports">
      {items.map((it) => {
        const on = active === it.id;
        const cls = `inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-[13.5px] font-semibold transition-colors ${
          on ? 'border-accent/50 bg-accent/10 text-tx' : 'border-line bg-s1 text-tx2 hover:border-line2 hover:text-tx'
        } ${it.n === 0 && it.isLive && mode === 'filter' ? 'opacity-60' : ''}`;
        const inner = (
          <>
            <span className={on ? 'text-accent' : it.isLive && it.id === 'live' ? 'text-live' : ''}>
              <SportIcon sport={it.id === 'all' ? 'live' : it.id} size={17} />
            </span>
            {it.label}
            <span className={`num rounded-md px-1.5 text-[11px] font-bold leading-5 ${it.isLive && it.n > 0 ? 'bg-live/15 text-live' : 'bg-s3 text-tx3'}`}>{it.n}</span>
          </>
        );
        return mode === 'route' ? (
          <Link key={it.id} to={it.to} className={cls} aria-current={on ? 'page' : undefined}>{inner}</Link>
        ) : (
          <button key={it.id} type="button" role="tab" aria-selected={on} onClick={() => onPick?.(it.id as SportId | 'all')} className={cls}>{inner}</button>
        );
      })}
    </div>
  );
}

export function OpenBookIntro() {
  const dismissed = useStore((s) => s.introDismissed);
  const on = useStore((s) => s.openBook);
  const set = useStore((s) => s.setOpenBook);
  const dismiss = useStore((s) => s.dismissIntro);
  if (dismissed) return null;
  return (
    <section aria-label="Open Book" className="rise relative overflow-hidden rounded-2xl border border-accent/20 bg-s1">
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] sm:block">
        <OpenBookArt />
      </div>
      <div className="relative flex flex-col gap-3 p-5 sm:max-w-[58%]">
        <span className="eyebrow text-accent">Only on Housebets</span>
        <h2 className="font-display text-[22px] font-extrabold leading-tight tracking-[-0.01em] text-tx">Open Book. See the edge on every bet.</h2>
        <p className="text-[13.5px] leading-relaxed text-tx2">
          We already share the house edge as rakeback. Now you can see it: every market shows its edge, Open Book shows the fair price under each odd, and your slip shows what comes back to you.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => { set(!on); }} className="btn-primary h-10 px-4 text-[13.5px]">{on ? <><EyeOff size={15} /> Turn off</> : <><Eye size={15} /> Turn on Open Book</>}</button>
          <button type="button" onClick={dismiss} className="h-10 px-2 text-[13px] font-semibold text-tx2 hover:text-tx">Got it</button>
        </div>
      </div>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-md text-tx3 hover:bg-s3 hover:text-tx"><X size={16} /></button>
    </section>
  );
}

/** Small illustration: an odds button "opened up" to show its fair price and edge. */
function OpenBookArt() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="obg" x1="0" x2="1">
          <stop offset="0" stopColor="#0f2129" />
          <stop offset="1" stopColor="#0f2129" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g fontFamily="Red Hat Display, sans-serif" fontWeight="800">
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${40 + i * 92} ${44 + (i % 2) * 18})`}>
            <rect width="82" height="66" rx="12" fill={i === 1 ? '#02F7FD' : '#142a34'} stroke={i === 1 ? '#02F7FD' : 'rgb(160 205 225 / .15)'} />
            <text x="41" y="22" textAnchor="middle" fontSize="11" fill={i === 1 ? '#00262a' : '#637d89'}>{['1', 'X', '2'][i]}</text>
            <text x="41" y="43" textAnchor="middle" fontSize="19" fill={i === 1 ? '#00262a' : '#f4f8fa'}>{['1.44', '4.60', '6.80'][i]}</text>
            <text x="41" y="58" textAnchor="middle" fontSize="10" fontWeight="600" fill={i === 1 ? 'rgb(0 38 42 / .7)' : '#637d89'}>fair {['1.51', '4.82', '7.13'][i]}</text>
          </g>
        ))}
        <g transform="translate(132 138)">
          <rect width="98" height="26" rx="8" fill="rgb(2 247 253 / .08)" stroke="rgb(2 247 253 / .25)" />
          <text x="49" y="17.5" textAnchor="middle" fontSize="12" fill="#02F7FD">Edge 4.6%</text>
        </g>
      </g>
      <rect width="120" height="200" fill="url(#obg)" />
    </svg>
  );
}
