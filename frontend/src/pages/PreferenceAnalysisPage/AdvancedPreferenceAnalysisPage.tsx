import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  BedDouble,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Compass,
  Lightbulb,
  MapPin,
  ShieldAlert,
  Sparkles,
  Star,
  UtensilsCrossed,
  UsersRound,
  WandSparkles,
} from "lucide-react";
import "./advancedPreferenceAnalysisPage.css";
import "./placeContext.css";
import "./guestPersona.css";
import adventurePersona from "../../assets/adventure-persona.png";
import businessTravelerPersona from "../../assets/business-traveler-women.png";
import businessGuestPersona from "../../assets/business-traveler-men.png";
import explorerGuestPersona from "../../assets/purpose-leisure.png";
import familyPersona from "../../assets/family-persona.png";
import honeymoonPersona from "../../assets/Hanemon Cupole.png";
import wellnessNaturePersona from "../../assets/wellness-nature-persona.png";

type Recommendation = {
  id?: string;
  name: string;
  category?: string;
  district?: string;
  duration_hours?: number;
  match?: number;
};
type StaffAction = {
  action: string;
  match?: number;
  reason?: string;
};
type Guest = {
  _id: string;
  fullName: string;
  arrivalDate?: string;
  stayDuration?: number;
  adults?: number;
  children?: number;
  budget?: string;
  roomPreference?: string;
  foodPreference?: string;
  purposeOfVisit?: string;
  interests?: string[];
  specialRequests?: string;
  accessibilityNeeds?: string;
  aiAnalysis?: {
    segment?: { name?: string; source?: string };
    preferenceProfile?: { name: string; score: number }[];
    purposeContext?: {
      purpose?: string;
      summary?: string;
      staffActions?: string[];
    };
    placeContext?: {
      message?: string;
      districtFilterApplied?: boolean;
    };
    confidence?: {
      score?: number;
      label?: string;
      basis?: string;
    };
    summary?: string;
    services?: Recommendation[];
    places?: Recommendation[];
    staffActionPlan?: {
      source?: string;
      actions?: StaffAction[];
    };
  };
};

const preferenceDescriptions: Record<string, string> = {
  Adventure: "Active and memorable outdoor experiences",
  "Nature & Outdoors": "Scenic, peaceful, and nature-led moments",
  Nature: "Scenic, peaceful, and nature-led moments",
  Wellness: "Restorative time and wellbeing experiences",
  "Wellness & Relaxation": "Restorative time and wellbeing experiences",
  Culture: "Local heritage, art, and authentic stories",
  "Culture & Heritage": "Local heritage, art, and authentic stories",
  Food: "Local flavours and tailored dining",
  "Food & Dining": "Local flavours and tailored dining",
  Shopping: "Curated local shopping opportunities",
  Family: "Easy, family-friendly shared experiences",
};
const scoreFor = (index: number) => Math.max(62, 96 - index * 9);
const scoreLabel = (score: number) =>
  score >= 88 ? "Excellent match" : score >= 75 ? "Strong match" : "Good match";

