import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../store';
import type { Match } from '../types';

/** Select a sorted list of match ids; only re-renders when the list itself changes. */
export function useShallowIds(pred: (m: Match, now: number) => boolean, sort?: (a: Match, b: Match) => number) {
  return useStore(
    useShallow((s) => {
      const now = Math.floor(s.now / 30000) * 30000;
      const list = s.order.map((id) => s.matches[id]).filter((m) => pred(m, now));
      if (sort) list.sort(sort);
      return list.map((m) => m.id);
    }),
  );
}
