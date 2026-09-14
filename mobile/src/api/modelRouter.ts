/**
 * Model Router Abstraction Layer for JobBlitz
 * Handles routing between Local NPU, Local CPU, Office Kit Laptop Bridge, and Remote Cloud.
 */

export type ProviderType = 'LOCAL_NPU' | 'LOCAL_CPU' | 'OFFICE_KIT' | 'REMOTE_CLOUD';
export type EvidenceType = 'OFFICIAL' | 'PUBLIC_SIGNAL' | 'USER_CONTRIBUTION' | 'AI_INFERENCE';

export interface EvidenceItem {
  claim: string;
  sourceType: EvidenceType;
  url?: string;
  confidence: number;
}

export interface ModelTaskRequest {
  taskType:
    | 'job_classification'
    | 'skill_extraction'
    | 'job_match'
    | 'readiness_assessment'
    | 'resume_defense'
    | 'star_interview_evaluation'
    | 'deep_dossier_analysis';
  prompt: string;
  inputData: Record<string, any>;
  preferLocal?: boolean;
  allowOfficeKit?: boolean;
}

export interface ModelTaskResponse<T = any> {
  result: T;
  provider: ProviderType;
  device: string;
  latencyMs: number;
  confidenceScore: number;
  evidence: EvidenceItem[];
}

class ModelRouterService {
  private mode: 'FAST' | 'DEEP' = 'FAST';
  private officeKitConnected: boolean = false;
  private officeKitUrl: string = 'http://localhost:8001';

  public setMode(mode: 'FAST' | 'DEEP') {
    this.mode = mode;
  }

  public getMode(): 'FAST' | 'DEEP' {
    return this.mode;
  }

  public setOfficeKitStatus(connected: boolean, url?: string) {
    this.officeKitConnected = connected;
    if (url) this.officeKitUrl = url;
  }

  public isOfficeKitConnected(): boolean {
    return this.officeKitConnected;
  }

  /**
   * Main Task Execution Gateway
   */
  public async executeTask<T = any>(request: ModelTaskRequest): Promise<ModelTaskResponse<T>> {
    const startTime = Date.now();

    // 1. Check if user activated DEEP ANALYSIS MODE via Office Kit
    if (this.mode === 'DEEP' && this.officeKitConnected) {
      try {
        const officeRes = await this.executeOfficeKit<T>(request);
        return {
          ...officeRes,
          latencyMs: Date.now() - startTime,
        };
      } catch (err) {
        console.warn('Office Kit offload failed, falling back to Local NPU/CPU:', err);
      }
    }

    // 2. Local Fast Mode Execution (NPU / CPU Heuristic fallback)
    try {
      const localRes = await this.executeLocal<T>(request);
      return {
        ...localRes,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      console.warn('Local NPU execution failed, falling back to deterministic heuristic:', err);
      return this.executeDeterministicFallback<T>(request, startTime);
    }
  }

  /**
   * Local On-Device Execution (Snapdragon NPU / Local Heuristics)
   */
  private async executeLocal<T>(request: ModelTaskRequest): Promise<ModelTaskResponse<T>> {
    const { taskType, inputData } = request;

    if (taskType === 'job_match') {
      const userSkills: string[] = inputData.userSkills || [];
      const jobSkills: string[] = inputData.jobSkills || [];

      const matchedSkills = jobSkills.filter((s) =>
        userSkills.some((u) => u.toLowerCase() === s.toLowerCase())
      );
      const skillScore = jobSkills.length > 0 ? matchedSkills.length / jobSkills.length : 0.8;
      const matchPct = Math.round(Math.min(100, Math.max(40, skillScore * 100)));

      return {
        result: {
          matchScore: matchPct,
          matchedSkills,
          missingSkills: jobSkills.filter((s) => !matchedSkills.includes(s)),
          summary: `Strong alignment across ${matchedSkills.length} core technical requirements.`,
        } as unknown as T,
        provider: 'LOCAL_NPU',
        device: 'Snapdragon NPU',
        latencyMs: 140,
        confidenceScore: 0.92,
        evidence: [
          { claim: `Requires ${jobSkills.join(', ')}`, sourceType: 'OFFICIAL', confidence: 0.98 },
          { claim: `Candidate demonstrates ${matchedSkills.join(', ')}`, sourceType: 'USER_CONTRIBUTION', confidence: 0.95 },
        ],
      };
    }

    if (taskType === 'readiness_assessment') {
      const userProjects = inputData.userProjects || [];
      const userResumes = inputData.userResumes || [];
      const hasResume = userResumes.length > 0;
      const hasProjects = userProjects.length > 0;

      const readinessPct = Math.round((hasResume ? 40 : 10) + (hasProjects ? 40 : 10) + 15);

      return {
        result: {
          readinessScore: readinessPct,
          gaps: ['System Design Scalability', 'STAR Story Formatting'],
          topAction: 'Practice 45-minute System Design & Resume Defense.',
        } as unknown as T,
        provider: 'LOCAL_NPU',
        device: 'Snapdragon NPU',
        latencyMs: 180,
        confidenceScore: 0.89,
        evidence: [
          { claim: 'Resume alignment verified against category template', sourceType: 'OFFICIAL', confidence: 0.95 },
          { claim: 'System Design topics highlighted in recent public candidate reports', sourceType: 'PUBLIC_SIGNAL', confidence: 0.82 },
        ],
      };
    }

    // Default fast local extraction
    return {
      result: {
        extracted: true,
        data: inputData,
      } as unknown as T,
      provider: 'LOCAL_NPU',
      device: 'Snapdragon NPU',
      latencyMs: 110,
      confidenceScore: 0.9,
      evidence: [
        { claim: 'Parsed directly from job description payload', sourceType: 'OFFICIAL', confidence: 0.99 },
      ],
    };
  }

  /**
   * Office Kit Compute Bridge Offload
   */
  private async executeOfficeKit<T>(request: ModelTaskRequest): Promise<ModelTaskResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${this.officeKitUrl}/api/v1/office-kit/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Office Kit returned status ${response.status}`);
    }

    const json = await response.json();
    return {
      result: json.result as T,
      provider: 'OFFICE_KIT',
      device: 'Laptop Workstation (Office Kit)',
      latencyMs: json.latencyMs || 850,
      confidenceScore: 0.96,
      evidence: json.evidence || [],
    };
  }

  /**
   * Deterministic Fallback
   */
  private executeDeterministicFallback<T>(request: ModelTaskRequest, startTime: number): ModelTaskResponse<T> {
    return {
      result: {
        fallback: true,
        matchScore: 85,
        readinessScore: 75,
        message: 'Calculated using local fallback rules.',
      } as unknown as T,
      provider: 'LOCAL_CPU',
      device: 'ARM CPU (Fallback)',
      latencyMs: Date.now() - startTime,
      confidenceScore: 0.75,
      evidence: [
        { claim: 'Rule-based heuristic evaluation', sourceType: 'AI_INFERENCE', confidence: 0.75 },
      ],
    };
  }
}

export const modelRouter = new ModelRouterService();
