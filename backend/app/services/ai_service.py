"""
AI Service — wraps Gemini (default) or OpenAI for:
  - Cover letter generation
  - Resume-job match explanation
  - Skill gap analysis
"""
from __future__ import annotations
import logging
from app.core.config import settings
from app.models.models import User, Job

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self):
        self.provider = settings.AI_PROVIDER

    def generate_cover_letter(self, user: User, job: Job, tone: str = "professional") -> str:
        prompt = self._build_cover_letter_prompt(user, job, tone)
        try:
            if self.provider == "gemini":
                return self._call_gemini(prompt)
            return self._call_openai(prompt)
        except Exception as e:
            logger.error(f"AI cover letter generation failed: {e}")
            return self._fallback_cover_letter(user, job)

    def explain_match(self, user: User, job: Job, breakdown: dict) -> str:
        """Return a human-readable explanation of the match score."""
        prompt = (
            f"Explain in 2-3 sentences why this candidate is a {round(sum(breakdown.values())/len(breakdown)*100)}% match for the role.\n"
            f"Candidate: {user.full_name}, {user.title}, {user.experience_years} years exp, skills: {[s.name for s in user.skills]}\n"
            f"Job: {job.title} at {job.company.name}, requires: {[s.name for s in job.skills]}\n"
            f"Breakdown: {breakdown}"
        )
        try:
            if self.provider == "gemini":
                return self._call_gemini(prompt)
            return self._call_openai(prompt)
        except Exception as e:
            logger.error(f"AI match explanation failed: {e}")
            return "Match score based on your profile vs. job requirements."

    # ──────────────────────────────────────────────────────────────────────────
    # Private helpers
    # ──────────────────────────────────────────────────────────────────────────

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
        import google.generativeai as genai  # type: ignore
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text.strip()

    def _call_openai(self, prompt: str) -> str:
        from openai import OpenAI  # type: ignore
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()

    def _fallback_cover_letter(self, user: User, job: Job) -> str:
        return (
            f"Dear Hiring Team,\n\n"
            f"I am excited to apply for the {job.title} role at {job.company.name}. "
            f"With {user.experience_years or 'several'} years of experience as a {user.title or 'professional'}, "
            f"I am confident I can make a significant contribution to your team.\n\n"
            f"I look forward to discussing how my background aligns with your needs.\n\n"
            f"Sincerely,\n{user.full_name or 'Applicant'}"
        )
