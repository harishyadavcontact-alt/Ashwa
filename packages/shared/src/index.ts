import { z } from 'zod';

export const RoleSchema = z.enum(['PARENT', 'DRIVER', 'ADMIN']);
export type Role = z.infer<typeof RoleSchema>;

export const VerificationStatusSchema = z.enum([
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED',
]);

export const TripTypeSchema = z.enum(['MORNING', 'AFTERNOON']);
export type TripType = z.infer<typeof TripTypeSchema>;

export const EventTypeEnum = z.enum([
  'DRIVER_10_MIN_TO_PICKUP',
  'DRIVER_AT_PICKUP',
  'CHILD_BOARDED',
  'DRIVER_AT_SCHOOL',
  'DRIVER_LEFT_SCHOOL',
  'DRIVER_10_MIN_TO_DROP',
  'DRIVER_AT_DROP',
  'CHILD_DROPPED',
]);
export type EventType = z.infer<typeof EventTypeEnum>;

export const APP_CONSTANTS = {
  ARRIVAL_RADIUS_METERS: Number(process.env.ARRIVAL_RADIUS_METERS ?? 60),
  PING_INTERVAL_SECONDS: Number(process.env.PING_INTERVAL_SECONDS ?? 5),
  TEN_MIN_ETA_SECONDS: Number(process.env.TEN_MIN_ETA_SECONDS ?? 600),
  ASSUMED_SPEED_KMPH: Number(process.env.ASSUMED_SPEED_KMPH ?? 20),
} as const;

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: RoleSchema,
  name: z.string().min(2),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const DeviceTokenSchema = z.object({
  token: z.string().min(10),
  platform: z.string().min(2),
});
export type DeviceTokenInput = z.infer<typeof DeviceTokenSchema>;

export const ChildUpsertSchema = z.object({
  name: z.string().min(2),
  institutionId: z.string().min(1),
  pickupAddress: z.string().min(3),
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropAddress: z.string().min(3),
  dropLat: z.number(),
  dropLng: z.number(),
  emergencyPhone: z.string().min(7),
});
export type ChildUpsertInput = z.infer<typeof ChildUpsertSchema>;

export const AssignmentRequestSchema = z.object({
  childId: z.string().min(1),
  driverId: z.string().min(1),
  startDate: z.coerce.date(),
});
export type AssignmentRequestInput = z.infer<typeof AssignmentRequestSchema>;

export const DriverOnboardSchema = z.object({
  name: z.string().min(2).optional(),
  photoUrl: z.string().url().optional(),
  licenseDocUrl: z.string().optional(),
  vehicleRegDocUrl: z.string().optional(),
  idProofUrl: z.string().optional(),
  vehiclePhotoUrl: z.string().optional(),
});
export type DriverOnboardInput = z.infer<typeof DriverOnboardSchema>;

export const DriverProfileSchema = z.object({
  name: z.string().min(2).optional(),
  photoUrl: z.string().url().optional(),
  serviceArea: z.string().min(2).optional(),
  baseLat: z.number().optional(),
  baseLng: z.number().optional(),
});
export type DriverProfileInput = z.infer<typeof DriverProfileSchema>;

export const VehicleSchema = z.object({
  makeModel: z.string().min(2),
  plateNumber: z.string().optional(),
  seatsCapacity: z.number().int().min(1),
  color: z.string().optional(),
});
export type VehicleInput = z.infer<typeof VehicleSchema>;

export const DriverServiceInfoSchema = z.object({
  institutionIds: z.array(z.string()).default([]),
  vehicle: VehicleSchema.optional(),
  serviceArea: z.string().min(2).optional(),
  baseLat: z.number().optional(),
  baseLng: z.number().optional(),
});
export type DriverServiceInfoInput = z.infer<typeof DriverServiceInfoSchema>;

