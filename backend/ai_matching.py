from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from database import Job, User
import schemas

def normalize_skill(skill: str) -> str:
    """Normalizes a skill string for comparison (lowercase and whitespace stripping)."""
    s = skill.strip().lower()
    # Simple common mapping aliases
    aliases = {
        "javascript": "js",
        "typescript": "ts",
        "react.js": "react",
        "reactjs": "react",
        "fastapi": "fast api",
        "tailwind": "tailwind css",
        "mongodb": "mongo",
        "postgresql": "postgres",
        "ms SQL": "sql",
        "machine learning": "ml",
        "artificial intelligence": "ai"
    }
    return aliases.get(s, s)

def calculate_match(user_skills_str: Optional[str], job_reqs_str: Optional[str]) -> schemas.ResumeMatchResponse:
    if not job_reqs_str or job_reqs_str.strip() == "":
        return schemas.ResumeMatchResponse(match_score=100, matching_skills=[], missing_skills=[])
        
    job_reqs = [r.strip() for r in job_reqs_str.split(",") if r.strip()]
    normalized_job_reqs = {normalize_skill(r): r for r in job_reqs}
    
    if not user_skills_str or user_skills_str.strip() == "":
        return schemas.ResumeMatchResponse(match_score=0, matching_skills=[], missing_skills=job_reqs)
        
    user_skills = [s.strip() for s in user_skills_str.split(",") if s.strip()]
    normalized_user_skills = {normalize_skill(s) for s in user_skills}
    
    matching_skills = []
    missing_skills = []
    
    # Compare normalized values but return original strings for clarity in UI
    for norm_req, orig_req in normalized_job_reqs.items():
        # Check direct or substring matches
        matched = False
        for norm_user in normalized_user_skills:
            if norm_req == norm_user or norm_req in norm_user or norm_user in norm_req:
                matched = True
                break
        
        if matched:
            matching_skills.append(orig_req)
        else:
            missing_skills.append(orig_req)
            
    # Calculate score percentage
    score = int((len(matching_skills) / len(job_reqs)) * 100) if job_reqs else 100
    
    return schemas.ResumeMatchResponse(
        match_score=score,
        matching_skills=matching_skills,
        missing_skills=missing_skills
    )

def recommend_jobs(user: User, db: Session) -> List[Tuple[Job, int]]:
    jobs = db.query(Job).all()
    recommendations = []
    
    for job in jobs:
        match_res = calculate_match(user.skills, job.requirements)
        recommendations.append((job, match_res.match_score))
        
    # Sort recommendations by score descending
    recommendations.sort(key=lambda x: x[1], reverse=True)
    return recommendations
