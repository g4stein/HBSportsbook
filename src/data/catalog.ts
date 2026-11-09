import type { Competition, Player, Sport, SportId, Team } from '../types';
import { hashString, mulberry32 } from '../lib/rng';

/**
 * SAMPLE DATA ONLY.
 * Club and country names are used as sample fixtures (as in the brief's
 * "Arsenal v Brighton" example). Every individual (footballer, tennis player)
 * is fictional, crests are generated shapes rather than official badges, and
 * esports organisations are invented.
 */

export const SPORTS: Sport[] = [
  { id: 'football', name: 'Football', short: 'Football' },
  { id: 'tennis', name: 'Tennis', short: 'Tennis' },
  { id: 'basketball', name: 'Basketball', short: 'Basketball' },
  { id: 'hockey', name: 'Ice Hockey', short: 'Hockey' },
  { id: 'esports', name: 'Esports', short: 'Esports' },
  { id: 'cricket', name: 'Cricket', short: 'Cricket' },
];

export const sportById = Object.fromEntries(SPORTS.map((s) => [s.id, s])) as Record<SportId, Sport>;

export const COMPETITIONS: Competition[] = [
  { id: 'pl', sport: 'football', name: 'Premier League', short: 'PL', region: 'England', colors: ['#5B2A86', '#3CF2C2'], featured: true },
  { id: 'ucl', sport: 'football', name: 'Champions League', short: 'UCL', region: 'Europe', colors: ['#0E2A6B', '#C9D6FF'], featured: true },
  { id: 'laliga', sport: 'football', name: 'LaLiga', short: 'LL', region: 'Spain', colors: ['#E63946', '#FFB703'], featured: true },
  { id: 'seriea', sport: 'football', name: 'Serie A', short: 'SA', region: 'Italy', colors: ['#0B6E4F', '#9BE564'], featured: true },
  { id: 'bundesliga', sport: 'football', name: 'Bundesliga', short: 'BL', region: 'Germany', colors: ['#B5121B', '#F2F2F2'], featured: true },
  { id: 'atp', sport: 'tennis', name: 'ATP Tour · Indoor', short: 'ATP', region: 'World', colors: ['#1B4D89', '#7FD1FF'] },
  { id: 'wta', sport: 'tennis', name: 'WTA Tour · Indoor', short: 'WTA', region: 'World', colors: ['#6A2C70', '#F9A8D4'] },
  { id: 'nba', sport: 'basketball', name: 'NBA', short: 'NBA', region: 'USA', colors: ['#17408B', '#C9082A'] },
  { id: 'nhl', sport: 'hockey', name: 'NHL', short: 'NHL', region: 'North America', colors: ['#111111', '#D1D5DB'] },
  { id: 'cs2', sport: 'esports', name: 'CS2 · Pro Series', short: 'CS2', region: 'Online', colors: ['#F59E0B', '#1F2937'] },
  { id: 't20', sport: 'cricket', name: 'T20 Internationals', short: 'T20', region: 'World', colors: ['#14532D', '#FDE68A'] },
];

export const compById = Object.fromEntries(COMPETITIONS.map((c) => [c.id, c])) as Record<string, Competition>;

type T = [id: string, name: string, short: string, rating: number, c1: string, c2: string];

