import { useTranslation } from "react-i18next";
import { inputClassName, selectClassName } from "../forms/FormField.tsx";
import { Modal } from "../ui/Modal.tsx";
import { btnPrimary, btnSecondary } from "../../lib/ui-classes.ts";

export type SettlementModalMode = "suggested" | "manual";

export interface SettlementModalDraft {
  mode: SettlementModalMode;
  fromTenantId: string;
  toTenantId: string;
  fromName?: string;
  toName?: string;
}

export interface SettlementModalTenant {
  id: string;
  name: string;
}

interface SettlementModalProps {
  isOpen: boolean;
  draft: SettlementModalDraft | null;
  tenants: SettlementModalTenant[];
  amount: string;
  note: string;
  date: string;
  onFromChange: (tenantId: string) => void;
  onToChange: (tenantId: string) => void;
  onAmountChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SettlementModal({
  isOpen,
  draft,
  tenants,
  amount,
  note,
  date,
  onFromChange,
  onToChange,
  onAmountChange,
  onNoteChange,
  onDateChange,
  onConfirm,
  onCancel,
  isLoading = false,
}: SettlementModalProps) {
  const { t } = useTranslation("balances");
  const { t: tCommon } = useTranslation("common");

  if (!draft) {
    return null;
  }

  const recipientOptions = tenants.filter((tenant) => tenant.id !== draft.fromTenantId);
  const parsedAmount = Number(amount);
  const amountValid = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const tenantsValid =
    draft.fromTenantId !== "" &&
    draft.toTenantId !== "" &&
    draft.fromTenantId !== draft.toTenantId;
  const canSubmit = amountValid && tenantsValid;

  return (
    <Modal title={t("recordSettlement")} open={isOpen} onClose={onCancel}>
      {draft.mode === "suggested" && draft.fromName !== undefined && draft.toName !== undefined && (
        <p className="text-sm text-stone-600">
          {tCommon("pays", { fromName: draft.fromName, toName: draft.toName })}
        </p>
      )}

      <form
        className={draft.mode === "suggested" ? "mt-4 space-y-3" : "space-y-3"}
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
      >
        {draft.mode === "manual" && (
          <>
            <div className="space-y-1">
              <label htmlFor="settlement-from" className="block text-sm font-medium text-stone-700">
                {t("from")}
              </label>
              <select
                id="settlement-from"
                className={selectClassName}
                value={draft.fromTenantId}
                onChange={(event) => onFromChange(event.target.value)}
              >
                <option value="" disabled>
                  {tCommon("selectPayer")}
                </option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="settlement-to" className="block text-sm font-medium text-stone-700">
                {t("to")}
              </label>
              <select
                id="settlement-to"
                className={selectClassName}
                value={draft.toTenantId}
                onChange={(event) => onToChange(event.target.value)}
                disabled={draft.fromTenantId === ""}
              >
                <option value="" disabled>
                  {tCommon("selectRecipient")}
                </option>
                {recipientOptions.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="space-y-1">
          <label htmlFor="settlement-amount" className="block text-sm font-medium text-stone-700">
            {tCommon("amount")}
          </label>
          <input
            id="settlement-amount"
            type="number"
            min={0.01}
            step={0.01}
            className={inputClassName}
            value={amount}
            placeholder={draft.mode === "manual" ? t("amountPlaceholder") : undefined}
            onChange={(event) => onAmountChange(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="settlement-note" className="block text-sm font-medium text-stone-700">
            {tCommon("noteOptional")}
          </label>
          <input
            id="settlement-note"
            type="text"
            className={inputClassName}
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="settlement-date" className="block text-sm font-medium text-stone-700">
            {tCommon("date")}
          </label>
          <input
            id="settlement-date"
            type="date"
            className={inputClassName}
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </div>

        <div className="flex flex-col-reverse gap-3 pt-3 md:flex-row md:justify-end md:gap-2">
          <button
            type="button"
            className={`${btnSecondary} w-full md:w-auto`}
            onClick={onCancel}
            disabled={isLoading}
          >
            {tCommon("cancel")}
          </button>
          <button
            type="submit"
            className={`${btnPrimary} w-full md:w-auto`}
            disabled={isLoading || !canSubmit}
          >
            {isLoading ? tCommon("saving") : tCommon("confirm")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
