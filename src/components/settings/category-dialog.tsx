"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CategoryForm } from "@/components/settings/category-form";
import type { CategoryInput } from "@/lib/validations/category";
import type { ActionResult } from "@/lib/actions/category-actions";

type CategoryAction = (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;

export function CategoryDialog({
  trigger,
  open: openProp,
  onOpenChange,
  title,
  action,
  defaultValues,
  submitLabel,
}: {
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  action: CategoryAction;
  defaultValues?: Partial<CategoryInput>;
  submitLabel: string;
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
          <CategoryForm
            action={action}
            defaultValues={defaultValues}
            submitLabel={submitLabel}
            onSuccess={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
