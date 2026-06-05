import { z } from "zod";
import { TENANT_COLOR_PRESETS } from "../lib/tenant-colors.js";

const tenantColorSchema = z.enum(TENANT_COLOR_PRESETS);

export const createTenantSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255).optional(),
  color: tenantColorSchema.optional(),
  householdId: z.string().cuid(),
});

export const createNestedTenantSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255).optional(),
  color: tenantColorSchema.optional(),
});

export const tenantIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const listTenantsQuerySchema = z.object({
  householdId: z.string().cuid(),
  includeArchived: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type CreateNestedTenantInput = z.infer<typeof createNestedTenantSchema>;
