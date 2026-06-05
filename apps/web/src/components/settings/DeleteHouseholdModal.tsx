import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { formatCurrency } from "../../lib/format.ts";
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

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
}

export function DeleteHouseholdModal({
  isOpen,
  householdId,
  householdName,
  onClose,
}: DeleteHouseholdModalProps) {
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
      showMutationSuccess("Household deleted.");
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
      ? `You are about to delete "${householdName}"`
      : "Confirm deletion";

  return (
    <Modal
      title={modalTitle}
      open={isOpen}
      onClose={deleteMutation.isPending ? () => undefined : handleClose}
    >
      {step === "preview" && (
        <>
          <p className="text-base text-stone-600 md:text-sm">This will permanently delete:</p>

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
              <li>{pluralize(preview.memberCount, "member", "members")}</li>
              <li>
                {pluralize(preview.expenseCount, "expense", "expenses")} (
                {formatCurrency(preview.expenseTotal)} total)
              </li>
              <li>
                {pluralize(preview.recurringExpenseCount, "recurring expense", "recurring expenses")}
              </li>
              <li>All settlements and balance history</li>
            </ul>
          )}

          {previewQuery.isSuccess && preview && preview.outstandingBalanceTotal > 0 && (
            <p className="mt-4 text-sm text-negative">
              {pluralize(preview.membersWithUnresolvedBalance, "member", "members")} have
              unresolved balances totalling {formatCurrency(preview.outstandingBalanceTotal)}.
              Deleting will permanently erase all debt records.
            </p>
          )}

          <p className="mt-4 text-base text-stone-600 md:text-sm">This action cannot be undone.</p>

          <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:flex-wrap md:justify-end">
            <button
              type="button"
              className={`${btnSecondary} w-full md:w-auto`}
              disabled={deleteMutation.isPending}
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className={dangerButtonClass}
              disabled={!previewQuery.isSuccess || deleteMutation.isPending}
              onClick={() => setStep("confirm")}
            >
              Continue
            </button>
          </div>
        </>
      )}

      {step === "confirm" && (
        <>
          <p className="text-base text-stone-600 md:text-sm">
            To confirm, type the household name &quot;{householdName}&quot; below:
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
              Cancel
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
              Delete permanently
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
