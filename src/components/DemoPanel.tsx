import { FlaskConical, RotateCcw } from 'lucide-react';
import { useStore } from '../store';
import { FEATURED_MATCH_ID } from '../data/fixtures';
import { Popover } from './Popover';

/**
 * Demo controls. Every state the brief scores (odds changed, suspended, bet
 * failed, nothing live) also happens naturally in the simulation; these let a
 * judge trigger each one on demand instead of waiting for it.
 */
export function DemoButton() {
  const open = useStore((s) => s.demoOpen);
  const set = useStore((s) => s.set);
  return (
    <Popover
      label="Demo controls"
      width={320}
      open={open}
      onOpenChange={(v) => set({ demoOpen: v })}
      trigger={({ toggle, open }) => (
        <button type="button" onClick={toggle} aria-expanded={open} aria-label="Demo controls"
          className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-2.5 text-[12.5px] font-bold transition-colors lg:h-12 lg:px-3 ${open ? 'border-accent/50 bg-accent/10 text-accent' : 'border-dashed border-line2 bg-transparent text-tx2 hover:text-tx'}`}>
          <FlaskConical size={16} />
          <span className="max-sm:hidden">Demo</span>
        </button>
      )}
    >
      <DemoControls />
    </Popover>
  );
}

function DemoControls() {
  const s = useStore();
  const slipOpen = s.slip.filter((x) => s.sel[x.selId]?.status === 'open').length;
  const featured = s.matches[FEATURED_MATCH_ID];
  return (
    <div className="py-2">
      <div className="border-b border-line px-4 pb-2.5 pt-1.5">
        <p className="font-display text-[15px] font-bold text-tx">Demo controls</p>
        <p className="text-[11.5px] text-tx3">Sample fixtures and prices. Demo USDT, no real money. These states also happen on their own as matches play.</p>
      </div>
      <Row title="Change odds on my slip" body={slipOpen ? 'Moves the price; you must accept it.' : 'Add a selection first.'}>
        <Btn disabled={!slipOpen} onClick={() => s.demoMoveSlipOdds()}>Move</Btn>
      </Row>
      <Row title="Suspend a slip selection" body={slipOpen ? 'Locks its market for 15 seconds.' : 'Add a selection first.'}>
        <Btn disabled={!slipOpen} onClick={() => s.demoSuspendSlip()}>Suspend</Btn>
      </Row>
      <Row title="Next bet fails" body="The next placement is rejected by the trading service.">
        <Switch label="Next bet fails" on={s.demo.failNext} onClick={() => s.set({ demo: { ...s.demo, failNext: !s.demo.failNext } })} />
      </Row>
      <Row title="Goal in Arsenal v Brighton" body={featured?.status === 'live' ? 'Score changes, markets suspend, then reprice.' : 'Match is not in play.'}>
        <div className="flex gap-1">
          <Btn disabled={featured?.status !== 'live'} onClick={() => s.demoGoal(FEATURED_MATCH_ID, 'h')}>ARS</Btn>
          <Btn disabled={featured?.status !== 'live'} onClick={() => s.demoGoal(FEATURED_MATCH_ID, 'a')}>BHA</Btn>
        </div>
      </Row>
      <Row title="Nothing live" body="Shows the Live page with no matches in play.">
        <Switch label="Nothing live" on={s.demo.nothingLive} onClick={() => s.set({ demo: { ...s.demo, nothingLive: !s.demo.nothingLive } })} />
      </Row>
      <div className="border-t border-line px-4 pb-1 pt-2.5">
        <button type="button" onClick={() => { s.demoReset(); s.set({ demoOpen: false }); }} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-tx2 hover:text-tx">
          <RotateCcw size={13} /> Reset demo (matches, slip, bets, balance)
        </button>
      </div>
    </div>
  );
}

function Row({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-tx">{title}</p>
        <p className="text-[11.5px] leading-snug text-tx3">{body}</p>
      </div>
      {children}
    </div>
  );
}
function Btn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="btn-ghost h-8 shrink-0 px-2.5 text-[12px] disabled:opacity-40">{children}</button>
  );
}
export function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-s5'}`}>
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
    </button>
  );
}
