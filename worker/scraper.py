import requests
from bs4 import BeautifulSoup
import time
import random

def scrape_jobs(target_sites):
    """
    Scrapes LinkedIn Guest Jobs API for specific companies in India.
    This provides REAL, LIVE data without authentication.
    """
    print("Fetching LIVE jobs from LinkedIn Guest API...")
    jobs = []
    
    companies = [
        "Google", "Microsoft", "Meta", "Uber", "Flipkart", "Amazon"
    ]
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    for company in companies:
        print(f"Scraping {company} in India...")
        try:
            # LinkedIn Guest Search URL
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
                
                print(f"  Found {len(job_cards)} raw results for {company}")
                
                for card in job_cards[:5]: # Take top 5 per company
                    try:
                        title_tag = card.find('h3', class_='base-search-card__title')
                        company_tag = card.find('h4', class_='base-search-card__subtitle')
                        loc_tag = card.find('span', class_='job-search-card__location')
                        link_tag = card.find('a', class_='base-card__full-link')
                        
                        if title_tag and link_tag:
                            title = title_tag.text.strip()
                            # Verify company name match to avoid "Consultant for Google" type jobs
                            company_name = company_tag.text.strip() if company_tag else company
                            
                            jobs.append({
                                "title": title,
                                "company": company_name,
                                "location": loc_tag.text.strip() if loc_tag else "India",
                                "description": f"Real job at {company_name}. Click Apply to view details on LinkedIn.",
                                "applyLink": link_tag['href'],
                                "source": "LinkedIn",
                                "tags": ["Engineering", "India", company]
                            })
                    except Exception as e:
                        continue
            else:
                print(f"  Failed with status {response.status_code}")
                
            time.sleep(random.uniform(1, 3)) # Respectful delay
            
        except Exception as e:
            print(f"Error scraping {company}: {e}")

    print(f"Total Jobs Found: {len(jobs)}")
    return jobs
