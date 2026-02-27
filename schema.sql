

CREATE TABLE blocks (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,
    description     TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE unit_types (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(30) NOT NULL UNIQUE, -- e.g. APARTMENT, VILLA, PLOT
    name            VARCHAR(100) NOT NULL,
    description     TEXT
);

-- =========================
-- Members, application users, units, ownership & residents
-- =========================

CREATE TABLE members (
    id                  BIGSERIAL PRIMARY KEY,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100),
    email               VARCHAR(255) NOT NULL UNIQUE,
    phone_primary       VARCHAR(30) NOT NULL,
    phone_secondary     VARCHAR(30),
    ownership_status    VARCHAR(10) NOT NULL
        CHECK (ownership_status IN ('OWNER', 'TENANT', 'BOTH')),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Application users (admin, staff, resident login accounts)
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    role            VARCHAR(20) NOT NULL
        CHECK (role IN ('ADMIN', 'RESIDENT', 'STAFF')),
    member_id       BIGINT REFERENCES members(id) ON DELETE SET NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE member_family_members (
    id              BIGSERIAL PRIMARY KEY,
    member_id       BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    full_name       VARCHAR(200) NOT NULL,
    relation        VARCHAR(100) NOT NULL, -- e.g. Spouse, Son, Daughter, Parent
    age             INT,
    phone           VARCHAR(30)
);

CREATE TABLE units (
    id                  BIGSERIAL PRIMARY KEY,
    unit_number         VARCHAR(50) NOT NULL, -- e.g. A-101
    block_id            BIGINT REFERENCES blocks(id) ON DELETE SET NULL,
    floor               INT,
    unit_type_id        BIGINT NOT NULL REFERENCES unit_types(id),
    area_sq_ft          NUMERIC(10,2),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    default_maint_charge NUMERIC(12,2) DEFAULT 0,
    default_utility_charge NUMERIC(12,2) DEFAULT 0,
    UNIQUE (unit_number, block_id)
);

-- Ownership history (sales/transfers)
CREATE TABLE unit_ownerships (
    id                  BIGSERIAL PRIMARY KEY,
    unit_id             BIGINT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    owner_member_id     BIGINT NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    from_date           DATE NOT NULL,
    to_date             DATE,
    purchase_price      NUMERIC(14,2),
    sale_price          NUMERIC(14,2),
    remarks             TEXT,
    CONSTRAINT chk_ownership_dates CHECK (to_date IS NULL OR to_date >= from_date)
);

-- Occupancy / tenancy & primary contacts
CREATE TABLE unit_residents (
    id                  BIGSERIAL PRIMARY KEY,
    unit_id             BIGINT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    member_id           BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    role                VARCHAR(20) NOT NULL
        CHECK (role IN ('OWNER', 'TENANT', 'FAMILY')),
    is_primary_contact  BOOLEAN NOT NULL DEFAULT FALSE,
    from_date           DATE NOT NULL,
    to_date             DATE,
    CONSTRAINT chk_resident_dates CHECK (to_date IS NULL OR to_date >= from_date)
);

CREATE INDEX idx_unit_residents_unit ON unit_residents(unit_id);
CREATE INDEX idx_unit_residents_member ON unit_residents(member_id);

CREATE TABLE vehicles (
    id                  BIGSERIAL PRIMARY KEY,
    member_id           BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    unit_id             BIGINT REFERENCES units(id) ON DELETE SET NULL,
    registration_number VARCHAR(50) NOT NULL,
    vehicle_type        VARCHAR(50), -- e.g. Car, Bike
    brand               VARCHAR(100),
    color               VARCHAR(50),
    sticker_number      VARCHAR(50),
    UNIQUE (registration_number)
);

-- =========================
-- Financial management & billing
-- =========================

CREATE TABLE charge_types (
    id                  BIGSERIAL PRIMARY KEY,
    code                VARCHAR(50) NOT NULL UNIQUE, -- e.g. MAINTENANCE, WATER, PARKING
    name                VARCHAR(100) NOT NULL,
    billing_frequency   VARCHAR(20) NOT NULL
        CHECK (billing_frequency IN ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
    calculation_method  VARCHAR(20) NOT NULL
        CHECK (calculation_method IN ('FIXED', 'PER_SQFT', 'METERED')),
    description         TEXT
);

-- Unit specific charge configuration (overrides defaults if needed)
CREATE TABLE unit_charges (
    id                  BIGSERIAL PRIMARY KEY,
    unit_id             BIGINT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    charge_type_id      BIGINT NOT NULL REFERENCES charge_types(id) ON DELETE CASCADE,
    amount              NUMERIC(12,2) NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (unit_id, charge_type_id)
);

-- Generated bills (maintenance & utilities)
CREATE TABLE bills (
    id                      BIGSERIAL PRIMARY KEY,
    unit_id                 BIGINT NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    billing_period_start    DATE NOT NULL,
    billing_period_end      DATE NOT NULL,
    due_date                DATE NOT NULL,
    status                  VARCHAR(20) NOT NULL
        CHECK (status IN ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
    total_amount            NUMERIC(14,2) NOT NULL DEFAULT 0,
    balance_amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
    generated_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    sent_at                 TIMESTAMP,
    remarks                 TEXT,
    CONSTRAINT chk_bill_period CHECK (billing_period_end >= billing_period_start)
);

CREATE INDEX idx_bills_unit ON bills(unit_id);
CREATE INDEX idx_bills_status ON bills(status);

CREATE TABLE bill_items (
    id                  BIGSERIAL PRIMARY KEY,
    bill_id             BIGINT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    charge_type_id      BIGINT REFERENCES charge_types(id) ON DELETE SET NULL,
    description         VARCHAR(255) NOT NULL,
    quantity            NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price          NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount              NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_bill_items_bill ON bill_items(bill_id);

-- Payments (dummy gateway / reference fields only)
CREATE TABLE payments (
    id                  BIGSERIAL PRIMARY KEY,
    bill_id             BIGINT NOT NULL REFERENCES bills(id) ON DELETE RESTRICT,
    member_id           BIGINT REFERENCES members(id) ON DELETE SET NULL,
    payment_date        TIMESTAMP NOT NULL DEFAULT NOW(),
    amount              NUMERIC(14,2) NOT NULL,
    method              VARCHAR(20) NOT NULL
        CHECK (method IN ('CARD', 'NET_BANKING', 'UPI', 'CASH', 'CHEQUE', 'OTHER')),
    status              VARCHAR(20) NOT NULL
        CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    reference_number    VARCHAR(100), -- dummy transaction / reference id
    gateway_response    TEXT,         -- optional dummy payload
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_bill ON payments(bill_id);
CREATE INDEX idx_payments_member ON payments(member_id);

-- =========================
-- Expenses & accounting
-- =========================

CREATE TABLE expense_categories (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT
);

CREATE TABLE society_expenses (
    id              BIGSERIAL PRIMARY KEY,
    category_id     BIGINT REFERENCES expense_categories(id) ON DELETE SET NULL,
    description     VARCHAR(255) NOT NULL,
    expense_date    DATE NOT NULL,
    amount          NUMERIC(14,2) NOT NULL,
    payment_mode    VARCHAR(20), -- e.g. CASH, BANK_TRANSFER
    payee           VARCHAR(200),
    invoice_number  VARCHAR(100),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_date ON society_expenses(expense_date);



CREATE TABLE notices (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    content         TEXT NOT NULL,
    priority        VARCHAR(10) NOT NULL
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    audience_scope  VARCHAR(20) NOT NULL DEFAULT 'ALL'
        CHECK (audience_scope IN ('ALL', 'OWNERS', 'TENANTS', 'BLOCK')),
    block_id        BIGINT REFERENCES blocks(id) ON DELETE SET NULL,
    created_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    start_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    end_at          TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notices_active ON notices(start_at, end_at);

CREATE TABLE complaint_categories (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT
);

CREATE TABLE complaints (
    id                  BIGSERIAL PRIMARY KEY,
    member_id           BIGINT NOT NULL REFERENCES members(id) ON DELETE SET NULL,
    unit_id             BIGINT REFERENCES units(id) ON DELETE SET NULL,
    category_id         BIGINT REFERENCES complaint_categories(id) ON DELETE SET NULL,
    subject             VARCHAR(200) NOT NULL,
    description         TEXT NOT NULL,
    status              VARCHAR(20) NOT NULL
        CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED')),
    priority            VARCHAR(10) NOT NULL
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    closed_at           TIMESTAMP,
    assigned_to         BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_complaints_member ON complaints(member_id);
CREATE INDEX idx_complaints_unit ON complaints(unit_id);
CREATE INDEX idx_complaints_status ON complaints(status);

CREATE TABLE complaint_updates (
    id              BIGSERIAL PRIMARY KEY,
    complaint_id    BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    updated_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status          VARCHAR(20) NOT NULL
        CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED')),
    comment         TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_complaint_updates_complaint ON complaint_updates(complaint_id);

-- Emergency alerts (SOS)
CREATE TABLE emergency_alerts (
    id                  BIGSERIAL PRIMARY KEY,
    member_id           BIGINT NOT NULL REFERENCES members(id) ON DELETE SET NULL,
    unit_id             BIGINT REFERENCES units(id) ON DELETE SET NULL,
    alert_type          VARCHAR(20) NOT NULL
        CHECK (alert_type IN ('MEDICAL', 'FIRE', 'SECURITY', 'OTHER')),
    message             TEXT,
    status              VARCHAR(20) NOT NULL
        CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED')),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    acknowledged_at     TIMESTAMP,
    resolved_at         TIMESTAMP,
    handled_by          BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_emergency_alerts_status ON emergency_alerts(status);

-- =========================
-- Polling / online voting
-- =========================

CREATE TABLE polls (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    status          VARCHAR(20) NOT NULL
        CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED')),
    start_at        TIMESTAMP,
    end_at          TIMESTAMP,
    created_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE poll_options (
    id              BIGSERIAL PRIMARY KEY,
    poll_id         BIGINT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text     VARCHAR(255) NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_poll_options_poll ON poll_options(poll_id);

CREATE TABLE poll_votes (
    id              BIGSERIAL PRIMARY KEY,
    poll_id         BIGINT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id       BIGINT NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    member_id       BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    unit_id         BIGINT REFERENCES units(id) ON DELETE SET NULL,
    cast_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (poll_id, member_id) -- one vote per member per poll
);

CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_member ON poll_votes(member_id);

