CREATE TABLE IF NOT EXISTS applications (
    id       BIGSERIAL PRIMARY KEY,
    company  VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL
);
