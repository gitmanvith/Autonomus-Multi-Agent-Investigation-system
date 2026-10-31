"""
Language Detector — Detects programming language from file content and extension.
Supports 20+ languages for multi-language debugging.
"""

import re
from pathlib import Path
from typing import Optional, Tuple

from file_service import detect_language, is_supported


SHEBANG_PATTERNS = {
    r"#!.*\bpython[23]?\b": "python",
    r"#!.*\bpython3\b": "python",
    r"#!.*\bnode\b": "javascript",
    r"#!.*\bnodejs\b": "javascript",
    r"#!.*\bruby\b": "ruby",
    r"#!.*\bperl\b": "perl",
    r"#!.*\bbash\b": "shell",
    r"#!.*\bsh\b": "shell",
    r"#!.*\bzsh\b": "shell",
    r"#!.*\bphp\b": "php",
    r"#!.*\blua\b": "lua",
    r"#!.*\bawk\b": "awk",
}

LANGUAGE_SIGNATURES = {
    "python": [
        r"\bimport\s+\w+", r"\bfrom\s+\w+\s+import", r"\bdef\s+\w+\s*\(",
        r"\bclass\s+\w+", r"\bif\s+__name__\s*==", r"\bprint\s*\(",
    ],
    "javascript": [
        r"\bconst\s+\w+\s*=", r"\blet\s+\w+\s*=", r"\bvar\s+\w+\s*=",
        r"\bfunction\s+\w+\s*\(", r"=>", r"\bconsole\.log\s*\(",
        r"\brequire\s*\(", r"\bmodule\.exports",
    ],
    "typescript": [
        r":\s*\w+\s*[=,;]", r"\binterface\s+\w+", r"\btype\s+\w+\s*=",
        r":\s*string\b", r":\s*number\b", r":\s*boolean\b",
        r"\benum\s+\w+", r"\bnamespace\s+\w+",
    ],
    "java": [
        r"\bpublic\s+class\s+\w+", r"\bprivate\s+\w+", r"\bprotected\s+\w+",
        r"\bstatic\s+void\s+main", r"\bimport\s+java\.", r"\bpackage\s+\w+",
        r"\bSystem\.out\.println",
    ],
    "cpp": [
        r"#include\s+<", r"\bstd::\w+", r"\bcout\s*<<", r"\bcin\s*>>",
        r"\bvoid\s+main\s*\(", r"\bclass\s+\w+", r"\bnamespace\s+\w+",
    ],
    "c": [
        r"#include\s+<", r"\bprintf\s*\(", r"\bscanf\s*\(",
        r"\bvoid\s+main\s*\(", r"\bint\s+main\s*\(",
    ],
    "csharp": [
        r"\busing\s+\w+;", r"\bnamespace\s+\w+", r"\bpublic\s+class\s+\w+",
        r"\bConsole\.WriteLine", r"\bvoid\s+Main\s*\(",
    ],
    "go": [
        r"\bpackage\s+\w+", r"\bimport\s+\(", r"\bfunc\s+main\s*\(",
        r"\bfmt\.\w+", r"\bvar\s+\w+\s+\w+", r"\btype\s+\w+\s+struct",
    ],
    "rust": [
        r"\bfn\s+\w+\s*\(", r"\buse\s+\w+;", r"\bmod\s+\w+",
        r"\bstruct\s+\w+", r"\bimpl\s+\w+", r"\bprintln!\s*\(",
        r"\blet\s+mut\s+\w+",
    ],
    "php": [
        r"<\?php", r"\becho\s+", r"\b\$\w+\s*=", r"\bfunction\s+\w+\s*\(",
        r"\bnamespace\s+\w+", r"\buse\s+\\",
    ],
    "ruby": [
        r"\bdef\s+\w+", r"\bclass\s+\w+<\w*", r"\brequire\s+['\"]",
        r"\bmodule\s+\w+", r"\bend\b", r"\bputs\s+",
    ],
    "swift": [
        r"\bimport\s+\w+", r"\bfunc\s+\w+\s*\(", r"\bvar\s+\w+\s*:",
        r"\blet\s+\w+\s*:", r"\bprint\s*\(", r"\bclass\s+\w+",
    ],
    "kotlin": [
        r"\bfun\s+\w+\s*\(", r"\bval\s+\w+\s*:", r"\bvar\s+\w+\s*:",
        r"\bclass\s+\w+", r"\bobject\s+\w+", r"\bmain\s*\(\s*args\s*:\s*Array",
    ],
    "scala": [
        r"\bobject\s+\w+", r"\bclass\s+\w+", r"\bdef\s+\w+\s*\(",
        r"\bval\s+\w+\s*:", r"\bimport\s+\w+",
    ],
    "shell": [
        r"\b#!/bin/(ba)?sh", r"\b#!/bin/zsh", r"\becho\s+", r"\b\$\w+",
        r"\bif\s+\[", r"\bthen\b", r"\bfi\b",
    ],
    "sql": [
        r"\bSELECT\s+", r"\bFROM\s+", r"\bWHERE\s+", r"\bINSERT\s+INTO",
        r"\bUPDATE\s+", r"\bDELETE\s+FROM", r"\bCREATE\s+TABLE",
        r"\bJOIN\s+",
    ],
    "html": [
        r"<\s*html\b", r"<\s*head\b", r"<\s*body\b", r"<\s*div\b",
        r"<\s*script\b", r"<\s*link\b",
    ],
    "css": [
        r"\.\w+\s*\{", r"#\w+\s*\{", r"\bcolor\s*:", r"\bmargin\s*:",
        r"\bpadding\s*:", r"\bdisplay\s*:",
    ],
    "json": [
        r"^\s*[\{\[]", r"\b\"[^\"]+\"\s*:",
    ],
    "yaml": [
        r"^\w+\s*:", r"^-\s+\w+", r"\bapiVersion\s*:", r"\bkind\s*:",
    ],
    "dockerfile": [
        r"^\s*FROM\s+", r"^\s*RUN\s+", r"^\s*COPY\s+", r"^\s*CMD\s+",
        r"^\s*ENV\s+", r"^\s*EXPOSE\s+",
    ],
    "pdf": [
        r"%PDF-", r"\[PDF DOCUMENT:", r"\bPage\s+\d+\b",
    ],
}


