"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, useLoad, type Obj } from "../../lib/api";
import { DataTable, ErrorBox, Loading } from "../../components/ui";

export default function UsersPage() {
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { data, error, loading } = useLoad<Obj[]>(
    () => api<Obj[]>(`/admin/users${query ? `?email=${encodeURIComponent(query)}` : ""}`),
    [query],
  );

  return (
    <main>
      <h1>Users</h1>
      <p className="subtle">Search by email, then open a user for plan, credits and account actions. All actions are written to the admin audit log.</p>
      <form
        className="row"
        style={{ margin: "14px 0" }}
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(email.trim());
        }}
      >
        <label className="field grow" style={{ margin: 0 }}>
          <span>Email contains</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
        </label>
        <button type="submit">Search</button>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setEmail("");
            setQuery("");
          }}
        >
          Clear
        </button>
      </form>
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : (
        <DataTable
          rows={data ?? []}
          columns={["email", "planKey", "status", "emailVerified", "createdAt"]}
          onRowClick={(row) => router.push(`/users/${encodeURIComponent(String(row.id))}`)}
          emptyText="No users found."
        />
      )}
    </main>
  );
}
