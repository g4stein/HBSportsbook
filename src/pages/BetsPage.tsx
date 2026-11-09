import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { BetSlip } from '../components/BetSlip';
import { MyBets, type BetsTab } from '../components/MyBets';
import { useMedia } from '../components/bits';

type Tab = 'slip' | BetsTab;

/** Bet slip + My bets on one page: side by side on desktop, tabs on phones. */
export function BetsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (['slip', 'open', 'settled'].includes(params.get('tab') ?? '') ? params.get('tab') : 'slip') as Tab;
  const betsTab: BetsTab = tab === 'settled' ? 'settled' : 'open';
  const wide = useMedia('(min-width: 1024px)');
  const slipCount = useStore((s) => s.slip.length);
  const openCount = useStore((s) => s.bets.filter((b) => b.status === 'open').length);
  const go = (t: Tab) => setParams({ tab: t }, { replace: true });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-tx lg:text-[34px]">Bet slip &amp; My bets</h1>
        <p className="mt-1 text-[13px] text-tx2">Singles only, decimal odds, stakes in USDT. Prices update live while you build your slip.</p>
      </div>

      {wide ? (
        <div className="grid grid-cols-[minmax(340px,400px)_1fr] items-start gap-4">
          <section aria-label="Bet slip" className="panel sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col overflow-hidden">
            <h2 className="flex items-center gap-2 border-b border-line px-4 py-3 text-[15px] font-bold text-tx">
              Bet slip <span className="num rounded-full bg-accent px-1.5 text-[11px] leading-5 text-ink">{slipCount}</span>
            </h2>
            <BetSlip />
          </section>
          <section aria-label="My bets" className="panel flex min-h-[520px] flex-col overflow-hidden">
            <h2 className="flex items-center gap-2 border-b border-line px-4 py-3 text-[15px] font-bold text-tx">
              My bets <span className="num rounded-full bg-s4 px-1.5 text-[11px] leading-5 text-tx2">{openCount} open</span>
            </h2>
            <MyBets tab={betsTab} onTab={(t) => go(t)} />
          </section>
        </div>
      ) : (
        <div className="panel flex min-h-[60dvh] flex-col overflow-hidden">
          <div role="tablist" aria-label="Bet slip and my bets" className="flex border-b border-line px-2">
            {([['slip', 'Bet slip', slipCount], ['open', 'My bets', openCount]] as const).map(([k, l, n]) => {
              const on = k === 'slip' ? tab === 'slip' : tab !== 'slip';
              return (
                <button key={k} type="button" role="tab" aria-selected={on} onClick={() => go(k)}
                  className={`relative flex h-12 flex-1 items-center justify-center gap-1.5 text-[14px] font-bold ${on ? 'text-tx' : 'text-tx2'}`}>
                  {l}
                  <span className={`num inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] ${on ? 'bg-accent text-ink' : 'bg-s4 text-tx2'}`}>{n}</span>
                  {on && <span className="absolute inset-x-6 -bottom-px h-0.5 rounded-full bg-accent" />}
                </button>
              );
            })}
          </div>
          {tab === 'slip' ? <BetSlip /> : <MyBets tab={betsTab} onTab={(t) => go(t)} />}
        </div>
      )}
    </div>
  );
}
