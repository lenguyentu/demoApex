import { TrendingUp } from 'lucide-react';

interface RevenueRow {
  id: number;
  candidate: string;
  position: string;
  client: string;
  salary: number;
  rate: number;
  bill: number;
}

interface Props {
  revenues: RevenueRow[];
  setRevenues: (val: RevenueRow[] | ((prev: RevenueRow[]) => RevenueRow[])) => void;
}

export default function RevenueSection({ revenues, setRevenues }: Props) {
  const addRow = () => {
    setRevenues([...revenues, { 
      id: Date.now(), 
      candidate: '', 
      position: '', 
      client: '', 
      salary: 0, 
      rate: 0, 
      bill: 0 
    }]);
  };

  const updateRow = (id: number, field: string, value: any) => {
    setRevenues((prev: RevenueRow[]) => prev.map((r: RevenueRow) => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'salary' || field === 'rate') {
        updated.bill = (updated.salary || 0) * (updated.rate || 0);
      }
      return updated;
    }));
  };

  const removeRow = (id: number) => {
    if (revenues.length > 1) {
      setRevenues((prev: RevenueRow[]) => prev.filter((r: RevenueRow) => r.id !== id));
    }
  };

  const totalBill = revenues.reduce((sum, r) => sum + (r.bill || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-pink-50 to-rose-50 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp size={18} className="text-pink-600" />
          7. Revenue Tracker
        </h2>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {revenues.map((rev) => (
            <div key={rev.id} className="p-3 border border-gray-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={rev.candidate}
                  onChange={(e) => updateRow(rev.id, 'candidate', e.target.value)}
                  placeholder="Tên ứng viên"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-semibold focus:ring-2 focus:ring-brand-500"
                />
                <button
                  onClick={() => removeRow(rev.id)}
                  className="ml-2 text-red-400 hover:text-red-600 text-xs"
                  disabled={revenues.length === 1}
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={rev.position}
                  onChange={(e) => updateRow(rev.id, 'position', e.target.value)}
                  placeholder="Vị trí"
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-brand-500"
                />
                <input
                  type="text"
                  value={rev.client}
                  onChange={(e) => updateRow(rev.id, 'client', e.target.value)}
                  placeholder="Khách hàng"
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Lương</label>
                  <input
                    type="number"
                    value={rev.salary || ''}
                    onChange={(e) => updateRow(rev.id, 'salary', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Rate</label>
                  <input
                    type="number"
                    value={rev.rate || ''}
                    onChange={(e) => updateRow(rev.id, 'rate', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    step="0.1"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Bill</label>
                  <div className="px-2 py-1 bg-green-50 rounded text-xs font-bold text-green-600 flex items-center justify-end">
                    {(Number(rev.bill) || 0).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addRow}
          className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-colors text-xs font-semibold text-gray-600 hover:text-pink-600"
        >
          + Thêm ứng viên
        </button>

        <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">TỔNG REVENUE DỰ KIẾN</span>
            <span className="text-base font-black text-green-600">{totalBill.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
