# =====================================================================================
# FILE: database.py  -  the database connection
# -------------------------------------------------------------------------------------
# Every other backend file gets its database access from here.
# - Reads the DATABASE_URL environment variable (set automatically on Render, or in .env).
# - If it is set, connects to PostgreSQL; if not, creates a local SQLite file schemes.db,
#   so the project runs on any laptop with zero setup.
# - Provides `Base` (parent class of all tables in models.py) and `get_db()`
#   (gives each API request its own database session).
# =====================================================================================

"""Database connection.

Uses PostgreSQL when DATABASE_URL is set (see .env.example).
Falls back to a local SQLite file so the prototype runs with zero setup.
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Load variables from backend/.env (if the file exists) into the environment.
load_dotenv()

# Database address. Default = SQLite file in the backend folder.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./schemes.db")
# Render and similar hosts give "postgres://..." or "postgresql://..." URLs; use the psycopg (v3) driver for both
for prefix in ("postgres://", "postgresql://"):
    if DATABASE_URL.startswith(prefix):
        DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len(prefix):]
# SQLite only: allow the connection to be used from FastAPI's worker threads.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# engine       = the connection pool to the database.
# pool_pre_ping = test each connection before using it (free cloud databases drop idle connections).
# SessionLocal = a factory that creates a new session (a "conversation" with the database).
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


# Base class for every table class in models.py. SQLAlchemy uses it to know which tables exist.
class Base(DeclarativeBase):
    pass


# get_db(): FastAPI "dependency" used by every endpoint (Depends(get_db) in main.py).
# Opens a session for one request, hands it to the endpoint (yield), and always closes it
# afterwards - even if the request fails - so connections are never leaked.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
