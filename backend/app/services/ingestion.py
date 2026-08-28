"""
Job Ingestion Engine — Adapter Pattern
Every ATS source implements JobSourceAdapter.

Sources:
  - Greenhouse (ATS API)       — Airbnb, Stripe, Figma, Discord, Coinbase...
  - Lever (ATS API)            — Palantir...
  - Ashby (ATS GraphQL)        — OpenAI, Anthropic, Linear, Vercel, Notion...
  - JobSpyAdapter              — LinkedIn, Indeed, Glassdoor, ZipRecruiter (via python-jobspy)
  - RemoteOKAdapter            — Free public JSON API (remote software roles)
  - InternshalaAdapter         — India's top internship platform (custom scraper)
  - WellfoundAdapter           — Startup jobs & internships (AngelList successor)
"""
from __future__ import annotations
import logging
import time
import random
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional

logger = logging.getLogger(__name__)


@dataclass
class RawJob:
    """Normalised job data structure — what every adapter must produce."""
    external_id: str
    title: str
    company_name: str
    company_domain: Optional[str]
    location: Optional[str]
    work_type: Optional[str]        # remote | hybrid | onsite
    experience_level: Optional[str]
    salary_min: Optional[float]
    salary_max: Optional[float]
    salary_currency: str
    apply_url: str
    description: Optional[str]
    skills: List[str] = field(default_factory=list)
    posted_at: Optional[datetime] = None
    raw_data: Optional[dict] = None


def compute_job_freshness(posted_at: Optional[datetime]) -> str:
    """Compute job freshness indicator: VERY_FRESH | FRESH | AGING | STALE"""
    if not posted_at:
        return "FRESH"
    try:
        from datetime import timezone
        now = datetime.now(timezone.utc)
        if posted_at.tzinfo is None:
            posted_at = posted_at.replace(tzinfo=timezone.utc)
        diff_hours = (now - posted_at).total_seconds() / 3600.0
        if diff_hours <= 2:
            return "VERY_FRESH"
        elif diff_hours <= 24:
            return "FRESH"
        elif diff_hours <= 168:  # 7 days
            return "AGING"
        else:
            return "STALE"
    except Exception:
        return "FRESH"


def compute_hiring_signal(posted_at: Optional[datetime], source: Optional[str] = None) -> str:
    """Compute hiring activity signal: HIGH | MEDIUM | LOW | UNKNOWN"""
    freshness = compute_job_freshness(posted_at)
    if source in ("greenhouse", "lever", "ashby"):
        return "HIGH" if freshness in ("VERY_FRESH", "FRESH") else "MEDIUM"
    if freshness in ("VERY_FRESH", "FRESH"):
        return "HIGH"
    elif freshness == "AGING":
        return "MEDIUM"
    else:
        return "LOW"



class JobSourceAdapter(ABC):
    """Base adapter interface — all ATS scrapers must implement this."""

    source_name: str = "unknown"

    @abstractmethod
    def fetch_jobs(self) -> List[RawJob]:
        """Fetch, normalise and return jobs from the source."""
        raise NotImplementedError


# ─── ATS Adapters ──────────────────────────────────────────────────────────────

class GreenhouseAdapter(JobSourceAdapter):
    """
    Fetches jobs from the public Greenhouse board API.
    API endpoint: https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
    """
    source_name = "greenhouse"

    def __init__(self, board_token: str, company_name: str, company_domain: Optional[str] = None):
        self.board_token = board_token
        self.company_name = company_name
        self.company_domain = company_domain

    def fetch_jobs(self) -> List[RawJob]:
        import httpx
        url = f"https://boards-api.greenhouse.io/v1/boards/{self.board_token}/jobs?content=true"
        try:
            response = httpx.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()
            return [self._normalise(j) for j in data.get("jobs", [])]
        except Exception as e:
            logger.error(f"Greenhouse fetch failed for {self.board_token}: {e}")
            return []

    def _normalise(self, j: dict) -> RawJob:
        location = j.get("location", {}).get("name", "")
        work_type = "remote" if "remote" in location.lower() else "onsite"
        return RawJob(
            external_id=str(j["id"]),
            title=j.get("title", ""),
            company_name=self.company_name,
            company_domain=self.company_domain,
            location=location,
            work_type=work_type,
            experience_level=None,
            salary_min=None,
            salary_max=None,
            salary_currency="USD",
            apply_url=j.get("absolute_url", ""),
            description=j.get("content", ""),
            skills=[],
            posted_at=datetime.fromisoformat(j["updated_at"].replace("Z", "+00:00"))
            if j.get("updated_at")
            else None,
            raw_data=j,
        )


