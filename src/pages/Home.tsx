import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useStore } from '../store';
import { COMPETITIONS, teamById } from '../data/catalog';
import { FEATURED_MATCH_ID } from '../data/fixtures';
import { MatchRow } from '../components/MatchRow';
import { Crest, CompBadge } from '../components/Crest';
import { EmptyState, FollowButton, LiveClock, SectionHead } from '../components/bits';
import { OpenBookIntro, OpenBookToggle, SearchField, SportsNav } from '../components/sports';
import { OddsButton } from '../components/OddsButton';
import { SportIcon } from '../components/icons';
import { selId } from '../engine/pricing';
import { useShallowIds } from './useIds';
import { MatchCarousel } from '../components/MatchCard';
import { Flag } from '../components/Flag';
import { COUNTRIES } from '../data/catalog';

export function Home() {
  const nothingLive = useStore((s) => s.demo.nothingLive);
  const liveIds = useShallowIds((m) => m.status === 'live' || m.status === 'ht', (a, b) => (a.sport === 'football' ? 0 : 1) - (b.sport === 'football' ? 0 : 1) || a.kickoff - b.kickoff);
  const soonIds = useShallowIds((m, now) => m.status === 'pre' && m.kickoff - now < 3 * 3600_000, (a, b) => a.kickoff - b.kickoff);
  const followTeams = useStore((s) => s.followTeams);
  const followComps = useStore((s) => s.followComps);
  const followIds = useShallowIds(
    (m) => m.status !== 'ft' && (followTeams.includes(m.home) || followTeams.includes(m.away) || followComps.includes(m.compId)),
    (a, b) => (a.status === 'live' ? -1 : 0) - (b.status === 'live' ? -1 : 0) || a.kickoff - b.kickoff,
  );
  const live = nothingLive ? [] : liveIds;
  const popular = useShallowIds(
    (m, now) => m.id !== FEATURED_MATCH_ID && m.status !== 'ft' && (m.sport !== 'football' || !!COMPETITIONS.find((c) => c.id === m.compId)?.featured) && m.kickoff - now < 30 * 3600_000,
    (a, b) => (a.status === 'live' ? -1 : 0) - (b.status === 'live' ? -1 : 0) || (a.sport === 'football' ? 0 : 1) - (b.sport === 'football' ? 0 : 1) || a.kickoff - b.kickoff,
  );
  const featuredLive = useStore((s) => s.matches[FEATURED_MATCH_ID]?.status === 'live' || s.matches[FEATURED_MATCH_ID]?.status === 'ht');

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-tx lg:text-[34px]">Sports</h1>
          <OpenBookToggle />
        </div>
        <SearchField />
        <SportsNav />
      </div>

      <section aria-labelledby="popular">
        <div id="popular"><SectionHead title="Popular" /></div>
        <MatchCarousel ids={(nothingLive ? popular.filter((id) => !liveIds.includes(id)) : popular).slice(0, 10)} label="Popular matches" />
      </section>

      <OpenBookIntro />

      <section aria-labelledby="live-now">
        <div id="live-now">
          <SectionHead title="Live now" count={live.length} to="/sports/live" toLabel="All live" icon={<span className="size-2 rounded-full bg-live animate-pulse-dot" aria-hidden />} />
        </div>
        {live.length === 0 ? (
          <EmptyState icon={<SportIcon sport="live" size={28} />} title="Nothing live right now" body="The next matches are below in Starting soon. Live matches appear here the moment they kick off." />
        ) : (
          <div className="space-y-3">
            {featuredLive && !nothingLive && <Spotlight id={FEATURED_MATCH_ID} />}
            <div className="panel divide-y divide-line overflow-hidden">
              {live.filter((id) => id !== FEATURED_MATCH_ID).slice(0, 6).map((id) => <MatchRow key={id} id={id} showComp />)}
            </div>
          </div>
        )}
      </section>

      {followIds.length > 0 && (
        <section aria-labelledby="following">
          <div id="following"><SectionHead title="Following" count={followIds.length} to="/sports/football" toLabel="Football" /></div>
          <div className="panel divide-y divide-line overflow-hidden">
            {followIds.slice(0, 4).map((id) => <MatchRow key={id} id={id} showComp />)}
          </div>
        </section>
      )}

      <section aria-labelledby="soon">
        <div id="soon"><SectionHead title="Starting soon" count={soonIds.length} to="/sports/football" toLabel="All football" /></div>
        {soonIds.length === 0 ? (
          <EmptyState title="Nothing starting in the next 3 hours" body="See the full schedule on each sport page." />
        ) : (
          <div className="panel divide-y divide-line overflow-hidden">{soonIds.slice(0, 7).map((id) => <MatchRow key={id} id={id} showComp />)}</div>
        )}
      </section>

      <section aria-labelledby="comps">
        <div id="comps"><SectionHead title="Top competitions" /></div>
        <TopCompetitions />
      </section>
    </div>
  );
}

