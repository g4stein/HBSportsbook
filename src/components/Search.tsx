import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CornerDownLeft, History, Search as SearchIcon, X } from 'lucide-react';
import { useStore } from '../store';
import { COMPETITIONS, PLAYERS, sportById, teamById, TEAMS } from '../data/catalog';
import type { Match } from '../types';
import { Crest, CompBadge } from './Crest';
import { FollowButton, LivePill } from './bits';
import { fmtKickoff } from '../lib/format';

/**
 * Search: teams, players, competitions and markets, as the brief asks.
 * Plain text matching (no AI search, which is out of scope), accent and
 * case insensitive, with keyboard navigation and recent searches.
 */

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const RECENT = 'hb-sb-recent';

const MARKETS: { name: string; group: string; anchor: string; aliases: string[] }[] = [
  { name: 'Match result', group: 'popular', anchor: '1x2', aliases: ['1x2', 'winner', 'full time result', 'moneyline'] },
  { name: 'Both teams to score', group: 'goals', anchor: 'btts', aliases: ['btts', 'gg'] },
  { name: 'Total goals', group: 'goals', anchor: 'tg', aliases: ['over under', 'over 2.5', 'o/u', 'goals line'] },
  { name: 'Next goal', group: 'goals', anchor: 'ng', aliases: ['next team to score'] },
  { name: 'Double chance', group: 'popular', anchor: 'dc', aliases: ['1x', 'x2'] },
  { name: 'Draw no bet', group: 'handicaps', anchor: 'dnb', aliases: ['dnb'] },
  { name: 'Handicap', group: 'handicaps', anchor: 'hcp', aliases: ['asian handicap', 'spread', 'line'] },
  { name: '2nd half result', group: 'halves', anchor: '2h', aliases: ['second half', 'halves'] },
  { name: 'Half with most goals', group: 'halves', anchor: 'hmg', aliases: ['highest scoring half'] },
  { name: 'Anytime goalscorer', group: 'scorers', anchor: 'ats', aliases: ['scorer', 'to score', 'player goals'] },
  { name: 'Next goalscorer', group: 'scorers', anchor: 'ngs', aliases: ['scorer', 'next scorer'] },
  { name: 'Total corners', group: 'cornerscards', anchor: 'tc', aliases: ['corners'] },
  { name: 'Next corner', group: 'cornerscards', anchor: 'nc', aliases: ['corners'] },
  { name: 'Total cards', group: 'cornerscards', anchor: 'tk', aliases: ['cards', 'bookings', 'yellow'] },
];

type Result =
  | { kind: 'team'; id: string; to: string; label: string; sub: string; live: boolean }
  | { kind: 'player'; id: string; to: string; label: string; sub: string; teamId: string }
  | { kind: 'comp'; id: string; to: string; label: string; sub: string }
  | { kind: 'market'; id: string; to: string; label: string; sub: string; live: boolean };

function nextMatchFor(teamId: string, matches: Match[]) {
  const list = matches.filter((m) => (m.home === teamId || m.away === teamId) && m.status !== 'ft');
  return list.sort((a, b) => (a.status === 'live' ? -1 : 0) - (b.status === 'live' ? -1 : 0) || a.kickoff - b.kickoff)[0];
}

