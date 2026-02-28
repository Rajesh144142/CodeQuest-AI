# CodeQuest AI

CodeQuest AI is an adaptive coding learning app for beginners.

It currently includes:
- A React + TypeScript frontend (Vite, Tailwind, TanStack Query, Zustand)
- A FastAPI backend that generates coding questions using LangChain with `openai/gpt-4o-mini`
- Step-based learning for `C++` and `Python`
- Dynamic difficulty: if the previous answer is correct, the next question gets harder
- JWT authentication (register/login) for protected APIs
- Daily rate limiting per user + IP (default 10 requests/day per endpoint)

## Project Structure

- `frontend/`: learner UI, quiz flow, score tracking, API integration
- `backend/`: question generation API, chat memory API, optional Supabase integration

## Current Flow

1. Frontend requests a question from backend:
   - `POST /api/v1/questions/generate`
2. Backend calls the configured LLM (`openai/gpt-4o-mini` for questions) with a structured prompt and returns JSON:
   - prompt
   - options
   - answer index/text
   - boilerplate code
   - explanation
   - points
3. Frontend checks user answer and updates points in Zustand.
4. Next question difficulty adapts based on previous correctness.

## Backend Quick Start

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` from `.env.example` and set:
- `OPENROUTER_API_KEY` (provider API key)
- `OPENROUTER_MODEL=openai/gpt-4o-mini` (question generation)
- `OPENROUTER_CHAT_MODEL=arcee-ai/trinity-large-preview:free` (chat memory endpoint)

Run:

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Useful endpoints:
- `GET /health`
- `GET /api/v1/`
- `POST /api/v1/chat`
- `POST /api/v1/questions/generate`

## Frontend Quick Start

```bash
cd frontend
npm install
```

Create `.env` from `.env.example`:
- `VITE_API_BASE_URL=http://localhost:8000`

Run:

```bash
npm run dev
```

## Notes

- Supabase persistence is currently disabled in question generation route for now.
- Do not commit `.env` files or API keys.
