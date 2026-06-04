import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255),
  householdId: z.string().cuid(),
});

export const tenantIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const listTenantsQuerySchema = z.object({
  householdId: z.string().cuid(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
