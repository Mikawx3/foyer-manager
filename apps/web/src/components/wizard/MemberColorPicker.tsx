import { TENANT_COLOR_PRESETS } from "../../lib/tenant-colors.ts";

interface MemberColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function MemberColorPicker({ value, onChange }: MemberColorPickerProps) {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Member color">
      {TENANT_COLOR_PRESETS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Color ${color}`}
          aria-pressed={value === color}
          onClick={() => onChange(color)}
          className={`h-6 w-6 rounded-full border-2 transition ${
            value === color ? "border-stone-900 scale-110" : "border-transparent"
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
