import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Maximize2, X } from 'lucide-react';
import { useStore } from '../store';
import { BetSlip } from './BetSlip';
import { MyBets, type BetsTab } from './MyBets';

/** Bet slip + My bets in one surface: the desktop side panel and the phone sheet. */
export function BetPanel({ onClose }: { onClose?: () => void }) {
  const tab = useStore((s) => s.panelTab);
  const set = useStore((s) => s.set);
  const slipCount = useStore((s) => s.slip.length);
  const openCount = useStore((s) => s.bets.filter((b) => b.status === 'open').length);
  const [betsTab, setBetsTab] = useState<BetsTab>('open');

  return (
    <section aria-label="Bet slip and my bets" className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-1 border-b border-line px-3 pt-3">
        <div role="tablist" className="flex flex-1 gap-1">
          {([
            ['slip', 'Bet slip', slipCount],
            ['bets', 'My bets', openCount],
          ] as const).map(([k, label, n]) => (
            <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => set({ panelTab: k })}
              className={`relative flex h-10 items-center gap-1.5 px-2.5 text-[14px] font-bold transition-colors ${tab === k ? 'text-tx' : 'text-tx2 hover:text-tx'}`}>
              {label}
              <span className={`num inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] ${tab === k ? 'bg-accent text-ink' : 'bg-s4 text-tx2'}`}>{n}</span>
              {tab === k && <span aria-hidden className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-accent" />}
            </button>
          ))}
        </div>
        <Link to={`/sports/bets?tab=${tab === 'slip' ? 'slip' : betsTab}`} onClick={onClose} aria-label="Open full page" title="Open full page" className="inline-flex size-8 items-center justify-center rounded-md text-tx3 hover:bg-s3 hover:text-tx">
          <Maximize2 size={15} />
        </Link>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close" className="inline-flex size-8 items-center justify-center rounded-md text-tx3 hover:bg-s3 hover:text-tx">
            <X size={18} />
          </button>
        )}
      </div>
      {tab === 'slip' ? <BetSlip /> : <MyBets tab={betsTab} onTab={setBetsTab} />}
    </section>
  );
}
