import type { Context } from "hono";
import { UnauthorizedError } from "../errors/app.errors.js";
import { verifyToken } from "../lib/jwt.js";
import { parseOrThrow } from "../lib/validation.js";
import { inviteService, type InviteService } from "../services/invite.service.js";
import {
  acceptInviteSchema,
  inviteTokenParamSchema,
  registerInviteSchema,
} from "../validators/invite.validator.js";

export class InviteController {
  constructor(private readonly service: InviteService = inviteService) {}

  preview = async (c: Context) => {
    const { token } = parseOrThrow(inviteTokenParamSchema, c.req.param());
    const preview = await this.service.preview(token);
    return c.json(preview, 200);
  };

  accept = async (c: Context) => {
    const { token } = parseOrThrow(inviteTokenParamSchema, c.req.param());
    const body = parseOrThrow(acceptInviteSchema, await c.req.json());
    if (body.mode === "guest") {
      const result = await this.service.acceptAsGuest(
        token,
        body.tenantId,
        await optionalUserId(c),
      );
      return c.json(result, 201);
    }

    const header = c.req.header("Authorization");
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication required");
    }
    let userId: string;
    try {
      const payload = await verifyToken(header.slice("Bearer ".length));
      userId = payload.userId;
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }
    const result = await this.service.acceptAsMember(token, userId, body.tenantId);
    return c.json(result, 200);
  };

  register = async (c: Context) => {
    const { token } = parseOrThrow(inviteTokenParamSchema, c.req.param());
    const body = parseOrThrow(registerInviteSchema, await c.req.json());
    const result = await this.service.registerAndJoin(token, body);
    return c.json(result, 201);
  };
}

async function optionalUserId(c: Context): Promise<string | undefined> {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return undefined;
  }
  try {
    const payload = await verifyToken(header.slice("Bearer ".length));
    return payload.userId;
  } catch {
    return undefined;
  }
}

export const inviteController = new InviteController();
