import type { LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: string | LucideIcon; // Allow string (old way) or Component
  color: 'brand' | 'emerald' | 'orange' | 'amber' | 'cyan' | 'violet';
  loading?: boolean;
  formatValue?: (value: number) => string;
}

export default function StatCard({ title, value, icon, color, loading = false, formatValue }: StatCardProps) {
  const colorClasses = {
    brand: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    amber: 'bg-amber-50 text-amber-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    violet: 'bg-violet-50 text-violet-600'
  };

  const iconClasses = {
    brand: 'bg-blue-100',
    emerald: 'bg-emerald-100',
    orange: 'bg-orange-100',
    amber: 'bg-amber-100',
    cyan: 'bg-cyan-100',
    violet: 'bg-violet-100'
  };

  // Helper to render icon dynamically if it's a string, or as component
  const renderIcon = () => {
      if (typeof icon === 'string') {
          // Map common FA icons to Lucide if possible, or try to find in Icons
          const pascalCase = icon.charAt(0).toUpperCase() + icon.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const IconComponent = (Icons as any)[pascalCase] || Icons.HelpCircle; 
          return <IconComponent className={`w-5 h-5 ${colorClasses[color]}`} />;
      }
      const IconComponent = icon as LucideIcon;
      return <IconComponent className={`w-5 h-5 ${colorClasses[color]}`} />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mt-2"></div>
          ) : (
            <p className="text-2xl font-semibold mt-2">
              {formatValue ? formatValue(value) : value.toLocaleString()}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${iconClasses[color]}`}>
           {renderIcon()}
        </div>
      </div>
    </div>
  );
}