export const DriverSearchQuerySchema = z.object({
  institutionId: z.string().optional(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radius: z.coerce.number().positive().default(10000),
});
export type DriverSearchQuery = z.infer<typeof DriverSearchQuerySchema>;

export const TripStartSchema = z.object({
  tripType: TripTypeSchema,
});
export type TripStartInput = z.infer<typeof TripStartSchema>;

export const TripEventSchema = z.object({
  childId: z.string().min(1),
  eventType: EventTypeEnum,
  metadata: z.record(z.any()).optional(),
});
export type TripEventInput = z.infer<typeof TripEventSchema>;

export const TrackingPingSchema = z.object({
  tripId: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
});
export type TrackingPingInput = z.infer<typeof TrackingPingSchema>;

export const TrackingSubscribeSchema = z.object({
  tripId: z.string().optional(),
  driverId: z.string().optional(),
}).refine((value) => value.tripId || value.driverId, {
  message: 'tripId or driverId is required',
});
export type TrackingSubscribeInput = z.infer<typeof TrackingSubscribeSchema>;

export const RuntimeEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  STORAGE_PATH: z.string().min(1).default('./storage'),
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(3000),
  ARRIVAL_RADIUS_METERS: z.coerce.number().default(60),
  PING_INTERVAL_SECONDS: z.coerce.number().default(5),
  TEN_MIN_ETA_SECONDS: z.coerce.number().default(600),
  ASSUMED_SPEED_KMPH: z.coerce.number().default(20),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  FCM_SERVICE_ACCOUNT_JSON: z.string().optional(),
});
export type RuntimeEnv = z.infer<typeof RuntimeEnvSchema>;

export type AuthUser = {
  userId: string;
  role: Role;
  email: string;
};

export type ApiResult<T> = {
  data: T;
};

export type DriverTrustSummary = {
  verificationStatus: z.infer<typeof VerificationStatusSchema>;
  isDocumentationComplete: boolean;
  isServiceConfigured: boolean;
  isServiceReady: boolean;
  isParentVisible: boolean;
  missingItems: string[];
  nextAdminAction: string;
};

export type DriverServiceSummary = {
  id: string;
  name: string;
  email: string;
  verificationStatus: z.infer<typeof VerificationStatusSchema>;
  serviceArea: string | null;
  trust: DriverTrustSummary;
  vehicle: {
    makeModel: string | null;
    plateNumber: string | null;
    seatsCapacity: number | null;
    color: string | null;
  } | null;
  institutions: Array<{
    id: string;
    name: string;
    type: string;
  }>;
};

export type ChildSummary = {
  id: string;
  name: string;
  institutionId: string;
  institutionName: string | null;
  pickupAddress: string;
  dropAddress: string;
};

export type AssignmentSummary = {
  id: string;
  status: string;
  startDate: string;
  child: ChildSummary;
  driver: DriverServiceSummary | null;
};

export type CurrentAssignmentState = {
  role: 'PARENT' | 'DRIVER';
  primary: AssignmentSummary | null;
  items: AssignmentSummary[];
};

export type TripLocationSummary = {
  lat: number;
  lng: number;
  timestamp: string;
} | null;

export type TripStopSummary = {
  id: string;
  stopType: string;
  childId: string | null;
  childName: string | null;
  address: string;
  lat: number;
  lng: number;
  sequenceIndex: number;
};

