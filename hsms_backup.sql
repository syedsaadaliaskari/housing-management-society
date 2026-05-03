--
-- PostgreSQL database dump
--

\restrict pnxCy0iX25ObyPie59EWAZgE7L0Nwy7C0ndqSuZfdNf7nPzp9Z8rblhKFnmGpvF

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bills (
    id bigint NOT NULL,
    unit_id bigint NOT NULL,
    billing_period_start date NOT NULL,
    billing_period_end date NOT NULL,
    due_date date NOT NULL,
    status character varying(20) NOT NULL,
    total_amount numeric(14,2) DEFAULT 0 NOT NULL,
    balance_amount numeric(14,2) DEFAULT 0 NOT NULL,
    generated_at timestamp without time zone DEFAULT now() NOT NULL,
    sent_at timestamp without time zone,
    remarks text,
    CONSTRAINT bills_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PARTIALLY_PAID'::character varying, 'PAID'::character varying, 'OVERDUE'::character varying, 'CANCELLED'::character varying])::text[]))),
    CONSTRAINT chk_bill_period CHECK ((billing_period_end >= billing_period_start))
);


ALTER TABLE public.bills OWNER TO postgres;

--
-- Name: bills_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bills_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bills_id_seq OWNER TO postgres;

--
-- Name: bills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bills_id_seq OWNED BY public.bills.id;


--
-- Name: blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blocks (
    id bigint NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.blocks OWNER TO postgres;

--
-- Name: blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.blocks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blocks_id_seq OWNER TO postgres;

--
-- Name: blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.blocks_id_seq OWNED BY public.blocks.id;


--
-- Name: complaint_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complaint_categories (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    description text
);


ALTER TABLE public.complaint_categories OWNER TO postgres;

--
-- Name: complaint_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.complaint_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.complaint_categories_id_seq OWNER TO postgres;

--
-- Name: complaint_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.complaint_categories_id_seq OWNED BY public.complaint_categories.id;


--
-- Name: complaint_updates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complaint_updates (
    id bigint NOT NULL,
    complaint_id bigint NOT NULL,
    updated_by bigint,
    status character varying(20) NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT complaint_updates_status_check CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'IN_PROGRESS'::character varying, 'RESOLVED'::character varying, 'CLOSED'::character varying, 'REJECTED'::character varying])::text[])))
);


ALTER TABLE public.complaint_updates OWNER TO postgres;

--
-- Name: complaint_updates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.complaint_updates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.complaint_updates_id_seq OWNER TO postgres;

--
-- Name: complaint_updates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.complaint_updates_id_seq OWNED BY public.complaint_updates.id;


--
-- Name: complaints; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complaints (
    id bigint NOT NULL,
    member_id bigint NOT NULL,
    unit_id bigint,
    category_id bigint,
    subject character varying(200) NOT NULL,
    description text NOT NULL,
    status character varying(20) NOT NULL,
    priority character varying(10) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    closed_at timestamp without time zone,
    assigned_to bigint,
    CONSTRAINT complaints_priority_check CHECK (((priority)::text = ANY ((ARRAY['LOW'::character varying, 'MEDIUM'::character varying, 'HIGH'::character varying, 'URGENT'::character varying])::text[]))),
    CONSTRAINT complaints_status_check CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'IN_PROGRESS'::character varying, 'RESOLVED'::character varying, 'CLOSED'::character varying, 'REJECTED'::character varying])::text[])))
);


ALTER TABLE public.complaints OWNER TO postgres;

--
-- Name: complaints_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.complaints_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.complaints_id_seq OWNER TO postgres;

--
-- Name: complaints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.complaints_id_seq OWNED BY public.complaints.id;


--
-- Name: emergency_alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.emergency_alerts (
    id bigint NOT NULL,
    member_id bigint NOT NULL,
    unit_id bigint,
    alert_type character varying(20) NOT NULL,
    message text,
    status character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    acknowledged_at timestamp without time zone,
    resolved_at timestamp without time zone,
    handled_by bigint,
    CONSTRAINT emergency_alerts_alert_type_check CHECK (((alert_type)::text = ANY ((ARRAY['MEDICAL'::character varying, 'FIRE'::character varying, 'SECURITY'::character varying, 'OTHER'::character varying])::text[]))),
    CONSTRAINT emergency_alerts_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'ACKNOWLEDGED'::character varying, 'RESOLVED'::character varying, 'CANCELLED'::character varying])::text[])))
);


ALTER TABLE public.emergency_alerts OWNER TO postgres;

--
-- Name: emergency_alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.emergency_alerts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.emergency_alerts_id_seq OWNER TO postgres;

--
-- Name: emergency_alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.emergency_alerts_id_seq OWNED BY public.emergency_alerts.id;


--
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_categories (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    description text
);


ALTER TABLE public.expense_categories OWNER TO postgres;

--
-- Name: expense_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expense_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expense_categories_id_seq OWNER TO postgres;

--
-- Name: expense_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expense_categories_id_seq OWNED BY public.expense_categories.id;


--
-- Name: member_family_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.member_family_members (
    id bigint NOT NULL,
    member_id bigint NOT NULL,
    full_name character varying(200) NOT NULL,
    relation character varying(100) NOT NULL,
    age integer,
    phone character varying(30)
);


ALTER TABLE public.member_family_members OWNER TO postgres;

--
-- Name: member_family_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.member_family_members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.member_family_members_id_seq OWNER TO postgres;

--
-- Name: member_family_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.member_family_members_id_seq OWNED BY public.member_family_members.id;


--
-- Name: members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.members (
    id bigint NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100),
    email character varying(255) NOT NULL,
    phone_primary character varying(30) NOT NULL,
    phone_secondary character varying(30),
    ownership_status character varying(10) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT members_ownership_status_check CHECK (((ownership_status)::text = ANY ((ARRAY['OWNER'::character varying, 'TENANT'::character varying, 'BOTH'::character varying])::text[])))
);


