# =====================================================================================
# FILE: models.py  -  the database tables, written as Python classes (SQLAlchemy ORM)
# -------------------------------------------------------------------------------------
# Each class below = one table. Each `mapped_column(...)` = one column.
# When the app starts, seed.py calls Base.metadata.create_all(), which creates any table
# that does not exist yet - this is how the database is created; no SQL is written by hand.
#
# Tables:  users         - every saved citizen profile (submissions + 120 demo profiles)
#          schemes       - one row per government scheme
#          eligibility   - one row per eligibility condition of a scheme   (scheme 1 : N rules)
#          documents     - documents a scheme needs                         (scheme 1 : N documents)
#          applications  - how to apply for a scheme                        (scheme 1 : 1 application)
#          app_meta      - small key/value table (version of the loaded scheme data)
# =====================================================================================

"""ORM models — mirror Section 9 (Database Design) of the synopsis."""
import json
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


# User -> table "users". One row is added each time a citizen finishes the checker or searches
# from the homepage (POST /api/match with save=true). Used by the admin Insights page.
class User(Base):
    __tablename__ = "users"
    # Primary key: a unique number given automatically to each row.
    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str | None] = mapped_column(String(120))
    age: Mapped[int | None] = mapped_column(Integer)
    gender: Mapped[str | None] = mapped_column(String(20))
    education: Mapped[str | None] = mapped_column(String(40))
    occupation: Mapped[str | None] = mapped_column(String(40))
    income: Mapped[int | None] = mapped_column(Integer)          # annual family income (INR)
    location: Mapped[str | None] = mapped_column(String(80))     # state
    area: Mapped[str | None] = mapped_column(String(10))         # rural / urban
    category: Mapped[str | None] = mapped_column(String(10))     # General / OBC / SC / ST
    # The 8 yes/no answers (bpl, has_lpg, ...) are stored together as JSON text, so new questions need no new column.
    extra: Mapped[str | None] = mapped_column(Text)              # JSON of yes/no answers
    # Time the profile was saved (filled automatically).
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# Scheme -> table "schemes". General information about one scheme, in English and Hindi.
class Scheme(Base):
    __tablename__ = "schemes"
    scheme_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Short unique code used inside the app, e.g. 'pm-kisan', 'atal-pension'.
    slug: Mapped[str] = mapped_column(String(60), unique=True)
    scheme_name: Mapped[str] = mapped_column(String(160))
    ministry: Mapped[str] = mapped_column(String(160))
    # Category shown on the website, e.g. 'Agriculture', 'Health', 'Pension'.
    sector: Mapped[str] = mapped_column(String(40))
    description: Mapped[str] = mapped_column(Text)
    target_beneficiaries: Mapped[str] = mapped_column(Text)
    benefits: Mapped[str] = mapped_column(Text)
    official_source: Mapped[str] = mapped_column(String(255))
    # Hindi versions of the name, summary and benefits:
    name_hi: Mapped[str | None] = mapped_column(String(200))
    summary_hi: Mapped[str | None] = mapped_column(Text)
    benefits_hi: Mapped[str | None] = mapped_column(Text)
    value_json: Mapped[str | None] = mapped_column(Text)      # estimated benefit values (JSON list)

    # values: turns the JSON text in value_json into a Python list such as
    # [{"type": "annual_cash", "amount": 6000, "label": "Rs 6,000 a year"}] - used for the benefit totals.
    @property
    def values(self) -> list[dict]:
        return [dict(type=t, amount=a, label=l) for t, a, l in json.loads(self.value_json or "[]")]

    # Relationships (links to the child tables). They let the code write scheme.criteria,
    # scheme.documents and scheme.application instead of writing SQL joins.
    # cascade="all, delete-orphan" = deleting a scheme also deletes its rules, documents and application row.
    criteria: Mapped[list["Eligibility"]] = relationship(back_populates="scheme", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]] = relationship(back_populates="scheme", cascade="all, delete-orphan")
    application: Mapped["ApplicationInfo"] = relationship(back_populates="scheme", uselist=False, cascade="all, delete-orphan")


# Eligibility -> table "eligibility". THE RULES. Each row is one condition, stored as data:
#     criterion (which profile field) + operator (how to compare) + condition_value (compare with what)
# Example row for Atal Pension:  group_no=1, criterion="age", operator="between", value=[18, 40]
# matching.py reads these rows to decide eligibility, so a new scheme needs no new code.
class Eligibility(Base):
    """One row per condition. Rows sharing a group_no are AND-ed;
    different groups are OR-ed (e.g. 'age 70+' OR 'BPL family')."""
    __tablename__ = "eligibility"
    eligibility_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Foreign key: which scheme this rule belongs to.
    scheme_id: Mapped[int] = mapped_column(ForeignKey("schemes.scheme_id", ondelete="CASCADE"))
    # Rules with the same group_no must ALL be true (AND); different groups are alternatives (OR).
    group_no: Mapped[int] = mapped_column(Integer, default=1)
    criterion: Mapped[str] = mapped_column(String(40))        # profile field, e.g. "age"
    operator: Mapped[str] = mapped_column(String(10))         # eq, neq, gte, lte, between, in
    condition_value: Mapped[str] = mapped_column(Text)        # JSON-encoded value
    label: Mapped[str] = mapped_column(String(200))           # plain-language version
    scheme: Mapped[Scheme] = relationship(back_populates="criteria")

    # value: the condition value decoded from JSON (e.g. the text '[18, 40]' becomes the list [18, 40]).
    @property
    def value(self):
        return json.loads(self.condition_value)


# Document -> table "documents". One document a scheme needs (e.g. Aadhaar card), with a short description.
class Document(Base):
    __tablename__ = "documents"
    document_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scheme_id: Mapped[int] = mapped_column(ForeignKey("schemes.scheme_id", ondelete="CASCADE"))
    document_name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text)
    # True = required, False = only needed in some cases.
    mandatory: Mapped[bool] = mapped_column(Boolean, default=True)
    scheme: Mapped[Scheme] = relationship(back_populates="documents")


# ApplicationInfo -> table "applications". How to apply for a scheme: mode (online/offline),
# numbered steps (stored as a JSON list), the official application link and the helpline number.
class ApplicationInfo(Base):
    __tablename__ = "applications"
    application_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scheme_id: Mapped[int] = mapped_column(ForeignKey("schemes.scheme_id", ondelete="CASCADE"), unique=True)
    mode: Mapped[str] = mapped_column(String(40))             # Online / Offline / Online & Offline
    steps: Mapped[str] = mapped_column(Text)                  # JSON list of steps
    apply_url: Mapped[str | None] = mapped_column(String(255))
    helpline: Mapped[str | None] = mapped_column(String(80))
    scheme: Mapped[Scheme] = relationship(back_populates="application")


# AppMeta -> table "app_meta". Stores a fingerprint of seed_data.py so seed.py knows when the scheme data changed.
class AppMeta(Base):
    """Key/value store, used to know which version of the scheme data is loaded."""
    __tablename__ = "app_meta"
    key: Mapped[str] = mapped_column(String(40), primary_key=True)
    value: Mapped[str] = mapped_column(String(80))
