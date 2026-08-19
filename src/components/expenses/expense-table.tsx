"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { flexRender, useTable } from "@tanstack/react-table";
import {
  createColumnHelper,
  tableFeatures,
  type RowData,
  type TableFeatures,
} from "@tanstack/table-core";
import { format } from "date-fns";
import { MoreHorizontal, StickyNote } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import { convertCents, type Currency } from "@/lib/currency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { DeleteExpenseDialog } from "@/components/expenses/delete-expense-dialog";
import { updateExpense } from "@/lib/actions/expense-actions";

declare module "@tanstack/table-core" {
  // Type params are unused in the body but required to match the merged interface's arity.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TFeatures extends TableFeatures, TData extends RowData, TValue> {
    align?: "right";
  }
}

const features = tableFeatures({});

type ExpenseRow = Prisma.ExpenseGetPayload<{ include: { category: true } }>;
type Category = { id: string; name: string; color: string };

const columnHelper = createColumnHelper<typeof features, ExpenseRow>();

function NoteButton({ note }: { note: string }) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
          >
            <StickyNote className="size-3.5" />
            <span className="sr-only">View note</span>
          </button>
        }
      />
      <PopoverContent>
        <p className="text-muted-foreground mb-1 text-xs font-medium">Note</p>
        <p className="whitespace-pre-wrap">{note}</p>
      </PopoverContent>
    </Popover>
  );
}

function CategoryBadge({ category }: { category: Category | null }) {
  if (!category) return <span className="text-muted-foreground">Uncategorized</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: category.color }}
      />
      {category.name}
    </span>
  );
}

function RowActions({ expense, categories }: { expense: ExpenseRow; categories: Category[] }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal />
              <span className="sr-only">Open actions</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExpenseDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit expense"
        submitLabel="Save changes"
        action={updateExpense.bind(null, expense.id)}
        categories={categories}
        // Editing keeps the expense's own original currency and exact
        // amount — no conversion, so re-saving without changes never drifts.
        currency={expense.currency as Currency}
        successMessage="Expense updated"
        defaultValues={{
          description: expense.description,
          amount: expense.amountCents / 100,
          date: expense.date,
          categoryId: expense.categoryId ?? "",
          note: expense.note ?? "",
        }}
      />

      <DeleteExpenseDialog
        expenseId={expense.id}
        description={expense.description}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

function SortableHeader({
  label,
  columnId,
  sortBy,
  sortOrder,
  searchParams,
}: {
  label: string;
  columnId: "date" | "amount";
  sortBy: "date" | "amount";
  sortOrder: "asc" | "desc";
  searchParams: Record<string, string | undefined>;
}) {
  const isActive = sortBy === columnId;
  const nextOrder = isActive && sortOrder === "asc" ? "desc" : "asc";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "sortBy" && key !== "sortOrder" && key !== "page") {
      params.set(key, value);
    }
  }
  params.set("sortBy", columnId);
  params.set("sortOrder", nextOrder);

  return (
    <Link
      href={`/expenses?${params.toString()}`}
      className="hover:text-foreground inline-flex items-center gap-1"
    >
      {label}
      {isActive &&
        (sortOrder === "asc" ? (
          <ArrowUp className="size-3.5" />
        ) : (
          <ArrowDown className="size-3.5" />
        ))}
    </Link>
  );
}

// Below `sm` there isn't room for 5 table columns without hiding data or
// forcing a horizontal scroll — a stacked card per expense shows date,
// description, category, amount, and note in full at any width instead.
function MobileExpenseList({
  expenses,
  categories,
  currency,
  rates,
}: {
  expenses: ExpenseRow[];
  categories: Category[];
  currency: Currency;
  rates: Record<Currency, number>;
}) {
  return (
    <ul className="divide-y sm:hidden">
      {expenses.map((expense) => {
        const converted = convertCents(
          expense.amountCents,
          expense.currency as Currency,
          currency,
          rates,
        );
        return (
          <li key={expense.id} className="flex items-start justify-between gap-2 py-2.5">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <span className="truncate">{expense.description}</span>
                {expense.note && <NoteButton note={expense.note} />}
              </span>
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <span>{format(expense.date, "MMM d, yyyy")}</span>
                <span>·</span>
                <CategoryBadge category={expense.category} />
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="text-sm font-medium">{formatCurrency(converted, currency)}</span>
              <RowActions expense={expense} categories={categories} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ExpenseTable({
  expenses,
  categories,
  sortBy,
  sortOrder,
  searchParams,
  currency,
  rates,
}: {
  expenses: ExpenseRow[];
  categories: Category[];
  sortBy: "date" | "amount";
  sortOrder: "asc" | "desc";
  searchParams: Record<string, string | undefined>;
  currency: Currency;
  rates: Record<Currency, number>;
}) {
  const columns = columnHelper.columns([
    columnHelper.accessor("date", {
      header: () => (
        <SortableHeader
          label="Date"
          columnId="date"
          sortBy={sortBy}
          sortOrder={sortOrder}
          searchParams={searchParams}
        />
      ),
      cell: (info) => format(info.getValue(), "MMM d, yyyy"),
    }),
    columnHelper.accessor("description", {
      header: "Description",
      cell: (info) => {
        const expense = info.row.original;
        return (
          <span className="inline-flex items-center gap-1.5">
            {info.getValue()}
            {expense.note && <NoteButton note={expense.note} />}
          </span>
        );
      },
    }),
    columnHelper.accessor("category", {
      header: "Category",
      cell: (info) => <CategoryBadge category={info.getValue()} />,
    }),
    columnHelper.accessor("amountCents", {
      header: () => (
        <SortableHeader
          label="Amount"
          columnId="amount"
          sortBy={sortBy}
          sortOrder={sortOrder}
          searchParams={searchParams}
        />
      ),
      cell: (info) => {
        const expense = info.row.original;
        const converted = convertCents(
          info.getValue(),
          expense.currency as Currency,
          currency,
          rates,
        );
        return formatCurrency(converted, currency);
      },
      meta: { align: "right" as const },
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => <RowActions expense={info.row.original} categories={categories} />,
    }),
  ]);

  const table = useTable({
    features,
    data: expenses,
    columns,
  });

  if (expenses.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        No expenses yet. Add your first one to get started.
      </p>
    );
  }

  return (
    <>
      <MobileExpenseList
        expenses={expenses}
        categories={categories}
        currency={currency}
        rates={rates}
      />
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.columnDef.meta?.align === "right" ? "text-right" : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={
                      cell.column.columnDef.meta?.align === "right" ? "text-right" : undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
