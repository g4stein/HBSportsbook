import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, CircleX, Lock, Loader2, RotateCcw, TriangleAlert, Trash2, X } from 'lucide-react';
import { MAX_STAKE, MIN_STAKE, RAKEBACK_RATE, useStore } from '../store';
import type { Selection, SlipItem, SlipItemState } from '../types';
import { fmtOdds, fmtPct, fmtUsdt, parseStake } from '../lib/format';
import { FEATURED_MATCH_ID } from '../data/fixtures';
import { teamById } from '../data/catalog';
import { UsdtIcon } from './UsdtIcon';
import { Tri } from './icons';
import { SlipDemo } from './SlipDemo';

type ItemStatus = 'ok' | 'changed' | 'suspended' | 'closed' | 'placing' | 'placed' | 'failed';

export function itemStatus(item: SlipItem, sel: Selection | undefined, st: SlipItemState | undefined): ItemStatus {
  if (st?.phase === 'placed') return 'placed';
  if (st?.phase === 'placing') return 'placing';
  if (!sel || ['won', 'lost', 'void', 'unavailable'].includes(sel.status)) return 'closed';
  if (sel.status === 'suspended') return 'suspended';
  if (sel.odds !== item.accepted) return 'changed';
  if (st?.phase === 'failed') return 'failed';
  return 'ok';
}

function stakeError(raw: string): string | null {
  const v = parseStake(raw);
  if (v === null) return null;
  if (Number.isNaN(v)) return 'Enter a number, like 10 or 2.50.';
  if (v < MIN_STAKE) return `Minimum stake is ${fmtUsdt(MIN_STAKE)} USDT.`;
  if (v > MAX_STAKE) return `Maximum stake on this selection is ${fmtUsdt(MAX_STAKE)} USDT.`;
  if (/\.\d{3,}/.test(raw)) return 'Use up to 2 decimal places.';
  return null;
}

const QUICK = [5, 10, 25, 50];

