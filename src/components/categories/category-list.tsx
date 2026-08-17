"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryDialog } from "@/components/categories/category-dialog";
import { DeleteCategoryDialog } from "@/components/categories/delete-category-dialog";
import { updateCategory } from "@/lib/actions/category-actions";

function CategoryRow({ category }: { category: Category }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <li className="flex items-center justify-between rounded-lg border px-3 py-2">
      <span className="inline-flex items-center gap-2">
        <span
          className="inline-block size-3 shrink-0 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        {category.name}
      </span>

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

      <CategoryDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit category"
        submitLabel="Save changes"
        action={updateCategory.bind(null, category.id)}
        defaultValues={{ name: category.name, color: category.color }}
        successMessage="Category updated"
      />

      <DeleteCategoryDialog
        categoryId={category.id}
        name={category.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </li>
  );
}

export function CategoryList({ categories }: { categories: Category[] }) {
  if (categories.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No categories yet. Add one to start organizing your expenses.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {categories.map((category) => (
        <CategoryRow key={category.id} category={category} />
      ))}
    </ul>
  );
}
