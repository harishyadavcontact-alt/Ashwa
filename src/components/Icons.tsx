// Minimal line icons. No icon library: keeps the bundle small for low-end phones.
export type IconName = 'map' | 'user' | 'route' | 'people' | 'wallet' | 'run' | 'plus' | 'back';

const PATHS: Record<IconName, string> = {
  map: 'M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Zm0 0v16m6-14v16',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 17h5a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h5',
  people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20a6 6 0 0 1 12 0m0 0a5 5 0 0 1 6 0',
  wallet: 'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 0 12-3v3m5 6h-3',
  run: 'M5 12h12m-4-4 4 4-4 4',
  plus: 'M12 5v14M5 12h14',
  back: 'M15 6l-6 6 6 6',
};

export function SharedIcon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
