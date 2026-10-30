
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Explore() {
  const navigate = useNavigate();

  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [depth, setDepth] = useState("Standard");
  const [sources, setSources] = useState("All available sources");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!topic.trim()) {
      setError("Please enter an investigation topic.");
      return;
    }

    const investigation = {
      id: Date.now(),
      topic: topic.trim(),
      description: description.trim(),
      depth,
      sources,
      status: "Created",
      createdAt: new Date().toISOString()
    };

    const existing = JSON.parse(
      localStorage.getItem("investigations") || "[]"
    );

    localStorage.setItem(
      "investigations",
      JSON.stringify([investigation, ...existing])
    );

    navigate("/app/workspace");
  }

  return (
    <section>
      <div className="dashboard-heading">
        <span className="hero-label">INVESTIGATION CENTER</span>
        <h1>Start an investigation</h1>
        <p>
          Define a research question and configure how you want
          the investigation to be organized.
        </p>
      </div>

      <div className="panel explore-panel">
        <form onSubmit={handleSubmit} className="investigation-form">
          <label htmlFor="topic">Investigation topic</label>
          <input
            id="topic"
            type="text"
            placeholder="e.g. Analyze the impact of AI on cybersecurity"
            value={topic}
            onChange={(event) => {
              setTopic(event.target.value);
              setError("");
            }}
          />

          <label htmlFor="description">Research question / instructions</label>
          <textarea
            id="description"
            rows="5"
            placeholder="Describe what you want to investigate..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <div className="form-row">
            <div>
              <label htmlFor="depth">Investigation depth</label>
              <select
                id="depth"
                value={depth}
                onChange={(event) => setDepth(event.target.value)}
              >
                <option>Quick</option>
                <option>Standard</option>
                <option>Deep</option>
              </select>
            </div>

            <div>
              <label htmlFor="sources">Information sources</label>
              <select
                id="sources"
                value={sources}
                onChange={(event) => setSources(event.target.value)}
              >
                <option>All available sources</option>
                <option>Web sources</option>
                <option>Uploaded documents</option>
                <option>Custom sources</option>
              </select>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="primary-button">
            Create Investigation →
          </button>
        </form>
      </div>

      <div className="notice-panel">
        <strong>Preview mode</strong>
        <p>
          Your investigation is currently saved in this browser.
          Connect the Python backend to start actual agent execution.
        </p>
      </div>
    </section>
  );
}

export default Explore;
