import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) { navigate("/", { replace: true }); return null; }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1>เข้าสู่ระบบ</h1>
        <p className="muted">ใช้อีเมลพนักงาน Nana Fruit</p>

        <label>อีเมล
          <input type="email" autoComplete="username" required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@nanafruit.com" />
        </label>
        <label>รหัสผ่าน
          <input type="password" autoComplete="current-password" required value={password}
            onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={busy}>{busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}</button>

        <details className="demo-creds">
          <summary>บัญชีทดสอบ (dev)</summary>
          <ul>
            <li>admin@nanafruit.com / admin1234 — ดู+แก้ไขทั้งหมด</li>
            <li>audit@nanafruit.com / audit1234 — ดูได้ทั้งหมด</li>
            <li>office@nanafruit.com / office1234 — เฉพาะ Office</li>
            <li>factory@nanafruit.com / factory1234 — เฉพาะโรงงาน</li>
          </ul>
        </details>
      </form>
    </div>
  );
}
