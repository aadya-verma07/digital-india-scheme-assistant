"""Request/response models."""
from pydantic import BaseModel, Field


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
    bpl: bool | None = None
    owns_land: bool | None = None
    owns_pucca_house: bool | None = None
    has_lpg: bool | None = None
    has_bank_account: bool | None = None
    income_tax_payer: bool | None = None
    has_girl_child_under_10: bool | None = None
    pregnant_or_lactating: bool | None = None


class MatchRequest(BaseModel):
    profile: Profile
    save: bool = False


class ChatTurn(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    profile: Profile | None = None
    scheme_id: int | None = None           # scheme currently being discussed (for follow-up questions)
    history: list[ChatTurn] = []
    pending_field: str | None = None       # question the assistant just asked
    answer_value: bool | int | str | None = None   # value of a tapped quick-reply answer
    interview: dict | None = None          # interview state returned by the previous turn
    lang: str | None = None                # preferred language: en / hi


class ExtractRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
