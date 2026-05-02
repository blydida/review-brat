import type { Session, SessionMode, Upload, ClarificationTurn } from './session';
import type { DesignSystemConfig } from './design-system';

export interface CreateSessionRequest {
  mode: SessionMode;
}

export interface CreateSessionResponse {
  sessionId: string;
}

export interface UploadResponse {
  uploads: Upload[];
}

export interface DesignSystemRequest {
  sessionId: string;
  config: DesignSystemConfig;
}

export interface ClarifyRequest {
  sessionId: string;
  answers: string[];
}

export interface AnalyzeRequest {
  sessionId: string;
  goal?: string;
}

export interface ReviewRequest {
  sessionId: string;
}

export type ApiError = {
  error: string;
};
