-- PostgreSQL schema for the Digital India Scheme Assistant (Section 9 of the synopsis).
-- The app creates these tables automatically via SQLAlchemy; this file documents the design
-- and can be run manually:  psql -U postgres -d scheme_assistant -f database/schema.sql

CREATE TABLE IF NOT EXISTS users (
    user_id      SERIAL PRIMARY KEY,
    name         VARCHAR(120),
    age          INTEGER,
    gender       VARCHAR(20),
    education    VARCHAR(40),
    occupation   VARCHAR(40),
    income       INTEGER,              -- annual family income in INR
    location     VARCHAR(80),          -- state
    area         VARCHAR(10),          -- rural / urban
    category     VARCHAR(10),          -- General / OBC / SC / ST
    extra        TEXT,                 -- JSON of yes/no answers
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schemes (
    scheme_id             SERIAL PRIMARY KEY,
    slug                  VARCHAR(60) UNIQUE NOT NULL,
    scheme_name           VARCHAR(160) NOT NULL,
    ministry              VARCHAR(160) NOT NULL,
    sector                VARCHAR(40) NOT NULL,
    description           TEXT NOT NULL,
    target_beneficiaries  TEXT NOT NULL,
    benefits              TEXT NOT NULL,
    official_source       VARCHAR(255) NOT NULL
);

-- One row per condition. Same group_no = AND; different group_no = OR.
CREATE TABLE IF NOT EXISTS eligibility (
    eligibility_id   SERIAL PRIMARY KEY,
    scheme_id        INTEGER NOT NULL REFERENCES schemes(scheme_id) ON DELETE CASCADE,
    group_no         INTEGER NOT NULL DEFAULT 1,
    criterion        VARCHAR(40) NOT NULL,   -- profile field e.g. 'age', 'income', 'bpl'
    operator         VARCHAR(10) NOT NULL,   -- eq | neq | gte | lte | between | in
    condition_value  TEXT NOT NULL,          -- JSON value e.g. '18', '[18,40]', '"farmer"'
    label            VARCHAR(200) NOT NULL   -- plain-language text shown to users
);

CREATE TABLE IF NOT EXISTS documents (
    document_id    SERIAL PRIMARY KEY,
    scheme_id      INTEGER NOT NULL REFERENCES schemes(scheme_id) ON DELETE CASCADE,
    document_name  VARCHAR(160) NOT NULL,
    description    TEXT,
    mandatory      BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS applications (
    application_id  SERIAL PRIMARY KEY,
    scheme_id       INTEGER UNIQUE NOT NULL REFERENCES schemes(scheme_id) ON DELETE CASCADE,
    mode            VARCHAR(40) NOT NULL,   -- Online / Offline / Online & Offline
    steps           TEXT NOT NULL,          -- JSON list of steps
    apply_url       VARCHAR(255),
    helpline        VARCHAR(80)
);

CREATE INDEX IF NOT EXISTS idx_eligibility_scheme ON eligibility(scheme_id);
CREATE INDEX IF NOT EXISTS idx_documents_scheme   ON documents(scheme_id);
CREATE INDEX IF NOT EXISTS idx_schemes_sector     ON schemes(sector);
