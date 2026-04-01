import { Prisma } from '@prisma/client';

export function decimalToNumber(value: Prisma.Decimal | null): number {
  if (value === null) {
    return 0;
  }

  return Number(value);
}
