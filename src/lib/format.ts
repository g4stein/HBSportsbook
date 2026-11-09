export const fmtOdds = (o: number | null | undefined) => (o == null ? '—' : o.toFixed(2));

export function fmtUsdt(n: number, opts: { sign?: boolean } = {}) {
  const s = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (opts.sign) return `${n >= 0 ? '+' : '−'}${s}`;
  return n < 0 ? `−${s}` : s;
}

export const fmtPct = (x: number, dp = 1) => `${(x * 100).toFixed(dp)}%`;

export function parseStake(s: string): number | null {
  if (!s.trim()) return null;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

export function fmtKickoff(ts: number, now: number) {
  const diff = ts - now;
  if (diff < 0) return 'Now';
  if (diff < 60 * 60_000) return `in ${Math.max(1, Math.round(diff / 60_000))} min`;
  const d = new Date(ts);
  const today = new Date(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(today.getDate() + 1);
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return `Today ${time}`;
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow ${time}`;
  return `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} ${time}`;
}

export function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function fmtDateTime(ts: number) {
  const d = new Date(ts);
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${fmtTime(ts)}`;
}

export function dayKey(ts: number, now: number) {
  const d = new Date(ts);
  const t = new Date(now);
  const tm = new Date(now);
  tm.setDate(t.getDate() + 1);
  if (d.toDateString() === t.toDateString()) return 'Today';
  if (d.toDateString() === tm.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}
