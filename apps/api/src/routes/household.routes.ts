import { Hono } from "hono";
import { householdController } from "../controllers/household.controller.js";

export const householdRoutes = new Hono();

householdRoutes.get("/", householdController.list);
householdRoutes.post("/", householdController.create);
householdRoutes.get("/:id", householdController.get);
householdRoutes.delete("/:id", householdController.remove);
