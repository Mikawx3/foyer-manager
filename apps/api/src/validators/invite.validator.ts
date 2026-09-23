import { z } from "zod";

export const inviteTokenParamSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{32,128}$/),
});

export const acceptInviteSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("guest"),
    tenantId: z.string().cuid(),
  }),
  z.object({
    mode: z.literal("member"),
    tenantId: z.string().cuid(),
  }),
]);

export const registerInviteSchema = z
  .object({
    email: z.string().trim().email().max(255),
    password: z.string().min(8).max(128),
    tenantId: z.string().cuid().optional(),
    name: z.string().trim().min(1).max(80).optional(),
  })
  .refine((data) => Boolean(data.tenantId) !== Boolean(data.name), {
    message: "Choose an existing member or add a new name",
  });

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type RegisterInviteInput = z.infer<typeof registerInviteSchema>;
