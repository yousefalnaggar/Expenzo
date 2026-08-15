"use client";

import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginUser } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginUser, undefined);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (state?.ok) router.push("/dashboard");
  }, [state, router]);

  const onSubmit = form.handleSubmit((data) => {
    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", data.password);
    formAction(formData);
  });

  const onTryDemo = () => {
    const formData = new FormData();
    formData.set("email", "demo@expenzo.app");
    formData.set("password", "Demo1234!");
    formAction(formData);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        {form.formState.errors.email && (
          <p className="text-destructive text-sm">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-destructive text-sm">{form.formState.errors.password.message}</p>
        )}
      </div>
      {state && !state.ok && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
      <Button
        type="button"
        variant="secondary"
        disabled={isPending}
        onClick={onTryDemo}
        className="w-full"
      >
        Try the demo
      </Button>
    </form>
  );
}
