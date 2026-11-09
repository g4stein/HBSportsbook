import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Loader2, Lock, Ticket } from 'lucide-react';
import { cashoutValue, RAKEBACK_RATE, useStore } from '../store';
import type { Bet } from '../types';
import { fmtDateTime, fmtOdds, fmtPct, fmtUsdt } from '../lib/format';
import { LiveClock, EmptyState } from './bits';

export type BetsTab = 'open' | 'settled';

export function MyBets({ tab, onTab }: { tab: BetsTab; onTab: (t: BetsTab) => void }) {
  const bets = useStore((s) => s.bets);
  const open = bets.filter((b) => b.status === 'open');
  const settled = bets.filter((b) => b.status !== 'open').sort((a, b) => (b.settledAt ?? 0) - (a.settledAt ?? 0));
  const list = tab === 'open' ? open : settled;
  const staked = settled.reduce((a, b) => a + b.stake, 0);
  const returned = settled.reduce((a, b) => a + (b.returned ?? 0), 0);
  const atRisk = open.reduce((a, b) => a + b.stake, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 pt-3">
        <div role="tablist" aria-label="My bets" className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-bg p-1">
          {(['open', 'settled'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => onTab(t)}
              className={`h-8 rounded-md text-[13px] font-semibold capitalize transition-colors ${tab === t ? 'bg-s4 text-tx' : 'text-tx2 hover:text-tx'}`}>
              {t} <span className="num ml-0.5 text-tx3">{t === 'open' ? open.length : settled.length}</span>
            </button>
          ))}
        </div>
        <p className="num mt-2.5 flex justify-between px-1 text-[12px] text-tx3">
          {tab === 'open' ? (
            <>
              <span>At stake</span>
              <span className="font-semibold text-tx2">{fmtUsdt(atRisk)} USDT</span>
            </>
          ) : (
            <>
              <span>Staked {fmtUsdt(staked)} · Returned {fmtUsdt(returned)}</span>
              <span className={`font-bold ${returned - staked >= 0 ? 'text-up' : 'text-down'}`}>{fmtUsdt(returned - staked, { sign: true })}</span>
            </>
          )}
        </p>
      </div>
      <div className="scroll-thin min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-4 pt-2">
        {list.length === 0 ? (
          <EmptyState
            icon={<Ticket size={28} />}
            title={tab === 'open' ? 'No open bets' : 'No settled bets yet'}
            body={tab === 'open' ? 'Bets you place show here with a live cash out value.' : 'Won, lost, void and cashed-out bets land here.'}
            action={tab === 'open' ? <Link to="/sports/live" className="btn-ghost h-9 px-3 text-[12.5px]">Browse live</Link> : undefined}
          />
        ) : (
          list.map((b) => <BetCard key={b.id} bet={b} />)
        )}
      </div>
    </div>
  );
}

const STATUS: Record<Bet['status'], { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-s4 text-tx2' },
  won: { label: 'Won', cls: 'bg-up/15 text-up' },
  lost: { label: 'Lost', cls: 'bg-down/12 text-down' },
  void: { label: 'Void', cls: 'bg-s4 text-tx2' },
  cashed: { label: 'Cashed out', cls: 'bg-accent/12 text-accent' },
};

function BetCard({ bet }: { bet: Bet }) {
  const m = useStore((s) => (bet.matchId ? s.matches[bet.matchId] : undefined));
  const [open, setOpen] = useState(false);
  const st = STATUS[bet.status];
  const live = m && (m.status === 'live' || m.status === 'ht');
  return (
    <article className="rise overflow-hidden rounded-xl border border-line bg-s2">
      <div className="flex items-start gap-2 px-3 pt-2.5">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-[11.5px] text-tx3">
            {m ? <Link to={`/sports/match/${m.id}`} className="truncate hover:text-tx">{bet.matchLabel}</Link> : <span className="truncate">{bet.matchLabel}</span>}
          </p>
          <p className="mt-0.5 truncate font-display text-[15px] font-bold text-tx">{bet.label}</p>
          <p className="truncate text-[12px] text-tx2">{bet.marketName}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`inline-flex h-5 items-center rounded-md px-1.5 text-[10.5px] font-bold uppercase tracking-wide ${st.cls}`}>{st.label}</span>
          <span className="num text-[16px] font-extrabold text-tx">{fmtOdds(bet.odds)}</span>
        </div>
      </div>
      {live && m && (
        <div className="mx-3 mt-2 flex items-center justify-between rounded-lg bg-bg/70 px-2.5 py-1.5">
          <LiveClock m={m} />
          <span className="num text-[13px] font-bold text-tx">{m.score[0]}–{m.score[1]}</span>
        </div>
      )}
      <dl className="num grid grid-cols-2 gap-x-3 px-3 pt-2.5 text-[12px]">
        <dt className="font-sans text-tx3">Stake</dt>
        <dd className="text-right font-bold text-tx">{fmtUsdt(bet.stake)} USDT</dd>
        <dt className="font-sans text-tx3">{bet.status === 'open' ? 'Potential return' : 'Returned'}</dt>
        <dd className={`text-right font-bold ${bet.status === 'open' || bet.status === 'won' ? 'text-gold' : 'text-tx'}`}>
          {fmtUsdt(bet.status === 'open' ? bet.stake * bet.odds : bet.returned ?? 0)} USDT
        </dd>
      </dl>
      {bet.status === 'open' ? (
        <CashOut bet={bet} />
      ) : (
        <div className="h-3" />
      )}
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between border-t border-line px-3 py-2 text-[11.5px] font-semibold text-tx3 hover:text-tx">
        Bet receipt
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <dl className="num grid grid-cols-2 gap-x-3 gap-y-1 px-3 pb-3 text-[11.5px] text-tx2">
          <dt className="font-sans text-tx3">Bet ID</dt><dd className="text-right">{bet.id}</dd>
          <dt className="font-sans text-tx3">Placed</dt><dd className="text-right">{fmtDateTime(bet.placedAt)}</dd>
          {bet.settledAt && (<><dt className="font-sans text-tx3">Settled</dt><dd className="text-right">{fmtDateTime(bet.settledAt)}</dd></>)}
          <dt className="font-sans text-tx3">Competition</dt><dd className="truncate text-right font-sans">{bet.compName}</dd>
          <dt className="font-sans text-tx3">House edge at placement</dt><dd className="text-right">{fmtPct(bet.edge)}</dd>
          <dt className="font-sans text-tx3">Instant rakeback</dt><dd className="text-right text-accent">+{fmtUsdt(bet.stake * bet.edge * RAKEBACK_RATE)} USDT</dd>
          <dt className="font-sans text-tx3">Type</dt><dd className="text-right font-sans">Single</dd>
        </dl>
      )}
    </article>
  );
}

