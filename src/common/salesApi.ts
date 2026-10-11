// Typed client for Booking's read-only show sales endpoint, plus the join with the category names
// and capacities the organizer dashboard already has. Figures are never cached on the client.

import { toApiError } from './problemDetails';

export interface SalesCategory {
  categoryId: string;
  sold: number;
  revenue: number;
  used: number;
}

export interface ShowSales {
  showId: string;
  currency: string;
  ticketsSold: number;
  revenue: number;
  ticketsUsed: number;
  categories: SalesCategory[];
  asOf: string;
}

export interface DashboardCategory {
  id?: string;
  name: string;
  capacity: number;
}

export interface CategorySalesRow {
  key: string;
  name: string;
  // Null for sales in a category the dashboard no longer lists (for example one that was replaced).
  capacity: number | null;
  sold: number;
  revenue: number;
  used: number;
}

const BOOKING_API_URL = import.meta.env.VITE_BOOKING_API_URL || '';

type ApiFetch = (url: string, options?: RequestInit) => Promise<Response>;

export async function fetchShowSales(apiFetch: ApiFetch, showId: string): Promise<ShowSales> {
  const res = await apiFetch(`${BOOKING_API_URL}/api/booking/shows/${showId}/sales`, { cache: 'no-store' });
  if (!res.ok) {
    throw await toApiError(res, 'Failed to load sales.');
  }
  return (await res.json()) as ShowSales;
}

// Every category of the show appears, with zeros where nothing has sold, so the table always
// reads sold against capacity. Sales in a category the dashboard does not know are kept, last.
export function buildCategoryRows(categories: DashboardCategory[], sales: ShowSales): CategorySalesRow[] {
  const byId = new Map(sales.categories.map((c) => [c.categoryId, c]));
  const known = new Set<string>();

  const rows: CategorySalesRow[] = categories.map((category, index) => {
    const id = category.id ?? `cat-${index}`;
    known.add(id);
    const line = byId.get(id);
    return {
      key: id,
      name: category.name,
      capacity: category.capacity,
      sold: line?.sold ?? 0,
      revenue: line?.revenue ?? 0,
      used: line?.used ?? 0,
    };
  });

  sales.categories
    .filter((line) => !known.has(line.categoryId))
    .forEach((line) => rows.push({ key: line.categoryId, name: 'Other tickets', capacity: null, sold: line.sold, revenue: line.revenue, used: line.used }));

  return rows;
}

export function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
