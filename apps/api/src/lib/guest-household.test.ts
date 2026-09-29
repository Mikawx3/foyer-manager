import { describe, expect, it } from "vitest";
import { ForbiddenError } from "../errors/app.errors.js";
import { assertGuestMayCreateHousehold } from "./guest-household.js";

describe("assertGuestMayCreateHousehold", () => {
  it("lets a guest with no household create one", () => {
    expect(() => assertGuestMayCreateHousehold(true, 0)).not.toThrow();
  });

  it("refuses a second household for a guest", () => {
    expect(() => assertGuestMayCreateHousehold(true, 1)).toThrow(ForbiddenError);
  });

  it("does not limit an account", () => {
    expect(() => assertGuestMayCreateHousehold(false, 2)).not.toThrow();
  });
});
