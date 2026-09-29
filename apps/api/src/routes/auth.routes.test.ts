import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../app.js";
import { authService } from "../services/auth.service.js";

vi.mock("../services/auth.service.js", () => ({
  authService: {
    recordSignupStarted: vi.fn(),
  },
}));

describe("POST /api/auth/signup-started", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs the event and returns no content", async () => {
    const response = await app.request("/api/auth/signup-started", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    expect(response.status).toBe(204);
    expect(authService.recordSignupStarted).toHaveBeenCalledOnce();
  });

  it("rejects a body that carries personal data", async () => {
    const response = await app.request("/api/auth/signup-started", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ada@example.com" }),
    });

    expect(response.status).toBe(400);
    expect(authService.recordSignupStarted).not.toHaveBeenCalled();
  });
});
