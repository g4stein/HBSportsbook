import { useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { useStore } from '../store';
import { compById, playerById, playersByTeam, sportById, teamById } from '../data/catalog';
import type { Market, MarketGroup, Match } from '../types';
import { Crest, CompBadge } from '../components/Crest';
import { EdgeChip, FollowButton, InfoTip, LiveClock, LivePill, clockText } from '../components/bits';
import { OddsButton } from '../components/OddsButton';
import { OpenBookToggle } from '../components/sports';
import { clockSeconds, selId } from '../engine/pricing';
import { fmtKickoff, fmtPct } from '../lib/format';
import { SportIcon } from '../components/icons';

const GROUPS: { id: MarketGroup; label: string }[] = [
  { id: 'popular', label: 'Popular' },
  { id: 'goals', label: 'Goals' },
  { id: 'halves', label: 'Halves' },
  { id: 'handicaps', label: 'Handicaps' },
  { id: 'scorers', label: 'Goalscorers' },
  { id: 'cornerscards', label: 'Corners & cards' },
];

export function MatchPage() {
  const { id } = useParams();
  const m = useStore((s) => (id ? s.matches[id] : undefined));
  if (!id || !m) return <Navigate to="/sports" replace />;
  return <MatchView key={id} id={id} />;
}

function MatchView({ id }: { id: string }) {
  const m = useStore((s) => s.matches[id]);
  const markets = useStore((s) => s.markets[id] ?? []);
  const openBook = useStore((s) => s.openBook);
  const [params, setParams] = useSearchParams();
  const football = m.sport === 'football';
  const groups = football ? GROUPS : GROUPS.slice(0, 1);
  const group = (groups.find((g) => g.id === params.get('group'))?.id ?? 'popular') as MarketGroup;
  const comp = compById[m.compId];

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const g of groups) c[g.id] = new Set(markets.filter((k) => !k.hidden && k.groups.includes(g.id)).map((k) => k.family)).size;
    return c;
  }, [markets, groups]);

  const visible = markets.filter((k) => k.groups.includes(group));
  const families = groupFamilies(visible.filter((k) => !k.hidden && k.selections.some((s) => s.status !== 'unavailable')));
  const settled = groupFamilies(visible).filter((f) => f.every((k) => k.hidden));
  const open = markets.filter((k) => !k.hidden);
  const avgEdge = open.length ? open.reduce((a, k) => a + k.edge, 0) / open.length : 0;

  return (
    <div className="space-y-4">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 overflow-hidden text-[13px] text-tx3">
        <Link to="/sports" className="shrink-0 hover:text-tx">Sports</Link>
        <ChevronRight size={14} className="shrink-0" />
        <Link to={`/sports/${m.sport}`} className="shrink-0 hover:text-tx">{sportById[m.sport].name}</Link>
        <ChevronRight size={14} className="shrink-0" />
        <Link to={m.sport === 'football' ? `/sports/football?comp=${comp.id}` : `/sports/${m.sport}`} className="truncate hover:text-tx">{comp.name}</Link>
        <ChevronRight size={14} className="hidden shrink-0 sm:block" />
        <span className="hidden truncate text-tx sm:block" aria-current="page">{teamById[m.home].name} v {teamById[m.away].name}</span>
      </nav>

      <Scoreboard m={m} />
      <SuspendBanner m={m} />

      <div className="sticky top-14 z-30 -mx-4 border-b border-line bg-bg/95 px-4 backdrop-blur lg:top-16 lg:mx-0 lg:px-0">
        <div className="flex items-center gap-3">
          <div role="tablist" aria-label="Market groups" className="scrollbar-none flex min-w-0 flex-1 gap-1 overflow-x-auto py-2">
            {groups.map((g) => (
              <button key={g.id} type="button" role="tab" aria-selected={group === g.id}
                onClick={() => setParams(g.id === 'popular' ? {} : { group: g.id }, { replace: true })}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13.5px] font-semibold transition-colors ${group === g.id ? 'bg-s4 text-tx' : 'text-tx2 hover:bg-s2 hover:text-tx'}`}>
                {g.label}
                <span className={`num text-[11px] ${group === g.id ? 'text-accent' : 'text-tx3'}`}>{counts[g.id]}</span>
              </button>
            ))}
          </div>
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            {openBook && <span className="hidden text-[12px] text-tx3 2xl:inline">Avg edge <b className="num text-tx2">{fmtPct(avgEdge)}</b></span>}
            <OpenBookToggle size="sm" />
          </div>
        </div>
      </div>
      <div className="flex justify-end md:hidden"><OpenBookToggle size="sm" /></div>

      <div role="tabpanel" className="space-y-3">
        {m.status === 'ft' && (
          <div className="rounded-xl border border-line2 bg-s2 px-4 py-3 text-[13px] text-tx2">
            <b className="text-tx">Full time.</b> Markets are settled and open bets have been paid out.
          </div>
        )}
        {group === 'scorers' ? (
          <ScorersCard m={m} markets={visible.filter((k) => !k.hidden)} />
        ) : families.length === 0 && m.status !== 'ft' ? (
          <div className="rounded-xl border border-dashed border-line2 px-4 py-10 text-center text-[13px] text-tx2">No open markets in this group right now.</div>
        ) : (
          families.map((f) => <FamilyCard key={f[0].family} markets={f} m={m} />)
        )}
        {settled.length > 0 && <SettledList families={settled} />}
      </div>
    </div>
  );
}

function groupFamilies(list: Market[]) {
  const out: Market[][] = [];
  for (const k of list) {
    const f = out.find((x) => x[0].family === k.family);
    if (f) f.push(k);
    else out.push([k]);
  }
  return out;
}

// ── Scoreboard ─────────────────────────────────────────────────────────────

function Scoreboard({ m }: { m: Match }) {
  const now = useStore((s) => s.now);
  const H = teamById[m.home];
  const A = teamById[m.away];
  const live = m.status === 'live' || m.status === 'ht';
  const goal = m.lastEvent?.kind === 'goal' && now - m.lastEvent.at < 9000 ? m.lastEvent.side : null;
  const football = m.sport === 'football';
  const { text } = clockText(m, now);
  const period = m.status === 'ht' ? 'Half-time' : m.status === 'ft' ? 'Full time' : m.status === 'pre' ? 'Kick-off' : football ? (m.period === 1 ? '1st half' : '2nd half') : '';

  const scorers = (side: 'h' | 'a') =>
    m.goals.filter((g) => g.side === side).map((g, i) => (
      <span key={i} className="whitespace-nowrap">{g.playerId ? playerById[g.playerId]?.name.split(' ').slice(-1)[0] : 'OG'} {g.minute}&rsquo;</span>
    ));

  return (
    <section aria-label="Scoreboard" className="relative overflow-hidden rounded-2xl border border-line2 bg-s1">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.18]" style={{ background: `radial-gradient(55% 140% at 0% 0%, ${H.colors[0]}, transparent 62%), radial-gradient(55% 140% at 100% 0%, ${A.colors[0]}, transparent 62%)` }} />
      {goal && <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-center bg-accent" style={{ animation: 'goal-sweep 2.4s ease-out forwards' }} />}
      <div className="relative px-4 pb-4 pt-3 sm:px-6 sm:pb-5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 text-[12px] text-tx2">
            <CompBadge compId={m.compId} size={20} />
            <span className="truncate">{compById[m.compId].name}</span>
          </span>
          {live ? <LivePill /> : m.status === 'ft' ? <span className="rounded-md bg-s4 px-2 py-0.5 text-[11px] font-bold uppercase text-tx2">Full time</span> : <span className="text-[12px] font-semibold text-tx2">{fmtKickoff(m.kickoff, now)}</span>}
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:gap-6">
          <TeamSide id={H.id} align="right" scorers={football ? scorers('h') : null} />
          <div className="flex min-w-[112px] flex-col items-center pt-1">
            {m.status === 'pre' ? (
              <span className="num text-[26px] font-extrabold text-tx sm:text-[32px]">{new Date(m.kickoff).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
            ) : (
              <span className="num flex items-center text-[40px] font-extrabold leading-none tracking-tight text-tx sm:text-[52px]" aria-label={`Score ${m.score[0]} ${m.score[1]}`}>
                <span className={`rounded-lg px-1.5 transition-colors ${goal === 'h' ? 'bg-accent/20 text-accent' : ''}`}>{m.score[0]}</span>
                <span className="mx-1 text-tx3">–</span>
                <span className={`rounded-lg px-1.5 transition-colors ${goal === 'a' ? 'bg-accent/20 text-accent' : ''}`}>{m.score[1]}</span>
              </span>
            )}
            {(m.sport === 'tennis' || m.sport === 'esports') && live && (
              <span className="num mt-1 text-[13px] font-bold text-tx2">{m.sport === 'tennis' ? 'Games' : 'Rounds'} {m.sub[0]}–{m.sub[1]}</span>
            )}
            <span className="mt-2 flex flex-col items-center gap-0.5">
              {live ? <LiveClock m={m} className="text-[15px]" /> : <span className="num text-[13px] font-bold text-tx2">{m.status === 'pre' ? text : 'FT'}</span>}
              {period && <span className="text-[11px] font-semibold uppercase tracking-wider text-tx3">{period}</span>}
            </span>
          </div>
          <TeamSide id={A.id} align="left" scorers={football ? scorers('a') : null} />
        </div>

        {football && m.status !== 'pre' && <Timeline m={m} now={now} />}
        {football && m.status !== 'pre' && (
          <div className="num mt-3 flex items-center justify-center gap-5 text-[12px] text-tx2">
            <span className="flex items-center gap-1.5"><CornerFlag /> Corners <b className="text-tx">{m.corners[0]}–{m.corners[1]}</b></span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-2 rounded-[2px] bg-warn" aria-hidden /> Cards <b className="text-tx">{m.cards[0]}–{m.cards[1]}</b></span>
          </div>
        )}
      </div>
    </section>
  );
}

function TeamSide({ id, align, scorers }: { id: string; align: 'left' | 'right'; scorers: React.ReactNode[] | null }) {
  const t = teamById[id];
  return (
    <div className={`flex min-w-0 flex-col items-center gap-2 sm:flex-row sm:items-start ${align === 'right' ? 'sm:flex-row-reverse sm:text-right' : 'sm:text-left'}`}>
      <Crest teamId={id} size={52} />
      <div className={`flex min-w-0 flex-col items-center gap-1.5 sm:pt-1 ${align === 'right' ? 'sm:items-end' : 'sm:items-start'}`}>
        <span className="max-w-full truncate text-center font-display text-[16px] font-extrabold leading-tight text-tx sm:text-[22px]">{t.name}</span>
        <FollowButton kind="team" id={id} name={t.name} />
        {scorers && scorers.length > 0 && (
          <span className={`flex flex-wrap justify-center gap-x-2 text-[11.5px] text-tx2 ${align === 'right' ? 'sm:justify-end' : 'sm:justify-start'}`}>
            <SportIcon sport="football" size={12} className="mt-px text-tx3" />
            {scorers}
          </span>
        )}
      </div>
    </div>
  );
}

function Timeline({ m, now }: { m: Match; now: number }) {
  const sec = Math.min(5400, clockSeconds(m, now));
  const pct = (sec / 5400) * 100;
  return (
    <div className="mt-5" aria-hidden>
      <div className="relative h-1.5 rounded-full bg-s4">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent2 to-accent" style={{ width: `${pct}%` }} />
        <div className="absolute -top-1 bottom-[-4px] left-1/2 w-px bg-tx3/60" />
        {m.goals.map((g, i) => (
          <span key={i} className={`absolute size-3 -translate-x-1/2 rounded-full border-2 border-s1 ${g.side === 'h' ? '-top-[14px] bg-tx' : 'top-[8px] bg-tx2'}`} style={{ left: `${Math.min(100, (g.minute / 90) * 100)}%` }} />
        ))}
      </div>
      <div className="num mt-1.5 flex justify-between text-[10px] font-semibold text-tx3"><span>0&rsquo;</span><span>HT</span><span>90&rsquo;</span></div>
    </div>
  );
}

const CornerFlag = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M2 11V1l7 2.5L2 6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
);

function SuspendBanner({ m }: { m: Match }) {
  const now = useStore((s) => s.now);
  const left = m.suspendedUntil - now;
  if (m.status !== 'live' || left <= 0) return null;
  return (
    <div role="status" className="rise relative flex items-center gap-3 overflow-hidden rounded-xl border border-warn/40 bg-[#2a2210] px-4 py-2.5">
      <Lock size={16} className="shrink-0 text-warn" />
      <p className="flex-1 text-[13px] text-tx">
        <b className="text-warn">{m.suspendReason ?? 'Suspended'}.</b> All markets are suspended while we update prices. Your bet slip keeps your selections.
      </p>
      <span className="num shrink-0 text-[12px] font-bold text-warn">{Math.ceil(left / 1000)}s</span>
      <span key={m.suspendedUntil} aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-warn/70" style={{ animation: `shrink ${Math.max(0.5, left / 1000)}s linear forwards` }} />
    </div>
  );
}

// ── Markets ────────────────────────────────────────────────────────────────

function CardHead({ title, edge, suspended, note, open, onToggle, extra }: { title: string; edge: number; suspended: boolean; note?: string; open: boolean; onToggle: () => void; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <ChevronDown size={16} className={`shrink-0 text-tx3 transition-transform ${open ? '' : '-rotate-90'}`} />
        <h3 className="truncate text-[14.5px] font-bold text-tx">{title}</h3>
      </button>
      {extra}
      {suspended && <span className="inline-flex h-5 items-center gap-1 rounded-md bg-warn/12 px-1.5 text-[10.5px] font-bold uppercase tracking-wide text-warn"><Lock size={10} strokeWidth={2.6} />Suspended</span>}
      <EdgeChip edge={edge} />
      {note && <InfoTip label={`About ${title}`}>{note}</InfoTip>}
    </div>
  );
}

function FamilyCard({ markets, m }: { markets: Market[]; m: Match }) {
  const [open, setOpen] = useState(true);
  const first = markets[0];
  const lines = first.layout === 'lines';
  const title = lines ? first.familyName : first.name;
  const edge = markets.reduce((a, k) => a + k.edge, 0) / markets.length;
  const suspended = markets.some((k) => k.status === 'suspended');
  const H = teamById[m.home];
  const A = teamById[m.away];
  const hcp = first.family === 'hcp';

  return (
    <article id={`mk-${first.family}`} className={`panel overflow-hidden ${suspended ? 'border-warn/25' : ''}`}>
      <CardHead title={title} edge={edge} suspended={suspended} note={first.note} open={open} onToggle={() => setOpen((v) => !v)} />
      {open && (
        <div className="px-3 pb-3">
          {lines ? (
            <div className="overflow-hidden rounded-lg border border-line">
              <div className="grid grid-cols-[1fr_76px_1fr] bg-s2 px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-tx3 sm:grid-cols-[1fr_96px_1fr]">
                <span>{hcp ? H.name : 'Over'}</span>
                <span>Line</span>
                <span>{hcp ? A.name : 'Under'}</span>
              </div>
              {markets.map((k) => (
                <div key={k.id} className="grid grid-cols-[1fr_76px_1fr] items-center gap-1.5 border-t border-line px-2 py-1.5 sm:grid-cols-[1fr_96px_1fr]">
                  <OddsButton selId={k.selections[0].id} variant="cell" />
                  <span className="num text-center text-[13px] font-bold text-tx2">{k.lineLabel}</span>
                  <OddsButton selId={k.selections[1].id} variant="cell" />
                </div>
              ))}
            </div>
          ) : (
            <div className={`grid gap-1.5 ${first.selections.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {first.selections.map((s) => (
                <OddsButton key={s.id} selId={s.id} variant="wide" label={first.family === 'dc' ? s.short : undefined} />
              ))}
            </div>
          )}
          {first.family === 'dc' && <p className="mt-2 px-1 text-[11.5px] text-tx3">1X: {H.name} or draw · 12: either team wins · X2: draw or {A.name}</p>}
        </div>
      )}
    </article>
  );
}

