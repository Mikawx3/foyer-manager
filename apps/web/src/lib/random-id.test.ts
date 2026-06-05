import { afterEach, describe, expect, it, vi } from "vitest";
import { generateUUID } from "./random-id.ts";

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("generateUUID", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a UUID v4 string", () => {
    expect(generateUUID()).toMatch(UUID_V4_PATTERN);
  });

  it("falls back to getRandomValues when randomUUID is unavailable", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: (array: Uint8Array) => {
        array.set([
          0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, 0x01, 0x23, 0x45, 0x67, 0x89, 0xab,
          0xcd, 0xef,
        ]);
        return array;
      },
    });

    expect(generateUUID()).toBe("01234567-89ab-4def-8123-456789abcdef");
  });

  it("falls back to a temp id when crypto is unavailable", () => {
    vi.stubGlobal("crypto", undefined);

    expect(generateUUID()).toMatch(/^temp-\d+-[a-z0-9]+$/);
  });
});
