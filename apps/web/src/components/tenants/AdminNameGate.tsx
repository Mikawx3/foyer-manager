import { SOLO_SELF_NAME } from "@foyer/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormField, inputClassName } from "../forms/FormField.tsx";
import { btnPrimary, inlineError } from "../../lib/ui-classes.ts";

export type AdminNameGateMode = "rename" | "choose";

export function adminNameGateMode(
  tenant: { name: string } | null | undefined,
): AdminNameGateMode | null {
  if (!tenant) {
    return "choose";
  }
  if (tenant.name.trim() === SOLO_SELF_NAME) {
    return "rename";
  }
  return null;
}

interface OpenMember {
  id: string;
  name: string;
}

interface AdminNameGateProps {
  mode: AdminNameGateMode;
  openMembers: OpenMember[];
  isPending: boolean;
  error?: string;
  onRename: (name: string) => void;
  onClaim: (tenantId: string) => void;
  onCreate: (name: string) => void;
}

export function AdminNameGate({
  mode,
  openMembers,
  isPending,
  error,
  onRename,
  onClaim,
  onCreate,
}: AdminNameGateProps) {
  const { t } = useTranslation("members");
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    const trimmed = name.trim();
    if (mode === "rename") {
      if (trimmed.length === 0 || trimmed === SOLO_SELF_NAME) {
        setLocalError(t("chooseRealName"));
        return;
      }
      setLocalError(null);
      onRename(trimmed);
      return;
    }

    if (trimmed.length > 0) {
      if (trimmed === SOLO_SELF_NAME) {
        setLocalError(t("chooseRealName"));
        return;
      }
      setLocalError(null);
      onCreate(trimmed);
      return;
    }

    if (!selectedId) {
      setLocalError(t("chooseRealName"));
      return;
    }
    setLocalError(null);
    onClaim(selectedId);
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-stone-50 p-3">
      <p className="text-sm font-medium text-stone-900">
        {mode === "rename" ? t("renameNameTitle") : t("chooseNameTitle")}
      </p>
      <p className="text-sm text-stone-600">
        {mode === "rename" ? t("renameNameHint") : t("chooseNameHint")}
      </p>

      {mode === "choose" && openMembers.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-stone-800">{t("chooseExistingName")}</legend>
          {openMembers.map((member) => (
            <label key={member.id} className="flex min-h-11 items-center gap-3 text-sm text-stone-800">
              <input
                type="radio"
                name="admin-name"
                value={member.id}
                checked={selectedId === member.id && name.trim().length === 0}
                onChange={() => {
                  setSelectedId(member.id);
                  setName("");
                  setLocalError(null);
                }}
              />
              <span className="font-medium">{member.name}</span>
            </label>
          ))}
        </fieldset>
      )}

      <FormField label={t("yourName")}>
        <input
          className={inputClassName}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setSelectedId(null);
            setLocalError(null);
          }}
        />
      </FormField>

      {(localError ?? error) && <p className={inlineError}>{localError ?? error}</p>}

      <button type="button" className={btnPrimary} disabled={isPending} onClick={submit}>
        {t("saveNameAndContinue")}
      </button>
    </div>
  );
}
