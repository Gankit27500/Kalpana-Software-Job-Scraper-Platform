import random
from sqlalchemy.orm import Session
from database import Job
import schemas

MOCK_COMPANIES = [
    "Google", "Meta", "Amazon", "Microsoft", "Stripe", "Vercel", 
    "Netflix", "Supabase", "Retool", "Airbnb", "Uber", "Spotify",
    "OpenAI", "Anthropic", "Linear", "Figma", "Slack", "Zoom"
]
MOCK_LOCATIONS = ["Remote", "New York, NY", "San Francisco, CA", "Seattle, WA", "Austin, TX", "Boston, MA", "London, UK"]
MOCK_SALARIES = ["$85,000 - $115,000", "$120,000 - $155,000", "$165,000 - $210,000", "$95,000 - $135,000", "$145,000 - $190,000", "$70,000 - $100,000"]
MOCK_JOB_TYPES = ["Full-time", "Part-time", "Contract", "Remote"]

def generate_mock_jobs(query: str, location: str, platform: str) -> list:
    jobs = []
    q_lower = query.lower()
    
    # 1. Determine job family based on query keyword
    if any(k in q_lower for k in ["react", "frontend", "web", "html", "css", "javascript", "typescript", "angular", "vue"]):
        titles = ["Frontend Engineer", "React Developer", "Senior UI Developer", "Software Engineer - Frontend", "Web Specialist"]
        reqs = ["React", "TypeScript", "Tailwind CSS", "JavaScript", "HTML", "CSS", "Git", "REST APIs"]
        desc = "We are seeking a talented Frontend developer to join our product team. In this role, you will build user-friendly web interfaces, optimize frontend performance, design state management solutions, and collaborate with UI/UX designers to create stunning, responsive web applications."
    elif any(k in q_lower for k in ["python", "backend", "fastapi", "django", "node", "express", "java", "c#", "golang", "sql", "api"]):
        titles = ["Backend Developer", "Python Software Engineer", "FastAPI Developer", "Software Engineer - Backend", "Database & API Developer"]
        reqs = ["Python", "FastAPI", "SQLAlchemy", "PostgreSQL", "Docker", "Git", "REST APIs", "Node.js", "Express"]
        desc = "Seeking an experienced Backend Engineer to scale our core microservices. You will build clean, secure REST APIs, optimize complex database queries, write automated unit tests, and integrate with third-party service providers."
    elif any(k in q_lower for k in ["data", "ml", "ai", "machine", "intelligence", "numpy", "pandas", "pytorch", "tensorflow", "analytics"]):
        titles = ["Data Scientist", "Machine Learning Engineer", "AI Solutions Developer", "Data Analyst", "Analytics Engineer"]
        reqs = ["Python", "Pandas", "PyTorch", "SQL", "Machine Learning", "Data Visualization", "TensorFlow", "NumPy"]
        desc = "Join our AI research and development team to analyze complex datasets and build predictive models. You will train deep learning models, deploy ML pipelines in cloud environments, and translate numbers into clear, actionable business insights."
    else:
        titles = ["Software Engineer", "Full Stack Developer", "Associate Software Engineer", "Technology Analyst", "Full Stack Engineer"]
        reqs = ["JavaScript", "Python", "SQL", "React", "Node.js", "Git", "Docker", "TypeScript"]
        desc = "We are seeking a versatile Full Stack Software Developer. In this role, you will work across both client-side and server-side components, write clean modular code, collaborate with cross-functional product teams, and solve complex application challenges."

    selected_companies = random.sample(MOCK_COMPANIES, k=min(4, len(MOCK_COMPANIES)))
    platforms = [platform] if (platform and platform.lower() != "all") else ["Indeed", "LinkedIn", "GitHub Jobs"]

    for company in selected_companies:
        for p in platforms:
            title = random.choice(titles)
            loc = location if location else random.choice(MOCK_LOCATIONS)
            sal = random.choice(MOCK_SALARIES)
            j_type = "Remote" if "remote" in loc.lower() else random.choice(MOCK_JOB_TYPES)
            
            # Select random subset of requirements (at least 3)
            k_req = random.randint(3, len(reqs))
            selected_reqs = random.sample(reqs, k=k_req)
            
            jobs.append({
                "title": f"{title}",
                "company": company,
                "description": f"{desc} This job posting has been imported from {p}.",
                "requirements": ", ".join(selected_reqs),
                "location": loc,
                "salary": sal,
                "job_type": j_type,
                "source": p.lower(),
                "created_by_id": None
            })
    return jobs

def run_scraper(db: Session, request: schemas.ScrapeRequest) -> int:
    mock_jobs = generate_mock_jobs(request.query, request.location, request.platform)
    jobs_saved = 0
    
    for mj in mock_jobs:
        # Check if job already exists in database (avoid duplicating)
        existing = db.query(Job).filter(
            Job.title == mj["title"],
            Job.company == mj["company"],
            Job.location == mj["location"],
            Job.source == mj["source"]
        ).first()
        
        if not existing:
            job_obj = Job(
                title=mj["title"],
                company=mj["company"],
                description=mj["description"],
                requirements=mj["requirements"],
                location=mj["location"],
                salary=mj["salary"],
                job_type=mj["job_type"],
                source=mj["source"],
                created_by_id=None
            )
            db.add(job_obj)
            jobs_saved += 1
            
    db.commit()
    return jobs_saved
