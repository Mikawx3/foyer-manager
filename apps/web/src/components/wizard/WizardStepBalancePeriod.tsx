import type { SettlementPeriod } from "@foyer/types";
import { useTranslation } from "react-i18next";
import { WizardCard } from "./WizardCard.tsx";

interface WizardStepBalancePeriodProps {
  value: SettlementPeriod;
  onChange: (period: SettlementPeriod) => void;
}

const options: { value: SettlementPeriod; emoji: string; titleKey: string; descriptionKey: string }[] = [
  {
    value: "monthly",
    emoji: "📅",
    titleKey: "balancePeriodMonthlyTitle",
    descriptionKey: "balancePeriodMonthlyDescription",
  },
  {
    value: "quarterly",
    emoji: "🗓️",
    titleKey: "balancePeriodQuarterlyTitle",
    descriptionKey: "balancePeriodQuarterlyDescription",
  },
  {
    value: "yearly",
    emoji: "📆",
    titleKey: "balancePeriodYearlyTitle",
    descriptionKey: "balancePeriodYearlyDescription",
  },
  {
    value: "none",
    emoji: "♾️",
    titleKey: "balancePeriodNoneTitle",
    descriptionKey: "balancePeriodNoneDescription",
  },
];

export function WizardStepBalancePeriod({ value, onChange }: WizardStepBalancePeriodProps) {
  const { t } = useTranslation("wizard");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">
          {t("balancePeriodTitle")}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {options.map((option) => (
          <WizardCard
            key={option.value}
            selected={value === option.value}
            onClick={() => onChange(option.value)}
            emoji={option.emoji}
            title={t(option.titleKey)}
            description={t(option.descriptionKey)}
          />
        ))}
      </div>
    </div>
  );
}
