import { isAxiosError } from "axios";
import { toast } from "sonner";
import i18n from "../i18n.ts";
import { getApiErrorMessage } from "./api.ts";

export function showMutationError(error: unknown): void {
  if (isAxiosError(error)) {
    if (!error.response) {
      toast.error(i18n.t("errors:cannotReachServer"), { duration: 6000 });
      return;
    }

    const status = error.response.status;

    if (status === 409) {
      toast.error(i18n.t("errors:alreadyExists"), { duration: 6000 });
      return;
    }

    if (status >= 500) {
      toast.error(i18n.t("errors:somethingWentWrongRetry"), { duration: 6000 });
      return;
    }

    if (status === 400) {
      toast.error(getApiErrorMessage(error), { duration: 6000 });
      return;
    }

    toast.error(getApiErrorMessage(error), { duration: 6000 });
    return;
  }

  toast.error(getApiErrorMessage(error), { duration: 6000 });
}

export function showMutationSuccess(message: string): void {
  toast.success(message, { duration: 3500 });
}

export function mutationToastHandlers(options: {
  successMessage: string;
  onSuccess?: () => void;
}): {
  onSuccess: () => void;
  onError: (error: unknown) => void;
} {
  return {
    onSuccess: () => {
      showMutationSuccess(options.successMessage);
      options.onSuccess?.();
    },
    onError: showMutationError,
  };
}
