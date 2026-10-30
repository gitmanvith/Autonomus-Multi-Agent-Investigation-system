
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function Workspace() {
  const [investigations, setInvestigations] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem("investigations") || "[]"
    );
    setInvestigations(saved);
  }, []);

  function deleteInvestigation(id) {
    const updated = investigations.filter(
      (item) => item.id !== id
    );

    localStorage.setItem("investigations", JSON.stringify(updated));
    setInvestigations(updated);
  }

  return (
    <section>
      <div className="dashboard-heading heading-with-action">
        <div>
          <span className="hero-label">YOUR WORKSPACE</span>
          <h1>Investigations</h1>
          <p>Manage and review your created investigations.</p>
        </div>

        <Link to="/app/explore" className="primary-button">
          + New Investigation
        </Link>
      </div>

      {investigations.length === 0 ? (
        <div className="empty-state panel">
          <div className="empty-icon">⌕</div>
          <h2>No investigations yet</h2>
          <p>
            Your created investigations will appear here.
          </p>
          <Link to="/app/explore" className="primary-button">
            Start your first investigation
          </Link>
        </div>
      ) : (
        <div className="investigation-list">
          {investigations.map((item) => (
            <article className="investigation-card" key={item.id}>
              <div className="investigation-card-top">
                <span className="status-label">{item.status}</span>
                <span className="date-label">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h3>{item.topic}</h3>
              <p>{item.description || "No additional instructions."}</p>

              <div className="investigation-meta">
                <span>Depth: {item.depth}</span>
                <span>Sources: {item.sources}</span>
              </div>

              <button
                className="text-button delete-button"
                onClick={() => deleteInvestigation(item.id)}
              >
                Delete investigation
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Workspace;
