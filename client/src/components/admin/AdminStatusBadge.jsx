import React from 'react';
import Badge from '../ui/Badge';
import { CheckCircle2, Clock, AlertTriangle, AlertCircle, ShieldAlert, Archive } from 'lucide-react';

export const AdminStatusBadge = ({ status, className = '' }) => {
  const normalized = (status || '').toString().toLowerCase().trim();

  switch (normalized) {
    case 'active':
      return (
        <Badge variant="success" className={`gap-1 font-medium ${className}`}>
          <CheckCircle2 className="w-3 h-3" />
          Active
        </Badge>
      );

    case 'inactive':
      return (
        <Badge variant="neutral" className={`gap-1 font-medium ${className}`}>
          <AlertCircle className="w-3 h-3" />
          Inactive
        </Badge>
      );

    case 'published':
      return (
        <Badge variant="success" className={`gap-1 font-medium ${className}`}>
          <CheckCircle2 className="w-3 h-3" />
          Published
        </Badge>
      );

    case 'draft':
      return (
        <Badge variant="warning" className={`gap-1 font-medium ${className}`}>
          <Clock className="w-3 h-3" />
          Draft
        </Badge>
      );

    case 'archived':
      return (
        <Badge variant="neutral" className={`gap-1 font-medium ${className}`}>
          <Archive className="w-3 h-3" />
          Archived
        </Badge>
      );

    case 'compliant':
      return (
        <Badge variant="success" className={`gap-1 font-medium ${className}`}>
          <CheckCircle2 className="w-3 h-3" />
          Compliant
        </Badge>
      );

    case 'due_soon':
      return (
        <Badge variant="warning" className={`gap-1 font-medium ${className}`}>
          <Clock className="w-3 h-3" />
          Due Soon
        </Badge>
      );

    case 'overdue':
      return (
        <Badge variant="danger" className={`gap-1 font-medium ${className}`}>
          <AlertTriangle className="w-3 h-3" />
          Overdue
        </Badge>
      );

    case 'in_progress':
      return (
        <Badge variant="info" className={`gap-1 font-medium ${className}`}>
          <Clock className="w-3 h-3" />
          In Progress
        </Badge>
      );

    case 'not_started':
      return (
        <Badge variant="neutral" className={`gap-1 font-medium ${className}`}>
          <Clock className="w-3 h-3" />
          Not Started
        </Badge>
      );

    case 'expired':
      return (
        <Badge variant="danger" className={`gap-1 font-medium ${className}`}>
          <AlertTriangle className="w-3 h-3" />
          Expired
        </Badge>
      );

    case 'revoked':
      return (
        <Badge variant="danger" className={`gap-1 font-medium bg-rose-900/10 text-rose-700 dark:text-rose-400 ${className}`}>
          <ShieldAlert className="w-3 h-3" />
          Revoked
        </Badge>
      );

    default:
      return (
        <Badge variant="neutral" className={`capitalize font-medium ${className}`}>
          {status || 'Unknown'}
        </Badge>
      );
  }
};

export default AdminStatusBadge;
