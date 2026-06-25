import os

# 1. Create MockAddCustomerModal
mock_customer_modal = """import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MockAddCustomerModal = ({ isOpen, onClose }: Props) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Add New Customer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>
        <div className="p-4 space-y-4 text-left">
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Company Name <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. FPT Software" />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Industry</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. IT, Finance..." />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Priority</label>
            <select className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-500">
              <option>Normal</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
          <button onClick={() => { toast.success('Customer created successfully (Mock)'); onClose(); }} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">Save Customer</button>
        </div>
      </div>
    </div>
  );
};
"""

with open(r"d:\apex_internal\demoApex\src\features\bd\components\MockAddCustomerModal.tsx", "w", encoding="utf-8") as f:
    f.write(mock_customer_modal)

# Update CustomerHeader.tsx to use MockAddCustomerModal
header_path = r"d:\apex_internal\demoApex\src\features\bd\components\CustomerHeader.tsx"
with open(header_path, "r", encoding="utf-8") as f:
    header_content = f.read()

if "MockAddCustomerModal" not in header_content:
    header_content = header_content.replace(
        'import { useNavigate } from "react-router-dom";',
        'import { useState } from "react";\nimport { MockAddCustomerModal } from "./MockAddCustomerModal";'
    )
    header_content = header_content.replace(
        "const navigate = useNavigate();",
        "const [isAddModalOpen, setIsAddModalOpen] = useState(false);"
    )
    header_content = header_content.replace(
        "onClick={() => navigate('/tables/clients/new')}",
        "onClick={() => setIsAddModalOpen(true)}"
    )
    header_content = header_content.replace(
        "    </div>\n  );\n};",
        "      <MockAddCustomerModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />\n    </div>\n  );\n};"
    )
    with open(header_path, "w", encoding="utf-8") as f:
        f.write(header_content)


# 2. Create MockAddDebtModal
mock_debt_modal = """import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MockAddDebtModal = ({ isOpen, onClose }: Props) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Tạo công nợ mới (Create Debt)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Khách hàng <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-500" placeholder="VD: Techcombank" />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Số tiền công nợ (VND) <span className="text-red-500">*</span></label>
            <input type="number" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-500" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Ngày dự kiến thu</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium text-gray-700">Ghi chú</label>
            <textarea className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-500" rows={3} placeholder="..."></textarea>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Hủy</button>
          <button onClick={() => { toast.success('Tạo công nợ thành công (F5 để reset)'); onClose(); }} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">Lưu công nợ</button>
        </div>
      </div>
    </div>
  );
};
"""

with open(r"d:\apex_internal\demoApex\src\features\sales\components\MockAddDebtModal.tsx", "w", encoding="utf-8") as f:
    f.write(mock_debt_modal)

# Update DebtTrackingPage.tsx to include the button and modal
debt_path = r"d:\apex_internal\demoApex\src\features\sales\pages\DebtTrackingPage.tsx"
with open(debt_path, "r", encoding="utf-8") as f:
    debt_content = f.read()

if "MockAddDebtModal" not in debt_content:
    debt_content = debt_content.replace(
        "import { DebtTable }",
        "import { Plus } from 'lucide-react';\nimport { MockAddDebtModal } from '../components/MockAddDebtModal';\nimport { DebtTable }"
    )
    
    # Add state
    debt_content = debt_content.replace(
        "const [exporting, setExporting] = useState(false);",
        "const [exporting, setExporting] = useState(false);\n  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);"
    )
    
    # Add button to Header
    # find `<div className="flex items-center gap-2">`
    debt_content = debt_content.replace(
        '<div className="flex items-center gap-2">',
        '<div className="flex items-center gap-2">\n          <button onClick={() => setIsAddDebtOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm text-sm font-medium mr-2"><Plus size={16} /> Tạo công nợ</button>'
    )
    
    # Add Modal
    debt_content = debt_content.replace(
        "    </div>\n  );\n}",
        "      <MockAddDebtModal isOpen={isAddDebtOpen} onClose={() => setIsAddDebtOpen(false)} />\n    </div>\n  );\n}"
    )

    with open(debt_path, "w", encoding="utf-8") as f:
        f.write(debt_content)

