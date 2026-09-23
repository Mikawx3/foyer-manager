import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { inlineError } from "../../lib/ui-classes.ts";

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          type?: "standard";
          theme?: "outline";
          size?: "large";
          text?: "signin_with" | "signup_with";
          shape?: "rectangular";
          width?: number;
          locale?: string;
        },
      ) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

const SCRIPT_ID = "google-identity-services";

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts.id) {
    return Promise.resolve();
  }

  const existing = document.getElementById(SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google sign-in failed to load")), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google sign-in failed to load"));
    document.head.appendChild(script);
  });
}

interface GoogleAuthButtonProps {
  clientId: string;
  context: "signin" | "signup";
  disabled?: boolean;
  onCredential: (idToken: string) => void;
}

export function GoogleAuthButton({
  clientId,
  context,
  disabled = false,
  onCredential,
}: GoogleAuthButtonProps) {
  const { i18n, t } = useTranslation("auth");
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;
  const [loadError, setLoadError] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) {
      return;
    }
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;
    void loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !window.google?.accounts.id) {
          return;
        }
        window.google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: (response) => {
            if (response.credential) {
              onCredentialRef.current(response.credential);
            }
          },
        });
        container.replaceChildren();
        const width = Math.min(
          400,
          Math.max(240, Math.floor(container.getBoundingClientRect().width)),
        );
        window.google.accounts.id.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: context === "signup" ? "signup_with" : "signin_with",
          shape: "rectangular",
          width,
          locale: i18n.resolvedLanguage === "fr" ? "fr" : "en",
        });
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, context, i18n.resolvedLanguage, started]);

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : undefined}>
      {started ? (
        <div ref={containerRef} className="flex min-h-11 w-full justify-center" />
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setStarted(true)}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-base font-medium text-stone-900 hover:bg-stone-50 disabled:opacity-50 md:text-sm"
        >
          {t("continueWithGoogle")}
        </button>
      )}
      {loadError && <p className={inlineError}>{t("googleUnavailable")}</p>}
    </div>
  );
}

export function AuthOrDivider() {
  const { t } = useTranslation("auth");

  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-stone-200" />
      <span className="text-xs font-medium uppercase tracking-wide text-stone-400">{t("or")}</span>
      <span className="h-px flex-1 bg-stone-200" />
    </div>
  );
}
