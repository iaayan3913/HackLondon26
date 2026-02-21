import json
import uuid
from datetime import datetime
import shutil
from typing import List

from google.cloud import speech
from google.oauth2 import service_account
import wave
import os
import subprocess

from .models import TranscriptionRecord
from .storage import get_duration_seconds


BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'components', 'transcriptions.json')
KEY_PATH = os.path.abspath(os.path.join(BASE_DIR, '..', 'keys', 'GOOGLE_APPLICATION_CREDENTIALS.json'))


def _ensure_data_file():
    folder = os.path.dirname(DATA_FILE)
    os.makedirs(folder, exist_ok=True)
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w') as f:
            json.dump([], f)


def load_records() -> List[TranscriptionRecord]:
    _ensure_data_file()
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)
    return [TranscriptionRecord(**d) for d in data]


def save_records(records: List[TranscriptionRecord]):
    _ensure_data_file()
    with open(DATA_FILE, 'w') as f:
        json.dump([r.dict() for r in records], f, default=str)


def append_record(record: TranscriptionRecord):
    recs = []
    try:
        recs = load_records()
    except Exception:
        recs = []
    recs.append(record)
    save_records(recs)


def update_record(record_id: str, **changes):
    recs = load_records()
    for r in recs:
        if r.id == record_id:
            for k, v in changes.items():
                setattr(r, k, v)
            break
    save_records(recs)


def _get_speech_client():
    # load credentials from the keys folder
    creds = None
    if os.path.exists(KEY_PATH):
        creds = service_account.Credentials.from_service_account_file(KEY_PATH)
        return speech.SpeechClient(credentials=creds)
    # fallback to default environment credentials
    return speech.SpeechClient()


def transcribe_file(record_id: str, filepath: str):
    """Blocking transcription run. Updates the JSON datastore with results."""
    update_record(record_id, status='transcribing')
    client = _get_speech_client()

    try:
        # Diagnostic logging
        try:
            size = os.path.getsize(filepath)
        except Exception:
            size = None
        print(f"[transcriber] Starting transcription for {filepath} (id={record_id}) size={size}")

        # Try to detect WAV params (sample rate / channels) when possible
        sample_rate = None
        channels = None

        try:
            with wave.open(filepath, 'rb') as w:
                sample_rate = w.getframerate()
                channels = w.getnchannels()
        except Exception:
            # Not a WAV file or failed to read header
            sample_rate = None
            channels = None

        use_path = filepath

        def ffmpeg_works() -> bool:
            exe = shutil.which("ffmpeg")
            if not exe:
                return False
            try:
                subprocess.run([exe, "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
                return True
            except Exception:
                return False

        if (sample_rate is None or channels is None or sample_rate != 16000) and ffmpeg_works():
            try:
                converted_path = filepath + '.converted.wav'
                subprocess.run([
                    'ffmpeg', '-y', '-i', filepath,
                    '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', converted_path
                ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                use_path = converted_path
                sample_rate = 16000
                channels = 1
                print(f"[transcriber] Converted {filepath} -> {converted_path}")
            except Exception as e:
                print(f"[transcriber] ffmpeg conversion failed: {e}")
        else:
            print("[transcriber] Skipping conversion (ffmpeg missing/broken or already 16k).")

        # If after attempting conversion we still don't have WAV params, fail with a helpful message
        if sample_rate is None or channels is None:
            update_record(record_id, status="error", error="Only WAV files supported on this machine (ffmpeg not available).")
            return

        # Read file content
        # Recompute duration from the (possibly converted) file and persist it
        try:
            duration = get_duration_seconds(use_path)
        except Exception:
            duration = 0.0

        # persist new duration (if any)
        try:
            update_record(record_id, duration=duration)
        except Exception:
            pass

        with open(use_path, 'rb') as f:
            content = f.read()

        audio = speech.RecognitionAudio(content=content)

        # Build recognition config kwargs
        config_kwargs = dict(
            language_code='en-US',
            enable_automatic_punctuation=True,
            model='default'
        )
        if sample_rate:
            config_kwargs['sample_rate_hertz'] = sample_rate
        if channels:
            config_kwargs['audio_channel_count'] = channels
        # Pick encoding based on file extension when possible. LINEAR16 is default for WAV.
        ext = os.path.splitext(use_path)[1].lower()
        encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16
        try:
            if ext in ('.webm', '.opus', '.oga', '.ogg'):
                encoding = speech.RecognitionConfig.AudioEncoding.OGG_OPUS
            elif ext in ('.flac',):
                encoding = speech.RecognitionConfig.AudioEncoding.FLAC
            elif ext in ('.mp3', '.mpegaudio'):
                encoding = speech.RecognitionConfig.AudioEncoding.MP3
            elif ext in ('.wav', '.wave', ''):
                encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16
        except Exception:
            encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16

        config = speech.RecognitionConfig(
            encoding=encoding,
            **config_kwargs
        )

        operation = client.long_running_recognize(config=config, audio=audio)
        print(f"[transcriber] Operation started for {record_id}, waiting for result...")
        result = operation.result(timeout=600)

        transcripts = []
        for res in result.results:
            if res.alternatives:
                transcripts.append(res.alternatives[0].transcript)

        full = "\n".join(transcripts).strip()
        print(f"[transcriber] Transcription finished for {record_id}: chars={len(full)} segments={len(transcripts)}")
        # Update transcript and mark complete (include duration if recomputed)
        update_record(record_id, status='completed', transcript=full, duration=duration)
    except Exception as e:
        print(f"[transcriber] Error transcribing {record_id}: {e}")
        update_record(record_id, status='error', error=str(e))
