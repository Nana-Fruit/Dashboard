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
      <h2>ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
      <p className="muted">บัญชีของคุณไม่ได้รับสิทธิ์ดูข้อมูลส่วนนี้ ติดต่อผู้ดูแลระบบหากต้องการสิทธิ์เพิ่ม</p>
    </div>
  );
}
