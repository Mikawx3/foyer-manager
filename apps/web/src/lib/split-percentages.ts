export function sumPercentages(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

export function percentagesSumTo100(values: number[]): boolean {
  return sumPercentages(values) === 100;
}

export function equalSplitPercentages(tenantCount: number): number[] {
  if (tenantCount === 0) {
    return [];
  }
  const per = Math.floor(100 / tenantCount);
  const percentages = Array.from({ length: tenantCount }, () => per);
  percentages[tenantCount - 1] = 100 - per * (tenantCount - 1);
  return percentages;
}

export function buildPercentageMapFromRules(
  tenantIds: string[],
  rules: { tenantId: string; percentage: number }[],
): Record<string, number> {
  if (rules.length === 0) {
    const percentages = equalSplitPercentages(tenantIds.length);
    return Object.fromEntries(tenantIds.map((id, index) => [id, percentages[index] ?? 0]));
  }

  const map: Record<string, number> = Object.fromEntries(tenantIds.map((id) => [id, 0]));
  for (const rule of rules) {
    if (tenantIds.includes(rule.tenantId)) {
      map[rule.tenantId] = rule.percentage;
    }
  }
  return map;
}
