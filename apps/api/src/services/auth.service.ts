import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from "@foyer/types";
import bcrypt from "bcryptjs";
import { ConflictError, UnauthorizedError, ValidationError } from "../errors/app.errors.js";
import { verifyGoogleIdToken, type GoogleTokenVerifier } from "../lib/google-identity.js";
import { GUEST_TOKEN_EXPIRES_IN, isGuestExpired } from "../lib/guest-access.js";
import { signToken, verifyToken } from "../lib/jwt.js";
import { logProductEvent } from "../lib/product-event.js";
import { toHouseholdDto } from "../lib/mappers.js";
import {
  householdMemberRepository,
  type HouseholdMemberRepository,
} from "../repositories/household-member.repository.js";
import { householdRepository } from "../repositories/household.repository.js";
import { userRepository, type UserRepository } from "../repositories/user.repository.js";
import { parseHouseholdRole } from "../lib/household-role.js";
import type { GoogleAuthInput, LoginInput, RegisterInput } from "../validators/auth.validator.js";

const BCRYPT_ROUNDS = 10;

function resolveHouseholdName(
  requested: string | undefined,
  profileName: string | null,
  email: string,
): string {
  const fromRequest = requested?.trim();
  if (fromRequest) {
    return fromRequest;
  }
  const fromProfile = profileName?.trim();
  if (fromProfile) {
    return fromProfile.slice(0, 255);
  }
  const localPart = email.split("@")[0]?.trim();
  if (localPart) {
    return localPart.slice(0, 255);
  }
  return "My household";
}

export class AuthService {
  constructor(
    private readonly users: UserRepository = userRepository,
    private readonly verifyGoogleToken: GoogleTokenVerifier = verifyGoogleIdToken,
    private readonly members: HouseholdMemberRepository = householdMemberRepository,
  ) {}

  recordSignupStarted(): void {
    logProductEvent({ name: "signup_started" });
  }

  async startGuest(): Promise<AuthResponse> {
    const user = await this.users.createGuest();
    const token = await signToken({ userId: user.id }, GUEST_TOKEN_EXPIRES_IN);
    return { token, householdId: null, isNewAccount: false };
  }

  async resolveGuestCaller(authorization: string | undefined): Promise<string | undefined> {
    if (!authorization?.startsWith("Bearer ")) {
      return undefined;
    }
    try {
      const { userId } = await verifyToken(authorization.slice("Bearer ".length));
      const user = await this.users.findById(userId);
      if (!user?.isGuest || isGuestExpired(user.lastSeenAt)) {
        return undefined;
      }
      return user.id;
    } catch {
      return undefined;
    }
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const { user, householdId } = await this.users.createWithHousehold({
      email: input.email,
      passwordHash,
      householdName: input.householdName,
    });

    logProductEvent({ name: "account_created", method: "email" });
    return this.issueSession(user.id, householdId, true);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.users.findByEmail(input.email);
    if (!user?.password) {
      throw new UnauthorizedError(
        user && !user.isGuest ? "Sign in with Google for this account" : "Invalid email or password",
      );
    }

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const householdId = await this.resolveSessionHouseholdId(user.id);
    return this.issueSession(user.id, householdId, false);
  }

  async loginWithGoogle(input: GoogleAuthInput, guestUserId?: string): Promise<AuthResponse> {
    const identity = await this.verifyGoogleToken(input.idToken);
    if (!identity.emailVerified) {
      throw new UnauthorizedError("Google email is not verified");
    }

    const email = identity.email.trim().toLowerCase();
    if (guestUserId) {
      return this.claimGuestWithGoogle(
        guestUserId,
        identity.sub,
        email,
        input.confirmExistingAccount === true,
      );
    }

    const linked = await this.users.findByGoogleSub(identity.sub);
    if (linked) {
      const householdId = await this.resolveSessionHouseholdId(linked.id);
      return this.issueSession(linked.id, householdId, false);
    }

    const existing = await this.users.findByEmail(email);
    if (existing) {
      if (existing.googleSub && existing.googleSub !== identity.sub) {
        throw new ConflictError("This email is already linked to another Google account");
      }
      const user = existing.googleSub
        ? existing
        : await this.users.linkGoogleSub(existing.id, identity.sub);
      const householdId = await this.resolveSessionHouseholdId(user.id);
      return this.issueSession(user.id, householdId, false);
    }

    const householdName = resolveHouseholdName(input.householdName, identity.name, email);
    const { user, householdId } = await this.users.createWithHousehold({
      email,
      passwordHash: null,
      googleSub: identity.sub,
      householdName,
    });
    logProductEvent({ name: "account_created", method: "google" });
    return this.issueSession(user.id, householdId, true);
  }

  private async claimGuestWithGoogle(
    guestUserId: string,
    googleSub: string,
    email: string,
    confirmExistingAccount: boolean,
  ): Promise<AuthResponse> {
    const guest = await this.users.findById(guestUserId);
    if (!guest?.isGuest) {
      throw new ValidationError("Only a guest visit can become an account");
    }
    if (isGuestExpired(guest.lastSeenAt)) {
      throw new ValidationError("Guest visit expired");
    }

    const linked = await this.users.findByGoogleSub(googleSub);
    const byEmail = linked ?? (await this.users.findByEmail(email));
    const other = byEmail && byEmail.id !== guest.id ? byEmail : null;

    if (other) {
      if (other.isGuest) {
        throw new ConflictError("Email already registered");
      }
      if (other.googleSub && other.googleSub !== googleSub) {
        throw new ConflictError("This email is already linked to another Google account");
      }
      if (!confirmExistingAccount) {
        throw new ConflictError("This Google account already exists", { code: "existing_account" });
      }
      await this.users.adoptGuestHousehold(guest.id, other.id, googleSub);
      logProductEvent({ name: "guest_converted" });
      const householdId = await this.resolveSessionHouseholdId(other.id);
      return this.issueSession(other.id, householdId, false);
    }

    await this.users.promoteGuestWithGoogle(guest.id, email, googleSub);
    logProductEvent({ name: "guest_converted" });
    const householdId = await this.resolveSessionHouseholdId(guest.id);
    return this.issueSession(guest.id, householdId, false);
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    const memberships = await this.members.listByUser(userId);
    const summaries = memberships.map((membership) => ({
      householdId: membership.householdId,
      role: parseHouseholdRole(membership.role),
    }));
    const only = summaries.length === 1 ? summaries[0] : undefined;
    const household = only
      ? await householdRepository.findById(only.householdId)
      : null;

    return {
      userId: user.id,
      email: user.email,
      isGuest: user.isGuest,
      householdId: household && only ? only.householdId : null,
      household: household ? toHouseholdDto(household) : null,
      memberships: summaries,
    };
  }

  private async resolveSessionHouseholdId(userId: string): Promise<string | null> {
    const memberships = await this.members.listByUser(userId);
    if (memberships.length !== 1) {
      return null;
    }
    return memberships[0]?.householdId ?? null;
  }

  private async issueSession(
    userId: string,
    householdId: string | null,
    isNewAccount: boolean,
  ): Promise<AuthResponse> {
    const token = await signToken({ userId });
    return { token, householdId, isNewAccount };
  }
}

export const authService = new AuthService();

export type { RegisterPayload, LoginPayload };
