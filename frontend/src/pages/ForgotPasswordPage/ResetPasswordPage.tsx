import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import "../LoginPage/loginPage.css";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword)
      return setMessage("Passwords do not match.");
    setLoading(true);
    setMessage("");
    fetch(`http://localhost:8000/api/auth/reset-password/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
      })
      .then((data) => {
        setMessage(data.message);
        window.setTimeout(() => navigate("/login"), 1200);
      })
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoading(false));
  };
  return (
    <main className="staff-login-page">
      <section className="login-story-panel">
        <div className="login-brand">
          <span>
            <ShieldCheck size={22} />
          </span>
          <div>
            <b>GuestAI</b>
            <small>Hospitality Intelligence</small>
          </div>
        </div>
        <div className="login-story-copy">
          <span className="login-eyebrow">
            <ShieldCheck size={14} /> SECURE STAFF ACCESS
          </span>
          <h1>Create a new secure password.</h1>
          <p>This password reset link expires after fifteen minutes.</p>
        </div>
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <Link className="forgot-back" to="/login">
            <ArrowLeft size={16} /> Back to sign in
          </Link>
          <span className="login-eyebrow dark">
            <LockKeyhole size={14} /> RESET PASSWORD
          </span>
          <h2>Set new password</h2>
          <p className="login-subtitle">Use at least eight characters.</p>
          <form onSubmit={submit}>
            <label className="login-field">
              <span>New password</span>
              <div>
                <LockKeyhole size={18} />
                <input
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
            </label>
            <label className="login-field">
              <span>Confirm password</span>
              <div>
                <LockKeyhole size={18} />
                <input
                  type="password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>
            </label>
            {message && (
              <p className="login-error success-message">{message}</p>
            )}
            <button className="login-submit" disabled={loading} type="submit">
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
