import type { Market, MarketGroup, Match, Selection, SelStatus } from '../types';
import { playersByTeam, teamById } from '../data/catalog';

/**
 * Pricing model (demo).
 *
 * Every price in the prototype comes from one coherent model instead of random
 * numbers: football uses independent Poisson goal processes scaled by the time
 * left, other sports use simple state-based win models. A fixed margin per
 * market type turns fair probabilities into odds, which is what lets the
 * "Open Book" feature show the real house edge and fair price for every
 * selection. Odds are rounded DOWN to a price ladder, so the edge shown is
 * never understated.
 */

export const SEP = '|';
export const selId = (matchId: string, key: string, outcome: string) => `${matchId}${SEP}${key}${SEP}${outcome}`;
export function parseSelId(id: string) {
  const [matchId, key, outcome] = id.split(SEP);
  return { matchId, key, outcome };
}

const MARGIN: Record<string, number> = {
  '1x2': 0.048, dc: 0.055, dnb: 0.045, btts: 0.06, tg: 0.05, tt: 0.065, ng: 0.06,
  '1h': 0.06, '2h': 0.06, '2htg': 0.065, hmg: 0.07, hcp: 0.042, eh: 0.055,
  ats: 0.13, ngs: 0.14, tc: 0.08, nc: 0.075, tk: 0.09,
  win: 0.045, tot: 0.05, spr: 0.045,
};

const LADDER: [number, number][] = [[2, 0.01], [3, 0.02], [4, 0.05], [6, 0.1], [10, 0.2], [20, 0.5], [50, 1], [101, 5]];

export function toOdds(p: number, margin: number): number | null {
  if (p <= 0) return null;
  const raw = 1 / (p * (1 + margin));
  if (raw < 1.01) return 1.01;
  if (raw >= 101) return null;
  const step = LADDER.find(([lim]) => raw < lim)![1];
  return Math.max(1.01, Math.floor(raw / step + 1e-9) * step);
}

// ── maths helpers ──────────────────────────────────────────────────────────

const N = 13;
function pmf(l: number): number[] {
  const out = new Array(N).fill(0);
  if (l <= 1e-9) {
    out[0] = 1;
    return out;
  }
  let v = Math.exp(-l);
  out[0] = v;
  for (let k = 1; k < N; k++) {
    v = (v * l) / k;
    out[k] = v;
  }
  const s = out.reduce((a, b) => a + b, 0);
  return out.map((x) => x / s);
}

/** Probability of fn(finalHome, finalAway) given current score and remaining intensities. */
function gridProb(sh: number, sa: number, lh: number, la: number, fn: (h: number, a: number) => boolean) {
  const ph = pmf(lh);
  const pa = pmf(la);
  let p = 0;
  for (let i = 0; i < N; i++) {
    if (ph[i] === 0) continue;
    for (let j = 0; j < N; j++) if (pa[j] !== 0 && fn(sh + i, sa + j)) p += ph[i] * pa[j];
  }
  return p;
}

