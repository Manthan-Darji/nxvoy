-- Create enum for collaborator roles
CREATE TYPE public.collaborator_role AS ENUM ('viewer', 'editor', 'co_planner');

-- Create enum for invitation status
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'declined');

-- Trip collaborators table
CREATE TABLE public.trip_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role collaborator_role NOT NULL DEFAULT 'viewer',
  invite_token TEXT UNIQUE,
  status invite_status NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_trip_user UNIQUE (trip_id, user_id),
  CONSTRAINT user_or_email CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

-- Trip activity log for tracking changes
CREATE TABLE public.trip_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.trip_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_activity_log ENABLE ROW LEVEL SECURITY;

-- Function to check if user has access to a trip
CREATE OR REPLACE FUNCTION public.user_has_trip_access(p_trip_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trips WHERE id = p_trip_id AND user_id = p_user_id
    UNION
    SELECT 1 FROM trip_collaborators 
    WHERE trip_id = p_trip_id 
    AND user_id = p_user_id 
    AND status = 'accepted'
  )
$$;

-- Function to check collaborator role
CREATE OR REPLACE FUNCTION public.get_collaborator_role(p_trip_id UUID, p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM trips WHERE id = p_trip_id AND user_id = p_user_id) 
    THEN 'owner'
    ELSE (SELECT role::text FROM trip_collaborators WHERE trip_id = p_trip_id AND user_id = p_user_id AND status = 'accepted')
  END
$$;

-- Function to check if user can edit trip
CREATE OR REPLACE FUNCTION public.can_edit_trip(p_trip_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trips WHERE id = p_trip_id AND user_id = p_user_id
    UNION
    SELECT 1 FROM trip_collaborators 
    WHERE trip_id = p_trip_id 
    AND user_id = p_user_id 
    AND status = 'accepted'
    AND role IN ('editor', 'co_planner')
  )
$$;

-- RLS policies for trip_collaborators
CREATE POLICY "Trip owners can manage collaborators"
ON public.trip_collaborators
FOR ALL
USING (
  EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND user_id = auth.uid())
  OR (user_id = auth.uid())
);

CREATE POLICY "Collaborators can view their invitations"
ON public.trip_collaborators
FOR SELECT
USING (
  user_id = auth.uid() 
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM trips WHERE id = trip_id AND user_id = auth.uid())
);

-- RLS policies for trip_activity_log
CREATE POLICY "Users with trip access can view activity"
ON public.trip_activity_log
FOR SELECT
USING (public.user_has_trip_access(trip_id, auth.uid()));

CREATE POLICY "Users with trip access can log activity"
ON public.trip_activity_log
FOR INSERT
WITH CHECK (public.user_has_trip_access(trip_id, auth.uid()));

-- Update trips RLS to allow collaborator access
DROP POLICY IF EXISTS "Users can view their own trips" ON public.trips;
CREATE POLICY "Users can view trips they have access to"
ON public.trips
FOR SELECT
USING (user_id = auth.uid() OR public.user_has_trip_access(id, auth.uid()));

-- Update itineraries RLS to allow collaborator access
DROP POLICY IF EXISTS "Users can view itineraries for their trips" ON public.itineraries;
CREATE POLICY "Users can view itineraries for trips they have access to"
ON public.itineraries
FOR SELECT
USING (public.user_has_trip_access(trip_id, auth.uid()));

DROP POLICY IF EXISTS "Users can update itineraries for their trips" ON public.itineraries;
CREATE POLICY "Editors can update itineraries"
ON public.itineraries
FOR UPDATE
USING (public.can_edit_trip(trip_id, auth.uid()));

DROP POLICY IF EXISTS "Users can insert itineraries for their trips" ON public.itineraries;
CREATE POLICY "Editors can insert itineraries"
ON public.itineraries
FOR INSERT
WITH CHECK (public.can_edit_trip(trip_id, auth.uid()));

DROP POLICY IF EXISTS "Users can delete itineraries for their trips" ON public.itineraries;
CREATE POLICY "Editors can delete itineraries"
ON public.itineraries
FOR DELETE
USING (public.can_edit_trip(trip_id, auth.uid()));

-- Enable realtime for collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_collaborators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.itineraries;

-- Trigger to update updated_at
CREATE TRIGGER update_trip_collaborators_updated_at
BEFORE UPDATE ON public.trip_collaborators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();