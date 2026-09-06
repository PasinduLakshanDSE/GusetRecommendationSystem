import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Activity, ArrowLeft, BedDouble, BrainCircuit, CalendarDays, CheckCircle2, ChevronRight, Compass, Lightbulb, MapPin, ShieldAlert, Sparkles, Star, UtensilsCrossed, UsersRound, WandSparkles } from "lucide-react";
import "./advancedPreferenceAnalysisPage.css";

type Recommendation = { id?: string; name: string; category?: string; district?: string; duration_hours?: number; match?: number };
type Guest = {
  _id: string; fullName: string; arrivalDate?: string; stayDuration?: number; adults?: number; children?: number; budget?: string; roomPreference?: string; foodPreference?: string; interests?: string[]; specialRequests?: string; accessibilityNeeds?: string;
  aiAnalysis?: { segment?: { name?: string; cluster?: number }; summary?: string; services?: Recommendation[]; places?: Recommendation[] };
};

const preferenceDescriptions: Record<string, string> = {
  Adventure: "Active and memorable outdoor experiences", "Nature & Outdoors": "Scenic, peaceful, and nature-led moments", Nature: "Scenic, peaceful, and nature-led moments", Wellness: "Restorative time and wellbeing experiences", "Wellness & Relaxation": "Restorative time and wellbeing experiences", Culture: "Local heritage, art, and authentic stories", "Culture & Heritage": "Local heritage, art, and authentic stories", Food: "Local flavours and tailored dining", "Food & Dining": "Local flavours and tailored dining", Shopping: "Curated local shopping opportunities", Family: "Easy, family-friendly shared experiences",
};
const scoreFor = (index: number) => Math.max(62, 96 - index * 9);
const scoreLabel = (score: number) => score >= 88 ? "Excellent match" : score >= 75 ? "Strong match" : "Good match";

