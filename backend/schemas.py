from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- User/Profile Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str # "student" or "manager"

class UserCreate(UserBase):
    password: str
    skills: Optional[str] = None
    resume_text: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    skills: Optional[str] = None
    resume_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    skills: Optional[str] = None
    resume_text: Optional[str] = None

# --- Job Schemas ---
class JobBase(BaseModel):
    title: str
    company: str
    description: str
    requirements: Optional[str] = None # Comma-separated list of skills
    location: str
    salary: Optional[str] = None
    job_type: Optional[str] = None # "Full-time", "Part-time", "Contract", "Remote"
    source: Optional[str] = "internal"

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: int
    created_by_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Application Schemas ---
class ApplicationCreate(BaseModel):
    job_id: int
    cover_letter: Optional[str] = None
    resume_text: Optional[str] = None

class ApplicationStatusUpdate(BaseModel):
    status: str # "applied", "reviewing", "interviewing", "offered", "rejected"

# Forward references for relations
class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    student_id: int
    status: str
    applied_at: datetime
    cover_letter: Optional[str] = None
    resume_text: Optional[str] = None
    job: JobResponse
    student: UserResponse

    class Config:
        from_attributes = True

class JobWithApplicantsResponse(JobResponse):
    applications: List[ApplicationResponse] = []

    class Config:
        from_attributes = True

# --- Scraper Schemas ---
class ScrapeRequest(BaseModel):
    query: str
    location: Optional[str] = "Remote"
    platform: Optional[str] = "Indeed" # "Indeed", "LinkedIn", "GitHub Jobs", "All"

# --- AI Match Schemas ---
class ResumeMatchResponse(BaseModel):
    match_score: int # percentage (0-100)
    matching_skills: List[str]
    missing_skills: List[str]
