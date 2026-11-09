import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { compById, sportById } from '../data/catalog';
import type { SportId } from '../types';
import { MatchRow } from '../components/MatchRow';
import { CompBadge } from '../components/Crest';
import { EmptyState, FollowButton, SectionHead } from '../components/bits';
import { SportsNav } from '../components/sports';
import { SportIcon } from '../components/icons';
import { useShallowIds } from './useIds';

/** Live: every match in play, filterable by sport and competition. Falls back to Starting soon. */
export function Live() {
  const [params, setParams] = useSearchParams();
  const sport = (params.get('sport') as SportId | null) ?? 'all';
  const comp = params.get('comp');
  const nothingLive = useStore((s) => s.demo.nothingLive);
  const matches = useStore((s) => s.matches);
  const allLive = useShallowIds((m) => m.status === 'live' || m.status === 'ht', (a, b) => a.kickoff - b.kickoff);
  const live = nothingLive ? [] : allLive;

  const bySport = live.filter((id) => sport === 'all' || matches[id].sport === sport);
  const filtered = bySport.filter((id) => !comp || matches[id].compId === comp);
  const comps = [...new Set(bySport.map((id) => matches[id].compId))];

  const soon = useShallowIds((m) => m.status === 'pre' && (sport === 'all' || m.sport === sport), (a, b) => a.kickoff - b.kickoff);

  const setSport = (s: SportId | 'all') => setParams(s === 'all' ? {} : { sport: s }, { replace: true });
  const setComp = (c: string | null) => setParams({ ...(sport !== 'all' ? { sport } : {}), ...(c ? { comp: c } : {}) }, { replace: true });

  // group: sport → competition
  const groups: { sport: SportId; comp: string; ids: string[] }[] = [];
  for (const id of filtered) {
    const m = matches[id];
    let g = groups.find((x) => x.comp === m.compId);
    if (!g) groups.push((g = { sport: m.sport, comp: m.compId, ids: [] }));
    g.ids.push(id);
  }
  const order: SportId[] = ['football', 'tennis', 'basketball', 'hockey', 'esports', 'cricket'];
  groups.sort((a, b) => order.indexOf(a.sport) - order.indexOf(b.sport));
  const sportName = sport === 'all' ? '' : sportById[sport].name;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="flex items-center gap-3 font-display text-[28px] font-extrabold tracking-[-0.02em] text-tx lg:text-[34px]">
          Live
          <span className="num inline-flex h-7 items-center gap-1.5 rounded-lg bg-live/15 px-2 text-[14px] font-bold text-live">
            <span className="size-2 rounded-full bg-live animate-pulse-dot" aria-hidden />
            {live.length}
          </span>
        </h1>
        <p className="text-[13px] text-tx2">Scores and clocks update live. Prices pause while play is dangerous.</p>
      </div>

      <SportsNav mode="filter" active={sport} onPick={setSport} />

      {comps.length > 1 && (
        <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="tablist" aria-label="Competition">
          <CompChip on={!comp} onClick={() => setComp(null)} label={`All competitions · ${bySport.length}`} />
          {comps.map((c) => (
            <CompChip key={c} on={comp === c} onClick={() => setComp(c)} label={`${compById[c].name} · ${bySport.filter((id) => matches[id].compId === c).length}`} compId={c} />
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="space-y-6">
          <EmptyState
            icon={<SportIcon sport="live" size={30} />}
            title={sportName ? `Nothing live in ${sportName} right now` : 'Nothing live right now'}
            body={soon.length ? 'Here’s what starts next. Matches move to Live automatically at kick-off.' : 'Check back later for the next fixtures.'}
          />
          {soon.length > 0 && (
            <section>
              <SectionHead title="Starting soon" count={soon.length} />
              <div className="panel divide-y divide-line overflow-hidden">{soon.slice(0, 8).map((id) => <MatchRow key={id} id={id} showComp />)}</div>
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <section key={g.comp} className="panel overflow-hidden">
              <header className="flex items-center gap-2.5 border-b border-line bg-s2/50 px-4 py-2.5">
                <CompBadge compId={g.comp} size={24} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[14px] font-bold text-tx">{compById[g.comp].name}</h2>
                  <p className="text-[11.5px] text-tx3">{sportById[g.sport].name} · {compById[g.comp].region}</p>
                </div>
                <FollowButton kind="comp" id={g.comp} name={compById[g.comp].name} size="sm" />
                <OddsHeader sport={g.sport} />
              </header>
              <div className="divide-y divide-line">{g.ids.map((id) => <MatchRow key={id} id={id} />)}</div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export function OddsHeader({ sport }: { sport: SportId }) {
  const cols = sport === 'football' ? ['1', 'X', '2'] : ['1', '2'];
  return (
    <div className={`hidden w-[228px] shrink-0 gap-1.5 sm:grid md:mr-[60px] ${cols.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`} aria-hidden>
      {cols.map((c) => <span key={c} className="text-center text-[11px] font-bold text-tx3">{c}</span>)}
    </div>
  );
}

function CompChip({ on, onClick, label, compId }: { on: boolean; onClick: () => void; label: string; compId?: string }) {
  return (
    <button type="button" role="tab" aria-selected={on} onClick={onClick}
      className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-[12.5px] font-semibold transition-colors ${on ? 'border-line2 bg-s4 text-tx' : 'border-line bg-s1 text-tx2 hover:text-tx'}`}>
      {compId && <CompBadge compId={compId} size={18} />}
      {label}
    </button>
  );
}
