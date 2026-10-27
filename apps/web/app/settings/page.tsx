"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, clearTokens, formatError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { ErrorBox, Loading, Modal, useLoad } from "../../components/ui";

export default function SettingsPage() {
  const { user, refresh, logout } = useAuth();
  const [tab, setTab] = useState("profile");
  const tabs = ["profile", "credits", "notifications", "webhooks", "youtube", "danger"];
  return (
    <main className="container" style={{ maxWidth: 860 }}>
      <h1>Settings</h1>
      <div className="tabs">
        {tabs.map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === "profile" && <ProfileTab user={user} refresh={refresh} />}
      {tab === "credits" && <CreditsTab />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "webhooks" && <WebhooksTab />}
      {tab === "youtube" && <YoutubeTab />}
      {tab === "danger" && <DangerTab logout={logout} />}
    </main>
  );
}

function ProfileTab({ user, refresh }: { user: any; refresh: () => Promise<void> }) {
  const [displayName, setDisplayName] = useState("");
  const [defaultLanguage, setDefaultLanguage] = useState("");
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? "");
      setDefaultLanguage(user.defaultLanguage ?? "");
      setPrefs(user.notificationPrefs ?? {});
    }
  }, [user]);

  if (!user) return <Loading />;
  return (
    <div className="card">
      <ErrorBox error={error} />
      {msg && <div className="banner info">{msg}</div>}
      <dl className="kv">
        <dt>Email</dt><dd>{user.email}</dd>
        <dt>Plan</dt><dd>{user.planKey ?? "personal"}</dd>
        <dt>Email verified</dt>
        <dd>
          {user.emailVerifiedAt ? (
            <>Yes — {new Date(user.emailVerifiedAt).toLocaleString()}</>
          ) : (
            <>
              Not yet.{" "}
              <button
                className="btn small"
                onClick={async () => {
                  setResendMsg("");
                  try {
                    const r = await api<any>("/auth/resend-verification", { body: {} });
                    setResendMsg(`Resend requested (status: ${r?.emailStatus ?? "sent"}). A resend may be rate-limited: 60s cooldown, up to 5 per day.`);
                    await refresh();
                  } catch (e) {
                    setResendMsg(formatError(e));
                  }
                }}
              >
                Resend verification
              </button>{" "}
              <span className="small muted">{resendMsg}</span>
            </>
          )}
        </dd>
      </dl>
      <label>Display name</label>
      <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <label>Default language</label>
      <input value={defaultLanguage} onChange={(e) => setDefaultLanguage(e.target.value)} placeholder="e.g. en" />
      <h4>Notification preferences</h4>
      {["jobCompleted", "jobFailed", "auditReady", "packageReady", "creditsLow", "productUpdates"].map((k) => (
        <label key={k} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            style={{ width: "auto" }}
            checked={prefs[k] !== false}
            onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })}
          />
          {k}
        </label>
      ))}
      <button
        className="btn"
        style={{ marginTop: 12 }}
        onClick={async () => {
          setError("");
          try {
            await api("/me", { method: "PATCH", body: { displayName, defaultLanguage, notificationPrefs: prefs } });
            setMsg("Profile saved.");
            await refresh();
          } catch (e) {
            setError(formatError(e));
          }
        }}
      >
        Save profile
      </button>
      <p className="small muted" style={{ marginTop: 14 }}>
        Password changes follow the same rules as signup (min 10 characters, strength + breached-password
        check) and sign out all other sessions — use “Forgot password” from the login page to rotate it
        securely.
      </p>
    </div>
  );
}

