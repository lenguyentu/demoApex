import { useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement
} from 'chart.js';
import { Pie as ChartJSPie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

interface CandidateStatusChartProps {
    selectedUserId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function CandidateStatusChart({ selectedUserId: _selectedUserId }: CandidateStatusChartProps) {
  const [data] = useState({
    labels: ['New', 'Interview', 'Offer', 'Hired'],
    datasets: [{ data: [10, 5, 2, 1], backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'] }]
  });
  const [loading] = useState(false);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="h-64">
      <ChartJSPie 
        data={data}
        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }}
      />
    </div>
  );
}
