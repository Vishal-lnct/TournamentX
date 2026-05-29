import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createRegistration, getTournaments } from "../api/tournamentService";
import { useAuth } from "../context/AuthContext";
import { demoHighlights, demoTournaments } from "../data/demoData";
import {
  buildCommentary,
  buildScoreProjection,
  formatCurrency,
  getTournamentHealth,
} from "../utils/aiInsights";
import "./HomePage.css";

const registrationInitialState = {
  team_name: "",
  team_city: "",
  player_count: 11,
  contact_number: "",
  notes: "",
};

function StatTile({ label, value, note }) {
  return (
    <article className="stat-tile">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function HomePage() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [selectedAiTournamentId, setSelectedAiTournamentId] = useState(null);
  const [model, setModel] = useState("gpt");
  const [registrationForm, setRegistrationForm] = useState(registrationInitialState);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      setSelectedAiTournamentId(data[0]?.id || null);
    } catch {
      setError("Unable to load tournaments right now.");
    } finally {
      setLoading(false);
    }
  }

  const displayTournaments = tournaments.length ? tournaments : demoTournaments;
  const showingDemoData = tournaments.length === 0;
  const featuredTournament = displayTournaments[0];
  const aiTournament =
    displayTournaments.find((item) => item.id === selectedAiTournamentId) || featuredTournament;
  const aiInsight = aiTournament ? buildCommentary(aiTournament, model) : null;

  const stats = useMemo(() => {
    const teams = displayTournaments.reduce(
      (sum, item) => sum + Number(item.approved_registrations_count || 0),
      0,
    );
    const sports = new Set(displayTournaments.map((item) => item.sport)).size;
    const slots = displayTournaments.reduce((sum, item) => sum + Number(item.slots_left || 0), 0);
    return { teams, sports, slots };
  }, [displayTournaments]);

  const handleRegistrationChange = ({ target }) => {
    setRegistrationForm((current) => ({ ...current, [target.name]: target.value }));
  };

  const openRegistration = (tournament) => {
    if (tournament.is_demo) {
      setMessage("Demo tournament selected. Create real tournaments from the organizer dashboard.");
      return;
    }
    setSelectedTournament(tournament);
    setMessage("");
    setError("");
    setTimeout(() => {
      document.querySelector(".registration-board")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
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
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-copy">
          <span className="section-kicker">Multi-sport tournament operations</span>
          <h1>Run real tournaments without the match-day mess.</h1>
          <p>
            TournamentX keeps the core workflow simple: organizers publish events,
            captains register teams, approvals stay trackable, and every sport gets a
            clean public board with useful AI-assisted updates.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to={user ? "/dashboard" : "/auth"}>
              {user ? "Open Dashboard" : "Create or Join"}
            </Link>
            <a className="ghost-button" href="#tournaments">
              View Events
            </a>
          </div>
        </div>

        <aside className="match-room">
          <div className="room-header">
            <span>Live command board</span>
            <strong>{featuredTournament?.name || "Tournament desk"}</strong>
          </div>
          <div className="score-line">{featuredTournament ? buildScoreProjection(featuredTournament) : "Ready"}</div>
          <div className="room-grid">
            <StatTile label="Teams" value={stats.teams} note="Approved entries" />
            <StatTile label="Sports" value={stats.sports} note="Active categories" />
            <StatTile label="Slots" value={stats.slots} note="Still open" />
          </div>
          <div className="broadcast-list">
            {demoHighlights.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.note}</small>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {message && <div className="notice success">{message}</div>}
      {error && <div className="notice error">{error}</div>}
      {showingDemoData && (
        <div className="notice demo">
          Demo mode is active because no live tournaments were returned by the backend.
        </div>
      )}

      <section className="ai-studio">
        <div>
          <span className="section-kicker">GenAI desk</span>
          <h2>Commentary, prompt engineering, and score projection</h2>
          <p>
            Pick a tournament and model style to generate a match-ready prompt,
            broadcast copy, and a quick score projection for captains and organizers.
          </p>
        </div>
        <div className="ai-controls">
          <label>
            <span>Tournament</span>
            <select
              value={aiTournament?.id || ""}
              onChange={(event) => setSelectedAiTournamentId(event.target.value)}
            >
              {displayTournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>LLM style</span>
            <select value={model} onChange={(event) => setModel(event.target.value)}>
              <option value="gpt">GPT-4.1 broadcast</option>
              <option value="gemini">Gemini operations</option>
              <option value="claude">Claude policy note</option>
            </select>
          </label>
        </div>
        {aiInsight && (
          <div className="ai-output">
            <div className="prompt-card">
              <span>Prompt template</span>
              <pre>{aiInsight.prompt}</pre>
            </div>
            <div className="commentary-card">
              <span>{aiInsight.modelLine}</span>
              <h3>{aiInsight.title}</h3>
              <p>{aiInsight.output}</p>
              <strong>{buildScoreProjection(aiTournament)}</strong>
            </div>
          </div>
        )}
      </section>

      <section className="section-heading" id="tournaments">
        <div>
          <span className="section-kicker">Open events</span>
          <h2>Upcoming tournaments</h2>
        </div>
        <p>Browse multi-sport events, check capacity, and register your team.</p>
      </section>

      {loading ? (
        <div className="loading-state">Loading tournaments...</div>
      ) : (
        <section className="tournament-grid">
          {displayTournaments.map((tournament) => {
            const health = getTournamentHealth(tournament);
            return (
              <article className="tournament-card" key={tournament.id}>
                <div className="card-media">
                  {tournament.banner_url ? (
                    <img src={tournament.banner_url} alt={tournament.name} />
                  ) : (
                    <div className={`sport-poster sport-${tournament.sport}`}>
                      <span>{tournament.sport}</span>
                      <strong>{tournament.match_format}</strong>
                    </div>
                  )}
                </div>
                <div className="card-body">
                  <div className="card-title-row">
                    <div>
                      <span className="sport-chip">{tournament.sport}</span>
                      <h3>{tournament.name}</h3>
                    </div>
                    <span className={`health-chip ${health.tone}`}>{health.label}</span>
                  </div>
                  <p>{tournament.description}</p>
                  <div className="meta-strip">
                    <span>{tournament.location}</span>
                    <span>{formatCurrency(tournament.entry_fee)}</span>
                    <span>{tournament.start_date}</span>
                    <span>{health.slotsLeft} slots left</span>
                  </div>
                  <div className="capacity-bar">
                    <span style={{ width: `${Math.min(health.fillRate, 100)}%` }} />
                  </div>
                  <div className="card-actions">
                    <small>{tournament.prize_details}</small>
                    {user?.role === "team" ? (
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => openRegistration(tournament)}
                        disabled={tournament.is_registered && !tournament.is_demo}
                      >
                        {tournament.is_registered && !tournament.is_demo ? "Registered" : "Register"}
                      </button>
                    ) : user?.role === "organizer" ? (
                      <Link className="ghost-button" to="/dashboard">
                        Manage
                      </Link>
                    ) : (
                      <Link className="primary-button" to="/auth">
                        Login to Register
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {selectedTournament && (
        <section className="registration-board">
          <div className="section-heading compact">
            <div>
              <span className="section-kicker">Team registration</span>
              <h2>{selectedTournament.name}</h2>
            </div>
            <button className="ghost-button" type="button" onClick={() => setSelectedTournament(null)}>
              Close
            </button>
          </div>
          <form className="form-grid" onSubmit={submitRegistration}>
            <label>
              <span>Team Name</span>
              <input name="team_name" value={registrationForm.team_name} onChange={handleRegistrationChange} required />
            </label>
            <label>
              <span>Team City</span>
              <input name="team_city" value={registrationForm.team_city} onChange={handleRegistrationChange} required />
            </label>
            <label>
              <span>Player Count</span>
              <input type="number" min="7" max="18" name="player_count" value={registrationForm.player_count} onChange={handleRegistrationChange} required />
            </label>
            <label>
              <span>Contact Number</span>
              <input name="contact_number" value={registrationForm.contact_number} onChange={handleRegistrationChange} required />
            </label>
            <label className="full-width">
              <span>Notes for organizer</span>
              <textarea name="notes" rows="4" value={registrationForm.notes} onChange={handleRegistrationChange} />
            </label>
            <button className="primary-button full-width" type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Registration"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

export default HomePage;
