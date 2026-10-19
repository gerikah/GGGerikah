"use client";

import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import type { FormAction } from "@api/contracts/action-state";

export function SubmitButton({ children, pendingText = "Saving…", danger = false, disabled = false, name, value }: { children: ReactNode; pendingText?: string; danger?: boolean; disabled?: boolean; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" name={name} value={value} className={`admin-button${danger ? " admin-button-danger" : ""}`} disabled={pending || disabled}>{pending ? pendingText : children}</button>;
}

export function ActionForm({ action, children, submitLabel = "Save changes", className = "", confirmLabel, danger = false, disabled = false, footer, id }: {
  action: FormAction; children?: ReactNode; submitLabel?: string; className?: string; confirmLabel?: string; danger?: boolean; disabled?: boolean; footer?: ReactNode; id?: string;
}) {
  const dirty = useRef(false), confirmed = useRef(false), dialog = useRef<HTMLDialogElement>(null), formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (previous: import("@api/contracts/action-state").ActionState, form: FormData) => { dirty.current = false; const result = await action(previous, form); dirty.current = !result.success; if(formRef.current) formRef.current.dataset.dirty = String(dirty.current); confirmed.current = false; return result; }, {});
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (dirty.current) event.preventDefault(); };
    const leave = (event: MouseEvent) => { const link = (event.target as Element)?.closest("a"); if (dirty.current && link && link.target !== "_blank" && link.getAttribute("href")?.startsWith("/") && !window.confirm("You have unsaved changes. Leave without saving?")) { event.preventDefault(); event.stopPropagation(); } };
    window.addEventListener("beforeunload", unload); document.addEventListener("click", leave, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", leave, true); };
  }, []);
  return <form ref={formRef} id={id} action={formAction} onChange={() => { dirty.current = true; if(formRef.current) formRef.current.dataset.dirty = "true"; }} onSubmit={event => { if (confirmLabel && !confirmed.current) { event.preventDefault(); dialog.current?.showModal(); } }} onReset={event => event.preventDefault()} className={`admin-form ${className}`} aria-busy={pending}>
    <fieldset className="admin-form-fields" disabled={pending}>{children}</fieldset>
    {confirmLabel && <><input type="hidden" name="confirm" value="yes" /><dialog ref={dialog} className="admin-dialog" aria-label="Confirm change"><h2>Confirm change</h2><p>{confirmLabel}</p><div className="admin-form-footer"><button type="button" className="admin-button admin-button-danger" onClick={() => dialog.current?.close()}>Cancel</button><button type="button" className="admin-button" onClick={() => { confirmed.current = true; dialog.current?.close(); formRef.current?.requestSubmit(); }}>Confirm</button></div></dialog></>}
    {pending && <div role="status"><progress aria-label="Saving changes" /><span> Saving changes…</span></div>}
    {!pending && state.message && <p role="status" aria-live="polite" className={`admin-message ${state.success ? "is-success" : "is-error"}`}>{state.message}</p>}
    {!pending && state.errors && <ul className="admin-errors">{Object.entries(state.errors).flatMap(([field, errors]) => errors.map((error) => <li key={`${field}-${error}`}>{error}</li>))}</ul>}
    <div className="admin-form-footer"><SubmitButton danger={danger} disabled={disabled}>{submitLabel}</SubmitButton>{footer}</div>
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
