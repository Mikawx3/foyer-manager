import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  SettlementModal,
  type SettlementModalDraft,
} from "../components/balances/SettlementModal.tsx";
import { EmptyState } from "../components/ui/EmptyState.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import { useFormat } from "../hooks/useFormat.ts";
import {
  createSettlement,
  deleteSettlement,
  getApiErrorMessage,
  getBalances,
  getCategories,
  getHousehold,
  getSettlements,
  getTenants,
} from "../lib/api.ts";
import { computeCategorySpending } from "../lib/dashboard-stats.ts";
import { fetchAllExpenses } from "../lib/fetch-all-expenses.ts";
import { isSoloHousehold } from "../lib/household-mode.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { computeSuggestedSettlements } from "../lib/suggested-settlements.ts";
import { mutationToastHandlers } from "../lib/toast.ts";
import { amount, btnPrimary, btnSecondary, card, pageSubtitle, pageTitle } from "../lib/ui-classes.ts";

const UNDO_WINDOW_MS = 24 * 60 * 60 * 1000;

function toDateInputValue(iso?: string): string {
  const date = iso !== undefined ? new Date(iso) : new Date();
  return date.toISOString().slice(0, 10);
}

function isoFromDateInput(value: string): string {
  return new Date(`${value}T12:00:00.000Z`).toISOString();
}

