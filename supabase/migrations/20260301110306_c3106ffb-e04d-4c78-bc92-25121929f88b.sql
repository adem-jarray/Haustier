-- Fix permissive INSERT policy on contact_messages - require at least basic info
DROP POLICY "Anyone can send a message" ON public.contact_messages;
CREATE POLICY "Anyone can send a message" ON public.contact_messages FOR INSERT WITH CHECK (
  length(name) > 0 AND length(email) > 0 AND length(message) > 0
);