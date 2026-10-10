// Typed client for the signed-in organizer's own account status in the catalog service.
// "suspended" means events stay readable but cannot be created, edited, published or cancelled.
// The suspension reason is never exposed to organizers.

import { toApiError } from './problemDetails';

export type OrganizerAccessStatus = 'active' | 'suspended';

interface OrganizerStatusResponse {
  status: OrganizerAccessStatus;
}

const CATALOG_API_URL = import.meta.env.VITE_CATALOG_API_URL || '';

type ApiFetch = (url: string, options?: RequestInit) => Promise<Response>;

export async function fetchOrganizerAccessStatus(apiFetch: ApiFetch): Promise<OrganizerAccessStatus> {
  const res = await apiFetch(`${CATALOG_API_URL}/api/catalog/organizer/status`);
  if (!res.ok) {
    throw await toApiError(res, 'Failed to load your account status.');
  }
  const body = (await res.json()) as OrganizerStatusResponse;
  return body.status === 'suspended' ? 'suspended' : 'active';
}