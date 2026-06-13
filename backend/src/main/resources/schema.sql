CREATE TABLE IF NOT EXISTS applications (
    id                   BIGSERIAL PRIMARY KEY,
    company              VARCHAR(255)     NOT NULL,
    position             VARCHAR(255)     NOT NULL,
    status               VARCHAR(255)      NOT NULL DEFAULT 'DRAFT',
    phase                VARCHAR(255)      NOT NULL DEFAULT '',
    location             VARCHAR(255)     NOT NULL DEFAULT '',
    salary_mode          VARCHAR(255)      NOT NULL DEFAULT 'NONE',
    salary_amount        DOUBLE PRECISION,
    salary_min           DOUBLE PRECISION,
    salary_max           DOUBLE PRECISION,
    salary_currency      VARCHAR(255)       NOT NULL DEFAULT 'EUR',
    salary_period        VARCHAR(255)      NOT NULL DEFAULT 'YEAR',
    salary               VARCHAR(255)      NOT NULL DEFAULT '',
    application_deadline VARCHAR(255)      NOT NULL DEFAULT '',
    next_action          VARCHAR(255)      NOT NULL DEFAULT '',
    notes                TEXT             NOT NULL DEFAULT '',
    created_at           TIMESTAMPTZ      NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS application_history (
    seq             BIGSERIAL PRIMARY KEY,
    id              VARCHAR(255)  NOT NULL UNIQUE,
    application_id  BIGINT       NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    type            VARCHAR(255)  NOT NULL,
    previous_status VARCHAR(255),
    new_status      VARCHAR(255),
    text            TEXT         NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    undone_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_application_history_application
    ON application_history (application_id);
