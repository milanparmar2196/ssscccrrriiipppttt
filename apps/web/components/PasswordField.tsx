"use client";

export function passwordScore(pw: string): number {
  let s = 0;
  if (pw.length >= 10) s++;
  if (pw.length >= 14) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

const LABELS = ["Very weak", "Weak", "Okay", "Strong", "Very strong"];
const COLORS = ["#ff6b6b", "#ff6b6b", "#ffb454", "#3ddc97", "#3ddc97"];

export default function PasswordField({
  value,
  onChange,
  label = "Password",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const score = passwordScore(value);
  return (
    <div>
      <label>{label} (minimum 10 characters)</label>
      <input type="password" value={value} onChange={(e) => onChange(e.target.value)} required />
      {value && (
        <div style={{ marginTop: 6 }}>
          <div className="progress">
            <div style={{ width: `${(score + 1) * 20}%`, background: COLORS[score] }} />
          </div>
          <span className="small muted">
            Strength: {LABELS[score]}
            {score === 0 ? " — very weak passwords are rejected." : ""}
          </span>
        </div>
      )}
    </div>
  );
}