export default function AdvancedPreferenceAnalysisPage() {
  const { id } = useParams();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`http://localhost:8000/api/guests/${id}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Guest profile could not be loaded.");
        return response.json();
      })
      .then(setGuest)
      .catch((requestError: Error) => setError(requestError.message));
  }, [id]);
  const preferences = useMemo(() => {
    const savedProfile = guest?.aiAnalysis?.preferenceProfile;
    if (savedProfile?.length)
      return savedProfile.map((preference) => ({
        name: preference.name,
        score: preference.score,
        description:
          preferenceDescriptions[preference.name] ||
          "Selected directly by the guest",
      }));
    return (guest?.interests || [])
      .slice(0, 6)
      .map((name, index) => ({
        name,
        score: scoreFor(index),
        description:
          preferenceDescriptions[name] ||
          "A preference captured from the guest profile",
      }));
  }, [guest]);
  if (error) return <main className="preference-state">{error}</main>;
  if (!guest)
    return (
      <main className="preference-state">
        Preparing AI preference analysis...
      </main>
    );

  const analysis = guest.aiAnalysis;
  const segment = analysis?.segment?.name || "Personalized Stay Profile";
  const services = analysis?.services || [];
  const places = analysis?.places || [];
  const fallbackConfidence = Math.min(89, 62 + Math.min(preferences.length, 3) * 7);
  const confidenceScore = Math.round(analysis?.confidence?.score || fallbackConfidence);
  const confidenceLabel = analysis?.confidence?.label || "Preference data confidence";
  const primaryPreference =
    preferences[0]?.name || "their selected preferences";
  const visitPurpose =
    analysis?.purposeContext?.purpose || guest.purposeOfVisit || "Leisure";
  // Persona is a visual representation of why the guest is travelling.
  // It must not alter the K-Means segment, which is based on interests only.
  const persona = getPersonaForPurpose(visitPurpose, guest.fullName);
  const arrival = guest.arrivalDate
    ? new Date(guest.arrivalDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Arrival to be confirmed";
  const actionPlan: StaffAction[] = analysis?.staffActionPlan?.actions?.length
    ? analysis.staffActionPlan.actions
    : [
        { action: `Prepare a ${guest.roomPreference || "comfortable"} room before arrival.`, match: 78 },
        { action: guest.foodPreference ? `Confirm ${guest.foodPreference} dining options before arrival.` : "Confirm dining preferences at check-in.", match: 76 },
        { action: `Offer the top ${primaryPreference} recommendation during the welcome conversation.`, match: 76 },
        ...(analysis?.purposeContext?.staffActions || []).map((action) => ({ action, match: 74 })),
        { action: guest.specialRequests ? `Review the guest request: ${guest.specialRequests}` : "Offer a personal welcome and confirm the stay plan.", match: 72 },
        { action: "Confirm arrival time and preferred service timing before check-in.", match: 70 },
      ].slice(0, 5);
  return (
    <main className="preference-analysis-page">
      <aside className="analysis-sidebar">
        <div className="analysis-brand">
          <span>
            <Sparkles size={20} />
          </span>
          <div>
            <b>GuestAI</b>
            <small>Hospitality Intelligence</small>
          </div>
        </div>
        <nav>
          <Link to="/Hotelstaffdashboard">
            <Activity size={18} />
            Dashboard
          </Link>
          <Link to={`/guest-details/${id}`}>
            <UsersRound size={18} />
            Guest details
          </Link>
          <Link className="active" to={`/preference-analysis/${id}`}>
            <BrainCircuit size={18} />
            Preference analysis
          </Link>
        </nav>
        <div className="analysis-engine">
          <i /> AI engine online
        </div>
      </aside>
      <section className="analysis-content">
        <header className="analysis-topbar">
          <Link to={`/guest-details/${id}`} className="back-link">
            <ArrowLeft size={16} /> Guest details
          </Link>
          <div className="analysis-topbar-status">
            <Sparkles size={15} /> AI analysis ready
          </div>
        </header>
        <section className="analysis-hero">
          <div>
            <span className="eyebrow">
              <WandSparkles size={14} /> AI-Powered Guest Insight
            </span>
            <h1>{segment}</h1>
            <p>
              {analysis?.summary ||
                "This guest profile has been assessed to help the hotel provide a more personal stay."}
            </p>
            <div className="guest-meta">
              <span>
                <CalendarDays size={15} /> {arrival}
              </span>
              <span>
                <UsersRound size={15} /> {guest.adults || 1} adults ·{" "}
                {guest.children || 0} children
              </span>
              <span>
                <BedDouble size={15} />{" "}
                {guest.roomPreference || "Room preference pending"}
              </span>
            </div>
          </div>
          <div className="confidence-card">
            <div className="confidence-ring">
              <strong>{confidenceScore}%</strong>
              <small>confidence</small>
            </div>
            <div>
              <b>{confidenceLabel}</b>
              <p>
                {analysis?.confidence?.basis ||
                  "Calculated from the submitted preference profile."}
              </p>
            </div>
          </div>
        </section>
        <section className="analysis-stat-grid">
          <Stat
            icon={<Star size={20} />}
            tone="teal"
            label="Top interest"
            value={primaryPreference}
          />
          <Stat
            icon={<Compass size={20} />}
            tone="blue"
            label="Matched experiences"
            value={String(services.length)}
          />
          <Stat
            icon={<MapPin size={20} />}
            tone="gold"
            label="Suggested places"
            value={String(places.length)}
          />
          <Stat
            icon={<ShieldAlert size={20} />}
            tone="purple"
            label="Service attention"
            value={guest.accessibilityNeeds ? "Review need" : "Standard"}
          />
        </section>
        <section className="persona-showcase">
          <GuestPersona
            image={persona.image}
            alt={persona.alt}
            purpose={visitPurpose}
          />
        </section>
        <section className="analysis-grid">
          <article className="panel preference-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">PREFERENCE SIGNALS</span>
                <h2>What matters most</h2>
              </div>
              <BrainCircuit size={23} />
            </div>
            {preferences.length ? (
              preferences.map((preference, index) => (
                <div className="signal-row" key={preference.name}>
                  <div className="signal-number">{index + 1}</div>
                  <div className="signal-info">
                    <b>{preference.name}</b>
                    <small>{preference.description}</small>
                    <div className="progress-track">
                      <i style={{ width: `${preference.score}%` }} />
                    </div>
                  </div>
                  <strong>{preference.score}%</strong>
                </div>
              ))
            ) : (
              <p className="empty-copy">
                No interests were selected. Ask the guest about experiences they
                enjoy.
              </p>
            )}
          </article>
          <article className="panel action-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">STAFF ACTION PLAN</span>
                <h2>Make the stay personal</h2>
              </div>
              <Lightbulb size={23} />
            </div>
            <p className="action-model-note">
              {analysis?.staffActionPlan?.source || "Personalized staff guidance"}
            </p>
            <ol>
              {actionPlan.map((item) => (
                <li key={item.action} className="ai-action-item">
                  <CheckCircle2 size={17} />
                  <span>
                    <b>{item.action}</b>
                    {item.reason && <small>{item.reason}</small>}
                  </span>
                  {item.match && <em>{item.match}%</em>}
                </li>
              ))}
            </ol>
            <div className="service-note">
              <UtensilsCrossed size={17} />
              <span>
                <b>Dining note:</b>{" "}
                {guest.foodPreference || "No dining preference captured yet."}
              </span>
            </div>
          </article>
        </section>
        <RecommendationSection
          title="Personalized experiences"
          subtitle="Top service recommendations"
          icon={<Sparkles size={20} />}
          recommendations={services}
          type="service"
        />
        {analysis?.placeContext?.message && (
          <p
            className={`place-context ${analysis.placeContext.districtFilterApplied ? "filtered" : "not-filtered"}`}
          >
            {analysis.placeContext.message}
          </p>
        )}
        <RecommendationSection
          title="Explore at their own pace"
          subtitle="Destination recommendations"
          icon={<Compass size={20} />}
          recommendations={places}
          type="place"
        />
      </section>
    </main>
  );
}

function getPersonaForPurpose(purpose: string, guestName: string) {
  const normalizedPurpose = purpose.toLowerCase();

  if (normalizedPurpose.includes("honeymoon") || normalizedPurpose.includes("romantic"))
    return { image: honeymoonPersona, alt: "3D couple on a honeymoon holiday" };
  if (normalizedPurpose.includes("business")) {
    const useAlternateBusinessPersona =
      [...guestName].reduce((total, character) => total + character.charCodeAt(0), 0) % 2 === 0;
    return useAlternateBusinessPersona
      ? { image: businessGuestPersona, alt: "3D business traveler" }
      : { image: businessTravelerPersona, alt: "3D business traveler" };
  }
  if (normalizedPurpose.includes("family"))
    return { image: familyPersona, alt: "3D family holiday travelers" };
  if (normalizedPurpose.includes("adventure"))
    return { image: adventurePersona, alt: "3D adventure traveler" };
  if (normalizedPurpose.includes("wellness"))
    return { image: wellnessNaturePersona, alt: "3D wellness traveler" };
  return { image: explorerGuestPersona, alt: "3D leisure traveler" };
}

function GuestPersona({
  image,
  alt,
  purpose,
}: {
  image: string;
  alt: string;
  purpose: string;
}) {
  const [rotation, setRotation] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const startX = useRef(0);
  const startRotation = useRef(0);

  useEffect(() => {
    if (isInteracting) return undefined;
    let frame = 0;
    const animate = (time: number) => {
      setRotation(Math.sin(time / 950) * 13);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isInteracting]);

  const updateRotation = (movement: number) => {
    setRotation(Math.max(-28, Math.min(28, startRotation.current + movement / 4)));
  };

  return (
    <div className="persona-image-only">
      <span className="persona-purpose-badge">
        <i /> {purpose} visit
      </span>
      <div
        className="persona-viewer"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          startX.current = event.clientX;
          startRotation.current = rotation;
          setIsInteracting(true);
        }}
        onPointerMove={(event) => {
          if (isInteracting) updateRotation(event.clientX - startX.current);
        }}
        onPointerUp={() => setIsInteracting(false)}
        onPointerCancel={() => setIsInteracting(false)}
        onWheel={(event) => {
          event.preventDefault();
          startRotation.current = rotation;
          updateRotation(-event.deltaY / 2);
          setIsInteracting(true);
          window.setTimeout(() => setIsInteracting(false), 900);
        }}
      >
        <div className="persona-3d-stage" style={{ transform: `perspective(680px) rotateY(${rotation}deg)` }}>
          <img src={image} alt={alt} draggable={false} />
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  tone,
  label,
  value,
}: {
  icon: ReactNode;
  tone: string;
  label: string;
  value: string;
}) {
  return (
    <article>
      <span className={`stat-icon ${tone}`}>{icon}</span>
      <div>
        <small>{label}</small>
        <b>{value}</b>
      </div>
    </article>
  );
}
function RecommendationSection({
  title,
  subtitle,
  icon,
  recommendations,
  type,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  recommendations: Recommendation[];
  type: "service" | "place";
}) {
  return (
    <section className="panel recommendation-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{subtitle}</span>
          <h2>{title}</h2>
        </div>
        <span className="heading-icon">{icon}</span>
      </div>
      {recommendations.length ? (
        <div className="advanced-recommendation-grid">
          {recommendations.map((item, index) => {
            const match = Math.round(Number(item.match) || scoreFor(index));
            return (
              <article
                className="advanced-recommendation"
                key={`${item.name}-${index}`}
              >
                <div className="recommendation-card-top">
                  <span>{type === "service" ? "SERVICE" : "DESTINATION"}</span>
                  <b>#{index + 1}</b>
                </div>
                <h3>{item.name}</h3>
                <p>
                  {type === "service"
                    ? `${item.category || "Personalized experience"}${item.duration_hours ? ` · ${item.duration_hours} hours` : ""}`
                    : `${item.district || "Local area"} · ${item.category || "Recommended place"}`}
                </p>
                <div className="match-meter">
                  <div>
                    <span>AI match</span>
                    <b>{match}%</b>
                  </div>
                  <i>
                    <em style={{ width: `${match}%` }} />
                  </i>
                </div>
                <footer>
                  <CheckCircle2 size={15} /> {scoreLabel(match)} for{" "}
                  {type === "service" ? "this stay" : "their preferences"}
                  <ChevronRight size={16} />
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="empty-copy">
          AI recommendations will appear here once the analysis service returns
          results.
        </p>
      )}
    </section>
  );
}
