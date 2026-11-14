# AI-Powered Digital India Citizen Services and Government Scheme Assistant

Minor Project, VII Semester, Department of ECE, MAIT
Aadya Verma (35914802823) and Yavi Gupta (01514802823)

A working prototype that helps citizens find government schemes they may qualify for, see which
eligibility conditions they meet, know which documents to keep ready, and ask questions in plain language.

## Quick start (about 2 minutes)

You need Python 3.10 or newer.

```bash
cd backend
python -m venv venv
# Windows:      venv\Scripts\activate
# Mac / Linux:  source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open **http://127.0.0.1:8000** in the browser. Interactive API docs are at **http://127.0.0.1:8000/docs**.

On first start the app creates the database and loads 14 central government schemes automatically.
By default it uses a local SQLite file so it runs with no setup.

## Using PostgreSQL (as in the synopsis)

1. Start PostgreSQL. Either install it, or with Docker run `docker compose up -d` from the project root.
2. Create the database if you installed it yourself: `createdb scheme_assistant`
3. Copy `backend/.env.example` to `backend/.env` and uncomment the `DATABASE_URL` line.
4. Restart the server. Tables are created and seeded automatically.
   `database/schema.sql` has the same schema as plain SQL for the report.

To reload the scheme data at any time: `python -m app.seed --reset` (from `backend/`).

## Deploying on Render

The repo includes `render.yaml`, so Render can set up everything from it.

1. Push this folder to a GitHub repository.
2. On render.com: **New → Blueprint**, connect the repository, and click **Apply**.
   Render creates the web service and a free PostgreSQL database and links them through `DATABASE_URL`.
3. When the deploy finishes, open the `.onrender.com` link. Tables and scheme data are created automatically.

Without a database (if your Render account already has its free PostgreSQL): **New → Web Service**,
root directory `backend`, build command `pip install -r requirements.txt`, start command
`uvicorn app.main:app --host 0.0.0.0 --port $PORT`, instance type Free, and environment variable
`PYTHON_VERSION=3.12.7`. It then uses SQLite, which resets on each restart; that's fine because the app
reloads its data automatically.

Free-tier notes: the app sleeps after a period without visits and takes about a minute to wake, so open it
a few minutes before a demo. Free Render PostgreSQL databases expire 30 days after creation; the app
rebuilds its data in any new database you point it at.

## Turning on the LLM (optional)

The assistant works without any API key: it retrieves the matching scheme records and builds the answer
from them. To have an LLM write the answers, set these in `backend/.env`:

```
LLM_PROVIDER=gemini        # or openai, anthropic
LLM_API_KEY=your-key-here
```

A free Gemini key from Google AI Studio is enough. If the LLM call fails (no internet, bad key, quota),
the assistant falls back to the database answer automatically, so the demo never breaks.
The badge at the top of the Ask page shows which mode is active.

## Project structure

```
backend/
  app/
    main.py         FastAPI app: REST endpoints, insights, serves the frontend
    database.py     DB connection (PostgreSQL via DATABASE_URL, SQLite fallback)
    models.py       Tables: users, schemes, eligibility, documents, applications
    schemas.py      Request/response models (Pydantic)
    matching.py     Scheme discovery + eligibility engine (Modules 6.3, 6.4)
    ai.py           AI assistant: language, intent, dialogue manager, retrieval, LLM/template generation
    extract.py      Natural-language profile extraction (English, Hindi, Hinglish)
    i18n.py         Hindi/English text, interview questions, Hindi condition labels
    seed_data.py    The 14 schemes with criteria, documents, steps, Hindi text and benefit values
    seed.py         Creates tables, loads schemes and demo profiles
  requirements.txt
  .env.example
frontend/
  index.html          App shell (header, navigation, sheets)
  styles.css          Design system: colour, type and spacing tokens, components, responsive rules
  fonts/              Self-hosted Manrope + Noto Sans Devanagari (OFL)
  js/app.js           Entry point: routing, language switch, live profile sync
  js/state.js, api.js, router.js, i18n.js, ui.js, profile.js, voice.js   Shared modules
  js/views/           home, check (multi-step), results, detail sheet, ask, schemes, insights
