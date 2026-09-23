import type { Context, Next } from "hono";
import { UnauthorizedError } from "../errors/app.errors.js";
import { isLocalDeployment } from "../lib/deployment.js";
import { verifyToken } from "../lib/jwt.js";
import { loadUserAccess, type AuthContext } from "../lib/user-access.js";

export type { AuthContext };

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
  let userId: string;
  try {
    const payload = await verifyToken(token);
    userId = payload.userId;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }

  const access = await loadUserAccess(userId);
  c.set("auth", access);
  await next();
}

export function getAuth(c: Context): AuthContext {
  const auth = c.get("auth");
  if (!auth) {
    throw new UnauthorizedError("Authentication required");
  }
  return auth;
}
