import { z } from "zod";
import type { JobPayload } from "@/lib/jobs";

export const supportedJobTypes = ["send-email", "recalculate-analytics"] as const;

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
    z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.null(),
        z.array(jsonValueSchema),
        z.record(z.string(), jsonValueSchema),
    ])
);

export const enqueueJobSchema = z.object({
    type: z.enum(supportedJobTypes, { message: "Unsupported job type" }),
    payload: z
        .record(z.string(), jsonValueSchema)
        .optional()
        .default({}),
    scheduleAt: z
        .string()
        .datetime({ offset: true })
        .optional(),
});
