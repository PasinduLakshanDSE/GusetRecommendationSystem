import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CircleCheck,
  CircleX,
  LockKeyhole,
  Plus,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";
import { authHeaders, getSession } from "../../auth";
import "./userManagementPage.css";

type StaffUser = {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "staff";
  department: string;
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
};
const initialForm = {
  fullName: "",
  email: "",
  password: "",
  role: "staff",
  department: "Guest Services",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const loadUsers = () =>
    fetch("http://localhost:8000/api/staff-users", { headers: authHeaders() })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setUsers(data);
      })
      .catch((error: Error) => setMessage(error.message));
  useEffect(() => {
    loadUsers();
  }, []);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);
    fetch("http://localhost:8000/api/staff-users", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(form),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
      })
      .then(() => {
        setForm(initialForm);
        setMessage("Staff account created successfully.");
        loadUsers();
      })
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setIsSaving(false));
  };
  const toggleStatus = (user: StaffUser) =>
    fetch(`http://localhost:8000/api/staff-users/${user.id}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ active: !user.active }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
      })
      .then(loadUsers)
      .catch((error: Error) => setMessage(error.message));
  const currentUser = getSession()?.user;
  return (
    <main className="user-management-page">
      <header className="management-topbar">
        <Link to="/Hotelstaffdashboard">
          <ArrowLeft size={17} /> Dashboard
        </Link>
        <div>
          <span>ADMINISTRATION</span>
          <h1>User management</h1>
          <p>Create and control secure hotel staff accounts.</p>
        </div>
        <div className="admin-chip">
          <ShieldCheck size={17} />
          <span>
            <b>{currentUser?.fullName}</b>
            <small>Administrator</small>
          </span>
        </div>
      </header>
      <section className="management-grid">
        <article className="create-user-card">
          <div className="management-heading">
            <span>
              <UserCog size={19} />
            </span>
            <div>
              <b>Create staff account</b>
              <p>New users can sign in after their account is saved.</p>
            </div>
          </div>
          <form onSubmit={submit}>
            <label>
              Full name
              <input
                value={form.fullName}
                onChange={(event) =>
                  setForm({ ...form, fullName: event.target.value })
                }
                placeholder="Staff member name"
              />
            </label>
            <label>
              Work email
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                placeholder="staff@hotel.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                minLength={8}
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                placeholder="Minimum 8 characters"
              />
            </label>
            <div className="management-form-grid">
              <label>
                Role
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      role: event.target.value as "admin" | "staff",
                    })
                  }
                >
                  <option value="staff">Hotel staff</option>
                  <option value="admin">Administrator</option>
                </select>
              </label>
              <label>
                Department
                <input
                  value={form.department}
                  onChange={(event) =>
                    setForm({ ...form, department: event.target.value })
                  }
                />
              </label>
            </div>
            {message && <p className="management-message">{message}</p>}
            <button type="submit" disabled={isSaving}>
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Plus size={17} /> Create staff user
                </>
              )}
            </button>
          </form>
        </article>
        <article className="staff-list-card">
          <div className="staff-list-header">
            <div>
              <span>STAFF DIRECTORY</span>
              <h2>Portal users</h2>
              <p>
                {users.length} account{users.length === 1 ? "" : "s"} registered
                in the hotel portal.
              </p>
            </div>
            <UsersRound size={24} />
          </div>
          <div className="staff-table">
            <div className="staff-table-head">
              <span>User</span>
              <span>Role</span>
              <span>Status</span>
              <span>Control</span>
            </div>
            {users.map((user) => (
              <article key={user.id}>
                <div className="staff-identity">
                  <b>
                    {user.fullName
                      .split(" ")
                      .map((name) => name[0])
                      .join("")
                      .slice(0, 2)}
                  </b>
                  <span>
                    <strong>{user.fullName}</strong>
                    <small>
                      {user.email} · {user.department}
                    </small>
                  </span>
                </div>
                <span className={`role-pill ${user.role}`}>{user.role}</span>
                <span
                  className={`status-pill ${user.active ? "active" : "inactive"}`}
                >
                  {user.active ? (
                    <CircleCheck size={15} />
                  ) : (
                    <CircleX size={15} />
                  )}
                  {user.active ? "Active" : "Inactive"}
                </span>
                <button
                  className={user.active ? "deactivate" : "activate"}
                  type="button"
                  onClick={() => toggleStatus(user)}
                  disabled={user.id === currentUser?.id}
                >
                  {user.active ? "Deactivate" : "Activate"}
                </button>
              </article>
            ))}
            {!users.length && (
              <p className="empty-users">
                <LockKeyhole size={20} /> Loading staff users…
              </p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
