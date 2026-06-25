import json
import random
from datetime import datetime, timedelta

candidates = []

first_names = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Vo", "Dang", "Bui", "Do", "Ho", "Ngo", "Duong", "Vu", "Truong", "Ly", "Dinh"]
middle_names = ["Van", "Thi", "Minh", "Huu", "Duc", "Thanh", "Ngoc", "Quang", "Tuan", "Hoang", "Anh", "Mai", "Phuong", "Tien", "Bao", "Gia"]
last_names = ["An", "Bich", "Cuong", "Son", "Phuong", "Linh", "Khoa", "Nam", "Tien", "Trang", "Lan", "Hung", "Khai", "Nhi", "Hieu", "Tam"]

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
        
        email = f"{fname.lower()}.{lname.lower()}{count}@example.com"
        phone = f"09{random.randint(10000000, 99999999)}"
        
        exp_years = random.randint(2, 15)
        
        candidate = {
            "id": f"candidate-{count}",
            "cdd_code": f"CDD-{count:04d}",
            "name": full_name,
            "full_name": full_name,
            "email": email,
            "phone": phone,
            "status": random.choice(["Active", "Interviewing", "Offered", "Applied"]),
            "current_title": title,
            "applied_position": title,
            "experience_years": exp_years,
            "address": random.choice(["Ho Chi Minh City", "Hanoi", "Da Nang", "Binh Duong", "Hai Phong"]),
            "date_of_birth": random_birth(),
            "gender": random.choice(["male", "female"]),
            "highest_education": random.choice(["Bachelor's Degree", "Master's Degree"]),
            "major": "Related Field",
            "school_name": "Top Tier University",
            "education_period": "4 years",
            "gpa": f"{random.uniform(2.8, 3.9):.1f}/4.0",
            "english_level": random.choice(["IELTS 6.5", "TOEIC 800", "IELTS 7.0", "Fluent"]),
            "professional_certifications": "Industry Certifications",
            "other_languages": ["English"],
            "technical_skills": ["Skill 1", "Skill 2", "Skill 3"],
            "soft_skills": ["Communication", "Problem Solving", "Leadership"],
            "current_monthly_salary": f"{random.randint(15, 50)}M",
            "expected_monthly_salary": f"{random.randint(20, 60)}M",
            "employment_start_date": "30 days notice",
            "key_strengths": "Highly adaptable and results-oriented professional.",
            "career_goals": f"To excel as a {title} and take on more leadership responsibilities.",
            "professional_summary": f"<p>A dedicated professional with {exp_years} years of experience in {industry}. Proven track record of delivering results and driving business growth. Passionate about continuous learning and contributing to team success.</p>",
            "professional_history": [
                {
                    "position": title,
                    "companyName": "Previous Company Inc.",
                    "duration": f"2020 - Present",
                    "description": f"Worked extensively in {industry}, handling various projects and driving key initiatives."
                }
            ],
            "linkedin": f"https://linkedin.com/in/{fname.lower()}{lname.lower()}{count}",
            "current_employment_status": random.choice(["Employed", "Unemployed"]),
            "experienced_industry": industry,
            "experienced_job": title,
            "employment_type": "Full-time",
            "notice_period": "30 days",
            "expected_annual_salary": f"{random.randint(200, 800)}M",
            "created_at": random_date(),
            "owner_id": "mock-user-123" if random.random() > 0.3 else "other-user",
            "cv_link": f"https://example.com/cv{count}.pdf" if random.random() > 0.2 else None,
            "is_potential": random.choice([True, False])
        }
        candidates.append(candidate)
        count += 1

candidates_ts_content = "export const MOCK_CANDIDATES = [\n"
for c in candidates:
    candidates_ts_content += "  " + json.dumps(c, ensure_ascii=False) + ",\n"
candidates_ts_content += "];\n"

with open(r"d:\apex_internal\demoApex\src\mocks\candidates.ts", "w", encoding="utf-8") as f:
    f.write(candidates_ts_content)
