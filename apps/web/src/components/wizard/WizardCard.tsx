import type { ReactNode } from "react";
import { cardInteractive } from "../../lib/ui-classes.ts";

interface WizardCardProps {
  selected: boolean;
  onClick: () => void;
  emoji: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function WizardCard({
  selected,
  onClick,
  emoji,
  title,
  description,
  children,
}: WizardCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${cardInteractive} w-full p-6 text-left transition active:scale-[0.99] ${
        selected ? "border-primary ring-2 ring-primary/20" : ""
      }`}
    >
      <span className="text-3xl" aria-hidden>
        {emoji}
      </span>
      <p className="mt-4 text-base font-semibold tracking-tight text-stone-900">{title}</p>
      <p className="mt-2 text-sm text-stone-600">{description}</p>
      {children}
    </button>
  );
}
