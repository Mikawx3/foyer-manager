import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { card, cardInteractive } from "../../lib/ui-classes.ts";

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
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{title}</p>
      <p className={`mt-2 text-xl font-semibold tracking-tight text-stone-900 ${valueClassName}`}>
        {value}
      </p>
      {subtitle !== undefined && subtitle !== null && (
        <p className="mt-1 text-sm text-stone-600">{subtitle}</p>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cardInteractive}>
        {content}
      </Link>
    );
  }

  return <div className={card}>{content}</div>;
}
