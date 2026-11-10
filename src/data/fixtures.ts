import type { GoalEvent, Match, SportId } from '../types';
import { teamById } from './catalog';

/** Build the sample fixture list relative to "now" so Live and Starting soon are always fresh. */

const MIN = 60_000;
const HOUR = 60 * MIN;

function at(dayOffset: number, hh: number, mm = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hh, mm, 0, 0);
  return d.getTime();
}

export function footballLambdas(home: string, away: string) {
  const diff = teamById[home].rating - teamById[away].rating;
  return { lh: 1.5 * Math.exp(1.15 * diff), la: 1.22 * Math.exp(-1.15 * diff) };
}

function interleave([h, a]: [number, number]) {
  const out: ('h' | 'a')[] = [];
  for (let i = 0; i < Math.max(h, a); i++) {
    if (i < h) out.push('h');
    if (i < a) out.push('a');
  }
  return out;
}

interface FootSpec {
  comp: string;
  home: string;
  away: string;
  /** Live: current minute. Pre: minutes until kickoff (or absolute ms via `ko`). */
  minute?: number;
  inMin?: number;
  ko?: number;
  goals?: [side: 'h' | 'a', minute: number, player: number | null][];
  corners?: [number, number];
  cards?: [number, number];
  reds?: [number, number];
}

function football(id: string, s: FootSpec, now: number): Match {
  const { lh, la } = footballLambdas(s.home, s.away);
  const live = s.minute !== undefined;
  const goals: GoalEvent[] = (s.goals ?? []).map(([side, minute, p]) => ({
    side,
    minute,
    playerId: p === null ? null : `${side === 'h' ? s.home : s.away}-p${p}`,
  }));
  const score: [number, number] = [goals.filter((g) => g.side === 'h').length, goals.filter((g) => g.side === 'a').length];
  const minute = s.minute ?? 0;
  const htScore: [number, number] | undefined =
    live && minute >= 45
      ? [goals.filter((g) => g.side === 'h' && g.minute <= 45).length, goals.filter((g) => g.side === 'a' && g.minute <= 45).length]
      : undefined;
  return {
    id,
    sport: 'football',
    compId: s.comp,
    home: s.home,
    away: s.away,
    kickoff: live ? now - (minute + (minute >= 45 ? 15 : 0)) * MIN : (s.ko ?? now + (s.inMin ?? 60) * MIN),
    status: live ? 'live' : 'pre',
    score,
    clockSec: minute * 60 + 17,
    clockAt: now,
    htScore,
    goals,
    corners: s.corners ?? [0, 0],
    cards: s.cards ?? [0, 0],
    reds: s.reds ?? [0, 0],
    cornerLog: interleave(s.corners ?? [0, 0]),
    lh,
    la,
    lhBase: lh,
    laBase: la,
    progress: 0,
    sub: [0, 0],
    period: minute >= 45 ? 2 : 1,
    totalLine: 2.5,
    hcpLine: 0,
    suspendedUntil: 0,
    marketSuspend: {},
  };
}

interface OtherSpec {
  sport: SportId;
  comp: string;
  home: string;
  away: string;
  progress?: number; // live when defined
  score?: [number, number];
  sub?: [number, number];
  period?: number;
  inMin?: number;
  ko?: number;
}

function other(id: string, s: OtherSpec, now: number): Match {
  const live = s.progress !== undefined;
  const h = teamById[s.home].rating;
  const a = teamById[s.away].rating;
  let totalLine = 2.5;
  let hcpLine = 0;
  if (s.sport === 'basketball') {
    totalLine = Math.round(222 + (h + a - 1.5) * 40) + 0.5;
    hcpLine = Math.round((a - h) * 40) + 0.5; // home line, e.g. -3.5
  } else if (s.sport === 'hockey') totalLine = 5.5;
  else if (s.sport === 'cricket') totalLine = Math.round(330 + (h + a - 1.6) * 60) + 0.5;
  return {
    id,
    sport: s.sport,
    compId: s.comp,
    home: s.home,
    away: s.away,
    kickoff: live ? now - (s.progress ?? 0) * 2 * HOUR : (s.ko ?? now + (s.inMin ?? 60) * MIN),
    status: live ? 'live' : 'pre',
    score: s.score ?? [0, 0],
    clockSec: 0,
    clockAt: now,
    goals: [],
    corners: [0, 0],
    cards: [0, 0],
    reds: [0, 0],
    cornerLog: [],
    lh: 0,
    la: 0,
    lhBase: 0,
    laBase: 0,
    progress: s.progress ?? 0,
    sub: s.sub ?? [0, 0],
    period: s.period ?? 1,
    totalLine,
    hcpLine,
    suspendedUntil: 0,
    marketSuspend: {},
  };
}

