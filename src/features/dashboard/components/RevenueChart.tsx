import { useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement
} from 'chart.js';
import { Line as ChartJSLine } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function RevenueChart({ selectedUserId: _selectedUserId }: { selectedUserId?: string }) {
  const [chartData] = useState({
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{ label: 'Revenue', data: [1000, 2000, 1500], borderColor: 'rgb(59, 130, 246)', tension: 0.1 }]
  });

  return (
    <div className="h-64">
        <ChartJSLine data={chartData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} />
    </div>
  );
}
