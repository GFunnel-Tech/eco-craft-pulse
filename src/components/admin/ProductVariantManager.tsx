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
import { Plus, Trash2, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { BulkVariantGenerator } from "./BulkVariantGenerator";

export interface ProductVariant {
  id?: string;
  sku: string;
  size: string | null;
  color: string | null;
  color_hex: string | null;
  price_adjustment: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
}

interface ProductVariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  productSku: string;
}

const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

const PRESET_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Charcoal", hex: "#36454F" },
  { name: "Heather Grey", hex: "#9a9a9a" },
  { name: "Forest Green", hex: "#228B22" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Slate Blue", hex: "#6A5ACD" },
  { name: "Olive", hex: "#808000" },
  { name: "Coral", hex: "#FF7F50" },
];

export function ProductVariantManager({
  variants,
  onChange,
  productSku,
}: ProductVariantManagerProps) {
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null);

  const addVariant = () => {
    const newVariant: ProductVariant = {
      sku: `${productSku}-${variants.length + 1}`,
      size: null,
      color: null,
      color_hex: null,
      price_adjustment: 0,
      stock_quantity: 0,
      low_stock_threshold: 10,
      is_active: true,
    };
    onChange([...variants, newVariant]);
  };

  const updateVariant = (index: number, updates: Partial<ProductVariant>) => {
    const updated = variants.map((v, i) =>
      i === index ? { ...v, ...updates } : v
    );
    onChange(updated);
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const selectPresetColor = (index: number, preset: { name: string; hex: string }) => {
    updateVariant(index, { color: preset.name, color_hex: preset.hex });
    setShowColorPicker(null);
  };

  const uniqueColors = [...new Map(
    variants
      .filter(v => v.color && v.color_hex)
      .map(v => [v.color_hex, { color: v.color!, hex: v.color_hex! }])
  ).values()];

  const handleBulkGenerate = (newVariants: ProductVariant[]) => {
    onChange([...variants, ...newVariants]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Product Variants</Label>
          <p className="text-sm text-muted-foreground">
            Add size and color combinations with individual stock levels
          </p>
        </div>
        <div className="flex gap-2">
          <BulkVariantGenerator
            productSku={productSku}
            existingVariants={variants}
            onGenerate={handleBulkGenerate}
          />
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <Plus className="h-4 w-4 mr-1" />
            Add Variant
          </Button>
        </div>
      </div>

      {uniqueColors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground mr-2">Colors in use:</span>
          {uniqueColors.map((c, i) => (
            <Badge key={i} variant="outline" className="gap-1.5">
              <div
                className="w-3 h-3 rounded-full border border-border"
                style={{ backgroundColor: c.hex }}
              />
              {c.color}
            </Badge>
          ))}
        </div>
      )}

      {variants.length === 0 ? (
        <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground">
          No variants yet. Add variants to manage size/color combinations and stock.
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div
              key={index}
              className={cn(
                "border rounded-lg p-4 space-y-4 transition-colors",
                !variant.is_active && "bg-muted/50 opacity-75"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {variant.color_hex && (
                    <div
                      className="w-6 h-6 rounded-full border-2 border-border"
                      style={{ backgroundColor: variant.color_hex }}
                    />
                  )}
                  <span className="font-medium text-sm">
                    {variant.color || "No color"} / {variant.size || "No size"}
                  </span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {variant.sku}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={variant.is_active}
                      onCheckedChange={(checked) =>
                        updateVariant(index, { is_active: checked })
                      }
                    />
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeVariant(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">SKU</Label>
                  <Input
                    value={variant.sku}
                    onChange={(e) => updateVariant(index, { sku: e.target.value })}
                    placeholder="KORR-XXX-001"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Size</Label>
                  <Select
                    value={variant.size || "none"}
                    onValueChange={(val) =>
                      updateVariant(index, { size: val === "none" ? null : val })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No size</SelectItem>
                      {SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 col-span-2 md:col-span-2">
                  <Label className="text-xs">Color</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={variant.color || ""}
                        onChange={(e) =>
                          updateVariant(index, { color: e.target.value || null })
                        }
                        placeholder="Color name"
                        className="h-9 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-9 w-9"
                        onClick={() =>
                          setShowColorPicker(showColorPicker === index ? null : index)
                        }
                      >
                        <Palette className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="relative">
                      <Input
                        type="color"
                        value={variant.color_hex || "#000000"}
                        onChange={(e) =>
                          updateVariant(index, { color_hex: e.target.value })
                        }
                        className="h-9 w-12 p-1 cursor-pointer"
                      />
                    </div>
                  </div>
                  {showColorPicker === index && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {PRESET_COLORS.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => selectPresetColor(index, preset)}
                          className={cn(
                            "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                            variant.color_hex === preset.hex
                              ? "border-primary ring-2 ring-primary ring-offset-1"
                              : "border-border"
                          )}
                          style={{ backgroundColor: preset.hex }}
                          title={preset.name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Stock Qty</Label>
                  <Input
                    type="number"
                    min="0"
                    value={variant.stock_quantity}
                    onChange={(e) =>
                      updateVariant(index, {
                        stock_quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Low Stock Alert</Label>
                  <Input
                    type="number"
                    min="0"
                    value={variant.low_stock_threshold}
                    onChange={(e) =>
                      updateVariant(index, {
                        low_stock_threshold: parseInt(e.target.value) || 10,
                      })
                    }
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Price Adjustment</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variant.price_adjustment}
                    onChange={(e) =>
                      updateVariant(index, {
                        price_adjustment: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-9"
                    placeholder="+/- from base"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
