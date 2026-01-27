-- Create user_preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  travel_style TEXT[] DEFAULT '{}',
  budget_range TEXT,
  dietary_restrictions TEXT[] DEFAULT '{}',
  accessibility_needs TEXT[] DEFAULT '{}',
  preferred_activities TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create trips table
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10,2),
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create itineraries table
CREATE TABLE public.itineraries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIME,
  end_time TIME,
  category TEXT CHECK (category IN ('activity', 'meal', 'transport', 'accommodation', 'other')),
  estimated_cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for trips
CREATE POLICY "Users can view their own trips" ON public.trips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trips" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips" ON public.trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips" ON public.trips
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for itineraries (access through trip ownership)
CREATE POLICY "Users can view itineraries for their trips" ON public.itineraries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = itineraries.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can insert itineraries for their trips" ON public.itineraries
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = itineraries.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can update itineraries for their trips" ON public.itineraries
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = itineraries.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can delete itineraries for their trips" ON public.itineraries
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = itineraries.trip_id AND trips.user_id = auth.uid())
  );

-- RLS policies for chat_messages
CREATE POLICY "Users can view their own messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();