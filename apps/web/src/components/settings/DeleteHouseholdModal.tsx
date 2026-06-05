import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { inputClassName } from "../forms/FormField.tsx";
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

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const dangerButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50";

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
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deleteMutation.isPending) {
        handleClose();
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null);

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, deleteMutation.isPending]);

  if (!isOpen) {
    return null;
  }

  const nameMatches = confirmName === householdName;
  const preview = previewQuery.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close dialog"
        disabled={deleteMutation.isPending}
        onClick={handleClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-xl bg-surface p-6 shadow-lg"
      >
        {step === "preview" && (
          <>
            <h2 id={titleId} className="font-semibold text-stone-900">
              You are about to delete &quot;{householdName}&quot;
            </h2>
            <p className="mt-2 text-sm text-stone-600">This will permanently delete:</p>

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
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-700">
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

            <p className="mt-4 text-sm text-stone-600">This action cannot be undone.</p>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                ref={cancelButtonRef}
                type="button"
                className={btnSecondary}
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
            <h2 id={titleId} className="font-semibold text-stone-900">
              Confirm deletion
            </h2>
            <p className="mt-2 text-sm text-stone-600">
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
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                ref={cancelButtonRef}
                type="button"
                className={btnSecondary}
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
      </div>
    </div>
  );
}
