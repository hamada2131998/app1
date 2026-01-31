import { supabase, requireCompanyId } from './supabaseUtils';

interface RecentTransaction {
  id: string;
  tx_type: string;
  amount: number;
  tx_date: string;
  notes?: string | null;
}

export async function getApprovalContext(params: { company_id: string; movement_id: string }) {
  const cId = requireCompanyId(params.company_id);
  const { data: movement, error } = await supabase
    .from('cash_movements')
    .select(
      'id, amount, movement_date, category_id, cost_center_id, created_by, creator:profiles!cash_movements_created_by_fkey(id, full_name)'
    )
    .eq('company_id', cId)
    .eq('id', params.movement_id)
    .single();

  if (error) throw error;

  const creatorId = movement.created_by as string;

  const { data: custody } = await supabase
    .from('custodies')
    .select('id, name')
    .eq('company_id', cId)
    .eq('user_id', creatorId)
    .eq('is_active', true)
    .maybeSingle();

  let currentBalance = 0;
  let recentTransactions: RecentTransaction[] = [];

  if (custody?.id) {
    const { data: balance } = await supabase.rpc('get_custody_balance', { p_custody_id: custody.id });
    currentBalance = Number(balance || 0);

    const { data: txs } = await supabase
      .from('custody_transactions')
      .select('id, tx_type, amount, tx_date, notes')
      .eq('custody_id', custody.id)
      .order('tx_date', { ascending: false })
      .limit(5);

    recentTransactions = (txs || []) as RecentTransaction[];
  }

  const { count } = await supabase
    .from('cash_movements')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', cId)
    .eq('created_by', creatorId)
    .eq('amount', movement.amount)
    .eq('category_id', movement.category_id)
    .eq('movement_date', movement.movement_date)
    .neq('id', movement.id);

  return {
    employeeName: (movement.creator as any)?.full_name ?? null,
    currentBalance,
    recentTransactions: recentTransactions.map((tx) => ({
      ...tx,
      label:
        tx.tx_type === 'ISSUE'
          ? 'تغذية'
          : tx.tx_type === 'SPEND'
          ? 'صرف'
          : tx.tx_type === 'RETURN'
          ? 'مرتجع'
          : tx.tx_type === 'SETTLEMENT'
          ? 'تسوية'
          : tx.tx_type,
    })),
    isDuplicate: (count || 0) > 0,
  };
}
