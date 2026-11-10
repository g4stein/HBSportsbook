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

/** Countries used by the Football A–Z. Codes map to the flag shapes in Flag.tsx. */
export const COUNTRIES: Record<string, string> = {
  ENG: 'England', ESP: 'Spain', ITA: 'Italy', GER: 'Germany', FRA: 'France',
  NED: 'Netherlands', POR: 'Portugal', SCO: 'Scotland', EUR: 'Europe',
};

export const COMPETITIONS: Competition[] = [
  { id: 'pl', sport: 'football', name: 'Premier League', short: 'PL', region: 'England', country: 'ENG', tier: 1, colors: ['#5B2A86', '#3CF2C2'], featured: true },
  { id: 'ucl', sport: 'football', name: 'Champions League', short: 'UCL', region: 'Europe', country: 'EUR', tier: 1, colors: ['#0E2A6B', '#C9D6FF'], featured: true },
  { id: 'laliga', sport: 'football', name: 'LaLiga', short: 'LL', region: 'Spain', country: 'ESP', tier: 1, colors: ['#E63946', '#FFB703'], featured: true },
  { id: 'seriea', sport: 'football', name: 'Serie A', short: 'SA', region: 'Italy', country: 'ITA', tier: 1, colors: ['#0B6E4F', '#9BE564'], featured: true },
  { id: 'bundesliga', sport: 'football', name: 'Bundesliga', short: 'BL', region: 'Germany', country: 'GER', tier: 1, colors: ['#B5121B', '#F2F2F2'], featured: true },
  { id: 'champ', sport: 'football', name: 'Championship', short: 'CH', region: 'England', country: 'ENG', tier: 2, colors: ['#1D3D8F', '#E4B94A'] },
  { id: 'l1', sport: 'football', name: 'League One', short: 'L1', region: 'England', country: 'ENG', tier: 3, colors: ['#7A1F2B', '#F4C2C2'] },
  { id: 'segunda', sport: 'football', name: 'Segunda División', short: 'SD', region: 'Spain', country: 'ESP', tier: 2, colors: ['#3B3B98', '#F7D046'] },
  { id: 'serieb', sport: 'football', name: 'Serie B', short: 'SB', region: 'Italy', country: 'ITA', tier: 2, colors: ['#1E6091', '#99D98C'] },
  { id: 'bl2', sport: 'football', name: '2. Bundesliga', short: 'B2', region: 'Germany', country: 'GER', tier: 2, colors: ['#5C0F14', '#E9E9E9'] },
  { id: 'ligue1', sport: 'football', name: 'Ligue 1', short: 'L1', region: 'France', country: 'FRA', tier: 1, colors: ['#0D1B4C', '#D7F75B'] },
  { id: 'ered', sport: 'football', name: 'Eredivisie', short: 'ED', region: 'Netherlands', country: 'NED', tier: 1, colors: ['#E85D04', '#FFFFFF'] },
  { id: 'primeira', sport: 'football', name: 'Primeira Liga', short: 'PT', region: 'Portugal', country: 'POR', tier: 1, colors: ['#006D3B', '#E63946'] },
  { id: 'spl', sport: 'football', name: 'Premiership', short: 'SP', region: 'Scotland', country: 'SCO', tier: 1, colors: ['#1B2A6B', '#7CC6FE'] },
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
  champ: [
    ['lee', 'Leeds United', 'LEE', 0.62, '#F4F6F8', '#1D428A'],
    ['bur', 'Burnley', 'BUR', 0.6, '#6C1D45', '#99D6EA'],
    ['shu', 'Sheffield United', 'SHU', 0.56, '#EE2737', '#000000'],
    ['mid', 'Middlesbrough', 'MID', 0.55, '#E11B22', '#FFFFFF'],
    ['nor', 'Norwich City', 'NOR', 0.54, '#FFF200', '#00A650'],
    ['wba', 'West Brom', 'WBA', 0.55, '#122F67', '#FFFFFF'],
  ],
  l1: [
    ['bol', 'Bolton', 'BOL', 0.5, '#F4F6F8', '#263C7E'],
    ['wig', 'Wigan', 'WIG', 0.47, '#1D59AF', '#FFFFFF'],
    ['rea', 'Reading', 'REA', 0.46, '#004494', '#FFFFFF'],
    ['bar-e', 'Barnsley', 'BAR', 0.47, '#D71920', '#FFFFFF'],
  ],
  segunda: [
    ['zar', 'Real Zaragoza', 'ZAR', 0.5, '#F4F6F8', '#0033A0'],
    ['spg', 'Sporting Gijón', 'SPG', 0.52, '#E30613', '#FFFFFF'],
    ['rac', 'Racing Santander', 'RAC', 0.51, '#006A4E', '#FFFFFF'],
    ['dep', 'Deportivo', 'DEP', 0.53, '#0060A9', '#FFFFFF'],
  ],
  serieb: [
    ['sam', 'Sampdoria', 'SAM', 0.52, '#1B5FAA', '#FFFFFF'],
    ['pal', 'Palermo', 'PAL', 0.53, '#F5A9C8', '#000000'],
    ['bari', 'Bari', 'BAR', 0.48, '#F4F6F8', '#D2232A'],
    ['cre', 'Cremonese', 'CRE', 0.5, '#9E1B32', '#A5A9AD'],
  ],
  bl2: [
    ['s04', 'Schalke 04', 'S04', 0.56, '#004D9D', '#FFFFFF'],
    ['bsc', 'Hertha BSC', 'BSC', 0.54, '#005CA9', '#FFFFFF'],
    ['h96', 'Hannover 96', 'H96', 0.52, '#00A54F', '#000000'],
    ['fcn', 'Nürnberg', 'FCN', 0.5, '#AA1124', '#FFFFFF'],
  ],
  ligue1: [
    ['om', 'Marseille', 'OM', 0.76, '#2FAEE0', '#FFFFFF'],
    ['ol', 'Lyon', 'OL', 0.71, '#F4F6F8', '#DA001A'],
    ['asm', 'Monaco', 'ASM', 0.74, '#E51B22', '#FFFFFF'],
    ['losc', 'Lille', 'LIL', 0.72, '#E01E13', '#20325F'],
    ['rcl', 'Lens', 'RCL', 0.69, '#FFE500', '#E2001A'],
    ['ogcn', 'Nice', 'NIC', 0.68, '#C8102E', '#000000'],
  ],
  ered: [
    ['ajx', 'Ajax', 'AJX', 0.73, '#F4F6F8', '#D2122E'],
    ['fey', 'Feyenoord', 'FEY', 0.74, '#E30613', '#FFFFFF'],
    ['az', 'AZ Alkmaar', 'AZ', 0.7, '#E30613', '#FFFFFF'],
    ['twe', 'Twente', 'TWE', 0.66, '#E2001A', '#FFFFFF'],
  ],
  primeira: [
    ['sb', 'Braga', 'SCB', 0.68, '#E2001A', '#FFFFFF'],
    ['vsc', 'Vitória SC', 'VSC', 0.6, '#F4F6F8', '#000000'],
    ['fam', 'Famalicão', 'FAM', 0.57, '#003DA5', '#FFFFFF'],
    ['gil', 'Gil Vicente', 'GIL', 0.54, '#E2001A', '#003DA5'],
  ],
  spl: [
    ['ran', 'Rangers', 'RAN', 0.7, '#1B458F', '#FFFFFF'],
    ['hea', 'Hearts', 'HEA', 0.6, '#8B1E3F', '#FFFFFF'],
    ['abd', 'Aberdeen', 'ABD', 0.58, '#E2001A', '#FFFFFF'],
    ['hib', 'Hibernian', 'HIB', 0.57, '#006B3F', '#FFFFFF'],
  ],
};

