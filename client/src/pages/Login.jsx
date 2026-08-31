import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

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
        <div className="brand">Nana Fruit</div>
        <h1>Sign in</h1>
        <p className="muted sm">Use your Nana Fruit employee email.</p>

        <label className="field"><span>Email</span>
          <input type="email" autoComplete="username" required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@nanafruit.com" />
        </label>
        <label className="field"><span>Password</span>
          <input type="password" autoComplete="current-password" required value={password}
            onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <div className="error">{error}</div>}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <details className="demo-creds">
          <summary>Demo accounts (dev)</summary>
          <table>
            <tbody>
              <tr><td>admin@nanafruit.com</td><td>admin1234</td><td>view + edit all</td></tr>
              <tr><td>audit@nanafruit.com</td><td>audit1234</td><td>view all</td></tr>
              <tr><td>office@nanafruit.com</td><td>office1234</td><td>Office only</td></tr>
              <tr><td>factory@nanafruit.com</td><td>factory1234</td><td>Factory only</td></tr>
            </tbody>
          </table>
        </details>
      </form>
    </div>
  );
}
