import { FlaskConical } from 'lucide-react';
import { useStore } from '../store';

/** Demo-only strip inside the slip so every slip state can be triggered on any device. */
export function SlipDemo() {
  const failNext = useStore((s) => s.demo.failNext);
  const demo = useStore((s) => s.demo);
  const set = useStore((s) => s.set);
  const move = useStore((s) => s.demoMoveSlipOdds);
  const suspend = useStore((s) => s.demoSuspendSlip);
  const chip = 'h-7 rounded-md border border-dashed border-line2 px-2 text-[11.5px] font-semibold text-tx2 hover:border-accent/40 hover:text-tx';
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-dashed border-line2 px-2.5 py-2" aria-label="Demo states">
      <span className="mr-0.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-tx3"><FlaskConical size={12} /> Demo</span>
      <button type="button" className={chip} onClick={() => move()}>Change odds</button>
      <button type="button" className={chip} onClick={() => suspend()}>Suspend</button>
      <button type="button" aria-pressed={failNext} className={`${chip} ${failNext ? 'border-down/50 text-down' : ''}`} onClick={() => set({ demo: { ...demo, failNext: !failNext } })}>
        {failNext ? 'Next bet will fail' : 'Fail next bet'}
      </button>
    </div>
  );
}
