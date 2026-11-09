import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Minimal accessible popover: click to toggle, closes on outside click / Escape. */
export function Popover({
  trigger,
  children,
  align = 'right',
  width = 300,
  open: controlled,
  onOpenChange,
  label,
}: {
  trigger: (p: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: 'left' | 'right' | 'center';
  width?: number;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  label: string;
}) {
  const [inner, setInner] = useState(false);
  const open = controlled ?? inner;
  const setOpen = (v: boolean) => (onOpenChange ? onOpenChange(v) : setInner(v));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => {
      document.removeEventListener('mousedown', h);
      document.removeEventListener('keydown', k);
    };
  }); // eslint-disable-line react-hooks/exhaustive-deps
  const pos = align === 'right' ? 'right-0' : align === 'left' ? 'left-0' : 'left-1/2 -translate-x-1/2';
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen(!open) })}
      {open && (
        <div role="dialog" aria-label={label} className={`rise absolute top-[calc(100%+8px)] z-[1500] max-w-[calc(100vw-24px)] rounded-xl border border-line2 bg-s2 shadow-2xl shadow-black/60 ${pos}`} style={{ width }}>
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}
