import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(255),
  householdId: z.string().cuid(),
});

export const listCategoriesQuerySchema = z.object({
  householdId: z.string().cuid(),
});

export const categoryIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
