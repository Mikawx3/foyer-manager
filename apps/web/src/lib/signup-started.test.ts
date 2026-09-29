import { describe, expect, it, vi } from "vitest";
import { recordSignupStarted } from "./signup-started.ts";

function createStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe("recordSignupStarted", () => {
  it("posts once per storage and skips the next call", async () => {
    const storage = createStorage();
    const post = vi.fn(async () => {});

    await expect(recordSignupStarted(post, storage)).resolves.toBe(true);
    await expect(recordSignupStarted(post, storage)).resolves.toBe(false);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("does not remember a failed post", async () => {
    const storage = createStorage();
    const post = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(undefined);

    await expect(recordSignupStarted(post, storage)).rejects.toThrow("offline");
    await expect(recordSignupStarted(post, storage)).resolves.toBe(true);
    expect(post).toHaveBeenCalledTimes(2);
  });
});
