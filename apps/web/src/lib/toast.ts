import { isAxiosError } from "axios";
import { toast } from "sonner";
import { getApiErrorMessage } from "./api.ts";

export function showMutationError(error: unknown): void {
  if (isAxiosError(error)) {
    if (!error.response) {
      toast.error("Cannot reach the server. Check your connection.");
      return;
    }

    const status = error.response.status;

    if (status === 409) {
      toast.error("Already exists");
      return;
    }

    if (status >= 500) {
      toast.error("Something went wrong. Please try again.");
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
