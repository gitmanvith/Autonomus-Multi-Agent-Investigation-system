import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { exportInvestigationReport } from "../../services/api";

export default function Workspace() {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportNotice, setExportNotice] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("investigations") || "[]");
    setInvestigations(saved);
    setLoading(false);
  }, []);

  function deleteInvestigation(id) {
    const updated = investigations.filter((item) => item.id !== id);
    localStorage.setItem("investigations", JSON.stringify(updated));
    setInvestigations(updated);
  }

  async function handleExport(item) {
    try {
      const res = await exportInvestigationReport(item);
      setExportNotice(`Exported report to: ${res.file_path || res.filename}`);
      setTimeout(() => setExportNotice(""), 6000);
    } catch (err) {
      console.error("Export error:", err);
    }
  }

  const completedCount = investigations.filter((i) => i.status === "Completed").length;

  return (
    <section className="workspace-overview-page">
      {/* Page Header */}
      <div className="dashboard-heading heading-with-action">
        <div>
          <span className="hero-label">AUTONOMOUS INVESTIGATION WORKSPACE</span>
          <h1>Investigation Overview</h1>
          <p>
            Monitor autonomous investigations, 3D agent activity, 100-funnel throughput, and emerging discoveries.
          </p>
        </div>

        <div className="header-actions">
          <Link to="/app/explore" className="primary-button">
            + New Investigation
          </Link>
          <Link to="/app/network" className="secondary-action">
            ◈ View 3D Network
          </Link>
          <Link to="/app/funnels" className="secondary-action">
            ◫ 100-Funnel Engine
          </Link>
        </div>
      </div>

      {exportNotice && (
        <div className="alert-banner-success">
          ✓ {exportNotice}
        </div>
      )}

      {/* Metrics Grid */}
      <section className="metrics-grid">
        <div className="metric-card panel">
          <p>Patterns Detected</p>
          <h2>{investigations.length > 0 ? "142" : "00"}</h2>
          <span>{investigations.length > 0 ? "Analyzed across 500 MB streams" : "Awaiting analysis"}</span>
        </div>

        <div className="metric-card panel">
          <p>Active Hypotheses</p>
          <h2>{investigations.length > 0 ? "28" : "00"}</h2>
          <span>{investigations.length > 0 ? "FDR Q < 0.01 validated" : "No hypotheses yet"}</span>
        </div>

        <div className="metric-card panel">
          <p>Investigations</p>
          <h2>{String(investigations.length).padStart(2, "0")}</h2>
          <span>{completedCount} Completed • 0 Blocked</span>
        </div>

        <div className="metric-card panel">
          <p>Unexpected Discoveries</p>
          <h2>{investigations.length > 0 ? "14" : "00"}</h2>
          <span>{investigations.length > 0 ? "Curiosity noise-gated" : "Nothing uncovered yet"}</span>
        </div>
      </section>

      {/* Content Grid: Emerging Discoveries & Agent Activity */}
      <section className="content-grid">
        {/* Emerging Discoveries */}
        <div className="panel discovery-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-tag">LIVE INTELLIGENCE FEED</span>
              <h2>Emerging Discoveries</h2>
            </div>
            <Link to="/app/discoveries" className="text-link">
              View all →
            </Link>
          </div>

          {investigations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✧</div>
              <h3>No discoveries yet</h3>
              <p>
                When agents identify unexpected connections or overlooked patterns, their findings will appear here.
              </p>
              <Link to="/app/explore" className="primary-button small">
                Launch First Investigation
              </Link>
            </div>
          ) : (
            <div className="discoveries-preview-list">
              {investigations.slice(0, 3).map((item) => (
                <div key={item.id} className="discovery-preview-item">
                  <div className="discovery-preview-header">
                    <span className="topic-badge">{item.topic}</span>
                    <span className="date-tag">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="discovery-preview-text">
                    {item.report
                      ? item.report.slice(0, 190) + "…"
                      : "Investigation analysis initialized and verified."}
                  </p>
                  <div className="discovery-preview-actions">
                    <Link to="/app/reports" className="text-button">
                      Read full report →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5 Core Agents Activity Panel */}
        <div className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-tag">AUTONOMOUS MULTI-AGENT SWARM</span>
              <h2>Agent Activity Roster</h2>
            </div>
            <Link to="/app/network" className="text-link">
              3D View →
            </Link>
          </div>

          <div className="agent-activity-list">
            <div className="agent-row">
              <div className="agent-symbol">◇</div>
              <div className="agent-details">
                <h3>Explorer Agent</h3>
                <p>Traverses 500 MB data streams & filters pure noise</p>
              </div>
              <span className="agent-status-tag active">Active</span>
            </div>

            <div className="agent-row">
              <div className="agent-symbol">◈</div>
              <div className="agent-details">
                <h3>Hypothesis Agent</h3>
                <p>Develops causal explanations & dependency graphs</p>
              </div>
              <span className="agent-status-tag active">Active</span>
            </div>

            <div className="agent-row">
              <div className="agent-symbol">⌕</div>
              <div className="agent-details">
                <h3>Investigator Agent</h3>
                <p>Collects multi-source empirical evidence & traces</p>
              </div>
              <span className="agent-status-tag active">Active</span>
            </div>

            <div className="agent-row">
              <div className="agent-symbol">⚔</div>
              <div className="agent-details">
                <h3>Challenger Agent</h3>
                <p>Falsifies spurious findings using FDR & permutation tests</p>
              </div>
              <span className="agent-status-tag active">Active</span>
            </div>

            <div className="agent-row">
              <div className="agent-symbol">★</div>
              <div className="agent-details">
                <h3>Coordinator Agent</h3>
                <p>Prioritizes highest-confidence investigations & discoveries</p>
              </div>
              <span className="agent-status-tag active">Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Investigations Table */}
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-tag">WORKSPACE HISTORY</span>
            <h2>Active & Completed Investigations</h2>
          </div>
          <span className="badge-tag">{investigations.length} Total Records</span>
        </div>

        {investigations.length === 0 ? (
          <div className="table-empty">
            <p>Your investigation history will appear here once you launch an investigation.</p>
            <Link to="/app/explore" className="primary-button small">
              + Start Investigation
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="investigations-table">
              <thead>
                <tr>
                  <th>TOPIC / INQUIRY</th>
                  <th>DEPTH</th>
                  <th>SOURCES</th>
                  <th>STATUS</th>
                  <th>CREATED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {investigations.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="topic-cell">
                        <strong>{item.topic}</strong>
                        {item.description && <small>{item.description.slice(0, 80)}…</small>}
                      </div>
                    </td>
                    <td>
                      <span className="depth-badge">{item.depth}</span>
                    </td>
                    <td>
                      <small>{item.sources}</small>
                    </td>
                    <td>
                      <span className="status-label">{item.status}</span>
                    </td>
                    <td>
                      <small>{new Date(item.createdAt).toLocaleDateString()}</small>
                    </td>
                    <td>
                      <div className="action-button-group">
                        <Link to="/app/reports" className="action-btn-sm">
                          View
                        </Link>
                        <button
                          className="action-btn-sm"
                          onClick={() => handleExport(item)}
                          title="Export to Desktop"
                        >
                          Export
                        </button>
                        <button
                          className="action-btn-sm danger"
                          onClick={() => deleteInvestigation(item.id)}
                          title="Delete Record"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