type CoPhase = 'idle' | 'confirm' | 'working' | 'changed';

function CashOut({ bet }: { bet: Bet }) {
  const sel = useStore((s) => s.sel[bet.selId]);
  const cashOut = useStore((s) => s.cashOut);
  const [phase, setPhase] = useState<CoPhase>('idle');
  const [quoted, setQuoted] = useState(0);
  const prev = useRef<number | null>(null);
  const [dir, setDir] = useState<0 | 1 | -1>(0);
  const value = sel ? cashoutValue(bet, sel) : 0;
  const available = sel?.status === 'open' && !!sel.odds;

  useEffect(() => {
    if (prev.current !== null && value !== prev.current) {
      setDir(value > prev.current ? 1 : -1);
      if (phase === 'confirm') setPhase('changed');
      const t = setTimeout(() => setDir(0), 2500);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'confirm' && phase !== 'changed') return;
    const t = setTimeout(() => setPhase('idle'), 6000);
    return () => clearTimeout(t);
  }, [phase, quoted]);

  if (!sel) return <div className="h-3" />;
  if (!available) {
    return (
      <div className="mx-3 mb-3 mt-2.5 flex h-10 items-center justify-center gap-1.5 rounded-lg border border-dashed border-line2 text-[12.5px] font-semibold text-tx3">
        <Lock size={13} /> Cash out paused while the market is suspended
      </div>
    );
  }

  const vCls = dir > 0 ? 'text-up' : dir < 0 ? 'text-down' : '';
  const profit = value - bet.stake;

  if (phase === 'working') {
    return (
      <div className="mx-3 mb-3 mt-2.5 flex h-10 items-center justify-center gap-2 rounded-lg bg-s3 text-[13px] font-semibold text-tx">
        <Loader2 size={15} className="animate-[spin_0.8s_linear_infinite] text-accent" /> Cashing out…
      </div>
    );
  }

  if (phase === 'confirm' || phase === 'changed') {
    return (
      <div className="mx-3 mb-3 mt-2.5 space-y-1.5">
        {phase === 'changed' && <p className="text-[12px] font-medium text-warn">The cash out value changed. Confirm the new amount.</p>}
        <div className="flex gap-2">
          <button type="button" onClick={() => setPhase('idle')} className="btn-ghost h-10 px-3 text-[13px]">Cancel</button>
          <button
            type="button"
            onClick={() => {
              const q = value;
              setQuoted(q);
              setPhase('working');
              setTimeout(() => {
                const r = cashOut(bet.id, q);
                if (r === 'changed') setPhase('changed');
                else if (r === 'suspended') setPhase('idle');
              }, 750);
            }}
            className="relative h-10 flex-1 overflow-hidden rounded-lg bg-accent text-[13.5px] font-bold text-ink hover:bg-[#5ffbff]"
          >
            <span className="relative z-10 num">Confirm {fmtUsdt(value)} USDT</span>
            <span key={`${phase}-${quoted}-${value}`} aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-ink/40" style={{ animation: 'shrink 6s linear forwards' }} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 mb-3 mt-2.5">
      <button type="button" onClick={() => { setQuoted(value); setPhase('confirm'); }}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-accent/35 bg-accent/8 px-3 text-[13px] font-semibold text-tx transition-colors hover:bg-accent/14">
        <span>Cash out</span>
        <span className="flex items-baseline gap-2">
          <span className={`num text-[11.5px] ${profit >= 0 ? 'text-up' : 'text-down'}`}>{fmtUsdt(profit, { sign: true })}</span>
          <span className={`num text-[15px] font-extrabold transition-colors ${vCls}`}>{fmtUsdt(value)} USDT</span>
        </span>
      </button>
    </div>
  );
}
