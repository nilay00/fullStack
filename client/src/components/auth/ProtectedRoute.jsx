import { Navigate } from "react-router-dom";
import "../../styles/auth.css";
import { useAuth } from "../../hooks/useAuth";
import Spinner from "../shared/Spinner";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="protected-loading-wrap">
        <Spinner size={32} label="Loading…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
