import { getCategories } from "@/lib/dal/categories";
import { getUserPreferredCurrency } from "@/lib/dal/users";
import { CategoryList } from "@/components/settings/category-list";
import { CategoryDialog } from "@/components/settings/category-dialog";
import { CurrencyForm } from "@/components/settings/currency-form";
import { createCategory } from "@/lib/actions/category-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const [categories, currency] = await Promise.all([getCategories(), getUserPreferredCurrency()]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <CurrencyForm currentCurrency={currency} />
        </CardContent>
      </Card>

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
