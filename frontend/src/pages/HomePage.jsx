import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { createRegistration, getTournaments } from "../api/tournamentService";
import { useAuth } from "../context/AuthContext";
import { demoHighlights, demoTournaments } from "../data/demoData";
import "./HomePage.css";

const registrationInitialState = {
  team_name: "",
  team_city: "",
  player_count: 11,
  contact_number: "",
  notes: "",
};

function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(ease * target));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return count;
}

function StatCell({ value, label }) {
  const animated = useCountUp(value);
  return (
    <div className="stat-cell">
      <strong>{animated}</strong>
      <span>{label}</span>
    </div>
  );
}

function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let particles = [];
    let animId;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        dx: (Math.random() - 0.5) * 0.35,
        dy: (Math.random() - 0.5) * 0.35,
        o: Math.random() * 0.5 + 0.1,
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(184,240,64,${p.o})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);
  return <canvas ref={canvasRef} className="particle-canvas" />;
}

function HomePage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [registrationForm, setRegistrationForm] = useState(registrationInitialState);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (user?.role === "team") {
      setRegistrationForm((current) => ({
        ...current,
        team_name: user.team_name || current.team_name,
        contact_number: user.phone_number || current.contact_number,
      }));
    }
  }, [user]);

  async function loadTournaments() {
    try {
      setLoading(true);
      const data = await getTournaments();
      setTournaments(data);
    } catch {
      setError("Unable to load tournaments right now.");
    } finally {
      setLoading(false);
    }
  }

  const displayTournaments = tournaments.length ? tournaments : demoTournaments;
  const showingDemoData = tournaments.length === 0;
  const featuredTournament = displayTournaments[0];

  const stats = useMemo(() => {
    const totalTeams = displayTournaments.reduce(
      (sum, item) => sum + item.approved_registrations_count,
      0
    );
    return {
      tournaments: displayTournaments.length,
      teams: totalTeams,
      venues: new Set(displayTournaments.map((item) => item.location)).size,
    };
  }, [displayTournaments]);

  useEffect(() => {
    if (!loading) {
      displayTournaments.forEach((_, i) => {
        setTimeout(() => setCardsVisible((prev) => [...prev, i]), 120 * i + 300);
      });
    }
  }, [loading]);

  const handleRegistrationChange = ({ target }) => {
    setRegistrationForm((current) => ({ ...current, [target.name]: target.value }));
  };

  const openRegistration = (tournament) => {
    if (tournament.is_demo) {
      setMessage("You are viewing demo tournaments. Create real tournaments from the dashboard.");
      return;
    }
    setSelectedTournament(tournament);
    setMessage("");
    setError("");
    setTimeout(() => {
      document.querySelector(".reg-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const submitRegistration = async (event) => {
    event.preventDefault();
    if (!selectedTournament) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await createRegistration(selectedTournament.id, registrationForm);
      setMessage(`Registration submitted for ${selectedTournament.name}. Awaiting organizer approval.`);
      setSelectedTournament(null);
      setRegistrationForm((current) => ({
        ...registrationInitialState,
        team_name: current.team_name,
        contact_number: current.contact_number,
      }));
      await loadTournaments();
    } catch (requestError) {
      const apiError = requestError.response?.data;
      setError(typeof apiError === "string" ? apiError : JSON.stringify(apiError || {}));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sp-root">

      {/* ─── HERO ─── */}
      <section className={`hero ${heroVisible ? "hero--visible" : ""}`}>
        <ParticleCanvas />

        <div className="hero-bg-grid" />
        <div className="hero-bg-orb hero-bg-orb--1" />
        <div className="hero-bg-orb hero-bg-orb--2" />
        <div className="hero-bg-orb hero-bg-orb--3" />

        {/* Left */}
        <div className="hero-main">
          <div className="eyebrow-tag">
            <span className="eyebrow-dot" />
            Tournament command center
          </div>

          <h1 className="hero-headline">
            <span className="hl-line hl-line--1">Run your</span>
            <em className="hl-line hl-line--2">cricket event</em>
            <span className="hl-line hl-line--3">different.</span>
          </h1>

          <p className="hero-body">
            A sharper front desk for organizers and teams. Publish tournaments, present the prize
            pool clearly, and move registrations through approval without messy spreadsheets.
          </p>

          <div className="feature-pills">
            {["Modern event cards", "Cleaner registration flow", "Organizer-ready dashboard", "Responsive mobile layout"].map((pill) => (
              <span key={pill} className="pill">{pill}</span>
            ))}
          </div>

          <div className="hero-cta-row">
            <Link className="btn-primary" to={user ? "/dashboard" : "/auth"}>
              <span>{user ? "Open Dashboard" : "Start Managing"}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a className="btn-ghost" href="#live-tournaments">
              Browse Tournaments
            </a>
          </div>

          <div className="hero-summary-strip">
            {[
              { label: "Most active format", value: featuredTournament?.match_format || "T20" },
              { label: "Featured venue", value: featuredTournament?.location || "City Stadium" },
              { label: "Open slots", value: featuredTournament?.slots_left ?? 0 },
              { label: "Status", value: "Live", live: true },
            ].map(({ label, value, live }) => (
              <div key={label} className="strip-cell">
                <small>{label}</small>
                <strong className={live ? "live-badge" : ""}>{live ? <><span className="live-dot" />{value}</> : value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Right side panel */}
        <div className="hero-side">
          <div className="scoreboard">
            <div className="scoreboard-label">Season at a glance</div>
            <div className="stat-row">
              <StatCell value={stats.tournaments} label="Active tournaments" />
              <StatCell value={stats.teams} label="Approved teams" />
              <StatCell value={stats.venues} label="Venues" />
            </div>
            <div className="highlight-chips">
              {demoHighlights.map((item) => (
                <div className="chip" key={item.label}>
                  <span className="chip-label">{item.label}</span>
                  <div>
                    <div className="chip-val">{item.value}</div>
                    <div className="chip-note">{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {featuredTournament && (
            <div className="featured-panel">
              <div className="eyebrow-tag featured-eyebrow-tag">Featured event</div>
              <div className="featured-sport-tag">{featuredTournament.sport}</div>
              <div className="featured-name">{featuredTournament.name}</div>
              <p className="featured-desc">{featuredTournament.description}</p>
              <div className="featured-meta">
                <span>Prize: {featuredTournament.prize_details}</span>
                <span>Entry fee: Rs. {featuredTournament.entry_fee}</span>
                <span>{featuredTournament.start_date} – {featuredTournament.end_date}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── STATUS BANNERS ─── */}
      {message && (
        <div className="banner-strip success" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1" />
            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {message}
        </div>
      )}

      {error && (
        <div className="banner-strip error" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1" />
            <path d="M6 6l4 4M10 6l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      {showingDemoData && (
        <div className="banner-strip demo" role="status">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1" />
            <path d="M8 4.5v4L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Demo mode — sample data shown. Create real tournaments from the dashboard to go live.
        </div>
      )}

      {/* ─── SECTION HEADER ─── */}
      <div className="section-block" id="live-tournaments">
        <span className="section-eyebrow">Open events</span>
        <h2>Upcoming Tournaments</h2>
        <p>Organizers manage events from the dashboard. Teams can register directly from this page.</p>
      </div>

      {/* ─── TOURNAMENT CARDS ─── */}
      {loading ? (
        <div className="loading-state">
          <div className="loader-inner">
            <div className="loader-ball" />
            <div className="loader-ball loader-ball--2" />
            <div className="loader-ball loader-ball--3" />
          </div>
          <span>Loading tournaments</span>
        </div>
      ) : (
        <div className="card-grid">
          {displayTournaments.map((tournament, i) => (
            <article
              className={`t-card ${cardsVisible.includes(i) ? "t-card--visible" : ""}`}
              key={tournament.id}
            >
              <div className="card-shine" />

              <div className="banner-frame">
                {tournament.banner_url ? (
                  <img src={tournament.banner_url} alt={tournament.name} className="banner-image" />
                ) : (
                  <div className="banner-placeholder">
                    <div className="banner-bg-text">{tournament.name.slice(0, 2).toUpperCase()}</div>
                    <div className="banner-overlay-content">
                      <span className="banner-sport-label">{tournament.sport}</span>
                      <div className="banner-format-tag">{tournament.match_format}</div>
                    </div>
                  </div>
                )}
                <div className="banner-gradient-overlay" />
              </div>

              <div className="card-top-row">
                <div>
                  <h3>{tournament.name}</h3>
                  <p className="card-location">
                    <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                      <path d="M5 0C2.24 0 0 2.24 0 5c0 3.75 5 7 5 7s5-3.25 5-7c0-2.76-2.24-5-5-5zm0 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="currentColor" />
                    </svg>
                    {tournament.location}
                  </p>
                </div>
                <span className="sport-badge">{tournament.sport}</span>
              </div>

              <p className="card-copy">{tournament.description}</p>

              <div className="meta-grid">
                <div className="meta-item">
                  <span className="meta-key">Format</span>
                  <span className="meta-val">{tournament.match_format}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Entry Fee</span>
                  <span className="meta-val">Rs. {tournament.entry_fee}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Prize</span>
                  <span className="meta-val prize">{tournament.prize_details}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Slots Left</span>
                  <span className={`meta-val ${tournament.slots_left <= 3 ? "slots-urgent" : ""}`}>
                    {tournament.slots_left}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Starts</span>
                  <span className="meta-val">{tournament.start_date}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Ends</span>
                  <span className="meta-val">{tournament.end_date}</span>
                </div>
              </div>

              <div className="card-footer">
                <div className="mini-count">
                  <strong>{tournament.approved_registrations_count}</strong>
                  <span>Approved teams</span>
                </div>

                {user?.role === "team" ? (
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => openRegistration(tournament)}
                    disabled={tournament.is_registered && !tournament.is_demo}
                  >
                    <span>
                      {tournament.is_demo
                        ? "Preview Only"
                        : tournament.is_registered
                        ? "Already Registered"
                        : "Register Team"}
                    </span>
                    {!tournament.is_registered && !tournament.is_demo && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ) : user?.role === "organizer" ? (
                  <Link className="btn-ghost" to="/dashboard">Manage Event</Link>
                ) : (
                  <Link className="btn-primary" to="/auth">
                    <span>Login to Register</span>
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ─── REGISTRATION PANEL ─── */}
      {selectedTournament && (
        <div className="reg-panel">
          <div className="reg-panel-header">
            <div>
              <span className="reg-eyebrow">Team registration</span>
              <h2>{selectedTournament.name}</h2>
            </div>
            <button
              className="btn-ghost close-btn"
              type="button"
              onClick={() => setSelectedTournament(null)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Close
            </button>
          </div>

          <form className="form-grid" onSubmit={submitRegistration}>
            {[
              { label: "Team Name", name: "team_name", type: "text", required: true },
              { label: "Team City", name: "team_city", type: "text", required: true },
              { label: "Player Count", name: "player_count", type: "number", min: 7, max: 18, required: true },
              { label: "Contact Number", name: "contact_number", type: "text", required: true },
            ].map(({ label, name, type, ...rest }) => (
              <label key={name} className="form-field">
                <span>{label}</span>
                <input
                  name={name}
                  type={type}
                  value={registrationForm[name]}
                  onChange={handleRegistrationChange}
                  {...rest}
                />
              </label>
            ))}

            <label className="form-field full-width">
              <span>Notes</span>
              <textarea
                name="notes"
                rows="4"
                value={registrationForm.notes}
                onChange={handleRegistrationChange}
              />
            </label>

            <div className="submit-wrap">
              <button className="btn-primary btn-submit-full" type="submit" disabled={submitting}>
                {submitting ? (
                  <><span className="spinner" />Submitting…</>
                ) : (
                  <><span>Submit Registration</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg></>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default HomePage;