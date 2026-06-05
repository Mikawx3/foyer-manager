import type { Context } from "hono";
import { getDeploymentMode } from "../lib/deployment.js";

export class ConfigController {
  get = (c: Context) => {
    return c.json({ deploymentMode: getDeploymentMode() }, 200);
  };
}

export const configController = new ConfigController();
