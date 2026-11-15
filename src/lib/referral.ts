import { extras } from '../data/extras';

// A referral link carries ?ref=CODE. We keep the code on the device until the new person has a profile,
// then record who referred them. Works even if they sign in later.

const PENDING_KEY = 'ashwa.pendingRef';
const SEEN_KEY = 'ashwa.seenRef';

export function captureReferral(): void {
  const code = new URLSearchParams(window.location.search).get('ref')?.trim().toUpperCase();
  if (!code || !/^[A-Z0-9]{4,12}$/.test(code)) return;
  try {
    localStorage.setItem(PENDING_KEY, code);
    // Count one open per code per device, so refreshes don't inflate the number.
    if (localStorage.getItem(SEEN_KEY) !== code) {
      localStorage.setItem(SEEN_KEY, code);
      extras.trackReferralOpen(code).catch(() => {});
    }
  } catch {
    // Storage blocked: the referral is not kept, which is harmless.
  }
}

export function pendingReferral(): string | null {
  try {
    return localStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
}

// Call once the new person has a profile. Clears the pending code whether or not it counted.
export async function applyPendingReferral(): Promise<void> {
  const code = pendingReferral();
  if (!code) return;
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
  await extras.redeemReferral(code).catch(() => {});
}
