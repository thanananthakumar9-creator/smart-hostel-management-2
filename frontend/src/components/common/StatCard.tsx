import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  trend?: { value: string; positive: boolean };
  onClick?: () => void;
  link?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  onClick,
  link,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-3xl border border-ink-border shadow-card p-6 flex flex-col ${
        onClick ? 'cursor-pointer hover:shadow-card-md transition-shadow duration-200' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            {title}
          </h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-ink">{value}</span>
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                  trend.positive
                    ? 'bg-success-50 text-success-700'
                    : 'bg-danger-50 text-danger-700'
                }`}
              >
                {trend.positive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl shrink-0 ${iconBg} ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {link && (
        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">
          <span>{link}</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
};
