import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Star, X } from 'lucide-react';
import { useStore } from '../store';
import { COMPETITIONS, COUNTRIES, compById, teamById, TEAMS, teamHomeComp } from '../data/catalog';
import type { Match } from '../types';
import { MatchRow } from '../components/MatchRow';
import { CompBadge, Crest } from '../components/Crest';
import { Flag } from '../components/Flag';
import { EmptyState, FollowButton } from '../components/bits';
import { OpenBookToggle } from '../components/sports';
import { SportIcon } from '../components/icons';
import { dayKey } from '../lib/format';
import { useShallowIds } from './useIds';
import { OddsHeader } from './Live';

type Filter = 'all' | 'live' | 'upcoming' | 'following';
const FILTERS: Filter[] = ['all', 'live', 'upcoming', 'following'];
const TOP = COMPETITIONS.filter((c) => c.sport === 'football' && c.featured);
const isLive = (m: Match) => m.status === 'live' || m.status === 'ht';
const byTime = (a: Match, b: Match) => (isLive(a) ? -1 : 0) - (isLive(b) ? -1 : 0) || a.kickoff - b.kickoff;

function passes(m: Match, f: Filter, teams: string[], comps: string[]) {
  if (m.status === 'ft') return false;
  if (f === 'live') return isLive(m);
  if (f === 'upcoming') return m.status === 'pre';
  if (f === 'following') return teams.includes(m.home) || teams.includes(m.away) || comps.includes(m.compId);
  return true;
}

/**
 * Football: the five required leagues pinned as one-click tabs, an
 * All / Live / Upcoming / Following filter, every other league in a
 * country A–Z, and following for teams and competitions.
 */
