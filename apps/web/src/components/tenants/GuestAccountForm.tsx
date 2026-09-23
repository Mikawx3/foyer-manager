import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormField, inputClassName } from "../forms/FormField.tsx";
import { getApiErrorMessage, upgradeGuestAccount } from "../../lib/api.ts";
import { setToken } from "../../lib/auth-storage.ts";
import { clearGuestMemberSession } from "../../lib/guest-member.ts";
import { queryKeys } from "../../lib/query-keys.ts";
import { showMutationSuccess } from "../../lib/toast.ts";
import { btnPrimary, inlineError } from "../../lib/ui-classes.ts";

interface GuestAccountFormProps {
  householdId: string;
  tenantId: string;
  memberName: string;
}

export function GuestAccountForm({ householdId, tenantId, memberName }: GuestAccountFormProps) {
  const { t } = useTranslation("auth");
  const { t: tCommon } = useTranslation("common");
  const { t: tToast } = useTranslation("toast");
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      upgradeGuestAccount(householdId, {
        email: email.trim(),
        password,
        tenantId,
      }),
    onSuccess: async (response) => {
      if (response.token) {
        setToken(response.token);
      }
      clearGuestMemberSession();
      showMutationSuccess(tToast("memberLinked"));
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tenants(householdId) });
    },
  });

  return (
    <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <p className="text-sm font-medium text-stone-900">{t("keepNameTitle", { name: memberName })}</p>
      <p className="mt-1 text-sm text-stone-600">{t("keepNameHint", { name: memberName })}</p>
      {!open ? (
        <button type="button" className={`${btnPrimary} mt-3`} onClick={() => setOpen(true)}>
          {t("keepNameButton")}
        </button>
      ) : (
        <form
          className="mt-3 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <FormField label={tCommon("email")}>
            <input
              className={inputClassName}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </FormField>
          <FormField label={tCommon("password")}>
            <input
              className={inputClassName}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </FormField>
          <button type="submit" className={btnPrimary} disabled={mutation.isPending}>
            {t("createAccountAndJoin")}
          </button>
          {mutation.isError && (
            <p className={inlineError}>{getApiErrorMessage(mutation.error)}</p>
          )}
        </form>
      )}
    </div>
  );
}