const FOOTBALL: Record<string, T[]> = {
  pl: [
    ['ars', 'Arsenal', 'ARS', 0.86, '#EF0107', '#FFFFFF'],
    ['bha', 'Brighton', 'BHA', 0.69, '#0057B8', '#FFFFFF'],
    ['liv', 'Liverpool', 'LIV', 0.87, '#C8102E', '#F6EB61'],
    ['new', 'Newcastle', 'NEW', 0.74, '#241F20', '#FFFFFF'],
    ['mci', 'Man City', 'MCI', 0.88, '#6CABDD', '#1C2C5B'],
    ['che', 'Chelsea', 'CHE', 0.76, '#034694', '#DBA111'],
    ['avl', 'Aston Villa', 'AVL', 0.73, '#670E36', '#95BFE5'],
    ['tot', 'Tottenham', 'TOT', 0.72, '#F4F6F8', '#132257'],
    ['mun', 'Man United', 'MUN', 0.7, '#DA291C', '#FBE122'],
    ['whu', 'West Ham', 'WHU', 0.62, '#7A263A', '#1BB1E7'],
    ['bre', 'Brentford', 'BRE', 0.6, '#E30613', '#FBB800'],
    ['eve', 'Everton', 'EVE', 0.55, '#003399', '#FFFFFF'],
    ['ful', 'Fulham', 'FUL', 0.6, '#F4F6F8', '#000000'],
    ['cry', 'Crystal Palace', 'CRY', 0.61, '#1B458F', '#C4122E'],
    ['bou', 'Bournemouth', 'BOU', 0.6, '#DA291C', '#000000'],
    ['wol', 'Wolves', 'WOL', 0.55, '#FDB913', '#231F20'],
  ],
  laliga: [
    ['rma', 'Real Madrid', 'RMA', 0.89, '#FEBE10', '#FFFFFF'],
    ['bar', 'Barcelona', 'BAR', 0.88, '#A50044', '#004D98'],
    ['atm', 'Atlético Madrid', 'ATM', 0.8, '#CB3524', '#FFFFFF'],
    ['ath', 'Athletic Club', 'ATH', 0.72, '#EE2523', '#FFFFFF'],
    ['rso', 'Real Sociedad', 'RSO', 0.7, '#0067B1', '#FFFFFF'],
    ['vil', 'Villarreal', 'VIL', 0.71, '#FFE667', '#005187'],
    ['sev', 'Sevilla', 'SEV', 0.64, '#F43333', '#FFFFFF'],
    ['val', 'Valencia', 'VAL', 0.6, '#EE3524', '#F4F6F8'],
    ['bet', 'Real Betis', 'BET', 0.68, '#00954C', '#FFFFFF'],
    ['gir', 'Girona', 'GIR', 0.66, '#CD2534', '#FFFFFF'],
  ],
  seriea: [
    ['int', 'Inter', 'INT', 0.85, '#0068A8', '#000000'],
    ['nap', 'Napoli', 'NAP', 0.8, '#12A0D7', '#FFFFFF'],
    ['juv', 'Juventus', 'JUV', 0.78, '#F4F6F8', '#000000'],
    ['mil', 'Milan', 'MIL', 0.77, '#FB090B', '#000000'],
    ['ata', 'Atalanta', 'ATA', 0.76, '#1E71B8', '#000000'],
    ['rom', 'Roma', 'ROM', 0.72, '#8E1F2F', '#F0BC42'],
    ['laz', 'Lazio', 'LAZ', 0.7, '#87D8F7', '#FFFFFF'],
    ['fio', 'Fiorentina', 'FIO', 0.68, '#482E92', '#FFFFFF'],
    ['bol', 'Bologna', 'BOL', 0.67, '#1A2F48', '#A21C26'],
    ['tor', 'Torino', 'TOR', 0.6, '#881F19', '#FFFFFF'],
  ],
  bundesliga: [
    ['fcb', 'Bayern Munich', 'FCB', 0.89, '#DC052D', '#FFFFFF'],
    ['b04', 'Leverkusen', 'B04', 0.84, '#E32221', '#000000'],
    ['bvb', 'Dortmund', 'BVB', 0.79, '#FDE100', '#000000'],
    ['rbl', 'RB Leipzig', 'RBL', 0.77, '#F4F6F8', '#DD0741'],
    ['vfb', 'Stuttgart', 'VFB', 0.73, '#F4F6F8', '#E32219'],
    ['sge', 'Frankfurt', 'SGE', 0.71, '#E1000F', '#000000'],
    ['scf', 'Freiburg', 'SCF', 0.66, '#000000', '#E2001A'],
    ['wob', 'Wolfsburg', 'WOB', 0.62, '#65B32E', '#FFFFFF'],
    ['m05', 'Mainz', 'M05', 0.6, '#C3141E', '#FFFFFF'],
    ['fcu', 'Union Berlin', 'FCU', 0.61, '#EB1923', '#FFDD00'],
  ],
  ucl: [
    ['psg', 'Paris SG', 'PSG', 0.86, '#004170', '#DA291C'],
    ['ben', 'Benfica', 'BEN', 0.74, '#E83030', '#FFFFFF'],
    ['por', 'Porto', 'POR', 0.72, '#003D8F', '#FFFFFF'],
    ['cel', 'Celtic', 'CEL', 0.66, '#018749', '#FFFFFF'],
    ['scp', 'Sporting CP', 'SCP', 0.73, '#008057', '#FFFFFF'],
    ['psv', 'PSV', 'PSV', 0.73, '#ED1C24', '#FFFFFF'],
    ['bru', 'Club Brugge', 'BRU', 0.67, '#0070C0', '#000000'],
  ],
};