const OTHER: Record<SportId, T[]> = {
  football: [],
  tennis: [
    ['t-moravec', 'A. Velkaro', 'VEL', 0.74, '#7FD1FF', '#0B1920'],
    ['t-ferro', 'D. Quarnell', 'QUA', 0.68, '#FCA5A5', '#0B1920'],
    ['t-lindahl', 'H. Ostrevik', 'OST', 0.7, '#A7F3D0', '#0B1920'],
    ['t-arata', 'K. Tamsyrin', 'TAM', 0.72, '#FDE68A', '#0B1920'],
    ['t-navarro', 'I. Pellacombe', 'PEL', 0.71, '#F9A8D4', '#0B1920'],
    ['t-brandt', 'L. Dravenholt', 'DRA', 0.69, '#C4B5FD', '#0B1920'],
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
    ['Theo Marlowick', 'FW', 0.24], ['Kai Ashvendor', 'FW', 0.2], ['Jory Okanbe', 'FW', 0.12],
    ['Rúben Saltaro', 'MF', 0.13], ['Elio Vantrell', 'MF', 0.1], ['Dario Pellquist', 'MF', 0.06], ['Max Lindoravi', 'DF', 0.05],
  ],
  bha: [
    ['Jonah Reskel', 'FW', 0.25], ['Mateo Kuvraine', 'FW', 0.17], ['Ivo Petrakos', 'FW', 0.11],
    ['Sami Adevolu', 'MF', 0.14], ['Luca Brenmoor', 'MF', 0.1], ['Noah Carvelin', 'DF', 0.05],
  ],
};

const FIRST = ['Adrian', 'Bruno', 'Caio', 'Dani', 'Emil', 'Felix', 'Gabri', 'Hugo', 'Ilan', 'Jonas', 'Kofi', 'Leon', 'Marco', 'Nico', 'Omar', 'Paolo', 'Rafa', 'Sven', 'Tomas', 'Yann', 'Ezra', 'Milo', 'Aron', 'Lior', 'Iker', 'Oskar', 'Teo', 'Renzo', 'Matis', 'Joao'];
// Invented surnames: built from made-up syllables so no name matches a real athlete.
const LAST = ['Albrevan', 'Brakhollow', 'Castrevi', 'Dahlvane', 'Esporalt', 'Ferrovin', 'Galverra', 'Hartovek', 'Iverlund', 'Jannevik', 'Kovarelle', 'Lindomar', 'Moraveth', 'Nuvarin', 'Okembra', 'Perravalt', 'Quintaro', 'Rossenvar', 'Sandrovic', 'Tavellon', 'Ullarven', 'Vargamor', 'Webrandt', 'Yilvaren', 'Zanettor', 'Marivold', 'Kesmarin', 'Duvalcourt', 'Ortevan', 'Biancoret'];
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
