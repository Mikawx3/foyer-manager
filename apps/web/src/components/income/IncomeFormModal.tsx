import type { IncomeTemplate, ResolvedIncome, Tenant } from "@foyer/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField } from "../forms/FormField.tsx";
import { Modal } from "../ui/Modal.tsx";
import { ConfirmModal } from "../ui/ConfirmModal.tsx";
import {
  createIncome,
  createIncomeTemplate,
  deleteIncome,
  deleteIncomeTemplate,
  getApiErrorMessage,
  updateIncome,
  updateIncomeTemplate,
} from "../../lib/api.ts";
import {
  createIncomeSchema,
  createIncomeTemplateSchema,
  updateIncomeSchema,
  updateIncomeTemplateSchema,
  type CreateIncomeForm,
  type CreateIncomeTemplateForm,
  type UpdateIncomeForm,
  type UpdateIncomeTemplateForm,
} from "../../lib/schemas.ts";
import { mutationToastHandlers } from "../../lib/toast.ts";
import { btnPrimary, btnSecondary, inlineError } from "../../lib/ui-classes.ts";

const LABEL_PRESETS = ["salary", "freelance", "benefits", "other"] as const;

export type IncomeFormMode =
  | "create-recurring"
  | "create-month"
  | "edit-template"
  | "edit-resolved";

interface IncomeFormModalProps {
  open: boolean;
  onClose: () => void;
  householdId: string;
  month: string;
  tenants: Tenant[];
  formMode: IncomeFormMode;
  editingResolved?: ResolvedIncome | null;
  editingTemplate?: IncomeTemplate | null;
  initialTenantId?: string;
}

