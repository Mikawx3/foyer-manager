import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  householdName: z.string().trim().min(1).max(255),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const googleAuthSchema = z.object({
  idToken: z.string().trim().min(1),
  householdName: z.string().trim().min(1).max(255).optional(),
  confirmExistingAccount: z.boolean().optional(),
});

export const guestStartSchema = z.object({}).strict();

export const signupStartedSchema = z.object({}).strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
