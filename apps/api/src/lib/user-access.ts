import { UnauthorizedError } from "../errors/app.errors.js";
import { isGuestExpired } from "./guest-access.js";
import { parseHouseholdRole } from "./household-role.js";
import {
  householdMemberRepository,
  type HouseholdMemberRepository,
} from "../repositories/household-member.repository.js";
import { userRepository, type UserRepository } from "../repositories/user.repository.js";

export interface AuthMembership {
  householdId: string;
  role: ReturnType<typeof parseHouseholdRole>;
}

export interface AuthContext {
  userId: string;
  isGuest: boolean;
  memberships: AuthMembership[];
}

export async function loadUserAccess(
  userId: string,
  users: UserRepository = userRepository,
  members: HouseholdMemberRepository = householdMemberRepository,
): Promise<AuthContext> {
  const user = await users.findById(userId);
  if (!user) {
    throw new UnauthorizedError("User not found");
  }
  if (user.isGuest && isGuestExpired(user.createdAt)) {
    throw new UnauthorizedError("Guest visit expired");
  }

  const memberships = await members.listByUser(userId);
  return {
    userId: user.id,
    isGuest: user.isGuest,
    memberships: memberships.map((membership) => ({
      householdId: membership.householdId,
      role: parseHouseholdRole(membership.role),
    })),
  };
}
