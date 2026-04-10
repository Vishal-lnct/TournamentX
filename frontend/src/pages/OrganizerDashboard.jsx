import { useEffect, useMemo, useState } from "react";
import {
  createTournament,
  deleteTournament,
  getMyTournaments,
  getTournamentRegistrations,
  reviewRegistration,
  updateTournament,
} from "../api/tournamentService";


const initialFormState = {
  name: "",
  sport: "cricket",
  location: "",
  entry_fee: "",
  prize_details: "",
  number_of_teams: "",
  match_format: "T20",
  start_date: "",
  end_date: "",
  description: "",
  banner: null,
};


function OrganizerDashboard() {
  const [formState, setFormState] = useState(initialFormState);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [editingTournament, setEditingTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    bootstrapDashboard();
  }, []);

  const selectedTournament = useMemo(
    () => tournaments.find((item) => item.id === selectedTournamentId) || null,
    [tournaments, selectedTournamentId],
  );

  const summary = useMemo(
    () => ({
      totalTournaments: tournaments.length,
      totalApproved: tournaments.reduce((sum, item) => sum + item.approved_registrations_count, 0),
      totalCapacity: tournaments.reduce((sum, item) => sum + Number(item.number_of_teams || 0), 0),
    }),
    [tournaments],
  );

  async function bootstrapDashboard() {
    try {
      setLoading(true);
      const data = await getMyTournaments();
      setTournaments(data);
      if (data.length && !selectedTournamentId) {
        setSelectedTournamentId(data[0].id);
        await loadRegistrations(data[0].id);
      }
    } catch {
      setError("Unable to load organizer dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function loadRegistrations(tournamentId) {
    try {
      const data = await getTournamentRegistrations(tournamentId);
      setRegistrations(data);
      setSelectedTournamentId(tournamentId);
    } catch {
      setError("Unable to load registrations for that tournament.");
    }
  }

  const handleChange = ({ target }) => {
    const value = target.type === "file" ? target.files[0] : target.value;
    setFormState((current) => ({ ...current, [target.name]: value }));
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setEditingTournament(null);
  };

  const buildFormData = () => {
    const payload = new FormData();
    Object.entries(formState).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        payload.append(key, value);
      }
    });
    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback("");
    setError("");
    try {
      const payload = buildFormData();
      if (editingTournament) {
        await updateTournament(editingTournament.id, payload);
        setFeedback("Tournament updated successfully.");
      } else {
        await createTournament(payload);
        setFeedback("Tournament created successfully.");
      }
      resetForm();
      await bootstrapDashboard();
    } catch (requestError) {
      const apiError = requestError.response?.data;
      setError(typeof apiError === "string" ? apiError : JSON.stringify(apiError || {}));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tournament) => {
    setEditingTournament(tournament);
    setFormState({
      name: tournament.name,
      sport: tournament.sport,
      location: tournament.location,
      entry_fee: tournament.entry_fee,
      prize_details: tournament.prize_details,
      number_of_teams: tournament.number_of_teams,
      match_format: tournament.match_format,
      start_date: tournament.start_date,
      end_date: tournament.end_date,
      description: tournament.description,
      banner: null,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this tournament permanently?")) {
      return;
    }
    try {
      await deleteTournament(id);
      setFeedback("Tournament deleted successfully.");
      if (selectedTournamentId === id) {
        setSelectedTournamentId(null);
        setRegistrations([]);
      }
      await bootstrapDashboard();
    } catch {
      setError("Unable to delete tournament.");
    }
  };

  const handleReview = async (registrationId, status) => {
    try {
      await reviewRegistration(registrationId, status);
      if (selectedTournamentId) {
        await loadRegistrations(selectedTournamentId);
        await bootstrapDashboard();
      }
    } catch (requestError) {
      const apiError = requestError.response?.data;
      setError(typeof apiError === "string" ? apiError : JSON.stringify(apiError || {}));
    }
  };

  if (loading) {
    return <section className="panel centered-panel">Loading organizer workspace...</section>;
  }

  return (
    <div className="page-stack">
      <section className="section-header">
        <div>
          <span className="eyebrow">Organizer control room</span>
          <h2>Create, update, and review tournaments</h2>
        </div>
        <p>Manage banners, registration approvals, and tournament capacity from a single dashboard.</p>
      </section>

      <section className="dashboard-summary-grid">
        <article className="stats-card summary-tile">
          <small>Live tournaments</small>
          <strong>{summary.totalTournaments}</strong>
          <span>Events you are currently running</span>
        </article>
        <article className="stats-card summary-tile">
          <small>Approved entries</small>
          <strong>{summary.totalApproved}</strong>
          <span>Teams cleared to participate</span>
        </article>
        <article className="stats-card summary-tile">
          <small>Total capacity</small>
          <strong>{summary.totalCapacity}</strong>
          <span>Combined team slots across tournaments</span>
        </article>
      </section>

      {feedback && <section className="panel success-banner">{feedback}</section>}
      {error && <section className="panel error-banner">{error}</section>}

      <section className="dashboard-grid">
        <form className="panel form-grid workspace-card" onSubmit={handleSubmit}>
          <div className="card-header-row">
            <div>
              <span className="eyebrow">Event studio</span>
              <h3>{editingTournament ? "Edit Tournament" : "Create Tournament"}</h3>
              <p>Set the format, dates, pricing, banner, and registration limits in one place.</p>
            </div>
            {editingTournament && (
              <button className="ghost-button" type="button" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>

          <label>
            <span>Name</span>
            <input name="name" value={formState.name} onChange={handleChange} required />
          </label>
          <label>
            <span>Sport</span>
            <select name="sport" value={formState.sport} onChange={handleChange}>
              <option value="cricket">Cricket</option>
              <option value="football">Football</option>
              <option value="kabaddi">Kabaddi</option>
              <option value="volleyball">Volleyball</option>
              <option value="badminton">Badminton</option>
              <option value="basketball">Basketball</option>
              <option value="hockey">Hockey</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label>
            <span>Location</span>
            <input name="location" value={formState.location} onChange={handleChange} required />
          </label>
          <label>
            <span>Entry Fee</span>
            <input type="number" min="0" step="0.01" name="entry_fee" value={formState.entry_fee} onChange={handleChange} required />
          </label>
          <label>
            <span>Prize Details</span>
            <input name="prize_details" value={formState.prize_details} onChange={handleChange} required />
          </label>
          <label>
            <span>Number of Teams</span>
            <input type="number" min="2" name="number_of_teams" value={formState.number_of_teams} onChange={handleChange} required />
          </label>
          <label>
            <span>Match Format</span>
            <select name="match_format" value={formState.match_format} onChange={handleChange}>
              <option value="T20">T20</option>
              <option value="ODI">ODI</option>
              <option value="TEST">Test</option>
              <option value="T10">T10</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </label>
          <label>
            <span>Start Date</span>
            <input type="date" name="start_date" value={formState.start_date} onChange={handleChange} required />
          </label>
          <label>
            <span>End Date</span>
            <input type="date" name="end_date" value={formState.end_date} onChange={handleChange} required />
          </label>
          <label className="full-width">
            <span>Description</span>
            <textarea name="description" rows="4" value={formState.description} onChange={handleChange} required />
          </label>
          <label className="full-width">
            <span>Tournament Banner</span>
            <input type="file" accept="image/*" name="banner" onChange={handleChange} />
          </label>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : editingTournament ? "Update Tournament" : "Create Tournament"}
          </button>
        </form>

        <section className="stack-column">
          <div className="panel workspace-card">
            <div className="card-header-row">
              <div>
                <span className="eyebrow">Tournament list</span>
                <h3>Your Tournaments</h3>
                <p>{tournaments.length} tournaments created</p>
              </div>
            </div>
            <div className="stack-list">
              {tournaments.map((tournament) => (
                <article className="mini-card tournament-mini-card" key={tournament.id}>
                  <div>
                    <strong>{tournament.name}</strong>
                    <p>{tournament.sport} | {tournament.location}</p>
                    <small>
                      {tournament.approved_registrations_count}/{tournament.number_of_teams} approved teams
                    </small>
                  </div>
                  <div className="inline-actions wrap-actions">
                    <button className="ghost-button" type="button" onClick={() => loadRegistrations(tournament.id)}>
                      View Teams
                    </button>
                    <button className="ghost-button" type="button" onClick={() => handleEdit(tournament)}>
                      Edit
                    </button>
                    <button className="danger-button" type="button" onClick={() => handleDelete(tournament.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="panel workspace-card">
            <div className="card-header-row">
              <div>
                <span className="eyebrow">Approval queue</span>
                <h3>Registered Teams</h3>
                <p>{selectedTournament ? `Reviewing ${selectedTournament.name}` : "Select a tournament to review entries"}</p>
              </div>
            </div>
            <div className="stack-list">
              {registrations.length ? (
                registrations.map((registration) => (
                  <article className="mini-card registration-card" key={registration.id}>
                    <div>
                      <strong>{registration.team_name}</strong>
                      <p>
                        {registration.team_city} | {registration.player_count} players
                      </p>
                      <small>
                        Captain: {registration.captain.full_name} | Status: {registration.status}
                      </small>
                    </div>
                    <div className="inline-actions wrap-actions">
                      <button className="primary-button" type="button" onClick={() => handleReview(registration.id, "approved")}>
                        Approve
                      </button>
                      <button className="danger-button" type="button" onClick={() => handleReview(registration.id, "rejected")}>
                        Reject
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">No registrations available for the selected tournament yet.</div>
              )}
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}


export default OrganizerDashboard;