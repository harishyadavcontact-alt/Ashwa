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

interface Loan {
  id: string;
  driverId: string;
  principal: number; // ₹ requested
  downPayment: number; // ₹ paid upfront
  monthlyPayment: number; // ₹ monthly EMI
  status: 'APPLIED' | 'APPROVED' | 'ACTIVE' | 'PAID_OFF' | 'REJECTED';
  autoDeduct: boolean; // auto-deduct from earnings?
  paidAmount: number; // ₹ paid so far
  approvedAt?: Date;
  nextPaymentDue?: Date;
  createdAt: Date;
}

interface Job {
  id: string;
  ownerId: string;
  routeId: string;
  routeName: string;
  monthlyPayment: number;
  startDate: Date;
  status: 'open' | 'filled' | 'archived';
  createdAt: Date;
}

interface JobAssignment {
  id: string;
  jobId: string;
  driverId: string;
  monthlyPayment: number;
  status: 'active' | 'completed';
  startDate: Date;
  lastPaidDate?: Date;
  createdAt: Date;
}

interface PayrollRecord {
  id: string;
  assignmentId: string;
  driverId: string;
  amount: number;
  paidDate: Date;
  month: string; // YYYY-MM
}

interface Call {
  id: string;
  fromPhone: string; // caller
  toPhone: string; // recipient
  fromRole: 'driver' | 'parent'; // who initiated
  status: 'initiated' | 'ringing' | 'connected' | 'ended' | 'missed' | 'declined';
  reason?: string; // 'SOS' | 'normal'
  initiatedAt: Date;
  answeredAt?: Date;
  endedAt?: Date;
  durationSeconds?: number;
}

interface AttendanceRecord {
  id: string;
  driverId: string;
  date: string; // YYYY-MM-DD
  attended: boolean;
  tripsCompleted: number;
  onTimePercentage: number;
  missedStops: number;
  parentComplaints: number;
  createdAt: Date;
}

interface LeaderboardEntry {
  driverId: string;
  name: string;
  familiesServed: number;
  tripsCompleted: number;
  attendancePercentage: number;
  referralsSent: number;
  totalEarnings: number;
  rating: number; // 1-5 stars
  rank: number;
}

interface Notification {
  id: string;
  childId: string;
  parentPhone: string;
  childName: string;
  schoolName?: string;
  eventType: string;
  eventLabel: string;
  sentAt: Date;
  readAt?: Date;
}

interface Service {
  id: string;
  childId: string;
  type: 'school' | 'dance' | 'tuition' | 'sports' | 'medical' | 'custom';
  location: string;
  schedule: string; // e.g., "Mon, Wed, Fri 5:30pm"
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'daily';
  baseRate: number; // ₹ per trip
  active: boolean;
  createdAt: Date;
}

interface DriverService {
  id: string;
  driverId: string;
  serviceType: 'dance' | 'tuition' | 'sports' | 'medical' | 'custom';
  description: string;
  baseRate: number; // ₹ per trip
  areasServiced: string[]; // location names
  active: boolean;
  createdAt: Date;
}

interface DriverProfile {
  driverId: string;
  name: string;
  phone: string;
  routes: string[]; // school names
  rating: number; // 1-5 stars
  familiesServed: number;
  reviews: { parentName: string; text: string; rating: number; createdAt: Date }[];
  location: { lat: number; lng: number };
  costPerFamily: number; // ₹ per month
  createdAt: Date;
}

interface SeatRequest {
  id: string;
  parentPhone: string;
  driverId: string;
  childName: string;
  school: string;
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: Date;
  respondedAt?: Date;
}