const OTHER: Record<SportId, T[]> = {
  football: [],
  tennis: [
    ['t-moravec', 'A. Moravec', 'MOR', 0.74, '#7FD1FF', '#0B1920'],
    ['t-ferro', 'D. Ferro', 'FER', 0.68, '#FCA5A5', '#0B1920'],
    ['t-lindahl', 'H. Lindahl', 'LIN', 0.7, '#A7F3D0', '#0B1920'],
    ['t-arata', 'K. Arata', 'ARA', 0.72, '#FDE68A', '#0B1920'],
    ['t-navarro', 'I. Navarro', 'NAV', 0.71, '#F9A8D4', '#0B1920'],
    ['t-brandt', 'L. Brandt', 'BRA', 0.69, '#C4B5FD', '#0B1920'],
  ],
  basketball: [
    ['lal', 'LA Lakers', 'LAL', 0.74, '#552583', '#FDB927'],
    ['bos', 'Boston Celtics', 'BOS', 0.8, '#007A33', '#FFFFFF'],
    ['den', 'Denver Nuggets', 'DEN', 0.77, '#0E2240', '#FEC524'],
    ['gsw', 'Golden State', 'GSW', 0.72, '#1D428A', '#FFC72C'],
    ['mil-b', 'Milwaukee Bucks', 'MIL', 0.73, '#00471B', '#EEE1C6'],
    ['nyk', 'New York Knicks', 'NYK', 0.75, '#006BB6', '#F58426'],
  ],
  hockey: [
    ['nyr', 'NY Rangers', 'NYR', 0.72, '#0038A8', '#CE1126'],
    ['bos-h', 'Boston Bruins', 'BOS', 0.7, '#FFB81C', '#000000'],
    ['edm', 'Edmonton Oilers', 'EDM', 0.76, '#041E42', '#FF4C00'],
    ['tor-h', 'Toronto Maple Leafs', 'TOR', 0.73, '#00205B', '#FFFFFF'],
  ],
  esports: [
    ['e-northwind', 'Northwind', 'NWD', 0.74, '#38BDF8', '#0B1920'],
    ['e-kitsune', 'Kitsune Five', 'KT5', 0.71, '#FB923C', '#0B1920'],
    ['e-lotus', 'Iron Lotus', 'IRL', 0.69, '#F472B6', '#0B1920'],
    ['e-vanta', 'Vanta', 'VNT', 0.7, '#E5E7EB', '#0B1920'],
    ['e-polar', 'Polar Ghosts', 'PLG', 0.66, '#A5F3FC', '#0B1920'],
    ['e-redline', 'Redline', 'RDL', 0.68, '#EF4444', '#0B1920'],
  ],
  cricket: [
    ['ind', 'India', 'IND', 0.82, '#1C4FA0', '#FF9933'],
    ['aus', 'Australia', 'AUS', 0.8, '#FFCD00', '#00843D'],
    ['eng', 'England', 'ENG', 0.76, '#012169', '#C8102E'],
    ['rsa', 'South Africa', 'RSA', 0.75, '#007749', '#FFB81C'],
  ],
};