function poissonOver(cur: number, l: number, line: number) {
  const p = pmf(l);
  let s = 0;
  for (let k = 0; k < N; k++) if (cur + k > line) s += p[k];
  return s;
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const logit = (p: number) => Math.log(p / (1 - p));
function phi(z: number) {
  // Abramowitz-Stegun approximation of the normal CDF
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

// ── shared clock helpers ───────────────────────────────────────────────────

export function clockSeconds(m: Match, now: number) {
  if (m.status === 'pre') return 0;
  if (m.status === 'ht') return 2700;
  if (m.status === 'ft') return Math.max(5400, m.clockSec);
  return m.clockSec + (now - m.clockAt) / 1000;
}

/** Fraction of a full match still to play (football). */
function remaining(m: Match, now: number) {
  if (m.status === 'pre') return 1;
  if (m.status === 'ft') return 0;
  if (m.status === 'ht') return 0.5;
  const sec = clockSeconds(m, now);
  if (sec < 2700) return (5400 - sec) / 5400;
  return Math.max(0.012, (5400 - sec) / 5400);
}

function remainingFirstHalf(m: Match, now: number) {
  if (m.status === 'pre') return 0.5;
  if (m.status !== 'live') return 0;
  const sec = clockSeconds(m, now);
  if (m.period === 1) return Math.max(0.006, (2700 - sec) / 5400);
  return 0;
}

// ── builder ────────────────────────────────────────────────────────────────

type Raw = { outcome: string; label: string; short: string; p: number | 'void' };

interface Spec {
  key: string;
  family: string;
  familyName: string;
  name: string;
  lineLabel?: string;
  groups: MarketGroup[];
  layout: Market['layout'];
  marginKey: string;
  raws: Raw[];
  note?: string;
}

const DECIDED_HI = 1 - 1e-9;
const DECIDED_LO = 1e-12;

function finalize(m: Match, spec: Spec, now: number): Market {
  const id = `${m.id}${SEP}${spec.key}`;
  const matchSusp = m.status === 'ht' ? false : m.suspendedUntil > now;
  const mkSusp = (m.marketSuspend[spec.family] ?? 0) > now || (m.marketSuspend[spec.key] ?? 0) > now;
  const margin = MARGIN[spec.marginKey] ?? 0.05;
  const selections: Selection[] = spec.raws.map((r) => {
    let status: SelStatus = 'open';
    let odds: number | null = null;
    let fair: number | null = null;
    if (r.p === 'void') status = 'void';
    else if (r.p >= DECIDED_HI && m.status !== 'pre') status = 'won';
    else if (r.p <= DECIDED_LO) status = 'lost';
    else {
      odds = toOdds(r.p, margin);
      fair = 1 / r.p;
      if (odds === null) status = 'unavailable';
      else if (matchSusp || mkSusp) status = 'suspended';
    }
    return { id: selId(m.id, spec.key, r.outcome), matchId: m.id, marketId: id, marketName: spec.name, label: r.label, short: r.short, odds, fair, status };
  });
  const open = selections.filter((s) => s.odds && s.fair);
  const edge = open.length ? open.reduce((a, s) => a + (1 - s.odds! / s.fair!), 0) / open.length : margin / (1 + margin);
  const settled = selections.every((s) => s.status === 'won' || s.status === 'lost' || s.status === 'void');
  return {
    id,
    key: spec.key,
    matchId: m.id,
    name: spec.name,
    family: spec.family,
    familyName: spec.familyName,
    lineLabel: spec.lineLabel,
    groups: spec.groups,
    layout: spec.layout,
    selections,
    edge,
    note: spec.note,
    status: settled ? 'settled' : matchSusp || mkSusp ? 'suspended' : 'open',
    hidden: settled,
  };
}

const fmtLine = (l: number) => (l > 0 ? `+${l}` : `${l}`);

function footballSpecs(m: Match, now: number, only?: string): Spec[] {
  const H = teamById[m.home];
  const A = teamById[m.away];
  const [sh, sa] = m.score;
  const r = remaining(m, now);
  const lh = m.lh * r;
  const la = m.la * r;
  const total = sh + sa;
  const ft = m.status === 'ft';
  const specs: Spec[] = [];
  const want = (family: string) => !only || only === family;
  const G = (fn: (h: number, a: number) => boolean) => gridProb(sh, sa, lh, la, fn);

  // Match result
  if (want('1x2')) {
    specs.push({
      key: '1x2', family: '1x2', familyName: 'Match result', name: 'Match result', groups: ['popular'], layout: 'grid3', marginKey: '1x2',
      raws: [
        { outcome: 'h', label: H.name, short: '1', p: G((h, a) => h > a) },
        { outcome: 'd', label: 'Draw', short: 'X', p: G((h, a) => h === a) },
        { outcome: 'a', label: A.name, short: '2', p: G((h, a) => h < a) },
      ],
    });
  }

  // Next goal (n-th goal)
  const nextN = total + 1;
  const ngFor = (n: number): Raw[] => {
    if (n <= total) {
      const side = m.goals[n - 1]?.side;
      return [
        { outcome: 'h', label: H.name, short: '1', p: side === 'h' ? 1 : 0 },
        { outcome: 'none', label: 'No goal', short: 'None', p: 0 },
        { outcome: 'a', label: A.name, short: '2', p: side === 'a' ? 1 : 0 },
      ];
    }
    const L = lh + la;
    const pn = Math.exp(-L);
    return [
      { outcome: 'h', label: H.name, short: '1', p: L > 0 ? (lh / L) * (1 - pn) : 0 },
      { outcome: 'none', label: 'No goal', short: 'None', p: pn },
      { outcome: 'a', label: A.name, short: '2', p: L > 0 ? (la / L) * (1 - pn) : 0 },
    ];
  };
  const ord = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;
  const ngKeys = only?.startsWith('ng:') ? [Number(only.split(':')[1])] : !only ? [nextN] : [];
  for (const n of ngKeys) {
    specs.push({ key: `ng:${n}`, family: 'ng', familyName: 'Next goal', name: `Next goal (${ord(n)} goal)`, groups: ['popular', 'goals'], layout: 'grid3', marginKey: 'ng', raws: ngFor(n) });
  }

  // Total goals lines
  const tgLines = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5];
  const pOverMain = tgLines.map((l) => ({ l, p: poissonOver(total, lh + la, l) }));
  const main = pOverMain.filter((x) => x.p > 0 && x.p < 1).sort((a, b) => Math.abs(a.p - 0.5) - Math.abs(b.p - 0.5))[0]?.l ?? 2.5;
  for (const { l, p } of pOverMain) {
    const key = `tg:${l}`;
    if (only && only !== key && only !== 'tg') continue;
    specs.push({
      key, family: 'tg', familyName: 'Total goals', name: `Total goals ${l}`, lineLabel: `${l}`,
      groups: l === main ? ['popular', 'goals'] : ['goals'], layout: 'lines', marginKey: 'tg',
      raws: [
        { outcome: 'over', label: `Over ${l}`, short: 'Over', p },
        { outcome: 'under', label: `Under ${l}`, short: 'Under', p: 1 - p },
      ],
    });
  }

  // Both teams to score
  if (want('btts')) {
    const p = G((h, a) => h > 0 && a > 0);
    specs.push({
      key: 'btts', family: 'btts', familyName: 'Both teams to score', name: 'Both teams to score', groups: ['popular', 'goals'], layout: 'grid2', marginKey: 'btts',
      raws: [{ outcome: 'yes', label: 'Yes', short: 'Yes', p }, { outcome: 'no', label: 'No', short: 'No', p: 1 - p }],
    });
  }

  // Double chance + Draw no bet
  if (want('dc')) {
    specs.push({
      key: 'dc', family: 'dc', familyName: 'Double chance', name: 'Double chance', groups: ['popular'], layout: 'grid3', marginKey: 'dc',
      raws: [
        { outcome: 'hd', label: `${H.name} or Draw`, short: '1X', p: G((h, a) => h >= a) },
        { outcome: 'ha', label: `${H.name} or ${A.name}`, short: '12', p: G((h, a) => h !== a) },
        { outcome: 'da', label: `Draw or ${A.name}`, short: 'X2', p: G((h, a) => h <= a) },
      ],
    });
  }
  if (want('dnb')) {
    const ph = G((h, a) => h > a);
    const pa = G((h, a) => h < a);
    const draw = ft && sh === sa;
    specs.push({
      key: 'dnb', family: 'dnb', familyName: 'Draw no bet', name: 'Draw no bet', groups: ['handicaps'], layout: 'grid2', marginKey: 'dnb',
      note: 'Stake returned if the match is a draw.',
      raws: [
        { outcome: 'h', label: H.name, short: '1', p: draw ? 'void' : ph / (ph + pa || 1) },
        { outcome: 'a', label: A.name, short: '2', p: draw ? 'void' : pa / (ph + pa || 1) },
      ],
    });
  }

  // Team totals
  for (const side of ['h', 'a'] as const) {
    const T = side === 'h' ? H : A;
    for (const l of [0.5, 1.5, 2.5, 3.5]) {
      const key = `tt:${side}:${l}`;
      if (only && only !== key) continue;
      const p = poissonOver(side === 'h' ? sh : sa, side === 'h' ? lh : la, l);
      specs.push({
        key, family: `tt:${side}`, familyName: `${T.name} total goals`, name: `${T.name} total goals ${l}`, lineLabel: `${l}`, groups: ['goals'], layout: 'lines', marginKey: 'tt',
        raws: [{ outcome: 'over', label: `Over ${l}`, short: 'Over', p }, { outcome: 'under', label: `Under ${l}`, short: 'Under', p: 1 - p }],
      });
    }
  }

  // Halves
  const r1 = remainingFirstHalf(m, now);
  const firstDone = m.status === 'ht' || m.period === 2 || ft;
  const ht = m.htScore ?? (firstDone ? m.score : undefined);
  if (want('1h')) {
    const [b1, b2] = firstDone ? ht! : m.status === 'pre' ? [0, 0] : [sh, sa];
    const l1 = firstDone ? 0 : m.lh * r1;
    const l2 = firstDone ? 0 : m.la * r1;
    const g = (fn: (h: number, a: number) => boolean) => gridProb(b1, b2, l1, l2, fn);
    specs.push({
      key: '1h', family: '1h', familyName: '1st half result', name: '1st half result', groups: ['halves'], layout: 'grid3', marginKey: '1h',
      raws: [
        { outcome: 'h', label: H.name, short: '1', p: g((h, a) => h > a) },
        { outcome: 'd', label: 'Draw', short: 'X', p: g((h, a) => h === a) },
        { outcome: 'a', label: A.name, short: '2', p: g((h, a) => h < a) },
      ],
    });
  }
  // 2nd-half goals so far + remaining 2nd-half intensity
  const g2: [number, number] = firstDone && ht ? [sh - ht[0], sa - ht[1]] : [0, 0];
  const r2 = firstDone ? (m.status === 'ht' ? 0.5 : r) : 0.5;
  const l2h = m.lh * r2;
  const l2a = m.la * r2;
  if (want('2h')) {
    const g = (fn: (h: number, a: number) => boolean) => gridProb(g2[0], g2[1], l2h, l2a, fn);
    specs.push({
      key: '2h', family: '2h', familyName: '2nd half result', name: '2nd half result', groups: ['halves'], layout: 'grid3', marginKey: '2h',
      note: 'Goals scored in the 2nd half only.',
      raws: [
        { outcome: 'h', label: H.name, short: '1', p: g((h, a) => h > a) },
        { outcome: 'd', label: 'Draw', short: 'X', p: g((h, a) => h === a) },
        { outcome: 'a', label: A.name, short: '2', p: g((h, a) => h < a) },
      ],
    });
  }
  for (const l of [0.5, 1.5, 2.5, 3.5]) {
    const key = `2htg:${l}`;
    if (only && only !== key) continue;
    const p = poissonOver(g2[0] + g2[1], l2h + l2a, l);
    specs.push({
      key, family: '2htg', familyName: '2nd half total goals', name: `2nd half total goals ${l}`, lineLabel: `${l}`, groups: ['halves'], layout: 'lines', marginKey: '2htg',
      raws: [{ outcome: 'over', label: `Over ${l}`, short: 'Over', p }, { outcome: 'under', label: `Under ${l}`, short: 'Under', p: 1 - p }],
    });
  }
  if (want('hmg')) {
    const G1cur = firstDone && ht ? ht[0] + ht[1] : m.status === 'pre' ? 0 : total;
    const p1 = pmf(firstDone ? 0 : (m.lh + m.la) * r1);
    const p2 = pmf(l2h + l2a);
    const G2cur = g2[0] + g2[1];
    let first = 0, eq = 0, second = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const w = p1[i] * p2[j];
      if (!w) continue;
      const a = G1cur + i, b = G2cur + j;
      if (a > b) first += w; else if (a === b) eq += w; else second += w;
    }
    specs.push({
      key: 'hmg', family: 'hmg', familyName: 'Half with most goals', name: 'Half with most goals', groups: ['halves'], layout: 'grid3', marginKey: 'hmg',
      raws: [
        { outcome: '1st', label: '1st half', short: '1st', p: first },
        { outcome: 'eq', label: 'Equal', short: 'Equal', p: eq },
        { outcome: '2nd', label: '2nd half', short: '2nd', p: second },
      ],
    });
  }

  // Handicaps (full-match goal difference, half lines: no pushes)
  for (const l of [-2.5, -1.5, -0.5, 0.5, 1.5]) {
    const key = `hcp:${l}`;
    if (only && only !== key) continue;
    const p = G((h, a) => h - a + l > 0);
    specs.push({
      key, family: 'hcp', familyName: 'Handicap', name: `Handicap ${H.short} ${fmtLine(l)}`, lineLabel: `${fmtLine(l)} / ${fmtLine(-l)}`, groups: ['handicaps'], layout: 'lines', marginKey: 'hcp',
      raws: [
        { outcome: 'h', label: `${H.name} ${fmtLine(l)}`, short: `${H.short} ${fmtLine(l)}`, p },
        { outcome: 'a', label: `${A.name} ${fmtLine(-l)}`, short: `${A.short} ${fmtLine(-l)}`, p: 1 - p },
      ],
    });
  }
  for (const l of [-1, 1]) {
    const key = `eh:${l}`;
    if (only && only !== key) continue;
    specs.push({
      key, family: `eh:${l}`, familyName: `3-way handicap ${H.short} ${fmtLine(l)}`, name: `3-way handicap ${H.short} ${fmtLine(l)}`, groups: ['handicaps'], layout: 'grid3', marginKey: 'eh',
      note: `${H.name} starts ${l > 0 ? 'one goal up' : 'one goal down'}.`,
      raws: [
        { outcome: 'h', label: `${H.name} ${fmtLine(l)}`, short: `1 (${fmtLine(l)})`, p: G((h, a) => h - a + l > 0) },
        { outcome: 'd', label: `Draw ${fmtLine(l)}`, short: `X (${fmtLine(l)})`, p: G((h, a) => h - a + l === 0) },
        { outcome: 'a', label: `${A.name} ${fmtLine(-l)}`, short: `2 (${fmtLine(-l)})`, p: G((h, a) => h - a + l < 0) },
      ],
    });
  }

  // Goalscorers (fictional players)
  const squad = (tid: string) => {
    const list = playersByTeam[tid] ?? [];
    const sum = list.reduce((a, p) => a + p.share, 0) || 1;
    return list.map((p) => ({ ...p, share: p.share / sum }));
  };
  const hs = squad(m.home);
  const as = squad(m.away);
  if (want('ats')) {
    const raws: Raw[] = [...hs.map((p) => ({ p, l: lh })), ...as.map((p) => ({ p, l: la }))].map(({ p, l }) => ({
      outcome: p.id, label: p.name, short: 'Anytime',
      p: m.goals.some((g) => g.playerId === p.id) ? 1 : 1 - Math.exp(-p.share * l),
    }));
    specs.push({ key: 'ats', family: 'ats', familyName: 'Anytime goalscorer', name: 'Anytime goalscorer', groups: ['scorers'], layout: 'scorers', marginKey: 'ats', raws });
  }
  const ngsKeys = only?.startsWith('ngs:') ? [Number(only.split(':')[1])] : !only ? [nextN] : [];
  for (const n of ngsKeys) {
    let raws: Raw[];
    if (n <= total) {
      const scorer = m.goals[n - 1]?.playerId;
      raws = [...hs, ...as].map((p) => ({ outcome: p.id, label: p.name, short: 'Next', p: p.id === scorer ? 1 : 0 }));
      raws.push({ outcome: 'none', label: 'No goalscorer', short: 'None', p: 0 });
    } else {
      const L = lh + la;
      const pn = Math.exp(-L);
      raws = [...hs.map((p) => ({ p, l: lh })), ...as.map((p) => ({ p, l: la }))].map(({ p, l }) => ({
        outcome: p.id, label: p.name, short: 'Next', p: L > 0 ? ((p.share * l) / L) * (1 - pn) : 0,
      }));
      raws.push({ outcome: 'none', label: 'No goalscorer', short: 'None', p: pn });
    }
    specs.push({ key: `ngs:${n}`, family: 'ngs', familyName: 'Next goalscorer', name: `Next goalscorer (${ord(n)} goal)`, groups: ['scorers'], layout: 'scorers', marginKey: 'ngs', raws });
  }

  // Corners & cards
  const diff = H.rating - A.rating;
  const ch = 5.6 * Math.exp(0.8 * diff) * r;
  const ca = 4.6 * Math.exp(-0.8 * diff) * r;
  const tcNow = m.corners[0] + m.corners[1];
  for (const l of [6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5]) {
    const key = `tc:${l}`;
    if (only && only !== key) continue;
    const p = poissonOver(tcNow, ch + ca, l);
    specs.push({
      key, family: 'tc', familyName: 'Total corners', name: `Total corners ${l}`, lineLabel: `${l}`, groups: ['cornerscards'], layout: 'lines', marginKey: 'tc',
      raws: [{ outcome: 'over', label: `Over ${l}`, short: 'Over', p }, { outcome: 'under', label: `Under ${l}`, short: 'Under', p: 1 - p }],
    });
  }
  const ncKeys = only?.startsWith('nc:') ? [Number(only.split(':')[1])] : !only ? [tcNow + 1] : [];
  for (const n of ncKeys) {
    let raws: Raw[];
    if (n <= m.cornerLog.length) {
      const side = m.cornerLog[n - 1];
      raws = [
        { outcome: 'h', label: H.name, short: '1', p: side === 'h' ? 1 : 0 },
        { outcome: 'none', label: 'No corner', short: 'None', p: 0 },
        { outcome: 'a', label: A.name, short: '2', p: side === 'a' ? 1 : 0 },
      ];
    } else {
      const L = ch + ca;
      const pn = Math.exp(-L);
      raws = [
        { outcome: 'h', label: H.name, short: '1', p: L > 0 ? (ch / L) * (1 - pn) : 0 },
        { outcome: 'none', label: 'No corner', short: 'None', p: pn },
        { outcome: 'a', label: A.name, short: '2', p: L > 0 ? (ca / L) * (1 - pn) : 0 },
      ];
    }
    specs.push({ key: `nc:${n}`, family: 'nc', familyName: 'Next corner', name: `Next corner (${ord(n)} corner)`, groups: ['cornerscards'], layout: 'grid3', marginKey: 'nc', raws });
  }
  const tkNow = m.cards[0] + m.cards[1] + 2 * (m.reds[0] + m.reds[1]);
  for (const l of [1.5, 2.5, 3.5, 4.5, 5.5, 6.5]) {
    const key = `tk:${l}`;
    if (only && only !== key) continue;
    const p = poissonOver(tkNow, 4.3 * r, l);
    specs.push({
      key, family: 'tk', familyName: 'Total cards', name: `Total cards ${l}`, lineLabel: `${l}`, groups: ['cornerscards'], layout: 'lines', marginKey: 'tk',
      note: 'Yellow card counts 1, red card counts 2.',
      raws: [{ outcome: 'over', label: `Over ${l}`, short: 'Over', p }, { outcome: 'under', label: `Under ${l}`, short: 'Under', p: 1 - p }],
    });
  }
  return specs;
}

