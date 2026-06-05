export type DeploymentMode = "local" | "cloud";

export function getDeploymentMode(): DeploymentMode {
  const value = process.env.DEPLOYMENT_MODE?.trim().toLowerCase();
  return value === "local" ? "local" : "cloud";
}

export function isLocalDeployment(): boolean {
  return getDeploymentMode() === "local";
}

export function isCloudDeployment(): boolean {
  return getDeploymentMode() === "cloud";
}
