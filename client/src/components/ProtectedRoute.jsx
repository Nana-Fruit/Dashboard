import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

// area: "office" | "factory" | undefined (just needs login)
export default function ProtectedRoute({ area, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (area === "office" && !user.viewOffice) return <NoAccess />;
  if (area === "factory" && !user.viewFactory) return <NoAccess />;
  return children;
}

function NoAccess() {
  return (
    <div className="no-access">
      <h2>No access to this section</h2>
      <p className="muted">Your account isn’t permitted to view this area. Contact an admin if you need access.</p>
    </div>
  );
}
