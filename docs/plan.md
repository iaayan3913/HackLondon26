# AI Study Manager - High-Level Architecture & Features

## 1. The Hub / Knowledge Base

### Overview
The central dashboard where students upload course materials (PDFs, slides, audio) and track their overall study progress.

### Core Mechanics
* **Document Upload:** Users upload files which are immediately parsed and chunked.
* **Vector Ingestion:** Text chunks are converted into embeddings and stored in a vector database to ground the AI's knowledge.
* **Analytics Dashboard:** Displays simple metrics like "Hours Focused," "Materials Digested," and "Upcoming Quizzes."

> **Hackathon Implementation Note:** Skip complex user authentication. Hardcode a single "test user" profile. Use a lightweight in-memory vector DB like ChromaDB to store document embeddings for lightning-fast retrieval during demos.

---

## 2. Transcription Studio
### Overview
A workspace to process recorded lectures or live audio into structured, readable notes that feed directly into the Knowledge Base.

### Core Mechanics
* **Media Upload:** Users can upload pre-recorded `.mp3` or `.mp4` files.
* **AI Transcription:** The audio is sent to an AI model to generate a highly accurate text transcript.
* **Note Generation:** The AI processes the raw transcript to generate a summarized, structured set of study notes.
* **Auto-Sync:** The finalized notes are automatically added to the Knowledge Base for future quiz generation.

> **Hackathon Implementation Note:** Don't rely on live recording during the demo—it's risky. Build an upload button and use OpenAI's Whisper API (or similar) for fast transcription. Have a pre-recorded 2-minute lecture ready to upload for the judges.

---

## 3. Quiz & Viva Arena

### Overview
The active recall testing ground featuring AI-generated Multiple Choice Questions (MCQs) and an interactive oral examination (Viva) mode.

### Core Mechanics
* **Context-Aware Generation:** Users select a topic from their Knowledge Base. The backend uses RAG to fetch relevant context and prompts the AI to generate a mix of MCQs and open-ended questions.
* **MCQ Mode:** Standard clickable answers with immediate system-graded feedback.
* **Viva Mode (Voice):** An open-ended question is displayed. The user holds a "Speak" button to answer orally. The system transcribes the speech and passes it to the AI to grade against the source material.

> **Hackathon Implementation Note:** For the Viva mode, use the native browser `Web Speech API` for speech-to-text. It requires zero backend setup and works perfectly in Chrome/Safari for quick voice capture.

---

## 4. Flashcard Deck
### Overview
A fast-paced, spaced-repetition interface for rote memorization of key terms and concepts extracted from study materials.

### Core Mechanics
* **One-Click Generation:** Users click "Generate Flashcards" on any saved note or transcript. The AI extracts key term/definition pairs.
* **Review Interface:** A simple front-and-back card flipping UI.
* **Self-Rating:** Users mark cards as "Easy," "Hard," or "Missed" to determine when the card should reappear.

> **Hackathon Implementation Note:** Do not build a complex spaced-repetition algorithm like Anki's SM-2 from scratch. Implement a simple array where "Missed" cards are pushed to the end of the current session's queue, and "Easy" cards are removed.

---

## 5. Deep Focus Zone

### Overview
A distraction-free timer that uses local webcam tracking to monitor student fatigue and attention, prompting breaks when necessary.

### Core Mechanics
* **Session Setup:** Users set a goal (e.g., "Review Biology Notes") and a timer.
* **Biometric Tracking:** The webcam monitors the user's face for fatigue indicators (like eye closure duration/yawning) and distraction (head pose/looking away).
* **Smart Interventions:** If the system detects sustained fatigue or distraction, a gentle modal appears suggesting a 5-minute break.

> **Hackathon Implementation Note:** All webcam processing MUST happen client-side using a library like Google MediaPipe in React. Do not stream video to your FastAPI backend. This avoids massive latency, cuts server costs to zero, and is a massive privacy selling point for the judges.