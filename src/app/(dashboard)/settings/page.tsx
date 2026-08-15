import { getCategories } from "@/lib/dal/categories";
import { CategoryList } from "@/components/settings/category-list";
import { CategoryDialog } from "@/components/settings/category-dialog";
import { createCategory } from "@/lib/actions/category-actions";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Categories</h1>
          <p className="text-muted-foreground text-sm">
            Organize your expenses. Deleting a category leaves its expenses in place, marked
            Uncategorized.
          </p>
        </div>
        <CategoryDialog
          trigger={<Button>Add category</Button>}
          title="Add category"
          submitLabel="Add category"
          action={createCategory}
        />
      </div>
      <CategoryList categories={categories} />
    </div>
  );
}
