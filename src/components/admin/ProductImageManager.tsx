import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  GripVertical,
  ImageIcon,
  Star,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductImage {
  id?: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  color_hex: string | null;
}

interface ColorOption {
  color: string;
  hex: string;
}

interface ProductImageManagerProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  availableColors: ColorOption[];
}

export function ProductImageManager({
  images,
  onChange,
  availableColors,
}: ProductImageManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addImage = () => {
    const newImage: ProductImage = {
      url: "",
      alt_text: null,
      is_primary: images.length === 0,
      sort_order: images.length,
      color_hex: null,
    };
    onChange([...images, newImage]);
  };

  const updateImage = (index: number, updates: Partial<ProductImage>) => {
    const updated = images.map((img, i) => {
      if (i === index) {
        // If setting this as primary, unset others
        if (updates.is_primary) {
          return { ...img, ...updates };
        }
        return { ...img, ...updates };
      }
      // Unset primary on other images if this one becomes primary
      if (updates.is_primary) {
        return { ...img, is_primary: false };
      }
      return img;
    });
    onChange(updated);
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    // If we removed the primary, make the first one primary
    if (images[index].is_primary && updated.length > 0) {
      updated[0].is_primary = true;
    }
    // Update sort orders
    updated.forEach((img, i) => {
      img.sort_order = i;
    });
    onChange(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...images];
    const [dragged] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, dragged);
    updated.forEach((img, i) => {
      img.sort_order = i;
    });
    onChange(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getColorName = (hex: string | null) => {
    if (!hex) return null;
    return availableColors.find((c) => c.hex === hex)?.color || hex;
  };

  // Group images by color for preview
  const generalImages = images.filter((img) => !img.color_hex);
  const colorImages = images.filter((img) => img.color_hex);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Product Images</Label>
          <p className="text-sm text-muted-foreground">
            Add images and optionally assign them to specific colors
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addImage}>
          <Plus className="h-4 w-4 mr-1" />
          Add Image
        </Button>
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-muted-foreground">Summary:</span>
          <Badge variant="secondary">
            <ImageIcon className="h-3 w-3 mr-1" />
            {generalImages.length} general
          </Badge>
          {availableColors.map((color) => {
            const count = colorImages.filter((img) => img.color_hex === color.hex).length;
            if (count === 0) return null;
            return (
              <Badge key={color.hex} variant="outline" className="gap-1.5">
                <div
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: color.hex }}
                />
                {count} {color.color}
              </Badge>
            );
          })}
        </div>
      )}

      {images.length === 0 ? (
        <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No images yet. Add product images to display in the store.
        </div>
      ) : (
        <div className="space-y-2">
          {images.map((image, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "border rounded-lg p-3 flex gap-3 items-start transition-all",
                draggedIndex === index && "opacity-50 border-primary"
              )}
            >
              <div className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
              </div>

              {/* Image Preview */}
              <div className="w-16 h-16 rounded border bg-muted flex-shrink-0 overflow-hidden">
                {image.url ? (
                  <img
                    src={image.url}
                    alt={image.alt_text || "Product image"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={image.url}
                      onChange={(e) => updateImage(index, { url: e.target.value })}
                      placeholder="Image URL (https://...)"
                      className="h-9"
                    />
                  </div>
                  <div className="w-40">
                    <Select
                      value={image.color_hex || "general"}
                      onValueChange={(val) =>
                        updateImage(index, {
                          color_hex: val === "general" ? null : val,
                        })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Assign to color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-3 w-3" />
                            General Image
                          </div>
                        </SelectItem>
                        {availableColors.map((color) => (
                          <SelectItem key={color.hex} value={color.hex}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full border border-border"
                                style={{ backgroundColor: color.hex }}
                              />
                              {color.color}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Input
                    value={image.alt_text || ""}
                    onChange={(e) =>
                      updateImage(index, { alt_text: e.target.value || null })
                    }
                    placeholder="Alt text (for accessibility)"
                    className="h-8 text-sm flex-1"
                  />
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={image.is_primary}
                      onCheckedChange={(checked) =>
                        updateImage(index, { is_primary: checked })
                      }
                    />
                    <Label className="text-xs flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Primary
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                {image.color_hex && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <LinkIcon className="h-3 w-3" />
                    {getColorName(image.color_hex)}
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeImage(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
