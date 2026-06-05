import { z } from "zod";

export const settlementHouseholdParamSchema = z.object({
  id: z.string().cuid(),
});

export const settlementParamsSchema = z.object({
  id: z.string().cuid(),
  settlementId: z.string().cuid(),
});

export const createSettlementSchema = z
  .object({
    fromTenantId: z.string().cuid(),
    toTenantId: z.string().cuid(),
    amount: z.number().positive(),
    note: z.string().trim().max(500).optional(),
    date: z.string().datetime().optional(),
  })
  .refine((data) => data.fromTenantId !== data.toTenantId, {
    message: "fromTenantId and toTenantId must differ",
    path: ["toTenantId"],
  });

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
