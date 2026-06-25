import os
import re

# 1. Update api.ts
api_path = r"d:\apex_internal\demoApex\src\features\sales\api.ts"
with open(api_path, "r", encoding="utf-8") as f:
    api_content = f.read()

# Multiply all salaries by 20,000 or so to make them realistic VND
api_content = re.sub(r'offered_monthly_salary:\s*(\d+)', lambda m: f"offered_monthly_salary: {int(m.group(1)) * 25000}", api_content)

# Update makeFinance calls to multiply p1Amount and paidAmount
api_content = re.sub(
    r"makeFinance\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+)\)",
    lambda m: f"makeFinance('{m.group(1)}', '{m.group(2)}', '{m.group(3)}', {int(m.group(4)) * 25000}, {int(m.group(5)) * 25000})",
    api_content
)

# Fix createSaleWithFinance to push to mockSales
old_create = "export const createSaleWithFinance = async (..._args: any[]) => mockSales[0];"
new_create = """export const createSaleWithFinance = async (sale: any, finance: any) => {
  const newSale = {
    id: 'mock-' + Date.now(),
    ...sale,
    client: { id: sale.client_id, client_name: 'Khách hàng mới (Mock)' },
    job: { id: sale.job_id, position_title: 'Vị trí mới (Mock)' },
    candidate: { id: sale.candidate_id, name: 'Ứng viên mới (Mock)' },
    finance: { ...finance }
  };
  mockSales.unshift(newSale);
  return newSale;
};"""
api_content = api_content.replace(old_create, new_create)

with open(api_path, "w", encoding="utf-8") as f:
    f.write(api_content)


# 2. Revert SaleModal.tsx
sale_modal_path = r"d:\apex_internal\demoApex\src\features\sales\components\SaleModal.tsx"
with open(sale_modal_path, "r", encoding="utf-8") as f:
    sale_content = f.read()

sale_content = sale_content.replace(
    "onSuccess: (mockSale?: any) => void;",
    "onSuccess: () => void;"
)

mock_save = """      if (isEdit && sale) {
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

original_save = """      if (isEdit && sale) {
        await updateSale(sale.id, salePayload);
        await updateSaleFinance(sale.id, {
          ...financePayload,
          ...(status.overall === 'Done' && (sale.finance?.p1_paid_amount ?? 0) === 0 && {
            p1_paid_amount: p1Amt,
            p2_paid_amount: p2Amt,
          })
        });
        toast.success('Debt updated successfully (Mock - F5 to reset)');
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
        toast.success('Debt accounted successfully (Mock - F5 to reset)');
      }
      onSuccess();"""
      
sale_content = sale_content.replace(mock_save, original_save)

with open(sale_modal_path, "w", encoding="utf-8") as f:
    f.write(sale_content)


# 3. Update SalesDataPage.tsx
sales_data_path = r"d:\apex_internal\demoApex\src\features\sales\pages\SalesDataPage.tsx"
with open(sales_data_path, "r", encoding="utf-8") as f:
    sales_data = f.read()

sales_data = sales_data.replace(
    "onSuccess={(mockSale) => { if (mockSale) setSales(prev => [mockSale, ...prev]); else loadSales(); }}",
    "onSuccess={loadSales}"
)

with open(sales_data_path, "w", encoding="utf-8") as f:
    f.write(sales_data)
