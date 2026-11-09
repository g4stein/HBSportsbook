import type { Match } from '../types';
import { playersByTeam, teamById } from '../data/catalog';
import { clockSeconds } from './pricing';
import { clamp, gauss, rand } from '../lib/rng';

/**
 * Live match simulator (demo). Advances clocks and produces goals, corners,
 * cards and suspensions at realistic rates. Every mutation returns a new
 * Match object so React can diff cheaply. `events` lets the store raise toasts
 * and re-price immediately.
 */

export type SimEvent =
  | { kind: 'goal'; matchId: string; side: 'h' | 'a' }
  | { kind: 'kickoff'; matchId: string }
  | { kind: 'ft'; matchId: string }
  | { kind: 'reprice'; matchId: string };

const HT_DEMO_MS = 60_000; // half-time is shortened to one minute in the demo
const STOPPAGE_1 = 120;
const STOPPAGE_2 = 200;

function pickScorer(teamId: string) {
  const list = playersByTeam[teamId] ?? [];
  const total = list.reduce((a, p) => a + p.share, 0);
  let x = rand() * total;
  for (const p of list) {
    x -= p.share;
    if (x <= 0) return p.id;
  }
  return list[0]?.id ?? null;
}

export function applyGoal(m: Match, side: 'h' | 'a', now: number): Match {
  const sec = clockSeconds(m, now);
  const score: [number, number] = side === 'h' ? [m.score[0] + 1, m.score[1]] : [m.score[0], m.score[1] + 1];
  const goals = m.sport === 'football'
    ? [...m.goals, { side, minute: Math.min(90 + 9, Math.floor(sec / 60) + 1), playerId: pickScorer(side === 'h' ? m.home : m.away) }]
    : m.goals;
  // The trailing side pushes harder after conceding.
  const lh = side === 'a' ? m.lh * 1.08 : m.lh * 0.97;
  const la = side === 'h' ? m.la * 1.08 : m.la * 0.97;
  return {
    ...m,
    score,
    goals,
    lh,
    la,
    clockSec: m.status === 'live' ? sec : m.clockSec,
    clockAt: now,
    suspendedUntil: now + 6000,
    suspendReason: m.sport === 'football' ? 'Goal' : 'Score update',
    lastEvent: { kind: 'goal', side, at: now },
  };
}

function stepFootball(m: Match, dt: number, now: number, ev: SimEvent[]): Match {
  if (m.status === 'pre') {
    if (now >= m.kickoff) {
      ev.push({ kind: 'kickoff', matchId: m.id });
      return { ...m, status: 'live', clockSec: 0, clockAt: now, period: 1 };
    }
    return m;
  }
  if (m.status === 'ft') return m;
  if (m.status === 'ht') {
    if (now >= (m.htUntil ?? 0)) {
      ev.push({ kind: 'reprice', matchId: m.id });
      return { ...m, status: 'live', period: 2, clockSec: 2700, clockAt: now };
    }
    return m;
  }

  const sec = clockSeconds(m, now);
  if (m.period === 1 && sec >= 2700 + STOPPAGE_1) {
    ev.push({ kind: 'reprice', matchId: m.id });
    return { ...m, status: 'ht', htScore: [...m.score] as [number, number], htUntil: now + HT_DEMO_MS, clockSec: 2700, clockAt: now };
  }
  if (m.period === 2 && sec >= 5400 + STOPPAGE_2) {
    ev.push({ kind: 'ft', matchId: m.id });
    return { ...m, status: 'ft', clockSec: 5400, clockAt: now, finishedAt: now, suspendedUntil: 0 };
  }

  let next = m;
  const H = teamById[m.home];
  const A = teamById[m.away];
  const diff = H.rating - A.rating;
  // Goals: Poisson intensity per second of match clock.
  if (now > m.suspendedUntil) {
    if (rand() < (m.lh / 5400) * dt) {
      next = applyGoal(next, 'h', now);
      ev.push({ kind: 'goal', matchId: m.id, side: 'h' });
    } else if (rand() < (m.la / 5400) * dt) {
      next = applyGoal(next, 'a', now);
      ev.push({ kind: 'goal', matchId: m.id, side: 'a' });
    } else if (rand() < 0.0022 * dt) {
      // dangerous attack: brief suspension of every market
      next = { ...next, suspendedUntil: now + 3500 + rand() * 2500, suspendReason: 'Attack in progress' };
      ev.push({ kind: 'reprice', matchId: m.id });
    }
  }
  const cornerRate = (5.6 * Math.exp(0.8 * diff) + 4.6 * Math.exp(-0.8 * diff)) / 5400;
  if (rand() < cornerRate * dt) {
    const side: 'h' | 'a' = rand() < 5.6 * Math.exp(0.8 * diff) / (5.6 * Math.exp(0.8 * diff) + 4.6 * Math.exp(-0.8 * diff)) ? 'h' : 'a';
    const corners: [number, number] = side === 'h' ? [next.corners[0] + 1, next.corners[1]] : [next.corners[0], next.corners[1] + 1];
    next = { ...next, corners, cornerLog: [...next.cornerLog, side], lastEvent: { kind: 'corner', side, at: now } };
    ev.push({ kind: 'reprice', matchId: m.id });
  }
  if (rand() < (4.3 / 5400) * dt) {
    const side: 'h' | 'a' = rand() < 0.5 ? 'h' : 'a';
    const cards: [number, number] = side === 'h' ? [next.cards[0] + 1, next.cards[1]] : [next.cards[0], next.cards[1] + 1];
    next = { ...next, cards, lastEvent: { kind: 'card', side, at: now } };
    ev.push({ kind: 'reprice', matchId: m.id });
  }
  if (rand() < 0.0025 * dt) {
    const fam = ['ngs', 'ats', 'tc', 'nc', 'hcp', 'tk'][Math.floor(rand() * 6)];
    next = { ...next, marketSuspend: { ...next.marketSuspend, [fam]: now + 5000 + rand() * 5000 } };
    ev.push({ kind: 'reprice', matchId: m.id });
  }
  return next;
}

