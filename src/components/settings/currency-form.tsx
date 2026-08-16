"use client";

import { startTransition, useActionState, useState } from "react";
import { updateCurrency } from "@/lib/actions/user-actions";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CURRENCIES = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EGP", label: "Egyptian Pound (EGP)" },
  { value: "EUR", label: "Euro (EUR)" },
];

export function CurrencyForm({ currentCurrency }: { currentCurrency: string }) {
  const [state, formAction, isPending] = useActionState(updateCurrency, undefined);
  const [value, setValue] = useState(currentCurrency);

  const onValueChange = (next: string | null) => {
    if (!next) return;
    setValue(next);
    const formData = new FormData();
    formData.set("currency", next);
    startTransition(() => formAction(formData));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="currency">Currency</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id="currency" className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((currency) => (
            <SelectItem key={currency.value} value={currency.value}>
              {currency.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending && <p className="text-muted-foreground text-sm">Saving…</p>}
      {state?.ok && !isPending && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Saved</p>
      )}
      {state && !state.ok && <p className="text-destructive text-sm">{state.error}</p>}
    </div>
  );
}
