import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Category } from '@/types';
import { formatPrice, SIZES, COLORS } from '@/lib/constants';

export interface FilterState {
  categories: string[];
  priceRange: [number, number];
  sizes: string[];
  colors: string[];
  onSale: boolean;
  inStock: boolean;
}

interface ProductFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  categories: Category[];
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b border-border pb-4">
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
        {title}
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ProductFilters({ filters, onChange, categories }: ProductFiltersProps) {
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: 'categories' | 'sizes' | 'colors', value: string) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  return (
    <div className="space-y-2">
      {/* Categories */}
      {categories.length > 0 && (
        <FilterSection title="Category">
          {categories.map(category => (
            <div key={category.id} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${category.slug}`}
                checked={filters.categories.includes(category.slug)}
                onCheckedChange={() => toggleArrayFilter('categories', category.slug)}
              />
              <Label
                htmlFor={`cat-${category.slug}`}
                className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                {category.name}
              </Label>
            </div>
          ))}
        </FilterSection>
      )}

      {/* Price Range */}
      <FilterSection title="Price">
        <div className="px-1">
          <Slider
            value={filters.priceRange}
            min={0}
            max={500}
            step={10}
            onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
            className="my-4"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatPrice(filters.priceRange[0])}</span>
            <span>{formatPrice(filters.priceRange[1])}</span>
          </div>
        </div>
      </FilterSection>

      {/* Sizes */}
      <FilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map(size => (
            <button
              key={size}
              onClick={() => toggleArrayFilter('sizes', size)}
              className={cn(
                'px-3 py-1.5 text-sm border rounded-md transition-colors',
                filters.sizes.includes(size)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Colors */}
      <FilterSection title="Color">
        <div className="flex flex-wrap gap-2">
          {COLORS.map(color => (
            <button
              key={color.name}
              onClick={() => toggleArrayFilter('colors', color.name)}
              className={cn(
                'w-8 h-8 rounded-full border-2 transition-all',
                filters.colors.includes(color.name)
                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                  : 'border-border hover:border-foreground'
              )}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            >
              <span className="sr-only">{color.name}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability" defaultOpen={false}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="on-sale"
              checked={filters.onSale}
              onCheckedChange={(checked) => updateFilter('onSale', !!checked)}
            />
            <Label
              htmlFor="on-sale"
              className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            >
              On Sale
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="in-stock"
              checked={filters.inStock}
              onCheckedChange={(checked) => updateFilter('inStock', !!checked)}
            />
            <Label
              htmlFor="in-stock"
              className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            >
              In Stock
            </Label>
          </div>
        </div>
      </FilterSection>
    </div>
  );
}