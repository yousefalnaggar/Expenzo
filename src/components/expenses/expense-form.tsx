"use client";

import { useActionState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import type { z } from "zod";
import { expenseSchema, type ExpenseInput } from "@/lib/validations/expense";
import type { ActionResult } from "@/lib/actions/expense-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = { id: string; name: string; color: string };

type ExpenseAction = (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;

export function ExpenseForm({
  action,
  categories,
  defaultValues,
  submitLabel,
  onSuccess,
}: {
  action: ExpenseAction;
  categories: Category[];
  defaultValues?: Partial<ExpenseInput> & { amount?: number };
  submitLabel: string;
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  const form = useForm<z.input<typeof expenseSchema>, unknown, ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: defaultValues?.description ?? "",
      amount: defaultValues?.amount,
      date: defaultValues?.date ?? new Date(),
      categoryId: defaultValues?.categoryId ?? "",
      note: defaultValues?.note ?? "",
    },
  });

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  const categoryId = useWatch({ control: form.control, name: "categoryId" });

  const onSubmit = form.handleSubmit((data) => {
    const formData = new FormData();
    formData.set("description", data.description);
    formData.set("amount", String(data.amount));
    formData.set("date", format(data.date, "yyyy-MM-dd"));
    formData.set("categoryId", data.categoryId ?? "");
    formData.set("note", data.note ?? "");
    formAction(formData);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Input id="description" {...form.register("description")} />
        {form.formState.errors.description && (
          <p className="text-destructive text-sm">{form.formState.errors.description.message}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            {...form.register("amount", { valueAsNumber: true })}
          />
          {form.formState.errors.amount && (
            <p className="text-destructive text-sm">{form.formState.errors.amount.message}</p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...form.register("date", { valueAsDate: true })} />
          {form.formState.errors.date && (
            <p className="text-destructive text-sm">{form.formState.errors.date.message}</p>
          )}
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="categoryId">Category</Label>
        <Select
          value={categoryId || undefined}
          onValueChange={(value) => form.setValue("categoryId", value ?? "")}
        >
          <SelectTrigger id="categoryId" className="w-full">
            <SelectValue placeholder="Uncategorized">
              {(value: string | null) => {
                const category = categories.find((c) => c.id === value);
                if (!category) return "Uncategorized";
                return (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </span>
                );
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" {...form.register("note")} />
        {form.formState.errors.note && (
          <p className="text-destructive text-sm">{form.formState.errors.note.message}</p>
        )}
      </div>
      {state && !state.ok && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
