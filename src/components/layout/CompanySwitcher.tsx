// =====================================================
// COMPANY SWITCHER - MULTI-TENANCY UI
// Allows switching between tenant companies
// =====================================================

import { Building2, ChevronDown, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useTenant } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';

export function CompanySwitcher() {
  const { currentCompany, companies, switchCompany, isLoading } = useTenant();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-2 h-auto hover:bg-primary/10 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Building2 className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-foreground leading-tight">
              {currentCompany.name_ar}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {currentCompany.country} • {currentCompany.currency}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-72 bg-card border border-border shadow-lg z-50"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          تبديل الشركة (Multi-Tenancy Demo)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => switchCompany(company.id)}
            className={cn(
              "flex items-center justify-between gap-3 py-3 cursor-pointer",
              company.id === currentCompany.id && "bg-primary/10"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                company.id === currentCompany.id 
                  ? "bg-primary text-white" 
                  : "bg-muted text-muted-foreground"
              )}>
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">
                  {company.name_ar}
                </span>
                <span className="text-xs text-muted-foreground">
                  {company.name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                VAT {company.vat_rate}%
              </Badge>
              {company.id === currentCompany.id && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-2 text-xs text-muted-foreground text-center">
          💡 هذا يحاكي عزل البيانات الكامل (RLS)
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
