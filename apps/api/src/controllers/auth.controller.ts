import type { Context } from "hono";
import { parseOrThrow } from "../lib/validation.js";
import { authService } from "../services/auth.service.js";
import { getAuth } from "../middleware/auth.middleware.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

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

  me = async (c: Context) => {
    const auth = getAuth(c);
    const user = await authService.me(auth.userId);
    return c.json(user, 200);
  };
}

export const authController = new AuthController();
