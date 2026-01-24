import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductImage, ProductVariant } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
  Link,
  Star,
  Loader2,
  GripVertical,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageManagerProps {
  productId: string;
  images: ProductImage[];
  variants: ProductVariant[];
  onUpdate: () => void;
}

type UploadMethod = "url" | "file";

export function ImageManager({ productId, images, variants, onUpdate }: ImageManagerProps) {
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>("general");
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get unique colors from variants
  const availableColors = [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[];

  // Group images by color
  const generalImages = images.filter((img) => !img.color);
  const colorImages = new Map<string, ProductImage[]>();

  availableColors.forEach((color) => {
    colorImages.set(color, images.filter((img) => img.color === color));
  });

  const handleAddImageByUrl = async () => {
    if (!imageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("product_images").insert({
        product_id: productId,
        url: imageUrl,
        alt_text: imageAlt || null,
        sort_order: images.length,
        is_primary: images.length === 0,
        color: selectedColor === "general" ? null : selectedColor,
      });

      if (error) throw error;

      toast.success("Image added successfully");
      setImageUrl("");
      setImageAlt("");
      setSelectedColor("general");
      setIsAddingImage(false);
      onUpdate();
    } catch (error: any) {
      console.error("Error adding image:", error);
      toast.error(error.message || "Failed to add image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadingFiles(files);
  };

  const handleUploadFiles = async () => {
    if (uploadingFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setIsLoading(true);
    try {
      for (let i = 0; i < uploadingFiles.length; i++) {
        const file = uploadingFiles[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${productId}/${Date.now()}-${i}.${fileExt}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          // If storage bucket doesn't exist, fall back to just storing the file name
          // In production, you'd want to create the bucket first
          toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        // Save to database
        const { error: dbError } = await supabase.from("product_images").insert({
          product_id: productId,
          url: urlData.publicUrl,
          alt_text: file.name.split(".")[0],
          sort_order: images.length + i,
          is_primary: images.length === 0 && i === 0,
          color: selectedColor === "general" ? null : selectedColor,
        });

        if (dbError) throw dbError;
      }

      toast.success(`Uploaded ${uploadingFiles.length} image(s)`);
      setUploadingFiles([]);
      setSelectedColor("general");
      setIsAddingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUpdate();
    } catch (error: any) {
      console.error("Error uploading files:", error);
      toast.error(error.message || "Failed to upload files");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Delete this image?")) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("product_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;

      toast.success("Image deleted");
      onUpdate();
    } catch (error: any) {
      console.error("Error deleting image:", error);
      toast.error(error.message || "Failed to delete image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPrimary = async (imageId: string, color: string | null) => {
    setIsLoading(true);
    try {
      // First, unset primary for all images with the same color (or general)
      if (color) {
        await supabase
          .from("product_images")
          .update({ is_primary: false })
          .eq("product_id", productId)
          .eq("color", color);
      } else {
        await supabase
          .from("product_images")
          .update({ is_primary: false })
          .eq("product_id", productId)
          .is("color", null);
      }

      // Set the new primary
      const { error } = await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", imageId);

      if (error) throw error;

      toast.success("Primary image updated");
      onUpdate();
    } catch (error: any) {
      console.error("Error setting primary:", error);
      toast.error(error.message || "Failed to update primary image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateImageColor = async (imageId: string, newColor: string | null) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("product_images")
        .update({ color: newColor })
        .eq("id", imageId);

      if (error) throw error;

      toast.success("Image color assignment updated");
      onUpdate();
    } catch (error: any) {
      console.error("Error updating image color:", error);
      toast.error(error.message || "Failed to update image");
    } finally {
      setIsLoading(false);
    }
  };

  const ImageCard = ({ image, showColorSelect = false }: { image: ProductImage; showColorSelect?: boolean }) => {
    const colorVariant = image.color
      ? variants.find((v) => v.color === image.color)
      : null;

    return (
      <Card className="group relative overflow-hidden">
        <CardContent className="p-0">
          <div className="aspect-square relative bg-muted">
            <img
              src={image.url}
              alt={image.alt_text || "Product image"}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
            {/* Overlay actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleSetPrimary(image.id, image.color)}
                title="Set as primary"
              >
                <Star className={cn("h-4 w-4", image.is_primary && "fill-yellow-500 text-yellow-500")} />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleDeleteImage(image.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {/* Primary badge */}
            {image.is_primary && (
              <Badge className="absolute top-2 left-2 bg-yellow-500 text-yellow-950">
                Primary
              </Badge>
            )}
          </div>
          {/* Color assignment */}
          {showColorSelect && availableColors.length > 0 && (
            <div className="p-2 border-t">
              <Select
                value={image.color || "general"}
                onValueChange={(value) =>
                  handleUpdateImageColor(image.id, value === "general" ? null : value)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">
                    <span className="flex items-center gap-2">
                      <ImageIcon className="h-3 w-3" />
                      General (all colors)
                    </span>
                  </SelectItem>
                  {availableColors.map((color) => {
                    const variant = variants.find((v) => v.color === color);
                    return (
                      <SelectItem key={color} value={color}>
                        <span className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full border"
                            style={{ backgroundColor: variant?.color_hex || "#ccc" }}
                          />
                          {color}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Color indicator for grouped view */}
          {!showColorSelect && image.color && (
            <div className="p-2 border-t flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: colorVariant?.color_hex || "#ccc" }}
              />
              <span className="text-xs text-muted-foreground">{image.color}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Product Images</h3>
          <p className="text-sm text-muted-foreground">
            Add images and assign them to specific colors or keep as general
          </p>
        </div>
        <Dialog open={isAddingImage} onOpenChange={setIsAddingImage}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Product Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Upload method tabs */}
              <div className="flex gap-2">
                <Button
                  variant={uploadMethod === "url" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUploadMethod("url")}
                  className="flex-1"
                >
                  <Link className="h-4 w-4 mr-2" />
                  URL
                </Button>
                <Button
                  variant={uploadMethod === "file" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUploadMethod("file")}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>

              {/* Color selection */}
              <div className="space-y-2">
                <Label>Assign to Color</Label>
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      <span className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        General (shows for all colors)
                      </span>
                    </SelectItem>
                    {availableColors.map((color) => {
                      const variant = variants.find((v) => v.color === color);
                      return (
                        <SelectItem key={color} value={color}>
                          <span className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded-full border"
                              style={{ backgroundColor: variant?.color_hex || "#ccc" }}
                            />
                            {color}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {availableColors.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Add color variants first to assign images to specific colors
                  </p>
                )}
              </div>

              {uploadMethod === "url" ? (
                <>
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alt Text (optional)</Label>
                    <Input
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      placeholder="Describe the image"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsAddingImage(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddImageByUrl} disabled={isLoading}>
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add Image
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Select Files</Label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                    />
                  </div>
                  {uploadingFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {uploadingFiles.length} file(s) selected:
                      </p>
                      <ul className="text-sm text-muted-foreground">
                        {uploadingFiles.map((file, i) => (
                          <li key={i}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsAddingImage(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUploadFiles} disabled={isLoading}>
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Upload
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {images.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No images yet. Add images to showcase your product.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* General Images */}
          {generalImages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                General Images
                <Badge variant="secondary">{generalImages.length}</Badge>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {generalImages.map((image) => (
                  <ImageCard key={image.id} image={image} showColorSelect />
                ))}
              </div>
            </div>
          )}

          {/* Color-specific Images */}
          {availableColors.map((color) => {
            const colorImgs = colorImages.get(color) || [];
            if (colorImgs.length === 0) return null;

            const colorVariant = variants.find((v) => v.color === color);

            return (
              <div key={color}>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full border"
                    style={{ backgroundColor: colorVariant?.color_hex || "#ccc" }}
                  />
                  {color} Images
                  <Badge variant="secondary">{colorImgs.length}</Badge>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {colorImgs.map((image) => (
                    <ImageCard key={image.id} image={image} showColorSelect />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Quick guide */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>General images</strong> display for all color selections</li>
              <li><strong>Color-specific images</strong> only show when that color is selected</li>
              <li>Click the star icon to set an image as primary</li>
              <li>Use the dropdown to reassign images between colors</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
