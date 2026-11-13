"""ORM models — mirror Section 9 (Database Design) of the synopsis."""
import json
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


class User(Base):
    __tablename__ = "users"
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
    extra: Mapped[str | None] = mapped_column(Text)              # JSON of yes/no answers
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Scheme(Base):
    __tablename__ = "schemes"
    scheme_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(60), unique=True)
    scheme_name: Mapped[str] = mapped_column(String(160))
    ministry: Mapped[str] = mapped_column(String(160))
    sector: Mapped[str] = mapped_column(String(40))
    description: Mapped[str] = mapped_column(Text)
    target_beneficiaries: Mapped[str] = mapped_column(Text)
    benefits: Mapped[str] = mapped_column(Text)
    official_source: Mapped[str] = mapped_column(String(255))
    name_hi: Mapped[str | None] = mapped_column(String(200))
    summary_hi: Mapped[str | None] = mapped_column(Text)
    benefits_hi: Mapped[str | None] = mapped_column(Text)
    value_json: Mapped[str | None] = mapped_column(Text)      # estimated benefit values (JSON list)

    @property
    def values(self) -> list[dict]:
        return [dict(type=t, amount=a, label=l) for t, a, l in json.loads(self.value_json or "[]")]

    criteria: Mapped[list["Eligibility"]] = relationship(back_populates="scheme", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]] = relationship(back_populates="scheme", cascade="all, delete-orphan")
    application: Mapped["ApplicationInfo"] = relationship(back_populates="scheme", uselist=False, cascade="all, delete-orphan")


class Eligibility(Base):
    """One row per condition. Rows sharing a group_no are AND-ed;
    different groups are OR-ed (e.g. 'age 70+' OR 'BPL family')."""
    __tablename__ = "eligibility"
    eligibility_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scheme_id: Mapped[int] = mapped_column(ForeignKey("schemes.scheme_id", ondelete="CASCADE"))
    group_no: Mapped[int] = mapped_column(Integer, default=1)
    criterion: Mapped[str] = mapped_column(String(40))        # profile field, e.g. "age"
    operator: Mapped[str] = mapped_column(String(10))         # eq, neq, gte, lte, between, in
    condition_value: Mapped[str] = mapped_column(Text)        # JSON-encoded value
    label: Mapped[str] = mapped_column(String(200))           # plain-language version
    scheme: Mapped[Scheme] = relationship(back_populates="criteria")

    @property
    def value(self):
        return json.loads(self.condition_value)


class Document(Base):
    __tablename__ = "documents"
    document_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scheme_id: Mapped[int] = mapped_column(ForeignKey("schemes.scheme_id", ondelete="CASCADE"))
    document_name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text)
    mandatory: Mapped[bool] = mapped_column(Boolean, default=True)
    scheme: Mapped[Scheme] = relationship(back_populates="documents")


class ApplicationInfo(Base):
    __tablename__ = "applications"
    application_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scheme_id: Mapped[int] = mapped_column(ForeignKey("schemes.scheme_id", ondelete="CASCADE"), unique=True)
    mode: Mapped[str] = mapped_column(String(40))             # Online / Offline / Online & Offline
    steps: Mapped[str] = mapped_column(Text)                  # JSON list of steps
    apply_url: Mapped[str | None] = mapped_column(String(255))
    helpline: Mapped[str | None] = mapped_column(String(80))
    scheme: Mapped[Scheme] = relationship(back_populates="application")


class AppMeta(Base):
    """Key/value store, used to know which version of the scheme data is loaded."""
    __tablename__ = "app_meta"
    key: Mapped[str] = mapped_column(String(40), primary_key=True)
    value: Mapped[str] = mapped_column(String(80))
