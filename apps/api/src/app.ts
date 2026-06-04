import { Hono } from "hono";
import { errorHandler } from "./middleware/error-handler.js";
import { categoryRoutes } from "./routes/category.routes.js";
import { expenseRoutes } from "./routes/expense.routes.js";
import { householdRoutes } from "./routes/household.routes.js";
import { tenantRoutes } from "./routes/tenant.routes.js";

export function createApp() {
  const app = new Hono();

  app.onError(errorHandler);

  app.get("/health", (c) => c.json({ status: "ok", service: "foyer-api" }));

  app.route("/api/households", householdRoutes);
  app.route("/api/tenants", tenantRoutes);
  app.route("/api/categories", categoryRoutes);
  app.route("/api/expenses", expenseRoutes);

  return app;
}

export const app = createApp();
