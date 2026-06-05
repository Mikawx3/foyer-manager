import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useFormat } from "../../hooks/useFormat.ts";
import { inputClassName } from "../forms/FormField.tsx";
import { Modal } from "../ui/Modal.tsx";
import { ErrorMessage } from "../ui/ErrorMessage.tsx";
import { ListSkeleton } from "../ui/Skeleton.tsx";
import {
  deleteHousehold,
  getApiErrorMessage,
  getHouseholdDeletionPreview,
} from "../../lib/api.ts";
import { clearAuth } from "../../lib/auth-storage.ts";
import { queryKeys } from "../../lib/query-keys.ts";
import { showMutationError, showMutationSuccess } from "../../lib/toast.ts";
import { btnSecondary } from "../../lib/ui-classes.ts";

const dangerButtonClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-base font-medium text-white hover:bg-red-700 active:scale-[0.98] active:opacity-90 disabled:opacity-50 md:w-auto md:text-sm";

type DeleteStep = "preview" | "confirm";

interface DeleteHouseholdModalProps {
  isOpen: boolean;
  householdId: string;
  householdName: string;
  onClose: () => void;
}

export function DeleteHouseholdModal({
  isOpen,
  householdId,
  householdName,
  onClose,
}: DeleteHouseholdModalProps) {
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const { t: tToast } = useTranslation("toast");
  const { formatCurrency } = useFormat();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<DeleteStep>("preview");
  const [confirmName, setConfirmName] = useState("");

  const previewQuery = useQuery({
    queryKey: queryKeys.householdDeletionPreview(householdId),
    queryFn: () => getHouseholdDeletionPreview(householdId),
    enabled: isOpen && Boolean(householdId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteHousehold(householdId),
    onSuccess: () => {
      showMutationSuccess(tToast("householdDeleted"));
      clearAuth();
      void queryClient.clear();
      handleClose();
      navigate("/households", { replace: true });
    },
    onError: showMutationError,
  });

  const handleClose = () => {
    setStep("preview");
    setConfirmName("");
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setStep("preview");
      setConfirmName("");
    }
  }, [isOpen]);

  const nameMatches = confirmName === householdName;
  const preview = previewQuery.data;

  const modalTitle =
    step === "preview"
      ? t("deleteHouseholdPreviewTitle", { name: householdName })
      : t("confirmDeletion");

  return (
    <Modal
      title={modalTitle}
      open={isOpen}
      onClose={deleteMutation.isPending ? () => undefined : handleClose}
    >
      {step === "preview" && (
        <>
          <p className="text-base text-stone-600 md:text-sm">{t("deletePreviewIntro")}</p>

          {previewQuery.isLoading && (
            <div className="mt-4">
              <ListSkeleton rows={4} />
            </div>
          )}

          {previewQuery.isError && (
            <div className="mt-4">
              <ErrorMessage
                message={getApiErrorMessage(previewQuery.error)}
                onRetry={() => previewQuery.refetch()}
              />
            </div>
          )}

          {previewQuery.isSuccess && preview && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-base text-stone-700 md:text-sm">
              <li>{t("deletePreviewMembers", { count: preview.memberCount })}</li>
              <li>
                {t("deletePreviewExpenses", {
                  count: preview.expenseCount,
                  total: formatCurrency(preview.expenseTotal),
                })}
              </li>
              <li>{t("deletePreviewRecurring", { count: preview.recurringExpenseCount })}</li>
              <li>{t("deletePreviewSettlements")}</li>
            </ul>
          )}

          {previewQuery.isSuccess && preview && preview.outstandingBalanceTotal > 0 && (
            <p className="mt-4 text-sm text-negative">
              {t("deletePreviewUnresolvedBalances", {
                count: preview.membersWithUnresolvedBalance,
                total: formatCurrency(preview.outstandingBalanceTotal),
              })}
            </p>
          )}

          <p className="mt-4 text-base text-stone-600 md:text-sm">{tCommon("cannotBeUndone")}</p>

          <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:flex-wrap md:justify-end">
            <button
              type="button"
              className={`${btnSecondary} w-full md:w-auto`}
              disabled={deleteMutation.isPending}
              onClick={handleClose}
            >
              {tCommon("cancel")}
            </button>
            <button
              type="button"
              className={dangerButtonClass}
              disabled={!previewQuery.isSuccess || deleteMutation.isPending}
              onClick={() => setStep("confirm")}
            >
              {tCommon("continue")}
            </button>
          </div>
        </>
      )}

      {step === "confirm" && (
        <>
          <p className="text-base text-stone-600 md:text-sm">
            {t("deleteConfirmInstruction", { name: householdName })}
          </p>
          <input
            className={`${inputClassName} mt-4`}
            value={confirmName}
            onChange={(event) => setConfirmName(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            disabled={deleteMutation.isPending}
          />
          <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:flex-wrap md:justify-end">
            <button
              type="button"
              className={`${btnSecondary} w-full md:w-auto`}
              disabled={deleteMutation.isPending}
              onClick={handleClose}
            >
              {tCommon("cancel")}
            </button>
            <button
              type="button"
              className={dangerButtonClass}
              disabled={!nameMatches || deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              )}
              {t("deletePermanently")}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