function CreditsTab() {
  const credits = useLoad(() => api<any>("/me/credits"), []);
  const ledger = useLoad(() => api<any>("/me/credits/ledger?limit=50"), []);
  const entries: any[] = Array.isArray(ledger.data) ? ledger.data : ledger.data?.entries ?? [];
  return (
    <div>
      <div className="card">
        <h3>Balance: {credits.data?.balance ?? "…"}</h3>
        <p className="small muted">
          Plan: {credits.data?.planKey ?? "—"}. Credits are granted by the platform admin — there is no
          checkout or self-serve top-up (no billing provider). To request more, contact the platform team.
        </p>
      </div>
      <div className="card">
        <h3>Ledger</h3>
        {ledger.loading ? <Loading /> : entries.length === 0 ? (
          <p className="muted">No credit movements yet.</p>
        ) : (
          <table>
            <thead><tr><th>When</th><th>Kind</th><th>Amount</th><th>Note</th><th>Actor</th></tr></thead>
            <tbody>
              {entries.map((e: any) => (
                <tr key={e.id}>
                  <td>{e.createdAt ? new Date(e.createdAt).toLocaleString() : ""}</td>
                  <td>{e.kind}</td>
                  <td style={{ color: e.amount < 0 ? "var(--danger)" : "var(--accent2)" }}>{e.amount}</td>
                  <td>{e.note ?? ""}</td>
                  <td>{e.actor ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function NotificationsTab() {
  const list = useLoad(() => api<any>("/me/notifications"), []);
  const items: any[] = Array.isArray(list.data) ? list.data : list.data?.notifications ?? [];
  return (
    <div className="card">
      <h3>Notifications</h3>
      {list.loading ? <Loading /> : items.length === 0 ? (
        <p className="muted">No notifications.</p>
      ) : (
        items.map((n: any) => (
          <div key={n.id} className="row" style={{ borderBottom: "1px solid var(--line)", padding: "8px 0" }}>
            <span style={{ flex: 1, opacity: n.readAt ? 0.6 : 1 }}>
              <strong>{n.title ?? n.type}</strong>
              <div className="small muted">{n.body ?? n.message ?? ""} · {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</div>
            </span>
            {!n.readAt && (
              <button
                className="btn ghost small"
                onClick={async () => {
                  await api(`/me/notifications/${n.id}/read`, { body: {} });
                  await list.reload();
                }}
              >
                Mark read
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function WebhooksTab() {
  const list = useLoad(() => api<any>("/me/webhooks"), []);
  const items: any[] = Array.isArray(list.data) ? list.data : list.data?.webhooks ?? [];
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState("job.completed,job.failed");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="card">
      <h3>Webhooks</h3>
      <p className="small muted">
        Push notifications for job events (the interface is defined now; delivery is enabled by the
        platform). Secrets are shown <strong>once</strong> at creation and stored hashed — copy it
        immediately.
      </p>
      <ErrorBox error={error} />
      {items.map((w: any) => (
        <div key={w.id} className="row" style={{ borderBottom: "1px solid var(--line)", padding: "8px 0" }}>
          <span style={{ flex: 1 }}>
            {w.url} <span className="small muted">{(w.events ?? []).join(", ")}</span>{" "}
            <span className={`badge ${w.disabled ? "bad" : "ok"}`}>{w.disabled ? "auto-disabled" : "active"}</span>
          </span>
          <button
            className="btn ghost small"
            onClick={async () => {
              await api(`/me/webhooks/${w.id}`, { method: "DELETE" });
              await list.reload();
            }}
          >
            Delete
          </button>
        </div>
      ))}
      <label>Endpoint URL (https)</label>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/hook" />
      <label>Events (comma-separated)</label>
      <input value={events} onChange={(e) => setEvents(e.target.value)} />
      <button
        className="btn"
        style={{ marginTop: 12 }}
        onClick={async () => {
          setError("");
          setSecret("");
          try {
            const r = await api<any>("/me/webhooks", {
              body: { url, events: events.split(",").map((s) => s.trim()).filter(Boolean) },
            });
            if (r?.secret) setSecret(r.secret);
            await list.reload();
          } catch (e) {
            setError(formatError(e));
          }
        }}
      >
        Create webhook
      </button>
      {secret && (
        <div className="banner">
          Your webhook secret (shown once):{" "}
          <code style={{ wordBreak: "break-all" }}>{secret}</code>
        </div>
      )}
    </div>
  );
}

function YoutubeTab() {
  const yt = useLoad(() => api<any>("/me/youtube"), []);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const d = yt.data ?? {};
  const status = d.status ?? d.connection?.status ?? "disconnected";
  return (
    <div className="card">
      <h3>YouTube connection</h3>
      <ErrorBox error={error} />
      {msg && <div className="banner info">{msg}</div>}
      {yt.loading ? <Loading /> : (
        <>
          <p>
            Status: <span className="badge">{status}</span>{" "}
            {d.channelTitle && <span className="muted">Channel: {d.channelTitle}</span>}
          </p>
          {status === "reauth_required" && (
            <div className="banner">The connection needs re-authentication. Reconnect below — already-synced metrics are kept, marked last-synced.</div>
          )}
          {status === "quota_exceeded" && (
            <div className="banner info">Quota exceeded — sync resumes when the YouTube quota resets.</div>
          )}
          <p className="small muted">
            Read-only access only (channel + analytics). Disconnecting keeps already-synced metrics.
          </p>
          <div className="row">
            {status === "connected" || status === "reauth_required" ? (
              <>
                <button
                  className="btn secondary"
                  onClick={async () => {
                    setError("");
                    try {
                      const r = await api<any>("/me/youtube/connect", { body: {} });
                      const url = r?.authUrl ?? r?.url;
                      if (url) window.location.href = url;
                    } catch (e) {
                      setError(formatError(e));
                    }
                  }}
                >
                  Reconnect
                </button>
                <button
                  className="btn danger"
                  onClick={async () => {
                    setError("");
                    try {
                      await api("/me/youtube", { method: "DELETE" });
                      setMsg("Disconnected. Already-synced metrics are kept, marked last-synced.");
                      await yt.reload();
                    } catch (e) {
                      setError(formatError(e));
                    }
                  }}
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                className="btn"
                onClick={async () => {
                  setError("");
                  try {
                    const r = await api<any>("/me/youtube/connect", { body: {} });
                    const url = r?.authUrl ?? r?.url;
                    if (url) window.location.href = url;
                    else setError("Connect did not return an authorisation URL.");
                  } catch (e) {
                    setError(formatError(e));
                  }
                }}
              >
                Connect YouTube
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DangerTab({ logout }: { logout: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <div className="card" style={{ borderColor: "var(--danger)" }}>
      <h3>Delete account</h3>
      <p className="small">
        Deleting your account schedules everything for removal after a <strong>30-day grace
        period</strong>. During the grace period you can cancel by logging in — the login screen will
        offer “Cancel deletion”. All sessions are revoked immediately when you request deletion.
        Credit ledger and admin audit rows are retained in anonymised form; everything else is purged
        when the grace period ends.
      </p>
      <button className="btn danger" onClick={() => setOpen(true)}>
        Delete my account…
      </button>
      {open && (
        <Modal title="Confirm account deletion" onClose={() => setOpen(false)}>
          <ErrorBox error={error} />
          <p>Enter your password to schedule deletion. You will be signed out immediately.</p>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="row" style={{ marginTop: 12 }}>
            <button
              className="btn danger"
              disabled={!password}
              onClick={async () => {
                setError("");
                try {
                  await api("/me", { method: "DELETE", body: { password } });
                  clearTokens();
                  await logout().catch(() => {});
                  router.replace("/login");
                } catch (e) {
                  setError(formatError(e));
                }
              }}
            >
              Schedule deletion
            </button>
            <button className="btn secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
