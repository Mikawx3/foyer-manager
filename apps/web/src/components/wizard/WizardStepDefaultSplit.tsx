import type { SplitMode, WizardMember } from "../../lib/household-wizard-types.ts";
import { equalSplitPercentages } from "../../lib/split-percentages.ts";
import { isPercentageTotalComplete } from "../../lib/smart-percentages.ts";
import { SmartPercentageInputs } from "../forms/SmartPercentageInputs.tsx";
import { WizardCard } from "./WizardCard.tsx";

interface WizardStepDefaultSplitProps {
  members: WizardMember[];
  splitMode: SplitMode;
  customSplits: Record<string, number>;
  error?: string;
  onSplitModeChange: (mode: SplitMode) => void;
  onCustomSplitsChange: (splits: Record<string, number>) => void;
}

export function WizardStepDefaultSplit({
  members,
  splitMode,
  customSplits,
  error,
  onSplitModeChange,
  onCustomSplitsChange,
}: WizardStepDefaultSplitProps) {
  const filledMembers = members.filter((member) => member.name.trim().length > 0);
  const memberCount = filledMembers.length;
  const equalPreview = equalSplitPercentages(memberCount);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">
          How do you usually split expenses?
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <WizardCard
          selected={splitMode === "equal"}
          onClick={() => onSplitModeChange("equal")}
          emoji="⚖️"
          title="Equal split"
          description="Split every expense equally between all members"
        />
        <WizardCard
          selected={splitMode === "custom"}
          onClick={() => onSplitModeChange("custom")}
          emoji="✏️"
          title="Custom split"
          description="Set a percentage for each member"
        />
      </div>

      {splitMode === "equal" && memberCount > 0 && (
        <ul className="rounded-lg border border-border bg-bg px-4 py-3 text-sm text-stone-700">
          {filledMembers.map((member, index) => (
            <li key={member.tempId} className="flex items-center gap-2 py-1">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: member.color }}
              />
              {member.name} — {equalPreview[index] ?? 0}%
            </li>
          ))}
        </ul>
      )}

      {splitMode === "custom" && (
        <SmartPercentageInputs
          items={filledMembers.map((member) => ({
            id: member.tempId,
            label: member.name,
          }))}
          values={customSplits}
          onChange={onCustomSplitsChange}
        />
      )}

      {error && <p className="text-sm text-negative">{error}</p>}
      {splitMode === "custom" && !isPercentageTotalComplete(
        Object.values(customSplits).reduce((sum, value) => sum + value, 0),
      ) && (
        <p className="text-sm text-stone-500">Percentages must total 100% to continue.</p>
      )}
    </div>
  );
}
