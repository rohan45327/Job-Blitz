"""
AI Service — wraps Gemini (default) or OpenAI for:
  - Cover letter generation
  - Resume-job match explanation
  - Skill gap analysis

All calls are guarded with timeouts and fallbacks so that an LLM failure
never produces an unhandled 500 error on the API layer.
"""
from __future__ import annotations
import logging
import time
from typing import Optional
from app.core.config import settings
from app.models.models import User, Job

logger = logging.getLogger(__name__)

# Maximum seconds to wait for an LLM response before falling back
_LLM_TIMEOUT_SECONDS = 20


class AIService:
    def __init__(self):
        self.provider = settings.AI_PROVIDER

    # ──────────────────────────────────────────────────────────────────────────
    # Public methods
    # ──────────────────────────────────────────────────────────────────────────

    def generate_cover_letter(self, user: User, job: Job, tone: str = "professional") -> str:
        prompt = self._build_cover_letter_prompt(user, job, tone)
        result = self._safe_llm_call(prompt)
        if result:
            return result
        return self._fallback_cover_letter(user, job)

    def explain_match(self, user: User, job: Job, breakdown: dict) -> str:
        """Return a human-readable explanation of the match score."""
        avg_score = sum(breakdown.values()) / max(len(breakdown), 1)
        prompt = (
            f"Explain in 2-3 sentences why this candidate is a {round(avg_score * 100)}% match for the role.\n"
            f"Candidate: {user.full_name}, {user.title}, {user.experience_years} years exp, "
            f"skills: {[s.name for s in user.skills]}\n"
            f"Job: {job.title} at {job.company.name}, requires: {[s.name for s in job.skills]}\n"
            f"Breakdown: {breakdown}"
        )
        result = self._safe_llm_call(prompt)
        if result:
            return result
        return "Match score based on your profile vs. job requirements."

    # ──────────────────────────────────────────────────────────────────────────
    # Private helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _safe_llm_call(self, prompt: str, retries: int = 1) -> Optional[str]:
        """
        Call the configured LLM with a hard timeout.
        Retries once on transient error. Returns None on failure so callers
        can use their own fallback instead of crashing.
        """
        for attempt in range(retries + 1):
            try:
                if self.provider == "gemini":
                    return self._call_gemini(prompt)
                return self._call_openai(prompt)
            except Exception as e:
                logger.warning(f"LLM call attempt {attempt + 1} failed: {e}")
                if attempt < retries:
                    time.sleep(1)  # brief pause before retry
        logger.error("All LLM call attempts exhausted; using fallback.")
        return None

    def _build_cover_letter_prompt(self, user: User, job: Job, tone: str) -> str:
        skills_str = ", ".join(s.name for s in user.skills) if user.skills else "various skills"
        return (
            f"Write a {tone} cover letter for the following:\n\n"
            f"Applicant: {user.full_name or 'the applicant'}\n"
            f"Current Title: {user.title or 'Software Engineer'}\n"
            f"Experience: {user.experience_years or 'several'} years\n"
            f"Skills: {skills_str}\n"
            f"Bio: {user.bio or ''}\n\n"
            f"Job Title: {job.title}\n"
            f"Company: {job.company.name}\n"
            f"Job Description Excerpt: {(job.description or '')[:600]}\n\n"
            "Write a concise, compelling cover letter (3 paragraphs). "
            "Do NOT include a date or address header. Start directly with 'Dear Hiring Team,'."
        )

    def _call_gemini(self, prompt: str) -> str:
        import signal

        def _timeout_handler(signum, frame):
            raise TimeoutError("Gemini call timed out")

        import google.generativeai as genai  # type: ignore
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        # Use a threading approach for timeout since signal doesn't work in threads
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(model.generate_content, prompt)
            try:
                response = future.result(timeout=_LLM_TIMEOUT_SECONDS)
                return response.text.strip()
            except concurrent.futures.TimeoutError:
                logger.warning("Gemini API call timed out after %ss", _LLM_TIMEOUT_SECONDS)
                raise TimeoutError("Gemini call timed out")

    def _call_openai(self, prompt: str) -> str:
        import concurrent.futures
        from openai import OpenAI  # type: ignore

        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        def _do_call():
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
            )
            return response.choices[0].message.content.strip()

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_do_call)
            try:
                return future.result(timeout=_LLM_TIMEOUT_SECONDS)
            except concurrent.futures.TimeoutError:
                logger.warning("OpenAI API call timed out after %ss", _LLM_TIMEOUT_SECONDS)
                raise TimeoutError("OpenAI call timed out")

    def _fallback_cover_letter(self, user: User, job: Job) -> str:
        return (
            f"Dear Hiring Team,\n\n"
            f"I am excited to apply for the {job.title} role at {job.company.name}. "
            f"With {user.experience_years or 'several'} years of experience as a "
            f"{user.title or 'software professional'}, I am confident I can make a "
            f"significant contribution to your team.\n\n"
            f"My background in {', '.join(s.name for s in (user.skills or [])[:3]) or 'software development'} "
            f"aligns well with the requirements of this role, and I am eager to bring my "
            f"skills to your organization.\n\n"
            f"I look forward to discussing how my background aligns with your needs.\n\n"
            f"Sincerely,\n{user.full_name or 'Applicant'}"
        )
