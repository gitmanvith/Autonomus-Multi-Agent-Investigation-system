
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const ALLOWED_EXTENSIONS = [
  "pdf", "doc", "docx",
  "xls", "xlsx", "csv",
  "ppt", "pptx",
  "txt", "json", "log", "zip",
  "py", "js", "jsx", "ts", "tsx",
  "java", "c", "cpp", "h", "cs",
  "go", "rs", "sql", "sh", "ipynb",
  "html", "css", "md", "xml", "yaml", "yml"
];

const ACCEPTED_FILES = ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(",");

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;
const MAX_FILES = 100;

function formatSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function Explore() {
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [depth, setDepth] = useState("Standard");
  const [sources, setSources] = useState("All available sources");

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  function addFiles(fileList) {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    const errors = [];
    const validFiles = [];

    incoming.forEach(file => {
      const extension = file.name.split(".").pop().toLowerCase();

      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        errors.push(`${file.name}: unsupported file type.`);
      } else if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: exceeds 20 MB.`);
      } else {
        validFiles.push(file);
      }
    });

    setSelectedFiles(previous => {
      const combined = [...previous];

      validFiles.forEach(file => {
        const path = file.webkitRelativePath || file.name;

        const duplicate = combined.some(existing =>
          (existing.webkitRelativePath || existing.name) === path &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified
        );

        if (!duplicate) combined.push(file);
      });

      if (combined.length > MAX_FILES) {
        errors.push(`Maximum ${MAX_FILES} files allowed.`);
        return combined.slice(0, MAX_FILES);
      }

      const totalSize = combined.reduce(
        (sum, file) => sum + file.size, 0
      );

      if (totalSize > MAX_TOTAL_SIZE) {
        errors.push("Total file size cannot exceed 100 MB.");
        return previous;
      }

      return combined;
    });

    setError(errors.join(" "));
    setUploadModalOpen(false);
  }

  function removeFile(index) {
    setSelectedFiles(previous =>
      previous.filter((_, i) => i !== index)
    );
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!topic.trim()) {
      setError("Please enter an investigation topic.");
      return;
    }

    try {
      const existing = JSON.parse(
        localStorage.getItem("investigations") || "[]"
      );

      const investigation = {
        id: crypto.randomUUID(),
        topic: topic.trim(),
        description: description.trim(),
        depth,
        sources,
        status: "Created",
        createdAt: new Date().toISOString(),
        documents: selectedFiles.map(file => ({
          name: file.name,
          path: file.webkitRelativePath || file.name,
          size: file.size,
          type: file.type || "unknown",
          uploadStatus: "Pending backend upload"
        }))
      };

      localStorage.setItem(
        "investigations",
        JSON.stringify([investigation, ...existing])
      );

      navigate("/app/workspace");
    } catch {
      setError("Could not save the investigation. Please try again.");
    }
  }

  const totalSize = selectedFiles.reduce(
    (sum, file) => sum + file.size, 0
  );

  return (
    <section className="explore-page">

      <div className="dashboard-heading explore-heading">
        <span className="hero-label">INVESTIGATION CENTER</span>
        <h1>Investigation workspace</h1>
        <p>
          Define your research question, provide source material,
          and prepare your multi-agent investigation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="explore-workspace">

        {/* LEFT: INVESTIGATION SETUP */}
        <div className="explore-main-column">

          <div className="explore-card">
            <div className="explore-card-heading">
              <div>
                <span className="section-eyebrow">01 / DEFINE</span>
                <h2>Investigation setup</h2>
                <p>Tell the agents what they need to discover.</p>
              </div>
              <span className="step-number">01</span>
            </div>

            <label htmlFor="topic">Investigation topic</label>
            <input
              id="topic"
              type="text"
              placeholder="e.g. Discover hidden relationships in financial transactions"
              value={topic}
              onChange={e => {
                setTopic(e.target.value);
                setError("");
              }}
            />

            <label htmlFor="description">
              Research question and instructions
            </label>
            <textarea
              id="description"
              rows="5"
              placeholder="Describe the problem, what you already know, and what you want the agents to verify..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />

            <div className="form-row explore-form-row">
              <div>
                <label htmlFor="depth">Investigation depth</label>
                <select
                  id="depth"
                  value={depth}
                  onChange={e => setDepth(e.target.value)}
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
                  onChange={e => setSources(e.target.value)}
                >
                  <option>All available sources</option>
                  <option>Web sources</option>
                  <option>Uploaded documents</option>
                  <option>Custom sources</option>
                </select>
              </div>
            </div>
          </div>

          {/* DOCUMENTS AND CODE */}
          <div className="explore-card">
            <div className="explore-card-heading">
              <div>
                <span className="section-eyebrow">02 / SOURCE MATERIAL</span>
                <h2>Documents and code</h2>
                <p>
                  Add reports, datasets, presentations, source code,
                  or an entire project folder.
                </p>
              </div>
              <span className="step-number">02</span>
            </div>

            <div
              className={`explore-upload-zone ${dragging ? "is-dragging" : ""}`}
              onDragOver={e => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setDragging(false);
                }
              }}
              onDrop={handleDrop}
            >
              <div className="upload-symbol">↑</div>
              <h3>Drop your files here</h3>
              <p>Drag files or folders into this area to add them.</p>

              <button
                type="button"
                className="secondary-action"
                onClick={() => setUploadModalOpen(true)}
              >
                + Add documents or code
              </button>

              <small>
                PDF, DOCX, XLSX, PPTX, CSV, JSON, ZIP, PY, JS, JSX,
                TS, JAVA, SQL and more
              </small>
              <small>
                20 MB per file · 100 MB total · Up to 100 files
              </small>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              accept={ACCEPTED_FILES}
              onChange={e => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <input
              ref={folderInputRef}
              type="file"
              multiple
              hidden
              webkitdirectory=""
              onChange={e => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />

            {selectedFiles.length > 0 && (
              <div className="explore-file-list">
                <div className="selected-files-heading">
                  <h3>Attached source material</h3>
                  <span>
                    {selectedFiles.length} files · {formatSize(totalSize)}
                  </span>
                </div>

                {selectedFiles.map((file, index) => (
                  <div
                    className="explore-file-item"
                    key={`${file.name}-${index}`}
                  >
                    <div className="explore-file-icon">▤</div>
                    <div className="explore-file-info">
                      <strong>{file.name}</strong>
                      <small>
                        {file.webkitRelativePath || file.name}
                      </small>
                      <small>{formatSize(file.size)}</small>
                    </div>
                    <button
                      type="button"
                      className="remove-file"
                      onClick={() => removeFile(index)}
                      aria-label={`Remove ${file.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="text-button delete-button"
                  onClick={() => setSelectedFiles([])}
                >
                  Remove all files
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="error-message" role="alert">{error}</p>
          )}

          <div className="explore-submit-row">
            <div>
              <strong>Ready to investigate?</strong>
              <p>Your investigation settings will be saved.</p>
            </div>
            <button type="submit" className="primary-button">
              Create investigation →
            </button>
          </div>
        </div>

        {/* RIGHT: AGENT ACTIVITY / OUTPUT PREVIEW */}
        <aside className="explore-side-column">

          <div className="explore-card agent-preview-card">
            <div className="explore-card-heading">
              <div>
                <span className="section-eyebrow">03 / AGENT SYSTEM</span>
                <h2>Investigation pipeline</h2>
                <p>Your investigation team at a glance.</p>
              </div>
              <span className="agent-status-dot" />
            </div>

            <div className="agent-preview-list">
              <div className="agent-preview-item">
                <span className="agent-avatar">EX</span>
                <div>
                  <strong>Explorer</strong>
                  <small>Finds patterns and unusual signals</small>
                </div>
                <span className="agent-idle">Ready</span>
              </div>

              <div className="agent-preview-item">
                <span className="agent-avatar">HY</span>
                <div>
                  <strong>Hypothesis</strong>
                  <small>Develops possible explanations</small>
                </div>
                <span className="agent-idle">Ready</span>
              </div>

              <div className="agent-preview-item">
                <span className="agent-avatar">IN</span>
                <div>
                  <strong>Investigator</strong>
                  <small>Collects and checks evidence</small>
                </div>
                <span className="agent-idle">Ready</span>
              </div>

              <div className="agent-preview-item">
                <span className="agent-avatar">CH</span>
                <div>
                  <strong>Challenger</strong>
                  <small>Attempts to disprove findings</small>
                </div>
                <span className="agent-idle">Ready</span>
              </div>

              <div className="agent-preview-item">
                <span className="agent-avatar">CO</span>
                <div>
                  <strong>Coordinator</strong>
                  <small>Combines evidence and conclusions</small>
                </div>
                <span className="agent-idle">Ready</span>
              </div>
            </div>
          </div>

          <div className="explore-card output-preview-card">
            <span className="section-eyebrow">LIVE INVESTIGATION OUTPUT</span>
            <h2>Research findings</h2>

            <div className="output-empty-state">
              <div className="output-empty-icon">⌕</div>
              <strong>No investigation started</strong>
              <p>
                Your findings, evidence trail, hypotheses,
                and agent activity will appear in this area
                when the investigation backend is connected.
              </p>
            </div>
          </div>

          <div className="explore-info-card">
            <strong>Source handling</strong>
            <p>
              Files are currently selected in your browser and their
              metadata is saved with the investigation. They are not
              uploaded or processed by the agents yet.
            </p>
          </div>

        </aside>
      </form>

      {/* UPLOAD MODAL */}
      {uploadModalOpen && (
        <div
          className="explore-modal-backdrop"
          onMouseDown={e => {
            if (e.target === e.currentTarget) {
              setUploadModalOpen(false);
            }
          }}
        >
          <div
            className="explore-upload-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-modal-title"
          >
            <div className="modal-heading">
              <div>
                <span className="section-eyebrow">SOURCE MATERIAL</span>
                <h2 id="upload-modal-title">Add files to investigation</h2>
                <p>Choose individual files or upload a complete folder.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setUploadModalOpen(false)}
                aria-label="Close upload dialog"
              >
                ×
              </button>
            </div>

            <button
              type="button"
              className="upload-choice"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="upload-choice-icon">▤</span>
              <span>
                <strong>Choose files</strong>
                <small>Select multiple documents, datasets, or code files.</small>
              </span>
              <span className="upload-choice-arrow">→</span>
            </button>

            <button
              type="button"
              className="upload-choice"
              onClick={() => folderInputRef.current?.click()}
            >
              <span className="upload-choice-icon">▣</span>
              <span>
                <strong>Choose folder</strong>
                <small>Add a project folder and its supported files.</small>
              </span>
              <span className="upload-choice-arrow">→</span>
            </button>

            <div className="modal-upload-note">
              <strong>Supported formats</strong>
              <p>
                Documents, spreadsheets, presentations, archives,
                datasets, and common programming files.
              </p>
              <small>20 MB per file · 100 MB total</small>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

export default Explore;
