import json
import random
from datetime import datetime, timedelta

candidates = []

first_names = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Vo", "Dang", "Bui", "Do", "Ho", "Ngo", "Duong"]
middle_names = ["Van", "Thi", "Minh", "Huu", "Duc", "Thanh", "Ngoc", "Quang", "Tuan", "Hoang", "Anh", "Mai"]
last_names = ["An", "Bich", "Cuong", "Son", "Phuong", "Linh", "Khoa", "Nam", "Tien", "Trang", "Lan", "Hung"]

titles = [
    "Senior Frontend Engineer", "Product Marketing Manager", "Backend Developer (Go)",
    "Head of Talent Acquisition", "Data Engineer", "B2B Sales Executive",
    "Chief Financial Officer", "Senior UX/UI Designer", "Supply Chain Manager",
    "Mobile Developer", "Content Creator", "AI/ML Engineer", "Legal Counsel",
    "Customer Success Manager", "QA Automation Engineer", "Chief Marketing Officer",
    "DevOps Architect", "Production Manager", "Business Analyst", "Social Media Executive"
]

industries = ["IT - Software", "Marketing", "IT - Software", "HR", "IT - Software", "Sales", "Finance", "Design", "Logistics", "IT - Software", "Marketing", "IT - Software", "Legal", "Sales", "IT - Software", "Marketing", "IT - Software", "Manufacturing", "IT - Software", "Marketing"]

def random_date():
    return (datetime.now() - timedelta(days=random.randint(1, 100))).isoformat()

def random_birth():
    return (datetime.now() - timedelta(days=random.randint(22*365, 45*365))).strftime("%Y-%m-%d")

for i in range(1, 21):
    fname = random.choice(first_names)
    mname = random.choice(middle_names)
    lname = random.choice(last_names)
    full_name = f"{fname} {mname} {lname}"
    
    email = f"{fname.lower()}.{lname.lower()}{i}@example.com"
    phone = f"09{random.randint(10000000, 99999999)}"
    
    title = titles[i-1]
    industry = industries[i-1]
    
    exp_years = random.randint(1, 15)
    
    candidate = {
        "id": f"candidate-{i}",
        "cdd_code": f"CDD-{i:04d}",
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
        "current_monthly_salary": f"{random.randint(10, 50)}M",
        "expected_monthly_salary": f"{random.randint(15, 60)}M",
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
        "linkedin": f"https://linkedin.com/in/{fname.lower()}{lname.lower()}",
        "current_employment_status": random.choice(["Employed", "Unemployed"]),
        "experienced_industry": industry,
        "experienced_job": title,
        "employment_type": "Full-time",
        "notice_period": "30 days",
        "expected_annual_salary": f"{random.randint(200, 800)}M",
        "created_at": random_date(),
        "owner_id": "mock-user-123" if random.random() > 0.3 else "other-user",
        "cv_link": f"https://example.com/cv{i}.pdf" if random.random() > 0.2 else None,
        "is_potential": random.choice([True, False])
    }
    candidates.append(candidate)

candidates_ts_content = "export const MOCK_CANDIDATES = [\n"
for c in candidates:
    candidates_ts_content += "  " + json.dumps(c, ensure_ascii=False) + ",\n"
candidates_ts_content += "];\n"

with open(r"d:\apex_internal\demoApex\src\mocks\candidates.ts", "w", encoding="utf-8") as f:
    f.write(candidates_ts_content)
