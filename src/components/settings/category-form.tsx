"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import type { ActionResult } from "@/lib/actions/category-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CategoryAction = (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;

export function CategoryForm({
  action,
  defaultValues,
  submitLabel,
  onSuccess,
}: {
  action: CategoryAction;
  defaultValues?: Partial<CategoryInput>;
  submitLabel: string;
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      color: defaultValues?.color ?? "#64748b",
    },
  });

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state, onSuccess]);

  const color = useWatch({ control: form.control, name: "color" });

  const onSubmit = form.handleSubmit((data) => {
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("color", data.color);
    startTransition(() => formAction(formData));
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>
        )}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="color">Color</Label>
        <div className="flex items-center gap-2">
          <input
            id="color"
            type="color"
            className="border-input h-8 w-12 rounded border bg-transparent p-0.5"
            value={color}
            onChange={(e) => form.setValue("color", e.target.value, { shouldValidate: true })}
          />
          <Input
            aria-label="Color hex value"
            className="w-28"
            value={color}
            onChange={(e) => form.setValue("color", e.target.value, { shouldValidate: true })}
          />
        </div>
        {form.formState.errors.color && (
          <p className="text-destructive text-sm">{form.formState.errors.color.message}</p>
        )}
      </div>
      {state && !state.ok && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
