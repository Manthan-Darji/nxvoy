-- Remove old category constraint
ALTER TABLE public.itineraries DROP CONSTRAINT IF EXISTS itineraries_category_check;

-- Add new expanded constraint with all AI-generated categories
ALTER TABLE public.itineraries ADD CONSTRAINT itineraries_category_check 
  CHECK (category IN ('attraction', 'food', 'culture', 'adventure', 'relaxation', 
                      'shopping', 'nightlife', 'transport', 'accommodation', 
                      'activity', 'meal', 'other'));

-- Add coordinate columns for map markers
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);