import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Percent } from 'lucide-react';

interface VatCalculatorProps {
  amount: number;
  includesVat: boolean;
  onVatToggle: (includes: boolean) => void;
}

const VAT_RATE = 0.15; // 15% KSA VAT

export function VatCalculator({ amount, includesVat, onVatToggle }: VatCalculatorProps) {
  const calculateVat = () => {
    if (amount <= 0) return { net: 0, vat: 0, gross: 0 };

    if (includesVat) {
      // Amount includes VAT - extract components
      const net = amount / (1 + VAT_RATE);
      const vat = amount - net;
      return { net, vat, gross: amount };
    } else {
      // Amount is net - calculate VAT to add
      const vat = amount * VAT_RATE;
      const gross = amount + vat;
      return { net: amount, vat, gross };
    }
  };

  const { net, vat, gross } = calculateVat();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-4 p-4 rounded-xl bg-accent/30 border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-primary" />
          <Label htmlFor="vat-toggle" className="font-medium">
            ضريبة القيمة المضافة (15%)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {includesVat ? 'شامل الضريبة' : 'بدون ضريبة'}
          </span>
          <Switch
            id="vat-toggle"
            checked={includesVat}
            onCheckedChange={onVatToggle}
          />
        </div>
      </div>

      {amount > 0 && (
        <div className="space-y-2 pt-3 border-t border-border/50">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">المبلغ الصافي</span>
            <span className="font-medium">{formatCurrency(net)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              ضريبة القيمة المضافة
              <Badge variant="outline" className="text-xs">15%</Badge>
            </span>
            <span className="font-medium text-primary">{formatCurrency(vat)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border/50">
            <span className="font-semibold">الإجمالي</span>
            <span className="font-bold text-lg">{formatCurrency(gross)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
