import type { Tenant } from "@foyer/types";

const sampleTenant: Tenant = {
  id: "sample",
  name: "Household",
  email: "household@example.com",
  householdId: "h1",
  createdAt: new Date().toISOString(),
};

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-8">
      <h1 className="text-2xl font-bold text-slate-900">Foyer Manager</h1>
      <p className="mt-2 text-slate-600">
        Household resource management — welcome, {sampleTenant.name}.
      </p>
    </main>
  );
}
