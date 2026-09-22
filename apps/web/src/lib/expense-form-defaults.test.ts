import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resolveExpenseFormDefaults,
  saveExpenseFormDefaults,
  subscribeExpenseFormDefaults,
} from "./expense-form-defaults.ts";

const HOUSEHOLD_ID = "household_1";
const TODAY = "2026-09-22";
const TENANT_IDS = ["t1", "t2", "t3"];

function createStorageMock(): Storage {
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

describe("expense-form-defaults", () => {
  let local: Storage;
  let session: Storage;

  beforeEach(() => {
    local = createStorageMock();
    session = createStorageMock();
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("sessionStorage", session);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves sticky payer/participants and session date, then resolves them", () => {
    saveExpenseFormDefaults(HOUSEHOLD_ID, {
      paidByTenantId: "t2",
      participantIds: ["t1", "t2"],
      date: "2026-09-18",
    });

    expect(resolveExpenseFormDefaults(HOUSEHOLD_ID, TENANT_IDS, TODAY)).toEqual({
      paidByTenantId: "t2",
      participantIds: ["t1", "t2"],
      date: "2026-09-18",
    });
  });

  it("does not persist the date in localStorage", () => {
    saveExpenseFormDefaults(HOUSEHOLD_ID, {
      paidByTenantId: "t1",
      participantIds: ["t1"],
      date: "2026-09-18",
    });

    expect(local.getItem(`fm.expense-form.sticky.${HOUSEHOLD_ID}`)).toBe(
      JSON.stringify({ paidByTenantId: "t1", participantIds: ["t1"] }),
    );
    expect(session.getItem(`fm.expense-form.session.${HOUSEHOLD_ID}`)).toBe(
      JSON.stringify({ date: "2026-09-18" }),
    );

    for (let index = 0; index < local.length; index += 1) {
      const key = local.key(index);
      if (key === null) {
        continue;
      }
      expect(local.getItem(key)).not.toContain("2026-09-18");
    }
  });

  it("falls back to today when there is no session date", () => {
    saveExpenseFormDefaults(HOUSEHOLD_ID, {
      paidByTenantId: "t1",
      participantIds: ["t1", "t2"],
      date: "2026-09-18",
    });
    session.clear();

    expect(resolveExpenseFormDefaults(HOUSEHOLD_ID, TENANT_IDS, TODAY)).toEqual({
      paidByTenantId: "t1",
      participantIds: ["t1", "t2"],
      date: TODAY,
    });
  });

  it("ignores member IDs that no longer exist", () => {
    saveExpenseFormDefaults(HOUSEHOLD_ID, {
      paidByTenantId: "gone",
      participantIds: ["t2", "gone", "t3"],
      date: "2026-09-18",
    });

    expect(resolveExpenseFormDefaults(HOUSEHOLD_ID, TENANT_IDS, TODAY)).toEqual({
      paidByTenantId: "",
      participantIds: ["t2", "t3"],
      date: "2026-09-18",
    });
  });

  it("falls back to all members when no stored participants remain valid", () => {
    saveExpenseFormDefaults(HOUSEHOLD_ID, {
      paidByTenantId: "t1",
      participantIds: ["gone"],
      date: "2026-09-18",
    });

    expect(resolveExpenseFormDefaults(HOUSEHOLD_ID, TENANT_IDS, TODAY)).toEqual({
      paidByTenantId: "t1",
      participantIds: TENANT_IDS,
      date: "2026-09-18",
    });
  });

  it("returns empty payer, all members and today when nothing is stored", () => {
    expect(resolveExpenseFormDefaults(HOUSEHOLD_ID, TENANT_IDS, TODAY)).toEqual({
      paidByTenantId: "",
      participantIds: TENANT_IDS,
      date: TODAY,
    });
  });

  it("notifies same-tab subscribers after save", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeExpenseFormDefaults(listener);

    saveExpenseFormDefaults(HOUSEHOLD_ID, {
      paidByTenantId: "t1",
      participantIds: ["t1"],
      date: TODAY,
    });

    expect(listener).toHaveBeenCalledWith(HOUSEHOLD_ID);
    unsubscribe();

    saveExpenseFormDefaults(HOUSEHOLD_ID, {
      paidByTenantId: "t2",
      participantIds: ["t2"],
      date: TODAY,
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
