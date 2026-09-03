import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  Bell,
  BrainCircuit,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  Compass,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import "./modernHotelStaffDashboard.css";

type NavigationItem = {
  label: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Guest Profile", icon: UserRound },
  { label: "Preference Analysis", icon: BrainCircuit },
  { label: "Recommendations", icon: Sparkles },
  { label: "Booking Risk", icon: ShieldAlert },
  { label: "Review Intelligence", icon: Compass },
  { label: "Recommendation History", icon: CalendarClock },
  { label: "Settings", icon: Settings },
];

const metrics = [
  {
    label: "Guest profiles",
    value: "18",
    detail: "5 newly submitted",
    icon: UsersRound,
    tone: "teal",
  },
  {
    label: "Pending review",
    value: "5",
    detail: "Require staff attention",
    icon: CalendarClock,
    tone: "amber",
  },
  {
    label: "AI recommendations",
    value: "24",
    detail: "Generated for current stays",
    icon: Sparkles,
    tone: "blue",
  },
  {
    label: "Arrival risk alerts",
    value: "2",
    detail: "Bookings needing follow-up",
    icon: CircleAlert,
    tone: "violet",
  },
];

const guests = [
  {
    initials: "MP",
    name: "Maya Perera",
    detail: "Sri Lanka · Family · 2 children",
    room: "Garden Suite",
    budget: "High budget",
    recommendation: "Family adventure",
    status: "Ready to review",
    tone: "ready",
  },
  {
    initials: "DC",
    name: "Daniel Chen",
    detail: "Australia · Solo traveller",
    room: "Mountain View",
    budget: "Medium budget",
    recommendation: "Wellness escape",
    status: "Approved",
    tone: "approved",
  },
  {
    initials: "EW",
    name: "Emma Williams",
    detail: "United Kingdom · Couple",
    room: "Ocean View",
    budget: "Luxury budget",
    recommendation: "Honeymoon package",
    status: "Pending review",
    tone: "pending",
  },
];

const arrivals = [
  { time: "10:30", name: "Maya Perera", detail: "Family suite ready" },
  { time: "14:00", name: "Daniel Chen", detail: "Wellness service requested" },
  { time: "16:45", name: "Emma Williams", detail: "Honeymoon package" },
];

const navigationPaths: Record<string, string> = {
  Dashboard: "/Hotelstaffdashboard",
  "Guest Profile": "/GuestDetailsForm",
  "Preference Analysis": "/GuestDetailsForm",
  Recommendations: "/Hotelstaffdashboard",
  "Booking Risk": "/Hotelstaffdashboard",
  "Review Intelligence": "/Hotelstaffdashboard",
  "Recommendation History": "/Hotelstaffdashboard",
  Settings: "/Hotelstaffdashboard",
};

