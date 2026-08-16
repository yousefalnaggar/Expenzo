import { getExpenses } from "@/lib/dal/expenses";
import { getCategories } from "@/lib/dal/categories";
import { getUserPreferredCurrency } from "@/lib/dal/users";
import { getAllExchangeRates, type Currency } from "@/lib/exchange-rates";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpensePagination } from "@/components/expenses/expense-pagination";
import { createExpense } from "@/lib/actions/expense-actions";
import { Button } from "@/components/ui/button";

type SearchParams = {
  search?: string;
  categoryId?: string;
  from?: string;
  to?: string;
  page?: string;
  sortBy?: string;
  sortOrder?: string;
};

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const sortBy = params.sortBy === "amount" ? "amount" : "date";
  const sortOrder = params.sortOrder === "asc" ? "asc" : "desc";

  const currencyRaw = await getUserPreferredCurrency();
  const currency = currencyRaw as Currency;
  const [{ items: expenses, total, pageSize }, categories, rates] = await Promise.all([
    getExpenses({
      search: params.search,
      categoryId: params.categoryId,
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? new Date(params.to) : undefined,
      page,
      sortBy,
      sortOrder,
    }),
    getCategories(),
    getAllExchangeRates(),
  ]);

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
          currency={currency}
        />
      </div>
      <ExpenseFilters categories={categories} />
      {expenses.length === 0 && total === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {params.search || params.categoryId || params.from || params.to
            ? "No expenses match these filters."
            : "No expenses yet. Add your first one to get started."}
        </p>
      ) : (
        <>
          <ExpenseTable
            expenses={expenses}
            categories={categories}
            sortBy={sortBy}
            sortOrder={sortOrder}
            searchParams={params}
            currency={currency}
            rates={rates}
          />
          <ExpensePagination page={page} pageSize={pageSize} total={total} searchParams={params} />
        </>
      )}
    </div>
  );
}
