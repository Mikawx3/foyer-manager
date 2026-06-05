import { TENANT_COLOR_PRESETS } from "../../lib/tenant-colors.ts";

interface MemberColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function MemberColorPicker({ value, onChange }: MemberColorPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Member color">
      {TENANT_COLOR_PRESETS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Color ${color}`}
          aria-pressed={value === color}
          onClick={() => onChange(color)}
          className={`h-10 w-10 rounded-full border-2 transition active:scale-95 md:h-6 md:w-6 ${
            value === color ? "border-stone-900 scale-110" : "border-transparent"
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