class LeverAdapter(JobSourceAdapter):
    """
    Fetches jobs from Lever's public posting API.
    API: https://api.lever.co/v0/postings/{site}?mode=json
    """
    source_name = "lever"

    def __init__(self, site: str, company_name: str, company_domain: Optional[str] = None):
        self.site = site
        self.company_name = company_name
        self.company_domain = company_domain

    def fetch_jobs(self) -> List[RawJob]:
        import httpx
        url = f"https://api.lever.co/v0/postings/{self.site}?mode=json"
        try:
            response = httpx.get(url, timeout=30)
            response.raise_for_status()
            return [self._normalise(j) for j in response.json()]
        except Exception as e:
            logger.error(f"Lever fetch failed for {self.site}: {e}")
            return []

    def _normalise(self, j: dict) -> RawJob:
        categories = j.get("categories", {})
        commitment = categories.get("commitment", "").lower()
        work_type = "remote" if "remote" in commitment else (
            "hybrid" if "hybrid" in commitment else "onsite"
        )
        return RawJob(
            external_id=j.get("id", ""),
            title=j.get("text", ""),
            company_name=self.company_name,
            company_domain=self.company_domain,
            location=categories.get("location"),
            work_type=work_type,
            experience_level=None,
            salary_min=None,
            salary_max=None,
            salary_currency="USD",
            apply_url=j.get("hostedUrl", ""),
            description=j.get("descriptionPlain", ""),
            skills=[t for t in j.get("tags", [])],
            posted_at=datetime.fromtimestamp(j["createdAt"] / 1000)
            if j.get("createdAt")
            else None,
            raw_data=j,
        )


class AshbyAdapter(JobSourceAdapter):
    """
    Fetches jobs from Ashby's public job board API.
    API: https://jobs.ashbyhq.com/api/non-user-graphql (job board slug)
    """
    source_name = "ashby"

    def __init__(self, organization_slug: str, company_name: str, company_domain: Optional[str] = None):
        self.organization_slug = organization_slug
        self.company_name = company_name
        self.company_domain = company_domain

    def fetch_jobs(self) -> List[RawJob]:
        import httpx
        url = "https://jobs.ashbyhq.com/api/non-user-graphql"
        query = {
            "operationName": "ApiJobBoardWithTeams",
            "variables": {"organizationHostedJobsPageName": self.organization_slug},
            "query": """
                query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) {
                    jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) {
                        jobPostings {
                            id title isRemote locationName employmentType
                            externalLink publishedDate
                        }
                    }
                }
            """,
        }
        try:
            response = httpx.post(url, json=query, timeout=30)
            response.raise_for_status()
            data = response.json()
            postings = data.get("data", {}).get("jobBoard", {}).get("jobPostings", [])
            return [self._normalise(j) for j in postings]
        except Exception as e:
            logger.error(f"Ashby fetch failed for {self.organization_slug}: {e}")
            return []

    def _normalise(self, j: dict) -> RawJob:
        work_type = "remote" if j.get("isRemote") else "onsite"
        return RawJob(
            external_id=j.get("id", ""),
            title=j.get("title", ""),
            company_name=self.company_name,
            company_domain=self.company_domain,
            location=j.get("locationName"),
            work_type=work_type,
            experience_level=None,
            salary_min=None,
            salary_max=None,
            salary_currency="USD",
            apply_url=j.get("externalLink", ""),
            description=None,
            skills=[],
            posted_at=datetime.fromisoformat(j["publishedDate"])
            if j.get("publishedDate")
            else None,
            raw_data=j,
        )


# ─── New Source Adapters ────────────────────────────────────────────────────────

