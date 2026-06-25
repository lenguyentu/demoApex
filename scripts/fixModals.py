import os

# 1. Revert CustomerHeader.tsx
header_path = r"d:\apex_internal\demoApex\src\features\bd\components\CustomerHeader.tsx"
with open(header_path, "r", encoding="utf-8") as f:
    header_content = f.read()

# I will replace my added code with the original code
header_content = header_content.replace(
    'import { useState } from "react";\nimport { MockAddCustomerModal } from "./MockAddCustomerModal";',
    'import { useNavigate } from "react-router-dom";'
)
header_content = header_content.replace(
    "const [isAddModalOpen, setIsAddModalOpen] = useState(false);",
    "const navigate = useNavigate();"
)
header_content = header_content.replace(
    "onClick={() => setIsAddModalOpen(true)}",
    "onClick={() => navigate('/tables/clients/new')}"
)
header_content = header_content.replace(
    "      <MockAddCustomerModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />\n    </div>\n  );\n};",
    "    </div>\n  );\n};"
)
with open(header_path, "w", encoding="utf-8") as f:
    f.write(header_content)

# Delete MockAddCustomerModal
try:
    os.remove(r"d:\apex_internal\demoApex\src\features\bd\components\MockAddCustomerModal.tsx")
except OSError:
    pass


# 2. Revert DebtTrackingPage.tsx
debt_path = r"d:\apex_internal\demoApex\src\features\sales\pages\DebtTrackingPage.tsx"
with open(debt_path, "r", encoding="utf-8") as f:
    debt_content = f.read()

debt_content = debt_content.replace(
    "import { Plus } from 'lucide-react';\nimport { MockAddDebtModal } from '../components/MockAddDebtModal';\nimport { DebtTable }",
    "import { DebtTable }"
)
debt_content = debt_content.replace(
    "const [exporting, setExporting] = useState(false);\n  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);",
    "const [exporting, setExporting] = useState(false);"
)
debt_content = debt_content.replace(
    '<div className="flex items-center gap-2">\n          <button onClick={() => setIsAddDebtOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm text-sm font-medium mr-2"><Plus size={16} /> Tạo công nợ</button>',
    '<div className="flex items-center gap-2">'
)
debt_content = debt_content.replace(
    "      <MockAddDebtModal isOpen={isAddDebtOpen} onClose={() => setIsAddDebtOpen(false)} />\n    </div>\n  );\n}",
    "    </div>\n  );\n}"
)
with open(debt_path, "w", encoding="utf-8") as f:
    f.write(debt_content)


# 3. Modify MockAddDebtModal for ProcessList
mock_debt_modal = """import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidateName?: string;
  jobTitle?: string;
}

export const MockAddDebtModal = ({ isOpen, onClose, candidateName, jobTitle }: Props) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Tạo công nợ từ Process</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
             <p><strong>Candidate:</strong> {candidateName || 'N/A'}</p>
             <p><strong>Job:</strong> {jobTitle || 'N/A'}</p>
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


# 4. Inject Create Debt into ProcessList.tsx
process_list_path = r"d:\apex_internal\demoApex\src\features\processes\components\ProcessList.tsx"
with open(process_list_path, "r", encoding="utf-8") as f:
    process_content = f.read()

if "CircleDollarSign" not in process_content:
    process_content = process_content.replace(
        "import { Eye, FileText, History, MessageCircle, Trash2, Calendar, MessageSquareText } from 'lucide-react';",
        "import { Eye, FileText, History, MessageCircle, Trash2, Calendar, MessageSquareText, CircleDollarSign } from 'lucide-react';"
    )
    process_content = process_content.replace(
        "import { PERMISSIONS } from '../../auth/constants';",
        "import { PERMISSIONS } from '../../auth/constants';\nimport { MockAddDebtModal } from '../../sales/components/MockAddDebtModal';"
    )
    process_content = process_content.replace(
        "const [isDeleting, setIsDeleting] = useState(false);",
        "const [isDeleting, setIsDeleting] = useState(false);\n  const [debtProcess, setDebtProcess] = useState<Process | null>(null);"
    )
    
    # Find action column delete button to insert right before it
    action_html = """
                      {/* Schedule - View client events */}
                      <button
"""
    debt_btn = """                      {/* Create Debt */}
                      <button
                        onClick={() => setDebtProcess(process)}
                        className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        title="Tạo công nợ (Create Debt)"
                      >
                        <CircleDollarSign size={14} />
                      </button>

"""
    process_content = process_content.replace(action_html, debt_btn + action_html)
    
    # Add modal
    process_content = process_content.replace(
        "    </>\n  );\n}",
        """      <MockAddDebtModal 
        isOpen={!!debtProcess} 
        onClose={() => setDebtProcess(null)} 
        candidateName={debtProcess?.candidate?.name}
        jobTitle={debtProcess?.job?.position_title}
      />
    </>
  );
}"""
    )
    
    with open(process_list_path, "w", encoding="utf-8") as f:
        f.write(process_content)