export default function ModernHotelStaffDashboard() {
  const navigate = useNavigate();
  const [activeNavigation, setActiveNavigation] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [databaseGuests, setDatabaseGuests] = useState<any[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/guests")
      .then((response) => response.json())
      .then((data) => setDatabaseGuests(data))
      .catch(() => setDatabaseGuests([]));
  }, []);
  const [submittedGuest] = useState(() => {
    const savedGuest = sessionStorage.getItem("latestGuestAnalysis");
    return savedGuest ? JSON.parse(savedGuest) : null;
  });

  const dashboardGuests = submittedGuest
    ? [{
        initials: submittedGuest.name.split(" ").map((name: string) => name[0]).join("").slice(0, 2),
        name: submittedGuest.name,
        detail: `${submittedGuest.country} · ${submittedGuest.adults} guest${submittedGuest.adults === 1 ? "" : "s"}`,
        room: submittedGuest.district || "Hotel stay",
        budget: `${submittedGuest.budget} budget`,
        recommendation: submittedGuest.analysis.services[0].name,
        status: submittedGuest.status,
        tone: "ready",
      }, ...guests]
    : guests;
  void dashboardGuests;

  return (
    <main className="hotel-dashboard">
      <aside className={isSidebarOpen ? "hotel-sidebar open" : "hotel-sidebar"}>
        <div className="hotel-brand">
          <div className="hotel-brand-mark">
            <BrainCircuit size={24} />
          </div>
          <div>
            <strong>GuestAI</strong>
            <span>Hospitality Intelligence</span>
          </div>
          <button
            className="sidebar-close"
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="hotel-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className={activeNavigation === item.label ? "selected" : ""}
                onClick={() => {
                  setActiveNavigation(item.label);
                  setIsSidebarOpen(false);
                  navigate(navigationPaths[item.label]);
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-engine">
          <span>
            <i />
            AI Engine Online
          </span>
          <p>Hybrid intelligence workspace</p>
        </div>
      </aside>

      {isSidebarOpen && (
        <button
          className="sidebar-overlay"
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}

      <section className="hotel-content">
        <header className="hotel-topbar">
          <div className="topbar-title">
            <button
              className="menu-button"
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div>
              <span>Hotel staff portal</span>
              <h1>Guest Experience Dashboard</h1>
              <p>
                Review guest preferences and approve AI service recommendations.
              </p>
            </div>
          </div>
          <div className="topbar-tools">
            <button
              className="notification"
              type="button"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <b>{databaseGuests.filter((guest) => !guest.notificationRead).length}</b>
            </button>
            <div className="date-card">
              <small>Today</small>
              <strong>30 August 2026</strong>
            </div>
          </div>
        </header>

        <section className="experience-hero">
          <div className="hero-copy">
            <span>
              <Sparkles size={15} />
              AI-powered guest insights
            </span>
            <h2>
              Deliver more personalised
              <br />
              hotel experiences
            </h2>
            <p>
              Review newly submitted guest profiles, prepare suitable services,
              and make every arrival feel considered.
            </p>
            <div className="hero-buttons">
              <button type="button" className="primary-action">
                Review guest profiles <ArrowRight size={17} />
              </button>
              <button type="button" className="secondary-action">
                View recommendations
              </button>
            </div>
          </div>
          <div className="attention-card">
            <div>
              <UserRound size={29} />
            </div>
            <strong>8</strong>
            <span>guest profiles awaiting attention</span>
          </div>
        </section>

        <section className="metric-grid">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article className="metric-card" key={metric.label}>
                <span className={`metric-icon ${metric.tone}`}>
                  <Icon size={25} />
                </span>
                <div>
                  <p>{metric.label}</p>
                  <strong>{metric.value}</strong>
                  <small>{metric.detail}</small>
                </div>
              </article>
            );
          })}
        </section>

        <section className="dashboard-grid">
          <article className="review-panel">
            <div className="panel-heading">
              <div>
                <span>Guest review queue</span>
                <h3>Recent guest profiles</h3>
                <p>
                  Prioritize guests arriving soon and approve their tailored
                  plan.
                </p>
              </div>
              <button type="button">
                View all <ChevronRight size={17} />
              </button>
            </div>
            <label className="guest-search">
              <Search size={18} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search guest, country, or recommendation"
              />
              <button type="button">All guests</button>
            </label>
            <div className="guest-list">
              <div className="guest-list-head">
                <span>Guest</span>
                <span>Stay</span>
                <span>Recommendation</span>
                <span>Status</span>
                <span />
              </div>
              {databaseGuests.map((guest) => (
                <article className="guest-row" key={guest._id} onClick={() => navigate(`/guest-details/${guest._id}`)}>
                  <div className="guest-identity">
                    <b>{guest.fullName.split(" ").map((name: string) => name[0]).join("").slice(0, 2)}</b>
                    <span>
                      <strong>{guest.fullName}</strong>
                      <small>{guest.country} · {guest.adults} adults</small>
                    </span>
                  </div>
                  <div className="guest-stay">
                    <strong>{guest.roomPreference || "Hotel stay"}</strong>
                    <small>{guest.budget} budget</small>
                  </div>
                  <div className="guest-recommendation">
                    <Sparkles size={15} />
                    <strong>{guest.aiAnalysis?.services?.[0]?.name || "AI analysis pending"}</strong>
                  </div>
                  <div className="guest-status ready">
                    <i />
                    {guest.status || "Ready to review"}
                  </div>
                  <button
                    className="guest-arrow"
                    type="button"
                    aria-label={`Open ${guest.fullName}`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </article>
              ))}
            </div>
          </article>

          <aside className="side-panels">
            <article className="arrivals-panel">
              <div className="arrivals-heading">
                <div>
                  <span>Today’s arrivals</span>
                  <h3>Make arrivals seamless</h3>
                </div>
                <b>6 arrivals</b>
              </div>
              <div className="arrival-list">
                {arrivals.map((arrival) => (
                  <button
                    type="button"
                    className="arrival-row"
                    key={arrival.name}
                  >
                    <strong>{arrival.time}</strong>
                    <span>
                      <b>{arrival.name}</b>
                      <small>{arrival.detail}</small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
              <button className="arrival-link" type="button">
                Open arrival board <ArrowRight size={16} />
              </button>
            </article>
            <article className="ai-focus">
              <span>
                <Activity size={20} />
              </span>
              <small>AI recommendation focus</small>
              <h3>
                2 family profiles would benefit from activity planning before
                check-in.
              </h3>
              <button type="button">
                Review suggestions <ArrowRight size={16} />
              </button>
            </article>
          </aside>
        </section>
        {selectedGuest && <section className="ai-output-panel"><div><span>Selected guest · AI analysis</span><h2>{selectedGuest.fullName}</h2><p>{selectedGuest.aiAnalysis?.summary}</p></div><button type="button" onClick={() => setSelectedGuest(null)}>Close</button><div className="ai-output-grid"><article><h3>Guest segment</h3><strong>{selectedGuest.aiAnalysis?.segment?.name}</strong><p>AI cluster {selectedGuest.aiAnalysis?.segment?.cluster}</p></article><article><h3>Top services</h3>{selectedGuest.aiAnalysis?.services?.map((service: any) => <p key={service.id}><b>{service.name}</b><span>{service.category} · {service.match}% match</span></p>)}</article><article><h3>Recommended places</h3>{selectedGuest.aiAnalysis?.places?.map((place: any) => <p key={place.name}><b>{place.name}</b><span>{place.district} · {place.match}% match</span></p>)}</article></div></section>}
      </section>
    </main>
  );
}
