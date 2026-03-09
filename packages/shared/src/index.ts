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
