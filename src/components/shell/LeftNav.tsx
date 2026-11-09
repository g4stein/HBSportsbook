import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { CircleHelp, Gift, HeartHandshake, House, MessageCircle, Star, Ticket, X } from 'lucide-react';
import { useStore } from '../../store';
import { COMPETITIONS, SPORTS, compById, teamById } from '../../data/catalog';
import { SportIcon } from '../icons';
import { CompBadge, Crest } from '../Crest';

function Item({ to, icon, label, badge, active, collapsed, onClick, live }: { to?: string; icon: ReactNode; label: string; badge?: ReactNode; active?: boolean; collapsed?: boolean; onClick?: () => void; live?: boolean }) {
  const cls = `group relative flex h-10 items-center gap-3 rounded-lg border px-3 text-[13.5px] font-medium transition-colors ${
    active
      ? 'border-accent/15 bg-accent/6 font-semibold text-tx before:absolute before:bottom-2.5 before:left-0 before:top-2.5 before:w-0.5 before:rounded-full before:bg-accent'
      : 'border-transparent text-tx hover:border-white/10 hover:bg-white/[0.06]'
  } ${collapsed ? 'justify-center px-0' : ''}`;
  const inner = (
    <>
      <span aria-hidden className={`flex size-5 shrink-0 items-center justify-center ${active ? 'text-tx' : 'text-tx2 group-hover:text-tx'}`}>{icon}</span>
      {!collapsed && <span className="min-w-0 flex-1 truncate text-left">{label}</span>}
      {!collapsed && badge}
      {collapsed && live && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-live" />}
    </>
  );
  if (to) return <NavLink to={to} onClick={onClick} aria-current={active ? 'page' : undefined} title={collapsed ? label : undefined} className={cls}>{inner}</NavLink>;
  return <button type="button" onClick={onClick} title={collapsed ? label : undefined} className={`${cls} w-full`}>{inner}</button>;
}

function Group({ title, children, collapsed }: { title?: string; children: ReactNode; collapsed?: boolean }) {
  return (
    <div className="rounded-xl bg-[color-mix(in_srgb,var(--color-s2)_94%,black)] py-1 [&+&]:mt-2">
      {title && !collapsed && <div className="eyebrow px-3 pb-1 pt-2">{title}</div>}
      <div className="flex flex-col px-1">{children}</div>
    </div>
  );
}

const Count = ({ n, live }: { n: number; live?: boolean }) =>
  n > 0 ? <span className={`num rounded-md px-1.5 text-[11px] font-bold leading-5 ${live ? 'bg-live/15 text-live' : 'bg-s4 text-tx2'}`}>{n}</span> : null;

export function NavContent({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const loc = useLocation();
  const [params] = useSearchParams();
  const matches = useStore((s) => s.matches);
  const followTeams = useStore((s) => s.followTeams);
  const followComps = useStore((s) => s.followComps);
  const openBets = useStore((s) => s.bets.filter((b) => b.status === 'open').length);
  const nothingLive = useStore((s) => s.demo.nothingLive);
  const toast = useStore((s) => s.toast);
  const all = Object.values(matches);
  const liveBy = (sport?: string) => (nothingLive ? 0 : all.filter((m) => (m.status === 'live' || m.status === 'ht') && (!sport || m.sport === sport)).length);
  const outside = (what: string) => () => {
    onNavigate?.();
    toast({ tone: 'info', title: `${what} isn’t part of this prototype`, body: 'This demo covers the five sportsbook pages.' });
  };
  const path = loc.pathname;
  const comp = params.get('comp');

  return (
    <nav aria-label="Main navigation" className="flex flex-col">
      <div className="px-1 py-4">
        <div className={`flex overflow-hidden rounded-lg border border-line2 ${collapsed ? 'flex-col' : ''}`}>
          <button type="button" onClick={outside('Casino')} className="flex h-10 flex-1 items-center justify-center bg-s2 text-[13.5px] font-semibold text-tx2 hover:bg-s3 hover:text-tx">
            {collapsed ? 'C' : 'Casino'}
          </button>
          <span className={`flex h-10 flex-1 items-center justify-center bg-accent/10 text-[13.5px] font-bold text-accent ${collapsed ? 'border-t' : 'border-l'} border-line2`} aria-current="page">
            {collapsed ? 'S' : 'Sports'}
          </span>
        </div>
      </div>

      <Group collapsed={collapsed}>
        <Item to="/sports" icon={<House size={18} />} label="Sports home" active={path === '/sports'} collapsed={collapsed} onClick={onNavigate} />
        <Item to="/sports/live" icon={<SportIcon sport="live" />} label="Live" active={path === '/sports/live'} badge={<Count n={liveBy()} live />} live={liveBy() > 0} collapsed={collapsed} onClick={onNavigate} />
        <Item to="/sports/bets" icon={<Ticket size={18} />} label="My bets" active={path === '/sports/bets'} badge={<Count n={openBets} />} collapsed={collapsed} onClick={onNavigate} />
      </Group>

      <Group title="Sports" collapsed={collapsed}>
        {SPORTS.map((s) => (
          <Item key={s.id} to={`/sports/${s.id}`} icon={<SportIcon sport={s.id} />} label={s.name} active={path === `/sports/${s.id}` && !comp} badge={<Count n={liveBy(s.id)} live />} live={liveBy(s.id) > 0} collapsed={collapsed} onClick={onNavigate} />
        ))}
      </Group>

      <Group title="Top competitions" collapsed={collapsed}>
        {COMPETITIONS.filter((c) => c.featured).map((c) => (
          <Item key={c.id} to={`/sports/football?comp=${c.id}`} icon={<CompBadge compId={c.id} size={20} />} label={c.name} active={path === '/sports/football' && comp === c.id} collapsed={collapsed} onClick={onNavigate} />
        ))}
      </Group>

      {(followTeams.length > 0 || followComps.length > 0) && (
        <Group title="Following" collapsed={collapsed}>
          {followComps.map((id) => (
            <Item key={id} to={`/sports/${compById[id].sport}${compById[id].sport === 'football' ? `?comp=${id}` : ''}`} icon={<CompBadge compId={id} size={20} />} label={compById[id].name} collapsed={collapsed} onClick={onNavigate}
              badge={<Star size={12} className="text-gold" fill="currentColor" />} />
          ))}
          {followTeams.map((id) => {
            const m = all.filter((x) => (x.home === id || x.away === id) && x.status !== 'ft').sort((a, b) => a.kickoff - b.kickoff)[0];
            const live = m && (m.status === 'live' || m.status === 'ht');
            return (
              <Item key={id} to={m ? `/sports/match/${m.id}` : `/sports/${teamById[id].sport}`} icon={<Crest teamId={id} size={18} />} label={teamById[id].name} collapsed={collapsed} onClick={onNavigate} live={!!live}
                badge={live ? <span className="num text-[11px] font-bold text-live">{m.home === id ? `${m.score[0]}–${m.score[1]}` : `${m.score[1]}–${m.score[0]}`}</span> : <Star size={12} className="text-gold" fill="currentColor" />} />
            );
          })}
        </Group>
      )}

      <Group collapsed={collapsed}>
        <Item icon={<Gift size={18} />} label="Promotions" collapsed={collapsed} onClick={outside('Promotions')} />
        <Item icon={<Star size={18} />} label="Rewards" collapsed={collapsed} onClick={outside('The Rewards page')}
          badge={<span className="rounded-md border border-line2 bg-s2 px-1.5 text-[11px] leading-5 text-tx">Rookie</span>} />
      </Group>

      {!collapsed && (
        <div className="py-4">
          <div className="flex flex-col gap-0.5 rounded-xl border border-line bg-[color-mix(in_srgb,var(--color-s2)_94%,black)] p-2">
            <Item icon={<CircleHelp size={18} />} label="Help Center" onClick={outside('Help Center')} />
            <Item icon={<HeartHandshake size={18} />} label="Responsible Gambling" onClick={outside('Responsible Gambling')} />
            <Item icon={<MessageCircle size={18} />} label="Live Support" onClick={outside('Live Support')} />
            <p className="px-3 pt-2 text-[11px] leading-relaxed text-tx3">Prototype · sample data only · demo USDT. 18+ · Play responsibly.</p>
          </div>
        </div>
      )}
    </nav>
  );
}

export function LeftNav() {
  const collapsed = useStore((s) => s.navCollapsed);
  return (
    <aside className={`relative z-20 hidden shrink-0 border-r border-line bg-s1 transition-[width] duration-200 lg:block ${collapsed ? 'w-[72px]' : 'w-[220px]'}`}>
      <div className="scroll-thin scrollbar-none sticky top-16 h-[calc(100dvh-4rem)] overflow-y-auto px-2 pb-6">
        <NavContent collapsed={collapsed} />
      </div>
    </aside>
  );
}

export function MobileNav() {
  const open = useStore((s) => s.navOpen);
  const set = useStore((s) => s.set);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1600] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-black/55" style={{ animation: 'fade .15s' }} onClick={() => set({ navOpen: false })} />
      <div className="absolute inset-y-0 left-0 w-[300px] max-w-[85vw] overflow-y-auto border-r border-line bg-s1 px-3 pb-24" style={{ animation: 'rise .2s' }}>
        <div className="flex items-center justify-between pt-3">
          <span className="eyebrow">Menu</span>
          <button type="button" onClick={() => set({ navOpen: false })} aria-label="Close menu" className="inline-flex size-9 items-center justify-center rounded-lg text-tx2 hover:bg-s3"><X size={18} /></button>
        </div>
        <NavContent onNavigate={() => set({ navOpen: false })} />
      </div>
    </div>
  );
}
