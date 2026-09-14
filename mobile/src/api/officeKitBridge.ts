/**
 * Office Kit Compute Bridge for JobBlitz
 * Manages high-speed local laptop connection, deep analysis offloading, and mode switching.
 */

import { modelRouter } from './modelRouter';

export interface OfficeKitStatus {
  isConnected: boolean;
  laptopName?: string;
  ipAddress?: string;
  port: number;
  mode: 'FAST' | 'DEEP';
  activeTasks: number;
}

class OfficeKitBridgeService {
  private status: OfficeKitStatus = {
    isConnected: false,
    laptopName: 'Developer Workstation',
    port: 8001,
    mode: 'FAST',
    activeTasks: 0,
  };

  constructor() {
    this.checkConnection();
  }

  public getStatus(): OfficeKitStatus {
    return { ...this.status };
  }

  public toggleMode(): 'FAST' | 'DEEP' {
    const nextMode = this.status.mode === 'FAST' ? 'DEEP' : 'FAST';
    this.status.mode = nextMode;
    modelRouter.setMode(nextMode);
    return nextMode;
  }

  public async checkConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      // Probe local Office Kit server on laptop
      const res = await fetch('http://localhost:8001/health', {
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        this.status.isConnected = true;
        modelRouter.setOfficeKitStatus(true, 'http://localhost:8001');
        return true;
      }
    } catch {
      // Offline / disconnected
    }

    this.status.isConnected = false;
    modelRouter.setOfficeKitStatus(false);
    return false;
  }

  public async offloadDeepAnalysis(jobId: string, dossierPayload: Record<string, any>) {
    this.status.activeTasks += 1;
    try {
      const result = await modelRouter.executeTask({
        taskType: 'deep_dossier_analysis',
        prompt: `Synthesize 20-page company dossier and multi-source signals for job ${jobId}`,
        inputData: { jobId, ...dossierPayload },
        preferLocal: false,
        allowOfficeKit: true,
      });
      return result;
    } finally {
      this.status.activeTasks = Math.max(0, this.status.activeTasks - 1);
    }
  }
}

export const officeKitBridge = new OfficeKitBridgeService();
