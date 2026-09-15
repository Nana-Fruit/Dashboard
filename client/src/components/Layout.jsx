import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

function FactoryNavDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const isActive = location.pathname.startsWith("/factory");

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <div className="navdropdown" ref={ref}>
      <button
        type="button"
        className={"navdropdown-trigger" + (isActive ? " active" : "")}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Factory
        <span className="navdropdown-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="navdropdown-menu">
          <NavLink to="/factory" end onClick={() => setOpen(false)}>Overview</NavLink>
          <NavLink to="/factory/fresh-room" onClick={() => setOpen(false)}>Fresh Room</NavLink>
          <NavLink to="/factory/sorting-room" onClick={() => setOpen(false)}>Sorting Room</NavLink>
          <NavLink to="/factory/dry-room" onClick={() => setOpen(false)}>Drying Room</NavLink>
          <NavLink to="/factory/packing-room" onClick={() => setOpen(false)}>Packing Room</NavLink>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const doLogout = () => { logout(); navigate("/login", { replace: true }); };

  return (
    <div>
      <header className="topbar">
        <div className="brand">Nana Fruit</div>
        <nav className="mainnav">
          {user?.viewOffice && <NavLink to="/office">Office</NavLink>}
          {user?.viewFactory && <FactoryNavDropdown />}
        </nav>
        <div className="userbox">
          <span className="role-badge">{user?.roleLabel}</span>
          <span className="uname">{user?.name}</span>
          <button onClick={doLogout}>Sign out</button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
