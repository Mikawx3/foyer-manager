import { CircleAlert, CircleCheck } from "lucide-react";
import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      offset={16}
      duration={4000}
      visibleToasts={3}
      closeButton={false}
      gap={10}
      icons={{
        success: <CircleCheck className="h-4 w-4 text-positive" strokeWidth={2.25} aria-hidden />,
        error: <CircleAlert className="h-4 w-4 text-negative" strokeWidth={2.25} aria-hidden />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "app-toast w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface px-4 py-3 shadow-lg",
          title: "text-sm font-medium tracking-tight text-stone-900",
          description: "text-sm text-stone-600",
          success: "app-toast-success border-positive/20 bg-positive/5",
          error: "app-toast-error border-negative/20 bg-negative/5",
        },
      }}
    />
  );
}
