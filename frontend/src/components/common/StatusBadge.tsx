import React from 'react';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const normalizedStatus = status.toUpperCase().trim();

  let bgClass = 'bg-slate-100';
  let textClass = 'text-slate-600';
  let dotClass = 'bg-slate-400';
  let showDot = true;

  if (['APPROVED', 'PRESENT', 'ACTIVE', 'RESOLVED', 'CLOSED'].includes(normalizedStatus)) {
    bgClass = 'bg-success-50';
    textClass = 'text-success-600';
    dotClass = 'bg-success-500';
  } else if (['PENDING', 'NEW', 'ASSIGNED'].includes(normalizedStatus)) {
    bgClass = 'bg-warn-50';
    textClass = 'text-warn-600';
    dotClass = 'bg-amber-500'; // Amber dot as requested
  } else if (['REJECTED', 'NOT_VERIFIED', 'SUSPENDED', 'ABSENT'].includes(normalizedStatus)) {
    bgClass = 'bg-danger-50';
    textClass = 'text-danger-600';
    dotClass = 'bg-red-500'; // Red dot as requested
  } else if (['IN PROGRESS', 'IN_PROGRESS'].includes(normalizedStatus)) {
    bgClass = 'bg-primary-50';
    textClass = 'text-primary-600';
    dotClass = 'bg-primary-500'; // Primary dot
  } else if (['INACTIVE'].includes(normalizedStatus)) {
    bgClass = 'bg-slate-100';
    textClass = 'text-slate-600';
    dotClass = 'bg-gray-400'; // Gray dot
  } else if (['USED', 'EXPIRED'].includes(normalizedStatus)) {
    bgClass = 'bg-slate-100';
    textClass = 'text-slate-500';
    showDot = false;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${bgClass} ${textClass} ${sizeClasses[size]}`}
    >
      {showDot && (
        <span className={`rounded-full ${dotClass} ${dotSizes[size]}`} aria-hidden="true" />
      )}
      {status}
    </span>
  );
};
