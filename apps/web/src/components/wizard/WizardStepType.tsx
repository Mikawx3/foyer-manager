import type { HouseholdType } from "@foyer/types";
import { useTranslation } from "react-i18next";
import { WizardCard } from "./WizardCard.tsx";

interface WizardStepTypeProps {
  value: HouseholdType | null;
  onSelect: (type: HouseholdType) => void;
}

export function WizardStepType({ value, onSelect }: WizardStepTypeProps) {
  const { t } = useTranslation("wizard");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">
          {t("typeTitle")}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <WizardCard
          selected={value === "solo"}
          onClick={() => onSelect("solo")}
          emoji="🏠"
          title={t("typeSoloTitle")}
          description={t("typeSoloDescription")}
        />
        <WizardCard
          selected={value === "shared"}
          onClick={() => onSelect("shared")}
          emoji="👥"
          title={t("typeSharedTitle")}
          description={t("typeSharedDescription")}
        />
      </div>
    </div>
  );
}
