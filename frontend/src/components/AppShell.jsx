import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


function AppShell() {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand-mark">
          <span className="brand-badge">CTMS</span>
          <span>
            <strong>Cricket Tournament</strong>
            <small>Management System</small>
          </span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/">Home</NavLink>
          {isAuthenticated && <NavLink to="/dashboard">Dashboard</NavLink>}
          {!isAuthenticated && <NavLink to="/auth">Login / Signup</NavLink>}
        </nav>

        <div className="user-actions">
          {isAuthenticated ? (
            <>
              <div className="user-pill">
                <span>{user.full_name}</span>
                <small>{user.role === "organizer" ? "Organizer" : "Team Captain"}</small>
              </div>
              <button className="ghost-button" type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link className="primary-button" to="/auth">
              Get Started
            </Link>
          )}
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}


export default AppShell;