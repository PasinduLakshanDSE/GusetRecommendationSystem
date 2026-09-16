import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BrainCircuit, Building2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { saveSession } from "../../auth";
import "./loginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/api/auth/setup-status").then((response) => response.json()).then((data) => setNeedsSetup(Boolean(data.needsSetup))).catch(() => setError("The staff authentication service is unavailable. Start the Node server."));
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim() || (needsSetup && !fullName.trim())) {
      setError(needsSetup ? "Enter your name, work email, and an 8-character password." : "Enter your staff email address and password.");
      return;
    }
    setError("");
    setIsLoading(true);
    fetch(`http://localhost:8000/api/auth/${needsSetup ? "bootstrap" : "login"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(needsSetup ? { fullName, email, password } : { email, password }) })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to sign in."); return data; })
      .then((data) => { saveSession(data); navigate("/Hotelstaffdashboard"); })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setIsLoading(false));
  };

  return (
    <main className="staff-login-page">
      <section className="login-story-panel">
        <div className="login-brand">
          
            <BrainCircuit size={24} />
          
          <div><b>GuestAI</b><small>Hospitality Intelligence</small></div>
        </div>
        <div className="login-story-copy">
          <span className="login-eyebrow"><Sparkles size={14} /> AI-POWERED HOTEL OPERATIONS</span>
          <h1>Every arrival deserves a more personal welcome.</h1>
          <p>Turn guest preferences, hotel feedback, and AI insight into a stay your team can prepare with confidence.</p>
        </div>
        <div className="login-insight-card">
          <span className="insight-icon"><Building2 size={21} /></span>
          <div><b>One workspace for your team</b><p>Review guest profiles, recommendations, feedback intelligence, and action plans.</p></div>
        </div>
        <p className="login-copyright">© 2026 GuestAI · Secure hospitality workspace</p>
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrap">
          <div className="mobile-login-brand login-brand">
            <span><Sparkles size={20} /></span><div><b>GuestAI</b><small>Hospitality Intelligence</small></div>
          </div>
          <span className="login-eyebrow dark"><ShieldCheck size={14} /> STAFF PORTAL</span>
          <h2>{needsSetup ? "Create first admin" : "Welcome back"}</h2>
          <p className="login-subtitle">{needsSetup ? "Set up the secure administrator account for GuestAI." : "Sign in to prepare personalised guest experiences."}</p>

          <form onSubmit={handleSubmit} noValidate>
            {needsSetup && <label className="login-field"><span>Administrator name</span><div><Building2 size={18} /><input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Hotel administrator" autoComplete="name" /></div></label>}
            <label className="login-field">
              <span>Work email</span>
              <div><Mail size={18} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@hotel.com" autoComplete="email" /></div>
            </label>
            <label className="login-field">
              <span>Password</span>
              <div><LockKeyhole size={18} /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            </label>
            <div className="login-options"><label><input type="checkbox" /> Remember me</label><button type="button" onClick={() => navigate("/forgot-password")}>Forgot password?</button></div>
            {error && <p className="login-error" role="alert">{error}</p>}
            <button className="login-submit" type="submit" disabled={isLoading}>{isLoading ? "Please wait..." : <>{needsSetup ? "Create administrator" : "Sign in to staff portal"} <ArrowRight size={18} /></>}</button>
          </form>
          <p className="login-security"><ShieldCheck size={16} /> Your guest and hotel data stays protected.</p>
        </div>
      </section>
    </main>
  );
}
