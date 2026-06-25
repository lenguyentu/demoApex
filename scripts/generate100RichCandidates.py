import json
import random
from datetime import datetime, timedelta

candidates = []

first_names = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Vũ", "Trương", "Lý", "Đinh"]
middle_names = ["Văn", "Thị", "Minh", "Hữu", "Đức", "Thanh", "Ngọc", "Quang", "Tuấn", "Hoàng", "Anh", "Mai", "Phương", "Tiến", "Bảo", "Gia"]
last_names = ["An", "Bích", "Cường", "Sơn", "Phương", "Linh", "Khoa", "Nam", "Tiến", "Trang", "Lan", "Hùng", "Khải", "Nhi", "Hiếu", "Tâm"]

jobs_and_related = [
    # 1. Senior Frontend Engineer
    ("IT - Software", ["Senior Frontend Engineer", "Frontend Tech Lead", "React Developer", "Vue Developer", "Frontend Developer"]),
    # 2. Product Marketing Manager
    ("Marketing", ["Product Marketing Manager", "Marketing Manager", "Growth Marketing Lead", "Digital Marketing Specialist", "Brand Manager"]),
    # 3. Backend Developer (Go)
    ("IT - Software", ["Backend Developer (Go)", "Senior Go Engineer", "Backend Software Engineer", "Golang Developer", "Platform Engineer"]),
    # 4. Head of Talent Acquisition
    ("HR", ["Head of Talent Acquisition", "TA Manager", "Senior Technical Recruiter", "HR Manager", "Recruitment Lead"]),
    # 5. Data Engineer
    ("IT - Software", ["Data Engineer", "Senior Data Engineer", "Big Data Engineer", "Data Warehouse Specialist", "ETL Developer"]),
    # 6. B2B Sales Executive
    ("Sales", ["B2B Sales Executive", "Sales Manager", "Account Executive", "Business Development Representative", "Corporate Sales Specialist"]),
    # 7. Chief Financial Officer
    ("Finance", ["Chief Financial Officer", "VP of Finance", "Finance Director", "Financial Controller", "Head of Finance"]),
    # 8. Senior UX/UI Designer
    ("Design", ["Senior UX/UI Designer", "Product Designer", "UX Researcher", "Lead UI Designer", "UX/UI Specialist"]),
    # 9. Supply Chain Manager
    ("Logistics", ["Supply Chain Manager", "Logistics Director", "Procurement Manager", "Supply Chain Analyst", "Operations Manager"]),
    # 10. Mobile Developer (Flutter)
    ("IT - Software", ["Mobile Developer (Flutter)", "Senior Flutter Developer", "iOS Developer", "Android Developer", "Mobile Tech Lead"]),
    # 11. Content Creator
    ("Marketing", ["Content Creator", "Copywriter", "Social Media Manager", "Content Strategist", "Senior Copywriter"]),
    # 12. AI/ML Engineer
    ("IT - Software", ["AI/ML Engineer", "Machine Learning Scientist", "Computer Vision Engineer", "Data Scientist", "Deep Learning Engineer"]),
    # 13. Legal Counsel
    ("Legal", ["Legal Counsel", "Senior Legal Executive", "Corporate Lawyer", "Compliance Manager", "Legal Advisor"]),
    # 14. Customer Success Manager
    ("Sales", ["Customer Success Manager", "Key Account Manager", "Client Relationship Manager", "Head of Customer Success", "Account Manager"]),
    # 15. QA Automation Engineer
    ("IT - Software", ["QA Automation Engineer", "Senior QA Engineer", "Software Tester", "Test Automation Lead", "Quality Assurance Analyst"]),
    # 16. Chief Marketing Officer
    ("Marketing", ["Chief Marketing Officer", "VP of Marketing", "Marketing Director", "Head of Digital Marketing", "CMO"]),
    # 17. DevOps Architect
    ("IT - Software", ["DevOps Architect", "Senior Cloud Engineer", "Site Reliability Engineer", "AWS Solutions Architect", "DevOps Lead"]),
    # 18. Production Manager
    ("Manufacturing", ["Production Manager", "Plant Manager", "Manufacturing Lead", "Operations Director", "Quality Control Manager"]),
    # 19. Business Analyst
    ("IT - Software", ["Business Analyst", "Senior IT BA", "Product Owner", "Systems Analyst", "Technical BA"]),
    # 20. Social Media Executive
    ("Marketing", ["Social Media Executive", "Community Manager", "Digital Campaign Executive", "Social Media Specialist", "PR Executive"])
]

