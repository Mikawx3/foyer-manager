import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const originalApiDir = process.env.FOYER_API_DIR;
const originalPort = process.env.PORT;

afterEach(() => {
  if (originalApiDir === undefined) {
    delete process.env.FOYER_API_DIR;
  } else {
    process.env.FOYER_API_DIR = originalApiDir;
  }
  if (originalPort === undefined) {
    delete process.env.PORT;
  } else {
    process.env.PORT = originalPort;
  }
});

describe("resolveApiPort", () => {
  it("prefers PORT from the shell environment", async () => {
    process.env.PORT = "3005";

    const { resolveApiPort } = await import("./vite-api-port.ts");
    expect(resolveApiPort("development")).toBe(3005);
  });

  it("reads PORT from the env file matching the vite mode", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "foyer-vite-port-"));
    try {
      writeFileSync(join(tempDir, ".env.local"), "PORT=3005\n");
      process.env.FOYER_API_DIR = tempDir;

      const { resolveApiPort } = await import("./vite-api-port.ts");
      expect(resolveApiPort("development")).toBe(3005);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("reads PORT from .env.development in cloud mode", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "foyer-vite-port-"));
    try {
      writeFileSync(join(tempDir, ".env.development"), "PORT=3010\n");
      process.env.FOYER_API_DIR = tempDir;

      const { resolveApiPort } = await import("./vite-api-port.ts");
      expect(resolveApiPort("cloud")).toBe(3010);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("falls back to the default port when no env file exists", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "foyer-vite-port-"));
    try {
      mkdirSync(tempDir, { recursive: true });
      process.env.FOYER_API_DIR = tempDir;

      const { resolveApiPort } = await import("./vite-api-port.ts");
      expect(resolveApiPort("development")).toBe(3000);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
