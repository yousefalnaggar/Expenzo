"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { passwordChangeSchema, type PasswordChangeInput } from "@/lib/validations/user";
import { updatePassword, type ActionResult } from "@/lib/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ActionResult | undefined>(undefined);

  const form = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit((data) => {
    const formData = new FormData();
    formData.set("currentPassword", data.currentPassword);
    formData.set("newPassword", data.newPassword);
    formData.set("confirmPassword", data.confirmPassword);

    startTransition(async () => {
      const result = await updatePassword(undefined, formData);
      setState(result);
      if (result.ok) {
        toast.success("Password updated");
        form.reset();
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          {...form.register("currentPassword")}
        />
        {form.formState.errors.currentPassword && (
          <p className="text-destructive text-sm">
            {form.formState.errors.currentPassword.message}
          </p>
        )}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          {...form.register("newPassword")}
        />
        {form.formState.errors.newPassword && (
          <p className="text-destructive text-sm">{form.formState.errors.newPassword.message}</p>
        )}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-destructive text-sm">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>
      {state && !state.ok && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