def random_date():
    return (datetime.now() - timedelta(days=random.randint(1, 150))).isoformat()

def random_birth():
    return (datetime.now() - timedelta(days=random.randint(22*365, 45*365))).strftime("%Y-%m-%d")

count = 1
for industry, titles in jobs_and_related:
    for title in titles:
        fname = random.choice(first_names)
        mname = random.choice(middle_names)
        lname = random.choice(last_names)
        full_name = f"{fname} {mname} {lname}"
        
        # Email remove diacritics
        import unicodedata
        def strip_accents(s):
            return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
        email = f"{strip_accents(fname).lower()}.{strip_accents(lname).lower()}{count}@gmail.com"
        phone = f"09{random.randint(10000000, 99999999)}"
        
        exp_years = random.randint(3, 12)
        
        # Generate rich Vietnamese content based on industry
        summary = ""
        strengths = ""
        goals = ""
        history = []
        skills = []
        soft_skills = ["Làm việc nhóm", "Giải quyết vấn đề", "Giao tiếp hiệu quả", "Tư duy phản biện", "Quản lý thời gian"]
        
        if industry == "IT - Software":
            summary = f"<p>- Hơn {exp_years} năm kinh nghiệm trong lĩnh vực phát triển phần mềm, chuyên sâu về {title}.<br>- Từng dẫn dắt đội ngũ kỹ sư 5-10 người triển khai các hệ thống Core Banking và E-commerce chịu tải cao.<br>- Kiến trúc sư trưởng của nhiều dự án chuyển đổi số với microservices và cloud computing.<br>- Kỹ năng phân tích thiết kế hệ thống, tối ưu hiệu năng và quản lý vòng đời phát triển phần mềm (SDLC).</p>"
            strengths = "- Nền tảng kỹ thuật vững chắc, khả năng debug và tối ưu hóa hệ thống xuất sắc.\n- Kỹ năng leadership, đã từng mentoring cho nhiều junior developer.\n- Tinh thần học hỏi công nghệ mới (AI, Blockchain, Serverless) liên tục."
            goals = "Trở thành Technical Director / Engineering Manager trong 3 năm tới, xây dựng các sản phẩm công nghệ có sức ảnh hưởng lớn đến hàng triệu người dùng."
            history = [
                {
                    "position": title,
                    "companyName": "Công ty CP Công nghệ VNG",
                    "duration": "03/2021 - Nay",
                    "description": "Chịu trách nhiệm thiết kế kiến trúc hệ thống và dẫn dắt team phát triển tính năng mới. Tối ưu hóa API response time giảm 40%, triển khai hệ thống CI/CD tự động hoá 100% quy trình deploy. Review code, đảm bảo chất lượng và độ ổn định của hệ thống đạt 99.9% uptime."
                },
                {
                    "position": "Software Engineer",
                    "companyName": "FPT Software",
                    "duration": "06/2018 - 02/2021",
                    "description": "Tham gia phát triển các dự án outsource cho thị trường Nhật Bản. Làm việc trực tiếp với khách hàng để làm rõ yêu cầu, viết unit test và documentation cho các module quan trọng."
                }
            ]
            skills = ["ReactJS", "Node.js", "Golang", "Docker/Kubernetes", "AWS/GCP", "PostgreSQL/MongoDB"]
            
        elif industry == "Marketing":
            summary = f"<p>- Ứng viên có {exp_years} năm kinh nghiệm thực chiến trong lĩnh vực Marketing, đặc biệt mảng Growth và Digital.<br>- Kỹ năng chuyên môn bao gồm xây dựng chiến lược nội dung, nghiên cứu thị trường, kể chuyện thương hiệu và Performance Marketing.<br>- Từng quản lý ngân sách quảng cáo lên tới 5 tỷ VNĐ/tháng, mang lại doanh thu tăng trưởng 150% YoY.<br>- Thành thạo các công cụ phân tích dữ liệu (Google Analytics, Mixpanel), hệ thống CRM và các nền tảng Social Media.</p>"
            strengths = "- Tư duy nhạy bén với thị trường, khả năng nắm bắt trend và insight khách hàng sâu sắc.\n- Kỹ năng phân tích số liệu và tối ưu hóa ROI/ROAS hiệu quả.\n- Khả năng quản lý dự án truyền thông tích hợp đa kênh (IMC)."
            goals = "Mong muốn phát triển lên vị trí CMO / Marketing Director, dẫn dắt các chiến dịch truyền thông mang tầm quốc gia và xây dựng thương hiệu top of mind."
            history = [
                {
                    "position": title,
                    "companyName": "Tập đoàn Vingroup",
                    "duration": "05/2022 - Nay",
                    "description": "Lập kế hoạch và thực thi chiến lược Marketing tổng thể cho dòng sản phẩm mới. Phối hợp với team Design, Content, Media để sản xuất tài liệu truyền thông. Phân tích dữ liệu chiến dịch để tối ưu hóa CPA và tăng tỷ lệ chuyển đổi (Conversion Rate) lên 35%. Quản lý quan hệ với các đối tác Agency và KOL/KOC."
                },
                {
                    "position": "Digital Marketing Executive",
                    "companyName": "Shopee Việt Nam",
                    "duration": "09/2019 - 04/2022",
                    "description": "Triển khai các chiến dịch Mega Sale (9.9, 11.11, 12.12). Tối ưu hóa quảng cáo Facebook/Google Ads. Lên kịch bản và theo dõi các phiên livestream bán hàng. Báo cáo hiệu quả chiến dịch hàng tuần cho quản lý trực tiếp."
                }
            ]
            skills = ["Digital Marketing", "SEO/SEM", "Content Strategy", "Data Analysis", "Brand Management", "Performance Marketing"]
            
        elif industry == "Sales":
            summary = f"<p>- Chuyên gia bán hàng B2B/B2C với {exp_years} năm kinh nghiệm trong việc phát triển thị trường và mở rộng tệp khách hàng doanh nghiệp.<br>- Liên tục vượt KPI doanh số 120%-150% trong 3 năm liên tiếp tại các tập đoàn công nghệ/tài chính hàng đầu.<br>- Kỹ năng đàm phán cấp cao, chốt hợp đồng giá trị lớn và quản lý quan hệ khách hàng (Key Account Management).<br>- Từng xây dựng và đào tạo đội ngũ sales 15+ thành viên từ con số không.</p>"
            strengths = "- Khả năng giao tiếp, thuyết phục và xây dựng mạng lưới quan hệ (Networking) xuất sắc.\n- Chịu được áp lực doanh số cao, tư duy hướng tới kết quả (Result-oriented).\n- Am hiểu sâu sắc về chu kỳ bán hàng và quy trình quản trị phễu khách hàng (Sales Pipeline)."
            goals = "Mục tiêu trở thành Giám đốc Kinh doanh (CSO / Sales Director) toàn quốc, xây dựng đội ngũ bán hàng tinh nhuệ và mang lại doanh thu đột phá cho công ty."
            history = [
                {
                    "position": title,
                    "companyName": "Base.vn",
                    "duration": "02/2021 - Nay",
                    "description": "Tiếp cận và tư vấn giải pháp chuyển đổi số cho các doanh nghiệp SME và Enterprise. Đàm phán và ký kết các hợp đồng SaaS trị giá từ 500 triệu - 2 tỷ VNĐ. Đóng vai trò Key Account Manager chăm sóc các khách hàng VIP, thực hiện cross-sell và up-sell thành công các sản phẩm mới."
                },
                {
                    "position": "Chuyên viên Kinh doanh",
                    "companyName": "Bất động sản Đất Xanh",
                    "duration": "08/2017 - 01/2021",
                    "description": "Tìm kiếm khách hàng tiềm năng qua telesales, networking và sự kiện. Tư vấn các dự án bất động sản cao cấp, hỗ trợ khách hàng thủ tục pháp lý và vay vốn ngân hàng. Đạt danh hiệu Best Seller của quý 3/2020."
                }
            ]
            skills = ["B2B Sales", "Negotiation", "CRM Software", "Cold Calling", "Key Account Management", "Presentation"]
        
        elif industry == "HR":
            summary = f"<p>- Giám đốc/Quản lý Nhân sự với {exp_years} năm kinh nghiệm, chuyên sâu về mảng Tuyển dụng (Talent Acquisition) và Phát triển Tổ chức (OD).<br>- Có kinh nghiệm scale-up quy mô nhân sự từ 100 lên 500+ nhân viên cho các công ty công nghệ và startup.<br>- Xây dựng thành công hệ thống đánh giá năng lực (KPI/OKR), khung năng lực và chính sách đãi ngộ (C&B) cạnh tranh.<br>- Triển khai hiệu quả các chiến dịch Employer Branding, nâng cao mức độ gắn kết nhân viên.</p>"
            strengths = "- Kỹ năng nhìn người, đánh giá ứng viên nhạy bén.\n- Khả năng xây dựng văn hóa doanh nghiệp và giải quyết xung đột.\n- Tư duy Data-driven HR, sử dụng dữ liệu để ra quyết định quản trị."
            goals = "Phát triển thành CHRO (Giám đốc Nhân sự Cấp cao) trong 5 năm tới, trở thành đối tác chiến lược (HRBP) đắc lực cho Ban Giám đốc."
            history = [
                {
                    "position": title,
                    "companyName": "Công ty Cổ phần MISA",
                    "duration": "10/2020 - Nay",
                    "description": "Xây dựng và thực thi chiến lược Tuyển dụng tổng thể đáp ứng nhu cầu mở rộng kinh doanh. Quản lý team 10 chuyên viên tuyển dụng. Trực tiếp headhunt các vị trí C-level và Manager. Phối hợp cùng team Marketing triển khai các chương trình Employer Branding tại các trường Đại học lớn."
                },
                {
                    "position": "Chuyên viên Nhân sự Tổng hợp",
                    "companyName": "VNPAY",
                    "duration": "06/2016 - 09/2020",
                    "description": "Phụ trách full-cycle recruitment cho khối Tech và Non-tech. Thực hiện các thủ tục onboard, offboard, quản lý Hợp đồng lao động và tính lương (C&B) cơ bản. Tổ chức các hoạt động teambuilding và sự kiện nội bộ."
                }
            ]
            skills = ["Talent Acquisition", "Employer Branding", "C&B", "Performance Management", "Employee Relations", "HRIS"]
            
        else:
            summary = f"<p>- Chuyên gia cấp cao trong lĩnh vực {industry} với hơn {exp_years} năm kinh nghiệm thực tiễn.<br>- Có khả năng thiết lập quy trình làm việc chuẩn hóa, quản lý dự án quy mô lớn và tối ưu hóa chi phí vận hành.<br>- Đã từng lãnh đạo các team đa chức năng (cross-functional) hoàn thành các mục tiêu chiến lược của công ty.<br>- Sử dụng thành thạo các công cụ chuyên ngành và phân tích dữ liệu.</p>"
            strengths = "- Khả năng lãnh đạo và định hướng tầm nhìn chiến lược.\n- Kỹ năng xử lý khủng hoảng và ra quyết định trong môi trường áp lực cao.\n- Tinh thần trách nhiệm và cam kết cao với chất lượng công việc."
            goals = f"Tiến xa hơn trong vai trò {title} cấp cao, mang lại giá trị bền vững và sự đổi mới liên tục cho tổ chức."
            history = [
                {
                    "position": title,
                    "companyName": "Tập đoàn Đa quốc gia",
                    "duration": "01/2020 - Nay",
                    "description": f"Chịu trách nhiệm điều hành toàn bộ mảng {industry}. Xây dựng KPI, giám sát tiến độ thực hiện và báo cáo trực tiếp cho Ban Tổng Giám đốc. Triển khai áp dụng công nghệ mới giúp tự động hóa 30% quy trình làm việc."
                },
                {
                    "position": f"Chuyên viên {industry}",
                    "companyName": "Công ty TNHH ABC",
                    "duration": "2015 - 2019",
                    "description": "Thực hiện các nghiệp vụ chuyên môn, lập báo cáo phân tích định kỳ. Phối hợp với các phòng ban liên quan để giải quyết vấn đề phát sinh."
                }
            ]
            skills = ["Project Management", "Strategic Planning", "Data Analysis", "Process Optimization", "Budget Management"]
            
        candidate = {
            "id": f"candidate-{count}",
            "cdd_code": f"CDD-{count:04d}",
            "name": full_name,
            "full_name": full_name,
            "email": email,
            "phone": phone,
            "status": random.choice(["Active", "Interviewing", "Offered", "Applied", "New_Lead"]),
            "current_title": title,
            "applied_position": title,
            "experience_years": exp_years,
            "address": random.choice(["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Bình Dương", "Hải Phòng"]),
            "date_of_birth": random_birth(),
            "gender": random.choice(["male", "female"]),
            "highest_education": random.choice(["Đại học", "Thạc sĩ"]),
            "major": random.choice(["Quản trị kinh doanh", "Công nghệ thông tin", "Marketing", "Tài chính ngân hàng", "Luật"]),
            "school_name": random.choice(["Đại học Bách Khoa", "Đại học Kinh tế Quốc dân", "Đại học Ngoại Thương", "RMIT Vietnam", "Đại học Quốc gia TpHCM"]),
            "education_period": f"{random.randint(2010,2018)} - {random.randint(2014,2022)}",
            "gpa": f"{random.uniform(7.0, 9.5):.1f}/10",
            "english_level": random.choice(["IELTS 6.5", "TOEIC 850", "IELTS 7.5", "Giao tiếp trôi chảy"]),
            "professional_certifications": "Chứng chỉ chuyên ngành quốc tế",
            "other_languages": ["Tiếng Anh"],
            "technical_skills": skills,
            "soft_skills": soft_skills,
            "current_monthly_salary": f"{random.randint(15, 60)} Triệu VNĐ",
            "expected_monthly_salary": f"{random.randint(20, 80)} Triệu VNĐ",
            "employment_start_date": "Có thể bắt đầu ngay",
            "key_strengths": strengths,
            "career_goals": goals,
            "professional_summary": summary,
            "professional_history": history,
            "linkedin": f"https://linkedin.com/in/{strip_accents(fname).lower()}{strip_accents(lname).lower()}{count}",
            "current_employment_status": random.choice(["Đang đi làm", "Nghỉ việc"]),
            "experienced_industry": industry,
            "experienced_job": title,
            "employment_type": "Full-time",
            "notice_period": "30 ngày",
            "expected_annual_salary": f"{random.randint(200, 800)} Triệu VNĐ",
            "created_at": random_date(),
            "owner_id": "mock-user-123" if random.random() > 0.3 else "other-user",
            "cv_link": f"https://example.com/cv{count}.pdf" if random.random() > 0.2 else None,
            "is_potential": random.choice([True, False]),
            "photo_url": ""
        }
        candidates.append(candidate)
        count += 1

# Append candidate 999 (Thuý Hằng) to the list manually
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
candidates.append(new_candidate)

candidates_ts_content = "export const MOCK_CANDIDATES = [\n"
for c in candidates:
    candidates_ts_content += "  " + json.dumps(c, ensure_ascii=False) + ",\n"
candidates_ts_content += "];\n"

with open(r"d:\apex_internal\demoApex\src\mocks\candidates.ts", "w", encoding="utf-8") as f:
    f.write(candidates_ts_content)