class JobSpyAdapter(JobSourceAdapter):
    """
    Uses the python-jobspy library to scrape LinkedIn, Indeed, Glassdoor, ZipRecruiter.
    No API keys required. Handles rate limiting and browser emulation internally.

    Each instance represents one search query (e.g. "software engineer intern").
    """
    source_name = "jobspy"

    def __init__(
        self,
        search_term: str,
        location: str = "India",
        site_names: Optional[List[str]] = None,
        results_wanted: int = 100,
    ):
        self.search_term = search_term
        self.location = location
        self.site_names = site_names or ["linkedin", "indeed", "glassdoor", "zip_recruiter"]
        self.results_wanted = results_wanted

    def fetch_jobs(self) -> List[RawJob]:
        try:
            from jobspy import scrape_jobs
            import pandas as pd

            df = scrape_jobs(
                site_name=self.site_names,
                search_term=self.search_term,
                location=self.location,
                results_wanted=self.results_wanted,
                hours_old=24 * 7,   # Only jobs posted within last 7 days
                country_indeed="India",
            )
            if df is None or df.empty:
                logger.info(f"[jobspy] No results for '{self.search_term}' in {self.location}")
                return []

            results = []
            for _, row in df.iterrows():
                try:
                    results.append(self._normalise(row))
                except Exception as e:
                    logger.debug(f"[jobspy] Row normalisation error: {e}")
            logger.info(f"[jobspy] '{self.search_term}' @ {self.location} → {len(results)} jobs")
            return results

        except ImportError:
            logger.error("[jobspy] python-jobspy not installed. Skipping.")
            return []
        except Exception as e:
            logger.error(f"[jobspy] fetch failed for '{self.search_term}': {e}")
            return []

    def _normalise(self, row) -> RawJob:
        import hashlib
        # Create stable external ID from job URL or title+company
        url = str(row.get("job_url", "") or "")
        raw_id_source = url or f"{row.get('title','')}-{row.get('company','')}-{row.get('location','')}"
        external_id = hashlib.md5(raw_id_source.encode()).hexdigest()

        title = str(row.get("title", "") or "")
        company = str(row.get("company", "") or "Unknown")

        loc = str(row.get("location", "") or "")
        job_type = str(row.get("job_type", "") or "").lower()
        is_remote = str(row.get("is_remote", "")).lower() in ("true", "1", "yes")

        if is_remote or "remote" in loc.lower() or "remote" in job_type:
            work_type = "remote"
        elif "hybrid" in loc.lower() or "hybrid" in job_type:
            work_type = "hybrid"
        else:
            work_type = "onsite"

        desc = str(row.get("description", "") or "")

        min_sal = None
        max_sal = None
        try:
            min_sal = float(row.get("min_amount", None) or 0) or None
            max_sal = float(row.get("max_amount", None) or 0) or None
        except (ValueError, TypeError):
            pass

        # Extract skills from description keywords
        from app.services.resume_parser import extract_keywords_from_text
        skills = extract_keywords_from_text(desc)[:20]  # cap at 20 for storage

        # Parse date
        posted_at = None
        date_val = row.get("date_posted")
        if date_val is not None:
            try:
                if hasattr(date_val, "to_pydatetime"):
                    posted_at = date_val.to_pydatetime()
                elif isinstance(date_val, str) and date_val:
                    posted_at = datetime.fromisoformat(date_val)
            except Exception:
                pass

        return RawJob(
            external_id=external_id,
            title=title,
            company_name=company,
            company_domain=None,
            location=loc,
            work_type=work_type,
            experience_level=None,
            salary_min=min_sal,
            salary_max=max_sal,
            salary_currency="INR" if "india" in self.location.lower() else "USD",
            apply_url=url,
            description=desc[:4000] if desc else None,  # cap description size
            skills=skills,
            posted_at=posted_at,
            raw_data=None,  # skip raw_data for space efficiency
        )


