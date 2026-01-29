import { supabase } from '@/integrations/supabase/client';

export function requireCompanyId(company_id: string | null | undefined): string {
  if (!company_id) {
    throw new Error('Missing company_id in context');
  }
  return company_id;
}

export function toISODateOnly(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export { supabase };
