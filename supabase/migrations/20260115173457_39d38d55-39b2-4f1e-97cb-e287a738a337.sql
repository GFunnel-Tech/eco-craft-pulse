-- Fix newsletter subscriber policy to be more specific
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;

-- Create a more restrictive policy - only allow inserting with valid email format
CREATE POLICY "Anyone can subscribe with valid email"
ON public.newsletter_subscribers FOR INSERT
TO anon, authenticated
WITH CHECK (
    email IS NOT NULL 
    AND email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
);