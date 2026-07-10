import { z } from "zod";

export const jobSchema = z.object({
  type: z.enum(["analytics-click"]),
  payload: z.record(z.any()),
  scheduleAt: z.string().datetime().optional(),
});

export type JobRequest = z.infer<typeof jobSchema>;
