import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Product, Category, ProductVariant, ProductImage } from "@/types";
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
import { Loader2, Package, Palette, Image as ImageIcon } from "lucide-react";
import { VariantManager } from "./VariantManager";
import { ImageManager } from "./ImageManager";

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
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);
  const [images, setImages] = useState<ProductImage[]>(product?.images || []);

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

  const fetchVariantsAndImages = useCallback(async () => {
    if (!product?.id) return;

    const [variantsResult, imagesResult] = await Promise.all([
      supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", product.id)
        .order("color", { ascending: true })
        .order("size", { ascending: true }),
      supabase
        .from("product_images")
        .select("*")
        .eq("product_id", product.id)
        .order("sort_order", { ascending: true }),
    ]);

    if (variantsResult.data) setVariants(variantsResult.data as ProductVariant[]);
    if (imagesResult.data) setImages(imagesResult.data as ProductImage[]);
  }, [product?.id]);

  useEffect(() => {
    if (product?.id) {
      fetchVariantsAndImages();
    }
  }, [product?.id, fetchVariantsAndImages]);

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

  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const insertData = {
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

      if (product) {
        const { error } = await supabase
          .from("products")
          .update(insertData)
          .eq("id", product.id);
        if (error) throw error;
        toast.success("Product updated successfully");
      } else {
        const { error } = await supabase.from("products").insert([insertData]);
        if (error) throw error;
        toast.success("Product created successfully");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(error.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const BasicInfoForm = () => (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="meta_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SEO Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Product title for search engines" />
              </FormControl>
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
                <Input {...field} placeholder="Brief description for search results" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  // For new products, show simple form
  if (!product) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <BasicInfoForm />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Product
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            After creating the product, you can add color variants and images.
          </p>
        </form>
      </Form>
    );
  }

  // For existing products, show tabbed interface
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="details" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Details
        </TabsTrigger>
        <TabsTrigger value="variants" className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Colors & Sizes
        </TabsTrigger>
        <TabsTrigger value="images" className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Images
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <BasicInfoForm />
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Product
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="variants">
        <VariantManager
          productId={product.id}
          productSku={product.sku}
          variants={variants}
          onUpdate={fetchVariantsAndImages}
        />
        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="images">
        <ImageManager
          productId={product.id}
          images={images}
          variants={variants}
          onUpdate={fetchVariantsAndImages}
        />
        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
