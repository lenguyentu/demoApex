import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string; // e.g., "bg-blue-100 text-blue-600"
}

export const StatsCard = ({ title, value, icon: Icon, colorClass }: StatsCardProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${colorClass}`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
    </div>
  );
};
