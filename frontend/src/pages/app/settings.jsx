
import { useState } from "react";

function Settings() {
  const [displayName, setDisplayName] = useState(
    localStorage.getItem("displayName") || "Investigator"
  );

  const [email, setEmail] = useState(
    localStorage.getItem("displayEmail") || ""
  );

  const [saved, setSaved] = useState(false);

  function handleSave(event) {
    event.preventDefault();

    localStorage.setItem("displayName", displayName);
    localStorage.setItem("displayEmail", email);

    setSaved(true);
  }

  function clearInvestigations() {
    const confirmed = window.confirm(
      "Are you sure you want to delete all saved investigations from this browser?"
    );

    if (confirmed) {
      localStorage.removeItem("investigations");
      window.location.reload();
    }
  }

  return (
    <section>
      <div className="dashboard-heading">
        <span className="hero-label">PREFERENCES</span>
        <h1>Settings</h1>
        <p>Manage your local workspace preferences.</p>
      </div>

      <div className="panel settings-panel">
        <h2>Profile information</h2>

        <form className="investigation-form" onSubmit={handleSave}>
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value);
              setSaved(false);
            }}
          />

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setSaved(false);
            }}
          />

          <button type="submit" className="primary-button">
            Save Preferences
          </button>

          {saved && (
            <p className="success-message">
              Your preferences have been saved.
            </p>
          )}
        </form>
      </div>

      <div className="panel danger-panel">
        <h2>Workspace data</h2>
        <p>
          Delete all investigation requests saved in this browser.
          This action cannot be undone.
        </p>

        <button
          className="danger-button"
          onClick={clearInvestigations}
        >
          Clear all investigations
        </button>
      </div>
    </section>
  );
}

export default Settings;
