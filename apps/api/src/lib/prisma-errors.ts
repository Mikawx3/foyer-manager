import { Prisma } from "@prisma/client";
import { ConflictError, NotFoundError } from "../errors/app.errors.js";

export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      throw new NotFoundError("Resource not found");
    }
    if (error.code === "P2002") {
      throw new ConflictError("A record with this value already exists", {
        target: error.meta?.target,
      });
    }
    if (error.code === "P2003") {
      throw new NotFoundError("Related resource not found");
    }
  }
  throw error;
}
