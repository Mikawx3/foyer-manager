import { describe, expect, it, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { AuthService } from "./auth.service.js";
import type { HouseholdMemberRepository } from "../repositories/household-member.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { ConflictError, UnauthorizedError } from "../errors/app.errors.js";

vi.mock("../lib/jwt.js", () => ({
  signToken: vi.fn(async () => "mock-jwt-token"),
}));

const userFixture = {
  id: "user-1",
  email: "alice@example.com",
  password: "hashed",
  googleSub: null,
  isGuest: false,
  createdAt: new Date(),
};

describe("AuthService", () => {
  const mockUsers: UserRepository = {
    findByEmail: vi.fn(),
    findByGoogleSub: vi.fn(),
    findById: vi.fn(),
    linkGoogleSub: vi.fn(),
    createWithHousehold: vi.fn(),
    createAccount: vi.fn(),
    createGuest: vi.fn(),
  };

  const mockMembers: HouseholdMemberRepository = {
    listByUser: vi.fn().mockResolvedValue([
      {
        id: "mem-1",
        role: "admin",
        userId: "user-1",
        householdId: "hh-1",
        createdAt: new Date(),
      },
    ]),
    listByHousehold: vi.fn(),
    findByUserAndHousehold: vi.fn(),
    create: vi.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockMembers.listByUser).mockResolvedValue([
      {
        id: "mem-1",
        role: "admin",
        userId: "user-1",
        householdId: "hh-1",
        createdAt: new Date(),
      },
    ]);
    service = new AuthService(mockUsers, undefined, mockMembers);
  });

  it("register hashes password and returns token", async () => {
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null);
    vi.mocked(mockUsers.createWithHousehold).mockResolvedValue({
      user: userFixture,
      householdId: "hh-1",
    });

    const result = await service.register({
      email: "alice@example.com",
      password: "password123",
      householdName: "Our Home",
    });

    expect(result).toEqual({
      token: "mock-jwt-token",
      householdId: "hh-1",
      isNewAccount: true,
    });
    const createCall = vi.mocked(mockUsers.createWithHousehold).mock.calls[0]?.[0];
    expect(createCall?.email).toBe("alice@example.com");
    expect(createCall?.householdName).toBe("Our Home");
    expect(await bcrypt.compare("password123", createCall!.passwordHash)).toBe(true);
  });

  it("register throws ConflictError when email exists", async () => {
    vi.mocked(mockUsers.findByEmail).mockResolvedValue({
      ...userFixture,
      password: "hash",
    });

    await expect(
      service.register({
        email: "alice@example.com",
        password: "password123",
        householdName: "Home",
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("login returns token for valid credentials", async () => {
    const hash = await bcrypt.hash("secret123", 10);
    vi.mocked(mockUsers.findByEmail).mockResolvedValue({
      ...userFixture,
      password: hash,
    });

    const result = await service.login({
      email: "alice@example.com",
      password: "secret123",
    });

    expect(result).toEqual({
      token: "mock-jwt-token",
      householdId: "hh-1",
      isNewAccount: false,
    });
  });

  it("login throws UnauthorizedError for invalid password", async () => {
    const hash = await bcrypt.hash("secret123", 10);
    vi.mocked(mockUsers.findByEmail).mockResolvedValue({
      ...userFixture,
      password: hash,
    });

    await expect(
      service.login({ email: "alice@example.com", password: "wrong" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("login rejects a Google-only account", async () => {
    vi.mocked(mockUsers.findByEmail).mockResolvedValue({
      ...userFixture,
      password: null,
      googleSub: "google-sub",
    });

    await expect(
      service.login({ email: "alice@example.com", password: "secret123" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("loginWithGoogle signs in an existing Google account", async () => {
    const verifyGoogleToken = vi.fn(async () => ({
      sub: "google-sub",
      email: "alice@example.com",
      emailVerified: true,
      name: "Alice",
    }));
    service = new AuthService(mockUsers, verifyGoogleToken, mockMembers);
    vi.mocked(mockUsers.findByGoogleSub).mockResolvedValue({
      ...userFixture,
      password: null,
      googleSub: "google-sub",
    });

    const result = await service.loginWithGoogle({ idToken: "token" });

    expect(result).toEqual({
      token: "mock-jwt-token",
      householdId: "hh-1",
      isNewAccount: false,
    });
    expect(mockUsers.createWithHousehold).not.toHaveBeenCalled();
  });

  it("loginWithGoogle links an existing email account", async () => {
    const verifyGoogleToken = vi.fn(async () => ({
      sub: "google-sub",
      email: "Alice@Example.com",
      emailVerified: true,
      name: "Alice",
    }));
    service = new AuthService(mockUsers, verifyGoogleToken, mockMembers);
    vi.mocked(mockUsers.findByGoogleSub).mockResolvedValue(null);
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(userFixture);
    vi.mocked(mockUsers.linkGoogleSub).mockResolvedValue({
      ...userFixture,
      googleSub: "google-sub",
    });

    const result = await service.loginWithGoogle({ idToken: "token" });

    expect(mockUsers.linkGoogleSub).toHaveBeenCalledWith("user-1", "google-sub");
    expect(mockUsers.findByEmail).toHaveBeenCalledWith("alice@example.com");
    expect(result.isNewAccount).toBe(false);
  });

  it("loginWithGoogle creates a household for a new account", async () => {
    const verifyGoogleToken = vi.fn(async () => ({
      sub: "google-sub",
      email: "alice@example.com",
      emailVerified: true,
      name: "Alice Martin",
    }));
    service = new AuthService(mockUsers, verifyGoogleToken, mockMembers);
    vi.mocked(mockUsers.findByGoogleSub).mockResolvedValue(null);
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null);
    vi.mocked(mockUsers.createWithHousehold).mockResolvedValue({
      user: { ...userFixture, password: null, googleSub: "google-sub" },
      householdId: "hh-1",
    });

    const result = await service.loginWithGoogle({
      idToken: "token",
      householdName: "Our apartment",
    });

    expect(mockUsers.createWithHousehold).toHaveBeenCalledWith({
      email: "alice@example.com",
      passwordHash: null,
      googleSub: "google-sub",
      householdName: "Our apartment",
    });
    expect(result.isNewAccount).toBe(true);
  });

  it("loginWithGoogle uses the Google profile name when no household name is given", async () => {
    const verifyGoogleToken = vi.fn(async () => ({
      sub: "google-sub",
      email: "alice@example.com",
      emailVerified: true,
      name: "Alice Martin",
    }));
    service = new AuthService(mockUsers, verifyGoogleToken, mockMembers);
    vi.mocked(mockUsers.findByGoogleSub).mockResolvedValue(null);
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null);
    vi.mocked(mockUsers.createWithHousehold).mockResolvedValue({
      user: { ...userFixture, password: null, googleSub: "google-sub" },
      householdId: "hh-1",
    });

    await service.loginWithGoogle({ idToken: "token" });

    expect(vi.mocked(mockUsers.createWithHousehold).mock.calls[0]?.[0]?.householdName).toBe(
      "Alice Martin",
    );
  });

  it("loginWithGoogle rejects an unverified Google email", async () => {
    const verifyGoogleToken = vi.fn(async () => ({
      sub: "google-sub",
      email: "alice@example.com",
      emailVerified: false,
      name: null,
    }));
    service = new AuthService(mockUsers, verifyGoogleToken, mockMembers);

    await expect(service.loginWithGoogle({ idToken: "token" })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