export function BalancesPage() {
  const { id: householdId = "" } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { t } = useTranslation("balances");
  const { t: tCommon } = useTranslation("common");
  const { t: tToast } = useTranslation("toast");
  const { formatCurrency, formatDate } = useFormat();

  const [balancePeriod, setBalancePeriod] = useState<"all" | "current">("all");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [modalDraft, setModalDraft] = useState<SettlementModalDraft | null>(null);
  const [modalAmount, setModalAmount] = useState("");
  const [modalNote, setModalNote] = useState("");
  const [modalDate, setModalDate] = useState(toDateInputValue());

  const householdQuery = useQuery({
    queryKey: queryKeys.household(householdId),
    queryFn: () => getHousehold(householdId),
    enabled: Boolean(householdId),
  });

  const isSolo = householdQuery.data ? isSoloHousehold(householdQuery.data) : false;

  const showPeriodTabs = !isSolo && householdQuery.data?.settlementPeriod !== "none";

  const expensesQuery = useQuery({
    queryKey: queryKeys.expensesAll(householdId),
    queryFn: () => fetchAllExpenses(householdId),
    enabled: Boolean(householdId) && isSolo,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories(householdId),
    queryFn: () => getCategories(householdId),
    enabled: Boolean(householdId) && isSolo,
  });

  const categorySpending = useMemo(() => {
    if (!expensesQuery.data || !categoriesQuery.data) {
      return [];
    }
    return computeCategorySpending(
      expensesQuery.data,
      categoriesQuery.data,
      tCommon("unknown"),
    );
  }, [expensesQuery.data, categoriesQuery.data, tCommon]);

  const balancesQuery = useQuery({
    queryKey: queryKeys.balances(householdId, balancePeriod),
    queryFn: () => getBalances(householdId, balancePeriod),
    enabled: Boolean(householdId),
  });

  const settlementsQuery = useQuery({
    queryKey: queryKeys.settlements(householdId),
    queryFn: () => getSettlements(householdId),
    enabled: Boolean(householdId),
  });

  const tenantsQuery = useQuery({
    queryKey: queryKeys.tenants(householdId),
    queryFn: () => getTenants(householdId),
    enabled: Boolean(householdId),
  });

  const tenantNameById = useMemo(
    () => new Map(tenantsQuery.data?.map((tenant) => [tenant.id, tenant.name]) ?? []),
    [tenantsQuery.data],
  );

  const tenantColorById = useMemo(
    () => new Map(tenantsQuery.data?.map((tenant) => [tenant.id, tenant.color]) ?? []),
    [tenantsQuery.data],
  );

  const suggestions = useMemo(
    () => computeSuggestedSettlements(balancesQuery.data ?? []),
    [balancesQuery.data],
  );

  const createSettlementMutation = useMutation({
    mutationFn: (input: {
      fromTenantId: string;
      toTenantId: string;
      amount: number;
      note?: string;
      date: string;
    }) => createSettlement(householdId, input),
    ...mutationToastHandlers({
      successMessage: tToast("settlementRecorded"),
      onSuccess: () => {
        setModalDraft(null);
        setModalAmount("");
        setModalNote("");
        void queryClient.invalidateQueries({ queryKey: ["balances", householdId] });
        void queryClient.invalidateQueries({ queryKey: queryKeys.settlements(householdId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.household(householdId) });
      },
    }),
  });

  const deleteSettlementMutation = useMutation({
    mutationFn: (settlementId: string) => deleteSettlement(householdId, settlementId),
    ...mutationToastHandlers({
      successMessage: tToast("settlementUndone"),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["balances", householdId] });
        void queryClient.invalidateQueries({ queryKey: queryKeys.settlements(householdId) });
      },
    }),
  });

  const isLoading = isSolo
    ? expensesQuery.isLoading || categoriesQuery.isLoading || householdQuery.isLoading
    : balancesQuery.isLoading || tenantsQuery.isLoading || householdQuery.isLoading;

  const tenants = tenantsQuery.data ?? [];

  const resetModalFields = () => {
    setModalNote("");
    setModalDate(toDateInputValue());
  };

  const openSuggestedSettlementModal = (
    fromTenantId: string,
    toTenantId: string,
    fromName: string,
    toName: string,
    settlementAmount: number,
  ) => {
    setModalDraft({
      mode: "suggested",
      fromTenantId,
      toTenantId,
      fromName,
      toName,
    });
    setModalAmount(String(settlementAmount));
    resetModalFields();
  };

  const openManualSettlementModal = () => {
    const firstTenant = tenants[0];
    const secondTenant = tenants.find((tenant) => tenant.id !== firstTenant?.id);
    setModalDraft({
      mode: "manual",
      fromTenantId: firstTenant?.id ?? "",
      toTenantId: secondTenant?.id ?? "",
    });
    setModalAmount("");
    resetModalFields();
  };

  const handleFromChange = (fromTenantId: string) => {
    if (!modalDraft) {
      return;
    }
    const nextToTenantId =
      modalDraft.toTenantId === fromTenantId
        ? (tenants.find((tenant) => tenant.id !== fromTenantId)?.id ?? "")
        : modalDraft.toTenantId;
    setModalDraft({
      ...modalDraft,
      fromTenantId,
      toTenantId: nextToTenantId,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={pageTitle}>{t("title")}</h1>
          <p className={pageSubtitle}>
            {isSolo ? t("subtitleSolo") : t("subtitleShared")}
          </p>
        </div>
        {!isSolo && tenants.length >= 2 && (
          <button
            type="button"
            className={`${btnSecondary} shrink-0 rounded-lg border border-border px-3 py-2`}
            onClick={openManualSettlementModal}
          >
            {tCommon("recordPayment")}
          </button>
        )}
      </div>

      {showPeriodTabs && (
        <div className="flex gap-2">
          <button
            type="button"
            className={
              balancePeriod === "current"
                ? btnPrimary
                : `${btnSecondary} rounded-lg border border-border px-3 py-1.5`
            }
            onClick={() => setBalancePeriod("current")}
          >
            {tCommon("thisPeriod")}
          </button>
          <button
            type="button"
            className={
              balancePeriod === "all"
                ? btnPrimary
                : `${btnSecondary} rounded-lg border border-border px-3 py-1.5`
            }
            onClick={() => setBalancePeriod("all")}
          >
            {tCommon("allTime")}
          </button>
        </div>
      )}

      {isLoading && <ListSkeleton rows={3} />}
      {!isSolo && balancesQuery.isError && (
        <ErrorMessage
          message={getApiErrorMessage(balancesQuery.error)}
          onRetry={() => balancesQuery.refetch()}
        />
      )}
      {isSolo && (expensesQuery.isError || categoriesQuery.isError) && (
        <ErrorMessage
          message={getApiErrorMessage(expensesQuery.error ?? categoriesQuery.error)}
          onRetry={() => {
            void expensesQuery.refetch();
            void categoriesQuery.refetch();
          }}
        />
      )}
      {isSolo && expensesQuery.isSuccess && categoriesQuery.isSuccess && categorySpending.length === 0 && (
        <EmptyState
          title={t("noSpendingTitle")}
          description={t("noSpendingDescription")}
        />
      )}
      {isSolo && expensesQuery.isSuccess && categoriesQuery.isSuccess && categorySpending.length > 0 && (
        <>
          <ul className="space-y-3 md:hidden">
            {categorySpending.map((row) => (
              <li key={row.name} className={card}>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex min-w-0 items-center gap-2 font-medium text-stone-900">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: row.fill }}
                    />
                    {row.name}
                  </span>
                  <span className={`${amount} shrink-0 text-lg`}>{formatCurrency(row.value)}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className={`${card} hidden overflow-hidden p-0 md:block`}>
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-bg">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-stone-700">{t("tableCategory")}</th>
                <th className="px-4 py-3 text-right font-medium text-stone-700">{t("tableTotalSpent")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {categorySpending.map((row) => (
                <tr key={row.name}>
                  <td className="px-4 py-3 font-medium text-stone-900">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: row.fill }}
                      />
                      {row.name}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right ${amount}`}>{formatCurrency(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
      {!isSolo && balancesQuery.isSuccess && balancesQuery.data.length === 0 && (
        <EmptyState
          title={t("noBalanceDataTitle")}
          description={t("noBalanceDataDescription")}
        />
      )}
      {!isSolo && balancesQuery.isSuccess && balancesQuery.data.length > 0 && (
        <>
          <ul className="space-y-3 md:hidden">
            {balancesQuery.data.map((row) => {
              const memberName =
                row.tenantName || tenantNameById.get(row.tenantId) || row.tenantId;
              const memberColor = tenantColorById.get(row.tenantId);
              return (
                <li key={row.tenantId} className={card}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center gap-2 font-medium text-stone-900">
                        {memberColor && (
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: memberColor }}
                          />
                        )}
                        {memberName}
                      </span>
                      <p
                        className={`mt-2 text-xl font-mono tabular-nums font-bold ${
                          row.balance >= 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        {formatCurrency(row.balance)}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        {tCommon("paidOwedSettled", {
                          paid: formatCurrency(row.paid),
                          owed: formatCurrency(row.owed),
                          settled: formatCurrency(row.settledAmount),
                        })}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className={`${card} hidden overflow-hidden p-0 md:block`}>
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-bg">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-stone-700">{t("tableMember")}</th>
                <th className="px-4 py-3 text-right font-medium text-stone-700">{t("tablePaid")}</th>
                <th className="px-4 py-3 text-right font-medium text-stone-700">{t("tableOwed")}</th>
                <th className="px-4 py-3 text-right font-medium text-stone-700">{t("tableSettled")}</th>
                <th className="px-4 py-3 text-right font-medium text-stone-700">{t("tableBalance")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {balancesQuery.data.map((row) => (
                <tr key={row.tenantId}>
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {row.tenantName || tenantNameById.get(row.tenantId) || row.tenantId}
                  </td>
                  <td className={`px-4 py-3 text-right text-stone-600 ${amount}`}>
                    {formatCurrency(row.paid)}
                  </td>
                  <td className={`px-4 py-3 text-right text-stone-600 ${amount}`}>
                    {formatCurrency(row.owed)}
                  </td>
                  <td className={`px-4 py-3 text-right text-stone-600 ${amount}`}>
                    {formatCurrency(row.settledAmount)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono tabular-nums font-bold ${
                      row.balance >= 0 ? "text-positive" : "text-negative"
                    }`}
                  >
                    {formatCurrency(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {!isSolo && balancesQuery.isSuccess && suggestions.length > 0 && (
        <section className={card}>
          <h2 className="text-base font-semibold text-stone-900">{t("suggestedSettlements")}</h2>
          <ul className="mt-3 space-y-2">
            {suggestions.map((suggestion) => {
              const fromName =
                tenantNameById.get(suggestion.fromTenantId) ?? suggestion.fromTenantId;
              const toName = tenantNameById.get(suggestion.toTenantId) ?? suggestion.toTenantId;
              return (
                <li
                  key={`${suggestion.fromTenantId}-${suggestion.toTenantId}-${suggestion.amount}`}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-bg px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                >
                  <span className="text-sm text-stone-800">
                    {tCommon("shouldPay", {
                      fromName,
                      toName,
                      amount: formatCurrency(suggestion.amount),
                    })}
                  </span>
                  <button
                    type="button"
                    className={`${btnPrimary} w-full sm:w-auto`}
                    onClick={() =>
                      openSuggestedSettlementModal(
                        suggestion.fromTenantId,
                        suggestion.toTenantId,
                        fromName,
                        toName,
                        suggestion.amount,
                      )
                    }
                  >
                    {tCommon("markAsPaid")}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!isSolo && settlementsQuery.isSuccess && settlementsQuery.data.length > 0 && (
        <section className={card}>
          <button
            type="button"
            className="flex w-full items-center gap-2 text-left text-base font-semibold text-stone-900"
            onClick={() => setHistoryOpen((open) => !open)}
          >
            {historyOpen ? (
              <ChevronDown className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden />
            )}
            {t("settlementHistory")}
          </button>
          {historyOpen && (
            <ul className="mt-3 space-y-2">
              {settlementsQuery.data.map((settlement) => {
                const fromName =
                  tenantNameById.get(settlement.fromTenantId) ?? settlement.fromTenantId;
                const toName =
                  tenantNameById.get(settlement.toTenantId) ?? settlement.toTenantId;
                const canUndo =
                  Date.now() - new Date(settlement.createdAt).getTime() < UNDO_WINDOW_MS;

                return (
                  <li
                    key={settlement.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-bg px-3 py-3 text-sm"
                  >
                    <span className="min-w-0 flex-1 text-stone-800">
                      {tCommon("settlementHistoryEntry", {
                        date: formatDate(settlement.date),
                        fromName,
                        toName,
                        amount: formatCurrency(settlement.amount),
                      })}
                      {settlement.note !== null && settlement.note !== "" && (
                        <span className="text-stone-500">
                          {" "}
                          {tCommon("settlementNoteQuote", { note: settlement.note })}
                        </span>
                      )}
                    </span>
                    {canUndo && (
                      <button
                        type="button"
                        className={`${btnSecondary} shrink-0`}
                        disabled={deleteSettlementMutation.isPending}
                        onClick={() => deleteSettlementMutation.mutate(settlement.id)}
                      >
                        {tCommon("undo")}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {!isSolo && (
      <SettlementModal
        isOpen={modalDraft !== null}
        draft={modalDraft}
        tenants={tenants.map((tenant) => ({ id: tenant.id, name: tenant.name }))}
        amount={modalAmount}
        note={modalNote}
        date={modalDate}
        onFromChange={handleFromChange}
        onToChange={(toTenantId) => {
          if (modalDraft) {
            setModalDraft({ ...modalDraft, toTenantId });
          }
        }}
        onAmountChange={setModalAmount}
        onNoteChange={setModalNote}
        onDateChange={setModalDate}
        onConfirm={(parsedAmount) => {
          if (!modalDraft) {
            return;
          }
          createSettlementMutation.mutate({
            fromTenantId: modalDraft.fromTenantId,
            toTenantId: modalDraft.toTenantId,
            amount: parsedAmount,
            ...(modalNote.trim() !== "" && { note: modalNote.trim() }),
            date: isoFromDateInput(modalDate),
          });
        }}
        onCancel={() => setModalDraft(null)}
        isLoading={createSettlementMutation.isPending}
      />
      )}
    </div>
  );
}
