import json

new_candidate = {
    "id": "candidate-999",
    "cdd_code": "CDD-9999",
    "name": "Nguyễn Thị Thuý Hằng",
    "full_name": "Nguyễn Thị Thuý Hằng",
    "email": "Nguyenthuyhang220198@gmail.com",
    "phone": "0352206969",
    "status": "New_Lead",
    "current_title": "CEO Assistant",
    "applied_position": "CEO Assistant",
    "experience_years": 5,
    "address": "HỒ CHÍ MINH",
    "date_of_birth": "1998-01-22",
    "gender": "female",
    "highest_education": "Đại học",
    "major": "Luật dân sự",
    "school_name": "Đại học Luật TpHCM",
    "education_period": "11/2020",
    "gpa": "",
    "english_level": "Basic",
    "professional_certifications": "MOS WORD 2017, TOEIC 500",
    "other_languages": [],
    "technical_skills": ["CRM", "Capcut Pro", "Canva pro"],
    "soft_skills": ["Content Strategy & Planning", "Consumer Insight & Competitor Research", "Product Storytelling & Brand Communication", "Social Media Content Development", "KOL/KOC Content Management", "Training"],
    "current_monthly_salary": "Negotiable",
    "expected_monthly_salary": "Negotiable",
    "employment_start_date": "Immediate",
    "key_strengths": "Kinh nghiệm đa dạng trong hỗ trợ CEO và điều phối dự án chiến lược\nKỹ năng xây dựng và triển khai nội dung marketing đa nền tảng, đặc biệt trên TikTok và Facebook\nKhả năng nghiên cứu thị trường, phân tích insight khách hàng và phát triển nội dung chuyển đổi",
    "career_goals": "Mong muốn phát triển trong các vị trí Executive Assistant, CEO Assistant hoặc Project Coordinator tại các doanh nghiệp đang trong giai đoạn tăng trưởng.",
    "professional_summary": "<p>- Ứng viên có hơn 5 năm kinh nghiệm làm việc trong các lĩnh vực hỗ trợ điều hành, kinh doanh, chăm sóc khách hàng và marketing.<br>- Kỹ năng chuyên môn bao gồm xây dựng chiến lược nội dung, nghiên cứu thị trường, kể chuyện thương hiệu và phát triển nội dung đa nền tảng.<br>- Thành thạo các công cụ CRM, Capcut Pro và Canva pro, có kinh nghiệm quản lý lịch trình CEO và điều phối các phòng ban.<br>- Đã tham gia các dự án trọng điểm như ra mắt sản phẩm mới và xây dựng thương hiệu mỹ phẩm.<br>- Có thành tích nhân viên xuất sắc tại công ty trước đây, thể hiện năng lực và sự cam kết trong công việc.</p>",
    "professional_history": [
        {
            "position": "CEO Assistant",
            "companyName": "Công ty TNHH Wehave (Team Lucie Nguyễn - Tuấn Dương)",
            "duration": "01/2026 - Nay",
            "description": "Quản lý lịch trình làm việc, sắp xếp cuộc họp và các hoạt động ưu tiên của CEO. Theo dõi tiến độ công việc của các phòng ban, đảm bảo các mục tiêu chiến lược được triển khai đúng kế hoạch. Nghiên cứu chuyên sâu về sản phẩm, thị trường và định vị thương hiệu nhằm xây dựng nền tảng nội dung truyền thông phù hợp với chiến lược kinh doanh. Tham gia dự án trọng điểm ra mắt sản phẩm mới, xây dựng thương hiệu mỹ phẩm mới. Xây dựng Product Portfolio và Brand Portfolio, hệ thống hóa thông tin về sản phẩm, USP, đối tượng khách hàng mục tiêu và thông điệp truyền thông. Phát triển tuyến nội dung cho sản phẩm bao gồm nội dung giáo dục thị trường, giải quyết vấn đề khách hàng, kể chuyện thương hiệu, thúc đẩy chuyển đổi. Thu thập và phân tích thông tin thương hiệu, hành vi người tiêu dùng và insight khách hàng để xây dựng định hướng nội dung có tính ứng dụng và khả năng chuyển đổi cao. Phối hợp với các phòng ban liên quan triển khai kế hoạch truyền thông, hỗ trợ sản xuất nội dung và đảm bảo tính đồng bộ của hình ảnh thương hiệu trên các nền tảng số."
        },
        {
            "position": "Sales and Marketing Specialist",
            "companyName": "HOÀ BÌNH GROUP",
            "duration": "09/2020 - 11/2025",
            "description": "Xây dựng kế hoạch nội dung theo mục tiêu truyền thông và kinh doanh. Lên ý tưởng, viết nội dung và triển khai các chiến dịch marketing trên TikTok, Facebook. Xây dựng hệ thống nội dung theo phễu Awareness, Engagement, Conversion. Phát triển kênh TikTok Mall tập trung vào nội dung chuyển đổi bán hàng, lên concept, viết kịch bản, quay và dựng video ngắn. Sản xuất nội dung review sản phẩm, storytelling thương hiệu, kiến thức chăm sóc da, nội dung bán hàng và theo xu hướng. Tối ưu nội dung theo hành vi người dùng và xu hướng nền tảng. Chụp ảnh sản phẩm phục vụ truyền thông và bán hàng. Viết bộ nội dung bán hàng và câu chuyện truyền thông cho hệ thống kinh doanh như Spa, Shop mỹ phẩm, hệ thống phân phối, mô hình Shop-in-Shop. Xây dựng tài liệu truyền thông giúp đối tác tái sử dụng triển khai marketing và bán hàng. Đào tạo kiến thức sản phẩm cho hệ thống phân phối, hướng dẫn đội ngũ và đối tác xây dựng kịch bản video, quay chụp bằng điện thoại, dựng video ngắn, xây dựng nội dung Social Media, ứng dụng content trong bán hàng và chăm sóc khách hàng."
        },
        {
            "position": "Chuyên viên tư vấn",
            "companyName": "Công ty TNHH Tư vấn Luật Aliat Legal",
            "duration": "09/2019 - 07/2020",
            "description": "Xây dựng chiến lược và kế hoạch nội dung theo mục tiêu thương hiệu và kinh doanh. Nghiên cứu khách hàng, thị trường và đối thủ để phát triển nội dung hiệu quả. Kể chuyện thương hiệu và truyền tải giá trị sản phẩm thông qua nội dung sáng tạo. Phát triển nội dung đa nền tảng, đặc biệt là short-form video và nội dung chuyển đổi. Hỗ trợ triển khai nội dung và quản lý thông điệp truyền thông cho KOL/KOC. Thành thạo các phần mềm CRM và các công cụ như Capcut Pro, Canva pro."
        },
        {
            "position": "Trợ lý thư ký",
            "companyName": "Toà án nhân dân cấp cao TpHCM",
            "duration": "07/2018 - 08/2019",
            "description": "Làm việc với các đương sự, cơ quan công an, Viện kiểm sát có liên quan trực tiếp với vụ việc. Tham gia nghiên cứu vụ việc, phân tích và tìm ra những luận điểm của vụ án. Lập báo cáo, phân tích, lọc hồ sơ, khoanh vùng vụ việc."
        }
    ],
    "facebook": "https://www.facebook.com/",
    "linkedin": "",
    "current_employment_status": "Employed",
    "experienced_industry": "Marketing",
    "experienced_job": "CEO Assistant",
    "employment_type": "Full-time",
    "notice_period": "30 days",
    "expected_annual_salary": "",
    "created_at": "2026-06-25T00:00:00.000Z",
    "owner_id": "mock-user-123",
    "cv_link": "https://example.com/cv.pdf",
    "is_potential": False,
    "photo_url": ""
}

path = r'd:\apex_internal\demoApex\src\mocks\candidates.ts'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Append to MOCK_CANDIDATES array
# It ends with: ];
# We will insert our new candidate just before the ];
new_cand_json = json.dumps(new_candidate, ensure_ascii=False, indent=2)

if '];' in content:
    # Insert before the last ];
    # Since it's a list of objects, we should add a comma to the previous object if needed.
    # It's easier to just parse the file or use a simple replace.
    # Actually, let's just do a string replace:
    content = content.replace('\n];', f',\n  {new_cand_json}\n];')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully added candidate.")
else:
    print("Could not find end of array.")
