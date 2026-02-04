--
-- PostgreSQL database dump
--

\restrict 5hvmzP0i8rjLKfPJvQplnIlWBYks9BEuvOOxg6Bhla4RZTLiXBOh4H5U9JbQwmQ

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
22	1	admin	UPDATE	roles	3	{"name":"it support","description":"","permissionIds":[9,10,11,13,14,15,17,21,22,23,25,26,27,1,2,3,52]}	::ffff:172.20.0.1	2026-02-03 03:57:11.337+00	2026-02-03 03:57:11.337+00
23	1	admin	UPDATE	roles	3	{"name":"it support","description":"","permissionIds":[9,10,11,13,14,15,17,21,22,23,25,26,27,1,2,3,52]}	::ffff:172.20.0.1	2026-02-03 03:59:28.758+00	2026-02-03 03:59:28.758+00
24	1	admin	UPDATE	users	2	{"username":"itsupport","first_name":"IT","last_name":"Support","role_id":"3"}	::ffff:172.20.0.1	2026-02-03 04:06:23.527+00	2026-02-03 04:06:23.527+00
25	2	itsupport	UPDATE	partners	2	{"name":"PT. United Teknologi Integrasi","address":null,"contact_person":"Agus Halim","email":null,"phone":null}	::ffff:172.20.0.1	2026-02-03 06:40:05.181+00	2026-02-03 06:40:05.181+00
26	2	itsupport	UPDATE	partners	2	{"name":"PT. United Teknologi Integrasi","address":"Jl. Siantar No. 18 RT.01 RW. 02, Cideng, Kec. Gambir, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10150","contact_person":"Agus Halim Hendrawan","email":"sales@uti.co.id","phone":"08161330045"}	::ffff:172.20.0.1	2026-02-03 06:44:28.593+00	2026-02-03 06:44:28.593+00
27	2	itsupport	UPDATE	partners	1	{"name":"PT. DATASCRIP BUSINESS SOLUTIONS","address":"Gedung Datascrip Kav 9, Jl. Selaparang Blok B-15, RW.10, Gn. Sahari Sel., Kec. Kemayoran, Daerah Khusus Ibukota Jakarta 10610, Indonesia","contact_person":"Valentine","email":null,"phone":"08561111333"}	::ffff:172.20.0.1	2026-02-03 06:45:50.301+00	2026-02-03 06:45:50.301+00
\.


--
-- Data for Name: CompanySettings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CompanySettings" (id, company_name, company_address, company_logo, company_phone, company_email, "createdAt", "updatedAt", "deletedAt", direktur_utama, company_code) FROM stdin;
1	PT. Medika Loka Manajemen		data:image/jpeg;base64,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			2026-01-30 02:20:06.708+00	2026-02-03 01:12:03.304+00	\N	Dr.. Yulisar Khiat, SE, ME, MARS	
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
1	1	1	Analisa Kerusakan	Saat ini membutuhkan laptop baru	Proses sesuai regulasi	t	2019	0.00	2026-02-03 01:21:49.202+00	2026-02-03 03:51:54.665+00	data:image/jpeg;base64,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	Arsaly (Staf Penunjang Umum)	[{"analysis": "Saat ini membutuhkan laptop baru", "description": "Proses sesuai regulasi", "asset_document": "data:image/jpeg;base64,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", "is_replacement": true, "requester_name": "Arsaly (Staf Penunjang Umum)", "asset_purchase_year": "2019", "remaining_book_value": "0.00"}, {"analysis": "msnfskfjsf", "description": "skfjksjfkssf", "asset_document": "", "is_replacement": true, "requester_name": "sjkksjfs(shfshjs)", "asset_purchase_year": "2019", "remaining_book_value": "0"}]
2	10	2	Analisa Kerusakan	Saat ini kondisi adaptor mengalami kerusakan tidak bisa mengisi daya laptop. Sudah dicoba menggunakan adaptor laptop lain dan berhasil mengisi daya.	Penggantian adaptor charger laptop yang baru	f		\N	2026-02-03 04:52:42.521+00	2026-02-03 04:52:42.521+00		Cahyo	[{"analysis": "Saat ini kondisi adaptor mengalami kerusakan tidak bisa mengisi daya laptop. Sudah dicoba menggunakan adaptor laptop lain dan berhasil mengisi daya.", "description": "Penggantian adaptor charger laptop yang baru", "asset_document": "", "is_replacement": false, "requester_name": "Cahyo", "asset_purchase_year": "", "remaining_book_value": ""}]
\.


