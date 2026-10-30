
import { useRef, useState } from "react";
import "../../code-intelligence.css";

const MAX_FILES = 100;
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_TOTAL_SIZE = 500 * 1024 * 1024;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getEntryFiles(entry, parentPath = "") {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file(
        (file) => {
          Object.defineProperty(file, "relativePath", {
            value: parentPath + file.name,
            configurable: true,
          });
          resolve([file]);
        },
        () => resolve([])
      );
      return;
    }

    if (entry.isDirectory) {
      const reader = entry.createReader();
      const allFiles = [];

      const readBatch = () => {
        reader.readEntries(async (entries) => {
          if (!entries.length) {
            resolve(allFiles);
            return;
          }

          const batches = await Promise.all(
            entries.map((item) =>
              getEntryFiles(item, parentPath + entry.name + "/")
            )
          );

          batches.forEach((batch) => allFiles.push(...batch));
          readBatch();
        }, () => resolve(allFiles));
      };

      readBatch();
      return;
    }

    resolve([]);
  });
}

export default function CodeIntelligence() {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState("");

  const addFiles = (incomingFiles) => {
    const incoming = Array.from(incomingFiles || []);
    const nextErrors = [];

    setFiles((previous) => {
      const combined = [...previous];
      const known = new Set(
        previous.map((file) => file.relativePath || file.name)
      );

      for (const file of incoming) {
        const path = file.relativePath || file.webkitRelativePath || file.name;

        if (known.has(path)) continue;

        if (file.size > MAX_FILE_SIZE) {
          nextErrors.push(`${path}: exceeds 20 MB.`);
          continue;
        }

        if (combined.length >= MAX_FILES) {
          nextErrors.push("Maximum of 100 files reached.");
          break;
        }

        const currentSize = combined.reduce(
          (total, item) => total + item.size,
          0
        );

        if (currentSize + file.size > MAX_TOTAL_SIZE) {
          nextErrors.push("Combined file size cannot exceed 100 MB.");
          break;
        }

        Object.defineProperty(file, "relativePath", {
          value: path,
          configurable: true,
        });

        combined.push(file);
        known.add(path);
      }

      return combined;
    });

    setErrors(nextErrors);
    setMessage("");
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setDragging(false);

    const items = Array.from(event.dataTransfer.items || []);
    const entries = items
      .map((item) => item.webkitGetAsEntry?.())
      .filter(Boolean);

    if (entries.length) {
      const batches = await Promise.all(
        entries.map((entry) => getEntryFiles(entry))
      );
      addFiles(batches.flat());
    } else {
      addFiles(event.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setFiles((previous) => previous.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setFiles([]);
    setErrors([]);
    setMessage("");
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  const handlePrepare = () => {
    if (!files.length) {
      setMessage("Please add files or a project folder first.");
      return;
    }

    // Upload to the backend will be connected in Step 2.
    setMessage(
      `${files.length} files selected. Ready for backend integration.`
    );
  };

  return (
    <div className="ci-page">
      <div className="ci-heading">
        <div>
          <span className="ci-eyebrow">ENGINEERING WORKSPACE</span>
          <h1>Code Intelligence</h1>
          <p>
            Upload your project. Let your AI agents understand,
            inspect and debug connected files.
          </p>
        </div>
        <span className="ci-agent-label">15 AI AGENTS</span>
      </div>

      <section
        className={`ci-dropzone ${dragging ? "ci-dragging" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setDragging(false);
          }
        }}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
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
          directory=""
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <div className="ci-upload-icon">⇧</div>
        <h2>Drop your project files here</h2>
        <p>
          Drag multiple files or an entire folder into this area.
          Nested folders are supported.
        </p>

        <div className="ci-upload-actions">
          <button
            type="button"
            className="ci-primary-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose Files
          </button>

          <button
            type="button"
            className="ci-secondary-btn"
            onClick={() => folderInputRef.current?.click()}
          >
            Choose Folder
          </button>
        </div>

        <span className="ci-upload-note">
          Up to 100 files · 100 MB per file · 500 MB total
        </span>
      </section>

      {errors.length > 0 && (
        <div className="ci-errors">
          {errors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}

      <section className="ci-files-panel">
        <div className="ci-panel-heading">
          <div>
            <h3>Project Files</h3>
            <p>
              {files.length} files selected · {formatSize(totalSize)}
            </p>
          </div>

          {files.length > 0 && (
            <button className="ci-clear-btn" onClick={clearFiles}>
              Clear All
            </button>
          )}
        </div>

        {files.length === 0 ? (
          <div className="ci-empty">
            <div>📁</div>
            <strong>No project files added yet</strong>
            <span>Your selected files will appear here.</span>
          </div>
        ) : (
          <div className="ci-file-list">
            {files.map((file, index) => (
              <div className="ci-file-row" key={`${file.relativePath}-${index}`}>
                <div className="ci-file-icon">▤</div>
                <div className="ci-file-info">
                  <strong>{file.name}</strong>
                  <span>{file.relativePath || file.name}</span>
                </div>
                <span className="ci-file-size">
                  {formatSize(file.size)}
                </span>
                <button
                  className="ci-remove-btn"
                  onClick={() => removeFile(index)}
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {message && <div className="ci-message">{message}</div>}

      <div className="ci-footer">
        <div>
          <strong>Ready to analyse?</strong>
          <p>Your files will be prepared for the agent workflow.</p>
        </div>

        <button
          className="ci-primary-btn"
          onClick={handlePrepare}
          disabled={files.length === 0}
        >
          Prepare Project →
        </button>
      </div>
    </div>
  );
}
