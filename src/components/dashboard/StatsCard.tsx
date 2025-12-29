'use client';

interface StatsCardProps {
  title: string;
  value: number;
  subtitle?: string;
  color: string;
  icon?: string;
}

export function StatsCard({ title, value, subtitle, color, icon }: StatsCardProps) {
  return (
    <div className={`${color} rounded-lg p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-white/70 text-sm mt-1">{subtitle}</p>}
        </div>
        {icon && <span className="text-4xl opacity-50">{icon}</span>}
      </div>
    </div>
  );
}
