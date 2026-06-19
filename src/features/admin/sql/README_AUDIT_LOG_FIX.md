# VẤN ĐỀ: Audit Log Hiển Thị "System/Unknown"

## 📋 **Nguyên nhân**

### **Vấn đề gốc:**

Khi Edge Function (Service Role) thực hiện thao tác với database:

- Edge Function dùng `adminClient` (Service Role key) → **Không có `auth.uid()`**
- Database Trigger `log_audit_event()` chạy tự động khi UPDATE/INSERT/DELETE
- Trigger đọc `auth.uid()` để lấy ID người thực hiện → **Nhận NULL**
- Kết quả: `actor_name` = "System/Unknown"

### **Tình huống cụ thể:**

```
User duyệt tài khoản (Approve User)
  ↓
Edge Function `activate-user`
  ↓
adminClient.from('users').update({ status: 'approved' })  ← Service Role, auth.uid() = NULL
  ↓
Trigger `trg_audit_users` chạy
  ↓
log_audit_event() đọc auth.uid() → NULL
  ↓
actor_name = "System/Unknown" ❌
```

---

## ✅ **Giải pháp**

### **Strategy: RPC + Session Variable**

Thay vì Edge Function update trực tiếp table, tạo một RPC (Postgres Function) để:

1. **Set session variable** `app.current_user_id` = ID admin
2. **Thực hiện UPDATE** trong RPC
3. **Trigger đọc session variable** nếu `auth.uid()` NULL

```
Edge Function
  ↓
Call RPC admin_activate_user_rpc(target_id, actor_id)
  ↓
RPC: set_config('app.current_user_id', actor_id)
  ↓
RPC: UPDATE users SET status = 'approved'
  ↓
Trigger chạy, đọc:
  - auth.uid() = NULL
  - current_setting('app.current_user_id') = actor_id ✅
  ↓
actor_name = "Thế" ✅
```

---

## 🛠️ **Implementation**

### **1. Cập nhật Trigger** (`fix_audit_actor_rpc.sql`)

```sql
-- Đọc theo thứ tự ưu tiên:
v_actor_user_id := auth.uid();

IF v_actor_user_id IS NULL THEN
  v_actor_user_id := current_setting('app.current_user_id', true)::uuid;
END IF;
```

### **2. Tạo RPC**

```sql
CREATE FUNCTION admin_activate_user_rpc(p_target_user_id uuid, p_actor_user_id uuid)
RETURNS jsonb AS $$
BEGIN
  -- Set context
  PERFORM set_config('app.current_user_id', p_actor_user_id::text, true);

  -- Update user
  UPDATE users SET status = 'approved' WHERE id = p_target_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **3. Edge Function gọi RPC** (thay vì direct update)

```typescript
// ❌ CŨ:
await adminClient.from("users").update({ status: "approved" });

// ✅ MỚI:
await adminClient.rpc("admin_activate_user_rpc", {
  p_target_user_id: targetUserId,
  p_actor_user_id: user.id,
});
```

---

## 🔒 **Đảm bảo không Crash App**

Toàn bộ logic audit log wrap trong `EXCEPTION WHEN OTHERS`:

```sql
BEGIN
  -- Toàn bộ logic audit (SELECT profiles, INSERT audit_logs...)
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Audit log failed silently: %', SQLERRM;
  -- App vẫn chạy bình thường
END;

RETURN COALESCE(NEW, OLD);  -- LUÔN return
```

→ Nếu audit log fail → Chỉ in log, **KHÔNG throw error**

---

## 📁 **Files Cleanup**

### ✅ **GIỮ LẠI** (files cần thiết):

1. **`fix_audit_actor_rpc.sql`** ⭐ - **FILE CHÍNH**
   - Cập nhật trigger `log_audit_event` đọc session variable
   - Tạo RPC `admin_activate_user_rpc`
   - Wrap toàn bộ logic trong EXCEPTION để không crash
2. **`add_audit_log_expanded.sql`**
   - Migration schema ban đầu (rename columns, add snapshot fields)
   - **CHẠY 1 LẦN DUY NHẤT** khi setup DB
   - Giữ để reference architecture

### ❌ **XÓA ĐI** (files thừa/cũ):

1. **`create_audit_logs_view.sql`** ❌
   - Tạo VIEW để join với profiles
   - Không cần nữa vì đã có snapshot columns

2. **`fix_missing_profiles_FK.sql`** ❌
   - Fix foreign key constraints
   - Đã loại bỏ FK trong `add_audit_log_expanded.sql` rồi

3. **`link_audit_logs_to_profiles.sql`** ❌
   - Script cũ để add FK
   - Conflict với strategy "no FK" hiện tại

4. **`optimize_audit_logs.sql`** ❌
   - Tạo indexes
   - Đã có trong `add_audit_log_expanded.sql` (dòng 292-295)

---

## 📝 **Kết luận**

### **Chỉ cần 2 files:**

```
src/features/admin/sql/
├── add_audit_log_expanded.sql       ← Schema migration (chạy 1 lần)
└── fix_audit_actor_rpc.sql          ← Fix "System/Unknown" (ACTIVE)
```

### **Xóa 4 files:**

```bash
rm create_audit_logs_view.sql
rm fix_missing_profiles_FK.sql
rm link_audit_logs_to_profiles.sql
rm optimize_audit_logs.sql
```

### **Deployment:**

1. Run `fix_audit_actor_rpc.sql` trong Supabase SQL Editor
2. Deploy Edge Function: `supabase functions deploy active-user`
3. Test → Audit log sẽ hiển thị đúng tên admin ✅
