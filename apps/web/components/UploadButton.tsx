"use client";

import { useState } from "react";
import { api, formatError } from "../lib/api";

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * A10 upload flow: init → PUT bytes to the presigned URL → complete with
 * the SHA-256 checksum. Each file shows its own state; Retry re-runs it.
 */
export default function UploadButton({ label = "Attach a file" }: { label?: string }) {
  const [state, setState] = useState<"idle" | "uploading" | "verifying" | "ready" | "failed">("idle");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const run = async (f: File) => {
    setState("uploading");
    setMessage("");
    try {
      const init = await api<any>("/uploads/init", {
        body: { filename: f.name, contentType: f.type || "application/octet-stream", sizeBytes: f.size },
      });
      const uploadId = init.id ?? init.uploadId;
      const presignedUrl: string | undefined = init.presignedUrl ?? init.uploadUrl ?? init.url;
      if (!presignedUrl) throw new Error("Upload init did not return a presigned URL.");
      if (presignedUrl.startsWith("http")) {
        const put = await fetch(presignedUrl, { method: "PUT", body: f });
        if (!put.ok) throw new Error(`Upload failed (${put.status})`);
      } else {
        setMessage(`Presigned target is not a direct URL in this environment: ${presignedUrl}`);
      }
      setState("verifying");
      const checksumSha256 = await sha256Hex(f);
      const done = await api<any>(`/uploads/${uploadId}/complete`, { body: { checksumSha256 } });
      setState(done?.state === "failed" ? "failed" : "ready");
      setMessage(done?.state ? `File state: ${done.state}` : "File ready.");
    } catch (e) {
      setState("failed");
      setMessage(formatError(e));
    }
  };

  return (
    <span className="row" style={{ gap: 8 }}>
      <label className="btn ghost small" style={{ margin: 0, cursor: "pointer" }}>
        {label}
        <input
          type="file"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              void run(f);
            }
          }}
        />
      </label>
      <span className="small muted">
        {state === "uploading" && "uploading →"}
        {state === "verifying" && "verifying →"}
        {state === "ready" && "ready ✓"}
        {state === "failed" && `failed — ${message}`}
        {state === "ready" && message}
      </span>
      {state === "failed" && file && (
        <button className="btn small" onClick={() => run(file)}>
          Retry
        </button>
      )}
    </span>
  );
}
