import { create } from 'zustand';
import type { Bet, Market, Match, PriceMeta, Selection, SlipItem, SlipItemState, Toast } from './types';
import { buildFixtures, FEATURED_MATCH_ID } from './data/fixtures';
import { compById, teamById } from './data/catalog';
import { buildMarketByKey, buildMarkets, parseSelId } from './engine/pricing';
import { applyGoal, drift, stepMatch, type SimEvent } from './engine/sim';
import { fmtUsdt, parseStake } from './lib/format';
import { rand } from './lib/rng';
import { readJSON, writeJSON } from './lib/storage';

/** All money in this prototype is demo USDT. Nothing is sent anywhere. */
export const START_BALANCE = 250;
export const MIN_STAKE = 0.1;
export const MAX_STAKE = 500;
/** Matches the Instant Rakeback rate Housebets publishes (10% of house edge). */
export const RAKEBACK_RATE = 0.1;
export const CASHOUT_FACTOR = 0.97;

const LS = 'hb-sportsbook-v1';
interface Persisted {
  followTeams: string[];
  followComps: string[];
  openBook: boolean;
  introDismissed: boolean;
}
function loadPersisted(): Persisted {
  const d: Persisted = { followTeams: ['ars'], followComps: ['pl'], openBook: false, introDismissed: false };
  return { ...d, ...readJSON<Partial<Persisted>>(LS, {}) };
}

export interface State {
  now: number;
  matches: Record<string, Match>;
  order: string[];
  markets: Record<string, Market[]>;
  sel: Record<string, Selection>;
  meta: Record<string, PriceMeta>;
  nextPrice: Record<string, number>;

  slip: SlipItem[];
  slipState: Record<string, SlipItemState>;
  sheetOpen: boolean;
  panelTab: 'slip' | 'bets';
  bets: Bet[];
  balance: number;
  rakeback: number;

  followTeams: string[];
  followComps: string[];
  openBook: boolean;
  introDismissed: boolean;
  demo: { failNext: boolean; nothingLive: boolean };
  toasts: Toast[];
  navOpen: boolean;
  navCollapsed: boolean;
  searchOpen: boolean;
  demoOpen: boolean;

  tick: () => void;
  settle: () => void;
  toggleSelection: (id: string) => void;
  removeSelection: (id: string) => void;
  setStake: (id: string, stake: string) => void;
  setAllStakes: (stake: string) => void;
  acceptChanges: () => void;
  clearSlip: () => void;
  dismissPlaced: (keep: boolean) => void;
  placeBets: () => void;
  cashOut: (betId: string, quoted: number) => 'ok' | 'changed' | 'suspended';
  claimRakeback: () => void;
  toggleFollowTeam: (id: string) => void;
  toggleFollowComp: (id: string) => void;
  setOpenBook: (v: boolean) => void;
  dismissIntro: () => void;
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  set: (p: Partial<State>) => void;
  // demo controls
  demoMoveSlipOdds: () => boolean;
  demoSuspendSlip: () => boolean;
  demoGoal: (matchId: string, side: 'h' | 'a') => void;
  demoReset: () => void;
}

