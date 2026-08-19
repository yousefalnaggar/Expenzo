import { Info } from "lucide-react";
import { getCategories } from "@/lib/dal/categories";
import { CategoryList } from "@/components/categories/category-list";
import { CategoryDialog } from "@/components/categories/category-dialog";
import { createCategory } from "@/lib/actions/category-actions";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-1.5 text-lg font-medium">
            Categories
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Info className="size-4" />
                    <span className="sr-only">How deleting a category works</span>
                  </button>
                }
              />
              <PopoverContent align="start" className="w-64">
                <p>
                  Deleting a category leaves its expenses in place, marked{" "}
                  <span className="font-medium">Uncategorized</span>.
                </p>
              </PopoverContent>
            </Popover>
          </h1>
          <p className="text-muted-foreground text-sm">Organize your expenses.</p>
        </div>
        <CategoryDialog
          trigger={<Button>Add category</Button>}
          title="Add category"
          submitLabel="Add category"
          action={createCategory}
          successMessage="Category added"
        />
      </div>
      <CategoryList categories={categories} />
    </div>
  );
}
