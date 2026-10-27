"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api, useLoad, type Obj } from "../../../lib/api";
import { Badge, ErrorBox, Loading } from "../../../components/ui";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, error, loading, reload } = useLoad<Obj>(() => api<Obj>(`/admin/users/${id}`), [id]);
  const [planKey, setPlanKey] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true);
    setActionError(null);
    setActionOk(null);
    try {
      await fn();
      setActionOk(okMsg);
      reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  if (!data) return <ErrorBox error="User not found." />;

  const suspended = data.status === "suspended";

  return (
    <main>
      <h1>{String(data.email)}</h1>
      <p className="subtle">User ID: <code>{String(data.id)}</code></p>
      <div className="cards">
        <div className="card">
          <div className="label">Status</div>
          <div className="num" style={{ fontSize: 20 }}>
            <Badge tone={suspended ? "red" : "green"}>{String(data.status)}</Badge>
          </div>
          <small>Admins observe lifecycle states (archived / pending deletion) — they never archive or delete user content themselves.</small>
        </div>
        <div className="card">
          <div className="label">Plan</div>
          <div className="num" style={{ fontSize: 20 }}>{String(data.planKey)}</div>
        </div>
        <div className="card">
          <div className="label">Email verified</div>
          <div className="num" style={{ fontSize: 20 }}>{data.emailVerified ? "Yes" : "No"}</div>
        </div>
        <div className="card">
          <div className="label">Credit balance</div>
          <div className="num">{String(data.balance ?? 0)}</div>
          <small>From the credit ledger — never edited directly.</small>
        </div>
      </div>

      <ErrorBox error={actionError} />
      {actionOk && <div className="ok-box">{actionOk}</div>}

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Suspend / reactivate</h3>
        <p className="subtle">
          Suspending blocks API access and cancels the user&apos;s queued jobs (holds released); running jobs stop at the
          next unit boundary. Data stays intact and everything returns on reactivation.
        </p>
        <button
          className={suspended ? undefined : "danger"}
          disabled={busy}
          onClick={() => {
            if (!window.confirm(suspended ? "Reactivate this account?" : "Suspend this account? Queued jobs will be cancelled.")) return;
            void run(
              () => api(`/admin/users/${id}/suspend`, { method: "POST", body: { suspend: !suspended } }),
              suspended ? "Account reactivated." : "Account suspended.",
            );
          }}
        >
          {suspended ? "Reactivate account" : "Suspend account"}
        </button>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Change plan</h3>
        <div className="row">
          <label className="field grow" style={{ margin: 0 }}>
            <span>Plan key</span>
            <input value={planKey} onChange={(e) => setPlanKey(e.target.value)} placeholder={String(data.planKey)} />
          </label>
          <button
            disabled={busy || !planKey.trim()}
            onClick={() =>
              void run(
                () => api(`/admin/users/${id}/plan`, { method: "POST", body: { planKey: planKey.trim() } }),
                `Plan changed to ${planKey.trim()}.`,
              )
            }
          >
            Change plan
          </button>
        </div>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Grant / adjust credits</h3>
        <p className="subtle">
          This creates a <strong>ledger entry</strong> (grant/adjustment) — balances are never edited directly, and a
          reason is required. Use a negative amount for a correction; refunds are credit restorations recorded the same
          way (there is no payment provider).
        </p>
        <div className="row">
          <label className="field" style={{ margin: 0 }}>
            <span>Amount</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" />
          </label>
          <label className="field grow" style={{ margin: 0 }}>
            <span>Reason (required)</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. goodwill grant, failed-job restoration" />
          </label>
          <button
            disabled={busy || !amount || !reason.trim()}
            onClick={() =>
              void run(
                () =>
                  api(`/admin/users/${id}/credits`, {
                    method: "POST",
                    body: { amount: Number(amount), reason: reason.trim() },
                  }),
                "Ledger entry created.",
              )
            }
          >
            Apply via ledger
          </button>
        </div>
      </div>
    </main>
  );
}