const uid = (p: string) => `${p}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const matchLabel = (m: Match) => `${teamById[m.home].name} v ${teamById[m.away].name}`;

/** Re-price a set of matches and diff against previous prices. */
function reprice(state: State, ids: string[], now: number) {
  const markets = { ...state.markets };
  const sel = { ...state.sel };
  const meta = { ...state.meta };
  for (const id of ids) {
    const m = state.matches[id];
    const list = buildMarkets(m, now);
    markets[id] = list;
    for (const mk of list) for (const s of mk.selections) upsert(sel, meta, s, now);
  }
  // Selections that the slip or open bets depend on but are no longer listed
  // (e.g. "Next goal (3rd)" after the 3rd goal) are priced individually.
  const needed = new Set<string>([...state.slip.map((s) => s.selId), ...state.bets.filter((b) => b.status === 'open').map((b) => b.selId)]);
  for (const sid of needed) {
    const { matchId, key } = parseSelId(sid);
    if (!ids.includes(matchId)) continue;
    if (markets[matchId]?.some((mk) => mk.key === key)) continue;
    const mk = buildMarketByKey(state.matches[matchId], key, now);
    mk?.selections.forEach((s) => upsert(sel, meta, s, now));
  }
  return { markets, sel, meta };
}

function upsert(sel: Record<string, Selection>, meta: Record<string, PriceMeta>, s: Selection, now: number) {
  const prev = sel[s.id];
  if (prev && prev.odds === s.odds && prev.status === s.status && prev.label === s.label) return;
  sel[s.id] = s;
  if (prev && prev.odds && s.odds && prev.odds !== s.odds) meta[s.id] = { prev: prev.odds, dir: s.odds > prev.odds ? 1 : -1, at: now };
}

function seedBets(matches: Record<string, Match>, now: number): Bet[] {
  const mk = (id: string, selKey: string, label: string, marketName: string, odds: number, stake: number, minsAgo: number): Bet => {
    const m = matches[id];
    return {
      id: uid('HB-'), selId: `${id}|${selKey}`, matchId: id, matchLabel: matchLabel(m), compName: compById[m.compId].name,
      marketName, label, odds, stake, placedAt: now - minsAgo * 60_000, status: 'open', edge: 0.045,
    };
  };
  const settled = (matchLbl: string, comp: string, marketName: string, label: string, odds: number, stake: number, status: Bet['status'], returned: number, hoursAgo: number): Bet => ({
    id: uid('HB-'), selId: `x|${label}`, matchId: '', matchLabel: matchLbl, compName: comp, marketName, label, odds, stake,
    placedAt: now - hoursAgo * 3600_000 - 2 * 3600_000, settledAt: now - hoursAgo * 3600_000, status, returned, edge: 0.048,
  });
  return [
    mk(FEATURED_MATCH_ID, '1x2|h', 'Arsenal', 'Match result', 2.1, 20, 46),
    mk('liv-new', 'btts|yes', 'Yes', 'Both teams to score', 1.95, 10, 22),
    mk('lal-bos', 'win|a', 'Boston Celtics', 'Winner', 1.8, 15, 35),
    mk('che-avl', '1x2|h', 'Chelsea', 'Match result', 1.95, 25, 90),
    settled('Barcelona v Girona', 'LaLiga', 'Total goals 2.5', 'Over 2.5', 1.72, 30, 'won', 51.6, 20),
    settled('Real Madrid v Sevilla', 'LaLiga', 'Handicap RMA −1.5', 'Real Madrid −1.5', 2.3, 20, 'cashed', 31.8, 26),
    settled('Dortmund v RB Leipzig', 'Bundesliga', 'Match result', 'Dortmund', 2.45, 10, 'lost', 0, 27),
    settled('Milan v Lazio', 'Serie A', 'Draw no bet', 'Milan', 1.62, 15, 'void', 15, 49),
  ];
}

function initial() {
  const now = Date.now();
  const list = buildFixtures(now);
  const matches = Object.fromEntries(list.map((m) => [m.id, m]));
  const base = {
    now,
    matches,
    order: list.map((m) => m.id),
    markets: {} as Record<string, Market[]>,
    sel: {} as Record<string, Selection>,
    meta: {} as Record<string, PriceMeta>,
    nextPrice: Object.fromEntries(list.map((m) => [m.id, now + 2000 + rand() * 6000])),
    slip: [] as SlipItem[],
    slipState: {} as Record<string, SlipItemState>,
    bets: seedBets(matches, now),
    balance: START_BALANCE,
    rakeback: 0.18,
  };
  const priced = reprice(base as unknown as State, list.map((m) => m.id), now);
  return { ...base, ...priced, meta: {} };
}

let lastTick = Date.now();

export const useStore = create<State>((set, get) => ({
  ...initial(),
  ...loadPersisted(),
  sheetOpen: false,
  panelTab: 'slip',
  demo: { failNext: false, nothingLive: false },
  toasts: [],
  navOpen: false,
  navCollapsed: false,
  searchOpen: false,
  demoOpen: false,

  set: (p) => set(p),

  tick: () => {
    const now = Date.now();
    const dt = Math.min(5, (now - lastTick) / 1000);
    lastTick = now;
    const s = get();
    const ev: SimEvent[] = [];
    const matches = { ...s.matches };
    const nextPrice = { ...s.nextPrice };
    const due: string[] = [];
    for (const id of s.order) {
      const before = matches[id];
      let m = stepMatch(before, dt, now, ev);
      const live = m.status === 'live';
      const suspEnded = before.suspendedUntil > s.now && before.suspendedUntil <= now;
      const mkEnded = Object.values(before.marketSuspend).some((t) => t > s.now && t <= now);
      if (now >= nextPrice[id] || suspEnded || mkEnded) {
        if (now >= nextPrice[id]) {
          m = drift(m, live);
          nextPrice[id] = now + (live ? 5000 + rand() * 9000 : 40000 + rand() * 60000);
        }
        due.push(id);
      }
      matches[id] = m;
    }
    for (const e of ev) if (!due.includes(e.matchId)) due.push(e.matchId);
    const next: Partial<State> = { now, matches, nextPrice };
    if (due.length) Object.assign(next, reprice({ ...s, matches } as State, due, now));
    set(next);

    // Event toasts for followed / bet-on matches
    const st = get();
    for (const e of ev) {
      const m = st.matches[e.matchId];
      const involved = st.bets.some((b) => b.matchId === m.id && b.status === 'open') || st.slip.some((x) => x.selId.startsWith(m.id + '|'));
      const followed = st.followTeams.includes(m.home) || st.followTeams.includes(m.away);
      if (e.kind === 'goal' && m.sport === 'football' && (involved || followed)) {
        const t = teamById[e.side === 'h' ? m.home : m.away];
        st.toast({ tone: 'info', title: `Goal · ${t.name}`, body: `${matchLabel(m)} ${m.score[0]}–${m.score[1]}`, action: { label: 'Open match', to: `/sports/match/${m.id}` } });
      }
      if (e.kind === 'kickoff' && (involved || followed)) st.toast({ tone: 'info', title: 'Kick-off', body: `${matchLabel(m)} is live`, action: { label: 'Watch odds', to: `/sports/match/${m.id}` } });
    }
    get().settle();
  },

  // Settle open bets whose selection has been decided by the model.
  settle: () => {
    const s = get();
    let balance = s.balance;
    let changed = false;
    const bets = s.bets.map((b) => {
      if (b.status !== 'open') return b;
      const sel = s.sel[b.selId];
      if (!sel || !['won', 'lost', 'void'].includes(sel.status)) return b;
      changed = true;
      const returned = sel.status === 'won' ? +(b.stake * b.odds).toFixed(2) : sel.status === 'void' ? b.stake : 0;
      balance += returned;
      const tone = sel.status === 'won' ? 'success' : sel.status === 'void' ? 'info' : 'warn';
      const title = sel.status === 'won' ? `Bet won · +${fmtUsdt(returned)} USDT` : sel.status === 'void' ? 'Bet void · stake returned' : 'Bet lost';
      s.toast({ tone, title, body: `${b.label} · ${b.matchLabel}`, action: { label: 'My bets', to: '/sports/bets?tab=settled' } });
      return { ...b, status: sel.status as Bet['status'], returned, settledAt: Date.now() };
    });
    if (changed) set({ bets, balance });
  },

  toggleSelection: (id) => {
    const s = get();
    if (s.slip.some((x) => x.selId === id)) return s.removeSelection(id);
    const sel = s.sel[id];
    if (!sel || sel.status !== 'open' || !sel.odds) return;
    if (s.slip.length >= 12) {
      s.toast({ tone: 'warn', title: 'Bet slip is full', body: 'You can have up to 12 singles at once.' });
      return;
    }
    const last = s.slip[s.slip.length - 1]?.stake ?? '';
    set({ slip: [...s.slip, { selId: id, stake: last, accepted: sel.odds, addedAt: Date.now() }], panelTab: 'slip' });
  },
  removeSelection: (id) => {
    const s = get();
    const slipState = { ...s.slipState };
    delete slipState[id];
    set({ slip: s.slip.filter((x) => x.selId !== id), slipState });
  },
  setStake: (id, stake) => {
    const clean = stake.replace(/[^0-9.,]/g, '').replace(',', '.');
    const s = get();
    const st = s.slipState[id];
    set({
      slip: s.slip.map((x) => (x.selId === id ? { ...x, stake: clean } : x)),
      slipState: st?.phase === 'failed' ? { ...s.slipState, [id]: { phase: 'idle' } } : s.slipState,
    });
  },
  setAllStakes: (stake) => {
    const s = get();
    set({ slip: s.slip.map((x) => (s.slipState[x.selId]?.phase === 'placed' ? x : { ...x, stake })) });
  },
  acceptChanges: () => {
    const s = get();
    set({ slip: s.slip.map((x) => (s.sel[x.selId]?.odds ? { ...x, accepted: s.sel[x.selId].odds! } : x)) });
  },
  clearSlip: () => set({ slip: [], slipState: {} }),
  dismissPlaced: (keep) => {
    const s = get();
    const placed = s.slip.filter((x) => s.slipState[x.selId]?.phase === 'placed').map((x) => x.selId);
    const slipState = { ...s.slipState };
    placed.forEach((p) => delete slipState[p]);
    set({ slip: keep ? s.slip.map((x) => (placed.includes(x.selId) ? { ...x, stake: '', accepted: s.sel[x.selId]?.odds ?? x.accepted } : x)).filter((x) => s.sel[x.selId]?.status === 'open') : s.slip.filter((x) => !placed.includes(x.selId)), slipState });
  },

  placeBets: () => {
    const s = get();
    const ready = s.slip.filter((x) => (s.slipState[x.selId]?.phase ?? 'idle') !== 'placed');
    const total = ready.reduce((a, x) => a + (parseStake(x.stake) || 0), 0);
    if (total > s.balance + 1e-9) {
      s.toast({ tone: 'error', title: 'Not enough balance', body: `Total stake ${fmtUsdt(total)} USDT is more than your ${fmtUsdt(s.balance)} USDT demo balance.` });
      return;
    }
    const placing: Record<string, SlipItemState> = { ...s.slipState };
    const snapshot = ready.map((x) => ({ ...x }));
    snapshot.forEach((x) => (placing[x.selId] = { phase: 'placing' }));
    const fail = s.demo.failNext;
    set({ slipState: placing, demo: { ...s.demo, failNext: false } });

    setTimeout(() => {
      const st = get();
      const slipState = { ...st.slipState };
      const newBets: Bet[] = [];
      let balance = st.balance;
      let placedCount = 0;
      let failedCount = 0;
      for (const x of snapshot) {
        const sel = st.sel[x.selId];
        const stake = parseStake(x.stake) || 0;
        if (fail) {
          slipState[x.selId] = { phase: 'failed', error: 'We couldn’t confirm this bet with our trading service. Nothing was taken from your balance.' };
          failedCount++;
          continue;
        }
        if (!sel || sel.status === 'suspended') {
          slipState[x.selId] = { phase: 'failed', error: 'The market was suspended while we were placing this bet. Nothing was taken.' };
          failedCount++;
          continue;
        }
        if (sel.status !== 'open' || !sel.odds) {
          slipState[x.selId] = { phase: 'failed', error: 'This market has closed. Remove the selection to continue.' };
          failedCount++;
          continue;
        }
        if (sel.odds !== x.accepted) {
          slipState[x.selId] = { phase: 'idle', error: 'Odds moved while we were placing this bet. Check the new price and accept it to try again.' };
          failedCount++;
          continue;
        }
        if (stake > balance + 1e-9) {
          slipState[x.selId] = { phase: 'failed', error: 'Not enough balance for this stake.' };
          failedCount++;
          continue;
        }
        const m = st.matches[sel.matchId];
        const mk = st.markets[m.id]?.find((k) => k.id === sel.marketId);
        const bet: Bet = {
          id: uid('HB-'), selId: x.selId, matchId: m.id, matchLabel: matchLabel(m), compName: compById[m.compId].name,
          marketName: sel.marketName, label: sel.label, odds: sel.odds, stake, placedAt: Date.now(), status: 'open',
          edge: sel.fair ? 1 - sel.odds / sel.fair : mk?.edge ?? 0.05,
        };
        balance -= stake;
        newBets.push(bet);
        slipState[x.selId] = { phase: 'placed', betId: bet.id };
        placedCount++;
      }
      const rb = newBets.reduce((a, b) => a + b.stake * b.edge * RAKEBACK_RATE, 0);
      set({ slipState, bets: [...newBets, ...st.bets], balance, rakeback: st.rakeback + rb });
      if (placedCount) st.toast({ tone: 'success', title: placedCount === 1 ? 'Bet placed' : `${placedCount} bets placed`, body: `+${fmtUsdt(rb)} USDT instant rakeback added to Rewards`, action: { label: 'My bets', to: '/sports/bets?tab=open' } });
      if (failedCount && !placedCount) st.toast({ tone: 'error', title: failedCount === 1 ? 'Bet not placed' : `${failedCount} bets not placed`, body: 'Check your bet slip for details.' });
    }, 1100 + rand() * 500);
  },

  cashOut: (betId, quoted) => {
    const s = get();
    const b = s.bets.find((x) => x.id === betId);
    if (!b || b.status !== 'open') return 'changed';
    const sel = s.sel[b.selId];
    if (!sel || sel.status !== 'open' || !sel.odds) return 'suspended';
    const value = cashoutValue(b, sel);
    if (Math.abs(value - quoted) > 0.005) return 'changed';
    set({
      bets: s.bets.map((x) => (x.id === betId ? { ...x, status: 'cashed', returned: value, settledAt: Date.now() } : x)),
      balance: s.balance + value,
    });
    s.toast({ tone: 'success', title: `Cashed out · +${fmtUsdt(value)} USDT`, body: `${b.label} · ${b.matchLabel}` });
    return 'ok';
  },

  claimRakeback: () => {
    const s = get();
    if (s.rakeback < 0.005) return;
    set({ balance: s.balance + s.rakeback, rakeback: 0 });
    s.toast({ tone: 'success', title: `Rakeback claimed · +${fmtUsdt(s.rakeback)} USDT`, body: 'Added to your demo balance.' });
  },

  toggleFollowTeam: (id) => {
    const s = get();
    const on = !s.followTeams.includes(id);
    set({ followTeams: on ? [...s.followTeams, id] : s.followTeams.filter((x) => x !== id) });
    s.toast({ tone: 'info', title: on ? `Following ${teamById[id].name}` : `Unfollowed ${teamById[id].name}`, body: on ? 'You’ll see their matches first and get goal alerts.' : undefined });
  },
  toggleFollowComp: (id) => {
    const s = get();
    const on = !s.followComps.includes(id);
    set({ followComps: on ? [...s.followComps, id] : s.followComps.filter((x) => x !== id) });
    s.toast({ tone: 'info', title: on ? `Following ${compById[id].name}` : `Unfollowed ${compById[id].name}` });
  },
  setOpenBook: (v) => set({ openBook: v }),
  dismissIntro: () => set({ introDismissed: true }),

  toast: (t) => {
    const id = uid('t');
    set({ toasts: [...get().toasts.slice(-3), { ...t, id }] });
    setTimeout(() => get().dismissToast(id), t.tone === 'error' ? 7000 : 4800);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  demoMoveSlipOdds: () => {
    const s = get();
    const items = s.slip.filter((x) => s.sel[x.selId]?.status === 'open');
    if (!items.length) return false;
    const now = Date.now();
    let matches = { ...s.matches };
    const ids = [...new Set(items.map((x) => parseSelId(x.selId).matchId))];
    let priced = reprice({ ...s, matches }, ids, now);
    for (let i = 0; i < 6; i++) {
      const allMoved = items.every((x) => priced.sel[x.selId]?.odds !== x.accepted);
      if (allMoved && i > 0) break;
      for (const id of ids) {
        const m = matches[id];
        const up = rand() < 0.5;
        matches = {
          ...matches,
          [id]: m.sport === 'football'
            ? { ...m, lh: m.lh * (up ? 1.22 : 0.8), la: m.la * (up ? 0.82 : 1.2) }
            : { ...m, sub: up ? [m.sub[0] + 1, m.sub[1]] : [m.sub[0], m.sub[1] + 1], score: m.sport === 'basketball' || m.sport === 'hockey' ? (up ? [m.score[0] + 2, m.score[1]] : [m.score[0], m.score[1] + 2]) : m.score },
        };
      }
      priced = reprice({ ...s, matches }, ids, now);
    }
    set({ matches, ...priced });
    return true;
  },
  demoSuspendSlip: () => {
    const s = get();
    const item = s.slip.find((x) => s.sel[x.selId]?.status === 'open');
    if (!item) return false;
    const { matchId, key } = parseSelId(item.selId);
    const now = Date.now();
    const m = s.matches[matchId];
    const fam = s.markets[matchId]?.find((k) => k.key === key)?.family ?? key;
    const matches = { ...s.matches, [matchId]: { ...m, marketSuspend: { ...m.marketSuspend, [fam]: now + 15000 } } };
    set({ matches, ...reprice({ ...s, matches }, [matchId], now) });
    return true;
  },
  demoGoal: (matchId, side) => {
    const s = get();
    const m = s.matches[matchId];
    if (!m || m.status !== 'live') return;
    const now = Date.now();
    const matches = { ...s.matches, [matchId]: applyGoal(m, side, now) };
    set({ matches, ...reprice({ ...s, matches }, [matchId], now) });
    s.toast({ tone: 'info', title: `Goal · ${teamById[side === 'h' ? m.home : m.away].name}`, body: `${matchLabel(m)} ${matches[matchId].score[0]}–${matches[matchId].score[1]} · markets suspended for 6s` });
  },
  demoReset: () => {
    lastTick = Date.now();
    set({ ...initial(), demo: { failNext: false, nothingLive: false }, toasts: [] });
  },
}));

export function cashoutValue(b: Bet, sel: Selection) {
  if (!sel.odds) return 0;
  return Math.floor(((b.stake * b.odds) / sel.odds) * CASHOUT_FACTOR * 100) / 100;
}

// Persist preferences only. Matches, slip and bets reset on reload so the
// demo always starts from a coherent state.
useStore.subscribe((s, p) => {
  if (s.followTeams !== p.followTeams || s.followComps !== p.followComps || s.openBook !== p.openBook || s.introDismissed !== p.introDismissed) {
    writeJSON(LS, { followTeams: s.followTeams, followComps: s.followComps, openBook: s.openBook, introDismissed: s.introDismissed });
  }
});

export const FEATURED = FEATURED_MATCH_ID;
