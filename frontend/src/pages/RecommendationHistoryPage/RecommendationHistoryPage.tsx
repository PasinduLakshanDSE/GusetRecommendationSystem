import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BrainCircuit, CheckCircle2, ClipboardCheck, Filter, Save, Search, UserRound } from "lucide-react";
import "./recommendationHistoryPage.css";

type Action = { action: string; reason?: string; match?: number; status?: string; owner?: string; note?: string; updatedAt?: string };
type Guest = { _id: string; fullName: string; arrivalDate?: string; bookingStatus?: string; aiAnalysis?: { staffActionPlan?: { source?: string; actions?: Action[] }; purposeContext?: { staffActions?: string[] } }; staffActionProgress?: Action[] };

const actionStatuses = ["Pending", "Approved", "In progress", "Completed", "Rejected"];

function guestActions(guest: Guest): Action[] {
  const aiActions = guest.aiAnalysis?.staffActionPlan?.actions || [];
  const fallback = guest.aiAnalysis?.purposeContext?.staffActions?.map((action) => ({ action, match: 70 })) || [];
  const stored = guest.staffActionProgress || [];
  return (aiActions.length ? aiActions : fallback).map((item) => ({
    ...item,
    ...(stored.find((saved) => saved.action === item.action) || {}),
    status: stored.find((saved) => saved.action === item.action)?.status || "Pending",
  }));
}

export default function RecommendationHistoryPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/api/guests")
      .then((response) => response.json())
      .then((data) => setGuests(Array.isArray(data) ? data : []))
      .catch(() => setGuests([]));
  }, []);

  const actionGroups = useMemo(() => guests.map((guest) => ({ guest, actions: guestActions(guest) })).filter((group) => group.actions.length), [guests]);
  const visibleActionGroups = useMemo(() => actionGroups.filter(({ guest, actions }) => {
    const searchable = `${guest.fullName} ${guest.bookingStatus || ""} ${guest.arrivalDate || ""} ${actions.map((action) => action.action).join(" ")}`.toLowerCase();
    return !search.trim() || searchable.includes(search.trim().toLowerCase());
  }), [actionGroups, search]);
  const counts = useMemo(() => ({
    total: actionGroups.reduce((sum, group) => sum + group.actions.length, 0),
    pending: actionGroups.reduce((sum, group) => sum + group.actions.filter((action) => action.status === "Pending").length, 0),
    completed: actionGroups.reduce((sum, group) => sum + group.actions.filter((action) => action.status === "Completed").length, 0),
  }), [actionGroups]);

  const saveActions = async (guest: Guest, actions: Action[]) => {
    setSaving(guest._id); setMessage("");
    try {
      const response = await fetch(`http://localhost:8000/api/guests/${guest._id}/staff-actions`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ staffActionProgress: actions.map((action) => ({ ...action, updatedAt: new Date().toISOString() })) }) });
      if (!response.ok) throw new Error("Could not save staff action changes");
      const updated = await response.json();
      setGuests((current) => current.map((item) => item._id === updated._id ? updated : item));
      setMessage(`Saved staff actions for ${guest.fullName}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save changes"); }
    finally { setSaving(null); }
  };

  return <main className="action-history-page">
    <header className="action-history-header"><Link to="/Hotelstaffdashboard"><ArrowLeft size={17} /> Staff dashboard</Link><div><span>AI OPERATIONS WORKSPACE</span><h1>Staff action plan</h1><p>Review, approve, assign, and track AI-generated actions for every guest.</p></div></header>
    <section className="action-summary"><article><span><BrainCircuit size={20} /></span><div><small>AI actions generated</small><b>{counts.total}</b></div></article><article><span className="amber"><ClipboardCheck size={20} /></span><div><small>Awaiting decision</small><b>{counts.pending}</b></div></article><article><span className="green"><CheckCircle2 size={20} /></span><div><small>Completed actions</small><b>{counts.completed}</b></div></article></section>
    <div className="action-controls"><label className="action-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search guest name, arrival date, or AI action" /></label><div className="action-filter"><Filter size={16} />{["All", ...actionStatuses].map((status) => <button key={status} type="button" className={filter === status ? "active" : ""} onClick={() => setFilter(status)}>{status}</button>)}</div></div>
    {message && <p className="action-message">{message}</p>}
    <section className="action-groups">{visibleActionGroups.map(({ guest, actions }) => {
      const visible = filter === "All" ? actions : actions.filter((action) => action.status === filter);
      if (!visible.length) return null;
      return <article className="guest-action-card" key={guest._id}><header><div className="action-guest"><span>{guest.fullName.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span><div><h2>{guest.fullName}</h2><small>{guest.arrivalDate ? `Arrival ${new Date(guest.arrivalDate).toLocaleDateString()}` : "Arrival pending"} · {guest.bookingStatus || "Pending"}</small></div></div><Link to={`/guest-details/${guest._id}`}>Guest details</Link></header><p className="action-source"><BrainCircuit size={15} /> {guest.aiAnalysis?.staffActionPlan?.source || "AI personalised action guidance"}</p><div className="action-list">{visible.map((item) => { const index = actions.findIndex((action) => action.action === item.action); return <div className="staff-action-row" key={item.action}><div className="action-number">{index + 1}</div><div className="action-content"><b>{item.action}</b><p>{item.reason || "AI recommendation generated from guest profile and hotel service intelligence."}</p><small>AI confidence: {item.match || 70}%</small></div><label>Status<select value={item.status || "Pending"} onChange={(event) => { const next = actions.map((action) => action.action === item.action ? { ...action, status: event.target.value } : action); setGuests((current) => current.map((currentGuest) => currentGuest._id === guest._id ? { ...currentGuest, staffActionProgress: next } : currentGuest)); }}>{actionStatuses.map((status) => <option key={status}>{status}</option>)}</select></label><label>Owner<input value={item.owner || ""} placeholder="Assign staff" onChange={(event) => { const next = actions.map((action) => action.action === item.action ? { ...action, owner: event.target.value } : action); setGuests((current) => current.map((currentGuest) => currentGuest._id === guest._id ? { ...currentGuest, staffActionProgress: next } : currentGuest)); }} /></label></div>; })}</div><div className="action-card-footer"><span><UserRound size={15} /> Staff decisions are stored with this guest profile.</span><button type="button" disabled={saving === guest._id} onClick={() => saveActions(guest, actions)}><Save size={15} /> {saving === guest._id ? "Saving…" : "Save action plan"}</button></div></article>;
    })}{!actionGroups.length && <p className="action-empty">No AI staff-action plans are available yet. Create a guest profile after the Flask AI service is running.</p>}{!!actionGroups.length && !visibleActionGroups.length && <p className="action-empty">No guest action plans match your search.</p>}</section>
  </main>;
}