export function FootballPage() {
  const [params, setParams] = useSearchParams();
  const comp = params.get('comp');
  const activeComp = comp && compById[comp]?.sport === 'football' ? compById[comp] : null;
  const filter = (FILTERS.includes(params.get('filter') as Filter) ? params.get('filter') : 'all') as Filter;
  const teams = useStore((s) => s.followTeams);
  const comps = useStore((s) => s.followComps);
  const ids = useShallowIds((m) => m.sport === 'football' && passes(m, filter, teams, comps) && (!activeComp || m.compId === activeComp.id), byTime);
  const counts = useStore((s) => {
    const all = Object.values(s.matches).filter((m) => m.sport === 'football' && (!activeComp || m.compId === activeComp.id));
    return {
      all: all.filter((m) => m.status !== 'ft').length,
      live: all.filter(isLive).length,
      upcoming: all.filter((m) => m.status === 'pre').length,
      following: all.filter((m) => passes(m, 'following', s.followTeams, s.followComps)).length,
    };
  });

  const go = (next: { comp?: string | null; filter?: Filter }) => {
    const c = next.comp === undefined ? comp : next.comp;
    const f = next.filter ?? filter;
    const p: Record<string, string> = {};
    if (c) p.comp = c;
    if (f !== 'all') p.filter = f;
    setParams(p, { replace: true });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-3 font-display text-[28px] font-extrabold tracking-[-0.02em] text-tx lg:text-[34px]">
          <span className="text-accent"><SportIcon sport="football" size={28} /></span>
          Football
        </h1>
        <OpenBookToggle size="sm" />
      </div>

      <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="tablist" aria-label="Top competitions">
        <Tab on={!activeComp} onClick={() => go({ comp: null })}>All football</Tab>
        {TOP.map((c) => (
          <Tab key={c.id} on={activeComp?.id === c.id} onClick={() => go({ comp: c.id })}>
            <CompBadge compId={c.id} size={20} />
            {c.name}
            {comps.includes(c.id) && <Star size={11} className="text-gold" fill="currentColor" aria-label="Following" />}
          </Tab>
        ))}
        {activeComp && !activeComp.featured && (
          <Tab on onClick={() => {}}>
            <Flag code={activeComp.country!} size={18} />
            {activeComp.name}
          </Tab>
        )}
      </div>

      <div role="radiogroup" aria-label="Show" className="inline-grid grid-cols-4 gap-1 rounded-xl border border-line bg-s1 p-1 max-sm:w-full">
        {FILTERS.map((f) => (
          <button key={f} type="button" role="radio" aria-checked={filter === f} onClick={() => go({ filter: f })}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold capitalize transition-colors ${filter === f ? 'bg-s4 text-tx' : 'text-tx2 hover:text-tx'}`}>
            {f === 'live' && <span className="size-1.5 rounded-full bg-live" aria-hidden />}
            {f === 'following' && <Star size={12} className={filter === f ? 'text-gold' : ''} fill={filter === f ? 'currentColor' : 'none'} />}
            {f}
            <span className={`num text-[11px] ${f === 'live' && counts.live ? 'text-live' : 'text-tx3'}`}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {activeComp ? (
        <CompView compId={activeComp.id} ids={ids} filter={filter} />
      ) : filter === 'following' ? (
        <FollowingView ids={ids} />
      ) : (
        <>
          <section aria-labelledby="top-comps" className="space-y-3">
            <h2 id="top-comps" className="font-display text-[19px] font-bold text-tx">Top competitions</h2>
            <CompPanels compIds={TOP.map((c) => c.id)} ids={ids} filter={filter} />
          </section>
          <CountryAZ ids={ids} filter={filter} />
        </>
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

function emptyCopy(filter: Filter) {
  return filter === 'live' ? 'Nothing live here right now.' : filter === 'upcoming' ? 'No upcoming matches here.' : filter === 'following' ? 'None of your follows play here.' : 'No matches scheduled.';
}

/** A competition card per league, each with its own 1 X 2 header. */
function CompPanels({ compIds, ids, filter }: { compIds: string[]; ids: string[]; filter: Filter }) {
  const matches = useStore((s) => s.matches);
  const shown = compIds.map((c) => ({ c, list: ids.filter((id) => matches[id].compId === c) }));
  if (shown.every((x) => x.list.length === 0)) return <EmptyState icon={<SportIcon sport="football" size={28} />} title={emptyCopy(filter)} body="Try another filter, or browse every league in the A–Z below." />;
  return (
    <div className="space-y-3">
      {shown.filter((x) => x.list.length).map(({ c, list }) => (
        <section key={c} className="panel overflow-hidden">
          <CompHeader compId={c} />
          <div className="divide-y divide-line">{list.slice(0, 6).map((id) => <MatchRow key={id} id={id} />)}</div>
          {list.length > 6 && (
            <Link to={`/sports/football?comp=${c}`} className="flex h-10 items-center justify-center gap-1 border-t border-line text-[12.5px] font-semibold text-tx2 hover:text-tx">
              All {list.length} {compById[c].name} matches <ChevronRight size={14} />
            </Link>
          )}
        </section>
      ))}
    </div>
  );
}

function CompHeader({ compId }: { compId: string }) {
  const c = compById[compId];
  return (
    <header className="flex items-center gap-2.5 border-b border-line bg-s2/50 px-4 py-2.5">
      <CompBadge compId={c.id} size={24} />
      <div className="min-w-0 flex-1">
        <Link to={`/sports/football?comp=${c.id}`} className="block truncate text-[14px] font-bold text-tx hover:underline">{c.name}</Link>
        <p className="flex items-center gap-1.5 text-[11.5px] text-tx3"><Flag code={c.country!} size={14} />{COUNTRIES[c.country!]}</p>
      </div>
      <FollowButton kind="comp" id={c.id} name={c.name} size="sm" />
      <OddsHeader sport="football" />
    </header>
  );
}

/** Every football competition, grouped by country, A–Z. Countries and leagues expand in place. */
function CountryAZ({ ids, filter }: { ids: string[]; filter: Filter }) {
  const matches = useStore((s) => s.matches);
  const [openCountry, setOpenCountry] = useState<Record<string, boolean>>({ ENG: true });
  const [openComp, setOpenComp] = useState<Record<string, boolean>>({});
  const countries = Object.entries(COUNTRIES).sort((a, b) => a[1].localeCompare(b[1]));
  return (
    <section aria-labelledby="az" className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 id="az" className="font-display text-[19px] font-bold text-tx">All competitions A–Z</h2>
        <button type="button" className="text-[12.5px] font-semibold text-tx2 hover:text-tx"
          onClick={() => {
            const allOpen = countries.every(([code]) => openCountry[code]);
            setOpenCountry(Object.fromEntries(countries.map(([code]) => [code, !allOpen])));
          }}>
          {countries.every(([code]) => openCountry[code]) ? 'Collapse all' : 'Expand all'}
        </button>
      </div>
      <div className="panel divide-y divide-line overflow-hidden">
        {countries.map(([code, name]) => {
          const list = COMPETITIONS.filter((c) => c.sport === 'football' && c.country === code).sort((a, b) => (a.tier ?? 9) - (b.tier ?? 9));
          const inCountry = ids.filter((id) => compById[matches[id].compId].country === code);
          const live = inCountry.filter((id) => isLive(matches[id])).length;
          const open = !!openCountry[code];
          return (
            <div key={code}>
              <button type="button" aria-expanded={open} onClick={() => setOpenCountry((o) => ({ ...o, [code]: !open }))}
                className="flex h-13 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-s2/60">
                <Flag code={code} size={22} />
                <span className="flex-1 text-[14px] font-bold text-tx">{name}</span>
                {live > 0 && <span className="num rounded-md bg-live/15 px-1.5 text-[11px] font-bold leading-5 text-live">{live} live</span>}
                <span className="num text-[12px] text-tx3">{inCountry.length}</span>
                <ChevronDown size={16} className={`text-tx3 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              {open && (
                <div className="border-t border-line bg-bg/40">
                  {list.map((c) => {
                    const cm = ids.filter((id) => matches[id].compId === c.id);
                    const cOpen = !!openComp[c.id];
                    const cLive = cm.filter((id) => isLive(matches[id])).length;
                    return (
                      <div key={c.id} className="border-b border-line last:border-b-0">
                        <div className="flex items-center gap-2.5 py-2 pl-7 pr-3 sm:pl-10">
                          <button type="button" aria-expanded={cOpen} disabled={!cm.length} onClick={() => setOpenComp((o) => ({ ...o, [c.id]: !cOpen }))}
                            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md text-left disabled:opacity-60">
                            <CompBadge compId={c.id} size={24} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13.5px] font-semibold text-tx">{c.name}</span>
                              <span className="block text-[11.5px] text-tx3">
                                {cm.length ? `${cm.length} ${cm.length === 1 ? 'match' : 'matches'}` : emptyCopy(filter)}
                                {cLive > 0 && <span className="font-semibold text-live"> · {cLive} live</span>}
                              </span>
                            </span>
                            {cm.length > 0 && <ChevronDown size={15} className={`shrink-0 text-tx3 transition-transform ${cOpen ? 'rotate-180' : ''}`} />}
                          </button>
                          <FollowButton kind="comp" id={c.id} name={c.name} size="sm" />
                          <Link to={`/sports/football?comp=${c.id}`} aria-label={`Open ${c.name}`} className="inline-flex size-8 items-center justify-center rounded-lg text-tx3 hover:bg-s3 hover:text-tx"><ChevronRight size={16} /></Link>
                        </div>
                        {cOpen && <div className="divide-y divide-line border-t border-line bg-s1">{cm.map((id) => <MatchRow key={id} id={id} />)}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FollowingView({ ids }: { ids: string[] }) {
  const teams = useStore((s) => s.followTeams).filter((t) => teamById[t]?.sport === 'football');
  const comps = useStore((s) => s.followComps).filter((c) => compById[c]?.sport === 'football');
  const matches = useStore((s) => s.matches);
  const unfollowTeam = useStore((s) => s.toggleFollowTeam);
  const unfollowComp = useStore((s) => s.toggleFollowComp);
  const groupComps = [...new Set(ids.map((id) => matches[id].compId))];
  return (
    <div className="space-y-4">
      <section aria-label="Your follows" className="rounded-2xl border border-line bg-s1 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-[14px] font-bold text-tx">You follow</h2>
          <p className="text-[12px] text-tx3">Followed matches show first everywhere, with goal alerts.</p>
        </div>
        {teams.length + comps.length === 0 ? (
          <p className="text-[13px] text-tx2">Nothing yet. Tap the star on any team or competition to follow it.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {comps.map((c) => (
              <span key={c} className="inline-flex h-9 items-center gap-2 rounded-lg border border-gold/30 bg-gold/8 pl-2 pr-1 text-[12.5px] font-semibold text-tx">
                <CompBadge compId={c} size={18} />{compById[c].name}
                <button type="button" onClick={() => unfollowComp(c)} aria-label={`Unfollow ${compById[c].name}`} className="inline-flex size-6 items-center justify-center rounded-md text-tx3 hover:bg-s3 hover:text-tx"><X size={13} /></button>
              </span>
            ))}
            {teams.map((t) => (
              <span key={t} className="inline-flex h-9 items-center gap-2 rounded-lg border border-gold/30 bg-gold/8 pl-2 pr-1 text-[12.5px] font-semibold text-tx">
                <Crest teamId={t} size={18} />{teamById[t].name}
                <button type="button" onClick={() => unfollowTeam(t)} aria-label={`Unfollow ${teamById[t].name}`} className="inline-flex size-6 items-center justify-center rounded-md text-tx3 hover:bg-s3 hover:text-tx"><X size={13} /></button>
              </span>
            ))}
          </div>
        )}
      </section>
      {ids.length === 0 ? (
        <EmptyState icon={<Star size={28} />} title="No matches from your follows" body="Follow a team on its match page, or a whole competition from the list below the tabs." />
      ) : (
        <CompPanels compIds={groupComps} ids={ids} filter="following" />
      )}
    </div>
  );
}

function CompView({ compId, ids, filter }: { compId: string; ids: string[]; filter: Filter }) {
  const c = compById[compId];
  const matches = useStore((s) => s.matches);
  const now = useStore((s) => Math.floor(s.now / 60000) * 60000);
  const total = useStore((s) => Object.values(s.matches).filter((m) => m.compId === compId && m.status !== 'ft').length);
  const days: { key: string; ids: string[] }[] = [];
  for (const id of ids) {
    const m = matches[id];
    const key = isLive(m) ? 'Live' : dayKey(m.kickoff, now);
    let d = days.find((x) => x.key === key);
    if (!d) days.push((d = { key, ids: [] }));
    d.ids.push(id);
  }
  const teamsHere = TEAMS.filter((t) => teamHomeComp[t.id] === compId);
  return (
    <div className="space-y-4">
      <section className="flex items-center gap-4 rounded-2xl border border-line bg-s1 p-4">
        <CompBadge compId={c.id} size={52} />
        <div className="min-w-0 flex-1">
          <p className="eyebrow flex items-center gap-1.5"><Flag code={c.country!} size={14} />{COUNTRIES[c.country!]}</p>
          <h2 className="truncate font-display text-[22px] font-extrabold text-tx">{c.name}</h2>
          <p className="text-[12.5px] text-tx3">{total} matches · match result odds on every row</p>
        </div>
        <FollowButton kind="comp" id={c.id} name={c.name} />
      </section>
      {teamsHere.length > 0 && (
        <section aria-label="Follow teams" className="rounded-2xl border border-line bg-s1 p-4">
          <h2 className="mb-3 text-[14px] font-bold text-tx">Follow {c.name} teams</h2>
          <div className="flex flex-wrap gap-1.5">{teamsHere.map((t) => <TeamChip key={t.id} id={t.id} />)}</div>
        </section>
      )}
      {days.length === 0 ? (
        <EmptyState icon={<SportIcon sport="football" size={28} />} title={emptyCopy(filter)} body={filter !== 'all' ? 'Switch the filter to All to see the full schedule.' : 'New fixtures are added daily.'} />
      ) : (
        <section className="panel overflow-hidden">
          {days.map((d, i) => (
            <div key={d.key}>
              <div className={`flex items-center justify-between border-b border-line px-4 py-1.5 ${d.key === 'Live' ? 'bg-live/[0.06]' : 'bg-bg/40'}`}>
                <span className={`text-[11.5px] font-bold uppercase tracking-wide ${d.key === 'Live' ? 'text-live' : 'text-tx2'}`}>{d.key}</span>
                {i === 0 && <OddsHeader sport="football" />}
              </div>
              <div className="divide-y divide-line">{d.ids.map((id) => <MatchRow key={id} id={id} />)}</div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function TeamChip({ id }: { id: string }) {
  const on = useStore((s) => s.followTeams.includes(id));
  const toggle = useStore((s) => s.toggleFollowTeam);
  return (
    <button type="button" aria-pressed={on} onClick={() => toggle(id)}
      className={`inline-flex h-9 items-center gap-2 rounded-lg border pl-2 pr-2.5 text-[12.5px] font-semibold transition-colors ${on ? 'border-gold/40 bg-gold/10 text-tx' : 'border-line bg-s2 text-tx2 hover:text-tx'}`}>
      <Crest teamId={id} size={18} />
      {teamById[id].name}
      <Star size={13} className={on ? 'text-gold' : 'text-tx3'} fill={on ? 'currentColor' : 'none'} />
    </button>
  );
}