--
-- Data for Name: OrderItems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderItems" (id, order_id, item_name, quantity, unit_price, total_price, "createdAt", "updatedAt", description, procurement_year, "deletedAt", code, spec_description, item_type_id) FROM stdin;
5	2	Asus NB Core 5	1	13450000.00	13450000.00	2026-01-30 03:13:20.891+00	2026-01-30 03:13:20.891+00	PBB		\N	\N	\N	\N
6	3	ADAPTOR LAPTOP	1	850000.00	850000.00	2026-01-30 03:52:54.497+00	2026-01-30 03:52:54.497+00	SN : 123455757		\N	\N	\N	\N
3	1	Laptop Asus Core 5	2	14500000.00	29000000.00	2026-01-29 07:04:13.301+00	2026-01-29 07:04:13.301+00	PBB		2026-01-30 04:08:15.069+00	\N	\N	\N
4	1	Laptop Asus Core 5	1	14500000.00	14500000.00	2026-01-29 07:04:13.301+00	2026-01-29 07:04:13.301+00	PBL	2019	2026-01-30 04:08:15.069+00	\N	\N	\N
7	1	Laptop Asus Core 5	2	14500000.00	29000000.00	2026-01-30 04:08:15.075+00	2026-01-30 04:08:15.075+00	PBB		\N	\N	\N	\N
8	10	ADAPTER 45W19V 2P(4PHI)	1	605000.00	605000.00	2026-01-30 08:32:40.508+00	2026-01-30 08:32:40.508+00			\N	\N	\N	\N
\.


--
-- Data for Name: Orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Orders" (id, date, department_id, partner_id, status, total_amount, "createdAt", "updatedAt", subtotal, ppn, grand_total, order_number, notes, "deletedAt", approved_by, approval_date) FROM stdin;
2	2026-01-30 03:13:20.864+00	1	1	DRAFT	0.00	2026-01-30 03:13:20.869+00	2026-01-30 03:13:20.869+00	13450000.00	1479500.00	14929500.00	PO-20260130-001	PERMINTAAN TAMBAHAN	\N	\N	\N
3	2026-01-30 03:52:54.491+00	1	1	DRAFT	0.00	2026-01-30 03:52:54.491+00	2026-01-30 03:52:54.491+00	850000.00	93500.00	943500.00	PO-20260130-002	ADAPTOR	2026-01-30 04:07:17.148+00	\N	\N
1	2026-01-29 06:42:14.685+00	1	1	APPROVED	0.00	2026-01-29 06:42:14.687+00	2026-01-30 04:19:53.436+00	29000000.00	3190000.00	32190000.00	PO-20260129-001	Permintaan Laptop Baru dan Penggantian Barang Lama	\N	1	2026-01-30 04:19:53.433+00
10	2026-01-30 08:32:40.487+00	2	1	APPROVED	0.00	2026-01-30 08:32:40.489+00	2026-02-03 04:00:16.285+00	605000.00	66550.00	671550.00	PO-20260130-003	ADAPTO CHARGER	\N	1	2026-02-03 04:00:16.285+00
\.


