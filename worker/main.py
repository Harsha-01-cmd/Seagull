from fastapi import FastAPI, HTTPException, UploadFile, File, Form
import os
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
        try:
            resume_text = content.decode("utf-8", errors="ignore")
        except:
            resume_text = ""

    return analyze_resume(resume_text, job_description)

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
    return analyze_resume(resume_text, job_description)

def analyze_resume(resume_text: str, job_description: str):
    try:
        # Load Spacy Model (Cached)
        import spacy
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        
        try:
            nlp = spacy.load("en_core_web_sm")
        except:
            # Fallback if model not found (dev env without download)
            # In production Docker, it should be there.
            import spacy.cli
            spacy.cli.download("en_core_web_sm")
            nlp = spacy.load("en_core_web_sm")
        
        # 1. Cosine Similarity (Content Match)
        if not resume_text or not job_description:
            return {
                "shortlist_probability": 0.0,
                "ats_score": 0,
                "missing_keywords": [],
                "suggestions": ["Please provide both resume and job description."]
            }

        documents = [resume_text, job_description]
        tfidf = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf.fit_transform(documents)
        similarity_score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        
        # 2. Skill Extraction (Simple Rule-based + NER)
        doc_jd = nlp(job_description)
        doc_resume = nlp(resume_text)
        
        common_tech = {"python", "javascript", "react", "node", "sql", "aws", "docker", "kubernetes", "system design", "java", "c++", "typescript", "git", "communication", "leadership", "agile", "scrum", "machine learning", "tensorflow", "pytorch", "pandas", "numpy", "html", "css"}
        
        jd_tokens = {token.lemma_.lower() for token in doc_jd if not token.is_stop and token.is_alpha}
        resume_tokens = {token.lemma_.lower() for token in doc_resume if not token.is_stop and token.is_alpha}
        
        target_skills = {k for k in jd_tokens if k in common_tech}
        found_skills = {k for k in resume_tokens if k in target_skills}
        missing_skills = list(target_skills - found_skills)
        
        keyword_match_ratio = len(found_skills) / len(target_skills) if target_skills else 1.0
        
        final_probability = (similarity_score * 0.7) + (keyword_match_ratio * 0.3)
        final_probability = min(final_probability, 0.99)
        
        suggestions = []
        if missing_skills:
            suggestions.append(f"Missing key skills: {', '.join(missing_skills[:5])}.")
        if similarity_score < 0.3:
            suggestions.append("The phrasing of your resume is very different from the job description. Try to mirror the language used in the JD.")
        if len(resume_text) < 500:
            suggestions.append("Your resume seems short. Elaborate on your projects.")
            
    except Exception as e:
        print(f"Analysis Error: {e}")
        final_probability = 0.5
        missing_skills = []
        suggestions = ["Error analyzing resume. Please ensure it is a valid text/PDF."]

    return {
        "shortlist_probability": round(float(final_probability), 2),
        "ats_score": int(final_probability * 100),
        "missing_keywords": missing_skills,
        "suggestions": suggestions
    }


@app.post("/trigger-scrape")
def trigger_scrape():
    jobs = scrape_jobs(["remote"])
    
    # Push to Node API
    count = 0
    server_url = os.getenv("SERVER_URL", "http://localhost:5000")
    for job in jobs:
        try:
            res = requests.post(f"{server_url}/api/jobs", json=job)
            if res.status_code == 201:
                count += 1
        except Exception as e:
            print(f"Failed to push job: {e}")
            
    return {"message": f"Scraped and pushed {count} jobs"}

@app.on_event("startup")
async def startup_event():
    import threading
    def run_initial_scrape():
        print("Starting initial scrape...")
        try:
            trigger_scrape()
            print("Initial scrape completed.")
        except Exception as e:
            print(f"Initial scrape failed: {e}")
            
    threading.Thread(target=run_initial_scrape, daemon=True).start()
