-- Fix overly permissive policy on product_images
-- Drop the permissive policy
DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;

-- Create a more specific policy that only shows images for active products
CREATE POLICY "Anyone can view images of active products"
ON public.product_images FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.products 
        WHERE products.id = product_images.product_id 
        AND products.is_active = true
    )
);