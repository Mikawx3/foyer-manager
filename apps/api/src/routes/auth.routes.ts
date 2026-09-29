import { Hono } from "hono";
import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const authRoutes = new Hono();

authRoutes.post("/register", authController.register);
authRoutes.post("/signup-started", authController.signupStarted);
authRoutes.post("/login", authController.login);
authRoutes.post("/google", authController.google);
authRoutes.post("/guest-start", authController.guestStart);
authRoutes.get("/me", authMiddleware, authController.me);
