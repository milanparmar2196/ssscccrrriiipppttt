"use client";

import { useState, type FormEvent } from "react";
import { api, useLoad, type Obj } from "../../lib/api";
import { ErrorBox, Loading } from "../../components/ui";
import { useAuth } from "../../lib/auth";

export default function AdminUsersPage() {
  const { session } = useAuth();
  const { data, error, loading, reload } = useLoad<Obj>(() => api<Obj>("/admin/admin-users"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setActionError(null);
    setActionOk(null);
    try {
      const created = await api<Obj>("/admin/admin-users", {
        method: "POST",
        body: { email, password, role },
      });
      setActionOk(`Admin user created: ${String(created.email)} (${String(created.role)}).`);
      setEmail("");
      setPassword("");
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>
      <h1>Admin Users</h1>
      <p className="subtle">
        Regular admins are individual database records with hashed passwords and server-enforced roles
        (<code>admin</code> / <code>super_admin</code>). The bootstrap <code>.env</code> login is for setup and recovery
        only and is always recorded as actor <code>bootstrap</code>.
      </p>
      {loading ? (
        <Loading />
      ) : (
        <>
          <ErrorBox error={error} />
          {data && (
            <div className="cards">
              <div className="card">
                <div className="label">AdminUser records</div>
                <div className="num">{String(data.count ?? "—")}</div>
                <small>{String(data.note ?? "")}</small>
              </div>
            </div>
          )}
        </>
      )}
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Create admin user</h3>
        <p className="subtle">Super-admin only — the API rejects this for plain <code>admin</code> accounts.</p>
        {session?.role !== "super_admin" && session?.actor !== "bootstrap" && (
          <div className="warn-box">You are signed in as <code>{session?.actor}</code> ({session?.role}). Creating admin users requires super_admin.</div>
        )}
        <ErrorBox error={actionError} />
        {actionOk && <div className="ok-box">{actionOk}</div>}
        <form onSubmit={submit}>
          <div className="row">
            <label className="field grow" style={{ margin: 0 }}>
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="field grow" style={{ margin: 0 }}>
              <span>Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <label className="field" style={{ margin: 0 }}>
              <span>Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="admin">admin</option>
                <option value="super_admin">super_admin</option>
              </select>
            </label>
            <button type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create admin user"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
