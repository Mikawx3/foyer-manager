import { z } from "zod";

const splitItemSchema = z.object({
  tenantId: z.string().cuid(),
  percentage: z.number().positive().max(100),
});

export const setDefaultSplitsSchema = z
  .object({
    categoryId: z.string().cuid().nullable(),
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

export const resolveDefaultSplitsQuerySchema = z.object({
  categoryId: z.string().cuid(),
});

export const deleteDefaultSplitsQuerySchema = z.object({
  categoryId: z.string().cuid(),
});

export type SetDefaultSplitsInput = z.infer<typeof setDefaultSplitsSchema>;
