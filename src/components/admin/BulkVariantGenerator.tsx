import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "./ProductVariantManager";

interface BulkVariantGeneratorProps {
  productSku: string;
  existingVariants: ProductVariant[];
  onGenerate: (newVariants: ProductVariant[]) => void;
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

export function BulkVariantGenerator({
  productSku,
  existingVariants,
  onGenerate,
}: BulkVariantGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<{ name: string; hex: string }[]>([]);
  const [defaultStock, setDefaultStock] = useState(0);
  const [defaultThreshold, setDefaultThreshold] = useState(10);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: { name: string; hex: string }) => {
    setSelectedColors((prev) =>
      prev.some((c) => c.hex === color.hex)
        ? prev.filter((c) => c.hex !== color.hex)
        : [...prev, color]
    );
  };

  const selectAllSizes = () => setSelectedSizes([...SIZES]);
  const clearSizes = () => setSelectedSizes([]);
  const selectAllColors = () => setSelectedColors([...PRESET_COLORS]);
  const clearColors = () => setSelectedColors([]);

  const generateVariants = () => {
    const newVariants: ProductVariant[] = [];
    let variantIndex = existingVariants.length;

    // Generate all combinations
    if (selectedSizes.length > 0 && selectedColors.length > 0) {
      // Both sizes and colors selected
      for (const color of selectedColors) {
        for (const size of selectedSizes) {
          const exists = existingVariants.some(
            (v) =>
              v.size === size &&
              v.color_hex?.toLowerCase() === color.hex.toLowerCase()
          );
          if (!exists) {
            variantIndex++;
            newVariants.push({
              sku: `${productSku}-${color.name.toUpperCase().replace(/\s+/g, "")}-${size}-${variantIndex}`,
              size,
              color: color.name,
              color_hex: color.hex,
              price_adjustment: 0,
              stock_quantity: defaultStock,
              low_stock_threshold: defaultThreshold,
              is_active: true,
            });
          }
        }
      }
    } else if (selectedSizes.length > 0) {
      // Only sizes selected
      for (const size of selectedSizes) {
        const exists = existingVariants.some(
          (v) => v.size === size && !v.color
        );
        if (!exists) {
          variantIndex++;
          newVariants.push({
            sku: `${productSku}-${size}-${variantIndex}`,
            size,
            color: null,
            color_hex: null,
            price_adjustment: 0,
            stock_quantity: defaultStock,
            low_stock_threshold: defaultThreshold,
            is_active: true,
          });
        }
      }
    } else if (selectedColors.length > 0) {
      // Only colors selected
      for (const color of selectedColors) {
        const exists = existingVariants.some(
          (v) =>
            v.color_hex?.toLowerCase() === color.hex.toLowerCase() && !v.size
        );
        if (!exists) {
          variantIndex++;
          newVariants.push({
            sku: `${productSku}-${color.name.toUpperCase().replace(/\s+/g, "")}-${variantIndex}`,
            size: null,
            color: color.name,
            color_hex: color.hex,
            price_adjustment: 0,
            stock_quantity: defaultStock,
            low_stock_threshold: defaultThreshold,
            is_active: true,
          });
        }
      }
    }

    if (newVariants.length > 0) {
      onGenerate(newVariants);
    }

    // Reset and close
    setSelectedSizes([]);
    setSelectedColors([]);
    setOpen(false);
  };

  const totalCombinations =
    selectedSizes.length > 0 && selectedColors.length > 0
      ? selectedSizes.length * selectedColors.length
      : selectedSizes.length + selectedColors.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Grid3X3 className="h-4 w-4 mr-1" />
          Bulk Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Bulk Variant Generator
          </DialogTitle>
          <DialogDescription>
            Select sizes and colors to automatically generate all combinations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sizes Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Sizes</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={selectAllSizes}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={clearSizes}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={cn(
                    "px-3 py-1.5 rounded-md border text-sm font-medium transition-colors",
                    selectedSizes.includes(size)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-input hover:bg-accent"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Colors Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Colors</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={selectAllColors}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={clearColors}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => {
                const isSelected = selectedColors.some((c) => c.hex === color.hex);
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => toggleColor(color)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors",
                      isSelected
                        ? "bg-primary/10 border-primary"
                        : "bg-background border-input hover:bg-accent"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border",
                        isSelected ? "ring-2 ring-primary ring-offset-1" : ""
                      )}
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default Values */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Default Stock Qty</Label>
              <Input
                type="number"
                min="0"
                value={defaultStock}
                onChange={(e) => setDefaultStock(parseInt(e.target.value) || 0)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Low Stock Threshold</Label>
              <Input
                type="number"
                min="0"
                value={defaultThreshold}
                onChange={(e) => setDefaultThreshold(parseInt(e.target.value) || 10)}
                className="h-9"
              />
            </div>
          </div>

          {/* Preview */}
          {totalCombinations > 0 && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Variants to generate:
                </span>
                <Badge variant="secondary" className="font-mono">
                  {totalCombinations} combinations
                </Badge>
              </div>
              {selectedSizes.length > 0 && selectedColors.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedSizes.length} sizes × {selectedColors.length} colors
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={generateVariants}
            disabled={totalCombinations === 0}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Generate {totalCombinations > 0 ? totalCombinations : ""} Variants
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
