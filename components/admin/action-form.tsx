"use client";

import { useActionState, useId, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

export type ActionState = { success?: boolean; message?: string; errors?: Record<string, string[]> };
export type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function SubmitButton({ children, pendingText = "Saving…", danger = false }: { children: ReactNode; pendingText?: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={`admin-button${danger ? " admin-button-danger" : ""}`} disabled={pending}>{pending ? pendingText : children}</button>;
}

export function ActionForm({ action, children, submitLabel = "Save changes", className = "", confirmLabel, danger = false }: {
  action: FormAction; children?: ReactNode; submitLabel?: string; className?: string; confirmLabel?: string; danger?: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  return <form action={formAction} className={`admin-form ${className}`}>
    {children}
    {confirmLabel && <label className="admin-checkbox"><input type="checkbox" name="confirm" value="yes" required />{confirmLabel}</label>}
    {state.message && <p role="status" aria-live="polite" className={`admin-message ${state.success ? "is-success" : "is-error"}`}>{state.message}</p>}
    {state.errors && <ul className="admin-errors">{Object.entries(state.errors).flatMap(([field, errors]) => errors.map((error) => <li key={`${field}-${error}`}>{error}</li>))}</ul>}
    <div className="admin-form-footer"><SubmitButton danger={danger}>{submitLabel}</SubmitButton></div>
  </form>;
}

export function Field({ label, name, value = "", type = "text", required = false, hint, multiline = false, rows = 4, min, max, placeholder }: {
  label: string; name: string; value?: string | number | null; type?: string; required?: boolean; hint?: string; multiline?: boolean; rows?: number; min?: number; max?: number; placeholder?: string;
}) {
  const fieldId = useId();
  const hintId = `${fieldId}-hint`;
  return <label className="admin-field"><span>{label}{required && <span aria-hidden="true"> *</span>}</span>
    {multiline ? <textarea name={name} defaultValue={value ?? ""} rows={rows} required={required} aria-describedby={hint ? hintId : undefined} placeholder={placeholder} />
      : <input name={name} type={type} defaultValue={value ?? ""} required={required} min={min} max={max} aria-describedby={hint ? hintId : undefined} placeholder={placeholder} autoComplete={type === "email" ? "email" : type === "password" ? "current-password" : undefined} />}
    {hint && <small id={hintId}>{hint}</small>}
  </label>;
}