export function IncomeFormModal({
  open,
  onClose,
  householdId,
  month,
  tenants,
  formMode,
  editingResolved = null,
  editingTemplate = null,
  initialTenantId,
}: IncomeFormModalProps) {
  const { t } = useTranslation("income");
  const { t: tCommon } = useTranslation("common");
  const { t: tValidation } = useTranslation("validation");
  const { t: tToast } = useTranslation("toast");
  const queryClient = useQueryClient();

  const isRecurringMode = formMode === "create-recurring" || formMode === "edit-template";

  const [labelPreset, setLabelPreset] = useState<string>("salary");
  const [customLabel, setCustomLabel] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [recurring, setRecurring] = useState(formMode === "create-recurring");

  const createSchema = useMemo(() => createIncomeSchema(tValidation), [tValidation]);
  const createTemplateSchema = useMemo(
    () => createIncomeTemplateSchema(tValidation),
    [tValidation],
  );
  const editSchema = useMemo(() => updateIncomeSchema(tValidation), [tValidation]);
  const editTemplateSchema = useMemo(
    () => updateIncomeTemplateSchema(tValidation),
    [tValidation],
  );

  const createForm = useForm<CreateIncomeForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      tenantId: initialTenantId ?? tenants[0]?.id ?? "",
      amount: 0,
      label: t("labels.salary"),
      month,
      householdId,
    },
  });

  const createTemplateForm = useForm<CreateIncomeTemplateForm>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      tenantId: initialTenantId ?? tenants[0]?.id ?? "",
      amount: 0,
      label: t("labels.salary"),
      householdId,
    },
  });

  const editForm = useForm<UpdateIncomeForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { amount: 0, label: "", note: "" },
  });

  const editTemplateForm = useForm<UpdateIncomeTemplateForm>({
    resolver: zodResolver(editTemplateSchema),
    defaultValues: { amount: 0, label: "", note: "" },
  });

  const resolveLabel = useCallback(
    (preset: string, custom: string): string => {
      if (preset === "other") {
        return custom.trim();
      }
      return t(`labels.${preset as (typeof LABEL_PRESETS)[number]}`);
    },
    [t],
  );

  const applyLabelPreset = (label: string) => {
    const preset = LABEL_PRESETS.find((key) => t(`labels.${key}`) === label);
    if (preset) {
      setLabelPreset(preset);
      setCustomLabel("");
    } else {
      setLabelPreset("other");
      setCustomLabel(label);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    setRecurring(formMode === "create-recurring");

    if (formMode === "edit-template" && editingTemplate) {
      applyLabelPreset(editingTemplate.label);
      editTemplateForm.reset({
        amount: editingTemplate.amount,
        label: editingTemplate.label,
        note: editingTemplate.note ?? "",
      });
      return;
    }

    if (formMode === "edit-resolved" && editingResolved) {
      applyLabelPreset(editingResolved.label);
      editForm.reset({
        amount: editingResolved.amount,
        label: editingResolved.label,
        note: editingResolved.note ?? "",
      });
      return;
    }

    setLabelPreset("salary");
    setCustomLabel("");
    createForm.reset({
      tenantId: initialTenantId ?? tenants[0]?.id ?? "",
      amount: 0,
      label: t("labels.salary"),
      month,
      note: "",
      householdId,
    });
    createTemplateForm.reset({
      tenantId: initialTenantId ?? tenants[0]?.id ?? "",
      amount: 0,
      label: t("labels.salary"),
      note: "",
      householdId,
    });
  }, [
    open,
    formMode,
    editingResolved,
    editingTemplate,
    initialTenantId,
    tenants,
    month,
    householdId,
    t,
    createForm,
    createTemplateForm,
    editForm,
    editTemplateForm,
  ]);

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["incomes", householdId] });
    void queryClient.invalidateQueries({ queryKey: ["income-stats", householdId] });
    void queryClient.invalidateQueries({ queryKey: ["income-templates", householdId] });
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateIncomeForm) => createIncome(householdId, data),
    ...mutationToastHandlers({
      successMessage: tToast("incomeRecorded"),
      onSuccess: () => {
        invalidateAll();
        onClose();
      },
    }),
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: CreateIncomeTemplateForm) => createIncomeTemplate(householdId, data),
    ...mutationToastHandlers({
      successMessage: tToast("incomeTemplateRecorded"),
      onSuccess: () => {
        invalidateAll();
        onClose();
      },
    }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateIncomeForm & { id: string }) =>
      updateIncome(householdId, data.id, {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.label !== undefined && { label: data.label }),
        ...(data.note !== undefined && data.note !== null && { note: data.note }),
      }),
    ...mutationToastHandlers({
      successMessage: tToast("incomeUpdated"),
      onSuccess: () => {
        invalidateAll();
        onClose();
      },
    }),
  });

  const updateTemplateMutation = useMutation({
    mutationFn: (data: UpdateIncomeTemplateForm & { id: string }) =>
      updateIncomeTemplate(householdId, data.id, {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.label !== undefined && { label: data.label }),
        ...(data.note !== undefined && data.note !== null && { note: data.note }),
        ...(data.active !== undefined && { active: data.active }),
      }),
    ...mutationToastHandlers({
      successMessage: tToast("incomeTemplateUpdated"),
      onSuccess: () => {
        invalidateAll();
        onClose();
      },
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIncome(householdId, id),
    ...mutationToastHandlers({
      successMessage: tToast("incomeDeleted"),
      onSuccess: () => {
        invalidateAll();
        setConfirmDelete(false);
        onClose();
      },
    }),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => deleteIncomeTemplate(householdId, id),
    ...mutationToastHandlers({
      successMessage: tToast("incomeTemplateDeleted"),
      onSuccess: () => {
        invalidateAll();
        setConfirmDelete(false);
        onClose();
      },
    }),
  });

  const handleCreate = createForm.handleSubmit((data) => {
    const label = resolveLabel(labelPreset, customLabel);
    if (!label) {
      createForm.setError("label", { message: tValidation("labelRequired") });
      return;
    }
    if (recurring) {
      createTemplateMutation.mutate({ ...data, label, householdId });
    } else {
      createMutation.mutate({ ...data, label });
    }
  });

  const handleCreateTemplate = createTemplateForm.handleSubmit((data) => {
    const label = resolveLabel(labelPreset, customLabel);
    if (!label) {
      createTemplateForm.setError("label", { message: tValidation("labelRequired") });
      return;
    }
    createTemplateMutation.mutate({ ...data, label });
  });

  const handleUpdateResolved = editForm.handleSubmit((data) => {
    const label = resolveLabel(labelPreset, customLabel);
    if (!label || !editingResolved) {
      return;
    }

    if (editingResolved.source === "template") {
      createMutation.mutate({
        tenantId: editingResolved.tenantId,
        amount: data.amount ?? editingResolved.amount,
        label: editingResolved.label,
        month,
        note: data.note ?? undefined,
        householdId,
      });
      return;
    }

    const overrideId = editingResolved.overrideId ?? editingResolved.id;
    updateMutation.mutate({ ...data, label, id: overrideId });
  });

  const handleUpdateTemplate = editTemplateForm.handleSubmit((data) => {
    const label = resolveLabel(labelPreset, customLabel);
    if (!label || !editingTemplate) {
      return;
    }
    updateTemplateMutation.mutate({ ...data, label, id: editingTemplate.id });
  });

  const mutationError =
    createMutation.error ??
    createTemplateMutation.error ??
    updateMutation.error ??
    updateTemplateMutation.error ??
    deleteMutation.error ??
    deleteTemplateMutation.error;

  const isPending =
    createMutation.isPending ||
    createTemplateMutation.isPending ||
    updateMutation.isPending ||
    updateTemplateMutation.isPending ||
    deleteMutation.isPending ||
    deleteTemplateMutation.isPending;

  const modalTitle =
    formMode === "edit-template"
      ? t("editRecurring")
      : formMode === "edit-resolved"
        ? t("editIncome")
        : recurring
          ? t("addIncome")
          : t("addIncome");

  const labelFields = (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-stone-700">{t("label")}</label>
      <select
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        value={labelPreset}
        onChange={(event) => {
          const preset = event.target.value;
          setLabelPreset(preset);
          const label = resolveLabel(preset, customLabel);
          createForm.setValue("label", label);
          createTemplateForm.setValue("label", label);
          editForm.setValue("label", label);
          editTemplateForm.setValue("label", label);
        }}
        disabled={formMode === "edit-resolved" && editingResolved?.source === "template"}
      >
        {LABEL_PRESETS.map((key) => (
          <option key={key} value={key}>
            {t(`labels.${key}`)}
          </option>
        ))}
      </select>
      {labelPreset === "other" && (
        <input
          type="text"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          placeholder={t("customLabel")}
          value={customLabel}
          onChange={(event) => {
            setCustomLabel(event.target.value);
            const label = resolveLabel("other", event.target.value);
            createForm.setValue("label", label);
            createTemplateForm.setValue("label", label);
            editForm.setValue("label", label);
            editTemplateForm.setValue("label", label);
          }}
        />
      )}
    </div>
  );

  const amountInputClass =
    "w-full rounded-lg border border-border px-3 py-3 font-mono text-2xl font-semibold";

  return (
    <>
      <Modal title={modalTitle} open={open} onClose={onClose} fullHeightMobile>
        {formMode === "edit-template" && editingTemplate ? (
          <form className="space-y-4 p-4" onSubmit={handleUpdateTemplate}>
            {labelFields}
            <FormField
              label={t("amount")}
              error={editTemplateForm.formState.errors.amount?.message}
            >
              <input
                type="number"
                step="0.01"
                min="0"
                className={amountInputClass}
                {...editTemplateForm.register("amount", { valueAsNumber: true })}
              />
            </FormField>
            <FormField label={t("note")} error={editTemplateForm.formState.errors.note?.message}>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                {...editTemplateForm.register("note")}
              />
            </FormField>
            {mutationError != null ? (
              <p className={inlineError}>{getApiErrorMessage(mutationError)}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={btnPrimary} disabled={isPending}>
                {tCommon("save")}
              </button>
              <button
                type="button"
                className={btnSecondary}
                onClick={() => setConfirmDelete(true)}
                disabled={isPending}
              >
                {t("deleteIncome")}
              </button>
            </div>
          </form>
        ) : formMode === "edit-resolved" && editingResolved ? (
          <form className="space-y-4 p-4" onSubmit={handleUpdateResolved}>
            {editingResolved.source === "template" && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {t("monthOverride")}
              </p>
            )}
            {labelFields}
            <FormField label={t("amount")} error={editForm.formState.errors.amount?.message}>
              <input
                type="number"
                step="0.01"
                min="0"
                className={amountInputClass}
                {...editForm.register("amount", { valueAsNumber: true })}
              />
            </FormField>
            <FormField label={t("note")} error={editForm.formState.errors.note?.message}>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                {...editForm.register("note")}
              />
            </FormField>
            {mutationError != null ? (
              <p className={inlineError}>{getApiErrorMessage(mutationError)}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={btnPrimary} disabled={isPending}>
                {tCommon("save")}
              </button>
              {editingResolved.overrideId && (
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => setConfirmDelete(true)}
                  disabled={isPending}
                >
                  {t("deleteIncome")}
                </button>
              )}
            </div>
          </form>
        ) : isRecurringMode ? (
          <form className="space-y-4 p-4" onSubmit={handleCreateTemplate}>
            {tenants.length > 1 && (
              <FormField
                label={t("member")}
                error={createTemplateForm.formState.errors.tenantId?.message}
              >
                <select
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  {...createTemplateForm.register("tenantId")}
                >
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
            {labelFields}
            <FormField
              label={t("amount")}
              error={createTemplateForm.formState.errors.amount?.message}
            >
              <input
                type="number"
                step="0.01"
                min="0"
                className={amountInputClass}
                {...createTemplateForm.register("amount", { valueAsNumber: true })}
              />
            </FormField>
            <FormField label={t("note")} error={createTemplateForm.formState.errors.note?.message}>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                {...createTemplateForm.register("note")}
              />
            </FormField>
            <input type="hidden" {...createTemplateForm.register("householdId")} />
            <input type="hidden" {...createTemplateForm.register("label")} />
            {mutationError != null ? (
              <p className={inlineError}>{getApiErrorMessage(mutationError)}</p>
            ) : null}
            <button type="submit" className={btnPrimary} disabled={isPending}>
              {t("addIncome")}
            </button>
          </form>
        ) : (
          <form className="space-y-4 p-4" onSubmit={handleCreate}>
            {formMode === "create-month" && (
              <div className="flex gap-4 rounded-lg border border-border p-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={recurring}
                    onChange={() => setRecurring(true)}
                  />
                  {t("everyMonth")}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!recurring}
                    onChange={() => setRecurring(false)}
                  />
                  {t("thisMonthOnly")}
                </label>
              </div>
            )}
            {tenants.length > 1 && (
              <FormField label={t("member")} error={createForm.formState.errors.tenantId?.message}>
                <select
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  {...createForm.register("tenantId")}
                >
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
            {labelFields}
            <FormField label={t("amount")} error={createForm.formState.errors.amount?.message}>
              <input
                type="number"
                step="0.01"
                min="0"
                className={amountInputClass}
                {...createForm.register("amount", { valueAsNumber: true })}
              />
            </FormField>
            <FormField label={t("note")} error={createForm.formState.errors.note?.message}>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                {...createForm.register("note")}
              />
            </FormField>
            <input type="hidden" {...createForm.register("month")} />
            <input type="hidden" {...createForm.register("householdId")} />
            <input type="hidden" {...createForm.register("label")} />
            {mutationError != null ? (
              <p className={inlineError}>{getApiErrorMessage(mutationError)}</p>
            ) : null}
            <button type="submit" className={btnPrimary} disabled={isPending}>
              {t("addIncome")}
            </button>
          </form>
        )}
      </Modal>
      <ConfirmModal
        isOpen={confirmDelete}
        title={t("deleteIncome")}
        message={t("deleteConfirm")}
        variant="danger"
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
        onConfirm={() => {
          if (formMode === "edit-template" && editingTemplate) {
            deleteTemplateMutation.mutate(editingTemplate.id);
          } else if (editingResolved?.overrideId) {
            deleteMutation.mutate(editingResolved.overrideId);
          }
        }}
        onCancel={() => setConfirmDelete(false)}
        isLoading={deleteMutation.isPending || deleteTemplateMutation.isPending}
      />
    </>
  );
}
