# TalentScrape - Job Scraper & Applicant Tracking Platform

Welcome to **TalentScrape**, a full-stack platform built as a take-home assessment for the SDE-1 position at **Kalpana Software Solution**.

This project provides role-based workspaces for both **Students** (to search/scrape listings, match resumes using AI, and apply) and **Hiring Managers** (to post job listings, check applicant lists, and track progress).

---

## 🛠️ Tech Stack
- **Frontend**: React.js, TypeScript, Tailwind CSS (v4), React Router DOM (v6), Lucide Icons
- **Backend**: FastAPI (Python 3.12), SQLite (via SQLAlchemy ORM), JWT (JOSE library), Passlib (Bcrypt)

---

## 🚀 Setup & Execution Guide

Open two terminal windows to run the frontend and backend servers concurrently.

### Terminal 1: Backend Setup & Run
```bash
# 1. Navigate to the backend directory
cd backend

# 2. Activate the virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows Command Prompt:
.\venv\Scripts\activate.bat

# 3. Start the FastAPI server
uvicorn main:app --reload --port 8000
```
*The database file `jobs.db` is automatically created on startup. Swagger docs will be hosted at [http://localhost:8000/docs](http://localhost:8000/docs).*

### Terminal 2: Frontend Setup & Run
```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Run the development server
npm run dev
```
*The React app will launch at [http://localhost:5173](http://localhost:5173).*

---

## 🔑 Default Login Credentials

For testing purposes, you can register new accounts inside the application UI, or log in with these pre-registered schemas:

### 👨‍🎓 Student Account
- **Email**: `student@example.com`
- **Password**: `student123`

### 💼 Hiring Manager Account
- **Email**: `manager@example.com`
- **Password**: `manager123`

---

## 💎 Features & Customizations
- **Simulated Web Scraper**: Students can search terms (e.g. "React", "Python") and scrape listings from LinkedIn, Indeed, and GitHub Jobs in real time, accompanied by live step-by-step loaders.
- **AI Resume Match Score**: Recalculates resume-to-job compatibility scores based on custom skills declared in the user profile.
- **Applicant Tracking System (ATS)**: Hiring managers can change applicant statuses, triggering console-logged simulated email notifications.
- **Animated Glassmorphic Design**: Clean, dark mode layout featuring floating cards, sliding modals, and backdrop blurs.
