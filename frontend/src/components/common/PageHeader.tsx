import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary-600',
  actions,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-ink-border shadow-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={`flex-shrink-0 ${iconColor}`}>
            <Icon className="w-8 h-8" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="text-sm text-ink-muted mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};
