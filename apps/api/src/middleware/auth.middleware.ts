import type { Context, Next } from "hono";
import { UnauthorizedError } from "../errors/app.errors.js";
import { isLocalDeployment } from "../lib/deployment.js";
import { verifyToken, type JwtPayload } from "../lib/jwt.js";

export type AuthContext = JwtPayload;

declare module "hono" {
  interface ContextVariableMap {
    auth: AuthContext;
  }
}

export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  if (isLocalDeployment()) {
    await next();
    return;
  }

  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Authentication required");
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = await verifyToken(token);
    c.set("auth", payload);
    await next();
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

export function getAuth(c: Context): AuthContext {
  const auth = c.get("auth");
  if (!auth) {
    throw new UnauthorizedError("Authentication required");
  }
  return auth;
}
