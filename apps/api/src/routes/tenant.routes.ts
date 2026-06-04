import { Hono } from "hono";
import { tenantController } from "../controllers/tenant.controller.js";

export const tenantRoutes = new Hono();

tenantRoutes.get("/", tenantController.list);
tenantRoutes.post("/", tenantController.create);
tenantRoutes.get("/:id", tenantController.get);
tenantRoutes.delete("/:id", tenantController.remove);
