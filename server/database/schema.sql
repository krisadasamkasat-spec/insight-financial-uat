--
-- PostgreSQL database dump
--

\restrict zgy1owvenSxVNcghDsFISEp05Sug0pLj9fhYfHDT8dDj0M3sX3OCqGj0ulAXUFU

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_codes (
    account_code character varying(50) NOT NULL,
    account_description text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: contact_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contact_id uuid,
    document_type character varying(50) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    file_ext character varying(10),
    is_active boolean DEFAULT true,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type character varying(20) NOT NULL,
    tax_id character varying(13),
    branch_code character varying(10) DEFAULT '00000'::character varying,
    name_th character varying(255) NOT NULL,
    name_en character varying(255),
    nick_name character varying(100),
    phone character varying(50) NOT NULL,
    mobile character varying(50),
    email character varying(255),
    address_registration text,
    address_shipping text,
    bank_name character varying(100),
    bank_account_number character varying(50),
    bank_account_name character varying(255),
    role character varying(100),
    note text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT contacts_entity_type_check CHECK (((entity_type)::text = ANY ((ARRAY['individual'::character varying, 'juristic'::character varying])::text[])))
);


--
-- Name: expense_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_attachments (
    id integer NOT NULL,
    expense_id integer,
    file_name character varying(255),
    file_path character varying(500) NOT NULL,
    source character varying(50),
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: expense_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expense_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expense_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expense_attachments_id_seq OWNED BY public.expense_attachments.id;


--
-- Name: expense_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_lists (
    id integer NOT NULL,
    project_code character varying(50),
    account_code character varying(50),
    expense_type character varying(100),
    contact character varying(255),
    bill_header character varying(255),
    payback_to character varying(255),
    description text,
    phone character varying(50),
    email character varying(255),
    bank_name character varying(100),
    bank_account_number character varying(50),
    bank_account_name character varying(255),
    amount numeric(15,2),
    discount numeric(15,2) DEFAULT 0,
    vat numeric(5,2) DEFAULT 0,
    vat_amount numeric(15,2) DEFAULT 0,
    wht numeric(5,2) DEFAULT 0,
    wht_amount numeric(15,2) DEFAULT 0,
    net_amount numeric(15,2),
    issue_date date,
    due_date date,
    internal_status character varying(50) DEFAULT 'Draft'::character varying,
    created_by integer,
    updated_by integer,
    approved_by integer,
    approved_at timestamp without time zone,
    rejected_by integer,
    rejected_at timestamp without time zone,
    reject_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: expense_lists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expense_lists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expense_lists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expense_lists_id_seq OWNED BY public.expense_lists.id;


--
-- Name: financial_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_accounts (
    id integer NOT NULL,
    bank_name character varying(100),
    financial_account_number character varying(50),
    financial_account_name character varying(255),
    balance numeric(15,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: financial_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.financial_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: financial_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.financial_accounts_id_seq OWNED BY public.financial_accounts.id;


--
-- Name: income_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.income_attachments (
    id integer NOT NULL,
    income_id integer,
    file_name character varying(255),
    file_path character varying(500) NOT NULL,
    source character varying(50),
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: income_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.income_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: income_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.income_attachments_id_seq OWNED BY public.income_attachments.id;


--
-- Name: income_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.income_lists (
    id integer NOT NULL,
    project_code character varying(50),
    amount numeric(15,2),
    description text,
    financial_account_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    due_date date,
    status character varying(20) DEFAULT 'pending'::character varying
);


--
-- Name: income_lists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.income_lists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: income_lists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.income_lists_id_seq OWNED BY public.income_lists.id;


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    code_prefix character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: product_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_categories_id_seq OWNED BY public.product_categories.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    product_code character varying(50) NOT NULL,
    product_category_id integer,
    product_name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: project_dates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_dates (
    id integer CONSTRAINT project_dates_id_not_null1 NOT NULL,
    project_code character varying(50),
    date_name character varying(255),
    start_date timestamp without time zone CONSTRAINT project_dates_start_date_not_null1 NOT NULL,
    end_date timestamp without time zone,
    location character varying(255),
    description text,
    created_by integer,
    updated_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: project_dates_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_dates_id_seq1
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_dates_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_dates_id_seq1 OWNED BY public.project_dates.id;


--
-- Name: project_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_types (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    label character varying(255),
    code_prefix character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: project_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_types_id_seq OWNED BY public.project_types.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    project_code character varying(50) NOT NULL,
    project_type_id integer,
    project_name character varying(255),
    product_code character varying(50),
    customer_name character varying(255),
    participant_count integer,
    budget numeric(15,2),
    description text,
    status character varying(50) DEFAULT 'Active'::character varying,
    created_by integer,
    updated_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    password_hash character varying(255),
    name character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: expense_attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_attachments ALTER COLUMN id SET DEFAULT nextval('public.expense_attachments_id_seq'::regclass);


--
-- Name: expense_lists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_lists ALTER COLUMN id SET DEFAULT nextval('public.expense_lists_id_seq'::regclass);


--
-- Name: financial_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_accounts ALTER COLUMN id SET DEFAULT nextval('public.financial_accounts_id_seq'::regclass);


--
-- Name: income_attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.income_attachments ALTER COLUMN id SET DEFAULT nextval('public.income_attachments_id_seq'::regclass);


--
-- Name: income_lists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.income_lists ALTER COLUMN id SET DEFAULT nextval('public.income_lists_id_seq'::regclass);


--
-- Name: product_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories ALTER COLUMN id SET DEFAULT nextval('public.product_categories_id_seq'::regclass);


--
-- Name: project_dates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_dates ALTER COLUMN id SET DEFAULT nextval('public.project_dates_id_seq1'::regclass);


--
-- Name: project_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_types ALTER COLUMN id SET DEFAULT nextval('public.project_types_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: account_codes account_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_codes
    ADD CONSTRAINT account_codes_pkey PRIMARY KEY (account_code);


--
-- Name: contact_documents contact_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_documents
    ADD CONSTRAINT contact_documents_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: expense_attachments expense_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_attachments
    ADD CONSTRAINT expense_attachments_pkey PRIMARY KEY (id);


--
-- Name: expense_lists expense_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_lists
    ADD CONSTRAINT expense_lists_pkey PRIMARY KEY (id);


--
-- Name: financial_accounts financial_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_accounts
    ADD CONSTRAINT financial_accounts_pkey PRIMARY KEY (id);


--
-- Name: income_attachments income_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.income_attachments
    ADD CONSTRAINT income_attachments_pkey PRIMARY KEY (id);


--
-- Name: income_lists income_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.income_lists
    ADD CONSTRAINT income_lists_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_name_key UNIQUE (name);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_code);


--
-- Name: project_dates project_dates_pkey1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_dates
    ADD CONSTRAINT project_dates_pkey1 PRIMARY KEY (id);


--
-- Name: project_types project_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_types
    ADD CONSTRAINT project_types_name_key UNIQUE (name);


--
-- Name: project_types project_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_types
    ADD CONSTRAINT project_types_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (project_code);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_contact_docs_contact; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_docs_contact ON public.contact_documents USING btree (contact_id);


--
-- Name: idx_contacts_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_entity_type ON public.contacts USING btree (entity_type);


--
-- Name: idx_contacts_name_th; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_name_th ON public.contacts USING btree (name_th);


--
-- Name: idx_contacts_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_phone ON public.contacts USING btree (phone);


--
-- Name: idx_contacts_tax_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contacts_tax_id ON public.contacts USING btree (tax_id);


--
-- Name: idx_expense_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_project ON public.expense_lists USING btree (project_code);


--
-- Name: idx_income_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_income_project ON public.income_lists USING btree (project_code);


--
-- Name: idx_projects_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_code ON public.projects USING btree (project_code);


--
-- Name: contact_documents contact_documents_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_documents
    ADD CONSTRAINT contact_documents_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;


--
-- Name: expense_attachments expense_attachments_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_attachments
    ADD CONSTRAINT expense_attachments_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expense_lists(id) ON DELETE CASCADE;


--
-- Name: expense_lists expense_lists_account_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_lists
    ADD CONSTRAINT expense_lists_account_code_fkey FOREIGN KEY (account_code) REFERENCES public.account_codes(account_code);


--
-- Name: expense_lists expense_lists_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_lists
    ADD CONSTRAINT expense_lists_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: expense_lists expense_lists_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_lists
    ADD CONSTRAINT expense_lists_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: expense_lists expense_lists_project_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_lists
    ADD CONSTRAINT expense_lists_project_code_fkey FOREIGN KEY (project_code) REFERENCES public.projects(project_code);


--
-- Name: expense_lists expense_lists_rejected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_lists
    ADD CONSTRAINT expense_lists_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(id);


--
-- Name: expense_lists expense_lists_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_lists
    ADD CONSTRAINT expense_lists_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: income_attachments income_attachments_income_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.income_attachments
    ADD CONSTRAINT income_attachments_income_id_fkey FOREIGN KEY (income_id) REFERENCES public.income_lists(id) ON DELETE CASCADE;


--
-- Name: income_lists income_lists_financial_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.income_lists
    ADD CONSTRAINT income_lists_financial_account_id_fkey FOREIGN KEY (financial_account_id) REFERENCES public.financial_accounts(id);


--
-- Name: income_lists income_lists_project_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.income_lists
    ADD CONSTRAINT income_lists_project_code_fkey FOREIGN KEY (project_code) REFERENCES public.projects(project_code);


--
-- Name: products products_product_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_product_category_id_fkey FOREIGN KEY (product_category_id) REFERENCES public.product_categories(id);


--
-- Name: project_dates project_dates_created_by_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_dates
    ADD CONSTRAINT project_dates_created_by_fkey1 FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: project_dates project_dates_project_code_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_dates
    ADD CONSTRAINT project_dates_project_code_fkey1 FOREIGN KEY (project_code) REFERENCES public.projects(project_code) ON DELETE CASCADE;


--
-- Name: project_dates project_dates_updated_by_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_dates
    ADD CONSTRAINT project_dates_updated_by_fkey1 FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: projects projects_product_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_product_code_fkey FOREIGN KEY (product_code) REFERENCES public.products(product_code);


--
-- Name: projects projects_project_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_project_type_id_fkey FOREIGN KEY (project_type_id) REFERENCES public.project_types(id);


--
-- Name: projects projects_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict zgy1owvenSxVNcghDsFISEp05Sug0pLj9fhYfHDT8dDj0M3sX3OCqGj0ulAXUFU

