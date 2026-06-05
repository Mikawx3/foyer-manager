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

export function isValidTenantColor(value: string): value is TenantColorPreset {
  return (TENANT_COLOR_PRESETS as readonly string[]).includes(value);
}
