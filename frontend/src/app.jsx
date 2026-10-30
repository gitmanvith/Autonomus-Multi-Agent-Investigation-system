
import "./App.css";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">AI</div>
        <div>
          <h2>INVESTIGATE</h2>
          <p>Autonomous Intelligence</p>
        </div>
      </div>

      <div className="nav-label">WORKSPACE</div>

      <nav className="navigation">
        <a className="nav-item active" href="#overview">
          <span>◫</span> Overview
        </a>
        <a className="nav-item" href="#agents">
          <span>◈</span> Agents
        </a>
        <a className="nav-item" href="#hypotheses">
          <span>◇</span> Hypotheses
        </a>
        <a className="nav-item" href="#investigations">
          <span>⌕</span> Investigations
        </a>
        <a className="nav-item" href="#evidence">
          <span>▤</span> Evidence
        </a>
        <a className="nav-item" href="#discoveries">
          <span>✧</span> Discoveries
        </a>
      </nav>

      <div className="sidebar-bottom">
        <div className="system-status">
          <span className="status-dot"></span>
          System initialized
        </div>
        <p>Autonomous Investigation System</p>
        <small>Version 0.1.0</small>
      </div>
    </aside>
  );
}

function Overview() {
  return (
    <main className="main-content" id="overview">
      <header className="topbar">
        <div className="breadcrumb">
          Workspace <span>/</span> Overview
        </div>
        <div className="user-area">
          <span className="live-indicator"></span>
          Prototype environment
          <div className="avatar">U</div>
        </div>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">INVESTIGATION WORKSPACE</p>
          <h1>Overview</h1>
          <p className="subtitle">
            Monitor autonomous investigations, agent activity and emerging discoveries.
          </p>
        </div>
        <button className="primary-button">+ New Investigation</button>
      </section>

      <section className="metrics-grid">
        <Metric title="Patterns Detected" value="00" note="Awaiting analysis" />
        <Metric title="Active Hypotheses" value="00" note="No hypotheses yet" />
        <Metric title="Investigations" value="00" note="No active investigations" />
        <Metric title="Unexpected Discoveries" value="00" note="Nothing uncovered yet" />
      </section>

      <section className="content-grid">
        <div className="panel discovery-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">SYSTEM INTELLIGENCE</p>
              <h2>Emerging Discoveries</h2>
            </div>
            <span className="panel-tag">LIVE FEED</span>
          </div>

          <div className="empty-state">
            <div className="empty-icon">✧</div>
            <h3>No discoveries yet</h3>
            <p>
              When agents identify unexpected connections or overlooked
              patterns, their findings will appear here.
            </p>
          </div>
        </div>

        <div className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">AUTONOMOUS SYSTEM</p>
              <h2>Agent Activity</h2>
            </div>
            <span className="panel-tag">05 AGENTS</span>
          </div>

          <Agent name="Explorer Agent" role="Identifies unusual patterns" />
          <Agent name="Hypothesis Agent" role="Develops possible explanations" />
          <Agent name="Investigator Agent" role="Collects supporting evidence" />
          <Agent name="Challenger Agent" role="Tests and challenges hypotheses" />
          <Agent name="Coordinator Agent" role="Prioritizes investigations" />
        </div>
      </section>

      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">WORKSPACE HISTORY</p>
            <h2>Recent Investigations</h2>
          </div>
          <span className="panel-tag">RECENT</span>
        </div>

        <div className="table-header">
          <span>INVESTIGATION</span>
          <span>STATUS</span>
          <span>LAST UPDATED</span>
        </div>

        <div className="table-empty">
          Your investigation history will appear here.
        </div>
      </section>
    </main>
  );
}

function Metric({ title, value, note }) {
  return (
    <div className="metric-card">
      <p>{title}</p>
      <h2>{value}</h2>
      <span>{note}</span>
    </div>
  );
}

function Agent({ name, role }) {
  return (
    <div className="agent-row">
      <div className="agent-symbol">◇</div>
      <div className="agent-details">
        <h3>{name}</h3>
        <p>{role}</p>
      </div>
      <span className="agent-status">Idle</span>
    </div>
  );
}

function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <Overview />
    </div>
  );
}

export default App;
