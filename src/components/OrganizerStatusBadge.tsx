import React from 'react';
import { Badge } from './Badge';
import type { OrganizerAccountStatus } from '../common/organizerAdminApi';

interface OrganizerStatusBadgeProps {
  status: OrganizerAccountStatus;
}

export const OrganizerStatusBadge: React.FC<OrganizerStatusBadgeProps> = ({ status }) => {
  const suspended = status === 'suspended';
  return (
    <Badge
      variant={suspended ? 'error' : 'success'}
      uppercase
      aria-label={`Account status: ${suspended ? 'suspended' : 'active'}`}
    >
      {suspended ? 'Suspended' : 'Active'}
    </Badge>
  );
};