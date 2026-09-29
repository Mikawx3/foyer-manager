import type { Context } from "hono";
import { ValidationError } from "../errors/app.errors.js";
import { parseOrThrow } from "../lib/validation.js";
import { authService } from "../services/auth.service.js";
import { getAuth } from "../middleware/auth.middleware.js";
import {
  googleAuthSchema,
  guestStartSchema,
  loginSchema,
  registerSchema,
  signupStartedSchema,
} from "../validators/auth.validator.js";

export class AuthController {
  register = async (c: Context) => {
    const body = parseOrThrow(registerSchema, await c.req.json());
    const result = await authService.register(body);
    return c.json(result, 201);
  };

  login = async (c: Context) => {
    const body = parseOrThrow(loginSchema, await c.req.json());
    const result = await authService.login(body);
    return c.json(result, 200);
  };

  google = async (c: Context) => {
    const body = parseOrThrow(googleAuthSchema, await c.req.json());
    const guestUserId = await authService.resolveGuestCaller(c.req.header("Authorization"));
    const result = await authService.loginWithGoogle(body, guestUserId);
    return c.json(result, result.isNewAccount ? 201 : 200);
  };

  signupStarted = async (c: Context) => {
    const raw = await c.req.text();
    let json: unknown = {};
    if (raw.trim().length > 0) {
      try {
        json = JSON.parse(raw);
      } catch {
        throw new ValidationError("Validation failed");
      }
    }
    parseOrThrow(signupStartedSchema, json);
    authService.recordSignupStarted();
    return c.body(null, 204);
  };

  guestStart = async (c: Context) => {
    const raw = await c.req.text();
    let json: unknown = {};
    if (raw.trim().length > 0) {
      try {
        json = JSON.parse(raw);
      } catch {
        throw new ValidationError("Validation failed");
      }
    }
    parseOrThrow(guestStartSchema, json);
    const result = await authService.startGuest();
    return c.json(result, 201);
  };

  me = async (c: Context) => {
    const auth = getAuth(c);
    const user = await authService.me(auth.userId);
    return c.json(user, 200);
  };
}

export const authController = new AuthController();
