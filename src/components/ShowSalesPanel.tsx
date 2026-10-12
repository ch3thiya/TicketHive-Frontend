import React, { useCallback, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../common/problemDetails';
import {
  buildCategoryRows,
  fetchShowSales,
  formatMoney,
  type DashboardCategory,
  type ShowSales,
} from '../common/salesApi';

interface ShowSalesPanelProps {
  showId: string;
  // Names and capacities the dashboard already has for this show.
  categories: DashboardCategory[];
}

export const ShowSalesPanel: React.FC<ShowSalesPanelProps> = ({ showId, categories }) => {
  const { apiFetch } = useAuth();
  const [open, setOpen] = useState(false);
  const [sales, setSales] = useState<ShowSales | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always a fresh read: the figures are live, so opening or refreshing never reuses old numbers.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSales(await fetchShowSales(apiFetch, showId));
    } catch (err) {
      setSales(null);
      setError(err instanceof ApiError ? err.message : 'Sales could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, showId]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void load();
  };

  const rows = sales ? buildCategoryRows(categories, sales) : [];
  const totalCapacity = categories.reduce((sum, category) => sum + category.capacity, 0);

  return (
    <div className="flex flex-col gap-2 border-t border-ink-gray-30 pt-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold text-ink-gray-70">Sales</span>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="text-xs font-bold text-brand-blue hover:text-[#1a1a5b] cursor-pointer py-1"
        >
          {open ? 'Hide sales' : 'View sales'}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-3" aria-label="Show sales">
          {loading && !sales && <p role="status" className="text-[12px] text-ink-gray-70">Loading sales…</p>}

          {error && (
            <div role="alert" className="flex flex-col gap-1.5 bg-red-50 border-2 border-red-500 rounded-xl p-3 text-[#FF3B3B] text-xs font-medium">
              <span>{error}</span>
              <button type="button" onClick={() => void load()} className="self-start font-bold underline cursor-pointer">
                Try again
              </button>
            </div>
          )}

          {sales && (
            <>
              {sales.ticketsSold === 0 && (
                <p role="status" className="text-[12px] text-ink-gray-70">
                  No tickets have been sold for this show yet. Sales will appear here as orders are confirmed.
                </p>
              )}

              <dl className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-brand-white border-2 border-ink-black rounded-xl p-2">
                  <dt className="text-[11px] font-bold text-ink-gray-70">Tickets sold</dt>
                  <dd className="font-heading font-extrabold text-base text-ink-black">
                    {sales.ticketsSold.toLocaleString()}
                    {totalCapacity > 0 && <span className="text-[11px] font-bold text-ink-gray-70"> of {totalCapacity.toLocaleString()}</span>}
                  </dd>
                </div>
                <div className="bg-brand-white border-2 border-ink-black rounded-xl p-2">
                  <dt className="text-[11px] font-bold text-ink-gray-70">Revenue</dt>
                  <dd className="font-heading font-extrabold text-base text-ink-black">{formatMoney(sales.revenue, sales.currency)}</dd>
                </div>
                <div className="bg-brand-white border-2 border-ink-black rounded-xl p-2">
                  <dt className="text-[11px] font-bold text-ink-gray-70">Entered</dt>
                  <dd className="font-heading font-extrabold text-base text-ink-black">
                    {sales.ticketsUsed.toLocaleString()}
                    <span className="text-[11px] font-bold text-ink-gray-70"> of {sales.ticketsSold.toLocaleString()}</span>
                  </dd>
                </div>
              </dl>

              <div className="overflow-x-auto">
                <table className="w-full text-[12px] text-ink-black">
                  <caption className="sr-only">Sales by ticket category</caption>
                  <thead>
                    <tr className="text-left text-ink-gray-70">
                      <th scope="col" className="py-1 pr-2 font-bold">Category</th>
                      <th scope="col" className="py-1 pr-2 font-bold">Sold</th>
                      <th scope="col" className="py-1 pr-2 font-bold">Revenue</th>
                      <th scope="col" className="py-1 font-bold">Entered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.key} className="border-t border-ink-gray-30">
                        <th scope="row" className="py-1 pr-2 text-left font-bold">{row.name}</th>
                        <td className="py-1 pr-2">
                          {row.sold.toLocaleString()}
                          {row.capacity !== null && <span className="text-ink-gray-70"> / {row.capacity.toLocaleString()}</span>}
                        </td>
                        <td className="py-1 pr-2">{formatMoney(row.revenue, sales.currency)}</td>
                        <td className="py-1">{row.used.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-ink-gray-70">Updated {new Date(sales.asOf).toLocaleTimeString()}</span>
                <button
                  type="button"
                  onClick={() => void load()}
                  disabled={loading}
                  className="text-xs font-bold text-brand-blue cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