class RemoteOKAdapter(JobSourceAdapter):
    """
    Fetches jobs from RemoteOK's free public JSON API.
    No API key needed. Specialises in remote software/tech roles globally.
    Docs: https://remoteok.com/api
    """
    source_name = "remoteok"

    def fetch_jobs(self) -> List[RawJob]:
        import httpx
        url = "https://remoteok.com/api"
        headers = {"User-Agent": "JobBlitz/1.0 (job aggregator app; contact via github)"}
        try:
            response = httpx.get(url, timeout=30, headers=headers, follow_redirects=True)
            response.raise_for_status()
            data = response.json()
            # First item is metadata, skip it
            jobs = [j for j in data if isinstance(j, dict) and j.get("id")]
            results = []
            for j in jobs:
                try:
                    results.append(self._normalise(j))
                except Exception as e:
                    logger.debug(f"[remoteok] Row error: {e}")
            logger.info(f"[remoteok] fetched {len(results)} jobs")
            return results
        except Exception as e:
            logger.error(f"[remoteok] fetch failed: {e}")
            return []

    def _normalise(self, j: dict) -> RawJob:
        tags = j.get("tags", []) or []
        # Filter to software-related jobs only
        tech_tags = {"software", "engineering", "developer", "data", "ml", "ai", "backend",
                     "frontend", "fullstack", "devops", "python", "javascript", "react",
                     "node", "cloud", "mobile", "android", "ios", "intern"}
        tag_set = {t.lower() for t in tags}
        if not (tag_set & tech_tags):
            raise ValueError("Not a software role")

        posted_at = None
        try:
            epoch = j.get("epoch")
            if epoch:
                posted_at = datetime.fromtimestamp(int(epoch))
        except Exception:
            pass

        return RawJob(
            external_id=str(j.get("id", "")),
            title=j.get("position", ""),
            company_name=j.get("company", "Unknown"),
            company_domain=j.get("url", ""),
            location="Remote",
            work_type="remote",
            experience_level=None,
            salary_min=None,
            salary_max=None,
            salary_currency="USD",
            apply_url=j.get("apply_url") or j.get("url", ""),
            description=j.get("description", ""),
            skills=[t for t in tags if len(t) < 30],
            posted_at=posted_at,
            raw_data=None,
        )


class InternshalaAdapter(JobSourceAdapter):
    """
    Fetches internships from Internshala using their public search API.
    Focuses on software/CS/IT internships in India.
    """
    source_name = "internshala"

    CATEGORIES = [
        "computer-science",
        "web-development",
        "machine-learning",
        "data-science",
        "android-development",
        "python",
        "software-development",
    ]

    def fetch_jobs(self) -> List[RawJob]:
        import httpx
        results = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Referer": "https://internshala.com",
        }

        for category in self.CATEGORIES:
            try:
                # Internshala AJAX endpoint for searching internships
                url = f"https://internshala.com/internships/{category}-internship"
                # Use the JSON API endpoint
                api_url = "https://internshala.com/internships/matching-preferences"
                params = {
                    "search_title": category.replace("-", " "),
                    "category[]": category,
                    "work_from_home": "false",
                }
                resp = httpx.get(api_url, params=params, headers=headers, timeout=30, follow_redirects=True)
                if resp.status_code == 200:
                    try:
                        data = resp.json()
                        internships = data.get("internships_meta", {})
                        for k, v in (internships or {}).items():
                            try:
                                results.append(self._normalise(v))
                            except Exception:
                                pass
                    except Exception:
                        # Fallback: scrape the HTML
                        results.extend(self._scrape_html(resp.text, category))
                time.sleep(random.uniform(0.5, 1.5))  # polite delay
            except Exception as e:
                logger.debug(f"[internshala] Error for {category}: {e}")

        logger.info(f"[internshala] fetched {len(results)} internships")
        return results

    def _normalise(self, j: dict) -> RawJob:
        import hashlib
        title = j.get("profile_name") or j.get("title", "Internship")
        company = j.get("company_name") or "Unknown"
        location = j.get("location_names") or j.get("location") or "India"
        if isinstance(location, list):
            location = ", ".join(location)
        apply_url = f"https://internshala.com/internship/detail/{j.get('id', '')}"
        ext_id = hashlib.md5(apply_url.encode()).hexdigest()
        stipend = j.get("stipend", {}) or {}
        salary_str = stipend.get("salary") or ""
        return RawJob(
            external_id=ext_id,
            title=f"[Intern] {title}",
            company_name=company,
            company_domain=None,
            location=str(location),
            work_type="remote" if j.get("work_from_home") else "onsite",
            experience_level="entry",
            salary_min=None,
            salary_max=None,
            salary_currency="INR",
            apply_url=apply_url,
            description=j.get("profile") or j.get("about_company") or "",
            skills=[],
            posted_at=None,
            raw_data=None,
        )

    def _scrape_html(self, html: str, category: str) -> List[RawJob]:
        """Fallback HTML scraper using BeautifulSoup."""
        results = []
        try:
            from bs4 import BeautifulSoup
            import hashlib
            soup = BeautifulSoup(html, "lxml")
            cards = soup.select(".individual_internship")
            for card in cards[:30]:
                try:
                    title_el = card.select_one(".profile")
                    company_el = card.select_one(".company_name")
                    loc_el = card.select_one(".locations span")
                    link_el = card.select_one("a.view_detail_button")
                    if not title_el:
                        continue
                    title = title_el.get_text(strip=True)
                    company = company_el.get_text(strip=True) if company_el else "Unknown"
                    loc = loc_el.get_text(strip=True) if loc_el else "India"
                    href = link_el.get("href", "") if link_el else ""
                    apply_url = f"https://internshala.com{href}" if href else "https://internshala.com"
                    ext_id = hashlib.md5(apply_url.encode()).hexdigest()
                    results.append(RawJob(
                        external_id=ext_id,
                        title=f"[Intern] {title}",
                        company_name=company,
                        company_domain=None,
                        location=loc,
                        work_type="onsite",
                        experience_level="entry",
                        salary_min=None,
                        salary_max=None,
                        salary_currency="INR",
                        apply_url=apply_url,
                        description="",
                        skills=[],
                        posted_at=None,
                        raw_data=None,
                    ))
                except Exception:
                    pass
        except Exception as e:
            logger.debug(f"[internshala] HTML scrape error: {e}")
        return results


