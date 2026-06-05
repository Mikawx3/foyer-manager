import { useTranslation } from "react-i18next";
import type { WizardStep } from "../../lib/household-wizard-types.ts";

interface WizardProgressBarProps {
  step: WizardStep;
}

export function WizardProgressBar({ step }: WizardProgressBarProps) {
  const { t } = useTranslation("common");
  const progress = (step / 6) * 100;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-stone-600">
        {t("stepOf", { step, total: 6 })}
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
