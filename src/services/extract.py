from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
import tempfile

import markdown
from bs4 import BeautifulSoup
from fastapi import UploadFile


ALLOWED_EXTENSIONS = {".txt", ".pdf", ".md"}
MAX_PDF_PAGES = 50
MAX_EXTRACT_CHARS = 100_000


class UnsupportedFileTypeError(ValueError):
    pass


def validate_upload_file(upload: UploadFile) -> str:
    filename = upload.filename or ""
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise UnsupportedFileTypeError("Only .txt, .pdf, and .md files are supported")

    content_type = (upload.content_type or "").lower()
    if content_type.startswith(("image/", "video/", "audio/")):
        raise UnsupportedFileTypeError("Unsupported file MIME type")

    return suffix


@asynccontextmanager
async def ephemeral_upload(upload: UploadFile, suffix: str):
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_path = Path(temp_file.name)
        while True:
            chunk = await upload.read(1024 * 1024)
            if not chunk:
                break
            temp_file.write(chunk)

    try:
        yield temp_path
    finally:
        temp_path.unlink(missing_ok=True)
        await upload.seek(0)


def extract_text(path: Path, suffix: str) -> tuple[str, bool]:
    if suffix == ".txt":
        text = _extract_txt(path)
    elif suffix == ".md":
        text = _extract_markdown(path)
    elif suffix == ".pdf":
        text = _extract_pdf(path)
    else:
        raise UnsupportedFileTypeError("Unsupported file type")

    was_truncated = len(text) > MAX_EXTRACT_CHARS
    if was_truncated:
        text = text[:MAX_EXTRACT_CHARS]
    return text.strip(), was_truncated


def _extract_txt(path: Path) -> str:
    raw = path.read_bytes()
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return raw.decode("latin-1", errors="ignore")


def _extract_markdown(path: Path) -> str:
    text = _extract_txt(path)
    html = markdown.markdown(text)
    return BeautifulSoup(html, "html.parser").get_text(separator="\n")


def _extract_pdf(path: Path) -> str:
    text = _extract_pdf_pymupdf(path)
    if text.strip():
        return text
    return _extract_pdf_pdfplumber(path)


def _extract_pdf_pymupdf(path: Path) -> str:
    import fitz

    blocks: list[str] = []
    with fitz.open(path) as doc:
        pages = min(len(doc), MAX_PDF_PAGES)
        for index in range(pages):
            blocks.append(doc[index].get_text("text"))
    return "\n".join(blocks)


def _extract_pdf_pdfplumber(path: Path) -> str:
    import pdfplumber

    blocks: list[str] = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages[:MAX_PDF_PAGES]:
            blocks.append(page.extract_text() or "")
    return "\n".join(blocks)
