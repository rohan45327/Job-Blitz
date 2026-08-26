"""
Resume Parser Service
Extracts text and auto-detects tech keywords from uploaded PDF/DOCX files.
"""
from __future__ import annotations
import io
import re
import logging
from typing import Tuple, List

logger = logging.getLogger(__name__)

# ─── Tech Keyword Dictionary ────────────────────────────────────────────────────
# Used to auto-extract skills from resume text
_TECH_KEYWORDS: List[str] = [
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust",
    "kotlin", "swift", "r", "scala", "ruby", "php", "dart", "elixir",
    # Web / Frontend
    "react", "react native", "next.js", "vue", "angular", "svelte", "html",
    "css", "tailwind", "bootstrap", "redux", "graphql", "rest", "websocket",
    # Backend / Infra
    "fastapi", "django", "flask", "express", "spring", "nestjs", "node.js",
    "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ci/cd",
    "github actions", "jenkins", "nginx", "redis", "celery", "rabbitmq",
    # Databases
    "postgresql", "mysql", "mongodb", "sqlite", "firebase", "dynamodb",
    "cassandra", "elasticsearch", "neo4j", "supabase",
    # AI / ML
    "machine learning", "deep learning", "nlp", "computer vision", "pytorch",
    "tensorflow", "keras", "scikit-learn", "pandas", "numpy", "llm",
    "langchain", "openai", "hugging face", "transformers", "stable diffusion",
    "reinforcement learning", "mlops", "feature engineering", "data pipeline",
    # Data
    "sql", "bigquery", "spark", "hadoop", "kafka", "airflow", "dbt", "tableau",
    "power bi", "looker", "data warehouse", "etl", "elt", "analytics",
    # Mobile
    "android", "ios", "expo", "flutter", "react native", "xcode",
    # Concepts
    "microservices", "api", "system design", "distributed systems", "agile",
    "devops", "cloud", "serverless", "blockchain", "cybersecurity",
    "git", "linux", "bash", "testing", "tdd", "unit testing",
    # Tools
    "figma", "jira", "confluence", "postman", "grafana", "prometheus",
]

_KEYWORD_PATTERN = re.compile(
    r'\b(' + '|'.join(re.escape(k) for k in sorted(_TECH_KEYWORDS, key=len, reverse=True)) + r')\b',
    re.IGNORECASE
)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from a PDF file using pdfplumber."""
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text_parts.append(t)
        return "\n".join(text_parts).strip()
    except ImportError:
        logger.error("pdfplumber not installed. Cannot parse PDF.")
        raise
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise ValueError(f"Could not parse PDF: {e}")


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract plain text from a DOCX file using python-docx."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs).strip()
    except ImportError:
        logger.error("python-docx not installed. Cannot parse DOCX.")
        raise
    except Exception as e:
        logger.error(f"DOCX extraction failed: {e}")
        raise ValueError(f"Could not parse DOCX: {e}")


def extract_keywords_from_text(text: str) -> List[str]:
    """
    Scan resume text for known tech keywords.
    Returns a de-duplicated list preserving original casing from the keyword dict.
    """
    found = set()
    for match in _KEYWORD_PATTERN.finditer(text):
        found.add(match.group(0).lower())
    # Return in stable order (alphabetical)
    return sorted(found)


def parse_resume(file_bytes: bytes, content_type: str) -> Tuple[str, List[str]]:
    """
    Parse a resume file and return (full_text, auto_detected_keywords).

    Args:
        file_bytes: Raw bytes of the uploaded file.
        content_type: MIME type, e.g. 'application/pdf' or
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    Returns:
        Tuple of (extracted_text, keyword_list)
    """
    ct = content_type.lower()
    if "pdf" in ct:
        text = extract_text_from_pdf(file_bytes)
    elif "docx" in ct or "openxmlformats" in ct or "word" in ct:
        text = extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {content_type}. Please upload a PDF or DOCX.")

    if not text:
        raise ValueError("Resume appears to be empty or could not be read. Please check the file.")

    keywords = extract_keywords_from_text(text)
    return text, keywords
