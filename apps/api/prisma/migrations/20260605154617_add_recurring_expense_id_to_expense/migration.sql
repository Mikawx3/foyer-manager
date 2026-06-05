-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "recurringExpenseId" TEXT;

-- CreateIndex
CREATE INDEX "Expense_recurringExpenseId_idx" ON "Expense"("recurringExpenseId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recurringExpenseId_fkey" FOREIGN KEY ("recurringExpenseId") REFERENCES "RecurringExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
