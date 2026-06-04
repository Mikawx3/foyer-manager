import { Hono } from "hono";
import { categoryController } from "../controllers/category.controller.js";

export const categoryRoutes = new Hono();

categoryRoutes.get("/", categoryController.list);
categoryRoutes.post("/", categoryController.create);
categoryRoutes.delete("/:id", categoryController.remove);
