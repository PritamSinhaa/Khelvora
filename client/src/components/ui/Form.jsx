import { cloneElement, useId, useState } from "react";
import { useTask } from "../../hooks/useResource";
import { Notice } from "./Feedback";

export function Field({ label, children, hint, ...props }) {
  const generatedId = useId();
  const inputId = children?.props?.id || generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      {children
        ? cloneElement(children, { id: inputId, "aria-describedby": hintId })
        : <input id={inputId} aria-describedby={hintId} {...props} />}
      {hint && (
        <p id={hintId} className="text-xs font-normal text-muted">{hint}</p>
      )}
    </div>
  );
}

export function Form({
  children, action, onDone, submit = "Save changes", reset = false,
  success, className = "", disabled = false,
}) {
  const task = useTask();
  const [saved, setSaved] = useState(false);

  return (
    <form className={`stack ${className}`} onSubmit={(event) => {
      event.preventDefault();
      const form = event.currentTarget;
      setSaved(false);

      task.run(async () => {
        const result = await action(Object.fromEntries(new FormData(form)), form);
        if (reset) form.reset();
        await onDone?.(result);
        setSaved(true);
      });
    }}>
      <fieldset disabled={task.busy || disabled} className="stack min-w-0">
        {children}
        <Notice error>{task.error}</Notice>
        {saved && <Notice>{success}</Notice>}
        <button type="submit" className="btn self-start">
          {task.busy ? "Please wait…" : submit}
        </button>
      </fieldset>
    </form>
  );
}

export function Action({
  children, action, onDone, danger = false, confirm, disabled, className = "",
}) {
  const task = useTask();

  return (
    <div className="min-w-0">
      <button type="button" disabled={task.busy || disabled}
        className={`btn ${danger ? "danger" : "secondary"} ${className}`}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          task.run(async () => {
            const result = await action();
            await onDone?.(result);
          });
        }}>
        {task.busy ? "Please wait…" : children}
      </button>
      <Notice error>{task.error}</Notice>
    </div>
  );
}