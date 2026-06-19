
-- 1. Tạo bảng lưu trữ Lịch sử (History Log)
CREATE TABLE public.sales_finance_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    finance_id UUID NOT NULL REFERENCES public.sales_finance(sales_id) ON DELETE CASCADE,
    changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Ai là người sửa
    action_type TEXT NOT NULL, -- 'UPDATE'
    old_p1_paid_amount NUMERIC(20,2),
    new_p1_paid_amount NUMERIC(20,2),
    old_p2_paid_amount NUMERIC(20,2),
    new_p2_paid_amount NUMERIC(20,2),
    old_note TEXT,
    new_note TEXT,
    old_overall_status TEXT,
    new_overall_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật RLS (Row Level Security) cho bảng lịch sử
ALTER TABLE public.sales_finance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép mọi người xem log công nợ" ON public.sales_finance_history FOR SELECT USING (true);
CREATE POLICY "Hệ thống tự insert log" ON public.sales_finance_history FOR INSERT WITH CHECK (true);

-- 2. Tạo hàm Trigger
CREATE OR REPLACE FUNCTION public.log_sales_finance_updates()
RETURNS TRIGGER AS $$
BEGIN
    -- Chỉ ghi log nếu có sự thay đổi về Tiền hoặc Ghi chú hoặc Trạng thái
    IF (OLD.p1_paid_amount IS DISTINCT FROM NEW.p1_paid_amount) OR
       (OLD.p2_paid_amount IS DISTINCT FROM NEW.p2_paid_amount) OR
       (OLD.note IS DISTINCT FROM NEW.note) OR
       (OLD.overall_status IS DISTINCT FROM NEW.overall_status) THEN
       
       INSERT INTO public.sales_finance_history (
           finance_id,
           changed_by,
           action_type,
           old_p1_paid_amount,
           new_p1_paid_amount,
           old_p2_paid_amount,
           new_p2_paid_amount,
           old_note,
           new_note,
           old_overall_status,
           new_overall_status
       ) VALUES (
           NEW.sales_id,
           auth.uid(), -- Lấy user ID đang thao tác từ Supabase Auth
           'UPDATE',
           OLD.p1_paid_amount,
           NEW.p1_paid_amount,
           OLD.p2_paid_amount,
           NEW.p2_paid_amount,
           OLD.note,
           NEW.note,
           OLD.overall_status,
           NEW.overall_status
       );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Gắn Trigger vào bảng sales_finance
DROP TRIGGER IF EXISTS trg_audit_sales_finance ON public.sales_finance;
CREATE TRIGGER trg_audit_sales_finance
AFTER UPDATE ON public.sales_finance
FOR EACH ROW
EXECUTE FUNCTION public.log_sales_finance_updates();