class WellfoundAdapter(JobSourceAdapter):
    """
    Fetches startup jobs and internships from Wellfound (formerly AngelList).
    Uses their public role listing endpoint.
    """
    source_name = "wellfound"

    ROLES = ["software-engineer", "machine-learning-engineer", "data-scientist",
             "backend-engineer", "frontend-engineer", "mobile-engineer"]

    def fetch_jobs(self) -> List[RawJob]:
        import httpx
        results = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
        }
        for role in self.ROLES:
            try:
                # Wellfound public API endpoint
                url = f"https://wellfound.com/role/{role}"
                resp = httpx.get(url, headers=headers, timeout=30, follow_redirects=True)
                if resp.status_code == 200:
                    try:
                        from bs4 import BeautifulSoup
                        import hashlib
                        soup = BeautifulSoup(resp.text, "lxml")
                        # Look for JSON data embedded in page
                        script_tags = soup.find_all("script", type="application/json")
                        for tag in script_tags:
                            try:
                                import json
                                data = json.loads(tag.string or "{}")
                                jobs_list = self._extract_jobs_from_json(data)
                                for j in jobs_list:
                                    try:
                                        results.append(j)
                                    except Exception:
                                        pass
                            except Exception:
                                pass
                    except Exception:
                        pass
                time.sleep(random.uniform(1.0, 2.0))
            except Exception as e:
                logger.debug(f"[wellfound] Error for {role}: {e}")

        logger.info(f"[wellfound] fetched {len(results)} jobs")
        return results

    def _extract_jobs_from_json(self, data: dict) -> List[RawJob]:
        """Recursively search for job listing data in page JSON."""
        import hashlib
        results = []
        # The data structure can be nested, search for common patterns
        def search(obj, depth=0):
            if depth > 10:
                return
            if isinstance(obj, dict):
                if "title" in obj and "company" in obj and "applyUrl" in obj:
                    try:
                        apply_url = obj.get("applyUrl") or obj.get("url", "")
                        ext_id = hashlib.md5(apply_url.encode()).hexdigest()
                        results.append(RawJob(
                            external_id=ext_id,
                            title=obj["title"],
                            company_name=obj["company"].get("name", "Unknown") if isinstance(obj["company"], dict) else str(obj["company"]),
                            company_domain=None,
                            location=obj.get("location", "Remote"),
                            work_type="remote" if obj.get("remote") else "onsite",
                            experience_level=None,
                            salary_min=None,
                            salary_max=None,
                            salary_currency="USD",
                            apply_url=apply_url,
                            description=obj.get("description", ""),
                            skills=[],
                            posted_at=None,
                            raw_data=None,
                        ))
                    except Exception:
                        pass
                for v in obj.values():
                    search(v, depth + 1)
            elif isinstance(obj, list):
                for item in obj[:50]:
                    search(item, depth + 1)
        search(data)
        return results
