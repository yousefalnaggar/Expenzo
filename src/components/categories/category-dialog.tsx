"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CategoryForm } from "@/components/categories/category-form";
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
  successMessage,
}: {
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  action: CategoryAction;
  defaultValues?: Partial<CategoryInput>;
  submitLabel: string;
  successMessage: string;
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
            onSuccess={() => {
              setOpen(false);
              toast.success(successMessage);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
