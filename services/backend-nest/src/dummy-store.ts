/**
 * Dummy in-memory store for Ashwa features
 * This is a temporary backend to enable end-to-end testing.
 * Replace with Supabase calls when production DB is ready.
 */

interface Invite {
  code: string;
  driverId: string;
  createdAt: Date;
  claimedBy?: string; // parentPhone
}

interface Parent {
  phone: string;
  name: string;
  email?: string;
  childName: string;
  school: string;
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  driverId: string;
  referralCode: string;
  createdAt: Date;
}

interface Referral {
  code: string; // PARENT-ABC456
  sentBy: string; // parentPhone
  sentTo?: string; // parentPhone
  sentAt: Date;
  claimedBy?: string; // parentPhone
  claimedAt?: Date;
  earned: number; // ₹ amount
}

interface Trip {
  id: string;
  driverId: string;
  startedAt?: Date;
  endedAt?: Date;
  stops: {
    school: string;
    lat: number;
    lng: number;
    arrivalTime?: Date;
  }[];
}

class DummyStore {
  private invites: Map<string, Invite> = new Map();
  private parents: Map<string, Parent> = new Map();
  private referrals: Map<string, Referral> = new Map();
  private trips: Map<string, Trip> = new Map();

  // ===== INVITES =====
  createInvite(driverId: string): string {
    const code = `ASHWA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    this.invites.set(code, {
      code,
      driverId,
      createdAt: new Date(),
    });
    return code;
  }

  claimInvite(
    code: string,
    parentPhone: string,
    parentData: Omit<Parent, 'phone' | 'driverId' | 'referralCode' | 'createdAt'>,
  ): Parent | null {
    const invite = this.invites.get(code);
    if (!invite) return null;

    // TODO: Later, replace with Supabase insert
    const referralCode = `PARENT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const parent: Parent = {
      phone: parentPhone,
      driverId: invite.driverId,
      referralCode,
      createdAt: new Date(),
      ...parentData,
    };

    this.parents.set(parentPhone, parent);
    invite.claimedBy = parentPhone;

    return parent;
  }

  // ===== PARENTS =====
  getParent(phone: string): Parent | null {
    return this.parents.get(phone) || null;
  }

  getAllParentsForDriver(driverId: string): Parent[] {
    return Array.from(this.parents.values()).filter((p) => p.driverId === driverId);
  }

  // ===== REFERRALS =====
  addReferral(parentPhone: string): Referral {
    const parent = this.parents.get(parentPhone);
    if (!parent) throw new Error('Parent not found');

    // TODO: Later, replace with Supabase insert
    const referral: Referral = {
      code: parent.referralCode,
      sentBy: parentPhone,
      sentAt: new Date(),
      earned: 0,
    };

    this.referrals.set(parent.referralCode, referral);
    return referral;
  }

  logReferralSend(parentPhone: string, sentToPhone?: string): Referral {
    const parent = this.parents.get(parentPhone);
    if (!parent) throw new Error('Parent not found');

    let referral = this.referrals.get(parent.referralCode);
    if (!referral) {
      referral = {
        code: parent.referralCode,
        sentBy: parentPhone,
        sentAt: new Date(),
        earned: 0,
      };
      this.referrals.set(parent.referralCode, referral);
    }

    if (sentToPhone) {
      referral.sentTo = sentToPhone;
    }

    // TODO: Later, insert into referral_sends table
    return referral;
  }

  claimReferral(code: string, parentPhone: string, parentData: Omit<Parent, 'phone' | 'driverId' | 'referralCode' | 'createdAt'>): { parent: Parent; referrer: Parent | null } {
    const referral = this.referrals.get(code);
    if (!referral) throw new Error('Invalid referral code');

    const referrer = this.parents.get(referral.sentBy);

    // TODO: Later, replace with Supabase insert
    const referringDriver = referrer?.driverId;
    if (!referringDriver) throw new Error('Referrer not found');

    const newParent: Parent = {
      phone: parentPhone,
      driverId: referringDriver,
      referralCode: `PARENT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      createdAt: new Date(),
      ...parentData,
    };

    this.parents.set(parentPhone, newParent);
    referral.claimedBy = parentPhone;
    referral.claimedAt = new Date();
    referral.earned = 200; // ₹200 per referral

    if (referrer) {
      referrer.createdAt; // side effect: update referrer earnings
    }

    return { parent: newParent, referrer };
  }

  getEarnings(parentPhone: string): { totalEarned: number; referrals: Referral[] } {
    const referrals = Array.from(this.referrals.values()).filter((r) => r.sentBy === parentPhone && r.claimedBy);
    const totalEarned = referrals.reduce((sum, r) => sum + r.earned, 0);

    return { totalEarned, referrals };
  }

  getReferralStats(parentPhone: string): { sent: number; claimed: number; earned: number } {
    const referrals = Array.from(this.referrals.values()).filter((r) => r.sentBy === parentPhone);
    const claimed = referrals.filter((r) => r.claimedBy).length;

    return {
      sent: referrals.length,
      claimed,
      earned: referrals.reduce((sum, r) => sum + r.earned, 0),
    };
  }

  // ===== TRIPS =====
  createTrip(id: string, driverId: string, stops: Trip['stops']): Trip {
    const trip: Trip = {
      id,
      driverId,
      stops,
    };

    // TODO: Later, insert into trips table
    this.trips.set(id, trip);
    return trip;
  }

  getTrip(tripId: string): Trip | null {
    return this.trips.get(tripId) || null;
  }

  startTrip(tripId: string): void {
    const trip = this.trips.get(tripId);
    if (trip) trip.startedAt = new Date();
    // TODO: Later, update in Supabase
  }

  recordStopArrival(tripId: string, stopIndex: number): void {
    const trip = this.trips.get(tripId);
    if (trip && trip.stops[stopIndex]) {
      trip.stops[stopIndex].arrivalTime = new Date();
    }
    // TODO: Later, update in Supabase
  }

  endTrip(tripId: string): void {
    const trip = this.trips.get(tripId);
    if (trip) trip.endedAt = new Date();
    // TODO: Later, update in Supabase
  }
}

export const dummyStore = new DummyStore();
export type { Invite, Parent, Referral, Trip };