ALTER TABLE public.members OWNER TO postgres;

--
-- Name: members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.members_id_seq OWNER TO postgres;

--
-- Name: members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.members_id_seq OWNED BY public.members.id;


--
-- Name: notices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notices (
    id bigint NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    priority character varying(10) NOT NULL,
    audience_scope character varying(20) DEFAULT 'ALL'::character varying NOT NULL,
    block_id bigint,
    created_by bigint,
    start_at timestamp without time zone DEFAULT now() NOT NULL,
    end_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT notices_audience_scope_check CHECK (((audience_scope)::text = ANY ((ARRAY['ALL'::character varying, 'OWNERS'::character varying, 'TENANTS'::character varying, 'BLOCK'::character varying])::text[]))),
    CONSTRAINT notices_priority_check CHECK (((priority)::text = ANY ((ARRAY['LOW'::character varying, 'MEDIUM'::character varying, 'HIGH'::character varying])::text[])))
);


ALTER TABLE public.notices OWNER TO postgres;

--
-- Name: notices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notices_id_seq OWNER TO postgres;

--
-- Name: notices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notices_id_seq OWNED BY public.notices.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id bigint NOT NULL,
    bill_id bigint NOT NULL,
    member_id bigint,
    payment_date timestamp without time zone DEFAULT now() NOT NULL,
    amount numeric(14,2) NOT NULL,
    method character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    reference_number character varying(100),
    gateway_response text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT payments_method_check CHECK (((method)::text = ANY ((ARRAY['CARD'::character varying, 'NET_BANKING'::character varying, 'UPI'::character varying, 'CASH'::character varying, 'CHEQUE'::character varying, 'OTHER'::character varying])::text[]))),
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'SUCCESS'::character varying, 'FAILED'::character varying])::text[])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: poll_options; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.poll_options (
    id bigint NOT NULL,
    poll_id bigint NOT NULL,
    option_text character varying(255) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.poll_options OWNER TO postgres;

--
-- Name: poll_options_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.poll_options_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.poll_options_id_seq OWNER TO postgres;

--
-- Name: poll_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.poll_options_id_seq OWNED BY public.poll_options.id;


--
-- Name: poll_votes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.poll_votes (
    id bigint NOT NULL,
    poll_id bigint NOT NULL,
    option_id bigint NOT NULL,
    member_id bigint NOT NULL,
    unit_id bigint,
    cast_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.poll_votes OWNER TO postgres;

--
-- Name: poll_votes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.poll_votes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.poll_votes_id_seq OWNER TO postgres;

--
-- Name: poll_votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.poll_votes_id_seq OWNED BY public.poll_votes.id;


--
-- Name: polls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.polls (
    id bigint NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    status character varying(20) NOT NULL,
    start_at timestamp without time zone,
    end_at timestamp without time zone,
    created_by bigint,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT polls_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'OPEN'::character varying, 'CLOSED'::character varying])::text[])))
);


ALTER TABLE public.polls OWNER TO postgres;

--
-- Name: polls_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.polls_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.polls_id_seq OWNER TO postgres;

--
-- Name: polls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.polls_id_seq OWNED BY public.polls.id;


