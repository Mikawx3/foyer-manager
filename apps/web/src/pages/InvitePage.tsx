import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FormField, inputClassName } from "../components/forms/FormField.tsx";
import { AppHeader } from "../components/layout/AppHeader.tsx";
import { PublicFooter } from "../components/layout/PublicChrome.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import {
  acceptInvite,
  getApiErrorMessage,
  getInvitePreview,
  registerWithInvite,
} from "../lib/api.ts";
import { resolveAuthDestination } from "../lib/auth-navigation.ts";
import { getToken, setToken } from "../lib/auth-storage.ts";
import { btnPrimary, btnSecondary, formCard, inlineError } from "../lib/ui-classes.ts";

export function InvitePage() {
  const { token = "" } = useParams<{ token: string }>();
  const { t } = useTranslation("auth");
  const { t: tCommon } = useTranslation("common");
  const navigate = useNavigate();
  const signedIn = Boolean(getToken());
  const [guestName, setGuestName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const previewQuery = useQuery({
    queryKey: ["invite", token],
    queryFn: () => getInvitePreview(token),
    enabled: token.length > 0,
    retry: false,
  });

  const goToHousehold = async (householdId: string, sessionToken: string | null) => {
    if (sessionToken) {
      setToken(sessionToken);
    }
    const path = await resolveAuthDestination(householdId);
    navigate(path, { replace: true });
  };

  const guestMutation = useMutation({
    mutationFn: () => acceptInvite(token, { mode: "guest", name: guestName.trim() }),
    onSuccess: (response) => {
      void goToHousehold(response.householdId, response.token);
    },
  });

  const memberMutation = useMutation({
    mutationFn: () => acceptInvite(token, { mode: "member" }),
    onSuccess: (response) => {
      void goToHousehold(response.householdId, response.token);
    },
  });

  const registerMutation = useMutation({
    mutationFn: () =>
      registerWithInvite(token, { email: email.trim(), password }),
    onSuccess: (response) => {
      void goToHousehold(response.householdId, response.token);
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <AppHeader homeTo="/" />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className={`${formCard} w-full max-w-md`}>
          {previewQuery.isLoading && <ListSkeleton rows={3} />}
          {previewQuery.isError && (
            <ErrorMessage message={getApiErrorMessage(previewQuery.error)} />
          )}
          {previewQuery.isSuccess && (
            <>
              <h1 className="text-xl font-semibold tracking-tight text-stone-900">
                {t("inviteTitle", { name: previewQuery.data.householdName })}
              </h1>
              <p className="mt-2 text-sm text-stone-600">{t("inviteBody")}</p>

              {signedIn ? (
                <div className="mt-6">
                  <button
                    type="button"
                    className={`${btnPrimary} w-full`}
                    disabled={memberMutation.isPending}
                    onClick={() => memberMutation.mutate()}
                  >
                    {t("joinWithAccount")}
                  </button>
                  {memberMutation.isError && (
                    <p className={inlineError}>{getApiErrorMessage(memberMutation.error)}</p>
                  )}
                </div>
              ) : (
                <div className="mt-6 space-y-8">
                  <form
                    className="space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      guestMutation.mutate();
                    }}
                  >
                    <FormField label={t("guestName")}>
                      <input
                        className={inputClassName}
                        value={guestName}
                        onChange={(event) => setGuestName(event.target.value)}
                        required
                        maxLength={80}
                      />
                    </FormField>
                    <button
                      type="submit"
                      className={`${btnSecondary} w-full`}
                      disabled={guestMutation.isPending}
                    >
                      {t("continueAsGuest")}
                    </button>
                    {guestMutation.isError && (
                      <p className={inlineError}>{getApiErrorMessage(guestMutation.error)}</p>
                    )}
                  </form>

                  <form
                    className="space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      registerMutation.mutate();
                    }}
                  >
                    <p className="text-sm font-medium text-stone-900">{t("joinByCreatingAccount")}</p>
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
                      disabled={registerMutation.isPending}
                    >
                      {t("createAccountAndJoin")}
                    </button>
                    {registerMutation.isError && (
                      <p className={inlineError}>{getApiErrorMessage(registerMutation.error)}</p>
                    )}
                  </form>

                  <p className="text-sm text-stone-600">
                    {tCommon("alreadyHaveAccount")}{" "}
                    <Link
                      to="/login"
                      state={{ from: `/invite/${token}` }}
                      className="font-medium text-primary"
                    >
                      {tCommon("signInLink")}
                    </Link>
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
