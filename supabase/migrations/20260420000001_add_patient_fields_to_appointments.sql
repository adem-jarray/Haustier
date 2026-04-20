-- Add patient_name and patient_email columns to appointments table
-- These are used when booking to store the patient's name and email
-- so the vet can see who booked without joining the profiles table.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS patient_name TEXT,
  ADD COLUMN IF NOT EXISTS patient_email TEXT;
