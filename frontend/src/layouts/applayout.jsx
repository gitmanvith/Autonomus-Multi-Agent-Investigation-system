import { NavLink, Outlet, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { checkHealth } from "../services/api";

export default function AppLayout() {
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    let mounted = true;
    checkHealth()
      .then(() => {
        if (mounted) setBackendStatus("online");
      })
      .catch(() => {
        if (mounted) setBackendStatus("offline");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const isOnline = backendStatus === "online";
  const statusColor = isOnline ? "#10b981" : "#ef4444";
  const statusLabel = isOnline ? "Autonomous Engine Active" : "Backend Offline";

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <Link to="/" className="dashboard-brand">
          <span className="logo-mark">AI</span>
          <div className="brand-text-col">
            <span className="brand-title">INVESTIGATE</span>
            <span className="brand-sub">Autonomous Multi-Agent</span>
          </div>
        </Link>

        {/* Workspace section */}
        <div className="sidebar-section">
          <p className="sidebar-heading">CORE WORKSPACE</p>

          <NavLink to="/app/workspace" className="sidebar-link">
            <span className="icon">◫</span> Overview & Workspace
          </NavLink>

          <NavLink to="/app/explore" className="sidebar-link">
            <span className="icon">⌕</span> Explore & Ingest
          </NavLink>

          <NavLink to="/app/network" className="sidebar-link highlight-link">
            <span className="icon">◈</span> 3D Agentic Network
          </NavLink>

          <NavLink to="/app/funnels" className="sidebar-link">
            <span className="icon">◫</span> 100-Funnel Engine (500 MB)
          </NavLink>

          <NavLink to="/app/challenge" className="sidebar-link highlight-link">
            <span className="icon">⚡</span> Challenge Solver
          </NavLink>
        </div>

        {/* Intelligence section */}
        <div className="sidebar-section">
          <p className="sidebar-heading">INTELLIGENCE & REPORTS</p>

          <NavLink to="/app/discoveries" className="sidebar-link">
            <span className="icon">✧</span> Discoveries
          </NavLink>

          <NavLink to="/app/reports" className="sidebar-link">
            <span className="icon">▤</span> Reports & PDFs
          </NavLink>

          <NavLink to="/app/debug" className="sidebar-link">
            <span className="icon">⚙</span> Multi-Language Debug
          </NavLink>

          <NavLink to="/app/agent-network" className="sidebar-link">
  <span>◉</span> Agent Network
</NavLink>

        </div>

        {/* Preferences section */}
        <div className="sidebar-section">
          <p className="sidebar-heading">SYSTEM & PREFERENCES</p>

          <NavLink to="/app/settings" className="sidebar-link">
            <span className="icon">⚙</span> Settings
          </NavLink>
        </div>

        {/* System Status Indicator */}
        <div className="sidebar-section backend-status">
          <p className="sidebar-heading">SWARM TELEMETRY</p>
          <div className="sidebar-link status-row">
            <span
              className="status-dot pulsing"
              style={{ backgroundColor: statusColor }}
            ></span>
            <span>{statusLabel}</span>
          </div>
          <small className="sidebar-telemetry-note">
            Noise Gate: ACTIVE • FDR: Q &lt; 0.01
          </small>
        </div>

        {/* User Card & Back to Website */}
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">AI</div>
            <div>
              <strong>Autonomous Swarm</strong>
              <small>24 Specialized Agents</small>
            </div>
          </div>

          <Link to="/" className="back-home">
            ← Back to Public Portal
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <span className="topbar-title">Autonomous Multi-Agent Investigation System</span>
            <span className="topbar-tag">Enterprise Rigor • 500 MB Capacity</span>
          </div>

          <div className="topbar-right">
            <span className="system-status">
              <span className="status-dot pulsing" style={{ backgroundColor: statusColor }}></span>
              {statusLabel}
            </span>
          </div>
        </header>

        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
