from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import os

from database import Base, engine, get_db, User, Job, Application
import schemas
import auth
import scraper
import ai_matching

# Initialize FastAPI App
app = FastAPI(title="TalentScrape API", description="Job Scraper & Tracking Platform API")

# Configure CORS to allow our React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development we can allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database Tables
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")
    
    # Seed default users
    db = next(get_db())
    try:
        # Student
        student = db.query(User).filter(User.email == "student@example.com").first()
        if not student:
            student_obj = User(
                email="student@example.com",
                hashed_password=auth.get_password_hash("student123"),
                full_name="Sample Student",
                role="student",
                skills="React, TypeScript, CSS, HTML, JavaScript",
                resume_text="I am an aspiring Frontend Engineer with experience building responsive, interactive React components, writing clean JavaScript/TypeScript logic, and working with modern CSS layouts."
            )
            db.add(student_obj)
            
        # Manager
        manager = db.query(User).filter(User.email == "manager@example.com").first()
        if not manager:
            manager_obj = User(
                email="manager@example.com",
                hashed_password=auth.get_password_hash("manager123"),
                full_name="Jane Manager",
                role="manager"
            )
            db.add(manager_obj)
            db.commit()
            
            # Seed an initial job posted by manager
            manager = db.query(User).filter(User.email == "manager@example.com").first()
            job_obj = Job(
                title="React Frontend Developer",
                company="Kalpana Software Solution",
                description="We are seeking a junior Frontend Developer proficient in React and TypeScript. You will build user-facing pages, design fluid animations, and work with PostCSS/Tailwind styling sheets.",
                requirements="React, TypeScript, Tailwind CSS, HTML",
                location="Remote",
                salary="$90,000 - $115,000",
                job_type="Remote",
                source="internal",
                created_by_id=manager.id
            )
            db.add(job_obj)
            
        db.commit()
        print("Database seeded with default testing accounts and demo jobs.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

# --- Authentication Routes ---

@app.post("/api/auth/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email is already registered."
        )
    
    hashed_pwd = auth.get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role=user_in.role,
        skills=user_in.skills,
        resume_text=user_in.resume_text
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/auth/login")
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not auth.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "skills": user.skills,
            "resume_text": user.resume_text
        }
    }

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: User = Depends(auth.get_current_user)):
    return current_user

# --- Profile Routes ---

@app.put("/api/profile", response_model=schemas.UserResponse)
def update_profile(profile_in: schemas.ProfileUpdate, current_user: User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name
    if profile_in.skills is not None:
        current_user.skills = profile_in.skills
    if profile_in.resume_text is not None:
        current_user.resume_text = profile_in.resume_text
        
    db.commit()
    db.refresh(current_user)
    return current_user

# --- Job Management & Results Routes ---

@app.get("/api/jobs")
def get_jobs(
    search: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    source: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Job)
    
    if search:
        query = query.filter(
            (Job.title.ilike(f"%{search}%")) |
            (Job.company.ilike(f"%{search}%")) |
            (Job.description.ilike(f"%{search}%"))
        )
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
    if job_type and job_type.lower() != "all":
        query = query.filter(Job.job_type == job_type)
    if source and source.lower() != "all":
        query = query.filter(Job.source == source.lower())
        
    total = query.count()
    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "jobs": jobs
    }

