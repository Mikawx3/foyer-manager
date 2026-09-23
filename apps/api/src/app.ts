import { Hono } from "hono";
import { configController } from "./controllers/config.controller.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authMiddleware } from "./middleware/auth.middleware.js";
import { inviteController } from "./controllers/invite.controller.js";
import { authRoutes } from "./routes/auth.routes.js";
import { categoryRoutes } from "./routes/category.routes.js";
import { expenseRoutes } from "./routes/expense.routes.js";
import { householdRoutes } from "./routes/household.routes.js";
import { tenantRoutes } from "./routes/tenant.routes.js";

export function createApp() {
  const app = new Hono();

  app.onError(errorHandler);

  app.get("/health", (c) => c.json({ status: "ok", service: "foyer-api" }));
  app.get("/api/config", configController.get);

  app.route("/api/auth", authRoutes);
  app.get("/api/invites/:token", inviteController.preview);
  app.post("/api/invites/:token/accept", inviteController.accept);
  app.post("/api/invites/:token/register", inviteController.register);

  const protectedApi = new Hono();
  protectedApi.use("*", authMiddleware);
  protectedApi.route("/households", householdRoutes);
  protectedApi.route("/tenants", tenantRoutes);
  protectedApi.route("/categories", categoryRoutes);
  protectedApi.route("/expenses", expenseRoutes);
  app.route("/api", protectedApi);

  return app;
}

export const app = createApp();
