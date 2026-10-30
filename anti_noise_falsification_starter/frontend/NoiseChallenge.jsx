import { useState } from "react";
import "./noise-challenge.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const example = {
  discovery_data: {
    signal_a: Array.from({ length: 40 }, (_, i) => i + 1),
    signal_b: Array.from({ length: 40 }, (_, i) => 2 * (i + 1) + (i % 5) - 2),
    noise: [13,4,19,2,17,8,11,5,20,1,14,7,18,3,12,9,16,6,15,10,4,17,2,13,8,19,5,14,1,11,7,20,3,16,9,18,6,12,10,15]
  },
  hypotheses: [{ x: "signal_a", y: "signal_b" }, { x: "signal_a", y: "noise" }],
  replication_data: {
    signal_a: Array.from({ length: 20 }, (_, i) => i + 41),
    signal_b: Array.from({ length: 20 }, (_, i) => 2 * (i + 41) + ((i + 2) % 5) - 2),
    noise: [7,19,3,15,9,1,17,5,13,20,2,16,8,12,4,18,6,14,10,11]
  },
  alpha: 0.05, permutations: 999, seed: 17, holdout_fraction: 0.3
};

export default function NoiseChallenge() {
  const [json, setJson] = useState(JSON.stringify(example, null, 2));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function runChallenge() {
    setError(""); setResult(null);
    let payload;
    try { payload = JSON.parse(json); }
    catch { setError("The editor contains invalid JSON."); return; }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/noise-challenge/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || "Evaluation failed");
      setResult(body);
    } catch (err) {
      setError(`${err.message}. Confirm that FastAPI is running and VITE_API_BASE_URL is correct.`);
    } finally { setLoading(false); }
  }

  return (
    <main className="noise-page">
      <header className="noise-header">
        <div>
          <p className="noise-eyebrow">ANTI-FALSE-DISCOVERY SYSTEM</p>
          <h1>Challenge a Discovery</h1>
          <p>Try to disprove surprising patterns before accepting them as discoveries.</p>
        </div>
        <span className="noise-pill">THREE FALSIFICATION MOMENTS</span>
      </header>

      <section className="noise-explainer">
        <article><b>01 · Could it be chance?</b><span>Permutation testing and correction for multiple hypotheses.</span></article>
        <article><b>02 · Does it generalise?</b><span>Test the finding on a holdout set not used for discovery.</span></article>
        <article><b>03 · Can it be replicated?</b><span>Require a separate, independent replication dataset.</span></article>
      </section>

      <section className="noise-editor">
        <div className="noise-editor-top">
          <div><h2>Evaluation input</h2><p>Edit this JSON to use your own numeric data.</p></div>
          <button onClick={() => setJson(JSON.stringify(example, null, 2))}>Reset example</button>
        </div>
        <textarea spellCheck="false" value={json} onChange={e => setJson(e.target.value)} />
        <button className="noise-run" disabled={loading} onClick={runChallenge}>
          {loading ? "Testing hypotheses..." : "Run three falsification tests"}
        </button>
        {error && <p className="noise-error">{error}</p>}
      </section>

      {result && <section className="noise-results">
        <h2>Evaluation results</h2>
        <div className="noise-summary">
          <div><span>Tested</span><strong>{result.summary.hypotheses_tested}</strong></div>
          <div><span>Validated</span><strong>{result.summary.validated}</strong></div>
          <div><span>Need replication</span><strong>{result.summary.needs_independent_replication}</strong></div>
          <div><span>Not supported</span><strong>{result.summary.rejected_or_not_supported}</strong></div>
        </div>
        {result.results.map((item, index) => <article className="noise-result-card" key={index}>
          <div className="noise-result-title">
            <h3>{item.hypothesis.x} ↔ {item.hypothesis.y}</h3>
            <span className={`noise-verdict ${item.verdict}`}>{item.verdict.replaceAll("_", " ")}</span>
          </div>
          {[item.moment_1, item.moment_2, item.moment_3].map((moment, i) => <div className="noise-moment" key={moment.name}>
            <div><b>Moment {i + 1}: {moment.name}</b><span className={`noise-status ${moment.status}`}>{moment.status}</span></div>
            {i === 0 && <small>Raw p={moment.raw_p_value.toFixed(4)} · BH adjusted p={moment.adjusted_p_value_bh.toFixed(4)}</small>}
            {i > 0 && moment.result?.correlation !== undefined && <small>Correlation={moment.result.correlation.toFixed(3)} · p={moment.result.permutation_p.toFixed(4)}</small>}
            {moment.result?.error && <small>{moment.result.error}</small>}
            {moment.status === "not_run" && <small>Supply independent replication data to complete this stage.</small>}
          </div>)}
        </article>)}
        <p className="noise-disclaimer">{result.important_note}</p>
      </section>}
    </main>
  );
}
