import { afterEach, describe, expect, it } from "vitest";
import { getDeploymentMode, isCloudDeployment, isLocalDeployment } from "./deployment.js";

describe("deployment", () => {
  afterEach(() => {
    delete process.env.DEPLOYMENT_MODE;
  });

  it("defaults to cloud mode", () => {
    expect(getDeploymentMode()).toBe("cloud");
    expect(isCloudDeployment()).toBe(true);
    expect(isLocalDeployment()).toBe(false);
  });

  it("supports local mode", () => {
    process.env.DEPLOYMENT_MODE = "local";
    expect(getDeploymentMode()).toBe("local");
    expect(isLocalDeployment()).toBe(true);
  });
});