interface Event {
  id: string;
  userId: string;
  userType: 'parent' | 'driver' | 'owner';
  event: 'invite_sent' | 'invite_opened' | 'signup_complete' | 'child_setup' | 'linked' | 'first_trip' | 'alert_received' | 'share_sent' | 'referral_claimed' | 'trip_completed' | 'loan_applied' | 'job_hired';
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface Story {
  id: string;
  authorId: string;
  authorPhone: string;
  authorRole: 'driver' | 'parent';
  title: string;
  content: string;
  photoUrl?: string;
  metrics?: {
    familiesServed?: number;
    tripsCompleted?: number;
    earningsMonth?: number;
    timeSaved?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date;
  createdAt: Date;
}

interface Call {
  id: string;
  fromPhone: string;
  toPhone: string;
  fromRole: 'driver' | 'parent';
  toRole: 'driver' | 'parent';
  initiatedAt: Date;
  answeredAt?: Date;
  endedAt?: Date;
  durationSeconds?: number;
  status: 'initiated' | 'ringing' | 'active' | 'ended' | 'missed';
}

interface SharedRide {
  id: string;
  driverId: string;
  pickups: { lat: number; lng: number; parentPhone: string; childName: string; address?: string; pickupTime?: Date }[];
  drops: { lat: number; lng: number; school: string; dropTime?: Date }[];
  baseCost: number; // ₹ total cost
  costPerFamily: number; // ₹ cost / number of families
  families: string[]; // parentPhones
  status: 'available' | 'in_progress' | 'completed';
  createdAt: Date;
}

class DummyStore {
  private invites: Map<string, Invite> = new Map();
  private parents: Map<string, Parent> = new Map();
  private referrals: Map<string, Referral> = new Map();
  private trips: Map<string, Trip> = new Map();
  private jobs: Map<string, Job> = new Map();
  private assignments: Map<string, JobAssignment> = new Map();
  private payroll: Map<string, PayrollRecord> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private loans: Map<string, Loan> = new Map();
  private sharedRides: Map<string, SharedRide> = new Map();
  private services: Map<string, Service> = new Map();
  private driverServices: Map<string, DriverService> = new Map();
  private stories: Map<string, Story> = new Map();
  private calls: Map<string, Call> = new Map();
  private attendanceRecords: Map<string, AttendanceRecord> = new Map();
  private events: Event[] = [];

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

  // ===== JOBS & HIRING =====
  createJob(
    ownerId: string,
    routeId: string,
    routeName: string,
    monthlyPayment: number,
    startDate: Date,
  ): Job {
    const jobId = `JOB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const job: Job = {
      id: jobId,
      ownerId,
      routeId,
      routeName,
      monthlyPayment,
      startDate,
      status: 'open',
      createdAt: new Date(),
    };
    // TODO: Later, insert into jobs table
    this.jobs.set(jobId, job);
    return job;
  }

  getJobsForOwner(ownerId: string): Job[] {
    return Array.from(this.jobs.values()).filter((j) => j.ownerId === ownerId);
  }

  hireDriver(jobId: string, driverId: string): JobAssignment {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');

    const assignmentId = `ASSIGN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const assignment: JobAssignment = {
      id: assignmentId,
      jobId,
      driverId,
      monthlyPayment: job.monthlyPayment,
      status: 'active',
      startDate: job.startDate,
      createdAt: new Date(),
    };

    // TODO: Later, insert into job_assignments table
    this.assignments.set(assignmentId, assignment);
    job.status = 'filled';

    return assignment;
  }

  getAssignmentsForDriver(driverId: string): JobAssignment[] {
    return Array.from(this.assignments.values()).filter((a) => a.driverId === driverId && a.status === 'active');
  }

  getAssignmentsForOwner(ownerId: string): JobAssignment[] {
    const ownerJobs = this.getJobsForOwner(ownerId);
    const jobIds = new Set(ownerJobs.map((j) => j.id));
    return Array.from(this.assignments.values()).filter((a) => jobIds.has(a.jobId));
  }

  // ===== PAYROLL =====
  processPayroll(assignmentId: string, amount: number): PayrollRecord {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    const month = new Date().toISOString().substring(0, 7); // YYYY-MM
    const recordId = `PAY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const record: PayrollRecord = {
      id: recordId,
      assignmentId,
      driverId: assignment.driverId,
      amount,
      paidDate: new Date(),
      month,
    };

    // TODO: Later, insert into payroll_records table
    this.payroll.set(recordId, record);
    assignment.lastPaidDate = new Date();

    return record;
  }

  getPayrollForOwner(ownerId: string): { assignments: JobAssignment[]; payroll: PayrollRecord[] } {
    const assignments = this.getAssignmentsForOwner(ownerId);
    const assignmentIds = new Set(assignments.map((a) => a.id));
    const payroll = Array.from(this.payroll.values()).filter((p) => assignmentIds.has(p.assignmentId));

    return { assignments, payroll };
  }

  getEarningsForDriver(driverId: string): { monthlyJobPayment: number; thisMonthEarned: number } {
    const assignments = this.getAssignmentsForDriver(driverId);
    const monthlyJobPayment = assignments.reduce((sum, a) => sum + a.monthlyPayment, 0);

    const currentMonth = new Date().toISOString().substring(0, 7);
    const thisMonthPayroll = Array.from(this.payroll.values()).filter(
      (p) => p.driverId === driverId && p.month === currentMonth,
    );
    const thisMonthEarned = thisMonthPayroll.reduce((sum, p) => sum + p.amount, 0);

    return { monthlyJobPayment, thisMonthEarned };
  }

  // ===== LOANS =====
  applyForLoan(driverId: string, principal: number, downPayment: number): Loan {
    const loanId = `LOAN-${Date.now()}`;
    const monthlyPayment = Math.ceil((principal - downPayment) / 36); // 36-month EMI

    // TODO: Later, replace with Supabase insert; add underwriting logic
    const loan: Loan = {
      id: loanId,
      driverId,
      principal,
      downPayment,
      monthlyPayment,
      status: 'APPROVED', // Auto-approve for demo
      autoDeduct: true,
      paidAmount: downPayment,
      approvedAt: new Date(),
      nextPaymentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdAt: new Date(),
    };

    this.loans.set(loanId, loan);
    return loan;
  }

  getLoanForDriver(driverId: string): Loan | null {
    // TODO: Later, query Supabase for active loan
    return Array.from(this.loans.values()).find(
      (l) => l.driverId === driverId && (l.status === 'ACTIVE' || l.status === 'APPROVED')
    ) || null;
  }

  toggleAutoDeduct(loanId: string, autoDeduct: boolean): Loan | null {
    const loan = this.loans.get(loanId);
    if (!loan) return null;

    // TODO: Later, update Supabase
    loan.autoDeduct = autoDeduct;
    return loan;
  }

  getLoanSchedule(loanId: string): { month: number; due: number; totalDue: number }[] {
    const loan = this.loans.get(loanId);
    if (!loan) return [];

    const schedule = [];
    let remainingBalance = loan.principal - loan.downPayment;
    const totalMonths = 36;

    for (let month = 1; month <= totalMonths; month++) {
      const monthlyDue = Math.min(loan.monthlyPayment, remainingBalance);
      remainingBalance -= monthlyDue;
      schedule.push({
        month,
        due: monthlyDue,
        totalDue: loan.principal - remainingBalance,
      });
    }

    return schedule;
  }

  deductFromLoan(loanId: string, amount: number): Loan | null {
    const loan = this.loans.get(loanId);
    if (!loan) return null;

    // TODO: Later, update Supabase
    loan.paidAmount += amount;

    const totalRemaining = loan.principal - loan.paidAmount;
    if (totalRemaining <= 0) {
      loan.status = 'PAID_OFF';
    }

    // Move next payment date
    loan.nextPaymentDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return loan;
  }

  // ===== MULTI-SERVICE TRIPS =====
  addService(
    childId: string,
    type: Service['type'],
    location: string,
    schedule: string,
    frequency: Service['frequency'],
  ): Service {
    const serviceId = `SVC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const baseRates: Record<Service['type'], number> = {
      school: 30,
      dance: 50,
      tuition: 40,
      sports: 45,
      medical: 60,
      custom: 50,
    };

    const service: Service = {
      id: serviceId,
      childId,
      type,
      location,
      schedule,
      frequency,
      baseRate: baseRates[type],
      active: true,
      createdAt: new Date(),
    };

    // TODO: Later, insert into services table
    this.services.set(serviceId, service);
    return service;
  }

  getServicesForChild(childId: string): Service[] {
    return Array.from(this.services.values()).filter((s) => s.childId === childId && s.active);
  }

  addDriverService(driverId: string, serviceType: string, description: string, areasServiced: string[]): DriverService {
    const driverServiceId = `DSVC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const baseRates: Record<string, number> = {
      dance: 50,
      tuition: 40,
      sports: 45,
      medical: 60,
      custom: 50,
    };

    const driverService: DriverService = {
      id: driverServiceId,
      driverId,
      serviceType: (serviceType as any) || 'custom',
      description,
      baseRate: baseRates[serviceType] || 50,
      areasServiced,
      active: true,
      createdAt: new Date(),
    };

    // TODO: Later, insert into driver_services table
    this.driverServices.set(driverServiceId, driverService);
    return driverService;
  }

  getDriverServices(driverId: string): DriverService[] {
    return Array.from(this.driverServices.values()).filter((ds) => ds.driverId === driverId && ds.active);
  }

  getAvailableServices(serviceType: string, location: string): DriverService[] {
    return Array.from(this.driverServices.values()).filter(
      (ds) => ds.serviceType === serviceType && ds.areasServiced.includes(location) && ds.active,
    );
  }

  // ===== NOTIFICATIONS =====
  sendNotification(
    childId: string,
    parentPhone: string,
    childName: string,
    eventType: string,
    eventLabel: string,
    schoolName?: string,
  ): Notification {
    const id = `NOTIF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const notification: Notification = {
      id,
      childId,
      parentPhone,
      childName,
      schoolName,
      eventType,
      eventLabel,
      sentAt: new Date(),
    };

    // TODO: Later, insert into notifications table
    this.notifications.set(id, notification);
    return notification;
  }

  getNotificationsForChild(childId: string): Notification[] {
    return Array.from(this.notifications.values())
      .filter((n) => n.childId === childId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  getNotificationsForParent(parentPhone: string): Notification[] {
    return Array.from(this.notifications.values())
      .filter((n) => n.parentPhone === parentPhone)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  markNotificationRead(notificationId: string): Notification | null {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.readAt = new Date();
    }
    return notification || null;
  }

  verifyChildNotificationDelivery(tripId: string, eventType: string): { childId: string; parentPhone: string; notified: boolean }[] {
    // For testing: return all children who should have been notified for this event
    // TODO: Later, query actual notification_delivery table from Supabase
    return Array.from(this.notifications.values())
      .filter((n) => n.eventType === eventType)
      .map((n) => ({
        childId: n.childId,
        parentPhone: n.parentPhone,
        notified: !!n.sentAt,
      }));
  }

  // ===== DISCOVERY & MATCHING =====
  private driverProfiles: Map<string, DriverProfile> = new Map();
  private seatRequests: Map<string, SeatRequest> = new Map();

  // Pre-populate with sample drivers for testing
  initializeSampleDrivers(): void {
    const sampleSchools = ['Delhi Public School', 'St Columba High School', 'Sunbeam School', 'Aravali School', 'Doon International'];
    const sampleDrivers = [
      { name: 'Rajesh Kumar', costPerFamily: 2000 },
      { name: 'Priya Sharma', costPerFamily: 1800 },
      { name: 'Ahmed Hassan', costPerFamily: 2200 },
      { name: 'Vikram Singh', costPerFamily: 1900 },
      { name: 'Neha Gupta', costPerFamily: 2100 },
      { name: 'Rohan Patel', costPerFamily: 1950 },
      { name: 'Sanjana Das', costPerFamily: 2050 },
      { name: 'Arjun Reddy', costPerFamily: 1850 },
      { name: 'Sneha Nair', costPerFamily: 2150 },
      { name: 'Karun Verma', costPerFamily: 2000 },
    ];

    sampleDrivers.forEach((driver, idx) => {
      const driverId = `DRV-${(idx + 1).toString().padStart(3, '0')}`;
      const profile: DriverProfile = {
        driverId,
        name: driver.name,
        phone: `+91-${Math.random().toString().substring(2, 12)}`,
        routes: sampleSchools.slice(Math.floor(Math.random() * sampleSchools.length), 3),
        rating: 4 + Math.random() * 0.9,
        familiesServed: 5 + Math.floor(Math.random() * 15),
        reviews: [
          {
            parentName: 'Parent A',
            text: 'Very reliable and punctual!',
            rating: 5,
            createdAt: new Date(),
          },
        ],
        location: {
          lat: 28.5355 + Math.random() * 0.1,
          lng: 77.391 + Math.random() * 0.1,
        },
        costPerFamily: driver.costPerFamily,
        createdAt: new Date(),
      };
      this.driverProfiles.set(driverId, profile);
    });
  }

  searchDrivers(school: string, pickupLat: number, pickupLng: number, distanceKm: number = 2): DriverProfile[] {
    // TODO: Later, replace with Supabase geospatial query
    const results = Array.from(this.driverProfiles.values()).filter((profile) => {
      // Check if driver has route to this school
      const hasRoute = profile.routes.some((r) => r.toLowerCase().includes(school.toLowerCase()));
      if (!hasRoute) return false;

      // Check distance (simplified Haversine)
      const dLat = profile.location.lat - pickupLat;
      const dLng = profile.location.lng - pickupLng;
      const distSq = dLat * dLat + dLng * dLng;
      const approxDistKm = Math.sqrt(distSq) * 111; // rough km conversion

      return approxDistKm <= distanceKm;
    });

    return results.sort((a, b) => b.rating - a.rating);
  }

  getDriverProfile(driverId: string): DriverProfile | null {
    return this.driverProfiles.get(driverId) || null;
  }

  sendSeatRequest(
    parentPhone: string,
    driverId: string,
    childName: string,
    school: string,
    pickupLat: number,
    pickupLng: number,
    dropLat: number,
    dropLng: number,
  ): SeatRequest {
    const requestId = `REQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const request: SeatRequest = {
      id: requestId,
      parentPhone,
      driverId,
      childName,
      school,
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      status: 'pending',
      requestedAt: new Date(),
    };

    // TODO: Later, insert into seat_requests table
    this.seatRequests.set(requestId, request);
    return request;
  }

  getRequestsForDriver(driverId: string): SeatRequest[] {
    return Array.from(this.seatRequests.values()).filter((r) => r.driverId === driverId && r.status === 'pending');
  }

  acceptSeatRequest(requestId: string): SeatRequest | null {
    const request = this.seatRequests.get(requestId);
    if (!request) return null;

    request.status = 'accepted';
    request.respondedAt = new Date();

    // TODO: Later, auto-link parent to driver in Supabase
    // Create parent record linked to this driver
    if (!this.parents.has(request.parentPhone)) {
      const parent: Parent = {
        phone: request.parentPhone,
        name: `Parent of ${request.childName}`,
        childName: request.childName,
        school: request.school,
        pickupLat: request.pickupLat,
        pickupLng: request.pickupLng,
        dropLat: request.dropLat,
        dropLng: request.dropLng,
        driverId: request.driverId,
        referralCode: `PARENT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        createdAt: new Date(),
      };
      this.parents.set(request.parentPhone, parent);
    }

    return request;
  }

  rejectSeatRequest(requestId: string): SeatRequest | null {
    const request = this.seatRequests.get(requestId);
    if (!request) return null;

    request.status = 'rejected';
    request.respondedAt = new Date();

    // TODO: Later, update in Supabase
    return request;
  }
}

export const dummyStore = new DummyStore();
export type { Invite, Parent, Referral, Trip, Job, JobAssignment, PayrollRecord, Notification, Loan, Service, DriverService };
