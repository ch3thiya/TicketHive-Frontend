// Typed client for the identity service's admin organizer endpoints: list organizers and
// suspend or reinstate them. All calls go through the authenticated fetch from AuthContext.

import { toApiError } from './problemDetails';

export type OrganizerAccountStatus = 'approved' | 'suspended';

export interface AdminOrganizer {
  accountId: string;
  email: string;
  fullName: string;
  createdAt: string;
  organizationName: string;
  businessEmail: string;
  eventType: string;
  status: OrganizerAccountStatus;
  suspendedAt: string | null;
  suspensionReason: string | null;
}

export interface OrganizerStatusChange {
  organizerId: string;
  status: OrganizerAccountStatus;
  repeated: boolean;
}

export const MAX_SUSPENSION_REASON_LENGTH = 500;

const IDENTITY_API_URL = import.meta.env.VITE_IDENTITY_API_URL || '';
const BASE = `${IDENTITY_API_URL}/api/identity/organizer-requests`;

type ApiFetch = (url: string, options?: RequestInit) => Promise<Response>;

export async function fetchOrganizers(apiFetch: ApiFetch): Promise<AdminOrganizer[]> {
  const res = await apiFetch(`${BASE}/organizers`);
  if (!res.ok) {
    throw await toApiError(res, 'Failed to load organizers.');
  }
  return (await res.json()) as AdminOrganizer[];
}

export async function suspendOrganizer(apiFetch: ApiFetch, organizerId: string, reason: string): Promise<OrganizerStatusChange> {
  const res = await apiFetch(`${BASE}/organizers/${organizerId}/suspend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    throw await toApiError(res, 'Failed to suspend the organizer.');
  }
  return (await res.json()) as OrganizerStatusChange;
}

export async function reinstateOrganizer(apiFetch: ApiFetch, organizerId: string): Promise<OrganizerStatusChange> {
  const res = await apiFetch(`${BASE}/organizers/${organizerId}/reinstate`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw await toApiError(res, 'Failed to reinstate the organizer.');
  }
  return (await res.json()) as OrganizerStatusChange;
}