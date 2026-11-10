/** Simple geometric flags for the Football A–Z (drawn as SVG, so they render the same on every OS). */
export function Flag({ code, size = 20 }: { code: string; size?: number }) {
  const w = size;
  const h = Math.round(size * 0.7);
  const id = `flag-${code}`;
  const body = (() => {
    switch (code) {
      case 'ENG':
        return (<><rect width="20" height="14" fill="#fff" /><rect x="8.5" width="3" height="14" fill="#CE1124" /><rect y="5.5" width="20" height="3" fill="#CE1124" /></>);
      case 'SCO':
        return (<><rect width="20" height="14" fill="#005EB8" /><path d="M0 0 20 14M20 0 0 14" stroke="#fff" strokeWidth="2.4" /></>);
      case 'ESP':
        return (<><rect width="20" height="14" fill="#AA151B" /><rect y="3.5" width="20" height="7" fill="#F1BF00" /></>);
      case 'ITA':
        return (<><rect width="20" height="14" fill="#fff" /><rect width="6.67" height="14" fill="#009246" /><rect x="13.33" width="6.67" height="14" fill="#CE2B37" /></>);
      case 'FRA':
        return (<><rect width="20" height="14" fill="#fff" /><rect width="6.67" height="14" fill="#0055A4" /><rect x="13.33" width="6.67" height="14" fill="#EF4135" /></>);
      case 'GER':
        return (<><rect width="20" height="14" fill="#000" /><rect y="4.67" width="20" height="4.67" fill="#DD0000" /><rect y="9.33" width="20" height="4.67" fill="#FFCE00" /></>);
      case 'NED':
        return (<><rect width="20" height="14" fill="#fff" /><rect width="20" height="4.67" fill="#AE1C28" /><rect y="9.33" width="20" height="4.67" fill="#21468B" /></>);
      case 'POR':
        return (<><rect width="20" height="14" fill="#FF0000" /><rect width="8" height="14" fill="#006600" /><circle cx="8" cy="7" r="2.4" fill="#FFCC00" /></>);
      case 'EUR':
        return (
          <>
            <rect width="20" height="14" fill="#003399" />
            {Array.from({ length: 10 }).map((_, i) => {
              const a = (i / 10) * Math.PI * 2;
              return <circle key={i} cx={10 + Math.cos(a) * 4.2} cy={7 + Math.sin(a) * 4.2} r="0.8" fill="#FFCC00" />;
            })}
          </>
        );
      default:
        return <rect width="20" height="14" fill="#264856" />;
    }
  })();
  return (
    <svg width={w} height={h} viewBox="0 0 20 14" aria-hidden className="shrink-0 overflow-hidden rounded-[3px] ring-1 ring-white/15">
      <clipPath id={id}><rect width="20" height="14" rx="2" /></clipPath>
      <g clipPath={`url(#${id})`}>{body}</g>
    </svg>
  );
}
