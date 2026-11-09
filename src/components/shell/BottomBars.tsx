import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronUp, Menu, MessageSquareText, Search, Ticket } from 'lucide-react';
import { useStore } from '../../store';
import { parseStake, fmtUsdt } from '../../lib/format';
import { SportIcon } from '../icons';
import { BetPanel } from '../BetPanel';
import { itemStatus } from '../BetSlip';

/** Housebets phone bottom nav: Menu, Sports, Casino, Chat, Search. */
export function BottomNav() {
  const set = useStore((s) => s.set);
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();
  const loc = useLocation();
  const items = [
    { label: 'Menu', icon: <Menu size={20} />, onClick: () => set({ navOpen: true }) },
    { label: 'Sports', icon: <SportIcon sport="football" size={20} />, onClick: () => navigate('/sports'), active: loc.pathname.startsWith('/sports') },
    { label: 'Casino', icon: <svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden><rect x="4" y="2.5" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M10 6.5c1.6 1 2.5 2.1 2.5 3.1 0 .8-.6 1.4-1.4 1.4-.5 0-.8-.2-1.1-.6v2.1h-.1V10.4c-.3.4-.6.6-1.1.6-.8 0-1.4-.6-1.4-1.4 0-1 .9-2.1 2.6-3.1Z" fill="currentColor" /></svg>, onClick: () => toast({ tone: 'info', title: 'Casino isn’t part of this prototype' }) },
    { label: 'Chat', icon: <MessageSquareText size={20} />, onClick: () => toast({ tone: 'info', title: 'Chat isn’t part of this prototype' }) },
    { label: 'Search', icon: <Search size={20} />, onClick: () => set({ searchOpen: true }) },
  ];
  return (
    <nav aria-label="Bottom navigation" className="fixed inset-x-0 bottom-0 z-[1400] flex gap-1 border-t border-line2 bg-s1 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-1.5 lg:hidden">
      {items.map((it) => (
        <button key={it.label} type="button" onClick={it.onClick} aria-current={it.active ? 'page' : undefined}
          className={`flex min-w-[52px] flex-1 flex-col items-center justify-center gap-1.5 py-1 text-[11.5px] font-semibold transition-transform active:scale-90 ${it.active ? 'text-accent' : 'text-tx'}`}>
          {it.icon}
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

/**
 * The phone bet slip: a bar pinned above the bottom nav (the brief asks for a
 * bar at the bottom). Also shown on narrow desktops where the side panel
 * doesn't fit. Tapping it opens the full Bet slip / My bets sheet.
 */
export function SlipBar() {
  const slip = useStore((s) => s.slip);
  const sel = useStore((s) => s.sel);
  const slipState = useStore((s) => s.slipState);
  const open = useStore((s) => s.bets.filter((b) => b.status === 'open').length);
  const set = useStore((s) => s.set);
  const loc = useLocation();
  if (loc.pathname === '/sports/bets') return null;

  const rows = slip.map((it) => ({ it, status: itemStatus(it, sel[it.selId], slipState[it.selId]) }));
  const active = rows.filter((r) => r.status !== 'placed');
  const stake = active.reduce((a, r) => a + (parseStake(r.it.stake) || 0), 0);
  const ret = active.reduce((a, r) => a + (parseStake(r.it.stake) || 0) * (sel[r.it.selId]?.odds ?? r.it.accepted), 0);
  const changed = active.filter((r) => r.status === 'changed').length;
  const susp = active.filter((r) => r.status === 'suspended').length;
  const placed = rows.length - active.length;
  const has = slip.length > 0;

  return (
    <div className="fixed inset-x-0 bottom-[calc(58px+env(safe-area-inset-bottom))] z-[1390] px-2 pb-2 lg:bottom-0 lg:px-4 lg:pb-4 xl:hidden">
      <button type="button" onClick={() => set({ sheetOpen: true, panelTab: has ? 'slip' : 'bets' })}
        aria-label={has ? `Open bet slip, ${slip.length} selections` : `Open my bets, ${open} open`}
        className={`mx-auto flex h-14 w-full max-w-[640px] items-center gap-3 rounded-xl px-3 shadow-[0_10px_30px_-8px_rgb(0_0_0/0.7)] transition-colors ${has ? 'bg-accent text-ink' : 'border border-line2 bg-s3 text-tx'}`}>
        <span className={`relative flex size-9 shrink-0 items-center justify-center rounded-lg ${has ? 'bg-ink/12' : 'bg-s5'}`}>
          <Ticket size={18} />
          {has && <span className="num absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-bold text-accent">{slip.length}</span>}
        </span>
        <span className="min-w-0 flex-1 text-left">
          {has ? (
            <>
              <span className="block text-[14px] font-extrabold leading-tight">
                {changed ? `Odds changed · accept to place` : susp ? 'Selection suspended' : placed && !active.length ? `${placed === 1 ? 'Bet' : `${placed} bets`} placed` : `Bet slip · ${slip.length} single${slip.length > 1 ? 's' : ''}`}
              </span>
              <span className="num block text-[12px] font-semibold opacity-75">
                {stake > 0 ? `Stake ${fmtUsdt(stake)} → Returns ${fmtUsdt(ret)} USDT` : 'Add a stake to place'}
              </span>
            </>
          ) : (
            <>
              <span className="block text-[14px] font-bold leading-tight">My bets</span>
              <span className="block text-[12px] text-tx2">{open} open · tap a price to start a slip</span>
            </>
          )}
        </span>
        {(changed > 0 || susp > 0) && <span className="size-2.5 shrink-0 rounded-full bg-warn ring-2 ring-ink/30" aria-hidden />}
        <ChevronUp size={20} className="shrink-0" />
      </button>
    </div>
  );
}

export function BetSheet() {
  const open = useStore((s) => s.sheetOpen);
  const set = useStore((s) => s.set);
  const loc = useLocation();
  useEffect(() => {
    set({ sheetOpen: false });
  }, [loc.pathname, set]);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const k = (e: KeyboardEvent) => e.key === 'Escape' && set({ sheetOpen: false });
    window.addEventListener('keydown', k);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', k);
    };
  }, [open, set]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1700] xl:hidden" role="dialog" aria-modal="true" aria-label="Bet slip">
      <div className="absolute inset-0 bg-black/60" style={{ animation: 'fade .15s' }} onClick={() => set({ sheetOpen: false })} />
      <div className="absolute inset-x-0 bottom-0 mx-auto flex h-[88dvh] max-w-[640px] flex-col overflow-hidden rounded-t-2xl border border-line2 bg-s1" style={{ animation: 'sheet-up .24s cubic-bezier(.2,.8,.2,1)' }}>
        <div className="flex justify-center pb-0.5 pt-2"><span className="h-1 w-10 rounded-full bg-s5" /></div>
        <BetPanel onClose={() => set({ sheetOpen: false })} />
      </div>
    </div>
  );
}
