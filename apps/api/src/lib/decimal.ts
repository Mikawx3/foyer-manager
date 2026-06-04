import { Prisma } from "@prisma/client";

export function decimalToNumber(value: Prisma.Decimal): number {
  return value.toNumber();
}

export function numberToDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
