import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Product, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ProductVariantManager, ProductVariant } from "./ProductVariantManager";
import { ProductImageManager, ProductImage } from "./ProductImageManager";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  short_description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  compare_at_price: z.coerce.number().optional().nullable(),
  cost_price: z.coerce.number().optional().nullable(),
  category_id: z.string().optional().nullable(),
  brand: z.string().default("KORR"),
  material: z.string().optional(),
  care_instructions: z.string().optional(),
  is_active: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  is_new: z.boolean().default(true),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ product, categories, onSuccess, onCancel }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      sku: product?.sku || "",
      slug: product?.slug || "",
      description: product?.description || "",
      short_description: product?.short_description || "",
      price: product?.price || 0,
      compare_at_price: product?.compare_at_price || null,
      cost_price: product?.cost_price || null,
      category_id: product?.category_id || null,
      brand: product?.brand || "KORR",
      material: product?.material || "",
      care_instructions: product?.care_instructions || "",
      is_active: product?.is_active ?? false,
      is_featured: product?.is_featured ?? false,
      is_new: product?.is_new ?? true,
      meta_title: product?.meta_title || "",
      meta_description: product?.meta_description || "",
    },
  });

  // Load existing variants and images when editing
  useEffect(() => {
    if (product) {
      // Load variants
      if (product.variants && product.variants.length > 0) {
        setVariants(
          product.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            size: v.size,
            color: v.color,
            color_hex: v.color_hex,
            price_adjustment: v.price_adjustment || 0,
            stock_quantity: v.stock_quantity,
            low_stock_threshold: v.low_stock_threshold || 10,
            is_active: v.is_active ?? true,
          }))
        );
      }
      // Load images
      if (product.images && product.images.length > 0) {
        setImages(
          product.images.map((img) => ({
            id: img.id,
            url: img.url,
            alt_text: img.alt_text,
            is_primary: img.is_primary ?? false,
            sort_order: img.sort_order ?? 0,
            color_hex: (img as any).color_hex || null,
          }))
        );
      }
    }
  }, [product]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    form.setValue("name", name);
    if (!product) {
      form.setValue("slug", generateSlug(name));
    }
  };

  // Get unique colors from variants for image assignment
  const availableColors = [...new Map(
    variants
      .filter((v) => v.color && v.color_hex)
      .map((v) => [v.color_hex, { color: v.color!, hex: v.color_hex! }])
  ).values()];

  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const productData = {
        name: values.name,
        sku: values.sku,
        slug: values.slug,
        description: values.description || null,
        short_description: values.short_description || null,
        price: values.price,
        compare_at_price: values.compare_at_price || null,
        cost_price: values.cost_price || null,
        category_id: values.category_id === "none" ? null : values.category_id || null,
        brand: values.brand || null,
        material: values.material || null,
        care_instructions: values.care_instructions || null,
        is_active: values.is_active ?? true,
        is_featured: values.is_featured ?? false,
        is_new: values.is_new ?? false,
        meta_title: values.meta_title || null,
        meta_description: values.meta_description || null,
        tags: null,
      };

      let productId = product?.id;

      if (product) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert([productData])
          .select("id")
          .single();
        if (error) throw error;
        productId = data.id;
      }

      if (!productId) throw new Error("Failed to get product ID");

      // Handle variants
      if (product) {
        // Delete removed variants
        const existingIds = variants.filter((v) => v.id).map((v) => v.id);
        if (product.variants) {
          const toDelete = product.variants
            .filter((v) => !existingIds.includes(v.id))
            .map((v) => v.id);
          if (toDelete.length > 0) {
            await supabase.from("product_variants").delete().in("id", toDelete);
          }
        }
      }

      // Upsert variants
      for (const variant of variants) {
        const variantData = {
          product_id: productId,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          color_hex: variant.color_hex,
          price_adjustment: variant.price_adjustment,
          stock_quantity: variant.stock_quantity,
          low_stock_threshold: variant.low_stock_threshold,
          is_active: variant.is_active,
        };

        if (variant.id) {
          await supabase
            .from("product_variants")
            .update(variantData)
            .eq("id", variant.id);
        } else {
          await supabase.from("product_variants").insert([variantData]);
        }
      }

      // Handle images
      if (product) {
        // Delete removed images
        const existingImageIds = images.filter((img) => img.id).map((img) => img.id);
        if (product.images) {
          const toDeleteImages = product.images
            .filter((img) => !existingImageIds.includes(img.id))
            .map((img) => img.id);
          if (toDeleteImages.length > 0) {
            await supabase.from("product_images").delete().in("id", toDeleteImages);
          }
        }
      }

      // Upsert images
      for (const image of images) {
        if (!image.url) continue;

        const imageData = {
          product_id: productId,
          url: image.url,
          alt_text: image.alt_text,
          is_primary: image.is_primary,
          sort_order: image.sort_order,
          color_hex: image.color_hex,
        };

        if (image.id) {
          await supabase
            .from("product_images")
            .update(imageData)
            .eq("id", image.id);
        } else {
          await supabase.from("product_images").insert([imageData]);
        }
      }

      toast.success(product ? "Product updated successfully" : "Product created successfully");
      onSuccess();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(error.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedSku = form.watch("sku");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="variants">
              Variants {variants.length > 0 && `(${variants.length})`}
            </TabsTrigger>
            <TabsTrigger value="images">
              Images {images.length > 0 && `(${images.length})`}
            </TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Performance Running Tee"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="KORR-TEE-001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="performance-running-tee" />
                  </FormControl>
                  <FormDescription>Used in product URLs</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="short_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="A brief description for product cards..."
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Detailed product description..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" min="0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="compare_at_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compare at Price</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>Original price for sales</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>Your cost (private)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="KORR" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="material"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="87% Polyester, 13% Spandex" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="care_instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Care Instructions</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Machine wash cold, tumble dry low" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Active</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Featured</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_new"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">New Arrival</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="variants" className="mt-6">
            <ProductVariantManager
              variants={variants}
              onChange={setVariants}
              productSku={watchedSku || "KORR"}
            />
          </TabsContent>

          <TabsContent value="images" className="mt-6">
            <ProductImageManager
              images={images}
              onChange={setImages}
              availableColors={availableColors}
            />
          </TabsContent>

          <TabsContent value="seo" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="meta_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Product title for search engines" />
                    </FormControl>
                    <FormDescription>Recommended: under 60 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meta_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Brief description for search results"
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>Recommended: under 160 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {product ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
