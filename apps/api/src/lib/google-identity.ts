import { OAuth2Client } from "google-auth-library";
import { InternalError, UnauthorizedError } from "../errors/app.errors.js";

export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
}

export type GoogleTokenVerifier = (idToken: string) => Promise<GoogleIdentity>;

export function getGoogleClientId(): string | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  return clientId ? clientId : null;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new InternalError("Google sign-in is not configured");
  }

  const client = new OAuth2Client(clientId);
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedError("Invalid Google sign-in");
    }

    const profileName = payload.name ?? payload.given_name ?? null;
    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === true,
      name: profileName,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof InternalError) {
      throw error;
    }
    throw new UnauthorizedError("Invalid Google sign-in");
  }
}