database/
  schema.sql        PostgreSQL schema
docker-compose.yml  Optional PostgreSQL container
```

## What makes it stand out

| Feature | What it does |
|---|---|
| **Describe yourself** | Type or speak one sentence ("I'm a 45 year old farmer from Bihar, earn 1 lakh, have a BPL card") and the whole form fills itself, fields flashing as they're filled. Works in English, Hindi and Hinglish. |
| **Voice in and out** | Speak to the assistant or the profile box (Web Speech API, `en-IN` / `hi-IN`), and have answers read aloud. Built for citizens who find typing hard. |
| **Conversational eligibility interview** | Ask "Am I eligible for Ujjwala?" and the assistant asks only the questions it still needs, one at a time, with tap-to-answer buttons, then gives a condition-by-condition verdict. |
| **Full Hindi mode** | One toggle switches the whole interface to Hindi. The assistant replies in Hindi whenever you write in Hindi or Hinglish. Condition labels in Hindi are generated from the rules themselves. |
| **Benefit value summary** | "Together, you could be getting ₹6,000 a year in cash, ₹9 lakh of insurance and health cover…" computed from the schemes you qualify for. |
| **Live what-if** | After the first search, results update instantly as you change any answer, and every non-match shows exactly which condition failed. |
| **Personal document plan + report** | One combined checklist across all your schemes (Aadhaar needed for 6, etc.), and a printable / save-as-PDF report with schemes, benefits, helplines and documents. |
| **Side-by-side comparison** | Pick up to 3 schemes on All schemes, or ask "Compare PMJJBY and PMSBY". |
| **Insights dashboard** | For officials: demand by scheme, "near misses" (citizens one condition away from a scheme, such as a missing bank account or BPL status), questions people skip, and who is using the service. |
| **Typos and follow-ups** | "ujwala", "ayushmaan" still work; "what documents?" after discussing a scheme answers for that scheme. |

## Interface

| Page | What it does |
|---|---|
| **Home** | One AI search box: describe yourself and it opens your results; ask a question and it goes to the assistant. Category tiles, most-used schemes, how it works. |
| **Eligibility check** | Five steps with a progress bar and a live count of matching schemes. Pre-filled from anything typed, spoken or said in chat. |
| **My results** | Summary figures (eligible schemes, yearly cash, cover, loans), tabs for Eligible / Needs answers / Not eligible, expandable conditions, missing information that links to the right question, a combined document checklist and a printable report. |
| **Assistant** | Conversation with quick replies, scheme cards and comparison tables; side panel with suggested questions and the details it has learned. |
| **All schemes** | Search, category filter, sorting (including "best match for me"), cards and side-by-side comparison. |
| **Insights** | Filters (occupation, area, gender, scheme category), headline figures and charts with a table view. Uses `GET /api/insights` with optional filter parameters. |

## How it maps to the synopsis

| Synopsis module | Where it lives |
|---|---|
| 6.1 User Information | Profile form + natural-language extraction (`extract.py`), `users` table |
| 6.2 Scheme Database | `schemes`, `eligibility`, `documents`, `applications` tables; `seed_data.py` (English + Hindi) |
| 6.3 Discovery & Matching | `matching.match()`; `POST /api/match`; ranked results with value summary |
| 6.4 Eligibility Assistance | `matching.evaluate()`; per-condition checklist; chat interview |
| 6.5 Documents & Requirements | Detail panel, combined document plan, printable report |
| 6.6 AI Assistance | `ai.py` (dialogue manager + RAG); `POST /api/chat` |

### Eligibility engine
Each condition is stored as a row (`criterion`, `operator`, `condition_value`) so new schemes need no code
changes. Rows with the same `group_no` must all hold (AND); separate groups are alternative routes (OR).
Example: Ayushman Bharat is "BPL family" **or** "age 70+". Each condition evaluates to met, not met, or
unknown (the user didn't answer), and every scheme gets one of three results:
likely eligible, needs more answers, or not a match. It never gives an official decision.

### AI assistant: how it works
The assistant is a layered pipeline, not a single chatbot call:

1. **Language detection** – Devanagari or Hinglish words → reply in Hindi.
2. **Understanding** – intent detection (documents, benefits, apply, eligibility, discover, compare, greeting…),
   profile extraction from free text (age, income in "1.5 lakh" form, gender, work, state/city, BPL, land, LPG,
   daughter's age, negations like "no gas connection", and facts about *other* people such as "my mother" are ignored),
   and fuzzy scheme-name recognition.
3. **Dialogue manager** – keeps interview state across turns and asks only for missing facts.
4. **Retrieval** – TF-IDF-style keyword scoring with English/Hindi synonyms, personalised so schemes the user
   can actually use rank higher.
5. **Decision** – eligibility verdicts always come from the rule engine, never from the LLM, so they are
   deterministic, explainable and can't be hallucinated.
6. **Generation** – with an LLM key, the LLM writes explanations grounded only in the retrieved records (RAG).
   Without one, templates produce the answer, so everything works offline.

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Status, scheme count, AI mode |
| GET | `/api/schemes?q=&sector=` | List / search schemes |
| GET | `/api/schemes/{id}` | Full scheme details (English + Hindi) |
| GET | `/api/sectors` | Sector list for filters |
| POST | `/api/match` | Profile → ranked schemes, value summary, combined document plan |
| POST | `/api/eligibility/{id}` | Condition-by-condition check for one scheme |
| POST | `/api/extract` | Free text → profile fields |
| POST | `/api/chat` | Conversational assistant (intent, interview state, cards, quick replies, tables) |
| GET | `/api/insights?occupation=&area=&gender=&state=&sector=` | Aggregate analytics across all profiles, optionally filtered |

The Insights dashboard starts with 120 synthetic demo profiles (generated with a fixed seed in `seed.py`)
so it has data to show; every real profile checked in the app is added on top.

## Demo script (7 minutes)

1. **Find schemes** → in the yellow box, type or *speak*: "I'm a 34 year old woman farmer from a village in Bihar,
   family income 1 lakh, BPL card, own 2 acres, no gas connection, my daughter is 6". Watch the form fill itself
   and the results appear with the benefit value at the top.
2. Toggle "Did anyone pay income tax?" to Yes: results change instantly, and PM-KISAN moves to "Not a match"
   with the reason shown.
3. Scroll to the combined document checklist, then click **Download my report** (save as PDF).
4. **Ask the assistant** → click "Am I eligible for Ujjwala?" and answer by tapping buttons. Then type
   "compare pmjjby and pmsby". Then switch to **हिंदी** and ask "क्या मैं अटल पेंशन के लिए पात्र हूँ?" or use the mic.
   Tick "Read answers aloud".
5. **Insights** → show demand by scheme and the near-misses panel ("67 people are one condition away from Ayushman
   Bharat: BPL status").
6. Open **/docs** to show the REST API.

## Schemes included
PM-KISAN, Ayushman Bharat PM-JAY, PMAY-Urban 2.0, PM Ujjwala Yojana, Sukanya Samriddhi Yojana,
Atal Pension Yojana, PMJJBY, PMSBY, Post Matric Scholarship for SC Students, PM Vishwakarma,
PM Mudra Yojana, Stand-Up India, PM Matru Vandana Yojana, IGNOAPS.

Scheme details were compiled from the official portals listed with each scheme. Amounts and rules
change, so the app always links to the official source and treats its output as guidance only.

## Adding a scheme
Add an entry to `backend/app/seed_data.py` following the existing format, then run
`python -m app.seed --reset`. No other code changes are needed.