function ScorersCard({ m, markets }: { m: Match; markets: Market[] }) {
  const [team, setTeam] = useState<'all' | 'h' | 'a'>('all');
  const [open, setOpen] = useState(true);
  const ats = markets.find((k) => k.family === 'ats');
  const ngs = markets.find((k) => k.family === 'ngs');
  const sel = useStore((s) => s.sel);
  if (!ats && !ngs) return <div className="rounded-xl border border-dashed border-line2 px-4 py-10 text-center text-[13px] text-tx2">Goalscorer markets are closed.</div>;
  const H = teamById[m.home];
  const A = teamById[m.away];
  const players = [...(playersByTeam[m.home] ?? []), ...(playersByTeam[m.away] ?? [])]
    .filter((p) => team === 'all' || (team === 'h' ? p.teamId === m.home : p.teamId === m.away))
    .map((p) => ({ p, odds: sel[selId(m.id, 'ats', p.id)]?.odds ?? 999, goals: m.goals.filter((g) => g.playerId === p.id).length }))
    .sort((a, b) => (b.goals > 0 ? 1 : 0) - (a.goals > 0 ? 1 : 0) || a.odds - b.odds);
  const suspended = !!(ats?.status === 'suspended' || ngs?.status === 'suspended');
  const edge = ((ats?.edge ?? 0) + (ngs?.edge ?? 0)) / ((ats ? 1 : 0) + (ngs ? 1 : 0));

  return (
    <article id="mk-scorers" className={`panel overflow-hidden ${suspended ? 'border-warn/25' : ''}`}>
      <CardHead title="Goalscorers" edge={edge} suspended={suspended} open={open} onToggle={() => setOpen((v) => !v)}
        note="Next goalscorer settles on the next goal only; own goals count as No goalscorer. Anytime pays if the player scores at any point in the match. Players are fictional." />
      {open && (
        <div className="px-3 pb-3">
          <div className="mb-2 flex gap-1" role="tablist" aria-label="Team">
            {([['all', 'Both teams'], ['h', H.name], ['a', A.name]] as const).map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={team === k} onClick={() => setTeam(k)}
                className={`h-8 rounded-md px-2.5 text-[12.5px] font-semibold ${team === k ? 'bg-s4 text-tx' : 'text-tx2 hover:text-tx'}`}>{l}</button>
            ))}
          </div>
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="grid grid-cols-[1fr_84px_84px] gap-1.5 bg-s2 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-tx3 sm:grid-cols-[1fr_120px_120px]">
              <span>Player</span>
              <span className="text-center">{ngs ? ngs.name.replace('Next goalscorer ', 'Next ') : 'Next'}</span>
              <span className="text-center">Anytime</span>
            </div>
            {players.map(({ p, goals }) => (
              <div key={p.id} className="grid grid-cols-[1fr_84px_84px] items-center gap-1.5 border-t border-line px-2 py-1.5 sm:grid-cols-[1fr_120px_120px]">
                <span className="flex min-w-0 items-center gap-2">
                  <Crest teamId={p.teamId} size={18} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-tx">{p.name}</span>
                    <span className="block text-[11px] text-tx3">{p.pos === 'FW' ? 'Forward' : p.pos === 'MF' ? 'Midfielder' : 'Defender'}{goals > 0 && <span className="font-semibold text-up"> · scored {goals > 1 ? `×${goals}` : ''}</span>}</span>
                  </span>
                </span>
                {ngs ? <OddsButton selId={selId(m.id, ngs.key, p.id)} variant="cell" /> : <span />}
                {ats ? <OddsButton selId={selId(m.id, 'ats', p.id)} variant="cell" /> : <span />}
              </div>
            ))}
            {ngs && (
              <div className="grid grid-cols-[1fr_84px_84px] items-center gap-1.5 border-t border-line bg-s2/40 px-2 py-1.5 sm:grid-cols-[1fr_120px_120px]">
                <span className="text-[13px] font-semibold text-tx2">No goalscorer</span>
                <OddsButton selId={selId(m.id, ngs.key, 'none')} variant="cell" />
                <span />
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function SettledList({ families }: { families: Market[][] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-line bg-s1/60">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-[13px] font-semibold text-tx2 hover:text-tx">
        Settled markets · {families.length}
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="divide-y divide-line border-t border-line">
          {families.map((f) => {
            const winners = f.flatMap((k) => k.selections.filter((s) => s.status === 'won').map((s) => (f.length > 1 ? s.label : s.label)));
            return (
              <li key={f[0].family} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                <span className="text-tx2">{f[0].layout === 'lines' ? f[0].familyName : f[0].name}</span>
                <span className="truncate text-right font-semibold text-up">{winners.slice(0, 3).join(', ') || 'Void'}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
