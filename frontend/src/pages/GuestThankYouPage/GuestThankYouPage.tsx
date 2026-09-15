import { Link, useLocation } from "react-router-dom";
import { CalendarDays, CheckCircle2, Heart, Sparkles } from "lucide-react";
import "./guestThankYouPage.css";

type ThankYouState = { name?: string; arrivalDate?: string; district?: string };

export default function GuestThankYouPage() {
  const location = useLocation();
  const details = (location.state || {}) as ThankYouState;
  const guestName = details.name?.split(" ")[0] || "Guest";
  const arrival = details.arrivalDate ? new Date(details.arrivalDate).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : null;

  return <main className="guest-thank-you-page">
    <section className="thank-you-card">
      <div className="thank-you-icon"><CheckCircle2 size={38} /></div>
      <span className="thank-you-kicker"><Sparkles size={15} /> PREFERENCES RECEIVED</span>
      <h1>Thank you, {guestName}!</h1>
      <p>Your guest details and preferences have been shared with the hotel team. We will use them to prepare a more personal and comfortable stay for you.</p>
      <div className="thank-you-steps">
        <div><span>1</span><div><b>Your profile is secure</b><small>Your submitted details were received successfully.</small></div></div>
        {/* <div><span>2</span><div><b>AI prepares your stay</b><small>The hotel team receives suitable service suggestions.</small></div></div> */}
        <div><span>2</span><div><b>The team reviews your plan</b><small>Staff prepare the important details before you arrive.</small></div></div>
      </div>
      {arrival && <p className="thank-you-arrival"><CalendarDays size={17} /> Arrival planned for <b>{arrival}</b></p>}
      <p className="thank-you-support"><Heart size={15} /> We look forward to welcoming you.</p>
      <Link to="/GuestDetailsForm">Submit another guest profile</Link>
    </section>
  </main>;
}
