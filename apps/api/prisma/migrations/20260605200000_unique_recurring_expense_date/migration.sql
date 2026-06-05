-- Remove duplicate auto-generated expenses before enforcing uniqueness.
DELETE FROM "Expense" AS duplicate
USING "Expense" AS keeper
WHERE duplicate."recurringExpenseId" IS NOT NULL
  AND keeper."recurringExpenseId" = duplicate."recurringExpenseId"
  AND keeper.date = duplicate.date
  AND keeper.id < duplicate.id;

-- Prevent duplicate auto-generated expenses for the same recurring rule and due date.
CREATE UNIQUE INDEX "Expense_recurringExpenseId_date_key"
ON "Expense"("recurringExpenseId", "date")
WHERE "recurringExpenseId" IS NOT NULL;
