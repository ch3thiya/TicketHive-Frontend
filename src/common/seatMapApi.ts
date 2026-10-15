// Typed client for Catalog's seat map endpoints: organizers request a seat map for a show and
// admins define, enable or reject it. All calls use the authenticated fetch from AuthContext.
// The backend is the authority on validation; the helpers below only give admins live feedback.

import { toApiError } from './problemDetails';

export type SeatMapRequestStatus = 'Pending' | 'Completed' | 'Rejected';
export type SeatLayoutStatus = 'Draft' | 'Enabled' | 'Superseded';

export interface SeatMapRequest {
  id: string;
  showId: string;
  organizerId: string;
  description: string;
  status: SeatMapRequestStatus;
  rejectionReason: string | null;
  requestedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
}

export interface SeatMapRequestSummary {
  request: SeatMapRequest;
  eventName: string;
  showDate: string;
  showTime: string;
  ticketTotal: number;
}

export interface SeatLayoutSection {
  name: string;
  categoryId: string;
  rows: number;
  seatsPerRow: number;
}

export interface SeatLayout {
  id: string;
  showId: string;
  requestId: string;
  version: number;
  status: SeatLayoutStatus;
  spec: { sections: SeatLayoutSection[] };
  seatCount: number;
  createdBy: string;
  createdAt: string;
  enabledAt: string | null;
}

export interface SeatMapCategory {
  id: string;
  name: string;
  price: number;
  capacity: number;
}

export interface SeatMapDetail {
  request: SeatMapRequest;
  eventName: string;
  showDate: string;
  showTime: string;
  seatingMode: 'GA' | 'Seated';
  venueId: string | null;
  categories: SeatMapCategory[];
  layouts: SeatLayout[];
}

export const MAX_SEAT_MAP_DESCRIPTION_LENGTH = 1000;
export const MAX_SEAT_MAP_REJECTION_LENGTH = 500;

const CATALOG_API_URL = import.meta.env.VITE_CATALOG_API_URL || '';
const BASE = `${CATALOG_API_URL}/api/catalog`;

type ApiFetch = (url: string, options?: RequestInit) => Promise<Response>;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function read<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    throw await toApiError(res, fallback);
  }
  return (await res.json()) as T;
}

// ---- organizer ----

export async function fetchSeatMapRequests(apiFetch: ApiFetch, showId: string): Promise<SeatMapRequest[]> {
  return read(await apiFetch(`${BASE}/shows/${showId}/seat-map-requests`), 'Failed to load the seat map status.');
}

export async function requestSeatMap(apiFetch: ApiFetch, showId: string, description: string): Promise<SeatMapRequest> {
  return read(
    await apiFetch(`${BASE}/shows/${showId}/seat-map-requests`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ description }),
    }),
    'Failed to submit the seat map request.',
  );
}

// ---- admin ----

export async function fetchAdminSeatMapRequests(apiFetch: ApiFetch, status?: SeatMapRequestStatus): Promise<SeatMapRequestSummary[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return read(await apiFetch(`${BASE}/admin/seat-map-requests${query}`), 'Failed to load seat map requests.');
}

export async function fetchSeatMapDetail(apiFetch: ApiFetch, requestId: string): Promise<SeatMapDetail> {
  return read(await apiFetch(`${BASE}/admin/seat-map-requests/${requestId}`), 'Failed to load the seat map request.');
}

export async function createSeatLayoutDraft(apiFetch: ApiFetch, requestId: string, sections: SeatLayoutSection[]): Promise<SeatLayout> {
  return read(
    await apiFetch(`${BASE}/admin/seat-map-requests/${requestId}/layouts`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ sections }),
    }),
    'Failed to save the layout.',
  );
}

export async function enableSeatLayout(apiFetch: ApiFetch, layoutId: string): Promise<SeatLayout> {
  return read(await apiFetch(`${BASE}/admin/seat-layouts/${layoutId}/enable`, { method: 'POST' }), 'Failed to enable the layout.');
}

export async function deleteSeatLayout(apiFetch: ApiFetch, layoutId: string): Promise<void> {
  const response = await apiFetch(`${BASE}/admin/seat-layouts/${layoutId}`, { method: 'DELETE' });
  if (!response.ok) throw await toApiError(response, 'Failed to delete the seat map.');
}

export async function rejectSeatMapRequest(apiFetch: ApiFetch, requestId: string, reason: string): Promise<SeatMapRequest> {
  return read(
    await apiFetch(`${BASE}/admin/seat-map-requests/${requestId}/reject`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ reason }),
    }),
    'Failed to reject the request.',
  );
}

// ---- live layout feedback (mirrors the backend rules; the server stays authoritative) ----

export function sectionSeatCount(section: Pick<SeatLayoutSection, 'rows' | 'seatsPerRow'>): number {
  const rows = Number.isFinite(section.rows) ? Math.max(0, Math.floor(section.rows)) : 0;
  const perRow = Number.isFinite(section.seatsPerRow) ? Math.max(0, Math.floor(section.seatsPerRow)) : 0;
  return rows * perRow;
}

export interface CategoryCoverage {
  categoryId: string;
  name: string;
  capacity: number;
  mapped: number;
  matches: boolean;
}

export interface LayoutSummary {
  totalSeats: number;
  ticketTotal: number;
  categories: CategoryCoverage[];
  hasUnassignedSection: boolean;
  hasDuplicateName: boolean;
  matches: boolean;
}

export function summarizeLayout(sections: SeatLayoutSection[], categories: SeatMapCategory[]): LayoutSummary {
  const coverage: CategoryCoverage[] = categories.map((category) => {
    const mapped = sections
      .filter((section) => section.categoryId === category.id)
      .reduce((sum, section) => sum + sectionSeatCount(section), 0);
    return { categoryId: category.id, name: category.name, capacity: category.capacity, mapped, matches: mapped === category.capacity };
  });

  const names = sections.map((section) => section.name.trim().toLowerCase()).filter((name) => name.length > 0);
  const totalSeats = sections.reduce((sum, section) => sum + sectionSeatCount(section), 0);
  const ticketTotal = categories.reduce((sum, category) => sum + category.capacity, 0);
  const hasUnassignedSection = sections.some((section) => !section.categoryId);
  const hasDuplicateName = new Set(names).size !== names.length;
  const hasEmptyName = sections.some((section) => section.name.trim().length === 0);

  return {
    totalSeats,
    ticketTotal,
    categories: coverage,
    hasUnassignedSection,
    hasDuplicateName,
    matches:
      sections.length > 0 &&
      !hasUnassignedSection &&
      !hasDuplicateName &&
      !hasEmptyName &&
      totalSeats === ticketTotal &&
      coverage.every((category) => category.matches),
  };
}

// Row labels run A..Z, AA, AB, ... exactly as the backend generates them.
export function rowLabel(index: number): string {
  let label = '';
  for (let n = index; n >= 0; n = Math.floor(n / 26) - 1) {
    label = String.fromCharCode(65 + (n % 26)) + label;
  }
  return label;
}
