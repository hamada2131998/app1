import { useCallback, useEffect, useState } from 'react';
import { getSetupStatus, type SetupStatus } from '@/adapters/setup.adapter';

export function useSetupStatus(companyId?: string | null) {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!companyId) {
      setStatus(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getSetupStatus(companyId);
      setStatus(data);
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل حالة الإعداد');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  return { status, loading, error, refresh: loadStatus };
}
