import type { CategoryColorKey } from "@foyer/types";
import { useTranslation } from "react-i18next";
import {
  CATEGORY_COLOR_KEYS,
  getCategoryHex,
  pickUnusedCategoryColor,
} from "../../lib/category-colors.ts";

interface CategoryColorPickerProps {
  value: CategoryColorKey;
  usedColors: CategoryColorKey[];
  onChange: (color: CategoryColorKey) => void;
}

export function CategoryColorPicker({ value, usedColors, onChange }: CategoryColorPickerProps) {
  const { t } = useTranslation("expenses");

  const suggestedDefault = pickUnusedCategoryColor(usedColors);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-stone-700">{t("categoryColor")}</p>
      <div className="flex flex-wrap gap-2">
        {CATEGORY_COLOR_KEYS.map((colorKey) => {
          const isUsed = usedColors.includes(colorKey) && colorKey !== value;
          const isSelected = value === colorKey;
          return (
            <button
              key={colorKey}
              type="button"
              aria-label={t("categoryColorOption", { color: colorKey })}
              aria-pressed={isSelected}
              title={isUsed ? t("categoryColorInUse") : undefined}
              className={`h-8 w-8 rounded-full border-2 transition ${
                isSelected ? "border-stone-900 ring-2 ring-stone-300" : "border-transparent"
              } ${isUsed ? "opacity-40" : "opacity-100"}`}
              style={{ backgroundColor: getCategoryHex(colorKey) }}
              onClick={() => onChange(colorKey)}
            />
          );
        })}
      </div>
      {value === suggestedDefault && usedColors.length > 0 && (
        <p className="text-xs text-stone-500">{t("categoryColorSuggested")}</p>
      )}
    </div>
  );
}

export function getDefaultCategoryColor(usedColors: CategoryColorKey[]): CategoryColorKey {
  return pickUnusedCategoryColor(usedColors);
}
