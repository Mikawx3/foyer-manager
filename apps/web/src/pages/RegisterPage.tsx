import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { FormField, inputClassName } from "../components/forms/FormField.tsx";
import { AppHeader } from "../components/layout/AppHeader.tsx";
import { getApiErrorMessage, register } from "../lib/api.ts";
import { setToken } from "../lib/auth-storage.ts";
import { btnPrimary, formCard, inlineError } from "../lib/ui-classes.ts";

export function RegisterPage() {
  const { t } = useTranslation("auth");
  const { t: tCommon } = useTranslation("common");
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    mutation.mutate({
      email: email.trim(),
      password,
      householdName: householdName.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader />
      <div className="flex flex-col items-center justify-center px-4 py-12">
        <form onSubmit={handleSubmit} className={`${formCard} w-full max-w-md`}>
          <h1 className="text-xl font-semibold tracking-tight text-stone-900">{t("createAccount")}</h1>
          <p className="text-sm text-stone-600">{t("createAccountSubtitle")}</p>
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
          <FormField label={t("householdName")}>
            <input
              className={inputClassName}
              value={householdName}
              onChange={(event) => setHouseholdName(event.target.value)}
              required
              placeholder={t("householdNamePlaceholder")}
            />
          </FormField>
          {mutation.isError && (
            <p className={inlineError}>{getApiErrorMessage(mutation.error)}</p>
          )}
          <button type="submit" disabled={mutation.isPending} className={`${btnPrimary} w-full`}>
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
  );
}
