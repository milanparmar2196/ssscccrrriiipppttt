"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ApiError, cancelJob, estimateJob, formatError, idempotencyKey, pollJob, type JobRecord } from "../lib/api";

/* ---------- tiny state helpers ---------- */

export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fn());
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, error, loading, reload, setData };
}

export function Loading() {
  return <p className="muted">Loading…</p>;
}
export function ErrorBox({ error }: { error: string }) {
  if (!error) return null;
  return <div className="error-box">{error}</div>;
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: 28 }}>
      <p className="muted">{children}</p>
    </div>
  );
}

/* ---------- modal ---------- */

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn ghost small" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- job confirm + progress ---------- */

interface JobButtonProps {
  label: string;
  action: string;
  /** estimate params, e.g. { units } */
  estimateParams?: Record<string, unknown>;
  /** perform the job-creating call with the confirmed estimate */
  start: (jobConfirm: { estimatedCredits: number }) => Promise<any>;
  onDone?: (result: any) => void;
  className?: string;
  disabled?: boolean;
  confirmTitle?: string;
}

/**
 * The standard AI action flow: Estimate credits → Confirm (modal) →
 * job progress (polled) → result. Never a bare spinner.
 */
export function JobButton({ label, action, estimateParams, start, onDone, className, disabled, confirmTitle }: JobButtonProps) {
  const [phase, setPhase] = useState<"idle" | "estimating" | "confirm" | "running" | "error">("idle");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | undefined>(undefined);
  const [job, setJob] = useState<JobRecord | null>(null);
  const [error, setError] = useState("");

  const begin = async () => {
    setPhase("estimating");
    setError("");
    try {
      const est = await estimateJob(action, estimateParams ?? {});
      setEstimate(est.estimatedCredits);
      setBalance(est.balance);
      setPhase("confirm");
    } catch (e) {
      setError(formatError(e));
      setPhase("error");
    }
  };

  const confirm = async () => {
    if (estimate === null) return;
    setPhase("running");
    try {
      const result = await start({ estimatedCredits: estimate });
      const jobId = result?.jobId ?? result?.job?.id ?? result?.id;
      if (jobId && typeof jobId === "string") {
        const finished = await pollJob(jobId, setJob);
        onDone?.(finished.result ?? finished);
      } else {
        onDone?.(result);
      }
      setPhase("idle");
      setJob(null);
    } catch (e) {
      if (e instanceof ApiError && e.code === "EMAIL_NOT_VERIFIED") {
        setError("Your email is not verified yet. Verify it (see the banner above) before running generation.");
      } else {
        setError(formatError(e));
      }
      setPhase("error");
    }
  };

  const insufficient = balance !== undefined && estimate !== null && balance < estimate;

  return (
    <>
      <button className={className ?? "btn"} onClick={begin} disabled={disabled || phase === "estimating" || phase === "running"}>
        {phase === "estimating" ? "Estimating…" : phase === "running" ? "Running…" : label}
      </button>
      {phase === "confirm" && (
        <Modal title={confirmTitle ?? "Confirm job"} onClose={() => setPhase("idle")}>
          <p>
            This will cost approximately <strong>{estimate} credits</strong>.
            {balance !== undefined && (
              <>
                {" "}
                Your current balance is <strong>{balance}</strong>.
              </>
            )}
          </p>
          {insufficient && (
            <div className="error-box">
              Insufficient credits. Credits are granted by the platform admin — there is no self-serve
              top-up. Please request more credits from the platform team.
            </div>
          )}
          <div className="row">
            <button className="btn" onClick={confirm} disabled={insufficient}>
              Confirm &amp; run
            </button>
            <button className="btn secondary" onClick={() => setPhase("idle")}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {phase === "running" && (
        <Modal title="Job running" onClose={() => {}}>
          <p className="muted">Status: {job?.status ?? "queued"}</p>
          <div className="progress">
            <div style={{ width: `${Math.min(100, Math.max(8, Number(job?.progress ?? 15)))}%` }} />
          </div>
          {job?.id && (
            <p style={{ marginTop: 12 }}>
              <button
                className="btn secondary small"
                onClick={async () => {
                  await cancelJob(job.id).catch(() => {});
                }}
              >
                Cancel job
              </button>
            </p>
          )}
        </Modal>
      )}
      {phase === "error" && (
        <Modal title="Something went wrong" onClose={() => setPhase("idle")}>
          <div className="error-box">{error}</div>
          <button className="btn secondary" onClick={() => setPhase("idle")}>
            Close
          </button>
        </Modal>
      )}
    </>
  );
}

/** Headers/body helper for job-creating endpoints. */
export function jobBody(jobConfirm: { estimatedCredits: number }, extra: Record<string, unknown> = {}) {
  return { body: { ...extra, jobConfirm }, headers: { "Idempotency-Key": idempotencyKey() } };
}

/* ---------- dynamic config form ---------- */

export interface ConfigQuestionLike {
  key: string;
  label: string;
  helpText?: string;
  type: string;
  options?: { value: string; label?: string }[];
  required?: boolean;
  defaultValue?: unknown;
  allowCustomAnswer?: boolean;
  condition?: { questionKey: string; equals?: unknown; in?: unknown[] } | null;
  group?: string;
}

function answerRaw(answers: Record<string, any>, key: string): any {
  const a = answers[key];
  if (a === undefined || a === null) return undefined;
  return typeof a === "object" && "value" in a ? a : { value: a };
}

export function conditionMet(q: ConfigQuestionLike, answers: Record<string, any>): boolean {
  if (!q.condition) return true;
  const dep = answerRaw(answers, q.condition.questionKey)?.value;
  if (q.condition.in) return q.condition.in.includes(dep);
  if (q.condition.equals !== undefined) return dep === q.condition.equals;
  return true;
}

/**
 * Renders a config form purely from the API schema (GET /config-schema).
 * Answers are stored in the API's ConfigAnswer shape.
 */
export function DynamicForm({
  questions,
  answers,
  onChange,
}: {
  questions: ConfigQuestionLike[];
  answers: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
}) {
  const set = (key: string, value: unknown, customText?: string) => {
    const next = { ...answers };
    if (customText !== undefined) next[key] = { value: "custom", customText };
    else next[key] = { value };
    onChange(next);
  };

  const visible = questions.filter((q) => conditionMet(q, answers));
  const groups = new Map<string, ConfigQuestionLike[]>();
  for (const q of visible) {
    const g = q.group ?? "General";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(q);
  }

  return (
    <div>
      {[...groups.entries()].map(([group, qs]) => (
        <fieldset key={group} style={{ border: "1px solid var(--line)", borderRadius: 10, marginBottom: 14 }}>
          <legend className="small muted">{group}</legend>
          {qs.map((q) => {
            const cur = answerRaw(answers, q.key);
            const val = cur?.value ?? q.defaultValue ?? "";
            const isCustom = val === "custom";
            return (
              <div key={q.key}>
                <label>
                  {q.label}
                  {q.required ? " *" : ""}
                </label>
                {q.helpText && <div className="small muted">{q.helpText}</div>}
                {q.type === "boolean" ? (
                  <input
                    type="checkbox"
                    style={{ width: "auto" }}
                    checked={Boolean(val)}
                    onChange={(e) => set(q.key, e.target.checked)}
                  />
                ) : q.type === "number" ? (
                  <input
                    type="number"
                    value={val === "" ? "" : Number(val)}
                    onChange={(e) => set(q.key, e.target.value === "" ? "" : Number(e.target.value))}
                  />
                ) : q.type === "multi_select" ? (
                  <div className="row">
                    {(q.options ?? []).map((o) => {
                      const arr: string[] = Array.isArray(val) ? val : [];
                      return (
                        <label key={o.value} style={{ display: "inline-flex", gap: 6, alignItems: "center", margin: 0 }}>
                          <input
                            type="checkbox"
                            style={{ width: "auto" }}
                            checked={arr.includes(o.value)}
                            onChange={(e) =>
                              set(q.key, e.target.checked ? [...arr, o.value] : arr.filter((v) => v !== o.value))
                            }
                          />
                          {o.label ?? o.value}
                        </label>
                      );
                    })}
                  </div>
                ) : (q.options?.length ?? 0) > 0 || q.type === "single_select" || q.type === "select" ? (
                  <>
                    <select
                      value={isCustom ? "custom" : String(val)}
                      onChange={(e) => {
                        if (e.target.value === "custom") set(q.key, "custom", cur?.customText ?? "");
                        else set(q.key, e.target.value);
                      }}
                    >
                      <option value="">— choose —</option>
                      {(q.options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label ?? o.value}
                        </option>
                      ))}
                      {q.allowCustomAnswer !== false && <option value="custom">Other — write your own</option>}
                    </select>
                    {isCustom && (
                      <input
                        placeholder="Your custom answer"
                        value={cur?.customText ?? ""}
                        onChange={(e) => set(q.key, "custom", e.target.value)}
                        style={{ marginTop: 6 }}
                      />
                    )}
                  </>
                ) : q.type === "long_text" || q.type === "textarea" ? (
                  <textarea value={String(val)} onChange={(e) => set(q.key, e.target.value)} />
                ) : (
                  <input value={String(val)} onChange={(e) => set(q.key, e.target.value)} />
                )}
              </div>
            );
          })}
        </fieldset>
      ))}
      {visible.length === 0 && <p className="muted">No questions in this set.</p>}
    </div>
  );
}

/** Flatten DynamicForm answers into the POST body shape for config-answers. */
export function answersArray(answers: Record<string, any>): { questionKey: string; value: unknown; customText?: string }[] {
  return Object.entries(answers).map(([questionKey, a]) => {
    const raw = a && typeof a === "object" && "value" in a ? a : { value: a };
    return raw.value === "custom"
      ? { questionKey, value: "custom", customText: raw.customText ?? "" }
      : { questionKey, value: raw.value };
  });
}

export function answersFromApi(list: any): Record<string, any> {
  const out: Record<string, any> = {};
  const raw = Array.isArray(list) ? list : list?.answers ?? list ?? {};
  if (Array.isArray(raw)) {
    for (const a of raw) {
      if (a?.questionKey) out[a.questionKey] = { value: a.value, ...(a.customText ? { customText: a.customText } : {}) };
    }
  } else if (raw && typeof raw === "object") {
    // Server stores answers as a map: { [questionKey]: ConfigAnswer }
    for (const [k, v] of Object.entries(raw)) {
      out[k] = v && typeof v === "object" && "value" in (v as any) ? v : { value: v };
    }
  }
  return out;
}