export const TEAMS: Team[] = [
  ...Object.values(FOOTBALL).flat().map(([id, name, short, rating, c1, c2]) => ({ id, name, short, rating, colors: [c1, c2] as [string, string], sport: 'football' as SportId })),
  ...(Object.entries(OTHER) as [SportId, T[]][]).flatMap(([sport, list]) =>
    list.map(([id, name, short, rating, c1, c2]) => ({ id, name, short, rating, sport, colors: [c1, c2] as [string, string], person: sport === 'tennis' })),
  ),
];

export const teamById = Object.fromEntries(TEAMS.map((t) => [t.id, t])) as Record<string, Team>;

/** Which competition a club "belongs" to (for search + follow). */
export const teamHomeComp: Record<string, string> = Object.fromEntries(
  Object.entries(FOOTBALL).flatMap(([comp, list]) => list.map(([id]) => [id, comp])),
);

// ── Players (fictional) ─────────────────────────────────────────────────────

const HAND: Record<string, [string, Player['pos'], number][]> = {
  ars: [
    ['Theo Marlowe', 'FW', 0.24], ['Kai Ashworth', 'FW', 0.2], ['Joel Okafor', 'FW', 0.12],
    ['Rúben Sato', 'MF', 0.13], ['Elio Vance', 'MF', 0.1], ['Dario Pell', 'MF', 0.06], ['Max Lindqvist', 'DF', 0.05],
  ],
  bha: [
    ['Jonah Rees', 'FW', 0.25], ['Mateo Kuyt', 'FW', 0.17], ['Ivo Petrak', 'FW', 0.11],
    ['Sami Adeyemi', 'MF', 0.14], ['Luca Brennan', 'MF', 0.1], ['Noah Carvalho', 'DF', 0.05],
  ],
};

const FIRST = ['Adrian', 'Bruno', 'Caio', 'Dani', 'Emil', 'Felix', 'Gabri', 'Hugo', 'Ilan', 'Jonas', 'Kofi', 'Leon', 'Marco', 'Nico', 'Omar', 'Paolo', 'Rafa', 'Sven', 'Tomas', 'Yann', 'Ezra', 'Milo', 'Aron', 'Lior', 'Iker', 'Oskar', 'Teo', 'Renzo', 'Matis', 'Joao'];
const LAST = ['Albers', 'Brandt', 'Costa', 'Dahl', 'Esposito', 'Ferreira', 'Gallo', 'Hartmann', 'Iversen', 'Janssen', 'Kovac', 'Lindgren', 'Moreau', 'Nunez', 'Okoro', 'Pereira', 'Quint', 'Rossi', 'Sandoval', 'Tavares', 'Ulloa', 'Varga', 'Weber', 'Yilmaz', 'Zanetti', 'Marin', 'Kessler', 'Duval', 'Ortega', 'Bianchi'];
const SHAPE: [Player['pos'], number][] = [['FW', 0.26], ['FW', 0.17], ['MF', 0.13], ['MF', 0.1], ['FW', 0.1], ['DF', 0.05]];

export const PLAYERS: Player[] = TEAMS.filter((t) => t.sport === 'football').flatMap((t) => {
  if (HAND[t.id]) return HAND[t.id].map(([name, pos, share], i) => ({ id: `${t.id}-p${i}`, name, pos, share, teamId: t.id }));
  const r = mulberry32(hashString(t.id));
  const used = new Set<string>();
  return SHAPE.map(([pos, share], i) => {
    let name = '';
    do name = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
    while (used.has(name));
    used.add(name);
    return { id: `${t.id}-p${i}`, name, pos, share, teamId: t.id };
  });
});

export const playerById = Object.fromEntries(PLAYERS.map((p) => [p.id, p])) as Record<string, Player>;
export const playersByTeam = PLAYERS.reduce<Record<string, Player[]>>((acc, p) => {
  (acc[p.teamId] ||= []).push(p);
  return acc;
}, {});
