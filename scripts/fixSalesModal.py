import os

# 1. Revert ProcessList.tsx
process_list_path = r"d:\apex_internal\demoApex\src\features\processes\components\ProcessList.tsx"
with open(process_list_path, "r", encoding="utf-8") as f:
    process_content = f.read()

# Remove CircleDollarSign import
process_content = process_content.replace(
    "import { Eye, FileText, History, MessageCircle, Trash2, Calendar, MessageSquareText, CircleDollarSign } from 'lucide-react';",
    "import { Eye, FileText, History, MessageCircle, Trash2, Calendar, MessageSquareText } from 'lucide-react';"
)
process_content = process_content.replace(
    "import { PERMISSIONS } from '../../auth/constants';\nimport { MockAddDebtModal } from '../../sales/components/MockAddDebtModal';",
    "import { PERMISSIONS } from '../../auth/constants';"
)
process_content = process_content.replace(
    "const [isDeleting, setIsDeleting] = useState(false);\n  const [debtProcess, setDebtProcess] = useState<Process | null>(null);",
    "const [isDeleting, setIsDeleting] = useState(false);"
)

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
process_content = process_content.replace(debt_btn + action_html, action_html)

process_content = process_content.replace(
    """      <MockAddDebtModal 
        isOpen={!!debtProcess} 
        onClose={() => setDebtProcess(null)} 
        candidateName={debtProcess?.candidate?.name}
        jobTitle={debtProcess?.job?.position_title}
      />
    </>
  );
}""",
    "    </>\n  );\n}"
)

with open(process_list_path, "w", encoding="utf-8") as f:
    f.write(process_content)

# Delete MockAddDebtModal
try:
    os.remove(r"d:\apex_internal\demoApex\src\features\sales\components\MockAddDebtModal.tsx")
except OSError:
    pass

# 2. Update SaleModal to mock saving
sale_modal_path = r"d:\apex_internal\demoApex\src\features\sales\components\SaleModal.tsx"
with open(sale_modal_path, "r", encoding="utf-8") as f:
    sale_content = f.read()

# Change interface onSuccess
sale_content = sale_content.replace(
    "onSuccess: () => void;",
    "onSuccess: (mockSale?: any) => void;"
)

# Mock save logic
old_save_logic = """      if (isEdit && sale) {
        await updateSale(sale.id, salePayload);
        await updateSaleFinance(sale.id, {
          ...financePayload,
          // Nếu chuyển sang Done và chưa có paid → set = amount
          ...(status.overall === 'Done' && (sale.finance?.p1_paid_amount ?? 0) === 0 && {
            p1_paid_amount: p1Amt,
            p2_paid_amount: p2Amt,
          })
        });
        
        // Cập nhật client owner nếu assigned user thay đổi
        if (sale.client_id && assignedUserId && assignedUserId !== bdOwnerId) {
          try {
            await updateClientOwner(sale.client_id, assignedUserId);
            console.log('✅ Updated client owner to:', assignedUserId);
          } catch (err) {
            console.warn('⚠️ Failed to update client owner:', err);
            // Không throw error để không block việc update sale
          }
        }
        
        toast.success('Debt updated successfully');
      } else {
        await createSaleWithFinance(
          { ...salePayload, created_by_id: user.id },
          { 
            ...financePayload, 
            sales_id: '', 
            p1_paid_amount: status.overall === 'Done' ? p1Amt : 0, 
            p2_paid_amount: status.overall === 'Done' ? p2Amt : 0, 
            refund_amount: 0, 
            is_manual_override: false,
            created_at: new Date().toISOString()
          }
        );
        
        // Cập nhật client owner khi tạo mới sale
        const clientId = process?.client?.id || (Array.isArray(process?.client) ? process?.client[0]?.id : null);
        if (clientId && assignedUserId) {
          try {
            await updateClientOwner(clientId, assignedUserId);
            console.log('✅ Updated client owner to:', assignedUserId);
          } catch (err) {
            console.warn('⚠️ Failed to update client owner:', err);
            // Không throw error để không block việc tạo sale
          }
        }
        
        toast.success('Debt accounted successfully');
      }
      
      onSuccess();"""

new_save_logic = """      if (isEdit && sale) {
        toast.success('Debt updated successfully (Mock - F5 to reset)');
        onSuccess({ ...sale, ...salePayload, finance: { ...sale.finance, ...financePayload } });
      } else {
        toast.success('Debt accounted successfully (Mock - F5 to reset)');
        // Create a fake sale object to add to the UI temporarily
        const mockSale = {
          id: 'mock-' + Date.now(),
          ...salePayload,
          client: process?.client,
          job: process?.job,
          candidate: process?.candidate,
          finance: {
            ...financePayload,
            p1_paid_amount: status.overall === 'Done' ? p1Amt : 0,
            p2_paid_amount: status.overall === 'Done' ? p2Amt : 0,
            refund_amount: 0
          }
        };
        onSuccess(mockSale);
      }"""

sale_content = sale_content.replace(old_save_logic, new_save_logic)

with open(sale_modal_path, "w", encoding="utf-8") as f:
    f.write(sale_content)

# 3. Update SalesDataPage.tsx to use the mockSale in onSuccess and rename button
sales_data_path = r"d:\apex_internal\demoApex\src\features\sales\pages\SalesDataPage.tsx"
with open(sales_data_path, "r", encoding="utf-8") as f:
    sales_data_content = f.read()

# Change button text from "Add new" to "Tạo công nợ"
sales_data_content = sales_data_content.replace(
    "<Plus size={20} />\n            Add new\n          </button>",
    "<Plus size={20} />\n            Tạo công nợ\n          </button>"
)

# Update onSuccess logic
sales_data_content = sales_data_content.replace(
    "onSuccess={loadSales}",
    "onSuccess={(mockSale) => { if (mockSale) setSales(prev => [mockSale, ...prev]); else loadSales(); }}"
)

with open(sales_data_path, "w", encoding="utf-8") as f:
    f.write(sales_data_content)

