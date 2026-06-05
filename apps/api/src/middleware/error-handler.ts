import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ZodError } from "zod";
import { AppError } from "../errors/app.errors.js";

function toContentfulStatus(code: number): ContentfulStatusCode {
  switch (code) {
    case 400:
    case 401:
    case 403:
    case 404:
    case 409:
    case 500:
      return code;
    default:
      return 500;
  }
}

export const errorHandler: ErrorHandler = (error, c) => {
  if (error instanceof AppError) {
    return c.json(
      { error: error.message, ...(error.details !== undefined && { details: error.details }) },
      toContentfulStatus(error.statusCode),
    );
  }

  if (error instanceof ZodError) {
    return c.json(
      { error: "Validation failed", details: error.flatten() },
      400,
    );
  }

  console.error(error);
  return c.json({ error: "Internal server error" }, 500);
};