export function BetSlip({ compact = false }: { compact?: boolean }) {
  const slip = useStore((s) => s.slip);
  const sel = useStore((s) => s.sel);
  const slipState = useStore((s) => s.slipState);
  const balance = useStore((s) => s.balance);
  const { acceptChanges, placeBets, clearSlip, removeSelection, setAllStakes, dismissPlaced } = useStore.getState();
  const [allStake, setAll] = useState('');

  const rows = useMemo(
    () => slip.map((it) => ({ it, sel: sel[it.selId], st: slipState[it.selId], status: itemStatus(it, sel[it.selId], slipState[it.selId]) })),
    [slip, sel, slipState],
  );

  if (!slip.length) return <EmptySlip />;

  const active = rows.filter((r) => r.status !== 'placed');
  const placed = rows.filter((r) => r.status === 'placed');
  const changed = active.filter((r) => r.status === 'changed');
  const suspended = active.filter((r) => r.status === 'suspended' || r.status === 'closed');
  const placing = active.some((r) => r.status === 'placing');
  const staked = active.filter((r) => (parseStake(r.it.stake) ?? 0) > 0);
  const invalid = active.some((r) => stakeError(r.it.stake));
  const totalStake = staked.reduce((a, r) => a + (parseStake(r.it.stake) || 0), 0);
  const totalReturn = staked.reduce((a, r) => a + (parseStake(r.it.stake) || 0) * (r.sel?.odds ?? r.it.accepted), 0);
  const rakeback = staked.reduce((a, r) => a + (parseStake(r.it.stake) || 0) * edgeOf(r.sel) * RAKEBACK_RATE, 0);
  const missingStake = active.length > 0 && staked.length < active.length;
  const overBalance = totalStake > balance + 1e-9;

  let cta: { label: string; onClick?: () => void; disabled?: boolean; tone?: 'warn' } = { label: '' };
  if (placing) cta = { label: `Placing ${active.length === 1 ? 'bet' : `${active.length} bets`}…`, disabled: true };
  else if (!active.length) cta = { label: 'All bets placed', disabled: true };
  else if (changed.length) cta = { label: changed.length === 1 ? 'Accept new odds' : `Accept ${changed.length} new prices`, onClick: acceptChanges, tone: 'warn' };
  else if (suspended.length) cta = { label: 'Remove suspended to continue', disabled: true };
  else if (!staked.length) cta = { label: 'Enter a stake', disabled: true };
  else if (missingStake) cta = { label: 'Add a stake to every selection', disabled: true };
  else if (invalid) cta = { label: 'Check your stakes', disabled: true };
  else if (overBalance) cta = { label: 'Not enough balance', disabled: true };
  else cta = { label: `${active.some((r) => r.status === 'failed') ? 'Try again' : `Place ${staked.length === 1 ? 'bet' : `${staked.length} bets`}`} · ${fmtUsdt(totalStake)} USDT`, onClick: placeBets };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
        <p className="text-[12px] text-tx2">
          <span className="font-semibold text-tx">Singles only.</span> Each selection is its own bet.
        </p>
        {!placing && (
          <button type="button" onClick={clearSlip} className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-semibold text-tx3 hover:bg-s3 hover:text-tx">
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      <div className={`scroll-thin min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3 ${compact ? '' : ''}`} aria-live="polite">
        {placed.length > 0 && (
          <div className="rise rounded-xl border border-up/30 bg-up/8 p-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-up text-bg"><Check size={15} strokeWidth={3} /></span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-bold text-tx">{placed.length === 1 ? 'Bet placed' : `${placed.length} bets placed`}</p>
                <ul className="mt-1.5 space-y-1">
                  {placed.map((r) => (
                    <li key={r.it.selId} className="flex justify-between gap-2 text-[12px] text-tx2">
                      <span className="truncate">{r.sel?.label ?? 'Selection'} · <span className="num">{fmtOdds(r.it.accepted)}</span></span>
                      <span className="num shrink-0 text-tx3">{r.st?.betId}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => dismissPlaced(false)} className="btn-primary h-8 px-3 text-[12.5px]">Done</button>
                  <button type="button" onClick={() => dismissPlaced(true)} className="btn-ghost h-8 px-3 text-[12.5px]"><RotateCcw size={13} /> Reuse selections</button>
                  <Link to="/sports/bets?tab=open" className="inline-flex h-8 items-center gap-1 px-1 text-[12.5px] font-semibold text-accent hover:underline">My bets <ArrowRight size={13} /></Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {changed.length > 0 && !placing && (
          <Banner tone="warn" icon={<TriangleAlert size={15} />}>
            <b className="text-tx">{changed.length === 1 ? 'The price changed.' : `${changed.length} prices changed.`}</b> Check the new odds and accept them to place your bet.
          </Banner>
        )}
        {suspended.length > 0 && !placing && (
          <Banner tone="muted" icon={<Lock size={14} />} action={<button type="button" onClick={() => suspended.forEach((r) => removeSelection(r.it.selId))} className="shrink-0 text-[12px] font-bold text-tx underline-offset-2 hover:underline">Remove</button>}>
            {suspended.length === 1 ? 'A selection is suspended or closed.' : `${suspended.length} selections are suspended or closed.`} Wait for it to reopen or remove it.
          </Banner>
        )}

        {rows.filter((r) => r.status !== 'placed').map((r) => (
          <SlipCard key={r.it.selId} item={r.it} sel={r.sel} st={r.st} status={r.status} />
        ))}

        {active.length > 0 && !placing && <SlipDemo />}

        {active.length > 1 && !placing && (
          <div className="flex items-center gap-2 rounded-xl border border-line bg-s2/60 px-3 py-2">
            <label htmlFor="all-stake" className="flex-1 text-[12.5px] font-semibold text-tx2">Same stake for all</label>
            <div className="relative w-28">
              <input id="all-stake" inputMode="decimal" placeholder="0.00" value={allStake}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                  setAll(v);
                  setAllStakes(v);
                }}
                className="num h-9 w-full rounded-lg border border-line2 bg-bg pl-2.5 pr-12 text-right text-[14px] font-bold text-tx outline-none focus:border-accent" />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-tx3">USDT</span>
            </div>
          </div>
        )}
      </div>

      {active.length > 0 && (
        <div className="border-t border-line bg-s1 px-4 pb-4 pt-3">
          <dl className="space-y-1.5 text-[13px]">
            <div className="flex justify-between"><dt className="text-tx2">Total stake</dt><dd className="num font-bold text-tx">{fmtUsdt(totalStake)} USDT</dd></div>
            <div className="flex justify-between"><dt className="text-tx2">Potential return</dt><dd className="num font-bold text-gold">{fmtUsdt(totalReturn)} USDT</dd></div>
            <div className="flex justify-between text-[12px]">
              <dt className="text-tx3">Instant rakeback <span className="text-tx3/80">({fmtPct(RAKEBACK_RATE, 0)} of house edge)</span></dt>
              <dd className="num font-semibold text-accent">+{fmtUsdt(rakeback)} USDT</dd>
            </div>
          </dl>
          {overBalance && <p className="mt-2 text-[12px] font-medium text-down">Your demo balance is {fmtUsdt(balance)} USDT.</p>}
          <button type="button" onClick={cta.onClick} disabled={cta.disabled}
            className={`mt-3 h-12 w-full text-[15px] ${cta.tone === 'warn' ? 'inline-flex items-center justify-center gap-2 rounded-lg bg-warn font-bold text-bg hover:bg-[#ffc670]' : 'btn-primary'}`}>
            {placing && <Loader2 size={17} className="animate-[spin_0.8s_linear_infinite]" />}
            {cta.label}
          </button>
        </div>
      )}
    </div>
  );
}

function edgeOf(sel?: Selection) {
  return sel?.odds && sel.fair ? 1 - sel.odds / sel.fair : 0.05;
}

function Banner({ tone, icon, children, action }: { tone: 'warn' | 'muted' | 'error'; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  const t = tone === 'warn' ? 'border-warn/30 bg-warn/10 text-warn' : tone === 'error' ? 'border-down/30 bg-down/10 text-down' : 'border-line2 bg-s3 text-tx2';
  return (
    <div className={`rise flex items-start gap-2 rounded-xl border px-3 py-2.5 ${t}`} role="status">
      <span className="mt-px shrink-0">{icon}</span>
      <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-tx2">{children}</p>
      {action}
    </div>
  );
}

function SlipCard({ item, sel, st, status }: { item: SlipItem; sel?: Selection; st?: SlipItemState; status: ItemStatus }) {
  const match = useStore((s) => (sel ? s.matches[sel.matchId] : undefined));
  const setStake = useStore((s) => s.setStake);
  const remove = useStore((s) => s.removeSelection);
  const set = useStore((s) => s.set);
  const err = stakeError(item.stake);
  const stake = parseStake(item.stake) || 0;
  const odds = status === 'changed' ? sel!.odds! : item.accepted;
  const up = status === 'changed' && sel!.odds! > item.accepted;
  const locked = status === 'placing';
  const inputId = `stake-${item.selId}`;

  const border =
    status === 'changed' ? 'border-warn/45' : status === 'suspended' || status === 'closed' ? 'border-line2' : status === 'failed' ? 'border-down/45' : 'border-line';

  return (
    <article className={`rise relative overflow-hidden rounded-xl border bg-s2 ${border} ${status === 'suspended' ? 'hatch' : ''}`}>
      <div className="flex items-start gap-2 px-3 pt-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11.5px] text-tx3">
            {sel?.marketName ?? 'Market'}
            {match && (
              <>
                {' · '}
                <Link to={`/sports/match/${match.id}`} className="hover:text-tx">
                  {teamById[match.home].short} v {teamById[match.away].short}
                </Link>
              </>
            )}
            {match?.status === 'live' && <span className="num ml-1.5 font-bold text-live">{match.score[0]}–{match.score[1]}</span>}
          </p>
          <p className="mt-0.5 truncate font-display text-[15px] font-bold text-tx">{sel?.label ?? 'Selection'}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          {status === 'suspended' ? (
            <span className="inline-flex h-7 items-center gap-1 rounded-md bg-warn/12 px-2 text-[12px] font-bold text-warn"><Lock size={12} strokeWidth={2.4} /> Suspended</span>
          ) : status === 'closed' ? (
            <span className="inline-flex h-7 items-center rounded-md bg-s4 px-2 text-[12px] font-bold text-tx2">Closed</span>
          ) : status === 'changed' ? (
            <span className="flex items-baseline gap-1.5">
              <span className="num text-[12px] text-tx3 line-through">{fmtOdds(item.accepted)}</span>
              <span className={`num inline-flex items-center gap-1 text-[17px] font-extrabold ${up ? 'text-up' : 'text-down'}`}><Tri up={up} size={9} /> {fmtOdds(odds)}</span>
            </span>
          ) : (
            <span className="num text-[17px] font-extrabold text-tx">{fmtOdds(odds)}</span>
          )}
        </div>
        {!locked && (
          <button type="button" aria-label={`Remove ${sel?.label ?? 'selection'}`} onClick={() => remove(item.selId)} className="-mr-1 -mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-tx3 hover:bg-s4 hover:text-tx">
            <X size={15} />
          </button>
        )}
      </div>

      <div className="px-3 pb-3 pt-2.5">
        <div className="flex items-center gap-2">
          <label htmlFor={inputId} className="sr-only">Stake for {sel?.label}</label>
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"><UsdtIcon size={16} /></span>
            <input
              id={inputId}
              inputMode="decimal"
              autoComplete="off"
              placeholder="Stake"
              disabled={locked || status === 'closed'}
              value={item.stake}
              aria-invalid={!!err}
              aria-describedby={err ? `${inputId}-err` : undefined}
              onChange={(e) => setStake(item.selId, e.target.value)}
              onFocus={() => set({ panelTab: 'slip' })}
              className={`num h-10 w-full rounded-lg border bg-bg pl-8 pr-12 text-[15px] font-bold text-tx outline-none transition-colors placeholder:font-sans placeholder:font-medium placeholder:text-tx3 focus:border-accent disabled:opacity-60 ${err ? 'border-down/60' : 'border-line2'}`}
            />
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-tx3">USDT</span>
          </div>
          <div className="w-[104px] shrink-0 text-right">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-tx3">Returns</p>
            <p className="num truncate text-[15px] font-bold text-gold">{fmtUsdt(stake * (sel?.odds ?? item.accepted))}</p>
          </div>
        </div>
        {err && <p id={`${inputId}-err`} className="mt-1.5 text-[12px] font-medium text-down">{err}</p>}
        {!locked && status !== 'closed' && (
          <div className="mt-2 flex items-center gap-1.5">
            {QUICK.map((q) => (
              <button key={q} type="button" onClick={() => setStake(item.selId, String(stake + q))} className="num h-7 flex-1 rounded-md border border-line bg-s3 text-[12px] font-bold text-tx2 transition-colors hover:border-line2 hover:text-tx">
                +{q}
              </button>
            ))}
          </div>
        )}
        {sel?.fair && sel.odds && status !== 'closed' && (
          <p className="mt-2 flex items-center justify-between text-[11.5px] text-tx3">
            <span>House edge <b className="num text-tx2">{fmtPct(1 - sel.odds / sel.fair)}</b> · fair price <b className="num text-tx2">{sel.fair.toFixed(2)}</b></span>
            {stake > 0 && <span className="num text-accent">+{fmtUsdt(stake * (1 - sel.odds / sel.fair) * RAKEBACK_RATE)} rakeback</span>}
          </p>
        )}
        {st?.error && status !== 'placing' && (
          <div className={`mt-2.5 flex items-start gap-2 rounded-lg px-2.5 py-2 text-[12px] leading-snug ${status === 'failed' ? 'bg-down/10 text-down' : 'bg-warn/10 text-warn'}`} role="alert">
            {status === 'failed' ? <CircleX size={14} className="mt-px shrink-0" /> : <TriangleAlert size={14} className="mt-px shrink-0" />}
            <span className="flex-1">
              <b>{status === 'failed' ? 'Bet failed. ' : ''}</b>
              <span className="text-tx2">{st.error}</span>
            </span>
          </div>
        )}
      </div>

      {locked && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-s2/75 text-[13px] font-semibold text-tx backdrop-blur-[1px]">
          <Loader2 size={16} className="animate-[spin_0.8s_linear_infinite] text-accent" /> Placing…
        </div>
      )}
    </article>
  );
}

function EmptySlip() {
  const liveCount = useStore((s) => Object.values(s.matches).filter((m) => m.status === 'live' || m.status === 'ht').length);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="relative">
        <div className="grid grid-cols-3 gap-1 opacity-90" aria-hidden>
          {['1', 'X', '2'].map((l, i) => (
            <span key={l} className={`flex h-10 w-12 flex-col items-center justify-center rounded-lg border text-[10px] font-bold ${i === 0 ? 'border-accent bg-accent text-ink' : 'border-line bg-s3 text-tx3'}`}>
              {l}
              <span className="num text-[12px]">{['1.62', '4.10', '5.25'][i]}</span>
            </span>
          ))}
        </div>
      </div>
      <p className="mt-1 font-display text-[16px] font-bold text-tx">Your bet slip is empty</p>
      <p className="max-w-[240px] text-[13px] leading-relaxed text-tx2">Tap any price to add it here. Each selection is placed as its own single.</p>
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        <Link to="/sports/live" className="btn-ghost h-9 px-3 text-[12.5px]">Live now · {liveCount}</Link>
        <Link to={`/sports/match/${FEATURED_MATCH_ID}`} className="btn-ghost h-9 px-3 text-[12.5px]">Arsenal v Brighton</Link>
      </div>
    </div>
  );
}
