export type SportId = 'football' | 'tennis' | 'basketball' | 'hockey' | 'esports' | 'cricket';

export interface Sport {
  id: SportId;
  name: string;
  short: string;
}

export interface Competition {
  id: string;
  sport: SportId;
  name: string;
  short: string;
  region: string;
  /** Two brand colours used for the generated (non-official) badge. */
  colors: [string, string];
  featured?: boolean;
}

export interface Team {
  id: string;
  name: string;
  short: string; // 3-letter code
  sport: SportId;
  /** Strength 0..1 used by the pricing model. */
  rating: number;
  colors: [string, string];
  /** Individual-sport competitors (tennis) render as initials instead of a crest. */
  person?: boolean;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  pos: 'FW' | 'MF' | 'DF';
  /** Share of the team's goals this player is expected to score. */
  share: number;
}

export type MatchStatus = 'pre' | 'live' | 'ht' | 'ft';

export interface GoalEvent {
  side: 'h' | 'a';
  minute: number;
  playerId: string | null; // null = own goal
}

export interface Match {
  id: string;
  sport: SportId;
  compId: string;
  home: string;
  away: string;
  kickoff: number; // epoch ms
  status: MatchStatus;
  /** Main score: goals / points / sets / maps. */
  score: [number, number];
  /** Football clock in seconds, anchored at `clockAt`. Other sports use `progress`. */
  clockSec: number;
  clockAt: number;
  htScore?: [number, number];
  htUntil?: number;
  goals: GoalEvent[];
  corners: [number, number];
  cards: [number, number];
  /** Order corners were taken, for "Next corner" settlement. */
  cornerLog: ('h' | 'a')[];
  /** Live expected-goals intensity (full-match equivalent) used by the model. */
  lh: number;
  la: number;
  lhBase: number;
  laBase: number;
  /** Non-football progress 0..1 and sub-score (games / rounds / quarter points). */
  progress: number;
  sub: [number, number];
  /** Period for hockey/basketball (1-based) */
  period: number;
  /** Fixed main lines so selection ids stay stable for the life of the match. */
  totalLine: number;
  hcpLine: number;
  /** Whole match suspended until (ms) and why. */
  suspendedUntil: number;
  suspendReason?: string;
  /** Per-market suspension, keyed by market key. */
  marketSuspend: Record<string, number>;
  /** Last notable event for flash animations. */
  lastEvent?: { kind: 'goal' | 'card' | 'corner'; side: 'h' | 'a'; at: number };
  finishedAt?: number;
}

export type SelStatus = 'open' | 'suspended' | 'won' | 'lost' | 'void' | 'unavailable';

export interface Selection {
  id: string;
  matchId: string;
  marketId: string;
  marketName: string;
  label: string;
  /** Short label used inside compact odds buttons (1 / X / 2, Over, Under...). */
  short: string;
  odds: number | null;
  fair: number | null;
  status: SelStatus;
}

export type MarketGroup = 'popular' | 'goals' | 'halves' | 'handicaps' | 'scorers' | 'cornerscards';

export interface Market {
  id: string; // `${matchId}:${key}`
  key: string;
  matchId: string;
  name: string;
  groups: MarketGroup[];
  layout: 'grid2' | 'grid3' | 'lines' | 'scorers';
  /** Markets sharing a family (e.g. every Total goals line) render as one card. */
  family: string;
  familyName: string;
  lineLabel?: string;
  selections: Selection[];
  /** House edge (overround expressed as expected house take), e.g. 0.046 */
  edge: number;
  status: 'open' | 'suspended' | 'settled';
  /** Hidden from listings (settled lines) but still evaluated for settlement. */
  hidden?: boolean;
  note?: string;
}

export interface PriceMeta {
  prev: number | null;
  dir: 1 | -1 | 0;
  at: number;
}

export interface SlipItem {
  selId: string;
  stake: string;
  /** The price the player last saw and agreed to. */
  accepted: number;
  addedAt: number;
}

export type SlipPhase = 'idle' | 'placing' | 'placed' | 'failed';

export interface SlipItemState {
  phase: SlipPhase;
  error?: string;
  betId?: string;
}

export type BetStatus = 'open' | 'won' | 'lost' | 'void' | 'cashed';

export interface Bet {
  id: string;
  selId: string;
  matchId: string;
  matchLabel: string;
  compName: string;
  marketName: string;
  label: string;
  odds: number;
  stake: number;
  placedAt: number;
  status: BetStatus;
  returned?: number;
  settledAt?: number;
  edge: number;
}

export interface Toast {
  id: string;
  tone: 'info' | 'success' | 'warn' | 'error';
  title: string;
  body?: string;
  action?: { label: string; to: string };
}
