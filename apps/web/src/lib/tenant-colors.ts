export const TENANT_COLOR_PRESETS = [
  "#01696f",
  "#a12c7b",
  "#d97706",
  "#2563eb",
  "#7c3aed",
  "#059669",
] as const;

export type TenantColorPreset = (typeof TENANT_COLOR_PRESETS)[number];

export const DEFAULT_TENANT_COLOR: TenantColorPreset = TENANT_COLOR_PRESETS[0];

export function nextAvailableColor(usedColors: string[]): TenantColorPreset {
  const available = TENANT_COLOR_PRESETS.find((color) => !usedColors.includes(color));
  return available ?? DEFAULT_TENANT_COLOR;
}
