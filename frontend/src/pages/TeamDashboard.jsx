import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyRegistrations } from "../api/tournamentService";
import { useAuth } from "../context/AuthContext";
import { buildTeamPrep } from "../utils/aiInsights";


function TeamDashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRegistrations() {
      try {
        const data = await getMyRegistrations();
        setRegistrations(data);
      } catch {
        setError("Unable to load your registrations.");
      } finally {
        setLoading(false);
      }
    }

    loadRegistrations();
  }, []);

  const stats = useMemo(
    () => ({
      total: registrations.length,
      approved: registrations.filter((item) => item.status === "approved").length,
      pending: registrations.filter((item) => item.status === "pending").length,
    }),
    [registrations],
  );

  if (loading) {
    return <section className="panel centered-panel">Loading your registrations...</section>;
  }

  return (
    <div className="page-stack">
      <section className="section-header">
        <div>
          <span className="eyebrow">Team captain desk</span>
          <h2>{user.team_name || user.full_name}</h2>
        </div>
        <p>Track registrations, approval status, and AI prep notes before match day.</p>
      </section>

      {error && <section className="panel error-banner">{error}</section>}

      <section className="dashboard-summary-grid">
        <article className="stats-card summary-tile">
          <small>Total registrations</small>
          <strong>{stats.total}</strong>
          <span>Every event your team has entered</span>
        </article>
        <article className="stats-card summary-tile">
          <small>Approved</small>
          <strong>{stats.approved}</strong>
          <span>Tournaments cleared by organizers</span>
        </article>
        <article className="stats-card summary-tile">
          <small>Pending</small>
          <strong>{stats.pending}</strong>
          <span>Entries waiting for review</span>
        </article>
      </section>

      <section className="panel ai-ops-panel">
        <div className="card-header-row">
          <div>
            <span className="eyebrow">GenAI prep coach</span>
            <h3>Captain checklist</h3>
            <p>Short, practical guidance generated from each registration status.</p>
          </div>
        </div>
        <div className="ai-action-grid">
          {(registrations.length ? registrations : []).slice(0, 3).map((registration) => (
            <article className="mini-card" key={`prep-${registration.id}`}>
              <strong>{registration.tournament_name}</strong>
              <p>{buildTeamPrep(registration)}</p>
            </article>
          ))}
          {!registrations.length && (
            <article className="mini-card">
              <strong>No active registrations yet</strong>
              <p>Browse tournaments and enter your team to unlock prep notes.</p>
            </article>
          )}
        </div>
      </section>

      <section className="panel workspace-card">
        <div className="card-header-row">
          <div>
            <span className="eyebrow">Registration tracker</span>
            <h3>Your Tournament Entries</h3>
            <p>Every registration is listed here with its current organizer decision.</p>
          </div>
          <Link className="primary-button" to="/">
            Browse More Tournaments
          </Link>
        </div>

        <div className="stack-list">
          {registrations.length ? (
            registrations.map((registration) => (
              <article className="mini-card team-registration-card" key={registration.id}>
                <div>
                  <strong>{registration.tournament_name}</strong>
                  <p>
                    {registration.team_name} | {registration.team_city}
                  </p>
                  <small>Sport: {registration.tournament_sport} | Contact: {registration.contact_number}</small>
                </div>
                <div className="status-pair status-block">
                  <span className={`status-chip ${registration.status}`}>{registration.status}</span>
                  <small>{buildTeamPrep(registration)}</small>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">No tournament registrations yet. Start from the home page to enter your first event.</div>
          )}
        </div>
      </section>
    </div>
  );
}


export default TeamDashboard;
