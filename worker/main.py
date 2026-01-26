from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pdfplumber
import io
import random
import requests
from scraper import scrape_jobs

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_pdf(file_bytes):
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() + "\n"
            return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

@app.post("/predict-shortlist-file")
async def predict_shortlist_file(
    resume: UploadFile = File(...), 
    job_description: str = Form(...)
):
    # Read file
    content = await resume.read()
    
    if resume.filename.endswith(".pdf"):
        resume_text = extract_text_from_pdf(content)
    else:
        # Fallback for text/other
        resume_text = content.decode("utf-8", errors="ignore")

    # Analysis Logic
    jd_lower = job_description.lower()
    resume_lower = resume_text.lower()
    
    # Extract keywords from JD (Simple frequency based or hardcoded common tech)
    common_tech = ["python", "javascript", "react", "node", "sql", "aws", "docker", "kubernetes", "system design", "java", "c++", "typescript", "git"]
    
    found_keywords = []
    missing_keywords = []
    
    # Check which common keywords are in JD
    target_keywords = [k for k in common_tech if k in jd_lower]
    
    # Check match against Resume
    for k in target_keywords:
        if k in resume_lower:
            found_keywords.append(k)
        else:
            missing_keywords.append(k)
            
    # Calculate Score
    if not target_keywords: 
        # Fallback if no known keywords in JD
        match_ratio = 0.5 
    else:
        match_ratio = len(found_keywords) / len(target_keywords)
    
    probability = min(0.1 + (match_ratio * 0.8), 0.98)
    
    # Generate Suggestions
    suggestions = []
    if missing_keywords:
        suggestions.append(f"Consider adding these skills found in the JD: {', '.join(missing_keywords[:3])}.")
    if len(resume_text) < 500:
        suggestions.append("Your resume seems short. Elaborate on your projects and experience.")
    if "quantified" not in resume_lower and "%" not in resume_lower:
        suggestions.append("Try to quantify your achievements (e.g., 'Improved performance by 20%').")
    if probability < 0.5:
        suggestions.append("The formatting might be preventing parsing, or the skill gap is significant.")

    return {
        "shortlist_probability": round(probability, 2),
        "ats_score": int(probability * 100),
        "missing_keywords": missing_keywords,
        "suggestions": suggestions
    }

@app.post("/parse-resume")
async def parse_resume(resume: UploadFile = File(...)):
    content = await resume.read()
    if resume.filename.endswith(".pdf"):
        text = extract_text_from_pdf(content)
    else:
        text = content.decode("utf-8", errors="ignore")
    return {"text": text}

@app.post("/predict-shortlist-text")
async def predict_shortlist_text(
    resume_text: str = Form(...), 
    job_description: str = Form(...)
):
    # Analysis Logic (Duplicated for simplicity, could refactor)
    jd_lower = job_description.lower()
    resume_lower = resume_text.lower()
    
    # Extract keywords from JD
    common_tech = ["python", "javascript", "react", "node", "sql", "aws", "docker", "kubernetes", "system design", "java", "c++", "typescript", "git"]
    found_keywords = []
    missing_keywords = []
    target_keywords = [k for k in common_tech if k in jd_lower]
    
    for k in target_keywords:
        if k in resume_lower: found_keywords.append(k)
        else: missing_keywords.append(k)
            
    if not target_keywords: match_ratio = 0.5 
    else: match_ratio = len(found_keywords) / len(target_keywords)
    
    probability = min(0.1 + (match_ratio * 0.8), 0.98)
    
    suggestions = []
    if missing_keywords: suggestions.append(f"Missing skills: {', '.join(missing_keywords[:3])}.")
    if len(resume_text) < 500: suggestions.append("Resume is too short.")
    if probability < 0.5: suggestions.append("Low match score.")

    return {
        "shortlist_probability": round(probability, 2),
        "ats_score": int(probability * 100),
        "missing_keywords": missing_keywords,
        "suggestions": suggestions
    }

@app.post("/trigger-scrape")
def trigger_scrape():
    jobs = scrape_jobs(["remote"])
    
    # Push to Node API
    count = 0
    for job in jobs:
        try:
            res = requests.post("http://localhost:5000/api/jobs", json=job)
            if res.status_code == 201:
                count += 1
        except Exception as e:
            print(f"Failed to push job: {e}")
            
    return {"message": f"Scraped and pushed {count} jobs"}
