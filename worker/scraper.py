import requests
from bs4 import BeautifulSoup
import time
import random

def scrape_jobs(target_sites=None):
    """
    Scrapes LinkedIn Guest Jobs API specifically for:
    Role: Software Engineer (SDE)
    Location: India
    """
    print("Fetching LIVE SDE jobs from LinkedIn India...")
    jobs = []
    
    # We will search for these specific high-value titles
    keywords = [
        "Software Engineer",
        "SDE",
        "Frontend Developer",
        "Backend Developer",
        "Full Stack Engineer"
    ]
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    # We'll rely on the 'companies' list to ensure diversity or just generic search?
    # User asked for "all the jobs based in india", so generic keyword search is better than specific company loop
    # but specific company search yields higher quality usually. Let's do a mix or generic.
    # Actually, iterating by company is safer for the Guest API to avoid rate limits on a single broad query.
    
    target_companies = [
        "Google", "Microsoft", "Meta", "Amazon", "Flipkart", "Uber", 
        "Swiggy", "Zomato", "PhonePe", "Razorpay", "Cred", "Oracle", "Cisco"
    ]

    for company in target_companies:
        print(f"Scraping {company}...")
        try:
            url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
            params = {
                "keywords": f"{company} Software Engineer",
                "location": "India",
                "start": 0
            }
            
            response = requests.get(url, params=params, headers=headers)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                job_cards = soup.find_all('li')
                
                # Take top 3 per company to keep it fast but diverse
                for card in job_cards[:3]: 
                    try:
                        title_tag = card.find('h3', class_='base-search-card__title')
                        company_tag = card.find('h4', class_='base-search-card__subtitle')
                        loc_tag = card.find('span', class_='job-search-card__location')
                        link_tag = card.find('a', class_='base-card__full-link')
                        
                        if title_tag and link_tag:
                            title = title_tag.text.strip()
                            company_name = company_tag.text.strip() if company_tag else company
                            location = loc_tag.text.strip() if loc_tag else "India"
                            link = link_tag['href'].split('?')[0] # Clean URL
                            
                            jobs.append({
                                "title": title,
                                "company": company_name,
                                "location": location,
                                "description": f"<b>{title}</b> at {company_name}. <br>Location: {location}. <br>Apply via LinkedIn.",
                                "applyLink": link,
                                "source": "LinkedIn",
                                "tags": ["SDE", "India", company_name]
                            })
                    except Exception as e:
                        continue
            time.sleep(random.uniform(0.5, 1.5)) 
            
        except Exception as e:
            print(f"Error scraping {company}: {e}")

    print(f"Total SDE Jobs Found: {len(jobs)}")
    return jobs
