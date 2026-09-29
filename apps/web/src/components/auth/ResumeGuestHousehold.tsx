import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getGuestResumeToken, resumeGuestSession } from "../../lib/auth-storage.ts";
import { btnPrimary } from "../../lib/ui-classes.ts";

export function ResumeGuestHousehold() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [available, setAvailable] = useState(() => getGuestResumeToken() !== null);

  if (!available) {
    return null;
  }

  return (
    <div className="mb-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-sm font-medium text-stone-900">{t("resumeGuestTitle")}</p>
      <p className="mt-1 text-sm text-stone-600">{t("resumeGuestHint")}</p>
      <button
        type="button"
        className={`${btnPrimary} mt-3 w-full`}
        onClick={() => {
          if (!resumeGuestSession()) {
            setAvailable(false);
            return;
          }
          navigate("/households", { replace: true });
        }}
      >
        {t("resumeGuestAction")}
      </button>
    </div>
  );
}