@app.post("/api/jobs", response_model=schemas.JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: schemas.JobCreate,
    current_user: User = Depends(auth.RoleChecker(["manager"])),
    db: Session = Depends(get_db)
):
    job = Job(
        title=job_in.title,
        company=job_in.company,
        description=job_in.description,
        requirements=job_in.requirements,
        location=job_in.location,
        salary=job_in.salary,
        job_type=job_in.job_type,
        source="internal",
        created_by_id=current_user.id
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@app.put("/api/jobs/{job_id}", response_model=schemas.JobResponse)
def update_job(
    job_id: int,
    job_in: schemas.JobCreate,
    current_user: User = Depends(auth.RoleChecker(["manager"])),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this job")
        
    job.title = job_in.title
    job.company = job_in.company
    job.description = job_in.description
    job.requirements = job_in.requirements
    job.location = job_in.location
    job.salary = job_in.salary
    job.job_type = job_in.job_type
    
    db.commit()
    db.refresh(job)
    return job

@app.delete("/api/jobs/{job_id}", status_code=status.HTTP_200_OK)
def delete_job(
    job_id: int,
    current_user: User = Depends(auth.RoleChecker(["manager"])),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")
        
    # Cascade delete applications for this job
    db.query(Application).filter(Application.job_id == job_id).delete()
    db.delete(job)
    db.commit()
    return {"message": "Job and its applications deleted successfully"}

# --- Scraper Router ---

@app.post("/api/scrape")
def scrape_jobs(
    request: schemas.ScrapeRequest,
    current_user: User = Depends(auth.RoleChecker(["student"])),
    db: Session = Depends(get_db)
):
    try:
        new_jobs = scraper.run_scraper(db, request)
        return {
            "status": "success",
            "message": f"Successfully scraped and added {new_jobs} new jobs to the platform.",
            "jobs_found": new_jobs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scraper execution failed: {str(e)}")

# --- Application Management Routes ---

@app.post("/api/applications", status_code=status.HTTP_201_CREATED)
def apply_to_job(
    app_in: schemas.ApplicationCreate,
    current_user: User = Depends(auth.RoleChecker(["student"])),
    db: Session = Depends(get_db)
):
    # Check if job exists
    job = db.query(Job).filter(Job.id == app_in.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # Check duplicate application
    existing = db.query(Application).filter(
        Application.job_id == app_in.job_id,
        Application.student_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied to this job.")
        
    application = Application(
        job_id=app_in.job_id,
        student_id=current_user.id,
        status="applied",
        cover_letter=app_in.cover_letter,
        resume_text=app_in.resume_text if app_in.resume_text else current_user.resume_text
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    
    # Log simulated email notification
    print(f"[MOCK EMAIL NOTIFICATION] Sent to Student ({current_user.email}) and Manager: Confirmation for Application ID {application.id} for the role '{job.title}' at '{job.company}'.")
    
    return {
        "status": "success",
        "message": "Application submitted successfully.",
        "application_id": application.id
    }

@app.get("/api/applications", response_model=List[schemas.ApplicationResponse])
def get_application_history(
    current_user: User = Depends(auth.RoleChecker(["student"])),
    db: Session = Depends(get_db)
):
    # Retrieve student applications with related job details
    apps = db.query(Application).options(
        joinedload(Application.job),
        joinedload(Application.student)
    ).filter(Application.student_id == current_user.id).order_by(Application.applied_at.desc()).all()
    return apps

@app.get("/api/jobs/{job_id}/applicants", response_model=List[schemas.ApplicationResponse])
def get_job_applicants(
    job_id: int,
    current_user: User = Depends(auth.RoleChecker(["manager"])),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view applicants for this job")
        
    apps = db.query(Application).options(
        joinedload(Application.job),
        joinedload(Application.student)
    ).filter(Application.job_id == job_id).order_by(Application.applied_at.desc()).all()
    return apps

@app.put("/api/applications/{app_id}/status")
def update_application_status(
    app_id: int,
    status_in: schemas.ApplicationStatusUpdate,
    current_user: User = Depends(auth.RoleChecker(["manager"])),
    db: Session = Depends(get_db)
):
    application = db.query(Application).options(
        joinedload(Application.job),
        joinedload(Application.student)
    ).filter(Application.id == app_id).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Check authorization (manager must own the job)
    if application.job.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update status for this application")
        
    application.status = status_in.status
    db.commit()
    db.refresh(application)
    
    # Print mock email log in console
    print(f"[MOCK EMAIL NOTIFICATION] Sent to Student ({application.student.email}): "
          f"Your application status for '{application.job.title}' at '{application.job.company}' "
          f"has been updated to: {application.status.upper()}.")
          
    return {
        "status": "success",
        "message": f"Application status updated to {status_in.status}.",
        "application": {
            "id": application.id,
            "status": application.status,
            "student_email": application.student.email
        }
    }

# --- AI Match & Recommendation Routes ---

@app.get("/api/ai/match/{job_id}", response_model=schemas.ResumeMatchResponse)
def get_job_match_score(
    job_id: int,
    current_user: User = Depends(auth.RoleChecker(["student"])),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return ai_matching.calculate_match(current_user.skills, job.requirements)

@app.get("/api/ai/recommendations")
def get_job_recommendations(
    current_user: User = Depends(auth.RoleChecker(["student"])),
    db: Session = Depends(get_db)
):
    recs = ai_matching.recommend_jobs(current_user, db)
    
    formatted_recs = []
    for job, score in recs:
        formatted_recs.append({
            "job": job,
            "match_score": score
        })
        
    return formatted_recs
