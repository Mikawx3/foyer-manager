import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_API_PORT = 3000;

function parsePortFromEnvFile(filePath: string): number | undefined {
  if (!existsSync(filePath)) {
    return undefined;
  }

  const content = readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^PORT=(.+)$/);
    if (!match) {
      continue;
    }

    const value = match[1].replace(/^["']|["']$/g, "");
    const port = Number(value);
    if (Number.isFinite(port) && port > 0) {
      return port;
    }
  }

  return undefined;
}

/** Reads API PORT from the same env files used by @foyer/api dev scripts. */
export function resolveApiPort(mode: string): number {
  const fromEnv = process.env.PORT;
  if (fromEnv) {
    const port = Number(fromEnv);
    if (Number.isFinite(port) && port > 0) {
      return port;
    }
  }

  const apiDir =
    process.env.FOYER_API_DIR ??
    resolve(dirname(fileURLToPath(import.meta.url)), "../api");
  const candidates =
    mode === "cloud" ? [".env.development", ".env"] : [".env.local", ".env"];

  for (const file of candidates) {
    const port = parsePortFromEnvFile(resolve(apiDir, file));
    if (port !== undefined) {
      return port;
    }
  }

  return DEFAULT_API_PORT;
}
