import requests
from bs4 import BeautifulSoup
import time
import random

def scrape_jobs(target_sites=None):
    """
    Scrapes LinkedIn Guest Jobs API for:
    Roles: SDE, Research, AI/ML
    Location: India
    """
    print("Fetching LIVE Jobs from LinkedIn India...")
    jobs = []
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    # Search Queries
    queries = [
        "Software Engineer India",
        "SDE India",
        "Research Scientist India",
        "Machine Learning Engineer India",
        "Data Scientist India",
        "Full Stack Developer India"
    ]

    for query in queries:
        print(f"Scraping query: {query}...")
        try:
            url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
            params = {
                "keywords": query,
                "location": "India",
                "start": 0
            }
            
            response = requests.get(url, params=params, headers=headers)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                job_cards = soup.find_all('li')
                
                # Take top 10 per query for variety
                for card in job_cards[:10]: 
                    try:
                        title_tag = card.find('h3', class_='base-search-card__title')
                        company_tag = card.find('h4', class_='base-search-card__subtitle')
                        loc_tag = card.find('span', class_='job-search-card__location')
                        link_tag = card.find('a', class_='base-card__full-link')
                        
                        if title_tag and link_tag:
                            title = title_tag.text.strip()
                            company_name = company_tag.text.strip() if company_tag else "Unknown"
                            location = loc_tag.text.strip() if loc_tag else "India"
                            link = link_tag['href'].split('?')[0]
                            
                            jobs.append({
                                "title": title,
                                "company": company_name,
                                "location": location,
                                "description": f"<b>{title}</b> at {company_name}.<br>Location: {location}.<br>Check LinkedIn for details.",
                                "applyLink": link,
                                "source": "LinkedIn",
                                "tags": ["India", "Tech", company_name]
                            })
                    except Exception:
                        continue
            time.sleep(random.uniform(0.5, 1.5))
        except Exception as e:
            print(f"Error scraping {query}: {e}")

    # Naukri.com is extremely hard to scrape via simple requests (captchas/Cloudflare).
    # We will stick to High Quality LinkedIn scraping to avoid breaking the app with IP bans.
    
    print(f"Total Jobs Found: {len(jobs)}")
    return jobs