export const FEATURED_MATCH_ID = 'ars-bha';

export function buildFixtures(now = Date.now()): Match[] {
  const F = (id: string, s: FootSpec) => football(id, s, now);
  const O = (id: string, s: OtherSpec) => other(id, s, now);
  return [
    // ── Football · live ────────────────────────────────────────────────
    F('ars-bha', { comp: 'pl', home: 'ars', away: 'bha', minute: 58, goals: [['h', 23, 0], ['a', 41, 0], ['h', 55, 1]], corners: [6, 3], cards: [1, 2] }),
    F('liv-new', { comp: 'pl', home: 'liv', away: 'new', minute: 34, corners: [4, 1], cards: [0, 1] }),
    F('eve-whu', { comp: 'pl', home: 'eve', away: 'whu', minute: 84, goals: [['a', 12, 2], ['h', 50, 0], ['a', 77, 0]], corners: [5, 7], cards: [3, 2], reds: [1, 0] }),
    F('rso-vil', { comp: 'laliga', home: 'rso', away: 'vil', minute: 71, goals: [['h', 64, 1]], corners: [5, 4], cards: [2, 3] }),
    F('nap-rom', { comp: 'seriea', home: 'nap', away: 'rom', minute: 12, corners: [1, 0] }),
    F('b04-vfb', { comp: 'bundesliga', home: 'b04', away: 'vfb', minute: 49, goals: [['h', 8, 0], ['a', 30, 1], ['h', 47, 2]], corners: [4, 2], cards: [1, 1] }),

    // ── Football · starting soon ───────────────────────────────────────
    F('bvb-sge', { comp: 'bundesliga', home: 'bvb', away: 'sge', inMin: 6 }),
    F('che-avl', { comp: 'pl', home: 'che', away: 'avl', inMin: 22 }),
    F('bar-sev', { comp: 'laliga', home: 'bar', away: 'sev', inMin: 41 }),
    F('int-laz', { comp: 'seriea', home: 'int', away: 'laz', inMin: 78 }),
    F('mci-bre', { comp: 'pl', home: 'mci', away: 'bre', inMin: 115 }),

    // ── Football · later ───────────────────────────────────────────────
    F('tot-mun', { comp: 'pl', home: 'tot', away: 'mun', ko: at(1, 20, 0) }),
    F('ful-cry', { comp: 'pl', home: 'ful', away: 'cry', ko: at(1, 19, 45) }),
    F('bou-wol', { comp: 'pl', home: 'bou', away: 'wol', ko: at(2, 15, 0) }),
    F('atm-ath', { comp: 'laliga', home: 'atm', away: 'ath', ko: at(1, 21, 0) }),
    F('bet-gir', { comp: 'laliga', home: 'bet', away: 'gir', ko: at(1, 18, 30) }),
    F('val-rma', { comp: 'laliga', home: 'val', away: 'rma', ko: at(2, 21, 0) }),
    F('juv-mil', { comp: 'seriea', home: 'juv', away: 'mil', ko: at(1, 20, 45) }),
    F('ata-fio', { comp: 'seriea', home: 'ata', away: 'fio', ko: at(1, 18, 0) }),
    F('bol-tor', { comp: 'seriea', home: 'bol', away: 'tor', ko: at(2, 20, 45) }),
    F('fcb-rbl', { comp: 'bundesliga', home: 'fcb', away: 'rbl', ko: at(1, 19, 30) }),
    F('scf-wob', { comp: 'bundesliga', home: 'scf', away: 'wob', ko: at(2, 15, 30) }),
    F('m05-fcu', { comp: 'bundesliga', home: 'm05', away: 'fcu', ko: at(2, 18, 30) }),
    F('psg-ben', { comp: 'ucl', home: 'psg', away: 'ben', ko: at(1, 21, 0) }),
    F('mci-scp', { comp: 'ucl', home: 'mci', away: 'scp', ko: at(1, 21, 0) }),
    F('int-psv', { comp: 'ucl', home: 'int', away: 'psv', ko: at(1, 18, 45) }),
    F('liv-bru', { comp: 'ucl', home: 'liv', away: 'bru', ko: at(2, 21, 0) }),
    F('rma-por', { comp: 'ucl', home: 'rma', away: 'por', ko: at(2, 21, 0) }),
    F('cel-atm', { comp: 'ucl', home: 'cel', away: 'atm', ko: at(2, 18, 45) }),

    // ── Football · rest of the A–Z ─────────────────────────────────────
    F('lee-bur', { comp: 'champ', home: 'lee', away: 'bur', minute: 63, goals: [['a', 19, 0], ['h', 52, 1]], corners: [7, 2], cards: [2, 3] }),
    F('shu-mid', { comp: 'champ', home: 'shu', away: 'mid', inMin: 31 }),
    F('nor-wba', { comp: 'champ', home: 'nor', away: 'wba', ko: at(1, 19, 45) }),
    F('bol-wig', { comp: 'l1', home: 'bol', away: 'wig', inMin: 55 }),
    F('rea-bar', { comp: 'l1', home: 'rea', away: 'bar-e', ko: at(1, 19, 45) }),
    F('zar-spg', { comp: 'segunda', home: 'zar', away: 'spg', ko: at(1, 20, 30) }),
    F('rac-dep', { comp: 'segunda', home: 'rac', away: 'dep', minute: 27, corners: [2, 3], cards: [1, 0] }),
    F('sam-pal', { comp: 'serieb', home: 'sam', away: 'pal', ko: at(1, 20, 30) }),
    F('bari-cre', { comp: 'serieb', home: 'bari', away: 'cre', ko: at(2, 15, 0) }),
    F('s04-bsc', { comp: 'bl2', home: 's04', away: 'bsc', inMin: 95 }),
    F('h96-fcn', { comp: 'bl2', home: 'h96', away: 'fcn', ko: at(2, 13, 30) }),
    F('om-ol', { comp: 'ligue1', home: 'om', away: 'ol', minute: 39, goals: [['h', 17, 0]], corners: [3, 3], cards: [1, 2] }),
    F('asm-losc', { comp: 'ligue1', home: 'asm', away: 'losc', ko: at(1, 21, 0) }),
    F('rcl-ogcn', { comp: 'ligue1', home: 'rcl', away: 'ogcn', ko: at(2, 17, 0) }),
    F('ajx-fey', { comp: 'ered', home: 'ajx', away: 'fey', inMin: 64 }),
    F('az-twe', { comp: 'ered', home: 'az', away: 'twe', ko: at(1, 20, 0) }),
    F('sb-vsc', { comp: 'primeira', home: 'sb', away: 'vsc', ko: at(1, 20, 15) }),
    F('fam-gil', { comp: 'primeira', home: 'fam', away: 'gil', ko: at(2, 18, 0) }),
    F('ran-hea', { comp: 'spl', home: 'ran', away: 'hea', ko: at(1, 19, 45) }),
    F('abd-hib', { comp: 'spl', home: 'abd', away: 'hib', ko: at(2, 15, 0) }),

    // ── Other sports ───────────────────────────────────────────────────
    O('t-mor-fer', { sport: 'tennis', comp: 'atp', home: 't-moravec', away: 't-ferro', progress: 0.55, score: [1, 0], sub: [3, 2] }),
    O('t-lin-ara', { sport: 'tennis', comp: 'atp', home: 't-lindahl', away: 't-arata', inMin: 34 }),
    O('t-nav-bra', { sport: 'tennis', comp: 'wta', home: 't-navarro', away: 't-brandt', progress: 0.2, score: [0, 0], sub: [4, 4] }),
    O('lal-bos', { sport: 'basketball', comp: 'nba', home: 'lal', away: 'bos', progress: 0.6, score: [78, 81], period: 3 }),
    O('mil-nyk', { sport: 'basketball', comp: 'nba', home: 'mil-b', away: 'nyk', progress: 0.14, score: [18, 14], period: 1 }),
    O('den-gsw', { sport: 'basketball', comp: 'nba', home: 'den', away: 'gsw', inMin: 130 }),
    O('nyr-bos', { sport: 'hockey', comp: 'nhl', home: 'nyr', away: 'bos-h', progress: 0.45, score: [2, 1], period: 2 }),
    O('edm-tor', { sport: 'hockey', comp: 'nhl', home: 'edm', away: 'tor-h', inMin: 170 }),
    O('e-nwd-kt5', { sport: 'esports', comp: 'cs2', home: 'e-northwind', away: 'e-kitsune', progress: 0.5, score: [1, 0], sub: [7, 9] }),
    O('e-irl-vnt', { sport: 'esports', comp: 'cs2', home: 'e-lotus', away: 'e-vanta', inMin: 52 }),
    O('e-plg-rdl', { sport: 'esports', comp: 'cs2', home: 'e-polar', away: 'e-redline', ko: at(1, 17, 0) }),
    O('ind-aus', { sport: 'cricket', comp: 't20', home: 'ind', away: 'aus', inMin: 140 }),
    O('eng-rsa', { sport: 'cricket', comp: 't20', home: 'eng', away: 'rsa', ko: at(1, 14, 30) }),
  ];
}
