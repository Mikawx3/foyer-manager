import { Trash2 } from "lucide-react";
import type { HouseholdType } from "@foyer/types";
import type { WizardMember } from "../../lib/household-wizard-types.ts";
import { createMemberId } from "../../lib/household-wizard-types.ts";
import { nextAvailableColor } from "../../lib/tenant-colors.ts";
import { btnSecondary } from "../../lib/ui-classes.ts";
import { FormField, inputClassName } from "../forms/FormField.tsx";
import { MemberColorPicker } from "./MemberColorPicker.tsx";

interface WizardStepNameMembersProps {
  type: HouseholdType;
  name: string;
  members: WizardMember[];
  nameError?: string;
  membersError?: string;
  onNameChange: (name: string) => void;
  onMembersChange: (members: WizardMember[]) => void;
}

export function WizardStepNameMembers({
  type,
  name,
  members,
  nameError,
  membersError,
  onNameChange,
  onMembersChange,
}: WizardStepNameMembersProps) {
  const updateMember = (tempId: string, patch: Partial<WizardMember>) => {
    onMembersChange(
      members.map((member) => (member.tempId === tempId ? { ...member, ...patch } : member)),
    );
  };

  const addMember = () => {
    const usedColors = members.map((member) => member.color);
    onMembersChange([
      ...members,
      { tempId: createMemberId(), name: "", color: nextAvailableColor(usedColors) },
    ]);
  };

  const removeMember = (tempId: string) => {
    if (members.length <= 1) {
      return;
    }
    onMembersChange(members.filter((member) => member.tempId !== tempId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">
          Name your household
        </h2>
        {type === "shared" && (
          <p className="mt-1 text-sm text-stone-600">Add the people who share expenses.</p>
        )}
      </div>

      <FormField label="Household name" error={nameError}>
        <input
          className={inputClassName}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="My apartment"
        />
      </FormField>

      {type === "shared" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-stone-800">Members</p>
          <ul className="space-y-3">
            {members.map((member) => (
              <li
                key={member.tempId}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <input
                  className={`${inputClassName} min-w-[140px] flex-1`}
                  value={member.name}
                  onChange={(event) => updateMember(member.tempId, { name: event.target.value })}
                  placeholder="Member name"
                />
                <MemberColorPicker
                  value={member.color}
                  onChange={(color) => updateMember(member.tempId, { color })}
                />
                <button
                  type="button"
                  aria-label="Remove member"
                  disabled={members.length <= 1}
                  onClick={() => removeMember(member.tempId)}
                  className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-800 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          {membersError && <p className="text-sm text-negative">{membersError}</p>}
          <button type="button" className={btnSecondary} onClick={addMember}>
            + Add member
          </button>
        </div>
      )}
    </div>
  );
}
