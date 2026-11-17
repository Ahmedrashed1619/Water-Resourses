"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/server/actions";

export function SubmitButton({ label, pendingLabel, className = "btn btn-primary" }: { label: string; pendingLabel: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function BoundForm({
  action,
  children,
  className,
  silent = false,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  /** Hide inline result banners (useful inside table action cells). */
  silent?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      {silent ? null : <FormMessage result={state} />}
    </form>
  );
}

export function FormMessage({ result }: { result: ActionResult | null }) {
  if (!result?.message) return null;
  return <p className={result.ok ? "banner ok" : "banner err"}>{result.message}</p>;
}
