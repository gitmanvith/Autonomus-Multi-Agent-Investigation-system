
import { useEffect, useState } from "react";

function Reports() {
  const [investigations, setInvestigations] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem("investigations") || "[]"
    );
    setInvestigations(saved);
  }, []);

  function downloadReport(item) {
    const report = `
AUTONOMOUS INVESTIGATION
========================

Topic: ${item.topic}

Instructions:
${item.description || "None provided"}

Investigation depth: ${item.depth}
Information sources: ${item.sources}

Status: ${item.status}

Created: ${new Date(item.createdAt).toLocaleString()}

NOTE:
This is a summary of the submitted investigation request.
It is not an AI-generated research report.
`;

    const blob = new Blob([report], {
      type: "text/plain"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `investigation-${item.id}.txt`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <section>
      <div className="dashboard-heading">
        <span className="hero-label">DOCUMENTATION</span>
        <h1>Reports</h1>
        <p>View and export your investigation request summaries.</p>
      </div>

      {investigations.length === 0 ? (
        <div className="empty-state panel">
          <div className="empty-icon">▤</div>
          <h2>No reports available</h2>
          <p>
            Your report summaries will appear here after you create
            investigations.
          </p>
        </div>
      ) : (
        <div className="report-list">
          {investigations.map((item) => (
            <article className="report-card" key={item.id}>
              <div>
                <h3>{item.topic}</h3>
                <p>
                  Created {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>

              <button
                className="secondary-action"
                onClick={() => downloadReport(item)}
              >
                ↓ Export summary
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Reports;
