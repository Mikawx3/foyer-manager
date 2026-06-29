import { Hono } from "hono";
import { expenseStatsController } from "../controllers/expense-stats.controller.js";

export const expenseStatsRoutes = new Hono();

expenseStatsRoutes.get("/stats", expenseStatsController.stats);
