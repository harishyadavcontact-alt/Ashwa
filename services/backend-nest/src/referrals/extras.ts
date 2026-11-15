/**
 * Referral system measurement and event tracking
 */

interface ReferralEvent {
  eventType: string;
  parentId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// In-memory event log for development/testing
const referralEventLog: ReferralEvent[] = [];

/**
 * Track a referral-related event
 * In production, this would send events to analytics service (Mixpanel, Amplitude, etc.)
 */
export function trackReferralEvent(
  eventType: string,
  parentId: string,
  metadata?: Record<string, any>,
): void {
  const event: ReferralEvent = {
    eventType,
    parentId,
    timestamp: new Date(),
    metadata,
  };

  referralEventLog.push(event);
  console.log(`[REFERRAL_EVENT] ${eventType}:`, { parentId, metadata, timestamp: event.timestamp });

  // In a real implementation, send to analytics service:
  // await analyticsService.track(eventType, { parentId, ...metadata });
}

/**
 * Track when a referral relationship is established
 */
export function trackReferralRegistered(
  referrerParentId: string,
  referredParentId: string,
  referralCode: string,
): void {
  trackReferralEvent('referral_registered', referrerParentId, {
    referredParentId,
    referralCode,
  });
}

/**
 * Track when a child is linked to a referral code
 */
export function trackChildLinkedToReferral(
  childId: string,
  parentId: string,
  referralCode: string,
): void {
  trackReferralEvent('child_linked_to_referral', parentId, {
    childId,
    referralCode,
  });
}

/**
 * Track when a payment is recorded for a child
 */
export function trackPaymentRecorded(
  childId: string,
  parentId: string,
  month: number,
  year: number,
  status: string,
): void {
  trackReferralEvent('payment_recorded', parentId, {
    childId,
    month,
    year,
    status,
  });
}

/**
 * Track when a referrer earns credit (at 3-month mark)
 */
export function trackReferralEarningsCredited(
  referrerParentId: string,
  referredParentId: string,
  amount: number,
  month: number,
  year: number,
): void {
  trackReferralEvent('referral_earnings_credited', referrerParentId, {
    referredParentId,
    amount,
    month,
    year,
  });
}

/**
 * Get all tracked referral events (for testing/debugging)
 */
export function getReferralEventLog(): ReferralEvent[] {
  return [...referralEventLog];
}

/**
 * Clear event log (for testing)
 */
export function clearReferralEventLog(): void {
  referralEventLog.length = 0;
}

/**
 * Get referral events for a specific parent
 */
export function getParentReferralEvents(parentId: string): ReferralEvent[] {
  return referralEventLog.filter((event) => event.parentId === parentId);
}

/**
 * Get event count by type
 */
export function getReferralEventCountByType(): Record<string, number> {
  const counts: Record<string, number> = {};
  referralEventLog.forEach((event) => {
    counts[event.eventType] = (counts[event.eventType] || 0) + 1;
  });
  return counts;
}

/**
 * Get referral metrics summary
 */
export function getReferralMetricsSummary() {
  const eventCounts = getReferralEventCountByType();
  const totalEvents = referralEventLog.length;
  const uniqueParents = new Set(referralEventLog.map((e) => e.parentId)).size;
  const creditsTracked = referralEventLog.filter((e) => e.eventType === 'referral_earnings_credited').length;
  const totalAmountCredited = referralEventLog
    .filter((e) => e.eventType === 'referral_earnings_credited')
    .reduce((sum, e) => sum + (e.metadata?.amount || 0), 0);

  return {
    totalEvents,
    uniqueParents,
    eventCounts,
    creditsTracked,
    totalAmountCredited,
    averageCreditPerParent: uniqueParents > 0 ? totalAmountCredited / uniqueParents : 0,
  };
}
