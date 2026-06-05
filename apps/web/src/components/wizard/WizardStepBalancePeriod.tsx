import type { SettlementPeriod } from "@foyer/types";
import { WizardCard } from "./WizardCard.tsx";

interface WizardStepBalancePeriodProps {
  value: SettlementPeriod;
  onChange: (period: SettlementPeriod) => void;
}

const options: { value: SettlementPeriod; emoji: string; title: string; description: string }[] = [
  {
    value: "monthly",
    emoji: "📅",
    title: "Monthly",
    description: "Review balances every month",
  },
  {
    value: "quarterly",
    emoji: "🗓️",
    title: "Quarterly",
    description: "Review balances every quarter",
  },
  {
    value: "yearly",
    emoji: "📆",
    title: "Yearly",
    description: "Review balances once a year",
  },
  {
    value: "none",
    emoji: "♾️",
    title: "No period",
    description: "All-time balances only",
  },
];

export function WizardStepBalancePeriod({ value, onChange }: WizardStepBalancePeriodProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">
          How often do you want to review balances?
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option) => (
          <WizardCard
            key={option.value}
            selected={value === option.value}
            onClick={() => onChange(option.value)}
            emoji={option.emoji}
            title={option.title}
            description={option.description}
          />
        ))}
      </div>
    </div>
  );
}
