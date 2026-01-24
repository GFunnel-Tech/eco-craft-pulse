-- Add color_hex to product_images to allow assigning images to specific colors
ALTER TABLE public.product_images 
ADD COLUMN IF NOT EXISTS color_hex TEXT DEFAULT NULL;

-- Add comment to clarify usage
COMMENT ON COLUMN public.product_images.color_hex IS 'When set, this image is associated with a specific color variant. NULL means it is a general product image.';