import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store';
import { COUNTRIES, compById, teamById } from '../data/catalog';
import { mainMarketKey, selId } from '../engine/pricing';
import { Crest } from './Crest';
import { Flag } from './Flag';
import { OddsButton } from './OddsButton';
import { clockText } from './bits';
import { fmtKickoff } from '../lib/format';

/** Fixture card in the style of the Housebets sports lobby: league line, crests, main market. */
export function MatchCard({ id }: { id: string }) {
  const m = useStore((s) => s.matches[id]);
  const now = useStore((s) => s.now);
  if (!m) return null;
  const c = compById[m.compId];
  const live = m.status === 'live' || m.status === 'ht';
  const key = mainMarketKey(m);
  const outs = key === '1x2' ? ['h', 'd', 'a'] : ['h', 'a'];
  const goal = m.lastEvent?.kind === 'goal' && now - m.lastEvent.at < 9000 ? m.lastEvent.side : null;
  const marketName = key === '1x2' ? 'Match result' : m.sport === 'hockey' ? 'Winner (incl. overtime)' : 'Winner';
  const side = (tid: string, s: 'h' | 'a') => (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      <Crest teamId={tid} size={36} />
      <span className="w-full truncate text-[13.5px] font-bold text-tx">{teamById[tid].name}</span>
      {live && <span className={`num rounded-md px-1.5 text-[22px] font-extrabold leading-none ${goal === s ? 'bg-accent/20 text-accent' : 'text-tx'}`}>{s === 'h' ? m.score[0] : m.score[1]}</span>}
    </div>
  );
  return (
    <article className="flex w-[300px] shrink-0 snap-start flex-col rounded-2xl border border-line bg-s1 transition-colors hover:border-line2">
      <Link to={`/sports/match/${m.id}`} className="flex flex-1 flex-col px-4 pb-3 pt-3">
        <div className="flex items-center justify-between gap-2 text-[11.5px]">
          <span className="flex min-w-0 items-center gap-1.5 text-tx2">
            {c.country && <Flag code={c.country} size={14} />}
            <span className="truncate">{c.country ? COUNTRIES[c.country] : c.region} · {c.name}</span>
          </span>
          {live ? (
            <span className="num inline-flex shrink-0 items-center gap-1.5 font-bold text-live"><span aria-hidden className="size-1.5 rounded-full bg-live animate-pulse-dot" />{clockText(m, now).text}</span>
          ) : (
            <span className="num shrink-0 font-semibold text-tx2">{fmtKickoff(m.kickoff, now)}</span>
          )}
        </div>
        <div className="mt-3 flex items-start gap-2">
          {side(m.home, 'h')}
          <span className="pt-2.5 text-[12px] font-bold text-tx3">{live ? '–' : 'v'}</span>
          {side(m.away, 'a')}
        </div>
        <p className="mt-3 text-center text-[11.5px] text-tx3">{marketName}</p>
      </Link>
      <div className={`grid gap-1.5 px-3 pb-3 ${outs.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {outs.map((o) => <OddsButton key={o} selId={selId(m.id, key, o)} inline />)}
      </div>
    </article>
  );
}

export function MatchCarousel({ ids, label }: { ids: string[]; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 316, behavior: 'smooth' });
  return (
    <div className="relative">
      <div ref={ref} role="list" aria-label={label} className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 lg:mx-0 lg:scroll-px-0 lg:px-0">
        {ids.map((id) => <div role="listitem" key={id}><MatchCard id={id} /></div>)}
      </div>
      <div className="pointer-events-none absolute -top-12 right-0 hidden gap-1.5 lg:flex">
        <button type="button" aria-label="Previous matches" onClick={() => scroll(-1)} className="pointer-events-auto inline-flex size-8 items-center justify-center rounded-lg border border-line2 bg-s2 text-tx2 hover:text-tx"><ChevronLeft size={16} /></button>
        <button type="button" aria-label="Next matches" onClick={() => scroll(1)} className="pointer-events-auto inline-flex size-8 items-center justify-center rounded-lg border border-line2 bg-s2 text-tx2 hover:text-tx"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
