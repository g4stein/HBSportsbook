import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useStore } from '../store';
import { COMPETITIONS, compById, sportById, TEAMS, teamHomeComp } from '../data/catalog';
import type { SportId } from '../types';
import { MatchRow } from '../components/MatchRow';
import { CompBadge, Crest } from '../components/Crest';
import { EmptyState, FollowButton } from '../components/bits';
import { OpenBookToggle } from '../components/sports';
import { SportIcon } from '../components/icons';
import { dayKey } from '../lib/format';
import { useShallowIds } from './useIds';
import { OddsHeader } from './Live';

/** Sport page. Football: the five leagues, match result odds per row, follow teams and competitions. */
export function SportPage() {
  const { sport } = useParams();
  const [params, setParams] = useSearchParams();
  if (!sport || !(sport in sportById)) return <Navigate to="/sports" replace />;
  return <SportView sport={sport as SportId} comp={params.get('comp')} setComp={(c) => setParams(c ? { comp: c } : {}, { replace: true })} />;
}

function SportView({ sport, comp, setComp }: { sport: SportId; comp: string | null; setComp: (c: string | null) => void }) {
  const s = sportById[sport];
  const comps = COMPETITIONS.filter((c) => c.sport === sport);
  const followComps = useStore((st) => st.followComps);
  const followTeams = useStore((st) => st.followTeams);
  const now = useStore((st) => Math.floor(st.now / 60000) * 60000);
  const matches = useStore((st) => st.matches);
  const ids = useShallowIds(
    (m) => m.sport === sport && m.status !== 'ft' && (!comp || m.compId === comp),
    (a, b) => (a.status === 'live' || a.status === 'ht' ? -1 : 0) - (b.status === 'live' || b.status === 'ht' ? -1 : 0) || a.kickoff - b.kickoff,
  );
  const activeComp = comp && compById[comp]?.sport === sport ? compById[comp] : null;
  const compOrder = [...comps].sort((a, b) => Number(followComps.includes(b.id)) - Number(followComps.includes(a.id)));

  // Group by competition (when showing all) and by day.
  const sections = (activeComp ? [activeComp] : compOrder).map((c) => {
    const list = ids.filter((id) => matches[id].compId === c.id);
    const days: { key: string; ids: string[] }[] = [];
    for (const id of list) {
      const m = matches[id];
      const key = m.status === 'live' || m.status === 'ht' ? 'Live' : dayKey(m.kickoff, now);
      let d = days.find((x) => x.key === key);
      if (!d) days.push((d = { key, ids: [] }));
      d.ids.push(id);
    }
    return { comp: c, days, count: list.length };
  }).filter((x) => x.count > 0);

  const teamsHere = sport === 'football' && activeComp ? TEAMS.filter((t) => teamHomeComp[t.id] === activeComp.id) : [];
  const followedHere = sport === 'football' ? TEAMS.filter((t) => t.sport === 'football' && followTeams.includes(t.id)) : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-3 font-display text-[28px] font-extrabold tracking-[-0.02em] text-tx lg:text-[34px]">
          <span className="text-accent"><SportIcon sport={sport} size={28} /></span>
          {s.name}
        </h1>
        <OpenBookToggle size="sm" />
      </div>

      {comps.length > 1 && (
        <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="tablist" aria-label="Competitions">
          <Tab on={!activeComp} onClick={() => setComp(null)}>All</Tab>
          {comps.map((c) => (
            <Tab key={c.id} on={activeComp?.id === c.id} onClick={() => setComp(c.id)}>
              <CompBadge compId={c.id} size={20} />
              {c.name}
              {followComps.includes(c.id) && <Star size={11} className="text-gold" fill="currentColor" aria-label="Following" />}
            </Tab>
          ))}
        </div>
      )}

      {activeComp && (
        <section className="flex items-center gap-4 rounded-2xl border border-line bg-s1 p-4">
          <CompBadge compId={activeComp.id} size={52} />
          <div className="min-w-0 flex-1">
            <p className="eyebrow">{activeComp.region}</p>
            <h2 className="truncate font-display text-[22px] font-extrabold text-tx">{activeComp.name}</h2>
            <p className="text-[12.5px] text-tx3">{sections[0]?.count ?? 0} matches · match result odds on every row</p>
          </div>
          <FollowButton kind="comp" id={activeComp.id} name={activeComp.name} />
        </section>
      )}

      {sport === 'football' && (teamsHere.length > 0 || followedHere.length > 0) && (
        <section aria-label="Follow teams" className="rounded-2xl border border-line bg-s1 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[14px] font-bold text-tx">{activeComp ? `Follow ${activeComp.name} teams` : 'Your teams'}</h2>
            <p className="text-[12px] text-tx3">Followed teams show first, with goal alerts.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(activeComp ? teamsHere : followedHere).map((t) => <TeamChip key={t.id} id={t.id} />)}
            {!activeComp && <span className="self-center px-1 text-[12px] text-tx3">Pick a league above to follow more teams.</span>}
          </div>
        </section>
      )}

      {sections.length === 0 ? (
        <EmptyState icon={<SportIcon sport={sport} size={28} />} title={`No ${s.name.toLowerCase()} matches scheduled`} body="New fixtures are added daily." />
      ) : (
        sections.map(({ comp: c, days }) => (
          <section key={c.id} className="panel overflow-hidden">
            {!activeComp && (
              <header className="flex items-center gap-2.5 border-b border-line bg-s2/50 px-4 py-2.5">
                <CompBadge compId={c.id} size={24} />
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => setComp(c.id)} className="truncate text-left text-[14px] font-bold text-tx hover:underline">{c.name}</button>
                  <p className="text-[11.5px] text-tx3">{c.region}</p>
                </div>
                <FollowButton kind="comp" id={c.id} name={c.name} size="sm" />
                <OddsHeader sport={sport} />
              </header>
            )}
            {days.map((d) => (
              <div key={d.key}>
                <div className={`flex items-center justify-between border-b border-line px-4 py-1.5 ${d.key === 'Live' ? 'bg-live/[0.06]' : 'bg-bg/40'}`}>
                  <span className={`text-[11.5px] font-bold uppercase tracking-wide ${d.key === 'Live' ? 'text-live' : 'text-tx2'}`}>{d.key}</span>
                  {activeComp && d === days[0] && <OddsHeader sport={sport} />}
                </div>
                <div className="divide-y divide-line">{d.ids.map((id) => <MatchRow key={id} id={id} />)}</div>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
}

function Tab({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="tab" aria-selected={on} onClick={onClick}
      className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-[13px] font-semibold transition-colors ${on ? 'border-accent/50 bg-accent/10 text-tx' : 'border-line bg-s1 text-tx2 hover:border-line2 hover:text-tx'}`}>
      {children}
    </button>
  );
}

function TeamChip({ id }: { id: string }) {
  const on = useStore((s) => s.followTeams.includes(id));
  const toggle = useStore((s) => s.toggleFollowTeam);
  const t = TEAMS.find((x) => x.id === id)!;
  return (
    <button type="button" aria-pressed={on} onClick={() => toggle(id)}
      className={`inline-flex h-9 items-center gap-2 rounded-lg border pl-2 pr-2.5 text-[12.5px] font-semibold transition-colors ${on ? 'border-gold/40 bg-gold/10 text-tx' : 'border-line bg-s2 text-tx2 hover:text-tx'}`}>
      <Crest teamId={id} size={18} />
      {t.name}
      <Star size={13} className={on ? 'text-gold' : 'text-tx3'} fill={on ? 'currentColor' : 'none'} />
    </button>
  );
}
