import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BellRing,
  BrainCircuit,
  Building2,
  Check,
  Globe2,
  Hotel,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  UserCog,
} from "lucide-react";
import "./settingsPage.css";
import { authHeaders, getSession } from "../../auth";

type Settings = {
  hotelName: string;
  location: string;
  contactEmail: string;
  timezone: string;
  newGuestAlerts: boolean;
  riskAlerts: boolean;
  dailySummary: boolean;
  aiAutoAnalysis: boolean;
  aiStaffActions: boolean;
};

const defaultSettings: Settings = {
  hotelName: "GuestAI Hotel",
  location: "Sri Lanka",
  contactEmail: "guestservices@hotel.com",
  timezone: "Asia/Colombo (GMT+5:30)",
  newGuestAlerts: true,
  riskAlerts: true,
  dailySummary: false,
  aiAutoAnalysis: true,
  aiStaffActions: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const canEdit = getSession()?.user.role === "admin";

  useEffect(() => {
    fetch("http://localhost:8000/api/settings", { headers: authHeaders() })
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).error || "Unable to load portal settings");
        return response.json();
      })
      .then((data) => setSettings({ ...defaultSettings, ...data }))
      .catch((error) => setMessage(error.message || "Unable to load portal settings."));
  }, []);

  const update = (field: keyof Settings, value: string | boolean) =>
    setSettings((current) => ({ ...current, [field]: value }));
  const save = async () => {
    if (!canEdit) return setMessage("Only an administrator can change portal settings.");
    setSaving(true); setMessage("");
    try {
      const response = await fetch("http://localhost:8000/api/settings", { method: "PATCH", headers: authHeaders(), body: JSON.stringify(settings) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save portal settings");
      setSettings({ ...defaultSettings, ...data });
      setSaved(true); setMessage("Settings saved for all staff users.");
      window.setTimeout(() => setSaved(false), 2800);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save portal settings."); }
    finally { setSaving(false); }
  };

  return (
    <main className="settings-page">
      <header className="settings-header">
        <Link to="/Hotelstaffdashboard">
          <ArrowLeft size={17} /> Staff dashboard
        </Link>
        <div>
          <span>PORTAL CONFIGURATION</span>
          <h1>Settings</h1>
          <p>
            Manage the hotel workspace, staff notifications, and AI operations.
          </p>
        </div>
        <button type="button" onClick={save} disabled={!canEdit || saving}>
          {saved ? <Check size={17} /> : <Save size={17} />}
          {saved ? "Saved" : saving ? "Saving…" : "Save changes"}
        </button>
      </header>
      <section className="settings-layout">
        <aside className="settings-sidebar">
          <div className="settings-sidebar-brand">
            <Hotel size={20} />
            <span>
              <b>GuestAI</b>
              <small>Hospitality Intelligence</small>
            </span>
          </div>
          <a href="#hotel">
            <Building2 size={17} /> Hotel profile
          </a>
          <a href="#notifications">
            <BellRing size={17} /> Notifications
          </a>
          <a href="#ai">
            <BrainCircuit size={17} /> AI workspace
          </a>
          <a href="#security">
            <ShieldCheck size={17} /> Privacy & security
          </a>
          <p>
            <Sparkles size={15} /> Shared securely with all hotel staff.
          </p>
        </aside>
        <div className="settings-content">
          <section className="settings-card" id="hotel">
            <div className="settings-card-heading">
              <span className="settings-icon teal">
                <Building2 size={20} />
              </span>
              <div>
                <h2>Hotel profile</h2>
                <p>Basic details displayed across the staff portal.</p>
              </div>
            </div>
            <div className="settings-form-grid">
              <label>
                Hotel name
                <input
                  value={settings.hotelName}
                  disabled={!canEdit}
                  onChange={(event) => update("hotelName", event.target.value)}
                />
              </label>
              <label>
                Hotel location
                <input
                  value={settings.location}
                  disabled={!canEdit}
                  onChange={(event) => update("location", event.target.value)}
                />
              </label>
              <label>
                Guest services email
                <input
                  type="email"
                  value={settings.contactEmail}
                  disabled={!canEdit}
                  onChange={(event) =>
                    update("contactEmail", event.target.value)
                  }
                />
              </label>
              <label>
                Time zone
                <select
                  value={settings.timezone}
                  disabled={!canEdit}
                  onChange={(event) => update("timezone", event.target.value)}
                >
                  <option>Asia/Colombo (GMT+5:30)</option>
                  <option>Asia/Singapore (GMT+8:00)</option>
                  <option>Europe/London (GMT+0:00)</option>
                </select>
              </label>
            </div>
          </section>
          <section className="settings-card" id="notifications">
            <div className="settings-card-heading">
              <span className="settings-icon gold">
                <BellRing size={20} />
              </span>
              <div>
                <h2>Staff notifications</h2>
                <p>Choose which operational alerts appear in the portal.</p>
              </div>
            </div>
            <div className="settings-toggles">
              <Toggle
                label="New guest profile alerts"
                detail="Notify staff when a guest submits preferences."
                checked={settings.newGuestAlerts}
                disabled={!canEdit}
                onChange={(value) => update("newGuestAlerts", value)}
              />
              <Toggle
                label="Booking-risk alerts"
                detail="Highlight guests whose booking needs follow-up."
                checked={settings.riskAlerts}
                disabled={!canEdit}
                onChange={(value) => update("riskAlerts", value)}
              />
              <Toggle
                label="Daily operations summary"
                detail="Show a daily summary when staff open the dashboard."
                checked={settings.dailySummary}
                disabled={!canEdit}
                onChange={(value) => update("dailySummary", value)}
              />
            </div>
          </section>
          <section className="settings-card" id="ai">
            <div className="settings-card-heading">
              <span className="settings-icon violet">
                <BrainCircuit size={20} />
              </span>
              <div>
                <h2>AI workspace</h2>
                <p>Control how the hospitality AI supports staff operations.</p>
              </div>
            </div>
            <div className="ai-settings-status">
              <div>
                <span>
                  <i /> AI Engine Online
                </span>
                <small>
                  Preference segmentation · booking risk · review intelligence ·
                  staff-action plans
                </small>
              </div>
              <b>Local AI + trained models</b>
            </div>
            <div className="settings-toggles">
              <Toggle
                label="Generate preference analysis automatically"
                detail="Create a personalised AI analysis after a guest submits details."
                checked={settings.aiAutoAnalysis}
                disabled={!canEdit}
                onChange={(value) => update("aiAutoAnalysis", value)}
              />
              <Toggle
                label="Generate staff action plans"
                detail="Prepare AI recommendations for staff review and approval."
                checked={settings.aiStaffActions}
                disabled={!canEdit}
                onChange={(value) => update("aiStaffActions", value)}
              />
            </div>
          </section>
          <section className="settings-card" id="security">
            <div className="settings-card-heading">
              <span className="settings-icon blue">
                <ShieldCheck size={20} />
              </span>
              <div>
                <h2>Privacy & security</h2>
                <p>
                  Guest information should only be viewed by authorised hotel
                  staff.
                </p>
              </div>
            </div>
            <div className="security-grid">
              <div>
                <ShieldCheck size={19} />
                <span>
                  <b>Staff access is protected</b>
                  <small>
                    Use User Management to control staff roles and portal
                    access.
                  </small>
                </span>
              </div>
              <div>
                <Mail size={19} />
                <span>
                  <b>Password reset email enabled</b>
                  <small>
                    Staff can request a secure reset link from the login page.
                  </small>
                </span>
              </div>
              <div>
                <Globe2 size={19} />
                <span>
                  <b>Local workspace preferences</b>
                  <small>
                    Portal settings are stored securely in the shared database.
                  </small>
                </span>
              </div>
            </div>
            <Link to="/user-management" className="manage-users">
              <UserCog size={16} /> Manage staff users
            </Link>
          </section>
        </div>
      </section>
      {message && <p className="settings-message">{message}</p>}
    </main>
  );
}

function Toggle({
  label,
  detail,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="settings-toggle">
      <span>
        <b>{label}</b>
        <small>{detail}</small>
      </span>
      <button
        type="button"
        disabled={disabled}
        className={checked ? "on" : ""}
        onClick={() => onChange(!checked)}
        aria-label={label}
      >
        <i />
      </button>
    </div>
  );
}
