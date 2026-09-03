import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Mail, MapPin, Phone, UserRound } from "lucide-react";
import "./guestDetailsDisplayPage.css";

export default function GuestDetailsDisplayPage() {
  const { id } = useParams();
  const [guest, setGuest] = useState<any>(null);
  useEffect(() => {
    fetch(`http://localhost:8000/api/guests/${id}`)
      .then((response) => response.json())
      .then(setGuest);
  }, [id]);
  if (!guest)
    return <main className="guest-detail-loading">Loading guest details…</main>;
  const fields = [
    ["Guest ID", guest._id, UserRound],
    ["Email", guest.email, Mail],
    ["Phone", guest.phone || "Not provided", Phone],
    ["Country", guest.country, MapPin],
    ["District", guest.district || "Not provided", MapPin],
    ["Arrival date", guest.arrivalDate || "Not provided", CalendarDays],
    ["Stay duration", `${guest.stayDuration || 0} nights`, CalendarDays],
    [
      "Guests",
      `${guest.adults} adults · ${guest.children} children`,
      UserRound,
    ],
    ["Purpose", guest.purposeOfVisit || "Not provided", UserRound],
    ["Budget", guest.budget || "Not provided", UserRound],
    ["Activity level", guest.activityLevel || "Not provided", UserRound],
    ["Room preference", guest.roomPreference || "No preference", UserRound],
    ["Food preference", guest.foodPreference || "No preference", UserRound],
    ["Profile status", guest.status || "New", UserRound],
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
      <section className="guest-detail-card">
        <h2>Selected interests</h2>
        <div className="detail-tags">
          {guest.interests.map((interest: string) => (
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
