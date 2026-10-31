import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Discoveries() {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("investigations") || "[]");
    const withReports = saved.filter((item) => item.report && item.report.trim());
    setInvestigations(withReports);
    setLoading(false);
  }, []);

  return (
    <section>
      <div className="dashboard-heading">
        <span className="hero-label">DISCOVERIES</span>
        <h1>AI Discoveries</h1>
        <p>
          Highlights and key findings surfaced by the autonomous investigation
          agents across your completed research.
        </p>
      </div>

      {loading ? (
        <div className="empty-state panel">
          <div className="empty-icon">⟳</div>
          <h2>Loading discoveries…</h2>
        </div>
      ) : investigations.length === 0 ? (
        <div className="empty-state panel">
          <div className="empty-icon">✧</div>
          <h2>No discoveries yet</h2>
          <p>
            Complete an investigation to generate AI-powered discoveries and
            insights.
          </p>
        </div>
      ) : (
        <div className="discoveries-grid">
          {investigations.map((item) => (
            <article className="discovery-card" key={item.id}>
              <div className="discovery-header">
                <span className="topic-badge">{item.topic}</span>
                <span className="date-label">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="discovery-content">
                {item.report ? (
                  <p className="discovery-excerpt">
                    {item.report.slice(0, 300)}…
                  </p>
                ) : (
                  <p className="discovery-excerpt">No report content available.</p>
                )}
              </div>

              {item.feedback && (
                <div className="discovery-feedback">
                  <strong>Critic Score:</strong>{" "}
                  {item.feedback.match(/Score:\s*(\d+)/)?.[1] || "N/A"}/10
                </div>
              )}

              <div className="discovery-actions">
                <Link to="/app/reports" className="secondary-action">
                  View Full Report →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Discoveries;
