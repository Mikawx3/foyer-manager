import type { HouseholdType } from "@foyer/types";
import { WizardCard } from "./WizardCard.tsx";

interface WizardStepTypeProps {
  value: HouseholdType | null;
  onSelect: (type: HouseholdType) => void;
}

export function WizardStepType({ value, onSelect }: WizardStepTypeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">
          What kind of household is this?
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <WizardCard
          selected={value === "solo"}
          onClick={() => onSelect("solo")}
          emoji="🏠"
          title="Solo"
          description="Just me, I want to track my own expenses"
        />
        <WizardCard
          selected={value === "shared"}
          onClick={() => onSelect("shared")}
          emoji="👥"
          title="Shared"
          description="Multiple people, split expenses together"
        />
      </div>
    </div>
  );
}
