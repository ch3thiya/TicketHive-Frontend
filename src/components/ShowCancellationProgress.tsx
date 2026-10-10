import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

interface Progress {
  salesStopped: boolean;
  orders: { totalOrders: number; refunded: number; simulated: number; processing: number; notificationsPending: number };
}

export function ShowCancellationProgress({ showId }: { showId: string }) {
  const { apiFetch } = useAuth();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await apiFetch(`${import.meta.env.VITE_CATALOG_API_URL || ''}/api/catalog/shows/${showId}/cancellation`);
        if (!response.ok) throw new Error('Unable to load cancellation progress. Retrying…');
        const next: Progress = await response.json();
        if (active) { setProgress(next); setError(''); }
      } catch (failure) { if (active) setError(failure instanceof Error ? failure.message : 'Progress unavailable. Retrying…'); }
    };
    void load();
    const timer = window.setInterval(() => { void load(); }, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [apiFetch, showId]);
  return <div className="mt-3 rounded-xl bg-slate-100 p-3 text-sm" role="status">
    <strong>Cancellation progress</strong>
    {progress ? <>
      <p>{progress.salesStopped ? 'Sales stopped; held tickets released.' : 'Stopping sales…'}</p>
      <p>{progress.orders.refunded} refunded · {progress.orders.simulated} simulated refunds · {progress.orders.processing} orders processing</p>
      <p>{progress.orders.notificationsPending} orders awaiting customer notification</p>
      {progress.orders.simulated > 0 && <p>Sandbox simulation: no money was moved.</p>}
    </> : <p>Loading…</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
