import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, BrainCircuit, CalendarDays, ChevronRight, CircleAlert, ClipboardCheck, Search, SlidersHorizontal, UserRound, UsersRound } from "lucide-react";
import "./guestReviewQueuePage.css";

type Guest = {
  _id: string;
  fullName: string;
  email: string;
  country?: string;
  arrivalDate?: string;
  adults?: number;
  children?: number;
  bookingStatus?: string;
  status?: string;
  aiAnalysis?: { segment?: { name?: string }; bookingRisk?: { level?: string; probability?: number } };
};

const filters = ["All guests", "Ready to review", "Pending", "Confirmed", "Completed", "Cancelled"];
const statusNames = ["Pending review", "Confirmed", "Completed", "Cancelled"];
const statusColors = ["#efb24b", "#15a58f", "#4c80c4", "#d66d7b"];

function getBookingLifecycle(guest: Guest) {
  const status = String(guest.bookingStatus || "").trim();
  return ["Pending", "Confirmed", "Completed", "Cancelled"].includes(status)
    ? status
    : "Pending";
}

export default function GuestReviewQueuePage() {
  const navigate = useNavigate();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All guests");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/guests")
      .then((response) => response.json())
      .then((data) => setGuests(Array.isArray(data) ? data : []))
      .catch(() => setGuests([]))
      .finally(() => setLoading(false));
  }, []);

  const analytics = useMemo(() => {
    const pending = guests.filter((guest) => getBookingLifecycle(guest) === "Pending").length;
    const confirmed = guests.filter((guest) => getBookingLifecycle(guest) === "Confirmed").length;
    const completed = guests.filter((guest) => getBookingLifecycle(guest) === "Completed").length;
    const cancelled = guests.filter((guest) => getBookingLifecycle(guest) === "Cancelled").length;
    const values = [pending, confirmed, completed, cancelled];
    const total = Math.max(guests.length, 1);
    let position = 0;
    const chart = values.map((value, index) => {
      const start = position;
      position += value / total * 100;
      return `${statusColors[index]} ${start}% ${position}%`;
    });
    const risk = guests.filter((guest) => (guest.aiAnalysis?.bookingRisk?.probability || 0) >= 28).length;
    return { pending, risk, total: guests.length, values, chart: `conic-gradient(${chart.join(", ")}, #e8efee 0)` };
  }, [guests]);

  const visibleGuests = useMemo(() => guests.filter((guest) => {
    const searchable = `${guest.fullName} ${guest.email} ${guest.country || ""}`.toLowerCase();
    const currentStatus = getBookingLifecycle(guest);
    const matchesFilter = filter === "All guests" || currentStatus === filter || (filter === "Ready to review" && currentStatus === "Pending");
    return (!query || searchable.includes(query.toLowerCase())) && matchesFilter;
  }), [filter, guests, query]);

  return <main className="guest-queue-page">
    <header className="queue-header">
      <Link to="/Hotelstaffdashboard"><ArrowLeft size={17} /> Staff dashboard</Link>
      <div><span>GUEST OPERATIONS</span><h1>Guest Details</h1><p>Review guest details, booking risk, and AI recommendations before arrival.</p></div>
      <button type="button" onClick={() => navigate("/GuestDetailsForm")}><UserRound size={17} /> New guest profile</button>
    </header>

    <section className="queue-summary">
      <article><span className="summary-icon teal"><UsersRound size={20} /></span><div><small>Guest profiles</small><b>{analytics.total}</b></div></article>
      <article><span className="summary-icon amber"><ClipboardCheck size={20} /></span><div><small>Awaiting review</small><b>{analytics.pending}</b></div></article>
      <article><span className="summary-icon rose"><CircleAlert size={20} /></span><div><small>Risk follow-ups</small><b>{analytics.risk}</b></div></article>
    </section>

    <section className="queue-analytics">
      <article className="queue-donut-card">
        <div><span><Activity size={15} /> LIVE WORKFLOW</span><h2>Guest lifecycle</h2><p>Monitor profiles from submission through confirmation.</p></div>
        <div className="queue-donut-content"><div className="queue-donut" style={{ background: analytics.chart }}><div><b>{analytics.total}</b><small>profiles</small></div></div><div className="queue-legend">{statusNames.map((name, index) => <div key={name}><i style={{ background: statusColors[index] }} /><span>{name}</span><b>{analytics.values[index]}</b></div>)}</div></div>
      </article>
      <article className="queue-ai-card"><span><BrainCircuit size={16} /> AI PRIORITY DESK</span><h2>Make each arrival feel prepared.</h2><p>Open a guest profile to review AI preference analysis, places, services, and booking risk.</p><button type="button" onClick={() => setFilter("Ready to review")}>Review pending profiles <ChevronRight size={16} /></button></article>
    </section>

    <section className="queue-table-card">
      <div className="queue-toolbar"><label><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guest name, email, or country" /></label><div><SlidersHorizontal size={16} /><select value={filter} onChange={(event) => setFilter(event.target.value)}>{filters.map((item) => <option key={item}>{item}</option>)}</select></div></div>
      <div className="queue-table"><div className="queue-table-head"><span>Guest</span><span>Arrival</span><span>AI profile</span><span>Booking risk</span><span /></div>{visibleGuests.map((guest) => { const risk = guest.aiAnalysis?.bookingRisk; const arrival = guest.arrivalDate ? new Date(guest.arrivalDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Not confirmed"; return <article className="queue-row" key={guest._id}><div className="queue-guest"><b>{guest.fullName.split(" ").map((name) => name[0]).join("").slice(0, 2)}</b><span><strong>{guest.fullName}</strong><small>{guest.country || "Country pending"} · {guest.adults || 1} adults</small></span></div><div className="queue-arrival"><CalendarDays size={16} /><span>{arrival}<small>{guest.bookingStatus || guest.status || "Ready to review"}</small></span></div><div className="queue-segment"><BrainCircuit size={16} />{guest.aiAnalysis?.segment?.name || "AI analysis pending"}</div><span className={`queue-risk ${(risk?.level || "Low").toLowerCase()}`}>{risk?.level || "Low"} risk {risk?.probability !== undefined ? `· ${risk.probability}%` : ""}</span><div className="queue-actions"><button type="button" onClick={() => navigate(`/guest-details/${guest._id}`)}>Open profile <ChevronRight size={16} /></button><button type="button" onClick={() => navigate(`/preference-analysis/${guest._id}`)}>AI analysis</button></div></article>; })}{loading && <p className="queue-empty">Loading guest profiles…</p>}{!loading && !visibleGuests.length && <p className="queue-empty">No profiles match this search or filter.</p>}</div>
    </section>
  </main>;
}
