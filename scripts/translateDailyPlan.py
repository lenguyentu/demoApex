import os
import re

file_path = r"d:\apex_internal\demoApex\src\features\daily_plan\pages\DailyPlanPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "Lên plan daily, check mail": "Create daily plan, check emails",
    "Điền database, tổng kết ngày": "Update database, summarize day",
    "Đang tải cấu hình Daily Plan...": "Loading Daily Plan configuration...",
    "MÀN HÌNH BỊ KHÓA": "SCREEN LOCKED",
    "Đã quá hạn nộp kế hoạch buổi sáng (09:00). Vui lòng liên hệ Admin để xin quyền nộp muộn.": "Morning plan submission deadline (09:00) has passed. Please contact Admin for late submission.",
    "Đã quá hạn nộp kế hoạch buổi chiều (13:20). Vui lòng liên hệ Admin để xin quyền nộp muộn.": "Afternoon plan submission deadline (13:20) has passed. Please contact Admin for late submission.",
    "Hệ thống đang chặn bạn nhận CV vì chưa nộp báo cáo đúng hạn.": "System is blocking you from receiving CVs because you haven't submitted your report on time.",
    "Bảng đang trống hoàn toàn, hãy nhập dữ liệu vào ít nhất 1 dòng!": "The board is completely empty, please enter data into at least 1 row!",
    "Lỗi lưu daily plan:": "Error saving daily plan:",
    "Lỗi: Chưa cấu hình VITE_DISCORD_DAILY_PLAN_WEBHOOK_URL trong file .env": "Error: VITE_DISCORD_DAILY_PLAN_WEBHOOK_URL is not configured in .env",
    "đã nộp daily plan!": "has submitted daily plan!",
    "Một thành viên": "A member",
    "Thành công! Ảnh đã lên Discord.": "Success! Image uploaded to Discord.",
    "Có lỗi gửi Webhook.": "Error sending Webhook.",
    "Lỗi tạo ảnh:": "Error creating image:",
    "Không có lịch trình": "No schedule",
    "Nhập công việc vào đây...": "Enter task here...",
    "Xóa dòng": "Delete row",
    "Báo cáo Kế hoạch Ngày (Daily Plan)": "Daily Plan Report",
    "Đã nộp báo cáo": "Report Submitted",
    "Bạn đã nộp Kế hoạch Ngày cho ca": "You have submitted the Daily Plan for the",
    "hôm nay.": "shift today.",
    "Nhập lại báo cáo mới": "Enter a new report",
    "Họ tên:": "Full Name:",
    "Đang tải...": "Loading...",
    "Thời gian": "Time",
    "Công việc": "Task",
    "Mục tiêu": "Target",
    "Sáng": "Morning",
    "Chiều": "Afternoon",
    "Thêm dòng": "Add row",
    "Đang giấu các nút bấm và chụp ảnh...": "Hiding buttons and capturing image...",
    "Nộp báo cáo": "Submit Report",
    "'Chiều' : 'Sáng'": "'Afternoon' : 'Morning'"
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("DailyPlanPage translated.")
