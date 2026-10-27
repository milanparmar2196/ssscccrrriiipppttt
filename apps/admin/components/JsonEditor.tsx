"use client";

import { useEffect, useState } from "react";
import type { Obj } from "../lib/api";

/**
 * JSON record editor: quick form fields for the common keys
 * (key/id, name/title, status) kept in sync with a full JSON
 * textarea. The textarea is the source of truth on save.
 */
const COMMON_FIELDS = ["name", "title", "label", "description"] as const;
const STATUS_OPTIONS = ["draft", "active", "archived"];

export default function JsonEditor({
  value,
  keyField,
  onSave,
  saveLabel = "Save record",
  saving = false,
}: {
  value: Obj;
  keyField: string;
  onSave: (record: Obj) => void | Promise<void>;
  saveLabel?: string;
  saving?: boolean;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(value, null, 2));
    setParseError(null);
  }, [value]);

  let parsed: Obj | null = null;
  try {
    const p: unknown = JSON.parse(text);
    if (p && typeof p === "object" && !Array.isArray(p)) parsed = p as Obj;
  } catch {
    parsed = null;
  }

  const setField = (field: string, v: string) => {
    if (!parsed) return;
    setText(JSON.stringify({ ...parsed, [field]: v }, null, 2));
  };

  const handleSave = async () => {
    let p: unknown;
    try {
      p = JSON.parse(text);
    } catch (e) {
      setParseError(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    if (!p || typeof p !== "object" || Array.isArray(p)) {
      setParseError("Record must be a JSON object.");
      return;
    }
    setParseError(null);
    await onSave(p as Obj);
  };

  return (
    <div>
      {parsed && (
        <div className="row">
          <label className="field grow">
            <span>{keyField}</span>
            <input
              value={String(parsed[keyField] ?? "")}
              onChange={(e) => setField(keyField, e.target.value)}
            />
          </label>
          {COMMON_FIELDS.filter((f) => f in parsed).map((f) => (
            <label className="field grow" key={f}>
              <span>{f}</span>
              <input value={String(parsed[f] ?? "")} onChange={(e) => setField(f, e.target.value)} />
            </label>
          ))}
          {"status" in parsed && (
            <label className="field">
              <span>status</span>
              <select value={String(parsed.status ?? "active")} onChange={(e) => setField("status", e.target.value)}>
                {[...new Set([...STATUS_OPTIONS, String(parsed.status ?? "active")])].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
      <label className="field">
        <span>Record JSON</span>
        <textarea rows={16} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      </label>
      {parseError && <div className="error-box">{parseError}</div>}
      {!parsed && !parseError && <div className="warn-box">JSON is currently invalid — fix it to save.</div>}
      <button onClick={handleSave} disabled={saving || !parsed}>
        {saving ? "Saving…" : saveLabel}
      </button>
    </div>
  );
}