export type TimelineEventSummary = {
  id: string;
  childId: string;
  childName: string;
  eventType: EventType;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type TripNextActionSummary = {
  label: string;
  childId: string | null;
  allowedEvents: EventType[];
};

export type CurrentTripState = {
  trip: {
    id: string;
    tripType: TripType;
    status: string;
    startedAt: string;
    endedAt: string | null;
  } | null;
  latestLocation: TripLocationSummary;
  nextStop: TripStopSummary | null;
  nextAction: TripNextActionSummary | null;
  stops: TripStopSummary[];
  manifest: ChildSummary[];
  timeline: TimelineEventSummary[];
};

// Hiring System Types
export const JobStatusSchema = z.enum(['OPEN', 'HIRED', 'CLOSED']);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const RouteSchema = z.object({
  id: z.string(),
  school: z.string(),
  direction: z.string(),
  time: z.string(),
});
export type Route = z.infer<typeof RouteSchema>;

export type Job = {
  id: string;
  ownerId: string;
  ownerName: string;
  route: Route;
  payPerMonth: number;
  status: JobStatus;
  hiredDriverId?: string;
  hiredDriverName?: string;
  createdAt: string;
  appliedCount: number;
};

export type JobApplication = {
  id: string;
  jobId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  status: 'PENDING' | 'CONTACTED';
  appliedAt: string;
};

export type TeamMember = {
  id: string;
  name: string;
  photoUrl?: string;
  route: Route;
  monthlyPay: number;
  earningsThisMonth: number;
  status: 'ACTIVE' | 'INACTIVE';
  phone?: string;
};

export type PayrollRecord = {
  id: string;
  driverId: string;
  driverName: string;
  month: string;
  amount: number;
  status: 'PENDING' | 'PAID';
  paidAt?: string;
};

export const JobPostSchema = z.object({
  routeId: z.string().min(1),
  payPerMonth: z.number().min(1000),
});
export type JobPostInput = z.infer<typeof JobPostSchema>;

export const JobApplySchema = z.object({
  jobId: z.string().min(1),
});
export type JobApplyInput = z.infer<typeof JobApplySchema>;

// Multi-Service Routing Types
export const ServiceTypeSchema = z.enum(['SCHOOL', 'TUITION', 'DANCE', 'SPORTS', 'OTHER']);
export type ServiceType = z.infer<typeof ServiceTypeSchema>;

export const ServiceStatusSchema = z.enum(['ACTIVE', 'ARCHIVED']);
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;

export const ServiceEnrollmentStatusSchema = z.enum(['ACTIVE', 'PAUSED', 'COMPLETED']);
export type ServiceEnrollmentStatus = z.infer<typeof ServiceEnrollmentStatusSchema>;

export type Service = {
  id: string;
  driverId: string;
  name: string;
  type: ServiceType;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: {
    lat: number;
    lng: number;
  };
  daysOfWeek: number[]; // 0=Sun, 1=Mon, etc
  capacity: number;
  pricePerMonth: number;
  status: ServiceStatus;
  createdAt: string;
};

export type ServiceEnrollment = {
  id: string;
  serviceId: string;
  parentId: string;
  childId: string;
  status: ServiceEnrollmentStatus;
  enrolledAt: string;
};

export const ServiceCreateSchema = z.object({
  name: z.string().min(2),
  type: ServiceTypeSchema,
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
  capacity: z.number().int().min(1),
  pricePerMonth: z.number().min(0),
});
export type ServiceCreateInput = z.infer<typeof ServiceCreateSchema>;

// Referral System Types
export const PaymentStatusSchema = z.enum(['PENDING', 'PAID', 'FAILED']);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export type ReferralSummary = {
  id: string;
  referralCode: string;
  referredParentId: string;
  referredParentName: string;
  status: string;
  createdAt: string;
};

export type ReferralEarnings = {
  id: string;
  referredParentId: string;
  referredParentName: string;
  amount: number;
  month: number;
  year: number;
  status: string;
  createdAt: string;
};

export type ParentReferralStats = {
  referralCode: string;
  totalReferrals: number;
  totalEarnings: number;
  potentialEarnings: number;
  referrals: ReferralSummary[];
  earnedHistory: ReferralEarnings[];
};

export const PaymentRecordSchema = z.object({
  childId: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  amount: z.number().int().min(0),
  status: PaymentStatusSchema,
});
export type PaymentRecordInput = z.infer<typeof PaymentRecordSchema>;

// Emergency Alert Types
export const EmergencyAlertStatusSchema = z.enum(['ACTIVE', 'RESOLVED', 'DISMISSED']);
export type EmergencyAlertStatus = z.infer<typeof EmergencyAlertStatusSchema>;

export type EmergencyAlert = {
  id: string;
  parentId: string;
  childId: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  driverNotified: boolean;
  driverRespondedAt?: Date;
  status: EmergencyAlertStatus;
  childName: string;
};

// Voice Calling Types
export const CallStatusSchema = z.enum(['INITIATED', 'RINGING', 'CONNECTED', 'ENDED', 'FAILED']);
export type CallStatus = z.infer<typeof CallStatusSchema>;

export const CallDirectionSchema = z.enum(['PARENT_TO_DRIVER', 'DRIVER_TO_PARENT']);
export type CallDirection = z.infer<typeof CallDirectionSchema>;

export type CallRecord = {
  id: string;
  callerId: string;
  receiverId: string;
  direction: CallDirection;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  twillioCallSid: string;
  status: CallStatus;
};

// Re-export WhatsApp extras
export {
  sendWhatsAppAlert,
  getDemoLogs,
  clearDemoLogs,
  type WhatsAppAlertPayload,
  sendEmergencyAlert,
  getEmergencyAlerts,
  clearEmergencyAlerts,
  sendSubstituteNotification,
  sendBackupBonusNotification,
  sendRefundNotification,
  getSubstituteNotifications,
  clearSubstituteNotifications,
  type SubstituteDriverNotificationPayload,
  type BackupBonusNotificationPayload,
  type RefundNotificationPayload,
  initiateCall,
  getCallRecords,
  clearCallRecords,
  type CallInitiateParams,
} from './extras';

// Driver Verification Types
export const VerificationDocStatusSchema = z.enum(['APPROVED', 'REJECTED', 'PENDING']);
export type VerificationDocStatus = z.infer<typeof VerificationDocStatusSchema>;

export type DriverVerification = {
  id: string;
  driverId: string;
  licensePhotoUrl?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  insuranceDocUrl?: string;
  policyNumber?: string;
  insuranceExpiry?: string;
  policeCheckDone: boolean;
  status: 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  submittedAt?: string;
};

export const VerificationSubmitSchema = z.object({
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),
  policyNumber: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  policeCheckDone: z.boolean().default(false),
});
export type VerificationSubmitInput = z.infer<typeof VerificationSubmitSchema>;

