-- Increase budget precision to prevent numeric overflow when users enter large budgets
ALTER TABLE public.trips
  ALTER COLUMN budget TYPE numeric(16,2);
