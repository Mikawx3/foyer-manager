import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { AuthOrDivider, GoogleAuthButton } from "../components/auth/GoogleAuthButton.tsx";
import { FormField, inputClassName } from "../components/forms/FormField.tsx";
import { AppHeader } from "../components/layout/AppHeader.tsx";
import { PublicFooter } from "../components/layout/PublicChrome.tsx";
import { useDeploymentMode } from "../contexts/DeploymentModeContext.tsx";
import { getApiErrorMessage, loginWithGoogle, register } from "../lib/api.ts";
import { resolveGoogleAuthPath } from "../lib/auth-navigation.ts";
import { setToken } from "../lib/auth-storage.ts";
import { btnPrimary, formCard, inlineError } from "../lib/ui-classes.ts";

export function RegisterPage() {
  const { t } = useTranslation("auth");
  const { t: tCommon } = useTranslation("common");
  const { googleClientId } = useDeploymentMode();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [householdName, setHouseholdName] = useState("");

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: (response) => {
      setToken(response.token);
      navigate(`/households/${response.householdId}/onboarding`, { replace: true });
    },
  });

  const googleMutation = useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: async (response) => {
      setToken(response.token);
      const path = await resolveGoogleAuthPath(response);
      navigate(path, { replace: true });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    mutation.mutate({
      email: email.trim(),
      password,
      householdName: householdName.trim(),
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <AppHeader homeTo="/" />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className={`${formCard} w-full max-w-md`}>
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">{t("createAccount")}</h1>
          <p className="text-sm text-stone-600">{t("createAccountSubtitle")}</p>
          <FormField label={t("householdName")}>
            <input
              className={inputClassName}
              form="register-form"
              value={householdName}
              onChange={(event) => setHouseholdName(event.target.value)}
              required
              placeholder={t("householdNamePlaceholder")}
            />
          </FormField>
          {googleClientId && (
            <>
              <GoogleAuthButton
                clientId={googleClientId}
                context="signup"
                disabled={googleMutation.isPending || mutation.isPending}
                onCredential={(idToken) =>
                  googleMutation.mutate({
                    idToken,
                    householdName: householdName.trim() || undefined,
                  })
                }
              />
              {googleMutation.isError && (
                <p className={inlineError}>{getApiErrorMessage(googleMutation.error)}</p>
              )}
              <AuthOrDivider />
            </>
          )}
          <form id="register-form" onSubmit={handleSubmit} className="space-y-4">
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
          {mutation.isError && (
            <p className={inlineError}>{getApiErrorMessage(mutation.error)}</p>
          )}
          <button
            type="submit"
            disabled={mutation.isPending || googleMutation.isPending}
            className={`${btnPrimary} w-full`}
          >
            {mutation.isPending ? tCommon("creating") : t("createAccountButton")}
          </button>
          <p className="text-center text-sm text-stone-600">
            {tCommon("alreadyHaveAccount")}{" "}
            <Link to="/login" className="font-medium text-primary hover:text-primary-hover">
              {tCommon("signInLink")}
            </Link>
          </p>
          </form>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
