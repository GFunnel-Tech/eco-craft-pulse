import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductVariant } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Palette, Edit2, Loader2 } from "lucide-react";
import { SIZES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface VariantManagerProps {
  productId: string;
  productSku: string;
  variants: ProductVariant[];
  onUpdate: () => void;
}

interface ColorGroup {
  color: string;
  colorHex: string;
  variants: ProductVariant[];
}

export function VariantManager({ productId, productSku, variants, onUpdate }: VariantManagerProps) {
  const [isAddingColor, setIsAddingColor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newColor, setNewColor] = useState({ name: "", hex: "#000000" });
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);

  // Group variants by color
  const colorGroups: ColorGroup[] = [];
  const colorMap = new Map<string, ColorGroup>();

  variants.forEach((variant) => {
    const colorKey = variant.color || "No Color";
    if (!colorMap.has(colorKey)) {
      colorMap.set(colorKey, {
        color: variant.color || "No Color",
        colorHex: variant.color_hex || "#cccccc",
        variants: [],
      });
    }
    colorMap.get(colorKey)!.variants.push(variant);
  });

  colorMap.forEach((group) => colorGroups.push(group));

  // Get unique colors for reference
  const existingColors = [...new Set(variants.map((v) => v.color).filter(Boolean))];

  const generateVariantSku = (color: string, size: string) => {
    const colorCode = color.substring(0, 3).toUpperCase();
    return `${productSku}-${colorCode}-${size}`;
  };

  const handleAddColor = async () => {
    if (!newColor.name.trim()) {
      toast.error("Please enter a color name");
      return;
    }

    setIsLoading(true);
    try {
      // Create variants for all sizes with this new color
      const newVariants = SIZES.map((size) => ({
        product_id: productId,
        sku: generateVariantSku(newColor.name, size),
        size,
        color: newColor.name,
        color_hex: newColor.hex,
        price_adjustment: 0,
        stock_quantity: 0,
        low_stock_threshold: 5,
        is_active: true,
      }));

      const { error } = await supabase.from("product_variants").insert(newVariants);

      if (error) throw error;

      toast.success(`Added ${newColor.name} with all sizes`);
      setNewColor({ name: "", hex: "#000000" });
      setIsAddingColor(false);
      onUpdate();
    } catch (error: any) {
      console.error("Error adding color:", error);
      toast.error(error.message || "Failed to add color");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSingleVariant = async (color: string, colorHex: string, size: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("product_variants").insert({
        product_id: productId,
        sku: generateVariantSku(color, size),
        size,
        color,
        color_hex: colorHex,
        price_adjustment: 0,
        stock_quantity: 0,
        low_stock_threshold: 5,
        is_active: true,
      });

      if (error) throw error;

      toast.success(`Added ${color} - ${size}`);
      onUpdate();
    } catch (error: any) {
      console.error("Error adding variant:", error);
      toast.error(error.message || "Failed to add variant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm("Are you sure you want to delete this variant?")) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("product_variants")
        .delete()
        .eq("id", variantId);

      if (error) throw error;

      toast.success("Variant deleted");
      onUpdate();
    } catch (error: any) {
      console.error("Error deleting variant:", error);
      toast.error(error.message || "Failed to delete variant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteColor = async (color: string) => {
    if (!confirm(`Delete all variants for ${color}?`)) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", productId)
        .eq("color", color);

      if (error) throw error;

      toast.success(`Deleted all ${color} variants`);
      onUpdate();
    } catch (error: any) {
      console.error("Error deleting color:", error);
      toast.error(error.message || "Failed to delete color");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVariant = async (variant: ProductVariant, updates: Partial<ProductVariant>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("product_variants")
        .update(updates)
        .eq("id", variant.id);

      if (error) throw error;

      toast.success("Variant updated");
      setEditingVariant(null);
      onUpdate();
    } catch (error: any) {
      console.error("Error updating variant:", error);
      toast.error(error.message || "Failed to update variant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateColorHex = async (color: string, newHex: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("product_variants")
        .update({ color_hex: newHex })
        .eq("product_id", productId)
        .eq("color", color);

      if (error) throw error;

      toast.success("Color updated");
      onUpdate();
    } catch (error: any) {
      console.error("Error updating color:", error);
      toast.error(error.message || "Failed to update color");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Color Variants</h3>
          <p className="text-sm text-muted-foreground">
            Manage product colors, sizes, and stock levels
          </p>
        </div>
        <Dialog open={isAddingColor} onOpenChange={setIsAddingColor}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Color
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Color</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Color Name</Label>
                <Input
                  value={newColor.name}
                  onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                  placeholder="e.g., Navy Blue"
                />
              </div>
              <div className="space-y-2">
                <Label>HEX Color Code</Label>
                <div className="flex gap-3">
                  <div
                    className="h-10 w-10 rounded-md border shadow-sm flex-shrink-0"
                    style={{ backgroundColor: newColor.hex }}
                  />
                  <Input
                    type="color"
                    value={newColor.hex}
                    onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={newColor.hex}
                    onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This will create variants for all sizes ({SIZES.join(", ")})
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddingColor(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddColor} disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Color
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {colorGroups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No variants yet. Add a color to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {colorGroups.map((group) => (
            <Card key={group.color}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-full border-2 shadow-sm"
                      style={{ backgroundColor: group.colorHex }}
                    />
                    <div>
                      <CardTitle className="text-base">{group.color}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="color"
                          value={group.colorHex}
                          onChange={(e) => handleUpdateColorHex(group.color, e.target.value)}
                          className="w-8 h-6 p-0 cursor-pointer border-0"
                          title="Change color"
                        />
                        <code className="text-xs text-muted-foreground">{group.colorHex}</code>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {group.variants.length} size{group.variants.length !== 1 ? "s" : ""}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteColor(group.color)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Size</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="w-24">Stock</TableHead>
                      <TableHead className="w-28">Price Adj.</TableHead>
                      <TableHead className="w-20">Active</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.variants
                      .sort((a, b) => SIZES.indexOf(a.size || "") - SIZES.indexOf(b.size || ""))
                      .map((variant) => (
                        <TableRow key={variant.id}>
                          <TableCell className="font-medium">{variant.size}</TableCell>
                          <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={variant.stock_quantity}
                              onChange={(e) =>
                                handleUpdateVariant(variant, {
                                  stock_quantity: parseInt(e.target.value) || 0,
                                })
                              }
                              className="h-8 w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={variant.price_adjustment}
                                onChange={(e) =>
                                  handleUpdateVariant(variant, {
                                    price_adjustment: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="h-8 w-20"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={variant.is_active}
                              onCheckedChange={(checked) =>
                                handleUpdateVariant(variant, { is_active: checked })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteVariant(variant.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                {/* Add missing sizes */}
                {SIZES.filter(
                  (size) => !group.variants.some((v) => v.size === size)
                ).length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Add missing sizes:</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZES.filter(
                        (size) => !group.variants.some((v) => v.size === size)
                      ).map((size) => (
                        <Button
                          key={size}
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleAddSingleVariant(group.color, group.colorHex, size)
                          }
                          disabled={isLoading}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
