import { useEffect, useMemo, useRef, useState } from "react";
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
  ClipboardCheck,
  Compass,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  UserRound,
  UsersRound,
  UserCog,
  LogOut,
  X,
} from "lucide-react";

import "./modernHotelStaffDashboard.css";
import { clearSession, getSession } from "../../auth";

type NavigationItem = {
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};
type HotelIntelligence = {
  source?: string;
  scope?: string;
  aspects?: {
    name: string;
    sentimentScore: number;
    negativePercentage: number;
    status: string;
  }[];
  alerts?: { aspect: string; message: string }[];
};

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Guest Details", icon: ClipboardCheck },
 // { label: "Guest Profile", icon: UserRound },
  { label: "Preference Analysis", icon: BrainCircuit },
  { label: "Recommendations", icon: Sparkles },
  { label: "Booking Risk", icon: ShieldAlert },
  { label: "Review Intelligence", icon: Compass },
  { label: "Recommendation History", icon: CalendarClock },
  { label: "Settings", icon: Settings },
  { label: "User Management", icon: UserCog, adminOnly: true },
];

const arrivals = [
  { time: "10:30", name: "Maya Perera", detail: "Family suite ready" },
  { time: "14:00", name: "Daniel Chen", detail: "Wellness service requested" },
  { time: "16:45", name: "Emma Williams", detail: "Honeymoon package" },
];

function getBookingLifecycle(guest: any) {
  const status = String(guest.bookingStatus || "").trim();
  return ["Pending", "Confirmed", "Completed", "Cancelled"].includes(status)
    ? status
    : "Pending";
}

