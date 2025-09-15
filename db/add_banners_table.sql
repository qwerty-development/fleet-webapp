-- Add banners table for promotional banners
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  image_url text NOT NULL,
  redirect_to text NOT NULL,
  CONSTRAINT banners_pkey PRIMARY KEY (id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_banners_created_at ON public.banners(created_at DESC);

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON public.banners TO authenticated;
-- GRANT SELECT ON public.banners TO anon;
