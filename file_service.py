"""
File Service — Handles multi-document uploads with size validation.
Supports up to 10 documents, maximum 500 MB total capacity.
"""

import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional, Tuple
from fastapi import UploadFile, HTTPException
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
MAX_FILES = int(os.getenv("MAX_FILES", "10"))               # max 10 documents
MAX_TOTAL_SIZE_MB = int(os.getenv("MAX_TOTAL_SIZE_MB", "500"))  # max 500 MB
MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Supported file extensions for debugging
SUPPORTED_EXTENSIONS = {
    # PDF Documents (Architecture, Specs, Incident Reports)
    ".pdf": "pdf",
    # Python
    ".py": "python",
    ".pyw": "python",
    ".ipynb": "python",
    # JavaScript / TypeScript
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".mjs": "javascript",
    # Java
    ".java": "java",
    ".kt": "kotlin",
    ".scala": "scala",
    # C / C++
    ".c": "c",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".cxx": "cpp",
    ".h": "c",
    ".hpp": "cpp",
    # C#
    ".cs": "csharp",
    # Go
    ".go": "go",
    # Rust
    ".rs": "rust",
    # PHP
    ".php": "php",
    # Ruby
    ".rb": "ruby",
    # Swift
    ".swift": "swift",
    # Shell / Scripts
    ".sh": "shell",
    ".bash": "shell",
    ".zsh": "shell",
    # SQL
    ".sql": "sql",
    # Config / Data
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".xml": "xml",
    # Logs
    ".log": "log",
    ".txt": "text",
    # Web
    ".html": "html",
    ".css": "css",
    # Docker / Config
    ".dockerfile": "dockerfile",
    "Dockerfile": "dockerfile",
    ".tf": "terraform",
}


def detect_language(filename: str) -> str:
    """Detect programming language from file extension. Returns 'unknown' if unsupported."""
    ext = Path(filename).suffix.lower()
    name = Path(filename).name
    if ext in SUPPORTED_EXTENSIONS:
        return SUPPORTED_EXTENSIONS[ext]
    # Handle extensionless Dockerfile
    if name == "Dockerfile":
        return "dockerfile"
    return "unknown"


def is_supported(filename: str) -> bool:
    """Return True if the file extension is supported for debugging."""
    return detect_language(filename) != "unknown"


def validate_upload(files: List[UploadFile]) -> None:
    """Validate the number and total size of uploaded files."""
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=413,
            detail=f"Too many files. Maximum {MAX_FILES} files allowed, received {len(files)}.",
        )

    total_size = 0
    for f in files:
        # Read file to determine size (fastapi spools to temp file on disk)
        f.file.seek(0, os.SEEK_END)
        size = f.file.tell()
        f.file.seek(0)
        total_size += size

        if not is_supported(f.filename):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {f.filename}. "
                       f"Supported: {', '.join(sorted(set(SUPPORTED_EXTENSIONS.values())))}",
            )

    if total_size > MAX_TOTAL_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Total upload size exceeds {MAX_TOTAL_SIZE_MB} MB limit. "
                   f"Received {total_size / (1024*1024):.2f} MB.",
        )


async def save_uploaded_files(files: List[UploadFile], session_id: str) -> List[dict]:
    """
    Save uploaded files to disk under a session-specific folder.
    Returns a list of file metadata dicts.
    """
    session_dir = UPLOAD_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    saved_files = []
    for f in files:
        # Sanitize filename
        safe_name = f"{uuid.uuid4().hex}_{f.filename}"
        file_path = session_dir / safe_name

        # Stream write to avoid loading entire file into memory
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(f.file, buffer)

        saved_files.append({
            "original_name": f.filename,
            "stored_name": safe_name,
            "path": str(file_path),
            "size": os.path.getsize(file_path),
            "language": detect_language(f.filename),
            "session_id": session_id,
        })

    return saved_files


def extract_text_from_pdf(file_path: str, max_pages: int = 50, max_chars: int = 40000) -> str:
    """
    Extracts text, metadata, and structured pages from a PDF document using pypdf.
    """
    try:
        import pypdf
        reader = pypdf.PdfReader(str(file_path))
        total_pages = len(reader.pages)
        pages_to_read = min(total_pages, max_pages)

        extracted_lines = [
            f"[PDF DOCUMENT: {Path(file_path).name} | Total Pages: {total_pages} | Analyzed Pages: {pages_to_read}]"
        ]

        # Extract document metadata if available
        meta = reader.metadata
        if meta:
            meta_parts = []
            if getattr(meta, "title", None):
                meta_parts.append(f"Title: {meta.title}")
            if getattr(meta, "author", None):
                meta_parts.append(f"Author: {meta.author}")
            if getattr(meta, "subject", None):
                meta_parts.append(f"Subject: {meta.subject}")
            if meta_parts:
                extracted_lines.append(f"Metadata: {' | '.join(meta_parts)}")

        total_extracted = 0
        for idx in range(pages_to_read):
            page = reader.pages[idx]
            text = page.extract_text() or ""
            text = text.strip()
            if text:
                extracted_lines.append(f"\n--- Page {idx + 1} ---")
                extracted_lines.append(text)
                total_extracted += len(text)
                if total_extracted >= max_chars:
                    extracted_lines.append(f"\n[... Truncated after {max_chars} characters for multi-agent swarm analysis ...]")
                    break

        if total_extracted == 0:
            return (
                f"[PDF DOCUMENT: {Path(file_path).name} | Total Pages: {total_pages}]\n"
                "Note: No extractable text stream was found in this PDF (document may contain scanned images, forms, or vector paths). "
                "The multi-agent swarm will perform document structure, format, and metadata forensics."
            )

        return "\n".join(extracted_lines)

    except Exception as exc:
        return f"[PDF Parsing Error for {Path(file_path).name}: {str(exc)}]\nAttempting raw stream analysis."


def read_file_content(file_path: str, max_chars: int = 40000) -> str:
    """Read file content safely, extracting text for PDFs and reading text for code files."""
    path_obj = Path(file_path)
    if path_obj.suffix.lower() == ".pdf":
        return extract_text_from_pdf(str(path_obj), max_chars=max_chars)

    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read(max_chars)
        return content
    except Exception as e:
        return f"Error reading file: {str(e)}"


def cleanup_session(session_id: str) -> None:
    """Remove all files for a given session."""
    session_dir = UPLOAD_DIR / session_id
    if session_dir.exists():
        shutil.rmtree(session_dir, ignore_errors=True)