-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.allcars (
  make text NOT NULL,
  model text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  category text,
  trim ARRAY,
  CONSTRAINT allcars_pkey PRIMARY KEY (id)
);
CREATE TABLE public.auto_clips (
  id bigint NOT NULL DEFAULT nextval('auto_clips_id_seq'::regclass),
  dealership_id bigint NOT NULL,
  car_id bigint NOT NULL UNIQUE,
  title character varying NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  status USER-DEFINED DEFAULT 'draft'::autoclip_status,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  published_at timestamp with time zone,
  liked_users ARRAY DEFAULT ARRAY[]::text[],
  viewed_users ARRAY DEFAULT '{}'::text[],
  submitted_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  rejection_reason text,
  review_notes text,
  CONSTRAINT auto_clips_pkey PRIMARY KEY (id),
  CONSTRAINT auto_clips_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id),
  CONSTRAINT auto_clips_dealership_id_fkey FOREIGN KEY (dealership_id) REFERENCES public.dealerships(id)
);
CREATE TABLE public.cars (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  listed_at timestamp with time zone NOT NULL DEFAULT now(),
  make text,
  model text,
  price integer,
  year integer,
  description text,
  images ARRAY,
  sold_price integer,
  date_sold date,
  status text DEFAULT 'available'::text,
  dealership_id bigint,
  date_modified timestamp with time zone DEFAULT now(),
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  condition text DEFAULT 'used'::text,
  transmission text DEFAULT 'automatic'::text,
  color text DEFAULT 'black'::text,
  mileage bigint DEFAULT '0'::bigint,
  drivetrain text DEFAULT 'RWD'::text,
  viewed_users ARRAY DEFAULT '{}'::text[],
  liked_users ARRAY DEFAULT '{}'::text[],
  type text DEFAULT 'Benzine'::text,
  category text NOT NULL DEFAULT 'Sedan'::text,
  bought_price bigint DEFAULT '0'::bigint,
  date_bought timestamp with time zone DEFAULT now(),
  seller_name text,
  buyer_name text,
  call_users ARRAY DEFAULT ARRAY[]::text[],
  call_count integer DEFAULT 0,
  whatsapp_users ARRAY DEFAULT ARRAY[]::text[],
  whatsapp_count integer DEFAULT 0,
  source text DEFAULT 'GCC'::text,
  features ARRAY DEFAULT '{}'::text[],
  trim text,
  CONSTRAINT cars_pkey PRIMARY KEY (id),
  CONSTRAINT cars_dealership_id_fkey FOREIGN KEY (dealership_id) REFERENCES public.dealerships(id)
);
CREATE TABLE public.dealerships (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  logo text,
  user_id text UNIQUE,
  subscription_end_date date,
  phone text,
  location text,
  name text DEFAULT ''::text,
  longitude numeric DEFAULT 0,
  latitude numeric DEFAULT 0,
  CONSTRAINT dealerships_pkey PRIMARY KEY (id),
  CONSTRAINT dealerships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.notification_admin_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  message text NOT NULL,
  recipients_count integer NOT NULL DEFAULT 0,
  recipient_type text NOT NULL,
  recipient_ids ARRAY DEFAULT '{}'::text[],
  notification_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  sent_by text,
  CONSTRAINT notification_admin_logs_pkey PRIMARY KEY (id),
  CONSTRAINT notification_admin_logs_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES public.users(id)
);
CREATE TABLE public.notification_errors (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  error_details jsonb,
  record jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_errors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notification_metrics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  notification_id uuid,
  type text,
  user_id text,
  delivery_status text,
  platform text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT notification_metrics_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES public.notifications(id),
  CONSTRAINT notification_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.notification_schedule_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  scheduled_at timestamp with time zone DEFAULT now(),
  users_processed integer,
  success boolean,
  error_details jsonb,
  metrics jsonb,
  CONSTRAINT notification_schedule_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payment_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  external_id bigint NOT NULL,
  dealer_id bigint NOT NULL,
  plan text NOT NULL CHECK (plan = ANY (ARRAY['monthly'::text, 'yearly'::text])),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD'::text,
  status text NOT NULL CHECK (status = ANY (ARRAY['success'::text, 'failed'::text, 'pending'::text])),
  whish_status text,
  processed_at timestamp with time zone NOT NULL DEFAULT now(),
  error_message text,
  CONSTRAINT payment_logs_pkey PRIMARY KEY (id),
  CONSTRAINT payment_logs_dealer_id_fkey FOREIGN KEY (dealer_id) REFERENCES public.dealerships(id)
);
CREATE TABLE public.pending_notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  type text NOT NULL,
  data jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  processed boolean DEFAULT false,
  created_at_hour timestamp with time zone,
  CONSTRAINT pending_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT pending_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_push_tokens (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  token text NOT NULL,
  device_type text NOT NULL,
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()),
  signed_in boolean DEFAULT false,
  active boolean DEFAULT false,
  CONSTRAINT user_push_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT user_push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  favorite ARRAY,
  name text,
  email text UNIQUE,
  id text NOT NULL DEFAULT (nextval('users_id_seq'::regclass))::text,
  last_active timestamp with time zone DEFAULT now(),
  timezone text DEFAULT 'UTC'::text,
  recent_searches ARRAY DEFAULT '{}'::text[],
  is_guest boolean DEFAULT false,
  role text DEFAULT 'user'::text,
  onboarded boolean NOT NULL DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);