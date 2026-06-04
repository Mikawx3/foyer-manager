# @foyer/types

Shared TypeScript interfaces for Foyer Manager (Household, Tenant, Category, Expense, ExpenseSplit).

These are API/JSON shapes only. Database persistence is defined in `apps/api/prisma/schema.prisma` (Prisma ORM), not here.

## Build

```bash
npm run build -w @foyer/types
```

Output is written to `dist/`.

## Usage

From any workspace package:

```typescript
import type { Expense, Tenant } from "@foyer/types";
```

Build this package before running or building apps that depend on it.
