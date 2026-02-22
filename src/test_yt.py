from youtube_transcript_api import YouTubeTranscriptApi
import inspect

print(f"Type: {type(YouTubeTranscriptApi)}")
print(f"Dir: {dir(YouTubeTranscriptApi)}")

try:
    api = YouTubeTranscriptApi()
    # Use a real video ID that has captions, e.g. "dQw4w9WgXcQ" (Rick Astley) or something short.
    # Actually let's just inspect the object structure first without fetch if possible, or fetch something common.
    # "jNQXAC9IV1g" represents "Me at the zoo" - short transcript.
    transcript = api.fetch("jNQXAC9IV1g") 
    print(f"Transcript type: {type(transcript)}")
    for item in transcript:
        print(item)
        break
except Exception as e:
    print(f"Error: {e}")
