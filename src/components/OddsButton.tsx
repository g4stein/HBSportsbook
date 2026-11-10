import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { useStore } from '../store';
import { fmtOdds } from '../lib/format';
import { Tri } from './icons';

type Variant = 'compact' | 'wide' | 'cell';

/**
 * The single price control used everywhere. Handles every state the brief asks
 * for: selected, moving (up/down with a short flash and arrow), suspended
 * (locked, hatched), unavailable and settled. With Open Book on it also shows
 * the fair price behind the odds.
 */
export function OddsButton({ selId, variant = 'compact', label, className = '', inline = false }: { selId: string; variant?: Variant; label?: string; className?: string; inline?: boolean }) {
  const sel = useStore((s) => s.sel[selId]);
  const meta = useStore((s) => s.meta[selId]);
  const inSlip = useStore((s) => s.slip.some((x) => x.selId === selId));
  const openBook = useStore((s) => s.openBook);
  const toggle = useStore((s) => s.toggleSelection);
  const [moving, setMoving] = useState<0 | 1 | -1>(0);

  useEffect(() => {
    if (!meta || Date.now() - meta.at > 2000) return;
    setMoving(0);
    const raf = requestAnimationFrame(() => setMoving(meta.dir));
    const t = setTimeout(() => setMoving(0), 4500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [meta?.at]); // eslint-disable-line react-hooks/exhaustive-deps

  const text = label ?? (variant === 'wide' ? sel?.label : sel?.short) ?? '';
  const status = sel?.status ?? 'unavailable';
  const suspended = status === 'suspended';
  const disabled = !sel || (status !== 'open' && !inSlip);

  const tone = inSlip
    ? 'bg-accent text-ink border-accent hover:bg-[#5ffbff]'
    : suspended
      ? 'hatch bg-s2 border-warn/25 text-tx3'
      : status === 'won'
        ? 'bg-up/10 border-up/30 text-up'
        : status === 'open'
          ? 'bg-s3 border-line hover:bg-s4 hover:border-line2 text-tx'
          : 'bg-s2 border-line text-tx3';

  const arrow = moving !== 0 && !inSlip && status === 'open' && (
    <Tri up={moving > 0} size={7} className={moving > 0 ? 'text-up' : 'text-down'} />
  );

  const price = suspended ? (
    <Lock size={variant === 'cell' ? 13 : 14} strokeWidth={2.2} className="text-warn" aria-hidden />
  ) : status === 'won' ? (
    <span className="num text-[13px] font-bold">Won</span>
  ) : status === 'lost' || status === 'void' ? (
    <span className="num text-[13px] font-semibold">{status === 'void' ? 'Void' : '—'}</span>
  ) : (
    <span className={`num text-[15px] font-bold leading-none ${moving > 0 && !inSlip ? 'text-up' : moving < 0 && !inSlip ? 'text-down' : ''}`}>{fmtOdds(sel?.odds)}</span>
  );

  const fair = openBook && sel?.fair && status === 'open' && (
    <span className={`num text-[10px] leading-none ${inSlip ? 'text-ink/70' : 'text-tx3'}`} title="Fair price with no house margin">
      fair {sel.fair >= 100 ? '99+' : sel.fair.toFixed(2)}
    </span>
  );

  const aria = sel
    ? `${sel.label}, ${sel.marketName}, ${suspended ? 'suspended' : status === 'open' ? `odds ${fmtOdds(sel.odds)}` : status}${inSlip ? ', in bet slip' : ''}`
    : 'Unavailable';

  const flash = moving > 0 && !inSlip ? 'flash-up' : moving < 0 && !inSlip ? 'flash-down' : '';
  const common = `relative select-none rounded-lg border transition-[background-color,border-color,transform] duration-150 active:scale-[0.97] disabled:active:scale-100 ${tone} ${flash} ${className}`;

  if (variant === 'wide') {
    return (
      <button type="button" disabled={disabled} aria-pressed={inSlip} aria-label={aria} onClick={() => toggle(selId)}
        className={`${common} flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left max-sm:flex-col max-sm:justify-center max-sm:gap-1 max-sm:px-1.5 max-sm:text-center`}>
        <span className={`min-w-0 truncate text-[13px] font-medium max-sm:max-w-full max-sm:text-[12px] ${inSlip ? 'text-ink' : suspended ? 'text-tx3' : 'text-tx2'}`}>{text}</span>
        <span className="flex shrink-0 flex-col items-end gap-1 max-sm:items-center">
          <span className="flex items-center gap-1">{arrow}{price}</span>
          {fair}
        </span>
      </button>
    );
  }

  if (variant === 'cell') {
    return (
      <button type="button" disabled={disabled} aria-pressed={inSlip} aria-label={aria} onClick={() => toggle(selId)}
        className={`${common} flex h-11 w-full flex-col items-center justify-center gap-1 px-1`}>
        <span className="flex items-center gap-1">{arrow}{price}</span>
        {fair}
      </button>
    );
  }

  return (
    <button type="button" disabled={disabled} aria-pressed={inSlip} aria-label={aria} onClick={() => toggle(selId)}
      className={`${common} flex h-12 w-full min-w-0 items-center ${inline ? 'flex-row justify-between gap-1.5 px-2.5' : 'flex-col justify-center gap-[3px] px-1.5'}`}>
      <span className={`max-w-full truncate font-semibold leading-none ${inline ? 'shrink-0 text-[12px]' : 'text-[10.5px] uppercase tracking-wide'} ${inSlip ? 'text-ink/70' : 'text-tx3'}`}>{text}</span>
      <span className={`flex flex-col gap-[3px] ${inline ? 'min-w-0 items-end' : 'items-center'}`}>
        <span className="flex items-center gap-1">{arrow}{price}</span>
        {fair}
      </span>
    </button>
  );
}
