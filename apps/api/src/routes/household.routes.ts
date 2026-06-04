import { Hono } from "hono";
import { defaultSplitController } from "../controllers/default-split.controller.js";
import { householdController } from "../controllers/household.controller.js";

export const householdRoutes = new Hono();

householdRoutes.get("/", householdController.list);
householdRoutes.post("/", householdController.create);
householdRoutes.get("/:id/default-splits/resolve", defaultSplitController.resolve);
householdRoutes.get("/:id/default-splits", defaultSplitController.getRules);
householdRoutes.put("/:id/default-splits", defaultSplitController.setRules);
householdRoutes.delete("/:id/default-splits", defaultSplitController.deleteCategoryRules);
householdRoutes.get("/:id/balances", householdController.getBalances);
householdRoutes.get("/:id", householdController.get);
householdRoutes.delete("/:id", householdController.remove);
