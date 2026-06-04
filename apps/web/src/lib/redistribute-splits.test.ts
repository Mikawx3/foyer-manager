import { describe, expect, it } from "vitest";
import { redistributeSplits } from "./redistribute-splits.ts";

const tenants = [
  { id: "t1", name: "Alice" },
  { id: "t2", name: "Bob" },
];

describe("redistributeSplits", () => {
  it("rescales and sums amounts to expense total", () => {
    const result = redistributeSplits(
      tenants,
      ["t1", "t2"],
      [
        { tenantId: "t1", percentage: 50 },
        { tenantId: "t2", percentage: 50 },
      ],
      50,
    );

    const total = result.reduce((sum, row) => sum + row.amount, 0);
    expect(total).toBe(50);
    expect(result[0]?.tenantName).toBe("Alice");
  });
});
