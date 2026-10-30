
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const ALLOWED_EXTENSIONS = [
  "pdf", "docx", "doc", "xlsx", "xls",
  "csv", "txt", "json", "log", "zip"
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB per file
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100 MB total
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

  function addFiles(fileList) {
    const incoming = Array.from(fileList || []);

    if (!incoming.length) return;

    const validFiles = [];
    const errors = [];

    incoming.forEach((file) => {
      const extension = file.name.split(".").pop().toLowerCase();

      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        errors.push(`${file.name}: unsupported file type.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: exceeds the 20 MB limit.`);
        return;
      }

      validFiles.push(file);
    });

    setSelectedFiles((previous) => {
      const combined = [...previous];

      validFiles.forEach((file) => {
        const path = file.webkitRelativePath || file.name;

        const duplicate = combined.some(
          (existing) =>
            (existing.webkitRelativePath || existing.name) === path &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified
        );

        if (!duplicate) combined.push(file);
      });

      if (combined.length > MAX_FILES) {
        errors.push(`You can select a maximum of ${MAX_FILES} files.`);
        return combined.slice(0, MAX_FILES);
      }

      const totalSize = combined.reduce(
        (sum, file) => sum + file.size,
        0
      );

      if (totalSize > MAX_TOTAL_SIZE) {
        errors.push("Total selected file size cannot exceed 100 MB.");
        return previous;
      }

      return combined;
    });

    setError(errors.join(" "));
  }

  function removeFile(index) {
    setSelectedFiles((previous) =>
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

      // Metadata only. Actual file upload requires the backend.
      documents: selectedFiles.map((file) => ({
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
  }

  const totalSize = selectedFiles.reduce(
    (sum, file) => sum + file.size,
    0
  );

  return (
    <section>
      <div className="dashboard-heading">
        <span className="hero-label">INVESTIGATION CENTER</span>
        <h1>Start an investigation</h1>
        <p>
          Investigate information from documents, datasets,
          and external sources using your multi-agent system.
        </p>
      </div>

      <div className="panel explore-panel">
        <form onSubmit={handleSubmit} className="investigation-form">

          <label htmlFor="topic">Investigation topic</label>
          <input
            id="topic"
            type="text"
            placeholder="e.g. Identify suspicious financial transactions"
            value={topic}
            onChange={(event) => {
              setTopic(event.target.value);
              setError("");
            }}
          />

          <label htmlFor="description">
            Research question / instructions
          </label>
          <textarea
            id="description"
            rows="5"
            placeholder="Describe what you want the agents to investigate..."
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

          <div className="upload-section">
            <div className="upload-heading">
              <div>
                <h2>Investigation documents</h2>
                <p>
                  Add individual files or an entire folder
                  for the agents to investigate.
                </p>
              </div>

              <span className="upload-count">
                {selectedFiles.length} files
              </span>
            </div>

            <div
              className={`upload-dropzone ${dragging ? "dragging" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div className="upload-icon">↑</div>

              <h3>Drag and drop your documents here</h3>
              <p>Or select files and folders from your device.</p>

              <div className="upload-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select files
                </button>

                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => folderInputRef.current?.click()}
                >
                  Select entire folder
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json,.log,.zip"
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = "";
                }}
              />

              <input
                ref={folderInputRef}
                type="file"
                multiple
                hidden
                webkitdirectory=""
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
               

             <div
  className="dropzone"
  onDragOver={(e) => {
    e.preventDefault();
    e.stopPropagation();
  }}
  onDrop={(e) => {
    e.preventDefault();
    e.stopPropagation();
    addFiles(e.dataTransfer.files);
  }}
>
  <input
    type="file"
    id="file-upload"
    multiple
    onChange={(e) => {
      addFiles(e.target.files);
      e.target.value = "";
    }}
    hidden
  />

  <div className="dropzone-content">
    <span className="upload-icon">📁</span>
    <h3>Drag and drop your files here</h3>
    <p>Or click below to browse files from your computer</p>

    <label htmlFor="file-upload" className="upload-button">
      Browse Files
    </label>
  </div>
</div>



              <small>
                PDF, DOCX, XLSX, CSV, TXT, JSON, LOG, ZIP
              </small>
              <small>
                Maximum 20 MB per file · 100 MB total · 100 files
              </small>
            </div>

            {selectedFiles.length > 0 && (
              <div className="selected-files">
                <div className="selected-files-heading">
                  <h3>Selected documents</h3>
                  <span>{formatSize(totalSize)} total</span>
                </div>

                {selectedFiles.map((file, index) => (
                  <div className="selected-file" key={`${file.name}-${index}`}>
                    <div className="file-icon">▤</div>

                    <div className="file-information">
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
                  Remove all documents
                </button>
              </div>
            )}
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="primary-button">
            Create Investigation →
          </button>
        </form>
      </div>

      <div className="notice-panel">
        <strong>Document upload preview</strong>
        <p>
          Files are currently selected in your browser only.
          They are not yet uploaded to secure storage or processed
          by the AI agents. Backend integration is the next step.
          Use synthetic or anonymised data during development.
        </p>
      </div>
    </section>
  );
}

export default Explore;
