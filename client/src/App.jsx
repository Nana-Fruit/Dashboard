import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import OfficePage from "./pages/OfficePage.jsx";
import FactoryPage from "./pages/FactoryPage.jsx";
import DryRoomPage from "./pages/DryRoomPage.jsx";

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.viewOffice) return <Navigate to="/office" replace />;
  if (user.viewFactory) return <Navigate to="/factory" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <div className="app-loading">Loading…</div>;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/office" element={<ProtectedRoute area="office"><OfficePage /></ProtectedRoute>} />
        <Route path="/factory" element={<ProtectedRoute area="factory"><FactoryPage /></ProtectedRoute>} />
        <Route path="/factory/dry-room" element={<ProtectedRoute area="factory"><DryRoomPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