--
-- Name: society_expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.society_expenses (
    id bigint NOT NULL,
    category_id bigint,
    description character varying(255) NOT NULL,
    expense_date date NOT NULL,
    amount numeric(14,2) NOT NULL,
    payment_mode character varying(20),
    payee character varying(200),
    invoice_number character varying(100),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.society_expenses OWNER TO postgres;

--
-- Name: society_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.society_expenses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.society_expenses_id_seq OWNER TO postgres;

--
-- Name: society_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.society_expenses_id_seq OWNED BY public.society_expenses.id;


--
-- Name: unit_ownerships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unit_ownerships (
    id bigint NOT NULL,
    unit_id bigint NOT NULL,
    owner_member_id bigint NOT NULL,
    from_date date NOT NULL,
    to_date date,
    purchase_price numeric(14,2),
    sale_price numeric(14,2),
    remarks text,
    CONSTRAINT chk_ownership_dates CHECK (((to_date IS NULL) OR (to_date >= from_date)))
);


ALTER TABLE public.unit_ownerships OWNER TO postgres;

--
-- Name: unit_ownerships_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unit_ownerships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unit_ownerships_id_seq OWNER TO postgres;

--
-- Name: unit_ownerships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unit_ownerships_id_seq OWNED BY public.unit_ownerships.id;


--
-- Name: unit_residents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unit_residents (
    id bigint NOT NULL,
    unit_id bigint NOT NULL,
    member_id bigint NOT NULL,
    role character varying(20) NOT NULL,
    is_primary_contact boolean DEFAULT false NOT NULL,
    from_date date NOT NULL,
    to_date date,
    CONSTRAINT chk_resident_dates CHECK (((to_date IS NULL) OR (to_date >= from_date))),
    CONSTRAINT unit_residents_role_check CHECK (((role)::text = ANY ((ARRAY['OWNER'::character varying, 'TENANT'::character varying, 'FAMILY'::character varying])::text[])))
);


ALTER TABLE public.unit_residents OWNER TO postgres;

--
-- Name: unit_residents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unit_residents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unit_residents_id_seq OWNER TO postgres;

--
-- Name: unit_residents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unit_residents_id_seq OWNED BY public.unit_residents.id;


--
-- Name: unit_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unit_types (
    id bigint NOT NULL,
    code character varying(30) NOT NULL,
    name character varying(100) NOT NULL,
    description text
);


ALTER TABLE public.unit_types OWNER TO postgres;

--
-- Name: unit_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unit_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unit_types_id_seq OWNER TO postgres;

--
-- Name: unit_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unit_types_id_seq OWNED BY public.unit_types.id;


--
-- Name: units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.units (
    id bigint NOT NULL,
    unit_number character varying(50) NOT NULL,
    block_id bigint,
    floor integer,
    unit_type_id bigint NOT NULL,
    area_sq_ft numeric(10,2),
    is_active boolean DEFAULT true NOT NULL,
    default_maint_charge numeric(12,2) DEFAULT 0,
    default_utility_charge numeric(12,2) DEFAULT 0
);


ALTER TABLE public.units OWNER TO postgres;

--
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.units_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.units_id_seq OWNER TO postgres;

--
-- Name: units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.units_id_seq OWNED BY public.units.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) NOT NULL,
    member_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['ADMIN'::character varying, 'RESIDENT'::character varying, 'STAFF'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    id bigint NOT NULL,
    member_id bigint NOT NULL,
    unit_id bigint,
    registration_number character varying(50) NOT NULL,
    vehicle_type character varying(50),
    brand character varying(100),
    color character varying(50),
    sticker_number character varying(50)
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- Name: vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vehicles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vehicles_id_seq OWNER TO postgres;

--
-- Name: vehicles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vehicles_id_seq OWNED BY public.vehicles.id;


--
-- Name: bills id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills ALTER COLUMN id SET DEFAULT nextval('public.bills_id_seq'::regclass);


--
-- Name: blocks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocks ALTER COLUMN id SET DEFAULT nextval('public.blocks_id_seq'::regclass);


--
-- Name: complaint_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_categories ALTER COLUMN id SET DEFAULT nextval('public.complaint_categories_id_seq'::regclass);


--
-- Name: complaint_updates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_updates ALTER COLUMN id SET DEFAULT nextval('public.complaint_updates_id_seq'::regclass);


--
-- Name: complaints id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints ALTER COLUMN id SET DEFAULT nextval('public.complaints_id_seq'::regclass);


--
-- Name: emergency_alerts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergency_alerts ALTER COLUMN id SET DEFAULT nextval('public.emergency_alerts_id_seq'::regclass);


--
-- Name: expense_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories ALTER COLUMN id SET DEFAULT nextval('public.expense_categories_id_seq'::regclass);


--
-- Name: member_family_members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_family_members ALTER COLUMN id SET DEFAULT nextval('public.member_family_members_id_seq'::regclass);


--
-- Name: members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.members ALTER COLUMN id SET DEFAULT nextval('public.members_id_seq'::regclass);


--
-- Name: notices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notices ALTER COLUMN id SET DEFAULT nextval('public.notices_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: poll_options id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_options ALTER COLUMN id SET DEFAULT nextval('public.poll_options_id_seq'::regclass);


--
-- Name: poll_votes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_votes ALTER COLUMN id SET DEFAULT nextval('public.poll_votes_id_seq'::regclass);


--
-- Name: polls id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.polls ALTER COLUMN id SET DEFAULT nextval('public.polls_id_seq'::regclass);


--
-- Name: society_expenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.society_expenses ALTER COLUMN id SET DEFAULT nextval('public.society_expenses_id_seq'::regclass);


--
-- Name: unit_ownerships id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_ownerships ALTER COLUMN id SET DEFAULT nextval('public.unit_ownerships_id_seq'::regclass);


--
-- Name: unit_residents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_residents ALTER COLUMN id SET DEFAULT nextval('public.unit_residents_id_seq'::regclass);


--
-- Name: unit_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_types ALTER COLUMN id SET DEFAULT nextval('public.unit_types_id_seq'::regclass);


--
-- Name: units id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units ALTER COLUMN id SET DEFAULT nextval('public.units_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vehicles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles ALTER COLUMN id SET DEFAULT nextval('public.vehicles_id_seq'::regclass);


--
-- Data for Name: bills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bills (id, unit_id, billing_period_start, billing_period_end, due_date, status, total_amount, balance_amount, generated_at, sent_at, remarks) FROM stdin;
29	1	2025-11-01	2025-11-30	2025-12-10	PAID	6500.00	0.00	2026-04-29 15:48:59.339083	\N	\N
30	2	2025-11-01	2025-11-30	2025-12-10	PAID	6500.00	0.00	2026-04-29 15:48:59.339083	\N	\N
31	3	2025-11-01	2025-11-30	2025-12-10	PAID	6500.00	0.00	2026-04-29 15:48:59.339083	\N	\N
32	4	2025-11-01	2025-11-30	2025-12-10	PAID	11000.00	0.00	2026-04-29 15:48:59.339083	\N	\N
33	5	2025-11-01	2025-11-30	2025-12-10	PAID	5700.00	0.00	2026-04-29 15:48:59.339083	\N	\N
34	1	2025-12-01	2025-12-31	2026-01-10	PAID	6500.00	0.00	2026-04-29 15:48:59.339083	\N	\N
35	2	2025-12-01	2025-12-31	2026-01-10	PAID	6500.00	0.00	2026-04-29 15:48:59.339083	\N	\N
36	3	2025-12-01	2025-12-31	2026-01-10	PARTIALLY_PAID	6500.00	3000.00	2026-04-29 15:48:59.339083	\N	\N
37	4	2025-12-01	2025-12-31	2026-01-10	PAID	11000.00	0.00	2026-04-29 15:48:59.339083	\N	\N
38	5	2025-12-01	2025-12-31	2026-01-10	OVERDUE	5700.00	5700.00	2026-04-29 15:48:59.339083	\N	\N
39	1	2026-01-01	2026-01-31	2026-02-10	PAID	6500.00	0.00	2026-04-29 15:48:59.339083	\N	\N
40	2	2026-01-01	2026-01-31	2026-02-10	PAID	6500.00	0.00	2026-04-29 15:48:59.339083	\N	\N
41	3	2026-01-01	2026-01-31	2026-02-10	OVERDUE	6500.00	6500.00	2026-04-29 15:48:59.339083	\N	\N
42	4	2026-01-01	2026-01-31	2026-02-10	PAID	11000.00	0.00	2026-04-29 15:48:59.339083	\N	\N
43	5	2026-01-01	2026-01-31	2026-02-10	OVERDUE	5700.00	5700.00	2026-04-29 15:48:59.339083	\N	\N
44	1	2026-02-01	2026-02-28	2026-03-10	PAID	6500.00	0.00	2026-04-29 15:48:59.339083	\N	\N
45	2	2026-02-01	2026-02-28	2026-03-10	PARTIALLY_PAID	6500.00	3000.00	2026-04-29 15:48:59.339083	\N	\N
46	3	2026-02-01	2026-02-28	2026-03-10	OVERDUE	6500.00	6500.00	2026-04-29 15:48:59.339083	\N	\N
47	1	2026-03-01	2026-03-31	2026-04-10	PAID	6500.00	0.00	2026-04-29 15:48:59.339083	\N	\N
48	2	2026-03-01	2026-03-31	2026-04-10	PENDING	6500.00	6500.00	2026-04-29 15:48:59.339083	\N	\N
49	3	2026-03-01	2026-03-31	2026-04-10	PENDING	6500.00	6500.00	2026-04-29 15:48:59.339083	\N	\N
50	4	2026-03-01	2026-03-31	2026-04-10	PAID	11000.00	0.00	2026-04-29 15:48:59.339083	\N	\N
51	1	2026-04-01	2026-04-30	2026-05-10	PENDING	6500.00	6500.00	2026-04-29 15:48:59.339083	\N	\N
52	2	2026-04-01	2026-04-30	2026-05-10	PENDING	6500.00	6500.00	2026-04-29 15:48:59.339083	\N	\N
53	3	2026-04-01	2026-04-30	2026-05-10	PENDING	6500.00	6500.00	2026-04-29 15:48:59.339083	\N	\N
54	4	2026-04-01	2026-04-30	2026-05-10	PENDING	11000.00	11000.00	2026-04-29 15:48:59.339083	\N	\N
55	5	2026-04-01	2026-04-30	2026-05-10	OVERDUE	5700.00	5700.00	2026-04-29 15:48:59.339083	\N	\N
\.


--
-- Data for Name: blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blocks (id, name, description, created_at) FROM stdin;
1	Block A	Main residential block	2026-04-29 15:44:14.228756
2	Block B	Secondary residential block	2026-04-29 15:44:14.228756
3	Block C	Commercial and residential mix	2026-04-29 15:44:14.228756
\.


--
-- Data for Name: complaint_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.complaint_categories (id, name, description) FROM stdin;
1	Maintenance	Building and unit maintenance issues
2	Security	Security related concerns
3	Noise	Noise complaints from neighbors
4	Parking	Parking related issues
5	Cleanliness	Cleanliness and hygiene concerns
6	Water Supply	Water supply and plumbing issues
7	Electricity	Electrical issues and power outages
8	Other	Miscellaneous complaints
\.


--
-- Data for Name: complaint_updates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.complaint_updates (id, complaint_id, updated_by, status, comment, created_at) FROM stdin;
\.


--
-- Data for Name: complaints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.complaints (id, member_id, unit_id, category_id, subject, description, status, priority, created_at, updated_at, closed_at, assigned_to) FROM stdin;
17	1	1	1	Water leakage in bathroom	Continuous water leakage from ceiling for 3 days.	OPEN	HIGH	2026-04-29 15:52:06.637756	2026-04-29 15:52:06.637756	\N	\N
18	2	2	3	Loud music from upstairs	Residents above play loud music late at night.	IN_PROGRESS	MEDIUM	2026-04-29 15:52:06.637756	2026-04-29 15:52:06.637756	\N	\N
19	5	5	2	Broken CCTV at entrance	CCTV camera at Block B entrance non-functional for a week.	OPEN	URGENT	2026-04-29 15:52:06.637756	2026-04-29 15:52:06.637756	\N	\N
20	6	3	5	Garbage not collected on time	Garbage collection missed our floor for 3 days.	RESOLVED	LOW	2026-04-29 15:52:06.637756	2026-04-29 15:52:06.637756	\N	\N
21	7	4	4	Unauthorized parking in my spot	Someone keeps parking in my designated spot 4A.	IN_PROGRESS	HIGH	2026-04-29 15:52:06.637756	2026-04-29 15:52:06.637756	\N	\N
22	3	7	6	Low water pressure	Water pressure very low for the past week.	OPEN	MEDIUM	2026-04-29 15:52:06.637756	2026-04-29 15:52:06.637756	\N	\N
23	8	8	7	Power outage in Block C	Frequent power cuts lasting 2-3 hours in evenings.	CLOSED	HIGH	2026-04-29 15:52:06.637756	2026-04-29 15:52:06.637756	\N	\N
24	9	9	1	Elevator not working	Elevator in Block A out of service since yesterday.	IN_PROGRESS	URGENT	2026-04-29 15:52:06.637756	2026-04-29 15:52:06.637756	\N	\N
25	4	6	5	Stairwell not being cleaned	Stairwell on floor 2 not cleaned in over a week.	OPEN	LOW	2026-04-29 15:52:06.637756	2026-04-29 15:52:06.637756	\N	\N
26	1	1	8	Request for extra parking sticker	I have a second vehicle and need an additional sticker.	RESOLVED	LOW	2026-04-29 15:52:06.637756	2026-04-29 15:52:06.637756	\N	\N
\.


--
-- Data for Name: emergency_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.emergency_alerts (id, member_id, unit_id, alert_type, message, status, created_at, acknowledged_at, resolved_at, handled_by) FROM stdin;
\.


--
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_categories (id, name, description) FROM stdin;
1	Security	Security staff salaries and equipment
2	Maintenance	General building maintenance and repairs
3	Utilities	Electricity, water, and gas bills
4	Cleaning	Cleaning staff and supplies
5	Administration	Office and admin expenses
6	Landscaping	Garden and grounds maintenance
\.


--
-- Data for Name: member_family_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.member_family_members (id, member_id, full_name, relation, age, phone) FROM stdin;
\.


--
-- Data for Name: members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.members (id, first_name, last_name, email, phone_primary, phone_secondary, ownership_status, is_active, created_at) FROM stdin;
1	Ahmed	Khan	ahmed.khan@example.com	03001111111	\N	OWNER	t	2026-04-29 15:42:49.681053
2	Sara	Ali	sara.ali@example.com	03002222222	\N	TENANT	t	2026-04-29 15:42:49.681053
3	Bilal	Hassan	bilal.hassan@example.com	03003333333	\N	OWNER	t	2026-04-29 15:42:49.681053
4	Fatima	Sheikh	fatima.sheikh@example.com	03004444444	\N	BOTH	t	2026-04-29 15:42:49.681053
5	Usman	Raza	usman.raza@example.com	03005555555	\N	TENANT	t	2026-04-29 15:42:49.681053
6	Ayesha	Malik	ayesha.malik@example.com	03006666666	\N	OWNER	t	2026-04-29 15:42:49.681053
7	Zain	Qureshi	zain.qureshi@example.com	03007777777	\N	OWNER	t	2026-04-29 15:42:49.681053
8	Hina	Baig	hina.baig@example.com	03008888888	\N	TENANT	t	2026-04-29 15:42:49.681053
9	Tariq	Mehmood	tariq.mehmood@example.com	03009999999	\N	OWNER	t	2026-04-29 15:42:49.681053
10	Admin	User	admin@society.com	03000000000	\N	OWNER	t	2026-04-29 15:42:49.681053
\.


--
-- Data for Name: notices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notices (id, title, content, priority, audience_scope, block_id, created_by, start_at, end_at, created_at) FROM stdin;
3	Water Supply Interruption	Water supply will be interrupted on Saturday from 9 AM to 2 PM due to maintenance. Please store sufficient water in advance.	HIGH	ALL	\N	1	2026-04-24 15:52:44.318363	2026-05-01 15:52:44.318363	2026-04-29 15:52:44.318363
4	Society Annual General Meeting	All owners are requested to attend the AGM on 20th February 2026 at 6 PM in the Community Hall. Agenda includes budget review and election of new committee members.	HIGH	OWNERS	\N	1	2026-04-26 15:52:44.318363	2026-05-09 15:52:44.318363	2026-04-29 15:52:44.318363
5	New Parking Rules Effective May 2026	All vehicles must display new color-coded parking stickers from 1st May 2026. Vehicles without valid stickers will be towed.	MEDIUM	ALL	\N	1	2026-04-28 15:52:44.318363	2026-05-29 15:52:44.318363	2026-04-29 15:52:44.318363
6	Eid Holiday Office Hours	The administration office will remain closed from 30th March to 3rd April for Eid holidays. For emergencies contact security at extension 101.	LOW	ALL	\N	1	2026-04-29 15:52:44.318363	2026-05-14 15:52:44.318363	2026-04-29 15:52:44.318363
7	Elevator Maintenance Block B	Block B elevator will undergo annual maintenance on 18th May from 8 AM to 12 PM. Please plan accordingly.	MEDIUM	ALL	\N	1	2026-04-27 15:52:44.318363	2026-05-04 15:52:44.318363	2026-04-29 15:52:44.318363
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, bill_id, member_id, payment_date, amount, method, status, reference_number, gateway_response, created_at) FROM stdin;
2	29	1	2025-11-05 00:00:00	6500.00	NET_BANKING	SUCCESS	TXN-001	\N	2026-04-29 15:50:30.204202
3	30	2	2025-11-06 00:00:00	6500.00	CASH	SUCCESS	TXN-002	\N	2026-04-29 15:50:30.204202
4	31	6	2025-11-07 00:00:00	6500.00	UPI	SUCCESS	TXN-003	\N	2026-04-29 15:50:30.204202
5	32	7	2025-11-08 00:00:00	11000.00	CARD	SUCCESS	TXN-004	\N	2026-04-29 15:50:30.204202
6	33	5	2025-11-09 00:00:00	5700.00	CASH	SUCCESS	TXN-005	\N	2026-04-29 15:50:30.204202
7	34	1	2025-12-05 00:00:00	6500.00	NET_BANKING	SUCCESS	TXN-006	\N	2026-04-29 15:50:30.204202
8	35	2	2025-12-06 00:00:00	6500.00	CASH	SUCCESS	TXN-007	\N	2026-04-29 15:50:30.204202
9	36	6	2025-12-07 00:00:00	3500.00	UPI	SUCCESS	TXN-008	\N	2026-04-29 15:50:30.204202
10	37	7	2025-12-08 00:00:00	11000.00	CARD	SUCCESS	TXN-009	\N	2026-04-29 15:50:30.204202
11	39	1	2026-01-05 00:00:00	6500.00	NET_BANKING	SUCCESS	TXN-010	\N	2026-04-29 15:50:30.204202
12	40	2	2026-01-06 00:00:00	6500.00	CASH	SUCCESS	TXN-011	\N	2026-04-29 15:50:30.204202
13	42	7	2026-01-08 00:00:00	11000.00	CARD	SUCCESS	TXN-012	\N	2026-04-29 15:50:30.204202
14	44	1	2026-02-05 00:00:00	6500.00	NET_BANKING	SUCCESS	TXN-013	\N	2026-04-29 15:50:30.204202
15	47	1	2026-03-05 00:00:00	6500.00	NET_BANKING	SUCCESS	TXN-014	\N	2026-04-29 15:50:30.204202
16	50	7	2026-03-08 00:00:00	11000.00	CARD	SUCCESS	TXN-015	\N	2026-04-29 15:50:30.204202
\.


--
-- Data for Name: poll_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.poll_options (id, poll_id, option_text, sort_order) FROM stdin;
\.


--
-- Data for Name: poll_votes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.poll_votes (id, poll_id, option_id, member_id, unit_id, cast_at) FROM stdin;
\.


--
-- Data for Name: polls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.polls (id, title, description, status, start_at, end_at, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: society_expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.society_expenses (id, category_id, description, expense_date, amount, payment_mode, payee, invoice_number, created_at) FROM stdin;
30	1	Security guard salaries - November	2025-11-30	85000.00	BANK_TRANSFER	SecureGuard Co.	INV-2025-001	2026-04-29 15:48:24.465987
31	2	Elevator maintenance contract	2025-11-15	45000.00	CHEQUE	TechLift Services	INV-2025-002	2026-04-29 15:48:24.465987
32	3	Electricity bill - November	2025-11-28	32000.00	BANK_TRANSFER	LESCO	INV-2025-003	2026-04-29 15:48:24.465987
33	4	Cleaning staff - November	2025-11-30	40000.00	CASH	CleanPro Staff	\N	2026-04-29 15:48:24.465987
34	1	Security guard salaries - December	2025-12-31	85000.00	BANK_TRANSFER	SecureGuard Co.	INV-2025-004	2026-04-29 15:48:24.465987
35	2	Plumbing repair Block B	2025-12-10	18000.00	CASH	Khan Plumbers	\N	2026-04-29 15:48:24.465987
36	3	Electricity bill - December	2025-12-28	35000.00	BANK_TRANSFER	LESCO	INV-2025-005	2026-04-29 15:48:24.465987
37	5	Office supplies	2025-12-05	8500.00	CASH	Al-Fatah Store	\N	2026-04-29 15:48:24.465987
38	6	Garden maintenance - December	2025-12-20	12000.00	CASH	GreenThumb Co.	\N	2026-04-29 15:48:24.465987
39	1	Security guard salaries - January	2026-01-31	90000.00	BANK_TRANSFER	SecureGuard Co.	INV-2026-001	2026-04-29 15:48:24.465987
40	3	Electricity bill - January	2026-01-28	38000.00	BANK_TRANSFER	LESCO	INV-2026-002	2026-04-29 15:48:24.465987
41	2	Generator fuel - January	2026-01-15	22000.00	CASH	PSO Station	\N	2026-04-29 15:48:24.465987
42	1	Security guard salaries - February	2026-02-28	90000.00	BANK_TRANSFER	SecureGuard Co.	INV-2026-003	2026-04-29 15:48:24.465987
43	3	Electricity bill - February	2026-02-25	40000.00	BANK_TRANSFER	LESCO	INV-2026-004	2026-04-29 15:48:24.465987
44	4	Cleaning staff - February	2026-02-28	42000.00	CASH	CleanPro Staff	\N	2026-04-29 15:48:24.465987
45	1	Security guard salaries - March	2026-03-31	90000.00	BANK_TRANSFER	SecureGuard Co.	INV-2026-005	2026-04-29 15:48:24.465987
46	2	Lift repair - March	2026-03-15	28000.00	CASH	TechLift Services	INV-2026-006	2026-04-29 15:48:24.465987
47	3	Electricity bill - March	2026-03-28	42000.00	BANK_TRANSFER	LESCO	INV-2026-007	2026-04-29 15:48:24.465987
48	6	Garden maintenance - March	2026-03-20	15000.00	CASH	GreenThumb Co.	\N	2026-04-29 15:48:24.465987
49	1	Security guard salaries - April	2026-04-30	90000.00	BANK_TRANSFER	SecureGuard Co.	INV-2026-008	2026-04-29 15:48:24.465987
50	3	Electricity bill - April	2026-04-25	45000.00	BANK_TRANSFER	LESCO	INV-2026-009	2026-04-29 15:48:24.465987
51	5	Admin office supplies - April	2026-04-10	9500.00	CASH	Al-Fatah Store	\N	2026-04-29 15:48:24.465987
\.


--
-- Data for Name: unit_ownerships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unit_ownerships (id, unit_id, owner_member_id, from_date, to_date, purchase_price, sale_price, remarks) FROM stdin;
18	1	1	2020-01-01	\N	4500000.00	\N	\N
19	2	3	2019-06-01	\N	4200000.00	\N	\N
20	3	6	2021-03-15	\N	5000000.00	\N	\N
21	4	7	2018-11-01	\N	9500000.00	\N	\N
22	5	9	2022-01-01	\N	3800000.00	\N	\N
23	6	4	2023-01-01	\N	4000000.00	\N	\N
24	7	3	2020-07-01	\N	11000000.00	\N	\N
25	8	9	2021-09-01	\N	3200000.00	\N	\N
26	9	1	2022-05-01	\N	3100000.00	\N	\N
27	10	7	2016-01-01	\N	8000000.00	\N	\N
\.


--
-- Data for Name: unit_residents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unit_residents (id, unit_id, member_id, role, is_primary_contact, from_date, to_date) FROM stdin;
8	1	1	OWNER	t	2020-01-01	\N
9	2	2	TENANT	t	2021-06-01	\N
10	3	6	OWNER	t	2021-03-15	\N
11	4	7	OWNER	t	2018-11-01	\N
12	5	5	TENANT	t	2022-03-01	\N
13	6	4	OWNER	t	2023-01-01	\N
14	7	3	OWNER	t	2020-07-01	\N
15	8	8	TENANT	t	2022-05-01	\N
16	9	9	OWNER	t	2021-09-01	\N
17	10	7	OWNER	t	2016-01-01	\N
\.


--
-- Data for Name: unit_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unit_types (id, code, name, description) FROM stdin;
1	APARTMENT	Apartment	Standard residential apartment
2	VILLA	Villa	Independent villa unit
3	PLOT	Plot	Open residential plot
4	PENTHOUSE	Penthouse	Top floor luxury unit
\.


--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.units (id, unit_number, block_id, floor, unit_type_id, area_sq_ft, is_active, default_maint_charge, default_utility_charge) FROM stdin;
1	A-101	1	1	1	1200.00	t	5000.00	1500.00
2	A-102	1	1	1	1100.00	t	5000.00	1500.00
3	A-201	1	2	1	1200.00	t	5000.00	1500.00
4	A-202	1	2	4	2500.00	t	9000.00	2000.00
5	B-101	2	1	1	1000.00	t	4500.00	1200.00
6	B-102	2	1	1	1000.00	t	4500.00	1200.00
7	B-201	2	2	2	3000.00	t	10000.00	2500.00
8	C-101	3	1	1	950.00	t	4000.00	1000.00
9	C-102	3	1	1	950.00	t	4000.00	1000.00
10	C-Plot1	3	0	3	5000.00	t	2000.00	500.00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, role, member_id, is_active, last_login_at, created_at) FROM stdin;
1	admin@society.com	$2b$12$J7QU.9rzfOeNet44c/nQR.8gd4lyrii3V3NpnA2IXE9QJsWwaH.5a	ADMIN	10	t	\N	2026-04-29 15:43:15.948949
2	ahmed.khan@example.com	$2b$12$J7QU.9rzfOeNet44c/nQR.8gd4lyrii3V3NpnA2IXE9QJsWwaH.5a	RESIDENT	1	t	\N	2026-04-29 15:43:15.948949
3	sara.ali@example.com	$2b$12$J7QU.9rzfOeNet44c/nQR.8gd4lyrii3V3NpnA2IXE9QJsWwaH.5a	RESIDENT	2	t	\N	2026-04-29 15:43:15.948949
4	bilal.hassan@example.com	$2b$12$J7QU.9rzfOeNet44c/nQR.8gd4lyrii3V3NpnA2IXE9QJsWwaH.5a	RESIDENT	3	t	\N	2026-04-29 15:43:15.948949
5	fatima.sheikh@example.com	$2b$12$J7QU.9rzfOeNet44c/nQR.8gd4lyrii3V3NpnA2IXE9QJsWwaH.5a	RESIDENT	4	t	\N	2026-04-29 15:43:15.948949
6	usman.raza@example.com	$2b$12$J7QU.9rzfOeNet44c/nQR.8gd4lyrii3V3NpnA2IXE9QJsWwaH.5a	RESIDENT	5	t	\N	2026-04-29 15:43:15.948949
7	ayesha.malik@example.com	$2b$12$J7QU.9rzfOeNet44c/nQR.8gd4lyrii3V3NpnA2IXE9QJsWwaH.5a	RESIDENT	6	t	\N	2026-04-29 15:43:15.948949
8	zain.qureshi@example.com	$2b$12$J7QU.9rzfOeNet44c/nQR.8gd4lyrii3V3NpnA2IXE9QJsWwaH.5a	RESIDENT	7	t	\N	2026-04-29 15:43:15.948949
9	hina.baig@example.com	$2b$12$J7QU.9rzfOeNet44c/nQR.8gd4lyrii3V3NpnA2IXE9QJsWwaH.5a	RESIDENT	8	t	\N	2026-04-29 15:43:15.948949
10	tariq.mehmood@example.com	$2b$12$J7QU.9rzfOeNet44c/nQR.8gd4lyrii3V3NpnA2IXE9QJsWwaH.5a	RESIDENT	9	t	\N	2026-04-29 15:43:15.948949
11	saadadmin@society.com	$2b$12$J7QU.9rzfOeNet44c/nQR.8gd4lyrii3V3NpnA2IXE9QJsWwaH.5a	ADMIN	10	t	\N	2026-04-29 16:01:01.876741
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (id, member_id, unit_id, registration_number, vehicle_type, brand, color, sticker_number) FROM stdin;
7	1	1	ABC-001	Car	Toyota	White	ST-001
8	1	1	ABC-002	Bike	Honda	Black	ST-002
9	3	2	DEF-003	Car	Honda	Silver	ST-003
10	6	3	GHI-004	Car	Suzuki	Red	ST-004
11	7	4	JKL-005	Car	Toyota	Black	ST-005
12	7	4	JKL-006	Car	BMW	White	ST-006
13	9	5	MNO-007	Car	Kia	Blue	ST-007
14	4	6	PQR-008	Car	Hyundai	Grey	ST-008
15	3	7	STU-009	Car	Mercedes	Black	ST-009
16	8	8	VWX-010	Bike	Yamaha	Red	ST-010
\.


--
-- Name: bills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bills_id_seq', 55, true);


--
-- Name: blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.blocks_id_seq', 3, true);


--
-- Name: complaint_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.complaint_categories_id_seq', 8, true);


--
-- Name: complaint_updates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.complaint_updates_id_seq', 1, true);


--
-- Name: complaints_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.complaints_id_seq', 26, true);


--
-- Name: emergency_alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.emergency_alerts_id_seq', 3, true);


--
-- Name: expense_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expense_categories_id_seq', 6, true);


--
-- Name: member_family_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.member_family_members_id_seq', 1, false);


--
-- Name: members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.members_id_seq', 10, true);


--
-- Name: notices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notices_id_seq', 7, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 16, true);


--
-- Name: poll_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.poll_options_id_seq', 2, true);


--
-- Name: poll_votes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.poll_votes_id_seq', 1, true);


--
-- Name: polls_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.polls_id_seq', 1, true);


--
-- Name: society_expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.society_expenses_id_seq', 51, true);


--
-- Name: unit_ownerships_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.unit_ownerships_id_seq', 27, true);


--
-- Name: unit_residents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.unit_residents_id_seq', 17, true);


--
-- Name: unit_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.unit_types_id_seq', 4, true);


--
-- Name: units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.units_id_seq', 10, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 11, true);


--
-- Name: vehicles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vehicles_id_seq', 16, true);


--
-- Name: bills bills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT bills_pkey PRIMARY KEY (id);


--
-- Name: blocks blocks_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_name_key UNIQUE (name);


--
-- Name: blocks blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_pkey PRIMARY KEY (id);


--
-- Name: complaint_categories complaint_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_categories
    ADD CONSTRAINT complaint_categories_name_key UNIQUE (name);


--
-- Name: complaint_categories complaint_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_categories
    ADD CONSTRAINT complaint_categories_pkey PRIMARY KEY (id);


--
-- Name: complaint_updates complaint_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_updates
    ADD CONSTRAINT complaint_updates_pkey PRIMARY KEY (id);


--
-- Name: complaints complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_pkey PRIMARY KEY (id);


--
-- Name: emergency_alerts emergency_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergency_alerts
    ADD CONSTRAINT emergency_alerts_pkey PRIMARY KEY (id);


--
-- Name: expense_categories expense_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_name_key UNIQUE (name);


--
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- Name: member_family_members member_family_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_family_members
    ADD CONSTRAINT member_family_members_pkey PRIMARY KEY (id);


--
-- Name: members members_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_email_key UNIQUE (email);


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: notices notices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: poll_options poll_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_options
    ADD CONSTRAINT poll_options_pkey PRIMARY KEY (id);


--
-- Name: poll_votes poll_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_pkey PRIMARY KEY (id);


--
-- Name: poll_votes poll_votes_poll_id_member_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_poll_id_member_id_key UNIQUE (poll_id, member_id);


--
-- Name: polls polls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.polls
    ADD CONSTRAINT polls_pkey PRIMARY KEY (id);


--
-- Name: society_expenses society_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.society_expenses
    ADD CONSTRAINT society_expenses_pkey PRIMARY KEY (id);


--
-- Name: unit_ownerships unit_ownerships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_ownerships
    ADD CONSTRAINT unit_ownerships_pkey PRIMARY KEY (id);


--
-- Name: unit_residents unit_residents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_residents
    ADD CONSTRAINT unit_residents_pkey PRIMARY KEY (id);


--
-- Name: unit_types unit_types_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_types
    ADD CONSTRAINT unit_types_code_key UNIQUE (code);


--
-- Name: unit_types unit_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_types
    ADD CONSTRAINT unit_types_pkey PRIMARY KEY (id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: units units_unit_number_block_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_unit_number_block_id_key UNIQUE (unit_number, block_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_registration_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_registration_number_key UNIQUE (registration_number);


--
-- Name: idx_unit_residents_member; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unit_residents_member ON public.unit_residents USING btree (member_id);


--
-- Name: idx_unit_residents_unit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unit_residents_unit ON public.unit_residents USING btree (unit_id);


--
-- Name: bills bills_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT bills_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE RESTRICT;


--
-- Name: complaint_updates complaint_updates_complaint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_updates
    ADD CONSTRAINT complaint_updates_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES public.complaints(id) ON DELETE CASCADE;


--
-- Name: complaint_updates complaint_updates_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_updates
    ADD CONSTRAINT complaint_updates_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: complaints complaints_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: complaints complaints_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.complaint_categories(id) ON DELETE SET NULL;


--
-- Name: complaints complaints_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: complaints complaints_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL;


--
-- Name: emergency_alerts emergency_alerts_handled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergency_alerts
    ADD CONSTRAINT emergency_alerts_handled_by_fkey FOREIGN KEY (handled_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: emergency_alerts emergency_alerts_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergency_alerts
    ADD CONSTRAINT emergency_alerts_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: emergency_alerts emergency_alerts_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergency_alerts
    ADD CONSTRAINT emergency_alerts_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL;


--
-- Name: member_family_members member_family_members_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_family_members
    ADD CONSTRAINT member_family_members_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: notices notices_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.blocks(id) ON DELETE SET NULL;


--
-- Name: notices notices_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payments payments_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(id) ON DELETE RESTRICT;


--
-- Name: payments payments_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: poll_options poll_options_poll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_options
    ADD CONSTRAINT poll_options_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE CASCADE;


--
-- Name: poll_votes poll_votes_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: poll_votes poll_votes_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.poll_options(id) ON DELETE CASCADE;


--
-- Name: poll_votes poll_votes_poll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id) ON DELETE CASCADE;


--
-- Name: poll_votes poll_votes_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL;


--
-- Name: polls polls_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.polls
    ADD CONSTRAINT polls_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: society_expenses society_expenses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.society_expenses
    ADD CONSTRAINT society_expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id) ON DELETE SET NULL;


--
-- Name: unit_ownerships unit_ownerships_owner_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_ownerships
    ADD CONSTRAINT unit_ownerships_owner_member_id_fkey FOREIGN KEY (owner_member_id) REFERENCES public.members(id) ON DELETE RESTRICT;


--
-- Name: unit_ownerships unit_ownerships_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_ownerships
    ADD CONSTRAINT unit_ownerships_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;


--
-- Name: unit_residents unit_residents_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_residents
    ADD CONSTRAINT unit_residents_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: unit_residents unit_residents_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit_residents
    ADD CONSTRAINT unit_residents_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;


--
-- Name: units units_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.blocks(id) ON DELETE SET NULL;


--
-- Name: units units_unit_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_unit_type_id_fkey FOREIGN KEY (unit_type_id) REFERENCES public.unit_types(id);


--
-- Name: users users_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: vehicles vehicles_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: vehicles vehicles_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict pnxCy0iX25ObyPie59EWAZgE7L0Nwy7C0ndqSuZfdNf7nPzp9Z8rblhKFnmGpvF

