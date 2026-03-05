import { z } from 'zod';

export const APP_CONSTANTS = {
  ARRIVAL_RADIUS_METERS: Number(process.env.ARRIVAL_RADIUS_METERS ?? 60),
  PING_INTERVAL_SECONDS: Number(process.env.PING_INTERVAL_SECONDS ?? 5),
  TEN_MIN_ETA_SECONDS: Number(process.env.TEN_MIN_ETA_SECONDS ?? 600),
  ASSUMED_SPEED_KMPH: Number(process.env.ASSUMED_SPEED_KMPH ?? 20),
};

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

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['PARENT', 'DRIVER', 'ADMIN']),
  name: z.string().min(2),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
