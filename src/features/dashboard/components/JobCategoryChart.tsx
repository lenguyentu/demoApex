import { useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

export default function JobCategoryChart() {
  const [chartData] = useState({
    labels: ['IT', 'Marketing', 'Sales'],
    datasets: [{ label: 'Jobs', data: [20, 15, 10], backgroundColor: 'rgba(59, 130, 246, 0.5)' }]
  });

  return (
    <div className="h-64">
      <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} />
    </div>
  );
}
