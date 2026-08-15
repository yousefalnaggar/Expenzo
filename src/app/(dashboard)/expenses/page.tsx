import { getExpenses } from "@/lib/dal/expenses";
import { getCategories } from "@/lib/dal/categories";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { createExpense } from "@/lib/actions/expense-actions";
import { Button } from "@/components/ui/button";

export default async function ExpensesPage() {
  const [{ items: expenses }, categories] = await Promise.all([getExpenses(), getCategories()]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">Expenses</h1>
        <ExpenseDialog
          trigger={<Button>Add expense</Button>}
          title="Add expense"
          submitLabel="Add expense"
          action={createExpense}
          categories={categories}
        />
      </div>
      <ExpenseTable expenses={expenses} categories={categories} />
    </div>
  );
}
