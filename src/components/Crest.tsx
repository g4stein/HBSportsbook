import { compById, teamById } from '../data/catalog';

/**
 * Generated crests. These are deliberately NOT club badges: a two-colour
 * shield with the team code, so the prototype carries no third-party logos.
 */
export function Crest({ teamId, size = 24 }: { teamId: string; size?: number }) {
  const t = teamById[teamId];
  if (!t) return null;
  const [c1, c2] = t.colors;
  if (t.person) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-bg"
        style={{ width: size, height: size, background: c1, fontSize: size * 0.36 }}
        aria-hidden
      >
        {t.short.slice(0, 2)}
      </span>
    );
  }
  const id = `cr-${teamId}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <defs>
        <clipPath id={id}>
          <path d="M12 1.6 21 4.4v6.9c0 5.3-3.7 9.4-9 11.1-5.3-1.7-9-5.8-9-11.1V4.4z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect width="24" height="24" fill={c1} />
        <path d="M24 0v24H11z" fill={c2} opacity={0.92} />
        <rect x="0" y="15.5" width="24" height="9" fill="rgb(0 0 0 / 0.28)" />
      </g>
      <path d="M12 1.6 21 4.4v6.9c0 5.3-3.7 9.4-9 11.1-5.3-1.7-9-5.8-9-11.1V4.4z" fill="none" stroke="rgb(255 255 255 / 0.28)" strokeWidth="0.8" />
      <text x="12" y="20.3" textAnchor="middle" fontSize="5.4" fontWeight="800" fill="#fff" fontFamily="Red Hat Display, sans-serif" letterSpacing="0.2">
        {t.short}
      </text>
    </svg>
  );
}

export function CompBadge({ compId, size = 28 }: { compId: string; size?: number }) {
  const c = compById[compId];
  if (!c) return null;
  const [c1, c2] = c.colors;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg font-display font-extrabold tracking-tight"
      style={{
        width: size,
        height: size,
        fontSize: size * (c.short.length > 2 ? 0.3 : 0.38),
        background: `linear-gradient(140deg, ${c1} 0 58%, ${c2} 58% 100%)`,
        color: '#fff',
        textShadow: '0 1px 2px rgb(0 0 0 / .45)',
        boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / .14)',
      }}
      aria-hidden
    >
      {c.short}
    </span>
  );
}
