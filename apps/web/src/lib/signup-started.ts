import { postSignupStarted } from "./api.ts";

const STORAGE_KEY = "foyer.signup-started";

let pending = false;

/** One signup start per browser tab. A failed request can be retried on the next visit. */
export async function recordSignupStarted(
  post: () => Promise<void> = postSignupStarted,
  storage: Storage = sessionStorage,
): Promise<boolean> {
  if (storage.getItem(STORAGE_KEY) === "1" || pending) {
    return false;
  }
  pending = true;
  try {
    await post();
    storage.setItem(STORAGE_KEY, "1");
    return true;
  } finally {
    pending = false;
  }
}
