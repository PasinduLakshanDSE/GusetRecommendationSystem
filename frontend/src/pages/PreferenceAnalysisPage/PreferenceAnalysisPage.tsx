import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Compass, Sparkles } from "lucide-react";
import "./preferenceAnalysisPage.css";

export default function PreferenceAnalysisPage() {
  const { id } = useParams();
  const [guest, setGuest] = useState<any>(null);
  useEffect(() => {
    fetch(`http://localhost:8000/api/guests/${id}`)
      .then((r) => r.json())
      .then(setGuest);
  }, [id]);
  if (!guest)
    return (
      <main className="preference-analysis-loading">Loading preference analysis…</main>
    );
  const analysis = guest.aiAnalysis;
  const preferences = Object.entries(
    guest.interests.reduce(
      (values: Record<string, number>, interest: string) => ({
        ...values,
        [interest]: 5,
      }),
      {},
    ),
  ) as [string, number][];
  return (
    <main className="preference-analysis-page">
      <aside className="profile-sidebar">
        <div className="profile-brand">
          <Sparkles size={22} />
          <span>
            <b>GuestAI</b>
            <small>Hospitality Intelligence</small>
          </span>
        </div>
        <nav>
          <Link to="/Hotelstaffdashboard">Dashboard</Link>
          <Link to={`/guest-details/${id}`}>Guest Profile</Link>
          <Link className="active" to={`/preference-analysis/${id}`}>
            Preference Analysis
          </Link>
        </nav>
        <small>AI Engine Online</small>
      </aside>
      <section className="profile-content">
        <header>
          <span>AI powered</span>
          <h1>Your Personalized Stay</h1>
          <p>A stay designed around the things that matter most to you.</p>
        </header>
        <section className="profile-welcome">
          <p>Welcome, {guest.fullName}</p>
          <h2>{analysis.segment.name}</h2>
          <small>Guest cluster {analysis.segment.cluster}</small>
          <p>{analysis.summary}</p>
        </section>
        <section className="profile-grid">
          <article>
            <h3>Your Preference Profile</h3>
            <div className="preference-bars">
              {preferences.length ? (
                preferences.map(([name, value]) => (
                  <div key={name}>
                    <span>
                      {name}
                      <b>{value}/5</b>
                    </span>
                    <i>
                      <em style={{ width: `${Number(value) * 20}%` }} />
                    </i>
                  </div>
                ))
              ) : (
                <p>No interests selected.</p>
              )}
            </div>
          </article>
          <article>
            <span>YOUR GUEST PROFILE</span>
            <h3>{analysis.segment.name}</h3>
            <p>{analysis.summary}</p>
            <h4>Top Preferences</h4>
            <div className="preference-tags">
              {guest.interests
                .slice(0, 3)
                .map((interest: string, index: number) => (
                  <b key={interest}>
                    {index + 1} · {interest}
                  </b>
                ))}
            </div>
          </article>
        </section>
        <section className="recommendation-section">
          <div>
            <span>PERSONALIZED SERVICES</span>
            <h2>Experiences selected for you</h2>
          </div>
          <div className="recommendation-grid">
            {analysis.services.map((service: any, index: number) => (
              <article key={service.id}>
                <span>Service</span>
                <b>#{index + 1}</b>
                <h3>{service.name}</h3>
                <small>
                  {service.category} · {service.duration_hours} hours
                </small>
                <div className="score">
                  <label>
                    AI Match <strong>{service.match}%</strong>
                  </label>
                  <i>
                    <em style={{ width: `${service.match}%` }} />
                  </i>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="recommendation-section">
          <div>
            <span>PERSONALIZED PLACES</span>
            <h2>Explore at your own pace</h2>
          </div>
          <div className="recommendation-grid">
            {analysis.places.map((place: any, index: number) => (
              <article key={place.name}>
                <span>Destination</span>
                <b>#{index + 1}</b>
                <h3>{place.name}</h3>
                <small>
                  {place.district} · {place.category}
                </small>
                <div className="score">
                  <label>
                    AI Match <strong>{place.match}%</strong>
                  </label>
                  <i>
                    <em style={{ width: `${place.match}%` }} />
                  </i>
                </div>
                <p>
                  <Compass size={15} />
                  Recommended for your profile.
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
