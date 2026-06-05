import { randomUUID } from "node:crypto";

export function generateMemberEmail(): string {
  return `${randomUUID()}@members.foyer.local`;
}
