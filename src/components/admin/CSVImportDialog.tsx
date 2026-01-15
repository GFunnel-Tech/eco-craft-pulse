import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download } from "lucide-react";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSuccess: () => void;
}

interface ParsedProduct {
  sku: string;
  name: string;
  description?: string;
  short_description?: string;
  price: number;
  compare_at_price?: number;
  category_name?: string;
  brand?: string;
  material?: string;
  is_active?: boolean;
  is_featured?: boolean;
  is_new?: boolean;
  errors: string[];
  status: "pending" | "success" | "error";
}

export function CSVImportDialog({ open, onOpenChange, categories, onSuccess }: CSVImportDialogProps) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "complete">("upload");
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState({ success: 0, failed: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetDialog = () => {
    setStep("upload");
    setParsedProducts([]);
    setImportProgress(0);
    setImportStats({ success: 0, failed: 0 });
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetDialog();
    }
    onOpenChange(isOpen);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const parseCSV = (content: string): ParsedProduct[] => {
    const lines = content.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const products: ParsedProduct[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const errors: string[] = [];

      const getValue = (key: string) => {
        const index = headers.indexOf(key);
        return index >= 0 ? values[index]?.trim().replace(/^"|"$/g, "") : undefined;
      };

      const sku = getValue("sku") || "";
      const name = getValue("name") || "";
      const priceStr = getValue("price") || "0";
      const price = parseFloat(priceStr);
      const compareAtPriceStr = getValue("compare_at_price") || getValue("compare at price");
      const compareAtPrice = compareAtPriceStr ? parseFloat(compareAtPriceStr) : undefined;

      if (!sku) errors.push("SKU is required");
      if (!name) errors.push("Name is required");
      if (isNaN(price) || price < 0) errors.push("Invalid price");

      products.push({
        sku,
        name,
        description: getValue("description"),
        short_description: getValue("short_description") || getValue("short description"),
        price: isNaN(price) ? 0 : price,
        compare_at_price: compareAtPrice && !isNaN(compareAtPrice) ? compareAtPrice : undefined,
        category_name: getValue("category"),
        brand: getValue("brand") || "KORR",
        material: getValue("material"),
        is_active: getValue("is_active")?.toLowerCase() === "yes" || getValue("is_active")?.toLowerCase() === "true",
        is_featured: getValue("is_featured")?.toLowerCase() === "yes" || getValue("is_featured")?.toLowerCase() === "true",
        is_new: getValue("is_new")?.toLowerCase() === "yes" || getValue("is_new")?.toLowerCase() === "true",
        errors,
        status: "pending",
      });
    }

    return products;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const products = parseCSV(content);
      if (products.length === 0) {
        toast.error("No valid products found in CSV");
        return;
      }
      setParsedProducts(products);
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setStep("importing");
    let success = 0;
    let failed = 0;

    for (let i = 0; i < parsedProducts.length; i++) {
      const product = parsedProducts[i];
      
      if (product.errors.length > 0) {
        failed++;
        product.status = "error";
        setImportProgress(((i + 1) / parsedProducts.length) * 100);
        continue;
      }

      try {
        // Find category by name
        let categoryId = null;
        if (product.category_name) {
          const category = categories.find(
            (c) => c.name.toLowerCase() === product.category_name?.toLowerCase()
          );
          categoryId = category?.id || null;
        }

        const { error } = await supabase.from("products").insert({
          sku: product.sku,
          name: product.name,
          slug: generateSlug(product.name),
          description: product.description,
          short_description: product.short_description,
          price: product.price,
          compare_at_price: product.compare_at_price,
          category_id: categoryId,
          brand: product.brand || "KORR",
          material: product.material,
          is_active: product.is_active || false,
          is_featured: product.is_featured || false,
          is_new: product.is_new || true,
        });

        if (error) {
          product.errors.push(error.message);
          product.status = "error";
          failed++;
        } else {
          product.status = "success";
          success++;
        }
      } catch (err: any) {
        product.errors.push(err.message);
        product.status = "error";
        failed++;
      }

      setImportProgress(((i + 1) / parsedProducts.length) * 100);
    }

    setImportStats({ success, failed });
    setStep("complete");
  };

  const downloadTemplate = () => {
    const headers = ["sku", "name", "description", "short_description", "price", "compare_at_price", "category", "brand", "material", "is_active", "is_featured", "is_new"];
    const exampleRow = ["KORR-SAMPLE-001", "Sample Product", "Product description here", "Short description", "49.99", "59.99", "Running", "KORR", "100% Polyester", "Yes", "No", "Yes"];
    
    const csvContent = [headers, exampleRow]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "product-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const validProducts = parsedProducts.filter((p) => p.errors.length === 0);
  const invalidProducts = parsedProducts.filter((p) => p.errors.length > 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import products into your catalog.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6">
            <div
              className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
              <p className="text-muted-foreground mb-4">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Need a template?</p>
                  <p className="text-sm text-muted-foreground">
                    Download our CSV template with the correct columns
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg flex-1">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">{validProducts.length} Valid</p>
                  <p className="text-sm text-green-700">Ready to import</p>
                </div>
              </div>
              {invalidProducts.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg flex-1">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">{invalidProducts.length} Invalid</p>
                    <p className="text-sm text-red-700">Will be skipped</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedProducts.slice(0, 20).map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {product.errors.length === 0 ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Invalid</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku || "-"}</TableCell>
                      <TableCell>{product.name || "-"}</TableCell>
                      <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-destructive">
                        {product.errors.join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {parsedProducts.length > 20 && (
              <p className="text-sm text-muted-foreground text-center">
                Showing first 20 of {parsedProducts.length} products
              </p>
            )}
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 space-y-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-lg font-medium">Importing products...</p>
              <p className="text-muted-foreground">Please wait while we process your data</p>
            </div>
            <Progress value={importProgress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {Math.round(importProgress)}% complete
            </p>
          </div>
        )}

        {step === "complete" && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <div>
              <p className="text-lg font-medium">Import Complete!</p>
              <p className="text-muted-foreground">
                Successfully imported {importStats.success} products
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{importStats.success}</p>
                <p className="text-sm text-green-700">Imported</p>
              </div>
              {importStats.failed > 0 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{importStats.failed}</p>
                  <p className="text-sm text-red-700">Failed</p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={resetDialog}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={validProducts.length === 0}>
                Import {validProducts.length} Products
              </Button>
            </>
          )}
          {step === "complete" && (
            <Button onClick={() => { handleClose(false); onSuccess(); }}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
