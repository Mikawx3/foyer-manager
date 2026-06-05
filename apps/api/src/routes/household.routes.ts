import { Hono } from "hono";
import { defaultSplitController } from "../controllers/default-split.controller.js";
import { householdController } from "../controllers/household.controller.js";
import { settlementController } from "../controllers/settlement.controller.js";

export const householdRoutes = new Hono();

householdRoutes.get("/", householdController.list);
householdRoutes.post("/", householdController.create);
householdRoutes.get("/:id/default-splits/resolve", defaultSplitController.resolve);
householdRoutes.get("/:id/default-splits", defaultSplitController.getRules);
householdRoutes.put("/:id/default-splits", defaultSplitController.setRules);
householdRoutes.delete("/:id/default-splits", defaultSplitController.deleteCategoryRules);
householdRoutes.get("/:id/settlements", settlementController.list);
householdRoutes.post("/:id/settlements", settlementController.create);
householdRoutes.delete("/:id/settlements/:settlementId", settlementController.remove);
householdRoutes.get("/:id/balances", householdController.getBalances);
householdRoutes.patch("/:id", householdController.update);
householdRoutes.get("/:id", householdController.get);
householdRoutes.delete("/:id", householdController.remove);
