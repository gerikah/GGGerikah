"use client";

import { useActionState, useId, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import type { FormAction } from "@api/contracts/action-state";

export function SubmitButton({ children, pendingText = "Saving…", danger = false }: { children: ReactNode; pendingText?: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={`admin-button${danger ? " admin-button-danger" : ""}`} disabled={pending}>{pending ? pendingText : children}</button>;
}

export function ActionForm({ action, children, submitLabel = "Save changes", className = "", confirmLabel, danger = false }: {
  action: FormAction; children?: ReactNode; submitLabel?: string; className?: string; confirmLabel?: string; danger?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} onReset={event => event.preventDefault()} className={`admin-form ${className}`}>
    {children}
    {confirmLabel && <label className="admin-checkbox"><input type="checkbox" name="confirm" value="yes" required />{confirmLabel}</label>}
    {!pending && state.message && <p role="status" aria-live="polite" className={`admin-message ${state.success ? "is-success" : "is-error"}`}>{state.message}</p>}
    {!pending && state.errors && <ul className="admin-errors">{Object.entries(state.errors).flatMap(([field, errors]) => errors.map((error) => <li key={`${field}-${error}`}>{error}</li>))}</ul>}
    <div className="admin-form-footer"><SubmitButton danger={danger}>{submitLabel}</SubmitButton></div>
  </form>;
}

export function Field({ label, name, value = "", type = "text", required = false, hint, multiline = false, rows = 4, min, max, placeholder, limit }: {
  label: string; name: string; value?: string | number | null; type?: string; required?: boolean; hint?: string; multiline?: boolean; rows?: number; min?: number; max?: number; placeholder?: string; limit?: number;
}) {
  const fieldId = useId();
  const hintId = `${fieldId}-hint`;
  const [current, setCurrent] = useState(String(value ?? ""));
  return <label className="admin-field"><span>{label}{required && <span aria-hidden="true"> *</span>}</span>
    {multiline ? <textarea name={name} value={current} onChange={e => { setCurrent(e.target.value); e.target.setCustomValidity(limit && e.target.value.length > limit ? `Use at most ${limit} characters.` : ""); }} rows={rows} required={required} aria-invalid={limit ? current.length > limit : undefined} aria-describedby={hint ? hintId : undefined} placeholder={placeholder} />
      : <input name={name} type={type} value={current} onChange={e => { setCurrent(e.target.value); e.target.setCustomValidity(limit && e.target.value.length > limit ? `Use at most ${limit} characters.` : ""); }} required={required} min={min} max={max} aria-invalid={limit ? current.length > limit : undefined} aria-describedby={hint ? hintId : undefined} placeholder={placeholder} autoComplete={type === "email" ? "email" : type === "password" ? "current-password" : undefined} />}
    {limit && <small className={current.length > limit ? "admin-counter is-over" : "admin-counter"}>{current.length} / {limit}{current.length > limit ? " — shorten this before saving" : ""}</small>}
    {hint && <small id={hintId}>{hint}</small>}
  </label>;
}
