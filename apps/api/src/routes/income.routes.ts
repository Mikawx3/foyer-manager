import { Hono } from "hono";
import { incomeController } from "../controllers/income.controller.js";

export const incomeRoutes = new Hono();

incomeRoutes.get("/templates", incomeController.listTemplates);
incomeRoutes.post("/templates", incomeController.createTemplate);
incomeRoutes.patch("/templates/:templateId", incomeController.updateTemplate);
incomeRoutes.delete("/templates/:templateId", incomeController.removeTemplate);
incomeRoutes.get("/stats", incomeController.stats);
incomeRoutes.get("/", incomeController.list);
incomeRoutes.post("/", incomeController.create);
incomeRoutes.patch("/:incomeId", incomeController.update);
incomeRoutes.delete("/:incomeId", incomeController.remove);
