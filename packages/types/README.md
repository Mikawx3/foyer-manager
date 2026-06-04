# @foyer/types

Shared TypeScript interfaces for Foyer Manager (Tenant, Expense, Category, ExpenseSplit).

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
