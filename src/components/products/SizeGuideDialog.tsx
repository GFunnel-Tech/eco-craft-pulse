import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Ruler } from 'lucide-react';

const SIZE_DATA = [
  { size: 'XS', chest: '32-34', waist: '26-28', hips: '34-36' },
  { size: 'S', chest: '34-36', waist: '28-30', hips: '36-38' },
  { size: 'M', chest: '38-40', waist: '32-34', hips: '40-42' },
  { size: 'L', chest: '42-44', waist: '36-38', hips: '44-46' },
  { size: 'XL', chest: '46-48', waist: '40-42', hips: '48-50' },
  { size: 'XXL', chest: '50-52', waist: '44-46', hips: '52-54' },
];

export function SizeGuideDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="text-sm p-0 h-auto">
          <Ruler className="h-4 w-4 mr-1" />
          Size Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Size Guide</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            All measurements are in inches. If you're between sizes, we recommend sizing up for a more relaxed fit.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-semibold text-foreground">Size</th>
                  <th className="text-left py-3 px-2 font-semibold text-foreground">Chest</th>
                  <th className="text-left py-3 px-2 font-semibold text-foreground">Waist</th>
                  <th className="text-left py-3 px-2 font-semibold text-foreground">Hips</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_DATA.map((row) => (
                  <tr key={row.size} className="border-b border-border/50">
                    <td className="py-3 px-2 font-medium text-foreground">{row.size}</td>
                    <td className="py-3 px-2 text-muted-foreground">{row.chest}"</td>
                    <td className="py-3 px-2 text-muted-foreground">{row.waist}"</td>
                    <td className="py-3 px-2 text-muted-foreground">{row.hips}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-foreground mb-2">How to Measure</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><strong>Chest:</strong> Measure around the fullest part of your chest.</li>
              <li><strong>Waist:</strong> Measure around your natural waistline.</li>
              <li><strong>Hips:</strong> Measure around the widest part of your hips.</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}