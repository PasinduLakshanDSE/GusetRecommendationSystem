import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import "../LoginPage/loginPage.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    fetch("http://localhost:8000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Password reset email could not be sent.");
        return data;
      })
      .then((data) => setMessage(data.message))
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
          <h1>Reset access, protect every guest.</h1>
          <p>
            Your staff account stays protected with a secure, time-limited
            password reset link.
          </p>
        </div>
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <Link className="forgot-back" to="/login">
            <ArrowLeft size={16} /> Back to sign in
          </Link>
          <span className="login-eyebrow dark">
            <ShieldCheck size={14} /> PASSWORD RECOVERY
          </span>
          <h2>Forgot password?</h2>
          <p className="login-subtitle">
            Enter your staff email and we will send a secure reset link.
          </p>
          <form onSubmit={submit}>
            <label className="login-field">
              <span>Work email</span>
              <div>
                <Mail size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@hotel.com"
                  required
                />
              </div>
            </label>
            {message && (
              <p className="login-error success-message">{message}</p>
            )}
            <button className="login-submit" disabled={loading} type="submit">
              {loading ? "Sending email..." : "Send password reset email"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
