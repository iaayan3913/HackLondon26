# Quiz & Viva Arena

An AI-powered educational application for generating, reviewing, and evaluating flashcards. Designed to enhance studying with LLM-assisted answer validation and targeted feedback.

## Features

- **AI Flashcard Generation**: Ingests raw notes and leverages Claude 3 to generate concise, exam-style flashcards.
- **Premade University-level Decks**: Instantly generate comprehensive flashcards for topics like Human Anatomy II, Microbiology, Organic Chemistry, and Calculus I.
- **Intelligent Answer Checking**: Free-text answers are evaluated by AI, providing an accuracy score and brief, encouraging feedback based on the core meaning, rather than exact string matching.
- **AI Quiz Generation**: Upload your study materials to automatically generate interactive quizzes with both multiple-choice and open-ended questions using Gemini.
- **Interactive Quizzes & AI Grading**: Complete quizzes interactively with live AI evaluation, scoring, and detailed feedback for open-ended answers.
- **Dynamic Frontend**: Modern UI with rating mechanisms to assess confidence levels for active recall and spaced repetition.

## Tech Stack

- **Frontend**: React 19, React Router, TailwindCSS 4, Vite
- **Backend**: FastAPI, SQLAlchemy (SQLite), Pydantic
- **AI Models**: Anthropic Claude 3 Haiku & Google Gemini 3.0 Flash

## Prerequisites

- Node.js (v18+)
- Python (3.9+)
- Anthropic API Key (Claude)
- Google Gemini API Key

## Getting Started

### 1. Setting up the Backend

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd src
   ```

2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the project root with your API key:
   ```env
   GEMINI_API_KEY="your_google_gemini_api_key_here"
   GEMINI_MODEL="gemini-3-flash-preview"
   CLAUDE_API_KEY="your_anthropic_api_key_here"
   CLAUDE_MODEL="claude-3-haiku-20240307"
   ```

5. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will start and be available at `http://localhost:8000`. You can visit `http://localhost:8000/docs` to test the API endpoints using Swagger UI.

### 2. Setting up the Frontend

1. Open a new terminal and navigate to the client directory:
   ```bash
   cd client
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`. Make sure the Python backend is running so the frontend can properly call APIs.

## Folder Structure

- `/src` - FastAPI application, routers, database models, and Claude AI integration logic.
- `/client` - React frontend powered by Vite, utilizing Tailwind for responsive styling.
