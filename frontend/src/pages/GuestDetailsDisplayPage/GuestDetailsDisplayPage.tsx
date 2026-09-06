import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Activity, BedDouble, BriefcaseBusiness, CalendarDays, CheckCircle2, CircleCheck, Mail, MapPin, Phone, ShieldAlert, Utensils, UserRound, UsersRound } from "lucide-react";
import "./guestDetailsDisplayPage.css";
import "./bookingHistory.css";

export default function GuestDetailsDisplayPage() {
  const { id } = useParams();
  const [guest, setGuest] = useState<any>(null);
  const [savingBookingStatus, setSavingBookingStatus] = useState(false);
  useEffect(() => {
    fetch(`http://localhost:8000/api/guests/${id}`)
      .then((response) => response.json())
      .then(setGuest);
  }, [id]);
  if (!guest)
    return <main className="guest-detail-loading">Loading guest details…</main>;
  const bookingRisk = guest.aiAnalysis?.bookingRisk || {
    level: "Pending",
    probability: 0,
    reasons: ["This guest was created before booking-risk analysis was enabled."],
    recommendation: "Open AI preference analysis after the guest profile is analysed again.",
    history: { repeatGuest: false, previousBookings: 0, previousCancellations: 0, completedStays: 0 },
  };
  const riskClass = String(bookingRisk.level).toLowerCase();
  const updateBookingStatus = async (bookingStatus: string) => {
    setSavingBookingStatus(true);
    try {
      const response = await fetch(`http://localhost:8000/api/guests/${guest._id}/booking-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingStatus }),
      });
      if (!response.ok) throw new Error("Unable to update booking status");
      setGuest(await response.json());
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to update booking status");
    } finally {
      setSavingBookingStatus(false);
    }
  };
  const fields = [
    ["Email", guest.email, Mail],
    ["Phone", guest.phone || "Not provided", Phone],
    ["Country", guest.country, MapPin],
    ["District", guest.district || "Not provided", MapPin],
    ["Arrival date", guest.arrivalDate || "Not provided", CalendarDays],
    ["Stay duration", `${guest.stayDuration || 0} nights`, CalendarDays],
    [
      "Guests",
      `${guest.adults} adults · ${guest.children} children`,
      UsersRound,
    ],
    ["Purpose", guest.purposeOfVisit || "Not provided", BriefcaseBusiness],
    ["Budget", guest.budget || "Not provided", CircleCheck],
    ["Activity level", guest.activityLevel || "Not provided", Activity],
    ["Room preference", guest.roomPreference || "No preference", BedDouble],
    ["Food preference", guest.foodPreference || "No preference", Utensils],
    ["Profile status", guest.status || "New", CircleCheck],
    [
      "Submitted",
      guest.createdAt
        ? new Date(guest.createdAt).toLocaleString()
        : "Not available",
      CalendarDays,
    ],
    ["Consent", guest.consent ? "Provided" : "Not recorded", UserRound],
  ];
  return (
    <main className="guest-detail-page">
      <header>
        <Link to="/Hotelstaffdashboard">← Staff dashboard</Link>
        <span>Guest profile</span>
        <h1>{guest.fullName}</h1>
        <p>Submitted guest details and stay preferences.</p>
        <label className="booking-status-control">
          <span>Booking status</span>
          <select value={guest.bookingStatus || "Pending"} disabled={savingBookingStatus} onChange={(event) => updateBookingStatus(event.target.value)}>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </label>
      </header>
      <section className="guest-detail-card">
        <h2>Guest information</h2>
        <div className="guest-detail-grid">
          {fields.map(([label, value, Icon]) => {
            const FieldIcon = Icon as any;
            return (
              <article key={label as string}>
                <FieldIcon size={19} />
                <span>
                  <small>{label as string}</small>
                  <strong>{value as string}</strong>
                </span>
              </article>
            );
          })}
        </div>
      </section>
      <section className={`booking-risk-card ${riskClass}`}>
        <div className="booking-risk-main">
          <span className="booking-risk-icon"><ShieldAlert size={24} /></span>
          <div>
            <span className="risk-eyebrow">AI booking intelligence</span>
            <h2>Booking cancellation risk</h2>
            <p>Use this signal to decide the right staff follow-up before arrival.</p>
          </div>
        </div>
        <div className="risk-score"><strong>{bookingRisk.probability}%</strong><span>{bookingRisk.level} risk</span></div>
        <div className="risk-details">
          <div><h3>Why this signal?</h3><ul>{(bookingRisk.reasons || []).map((reason: string) => <li key={reason}><CheckCircle2 size={16} />{reason}</li>)}</ul></div>
          <div className="risk-recommendation"><span>Recommended staff action</span><b>{bookingRisk.recommendation}</b></div>
        </div>
        <div className="risk-history">
          <span><b>{bookingRisk.history?.previousBookings || 0}</b> previous bookings</span>
          <span><b>{bookingRisk.history?.completedStays || 0}</b> completed stays</span>
          <span><b>{bookingRisk.history?.previousCancellations || 0}</b> previous cancellations</span>
        </div>
      </section>
      <section className="guest-detail-card">
        <h2>Selected interests</h2>
        <div className="detail-tags">
          {(guest.interests || []).map((interest: string) => (
            <span key={interest}>{interest}</span>
          ))}
        </div>
      </section>
      <section className="guest-detail-card">
        <h2>Notes for the hotel</h2>
        <p>
          <b>Special requests:</b> {guest.specialRequests || "None provided"}
        </p>
        <p>
          <b>Accessibility needs:</b>{" "}
          {guest.accessibilityNeeds || "None provided"}
        </p>
      </section>
      <Link className="analysis-link" to={`/preference-analysis/${guest._id}`}>
        View AI preference analysis →
      </Link>
    </main>
  );
}
