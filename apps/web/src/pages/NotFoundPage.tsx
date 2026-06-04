import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { btnPrimary } from "../lib/ui-classes.ts";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <Home className="mb-4 h-10 w-10 text-stone-400" strokeWidth={1.5} aria-hidden />
      <p className="text-6xl font-bold text-stone-200">404</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-stone-600">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <button
        type="button"
        className={`${btnPrimary} mt-8`}
        onClick={() => navigate("/")}
      >
        Go to households
      </button>
    </div>
  );
}
