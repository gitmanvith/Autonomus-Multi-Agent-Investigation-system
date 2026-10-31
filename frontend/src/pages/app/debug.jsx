import { useState, useEffect } from "react";
import {
  uploadDebugFiles,
  debugSession,
  getSupportedLanguages,
  cleanupDebugSession,
} from "../../services/api";

const SAMPLE_BUGGY_FILES = [
  {
    name: "worker_pool_deadlock.py",
    content: `def acquire_lease(worker_id, lock_ttl=30):\n    # Bug: Unhandled zero lease duration\n    if lock_ttl <= 0:\n        raise ValueError("Invalid lock TTL")\n    lease_ratio = 100 / lock_ttl\n    print(f"Worker {worker_id} acquired lease: ratio={lease_ratio}")\n\n# Buggy call\nacquire_lease("worker-01", lock_ttl=0)\n`,
    type: "text/x-python",
  },
  {
    name: "async_promise_leak.js",
    content: `async function fetchTelemetry(endpoint) {\n  // Bug: Missing catch and unhandled null response\n  const res = await fetch(endpoint);\n  const data = await res.json();\n  return data.items.map(item => item.id);\n}\n\nfetchTelemetry(null);\n`,
    type: "application/javascript",
  },
  {
    name: "incident_architecture_audit.pdf",
    content: `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 320 >>
stream
BT
/F1 12 Tf
50 720 Td
(INCIDENT POSTMORTEM & ARCHITECTURE AUDIT: Auth Service Outage) Tj
0 -22 Td
(Severity: CRITICAL - Systemic Connection Exhaustion) Tj
0 -20 Td
(Error 500: Database connection pool exhausted at AuthGateway.java line 142) Tj
0 -20 Td
(Vulnerability: JWT secret key hardcoded in config.json with zero entropy) Tj
0 -20 Td
(Deadlock: Worker pool lease timeout <= 0 causing cascading starvation) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000615 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
694
%%EOF
`,
    type: "application/pdf",
  },
];

const DEBUG_STAGES_PROGRESS = [
  { stage: 1, name: "Sandbox Runtime Execution & Traceback Capture", agent: "Executor & AST Inspector" },
  { stage: 2, name: "Multi-Agent Code Analysis & Bug Hunter Swarm", agent: "Investigator & Code Analysis Agent" },
  { stage: 3, name: "Adversarial Challenger & Hypothesis Falsification", agent: "Challenger & Fact-Checker" },
  { stage: 4, name: "Cross-File Relationship Mapping & Executive Synthesis", agent: "Relationship Discovery Agent" },
];

