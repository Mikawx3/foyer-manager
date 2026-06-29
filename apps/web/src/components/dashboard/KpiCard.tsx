import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { kpiAmount, kpiCard, kpiCardInteractive } from "../../lib/ui-classes.ts";

interface KpiCardProps {
  title: string;
  value: ReactNode;
  subtitle?: ReactNode;
  valueClassName?: string;
  to?: string;
}

export function KpiCard({ title, value, subtitle, valueClassName = "", to }: KpiCardProps) {
  const content = (
    <>
      <p className="text-xs font-medium leading-snug text-stone-500">{title}</p>
      <p className={`mt-2 min-w-0 ${kpiAmount} ${valueClassName}`}>{value}</p>
      {subtitle !== undefined && subtitle !== null && (
        <p className="mt-1.5 truncate text-xs leading-snug text-stone-500">{subtitle}</p>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={kpiCardInteractive}>
        {content}
      </Link>
    );
  }

  return <div className={kpiCard}>{content}</div>;
}
