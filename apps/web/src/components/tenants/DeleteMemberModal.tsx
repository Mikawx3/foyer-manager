import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormat } from "../../hooks/useFormat.ts";
import type { TenantRemovalPreview } from "../../lib/api.ts";
import { Modal } from "../ui/Modal.tsx";
import { btnSecondary } from "../../lib/ui-classes.ts";

interface DeleteMemberModalProps {
  isOpen: boolean;
  householdId: string;
  memberName: string;
  preview: TenantRemovalPreview | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const dangerButtonClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-base font-medium text-white hover:bg-red-700 active:scale-[0.98] active:opacity-90 disabled:opacity-50 md:w-auto md:text-sm";

export function DeleteMemberModal({
  isOpen,
  householdId,
  memberName,
  preview,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteMemberModalProps) {
  const { t } = useTranslation("members");
  const { t: tCommon } = useTranslation("common");
  const { formatSignedCurrency } = useFormat();

  if (!preview) {
    return null;
  }

  const hasNonZeroBalance = Math.abs(preview.balance) > 0.005;
  const isBlocked = hasNonZeroBalance;

  let title = t("removeMemberPermanently");
  let message = t("removeMemberPermanentMessage", { name: memberName });
  let confirmLabel = t("deletePermanently");

  if (isBlocked) {
    title = t("cannotRemoveMember");
    message = t("cannotRemoveMemberMessage", {
      name: memberName,
      balance: formatSignedCurrency(preview.balance),
    });
  } else if (preview.hasHistory) {
    title = t("archiveMember");
    message = t("archiveMemberMessage", { name: memberName });
    confirmLabel = tCommon("archive");
  }

  const soloWarning = preview.wouldSwitchToSolo
    ? t("soloModeWarning", { name: memberName })
    : "";

  return (
    <Modal title={title} open={isOpen} onClose={onCancel}>
      <p className="text-base text-stone-600 md:text-sm">{message}</p>
      {!isBlocked && soloWarning && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {soloWarning}
        </p>
      )}
      {isBlocked && (
        <Link
          to={`/households/${householdId}/balances`}
          className="mt-4 inline-flex min-h-11 items-center text-base font-medium text-primary hover:text-primary-hover active:opacity-80 md:text-sm"
          onClick={onCancel}
        >
          {tCommon("goToBalances")}
        </Link>
      )}
      <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:flex-wrap md:justify-end">
        <button
          type="button"
          className={`${btnSecondary} w-full md:w-auto`}
          disabled={isLoading}
          onClick={onCancel}
        >
          {isBlocked ? t("blockedClose") : tCommon("cancel")}
        </button>
        {!isBlocked && (
          <button
            type="button"
            className={dangerButtonClass}
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {confirmLabel}
          </button>
        )}
      </div>
    </Modal>
  );
}
