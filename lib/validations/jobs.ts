import { z } from "zod";

export const supportedJobTypes = ["send-email", "recalculate-analytics"] as const;

export const enqueueJobSchema = z.object({
    type: z.enum(supportedJobTypes),
    payload: z
        .record(z.string(), z.unknown())
        .optional()
        .default({}),
    scheduleAt: z
        .string()
        .datetime({ offset: true })
        .optional(),
});
