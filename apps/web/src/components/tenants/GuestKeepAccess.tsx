import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthOrDivider, GoogleAuthButton } from "../auth/GoogleAuthButton.tsx";
import { FormField, inputClassName } from "../forms/FormField.tsx";
import {
  getApiErrorMessage,
  isExistingAccountConflict,
  loginWithGoogle,
  upgradeGuestAccount,
} from "../../lib/api.ts";
import { setToken } from "../../lib/auth-storage.ts";
import { clearGuestMemberSession } from "../../lib/guest-member.ts";
import { queryKeys } from "../../lib/query-keys.ts";
import { showMutationSuccess } from "../../lib/toast.ts";
import { btnPrimary, btnSecondary, inlineError } from "../../lib/ui-classes.ts";
import { Modal } from "../ui/Modal.tsx";

interface GuestKeepAccessProps {
  open: boolean;
  onClose: () => void;
  householdId: string;
  tenantId?: string;
  googleClientId: string | null;
}

export function GuestKeepAccess({
  open,
  onClose,
  householdId,
  tenantId,
  googleClientId,
}: GuestKeepAccessProps) {
  const { t } = useTranslation("auth");
  const { t: tCommon } = useTranslation("common");
  const { t: tToast } = useTranslation("toast");
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);

  const finish = async (token: string | null) => {
    if (token) {
      setToken(token);
    }
    clearGuestMemberSession();
    setPendingGoogleToken(null);
    showMutationSuccess(tToast("memberLinked"));
    await queryClient.invalidateQueries({ queryKey: queryKeys.me });
    await queryClient.invalidateQueries({ queryKey: queryKeys.tenants(householdId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.households });
    onClose();
  };

  const emailMutation = useMutation({
    mutationFn: () =>
      upgradeGuestAccount(householdId, {
        email: email.trim(),
        password,
        ...(tenantId ? { tenantId } : {}),
      }),
    onSuccess: (response) => {
      void finish(response.token);
    },
  });

  const googleMutation = useMutation({
    mutationFn: (input: { idToken: string; confirmExistingAccount?: boolean }) =>
      loginWithGoogle(input),
    onSuccess: (response) => {
      void finish(response.token);
    },
    onError: (error, variables) => {
      if (isExistingAccountConflict(error)) {
        setPendingGoogleToken(variables.idToken);
      }
    },
  });

  return (
    <Modal title={t("keepAccessTitle")} open={open} onClose={onClose}>
      <p className="text-sm text-stone-600">{t("keepAccessHint")}</p>
      {pendingGoogleToken ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-stone-900">{t("existingAccountBody")}</p>
          <button
            type="button"
            className={`${btnPrimary} w-full`}
            disabled={googleMutation.isPending}
            onClick={() =>
              googleMutation.mutate({
                idToken: pendingGoogleToken,
                confirmExistingAccount: true,
              })
            }
          >
            {t("existingAccountConfirm")}
          </button>
          <button
            type="button"
            className={`${btnSecondary} w-full`}
            onClick={() => setPendingGoogleToken(null)}
          >
            {tCommon("cancel")}
          </button>
          {googleMutation.isError && !isExistingAccountConflict(googleMutation.error) && (
            <p className={inlineError}>{getApiErrorMessage(googleMutation.error)}</p>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {googleClientId && (
            <>
              <GoogleAuthButton
                clientId={googleClientId}
                context="signup"
                disabled={googleMutation.isPending || emailMutation.isPending}
                onCredential={(idToken) => googleMutation.mutate({ idToken })}
              />
              {googleMutation.isError && !isExistingAccountConflict(googleMutation.error) && (
                <p className={inlineError}>{getApiErrorMessage(googleMutation.error)}</p>
              )}
              <AuthOrDivider />
            </>
          )}
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              emailMutation.mutate();
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
            <button
              type="submit"
              className={`${btnPrimary} w-full`}
              disabled={emailMutation.isPending || googleMutation.isPending}
            >
              {t("keepNameButton")}
            </button>
            {emailMutation.isError && (
              <p className={inlineError}>{getApiErrorMessage(emailMutation.error)}</p>
            )}
          </form>
          <button type="button" className={`${btnSecondary} w-full`} onClick={onClose}>
            {t("keepAccessLater")}
          </button>
        </div>
      )}
    </Modal>
  );
}
