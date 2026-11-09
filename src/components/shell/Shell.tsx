import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react';
import { useStore } from '../../store';
import { TopBar } from './TopBar';
import { LeftNav, MobileNav } from './LeftNav';
import { BetSheet, BottomNav, SlipBar } from './BottomBars';
import { BetPanel } from '../BetPanel';
import { SearchOverlay } from '../Search';
import { useMedia } from '../bits';

/** The Housebets site shell: top bar, left nav, main column, side panel. */
export function Shell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const onBetsPage = loc.pathname === '/sports/bets';
  const wide = useMedia('(min-width: 1280px)');
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [loc.pathname]);

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[3000] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-ink">Skip to content</a>
      <TopBar />
      <div className="flex">
        <LeftNav />
        <main id="main" className="min-w-0 flex-1 pb-40 lg:pb-28 xl:pb-12">
          <div className="mx-auto max-w-[1080px] px-4 pt-4 lg:px-8 lg:pt-6">{children}</div>
          <Footer />
        </main>
        {!onBetsPage && wide && (
          <aside aria-label="Side panel" className="hidden w-[340px] shrink-0 xl:block">
            <div className="sticky top-16 h-[calc(100dvh-4rem)] p-4 pl-0">
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-s1">
                <BetPanel />
              </div>
            </div>
          </aside>
        )}
      </div>
      {!wide && <SlipBar />}
      <BottomNav />
      <MobileNav />
      {!wide && <BetSheet />}
      <SearchOverlay />
      <Toasts />
    </div>
  );
}

function Footer() {
  return (
    <footer className="mx-4 mt-12 rounded-2xl border border-line bg-gradient-to-b from-s2 to-bg px-5 py-5 text-[11.5px] leading-relaxed text-tx3 lg:mx-8">
      <p className="text-tx2"><b className="text-tx">Housebets Sportsbook · prototype.</b> Sample fixtures, prices and players. Demo USDT only: no real money, no real accounts. Team crests are generated shapes, not club badges. All footballers, tennis players and esports teams are fictional.</p>
      <p className="mt-2">Prices come from a live demo model (Poisson goals for football) with a fixed margin per market, which is what the Edge figures show. 18+ · Gamble responsibly.</p>
    </footer>
  );
}

const TONE = {
  info: { icon: Info, cls: 'text-accent' },
  success: { icon: CircleCheck, cls: 'text-up' },
  warn: { icon: TriangleAlert, cls: 'text-warn' },
  error: { icon: CircleX, cls: 'text-down' },
};

function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <section aria-label="Notifications" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-16 z-[2500] flex flex-col items-center gap-2 px-3 lg:left-auto lg:right-4 lg:top-20 lg:items-end xl:right-[360px]">
      {toasts.map((t) => {
        const { icon: Icon, cls } = TONE[t.tone];
        return (
          <div key={t.id} className="rise pointer-events-auto flex w-full max-w-[380px] items-start gap-3 rounded-xl border border-line2 bg-s3/95 p-3 shadow-2xl shadow-black/50 backdrop-blur">
            <Icon size={18} className={`mt-px shrink-0 ${cls}`} />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold text-tx">{t.title}</p>
              {t.body && <p className="mt-0.5 text-[12.5px] leading-snug text-tx2">{t.body}</p>}
              {t.action && (
                <Link to={t.action.to} onClick={() => dismiss(t.id)} className="mt-1.5 inline-block text-[12.5px] font-bold text-accent hover:underline">{t.action.label}</Link>
              )}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="-m-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-tx3 hover:bg-s4 hover:text-tx"><X size={14} /></button>
          </div>
        );
      })}
    </section>
  );
}
