import { describe, expect, it } from "vitest";
import { redistributeSplits } from "./redistribute-splits.js";

const tenants = [
  { id: "t1", name: "Alice" },
  { id: "t2", name: "Bob" },
  { id: "t3", name: "Charlie" },
];

describe("redistributeSplits", () => {
  it("rescales base rules to selected members only", () => {
    const result = redistributeSplits(
      tenants,
      ["t1", "t2"],
      [
        { tenantId: "t1", percentage: 60 },
        { tenantId: "t2", percentage: 40 },
        { tenantId: "t3", percentage: 0 },
      ],
      100,
    );

    expect(result).toHaveLength(2);
    expect(result[0]?.percentage).toBe(60);
    expect(result[1]?.percentage).toBe(40);
    expect(result[0]?.amount).toBe(60);
    expect(result[1]?.amount).toBe(40);
  });

  it("applies 70/30 split on 50 amount", () => {
    const result = redistributeSplits(
      tenants,
      ["t1", "t2"],
      [
        { tenantId: "t1", percentage: 70 },
        { tenantId: "t2", percentage: 30 },
      ],
      50,
    );

    expect(result[0]?.percentage).toBe(70);
    expect(result[1]?.percentage).toBe(30);
    expect(result[0]?.amount).toBe(35);
    expect(result[1]?.amount).toBe(15);
  });

  it("falls back to equal split when base total is zero", () => {
    const result = redistributeSplits(tenants, ["t1", "t2"], [], 100);

    expect(result[0]?.percentage).toBe(50);
    expect(result[1]?.percentage).toBe(50);
    expect(result[0]?.amount + result[1]?.amount).toBe(100);
  });
});
