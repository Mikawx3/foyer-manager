import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLogo } from "../components/brand/AppLogo.tsx";
import { FormField, inputClassName } from "../components/forms/FormField.tsx";
import { getApiErrorMessage, login } from "../lib/api.ts";
import { resolvePostLoginPath } from "../lib/auth-navigation.ts";
import { setToken } from "../lib/auth-storage.ts";
import { btnPrimary, formCard, inlineError } from "../lib/ui-classes.ts";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async (response) => {
      setToken(response.token);
      const path = await resolvePostLoginPath();
      navigate(path, { replace: true });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    mutation.mutate({ email: email.trim(), password });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4">
      <div className="mb-8 flex items-center gap-3">
        <AppLogo />
        <span className="text-xl font-semibold tracking-tight text-stone-900">Foyer Manager</span>
      </div>
      <form onSubmit={handleSubmit} className={`${formCard} w-full max-w-md`}>
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">Sign in</h1>
        <p className="text-sm text-stone-600">Access your household and expenses.</p>
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
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
        </FormField>
        {mutation.isError && (
          <p className={inlineError}>{getApiErrorMessage(mutation.error)}</p>
        )}
        <button type="submit" disabled={mutation.isPending} className={`${btnPrimary} w-full`}>
          {mutation.isPending ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-stone-600">
          No account?{" "}
          <Link to="/register" className="font-medium text-primary hover:text-primary-hover">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
