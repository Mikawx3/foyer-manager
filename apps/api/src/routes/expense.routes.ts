import { Hono } from "hono";
import { expenseController } from "../controllers/expense.controller.js";

export const expenseRoutes = new Hono();

expenseRoutes.get("/", expenseController.list);
expenseRoutes.post("/", expenseController.create);
expenseRoutes.get("/:id/splits", expenseController.getSplits);
expenseRoutes.post("/:id/splits/reset", expenseController.resetSplits);
expenseRoutes.post("/:id/splits", expenseController.assignSplits);
expenseRoutes.get("/:id", expenseController.get);
expenseRoutes.delete("/:id", expenseController.remove);
