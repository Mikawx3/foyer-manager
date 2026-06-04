import { z } from "zod";

const splitItemSchema = z.object({
  tenantId: z.string().cuid(),
  percentage: z.number().positive().max(100),
});

export const assignSplitsSchema = z
  .object({
    splits: z.array(splitItemSchema).min(1),
  })
  .refine(
    (data) => {
      const tenantIds = data.splits.map((split) => split.tenantId);
      return new Set(tenantIds).size === tenantIds.length;
    },
    { message: "Duplicate tenantId in splits" },
  )
  .refine(
    (data) => data.splits.reduce((sum, split) => sum + split.percentage, 0) === 100,
    { message: "Split percentages must sum to exactly 100" },
  );

export type AssignSplitsInput = z.infer<typeof assignSplitsSchema>;
