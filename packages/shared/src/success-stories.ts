import { z } from 'zod';

export const SuccessStoryMetricsSchema = z.object({
  familiesServed: z.number().int().min(0).default(0),
  referralsCount: z.number().int().min(0).default(0),
  hiredDrivers: z.number().int().min(0).default(0),
  monthsToOwner: z.number().int().min(0).default(0),
  monthlyIncome: z.number().min(0).default(0),
});
export type SuccessStoryMetrics = z.infer<typeof SuccessStoryMetricsSchema>;

export const SuccessStorySchema = z.object({
  id: z.string().min(1),
  driverId: z.string().min(1),
  driverName: z.string().min(2),
  driverPhotoUrl: z.string().url().optional(),
  title: z.string().min(5),
  content: z.string().min(20),
  metrics: SuccessStoryMetricsSchema,
  quote: z.string().optional(),
  milestones: z.array(z.object({
    month: z.number().int().min(0),
    title: z.string(),
    description: z.string(),
  })).default([]),
  published: z.boolean().default(false),
  publishedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type SuccessStory = z.infer<typeof SuccessStorySchema>;

export const PublishStorySchema = z.object({
  storyId: z.string().min(1),
});
export type PublishStoryInput = z.infer<typeof PublishStorySchema>;

// Leaderboard types
export const LeaderboardBadgeSchema = z.enum([
  'TOP_PERFORMER',
  'FAMILIES_50',
  'REFERRALS_5',
  'OWNER',
]);
export type LeaderboardBadge = z.infer<typeof LeaderboardBadgeSchema>;

export const MetricTypeSchema = z.enum([
  'FAMILIES_SERVED',
  'EARNINGS',
  'REFERRALS_SENT',
  'RUNS',
]);
export type MetricType = z.infer<typeof MetricTypeSchema>;

export const LeaderboardPeriodSchema = z.enum([
  'WEEK',
  'MONTH',
  'ALL_TIME',
]);
export type LeaderboardPeriod = z.infer<typeof LeaderboardPeriodSchema>;

export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().min(1),
  driverId: z.string().min(1),
  driverName: z.string().min(2),
  driverPhotoUrl: z.string().url().optional(),
  metricValue: z.number().min(0),
  badges: z.array(LeaderboardBadgeSchema).default([]),
  period: LeaderboardPeriodSchema,
  metricType: MetricTypeSchema,
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export type LeaderboardQueryParams = {
  metric: MetricType;
  period: LeaderboardPeriod;
  limit?: number;
};