// ── other sports ──────────────────────────────────────────────────────────

function bestOf3(sets: [number, number], q: number, qCurrent: number) {
  // P(home wins a best-of-3) given sets so far, current-set probability, later-set probability.
  const [a, b] = sets;
  if (a >= 2) return 1;
  if (b >= 2) return 0;
  const win = (x: number, y: number, first: boolean): number => {
    if (x >= 2) return 1;
    if (y >= 2) return 0;
    const p = first ? qCurrent : q;
    return p * win(x + 1, y, false) + (1 - p) * win(x, y + 1, false);
  };
  return win(a, b, true);
}
function goesThree(sets: [number, number], q: number, qCurrent: number) {
  const [a, b] = sets;
  if (a + b >= 2) return a === 1 && b === 1 ? 1 : a + b > 2 ? 1 : 0;
  if (a + b === 1) return a === 1 ? 1 - qCurrent : qCurrent; // the trailing side must take the current set
  return qCurrent * (1 - q) + (1 - qCurrent) * q;
}

function otherSpecs(m: Match): Spec[] {
  const H = teamById[m.home];
  const A = teamById[m.away];
  const diff = H.rating - A.rating;
  const [sh, sa] = m.score;
  const rr = m.status === 'pre' ? 1 : m.status === 'ft' ? 0 : Math.max(0.004, 1 - m.progress);
  const specs: Spec[] = [];
  let pWin = 0.5;
  let pOver = 0.5;
  let totalName = 'Total';
  let spread: { p: number; line: number } | null = null;

  if (m.sport === 'basketball') {
    const M = 30 * diff + 2.5;
    const sd = 13 * Math.sqrt(rr) + 1e-6;
    const d = sh - sa;
    pWin = rr === 0 ? (d > 0 ? 1 : 0) : phi((d + M * rr) / sd);
    const mean = sh + sa + m.totalLine * rr;
    pOver = rr === 0 ? (sh + sa > m.totalLine ? 1 : 0) : phi((mean - m.totalLine) / (18 * Math.sqrt(rr)));
    spread = { line: m.hcpLine, p: rr === 0 ? (d + m.hcpLine > 0 ? 1 : 0) : phi((d + M * rr + m.hcpLine) / sd) };
    totalName = 'Total points';
  } else if (m.sport === 'hockey') {
    const lh = 3.1 * Math.exp(1.2 * diff) * rr;
    const la = 2.8 * Math.exp(-1.2 * diff) * rr;
    const draw = gridProb(sh, sa, lh, la, (h, a) => h === a);
    pWin = gridProb(sh, sa, lh, la, (h, a) => h > a) + draw * sigmoid(2 * diff);
    if (m.status === 'ft') pWin = sh > sa ? 1 : 0;
    pOver = poissonOver(sh + sa, lh + la, m.totalLine);
    totalName = 'Total goals';
  } else if (m.sport === 'tennis' || m.sport === 'esports') {
    const k = m.sport === 'tennis' ? 3.5 : 3;
    const q = sigmoid(k * diff);
    const [gh, ga] = m.sub;
    const w = m.sport === 'tennis' ? 0.32 * (1 + (gh + ga) / 9) : 0.14 * (1 + (gh + ga) / 20);
    const qc = m.status === 'pre' ? q : sigmoid(logit(q) + w * (gh - ga));
    pWin = bestOf3([sh, sa], q, qc);
    pOver = goesThree([sh, sa], q, qc);
    totalName = m.sport === 'tennis' ? 'Total sets' : 'Total maps';
  } else {
    pWin = sigmoid(2.5 * diff + 0.1);
    pOver = 0.5;
    totalName = 'Total match runs';
  }

  specs.push({
    key: 'win', family: 'win', familyName: 'Winner', name: m.sport === 'hockey' ? 'Winner (incl. overtime)' : 'Winner', groups: ['popular'], layout: 'grid2', marginKey: 'win',
    raws: [{ outcome: 'h', label: H.name, short: '1', p: pWin }, { outcome: 'a', label: A.name, short: '2', p: 1 - pWin }],
  });
  if (spread) {
    specs.push({
      key: `spr:${spread.line}`, family: 'spr', familyName: 'Handicap', name: `Handicap ${H.short} ${fmtLine(spread.line)}`, groups: ['popular'], layout: 'grid2', marginKey: 'spr',
      raws: [
        { outcome: 'h', label: `${H.name} ${fmtLine(spread.line)}`, short: `${H.short} ${fmtLine(spread.line)}`, p: spread.p },
        { outcome: 'a', label: `${A.name} ${fmtLine(-spread.line)}`, short: `${A.short} ${fmtLine(-spread.line)}`, p: 1 - spread.p },
      ],
    });
  }
  specs.push({
    key: `tot:${m.totalLine}`, family: 'tot', familyName: totalName, name: `${totalName} ${m.totalLine}`, groups: ['popular'], layout: 'grid2', marginKey: 'tot',
    raws: [
      { outcome: 'over', label: `Over ${m.totalLine}`, short: `Over ${m.totalLine}`, p: pOver },
      { outcome: 'under', label: `Under ${m.totalLine}`, short: `Under ${m.totalLine}`, p: 1 - pOver },
    ],
  });
  return specs;
}

export function buildMarkets(m: Match, now: number): Market[] {
  const specs = m.sport === 'football' ? footballSpecs(m, now) : otherSpecs(m);
  return specs.map((s) => finalize(m, s, now));
}

/** Price one market by key, including ones no longer listed (used to settle older bets). */
export function buildMarketByKey(m: Match, key: string, now: number): Market | null {
  if (m.sport !== 'football') return buildMarkets(m, now).find((x) => x.key === key) ?? null;
  const family = key.split(':')[0];
  const only = ['tg', 'tt', '2htg', 'hcp', 'eh', 'tc', 'tk', 'ng', 'ngs', 'nc'].includes(family) ? key : family;
  const spec = footballSpecs(m, now, only).find((s) => s.key === key);
  return spec ? finalize(m, spec, now) : null;
}

/** The headline market shown on list rows. */
export function mainMarketKey(m: Match) {
  return m.sport === 'football' ? '1x2' : 'win';
}
