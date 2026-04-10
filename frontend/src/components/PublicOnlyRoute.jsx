import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <section className="panel centered-panel">Preparing authentication...</section>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}


export default PublicOnlyRoute;
