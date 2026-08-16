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
import { MoreHorizontal } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
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

function RowActions({
  expense,
  categories,
  currency,
  rate,
}: {
  expense: ExpenseRow;
  categories: Category[];
  currency: string;
  rate: number;
}) {
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
        currency={currency}
        rate={rate}
        defaultValues={{
          description: expense.description,
          amount: (expense.amountCents * rate) / 100,
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

export function ExpenseTable({
  expenses,
  categories,
  sortBy,
  sortOrder,
  searchParams,
  currency,
  rate,
}: {
  expenses: ExpenseRow[];
  categories: Category[];
  sortBy: "date" | "amount";
  sortOrder: "asc" | "desc";
  searchParams: Record<string, string | undefined>;
  currency: string;
  rate: number;
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
    }),
    columnHelper.accessor("category", {
      header: "Category",
      cell: (info) => {
        const category = info.getValue();
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
      },
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
      cell: (info) => formatCurrency(info.getValue(), currency, rate),
      meta: { align: "right" as const },
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => (
        <RowActions
          expense={info.row.original}
          categories={categories}
          currency={currency}
          rate={rate}
        />
      ),
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
                className={cell.column.columnDef.meta?.align === "right" ? "text-right" : undefined}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
