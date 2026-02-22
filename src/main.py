from __future__ import annotations
import logging

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import random
import json
import uuid
import os
from anthropic import Anthropic


client = Anthropic(api_key="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")

try:
    from .config import settings
    from .database import ensure_test_user
    from .database import init_db
    from .routers.attempts import router as attempts_router
    from .routers.quizzes import router as quizzes_router
    from routers.transcription import router as transcription_router
    from services.extract import extract_text, ephemeral_upload, validate_upload_file
except ImportError:  # pragma: no cover - allows `uvicorn main:app` from src/
    from config import settings
    from database import ensure_test_user
    from database import init_db
    from routers.attempts import router as attempts_router
    from routers.quizzes import router as quizzes_router
    from routers.transcription import router as transcription_router
    from services.extract import extract_text, ephemeral_upload, validate_upload_file


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s level=%(levelname)s name=%(name)s message=%(message)s",
)

app = FastAPI(title="Quiz & Viva Arena API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(quizzes_router)
app.include_router(attempts_router)
app.include_router(transcription_router)

COLOURS = [
    "#fde8e8", "#fef3c7", "#d1fae5",
    "#dbeafe", "#ede9fe", "#fce7f3", "#ffedd5",
]

@app.get("/api/colour")
def get_colour():
    return {"colour": random.choice(COLOURS)}

# ── Premade topic descriptions for Claude to generate cards from ──────────────
PREMADE_TOPICS = {
    "human anatomy ii": {
        "subject": "Medicine",
        "description": """
        Human Anatomy II covering:
        - The cardiovascular system: heart chambers, valves, major vessels (aorta, vena cava, pulmonary)
        - The respiratory system: trachea, bronchi, alveoli, gas exchange
        - The nervous system: CNS vs PNS, neurons, synaptic transmission, reflex arcs
        - The musculoskeletal system: major bones, joints, muscle types, tendons vs ligaments
        - The digestive system: organs, enzymes, absorption
        - The endocrine system: key hormones and their glands (insulin, cortisol, adrenaline, thyroxine)
        - The renal system: nephron structure, filtration, osmoregulation
        Focus on precise anatomical terminology and functional relationships between structures.
        """,
    },
    "microbiology basic": {
        "subject": "Biology",
        "description": """
        Introductory Microbiology covering:
        - Cell types: prokaryotes vs eukaryotes, key structural differences
        - Bacterial structure: cell wall, flagella, pili, plasmids, capsule
        - Bacterial reproduction: binary fission, conjugation, transformation, transduction
        - Viruses: structure, lytic vs lysogenic cycles, viral replication
        - Fungi: hyphae, spore formation, pathogenic fungi
        - Microbial metabolism: aerobic vs anaerobic respiration, fermentation
        - Host-pathogen interactions: infection, colonisation, virulence factors
        - Antibiotics: mechanisms of action (cell wall inhibition, protein synthesis inhibition, etc.)
        - Gram staining: principle, procedure, interpretation
        """,
    },
    "organic compounds": {
        "subject": "Chemistry",
        "description": """
        Organic Chemistry covering:
        - Functional groups: alkanes, alkenes, alkynes, alcohols, aldehydes, ketones, carboxylic acids, amines, esters
        - IUPAC nomenclature rules
        - Reaction types: addition, substitution, elimination, condensation, hydrolysis
        - Isomerism: structural isomers, stereoisomers, enantiomers, diastereomers
        - Mechanisms: nucleophilic substitution (SN1 vs SN2), electrophilic addition
        - Aromatic chemistry: benzene, electrophilic aromatic substitution
        - Polymers: addition polymers, condensation polymers
        - Organic analysis: mass spec, IR spectroscopy, NMR key concepts
        """,
    },
    "calculus i": {
        "subject": "Mathematics",
        "description": """
        Calculus I covering:
        - Limits: definition, limit laws, one-sided limits, limits at infinity
        - Continuity: definition, types of discontinuities
        - Derivatives: definition from first principles, differentiation rules
        - Rules: power rule, product rule, quotient rule, chain rule
        - Derivatives of standard functions: sin, cos, tan, exp, ln
        - Applications: tangent lines, increasing/decreasing functions, critical points
        - Optimisation: finding local and global maxima/minima
        - Integration: antiderivatives, definite vs indefinite integrals
        - Fundamental Theorem of Calculus
        - Integration techniques: substitution, integration by parts
        """,
    },
}

# ── Models ────────────────────────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    note_text: str
    max_cards: int = 12

class GeneratePremadeRequest(BaseModel):
    deck_title: str      # e.g. "Human Anatomy II"
    max_cards: int = 15

class RateRequest(BaseModel):
    cards: List[dict]
    card_id: str
    rating: str

class CheckAnswerRequest(BaseModel):
    term: str
    definition: str
    user_answer: str

# ── Generate from user notes ──────────────────────────────────────────────────
@app.post("/flashcards/generate")
def generate_flashcards(req: GenerateRequest):
    prompt = f"""
    You are an expert educational assistant. Extract key concepts from the following notes and create up to {req.max_cards} flashcards.
    Each flashcard should have a 'term' and a 'definition'.
    Return ONLY a JSON array of objects, where each object has 'term' and 'definition' string properties.
    Do not include any markdown formatting like ```json or any other text.
    
    Notes:
    {req.note_text}
    """
    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        response_text = message.content[0].text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        cards_data = json.loads(response_text.strip())
        flashcards = [
            {"id": str(uuid.uuid4()), "term": c.get("term", ""), "definition": c.get("definition", "")}
            for c in cards_data
        ]
        return {"flashcards": flashcards[:req.max_cards]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/flashcards/generate-upload")
async def generate_flashcards_upload(
    file: Optional[UploadFile] = File(None),
    note_text: Optional[str] = Form(None),
    max_cards: int = Form(12)
):
    text_content = ""
    if note_text:
        text_content += note_text + "\n\n"
        
    if file:
        try:
            suffix = validate_upload_file(file)
            async with ephemeral_upload(file, suffix) as temp_path:
                extracted_text, _ = extract_text(temp_path, suffix)
                text_content += extracted_text
        except Exception as e:
             raise HTTPException(status_code=400, detail=str(e))

    if not text_content.strip():
        raise HTTPException(status_code=400, detail="No content provided for flashcard generation. Please add notes or upload a file.")

    prompt = f"""
    You are an expert educational assistant. Extract key concepts from the following notes and create up to {max_cards} flashcards.
    Each flashcard should have a 'term' and a 'definition'.
    Return ONLY a JSON array of objects, where each object has 'term' and 'definition' string properties.
    Do not include any markdown formatting like ```json or any other text.
    
    Notes:
    {text_content}
    """
    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        response_text = message.content[0].text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        cards_data = json.loads(response_text.strip())
        flashcards = [
            {"id": str(uuid.uuid4()), "term": c.get("term", ""), "definition": c.get("definition", "")}
            for c in cards_data
        ]
        return {"flashcards": flashcards[:max_cards]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Generate premade deck cards ───────────────────────────────────────────────
@app.post("/flashcards/generate-premade")
def generate_premade(req: GeneratePremadeRequest):
    """
    Looks up the topic by deck title and asks Claude to generate
    high-quality exam-style flashcards for that subject.
    """
    key = req.deck_title.lower().strip()
    topic = PREMADE_TOPICS.get(key)

    if topic is None:
        # Fallback: generate generic cards for whatever topic name was given
        topic_description = f"The subject of {req.deck_title} at university level."
    else:
        topic_description = topic["description"]

    prompt = f"""
You are an expert university tutor creating high-quality exam flashcards.

Topic: {req.deck_title}
Curriculum content:
{topic_description}

Create exactly {req.max_cards} flashcards for this topic.

Requirements:
- Cover a broad range of concepts across the whole topic
- Each 'term' should be a specific concept, process, structure, or definition (2-6 words)
- Each 'definition' should be a clear, precise, student-friendly explanation (1-3 sentences)
- Include a mix of: key definitions, mechanisms/processes, comparisons, and clinical/applied facts
- Do NOT repeat similar cards

Return ONLY a valid JSON array. No markdown, no prose, no code fences.
Each object must have exactly two keys: "term" and "definition".

Example format:
[{{"term": "Mitosis", "definition": "Cell division producing two genetically identical daughter cells. Occurs in 4 stages: prophase, metaphase, anaphase, telophase."}}]
"""

    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=3000,
            messages=[{"role": "user", "content": prompt}]
        )
        response_text = message.content[0].text.strip()

        # Clean up any accidental markdown fences
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        cards_data = json.loads(response_text.strip())

        flashcards = [
            {"id": str(uuid.uuid4()), "term": c.get("term", ""), "definition": c.get("definition", "")}
            for c in cards_data
        ]
        return {
            "flashcards": flashcards[:req.max_cards],
            "subject": topic["subject"] if topic else req.deck_title,
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned malformed JSON. Please try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Rate a card ───────────────────────────────────────────────────────────────
@app.post("/flashcards/rate")
def rate_flashcard(req: RateRequest):
    updated_cards = []
    for card in req.cards:
        if card.get("id") == req.card_id:
            if req.rating == "easy":
                continue
            else:
                updated_cards.append(card)
        else:
            updated_cards.append(card)
    return {"cards": updated_cards, "session_complete": len(updated_cards) == 0}


# ── Check a user's written answer ─────────────────────────────────────────────
@app.post("/flashcards/check")
def check_answer(req: CheckAnswerRequest):
    prompt = f"""
    You are an expert tutor. A student is studying flashcards.
    Term: {req.term}
    Actual Definition: {req.definition}
    Student's Answer: {req.user_answer}

    Evaluate the student's answer. Be encouraging. Keep it brief (1-3 sentences).
    Return ONLY a JSON object with two keys:
    - "correct": boolean (true if the student's answer captures the core meaning)
    - "feedback": string (your brief feedback)
    Do not include any markdown formatting.
    """
    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=700,
            messages=[{"role": "user", "content": prompt}]
        )
        response_text = message.content[0].text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        return json.loads(response_text.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
def on_startup() -> None:
    init_db()
    ensure_test_user()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

