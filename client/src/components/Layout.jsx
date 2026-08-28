import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = () => { logout(); navigate("/login", { replace: true }); };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">Nana Fruit · Dashboard</div>
        <nav className="mainnav">
          {user?.viewOffice && <NavLink to="/office">Office</NavLink>}
          {user?.viewFactory && <NavLink to="/factory">โรงงาน</NavLink>}
          {user?.viewFactory && <NavLink to="/factory/dry-room">ห้องอบ (รายละเอียด)</NavLink>}
        </nav>
        <div className="userbox">
          <span className="role-badge">{user?.roleLabel}</span>
          <span className="uname">{user?.name}</span>
          <button onClick={doLogout}>ออกจากระบบ</button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