def detect_language_from_content(content: str, filename: str = "") -> str:
    """
    Detect programming language from file content using shebang and keyword signatures.
    Falls back to extension-based detection.
    """
    # 1. Try extension-based detection first (most reliable)
    if filename and is_supported(filename):
        ext_lang = detect_language(filename)
        if ext_lang != "unknown":
            return ext_lang

    # 2. Try shebang detection
    first_line = content.split("\n")[0] if content else ""
    for pattern, lang in SHEBANG_PATTERNS.items():
        if re.search(pattern, first_line, re.IGNORECASE):
            return lang

    # 3. Try keyword signature matching
    content_lower = content.lower()
    scores = {}
    for lang, patterns in LANGUAGE_SIGNATURES.items():
        score = sum(1 for p in patterns if re.search(p, content, re.IGNORECASE))
        if score > 0:
            scores[lang] = score

    if scores:
        return max(scores, key=scores.get)

    # 4. Fallback
    return "unknown"


def get_language_info(language: str) -> dict:
    """Return metadata about a supported language."""
    info = {
        "python": {"name": "Python", "interpreter": "python3", "extensions": [".py", ".pyw", ".ipynb"]},
        "javascript": {"name": "JavaScript", "interpreter": "node", "extensions": [".js", ".jsx", ".mjs"]},
        "typescript": {"name": "TypeScript", "compiler": "tsc", "extensions": [".ts", ".tsx"]},
        "java": {"name": "Java", "compiler": "javac", "extensions": [".java"]},
        "kotlin": {"name": "Kotlin", "compiler": "kotlinc", "extensions": [".kt"]},
        "scala": {"name": "Scala", "compiler": "scalac", "extensions": [".scala"]},
        "c": {"name": "C", "compiler": "gcc", "extensions": [".c", ".h"]},
        "cpp": {"name": "C++", "compiler": "g++", "extensions": [".cpp", ".cc", ".cxx", ".hpp"]},
        "csharp": {"name": "C#", "compiler": "csc", "extensions": [".cs"]},
        "go": {"name": "Go", "compiler": "go", "extensions": [".go"]},
        "rust": {"name": "Rust", "compiler": "rustc", "extensions": [".rs"]},
        "php": {"name": "PHP", "interpreter": "php", "extensions": [".php"]},
        "ruby": {"name": "Ruby", "interpreter": "ruby", "extensions": [".rb"]},
        "swift": {"name": "Swift", "compiler": "swiftc", "extensions": [".swift"]},
        "shell": {"name": "Shell/Bash", "interpreter": "bash", "extensions": [".sh", ".bash", ".zsh"]},
        "sql": {"name": "SQL", "extensions": [".sql"]},
        "html": {"name": "HTML", "extensions": [".html"]},
        "css": {"name": "CSS", "extensions": [".css"]},
        "json": {"name": "JSON", "extensions": [".json"]},
        "yaml": {"name": "YAML", "extensions": [".yaml", ".yml"]},
        "dockerfile": {"name": "Dockerfile", "extensions": ["Dockerfile", ".dockerfile"]},
        "pdf": {
            "name": "PDF Document",
            "category": "specification / architecture / logs",
            "parser": "pypdf",
            "extensions": [".pdf"],
        },
    }
    return info.get(language, {"name": language.title(), "extensions": []})