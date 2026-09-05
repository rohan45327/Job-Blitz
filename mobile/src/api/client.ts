import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web') {
    const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
    return `http://${host}:8000/api/v1`;
  }

  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.developer?.tool;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8000/api/v1`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }

  return 'http://localhost:8000/api/v1';
};

// ─── Types ────────────────────────────────────────────────────────────────────


export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserOut {
  id: string;
  email: string;
  full_name: string | null;
  title: string | null;
  bio: string | null;
  location: string | null;
  experience_years: number | null;
  experience_level: string | null;
  preferred_work_type: string | null;
  salary_expectation_min: number | null;
  salary_expectation_max: number | null;
  preferred_locations: string[] | null;
  open_to_relocation: boolean;
  resume_url: string | null;
  skills: { id: number; name: string }[];
  created_at: string;
}

export interface SkillOut {
  id: number;
  name: string;
}

export interface CompanyOut {
  id: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  careers_url: string | null;
  is_top_company: boolean;
}

export interface JobOut {
  id: string;
  title: string;
  company: CompanyOut;
  location: string | null;
  work_type: string | null;
  experience_level: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  apply_url: string;
  source: string;
  skills: SkillOut[];
  posted_at: string | null;
  is_active: boolean;
}

export interface JobDetailOut extends JobOut {
  description: string | null;
}

export interface ResumeOut {
  id: string;
  category: string;
  title: string;
  content_text: string | null;
  defining_keywords: string[];
  created_at: string;
}

export interface OpportunityScoreOut {
  overall_score: number;
  skill_match_pct: number;
  experience_fit_pct: number;
  role_relevance_pct: number;
  matched_skills: string[];
  missing_skills: string[];
  competition_level: string;
}

export interface JobIntelligenceOut {
  job_id: string;
  opportunity_score: OpportunityScoreOut;
  company_intelligence?: CompanyIntelligenceOut | null;
  readiness_summary?: ReadinessOut | null;
  key_responsibilities: string[];
  recommended_actions: string[];
}

export interface MatchedJobOut {
  job: JobOut;
  match_score: number;
  match_breakdown: Record<string, number>;
  readiness_score?: number;
  readiness_breakdown?: Record<string, number>;
  freshness?: string;
  hiring_signal?: string;
  matched_resume_id: string | null;
  matched_resume_category: string | null;
  is_high_match: boolean;
  opportunity_score?: OpportunityScoreOut | null;
}

export interface ReadinessOut {
  job_id: string;
  overall_readiness: number;
  breakdown: Record<string, number>;
  top_improvements: string[];
}

export interface CompanyIntelligenceOut {
  company_name: string;
  hiring_funnel: string[];
  what_team_values: string[];
  common_interview_topics: string[];
  tech_stack: string[];
  recent_news: string[];
  salary_range: string | null;
  public_sentiment: string;
  provenance: string;
}

export interface CandidateBenchmarkOut {
  role_title: string;
  user_skill_coverage: number;
  benchmark_skill_coverage: number;
  user_project_count: number;
  benchmark_project_count: number;
  top_candidate_skills: string[];
  data_label: string;
}

export interface PreparationPlanOut {
  job_id: string;
  overall_readiness: number;
  days_plan: { day: number; title: string; tasks: string[] }[];
  top_improvements: string[];
}

export interface ResumeVulnerability {
  area: string;
  vulnerability: string;
  mitigation: string;
}

export interface ResumeDefenseResponse {
  job_id: string;
  project_title: string | null;
  recommended_resume_category?: string | null;
  potential_questions: { question: string; focus: string; suggested_defense: string }[];
  vulnerabilities?: ResumeVulnerability[];
}

export interface ResumeRecommendResponse {
  job_id: string;
  recommended_category: string;
  matching_score: number;
  reasoning: string;
  available_categories: string[];
}

export interface STARStoryReviewResponse {
  star_score: number;
  strengths: string[];
  improvements: string[];
  suggested_rewrite?: string | null;
}

export interface ProjectEvidenceRecord {
  project_id: string;
  project_title: string;
  strength: 'strong' | 'moderate' | 'weak';
  matched_requirements: string[];
  matched_skills: string[];
  talking_points: string[];
}

export interface UnmappedRequirement {
  requirement: string;
  suggestion: string;
}

export interface EvidenceMapResponse {
  job_id: string;
  role_title: string;
  coverage_percentage: number;
  mapped_projects: ProjectEvidenceRecord[];
  unmapped_requirements: UnmappedRequirement[];
  key_takeaway: string;
}

export interface CompanyBriefOut {
  company_name: string;
  role_title: string;
  summary_5min: string;
  why_role_exists: string;
  recent_developments: string[];
  tech_signals: string[];
  questions_to_ask_interviewer: string[];
  provenance: string;
}

export interface ProjectOut {
  id: string;
  title: string;
  description: string | null;
  skills: string[];
  github_url: string | null;
  live_url: string | null;
  architecture_notes: string | null;
  tradeoffs: string | null;
  key_metrics: string | null;
  created_at: string;
}

export interface OutcomeAnalyticsOut {
  total_saved: number;
  total_applied: number;
  total_oa: number;
  total_interviews: number;
  total_offers: number;
  total_rejections: number;
  response_rate_percent: number;
  interview_rate_percent: number;
}

export interface ResumeUploadResponse {
  resume: ResumeOut;
  extracted_keywords: string[];
  text_length: number;
}

export interface JobFeedResponse {
  items: MatchedJobOut[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApplicationOut {
  id: string;
  job: JobOut;
  status: string;
  cover_letter: string | null;
  notes: string | null;
  applied_at: string | null;
  match_score: number | null;
  match_breakdown: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

// ─── Client ───────────────────────────────────────────────────────────────────

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    let url = `${getBaseUrl()}${path}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) searchParams.append(k, String(v));
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(error.detail || `HTTP ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  // ── Auth ────────────────────────────────────────────────────────────────────

  register(email: string, password: string, full_name?: string) {
    return this.request<TokenResponse>('POST', '/auth/register', { email, password, full_name });
  }

  login(email: string, password: string) {
    return this.request<TokenResponse>('POST', '/auth/login', { email, password });
  }

  refreshToken(refresh_token: string) {
    return this.request<TokenResponse>('POST', '/auth/refresh', { refresh_token });
  }

  // ── Users ───────────────────────────────────────────────────────────────────

  getMe() {
    return this.request<UserOut>('GET', '/users/me');
  }

  updateMe(data: Partial<UserOut> & { skill_ids?: number[] }) {
    return this.request<UserOut>('PATCH', '/users/me', data);
  }

  deleteMe() {
    return this.request<void>('DELETE', '/users/me');
  }

  // ── Jobs ────────────────────────────────────────────────────────────────────

  getJobFeed(params?: {
    work_type?: string;
    work_types?: string[];
    experience_level?: string;
    salary_min?: number;
    location?: string;
    companies?: string[];
    page?: number;
    page_size?: number;
  }) {
    const { companies, work_types, ...rest } = params ?? {};
    let url = `${getBaseUrl()}/jobs/feed`;
    const sp = new URLSearchParams();
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined) sp.append(k, String(v));
    });
    if (companies && companies.length > 0) {
      companies.forEach((c) => sp.append('companies', c));
    }
    if (work_types && work_types.length > 0) {
      work_types.forEach((wt) => sp.append('work_types', wt));
    }
    const qs = sp.toString();
    if (qs) url += `?${qs}`;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return fetch(url, { method: 'GET', headers })
      .then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(new Error(e.detail || `HTTP ${r.status}`)));
        return r.json() as Promise<JobFeedResponse>;
      });
  }

  getJobDetail(jobId: string) {
    return this.request<JobDetailOut>('GET', `/jobs/${jobId}`);
  }

  getJobIntelligence(jobId: string) {
    return this.request<JobIntelligenceOut>('GET', `/jobs/${jobId}/intelligence`);
  }

  // ── Applications ────────────────────────────────────────────────────────────

  getApplications() {
    return this.request<ApplicationOut[]>('GET', '/applications/');
  }

  createApplication(job_id: string, cover_letter?: string, notes?: string) {
    return this.request<ApplicationOut>('POST', '/applications/', { job_id, cover_letter, notes });
  }

  updateApplicationStatus(applicationId: string, status: string, notes?: string) {
    return this.request<ApplicationOut>(
      'PATCH',
      `/applications/${applicationId}/status`,
      { status, notes },
    );
  }

  deleteApplication(applicationId: string) {
    return this.request<void>('DELETE', `/applications/${applicationId}`);
  }

  // ── Watchlist ───────────────────────────────────────────────────────────────

  getWatchlist() {
    return this.request<any[]>('GET', '/watchlist/');
  }

  addToWatchlist(company_id: string) {
    return this.request<any>('POST', '/watchlist/', { company_id });
  }

  removeFromWatchlist(company_id: string) {
    return this.request<void>('DELETE', `/watchlist/${company_id}`);
  }

  // ── Push ────────────────────────────────────────────────────────────────────

  registerPushToken(token: string, platform: string) {
    return this.request<any>('POST', '/push/register', { token, platform });
  }

  // ── Resumes ─────────────────────────────────────────────────────────────────

  getResumes() {
    return this.request<ResumeOut[]>('GET', '/resumes/');
  }

  createResume(category: string, title: string, content_text?: string, defining_keywords: string[] = []) {
    return this.request<ResumeOut>('POST', '/resumes/', { category, title, content_text, defining_keywords });
  }

  async uploadResume(
    file: { uri: string; name: string; type: string },
    category: string,
    title: string,
    extra_keywords: string = ''
  ): Promise<ResumeUploadResponse> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type || 'application/pdf',
    } as any);
    formData.append('category', category);
    formData.append('title', title);
    formData.append('extra_keywords', extra_keywords);

    let url = `${getBaseUrl()}/resumes/upload`;
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(error.detail || `HTTP ${res.status}`);
    }

    return res.json();
  }

  deleteResume(resumeId: string) {
    return this.request<void>('DELETE', `/resumes/${resumeId}`);
  }

  getRecommendedResume(jobId: string) {
    return this.request<ResumeRecommendResponse>('GET', `/resumes/recommend/${jobId}`);
  }

  // ── AI ──────────────────────────────────────────────────────────────────────

  generateCoverLetter(job_id: string, tone?: string) {
    return this.request<{ cover_letter: string; job_id: string }>(
      'POST', '/ai/cover-letter', { job_id, tone }
    );
  }

  // ── Readiness & Intelligence ──────────────────────────────────────────────

  getJobReadiness(job_id: string) {
    return this.request<ReadinessOut>('GET', `/readiness/jobs/${job_id}`);
  }

  getCompanyIntelligence(job_id: string) {
    return this.request<CompanyIntelligenceOut>('GET', `/readiness/jobs/${job_id}/company-intelligence`);
  }

  getCandidateBenchmark(job_id: string) {
    return this.request<CandidateBenchmarkOut>('GET', `/readiness/jobs/${job_id}/candidate-benchmark`);
  }

  // ── Prep Hub ──────────────────────────────────────────────────────────────

  getPrepPlan(job_id: string) {
    return this.request<PreparationPlanOut>('GET', `/prep/plan/${job_id}`);
  }

  getResumeDefense(job_id: string, project_id?: string) {
    return this.request<ResumeDefenseResponse>('POST', '/prep/resume-defense', { job_id, project_id });
  }

  getCompanyBrief(job_id: string) {
    return this.request<CompanyBriefOut>('GET', `/prep/company-brief/${job_id}`);
  }

  reviewSTARStory(payload: { job_id: string; title: string; situation: string; task: string; action: string; result: string }) {
    return this.request<STARStoryReviewResponse>('POST', '/prep/star-story/review', payload);
  }

  getEvidenceMap(job_id: string) {
    return this.request<EvidenceMapResponse>('GET', `/prep/evidence-map/${job_id}`);
  }

  // ── Projects ──────────────────────────────────────────────────────────────

  getUserProjects() {
    return this.request<ProjectOut[]>('GET', '/projects');
  }

  createProject(payload: {
    title: string;
    description?: string;
    skills?: string[];
    github_url?: string;
    live_url?: string;
    architecture_notes?: string;
    tradeoffs?: string;
    key_metrics?: string;
  }) {
    return this.request<ProjectOut>('POST', '/projects', payload);
  }

  deleteProject(project_id: string) {
    return this.request<void>('DELETE', `/projects/${project_id}`);
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  getOutcomeAnalytics() {
    return this.request<OutcomeAnalyticsOut>('GET', '/analytics/funnel');
  }
}

export const api = new ApiClient();
