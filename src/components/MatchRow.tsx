import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useStore } from '../store';
import { compById, teamById } from '../data/catalog';
import { mainMarketKey, selId } from '../engine/pricing';
import { Crest } from './Crest';
import { OddsButton } from './OddsButton';
import { clockText } from './bits';
import { fmtTime } from '../lib/format';

/** One fixture as a dense row: clock, both teams with live score, main-market prices, link to all markets. */
export const MatchRow = memo(function MatchRow({ id, showComp = false }: { id: string; showComp?: boolean }) {
  const m = useStore((s) => s.matches[id]);
  const now = useStore((s) => (s.matches[id]?.status === 'pre' ? Math.floor(s.now / 30000) * 30000 : s.now));
  const count = useStore((s) => s.markets[id]?.filter((k) => !k.hidden).length ?? 0);
  const followed = useStore((s) => s.followTeams.includes(m.home) || s.followTeams.includes(m.away));
  if (!m) return null;
  const key = mainMarketKey(m);
  const outs = key === '1x2' ? ['h', 'd', 'a'] : ['h', 'a'];
  const live = m.status === 'live' || m.status === 'ht';
  const susp = m.suspendedUntil > now && m.status === 'live';
  const { text } = clockText(m, now);
  const flash = m.lastEvent?.kind === 'goal' && now - m.lastEvent.at < 9000 ? m.lastEvent.side : null;
  const to = `/sports/match/${m.id}`;
  const H = teamById[m.home];
  const A = teamById[m.away];
  const subScore = m.sport === 'tennis' || m.sport === 'esports';

  const teamLine = (tid: string, score: number, sub: number, side: 'h' | 'a') => (
    <div className="flex min-w-0 items-center gap-2">
      <Crest teamId={tid} size={18} />
      <span className={`min-w-0 flex-1 truncate text-[13.5px] ${live && score > (side === 'h' ? m.score[1] : m.score[0]) ? 'font-bold text-tx' : 'font-medium text-tx'}`}>
        {teamById[tid].name}
      </span>
      {live && subScore && <span className="num w-5 text-right text-[12px] font-semibold text-tx3">{sub}</span>}
      {(live || m.status === 'ft') && (
        <span className={`num w-6 rounded text-right text-[14px] font-bold transition-colors ${flash === side ? 'bg-accent/20 text-accent' : 'text-tx'}`}>{score}</span>
      )}
    </div>
  );

  return (
    <div className={`group relative flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-s2/70 sm:gap-3 sm:px-4 ${followed ? 'before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-gold/70' : ''}`}>
      <Link to={to} className="flex min-w-0 flex-1 items-center gap-3 rounded-md" aria-label={`${H.name} v ${A.name}, ${live ? `live ${text}, ${m.score[0]}–${m.score[1]}` : text}`}>
        <div className="hidden w-14 shrink-0 flex-col items-start gap-0.5 sm:flex">
          {live ? (
            <span className="num inline-flex items-center gap-1.5 text-[12px] font-bold text-live">
              <span aria-hidden className="size-1.5 rounded-full bg-live animate-pulse-dot" />
              {text}
            </span>
          ) : (
            <span className="num text-[12.5px] font-bold text-tx">{m.kickoff - now < 3600_000 && m.kickoff > now ? text.replace('in ', '') : fmtTime(m.kickoff)}</span>
          )}
          {susp ? <span className="text-[10px] font-semibold uppercase tracking-wide text-warn">Paused</span> : !live && m.kickoff - now > 3600_000 && <span className="text-[10.5px] text-tx3">{text.split(' ')[0]}</span>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2 sm:hidden">
            <span className={`num inline-flex items-center gap-1 text-[11px] font-bold ${live ? 'text-live' : 'text-tx2'}`}>
              {live && <span aria-hidden className="size-1.5 rounded-full bg-live animate-pulse-dot" />}
              {text}
            </span>
            {susp && <span className="text-[10px] font-semibold uppercase text-warn">Paused</span>}
            {showComp && <span className="truncate text-[11px] text-tx3">· {compById[m.compId].name}</span>}
          </div>
          {showComp && <span className="hidden truncate text-[11px] text-tx3 sm:block">{compById[m.compId].name}</span>}
          {teamLine(m.home, m.score[0], m.sub[0], 'h')}
          {teamLine(m.away, m.score[1], m.sub[1], 'a')}
        </div>
      </Link>
      <div className={`grid shrink-0 gap-1.5 ${outs.length === 3 ? 'w-[174px] grid-cols-3 sm:w-[228px]' : 'w-[174px] grid-cols-2 sm:w-[228px]'}`}>
        {outs.map((o) => (
          <OddsButton key={o} selId={selId(m.id, key, o)} />
        ))}
      </div>
      <Link to={to} aria-label={`All ${count} markets`} className="hidden h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg text-tx3 transition-colors hover:bg-s3 hover:text-tx md:flex">
        <span className="num text-[12px] font-bold">+{count}</span>
        <ChevronRight size={14} />
      </Link>
    </div>
  );
});