export default function ModernHotelStaffDashboard() {
  // Legacy mock data remains only as a design reference; all visible dashboard
  // values below are calculated from the backend guest API.

  void arrivals;
  const navigate = useNavigate();
  const staffSession = getSession();
  const [activeNavigation, setActiveNavigation] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [databaseGuests, setDatabaseGuests] = useState<any[]>([]);
  const [hotelIntelligence, setHotelIntelligence] =
    useState<HotelIntelligence | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [onlyPending, setOnlyPending] = useState(false);
  const queueRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/guests")
      .then((response) => response.json())
      .then((data) => setDatabaseGuests(data))
      .catch(() => setDatabaseGuests([]));
  }, []);
  useEffect(() => {
    fetch("http://localhost:8000/api/hotel-intelligence")
      .then((response) => (response.ok ? response.json() : null))
      .then(setHotelIntelligence)
      .catch(() => setHotelIntelligence(null));
  }, []);
  const pendingGuests = databaseGuests.filter(
    (guest) => getBookingLifecycle(guest) === "Pending",
  );
  const filteredGuests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return databaseGuests.filter((guest) => {
      const matchesSearch =
        !query ||
        [guest.fullName, guest.country, guest.aiAnalysis?.services?.[0]?.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      return (
        matchesSearch &&
        (!onlyPending || pendingGuests.some((item) => item._id === guest._id))
      );
    });
  }, [databaseGuests, onlyPending, pendingGuests, search]);
  const upcomingArrivals = useMemo(
    () =>
      databaseGuests
        .filter((guest) => guest.arrivalDate)
        .sort(
          (a, b) =>
            new Date(a.arrivalDate).getTime() -
            new Date(b.arrivalDate).getTime(),
        )
        .slice(0, 3),
    [databaseGuests],
  );
  const liveMetrics = [
    {
      label: "Guest profiles",
      value: String(databaseGuests.length),
      detail: `${pendingGuests.length} awaiting attention`,
      icon: UsersRound,
      tone: "teal",
    },
    {
      label: "Pending review",
      value: String(pendingGuests.length),
      detail: "Require staff attention",
      icon: CalendarClock,
      tone: "amber",
    },
    {
      label: "AI recommendations",
      value: String(
        databaseGuests.reduce(
          (total, guest) => total + (guest.aiAnalysis?.services?.length || 0),
          0,
        ),
      ),
      detail: "Generated for guest stays",
      icon: Sparkles,
      tone: "blue",
    },
    {
      label: "Arrival risk alerts",
      value: String(
        databaseGuests.filter(
          (guest) => (guest.aiAnalysis?.bookingRisk?.probability || 0) >= 28,
        ).length,
      ),
      detail: "Bookings needing follow-up",
      icon: CircleAlert,
      tone: "violet",
    },
  ];
  const dashboardAnalytics = useMemo(() => {
    const total = Math.max(databaseGuests.length, 1);
    const pending = pendingGuests.length;
    const confirmed = databaseGuests.filter(
      (guest) => getBookingLifecycle(guest) === "Confirmed",
    ).length;
    const completed = databaseGuests.filter(
      (guest) => getBookingLifecycle(guest) === "Completed",
    ).length;
    const cancelled = databaseGuests.filter(
      (guest) => getBookingLifecycle(guest) === "Cancelled",
    ).length;
    const atRisk = databaseGuests.filter(
      (guest) => (guest.aiAnalysis?.bookingRisk?.probability || 0) >= 28,
    ).length;
    const aiReady = databaseGuests.filter(
      (guest) => guest.aiAnalysis?.segment?.name,
    ).length;
    const statuses = [
      { label: "Pending review", value: pending, color: "#efb24b" },
      { label: "Confirmed", value: confirmed, color: "#17a78d" },
      { label: "Completed", value: completed, color: "#4b80c3" },
      { label: "Cancelled", value: cancelled, color: "#d76b78" },
    ];
    let position = 0;
    const chart = statuses.map((item) => {
      const start = position;
      position += (item.value / total) * 100;
      return `${item.color} ${start}% ${position}%`;
    });
    return {
      aiReady,
      atRisk,
      statuses,
      total: databaseGuests.length,
      chart: `conic-gradient(${chart.join(", ")}, #eaf1f0 0)`,
    };
  }, [databaseGuests, pendingGuests.length]);
  const today = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const openQueue = () =>
    queueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const handleNavigation = (label: string) => {
    setActiveNavigation(label);
    setIsSidebarOpen(false);
    if (label === "Dashboard") return navigate("/Hotelstaffdashboard");
    if (label === "Guest Details") return navigate("/guest-review-queue");
    if (label === "User Management") return navigate("/user-management");
    if (label === "Booking Risk") setOnlyPending(true);
    if (label === "Review Intelligence") {
      document
        .querySelector(".review-intelligence-panel")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (label === "Settings") return;
    openQueue();
  };

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
          {navigationItems
            .filter(
              (item) => !item.adminOnly || staffSession?.user.role === "admin",
            )
            .map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  className={activeNavigation === item.label ? "selected" : ""}
                  onClick={() => {
                    handleNavigation(item.label);
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
          <button
            type="button"
            className="sidebar-signout"
            onClick={() => {
              clearSession();
              navigate("/login");
            }}
          >
            <LogOut size={15} /> Sign out
          </button>
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
              onClick={() => setShowNotifications((open) => !open)}
            >
              <Bell size={19} />
              <b>{pendingGuests.length}</b>
            </button>
            <div className="date-card">
              <small>Today</small>
              <strong>{today}</strong>
            </div>
          </div>
        </header>
        {showNotifications && (
          <section className="dashboard-notifications">
            <b>Guest attention queue</b>
            {pendingGuests.slice(0, 4).map((guest) => (
              <button
                key={guest._id}
                type="button"
                onClick={() => navigate(`/guest-details/${guest._id}`)}
              >
                <span>{guest.fullName}</span>
                <small>{guest.status || "New guest profile"}</small>
              </button>
            ))}
            {!pendingGuests.length && (
              <small>There are no pending guest notifications.</small>
            )}
          </section>
        )}

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
              <button
                type="button"
                className="primary-action"
                onClick={openQueue}
              >
                Review guest profiles <ArrowRight size={17} />
              </button>
              <button
                type="button"
                className="secondary-action"
                onClick={openQueue}
              >
                View recommendations
              </button>
            </div>
          </div>
          <div className="attention-card">
            <div>
              <UserRound size={29} />
            </div>
            <strong>{pendingGuests.length}</strong>
            <span>guest profiles awaiting attention</span>
          </div>
        </section>

        <section className="metric-grid">
          {liveMetrics.map((metric) => {
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

        <section className="dashboard-command-chart">
          <div className="command-chart-copy">
            <span>
              <Activity size={16} /> LIVE OPERATIONS INTELLIGENCE
            </span>
            <h2>Guest experience command centre</h2>
            <p>
              One visual view of AI readiness, staff workload, booking progress,
              and profiles that need attention.
            </p>
            <button
              type="button"
              onClick={() => navigate("/guest-review-queue")}
            >
              Manage guest review queue <ArrowRight size={16} />
            </button>
          </div>
          <div className="command-chart-main">
            <div
              className="command-donut"
              style={{ background: dashboardAnalytics.chart }}
            >
              <div>
                <b>{dashboardAnalytics.total}</b>
                <small>guest profiles</small>
              </div>
            </div>
            <div className="command-legend">
              {dashboardAnalytics.statuses.map((item) => (
                <div key={item.label}>
                  <i style={{ background: item.color }} />
                  <span>{item.label}</span>
                  <b>{item.value}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="command-flow">
            <div>
              <span>01</span>
              <b>Guest profile</b>
              <small>{dashboardAnalytics.total} submitted</small>
            </div>
            <i />
            <div>
              <span>02</span>
              <b>AI analysis</b>
              <small>{dashboardAnalytics.aiReady} ready</small>
            </div>
            <i />
            <div>
              <span>03</span>
              <b>Staff review</b>
              <small>{pendingGuests.length} pending</small>
            </div>
            <i />
            <div>
              <span>04</span>
              <b>Stay prepared</b>
              <small>{dashboardAnalytics.statuses[1].value} confirmed</small>
            </div>
          </div>
        </section>

        <section className="dashboard-grid">
          <article className="review-panel" ref={queueRef}>
            <div className="panel-heading">
              <div>
                <span>Guest review queue</span>
                <h3>Recent guest profiles</h3>
                <p>
                  Prioritize guests arriving soon and approve their tailored
                  plan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setOnlyPending(false);
                }}
              >
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
              <button
                type="button"
                onClick={() => setOnlyPending((value) => !value)}
              >
                {onlyPending ? "Pending only" : "All guests"}
              </button>
            </label>
            <div className="guest-list">
              <div className="guest-list-head">
                <span>Guest</span>
                <span>Stay</span>
                <span>Recommendation</span>
                <span>Status</span>
                <span />
              </div>
              {filteredGuests.map((guest) => (
                <article
                  className="guest-row"
                  key={guest._id}
                  onClick={() => setSelectedGuest(guest)}
                >
                  <div className="guest-identity">
                    <b>
                      {guest.fullName
                        .split(" ")
                        .map((name: string) => name[0])
                        .join("")
                        .slice(0, 2)}
                    </b>
                    <span>
                      <strong>{guest.fullName}</strong>
                      <small>
                        {guest.country} · {guest.adults} adults
                      </small>
                    </span>
                  </div>
                  <div className="guest-stay">
                    <strong>{guest.roomPreference || "Hotel stay"}</strong>
                    <small>{guest.budget} budget</small>
                  </div>
                  <div className="guest-recommendation">
                    <Sparkles size={15} />
                    <strong>
                      {guest.aiAnalysis?.services?.[0]?.name ||
                        "AI analysis pending"}
                    </strong>
                  </div>
                  <div className="guest-status ready">
                    <i />
                    {guest.status || "Ready to review"}
                  </div>
                  <button
                    className="guest-arrow"
                    type="button"
                    aria-label={`Open ${guest.fullName}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/guest-details/${guest._id}`);
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </article>
              ))}
              {!filteredGuests.length && (
                <p className="dashboard-empty">
                  No guest profiles match this filter.
                </p>
              )}
            </div>
          </article>

          <aside className="side-panels">
            <article className="arrivals-panel">
              <div className="arrivals-heading">
                <div>
                  <span>Today’s arrivals</span>
                  <h3>Make arrivals seamless</h3>
                </div>
                <b>{upcomingArrivals.length} arrivals</b>
              </div>
              <div className="arrival-list">
                {upcomingArrivals.map((guest) => (
                  <button
                    type="button"
                    className="arrival-row"
                    key={guest._id}
                    onClick={() => navigate(`/guest-details/${guest._id}`)}
                  >
                    <strong>
                      {guest.arrivalDate
                        ? new Date(guest.arrivalDate).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )
                        : "TBD"}
                    </strong>
                    <span>
                      <b>{guest.fullName}</b>
                      <small>
                        {guest.roomPreference || "Room preparation pending"}
                      </small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
              <button
                className="arrival-link"
                type="button"
                onClick={openQueue}
              >
                Open arrival board <ArrowRight size={16} />
              </button>
            </article>
            <article className="ai-focus">
              <span>
                <Activity size={20} />
              </span>
              <small>AI recommendation focus</small>
              <h3>
                {
                  databaseGuests.filter(
                    (guest) =>
                      (guest.interests || []).includes("Family") ||
                      guest.children > 0,
                  ).length
                }{" "}
                family profiles would benefit from activity planning before
                check-in.
              </h3>
              <button type="button" onClick={openQueue}>
                Review suggestions <ArrowRight size={16} />
              </button>
            </article>
            <article className="review-intelligence-panel">
              <div className="review-intelligence-heading">
                <div>
                  <span>Review intelligence</span>
                  <h3>Hotel service sentiment</h3>
                </div>
                <Compass size={19} />
              </div>
              {hotelIntelligence ? (
                <>
                  <small className="review-intelligence-source">
                    {hotelIntelligence.source}
                  </small>
                  <div className="aspect-list">
                    {(hotelIntelligence.aspects || [])
                      .slice(0, 4)
                      .map((aspect) => (
                        <div className="aspect-row" key={aspect.name}>
                          <span>{aspect.name}</span>
                          <b
                            className={
                              aspect.sentimentScore < 5 ? "attention" : ""
                            }
                          >
                            {aspect.sentimentScore > 0 ? "+" : ""}
                            {aspect.sentimentScore}%
                          </b>
                        </div>
                      ))}
                  </div>
                  {(hotelIntelligence.alerts || []).slice(0, 1).map((alert) => (
                    <p className="review-alert" key={alert.aspect}>
                      <CircleAlert size={15} />{" "}
                      <span>
                        <b>{alert.aspect}:</b> {alert.message}
                      </span>
                    </p>
                  ))}
                </>
              ) : (
                <p className="review-intelligence-empty">
                  Start Flask AI service to load review intelligence.
                </p>
              )}
            </article>
          </aside>
        </section>
        {selectedGuest && (
          <section className="ai-output-panel">
            <div>
              <span>Selected guest · AI analysis</span>
              <h2>{selectedGuest.fullName}</h2>
              <p>{selectedGuest.aiAnalysis?.summary}</p>
            </div>
            <button type="button" onClick={() => setSelectedGuest(null)}>
              Close
            </button>
            <div className="ai-output-grid">
              <article>
                <h3>Guest segment</h3>
                <strong>{selectedGuest.aiAnalysis?.segment?.name}</strong>
                <p>AI cluster {selectedGuest.aiAnalysis?.segment?.cluster}</p>
              </article>
              <article>
                <h3>Top services</h3>
                {selectedGuest.aiAnalysis?.services?.map((service: any) => (
                  <p key={service.id}>
                    <b>{service.name}</b>
                    <span>
                      {service.category} · {service.match}% match
                    </span>
                  </p>
                ))}
              </article>
              <article>
                <h3>Recommended places</h3>
                {selectedGuest.aiAnalysis?.places?.map((place: any) => (
                  <p key={place.name}>
                    <b>{place.name}</b>
                    <span>
                      {place.district} · {place.match}% match
                    </span>
                  </p>
                ))}
              </article>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
