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
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/`
- `POST /api/v1/chat`
- `GET /api/v1/questions/debug/supabase`
- `POST /api/v1/questions/generate`

Request body:

```json
{
  "language": "cpp",
  "step_number": 1,
  "previous_answer_correct": false
}
```

Behavior:
- Auth is required for `/chat` and `/questions/generate` with Bearer token.
- Daily rate limit is enforced per user and source IP (`RATE_LIMIT_DAILY_MAX`, default `10`).
- Generates adaptive questions with step progression and previous-answer difficulty control.
- Stores questions and API usage records in Supabase.
