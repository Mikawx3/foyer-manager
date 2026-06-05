import { describe, expect, it, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { AuthService } from "./auth.service.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { ConflictError, UnauthorizedError } from "../errors/app.errors.js";

vi.mock("../lib/jwt.js", () => ({
  signToken: vi.fn(async () => "mock-jwt-token"),
}));

describe("AuthService", () => {
  const mockUsers: UserRepository = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    createWithHousehold: vi.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(mockUsers);
  });

  it("register hashes password and returns token", async () => {
    vi.mocked(mockUsers.findByEmail).mockResolvedValue(null);
    vi.mocked(mockUsers.createWithHousehold).mockResolvedValue({
      user: {
        id: "user-1",
        email: "alice@example.com",
        password: "hashed",
        householdId: "hh-1",
        createdAt: new Date(),
      },
      householdId: "hh-1",
    });

    const result = await service.register({
      email: "alice@example.com",
      password: "password123",
      householdName: "Our Home",
    });

    expect(result).toEqual({ token: "mock-jwt-token", householdId: "hh-1" });
    const createCall = vi.mocked(mockUsers.createWithHousehold).mock.calls[0]?.[0];
    expect(createCall?.email).toBe("alice@example.com");
    expect(createCall?.householdName).toBe("Our Home");
    expect(await bcrypt.compare("password123", createCall!.passwordHash)).toBe(true);
  });

  it("register throws ConflictError when email exists", async () => {
    vi.mocked(mockUsers.findByEmail).mockResolvedValue({
      id: "user-1",
      email: "alice@example.com",
      password: "hash",
      householdId: "hh-1",
      createdAt: new Date(),
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
      id: "user-1",
      email: "alice@example.com",
      password: hash,
      householdId: "hh-1",
      createdAt: new Date(),
    });

    const result = await service.login({
      email: "alice@example.com",
      password: "secret123",
    });

    expect(result).toEqual({ token: "mock-jwt-token", householdId: "hh-1" });
  });

  it("login throws UnauthorizedError for invalid password", async () => {
    const hash = await bcrypt.hash("secret123", 10);
    vi.mocked(mockUsers.findByEmail).mockResolvedValue({
      id: "user-1",
      email: "alice@example.com",
      password: hash,
      householdId: "hh-1",
      createdAt: new Date(),
    });

    await expect(
      service.login({ email: "alice@example.com", password: "wrong" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