// Attendance & Invoice Types
export const AttendanceStatusSchema = z.enum(['ATTENDED', 'ABSENT', 'EXCUSED']);
export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>;

export type AttendanceRecord = {
  id: string;
  childId: string;
  parentId: string;
  serviceId: string;
  date: string; // ISO date
  boardedTime?: string; // ISO timestamp
  droppedTime?: string; // ISO timestamp
  status: AttendanceStatus;
  photoUrl?: string;
  notes?: string;
};

export type Invoice = {
  id: string;
  parentId: string;
  serviceId: string;
  month: number; // 1-12
  year: number;
  attendanceDays: number;
  pricePerDay: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  issuedAt: string; // ISO timestamp
  dueDate: string; // ISO date
  paidAt?: string; // ISO timestamp
};

export type MonthlyAttendanceSummary = {
  month: number;
  year: number;
  attendedDays: number;
  absentDays: number;
  excusedDays: number;
  totalDays: number;
  pricePerDay: number;
  totalAmount: number;
  invoice?: Invoice;
};

// Substitute Driver Assignment Types
export const SubstituteReasonSchema = z.enum(['SICK', 'ACCIDENT', 'EMERGENCY', 'OTHER']);
export type SubstituteReason = z.infer<typeof SubstituteReasonSchema>;

export const SubstituteStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']);
export type SubstituteStatus = z.infer<typeof SubstituteStatusSchema>;

export type SubstituteAssignment = {
  id: string;
  originalDriverId: string;
  backupDriverId: string;
  serviceId: string; // The service/route identifier
  date: Date;
  reason: SubstituteReason;
  backupFee: number; // ₹200 bonus for backup
  status: SubstituteStatus;
  parentNotifiedAt?: Date;
  backupNotifiedAt?: Date;
};

export type DriverAvailability = {
  id: string;
  driverId: string;
  date: Date;
  available: boolean;
  reason?: SubstituteReason;
  routesCoveringCount: number;
};

// Re-export Success Stories and Leaderboard types
export {
  SuccessStorySchema,
  SuccessStoryMetricsSchema,
  PublishStorySchema,
  LeaderboardBadgeSchema,
  MetricTypeSchema,
  LeaderboardPeriodSchema,
  LeaderboardEntrySchema,
  type SuccessStory,
  type SuccessStoryMetrics,
  type PublishStoryInput,
  type LeaderboardBadge,
  type MetricType,
  type LeaderboardPeriod,
  type LeaderboardEntry,
  type LeaderboardQueryParams,
} from './success-stories';

// Route Analytics Types
export type RouteAnalytics = {
  id: string;
  driverId: string;
  serviceId: string;
  routeName: string;
  month: number;
  year: number;
  families: number;
  revenue: number;
  fuelCost: number;
  maintenanceCost: number;
  netProfit: number;
  occupancyRate: number;
  averageRating: number;
  growth: number;
  capacitySeats: number;
  bookedSeats: number;
};

export type CostBreakdown = {
  id: string;
  driverId: string;
  month: number;
  year: number;
  fuelCost: number;
  maintenanceCost: number;
  insuranceCost?: number;
  loanPayment?: number;
  otherCosts: number;
};

export type RouteRecommendation = {
  routeName: string;
  recommendation: string;
  action: 'SCALE' | 'OPTIMIZE' | 'DROP' | 'MAINTAIN';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
};

export type EarningsTrendData = {
  month: string;
  revenue: number;
  expenses: number;
  netProfit: number;
};