function TopCompetitions() {
  const matches = useStore((s) => s.matches);
  const nothingLive = useStore((s) => s.demo.nothingLive);
  const list = COMPETITIONS.filter((c) => c.featured);
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {list.map((c) => {
        const ms = Object.values(matches).filter((m) => m.compId === c.id && m.status !== 'ft');
        const live = nothingLive ? 0 : ms.filter((m) => m.status === 'live' || m.status === 'ht').length;
        return (
          <Link key={c.id} to={`/sports/football?comp=${c.id}`} className="group flex items-center gap-3 rounded-xl border border-line bg-s1 p-3 transition-colors hover:border-line2 hover:bg-s2">
            <CompBadge compId={c.id} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[15px] font-bold text-tx">{c.name}</span>
              <span className="flex items-center gap-1 text-[12px] text-tx3">
                <Flag code={c.country!} size={13} /> {COUNTRIES[c.country!]} · {ms.length} matches{live > 0 && <span className="font-semibold text-live"> · {live} live</span>}
              </span>
            </span>
            <FollowButton kind="comp" id={c.id} name={c.name} size="sm" />
            <ChevronRight size={16} className="text-tx3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        );
      })}
    </div>
  );
}

/** Headline live match with a compact scoreboard and its match-result prices. */
function Spotlight({ id }: { id: string }) {
  const m = useStore((s) => s.matches[id]);
  const count = useStore((s) => s.markets[id]?.filter((k) => !k.hidden).length ?? 0);
  const now = useStore((s) => s.now);
  if (!m) return null;
  const H = teamById[m.home];
  const A = teamById[m.away];
  const goalFlash = m.lastEvent?.kind === 'goal' && now - m.lastEvent.at < 9000;
  const susp = m.suspendedUntil > now;
  return (
    <article className="relative overflow-hidden rounded-2xl border border-line2 bg-s1">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ background: `radial-gradient(60% 120% at 0% 0%, ${H.colors[0]}, transparent 60%), radial-gradient(60% 120% at 100% 0%, ${A.colors[0]}, transparent 60%)` }} />
      <div className="relative grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
        <Link to={`/sports/match/${m.id}`} className="flex items-center gap-3 sm:gap-5">
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 text-right">
            <span className="truncate font-display text-[16px] font-bold text-tx sm:text-[18px]">{H.name}</span>
            <Crest teamId={H.id} size={34} />
          </div>
          <div className="flex shrink-0 flex-col items-center">
            <span className={`num rounded-lg px-2 text-[30px] font-extrabold leading-none tracking-tight transition-colors sm:text-[34px] ${goalFlash ? 'bg-accent/15 text-accent' : 'text-tx'}`}>{m.score[0]}<span className="mx-1 text-tx3">–</span>{m.score[1]}</span>
            <LiveClock m={m} className="mt-1.5" />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Crest teamId={A.id} size={34} />
            <span className="truncate font-display text-[16px] font-bold text-tx sm:text-[18px]">{A.name}</span>
          </div>
        </Link>
        <div className="flex flex-col gap-2 sm:w-[300px]">
          <div className="flex items-center justify-between text-[11.5px] text-tx3">
            <span>Match result · Premier League</span>
            {susp ? <span className="font-bold uppercase tracking-wide text-warn">Suspended</span> : <Link to={`/sports/match/${m.id}`} className="font-semibold text-tx2 hover:text-tx">+{count} markets</Link>}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['h', 'd', 'a'] as const).map((o) => <OddsButton key={o} selId={selId(m.id, '1x2', o)} />)}
          </div>
        </div>
      </div>
    </article>
  );
}