export function SearchOverlay() {
  const open = useStore((s) => s.searchOpen);
  const set = useStore((s) => s.set);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(t.tagName)) {
        e.preventDefault();
        set({ searchOpen: true });
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [set]);
  if (!open) return null;
  return <SearchDialog onClose={() => set({ searchOpen: false })} />;
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(RECENT) || '[]'); } catch { return []; }
  });
  const matchesMap = useStore((s) => s.matches);
  const now = useStore((s) => Math.floor(s.now / 30000) * 30000);
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
  }, []);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const results = useMemo(() => {
    const term = norm(q.trim());
    if (term.length < 2) return [] as Result[];
    const matches = Object.values(matchesMap);
    const hit = (s: string) => norm(s).split(/[\s-]+/).some((w) => w.startsWith(term)) || norm(s).includes(term);
    const out: Result[] = [];
    for (const t of TEAMS) {
      if (!hit(t.name) && norm(t.short) !== term) continue;
      const m = nextMatchFor(t.id, matches);
      out.push({
        kind: 'team', id: t.id, label: t.name, live: m?.status === 'live',
        sub: m ? `${m.status === 'live' ? 'Live' : fmtKickoff(m.kickoff, now)} · ${teamById[m.home].short} v ${teamById[m.away].short}` : sportById[t.sport].name,
        to: m ? `/sports/match/${m.id}` : `/sports/${t.sport}`,
      });
    }
    for (const p of PLAYERS) {
      if (!hit(p.name)) continue;
      const m = nextMatchFor(p.teamId, matches);
      out.push({ kind: 'player', id: p.id, teamId: p.teamId, label: p.name, sub: `${teamById[p.teamId].name} · ${m ? 'Goalscorer markets' : 'No upcoming match'}`, to: m ? `/sports/match/${m.id}?group=scorers` : '/sports/football' });
    }
    for (const c of COMPETITIONS) {
      if (!hit(c.name) && norm(c.short) !== term && !hit(c.region)) continue;
      const n = matches.filter((m) => m.compId === c.id && m.status !== 'ft').length;
      out.push({ kind: 'comp', id: c.id, label: c.name, sub: `${c.region} · ${n} matches`, to: c.sport === 'football' ? `/sports/football?comp=${c.id}` : `/sports/${c.sport}` });
    }
    const top = matches.filter((m) => m.sport === 'football' && m.status !== 'ft').sort((a, b) => (a.status === 'live' ? -1 : 0) - (b.status === 'live' ? -1 : 0) || a.kickoff - b.kickoff).slice(0, 2);
    for (const mk of MARKETS) {
      if (!hit(mk.name) && !mk.aliases.some((a) => norm(a).startsWith(term))) continue;
      for (const m of top) {
        out.push({ kind: 'market', id: `${mk.anchor}-${m.id}`, label: mk.name, live: m.status === 'live', sub: `${teamById[m.home].name} v ${teamById[m.away].name}`, to: `/sports/match/${m.id}?group=${mk.group}` });
      }
    }
    return out.slice(0, 24);
  }, [q, matchesMap, now]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  const go = (r: Result) => {
    const next = [r.label, ...recent.filter((x) => x !== r.label)].slice(0, 6);
    setRecent(next);
    localStorage.setItem(RECENT, JSON.stringify(next));
    onClose();
    navigate(r.to);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    if (e.key === 'Enter' && results[active]) go(results[active]);
  };

  const groups: [Result['kind'], string][] = [['team', 'Teams'], ['player', 'Players'], ['comp', 'Competitions'], ['market', 'Markets']];
  let idx = -1;
  const suggestions = ['Arsenal', 'Premier League', 'Theo Marlowe', 'Both teams to score', 'Corners', 'Real Madrid'];

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center bg-black/55 backdrop-blur-[3px] sm:pt-[9vh]" style={{ animation: 'fade .15s' }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Search sportsbook" className="rise flex h-dvh w-full flex-col overflow-hidden border-line2 bg-s1 sm:h-auto sm:max-h-[76vh] sm:max-w-[640px] sm:rounded-2xl sm:border sm:shadow-2xl sm:shadow-black/60">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
          <button type="button" onClick={onClose} aria-label="Close search" className="inline-flex size-9 items-center justify-center rounded-lg text-tx2 hover:bg-s3 sm:hidden"><ArrowLeft size={18} /></button>
          <SearchIcon size={18} className="ml-1 hidden text-tx3 sm:block" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Teams, players, competitions, markets"
            aria-label="Search teams, players, competitions and markets"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
            aria-activedescendant={results[active] ? `sr-${active}` : undefined}
            className="h-10 min-w-0 flex-1 bg-transparent text-[16px] font-medium text-tx outline-none placeholder:text-tx3"
          />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Clear" className="inline-flex size-8 items-center justify-center rounded-md text-tx3 hover:bg-s3 hover:text-tx"><X size={16} /></button>}
          <kbd className="hidden rounded-md border border-line2 px-1.5 py-0.5 text-[11px] font-semibold text-tx3 sm:block">Esc</kbd>
        </div>

        <div id="search-results" role="listbox" className="scroll-thin min-h-0 flex-1 overflow-y-auto p-2">
          {q.trim().length < 2 ? (
            <div className="space-y-4 p-2">
              {recent.length > 0 && (
                <div>
                  <p className="eyebrow mb-2 flex items-center justify-between">Recent
                    <button type="button" className="normal-case tracking-normal text-tx3 hover:text-tx" onClick={() => { setRecent([]); localStorage.removeItem(RECENT); }}>Clear</button>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((r) => (
                      <button key={r} type="button" onClick={() => setQ(r)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-s2 px-2.5 text-[13px] text-tx2 hover:text-tx"><History size={13} />{r}</button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="eyebrow mb-2">Try</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((r) => (
                    <button key={r} type="button" onClick={() => setQ(r)} className="h-8 rounded-lg border border-line bg-s2 px-2.5 text-[13px] text-tx2 hover:text-tx">{r}</button>
                  ))}
                </div>
              </div>
              <p className="text-[12px] text-tx3">Tip: press <kbd className="rounded border border-line2 px-1">/</kbd> anywhere to search.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="font-display text-[16px] font-bold text-tx">No results for “{q}”</p>
              <p className="mt-1 text-[13px] text-tx2">Check the spelling, or search a team, a player, a competition or a market like “corners”.</p>
            </div>
          ) : (
            groups.map(([kind, title]) => {
              const items = results.filter((r) => r.kind === kind);
              if (!items.length) return null;
              return (
                <div key={kind} className="mb-2">
                  <p className="eyebrow px-2 pb-1 pt-2">{title}</p>
                  {items.map((r) => {
                    idx++;
                    const i = idx;
                    return (
                      <div key={r.kind + r.id} id={`sr-${i}`} role="option" aria-selected={i === active}
                        onMouseEnter={() => setActive(i)} onClick={() => go(r)}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 ${i === active ? 'bg-s3' : ''}`}>
                        <span className="flex size-8 shrink-0 items-center justify-center">
                          {r.kind === 'team' ? <Crest teamId={r.id} size={26} /> : r.kind === 'player' ? <Crest teamId={r.teamId} size={22} /> : r.kind === 'comp' ? <CompBadge compId={r.id} size={28} /> : <span className="flex size-7 items-center justify-center rounded-md bg-s4 text-[10px] font-bold text-tx2">MKT</span>}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-semibold text-tx"><Highlight text={r.label} term={q} /></span>
                          <span className="block truncate text-[12px] text-tx3">{r.sub}</span>
                        </span>
                        {'live' in r && r.live && <LivePill />}
                        {r.kind === 'team' && <FollowButton kind="team" id={r.id} name={r.label} size="sm" />}
                        {r.kind === 'comp' && <FollowButton kind="comp" id={r.id} name={r.label} size="sm" />}
                        {i === active && <CornerDownLeft size={14} className="hidden shrink-0 text-tx3 sm:block" />}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function Highlight({ text, term }: { text: string; term: string }) {
  const t = norm(term.trim());
  const i = norm(text).indexOf(t);
  if (!t || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-accent/20 text-tx">{text.slice(i, i + t.length)}</mark>
      {text.slice(i + t.length)}
    </>
  );
}
