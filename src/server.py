from fastapi import FastAPI, UploadFile, File, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import uuid
import os

from components import storage, transcriber
from components.models import TranscriptionRecord


app = FastAPI()

# Configure CORS to allow communication from the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/test")
def test_api():
    return {"message": "Hello from the FastAPI backend!"}


@app.post('/api/upload')
async def upload_audio(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """Receive an audio file, save it, create a transcription record and start background transcription."""
    saved_path = await storage.save_upload(file)
    duration = storage.get_duration_seconds(saved_path)

    record_id = str(uuid.uuid4())
    record = TranscriptionRecord(
        id=record_id,
        filename=os.path.basename(saved_path),
        status='queued',
        duration=duration,
        date=datetime.utcnow()
    )

    transcriber.append_record(record)

    # Background transcription task
    if background_tasks is not None:
        background_tasks.add_task(transcriber.transcribe_file, record_id, saved_path)
        # mark queued -> will be updated by transcriber
        transcriber.update_record(record_id, status='queued')

    return JSONResponse(status_code=202, content={"id": record_id, "status": "queued"})


@app.get('/api/transcriptions')
def list_transcriptions():
    recs = transcriber.load_records()
    return [r.dict() for r in recs]


@app.get('/api/transcriptions/{record_id}')
def get_transcription(record_id: str):
    recs = transcriber.load_records()
    for r in recs:
        if r.id == record_id:
            return r.dict()
    return JSONResponse(status_code=404, content={"detail": "Not found"})


@app.websocket('/api/ws/live')
async def websocket_live(ws: WebSocket):
    """Simple live transcription flow:
    - client sends binary audio chunks (wav) which are appended to a temp file
    - client sends text message 'stop' to finish and trigger transcription
    - backend runs transcription and sends back the final transcript
    """
    await ws.accept()
    temp_id = str(uuid.uuid4())
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    temp_path = os.path.join(uploads_dir, f"live_{temp_id}.wav")

    try:
        # receive and append binary chunks until 'stop' text message
        while True:
            msg = await ws.receive()
            if 'text' in msg and msg['text'] == 'stop':
                break
            if 'bytes' in msg:
                chunk = msg['bytes']
                with open(temp_path, 'ab') as f:
                    f.write(chunk)

        # create record and transcribe synchronously (could be background)
        duration = storage.get_duration_seconds(temp_path)
        record_id = str(uuid.uuid4())
        record = TranscriptionRecord(
            id=record_id,
            filename=os.path.basename(temp_path),
            status='queued',
            duration=duration,
            date=datetime.utcnow()
        )
        transcriber.append_record(record)
        transcriber.update_record(record_id, status='transcribing')
        # run transcription (blocking) and then send response
        transcriber.transcribe_file(record_id, temp_path)
        rec = transcriber.load_records()
        for r in rec:
            if r.id == record_id:
                await ws.send_json({"id": r.id, "status": r.status, "transcript": r.transcript, "error": r.error})
                break

    except WebSocketDisconnect:
        return
    except Exception as e:
        await ws.send_json({"error": str(e)})
        return
