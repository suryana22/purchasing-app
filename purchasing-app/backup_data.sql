--
-- PostgreSQL database dump
--

\restrict L711wd80LrvC1fQ9fLCDyk2vAyxvo1r4TgBiicNvGs9tI4HtPkj0DM3dbXOS6fY

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_ActivityLogs_action; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_ActivityLogs_action" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE'
);


ALTER TYPE public."enum_ActivityLogs_action" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ActivityLogs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ActivityLogs" (
    id integer NOT NULL,
    user_id integer,
    username character varying(255),
    action public."enum_ActivityLogs_action" NOT NULL,
    module character varying(255) NOT NULL,
    target_id character varying(255),
    details text,
    ip_address character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."ActivityLogs" OWNER TO postgres;

--
-- Name: ActivityLogs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ActivityLogs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."ActivityLogs_id_seq" OWNER TO postgres;

--
-- Name: ActivityLogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ActivityLogs_id_seq" OWNED BY public."ActivityLogs".id;


--
-- Name: CompanySettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CompanySettings" (
    id integer NOT NULL,
    company_name character varying(255) NOT NULL,
    company_address text,
    company_logo text,
    company_phone character varying(255),
    company_email character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    direktur_utama character varying(255),
    company_code character varying(255)
);


ALTER TABLE public."CompanySettings" OWNER TO postgres;

--
-- Name: CompanySettings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."CompanySettings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."CompanySettings_id_seq" OWNER TO postgres;

--
-- Name: CompanySettings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."CompanySettings_id_seq" OWNED BY public."CompanySettings".id;


--
-- Name: Departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Departments" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    company_id integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Departments" OWNER TO postgres;

--
-- Name: Departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Departments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Departments_id_seq" OWNER TO postgres;

--
-- Name: Departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Departments_id_seq" OWNED BY public."Departments".id;


--
-- Name: OrderAnalyses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderAnalyses" (
    id integer NOT NULL,
    order_id integer NOT NULL,
    department_id integer NOT NULL,
    analysis_type character varying(255) NOT NULL,
    analysis text NOT NULL,
    description text,
    is_replacement boolean DEFAULT false,
    asset_purchase_year character varying(4),
    remaining_book_value numeric(15,2),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    asset_document text,
    requester_name character varying(255),
    details jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public."OrderAnalyses" OWNER TO postgres;

--
-- Name: OrderAnalyses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."OrderAnalyses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."OrderAnalyses_id_seq" OWNER TO postgres;

--
-- Name: OrderAnalyses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."OrderAnalyses_id_seq" OWNED BY public."OrderAnalyses".id;


--
-- Name: OrderItems; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderItems" (
    id integer NOT NULL,
    order_id integer NOT NULL,
    item_name character varying(255) NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    description text,
    procurement_year character varying(4),
    "deletedAt" timestamp with time zone,
    code character varying(255),
    spec_description text,
    item_type_id integer
);


ALTER TABLE public."OrderItems" OWNER TO postgres;

--
-- Name: OrderItems_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."OrderItems_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."OrderItems_id_seq" OWNER TO postgres;

--
-- Name: OrderItems_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."OrderItems_id_seq" OWNED BY public."OrderItems".id;


--
-- Name: Orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Orders" (
    id integer NOT NULL,
    date timestamp with time zone NOT NULL,
    department_id integer NOT NULL,
    partner_id integer,
    status character varying(255) DEFAULT 'DRAFT'::character varying,
    total_amount numeric(10,2) DEFAULT 0,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    subtotal numeric(10,2) DEFAULT 0,
    ppn numeric(10,2) DEFAULT 0,
    grand_total numeric(10,2) DEFAULT 0,
    order_number character varying(50),
    notes text,
    "deletedAt" timestamp with time zone,
    approved_by integer,
    approval_date timestamp with time zone
);


ALTER TABLE public."Orders" OWNER TO postgres;

--
-- Name: Orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Orders_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Orders_id_seq" OWNER TO postgres;

--
-- Name: Orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Orders_id_seq" OWNED BY public."Orders".id;


--
-- Name: Partners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Partners" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    address text,
    contact_person character varying(255),
    email character varying(255),
    phone character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Partners" OWNER TO postgres;

--
-- Name: Partners_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Partners_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Partners_id_seq" OWNER TO postgres;

--
-- Name: Partners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Partners_id_seq" OWNED BY public."Partners".id;


--
-- Name: Permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Permissions" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Permissions" OWNER TO postgres;

--
-- Name: Permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Permissions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Permissions_id_seq" OWNER TO postgres;

--
-- Name: Permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Permissions_id_seq" OWNED BY public."Permissions".id;


--
-- Name: RolePermissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RolePermissions" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "RoleId" integer NOT NULL,
    "PermissionId" integer NOT NULL
);


ALTER TABLE public."RolePermissions" OWNER TO postgres;

--
-- Name: Roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Roles" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Roles" OWNER TO postgres;

--
-- Name: Roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Roles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Roles_id_seq" OWNER TO postgres;

--
-- Name: Roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Roles_id_seq" OWNED BY public."Roles".id;


--
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    role_id integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- Name: Users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Users_id_seq" OWNER TO postgres;

--
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Users_id_seq" OWNED BY public."Users".id;


