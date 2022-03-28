export interface SnsTransformBody {
  identifier: string;
  pipelineId: string;
  syncPipelineId: string;
  schema: string;
  output: string;
  group: string;
  syncMethod: string;
  sns?: string;
  error?: string;
}

export interface SnsLoadBodyDocument {
  name: string;
  format: string;
  output: string;
  metadata?: any;
}

export interface SnsLoadBody {
  group: string;
  documents: SnsLoadBodyDocument[];
}

export interface SnsSubject {
  type: string;
  pipelineId: string;
}
