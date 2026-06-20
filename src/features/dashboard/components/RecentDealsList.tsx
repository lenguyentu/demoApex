import { useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function RecentDealsList({ selectedUserId: _selectedUserId }: { selectedUserId?: string }) {
    const [deals] = useState([
        { id: '1', client_name: 'Client A', total_with_tax: 5000, created_at: '2023-01-01' }
    ]);
  
    return (
      <div className="space-y-4">
        {deals.map(deal => (
          <div key={deal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div>
              <h4 className="font-medium text-gray-900">{deal.client_name}</h4>
              <p className="text-sm text-gray-600">
                {deal.total_with_tax.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(deal.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    );
}
