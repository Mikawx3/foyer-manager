import { afterEach, describe, expect, it } from "vitest";
import { getDeploymentMode, isCloudDeployment, isLocalDeployment } from "./deployment.js";

describe("deployment", () => {
  afterEach(() => {
    delete process.env.DEPLOYMENT_MODE;
  });

  it("defaults to local mode", () => {
    expect(getDeploymentMode()).toBe("local");
    expect(isLocalDeployment()).toBe(true);
    expect(isCloudDeployment()).toBe(false);
  });

  it("supports cloud mode", () => {
    process.env.DEPLOYMENT_MODE = "cloud";
    expect(getDeploymentMode()).toBe("cloud");
    expect(isCloudDeployment()).toBe(true);
  });
});
