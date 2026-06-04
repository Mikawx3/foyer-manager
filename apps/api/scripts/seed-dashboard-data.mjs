const API_BASE = process.env.API_BASE ?? "http://localhost:3000";
const HOUSEHOLD_ID = process.env.HOUSEHOLD_ID ?? "cmpzslru40000xz5ejq5k3jrr";

async function api(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

function equalSplits(tenantIds) {
  const n = tenantIds.length;
  const base = Math.floor((10000 / n)) / 100;
  const splits = tenantIds.map((tenantId, i) => ({
    tenantId,
    percentage: i === n - 1 ? 100 - base * (n - 1) : base,
  }));
  return splits;
}

async function main() {
  const tenants = await api("GET", `/api/tenants?householdId=${HOUSEHOLD_ID}`);
  const categories = await api("GET", `/api/categories?householdId=${HOUSEHOLD_ID}`);

  const tenantByName = new Map(tenants.map((t) => [t.name, t]));
  for (const { name, email } of [
    { name: "Bob", email: `bob.dashboard.${Date.now()}@test.com` },
    { name: "Charlie", email: `charlie.dashboard.${Date.now()}@test.com` },
  ]) {
    if (!tenantByName.has(name)) {
      const created = await api("POST", "/api/tenants", {
        name,
        email,
        householdId: HOUSEHOLD_ID,
      });
      tenantByName.set(name, created);
      console.log("tenant", created.id, name);
    }
  }

  const catByName = new Map(categories.map((c) => [c.name, c]));
  for (const name of ["Rent", "Utilities", "Internet", "Home insurance"]) {
    if (!catByName.has(name)) {
      const created = await api("POST", "/api/categories", {
        name,
        householdId: HOUSEHOLD_ID,
      });
      catByName.set(name, created);
      console.log("category", created.id, name);
    }
  }
  if (!catByName.has("Groceries")) {
    const created = await api("POST", "/api/categories", {
      name: "Groceries",
      householdId: HOUSEHOLD_ID,
    });
    catByName.set("Groceries", created);
  }

  const tenantIds = ["Alice", "Bob", "Charlie"]
    .map((n) => tenantByName.get(n)?.id)
    .filter(Boolean);
  if (tenantIds.length < 2) {
    throw new Error("Need at least 2 tenants for splits");
  }
  const splits = equalSplits(tenantIds);

  const pick = (arr, i) => arr[i % arr.length];
  const plans = [];
  const months = [
    "2025-12",
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
    "2026-05",
    "2026-06",
  ];

  for (const month of months) {
    plans.push({
      date: `${month}-01`,
      category: "Rent",
      amount: 1250,
      description: "Monthly rent",
      payer: "Alice",
    });
    plans.push({
      date: `${month}-05`,
      category: "Utilities",
      amount: month === "2026-01" ? 198.4 : 142.75,
      description: "Gas and electricity",
      payer: "Bob",
    });
    plans.push({
      date: `${month}-08`,
      category: "Internet",
      amount: 44.99,
      description: "Fiber internet",
      payer: "Charlie",
    });
    plans.push({
      date: `${month}-10`,
      category: "Home insurance",
      amount: 38.5,
      description: "Home insurance premium",
      payer: "Alice",
    });
    for (const [day, amount, desc] of [
      ["12", 86.2, "Supermarket run"],
      ["19", 54.9, "Groceries delivery"],
      ["26", 112.35, "Weekly groceries"],
    ]) {
      plans.push({
        date: `${month}-${day}`,
        category: "Groceries",
        amount,
        description: desc,
        payer: pick(["Alice", "Bob", "Charlie"], plans.length),
      });
    }
  }

  let createdExpenses = 0;
  let splitCount = 0;
  for (const plan of plans) {
    const category = catByName.get(plan.category);
    const payer = tenantByName.get(plan.payer);
    if (!category || !payer) continue;

    const expense = await api("POST", "/api/expenses", {
      amount: plan.amount,
      description: plan.description,
      categoryId: category.id,
      paidByTenantId: payer.id,
      householdId: HOUSEHOLD_ID,
      date: plan.date,
    });
    createdExpenses += 1;
    await api("POST", `/api/expenses/${expense.id}/splits`, { splits });
    splitCount += 1;
  }

  const balances = await api(
    "GET",
    `/api/households/${HOUSEHOLD_ID}/balances`,
  );
  console.log(
    JSON.stringify(
      {
        householdId: HOUSEHOLD_ID,
        tenants: tenantIds.length,
        categories: [...catByName.keys()],
        expensesCreated: createdExpenses,
        splitsAssigned: splitCount,
        balances,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