function Debug() {
  const [sessionId, setSessionId] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [debugResult, setDebugResult] = useState(null);
  const [languages, setLanguages] = useState({});
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debugLoading, setDebugLoading] = useState(false);
  const [currentProgressStep, setCurrentProgressStep] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeStep, setActiveStep] = useState("upload");
  const [expandedFileIdx, setExpandedFileIdx] = useState(null);

  useEffect(() => {
    getSupportedLanguages()
      .then((data) => setLanguages(data.languages || {}))
      .catch((err) => console.error("Failed to load languages:", err));
  }, []);

  // Cycle progress steps while debugging
  useEffect(() => {
    let interval;
    if (debugLoading) {
      setCurrentProgressStep(0);
      interval = setInterval(() => {
        setCurrentProgressStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [debugLoading]);

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files));
  };

  const loadSampleFile = (sample) => {
    const blob = new Blob([sample.content], { type: sample.type });
    const file = new File([blob], sample.name, { type: sample.type });
    setFiles([file]);
    setError("");
    setSuccess(`Loaded sample: ${sample.name}`);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      setError("Please select at least one file.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await uploadDebugFiles(files);
      setSessionId(result.session_id);
      setUploadResult(result);
      setSuccess(`Uploaded ${result.files.length} file(s). Session: ${result.session_id}`);
      setActiveStep("debug");
    } catch (err) {
      setError(err.message || "Upload failed. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleDebug = async () => {
    if (!sessionId) {
      setError("No session ID. Please upload files first.");
      return;
    }

    setDebugLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await debugSession(sessionId, true);
      setDebugResult(result);
      setSuccess(`Successfully debugged ${result.total_files} file(s) across 9 specialized agent stages.`);
      setActiveStep("results");
    } catch (err) {
      setError(err.message || "Debug failed. Please check network connection.");
    } finally {
      setDebugLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!sessionId) return;
    try {
      await cleanupDebugSession(sessionId);
      setSuccess("Session cleaned up.");
      setSessionId("");
      setUploadResult(null);
      setDebugResult(null);
      setActiveStep("upload");
    } catch (err) {
      setError(err.message || "Cleanup failed.");
    }
  };

  const totalIssues =
    debugResult?.file_results?.reduce(
      (acc, file) =>
        acc +
        Object.values(file.stage_results || {}).filter(
          (s) => s.status === "success"
        ).length,
      0
    ) || 0;

  return (
    <section className="debug-section">
      {activeStep === "upload" && (
        <div className="debug-upload-panel panel">
          <div className="dashboard-heading">
            <span className="hero-label">MULTI-LANGUAGE CODE & SPEC DEBUGGER</span>
            <h1>Upload Files &amp; PDFs for Multi-Agent Debugging</h1>
            <p>
              Upload up to 10 source code files or PDF documents (max 500 MB total). The autonomous 24-agent swarm will execute sandbox runtime analysis, extract structured PDF text streams, inspect AST syntax, formulate falsifiable hypotheses, and synthesize fixes.
            </p>
          </div>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <form onSubmit={handleUpload} className="debug-upload-form">
            <label htmlFor="debug-files">Select Code Files or PDF Documents (.pdf)</label>
            <input
              id="debug-files"
              type="file"
              multiple
              accept=".pdf,.py,.js,.ts,.java,.cpp,.c,.cs,.go,.rs,.php,.rb,.swift,.sh,.sql,.html,.css,.json,.yaml,.yml,.toml,.xml,.log,.txt"
              onChange={handleFileChange}
            />

            <p className="upload-hint">
              Supported: PDF Documents (.pdf), Python, JavaScript, TypeScript, Java, C, C++, C#, Go, Rust, PHP, Ruby, Swift, Shell, SQL, JSON, YAML, Logs, and more. Max 10 files, 500 MB total.
            </p>

            {/* Quick Sample Files Button */}
            <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Or load a sample buggy file / PDF:</span>
              {SAMPLE_BUGGY_FILES.map((sample) => (
                <button
                  key={sample.name}
                  type="button"
                  className="quick-topic-btn"
                  onClick={() => loadSampleFile(sample)}
                >
                  {sample.name.endsWith(".pdf") ? "📄" : "⚡"} {sample.name}
                </button>
              ))}
            </div>

            {files.length > 0 && (
              <div className="selected-files" style={{ marginTop: "16px" }}>
                <strong>Selected file(s):</strong>
                <ul>
                  {files.map((f) => (
                    <li key={f.name}>
                      {f.name.endsWith(".pdf") ? "📄 " : "💻 "}
                      {f.name} ({((f.size / 1024 / 1024).toFixed(3))} MB)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={loading || !files?.length}
              style={{ marginTop: "18px" }}
            >
              {loading ? "Uploading…" : "Upload & Prepare Debug Session →"}
            </button>
          </form>
        </div>
      )}

      {activeStep === "debug" && (
        <div className="debug-session-panel panel">
          <div className="dashboard-heading">
            <span className="hero-label">MULTI-AGENT DEBUG SWARM</span>
            <h1>Session Ready for Analysis</h1>
            <p>
              Files uploaded to secure sandbox. Launch the 24-agent debugging swarm to analyze syntax, runtime traces, logic errors, and security vulnerabilities.
            </p>
          </div>

          <div className="session-info">
            <p><strong>Session ID:</strong> <code>{sessionId}</code></p>
            <p><strong>Files Staged:</strong> {uploadResult?.files?.length || files.length || 1}</p>
            <p><strong>Analysis Mode:</strong> Multi-Agent Swarm (Code Sandbox + PDF Forensic Parsing)</p>
          </div>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          {/* Stepper while debugging */}
          {debugLoading && (
            <div className="agent-progress-box" style={{ margin: "20px 0" }}>
              <div className="progress-header">
                <span className="pulsing-badge">
                  <span className="status-dot pulsing" style={{ background: "#0284c7" }}></span>
                  24-Agent Swarm Debugging Active…
                </span>
                <span className="step-count">Stage {currentProgressStep + 1} of 4</span>
              </div>

              <div className="stepper-stages-list">
                {DEBUG_STAGES_PROGRESS.map((st, idx) => {
                  const isDone = idx < currentProgressStep;
                  const isCurrent = idx === currentProgressStep;
                  return (
                    <div
                      key={st.stage}
                      className={`stepper-item ${isCurrent ? "current" : ""} ${isDone ? "done" : ""}`}
                    >
                      <div className="step-marker">{isDone ? "✓" : st.stage}</div>
                      <div className="step-info">
                        <strong>{st.name}</strong>
                        <span>{st.agent}</span>
                      </div>
                      {isCurrent && <span className="running-indicator">Analyzing…</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <button
              onClick={handleDebug}
              className="primary-button"
              disabled={debugLoading}
            >
              {debugLoading ? "Swarm Analyzing Code & Documents…" : "Run Multi-Agent Debug →"}
            </button>

            <button
              onClick={() => setActiveStep("upload")}
              className="secondary-action"
              disabled={debugLoading}
            >
              ← Upload different files
            </button>
          </div>
        </div>
      )}

      {activeStep === "results" && debugResult && (
        <div className="debug-results-panel panel">
          <div className="dashboard-heading heading-with-action">
            <div>
              <span className="hero-label">MULTI-AGENT FORENSICS REPORT</span>
              <h1>Multi-Agent Analysis Complete</h1>
              <p>
                Comprehensive report generated across {debugResult.file_results?.length || 1} file(s) and {debugResult.languages_detected?.length || 1} document/language type(s).
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => window.print()} className="secondary-action">
                🖨 Print / PDF
              </button>
              <button onClick={handleCleanup} className="danger-button">
                Clean Up Session
              </button>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <div className="debug-summary-grid">
            <div className="stat-card">
              <span className="stat-value">{debugResult.total_files}</span>
              <span className="stat-label">Files Debugged</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{debugResult.languages_detected?.length || 1}</span>
              <span className="stat-label">Languages / Formats</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{totalIssues}</span>
              <span className="stat-label">Stages Passed</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">9 / 9</span>
              <span className="stat-label">Agent Coverage</span>
            </div>
          </div>

          <div className="debug-files-list">
            <h3>Individual File Forensics &amp; Agent Findings</h3>
            {debugResult.file_results?.map((file, idx) => {
              const isExpanded = expandedFileIdx === idx;
              const isPdf = file.language === "pdf" || file.filename?.endsWith(".pdf");
              return (
                <div key={idx} className="file-result-card">
                  <div className="file-header">
                    <span className="file-name">
                      {isPdf ? "📄 " : "💻 "}
                      {file.filename}
                    </span>
                    <span
                      className="file-language"
                      style={
                        isPdf
                          ? { background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", fontWeight: 700 }
                          : {}
                      }
                    >
                      {isPdf ? "PDF Document" : file.language}
                    </span>
                  </div>

                  {file.runtime_errors && (
                    <div className="runtime-error">
                      <strong>Sandbox Runtime Exception Captured:</strong>
                      <pre style={{ margin: "6px 0 0 0", color: "inherit", fontFamily: "inherit" }}>
                        {file.runtime_errors}
                      </pre>
                    </div>
                  )}

                  <div className="file-stages">
                    {Object.entries(file.stage_results || {}).map(([stageName, stage]) => (
                      <div key={stageName} className="stage-badge">
                        <span className={stage.status === "success" ? "stage-success" : "stage-error"}>
                          {stage.status === "success" ? "✓" : "✗"}
                        </span>
                        {stageName.replace("_", " ")}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    <button
                      className="secondary-action"
                      style={{ padding: "6px 14px", fontSize: "12px" }}
                      onClick={() => setExpandedFileIdx(isExpanded ? null : idx)}
                    >
                      {isExpanded ? "▲ Collapse Dossier" : "▼ View Deep Agent Report & Remediation Patches"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="debug-report-drawer">
                      <pre>{file.final_report}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="debug-cross-file">
            <h3>Cross-File Architecture &amp; Dependency Analysis</h3>
            <div className="panel">
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.6 }}>
                {debugResult.cross_file_analysis}
              </pre>
            </div>
          </div>

          <div className="debug-executive">
            <h3>Executive Summary Briefing</h3>
            <div className="panel">
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.6 }}>
                {debugResult.executive_summary}
              </pre>
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <button
              onClick={() => {
                setActiveStep("upload");
                setFiles([]);
                setUploadResult(null);
                setDebugResult(null);
              }}
              className="primary-button"
            >
              ← Start New Debug Session
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default Debug;