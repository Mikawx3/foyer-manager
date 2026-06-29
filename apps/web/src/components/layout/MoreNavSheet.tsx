import { MoreHorizontal, Settings, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Modal } from "../ui/Modal.tsx";

interface MoreNavSheetProps {
  householdId: string;
  open: boolean;
  onClose: () => void;
}

const moreItems = [
  { to: "income", labelKey: "income", icon: TrendingUp },
  { to: "settings", labelKey: "settings", icon: Settings },
] as const;

export function MoreNavSheet({ householdId, open, onClose }: MoreNavSheetProps) {
  const { t } = useTranslation("nav");
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(`/households/${householdId}/${path}`);
    onClose();
  };

  return (
    <Modal title={t("moreMenu")} open={open} onClose={onClose}>
      <nav className="space-y-1 p-4" aria-label={t("moreMenu")}>
        {moreItems.map(({ to, labelKey, icon: Icon }) => {
          const href = `/households/${householdId}/${to}`;
          const isActive =
            location.pathname === href || location.pathname.startsWith(`${href}/`);

          return (
            <button
              key={to}
              type="button"
              onClick={() => handleNavigate(to)}
              className={`flex w-full min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition active:opacity-80 ${
                isActive
                  ? "bg-primary text-white"
                  : "text-stone-700 hover:bg-stone-100"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              {t(labelKey)}
            </button>
          );
        })}
      </nav>
    </Modal>
  );
}

interface MoreTabButtonProps {
  isActive: boolean;
  onClick: () => void;
}

export function MoreTabButton({ isActive, onClick }: MoreTabButtonProps) {
  const { t } = useTranslation("nav");

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium transition active:opacity-70 ${
        isActive ? "text-primary" : "text-stone-500"
      }`}
    >
      <MoreHorizontal
        className={`h-5 w-5 shrink-0 ${isActive ? "text-primary" : "text-stone-500"}`}
        strokeWidth={isActive ? 2.5 : 2}
        aria-hidden
      />
      <span className={isActive ? "text-primary" : "text-stone-600"}>{t("more")}</span>
      {isActive && (
        <span className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+2px)] h-0.5 w-8 rounded-full bg-primary" />
      )}
    </button>
  );
}
