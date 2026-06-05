import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from "@foyer/types";
import bcrypt from "bcryptjs";
import { ConflictError, UnauthorizedError } from "../errors/app.errors.js";
import { signToken } from "../lib/jwt.js";
import { toHouseholdDto } from "../lib/mappers.js";
import { householdRepository } from "../repositories/household.repository.js";
import { userRepository, type UserRepository } from "../repositories/user.repository.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validator.js";

const BCRYPT_ROUNDS = 10;

export class AuthService {
  constructor(
    private readonly users: UserRepository = userRepository,
  ) {}

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

    const token = await signToken({ userId: user.id, householdId });
    return { token, householdId };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = await signToken({ userId: user.id, householdId: user.householdId });
    return { token, householdId: user.householdId };
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    const household = await householdRepository.findById(user.householdId);
    if (!household) {
      throw new UnauthorizedError("Household not found");
    }

    return {
      userId: user.id,
      email: user.email,
      householdId: user.householdId,
      household: toHouseholdDto(household),
    };
  }
}

export const authService = new AuthService();

export type { RegisterPayload, LoginPayload };
