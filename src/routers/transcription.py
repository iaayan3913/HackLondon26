from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi
from services.gemini import GeminiService, VideoSummaryResponse
from config import settings

router = APIRouter(prefix="/transcription", tags=["transcription"])

gemini_service = GeminiService()

class AnalyzeVideoRequest(BaseModel):
    video_url: str

class AnalyzeVideoResponse(BaseModel):
    summary: str
    key_points: list[str]
    questions: list[dict] # Simplified for response

def extract_video_id(url: str) -> str:
    """Extracts video ID from YouTube URL."""
    from urllib.parse import urlparse, parse_qs
    query = urlparse(url)
    if query.hostname == 'youtu.be':
        return query.path[1:]
    if query.hostname in ('www.youtube.com', 'youtube.com'):
        if query.path == '/watch':
            p = parse_qs(query.query)
            return p['v'][0]
        if query.path[:7] == '/embed/':
            return query.path.split('/')[2]
        if query.path[:3] == '/v/':
            return query.path.split('/')[2]
    # fail?
    return url

@router.post("/analyze", response_model=AnalyzeVideoResponse)
async def analyze_video(req: AnalyzeVideoRequest):
    video_id = extract_video_id(req.video_url)
    
    try:
        api = YouTubeTranscriptApi()
        transcript_list = api.get_transcript(video_id)
        # Combine transcript text
        full_transcript = " ".join([entry['text'] for entry in transcript_list])
    except AttributeError:
        # Fallback for newer versions of youtube-transcript-api
        try:
            api = YouTubeTranscriptApi()
            transcript_list = api.fetch(video_id)
            full_transcript = " ".join([entry.text for entry in transcript_list])
        except Exception as e:
             raise HTTPException(status_code=400, detail=f"Failed to fetch transcript (v2): {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch transcript: {str(e)}")

    try:
        summary_response = gemini_service.summarize_video(full_transcript)
        
        # Convert Pydantic models to dict for response
        questions_list = []
        for q in summary_response.questions:
            questions_list.append(q.model_dump())

        return AnalyzeVideoResponse(
            summary=summary_response.summary,
            key_points=summary_response.key_points,
            questions=questions_list
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