--
-- Data for Name: Partners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Partners" (id, name, address, contact_person, email, phone, "createdAt", "updatedAt", "deletedAt") FROM stdin;
2	PT. United Teknologi Integrasi	Jl. Siantar No. 18 RT.01 RW. 02, Cideng, Kec. Gambir, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10150	Agus Halim Hendrawan	sales@uti.co.id	08161330045	2026-01-30 09:02:26.794+00	2026-02-03 06:44:28.572+00	\N
1	PT. DATASCRIP BUSINESS SOLUTIONS	Gedung Datascrip Kav 9, Jl. Selaparang Blok B-15, RW.10, Gn. Sahari Sel., Kec. Kemayoran, Daerah Khusus Ibukota Jakarta 10610, Indonesia	Valentine	\N	08561111333	2026-01-30 02:57:59.852+00	2026-02-03 06:45:50.287+00	\N
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
52	orders.analysis	Membuat Analisa Teknis Permintaan	2026-02-03 03:56:29.464+00	2026-02-03 03:56:29.464+00	\N
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
2026-01-30 02:08:33.821+00	2026-01-30 02:08:33.821+00	2	22
2026-01-30 02:08:33.821+00	2026-01-30 02:08:33.821+00	2	23
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
2026-01-30 08:21:49.58+00	2026-01-30 08:21:49.58+00	2	25
2026-01-30 08:21:49.58+00	2026-01-30 08:21:49.58+00	2	33
2026-01-30 08:29:22.506+00	2026-01-30 08:29:22.506+00	2	34
2026-01-30 08:39:16.627+00	2026-01-30 08:39:16.627+00	3	1
2026-01-30 08:39:16.627+00	2026-01-30 08:39:16.627+00	3	2
2026-01-30 08:39:16.627+00	2026-01-30 08:39:16.627+00	3	3
2026-01-30 08:44:49.715+00	2026-01-30 08:44:49.715+00	1	46
2026-01-30 08:44:49.727+00	2026-01-30 08:44:49.727+00	2	46
2026-01-30 08:51:17.22+00	2026-01-30 08:51:17.22+00	1	47
2026-01-30 08:51:17.22+00	2026-01-30 08:51:17.22+00	1	48
2026-01-30 08:51:17.22+00	2026-01-30 08:51:17.22+00	1	49
2026-01-30 08:51:17.22+00	2026-01-30 08:51:17.22+00	1	50
2026-01-30 08:51:17.22+00	2026-01-30 08:51:17.22+00	1	51
2026-01-30 08:51:25.226+00	2026-01-30 08:51:25.226+00	2	47
2026-02-03 03:56:29.533+00	2026-02-03 03:56:29.533+00	1	52
2026-02-03 03:57:11.311+00	2026-02-03 03:57:11.311+00	3	52
2026-02-03 04:48:57.335+00	2026-02-03 04:48:57.335+00	3	47
\.


--
-- Data for Name: Roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Roles" (id, name, description, "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	administrator	Akses penuh ke seluruh fitur sistem	2026-01-30 02:08:33.778+00	2026-01-30 02:08:33.778+00	\N
2	staff	Akses operasional dasar	2026-01-30 02:08:33.785+00	2026-01-30 02:08:33.785+00	\N
3	it support		2026-01-30 02:22:21.237+00	2026-02-03 03:59:28.743+00	\N
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Users" (id, username, password, first_name, last_name, role_id, "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	admin	admin	Super	Admin	1	2026-01-30 02:08:33.828+00	2026-01-30 02:08:33.828+00	\N
2	itsupport	$2b$10$wVO/lHzoTSmMkkJo7GUq8.1SGYclun9cSy33JPEG/zry2f6CWoU.a	IT	Support	3	2026-01-30 02:28:29.576+00	2026-02-03 04:06:23.493+00	\N
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
TI-0091487	Asus NB Core 5	1	13450000	11	1479500	14929500		2026-01-30 02:58:43.085+00	2026-01-30 09:03:03.888+00	\N	1
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, message, resource_type, resource_id, action_type, target_permission, is_read, "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	New Order Created: PO-20260130-003	Order	10	CREATED	orders.approve	t	2026-01-30 08:32:40.525+00	2026-01-30 08:42:30.573+00	\N
3	Order PO-20260130-003 PENDING by admin	Order	10	PENDING	\N	t	2026-02-03 03:53:09.111+00	2026-02-03 03:54:38.256+00	\N
2	Order PO-20260130-003 PENDING by admin	Order	10	PENDING	\N	t	2026-01-30 08:36:00.115+00	2026-02-03 03:54:39.32+00	\N
4	Order PO-20260130-003 APPROVED by admin	Order	10	APPROVED	\N	t	2026-02-03 04:00:16.301+00	2026-02-03 04:02:22.53+00	\N
\.


