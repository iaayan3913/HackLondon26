import os
from fastapi import UploadFile
from mutagen import File as MutagenFile


BASE_DIR = os.path.dirname(os.path.dirname(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")


def ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


async def save_upload(upload: UploadFile) -> str:
    """Save UploadFile to disk and return absolute path."""
    ensure_upload_dir()
    dest_path = os.path.join(UPLOAD_DIR, upload.filename)
    # Avoid overwriting: if exists, add a counter
    base, ext = os.path.splitext(dest_path)
    i = 1
    while os.path.exists(dest_path):
        dest_path = f"{base}_{i}{ext}"
        i += 1

    with open(dest_path, "wb") as f:
        content = await upload.read()
        f.write(content)

    return dest_path


def get_duration_seconds(path: str) -> float:
    """Attempt to read audio duration using mutagen. Returns seconds or 0.0."""
    try:
        audio = MutagenFile(path)
        if audio and hasattr(audio, 'info') and hasattr(audio.info, 'length'):
            return float(audio.info.length)
    except Exception:
        pass
    return 0.0
