-- =====================
-- AVAILABILITY SLOTS
-- Vets define recurring weekly availability
-- =====================
CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_id UUID NOT NULL REFERENCES public.veterinarians(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 1=Mon...
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Slots viewable by everyone" ON public.availability_slots FOR SELECT USING (true);
CREATE POLICY "Vet owners can manage their slots" ON public.availability_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM public.veterinarians WHERE id = vet_id AND user_id = auth.uid())
);

-- =====================
-- BOOKED DATES (specific dates already taken)
-- =====================
CREATE TABLE public.booked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_id UUID NOT NULL REFERENCES public.veterinarians(id) ON DELETE CASCADE,
  booked_date DATE NOT NULL,
  booked_time TIME NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  UNIQUE(vet_id, booked_date, booked_time)
);

ALTER TABLE public.booked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Booked slots viewable by everyone" ON public.booked_slots FOR SELECT USING (true);
CREATE POLICY "System can manage booked slots" ON public.booked_slots FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================
-- Add lat/lng to veterinarians if missing
-- =====================
ALTER TABLE public.veterinarians
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 4.5,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS working_hours TEXT DEFAULT 'Lun-Ven 9h-18h';
