import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./jobs.db")

# SQLite needs check_same_thread configuration, other databases do not
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False) # "student" or "manager"
    skills = Column(Text, nullable=True) # Comma-separated list of skills, e.g., "React, Python"
    resume_text = Column(Text, nullable=True) # Custom profile summary or resume text
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    jobs = relationship("Job", back_populates="creator")
    applications = relationship("Application", back_populates="student")

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True) # Comma-separated list, e.g., "React, Tailwind, CSS"
    location = Column(String, nullable=False)
    salary = Column(String, nullable=True)
    job_type = Column(String, nullable=True) # "Full-time", "Part-time", "Contract", "Remote"
    source = Column(String, default="internal") # "internal", "indeed", "linkedin", "github"
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job")

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="applied") # "applied", "reviewing", "interviewing", "offered", "rejected"
    applied_at = Column(DateTime, default=datetime.datetime.utcnow)
    cover_letter = Column(Text, nullable=True)
    resume_text = Column(Text, nullable=True) # Saved resume at application time
    
    # Relationships
    job = relationship("Job", back_populates="applications")
    student = relationship("User", back_populates="applications")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