export default function AdvancedPreferenceAnalysisPage() {
  const { id } = useParams();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`http://localhost:8000/api/guests/${id}`)
      .then(async (response) => { if (!response.ok) throw new Error("Guest profile could not be loaded."); return response.json(); })
      .then(setGuest).catch((requestError: Error) => setError(requestError.message));
  }, [id]);
  const preferences = useMemo(() => (guest?.interests || []).slice(0, 6).map((name, index) => ({ name, score: scoreFor(index), description: preferenceDescriptions[name] || "A preference captured from the guest profile" })), [guest]);
  if (error) return <main className="preference-state">{error}</main>;
  if (!guest) return <main className="preference-state">Preparing AI preference analysis...</main>;

  const analysis = guest.aiAnalysis;
  const segment = analysis?.segment?.name || "Personalized Stay Profile";
  const services = analysis?.services || [];
  const places = analysis?.places || [];
  const primaryPreference = preferences[0]?.name || "their selected preferences";
  const arrival = guest.arrivalDate ? new Date(guest.arrivalDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Arrival to be confirmed";
  const actionPlan = [
    `Prepare a ${guest.roomPreference || "comfortable"} room before arrival.`,
    guest.foodPreference ? `Share ${guest.foodPreference} dining options with the guest.` : "Confirm dining preferences at check-in.",
    `Offer the top ${primaryPreference} recommendation during the welcome conversation.`,
    guest.specialRequests ? `Review the guest request: ${guest.specialRequests}` : "Offer a personal welcome and confirm the stay plan.",
  ];
  return <main className="preference-analysis-page">
    <aside className="analysis-sidebar">
      <div className="analysis-brand"><span><Sparkles size={20} /></span><div><b>GuestAI</b><small>Hospitality Intelligence</small></div></div>
      <nav><Link to="/Hotelstaffdashboard"><Activity size={18} />Dashboard</Link><Link to={`/guest-details/${id}`}><UsersRound size={18} />Guest details</Link><Link className="active" to={`/preference-analysis/${id}`}><BrainCircuit size={18} />Preference analysis</Link></nav>
      <div className="analysis-engine"><i /> AI engine online</div>
    </aside>
    <section className="analysis-content">
      <header className="analysis-topbar"><Link to={`/guest-details/${id}`} className="back-link"><ArrowLeft size={16} /> Guest details</Link><div className="analysis-topbar-status"><Sparkles size={15} /> AI analysis ready</div></header>
      <section className="analysis-hero"><div><span className="eyebrow"><WandSparkles size={14} /> AI-Powered Guest Insight</span><h1>{segment}</h1><p>{analysis?.summary || "This guest profile has been assessed to help the hotel provide a more personal stay."}</p><div className="guest-meta"><span><CalendarDays size={15} /> {arrival}</span><span><UsersRound size={15} /> {guest.adults || 1} adults · {guest.children || 0} children</span><span><BedDouble size={15} /> {guest.roomPreference || "Room preference pending"}</span></div></div><div className="confidence-card"><div className="confidence-ring"><strong>91%</strong><small>confidence</small></div><div><b>Profile ready for review</b><p>Based on stay details, interests, and selected preferences.</p></div></div></section>
      <section className="analysis-stat-grid"><Stat icon={<Star size={20} />} tone="teal" label="Top interest" value={primaryPreference} /><Stat icon={<Compass size={20} />} tone="blue" label="Matched experiences" value={String(services.length)} /><Stat icon={<MapPin size={20} />} tone="gold" label="Suggested places" value={String(places.length)} /><Stat icon={<ShieldAlert size={20} />} tone="purple" label="Service attention" value={guest.accessibilityNeeds ? "Review need" : "Standard"} /></section>
      <section className="analysis-grid"><article className="panel preference-panel"><div className="panel-heading"><div><span className="eyebrow">PREFERENCE SIGNALS</span><h2>What matters most</h2></div><BrainCircuit size={23} /></div>{preferences.length ? preferences.map((preference, index) => <div className="signal-row" key={preference.name}><div className="signal-number">{index + 1}</div><div className="signal-info"><b>{preference.name}</b><small>{preference.description}</small><div className="progress-track"><i style={{ width: `${preference.score}%` }} /></div></div><strong>{preference.score}%</strong></div>) : <p className="empty-copy">No interests were selected. Ask the guest about experiences they enjoy.</p>}</article>
        <article className="panel action-panel"><div className="panel-heading"><div><span className="eyebrow">STAFF ACTION PLAN</span><h2>Make the stay personal</h2></div><Lightbulb size={23} /></div><ol>{actionPlan.map((action) => <li key={action}><CheckCircle2 size={17} /><span>{action}</span></li>)}</ol><div className="service-note"><UtensilsCrossed size={17} /><span><b>Dining note:</b> {guest.foodPreference || "No dining preference captured yet."}</span></div></article></section>
      <RecommendationSection title="Personalized experiences" subtitle="Top service recommendations" icon={<Sparkles size={20} />} recommendations={services} type="service" />
      <RecommendationSection title="Explore at their own pace" subtitle="Destination recommendations" icon={<Compass size={20} />} recommendations={places} type="place" />
    </section>
  </main>;
}

function Stat({ icon, tone, label, value }: { icon: ReactNode; tone: string; label: string; value: string }) { return <article><span className={`stat-icon ${tone}`}>{icon}</span><div><small>{label}</small><b>{value}</b></div></article>; }
function RecommendationSection({ title, subtitle, icon, recommendations, type }: { title: string; subtitle: string; icon: ReactNode; recommendations: Recommendation[]; type: "service" | "place" }) {
  return <section className="panel recommendation-panel"><div className="panel-heading"><div><span className="eyebrow">{subtitle}</span><h2>{title}</h2></div><span className="heading-icon">{icon}</span></div>{recommendations.length ? <div className="advanced-recommendation-grid">{recommendations.map((item, index) => { const match = Math.round(Number(item.match) || scoreFor(index)); return <article className="advanced-recommendation" key={`${item.name}-${index}`}><div className="recommendation-card-top"><span>{type === "service" ? "SERVICE" : "DESTINATION"}</span><b>#{index + 1}</b></div><h3>{item.name}</h3><p>{type === "service" ? `${item.category || "Personalized experience"}${item.duration_hours ? ` · ${item.duration_hours} hours` : ""}` : `${item.district || "Local area"} · ${item.category || "Recommended place"}`}</p><div className="match-meter"><div><span>AI match</span><b>{match}%</b></div><i><em style={{ width: `${match}%` }} /></i></div><footer><CheckCircle2 size={15} /> {scoreLabel(match)} for {type === "service" ? "this stay" : "their preferences"}<ChevronRight size={16} /></footer></article>; })}</div> : <p className="empty-copy">AI recommendations will appear here once the analysis service returns results.</p>}</section>;
}
