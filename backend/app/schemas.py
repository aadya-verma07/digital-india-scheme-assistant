# =====================================================================================
# FILE: schemas.py  -  shapes of the data the API accepts (Pydantic models)
# -------------------------------------------------------------------------------------
# FastAPI uses these classes to check every incoming JSON request BEFORE our code runs.
# Wrong types or out-of-range values (age 200, negative income) are rejected automatically
# with an HTTP 422 error. They also appear in the interactive API docs at /docs.
# =====================================================================================

"""Request/response models."""
from pydantic import BaseModel, Field


# Profile: everything we may know about a citizen. Every field is optional (None = not answered),
# which is what lets the rule engine say "unknown" and ask for missing details.
# Field names match the `criterion` column of the eligibility table.
class Profile(BaseModel):
    name: str | None = None
    age: int | None = Field(None, ge=0, le=120)
    gender: str | None = None            # male / female / other
    state: str | None = None
    area: str | None = None              # rural / urban
    category: str | None = None          # General / OBC / SC / ST
    income: int | None = Field(None, ge=0)
    occupation: str | None = None
    education: str | None = None         # none / school / post_matric / graduate / postgraduate
    # Yes/no facts (True / False / None = not answered):
    bpl: bool | None = None
    owns_land: bool | None = None
    owns_pucca_house: bool | None = None
    has_lpg: bool | None = None
    has_bank_account: bool | None = None
    income_tax_payer: bool | None = None
    has_girl_child_under_10: bool | None = None
    pregnant_or_lactating: bool | None = None


# MatchRequest: body of POST /api/match.
# save=True also stores the profile in the users table (used for admin insights).
class MatchRequest(BaseModel):
    profile: Profile
    save: bool = False


# ChatTurn: one earlier message in the chat (role = 'user' or 'assistant'), sent as history to the optional LLM.
class ChatTurn(BaseModel):
    role: str
    content: str


# ChatRequest: body of POST /api/chat.
# The server keeps no memory between messages, so the browser sends the whole context each time:
# the message, what we know about the user, which question is pending and the interview state.
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    profile: Profile | None = None
    scheme_id: int | None = None           # scheme currently being discussed (for follow-up questions)
    history: list[ChatTurn] = []
    pending_field: str | None = None       # question the assistant just asked
    answer_value: bool | int | str | None = None   # value of a tapped quick-reply answer
    interview: dict | None = None          # interview state returned by the previous turn
    lang: str | None = None                # preferred language: en / hi


# ExtractRequest: body of POST /api/extract - one free-text sentence to read profile details from.
class ExtractRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
