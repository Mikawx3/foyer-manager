import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLogo } from "../components/brand/AppLogo.tsx";
import { FormField, inputClassName } from "../components/forms/FormField.tsx";
import { getApiErrorMessage, register } from "../lib/api.ts";
import { setToken } from "../lib/auth-storage.ts";
import { btnPrimary, formCard, inlineError } from "../lib/ui-classes.ts";

export function RegisterPage() {
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4">
      <div className="mb-8 flex items-center gap-3">
        <AppLogo />
        <span className="text-xl font-semibold tracking-tight text-stone-900">Foyer Manager</span>
      </div>
      <form onSubmit={handleSubmit} className={`${formCard} w-full max-w-md`}>
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">Create account</h1>
        <p className="text-sm text-stone-600">Set up your household in a few steps.</p>
        <FormField label="Email">
          <input
            className={inputClassName}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </FormField>
        <FormField label="Password">
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
        <FormField label="Household name">
          <input
            className={inputClassName}
            value={householdName}
            onChange={(event) => setHouseholdName(event.target.value)}
            required
            placeholder="e.g. Our apartment"
          />
        </FormField>
        {mutation.isError && (
          <p className={inlineError}>{getApiErrorMessage(mutation.error)}</p>
        )}
        <button type="submit" disabled={mutation.isPending} className={`${btnPrimary} w-full`}>
          {mutation.isPending ? "Creating…" : "Create account"}
        </button>
        <p className="text-center text-sm text-stone-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:text-primary-hover">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