--
-- Name: item_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.item_types (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    prefix character varying(10) NOT NULL,
    description text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public.item_types OWNER TO postgres;

--
-- Name: item_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.item_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.item_types_id_seq OWNER TO postgres;

--
-- Name: item_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.item_types_id_seq OWNED BY public.item_types.id;


--
-- Name: master_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_items (
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    partner_id integer NOT NULL,
    price double precision DEFAULT '0'::double precision NOT NULL,
    vat_percentage double precision DEFAULT '0'::double precision NOT NULL,
    vat_amount double precision DEFAULT '0'::double precision NOT NULL,
    total_price double precision DEFAULT '0'::double precision NOT NULL,
    description text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    item_type_id integer
);


ALTER TABLE public.master_items OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    message text NOT NULL,
    resource_type character varying(255),
    resource_id integer,
    action_type character varying(255),
    target_permission character varying(255),
    is_read boolean DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: special_master_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.special_master_items (
    id integer NOT NULL,
    code character varying(255),
    name character varying(255) NOT NULL,
    price double precision DEFAULT '0'::double precision NOT NULL,
    description text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public.special_master_items OWNER TO postgres;

--
-- Name: special_master_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.special_master_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.special_master_items_id_seq OWNER TO postgres;

--
-- Name: special_master_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.special_master_items_id_seq OWNED BY public.special_master_items.id;


--
-- Name: ActivityLogs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ActivityLogs" ALTER COLUMN id SET DEFAULT nextval('public."ActivityLogs_id_seq"'::regclass);


--
-- Name: CompanySettings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CompanySettings" ALTER COLUMN id SET DEFAULT nextval('public."CompanySettings_id_seq"'::regclass);


--
-- Name: Departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Departments" ALTER COLUMN id SET DEFAULT nextval('public."Departments_id_seq"'::regclass);


--
-- Name: OrderAnalyses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderAnalyses" ALTER COLUMN id SET DEFAULT nextval('public."OrderAnalyses_id_seq"'::regclass);


--
-- Name: OrderItems id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItems" ALTER COLUMN id SET DEFAULT nextval('public."OrderItems_id_seq"'::regclass);


--
-- Name: Orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders" ALTER COLUMN id SET DEFAULT nextval('public."Orders_id_seq"'::regclass);


--
-- Name: Partners id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Partners" ALTER COLUMN id SET DEFAULT nextval('public."Partners_id_seq"'::regclass);


--
-- Name: Permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions" ALTER COLUMN id SET DEFAULT nextval('public."Permissions_id_seq"'::regclass);


--
-- Name: Roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles" ALTER COLUMN id SET DEFAULT nextval('public."Roles_id_seq"'::regclass);


--
-- Name: Users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public."Users_id_seq"'::regclass);


--
-- Name: item_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_types ALTER COLUMN id SET DEFAULT nextval('public.item_types_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: special_master_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.special_master_items ALTER COLUMN id SET DEFAULT nextval('public.special_master_items_id_seq'::regclass);


--
-- Data for Name: ActivityLogs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ActivityLogs" (id, user_id, username, action, module, target_id, details, ip_address, "createdAt", "updatedAt") FROM stdin;
1	1	admin	CREATE	departments	1	{"name":"Departemen Penunjang Umum","description":"","company_id":1}	::ffff:172.20.0.1	2026-01-30 02:36:10.397+00	2026-01-30 02:36:10.397+00
2	1	admin	CREATE	partners	1	{"name":"Datascrip","address":"Gedung Datascrip Kav 9, Jl. Selaparang Blok B-15, RW.10, Gn. Sahari Sel., Kec. Kemayoran, Daerah Khusus Ibukota Jakarta 10610, Indonesia","contact_person":"Valentine","email":null,"phone":null}	::ffff:172.20.0.1	2026-01-30 02:57:59.889+00	2026-01-30 02:57:59.889+00
3	1	admin	CREATE	items	TI-0091487	{"code":"TI-0091487","name":"Asus NB Core 5","partner_id":"1","price":13450000,"vat_percentage":11,"vat_amount":1479500,"total_price":14929500,"description":""}	::ffff:172.20.0.1	2026-01-30 02:58:43.135+00	2026-01-30 02:58:43.135+00
4	1	admin	CREATE	Order	PO-20260130-001	{"department_id":1,"partner_id":1,"notes":"PERMINTAAN TAMBAHAN","subtotal":13450000,"ppn":1479500,"grand_total":14929500,"items":[{"item_name":"Asus NB Core 5","description":"PBB","procurement_year":"","quantity":1,"unit_price":13450000,"total_price":13450000}]}	::ffff:172.20.0.1	2026-01-30 03:13:20.921+00	2026-01-30 03:13:20.921+00
5	1	admin	UPDATE	companies	1	{"company_name":"PT. Medika Loka Manajemen","company_address":"","company_logo":"data:image/jpeg;base64,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","company_phone":"","company_email":""}	::ffff:172.20.0.1	2026-01-30 03:21:06.522+00	2026-01-30 03:21:06.522+00
6	1	admin	CREATE	special_items	1	{"name":"ADAPTOR LAPTOP","price":"850000","description":"SN : 123455757"}	::ffff:172.20.0.1	2026-01-30 03:52:54.434+00	2026-01-30 03:52:54.434+00
7	1	admin	CREATE	Order	PO-20260130-002	{"department_id":1,"partner_id":1,"notes":"ADAPTOR","subtotal":850000,"ppn":93500,"grand_total":943500,"items":[{"item_name":"ADAPTOR LAPTOP","description":"SN : 123455757","procurement_year":"","quantity":1,"unit_price":"850000","total_price":850000}]}	::ffff:172.20.0.1	2026-01-30 03:52:54.508+00	2026-01-30 03:52:54.508+00
8	1	admin	DELETE	Order	PO-20260130-002	\N	::ffff:172.20.0.1	2026-01-30 04:07:17.157+00	2026-01-30 04:07:17.157+00
9	1	admin	UPDATE	Order	PO-20260129-001	{"department_id":1,"partner_id":1,"notes":"Permintaan Laptop Baru dan Penggantian Barang Lama","subtotal":29000000,"ppn":3190000,"grand_total":32190000,"items":[{"item_name":"Laptop Asus Core 5","description":"PBB","procurement_year":"","quantity":2,"unit_price":14500000,"total_price":29000000}]}	::ffff:172.20.0.1	2026-01-30 04:08:15.094+00	2026-01-30 04:08:15.094+00
10	1	admin	CREATE	departments	2	{"name":"Departemen Pembangunan","description":"","company_id":1}	::ffff:172.20.0.1	2026-01-30 04:12:09.971+00	2026-01-30 04:12:09.971+00
11	1	admin	UPDATE	users	2	{"username":"itsupport","first_name":"IT","last_name":"Support","role_id":"2"}	::ffff:172.20.0.1	2026-01-30 08:19:00.364+00	2026-01-30 08:19:00.364+00
12	2	itsupport	CREATE	special_items	2	{"name":"ADAPTER 45W19V 2P(4PHI)","price":605000,"description":"SN : M8N0LP02Z24934E\\nPN : 0A001-00696500"}	::ffff:172.20.0.1	2026-01-30 08:32:40.441+00	2026-01-30 08:32:40.441+00
13	2	itsupport	CREATE	Order	PO-20260130-003	{"department_id":2,"partner_id":1,"notes":"ADAPTO CHARGER","subtotal":605000,"ppn":66550,"grand_total":671550,"items":[{"item_name":"ADAPTER 45W19V 2P(4PHI)","description":"","procurement_year":"","quantity":1,"unit_price":605000,"total_price":605000}]}	::ffff:172.20.0.1	2026-01-30 08:32:40.52+00	2026-01-30 08:32:40.52+00
14	1	admin	UPDATE	roles	3	{"name":"it support","description":"","permissionIds":[9,10,11,13,14,15,17,21,22,23,25,26,27,1,2,3]}	::ffff:172.20.0.1	2026-01-30 08:39:16.654+00	2026-01-30 08:39:16.654+00
15	1	admin	CREATE	item_types	1	{"name":"Teknologi Informasi","prefix":"TI","description":"Persediaan untuk kebutuhan IT"}	::ffff:172.20.0.1	2026-01-30 08:54:34.778+00	2026-01-30 08:54:34.778+00
16	1	admin	UPDATE	partners	1	{"name":"Datascrip","item_type_id":"1","address":"Gedung Datascrip Kav 9, Jl. Selaparang Blok B-15, RW.10, Gn. Sahari Sel., Kec. Kemayoran, Daerah Khusus Ibukota Jakarta 10610, Indonesia","contact_person":"Valentine","email":null,"phone":null}	::ffff:172.20.0.1	2026-01-30 08:55:06.108+00	2026-01-30 08:55:06.108+00
17	1	admin	CREATE	item_types	2	{"name":"Alat Umum","prefix":"ALUM","description":"Persediaan barang kebutuhan harian"}	::ffff:172.20.0.1	2026-01-30 08:58:39.607+00	2026-01-30 08:58:39.607+00
18	1	admin	CREATE	partners	2	{"name":"PT. United Teknologi Informasi","address":null,"contact_person":"Agus Halim","email":null,"phone":null}	::ffff:172.20.0.1	2026-01-30 09:02:26.834+00	2026-01-30 09:02:26.834+00
19	1	admin	UPDATE	items	TI-0091487	{"code":"TI-0091487","name":"Asus NB Core 5","partner_id":"1","item_type_id":"1","price":13450000,"vat_percentage":11,"vat_amount":1479500,"total_price":14929500,"description":""}	::ffff:172.20.0.1	2026-01-30 09:03:03.945+00	2026-01-30 09:03:03.945+00
20	1	admin	CREATE	item_types	3	{"name":"Alat Kesehatan","prefix":"ALK","description":""}	::ffff:172.20.0.1	2026-01-30 09:04:01.434+00	2026-01-30 09:04:01.434+00
21	1	admin	UPDATE	companies	1	{"company_name":"PT. Medika Loka Manajemen","company_address":"","company_logo":"data:image/jpeg;base64,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","company_phone":"","company_email":"","direktur_utama":"Dr.. Yulisar Khiat, SE, ME, MARS","company_code":""}	::ffff:172.20.0.1	2026-02-03 01:12:03.359+00	2026-02-03 01:12:03.359+00
22	1	admin	DELETE	items	TI-0091487	\N	::ffff:172.20.0.1	2026-02-03 06:48:34.458+00	2026-02-03 06:48:34.458+00
23	1	admin	UPDATE	partners	1	{"name":"PT. DATASCRIP BUSINESS SOLUTIONS","address":"Gedung Datascrip Kav 9, Jl. Selaparang Blok B-15, RW.10, Gn. Sahari Sel., Kec. Kemayoran, Daerah Khusus Ibukota Jakarta 10610, Indonesia","contact_person":"Valentine","email":null,"phone":"08561111333"}	::ffff:172.20.0.1	2026-02-03 06:49:11.39+00	2026-02-03 06:49:11.39+00
24	1	admin	UPDATE	partners	2	{"name":"PT. United Teknologi Integrasi","address":"Jl. Siantar No.18, RT. 1/RW.2, Cideng, Kecamatan Gambir,\\nKota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10150","contact_person":"Agus Hendrawan","email":null,"phone":"08161330045"}	::ffff:172.20.0.1	2026-02-03 06:49:50.452+00	2026-02-03 06:49:50.452+00
25	1	admin	UPDATE	partners	1	{"name":"PT. Datascrip Business Solutions","address":"Gedung Datascrip Kav 9, Jl. Selaparang Blok B-15, RW.10, Gn. Sahari Sel., Kec. Kemayoran, Daerah Khusus Ibukota Jakarta 10610, Indonesia","contact_person":"Valentine","email":null,"phone":"08561111333"}	::ffff:172.20.0.1	2026-02-03 06:51:09.607+00	2026-02-03 06:51:09.607+00
26	1	admin	CREATE	items	TI-20260203135115	{"code":"TI-20260203135115","name":"Asus AIO P440VAK-BPC020XS","partner_id":"1","item_type_id":"1","price":16497200,"vat_percentage":11,"vat_amount":1814692,"total_price":18311892,"description":"23.8\\"FHD/ i5-13420H/16G DDR5/512G SSD/TPM/Wired KB+Mouse/Win\\nPro+Office Home Business 2024/3Y OSS"}	::ffff:172.20.0.1	2026-02-03 06:52:06.993+00	2026-02-03 06:52:06.993+00
27	1	admin	CREATE	items	TI-20260203135215	{"code":"TI-20260203135215","name":"Windows 11 Pro","partner_id":"1","item_type_id":"1","price":1735000,"vat_percentage":11,"vat_amount":190850,"total_price":1925850,"description":"Lisensi Windows 11 Pro"}	::ffff:172.20.0.1	2026-02-03 06:52:38.884+00	2026-02-03 06:52:38.884+00
28	1	admin	CREATE	items	TI-20260203135245	{"code":"TI-20260203135245","name":"Kaspersky Antivirus Plus 3 User","partner_id":"1","item_type_id":"1","price":278000,"vat_percentage":11,"vat_amount":30580,"total_price":308580,"description":"Kaspersky Antivirus untuk 3 user"}	::ffff:172.20.0.1	2026-02-03 06:53:22.471+00	2026-02-03 06:53:22.471+00
29	1	admin	CREATE	special_items	3	{"name":"ADAPTER 45W19V 2P(4PHI)","code":"TI-20260203135535","price":605000,"description":"SN : M8N0LP02Z24934E\\nPN : 0A001-00696500"}	::ffff:172.20.0.1	2026-02-03 06:55:44.431+00	2026-02-03 06:55:44.431+00
30	1	admin	CREATE	Order	PO-20260203-001	{"department_id":1,"partner_id":1,"notes":"PERGANTIAN ADAPTOR CHARGER LAPTOP","subtotal":605000,"ppn":66550,"grand_total":671550,"items":[{"item_name":"ADAPTER 45W19V 2P(4PHI)","code":"TI-20260203135535","description":"","spec_description":"SN : M8N0LP02Z24934E\\nPN : 0A001-00696500","procurement_year":"","quantity":1,"unit_price":605000,"total_price":605000}]}	::ffff:172.20.0.1	2026-02-03 06:55:44.613+00	2026-02-03 06:55:44.613+00
31	1	admin	CREATE	users	3	{"username":"305241202","role_id":1}	::ffff:172.20.0.1	2026-02-03 06:56:35.642+00	2026-02-03 06:56:35.642+00
32	3	305241202	UPDATE	companies	1	{"company_name":"PT. Medika Loka Manajemen","company_address":"","company_logo":"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCACHAIcDASIAAhEBAxEB/8QAHAABAAIDAQEBAAAAAAAAAAAAAAIIAwcJBQYB/8QAShAAAQIDAgcKCQoEBwAAAAAAAAIDBAUGBwgBCRIUM3KSERMZMTI3U1Z0dRg0NjhCUnOisRUhIkFDV3akssIXNVGUFiQmVWKBkf/EABsBAAIDAQEBAAAAAAAAAAAAAAAEAgUGAwEH/8QAMBEAAQMDAQQJAwUAAAAAAAAAAAIDBAEFEjIGMUJyERMUFSE0NTZDFiIzI0FEUlT/2gAMAwEAAhEDEQA/AKuXrr4dpVvlbTNDc+jJdSzDy2YCWQ72QjChHpr9crnhiH8H269sg7pV6xA++w4rMRrBlJVZVM2cxHTL2xnMR0y9swgbAzZzEdMvbGcxHTL2zCAAzZzEdMvbGcxHTL2zCAAzZzEdMvbGcxHTL2zCAAzZzEdMvbGcxHTL2zCAAzZzEdMvbGcxHTL2zCAAzZzEdMvbGdxSeJ9e2YQAFoLq1+W0q79OcMHNJvFzymHWFoVLYteWhlz0FoBV8FO/YIMhfWKR4k6PLoSe0qtciSe0qtciW6CAAB6AAAAAAAAAAAAAAAAAAAAAAAATd0ytY3zdZu5QVu8yma5zOHoKXytG6veeWtZoZ3Sr1i8WLd8Wq3Wb+BRX2S9Ft6nmdZNpGaz6jg7rM+s849wcHdZp1nnHuGt72lvdqlCWvxtP0rVUTAQKGUZDSDTGC9db31/jNhBnIcS+SmUPIkajt+kgtfwd1mfWace4ODusz6zTj3Cp/hXW9/eBGbCB4V1vf3gRmwgZ7rv3+gMmSzdVYviiIKn5hFyar5giLhWXHmVxGRkfQKHRTK4Z92FX9ivIwqNlTm8tbZPpdESeY13HrhIpGQ8hGHIyzV61ZXGXdnjTYqVdrdyOS1J4D8JIRlqQj1yJNnTp1y5dr0J6aHMvLZ1cBpKd0bKp5UdTR+ezGGbfWiH5CMs+l4O6zTBxVPOPcNwTKax0hu8LnMqfWzFwVPb+yv1F5BzwXett3ylf69i/nX6iD5vCXebq4tTLuOI2qiGy1/B3WZ9Z5x7g4O6zPrNOPcKn+Fdb394EZsIHhXW9/eBGbCC07rv1f5BHJothwd1mnWece4VbvO2Cwtg9XQsqls1XHwMxZ35lTvLSb1uWW3WmWj2oxcirCp3phCNy5x5DS/XPExjflnTPYVnC3SbjFuyYcl3IF0RVGZTwAG+FibulXrF4MW74tVus38Cj7ulXrF4MW74tVus38DNbUemLOzOs0/fk595h7Fsr7g4sJYK/Jz7zD2LZX3BxYR6yeSa5SC9Z+AAtv2IF27I7m9AVnYW1Ws7ioz5amMG5FMutL+gzkf8AApdMITDAxz8Ev7B1bf8A4dUbvHmz0/3U+cuKhw7lQTDtLn6zJbOy3ZUiQh5XEdnk9FEnlk2tKjWIE2tKjWNW7+M40Or9VebJG/hv9hygXy1651fqrzZI38N/sOUC+WvXMZslve5hiQQABthctLi8eeeN7qePcxjXlnTPYVnh4vHnnje6nj3MY35Z0z2BZh3PcieUZ+Ip8ADcCxN3Sr1i8GLd8Wq3Wb+BR93Sr1i8GLd8Wq3Wb+BmtqPTFnZnWafvyc+8w9i2V9wcWEsFfk595h7Fsr7g4sI9ZPItcpBes/AAW1dxCh1bu8ebPT/dT5y4qL+fzDtLn6zqPd482en+6nzlxUXlBMO0ufrMPsr5uXzDD25J5ZNrSo1iBNrSo1jbO/jF6HV+qvNkjfw3+w5QL5a9c6v1V5skb+G/2HKBfLXrmM2S3vcwxIIAA2wuWlxePPPG91PHuYxvyzpnsCzw8XjzzxvdTx7mMb8s6Z7Asw7nuRPKM/GU+ABuBYm7pV6xeDFu+LVbrN/Ao+7pV6xeDFweK1brtma2p9MWdmdZp+/Hz7zH2KCvn1f9lg783PvMOztlfPqH7J6e1ykF6wAC1ruIHVu7x5s9P91PnLiov5/MO0ufrOpN3VGXdpp9tv6a1ypZzYn9nFfOzyYON0dNVJXEuZH+WX65g9mHkNS5GauIYe0JPiSbK8KHUOf0WfR/wytC6mTj+zWS/hjaF1NnH9ms2NZTFfDMXL21JeNsoibszsCxU0MuZvyfMkQP22/5BztXylHszWjasksNnc2puYQcPh9N6HWhB4eDBuiVnt7NvqurK8sya15gAFyQLS4vHnnje6nj3MY35Z0z2BZ4OLy5543up4+hxjflnTPYVmHX7kTyjPxFOwAbgWJuaZe76xZa5pb7R1jMwncDWm/Mwk0QhaIhCMvIWgrS7pV6xDd3RKXDROj9S8SQvqzal420yVWrWpzOqpEwtuXuZDbOXy15BqvBxjd3AdYzCIrKWUcJEAAY3gX4u5XvbK6Vsqk9I1jHPS2NlCN40OWhaDZXho3dusH5NZy+w/OPnMo7sjEeeW9mr7jsmQqh1B8NG7t1g/JrHhn3dv8Af/yazl7uYRuYTl9GRP7qPO0LOgdu97OwyqLL53TkjX8qxsxZWwy1m2RkL9c5+AF7a7W1a0YNEVr6wAAsyBum6ha5ILHLTv8AEFTtvfJ8VDLhXlo9A9i+FbXStslay+Ko7fly+XQ2878tGRvqyvww7mHiKzuppcvt3GTz+zAAAsyBJ7Sq1yJJ7Sq1iJ4gAAD0AAAAAAAAAAAAAAAAAAAAAAAA2XeCsfnVh1qE7oKd4WF4YOJcww7rTmXlM+hu/wBDWmAArrY8p+Mha95NesAAsSAAAAAAAAAAAAAAAAAAAABtS7xYTUl4Ouk0fT62W8mHW+4469kYMGQj6gAY663SRGkVQivh0HVCaVof/9k=","company_phone":"","company_email":"","direktur_utama":"Dr. Yulisar Khiat, SE, ME, MARS","company_code":""}	::ffff:172.20.0.1	2026-02-03 07:04:14.367+00	2026-02-03 07:04:14.367+00
33	3	305241202	UPDATE	companies	1	{"company_name":"PT. Medika Loka Manajemen","company_address":"Jalan HBR Motik B.10 Kaveling 4, Kelurahan Gunung Sahari Selatan, Kecamatan Kemayoran Baru, Jakarta Pusat","company_logo":"data:image/jpeg;base64,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","company_phone":"1063489","company_email":"","direktur_utama":"Dr. Yulisar Khiat, SE, ME, MARS","company_code":""}	::ffff:172.20.0.1	2026-02-03 07:05:02.447+00	2026-02-03 07:05:02.447+00
34	3	305241202	DELETE	Order	PO-20260203-001	\N	::ffff:172.20.0.1	2026-02-03 07:12:59.552+00	2026-02-03 07:12:59.552+00
35	3	305241202	UPDATE	Order	PO-20260203-001	{"department_id":2,"partner_id":1,"notes":"PERGANTIAN ADAPTOR CHARGER LAPTOP","subtotal":605000,"ppn":66550,"grand_total":671550,"items":[{"item_name":"ADAPTER 45W19V 2P(4PHI)","code":"TI-20260203135535","description":"","procurement_year":"","quantity":1,"unit_price":605000,"total_price":605000}]}	::ffff:172.20.0.1	2026-02-03 07:34:21.837+00	2026-02-03 07:34:21.837+00
36	3	305241202	DELETE	Order	PO-20260203-001	\N	::ffff:172.20.0.1	2026-02-03 07:39:44.733+00	2026-02-03 07:39:44.733+00
37	3	305241202	CREATE	special_items	4	{"name":"ADAPTER 45W19V 2P(4PHI)","code":"TI-20260203144124","price":605000,"description":"SN : M8N0LP02Z24934E\\nPN : 0A001-00696500"}	::ffff:172.20.0.1	2026-02-03 07:41:33.047+00	2026-02-03 07:41:33.047+00
38	3	305241202	CREATE	Order	PO-20260203-002	{"department_id":2,"partner_id":1,"notes":"PENGGANTIAN ADAPTOR CHARGER","subtotal":605000,"ppn":66550,"grand_total":671550,"items":[{"item_name":"ADAPTER 45W19V 2P(4PHI)","code":"TI-20260203144124","description":"","spec_description":"SN : M8N0LP02Z24934E\\nPN : 0A001-00696500","procurement_year":"","quantity":1,"unit_price":605000,"total_price":605000}]}	::ffff:172.20.0.1	2026-02-03 07:41:33.145+00	2026-02-03 07:41:33.145+00
39	1	admin	CREATE	users	4	{"username":"beta_tester","role_id":2}	::ffff:172.20.0.1	2026-02-04 03:53:49.517+00	2026-02-04 03:53:49.517+00
40	1	admin	UPDATE	users	4	{"username":"beta_tester","password":"$2b$10$2OV.SbQ4xDkWJylQDkJ4.Ojhb2rCR1RZXYWn0aeniz.bIjsQnoxTm","first_name":"Beta","last_name":"Tester","role_id":2}	::ffff:172.20.0.1	2026-02-04 03:54:25.289+00	2026-02-04 03:54:25.289+00
41	1	admin	UPDATE	roles	2	{"name":"staff","description":"Akses operasional dasar","permissionIds":[9,13,17,21,33,34,47]}	::ffff:172.20.0.1	2026-02-04 03:57:08.394+00	2026-02-04 03:57:08.394+00
42	1	admin	UPDATE	users	4	{"username":"beta_tester","first_name":"Beta","last_name":"Tester","role_id":"3"}	::ffff:172.20.0.1	2026-02-04 03:57:54.935+00	2026-02-04 03:57:54.935+00
43	1	admin	UPDATE	users	4	{"username":"beta_tester","password":"$2b$10$fzLMyyeIqeyVDecWxH9qqur21SC8ldIYOmVnOTV4AC0QHSW4IVfzG","first_name":"Beta","last_name":"Tester","role_id":3}	::ffff:172.20.0.1	2026-02-04 04:00:15.141+00	2026-02-04 04:00:15.141+00
44	1	admin	DELETE	users	4	\N	::ffff:172.20.0.1	2026-02-04 04:00:49.266+00	2026-02-04 04:00:49.266+00
45	1	admin	CREATE	users	7	{"username":"testing","role_id":2}	::ffff:172.20.0.1	2026-02-04 04:05:01.569+00	2026-02-04 04:05:01.569+00
\.


--
-- Data for Name: CompanySettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CompanySettings" (id, company_name, company_address, company_logo, company_phone, company_email, "createdAt", "updatedAt", "deletedAt", direktur_utama, company_code) FROM stdin;
1	PT. Medika Loka Manajemen	Jalan HBR Motik B.10 Kaveling 4, Kelurahan Gunung Sahari Selatan, Kecamatan Kemayoran Baru, Jakarta Pusat	data:image/jpeg;base64,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	1063489		2026-01-30 02:20:06.708+00	2026-02-03 07:05:02.398+00	\N	Dr. Yulisar Khiat, SE, ME, MARS	
\.


--
-- Data for Name: Departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Departments" (id, name, description, company_id, "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	Departemen Penunjang Umum		1	2026-01-30 02:36:10.336+00	2026-01-30 02:36:10.336+00	\N
2	Departemen Pembangunan		1	2026-01-30 04:12:09.966+00	2026-01-30 04:12:09.966+00	\N
\.


--
-- Data for Name: OrderAnalyses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderAnalyses" (id, order_id, department_id, analysis_type, analysis, description, is_replacement, asset_purchase_year, remaining_book_value, "createdAt", "updatedAt", asset_document, requester_name, details) FROM stdin;
1	1	1	Analisa Perbaikan	Serabut kabel keluar/terkelupas, sehingga bila tidak dilakukan penggantiaan maka risiko terjadi korsleting listrik. Kerusakan pada perangkat, pengisian daya laptop tidak maksimal dan risiko kejutan listrik.	Perlu dilakukan penggantian adaptor charger	f		\N	2026-02-03 06:59:36.91+00	2026-02-03 06:59:36.91+00		Cahyo (Depbang)	[{"analysis": "Serabut kabel keluar/terkelupas, sehingga bila tidak dilakukan penggantiaan maka risiko terjadi korsleting listrik. Kerusakan pada perangkat, pengisian daya laptop tidak maksimal dan risiko kejutan listrik.", "description": "Perlu dilakukan penggantian adaptor charger", "asset_document": "", "is_replacement": false, "requester_name": "Cahyo (Depbang)", "asset_purchase_year": "", "remaining_book_value": ""}]
2	2	2	Analisa Kerusakan	Serabut kabel keluar/terkelupas, sehingga bila tidak dilakukan penggantiaan maka risiko terjadi Korsleting listrik. Kerusakan pada perangkat, pengisian daya laptop tidak maksimal dan risiko kejutan listrik	Perlu penggantian adaptor charger	f		\N	2026-02-03 07:43:50.914+00	2026-02-03 07:43:50.914+00		Cahyo (Depbang)	[{"analysis": "Serabut kabel keluar/terkelupas, sehingga bila tidak dilakukan penggantiaan maka risiko terjadi Korsleting listrik. Kerusakan pada perangkat, pengisian daya laptop tidak maksimal dan risiko kejutan listrik", "description": "Perlu penggantian adaptor charger", "asset_document": "", "is_replacement": false, "requester_name": "Cahyo (Depbang)", "asset_purchase_year": "", "remaining_book_value": ""}]
\.


--
-- Data for Name: OrderItems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderItems" (id, order_id, item_name, quantity, unit_price, total_price, "createdAt", "updatedAt", description, procurement_year, "deletedAt", code, spec_description, item_type_id) FROM stdin;
1	1	ADAPTER 45W19V 2P(4PHI)	1	605000.00	605000.00	2026-02-03 06:55:44.586+00	2026-02-03 06:55:44.586+00	SN : M8N0LP02Z24934E\nPN : 0A001-00696500		2026-02-03 07:34:21.8+00	TI-20260203135535	\N	\N
3	2	ADAPTER 45W19V 2P(4PHI)	1	605000.00	605000.00	2026-02-03 07:41:33.131+00	2026-02-03 07:41:33.131+00			\N	TI-20260203144124	SN : M8N0LP02Z24934E\nPN : 0A001-00696500	\N
\.


--
-- Data for Name: Orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Orders" (id, date, department_id, partner_id, status, total_amount, "createdAt", "updatedAt", subtotal, ppn, grand_total, order_number, notes, "deletedAt", approved_by, approval_date) FROM stdin;
1	2026-02-03 06:55:44.527+00	2	1	APPROVED	0.00	2026-02-03 06:55:44.533+00	2026-02-03 07:34:21.772+00	605000.00	66550.00	671550.00	PO-20260203-001	PERGANTIAN ADAPTOR CHARGER LAPTOP	2026-02-03 07:39:44.714+00	1	2026-02-03 06:56:01.325+00
2	2026-02-03 07:41:33.117+00	2	1	APPROVED	0.00	2026-02-03 07:41:33.118+00	2026-02-03 07:41:54.23+00	605000.00	66550.00	671550.00	PO-20260203-002	PENGGANTIAN ADAPTOR CHARGER	\N	1	2026-02-03 07:41:54.229+00
\.


--
-- Data for Name: Partners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Partners" (id, name, address, contact_person, email, phone, "createdAt", "updatedAt", "deletedAt") FROM stdin;
2	PT. United Teknologi Integrasi	Jl. Siantar No.18, RT. 1/RW.2, Cideng, Kecamatan Gambir,\nKota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10150	Agus Hendrawan	\N	08161330045	2026-01-30 09:02:26.794+00	2026-02-03 06:49:50.404+00	\N
1	PT. Datascrip Business Solutions	Gedung Datascrip Kav 9, Jl. Selaparang Blok B-15, RW.10, Gn. Sahari Sel., Kec. Kemayoran, Daerah Khusus Ibukota Jakarta 10610, Indonesia	Valentine	\N	08561111333	2026-01-30 02:57:59.852+00	2026-02-03 06:51:09.565+00	\N
\.


--
-- Data for Name: Permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Permissions" (id, name, description, "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	users.view	Melihat di Manajemen Pengguna	2026-01-30 02:08:33.552+00	2026-01-30 02:08:33.552+00	\N
2	users.create	Menambah di Manajemen Pengguna	2026-01-30 02:08:33.576+00	2026-01-30 02:08:33.576+00	\N
3	users.edit	Mengubah di Manajemen Pengguna	2026-01-30 02:08:33.583+00	2026-01-30 02:08:33.583+00	\N
4	users.delete	Menghapus di Manajemen Pengguna	2026-01-30 02:08:33.59+00	2026-01-30 02:08:33.59+00	\N
5	roles.view	Melihat di Role & Izin	2026-01-30 02:08:33.598+00	2026-01-30 02:08:33.598+00	\N
6	roles.create	Menambah di Role & Izin	2026-01-30 02:08:33.607+00	2026-01-30 02:08:33.607+00	\N
7	roles.edit	Mengubah di Role & Izin	2026-01-30 02:08:33.615+00	2026-01-30 02:08:33.615+00	\N
8	roles.delete	Menghapus di Role & Izin	2026-01-30 02:08:33.624+00	2026-01-30 02:08:33.624+00	\N
9	departments.view	Melihat di Master Departemen	2026-01-30 02:08:33.631+00	2026-01-30 02:08:33.631+00	\N
10	departments.create	Menambah di Master Departemen	2026-01-30 02:08:33.639+00	2026-01-30 02:08:33.639+00	\N
11	departments.edit	Mengubah di Master Departemen	2026-01-30 02:08:33.647+00	2026-01-30 02:08:33.647+00	\N
12	departments.delete	Menghapus di Master Departemen	2026-01-30 02:08:33.654+00	2026-01-30 02:08:33.654+00	\N
13	partners.view	Melihat di Master Rekanan/Vendor	2026-01-30 02:08:33.66+00	2026-01-30 02:08:33.66+00	\N
14	partners.create	Menambah di Master Rekanan/Vendor	2026-01-30 02:08:33.666+00	2026-01-30 02:08:33.666+00	\N
15	partners.edit	Mengubah di Master Rekanan/Vendor	2026-01-30 02:08:33.672+00	2026-01-30 02:08:33.672+00	\N
16	partners.delete	Menghapus di Master Rekanan/Vendor	2026-01-30 02:08:33.677+00	2026-01-30 02:08:33.677+00	\N
17	items.view	Melihat di Master Barang	2026-01-30 02:08:33.683+00	2026-01-30 02:08:33.683+00	\N
18	items.create	Menambah di Master Barang	2026-01-30 02:08:33.689+00	2026-01-30 02:08:33.689+00	\N
19	items.edit	Mengubah di Master Barang	2026-01-30 02:08:33.694+00	2026-01-30 02:08:33.694+00	\N
20	items.delete	Menghapus di Master Barang	2026-01-30 02:08:33.699+00	2026-01-30 02:08:33.699+00	\N
21	orders.view	Melihat di Pemesanan Barang	2026-01-30 02:08:33.707+00	2026-01-30 02:08:33.707+00	\N
22	orders.create	Menambah di Pemesanan Barang	2026-01-30 02:08:33.714+00	2026-01-30 02:08:33.714+00	\N
23	orders.edit	Mengubah di Pemesanan Barang	2026-01-30 02:08:33.72+00	2026-01-30 02:08:33.72+00	\N
24	orders.delete	Menghapus di Pemesanan Barang	2026-01-30 02:08:33.725+00	2026-01-30 02:08:33.725+00	\N
25	companies.view	Melihat di Identitas Perusahaan	2026-01-30 02:08:33.731+00	2026-01-30 02:08:33.731+00	\N
26	companies.create	Menambah di Identitas Perusahaan	2026-01-30 02:08:33.736+00	2026-01-30 02:08:33.736+00	\N
27	companies.edit	Mengubah di Identitas Perusahaan	2026-01-30 02:08:33.741+00	2026-01-30 02:08:33.741+00	\N
28	companies.delete	Menghapus di Identitas Perusahaan	2026-01-30 02:08:33.746+00	2026-01-30 02:08:33.746+00	\N
29	settings.view	Melihat di Konfigurasi Sistem	2026-01-30 02:08:33.751+00	2026-01-30 02:08:33.751+00	\N
30	settings.create	Menambah di Konfigurasi Sistem	2026-01-30 02:08:33.755+00	2026-01-30 02:08:33.755+00	\N
31	settings.edit	Mengubah di Konfigurasi Sistem	2026-01-30 02:08:33.763+00	2026-01-30 02:08:33.763+00	\N
32	settings.delete	Menghapus di Konfigurasi Sistem	2026-01-30 02:08:33.77+00	2026-01-30 02:08:33.77+00	\N
33	special_items.view	Melihat di Barang Khusus	2026-01-30 03:50:12.825+00	2026-01-30 03:50:12.825+00	\N
34	special_items.create	Menambah di Barang Khusus	2026-01-30 03:50:12.85+00	2026-01-30 03:50:12.85+00	\N
35	special_items.edit	Mengubah di Barang Khusus	2026-01-30 03:50:12.859+00	2026-01-30 03:50:12.859+00	\N
36	special_items.delete	Menghapus di Barang Khusus	2026-01-30 03:50:12.868+00	2026-01-30 03:50:12.868+00	\N
37	users.approve	Menyetujui di Manajemen Pengguna	2026-01-30 04:22:49.776+00	2026-01-30 04:22:49.776+00	\N
38	roles.approve	Menyetujui di Role & Izin	2026-01-30 04:22:49.812+00	2026-01-30 04:22:49.812+00	\N
39	departments.approve	Menyetujui di Master Departemen	2026-01-30 04:22:49.834+00	2026-01-30 04:22:49.834+00	\N
40	partners.approve	Menyetujui di Master Rekanan/Vendor	2026-01-30 04:22:49.851+00	2026-01-30 04:22:49.851+00	\N
41	items.approve	Menyetujui di Master Barang	2026-01-30 04:22:49.871+00	2026-01-30 04:22:49.871+00	\N
42	orders.approve	Menyetujui di Pemesanan Barang	2026-01-30 04:22:49.889+00	2026-01-30 04:22:49.889+00	\N
43	companies.approve	Menyetujui di Identitas Perusahaan	2026-01-30 04:22:49.905+00	2026-01-30 04:22:49.905+00	\N
44	settings.approve	Menyetujui di Konfigurasi Sistem	2026-01-30 04:22:49.922+00	2026-01-30 04:22:49.922+00	\N
45	special_items.approve	Menyetujui di Barang Khusus	2026-01-30 04:22:49.939+00	2026-01-30 04:22:49.939+00	\N
46	orders.special	Membuat Pesanan Khusus (Luar Master)	2026-01-30 08:44:49.668+00	2026-01-30 08:44:49.668+00	\N
47	item_types.view	Melihat di Jenis Persediaan	2026-01-30 08:51:17.142+00	2026-01-30 08:51:17.142+00	\N
48	item_types.create	Menambah di Jenis Persediaan	2026-01-30 08:51:17.163+00	2026-01-30 08:51:17.163+00	\N
49	item_types.edit	Mengubah di Jenis Persediaan	2026-01-30 08:51:17.17+00	2026-01-30 08:51:17.17+00	\N
50	item_types.delete	Menghapus di Jenis Persediaan	2026-01-30 08:51:17.177+00	2026-01-30 08:51:17.177+00	\N
51	item_types.approve	Menyetujui di Jenis Persediaan	2026-01-30 08:51:17.184+00	2026-01-30 08:51:17.184+00	\N
52	orders.analysis	Membuat Analisa Teknis Permintaan	2026-02-03 06:47:29.935+00	2026-02-03 06:47:29.935+00	\N
\.


--
-- Data for Name: RolePermissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RolePermissions" ("createdAt", "updatedAt", "RoleId", "PermissionId") FROM stdin;
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	1
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	2
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	3
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	4
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	5
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	6
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	7
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	8
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	9
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	10
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	11
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	12
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	13
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	14
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	15
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	16
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	17
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	18
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	19
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	20
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	21
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	22
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	23
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	24
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	25
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	26
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	27
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	28
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	29
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	30
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	31
2026-01-30 02:08:33.799+00	2026-01-30 02:08:33.799+00	1	32
2026-01-30 02:08:33.821+00	2026-01-30 02:08:33.821+00	2	9
2026-01-30 02:08:33.821+00	2026-01-30 02:08:33.821+00	2	13
2026-01-30 02:08:33.821+00	2026-01-30 02:08:33.821+00	2	17
2026-01-30 02:08:33.821+00	2026-01-30 02:08:33.821+00	2	21
2026-01-30 02:22:21.281+00	2026-01-30 02:22:21.281+00	3	9
2026-01-30 02:22:21.281+00	2026-01-30 02:22:21.281+00	3	10
2026-01-30 02:22:21.281+00	2026-01-30 02:22:21.281+00	3	11
2026-01-30 02:22:21.281+00	2026-01-30 02:22:21.281+00	3	13
2026-01-30 02:22:21.281+00	2026-01-30 02:22:21.281+00	3	14
2026-01-30 02:22:21.281+00	2026-01-30 02:22:21.281+00	3	15
2026-01-30 02:22:21.281+00	2026-01-30 02:22:21.281+00	3	17
2026-01-30 02:22:21.281+00	2026-01-30 02:22:21.281+00	3	21
2026-01-30 02:22:21.281+00	2026-01-30 02:22:21.281+00	3	22
2026-01-30 02:22:21.281+00	2026-01-30 02:22:21.281+00	3	23
2026-01-30 02:22:21.281+00	2026-01-30 02:22:21.281+00	3	25
2026-01-30 02:22:21.281+00	2026-01-30 02:22:21.281+00	3	26
2026-01-30 02:22:21.281+00	2026-01-30 02:22:21.281+00	3	27
2026-01-30 03:50:12.894+00	2026-01-30 03:50:12.894+00	1	33
2026-01-30 03:50:12.894+00	2026-01-30 03:50:12.894+00	1	34
2026-01-30 03:50:12.894+00	2026-01-30 03:50:12.894+00	1	35
2026-01-30 03:50:12.894+00	2026-01-30 03:50:12.894+00	1	36
2026-01-30 04:22:49.964+00	2026-01-30 04:22:49.964+00	1	37
2026-01-30 04:22:49.964+00	2026-01-30 04:22:49.964+00	1	38
2026-01-30 04:22:49.964+00	2026-01-30 04:22:49.964+00	1	39
2026-01-30 04:22:49.964+00	2026-01-30 04:22:49.964+00	1	40
2026-01-30 04:22:49.964+00	2026-01-30 04:22:49.964+00	1	41
2026-01-30 04:22:49.964+00	2026-01-30 04:22:49.964+00	1	42
2026-01-30 04:22:49.964+00	2026-01-30 04:22:49.964+00	1	43
2026-01-30 04:22:49.964+00	2026-01-30 04:22:49.964+00	1	44
2026-01-30 04:22:49.964+00	2026-01-30 04:22:49.964+00	1	45
2026-01-30 08:21:49.58+00	2026-01-30 08:21:49.58+00	2	33
2026-01-30 08:29:22.506+00	2026-01-30 08:29:22.506+00	2	34
2026-01-30 08:39:16.627+00	2026-01-30 08:39:16.627+00	3	1
2026-01-30 08:39:16.627+00	2026-01-30 08:39:16.627+00	3	2
2026-01-30 08:39:16.627+00	2026-01-30 08:39:16.627+00	3	3
2026-01-30 08:44:49.715+00	2026-01-30 08:44:49.715+00	1	46
2026-01-30 08:51:17.22+00	2026-01-30 08:51:17.22+00	1	47
2026-01-30 08:51:17.22+00	2026-01-30 08:51:17.22+00	1	48
2026-01-30 08:51:17.22+00	2026-01-30 08:51:17.22+00	1	49
2026-01-30 08:51:17.22+00	2026-01-30 08:51:17.22+00	1	50
2026-01-30 08:51:17.22+00	2026-01-30 08:51:17.22+00	1	51
2026-01-30 08:51:25.226+00	2026-01-30 08:51:25.226+00	2	47
2026-02-03 06:47:30.019+00	2026-02-03 06:47:30.019+00	1	52
2026-02-03 06:47:30.047+00	2026-02-03 06:47:30.047+00	3	47
2026-02-03 06:47:30.047+00	2026-02-03 06:47:30.047+00	3	52
2026-02-04 04:01:05.02+00	2026-02-04 04:01:05.02+00	2	10
2026-02-04 04:01:05.02+00	2026-02-04 04:01:05.02+00	2	11
2026-02-04 04:01:05.02+00	2026-02-04 04:01:05.02+00	2	14
2026-02-04 04:01:05.02+00	2026-02-04 04:01:05.02+00	2	15
2026-02-04 04:01:05.02+00	2026-02-04 04:01:05.02+00	2	18
2026-02-04 04:01:05.02+00	2026-02-04 04:01:05.02+00	2	19
2026-02-04 04:01:05.02+00	2026-02-04 04:01:05.02+00	2	22
2026-02-04 04:01:05.02+00	2026-02-04 04:01:05.02+00	2	23
2026-02-04 04:01:05.02+00	2026-02-04 04:01:05.02+00	2	25
2026-02-04 04:01:05.02+00	2026-02-04 04:01:05.02+00	2	46
2026-02-04 04:01:05.02+00	2026-02-04 04:01:05.02+00	2	48
2026-02-04 04:01:05.02+00	2026-02-04 04:01:05.02+00	2	49
\.


--
-- Data for Name: Roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Roles" (id, name, description, "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	administrator	Akses penuh ke seluruh fitur sistem	2026-01-30 02:08:33.778+00	2026-01-30 02:08:33.778+00	\N
3	it support		2026-01-30 02:22:21.237+00	2026-01-30 08:39:16.556+00	\N
2	staff	Akses operasional dasar	2026-01-30 02:08:33.785+00	2026-02-04 03:57:08.337+00	\N
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Users" (id, username, password, first_name, last_name, role_id, "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	admin	admin	Super	Admin	1	2026-01-30 02:08:33.828+00	2026-01-30 02:08:33.828+00	\N
2	itsupport	$2b$10$wVO/lHzoTSmMkkJo7GUq8.1SGYclun9cSy33JPEG/zry2f6CWoU.a	IT	Support	2	2026-01-30 02:28:29.576+00	2026-01-30 08:19:00.334+00	\N
3	305241202	$2b$10$lF1Terw641ahCKGlbbF08OE0bKLU3wxnemrRdG2M6ZSzcu0VMeST2	Suryana		1	2026-02-03 06:56:35.526+00	2026-02-03 06:56:35.526+00	\N
4	beta_tester	$2b$10$fzLMyyeIqeyVDecWxH9qqur21SC8ldIYOmVnOTV4AC0QHSW4IVfzG	Beta	Tester	3	2026-02-04 03:53:49.423+00	2026-02-04 04:00:15.127+00	2026-02-04 04:00:49.208+00
7	testing	$2b$10$4/dxwQESSuPSo0R3lHsPSer63KLlftbjZuzaid8wehOUYrCiKgi9a	Beta	Tester	2	2026-02-04 04:05:01.537+00	2026-02-04 04:05:01.537+00	\N
\.


--
-- Data for Name: item_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.item_types (id, name, prefix, description, "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	Teknologi Informasi	TI	Persediaan untuk kebutuhan IT	2026-01-30 08:54:34.72+00	2026-01-30 08:54:34.72+00	\N
2	Alat Umum	ALUM	Persediaan barang kebutuhan harian	2026-01-30 08:58:39.556+00	2026-01-30 08:58:39.556+00	\N
3	Alat Kesehatan	ALK		2026-01-30 09:04:01.396+00	2026-01-30 09:04:01.396+00	\N
\.


--
-- Data for Name: master_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_items (code, name, partner_id, price, vat_percentage, vat_amount, total_price, description, "createdAt", "updatedAt", "deletedAt", item_type_id) FROM stdin;
TI-0091487	Asus NB Core 5	1	13450000	11	1479500	14929500		2026-01-30 02:58:43.085+00	2026-01-30 09:03:03.888+00	2026-02-03 06:48:34.432+00	1
TI-20260203135115	Asus AIO P440VAK-BPC020XS	1	16497200	11	1814692	18311892	23.8"FHD/ i5-13420H/16G DDR5/512G SSD/TPM/Wired KB+Mouse/Win\nPro+Office Home Business 2024/3Y OSS	2026-02-03 06:52:06.943+00	2026-02-03 06:52:06.943+00	\N	1
TI-20260203135215	Windows 11 Pro	1	1735000	11	190850	1925850	Lisensi Windows 11 Pro	2026-02-03 06:52:38.844+00	2026-02-03 06:52:38.844+00	\N	1
TI-20260203135245	Kaspersky Antivirus Plus 3 User	1	278000	11	30580	308580	Kaspersky Antivirus untuk 3 user	2026-02-03 06:53:22.424+00	2026-02-03 06:53:22.424+00	\N	1
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, message, resource_type, resource_id, action_type, target_permission, is_read, "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	New Order Created: PO-20260203-001	Order	1	CREATED	orders.approve	t	2026-02-03 06:55:44.62+00	2026-02-03 06:56:04.155+00	\N
2	Order PO-20260203-001 APPROVED by admin	Order	1	APPROVED	\N	t	2026-02-03 06:56:01.368+00	2026-02-03 06:56:04.155+00	\N
3	New Order Created: PO-20260203-002	Order	2	CREATED	orders.approve	t	2026-02-03 07:41:33.15+00	2026-02-03 07:41:49.922+00	\N
4	Order PO-20260203-002 APPROVED by admin	Order	2	APPROVED	\N	t	2026-02-03 07:41:54.27+00	2026-02-03 07:42:07.407+00	\N
\.


--
-- Data for Name: special_master_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.special_master_items (id, code, name, price, description, "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	\N	ADAPTOR LAPTOP	850000	SN : 123455757	2026-01-30 03:52:54.382+00	2026-01-30 03:52:54.382+00	\N
2	\N	ADAPTER 45W19V 2P(4PHI)	605000	SN : M8N0LP02Z24934E\nPN : 0A001-00696500	2026-01-30 08:32:40.41+00	2026-01-30 08:32:40.41+00	\N
3	TI-20260203135535	ADAPTER 45W19V 2P(4PHI)	605000	SN : M8N0LP02Z24934E\nPN : 0A001-00696500	2026-02-03 06:55:44.393+00	2026-02-03 06:55:44.393+00	\N
4	TI-20260203144124	ADAPTER 45W19V 2P(4PHI)	605000	SN : M8N0LP02Z24934E\nPN : 0A001-00696500	2026-02-03 07:41:32.983+00	2026-02-03 07:41:32.983+00	\N
\.


--
-- Name: ActivityLogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ActivityLogs_id_seq"', 45, true);


--
-- Name: CompanySettings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."CompanySettings_id_seq"', 1, true);


--
-- Name: Departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Departments_id_seq"', 2, true);


--
-- Name: OrderAnalyses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."OrderAnalyses_id_seq"', 2, true);


--
-- Name: OrderItems_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."OrderItems_id_seq"', 3, true);


--
-- Name: Orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Orders_id_seq"', 2, true);


--
-- Name: Partners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Partners_id_seq"', 2, true);


--
-- Name: Permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Permissions_id_seq"', 52, true);


--
-- Name: Roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Roles_id_seq"', 3, true);


--
-- Name: Users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Users_id_seq"', 7, true);


--
-- Name: item_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.item_types_id_seq', 3, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 4, true);


--
-- Name: special_master_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.special_master_items_id_seq', 4, true);


--
-- Name: ActivityLogs ActivityLogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ActivityLogs"
    ADD CONSTRAINT "ActivityLogs_pkey" PRIMARY KEY (id);


--
-- Name: CompanySettings CompanySettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CompanySettings"
    ADD CONSTRAINT "CompanySettings_pkey" PRIMARY KEY (id);


--
-- Name: Departments Departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Departments"
    ADD CONSTRAINT "Departments_pkey" PRIMARY KEY (id);


--
-- Name: OrderAnalyses OrderAnalyses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderAnalyses"
    ADD CONSTRAINT "OrderAnalyses_pkey" PRIMARY KEY (id);


--
-- Name: OrderItems OrderItems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItems"
    ADD CONSTRAINT "OrderItems_pkey" PRIMARY KEY (id);


--
-- Name: Orders Orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key1" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key10" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key11" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key12" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key13" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key14" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key15" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key16" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key17" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key18" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key19" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key2" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key20" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key21" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key22" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key23" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key24" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key25" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key26" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key27" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key28" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key29" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key3" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key30" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key31" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key32" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key33" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key34" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key35" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key36; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key36" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key37" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key38; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key38" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key39; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key39" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key4" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key40; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key40" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key41; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key41" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key42; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key42" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key43; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key43" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key44; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key44" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key45; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key45" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key46; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key46" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key47; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key47" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key48; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key48" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key49; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key49" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key5" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key50; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key50" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key6" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key7" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key8" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key9" UNIQUE (order_number);


--
-- Name: Orders Orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_pkey" PRIMARY KEY (id);


--
-- Name: Partners Partners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Partners"
    ADD CONSTRAINT "Partners_pkey" PRIMARY KEY (id);


--
-- Name: Permissions Permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key1" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key10" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key11" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key12" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key13" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key14" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key15" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key16" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key17" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key18" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key19" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key2" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key20" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key21" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key22" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key23" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key24" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key25" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key26" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key27" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key28" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key29" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key3" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key30" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key31" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key32" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key33" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key34" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key35" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key36; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key36" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key37" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key38; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key38" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key39; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key39" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key4" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key40; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key40" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key41; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key41" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key42; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key42" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key43; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key43" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key44; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key44" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key45; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key45" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key46; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key46" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key47; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key47" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key48; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key48" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key49; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key49" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key5" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key50; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key50" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key51; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key51" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key52; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key52" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key53; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key53" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key54; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key54" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key55; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key55" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key56; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key56" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key57; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key57" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key58; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key58" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key59; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key59" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key6" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key60; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key60" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key61; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key61" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key62; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key62" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key63; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key63" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key64; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key64" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key65; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key65" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key66; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key66" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key67; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key67" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key68; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key68" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key69; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key69" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key7" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key70; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key70" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key71; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key71" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key72; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key72" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key73; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key73" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key74; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key74" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key75; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key75" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key76; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key76" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key8" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key9" UNIQUE (name);


--
-- Name: Permissions Permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_pkey" PRIMARY KEY (id);


--
-- Name: RolePermissions RolePermissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermissions"
    ADD CONSTRAINT "RolePermissions_pkey" PRIMARY KEY ("RoleId", "PermissionId");


--
-- Name: Roles Roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key" UNIQUE (name);


--
-- Name: Roles Roles_name_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key1" UNIQUE (name);


--
-- Name: Roles Roles_name_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key10" UNIQUE (name);


--
-- Name: Roles Roles_name_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key11" UNIQUE (name);


--
-- Name: Roles Roles_name_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key12" UNIQUE (name);


--
-- Name: Roles Roles_name_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key13" UNIQUE (name);


--
-- Name: Roles Roles_name_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key14" UNIQUE (name);


--
-- Name: Roles Roles_name_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key15" UNIQUE (name);


--
-- Name: Roles Roles_name_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key16" UNIQUE (name);


--
-- Name: Roles Roles_name_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key17" UNIQUE (name);


--
-- Name: Roles Roles_name_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key18" UNIQUE (name);


--
-- Name: Roles Roles_name_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key19" UNIQUE (name);


--
-- Name: Roles Roles_name_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key2" UNIQUE (name);


--
-- Name: Roles Roles_name_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key20" UNIQUE (name);


--
-- Name: Roles Roles_name_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key21" UNIQUE (name);


--
-- Name: Roles Roles_name_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key22" UNIQUE (name);


--
-- Name: Roles Roles_name_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key23" UNIQUE (name);


--
-- Name: Roles Roles_name_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key24" UNIQUE (name);


--
-- Name: Roles Roles_name_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key25" UNIQUE (name);


--
-- Name: Roles Roles_name_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key26" UNIQUE (name);


--
-- Name: Roles Roles_name_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key27" UNIQUE (name);


--
-- Name: Roles Roles_name_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key28" UNIQUE (name);


--
-- Name: Roles Roles_name_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key29" UNIQUE (name);


--
-- Name: Roles Roles_name_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key3" UNIQUE (name);


--
-- Name: Roles Roles_name_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key30" UNIQUE (name);


--
-- Name: Roles Roles_name_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key31" UNIQUE (name);


--
-- Name: Roles Roles_name_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key32" UNIQUE (name);


--
-- Name: Roles Roles_name_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key33" UNIQUE (name);


--
-- Name: Roles Roles_name_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key34" UNIQUE (name);


--
-- Name: Roles Roles_name_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key35" UNIQUE (name);


--
-- Name: Roles Roles_name_key36; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key36" UNIQUE (name);


--
-- Name: Roles Roles_name_key37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key37" UNIQUE (name);


--
-- Name: Roles Roles_name_key38; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key38" UNIQUE (name);


--
-- Name: Roles Roles_name_key39; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key39" UNIQUE (name);


--
-- Name: Roles Roles_name_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key4" UNIQUE (name);


--
-- Name: Roles Roles_name_key40; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key40" UNIQUE (name);


--
-- Name: Roles Roles_name_key41; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key41" UNIQUE (name);


--
-- Name: Roles Roles_name_key42; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key42" UNIQUE (name);


--
-- Name: Roles Roles_name_key43; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key43" UNIQUE (name);


--
-- Name: Roles Roles_name_key44; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key44" UNIQUE (name);


--
-- Name: Roles Roles_name_key45; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key45" UNIQUE (name);


--
-- Name: Roles Roles_name_key46; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key46" UNIQUE (name);


--
-- Name: Roles Roles_name_key47; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key47" UNIQUE (name);


--
-- Name: Roles Roles_name_key48; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key48" UNIQUE (name);


--
-- Name: Roles Roles_name_key49; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key49" UNIQUE (name);


--
-- Name: Roles Roles_name_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key5" UNIQUE (name);


--
-- Name: Roles Roles_name_key50; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key50" UNIQUE (name);


--
-- Name: Roles Roles_name_key51; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key51" UNIQUE (name);


--
-- Name: Roles Roles_name_key52; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key52" UNIQUE (name);


--
-- Name: Roles Roles_name_key53; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key53" UNIQUE (name);


--
-- Name: Roles Roles_name_key54; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key54" UNIQUE (name);


--
-- Name: Roles Roles_name_key55; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key55" UNIQUE (name);


--
-- Name: Roles Roles_name_key56; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key56" UNIQUE (name);


--
-- Name: Roles Roles_name_key57; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key57" UNIQUE (name);


--
-- Name: Roles Roles_name_key58; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key58" UNIQUE (name);


--
-- Name: Roles Roles_name_key59; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key59" UNIQUE (name);


--
-- Name: Roles Roles_name_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key6" UNIQUE (name);


--
-- Name: Roles Roles_name_key60; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key60" UNIQUE (name);


--
-- Name: Roles Roles_name_key61; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key61" UNIQUE (name);


--
-- Name: Roles Roles_name_key62; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key62" UNIQUE (name);


--
-- Name: Roles Roles_name_key63; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key63" UNIQUE (name);


--
-- Name: Roles Roles_name_key64; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key64" UNIQUE (name);


--
-- Name: Roles Roles_name_key65; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key65" UNIQUE (name);


--
-- Name: Roles Roles_name_key66; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key66" UNIQUE (name);


--
-- Name: Roles Roles_name_key67; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key67" UNIQUE (name);


--
-- Name: Roles Roles_name_key68; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key68" UNIQUE (name);


--
-- Name: Roles Roles_name_key69; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key69" UNIQUE (name);


--
-- Name: Roles Roles_name_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key7" UNIQUE (name);


--
-- Name: Roles Roles_name_key70; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key70" UNIQUE (name);


--
-- Name: Roles Roles_name_key71; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key71" UNIQUE (name);


--
-- Name: Roles Roles_name_key72; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key72" UNIQUE (name);


--
-- Name: Roles Roles_name_key73; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key73" UNIQUE (name);


--
-- Name: Roles Roles_name_key74; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key74" UNIQUE (name);


--
-- Name: Roles Roles_name_key75; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key75" UNIQUE (name);


--
-- Name: Roles Roles_name_key76; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key76" UNIQUE (name);


--
-- Name: Roles Roles_name_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key8" UNIQUE (name);


--
-- Name: Roles Roles_name_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key9" UNIQUE (name);


--
-- Name: Roles Roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_pkey" PRIMARY KEY (id);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: Users Users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key" UNIQUE (username);


--
-- Name: Users Users_username_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key1" UNIQUE (username);


--
-- Name: Users Users_username_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key10" UNIQUE (username);


--
-- Name: Users Users_username_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key11" UNIQUE (username);


--
-- Name: Users Users_username_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key12" UNIQUE (username);


--
-- Name: Users Users_username_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key13" UNIQUE (username);


--
-- Name: Users Users_username_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key14" UNIQUE (username);


--
-- Name: Users Users_username_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key15" UNIQUE (username);


--
-- Name: Users Users_username_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key16" UNIQUE (username);


--
-- Name: Users Users_username_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key17" UNIQUE (username);


--
-- Name: Users Users_username_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key18" UNIQUE (username);


--
-- Name: Users Users_username_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key19" UNIQUE (username);


--
-- Name: Users Users_username_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key2" UNIQUE (username);


--
-- Name: Users Users_username_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key20" UNIQUE (username);


--
-- Name: Users Users_username_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key21" UNIQUE (username);


--
-- Name: Users Users_username_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key22" UNIQUE (username);


--
-- Name: Users Users_username_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key23" UNIQUE (username);


--
-- Name: Users Users_username_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key24" UNIQUE (username);


--
-- Name: Users Users_username_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key25" UNIQUE (username);


--
-- Name: Users Users_username_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key26" UNIQUE (username);


--
-- Name: Users Users_username_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key27" UNIQUE (username);


--
-- Name: Users Users_username_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key28" UNIQUE (username);


--
-- Name: Users Users_username_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key29" UNIQUE (username);


--
-- Name: Users Users_username_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key3" UNIQUE (username);


--
-- Name: Users Users_username_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key30" UNIQUE (username);


--
-- Name: Users Users_username_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key31" UNIQUE (username);


--
-- Name: Users Users_username_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key32" UNIQUE (username);


--
-- Name: Users Users_username_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key33" UNIQUE (username);


--
-- Name: Users Users_username_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key34" UNIQUE (username);


--
-- Name: Users Users_username_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key35" UNIQUE (username);


--
-- Name: Users Users_username_key36; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key36" UNIQUE (username);


--
-- Name: Users Users_username_key37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key37" UNIQUE (username);


--
-- Name: Users Users_username_key38; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key38" UNIQUE (username);


--
-- Name: Users Users_username_key39; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key39" UNIQUE (username);


--
-- Name: Users Users_username_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key4" UNIQUE (username);


--
-- Name: Users Users_username_key40; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key40" UNIQUE (username);


--
-- Name: Users Users_username_key41; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key41" UNIQUE (username);


--
-- Name: Users Users_username_key42; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key42" UNIQUE (username);


--
-- Name: Users Users_username_key43; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key43" UNIQUE (username);


--
-- Name: Users Users_username_key44; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key44" UNIQUE (username);


--
-- Name: Users Users_username_key45; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key45" UNIQUE (username);


--
-- Name: Users Users_username_key46; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key46" UNIQUE (username);


--
-- Name: Users Users_username_key47; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key47" UNIQUE (username);


--
-- Name: Users Users_username_key48; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key48" UNIQUE (username);


--
-- Name: Users Users_username_key49; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key49" UNIQUE (username);


--
-- Name: Users Users_username_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key5" UNIQUE (username);


--
-- Name: Users Users_username_key50; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key50" UNIQUE (username);


--
-- Name: Users Users_username_key51; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key51" UNIQUE (username);


--
-- Name: Users Users_username_key52; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key52" UNIQUE (username);


--
-- Name: Users Users_username_key53; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key53" UNIQUE (username);


--
-- Name: Users Users_username_key54; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key54" UNIQUE (username);


--
-- Name: Users Users_username_key55; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key55" UNIQUE (username);


--
-- Name: Users Users_username_key56; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key56" UNIQUE (username);


--
-- Name: Users Users_username_key57; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key57" UNIQUE (username);


--
-- Name: Users Users_username_key58; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key58" UNIQUE (username);


--
-- Name: Users Users_username_key59; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key59" UNIQUE (username);


--
-- Name: Users Users_username_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key6" UNIQUE (username);


--
-- Name: Users Users_username_key60; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key60" UNIQUE (username);


--
-- Name: Users Users_username_key61; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key61" UNIQUE (username);


--
-- Name: Users Users_username_key62; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key62" UNIQUE (username);


--
-- Name: Users Users_username_key63; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key63" UNIQUE (username);


--
-- Name: Users Users_username_key64; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key64" UNIQUE (username);


--
-- Name: Users Users_username_key65; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key65" UNIQUE (username);


--
-- Name: Users Users_username_key66; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key66" UNIQUE (username);


--
-- Name: Users Users_username_key67; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key67" UNIQUE (username);


--
-- Name: Users Users_username_key68; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key68" UNIQUE (username);


--
-- Name: Users Users_username_key69; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key69" UNIQUE (username);


--
-- Name: Users Users_username_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key7" UNIQUE (username);


--
-- Name: Users Users_username_key70; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key70" UNIQUE (username);


--
-- Name: Users Users_username_key71; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key71" UNIQUE (username);


--
-- Name: Users Users_username_key72; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key72" UNIQUE (username);


--
-- Name: Users Users_username_key73; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key73" UNIQUE (username);


--
-- Name: Users Users_username_key74; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key74" UNIQUE (username);


--
-- Name: Users Users_username_key75; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key75" UNIQUE (username);


--
-- Name: Users Users_username_key76; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key76" UNIQUE (username);


--
-- Name: Users Users_username_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key8" UNIQUE (username);


--
-- Name: Users Users_username_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key9" UNIQUE (username);


--
-- Name: item_types item_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_types
    ADD CONSTRAINT item_types_pkey PRIMARY KEY (id);


--
-- Name: master_items master_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_items
    ADD CONSTRAINT master_items_pkey PRIMARY KEY (code);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: special_master_items special_master_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.special_master_items
    ADD CONSTRAINT special_master_items_pkey PRIMARY KEY (id);


--
-- Name: OrderAnalyses OrderAnalyses_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderAnalyses"
    ADD CONSTRAINT "OrderAnalyses_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public."Orders"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItems OrderItems_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItems"
    ADD CONSTRAINT "OrderItems_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public."Orders"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermissions RolePermissions_PermissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermissions"
    ADD CONSTRAINT "RolePermissions_PermissionId_fkey" FOREIGN KEY ("PermissionId") REFERENCES public."Permissions"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermissions RolePermissions_RoleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermissions"
    ADD CONSTRAINT "RolePermissions_RoleId_fkey" FOREIGN KEY ("RoleId") REFERENCES public."Roles"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Users Users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public."Roles"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: master_items master_items_item_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_items
    ADD CONSTRAINT master_items_item_type_id_fkey FOREIGN KEY (item_type_id) REFERENCES public.item_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: master_items master_items_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_items
    ADD CONSTRAINT master_items_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public."Partners"(id) ON UPDATE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict L711wd80LrvC1fQ9fLCDyk2vAyxvo1r4TgBiicNvGs9tI4HtPkj0DM3dbXOS6fY

