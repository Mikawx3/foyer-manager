export type ProductEvent =
  | { name: "signup_started" }
  | { name: "account_created"; method: "email" | "google" | "invite" }
  | { name: "guest_joined" }
  | { name: "guest_converted" }
  | { name: "household_created"; type: "solo" | "shared" }
  | { name: "invite_created" };

/** One JSON line per event, searchable in the hosting logs. Never include personal data. */
export function logProductEvent(event: ProductEvent): void {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  console.info(JSON.stringify({ kind: "product_event", at: new Date().toISOString(), ...event }));
}
