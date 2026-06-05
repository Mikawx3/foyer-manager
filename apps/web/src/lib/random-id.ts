/**
 * Generates a UUID v4. Uses crypto.randomUUID when available (secure contexts),
 * otherwise falls back to getRandomValues — required for HTTP dev on mobile (e.g. LAN IP).
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const byte6 = bytes[6] ?? 0;
    const byte8 = bytes[8] ?? 0;
    bytes[6] = (byte6 & 0x0f) | 0x40;
    bytes[8] = (byte8 & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