const DURATION: Record<string, number> = { basketball: 8000, hockey: 8800, tennis: 6000, esports: 7000, cricket: 12000 };

function stepOther(m: Match, dt: number, now: number, ev: SimEvent[]): Match {
  if (m.status === 'pre') {
    if (now >= m.kickoff) {
      ev.push({ kind: 'kickoff', matchId: m.id });
      return { ...m, status: 'live', progress: 0 };
    }
    return m;
  }
  if (m.status !== 'live') return m;
  const H = teamById[m.home];
  const A = teamById[m.away];
  const diff = H.rating - A.rating;
  let next: Match = { ...m, progress: Math.min(1, m.progress + dt / (DURATION[m.sport] ?? 7000)) };

  if (m.sport === 'basketball') {
    const perSec = (m.totalLine / 2.3) / DURATION.basketball;
    if (rand() < perSec * dt * 1.0) {
      const side: 'h' | 'a' = rand() < 0.5 + diff * 0.6 ? 'h' : 'a';
      const pts = rand() < 0.36 ? 3 : rand() < 0.15 ? 1 : 2;
      next.score = side === 'h' ? [next.score[0] + pts, next.score[1]] : [next.score[0], next.score[1] + pts];
      next.lastEvent = { kind: 'goal', side, at: now };
      ev.push({ kind: 'reprice', matchId: m.id });
    }
    next.period = Math.min(4, Math.floor(next.progress * 4) + 1);
    if (next.progress >= 1) {
      if (next.score[0] === next.score[1]) next.score = [next.score[0] + 2, next.score[1]];
      next.status = 'ft';
      next.finishedAt = now;
      ev.push({ kind: 'ft', matchId: m.id });
    }
  } else if (m.sport === 'hockey') {
    const lh = 3.1 * Math.exp(1.2 * diff);
    const la = 2.8 * Math.exp(-1.2 * diff);
    if (now > m.suspendedUntil) {
      if (rand() < (lh / DURATION.hockey) * dt) { next = applyGoal(next, 'h', now); ev.push({ kind: 'goal', matchId: m.id, side: 'h' }); }
      else if (rand() < (la / DURATION.hockey) * dt) { next = applyGoal(next, 'a', now); ev.push({ kind: 'goal', matchId: m.id, side: 'a' }); }
    }
    next.period = Math.min(3, Math.floor(next.progress * 3) + 1);
    if (next.progress >= 1) {
      if (next.score[0] === next.score[1]) next.score = rand() < 0.5 + diff ? [next.score[0] + 1, next.score[1]] : [next.score[0], next.score[1] + 1];
      next.status = 'ft';
      next.finishedAt = now;
      ev.push({ kind: 'ft', matchId: m.id });
    }
  } else if (m.sport === 'tennis' || m.sport === 'esports') {
    const tennis = m.sport === 'tennis';
    const unitEvery = tennis ? 75 : 45; // seconds per game / round (demo pace)
    if (rand() < dt / unitEvery) {
      const p = clamp(0.5 + diff * (tennis ? 0.9 : 0.7) + gauss() * 0.02, 0.15, 0.85);
      const side: 'h' | 'a' = rand() < p ? 'h' : 'a';
      let sub: [number, number] = side === 'h' ? [m.sub[0] + 1, m.sub[1]] : [m.sub[0], m.sub[1] + 1];
      let score = m.score;
      const [x, y] = sub;
      const target = tennis ? 6 : 13;
      const won = (a: number, b: number) => (tennis ? (a >= target && a - b >= 2) || a === 7 : a >= target && a - b >= 2);
      if (won(x, y) || won(y, x)) {
        score = x > y ? [score[0] + 1, score[1]] : [score[0], score[1] + 1];
        sub = [0, 0];
      }
      next = { ...next, sub, score, lastEvent: { kind: 'goal', side, at: now } };
      ev.push({ kind: 'reprice', matchId: m.id });
      if (score[0] >= 2 || score[1] >= 2) {
        next.status = 'ft';
        next.finishedAt = now;
        ev.push({ kind: 'ft', matchId: m.id });
      }
    }
  }
  return next;
}

export function stepMatch(m: Match, dt: number, now: number, ev: SimEvent[]): Match {
  return m.sport === 'football' ? stepFootball(m, dt, now, ev) : stepOther(m, dt, now, ev);
}

/** Small mean-reverting drift in team intensities, applied when a match publishes a new price. */
export function drift(m: Match, live: boolean): Match {
  if (m.sport !== 'football') return m;
  const k = live ? 0.06 : 0.025;
  const lh = m.lh * Math.exp(k * gauss()) * 0.85 + m.lhBase * 0.15;
  const la = m.la * Math.exp(k * gauss()) * 0.85 + m.laBase * 0.15;
  return { ...m, lh, la };
}
