
import { NavLink, Outlet, Link } from "react-router-dom";

function AppLayout() {
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <Link to="/" className="dashboard-brand">
          <span className="logo-mark">A</span>
          <span>Investigation</span>
        </Link>

        <div className="sidebar-section">
          <p className="sidebar-heading">WORKSPACE</p>

          <NavLink to="/app/explore" className="sidebar-link">
            <span>⌕</span> Explore
          </NavLink>

          <NavLink to="/app/workspace" className="sidebar-link">
            <span>▦</span> Workspace
          </NavLink>

          <NavLink to="/app/discoveries" className="sidebar-link">
            <span>✧</span> Discoveries
          </NavLink>

          <NavLink to="/app/reports" className="sidebar-link">
            <span>▤</span> Reports
          </NavLink>

          <NavLink to="/app/agent-network" className="sidebar-link">
  <span>◉</span> Agent Network
</NavLink>

        </div>

        <div className="sidebar-section">
          <p className="sidebar-heading">PREFERENCES</p>

          <NavLink to="/app/settings" className="sidebar-link">
            <span>⚙</span> Settings
          </NavLink>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">U</div>
            <div>
              <strong>Investigator</strong>
              <small>Workspace account</small>
            </div>
          </div>

          <Link to="/" className="back-home">
            ← Back to website
          </Link>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <span>Autonomous Investigation Platform</span>
          <span className="system-status">
            <span className="status-dot"></span>
            Frontend Preview
          </span>
        </header>

        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
