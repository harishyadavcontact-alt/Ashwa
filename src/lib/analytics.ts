import { store } from '../data';
import type { AnalyticsName } from '../data/types';

// Fire-and-forget. Analytics must never break a screen, so failures are swallowed.
// Props hold counts and enums only: never a child's name, phone or address.
export function track(name: AnalyticsName, props: Record<string, string | number> = {}): void {
  store.track(name, props).catch(() => {});
}
