import type { Context } from "hono";
import { getDeploymentMode } from "../lib/deployment.js";
import { getGoogleClientId } from "../lib/google-identity.js";

export class ConfigController {
  get = (c: Context) => {
    return c.json(
      {
        deploymentMode: getDeploymentMode(),
        googleClientId: getGoogleClientId(),
      },
      200,
    );
  };
}

export const configController = new ConfigController();
