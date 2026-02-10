
-- Table: trip_requests — stores user search/plan requests with demographics
CREATE TABLE public.trip_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  location TEXT NOT NULL,
  demographics JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
  ON public.trip_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own requests"
  ON public.trip_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own requests"
  ON public.trip_requests FOR DELETE
  USING (auth.uid() = user_id);

-- Table: hidden_gem_cache — caches hidden gem results by location
CREATE TABLE public.hidden_gem_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL,
  place_name TEXT NOT NULL,
  video_url TEXT,
  description TEXT,
  min_age INT DEFAULT 0,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hidden_gem_cache ENABLE ROW LEVEL SECURITY;

-- Cache is publicly readable (shared data), only service role can write
CREATE POLICY "Anyone can read cache"
  ON public.hidden_gem_cache FOR SELECT
  USING (true);

-- Index for fast location lookups
CREATE INDEX idx_hidden_gem_cache_location ON public.hidden_gem_cache(location);
CREATE INDEX idx_trip_requests_user_id ON public.trip_requests(user_id);
