import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const signupInitialState = {
  username: "",
  email: "",
  password: "",
  full_name: "",
  role: "team",
  phone_number: "",
  team_name: "",
};

function AuthPage() {
  const navigate = useNavigate();
  const { loginUser, signupUser } = useAuth();

  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [signupForm, setSignupForm] = useState(signupInitialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isTeamRole = useMemo(() => signupForm.role === "team", [signupForm.role]);

  const handleLoginChange = ({ target }) => {
    setLoginForm((prev) => ({ ...prev, [target.name]: target.value }));
  };

  const handleSignupChange = ({ target }) => {
    setSignupForm((prev) => ({ ...prev, [target.name]: target.value }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await loginUser(loginForm);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signupUser(signupForm);
      navigate("/dashboard");
    } catch (err) {
      const apiError = err.response?.data;
      setError(typeof apiError === "string" ? apiError : JSON.stringify(apiError || {}));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-layout">
      {/* LEFT SIDE INFO PANEL */}
      <div className="hero-card auth-copy">
        <span className="eyebrow">TournamentX access</span>
        <h1>One login for organizers and captains</h1>
        <p>
          Create tournaments, approve teams, register squads, and use GenAI helpers for
          commentary, announcements, and match-day planning.
        </p>

        <div className="auth-trust-strip">
          <div>
            <strong>Role aware</strong>
            <small>Organizer and team views stay separate.</small>
          </div>
          <div>
            <strong>AI ready</strong>
            <small>Prompt templates and commentary tools included.</small>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE FORM PANEL */}
      <div className="panel auth-panel">
        <div className="toggle-row">
          <button
            className={mode === "login" ? "tab-button active" : "tab-button"}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={mode === "signup" ? "tab-button active" : "tab-button"}
            onClick={() => setMode("signup")}
          >
            Signup
          </button>
        </div>

        <div className="auth-panel-header">
          <h3>{mode === "login" ? "Welcome Back" : "Create Account"}</h3>
          <p>
            {mode === "login"
              ? "Login to manage or join tournaments"
              : "Register as a team or organizer"}
          </p>
        </div>

        {error && <p className="form-error">{error}</p>}

        {mode === "login" ? (
          <form className="form-grid" onSubmit={handleLoginSubmit}>
            <label>
              <span>Username or Email</span>
              <input
                name="username"
                value={loginForm.username}
                onChange={handleLoginChange}
                required
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                required
              />
            </label>

            <button type="submit" disabled={loading} className="primary-button">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="form-grid" onSubmit={handleSignupSubmit}>
            <label>
              <span>Full Name</span>
              <input
                name="full_name"
                value={signupForm.full_name}
                onChange={handleSignupChange}
                required
              />
            </label>

            <label>
              <span>Username</span>
              <input
                name="username"
                value={signupForm.username}
                onChange={handleSignupChange}
                required
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={signupForm.email}
                onChange={handleSignupChange}
                required
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                name="password"
                value={signupForm.password}
                onChange={handleSignupChange}
                required
              />
            </label>

            <label>
              <span>Phone Number</span>
              <input
                name="phone_number"
                value={signupForm.phone_number}
                onChange={handleSignupChange}
              />
            </label>

            <label>
              <span>Role</span>
              <select
                name="role"
                value={signupForm.role}
                onChange={handleSignupChange}
              >
                <option value="team">Team</option>
                <option value="organizer">Organizer</option>
              </select>
            </label>

            {isTeamRole && (
              <label className="full-width">
                <span>Team Name</span>
                <input
                  name="team_name"
                  value={signupForm.team_name}
                  onChange={handleSignupChange}
                  required
                />
              </label>
            )}

            <button type="submit" disabled={loading} className="primary-button">
              {loading ? "Creating account..." : "Signup"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default AuthPage;
