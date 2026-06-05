import { isAxiosError } from "axios";
import { toast } from "sonner";
import i18n from "../i18n.ts";
import { getApiErrorMessage } from "./api.ts";

export function showMutationError(error: unknown): void {
  if (isAxiosError(error)) {
    if (!error.response) {
      toast.error(i18n.t("errors:cannotReachServer"));
      return;
    }

    const status = error.response.status;

    if (status === 409) {
      toast.error(i18n.t("errors:alreadyExists"));
      return;
    }

    if (status >= 500) {
      toast.error(i18n.t("errors:somethingWentWrongRetry"));
      return;
    }

    if (status === 400) {
      toast.error(getApiErrorMessage(error));
      return;
    }

    toast.error(getApiErrorMessage(error));
    return;
  }

  toast.error(getApiErrorMessage(error));
}

export function showMutationSuccess(message: string): void {
  toast.success(message);
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
