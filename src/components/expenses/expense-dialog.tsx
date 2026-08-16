"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/expenses/expense-form";
import type { ExpenseInput } from "@/lib/validations/expense";
import type { ActionResult } from "@/lib/actions/expense-actions";

type Category = { id: string; name: string; color: string };
type ExpenseAction = (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;

export function ExpenseDialog({
  trigger,
  open: openProp,
  onOpenChange,
  title,
  action,
  categories,
  defaultValues,
  submitLabel,
  currency,
  rate,
}: {
  // Uncontrolled mode: pass `trigger`, the dialog owns its own open state.
  // Controlled mode (e.g. opened from a dropdown menu item, which must not
  // nest a DialogTrigger): omit `trigger`, pass `open`/`onOpenChange`.
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  action: ExpenseAction;
  categories: Category[];
  defaultValues?: Partial<ExpenseInput> & { amount?: number };
  submitLabel: string;
  currency: string;
  rate: number;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {open && (
          <ExpenseForm
            action={action}
            categories={categories}
            defaultValues={defaultValues}
            submitLabel={submitLabel}
            currency={currency}
            rate={rate}
            onSuccess={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