--
-- Data for Name: special_master_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.special_master_items (id, code, name, price, description, "createdAt", "updatedAt", "deletedAt") FROM stdin;
1	\N	ADAPTOR LAPTOP	850000	SN : 123455757	2026-01-30 03:52:54.382+00	2026-01-30 03:52:54.382+00	\N
2	\N	ADAPTER 45W19V 2P(4PHI)	605000	SN : M8N0LP02Z24934E\nPN : 0A001-00696500	2026-01-30 08:32:40.41+00	2026-01-30 08:32:40.41+00	\N
\.


--
-- Name: ActivityLogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ActivityLogs_id_seq"', 27, true);


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

SELECT pg_catalog.setval('public."OrderItems_id_seq"', 8, true);


--
-- Name: Orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Orders_id_seq"', 10, true);


--
-- Name: Partners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Partners_id_seq"', 2, true);


--
-- Name: Permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Permissions_id_seq"', 56, true);


--
-- Name: Roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Roles_id_seq"', 3, true);


--
-- Name: Users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Users_id_seq"', 2, true);


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

SELECT pg_catalog.setval('public.special_master_items_id_seq', 2, true);


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
-- Name: Orders Orders_order_number_key51; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key51" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key52; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key52" UNIQUE (order_number);


--
-- Name: Orders Orders_order_number_key53; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_order_number_key53" UNIQUE (order_number);


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
-- Name: Permissions Permissions_name_key77; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key77" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key78; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key78" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key79; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key79" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key8" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key80; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key80" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key81; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key81" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key82; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key82" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key83; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key83" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key84; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key84" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key85; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key85" UNIQUE (name);


--
-- Name: Permissions Permissions_name_key86; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permissions"
    ADD CONSTRAINT "Permissions_name_key86" UNIQUE (name);


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
-- Name: Roles Roles_name_key77; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key77" UNIQUE (name);


--
-- Name: Roles Roles_name_key78; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key78" UNIQUE (name);


--
-- Name: Roles Roles_name_key79; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key79" UNIQUE (name);


--
-- Name: Roles Roles_name_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key8" UNIQUE (name);


--
-- Name: Roles Roles_name_key80; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key80" UNIQUE (name);


--
-- Name: Roles Roles_name_key81; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key81" UNIQUE (name);


--
-- Name: Roles Roles_name_key82; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key82" UNIQUE (name);


--
-- Name: Roles Roles_name_key83; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key83" UNIQUE (name);


--
-- Name: Roles Roles_name_key84; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key84" UNIQUE (name);


--
-- Name: Roles Roles_name_key85; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key85" UNIQUE (name);


--
-- Name: Roles Roles_name_key86; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roles"
    ADD CONSTRAINT "Roles_name_key86" UNIQUE (name);


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
-- Name: Users Users_username_key77; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key77" UNIQUE (username);


--
-- Name: Users Users_username_key78; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key78" UNIQUE (username);


--
-- Name: Users Users_username_key79; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key79" UNIQUE (username);


--
-- Name: Users Users_username_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key8" UNIQUE (username);


--
-- Name: Users Users_username_key80; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key80" UNIQUE (username);


--
-- Name: Users Users_username_key81; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key81" UNIQUE (username);


--
-- Name: Users Users_username_key82; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key82" UNIQUE (username);


--
-- Name: Users Users_username_key83; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key83" UNIQUE (username);


--
-- Name: Users Users_username_key84; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key84" UNIQUE (username);


--
-- Name: Users Users_username_key85; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key85" UNIQUE (username);


--
-- Name: Users Users_username_key86; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key86" UNIQUE (username);


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

\unrestrict 5hvmzP0i8rjLKfPJvQplnIlWBYks9BEuvOOxg6Bhla4RZTLiXBOh4H5U9JbQwmQ

