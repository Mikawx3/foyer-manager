import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import { getApiErrorMessage, getBalances, getTenants } from "../lib/api.ts";
import { formatCurrency } from "../lib/format.ts";
import { queryKeys } from "../lib/query-keys.ts";

export function BalancesPage() {
  const { id: householdId = "" } = useParams<{ id: string }>();

  const balancesQuery = useQuery({
    queryKey: queryKeys.balances(householdId),
    queryFn: () => getBalances(householdId),
    enabled: Boolean(householdId),
  });

  const tenantsQuery = useQuery({
    queryKey: queryKeys.tenants(householdId),
    queryFn: () => getTenants(householdId),
    enabled: Boolean(householdId),
  });

  const tenantNameById = new Map(tenantsQuery.data?.map((t) => [t.id, t.name]) ?? []);

  const isLoading = balancesQuery.isLoading || tenantsQuery.isLoading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Balances</h1>
        <p className="mt-1 text-sm text-slate-600">
          Positive balance means others owe this member; negative means they owe others.
        </p>
      </div>

      {isLoading && <ListSkeleton rows={3} />}
      {balancesQuery.isError && (
        <ErrorMessage
          message={getApiErrorMessage(balancesQuery.error)}
          onRetry={() => balancesQuery.refetch()}
        />
      )}
      {balancesQuery.isSuccess && balancesQuery.data.length === 0 && (
        <EmptyState
          title="No balance data"
          description="Add members and expenses with splits to see balances."
        />
      )}
      {balancesQuery.isSuccess && balancesQuery.data.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Member</th>
                <th className="px-4 py-3 text-right font-medium text-slate-700">Paid</th>
                <th className="px-4 py-3 text-right font-medium text-slate-700">Owed</th>
                <th className="px-4 py-3 text-right font-medium text-slate-700">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {balancesQuery.data.map((row) => (
                <tr key={row.tenantId}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {tenantNameById.get(row.tenantId) ?? row.tenantId}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {formatCurrency(row.totalPaid)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {formatCurrency(row.totalOwed)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      row.balance >= 0 ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {formatCurrency(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
