
import { useEffect, useState } from "react";

function Discoveries() {
  const [investigations, setInvestigations] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem("investigations") || "[]"
    );
    setInvestigations(saved);
  }, []);

  return (
    <section>
      <div className="dashboard-heading">
        <span className="hero-label">RESEARCH OUTPUT</span>
        <h1>Discoveries</h1>
        <p>
          Review findings and insights produced during investigations.
        </p>
      </div>

      {investigations.length === 0 ? (
        <div className="empty-state panel">
          <div className="empty-icon">✧</div>
          <h2>No discoveries available</h2>
          <p>
            Create an investigation first. Findings will appear here
            when the investigation backend is connected.
          </p>
        </div>
      ) : (
        <div className="panel">
          <h2>Investigation topics</h2>
          <p className="muted-text">
            These are saved investigation requests, not verified findings.
          </p>

          {investigations.map((item) => (
            <div className="discovery-row" key={item.id}>
              <div>
                <h3>{item.topic}</h3>
                <p>{item.description || "No additional instructions."}</p>
              </div>
              <span className="status-label">Awaiting analysis</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Discoveries;
