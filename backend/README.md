# CodeQuest Backend (FastAPI)

## Setup

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and fill values.
4. Run SQL in `db/schema.sql` on Supabase.
5. Start server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API

- `GET /health`
- `GET /api/v1/`
- `POST /api/v1/chat`
- `GET /api/v1/questions/debug/supabase`
- `POST /api/v1/questions/generate`

Request body:

```json
{
  "language": "cpp",
  "step_number": 1
}
```

Behavior:
- Generates a beginner question with LangChain + OpenRouter.
- Uses 3-step progression (1 to 3).
- Stores prompt, options, answer, boilerplate code, explanation, points, and user source IP in Supabase.
