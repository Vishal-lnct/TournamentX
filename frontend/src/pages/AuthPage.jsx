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
    setLoginForm((current) => ({ ...current, [target.name]: target.value }));
  };

  const handleSignupChange = ({ target }) => {
    setSignupForm((current) => ({ ...current, [target.name]: target.value }));
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await loginUser(loginForm);
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to login. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signupUser(signupForm);
      navigate("/dashboard");
    } catch (requestError) {
      const apiError = requestError.response?.data;
      setError(typeof apiError === "string" ? apiError : JSON.stringify(apiError || {}));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-layout">
      <div className="hero-card auth-copy">
        <span className="eyebrow">Production-ready starter</span>
        <h1>Run cricket tournaments with approvals, role-based access, and live registration tracking.</h1>
        <p>
          Organizers can publish tournaments, review incoming team entries, and manage every event from one dashboard.
          Team captains can browse fixtures, register once, and track approval status in real time.
        </p>
        <div className="feature-list">
          <span>JWT authentication</span>
          <span>Organizer vs team workflows</span>
          <span>Banner upload support</span>
          <span>PostgreSQL-ready backend</span>
        </div>
        <div className="auth-trust-strip">
          <div>
            <strong>Fast setup</strong>
            <small>Go from signup to first fixture in minutes.</small>
          </div>
          <div>
            <strong>Role aware</strong>
            <small>Clean experiences for organizers and teams.</small>
          </div>
        </div>
      </div>

      <div className="panel auth-panel">
        <div className="toggle-row">
          <button
            className={mode === "login" ? "tab-button active" : "tab-button"}
            type="button"
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={mode === "signup" ? "tab-button active" : "tab-button"}
            type="button"
            onClick={() => setMode("signup")}
          >
            Signup
          </button>
        </div>

        <div className="auth-panel-header">
          <div>
            <span className="eyebrow">Access portal</span>
            <h3>{mode === "login" ? "Welcome back" : "Create your account"}</h3>
          </div>
          <p>{mode === "login" ? "Open your dashboard and continue managing fixtures." : "Choose your role and start organizing or registering."}</p>
        </div>

        {error && <p className="form-error">{error}</p>}

        {mode === "login" ? (
          <form className="form-grid" onSubmit={handleLoginSubmit}>
            <label>
              <span>Username or Email</span>
              <input name="username" value={loginForm.username} onChange={handleLoginChange} required />
            </label>
            <label>
              <span>Password</span>
              <input type="password" name="password" value={loginForm.password} onChange={handleLoginChange} required />
            </label>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="form-grid" onSubmit={handleSignupSubmit}>
            <label>
              <span>Full Name</span>
              <input name="full_name" value={signupForm.full_name} onChange={handleSignupChange} required />
            </label>
            <label>
              <span>Username</span>
              <input name="username" value={signupForm.username} onChange={handleSignupChange} required />
            </label>
            <label>
              <span>Email</span>
              <input type="email" name="email" value={signupForm.email} onChange={handleSignupChange} required />
            </label>
            <label>
              <span>Password</span>
              <input type="password" name="password" value={signupForm.password} onChange={handleSignupChange} required />
            </label>
            <label>
              <span>Phone Number</span>
              <input name="phone_number" value={signupForm.phone_number} onChange={handleSignupChange} />
            </label>
            <label>
              <span>Role</span>
              <select name="role" value={signupForm.role} onChange={handleSignupChange}>
                <option value="team">Team Captain / Player</option>
                <option value="organizer">Organizer</option>
              </select>
            </label>
            {isTeamRole && (
              <label className="full-width">
                <span>Team Name</span>
                <input name="team_name" value={signupForm.team_name} onChange={handleSignupChange} required={isTeamRole} />
              </label>
            )}
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}


export default AuthPage;